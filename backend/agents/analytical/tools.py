"""
Visualization Tools for Delivery Analytical Agent

These tools create structured data that the frontend renders as charts,
lists, and metrics on the Agent Dashboard.

Each tool returns JSON that specifies the visualization type and data.
"""

import json
from typing import Optional
from langchain_core.tools import tool


# =============================================================================
# CHART CREATION TOOLS
# =============================================================================

@tool
def create_pie_chart(
    title: str,
    data: str,
    description: Optional[str] = None
) -> str:
    """
    Create a pie chart visualization for the dashboard.

    Use this to show distribution or proportions of categories.
    Good for: carrier market share, delay causes breakdown, delivery status distribution.

    Args:
        title: Chart title (e.g., "Carrier Performance Distribution")
        data: JSON string of data points. Format: [{"name": "Label", "value": 45}, ...]
        description: Optional description text shown below chart

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_data = json.loads(data) if isinstance(data, str) else data
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid data format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "pie_chart",
            "title": title,
            "data": parsed_data,
            "description": description,
        }
    })


@tool
def create_bar_chart(
    title: str,
    data: str,
    x_label: Optional[str] = None,
    y_label: Optional[str] = None,
    description: Optional[str] = None,
    orientation: Optional[str] = "vertical"
) -> str:
    """
    Create a bar chart visualization for the dashboard.

    Use this to compare values across categories.
    Good for: carrier comparison, lane performance, monthly trends.

    Args:
        title: Chart title (e.g., "Top Carriers by On-Time Rate")
        data: JSON string. Format: [{"name": "Label", "value": 85, "color": "#22c55e"}, ...]
        x_label: Optional label for X axis
        y_label: Optional label for Y axis
        description: Optional description text
        orientation: "vertical" or "horizontal"

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_data = json.loads(data) if isinstance(data, str) else data
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid data format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "bar_chart",
            "title": title,
            "data": parsed_data,
            "x_label": x_label,
            "y_label": y_label,
            "description": description,
            "orientation": orientation,
        }
    })


@tool
def create_line_chart(
    title: str,
    data: str,
    x_label: Optional[str] = None,
    y_label: Optional[str] = None,
    description: Optional[str] = None
) -> str:
    """
    Create a line chart visualization for the dashboard.

    Use this to show trends over time.
    Good for: performance trends, volume over time, seasonal patterns.

    Args:
        title: Chart title (e.g., "On-Time Rate Trend - Last 6 Months")
        data: JSON string. Format: [{"x": "Jan", "y": 85}, {"x": "Feb", "y": 87}, ...]
        x_label: Optional label for X axis
        y_label: Optional label for Y axis
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_data = json.loads(data) if isinstance(data, str) else data
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid data format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "line_chart",
            "title": title,
            "data": parsed_data,
            "x_label": x_label,
            "y_label": y_label,
            "description": description,
        }
    })


@tool
def create_gauge_chart(
    title: str,
    value: float,
    max_value: float = 100,
    thresholds: Optional[str] = None,
    description: Optional[str] = None
) -> str:
    """
    Create a gauge/meter visualization for the dashboard.

    Use this to show a single metric with context (good/warning/bad zones).
    Good for: risk scores, compliance rates, performance metrics.

    Args:
        title: Chart title (e.g., "Delivery Risk Score")
        value: Current value to display
        max_value: Maximum value for the gauge (default 100)
        thresholds: JSON string defining color zones. Format: {"green": 70, "yellow": 40}
                   (green above 70, yellow 40-70, red below 40)
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_thresholds = json.loads(thresholds) if thresholds else {"green": 70, "yellow": 40}
    except json.JSONDecodeError:
        parsed_thresholds = {"green": 70, "yellow": 40}

    return json.dumps({
        "visualization": {
            "type": "gauge_chart",
            "title": title,
            "value": value,
            "max_value": max_value,
            "thresholds": parsed_thresholds,
            "description": description,
        }
    })


# =============================================================================
# LIST AND TABLE TOOLS
# =============================================================================

@tool
def create_ranked_list(
    title: str,
    items: str,
    description: Optional[str] = None,
    show_rank: bool = True
) -> str:
    """
    Create a ranked list visualization for the dashboard.

    Use this to show top/bottom performers or ordered items.
    Good for: best carriers, worst lanes, top recommendations.

    Args:
        title: List title (e.g., "Top 5 Carriers for This Lane")
        items: JSON string. Format: [{"name": "Item", "value": "85%", "subtitle": "Optional", "badge": "Recommended"}, ...]
        description: Optional description text
        show_rank: Whether to show rank numbers (1, 2, 3...)

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_items = json.loads(items) if isinstance(items, str) else items
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid items format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "ranked_list",
            "title": title,
            "items": parsed_items,
            "description": description,
            "show_rank": show_rank,
        }
    })


@tool
def create_comparison_table(
    title: str,
    columns: str,
    rows: str,
    description: Optional[str] = None,
    highlight_best: bool = True
) -> str:
    """
    Create a comparison table visualization for the dashboard.

    Use this to compare multiple items across multiple dimensions.
    Good for: carrier comparison, lane analysis, option evaluation.

    Args:
        title: Table title (e.g., "Carrier Comparison")
        columns: JSON string of column headers. Format: ["Carrier", "On-Time", "Cost", "Rating"]
        rows: JSON string of row data. Format: [["FastFreight", "92%", "$2.45", "4.5"], ...]
        description: Optional description text
        highlight_best: Whether to highlight best values in each column

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_columns = json.loads(columns) if isinstance(columns, str) else columns
        parsed_rows = json.loads(rows) if isinstance(rows, str) else rows
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid format. Expected JSON arrays."})

    return json.dumps({
        "visualization": {
            "type": "comparison_table",
            "title": title,
            "columns": parsed_columns,
            "rows": parsed_rows,
            "description": description,
            "highlight_best": highlight_best,
        }
    })


# =============================================================================
# METRIC CARD TOOLS
# =============================================================================

@tool
def create_metric_card(
    title: str,
    value: str,
    change: Optional[str] = None,
    change_type: Optional[str] = None,
    icon: Optional[str] = None,
    description: Optional[str] = None
) -> str:
    """
    Create a single metric card for the dashboard.

    Use this to highlight a key performance indicator.
    Good for: risk score, on-time rate, average transit time.

    Args:
        title: Metric name (e.g., "On-Time Rate")
        value: Main value to display (e.g., "87%", "3.2 days")
        change: Optional change indicator (e.g., "+5%", "-2 days")
        change_type: "positive", "negative", or "neutral"
        icon: Icon name: "truck", "clock", "alert", "check", "trending"
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    return json.dumps({
        "visualization": {
            "type": "metric_card",
            "title": title,
            "value": value,
            "change": change,
            "change_type": change_type,
            "icon": icon,
            "description": description,
        }
    })


@tool
def create_metric_group(
    title: str,
    metrics: str,
    description: Optional[str] = None
) -> str:
    """
    Create a group of metric cards for the dashboard.

    Use this to show multiple related KPIs together.
    Good for: lane summary, carrier overview, delivery status breakdown.

    Args:
        title: Group title (e.g., "Lane Performance Summary")
        metrics: JSON string of metrics. Format: [{"title": "On-Time", "value": "87%", "icon": "check"}, ...]
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_metrics = json.loads(metrics) if isinstance(metrics, str) else metrics
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid metrics format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "metric_group",
            "title": title,
            "metrics": parsed_metrics,
            "description": description,
        }
    })


# =============================================================================
# SPECIALIZED DELIVERY VISUALIZATIONS
# =============================================================================

@tool
def create_delivery_timeline(
    title: str,
    min_days: int,
    max_days: int,
    expected_days: float,
    sla_days: Optional[int] = None,
    description: Optional[str] = None
) -> str:
    """
    Create a delivery timeline visualization.

    Use this to show expected delivery windows with confidence ranges.
    Good for: delivery estimates, transit time analysis.

    Args:
        title: Timeline title (e.g., "Expected Delivery Window")
        min_days: Minimum transit days
        max_days: Maximum transit days
        expected_days: Expected/average transit days
        sla_days: Optional SLA target in days
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    return json.dumps({
        "visualization": {
            "type": "delivery_timeline",
            "title": title,
            "min_days": min_days,
            "max_days": max_days,
            "expected_days": expected_days,
            "sla_days": sla_days,
            "description": description,
        }
    })


@tool
def create_risk_breakdown(
    title: str,
    overall_score: float,
    factors: str,
    description: Optional[str] = None
) -> str:
    """
    Create a risk breakdown visualization.

    Use this to show overall risk with contributing factors.
    Good for: delivery risk analysis, compliance breakdown.

    Args:
        title: Title (e.g., "Delivery Risk Analysis")
        overall_score: Overall risk score 0-100 (higher = more risk)
        factors: JSON string of risk factors. Format: [{"name": "Weather", "score": 35, "impact": "high"}, ...]
        description: Optional description text

    Returns:
        JSON with visualization spec for frontend
    """
    try:
        parsed_factors = json.loads(factors) if isinstance(factors, str) else factors
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid factors format. Expected JSON array."})

    return json.dumps({
        "visualization": {
            "type": "risk_breakdown",
            "title": title,
            "overall_score": overall_score,
            "factors": parsed_factors,
            "description": description,
        }
    })


# =============================================================================
# CLEAR DASHBOARD TOOL
# =============================================================================

@tool
def clear_dashboard() -> str:
    """
    Clear all visualizations from the dashboard.

    Use this to reset the dashboard before creating new visualizations.

    Returns:
        JSON with clear command for frontend
    """
    return json.dumps({
        "visualization": {
            "type": "clear",
        }
    })


# =============================================================================
# IMPORT DATA QUERY TOOL
# =============================================================================

from agents.analytical.data_tool import query_shipment_data

# =============================================================================
# EXPORT TOOLS
# =============================================================================

ANALYTICAL_TOOLS = [
    # Data query tool - use this FIRST to get real data
    query_shipment_data,
    # Visualization tools
    create_pie_chart,
    create_bar_chart,
    create_line_chart,
    create_gauge_chart,
    create_ranked_list,
    create_comparison_table,
    create_metric_card,
    create_metric_group,
    create_delivery_timeline,
    create_risk_breakdown,
    clear_dashboard,
]
