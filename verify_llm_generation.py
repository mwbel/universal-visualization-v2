
import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend-v2")))

from agents.general_agent import GeneralVisualizationAgent
from agents.router_manager import VisualizationRouter

async def test_generation():
    print("🚀 Testing GeneralAgent Generation with Google Gemini...")
    
    agent = GeneralVisualizationAgent()
    
    # Force reload config to be sure
    await agent._get_llm_config()
    
    if not agent.llm_config:
        print("❌ No LLM config found!")
        return

    print(f"ℹ️ Using Config: {agent.llm_config.provider} - {agent.llm_config.model_name}")

    config = {
        "prompt": "画一个函数 y=x^3 的图",
        "user_preferences": {}
    }
    
    try:
        html = await agent.generate_visualization(config)
        print(f"✅ Generation Success! HTML length: {len(html)}")
        print("Preview:")
        print(html[:200])
    except Exception as e:
        print(f"❌ Generation Failed: {e}")
        import traceback
        traceback.print_exc()

async def test_routing():
    print("\n🚀 Testing Full Routing for y=x^3...")
    router = VisualizationRouter()
    result = await router.route_request("画一个三次函数 y=x^3 的图像")
    
    if result['success']:
        print(f"✅ Routing Success! Subject: {result['subject']}")
        print(f"Template: {result.get('template', {}).get('name')}")
        print(f"HTML Content Length: {len(result.get('html_content', ''))}")
    else:
        print(f"❌ Routing Failed: {result.get('error')}")

if __name__ == "__main__":
    asyncio.run(test_generation())
    asyncio.run(test_routing())
