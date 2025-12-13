#!/usr/bin/env python3
"""
关键词提取服务
支持中英文关键词识别、同义词映射、学科分类等功能
"""

import re
import jieba
import jieba.posseg as pseg
from typing import List, Dict, Set, Tuple, Optional
from collections import Counter, defaultdict
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KeywordExtractor:
    """关键词提取器"""

    def __init__(self):
        """初始化关键词提取器"""
        # 学科关键词词典
        self.subject_keywords = self._init_subject_keywords()

        # 同义词映射
        self.synonym_mapping = self._init_synonym_mapping()

        # 停用词列表
        self.stop_words = self._init_stop_words()

        # 专业术语词典
        self.technical_terms = self._init_technical_terms()

        # 初始化jieba
        self._init_jieba()

    def _init_jieba(self):
        """初始化jieba分词"""
        # 加载自定义词典
        for subject, keywords in self.subject_keywords.items():
            for keyword in keywords:
                jieba.add_word(keyword)

        for term in self.technical_terms:
            jieba.add_word(term)

        logger.info(f"jieba分词器初始化完成，已加载 {len(self.subject_keywords)} 个学科关键词")

    def _init_subject_keywords(self) -> Dict[str, Set[str]]:
        """初始化学科关键词词典"""
        return {
            "数学": {
                "函数", "图像", "坐标", "方程", "几何", "代数", "微积分", "三角函数",
                "二次函数", "三次函数", "指数函数", "对数", "导数", "积分", "极限",
                "向量", "矩阵", "概率", "统计", "数列", "级数", "集合", "图形", "曲线",
                "直线", "圆", "椭圆", "抛物线", "双曲线", "参数", "变量", "常量",
                "数学", "算术", "计算", "公式", "定理", "证明"
            },
            "物理": {
                "波动", "频率", "波长", "振幅", "周期", "相位", "波速", "声波",
                "电磁波", "光波", "机械波", "力", "运动", "速度", "加速度", "质量",
                "能量", "功率", "功", "动量", "冲量", "电", "磁", "电场", "磁场",
                "电流", "电压", "电阻", "电容", "电感", "电路", "光学", "力学",
                "热学", "热力学", "温度", "热量", "熵", "物理", "实验", "测量"
            },
            "化学": {
                "分子", "原子", "化学键", "反应", "结构", "化合物", "元素", "化学",
                "有机", "无机", "酸", "碱", "盐", "氧化", "还原", "催化剂", "溶液",
                "浓度", "pH值", "电解质", "共价键", "离子键", "氢键", "分子式", "化学式",
                "反应方程式", "平衡", "速率", "活化能", "反应热", "化学计量", "滴定"
            },
            "天文": {
                "太阳系", "行星", "轨道", "恒星", "星系", "宇宙", "天文", "天体",
                "卫星", "月球", "地球", "火星", "木星", "土星", "金星", "水星",
                "海王星", "天王星", "小行星", "彗星", "流星", "黑洞", "中子星", "白矮星",
                "星云", "银河系", "河外星系", "光年", "天文单位", "红移", "光谱",
                "引力", "相对论", "宇宙学", "模拟", "轨道周期", "离心率"
            },
            "生物": {
                "细胞", "生物", "植物", "动物", "细胞器", "生命", "进化", "生态",
                "基因", "DNA", "RNA", "蛋白质", "酶", "新陈代谢", "光合作用", "呼吸作用",
                "分裂", "繁殖", "遗传", "变异", "自然选择", "食物链", "生态系统",
                "组织", "器官", "系统", "微生物", "细菌", "病毒", "真菌", "原生生物",
                "细胞膜", "细胞核", "细胞质", "叶绿体", "线粒体", "核糖体", "双螺旋",
                "染色体", "氨基酸", "核酸", "脱氧核糖核酸", "核糖核酸"
            }
        }

    def _init_synonym_mapping(self) -> Dict[str, str]:
        """初始化同义词映射"""
        return {
            # 数学同义词
            "函数图像": ["函数图", "图像", "函数图形", "坐标图", "图"],
            "坐标系": ["坐标", "坐标轴", "轴", "坐标系统"],
            "方程式": ["方程", "等式", "公式"],
            "变量": ["未知数", "变元", "自变量", "因变量"],
            "常数": ["常量", "固定值"],
            "二次函数": ["二次方程", "抛物线"],
            "三角函数": ["三角", "sin", "cos", "tan"],

            # 物理同义词
            "波动": ["振动", "震荡", "波", "波纹"],
            "波速": ["传播速度", "波传播速度"],
            "振幅": ["幅度", "峰值"],
            "周期": ["循环", "振荡周期"],
            "频率": ["赫兹", "Hz", "周波数"],
            "电磁波": ["电磁", "电磁辐射"],
            "机械波": ["机械", "机械振动"],

            # 化学同义词
            "分子结构": ["分子式", "结构式", "分子构造"],
            "化学反应": ["反应", "化学变化", "化学过程"],
            "化学式": ["分子式", "结构式"],
            "化合物": ["化学物质", "化学合成物"],
            "分子": ["原子团", "原子组合"],
            "化学键": ["键", "分子键", "原子键"],

            # 天文同义词
            "天体": ["星体", "天文体"],
            "轨道": ["轨道路径", "运行轨迹", "行星轨道"],
            "星系": ["银河", "星云", "星团"],
            "太阳系": ["行星系统", "恒星系统"],
            "行星": ["星球", "天体行星"],
            "恒星": ["太阳", "恒星体"],

            # 生物同义词
            "细胞结构": ["细胞构造", "细胞组织"],
            "生物体": ["有机体", "生命体", "生物"],
            "遗传物质": ["基因", "DNA", "核酸"],
            "双螺旋": ["DNA结构", "脱氧核糖核酸结构"],
            "细胞": ["生物细胞", "生命细胞"],
            "新陈代谢": ["代谢", "生物代谢"],
        }

    def _init_stop_words(self) -> Set[str]:
        """初始化停用词列表"""
        return {
            # 中文停用词
            "的", "了", "和", "是", "在", "我", "有", "个", "不", "这", "为", "之", "与", "也",
            "而", "及", "等", "或", "其", "要", "对", "就", "会", "能", "可", "但", "却",
            "如果", "因为", "所以", "虽然", "然而", "因此", "不过", "只是", "只是",
            "从", "到", "把", "被", "给", "让", "使", "由", "向", "往", "去", "来",
            "很", "非常", "特别", "比较", "更加", "最", "更", "一些", "一点", "什么",
            "怎么", "为什么", "哪里", "哪个", "如何", "怎样", "这样", "那样", "这种",
            "那种", "这些", "那些", "它们", "自己", "我们", "你们", "他们", "她们",
            "它", "这个", "那个", "这些", "那些", "这里", "那里", "现在", "然后",
            "同时", "另外", "此外", "而且", "并且", "或者", "还是", "不是", "没有",
            "可能", "应该", "必须", "需要", "想要", "希望", "喜欢", "讨厌", "害怕",

            # 额外的通用停用词
            "包含", "一个", "显示", "展示", "生成", "创建", "制作", "绘制", "模拟",
            "实现", "获得", "得到", "进行", "通过", "使用", "采用", "根据", "基于",
            "关于", "对于", "由于", "除了", "包括", "等等", "之类", "之类的", "其他",
            "各种", "各种各样", "所有", "全部", "整个", "每个", "各个", "各个", "许多",
            "一些", "某种", "某些", "多数", "少数", "大部分", "小部分", "主要", "次要",
            "首先", "其次", "最后", "最终", "总之", "总的来说", "一般来说", "通常",

            # 英文停用词
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "up", "about", "into", "through", "during",
            "before", "after", "above", "below", "between", "among", "under", "over",
            "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
            "them", "my", "your", "his", "her", "its", "our", "their", "mine", "yours",
            "hers", "ours", "theirs", "this", "that", "these", "those", "am", "is",
            "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
            "does", "did", "having", "can", "could", "may", "might", "must", "shall",
            "should", "will", "would", "about", "above", "across", "after", "against",
            "along", "among", "around", "at", "before", "behind", "below", "beneath",
            "beside", "between", "beyond", "by", "down", "during", "except", "for",
            "from", "in", "inside", "into", "like", "near", "of", "off", "on", "onto",
            "out", "outside", "over", "past", "since", "through", "to", "toward",
            "under", "until", "up", "upon", "with", "within", "without", "very", "too",
            "so", "just", "only", "also", "even", "not", "no", "yes", "well", "really"
        }

    def _init_technical_terms(self) -> Set[str]:
        """初始化专业术语词典"""
        return {
            # 数学术语
            "傅里叶变换", "拉普拉斯变换", "泰勒级数", "麦克劳林级数", "欧拉公式",
            "勾股定理", "毕达哥拉斯定理", "费马大定理", "哥德巴赫猜想", "黎曼猜想",

            # 物理术语
            "牛顿定律", "爱因斯坦相对论", "量子力学", "薛定谔方程", "麦克斯韦方程组",
            "热力学定律", "库仑定律", "欧姆定律", "法拉第定律", "楞次定律",

            # 化学术语
            "阿伏伽德罗常数", "玻尔兹曼常数", "普朗克常数", "理想气体方程", "化学平衡",
            "勒夏特列原理", "质量守恒定律", "能量守恒定律", "元素周期表", "化学计量",

            # 天文术语
            "开普勒定律", "哈勃定律", "红移", "黑洞", "白矮星", "中子星", "脉冲星",
            "类星体", "星系团", "宇宙大爆炸", "暗物质", "暗能量",

            # 生物术语
            "达尔文进化论", "孟德尔遗传定律", "DNA双螺旋", "中心法则", "细胞呼吸",
            "光合作用", "ATP合成", "蛋白质折叠", "基因表达", "细胞凋亡"
        }

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """
        提取关键词

        Args:
            text: 输入文本
            max_keywords: 最大关键词数量

        Returns:
            关键词列表，按重要性排序
        """
        if not text or not isinstance(text, str):
            return []

        # 预处理文本
        text = self._preprocess_text(text)

        # 分词和词性标注
        words_with_pos = pseg.cut(text)

        # 提取候选词
        candidates = []
        subject_scores = defaultdict(int)

        for word, pos in words_with_pos:
            # 过滤停用词和过短的词
            if (len(word) < 2 or word in self.stop_words or
                not re.match(r'[\u4e00-\u9fff\w]', word)):
                continue

            # 计算词的权重
            weight = self._calculate_word_weight(word, pos)

            # 提高最低权重阈值，过滤低质量词
            if weight >= 2.0:  # 从0提升到2.0
                candidates.append((word, weight))

                # 记录学科得分
                for subject, keywords in self.subject_keywords.items():
                    if word in keywords:
                        subject_scores[subject] += weight

        # 去重和排序
        unique_candidates = {}
        for word, weight in candidates:
            if word not in unique_candidates or weight > unique_candidates[word]:
                unique_candidates[word] = weight

        # 按权重排序
        sorted_keywords = sorted(unique_candidates.items(),
                               key=lambda x: x[1], reverse=True)

        # 提取前N个关键词
        top_keywords = [word for word, weight in sorted_keywords[:max_keywords]]

        # 应用同义词标准化
        normalized_keywords = self._normalize_synonyms(top_keywords)

        logger.info(f"从文本中提取了 {len(normalized_keywords)} 个关键词")
        logger.info(f"学科得分: {dict(subject_scores)}")

        return normalized_keywords

    def _preprocess_text(self, text: str) -> str:
        """预处理文本"""
        # 转换为小写（保留中文）
        text = text.lower()

        # 移除特殊字符，保留中文、英文、数字
        text = re.sub(r'[^\u4e00-\u9fff\w\s]', ' ', text)

        # 合并多个空格
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def _calculate_word_weight(self, word: str, pos: str) -> float:
        """计算词的权重"""
        weight = 0.0

        # 基础词性权重
        pos_weights = {
            'n': 2.0,    # 名词
            'v': 1.5,    # 动词
            'a': 1.2,    # 形容词
            'm': 1.8,    # 数词
            'eng': 1.0,  # 英文单词
        }
        weight += pos_weights.get(pos, 0.5)

        # 学科关键词权重（大幅提升）
        subject_bonus = 0.0
        for subject, keywords in self.subject_keywords.items():
            if word in keywords:
                subject_bonus = 5.0  # 从3.0提升到5.0
                break
        weight += subject_bonus

        # 专业术语权重（大幅提升）
        if word in self.technical_terms:
            weight += 4.0  # 从2.5提升到4.0

        # 长度权重
        if len(word) >= 4:
            weight += 1.0
        elif len(word) >= 3:
            weight += 0.5

        # 数字权重
        if re.search(r'\d', word):
            weight += 0.8

        # 英文缩写和化学式的特殊处理
        if re.match(r'^[A-Z]{2,}$', word):  # DNA, RNA, Hz等
            weight += 2.0
        elif re.match(r'^[A-Za-z0-9]+$', word) and len(word) <= 4:  # CH4, Hz, sin等
            weight += 1.5

        # 如果是通用动词或形容词，降低权重
        common_generic_words = {"显示", "展示", "生成", "创建", "绘制", "模拟", "过程", "动画", "模型"}
        if word in common_generic_words:
            weight *= 0.3  # 大幅降低权重

        return weight

    def _normalize_synonyms(self, keywords: List[str]) -> List[str]:
        """同义词标准化"""
        normalized = []
        seen = set()

        for keyword in keywords:
            # 查找标准词
            standard_word = keyword
            for standard, synonyms in self.synonym_mapping.items():
                if keyword in synonyms or keyword == standard:
                    standard_word = standard
                    break

            # 避免重复
            if standard_word not in seen:
                normalized.append(standard_word)
                seen.add(standard_word)

        return normalized

    def classify_subject(self, text: str, keywords: List[str] = None) -> Optional[str]:
        """
        分类文本所属学科

        Args:
            text: 输入文本
            keywords: 已提取的关键词列表（可选）

        Returns:
            最可能的学科，或None
        """
        if keywords is None:
            keywords = self.extract_keywords(text)

        subject_scores = defaultdict(int)

        # 基于关键词计分
        for keyword in keywords:
            for subject, subject_keywords in self.subject_keywords.items():
                if keyword in subject_keywords:
                    subject_scores[subject] += 1

        # 基于文本直接匹配
        text_lower = text.lower()
        for subject, subject_keywords in self.subject_keywords.items():
            for keyword in subject_keywords:
                if keyword.lower() in text_lower:
                    subject_scores[subject] += 0.5

        if not subject_scores:
            return None

        # 返回得分最高的学科
        return max(subject_scores.items(), key=lambda x: x[1])[0]

    def extract_with_subject(self, text: str, max_keywords: int = 10) -> Dict[str, any]:
        """
        提取关键词并分类学科

        Args:
            text: 输入文本
            max_keywords: 最大关键词数量

        Returns:
            包含关键词、学科、得分的字典
        """
        keywords = self.extract_keywords(text, max_keywords)
        subject = self.classify_subject(text, keywords)

        # 计算学科置信度
        subject_scores = defaultdict(int)
        for keyword in keywords:
            for subj, subject_keywords in self.subject_keywords.items():
                if keyword in subject_keywords:
                    subject_scores[subj] += 1

        confidence = 0.0
        if subject and subject_scores:
            total_matches = sum(subject_scores.values())
            confidence = subject_scores[subject] / total_matches if total_matches > 0 else 0

        return {
            "keywords": keywords,
            "subject": subject,
            "subject_confidence": confidence,
            "all_subject_scores": dict(subject_scores),
            "text_length": len(text),
            "keyword_count": len(keywords)
        }

    def get_keyword_statistics(self) -> Dict[str, any]:
        """获取关键词提取器统计信息"""
        total_subject_keywords = sum(len(keywords) for keywords in self.subject_keywords.values())

        return {
            "subject_count": len(self.subject_keywords),
            "total_subject_keywords": total_subject_keywords,
            "technical_terms_count": len(self.technical_terms),
            "synonym_groups": len(self.synonym_mapping),
            "stop_words_count": len(self.stop_words),
            "subjects": list(self.subject_keywords.keys())
        }

# 全局实例
keyword_extractor = KeywordExtractor()

def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """便捷函数：提取关键词"""
    return keyword_extractor.extract_keywords(text, max_keywords)

def extract_keywords_with_subject(text: str, max_keywords: int = 10) -> Dict[str, any]:
    """便捷函数：提取关键词并分类学科"""
    return keyword_extractor.extract_with_subject(text, max_keywords)

def classify_text_subject(text: str) -> Optional[str]:
    """便捷函数：分类文本学科"""
    return keyword_extractor.classify_subject(text)

if __name__ == "__main__":
    # 测试代码
    test_texts = [
        "画一个二次函数y=x^2的图像，包含坐标轴",
        "生成正弦波的波动图像，频率2Hz，波长3m",
        "显示水分子的3D结构模型，包含化学键",
        "模拟太阳系行星运行，包含地球和火星轨道",
        "展示植物细胞和动物细胞的对比图"
    ]

    print("关键词提取测试：")
    print("=" * 50)

    for i, text in enumerate(test_texts, 1):
        print(f"\n测试 {i}: {text}")
        result = extract_keywords_with_subject(text)
        print(f"学科: {result['subject']} (置信度: {result['subject_confidence']:.2f})")
        print(f"关键词: {result['keywords']}")

    # 显示统计信息
    print(f"\n关键词提取器统计信息：")
    stats = keyword_extractor.get_keyword_statistics()
    for key, value in stats.items():
        print(f"{key}: {value}")