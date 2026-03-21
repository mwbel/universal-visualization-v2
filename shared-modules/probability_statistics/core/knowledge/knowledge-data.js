// 概率统计知识点数据结构
// 包含：前置知识、重点、难点、所属章节

const knowledgeData = {
    // 第一章：概率论的基本概念
    "sample_space": {
        id: "sample_space",
        name: "随机事件与样本空间",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/02-随机事件与样本空间-快速版.html",
        icon: "🎯",
        prerequisites: [],  // 无前置知识
        keyPoints: [
            "样本空间Ω的定义和表示",
            "事件的概念及其表示法",
            "事件的运算：并集(A∪B)、交集(A∩B)、补集(A^c)",
            "德摩根定律：(A∪B)^c = A^c ∩ B^c",
            "Venn图的直观理解"
        ],
        difficulties: [
            "复杂事件的表示和运算",
            "德摩根定律的应用",
            "多事件组合运算的优先级"
        ]
    },

    "frequency_probability": {
        id: "frequency_probability",
        name: "频率与概率",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/03-频率与概率-快速版.html",
        icon: "📈",
        prerequisites: ["sample_space"],
        keyPoints: [
            "频率fn(A)的定义：fn(A) = nA / n",
            "概率的公理化定义",
            "大数定律：lim(n→∞) P(|fn(A) - P(A)| < ε) = 1",
            "频率的稳定性",
            "概率的基本性质：非负性、规范性、可列可加性"
        ],
        difficulties: [
            "理解大数定律的极限过程",
            "频率与概率的区别与联系",
            "概率公理化体系"
        ]
    },

    "conditional_probability": {
        id: "conditional_probability",
        name: "条件概率",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/16-条件概率.html",
        icon: "🔗",
        prerequisites: ["sample_space", "frequency_probability"],
        keyPoints: [
            "条件概率定义：P(A|B) = P(A∩B) / P(B)",
            "乘法公式：P(A∩B) = P(B) · P(A|B)",
            "条件概率的性质",
            "缩减样本空间的思想",
            "条件概率与独立性"
        ],
        difficulties: [
            "条件概率与普通概率的区别",
            "缩减样本空间的理解",
            "乘法公式的正确应用"
        ]
    },

    "independence": {
        id: "independence",
        name: "事件的独立性",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/01-独立性.html",
        icon: "🔐",
        prerequisites: ["conditional_probability"],
        keyPoints: [
            "独立性定义：P(A∩B) = P(A) · P(B)",
            "独立与互斥的区别",
            "多个事件的独立性（两两独立vs相互独立）",
            "独立事件的性质",
            "实际应用中的独立性判断"
        ],
        difficulties: [
            "独立性与互斥性的混淆",
            "两两独立与相互独立的区别",
            "实际问题的独立性建模"
        ]
    },

    "total_probability": {
        id: "total_probability",
        name: "全概率公式",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/06-全概率公式-快速版.html",
        icon: "🎲",
        prerequisites: ["conditional_probability"],
        keyPoints: [
            "样本空间的划分（完备事件组）",
            "全概率公式：P(B) = Σ P(Ai) · P(B|Ai)",
            "划分的条件：互斥且完备",
            "全概率公式的几何解释（树状图）",
            "多阶段问题的求解"
        ],
        difficulties: [
            "如何找到合适的样本空间划分",
            "多阶段问题的树状图构建",
            "全概率公式与贝叶斯公式的区别"
        ]
    },

    "bayes": {
        id: "bayes",
        name: "贝叶斯公式",
        chapter: 1,
        chapterName: "概率论的基本概念",
        file: "概率统计可视化/07-贝叶斯公式-快速版.html",
        icon: "🔄",
        prerequisites: ["total_probability"],
        keyPoints: [
            "贝叶斯公式：P(Ai|B) = P(Ai) · P(B|Ai) / Σ P(Aj) · P(B|Aj)",
            "先验概率与后验概率",
            "逆向概率推理",
            "实际应用：医疗诊断、假阳性",
            "贝叶斯公式的直观理解"
        ],
        difficulties: [
            "先验概率和后验概率的理解",
            "贝叶斯公式的记忆和应用",
            "实际问题中的概率建模"
        ]
    },

    // 第二章：随机变量及其分布
    "discrete_rv": {
        id: "discrete_rv",
        name: "离散型随机变量",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/11-离散型随机变量.html",
        icon: "🎲",
        prerequisites: ["frequency_probability"],
        keyPoints: [
            "随机变量的定义",
            "概率分布列（分布律）：P(X = xi) = pi",
            "分布函数：F(x) = P(X ≤ x)",
            "常见离散分布：0-1分布、二项分布、泊松分布、几何分布",
            "离散型随机变量的性质"
        ],
        difficulties: [
            "随机变量与事件的对应关系",
            "分布函数的阶梯形状理解",
            "不同离散分布的应用场景选择"
        ]
    },

    "binomial_distribution": {
        id: "binomial_distribution",
        name: "二项分布",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/11-离散型随机变量.html",
        icon: "🎲",
        prerequisites: ["discrete_rv"],
        keyPoints: [
            "n重伯努利试验",
            "二项分布公式：P(X=k) = C(n,k) · p^k · (1-p)^(n-k)",
            "期望E(X) = np，方差Var(X) = np(1-p)",
            "二项分布的最可能值",
            "二项分布的泊松近似和正态近似"
        ],
        difficulties: [
            "组合数C(n,k)的计算",
            "二项分布的识别",
            "不同近似方法的使用条件"
        ]
    },

    "poisson_distribution": {
        id: "poisson_distribution",
        name: "泊松分布",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/11-离散型随机变量.html",
        icon: "✨",
        prerequisites: ["discrete_rv"],
        keyPoints: [
            "泊松分布公式：P(X=k) = (λ^k · e^(-λ)) / k!",
            "泊松分布的参数λ的含义",
            "期望E(X) = λ，方差Var(X) = λ",
            "稀有事件计数模型",
            "泊松定理（二项分布的泊松近似）"
        ],
        difficulties: [
            "泊松分布的应用场景识别",
            "参数λ的确定",
            "泊松分布与二项分布的关系"
        ]
    },

    "continuous_rv": {
        id: "continuous_rv",
        name: "连续型随机变量",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/12-连续型随机变量.html",
        icon: "📈",
        prerequisites: ["discrete_rv"],
        keyPoints: [
            "概率密度函数(PDF)：f(x)",
            "分布函数(CDF)：F(x) = ∫(-∞ to x) f(t)dt",
            "PDF与CDF的关系",
            "常见连续分布：均匀分布、指数分布、正态分布",
            "连续型随机变量的性质"
        ],
        difficulties: [
            "密度函数与概率的区别",
            "密度函数可以大于1的理解",
            "连续型与离散型的本质区别"
        ]
    },

    "normal_distribution": {
        id: "normal_distribution",
        name: "正态分布",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/17-正态分布.html",
        icon: "📊",
        prerequisites: ["continuous_rv"],
        keyPoints: [
            "正态分布密度函数",
            "标准正态分布N(0,1)",
            "标准化公式：Z = (X - μ) / σ",
            "68-95-99.7规则",
            "正态分布的可加性"
        ],
        difficulties: [
            "标准化的理解和应用",
            "标准正态分布表的查法",
            "正态分布的概率计算"
        ]
    },

    "exponential_distribution": {
        id: "exponential_distribution",
        name: "指数分布",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/12-连续型随机变量.html",
        icon: "⏱️",
        prerequisites: ["continuous_rv"],
        keyPoints: [
            "指数分布密度函数：f(x) = λ · e^(-λx), x ≥ 0",
            "期望E(X) = 1/λ，方差Var(X) = 1/λ²",
            "无记忆性：P(X > s + t | X > s) = P(X > t)",
            "指数分布与泊松过程的关系",
            "等待时间模型"
        ],
        difficulties: [
            "无记忆性的理解",
            "参数λ的含义（与泊松分布的区别）",
            "指数分布的应用建模"
        ]
    },

    "function_of_rv": {
        id: "function_of_rv",
        name: "随机变量的函数的分布",
        chapter: 2,
        chapterName: "随机变量及其分布",
        file: "概率统计可视化/13-随机变量的函数的分布-快速版.html",
        icon: "🔄",
        prerequisites: ["discrete_rv", "continuous_rv"],
        keyPoints: [
            "离散型：分布函数法（表格法）",
            "连续型：分布函数法（CDF法）",
            "连续型：变换公式法（单调函数）",
            "正态分布的线性变换：aX + b ~ N(aμ + b, a²σ²)",
            "多个随机变量函数的分布（和、最大值、最小值）"
        ],
        difficulties: [
            "CDF法的掌握",
            "变换公式的使用条件",
            "非单调函数的处理"
        ]
    },

    // 第三章：多维随机变量
    "bivariate_rv": {
        id: "bivariate_rv",
        name: "二维随机变量",
        chapter: 3,
        chapterName: "多维随机变量",
        file: "概率统计可视化/23-二维随机变量-快速版.html",
        icon: "📊",
        prerequisites: ["discrete_rv", "continuous_rv"],
        keyPoints: [
            "联合分布函数：F(x,y) = P(X ≤ x, Y ≤ y)",
            "离散型：联合分布列",
            "连续型：联合密度函数f(x,y)",
            "边缘分布：fX(x) = ∫ f(x,y)dy",
            "条件分布：f(y|x) = f(x,y) / fX(x)",
            "随机变量的独立性：f(x,y) = fX(x) · fY(y)"
        ],
        difficulties: [
            "联合分布、边缘分布、条件分布的关系",
            "从联合分布求边缘分布",
            "独立性的判断"
        ]
    },

    // 第四章：随机变量的数字特征
    "expectation": {
        id: "expectation",
        name: "数学期望",
        chapter: 4,
        chapterName: "随机变量的数字特征",
        file: "概率统计可视化/04-数学期望-快速版.html",
        icon: "⚖️",
        prerequisites: ["discrete_rv", "continuous_rv"],
        keyPoints: [
            "离散型：E(X) = Σ xi · pi",
            "连续型：E(X) = ∫ x · f(x)dx",
            "期望的线性性质：E(aX + b) = aE(X) + b",
            "期望的物理意义：重心、平衡点",
            "函数的期望：E(g(X))"
        ],
        difficulties: [
            "期望的直观理解",
            "期望的线性性质的应用",
            "随机变量函数期望的计算"
        ]
    },

    "variance": {
        id: "variance",
        name: "方差",
        chapter: 4,
        chapterName: "随机变量的数字特征",
        file: "概率统计可视化/05-方差-快速版.html",
        icon: "📏",
        prerequisites: ["expectation"],
        keyPoints: [
            "方差定义：Var(X) = E[(X - μ)²]",
            "简化公式：Var(X) = E(X²) - [E(X)]²",
            "标准差：σ = √Var(X)",
            "方差的性质：Var(aX + b) = a²Var(X)",
            "方差的物理意义：离散程度、波动性"
        ],
        difficulties: [
            "方差与标准差的关系",
            "方差性质的证明和应用",
            "方差非负性的理解"
        ]
    },

    "covariance": {
        id: "covariance",
        name: "协方差与相关系数",
        chapter: 4,
        chapterName: "随机变量的数字特征",
        file: "概率统计可视化/14-协方差与相关系数.html",
        icon: "🔗",
        prerequisites: ["expectation", "variance", "bivariate_rv"],
        keyPoints: [
            "协方差定义：Cov(X,Y) = E[(X - μX)(Y - μY)]",
            "协方差性质：Cov(X,Y) = E(XY) - E(X)E(Y)",
            "相关系数定义：ρ = Cov(X,Y) / (σX · σY)",
            "相关系数的性质：|ρ| ≤ 1",
            "独立与不相关的区别"
        ],
        difficulties: [
            "协方差的直观理解",
            "相关系数的几何意义",
            "独立性与不相关性的关系"
        ]
    },

    "moments": {
        id: "moments",
        name: "矩、协方差矩阵",
        chapter: 4,
        chapterName: "随机变量的数字特征",
        file: "概率统计可视化/18-矩-快速版.html",
        icon: "📐",
        prerequisites: ["expectation", "variance", "covariance"],
        keyPoints: [
            "k阶原点矩：E(X^k)",
            "k阶中心矩：E[(X - μ)^k]",
            "偏度和峰度",
            "协方差矩阵：Σ = [Cov(Xi, Xj)]",
            "协方差矩阵的性质（对称性、正定性）"
        ],
        difficulties: [
            "高阶矩的理解",
            "偏度和峰度的直观意义",
            "协方差矩阵的构造和性质"
        ]
    },

    // 第五章：大数定律及中心极限定理
    "law_of_large_numbers": {
        id: "law_of_large_numbers",
        name: "依概率收敛与大数定律",
        chapter: 5,
        chapterName: "大数定律及中心极限定理",
        file: "概率统计可视化/19-收敛与大数定律-快速版.html",
        icon: "📊",
        prerequisites: ["expectation", "variance"],
        keyPoints: [
            "依概率收敛的定义",
            "切比雪夫不等式：P(|X - μ| ≥ ε) ≤ σ²/ε²",
            "弱大数定律：样本均值依概率收敛于期望",
            "伯努利大数定律",
            "辛钦大数定律"
        ],
        difficulties: [
            "依概率收敛的理解",
            "切比雪夫不等式的应用",
            "不同大数定律的条件和结论"
        ]
    },

    "central_limit_theorem": {
        id: "central_limit_theorem",
        name: "中心极限定理",
        chapter: 5,
        chapterName: "大数定律及中心极限定理",
        file: "概率统计可视化/08-中心极限定理-快速版.html",
        icon: "🎯",
        prerequisites: ["law_of_large_numbers", "normal_distribution"],
        keyPoints: [
            "中心极限定理的陈述",
            "标准化形式：(X̄ - μ) / (σ/√n) → N(0,1)",
            "林德伯格-列维定理（独立同分布）",
            "棣莫弗-拉普拉斯定理（二项分布）",
            "中心极限定理的应用"
        ],
        difficulties: [
            "中心极限定理的理解",
            "收敛速度的把握",
            "实际问题的应用"
        ]
    },

    // 第六章：样本及抽样分布
    "statistics": {
        id: "statistics",
        name: "常用统计量",
        chapter: 6,
        chapterName: "样本及抽样分布",
        file: "概率统计可视化/20-常用统计量-快速版.html",
        icon: "📊",
        prerequisites: ["expectation", "variance"],
        keyPoints: [
            "样本均值：X̄ = (1/n) Σ Xi",
            "样本方差：S² = (1/(n-1)) Σ (Xi - X̄)²",
            "样本标准差、样本矩",
            "统计量的定义",
            "统计量的分布（抽样分布）"
        ],
        difficulties: [
            "样本方差除以(n-1)的原因（无偏性）",
            "统计量与随机变量的关系",
            "抽样分布的理解"
        ]
    },

    "sampling_distributions": {
        id: "sampling_distributions",
        name: "三大抽样分布对比",
        chapter: 6,
        chapterName: "样本及抽样分布",
        file: "概率统计可视化/09-三大抽样分布对比-快速版.html",
        icon: "📈",
        prerequisites: ["statistics", "normal_distribution", "chi_square"],
        keyPoints: [
            "χ²分布：定义、性质、可加性",
            "t分布：定义、性质、与正态分布的关系",
            "F分布：定义、性质、与χ²分布的关系",
            "三大分布的分位数",
            "三大分布的应用场景"
        ],
        difficulties: [
            "三大分布的定义和性质",
            "自由度的理解",
            "三大分布之间的关系"
        ]
    },

    "histogram_boxplot": {
        id: "histogram_boxplot",
        name: "直方图与箱线图",
        chapter: 6,
        chapterName: "样本及抽样分布",
        file: "概率统计可视化/28-直方图与箱线图-快速版.html",
        icon: "📊",
        prerequisites: ["statistics"],
        keyPoints: [
            "直方图：频数分布、频率分布",
            "箱线图（盒须图）：五数概括法",
            "异常值检测：1.5×IQR规则",
            "数据分布的可视化",
            "多组数据的比较"
        ],
        difficulties: [
            "箱线图的构建和解释",
            "异常值的判断",
            "直方图组数的选择"
        ]
    },

    // 第七章：参数估计
    "parameter_estimation": {
        id: "parameter_estimation",
        name: "参数估计",
        chapter: 7,
        chapterName: "参数估计",
        file: "概率统计可视化/21-参数估计-快速版.html",
        icon: "🎯",
        prerequisites: ["statistics"],
        keyPoints: [
            "点估计与区间估计的区别",
            "估计量的评选标准：无偏性、有效性、一致性",
            "置信区间的概念",
            "置信水平的理解",
            "参数估计的应用场景"
        ],
        difficulties: [
            "置信区间的理解",
            "置信水平与概率的区别",
            "不同估计方法的比较"
        ]
    },

    "method_of_moments": {
        id: "method_of_moments",
        name: "矩估计法",
        chapter: 7,
        chapterName: "参数估计",
        file: "概率统计可视化/24-矩估计法-快速版.html",
        icon: "📐",
        prerequisites: ["parameter_estimation", "moments"],
        keyPoints: [
            "矩估计的基本思想：样本矩 = 总体矩",
            "矩估计的步骤",
            "矩估计量的性质",
            "常见分布的矩估计",
            "矩估计的优缺点"
        ],
        difficulties: [
            "矩估计方程的建立",
            "多个参数的矩估计",
            "矩估计的局限性"
        ]
    },

    "mle": {
        id: "mle",
        name: "最大似然估计法",
        chapter: 7,
        chapterName: "参数估计",
        file: "概率统计可视化/25-最大似然估计法-快速版.html",
        icon: "🔍",
        prerequisites: ["parameter_estimation"],
        keyPoints: [
            "似然函数的定义",
            "对数似然函数",
            "最大似然估计的求解步骤",
            "MLE的性质：不变性、渐近有效性",
            "常见分布的MLE"
        ],
        difficulties: [
            "似然函数的理解",
            "MLE的求解（特别是多参数情况）",
            "MLE与矩估计的比较"
        ]
    },

    "interval_estimation": {
        id: "interval_estimation",
        name: "区间估计",
        chapter: 7,
        chapterName: "参数估计",
        file: "概率统计可视化/27-区间估计-快速版.html",
        icon: "📏",
        prerequisites: ["parameter_estimation", "sampling_distributions"],
        keyPoints: [
            "置信区间的构造",
            "正态总体均值的区间估计",
            "正态总体方差的区间估计",
            "比例的区间估计",
            "样本量的确定"
        ],
        difficulties: [
            "置信区间的构造思想",
            "不同情况下置信区间的选择",
            "样本量与置信区间宽度的关系"
        ]
    },

    // 第八章：假设检验
    "hypothesis_testing_flow": {
        id: "hypothesis_testing_flow",
        name: "假设检验流程",
        chapter: 8,
        chapterName: "假设检验",
        file: "概率统计可视化/10-假设检验流程-快速版.html",
        icon: "🔍",
        prerequisites: ["parameter_estimation", "sampling_distributions"],
        keyPoints: [
            "原假设H0与备择假设H1",
            "检验统计量",
            "拒绝域与临界值",
            "两类错误：第一类错误（α）、第二类错误（β）",
            "显著性水平α的选择",
            "p值的含义"
        ],
        difficulties: [
            "原假设与备择假设的建立",
            "单侧检验与双侧检验的选择",
            "两类错误的权衡"
        ]
    },

    "hypothesis_testing_extended": {
        id: "hypothesis_testing_extended",
        name: "假设检验扩展",
        chapter: 8,
        chapterName: "假设检验",
        file: "概率统计可视化/22-假设检验扩展-快速版.html",
        icon: "📊",
        prerequisites: ["hypothesis_testing_flow"],
        keyPoints: [
            "正态总体均值的检验（Z检验、t检验）",
            "正态总体方差的检验（χ²检验）",
            "两个正态总体的比较",
            "拟合优度检验",
            "独立性检验"
        ],
        difficulties: [
            "不同检验方法的选择",
            "检验统计量的构造",
            "检验结论的解释"
        ]
    }
};

// 辅助函数：获取知识点
function getKnowledgePoint(id) {
    return knowledgeData[id];
}

// 辅助函数：获取章节的所有知识点
function getChapterPoints(chapter) {
    return Object.values(knowledgeData).filter(kp => kp.chapter === chapter);
}

// 辅助函数：获取依赖树
function getDependencyTree(id) {
    const point = knowledgeData[id];
    if (!point) return null;

    const tree = {
        ...point,
        children: []
    };

    // 找到所有依赖这个知识点的点
    Object.values(knowledgeData).forEach(kp => {
        if (kp.prerequisites.includes(id)) {
            tree.children.push(getDependencyTree(kp.id));
        }
    });

    return tree;
}
