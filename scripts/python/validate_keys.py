
import asyncio
from custom_llm_config import LLMConfig, LLMProvider, get_client

async def validate_gemini_keys(api_keys):
    print(f"Starting validation for {len(api_keys)} keys...")
    
    valid_key = None
    
    for key in api_keys:
        print(f"Testing key: {key[:5]}...{key[-3:]}")
        try:
            config = LLMConfig(
                provider=LLMProvider.GOOGLE,
                model_name="gemini-pro",
                api_key=key,
                timeout=10
            )
            
            client = get_client(config)
            
            # Use validate_connection instead of generate_response for cleaner check
            is_valid = await client.validate_connection()
            
            if is_valid:
                print(f"✅ Key {key[:5]}... is VALID!")
                valid_key = key
                break
            else:
                print(f"❌ Key {key[:5]}... is INVALID (Validation failed)")
                
        except Exception as e:
            print(f"❌ Key {key[:5]}... Error: {e}")
            
    if valid_key:
        print(f"\nFinal Result: Found valid key: {valid_key[:5]}...")
        # Save valid key to file for easy retrieval
        with open("valid_key.txt", "w") as f:
            f.write(valid_key)
    else:
        print("\nFinal Result: No valid keys found.")

if __name__ == "__main__":
    keys = [
        "AIzaSyAU3B5coLYWQnlCjOwZg0JQQj7K5sw8q80",
        "AIzaSyA6_9MBfmKHGbH7OI0GV5FiV0N8Mh8o1GY", # Repeated in request
        "AIzaSyA2oPOk-nJMJDlc0jVvOTN1fhzW45pzt9w"
    ]
    # Filter duplicates just in case
    keys = list(set(keys))
    asyncio.run(validate_gemini_keys(keys))
