"""
Configuration schema for the DeliveryIQ agents.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from langchain_core.runnables import RunnableConfig


@dataclass
class Configuration:
    """Configuration for the DeliveryIQ agents."""

    # Model settings
    model: str = field(default_factory=lambda: os.getenv("MODEL", "claude-sonnet-4-5-20250929"))
    temperature: float = 0.3

    # Chat agent settings
    chat_system_prompt: str = ""

    # Other settings
    max_retries: int = 3
    timeout: int = 60


def get_config_from_runnable_config(config: Optional[RunnableConfig]) -> Configuration:
    """
    Extract Configuration from RunnableConfig.

    Args:
        config: RunnableConfig from LangGraph

    Returns:
        Configuration instance
    """
    if config is None:
        return Configuration()

    configurable = config.get("configurable", {})

    return Configuration(
        model=configurable.get("model", os.getenv("MODEL", "claude-sonnet-4-5-20250929")),
        temperature=configurable.get("temperature", 0.3),
        chat_system_prompt=configurable.get("chat_system_prompt", ""),
        max_retries=configurable.get("max_retries", 3),
        timeout=configurable.get("timeout", 60),
    )
