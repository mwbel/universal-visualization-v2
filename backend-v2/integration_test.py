#!/usr/bin/env python3
"""
万物可视化 v2.0 - 端到端集成测试
测试完整的用户工作流程
"""

import asyncio
import json
import time
import requests
import random
from typing import List, Dict, Any

class IntegrationTester:
    def __init__(self, base_url: str = "http://localhost:9999"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v2"
        self.test_results = []
        self.generation_times = []

    def log_test(self, test_name: str, success: bool, message: str = "", duration: float = 0):
        """记录测试结果"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration,
            "timestamp": time.time()
        }
        self.test_results.append(result)

        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")
        if duration > 0:
            print(f"   耗时: {duration:.2f}秒")
        print()

    async def test_api_health(self) -> bool:
        """测试API健康状态"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.api_base}/health")
            data = response.json()

            success = (
                response.status_code == 200 and
                data.get("status") == "healthy" and
                data.get("api_version") == "v2"
            )

            duration = time.time() - start_time
            self.log_test(
                "API健康检查",
                success,
                f"状态: {data.get('status')}, Agent数: {data.get('agents', 0)}",
                duration
            )
            return success
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("API健康检查", False, f"错误: {str(e)}", duration)
            return False

    async def test_template_system(self) -> bool:
        """测试模板系统"""
        start_time = time.time()
        try:
            # 获取所有模板
            response = requests.get(f"{self.api_base}/templates")
            data = response.json()

            templates_count = data.get("total", 0)
            subjects = data.get("subjects", [])

            # 测试搜索功能
            search_response = requests.get(f"{self.api_base}/templates/search?query=正态分布")
            search_data = search_response.json()

            # 测试分类功能
            classify_response = requests.post(
                f"{self.api_base}/classify",
                json={"prompt": "正态分布 均值0 标准差1"}
            )
            classify_data = classify_response.json()

            success = (
                response.status_code == 200 and
                templates_count > 0 and
                len(subjects) > 0 and
                search_response.status_code == 200 and
                classify_response.status_code == 200 and
                classify_data.get("subject") == "mathematics"
            )

            duration = time.time() - start_time
            self.log_test(
                "模板系统测试",
                success,
                f"模板数: {templates_count}, 学科: {len(subjects)}, 分类正确: {classify_data.get('subject')}",
                duration
            )
            return success
        except Exception as e:
            duration = time.time() - start_time
            self.log_test("模板系统测试", False, f"错误: {str(e)}", duration)
            return False

    async def test_complete_workflow(self, prompt: str) -> bool:
        """测试完整的可视化生成工作流程"""
        start_time = time.time()
        try:
            print(f"🎯 测试工作流: {prompt}")

            # 步骤1: 分类请求
            classify_response = requests.post(
                f"{self.api_base}/classify",
                json={"prompt": prompt}
            )
            classify_data = classify_response.json()
            subject = classify_data.get("subject")

            # 步骤2: 开始生成
            generate_response = requests.post(
                f"{self.api_base}/generate",
                json={"prompt": prompt}
            )
            generate_data = generate_response.json()
            generation_id = generate_data.get("generation_id")

            if not generation_id:
                raise ValueError("生成失败: 没有返回generation_id")

            # 步骤3: 轮询状态
            max_wait = 15  # 最多等待15秒
            wait_interval = 1

            for i in range(max_wait):
                status_response = requests.get(f"{self.api_base}/status/{generation_id}")
                status_data = status_response.json()

                status = status_data.get("status")
                progress = status_data.get("progress", 0)

                if status == "completed":
                    break
                elif status == "failed":
                    error = status_data.get("error", "未知错误")
                    raise ValueError(f"生成失败: {error}")
                elif status == "processing":
                    print(f"   ⏳ 处理中... {progress}%")
                    await asyncio.sleep(wait_interval)
                else:
                    await asyncio.sleep(wait_interval)
            else:
                raise ValueError("生成超时")

            # 步骤4: 获取可视化结果
            html_url = status_data.get("html_url")
            if not html_url:
                raise ValueError("没有返回可视化URL")

            viz_response = requests.get(f"{self.base_url}{html_url}")

            success = (
                viz_response.status_code == 200 and
                "<!DOCTYPE html>" in viz_response.text
            )

            duration = time.time() - start_time
            self.generation_times.append(duration)

            self.log_test(
                f"完整工作流测试",
                success,
                f"学科: {subject}, 生成ID: {generation_id[:8]}..., 内容长度: {len(viz_response.text)}",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_test(f"完整工作流测试", False, f"错误: {str(e)}", duration)
            return False

    async def test_concurrent_requests(self, num_requests: int = 3) -> bool:
        """测试并发请求处理"""
        start_time = time.time()
        try:
            prompts = [
                "正态分布 均值0 标准差1",
                "二项分布 n=10 p=0.3",
                "抛物线函数 y=x²"
            ]

            print(f"🚀 测试并发请求: {num_requests}个")

            # 创建并发任务
            tasks = []
            for i in range(num_requests):
                prompt = prompts[i % len(prompts)]
                task = self.test_complete_workflow(prompt)
                tasks.append(task)

            # 执行并发任务
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 统计结果
            successful = sum(1 for result in results if result is True)
            failed = sum(1 for result in results if result is False)

            success = failed == 0
            duration = time.time() - start_time

            self.log_test(
                f"并发请求测试 ({num_requests}个)",
                success,
                f"成功: {successful}, 失败: {failed}, 平均时间: {sum(self.generation_times[-num_requests:])/len(self.generation_times[-num_requests:]):.2f}秒",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_test(f"并发请求测试 ({num_requests}个)", False, f"错误: {str(e)}", duration)
            return False

    async def test_error_handling(self) -> bool:
        """测试错误处理"""
        start_time = time.time()
        try:
            error_tests = [
                # 无效的生成请求
                ("无效生成请求", lambda: requests.post(
                    f"{self.api_base}/generate",
                    json={"invalid_field": "test"}
                )),
                # 无效的状态查询
                ("无效状态查询", lambda: requests.get(
                    f"{self.api_base}/status/invalid-id"
                )),
                # 不存在的可视化
                ("不存在可视化", lambda: requests.get(
                    f"{self.api_base}/visualizations/invalid-id"
                ))
            ]

            success_count = 0
            total_tests = len(error_tests)

            for test_name, test_func in error_tests:
                try:
                    response = test_func()
                    # 错误请求应该返回4xx或5xx状态码
                    if 400 <= response.status_code < 600:
                        success_count += 1
                        print(f"   ✅ {test_name}: 正确返回错误 {response.status_code}")
                    else:
                        print(f"   ❌ {test_name}: 应该返回错误，但返回了 {response.status_code}")
                except Exception as e:
                    print(f"   ✅ {test_name}: 正确抛出异常 {str(e)}")
                    success_count += 1

            success = success_count == total_tests
            duration = time.time() - start_time

            self.log_test(
                "错误处理测试",
                success,
                f"正确处理: {success_count}/{total_tests} 个错误情况",
                duration
            )
            return success

        except Exception as e:
            duration = time.time() - start_time
            self.log_test("错误处理测试", False, f"测试失败: {str(e)}", duration)
            return False

    async def run_all_tests(self) -> Dict[str, Any]:
        """运行所有测试"""
        print("🧪 万物可视化 v2.0 - 端到端集成测试")
        print("=" * 50)
        print()

        # 基础测试
        health_ok = await self.test_api_health()
        if not health_ok:
            print("❌ API健康检查失败，跳过其他测试")
            return self.get_summary()

        templates_ok = await self.test_template_system()

        # 功能测试
        await self.test_complete_workflow("正态分布 均值0 标准差1")
        await self.test_complete_workflow("抛物线函数 y=x²")

        # 并发测试
        await self.test_concurrent_requests(2)

        # 错误处理测试
        await self.test_error_handling()

        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """获取测试总结"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests

        avg_generation_time = sum(self.generation_times) / len(self.generation_times) if self.generation_times else 0

        summary = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": passed_tests / total_tests if total_tests > 0 else 0,
            "avg_generation_time": avg_generation_time,
            "test_results": self.test_results
        }

        print("\n" + "=" * 50)
        print("📊 测试总结")
        print("=" * 50)
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"成功率: {summary['success_rate']*100:.1f}%")
        if avg_generation_time > 0:
            print(f"平均生成时间: {avg_generation_time:.2f}秒")

        print("\n🎯 测试详情:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result.get("duration"):
                print(f"   耗时: {result['duration']:.2f}秒")

        return summary

async def main():
    """主函数"""
    tester = IntegrationTester()

    try:
        await tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n⏹️  测试被用户中断")
    except Exception as e:
        print(f"\n💥 测试执行失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())