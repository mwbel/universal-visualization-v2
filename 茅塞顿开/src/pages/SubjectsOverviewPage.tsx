import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  Progress,
  Space,
  Avatar,
  Button,
  Tag,
  Empty
} from 'antd';
import {
  BookOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  RocketOutlined
  ArrowRightOutlined
} from '@ant-design/icons';
import { getAllSubjects } from '@utils/subjects';
import { Subject } from '@types/index';
import { getSubjectTemplates } from '@data/subjectTemplates';
import './SubjectsOverviewPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface SubjectStats {
  total: number;
  available: number;
  templates: Record<string, number>;
  categories: Record<string, number>;
}

const SubjectsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SubjectStats>({
    total: 0,
    available: 0,
    templates: {},
    categories: {}
  });

  // 计算统计信息
  useEffect(() => {
    const subjects = getAllSubjects();
    let totalTemplates = 0;
    let availableSubjects = 0;
    const subjectTemplateCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    subjects.forEach(subject => {
      const templates = getSubjectTemplates(subject);
      subjectTemplateCounts[subject.name] = templates.length;

      if (templates.length > 0) {
        availableSubjects++;
      }

      totalTemplates += templates.length;

      templates.forEach(template => {
        categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
      });
    });

    setStats({
      total: subjects.length,
      available: availableSubjects,
      templates: subjectTemplateCounts,
      categories: categoryCounts
    });
  }, []);

  // 获取学科模板统计
  const getTemplateStats = (subject: Subject) => {
    const templates = getSubjectTemplates(subject);
    return {
      count: templates.length,
      categories: [...new Set(templates.map(t => t.category))].length
    };
  };

  // 渲染统计卡片
  const renderStatCard = (title: string, value: number, icon: React.ReactNode, color: string, description?: string) => (
    <Col span={6}>
      <Card>
        <Statistic
          title={title}
          value={value}
          precision={value < 10 ? 1 : 0}
          prefix={icon}
          valueStyle={{ color }}
          className="stat-card"
        />
        {description && <div className="stat-description">{description}</div>}
      </Card>
    </Col>
  );

  return (
    <Layout className="subjects-overview-page">
      <Header className="overview-header">
        <div className="header-content">
          <Title level={2}>
            <RocketOutlined /> 学科概览
          </Title>
          <Text type="secondary">
            "茅塞顿开" 高中全科可视化学习平台 - 涵盖九大学科，提供丰富的可视化模板
          </Text>
        </div>
      </Header>

      <Content className="overview-content">
        {/* 总体统计 */}
        <div className="overview-stats">
          <Title level={4}>总体统计</Title>
          <Row gutter={[16, 16]}>
            {renderStatCard(
              "学科总数",
              stats.total,
              <BookOutlined />,
              '#1890ff',
              "涵盖高中全部九大学科"
            )}
            {renderStatCard(
              "可用学科",
              stats.available,
              <AppstoreOutlined />,
              '#52c41a',
              "已开发可视化功能"
            )}
            {renderStatCard(
              "模板总数",
              Object.values(stats.templates).reduce((sum, count) => sum + count, 0),
              <ExperimentOutlined />,
              '#fa8c16',
              "跨学科模板总数"
            )}
            {renderStatCard(
              "分类数量",
              Object.keys(stats.categories).length,
              <LineChartOutlined />,
              '#13c2c2',
              "模板分类总数"
            )}
          </Row>
        </div>

        {/* 学科概览卡片 */}
        <div className="subjects-grid">
          <Title level={4}>学科详情</Title>
          <Row gutter={[16, 16]}>
            {getAllSubjects().map((subject) => {
              const templateStats = getTemplateStats(subject);
              const isAvailable = templateStats.count > 0;
              const availabilityRate = (templateStats.count / 10) * 100; // 假设每个学科10个模板

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={subject.id}>
                  <Card
                    className={`subject-overview-card ${isAvailable ? 'available' : 'unavailable'}`}
                    hoverable
                    onClick={() => navigate(`/subjects/${subject.name}`)}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar size="large" style={{ backgroundColor: subject.color }}>
                          {subject.icon}
                        </Avatar>
                      }
                      title={
                        <div className="card-title">
                          {subject.displayName}
                        </div>
                      }
                      description={
                        <div className="card-description">
                          {subject.description}
                          <div className="card-stats">
                            <Space split="·" className="stats-space">
                              <Tag color={isAvailable ? 'green' : 'default'}>
                                {isAvailable ? '可用' : '开发中'}
                              </Tag>
                              <Tag color="blue">
                                {templateStats.count} 个模板
                              </Tag>
                              <Tag color="orange">
                                {templateStats.categories} 个分类
                              </Tag>
                            </Space>
                          </div>
                        </div>
                      }
                    />

                    {/* 进度条 */}
                    {isAvailable && (
                      <div className="progress-section">
                        <div className="progress-info">
                          <Text type="secondary" className="progress-text">
                            模板完成度
                          </Text>
                          <Text strong>{availabilityRate.toFixed(0)}%</Text>
                        </div>
                        <Progress
                          percent={availabilityRate}
                          strokeColor={subject.color}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>

        {/* 模板分类统计 */}
        <div className="categories-overview">
          <Title level={4}>分类分布</Title>
          <Row gutter={[16, 16]}>
            {Object.entries(stats.categories)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <Col xs={12} sm={8} md={6} lg={4} key={category}>
                  <Card>
                    <Statistic
                      title={category}
                      value={count}
                      prefix={<ExperimentOutlined />}
                      className="category-stat"
                    />
                  </Card>
                </Col>
              ))}
          </Row>
        </div>

        {/* 开发进度 */}
        <div className="progress-overview">
          <Title level={4}>开发进度</Title>
          <Card>
            <div className="progress-content">
              <div className="progress-item">
                <div className="progress-info">
                  <Text strong>总体完成度</Text>
                  <Text type="secondary">{Math.round((stats.available / stats.total) * 100)}%</Text>
                </div>
                <Progress
                  percent={(stats.available / stats.total) * 100}
                  strokeColor="#52c41a"
                  size="large"
                  strokeWidth={8}
                />
              </div>
              <div className="progress-legend">
                <Space direction="vertical" size="large">
                  <div className="legend-item">
                    <div className="legend-dot available"></div>
                    <Text>已完成开发</Text>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot in-progress"></div>
                    <Text>开发中</Text>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot planned"></div>
                    <Text>计划中</Text>
                  </div>
                </Space>
              </div>
            </div>
          </Card>
        </div>

        {/* 快速入口 */}
        <div className="quick-actions">
          <Title level={4}>快速入口</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card className="action-card">
                <div className="action-content">
                  <TrophyOutlined className="action-icon" />
                  <div className="action-text">
                    <Title level={5}>查看排行榜</Title>
                    <Text>查看最受欢迎的模板</Text>
                  </div>
                  <Button type="primary" icon={<ArrowRightOutlined />}>
                    查看排名
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Content>
    </Layout>
  );
};

export default SubjectsOverviewPage;