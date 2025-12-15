
from langchain_community.chat_models import ChatLiteLLM
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

from langchain_core.output_parsers import StrOutputParser
from utils.utils import load_prompt



model="openrouter/openai/gpt-4o-mini"
api_key=""
temperature=0



myLLM=ChatLiteLLM(
            model=model,
            api_key=api_key,
            temperature=temperature,
        )


system_msg=load_prompt("./prompts/tabular_prompts.yaml","prompt_understanding")


prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_msg),
        HumanMessagePromptTemplate.from_template("**user_query**: {user_query}"),
    ]
)

understand_prompt=prompt | myLLM | StrOutputParser()


current_prompt=""

while current_prompt!="END":
    current_prompt=input("What is the prompt? > ")
    print(current_prompt)
    if current_prompt!="END":
        reply=understand_prompt.invoke(input={
            "user_query": current_prompt,
        })
        print(reply)
