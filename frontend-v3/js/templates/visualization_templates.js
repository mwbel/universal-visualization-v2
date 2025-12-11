
/**
 * 可视化模板库
 * 用于生成聊天界面中的可视化内容
 */

export const visualizationTemplates = {
  /**
   * 二阶行列式可视化模板
   */
  determinant: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 15px; font-family: -apple-system, sans-serif; background: #f8f9fa; }
        .container { max-width: 100%; margin: 0 auto; }
        .control-panel { 
            background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;
        }
        .control-group { display: flex; align-items: center; gap: 8px; }
        .control-group label { font-weight: 600; min-width: 40px; }
        .control-group input { 
            width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; 
        }
        .result-panel {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;
        }
        .result-value { font-size: 1.5em; font-weight: bold; margin: 5px 0; }
        .plot-container { 
            background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 400px; width: 100%; position: relative;
        }
        .formula-display {
            background: #fff; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center;
            border: 1px solid #eee; overflow-x: auto; font-family: "Times New Roman", serif; font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="result-panel">
            <div>行列式值 / 平行四边形面积</div>
            <div class="result-value" id="det-value">0</div>
        </div>

        <div class="control-panel">
            <div class="control-group">
                <label>a₁₁</label>
                <input type="number" id="a11" value="${params.a11 || 3}" step="0.1">
            </div>
            <div class="control-group">
                <label>a₁₂</label>
                <input type="number" id="a12" value="${params.a12 || 1}" step="0.1">
            </div>
            <div class="control-group">
                <label>a₂₁</label>
                <input type="number" id="a21" value="${params.a21 || 2}" step="0.1">
            </div>
            <div class="control-group">
                <label>a₂₂</label>
                <input type="number" id="a22" value="${params.a22 || 4}" step="0.1">
            </div>
        </div>

        <div class="formula-display">
            Det(A) = a₁₁a₂₂ - a₁₂a₂₁
            <div id="calculation-steps" style="margin-top: 5px; font-size: 0.9em; color: #666;"></div>
        </div>

        <div id="plot" class="plot-container"></div>
    </div>

    <script>
        function init() {
            const inputs = ['a11', 'a12', 'a21', 'a22'];
            inputs.forEach(id => {
                document.getElementById(id).addEventListener('input', update);
            });
            update();
        }

        function checkPlotly() {
            if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        
        checkPlotly();

        function update() {
            const a11 = parseFloat(document.getElementById('a11').value) || 0;
            const a12 = parseFloat(document.getElementById('a12').value) || 0;
            const a21 = parseFloat(document.getElementById('a21').value) || 0;
            const a22 = parseFloat(document.getElementById('a22').value) || 0;

            const det = a11 * a22 - a12 * a21;
            
            // Update Text
            document.getElementById('det-value').textContent = det.toFixed(2);
            document.getElementById('calculation-steps').innerHTML = 
                \`\${a11} × \${a22} - \${a12} × \${a21} = \${(a11*a22).toFixed(2)} - \${(a12*a21).toFixed(2)} = \${det.toFixed(2)}\`;

            // Update Plot
            const v1 = [a11, a21];
            const v2 = [a12, a22];
            const p3 = [v1[0] + v2[0], v1[1] + v2[1]];

            const traces = [
                // Origin to v1
                {
                    x: [0, v1[0]], y: [0, v1[1]],
                    mode: 'lines+markers',
                    name: 'v₁',
                    line: { color: '#e53e3e', width: 3 }
                },
                // Origin to v2
                {
                    x: [0, v2[0]], y: [0, v2[1]],
                    mode: 'lines+markers',
                    name: 'v₂',
                    line: { color: '#3182ce', width: 3 }
                },
                // Parallelogram completion
                {
                    x: [v1[0], p3[0], v2[0]],
                    y: [v1[1], p3[1], v2[1]],
                    mode: 'lines',
                    line: { color: '#a0aec0', width: 1, dash: 'dash' },
                    showlegend: false,
                    fill: 'toself',
                    fillcolor: 'rgba(102, 126, 234, 0.2)'
                }
            ];

            const layout = {
                margin: { t: 20, r: 20, b: 30, l: 30 },
                xaxis: { zeroline: true, showgrid: true },
                yaxis: { zeroline: true, showgrid: true, scaleanchor: 'x' },
                showlegend: true,
                legend: { x: 0, y: 1 }
            };

            const config = { responsive: true, displayModeBar: false };

            Plotly.newPlot('plot', traces, layout, config);
        }
    </script>
</body>
</html>`;
  },

  /**
   * 正态分布可视化模板
   */
  normal_distribution: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 15px; font-family: -apple-system, sans-serif; background: #f8f9fa; }
        .container { max-width: 100%; margin: 0 auto; }
        .control-panel { 
            background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 15px;
        }
        .control-group { margin-bottom: 10px; }
        .control-group label { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 5px; }
        .control-group input[type="range"] { width: 100%; }
        .plot-container { 
            background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 400px; width: 100%; position: relative;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="control-panel">
            <div class="control-group">
                <label>均值 (μ): <span id="mu-val">${params.mu || 0}</span></label>
                <input type="range" id="mu" min="-5" max="5" step="0.1" value="${params.mu || 0}">
            </div>
            <div class="control-group">
                <label>标准差 (σ): <span id="sigma-val">${params.sigma || 1}</span></label>
                <input type="range" id="sigma" min="0.1" max="5" step="0.1" value="${params.sigma || 1}">
            </div>
        </div>

        <div id="plot" class="plot-container"></div>
    </div>

    <script>
        function normalPDF(x, mu, sigma) {
            return (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        }

        function init() {
            const muInput = document.getElementById('mu');
            const sigmaInput = document.getElementById('sigma');

            function update() {
                const mu = parseFloat(muInput.value);
                const sigma = parseFloat(sigmaInput.value);

                document.getElementById('mu-val').textContent = mu;
                document.getElementById('sigma-val').textContent = sigma;

                const x = [];
                const y = [];
                // Generate points
                // Fixed range for better visualization of shifting
                const start = -10; 
                const end = 10;
                const step = (end - start) / 500;

                for (let i = start; i <= end; i += step) {
                    x.push(i);
                    y.push(normalPDF(i, mu, sigma));
                }

                // Standard Normal for comparison
                const stdY = [];
                for (let i = start; i <= end; i += step) {
                    stdY.push(normalPDF(i, 0, 1));
                }

                const traces = [
                    {
                        x: x, y: y,
                        type: 'scatter', mode: 'lines',
                        name: \`N(\${mu}, \${sigma}²)\`,
                        fill: 'tozeroy',
                        line: { color: '#667eea', width: 3 }
                    },
                    {
                        x: x, y: stdY,
                        type: 'scatter', mode: 'lines',
                        name: 'N(0, 1)',
                        line: { color: '#cbd5e0', width: 2, dash: 'dash' }
                    }
                ];

                const layout = {
                    margin: { t: 30, r: 20, b: 30, l: 40 },
                    xaxis: { 
                        title: 'x',
                        range: [-10, 10],
                        autorange: false
                    },
                    yaxis: { 
                        title: 'Probability Density',
                        range: [0, 1.2],
                        autorange: false
                    },
                    showlegend: true,
                    legend: { x: 0.8, y: 1 }
                };

                const config = { responsive: true, displayModeBar: false };
                
                Plotly.newPlot('plot', traces, layout, config);
            }

            muInput.addEventListener('input', update);
            sigmaInput.addEventListener('input', update);
            
            update();
        }

        // Check Plotly with retry
        function checkPlotly() {
            if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        checkPlotly();
    </script>
</body>
</html>`;
  },

  /**
   * 太阳系可视化模板
   */
  solar_system: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 0; background: #000; overflow: hidden; }
        .plot-container { width: 100vw; height: 100vh; }
        .controls {
            position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.1); 
            padding: 10px; border-radius: 5px; color: white; font-family: sans-serif;
            backdrop-filter: blur(5px); z-index: 100; pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="controls">
        <div>太阳系模拟</div>
        <div style="font-size: 0.8em; color: #aaa;">包含：太阳、水星、金星、地球、火星</div>
    </div>
    <div id="plot" class="plot-container"></div>

    <script>
        // Planet data (simplified: distance in AU, period in years, size relative, color)
        const planets = [
            { name: 'Sun', r: 0, period: 1, size: 20, color: '#FDB813' },
            { name: 'Mercury', r: 0.39, period: 0.24, size: 4, color: '#A5A5A5' },
            { name: 'Venus', r: 0.72, period: 0.62, size: 8, color: '#E3BB76' },
            { name: 'Earth', r: 1.0, period: 1.0, size: 8, color: '#4F7942' },
            { name: 'Mars', r: 1.52, period: 1.88, size: 6, color: '#E27B58' }
        ];

        let t = 0;
        const speed = 0.005; // 降低速度以平滑动画

        function getPos(planet, time) {
            if (planet.r === 0) return {x: 0, y: 0, z: 0};
            const angle = 2 * Math.PI * (time / planet.period);
            return {
                x: planet.r * Math.cos(angle),
                y: planet.r * Math.sin(angle),
                z: 0
            };
        }

        function init() {
            const data = planets.map(p => {
                const pos = getPos(p, 0);
                return {
                    x: [pos.x], y: [pos.y], z: [pos.z],
                    mode: 'markers',
                    type: 'scatter3d',
                    name: p.name,
                    marker: { size: p.size, color: p.color }
                };
            });

            // Add orbits
            planets.forEach(p => {
                if (p.r === 0) return;
                const orbitX = [];
                const orbitY = [];
                const orbitZ = [];
                for(let i=0; i<=60; i++) {
                    const angle = 2 * Math.PI * i / 60;
                    orbitX.push(p.r * Math.cos(angle));
                    orbitY.push(p.r * Math.sin(angle));
                    orbitZ.push(0);
                }
                data.push({
                    x: orbitX, y: orbitY, z: orbitZ,
                    mode: 'lines',
                    type: 'scatter3d',
                    showlegend: false,
                    line: { color: 'rgba(255,255,255,0.2)', width: 1 },
                    hoverinfo: 'none'
                });
            });

            const layout = {
                margin: {t:0, b:0, l:0, r:0},
                uirevision: 'true', // 保持交互状态的关键
                scene: {
                    xaxis: {range: [-2, 2], showgrid: false, zeroline: false, showticklabels: false, title: ''},
                    yaxis: {range: [-2, 2], showgrid: false, zeroline: false, showticklabels: false, title: ''},
                    zaxis: {range: [-1, 1], showgrid: false, zeroline: false, showticklabels: false, title: ''},
                    bgcolor: 'black',
                    dragmode: 'orbit', // 默认轨道旋转模式
                    aspectmode: 'cube'
                },
                paper_bgcolor: 'black',
                showlegend: true,
                legend: { x: 0, y: 0, font: { color: 'white' } }
            };

            const config = { 
                responsive: true, 
                displayModeBar: true, // 显示工具栏以便重置视角
                displaylogo: false
            };

            Plotly.newPlot('plot', data, layout, config).then(() => {
                requestAnimationFrame(animate);
            });
        }

        function animate() {
            t += speed;
            
            // Update only planets (first 5 traces)
            // 使用 Plotly.react 或 animate 时，如果不更新 layout，会保持交互状态
            // 但 animate 在 3D 中有时会有性能问题或重置问题，这里使用优化后的 animate 配置
            
            const update = {
                x: [], y: [], z: []
            };

            for(let i=0; i<planets.length; i++) {
                const pos = getPos(planets[i], t);
                update.x.push([pos.x]);
                update.y.push([pos.y]);
                update.z.push([pos.z]);
            }

            Plotly.animate('plot', {
                data: update,
                traces: [0, 1, 2, 3, 4],
                layout: {} // 空 layout 避免重置
            }, {
                transition: { duration: 0 },
                frame: { duration: 0, redraw: false } // 尝试 redraw: false 提高性能 (3D 可能需要 true)
            }).then(() => {
                requestAnimationFrame(animate);
            });
            
            // 备用方案：如果 animate 卡顿，可以改用 react
            /*
            const newData = ...; // 构造完整 data
            Plotly.react('plot', newData, layout); // 需配合 uirevision
            */
        }

        // Retry init
        function checkPlotly() {
             if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        checkPlotly();

    </script>
</body>
</html>`;
  },

  /**
   * 抛体运动可视化模板
   */
  projectile: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 15px; font-family: -apple-system, sans-serif; background: #f8f9fa; }
        .container { max-width: 100%; margin: 0 auto; }
        .control-panel { 
            background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 15px;
        }
        .control-group { margin-bottom: 10px; }
        .control-group label { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 5px; }
        .control-group input[type="range"] { width: 100%; }
        .plot-container { 
            background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 400px; width: 100%; position: relative;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="control-panel">
            <div class="control-group">
                <label>初速度 (v₀): <span id="v0-val">${params.v0 || 20}</span> m/s</label>
                <input type="range" id="v0" min="5" max="50" step="1" value="${params.v0 || 20}">
            </div>
            <div class="control-group">
                <label>发射角度 (θ): <span id="angle-val">${params.angle || 45}</span>°</label>
                <input type="range" id="angle" min="0" max="90" step="1" value="${params.angle || 45}">
            </div>
        </div>
        <div id="plot" class="plot-container"></div>
    </div>
    <script>
        const g = 9.8;
        let t = 0;
        let animationId;
        
        function init() {
            const v0Input = document.getElementById('v0');
            const angleInput = document.getElementById('angle');
            
            function update() {
                const v0 = parseFloat(v0Input.value);
                const angle = parseFloat(angleInput.value);
                const rad = angle * Math.PI / 180;
                
                document.getElementById('v0-val').textContent = v0;
                document.getElementById('angle-val').textContent = angle;
                
                // Calculate trajectory
                const totalTime = (2 * v0 * Math.sin(rad)) / g;
                const maxDistance = v0 * Math.cos(rad) * totalTime;
                const maxHeight = (v0 * v0 * Math.sin(rad) * Math.sin(rad)) / (2 * g);
                
                const x = [];
                const y = [];
                for(let time = 0; time <= totalTime; time += 0.05) {
                    x.push(v0 * Math.cos(rad) * time);
                    y.push(v0 * Math.sin(rad) * time - 0.5 * g * time * time);
                }
                
                // Add end point
                x.push(maxDistance);
                y.push(0);
                
                const trace = {
                    x: x, y: y,
                    mode: 'lines',
                    line: { color: '#e53e3e', width: 3 }
                };
                
                const layout = {
                    margin: { t: 20, r: 20, b: 40, l: 40 },
                    xaxis: { title: '距离 (m)', range: [0, 260] },
                    yaxis: { title: '高度 (m)', range: [0, 100], scaleanchor: 'x' },
                    shapes: [
                        { type: 'line', x0: 0, y0: 0, x1: 260, y1: 0, line: { color: 'black', width: 2 } } // Ground
                    ]
                };
                
                const config = { responsive: true, displayModeBar: false };
                Plotly.newPlot('plot', [trace], layout, config);
            }
            
            v0Input.addEventListener('input', update);
            angleInput.addEventListener('input', update);
            update();
        }
        
        // Retry logic
        function checkPlotly() {
             if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        checkPlotly();
    </script>
</body>
</html>`;
  },

  /**
   * 简谐振动可视化模板
   */
  harmonic_motion: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 15px; font-family: -apple-system, sans-serif; background: #f8f9fa; }
        .container { max-width: 100%; margin: 0 auto; }
        .control-panel { 
            background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 15px;
        }
        .control-group { margin-bottom: 10px; }
        .control-group label { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 5px; }
        .control-group input[type="range"] { width: 100%; }
        .plot-container { 
            background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 400px; width: 100%; position: relative;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="control-panel">
            <div class="control-group">
                <label>振幅 (A): <span id="amp-val">${params.amplitude || 1}</span></label>
                <input type="range" id="amp" min="0.1" max="5" step="0.1" value="${params.amplitude || 1}">
            </div>
            <div class="control-group">
                <label>频率 (f): <span id="freq-val">${params.frequency || 1}</span> Hz</label>
                <input type="range" id="freq" min="0.1" max="5" step="0.1" value="${params.frequency || 1}">
            </div>
        </div>
        <div id="plot" class="plot-container"></div>
    </div>
    <script>
        function init() {
            const ampInput = document.getElementById('amp');
            const freqInput = document.getElementById('freq');
            
            let time = 0;
            let dataX = [];
            let dataY = [];
            
            // Initialize Plot
            Plotly.newPlot('plot', [{
                x: [0], y: [0],
                mode: 'lines',
                line: { color: '#3182ce', width: 3 }
            }], {
                margin: { t: 20, r: 20, b: 40, l: 40 },
                xaxis: { title: '时间 (s)', range: [0, 10] },
                yaxis: { title: '位移 (m)', range: [-6, 6] }
            }, { responsive: true, displayModeBar: false });
            
            function animate() {
                const A = parseFloat(ampInput.value);
                const f = parseFloat(freqInput.value);
                
                document.getElementById('amp-val').textContent = A;
                document.getElementById('freq-val').textContent = f;
                
                time += 0.05;
                const y = A * Math.sin(2 * Math.PI * f * time);
                
                dataX.push(time);
                dataY.push(y);
                
                // Keep only last 10 seconds
                if (dataX[0] < time - 10) {
                    dataX.shift();
                    dataY.shift();
                }
                
                Plotly.update('plot', {
                    x: [dataX],
                    y: [dataY]
                }, {}, [0]);
                
                Plotly.relayout('plot', {
                    'xaxis.range': [Math.max(0, time - 10), Math.max(10, time)]
                });
                
                requestAnimationFrame(animate);
            }
            
            requestAnimationFrame(animate);
        }
        
        // Retry logic
        function checkPlotly() {
             if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        checkPlotly();
    </script>
</body>
</html>`;
  },

  /**
   * 柱状图模板
   */
  bar_chart: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:100vh;"></div>
    <script>
        const data = [
            {
                x: ['A', 'B', 'C', 'D', 'E'],
                y: [20, 14, 23, 18, 29],
                type: 'bar',
                marker: {
                    color: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565']
                }
            }
        ];
        
        const layout = {
            title: '示例柱状图',
            margin: {t:40,b:30,l:30,r:20}
        };
        
        const check = setInterval(() => {
            if(window.Plotly) {
                clearInterval(check);
                Plotly.newPlot('plot', data, layout, {responsive: true});
            }
        }, 100);
    </script>
</body>
</html>`;
  },

  /**
   * 饼图模板
   */
  pie_chart: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:10px;font-family:sans-serif;}</style>
</head>
<body>
    <div id="plot" style="width:100%;height:100vh;"></div>
    <script>
        const data = [{
            values: [19, 26, 55],
            labels: ['Category A', 'Category B', 'Category C'],
            type: 'pie',
            hole: 0.4,
            marker: {
                colors: ['#4299e1', '#48bb78', '#ed8936']
            }
        }];
        
        const layout = {
            title: '示例饼图',
            margin: {t:40,b:20,l:20,r:20}
        };
        
        const check = setInterval(() => {
            if(window.Plotly) {
                clearInterval(check);
                Plotly.newPlot('plot', data, layout, {responsive: true});
            }
        }, 100);
    </script>
</body>
</html>`;
  },

  /**
   * Logistic 映射 (混沌)
   */
  logistic_map: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>body{margin:0;padding:15px;font-family:sans-serif;}</style>
</head>
<body>
    <div style="margin-bottom:15px;background:#f8f9fa;padding:15px;border-radius:8px;">
        <label>Growth Rate (r): <input type="range" id="r" min="2.0" max="4.0" step="0.01" value="3.2"></label>
        <span id="r-val">3.2</span>
    </div>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        const rIn = document.getElementById('r');
        const rVal = document.getElementById('r-val');
        
        function draw() {
            const r = parseFloat(rIn.value);
            rVal.textContent = r;
            
            const x = [], y = [];
            let val = 0.5;
            for(let i=0; i<100; i++) {
                x.push(i);
                y.push(val);
                val = r * val * (1 - val);
            }
            
            Plotly.newPlot('plot', [{x, y, type:'scatter', mode:'lines+markers'}], 
            {
                title: \`Logistic Map (r=\${r})\`,
                margin: {t:40,b:30,l:30,r:20},
                yaxis: {range: [0, 1]}
            });
        }
        
        rIn.oninput = draw;
        
        const check = setInterval(() => {
            if(window.Plotly) {
                clearInterval(check);
                draw();
            }
        }, 100);
    </script>
</body>
</html>`;
  },

  /**
   * 指数分布可视化模板
   */
  exponential_distribution: (params = {}) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.staticfile.org/plotly.js/2.26.0/plotly.min.js"></script>
    <style>
        body { margin: 0; padding: 15px; font-family: -apple-system, sans-serif; background: #f8f9fa; }
        .container { max-width: 100%; margin: 0 auto; }
        .control-panel { 
            background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 15px;
        }
        .control-group { margin-bottom: 10px; }
        .control-group label { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 5px; }
        .control-group input[type="range"] { width: 100%; }
        .plot-container { 
            background: white; border-radius: 8px; padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 400px; width: 100%; position: relative;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="control-panel">
            <div class="control-group">
                <label>率参数 (λ): <span id="lambda-val">${params.lambda || 1}</span></label>
                <input type="range" id="lambda" min="0.1" max="5" step="0.1" value="${params.lambda || 1}">
            </div>
        </div>
        <div id="plot" class="plot-container"></div>
    </div>
    <script>
        function init() {
            const input = document.getElementById('lambda');
            const valDisplay = document.getElementById('lambda-val');
            
            function draw() {
                const lambda = parseFloat(input.value);
                valDisplay.textContent = lambda;
                
                const x = [], y = [];
                // Generate points
                for(let i=0; i<500; i++) {
                    const val = i/100;
                    x.push(val);
                    y.push(lambda * Math.exp(-lambda * val));
                }
                
                const trace = {
                    x: x, y: y, 
                    type: 'scatter', 
                    mode: 'lines',
                    fill: 'tozeroy', 
                    line: {color: '#48bb78', width: 3},
                    name: \`Exp(\${lambda})\`
                };
                
                const layout = {
                    title: \`指数分布 PDF (λ=\${lambda})\`,
                    margin: {t:40, b:30, l:40, r:20},
                    xaxis: { title: 'x' },
                    yaxis: { title: 'Probability Density' }
                };
                
                const config = { responsive: true, displayModeBar: false };
                
                Plotly.newPlot('plot', [trace], layout, config);
            }
            
            input.addEventListener('input', draw);
            draw();
        }

        function checkPlotly() {
            if (typeof Plotly === 'undefined') {
                setTimeout(checkPlotly, 100);
            } else {
                init();
            }
        }
        checkPlotly();
    </script>
</body>
</html>`;
  }

};
