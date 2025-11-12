#!/usr/bin/env python3
"""
万物可视化系统诊断脚本
帮助技术小白理解前后端交互
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def print_status(test_name, status, message):
    """打印测试结果"""
    status_icon = "✅" if status else "❌"
    print(f"{status_icon} {test_name}: {message}")

def test_basic_connection():
    """测试基础连接"""
    print("\n=== 🌐 测试基础连接 ===")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print_status("基础连接", response.status_code == 200, f"状态码: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print_status("基础连接", False, f"错误: {str(e)}")
        return False

def test_health_check():
    """测试健康检查"""
    print("\n=== 🏥 测试健康检查 ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status("健康检查", True, f"状态: {data.get('status', 'unknown')}")
            return True
        else:
            print_status("健康检查", False, f"状态码: {response.status_code}")
            return False
    except Exception as e:
        print_status("健康检查", False, f"错误: {str(e)}")
        return False

def test_api_endpoints():
    """测试API端点"""
    print("\n=== 📡 测试API端点 ===")

    # 测试模板列表
    try:
        response = requests.get(f"{BASE_URL}/api/v2/templates", timeout=5)
        print_status("模板列表", response.status_code == 200, f"状态码: {response.status_code}")
        if response.status_code == 200:
            templates = response.json()
            print(f"📋 可用模板数量: {len(templates)}")
            for template in templates:
                print(f"  - {template.get('name', 'unknown')} ({template.get('discipline', 'unknown')})")
    except Exception as e:
        print_status("模板列表", False, f"错误: {str(e)}")

def test_simple_generation():
    """测试简单的可视化生成"""
    print("\n=== 🎨 测试可视化生成 ===")

    # 发送生成请求
    generation_request = {
        "prompt": "画一个简单的正弦函数",
        "discipline": "mathematics",
        "style": "plotly"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/api/v2/generate",
            json=generation_request,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            generation_id = data.get("generation_id")
            print_status("生成请求", True, f"任务ID: {generation_id}")

            # 等待处理
            print("⏳ 等待处理中...")
            time.sleep(2)

            # 检查状态
            status_response = requests.get(f"{BASE_URL}/api/v2/status/{generation_id}", timeout=5)
            if status_response.status_code == 200:
                status_data = status_response.json()
                status = status_data.get("status")
                print_status("状态检查", True, f"状态: {status}")

                if status == "completed":
                    viz_url = status_data.get("html_url")
                    print(f"🎉 生成完成！访问地址: {BASE_URL}{viz_url}")
                elif status == "failed":
                    error = status_data.get("error", "未知错误")
                    print_status("生成结果", False, f"错误: {error}")

                return status_data
            else:
                print_status("状态检查", False, f"状态码: {status_response.status_code}")
                return None
        else:
            print_status("生成请求", False, f"状态码: {response.status_code}")
            try:
                error_data = response.json()
                print(f"错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"响应内容: {response.text}")
            return None

    except Exception as e:
        print_status("生成请求", False, f"错误: {str(e)}")
        return None

def test_frontend_access():
    """测试前端访问"""
    print("\n=== 🖥️ 测试前端访问 ===")
    try:
        response = requests.get(f"{BASE_URL}/frontend-v2/", timeout=5)
        print_status("前端访问", response.status_code == 200, f"状态码: {response.status_code}")
        if response.status_code == 200:
            # 检查页面内容
            content = response.text
            if "万物可视化" in content:
                print_status("页面内容", True, "包含万物可视化标题")
            else:
                print_status("页面内容", False, "未找到预期内容")
        return response.status_code == 200
    except Exception as e:
        print_status("前端访问", False, f"错误: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 万物可视化系统诊断开始...")
    print("=" * 50)

    # 执行所有测试
    tests_passed = 0
    total_tests = 5

    if test_basic_connection():
        tests_passed += 1

    if test_health_check():
        tests_passed += 1

    test_api_endpoints()  # 这个测试只是显示信息，不计分

    generation_result = test_simple_generation()
    if generation_result and generation_result.get("status") == "completed":
        tests_passed += 1

    if test_frontend_access():
        tests_passed += 1

    # 总结
    print("\n" + "=" * 50)
    print(f"📊 测试总结: {tests_passed}/{total_tests} 通过")

    if tests_passed == total_tests:
        print("🎉 所有测试通过！系统运行正常。")
    else:
        print("⚠️  发现问题，需要进一步调试。")

        # 给出建议
        print("\n💡 学习建议:")
        print("1. 查看后端日志了解具体错误")
        print("2. 检查模板文件是否存在")
        print("3. 确认依赖包是否正确安装")
        print("4. 学习如何调试Python Web应用")

if __name__ == "__main__":
    main()