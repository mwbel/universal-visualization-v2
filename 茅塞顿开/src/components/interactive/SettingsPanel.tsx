import React from 'react';
import { Form, Switch, Select, Slider, Button, Space, Divider, Typography } from 'antd';
import { useInteractiveStore } from '@store/interactiveStore';
import { UserPreferences } from '@types/interactive';

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { userPreferences, updateUserPreferences } = useInteractiveStore();

  // 处理设置变化
  const handleSettingChange = (key: keyof UserPreferences, value: any) => {
    updateUserPreferences({ [key]: value });
  };

  return (
    <div className="settings-panel">
      <Title level={4}>设置</Title>

      {/* 外观设置 */}
      <div className="settings-section">
        <Title level={5}>外观设置</Title>

        <Form layout="vertical" size="small">
          <Form.Item label="主题">
            <Select
              value={userPreferences.theme}
              onChange={(value) => handleSettingChange('theme', value)}
              style={{ width: '100%' }}
            >
              <Option value="light">浅色</Option>
              <Option value="dark">深色</Option>
            </Select>
          </Form.Item>

          <Form.Item label="字体大小">
            <Select
              value={userPreferences.fontSize}
              onChange={(value) => handleSettingChange('fontSize', value)}
              style={{ width: '100%' }}
            >
              <Option value="small">小</Option>
              <Option value="medium">中</Option>
              <Option value="large">大</Option>
            </Select>
          </Form.Item>

          <Form.Item label="语言">
            <Select
              value={userPreferences.language}
              onChange={(value) => handleSettingChange('language', value)}
              style={{ width: '100%' }}
            >
              <Option value="zh-CN">简体中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>

      <Divider />

      {/* 功能设置 */}
      <div className="settings-section">
        <Title level={5}>功能设置</Title>

        <Form layout="vertical" size="small">
          <Form.Item>
            <div className="setting-item">
              <div className="setting-info">
                <Text strong>显示数学公式</Text>
                <Text type="secondary">在对话中显示LaTeX数学公式</Text>
              </div>
              <Switch
                checked={userPreferences.showFormulas}
                onChange={(checked) => handleSettingChange('showFormulas', checked)}
              />
            </div>
          </Form.Item>

          <Form.Item>
            <div className="setting-item">
              <div className="setting-info">
                <Text strong>自动播放动画</Text>
                <Text type="secondary">自动播放可视化动画</Text>
              </div>
              <Switch
                checked={userPreferences.autoPlayAnimations}
                onChange={(checked) => handleSettingChange('autoPlayAnimations', checked)}
              />
            </div>
          </Form.Item>

          <Form.Item label="默认可视化类型">
            <Select
              value={userPreferences.defaultVisualization}
              onChange={(value) => handleSettingChange('defaultVisualization', value)}
              style={{ width: '100%' }}
            >
              <Option value="function">函数图像</Option>
              <Option value="geometry">几何图形</Option>
              <Option value="sequence">数列动画</Option>
              <Option value="statistics">统计图表</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>

      <Divider />

      {/* 操作按钮 */}
      <div className="settings-actions">
        <Space>
          <Button type="primary" onClick={onClose}>
            确定
          </Button>
          <Button onClick={onClose}>
            取消
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SettingsPanel;