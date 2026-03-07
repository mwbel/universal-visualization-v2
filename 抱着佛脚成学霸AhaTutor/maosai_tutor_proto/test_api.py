import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import AIService

def test_gemini_api():
    print("Testing Gemini API connection...")
    try:
        response = AIService.generate_response("Hello, are you working?")
        print("\n--- API Response ---")
        print(response)
        print("--------------------")
        
        if "AI 服务暂时不可用" in response or "我暂时无法回答" in response:
            print("\n[FAILED] API Verification Failed.")
        else:
            print("\n[SUCCESS] API Verification Successful.")
            
    except Exception as e:
        print(f"\n[ERROR] Test script encountered an error: {e}")

if __name__ == "__main__":
    test_gemini_api()
