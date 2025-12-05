// 第1章：欧几里得几何与非欧几何 - 可视化实现

// 全局变量
let euclideanData = null;
let hyperbolicData = null;
let sphericalData = null;
let animationId = null;

// 欧几里得几何可视化
function drawEuclideanLines() {
    const container = document.getElementById('euclidean-geometry');
    if (!container) return;

    const angle = parseFloat(document.getElementById('euclidean-angle').value);

    const data = [{
        x: [-2, 2],
        y: [0, 0],
        type: 'scatter',
        mode: 'lines',
        name: '基线',
        line: {color: 'blue', width: 2}
    }, {
        x: [0],
        y: [1],
        type: 'scatter',
        mode: 'markers',
        name: '点P',
        marker: {color: 'red', size: 10}
    }, {
        x: [-2, 2],
        y: [1 + Math.tan(angle * Math.PI / 180) * (-2), 1 + Math.tan(angle * Math.PI / 180) * 2],
        type: 'scatter',
        mode: 'lines',
        name: '平行线',
        line: {color: 'green', width: 2, dash: 'dash'}
    }];

    const layout = {
        title: '欧几里得平行公设',
        xaxis: {range: [-3, 3], title: 'x'},
        yaxis: {range: [-3, 3], title: 'y'},
        showlegend: true,
        height: 300,
        margin: {l: 50, r: 50, t: 50, b: 50}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
    euclideanData = {data, layout};
}

// 双曲几何可视化（庞加莱圆盘模型）
function drawHyperbolicLines() {
    const container = document.getElementById('hyperbolic-geometry');
    if (!container) return;

    const curvature = parseFloat(document.getElementById('hyperbolic-curvature').value);

    // 生成单位圆边界
    const theta = [];
    const boundaryX = [];
    const boundaryY = [];
    for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        theta.push(t);
        boundaryX.push(Math.cos(t));
        boundaryY.push(Math.sin(t));
    }

    // 双曲直线（与边界圆垂直的圆弧）
    const hyperbolicLine1 = generateHyperbolicArc(-0.5, 0.8, 1);
    const hyperbolicLine2 = generateHyperbolicArc(0.3, 0.9, 1);

    const data = [{
        x: boundaryX,
        y: boundaryY,
        type: 'scatter',
        mode: 'lines',
        name: '边界圆',
        line: {color: 'black', width: 2}
    }, {
        x: hyperbolicLine1.x,
        y: hyperbolicLine1.y,
        type: 'scatter',
        mode: 'lines',
        name: '双曲直线1',
        line: {color: 'red', width: 2}
    }, {
        x: hyperbolicLine2.x,
        y: hyperbolicLine2.y,
        type: 'scatter',
        mode: 'lines',
        name: '双曲直线2',
        line: {color: 'blue', width: 2}
    }, {
        x: [0],
        y: [0],
        type: 'scatter',
        mode: 'markers',
        name: '点P',
        marker: {color: 'green', size: 8}
    }];

    const layout = {
        title: '庞加莱圆盘模型',
        xaxis: {range: [-1.5, 1.5], title: 'x'},
        yaxis: {range: [-1.5, 1.5], title: 'y'},
        showlegend: true,
        height: 300,
        margin: {l: 50, r: 50, t: 50, b: 50}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
    hyperbolicData = {data, layout};
}

// 生成双曲圆弧
function generateHyperbolicArc(x0, y0, r) {
    const points = {x: [], y: []};
    for (let t = 0; t <= Math.PI; t += 0.1) {
        const x = x0 + r * Math.cos(t);
        const y = y0 + r * Math.sin(t);
        if (x*x + y*y <= 1.01) { // 只保留圆盘内的点
            points.x.push(x);
            points.y.push(y);
        }
    }
    return points;
}

// 球面几何可视化
function drawSphericalLines() {
    const container = document.getElementById('spherical-geometry');
    if (!container) return;

    const radius = parseFloat(document.getElementById('spherical-radius').value);

    // 生成球面网格
    const sphereData = generateSphere(radius);

    // 大圆（球面上的"直线"）
    const greatCircle1 = generateGreatCircle(radius, 0, Math.PI/2);
    const greatCircle2 = generateGreatCircle(radius, Math.PI/4, Math.PI/4);

    const data = sphereData.concat([{
        x: greatCircle1.x,
        y: greatCircle1.y,
        z: greatCircle1.z,
        type: 'scatter3d',
        mode: 'lines',
        name: '大圆1',
        line: {color: 'red', width: 4}
    }, {
        x: greatCircle2.x,
        y: greatCircle2.y,
        z: greatCircle2.z,
        type: 'scatter3d',
        mode: 'lines',
        name: '大圆2',
        line: {color: 'blue', width: 4}
    }]);

    const layout = {
        title: '球面几何 - 大圆',
        scene: {
            xaxis: {range: [-radius*1.2, radius*1.2]},
            yaxis: {range: [-radius*1.2, radius*1.2]},
            zaxis: {range: [-radius*1.2, radius*1.2]}
        },
        height: 300,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
    sphericalData = {data, layout};
}

// 生成球面数据
function generateSphere(radius) {
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push(i * Math.PI / 20);
            v.push(j * 2 * Math.PI / 20);
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
        opacity: 0.3,
        colorscale: 'Blues',
        name: '球面'
    }];
}

// 生成大圆
function generateGreatCircle(radius, phi, theta) {
    const points = {x: [], y: [], z: []};
    for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        const x = radius * (Math.cos(theta) * Math.cos(t) - Math.sin(theta) * Math.sin(phi) * Math.sin(t));
        const y = radius * (Math.cos(theta) * Math.sin(t) + Math.sin(theta) * Math.sin(phi) * Math.cos(t));
        const z = radius * Math.sin(theta) * Math.cos(phi);
        points.x.push(x);
        points.y.push(y);
        points.z.push(z);
    }
    return points;
}

// 创建球面三角形
function createSphericalTriangle() {
    const container = document.getElementById('spherical-triangle');
    if (!container) return;

    const radius = 1;

    // 球面三角形的三个顶点（球面坐标）
    const vertices = [
        {lat: 0, lon: 0},
        {lat: Math.PI/3, lon: Math.PI/3},
        {lat: Math.PI/4, lon: Math.PI/2}
    ];

    // 转换为笛卡尔坐标
    const cartesianVertices = vertices.map(v => ({
        x: radius * Math.cos(v.lat) * Math.cos(v.lon),
        y: radius * Math.cos(v.lat) * Math.sin(v.lon),
        z: radius * Math.sin(v.lat)
    }));

    // 生成大圆弧连接顶点
    const triangleEdges = [];
    for (let i = 0; i < 3; i++) {
        const next = (i + 1) % 3;
        const edge = generateGreatCircleArc(cartesianVertices[i], cartesianVertices[next], radius);
        triangleEdges.push({
            x: edge.x,
            y: edge.y,
            z: edge.z,
            type: 'scatter3d',
            mode: 'lines',
            name: `边${i+1}`,
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
        marker: {color: 'blue', size: 8}
    };

    const data = generateSphere(radius).concat(triangleEdges).concat([vertexMarkers]);

    const layout = {
        title: '球面三角形',
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

// 生成大圆弧
function generateGreatCircleArc(point1, point2, radius) {
    const points = {x: [], y: [], z: []};
    const steps = 50;

    // 计算两个向量的叉积和点积
    const cross = {
        x: point1.y * point2.z - point1.z * point2.y,
        y: point1.z * point2.x - point1.x * point2.z,
        z: point1.x * point2.y - point1.y * point2.x
    };

    const dot = point1.x * point2.x + point1.y * point2.y + point1.z * point2.z;
    const angle = Math.acos(dot / (radius * radius));

    // 生成大圆弧上的点
    for (let t = 0; t <= 1; t += 1/steps) {
        const currentAngle = angle * t;
        const x = point1.x * Math.cos(currentAngle) +
                  cross.x * Math.sin(currentAngle) / Math.sqrt(cross.x*cross.x + cross.y*cross.y + cross.z*cross.z);
        const y = point1.y * Math.cos(currentAngle) +
                  cross.y * Math.sin(currentAngle) / Math.sqrt(cross.x*cross.x + cross.y*cross.y + cross.z*cross.z);
        const z = point1.z * Math.cos(currentAngle) +
                  cross.z * Math.sin(currentAngle) / Math.sqrt(cross.x*cross.x + cross.y*cross.y + cross.z*cross.z);

        points.x.push(x);
        points.y.push(y);
        points.z.push(z);
    }

    return points;
}

// 计算角度盈余
function calculateAngleExcess() {
    const container = document.getElementById('angle-excess-demo');
    if (!container) return;

    // 生成不同内角和的三角形示例
    const triangles = [
        {angles: [60, 60, 60], type: '欧几里得'},
        {angles: [70, 60, 60], type: '球面'},
        {angles: [50, 60, 60], type: '双曲'}
    ];

    const traces = [];
    const colors = ['blue', 'red', 'green'];

    triangles.forEach((tri, index) => {
        const sum = tri.angles.reduce((a, b) => a + b, 0);
        const excess = sum - 180;

        traces.push({
            x: [tri.type],
            y: [excess],
            type: 'bar',
            name: `${tri.type}三角形`,
            marker: {color: colors[index]}
        });
    });

    const layout = {
        title: '不同几何中的三角形角度盈余',
        xaxis: {title: '几何类型'},
        yaxis: {title: '角度盈余 (度)'},
        height: 300,
        margin: {l: 50, r: 50, t: 50, b: 50}
    };

    Plotly.newPlot(container, traces, layout, {responsive: true});
}

// 圆柱面可视化
function unrollCylinder() {
    const container = document.getElementById('cylinder-surface');
    if (!container) return;

    // 圆柱面参数方程
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 20; j++) {
            u.push(i * 2 * Math.PI / 20);
            v.push(j * 2 - 1);
            x.push(Math.cos(u[i]));
            y.push(Math.sin(u[i]));
            z.push(v[j]);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        opacity: 0.7,
        colorscale: 'Viridis',
        name: '圆柱面'
    }];

    const layout = {
        title: '圆柱面 - 可展开成平面',
        scene: {
            xaxis: {range: [-1.5, 1.5]},
            yaxis: {range: [-1.5, 1.5]},
            zaxis: {range: [-2, 2]}
        },
        height: 300,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 锥面可视化
function unrollCone() {
    const container = document.getElementById('cone-surface');
    if (!container) return;

    // 锥面参数方程
    const u = [];
    const v = [];
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 10; j++) {
            u.push(i * 2 * Math.PI / 20);
            v.push(j * 0.1);
            x.push(v[j] * Math.cos(u[i]));
            y.push(v[j] * Math.sin(u[i]));
            z.push(v[j]);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        opacity: 0.7,
        colorscale: 'Plasma',
        name: '锥面'
    }];

    const layout = {
        title: '锥面 - 奇点处的曲率',
        scene: {
            xaxis: {range: [-1.5, 1.5]},
            yaxis: {range: [-1.5, 1.5]},
            zaxis: {range: [0, 1.5]}
        },
        height: 300,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 测地线演示
function drawGeodesics() {
    const container = document.getElementById('geodesic-demo');
    if (!container) return;

    // 在不同曲面上显示测地线
    const surfaces = [
        {type: 'plane', name: '平面测地线'},
        {type: 'sphere', name: '球面测地线'},
        {type: 'cylinder', name: '圆柱面测地线'}
    ];

    const data = [];
    surfaces.forEach((surface, index) => {
        const geodesic = generateGeodesic(surface.type, index);
        data.push({
            x: geodesic.x,
            y: geodesic.y,
            z: geodesic.z || undefined,
            type: geodesic.z ? 'scatter3d' : 'scatter',
            mode: 'lines',
            name: surface.name,
            line: {width: 3}
        });
    });

    const layout = {
        title: '不同曲面上的测地线',
        scene: {
            xaxis: {range: [-2, 2]},
            yaxis: {range: [-2, 2]},
            zaxis: {range: [-2, 2]}
        },
        height: 400,
        margin: {l: 50, r: 50, t: 50, b: 50}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

// 生成测地线
function generateGeodesic(surfaceType, index) {
    const points = {x: [], y: [], z: []};

    switch(surfaceType) {
        case 'plane':
            // 平面上的直线
            for (let t = -2; t <= 2; t += 0.1) {
                points.x.push(t);
                points.y.push(0.5 * t + 1);
            }
            break;
        case 'sphere':
            // 球面上的大圆弧
            const circle = generateGreatCircleArc(
                {x: 1, y: 0, z: 0},
                {x: 0, y: 1, z: 0},
                1
            );
            return circle;
        case 'cylinder':
            // 圆柱面上的螺旋线
            for (let t = 0; t <= 4 * Math.PI; t += 0.1) {
                points.x.push(Math.cos(t));
                points.y.push(Math.sin(t));
                points.z.push(t / (2 * Math.PI) - 1);
            }
            break;
    }

    return points;
}

// 动画函数
function animateEuclideanGeodesic() {
    if (!euclideanData) {
        drawEuclideanLines();
    }

    let t = 0;
    function animate() {
        t += 0.1;
        // 更新动画数据
        // 这里可以添加具体的动画逻辑
        animationId = requestAnimationFrame(animate);
    }
    animate();
}

function animateHyperbolicGeodesic() {
    if (!hyperbolicData) {
        drawHyperbolicLines();
    }
    // 双曲几何动画逻辑
}

function animateSphericalGeodesic() {
    if (!sphericalData) {
        drawSphericalLines();
    }
    // 球面几何动画逻辑
}

function animateTriangleRotation() {
    // 球面三角形旋转动画
}

// 初始化滑块事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 欧几里得角度滑块
    const euclideanAngleSlider = document.getElementById('euclidean-angle');
    if (euclideanAngleSlider) {
        euclideanAngleSlider.addEventListener('input', function() {
            document.getElementById('euclidean-angle-value').textContent = this.value + '°';
            if (euclideanData) {
                drawEuclideanLines();
            }
        });
    }

    // 双曲曲率滑块
    const hyperbolicCurvatureSlider = document.getElementById('hyperbolic-curvature');
    if (hyperbolicCurvatureSlider) {
        hyperbolicCurvatureSlider.addEventListener('input', function() {
            document.getElementById('hyperbolic-curvature-value').textContent = this.value;
            if (hyperbolicData) {
                drawHyperbolicLines();
            }
        });
    }

    // 球面半径滑块
    const sphericalRadiusSlider = document.getElementById('spherical-radius');
    if (sphericalRadiusSlider) {
        sphericalRadiusSlider.addEventListener('input', function() {
            document.getElementById('spherical-radius-value').textContent = this.value;
            if (sphericalData) {
                drawSphericalLines();
            }
        });
    }

    // 初始化第一个可视化
    drawEuclideanLines();
    drawHyperbolicLines();
    drawSphericalLines();
});

// 清理函数
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);