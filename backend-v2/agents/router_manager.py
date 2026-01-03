"""
万物可视化 v2.0 - 智能路由管理器
方案A核心组件：负责将用户请求智能路由到合适的学科Agent
"""

from typing import Dict, List, Optional, Any
import asyncio
import re
from datetime import datetime

from .mathematics_agent import MathematicsAgent
from .astronomy_agent import AstronomyAgent
from .physics_agent import PhysicsAgent
from .chemistry_agent import ChemistryAgent
from .biology_agent import BiologyAgent
from .physics_agent import PhysicsAgent
from .chemistry_agent import ChemistryAgent
from .biology_agent import BiologyAgent
from .general_agent import GeneralVisualizationAgent
class SubjectClassifier:
    """智能学科分类器"""

    def __init__(self):
        self.subject_keywords = {
            "mathematics": [
                # 数学基础词汇
                "数学", "概率", "统计", "分布", "函数", "方程", "几何", "代数", "微积分",
                # 概率统计词汇
                "正态分布", "高斯分布", "二项分布", "泊松分布", "均匀分布", "指数分布", "卡方分布", "t分布",
                "均值", "方差", "标准差", "期望", "概率密度", "随机变量", "假设检验",
                # 线性代数词汇
                "矩阵", "向量", "行列式", "线性变换", "特征值", "特征向量", "正交", "投影",
                "二阶行列式", "三阶行列式", "向量空间", "旋转矩阵", "正交分解", "高斯消元法",
                # 微积分词汇
                "导数", "积分", "极限", "微分", "函数图像", "切线", "极值", "最值", "拐点",
                # 几何词汇
                "三角形", "圆形", "多边形", "角度", "平行", "垂直", "对称", "旋转", "平移",
                # 代数词汇
                "多项式", "因式分解", "方程组", "不等式", "根", "系数", "变量"
            ],
            "astronomy": [
                # 天体对象
                "天文", "行星", "恒星", "星系", "卫星", "太阳", "月亮", "地球", "火星", "木星", "土星",
                "水星", "金星", "天王星", "海王星", "小行星", "彗星", "流星",
                # 天文现象
                "轨道", "公转", "自转", "月相", "日月食", "日食", "月食", "季节", "潮汐", "逆行",
                "合相", "冲日", "凌日", "掩星",
                # 天球概念
                "星座", "天球", "赤道", "黄道", "春分点", "秋分点", "夏至点", "冬至点",
                "赤经", "赤纬", "高度角", "方位角", "天顶", "天底",
                # 天文术语
                "光年", "天文单位", "视星等", "绝对星等", "光谱", "红移", "宇宙大爆炸", "黑洞"
            ],
            "physics": [
                # 力学
                "物理", "力学", "运动", "速度", "加速度", "力", "质量", "动量", "能量", "功",
                "功率", "牛顿", "重力", "摩擦力", "弹力", "张力", "向心力", "离心力",
                # 运动学
                "抛体运动", "圆周运动", "简谐振动", "振动", "波动", "频率", "周期", "振幅", "波长",
                "波速", "驻波", "共振", "多普勒效应",
                # 热学
                "热", "温度", "热量", "热力学", "熵", "理想气体", "压强", "体积", "内能",
                "热传导", "对流", "辐射", "比热容", "熔点", "沸点",
                # 电磁学
                "电磁", "电场", "磁场", "电流", "电压", "电阻", "电容", "电感", "电荷",
                "库仑定律", "安培定律", "法拉第定律", "欧姆定律", "电磁感应", "电磁波",
                # 光学
                "光", "光学", "折射", "反射", "透镜", "凸透镜", "凹透镜", "焦点", "焦距",
                "干涉", "衍射", "偏振", "色散", "光谱", "激光",
                # 现代物理
                "量子", "相对论", "原子", "电子", "质子", "中子", "光子", "放射性",
                "核反应", "裂变", "聚变", "半衰期", "同位素"
            ],
            "chemistry": [
                # 基础概念
                "化学", "分子", "原子", "元素", "化合物", "化学键", "离子", "分子式",
                "化学反应", "氧化", "还原", "酸", "碱", "盐", "pH值",
                # 有机化学
                "有机化学", "烃", "醇", "酚", "醛", "酮", "酸", "酯", "胺", "聚合物",
                "苯", "烷烃", "烯烃", "炔烃", "芳香烃",
                # 无机化学
                "无机化学", "金属", "非金属", "卤素", "稀有气体", "过渡金属",
                "配合物", "配位化学", "晶体结构",
                # 物理化学
                "化学平衡", "反应速率", "活化能", "焓", "熵", "吉布斯自由能",
                "电化学", "电池", "电解", "腐蚀"
            ],
            "biology": [
                # 基础概念
                "生物", "生命", "细胞", "DNA", "RNA", "基因", "蛋白质", "酶",
                "新陈代谢", "呼吸作用", "光合作用", "细胞分裂",
                # 遗传学
                "遗传", "变异", "基因突变", "染色体", "孟德尔定律", "遗传密码",
                "DNA复制", "转录", "翻译", "基因表达",
                # 生态学
                "生态", "生态系统", "食物链", "食物网", "种群", "群落",
                "生物多样性", "环境保护", "可持续发展",
                # 进化论
                "进化", "自然选择", "适者生存", "物种起源", "化石", "系统发育",
                "共同祖先", "适应性", "灭绝"
            ]
        }

        # 学科权重配置
        self.subject_weights = {
            "mathematics": {
                "high_priority": ["正态分布", "矩阵", "导数", "概率", "统计"],
                "medium_priority": ["函数", "方程", "几何", "代数"]
            },
            "astronomy": {
                "high_priority": ["行星", "轨道", "太阳系", "星座", "日月食"],
                "medium_priority": ["恒星", "星系", "天文", "宇宙"]
            },
            "physics": {
                "high_priority": ["力学", "电磁", "波动", "量子", "相对论"],
                "medium_priority": ["运动", "能量", "力", "热学", "光学"]
            },
            "chemistry": {
                "high_priority": ["分子", "原子", "化学反应", "元素", "化学键"],
                "medium_priority": ["化合物", "有机化学", "酸碱", "氧化还原"]
            },
            "biology": {
                "high_priority": ["细胞", "DNA", "基因", "蛋白质", "光合作用"],
                "medium_priority": ["生物", "遗传", "生态", "进化", "新陈代谢"]
            }
        }

    async def classify(self, prompt: str) -> str:
        """
        分类输入文本到对应学科

        Args:
            prompt: 用户输入的文本

        Returns:
            str: 分类结果 (mathematics, astronomy, physics, chemistry, biology, general)
        """
        try:
            prompt_lower = prompt.lower()
            scores = {}
            detailed_scores = {}

            # 计算每个学科的得分
            for subject, keywords in self.subject_keywords.items():
                score = 0
                matched_keywords = []

                # 基础关键词匹配
                for keyword in keywords:
                    if keyword.lower() in prompt_lower:
                        # 高优先级词汇权重更高
                        if subject in self.subject_weights:
                            if keyword in self.subject_weights[subject]["high_priority"]:
                                score += 3
                            elif keyword in self.subject_weights[subject]["medium_priority"]:
                                score += 2
                            else:
                                score += 1
                        else:
                            score += 1
                        matched_keywords.append(keyword)

                scores[subject] = score
                detailed_scores[subject] = {
                    "score": score,
                    "matched_keywords": matched_keywords
                }

            # 找出得分最高的学科
            if max(scores.values()) == 0:
                return "general"

            best_subject = max(scores.items(), key=lambda x: x[1])

            # 如果最高分太低，返回general
            if best_subject[1] < 1:
                return "general"

            # 记录分类详细信息（用于调试）
            self._log_classification(prompt, detailed_scores)

            return best_subject[0]

        except Exception as e:
            print(f"学科分类错误: {str(e)}")
            return "general"

    def _log_classification(self, prompt: str, scores: Dict[str, Dict]):
        """记录分类详情用于调试"""
        print(f"\n=== 学科分类分析 ===")
        print(f"输入: {prompt[:50]}...")
        print("得分详情:")
        for subject, details in scores.items():
            if details["score"] > 0:
                print(f"  {subject}: {details['score']}分")
                print(f"    匹配关键词: {', '.join(details['matched_keywords'])}")
        print("==================\n")

class VisualizationRouter:
    """可视化路由管理器 - 方案A核心"""

    def __init__(self):
        """初始化路由管理器"""
        # 初始化所有学科Agent
        self.agents = {
            "mathematics": MathematicsAgent(),
            "astronomy": AstronomyAgent(),
            "physics": PhysicsAgent(),
            "chemistry": ChemistryAgent(),
            "biology": BiologyAgent(),
            "general": GeneralVisualizationAgent()
        }

        # 初始化学科分类器
        self.subject_classifier = SubjectClassifier()

        # 路由统计
        self.routing_stats = {
            "total_requests": 0,
            "subject_counts": {subject: 0 for subject in self.agents.keys()},
            "fallback_count": 0
        }

        print("🤖 智能路由管理器初始化完成")
        print(f"📋 已加载学科Agent: {list(self.agents.keys())}")

    def set_template_engine(self, template_engine):
        """为所有Agent设置模板引擎"""
        for agent in self.agents.values():
            agent.template_engine = template_engine
        print("🎨 模板引擎已注入所有学科Agent")

    async def route_request(self, prompt: str, user_preferences: Dict = None) -> Dict[str, Any]:
        """
        智能路由请求到合适的Agent - 方案A核心功能

        Args:
            prompt: 用户输入的自然语言描述
            user_preferences: 用户偏好设置

        Returns:
            Dict: 包含学科、模板、配置、HTML内容的完整响应
        """
        try:
            # 更新统计
            self.routing_stats["total_requests"] += 1

            print(f"🎯 开始路由请求: {prompt[:100]}...")

            # 1. 识别学科
            subject = await self.subject_classifier.classify(prompt)
            print(f"📚 识别学科: {subject}")

            # 2. 获取对应Agent
            agent = self.agents.get(subject)
            if not agent:
                print(f"⚠️  学科 {subject} 暂不支持，使用通用Agent (GeneralVisualizationAgent) 进行动态生成")
                agent = self.agents["general"]
                # 保持subject名称以便后续逻辑处理，或者也可以改为"general"
                # subject = "general" 
                self.routing_stats["fallback_count"] += 1

            # 更新学科计数
            self.routing_stats["subject_counts"][subject] += 1

            # 3. 解析需求
            print(f"🔍 开始解析 {subject} 学科需求...")
            requirement = await agent.parse_requirement(prompt)
            print(f"✅ 需求解析完成: {requirement.get('concept_type', '未知概念')}")

            # 4. 匹配模板
            print(f"🎨 开始匹配 {subject} 学科模板...")
            template = await agent.match_template(requirement)
            if not template:
                print(f"⚠️  未找到匹配模板，尝试使用通用Agent进行动态生成")
                # 如果特定学科Agent无法匹配模板，并且不是general agent，则转交给general agent
                if subject != "general" and "general" in self.agents:
                    agent = self.agents["general"]
                    print(f"🔄 切换至 GeneralAgent 处理: {prompt[:30]}...")
                    # 重新解析需求（通用Agent通过解析获取原始prompt）
                    requirement = await agent.parse_requirement(prompt)
                    template = await agent.match_template(requirement)
                else:
                    template = {"id": "default", "name": "默认模板"}

            print(f"✅ 模板匹配完成: {template.get('name', '未知模板')}")

            # 5. 生成配置
            print(f"⚙️  开始生成可视化配置...")
            config = await agent.generate_config(requirement, template, user_preferences or {})
            print(f"✅ 配置生成完成")

            # 6. 生成可视化
            print(f"🖼️  开始生成可视化HTML...")
            html_content = await agent.generate_visualization(config)
            print(f"✅ HTML生成完成，长度: {len(html_content)} 字符")

            # 7. 构建响应
            response = {
                "success": True,
                "subject": subject,
                "requirement": requirement,
                "template": template,
                "config": config,
                "html_content": html_content,
                "agent_info": agent.get_agent_info(),
                "routing_info": {
                    "timestamp": datetime.now().isoformat(),
                    "processing_time": "模拟处理时间",
                    "confidence": 0.85  # 模拟置信度
                }
            }

            print(f"🎉 路由请求完成: {subject} 学科")
            return response

        except Exception as e:
            error_msg = f"路由处理失败: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "subject": subject,
                "requirement": requirement if 'requirement' in locals() else None,
                "routing_info": {
                    "timestamp": datetime.now().isoformat(),
                    "failed": True
                }
            }

    async def direct_subject_route(self, subject: str, prompt: str, user_preferences: Dict = None) -> Dict[str, Any]:
        """
        直接路由到指定学科

        Args:
            subject: 指定学科
            prompt: 用户输入
            user_preferences: 用户偏好

        Returns:
            Dict: 路由响应
        """
        try:
            if subject not in self.agents:
                raise ValueError(f"不支持的学科: {subject}")

            agent = self.agents[subject]

            # 直接使用指定学科处理
            requirement = await agent.parse_requirement(prompt)
            template = await agent.match_template(requirement)
            config = await agent.generate_config(requirement, template, user_preferences or {})
            html_content = await agent.generate_visualization(config)

            return {
                "success": True,
                "subject": subject,
                "requirement": requirement,
                "template": template,
                "config": config,
                "html_content": html_content,
                "agent_info": agent.get_agent_info(),
                "direct_routing": True
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "subject": subject,
                "direct_routing": True
            }

    def get_supported_subjects(self) -> List[str]:
        """获取支持的学科列表"""
        return list(self.agents.keys())

    def get_subject_info(self, subject: str) -> Dict[str, Any]:
        """获取指定学科的信息"""
        if subject not in self.agents:
            return {"error": f"学科 {subject} 不存在"}

        agent = self.agents[subject]
        return {
            "subject": subject,
            "agent_id": agent.agent_id,
            "supported_topics": agent.get_supported_topics(),
            "config": agent.config,
            "template_count": len(agent.templates)
        }

    def get_routing_stats(self) -> Dict[str, Any]:
        """获取路由统计信息"""
        return {
            "total_requests": self.routing_stats["total_requests"],
            "subject_distribution": self.routing_stats["subject_counts"],
            "fallback_rate": (
                self.routing_stats["fallback_count"] / max(1, self.routing_stats["total_requests"])
            ) * 100,
            "supported_subjects": list(self.agents.keys()),
            "timestamp": datetime.now().isoformat()
        }

    async def test_routing(self, test_cases: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        测试路由功能

        Args:
            test_cases: 测试用例列表 [{"prompt": "...", "expected_subject": "..."}]

        Returns:
            Dict: 测试结果
        """
        results = []
        correct_count = 0

        for case in test_cases:
            prompt = case["prompt"]
            expected = case.get("expected_subject")

            predicted = await self.subject_classifier.classify(prompt)

            result = {
                "prompt": prompt,
                "expected": expected,
                "predicted": predicted,
                "correct": expected == predicted if expected else "unknown"
            }

            if result["correct"] is True:
                correct_count += 1

            results.append(result)

        accuracy = (correct_count / len([r for r in results if r["expected"]])) * 100 if results else 0

        return {
            "test_cases": len(test_cases),
            "correct_predictions": correct_count,
            "accuracy": accuracy,
            "results": results
        }