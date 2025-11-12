import { KnowledgePoint } from '@types/index';
import { Subject } from '@types/index';

// 沪教版高中数学知识点数据
export const HIGH_SCHOOL_MATH_KNOWLEDGE_POINTS: KnowledgePoint[] = [
  // 必修第一册
  {
    id: 'math-1-1',
    title: '集合',
    description: '集合的概念、表示方法、集合间的基本关系和集合的基本运算',
    subject: Subject.MATH,
    difficulty: 'easy',
    tags: ['集合', '基础概念', '韦恩图'],
    relatedPoints: ['math-1-2', 'math-2-1']
  },
  {
    id: 'math-1-2',
    title: '常用逻辑用语',
    description: '命题及其关系、充分条件与必要条件、全称量词与存在量词',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['逻辑', '命题', '量词'],
    prerequisites: ['math-1-1'],
    relatedPoints: ['math-1-3']
  },
  {
    id: 'math-1-3',
    title: '函数的概念与性质',
    description: '函数的定义、定义域、值域、单调性、奇偶性',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['函数', '性质', '图像'],
    prerequisites: ['math-1-2'],
    relatedPoints: ['math-1-4', 'math-2-1']
  },
  {
    id: 'math-1-4',
    title: '基本初等函数',
    description: '指数函数、对数函数、幂函数的图像和性质',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['指数函数', '对数函数', '幂函数'],
    prerequisites: ['math-1-3'],
    relatedPoints: ['math-2-2', 'math-3-1']
  },

  // 必修第二册
  {
    id: 'math-2-1',
    title: '三角函数',
    description: '任意角和弧度制、三角函数定义、诱导公式、图像变换',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['三角函数', '角度', '弧度', '图像'],
    prerequisites: ['math-1-3'],
    relatedPoints: ['math-2-2', 'math-3-1']
  },
  {
    id: 'math-2-2',
    title: '三角恒等变换',
    description: '两角和与差的三角函数、二倍角公式、半角公式',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['恒等变换', '三角公式', '化简'],
    prerequisites: ['math-2-1'],
    relatedPoints: ['math-2-3']
  },
  {
    id: 'math-2-3',
    title: '解三角形',
    description: '正弦定理、余弦定理及其应用',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['正弦定理', '余弦定理', '应用'],
    prerequisites: ['math-2-2'],
    relatedPoints: ['math-4-1']
  },

  // 必修第三册
  {
    id: 'math-3-1',
    title: '数列',
    description: '数列的概念、等差数列、等比数列及其通项公式和求和公式',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['数列', '等差数列', '等比数列'],
    prerequisites: ['math-1-4', 'math-2-1'],
    relatedPoints: ['math-4-2']
  },
  {
    id: 'math-3-2',
    title: '不等式',
    description: '一元二次不等式、基本不等式、线性规划',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['不等式', '线性规划', '优化'],
    prerequisites: ['math-1-3'],
    relatedPoints: ['math-4-3']
  },

  // 必修第四册
  {
    id: 'math-4-1',
    title: '平面向量',
    description: '向量的概念、线性运算、数量积及其应用',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['向量', '数量积', '几何应用'],
    prerequisites: ['math-2-3'],
    relatedPoints: ['math-s1-1']
  },
  {
    id: 'math-4-2',
    title: '复数',
    description: '复数的概念、四则运算、几何意义',
    subject: Subject.MATH,
    difficulty: 'easy',
    tags: ['复数', '代数运算', '几何表示'],
    prerequisites: ['math-3-1'],
    relatedPoints: ['math-s1-2']
  },
  {
    id: 'math-4-3',
    title: '立体几何初步',
    description: '空间几何体、点线面位置关系、空间角与距离',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['立体几何', '空间想象', '计算'],
    prerequisites: ['math-3-2'],
    relatedPoints: ['math-s2-1']
  },

  // 选择性必修第一册
  {
    id: 'math-s1-1',
    title: '空间向量与立体几何',
    description: '空间向量及其运算、向量方法解立体几何问题',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['空间向量', '立体几何', '向量方法'],
    prerequisites: ['math-4-1', 'math-4-3'],
    relatedPoints: ['math-s1-3']
  },
  {
    id: 'math-s1-2',
    title: '解析几何',
    description: '直线方程、圆的方程、椭圆、双曲线、抛物线',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['解析几何', '圆锥曲线', '方程'],
    prerequisites: ['math-4-2'],
    relatedPoints: ['math-s2-2']
  },
  {
    id: 'math-s1-3',
    title: '数列求和与归纳法',
    description: '数列求和方法、数学归纳法',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['数列求和', '数学归纳法', '证明方法'],
    prerequisites: ['math-3-1', 'math-s1-1'],
    relatedPoints: ['math-s3-1']
  },

  // 选择性必修第三册
  {
    id: 'math-s2-1',
    title: '计数原理',
    description: '分类加法计数原理、分步乘法计数原理、排列组合',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['计数原理', '排列', '组合'],
    prerequisites: ['math-3-1'],
    relatedPoints: ['math-s2-2']
  },
  {
    id: 'math-s2-2',
    title: '概率',
    description: '随机事件、古典概型、几何概型、互斥事件、条件概率',
    subject: Subject.MATH,
    difficulty: 'medium',
    tags: ['概率', '随机事件', '统计'],
    prerequisites: ['math-s2-1'],
    relatedPoints: ['math-s3-1']
  },

  // 导数与应用（通常在其他选修中）
  {
    id: 'math-s3-1',
    title: '导数及其应用',
    description: '导数的概念、导数的计算、导数的应用',
    subject: Subject.MATH,
    difficulty: 'hard',
    tags: ['导数', '微积分', '函数研究'],
    prerequisites: ['math-1-3', 'math-s1-3', 'math-s2-2'],
    relatedPoints: []
  }
];

// 按章节分组的知识点
export const MATH_CHAPTERS = [
  {
    id: 'volume-1',
    title: '必修第一册',
    description: '集合、逻辑用语、函数与基本初等函数',
    knowledgePoints: ['math-1-1', 'math-1-2', 'math-1-3', 'math-1-4']
  },
  {
    id: 'volume-2',
    title: '必修第二册',
    description: '三角函数与解三角形',
    knowledgePoints: ['math-2-1', 'math-2-2', 'math-2-3']
  },
  {
    id: 'volume-3',
    title: '必修第三册',
    description: '数列与不等式',
    knowledgePoints: ['math-3-1', 'math-3-2']
  },
  {
    id: 'volume-4',
    title: '必修第四册',
    description: '向量、复数与立体几何',
    knowledgePoints: ['math-4-1', 'math-4-2', 'math-4-3']
  },
  {
    id: 'selective-1',
    title: '选择性必修第一册',
    description: '空间向量、解析几何与数列进阶',
    knowledgePoints: ['math-s1-1', 'math-s1-2', 'math-s1-3']
  },
  {
    id: 'selective-3',
    title: '选择性必修第三册',
    description: '计数原理与概率',
    knowledgePoints: ['math-s2-1', 'math-s2-2']
  }
];

// 数学工具和公式
export const MATH_FORMULAS = {
  // 二次公式
  quadraticFormula: {
    name: '二次方程求根公式',
    formula: 'x = (-b ± √(b²-4ac)) / 2a',
    description: '求解形如 ax² + bx + c = 0 的二次方程'
  },

  // 勾股定理
  pythagoreanTheorem: {
    name: '勾股定理',
    formula: 'a² + b² = c²',
    description: '直角三角形中两直角边的平方和等于斜边的平方'
  },

  // 两角和公式
  sinAddition: {
    name: '正弦两角和公式',
    formula: 'sin(A±B) = sinA·cosB ± cosA·sinB',
    description: '两角和差的正弦公式'
  },

  // 等差数列求和
  arithmeticSum: {
    name: '等差数列求和',
    formula: 'Sₙ = n(a₁ + aₙ)/2 = na₁ + n(n-1)d/2',
    description: '等差数列前n项和公式'
  },

  // 等比数列求和
  geometricSum: {
    name: '等比数列求和',
    formula: 'Sₙ = a₁(1-qⁿ)/(1-q) (q≠1)',
    description: '等比数列前n项和公式'
  }
};