#!/usr/bin/env python3
"""
万物可视化 v2.0 - 简化性能测试
不依赖外部库，专注于API性能测试
"""

import asyncio
import json
import time
import requests
import random
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

class SimplePerformanceTester:
    def __init__(self, base_url: str = "http://localhost:9999"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v2"
        self.performance_results = []

    def log_performance_test(self, test_name: str, results: Dict[str, Any]):
        """记录性能测试结果"""
        self.performance_results.append({
            "test": test_name,
            "results": results,
            "timestamp": time.time()
        })

        print(f"\n📊 {test_name}")
        print(f"   🎯 请求总数: {results.get('total_requests', 0)}")
        print(f"   ✅ 成功请求: {results.get('successful_requests', 0)}")
        print(f"   ❌ 失败请求: {results.get('failed_requests', 0)}")
        print(f"   ⏱️  平均响应时间: {results.get('avg_response_time', 0):.3f}秒")
        print(f"   🚀 最快响应时间: {results.get('min_response_time', 0):.3f}秒")
        print(f"   🐌 最慢响应时间: {results.get('max_response_time', 0):.3f}秒")
        if 'qps' in results:
            print(f"   📈 QPS (每秒请求数): {results['qps']:.2f}")

    async def test_api_endpoint_performance(self, endpoint: str, method: str = 'GET',
                                      data: Dict = None, num_requests: int = 100) -> bool:
        """测试API端点性能"""
        print(f"🎯 {endpoint} 性能测试 - {num_requests}个请求")

        response_times = []
        successful = 0
        failed = 0

        start_time = time.time()

        for i in range(num_requests):
            request_start = time.time()
            try:
                if method == 'GET':
                    response = requests.get(f"{self.api_base}{endpoint}")
                elif method == 'POST':
                    if data:
                        response = requests.post(f"{self.api_base}{endpoint}", json=data)
                    else:
                        response = requests.post(f"{self.api_base}{endpoint}")
                else:
                    raise ValueError(f"不支持的HTTP方法: {method}")

                request_time = time.time() - request_start
                response_times.append(request_time)

                if response.status_code == 200:
                    successful += 1
                else:
                    failed += 1

                # 每20个请求显示进度
                if (i + 1) % 20 == 0:
                    print(f"   进度: {i+1}/{num_requests} (成功: {successful})")

            except Exception as e:
                failed += 1
                request_time = time.time() - request_start
                response_times.append(request_time)

        total_time = time.time() - start_time

        results = {
            "total_requests": num_requests,
            "successful_requests": successful,
            "failed_requests": failed,
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "total_time": total_time,
            "qps": num_requests / total_time
        }

        self.log_performance_test(f"{endpoint} 端点性能", results)
        return failed == 0

    async def test_concurrent_classify(self, num_concurrent: int = 10, total_requests: int = 50) -> bool:
        """测试并发分类请求"""
        print(f"🚀 并发分类测试 - {num_concurrent}个并发，总计{total_requests}个请求")

        response_times = []
        successful = 0
        failed = 0

        def make_classify_request():
            """单个分类请求函数"""
            start_time = time.time()
            try:
                prompts = [
                    "正态分布 均值0 标准差1",
                    "抛物线函数 y=x²",
                    "二项分布 n=10 p=0.3",
                    "三角函数 sin(x)",
                    "线性函数 y=2x+1"
                ]

                prompt = random.choice(prompts)
                response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": f"并发测试 {prompt}"}
                )

                request_time = time.time() - start_time
                return {
                    "success": response.status_code == 200,
                    "response_time": request_time,
                    "prompt": prompt
                }
            except Exception as e:
                request_time = time.time() - start_time
                return {
                    "success": False,
                    "response_time": request_time,
                    "error": str(e)
                }

        start_time = time.time()

        # 使用线程池执行并发请求
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [executor.submit(make_classify_request) for _ in range(total_requests)]

            for i, future in enumerate(as_completed(futures)):
                try:
                    result = future.result()
                    response_times.append(result["response_time"])

                    if result["success"]:
                        successful += 1
                    else:
                        failed += 1

                    # 显示进度
                    if (i + 1) % 10 == 0:
                        print(f"   进度: {i+1}/{total_requests} (成功: {successful})")

                except Exception as e:
                    failed += 1
                    print(f"   ⚠️  请求异常: {e}")

        total_time = time.time() - start_time

        results = {
            "total_requests": total_requests,
            "successful_requests": successful,
            "failed_requests": failed,
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "total_time": total_time,
            "qps": total_requests / total_time,
            "concurrency": num_concurrent
        }

        self.log_performance_test(f"并发分类测试 ({num_concurrent}并发)", results)
        return failed / total_requests < 0.1  # 允许10%失败率

    async def test_visualization_pipeline(self, num_tests: int = 10) -> bool:
        """测试完整的可视化管道"""
        print(f"🎨 可视化管道测试 - {num_tests}个完整流程")

        generation_times = []
        successful = 0
        failed = 0

        start_time = time.time()

        prompts = [
            "正态分布 均值0 标准差1",
            "抛物线函数 y=x²",
            "三角函数 sin(x) cos(x)",
            "柱状图数据分布",
            "概率密度函数"
        ]

        for i in range(num_tests):
            prompt = prompts[i % len(prompts)]
            generation_start = time.time()

            try:
                print(f"   📝 生成请求 {i+1}/{num_tests}: {prompt}")

                # 步骤1: 分类
                classify_response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": prompt}
                )

                if classify_response.status_code != 200:
                    print(f"      ❌ 分类失败: {classify_response.status_code}")
                    failed += 1
                    continue

                classify_time = time.time() - generation_start

                # 步骤2: 生成
                generate_response = requests.post(
                    f"{self.api_base}/generate",
                    json={"prompt": prompt}
                )

                if generate_response.status_code != 200:
                    print(f"      ❌ 生成失败: {generate_response.status_code}")
                    failed += 1
                    continue

                generate_data = generate_response.json()
                generation_id = generate_data.get("generation_id")

                if not generation_id:
                    print(f"      ❌ 没有生成ID")
                    failed += 1
                    continue

                generate_time = time.time() - generation_start

                # 步骤3: 等待完成（简化版本，只等待2秒）
                await asyncio.sleep(2)

                generation_time = time.time() - generation_start
                generation_times.append(generation_time)
                successful += 1

                print(f"      ✅ 完成: 分类{classify_time:.2f}s, 生成{generate_time:.2f}s")

            except Exception as e:
                print(f"      ❌ 异常: {e}")
                failed += 1

        total_time = time.time() - start_time

        results = {
            "total_requests": num_tests,
            "successful_requests": successful,
            "failed_requests": failed,
            "avg_generation_time": statistics.mean(generation_times) if generation_times else 0,
            "min_generation_time": min(generation_times) if generation_times else 0,
            "max_generation_time": max(generation_times) if generation_times else 0,
            "total_time": total_time,
            "qps": successful / total_time if successful > 0 else 0
        }

        # 自定义显示
        print(f"\n📊 可视化管道测试")
        print(f"   🎯 测试请求总数: {results['total_requests']}")
        print(f"   ✅ 成功管道: {results['successful_requests']}")
        print(f"   ❌ 失败管道: {results['failed_requests']}")
        print(f"   ⏱️  平均管道时间: {results['avg_generation_time']:.2f}秒")
        print(f"   🚀 最快管道时间: {results['min_generation_time']:.2f}秒")
        print(f"   🐌 最慢管道时间: {results['max_generation_time']:.2f}秒")
        print(f"   📈 管道QPS: {results['qps']:.2f}")

        self.log_performance_test("可视化管道测试", results)
        return failed == 0

    async def test_stress_load(self, duration_seconds: int = 30) -> bool:
        """测试压力负载"""
        print(f"⚡ 压力负载测试 - 持续{duration_seconds}秒")

        start_time = time.time()
        end_time = start_time + duration_seconds

        request_count = 0
        successful = 0
        failed = 0
        response_times = []

        while time.time() < end_time:
            request_start = time.time()
            try:
                # 混合不同类型的请求
                request_type = random.choice(['health', 'classify', 'templates'])

                if request_type == 'health':
                    response = requests.get(f"{self.api_base}/health")
                elif request_type == 'classify':
                    response = requests.post(
                        f"{self.api_base}/classify",
                        json={"prompt": f"压力测试 {request_count}"}
                    )
                else:  # templates
                    response = requests.get(f"{self.api_base}/templates")

                request_time = time.time() - request_start
                response_times.append(request_time)

                if response.status_code == 200:
                    successful += 1
                else:
                    failed += 1

                request_count += 1

                # 控制请求频率
                await asyncio.sleep(0.05)  # 50ms间隔，约20 QPS

            except Exception as e:
                failed += 1
                request_time = time.time() - request_start
                response_times.append(request_time)

        actual_duration = time.time() - start_time

        results = {
            "total_requests": request_count,
            "successful_requests": successful,
            "failed_requests": failed,
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "total_time": actual_duration,
            "qps": request_count / actual_duration
        }

        self.log_performance_test(f"压力负载测试 ({duration_seconds}秒)", results)
        return failed / request_count < 0.05  # 允许5%失败率

    async def run_all_tests(self) -> Dict[str, Any]:
        """运行所有性能测试"""
        print("🚀 万物可视化 v2.0 - 性能测试")
        print("=" * 60)
        print()

        try:
            # 测试1: 健康检查端点性能
            await self.test_api_endpoint_performance("/health", "GET", None, 50)

            # 测试2: 分类端点性能
            classify_data = {"prompt": "性能测试"}
            await self.test_api_endpoint_performance("/classify", "POST", classify_data, 30)

            # 测试3: 并发分类测试
            await self.test_concurrent_classify(5, 25)
            await self.test_concurrent_classify(10, 50)

            # 测试4: 可视化管道测试
            await self.test_visualization_pipeline(5)

            # 测试5: 压力负载测试
            await self.test_stress_load(20)

        except Exception as e:
            print(f"❌ 性能测试执行失败: {e}")

        return self.generate_performance_report()

    def generate_performance_report(self) -> Dict[str, Any]:
        """生成性能报告"""
        total_tests = len(self.performance_results)
        successful_tests = sum(1 for r in self.performance_results
                              if r["results"].get("failed_requests", 0) == 0)

        print("\n" + "=" * 60)
        print("📊 性能测试报告")
        print("=" * 60)
        print(f"测试项目: {total_tests}")
        print(f"成功测试: {successful_tests}")
        print(f"成功率: {successful_tests/total_tests*100:.1f}%")
        print(f"性能等级: {self.get_performance_grade()}")

        print("\n🎯 详细结果:")
        for result in self.performance_results:
            test_name = result["test"]
            test_results = result["results"]
            qps = test_results.get("qps", 0)
            avg_time = test_results.get("avg_response_time", 0)

            print(f"   📋 {test_name}")
            print(f"      QPS: {qps:.2f}, 平均响应: {avg_time:.3f}s")

        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "performance_grade": self.get_performance_grade(),
            "detailed_results": self.performance_results
        }

    def get_performance_grade(self) -> str:
        """评估性能等级"""
        if not self.performance_results:
            return "无法评估"

        avg_qps = statistics.mean([
            r["results"].get("qps", 0)
            for r in self.performance_results
            if "qps" in r["results"]
        ])

        avg_response_time = statistics.mean([
            r["results"].get("avg_response_time", 0)
            for r in self.performance_results
        ])

        if avg_qps >= 15 and avg_response_time < 0.2:
            return "A+ (优秀)"
        elif avg_qps >= 10 and avg_response_time < 0.5:
            return "A (良好)"
        elif avg_qps >= 5 and avg_response_time < 1.0:
            return "B (一般)"
        elif avg_qps >= 2 and avg_response_time < 2.0:
            return "C (较差)"
        else:
            return "D (需要优化)"

async def main():
    """主函数"""
    tester = SimplePerformanceTester()

    try:
        await tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n⏹️  性能测试被用户中断")
    except Exception as e:
        print(f"\n💥 性能测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())