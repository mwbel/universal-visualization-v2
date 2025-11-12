import React from 'react';
import { useParams } from 'react-router-dom';
import { HIGH_SCHOOL_MATH_KNOWLEDGE_POINTS } from '@data/mathematics';
import FunctionGraph from '../visualizations/FunctionGraph';
import GeometryCanvas from '../visualizations/GeometryCanvas';
import SequenceAnimation from '../visualizations/SequenceAnimation';

interface KnowledgePointViewerProps {
  knowledgePointId?: string;
}

const KnowledgePointViewer: React.FC<KnowledgePointViewerProps> = ({ knowledgePointId }) => {
  const { id } = useParams();
  const currentId = knowledgePointId || id;

  const knowledgePoint = HIGH_SCHOOL_MATH_KNOWLEDGE_POINTS.find(
    point => point.id === currentId
  );

  if (!knowledgePoint) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">知识点未找到</h2>
        <p className="text-gray-600">请检查知识点ID是否正确</p>
      </div>
    );
  }

  const renderVisualization = () => {
    switch (knowledgePoint.id) {
      // 函数相关
      case 'math-1-3':
      case 'math-1-4':
        return <FunctionVisualization knowledgePoint={knowledgePoint} />;

      // 三角函数
      case 'math-2-1':
        return <TrigonometryVisualization knowledgePoint={knowledgePoint} />;

      // 数列
      case 'math-3-1':
        return <SequenceVisualization knowledgePoint={knowledgePoint} />;

      // 几何相关
      case 'math-4-1':
      case 'math-4-3':
        return <GeometryVisualization knowledgePoint={knowledgePoint} />;

      // 解析几何
      case 'math-s1-2':
        return <AnalyticGeometryVisualization knowledgePoint={knowledgePoint} />;

      default:
        return <DefaultVisualization knowledgePoint={knowledgePoint} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 返回
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{knowledgePoint.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {knowledgePoint.subject}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  knowledgePoint.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  knowledgePoint.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {knowledgePoint.difficulty === 'easy' ? '简单' :
                   knowledgePoint.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Theory */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">理论要点</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">概念定义</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {knowledgePoint.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">核心公式</h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    {getCoreFormulas(knowledgePoint.id)}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">学习要点</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {getLearningPoints(knowledgePoint.id).map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {knowledgePoint.prerequisites && knowledgePoint.prerequisites.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">前置知识</h3>
                    <div className="flex flex-wrap gap-2">
                      {knowledgePoint.prerequisites.map((prereq, index) => {
                        const prereqPoint = HIGH_SCHOOL_MATH_KNOWLEDGE_POINTS.find(p => p.id === prereq);
                        return prereqPoint ? (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {prereqPoint.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">可视化演示</h2>
              {renderVisualization()}
            </div>

            {/* Examples */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">例题解析</h2>
              <div className="space-y-6">
                {getExamples(knowledgePoint.id).map((example, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">例题 {index + 1}</h4>
                    <p className="text-gray-700 mb-3">{example.problem}</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2">解析:</h5>
                      <p className="text-gray-600 text-sm">{example.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">练习题</h2>
              <div className="space-y-4">
                {getPracticeQuestions(knowledgePoint.id).map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {question.question}
                        </p>
                        {question.type === 'choice' && (
                          <div className="space-y-2 ml-4">
                            {question.options?.map((option, optIndex) => (
                              <label key={optIndex} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  className="mr-2"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {question.type === 'fill' && (
                          <input
                            type="text"
                            placeholder="请输入答案"
                            className="ml-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </div>
                      <button className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm">
                        提交
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper components for different visualization types
const FunctionVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <div>
      <FunctionGraph
        functions={[
          {
            name: '二次函数 y = x²',
            equation: (x: number) => x * x,
            color: '#7C3AED',
            visible: true
          },
          {
            name: '一次函数 y = 2x + 1',
            equation: (x: number) => 2 * x + 1,
            color: '#DC2626',
            visible: true
          },
          {
            name: '指数函数 y = 2^x',
            equation: (x: number) => Math.pow(2, x),
            color: '#059669',
            visible: true
          }
        ]}
      />
    </div>
  );
};

const TrigonometryVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <div>
      <FunctionGraph
        xDomain={[-Math.PI * 2, Math.PI * 2]}
        yDomain={[-2, 2]}
        functions={[
          {
            name: 'sin(x)',
            equation: (x: number) => Math.sin(x),
            color: '#DC2626',
            visible: true
          },
          {
            name: 'cos(x)',
            equation: (x: number) => Math.cos(x),
            color: '#2563EB',
            visible: true
          }
        ]}
      />
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 提示：角度以弧度制显示，π ≈ 3.14159。可以看到正弦和余弦函数的周期性特征。
        </p>
      </div>
    </div>
  );
};

const SequenceVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <div>
      <SequenceAnimation
        type="arithmetic"
        firstTerm={2}
        difference={3}
        numTerms={8}
        animationSpeed={800}
      />
      <div className="mt-6">
        <SequenceAnimation
          type="geometric"
          firstTerm={2}
          ratio={2}
          numTerms={6}
          animationSpeed={1000}
        />
      </div>
    </div>
  );
};

const GeometryVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <GeometryCanvas
      elements={{
        points: [
          { x: 0, y: 0, label: 'O' },
          { x: 3, y: 4, label: 'A' },
          { x: -2, y: 3, label: 'B' }
        ],
        triangles: [
          {
            points: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 0, y: 3 }
            ],
            color: '#7C3AED',
            fill: true,
            label: 'Rt△'
          }
        ],
        circles: [
          {
            center: { x: 2, y: 2 },
            radius: 2.5,
            color: '#059669',
            fill: false,
            label: 'C₁'
          }
        ]
      }}
    />
  );
};

const AnalyticGeometryVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <div>
      <GeometryCanvas
        elements={{
          circles: [
            {
              center: { x: 0, y: 0 },
              radius: 3,
              color: '#DC2626',
              fill: false,
              label: 'x² + y² = 9'
            }
          ],
          points: [
            { x: -3, y: 0, label: 'A' },
            { x: 3, y: 0, label: 'B' },
            { x: 0, y: 3, label: 'C' },
            { x: 0, y: -3, label: 'D' }
          ]
        }}
      />
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-800">
          📐 圆的标准方程：(x-a)² + (y-b)² = r²，其中(a,b)为圆心，r为半径。
        </p>
      </div>
    </div>
  );
};

const DefaultVisualization: React.FC<{ knowledgePoint: any }> = ({ knowledgePoint }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📚</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {knowledgePoint.title}
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {knowledgePoint.description}
      </p>
      <div className="mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full">
          <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
          可视化内容正在开发中...
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getCoreFormulas = (knowledgePointId: string) => {
  const formulas: Record<string, React.ReactNode> = {
    'math-1-3': (
      <div className="space-y-2">
        <div className="font-mono text-sm">f(x) 的定义域、值域</div>
        <div className="font-mono text-sm">单调性：f'(x) > 0 递增</div>
        <div className="font-mono text-sm">奇偶性：f(-x) = f(x) 偶函数</div>
      </div>
    ),
    'math-3-1': (
      <div className="space-y-2">
        <div className="font-mono text-sm">等差：aₙ = a₁ + (n-1)d</div>
        <div className="font-mono text-sm">求和：Sₙ = n(a₁ + aₙ)/2</div>
        <div className="font-mono text-sm">等比：aₙ = a₁ × q^(n-1)</div>
      </div>
    ),
    'math-2-1': (
      <div className="space-y-2">
        <div className="font-mono text-sm">sin(A±B) = sinA·cosB ± cosA·sinB</div>
        <div className="font-mono text-sm">cos(A±B) = cosA·cosB ∓ sinA·sinB</div>
        <div className="font-mono text-sm">sin(2A) = 2sinA·cosA</div>
      </div>
    )
  };
  return formulas[knowledgePointId] || <div className="text-sm text-gray-600">暂无公式</div>;
};

const getLearningPoints = (knowledgePointId: string): string[] => {
  const points: Record<string, string[]> = {
    'math-1-3': [
      '理解函数的定义和三要素',
      '掌握求函数定义域的方法',
      '理解函数单调性的判断',
      '掌握奇偶函数的图像特征'
    ],
    'math-3-1': [
      '理解数列的概念',
      '掌握等差数列的通项公式',
      '掌握等比数列的通项公式',
      '学会数列求和的方法'
    ],
    'math-2-1': [
      '理解弧度制与角度制的转换',
      '掌握任意角三角函数的定义',
      '记忆特殊角的三角函数值',
      '理解三角函数的图像变换'
    ]
  };
  return points[knowledgePointId] || ['掌握基本概念', '理解核心公式', '多做练习题'];
};

const getExamples = (knowledgePointId: string) => {
  const examples: Record<string, any[]> = {
    'math-1-3': [
      {
        problem: '求函数 f(x) = √(x-2) 的定义域',
        solution: '要使根号有意义，需要 x-2 ≥ 0，即 x ≥ 2。所以定义域为 [2, +∞)'
      },
      {
        problem: '判断函数 f(x) = x² 的奇偶性',
        solution: 'f(-x) = (-x)² = x² = f(x)，所以 f(x) 是偶函数'
      }
    ],
    'math-3-1': [
      {
        problem: '已知等差数列 {aₙ} 中，a₁ = 3，d = 2，求 a₁₀',
        solution: 'aₙ = a₁ + (n-1)d，所以 a₁₀ = 3 + 9×2 = 21'
      },
      {
        problem: '求等比数列 2, 6, 18, ... 的第6项',
        solution: 'a₁ = 2，q = 3，所以 a₆ = 2 × 3⁵ = 486'
      }
    ]
  };
  return examples[knowledgePointId] || [
    {
      problem: '基础例题',
      solution: '详细解答过程...'
    }
  ];
};

const getPracticeQuestions = (knowledgePointId: string) => {
  const questions: Record<string, any[]> = {
    'math-1-3': [
      {
        type: 'choice',
        question: '函数 f(x) = 1/(x-1) 的定义域是？',
        options: ['R', 'x ≠ 1', 'x > 1', 'x < 1'],
        answer: 1
      },
      {
        type: 'fill',
        question: '若函数 f(x) = x³ + kx 是奇函数，则 k = ?',
        answer: '0'
      }
    ],
    'math-3-1': [
      {
        type: 'choice',
        question: '等差数列 3, 7, 11, ... 的第10项是？',
        options: ['39', '40', '41', '42'],
        answer: 0
      },
      {
        type: 'fill',
        question: '等比数列首项为2，公比为3，前4项和为？',
        answer: '80'
      }
    ]
  };
  return questions[knowledgePointId] || [
    {
      type: 'choice',
      question: '基础练习题',
      options: ['选项A', '选项B', '选项C', '选项D'],
      answer: 0
    }
  ];
};

export default KnowledgePointViewer;