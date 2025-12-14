


from litellm import completion


OPENROUTER_API_KEY = ""  # set it in your env
response = completion(
    model="openrouter/openai/gpt-4o-mini",
    api_key=OPENROUTER_API_KEY,
    messages=[
        {"role": "user", "content": "Say hello and tell me one fun fact about pandas."}
    ],
)

print(response.choices[0].message.content)