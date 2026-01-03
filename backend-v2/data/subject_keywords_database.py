"""
万物可视化 v2.0 - 学科关键词数据库
用于智能识别文档页面内容所属学科，并匹配相应的可视化模板
"""

from typing import Dict, List, Tuple, Set, Optional
import re
import json
from dataclasses import dataclass
from enum import Enum

class SubjectType(Enum):
    """学科类型枚举"""
    MATHEMATICS = "mathematics"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"
    ASTRONOMY = "astronomy"
    COMPUTER_SCIENCE = "computer_science"
    ENGINEERING = "engineering"
    ECONOMICS = "economics"
    GEOGRAPHY = "geography"
    HISTORY = "history"
    LITERATURE = "literature"
    PHILOSOPHY = "philosophy"
    PSYCHOLOGY = "psychology"
    SOCIOLOGY = "sociology"
    GENERAL = "general"

@dataclass
class SubjectKeyword:
    """学科关键词"""
    keyword: str
    weight: float  # 权重，用于计算匹配度
    category: str  # 子分类，如"微积分"、"线性代数"等
    synonyms: List[str]  # 同义词列表
    regex_pattern: Optional[str] = None  # 正则表达式模式（可选）

@dataclass
class SubjectProfile:
    """学科配置文件"""
    subject: SubjectType
    name: str
    name_cn: str
    keywords: List[SubjectKeyword]
    associated_templates: List[str]  # 关联的可视化模板
    confidence_threshold: float = 0.3  # 置信度阈值
    priority: int = 1  # 优先级，数字越大优先级越高

class SubjectKeywordDatabase:
    """学科关键词数据库"""

    def __init__(self):
        self.subjects: Dict[SubjectType, SubjectProfile] = {}
        self._initialize_database()

    def _initialize_database(self):
        """初始化学科关键词数据库"""

        # 数学学科配置
        math_keywords = [
            SubjectKeyword("微分几何", 0.9, "几何学", ["differential geometry", "黎曼几何", "流形"], r"(微分|黎曼)*几何"),
            SubjectKeyword("积分", 0.8, "微积分", ["integral", "integration", "定积分", "不定积分"]),
            SubjectKeyword("导数", 0.8, "微积分", ["derivative", "微分", "求导", "偏导数"]),
            SubjectKeyword("极限", 0.8, "微积分", ["limit", "极限值", "收敛", "发散"]),
            SubjectKeyword("矩阵", 0.9, "线性代数", ["matrix", "行列式", "determinant", "逆矩阵"]),
            SubjectKeyword("向量", 0.9, "线性代数", ["vector", "矢量", "点积", "叉积", "内积"]),
            SubjectKeyword("特征值", 0.9, "线性代数", ["eigenvalue", "特征向量", "eigenvector"]),
            SubjectKeyword("概率", 0.8, "概率统计", ["probability", "随机", "分布", "期望"]),
            SubjectKeyword("统计", 0.8, "概率统计", ["statistics", "方差", "标准差", "回归"]),
            SubjectKeyword("正态分布", 0.9, "概率统计", ["normal distribution", "高斯分布", "钟形曲线"]),
            SubjectKeyword("泊松分布", 0.9, "概率统计", ["poisson distribution"]),
            SubjectKeyword("方程", 0.7, "代数学", ["equation", "多项式", "根", "求解"]),
            SubjectKeyword("函数", 0.7, "分析学", ["function", "映射", "定义域", "值域"]),
            SubjectKeyword("级数", 0.8, "分析学", ["series", "泰勒级数", "傅里叶级数"]),
            SubjectKeyword("群", 0.9, "抽象代数", ["group", "环", "域", "代数结构"]),
            SubjectKeyword("拓扑", 0.9, "拓扑学", ["topology", "连通性", "紧致性", "连续映射"]),
        ]

        # 物理学科配置
        physics_keywords = [
            SubjectKeyword("力学", 0.9, "经典力学", ["mechanics", "牛顿", "力", "加速度", "动量"]),
            SubjectKeyword("电磁学", 0.9, "电磁学", ["electromagnetism", "电场", "磁场", "麦克斯韦"]),
            SubjectKeyword("量子力学", 0.9, "量子物理", ["quantum", "薛定谔", "波函数", "纠缠"]),
            SubjectKeyword("相对论", 0.9, "相对论", ["relativity", "爱因斯坦", "时空", "引力"]),
            SubjectKeyword("热力学", 0.9, "热物理", ["thermodynamics", "熵", "温度", "热力学定律"]),
            SubjectKeyword("光学", 0.8, "光学", ["optics", "光的折射", "反射", "干涉", "衍射"]),
            SubjectKeyword("声学", 0.8, "声学", ["acoustics", "声波", "频率", "振动"]),
            SubjectKeyword("核物理", 0.9, "核物理", ["nuclear", "原子核", "放射性", "衰变"]),
            SubjectKeyword("粒子物理", 0.9, "粒子物理", ["particle", "质子", "中子", "夸克", "轻子"]),
            SubjectKeyword("等离子体", 0.8, "等离子体物理", ["plasma", "等离子体", "电离气体"]),
        ]

        # 化学学科配置
        chemistry_keywords = [
            SubjectKeyword("分子", 0.9, "分子化学", ["molecule", "分子结构", "化学键", "共价键"]),
            SubjectKeyword("原子", 0.9, "原子化学", ["atom", "原子结构", "电子", "质子", "中子"]),
            SubjectKeyword("化学反应", 0.9, "反应化学", ["reaction", "催化", "反应速率", "平衡"]),
            SubjectKeyword("元素周期表", 0.9, "无机化学", ["periodic table", "元素", "原子序数"]),
            SubjectKeyword("有机化学", 0.9, "有机化学", ["organic", "碳化合物", "烃类", "官能团"]),
            SubjectKeyword("酸碱", 0.8, "酸碱化学", ["acid", "base", "pH", "中和反应"]),
            SubjectKeyword("氧化还原", 0.9, "氧化还原", ["oxidation", "reduction", "电子转移"]),
            SubjectKeyword("溶液", 0.8, "溶液化学", ["solution", "溶解度", "浓度", "摩尔"]),
            SubjectKeyword("高分子", 0.8, "高分子化学", ["polymer", "塑料", "橡胶", "纤维"]),
            SubjectKeyword("生物化学", 0.9, "生物化学", ["biochemistry", "酶", "蛋白质", "DNA", "RNA"]),
        ]

        # 生物学科配置
        biology_keywords = [
            SubjectKeyword("细胞", 0.9, "细胞生物学", ["cell", "细胞膜", "细胞核", "线粒体"]),
            SubjectKeyword("DNA", 0.9, "遗传学", ["DNA", "基因", "遗传", "染色体", "RNA"]),
            SubjectKeyword("蛋白质", 0.9, "生物化学", ["protein", "氨基酸", "肽键", "折叠"]),
            SubjectKeyword("进化", 0.9, "进化生物学", ["evolution", "自然选择", "达尔文", "物种"]),
            SubjectKeyword("生态系统", 0.9, "生态学", ["ecosystem", "食物链", "生态平衡", "生物多样性"]),
            SubjectKeyword("光合作用", 0.9, "植物生物学", ["photosynthesis", "叶绿体", "光反应"]),
            SubjectKeyword("呼吸作用", 0.9, "生理学", ["respiration", "有氧呼吸", "无氧呼吸"]),
            SubjectKeyword("免疫系统", 0.9, "免疫学", ["immune", "抗体", "疫苗", "淋巴细胞"]),
            SubjectKeyword("神经系统", 0.9, "神经生物学", ["nervous", "神经元", "突触", "大脑"]),
            SubjectKeyword("激素", 0.8, "内分泌学", ["hormone", "内分泌", "调节", "腺体"]),
        ]

        # 天文学科配置
        astronomy_keywords = [
            SubjectKeyword("恒星", 0.9, "恒星天文学", ["star", "太阳", "主序星", "红巨星", "白矮星"]),
            SubjectKeyword("行星", 0.9, "行星科学", ["planet", "太阳系", "地球", "火星", "木星"]),
            SubjectKeyword("星系", 0.9, "星系天文学", ["galaxy", "银河系", "仙女座", "椭圆星系"]),
            SubjectKeyword("黑洞", 0.9, "相对论天体物理", ["black hole", "事件视界", "奇点", "引力坍缩"]),
            SubjectKeyword("宇宙学", 0.9, "宇宙学", ["cosmology", "大爆炸", "宇宙膨胀", "暗物质", "暗能量"]),
            SubjectKeyword("天文观测", 0.8, "观测天文学", ["telescope", "光谱", "红移", "视差"]),
            SubjectKeyword("彗星", 0.8, "太阳系小天体", ["comet", "小行星", "流星", "陨石"]),
            SubjectKeyword("星云", 0.8, "星际介质", ["nebula", "分子云", "恒星形成", "发射星云"]),
        ]

        # 计算机科学配置
        cs_keywords = [
            SubjectKeyword("算法", 0.9, "算法与复杂性", ["algorithm", "时间复杂度", "空间复杂度", "排序"]),
            SubjectKeyword("数据结构", 0.9, "数据结构", ["data structure", "链表", "树", "图", "栈", "队列"]),
            SubjectKeyword("机器学习", 0.9, "人工智能", ["machine learning", "神经网络", "深度学习", "训练"]),
            SubjectKeyword("编程", 0.8, "编程语言", ["programming", "代码", "函数", "变量", "循环"]),
            SubjectKeyword("数据库", 0.9, "数据库系统", ["database", "SQL", "查询", "索引", "事务"]),
            SubjectKeyword("网络", 0.8, "计算机网络", ["network", "协议", "TCP/IP", "HTTP", "路由器"]),
            SubjectKeyword("操作系统", 0.9, "操作系统", ["operating system", "进程", "内存管理", "文件系统"]),
            SubjectKeyword("软件工程", 0.8, "软件工程", ["software engineering", "开发", "测试", "维护"]),
        ]

        # 创建学科配置文件
        self.subjects[SubjectType.MATHEMATICS] = SubjectProfile(
            SubjectType.MATHEMATICS, "Mathematics", "数学", math_keywords,
            ["normal_distribution", "poisson_distribution", "vector_projection", "mathematics_default"],
            confidence_threshold=0.3, priority=3
        )

        self.subjects[SubjectType.PHYSICS] = SubjectProfile(
            SubjectType.PHYSICS, "Physics", "物理学", physics_keywords,
            ["projectile_motion", "physics_default"],
            confidence_threshold=0.3, priority=3
        )

        self.subjects[SubjectType.CHEMISTRY] = SubjectProfile(
            SubjectType.CHEMISTRY, "Chemistry", "化学", chemistry_keywords,
            ["molecule_structure", "chemical_reaction"],
            confidence_threshold=0.3, priority=3
        )

        self.subjects[SubjectType.BIOLOGY] = SubjectProfile(
            SubjectType.BIOLOGY, "Biology", "生物学", biology_keywords,
            ["dna_structure", "cell_structure"],
            confidence_threshold=0.3, priority=3
        )

        self.subjects[SubjectType.ASTRONOMY] = SubjectProfile(
            SubjectType.ASTRONOMY, "Astronomy", "天文学", astronomy_keywords,
            ["solar_system", "astronomy_default"],
            confidence_threshold=0.3, priority=3
        )

        self.subjects[SubjectType.COMPUTER_SCIENCE] = SubjectProfile(
            SubjectType.COMPUTER_SCIENCE, "Computer Science", "计算机科学", cs_keywords,
            ["computer_science_default"],
            confidence_threshold=0.3, priority=2
        )

    def identify_subject(self, text: str, min_confidence: float = 0.1) -> List[Tuple[SubjectType, float, List[str]]]:
        """
        识别文本所属学科

        Args:
            text: 待分析的文本
            min_confidence: 最小置信度阈值

        Returns:
            List[Tuple[SubjectType, float, List[str]]]: 学科类型、置信度、匹配的关键词列表
        """
        text_lower = text.lower()
        results = []

        for subject_type, subject_profile in self.subjects.items():
            matched_keywords = []
            total_score = 0
            max_possible_score = 0

            for keyword_obj in subject_profile.keywords:
                # 检查主关键词
                keyword_matches = self._count_keyword_matches(keyword_obj.keyword, text_lower)

                # 检查同义词
                for synonym in keyword_obj.synonyms:
                    keyword_matches += self._count_keyword_matches(synonym, text_lower)

                # 检查正则表达式模式
                if keyword_obj.regex_pattern:
                    try:
                        regex_matches = len(re.findall(keyword_obj.regex_pattern, text_lower, re.IGNORECASE))
                        keyword_matches += regex_matches
                    except re.error:
                        pass  # 忽略无效的正则表达式

                if keyword_matches > 0:
                    matched_keywords.extend([keyword_obj.keyword] * keyword_matches)
                    total_score += keyword_obj.weight * keyword_matches

                max_possible_score += keyword_obj.weight

            # 计算置信度
            if max_possible_score > 0:
                confidence = min(total_score / max_possible_score, 1.0)
                if confidence >= min_confidence:
                    results.append((subject_type, confidence, list(set(matched_keywords))))

        # 按置信度和优先级排序
        results.sort(key=lambda x: (x[1] * self.subjects[x[0]].priority, self.subjects[x[0]].priority), reverse=True)
        return results

    def _count_keyword_matches(self, keyword: str, text: str) -> int:
        """计算关键词在文本中的出现次数"""
        keyword_lower = keyword.lower()
        # 使用词边界确保完整匹配
        pattern = r'\b' + re.escape(keyword_lower) + r'\b'
        matches = re.findall(pattern, text)
        return len(matches)

    def get_subject_templates(self, subject_type: SubjectType) -> List[str]:
        """获取学科关联的可视化模板"""
        if subject_type in self.subjects:
            return self.subjects[subject_type].associated_templates
        return []

    def get_subject_info(self, subject_type: SubjectType) -> Optional[SubjectProfile]:
        """获取学科配置信息"""
        return self.subjects.get(subject_type)

    def add_custom_keyword(self, subject_type: SubjectType, keyword: SubjectKeyword):
        """为指定学科添加自定义关键词"""
        if subject_type in self.subjects:
            self.subjects[subject_type].keywords.append(keyword)

    def get_all_subjects(self) -> Dict[SubjectType, SubjectProfile]:
        """获取所有学科配置"""
        return self.subjects.copy()

    def export_database(self, file_path: str):
        """导出关键词数据库到JSON文件"""
        export_data = {}
        for subject_type, subject_profile in self.subjects.items():
            export_data[subject_type.value] = {
                "name": subject_profile.name,
                "name_cn": subject_profile.name_cn,
                "keywords": [
                    {
                        "keyword": kw.keyword,
                        "weight": kw.weight,
                        "category": kw.category,
                        "synonyms": kw.synonyms,
                        "regex_pattern": kw.regex_pattern
                    }
                    for kw in subject_profile.keywords
                ],
                "associated_templates": subject_profile.associated_templates,
                "confidence_threshold": subject_profile.confidence_threshold,
                "priority": subject_profile.priority
            }

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

    def import_database(self, file_path: str):
        """从JSON文件导入关键词数据库"""
        with open(file_path, 'r', encoding='utf-8') as f:
            import_data = json.load(f)

        for subject_value, data in import_data.items():
            try:
                subject_type = SubjectType(subject_value)
                keywords = []
                for kw_data in data["keywords"]:
                    keyword = SubjectKeyword(
                        keyword=kw_data["keyword"],
                        weight=kw_data["weight"],
                        category=kw_data["category"],
                        synonyms=kw_data["synonyms"],
                        regex_pattern=kw_data.get("regex_pattern")
                    )
                    keywords.append(keyword)

                self.subjects[subject_type] = SubjectProfile(
                    subject_type=subject_type,
                    name=data["name"],
                    name_cn=data["name_cn"],
                    keywords=keywords,
                    associated_templates=data["associated_templates"],
                    confidence_threshold=data.get("confidence_threshold", 0.3),
                    priority=data.get("priority", 1)
                )
            except (ValueError, KeyError) as e:
                print(f"导入学科数据时出错: {e}")

# 全局关键词数据库实例
keyword_database = SubjectKeywordDatabase()