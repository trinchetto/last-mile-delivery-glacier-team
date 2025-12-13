"""
Delivery Analytical Agent

Creates visualizations and analytics for the DeliveryIQ dashboard.
Called by the chat agent to generate charts, lists, and metrics.
"""

from agents.analytical.agent import run_analytical_agent
from agents.analytical.tools import ANALYTICAL_TOOLS

__all__ = ["run_analytical_agent", "ANALYTICAL_TOOLS"]
