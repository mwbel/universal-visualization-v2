#!/usr/bin/env python3
"""
MockEngine模板数据迁移脚本
将现有的MockEngine策略数据导入到新的数据库系统中
"""

import sys
import os
import json
import hashlib
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_database
from models.visualization_models import VisualizationTemplate, KeywordIndex

def generate_template_id(name: str) -> str:
    """生成模板ID"""
    return hashlib.md5(f"template_{name}".encode()).hexdigest()[:16]

def extract_mock_engine_strategies():
    """提取MockEngine策略定义"""
    strategies = {
        # 数学类模板
        "math_function_graph": {
            "name": "函数图像生成器",
            "description": "根据数学函数表达式生成交互式函数图像，支持多种函数类型和参数调整",
            "category": "函数图像",
            "subject": "数学",
            "difficulty_level": "intermediate",
            "keywords": ["函数", "图像", "坐标", "参数", "图形", "数学", "可视化"],
            "template_content": """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>函数图像生成器</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .controls { margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
        .control-group { margin-bottom: 10px; }
        label { display: inline-block; min-width: 100px; }
        input[type="text"], input[type="number"], select { width: 200px; padding: 5px; }
        button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        #plot { width: 100%; height: 500px; }
    </style>
</head>
<body>
    <h1>函数图像生成器</h1>

    <div class="controls">
        <div class="control-group">
            <label>函数表达式:</label>
            <input type="text" id="function" value="x^2" placeholder="例如: x^2, sin(x), log(x)">
        </div>
        <div class="control-group">
            <label>X轴范围:</label>
            <input type="number" id="xMin" value="-10" step="1">
            到 <input type="number" id="xMax" value="10" step="1">
        </div>
        <div class="control-group">
            <label>图像类型:</label>
            <select id="plotType">
                <option value="scatter">散点图</option>
                <option value="line">线图</option>
            </select>
        </div>
        <div class="control-group">
            <button onclick="generatePlot()">生成图像</button>
            <button onclick="addFunction()">添加函数</button>
            <button onclick="clearPlot()">清除图像</button>
        </div>
    </div>

    <div id="plot"></div>

    <script>
        let functions = [];

        function evaluateFunction(expression, x) {
            try {
                // 简单的数学表达式解析器
                let expr = expression.toLowerCase()
                    .replace(/sin/g, 'Math.sin')
                    .replace(/cos/g, 'Math.cos')
                    .replace(/tan/g, 'Math.tan')
                    .replace(/log/g, 'Math.log')
                    .replace(/ln/g, 'Math.log')
                    .replace(/sqrt/g, 'Math.sqrt')
                    .replace(/abs/g, 'Math.abs')
                    .replace(/\^/g, '**')
                    .replace(/x/g, '(' + x + ')');

                return eval(expr);
            } catch (e) {
                return NaN;
            }
        }

        function generatePlot() {
            const xMin = parseFloat(document.getElementById('xMin').value);
            const xMax = parseFloat(document.getElementById('xMax').value);
            const plotType = document.getElementById('plotType').value;

            if (functions.length === 0) {
                addFunction();
            }

            const traces = functions.map((func, index) => {
                const xValues = [];
                const yValues = [];

                for (let x = xMin; x <= xMax; x += 0.1) {
                    xValues.push(x);
                    yValues.push(evaluateFunction(func.expression, x));
                }

                return {
                    x: xValues,
                    y: yValues,
                    type: plotType,
                    mode: plotType === 'scatter' ? 'markers' : 'lines',
                    name: func.expression,
                    line: { color: func.color }
                };
            });

            const layout = {
                title: '函数图像',
                xaxis: { title: 'X轴' },
                yaxis: { title: 'Y轴' },
                hovermode: 'closest'
            };

            Plotly.newPlot('plot', traces, layout);
        }

        function addFunction() {
            const expression = document.getElementById('function').value;
            const colors = ['#007bff', '#dc3545', '#28a745', '#ffc107', '#6f42c1'];

            functions.push({
                expression: expression,
                color: colors[functions.length % colors.length]
            });

            generatePlot();
        }

        function clearPlot() {
            functions = [];
            Plotly.purge('plot');
        }

        // 初始化图像
        generatePlot();
    </script>
</body>
</html>
            """,
            "parameters_schema": {
                "type": "object",
                "properties": {
                    "function": {"type": "string", "description": "数学函数表达式"},
                    "xMin": {"type": "number", "default": -10, "description": "X轴最小值"},
                    "xMax": {"type": "number", "default": 10, "description": "X轴最大值"},
                    "plotType": {"type": "string", "enum": ["scatter", "line"], "default": "line"}
                },
                "required": ["function"]
            },
            "examples": [
                {
                    "name": "二次函数",
                    "parameters": {"function": "x^2", "xMin": -5, "xMax": 5}
                },
                {
                    "name": "三角函数",
                    "parameters": {"function": "sin(x)", "xMin": -6.28, "xMax": 6.28}
                }
            ]
        },

        # 物理类模板
        "physics_wave_simulation": {
            "name": "波动现象模拟器",
            "description": "模拟各种波动现象，包括机械波、电磁波等，支持波长、频率、振幅等参数调整",
            "category": "波动模拟",
            "subject": "物理",
            "difficulty_level": "intermediate",
            "keywords": ["波动", "频率", "波长", "振幅", "机械波", "电磁波", "物理"],
            "template_content": """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>波动现象模拟器</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .controls { margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
        .control-group { margin-bottom: 10px; }
        label { display: inline-block; min-width: 120px; }
        input[type="range"] { width: 200px; }
        .value-display { display: inline-block; min-width: 50px; }
        button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px; }
        #wavePlot { width: 100%; height: 400px; }
        .info { margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>波动现象模拟器</h1>

    <div class="controls">
        <div class="control-group">
            <label>波动类型:</label>
            <select id="waveType">
                <option value="sine">正弦波</option>
                <option value="square">方波</option>
                <option value="triangle">三角波</option>
                <option value="sawtooth">锯齿波</option>
            </select>
        </div>
        <div class="control-group">
            <label>振幅 (A):</label>
            <input type="range" id="amplitude" min="0.1" max="2" step="0.1" value="1">
            <span class="value-display" id="amplitudeValue">1.0</span>
        </div>
        <div class="control-group">
            <label>频率 (f):</label>
            <input type="range" id="frequency" min="0.5" max="5" step="0.1" value="1">
            <span class="value-display" id="frequencyValue">1.0 Hz</span>
        </div>
        <div class="control-group">
            <label>波长 (λ):</label>
            <input type="range" id="wavelength" min="0.5" max="5" step="0.1" value="2">
            <span class="value-display" id="wavelengthValue">2.0 m</span>
        </div>
        <div class="control-group">
            <label>相位 (φ):</label>
            <input type="range" id="phase" min="0" max="6.28" step="0.1" value="0">
            <span class="value-display" id="phaseValue">0.0 rad</span>
        </div>
        <div class="control-group">
            <button onclick="startAnimation()">开始动画</button>
            <button onclick="stopAnimation()">停止动画</button>
            <button onclick="resetWave()">重置</button>
        </div>
    </div>

    <div id="wavePlot"></div>

    <div class="info">
        <h3>波动参数说明:</h3>
        <p><strong>振幅 (A):</strong> 波动的最大位移</p>
        <p><strong>频率 (f):</strong> 单位时间内的波动次数</p>
        <p><strong>波长 (λ):</strong> 相邻两个波峰之间的距离</p>
        <p><strong>波速 (v):</strong> v = f × λ = <span id="waveSpeed">2.0</span> m/s</p>
    </div>

    <script>
        let animationId = null;
        let time = 0;

        function updateValueDisplays() {
            document.getElementById('amplitudeValue').textContent = document.getElementById('amplitude').value;
            document.getElementById('frequencyValue').textContent = document.getElementById('frequency').value + ' Hz';
            document.getElementById('wavelengthValue').textContent = document.getElementById('wavelength').value + ' m';
            document.getElementById('phaseValue').textContent = document.getElementById('phase').value + ' rad';

            const frequency = parseFloat(document.getElementById('frequency').value);
            const wavelength = parseFloat(document.getElementById('wavelength').value);
            document.getElementById('waveSpeed').textContent = (frequency * wavelength).toFixed(1);
        }

        function generateWaveform(x, t) {
            const amplitude = parseFloat(document.getElementById('amplitude').value);
            const frequency = parseFloat(document.getElementById('frequency').value);
            const wavelength = parseFloat(document.getElementById('wavelength').value);
            const phase = parseFloat(document.getElementById('phase').value);
            const waveType = document.getElementById('waveType').value;

            const k = 2 * Math.PI / wavelength; // 波数
            const omega = 2 * Math.PI * frequency; // 角频率

            switch (waveType) {
                case 'sine':
                    return amplitude * Math.sin(k * x - omega * t + phase);
                case 'square':
                    return amplitude * Math.sign(Math.sin(k * x - omega * t + phase));
                case 'triangle':
                    const period = wavelength;
                    const localPhase = ((x - frequency * wavelength * t + phase / k) % period + period) % period;
                    if (localPhase < period / 2) {
                        return amplitude * (4 * localPhase / period - 1);
                    } else {
                        return amplitude * (3 - 4 * localPhase / period);
                    }
                case 'sawtooth':
                    const sawPeriod = wavelength;
                    const sawPhase = ((x - frequency * wavelength * t + phase / k) % sawPeriod + sawPeriod) % sawPeriod;
                    return amplitude * (2 * sawPhase / sawPeriod - 1);
                default:
                    return 0;
            }
        }

        function updatePlot() {
            const xMin = 0;
            const xMax = 10;
            const numPoints = 200;

            const xValues = [];
            const yValues = [];

            for (let i = 0; i <= numPoints; i++) {
                const x = xMin + (xMax - xMin) * i / numPoints;
                xValues.push(x);
                yValues.push(generateWaveform(x, time));
            }

            const trace = {
                x: xValues,
                y: yValues,
                type: 'scatter',
                mode: 'lines',
                name: '波形',
                line: { color: '#007bff', width: 2 }
            };

            const layout = {
                title: `波动模拟 (t = ${time.toFixed(2)}s)`,
                xaxis: { title: '位置 (m)', range: [xMin, xMax] },
                yaxis: { title: '位移' },
                showlegend: false
            };

            Plotly.newPlot('wavePlot', [trace], layout);
        }

        function animate() {
            time += 0.05;
            updatePlot();
            animationId = requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (!animationId) {
                animate();
            }
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }

        function resetWave() {
            stopAnimation();
            time = 0;
            document.getElementById('amplitude').value = 1;
            document.getElementById('frequency').value = 1;
            document.getElementById('wavelength').value = 2;
            document.getElementById('phase').value = 0;
            updateValueDisplays();
            updatePlot();
        }

        // 事件监听器
        document.querySelectorAll('input[type="range"], select').forEach(element => {
            element.addEventListener('input', () => {
                updateValueDisplays();
                if (!animationId) {
                    updatePlot();
                }
            });
        });

        // 初始化
        updateValueDisplays();
        updatePlot();
    </script>
</body>
</html>
            """,
            "parameters_schema": {
                "type": "object",
                "properties": {
                    "waveType": {"type": "string", "enum": ["sine", "square", "triangle", "sawtooth"], "default": "sine"},
                    "amplitude": {"type": "number", "default": 1, "minimum": 0.1, "maximum": 2},
                    "frequency": {"type": "number", "default": 1, "minimum": 0.5, "maximum": 5},
                    "wavelength": {"type": "number", "default": 2, "minimum": 0.5, "maximum": 5},
                    "phase": {"type": "number", "default": 0, "minimum": 0, "maximum": 6.28}
                },
                "required": []
            },
            "examples": [
                {
                    "name": "标准正弦波",
                    "parameters": {"waveType": "sine", "amplitude": 1, "frequency": 1, "wavelength": 2}
                },
                {
                    "name": "高频方波",
                    "parameters": {"waveType": "square", "amplitude": 1.5, "frequency": 3, "wavelength": 1}
                }
            ]
        },

        # 化学类模板
        "chemistry_molecular_model": {
            "name": "分子结构3D模型",
            "description": "展示化学分子的三维结构，支持旋转、缩放和不同分子模型展示",
            "category": "分子结构",
            "subject": "化学",
            "difficulty_level": "advanced",
            "keywords": ["分子", "原子", "化学键", "3D模型", "结构", "化学"],
            "template_content": """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>分子结构3D模型</title>
    <script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .controls { margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
        .control-group { margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        label { min-width: 120px; }
        select, input[type="text"] { padding: 5px; min-width: 150px; }
        button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px; }
        #molContainer { width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 5px; }
        .info { margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 5px; }
        .preset-buttons { margin-top: 10px; }
        .preset-buttons button { margin-bottom: 5px; font-size: 12px; padding: 5px 10px; }
    </style>
</head>
<body>
    <h1>分子结构3D模型</h1>

    <div class="controls">
        <div class="control-group">
            <label>分子输入:</label>
            <input type="text" id="moleculeInput" placeholder="输入SMILES格式或选择预设分子" value="H2O">
            <button onclick="loadMolecule()">加载分子</button>
        </div>

        <div class="control-group">
            <label>显示模式:</label>
            <select id="displayStyle" onchange="updateDisplayStyle()">
                <option value="stick">球棍模型</option>
                <option value="sphere">空间填充模型</option>
                <option value="line">线状模型</option>
                <option value="cartoon">卡通模型</option>
            </select>
        </div>

        <div class="control-group">
            <label>颜色方案:</label>
            <select id="colorScheme" onchange="updateColorScheme()">
                <option value="Jmol">Jmol标准</option>
                <option value="default">默认</option>
                <option value="greenCarbon">绿色碳</option>
                <option value="cyan">青色</option>
                <option value="grey">灰色</option>
            </select>
        </div>

        <div class="control-group">
            <button onclick="resetView()">重置视角</button>
            <button onclick="toggleRotation()">切换旋转</button>
            <button onclick="addSurface()">添加表面</button>
            <button onclick="clearSurface()">清除表面</button>
        </div>
    </div>

    <div class="preset-buttons">
        <strong>预设分子:</strong>
        <button onclick="loadPreset('H2O')">水 (H2O)</button>
        <button onclick="loadPreset('CH4')">甲烷 (CH4)</button>
        <button onclick="loadPreset('C6H6')">苯 (C6H6)</button>
        <button onclick="loadPreset('C2H5OH')">乙醇 (C2H5OH)</button>
        <button onclick="loadPreset('NH3')">氨 (NH3)</button>
        <button onclick="loadPreset('CO2')">二氧化碳 (CO2)</button>
        <button onclick="loadPreset('NaCl')">氯化钠 (NaCl)</button>
        <button onclick="loadPreset('CC(=O)OC1=CC=CC=C1C(=O)O')">阿司匹林</button>
    </div>

    <div id="molContainer"></div>

    <div class="info">
        <h3>使用说明:</h3>
        <p><strong>SMILES格式:</strong> 简化的分子线性输入规范，例如：H2O, CH4, C6H6</p>
        <p><strong>鼠标操作:</strong> 左键拖动旋转，右键拖动平移，滚轮缩放</p>
        <p><strong>显示模式:</strong> 球棍模型适合观察化学键，空间填充模型适合观察分子体积</p>
        <div id="moleculeInfo" style="margin-top: 10px;"></div>
    </div>

    <script>
        let viewer = null;
        let isRotating = false;
        let rotationInterval = null;

        function initViewer() {
            viewer = $3Dmol.createViewer("molContainer", {
                backgroundColor: "white",
                antialias: true,
                quality: "high"
            });
        }

        function loadMolecule() {
            const moleculeInput = document.getElementById('moleculeInput').value.trim();
            if (!moleculeInput) {
                alert('请输入分子结构');
                return;
            }

            // 清除之前的分子
            viewer.clear();

            // 尝试作为SMILES加载
            try {
                // 检查是否为SMILES格式（简单的启发式检查）
                if ( /^[A-Za-z0-9()=\[\]#@+\-.]+$/.test(moleculeInput) ) {
                    // 可能是SMILES，尝试添加氢原子并生成3D坐标
                    const mol = $3Dmol.buildMolecules([moleculeInput])[0];
                    if (mol) {
                        viewer.addModel(mol, "mol");
                        viewer.setStyle({});
                        viewer.zoomTo();
                        viewer.render();
                        updateMoleculeInfo(moleculeInput);
                        return;
                    }
                }
            } catch (e) {
                console.log('SMILES解析失败，尝试其他格式');
            }

            // 如果SMILES失败，尝试作为PDB加载
            try {
                viewer.addModel(moleculeInput, "pdb");
                viewer.setStyle({});
                viewer.zoomTo();
                viewer.render();
                updateMoleculeInfo(moleculeInput);
                return;
            } catch (e) {
                console.log('PDB解析失败');
            }

            // 如果都失败，显示错误
            alert('无法解析分子结构，请检查输入格式');
        }

        function loadPreset(smiles) {
            document.getElementById('moleculeInput').value = smiles;
            loadMolecule();
        }

        function updateDisplayStyle() {
            if (!viewer) return;

            const style = document.getElementById('displayStyle').value;
            const colorScheme = document.getElementById('colorScheme').value;

            let styleSpec = {};

            switch (style) {
                case 'stick':
                    styleSpec = { stick: { colorscheme: colorScheme } };
                    break;
                case 'sphere':
                    styleSpec = { sphere: { colorscheme: colorScheme, scale: 0.8 } };
                    break;
                case 'line':
                    styleSpec = { line: { colorscheme: colorScheme } };
                    break;
                case 'cartoon':
                    styleSpec = { cartoon: { colorscheme: colorScheme } };
                    break;
            }

            viewer.setStyle({}, styleSpec);
            viewer.render();
        }

        function updateColorScheme() {
            updateDisplayStyle();
        }

        function resetView() {
            if (viewer) {
                viewer.zoomTo();
                viewer.render();
            }
        }

        function toggleRotation() {
            isRotating = !isRotating;

            if (isRotating) {
                rotationInterval = setInterval(() => {
                    if (viewer) {
                        viewer.rotate(2, 'y');
                        viewer.render();
                    }
                }, 50);
            } else {
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                }
            }
        }

        function addSurface() {
            if (viewer) {
                viewer.addSurface($3Dmol.SurfaceType.VDW, {
                    opacity: 0.7,
                    color: "white"
                }, {});
                viewer.render();
            }
        }

        function clearSurface() {
            if (viewer) {
                viewer.removeAllSurfaces();
                viewer.render();
            }
        }

        function updateMoleculeInfo(input) {
            const infoDiv = document.getElementById('moleculeInfo');

            // 简单的分子信息计算
            const atoms = (input.match(/[A-Z][a-z]?/g) || []).length;
            const bonds = input.split('').filter(char => '=#'.includes(char)).length;

            infoDiv.innerHTML = `
                <p><strong>当前分子:</strong> ${input}</p>
                <p><strong>原子数:</strong> 约 ${atoms}</p>
                <p><strong>化学键数:</strong> 约 ${atoms + bonds - 1}</p>
            `;
        }

        // 初始化
        window.onload = function() {
            initViewer();
            // 加载默认分子（水）
            loadMolecule();
        };

        // 清理
        window.onbeforeunload = function() {
            if (rotationInterval) {
                clearInterval(rotationInterval);
            }
        };
    </script>
</body>
</html>
            """,
            "parameters_schema": {
                "type": "object",
                "properties": {
                    "molecule": {"type": "string", "description": "分子SMILES格式或PDB格式"},
                    "displayStyle": {"type": "string", "enum": ["stick", "sphere", "line", "cartoon"], "default": "stick"},
                    "colorScheme": {"type": "string", "enum": ["Jmol", "default", "greenCarbon", "cyan", "grey"], "default": "Jmol"},
                    "autoRotate": {"type": "boolean", "default": False}
                },
                "required": ["molecule"]
            },
            "examples": [
                {
                    "name": "水分子",
                    "parameters": {"molecule": "H2O", "displayStyle": "stick"}
                },
                {
                    "name": "苯环",
                    "parameters": {"molecule": "C6H6", "displayStyle": "sphere", "autoRotate": True}
                }
            ]
        },

        # 天文学类模板
        "astronomy_solar_system": {
            "name": "太阳系运行模拟",
            "description": "模拟太阳系行星运行轨迹，支持时间控制和行星轨道参数调整",
            "category": "天体运行",
            "subject": "天文",
            "difficulty_level": "intermediate",
            "keywords": ["太阳系", "行星", "轨道", "天文", "宇宙", "模拟"],
            "template_content": """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>太阳系运行模拟</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; overflow: hidden; background: #000; }
        .controls { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 15px; border-radius: 5px; z-index: 100; }
        .control-group { margin-bottom: 10px; }
        label { display: inline-block; min-width: 100px; }
        input[type="range"], input[type="checkbox"] { vertical-align: middle; }
        .value-display { display: inline-block; min-width: 40px; text-align: right; }
        button { padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; }
        #info { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; max-width: 250px; }
        .planet-info { margin-bottom: 10px; font-size: 12px; }
        .planet-name { font-weight: bold; color: #ffcc00; }
        #canvas { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div class="controls">
        <h3>太阳系模拟控制</h3>
        <div class="control-group">
            <label>时间速度:</label>
            <input type="range" id="timeSpeed" min="0" max="10" step="0.1" value="1">
            <span class="value-display" id="timeSpeedValue">1.0x</span>
        </div>
        <div class="control-group">
            <label>显示轨道:</label>
            <input type="checkbox" id="showOrbits" checked>
        </div>
        <div class="control-group">
            <label>显示标签:</label>
            <input type="checkbox" id="showLabels" checked>
        </div>
        <div class="control-group">
            <label>显示网格:</label>
            <input type="checkbox" id="showGrid" checked>
        </div>
        <div class="control-group">
            <label>相机视角:</label>
            <select id="cameraView">
                <option value="top">俯视</option>
                <option value="side">侧视</option>
                <option value="angle">斜视</option>
            </select>
        </div>
        <div class="control-group">
            <button onclick="resetSimulation()">重置</button>
            <button onclick="togglePause()">暂停/继续</button>
        </div>
    </div>

    <div id="info">
        <h4>行星信息</h4>
        <div id="planetInfo"></div>
    </div>

    <div id="canvas"></div>

    <script>
        let scene, camera, renderer, controls;
        let planets = [];
        let isPaused = false;
        let timeSpeed = 1;
        let showOrbits = true;
        let showLabels = true;
        let sun, sunLight;

        // 行星数据（简化版）
        const planetData = [
            { name: '水星', radius: 0.4, distance: 10, speed: 4.74, color: 0x8C7853 },
            { name: '金星', radius: 0.9, distance: 15, speed: 3.5, color: 0xFFC649 },
            { name: '地球', radius: 1, distance: 20, speed: 2.98, color: 0x4169E1 },
            { name: '火星', radius: 0.5, distance: 25, speed: 2.41, color: 0xCD5C5C },
            { name: '木星', radius: 2.5, distance: 35, speed: 1.31, color: 0xDAA520 },
            { name: '土星', radius: 2, distance: 45, speed: 0.97, color: 0xF4A460 },
            { name: '天王星', radius: 1.5, distance: 55, speed: 0.68, color: 0x4FD0E0 },
            { name: '海王星', radius: 1.5, distance: 65, speed: 0.54, color: 0x4169E1 }
        ];

        function init() {
            // 创建场景
            scene = new THREE.Scene();

            // 创建相机
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(40, 40, 40);
            camera.lookAt(0, 0, 0);

            // 创建渲染器
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('canvas').appendChild(renderer.domElement);

            // 创建轨道控制器
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // 创建太阳
            createSun();

            // 创建行星
            createPlanets();

            // 创建网格
            createGrid();

            // 添加环境光
            const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
            scene.add(ambientLight);

            // 事件监听器
            setupEventListeners();

            // 开始动画
            animate();
        }

        function createSun() {
            const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                emissive: 0xFFFF00,
                emissiveIntensity: 1
            });
            sun = new THREE.Mesh(sunGeometry, sunMaterial);
            scene.add(sun);

            // 太阳光源
            sunLight = new THREE.PointLight(0xFFFFFF, 2, 100);
            sunLight.position.set(0, 0, 0);
            sunLight.castShadow = true;
            scene.add(sunLight);
        }

        function createPlanets() {
            planetData.forEach((data, index) => {
                // 创建行星
                const geometry = new THREE.SphereGeometry(data.radius, 16, 16);
                const material = new THREE.MeshPhongMaterial({
                    color: data.color,
                    shininess: 30
                });
                const planet = new THREE.Mesh(geometry, material);
                planet.castShadow = true;
                planet.receiveShadow = true;

                // 设置初始位置
                planet.position.x = data.distance;
                planet.userData = {
                    data: data,
                    angle: Math.random() * Math.PI * 2,
                    orbitRadius: data.distance,
                    orbitSpeed: data.speed * 0.01
                };

                scene.add(planet);
                planets.push(planet);

                // 创建轨道线
                createOrbit(data.distance);

                // 创建标签
                createLabel(planet, data.name);
            });
        }

        function createOrbit(radius) {
            const curve = new THREE.EllipseCurve(
                0, 0,
                radius, radius,
                0, 2 * Math.PI,
                false,
                0
            );

            const points = curve.getPoints(100);
            const geometry = new THREE.BufferGeometry().setFromPoints(
                points.map(p => new THREE.Vector3(p.x, 0, p.y))
            );

            const material = new THREE.LineBasicMaterial({
                color: 0x666666,
                opacity: 0.3,
                transparent: true
            });

            const orbit = new THREE.Line(geometry, material);
            orbit.userData.isOrbit = true;
            scene.add(orbit);
        }

        function createLabel(planet, text) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.font = '24px Arial';
            context.fillText(text, 10, 30);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(8, 2, 1);
            sprite.position.copy(planet.position);
            sprite.position.y += planet.geometry.parameters.radius + 3;
            sprite.userData.isLabel = true;
            sprite.userData.planet = planet;

            scene.add(sprite);
        }

        function createGrid() {
            const gridHelper = new THREE.GridHelper(80, 20, 0x444444, 0x222222);
            gridHelper.userData.isGrid = true;
            scene.add(gridHelper);
        }

        function setupEventListeners() {
            document.getElementById('timeSpeed').addEventListener('input', (e) => {
                timeSpeed = parseFloat(e.target.value);
                document.getElementById('timeSpeedValue').textContent = timeSpeed.toFixed(1) + 'x';
            });

            document.getElementById('showOrbits').addEventListener('change', (e) => {
                showOrbits = e.target.checked;
                scene.children.forEach(child => {
                    if (child.userData.isOrbit) {
                        child.visible = showOrbits;
                    }
                });
            });

            document.getElementById('showLabels').addEventListener('change', (e) => {
                showLabels = e.target.checked;
                scene.children.forEach(child => {
                    if (child.userData.isLabel) {
                        child.visible = showLabels;
                    }
                });
            });

            document.getElementById('showGrid').addEventListener('change', (e) => {
                scene.children.forEach(child => {
                    if (child.userData.isGrid) {
                        child.visible = e.target.checked;
                    }
                });
            });

            document.getElementById('cameraView').addEventListener('change', (e) => {
                switch(e.target.value) {
                    case 'top':
                        camera.position.set(0, 80, 0);
                        camera.lookAt(0, 0, 0);
                        break;
                    case 'side':
                        camera.position.set(80, 0, 0);
                        camera.lookAt(0, 0, 0);
                        break;
                    case 'angle':
                        camera.position.set(40, 40, 40);
                        camera.lookAt(0, 0, 0);
                        break;
                }
            });

            window.addEventListener('resize', onWindowResize);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);

            if (!isPaused) {
                // 更新行星位置
                planets.forEach(planet => {
                    const userData = planet.userData;
                    userData.angle += userData.orbitSpeed * timeSpeed;

                    planet.position.x = Math.cos(userData.angle) * userData.orbitRadius;
                    planet.position.z = Math.sin(userData.angle) * userData.orbitRadius;

                    // 行星自转
                    planet.rotation.y += 0.01 * timeSpeed;

                    // 更新标签位置
                    scene.children.forEach(child => {
                        if (child.userData.isLabel && child.userData.planet === planet) {
                            child.position.copy(planet.position);
                            child.position.y += planet.geometry.parameters.radius + 3;
                        }
                    });
                });

                // 太阳自转
                sun.rotation.y += 0.005 * timeSpeed;

                updatePlanetInfo();
            }

            controls.update();
            renderer.render(scene, camera);
        }

        function updatePlanetInfo() {
            const infoDiv = document.getElementById('planetInfo');
            let html = '';

            // 查找最近的行星
            let closestPlanet = null;
            let minDistance = Infinity;

            planets.forEach(planet => {
                const distance = camera.position.distanceTo(planet.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlanet = planet;
                }
            });

            if (closestPlanet) {
                const data = closestPlanet.userData.data;
                html += `
                    <div class="planet-info">
                        <div class="planet-name">${data.name}</div>
                        <div>半径: ${data.radius} (地球半径)</div>
                        <div>轨道距离: ${data.distance} AU</div>
                        <div>公转速度: ${data.speed} km/s</div>
                    </div>
                `;
            }

            infoDiv.innerHTML = html;
        }

        function resetSimulation() {
            planets.forEach((planet, index) => {
                planet.userData.angle = Math.random() * Math.PI * 2;
            });
            timeSpeed = 1;
            document.getElementById('timeSpeed').value = 1;
            document.getElementById('timeSpeedValue').textContent = '1.0x';
        }

        function togglePause() {
            isPaused = !isPaused;
        }

        // 初始化（需要OrbitControls库）
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
        } else {
            // 简化版OrbitControls
            THREE.OrbitControls = function(camera, domElement) {
                this.camera = camera;
                this.domElement = domElement;
                this.enableDamping = true;
                this.dampingFactor = 0.05;

                let mouseDown = false;
                let mouseX = 0, mouseY = 0;
                let targetX = 0, targetY = 0;
                let targetDistance = 60;

                this.domElement.addEventListener('mousedown', (e) => {
                    mouseDown = true;
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                });

                this.domElement.addEventListener('mousemove', (e) => {
                    if (mouseDown) {
                        const deltaX = e.clientX - mouseX;
                        const deltaY = e.clientY - mouseY;

                        targetX += deltaX * 0.01;
                        targetY += deltaY * 0.01;

                        mouseX = e.clientX;
                        mouseY = e.clientY;
                    }
                });

                this.domElement.addEventListener('mouseup', () => {
                    mouseDown = false;
                });

                this.domElement.addEventListener('wheel', (e) => {
                    targetDistance += e.deltaY * 0.1;
                    targetDistance = Math.max(10, Math.min(100, targetDistance));
                });

                this.update = () => {
                    const x = targetDistance * Math.cos(targetY) * Math.sin(targetX);
                    const y = targetDistance * Math.sin(targetY);
                    const z = targetDistance * Math.cos(targetY) * Math.cos(targetX);

                    this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
                    this.camera.lookAt(0, 0, 0);
                };
            };

            init();
        }
    </script>
</body>
</html>
            """,
            "parameters_schema": {
                "type": "object",
                "properties": {
                    "timeSpeed": {"type": "number", "default": 1, "minimum": 0, "maximum": 10},
                    "showOrbits": {"type": "boolean", "default": True},
                    "showLabels": {"type": "boolean", "default": True},
                    "showGrid": {"type": "boolean", "default": True},
                    "cameraView": {"type": "string", "enum": ["top", "side", "angle"], "default": "angle"}
                },
                "required": []
            },
            "examples": [
                {
                    "name": "标准太阳系",
                    "parameters": {"timeSpeed": 1, "showOrbits": True, "showLabels": True}
                },
                {
                    "name": "快速运行",
                    "parameters": {"timeSpeed": 5, "cameraView": "top"}
                }
            ]
        },

        # 生物类模板
        "biology_cell_structure": {
            "name": "细胞结构图解",
            "description": "展示生物细胞的结构组成，包括植物细胞和动物细胞的对比",
            "category": "细胞结构",
            "subject": "生物",
            "difficulty_level": "intermediate",
            "keywords": ["细胞", "细胞器", "植物细胞", "动物细胞", "生物", "结构"],
            "template_content": """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>细胞结构图解</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.0.0/d3.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { text-align: center; margin-bottom: 20px; }
        .controls { background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .control-group { margin-bottom: 10px; display: flex; align-items: center; gap: 15px; }
        label { min-width: 100px; }
        select, button { padding: 5px 10px; }
        button { background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        .container { display: flex; gap: 20px; }
        .cell-container { flex: 1; background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .cell-header { background: #007bff; color: white; padding: 10px; border-radius: 5px 5px 0 0; font-weight: bold; }
        #plantCell, #animalCell { height: 500px; }
        .info-panel { background: white; padding: 15px; border-radius: 5px; margin-top: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .organelle-info { margin-top: 10px; }
        .organelle-name { font-weight: bold; color: #007bff; font-size: 16px; }
        .organelle-desc { margin-top: 5px; color: #666; }
        .legend { margin-top: 15px; }
        .legend-item { display: flex; align-items: center; margin-bottom: 5px; }
        .legend-color { width: 20px; height: 20px; border-radius: 3px; margin-right: 10px; border: 1px solid #ccc; }
        .tooltip { position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 3px; font-size: 12px; pointer-events: none; opacity: 0; transition: opacity 0.3s; }
    </style>
</head>
<body>
    <div class="header">
        <h1>细胞结构图解</h1>
        <p>交互式学习动植物细胞的结构组成和功能差异</p>
    </div>

    <div class="controls">
        <div class="control-group">
            <label>显示模式:</label>
            <select id="displayMode">
                <option value="structure">结构图</option>
                <option value="labeled">标注图</option>
                <option value="compare">对比模式</option>
            </select>
        </div>
        <div class="control-group">
            <label>详细程度:</label>
            <select id="detailLevel">
                <option value="basic">基础</option>
                <option value="detailed">详细</option>
                <option value="advanced">高级</option>
            </select>
        </div>
        <div class="control-group">
            <button onclick="resetView()">重置视图</button>
            <button onclick="toggleAnimation()">动画效果</button>
            <button onclick="showComparison()">显示对比</button>
        </div>
    </div>

    <div class="container">
        <div class="cell-container">
            <div class="cell-header">植物细胞</div>
            <div id="plantCell"></div>
        </div>
        <div class="cell-container">
            <div class="cell-header">动物细胞</div>
            <div id="animalCell"></div>
        </div>
    </div>

    <div class="info-panel">
        <h3>细胞器功能说明</h3>
        <div id="organelleInfo" class="organelle-info">
            <div class="organelle-name">点击细胞器查看详细信息</div>
            <div class="organelle-desc">将鼠标悬停在细胞器上可以高亮显示，点击查看功能说明</div>
        </div>

        <div class="legend">
            <h4>图例:</h4>
            <div id="legend"></div>
        </div>
    </div>

    <div class="tooltip" id="tooltip"></div>

    <script>
        // 细胞器定义
        const organelles = {
            nucleus: {
                name: '细胞核',
                color: '#FF6B6B',
                description: '细胞的控制中心，含有遗传物质DNA，控制细胞的生长、代谢和繁殖。',
                plant: True,
                animal: True,
                detailed: True
            },
            mitochondria: {
                name: '线粒体',
                color: '#4ECDC4',
                description: '细胞的动力工厂，通过细胞呼吸产生ATP，为细胞活动提供能量。',
                plant: True,
                animal: True,
                detailed: True
            },
            chloroplast: {
                name: '叶绿体',
                color: '#45B7D1',
                description: '植物细胞特有的细胞器，含有叶绿素，进行光合作用制造有机物。',
                plant: true,
                animal: False,
                detailed: True
            },
            cellWall: {
                name: '细胞壁',
                color: '#96CEB4',
                description: '植物细胞特有的结构，由纤维素构成，提供支持和保护作用。',
                plant: true,
                animal: False,
                basic: true
            },
            vacuole: {
                name: '液泡',
                color: '#FFEAA7',
                description: '储存水分、营养物质和废物，维持细胞的渗透压。植物细胞中有大液泡。',
                plant: True,
                animal: True,
                basic: true
            },
            cellMembrane: {
                name: '细胞膜',
                color: '#DDA0DD',
                description: '控制物质进出细胞的边界，具有选择透过性。',
                plant: True,
                animal: True,
                basic: true
            },
            cytoplasm: {
                name: '细胞质',
                color: '#F0F8FF',
                description: '细胞核以外的透明胶状物质，包含各种细胞器和细胞液。',
                plant: True,
                animal: True,
                basic: true
            },
            endoplasmicReticulum: {
                name: '内质网',
                color: '#FFB6C1',
                description: '合成蛋白质和脂质的场所，分为粗面内质网和滑面内质网。',
                plant: True,
                animal: True,
                detailed: True,
                advanced: true
            },
            golgiApparatus: {
                name: '高尔基体',
                color: '#98D8C8',
                description: '加工、分类和包装蛋白质及脂质的细胞器，参与分泌活动。',
                plant: True,
                animal: True,
                detailed: True,
                advanced: true
            },
            ribosome: {
                name: '核糖体',
                color: '#F7DC6F',
                description: '合成蛋白质的场所，由rRNA和蛋白质组成。',
                plant: True,
                animal: True,
                detailed: True,
                advanced: true
            }
        };

        let currentDetailLevel = 'basic';
        let isAnimating = false;
        let selectedOrganelle = null;

        function initCellVisualization() {
            createPlantCell();
            createAnimalCell();
            createLegend();
            updateDisplayMode();
        }

        function createPlantCell() {
            const svg = d3.select('#plantCell');
            const width = 400;
            const height = 400;

            svg.attr('width', width).attr('height', height);

            // 清除之前的内容
            svg.selectAll('*').remove();

            // 创建细胞主体
            svg.append('rect')
                .attr('x', 50)
                .attr('y', 50)
                .attr('width', 300)
                .attr('height', 300)
                .attr('rx', 20)
                .attr('fill', organelles.cytoplasm.color)
                .attr('stroke', '#ccc')
                .attr('stroke-width', 2);

            // 细胞壁
            svg.append('rect')
                .attr('x', 40)
                .attr('y', 40)
                .attr('width', 320)
                .attr('height', 320)
                .attr('rx', 25)
                .attr('fill', 'none')
                .attr('stroke', organelles.cellWall.color)
                .attr('stroke-width', 8);

            // 细胞膜
            svg.append('rect')
                .attr('x', 52)
                .attr('y', 52)
                .attr('width', 296)
                .attr('height', 296)
                .attr('rx', 18)
                .attr('fill', 'none')
                .attr('stroke', organelles.cellMembrane.color)
                .attr('stroke-width', 3);

            // 细胞核
            svg.append('circle')
                .attr('cx', 200)
                .attr('cy', 200)
                .attr('r', 40)
                .attr('fill', organelles.nucleus.color)
                .attr('stroke', '#333')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('click', () => showOrganelleInfo('nucleus'))
                .on('mouseover', function() { highlightOrganelle(this); })
                .on('mouseout', function() { unhighlightOrganelle(this); });

            // 大液泡
            svg.append('ellipse')
                .attr('cx', 120)
                .attr('cy', 280)
                .attr('rx', 60)
                .attr('ry', 40)
                .attr('fill', organelles.vacuole.color)
                .attr('stroke', '#ccc')
                .attr('stroke-width', 1)
                .style('cursor', 'pointer')
                .on('click', () => showOrganelleInfo('vacuole'))
                .on('mouseover', function() { highlightOrganelle(this); })
                .on('mouseout', function() { unhighlightOrganelle(this); });

            // 叶绿体
            const chloroplastPositions = [
                [150, 120], [250, 120], [100, 200], [300, 200]
            ];

            chloroplastPositions.forEach(pos => {
                svg.append('ellipse')
                    .attr('cx', pos[0])
                    .attr('cy', pos[1])
                    .attr('rx', 25)
                    .attr('ry', 15)
                    .attr('fill', organelles.chloroplast.color)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('chloroplast'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            });

            // 线粒体
            const mitochondriaPositions = [
                [280, 280], [150, 300]
            ];

            mitochondriaPositions.forEach(pos => {
                svg.append('ellipse')
                    .attr('cx', pos[0])
                    .attr('cy', pos[1])
                    .attr('rx', 20)
                    .attr('ry', 12)
                    .attr('fill', organelles.mitochondria.color)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('mitochondria'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            });

            // 添加详细结构的细胞器
            if (currentDetailLevel === 'detailed' || currentDetailLevel === 'advanced') {
                addDetailedOrganelles(svg, true);
            }
        }

        function createAnimalCell() {
            const svg = d3.select('#animalCell');
            const width = 400;
            const height = 400;

            svg.attr('width', width).attr('height', height);

            // 清除之前的内容
            svg.selectAll('*').remove();

            // 创建细胞主体（圆形）
            svg.append('circle')
                .attr('cx', 200)
                .attr('cy', 200)
                .attr('r', 150)
                .attr('fill', organelles.cytoplasm.color)
                .attr('stroke', '#ccc')
                .attr('stroke-width', 2);

            // 细胞膜
            svg.append('circle')
                .attr('cx', 200)
                .attr('cy', 200)
                .attr('r', 148)
                .attr('fill', 'none')
                .attr('stroke', organelles.cellMembrane.color)
                .attr('stroke-width', 3);

            // 细胞核
            svg.append('circle')
                .attr('cx', 200)
                .attr('cy', 180)
                .attr('r', 35)
                .attr('fill', organelles.nucleus.color)
                .attr('stroke', '#333')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('click', () => showOrganelleInfo('nucleus'))
                .on('mouseover', function() { highlightOrganelle(this); })
                .on('mouseout', function() { unhighlightOrganelle(this); });

            // 小液泡
            const vacuolePositions = [
                [150, 250], [250, 260], [180, 300]
            ];

            vacuolePositions.forEach(pos => {
                svg.append('circle')
                    .attr('cx', pos[0])
                    .attr('cy', pos[1])
                    .attr('r', 12)
                    .attr('fill', organelles.vacuole.color)
                    .attr('stroke', '#ccc')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('vacuole'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            });

            // 线粒体
            const mitochondriaPositions = [
                [120, 140], [280, 160], [150, 200], [270, 240], [200, 280]
            ];

            mitochondriaPositions.forEach(pos => {
                svg.append('ellipse')
                    .attr('cx', pos[0])
                    .attr('cy', pos[1])
                    .attr('rx', 18)
                    .attr('ry', 10)
                    .attr('fill', organelles.mitochondria.color)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('mitochondria'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            });

            // 添加详细结构的细胞器
            if (currentDetailLevel === 'detailed' || currentDetailLevel === 'advanced') {
                addDetailedOrganelles(svg, false);
            }
        }

        function addDetailedOrganelles(svg, isPlant) {
            // 内质网
            if (organelles.endoplasmicReticulum[currentDetailLevel]) {
                svg.append('path')
                    .attr('d', 'M 150 150 Q 200 120, 250 150 T 150 150')
                    .attr('fill', 'none')
                    .attr('stroke', organelles.endoplasmicReticulum.color)
                    .attr('stroke-width', 8)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('endoplasmicReticulum'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            }

            // 高尔基体
            if (organelles.golgiApparatus[currentDetailLevel]) {
                svg.append('g')
                    .attr('transform', 'translate(100, 250)')
                    .append('path')
                    .attr('d', 'M 0 0 Q 20 -10, 40 0 Q 20 10, 0 0')
                    .attr('fill', organelles.golgiApparatus.color)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('click', () => showOrganelleInfo('golgiApparatus'))
                    .on('mouseover', function() { highlightOrganelle(this); })
                    .on('mouseout', function() { unhighlightOrganelle(this); });
            }

            // 核糖体
            if (organelles.ribosome[currentDetailLevel]) {
                for (let i = 0; i < 10; i++) {
                    const x = 120 + Math.random() * 160;
                    const y = 120 + Math.random() * 160;
                    svg.append('circle')
                        .attr('cx', x)
                        .attr('cy', y)
                        .attr('r', 3)
                        .attr('fill', organelles.ribosome.color)
                        .style('cursor', 'pointer')
                        .on('click', () => showOrganelleInfo('ribosome'))
                        .on('mouseover', function() { highlightOrganelle(this); })
                        .on('mouseout', function() { unhighlightOrganelle(this); });
                }
            }
        }

        function createLegend() {
            const legend = d3.select('#legend');
            legend.selectAll('*').remove();

            Object.entries(organelles).forEach(([key, organelle]) => {
                if (organelle[currentDetailLevel] || organelle.basic) {
                    const item = legend.append('div')
                        .attr('class', 'legend-item');

                    item.append('div')
                        .attr('class', 'legend-color')
                        .style('background-color', organelle.color);

                    item.append('span')
                        .text(organelle.name);
                }
            });
        }

        function highlightOrganelle(element) {
            d3.select(element)
                .transition()
                .duration(200)
                .attr('stroke-width', 4)
                .attr('stroke', '#FF6B6B');
        }

        function unhighlightOrganelle(element) {
            d3.select(element)
                .transition()
                .duration(200)
                .attr('stroke-width', 1)
                .attr('stroke', '#333');
        }

        function showOrganelleInfo(organelleKey) {
            const organelle = organelles[organelleKey];
            const infoDiv = document.getElementById('organelleInfo');

            infoDiv.innerHTML = `
                <div class="organelle-name">${organelle.name}</div>
                <div class="organelle-desc">${organelle.description}</div>
                <div style="margin-top: 10px; font-size: 14px;">
                    <strong>存在部位:</strong>
                    ${organelle.plant && organelle.animal ? '植物细胞和动物细胞' :
                      organelle.plant ? '仅植物细胞' : '仅动物细胞'}
                </div>
            `;

            selectedOrganelle = organelleKey;
        }

        function updateDisplayMode() {
            const mode = document.getElementById('displayMode').value;
            currentDetailLevel = document.getElementById('detailLevel').value;

            createPlantCell();
            createAnimalCell();
            createLegend();
        }

        function resetView() {
            selectedOrganelle = null;
            document.getElementById('organelleInfo').innerHTML = `
                <div class="organelle-name">点击细胞器查看详细信息</div>
                <div class="organelle-desc">将鼠标悬停在细胞器上可以高亮显示，点击查看功能说明</div>
            `;

            createPlantCell();
            createAnimalCell();
        }

        function toggleAnimation() {
            isAnimating = !isAnimating;
            if (isAnimating) {
                animateCells();
            }
        }

        function animateCells() {
            if (!isAnimating) return;

            // 简单的动画效果：让细胞器轻微移动
            d3.selectAll('#plantCell ellipse, #animalCell ellipse')
                .transition()
                .duration(2000)
                .attr('transform', `translate(${Math.random() * 4 - 2}, ${Math.random() * 4 - 2})`)
                .on('end', function() {
                    d3.select(this)
                        .transition()
                        .duration(2000)
                        .attr('transform', 'translate(0, 0)')
                        .on('end', animateCells);
                });
        }

        function showComparison() {
            // 创建一个对比表格
            const comparisonHtml = `
                <div style="background: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
                    <h3>动植物细胞对比</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f0f0f0;">
                            <th style="border: 1px solid #ccc; padding: 10px;">结构/细胞器</th>
                            <th style="border: 1px solid #ccc; padding: 10px;">植物细胞</th>
                            <th style="border: 1px solid #ccc; padding: 10px;">动物细胞</th>
                            <th style="border: 1px solid #ccc; padding: 10px;">主要功能</th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 10px;">细胞壁</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✗ 无</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">支持和保护</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 10px;">叶绿体</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✗ 无</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">光合作用</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 10px;">大液泡</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✗ 小液泡</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">储存和维持渗透压</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 10px;">细胞核</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">控制中心</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 10px;">线粒体</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">✓ 有</td>
                            <td style="border: 1px solid #ccc; padding: 10px;">能量供应</td>
                        </tr>
                    </table>
                </div>
            `;

            // 在页面中显示对比表格
            const comparisonDiv = document.createElement('div');
            comparisonDiv.innerHTML = comparisonHtml;
            document.querySelector('.info-panel').appendChild(comparisonDiv);
        }

        // 事件监听器
        document.getElementById('displayMode').addEventListener('change', updateDisplayMode);
        document.getElementById('detailLevel').addEventListener('change', updateDisplayMode);

        // 初始化
        initCellVisualization();
    </script>
</body>
</html>
            """,
            "parameters_schema": {
                "type": "object",
                "properties": {
                    "displayMode": {"type": "string", "enum": ["structure", "labeled", "compare"], "default": "structure"},
                    "detailLevel": {"type": "string", "enum": ["basic", "detailed", "advanced"], "default": "basic"},
                    "animation": {"type": "boolean", "default": False}
                },
                "required": []
            },
            "examples": [
                {
                    "name": "基础结构",
                    "parameters": {"displayMode": "structure", "detailLevel": "basic"}
                },
                {
                    "name": "详细标注",
                    "parameters": {"displayMode": "labeled", "detailLevel": "detailed"}
                }
            ]
        }
    };

    return strategies;

def migrate_mock_data_to_db():
    """将MockEngine数据迁移到数据库"""

    # 确保数据库已初始化
    print("初始化数据库...")
    if not init_database():
        raise Exception("数据库初始化失败")

    print("提取策略数据...")
    try:
        # 提取策略数据
        strategies = extract_mock_engine_strategies()
        print("策略数据提取成功")
    except Exception as e:
        print(f"策略数据提取失败: {e}")
        import traceback
        traceback.print_exc()
        raise

    print(f"开始迁移 {len(strategies)} 个模板...")

    # 迁移每个策略
    db = SessionLocal()
    try:
        for strategy_key, strategy_data in strategies.items():
            template_id = generate_template_id(strategy_key)

            # 检查模板是否已存在
            existing_template = db.query(VisualizationTemplate).filter_by(id=template_id).first()
            if existing_template:
                print(f"模板 {template_id} 已存在，跳过")
                continue

            # 创建模板记录
            template = VisualizationTemplate(
                id=template_id,
                name=strategy_data["name"],
                description=strategy_data["description"],
                category=strategy_data["category"],
                subject=strategy_data["subject"],
                difficulty_level=strategy_data["difficulty_level"],
                keywords=",".join(strategy_data["keywords"]),
                template_content=strategy_data["template_content"],
                parameters_schema=strategy_data["parameters_schema"],
                examples=strategy_data["examples"],
                is_system_template=True,
                is_active=True,
                usage_count=0
            )

            db.add(template)
            print(f"已创建模板: {template.name} ({template.subject})")

            # 更新关键词索引
            for keyword in strategy_data["keywords"]:
                existing_keyword = db.query(KeywordIndex).filter_by(keyword=keyword).first()
                if existing_keyword:
                    existing_keyword.usage_frequency += 1
                    existing_keyword.last_used = datetime.utcnow()
                    if not existing_keyword.subject:
                        existing_keyword.subject = strategy_data["subject"]
                else:
                    new_keyword = KeywordIndex(
                        keyword=keyword,
                        subject=strategy_data["subject"],
                        usage_frequency=1
                    )
                    db.add(new_keyword)

        # 提交事务
        db.commit()
        print("MockEngine模板数据迁移完成!")

        # 显示统计信息
        template_count = db.query(VisualizationTemplate).filter_by(is_system_template=True).count()
        keyword_count = db.query(KeywordIndex).count()

        print(f"迁移统计:")
        print(f"  - 系统模板数量: {template_count}")
        print(f"  - 关键词数量: {keyword_count}")

        return {
            "templates_migrated": len(strategies),
            "total_templates": template_count,
            "total_keywords": keyword_count
        }

    except Exception as e:
        db.rollback()
        print(f"迁移失败: {e}")
        raise
    finally:
        db.close()

def verify_migration():
    """验证迁移结果"""
    db = SessionLocal()
    try:
        print("\n验证迁移结果...")

        # 检查模板
        templates = db.query(VisualizationTemplate).filter_by(is_system_template=True).all()
        print(f"系统模板列表:")
        for template in templates:
            print(f"  - {template.name} ({template.subject}) - {template.category}")

        # 检查关键词
        keywords = db.query(KeywordIndex).order_by(KeywordIndex.usage_frequency.desc()).limit(10).all()
        print(f"\n高频关键词 (前10):")
        for keyword in keywords:
            print(f"  - {keyword.keyword}: {keyword.usage_frequency}次 ({keyword.subject})")

    finally:
        db.close()

if __name__ == "__main__":
    print("开始MockEngine模板数据迁移...")

    try:
        result = migrate_mock_data_to_db()
        verify_migration()

        print(f"\n✅ 迁移成功完成!")
        print(f"   迁移模板数: {result['templates_migrated']}")
        print(f"   总模板数: {result['total_templates']}")
        print(f"   总关键词数: {result['total_keywords']}")

    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        sys.exit(1)