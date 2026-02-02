# DeepSeek-Manim 整合方案

## 一、项目概述

将 DeepSeek-Manim 自动动画生成工具整合到现有的 AI 可视化项目中，增强数学动画自动生成能力。

## 二、核心价值

### 2.1 现有优势
- ✅ 完整的数学术语数据库（沪教版高中数学1术语表）
- ✅ 文件分析和理解能力
- ✅ 多模块可视化系统
- ✅ OpenSpec 规范化管理

### 2.2 增强能力
- 🆕 自动生成 Manim 数学动画代码
- 🆕 LaTeX 公式自动可视化
- 🆕 自然语言转动画场景
- 🆕 双流输出（动画 + 学习笔记）

## 三、技术架构设计

### 3.1 系统架构

```
┌─────────────────────────────────────────────────────┐
│              用户交互层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Web UI   │  │ API接口  │  │ CLI工具  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              智能代理层                              │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ 文档分析代理  │  │ 动画生成代理  │               │
│  │ (现有)       │  │ (新增)       │               │
│  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ 数学术语库    │  │ LaTeX处理器   │               │
│  │ (现有)       │  │ (新增)       │               │
│  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              DeepSeek-R1 引擎层                     │
│  ┌──────────────────────────────────────┐          │
│  │   DeepSeek API 客户端                │          │
│  │   - LaTeX 锚定优化                    │          │
│  │   - 代码自动修正                      │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              动画生成层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ LaTeX →  │  │ Python   │  │ Manim    │         │
│  │ PDF      │  │ Script   │  │ Renderer │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              输出层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ MP4 视频  │  │ 学习笔记  │  │ 代码仓库  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### 3.2 模块设计

#### 模块1: 动画生成代理 (Animation Generator Agent)
**路径**: `backend-v2/agents/animation_generator_agent.py`

```python
"""
动画生成代理 - 使用 DeepSeek-R1 生成 Manim 动画代码
"""
import os
from typing import Dict, List, Optional
from openai import OpenAI  # DeepSeek API 兼容 OpenAI SDK
from pathlib import Path

class AnimationGeneratorAgent:
    """Manim 动画自动生成代理"""

    def __init__(self, api_key: str = None):
        """初始化 DeepSeek 客户端"""
        self.client = OpenAI(
            api_key=api_key or os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com"
        )
        self.terminology_db = self._load_terminology()

    def generate_from_terminology(self, term: Dict) -> Dict:
        """
        从数学术语生成动画

        Args:
            term: {
                "chinese": "正弦",
                "english": "Sine",
                "symbol": "\\sin \\alpha = \\frac{y}{r}"
            }

        Returns:
            {
                "latex_code": "...",
                "manim_code": "...",
                "notes": "...",
                "scene_description": "..."
            }
        """
        prompt = self._build_terminology_prompt(term)
        return self._generate_animation(prompt)

    def generate_from_concept(self, concept: str, latex: str = None) -> Dict:
        """
        从数学概念生成动画

        Args:
            concept: "展示傅里叶级数逼近方波的过程"
            latex: 可选的 LaTeX 数学表达式

        Returns:
            动画生成结果字典
        """
        prompt = self._build_concept_prompt(concept, latex)
        return self._generate_animation(prompt)

    def _build_terminology_prompt(self, term: Dict) -> str:
        """构建基于术语的提示词（使用 LaTeX 锚定）"""
        return f"""
请为以下数学术语创建一个教学动画：

**中文术语**: {term['chinese']}
**英文术语**: {term['english']}
**数学符号**: ${term['symbol']}$

要求：
1. 使用 LaTeX 格式的数学表达式
2. 生成 Manim Python 代码
3. 包含完整的动画场景说明
4. 添加中文学习笔记
5. 动画时长控制在 10-15 秒

请按以下格式输出：
- LaTeX 文件内容
- Manim Python 代码
- Markdown 学习笔记
- 场景描述
"""

    def _generate_animation(self, prompt: str) -> Dict:
        """调用 DeepSeek API 生成动画内容"""
        response = self.client.chat.completions.create(
            model="deepseek-reasoner",  # 或 "deepseek-chat"
            messages=[
                {"role": "system", "content": "你是专业的数学动画制作专家，精通 Manim 和 LaTeX"},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )

        # 解析响应并提取各个部分
        content = response.choices[0].message.content
        return self._parse_response(content)

    def _parse_response(self, content: str) -> Dict:
        """解析 API 响应，提取 LaTeX、Python 和笔记"""
        # 实现解析逻辑
        pass

    def _load_terminology(self) -> List[Dict]:
        """加载数学术语数据库"""
        # 读取沪教版高中数学1术语表
        # 返回术语列表
        pass
```

#### 模块2: LaTeX 处理器
**路径**: `backend-v2/processors/latex_processor.py`

```python
"""
LaTeX 处理器 - 处理 LaTeX 到 PDF 和 Manim 的转换
"""
import subprocess
from pathlib import Path
import re

class LaTeXProcessor:
    """LaTeX 文档处理和转换"""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir

    def latex_to_pdf(self, latex_content: str, filename: str) -> Path:
        """将 LaTeX 转换为 PDF"""
        tex_file = self.output_dir / f"{filename}.tex"
        tex_file.write_text(latex_content)

        # 使用 pdflatex 或 xelatex 编译
        subprocess.run(
            ["xelatex", str(tex_file)],
            cwd=self.output_dir,
            capture_output=True
        )

        return self.output_dir / f"{filename}.pdf"

    def sanitize_math_expression(self, expr: str) -> str:
        """
        净化数学表达式（用于 Manim）
        使用正则表达式清理 LaTeX 代码
        """
        # 实现净化逻辑
        return expr

    def extract_math_symbols(self, latex: str) -> List[str]:
        """从 LaTeX 中提取数学符号"""
        pattern = r'\$([^$]+)\$'
        return re.findall(pattern, latex)
```

#### 模块3: Manim 渲染器
**路径**: `backend-v2/renderers/manim_renderer.py`

```python
"""
Manim 渲染器 - 执行 Manim 代码生成视频
"""
import subprocess
from pathlib import Path
import json

class ManimRenderer:
    """Manim 动画渲染管理器"""

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def render(self, python_code: str, scene_name: str) -> Dict:
        """
        渲染 Manim 场景

        Returns:
            {
                "video_path": "path/to/video.mp4",
                "success": True/False,
                "logs": "..."
            }
        """
        # 保存 Python 代码
        script_file = self.output_dir / f"{scene_name}.py"
        script_file.write_text(python_code)

        # 执行 Manim 命令
        # manim -pql script.py SceneName
        result = subprocess.run(
            [
                "manim",
                "-pql",  # 高质量预览
                str(script_file),
                scene_name
            ],
            cwd=self.output_dir,
            capture_output=True,
            text=True
        )

        return {
            "success": result.returncode == 0,
            "video_path": self.output_dir / "videos" / f"{scene_name}.mp4",
            "logs": result.stdout + result.stderr
        }

    def validate_code(self, python_code: str) -> Dict:
        """验证 Manim 代码的有效性"""
        # 基本语法检查
        try:
            compile(python_code, '<string>', 'exec')
            return {"valid": True, "errors": []}
        except SyntaxError as e:
            return {"valid": False, "errors": [str(e)]}
```

#### 模块4: API 路由
**路径**: `backend-v2/api/animation_generation.py`

```python
"""
动画生成 API 路由
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/animation", tags=["animation"])

class AnimationRequest(BaseModel):
    concept: str
    latex_expression: Optional[str] = None
    duration: Optional[int] = 10
    quality: Optional[str] = "high"

class AnimationResponse(BaseModel):
    video_url: str
    notes_url: str
    manim_code: str
    latex_code: str

@router.post("/generate", response_model=AnimationResponse)
async def generate_animation(request: AnimationRequest):
    """生成数学动画"""
    try:
        # 调用动画生成代理
        agent = AnimationGeneratorAgent()
        result = agent.generate_from_concept(
            request.concept,
            request.latex_expression
        )

        # 渲染视频
        renderer = ManimRenderer(output_dir=Path("output/animations"))
        video_result = renderer.render(
            result["manim_code"],
            result["scene_name"]
        )

        if not video_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"渲染失败: {video_result['logs']}"
            )

        return AnimationResponse(
            video_url=f"/videos/{result['scene_name']}.mp4",
            notes_url=f"/notes/{result['scene_name']}.md",
            manim_code=result["manim_code"],
            latex_code=result["latex_code"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-from-term")
async def generate_from_terminology(chinese: str, english: str, symbol: str):
    """从数学术语生成动画"""
    agent = AnimationGeneratorAgent()
    result = agent.generate_from_terminology({
        "chinese": chinese,
        "english": english,
        "symbol": symbol
    })

    renderer = ManimRenderer(output_dir=Path("output/animations"))
    video_result = renderer.render(result["manim_code"], result["scene_name"])

    return {
        "success": video_result["success"],
        "video_url": f"/videos/{result['scene_name']}.mp4" if video_result["success"] else None,
        "notes": result["notes"]
    }
```

## 四、数据库设计

### 4.1 动画元数据表

```sql
CREATE TABLE animation_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_chinese TEXT NOT NULL,
    term_english TEXT,
    math_symbol TEXT,
    concept_description TEXT,
    latex_code TEXT,
    manim_code TEXT,
    scene_name TEXT UNIQUE,
    video_path TEXT,
    notes_path TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 生成历史表

```sql
CREATE TABLE generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    prompt TEXT,
    deepseek_response TEXT,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 五、工作流程

### 5.1 从术语生成动画

```mermaid
graph LR
    A[选择数学术语] --> B[构建提示词]
    B --> C[调用 DeepSeek API]
    C --> D[解析响应]
    D --> E[提取 LaTeX/Python]
    E --> F[渲染视频]
    F --> G[保存到数据库]
    G --> H[返回给用户]
```

### 5.2 批量生成流程

```python
# 批量从术语表生成动画
async def batch_generate_from_terminology():
    agent = AnimationGeneratorAgent()
    renderer = ManimRenderer(output_dir=Path("output/batch"))

    # 加载术语数据库
    terms = load_terminology_from_markdown()

    results = []
    for term in terms:
        try:
            result = agent.generate_from_terminology(term)
            video_result = renderer.render(
                result["manim_code"],
                result["scene_name"]
            )
            results.append({
                "term": term,
                "success": video_result["success"],
                "video_path": video_result["video_path"]
            })
        except Exception as e:
            results.append({
                "term": term,
                "success": False,
                "error": str(e)
            })

    return results
```

## 六、环境配置

### 6.1 依赖安装

```bash
# 创建专用环境
conda create -n manim-env python=3.9
conda activate manim-env

# 安装 Manim
pip install manim

# 安装 LaTeX
conda install -c conda-forge texlive-core

# 安装 FFmpeg
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# 安装 OpenAI SDK（用于 DeepSeek）
pip install openai
```

### 6.2 环境变量

```bash
# .env 文件
DEEPSEEK_API_KEY=your_deepseek_api_key_here
MANIM_OUTPUT_DIR=./output/animations
LATEX_OUTPUT_DIR=./output/latex
```

## 七、使用示例

### 7.1 CLI 工具

```bash
# 从概念生成动画
python -m backend_v2.cli.animation_cli \
    --concept "展示勾股定理的几何证明" \
    --quality high

# 从术语生成动画
python -m backend_v2.cli.animation_cli \
    --term-chinese "正弦定理" \
    --term-english "Law of Sines" \
    --symbol "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}"

# 批量生成（从术语表）
python -m backend_v2.cli.batch_animation \
    --source 沪教版高中数学1数学术语中英文对照20251223.v1.md \
    --chapter 5 \
    --output ./output/chapter5
```

### 7.2 Web API 调用

```bash
curl -X POST http://localhost:8000/api/animation/generate \
    -H "Content-Type: application/json" \
    -d '{
        "concept": "展示三角函数的图像变换",
        "latex_expression": "\\sin(\\alpha + \\beta) = \\sin \\alpha \\cos \\beta + \\cos \\alpha \\sin \\beta",
        "duration": 15,
        "quality": "high"
    }'
```

## 八、OpenSpec 管理建议

使用 OpenSpec 创建以下变更：

1. **变更1**: 添加 DeepSeek-Manim 动画生成功能
   - 文件: `openspec/changes/001-add-animation-generator.md`
   - 包括：架构设计、模块划分、API设计

2. **变更2**: 创建动画生成代理
   - 文件: `openspec/changes/002-create-animation-agent.md`
   - 包括：DeepSeek集成、提示词优化

3. **变更3**: 批量动画生成系统
   - 文件: `openspec/changes/003-batch-animation-system.md`
   - 包括：术语库集成、批量处理

## 九、预期效果

1. **效率提升**: 从手动编写 Manim 代码（数小时）→ 自动生成（数分钟）
2. **学习曲线**: 降低 Manim 学习门槛，自然语言即可生成动画
3. **教学价值**: 为每个数学术语自动生成教学动画
4. **可扩展性**: 可以处理更复杂的数学概念（如 LIF 神经元模型）

## 十、下一步行动

1. ✅ 审查此方案
2. ⬜ 使用 OpenSpec 创建变更提案
3. ⬜ 设置 DeepSeek API 密钥
4. ⬜ 配置 Manim 环境
5. ⬜ 实现动画生成代理
6. ⬜ 测试术语表批量生成
7. ⬜ 集成到现有 Web UI
