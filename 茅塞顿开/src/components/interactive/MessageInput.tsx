import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Space, Dropdown, Popover, Tag, AutoComplete } from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  SmileOutlined,
  CalculatorOutlined,
  FunctionOutlined,
  HistoryOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { MessageInputProps } from '@types/interactive';
import './MessageInput.css';

const { TextArea } = Input;

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = '请输入你的问题...',
  disabled = false,
  supportFormula = true,
  suggestions = []
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textAreaRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 数学公式快捷模板
  const mathTemplates = [
    { label: '分数', value: '\\frac{a}{b}', icon: '½' },
    { label: '根号', value: '\\sqrt{x}', icon: '√' },
    { label: '求和', value: '\\sum_{i=1}^{n}', icon: 'Σ' },
    { label: '积分', value: '\\int', icon: '∫' },
    { label: '极限', value: '\\lim_{x \\to \\infty}', icon: 'lim' },
    { label: '矩阵', value: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}', icon: '[ ]' },
    { label: '上标', value: 'x^{2}', icon: 'x²' },
    { label: '下标', value: 'x_{1}', icon: 'x₁' }
  ];

  // 表情符号
  const emojis = [
    '😊', '😔', '🤔', '💡', '👍', '👎', '🎉', '🔥',
    '❤️', '⭐', '✅', '❌', '➡️', '⬅️', '⬆️', '⬇️'
  ];

  // 处理发送消息
  const handleSend = useCallback(() => {
    if (message.trim() && !disabled && !isComposing) {
      onSend(message.trim());
      setMessage('');
      setShowSuggestions(false);
    }
  }, [message, disabled, isComposing, onSend]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setMessage('');
      setShowSuggestions(false);
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
    }
  };

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    setCursorPosition(e.target.selectionStart);

    // 检查是否需要显示建议
    if (newMessage.endsWith('?') || newMessage.includes('如何') || newMessage.includes('什么是')) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 处理快捷键点击
  const handleShortcutClick = (template: string) => {
    const newMessage = message.slice(0, cursorPosition) + template + message.slice(cursorPosition);
    setMessage(newMessage);
    setCursorPosition(cursorPosition + template.length);

    // 设置光标位置
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.resizableTextArea.textArea.setSelectionRange(
          cursorPosition + template.length,
          cursorPosition + template.length
        );
      }
    }, 0);
  };

  // 处理表情点击
  const handleEmojiClick = (emoji: string) => {
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    setMessage(newMessage);
    setCursorPosition(cursorPosition + emoji.length);
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里可以处理文件上传逻辑
      console.log('上传文件:', file);
      // 暂时添加文件名到消息中
      const newMessage = message + `\n[附件: ${file.name}]`;
      setMessage(newMessage);
    }
  };

  // 插入建议内容
  const insertSuggestion = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
  };

  // 清空输入
  const handleClear = () => {
    setMessage('');
    setShowSuggestions(false);
  };

  // 渲染数学公式菜单
  const mathMenuItems = mathTemplates.map((template, index) => ({
    key: index,
    label: (
      <div className="math-template-item">
        <span className="math-icon">{template.icon}</span>
        <span className="math-label">{template.label}</span>
        <span className="math-value">{template.value}</span>
      </div>
    ),
    onClick: () => handleShortcutClick(template.value)
  }));

  // 渲染表情菜单
  const emojiMenuItems = emojis.map((emoji, index) => ({
    key: index,
    label: (
      <div className="emoji-item">
        <span className="emoji-symbol">{emoji}</span>
      </div>
    ),
    onClick: () => handleEmojiClick(emoji)
  }));

  return (
    <div className="message-input">
      {/* 建议提示 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-popup">
          <div className="suggestions-header">
            <span>相关问题建议：</span>
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={() => setShowSuggestions(false)}
            />
          </div>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => insertSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="input-toolbar">
        <Space>
          {/* 数学公式工具 */}
          {supportFormula && (
            <Dropdown
              menu={{ items: mathMenuItems }}
              trigger={['click']}
              placement="topLeft"
            >
              <Button
                type="text"
                size="small"
                icon={<CalculatorOutlined />}
                title="数学公式"
              />
            </Dropdown>
          )}

          {/* 表情工具 */}
          <Dropdown
            menu={{ items: emojiMenuItems }}
            trigger={['click']}
            placement="topLeft"
          >
            <Button
              type="text"
              size="small"
              icon={<SmileOutlined />}
              title="表情"
            />
          </Dropdown>

          {/* 文件上传 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            type="text"
            size="small"
            icon={<PaperClipOutlined />}
            title="上传文件"
            onClick={() => fileInputRef.current?.click()}
          />

          {/* 函数工具 */}
          {supportFormula && (
            <Button
              type="text"
              size="small"
              icon={<FunctionOutlined />}
              title="函数工具"
            />
          )}
        </Space>

        <Space>
          {/* 历史记录 */}
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined />}
            title="输入历史"
          />

          {/* 清空按钮 */}
          {message && (
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              title="清空"
              onClick={handleClear}
            />
          )}
        </Space>
      </div>

      {/* 输入区域 */}
      <div className="input-container">
        <TextArea
          ref={textAreaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={{ minRows: 1, maxRows: 6 }}
          className="message-textarea"
        />

        {/* 发送按钮 */}
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!message.trim() || disabled || isComposing}
          className="send-button"
        >
          发送
        </Button>
      </div>

      {/* 输入提示 */}
      <div className="input-hints">
        <Space split={<span className="hint-divider">•</span>}>
          <span className="hint-item">Enter 发送</span>
          <span className="hint-item">Shift+Enter 换行</span>
          {supportFormula && <span className="hint-item">支持 LaTeX 数学公式</span>}
        </Space>
      </div>
    </div>
  );
};

export default MessageInput;