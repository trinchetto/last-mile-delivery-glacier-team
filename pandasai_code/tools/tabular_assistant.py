
from langchain_community.chat_models import ChatLiteLLM
from pandasai_litellm.litellm import LiteLLM
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

from langchain_core.output_parsers import StrOutputParser
from utils.utils import load_prompt
import pandas as pd
import pandasai as pai
import os
import json


class TabularAssistant:
    """
    TabularAssistant is a GenAI-powered assistant that enables users to
    interact conversationally with tabular logistics and supply chain data.

    The assistant is designed to:
    - Understand logistics-specific terminology and colloquial supply chain language
      (e.g., lead time, OTIF, backlog, dead stock, inbound/outbound, last-mile, etc.)
    - Translate natural language questions into data operations on tabular datasets
    - Generate insights, summaries, and answers grounded strictly in the provided data

    At its core, the assistant leverages:
    - LangChain for prompt orchestration, memory, and LLM interaction
    - PandasAI for dataframe reasoning and natural-language-to-code translation
    """

    def __init__(
        self,
        open_router_key,
        models,
        temperatures,
        data_path,
        semantic_path
    ):
        """
        Constructor for the TabularAssistant.

        Parameters
        ----------
        """



        analyst_temperature=temperatures["analyst_temperature"]
        prompt2pandas_temperature=temperatures["prompt2pandas_temperature"]

        analyst_model=models["analyst_model"]
        prompt2pandas_model=models["prompt2pandas_model"]

        self._create_promp_analyst(
                        open_router_key=open_router_key,
                        analyst_temperature=analyst_temperature,
                        analyst_model=analyst_model,
                        )
        
        self._create_tabular_bot(
                    data_path=data_path,
                    open_router_key=open_router_key,
                    semantic_path=semantic_path,
                    prompt2pandas_model=prompt2pandas_model,
                    prompt2pandas_temperature=prompt2pandas_temperature,
        )


    def _create_tabular_bot(
                            self,
                            data_path,
                            semantic_path,
                            open_router_key,
                            prompt2pandas_model="openrouter/openai/gpt-4o-mini",
                            prompt2pandas_temperature=0.3
        ):

        lite_llm=LiteLLM(
                    model=prompt2pandas_model,
                    api_key=open_router_key,
                    temperature=prompt2pandas_temperature,
                )




        self.tab_data = pai.read_csv(data_path)

        pai.config.set(
                    {
                        "llm": lite_llm,
                        "save_charts": True,
                        "open_charts": True,
                        "enable_cache": False,
                        "verbose": True,
                    }
                )


        semantic_output_folder="hackathon/last-mile"
        folder_path=folder_path = os.path.join("datasets", semantic_output_folder)

        if not os.path.isdir(folder_path):
            with open(semantic_path, "r") as f:
                column_info = json.load(f)

            pai.create(
                    path=semantic_output_folder,
                    df=self.tab_data,
                    description="Information about bulletins or TSNBs for different machines in epiroc",
                    columns=column_info,
                )
        self.df = pai.load(semantic_output_folder)
       
        


    def _create_promp_analyst(
                            self,
                            open_router_key,
                            analyst_temperature=0.3,
                            analyst_model="openrouter/openai/gpt-4o-mini"
                            ):

        lite_llm=ChatLiteLLM(
                    model=analyst_model,
                    api_key=open_router_key,
                    temperature=analyst_temperature,
                )
        
        system_msg=load_prompt("./prompts/tabular_prompts.yaml","prompt_understanding")


        analyst_template = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(system_msg),
                HumanMessagePromptTemplate.from_template("**user_query**: {user_query}"),
            ]
        )

        self.prompt_analyst_chain=analyst_template| lite_llm | StrOutputParser()



    def run(self, user_query: str):
        """
        Executes a conversational query against the tabular data.

        This method is responsible for:
        - Interpreting the user's natural language question
        - Applying domain-specific understanding of logistics terminology
        - Orchestrating LangChain prompts and PandasAI execution
        - Returning a data-grounded response to the user

        Parameters
        ----------
        user_query : str
            A natural language question or instruction from the user,
            expressed in logistics or supply chain terms.

        Returns
        -------
        Any
            The response generated by the assistant.
            This may be a textual explanation, a computed value,
            or a structured result derived from the data.
        """
        analized_prompt=self.prompt_analyst_chain.invoke(input={
                                                "user_query":user_query
                                                })
        
        
        reply=self.df.chat(analized_prompt)
        output_dict={"prompt_analysis":analized_prompt,
                     "output":str(reply)}
        
        return str(output_dict)
