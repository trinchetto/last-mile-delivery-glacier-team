"""
Data Query Tool for the Analytical Agent

Provides access to real shipment data via the TabularAssistant.
Returns structured JSON data suitable for visualization tools.
"""

import os
import json
from typing import Optional
from functools import lru_cache

from langchain_core.tools import tool

from tools.tabular_assistant import TabularAssistant


# Singleton instance of TabularAssistant
_assistant_instance: Optional[TabularAssistant] = None


def get_assistant() -> TabularAssistant:
    """Get or create the TabularAssistant singleton."""
    global _assistant_instance

    if _assistant_instance is None:
        # Determine LLM provider from environment
        llm_provider = os.getenv("PANDAS_LLM_PROVIDER", "anthropic")

        if llm_provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            models = {
                "analyst_model": "claude-sonnet-4-20250514",
                "prompt2pandas_model": "claude-sonnet-4-20250514"
            }
        else:
            api_key = os.getenv("OPENROUTER_API_KEY")
            models = {
                "analyst_model": "openrouter/openai/gpt-4o-mini",
                "prompt2pandas_model": "openrouter/openai/gpt-4o-mini"
            }

        _assistant_instance = TabularAssistant(
            llm_provider=llm_provider,
            api_key=api_key,
            models=models,
            temperatures={
                "analyst_temperature": 0.3,
                "prompt2pandas_temperature": 0.5
            }
        )

    return _assistant_instance


@tool
def query_shipment_data(query: str) -> str:
    """
    Query the last-mile delivery shipment database using natural language.
    Returns structured JSON data suitable for creating visualizations.

    IMPORTANT: This tool queries REAL shipment data with ~10K records.
    Use this to get actual data for charts and visualizations.

    Available data columns:
    - carrier_name: Friendly carrier name (e.g., "Swift Freight", "Eagle Logistics")
    - carrier_mode: Transportation mode (LTL, Truckload, TL Dry, TL Flatbed)
    - carrier_pseudo: Carrier ID (anonymized) - prefer carrier_name for display
    - actual_ship / actual_delivery: Datetime of shipment and delivery
    - customer_distance: Miles between origin and destination
    - all_modes_goal_transit_days: Target transit days
    - actual_transit_days: Actual transit days taken
    - otd_designation: On-Time Delivery status (On-Time, Delivered Early, Late)
    - origin_zip_3d / dest_zip_3d: 3-digit zip codes
    - lane_zip3_pair: Route identifier (origin->destination)
    - lane_id: Lane identifier

    Example queries:
    - "Count shipments by carrier_name"
    - "Calculate on-time delivery rate by carrier_name"
    - "Average transit days by lane"
    - "Top 10 carriers by shipment count, show carrier_name"
    - "Distribution of otd_designation"
    - "Monthly shipment trends"

    Args:
        query: Natural language query about shipment data.
               Be specific about what aggregation or calculation you need.

    Returns:
        JSON string with structure:
        {
            "data": [...],  // Array of records or scalar value
            "format": "records" | "scalar" | "error",
            "columns": [...] | null,  // Column names if DataFrame
            "error": null | "error message"
        }

        For visualization tools, the data is typically an array like:
        [{"name": "Carrier_A", "value": 92.5}, {"name": "Carrier_B", "value": 87.3}]
    """
    assistant = get_assistant()
    result = assistant.run_for_visualization(query)
    return json.dumps(result, default=str)


# Export the tool
DATA_TOOLS = [query_shipment_data]
