/**
 * 线性代数可视化页面生成器
 * 根据概念自动生成可视化页面
 */

class VisualizationPageGenerator {
  constructor() {
    this.templatePath = '../shared-styles.css';
  }

  /**
   * 生成可视化页面
   */
  generatePage(conceptData) {
    const {
      concept,
      section,
      description,
      chapter,
      chapterName,
      keywords
    } = conceptData;

    const fileName = `${concept}可视化.html`;
    const pageContent = this.createPageTemplate(conceptData);

    return {
      fileName: fileName,
      content: pageContent,
      path: `pages/${fileName}`
    };
  }

  /**
   * 检测概念类型
   */
  detectConceptType(conceptData) {
    const { concept, keywords = [], description = '' } = conceptData;
    const text = `${concept} ${keywords.join(' ')} ${description}`.toLowerCase();

    // 按优先级检测概念类型
    if (text.includes('行列式') || text.includes('determinant')) return 'determinant';
    if (text.includes('克拉默') || text.includes('cramer')) return 'cramer';
    if (text.includes('逆矩阵') || text.includes('inverse')) return 'inverse';
    if (text.includes('秩') || text.includes('rank')) return 'rank';
    if (text.includes('特征值') || text.includes('特征向量') || text.includes('eigenvalue')) return 'eigenvalue';
    if (text.includes('对角化') || text.includes('diagonalization')) return 'diagonalization';
    if (text.includes('正交') || text.includes('orthogonal')) return 'orthogonal';
    if (text.includes('投影') || text.includes('projection')) return 'projection';
    if (text.includes('施密特') || text.includes('schmidt')) return 'schmidt';
    if (text.includes('二次型') || text.includes('quadratic')) return 'quadratic';
    if (text.includes('线性变换') || text.includes('transformation')) return 'transformation';
    if (text.includes('线性方程组') || text.includes('方程组')) return 'equations';
    if (text.includes('向量') || text.includes('vector')) return 'vector';
    if (text.includes('矩阵') || text.includes('matrix')) return 'matrix';
    if (text.includes('线性空间') || text.includes('空间')) return 'space';
    if (text.includes('基') || text.includes('basis')) return 'basis';

    return 'default';
  }

  /**
   * 创建页面模板
   */
  createPageTemplate(conceptData) {
    const { concept, description, chapter, keywords = [] } = conceptData;
    const conceptType = this.detectConceptType(conceptData);

    // 获取概念特定的配置
    const config = this.getConceptConfig(conceptType, concept);

    const { formula, params, presets, geometryExplanation, visualizationCode } = config;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${concept}可视化</title>
  <link rel="stylesheet" href="../shared-styles.css">
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <div class="sidebar">
    <div class="nav-title">线性代数</div>
    <div class="nav-subtitle">模块导航</div>
    <ul>
      <li><a href="../index.html">模块概览</a></li>
      <li><a href="二阶行列式可视化.html">二阶行列式</a></li>
      <li><a href="三阶行列式可视化.html">三阶行列式</a></li>
      <li><a href="矩阵运算可视化.html">矩阵运算</a></li>
      <li><a href="向量空间可视化.html">向量空间</a></li>
      <li><a href="线性变换可视化.html">线性变换</a></li>
      <li><a href="矩阵高斯消元法可视化.html">高斯消元法</a></li>
      <li><a href="特征值分解可视化.html">特征值分解</a></li>
      <li><a href="旋转矩阵可视化.html">旋转矩阵</a></li>
      <li><a href="正交分解可视化.html">正交分解</a></li>
      <li><a href="奇异值分解可视化.html">奇异值分解</a></li>
      <li><a href="最小二乘法可视化.html">最小二乘法</a></li>
      <li><a href="二次型标准化可视化.html">二次型标准化</a></li>
      <li class="active"><a href="${concept}可视化.html">${concept}</a></li>
      <li><a href="线性方程组可视化.html">线性方程组</a></li>
      <li><a href="向量投影可视化.html">向量投影</a></li>
    </ul>
  </div>
  <div class="page-content">
    <div class="content">
      <!-- 左栏：代数定义与公式 -->
      <section class="card">
        <h3>${concept}</h3>
        <div class="section-title">概念说明</div>
        <p style="font-size: 14px; color: #5f6368; line-height: 1.6;">
          ${description}
        </p>

        <div class="section-title">定义</div>
        <div class="mathjax-block">
          <div class="formula">${formula}</div>
        </div>

        <div class="section-title">参数设置</div>
        <div class="control-grid">
          ${params.map((p, i) => `
          <div class="control">
            <label>${p.label}</label>
            <input id="param${i+1}" type="number" step="${p.step}" value="${p.default}" ${p.min !== undefined ? `min="${p.min}"` : ''} ${p.max !== undefined ? `max="${p.max}"` : ''} />
          </div>`).join('')}
        </div>

        <div style="margin-top: 16px;">
          ${presets.map((p, i) => `<button id="preset${i+1}">${p.name}</button>`).join('\n          ')}
        </div>

        <div class="section-title">计算结果</div>
        <div class="mathjax-block">
          <div class="formula" id="result">\\\\[ \\\\text{调整参数查看结果} \\\\]</div>
        </div>
      </section>

      <!-- 右栏：几何意义与交互 -->
      <section class="card">
        <h3>几何意义与可视化</h3>
        <div id="plot" class="viz"></div>
        <div class="legend">
          <strong>几何解释：</strong><br>
          ${geometryExplanation.split('\n').map(line => `• ${line}<br>`).join('\n          ')}
        </div>
      </section>
    </div>
  </div>

  <script>
    // MathJax 配置
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\\\\\(', '\\\\\\\\)']],
        displayMath: [['\\\\\\\\[', '\\\\\\\\]']],
        processEscapes: true
      },
      svg: {
        fontCache: 'global'
      }
    };

    function getParams() {
      return {
        ${params.map((p, i) => `param${i+1}: parseFloat(document.getElementById('param${i+1}').value)`).join(',\n        ')}
      };
    }

    ${visualizationCode}

    // 预设按钮
    ${presets.map((p, i) => `
    document.getElementById('preset${i+1}').addEventListener('click', () => {
      ${p.values.map((v, j) => `document.getElementById('param${j+1}').value = ${v};`).join('\n      ')}
      updatePlot();
    });`).join('')}

    // 监听输入变化
    ${params.map((p, i) => `'param${i+1}'`).join(', ')}.split(',').forEach(id => {
      document.getElementById(id.trim()).addEventListener('input', updatePlot);
    });

    // 初始化
    updatePlot();
  </script>
</body>
</html>
`;
  }

  /**
   * 获取概念特定的配置
   */
  getConceptConfig(conceptType, conceptName) {
    const configs = {
      'determinant': this.getDeterminantConfig(),
      'cramer': this.getCramerConfig(),
      'inverse': this.getInverseConfig(),
      'rank': this.getRankConfig(),
      'eigenvalue': this.getEigenvalueConfig(),
      'diagonalization': this.getDiagonalizationConfig(),
      'orthogonal': this.getOrthogonalConfig(),
      'projection': this.getProjectionConfig(),
      'schmidt': this.getSchmidtConfig(),
      'quadratic': this.getQuadraticConfig(),
      'transformation': this.getTransformationConfig(),
      'equations': this.getEquationsConfig(),
      'vector': this.getVectorConfig(),
      'matrix': this.getMatrixConfig(),
      'space': this.getSpaceConfig(),
      'basis': this.getBasisConfig(),
      'default': this.getDefaultConfig()
    };

    return configs[conceptType] || configs['default'];
  }

  /**
   * 行列式配置
   */
  getDeterminantConfig() {
    return {
      formula: '\\\\[ \\\\det(A) = \\\\begin{vmatrix} a & b \\\\\\\\ c & d \\\\end{vmatrix} = ad - bc \\\\]',
      params: [
        { label: 'a (第1行第1列)', step: 0.5, default: 2, min: -5, max: 5 },
        { label: 'b (第1行第2列)', step: 0.5, default: 1, min: -5, max: 5 },
        { label: 'c (第2行第1列)', step: 0.5, default: 1, min: -5, max: 5 },
        { label: 'd (第2行第2列)', step: 0.5, default: 2, min: -5, max: 5 }
      ],
      presets: [
        { name: '单位矩阵', values: [1, 0, 0, 1] },
        { name: '拉伸变换', values: [2, 0, 0, 3] },
        { name: '剪切变换', values: [1, 1, 0, 1] }
      ],
      geometryExplanation: '行列式的绝对值表示平行四边形的面积\n正值表示保持方向，负值表示翻转\n行列式为0表示矩阵将平面压缩到一条线上',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();
      const a = params.param1, b = params.param2;
      const c = params.param3, d = params.param4;

      // 计算行列式
      const det = a * d - b * c;

      // 原始单位正方形的顶点
      const unitSquare = {
        x: [0, 1, 1, 0, 0],
        y: [0, 0, 1, 1, 0],
        mode: 'lines',
        name: '单位正方形',
        line: { color: '#cccccc', width: 2, dash: 'dash' }
      };

      // 变换后的平行四边形
      const transformed = {
        x: [0, a, a+b, b, 0],
        y: [0, c, c+d, d, 0],
        mode: 'lines',
        fill: 'toself',
        fillcolor: det >= 0 ? 'rgba(55, 71, 255, 0.3)' : 'rgba(255, 71, 55, 0.3)',
        name: '变换后',
        line: { color: det >= 0 ? '#3747ff' : '#ff4737', width: 3 }
      };

      // 向量
      const vector1 = {
        x: [0, a],
        y: [0, c],
        mode: 'lines+markers',
        name: '列向量1',
        line: { color: '#00aa00', width: 3 },
        marker: { size: 8 }
      };

      const vector2 = {
        x: [0, b],
        y: [0, d],
        mode: 'lines+markers',
        name: '列向量2',
        line: { color: '#aa00aa', width: 3 },
        marker: { size: 8 }
      };

      const traces = [unitSquare, transformed, vector1, vector2];

      const layout = {
        title: '行列式的几何意义',
        xaxis: {
          title: 'x',
          zeroline: true,
          range: [-5, 5],
          scaleanchor: 'y',
          scaleratio: 1
        },
        yaxis: {
          title: 'y',
          zeroline: true,
          range: [-5, 5]
        },
        showlegend: true,
        hovermode: 'closest',
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      // 更新结果
      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ \\\\\\\\det(A) = ${a.toFixed(2)} \\\\\\\\times ${d.toFixed(2)} - ${b.toFixed(2)} \\\\\\\\times ${c.toFixed(2)} = ${det.toFixed(2)} \\\\\\\\]
        \\\\\\\\[ \\\\\\\\text{面积} = |\\\\\\\\det(A)| = ${Math.abs(det).toFixed(2)} \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  /**
   * 克拉默法则配置
   */
  getCramerConfig() {
    return {
      formula: '\\\\[ x_i = \\\\frac{\\\\det(A_i)}{\\\\det(A)}, \\\\quad A_i \\\\text{是将第i列替换为常数项的矩阵} \\\\]',
      params: [
        { label: 'a₁₁', step: 0.5, default: 2, min: -5, max: 5 },
        { label: 'a₁₂', step: 0.5, default: 1, min: -5, max: 5 },
        { label: 'a₂₁', step: 0.5, default: 1, min: -5, max: 5 },
        { label: 'a₂₂', step: 0.5, default: 3, min: -5, max: 5 },
        { label: 'b₁', step: 0.5, default: 5, min: -10, max: 10 },
        { label: 'b₂', step: 0.5, default: 7, min: -10, max: 10 }
      ],
      presets: [
        { name: '简单方程组', values: [1, 0, 0, 1, 2, 3] },
        { name: '一般方程组', values: [2, 1, 1, 3, 5, 7] },
        { name: '复杂方程组', values: [3, -2, 1, 4, 8, -3] }
      ],
      geometryExplanation: '克拉默法则用行列式求解线性方程组\n几何上表示两条直线的交点\n当行列式为0时，直线平行或重合，无唯一解',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();
      const a11 = params.param1, a12 = params.param2;
      const a21 = params.param3, a22 = params.param4;
      const b1 = params.param5, b2 = params.param6;

      // 计算行列式
      const detA = a11 * a22 - a12 * a21;

      if (Math.abs(detA) < 0.001) {
        document.getElementById('result').innerHTML = \`
          \\\\\\\\[ \\\\\\\\det(A) = 0, \\\\\\\\text{方程组无唯一解} \\\\\\\\]
        \`;
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise();
        }
        return;
      }

      // 克拉默法则求解
      const detA1 = b1 * a22 - a12 * b2;
      const detA2 = a11 * b2 - b1 * a21;
      const x = detA1 / detA;
      const y = detA2 / detA;

      // 绘制两条直线
      const xRange = [-10, 10];

      // 第一条直线: a11*x + a12*y = b1
      const y1 = xRange.map(xi => (b1 - a11 * xi) / a12);
      const line1 = {
        x: xRange,
        y: y1,
        mode: 'lines',
        name: \`\${a11.toFixed(1)}x + \${a12.toFixed(1)}y = \${b1.toFixed(1)}\`,
        line: { color: '#3747ff', width: 3 }
      };

      // 第二条直线: a21*x + a22*y = b2
      const y2 = xRange.map(xi => (b2 - a21 * xi) / a22);
      const line2 = {
        x: xRange,
        y: y2,
        mode: 'lines',
        name: \`\${a21.toFixed(1)}x + \${a22.toFixed(1)}y = \${b2.toFixed(1)}\`,
        line: { color: '#ff4737', width: 3 }
      };

      // 交点
      const intersection = {
        x: [x],
        y: [y],
        mode: 'markers',
        name: '解',
        marker: { size: 15, color: '#00aa00', symbol: 'x' }
      };

      const traces = [line1, line2, intersection];

      const layout = {
        title: '克拉默法则：两直线交点',
        xaxis: { title: 'x', zeroline: true, range: [-10, 10] },
        yaxis: { title: 'y', zeroline: true, range: [-10, 10] },
        showlegend: true,
        hovermode: 'closest',
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      // 更新结果
      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ \\\\\\\\det(A) = ${detA.toFixed(2)}, \\\\quad x = \\\\\\\\frac{${detA1.toFixed(2)}}{${detA.toFixed(2)}} = ${x.toFixed(2)} \\\\\\\\]
        \\\\\\\\[ y = \\\\\\\\frac{${detA2.toFixed(2)}}{${detA.toFixed(2)}} = ${y.toFixed(2)} \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  /**
   * 向量配置
   */
  getVectorConfig() {
    return {
      formula: '\\\\[ \\\\vec{v} = \\\\begin{pmatrix} x \\\\\\\\ y \\\\end{pmatrix}, \\\\quad |\\\\vec{v}| = \\\\sqrt{x^2 + y^2} \\\\]',
      params: [
        { label: 'x坐标', step: 0.5, default: 3, min: -5, max: 5 },
        { label: 'y坐标', step: 0.5, default: 2, min: -5, max: 5 }
      ],
      presets: [
        { name: '单位向量', values: [1, 0] },
        { name: '对角向量', values: [1, 1] },
        { name: '长向量', values: [3, 4] }
      ],
      geometryExplanation: '向量表示有方向和大小的量\n向量的长度（模）表示其大小\n向量的方向由坐标决定',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();
      const x = params.param1, y = params.param2;

      // 计算向量模
      const magnitude = Math.sqrt(x * x + y * y);
      const angle = Math.atan2(y, x) * 180 / Math.PI;

      // 向量
      const vector = {
        x: [0, x],
        y: [0, y],
        mode: 'lines+markers',
        name: '向量',
        line: { color: '#3747ff', width: 4 },
        marker: { size: [0, 12], symbol: ['circle', 'arrow-bar-up'], angleref: 'previous' }
      };

      // 单位圆
      const theta = Array.from({length: 100}, (_, i) => i * 2 * Math.PI / 99);
      const unitCircle = {
        x: theta.map(t => Math.cos(t)),
        y: theta.map(t => Math.sin(t)),
        mode: 'lines',
        name: '单位圆',
        line: { color: '#cccccc', width: 1, dash: 'dash' }
      };

      // 坐标轴
      const traces = [unitCircle, vector];

      const layout = {
        title: '向量可视化',
        xaxis: {
          title: 'x',
          zeroline: true,
          range: [-6, 6],
          scaleanchor: 'y',
          scaleratio: 1
        },
        yaxis: {
          title: 'y',
          zeroline: true,
          range: [-6, 6]
        },
        showlegend: true,
        hovermode: 'closest',
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      // 更新结果
      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ \\\\\\\\vec{v} = \\\\\\\\begin{pmatrix} ${x.toFixed(2)} \\\\\\\\\\\\\\\\ ${y.toFixed(2)} \\\\\\\\end{pmatrix} \\\\\\\\]
        \\\\\\\\[ |\\\\\\\\vec{v}| = \\\\\\\\sqrt{${x.toFixed(2)}^2 + ${y.toFixed(2)}^2} = ${magnitude.toFixed(2)} \\\\\\\\]
        \\\\\\\\[ \\\\\\\\theta = ${angle.toFixed(1)}^\\\\\\\\circ \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  /**
   * 投影配置
   */
  getProjectionConfig() {
    return {
      formula: '\\\\[ \\\\text{proj}_{\\\\vec{u}}\\\\vec{v} = \\\\frac{\\\\vec{v} \\\\cdot \\\\vec{u}}{\\\\vec{u} \\\\cdot \\\\vec{u}} \\\\vec{u} \\\\]',
      params: [
        { label: 'v_x', step: 0.5, default: 3, min: -5, max: 5 },
        { label: 'v_y', step: 0.5, default: 2, min: -5, max: 5 },
        { label: 'u_x', step: 0.5, default: 4, min: -5, max: 5 },
        { label: 'u_y', step: 0.5, default: 1, min: -5, max: 5 }
      ],
      presets: [
        { name: '正交向量', values: [2, 3, 3, -2] },
        { name: '同向向量', values: [2, 2, 3, 3] },
        { name: '一般情况', values: [3, 2, 4, 1] }
      ],
      geometryExplanation: '投影是向量在另一向量方向上的分量\n投影向量与原向量的差是垂直分量\n当两向量正交时，投影为零向量',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();
      const vx = params.param1, vy = params.param2;
      const ux = params.param3, uy = params.param4;

      // 计算投影
      const dotVU = vx * ux + vy * uy;
      const dotUU = ux * ux + uy * uy;
      const scalar = dotVU / dotUU;
      const projX = scalar * ux;
      const projY = scalar * uy;

      // 向量v
      const vectorV = {
        x: [0, vx],
        y: [0, vy],
        mode: 'lines+markers',
        name: '向量v',
        line: { color: '#3747ff', width: 4 },
        marker: { size: 10 }
      };

      // 向量u
      const vectorU = {
        x: [0, ux],
        y: [0, uy],
        mode: 'lines+markers',
        name: '向量u',
        line: { color: '#ff4737', width: 4 },
        marker: { size: 10 }
      };

      // 投影向量
      const projection = {
        x: [0, projX],
        y: [0, projY],
        mode: 'lines+markers',
        name: '投影',
        line: { color: '#00aa00', width: 3, dash: 'dash' },
        marker: { size: 8 }
      };

      // 垂直线
      const perpendicular = {
        x: [vx, projX],
        y: [vy, projY],
        mode: 'lines',
        name: '垂直分量',
        line: { color: '#aa00aa', width: 2, dash: 'dot' }
      };

      const traces = [vectorU, vectorV, projection, perpendicular];

      const layout = {
        title: '向量投影',
        xaxis: {
          title: 'x',
          zeroline: true,
          range: [-6, 6],
          scaleanchor: 'y',
          scaleratio: 1
        },
        yaxis: {
          title: 'y',
          zeroline: true,
          range: [-6, 6]
        },
        showlegend: true,
        hovermode: 'closest',
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      // 更新结果
      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ \\\\\\\\vec{v} \\\\\\\\cdot \\\\\\\\vec{u} = ${dotVU.toFixed(2)} \\\\\\\\]
        \\\\\\\\[ \\\\\\\\text{proj}_{\\\\\\\\vec{u}}\\\\\\\\vec{v} = ${scalar.toFixed(2)} \\\\\\\\vec{u} = \\\\\\\\begin{pmatrix} ${projX.toFixed(2)} \\\\\\\\\\\\\\\\ ${projY.toFixed(2)} \\\\\\\\end{pmatrix} \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  /**
   * 线性变换配置
   */
  getTransformationConfig() {
    return {
      formula: '\\\\[ T(\\\\vec{x}) = A\\\\vec{x}, \\\\quad A = \\\\begin{pmatrix} a & b \\\\\\\\ c & d \\\\end{pmatrix} \\\\]',
      params: [
        { label: 'a', step: 0.1, default: 1.5, min: -3, max: 3 },
        { label: 'b', step: 0.1, default: 0.5, min: -3, max: 3 },
        { label: 'c', step: 0.1, default: 0.5, min: -3, max: 3 },
        { label: 'd', step: 0.1, default: 1.5, min: -3, max: 3 }
      ],
      presets: [
        { name: '拉伸', values: [2, 0, 0, 2] },
        { name: '旋转90°', values: [0, -1, 1, 0] },
        { name: '剪切', values: [1, 1, 0, 1] }
      ],
      geometryExplanation: '线性变换将向量空间映射到另一个向量空间\n矩阵的列向量表示基向量的变换结果\n变换保持原点不动和直线的直线性',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();
      const a = params.param1, b = params.param2;
      const c = params.param3, d = params.param4;

      // 原始网格
      const gridSize = 5;
      const gridLines = [];

      // 垂直线
      for (let i = -gridSize; i <= gridSize; i++) {
        const x = Array(21).fill(i);
        const y = Array.from({length: 21}, (_, j) => j - 10);
        gridLines.push({
          x: x,
          y: y,
          mode: 'lines',
          line: { color: '#e0e0e0', width: 1 },
          showlegend: false,
          hoverinfo: 'skip'
        });
      }

      // 水平线
      for (let i = -gridSize; i <= gridSize; i++) {
        const x = Array.from({length: 21}, (_, j) => j - 10);
        const y = Array(21).fill(i);
        gridLines.push({
          x: x,
          y: y,
          mode: 'lines',
          line: { color: '#e0e0e0', width: 1 },
          showlegend: false,
          hoverinfo: 'skip'
        });
      }

      // 变换后的网格
      const transformedLines = [];

      // 垂直线变换
      for (let i = -gridSize; i <= gridSize; i++) {
        const points = Array.from({length: 21}, (_, j) => {
          const x0 = i;
          const y0 = j - 10;
          return {
            x: a * x0 + b * y0,
            y: c * x0 + d * y0
          };
        });
        transformedLines.push({
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          mode: 'lines',
          line: { color: '#3747ff', width: 1 },
          showlegend: false,
          hoverinfo: 'skip'
        });
      }

      // 水平线变换
      for (let i = -gridSize; i <= gridSize; i++) {
        const points = Array.from({length: 21}, (_, j) => {
          const x0 = j - 10;
          const y0 = i;
          return {
            x: a * x0 + b * y0,
            y: c * x0 + d * y0
          };
        });
        transformedLines.push({
          x: points.map(p => p.x),
          y: points.map(p => p.y),
          mode: 'lines',
          line: { color: '#ff4737', width: 1 },
          showlegend: false,
          hoverinfo: 'skip'
        });
      }

      const traces = [...gridLines.slice(0, 4), ...transformedLines.slice(0, 4)];

      const layout = {
        title: '线性变换',
        xaxis: {
          title: 'x',
          zeroline: true,
          range: [-10, 10],
          scaleanchor: 'y',
          scaleratio: 1
        },
        yaxis: {
          title: 'y',
          zeroline: true,
          range: [-10, 10]
        },
        showlegend: false,
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      // 计算行列式
      const det = a * d - b * c;

      // 更新结果
      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ A = \\\\\\\\begin{pmatrix} ${a.toFixed(2)} & ${b.toFixed(2)} \\\\\\\\\\\\\\\\ ${c.toFixed(2)} & ${d.toFixed(2)} \\\\\\\\end{pmatrix} \\\\\\\\]
        \\\\\\\\[ \\\\\\\\det(A) = ${det.toFixed(2)} \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  /**
   * 默认配置
   */
  getDefaultConfig() {
    return {
      formula: '\\\\[ \\\\text{在此添加数学公式} \\\\]',
      params: [
        { label: '参数1', step: 0.1, default: 1 },
        { label: '参数2', step: 0.1, default: 1 }
      ],
      presets: [
        { name: '预设1', values: [1, 1] },
        { name: '预设2', values: [2, 2] },
        { name: '预设3', values: [3, 3] }
      ],
      geometryExplanation: '在此添加几何解释说明\n说明可视化元素的含义\n解释参数变化的影响',
      visualizationCode: `
    function updatePlot() {
      const params = getParams();

      const traces = [{
        x: [0, 1, 2, 3],
        y: [0, 1, 4, 9],
        mode: 'lines+markers',
        name: '示例数据',
        line: { color: '#3747ff', width: 3 }
      }];

      const layout = {
        title: '可视化',
        xaxis: { title: 'x', zeroline: true },
        yaxis: { title: 'y', zeroline: true },
        showlegend: true,
        hovermode: 'closest',
        plot_bgcolor: '#f8f8ff',
        paper_bgcolor: '#ffffff'
      };

      Plotly.newPlot('plot', traces, layout, { responsive: true });

      document.getElementById('result').innerHTML = \`
        \\\\\\\\[ \\\\\\\\text{结果: 在此显示计算结果} \\\\\\\\]
      \`;

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }`
    };
  }

  // 其他配置方法的占位符（返回默认配置）
  getInverseConfig() { return this.getDefaultConfig(); }
  getRankConfig() { return this.getDefaultConfig(); }
  getEigenvalueConfig() { return this.getDefaultConfig(); }
  getDiagonalizationConfig() { return this.getDefaultConfig(); }
  getOrthogonalConfig() { return this.getDefaultConfig(); }
  getSchmidtConfig() { return this.getDefaultConfig(); }
  getQuadraticConfig() { return this.getDefaultConfig(); }
  getEquationsConfig() { return this.getDefaultConfig(); }
  getMatrixConfig() { return this.getDefaultConfig(); }
  getSpaceConfig() { return this.getDefaultConfig(); }
  getBasisConfig() { return this.getDefaultConfig(); }
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualizationPageGenerator;
}
