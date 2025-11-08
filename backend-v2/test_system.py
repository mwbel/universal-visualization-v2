#!/usr/bin/env python3
"""
万物可视化 v2.0 系统测试
"""

import asyncio
import json
import aiohttp
import time
from typing import Dict, Any

class VisualizationTester:
    def __init__(self, base_url: str = "http://localhost:9999"):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def test_api_endpoints(self):
        """测试所有API端点"""
        print("🧪 测试API端点...")

        # 测试根端点
        async with self.session.get(f"{self.base_url}/") as resp:
            assert resp.status == 200
            data = await resp.json()
            print(f"✅ API根端点: {data['name']}")

        # 测试模板获取
        async with self.session.get(f"{self.base_url}/api/v2/templates") as resp:
            assert resp.status == 200
            templates = await resp.json()
            print(f"✅ 模板数量: {templates['total']}")

        # 测试健康检查
        async with self.session.get(f"{self.base_url}/health") as resp:
            if resp.status == 200:
                health = await resp.json()
                print(f"✅ 系统健康: {health['status']}")

    async def test_subject_classification(self):
        """测试学科分类"""
        print("\n📚 测试学科分类...")

        test_cases = [
            ("正态分布 均值0 标准差1", "mathematics"),
            ("太阳系行星轨道", "astronomy"),
            ("抛体运动 45度角", "physics"),
            ("矩阵运算 特征值", "mathematics"),
            ("星座图 天球坐标", "astronomy"),
            ("简谐振动 频率", "physics")
        ]

        for prompt, expected_subject in test_cases:
            async with self.session.post(
                f"{self.base_url}/api/v2/classify",
                json={"prompt": prompt}
            ) as resp:
                assert resp.status == 200
                result = await resp.json()
                predicted = result['subject']
                status = "✅" if predicted == expected_subject else "❌"
                print(f"{status} '{prompt}' -> {predicted} (期望: {expected_subject})")

    async def test_visualization_generation(self, prompt: str, timeout: int = 30):
        """测试完整的可视化生成流程"""
        print(f"\n🎨 测试生成: {prompt}")

        # 1. 开始生成
        async with self.session.post(
            f"{self.base_url}/api/v2/generate",
            json={"prompt": prompt}
        ) as resp:
            assert resp.status == 200
            result = await resp.json()
            generation_id = result['generation_id']
            print(f"📝 生成ID: {generation_id}")

        # 2. 轮询状态
        start_time = time.time()
        while time.time() - start_time < timeout:
            async with self.session.get(
                f"{self.base_url}/api/v2/status/{generation_id}"
            ) as resp:
                assert resp.status == 200
                status = await resp.json()

                print(f"⏳ 状态: {status['status']} ({status['progress']}%)")

                if status['status'] == 'completed':
                    print(f"✅ 生成完成: {status['html_url']}")
                    return status
                elif status['status'] == 'failed':
                    print(f"❌ 生成失败: {status.get('error', '未知错误')}")
                    return status

                await asyncio.sleep(2)

        print(f"⏰ 生成超时 ({timeout}秒)")
        return None

    async def test_template_search(self):
        """测试模板搜索"""
        print("\n🔍 测试模板搜索...")

        search_terms = ["正态分布", "概率", "统计", "matrix", "物理"]

        for term in search_terms:
            async with self.session.get(
                f"{self.base_url}/api/v2/templates/search",
                params={"query": term}
            ) as resp:
                assert resp.status == 200
                result = await resp.json()
                print(f"🔍 搜索'{term}': 找到 {result['total']} 个模板")

    async def test_concurrent_requests(self, num_requests: int = 3):
        """测试并发请求"""
        print(f"\n🚀 测试并发请求 ({num_requests}个)...")

        prompts = [
            "正态分布 均值0 标准差1",
            "二项分布 n=10 p=0.3",
            "指数分布 λ=0.5"
        ]

        start_time = time.time()
        tasks = [
            self.test_visualization_generation(prompt, timeout=20)
            for prompt in prompts[:num_requests]
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()

        success_count = sum(1 for r in results if isinstance(r, dict) and r.get('status') == 'completed')
        print(f"✅ 并发测试完成: {success_count}/{num_requests} 成功, 耗时: {end_time - start_time:.2f}秒")

async def main():
    """主测试函数"""
    print("🧪 万物可视化 v2.0 系统测试")
    print("=" * 50)

    async with VisualizationTester() as tester:
        try:
            # 基础端点测试
            await tester.test_api_endpoints()

            # 学科分类测试
            await tester.test_subject_classification()

            # 模板搜索测试
            await tester.test_template_search()

            # 单个生成测试
            await tester.test_visualization_generation("正态分布 均值1 标准差2")

            # 并发请求测试
            await tester.test_concurrent_requests(2)

            print("\n🎉 所有测试完成！")

        except Exception as e:
            print(f"\n❌ 测试失败: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())