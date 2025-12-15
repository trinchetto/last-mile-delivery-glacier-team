
from tools.tabular_assistant import TabularAssistant

from utils.utils import cool_print

api_key="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"

models={
    "analyst_model":"openrouter/openai/gpt-4o-mini",
    "prompt2pandas_model":"openrouter/openai/gpt-4o-mini"
}


temperatures={
    "analyst_temperature":0.3,
    "prompt2pandas_temperature":0.5
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

prompt_in="x"
while prompt_in!="END" and prompt_in!="" and prompt_in!="n":
    prompt_in=input("Write a question to the data assistant > ")
    if prompt_in!="END" and prompt_in!="" and prompt_in!="n" and prompt_in!="x":
        reply=my_tab_assistant.run(
            user_query=prompt_in
        )

        cool_print("=============================================",color="cyan")
        cool_print("ANSWER to the user:",color="cyan")
        cool_print(reply["explanation"],color="cyan")
        cool_print("-----------",color="cyan")
        image_path=reply["image_path"]

        print("image path ", image_path)
        if image_path:
            cool_print("Associated image:",color="cyan")
            cool_print(reply["image_path"],color="cyan")


        ask_e=input("Do you want to see the processing logic for this answer? y/n ")
        if ask_e=="y":
            cool_print("Question as understood by a DS:",color="yellow")
            cool_print(reply["prompt_analysis"],color="yellow")
            cool_print("-----------",color="yellow")
            cool_print("Executed code:",color="bright_yellow")
            cool_print(reply["code_executed"],color="bright_yellow")
            cool_print("Raw results:",color="bright_yellow")
            cool_print(reply["output"],color="bright_yellow")
            