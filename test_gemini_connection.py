import asyncio
import sys
import os
import aiohttp

# Add project root to path
sys.path.append(os.getcwd())

from custom_llm_config import (
    LLM_CONFIGURATIONS,
    update_llm_configurations_with_api_keys,
)


async def try_model(model_name, api_key):
    print(f"\nTesting model: {model_name}")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    payload = {"contents": [{"parts": [{"text": "Hi"}]}]}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            print(f"Status: {response.status}")
            text = await response.text()
            if response.status == 200:
                print("Success!")
                return True
            else:
                print(f"Error: {text[:200]}...")
                return False


async def main():
    update_llm_configurations_with_api_keys()
    if "gemini-pro" not in LLM_CONFIGURATIONS:
        print("No gemini config found")
        return

    config = LLM_CONFIGURATIONS["gemini-pro"]
    api_key = config.api_key

    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro",
    ]

    for model in models_to_try:
        if await try_model(model, api_key):
            print(f"\nFOUND WORKING MODEL: {model}")
            break


if __name__ == "__main__":
    asyncio.run(main())
