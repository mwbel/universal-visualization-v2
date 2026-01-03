#!/usr/bin/env python3
"""
万物可视化系统 - 综合功能测试脚本
测试文件上传、分析、可视化生成的完整流程
"""

import requests
import json
import time
import os
from pathlib import Path

# API配置
API_BASE_URL = "http://localhost:8000/api/v4"
TEST_FILE_PATH = "backend-v2/test_sample.txt"

class VisualizationSystemTester:
    def __init__(self, base_url=API_BASE_URL):
        self.base_url = base_url
        self.test_results = []

    def log_test(self, test_name, success, message="", data=None):
        """记录测试结果"""
        result = {
            "test_name": test_name,
            "success": success,
            "message": message,
            "timestamp": time.time(),
            "data": data
        }
        self.test_results.append(result)

        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        print()

    def test_api_connectivity(self):
        """测试API连接性"""
        try:
            response = requests.get(f"{"http://localhost:8000/docs"", timeout=5)
            success = response.status_code == 200
            self.log_test(
                "API连接性测试",
                success,
                "API服务可访问" if success else f"API服务不可用: {response.status_code}"
            )
            return success
        except Exception as e:
            self.log_test("API连接性测试", False, f"连接失败: {str(e)}")
            return False

    def test_file_upload(self, file_path):
        """测试文件上传功能"""
        if not os.path.exists(file_path):
            self.log_test("文件上传测试", False, f"测试文件不存在: {file_path}")
            return None

        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'text/plain')}
                response = requests.post(f"{self.base_url}/files/upload", files=files)

            success = response.status_code == 200
            if success:
                data = response.json()
                file_id = data.get('file_id')
                self.log_test(
                    "文件上传测试",
                    True,
                    f"文件上传成功，ID: {file_id}",
                    data
                )
                return file_id
            else:
                self.log_test("文件上传测试", False, f"上传失败: {response.status_code}")
                return None

        except Exception as e:
            self.log_test("文件上传测试", False, f"上传异常: {str(e)}")
            return None

    def test_file_analysis(self, file_id):
        """测试文件分析功能"""
        if not file_id:
            self.log_test("文件分析测试", False, "缺少文件ID")
            return None

        try:
            payload = {
                "file_id": file_id,
                "analysis_options": {},
                "auto_visualize": True
            }
            response = requests.post(
                f"{self.base_url}/files/analyze/{file_id}",
                json=payload
            )

            success = response.status_code == 200
            if success:
                data = response.json()
                confidence = data.get('confidence_score', 0)
                status = data.get('analysis_status', 'unknown')
                self.log_test(
                    "文件分析测试",
                    True,
                    f"分析完成，置信度: {confidence:.2%}，状态: {status}",
                    data
                )
                return data
            else:
                self.log_test("文件分析测试", False, f"分析失败: {response.status_code}")
                return None

        except Exception as e:
            self.log_test("文件分析测试", False, f"分析异常: {str(e)}")
            return None

    def test_visualization_generation(self, file_id, analysis_data):
        """测试可视化生成功能"""
        if not file_id or not analysis_data:
            self.log_test("可视化生成测试", False, "缺少文件ID或分析数据")
            return None

        # 获取推荐的可视化类型
        suggested_viz = analysis_data.get('suggested_visualizations', [])
        if not suggested_viz:
            suggested_viz = ['content_summary']  # 默认类型

        viz_type = suggested_viz[0]

        try:
            payload = {
                "file_id": file_id,
                "visualization_type": viz_type,
                "template_options": {},
                "output_format": "html",
                "custom_title": "测试可视化"
            }
            response = requests.post(
                f"{self.base_url}/files/visualize/generate",
                json=payload
            )

            success = response.status_code == 200
            if success:
                data = response.json()
                viz_id = data.get('visualization_id')
                download_url = data.get('download_url')
                self.log_test(
                    "可视化生成测试",
                    True,
                    f"可视化生成成功，ID: {viz_id}，类型: {viz_type}",
                    data
                )
                return data
            else:
                self.log_test("可视化生成测试", False, f"生成失败: {response.status_code}")
                return None

        except Exception as e:
            self.log_test("可视化生成测试", False, f"生成异常: {str(e)}")
            return None

    def test_file_list(self):
        """测试文件列表功能"""
        try:
            response = requests.get(f"{self.base_url}/files/")
            success = response.status_code == 200

            if success:
                data = response.json()
                file_count = data.get('total_count', 0)
                self.log_test(
                    "文件列表测试",
                    True,
                    f"获取文件列表成功，共 {file_count} 个文件",
                    data
                )
            else:
                self.log_test("文件列表测试", False, f"获取失败: {response.status_code}")

        except Exception as e:
            self.log_test("文件列表测试", False, f"获取异常: {str(e)}")

    def test_error_handling(self):
        """测试错误处理"""
        try:
            # 测试不存在的文件ID
            fake_id = "00000000-0000-0000-0000-000000000000"
            response = requests.post(
                f"{self.base_url}/files/analyze/{fake_id}",
                json={"file_id": fake_id}
            )

            # 应该返回404错误
            success = response.status_code == 404
            self.log_test(
                "错误处理测试",
                success,
                "404错误处理正确" if success else "错误处理异常"
            )

        except Exception as e:
            self.log_test("错误处理测试", False, f"错误处理测试异常: {str(e)}")

    def run_comprehensive_test(self):
        """运行综合测试"""
        print("🚀 开始万物可视化系统综合功能测试\n")

        # 1. 测试API连接性
        if not self.test_api_connectivity():
            print("❌ API服务不可用，终止测试")
            return False

        # 2. 测试文件上传
        file_id = self.test_file_upload(TEST_FILE_PATH)

        # 3. 测试文件分析
        analysis_data = self.test_file_analysis(file_id)

        # 4. 测试可视化生成
        viz_data = self.test_visualization_generation(file_id, analysis_data)

        # 5. 测试文件列表
        self.test_file_list()

        # 6. 测试错误处理
        self.test_error_handling()

        # 生成测试报告
        self.generate_report()

        return True

    def generate_report(self):
        """生成测试报告"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        failed_tests = total_tests - passed_tests

        print("=" * 60)
        print("📊 测试报告")
        print("=" * 60)
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests}")
        print(f"失败测试: {failed_tests}")
        print(f"成功率: {(passed_tests/total_tests)*100:.1f}%")
        print()

        if failed_tests > 0:
            print("❌ 失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['message']}")
            print()

        # 保存详细报告
        report_data = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": (passed_tests/total_tests)*100
            },
            "test_results": self.test_results,
            "timestamp": time.time()
        }

        with open("test_report.json", "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

        print("📝 详细测试报告已保存到 test_report.json")

if __name__ == "__main__":
    tester = VisualizationSystemTester()
    tester.run_comprehensive_test()
