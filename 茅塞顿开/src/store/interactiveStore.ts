import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  ChatSession,
  Message,
  MessageType,
  VisualizationType,
  VisualizationData,
  ControlConfig,
  UserPreferences,
  AIResponse
} from '@types/interactive';
import { Subject } from '@types/index';

// 默认用户偏好设置
const defaultUserPreferences: UserPreferences = {
  theme: 'light',
  language: 'zh-CN',
  fontSize: 'medium',
  showFormulas: true,
  autoPlayAnimations: true,
  defaultVisualization: VisualizationType.FUNCTION
};

// 初始化示例会话
const createDefaultSession = (subject: Subject): ChatSession => ({
  id: `session_${Date.now()}`,
  subject,
  title: `${subject} 学习会话`,
  messages: [
    {
      id: 'welcome_msg',
      type: MessageType.AI,
      content: `你好！我是你的${subject}学习助手。我可以帮助你解答问题、展示可视化内容。请告诉我你想学习什么内容？`,
      timestamp: new Date(),
      visualization: {
        type: VisualizationType.NONE,
        data: null,
        config: { title: '欢迎' }
      }
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

interface InteractiveStore extends AppState {
  // 会话管理
  createSession: (subject: Subject, title?: string) => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;

  // 消息管理
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  // 消息发送和AI响应
  sendMessage: (content: string) => Promise<void>;
  simulateAIResponse: (message: string) => Promise<AIResponse>;

  // UI状态管理
  setSidebarCollapsed: (collapsed: boolean) => void;
  setVisualizationPanelSize: (size: number) => void;
  setVisualizationFullscreen: (fullscreen: boolean) => void;

  // 输入状态管理
  setInputLoading: (loading: boolean) => void;
  addToInputHistory: (message: string) => void;
  clearInputHistory: () => void;

  // 用户偏好设置
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;

  // 通知管理
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 工具函数
  exportSession: (sessionId: string) => string;
  importSession: (data: string) => boolean;
  generateSessionSummary: (sessionId: string) => string;
}

export const useInteractiveStore = create<InteractiveStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentSession: null,
      sessions: [],
      sidebarCollapsed: false,
      visualizationPanelSize: 65,
      isVisualizationFullscreen: false,
      isInputLoading: false,
      inputHistory: [],
      userPreferences: defaultUserPreferences,
      notifications: [],

      // 会话管理
      createSession: (subject: Subject, title?: string) => {
        const newSession = createDefaultSession(subject);
        if (title) {
          newSession.title = title;
        }

        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSession: newSession
        }));

        get().addNotification({
          type: 'success',
          message: `已创建新的${subject}学习会话`,
          duration: 3000
        });
      },

      switchSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (session) {
          set({ currentSession: session });
        }
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          const newCurrentSession = state.currentSession?.id === sessionId
            ? (newSessions.length > 0 ? newSessions[0] : null)
            : state.currentSession;

          return {
            sessions: newSessions,
            currentSession: newCurrentSession
          };
        });

        get().addNotification({
          type: 'info',
          message: '会话已删除',
          duration: 2000
        });
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date() }
              : session
          )
        }));
      },

      // 消息管理
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, newMessage],
            updatedAt: new Date()
          };

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map(session =>
              session.id === updatedSession.id ? updatedSession : session
            )
          };
        });
      },

      updateMessage: (messageId: string, updates: Partial<Message>) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = {
            ...state.currentSession,
            messages: state.currentSession.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date()
          };

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map(session =>
              session.id === updatedSession.id ? updatedSession : session
            )
          };
        });
      },

      clearMessages: () => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = {
            ...state.currentSession,
            messages: state.currentSession.messages.filter(msg => msg.type === MessageType.SYSTEM),
            updatedAt: new Date()
          };

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map(session =>
              session.id === updatedSession.id ? updatedSession : session
            )
          };
        });
      },

      // 消息发送和AI响应
      sendMessage: async (content: string) => {
        const state = get();
        if (!state.currentSession || state.isInputLoading) return;

        // 添加用户消息
        get().addMessage({
          type: MessageType.USER,
          content
        });

        // 添加到输入历史
        get().addToInputHistory(content);

        // 设置加载状态
        get().setInputLoading(true);

        try {
          // 模拟AI响应
          const aiResponse = await get().simulateAIResponse(content);

          // 添加AI响应消息
          get().addMessage({
            type: MessageType.AI,
            content: aiResponse.message,
            visualization: aiResponse.visualization,
            metadata: {
              knowledgePoints: aiResponse.relatedKnowledgePoints,
              tags: ['AI生成']
            }
          });

        } catch (error) {
          console.error('AI响应错误:', error);
          get().addMessage({
            type: MessageType.ERROR,
            content: '抱歉，我现在无法回应。请稍后再试。'
          });

          get().addNotification({
            type: 'error',
            message: 'AI响应失败，请检查网络连接',
            duration: 5000
          });
        } finally {
          get().setInputLoading(false);
        }
      },

      simulateAIResponse: async (message: string): Promise<AIResponse> => {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const lowerMessage = message.toLowerCase();

        // 检测数学问题类型
        if (lowerMessage.includes('函数') || lowerMessage.includes('图像')) {
          return {
            message: '我来为你绘制函数图像。你可以在右侧看到函数的可视化展示，还可以调整参数来观察图像变化。',
            visualization: {
              type: VisualizationType.FUNCTION,
              data: {
                functions: [
                  {
                    name: 'f(x) = x²',
                    equation: (x: number) => x * x,
                    color: '#7C3AED'
                  },
                  {
                    name: 'g(x) = 2x + 1',
                    equation: (x: number) => 2 * x + 1,
                    color: '#DC2626'
                  }
                ]
              },
              config: {
                title: '函数图像对比',
                interactive: true,
                showControls: true
              }
            },
            suggestions: ['尝试不同的函数', '调整参数', '查看交点'],
            relatedKnowledgePoints: ['math-1-3', 'math-1-4'],
            followUpQuestions: ['这个函数的定义域是什么？', '如何求函数的极值？']
          };
        }

        if (lowerMessage.includes('几何') || lowerMessage.includes('三角形') || lowerMessage.includes('圆')) {
          return {
            message: '让我为你展示几何图形。你可以在右侧画板上看到图形，还可以进行交互操作。',
            visualization: {
              type: VisualizationType.GEOMETRY,
              data: {
                points: [{ x: 0, y: 0, label: 'O' }],
                triangles: [
                  {
                    points: [
                      { x: 0, y: 0 },
                      { x: 4, y: 0 },
                      { x: 0, y: 3 }
                    ],
                    color: '#7C3AED',
                    fill: true,
                    label: 'Rt△'
                  }
                ]
              },
              config: {
                title: '几何图形演示',
                interactive: true,
                showControls: true
              }
            },
            suggestions: ['测量角度', '计算面积', '添加辅助线'],
            relatedKnowledgePoints: ['math-4-3'],
            followUpQuestions: ['如何计算这个三角形的面积？', '这个三角形是什么类型？']
          };
        }

        if (lowerMessage.includes('数列') || lowerMessage.includes('等差') || lowerMessage.includes('等比')) {
          return {
            message: '数列是数学中重要的概念。让我为你演示数列的变化规律。',
            visualization: {
              type: VisualizationType.SEQUENCE,
              data: {
                type: 'arithmetic',
                firstTerm: 2,
                difference: 3,
                numTerms: 8
              },
              config: {
                title: '等差数列演示',
                interactive: true,
                showControls: true
              }
            },
            suggestions: ['查看通项公式', '计算前n项和', '比较不同数列'],
            relatedKnowledgePoints: ['math-3-1'],
            followUpQuestions: ['等差数列的通项公式是什么？', '如何求等比数列的和？']
          };
        }

        // 默认响应
        return {
          message: `我理解你想了解"${message}"。这是一个很好的学习话题！让我为你详细解释：

## 主要概念
这个知识点涉及重要的数学概念，需要我们深入理解。

## 学习要点
1. 理解基本定义和概念
2. 掌握相关的公式和定理
3. 通过练习加深理解

## 建议
- 多做相关练习题
- 结合图形理解概念
- 及时复习巩固

你还有什么具体想了解的吗？`,
          suggestions: ['查看例题', '做练习题', '查看相关知识点'],
          followUpQuestions: ['你能举个具体的例子吗？', '这个概念有什么应用？']
        };
      },

      // UI状态管理
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      setVisualizationPanelSize: (size: number) => set({ visualizationPanelSize: Math.max(20, Math.min(80, size)) }),
      setVisualizationFullscreen: (fullscreen: boolean) => set({ isVisualizationFullscreen: fullscreen }),

      // 输入状态管理
      setInputLoading: (loading: boolean) => set({ isInputLoading: loading }),
      addToInputHistory: (message: string) => {
        set((state) => ({
          inputHistory: [...new Set([message, ...state.inputHistory])].slice(0, 50)
        }));
      },
      clearInputHistory: () => set({ inputHistory: [] }),

      // 用户偏好设置
      updateUserPreferences: (preferences: Partial<UserPreferences>) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences }
        }));
      },

      // 通知管理
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));

        // 自动移除通知
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(notif => notif.id !== id)
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      // 工具函数
      exportSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return '';

        return JSON.stringify({
          session,
          exportDate: new Date(),
          version: '1.0'
        }, null, 2);
      },

      importSession: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.session) {
            const newSession = {
              ...parsed.session,
              id: `imported_${Date.now()}`,
              createdAt: new Date(parsed.session.createdAt),
              updatedAt: new Date()
            };

            set((state) => ({
              sessions: [...state.sessions, newSession]
            }));

            get().addNotification({
              type: 'success',
              message: '会话导入成功',
              duration: 3000
            });

            return true;
          }
        } catch (error) {
          get().addNotification({
            type: 'error',
            message: '会话导入失败：数据格式错误',
            duration: 5000
          });
        }
        return false;
      },

      generateSessionSummary: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return '';

        const userMessages = session.messages.filter(m => m.type === MessageType.USER);
        const aiMessages = session.messages.filter(m => m.type === MessageType.AI);
        const knowledgePoints = new Set();

        session.messages.forEach(msg => {
          if (msg.metadata?.knowledgePoints) {
            msg.metadata.knowledgePoints.forEach(kp => knowledgePoints.add(kp));
          }
        });

        return `# ${session.title}

## 学习统计
- 会话时间：${session.createdAt.toLocaleDateString()} ${session.createdAt.toLocaleTimeString()}
- 消息总数：${session.messages.length}
- 用户提问：${userMessages.length} 次
- AI回复：${aiMessages.length} 次
- 涉及知识点：${knowledgePoints.size} 个

## 主要内容
${session.messages.map(msg => `- ${msg.type === MessageType.USER ? '👤' : '🤖'} ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`).join('\n')}
`;
      }
    }),
    {
      name: 'interactive-store',
      partialize: (state) => ({
        sessions: state.sessions,
        userPreferences: state.userPreferences,
        inputHistory: state.inputHistory
      })
    }
  )
);