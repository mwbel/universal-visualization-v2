import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Spin, Empty, Switch, Slider, Select } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { VisualizationPanelProps, VisualizationType } from '@types/interactive';
import FunctionGraph from '@subjects/math/visualizations/FunctionGraph';
import GeometryCanvas from '@subjects/math/visualizations/GeometryCanvas';
import SequenceAnimation from '@subjects/math/visualizations/SequenceAnimation';
import './VisualizationPanel.css';

const { Option } = Select;

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  visualization,
  controls,
  isFullscreen,
  onFullscreenToggle,
  onConfigChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // 处理控制变化
  const handleControlChange = (controlId: string, value: any) => {
    const control = controls.find(c => c.id === controlId);
    if (control) {
      control.onChange(value);
    }
  };

  // 处理重新加载
  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // 处理缩放
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(200, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  // 处理导出
  const handleExport = () => {
    // 导出可视化内容
    console.log('导出可视化');
  };

  // 渲染可视化内容
  const renderVisualization = () => {
    if (!visualization || visualization.type === VisualizationType.NONE) {
      return (
        <Empty
          className="empty-visualization"
          description="暂无可视化内容"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const commonProps = {
      style: {
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top left',
        transition: 'transform 0.3s ease'
      }
    };

    switch (visualization.type) {
      case VisualizationType.FUNCTION:
        return (
          <FunctionGraph
            width={600}
            height={400}
            interactive={visualization.config?.interactive || true}
            showGrid={visualization.config?.grid !== false}
            {...commonProps}
          />
        );

      case VisualizationType.GEOMETRY:
        return (
          <GeometryCanvas
            width={600}
            height={400}
            interactive={visualization.config?.interactive || true}
            elements={visualization.data || {}}
            {...commonProps}
          />
        );

      case VisualizationType.SEQUENCE:
        return (
          <SequenceAnimation
            type={visualization.data?.type || 'arithmetic'}
            firstTerm={visualization.data?.firstTerm || 1}
            difference={visualization.data?.difference || 2}
            ratio={visualization.data?.ratio || 2}
            numTerms={visualization.data?.numTerms || 10}
            {...commonProps}
          />
        );

      default:
        return (
          <div className="visualization-placeholder">
            <h3>{visualization.config?.title || '可视化'}</h3>
            <p>类型: {visualization.type}</p>
            <pre>{JSON.stringify(visualization.data, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className={`visualization-panel ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 头部控制栏 */}
      <div className="visualization-header">
        <div className="header-left">
          <h3 className="visualization-title">
            {visualization?.config?.title || '可视化'}
          </h3>
          {visualization?.config?.description && (
            <p className="visualization-description">
              {visualization.config.description}
            </p>
          )}
        </div>

        <Space className="header-actions">
          {/* 缩放控制 */}
          <div className="zoom-controls">
            <Button
              type="text"
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={() => handleZoom(-10)}
              disabled={zoomLevel <= 50}
            />
            <span className="zoom-level">{zoomLevel}%</span>
            <Button
              type="text"
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => handleZoom(10)}
              disabled={zoomLevel >= 200}
            />
          </div>

          {/* 重新加载 */}
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReload}
            loading={isLoading}
          />

          {/* 导出 */}
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          />

          {/* 全屏切换 */}
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={onFullscreenToggle}
          />
        </Space>
      </div>

      {/* 控制面板 */}
      {controls.length > 0 && (
        <div className="visualization-controls">
          <div className="controls-title">
            <SettingOutlined /> 控制面板
          </div>
          <div className="controls-grid">
            {controls.map((control) => (
              <div key={control.id} className="control-item">
                <label className="control-label">{control.label}</label>

                {control.type === 'toggle' && (
                  <Switch
                    checked={control.value}
                    onChange={(checked) => handleControlChange(control.id, checked)}
                  />
                )}

                {control.type === 'slider' && (
                  <Slider
                    min={control.min || 0}
                    max={control.max || 100}
                    step={control.step || 1}
                    value={control.value}
                    onChange={(value) => handleControlChange(control.id, value)}
                  />
                )}

                {control.type === 'select' && (
                  <Select
                    value={control.value}
                    onChange={(value) => handleControlChange(control.id, value)}
                    style={{ width: '100%' }}
                  >
                    {control.options?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                )}

                {control.type === 'input' && (
                  <input
                    type="text"
                    value={control.value}
                    onChange={(e) => handleControlChange(control.id, e.target.value)}
                    className="control-input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 可视化内容区域 */}
      <div className="visualization-content">
        {isLoading ? (
          <div className="loading-overlay">
            <Spin size="large" />
            <p>正在加载可视化内容...</p>
          </div>
        ) : (
          <div className="visualization-wrapper">
            {renderVisualization()}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;