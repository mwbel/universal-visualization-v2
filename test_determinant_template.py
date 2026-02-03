import requests
import json
import sys

def test_determinant_template_match():
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
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print("\nResponse received:")
        
        viz = data.get("visualization")
        if not viz:
            print("❌ No visualization field in response")
            return False

        print(f"\nVisualization Type: {viz.get('type')}")
        print(f"Template ID: {viz.get('metadata', {}).get('template_id')}")
        print(f"URL: {viz.get('url')}")
        
        # Check if it matched our new template
        template_id = viz.get('metadata', {}).get('template_id')
        if template_id == 'la_determinant_2x2':
            print("✅ Successfully matched 'la_determinant_2x2' template")
            return True
        elif template_id == 'dynamic_generation':
            print("⚠️ Matched 'dynamic_generation' - Template routing failed, fell back to GeneralAgent")
            return False
        else:
            print(f"⚠️ Matched unexpected template: {template_id}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_determinant_template_match()
    sys.exit(0 if success else 1)
