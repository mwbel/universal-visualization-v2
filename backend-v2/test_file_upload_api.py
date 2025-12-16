#!/usr/bin/env python3
"""
阶段一：文件上传和分析API测试脚本
测试基础架构搭建的所有功能
"""

import requests
import json
import os
import time
from pathlib import Path
import mimetypes

class FileUploadAPITester:
    """文件上传API测试类"""

    def __init__(self, base_url="http://localhost:9999"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v4/files"
        self.test_files = []
        self.uploaded_files = []

    def test_api_health(self):
        """测试API健康状态"""
        print("🔍 测试API健康状态...")
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                print("✅ API服务器正常运行")
                data = response.json()
                print(f"   版本: {data.get('version', 'Unknown')}")
                print(f"   名称: {data.get('name', 'Unknown')}")
                return True
            else:
                print(f"❌ API服务器响应异常: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API服务器连接失败: {e}")
            return False

    def create_test_files(self):
        """创建测试文件"""
        print("📁 创建测试文件...")

        # 创建测试目录
        test_dir = Path("test_files")
        test_dir.mkdir(exist_ok=True)

        # 创建不同类型的测试文件
        test_files = []

        # 1. 创建文本文件
        text_file = test_dir / "test_document.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write("""这是一个测试文档

包含一些数据：
- 产品A: 100件
- 产品B: 200件
- 产品C: 150件

数据统计：
总销售额: 50000元
平均单价: 125元
""")
        test_files.append(("document", text_file))

        # 2. 创建JSON数据文件
        json_file = test_dir / "test_data.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                "sales_data": [
                    {"month": "1月", "sales": 1200, "profit": 300},
                    {"month": "2月", "sales": 1500, "profit": 450},
                    {"month": "3月", "sales": 1800, "profit": 540},
                    {"month": "4月", "sales": 1400, "profit": 350}
                ],
                "products": [
                    {"name": "产品A", "category": "电子", "price": 299},
                    {"name": "产品B", "category": "家居", "price": 199},
                    {"name": "产品C", "category": "服装", "price": 99}
                ]
            }, f, ensure_ascii=False, indent=2)
        test_files.append(("data", json_file))

        # 3. 创建CSV数据文件
        csv_file = test_dir / "test_data.csv"
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write("月份,销售额,利润,增长率\n")
            f.write("1月,1200,300,5.2\n")
            f.write("2月,1500,450,8.3\n")
            f.write("3月,1800,540,12.1\n")
            f.write("4月,1400,350,-6.7\n")
            f.write("5月,2000,600,15.8\n")
        test_files.append(("data", csv_file))

        # 4. 创建Markdown文件
        md_file = test_dir / "test_markdown.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write("""# 数据分析报告

## 概述
本报告展示了2025年的销售数据分析。

## 关键指标
- **总销售额**: ¥8,900
- **平均增长率**: 8.9%
- **最佳月份**: 5月

## 数据可视化
1. 销售趋势图
2. 产品分布饼图
3. 利润率分析

## 结论
数据显示整体趋势良好，建议继续关注5月的成功策略。
""")
        test_files.append(("document", md_file))

        self.test_files = test_files
        print(f"✅ 创建了 {len(test_files)} 个测试文件")
        return True

    def test_file_upload(self, file_path, expected_type=None):
        """测试文件上传"""
        filename = Path(file_path).name
        print(f"📤 测试上传文件: {filename}")

        try:
            # 确定文件类型
            if expected_type is None:
                ext = Path(filename).suffix.lower()
                if ext in ['.jpg', '.jpeg', '.png', '.gif']:
                    expected_type = 'image'
                elif ext in ['.pdf', '.doc', '.docx', '.txt', '.md']:
                    expected_type = 'document'
                elif ext in ['.csv', '.json', '.xlsx', '.xls']:
                    expected_type = 'data'
                else:
                    expected_type = 'unknown'

            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, mimetypes.guess_type(filename)[0])}
                data = {'description': f'测试文件: {filename}'}

                response = requests.post(
                    f"{self.api_base}/upload",
                    files=files,
                    data=data
                )

            if response.status_code == 200:
                result = response.json()
                if result['success']:
                    print(f"✅ 文件上传成功")
                    print(f"   文件ID: {result['file_id']}")
                    print(f"   文件类型: {result['file_type']}")
                    print(f"   文件大小: {result['file_size']} 字节")
                    print(f"   分析API: {result['analysis_url']}")

                    # 验证文件类型是否正确
                    if result['file_type'] == expected_type:
                        print(f"✅ 文件类型识别正确: {expected_type}")
                    else:
                        print(f"⚠️  文件类型识别错误: 期望 {expected_type}, 实际 {result['file_type']}")

                    self.uploaded_files.append(result['file_id'])
                    return result
                else:
                    print(f"❌ 文件上传失败: {result['message']}")
                    return None
            else:
                print(f"❌ 上传请求失败: HTTP {response.status_code}")
                print(f"   响应: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 上传过程中发生错误: {e}")
            return None

    def test_file_analysis(self, file_id):
        """测试文件分析"""
        print(f"🔍 测试分析文件: {file_id}")

        try:
            analysis_request = {
                "file_id": file_id,
                "analysis_options": {
                    "extract_keywords": True,
                    "generate_summary": True,
                    "detect_data_patterns": True
                },
                "auto_visualize": True
            }

            response = requests.post(
                f"{self.api_base}/analyze/{file_id}",
                json=analysis_request
            )

            if response.status_code == 200:
                result = response.json()
                print(f"✅ 文件分析请求已提交")
                print(f"   分析状态: {result['analysis_status']}")
                print(f"   置信度: {result['confidence_score']}")
                print(f"   处理时间: {result['processing_time']:.2f}秒")
                print(f"   推荐可视化: {', '.join(result['suggested_visualizations'])}")

                if result['error_messages']:
                    print(f"   错误信息: {', '.join(result['error_messages'])}")

                return result
            else:
                print(f"❌ 分析请求失败: HTTP {response.status_code}")
                print(f"   响应: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 分析过程中发生错误: {e}")
            return None

    def test_file_list(self):
        """测试文件列表"""
        print("📋 测试获取文件列表...")

        try:
            response = requests.get(f"{self.api_base}/")

            if response.status_code == 200:
                result = response.json()
                print(f"✅ 文件列表获取成功")
                print(f"   文件总数: {result['total_count']}")
                print(f"   返回数量: {len(result['files'])}")

                for i, file_info in enumerate(result['files'][:3]):  # 只显示前3个
                    print(f"   文件{i+1}: {file_info['original_filename']} ({file_info['file_type']})")

                return result
            else:
                print(f"❌ 获取文件列表失败: HTTP {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ 获取文件列表时发生错误: {e}")
            return None

    def test_file_info(self, file_id):
        """测试获取文件详细信息"""
        print(f"📄 测试获取文件详情: {file_id}")

        try:
            response = requests.get(f"{self.api_base}/{file_id}")

            if response.status_code == 200:
                result = response.json()
                print(f"✅ 文件详情获取成功")
                print(f"   原始文件名: {result['original_filename']}")
                print(f"   文件类型: {result['file_type']}")
                print(f"   文件大小: {result['file_size']} 字节")
                print(f"   上传时间: {result['upload_time']}")
                print(f"   分析状态: {result.get('analysis_status', 'N/A')}")

                return result
            else:
                print(f"❌ 获取文件详情失败: HTTP {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ 获取文件详情时发生错误: {e}")
            return None

    def test_file_delete(self, file_id):
        """测试文件删除"""
        print(f"🗑️  测试删除文件: {file_id}")

        try:
            response = requests.delete(f"{self.api_base}/{file_id}")

            if response.status_code == 200:
                result = response.json()
                if result['success']:
                    print(f"✅ 文件删除成功")
                    print(f"   消息: {result['message']}")
                    return True
                else:
                    print(f"❌ 文件删除失败: {result['message']}")
                    return False
            else:
                print(f"❌ 删除请求失败: HTTP {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ 删除过程中发生错误: {e}")
            return False

    def test_file_type_filtering(self):
        """测试文件类型过滤"""
        print("🏷️  测试文件类型过滤...")

        file_types = ['image', 'document', 'data']

        for file_type in file_types:
            try:
                response = requests.get(f"{self.api_base}/?file_type={file_type}")

                if response.status_code == 200:
                    result = response.json()
                    print(f"   {file_type} 类型文件: {result['total_count']} 个")
                else:
                    print(f"   获取 {file_type} 类型文件失败: HTTP {response.status_code}")

            except Exception as e:
                print(f"   过滤 {file_type} 类型时发生错误: {e}")

    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始运行阶段一文件上传API测试套件")
        print("=" * 60)

        # 1. 测试API健康状态
        if not self.test_api_health():
            return False

        # 2. 创建测试文件
        if not self.create_test_files():
            return False

        # 3. 测试文件上传
        print("\n📤 测试文件上传功能...")
        uploaded_results = []
        for file_type, file_path in self.test_files:
            result = self.test_file_upload(file_path, file_type)
            if result:
                uploaded_results.append(result)

        if not uploaded_results:
            print("❌ 没有文件上传成功，停止后续测试")
            return False

        # 4. 测试文件列表
        print("\n📋 测试文件列表功能...")
        self.test_file_list()

        # 5. 测试文件分析
        print("\n🔍 测试文件分析功能...")
        for result in uploaded_results[:2]:  # 只测试前2个
            self.test_file_analysis(result['file_id'])
            time.sleep(1)  # 等待处理

        # 6. 测试文件详情
        print("\n📄 测试文件详情功能...")
        if self.uploaded_files:
            self.test_file_info(self.uploaded_files[0])

        # 7. 测试文件类型过滤
        print("\n🏷️  测试文件类型过滤...")
        self.test_file_type_filtering()

        # 8. 测试文件删除
        print("\n🗑️  测试文件删除功能...")
        if self.uploaded_files:
            # 删除第一个文件进行测试
            file_to_delete = self.uploaded_files[0]
            self.test_file_delete(file_to_delete)
            self.uploaded_files.remove(file_to_delete)

        print("\n" + "=" * 60)
        print("✅ 阶段一基础架构测试完成!")
        print("📊 测试统计:")
        print(f"   测试文件数量: {len(self.test_files)}")
        print(f"   成功上传文件: {len(uploaded_results)}")
        print(f"   剩余文件数量: {len(self.uploaded_files)}")

        return True

    def cleanup(self):
        """清理测试文件"""
        print("🧹 清理测试文件...")

        # 删除上传的文件
        for file_id in self.uploaded_files:
            try:
                requests.delete(f"{self.api_base}/{file_id}")
            except:
                pass

        # 删除本地测试文件
        test_dir = Path("test_files")
        if test_dir.exists():
            import shutil
            shutil.rmtree(test_dir)
            print("✅ 本地测试文件已清理")

def main():
    """主函数"""
    tester = FileUploadAPITester()

    try:
        success = tester.run_all_tests()

        if success:
            print("\n🎉 所有测试通过！阶段一基础架构已就绪。")
            print("\n📚 API端点总结:")
            print("   POST /api/v4/files/upload           - 文件上传")
            print("   POST /api/v4/files/analyze/{file_id} - 文件分析")
            print("   GET  /api/v4/files/                 - 文件列表")
            print("   GET  /api/v4/files/{file_id}        - 文件详情")
            print("   DELETE /api/v4/files/{file_id}      - 删除文件")
            print("   GET  /api/v4/files/{file_id}/download - 下载文件")
            print("\n💡 提示: 您可以使用交互式界面或直接调用这些API进行测试")
        else:
            print("\n❌ 测试失败，请检查服务器状态和配置")

    except KeyboardInterrupt:
        print("\n⚠️  测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()