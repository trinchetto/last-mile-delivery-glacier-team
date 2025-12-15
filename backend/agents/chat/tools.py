"""
Tools for DeliveryIQ Chat Agent

The Chat Agent handles conversation and delegates data analysis/visualization
to the Analytical Agent via tool calling.
"""

import json
from langchain_core.tools import tool


@tool
def request_data_analysis(request: str) -> str:
    """
    Request data analysis and visualizations from the Analytical Agent.

    Use this tool when the user asks about:
    - Carrier performance, comparisons, or recommendations
    - Lane analysis or route performance
    - Shipment statistics, counts, or trends
    - On-time delivery rates or transit times
    - Any visualization, chart, or dashboard request
    - Any question requiring real logistics data

    Args:
        request: Describe what data analysis or visualizations are needed.
                 Be specific about:
                 - What data to query (carriers, lanes, shipments, etc.)
                 - What metrics to calculate (on-time rates, counts, averages)
                 - What visualizations to create (bar chart, pie chart, table, etc.)

    Returns:
        Confirmation that the request was sent to the Analytical Agent
    """
    return json.dumps({
        "status": "routed_to_analytical",
        "request": request
    })


CHAT_TOOLS = [request_data_analysis]
