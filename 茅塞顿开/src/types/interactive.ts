import { Subject } from './index';

// 消息类型枚举
export enum MessageType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
  ERROR = 'error'
}

// 可视化类型枚举
export enum VisualizationType {
  FUNCTION = 'function',
  GEOMETRY = 'geometry',
  SEQUENCE = 'sequence',
  STATISTICS = 'statistics',
  CHART = 'chart',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  LANGUAGE = 'language',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  NONE = 'none'
}

// 消息接口
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  visualization?: {
    type: VisualizationType;
    data: any;
    config?: any;
  };
  metadata?: {
    knowledgePoint?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  };
}

// 可视化数据接口
export interface VisualizationData {
  type: VisualizationType;
  data: any;
  config: {
    title?: string;
    description?: string;
    interactive?: boolean;
    showControls?: boolean;
    [key: string]: any;
  };
}

// 控制面板配置
export interface ControlConfig {
  id: string;
  type: 'slider' | 'select' | 'toggle' | 'input' | 'button';
  label: string;
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: any) => void;
}

// 聊天会话接口
export interface ChatSession {
  id: string;
  subject: Subject;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  knowledgePoints?: string[];
  tags?: string[];
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  fontSize: 'small' | 'medium' | 'large';
  showFormulas: boolean;
  autoPlayAnimations: boolean;
  defaultVisualization: VisualizationType;
}

// 应用状态接口
export interface AppState {
  // 当前会话
  currentSession: ChatSession | null;
  sessions: ChatSession[];

  // UI状态
  sidebarCollapsed: boolean;
  visualizationPanelSize: number; // 0-100
  isVisualizationFullscreen: boolean;

  // 输入状态
  isInputLoading: boolean;
  inputHistory: string[];

  // 用户设置
  userPreferences: UserPreferences;

  // 错误和通知
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    duration?: number;
  }>;
}

// 交互学习页面Props
export interface InteractiveLearningPageProps {
  subject: Subject;
  initialQuestion?: string;
  sessionId?: string;
}

// 聊天面板Props
export interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  supportFormula?: boolean;
  placeholder?: string;
}

// 可视化面板Props
export interface VisualizationPanelProps {
  visualization: VisualizationData | null;
  controls: ControlConfig[];
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  onConfigChange: (config: Partial<VisualizationData>) => void;
}

// 消息输入组件Props
export interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  supportFormula?: boolean;
  suggestions?: string[];
}

// AI响应接口
export interface AIResponse {
  message: string;
  visualization?: VisualizationData;
  suggestions?: string[];
  relatedKnowledgePoints?: string[];
  followUpQuestions?: string[];
}