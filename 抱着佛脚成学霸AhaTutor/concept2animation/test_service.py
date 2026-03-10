"""
测试 Concept2Animation 服务
"""

import requests
import json
import time

BASE_URL = "http://localhost:8002"

def test_health():
    """测试健康检查"""
    print("=" * 60)
    print("🔍 测试健康检查")
    print("=" * 60)
    response = requests.get(f"{BASE_URL}/health")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print()

def test_concepts():
    """测试概念列表"""
    print("=" * 60)
    print("📚 获取支持的概念列表")
    print("=" * 60)
    response = requests.get(f"{BASE_URL}/concepts")
    data = response.json()
    print(f"总共支持 {data['total']} 个概念:\n")
    for concept in data['concepts']:
        print(f"  📖 {concept['name']}")
        print(f"     关键词: {', '.join(concept['keywords'])}")
        print(f"     前置知识: {', '.join(concept['prerequisites'])}")
        print()

def test_generate_pythagorean():
    """测试生成勾股定理动画"""
    print("=" * 60)
    print("🎬 生成勾股定理动画")
    print("=" * 60)

    print("发送请求...")
    start_time = time.time()

    response = requests.post(
        f"{BASE_URL}/generate",
        json={
            "concept": "勾股定理",
            "language": "zh",
            "quality": "l",  # 使用低质量加快测试
            "style": "educational"
        }
    )

    elapsed = time.time() - start_time
    result = response.json()

    print(f"⏱️  耗时: {elapsed:.2f} 秒\n")

    if result["success"]:
        print("✅ 生成成功！")
        print(f"📹 视频地址: {BASE_URL}{result['video_path']}")
        print(f"\n📊 概念分析:")
        print(json.dumps(result['concept_analysis'], indent=2, ensure_ascii=False))
        print(f"\n💻 生成的代码 (前 500 字符):")
        print(result['code'][:500] + "...")
    else:
        print(f"❌ 生成失败: {result['error']}")
    print()

def test_generate_sine():
    """测试生成正弦函数动画"""
    print("=" * 60)
    print("🎬 生成正弦函数动画")
    print("=" * 60)

    print("发送请求...")
    start_time = time.time()

    response = requests.post(
        f"{BASE_URL}/generate",
        json={
            "concept": "正弦函数",
            "quality": "l",
            "style": "educational"
        }
    )

    elapsed = time.time() - start_time
    result = response.json()

    print(f"⏱️  耗时: {elapsed:.2f} 秒\n")

    if result["success"]:
        print("✅ 生成成功！")
        print(f"📹 视频地址: {BASE_URL}{result['video_path']}")
    else:
        print(f"❌ 生成失败: {result['error']}")
    print()

def test_generate_unknown():
    """测试生成未知概念动画"""
    print("=" * 60)
    print("🎬 生成未知概念动画（测试默认生成）")
    print("=" * 60)

    print("发送请求...")

    response = requests.post(
        f"{BASE_URL}/generate",
        json={
            "concept": "量子纠缠",
            "quality": "l"
        }
    )

    result = response.json()

    if result["success"]:
        print("✅ 生成成功（使用默认模板）")
        print(f"📹 视频地址: {BASE_URL}{result['video_path']}")
        print(f"🔍 概念识别: {result['concept_analysis']['recognized']}")
    else:
        print(f"❌ 生成失败: {result['error']}")
    print()

if __name__ == "__main__":
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "Concept2Animation 服务测试" + " " * 20 + "║")
    print("╚" + "═" * 58 + "╝")
    print()

    try:
        # 1. 健康检查
        test_health()

        # 2. 概念列表
        test_concepts()

        # 3. 生成勾股定理（如果 Manim 已安装）
        print("⚠️  以下测试需要安装 Manim，可能需要较长时间...")
        print("如果不想等待，可以按 Ctrl+C 跳过\n")

        try:
            test_generate_pythagorean()
            # test_generate_sine()
            # test_generate_unknown()
        except KeyboardInterrupt:
            print("\n⏭️  跳过动画生成测试")

        print("=" * 60)
        print("✅ 测试完成")
        print("=" * 60)
        print()
        print("💡 提示:")
        print("  - 访问 http://localhost:8002/docs 查看完整 API 文档")
        print("  - 生成的视频保存在 ./media/videos/ 目录")
        print()

    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务")
        print("请先启动服务: python app.py")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
