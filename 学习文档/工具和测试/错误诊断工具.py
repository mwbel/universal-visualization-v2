#!/usr/bin/env python3
"""
万物可视化错误诊断工具
帮助定位和解决可视化生成中的问题
"""

import requests
import json
import sys
from datetime import datetime

class DiagnosticTool:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 10

    def test_basic_connection(self):
        """测试基础连接"""
        print("🔍 测试基础连接...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 连接正常: {data['status']}")
                print(f"   版本: {data['version']}")
                print(f"   Agent数量: {data['agents']}")
                print(f"   活跃任务: {data['active_generations']}")
                return True
            else:
                print(f"❌ 连接失败: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 连接异常: {str(e)}")
            return False

    def test_templates(self):
        """测试模板系统"""
        print("\n📚 测试模板系统...")
        try:
            response = self.session.get(f"{self.base_url}/api/v2/templates")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 模板系统正常")
                print(f"   总模板数: {data['total']}")
                print(f"   支持学科: {', '.join(data['subjects'])}")

                for template in data['templates']:
                    print(f"   - {template['name']} ({template['id']})")
                    print(f"     学科: {template['subject']}")
                    print(f"     状态: {'活跃' if template.get('is_active') else '未激活'}")

                return data
            else:
                print(f"❌ 模板系统异常: HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ 模板系统错误: {str(e)}")
            return None

    def test_generation_request(self, prompt="画一个简单的正弦函数"):
        """测试生成请求"""
        print(f"\n🎨 测试生成请求: {prompt}")

        request_data = {
            "prompt": prompt,
            "template_id": "normal_distribution"
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/v2/generate",
                json=request_data
            )

            if response.status_code == 200:
                data = response.json()
                generation_id = data.get("generation_id")
                print(f"✅ 生成请求已提交")
                print(f"   任务ID: {generation_id}")
                print(f"   状态: {data['status']}")
                print(f"   预计时间: {data.get('estimated_time', '未知')}秒")

                return generation_id
            else:
                print(f"❌ 生成请求失败: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   错误详情: {error_data}")
                except:
                    print(f"   响应内容: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 生成请求异常: {str(e)}")
            return None

    def test_generation_status(self, generation_id):
        """测试生成状态"""
        print(f"\n⏳ 测试生成状态: {generation_id}")

        try:
            response = self.session.get(f"{self.base_url}/api/v2/status/{generation_id}")

            if response.status_code == 200:
                data = response.json()
                print(f"   当前状态: {data['status']}")
                print(f"   进度: {data.get('progress', 0)}%")
                print(f"   创建时间: {data.get('created_at')}")

                if data.get('html_url'):
                    print(f"   结果URL: {self.base_url}{data['html_url']}")

                    # 测试结果访问
                    self.test_visualization_result(data['html_url'])

                return data
            else:
                print(f"❌ 状态查询失败: HTTP {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ 状态查询异常: {str(e)}")
            return None

    def test_visualization_result(self, html_url):
        """测试可视化结果"""
        print(f"\n🎨 测试可视化结果: {html_url}")

        try:
            response = self.session.get(f"{self.base_url}{html_url}")

            if response.status_code == 200:
                content = response.text
                if "模板渲染错误" in content:
                    print("❌ 发现模板渲染错误!")
                    print("   问题可能原因:")
                    print("   1. 模板文件不存在或损坏")
                    print("   2. 模板变量引用错误")
                    print("   3. Jinja2模板语法错误")

                    # 提取错误信息
                    import re
                    error_match = re.search(r'<p>(.*?)</p>', content)
                    if error_match:
                        print(f"   错误信息: {error_match.group(1)}")

                    return False
                elif "万物可视化" in content:
                    print("✅ 可视化内容正常")
                    print(f"   内容长度: {len(content)} 字符")
                    return True
                else:
                    print("⚠️ 可视化内容可能不完整")
                    return False
            else:
                print(f"❌ 可视化访问失败: HTTP {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ 可视化测试异常: {str(e)}")
            return False

    def run_full_diagnosis(self):
        """运行完整诊断"""
        print("🔍 万物可视化错误诊断工具")
        print("=" * 50)
        print(f"⏰ 时间: {datetime.now().isoformat()}")

        # 测试基础连接
        if not self.test_basic_connection():
            print("\n❌ 基础连接失败，请检查:")
            print("   1. 后端服务是否正在运行")
            print("   2. 端口8000是否可访问")
            print("   3. 运行: ./start-v2.sh")
            return

        # 测试模板系统
        templates = self.test_templates()
        if not templates:
            print("\n❌ 模板系统失败，可能的原因:")
            print("   1. 模板文件未正确加载")
            print("   2. 模板目录权限问题")
            print("   3. JSON格式错误")
            return

        # 测试生成请求
        generation_id = self.test_generation_request()
        if not generation_id:
            print("\n❌ 生成请求失败，可能的原因:")
            print("   1. 请求数据格式错误")
            print("   2. 后端处理异常")
            print("   3. 系统资源不足")
            return

        # 等待并测试状态
        import time
        print("\n⏳ 等待生成完成...")
        time.sleep(3)

        status = self.test_generation_status(generation_id)
        if status and status.get('status') == 'completed':
            print("\n✅ 完整数据流测试通过!")
            print("\n📊 诊断结果总结:")
            print("   - 基础连接: ✅")
            print("   - 模板系统: ✅")
            print("   - 生成流程: ✅")
            print("   - 结果访问: ✅")
        else:
            print("\n⚠️ 生成过程可能存在问题")
            print("   建议检查:")
            print("   1. 后端日志: tail -f backend-v2/logs/app.log")
            print("   2. 浏览器控制台: F12查看前端错误")
            print("   3. 重新提交生成请求")

def main():
    """主函数"""
    if len(sys.argv) > 1:
        custom_url = sys.argv[1]
        print(f"🔧 使用自定义URL: {custom_url}")
        diagnostic = DiagnosticTool(custom_url)
    else:
        diagnostic = DiagnosticTool()

    diagnostic.run_full_diagnosis()

if __name__ == "__main__":
    main()