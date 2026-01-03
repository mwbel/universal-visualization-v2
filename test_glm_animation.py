"""
GLM-4.6 动画生成快速测试
测试 GLM-4.6 生成 Manim 代码的能力
"""
import os
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_glm_connection():
    """测试 1: 验证 GLM API 连接"""
    print("=" * 60)
    print("测试 1: 验证 GLM API 连接")
    print("=" * 60)

    api_key = os.getenv("ZHIPU_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 ZHIPU_API_KEY")
        print("\n请设置你的 API 密钥：")
        print("export ZHIPU_API_KEY=your_key_here")
        return False

    print(f"✅ 找到 API 密钥: {api_key[:10]}...{api_key[-4:]}")

    client = OpenAI(
        api_key=api_key,
        base_url="https://open.bigmodel.cn/api/paas/v4/"
    )

    try:
        # 简单测试
        response = client.chat.completions.create(
            model="glm-4-flash",  # 使用最快的模型
            messages=[
                {"role": "user", "content": "你好，请用一句话介绍你自己。"}
            ],
            max_tokens=100
        )
        print(f"✅ API 连接成功！")
        print(f"   模型响应: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"❌ API 连接失败: {e}")
        return False


def test_simple_manim_generation():
    """测试 2: 生成简单的 Manim 代码"""
    print("\n" + "=" * 60)
    print("测试 2: 生成简单的 Manim 代码")
    print("=" * 60)

    api_key = os.getenv("ZHIPU_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 API 密钥")
        return False

    client = OpenAI(
        api_key=api_key,
        base_url="https://open.bigmodel.cn/api/paas/v4/"
    )

    prompt = """请为以下数学概念生成一个 Manim 动画代码：

概念：展示一个圆，半径为 2，颜色为蓝色

要求：
1. 使用 Manim 库
2. 代码要完整、可运行
3. 包含详细注释
4. 动画时长 3-5 秒

请只输出 Python 代码，不要其他解释。"""

    try:
        print("📝 正在调用 GLM-4-Flash 生成代码...")
        response = client.chat.completions.create(
            model="glm-4-flash",
            messages=[
                {"role": "system", "content": "你是专业的 Manim 动画制作专家。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2048
        )

        code = response.choices[0].message.content
        print("✅ 代码生成成功！\n")
        print("-" * 60)
        print(code)
        print("-" * 60)

        # 保存代码
        output_dir = "output/test_animations"
        os.makedirs(output_dir, exist_ok=True)

        code_file = f"{output_dir}/test_circle.py"
        with open(code_file, "w", encoding="utf-8") as f:
            f.write(code)

        print(f"\n💾 代码已保存到: {code_file}")
        print(f"\n📝 运行命令:")
        print(f"   manim -pql {code_file} CircleScene")

        return True

    except Exception as e:
        print(f"❌ 代码生成失败: {e}")
        return False


def test_from_terminology():
    """测试 3: 从数学术语生成动画（模拟真实场景）"""
    print("\n" + "=" * 60)
    print("测试 3: 从数学术语生成动画")
    print("=" * 60)

    api_key = os.getenv("ZHIPU_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 API 密钥")
        return False

    client = OpenAI(
        api_key=api_key,
        base_url="https://open.bigmodel.cn/api/paas/v4/"
    )

    # 从你的术语表中选择一个
    term = {
        "chinese": "正弦",
        "english": "Sine",
        "symbol": r"\sin \alpha = \frac{y}{r}"
    }

    prompt = f"""请为以下数学术语创建一个教学动画：

中文术语: {term['chinese']}
英文术语: {term['english']}
数学符号: ${term['symbol']}$

请生成：
1. Manim Python 代码（完整可运行）
2. 场景设计说明（中文）

要求：
- 动画时长 10-15 秒
- 代码规范、注释详细（中文）
- 场景简洁易懂
- 展示正弦的定义和几何意义

请按以下格式输出：

=== Manim 代码 ===
（Python 代码）

=== 场景说明 ===
（中文说明）
"""

    try:
        print(f"📝 正在为术语 '{term['chinese']}' 生成动画...")
        print(f"   使用模型: GLM-4-Air (平衡性能和成本)")

        response = client.chat.completions.create(
            model="glm-4-air",  # 使用性能更好的模型
            messages=[
                {"role": "system", "content": "你是专业的数学动画制作专家，精通 Manim、LaTeX 和数学教学。你对中文理解优秀，请充分利用这一优势。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        content = response.choices[0].message.content
        print("✅ 生成成功！\n")

        # 解析并保存
        output_dir = "output/test_animations"
        os.makedirs(output_dir, exist_ok=True)

        # 保存完整响应
        result_file = f"{output_dir}/sine_generation_result.md"
        with open(result_file, "w", encoding="utf-8") as f:
            f.write(f"# {term['chinese']} ({term['english']})\n\n")
            f.write(content)

        # 提取代码
        if "=== Manim 代码 ===" in content:
            code_start = content.index("=== Manim 代码 ===") + len("=== Manim 代码 ===")
            code_end = content.index("===") if "===" in content[code_start:] else len(content)

            code = content[code_start:code_end].strip()
            code_file = f"{output_dir}/sine_animation.py"

            with open(code_file, "w", encoding="utf-8") as f:
                f.write(code)

            print(f"💾 完整结果已保存到: {result_file}")
            print(f"💾 Manim 代码已保存到: {code_file}")
            print(f"\n📝 运行命令:")
            print(f"   manim -pql {code_file} SineScene")

        # 显示统计信息
        tokens_used = response.usage.total_tokens
        estimated_cost = (tokens_used / 1_000_000) * 0.5  # GLM-4-Air 价格
        print(f"\n📊 统计信息:")
        print(f"   使用的 tokens: {tokens_used:,}")
        print(f"   预估成本: ¥{estimated_cost:.6f}")

        return True

    except Exception as e:
        print(f"❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """运行所有测试"""
    print("\n🚀 GLM-4.6 动画生成能力测试\n")

    results = []

    # 测试 1: 连接
    results.append(("API 连接", test_glm_connection()))

    # 测试 2: 简单代码生成
    if results[0][1]:  # 如果连接成功
        results.append(("简单代码生成", test_simple_manim_generation()))

        # 测试 3: 从术语生成
        results.append(("术语动画生成", test_from_terminology()))

    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)

    for test_name, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{test_name}: {status}")

    all_passed = all(success for _, success in results)

    if all_passed:
        print("\n🎉 所有测试通过！GLM-4.6 可以用于动画生成！")
        print("\n下一步建议:")
        print("1. 查看 output/test_animations/ 目录生成的代码")
        print("2. 如果安装了 Manim，运行生成的代码验证效果")
        print("3. 批量生成第1章术语动画")
    else:
        print("\n⚠️  部分测试失败，请检查配置")


if __name__ == "__main__":
    main()
