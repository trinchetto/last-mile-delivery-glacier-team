"""
FastAPI server for DeliveryIQ - Last-Mile Delivery Assistant.

Run with: uvicorn server:app --reload --port 2024
"""

import os
import json
import uuid
from typing import Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Store the original API key from environment
ORIGINAL_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Import the graph builder and compile with checkpointer
from graph import build_delivery_graph
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command, Interrupt


def make_serializable(obj: Any, exclude_keys: set = None) -> Any:
    """Convert non-JSON-serializable objects to serializable format.

    Args:
        obj: Object to serialize
        exclude_keys: Set of keys to exclude (e.g., large base64 images)
    """
    if exclude_keys is None:
        exclude_keys = {'floor_plan_image'}  # Exclude large base64 images by default

    if isinstance(obj, Interrupt):
        return {"__interrupt__": True, "value": make_serializable(obj.value, exclude_keys) if hasattr(obj, 'value') else None}
    elif isinstance(obj, dict):
        return {k: make_serializable(v, exclude_keys) for k, v in obj.items() if k not in exclude_keys}
    elif isinstance(obj, list):
        return [make_serializable(item, exclude_keys) for item in obj]
    elif isinstance(obj, tuple):
        return [make_serializable(item, exclude_keys) for item in obj]
    elif hasattr(obj, '__dict__'):
        # Handle arbitrary objects by converting to dict
        try:
            return {k: make_serializable(v, exclude_keys) for k, v in obj.__dict__.items() if not k.startswith('_') and k not in exclude_keys}
        except:
            return str(obj)
    else:
        try:
            json.dumps(obj)
            return obj
        except (TypeError, ValueError):
            return str(obj)

# In-memory checkpointer for thread persistence
checkpointer = MemorySaver()

# Compile graph with checkpointer for persistence
compiled_graph = build_delivery_graph().compile(checkpointer=checkpointer)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("Starting FastAPI server with streaming support...")
    yield
    print("Shutting down...")


app = FastAPI(title="DeliveryIQ API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    assistant_id: str = "recommendation"
    input: Optional[dict] = None
    command: Optional[dict] = None
    stream_mode: Optional[str | list] = "messages"
    if_not_exists: Optional[str] = "create"
    config: Optional[dict] = None


class ThreadCreate(BaseModel):
    thread_id: Optional[str] = None


def set_api_key_from_header(api_key: str | None) -> str | None:
    """
    Temporarily set the API key from request header.
    Returns the previous API key so it can be restored.
    """
    previous_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        os.environ["ANTHROPIC_API_KEY"] = api_key
        print(f"[Server] Using API key from request header (ends with ...{api_key[-4:]})")
    return previous_key


def restore_api_key(previous_key: str | None):
    """Restore the original API key."""
    if previous_key:
        os.environ["ANTHROPIC_API_KEY"] = previous_key
    elif ORIGINAL_API_KEY:
        os.environ["ANTHROPIC_API_KEY"] = ORIGINAL_API_KEY


@app.post("/threads/{thread_id}/runs/stream")
async def stream_run(thread_id: str, request: RunRequest, raw_request: Request):
    """
    Stream a graph run with SSE events.
    Supports both initial runs (with input) and resume (with command).
    Accepts optional X-API-Key header for runtime API key configuration.
    """
    # Extract API key from header if provided
    api_key_from_header = raw_request.headers.get("X-API-Key")
    model_from_header = raw_request.headers.get("X-Model")
    
    # Set API key from header if provided
    previous_api_key = set_api_key_from_header(api_key_from_header)

    async def event_generator():
        # Build config with model from request body or header
        configurable = {"thread_id": thread_id}
        
        # Get model from request config or header
        if request.config and request.config.get("configurable", {}).get("model"):
            configurable["model"] = request.config["configurable"]["model"]
            print(f"[Server] Using model from request: {configurable['model']}")
        elif model_from_header:
            configurable["model"] = model_from_header
            print(f"[Server] Using model from header: {model_from_header}")
        
        config = {"configurable": configurable}

        try:
            # Determine if this is a new run or a resume
            if request.input:
                # New run - start the recommendation pipeline
                input_data = request.input
                # Log without the full image data
                log_data = {k: (f"<image:{len(v)} chars>" if k == 'floor_plan_image' and v else v)
                           for k, v in input_data.items()}
                print(f"[Server] ========== NEW RUN ==========")
                print(f"[Server] Thread: {thread_id}")
                print(f"[Server] Input: {log_data}")

                # For initial run, we need to handle streaming differently
                # The graph will run: START -> chat -> human_input (interrupt)
                # We'll stream events and also track the final response

                event_count = 0
                current_run_id = None
                streamed_content = ""
                current_node = None  # Track which node is executing

                async for event in compiled_graph.astream_events(
                    input_data,
                    config=config,
                    version="v2",
                ):
                    event_count += 1
                    event_type = event.get("event", "")

                    # Track which node is currently executing
                    if event_type == "on_chain_start":
                        name = event.get("name", "")
                        if name in ("chat", "analytical", "human_input"):
                            current_node = name
                            print(f"[Server] Entered node: {current_node}")

                            # Notify frontend when analytical agent starts working
                            if name == "analytical":
                                yield f"event: agent_status\ndata: {json.dumps({'agent': 'analytical', 'status': 'working'})}\n\n"

                    # Notify frontend when analytical agent finishes
                    if event_type == "on_chain_end":
                        name = event.get("name", "")
                        if name == "analytical":
                            yield f"event: agent_status\ndata: {json.dumps({'agent': 'analytical', 'status': 'done'})}\n\n"

                    # Track the run_id for message identification
                    if event_type == "on_chat_model_start":
                        current_run_id = event.get("run_id", f"run-{thread_id}")

                    # Stream LLM tokens - ONLY from chat node
                    if event_type == "on_chat_model_stream" and current_node == "chat":
                        chunk = event.get("data", {}).get("chunk")
                        if chunk and hasattr(chunk, "content"):
                            content = chunk.content
                            if content:
                                if isinstance(content, list):
                                    text_content = "".join(
                                        item.get("text", "") if isinstance(item, dict) else str(item)
                                        for item in content
                                    )
                                else:
                                    text_content = content

                                if text_content:
                                    streamed_content += text_content
                                    msg_event = {
                                        "type": "AIMessageChunk",
                                        "content": text_content,
                                        "id": current_run_id or event.get("run_id", "default")
                                    }
                                    yield f"event: messages/partial\ndata: {json.dumps([msg_event])}\n\n"

                    # Capture tool calls - ONLY from chat node (not analytical agent's tools)
                    elif event_type == "on_chat_model_end" and current_node == "chat":
                        output = event.get("data", {}).get("output")
                        if output and hasattr(output, "tool_calls") and output.tool_calls:
                            for tool_call in output.tool_calls:
                                tool_event = {
                                    "type": "AIMessageChunk",
                                    "content": [{"type": "tool_use", "name": tool_call.get("name", "unknown")}],
                                    "id": current_run_id or event.get("run_id", "default")
                                }
                                yield f"event: messages/partial\ndata: {json.dumps([tool_event])}\n\n"

                    # Capture visualization data from tool results
                    elif event_type == "on_tool_end":
                        tool_output = event.get("data", {}).get("output", "")

                        # Extract content from ToolMessage if needed
                        if hasattr(tool_output, 'content'):
                            tool_output = tool_output.content

                        if tool_output and isinstance(tool_output, str):
                            try:
                                tool_data = json.loads(tool_output)
                                if isinstance(tool_data, dict):
                                    if tool_data.get("action") == "display_visualizations":
                                        visualizations = tool_data.get("visualizations", [])
                                        if visualizations:
                                            print(f"[Server] Sending {len(visualizations)} visualizations to frontend")
                                            yield f"event: updates\ndata: {json.dumps({'result': {'visualizations': visualizations}})}\n\n"
                            except (json.JSONDecodeError, TypeError):
                                pass

                    # Capture visualizations from analytical node completion
                    elif event_type == "on_chain_end":
                        name = event.get("name", "")
                        if name == "analytical":
                            output = event.get("data", {}).get("output", {})
                            # Output is a Command object, extract update dict
                            if hasattr(output, 'update'):
                                update_dict = output.update
                            elif isinstance(output, dict):
                                update_dict = output.get("update", output)
                            else:
                                update_dict = {}

                            visualizations = update_dict.get("visualizations", [])
                            if visualizations:
                                print(f"[Server] Analytical node created {len(visualizations)} visualizations")
                                yield f"event: updates\ndata: {json.dumps({'result': {'visualizations': visualizations}})}\n\n"

                # Get final state to check for interrupt
                state = compiled_graph.get_state(config)
                if state and state.next:
                    chat_response = state.values.get("chat_response", "")

                    # Check if chat_response is different from what we streamed (new summary after analytical)
                    is_new_response = chat_response and chat_response != streamed_content

                    if is_new_response:
                        # New response (e.g., summary after analytical) - send it
                        msg_id = f"chat-{thread_id}-summary"
                        final_msg = {
                            "type": "ai",
                            "content": chat_response,
                            "id": msg_id,
                        }
                        print(f"[Server] Sending summary response: {chat_response[:100]}...")
                        yield f"event: messages/complete\ndata: {json.dumps([final_msg])}\n\n"
                    elif chat_response and not streamed_content:
                        # First response that wasn't streamed
                        msg_id = f"chat-{thread_id}-initial"
                        final_msg = {
                            "type": "ai",
                            "content": chat_response,
                            "id": msg_id,
                        }
                        yield f"event: messages/complete\ndata: {json.dumps([final_msg])}\n\n"
                    elif streamed_content:
                        # Mark streaming complete
                        msg_id = current_run_id or f"chat-{thread_id}-initial"
                        complete_msg = [{"type": "ai", "content": "", "id": msg_id}]
                        yield f"event: messages/complete\ndata: {json.dumps(complete_msg)}\n\n"

                    # Send result for sidebar (including visualizations if any)
                    result = state.values.get("result", {})
                    visualizations = state.values.get("visualizations", [])

                    # If we have visualizations in state but not in result, add them
                    if visualizations and "visualizations" not in result:
                        result = {**result, "visualizations": visualizations}

                    serializable_result = make_serializable(result)
                    yield f"event: interrupt\ndata: {json.dumps({'result': serializable_result})}\n\n"

            elif request.command and "resume" in request.command:
                # Resume from interrupt with user message
                user_message = request.command["resume"]

                # Log appropriately based on content type
                if isinstance(user_message, str):
                    log_msg = user_message[:100] + "..." if len(user_message) > 100 else user_message
                elif isinstance(user_message, list):
                    # Multimodal content - extract text and note image presence
                    text_parts = [item.get('text', '') for item in user_message if item.get('type') == 'text']
                    has_image = any(item.get('type') == 'image_url' for item in user_message)
                    log_msg = f"[text: {' '.join(text_parts)[:50]}...] [has_image: {has_image}]"
                else:
                    log_msg = f"[unknown type: {type(user_message).__name__}]"

                # Check current thread state before resuming
                current_state = compiled_graph.get_state(config)
                if current_state:
                    print(f"[Server] Thread {thread_id} current state - next: {current_state.next}")
                    # If thread has no pending nodes, it's stale - cannot resume
                    if not current_state.next:
                        print(f"[Server] Error: Thread {thread_id} has no pending state - session expired")
                        yield f"event: error\ndata: {json.dumps({'error': 'session_expired', 'message': 'Thread has no pending state. Please start a new session.'})}\n\n"
                        return
                else:
                    print(f"[Server] Warning: Thread {thread_id} has no existing state!")
                    yield f"event: error\ndata: {json.dumps({'error': 'session_not_found', 'message': 'Thread not found. Please start a new session.'})}\n\n"
                    return

                print(f"[Server] Resuming thread {thread_id} with: {log_msg}")

                # For resuming from interrupt, we use invoke/astream with Command(resume=value)
                # This tells LangGraph to resume the interrupted node with this value
                resume_input = Command(resume=user_message)

                event_count = 0
                current_node = None  # Track which node is executing
                streamed_content = ""  # Track what we stream for comparison with final response

                # Use astream_events for token-by-token streaming during resume
                async for event in compiled_graph.astream_events(
                    resume_input,
                    config=config,
                    version="v2",
                ):
                    event_count += 1
                    event_type = event.get("event", "")

                    # Track which node is currently executing
                    if event_type == "on_chain_start":
                        name = event.get("name", "")
                        if name in ("chat", "analytical", "human_input"):
                            current_node = name
                            print(f"[Server] Entered node: {current_node}")

                            # Notify frontend when analytical agent starts working
                            if name == "analytical":
                                yield f"event: agent_status\ndata: {json.dumps({'agent': 'analytical', 'status': 'working'})}\n\n"

                    # Notify frontend when analytical agent finishes
                    if event_type == "on_chain_end":
                        name = event.get("name", "")
                        if name == "analytical":
                            yield f"event: agent_status\ndata: {json.dumps({'agent': 'analytical', 'status': 'done'})}\n\n"

                    # Log significant events (not every token)
                    if event_type in ("on_chain_start", "on_chain_end", "on_tool_start", "on_tool_end"):
                        name = event.get("name", "unknown")
                        print(f"[Server] Event: {event_type} - {name}")

                    # Stream LLM tokens - ONLY from chat node
                    if event_type == "on_chat_model_stream" and current_node == "chat":
                        chunk = event.get("data", {}).get("chunk")
                        if chunk and hasattr(chunk, "content"):
                            content = chunk.content
                            if content:
                                # Handle both string and list content
                                if isinstance(content, list):
                                    text_content = "".join(
                                        item.get("text", "") if isinstance(item, dict) else str(item)
                                        for item in content
                                    )
                                else:
                                    text_content = content

                                if text_content:
                                    streamed_content += text_content
                                    msg_event = {
                                        "type": "AIMessageChunk",
                                        "content": text_content,
                                        "id": event.get("run_id", "default")
                                    }
                                    yield f"event: messages/partial\ndata: {json.dumps([msg_event])}\n\n"

                    # Capture tool calls - ONLY from chat node (not analytical agent's tools)
                    elif event_type == "on_chat_model_end" and current_node == "chat":
                        output = event.get("data", {}).get("output")
                        if output and hasattr(output, "tool_calls") and output.tool_calls:
                            for tool_call in output.tool_calls:
                                tool_event = {
                                    "type": "AIMessageChunk",
                                    "content": [{"type": "tool_use", "name": tool_call.get("name", "unknown")}],
                                    "id": event.get("run_id", "default")
                                }
                                yield f"event: messages/partial\ndata: {json.dumps([tool_event])}\n\n"

                    # Capture visualization data from tool results
                    if event_type == "on_tool_end":
                        tool_name = event.get("name", "unknown")
                        tool_output = event.get("data", {}).get("output", "")

                        # Extract content from ToolMessage if needed
                        if hasattr(tool_output, 'content'):
                            tool_output = tool_output.content

                        if tool_output and isinstance(tool_output, str):
                            try:
                                tool_data = json.loads(tool_output)
                                if isinstance(tool_data, dict):
                                    # Check for visualization action from analytical agent
                                    if tool_data.get("action") == "display_visualizations":
                                        visualizations = tool_data.get("visualizations", [])
                                        if visualizations:
                                            print(f"[Server] Sending {len(visualizations)} visualizations to frontend")
                                            yield f"event: updates\ndata: {json.dumps({'result': {'visualizations': visualizations}})}\n\n"
                            except (json.JSONDecodeError, TypeError):
                                pass

                    # Send node updates (but skip chat node to avoid duplicate response)
                    elif event_type == "on_chain_end":
                        name = event.get("name", "")

                        # Special handling for analytical node - extract visualizations
                        if name == "analytical":
                            output = event.get("data", {}).get("output", {})
                            # Output is a Command object, extract update dict
                            if hasattr(output, 'update'):
                                update_dict = output.update
                            elif isinstance(output, dict):
                                update_dict = output.get("update", output)
                            else:
                                update_dict = {}

                            visualizations = update_dict.get("visualizations", [])
                            if visualizations:
                                print(f"[Server] Analytical node created {len(visualizations)} visualizations")
                                yield f"event: updates\ndata: {json.dumps({'result': {'visualizations': visualizations}})}\n\n"

                        # Skip internal nodes and chat node (response sent separately)
                        elif name and not name.startswith("_") and name not in ("chat", "agent", "LangGraph", "RunnableSequence", "Prompt", "call_model", "should_continue"):
                            output = event.get("data", {}).get("output", {})
                            if isinstance(output, dict):
                                serializable_output = make_serializable({name: output})
                                yield f"event: updates\ndata: {json.dumps(serializable_output)}\n\n"

                print(f"[Server] Stream finished with {event_count} events")

                # Get final state
                state = compiled_graph.get_state(config)
                if state:
                    print(f"[Server] Final state next: {state.next}")
                    chat_response = state.values.get("chat_response", "")

                    # Check if chat_response is different from what we streamed (new summary after analytical)
                    is_new_response = chat_response and chat_response != streamed_content

                    if is_new_response:
                        # New response (e.g., summary after analytical) - send it
                        print(f"[Server] Sending summary response: {chat_response[:100]}...")
                        msg_id = f"chat-{thread_id}-summary"
                        final_msg = {
                            "type": "ai",
                            "content": chat_response,
                            "id": msg_id,
                        }
                        yield f"event: messages/complete\ndata: {json.dumps([final_msg])}\n\n"
                    elif chat_response and not streamed_content:
                        # First response that wasn't streamed
                        print(f"[Server] Chat response length: {len(chat_response)}")
                        msg_id = f"chat-{thread_id}-final"
                        final_msg = {
                            "type": "ai",
                            "content": chat_response,
                            "id": msg_id,
                        }
                        yield f"event: messages/complete\ndata: {json.dumps([final_msg])}\n\n"
                    elif streamed_content:
                        # Mark streaming complete
                        msg_id = f"chat-{thread_id}-complete"
                        complete_msg = [{"type": "ai", "content": "", "id": msg_id}]
                        yield f"event: messages/complete\ndata: {json.dumps(complete_msg)}\n\n"

                    # Check for updated result and visualizations
                    result = state.values.get("result", {})
                    visualizations = state.values.get("visualizations", [])

                    # If we have visualizations in state but not in result, add them
                    if visualizations and "visualizations" not in result:
                        result = {**result, "visualizations": visualizations}

                    if result:
                        viz_count = len(result.get("visualizations", []))
                        print(f"[Server] Sending result update with {viz_count} visualizations")
                        serializable_result = make_serializable(result)
                        yield f"event: updates\ndata: {json.dumps({'result': serializable_result})}\n\n"
                else:
                    print(f"[Server] Warning: No state found for thread {thread_id}")

            yield f"event: end\ndata: {json.dumps({'status': 'complete'})}\n\n"

        except Exception as e:
            import traceback
            print(f"[Server] Error: {e}")
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.post("/threads")
async def create_thread(request: ThreadCreate):
    """Create a new thread."""
    thread_id = request.thread_id or str(uuid.uuid4())
    return {"thread_id": thread_id}


@app.get("/threads/{thread_id}/state")
async def get_thread_state(thread_id: str):
    """Get the current state of a thread."""
    config = {"configurable": {"thread_id": thread_id}}
    state = compiled_graph.get_state(config)
    if state:
        return {"values": state.values, "next": state.next}
    raise HTTPException(status_code=404, detail="Thread not found")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/test-api-key")
async def test_api_key(raw_request: Request):
    """
    Test if the provided OpenRouter API key is valid by making a minimal API call using litellm.
    """
    from litellm import completion
    
    api_key = raw_request.headers.get("X-API-Key")
    model = raw_request.headers.get("X-Model", "gpt-4o-mini")
    
    if not api_key:
        # Check if server has a default key
        if ORIGINAL_API_KEY:
            api_key = ORIGINAL_API_KEY
        else:
            return {"valid": False, "error": "No API key provided and no server default configured"}
    
    # Map model names to OpenRouter format (openrouter/provider/model)
    model_mapping = {
        "claude-sonnet-4-5-20250929": "openrouter/anthropic/claude-sonnet-4-5-20250929",
        "claude-sonnet-4-20250514": "openrouter/anthropic/claude-sonnet-4-20250514",
        "claude-3-5-sonnet-20241022": "openrouter/anthropic/claude-3.5-sonnet",
        "claude-3-5-haiku-20241022": "openrouter/anthropic/claude-3.5-haiku",
        "gpt-4o": "openrouter/openai/gpt-4o",
        "gpt-4o-mini": "openrouter/openai/gpt-4o-mini",
    }
    litellm_model = model_mapping.get(model, f"openrouter/{model}")
    
    try:
        # Test the API key with a minimal request using litellm
        response = completion(
            model=litellm_model,
            api_key=api_key,
            max_tokens=10,
            messages=[{"role": "user", "content": "Say 'OK'"}]
        )
        
        response_text = response.choices[0].message.content if response.choices else "OK"
        
        return {
            "valid": True,
            "model": litellm_model,
            "message": f"API key is valid! Connected to {litellm_model}",
            "response": response_text
        }
            
    except Exception as e:
        error_str = str(e)
        if "401" in error_str or "Unauthorized" in error_str or "AuthenticationError" in error_str:
            return {"valid": False, "error": "Invalid API key - authentication failed"}
        elif "404" in error_str or "NotFoundError" in error_str:
            return {"valid": False, "error": f"Model '{litellm_model}' not found - try a different model"}
        elif "429" in error_str or "RateLimitError" in error_str:
            return {"valid": True, "model": litellm_model, "message": "API key is valid (rate limited, but authenticated)"}
        else:
            return {"valid": False, "error": f"Connection error: {error_str}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2024)
