"""
LangGraph workflow for DeliveryIQ Last-Mile Delivery Assistant.

Multi-agent flow:
- START → chat → [routing decision]
                  ├─ human_input (conversation continues)
                  └─ analytical → chat → human_input (creates visualizations, then chat summarizes)

The chat and analytical agents communicate bidirectionally:
- Chat sends visualization_request to analytical
- Analytical sends analytical_summary back to chat

Run locally with: langgraph dev
"""

import os
import sys
from typing import Literal, Annotated, Optional
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Add the current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize LangSmith tracing
from core.config import setup_langsmith
setup_langsmith()

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from typing_extensions import TypedDict

# Agent imports
from agents.chat.agent import run_chat
from agents.analytical.agent import run_analytical_agent

# Import configuration
from core.configuration import Configuration, get_config_from_runnable_config


# =============================================================================
# REDUCERS
# =============================================================================

def merge_lists(left: list, right: list) -> list:
    """Merge two lists, appending right to left."""
    if left is None:
        left = []
    if right is None:
        right = []
    return left + right


def replace_visualizations(left: list, right: list) -> list:
    """Replace visualizations (don't accumulate)."""
    if right is not None and len(right) > 0:
        return right
    return left or []


# =============================================================================
# STATE DEFINITIONS
# =============================================================================

class DeliveryState(TypedDict, total=False):
    """State for the delivery assistant workflow."""
    # User input
    user_query: str
    user_message: str

    # Chat state
    chat_history: Annotated[list[BaseMessage], merge_lists]
    chat_response: str

    # Analytical agent communication (bidirectional)
    visualization_request: Optional[str]  # Request from chat → analytical
    visualizations: Annotated[list[dict], replace_visualizations]  # Created visualizations
    analytical_summary: Optional[str]  # Summary from analytical → chat

    # Result for frontend
    result: dict

    # Control flow
    current_node: str
    came_from_analytical: bool  # Flag to indicate chat is handling analytical response


class DeliveryInput(TypedDict, total=False):
    """Input schema for the workflow."""
    user_query: str


class DeliveryOutput(TypedDict, total=False):
    """Output schema for the workflow."""
    result: dict
    chat_response: str
    visualizations: list[dict]


# =============================================================================
# NODE FUNCTIONS
# =============================================================================

async def chat_node(
    state: DeliveryState,
    config: RunnableConfig
) -> Command[Literal["human_input", "analytical", "__end__"]]:
    """
    Chat node: Main conversational agent.

    Handles user queries and decides whether to:
    1. Respond directly and go to human_input
    2. Route to analytical agent for visualizations
    3. Summarize analytical results when coming back from analytical agent
    4. End the conversation if user says goodbye
    """
    configuration = get_config_from_runnable_config(config)

    # Check if we're coming back from analytical agent
    came_from_analytical = state.get("came_from_analytical", False)
    analytical_summary = state.get("analytical_summary")

    if came_from_analytical and analytical_summary:
        # We're handling the response from analytical agent
        # Incorporate the visualization summary into the chat response
        visualizations = state.get("visualizations", [])
        viz_count = len(visualizations)

        # Create a response that acknowledges the visualizations
        response = f"I've created {viz_count} visualization{'s' if viz_count != 1 else ''} on your dashboard. {analytical_summary}"

        # Update chat history with the visualization response
        new_messages = [
            AIMessage(content=response),
        ]

        # Get current result and ensure visualizations are included
        current_result = state.get("result", {})
        frontend_result = {
            **current_result,
            "chat_response": response,
            "visualizations": visualizations,
        }

        return Command(
            update={
                "chat_response": response,
                "chat_history": new_messages,
                "current_node": "chat",
                "came_from_analytical": False,  # Reset flag
                "analytical_summary": None,  # Clear summary
                "result": frontend_result,
            },
            goto="human_input"
        )

    # Get user message (either initial query or follow-up)
    user_message = state.get("user_message") or state.get("user_query", "")

    if not user_message:
        return Command(
            update={
                "chat_response": "Hello! I'm your DeliveryIQ assistant. Ask me about delivery risks, lane performance, carrier recommendations, or say 'show me' to visualize data.",
                "current_node": "chat",
                "result": {"success": True, "message": "Ready to help"},
            },
            goto="human_input"
        )

    # Check if user wants to end the conversation
    end_keywords = ["goodbye", "bye", "exit", "quit", "end session", "close"]
    if any(keyword in user_message.lower() for keyword in end_keywords):
        farewell = "Thank you for using DeliveryIQ! Have a great day."
        return Command(
            update={
                "chat_response": farewell,
                "chat_history": [
                    HumanMessage(content=user_message),
                    AIMessage(content=farewell),
                ],
                "current_node": "chat",
                "result": {"success": True, "message": "Session ended", "ended": True},
            },
            goto=END
        )

    # Run the chat agent
    result = await run_chat(
        messages=state.get("chat_history", []),
        user_message=user_message,
        config=configuration,
    )

    response = result.get("response", "")
    visualization_request = result.get("visualization_request")

    # Build chat history update
    new_messages = [
        HumanMessage(content=user_message),
        AIMessage(content=response),
    ]

    # Prepare base result
    frontend_result = {
        "success": True,
        "chat_response": response,
    }

    # Check if we need to route to analytical agent
    if visualization_request:
        return Command(
            update={
                "chat_response": response,
                "chat_history": new_messages,
                "current_node": "chat",
                "visualization_request": visualization_request,
                "result": frontend_result,
            },
            goto="analytical"
        )

    # Normal conversation flow
    return Command(
        update={
            "chat_response": response,
            "chat_history": new_messages,
            "current_node": "chat",
            "result": frontend_result,
        },
        goto="human_input"
    )


async def analytical_node(
    state: DeliveryState,
    config: RunnableConfig
) -> Command[Literal["chat"]]:
    """
    Analytical node: Creates visualizations for the dashboard.

    Receives visualization requests from chat agent and creates
    appropriate charts, graphs, and metrics. Then routes back to
    chat agent with a summary for the final response.
    """
    configuration = get_config_from_runnable_config(config)

    visualization_request = state.get("visualization_request", "")

    if not visualization_request:
        # No request, just continue to chat
        return Command(
            update={
                "current_node": "analytical",
                "visualization_request": None,
                "came_from_analytical": True,
                "analytical_summary": "No visualization request was provided.",
            },
            goto="chat"
        )

    # Run the analytical agent
    result = await run_analytical_agent(
        request=visualization_request,
        context=None,
        config=configuration,
    )

    visualizations = result.get("visualizations", [])
    summary = result.get("summary", "")

    # Update result with visualizations
    current_result = state.get("result", {})
    updated_result = {
        **current_result,
        "visualizations": visualizations,
        "visualization_summary": summary,
    }

    # Route back to chat with the summary
    return Command(
        update={
            "visualizations": visualizations,
            "visualization_request": None,  # Clear the request
            "current_node": "analytical",
            "came_from_analytical": True,  # Signal to chat that we're returning
            "analytical_summary": summary,  # Pass summary to chat
            "result": updated_result,
        },
        goto="chat"  # Route back to chat for final response
    )


def human_input_node(state: DeliveryState) -> Command[Literal["chat"]]:
    """
    Human input node: Wait for user input.

    Interrupts execution to get user message, then routes back to chat.
    """
    # Interrupt to get user input
    user_input = interrupt({
        "message": "Ready for your question.",
        "last_response": state.get("chat_response"),
        "result": state.get("result"),
        "visualizations": state.get("visualizations"),
    })

    # Store the user message and continue to chat
    return Command(
        update={"user_message": user_input},
        goto="chat"
    )


# =============================================================================
# BUILD GRAPH
# =============================================================================

def build_delivery_graph() -> StateGraph:
    """
    Build the delivery assistant workflow graph.

    Multi-agent flow with bidirectional communication:
    - START → chat → [routing]
                      ├─ human_input (direct response)
                      └─ analytical → chat → human_input (visualizations + summary)

    The analytical agent communicates back to chat with a summary,
    allowing chat to provide a coherent final response to the user.
    """
    workflow = StateGraph(
        DeliveryState,
        input=DeliveryInput,
        output=DeliveryOutput,
        config_schema=Configuration,
    )

    # Add all nodes
    workflow.add_node("chat", chat_node)
    workflow.add_node("analytical", analytical_node)
    workflow.add_node("human_input", human_input_node)

    # Entry point
    workflow.add_edge(START, "chat")

    # Note: Routing is handled by Command.goto in the node functions

    return workflow


# =============================================================================
# COMPILED GRAPH
# =============================================================================

delivery_graph = build_delivery_graph().compile()


# =============================================================================
# STREAMING HELPERS
# =============================================================================

async def stream_delivery(
    user_query: str,
    thread_id: str = "default",
    config_overrides: dict | None = None,
):
    """Stream chat responses with real-time updates."""
    input_data = {"user_query": user_query}

    config = {
        "configurable": {
            "thread_id": thread_id,
            **(config_overrides or {}),
        }
    }

    async for event in delivery_graph.astream(
        input_data,
        config=config,
        stream_mode="updates",
    ):
        yield event


async def get_delivery_response(
    user_query: str,
    thread_id: str = "default",
    config_overrides: dict | None = None,
) -> dict:
    """Get a complete response (non-streaming)."""
    input_data = {"user_query": user_query}

    config = {
        "configurable": {
            "thread_id": thread_id,
            **(config_overrides or {}),
        }
    }

    result = await delivery_graph.ainvoke(input_data, config=config)
    return result.get("result", {})


def get_graph_state(thread_id: str) -> dict | None:
    """Get the current state for a thread."""
    config = {"configurable": {"thread_id": thread_id}}
    state = delivery_graph.get_state(config)
    return state.values if state else None


# Export for LangGraph Studio
__all__ = [
    "delivery_graph",
    "build_delivery_graph",
    "stream_delivery",
    "get_delivery_response",
    "get_graph_state",
]
