"""
万物可视化 v2.0 - 统一模板引擎
方案A核心组件：负责管理和渲染所有学科的可视化模板
"""

from typing import Dict, List, Optional, Any, Union
import json
import os
from pathlib import Path
from datetime import datetime
import jinja2

class UnifiedTemplateEngine:
    """统一模板引擎 - 方案A核心组件"""

    def __init__(self):
        """初始化模板引擎"""
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.template_cache: Dict[str, str] = {}
        self.jinja_env = jinja2.Environment(
            loader=jinja2.DictLoader({}),
            autoescape=True
        )

        # 模板统计
        self.template_stats = {
            "total_templates": 0,
            "subject_counts": {},
            "render_count": 0,
            "cache_hits": 0
        }

        print("🎨 统一模板引擎初始化完成")

    async def register_template(self, template: Dict[str, Any]) -> bool:
        """
        注册新模板

        Args:
            template: 模板配置字典

        Returns:
            bool: 注册是否成功
        """
        try:
            template_id = template.get("id")
            if not template_id:
                raise ValueError("模板缺少id字段")

            if template_id in self.templates:
                print(f"⚠️  模板 {template_id} 已存在，将被覆盖")

            # 验证模板必需字段
            required_fields = ["id", "name", "description", "subject"]
            for field in required_fields:
                if field not in template:
                    raise ValueError(f"模板缺少必需字段: {field}")

            # 注册模板
            self.templates[template_id] = {
                **template,
                "registered_at": datetime.now().isoformat(),
                "render_count": 0
            }

            # 缓存HTML模板
            html_template = template.get("html_template")
            if html_template:
                self.template_cache[template_id] = html_template
                self.jinja_env.loader.mapping[template_id] = html_template

            # 更新统计
            subject = template["subject"]
            self.template_stats["subject_counts"][subject] = \
                self.template_stats["subject_counts"].get(subject, 0) + 1
            self.template_stats["total_templates"] = len(self.templates)

            print(f"✅ 模板注册成功: {template_id} ({subject})")
            return True

        except Exception as e:
            print(f"❌ 模板注册失败: {str(e)}")
            return False

    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        获取指定模板

        Args:
            template_id: 模板ID

        Returns:
            Dict: 模板配置，如果不存在则返回None
        """
        return self.templates.get(template_id)

    async def get_all_templates(self) -> List[Dict[str, Any]]:
        """
        获取所有模板

        Returns:
            List[Dict]: 所有模板列表
        """
        return list(self.templates.values())

    async def get_subject_templates(self, subject: str) -> List[Dict[str, Any]]:
        """
        获取指定学科的所有模板

        Args:
            subject: 学科名称

        Returns:
            List[Dict]: 指定学科的模板列表
        """
        return [
            template for template in self.templates.values()
            if template.get("subject") == subject
        ]

    async def search_templates(self, query: str, subject: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        搜索模板

        Args:
            query: 搜索关键词
            subject: 可选的学科筛选

        Returns:
            List[Dict]: 匹配的模板列表
        """
        query_lower = query.lower()
        results = []

        for template in self.templates.values():
            # 学科筛选
            if subject and template.get("subject") != subject:
                continue

            # 关键词匹配
            searchable_fields = [
                template.get("name", ""),
                template.get("description", ""),
                template.get("keywords", []),
                template.get("examples", [])
            ]

            # 将所有可搜索字段转为字符串
            searchable_text = " ".join([
                str(field) if not isinstance(field, list) else " ".join(field)
                for field in searchable_fields
            ]).lower()

            if query_lower in searchable_text:
                results.append(template)

        return results

    async def render_template(self, template_id: str, config: Dict[str, Any]) -> str:
        """
        渲染模板

        Args:
            template_id: 模板ID
            config: 渲染配置

        Returns:
            str: 渲染后的HTML内容
        """
        try:
            template = self.templates.get(template_id)
            if not template:
                raise ValueError(f"模板不存在: {template_id}")

            # 检查缓存
            if template_id in self.template_cache:
                html_template = self.template_cache[template_id]
                self.template_stats["cache_hits"] += 1
            else:
                # 尝试从文件加载
                html_template = await self._load_template_from_file(template_id)
                if html_template:
                    self.template_cache[template_id] = html_template
                else:
                    raise ValueError(f"模板HTML内容不存在: {template_id}")

            # 使用Jinja2渲染
            jinja_template = self.jinja_env.from_string(html_template)
            rendered_content = jinja_template.render(**config)

            # 更新统计
            self.templates[template_id]["render_count"] += 1
            self.template_stats["render_count"] += 1

            return rendered_content

        except Exception as e:
            print(f"❌ 模板渲染失败: {str(e)}")
            # 返回错误页面
            return await self._render_error_page(template_id, str(e))

    async def _load_template_from_file(self, template_id: str) -> Optional[str]:
        """
        从文件加载模板HTML

        Args:
            template_id: 模板ID

        Returns:
            str: HTML内容，如果文件不存在则返回None
        """
        try:
            # 尝试从不同路径加载
            possible_paths = [
                f"templates/{template_id}.html",
                f"templates/{template_id}/template.html",
                f"static/templates/{template_id}.html"
            ]

            for path in possible_paths:
                file_path = Path(path)
                if file_path.exists():
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()

            return None

        except Exception as e:
            print(f"⚠️  从文件加载模板失败 {template_id}: {str(e)}")
            return None

    async def _render_error_page(self, template_id: str, error_message: str) -> str:
        """
        渲染错误页面

        Args:
            template_id: 出错的模板ID
            error_message: 错误信息

        Returns:
            str: 错误页面HTML
        """
        error_template = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>模板渲染错误 - 万物可视化</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .error-container {
            max-width: 800px;
            margin: 50px auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-title {
            color: #e74c3c;
            margin-top: 0;
        }
        .error-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #e74c3c;
        }
        .back-button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .back-button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">❌ 模板渲染错误</h1>
        <p>抱歉，可视化模板渲染时发生了错误。</p>

        <div class="error-details">
            <h3>错误详情</h3>
            <p><strong>模板ID:</strong> {{ template_id }}</p>
            <p><strong>错误信息:</strong> {{ error_message }}</p>
            <p><strong>时间:</strong> {{ timestamp }}</p>
        </div>

        <p>请尝试以下解决方案：</p>
        <ul>
            <li>检查输入参数是否正确</li>
            <li>尝试使用其他模板</li>
            <li>联系技术支持</li>
        </ul>

        <a href="/" class="back-button">返回首页</a>
    </div>
</body>
</html>
        """

        # 使用简单替换避免Jinja2错误
        return error_template.replace("{{ template_id }}", template_id).replace(
            "{{ error_message }}", error_message
        ).replace("{{ timestamp }}", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    async def validate_template(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证模板配置

        Args:
            template: 模板配置

        Returns:
            Dict: 验证结果
        """
        result = {
            "valid": True,
            "errors": [],
            "warnings": []
        }

        try:
            # 检查必需字段
            required_fields = ["id", "name", "description", "subject"]
            for field in required_fields:
                if field not in template:
                    result["errors"].append(f"缺少必需字段: {field}")
                    result["valid"] = False

            # 检查字段类型
            if "parameters" in template and not isinstance(template["parameters"], list):
                result["errors"].append("parameters字段必须是列表类型")
                result["valid"] = False

            if "keywords" in template and not isinstance(template["keywords"], list):
                result["warnings"].append("建议keywords字段为列表类型")

            # 检查HTML模板
            if "html_template" in template:
                html_template = template["html_template"]
                if not html_template.strip():
                    result["errors"].append("html_template不能为空")
                    result["valid"] = False
                elif not html_template.strip().startswith("<!DOCTYPE"):
                    result["warnings"].append("建议HTML模板以DOCTYPE声明开头")

            return result

        except Exception as e:
            result["valid"] = False
            result["errors"].append(f"验证过程出错: {str(e)}")
            return result

    async def create_template_from_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        根据配置创建新模板

        Args:
            config: 模板配置

        Returns:
            Dict: 创建的模板
        """
        try:
            # 基础模板结构
            template = {
                "id": config.get("id", f"template_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
                "name": config.get("name", "新模板"),
                "description": config.get("description", ""),
                "subject": config.get("subject", "general"),
                "category": config.get("category", "custom"),
                "difficulty": config.get("difficulty", "中级"),
                "parameters": config.get("parameters", []),
                "keywords": config.get("keywords", []),
                "examples": config.get("examples", []),
                "html_template": config.get("html_template", await self._generate_default_template(config)),
                "css_styles": config.get("css_styles", ""),
                "javascript_code": config.get("javascript_code", ""),
                "interactive_options": config.get("interactive_options", {}),
                "data_requirements": config.get("data_requirements", {}),
                "created_at": datetime.now().isoformat(),
                "version": "1.0"
            }

            # 验证模板
            validation = await self.validate_template(template)
            if not validation["valid"]:
                raise ValueError(f"模板验证失败: {', '.join(validation['errors'])}")

            # 注册模板
            success = await self.register_template(template)
            if not success:
                raise ValueError("模板注册失败")

            return template

        except Exception as e:
            raise ValueError(f"创建模板失败: {str(e)}")

    async def _generate_default_template(self, config: Dict[str, Any]) -> str:
        """
        生成默认HTML模板

        Args:
            config: 模板配置

        Returns:
            str: 默认HTML模板
        """
        subject = config.get("subject", "general")
        name = config.get("name", "可视化")

        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title or "{name}"}}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .visualization-container {{
            height: 500px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
        }}
        .controls {{
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }}
        .info-panel {{
            padding: 15px;
            background: #e9ecef;
            border-radius: 8px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{title or "{name}"}}</h1>
            <p>学科: {subject} | 生成时间: {{timestamp}}</p>
        </div>

        <div class="controls" id="controls">
            <!-- 动态生成控制面板 -->
        </div>

        <div id="plot" class="visualization-container"></div>

        <div class="info-panel">
            <h3>可视化信息</h3>
            <p><strong>学科:</strong> {subject}</p>
            <p><strong>模板:</strong> {name}</p>
            <p><strong>参数:</strong> <span id="parameters-display">{{parameters|tojson}}</span></p>
        </div>
    </div>

    <script>
        // Plotly配置和数据
        const plotlyConfig = {{plotly_config|tojson}};
        const data = {{data|tojson}};

        // 初始化图表
        if (plotlyConfig && plotlyConfig.data) {{
            Plotly.newPlot('plot', plotlyConfig.data, plotlyConfig.layout, {{
                responsive: true,
                displayModeBar: true
            }});
        }} else {{
            // 默认占位图表
            Plotly.newPlot('plot', [{{
                x: [1, 2, 3, 4],
                y: [1, 4, 2, 3],
                type: 'scatter',
                mode: 'lines+markers',
                name: '示例数据'
            }}], {{
                title: '可视化占位图',
                xaxis: {{title: 'X轴'}},
                yaxis: {{title: 'Y轴'}}
            }});
        }}

        // 显示参数
        const paramsElement = document.getElementById('parameters-display');
        if (paramsElement) {{
            paramsElement.textContent = JSON.stringify(plotlyConfig.parameters || {{}}, null, 2);
        }}

        console.log('可视化初始化完成');
        console.log('数据:', data);
        console.log('配置:', plotlyConfig);
    </script>
</body>
</html>
        """

    def get_template_stats(self) -> Dict[str, Any]:
        """获取模板统计信息"""
        return {
            **self.template_stats,
            "cache_size": len(self.template_cache),
            "most_used_templates": sorted(
                self.templates.items(),
                key=lambda x: x[1].get("render_count", 0),
                reverse=True
            )[:5],
            "timestamp": datetime.now().isoformat()
        }

    async def cleanup_cache(self) -> int:
        """
        清理模板缓存

        Returns:
            int: 清理的缓存数量
        """
        cache_size = len(self.template_cache)
        self.template_cache.clear()
        print(f"🧹 已清理 {cache_size} 个模板缓存")
        return cache_size