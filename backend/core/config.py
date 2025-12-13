"""
LangSmith and environment configuration.
"""

import os


def setup_langsmith():
    """
    Setup LangSmith tracing if API key is available.
    """
    langsmith_api_key = os.getenv("LANGSMITH_API_KEY")

    if langsmith_api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "deliveryiq")
        print("[LangSmith] Tracing enabled")
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        print("[LangSmith] Tracing disabled (no API key)")
