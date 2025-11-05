/**
 * Chemistry Visualization Module
 * 化学可视化模块 - 懒加载实现
 *
 * 这个模块包含所有化学相关的可视化功能
 * 通过动态导入实现代码分割
 */

class ChemistryVisualizationModule {
  constructor() {
    this.name = 'Chemistry Visualization';
    this.version = '1.0.0';
    this.dependencies = ['Three.js', 'D3.js'];
    this.initialized = false;
  }

  /**
   * 初始化化学可视化模块
   */
  async init() {
    if (this.initialized) return;

    console.log('🧪 初始化化学可视化模块...');

    // 动态加载依赖库
    await this.loadDependencies();

    // 初始化化学可视化组件
    this.initComponents();

    this.initialized = true;
    console.log('✅ 化学可视化模块初始化完成');
  }

  /**
   * 动态加载依赖库
   */
  async loadDependencies() {
    const dependencies = [
      {
        name: 'Three.js',
        url: 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js',
        check: () => window.THREE
      },
      {
        name: 'D3.js',
        url: 'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
        check: () => window.d3
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
   * 初始化化学可视化组件
   */
  initComponents() {
    // 注册化学可视化类型
    this.registerVisualizationTypes();
  }

  /**
   * 注册可视化类型
   */
  registerVisualizationTypes() {
    const visualizationTypes = [
      {
        id: 'molecule',
        name: '分子结构',
        description: '分子3D结构可视化',
        category: 'chemistry',
        render: this.renderMolecule.bind(this)
      },
      {
        id: 'periodic-table',
        name: '元素周期表',
        description: '交互式元素周期表',
        category: 'chemistry',
        render: this.renderPeriodicTable.bind(this)
      },
      {
        id: 'reaction',
        name: '化学反应',
        description: '化学反应过程可视化',
        category: 'chemistry',
        render: this.renderReaction.bind(this)
      },
      {
        id: 'crystal',
        name: '晶体结构',
        description: '晶体点阵结构可视化',
        category: 'chemistry',
        render: this.renderCrystal.bind(this)
      }
    ];

    // 触发注册事件
    window.dispatchEvent(new CustomEvent('registerVisualizationTypes', {
      detail: { types: visualizationTypes, module: this.name }
    }));
  }

  /**
   * 渲染分子结构
   */
  renderMolecule(container, config) {
    const { molecule = 'water', showLabels = true, animate = false } = config;

    // 分子数据库
    const molecules = {
      'water': {
        name: '水分子',
        formula: 'H₂O',
        atoms: [
          { element: 'O', x: 0, y: 0, z: 0, color: '#ff0000', radius: 1.4 },
          { element: 'H', x: 1.0, y: 0.8, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -1.0, y: 0.8, z: 0, color: '#ffffff', radius: 0.8 }
        ],
        bonds: [[0, 1], [0, 2]]
      },
      'methane': {
        name: '甲烷',
        formula: 'CH₄',
        atoms: [
          { element: 'C', x: 0, y: 0, z: 0, color: '#404040', radius: 1.5 },
          { element: 'H', x: 1.2, y: 1.2, z: 1.2, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -1.2, y: -1.2, z: 1.2, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -1.2, y: 1.2, z: -1.2, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: 1.2, y: -1.2, z: -1.2, color: '#ffffff', radius: 0.8 }
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
      },
      'benzene': {
        name: '苯',
        formula: 'C₆H₆',
        atoms: [
          { element: 'C', x: 1.4, y: 0, z: 0, color: '#404040', radius: 1.5 },
          { element: 'C', x: 0.7, y: 1.2, z: 0, color: '#404040', radius: 1.5 },
          { element: 'C', x: -0.7, y: 1.2, z: 0, color: '#404040', radius: 1.5 },
          { element: 'C', x: -1.4, y: 0, z: 0, color: '#404040', radius: 1.5 },
          { element: 'C', x: -0.7, y: -1.2, z: 0, color: '#404040', radius: 1.5 },
          { element: 'C', x: 0.7, y: -1.2, z: 0, color: '#404040', radius: 1.5 },
          { element: 'H', x: 2.5, y: 0, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: 1.2, y: 2.1, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -1.2, y: 2.1, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -2.5, y: 0, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: -1.2, y: -2.1, z: 0, color: '#ffffff', radius: 0.8 },
          { element: 'H', x: 1.2, y: -2.1, z: 0, color: '#ffffff', radius: 0.8 }
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
      }
    };

    const moleculeData = molecules[molecule] || molecules['water'];

    // 使用Canvas 2D渲染分子（简化版本）
    return this.renderMolecule2D(container, moleculeData, { showLabels, animate });
  }

  /**
   * 2D分子渲染
   */
  renderMolecule2D(container, moleculeData, options) {
    const { showLabels, animate } = options;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '600')
      .attr('height', '500')
      .style('background-color', '#1a1a1a');

    const centerX = 300;
    const centerY = 250;
    const scale = 80;

    // 添加标题
    svg.append('text')
      .attr('x', 300)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text(`${moleculeData.name} (${moleculeData.formula})`);

    // 绘制化学键
    const bonds = svg.selectAll('.bond')
      .data(moleculeData.bonds)
      .enter()
      .append('line')
      .attr('class', 'bond')
      .attr('x1', d => centerX + moleculeData.atoms[d[0]].x * scale)
      .attr('y1', d => centerY + moleculeData.atoms[d[0]].y * scale)
      .attr('x2', d => centerX + moleculeData.atoms[d[1]].x * scale)
      .attr('y2', d => centerY + moleculeData.atoms[d[1]].y * scale)
      .attr('stroke', '#888')
      .attr('stroke-width', 3);

    // 绘制原子
    const atoms = svg.selectAll('.atom')
      .data(moleculeData.atoms)
      .enter()
      .append('g')
      .attr('class', 'atom');

    atoms.append('circle')
      .attr('cx', d => centerX + d.x * scale)
      .attr('cy', d => centerY + d.y * scale)
      .attr('r', d => d.radius * 15)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // 添加原子标签
    if (showLabels) {
      atoms.append('text')
        .attr('x', d => centerX + d.x * scale)
        .attr('y', d => centerY + d.y * scale + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(d => d.element);
    }

    // 动画效果
    if (animate) {
      let rotation = 0;
      const animateMolecule = () => {
        rotation += 0.01;

        atoms.selectAll('circle')
          .attr('cx', d => centerX + d.x * scale * Math.cos(rotation) - d.y * scale * Math.sin(rotation))
          .attr('cy', d => centerY + d.x * scale * Math.sin(rotation) + d.y * scale * Math.cos(rotation));

        if (showLabels) {
          atoms.selectAll('text')
            .attr('x', d => centerX + d.x * scale * Math.cos(rotation) - d.y * scale * Math.sin(rotation))
            .attr('y', d => centerY + d.x * scale * Math.sin(rotation) + d.y * scale * Math.cos(rotation) + 5);
        }

        bonds
          .attr('x1', d => centerX + moleculeData.atoms[d[0]].x * scale * Math.cos(rotation) - moleculeData.atoms[d[0]].y * scale * Math.sin(rotation))
          .attr('y1', d => centerY + moleculeData.atoms[d[0]].x * scale * Math.sin(rotation) + moleculeData.atoms[d[0]].y * scale * Math.cos(rotation))
          .attr('x2', d => centerX + moleculeData.atoms[d[1]].x * scale * Math.cos(rotation) - moleculeData.atoms[d[1]].y * scale * Math.sin(rotation))
          .attr('y2', d => centerY + moleculeData.atoms[d[1]].x * scale * Math.sin(rotation) + moleculeData.atoms[d[1]].y * scale * Math.cos(rotation));

        requestAnimationFrame(animateMolecule);
      };
      animateMolecule();
    }

    return Promise.resolve();
  }

  /**
   * 渲染元素周期表
   */
  renderPeriodicTable(container, config) {
    const { showElectrons = true, highlightGroup = null } = config;

    // 简化的周期表数据
    const elements = [
      { symbol: 'H', name: '氢', number: 1, mass: 1.008, group: 1, period: 1, color: '#ff6b6b' },
      { symbol: 'He', name: '氦', number: 2, mass: 4.003, group: 18, period: 1, color: '#4ecdc4' },
      { symbol: 'Li', name: '锂', number: 3, mass: 6.941, group: 1, period: 2, color: '#ff6b6b' },
      { symbol: 'Be', name: '铍', number: 4, mass: 9.012, group: 2, period: 2, color: '#95e77e' },
      { symbol: 'B', name: '硼', number: 5, mass: 10.811, group: 13, period: 2, color: '#ffe66d' },
      { symbol: 'C', name: '碳', number: 6, mass: 12.011, group: 14, period: 2, color: '#a8e6cf' },
      { symbol: 'N', name: '氮', number: 7, mass: 14.007, group: 15, period: 2, color: '#a8e6cf' },
      { symbol: 'O', name: '氧', number: 8, mass: 15.999, group: 16, period: 2, color: '#a8e6cf' },
      { symbol: 'F', name: '氟', number: 9, mass: 18.998, group: 17, period: 2, color: '#ffd3b6' },
      { symbol: 'Ne', name: '氖', number: 10, mass: 20.180, group: 18, period: 2, color: '#4ecdc4' },
      { symbol: 'Na', name: '钠', number: 11, mass: 22.990, group: 1, period: 3, color: '#ff6b6b' },
      { symbol: 'Mg', name: '镁', number: 12, mass: 24.305, group: 2, period: 3, color: '#95e77e' },
      { symbol: 'Al', name: '铝', number: 13, mass: 26.982, group: 13, period: 3, color: '#ffe66d' },
      { symbol: 'Si', name: '硅', number: 14, mass: 28.086, group: 14, period: 3, color: '#a8e6cf' },
      { symbol: 'P', name: '磷', number: 15, mass: 30.974, group: 15, period: 3, color: '#a8e6cf' },
      { symbol: 'S', name: '硫', number: 16, mass: 32.065, group: 16, period: 3, color: '#a8e6cf' },
      { symbol: 'Cl', name: '氯', number: 17, mass: 35.453, group: 17, period: 3, color: '#ffd3b6' },
      { symbol: 'Ar', name: '氩', number: 18, mass: 39.948, group: 18, period: 3, color: '#4ecdc4' }
    ];

    const containerWidth = 1200;
    const containerHeight = 600;
    const cellWidth = 60;
    const cellHeight = 60;
    const margin = 2;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .style('background-color', '#1a1a1a');

    // 标题
    svg.append('text')
      .attr('x', containerWidth / 2)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text('元素周期表');

    // 创建元素组
    const elementGroups = svg.selectAll('.element')
      .data(elements)
      .enter()
      .append('g')
      .attr('class', 'element')
      .attr('transform', d => `translate(${50 + d.group * (cellWidth + margin)}, ${80 + d.period * (cellHeight + margin)})`);

    // 添加矩形背景
    elementGroups.append('rect')
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', d => {
        if (highlightGroup && d.group === highlightGroup) {
          return '#fff';
        }
        return d.color;
      })
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-width', 3);

        // 显示详细信息
        const tooltip = svg.append('g')
          .attr('id', 'tooltip')
          .attr('transform', `translate(${d3.pointer(event)[0] + 20}, ${d3.pointer(event)[1] - 20})`);

        tooltip.append('rect')
          .attr('width', 150)
          .attr('height', 80)
          .attr('fill', '#fff')
          .attr('stroke', '#333')
          .attr('rx', 5);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .attr('fill', '#000')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text(`${d.name} (${d.symbol})`);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 40)
          .attr('fill', '#000')
          .attr('font-size', '12px')
          .text(`原子序数: ${d.number}`);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 55)
          .attr('fill', '#000')
          .attr('font-size', '12px')
          .text(`原子量: ${d.mass}`);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 70)
          .attr('fill', '#000')
          .attr('font-size', '12px')
          .text(`族: ${d.group}, 周期: ${d.period}`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 1);
        svg.select('#tooltip').remove();
      });

    // 添加原子序数
    elementGroups.append('text')
      .attr('x', 5)
      .attr('y', 12)
      .attr('fill', d => highlightGroup && d.group === highlightGroup ? '#000' : '#fff')
      .attr('font-size', '10px')
      .text(d => d.number);

    // 添加元素符号
    elementGroups.append('text')
      .attr('x', cellWidth / 2)
      .attr('y', cellHeight / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', d => highlightGroup && d.group === highlightGroup ? '#000' : '#fff')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(d => d.symbol);

    // 添加图例
    const legendData = [
      { color: '#ff6b6b', label: '碱金属' },
      { color: '#95e77e', label: '碱土金属' },
      { color: '#ffe66d', label: '硼族元素' },
      { color: '#a8e6cf', label: '碳族元素' },
      { color: '#ffd3b6', label: '卤素' },
      { color: '#4ecdc4', label: '稀有气体' }
    ];

    const legend = svg.selectAll('.legend')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${50 + i * 150}, ${450})`);

    legend.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => d.color)
      .attr('stroke', '#333');

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .text(d => d.label);

    return Promise.resolve();
  }

  /**
   * 渲染化学反应
   */
  renderReaction(container, config) {
    const { reaction = 'combustion', animate = true } = config;

    // 反应数据库
    const reactions = {
      'combustion': {
        name: '氢气燃烧',
        equation: '2H₂ + O₂ → 2H₂O',
        reactants: [
          { molecule: 'H₂', count: 2, color: '#ffffff' },
          { molecule: 'O₂', count: 1, color: '#ff0000' }
        ],
        products: [
          { molecule: 'H₂O', count: 2, color: '#4169e1' }
        ]
      },
      'synthesis': {
        name: '氨合成',
        equation: 'N₂ + 3H₂ → 2NH₃',
        reactants: [
          { molecule: 'N₂', count: 1, color: '#006400' },
          { molecule: 'H₂', count: 3, color: '#ffffff' }
        ],
        products: [
          { molecule: 'NH₃', count: 2, color: '#9370db' }
        ]
      }
    };

    const reactionData = reactions[reaction] || reactions['combustion'];

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(reactionData.name, 400, 40);

    // 化学方程式
    ctx.font = '16px Arial';
    ctx.fillText(reactionData.equation, 400, 70);

    // 绘制反应物和产物
    const drawMolecules = (molecules, startX, startY, label) => {
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, startX, startY);

      molecules.forEach((mol, index) => {
        const x = startX + index * 120;
        const y = startY + 50;

        // 绘制分子球
        for (let i = 0; i < mol.count; i++) {
          ctx.fillStyle = mol.color;
          ctx.beginPath();
          ctx.arc(x + i * 25, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 标签
        ctx.fillStyle = '#ccc';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(mol.molecule, x + (mol.count - 1) * 12.5, y + 30);
      });
    };

    drawMolecules(reactionData.reactants, 100, 150, '反应物:');
    drawMolecules(reactionData.products, 500, 150, '产物:');

    // 绘制箭头
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(380, 200);
    ctx.lineTo(420, 200);
    ctx.stroke();

    // 箭头头部
    ctx.beginPath();
    ctx.moveTo(420, 200);
    ctx.lineTo(410, 190);
    ctx.moveTo(420, 200);
    ctx.lineTo(410, 210);
    ctx.stroke();

    // 动画效果
    if (animate) {
      let particleX = 300;
      let particleY = 200;
      let movingRight = true;

      const animateParticles = () => {
        // 清空粒子区域
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(280, 180, 240, 40);

        // 重绘箭头
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(380, 200);
        ctx.lineTo(420, 200);
        ctx.stroke();

        // 绘制移动粒子
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 5, 0, Math.PI * 2);
        ctx.fill();

        // 更新粒子位置
        if (movingRight) {
          particleX += 2;
          if (particleX > 500) {
            particleX = 300;
          }
        }

        requestAnimationFrame(animateParticles);
      };

      animateParticles();
    }

    return Promise.resolve();
  }

  /**
   * 渲染晶体结构
   */
  renderCrystal(container, config) {
    const { structure = 'cubic', size = 5 } = config;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const centerX = 300;
    const centerY = 300;
    const latticeSize = 40;

    // 绘制立方晶格
    const drawCubicLattice = () => {
      const atoms = [];

      // 生成晶格点
      for (let i = -size; i <= size; i++) {
        for (let j = -size; j <= size; j++) {
          for (let k = -size; k <= size; k++) {
            // 简单的3D到2D投影
            const x = centerX + (i + k * 0.5) * latticeSize;
            const y = centerY + (j + k * 0.3) * latticeSize;
            const z = k;

            atoms.push({ x, y, z });
          }
        }
      }

      // 按z坐标排序（深度排序）
      atoms.sort((a, b) => a.z - b.z);

      // 绘制原子
      atoms.forEach(atom => {
        const radius = 8 - atom.z * 0.5;
        const opacity = 0.3 + atom.z * 0.1;

        ctx.fillStyle = `rgba(100, 149, 237, ${opacity})`;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, Math.max(radius, 2), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    drawCubicLattice();

    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('立方晶格结构', centerX, 40);

    return Promise.resolve();
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.initialized) {
      console.log('🧹 清理化学可视化模块资源...');
      this.initialized = false;
    }
  }
}

// 导出模块
export default ChemistryVisualizationModule;

// 如果需要支持CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChemistryVisualizationModule;
}