import requests
import json

def test_gen():
    url = "http://127.0.0.1:8000/api/math/practice/generate"
    params = {
        "topic": "专题(1)：集合、命题、不等式",
        "category": "基础练"
    }
    try:
        resp = requests.get(url, params=params, timeout=60)
        print(f"Status: {resp.status_code}")
        print(f"Response: {json.dumps(resp.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gen()
