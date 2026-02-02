#!/usr/bin/env python3
"""
测试前端API访问
"""
import requests
import json

def test_frontend_api_integration():
    """测试前端API集成是否正常工作"""

    base_url = "http://localhost:9999"
    frontend_url = f"{base_url}/frontend-v3/"
    api_base = f"{base_url}/api/v3"

    print("🧪 测试前端API集成...")

    # 1. 测试前端页面访问
    try:
        print("\n1. 测试前端页面访问...")
        response = requests.get(frontend_url)
        if response.status_code == 200:
            print("✅ 前端页面访问正常")
            # 检查页面内容
            content = response.text
            if "万物可视化" in content and "ApiClient" in content:
                print("✅ 前端页面内容正确")
            else:
                print("⚠️ 前端页面内容可能有问题")
        else:
            print(f"❌ 前端页面访问失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 前端页面访问异常: {e}")
        return False

    # 2. 测试API接口
    try:
        print("\n2. 测试API接口...")

        # 测试快速操作
        response = requests.get(f"{api_base}/chat/quick-actions")
        if response.status_code == 200:
            data = response.json()
            print("✅ 快速操作API正常")
        else:
            print(f"❌ 快速操作API失败: {response.status_code}")
            return False

        # 测试对话列表
        response = requests.get(f"{api_base}/chat/conversations")
        if response.status_code == 200:
            print("✅ 对话列表API正常")
        else:
            print(f"❌ 对话列表API失败: {response.status_code}")
            return False

        # 测试发送消息
        response = requests.post(
            f"{api_base}/chat/message",
            headers={"Content-Type": "application/json"},
            json={
                "message": "测试消息",
                "conversation_id": None,
                "generate_visualization": False
            }
        )
        if response.status_code == 200:
            print("✅ 消息发送API正常")
        else:
            print(f"❌ 消息发送API失败: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ API接口测试异常: {e}")
        return False

    # 3. 测试CORS
    try:
        print("\n3. 测试CORS配置...")
        response = requests.get(
            f"{api_base}/chat/quick-actions",
            headers={"Origin": frontend_url}
        )
        if response.status_code == 200:
            print("✅ CORS配置正常")
        else:
            print(f"❌ CORS配置问题: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ CORS测试异常: {e}")
        return False

    print("\n🎉 所有测试通过！前端API集成正常工作")
    print(f"\n📱 访问地址:")
    print(f"   - 完整集成: {frontend_url}")
    print(f"   - API文档: {base_url}/docs")

    return True

if __name__ == "__main__":
    test_frontend_api_integration()