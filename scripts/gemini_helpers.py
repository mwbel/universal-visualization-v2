#!/usr/bin/env python3
"""
Gemini AI 辅助脚本 - 用于高斯曲率可视化项目
提供代码优化、错误检测、测试生成等功能
"""

import os
import sys
import json
import subprocess
import re
from pathlib import Path

# 配置
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key_here")
GEMINI_MODEL = "gemini-1.5-pro"

class GeminiAssistant:
    def __init__(self, api_key, model="gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    def analyze_code(self, file_path: str) -> dict:
        """分析代码文件并提供改进建议"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code_content = f.read()

            # 构造Gemini提示
            prompt = f"""
            请分析以下{Path(file_path).suffix}代码文件，重点关注：

            1. **高斯曲率可视化相关优化**
            2. **代码质量和最佳实践**
            3. **性能优化建议**
            4. **潜在的bug和错误**
            5. **代码结构改进**

            文件：{file_path}

            代码内容：
            ```{Path(file_path).suffix}
            {code_content}
            ```

            请提供：
            - 具体的问题和改进建议
            - 优化后的代码片段
            - 测试建议
            - 性能分析

            以JSON格式回复：
            {{
                "analysis": "整体分析",
                "issues": ["问题1", "问题2"],
                "suggestions": ["建议1", "建议2"],
                "optimized_code": "优化后的代码",
                "performance_tips": ["性能提示1", "性能提示2"],
                "test_cases": ["测试用例1", "测试用例2"]
            }}
            """

            return self._call_gemini(prompt, f"分析{Path(file_path).name}")

        except Exception as e:
            return {"error": f"分析文件时出错: {e}"}

    def generate_unit_tests(self, html_file: str) -> dict:
        """为HTML可视化生成单元测试"""
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()

            prompt = f"""
            请为以下HTML高斯曲率可视化页面生成全面的单元测试：

            文件：{html_file}

            HTML内容分析：
            ```html
            {html_content[:2000]}...
            ```

            请生成测试用例覆盖：
            1. **页面初始化测试**
            2. **DOM元素创建测试**
            3. **Plotly可视化测试**
            4. **交互式控件测试**
            5. **参数验证测试**
            6. **响应式设计测试**

            要求：
            - 使用JavaScript Jest或Mocha
            - 浏览器兼容性测试
            - 性能基准测试
            - 可访问性测试

            返回JSON格式：
            {{
                "test_framework": "Jest",
                "test_cases": [
                    {{
                        "name": "测试名称",
                        "description": "测试描述",
                        "code": "测试代码",
                        "expected": "预期结果"
                    }}
                ],
                "setup_instructions": "测试环境设置",
                "coverage_analysis": "代码覆盖率分析"
            }}
            """

            return self._call_gemini(prompt, f"生成{Path(html_file).name}的测试")

        except Exception as e:
            return {"error": f"生成测试时出错: {e}"}

    def optimize_visualization_performance(self, js_file: str) -> dict:
        """优化JavaScript可视化性能"""
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                js_content = f.read()

            prompt = f"""
            请优化以下JavaScript高斯曲率可视化代码的性能：

            文件：{js_file}

            代码：
            ```javascript
            {js_content[:3000]}...
            ```

            重点关注：
            1. **3D渲染优化**
            2. **动画性能优化**
            3. **内存使用优化**
            4. **WebGL优化**
            5. **事件处理优化**

            请提供：
            - 性能瓶颈分析
            - 优化后的代码
            - 性能监控代码
            - 最佳实践建议

            返回JSON：
            {{
                "performance_analysis": "性能分析结果",
                "optimizations": ["优化1", "优化2"],
                "optimized_code": "优化后的完整代码",
                "monitoring_code": "性能监控代码",
                "best_practices": ["最佳实践1", "最佳实践2"]
            }}
            """

            return self._call_gemini(prompt, f"优化{Path(js_file).name}性能")

        except Exception as e:
            return {"error": f"优化性能时出错: {e}"}

    def generate_documentation(self, project_path: str) -> dict:
        """生成项目文档"""
        try:
            files = []
            for root, dirs, filenames in os.walk(project_path):
                for filename in filenames:
                    if filename.endswith(('.html', '.js', '.py', '.md')):
                        files.append(f"{root}/{filename}")

            prompt = f"""
            请为以下高斯曲率可视化项目生成完整的技术文档：

            项目路径：{project_path}
            文件数量：{len(files)}

            主要文件：
            {', '.join([f for f in files[:10] if not f.startswith('.')])}

            请生成：
            1. **API文档** - 所有函数和类的详细说明
            2. **用户指南** - 如何使用各个功能
            3. **开发者文档** - 架构和扩展指南
            4. **部署指南** - 如何部署到生产环境
            5. **故障排除** - 常见问题和解决方案

            特别关注：
            - 高斯曲率计算的数学公式
            - 3D可视化的实现细节
            - 交互式控件的使用方法
            - Plotly.js配置选项

            返回JSON：
            {{
                "api_documentation": "详细的API文档",
                "user_guide": "用户使用指南",
                "developer_guide": "开发者扩展指南",
                "deployment_guide": "部署和配置说明",
                "troubleshooting": "常见问题解决方案"
            }}
            """

            return self._call_gemini(prompt, "生成项目文档")

        except Exception as e:
            return {"error": f"生成文档时出错: {e}"}

    def _call_gemini(self, prompt: str, task_name: str) -> dict:
        """调用Gemini API"""
        # 这里应该是实际的Gemini API调用
        # 现在返回模拟结果用于演示

        print(f"🤖 Gemini AI 正在处理: {task_name}")
        print(f"📝 提示长度: {len(prompt)} 字符")

        # 模拟API响应
        response = {
            "task": task_name,
            "status": "completed",
            "analysis": f"AI 分析完成 - {task_name}",
            "recommendations": [
                "优化Plotly渲染性能",
                "添加错误处理机制",
                "实现单元测试覆盖",
                "改进代码注释和文档"
            ]
        }

        print(f"✅ Gemini AI 处理完成!")
        return response

def main():
    """主函数 - 处理命令行参数"""
    if len(sys.argv) < 2:
        print("用法:")
        print("  python gemini_helpers.py <command> [file_path]")
        print("")
        print("可用命令:")
        print("  analyze <file>     - 分析代码文件")
        print("  test <html_file>   - 生成单元测试")
        print("  optimize <js_file> - 优化JavaScript性能")
        print("  docs <project_path> - 生成项目文档")
        print("  all <project_path>   - 执行所有分析")
        return

    command = sys.argv[1]
    assistant = GeminiAssistant(GEMINI_API_KEY)

    if command == "analyze" and len(sys.argv) > 2:
        result = assistant.analyze_code(sys.argv[2])
    elif command == "test" and len(sys.argv) > 2:
        result = assistant.generate_unit_tests(sys.argv[2])
    elif command == "optimize" and len(sys.argv) > 2:
        result = assistant.optimize_visualization_performance(sys.argv[2])
    elif command == "docs":
        project_path = sys.argv[2] if len(sys.argv) > 2 else "."
        result = assistant.generate_documentation(project_path)
    elif command == "all":
        project_path = sys.argv[2] if len(sys.argv) > 2 else "."
        print("🔄 执行完整的AI辅助分析...")

        # 分析主要文件
        main_files = [
            "main-app/modules/differential_geometry/pages/act-1/chapter2-gaussian.html",
            "main-app/modules/differential_geometry/pages/act-1/chapter2-gaussian.js",
            "ellipsoid_css_3d.html"
        ]

        for file_path in main_files:
            if os.path.exists(file_path):
                result = assistant.analyze_code(file_path)
                print(f"📊 分析结果: {file_path}")
                print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("❌ 无效命令")
        print("使用: python gemini_helpers.py <command> [options]")

if __name__ == "__main__":
    main()