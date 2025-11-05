/**
 * Math Visualization Module
 * 数学可视化模块 - 懒加载实现
 *
 * 这个模块包含所有数学相关的可视化功能
 * 通过动态导入实现代码分割
 */

class MathVisualizationModule {
  constructor() {
    this.name = 'Math Visualization';
    this.version = '1.0.0';
    this.dependencies = ['Plotly.js', 'MathJax'];
    this.initialized = false;
  }

  /**
   * 初始化数学可视化模块
   */
  async init() {
    if (this.initialized) return;

    console.log('🔢 初始化数学可视化模块...');

    // 动态加载依赖库
    await this.loadDependencies();

    // 初始化数学可视化组件
    this.initComponents();

    this.initialized = true;
    console.log('✅ 数学可视化模块初始化完成');
  }

  /**
   * 动态加载依赖库
   */
  async loadDependencies() {
    const dependencies = [
      {
        name: 'Plotly.js',
        url: 'https://cdn.plot.ly/plotly-2.27.0.min.js',
        check: () => window.Plotly
      },
      {
        name: 'MathJax',
        url: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
        check: () => window.MathJax
      }
    ];

    for (const dep of dependencies) {
      if (!dep.check()) {
        await this.loadScript(dep.url, dep.name);
      }
    }
  }

  /**
   * 加载外部脚本
   */
  loadScript(url, name) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        console.log(`✅ ${name} 加载完成`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ ${name} 加载失败`);
        reject(new Error(`${name} loading failed`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 初始化数学可视化组件
   */
  initComponents() {
    // 注册数学可视化类型
    this.registerVisualizationTypes();
  }

  /**
   * 注册可视化类型
   */
  registerVisualizationTypes() {
    const visualizationTypes = [
      {
        id: 'function-plot',
        name: '函数图像',
        description: '绘制各种数学函数的图像',
        category: 'math',
        render: this.renderFunctionPlot.bind(this)
      },
      {
        id: 'statistics',
        name: '统计图表',
        description: '概率分布、直方图等统计可视化',
        category: 'math',
        render: this.renderStatistics.bind(this)
      },
      {
        id: 'geometry',
        name: '几何图形',
        description: '平面几何和立体几何可视化',
        category: 'math',
        render: this.renderGeometry.bind(this)
      },
      {
        id: 'calculus',
        name: '微积分',
        description: '导数、积分等微积分概念可视化',
        category: 'math',
        render: this.renderCalculus.bind(this)
      }
    ];

    // 触发注册事件
    window.dispatchEvent(new CustomEvent('registerVisualizationTypes', {
      detail: { types: visualizationTypes, module: this.name }
    }));
  }

  /**
   * 渲染函数图像
   */
  renderFunctionPlot(container, config) {
    const { function: func, range = [-10, 10], points = 200 } = config;

    const x = [];
    const y = [];

    for (let i = range[0]; i <= range[1]; i += (range[1] - range[0]) / points) {
      x.push(i);
      try {
        y.push(this.evaluateFunction(func, i));
      } catch (e) {
        y.push(null);
      }
    }

    const trace = {
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines',
      name: func,
      line: { color: '#3498db', width: 3 }
    };

    const layout = {
      title: `函数图像: ${func}`,
      xaxis: { title: 'x' },
      yaxis: { title: 'y' },
      template: 'plotly_dark'
    };

    return Plotly.newPlot(container, [trace], layout);
  }

  /**
   * 渲染统计图表
   */
  renderStatistics(container, config) {
    const { type, data, title } = config;

    let trace;
    switch (type) {
      case 'normal-distribution':
        trace = this.createNormalDistributionTrace(data);
        break;
      case 'histogram':
        trace = this.createHistogramTrace(data);
        break;
      default:
        throw new Error(`不支持的统计图表类型: ${type}`);
    }

    const layout = {
      title: title || '统计图表',
      template: 'plotly_dark'
    };

    return Plotly.newPlot(container, [trace], layout);
  }

  /**
   * 渲染几何图形
   */
  renderGeometry(container, config) {
    const { type, parameters } = config;

    // 这里可以集成Three.js或其他几何渲染库
    console.log(`渲染几何图形: ${type}`, parameters);

    // 简单的SVG几何图形示例
    return this.renderSVGGeometry(container, type, parameters);
  }

  /**
   * 渲染微积分概念
   */
  renderCalculus(container, config) {
    const { concept, function: func, range = [-5, 5] } = config;

    if (concept === 'derivative') {
      return this.renderDerivative(container, func, range);
    } else if (concept === 'integral') {
      return this.renderIntegral(container, func, range);
    }
  }

  /**
   * 计算函数值
   */
  evaluateFunction(func, x) {
    // 简单的函数解析器
    const mathFunction = func
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/log/g, 'Math.log')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/\^/g, '**')
      .replace(/x/g, `(${x})`);

    return eval(mathFunction);
  }

  /**
   * 创建正态分布轨迹
   */
  createNormalDistributionTrace(data) {
    const { mean = 0, std = 1 } = data;
    const x = [];
    const y = [];

    for (let i = mean - 4 * std; i <= mean + 4 * std; i += 0.1) {
      x.push(i);
      const exponent = -0.5 * Math.pow((i - mean) / std, 2);
      y.push((1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent));
    }

    return {
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines',
      name: `正态分布 (μ=${mean}, σ=${std})`,
      line: { color: '#e74c3c', width: 3 }
    };
  }

  /**
   * 创建直方图轨迹
   */
  createHistogramTrace(data) {
    return {
      x: data.values,
      type: 'histogram',
      name: '频率分布',
      marker: { color: '#9b59b6' }
    };
  }

  /**
   * 渲染SVG几何图形
   */
  renderSVGGeometry(container, type, parameters) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '400');
    svg.setAttribute('height', '400');
    svg.style.backgroundColor = '#2c3e50';

    let shape;
    switch (type) {
      case 'circle':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('cx', parameters.cx || 200);
        shape.setAttribute('cy', parameters.cy || 200);
        shape.setAttribute('r', parameters.r || 50);
        shape.setAttribute('fill', parameters.fill || '#3498db');
        break;
      case 'rectangle':
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', parameters.x || 150);
        shape.setAttribute('y', parameters.y || 150);
        shape.setAttribute('width', parameters.width || 100);
        shape.setAttribute('height', parameters.height || 100);
        shape.setAttribute('fill', parameters.fill || '#2ecc71');
        break;
    }

    if (shape) {
      svg.appendChild(shape);
    }

    container.innerHTML = '';
    container.appendChild(svg);

    return Promise.resolve();
  }

  /**
   * 渲染导数可视化
   */
  renderDerivative(container, func, range) {
    const x = [];
    const y = [];
    const derivativeY = [];

    for (let i = range[0]; i <= range[1]; i += 0.1) {
      x.push(i);
      y.push(this.evaluateFunction(func, i));
      derivativeY.push(this.numericalDerivative(func, i));
    }

    const traces = [
      {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        name: `f(x) = ${func}`,
        line: { color: '#3498db', width: 3 }
      },
      {
        x: x,
        y: derivativeY,
        type: 'scatter',
        mode: 'lines',
        name: "f'(x)",
        line: { color: '#e74c3c', width: 2 }
      }
    ];

    const layout = {
      title: `导数可视化: ${func}`,
      xaxis: { title: 'x' },
      yaxis: { title: 'y' },
      template: 'plotly_dark'
    };

    return Plotly.newPlot(container, traces, layout);
  }

  /**
   * 渲染积分可视化
   */
  renderIntegral(container, func, range) {
    // 实现积分面积可视化
    console.log('渲染积分可视化');
    return Promise.resolve();
  }

  /**
   * 数值求导
   */
  numericalDerivative(func, x, h = 0.0001) {
    return (this.evaluateFunction(func, x + h) - this.evaluateFunction(func, x - h)) / (2 * h);
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.initialized) {
      console.log('🧹 清理数学可视化模块资源...');
      this.initialized = false;
    }
  }
}

// 导出模块
export default MathVisualizationModule;

// 如果需要支持CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathVisualizationModule;
}