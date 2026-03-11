"""
反向知识树 (Reverse Knowledge Tree) - Math2Manim 的核心创新

递归分解概念的前置知识，从基础向上构建完整的理解路径。
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field


@dataclass
class KnowledgeNode:
    """知识节点 - 表示知识树中的一个概念"""

    concept: str
    """概念名称"""

    prerequisites: List['KnowledgeNode'] = field(default_factory=list)
    """前置知识节点列表"""

    is_foundation: bool = False
    """是否为基础概念（高中水平）"""

    depth: int = 0
    """在知识树中的深度"""

    metadata: Dict[str, Any] = field(default_factory=dict)
    """额外的元数据（如公式、关键词等）"""

    def add_prerequisite(self, prereq: 'KnowledgeNode'):
        """添加前置知识"""
        self.prerequisites.append(prereq)

    def get_all_prerequisites(self) -> List['KnowledgeNode']:
        """递归获取所有前置知识（深度优先）"""
        result = []
        for prereq in self.prerequisites:
            result.extend(prereq.get_all_prerequisites())
            result.append(prereq)
        return result

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "concept": self.concept,
            "is_basic": self.is_foundation,  # 前端使用 is_basic
            "is_foundation": self.is_foundation,  # 保留兼容性
            "depth": self.depth,
            "children": [p.to_dict() for p in self.prerequisites],  # 前端使用 children
            "prerequisites": [p.to_dict() for p in self.prerequisites],  # 保留兼容性
            "metadata": self.metadata
        }

    def __repr__(self) -> str:
        prereq_str = f", {len(self.prerequisites)} prereqs" if self.prerequisites else ""
        foundation_str = " [FOUNDATION]" if self.is_foundation else ""
        return f"KnowledgeNode({self.concept}{prereq_str}{foundation_str})"


class KnowledgeTree:
    """
    反向知识树 - 递归分解概念的前置知识

    核心算法：
    1. 从目标概念开始
    2. 递归询问："理解 X 需要先理解什么？"
    3. 直到达到基础概念（高中水平）
    4. 从基础向上构建动画
    """

    # 基础概念列表（高中水平）
    FOUNDATION_CONCEPTS = {
        # 数学基础
        "整数", "分数", "小数", "有理数", "实数",
        "加法", "减法", "乘法", "除法",
        "代数", "方程", "不等式",
        "函数", "图像", "坐标系",
        "三角形", "圆", "正方形", "矩形",
        "角度", "弧度",

        # 物理基础
        "速度", "加速度", "力", "质量",
        "能量", "功", "动量",
        "位移", "时间", "距离",
    }

    def __init__(self, llm_client: Optional[Any] = None, max_depth: int = 5):
        """
        初始化知识树

        Args:
            llm_client: LLM 客户端（Claude/GPT/Gemini）
            max_depth: 最大递归深度
        """
        self.llm_client = llm_client
        self.max_depth = max_depth
        self.root: Optional[KnowledgeNode] = None

    def is_foundation_concept(self, concept: str) -> bool:
        """判断是否为基础概念"""
        concept_lower = concept.lower().strip()
        return any(
            foundation.lower() in concept_lower
            for foundation in self.FOUNDATION_CONCEPTS
        )

    def build_tree(self, target_concept: str) -> KnowledgeNode:
        """
        构建反向知识树

        Args:
            target_concept: 目标概念

        Returns:
            知识树的根节点
        """
        self.root = self._explore_prerequisites(target_concept, depth=0)
        return self.root

    def _explore_prerequisites(
        self,
        concept: str,
        depth: int = 0
    ) -> KnowledgeNode:
        """
        递归探索前置知识

        核心问题："理解 {concept} 需要先理解什么？"
        """
        # 创建当前节点
        node = KnowledgeNode(
            concept=concept,
            depth=depth,
            is_foundation=self.is_foundation_concept(concept)
        )

        # 基础情况：达到基础概念或最大深度
        if node.is_foundation or depth >= self.max_depth:
            return node

        # 递归情况：获取前置知识
        prerequisites = self._get_prerequisites(concept)

        # 对每个前置知识递归构建
        for prereq_name in prerequisites:
            prereq_node = self._explore_prerequisites(prereq_name, depth + 1)
            node.add_prerequisite(prereq_node)

        return node

    def _get_prerequisites(self, concept: str) -> List[str]:
        """
        获取概念的前置知识列表

        如果有 LLM 客户端，使用 AI 生成；否则使用内置规则
        """
        if self.llm_client:
            return self._get_prerequisites_from_llm(concept)
        else:
            return self._get_prerequisites_from_rules(concept)

    def _get_prerequisites_from_llm(self, concept: str) -> List[str]:
        """使用 LLM 获取前置知识"""
        prompt = f"""
理解"{concept}"这个概念，需要先理解哪 3-5 个前置概念？

要求：
1. 只列出最核心的前置概念
2. 按重要性排序
3. 每个概念用简短的名称表示
4. 返回 JSON 格式：["概念1", "概念2", "概念3"]
"""
        # 这里需要调用实际的 LLM API
        # response = self.llm_client.generate(prompt)
        # return parse_json(response)

        # 临时返回空列表（需要实际实现）
        return []

    def _get_prerequisites_from_rules(self, concept: str) -> List[str]:
        """使用内置规则获取前置知识"""
        # 简单的规则映射
        rules = {
            "勾股定理": ["三角形", "正方形", "面积"],
            "正弦函数": ["三角形", "角度", "比例"],
            "导数": ["函数", "极限", "变化率"],
            "积分": ["函数", "面积", "累加"],
            "牛顿第二定律": ["力", "质量", "加速度"],
            "偏导数": ["导数", "多元函数", "极限"],
            "梯度": ["偏导数", "向量", "方向导数"],
            "二重积分": ["积分", "多元函数", "面积"],
            "微分方程": ["导数", "积分", "函数"],
            "泰勒级数": ["导数", "级数", "多项式"],
            "拉格朗日乘数法": ["偏导数", "极值", "约束条件"],
            "行列式": ["矩阵", "线性方程组"],
            "特征值": ["矩阵", "线性变换", "向量"],
            "傅里叶变换": ["积分", "三角函数", "周期函数"],
            "概率分布": ["概率", "随机变量", "积分"],
            "极限": ["函数", "数列", "无穷"],
            "连续性": ["极限", "函数"],
            "向量": ["坐标", "方向", "长度"],
            "矩阵": ["向量", "线性方程组"],
        }

        return rules.get(concept, [])

    def get_learning_path(self) -> List[str]:
        """
        获取学习路径（从基础到目标）

        Returns:
            概念列表，按学习顺序排列
        """
        if not self.root:
            return []

        # 深度优先遍历，收集所有节点
        all_nodes = self.root.get_all_prerequisites()
        all_nodes.append(self.root)

        # 按深度排序（从深到浅 = 从基础到高级）
        all_nodes.sort(key=lambda n: n.depth, reverse=True)

        return [node.concept for node in all_nodes]

    def visualize(self) -> str:
        """可视化知识树（文本格式）"""
        if not self.root:
            return "Empty tree"

        return self._visualize_node(self.root, prefix="", is_last=True)

    def _visualize_node(
        self,
        node: KnowledgeNode,
        prefix: str = "",
        is_last: bool = True
    ) -> str:
        """递归可视化节点"""
        # 当前节点
        connector = "└── " if is_last else "├── "
        foundation_mark = " ⭐" if node.is_foundation else ""
        result = f"{prefix}{connector}{node.concept}{foundation_mark}\n"

        # 子节点
        if node.prerequisites:
            extension = "    " if is_last else "│   "
            for i, prereq in enumerate(node.prerequisites):
                is_last_child = (i == len(node.prerequisites) - 1)
                result += self._visualize_node(
                    prereq,
                    prefix + extension,
                    is_last_child
                )

        return result
