import React from 'react';
import { Link } from 'react-router-dom';
import { getAllSubjects } from '@utils/subjects';
import { Subject } from '@types/index';

const HomePage: React.FC = () => {
  const subjects = getAllSubjects();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <span className="text-5xl">💡</span>
              茅塞顿开
            </h1>
            <p className="text-xl text-gray-600">高中全科可视化学习平台</p>
            <p className="text-sm text-gray-500 mt-2">让知识点一目了然，学习更轻松</p>
            <div className="mt-6">
              <Link
                to="/subjects"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                查看所有学科
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            通过可视化，让复杂概念变简单
          </h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            "茅塞顿开"专注于高中九大学科的知识点可视化，
            通过互动图形、动画演示和实时反馈，帮助学生直观理解抽象概念，
            让学习从枯燥变得生动有趣。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4">
              <div className="text-3xl">📊</div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">互动可视化</h3>
                <p className="text-sm text-gray-600">实时交互，直观展示</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4">
              <div className="text-3xl">🎯</div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">精准练习</h3>
                <p className="text-sm text-gray-600">针对弱点，巩固提升</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4">
              <div className="text-3xl">🚀</div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">高效学习</h3>
                <p className="text-sm text-gray-600">节省时间，效果显著</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            选择学科开始学习
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            平台特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon="📈"
              title="函数图像可视化"
              description="实时绘制函数图像，支持多个函数对比，观察函数性质的变化"
            />
            <FeatureCard
              icon="📐"
              title="几何图形交互"
              description="动态绘制几何图形，支持角度测量、面积计算等交互功能"
            />
            <FeatureCard
              icon="🔢"
              title="数列动画演示"
              description等差、等比数列的动态展示，直观理解数列规律和求和公式"
            />
            <FeatureCard
              icon="⚗️"
              title="化学实验模拟"
              description="虚拟化学实验室，安全观察化学反应过程和微观结构"
            />
            <FeatureCard
              icon="🧬"
              title="生物过程动画"
              description="细胞分裂、遗传规律等生物过程的3D动画演示"
            />
            <FeatureCard
              icon="🌍"
              title="地理信息可视化"
              description="地图互动展示，地形地貌、气候分布的直观呈现"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">💡</span>
            <span className="text-xl font-semibold">茅塞顿开</span>
          </div>
          <p className="text-gray-400 mb-4">
            让每个学生都能体验到"茅塞顿开"的学习快感
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">关于我们</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">使用指南</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">意见反馈</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">联系方式</a>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800 text-sm text-gray-500">
            © 2024 茅塞顿开. 专注于高中教育可视化
          </div>
        </div>
      </footer>
    </div>
  );
};

interface SubjectCardProps {
  subject: {
    id: Subject;
    name: string;
    displayName: string;
    description: string;
    color: string;
    icon: string;
  };
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const isAvailable = subject.id === Subject.MATH; // 目前只有数学可用

  return (
    <Link
      to={isAvailable ? `/${subject.name}` : '#'}
      className={`block relative group ${!isAvailable ? 'cursor-not-allowed' : ''}`}
      onClick={(e) => !isAvailable && e.preventDefault()}
    >
      <div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-200"
        style={{
          transform: isAvailable ? 'translateY(0)' : 'translateY(0)',
          filter: isAvailable ? 'none' : 'grayscale(0.5)'
        }}
      >
        {/* Status Badge */}
        {!isAvailable && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">
              开发中
            </span>
          </div>
        )}

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              {subject.icon}
            </div>
            <div
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                backgroundColor: isAvailable ? `${subject.color}20` : '#f3f4f6',
                color: isAvailable ? subject.color : '#6b7280'
              }}
            >
              {isAvailable ? '可用' : '即将上线'}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
            {subject.displayName}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {subject.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></div>
              <span className="text-xs text-gray-500">沪教版教材</span>
            </div>
            {isAvailable && (
              <div className="flex gap-2">
                <Link
                  to={`/${subject.name}`}
                  className="text-purple-600 font-medium text-sm group-hover:text-purple-800 transition-colors"
                >
                  查看目录 →
                </Link>
                <Link
                  to={`/subjects/${subject.name}`}
                  className="text-blue-600 font-medium text-sm group-hover:text-blue-800 transition-colors"
                >
                  可视化模板 →
                </Link>
                <Link
                  to={`/interactive/${subject.name}`}
                  className="text-green-600 font-medium text-sm group-hover:text-green-800 transition-colors"
                >
                  智能问答 →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Hover Effect Overlay */}
        {isAvailable && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
            style={{ backgroundColor: subject.color }}
          ></div>
        )}
      </div>
    </Link>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default HomePage;