#!/usr/bin/env python3
"""
测试前端API集成
"""
import requests
import json

def test_api_endpoints():
    base_url = "http://localhost:9999/api/v3"

    print("🧪 测试万物可视化 v3 API 集成...")

    # 测试健康检查
    try:
        print("\n1. 测试快速操作接口...")
        response = requests.get(f"{base_url}/chat/quick-actions")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 快速操作接口正常，返回了 {data.get('total_templates', 0)} 个模板")
            print(f"   学科: {', '.join(data.get('subjects', []))}")
        else:
            print(f"❌ 快速操作接口失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 快速操作接口异常: {e}")

    # 测试对话列表
    try:
        print("\n2. 测试对话列表接口...")
        response = requests.get(f"{base_url}/chat/conversations")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 对话列表接口正常，当前有 {data.get('total', 0)} 个对话")
        else:
            print(f"❌ 对话列表接口失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 对话列表接口异常: {e}")

    # 测试发送消息
    try:
        print("\n3. 测试发送消息接口...")
        test_message = {
            "message": "我想了解正态分布",
            "conversation_id": None,
            "generate_visualization": True
        }
        response = requests.post(
            f"{base_url}/chat/message",
            headers={"Content-Type": "application/json"},
            json=test_message
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ 消息发送接口正常")
            print(f"   对话ID: {data.get('conversation_id')}")
            print(f"   消息ID: {data.get('message_id')}")
            print(f"   包含可视化: {data.get('visualization') is not None}")
            conversation_id = data.get('conversation_id')
        else:
            print(f"❌ 消息发送接口失败: {response.status_code}")
            print(f"   错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 消息发送接口异常: {e}")
        conversation_id = None

    # 测试文件上传接口
    try:
        print("\n4. 测试文件上传接口...")
        # 创建一个测试文件
        with open("/tmp/test.txt", "w") as f:
            f.write("这是一个测试文件")

        with open("/tmp/test.txt", "rb") as f:
            files = {"file": ("test.txt", f, "text/plain")}
            response = requests.post(f"{base_url}/files/upload", files=files)

        if response.status_code == 200:
            data = response.json()
            print("✅ 文件上传接口正常")
            print(f"   文件ID: {data.get('id')}")
            print(f"   文件名: {data.get('filename')}")
        else:
            print(f"❌ 文件上传接口失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 文件上传接口异常: {e}")

    print("\n🎉 API集成测试完成!")
    print("\n💡 现在可以在浏览器中访问:")
    print("   - 前端界面: http://localhost:9999/frontend-v3")
    print("   - API文档: http://localhost:9999/docs")
    print("   - 后端端口: 9999")
    print("   - 前端端口: 8080 (独立运行)")

if __name__ == "__main__":
    test_api_endpoints()