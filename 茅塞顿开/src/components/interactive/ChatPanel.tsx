import React, { useState, useRef, useEffect } from 'react';
import { Layout, Typography, Avatar, Button, Space, Tooltip, Spin, Empty } from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  CopyOutlined,
  ThumbsUpOutlined,
  ThumbsDownOutlined,
  RedoOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Message, MessageType } from '@types/interactive';
import MessageInput from './MessageInput';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import './ChatPanel.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  supportFormula?: boolean;
  placeholder?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  supportFormula = true,
  placeholder = '请输入你的问题...'
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // 这里可以添加复制成功的提示
  };

  // 重新生成AI回复
  const regenerateResponse = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.type === MessageType.USER) {
        // 删除当前AI回复和后续消息，然后重新发送用户消息
        const messagesToKeep = messages.slice(0, messageIndex);
        // 这里需要调用store方法来更新消息列表
        onSendMessage(previousMessage.content);
      }
    }
  };

  // 渲染消息内容
  const renderMessageContent = (message: Message) => {
    const content = message.content;

    // 检查是否包含数学公式
    const hasMathFormula = /\$.*\$|\\\(.*\\\)|\\\[.*\\\]/.test(content);

    if (hasMathFormula && supportFormula) {
      // 处理包含LaTeX公式的消息
      return (
        <div className="message-content-with-formula">
          <ReactMarkdown
            className="markdown-content"
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';

                // 检查是否是数学公式
                if (language === 'math' || (typeof children === 'string' && children.includes('\\') && !match)) {
                  try {
                    // 这里需要集成KaTeX
                    return <code className="math-formula">{children}</code>;
                  } catch (error) {
                    return <code {...props}>{children}</code>;
                  }
                }

                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneLight}
                    language={language}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // 普通Markdown渲染
    return (
      <ReactMarkdown
        className="markdown-content"
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneLight}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // 渲染单条消息
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.type === MessageType.USER;
    const isAI = message.type === MessageType.AI;
    const isSystem = message.type === MessageType.SYSTEM;
    const isError = message.type === MessageType.ERROR;

    return (
      <div
        key={message.id}
        className={`message-item ${message.type} ${isUser ? 'user' : 'ai'}`}
        onMouseEnter={() => setHoveredMessage(message.id)}
        onMouseLeave={() => setHoveredMessage(null)}
      >
        <div className="message-wrapper">
          {/* 头像 */}
          <div className="message-avatar">
            <Avatar
              size={36}
              icon={
                isUser ? <UserOutlined /> :
                isAI ? <RobotOutlined /> :
                isError ? <DeleteOutlined /> :
                <RobotOutlined />
              }
              style={{
                backgroundColor: isUser ? '#7C3AED' :
                isAI ? '#10B981' :
                isError ? '#EF4444' : '#6B7280'
              }}
            />
          </div>

          {/* 消息内容 */}
          <div className="message-content-wrapper">
            <div className="message-header">
              <Text strong className="message-sender">
                {isUser ? '你' : isAI ? 'AI助手' : isError ? '错误' : '系统'}
              </Text>
              <Text type="secondary" className="message-time">
                {formatDistanceToNow(new Date(message.timestamp), {
                  addSuffix: true,
                  locale: zhCN
                })}
              </Text>
            </div>

            <div className="message-bubble">
              {renderMessageContent(message)}
            </div>

            {/* 消息操作按钮 */}
            {hoveredMessage === message.id && !isSystem && (
              <div className="message-actions">
                <Space>
                  <Tooltip title="复制">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyMessage(message.content)}
                    />
                  </Tooltip>

                  {isAI && (
                    <>
                      <Tooltip title="重新生成">
                        <Button
                          type="text"
                          size="small"
                          icon={<RedoOutlined />}
                          onClick={() => regenerateResponse(message.id)}
                        />
                      </Tooltip>
                      <Tooltip title="有帮助">
                        <Button
                          type="text"
                          size="small"
                          icon={<ThumbsUpOutlined />}
                        />
                      </Tooltip>
                      <Tooltip title="没有帮助">
                        <Button
                          type="text"
                          size="small"
                          icon={<ThumbsDownOutlined />}
                        />
                      </Tooltip>
                    </>
                  )}
                </Space>
              </div>
            )}

            {/* 可视化指示器 */}
            {message.visualization && message.visualization.type !== 'none' && (
              <div className="visualization-indicator">
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    // 滚动到可视化区域
                    const vizPanel = document.querySelector('.visualization-panel-wrapper');
                    if (vizPanel) {
                      vizPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  查看可视化 →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 回复线 */}
        {replyingTo === message.id && (
          <div className="reply-line"></div>
        )}
      </div>
    );
  };

  return (
    <Layout className="chat-panel">
      <Header className="chat-header">
        <div className="header-content">
          <Title level={4} className="chat-title">
            对话
          </Title>
          <div className="header-stats">
            <Text type="secondary">
              {messages.length} 条消息
            </Text>
          </div>
        </div>
      </Header>

      <Content className="chat-content">
        <div className="messages-container">
          {messages.length === 0 ? (
            <Empty
              className="empty-messages"
              description="开始你的学习之旅"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => renderMessage(message, index))}

              {/* 加载指示器 */}
              {isLoading && (
                <div className="message-item ai loading">
                  <div className="message-wrapper">
                    <div className="message-avatar">
                      <Avatar size={36} icon={<RobotOutlined />} />
                    </div>
                    <div className="message-content-wrapper">
                      <div className="message-bubble loading-bubble">
                        <Spin size="small" />
                        <Text type="secondary">正在思考...</Text>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </Content>

      {/* 输入区域 */}
      <div className="chat-input-container">
        <MessageInput
          onSend={onSendMessage}
          placeholder={placeholder}
          disabled={isLoading}
          supportFormula={supportFormula}
          suggestions={[
            '解释函数的概念',
            '绘制二次函数图像',
            '什么是等差数列？',
            '如何计算三角函数值？'
          ]}
        />
      </div>
    </Layout>
  );
};

export default ChatPanel;