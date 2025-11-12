import { Subject, SubjectInfo } from '@types/index';

// 学科配置信息
export const SUBJECTS_CONFIG: Record<Subject, SubjectInfo> = {
  [Subject.CHINESE]: {
    id: Subject.CHINESE,
    name: 'chinese',
    displayName: '语文',
    description: '涵盖文学常识、古诗词、现代文阅读、写作等知识点',
    color: '#DC2626',
    icon: 'book-open'
  },
  [Subject.MATH]: {
    id: Subject.MATH,
    name: 'math',
    displayName: '数学',
    description: '包括函数、几何、概率统计、微积分等数学概念',
    color: '#7C3AED',
    icon: 'calculator'
  },
  [Subject.ENGLISH]: {
    id: Subject.ENGLISH,
    name: 'english',
    displayName: '英语',
    description: '词汇、语法、阅读理解、写作等英语技能',
    color: '#0891B2',
    icon: 'languages'
  },
  [Subject.PHYSICS]: {
    id: Subject.PHYSICS,
    name: 'physics',
    displayName: '物理',
    description: '力学、电磁学、光学、热学等物理现象和规律',
    color: '#059669',
    icon: 'atom'
  },
  [Subject.CHEMISTRY]: {
    id: Subject.CHEMISTRY,
    name: 'chemistry',
    displayName: '化学',
    description: '元素周期表、化学反应、有机化学、无机化学等',
    color: '#EA580C',
    icon: 'flask-conical'
  },
  [Subject.BIOLOGY]: {
    id: Subject.BIOLOGY,
    name: 'biology',
    displayName: '生物',
    description: '细胞生物学、遗传学、生态学、进化论等生命科学',
    color: '#16A34A',
    icon: 'leaf'
  },
  [Subject.HISTORY]: {
    id: Subject.HISTORY,
    name: 'history',
    displayName: '历史',
    description: '中国历史、世界历史的重要事件和人物',
    color: '#92400E',
    icon: 'scroll-text'
  },
  [Subject.GEOGRAPHY]: {
    id: Subject.GEOGRAPHY,
    name: 'geography',
    displayName: '地理',
    description: '自然地理、人文地理、地图技能等地理知识',
    color: '#0284C7',
    icon: 'globe'
  },
  [Subject.POLITICS]: {
    id: Subject.POLITICS,
    name: 'politics',
    displayName: '政治',
    description: '马克思主义基本原理、政治制度、经济常识等',
    color: '#B91C1C',
    icon: 'balance-scale'
  }
};

// 获取所有学科列表
export const getAllSubjects = (): SubjectInfo[] => {
  return Object.values(SUBJECTS_CONFIG);
};

// 根据ID获取学科信息
export const getSubjectById = (id: Subject): SubjectInfo | undefined => {
  return SUBJECTS_CONFIG[id];
};

// 获取学科颜色
export const getSubjectColor = (subject: Subject): string => {
  return SUBJECTS_CONFIG[subject]?.color || '#666666';
};