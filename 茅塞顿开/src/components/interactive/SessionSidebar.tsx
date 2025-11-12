import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Popconfirm,
  Modal,
  Input,
  Tag,
  Avatar,
  Tooltip,
  Empty
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { ChatSession } from '@types/interactive';
import { Subject } from '@types/index';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './SessionSidebar.css';

const { Title, Text } = Typography;
const { Meta } = Card;

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionDelete: (sessionId: string) => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 获取学科信息
  const getSubjectInfo = (subject: Subject) => {
    const subjects = {
      [Subject.MATH]: { name: '数学', color: '#7C3AED', icon: '📐' },
      [Subject.CHINESE]: { name: '语文', color: '#DC2626', icon: '📖' },
      [Subject.ENGLISH]: { name: '英语', color: '#0891B2', icon: '🔤' },
      [Subject.PHYSICS]: { name: '物理', color: '#059669', icon: '🔬' },
      [Subject.CHEMISTRY]: { name: '化学', color: '#EA580C', icon: '⚗️' },
      [Subject.BIOLOGY]: { name: '生物', color: '#16A34A', icon: '🧬' },
      [Subject.HISTORY]: { name: '历史', color: '#92400E', icon: '📜' },
      [Subject.GEOGRAPHY]: { name: '地理', color: '#0284C7', icon: '🌍' },
      [Subject.POLITICS]: { name: '政治', color: '#B91C1C', icon: '⚖️' }
    };
    return subjects[subject] || { name: subject, color: '#666666', icon: '📚' };
  };

  // 获取会话的最后一条消息
  const getLastMessage = (session: ChatSession) => {
    const userMessages = session.messages.filter(msg => msg.type === 'user');
    return userMessages[userMessages.length - 1]?.content || '开始新的对话';
  };

  // 处理编辑会话标题
  const handleEditTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = (sessionId: string) => {
    if (editingTitle.trim()) {
      // 这里需要调用store的方法来更新标题
      console.log('保存标题:', sessionId, editingTitle);
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // 处理会话导出
  const handleExportSession = (sessionId: string) => {
    // 这里需要调用store的导出方法
    console.log('导出会话:', sessionId);
  };

  // 处理会话导入
  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          // 这里需要调用store的导入方法
          console.log('导入会话内容:', content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="session-sidebar">
      {/* 头部 */}
      <div className="sidebar-header">
        <div className="header-content">
          <Title level={4} className="sidebar-title">
            学习会话
          </Title>
          <Text type="secondary" className="session-count">
            {sessions.length} 个会话
          </Text>
        </div>

        <Space className="header-actions">
          <Tooltip title="导入会话">
            <Button
              type="text"
              size="small"
              icon={<ImportOutlined />}
              onClick={handleImportSession}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={onSessionCreate}
          >
            新建会话
          </Button>
        </Space>
      </div>

      {/* 会话列表 */}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <Empty
            className="empty-sessions"
            description="暂无学习会话"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onSessionCreate}
            >
              创建第一个会话
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={sessions}
            renderItem={(session) => {
              const subjectInfo = getSubjectInfo(session.subject);
              const isSelected = session.id === currentSessionId;
              const isEditing = editingSessionId === session.id;

              return (
                <List.Item
                  key={session.id}
                  className={`session-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => !isEditing && onSessionSelect(session.id)}
                >
                  <Card
                    size="small"
                    className={`session-card ${isSelected ? 'selected' : ''}`}
                    hoverable={!isEditing}
                    actions={[
                      <Tooltip title="导出" key="export">
                        <Button
                          type="text"
                          size="small"
                          icon={<ExportOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSession(session.id);
                          }}
                        />
                      </Tooltip>,
                      <Tooltip title="编辑" key="edit">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTitle(session.id, session.title);
                          }}
                        />
                      </Tooltip>,
                      <Popconfirm
                        title="确定删除这个会话吗？"
                        description="删除后无法恢复"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          onSessionDelete(session.id);
                        }}
                        key="delete"
                      >
                        <Tooltip title="删除">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Tooltip>
                      </Popconfirm>
                    ].filter(Boolean)}
                  >
                    <Meta
                      avatar={
                        <Avatar
                          size="large"
                          style={{ backgroundColor: subjectInfo.color }}
                        >
                          {subjectInfo.icon}
                        </Avatar>
                      }
                      title={
                        <div className="session-title">
                          {isEditing ? (
                            <Input
                              size="small"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onPressEnter={() => handleSaveTitle(session.id)}
                              onBlur={() => handleSaveTitle(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span>{session.title}</span>
                          )}
                          <Tag
                            size="small"
                            color={subjectInfo.color}
                            style={{ marginLeft: 8 }}
                          >
                            {subjectInfo.name}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="session-description">
                          <div className="last-message">
                            <Text type="secondary" ellipsis>
                              {getLastMessage(session)}
                            </Text>
                          </div>
                          <div className="session-meta">
                            <Space size="small" split={<span>•</span>}>
                              <span className="meta-item">
                                <MessageOutlined />
                                {session.messages.length}
                              </span>
                              <span className="meta-item">
                                <ClockCircleOutlined />
                                {formatDistanceToNow(session.updatedAt, {
                                  addSuffix: true,
                                  locale: zhCN
                                })}
                              </span>
                            </Space>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* 底部统计 */}
      <div className="sidebar-footer">
        <div className="statistics">
          <div className="stat-item">
            <Text type="secondary">总会话数</Text>
            <Text strong>{sessions.length}</Text>
          </div>
          <div className="stat-item">
            <Text type="secondary">总消息数</Text>
            <Text strong>
              {sessions.reduce((total, session) => total + session.messages.length, 0)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSidebar;