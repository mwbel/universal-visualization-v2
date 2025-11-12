/**
 * 数学可视化引擎
 * 基于JSON模板配置的动态可视化渲染系统
 */

class VisualizationEngine {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.currentTemplate = null;
        this.parameters = {};
        this.eventListeners = new Map();
    }

    /**
     * 渲染可视化到指定容器
     * @param {string} containerId - 容器元素ID
     */
    render(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }

        // 加载模板配置
        return this.loadTemplate().then(template => {
            this.currentTemplate = template;
            return this.createVisualization();
        });
    }

    /**
     * 加载模板配置
     */
    async loadTemplate() {
        try {
            const response = await fetch('./math-visualization-templates.json');
            const data = await response.json();

            // 查找指定模板
            let template = null;
            Object.entries(data.templates).forEach(([category, categoryTemplates]) => {
                Object.entries(categoryTemplates).forEach(([key, temp]) => {
                    if (temp.id === this.config.template) {
                        template = temp;
                    }
                });
            });

            if (!template) {
                throw new Error(`Template ${this.config.template} not found`);
            }

            return template;
        } catch (error) {
            console.error('Failed to load template:', error);
            throw error;
        }
    }

    /**
     * 创建可视化内容
     */
    createVisualization() {
        // 根据布局结构创建HTML
        const layout = this.createLayout();
        this.container.innerHTML = layout;

        // 创建控制面板
        this.createControlPanel();

        // 创建可视化区域
        this.createVisualizationArea();

        // 绑定参数事件
        this.bindParameterEvents();

        // 初始渲染
        this.updateVisualization();

        return this;
    }

    /**
     * 创建页面布局
     */
    createLayout() {
        return `
            <div class="visualization-app">
                <div class="sidebar" id="sidebar">
                    <div class="sidebar-title">
                        ${this.currentTemplate.title}
                    </div>
                    <div class="control-panel" id="controlPanel">
                        <!-- 控制面板将在这里生成 -->
                    </div>
                </div>
                <div class="main-content" id="mainContent">
                    <div class="header">
                        <h1>${this.currentTemplate.title}</h1>
                        <p>${this.currentTemplate.description}</p>
                    </div>
                    <div class="content-section">
                        <div class="section-title">可视化展示</div>
                        <div class="visualization-area" id="visualizationArea">
                            <!-- 可视化内容将在这里生成 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建控制面板
     */
    createControlPanel() {
        const controlPanel = document.getElementById('controlPanel');
        let html = '<div class="parameters-section"><h4>参数控制</h4>';

        // 分组参数
        const groupedParams = this.groupParameters(this.currentTemplate.parameters);

        Object.entries(groupedParams).forEach(([groupName, params]) => {
            if (groupName !== 'default') {
                html += `<h5>${groupName}</h5>`;
            }

            params.forEach(param => {
                const value = this.config.parameters[param.id] || param.default;
                this.parameters[param.id] = value;

                switch (param.type) {
                    case 'number':
                        html += this.createSliderControl(param, value);
                        break;
                    case 'boolean':
                        html += this.createToggleControl(param, value);
                        break;
                    case 'string':
                        html += this.createSelectControl(param, value);
                        break;
                }
            });
        });

        html += '</div>';
        controlPanel.innerHTML = html;
    }

    /**
     * 参数分组
     */
    groupParameters(parameters) {
        const groups = {
            default: []
        };

        parameters.forEach(param => {
            const groupName = param.group || 'default';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(param);
        });

        return groups;
    }

    /**
     * 创建滑块控制
     */
    createSliderControl(param, value) {
        return `
            <div class="parameter-item">
                <label>${param.label}</label>
                <input type="range"
                       id="param-${param.id}"
                       min="${param.min}"
                       max="${param.max}"
                       step="${param.step || 0.1}"
                       value="${value}"
                       class="slider">
                <span class="parameter-value" id="value-${param.id}">${value}</span>
            </div>
        `;
    }

    /**
     * 创建开关控制
     */
    createToggleControl(param, value) {
        return `
            <div class="parameter-item">
                <label>${param.label}</label>
                <div class="toggle-switch ${value ? 'active' : ''}" id="param-${param.id}">
                    <div class="toggle-slider"></div>
                </div>
            </div>
        `;
    }

    /**
     * 创建选择控制
     */
    createSelectControl(param, value) {
        const options = param.options || [];
        return `
            <div class="parameter-item">
                <label>${param.label}</label>
                <select id="param-${param.id}" class="select-control">
                    ${options.map(option =>
                        `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    /**
     * 创建可视化区域
     */
    createVisualizationArea() {
        const vizArea = document.getElementById('visualizationArea');
        vizArea.innerHTML = `
            <div class="visualization-placeholder">
                <div class="loading-indicator">正在加载可视化...</div>
            </div>
        `;
    }

    /**
     * 绑定参数事件
     */
    bindParameterEvents() {
        this.currentTemplate.parameters.forEach(param => {
            const element = document.getElementById(`param-${param.id}`);
            if (!element) return;

            const valueElement = document.getElementById(`value-${param.id}`);

            element.addEventListener('input', (e) => {
                let value = param.type === 'boolean' ? e.target.checked :
                           param.type === 'number' ? parseFloat(e.target.value) :
                           e.target.value;

                this.parameters[param.id] = value;

                // 更新显示值
                if (valueElement) {
                    valueElement.textContent = value;
                }

                // 触发更新
                this.updateVisualization();
            });

            // 特殊处理开关
            if (param.type === 'boolean') {
                element.addEventListener('click', () => {
                    element.classList.toggle('active');
                    const isActive = element.classList.contains('active');
                    this.parameters[param.id] = isActive;
                    this.updateVisualization();
                });
            }
        });
    }

    /**
     * 更新可视化
     */
    updateVisualization() {
        const vizArea = document.getElementById('visualizationArea');

        // 根据模板类型调用不同的渲染函数
        switch (this.config.template) {
            case 'vector-space-visualization':
                this.renderVectorSpace(vizArea);
                break;
            case 'normal-distribution-visualization':
                this.renderNormalDistribution(vizArea);
                break;
            case 'function-graph-visualization':
                this.renderFunctionGraph(vizArea);
                break;
            case 'matrix-operations-visualization':
                this.renderMatrixOperations(vizArea);
                break;
            default:
                this.renderGeneric(vizArea);
        }

        // 触发事件
        this.emit('update', { parameters: this.parameters });
    }

    /**
     * 渲染向量空间
     */
    renderVectorSpace(container) {
        const { vector1_x, vector1_y, vector2_x, vector2_y, show_grid, show_projection } = this.parameters;

        const svg = `
            <svg width="100%" height="400" viewBox="-10 -10 20 20">
                ${show_grid ? this.drawGrid() : ''}
                ${this.drawAxes()}
                ${this.drawVector(vector1_x, vector1_y, '#667eea', 'v₁')}
                ${this.drawVector(vector2_x, vector2_y, '#f59e0b', 'v₂')}
                ${show_projection ? this.drawProjection(vector1_x, vector1_y, vector2_x, vector2_y) : ''}
            </svg>
        `;

        container.innerHTML = svg;
    }

    /**
     * 渲染正态分布
     */
    renderNormalDistribution(container) {
        const { mu, sigma, show_area, area_lower, area_upper } = this.parameters;

        // 这里应该使用真实的图表库，简化版本用SVG
        const svg = `
            <svg width="100%" height="400" viewBox="-4 0 8 1">
                ${this.drawNormalCurve(mu, sigma)}
                ${show_area ? this.drawNormalArea(mu, sigma, area_lower, area_upper) : ''}
            </svg>
        `;

        container.innerHTML = svg;
    }

    /**
     * 渲染函数图像
     */
    renderFunctionGraph(container) {
        const { function_type, coefficient_a, coefficient_b, coefficient_c, show_derivative, show_integral } = this.parameters;

        const svg = `
            <svg width="100%" height="400" viewBox="-5 -5 10 10">
                ${this.drawGrid()}
                ${this.drawAxes()}
                ${this.drawFunction(function_type, coefficient_a, coefficient_b, coefficient_c)}
                ${show_derivative ? this.drawDerivative(function_type, coefficient_a, coefficient_b, coefficient_c) : ''}
                ${show_integral ? this.drawIntegral(function_type, coefficient_a, coefficient_b, coefficient_c) : ''}
            </svg>
        `;

        container.innerHTML = svg;
    }

    /**
     * 渲染矩阵运算
     */
    renderMatrixOperations(container) {
        const { operation, matrix_a_rows, matrix_a_cols, animate_transformation } = this.parameters;

        // 简化的矩阵可视化
        const html = `
            <div class="matrix-visualization">
                <div class="matrix-container">
                    <div class="matrix" id="matrixA">
                        ${this.generateMatrix(matrix_a_rows, matrix_a_cols)}
                    </div>
                    <div class="operation-symbol">${this.getOperationSymbol(operation)}</div>
                    <div class="matrix" id="matrixB">
                        ${this.generateMatrix(matrix_a_cols, matrix_a_cols)}
                    </div>
                    <div class="operation-symbol">=</div>
                    <div class="matrix" id="resultMatrix">
                        ${this.generateMatrix(matrix_a_rows, matrix_a_cols)}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * 通用渲染
     */
    renderGeneric(container) {
        container.innerHTML = `
            <div class="generic-visualization">
                <h3>${this.currentTemplate.title}</h3>
                <p>参数配置: ${JSON.stringify(this.parameters, null, 2)}</p>
                <div class="placeholder">
                    请实现具体的渲染逻辑
                </div>
            </div>
        `;
    }

    // 辅助方法
    drawGrid() {
        return '<g class="grid"><line x1="-10" y1="0" x2="10" y2="0" stroke="#e0e0e0"/><line x1="0" y1="-10" x2="0" y2="10" stroke="#e0e0e0"/></g>';
    }

    drawAxes() {
        return '<g class="axes"><line x1="-10" y1="0" x2="10" y2="0" stroke="#666"/><line x1="0" y1="-10" x2="0" y2="10" stroke="#666"/></g>';
    }

    drawVector(x, y, color, label) {
        return `
            <g class="vector">
                <line x1="0" y1="0" x2="${x}" y2="${-y}" stroke="${color}" stroke-width="2" marker-end="url(#arrow-${color})"/>
                <text x="${x/2}" y="${-y/2}" fill="${color}" font-size="12">${label}</text>
            </g>
        `;
    }

    drawNormalCurve(mu, sigma) {
        // 简化的正态分布曲线
        return `
            <path d="M -3 0.1 Q -2 0.5, -1 0.8 T 1 0.8 T 3 0.1"
                  stroke="#667eea" stroke-width="2" fill="none"/>
        `;
    }

    generateMatrix(rows, cols) {
        let html = '<div class="matrix-bracket">';
        for (let i = 0; i < rows; i++) {
            html += '<div class="matrix-row">';
            for (let j = 0; j < cols; j++) {
                html += `<input type="number" class="matrix-input" value="${Math.floor(Math.random() * 10)}">`;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    getOperationSymbol(operation) {
        const symbols = {
            addition: '+',
            subtraction: '-',
            multiplication: '×',
            transpose: 'T'
        };
        return symbols[operation] || '?';
    }

    /**
     * 添加事件监听器
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    /**
     * 更新参数
     */
    updateParameters(newParameters) {
        Object.assign(this.parameters, newParameters);
        this.updateVisualization();
    }

    /**
     * 导出配置
     */
    exportConfig() {
        return {
            template: this.config.template,
            parameters: this.parameters
        };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizationEngine;
} else if (typeof window !== 'undefined') {
    window.VisualizationEngine = VisualizationEngine;
}