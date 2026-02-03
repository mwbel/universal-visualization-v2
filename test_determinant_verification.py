import requests
import json
import sys

def test_determinant_visualization():
    url = "http://localhost:9999/api/v3/chat/message"
    payload = {
        "message": "二阶行列式的几何意义",
        "generate_visualization": True,
        "model": "gemini-flash-latest"
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"Sending request to {url}...")
    print(f"Payload: {json.dumps(payload, ensure_ascii=False)}")

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print("\nResponse received:")
        # print(json.dumps(data, indent=2, ensure_ascii=False))

        if not data.get("success"):
            print("❌ API returned success=False")
            return False

        viz = data.get("visualization")
        if not viz:
            print("❌ No visualization field in response")
            print("Text response:", data.get("response"))
            return False

        print(f"\n✅ Visualization Type: {viz.get('type')}")
        print(f"Subject: {viz.get('subject')}")
        
        viz_url = viz.get("url")
        if viz_url:
            print(f"✅ Visualization URL found: {viz_url}")
            return True
        else:
            print("❌ Visualization URL is MISSING!")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        if 'response' in locals():
            print(f"Response text: {response.text}")
        return False

if __name__ == "__main__":
    success = test_determinant_visualization()
    sys.exit(0 if success else 1)
