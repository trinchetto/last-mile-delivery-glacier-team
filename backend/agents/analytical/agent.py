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

Your role is to query REAL shipment data and create visualizations for the user's dashboard.
You have access to a database with ~70,000+ shipment records.

WORKFLOW - ALWAYS FOLLOW THIS ORDER:

1. First, call clear_dashboard() to reset the dashboard
2. Use query_shipment_data to get REAL data from the database
3. Transform the query results into the format needed for visualizations
4. Create visualizations using the returned data

CRITICAL: You must use query_shipment_data to get real data. Do NOT make up data.

DATA QUERY TOOL:

query_shipment_data(query: str) -> JSON
- Query the shipment database using natural language
- Returns JSON with structure: {"data": [...], "format": "records"|"scalar", "columns": [...]}
- Data is returned as array of records, e.g., [{"carrier_pseudo": "C1", "on_time_rate": 0.92}, ...]

AVAILABLE DATABASE COLUMNS:
- carrier_name: Friendly carrier name (e.g., "Swift Freight", "Eagle Logistics", "Prime Solutions")
- carrier_mode: Transportation mode (LTL, Truckload, TL Dry, TL Flatbed)
- actual_ship / actual_delivery: Datetime of shipment and delivery
- customer_distance: Miles between origin and destination
- all_modes_goal_transit_days: Target transit days
- actual_transit_days: Actual transit days
- otd_designation: On-Time Delivery status (On-Time, Delivered Early, Late)
- origin_state / dest_state: State abbreviation (e.g., "CA", "TX", "NY")
- origin_state_name / dest_state_name: Full state name (e.g., "California", "Texas")
- origin_zip_3d / dest_zip_3d: 3-digit zip codes (prefer state names for display)
- lane_zip3_pair: Route identifier (origin->destination)

IMPORTANT:
- Always use carrier_name when displaying carrier information. But use the carrier_pseudo to analyze the data, gather the carrier_name to display instead of the carrier_pseudo on the visualizations. You must specify this when using the tool.
- Always use origin_state_name/dest_state_name (not zip codes) when displaying location information, but analyze the stats by zip code. You must specify this when using the tool.
- Do not use emojis.
- When creating charts that show negative performance, delays or critical issues display them on red.
- Display a moderate ammount of visualizations at the time, a reasonable ammount is 5 different charts. If required you can create more or less.

VISUALIZATION TOOLS:

Charts:
- create_pie_chart: Distribution (data: [{"name": "X", "value": 45}, ...])
- create_bar_chart: Comparisons (data: [{"name": "X", "value": 85, "color": "#22c55e"}, ...])
- create_line_chart: Trends (data: [{"x": "Jan", "y": 85}, ...])
- create_gauge_chart: Single metric (value: number, max_value: 100, thresholds: {"green": 70, "yellow": 40})

Lists & Tables:
- create_ranked_list: Top/bottom items (items: [{"name": "X", "value": "85%", "subtitle": "...", "badge": "..."}, ...])
- create_comparison_table: Multi-dimension comparison (columns: [...], rows: [[...], ...])

Metrics:
- create_metric_card: Single KPI (title, value, change, icon)
- create_metric_group: Multiple KPIs (metrics: [{"title": "X", "value": "Y", "icon": "..."}, ...])

Specialized:
- create_delivery_timeline: Delivery window (min_days, max_days, expected_days, sla_days)
- create_risk_breakdown: Risk analysis (overall_score, factors: [{"name": "X", "score": 35, "impact": "high"}, ...])

Utility:
- clear_dashboard: Clear all visualizations before adding new ones

COLOR CONVENTIONS:
- Green (#22c55e): Good/positive values
- Yellow (#eab308): Warning/moderate
- Red (#ef4444): Bad/high risk
- Blue (#3b82f6): Neutral/informational

EXAMPLES:

Request: "Show me the best carriers"
Actions:
1. clear_dashboard()
2. query_shipment_data("Calculate on-time delivery rate by carrier, show percentage of shipments where otd_designation is 'On-Time' or 'Delivered Early' for each carrier_pseudo")
3. Transform results: Convert to [{"name": carrier, "value": rate*100}, ...]
4. create_bar_chart("Carrier On-Time Rates", data=transformed_data, y_label="On-Time %")
5. create_ranked_list("Top Carriers", items=[{"name": carrier, "value": f"{rate:.0%}"}, ...])

Request: "Distribution of delivery status"
Actions:
1. clear_dashboard()
2. query_shipment_data("Count shipments by otd_designation")
3. Transform to pie chart format: [{"name": "On-Time", "value": count, "color": "#22c55e"}, ...]
4. create_pie_chart("Delivery Status Distribution", data=transformed_data)
5. create_metric_card("Total Shipments", value=total_count)

Request: "Compare transport modes"
Actions:
1. clear_dashboard()
2. query_shipment_data("Calculate average actual_transit_days and on-time rate by carrier_mode")
3. Create comparison visualizations with the real data

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

IMPORTANT NOTES:
- Always query the database first - do not use placeholder or made-up data
- Transform query results to match visualization tool formats
- Round percentages appropriately (e.g., 0.876 -> "87.6%")
- After creating visualizations, provide a brief summary as bullet points with key insights from the data:
  Example format:
  "Here's what I found:
  • Swift Freight leads with 95% on-time delivery rate
  • Top 5 carriers handle 60% of total shipments
  • LTL mode averages 3.2 days transit vs 2.1 for Truckload"
- Do NOT propose additional visualizations or continue working - your task is complete after the summary
- Do NOT say things like "Now let me create more..." or "I'll also add..." - just summarize and stop
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
