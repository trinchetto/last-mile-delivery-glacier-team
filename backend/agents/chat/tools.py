"""
Tools for DeliveryIQ Chat Agent

Tools for analyzing delivery risks, lane performance, carrier recommendations,
and creating dashboard visualizations via the Analytical Agent.
"""

import json
import asyncio
from typing import Optional
from langchain_core.tools import tool


# =============================================================================
# MOCK DATA - Replace with actual database queries in production
# =============================================================================

MOCK_LANES = {
    "CHI-MIA": {
        "origin": "Chicago, IL",
        "destination": "Miami, FL",
        "distance_miles": 1380,
        "avg_transit_days": 2.5,
        "on_time_rate": 0.87,
        "delay_causes": ["Weather (35%)", "Traffic (25%)", "Carrier capacity (20%)", "Other (20%)"],
        "peak_season": "December-February",
        "volume_trend": "Increasing (+12% YoY)",
    },
    "LAX-NYC": {
        "origin": "Los Angeles, CA",
        "destination": "New York, NY",
        "distance_miles": 2800,
        "avg_transit_days": 4.5,
        "on_time_rate": 0.82,
        "delay_causes": ["Distance (40%)", "Weather (30%)", "Carrier issues (30%)"],
        "peak_season": "November-December",
        "volume_trend": "Stable",
    },
    "SEA-DEN": {
        "origin": "Seattle, WA",
        "destination": "Denver, CO",
        "distance_miles": 1320,
        "avg_transit_days": 2.0,
        "on_time_rate": 0.91,
        "delay_causes": ["Weather (50%)", "Traffic (30%)", "Other (20%)"],
        "peak_season": "June-August",
        "volume_trend": "Increasing (+8% YoY)",
    },
}

MOCK_CARRIERS = {
    "CARRIER_A": {
        "name": "FastFreight Express",
        "on_time_rate": 0.92,
        "cost_per_mile": 2.45,
        "coverage": ["Nationwide"],
        "specialties": ["Expedited", "Temperature-controlled"],
        "capacity": "High",
        "rating": 4.5,
    },
    "CARRIER_B": {
        "name": "EcoLogistics",
        "on_time_rate": 0.88,
        "cost_per_mile": 2.10,
        "coverage": ["West Coast", "Mountain", "Central"],
        "specialties": ["Sustainable", "LTL"],
        "capacity": "Medium",
        "rating": 4.2,
    },
    "CARRIER_C": {
        "name": "Premier Trucking",
        "on_time_rate": 0.95,
        "cost_per_mile": 2.85,
        "coverage": ["Nationwide"],
        "specialties": ["High-value", "White-glove"],
        "capacity": "Medium",
        "rating": 4.8,
    },
}


# =============================================================================
# DELIVERY ANALYSIS TOOLS
# =============================================================================

@tool
async def analyze_delivery_risk(
    origin: str,
    destination: str,
    delivery_date: Optional[str] = None,
    carrier: Optional[str] = None
) -> str:
    """
    Analyze risk factors for a delivery scenario.

    Use this to get a comprehensive risk assessment for a planned delivery.

    Args:
        origin: Origin city or location
        destination: Destination city or location
        delivery_date: Optional planned delivery date (YYYY-MM-DD)
        carrier: Optional carrier name
    """
    # Build risk factors (mock analysis)
    risk_factors = []
    risk_score = 0.0

    # Lane-based risk
    lane_key = f"{origin[:3].upper()}-{destination[:3].upper()}"
    if lane_key in MOCK_LANES:
        lane = MOCK_LANES[lane_key]
        if lane["on_time_rate"] < 0.85:
            risk_factors.append(f"Lane has below-average on-time rate ({lane['on_time_rate']:.0%})")
            risk_score += 0.2
        if lane["distance_miles"] > 2000:
            risk_factors.append(f"Long-haul route ({lane['distance_miles']} miles)")
            risk_score += 0.1
    else:
        risk_factors.append("Limited historical data for this lane")
        risk_score += 0.15

    # Seasonal risk (mock)
    if delivery_date:
        month = int(delivery_date.split("-")[1]) if "-" in delivery_date else 12
        if month in [11, 12, 1]:  # Peak season
            risk_factors.append("Peak shipping season - higher congestion expected")
            risk_score += 0.15
        if month in [1, 2, 12]:  # Winter
            risk_factors.append("Winter weather may cause delays")
            risk_score += 0.1

    # Carrier risk
    if carrier:
        carrier_key = carrier.upper().replace(" ", "_")
        for key, data in MOCK_CARRIERS.items():
            if carrier.lower() in data["name"].lower():
                if data["on_time_rate"] >= 0.92:
                    risk_factors.append(f"Reliable carrier ({data['on_time_rate']:.0%} on-time)")
                    risk_score -= 0.1
                break
        else:
            risk_factors.append("Carrier performance data not available")
            risk_score += 0.1

    # Normalize score
    risk_score = max(0.0, min(1.0, risk_score + 0.3))  # Base risk

    # Determine risk level
    if risk_score >= 0.7:
        risk_level = "High"
    elif risk_score >= 0.4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Recommendations
    recommendations = []
    if risk_score >= 0.5:
        recommendations.append("Consider adding buffer time to delivery window")
        recommendations.append("Monitor weather conditions before shipment")
    if "Peak" in str(risk_factors):
        recommendations.append("Book carrier capacity early")
    if not carrier:
        recommendations.append("Select a carrier with high on-time performance for this lane")

    return json.dumps({
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "origin": origin,
        "destination": destination,
        "delivery_date": delivery_date,
        "carrier": carrier,
    }, indent=2)


@tool
async def get_lane_performance(origin: str, destination: str) -> str:
    """
    Get performance metrics for a specific delivery lane.

    Use this to understand historical performance for a route.

    Args:
        origin: Origin city or location
        destination: Destination city or location
    """
    # Try to find matching lane
    lane_key = f"{origin[:3].upper()}-{destination[:3].upper()}"

    if lane_key in MOCK_LANES:
        lane = MOCK_LANES[lane_key]
        return json.dumps({
            "lane": f"{lane['origin']} to {lane['destination']}",
            "distance_miles": lane["distance_miles"],
            "avg_transit_days": lane["avg_transit_days"],
            "on_time_rate": f"{lane['on_time_rate']:.0%}",
            "delay_causes": lane["delay_causes"],
            "peak_season": lane["peak_season"],
            "volume_trend": lane["volume_trend"],
            "data_available": True,
        }, indent=2)
    else:
        # Generate estimated data
        return json.dumps({
            "lane": f"{origin} to {destination}",
            "distance_miles": "Estimated: 500-2000",
            "avg_transit_days": "Estimated: 2-5 days",
            "on_time_rate": "Industry average: ~85%",
            "delay_causes": ["Weather", "Traffic", "Carrier capacity"],
            "peak_season": "November-January (typical)",
            "volume_trend": "No specific data",
            "data_available": False,
            "note": "Limited historical data for this lane. Estimates based on industry averages.",
        }, indent=2)


@tool
async def search_carriers(
    criteria: Optional[str] = None,
    min_on_time_rate: Optional[float] = None,
    max_cost_per_mile: Optional[float] = None
) -> str:
    """
    Search and compare carriers based on criteria.

    Use this to find carriers that match specific requirements.

    Args:
        criteria: Search criteria like 'expedited', 'temperature-controlled', 'nationwide'
        min_on_time_rate: Minimum on-time delivery rate (0-1)
        max_cost_per_mile: Maximum cost per mile
    """
    results = []

    for carrier_id, data in MOCK_CARRIERS.items():
        # Apply filters
        if min_on_time_rate and data["on_time_rate"] < min_on_time_rate:
            continue
        if max_cost_per_mile and data["cost_per_mile"] > max_cost_per_mile:
            continue
        if criteria:
            criteria_lower = criteria.lower()
            match = False
            for specialty in data["specialties"]:
                if criteria_lower in specialty.lower():
                    match = True
                    break
            for coverage in data["coverage"]:
                if criteria_lower in coverage.lower():
                    match = True
                    break
            if not match and criteria_lower not in data["name"].lower():
                continue

        results.append({
            "carrier_id": carrier_id,
            "name": data["name"],
            "on_time_rate": f"{data['on_time_rate']:.0%}",
            "cost_per_mile": f"${data['cost_per_mile']:.2f}",
            "coverage": data["coverage"],
            "specialties": data["specialties"],
            "capacity": data["capacity"],
            "rating": data["rating"],
        })

    return json.dumps({
        "carriers_found": len(results),
        "filters_applied": {
            "criteria": criteria,
            "min_on_time_rate": min_on_time_rate,
            "max_cost_per_mile": max_cost_per_mile,
        },
        "carriers": results,
    }, indent=2)


@tool
async def get_carrier_details(carrier_name: str) -> str:
    """
    Get detailed information about a specific carrier.

    Use this to get comprehensive carrier data.

    Args:
        carrier_name: Name or ID of the carrier
    """
    # Search for carrier
    for carrier_id, data in MOCK_CARRIERS.items():
        if carrier_name.lower() in data["name"].lower() or carrier_name.upper() == carrier_id:
            return json.dumps({
                "carrier_id": carrier_id,
                "name": data["name"],
                "on_time_rate": f"{data['on_time_rate']:.0%}",
                "cost_per_mile": f"${data['cost_per_mile']:.2f}",
                "coverage_areas": data["coverage"],
                "specialties": data["specialties"],
                "capacity_level": data["capacity"],
                "customer_rating": f"{data['rating']}/5.0",
                "performance_trend": "Stable" if data["on_time_rate"] >= 0.9 else "Improving",
                "recommended_for": data["specialties"],
            }, indent=2)

    return json.dumps({
        "error": f"Carrier '{carrier_name}' not found",
        "available_carriers": [d["name"] for d in MOCK_CARRIERS.values()],
    }, indent=2)


@tool
async def get_delivery_window_recommendation(
    origin: str,
    destination: str,
    required_arrival_date: str,
    priority: Optional[str] = "standard"
) -> str:
    """
    Get recommended delivery window and shipping date.

    Use this to calculate optimal shipping timing.

    Args:
        origin: Origin city
        destination: Destination city
        required_arrival_date: When the package must arrive (YYYY-MM-DD)
        priority: 'standard', 'expedited', or 'economy'
    """
    # Find lane data
    lane_key = f"{origin[:3].upper()}-{destination[:3].upper()}"
    lane = MOCK_LANES.get(lane_key, {"avg_transit_days": 3.0, "on_time_rate": 0.85})

    base_days = lane.get("avg_transit_days", 3.0)

    # Adjust for priority
    if priority == "expedited":
        transit_days = max(1.0, base_days * 0.7)
        buffer_days = 0.5
    elif priority == "economy":
        transit_days = base_days * 1.3
        buffer_days = 2.0
    else:
        transit_days = base_days
        buffer_days = 1.0

    # Calculate ship date (simplified)
    total_lead_time = transit_days + buffer_days

    return json.dumps({
        "origin": origin,
        "destination": destination,
        "required_arrival": required_arrival_date,
        "priority": priority,
        "recommended_transit_days": round(transit_days, 1),
        "buffer_days": buffer_days,
        "total_lead_time_days": round(total_lead_time, 1),
        "ship_by": f"{int(total_lead_time)} days before {required_arrival_date}",
        "lane_on_time_rate": f"{lane.get('on_time_rate', 0.85):.0%}",
        "confidence": "High" if lane_key in MOCK_LANES else "Medium",
    }, indent=2)


# =============================================================================
# AGENT COMMUNICATION
# =============================================================================

@tool
def message_analytical_agent(message: str) -> str:
    """
    Send a message to the Analytical Agent for dashboard visualizations.

    The Analytical Agent is your colleague specialized in creating visual
    representations of data. Send them a message when you need charts, graphs,
    metrics, or any visual analytics created on the user's dashboard.

    You can communicate naturally - tell them what you need and any relevant
    context. They will interpret your message and create appropriate visualizations.

    Args:
        message: Your message to the Analytical Agent. Be clear about what
                 visualizations would help the user. You can include:
                 - What data to visualize
                 - Suggested chart types (bar, pie, line, gauge, table, list)
                 - Any specific metrics or comparisons needed
                 - Context from the conversation that might be relevant

    Returns:
        Acknowledgment that your message was sent
    """
    # Marker for the orchestrator to route to analytical agent
    return json.dumps({
        "status": "message_to_analytical",
        "message": message,
        "acknowledged": True
    })


# =============================================================================
# EXPORT TOOLS
# =============================================================================

CHAT_TOOLS = [
    analyze_delivery_risk,
    get_lane_performance,
    search_carriers,
    get_carrier_details,
    get_delivery_window_recommendation,
    message_analytical_agent,  # Inter-agent communication
]
