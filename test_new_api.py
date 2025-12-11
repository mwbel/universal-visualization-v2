#!/usr/bin/env python3
"""
新API测试脚本
测试v3聊天界面API的各个功能
"""

import requests
import json
import time
from pathlib import Path

# API基础URL
BASE_URL = "http://localhost:9999"

def print_section(title):
    """打印测试部分标题"""
    print(f"\n{'='*50}")
    print(f"🧪 {title}")
    print('='*50)

def print_response(response, title="响应"):
    """打印API响应"""
    print(f"\n📋 {title}:")
    if response.status_code == 200:
        print("✅ 状态码:", response.status_code)
        try:
            data = response.json()
            print("📄 数据:", json.dumps(data, ensure_ascii=False, indent=2))
        except:
            print("📄 内容:", response.text[:200] + "..." if len(response.text) > 200 else response.text)
    else:
        print("❌ 状态码:", response.status_code)
        print("📄 错误:", response.text)

def test_api_info():
    """测试API信息"""
    print_section("测试API基础信息")

    response = requests.get(f"{BASE_URL}/")
    print_response(response, "API信息")

def test_create_conversation():
    """测试创建对话"""
    print_section("测试创建对话")

    url = f"{BASE_URL}/api/v3/chat/conversations"
    data = {
        "title": "API测试对话",
        "settings": {
            "theme": "dark",
            "auto_save": True
        }
    }

    response = requests.post(url, json=data)
    print_response(response, "创建对话")

    if response.status_code == 200:
        return response.json().get("id")
    return None

def test_send_message(conversation_id=None):
    """测试发送消息"""
    print_section("测试发送消息")

    url = f"{BASE_URL}/api/v3/chat/message"
    data = {
        "conversation_id": conversation_id,
        "message": "你好，我想了解数学函数的可视化",
        "stream": False,
        "generate_visualization": True,
        "user_preferences": {
            "theme": "dark",
            "language": "zh-CN"
        }
    }

    response = requests.post(url, json=data)
    print_response(response, "发送消息")

    if response.status_code == 200:
        result = response.json()
        return result.get("conversation_id")
    return None

def test_math_visualization(conversation_id):
    """测试数学可视化"""
    print_section("测试数学函数可视化")

    url = f"{BASE_URL}/api/v3/chat/message"
    data = {
        "conversation_id": conversation_id,
        "message": "请画出函数 y = x² + 2x + 1 的图像",
        "generate_visualization": True,
        "user_preferences": {
            "visualization_type": "interactive"
        }
    }

    response = requests.post(url, json=data)
    print_response(response, "数学可视化请求")

def test_astronomy_visualization(conversation_id):
    """测试天文可视化"""
    print_section("测试天文可视化")

    url = f"{BASE_URL}/api/v3/chat/message"
    data = {
        "conversation_id": conversation_id,
        "message": "展示太阳系八大行星的运行轨道",
        "generate_visualization": True
    }

    response = requests.post(url, json=data)
    print_response(response, "天文可视化请求")

def test_conversations_list():
    """测试获取对话列表"""
    print_section("测试获取对话列表")

    url = f"{BASE_URL}/api/v3/chat/conversations"
    params = {
        "page": 1,
        "page_size": 10
    }

    response = requests.get(url, params=params)
    print_response(response, "对话列表")

def test_search_conversations():
    """测试搜索对话"""
    print_section("测试搜索对话")

    url = f"{BASE_URL}/api/v3/chat/search"
    data = {
        "query": "数学",
        "page": 1,
        "page_size": 5
    }

    response = requests.post(url, json=data)
    print_response(response, "搜索结果")

def test_quick_actions():
    """测试快速操作"""
    print_section("测试快速操作")

    response = requests.get(f"{BASE_URL}/api/v3/chat/quick-actions")
    print_response(response, "快速操作列表")

    # 测试执行快速操作
    if response.status_code == 200:
        actions = response.json().get("actions", {})
        for category, category_actions in actions.items():
            if category_actions:
                action_id = category_actions[0].get("id")
                print(f"\n🎯 执行快速操作: {action_id}")

                url = f"{BASE_URL}/api/v3/chat/quick-actions/{action_id}"
                response = requests.post(url)
                print_response(response, f"执行快速操作 {action_id}")

def test_file_upload():
    """测试文件上传"""
    print_section("测试文件上传")

    # 创建一个测试文件
    test_file = Path("test_upload.txt")
    test_file.write_text("这是一个测试文件内容\n用于测试文件上传功能")

    url = f"{BASE_URL}/api/v3/files/upload"

    with open(test_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
        print_response(response, "文件上传")

    # 清理测试文件
    test_file.unlink()

def test_files_list():
    """测试获取文件列表"""
    print_section("测试获取文件列表")

    response = requests.get(f"{BASE_URL}/api/v3/files/list")
    print_response(response, "文件列表")

def test_user_registration():
    """测试用户注册"""
    print_section("测试用户注册")

    url = f"{BASE_URL}/api/v3/user/register"
    data = {
        "username": f"test_user_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "test123456"
    }

    response = requests.post(url, json=data)
    print_response(response, "用户注册")

def test_health_check():
    """测试健康检查"""
    print_section("测试健康检查")

    # v2健康检查
    response = requests.get(f"{BASE_URL}/api/v2/health")
    print_response(response, "v2健康检查")

    # 根端点
    response = requests.get(f"{BASE_URL}/")
    print_response(response, "根端点信息")

def run_all_tests():
    """运行所有测试"""
    print("🚀 开始运行万物可视化 v3 API 测试套件")

    # 基础测试
    test_health_check()
    test_api_info()

    # 聊天功能测试
    conversation_id = test_create_conversation()
    if conversation_id:
        new_conversation_id = test_send_message(conversation_id)
        if new_conversation_id:
            conversation_id = new_conversation_id

        test_math_visualization(conversation_id)
        test_astronomy_visualization(conversation_id)

    test_conversations_list()
    test_search_conversations()
    test_quick_actions()

    # 文件功能测试
    test_file_upload()
    test_files_list()

    # 用户功能测试
    test_user_registration()

    print_section("测试完成")
    print("✅ 所有测试已完成！")
    print("💡 请检查上述响应以确认API功能正常")

def main():
    """主函数"""
    try:
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败！请确保服务器正在运行在 http://localhost:9999")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {str(e)}")

if __name__ == "__main__":
    main()