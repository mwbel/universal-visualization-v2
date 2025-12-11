"""
聊天API与现有路由系统的集成模块
连接现代聊天界面与VisualizationRouter
"""

from fastapi import HTTPException
from typing import Dict, Any, Tuple, Optional
import json
import asyncio
from datetime import datetime

# 导入现有的路由系统
from agents.router_manager import VisualizationRouter
from agents.template_engine import UnifiedTemplateEngine

class ChatIntegration:
    """聊天API集成管理器"""

    def __init__(self, router: VisualizationRouter, template_engine: UnifiedTemplateEngine):
        self.router = router
        self.template_engine = template_engine

    async def process_chat_message(
        self,
        message: str,
        user_preferences: Dict[str, Any] = None,
        generate_visualization: bool = True
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        处理聊天消息，集成现有路由系统

        Args:
            message: 用户消息
            user_preferences: 用户偏好设置
            generate_visualization: 是否生成可视化

        Returns:
            Tuple[文本响应, 可视化数据]
        """
        try:
            # 1. 智能学科识别
            subject = await self.router.subject_classifier.classify(message)

            # 2. 基础文本响应生成
            text_response = await self._generate_text_response(message, subject)

            # 3. 可视化生成（如果需要）
            visualization = None
            if generate_visualization and self._should_generate_visualization(message):
                try:
                    visualization = await self._generate_visualization(
                        message, subject, user_preferences or {}
                    )
                except Exception as e:
                    # 可视化生成失败时，在文本响应中说明
                    text_response += f"\n\n注：可视化生成暂时遇到问题，您可以稍后再试。错误：{str(e)}"

            # 4. 添加学科特定的指导信息
            text_response = await self._add_subject_guidance(text_response, subject, message)

            return text_response, visualization

        except Exception as e:
            error_msg = f"处理消息时遇到错误：{str(e)}"
            return error_msg, None

    async def _generate_text_response(self, message: str, subject: str) -> str:
        """生成基础文本响应"""

        # 问候语处理
        if any(greeting in message.lower() for greeting in ["你好", "hello", "hi", "您好"]):
            return self._get_greeting_response(subject)

        # 帮助请求处理
        if any(help_word in message for help_word in ["帮助", "help", "怎么用", "功能"]):
            return self._get_help_response(subject)

        # 学科特定响应
        subject_responses = {
            "mathematics": self._get_mathematics_response(message),
            "astronomy": self._get_astronomy_response(message),
            "physics": self._get_physics_response(message),
            "chemistry": self._get_chemistry_response(message),
            "biology": self._get_biology_response(message)
        }

        return subject_responses.get(subject, self._get_general_response(message))

    def _get_greeting_response(self, subject: str) -> str:
        """获取问候响应"""
        subject_names = {
            "mathematics": "数学",
            "astronomy": "天文",
            "physics": "物理",
            "chemistry": "化学",
            "biology": "生物"
        }

        subject_name = subject_names.get(subject, "多学科")

        return f"""你好！我是万物可视化AI助手。我专注于{subject_name}学科的可视化生成。

我可以帮你：
• 生成{subject_name}相关的图表和动画
• 创建交互式模拟和演示
• 解释复杂的{subject_name}概念
• 提供个性化的学习建议

请告诉我你想要学习什么{subject_name}内容！"""

    def _get_help_response(self, subject: str) -> str:
        """获取帮助响应"""
        return """🎯 万物可视化使用指南

📚 支持的学科：
• 数学：函数图像、几何图形、统计图表
• 天文：天体运动、星系模型、宇宙演化
• 物理：力学模拟、电磁现象、光学实验
• 化学：分子结构、化学反应、元素周期表
• 生物：细胞结构、生态系统、遗传规律

💡 使用技巧：
• 用自然语言描述你想要的可视化
• 可以指定具体的参数和要求
• 支持中英文混合输入
• 可以要求互动式或静态图表

🌟 示例输入：
• "画一个二次函数的图像"
• "展示太阳系八大行星的运行轨迹"
• "模拟一个单摆的运动"

试试看吧！"""

    def _get_mathematics_response(self, message: str) -> str:
        """数学学科响应"""
        if any(keyword in message for keyword in ["函数", "图像", "图像", "画"]):
            return "我可以帮你绘制各种数学函数的图像，包括一次函数、二次函数、三角函数、指数函数等。请告诉我具体的函数表达式，比如 y = x² 或者 sin(x) 等。"
        elif any(keyword in message for keyword in ["几何", "图形", "形状"]):
            return "我可以生成各种几何图形，包括平面几何和立体几何。你可以要求绘制特定的几何体、计算面积体积，或者展示几何变换。"
        elif any(keyword in message for keyword in ["统计", "图表", "数据"]):
            return "我可以创建各种统计图表，包括柱状图、折线图、饼图、散点图等。请提供你的数据或者告诉我想要展示的统计关系。"
        else:
            return "我理解你对数学的兴趣。无论是代数、几何、微积分还是统计学，我都可以通过可视化帮助你更好地理解。请具体说明你想要学习的内容。"

    def _get_astronomy_response(self, message: str) -> str:
        """天文学科响应"""
        if any(keyword in message for keyword in ["太阳系", "行星", "轨道"]):
            return "我可以展示太阳系的完整模型，包括八大行星的轨道运动、相对大小和距离关系。你想要看到整个太阳系还是特定行星的详情？"
        elif any(keyword in message for keyword in ["星系", "银河", "宇宙"]):
            return "我可以模拟星系的结构、恒星的形成和演化过程。你对我们所在的银河系或者其他星系有什么特别想了解的吗？"
        elif any(keyword in message for keyword in ["黑洞", "引力", "相对论"]):
            return "黑洞和引力是很有趣的天文现象！我可以可视化引力场、时空弯曲，或者模拟黑洞周围的物质运动。你想了解哪个方面？"
        else:
            return "天文学是一个令人着迷的领域！从行星运动到宇宙演化，从恒星生命周期到星系碰撞，我都可以通过动画和模型帮助你探索宇宙的奥秘。"

    def _get_physics_response(self, message: str) -> str:
        """物理学科响应"""
        if any(keyword in message for keyword in ["运动", "力学", "速度", "加速度"]):
            return "我可以模拟各种力学现象，包括自由落体、抛物运动、圆周运动、简谐振动等。请告诉我具体的运动条件和参数。"
        elif any(keyword in message for keyword in ["电", "磁", "电路", "电磁"]):
            return "电磁学是物理学的重要分支！我可以可视化电场、磁场、电磁感应、电路原理等概念。你想学习哪方面的电磁现象？"
        elif any(keyword in message for keyword in ["光", "波动", "光学"]):
            return "光学现象非常有趣！我可以演示光的反射、折射、干涉、衍射，或者解释波粒二象性等概念。你想探索哪种光学现象？"
        else:
            return "物理学涵盖了力、热、电、光、原子等各个领域。通过可视化模拟，我可以帮助你理解抽象的物理概念和规律。请告诉我你想学习的具体内容。"

    def _get_chemistry_response(self, message: str) -> str:
        """化学学科响应"""
        if any(keyword in message for keyword in ["分子", "原子", "结构"]):
            return "我可以展示各种分子和原子的3D结构，包括共价键、离子键、分子几何构型等。你想了解哪种化合物的分子结构？"
        elif any(keyword in message for keyword in ["反应", "方程式", "变化"]):
            return "化学反应的动态模拟可以帮助理解反应机理！我可以演示各种化学反应过程，包括氧化还原、酸碱中和、有机反应等。"
        elif any(keyword in message for keyword in ["元素", "周期表", "性质"]):
            return "元素周期表是化学的基础！我可以展示元素的周期性规律、原子结构、电子排布等。你想了解哪个元素或者哪个族的性质？"
        else:
            return "化学研究物质的组成、结构、性质和变化规律。通过分子模型和反应动画，我可以让抽象的化学概念变得直观易懂。"

    def _get_biology_response(self, message: str) -> str:
        """生物学科响应"""
        if any(keyword in message for keyword in ["细胞", "结构", "组织"]):
            return "细胞是生命的基本单位！我可以展示动物细胞、植物细胞的结构，包括细胞膜、细胞核、线粒体等细胞器的功能和分布。"
        elif any(keyword in message for keyword in ["生态", "食物链", "环境"]):
            return "生态系统展示了生物与环境的相互作用！我可以模拟食物链、能量流动、物质循环，或者展示特定生态系统的结构和功能。"
        elif any(keyword in message for keyword in ["遗传", "DNA", "基因"]):
            return "遗传学是理解生命传承的关键！我可以展示DNA双螺旋结构、基因表达、蛋白质合成过程，或者模拟遗传规律。"
        else:
            return "生物学研究生命的各个层次，从分子到生态系统。通过动画和模型，我可以帮助你理解复杂的生命现象和生物学原理。"

    def _get_general_response(self, message: str) -> str:
        """通用响应"""
        return f"""我收到了你的消息："{message}"

我可以为你生成相关学科的可视化内容。为了更好地帮助你，请告诉我：

1. 你感兴趣的学科领域（数学、天文、物理、化学、生物）
2. 你想要的可视化类型（图表、动画、模型等）
3. 具体的参数或要求

例如：
• "画一个正弦函数的图像"
• "展示光合作用的过程"
• "模拟牛顿摆的运动"

请更详细地描述你的需求！"""

    async def _add_subject_guidance(self, response: str, subject: str, original_message: str) -> str:
        """添加学科指导信息"""

        guidance_tips = {
            "mathematics": "\n\n💡 数学提示：你可以指定函数表达式、参数范围、坐标轴设置等具体要求。",
            "astronomy": "\n\n🌌 天文提示：你可以要求展示特定时间、特定视角的天文现象，或者比较不同天体的特征。",
            "physics": "\n⚡ 物理提示：你可以设置初始条件、物理参数，要求公式推导或者实验演示。",
            "chemistry": "\n🧪 化学提示：你可以指定反应条件、分子参数，要求反应机理或者性质分析。",
            "biology": "\n🧬 生物提示：你可以要求展示不同层次的生物学结构，从分子到生态系统。"
        }

        guidance = guidance_tips.get(subject, "")

        # 如果用户消息很简单，添加更多建议
        if len(original_message) < 10:
            guidance += f"\n\n🎯 针对'{subject}'学科，你还可以尝试：\n"
            subject_examples = {
                "mathematics": "• 绘制函数图像\n• 展示几何变换\n• 创建统计图表",
                "astronomy": "• 模拟行星运动\n• 展示星座关系\n• 演示天文现象",
                "physics": "• 模拟力学实验\n• 展示电磁场\n• 演示波动现象",
                "chemistry": "• 展示分子结构\n• 模拟化学反应\n• 分析元素性质",
                "biology": "• 展示细胞结构\n• 模拟生态过程\n• 演示遗传规律"
            }
            guidance += subject_examples.get(subject, "• 探索更多相关内容")

        return response + guidance

    def _should_generate_visualization(self, message: str) -> bool:
        """判断是否应该生成可视化"""

        # 明确要求可视化的关键词
        viz_keywords = [
            "图", "图像", "图表", "可视化", "展示", "演示", "模拟",
            "画", "绘制", "生成", "创建", "显示", "动画",
            "graph", "chart", "plot", "visualization", "diagram"
        ]

        message_lower = message.lower()
        return any(keyword in message_lower for keyword in viz_keywords)

    async def _generate_visualization(
        self,
        message: str,
        subject: str,
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """调用现有路由系统生成可视化"""

        try:
            # 调用现有的路由系统
            result = await self.router.route_request(message, user_preferences)

            if not result.get("success"):
                raise Exception(f"路由系统返回失败: {result.get('error', '未知错误')}")

            # 构建可视化数据
            visualization = {
                "type": result.get("requirement", {}).get("visualization_type", "chart"),
                "title": result.get("template", {}).get("name", "可视化"),
                "subject": subject,
                "html_content": result.get("html_content", ""),
                "config": result.get("config", {}),
                "metadata": {
                    "generation_id": result.get("generation_id"),
                    "template_id": result.get("template", {}).get("id"),
                    "agent_info": result.get("agent_info", {}),
                    "routing_info": result.get("routing_info", {}),
                    "created_at": datetime.now().isoformat()
                }
            }

            return visualization

        except Exception as e:
            # 如果路由系统失败，尝试生成简单的可视化
            return await self._generate_fallback_visualization(message, subject)

    async def _generate_fallback_visualization(self, message: str, subject: str) -> Dict[str, Any]:
        """生成备用可视化"""

        # 简单的HTML可视化模板
        fallback_html = f"""
        <div class="visualization-container" style="padding: 20px; text-align: center;">
            <h3>📊 {subject}学科可视化</h3>
            <div class="visualization-content" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 40px; border-radius: 10px; margin: 20px 0;">
                <h4>主题：{message}</h4>
                <p>这是一个{subject}学科的示例可视化</p>
                <div style="font-size: 48px; margin: 20px 0;">
                    {self._get_subject_emoji(subject)}
                </div>
                <p>系统正在为你的请求生成详细的可视化内容...</p>
            </div>
            <div class="visualization-info" style="text-align: left; margin-top: 20px;">
                <h4>相关信息：</h4>
                <ul>
                    <li>学科领域：{subject}</li>
                    <li>查询内容：{message}</li>
                    <li>生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
                </ul>
            </div>
        </div>
        """

        return {
            "type": "fallback",
            "title": f"{subject}可视化示例",
            "subject": subject,
            "html_content": fallback_html,
            "config": {"simple": True},
            "metadata": {
                "fallback": True,
                "created_at": datetime.now().isoformat()
            }
        }

    def _get_subject_emoji(self, subject: str) -> str:
        """获取学科表情符号"""
        emojis = {
            "mathematics": "📐",
            "astronomy": "🌟",
            "physics": "⚛️",
            "chemistry": "🧪",
            "biology": "🧬"
        }
        return emojis.get(subject, "📊")

    async def get_quick_actions(self) -> Dict[str, Any]:
        """获取快速操作列表，基于现有模板系统"""
        try:
            # 从模板引擎获取模板
            templates = await self.template_engine.get_all_templates()

            # 按学科分组快速操作
            quick_actions = {
                "mathematics": [
                    {
                        "id": "math_function",
                        "title": "数学函数图像",
                        "description": "绘制各种数学函数的图像",
                        "template": "画出函数 y = x² 的图像"
                    },
                    {
                        "id": "math_geometry",
                        "title": "几何图形展示",
                        "description": "展示几何图形和变换",
                        "template": "展示一个正三角形的三维旋转"
                    }
                ],
                "astronomy": [
                    {
                        "id": "astro_solar",
                        "title": "太阳系模型",
                        "description": "展示太阳系行星运动",
                        "template": "展示太阳系八大行星的运行轨道"
                    },
                    {
                        "id": "astro_orbit",
                        "title": "天体轨道模拟",
                        "description": "模拟天体运动规律",
                        "template": "模拟地球绕太阳的椭圆轨道运动"
                    }
                ],
                "physics": [
                    {
                        "id": "phys_mechanics",
                        "title": "力学模拟",
                        "description": "模拟经典力学现象",
                        "template": "模拟牛顿摆的运动过程"
                    },
                    {
                        "id": "phys_waves",
                        "title": "波动现象",
                        "description": "展示波的传播和干涉",
                        "template": "展示水波的干涉现象"
                    }
                ],
                "chemistry": [
                    {
                        "id": "chem_molecule",
                        "title": "分子结构",
                        "description": "展示化学分子结构",
                        "template": "展示水分子的三维结构"
                    },
                    {
                        "id": "chem_reaction",
                        "title": "化学反应",
                        "description": "模拟化学反应过程",
                        "template": "演示氢气和氧气反应生成水的过程"
                    }
                ],
                "biology": [
                    {
                        "id": "bio_cell",
                        "title": "细胞结构",
                        "description": "展示生物细胞结构",
                        "template": "展示动物细胞的主要结构"
                    },
                    {
                        "id": "bio_dna",
                        "title": "DNA结构",
                        "description": "展示DNA双螺旋结构",
                        "template": "展示DNA分子的双螺旋结构"
                    }
                ]
            }

            return {
                "actions": quick_actions,
                "total_templates": len(templates),
                "subjects": list(quick_actions.keys())
            }

        except Exception as e:
            # 如果模板系统不可用，返回默认快速操作
            return {
                "actions": {
                    "general": [
                        {
                            "id": "general_chart",
                            "title": "创建图表",
                            "description": "生成数据可视化图表",
                            "template": "创建一个柱状图显示数据"
                        }
                    ]
                },
                "total_templates": 0,
                "subjects": ["general"]
            }