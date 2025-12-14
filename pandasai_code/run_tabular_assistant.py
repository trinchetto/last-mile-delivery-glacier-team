
from tools.tabular_assistant import TabularAssistant

from utils.utils import cool_print

api_key=""

models={
    "analyst_model":"openrouter/openai/gpt-4o-mini",
    "prompt2pandas_model":"openrouter/openai/gpt-4o-mini"
}


temperatures={
    "analyst_temperature":0.3,
    "prompt2pandas_temperature":0.3
}

cool_print("Initializing tabular tool ....", color="yellow")
my_tab_assistant=TabularAssistant(
        open_router_key=api_key,
        models=models,
        temperatures=temperatures,
        data_path="./data/last-mile-data.csv",
        semantic_path="./data/last-mile-data.json"
)

cool_print("..... done!",color="bright_yellow")

prompt_in=""
while prompt_in!="END":
    prompt_in=input("Write a question to the data assistant > ")
    if prompt_in!="END" and prompt_in!="":
        reply=my_tab_assistant.run(
            user_query=prompt_in
        )
    cool_print(reply,color="cyan")
    cool_print("=============================",color="cyan")