"""
TabularAssistant - GenAI-powered assistant for querying logistics data.

Supports both OpenRouter and Anthropic LLM providers.
"""

import os
import json
from pathlib import Path

from langchain_community.chat_models import ChatLiteLLM
from langchain_anthropic import ChatAnthropic
import litellm
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain_core.output_parsers import StrOutputParser

import pandas as pd
import pandasai as pai
from pandasai.llm import LLM

# Get the directory where this file is located
BASE_DIR = Path(__file__).parent.parent


class PandasAILiteLLM(LLM):
    """Custom LiteLLM wrapper for PandasAI."""
    
    def __init__(self, model: str, api_key: str = None, temperature: float = 0.5, **kwargs):
        super().__init__(api_key=api_key, **kwargs)
        self.model = model
        self.temperature = temperature
        
    def call(self, instruction, context=None):
        """Call litellm completion."""
        messages = [{"role": "user", "content": str(instruction)}]
        response = litellm.completion(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            api_key=self.api_key
        )
        return response.choices[0].message.content


def load_prompt(yaml_path: str | Path, prompt_id: str) -> str:
    """Load a prompt string from a YAML file."""
    import yaml
    yaml_path = Path(yaml_path)
    if not yaml_path.exists():
        raise FileNotFoundError(f"YAML file not found: {yaml_path}")
    with yaml_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if prompt_id not in data:
        raise KeyError(f"Prompt id '{prompt_id}' not found in {yaml_path}")
    return data[prompt_id]


class TabularAssistant:
    """
    TabularAssistant is a GenAI-powered assistant that enables users to
    interact conversationally with tabular logistics and supply chain data.

    Supports both OpenRouter and Anthropic as LLM providers.
    """

    def __init__(
        self,
        llm_provider: str = "anthropic",
        api_key: str = None,
        models: dict = None,
        temperatures: dict = None,
        data_path: str = None,
        semantic_path: str = None
    ):
        """
        Initialize the TabularAssistant.

        Parameters
        ----------
        llm_provider : str
            LLM provider to use: "anthropic" or "openrouter"
        api_key : str
            API key for the selected provider
        models : dict
            Model names for analyst and prompt2pandas. Example:
            {"analyst_model": "claude-sonnet-4-20250514", "prompt2pandas_model": "claude-sonnet-4-20250514"}
        temperatures : dict
            Temperature settings. Example:
            {"analyst_temperature": 0.3, "prompt2pandas_temperature": 0.5}
        data_path : str
            Path to the CSV data file
        semantic_path : str
            Path to the JSON schema file
        """
        self.llm_provider = llm_provider
        self.api_key = api_key

        # Default models based on provider
        if models is None:
            if llm_provider == "anthropic":
                models = {
                    "analyst_model": "claude-sonnet-4-20250514",
                    "prompt2pandas_model": "claude-sonnet-4-20250514"
                }
            else:
                models = {
                    "analyst_model": "openrouter/openai/gpt-4o-mini",
                    "prompt2pandas_model": "openrouter/openai/gpt-4o-mini"
                }

        if temperatures is None:
            temperatures = {
                "analyst_temperature": 0.3,
                "prompt2pandas_temperature": 0.5
            }

        # Default paths relative to backend directory
        if data_path is None:
            data_path = str(BASE_DIR / "data" / "last-mile-data.csv")
        if semantic_path is None:
            semantic_path = str(BASE_DIR / "data" / "last-mile-data.json")

        analyst_temperature = temperatures["analyst_temperature"]
        prompt2pandas_temperature = temperatures["prompt2pandas_temperature"]
        analyst_model = models["analyst_model"]
        prompt2pandas_model = models["prompt2pandas_model"]

        self._create_prompt_analyst(
            analyst_temperature=analyst_temperature,
            analyst_model=analyst_model,
        )
        self._create_answer_explainer(
            analyst_temperature=analyst_temperature,
            analyst_model=analyst_model,
        )
        self._create_tabular_bot(
            data_path=data_path,
            semantic_path=semantic_path,
            prompt2pandas_model=prompt2pandas_model,
            prompt2pandas_temperature=prompt2pandas_temperature,
        )

    def _get_langchain_llm(self, model: str, temperature: float):
        """Get LangChain LLM based on provider."""
        if self.llm_provider == "anthropic":
            return ChatAnthropic(
                model=model,
                api_key=self.api_key,
                temperature=temperature,
            )
        else:
            # OpenRouter via LiteLLM
            return ChatLiteLLM(
                model=model,
                api_key=self.api_key,
                temperature=temperature,
            )

    def _get_pandasai_llm(self, model: str, temperature: float):
        """Get PandasAI-compatible LLM based on provider."""
        if self.llm_provider == "anthropic":
            # PandasAI with Anthropic - use LiteLLM with anthropic prefix
            return PandasAILiteLLM(
                model=f"anthropic/{model}",
                api_key=self.api_key,
                temperature=temperature,
            )
        else:
            # OpenRouter
            return PandasAILiteLLM(
                model=model,
                api_key=self.api_key,
                temperature=temperature,
            )

    def _create_tabular_bot(
        self,
        data_path: str,
        semantic_path: str,
        prompt2pandas_model: str,
        prompt2pandas_temperature: float
    ):
        """Initialize PandasAI with the data."""
        lite_llm = self._get_pandasai_llm(prompt2pandas_model, prompt2pandas_temperature)

        self.tab_data = pai.read_csv(data_path)

        pai.config.set({
            "llm": lite_llm,
            "save_charts": True,
            "open_charts": False,
            "enable_cache": False,
            "verbose": False,
        })

        semantic_output_folder = "hackathon/last-mile"
        folder_path = os.path.join("datasets", semantic_output_folder)

        if not os.path.isdir(folder_path):
            with open(semantic_path, "r") as f:
                column_info = json.load(f)

            pai.create(
                path=semantic_output_folder,
                df=self.tab_data,
                description="Last-mile delivery shipment data with carrier performance, transit times, and on-time delivery metrics",
                columns=column_info,
            )
        self.df = pai.load(semantic_output_folder)

    def _create_answer_explainer(
        self,
        analyst_temperature: float,
        analyst_model: str
    ):
        """Create the chain for explaining answers."""
        lite_llm = self._get_langchain_llm(analyst_model, analyst_temperature)

        prompts_path = BASE_DIR / "prompts" / "tabular_prompts.yaml"
        system_msg = load_prompt(prompts_path, "answer_explanation")

        explainer_template = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_msg),
            HumanMessagePromptTemplate.from_template(
                "**user_question**:\n{user_question}\n\n"
                "**output**:\n{output}\n\n"
                "**code_executed**:\n{code_executed}"
            ),
        ])

        self.answer_explainer_chain = explainer_template | lite_llm | StrOutputParser()

    def _skip_search(self, analyzed_prompt: str) -> bool:
        """Check if the query should be skipped."""
        return "[[SKIP]]" in analyzed_prompt

    def _create_prompt_analyst(
        self,
        analyst_temperature: float,
        analyst_model: str
    ):
        """Create the chain for analyzing prompts."""
        lite_llm = self._get_langchain_llm(analyst_model, analyst_temperature)

        prompts_path = BASE_DIR / "prompts" / "tabular_prompts.yaml"
        system_msg = load_prompt(prompts_path, "prompt_understanding")

        analyst_template = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_msg),
            HumanMessagePromptTemplate.from_template("**user_query**: {user_query}"),
        ])
        self.prompt_analyst_chain = analyst_template | lite_llm | StrOutputParser()

    def is_image_generated(self, reply_dict: dict):
        """Returns the image path if a chart was generated, otherwise None."""
        if isinstance(reply_dict, dict) and reply_dict.get("type") == "chart":
            return reply_dict.get("value")
        return None

    def run(self, user_query: str) -> dict:
        """
        Execute a conversational query against the tabular data.
        Returns markdown-formatted response with explanation.

        Parameters
        ----------
        user_query : str
            Natural language question about the data.

        Returns
        -------
        dict
            Contains: prompt_analysis, output, code_executed, explanation, image_path
        """
        analyzed_prompt = self.prompt_analyst_chain.invoke(
            input={"user_query": user_query}
        )

        if self._skip_search(analyzed_prompt):
            return {
                "prompt_analysis": analyzed_prompt,
                "output": "",
                "code_executed": "",
                "explanation": "The question is outside my knowledge base. Please rephrase or try another question.",
                "image_path": None
            }

        analyzed_prompt += "\n\nIf operating on dates, remember that date columns are stored as VARCHAR in format YYYY-MM-DD HH:MM:SS"
        reply_pandas = self.df.chat(analyzed_prompt)
        code_executed = reply_pandas.last_code_executed

        if isinstance(reply_pandas, pai.core.response.dataframe.DataFrameResponse):
            reply_md = reply_pandas.value.to_markdown(index=False, tablefmt="github")
        else:
            reply_str = str(reply_pandas)
            reply_md = f"**{reply_str}**"

        output_explained = self.answer_explainer_chain.invoke(input={
            "user_question": user_query,
            "code_executed": code_executed,
            "output": reply_md,
        })

        image_value = self.is_image_generated(reply_pandas.__dict__)

        return {
            "prompt_analysis": analyzed_prompt,
            "output": reply_md,
            "code_executed": code_executed,
            "explanation": output_explained,
            "image_path": image_value
        }

    def run_for_visualization(self, user_query: str) -> dict:
        """
        Execute a query and return structured data suitable for visualizations.
        Returns JSON-serializable data instead of markdown.

        Parameters
        ----------
        user_query : str
            Natural language question about the data.

        Returns
        -------
        dict
            Contains:
            - data: List of records (dicts) or scalar value
            - format: "records" for DataFrame results, "scalar" for single values
            - columns: List of column names (if DataFrame)
            - code_executed: The Python code that was executed
            - error: Error message if query failed
        """
        try:
            analyzed_prompt = self.prompt_analyst_chain.invoke(
                input={"user_query": user_query}
            )

            if self._skip_search(analyzed_prompt):
                return {
                    "data": None,
                    "format": "error",
                    "error": "Query is outside the knowledge base. Please rephrase.",
                    "code_executed": ""
                }

            analyzed_prompt += "\n\nIf operating on dates, remember that date columns are stored as VARCHAR in format YYYY-MM-DD HH:MM:SS"
            reply_pandas = self.df.chat(analyzed_prompt)
            code_executed = reply_pandas.last_code_executed

            if isinstance(reply_pandas, pai.core.response.dataframe.DataFrameResponse):
                df = reply_pandas.value
                return {
                    "data": df.to_dict(orient='records'),
                    "format": "records",
                    "columns": list(df.columns),
                    "code_executed": code_executed,
                    "error": None
                }
            else:
                # Scalar or other value
                value = reply_pandas
                if hasattr(reply_pandas, 'value'):
                    value = reply_pandas.value
                return {
                    "data": value,
                    "format": "scalar",
                    "columns": None,
                    "code_executed": code_executed,
                    "error": None
                }

        except Exception as e:
            return {
                "data": None,
                "format": "error",
                "error": str(e),
                "code_executed": ""
            }
