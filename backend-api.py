#!/usr/bin/env python3
"""
万物可视化 - 后端API服务
支持用户输入可视化需求，返回交互式可视化页面
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import uuid
import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(
    title="万物可视化 API",
    description="AI驱动的可视化平台后端服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class VisualizationRequest(BaseModel):
    prompt: str
    vizType: Optional[str] = "自动"
    complexity: Optional[str] = "中等"
    params: Optional[Dict[str, Any]] = {}

class VisualizationResponse(BaseModel):
    success: bool
    visualizationId: str
    htmlContent: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    relatedTemplates: Optional[List[Dict[str, Any]]] = None

class TemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    category: str
    subcategory: Optional[str] = None
    difficulty: Optional[str] = None
    tags: List[str] = []
    keywords: List[str] = []
    parameters: List[Dict[str, Any]] = []
    examples: List[str] = []

# 内存存储（生产环境应使用数据库）
visualizations_store = {}
templates_cache = {}

# 加载模板数据
def load_templates():
    """加载前端模板数据"""
    try:
        template_path = Path(__file__).parent / "main-app" / "data" / "templates.json"
        if template_path.exists():
            with open(template_path, 'r', encoding='utf-8') as f:
                templates_data = json.load(f)
                # 将模板数据转换为易于查询的格式
                for category in templates_data.get('categories', []):
                    for template in category.get('templates', []):
                        templates_cache[template['id']] = template
                        templates_cache[template['name']] = template
                        # 添加关键词映射
                        for keyword in template.get('keywords', []):
                            templates_cache[keyword.lower()] = template
            print(f"✅ 加载了 {len(templates_cache)} 个模板")
        else:
            print(f"⚠️ 模板文件不存在: {template_path}")
            # 尝试创建基本模板
            create_basic_templates()
    except Exception as e:
        print(f"❌ 加载模板失败: {e}")
        create_basic_templates()

def create_basic_templates():
    """创建基本模板数据"""
    basic_templates = {
        "normal_distribution": {
            "id": "normal_distribution",
            "name": "正态分布",
            "description": "标准正态分布概率密度函数",
            "category": "mathematics",
            "subcategory": "probability",
            "difficulty": "初级",
            "tags": ["概率", "统计", "分布", "高斯分布"],
            "keywords": ["正态", "高斯", "normal", "gaussian", "钟形曲线", "均值", "标准差"],
            "parameters": [
                {"name": "mu", "label": "均值 (μ)", "type": "number", "default": 0, "min": -10, "max": 10, "step": 0.1},
                {"name": "sigma", "label": "标准差 (σ)", "type": "number", "default": 1, "min": 0.1, "max": 5, "step": 0.1}
            ],
            "examples": ["标准正态分布 均值0 标准差1", "正态分布 平均值5 方差2", "高斯分布 μ=2 σ=1.5"]
        },
        "binomial_distribution": {
            "id": "binomial_distribution",
            "name": "二项分布",
            "description": "二项分布概率质量函数",
            "category": "mathematics",
            "subcategory": "probability",
            "difficulty": "初级",
            "tags": ["概率", "统计", "离散分布", "伯努利试验"],
            "keywords": ["二项", "binomial", "伯努利", "离散", "试验", "成功概率"],
            "parameters": [
                {"name": "n", "label": "试验次数 (n)", "type": "integer", "default": 20, "min": 1, "max": 100, "step": 1},
                {"name": "p", "label": "成功概率 (p)", "type": "number", "default": 0.5, "min": 0, "max": 1, "step": 0.01}
            ],
            "examples": ["二项分布 n=20 p=0.5", "抛硬币20次正面朝上的概率分布", "伯努利试验 成功率30%"]
        },
        "poisson_distribution": {
            "id": "poisson_distribution",
            "name": "泊松分布",
            "description": "泊松分布概率质量函数",
            "category": "mathematics",
            "subcategory": "probability",
            "difficulty": "中级",
            "tags": ["概率", "统计", "泊松过程", "计数分布"],
            "keywords": ["泊松", "poisson", "计数", "事件", "频率", "强度参数", "lambda"],
            "parameters": [
                {"name": "lambda", "label": "强度参数 (λ)", "type": "number", "default": 5, "min": 0.1, "max": 20, "step": 0.1}
            ],
            "examples": ["泊松分布 λ=5", "单位时间内事件发生次数", "计数分布"]
        }
    }

    # 将基本模板添加到缓存
    for template_id, template in basic_templates.items():
        templates_cache[template_id] = template
        templates_cache[template['name']] = template
        for keyword in template['keywords']:
            templates_cache[keyword.lower()] = template

    print(f"✅ 创建了 {len(basic_templates)} 个基本模板")

# 可视化生成器
class VisualizationGenerator:
    """可视化生成器"""

    def __init__(self):
        self.templates = templates_cache

    async def generate_from_prompt(self, request: VisualizationRequest) -> VisualizationResponse:
        """根据用户输入生成可视化"""
        try:
            # 1. 解析用户需求
            parsed_requirement = await self.parse_requirement(request.prompt)

            # 2. 匹配合适的模板
            matched_template = await self.match_template(parsed_requirement)

            # 3. 生成可视化配置
            viz_config = await self.generate_config(parsed_requirement, matched_template, request.params)

            # 4. 生成HTML内容
            html_content = await self.generate_html(viz_config, matched_template)

            # 5. 查找相关模板推荐
            related_templates = await self.find_related_templates(matched_template)

            # 生成唯一ID
            viz_id = str(uuid.uuid4())

            # 存储可视化数据
            visualizations_store[viz_id] = {
                "id": viz_id,
                "prompt": request.prompt,
                "config": viz_config,
                "htmlContent": html_content,
                "template": matched_template,
                "createdAt": datetime.now().isoformat()
            }

            return VisualizationResponse(
                success=True,
                visualizationId=viz_id,
                htmlContent=html_content,
                config=viz_config,
                message="可视化生成成功",
                relatedTemplates=related_templates
            )

        except Exception as e:
            print(f"生成可视化失败: {e}")
            return VisualizationResponse(
                success=False,
                visualizationId="",
                message=f"生成失败: {str(e)}"
            )

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """解析用户需求"""
        # 简化的需求解析逻辑
        requirement = {
            "original": prompt,
            "type": "auto",
            "parameters": {},
            "keywords": []
        }

        prompt_lower = prompt.lower()

        # 提取关键词
        keywords = []
        for key, template in templates_cache.items():
            if isinstance(template, dict) and 'keywords' in template:
                for keyword in template.get('keywords', []):
                    if keyword.lower() in prompt_lower:
                        keywords.append(keyword)

        requirement["keywords"] = keywords

        # 尝试提取数值参数
        import re
        numbers = re.findall(r'[-+]?\d*\.?\d+', prompt)
        if numbers:
            requirement["numbers"] = [float(n) for n in numbers]

        return requirement

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """匹配最合适的模板"""
        if not requirement["keywords"]:
            return None

        # 简单的模板匹配逻辑
        best_template = None
        best_score = 0

        for key, template in templates_cache.items():
            if isinstance(template, dict) and 'keywords' in template:
                score = 0
                for keyword in requirement["keywords"]:
                    if keyword in [k.lower() for k in template.get('keywords', [])]:
                        score += 1

                if score > best_score:
                    best_score = score
                    best_template = template

        return best_template if best_score > 0 else None

    async def generate_config(self, requirement: Dict[str, Any], template: Optional[Dict[str, Any]], user_params: Dict[str, Any]) -> Dict[str, Any]:
        """生成可视化配置"""
        config = {
            "type": "plotly",
            "responsive": True,
            "parameters": {}
        }

        if template:
            config["templateId"] = template.get("id")
            config["category"] = template.get("category")
            config["subcategory"] = template.get("subcategory")

            # 使用模板默认参数
            for param in template.get("parameters", []):
                param_name = param["name"]
                param_value = user_params.get(param_name, param["default"])
                config["parameters"][param_name] = param_value

            # 如果用户输入中有数字，尝试自动填充参数
            if "numbers" in requirement and len(requirement["numbers"]) > 0:
                numbers = requirement["numbers"]
                param_names = list(config["parameters"].keys())

                for i, num in enumerate(numbers[:len(param_names)]):
                    config["parameters"][param_names[i]] = num

        return config

    async def generate_html(self, config: Dict[str, Any], template: Optional[Dict[str, Any]]) -> str:
        """生成可视化HTML内容"""

        if config.get("templateId") == "normal_distribution":
            return await self.generate_normal_distribution_html(config)
        elif config.get("templateId") == "binomial_distribution":
            return await self.generate_binomial_distribution_html(config)
        elif config.get("templateId") == "poisson_distribution":
            return await self.generate_poisson_distribution_html(config)
        else:
            # 通用可视化页面
            return await self.generate_generic_html(config, template)

    async def generate_normal_distribution_html(self, config: Dict[str, Any]) -> str:
        """生成正态分布可视化HTML"""
        mu = config["parameters"].get("mu", 0)
        sigma = config["parameters"].get("sigma", 1)

        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>正态分布可视化</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .controls {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }}
        .control-group {{
            display: flex;
            flex-direction: column;
        }}
        .control-group label {{
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }}
        .control-group input {{
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }}
        .control-group input:focus {{
            outline: none;
            border-color: #667eea;
        }}
        .value-display {{
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }}
        #plot {{
            width: 100%;
            height: 500px;
            border-radius: 10px;
            overflow: hidden;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #667eea;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }}
        .stat-label {{
            color: #666;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 正态分布可视化</h1>
            <p>高斯分布 - 概率密度函数的交互式展示</p>
        </div>

        <div class="content">
            <div class="controls">
                <div class="control-group">
                    <label for="mu">均值 (μ)</label>
                    <input type="range" id="mu" min="-10" max="10" step="0.1" value="{mu}">
                    <div class="value-display">μ = <span id="muValue">{mu}</span></div>
                </div>

                <div class="control-group">
                    <label for="sigma">标准差 (σ)</label>
                    <input type="range" id="sigma" min="0.1" max="5" step="0.1" value="{sigma}">
                    <div class="value-display">σ = <span id="sigmaValue">{sigma}</span></div>
                </div>
            </div>

            <div id="plot"></div>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="meanStat">{mu}</div>
                    <div class="stat-label">均值</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="stdStat">{sigma}</div>
                    <div class="stat-label">标准差</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="varStat">{sigma**2:.2f}</div>
                    <div class="stat-label">方差</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="medianStat">{mu}</div>
                    <div class="stat-label">中位数</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 正态分布概率密度函数
        function normalPDF(x, mu, sigma) {{
            return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
                   Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        }}

        // 生成正态分布数据
        function generateNormalData(mu, sigma) {{
            const x = [];
            const y = [];
            for (let xVal = mu - 4 * sigma; xVal <= mu + 4 * sigma; xVal += 0.01) {{
                x.push(xVal);
                y.push(normalPDF(xVal, mu, sigma));
            }}
            return {{ x, y }};
        }}

        // 更新图表
        function updatePlot() {{
            const mu = parseFloat(document.getElementById('mu').value);
            const sigma = parseFloat(document.getElementById('sigma').value);

            const data = generateNormalData(mu, sigma);

            const trace = {{
                x: data.x,
                y: data.y,
                type: 'scatter',
                mode: 'lines',
                name: '概率密度函数',
                line: {{
                    color: '#667eea',
                    width: 3
                }},
                fill: 'tozeroy',
                    fillcolor: 'rgba(102, 126, 234, 0.1)'
            }};

            const layout = {{
                title: {{
                    text: `正态分布 N(${{mu.toFixed(1)}}, ${{sigma.toFixed(1)}}²)`,
                    font: {{
                        size: 20,
                        color: '#333'
                    }}
                }},
                xaxis: {{
                    title: '值 (x)',
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                yaxis: {{
                    title: '概率密度 f(x)',
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                hovermode: 'x',
                margin: {{ t: 50, r: 30, b: 60, l: 70 }}
            }};

            const config = {{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d']
            }};

            Plotly.newPlot('plot', [trace], layout, config);

            // 更新统计信息
            document.getElementById('muValue').textContent = mu.toFixed(1);
            document.getElementById('sigmaValue').textContent = sigma.toFixed(1);
            document.getElementById('meanStat').textContent = mu.toFixed(2);
            document.getElementById('stdStat').textContent = sigma.toFixed(2);
            document.getElementById('varStat').textContent = (sigma * sigma).toFixed(2);
            document.getElementById('medianStat').textContent = mu.toFixed(2);
        }}

        // 事件监听
        document.getElementById('mu').addEventListener('input', updatePlot);
        document.getElementById('sigma').addEventListener('input', updatePlot);

        // 初始化图表
        updatePlot();

        // 添加窗口大小改变时的重绘
        window.addEventListener('resize', function() {{
            Plotly.Plots.resize('plot');
        }});
    </script>
</body>
</html>
        """

    async def generate_binomial_distribution_html(self, config: Dict[str, Any]) -> str:
        """生成二项分布可视化HTML"""
        n = int(config["parameters"].get("n", 20))
        p = config["parameters"].get("p", 0.5)

        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>二项分布可视化</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .controls {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }}
        .control-group {{
            display: flex;
            flex-direction: column;
        }}
        .control-group label {{
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }}
        .control-group input {{
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }}
        .control-group input:focus {{
            outline: none;
            border-color: #f093fb;
        }}
        .value-display {{
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }}
        #plot {{
            width: 100%;
            height: 500px;
            border-radius: 10px;
            overflow: hidden;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #f093fb;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #f093fb;
        }}
        .stat-label {{
            color: #666;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 二项分布可视化</h1>
            <p>二项分布 B(n,p) - 离散概率分布的交互式展示</p>
        </div>

        <div class="content">
            <div class="controls">
                <div class="control-group">
                    <label for="n">试验次数 (n)</label>
                    <input type="range" id="n" min="1" max="100" step="1" value="{n}">
                    <div class="value-display">n = <span id="nValue">{n}</span></div>
                </div>

                <div class="control-group">
                    <label for="p">成功概率 (p)</label>
                    <input type="range" id="p" min="0" max="1" step="0.01" value="{p}">
                    <div class="value-display">p = <span id="pValue">{p:.2f}</span></div>
                </div>
            </div>

            <div id="plot"></div>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="meanStat">{n * p:.1f}</div>
                    <div class="stat-label">期望值 E[X]</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="varStat">{n * p * (1 - p):.2f}</div>
                    <div class="stat-label">方差 Var(X)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="stdStat">{(n * p * (1 - p))**0.5:.2f}</div>
                    <div class="stat-label">标准差 σ</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="modeStat">floor({n * p + p})</div>
                    <div class="stat-label">众数</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 二项分布概率质量函数
        function binomialPMF(k, n, p) {{
            // 计算组合数 C(n,k)
            function combination(n, k) {{
                if (k > n) return 0;
                if (k === 0 || k === n) return 1;
                if (k === 1) return n;

                let result = 1;
                for (let i = 1; i <= k; i++) {{
                    result = result * (n - i + 1) / i;
                }}
                return result;
            }}

            return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        }}

        // 生成二项分布数据
        function generateBinomialData(n, p) {{
            const x = [];
            const y = [];

            for (let k = 0; k <= n; k++) {{
                x.push(k);
                y.push(binomialPMF(k, n, p));
            }}

            return {{ x, y }};
        }}

        // 更新图表
        function updatePlot() {{
            const n = parseInt(document.getElementById('n').value);
            const p = parseFloat(document.getElementById('p').value);

            const data = generateBinomialData(n, p);

            const trace = {{
                x: data.x,
                y: data.y,
                type: 'bar',
                name: '概率质量函数',
                marker: {{
                    color: '#f093fb',
                    line: {{
                        color: '#f5576c',
                        width: 2
                    }}
                }},
                text: data.y.map(y => y.toFixed(4)),
                textposition: 'auto'
            }};

            const layout = {{
                title: {{
                    text: `二项分布 B(${{n}}, ${{p.toFixed(2)}})`,
                    font: {{
                        size: 20,
                        color: '#333'
                    }}
                }},
                xaxis: {{
                    title: '成功次数 k',
                    dtick: 1,
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                yaxis: {{
                    title: '概率 P(X=k)',
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                hovermode: 'x',
                margin: {{ t: 50, r: 30, b: 60, l: 70 }}
            }};

            const config = {{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d']
            }};

            Plotly.newPlot('plot', [trace], layout, config);

            // 更新统计信息
            const mean = n * p;
            const variance = n * p * (1 - p);
            const std = Math.sqrt(variance);
            const mode = Math.floor((n + 1) * p);

            document.getElementById('nValue').textContent = n;
            document.getElementById('pValue').textContent = p.toFixed(2);
            document.getElementById('meanStat').textContent = mean.toFixed(2);
            document.getElementById('varStat').textContent = variance.toFixed(2);
            document.getElementById('stdStat').textContent = std.toFixed(2);
            document.getElementById('modeStat').textContent = mode;
        }}

        // 事件监听
        document.getElementById('n').addEventListener('input', updatePlot);
        document.getElementById('p').addEventListener('input', updatePlot);

        // 初始化图表
        updatePlot();

        // 添加窗口大小改变时的重绘
        window.addEventListener('resize', function() {{
            Plotly.Plots.resize('plot');
        }});
    </script>
</body>
</html>
        """

    async def generate_poisson_distribution_html(self, config: Dict[str, Any]) -> str:
        """生成泊松分布可视化HTML"""
        lambda_param = config["parameters"].get("lambda", 5)

        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>泊松分布可视化</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .controls {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }}
        .control-group {{
            display: flex;
            flex-direction: column;
        }}
        .control-group label {{
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }}
        .control-group input {{
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }}
        .control-group input:focus {{
            outline: none;
            border-color: #4facfe;
        }}
        .value-display {{
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }}
        #plot {{
            width: 100%;
            height: 500px;
            border-radius: 10px;
            overflow: hidden;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #4facfe;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #4facfe;
        }}
        .stat-label {{
            color: #666;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔢 泊松分布可视化</h1>
            <p>泊松分布 P(λ) - 单位时间内事件发生次数的概率分布</p>
        </div>

        <div class="content">
            <div class="controls">
                <div class="control-group">
                    <label for="lambda">强度参数 (λ)</label>
                    <input type="range" id="lambda" min="0.1" max="20" step="0.1" value="{lambda_param}">
                    <div class="value-display">λ = <span id="lambdaValue">{lambda_param}</span></div>
                </div>
            </div>

            <div id="plot"></div>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="meanStat">{lambda_param}</div>
                    <div class="stat-label">期望值 E[X]</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="varStat">{lambda_param}</div>
                    <div class="stat-label">方差 Var(X)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="stdStat">{lambda_param**0.5:.2f}</div>
                    <div class="stat-label">标准差 σ</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="modeStat">floor({lambda_param})</div>
                    <div class="stat-label">众数</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 泊松分布概率质量函数
        function poissonPMF(k, lambda) {{
            // 计算 e^(-lambda)
            const expNegLambda = Math.exp(-lambda);

            // 计算 lambda^k
            let lambdaPowK = 1;
            for (let i = 1; i <= k; i++) {{
                lambdaPowK *= lambda;
            }}

            // 计算 k!
            let factorialK = 1;
            for (let i = 1; i <= k; i++) {{
                factorialK *= i;
            }}

            return expNegLambda * lambdaPowK / factorialK;
        }}

        // 生成泊松分布数据
        function generatePoissonData(lambda) {{
            const x = [];
            const y = [];

            // 计算显示范围 (通常到期望值的3倍标准差)
            const maxK = Math.min(Math.ceil(lambda + 4 * Math.sqrt(lambda)), 50);

            for (let k = 0; k <= maxK; k++) {{
                x.push(k);
                y.push(poissonPMF(k, lambda));
            }}

            return {{ x, y }};
        }}

        // 更新图表
        function updatePlot() {{
            const lambda = parseFloat(document.getElementById('lambda').value);

            const data = generatePoissonData(lambda);

            const trace = {{
                x: data.x,
                y: data.y,
                type: 'bar',
                name: '概率质量函数',
                marker: {{
                    color: '#4facfe',
                    line: {{
                        color: '#00f2fe',
                        width: 2
                    }}
                }},
                text: data.y.map(y => y.toFixed(4)),
                textposition: 'auto'
            }};

            const layout = {{
                title: {{
                    text: `泊松分布 P(${{lambda.toFixed(1)}})`,
                    font: {{
                        size: 20,
                        color: '#333'
                    }}
                }},
                xaxis: {{
                    title: '事件发生次数 k',
                    dtick: 1,
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                yaxis: {{
                    title: '概率 P(X=k)',
                    showgrid: true,
                    gridcolor: '#e9ecef'
                }},
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                hovermode: 'x',
                margin: {{ t: 50, r: 30, b: 60, l: 70 }}
            }};

            const config = {{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d']
            }};

            Plotly.newPlot('plot', [trace], layout, config);

            // 更新统计信息
            const mean = lambda;
            const variance = lambda;
            const std = Math.sqrt(lambda);
            const mode = Math.floor(lambda);

            document.getElementById('lambdaValue').textContent = lambda.toFixed(1);
            document.getElementById('meanStat').textContent = mean.toFixed(2);
            document.getElementById('varStat').textContent = variance.toFixed(2);
            document.getElementById('stdStat').textContent = std.toFixed(2);
            document.getElementById('modeStat').textContent = mode;
        }}

        // 事件监听
        document.getElementById('lambda').addEventListener('input', updatePlot);

        // 初始化图表
        updatePlot();

        // 添加窗口大小改变时的重绘
        window.addEventListener('resize', function() {{
            Plotly.Plots.resize('plot');
        }});
    </script>
</body>
</html>
        """

    async def generate_generic_html(self, config: Dict[str, Any], template: Optional[Dict[str, Any]]) -> str:
        """生成通用可视化页面"""
        template_name = template.get("name", "未知可视化") if template else "通用可视化"
        template_desc = template.get("description", "暂无描述") if template else "根据您的输入生成的可视化"

        return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{template_name}</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .placeholder {{
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }}
        .placeholder h2 {{
            color: #333;
            margin-bottom: 20px;
        }}
        .placeholder p {{
            font-size: 18px;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
        }}
        .config {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }}
        .config h3 {{
            color: #333;
            margin-top: 0;
        }}
        .config pre {{
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #667eea;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 {template_name}</h1>
            <p>{template_desc}</p>
        </div>

        <div class="content">
            <div class="placeholder">
                <h2>🚧 可视化生成中</h2>
                <p>我们正在根据您的需求生成可视化内容。这是一个通用模板页面。</p>
                <p>完整的可视化功能将包括：交互式图表、参数控制、统计信息展示等。</p>
            </div>

            <div class="config">
                <h3>📋 配置信息</h3>
                <pre>{json.dumps(config, indent=2, ensure_ascii=False)}</pre>
            </div>
        </div>
    </div>
</body>
</html>
        """

    async def find_related_templates(self, template: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """查找相关模板推荐"""
        if not template:
            return []

        related = []
        category = template.get("category")
        subcategory = template.get("subcategory")

        # 查找同类别的其他模板
        for key, t in templates_cache.items():
            if isinstance(t, dict) and t.get("id") != template.get("id"):
                if t.get("category") == category:
                    related.append(t)
                    if len(related) >= 3:  # 限制推荐数量
                        break

        return related

# 初始化生成器
generator = VisualizationGenerator()

# API路由
@app.get("/")
async def root():
    """根路由"""
    return {"message": "万物可视化 API 服务正在运行", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/templates", response_model=List[TemplateInfo])
async def get_templates():
    """获取所有模板"""
    templates = []
    for key, template in templates_cache.items():
        if isinstance(template, dict) and 'id' in template and 'name' in template:
            templates.append(TemplateInfo(**template))

    # 去重
    unique_templates = []
    seen_ids = set()
    for template in templates:
        if template.id not in seen_ids:
            unique_templates.append(template)
            seen_ids.add(template.id)

    return unique_templates

@app.post("/resolve_or_generate", response_model=VisualizationResponse)
async def resolve_or_generate(request: VisualizationRequest):
    """解析用户需求或生成可视化"""
    try:
        # 调用生成器
        result = await generator.generate_from_prompt(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")

@app.get("/visualizations/{viz_id}")
async def get_visualization(viz_id: str):
    """获取已生成的可视化"""
    if viz_id not in visualizations_store:
        raise HTTPException(status_code=404, detail="可视化不存在")

    return visualizations_store[viz_id]

@app.get("/registry")
async def get_registry():
    """获取可视化注册表"""
    return {
        "categories": ["mathematics", "astronomy", "physics", "chemistry"],
        "types": ["plot", "chart", "graph", "simulation"],
        "complexities": ["初级", "中级", "高级"],
        "totalTemplates": len([t for t in templates_cache.values() if isinstance(t, dict) and 'id' in t])
    }

# 启动时加载模板
@app.on_event("startup")
async def startup_event():
    print("🚀 万物可视化 API 服务启动中...")
    load_templates()
    print("✅ 服务启动完成，访问 http://localhost:8000")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)