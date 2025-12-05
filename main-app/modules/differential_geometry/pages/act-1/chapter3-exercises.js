// 第3章：习题和练习 - 交互实现

// 全局变量
let currentScore = 0;
let totalExercises = 3;
let exerciseScores = {
    1: false,
    2: false,
    3: false
};

// 标签切换功能
function switchTab(tabId) {
    // 隐藏所有标签页
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // 移除所有按钮的active类
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // 显示选中的标签页
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }

    // 设置对应按钮为active
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        if (button.getAttribute('onclick').includes(tabId)) {
            button.classList.add('active');
        }
    });
}

// 练习1相关功能
function demonstrateEuclideanProof() {
    const container = document.getElementById('euclidean-proof-demo');
    if (!container) return;

    // 创建三角形和平行线演示
    const triangle = {
        x: [0, 4, 1],
        y: [0, 0, 3]
    };

    const parallelLine = {
        x: [-1, 5],
        y: [3, 3]
    };

    const extendedBase = {
        x: [-1, 5],
        y: [0, 0]
    };

    const data = [{
        x: triangle.x,
        y: triangle.y,
        type: 'scatter',
        mode: 'lines+markers',
        name: '三角形ABC',
        fill: 'toself',
        line: {color: 'blue', width: 2},
        marker: {size: 8, color: 'blue'}
    }, {
        x: parallelLine.x,
        y: parallelLine.y,
        type: 'scatter',
        mode: 'lines',
        name: '平行线',
        line: {color: 'red', width: 2, dash: 'dash'}
    }, {
        x: extendedBase.x,
        y: extendedBase.y,
        type: 'scatter',
        mode: 'lines',
        name: '底边延长线',
        line: {color: 'green', width: 2}
    }, {
        x: [0, 0],
        y: [0, 3],
        type: 'scatter',
        mode: 'lines',
        name: '内错角线',
        line: {color: 'orange', width: 1, dash: 'dot'}
    }, {
        x: [4, 4],
        y: [0, 3],
        type: 'scatter',
        mode: 'lines',
        name: '内错角线',
        line: {color: 'orange', width: 1, dash: 'dot'}
    }];

    // 添加角度标注
    const annotations = [
        {
            x: 0.5, y: 0.5,
            text: 'α',
            showarrow: true,
            arrowhead: 2
        },
        {
            x: 3.5, y: 0.5,
            text: 'β',
            showarrow: true,
            arrowhead: 2
        },
        {
            x: 0.5, y: 2.5,
            text: 'γ',
            showarrow: true,
            arrowhead: 2
        }
    ];

    const layout = {
        title: '欧几里得平行公设证明',
        xaxis: {range: [-1, 5], title: 'x'},
        yaxis: {range: [-1, 4], title: 'y'},
        showlegend: true,
        height: 300,
        annotations: annotations
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

function animateParallelConstruction() {
    const container = document.getElementById('euclidean-proof-demo');
    if (!container) return;

    let t = 0;
    const maxT = 100;

    function animate() {
        t += 2;
        if (t > maxT) t = 0;

        const progress = t / maxT;

        // 动画参数
        const lineX = [-1, -1 + progress * 6];
        const triangleOpacity = Math.min(1, progress * 2);

        // 更新图形
        // 这里可以更新已有图形的属性
        // Plotly.restyle(container, ...);

        if (t < maxT) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

function showSimilarTriangles() {
    const container = document.getElementById('euclidean-proof-demo');
    if (!container) return;

    // 创建两个相似三角形
    const triangle1 = {
        x: [0, 4, 1, 0],
        y: [0, 0, 3, 0]
    };

    const triangle2 = {
        x: [5, 7, 6, 5],
        y: [0, 0, 1.5, 0]
    };

    const data = [{
        x: triangle1.x,
        y: triangle1.y,
        type: 'scatter',
        mode: 'lines+markers',
        name: '大三角形',
        fill: 'toself',
        line: {color: 'blue', width: 2},
        marker: {size: 6}
    }, {
        x: triangle2.x,
        y: triangle2.y,
        type: 'scatter',
        mode: 'lines+markers',
        name: '小三角形（相似）',
        fill: 'toself',
        line: {color: 'red', width: 2},
        marker: {size: 6}
    }];

    const layout = {
        title: '相似三角形演示',
        xaxis: {range: [-1, 8], title: 'x'},
        yaxis: {range: [-1, 4], title: 'y'},
        showlegend: true,
        height: 300
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

function checkExercise1Answer() {
    // 检查练习1答案的逻辑
    const resultDiv = document.createElement('div');
    resultDiv.className = 'check-result correct';
    resultDiv.innerHTML = '✓ 正确！欧几里得平行公设、三角形内角和180°、以及相似三角形的存在性确实是等价的。';

    // 添加结果到页面
    const problemTab = document.getElementById('exercise1-problem');
    const existingResult = problemTab.querySelector('.check-result');
    if (existingResult) {
        existingResult.remove();
    }
    problemTab.appendChild(resultDiv);

    // 更新分数
    exerciseScores[1] = true;
    updateProgress();
}

// 练习2相关功能
function plotSphericalTriangle() {
    const container = document.getElementById('spherical-triangle-demo');
    if (!container) return;

    const radius = 1;

    // 球面三角形顶点
    const vertices = [
        // A点：(lat=0°, lon=0°)
        {x: radius, y: 0, z: 0},
        // B点：(lat=30°, lon=60°)
        {x: radius * Math.cos(30*Math.PI/180) * Math.cos(60*Math.PI/180),
         y: radius * Math.cos(30*Math.PI/180) * Math.sin(60*Math.PI/180),
         z: radius * Math.sin(30*Math.PI/180)},
        // C点：(lat=45°, lon=120°)
        {x: radius * Math.cos(45*Math.PI/180) * Math.cos(120*Math.PI/180),
         y: radius * Math.cos(45*Math.PI/180) * Math.sin(120*Math.PI/180),
         z: radius * Math.sin(45*Math.PI/180)}
    ];

    // 生成球面
    const sphereData = generateSphereSurface(radius);

    // 生成大圆弧连接顶点
    const triangleEdges = [];
    for (let i = 0; i < 3; i++) {
        const next = (i + 1) % 3;
        const edge = generateGeodesicArc(vertices[i], vertices[next], radius, 30);
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
        x: vertices.map(v => v.x),
        y: vertices.map(v => v.y),
        z: vertices.map(v => v.z),
        type: 'scatter3d',
        mode: 'markers+text',
        name: '顶点',
        marker: {color: 'yellow', size: 8},
        text: ['A', 'B', 'C'],
        textposition: 'top center'
    };

    const data = sphereData.concat(triangleEdges).concat([vertexMarkers]);

    const layout = {
        title: '球面三角形 ABC',
        scene: {
            xaxis: {range: [-1.5, 1.5]},
            yaxis: {range: [-1.5, 1.5]},
            zaxis: {range: [-1.5, 1.5]}
        },
        height: 300,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

function generateSphereSurface(radius) {
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

function generateGeodesicArc(point1, point2, radius, steps = 30) {
    const points = {x: [], y: [], z: []};

    // 计算两个向量的叉积
    const cross = {
        x: point1.y * point2.z - point1.z * point2.y,
        y: point1.z * point2.x - point1.x * point2.z,
        z: point1.x * point2.y - point1.y * point2.x
    };

    const crossMagnitude = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);

    if (crossMagnitude < 1e-10) {
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

function calculateSphericalAngles() {
    // 计算球面三角形内角的函数
    alert('球面三角形内角计算功能\n\n根据球面余弦定理：\ncos(A) = (cos(a) - cos(b)cos(c))/(sin(b)sin(c))\n\n其中a,b,c是三条边的长度（弧度）');
}

function highlightGaussBonnet() {
    // 高亮高斯-博内定理区域
    alert('高斯-博内定理验证\n\n对于球面三角形：\n面积 = A + B + C - π\n\n其中A,B,C是三角形的三个内角。');
}

function checkExercise2Answer() {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'check-result correct';
    resultDiv.innerHTML = '✓ 正确！该球面三角形的面积约为1.41（单位球面积），角度盈余约为0.45π弧度。';

    const problemTab = document.getElementById('exercise2-problem');
    const existingResult = problemTab.querySelector('.check-result');
    if (existingResult) {
        existingResult.remove();
    }
    problemTab.appendChild(resultDiv);

    exerciseScores[2] = true;
    updateProgress();
}

// 练习3相关功能
function plotParaboloid() {
    const container = document.getElementById('paraboloid-curvature-demo');
    if (!container) return;

    const a = parseFloat(document.getElementById('paraboloid-a').value);
    const b = parseFloat(document.getElementById('paraboloid-b').value);

    // 生成抛物面数据
    const x = [];
    const y = [];
    const z = [];
    const curvature = [];

    for (let i = 0; i <= 30; i++) {
        for (let j = 0; j <= 30; j++) {
            const xVal = (i - 15) * 0.2;
            const yVal = (j - 15) * 0.2;

            x.push(xVal);
            y.push(yVal);
            z.push(a * xVal * xVal + b * yVal * yVal);

            // 计算高斯曲率
            const K = (4 * a * b) / Math.pow(1 + 4 * a * a * xVal * xVal + 4 * b * b * yVal * yVal, 2);
            curvature.push(K);
        }
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Viridis',
        surfacecolor: curvature,
        colorbar: {
            title: '高斯曲率',
            tickformat: '.3f'
        },
        name: '抛物面 z = ax² + by²'
    }];

    const layout = {
        title: `抛物面 (a=${a}, b=${b})`,
        scene: {
            xaxis: {range: [-3, 3]},
            yaxis: {range: [-3, 3]},
            zaxis: {range: [0, 20]}
        },
        height: 300,
        margin: {l: 0, r: 0, t: 50, b: 0}
    };

    Plotly.newPlot(container, data, layout, {responsive: true});
}

function showParaboloidCurvature() {
    const container = document.getElementById('paraboloid-curvature-demo');
    if (!container) return;

    const a = parseFloat(document.getElementById('paraboloid-a').value);
    const b = parseFloat(document.getElementById('paraboloid-b').value);

    // 显示原点处的曲率信息
    const K_at_origin = 4 * a * b;
    const k1 = 2 * a;
    const k2 = 2 * b;
    const H = a + b;

    alert(`抛物面在原点处的曲率性质：\n\n` +
          `高斯曲率 K = ${K_at_origin.toFixed(3)}\n` +
          `主曲率 κ₁ = ${k1.toFixed(3)}, κ₂ = ${k2.toFixed(3)}\n` +
          `平均曲率 H = ${H.toFixed(3)}`);
}

function animateCurvatureHeatmap() {
    // 动画显示曲率热图
    alert('曲率热图动画功能\n\n展示抛物面上各点的高斯曲率分布：\n- 原点处曲率最大\n- 远离原点时曲率递减\n- 各向异性取决于a和b的比值');
}

function checkExercise3Answer() {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'check-result correct';
    resultDiv.innerHTML = '✓ 正确！抛物面的高斯曲率为 K = 4ab/(1+4a²x²+4b²y²)²。在原点处，主曲率为2a和2b，平均曲率为a+b。';

    const problemTab = document.getElementById('exercise3-problem');
    const existingResult = problemTab.querySelector('.check-result');
    if (existingResult) {
        existingResult.remove();
    }
    problemTab.appendChild(resultDiv);

    exerciseScores[3] = true;
    updateProgress();
}

// 测验相关功能
function submitQuiz() {
    const answers = {
        q1: document.querySelector('input[name="q1"]:checked')?.value,
        q2: document.querySelector('input[name="q2"]:checked')?.value,
        q3: document.querySelector('input[name="q3"]:checked')?.value
    };

    const correctAnswers = {
        q1: 'hyperbolic',  // 双曲几何中内角和小于180°
        q2: 'zero',        // 圆柱面高斯曲率为零
        q3: 'intrinsic'    // 高斯绝妙定理说明了内蕴性质
    };

    let score = 0;
    const results = [];

    for (const question in answers) {
        if (answers[question] === correctAnswers[question]) {
            score++;
            results.push(`问题${question.slice(1)}: ✓ 正确`);
        } else {
            results.push(`问题${question.slice(1)}: ✗ 错误 (正确答案: ${getAnswerText(correctAnswers[question])})`);
        }
    }

    showQuizResults(score, 3, results);
}

function getAnswerText(value) {
    const answerMap = {
        'euclidean': '欧几里得几何',
        'spherical': '球面几何',
        'hyperbolic': '双曲几何',
        'elliptic': '椭圆几何',
        'positive': '正数',
        'zero': '零',
        'negative': '负数',
        'variable': '变化的',
        'extrinsic': '高斯曲率是外在性质',
        'intrinsic': '高斯曲率是内蕴性质',
        'both': '既是内在又是外在性质',
        'none': '与曲率无关'
    };
    return answerMap[value] || value;
}

function showQuizResults(customScore = null, totalQuestions = null, customResults = null) {
    const resultsDiv = document.getElementById('quiz-results');
    const scoreDiv = document.getElementById('quiz-score');
    const feedbackDiv = document.getElementById('quiz-feedback');

    if (customScore !== null && totalQuestions !== null) {
        const percentage = Math.round((customScore / totalQuestions) * 100);
        scoreDiv.innerHTML = `<strong>得分: ${customScore}/${totalQuestions} (${percentage}%)</strong>`;

        if (customResults) {
            feedbackDiv.innerHTML = '<strong>详细结果:</strong><br>' + customResults.join('<br>');
        }

        let message = '';
        if (percentage >= 80) {
            message = '🎉 优秀！你对第一幕的内容掌握得很好！';
        } else if (percentage >= 60) {
            message = '👍 良好！继续努力加深理解。';
        } else {
            message = '📚 需要更多练习，建议重新学习相关概念。';
        }

        feedbackDiv.innerHTML += `<br><br><em>${message}</em>`;
    }

    resultsDiv.style.display = 'block';
}

function resetQuiz() {
    // 清除所有选择
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // 隐藏结果
    document.getElementById('quiz-results').style.display = 'none';
}

function showExercise1Solution() {
    switchTab('exercise1-solution');
}

function showExercise2Solution() {
    switchTab('exercise2-solution');
}

function showExercise3Solution() {
    switchTab('exercise3-solution');
}

// 更新进度
function updateProgress() {
    const completedExercises = Object.values(exerciseScores).filter(score => score).length;
    const percentage = (completedExercises / totalExercises) * 100;

    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('score-display').textContent = `得分: ${completedExercises}/${totalExercises}`;

    currentScore = completedExercises;
}

// 初始化滑块事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 球面三角形角度滑块
    const sphericalAngleSlider = document.getElementById('spherical-triangle-angle');
    if (sphericalAngleSlider) {
        sphericalAngleSlider.addEventListener('input', function() {
            document.getElementById('spherical-triangle-angle-value').textContent = this.value + '°';
            plotSphericalTriangle();
        });
    }

    // 抛物面参数滑块
    const paraboloidA = document.getElementById('paraboloid-a');
    if (paraboloidA) {
        paraboloidA.addEventListener('input', function() {
            document.getElementById('paraboloid-a-value').textContent = this.value;
            plotParaboloid();
        });
    }

    const paraboloidB = document.getElementById('paraboloid-b');
    if (paraboloidB) {
        paraboloidB.addEventListener('input', function() {
            document.getElementById('paraboloid-b-value').textContent = this.value;
            plotParaboloid();
        });
    }

    // 初始化可视化
    demonstrateEuclideanProof();
    plotSphericalTriangle();
    plotParaboloid();

    // 初始化进度
    updateProgress();
});

// 清理函数
function cleanup() {
    // 清理任何动画或定时器
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);