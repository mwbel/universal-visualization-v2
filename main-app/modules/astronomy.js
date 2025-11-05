/**
 * Astronomy Visualization Module
 * 天文学可视化模块 - 懒加载实现
 *
 * 这个模块包含所有天文学相关的可视化功能
 * 通过动态导入实现代码分割
 */

class AstronomyVisualizationModule {
  constructor() {
    this.name = 'Astronomy Visualization';
    this.version = '1.0.0';
    this.dependencies = ['Three.js', 'D3.js'];
    this.initialized = false;
  }

  /**
   * 初始化天文学可视化模块
   */
  async init() {
    if (this.initialized) return;

    console.log('🔭 初始化天文学可视化模块...');

    // 动态加载依赖库
    await this.loadDependencies();

    // 初始化天文学可视化组件
    this.initComponents();

    this.initialized = true;
    console.log('✅ 天文学可视化模块初始化完成');
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
   * 初始化天文学可视化组件
   */
  initComponents() {
    // 注册天文学可视化类型
    this.registerVisualizationTypes();
  }

  /**
   * 注册可视化类型
   */
  registerVisualizationTypes() {
    const visualizationTypes = [
      {
        id: 'solar-system',
        name: '太阳系',
        description: '太阳系行星运动模拟',
        category: 'astronomy',
        render: this.renderSolarSystem.bind(this)
      },
      {
        id: 'planet-orbit',
        name: '行星轨道',
        description: '单个行星轨道运动',
        category: 'astronomy',
        render: this.renderPlanetOrbit.bind(this)
      },
      {
        id: 'constellation',
        name: '星座',
        description: '星座图和恒星位置',
        category: 'astronomy',
        render: this.renderConstellation.bind(this)
      },
      {
        id: 'galaxy',
        name: '星系',
        description: '星系结构和演化',
        category: 'astronomy',
        render: this.renderGalaxy.bind(this)
      }
    ];

    // 触发注册事件
    window.dispatchEvent(new CustomEvent('registerVisualizationTypes', {
      detail: { types: visualizationTypes, module: this.name }
    }));
  }

  /**
   * 渲染太阳系
   */
  renderSolarSystem(container, config) {
    const { scale = 1, showOrbits = true, animate = true } = config;

    // 创建太阳系数据
    const planets = [
      { name: '水星', radius: 4, distance: 40, color: '#8C7853', period: 0.24 },
      { name: '金星', radius: 8, distance: 70, color: '#FFC649', period: 0.62 },
      { name: '地球', radius: 8, distance: 100, color: '#4169E1', period: 1 },
      { name: '火星', radius: 6, distance: 140, color: '#CD5C5C', period: 1.88 },
      { name: '木星', radius: 20, distance: 200, color: '#DAA520', period: 11.86 },
      { name: '土星', radius: 18, distance: 250, color: '#F4A460', period: 29.46 }
    ];

    return this.render2DSolarSystem(container, planets, { scale, showOrbits, animate });
  }

  /**
   * 渲染2D太阳系
   */
  render2DSolarSystem(container, planets, options) {
    const svg = d3.select(container)
      .append('svg')
      .attr('width', '800')
      .attr('height', '600')
      .style('background-color', '#000814');

    const centerX = 400;
    const centerY = 300;
    const { scale, showOrbits, animate } = options;

    // 添加太阳
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 15 * scale)
      .attr('fill', '#FDB813')
      .attr('stroke', '#FFA000')
      .attr('stroke-width', 2);

    // 添加太阳光晕
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 25 * scale)
      .attr('fill', 'none')
      .attr('stroke', '#FDB813')
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);

    // 创建行星组
    const planetGroups = svg.selectAll('.planet-group')
      .data(planets)
      .enter()
      .append('g')
      .attr('class', 'planet-group');

    // 添加轨道
    if (showOrbits) {
      planetGroups.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', d => d.distance * scale)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
    }

    // 添加行星
    const planets_sel = planetGroups.append('circle')
      .attr('r', d => d.radius * scale * 0.5)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // 添加行星标签
    planetGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-15')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .text(d => d.name);

    // 动画
    if (animate) {
      let time = 0;
      const animatePlanets = () => {
        time += 0.01;

        planets_sel
          .attr('cx', d => centerX + d.distance * scale * Math.cos(time / d.period))
          .attr('cy', d => centerY + d.distance * scale * Math.sin(time / d.period));

        requestAnimationFrame(animatePlanets);
      };
      animatePlanets();
    } else {
      // 静态位置
      planets_sel
        .attr('cx', d => centerX + d.distance * scale)
        .attr('cy', d => centerY);
    }

    return Promise.resolve();
  }

  /**
   * 渲染行星轨道
   */
  renderPlanetOrbit(container, config) {
    const { planet = '地球', period = 1, distance = 150, showTrail = true } = config;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '600')
      .attr('height', '600')
      .style('background-color', '#000814');

    const centerX = 300;
    const centerY = 300;

    // 添加中心天体（太阳）
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 20)
      .attr('fill', '#FDB813')
      .attr('stroke', '#FFA000')
      .attr('stroke-width', 2);

    // 添加轨道
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', distance)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // 行星轨迹点
    const trailLength = 50;
    const trailData = [];

    // 创建轨迹线
    const trailLine = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCardinal);

    const trailPath = svg.append('path')
      .attr('fill', 'none')
      .attr('stroke', '#4169E1')
      .attr('stroke-width', 2)
      .attr('opacity', 0.5);

    // 创建行星
    const planet = svg.append('circle')
      .attr('r', 8)
      .attr('fill', '#4169E1')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // 添加行星标签
    svg.append('text')
      .attr('id', 'planet-label')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .text(planet);

    // 动画函数
    let angle = 0;
    const animate = () => {
      angle += 0.02 / period;

      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      // 更新行星位置
      planet
        .attr('cx', x)
        .attr('cy', y);

      // 更新标签位置
      d3.select('#planet-label')
        .attr('x', x)
        .attr('y', y - 15);

      // 更新轨迹
      if (showTrail) {
        trailData.push({ x, y });
        if (trailData.length > trailLength) {
          trailData.shift();
        }
        trailPath.attr('d', trailLine(trailData));
      }

      requestAnimationFrame(animate);
    };

    animate();

    return Promise.resolve();
  }

  /**
   * 渲染星座
   */
  renderConstellation(container, config) {
    const { constellation = '大熊座', showStars = true, showLines = true } = config;

    // 星座数据
    const constellations = {
      '大熊座': {
        stars: [
          { name: '天枢', x: 100, y: 200, magnitude: 1.8 },
          { name: '天璇', x: 150, y: 180, magnitude: 2.3 },
          { name: '天玑', x: 200, y: 190, magnitude: 2.4 },
          { name: '天权', x: 250, y: 210, magnitude: 3.3 },
          { name: '玉衡', x: 300, y: 180, magnitude: 1.8 },
          { name: '开阳', x: 350, y: 160, magnitude: 2.2 },
          { name: '摇光', x: 400, y: 140, magnitude: 1.9 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]
      }
    };

    const data = constellations[constellation] || constellations['大熊座'];

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '500')
      .attr('height', '400')
      .style('background-color', '#000814');

    // 添加连线
    if (showLines) {
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y);

      data.lines.forEach(line => {
        const points = line.map(index => data.stars[index]);
        svg.append('path')
          .datum(points)
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#444')
          .attr('stroke-width', 1);
      });
    }

    // 添加恒星
    if (showStars) {
      const stars = svg.selectAll('.star')
        .data(data.stars)
        .enter()
        .append('g')
        .attr('class', 'star');

      // 根据星等设置大小
      stars.append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => 6 - d.magnitude)
        .attr('fill', '#fff')
        .attr('opacity', d => 1.2 - d.magnitude * 0.2);

      // 添加星名
      stars.append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccc')
        .attr('font-size', '10px')
        .text(d => d.name);
    }

    // 添加星座名称
    svg.append('text')
      .attr('x', 250)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text(constellation);

    return Promise.resolve();
  }

  /**
   * 渲染星系
   */
  renderGalaxy(container, config) {
    const { type = 'spiral', arms = 4, stars = 1000 } = config;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '800')
      .attr('height', '600')
      .style('background-color', '#000814');

    const centerX = 400;
    const centerY = 300;

    // 生成星系数据
    const generateGalaxyData = () => {
      const data = [];

      for (let i = 0; i < stars; i++) {
        const angle = Math.random() * Math.PI * 2;
        const armOffset = Math.floor(Math.random() * arms) * (Math.PI * 2 / arms);
        const distance = Math.random() * 200 + 50;
        const spread = Math.random() * 30 - 15;

        const x = centerX + (distance + spread) * Math.cos(angle + armOffset);
        const y = centerY + (distance + spread) * Math.sin(angle + armOffset);

        const brightness = Math.random() * 0.8 + 0.2;
        const size = Math.random() * 2 + 0.5;

        data.push({ x, y, brightness, size });
      }

      return data;
    };

    const galaxyData = generateGalaxyData();

    // 添加星系核心
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 30)
      .attr('fill', '#FDB813')
      .attr('opacity', 0.8);

    // 添加光晕
    const gradient = svg.append('defs')
      .append('radialGradient')
      .attr('id', 'core-glow');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FDB813')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#FFA000')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#000814')
      .attr('stop-opacity', 0);

    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 100)
      .attr('fill', 'url(#core-glow)');

    // 添加恒星
    svg.selectAll('.galaxy-star')
      .data(galaxyData)
      .enter()
      .append('circle')
      .attr('class', 'galaxy-star')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.size)
      .attr('fill', '#fff')
      .attr('opacity', d => d.brightness);

    return Promise.resolve();
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.initialized) {
      console.log('🧹 清理天文学可视化模块资源...');
      this.initialized = false;
    }
  }
}

// 导出模块
export default AstronomyVisualizationModule;

// 如果需要支持CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AstronomyVisualizationModule;
}