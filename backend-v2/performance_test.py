#!/usr/bin/env python3
"""
万物可视化 v2.0 - 性能和压力测试
测试系统在高负载下的表现
"""

import asyncio
import json
import time
import requests
import random
import psutil
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

class PerformanceTester:
    def __init__(self, base_url: str = "http://localhost:9999"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v2"
        self.performance_results = []
        self.system_metrics = []

    def get_system_metrics(self) -> Dict[str, float]:
        """获取系统指标"""
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "timestamp": time.time()
        }

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
        print(f"   ⏱️  平均响应时间: {results.get('avg_response_time', 0):.2f}秒")
        print(f"   🚀 最快响应时间: {results.get('min_response_time', 0):.2f}秒")
        print(f"   🐌 最慢响应时间: {results.get('max_response_time', 0):.2f}秒")
        if 'qps' in results:
            print(f"   📈 QPS (每秒请求数): {results['qps']:.2f}")

    async def test_single_request_performance(self, num_requests: int = 100) -> bool:
        """测试单请求性能"""
        print(f"🎯 单请求性能测试 - {num_requests}个请求")

        response_times = []
        successful = 0
        failed = 0

        start_time = time.time()

        for i in range(num_requests):
            request_start = time.time()
            try:
                # 测试健康检查端点（轻量级）
                response = requests.get(f"{self.api_base}/health")
                request_time = time.time() - request_start
                response_times.append(request_time)

                if response.status_code == 200:
                    successful += 1
                else:
                    failed += 1

                # 每10个请求显示进度
                if (i + 1) % 10 == 0:
                    print(f"   进度: {i+1}/{num_requests} ({successful}成功)")

            except Exception:
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

        self.log_performance_test("单请求性能测试", results)
        return failed == 0

    async def test_concurrent_requests(self, num_concurrent: int = 10, total_requests: int = 50) -> bool:
        """测试并发请求性能"""
        print(f"🚀 并发请求测试 - {num_concurrent}个并发，总计{total_requests}个请求")

        response_times = []
        successful = 0
        failed = 0

        def make_request():
            """单个请求函数"""
            start_time = time.time()
            try:
                # 模拟真实的可视化生成请求
                response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": f"测试请求 {random.randint(1, 1000)}"}
                )
                response_time = time.time() - start_time
                return {
                    "success": response.status_code == 200,
                    "response_time": response_time
                }
            except Exception as e:
                response_time = time.time() - start_time
                return {
                    "success": False,
                    "response_time": response_time,
                    "error": str(e)
                }

        start_time = time.time()

        # 使用线程池执行并发请求
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [executor.submit(make_request) for _ in range(total_requests)]

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
                        print(f"   进度: {i+1}/{total_requests} ({successful}成功)")

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

        self.log_performance_test(f"并发请求测试 ({num_concurrent}并发)", results)
        return failed == 0

    async def test_visualization_generation_performance(self, num_requests: int = 20) -> bool:
        """测试可视化生成性能"""
        print(f"🎨 可视化生成性能测试 - {num_requests}个生成请求")

        prompts = [
            "正态分布 均值0 标准差1",
            "抛物线函数 y=x²",
            "二项分布 n=10 p=0.3",
            "线性函数 y=2x+1",
            "三角函数 sin(x)"
        ]

        generation_times = []
        successful = 0
        failed = 0

        start_time = time.time()

        for i in range(num_requests):
            prompt = prompts[i % len(prompts)]
            generation_start = time.time()

            try:
                print(f"   📝 生成请求 {i+1}/{num_requests}: {prompt}")

                # 步骤1: 分类
                classify_response = requests.post(
                    f"{self.api_base}/classify",
                    json={"prompt": prompt}
                )

                if classify_response.status_code != 200:
                    failed += 1
                    continue

                # 步骤2: 生成
                generate_response = requests.post(
                    f"{self.api_base}/generate",
                    json={"prompt": prompt}
                )

                if generate_response.status_code != 200:
                    failed += 1
                    continue

                generate_data = generate_response.json()
                generation_id = generate_data.get("generation_id")

                if not generation_id:
                    failed += 1
                    continue

                # 步骤3: 等待完成
                max_wait = 10
                for _ in range(max_wait):
                    status_response = requests.get(f"{self.api_base}/status/{generation_id}")
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        if status_data.get("status") == "completed":
                            generation_time = time.time() - generation_start
                            generation_times.append(generation_time)
                            successful += 1
                            break
                        elif status_data.get("status") == "failed":
                            failed += 1
                            break
                    await asyncio.sleep(1)
                else:
                    failed += 1

            except Exception as e:
                failed += 1
                print(f"   ❌ 生成失败: {e}")

        total_time = time.time() - start_time

        results = {
            "total_requests": num_requests,
            "successful_requests": successful,
            "failed_requests": failed,
            "avg_generation_time": statistics.mean(generation_times) if generation_times else 0,
            "min_generation_time": min(generation_times) if generation_times else 0,
            "max_generation_time": max(generation_times) if generation_times else 0,
            "total_time": total_time,
            "qps": successful / total_time if successful > 0 else 0
        }

        # 修改输出以显示生成时间
        print(f"\n📊 可视化生成性能测试")
        print(f"   🎯 生成请求总数: {results['total_requests']}")
        print(f"   ✅ 成功生成: {results['successful_requests']}")
        print(f"   ❌ 失败生成: {results['failed_requests']}")
        print(f"   ⏱️  平均生成时间: {results['avg_generation_time']:.2f}秒")
        print(f"   🚀 最快生成时间: {results['min_generation_time']:.2f}秒")
        print(f"   🐌 最慢生成时间: {results['max_generation_time']:.2f}秒")
        print(f"   📈 生成QPS: {results['qps']:.2f}")

        self.log_performance_test("可视化生成性能测试", results)
        return failed == 0

    async def test_system_under_load(self, duration_seconds: int = 60) -> bool:
        """测试系统在负载下的表现"""
        print(f"⚡ 负载测试 - 持续{duration_seconds}秒")

        start_time = time.time()
        end_time = start_time + duration_seconds

        request_count = 0
        successful = 0
        failed = 0
        response_times = []

        # 启动系统监控
        system_monitor_task = asyncio.create_task(self.monitor_system(end_time))

        while time.time() < end_time:
            request_start = time.time()
            try:
                # 随机选择不同类型的请求
                request_type = random.choice(['health', 'classify', 'templates'])

                if request_type == 'health':
                    response = requests.get(f"{self.api_base}/health")
                elif request_type == 'classify':
                    response = requests.post(
                        f"{self.api_base}/classify",
                        json={"prompt": f"负载测试 {request_count}"}
                    )
                else:
                    response = requests.get(f"{self.api_base}/templates")

                request_time = time.time() - request_start
                response_times.append(request_time)

                if response.status_code == 200:
                    successful += 1
                else:
                    failed += 1

                request_count += 1

                # 控制请求频率
                await asyncio.sleep(0.1)  # 100ms间隔

            except Exception:
                failed += 1
                request_time = time.time() - request_start
                response_times.append(request_time)

        # 停止系统监控
        system_monitor_task.cancel()

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

        self.log_performance_test(f"负载测试 ({duration_seconds}秒)", results)
        return failed / request_count < 0.05  # 允许5%失败率

    async def monitor_system(self, end_time: float):
        """监控系统指标"""
        try:
            while time.time() < end_time:
                metrics = self.get_system_metrics()
                self.system_metrics.append(metrics)
                await asyncio.sleep(5)  # 每5秒记录一次
        except asyncio.CancelledError:
            pass

    def analyze_system_metrics(self):
        """分析系统指标"""
        if not self.system_metrics:
            print("   📊 没有系统指标数据")
            return

        cpu_values = [m["cpu_percent"] for m in self.system_metrics]
        memory_values = [m["memory_percent"] for m in self.system_metrics]

        print(f"\n📊 系统资源使用分析")
        print(f"   💻 CPU使用率: 平均{statistics.mean(cpu_values):.1f}% "
              f"(最高{max(cpu_values):.1f}%, 最低{min(cpu_values):.1f}%)")
        print(f"   🧠 内存使用率: 平均{statistics.mean(memory_values):.1f}% "
              f"(最高{max(memory_values):.1f}%, 最低{min(memory_values):.1f}%)")

    async def run_all_tests(self) -> Dict[str, Any]:
        """运行所有性能测试"""
        print("🚀 万物可视化 v2.0 - 性能和压力测试")
        print("=" * 60)
        print()

        # 获取初始系统指标
        initial_metrics = self.get_system_metrics()
        print(f"📊 初始系统状态: CPU {initial_metrics['cpu_percent']:.1f}%, "
              f"内存 {initial_metrics['memory_percent']:.1f}%")
        print()

        try:
            # 测试1: 单请求性能
            await self.test_single_request_performance(50)

            # 测试2: 并发请求性能
            await self.test_concurrent_requests(5, 25)
            await self.test_concurrent_requests(10, 50)

            # 测试3: 可视化生成性能
            await self.test_visualization_generation_performance(10)

            # 测试4: 负载测试
            await self.test_system_under_load(30)

        except Exception as e:
            print(f"❌ 性能测试执行失败: {e}")

        # 分析系统指标
        self.analyze_system_metrics()

        # 生成性能报告
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
            "detailed_results": self.performance_results,
            "system_metrics": self.system_metrics
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

        if avg_qps >= 20 and avg_response_time < 0.1:
            return "A+ (优秀)"
        elif avg_qps >= 10 and avg_response_time < 0.5:
            return "A (良好)"
        elif avg_qps >= 5 and avg_response_time < 1.0:
            return "B (一般)"
        elif avg_qps >= 1 and avg_response_time < 2.0:
            return "C (较差)"
        else:
            return "D (需要优化)"

async def main():
    """主函数"""
    tester = PerformanceTester()

    try:
        await tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n⏹️  性能测试被用户中断")
    except Exception as e:
        print(f"\n💥 性能测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())