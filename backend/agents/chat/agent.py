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
- Real shipment database with ~70K+ records
- Data: carrier_name (friendly names like "Swift Freight", "Eagle Logistics"), carrier_mode, actual_transit_days, otd_designation (On-Time/Late/Delivered Early), origin_zip_3d, dest_zip_3d, lane_zip3_pair
- Visualization tools (charts, graphs, metrics, tables)
- Always use carrier_name when displaying carrier information.
- Always use origin_state_name/dest_state_name (not zip codes) when displaying location information, but analyze the stats by zip code.

IMPORTANT:
- When you gather data from the analytical agent you provide short info on what has been presented. The user will have access too all the visualizations and numbers.
- When you use the analytical agent you answer: "I will gather the data and create visualizations...", the user does should be confident that you have access to all the information.
- Write a short message to the user before calling the analytical agent instead of after.
- Keep your answers rather short then extensive as the most important data is provided through the visualizations.
- Use bullet points to present the actions you will perform and to present the data that has been gathered by the analytical agent.
- Do not write a message directly after you have used the request_data_analysis, wait untill the agent has gathered all the data and sent you a message.
- Before calling the analytical agent write bullet points to the user.

WHEN TO USE request_data_analysis:
- "Show me carrier performance" → Use tool
- "How many shipments were late?" → Use tool
- "Compare LTL vs Truckload" → Use tool
- "What are the best carriers?" → Use tool

WHEN TO RESPOND DIRECTLY (no tool):
- "Hello" → Just greet them
- "What can you do?" → Explain your capabilities
- "Thanks" → Acknowledge

DATA SCHEME:

[
  {
    "name": "carrier_mode",
    "type": "string",
    "description": "Mode of transportation label, can be one of the following modes: LT,Truckload,TL Dry, TL Flatbed"
  },
  {
    "name": "actual_ship",
    "type": "datetime",
    "description": "The actual date when the shipment was dispatched. The format is YYYY-mm-dd HH:MM"
  },
  {
    "name": "actual_delivery",
    "type": "datetime",
    "description": "The actual date when the shipment was delivered. The format is YYYY-mm-dd HH:MM"
  },
  {
    "name": "customer_distance",
    "type": "integer",
    "description": "Distance in miles between origin and destination"
  },
  {
    "name": "all_modes_goal_transit_days",
    "type": "integer",
    "description": "Target number of transit days"
  },
  {
    "name": "actual_transit_days",
    "type": "integer",
    "description": "Actual number of days taken for the shipment to be delivered"
  },
  {
    "name": "otd_designation",
    "type": "string",
    "description": "On-Time Delivery designation. It can be Late, On-Time, Delivered Early"
  },
  {
    "name": "load_id_pseudo",
    "type": "string",
    "description": "Shipment ID/Parcel ID/Package ID"
  },
  {
    "name": "carrier_pseudo",
    "type": "string",
    "description": "Carrier ID"
  },
  {
    "name": "origin_zip_3d",
    "type": "string",
    "description": "Origin zip code in the US. Only the three first numbers are displayed"
  },
  {
    "name": "dest_zip_3d",
    "type": "string",
    "description": "Destination zip code in the US. Only the three first numbers are displayed"
  },
  {
    "name": "lane_zip3_pair",
    "type": "string",
    "description": "Zip code origin -> Zip code destiny pair."
  },
  {
    "name": "lane_id",
    "type": "string",
    "description": "An identifier for the Lane zip pair"
  },
  {
    "name": "carrier_name",
    "type": "string",
    "description": "Friendly name for the carrier (e.g., 'Swift Freight', 'Eagle Logistics')"
  },
  {
    "name": "origin_state",
    "type": "string",
    "description": "Origin state abbreviation (e.g., 'CA', 'TX', 'NY')"
  },
  {
    "name": "origin_state_name",
    "type": "string",
    "description": "Origin state full name (e.g., 'California', 'Texas')"
  },
  {
    "name": "dest_state",
    "type": "string",
    "description": "Destination state abbreviation (e.g., 'CA', 'TX', 'NY')"
  },
  {
    "name": "dest_state_name",
    "type": "string",
    "description": "Destination state full name (e.g., 'California', 'Texas')"
  }
]

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
