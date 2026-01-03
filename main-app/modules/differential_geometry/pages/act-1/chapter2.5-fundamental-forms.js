// 第2.5章：第一基本形式与第二基本形式 - 可视化实现

// 全局变量
let currentSurfaceParams = {u: 1, v: 1};
let currentSurfaceType = 'saddle';
let animationId = null;

// 跟踪已初始化的Plotly图表，避免重复创建导致的错误
const initializedCharts = new Set();

// 安全的Plotly渲染函数：自动选择newPlot或react
function safePlotlyRender(containerId, data, layout, config = {responsive: true}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[ERROR] Container ${containerId} not found`);
        return;
    }

    try {
        if (initializedCharts.has(containerId)) {
            // 已经初始化过，使用react更新
            Plotly.react(container, data, layout, config);
        } else {
            // 第一次渲染，使用newPlot
            Plotly.newPlot(container, data, layout, config);
            initializedCharts.add(containerId);
        }
    } catch (error) {
        console.error(`[ERROR] Plotly rendering failed for ${containerId}:`, error);
    }
}

// ==================== 第一基本形式相关函数 ====================

// 更新第一基本形式曲面
function updateFirstFormSurface() {
    console.log('[DEBUG] updateFirstFormSurface called');
    const container = document.getElementById('first-form-surface');
    if (!container) {
        console.error('[DEBUG] Container first-form-surface not found!');
        return;
    }

    const u_param = parseFloat(document.getElementById('param-u-ff').value);
    const v_param = parseFloat(document.getElementById('param-v-ff').value);

    // 生成参数化曲面（使用双曲抛物面作为示例）
    const surfaceData = generateParametricSurface('saddle', 1, 1);

    // 在当前参数点添加标记
    const currentPointMarker = {
        x: [u_param],
        y: [v_param],
        z: [u_param*u_param - v_param*v_param],  // z = u² - v²
        type: 'scatter3d',
        mode: 'markers',
        marker: {
            color: 'red',
            size: 6,
            line: {color: 'darkred', width: 2}
        },
        name: '当前计算点'
    };

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            opacity: 0.8,
            colorscale: 'Viridis',
            name: '曲面',
            showscale: false
        },
        currentPointMarker
    ];

    const layout = {
        title: `参数化曲面（双曲抛物面 $z = x^2 - y^2$）- 当前点: (${u_param.toFixed(1)}, ${v_param.toFixed(1)})`,
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube'
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    // 使用安全的渲染函数
    safePlotlyRender('first-form-surface', data, layout);
}

// ==================== 辅助函数：获取容器的ID ====================
function getContainerId(element) {
    if (!element || !element.id) {
        console.error('[ERROR] Invalid container element');
        return null;
    }
    return element.id;
}

// ==================== 辅助函数：安全的Plotly调用 ====================
function safePlotlyCall(container, data, layout, config, functionName) {
    try {
        // 首先尝试使用react（更快）
        Plotly.react(container, data, layout, config);
    } catch (error) {
        console.error(`[ERROR] Plotly.react failed in ${functionName}:`, error);
        // 尝试使用 newPlot 作为后备
        try {
            Plotly.newPlot(container, data, layout, config);
        } catch (error2) {
            console.error(`[ERROR] Plotly.newPlot also failed in ${functionName}:`, error2);
        }
    }
}

// 生成参数化曲面
function generateParametricSurface(type, a, b) {
    const resolution = 30;
    const range = 2;

    // 创建二维数组用于z值
    const z = [];
    const x = [];
    const y = [];

    // 首先创建x和y的一维坐标数组
    for (let i = 0; i <= resolution; i++) {
        const u = (i - resolution/2) * range / resolution;
        x.push(u);
    }
    for (let j = 0; j <= resolution; j++) {
        const v = (j - resolution/2) * range / resolution;
        y.push(v);
    }

    // 然后创建z的二维数组
    for (let i = 0; i <= resolution; i++) {
        const z_row = [];
        const u = (i - resolution/2) * range / resolution;
        for (let j = 0; j <= resolution; j++) {
            const v = (j - resolution/2) * range / resolution;

            let z_val;
            switch(type) {
                case 'saddle':
                    z_val = a * (u*u - v*v);
                    break;
                case 'paraboloid':
                    z_val = a * (u*u + v*v);
                    break;
                case 'cylinder':
                    z_val = v;
                    break;
                default:
                    z_val = 0;
            }
            z_row.push(z_val);
        }
        z.push(z_row);
    }

    return {x, y, z, type, a, b};
}

// 生成参数网格线
function generateParameterGridLines(surfaceData) {
    const lines = [];
    const resolution = 30;

    // u方向网格线
    for (let j = 0; j <= resolution; j += 5) {
        const x_line = [];
        const y_line = [];
        const z_line = [];

        for (let i = 0; i <= resolution; i++) {
            const idx = i * (resolution + 1) + j;
            x_line.push(surfaceData.x[idx]);
            y_line.push(surfaceData.y[idx]);
            z_line.push(surfaceData.z[idx]);
        }

        lines.push({
            x: x_line,
            y: y_line,
            z: z_line,
            type: 'scatter3d',
            mode: 'lines',
            line: {color: 'red', width: 2},
            name: `u-线${j}`
        });
    }

    return lines;
}

// 显示参数网格
function showParameterGrid() {
    const container = document.getElementById('first-form-surface');
    if (!container) return;

    const surfaceData = generateParametricSurface('saddle', 1, 1);
    const gridLines = generateParameterGridLines(surfaceData);

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'Viridis',
            showscale: false,
            name: '曲面'
        },
        ...gridLines
    ];

    const layout = {
        title: '参数网格（红线：u方向，蓝线：v方向）',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    safePlotlyRender(container.id, data, layout);
}

// 计算第一基本形式系数
function calculateFirstFormCoefficients() {
    console.log('Calculating first fundamental form coefficients...');

    const paramUElement = document.getElementById('param-u-ff');
    const paramVElement = document.getElementById('param-v-ff');

    if (!paramUElement || !paramVElement) {
        console.error('Parameter sliders not found!');
        return;
    }

    const surfaceType = 'saddle';
    const a = 1;
    const b = 1;

    // 对于双曲抛物面 z = a(x² - y²)
    // 参数化：x = u, y = v, z = a(u² - v²)
    // r_u = (1, 0, 2au)
    // r_v = (0, 1, -2av)

    // 获取当前点的参数值
    const u0 = parseFloat(paramUElement.value);
    const v0 = parseFloat(paramVElement.value);

    console.log(`u0 = ${u0}, v0 = ${v0}`);

    // 计算偏导数
    const ru = {x: 1, y: 0, z: 2 * a * u0};
    const rv = {x: 0, y: 1, z: -2 * a * v0};

    // 计算第一基本形式系数
    const E = ru.x * ru.x + ru.y * ru.y + ru.z * ru.z;
    const F = ru.x * rv.x + ru.y * rv.y + ru.z * rv.z;
    const G = rv.x * rv.x + rv.y * rv.y + rv.z * rv.z;

    console.log(`E = ${E}, F = ${F}, G = ${G}`);

    // 更新显示
    const coeffE = document.getElementById('coeff-E');
    const coeffF = document.getElementById('coeff-F');
    const coeffF2 = document.getElementById('coeff-F2');
    const coeffG = document.getElementById('coeff-G');
    const metricDet = document.getElementById('metric-det');
    const areaElement = document.getElementById('area-element');

    if (coeffE) coeffE.textContent = `E = ${E.toFixed(4)}`;
    if (coeffF) coeffF.textContent = `F = ${F.toFixed(4)}`;
    if (coeffF2) coeffF2.textContent = `F = ${F.toFixed(4)}`;
    if (coeffG) coeffG.textContent = `G = ${G.toFixed(4)}`;

    const det = E * G - F * F;
    const areaElem = Math.sqrt(det);

    if (metricDet) metricDet.textContent = det.toFixed(4);
    if (areaElement) areaElement.textContent = `√(EG-F²) = ${areaElem.toFixed(4)}`;

    // 可视化偏导数向量
    visualizeTangentVectors(ru, rv);

    console.log('First fundamental form coefficients calculated successfully');
}

// 可视化切向量
function visualizeTangentVectors(ru, rv) {
    const container = document.getElementById('arc-length-viz');
    if (!container) return;

    const scale = 0.5;

    const data = [
        // 原点
        {
            x: [0],
            y: [0],
            z: [0],
            type: 'scatter3d',
            mode: 'markers',
            marker: {color: 'black', size: 5},
            name: '原点'
        },
        // r_u 向量（红色）
        {
            x: [0, ru.x * scale],
            y: [0, ru.y * scale],
            z: [0, ru.z * scale],
            type: 'scatter3d',
            mode: 'lines',
            line: {color: 'red', width: 8},
            name: 'r_u'
        },
        // r_v 向量（蓝色）
        {
            x: [0, rv.x * scale],
            y: [0, rv.y * scale],
            z: [0, rv.z * scale],
            type: 'scatter3d',
            mode: 'lines',
            line: {color: 'blue', width: 8},
            name: 'r_v'
        }
    ];

    const layout = {
        title: '切向量 r_u (红) 和 r_v (蓝)',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 250,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    try {
        Plotly.react(container, data, layout, {responsive: true});
    } catch (error) {
        console.error('[ERROR] Plotly.react failed in visualizeTangentVectors:', error);
        // 尝试使用 newPlot 作为后备
        try {
            Plotly.newPlot(container, data, layout, {responsive: true});
        } catch (error2) {
            console.error('[ERROR] Plotly.newPlot also failed:', error2);
        }
    }
}

// 显示度量性质
function showMetricProperties() {
    const container = document.getElementById('area-element-viz');
    if (!container) return;

    // 创建一个可视化，展示面积元素
    const u0 = parseFloat(document.getElementById('param-u-ff').value);
    const v0 = parseFloat(document.getElementById('param-v-ff').value);

    // 计算切向量
    const ru = {x: 1, y: 0, z: 2 * u0};
    const rv = {x: 0, y: 1, z: -2 * v0};

    // 面积元素向量（叉积）
    const normal = {
        x: ru.y * rv.z - ru.z * rv.y,
        y: ru.z * rv.x - ru.x * rv.z,
        z: ru.x * rv.y - ru.y * rv.x
    };

    const area = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);

    const data = [
        // 切向量形成的平行四边形
        {
            x: [0, ru.x, ru.x + rv.x, rv.x, 0],
            y: [0, ru.y, ru.y + rv.y, rv.y, 0],
            z: [0, ru.z, ru.z + rv.z, rv.z, 0],
            type: 'scatter3d',
            mode: 'lines',
            line: {color: 'green', width: 4},
            name: '面积元素'
        }
    ];

    const layout = {
        title: `面积元素 = ${area.toFixed(4)}`,
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 250,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 可视化弧长
function visualizeArcLength() {
    const container = document.getElementById('arc-length-viz');
    if (!container) return;

    // 在曲面上绘制一条曲线，并用第一基本形式计算弧长
    const t = [];
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 50; i++) {
        const ti = i * 0.1;
        t.push(ti);
        const u_val = Math.cos(ti);
        const v_val = Math.sin(ti);
        x.push(u_val);
        y.push(v_val);
        z.push(u_val * u_val - v_val * v_val);
    }

    // 计算弧长（使用第一基本形式）
    let arcLength = 0;
    for (let i = 1; i < t.length; i++) {
        const dt = t[i] - t[i-1];
        const u = t[i-1];
        const v = t[i-1];

        // 切向量
        const du_dt = -Math.sin(t[i-1]);
        const dv_dt = Math.cos(t[i-1]);

        // 第一基本形式：I = E du² + 2F du dv + G dv²
        const E = 1 + 4 * u * u;
        const F = -4 * u * v;
        const G = 1 + 4 * v * v;

        const ds = Math.sqrt(E * du_dt * du_dt + 2 * F * du_dt * dv_dt + G * dv_dt * dv_dt);
        arcLength += ds * dt;
    }

    const data = [
        {
            x: x,
            y: y,
            z: z,
            type: 'scatter3d',
            mode: 'lines',
            line: {color: 'red', width: 6},
            name: '曲线'
        }
    ];

    const layout = {
        title: `弧长 = ${arcLength.toFixed(4)}`,
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 250,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 可视化面积元素
function visualizeAreaElement() {
    calculateFirstFormCoefficients();
    showMetricProperties();
}

// ==================== 第二基本形式相关函数 ====================

// 更新第二基本形式曲面
function updateSecondFormSurface() {
    const container = document.getElementById('second-form-surface');
    if (!container) return;

    const surfaceType = document.getElementById('surface-type-sf').value;
    const surfaceData = generateParametricSurface(surfaceType, 1, 1);

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            opacity: 0.8,
            colorscale: 'RdYlBu',
            name: '曲面'
        }
    ];

    const layout = {
        title: `曲面类型：${getSurfaceTypeName(surfaceType)}`,
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 显示法向量场
function showNormalVectors() {
    const container = document.getElementById('second-form-surface');
    if (!container) return;

    const surfaceType = document.getElementById('surface-type-sf').value;
    const surfaceData = generateParametricSurface(surfaceType, 1, 1);

    // 计算一些点上的法向量
    const normalVectors = calculateNormalVectors(surfaceType, 1, 1);

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'RdYlBu',
            showscale: false,
            name: '曲面'
        },
        // 法向量
        {
            x: normalVectors.origins.map(o => o.x),
            y: normalVectors.origins.map(o => o.y),
            z: normalVectors.origins.map(o => o.z),
            u: normalVectors.vectors.map(v => v.x),
            v: normalVectors.vectors.map(v => v.y),
            w: normalVectors.vectors.map(v => v.z),
            type: 'cone',
            sizemode: 'absolute',
            sizeref: 0.2,
            showscale: false,
            name: '法向量'
        }
    ];

    const layout = {
        title: '法向量场',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 计算法向量
function calculateNormalVectors(type, a, b) {
    const origins = [];
    const vectors = [];

    const resolution = 10;
    const range = 2;

    for (let i = 0; i <= resolution; i += 2) {
        for (let j = 0; j <= resolution; j += 2) {
            const u = (i - resolution/2) * range / resolution;
            const v = (j - resolution/2) * range / resolution;

            let x, y, z, ru, rv, normal;

            switch(type) {
                case 'saddle':
                    x = u;
                    y = v;
                    z = a * (u*u - v*v);
                    ru = {x: 1, y: 0, z: 2*a*u};
                    rv = {x: 0, y: 1, z: -2*a*v};
                    break;
                case 'paraboloid':
                    x = u;
                    y = v;
                    z = a * (u*u + v*v);
                    ru = {x: 1, y: 0, z: 2*a*u};
                    rv = {x: 0, y: 1, z: 2*a*v};
                    break;
                case 'cylinder':
                    x = Math.cos(u);
                    y = Math.sin(u);
                    z = v;
                    ru = {x: -Math.sin(u), y: Math.cos(u), z: 0};
                    rv = {x: 0, y: 0, z: 1};
                    break;
            }

            // 叉积得到法向量
            normal = {
                x: ru.y * rv.z - ru.z * rv.y,
                y: ru.z * rv.x - ru.x * rv.z,
                z: ru.x * rv.y - ru.y * rv.x
            };

            // 归一化
            const mag = Math.sqrt(normal.x*normal.x + normal.y*normal.y + normal.z*normal.z);
            if (mag > 0) {
                normal.x /= mag;
                normal.y /= mag;
                normal.z /= mag;
            }

            origins.push({x, y, z});
            vectors.push(normal);
        }
    }

    return {origins, vectors};
}

// 法向量变化动画
function animateNormalChange() {
    const container = document.getElementById('second-form-surface');
    if (!container) return;

    let frame = 0;
    const maxFrames = 100;

    function animate() {
        frame++;
        if (frame > maxFrames) {
            frame = 0;
        }

        const t = frame * 0.05;

        // 生成随时间变化的曲面
        const x = [], y = [], z = [];
        const resolution = 20;

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const u = (i - resolution/2) * 0.2;
                const v = (j - resolution/2) * 0.2;

                x.push(u);
                y.push(v);
                z.push(Math.cos(t) * (u*u - v*v) + Math.sin(t) * u * v);
            }
        }

        const data = [
            {
                x: x,
                y: y,
                z: z,
                type: 'surface',
                opacity: 0.8,
                colorscale: 'RdYlBu',
                name: '变形曲面'
            }
        ];

        const layout = {
            title: `法向量场变化 (t = ${t.toFixed(2)})`,
            scene: {
                xaxis: {range: [-2, 2]},
                yaxis: {range: [-2, 2]},
                zaxis: {range: [-2, 2]}
            },
            height: 350,
            margin: {l: 0, r: 0, t: 50, b: 0}
        };

        safePlotlyRender(container.id, data, layout);

        if (frame < maxFrames) {
            animationId = requestAnimationFrame(animate);
        }
    }

    animate();
}

// 计算第二基本形式系数
function calculateSecondFormCoefficients() {
    const surfaceType = document.getElementById('surface-type-sf').value;
    const a = 1;
    const b = 1;

    // 使用原点作为计算点
    const u0 = 0;
    const v0 = 0;

    let e, f, g;

    switch(surfaceType) {
        case 'saddle':
            // 双曲抛物面 z = a(x² - y²)
            // r_uu = (0, 0, 2a), r_uv = (0, 0, 0), r_vv = (0, 0, -2a)
            // 在原点：n = (0, 0, 1)
            e = 2 * a;
            f = 0;
            g = -2 * a;
            break;
        case 'paraboloid':
            // 椭圆抛物面 z = a(x² + y²)
            // r_uu = (0, 0, 2a), r_uv = (0, 0, 0), r_vv = (0, 0, 2a)
            e = 2 * a;
            f = 0;
            g = 2 * a;
            break;
        case 'cylinder':
            // 圆柱面
            e = -1;
            f = 0;
            g = 0;
            break;
    }

    // 更新显示
    document.getElementById('coeff-e').textContent = `e = ${e.toFixed(4)}`;
    document.getElementById('coeff-f').textContent = `f = ${f.toFixed(4)}`;
    document.getElementById('coeff-f2').textContent = `f = ${f.toFixed(4)}`;
    document.getElementById('coeff-g').textContent = `g = ${g.toFixed(4)}`;

    const det = e * g - f * f;
    document.getElementById('second-form-det').textContent = det.toFixed(4);

    // 计算第一基本形式系数（在原点）
    const E = 1, F_val = 0, G = 1;
    const K = det / (E * G - F_val * F_val);

    document.getElementById('gaussian-from-forms').textContent = K.toFixed(4);
}

// ==================== 两个基本形式关系 ====================

// 可视化两个基本形式的关系
function visualizeFormsRelation() {
    const container = document.getElementById('forms-relation-viz');
    if (!container) return;

    // 创建一个并排显示两个基本形式的可视化
    const surfaceData = generateParametricSurface('saddle', 1, 1);

    // 计算第一基本形式度量
    const firstFormMetric = calculateFirstFormMetricField(surfaceData);

    // 计算第二基本形式度量
    const secondFormMetric = calculateSecondFormMetricField(surfaceData);

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            colorscale: 'Viridis',
            surfacecolor: firstFormMetric,
            colorbar: {title: 'I', x: 0.1},
            opacity: 0.9,
            name: '第一基本形式'
        }
    ];

    const layout = {
        title: '第一基本形式与第二基本形式的关系',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 计算第一基本形式的度量场
function calculateFirstFormMetricField(surfaceData) {
    const resolution = 30;
    const metrics = [];

    for (let i = 0; i <= resolution; i++) {
        const metric_row = [];
        for (let j = 0; j <= resolution; j++) {
            const u = (i - resolution/2) * 2 / resolution;
            const v = (j - resolution/2) * 2 / resolution;

            // 对于双曲抛物面 z = u² - v²
            // E = 1 + 4u², F = -4uv, G = 1 + 4v²
            const E = 1 + 4 * u * u;
            const F = -4 * u * v;
            const G = 1 + 4 * v * v;

            // 使用度量张量的行列式作为可视化值
            metric_row.push(E * G - F * F);
        }
        metrics.push(metric_row);
    }

    return metrics;
}

// 计算第二基本形式的度量场
function calculateSecondFormMetricField(surfaceData) {
    const resolution = 30;
    const metrics = [];

    for (let i = 0; i <= resolution; i++) {
        const metric_row = [];
        for (let j = 0; j <= resolution; j++) {
            const u = (i - resolution/2) * 2 / resolution;
            const v = (j - resolution/2) * 2 / resolution;

            // e = 2, f = 0, g = -2（在原点附近近似）
            const e = 2;
            const f = 0;
            const g = -2;

            metric_row.push(e * g - f * f);
        }
        metrics.push(metric_row);
    }

    return metrics;
}

// 显示形状算子
function showShapeOperator() {
    alert('形状算子（Shape Operator）是第二基本形式相对于第一基本形式的表示：\n\nS = I⁻¹ · II\n\n它描述了曲面法向量的变化率，与主曲率和主方向密切相关。');
}

// 演示绝妙定理
function demonstrateTheoremaEgregium() {
    const container = document.getElementById('forms-relation-viz');
    if (!container) return;

    // 创建两个可展开曲面（第一基本形式相同但第二基本形式不同）
    // 平面和圆柱面

    // 平面
    const planeData = generateParametricSurface('plane', 1, 1);

    // 圆柱面（局部上与平面有相同的第一基本形式）
    const resolution = 20;
    const x_cyl = [], y_cyl = [], z_cyl = [];

    // 创建x, y的一维坐标数组
    for (let i = 0; i <= resolution; i++) {
        const u = i * 0.3;
        x_cyl.push(Math.cos(u));
        y_cyl.push(Math.sin(u));
    }
    for (let j = 0; j <= resolution; j++) {
        const v = (j - resolution/2) * 0.4;
        z_cyl.push(v);
    }

    // 创建z的二维数组
    const z_cyl_2d = [];
    for (let i = 0; i <= resolution; i++) {
        const z_row = [];
        for (let j = 0; j <= resolution; j++) {
            const v = (j - resolution/2) * 0.4;
            z_row.push(v);
        }
        z_cyl_2d.push(z_row);
    }

    const data = [
        {
            x: planeData.x,
            y: planeData.y,
            z: planeData.z,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'Greens',
            name: '平面 (K=0)',
            showscale: false
        },
        {
            x: x_cyl,
            y: y_cyl,
            z: z_cyl_2d,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'Blues',
            name: '圆柱面 (K=0)',
            showscale: false
        }
    ];

    const layout = {
        title: '高斯绝妙定理演示：平面和圆柱面都有K=0（虽然第二基本形式不同）',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]},
            aspectmode: 'cube',
            camera: {
                eye: {x: 1.5, y: 1.5, z: 1.5}
            }
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.react(container, data, layout, {responsive: true});
}

// 比较两个基本形式
function compareForms() {
    const container = document.getElementById('second-form-surface');
    if (!container) return;

    // 在同一个图中显示第一和第二基本形式
    const surfaceType = document.getElementById('surface-type-sf').value;

    alert(`第一基本形式描述曲面的内蕴度量性质\n\n第二基本形式描述曲面的外蕴弯曲性质\n\n对于${getSurfaceTypeName(surfaceType)}：\n- 它们通过高斯曲率联系起来：K = (eg-f²)/(EG-F²)`);
}

// ==================== 交互式计算器 ====================

// 计算交互式基本形式
function calculateInteractiveForms() {
    const surfaceType = document.getElementById('interactive-surface-type').value;
    const a = parseFloat(document.getElementById('interactive-param-a').value);
    const b = parseFloat(document.getElementById('interactive-param-b').value);
    const u0 = parseFloat(document.getElementById('point-u0').value);
    const v0 = parseFloat(document.getElementById('point-v0').value);

    let E, F, G, e, f, g;

    // 根据曲面类型计算系数
    switch(surfaceType) {
        case 'saddle':
            // z = a(x² - y²), x = u, y = v
            E = 1 + 4 * a * a * u0 * u0;
            F = -4 * a * a * u0 * v0;
            G = 1 + 4 * a * a * v0 * v0;
            e = 2 * a / Math.sqrt(E * G - F * F);
            f = 0;
            g = -2 * a / Math.sqrt(E * G - F * F);
            break;

        case 'paraboloid':
            // z = a(x² + y²), x = u, y = v
            E = 1 + 4 * a * a * u0 * u0;
            F = 4 * a * a * u0 * v0;
            G = 1 + 4 * a * a * v0 * v0;
            e = 2 * a / Math.sqrt(E * G - F * F);
            f = 0;
            g = 2 * a / Math.sqrt(E * G - F * F);
            break;

        case 'plane':
            E = 1;
            F = 0;
            G = 1;
            e = 0;
            f = 0;
            g = 0;
            break;

        case 'helicoid':
            // 螺旋面参数化更复杂
            E = 1;
            F = 0;
            G = 1 + u0 * u0;
            e = 0;
            f = a / Math.sqrt(G);
            g = 0;
            break;

        case 'catenoid':
            // 悬链面
            E = 1;
            F = 0;
            G = Math.cosh(u0) * Math.cosh(u0);
            e = -1;
            f = 0;
            g = 1;
            break;
    }

    const EG_minus_F2 = E * G - F * F;
    const eg_minus_f2 = e * g - f * f;
    const K = eg_minus_f2 / EG_minus_F2;
    const H = (e * G - 2 * f * F + g * E) / (2 * EG_minus_F2);

    // 更新显示
    document.getElementById('interactive-E').textContent = E.toFixed(4);
    document.getElementById('interactive-F').textContent = F.toFixed(4);
    document.getElementById('interactive-G').textContent = G.toFixed(4);
    document.getElementById('interactive-EG-F2').textContent = EG_minus_F2.toFixed(4);

    document.getElementById('interactive-e').textContent = e.toFixed(4);
    document.getElementById('interactive-f').textContent = f.toFixed(4);
    document.getElementById('interactive-g').textContent = g.toFixed(4);
    document.getElementById('interactive-eg-f2').textContent = eg_minus_f2.toFixed(4);

    document.getElementById('interactive-K').textContent = K.toFixed(4);
    document.getElementById('interactive-H').textContent = H.toFixed(4);

    // 更新可视化
    updateInteractiveVisualization(surfaceType, a, b, u0, v0, K);
}

// 更新交互式可视化
function updateInteractiveVisualization(surfaceType, a, b, u0, v0, K) {
    const container = document.getElementById('interactive-forms-viz');
    if (!container) return;

    const surfaceData = generateParametricSurface(surfaceType, a, b);

    // 生成高斯曲率场用于着色（二维数组）
    const curvatureField = [];
    const resolution = 30;

    for (let i = 0; i <= resolution; i++) {
        const curvature_row = [];
        for (let j = 0; j <= resolution; j++) {
            const u = (i - resolution/2) * 2 / resolution;
            const v = (j - resolution/2) * 2 / resolution;

            let k_val;
            switch(surfaceType) {
                case 'saddle':
                    k_val = -4 * a * a / Math.pow(1 + 4*a*a*(u*u + v*v), 2);
                    break;
                case 'paraboloid':
                    k_val = 4 * a * a / Math.pow(1 + 4*a*a*(u*u + v*v), 2);
                    break;
                default:
                    k_val = K;
            }
            curvature_row.push(k_val);
        }
        curvatureField.push(curvature_row);
    }

    const data = [
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            colorscale: 'RdYlBu',
            surfacecolor: curvatureField,
            colorbar: {
                title: '高斯曲率 K',
                tickformat: '.3f'
            },
            name: '高斯曲率'
        }
    ];

    const layout = {
        title: `${getSurfaceTypeName(surfaceType)} - 高斯曲率分布`,
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]}
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    safePlotlyRender(container.id, data, layout);
}

// 导出基本形式数据
function exportFormsData() {
    const surfaceType = document.getElementById('interactive-surface-type').value;
    const a = parseFloat(document.getElementById('interactive-param-a').value);
    const b = parseFloat(document.getElementById('interactive-param-b').value);
    const u0 = parseFloat(document.getElementById('point-u0').value);
    const v0 = parseFloat(document.getElementById('point-v0').value);

    const data = {
        surfaceType,
        parameters: {a, b},
        point: {u: u0, v: v0},
        firstForm: {
            E: parseFloat(document.getElementById('interactive-E').textContent),
            F: parseFloat(document.getElementById('interactive-F').textContent),
            G: parseFloat(document.getElementById('interactive-G').textContent),
            EG_minus_F2: parseFloat(document.getElementById('interactive-EG-F2').textContent)
        },
        secondForm: {
            e: parseFloat(document.getElementById('interactive-e').textContent),
            f: parseFloat(document.getElementById('interactive-f').textContent),
            g: parseFloat(document.getElementById('interactive-g').textContent),
            eg_minus_f2: parseFloat(document.getElementById('interactive-eg-f2').textContent)
        },
        curvatures: {
            K: parseFloat(document.getElementById('interactive-K').textContent),
            H: parseFloat(document.getElementById('interactive-H').textContent)
        }
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fundamental_forms_${surfaceType}_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

// ==================== 工具函数 ====================

// 获取曲面类型名称
function getSurfaceTypeName(type) {
    const names = {
        'saddle': '双曲抛物面',
        'paraboloid': '椭圆抛物面',
        'plane': '平面',
        'cylinder': '圆柱面',
        'helicoid': '螺旋面',
        'catenoid': '悬链面'
    };
    return names[type] || '未知曲面';
}

// 生成平面
function generatePlane(a, b) {
    const x = [], y = [], z = [];
    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            const u = (i - 10) * 0.2;
            const v = (j - 10) * 0.2;
            x.push(u);
            y.push(v);
            z.push(0);
        }
    }
    return {x, y, z};
}

// ==================== 初始化 ====================

// 初始化页面
function initializePage() {
    console.log('[DEBUG] initializePage called');
    console.log('[DEBUG] typeof Plotly:', typeof Plotly);

    // 等待Plotly加载
    if (typeof Plotly === 'undefined') {
        console.log('[DEBUG] Plotly not ready, waiting...');
        setTimeout(initializePage, 100);
        return;
    }

    console.log('[DEBUG] Plotly loaded, initializing visualizations');

    // 设置滑块事件监听器
    console.log('[DEBUG] Setting up slider listeners');
    setupSliderListeners();

    // 初始化可视化
    setTimeout(() => {
        console.log('[DEBUG] Initializing visualizations...');

        // 更新滑块显示值
        const paramU_FF = document.getElementById('param-u-ff');
        const paramV_FF = document.getElementById('param-v-ff');
        if (paramU_FF && paramV_FF) {
            document.getElementById('param-u-ff-value').textContent = parseFloat(paramU_FF.value).toFixed(1);
            document.getElementById('param-v-ff-value').textContent = parseFloat(paramV_FF.value).toFixed(1);
            console.log('[DEBUG] Slider values updated');
        } else {
            console.error('[DEBUG] Sliders not found!');
        }

        // 初始化第一基本形式
        console.log('[DEBUG] Calling updateFirstFormSurface...');
        if (typeof updateFirstFormSurface === 'function') {
            updateFirstFormSurface();
            console.log('[DEBUG] updateFirstFormSurface completed');
        } else {
            console.error('[DEBUG] updateFirstFormSurface is not a function');
        }

        // 初始化第二基本形式
        console.log('[DEBUG] Calling updateSecondFormSurface...');
        if (typeof updateSecondFormSurface === 'function') {
            updateSecondFormSurface();
            console.log('[DEBUG] updateSecondFormSurface completed');
        } else {
            console.error('[DEBUG] updateSecondFormSurface is not a function');
        }

        // 计算第一基本形式系数（必须在曲面初始化后）
        console.log('[DEBUG] Calling calculateFirstFormCoefficients...');
        if (typeof calculateFirstFormCoefficients === 'function') {
            calculateFirstFormCoefficients();
            console.log('[DEBUG] calculateFirstFormCoefficients completed');
        } else {
            console.error('[DEBUG] calculateFirstFormCoefficients is not a function');
        }

        // 计算第二基本形式系数
        if (typeof calculateSecondFormCoefficients === 'function') {
            calculateSecondFormCoefficients();
        }

        // 计算交互式表单
        if (typeof calculateInteractiveForms === 'function') {
            calculateInteractiveForms();
        }

        console.log('[DEBUG] All visualizations initialized');
    }, 500);
}

// 防抖函数：避免频繁调用
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 设置滑块监听器
function setupSliderListeners() {
    // 创建防抖版本的更新函数（100ms延迟以避免Plotly错误）
    const debouncedUpdateSurface = debounce(() => {
        updateFirstFormSurface();
    }, 100);

    const debouncedCalculateCoeffs = debounce(() => {
        calculateFirstFormCoefficients();
    }, 100);

    // 第一基本形式滑块
    const paramU_FF = document.getElementById('param-u-ff');
    const paramV_FF = document.getElementById('param-v-ff');

    if (paramU_FF) {
        paramU_FF.addEventListener('input', function() {
            document.getElementById('param-u-ff-value').textContent = parseFloat(this.value).toFixed(1);
            // 更新曲面显示（显示当前点位置）
            debouncedUpdateSurface();
            // 自动重新计算第一基本形式系数
            debouncedCalculateCoeffs();
        });
    }

    if (paramV_FF) {
        paramV_FF.addEventListener('input', function() {
            document.getElementById('param-v-ff-value').textContent = parseFloat(this.value).toFixed(1);
            // 更新曲面显示（显示当前点位置）
            debouncedUpdateSurface();
            // 自动重新计算第一基本形式系数
            debouncedCalculateCoeffs();
        });
    }

    // 交互式计算器滑块（也使用防抖）
    const debouncedCalculateInteractive = debounce(() => {
        calculateInteractiveForms();
    }, 50);

    const interactiveParamA = document.getElementById('interactive-param-a');
    const interactiveParamB = document.getElementById('interactive-param-b');
    const pointU0 = document.getElementById('point-u0');
    const pointV0 = document.getElementById('point-v0');

    if (interactiveParamA) {
        interactiveParamA.addEventListener('input', function() {
            document.getElementById('interactive-param-a-value').textContent = this.value;
            debouncedCalculateInteractive();
        });
    }

    if (interactiveParamB) {
        interactiveParamB.addEventListener('input', function() {
            document.getElementById('interactive-param-b-value').textContent = this.value;
            debouncedCalculateInteractive();
        });
    }

    if (pointU0) {
        pointU0.addEventListener('input', function() {
            document.getElementById('point-u0-value').textContent = this.value;
            debouncedCalculateInteractive();
        });
    }

    if (pointV0) {
        pointV0.addEventListener('input', function() {
            document.getElementById('point-v0-value').textContent = this.value;
            debouncedCalculateInteractive();
        });
    }

    // 曲面类型选择器
    const surfaceTypeSF = document.getElementById('surface-type-sf');
    if (surfaceTypeSF) {
        surfaceTypeSF.addEventListener('change', function() {
            updateSecondFormSurface();
            calculateSecondFormCoefficients();
        });
    }

    const interactiveSurfaceType = document.getElementById('interactive-surface-type');
    if (interactiveSurfaceType) {
        interactiveSurfaceType.addEventListener('change', function() {
            calculateInteractiveForms();
        });
    }
}

// 清理函数
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePage);

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);
