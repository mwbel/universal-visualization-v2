import requests
import json
import sys

def test_determinant_mock():
    url = "http://localhost:9999/api/v3/chat/message"
    payload = {
        "message": "二阶行列式的几何意义",
        "generate_visualization": True,
        "model": "mock"
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"Sending request to {url} with model='mock'...")
    print(f"Payload: {json.dumps(payload, ensure_ascii=False)}")

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print("\nResponse received:")
        
        if not data.get("success"):
            print("❌ API returned success=False")
            return False

        viz = data.get("visualization")
        if not viz:
            print("❌ No visualization field in response")
            return False

        print(f"\n✅ Visualization Type: {viz.get('type')}")
        print(f"Subject: {viz.get('subject')}")
        print(f"URL: {viz.get('url')}")
        
        # Check if HTML content contains Mock specific text
        if "Mock Visualization Mode" in viz.get("html_content", ""):
            print("✅ HTML content confirms Mock generation")
        else:
            print("⚠️ HTML content does NOT match Mock generation")
            
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        if 'response' in locals():
            print(f"Response text: {response.text}")
        return False

if __name__ == "__main__":
    success = test_determinant_mock()
    sys.exit(0 if success else 1)
