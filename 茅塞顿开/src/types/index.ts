// 学科枚举
export enum Subject {
  CHINESE = 'chinese',
  MATH = 'math',
  ENGLISH = 'english',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  POLITICS = 'politics'
}

// 学科信息接口
export interface SubjectInfo {
  id: Subject;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
}

// 知识点接口
export interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  prerequisites?: string[]; // 前置知识点
  relatedPoints?: string[]; // 相关知识点
}

// 可视化组件接口
export interface VisualizationProps {
  data: any;
  width?: number;
  height?: number;
  interactive?: boolean;
  onInteraction?: (event: any) => void;
}

// 学习进度接口
export interface LearningProgress {
  userId: string;
  subject: Subject;
  knowledgePointId: string;
  status: 'not_started' | 'learning' | 'completed' | 'mastered';
  score?: number;
  timeSpent?: number;
  lastAccessed: Date;
}