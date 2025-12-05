// 第2章：高斯曲率 - 可视化实现

// 全局变量
let currentRadius = 1.0;
let animationId = null;

// 比较不同几何中的圆的周长和面积
function drawCircleComparison() {
    const container = document.getElementById('circle-comparison');
    if (!container) return;

    const radius = parseFloat(document.getElementById('circle-radius').value);

    // 欧几里得圆
    const euclideanData = generateEuclideanCircle(radius);

    // 球面上的圆 (正曲率)
    const sphericalData = generateSphericalCircle(radius, 1);

    // 双曲面上的圆 (负曲率)
    const hyperbolicData = generateHyperbolicCircle(radius, -1);

    const data = [
        // 周长比较
        {
            x: ['欧几里得', '球面(K=1)', '双曲(K=-1)'],
            y: [
                2 * Math.PI * radius,
                2 * Math.PI * radius * (1 - radius * radius / 6),
                2 * Math.PI * radius * (1 + radius * radius / 6)
            ],
            type: 'bar',
            name: '周长',
            marker: {color: 'rgb(55, 83, 109)'}
        },
        // 面积比较
        {
            x: ['欧几里得', '球面(K=1)', '双曲(K=-1)'],
            y: [
                Math.PI * radius * radius,
                Math.PI * radius * radius * (1 - radius * radius / 12),
                Math.PI * radius * radius * (1 + radius * radius / 12)
            ],
            type: 'bar',
            name: '面积',
            marker: {color: 'rgb(26, 118, 192)'},
            yaxis: 'y2'
        }
    ];

    const layout = {
        title: `半径 r = ${radius.toFixed(2)} 时不同几何中圆的性质比较`,
        xaxis: {title: '几何类型'},
        yaxis: {
            title: '周长',
            side: 'left',
            range: [0, 10]
        },
        yaxis2: {
            title: '面积',
            side: 'right',
            overlaying: 'y',
            range: [0, 15]
        },
        height: 350,
        margin: {l: 60, r: 60, t: 50, b: 50},
        barmode: 'group'
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 生成欧几里得圆
function generateEuclideanCircle(radius) {
    const theta = [];
    const x = [];
    const y = [];

    for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        theta.push(t);
        x.push(radius * Math.cos(t));
        y.push(radius * Math.sin(t));
    }

    return {x, y};
}

// 生成球面上的圆
function generateSphericalCircle(radius, curvature) {
    // 球面上的圆实际是球面与平面的交线
    const data = generateEuclideanCircle(radius);

    // 球面修正：由于正曲率，实际周长和面积会减少
    const circumference = 2 * Math.PI * radius * (1 - curvature * radius * radius / 6);
    const area = Math.PI * radius * radius * (1 - curvature * radius * radius / 12);

    return {data, circumference, area};
}

// 生成双曲圆
function generateHyperbolicCircle(radius, curvature) {
    // 双曲圆的参数化
    const data = generateEuclideanCircle(radius);

    // 双曲修正：由于负曲率，实际周长和面积会增加
    const circumference = 2 * Math.PI * radius * (1 - curvature * radius * radius / 6);
    const area = Math.PI * radius * radius * (1 - curvature * radius * radius / 12);

    return {data, circumference, area};
}

// 绘制球面曲率
function drawSphereCurvature() {
    const container = document.getElementById('sphere-curvature');
    if (!container) return;

    const radius = parseFloat(document.getElementById('sphere-radius-slider').value);
    const curvature = 1 / (radius * radius);

    // 生成球面
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];
    const curvatureColors = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push(i * Math.PI / 20);
            v.push(j * 2 * Math.PI / 20);
            const x_val = radius * Math.sin(u[i]) * Math.cos(v[j]);
            const y_val = radius * Math.sin(u[i]) * Math.sin(v[j]);
            const z_val = radius * Math.cos(u[i]);

            x.push(x_val);
            y.push(y_val);
            z.push(z_val);

            // 球面上各点的高斯曲率都相同
            curvatureColors.push(curvature);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Reds',
        surfacecolor: curvatureColors,
        colorbar: {
            title: '高斯曲率',
            tickformat: '.3f'
        },
        name: '球面'
    }];

    const layout = {
        title: `球面 (K = ${curvature.toFixed(3)})`,
        scene: {
            xaxis: {range: [-radius*1.5, radius*1.5]},
            yaxis: {range: [-radius*1.5, radius*1.5]},
            zaxis: {range: [-radius*1.5, radius*1.5]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 绘制双曲面曲率
function drawHyperboloidCurvature() {
    const container = document.getElementById('hyperboloid-curvature');
    if (!container) return;

    const a = parseFloat(document.getElementById('hyperboloid-a').value);
    const b = parseFloat(document.getElementById('hyperboloid-b').value);

    // 生成单叶双曲面
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];
    const curvatureColors = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push(i * 2 * Math.PI / 20);
            v.push((j - 10) * 0.3);
            const x_val = a * Math.cosh(v[j]) * Math.cos(u[i]);
            const y_val = b * Math.cosh(v[j]) * Math.sin(u[i]);
            const z_val = Math.sinh(v[j]);

            x.push(x_val);
            y.push(y_val);
            z.push(z_val);

            // 计算该点的高斯曲率（简化计算）
            const localCurvature = -1 / (a * a * b * b * Math.cosh(v[j]) ** 4);
            curvatureColors.push(localCurvature);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Blues',
        surfacecolor: curvatureColors,
        colorbar: {
            title: '高斯曲率',
            tickformat: '.3f'
        },
        name: '双曲面'
    }];

    const layout = {
        title: '双曲面 (负高斯曲率)',
        scene: {
            xaxis: {range: [-3, 3]},
            yaxis: {range: [-3, 3]},
            zaxis: {range: [-2, 2]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 绘制圆柱面曲率
function drawCylinderCurvature() {
    const container = document.getElementById('cylinder-curvature');
    if (!container) return;

    const radius = parseFloat(document.getElementById('cylinder-radius-slider').value);

    // 生成圆柱面
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];
    const curvatureColors = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push(i * 2 * Math.PI / 20);
            v.push((j - 10) * 0.2);
            const x_val = radius * Math.cos(u[i]);
            const y_val = radius * Math.sin(u[i]);
            const z_val = v[j];

            x.push(x_val);
            y.push(y_val);
            z.push(z_val);

            // 圆柱面上各点的高斯曲率都为零
            curvatureColors.push(0);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Viridis',
        surfacecolor: curvatureColors,
        colorbar: {
            title: '高斯曲率',
            tickformat: '.1f'
        },
        name: '圆柱面'
    }];

    const layout = {
        title: '圆柱面 (K = 0)',
        scene: {
            xaxis: {range: [-radius*1.5, radius*1.5]},
            yaxis: {range: [-radius*1.5, radius*1.5]},
            zaxis: {range: [-2, 2]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 绘制鞍面曲率
function drawSaddleCurvature() {
    const container = document.getElementById('saddle-curvature');
    if (!container) return;

    const param = parseFloat(document.getElementById('saddle-params').value);

    // 生成鞍面
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];
    const curvatureColors = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push((i - 10) * 0.3);
            v.push((j - 10) * 0.3);
            const x_val = u[i];
            const y_val = v[j];
            const z_val = param * (u[i] * u[i] - v[j] * v[j]) / 2;

            x.push(x_val);
            y.push(y_val);
            z.push(z_val);

            // 计算鞍面的高斯曲率
            const denom = Math.pow(1 + param*param*(u[i]*u[i] + v[j]*v[j]), 2);
            const localCurvature = -param * param / denom;
            curvatureColors.push(localCurvature);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Blues',
        surfacecolor: curvatureColors,
        colorbar: {
            title: '高斯曲率',
            tickformat: '.3f'
        },
        name: '鞍面'
    }];

    const layout = {
        title: '鞍面 (负高斯曲率)',
        scene: {
            xaxis: {range: [-3, 3]},
            yaxis: {range: [-3, 3]},
            zaxis: {range: [-2, 2]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 演示高斯-博内定理
function demonstrateGaussBonnet() {
    const container = document.getElementById('gauss-bonnet-demo');
    if (!container) return;

    // 在单位球面上创建一个测地三角形
    const radius = 1;

    // 定义测地三角形的三个顶点
    const vertices = [
        {lat: 0, lon: 0},
        {lat: Math.PI/3, lon: Math.PI/4},
        {lat: Math.PI/4, lon: Math.PI/2}
    ];

    // 转换为笛卡尔坐标
    const cartesianVertices = vertices.map(v => ({
        x: radius * Math.cos(v.lat) * Math.cos(v.lon),
        y: radius * Math.cos(v.lat) * Math.sin(v.lon),
        z: radius * Math.sin(v.lat)
    }));

    // 生成球面
    const sphereData = generateSphereSurface(radius);

    // 生成测地三角形边界
    const triangleEdges = [];
    for (let i = 0; i < 3; i++) {
        const next = (i + 1) % 3;
        const edge = generateGeodesicArc(cartesianVertices[i], cartesianVertices[next], radius);
        triangleEdges.push({
            x: edge.x,
            y: edge.y,
            z: edge.z,
            type: 'scatter3d',
            mode: 'lines',
            name: `测地线${i+1}`,
            line: {color: 'red', width: 4}
        });
    }

    // 顶点标记
    const vertexMarkers = {
        x: cartesianVertices.map(v => v.x),
        y: cartesianVertices.map(v => v.y),
        z: cartesianVertices.map(v => v.z),
        type: 'scatter3d',
        mode: 'markers',
        name: '顶点',
        marker: {color: 'yellow', size: 8, line: {color: 'red', width: 2}}
    };

    // 计算三角形区域的颜色（表示曲率积分）
    const regionData = generateSphericalTriangleRegion(vertices, radius);

    const data = sphereData.concat(triangleEdges).concat([vertexMarkers, regionData]);

    const layout = {
        title: '高斯-博内定理演示 (球面测地三角形)',
        scene: {
            xaxis: {range: [-1.5, 1.5]},
            yaxis: {range: [-1.5, 1.5]},
            zaxis: {range: [-1.5, 1.5]}
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 生成球面数据
function generateSphereSurface(radius) {
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 30; i++) {
        for (let j = 0; j <= 30; j++) {
            u.push(i * Math.PI / 30);
            v.push(j * 2 * Math.PI / 30);
            x.push(radius * Math.sin(u[i]) * Math.cos(v[j]));
            y.push(radius * Math.sin(u[i]) * Math.sin(v[j]));
            z.push(radius * Math.cos(u[i]));
        }
    }

    return [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        opacity: 0.7,
        colorscale: 'Blues',
        name: '球面'
    }];
}

// 生成测地圆弧
function generateGeodesicArc(point1, point2, radius, steps = 50) {
    const points = {x: [], y: [], z: []};

    // 计算两个向量的叉积
    const cross = {
        x: point1.y * point2.z - point1.z * point2.y,
        y: point1.z * point2.x - point1.x * point2.z,
        z: point1.x * point2.y - point1.y * point2.x
    };

    const crossMagnitude = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);

    if (crossMagnitude < 1e-10) {
        // 两点几乎重合或相对
        return points;
    }

    // 归一化叉积向量
    cross.x /= crossMagnitude;
    cross.y /= crossMagnitude;
    cross.z /= crossMagnitude;

    // 计算角度
    const dot = point1.x * point2.x + point1.y * point2.y + point1.z * point2.z;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (radius * radius))));

    // 生成圆弧上的点
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const currentAngle = angle * t;

        const cosAngle = Math.cos(currentAngle);
        const sinAngle = Math.sin(currentAngle);

        const x = point1.x * cosAngle + (cross.x * radius) * sinAngle;
        const y = point1.y * cosAngle + (cross.y * radius) * sinAngle;
        const z = point1.z * cosAngle + (cross.z * radius) * sinAngle;

        points.x.push(x);
        points.y.push(y);
        points.z.push(z);
    }

    return points;
}

// 生成球面三角形区域
function generateSphericalTriangleRegion(vertices, radius) {
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];

    // 简化的三角形区域生成
    for (let i = 0; i <= 10; i++) {
        for (let j = 0; j <= 10 - i; j++) {
            // 使用重心坐标生成三角形内部点
            const w1 = i / 10;
            const w2 = j / 10;
            const w3 = 1 - w1 - w2;

            if (w3 >= 0) {
                // 将球面坐标转换为笛卡尔坐标的加权平均
                const lat = w1 * vertices[0].lat + w2 * vertices[1].lat + w3 * vertices[2].lat;
                const lon = w1 * vertices[0].lon + w2 * vertices[1].lon + w3 * vertices[2].lon;

                u.push(lat);
                v.push(lon);
                x.push(radius * Math.cos(lat) * Math.cos(lon));
                y.push(radius * Math.cos(lat) * Math.sin(lon));
                z.push(radius * Math.sin(lat));
            }
        }
    }

    return {
        x: x,
        y: y,
        z: z,
        type: 'mesh3d',
        opacity: 0.3,
        color: 'rgba(255, 0, 0, 0.3)',
        name: '三角形区域'
    };
}

// 显示高斯映射
function showGaussMap() {
    const container = document.getElementById('gauss-map-demo');
    if (!container) return;

    // 原曲面（鞍面）
    const originalSurface = generateSaddleSurface(1);

    // 高斯映射（法向量映射到单位球面）
    const gaussMap = generateGaussMapping();

    const data = [
        // 原曲面
        {
            x: originalSurface.x,
            y: originalSurface.y,
            z: originalSurface.z,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'Viridis',
            name: '原曲面',
            surface: {
                count: 2
            }
        },
        // 高斯映射
        {
            x: gaussMap.x,
            y: gaussMap.y,
            z: gaussMap.z,
            type: 'surface',
            opacity: 0.7,
            colorscale: 'Reds',
            name: '高斯映射',
            surface: {
                count: 3
            }
        }
    ];

    const layout = {
        title: '高斯映射演示',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]}
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 生成鞍面
function generateSaddleSurface(param) {
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            const u = (i - 10) * 0.3;
            const v = (j - 10) * 0.3;

            x.push(u);
            y.push(v);
            z.push(param * (u * u - v * v) / 2);
        }
    }

    return {x, y, z};
}

// 生成高斯映射
function generateGaussMapping() {
    const x = [];
    const y = [];
    const z = [];

    // 生成单位球面上的点（高斯映射的结果）
    for (let i = 0; i <= 15; i++) {
        for (let j = 0; j <= 15; j++) {
            const theta = i * Math.PI / 15;
            const phi = j * 2 * Math.PI / 15;

            x.push(Math.sin(theta) * Math.cos(phi));
            y.push(Math.sin(theta) * Math.sin(phi));
            z.push(Math.cos(theta));
        }
    }

    return {x, y, z};
}

// 显示主方向
function showPrincipalDirections() {
    const container = document.getElementById('principal-curvatures-demo');
    if (!container) return;

    // 创建一个曲面并显示其主方向
    const surface = generateTestSurface();
    const principalDirections = generatePrincipalDirections();

    const data = [
        // 曲面
        {
            x: surface.x,
            y: surface.y,
            z: surface.z,
            type: 'surface',
            opacity: 0.8,
            colorscale: 'Viridis',
            name: '曲面'
        },
        // 主方向1
        {
            x: principalDirections.dir1.x,
            y: principalDirections.dir1.y,
            z: principalDirections.dir1.z,
            type: 'scatter3d',
            mode: 'lines',
            name: '主方向1',
            line: {color: 'red', width: 3}
        },
        // 主方向2
        {
            x: principalDirections.dir2.x,
            y: principalDirections.dir2.y,
            z: principalDirections.dir2.z,
            type: 'scatter3d',
            mode: 'lines',
            name: '主方向2',
            line: {color: 'blue', width: 3}
        }
    ];

    const layout = {
        title: '主方向可视化',
        scene: {
            xaxis: {range: [-3, 3]},
            yaxis: {range: [-3, 3]},
            zaxis: {range: [-2, 2]}
        },
        height: 350,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 生成测试曲面
function generateTestSurface() {
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            const u = (i - 10) * 0.3;
            const v = (j - 10) * 0.3;

            x.push(u);
            y.push(v);
            z.push(0.3 * Math.sin(u) + 0.2 * Math.cos(v));
        }
    }

    return {x, y, z};
}

// 生成主方向
function generatePrincipalDirections() {
    // 在曲面中心点显示主方向
    const centerX = 0;
    const centerY = 0;
    const centerZ = 0.5;

    // 主方向1（最大曲率方向）
    const dir1 = {
        x: [centerX - 1, centerX, centerX + 1],
        y: [centerY, centerY, centerY],
        z: [centerZ, centerZ, centerZ]
    };

    // 主方向2（最小曲率方向）
    const dir2 = {
        x: [centerX, centerX, centerX],
        y: [centerY - 1, centerY, centerY + 1],
        z: [centerZ, centerZ, centerZ]
    };

    return {dir1, dir2};
}

// 动画函数
function animateCircleGrowth() {
    let radius = 0.1;
    const maxRadius = 2.0;

    function animate() {
        radius += 0.05;
        if (radius > maxRadius) {
            radius = 0.1;
        }

        document.getElementById('circle-radius').value = radius;
        document.getElementById('circle-radius-value').textContent = radius.toFixed(1);
        drawCircleComparison();

        animationId = requestAnimationFrame(animate);
    }

    animate();
}

// 更新曲面可视化
function updateSurfaceVisualization() {
    const container = document.getElementById('interactive-curvature-viz');
    if (!container) {
        console.log('Container not found');
        return;
    }

    const surfaceTypeSelect = document.getElementById('surface-type');
    const paramASlider = document.getElementById('param-a');
    const paramBSlider = document.getElementById('param-b');

    if (!surfaceTypeSelect || !paramASlider || !paramBSlider) {
        console.log('Controls not found');
        return;
    }

    const surfaceType = surfaceTypeSelect.value;
    const paramA = parseFloat(paramASlider.value);
    const paramB = parseFloat(paramBSlider.value);

    console.log('Generating surface:', surfaceType, paramA, paramB);

    try {
        const surfaceData = generateParameterizedSurface(surfaceType, paramA, paramB);
        const curvatureData = calculateSurfaceCurvature(surfaceData, surfaceType, paramA, paramB);

        const data = [
            // 曲面
            {
                x: surfaceData.x,
                y: surfaceData.y,
                z: surfaceData.z,
                type: 'surface',
                colorscale: 'RdYlBu',
                surfacecolor: curvatureData.gaussian,
                colorbar: {
                    title: '高斯曲率',
                    tickformat: '.3f'
                },
                name: '高斯曲率'
            }
        ];

        const layout = {
            title: `${getSurfaceName(surfaceType)} (高斯曲率分布)`,
            scene: {
                xaxis: {range: [-3, 3]},
                yaxis: {range: [-3, 3]},
                zaxis: {range: [-3, 3]},
                camera: {
                    eye: {x: 1.5, y: 1.5, z: 1.5}
                }
            },
            height: 400,
            margin: {l: 0, r: 0, t: 50, b: 0}
        };

        if (typeof Plotly !== 'undefined') {
            Plotly.newPlot(container, data, layout, {responsive: true});

            // 更新统计信息
            updateCurvatureStatistics(curvatureData);
        } else {
            console.error('Plotly not loaded');
        }
    } catch (error) {
        console.error('Error in updateSurfaceVisualization:', error);
    }
}

// 生成参数化曲面
function generateParameterizedSurface(type, a, b) {
    const resolution = 30;
    const range = 2;
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const u = (i - resolution/2) * range / resolution;
            const v = (j - resolution/2) * range / resolution;

            x.push(u);
            y.push(v);

            let z_val;
            switch(type) {
                case 'paraboloid':
                    z_val = a * (u*u + v*v);
                    break;
                case 'hyperbolic':
                    z_val = a * u*u - b * v*v;
                    break;
                case 'saddle':
                    z_val = a * u * v;
                    break;
                case 'monkey':
                    z_val = a * (u*u*u - 3*u*v*v);
                    break;
                case 'custom':
                    z_val = a * Math.sin(u) * Math.cos(v);
                    break;
                default:
                    z_val = 0;
            }
            z.push(z_val);
        }
    }

    console.log('Surface generated:', type, 'points:', x.length);
    return {x, y, z};
}

// 计算曲面曲率
function calculateSurfaceCurvature(surfaceData, type, a, b) {
    const gaussian = [];
    const mean = [];
    const k1 = [];
    const k2 = [];

    const resolution = 30;
    const range = 2;

    console.log('Calculating curvature for:', type, a, b);

    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const u = (i - resolution/2) * range / resolution;
            const v = (j - resolution/2) * range / resolution;

            // 计算一阶和二阶偏导数
            let fx, fy, fxx, fyy, fxy;

            switch(type) {
                case 'paraboloid':
                    fx = 2 * a * u;
                    fy = 2 * a * v;
                    fxx = 2 * a;
                    fyy = 2 * a;
                    fxy = 0;
                    break;
                case 'hyperbolic':
                    fx = 2 * a * u;
                    fy = -2 * b * v;
                    fxx = 2 * a;
                    fyy = -2 * b;
                    fxy = 0;
                    break;
                case 'saddle':
                    fx = a * v;
                    fy = a * u;
                    fxx = 0;
                    fyy = 0;
                    fxy = a;
                    break;
                case 'monkey':
                    fx = a * (3*u*u - 3*v*v);
                    fy = a * (-6*u*v);
                    fxx = a * 6*u;
                    fyy = a * (-6*u);
                    fxy = a * (-6*v);
                    break;
                case 'custom':
                    fx = a * Math.cos(u) * Math.cos(v);
                    fy = a * (-Math.sin(u) * Math.sin(v));
                    fxx = a * (-Math.sin(u) * Math.cos(v));
                    fyy = a * (-Math.sin(u) * Math.cos(v));
                    fxy = a * (-Math.cos(u) * Math.sin(v));
                    break;
                default:
                    fx = fy = fxx = fyy = fxy = 0;
            }

            // 计算高斯曲率和平均曲率
            const denominator = Math.pow(1 + fx*fx + fy*fy, 2);
            const K = denominator !== 0 ? (fxx * fyy - fxy*fxy) / denominator : 0;
            const H = Math.pow(1 + fx*fx + fy*fy, 1.5) !== 0 ?
                ((1 + fy*fy) * fxx + (1 + fx*fx) * fyy - 2*fx*fy*fxy) / (2 * Math.pow(1 + fx*fx + fy*fy, 1.5)) : 0;

            gaussian.push(K);
            mean.push(H);

            // 计算主曲率
            const discriminant = H*H - K;
            if (discriminant >= 0) {
                const sqrtDisc = Math.sqrt(discriminant);
                k1.push(H + sqrtDisc);
                k2.push(H - sqrtDisc);
            } else {
                k1.push(NaN);
                k2.push(NaN);
            }
        }
    }

    const result = {gaussian, mean, k1, k2};
    console.log('Curvature calculated:', result);
    return result;
}

// 更新曲率统计信息
function updateCurvatureStatistics(curvatureData) {
    const {gaussian, mean, k1, k2} = curvatureData;

    // 过滤掉无效值
    const validGaussian = gaussian.filter(k => !isNaN(k) && isFinite(k));
    const validMean = mean.filter(k => !isNaN(k) && isFinite(k));
    const validK1 = k1.filter(k => !isNaN(k) && isFinite(k));
    const validK2 = k2.filter(k => !isNaN(k) && isFinite(k));

    document.getElementById('max-gaussian').textContent =
        validGaussian.length > 0 ? Math.max(...validGaussian).toFixed(4) : 'N/A';
    document.getElementById('min-gaussian').textContent =
        validGaussian.length > 0 ? Math.min(...validGaussian).toFixed(4) : 'N/A';
    document.getElementById('avg-gaussian').textContent =
        validGaussian.length > 0 ? (validGaussian.reduce((a, b) => a + b, 0) / validGaussian.length).toFixed(4) : 'N/A';
    document.getElementById('max-principal').textContent =
        validK1.length > 0 ? Math.max(...validK1).toFixed(4) : 'N/A';
    document.getElementById('min-principal').textContent =
        validK2.length > 0 ? Math.min(...validK2).toFixed(4) : 'N/A';
    document.getElementById('mean-curvature').textContent =
        validMean.length > 0 ? (validMean.reduce((a, b) => a + b, 0) / validMean.length).toFixed(4) : 'N/A';
}

// 获取曲面名称
function getSurfaceName(type) {
    const names = {
        'paraboloid': '椭圆抛物面',
        'hyperbolic': '双曲抛物面',
        'saddle': '经典鞍面',
        'monkey': '猴鞍面',
        'custom': '自定义曲面'
    };
    return names[type] || '未知曲面';
}

// 计算曲率场
function calculateCurvatureField() {
    const container = document.getElementById('interactive-curvature-viz');
    if (!container) return;

    const surfaceType = document.getElementById('surface-type').value;
    const paramA = parseFloat(document.getElementById('param-a').value);
    const paramB = parseFloat(document.getElementById('param-b').value);

    const surfaceData = generateParameterizedSurface(surfaceType, paramA, paramB);
    const curvatureData = calculateSurfaceCurvature(surfaceData, surfaceType, paramA, paramB);

    // 创建曲率向量场可视化
    const x = [];
    const y = [];
    const z = [];
    const u = []; // x方向向量
    const v = []; // y方向向量
    const w = []; // z方向向量

    const resolution = 15;
    const range = 2;

    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const u_val = (i - resolution/2) * range / resolution;
            const v_val = (j - resolution/2) * range / resolution;

            x.push(u_val);
            y.push(v_val);

            // 计算曲面高度
            let z_val;
            switch(surfaceType) {
                case 'paraboloid':
                    z_val = paramA * (u_val*u_val + v_val*v_val);
                    break;
                case 'hyperbolic':
                    z_val = paramA * u_val*u_val - paramB * v_val*v_val;
                    break;
                case 'saddle':
                    z_val = paramA * u_val * v_val;
                    break;
                case 'monkey':
                    z_val = paramA * (u_val*u_val*u_val - 3*u_val*v_val*v_val);
                    break;
                case 'custom':
                    z_val = paramA * Math.sin(u_val) * Math.cos(v_val);
                    break;
                default:
                    z_val = 0;
            }
            z.push(z_val);

            // 曲率梯度向量（简化计算）
            const gradMag = 0.3;
            u.push(gradMag * (u_val / range));
            v.push(gradMag * (v_val / range));
            w.push(gradMag * z_val / 2);
        }
    }

    const data = [
        // 曲面
        {
            x: surfaceData.x,
            y: surfaceData.y,
            z: surfaceData.z,
            type: 'surface',
            opacity: 0.8,
            colorscale: 'RdYlBu',
            surfacecolor: curvatureData.gaussian,
            showscale: false,
            name: '曲面'
        },
        // 曲率向量场
        {
            x: x,
            y: y,
            z: z,
            u: u,
            v: v,
            w: w,
            type: 'cone',
            sizemode: 'absolute',
            sizeref: 0.1,
            showscale: false,
            name: '曲率梯度'
        }
    ];

    const layout = {
        title: `${getSurfaceName(surfaceType)} - 曲率场可视化`,
        scene: {
            xaxis: {range: [-3, 3]},
            yaxis: {range: [-3, 3]},
            zaxis: {range: [-3, 3]},
            camera: {
                eye: {x: 2, y: 2, z: 2}
            }
        },
        height: 400,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 导出曲率数据
function exportCurvatureData() {
    const surfaceType = document.getElementById('surface-type').value;
    const paramA = parseFloat(document.getElementById('param-a').value);
    const paramB = parseFloat(document.getElementById('param-b').value);

    const surfaceData = generateParameterizedSurface(surfaceType, paramA, paramB);
    const curvatureData = calculateSurfaceCurvature(surfaceData, surfaceType, paramA, paramB);

    const exportData = {
        surfaceType,
        parameters: {a: paramA, b: paramB},
        statistics: {
            maxGaussian: parseFloat(document.getElementById('max-gaussian').textContent),
            minGaussian: parseFloat(document.getElementById('min-gaussian').textContent),
            avgGaussian: parseFloat(document.getElementById('avg-gaussian').textContent),
            maxPrincipal: parseFloat(document.getElementById('max-principal').textContent),
            minPrincipal: parseFloat(document.getElementById('min-principal').textContent),
            meanCurvature: parseFloat(document.getElementById('mean-curvature').textContent)
        },
        data: {
            x: surfaceData.x.slice(0, 100), // 限制数据量
            y: surfaceData.y.slice(0, 100),
            z: surfaceData.z.slice(0, 100),
            gaussian: curvatureData.gaussian.slice(0, 100),
            mean: curvatureData.mean.slice(0, 100)
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `curvature_data_${surfaceType}_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

// 曲率流动画
function animateCurvatureFlow() {
    const container = document.getElementById('principal-curvatures-demo');
    if (!container) return;

    let time = 0;
    const maxTime = 100;

    function animate() {
        time += 0.5;
        if (time > maxTime) {
            time = 0;
        }

        const param = 1 + 0.5 * Math.sin(time * 0.1);

        // 生成随时间变化的曲面
        const surface = generateTimeVaryingSurface(time);
        const curvature = calculateSurfaceCurvature(surface, 'hyperbolic', param, param);

        const data = [
            {
                x: surface.x,
                y: surface.y,
                z: surface.z,
                type: 'surface',
                colorscale: 'Plasma',
                surfacecolor: curvature.gaussian,
                colorbar: {
                    title: '高斯曲率',
                    tickformat: '.3f'
                },
                name: '曲率流'
            }
        ];

        const layout = {
            title: `曲率流动画 (t = ${time.toFixed(1)})`,
            scene: {
                xaxis: {range: [-2, 2]},
                yaxis: {range: [-2, 2]},
                zaxis: {range: [-2, 2]}
            },
            height: 350,
            margin: {l: 0, r: 0, t: 50, b: 0}
        };

        Plotly.newPlot(container, data, layout, {responsive: true});

        if (time < maxTime) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// 生成随时间变化的曲面
function generateTimeVaryingSurface(time) {
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            const u = (i - 10) * 0.2;
            const v = (j - 10) * 0.2;

            x.push(u);
            y.push(v);
            z.push(Math.sin(time * 0.05) * (u*u - v*v) + Math.cos(time * 0.03) * u * v);
        }
    }

    return {x, y, z};
}

// 简化的初始化函数
function initializePage() {
    console.log('Initializing page...');

    // 等待Plotly加载
    if (typeof Plotly === 'undefined') {
        console.log('Plotly not loaded yet, waiting...');
        setTimeout(initializePage, 100);
        return;
    }

    console.log('Plotly loaded, initializing visualizations');

    // 初始化所有现有函数
    try {
        // 圆半径滑块
        const circleRadiusSlider = document.getElementById('circle-radius');
        if (circleRadiusSlider) {
            circleRadiusSlider.addEventListener('input', function() {
                document.getElementById('circle-radius-value').textContent = this.value;
                drawCircleComparison();
            });
        }

        // 球面半径滑块
        const sphereRadiusSlider = document.getElementById('sphere-radius-slider');
        if (sphereRadiusSlider) {
            sphereRadiusSlider.addEventListener('input', function() {
                const radius = parseFloat(this.value);
                const curvature = 1 / (radius * radius);
                document.getElementById('sphere-radius-value').textContent = `K = ${curvature.toFixed(3)}`;
                drawSphereCurvature();
            });
        }

        // 初始化基本可视化
        setTimeout(() => {
            console.log('Drawing initial visualizations...');
            if (typeof drawCircleComparison === 'function') {
                drawCircleComparison();
            }
            if (typeof drawSphereCurvature === 'function') {
                drawSphereCurvature();
            }
            if (typeof drawHyperboloidCurvature === 'function') {
                drawHyperboloidCurvature();
            }
            if (typeof drawCylinderCurvature === 'function') {
                drawCylinderCurvature();
            }
            if (typeof drawSaddleCurvature === 'function') {
                drawSaddleCurvature();
            }

            // 初始化交互式曲面
            initializeInteractiveSurface();
        }, 500);

    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// 初始化交互式曲面
function initializeInteractiveSurface() {
    console.log('Initializing interactive surface...');

    // 参数A滑块
    const paramA = document.getElementById('param-a');
    if (paramA) {
        paramA.addEventListener('input', function() {
            document.getElementById('param-a-value').textContent = this.value;
            updateSurfaceVisualization();
        });
    }

    // 参数B滑块
    const paramB = document.getElementById('param-b');
    if (paramB) {
        paramB.addEventListener('input', function() {
            document.getElementById('param-b-value').textContent = this.value;
            updateSurfaceVisualization();
        });
    }

    // 曲面类型选择器
    const surfaceType = document.getElementById('surface-type');
    if (surfaceType) {
        surfaceType.addEventListener('change', function() {
            updateSurfaceVisualization();
        });
    }

    // 初始化曲面可视化
    setTimeout(() => {
        updateSurfaceVisualization();
    }, 200);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializePage);

// 清理函数
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);