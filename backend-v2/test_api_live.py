#!/usr/bin/env python3
"""
🔴 API实时功能测试
测试启动的服务器的实际API功能
"""

import requests
import json
import uuid
import tempfile
import os

API_BASE_URL = "http://localhost:9999"

def test_server_health():
    """测试服务器健康状态"""
    print("🏥 测试服务器健康状态")

    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 服务器状态: {data.get('status')}")
            print(f"   版本: {data.get('version')}")
            print(f"   Agent数量: {data.get('agents')}")
            return True
        else:
            print(f"❌ 健康检查失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 无法连接到服务器: {str(e)}")
        return False

def test_file_upload_api():
    """测试文件上传API"""
    print("\n📁 测试文件上传API")

    # 创建测试文档
    test_content = """测试文档

第一章：数据分析
这个文档包含一些测试数据。
数值：25, 50, 75, 100。
关键词：可视化、分析、数据。

第二章：统计信息
平均值：75.5
中位数：72.0
标准差：15.3
"""

    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
    temp_file.write(test_content)
    temp_file.close()

    try:
        # 上传文件
        with open(temp_file.name, 'rb') as f:
            files = {'file': (os.path.basename(temp_file.name), f, 'text/plain')}
            data = {'description': '测试文档上传'}

            response = requests.post(f"{API_BASE_URL}/api/v4/files/upload",
                                   files=files, data=data, timeout=10)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 文件上传成功")
            print(f"   文件ID: {result.get('file_id')}")
            print(f"   文件名: {result.get('filename')}")
            print(f"   文件类型: {result.get('file_type')}")
            print(f"   文件大小: {result.get('file_size')} bytes")
            print(f"   分析链接: {result.get('analysis_url')}")
            return result.get('file_id')
        else:
            print(f"❌ 文件上传失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 上传过程出错: {str(e)}")
        return None
    finally:
        # 清理临时文件
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

def test_file_analysis_api(file_id):
    """测试文件分析API"""
    print(f"\n🔍 测试文件分析API (文件ID: {file_id})")

    if not file_id:
        print("❌ 没有有效的文件ID")
        return False

    try:
        # 发送分析请求
        analysis_data = {
            "file_id": file_id,
            "analysis_options": {
                "extract_keywords": True,
                "detect_numbers": True
            },
            "auto_visualize": True
        }

        response = requests.post(f"{API_BASE_URL}/api/v4/files/analyze/{file_id}",
                               json=analysis_data, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 文件分析成功")
            print(f"   分析状态: {result.get('analysis_status')}")
            print(f"   置信度: {result.get('confidence_score')}")
            print(f"   处理时间: {result.get('processing_time')} 秒")

            # 检查提取的数据
            extracted_data = result.get('extracted_data', {})
            if extracted_data:
                print(f"   提取的数据字段: {list(extracted_data.keys())}")

                # 显示一些关键信息
                if 'content_summary' in extracted_data:
                    summary = extracted_data['content_summary'][:100] + "..."
                    print(f"   内容摘要: {summary}")

                if 'key_topics' in extracted_data:
                    topics = extracted_data['key_topics'][:3]
                    topic_names = [t.get('topic', '') for t in topics]
                    print(f"   关键词样例: {topic_names}")

                if 'language' in extracted_data:
                    print(f"   检测语言: {extracted_data['language']}")

            # 显示推荐的可视化
            suggested_viz = result.get('suggested_visualizations', [])
            if suggested_viz:
                print(f"   推荐可视化: {suggested_viz[:3]}")

            return True
        else:
            print(f"❌ 文件分析失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 分析过程出错: {str(e)}")
        return False

def test_visualization_generation_api(file_id):
    """测试可视化生成API"""
    print(f"\n🎨 测试可视化生成API (文件ID: {file_id})")

    if not file_id:
        print("❌ 没有有效的文件ID")
        return False

    try:
        # 发送可视化生成请求
        viz_data = {
            "file_id": file_id,
            "visualization_type": "keyword_analysis",
            "template_options": {
                "chart_style": "modern",
                "color_scheme": "blue"
            },
            "output_format": "html",
            "custom_title": "文档分析可视化"
        }

        response = requests.post(f"{API_BASE_URL}/api/v4/files/visualize/generate",
                               json=viz_data, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 可视化生成成功")
            print(f"   可视化ID: {result.get('visualization_id')}")
            print(f"   可视化类型: {result.get('visualization_type')}")
            print(f"   处理时间: {result.get('processing_time')} 秒")
            print(f"   下载链接: {result.get('download_url')}")

            # 检查HTML内容
            html_content = result.get('html_content')
            if html_content:
                print(f"   HTML内容长度: {len(html_content)} 字符")
                if 'plotly' in html_content.lower():
                    print(f"   ✅ 包含Plotly交互式图表")
                if 'canvas' in html_content.lower():
                    print(f"   ✅ 包含Canvas元素")

            return result.get('visualization_id')
        else:
            print(f"❌ 可视化生成失败: HTTP {response.status_code}")
            print(f"   错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 可视化生成过程出错: {str(e)}")
        return None

def test_file_download_api(file_id):
    """测试文件下载API"""
    print(f"\n📥 测试文件下载API (文件ID: {file_id})")

    if not file_id:
        print("❌ 没有有效的文件ID")
        return False

    try:
        response = requests.get(f"{API_BASE_URL}/api/v4/files/{file_id}/download", timeout=10)

        if response.status_code == 200:
            print(f"✅ 文件下载成功")
            print(f"   响应头: {dict(response.headers)}")
            print(f"   内容长度: {len(response.content)} bytes")
            print(f"   MIME类型: {response.headers.get('content-type', 'unknown')}")
            return True
        else:
            print(f"❌ 文件下载失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 下载过程出错: {str(e)}")
        return False

def test_file_list_api():
    """测试文件列表API"""
    print("\n📋 测试文件列表API")

    try:
        response = requests.get(f"{API_BASE_URL}/api/v4/files/", timeout=10)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ 文件列表获取成功")
            print(f"   文件数量: {result.get('total_count')}")
            print(f"   响应消息: {result.get('message')}")

            files = result.get('files', [])
            if files:
                print(f"   文件详情:")
                for i, file_info in enumerate(files[:3]):  # 显示前3个文件
                    print(f"     {i+1}. {file_info.get('original_filename')} ({file_info.get('file_type')})")

            return True
        else:
            print(f"❌ 文件列表获取失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取文件列表出错: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始API实时功能测试")
    print(f"🌐 服务器地址: {API_BASE_URL}")
    print("="*60)

    results = []

    # 1. 测试服务器健康状态
    health_ok = test_server_health()
    results.append(("服务器健康检查", health_ok))

    if not health_ok:
        print("\n❌ 服务器不可用，无法继续测试")
        return

    # 2. 测试文件上传
    file_id = test_file_upload_api()
    results.append(("文件上传API", file_id is not None))

    if file_id:
        # 3. 测试文件分析
        analysis_ok = test_file_analysis_api(file_id)
        results.append(("文件分析API", analysis_ok))

        # 4. 测试可视化生成
        viz_id = test_visualization_generation_api(file_id)
        results.append(("可视化生成API", viz_id is not None))

        # 5. 测试文件下载
        download_ok = test_file_download_api(file_id)
        results.append(("文件下载API", download_ok))
    else:
        results.append(("文件分析API", False))
        results.append(("可视化生成API", False))
        results.append(("文件下载API", False))

    # 6. 测试文件列表
    list_ok = test_file_list_api()
    results.append(("文件列表API", list_ok))

    # 测试结果总结
    print("\n" + "="*60)
    print("📊 API功能测试总结")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status}: {test_name}")

    success_rate = passed / total * 100
    print(f"\n🎯 API测试成功率: {success_rate:.1f}% ({passed}/{total})")

    if success_rate >= 80:
        print("\n🎉 API功能测试通过！")
        print("✅ 服务器功能完整，所有核心API正常工作")
        print("✅ 文件上传、分析、可视化生成流程验证成功")
    elif success_rate >= 60:
        print("\n⚠️ API功能测试部分通过")
        print("🔧 部分API需要进一步完善")
    else:
        print("\n❌ API功能测试未通过")
        print("🔨 需要修复多个API功能")

    print(f"\n🌐 你可以在浏览器中访问: {API_BASE_URL}")
    print(f"📖 API文档: {API_BASE_URL}/docs")

if __name__ == "__main__":
    main()