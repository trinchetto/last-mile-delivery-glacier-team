"""
Delivery Analytical Agent

Creates visualizations and analytics for the DeliveryIQ dashboard.
This agent is called by the chat agent when the user requests data
visualizations, comparisons, or detailed analytics.

The agent:
1. Receives a request from the chat agent (e.g., "show best carriers")
2. Plans which visualizations to create
3. Uses tools to generate chart/list/metric data
4. Returns structured data for the frontend dashboard
"""

import json
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

from core.configuration import Configuration
from agents.analytical.tools import ANALYTICAL_TOOLS


def get_llm(config: Configuration):
    """Get the LLM instance based on configuration."""
    model = config.model
    temperature = 0.3  # Lower temperature for consistent analytics

    if "/" in model:
        provider, model_name = model.split("/", 1)
    else:
        provider = "anthropic"
        model_name = model

    if provider == "anthropic":
        return ChatAnthropic(model=model_name, temperature=temperature, streaming=True)
    else:
        return ChatOpenAI(model=model_name, temperature=temperature, streaming=True)


ANALYTICAL_SYSTEM_PROMPT = """You are the Delivery Analytical Agent for DeliveryIQ.

Your role is to create data visualizations that appear on the user's dashboard.
When the chat agent sends you a request, you analyze what visualizations would
best present the requested information and create them using your tools.

AVAILABLE VISUALIZATION TOOLS:

Charts:
- create_pie_chart: Show distribution/proportions (carrier share, delay causes)
- create_bar_chart: Compare values across categories (carrier comparison, lane performance)
- create_line_chart: Show trends over time (monthly performance, volume trends)
- create_gauge_chart: Show single metric with zones (risk score, compliance rate)

Lists & Tables:
- create_ranked_list: Show ordered items (top carriers, worst lanes)
- create_comparison_table: Compare items across dimensions (carrier matrix)

Metrics:
- create_metric_card: Single KPI (on-time rate, avg transit)
- create_metric_group: Multiple related KPIs together

Specialized:
- create_delivery_timeline: Show delivery window with range
- create_risk_breakdown: Show risk score with contributing factors

Utility:
- clear_dashboard: Clear existing visualizations before adding new ones

GUIDELINES:

1. ALWAYS start by calling clear_dashboard() to reset before adding new visualizations

2. Choose appropriate visualization types:
   - Use pie_chart for distributions (parts of a whole)
   - Use bar_chart for comparisons (discrete categories)
   - Use line_chart for trends (time series)
   - Use gauge_chart for scores/rates (single value with context)
   - Use ranked_list for top/bottom N items
   - Use comparison_table for multi-dimensional comparison

3. Create 2-4 complementary visualizations per request:
   - A summary metric or gauge
   - A main chart (bar/pie/line)
   - A detailed list or table if appropriate

4. Use realistic data ranges:
   - On-time rates: 75-95%
   - Transit days: 1-7 days
   - Risk scores: 20-80
   - Costs: $1.50-$3.50 per mile

5. Color conventions:
   - Green (#22c55e): Good/positive values
   - Yellow (#eab308): Warning/moderate
   - Red (#ef4444): Bad/high risk
   - Blue (#3b82f6): Neutral/informational
   - Purple (#a855f7): Highlighted/selected

6. Format data correctly for each tool - see tool descriptions for exact formats

7. After creating visualizations, return a brief summary of what was created

EXAMPLES:

Request: "Show me the best carriers"
Actions:
1. clear_dashboard()
2. create_gauge_chart("Top Carrier Score", 92, ...)
3. create_bar_chart("Carrier On-Time Rates", ...)
4. create_ranked_list("Best Carriers", ...)

Request: "Analyze risk for Chicago to Miami"
Actions:
1. clear_dashboard()
2. create_risk_breakdown("Delivery Risk Analysis", 45, ...)
3. create_delivery_timeline("Expected Transit", ...)
4. create_metric_group("Lane Metrics", ...)

Request: "Compare carrier costs"
Actions:
1. clear_dashboard()
2. create_comparison_table("Carrier Comparison", ...)
3. create_bar_chart("Cost per Mile", ...)
"""


async def run_analytical_agent(
    request: str,
    context: Optional[dict] = None,
    config: Optional[Configuration] = None,
) -> dict:
    """
    Run the analytical agent to create dashboard visualizations.

    Args:
        request: What to visualize (e.g., "show best carriers for Chicago to Miami")
        context: Optional context data (lane info, carrier data, etc.)
        config: Configuration from graph

    Returns:
        Dict with:
        - visualizations: List of visualization specs for frontend
        - summary: Brief text summary of what was created
        - error: Optional error message
    """
    if config is None:
        config = Configuration()

    llm = get_llm(config)

    # Build the request message
    message_content = f"Create visualizations for: {request}"

    if context:
        context_str = json.dumps(context, indent=2)
        message_content += f"\n\nContext data:\n{context_str}"

    try:
        # Use direct tool calling instead of ReAct agent to prevent
        # intermediate messages from streaming to the parent graph.
        # This keeps the analytical agent's internal work isolated.
        llm_with_tools = llm.bind_tools(ANALYTICAL_TOOLS)

        messages = [
            SystemMessage(content=ANALYTICAL_SYSTEM_PROMPT),
            HumanMessage(content=message_content)
        ]

        # Tool calling loop - isolated from parent streaming
        max_iterations = 10
        for _ in range(max_iterations):
            response = await llm_with_tools.ainvoke(messages)
            messages.append(response)

            # Check if there are tool calls to execute
            if not response.tool_calls:
                break

            # Execute each tool call
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]

                # Find and execute the tool
                tool_result = None
                for tool in ANALYTICAL_TOOLS:
                    if tool.name == tool_name:
                        tool_result = tool.invoke(tool_args)
                        break

                if tool_result is None:
                    tool_result = json.dumps({"error": f"Tool {tool_name} not found"})

                # Add tool result to messages
                messages.append(ToolMessage(
                    content=tool_result,
                    tool_call_id=tool_call["id"]
                ))

        # Extract results from the isolated message history
        result = {"messages": messages}

        # Extract visualizations from tool results
        visualizations = []
        summary_parts = []

        for msg in result.get("messages", []):
            # Check for tool messages
            if hasattr(msg, 'type') and msg.type == 'tool':
                try:
                    tool_result = json.loads(msg.content)
                    if "visualization" in tool_result:
                        viz = tool_result["visualization"]
                        if viz.get("type") != "clear":
                            visualizations.append(viz)
                            summary_parts.append(f"- {viz.get('type', 'chart')}: {viz.get('title', 'Untitled')}")
                except (json.JSONDecodeError, TypeError):
                    pass

        # Get the final AI message as summary
        final_message = ""
        for msg in reversed(result.get("messages", [])):
            if hasattr(msg, 'type') and msg.type == 'ai':
                content = msg.content
                if isinstance(content, list):
                    final_message = " ".join(
                        block.get("text", "") if isinstance(block, dict) else str(block)
                        for block in content
                    )
                else:
                    final_message = str(content)
                break

        return {
            "visualizations": visualizations,
            "summary": final_message or f"Created {len(visualizations)} visualizations:\n" + "\n".join(summary_parts),
            "error": None,
        }

    except Exception as e:
        return {
            "visualizations": [],
            "summary": f"Error creating visualizations: {str(e)}",
            "error": str(e),
        }
