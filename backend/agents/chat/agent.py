"""
DeliveryIQ Chat Agent

Main conversational agent for the last-mile delivery assistant.
Uses ReAct pattern with tools - normal responses stream as text,
only actual tool calls show as tools.
"""

import json
from typing import Optional, Sequence

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.prebuilt import create_react_agent

from core.configuration import Configuration
from agents.chat.tools import CHAT_TOOLS


def get_llm(config: Configuration):
    """Get the LLM instance based on configuration."""
    model = config.model
    temperature = min(config.temperature + 0.2, 1.0)

    if "/" in model:
        provider, model_name = model.split("/", 1)
    else:
        provider = "anthropic"
        model_name = model

    if provider == "anthropic":
        return ChatAnthropic(model=model_name, temperature=temperature, streaming=True)
    else:
        return ChatOpenAI(model=model_name, temperature=temperature, streaming=True)


SYSTEM_PROMPT = """You are DeliveryIQ, a conversational assistant for last-mile delivery logistics.

You have ONE tool: request_data_analysis
- Use it when users ask about data, metrics, visualizations, or analysis
- For normal conversation (greetings, explanations, follow-ups), just respond directly

THE ANALYTICAL AGENT (accessed via request_data_analysis) has:
- Real shipment database with ~10K records
- Data: carrier_mode, carrier_pseudo, actual_transit_days, otd_designation (On-Time/Late/Delivered Early), origin_zip_3d, dest_zip_3d, lane_zip3_pair
- Visualization tools (charts, graphs, metrics, tables)

WHEN TO USE request_data_analysis:
- "Show me carrier performance" → Use tool
- "How many shipments were late?" → Use tool
- "Compare LTL vs Truckload" → Use tool
- "What are the best carriers?" → Use tool

WHEN TO RESPOND DIRECTLY (no tool):
- "Hello" → Just greet them
- "What can you do?" → Explain your capabilities
- "Thanks" → Acknowledge

When using request_data_analysis, be specific:
- What data to query
- What metrics to calculate
- What visualizations to create

Keep responses concise. No emojis."""


def _extract_visualization_request(messages: list) -> str | None:
    """Extract the visualization request from tool messages."""
    for msg in messages:
        if hasattr(msg, 'type') and msg.type == 'tool':
            content = msg.content if hasattr(msg, 'content') else ''
            if isinstance(content, str) and '"status": "routed_to_analytical"' in content:
                try:
                    data = json.loads(content)
                    return data.get("request")
                except (json.JSONDecodeError, TypeError):
                    pass
    return None


def _convert_messages(messages: Sequence[BaseMessage]) -> list[BaseMessage]:
    """Convert message sequence to list of BaseMessage."""
    result = []
    for msg in messages:
        if isinstance(msg, (HumanMessage, AIMessage)):
            result.append(msg)
        elif isinstance(msg, dict):
            role = msg.get("role", msg.get("type", "human"))
            content = msg.get("content", "")
            if role in ("human", "user"):
                result.append(HumanMessage(content=content))
            else:
                result.append(AIMessage(content=content))
    return result


async def run_chat(
    messages: Optional[Sequence[BaseMessage]] = None,
    user_message: str = "",
    config: Optional[Configuration] = None,
    delivery_context: Optional[dict] = None,
) -> dict:
    """
    Run the chat assistant with streaming support.

    Normal responses stream as text. Tool calls are only used when
    the LLM decides to delegate to the Analytical Agent.

    Returns:
        Dict with:
        - response: Assistant's response text
        - visualization_request: Request for analytical agent (if tool was called)
        - error: Optional error message
    """
    if config is None:
        config = Configuration()

    if not user_message:
        return {
            "response": "Hello! I'm DeliveryIQ, your last-mile delivery assistant. Ask me about carrier performance, delivery trends, or any logistics questions.",
            "visualization_request": None,
            "error": None,
        }

    llm = get_llm(config)

    # Create ReAct agent - streams text, only shows tools when actually called
    agent = create_react_agent(
        llm,
        CHAT_TOOLS,
        prompt=SYSTEM_PROMPT,
    )

    # Build message list
    agent_messages = []
    if messages:
        agent_messages.extend(_convert_messages(messages)[-10:])
    agent_messages.append(HumanMessage(content=user_message))

    try:
        result = await agent.ainvoke({"messages": agent_messages})

        # Get final response text
        final_content = result["messages"][-1].content if result.get("messages") else ""
        if isinstance(final_content, list):
            response = " ".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in final_content
            )
        else:
            response = str(final_content)

        # Check if tool was called for analytical routing
        visualization_request = _extract_visualization_request(result["messages"])

        return {
            "response": response,
            "visualization_request": visualization_request,
            "error": None,
        }

    except Exception as e:
        return {
            "response": f"I encountered an error: {str(e)}. Please try again.",
            "visualization_request": None,
            "error": str(e),
        }
