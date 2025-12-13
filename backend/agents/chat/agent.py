"""
DeliveryIQ Chat Agent

Main conversational agent for the last-mile delivery assistant.
Handles user queries about delivery risks, lane performance,
carrier recommendations, and logistics optimization.

Following LangGraph best practices:
- Uses create_react_agent for tool-based reasoning
- Receives configuration from graph
- Returns dict updates (not mutated state)
- Works with message history
"""

import json
import re
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


def build_system_prompt(config: Configuration) -> str:
    """Build the system prompt for the delivery assistant."""
    base_prompt = getattr(config, 'chat_system_prompt', '')

    return f"""{base_prompt}

You are DeliveryIQ, the main conversational agent in a multi-agent delivery intelligence system.
You help logistics professionals analyze delivery risks, optimize routes, evaluate carriers,
and make data-driven decisions about their supply chain.

YOUR TOOLS:
- **analyze_delivery_risk**: Analyze risk factors for a delivery scenario
- **get_lane_performance**: Get performance metrics for a specific lane
- **search_carriers**: Search and compare carriers by criteria
- **get_carrier_details**: Get detailed information about a carrier
- **get_delivery_window_recommendation**: Get recommended shipping dates

YOUR COLLEAGUE - THE ANALYTICAL AGENT:
You work alongside the Analytical Agent, who specializes in creating visualizations
for the user's dashboard (charts, graphs, metrics, tables). When the user needs to
SEE or VISUALIZE data, send a message to your colleague using message_analytical_agent.

Communicate naturally with them - explain what the user needs and suggest what
visualizations might help. They'll create the appropriate charts and send back a summary.

Example interactions:

User: "Show me the best carriers"
You to Analytical Agent: "The user wants to see carrier performance. Please create:
- A bar chart comparing on-time rates across our top carriers
- A ranked list of the top 5 carriers with their key metrics
Focus on FastFreight, EcoLogistics, and Premier Trucking."

User: "What's the risk for shipping to Miami?"
You to Analytical Agent: "I've analyzed the Chicago-Miami lane for the user. Can you
visualize the risk breakdown? Overall score is around 45 (medium risk). Main factors
are weather (35%) and seasonal congestion. Also show the delivery timeline (2-4 days)."

CAPABILITIES:
- Analyze delivery risk based on lane, time, weather, and carrier factors
- Provide lane performance insights (on-time rates, delay causes, seasonality)
- Compare and recommend carriers based on cost, reliability, and capacity
- Coordinate with the Analytical Agent for visual dashboards
- Suggest optimizations for delivery windows and routing

RESPONSE STYLE:
- Keep answers concise and actionable (3-5 sentences typical)
- Use bullet points for lists and comparisons
- Highlight key metrics and percentages
- Do not use emojis
- When you've asked the Analytical Agent to create visualizations, let the user know

When analyzing deliveries, consider:
- Origin and destination locations
- Time of year and seasonal patterns
- Weather conditions and forecasts
- Carrier reliability and capacity
- Historical lane performance

Use your tools to fetch real data before responding. Always base answers on actual data.
"""


def _extract_analytical_message(messages: list) -> str | None:
    """
    Extract message sent to the Analytical Agent.

    Checks if the chat agent sent a message to the analytical agent
    and extracts the message content.

    Returns the message string if found, None otherwise.
    """
    for msg in messages:
        msg_type = getattr(msg, 'type', None) or (msg.get('type') if isinstance(msg, dict) else None)
        if msg_type == 'tool':
            content = msg.content if hasattr(msg, 'content') else msg.get('content', '')
            if isinstance(content, str) and '"status": "message_to_analytical"' in content:
                try:
                    tool_data = json.loads(content)
                    return tool_data.get("message")
                except (json.JSONDecodeError, TypeError):
                    pass
    return None


def _build_context_message(delivery_context: dict) -> str:
    """Build the context message with current delivery state."""
    if not delivery_context:
        return ""

    context = "CURRENT DELIVERY CONTEXT:\n\n"
    context += f"""Delivery Scenario:
- Origin: {delivery_context.get('origin', 'Not specified')}
- Destination: {delivery_context.get('destination', 'Not specified')}
- Carrier: {delivery_context.get('carrier', 'Not specified')}
- Time Window: {delivery_context.get('time_window', 'Not specified')}
- Priority: {delivery_context.get('priority', 'Standard')}
"""
    return context


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
    Run the chat assistant to respond to user questions about deliveries.

    Args:
        messages: Previous messages in conversation
        user_message: Current user message
        config: Configuration from graph
        delivery_context: Optional context about current delivery being discussed

    Returns:
        Dict with:
        - response: Assistant's response text
        - visualization_request: Message for analytical agent (if any)
        - error: Optional error message
    """
    if config is None:
        config = Configuration()

    # Handle missing user message
    if not user_message:
        return {
            "response": "Hello! I'm DeliveryIQ, your last-mile delivery assistant. Ask me about delivery risks, lane performance, carrier recommendations, or any logistics questions.",
            "visualization_request": None,
            "error": None,
        }

    llm = get_llm(config)
    system_prompt = build_system_prompt(config)

    # Create the ReAct agent with tools
    agent = create_react_agent(
        llm,
        CHAT_TOOLS,
        prompt=system_prompt,
    )

    # Build context message
    context = _build_context_message(delivery_context or {})

    # Build message list
    agent_messages = []

    # Add context on first message
    if context and not messages:
        agent_messages.append(HumanMessage(content=context))

    # Add previous messages (last 10)
    if messages:
        previous = _convert_messages(messages)[-10:]
        agent_messages.extend(previous)

    # Add current user message
    agent_messages.append(HumanMessage(content=user_message))

    try:
        result = await agent.ainvoke({"messages": agent_messages})

        # Extract the final message
        final_message_content = result["messages"][-1].content if result.get("messages") else ""

        # Handle content being a list (Anthropic format) or string (OpenAI format)
        if isinstance(final_message_content, list):
            final_message = " ".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in final_message_content
            )
        else:
            final_message = str(final_message_content)

        # Check if the chat agent sent a message to the analytical agent
        # This is inter-agent communication in the orchestrator workflow
        visualization_request = _extract_analytical_message(result["messages"])

        return {
            "response": final_message,
            "visualization_request": visualization_request,
            "error": None,
        }

    except Exception as e:
        return {
            "response": f"I apologize, I encountered an error: {str(e)}. Could you please rephrase your question?",
            "visualization_request": None,
            "error": str(e),
        }
