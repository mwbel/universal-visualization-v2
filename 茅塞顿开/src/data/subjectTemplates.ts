import { Subject, SubjectInfo } from '@types/index';
import { VisualizationType } from './interactive';

export interface TemplateParameter {
  id: string;
  label: string;
  type: 'number' | 'slider' | 'toggle' | 'select' | 'color' | 'text';
  min?: number;
  max?: number;
  step?: number;
  default: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
}

export interface SubjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  visualizationType: VisualizationType;
  defaultConfig: Record<string, any>;
  parameters: TemplateParameter[];
  render: (config: Record<string, any>) => string; // 返回SVG或HTML
  preview?: string; // 预览图URL或base64
}

export interface SubjectTemplateGroup {
  id: string;
  name: string;
  description: string;
  templates: SubjectTemplate[];
}

// 数学学科模板
export const mathTemplates: SubjectTemplate[] = [
  {
    id: 'function-quadratic',
    name: '二次函数',
    description: '二次函数 y = ax² + bx + c 的图像展示',
    icon: '📈',
    category: '函数与方程',
    visualizationType: VisualizationType.FUNCTION,
    defaultConfig: {
      a: 1,
      b: 0,
      c: 0,
      xMin: -10,
      xMax: 10,
      yMin: -10,
      yMax: 10,
      showGrid: true,
      showAxes: true,
      lineWidth: 2
    },
    parameters: [
      { id: 'a', label: '二次项系数 a', type: 'slider', min: -5, max: 5, step: 0.1, default: 1 },
      { id: 'b', label: '一次项系数 b', type: 'slider', min: -10, max: 10, step: 0.1, default: 0 },
      { id: 'c', label: '常数项 c', type: 'slider', min: -10, max: 10, step: 0.1, default: 0 },
      { id: 'xMin', label: 'X轴最小值', type: 'number', min: -50, max: -1, default: -10 },
      { id: 'xMax', label: 'X轴最大值', type: 'number', min: 1, max: 50, default: 10 },
      { id: 'showGrid', label: '显示网格', type: 'toggle', default: true }
    ],
    render: (config) => {
      const { a, b, c, xMin, xMax, yMin, yMax, showGrid, lineWidth } = config;

      return `
        <svg viewBox="0 0 400 300" style="width: 100%; max-width: 350px;">
          ${showGrid ? `
            <!-- 网格线 -->
            ${Array.from({length: 11}, (_, i) => {
              const y = 20 + (i * 260 / 10);
              const x = 40 + (i * 320 / 10);
              return `<line x1="40" y1="${y}" x2="360" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>
                     <line x1="${x}" y1="20" x2="${x}" y2="280" stroke="#f0f0f0" stroke-width="1"/>`;
            }).join('')}
          ` : ''}

          <!-- 坐标轴 -->
          <line x1="${xMin < 0 ? 200 : 40}" y1="${yMin < 0 ? 260 : 280}" x2="360" y2="${yMin < 0 ? 260 : 280}" stroke="#666" stroke-width="2"/>
          <line x1="40" y1="20" x2="360" y1="20" stroke="#666" stroke-width="2"/>

          <!-- 二次函数曲线 -->
          <path d="${generateQuadraticPath(a, b, c, xMin, xMax)}"
                stroke="#7C3AED" stroke-width="${lineWidth}" fill="none"/>

          <!-- 顶点标记 -->
          ${a !== 0 ? `
            <circle cx="${200 - b/(2*a) * 32}" cy="${280 - (4*a*c - b*b)/(4*a) * 26}"
                    r="4" fill="#DC2626"/>
            <text x="${200 - b/(2*a) * 32}" y="${280 - (4*a*c - b*b)/(4*a) * 26 - 10}"
                  font-size="10" fill="#DC2626">顶点</text>
          ` : ''}

          <!-- 标签 -->
          <text x="370" y="25" font-size="12" fill="#666">y</text>
          <text x="15" y="${yMin < 0 ? 260 : 285}" font-size="12" fill="#666">x</text>
          <text x="50" y="40" font-size="10" fill="#7C3AED">
            y = ${a}x² ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c}
          </text>
        </svg>
      `;
    }
  },
  {
    id: 'trigonometry-unit-circle',
    name: '单位圆',
    description: '三角函数在单位圆上的可视化',
    icon: '⭕',
    category: '三角函数',
    visualizationType: VisualizationType.GEOMETRY,
    defaultConfig: {
      angle: 45,
      showSine: true,
      showCosine: true,
      showTangent: false,
      animateRotation: false,
      radius: 100,
      showGrid: true
    },
    parameters: [
      { id: 'angle', label: '角度 (度)', type: 'slider', min: 0, max: 360, step: 1, default: 45 },
      { id: 'showSine', label: '显示正弦', type: 'toggle', default: true },
      { id: 'showCosine', label: '显示余弦', type: 'toggle', default: true },
      { id: 'showTangent', label: '显示正切', type: 'toggle', default: false },
      { id: 'animateRotation', label: '动画旋转', type: 'toggle', default: false },
      { id: 'radius', label: '半径', type: 'slider', min: 50, max: 150, step: 10, default: 100 }
    ],
    render: (config) => {
      const { angle, showSine, showCosine, showTangent, radius, showGrid } = config;
      const angleRad = (angle * Math.PI) / 180;
      const x = Math.cos(angleRad) * (radius / 100) * 80 + 200;
      const y = -Math.sin(angleRad) * (radius / 100) * 80 + 150;

      return `
        <svg viewBox="0 0 400 300" style="width: 100%; max-width: 350px;">
          ${showGrid ? `
            <!-- 网格 -->
            ${Array.from({length: 21}, (_, i) => {
              const pos = 20 + (i * 16);
              return `<line x1="20" y1="${pos}" x2="380" y1="${pos}" stroke="#f0f0f0" stroke-width="1"/>
                     <line x1="${pos}" y1="20" x2="${pos}" y2="280" stroke="#f0f0f0" stroke-width="1"/>`;
            }).join('')}
          ` : ''}

          <!-- 坐标轴 -->
          <line x1="200" y1="20" x2="200" y2="280" stroke="#666" stroke-width="2"/>
          <line x1="20" y1="150" x2="380" y2="150" stroke="#666" stroke-width="2"/>

          <!-- 单位圆 -->
          <circle cx="200" cy="150" r="${radius * 0.8}"
                  fill="none" stroke="#7C3AED" stroke-width="2"/>

          <!-- 角度线 -->
          <line x1="200" y1="150" x2="${x}" y2="${y}"
                stroke="#DC2626" stroke-width="2" stroke-dasharray="5,3"/>

          <!-- 点 -->
          <circle cx="${x}" cy="${y}" r="5" fill="#DC2626"/>

          <!-- 正弦线 -->
          ${showSine ? `
            <line x1="${x}" y1="${y}" x2="${x}" y2="150"
                  stroke="#10B981" stroke-width="2" opacity="0.6"/>
            <circle cx="${x}" cy="150" r="3" fill="#10B981"/>
            <text x="${x + 8}" y="155" font-size="10" fill="#10B981">sin</text>
          ` : ''}

          <!-- 余弦线 -->
          ${showCosine ? `
            <line x1="200" y1="${y}" x2="${x}" y2="${y}"
                  stroke="#F59E0B" stroke-width="2" opacity="0.6"/>
            <circle cx="200" cy="${y}" r="3" fill="#F59E0B"/>
            <text x="205" y="${y + 3}" font-size="10" fill="#F59E0B">cos</text>
          ` : ''}

          <!-- 标签 -->
          <text x="370" y="155" font-size="12" fill="#666">x</text>
          <text x="185" y="25" font-size="12" fill="#666">y</text>
          <text x="380" y="25" font-size="10" fill="#DC2626">${angle}°</text>
          <text x="15" y="25" font-size="10" fill="#666">1</text>
          <text x="15" y="280" font-size="10" fill="#666">-1</text>
          <text x="380" y="155" font-size="10" fill="#666">1</text>
        </svg>
      `;
    }
  },
  {
    id: 'sequence-arithmetic',
    name: '等差数列',
    description: '等差数列的可视化展示和通项公式',
    icon: '🔢',
    category: '数列与级数',
    visualizationType: VisualizationType.SEQUENCE,
    defaultConfig: {
      firstTerm: 2,
      difference: 3,
      numTerms: 8,
      showFormula: true,
      showPartialSum: true,
      animationSpeed: 1000
    },
    parameters: [
      { id: 'firstTerm', label: '首项 a₁', type: 'number', min: -20, max: 20, default: 2 },
      { id: 'difference', label: '公差 d', type: 'number', min: -10, max: 10, default: 3 },
      { id: 'numTerms', label: '项数 n', type: 'slider', min: 3, max: 20, default: 8 },
      { id: 'showFormula', label: '显示通项公式', type: 'toggle', default: true },
      { id: 'showPartialSum', label: '显示前n项和', type: 'toggle', default: true }
    ],
    render: (config) => {
      const { firstTerm, difference, numTerms, showFormula, showPartialSum } = config;
      const terms = [];
      let partialSum = 0;

      for (let i = 0; i < numTerms; i++) {
        const term = firstTerm + i * difference;
        terms.push(term);
        partialSum += term;
      }

      const maxValue = Math.max(...terms);
      const minValue = Math.min(...terms);
      const range = maxValue - minValue || 1;
      const scale = 120 / Math.max(Math.abs(maxValue), Math.abs(minValue));

      return `
        <div style="width: 100%; max-width: 350px; text-align: center;">
          ${showFormula ? `
            <div style="background: #f0f4f8; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: left;">
              <strong style="color: #1e40af;">通项公式:</strong>
              <div style="font-family: monospace; margin-top: 4px;">aₙ = ${firstTerm} + (n-1) × ${difference}</div>
              <div style="font-family: monospace; margin-top: 4px;">Sₙ = n/2 × [2a₁ + (n-1)d]</div>
              ${showPartialSum ? `<div style="margin-top: 8px; color: #059669;">前${numTerms}项和: S${numTerms} = ${partialSum}</div>` : ''}
            </div>
          ` : ''}

          <div style="display: flex; align-items: end; height: 160px; gap: 8px; justify-content: center;">
            ${terms.map((term, index) => `
              <div style="flex: 0 0 auto; background: ${term >= 0 ? '#7C3AED' : '#DC2626'};
                          height: ${Math.abs(term) * scale}px; min-height: 20px;
                          display: flex; align-items: center; justify-content: center;
                          color: white; font-size: 11px; border-radius: 4px; margin: 0 2px;
                          position: relative;">
                ${term}
                <span style="position: absolute; top: -15px; font-size: 9px; color: #666;">a${index + 1}</span>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 16px; color: #333; font-weight: 500;">
            等差数列: ${terms.join(', ')}
          </div>
          <div style="font-size: 12px; color: #666;">
            首项 a₁ = ${firstTerm}, 公差 d = ${difference}
          </div>
        </div>
      `;
    }
  }
];

// 物理学科模板
export const physicsTemplates: SubjectTemplate[] = [
  {
    id: 'projectile-motion',
    name: '抛体运动',
    description: '抛体运动的轨迹分析和可视化',
    icon: '🚀',
    category: '力学',
    visualizationType: VisualizationType.PHYSICS,
    defaultConfig: {
      initialVelocity: 20,
      launchAngle: 45,
      gravity: 9.8,
      timeStep: 0.1,
      showTrajectory: true,
      showVelocity: true,
      showComponents: false
    },
    parameters: [
      { id: 'initialVelocity', label: '初速度 (m/s)', type: 'slider', min: 5, max: 50, step: 1, default: 20 },
      { id: 'launchAngle', label: '发射角度 (度)', type: 'slider', min: 15, max: 75, step: 1, default: 45 },
      { id: 'gravity', label: '重力加速度 (m/s²)', type: 'slider', min: 1, max: 20, step: 0.1, default: 9.8 },
      { id: 'showTrajectory', label: '显示轨迹', type: 'toggle', default: true },
      { id: 'showVelocity', label: '显示速度向量', type: 'toggle', default: true }
    ],
    render: (config) => {
      const { initialVelocity, launchAngle, gravity, showTrajectory, showVelocity } = config;
      const angleRad = (launchAngle * Math.PI) / 180;
      const vx = initialVelocity * Math.cos(angleRad);
      const vy = initialVelocity * Math.sin(angleRad);

      const timeMax = (2 * vy) / gravity;
      const maxHeight = (vy * vy) / (2 * gravity);
      const range = (initialVelocity * initialVelocity * Math.sin(2 * angleRad)) / gravity;

      return `
        <svg viewBox="0 0 400 300" style="width: 100%; max-width: 350px;">
          <!-- 地面 -->
          <line x1="20" y1="250" x2="380" y2="250" stroke="#666" stroke-width="2"/>

          ${showTrajectory ? `
            <!-- 抛物轨迹 -->
            <path d="M 50 250 Q ${200 + range * 3} ${250 - maxHeight * 4}, ${350 + range * 3} 250"
                  stroke="#DC2626" stroke-width="2" fill="none" stroke-dasharray="5,3"/>
          ` : ''}

          <!-- 发射点 -->
          <circle cx="50" cy="250" r="4" fill="#7C3AED"/>

          ${showVelocity ? `
            <!-- 初速度向量 -->
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7"
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#10B981"/>
              </marker>
            </defs>
            <line x1="50" y1="250" x2="${50 + vx * 4}" y2="${250 - vy * 4}"
                  stroke="#10B981" stroke-width="2" marker-end="url(#arrowhead)"/>
          ` : ''}

          <!-- 标签和公式 -->
          <text x="25" y="270" font-size="11" fill="#666">发射点</text>
          <text x="25" y="20" font-size="11" fill="#666">最大高度: ${maxHeight.toFixed(1)}m</text>
          <text x="25" y="40" font-size="11" fill="#666">射程: ${range.toFixed(1)}m</text>
          <text x="25" y="60" font-size="11" fill="#666">飞行时间: ${timeMax.toFixed(1)}s</text>
          <text x="50 + vx * 4 + 10" y2="${250 - vy * 4}" font-size="10" fill="#10B981">
            v₀ = ${initialVelocity}m/s
          </text>
        </svg>
      `;
    }
  },
  {
    id: 'simple-harmonic-motion',
    name: '简谐运动',
    description: '简谐运动的位移、速度和加速度关系',
    icon: '〰️',
    category: '振动与波',
    visualizationType: VisualizationType.PHYSICS,
    defaultConfig: {
      amplitude: 50,
      frequency: 1,
      phase: 0,
      showDisplacement: true,
      showVelocity: false,
      showAcceleration: false
    },
    parameters: [
      { id: 'amplitude', label: '振幅', type: 'slider', min: 10, max: 80, step: 1, default: 50 },
      { id: 'frequency', label: '频率 (Hz)', type: 'slider', min: 0.5, max: 5, step: 0.1, default: 1 },
      { id: 'phase', label: '相位 (度)', type: 'slider', min: 0, max: 360, step: 1, default: 0 },
      { id: 'showDisplacement', label: '显示位移', type: 'toggle', default: true },
      { id: 'showVelocity', label: '显示速度', type: 'toggle', default: false },
      { id: 'showAcceleration', label: '显示加速度', type: 'toggle', default: false }
    ],
    render: (config) => {
      const { amplitude, frequency, phase, showDisplacement, showVelocity, showAcceleration } = config;
      const phaseRad = (phase * Math.PI) / 180;
      const omega = 2 * Math.PI * frequency;

      return `
        <svg viewBox="0 0 400 300" style="width: 100%; max-width: 350px;">
          <!-- 坐标轴 -->
          <line x1="50" y1="150" x2="350" y1="150" stroke="#666" stroke-width="1" stroke-dasharray="2,2"/>
          <line x1="200" y1="50" x2="200" y1="250" stroke="#666" stroke-width="1"/>

          ${showDisplacement ? `
            <!-- 位移曲线 -->
            <path d="${generateSinusoidalPath(amplitude, frequency, phaseRad, 'displacement', omega)}"
                  stroke="#7C3AED" stroke-width="2" fill="none"/>
            <text x="355" y="150" font-size="10" fill="#7C3AED">x</text>
            <circle cx="50" cy="150" r="3" fill="#7C3AED"/>
            <text x="185" y="45" font-size="10" fill="#7C3AED">位移</text>
          ` : ''}

          ${showVelocity ? `
            <!-- 速度曲线 -->
            <path d="${generateSinusoidalPath(amplitude * omega, frequency, phaseRad + Math.PI/2, 'velocity', omega)}"
                  stroke="#10B981" stroke-width="2" fill="none" opacity="0.7"/>
            <text x="355" y="120" font-size="10" fill="#10B981">v</text>
            <text x="185" y="120" font-size="10" fill="#10B981">速度</text>
          ` : ''}

          ${showAcceleration ? `
            <!-- 加速度曲线 -->
            <path d="${generateSinusoidalPath(-amplitude * omega * omega, frequency, phaseRad + Math.PI, 'acceleration', omega)}"
                  stroke="#DC2626" stroke-width="2" fill="none" opacity="0.7"/>
            <text x="355" y="90" font-size="10" fill="#DC2626">a</text>
            <text x="185" y="90" font-size="10" fill="#DC2626">加速度</text>
          ` : ''}

          <!-- 公式 -->
          <div style="background: #f9fafb; padding: 8px; margin-top: 16px; border-radius: 6px; font-size: 11px;">
            <div style="font-family: monospace;">x(t) = A·cos(ωt + φ)</div>
            <div style="font-family: monospace; margin-top: 4px;">A = ${amplitude}, ω = ${(2*Math.PI*frequency).toFixed(2)}, φ = ${phase}°</div>
          </div>
        </svg>
      `;
    }
  }
];

// 生成二次函数路径
function generateQuadraticPath(a: number, b: number, c: number, xMin: number, xMax: number): string {
  const points = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = a * x * x + b * x + c;

    // 映射到SVG坐标
    const svgX = 40 + (x - xMin) / (xMax - xMin) * 320;
    const svgY = 280 - ((y - (-10)) / 20) * 260; // 假设y范围是-10到10

    if (i === 0) {
      points.push(`M ${svgX} ${svgY}`);
    } else {
      points.push(`L ${svgX} ${svgY}`);
    }
  }

  return points.join(' ');
}

// 生成正弦曲线
function generateSinusoidalPath(amplitude: number, frequency: number, phase: number, type: string, omega: number): string {
  const points = [];
  const steps = 100;
  const baseY = type === 'displacement' ? 150 : (type === 'velocity' ? 120 : 90);

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 4; // t从0到4
    const y = amplitude * Math.cos(omega * t + phase);
    const svgX = 50 + (i / steps) * 300;
    const svgY = baseY - y * 0.8;

    if (i === 0) {
      points.push(`M ${svgX} ${svgY}`);
    } else {
      points.push(`L ${svgX} ${svgY}`);
    }
  }

  return points.join(' ');
}

// 学科模板映射
export const subjectTemplateMap: Record<Subject, SubjectTemplate[]> = {
  [Subject.MATH]: mathTemplates,
  [Subject.PHYSICS]: physicsTemplates,
  [Subject.CHEMISTRY]: [], // 待实现
  [Subject.BIOLOGY]: [], // 待实现
  [Subject.CHINESE]: [], // 待实现
  [Subject.ENGLISH]: [], // 待实现
  [Subject.HISTORY]: [], // 待实现
  [Subject.GEOGRAPHY]: [], // 待实现
  [Subject.POLITICS]: [] // 待实现
};

// 获取学科模板
export const getSubjectTemplates = (subject: Subject): SubjectTemplate[] => {
  return subjectTemplateMap[subject] || [];
};

// 获取模板ID对应的模板
export const getTemplateById = (subject: Subject, templateId: string): SubjectTemplate | undefined => {
  const templates = getSubjectTemplates(subject);
  return templates.find(t => t.id === templateId);
};