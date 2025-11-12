import React, { useState, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Spin,
  Empty,
  Switch,
  Slider,
  Select,
  InputNumber,
  ColorPicker,
  Divider,
  Tooltip,
  Dropdown,
  Modal,
  Drawer
} from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  CompressOutlined,
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
  EyeOutlined,
  ToolOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { VisualizationPanelProps, VisualizationType } from '@types/interactive';
import { Subject } from '@types/index';
import FunctionGraph from '@subjects/math/visualizations/FunctionGraph';
import GeometryCanvas from '@subjects/math/visualizations/GeometryCanvas';
import SequenceAnimation from '@subjects/math/visualizations/SequenceAnimation';
import './EnhancedVisualizationPanel.css';

const { Option } = Select;

// 学科模板配置
const subjectTemplates = {
  [Subject.MATH]: [
    {
      id: 'function_basic',
      name: '基础函数',
      type: 'function',
      defaultConfig: {
        functions: [
          { name: 'f(x) = x²', equation: (x: number) => x * x, color: '#7C3AED' },
          { name: 'g(x) = 2x + 1', equation: (x: number) => 2 * x + 1, color: '#DC2626' }
        ],
        xDomain: [-10, 10],
        yDomain: [-10, 10],
        showGrid: true,
        showAxes: true
      },
      parameters: [
        { id: 'xMin', label: 'X最小值', type: 'number', min: -100, max: -1, default: -10 },
        { id: 'xMax', label: 'X最大值', type: 'number', min: 1, max: 100, default: 10 },
        { id: 'yMin', label: 'Y最小值', type: 'number', min: -100, max: -1, default: -10 },
        { id: 'yMax', label: 'Y最大值', type: 'number', min: 1, max: 100, default: 10 }
      ]
    },
    {
      id: 'geometry_basic',
      name: '几何图形',
      type: 'geometry',
      defaultConfig: {
        elements: {
          points: [
            { x: 0, y: 0, label: 'O' },
            { x: 4, y: 3, label: 'A' }
          ],
          circles: [
            { center: { x: 2, y: 2 }, radius: 3, color: '#10B981', fill: false }
          ],
          triangles: [
            {
              points: [
                { x: 0, y: 0 },
                { x: 4, y: 0 },
                { x: 0, y: 3 }
              ],
              color: '#7C3AED',
              fill: true
            }
          ]
        },
        showGrid: true,
        showAxes: true,
        interactive: true
      },
      parameters: [
        { id: 'gridSize', label: '网格大小', type: 'number', min: 10, max: 50, default: 20 },
        { id: 'lineWidth', label: '线条宽度', type: 'number', min: 1, max: 10, default: 2 }
      ]
    },
    {
      id: 'sequence_arithmetic',
      name: '等差数列',
      type: 'sequence',
      defaultConfig: {
        type: 'arithmetic',
        firstTerm: 2,
        difference: 3,
        numTerms: 8,
        animationSpeed: 1000
      },
      parameters: [
        { id: 'firstTerm', label: '首项 a₁', type: 'number', min: -50, max: 50, default: 2 },
        { id: 'difference', label: '公差 d', type: 'number', min: -20, max: 20, default: 3 },
        { id: 'numTerms', label: '项数 n', type: 'number', min: 1, max: 20, default: 8 },
        { id: 'animationSpeed', label: '动画速度(ms)', type: 'number', min: 500, max: 3000, default: 1000 }
      ]
    }
  ],
  [Subject.PHYSICS]: [
    {
      id: 'motion_graph',
      name: '运动图像',
      type: 'function',
      defaultConfig: {
        functions: [
          { name: '位移-时间', equation: (t: number) => 0.5 * 9.8 * t * t, color: '#DC2626' },
          { name: '速度-时间', equation: (t: number) => 9.8 * t, color: '#2563EB' }
        ],
        xDomain: [0, 10],
        yDomain: [0, 100],
        showGrid: true,
        showAxes: true
      },
      parameters: [
        { id: 'gravity', label: '重力加速度', type: 'number', min: 1, max: 20, default: 9.8 },
        { id: 'timeMax', label: '时间最大值', type: 'number', min: 5, max: 20, default: 10 }
      ]
    }
  ]
};

interface EnhancedVisualizationPanelProps extends VisualizationPanelProps {
  subject?: Subject;
}

interface HistoryState {
  past: any[];
  present: any;
  future: any[];
}

const EnhancedVisualizationPanel: React.FC<EnhancedVisualizationPanelProps> = ({
  visualization,
  controls,
  isFullscreen,
  onFullscreenToggle,
  onConfigChange,
  subject = Subject.MATH
}) => {
  // 状态管理
  const [currentTemplate, setCurrentTemplate] = useState(subjectTemplates[subject]?.[0]);
  const [templateVisible, setTemplateVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentConfig, setCurrentConfig] = useState(visualization?.config || {});
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: currentConfig,
    future: []
  });

  const vizRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // 处理模板切换
  const handleTemplateChange = useCallback((templateId: string) => {
    const template = subjectTemplates[subject]?.find(t => t.id === templateId);
    if (template) {
      setCurrentTemplate(template);
      const newConfig = { ...template.defaultConfig, ...currentConfig };
      setCurrentConfig(newConfig);
      onConfigChange?.(newConfig);
    }
    setTemplateVisible(false);
  }, [subject, currentConfig, onConfigChange]);

  // 处理参数变化
  const handleParameterChange = useCallback((paramId: string, value: any) => {
    const newConfig = { ...currentConfig, [paramId]: value };

    // 添加到历史记录
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newConfig,
      future: []
    }));

    setCurrentConfig(newConfig);
    onConfigChange?.(newConfig);
  }, [currentConfig, onConfigChange]);

  // 撤销/重做
  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      setCurrentConfig(previous);
      onConfigChange?.(previous);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, [onConfigChange]);

  const handleRedo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      setCurrentConfig(next);
      onConfigChange?.(next);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, [onConfigChange]);

  // 重置参数
  const handleReset = useCallback(() => {
    if (currentTemplate) {
      const resetConfig = currentTemplate.defaultConfig;
      setCurrentConfig(resetConfig);
      onConfigChange?.(resetConfig);
      setHistory({
        past: [],
        present: resetConfig,
        future: []
      });
    }
  }, [currentTemplate, onConfigChange]);

  // 缩放控制
  const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(50, prev - 10));
  const handleZoomReset = () => setZoomLevel(100);

  // 全屏控制
  const handleMaximizeToggle = () => setIsMaximized(!isMaximized);

  // 导出功能
  const handleExport = () => {
    const exportData = {
      template: currentTemplate?.id,
      config: currentConfig,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 重新加载
  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // 渲染可视化内容
  const renderVisualization = () => {
    if (!visualization || visualization.type === VisualizationType.NONE) {
      return (
        <Empty
          className="empty-visualization"
          description={
            <div>
              <p>暂无可视化内容</p>
              <Button type="primary" onClick={() => setTemplateVisible(true)}>
                选择模板
              </Button>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const vizProps = {
      ...visualization.data,
      ...currentConfig,
      style: {
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'center',
        transition: 'transform 0.3s ease'
      }
    };

    switch (visualization.type) {
      case VisualizationType.FUNCTION:
        return <FunctionGraph {...vizProps} />;
      case VisualizationType.GEOMETRY:
        return <GeometryCanvas {...vizProps} />;
      case VisualizationType.SEQUENCE:
        return <SequenceAnimation {...vizProps} />;
      default:
        return (
          <div className="visualization-placeholder">
            <h3>{currentConfig?.title || '可视化'}</h3>
            <p>类型: {visualization.type}</p>
            <pre>{JSON.stringify(visualization.data, null, 2)}</pre>
          </div>
        );
    }
  };

  // 渲染参数控制
  const renderParameterControls = () => {
    if (!currentTemplate?.parameters) return null;

    return (
      <div className="parameter-controls">
        <div className="controls-header">
          <h4>参数控制</h4>
          <Space>
            <Tooltip title="重置参数">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              />
            </Tooltip>
          </Space>
        </div>

        <div className="controls-grid">
          {currentTemplate.parameters.map((param) => (
            <div key={param.id} className="control-item">
              <label className="control-label">{param.label}</label>

              {param.type === 'number' && (
                <InputNumber
                  value={currentConfig[param.id] || param.default}
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  onChange={(value) => handleParameterChange(param.id, value)}
                  style={{ width: '100%' }}
                />
              )}

              {param.type === 'slider' && (
                <Slider
                  value={currentConfig[param.id] || param.default}
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  onChange={(value) => handleParameterChange(param.id, value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 工具栏菜单
  const toolbarMenuItems = [
    {
      key: 'template',
      label: '选择模板',
      icon: <ToolOutlined />,
      onClick: () => setTemplateVisible(true)
    },
    {
      key: 'settings',
      label: '高级设置',
      icon: <SettingOutlined />,
      onClick: () => setSettingsVisible(true)
    },
    {
      key: 'export',
      label: '导出配置',
      icon: <DownloadOutlined />,
      onClick: handleExport
    },
    {
      key: 'divider1',
      type: 'divider'
    },
    {
      key: 'undo',
      label: '撤销',
      icon: <UndoOutlined />,
      onClick: handleUndo,
      disabled: history.past.length === 0
    },
    {
      key: 'redo',
      label: '重做',
      icon: <RedoOutlined />,
      onClick: handleRedo,
      disabled: history.future.length === 0
    }
  ];

  return (
    <div className={`enhanced-visualization-panel ${isFullscreen ? 'fullscreen' : ''} ${isMaximized ? 'maximized' : ''}`}>
      {/* 顶部工具栏 */}
      <div className="viz-toolbar">
        <div className="toolbar-left">
          <Space>
            <Dropdown
              menu={{ items: toolbarMenuItems }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button icon={<ToolOutlined />}>
                工具
              </Button>
            </Dropdown>

            {currentTemplate && (
              <div className="template-info">
                <span className="template-name">{currentTemplate.name}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => setTemplateVisible(true)}
                >
                  切换模板
                </Button>
              </div>
            )}
          </Space>
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <Tooltip title="缩小">
              <Button
                type="text"
                size="small"
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
              />
            </Tooltip>
            <span className="zoom-level">{zoomLevel}%</span>
            <Tooltip title="放大">
              <Button
                type="text"
                size="small"
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
              />
            </Tooltip>
            <Tooltip title="重置缩放">
              <Button
                type="text"
                size="small"
                onClick={handleZoomReset}
              >
                100%
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="toolbar-right">
          <Space>
            <Tooltip title="最大化/还原">
              <Button
                type="text"
                size="small"
                icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={handleMaximizeToggle}
              />
            </Tooltip>

            <Tooltip title="重新加载">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReload}
                loading={isLoading}
              />
            </Tooltip>

            <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
              <Button
                type="text"
                size="small"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={onFullscreenToggle}
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      <div className="viz-content-container">
        {/* 参数控制面板 */}
        {renderParameterControls()}

        {/* 可视化内容区域 */}
        <div className="viz-content" ref={vizRef}>
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

      {/* 模板选择抽屉 */}
      <Drawer
        title="选择可视化模板"
        placement="left"
        onClose={() => setTemplateVisible(false)}
        open={templateVisible}
        width={300}
      >
        <div className="template-list">
          {subjectTemplates[subject]?.map((template) => (
            <Card
              key={template.id}
              size="small"
              className={`template-card ${currentTemplate?.id === template.id ? 'selected' : ''}`}
              hoverable
              onClick={() => handleTemplateChange(template.id)}
            >
              <Card.Meta
                title={template.name}
                description={`类型: ${template.type}`}
              />
            </Card>
          ))}
        </div>
      </Drawer>

      {/* 高级设置抽屉 */}
      <Drawer
        title="高级设置"
        placement="right"
        onClose={() => setSettingsVisible(false)}
        open={settingsVisible}
        width={360}
      >
        <div className="advanced-settings">
          <div className="setting-group">
            <h4>显示设置</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="setting-item">
                <span>显示网格</span>
                <Switch
                  checked={currentConfig.showGrid}
                  onChange={(checked) => handleParameterChange('showGrid', checked)}
                />
              </div>
              <div className="setting-item">
                <span>显示坐标轴</span>
                <Switch
                  checked={currentConfig.showAxes}
                  onChange={(checked) => handleParameterChange('showAxes', checked)}
                />
              </div>
              <div className="setting-item">
                <span>启用动画</span>
                <Switch
                  checked={currentConfig.animation}
                  onChange={(checked) => handleParameterChange('animation', checked)}
                />
              </div>
            </Space>
          </div>

          <div className="setting-group">
            <h4>颜色设置</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="setting-item">
                <span>主题颜色</span>
                <ColorPicker
                  value={currentConfig.themeColor}
                  onChange={(color) => handleParameterChange('themeColor', color.toHexString())}
                />
              </div>
            </Space>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default EnhancedVisualizationPanel;