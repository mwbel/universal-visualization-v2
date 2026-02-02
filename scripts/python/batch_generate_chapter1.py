#!/usr/bin/env python3
"""
批量生成第1章术语动画
使用 GLM-4.6 快速生成所有术语的教学动画
"""
import sys
import os
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from backend_v2.agents.glm_animation_agent import GLMAnimationAgent


def load_terminology_from_markdown(markdown_file: str):
    """从 Markdown 文件加载术语"""
    # TODO: 实现完整的 Markdown 解析
    # 这里先提供第1章的示例数据

    terminology = [
        # 第1章 集合
        {"chinese": "集合", "english": "Set", "symbol": r"A, B, C", "chapter": "第1章"},
        {"chinese": "元素", "english": "Element", "symbol": r"a, b, c", "chapter": "第1章"},
        {"chinese": "属于", "english": "Belongs to", "symbol": r"\in", "chapter": "第1章"},
        {"chinese": "不属于", "english": "Does not belong to", "symbol": r"\notin", "chapter": "第1章"},
        {"chinese": "有限集", "english": "Finite Set", "symbol": r"|A| < \infty", "chapter": "第1章"},
        {"chinese": "无限集", "english": "Infinite Set", "symbol": r"|A| = \infty", "chapter": "第1章"},
        {"chinese": "空集", "english": "Empty Set", "symbol": r"\varnothing", "chapter": "第1章"},
        {"chinese": "子集", "english": "Subset", "symbol": r"\subseteq", "chapter": "第1章"},
        {"chinese": "真子集", "english": "Proper Subset", "symbol": r"\subset", "chapter": "第1章"},
        {"chinese": "集合相等", "english": "Set Equality", "symbol": r"=", "chapter": "第1章"},
        {"chinese": "交集", "english": "Intersection", "symbol": r"\cap", "chapter": "第1章"},
        {"chinese": "并集", "english": "Union", "symbol": r"\cup", "chapter": "第1章"},
        {"chinese": "补集", "english": "Complement", "symbol": r"\complement_U A", "chapter": "第1章"},
        {"chinese": "全集", "english": "Universal Set", "symbol": r"U", "chapter": "第1章"},
        {"chinese": "区间", "english": "Interval", "symbol": r"(a, b)", "chapter": "第1章"},
        {"chinese": "开区间", "english": "Open Interval", "symbol": r"(a, b)", "chapter": "第1章"},
        {"chinese": "闭区间", "english": "Closed Interval", "symbol": r"[a, b]", "chapter": "第1章"},
    ]

    return terminology


def batch_generate(
    terminology: list,
    max_count: int = None,
    start_from: int = 0,
    save_summary: bool = True
):
    """
    批量生成动画

    Args:
        terminology: 术语列表
        max_count: 最大生成数量（用于测试）
        start_from: 从第几个开始（支持断点续传）
        save_summary: 是否保存生成摘要
    """
    agent = GLMAnimationAgent()

    # 限制范围
    if max_count:
        terminology = terminology[start_from:start_from + max_count]
    else:
        terminology = terminology[start_from:]

    results = []
    total_cost = 0
    success_count = 0

    print(f"🚀 开始批量生成 {len(terminology)} 个动画\n")
    print("=" * 80)

    for i, term in enumerate(terminology, start=start_from + 1):
        print(f"\n[{i}/{len(terminology) + start_from}] 📝 {term['chinese']} ({term['english']})")
        print(f"   符号: ${term['symbol']}$")

        try:
            result = agent.generate_from_terminology(
                term_chinese=term["chinese"],
                term_english=term["english"],
                math_symbol=term["symbol"]
            )

            if result["success"]:
                print(f"   ✅ 成功")
                print(f"   📁 {result['file_path']}")
                print(f"   💰 ¥{result['cost']:.6f} ({result['tokens_used']} tokens)")
                success_count += 1
                total_cost += result["cost"]
            else:
                print(f"   ❌ 失败: {result.get('error', '未知错误')}")

            results.append({
                **term,
                **result,
                "index": i
            })

        except Exception as e:
            print(f"   ❌ 异常: {e}")
            results.append({
                **term,
                "success": False,
                "error": str(e),
                "index": i
            })

        # 每生成 5 个显示一次进度
        if i % 5 == 0:
            print(f"\n📊 当前进度: {success_count}/{i} 成功, 已花费: ¥{total_cost:.6f}")

    # 总结
    print("\n" + "=" * 80)
    print("📊 批量生成完成！")
    print("=" * 80)
    print(f"总数: {len(terminology)}")
    print(f"成功: {success_count} ({success_count/len(terminology)*100:.1f}%)")
    print(f"失败: {len(terminology) - success_count}")
    print(f"总成本: ¥{total_cost:.6f}")
    print(f"平均每个: ¥{total_cost/len(terminology):.6f}")
    print(f"平均tokens: {sum(r.get('tokens_used', 0) for r in results) // len(results)}")
    print("=" * 80)

    # 保存摘要
    if save_summary:
        save_generation_summary(results, total_cost)

    return results


def save_generation_summary(results: list, total_cost: float):
    """保存生成摘要"""
    output_dir = Path("output/summaries")
    output_dir.mkdir(parents=True, exist_ok=True)

    summary_file = output_dir / "batch_generation_summary.md"

    with open(summary_file, "w", encoding="utf-8") as f:
        f.write("# 批量动画生成摘要\n\n")
        f.write(f"**生成时间**: {Path(__file__).stat().st_mtime}\n")
        f.write(f"**总数**: {len(results)}\n")
        f.write(f"**成功**: {sum(1 for r in results if r.get('success'))}\n")
        f.write(f"**失败**: {sum(1 for r in results if not r.get('success'))}\n")
        f.write(f"**总成本**: ¥{total_cost:.6f}\n\n")

        f.write("## 详细结果\n\n")
        f.write("| # | 术语 | 英文 | 状态 | 文件 | 成本 |\n")
        f.write("|---|------|------|------|------|------|\n")

        for r in results:
            status = "✅" if r.get("success") else "❌"
            file = r.get("file_path", "") or ""
            cost = f"¥{r.get('cost', 0):.6f}" if r.get("cost") else "-"

            f.write(f"| {r.get('index', '-')} | {r['chinese']} | {r['english']} | {status} | `{file}` | {cost} |\n")

    print(f"\n📄 摘要已保存到: {summary_file}")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="批量生成数学术语动画")
    parser.add_argument("--max", type=int, help="最大生成数量（用于测试）")
    parser.add_argument("--start", type=int, default=0, help="从第几个开始")
    parser.add_argument("--chapter", type=str, default="第1章", help="指定章节")

    args = parser.parse_args()

    # 加载术语
    print(f"📚 正在加载术语数据...")
    terminology = load_terminology_from_markdown(
        "沪教版高中数学1数学术语中英文对照20251223.v1.md"
    )

    print(f"✅ 加载了 {len(terminology)} 个术语\n")

    # 批量生成
    results = batch_generate(
        terminology=terminology,
        max_count=args.max,
        start_from=args.start
    )

    # 显示成功示例
    success_results = [r for r in results if r.get("success")]
    if success_results:
        print(f"\n✨ 成功示例（前 3 个）:")
        for r in success_results[:3]:
            print(f"   - {r['chinese']}: {r.get('file_path')}")


if __name__ == "__main__":
    main()
