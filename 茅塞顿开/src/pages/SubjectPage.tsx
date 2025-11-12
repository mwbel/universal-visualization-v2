import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Breadcrumb,
  Avatar,
  Tag,
  Input,
  Modal,
  Empty,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
  BookOutlined,
  AppstoreOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { Subject } from '@types/index';
import { getSubjectInfo } from '@utils/subjects';
import { getSubjectTemplates, getTemplateById, SubjectTemplate } from '@data/subjectTemplates';
import EnhancedVisualizationPanel from '@components/interactive/EnhancedVisualizationPanel';
import useInteractiveStore from '@store/interactiveStore';
import './SubjectPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const SubjectPage: React.FC = () => {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { createSession, sendMessage } = useInteractiveStore();

  // 本地状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SubjectTemplate | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templates, setTemplates] = useState<SubjectTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SubjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 验证学科参数
  if (!subject || !Object.values(Subject).includes(subject as Subject)) {
    navigate('/subjects');
    return null;
  }

  const subjectEnum = subject as Subject;

  // 获取学科信息
  const subjectInfo = getSubjectInfo(subjectEnum);

  // 模板分类
  const getCategories = () => {
    const categories = new Map();
    templates.forEach(template => {
      if (!categories.has(template.category)) {
        categories.set(template.category, []);
      }
      categories.get(template.category).push(template);
    });
    return Array.from(categories.entries());
  };

  // 搜索过滤
  useEffect(() => {
    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);

  // 初始化数据
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const subjectTemplates = getSubjectTemplates(subjectEnum);
      setTemplates(subjectTemplates);
      setFilteredTemplates(subjectTemplates);
      setLoading(false);
    }, 500);
  }, [subjectEnum]);

  // 处理模板选择
  const handleTemplateSelect = (template: SubjectTemplate) => {
    setSelectedTemplate(template);
    setTemplateModalVisible(true);

    // 创建该学科的学习会话
    createSession(subjectEnum, `${subjectInfo.displayName} - ${template.name}`);
  };

  // 处理关闭模态框
  const handleModalClose = () => {
    setTemplateModalVisible(false);
    setSelectedTemplate(null);
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: SubjectTemplate) => (
    <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
      <Card
        className="template-card"
        hoverable
        onClick={() => handleTemplateSelect(template)}
        actions={[
          <Button type="primary" size="small">
            开始学习
          </Button>
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar size="large" style={{ backgroundColor: subjectInfo.color }}>
              {template.icon}
            </Avatar>
          }
          title={
            <div className="template-title">
              {template.name}
              <Tag color={subjectInfo.color} size="small" style={{ marginLeft: 8 }}>
                {template.category}
              </Tag>
            </div>
          }
          description={template.description}
        />
      </Card>
    </Col>
  );

  // 渲染分类分组
  const renderCategoryGroup = (categoryName: string, categoryTemplates: SubjectTemplate[]) => (
    <div key={categoryName} className="category-section">
      <Title level={4} className="category-title">
        {categoryName} ({categoryTemplates.length})
      </Title>
      <Row gutter={[16, 16]} className="category-templates">
        {categoryTemplates.map(renderTemplateCard)}
      </Row>
    </div>
  );

  return (
    <Layout className="subject-page">
      <Header className="subject-header">
        <div className="header-content">
          <div className="header-top">
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/')}
                className="back-button"
              >
                返回首页
              </Button>
              <Avatar size="large" style={{ backgroundColor: subjectInfo.color }}>
                {subjectInfo.icon}
              </Avatar>
              <div>
                <Title level={3} className="subject-title">
                  {subjectInfo.displayName}
                </Title>
                <Text type="secondary" className="subject-description">
                  {subjectInfo.description}
                </Text>
              </div>
            </Space>
          </div>

          <div className="header-actions">
            <Input
              placeholder="搜索模板..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button icon={<BookOutlined />} type="default">
              学习指南
            </Button>
            <Button icon={<ShareAltOutlined />} type="default">
              分享
            </Button>
          </div>
        </div>

        <Breadcrumb className="breadcrumb">
          <Breadcrumb.Item>
            <Link to="/">首页</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to={`/subjects/${subjectEnum}`}>{subjectInfo.displayName}</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>可视化模板</Breadcrumb.Item>
        </Breadcrumb>
      </Header>

      <Content className="subject-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <Text>正在加载模板...</Text>
          </div>
        ) : (
          <>
            {/* 统计信息 */}
            <div className="stats-section">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-number">{templates.length}</div>
                      <div className="stat-label">可用模板</div>
                    </div>
                    <div className="stat-icon">
                      <AppstoreOutlined />
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-number">{getCategories().length}</div>
                      <div className="stat-label">分类数量</div>
                    </div>
                    <div className="stat-icon">
                      <BookOutlined />
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-number">{filteredTemplates.length}</div>
                      <div className="stat-label">搜索结果</div>
                    </div>
                    <div className="stat-icon">
                      <SearchOutlined />
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <div className="stat-content">
                      <div className="stat-number">4.8</div>
                      <div className="stat-label">平均评分</div>
                    </div>
                    <div className="stat-icon">
                      <StarOutlined />
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* 模板列表 */}
            {filteredTemplates.length === 0 ? (
              <Empty
                className="empty-state"
                description="没有找到匹配的模板"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : searchTerm ? (
              <div className="search-results">
                <Title level={4} className="results-title">
                  搜索结果 ({filteredTemplates.length})
                </Title>
                <Row gutter={[16, 16]}>
                  {filteredTemplates.map(renderTemplateCard)}
                </Row>
              </div>
            ) : (
              <div className="categories-container">
                {getCategories().map(([categoryName, categoryTemplates]) =>
                  renderCategoryGroup(categoryName, categoryTemplates)
                )}
              </div>
            )}
          </>
        )}
      </Content>

      {/* 模板详情模态框 */}
      <Modal
        title={
          <div className="modal-title">
            <Avatar size="large" style={{ backgroundColor: subjectInfo.color, marginRight: 12 }}>
              {selectedTemplate?.icon}
            </Avatar>
            {selectedTemplate?.name}
          </div>
        }
        open={templateModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        className="template-modal"
      >
        {selectedTemplate && (
          <div className="template-detail">
            <div className="template-header">
              <div className="template-meta">
                <Space size="large">
                  <Tag color={subjectInfo.color}>{selectedTemplate.category}</Tag>
                  <Tag color="default">{selectedTemplate.visualizationType}</Tag>
                </Space>
                <Space>
                  <Button icon={<EyeOutlined />} size="small">
                    预览
                  </Button>
                  <Button icon={<HeartOutlined />} size="small">
                    收藏
                  </Button>
                  <Button icon={<ShareAltOutlined />} size="small">
                    分享
                  </Button>
                </Space>
              </div>
              <Text>{selectedTemplate.description}</Text>
            </div>

            <div className="template-visualization">
              <Title level={5}>可视化预览</Title>
              <div className="preview-container">
                <div dangerouslySetInnerHTML={{
                  __html: selectedTemplate.render(selectedTemplate.defaultConfig)
                }} />
              </div>
            </div>

            <div className="template-parameters">
              <Title level={5}>参数设置</Title>
              <div className="parameters-grid">
                {selectedTemplate.parameters.map((param) => (
                  <div key={param.id} className="parameter-item">
                    <Text strong className="parameter-label">{param.label}</Text>
                    <div className="parameter-value">
                      {param.type === 'toggle' ? (
                        <Tag color={selectedTemplate.defaultConfig[param.id] ? 'green' : 'default'}>
                          {selectedTemplate.defaultConfig[param.id] ? '开启' : '关闭'}
                        </Tag>
                      ) : (
                        <Text code>{selectedTemplate.defaultConfig[param.id]}</Text>
                      )}
                    </div>
                    {param.description && (
                      <Text type="secondary" className="parameter-desc">
                        {param.description}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default SubjectPage;