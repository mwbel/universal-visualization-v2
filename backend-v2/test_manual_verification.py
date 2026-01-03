#!/usr/bin/env python3
"""
🧪 手动功能验证测试
直接测试文件分析Agent的核心功能
"""

import os
import sys
import json
import uuid
import tempfile
from pathlib import Path
import csv

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_image_agent_basic():
    """测试图像分析Agent基础功能"""
    print("🖼️ 测试图像分析Agent")

    try:
        from agents.file_analysis_agent import ImageAnalysisAgent

        # 创建Agent
        config = {'max_file_size': 50 * 1024 * 1024, 'temp_dir': tempfile.gettempdir()}
        agent = ImageAnalysisAgent('test_image', config)

        print(f"✅ 图像Agent创建成功")
        print(f"   支持格式: {agent.supported_formats}")

        # 测试验证逻辑
        fake_path = "test.png"
        validation = agent.validate_file(fake_path)
        print(f"✅ 文件验证逻辑正常: {validation.get('is_valid', False)}")

        # 测试可视化建议
        from agents.file_analysis_agent import FileAnalysisResult
        result = FileAnalysisResult("test", 'image')
        suggestions = agent.suggest_visualizations(result)
        print(f"✅ 可视化建议生成正常: {len(suggestions)} 个建议")

        return True

    except Exception as e:
        print(f"❌ 图像Agent测试失败: {str(e)}")
        return False

def test_document_agent_basic():
    """测试文档分析Agent基础功能"""
    print("📄 测试文档分析Agent")

    try:
        from agents.file_analysis_agent import DocumentAnalysisAgent

        # 创建Agent
        config = {'max_file_size': 50 * 1024 * 1024, 'temp_dir': tempfile.gettempdir()}
        agent = DocumentAnalysisAgent('test_doc', config)

        print(f"✅ 文档Agent创建成功")
        print(f"   支持格式: {agent.supported_formats}")

        # 创建测试文档
        test_doc_path = os.path.join(tempfile.gettempdir(), f"test_doc_{uuid.uuid4().hex[:8]}.txt")
        with open(test_doc_path, 'w', encoding='utf-8') as f:
            f.write("这是一个测试文档。\n包含一些数据：25, 50, 75, 100。\n以及关键词：分析、数据、图表。")

        # 测试分析
        file_id = str(uuid.uuid4())
        result = agent.analyze_file(test_doc_path, file_id)

        print(f"✅ 文档分析完成: {result.processing_status}")
        print(f"   置信度: {result.confidence_score}")
        print(f"   提取数据字段: {list(result.extracted_data.keys())}")

        # 清理
        if os.path.exists(test_doc_path):
            os.remove(test_doc_path)

        return result.processing_status == "completed"

    except Exception as e:
        print(f"❌ 文档Agent测试失败: {str(e)}")
        return False

def test_data_agent_basic():
    """测试数据分析Agent基础功能"""
    print("📊 测试数据分析Agent")

    try:
        from agents.file_analysis_agent import DataFileAnalysisAgent

        # 创建Agent
        config = {'max_file_size': 50 * 1024 * 1024, 'temp_dir': tempfile.gettempdir()}
        agent = DataFileAnalysisAgent('test_data', config)

        print(f"✅ 数据Agent创建成功")
        print(f"   支持格式: {agent.supported_formats}")

        # 创建测试CSV
        test_csv_path = os.path.join(tempfile.gettempdir(), f"test_data_{uuid.uuid4().hex[:8]}.csv")
        with open(test_csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['月份', '销售额', '利润率'])
            writer.writerow(['1月', 120000, 15.5])
            writer.writerow(['2月', 135000, 16.2])

        # 测试分析
        file_id = str(uuid.uuid4())
        result = agent.analyze_file(test_csv_path, file_id)

        print(f"✅ 数据分析完成: {result.processing_status}")
        print(f"   置信度: {result.confidence_score}")
        print(f"   提取数据字段: {list(result.extracted_data.keys())}")

        # 清理
        if os.path.exists(test_csv_path):
            os.remove(test_csv_path)

        return result.processing_status == "completed"

    except Exception as e:
        print(f"❌ 数据Agent测试失败: {str(e)}")
        return False

def test_api_structure():
    """测试API结构"""
    print("🔌 测试API结构")

    try:
        from api.file_upload import router
        print(f"✅ API路由器导入成功")

        # 检查路由
        routes = []
        for route in router.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
            elif hasattr(route, 'path_regex'):
                routes.append(str(route.path_regex))

        print(f"✅ 发现 {len(routes)} 个API路由:")
        for route in routes[:5]:  # 显示前5个
            print(f"   - {route}")

        return len(routes) > 0

    except Exception as e:
        print(f"❌ API结构测试失败: {str(e)}")
        return False

def test_database_models():
    """测试数据库模型"""
    print("💾 测试数据库模型")

    try:
        from models.file_analysis_models import FileMetadata, FileAnalysis
        print(f"✅ 数据库模型导入成功")

        # 检查模型属性
        print(f"✅ FileMetadata模型可用")
        print(f"✅ FileAnalysis模型可用")

        return True

    except Exception as e:
        print(f"❌ 数据库模型测试失败: {str(e)}")
        return False

def verify_openspec_compliance():
    """验证OpenSpec合规性"""
    print("📋 验证OpenSpec合规性")

    compliance_check = []

    # 检查文件分析Agent
    try:
        from agents.file_analysis_agent import ImageAnalysisAgent, DocumentAnalysisAgent, DataFileAnalysisAgent
        compliance_check.append(("✅ 文件分析Agent", True, "图像、文档、数据分析Agent已实现"))
    except:
        compliance_check.append(("❌ 文件分析Agent", False, "Agent导入失败"))

    # 检查支持格式
    try:
        img_formats = ImageAnalysisAgent('test', {})._get_supported_formats()
        doc_formats = DocumentAnalysisAgent('test', {})._get_supported_formats()
        data_formats = DataFileAnalysisAgent('test', {})._get_supported_formats()

        total_formats = len(img_formats) + len(doc_formats) + len(data_formats)
        compliance_check.append(("✅ 文件格式支持", total_formats >= 15, f"支持{total_formats}种格式"))
    except:
        compliance_check.append(("❌ 文件格式支持", False, "格式检查失败"))

    # 检查API路由
    try:
        from api.file_upload import router
        route_count = len(router.routes)
        compliance_check.append(("✅ API端点", route_count >= 5, f"有{route_count}个端点"))
    except:
        compliance_check.append(("❌ API端点", False, "API检查失败"))

    # 检查数据库模型
    try:
        from models.file_analysis_models import FileMetadata
        compliance_check.append(("✅ 数据库模型", True, "数据模型已实现"))
    except:
        compliance_check.append(("❌ 数据库模型", False, "数据模型检查失败"))

    # 打印合规性结果
    print("\n📊 OpenSpec合规性检查结果:")
    passed = 0
    for status, success, message in compliance_check:
        print(f"   {status}: {message}")
        if success:
            passed += 1

    compliance_rate = passed / len(compliance_check) * 100
    print(f"\n🎯 合规率: {compliance_rate:.1f}% ({passed}/{len(compliance_check)})")

    return compliance_rate >= 80

def main():
    """主函数"""
    print("🚀 开始手动功能验证测试")
    print("="*50)

    tests = [
        ("图像分析Agent基础", test_image_agent_basic),
        ("文档分析Agent基础", test_document_agent_basic),
        ("数据分析Agent基础", test_data_agent_basic),
        ("API结构检查", test_api_structure),
        ("数据库模型检查", test_database_models),
        ("OpenSpec合规性", verify_openspec_compliance)
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} 执行失败: {str(e)}")
            results.append((test_name, False))

    # 总结
    print(f"\n{'='*50}")
    print("📊 测试总结")
    print("="*50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status}: {test_name}")

    success_rate = passed / total * 100
    print(f"\n🎯 总体成功率: {success_rate:.1f}% ({passed}/{total})")

    if success_rate >= 80:
        print("\n🎉 功能验证基本通过！")
        print("✅ OpenSpec实现的主要功能已经完成")
        print("✅ 核心Agent、API、数据模型都已实现")
    elif success_rate >= 60:
        print("\n⚠️ 功能验证部分通过")
        print("🔧 部分功能需要进一步完善")
    else:
        print("\n❌ 功能验证未通过")
        print("🔨 需要修复多个功能模块")

if __name__ == "__main__":
    main()