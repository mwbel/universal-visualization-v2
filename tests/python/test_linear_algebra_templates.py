#!/usr/bin/env python3
"""
测试线性代数模板是否正确加载和识别
"""

import requests
import json
import time

def test_template_loading():
    """测试模板加载"""
    print("🔍 测试线性代数模板加载...")

    try:
        # 获取数学学科模板
        response = requests.get("http://localhost:9999/api/v2/mathematics/templates")
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ 成功获取数学学科模板，共 {len(templates)} 个")

            # 检查线性代数相关模板
            linear_algebra_templates = [t for t in templates if 'linear' in str(t.get('name', '')).lower() or 'linear' in str(t.get('description', '')).lower()]
            print(f"📊 线性代数相关模板: {len(linear_algebra_templates)} 个")

            for template in templates:
                print(f"  - {template.get('name', '')} ({template.get('id', '')})")
        else:
            print(f"❌ 获取模板失败: {response.status_code}")

    except Exception as e:
        print(f"❌ 测试模板加载失败: {e}")

def test_linear_algebra_generation():
    """测试线性代数可视化生成"""
    print("\n🧪 测试线性代数可视化生成...")

    test_cases = [
        "二阶行列式 计算 可视化步骤",
        "三阶行列式 几何意义",
        "向量投影 a=(2,1) b=(1,2)",
        "矩阵运算 2x2矩阵乘法",
        "特征值分解 对称矩阵"
    ]

    for test_input in test_cases:
        print(f"\n📝 测试输入: {test_input}")

        try:
            # 生成可视化
            response = requests.post("http://localhost:9999/api/v2/generate", json={
                "prompt": test_input,
                "user_preferences": {
                    "title": f"测试 - {test_input}",
                    "style": "interactive"
                }
            })

            if response.status_code == 200:
                result = response.json()
                task_id = result.get("task_id")
                print(f"✅ 生成任务已创建: {task_id}")

                # 轮询状态
                for i in range(10):
                    status_response = requests.get(f"http://localhost:9999/api/v2/status/{task_id}")
                    if status_response.status_code == 200:
                        status = status_response.json()
                        print(f"  📊 状态: {status.get('status', 'unknown')}")

                        if status.get("status") == "completed":
                            viz_id = status.get("visualization_id")
                            print(f"  🎉 可视化完成: {viz_id}")

                            # 获取可视化内容
                            viz_response = requests.get(f"http://localhost:9999/api/v2/visualizations/{viz_id}")
                            if viz_response.status_code == 200:
                                viz_content = viz_response.json()
                                html_content = viz_content.get("html", "")

                                # 检查内容
                                if len(html_content) > 1000:
                                    print(f"  ✅ 可视化内容生成成功 ({len(html_content)} 字符)")
                                else:
                                    print(f"  ⚠️  可视化内容较短 ({len(html_content)} 字符)")
                                    print(f"  📄 内容预览: {html_content[:200]}...")
                            break

                        elif status.get("status") == "failed":
                            error_msg = status.get("error", "未知错误")
                            print(f"  ❌ 生成失败: {error_msg}")
                            break

                    time.sleep(1)
                else:
                    print("  ⏰ 生成超时")

            else:
                print(f"  ❌ 生成请求失败: {response.status_code}")
                if response.text:
                    print(f"  📄 错误详情: {response.text[:200]}")

        except Exception as e:
            print(f"  ❌ 测试失败: {e}")

def main():
    """主函数"""
    print("🌐 万物可视化V2 - 线性代数模板测试")
    print("=" * 50)

    # 测试模板加载
    test_template_loading()

    # 测试可视化生成
    test_linear_algebra_generation()

    print("\n✨ 测试完成！")

if __name__ == "__main__":
    main()