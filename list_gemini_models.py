import asyncio
import aiohttp
import json
from custom_llm_config import load_api_keys_from_settings


async def list_models():
    api_keys = load_api_keys_from_settings()
    if "google" not in api_keys:
        print("No Google API key found.")
        return

    api_key = api_keys["google"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if "models" in data:
                    print("Available models:")
                    for model in data["models"]:
                        print(f"- {model['name']}")
                else:
                    print("No models found in response:", data)
            else:
                print(f"Error listing models: {response.status}")
                print(await response.text())


if __name__ == "__main__":
    asyncio.run(list_models())
