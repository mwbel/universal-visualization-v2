import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme, Drawer, Button, Space, Tooltip } from 'antd';
import {
  MessageOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { Subject } from '@types/index';
import { useInteractiveStore } from '@store/interactiveStore';
import ChatPanel from '@components/interactive/ChatPanel';
import EnhancedVisualizationPanel from '@components/interactive/EnhancedVisualizationPanel';
import SessionSidebar from '@components/interactive/SessionSidebar';
import NotificationCenter from '@components/interactive/NotificationCenter';
import SettingsPanel from '@components/interactive/SettingsPanel';
import '@styles/interactive.css';

const { Header, Content, Sider } = Layout;

interface InteractiveLearningPageProps {
  subject?: Subject;
  initialQuestion?: string;
}

const InteractiveLearningPage: React.FC<InteractiveLearningPageProps> = ({
  subject,
  initialQuestion
}) => {
  const params = useParams();
  const navigate = useNavigate();

  const {
    currentSession,
    sessions,
    sidebarCollapsed,
    visualizationPanelSize,
    isVisualizationFullscreen,
    createSession,
    setSidebarCollapsed,
    setVisualizationFullscreen,
    sendMessage,
    notifications
  } = useInteractiveStore();

  // 本地状态
  const [sessionDrawerVisible, setSessionDrawerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 确定当前学科
  const currentSubject = subject || (params.subject as Subject) || Subject.MATH;

  // 初始化会话
  useEffect(() => {
    if (!currentSession) {
      createSession(currentSubject, `${currentSubject} 学习会话`);
    }
  }, [currentSubject, currentSession, createSession]);

  // 处理初始问题
  useEffect(() => {
    if (initialQuestion && currentSession && currentSession.messages.length === 1) {
      setTimeout(() => {
        sendMessage(initialQuestion);
      }, 1000);
    }
  }, [initialQuestion, currentSession, sendMessage]);

  // 获取当前可视化的数据
  const currentVisualization = currentSession?.messages
    .filter(msg => msg.visualization && msg.visualization.type !== 'none')
    .pop()?.visualization || null;

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 快速切换会话
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSessionDrawerVisible(true);
      }

      // Ctrl/Cmd + F: 全屏切换
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setVisualizationFullscreen(!isVisualizationFullscreen);
      }

      // Ctrl/Cmd + ,: 设置面板
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsVisible(true);
      }

      // ESC: 退出全屏/关闭弹窗
      if (e.key === 'Escape') {
        if (isVisualizationFullscreen) {
          setVisualizationFullscreen(false);
        } else if (sessionDrawerVisible) {
          setSessionDrawerVisible(false);
        } else if (settingsVisible) {
          setSettingsVisible(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisualizationFullscreen, sessionDrawerVisible, settingsVisible]);

  // Ant Design 主题配置
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const themeConfig = {
    algorithm: defaultAlgorithm,
    token: {
      colorPrimary: '#7C3AED', // 紫色主题
      borderRadius: 8,
      fontSize: 14,
    },
    components: {
      Layout: {
        headerBg: '#ffffff',
        siderBg: '#ffffff',
      },
    },
  };

  // 渲染主要内容
  const renderMainContent = () => {
    if (isVisualizationFullscreen) {
      return (
        <div className="fullscreen-visualization">
          <EnhancedVisualizationPanel
            visualization={currentVisualization}
            controls={generateControls()}
            isFullscreen={true}
            onFullscreenToggle={() => setVisualizationFullscreen(false)}
            onConfigChange={handleVisualizationConfigChange}
            subject={currentSubject}
          />
        </div>
      );
    }

    return (
      <div className="interactive-content">
        <div
          className="chat-panel-wrapper"
          style={{ width: `${100 - visualizationPanelSize}%` }}
        >
          <ChatPanel
            messages={currentSession?.messages || []}
            onSendMessage={sendMessage}
            isLoading={useInteractiveStore.getState().isInputLoading}
            supportFormula={true}
            placeholder={`请输入你的${currentSubject}问题...`}
          />
        </div>

        <div
          className="visualization-panel-wrapper"
          style={{ width: `${visualizationPanelSize}%` }}
        >
          <EnhancedVisualizationPanel
            visualization={currentVisualization}
            controls={generateControls()}
            isFullscreen={false}
            onFullscreenToggle={() => setVisualizationFullscreen(true)}
            onConfigChange={handleVisualizationConfigChange}
            subject={currentSubject}
          />
        </div>

        {/* 分隔线 */}
        <div
          className="resize-divider"
          onMouseDown={handleResizeStart}
        />
      </div>
    );
  };

  // 生成控制面板配置
  const generateControls = () => {
    const controls = [];

    if (currentVisualization?.type === 'function') {
      controls.push(
        {
          id: 'animation',
          type: 'toggle' as const,
          label: '动画',
          value: false,
          onChange: (value: boolean) => handleControlChange('animation', value)
        },
        {
          id: 'grid',
          type: 'toggle' as const,
          label: '网格',
          value: true,
          onChange: (value: boolean) => handleControlChange('grid', value)
        }
      );
    }

    return controls;
  };

  // 处理控制变化
  const handleControlChange = (controlId: string, value: any) => {
    console.log('Control changed:', controlId, value);
    // 这里可以更新可视化配置
  };

  // 处理可视化配置变化
  const handleVisualizationConfigChange = (config: any) => {
    console.log('Visualization config changed:', config);
  };

  // 处理分割线拖拽
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = visualizationPanelSize;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newSize = Math.max(20, Math.min(80, startWidth - deltaPercent));

      useInteractiveStore.getState().setVisualizationPanelSize(newSize);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className="interactive-layout">
        {/* 顶部导航栏 */}
        <Header className="interactive-header">
          <div className="header-left">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle"
            />

            <div className="header-title">
              <h1 className="title">茅塞顿开 - {currentSubject}学习助手</h1>
              {currentSession && (
                <p className="session-info">{currentSession.messages.length} 条对话</p>
              )}
            </div>
          </div>

          <div className="header-right">
            <Space>
              <Tooltip title="会话历史 (Ctrl+K)">
                <Button
                  type="text"
                  icon={<HistoryOutlined />}
                  onClick={() => setSessionDrawerVisible(true)}
                  badge={{ count: sessions.length }}
                />
              </Tooltip>

              <Tooltip title="全屏 (Ctrl+F)">
                <Button
                  type="text"
                  icon={isVisualizationFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={() => setVisualizationFullscreen(!isVisualizationFullscreen)}
                />
              </Tooltip>

              <Tooltip title="设置 (Ctrl+,)">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                />
              </Tooltip>
            </Space>
          </div>
        </Header>

        {/* 主要内容区域 */}
        <Layout className="interactive-main-layout">
          {/* 侧边栏 */}
          {!sidebarCollapsed && (
            <Sider width={280} className="interactive-sider">
              <SessionSidebar
                sessions={sessions}
                currentSessionId={currentSession?.id}
                onSessionSelect={(sessionId) => {
                  useInteractiveStore.getState().switchSession(sessionId);
                }}
                onSessionCreate={() => createSession(currentSubject)}
                onSessionDelete={(sessionId) => {
                  useInteractiveStore.getState().deleteSession(sessionId);
                }}
              />
            </Sider>
          )}

          {/* 内容区域 */}
          <Content className="interactive-content">
            {renderMainContent()}
          </Content>
        </Layout>

        {/* 会话历史抽屉 */}
        <Drawer
          title="学习会话历史"
          placement="left"
          onClose={() => setSessionDrawerVisible(false)}
          open={sessionDrawerVisible}
          width={320}
        >
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSession?.id}
            onSessionSelect={(sessionId) => {
              useInteractiveStore.getState().switchSession(sessionId);
              setSessionDrawerVisible(false);
            }}
            onSessionCreate={() => createSession(currentSubject)}
            onSessionDelete={(sessionId) => {
              useInteractiveStore.getState().deleteSession(sessionId);
            }}
          />
        </Drawer>

        {/* 设置面板 */}
        <Drawer
          title="设置"
          placement="right"
          onClose={() => setSettingsVisible(false)}
          open={settingsVisible}
          width={360}
        >
          <SettingsPanel
            onClose={() => setSettingsVisible(false)}
          />
        </Drawer>

        {/* 通知中心 */}
        <NotificationCenter />
      </Layout>
    </ConfigProvider>
  );
};

export default InteractiveLearningPage;