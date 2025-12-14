import os
import pandas as pd
import pandasai as pai
from pandasai import SmartDataframe
from pandasai_litellm.litellm import LiteLLM

# OpenRouter key

# Pick any OpenRouter model (examples)
# - "openrouter/openrouter/auto" (OpenRouter auto-router)
# - "openrouter/anthropic/claude-3.5-sonnet"
# - "openrouter/openai/gpt-4o-mini"
llm = LiteLLM(
    model="openrouter/openai/gpt-4o-mini",
    api_key="", #API keys are in discord
)

pai.config.set({"llm": llm})

df = pd.DataFrame({"a": [1, 2, 3], "b": [10, 20, 30]})
sdf = SmartDataframe(df)

print(sdf.chat("What is the correlation between a and b?"))
