import React from 'react';
import { MATH_CHAPTERS } from '@data/mathematics';
import { getSubjectColor, Subject } from '@utils/subjects';

const MathSubjectPage: React.FC = () => {
  const subjectColor = getSubjectColor(Subject.MATH);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4" style={{ borderBottomColor: subjectColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">📐</span>
                高中数学
              </h1>
              <p className="mt-2 text-gray-600">沪教版可视化学习平台 - 让数学概念一目了然</p>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                沪教版
              </span>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                全7册
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Learning Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学习进度</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">已完成</span>
                <span className="text-2xl font-bold text-green-600">15</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">学习中</span>
                <span className="text-2xl font-bold text-blue-600">8</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-800 font-medium">待学习</span>
                <span className="text-2xl font-bold text-gray-600">20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-gray-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MATH_CHAPTERS.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              subjectColor={subjectColor}
            />
          ))}
        </div>

        {/* Quick Access */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">快速访问</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['函数图像', '几何图形', '数列动画', '概率实验'].map((item) => (
              <button
                key={item}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                style={{ hover: { borderColor: subjectColor } }}
              >
                <div className="text-2xl mb-2">
                  {item === '函数图像' && '📈'}
                  {item === '几何图形' && '📐'}
                  {item === '数列动画' && '🔢'}
                  {item === '概率实验' && '🎲'}
                </div>
                <div className="text-sm font-medium text-gray-700">{item}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

interface ChapterCardProps {
  chapter: {
    id: string;
    title: string;
    description: string;
    knowledgePoints: string[];
  };
  index: number;
  subjectColor: string;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, index, subjectColor }) => {
  const getChapterEmoji = (index: number) => {
    const emojis = ['📘', '📗', '📕', '📙', '📓', '📔'];
    return emojis[index % emojis.length];
  };

  const getDifficultyColor = (pointCount: number) => {
    if (pointCount <= 2) return 'bg-green-100 text-green-800';
    if (pointCount <= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer">
      {/* Chapter Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              {getChapterEmoji(index)}
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                {chapter.title}
              </h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getDifficultyColor(chapter.knowledgePoints.length)}`}>
                {chapter.knowledgePoints.length} 个知识点
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          {chapter.description}
        </p>
      </div>

      {/* Knowledge Points Preview */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">主要知识点</span>
          <span className="text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors">
            查看全部 →
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {chapter.knowledgePoints.slice(0, 3).map((point) => (
            <span
              key={point}
              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
              style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
            >
              {point.replace(/math-\d-/, '').replace(/math-s\d-/, '')}
            </span>
          ))}
          {chapter.knowledgePoints.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{chapter.knowledgePoints.length - 3} 更多
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>学习进度</span>
          <span>{Math.floor(Math.random() * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${Math.floor(Math.random() * 100)}%`,
              backgroundColor: subjectColor
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MathSubjectPage;