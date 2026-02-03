
import asyncio
import sys
import os
import aiohttp

# Add project root to path
sys.path.append(os.getcwd())

from custom_llm_config import LLM_CONFIGURATIONS, update_llm_configurations_with_api_keys, get_client

async def test_glm():
    print("Testing GLM Connection...")
    update_llm_configurations_with_api_keys()
    
    if "glm-4" not in LLM_CONFIGURATIONS:
        print("Error: glm-4 config not found")
        return

    config = LLM_CONFIGURATIONS["glm-4"]
    print(f"Using model: {config.model_name}")
    client = get_client(config)
    
    try:
        response = await client.generate_response("Hello, say 'GLM is working'")
        print(f"Success! Response: {response}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_glm())
