#!/usr/bin/env python3
"""
数学可视化系统演示脚本
展示如何使用新的数学文档分析和可视化功能
"""

import asyncio
import json
from pathlib import Path

# 导入我们的数学分析器
try:
    from agents.mathematics_analyzer import MathematicsAnalyzer, MathConceptType, VisualizationType
    from services.math_visualization_service import MathVisualizationService
except ImportError as e:
    print(f"⚠️  导入错误: {e}")
    print("使用简化的演示模式...")
    # 创建简化的演示
    import sys
    sys.exit(1)

async def demo_math_analysis():
    """演示数学分析功能"""
    print("🎓 数学可视化系统演示")
    print("=" * 50)

    # 示例数学文档内容（基于Gemini分析结果的格式）
    sample_math_content = """
    # 可视化微分几何学习笔记

    ## 第一章：基本概念

    ### 定义：测地线
    测地线是曲面上局部最短的"直"线。其方程涉及 Christoffel 符号 Γ^k_ij。

    ### 定理：高斯-博内定理
    测地线三角形的角盈等于其内部高斯曲率的总积分：
    ∫_Δ K dA = 角盈

    ### 公式：双曲余弦定理
    cosh(c) = cosh(a)cosh(b) - sinh(a)sinh(b)cos(γ)

    其中：
    - a, b, c 是三角形边长
    - γ 是夹角
    - cosh 是双曲余弦函数
    - sinh 是双曲正弦函数

    ## 第二章：几何应用

    ### 例子：球面几何
    在球面上，测地线是大圆。对于半径为R的球面，三角形面积A与角盈E的关系为：
    E = A/R²

    ### 应用：地图投影
    中心投影将球面投影到切平面。测地线被映射为直线。
    """

    print("📄 示例数学文档内容已准备")
    print()

    # 1. 初始化数学分析器
    print("🔬 步骤1: 初始化数学分析器...")
    analyzer = MathematicsAnalyzer()
    print("✅ 数学分析器初始化完成")

    # 2. 执行深度分析
    print("\n🧠 步骤2: 执行深度数学分析...")
    analysis = analyzer.analyze_document(sample_math_content)

    print(f"📊 分析结果:")
    print(f"   - 文档类型: {analysis.document_type}")
    print(f"   - 主要概念数量: {len(analysis.main_topics)}")
    print(f"   - 关键公式数量: {len(analysis.key_formulas)}")
    print(f"   - 几何概念数量: {len(analysis.geometric_concepts)}")
    print(f"   - 定理数量: {len(analysis.theorems)}")
    print(f"   - 难度评估: {analysis.difficulty_assessment}/5")
    print(f"   - 推荐可视化类型: {[viz.value for viz in analysis.suggested_visualizations]}")

    # 3. 显示识别的数学概念
    print(f"\n📐 识别的主要数学概念:")
    for i, concept in enumerate(analysis.main_topics, 1):
        print(f"   {i}. {concept.name} ({concept.type.value})")
        print(f"      定义: {concept.definition[:100]}...")
        if concept.formula:
            print(f"      公式: {concept.formula}")
        print()

    # 4. 显示识别的公式
    print(f"📊 识别的关键公式:")
    for i, formula in enumerate(analysis.key_formulas, 1):
        print(f"   {i}. {formula.description}")
        print(f"      LaTeX: {formula.latex}")
        if formula.variables:
            print(f"      变量: {', '.join(f'{k}: {v}' for k, v in formula.variables.items())}")
        print()

    # 5. 显示推荐的可视化方案
    print(f"🎨 推荐的可视化方案:")
    for viz_type in analysis.suggested_visualizations:
        print(f"   - {viz_type.value}: {_get_viz_description(viz_type)}")
    print()

    # 6. 显示学习目标
    print(f"🎯 学习目标:")
    for i, objective in enumerate(analysis.learning_objectives, 1):
        print(f"   {i}. {objective}")
    print()

    # 7. 生成可视化内容预览
    print(f"🎬 生成可视化内容预览...")
    viz_service = MathVisualizationService()

    # 创建测试元数据
    test_metadata = {
        "filename": "differential_geometry_notes.txt",
        "file_size": 2048,
        "upload_time": "2025-12-16T20:00:00Z"
    }

    viz_content = await viz_service._create_visualization_content(
        analysis, "test_file_123", test_metadata
    )

    print(f"✅ 可视化内容生成完成:")
    print(f"   - 标题: {viz_content['title']}")
    print(f"   - 概念可视化: {len(viz_content['concepts'])}个")
    print(f"   - 公式可视化: {len(viz_content['formulas'])}个")
    print(f"   - 几何构造: {len(viz_content['geometric_constructions'])}个")
    print(f"   - 证明流程: {len(viz_content['proof_flows'])}个")
    print(f"   - 交互演示: {len(viz_content['interactive_demos'])}个")

    # 8. 保存分析结果
    output_file = Path("math_analysis_demo_result.json")
    analysis_result = {
        "timestamp": "2025-12-16T20:00:00Z",
        "analysis": {
            "document_type": analysis.document_type,
            "main_topics": [
                {
                    "name": c.name,
                    "type": c.type.value,
                    "definition": c.definition,
                    "difficulty": c.difficulty_level
                } for c in analysis.main_topics
            ],
            "key_formulas": [
                {
                    "latex": f.latex,
                    "description": f.description,
                    "variables": f.variables
                } for f in analysis.key_formulas
            ],
            "suggested_visualizations": [v.value for v in analysis.suggested_visualizations],
            "learning_objectives": analysis.learning_objectives
        }
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_result, f, indent=2, ensure_ascii=False)

    print(f"\n💾 分析结果已保存到: {output_file}")
    print(f"📈 可在浏览器中查看详细的可视化结果")

def _get_viz_description(viz_type: VisualizationType) -> str:
    """获取可视化类型的描述"""
    descriptions = {
        VisualizationType.CONCEPT_DIAGRAM: "概念关系图，展示数学概念之间的联系",
        VisualizationType.FORMULA_DERIVATION: "公式推导过程，包含步骤分解和交互调节",
        VisualizationType.GEOMETRIC_CONSTRUCTION: "几何构造演示，支持3D模型和动画",
        VisualizationType.RELATIONSHIP_MAP: "关系图谱，可视化概念之间的逻辑关系",
        VisualizationType.INTERACTIVE_DEMO: "交互式演示，提供参数调节和实时反馈",
        VisualizationType.PROOF_FLOW: "证明流程图，展示逻辑推理步骤",
        VisualizationType.HISTORICAL_TIMELINE: "历史时间线，展示概念发展历程",
        VisualizationType.APPLICATION_CASE: "应用案例，展示实际使用场景"
    }
    return descriptions.get(viz_type, "通用可视化")

async def main():
    """主演示函数"""
    print("🚀 万物可视化 - 数学文档智能分析系统演示")
    print("基于Gemini分析结果的深度学习优化")
    print()

    try:
        await demo_math_analysis()
        print("\n✅ 演示完成！系统已准备处理您的数学文档")
        print("\n📝 使用说明:")
        print("1. 访问 http://localhost:3000 上传数学文档")
        print("2. 系统将自动进行深度分析")
        print("3. 获得专业的数学概念可视化")
        print("4. 支持交互式探索和学习")

    except Exception as e:
        print(f"❌ 演示过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())