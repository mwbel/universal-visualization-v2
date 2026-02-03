import asyncio
from custom_llm_config import LLM_CONFIGURATIONS, update_llm_configurations_with_api_keys, get_client

async def test_gemini():
    print("Testing Gemini Connection...")
    
    # Ensure configs are loaded
    if "gemini-pro" not in LLM_CONFIGURATIONS:
        print("Initial config load missed gemini-pro, updating...")
        update_llm_configurations_with_api_keys()
    
    if "gemini-pro" not in LLM_CONFIGURATIONS:
        print("Error: gemini-pro config still not found after update.")
        return

    config = LLM_CONFIGURATIONS["gemini-pro"]
    print(f"Using model: {config.model_name}")
    
    client = get_client(config)
    
    try:
        response = await client.generate_response("Hello, say 'Gemini is working' if you can hear me.")
        print(f"Success! Response: {response}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
