#!/usr/bin/env python3
"""测试 Web API"""
import requests
import json

API_BASE = "http://localhost:8000"

# 测试健康检查
print("=" * 60)
print("测试 1: 健康检查")
print("=" * 60)
response = requests.get(f"{API_BASE}/api/health")
print(f"状态码: {response.status_code}")
print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

# 测试术语生成
print("\n" + "=" * 60)
print("测试 2: 从术语生成动画")
print("=" * 60)

data = {
    "chinese": "集合",
    "english": "Set",
    "symbol": r"\{1, 2, 3\}",
    "save_to_db": True
}

print(f"请求数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
print("\n正在生成...")

response = requests.post(
    f"{API_BASE}/api/generate/terminology",
    json=data,
    timeout=30
)

print(f"\n状态码: {response.status_code}")
result = response.json()
print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")

if result.get("success"):
    print("\n✅ 生成成功！")
    print(f"场景名称: {result['scene_name']}")
    print(f"文件路径: {result.get('file_path')}")
    print(f"成本: ¥{result.get('cost', 0):.6f}")
else:
    print(f"\n❌ 生成失败: {result.get('error')}")

# 测试统计
print("\n" + "=" * 60)
print("测试 3: 获取统计信息")
print("=" * 60)
response = requests.get(f"{API_BASE}/api/stats")
print(f"统计信息: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

print("\n" + "=" * 60)
print("✅ 所有测试完成！")
print("=" * 60)
print("\n🌐 在浏览器中访问: http://localhost:8000")
