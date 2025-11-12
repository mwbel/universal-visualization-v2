import React, { useState, useEffect } from 'react';

interface SequenceTerm {
  n: number;
  value: number;
  highlighted?: boolean;
}

interface SequenceAnimationProps {
  type: 'arithmetic' | 'geometric';
  firstTerm: number;
  difference?: number; // for arithmetic sequence
  ratio?: number; // for geometric sequence
  numTerms: number;
  animationSpeed?: number;
}

const SequenceAnimation: React.FC<SequenceAnimationProps> = ({
  type,
  firstTerm,
  difference = 2,
  ratio = 2,
  numTerms = 10,
  animationSpeed = 1000
}) => {
  const [currentTerm, setCurrentTerm] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState<SequenceTerm[]>([]);
  const [sum, setSum] = useState(0);

  // Calculate sequence
  useEffect(() => {
    const newSequence: SequenceTerm[] = [];
    let runningSum = 0;

    for (let n = 1; n <= numTerms; n++) {
      let value: number;

      if (type === 'arithmetic') {
        value = firstTerm + (n - 1) * difference;
      } else {
        value = firstTerm * Math.pow(ratio, n - 1);
      }

      newSequence.push({
        n,
        value: Math.round(value * 100) / 100,
        highlighted: n === currentTerm
      });

      runningSum += value;
    }

    setSequence(newSequence);
    setSum(Math.round(runningSum * 100) / 100);
  }, [type, firstTerm, difference, ratio, numTerms, currentTerm]);

  // Animation effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentTerm < numTerms) {
        setCurrentTerm(currentTerm + 1);
      } else {
        setIsPlaying(false);
      }
    }, animationSpeed);

    return () => clearTimeout(timer);
  }, [currentTerm, isPlaying, numTerms, animationSpeed]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentTerm(1);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTerm(1);
  };

  const getFormula = () => {
    if (type === 'arithmetic') {
      return `aₙ = ${firstTerm} + (n-1) × ${difference}`;
    } else {
      return `aₙ = ${firstTerm} × ${ratio}^(n-1)`;
    }
  };

  const getSumFormula = () => {
    if (type === 'arithmetic') {
      return `Sₙ = n/2 × [2a₁ + (n-1)d] = ${numTerms}/2 × [2×${firstTerm} + (${numTerms}-1)×${difference}]`;
    } else {
      const ratioNot1 = ratio !== 1;
      if (ratioNot1) {
        return `Sₙ = a₁ × (1-qⁿ)/(1-q) = ${firstTerm} × (1-${ratio}^${numTerms})/(1-${ratio})`;
      } else {
        return `Sₙ = n × a₁ = ${numTerms} × ${firstTerm}`;
      }
    }
  };

  const getScale = () => {
    const maxValue = Math.max(...sequence.map(term => Math.abs(term.value)));
    return maxValue > 0 ? 300 / maxValue : 1;
  };

  return (
    <div className="sequence-animation-container p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {type === 'arithmetic' ? '等差数列' : '等比数列'} 动画演示
        </h3>
        <div className="space-y-2 text-sm">
          <div className="text-lg font-medium text-purple-700">
            通项公式: {getFormula()}
          </div>
          <div className="text-lg font-medium text-blue-700">
            求和公式: {getSumFormula()}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            ▶ 播放
          </button>
          <button
            onClick={handlePause}
            disabled={!isPlaying}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
          >
            ⏸ 暂停
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            ⏮ 重置
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">动画速度:</label>
          <input
            type="range"
            min="200"
            max="2000"
            step="200"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-600">{animationSpeed}ms</span>
        </div>
      </div>

      {/* Parameters */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">首项 a₁</label>
          <input
            type="number"
            value={firstTerm}
            onChange={(e) => {
              setCurrentTerm(1);
              setIsPlaying(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'arithmetic' ? '公差 d' : '公比 q'}
          </label>
          <input
            type="number"
            value={type === 'arithmetic' ? difference : ratio}
            onChange={(e) => {
              setCurrentTerm(1);
              setIsPlaying(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项数 n</label>
          <input
            type="number"
            value={numTerms}
            min="1"
            max="20"
            onChange={(e) => {
              setCurrentTerm(1);
              setIsPlaying(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">当前项</label>
          <div className="w-full px-3 py-2 bg-purple-100 text-purple-800 border border-purple-300 rounded-md font-medium">
            {currentTerm} / {numTerms}
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">数列可视化</h4>
        <div className="flex items-end justify-between h-64 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {sequence.map((term, index) => {
            const height = Math.abs(term.value) * getScale();
            const color = term.highlighted ? 'bg-purple-600' : 'bg-blue-500';
            const isNegative = term.value < 0;

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 mx-1"
              >
                <div className="relative w-full flex flex-col items-center">
                  {term.highlighted && (
                    <div className="absolute -top-8 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                      a{term.n} = {term.value}
                    </div>
                  )}

                  {!isNegative && (
                    <div
                      className={`${color} transition-all duration-300 rounded-t-sm`}
                      style={{
                        height: `${height}px`,
                        width: '80%',
                        opacity: term.highlighted ? 1 : 0.7
                      }}
                    ></div>
                  )}

                  {isNegative && (
                    <div className="h-full flex items-end">
                      <div
                        className={`${color} transition-all duration-300 rounded-b-sm`}
                        style={{
                          height: `${height}px`,
                          width: '80%',
                          opacity: term.highlighted ? 1 : 0.7
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-600 mt-1 text-center">
                  a{term.n}
                </div>
              </div>
            );
          })}
        </div>

        {/* Zero line for negative values */}
        {sequence.some(term => term.value < 0) && (
          <div className="relative">
            <div className="absolute left-0 right-0 border-t-2 border-red-500" style={{ top: '-128px' }}></div>
            <div className="text-xs text-red-600 font-medium" style={{ marginTop: '-135px' }}>0</div>
          </div>
        )}
      </div>

      {/* Table View */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">数列表格</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">项数 n</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">值 aₙ</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">部分和 Sₙ</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">状态</th>
              </tr>
            </thead>
            <tbody>
              {sequence.slice(0, Math.min(currentTerm + 2, numTerms)).map((term, index) => {
                const partialSum = sequence
                  .slice(0, index + 1)
                  .reduce((acc, t) => acc + t.value, 0);

                return (
                  <tr
                    key={index}
                    className={`border-t border-gray-200 ${
                      term.highlighted ? 'bg-purple-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">{term.n}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{term.value}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {Math.round(partialSum * 100) / 100}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {term.highlighted && (
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                          当前
                        </span>
                      )}
                      {index < currentTerm - 1 && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                          已计算
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">计算结果</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700">数列类型:</span>
            <span className="ml-2 font-medium text-blue-900">
              {type === 'arithmetic' ? '等差数列' : '等比数列'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">当前项:</span>
            <span className="ml-2 font-medium text-blue-900">
              a{currentTerm} = {sequence[currentTerm - 1]?.value || 0}
            </span>
          </div>
          <div>
            <span className="text-blue-700">部分和:</span>
            <span className="ml-2 font-medium text-blue-900">
              S{currentTerm} = {sequence.slice(0, currentTerm).reduce((acc, t) => acc + t.value, 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-blue-700">总和:</span>
            <span className="ml-2 font-medium text-blue-900">
              S{numTerms} = {sum}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceAnimation;