/**
 * Physics Visualization Module
 * 物理学可视化模块 - 懒加载实现
 *
 * 这个模块包含所有物理学相关的可视化功能
 * 通过动态导入实现代码分割
 */

class PhysicsVisualizationModule {
  constructor() {
    this.name = 'Physics Visualization';
    this.version = '1.0.0';
    this.dependencies = ['Matter.js', 'Chart.js'];
    this.initialized = false;
  }

  /**
   * 初始化物理学可视化模块
   */
  async init() {
    if (this.initialized) return;

    console.log('⚛️ 初始化物理学可视化模块...');

    // 动态加载依赖库
    await this.loadDependencies();

    // 初始化物理学可视化组件
    this.initComponents();

    this.initialized = true;
    console.log('✅ 物理学可视化模块初始化完成');
  }

  /**
   * 动态加载依赖库
   */
  async loadDependencies() {
    const dependencies = [
      {
        name: 'Matter.js',
        url: 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js',
        check: () => window.Matter
      },
      {
        name: 'Chart.js',
        url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
        check: () => window.Chart
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
   * 初始化物理学可视化组件
   */
  initComponents() {
    // 注册物理学可视化类型
    this.registerVisualizationTypes();
  }

  /**
   * 注册可视化类型
   */
  registerVisualizationTypes() {
    const visualizationTypes = [
      {
        id: 'mechanics',
        name: '力学',
        description: '牛顿力学、运动学等可视化',
        category: 'physics',
        render: this.renderMechanics.bind(this)
      },
      {
        id: 'waves',
        name: '波动',
        description: '声波、光波、电磁波可视化',
        category: 'physics',
        render: this.renderWaves.bind(this)
      },
      {
        id: 'quantum',
        name: '量子物理',
        description: '量子力学概念可视化',
        category: 'physics',
        render: this.renderQuantum.bind(this)
      },
      {
        id: 'thermodynamics',
        name: '热力学',
        description: '热力学定律和过程可视化',
        category: 'physics',
        render: this.renderThermodynamics.bind(this)
      }
    ];

    // 触发注册事件
    window.dispatchEvent(new CustomEvent('registerVisualizationTypes', {
      detail: { types: visualizationTypes, module: this.name }
    }));
  }

  /**
   * 渲染力学可视化
   */
  renderMechanics(container, config) {
    const { type = 'projectile', parameters = {} } = config;

    switch (type) {
      case 'projectile':
        return this.renderProjectileMotion(container, parameters);
      case 'pendulum':
        return this.renderPendulum(container, parameters);
      case 'collision':
        return this.renderCollision(container, parameters);
      default:
        return this.renderProjectileMotion(container, parameters);
    }
  }

  /**
   * 渲染抛物运动
   */
  renderProjectileMotion(container, parameters) {
    const {
      initialVelocity = 50,
      angle = 45,
      gravity = 9.8,
      showTrail = true,
      showVectors = true
    } = parameters;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const angleRad = angle * Math.PI / 180;
    const vx = initialVelocity * Math.cos(angleRad);
    const vy = initialVelocity * Math.sin(angleRad);

    let time = 0;
    const trail = [];
    const maxTrailLength = 50;

    const animate = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 计算位置
      const x = vx * time;
      const y = vy * time - 0.5 * gravity * time * time;

      // 转换坐标系统
      const screenX = x * 5; // 缩放因子
      const screenY = canvas.height - (y * 5) - 50; // 翻转Y轴并偏移

      // 添加轨迹点
      if (showTrail && y >= 0) {
        trail.push({ x: screenX, y: screenY });
        if (trail.length > maxTrailLength) {
          trail.shift();
        }
      }

      // 绘制轨迹
      if (showTrail && trail.length > 1) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        trail.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }

      // 绘制抛射物
      if (y >= 0 && screenX < canvas.width) {
        // 绘制物体
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();

        // 绘制速度矢量
        if (showVectors) {
          const currentVx = vx;
          const currentVy = vy - gravity * time;
          const vectorScale = 2;

          // 速度矢量
          ctx.strokeStyle = '#2ecc71';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + currentVx * vectorScale, screenY - currentVy * vectorScale);
          ctx.stroke();

          // 箭头
          this.drawArrow(ctx, screenX, screenY,
                        screenX + currentVx * vectorScale, screenY - currentVy * vectorScale);
        }

        time += 0.05;
        requestAnimationFrame(animate);
      } else {
        // 显示统计信息
        this.showProjectileStats(ctx, canvas.width, canvas.height, {
          maxDistance: (vx * vy * 2) / gravity,
          maxHeight: (vy * vy) / (2 * gravity),
          totalTime: (2 * vy) / gravity
        });
      }
    };

    animate();

    return Promise.resolve();
  }

  /**
   * 绘制箭头
   */
  drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6),
              toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6),
              toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  /**
   * 显示抛物运动统计
   */
  showProjectileStats(ctx, width, height, stats) {
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`最大距离: ${stats.maxDistance.toFixed(2)}m`, 20, 30);
    ctx.fillText(`最大高度: ${stats.maxHeight.toFixed(2)}m`, 20, 50);
    ctx.fillText(`飞行时间: ${stats.totalTime.toFixed(2)}s`, 20, 70);
  }

  /**
   * 渲染单摆运动
   */
  renderPendulum(container, parameters) {
    const { length = 200, mass = 10, initialAngle = 30, damping = 0.99 } = parameters;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const pivotX = canvas.width / 2;
    const pivotY = 50;

    let angle = initialAngle * Math.PI / 180;
    let angleVelocity = 0;
    const gravity = 9.8;
    const dt = 0.05;

    const animate = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 计算加速度
      const angleAcceleration = -(gravity / length) * Math.sin(angle);

      // 更新速度和位置
      angleVelocity += angleAcceleration * dt;
      angleVelocity *= damping; // 阻尼
      angle += angleVelocity * dt;

      // 计算球的位置
      const bobX = pivotX + length * Math.sin(angle);
      const bobY = pivotY + length * Math.cos(angle);

      // 绘制支点
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
      ctx.fill();

      // 绘制绳子
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // 绘制球
      const ballRadius = Math.sqrt(mass) * 3;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(bobX, bobY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // 显示能量信息
      const kineticEnergy = 0.5 * mass * Math.pow(length * angleVelocity, 2);
      const potentialEnergy = mass * gravity * length * (1 - Math.cos(angle));
      const totalEnergy = kineticEnergy + potentialEnergy;

      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(`动能: ${kineticEnergy.toFixed(2)}J`, 20, 30);
      ctx.fillText(`势能: ${potentialEnergy.toFixed(2)}J`, 20, 50);
      ctx.fillText(`总能量: ${totalEnergy.toFixed(2)}J`, 20, 70);

      requestAnimationFrame(animate);
    };

    animate();

    return Promise.resolve();
  }

  /**
   * 渲染碰撞
   */
  renderCollision(container, parameters) {
    const { mass1 = 10, mass2 = 5, velocity1 = 10, velocity2 = -5, elasticity = 0.8 } = parameters;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let x1 = 100, x2 = 600;
    let v1 = velocity1, v2 = velocity2;

    const animate = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新位置
      x1 += v1;
      x2 += v2;

      // 检测碰撞
      const r1 = Math.sqrt(mass1) * 5;
      const r2 = Math.sqrt(mass2) * 5;

      if (Math.abs(x1 - x2) <= r1 + r2) {
        // 弹性碰撞公式
        const v1New = ((mass1 - elasticity * mass2) * v1 + (1 + elasticity) * mass2 * v2) / (mass1 + mass2);
        const v2New = ((mass2 - elasticity * mass1) * v2 + (1 + elasticity) * mass1 * v1) / (mass1 + mass2);

        v1 = v1New;
        v2 = v2New;
      }

      // 边界反弹
      if (x1 <= r1 || x1 >= canvas.width - r1) {
        v1 *= -elasticity;
        x1 = Math.max(r1, Math.min(canvas.width - r1, x1));
      }
      if (x2 <= r2 || x2 >= canvas.width - r2) {
        v2 *= -elasticity;
        x2 = Math.max(r2, Math.min(canvas.width - r2, x2));
      }

      // 绘制球1
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(x1, canvas.height / 2, r1, 0, Math.PI * 2);
      ctx.fill();

      // 绘制球2
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(x2, canvas.height / 2, r2, 0, Math.PI * 2);
      ctx.fill();

      // 显示速度
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(`v1 = ${v1.toFixed(1)} m/s`, x1 - 20, canvas.height / 2 - 20);
      ctx.fillText(`v2 = ${v2.toFixed(1)} m/s`, x2 - 20, canvas.height / 2 - 20);

      requestAnimationFrame(animate);
    };

    animate();

    return Promise.resolve();
  }

  /**
   * 渲染波动可视化
   */
  renderWaves(container, config) {
    const { type = 'sine', frequency = 1, amplitude = 50, wavelength = 100 } = config;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 300;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let phase = 0;

    const animate = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制坐标轴
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // 绘制波形
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + amplitude * Math.sin((x / wavelength - phase) * 2 * Math.PI * frequency);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      phase += 0.02;

      // 显示参数
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(`频率: ${frequency} Hz`, 20, 30);
      ctx.fillText(`振幅: ${amplitude} px`, 20, 50);
      ctx.fillText(`波长: ${wavelength} px`, 20, 70);

      requestAnimationFrame(animate);
    };

    animate();

    return Promise.resolve();
  }

  /**
   * 渲染量子物理可视化
   */
  renderQuantum(container, config) {
    const { concept = 'wavefunction', energy = 1 } = config;

    if (concept === 'wavefunction') {
      return this.renderWaveFunction(container, { energy });
    }

    return Promise.resolve();
  }

  /**
   * 渲染波函数
   */
  renderWaveFunction(container, parameters) {
    const { energy = 1 } = parameters;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // 绘制势阱
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(100, 350);
    ctx.moveTo(500, 50);
    ctx.lineTo(500, 350);
    ctx.stroke();

    // 绘制波函数
    const drawWaveFunction = (n, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 100; x <= 500; x++) {
        const L = 400; // 势阱宽度
        const normalizedX = (x - 100) / L;
        const psi = Math.sqrt(2 / L) * Math.sin(n * Math.PI * normalizedX);
        const probability = psi * psi;

        const y = 350 - probability * 200; // 概率密度

        if (x === 100) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    // 绘制不同能级的波函数
    drawWaveFunction(1, '#3498db');
    drawWaveFunction(2, '#2ecc71');
    drawWaveFunction(3, '#f39c12');

    // 添加标签
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('量子势阱中的波函数', 200, 30);
    ctx.fillText('n=1', 150, 100);
    ctx.fillText('n=2', 250, 100);
    ctx.fillText('n=3', 350, 100);

    return Promise.resolve();
  }

  /**
   * 渲染热力学可视化
   */
  renderThermodynamics(container, config) {
    const { type = 'pv-diagram', process = 'isothermal' } = config;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.border = '1px solid #333';
    canvas.style.backgroundColor = '#1a1a1a';

    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // 绘制P-V图
    this.drawPVDiagram(ctx, canvas.width, canvas.height, process);

    return Promise.resolve();
  }

  /**
   * 绘制P-V图
   */
  drawPVDiagram(ctx, width, height, process) {
    // 坐标系
    const originX = 80;
    const originY = height - 80;
    const axisLength = Math.min(width - 120, height - 120);

    // 绘制坐标轴
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + axisLength, originY); // V轴
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, originY - axisLength); // P轴
    ctx.stroke();

    // 坐标轴标签
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('V', originX + axisLength - 20, originY + 20);
    ctx.fillText('P', originX - 20, originY - axisLength + 20);

    // 绘制热力学过程
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const v = 1 + (i / points) * 4; // 体积从1到5
      let p;

      switch (process) {
        case 'isothermal':
          p = 10 / v; // 等温过程 PV = 常数
          break;
        case 'adiabatic':
          p = 10 / Math.pow(v, 1.4); // 绝热过程 PV^γ = 常数
          break;
        case 'isobaric':
          p = 3; // 等压过程
          break;
        case 'isochoric':
          // 等容过程 - 垂直线
          if (i === 0 || i === points) {
            p = 2 + (i / points) * 6;
          } else {
            continue;
          }
          break;
        default:
          p = 10 / v;
      }

      const x = originX + (v / 5) * axisLength;
      const y = originY - (p / 10) * axisLength;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // 添加过程标签
    const processNames = {
      'isothermal': '等温过程',
      'adiabatic': '绝热过程',
      'isobaric': '等压过程',
      'isochoric': '等容过程'
    };

    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';
    ctx.fillText(processNames[process] || process, width / 2 - 40, 50);
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.initialized) {
      console.log('🧹 清理物理学可视化模块资源...');
      this.initialized = false;
    }
  }
}

// 导出模块
export default PhysicsVisualizationModule;

// 如果需要支持CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhysicsVisualizationModule;
}