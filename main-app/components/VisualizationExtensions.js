/**
 * 可视化扩展系统
 * 支持更多可视化类型和复杂场景
 */
class VisualizationExtensions {
    constructor() {
        this.supportedTypes = new Map();
        this.renderEngines = new Map();
        this.dataAdapters = new Map();
        this.animationControllers = new Map();

        this.initializeSupportedTypes();
        this.initializeRenderEngines();
        this.initializeDataAdapters();
    }

    /**
     * 初始化支持的可视化类型
     */
    initializeSupportedTypes() {
        // 数学可视化扩展
        this.supportedTypes.set('calculus', {
            name: '微积分可视化',
            description: '导数、积分、极限等微积分概念的可视化',
            subtypes: ['derivative', 'integral', 'limit', 'series'],
            defaultEngine: 'plotly',
            complexity: 'medium'
        });

        this.supportedTypes.set('linear_algebra', {
            name: '线性代数可视化',
            description: '矩阵、向量、线性变换等概念的可视化',
            subtypes: ['matrix', 'vector', 'transformation', 'eigenvalue'],
            defaultEngine: 'threejs',
            complexity: 'high'
        });

        this.supportedTypes.set('statistics', {
            name: '统计学可视化',
            description: '概率分布、统计检验、回归分析等',
            subtypes: ['distribution', 'regression', 'hypothesis', 'bayesian'],
            defaultEngine: 'plotly',
            complexity: 'medium'
        });

        // 物理可视化扩展
        this.supportedTypes.set('quantum', {
            name: '量子物理可视化',
            description: '波函数、量子态、纠缠等量子现象',
            subtypes: ['wavefunction', 'quantum_state', 'entanglement', 'tunneling'],
            defaultEngine: 'threejs',
            complexity: 'very_high'
        });

        this.supportedTypes.set('thermodynamics', {
            name: '热力学可视化',
            description: '热力学循环、相变、熵等概念',
            subtypes: ['cycle', 'phase_transition', 'entropy', 'heat_engine'],
            defaultEngine: 'plotly',
            complexity: 'medium'
        });

        this.supportedTypes.set('electromagnetism', {
            name: '电磁学可视化',
            description: '电场、磁场、电磁波等',
            subtypes: ['electric_field', 'magnetic_field', 'em_wave', 'circuit'],
            defaultEngine: 'threejs',
            complexity: 'high'
        });

        // 化学可视化扩展
        this.supportedTypes.set('molecular', {
            name: '分子结构可视化',
            description: '分子结构、化学键、分子轨道',
            subtypes: ['structure', 'bonds', 'orbitals', 'vibration'],
            defaultEngine: 'threejs',
            complexity: 'high'
        });

        this.supportedTypes.set('reaction', {
            name: '化学反应可视化',
            description: '反应机理、动力学、平衡',
            subtypes: ['mechanism', 'kinetics', 'equilibrium', 'catalysis'],
            defaultEngine: 'plotly',
            complexity: 'medium'
        });

        // 天文学可视化扩展
        this.supportedTypes.set('cosmology', {
            name: '宇宙学可视化',
            description: '宇宙演化、星系形成、暗物质暗能量',
            subtypes: ['universe_evolution', 'galaxy_formation', 'dark_matter', 'cosmic_microwave'],
            defaultEngine: 'threejs',
            complexity: 'very_high'
        });

        this.supportedTypes.set('stellar', {
            name: '恒星演化可视化',
            description: '恒星生命周期、赫罗图、星云',
            subtypes: ['stellar_evolution', 'hr_diagram', 'nebula', 'supernova'],
            defaultEngine: 'plotly',
            complexity: 'high'
        });

        // 交叉学科可视化
        this.supportedTypes.set('bioinformatics', {
            name: '生物信息学可视化',
            description: 'DNA序列、蛋白质结构、系统发育',
            subtypes: ['dna_sequence', 'protein_structure', 'phylogeny', 'gene_expression'],
            defaultEngine: 'plotly',
            complexity: 'high'
        });

        this.supportedTypes.set('economics', {
            name: '经济学可视化',
            description: '供需曲线、经济增长、金融市场',
            subtypes: ['supply_demand', 'growth', 'financial_markets', 'game_theory'],
            defaultEngine: 'plotly',
            complexity: 'medium'
        });
    }

    /**
     * 初始化渲染引擎
     */
    initializeRenderEngines() {
        this.renderEngines.set('plotly', {
            name: 'Plotly.js',
            capabilities: ['2d', '3d', 'animation', 'interaction'],
            strengths: ['statistical_charts', 'scientific_plots', 'animation'],
            file: '../assets/engines/plotly-engine.js'
        });

        this.renderEngines.set('threejs', {
            name: 'Three.js',
            capabilities: ['3d', 'vr', 'ar', 'animation', 'interaction'],
            strengths: ['3d_visualization', 'physics_simulation', 'molecular_models'],
            file: '../assets/engines/threejs-engine.js'
        });

        this.renderEngines.set('d3', {
            name: 'D3.js',
            capabilities: ['2d', 'svg', 'animation', 'interaction', 'data_binding'],
            strengths: ['custom_visualizations', 'data_driven', 'complex_animations'],
            file: '../assets/engines/d3-engine.js'
        });

        this.renderEngines.set('webgl', {
            name: 'WebGL',
            capabilities: ['2d', '3d', 'shaders', 'high_performance'],
            strengths: ['gpu_acceleration', 'custom_shaders', 'large_datasets'],
            file: '../assets/engines/webgl-engine.js'
        });
    }

    /**
     * 初始化数据适配器
     */
    initializeDataAdapters() {
        this.dataAdapters.set('csv', {
            name: 'CSV数据适配器',
            supportedFormats: ['.csv'],
            parser: this.parseCSV.bind(this)
        });

        this.dataAdapters.set('json', {
            name: 'JSON数据适配器',
            supportedFormats: ['.json'],
            parser: this.parseJSON.bind(this)
        });

        this.dataAdapters.set('mathematical', {
            name: '数学表达式适配器',
            supportedFormats: ['expression', 'function'],
            parser: this.parseMathematical.bind(this)
        });

        this.dataAdapters.set('astronomical', {
            name: '天文数据适配器',
            supportedFormats: ['ephemeris', 'coordinates', 'orbital_elements'],
            parser: this.parseAstronomical.bind(this)
        });

        this.dataAdapters.set('simulation', {
            name: '仿真数据适配器',
            supportedFormats: ['time_series', 'particle_data', 'field_data'],
            parser: this.parseSimulation.bind(this)
        });
    }

    /**
     * 检测可视化类型
     * @param {string} userInput - 用户输入
     * @returns {Object} 检测结果
     */
    detectVisualizationType(userInput) {
        const detection = {
            primaryType: null,
            subtypes: [],
            confidence: 0,
            suggestedEngines: [],
            complexity: 'medium',
            estimatedTime: 0
        };

        const keywords = this.extractKeywords(userInput);

        // 类型检测逻辑
        for (const [type, config] of this.supportedTypes) {
            const match = this.calculateMatch(keywords, type, config);
            if (match.confidence > detection.confidence) {
                detection.primaryType = type;
                detection.subtypes = match.subtypes;
                detection.confidence = match.confidence;
                detection.suggestedEngines = [config.defaultEngine];
                detection.complexity = config.complexity;
            }
        }

        // 估算生成时间
        detection.estimatedTime = this.estimateGenerationTime(detection.complexity, detection.subtypes.length);

        return detection;
    }

    /**
     * 提取关键词
     * @param {string} text - 输入文本
     * @returns {Array} 关键词数组
     */
    extractKeywords(text) {
        const keywords = {
            // 数学关键词
            calculus: ['导数', '积分', '微分', '极限', 'derivative', 'integral', 'limit', 'differentiation'],
            linear_algebra: ['矩阵', '向量', '变换', '特征值', 'matrix', 'vector', 'transformation', 'eigenvalue'],
            statistics: ['分布', '回归', '概率', '统计', 'distribution', 'regression', 'probability', 'statistics'],

            // 物理关键词
            quantum: ['量子', '波函数', '纠缠', 'quantum', 'wavefunction', 'entanglement'],
            thermodynamics: ['热力学', '熵', '温度', 'thermodynamics', 'entropy', 'temperature'],
            electromagnetism: ['电磁', '电场', '磁场', 'electromagnetic', 'electric_field', 'magnetic_field'],

            // 化学关键词
            molecular: ['分子', '原子', '化学键', 'molecule', 'atom', 'bond'],
            reaction: ['反应', '催化', '平衡', 'reaction', 'catalysis', 'equilibrium'],

            // 天文学关键词
            cosmology: ['宇宙', '星系', '暗物质', 'cosmos', 'galaxy', 'dark_matter'],
            stellar: ['恒星', '演化', '星云', 'star', 'evolution', 'nebula'],

            // 交叉学科关键词
            bioinformatics: ['DNA', '蛋白质', '基因', 'evolution', 'phylogeny'],
            economics: ['经济', '市场', '供需', 'economics', 'market', 'supply_demand']
        };

        const foundKeywords = [];
        const lowerText = text.toLowerCase();

        for (const [category, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (lowerText.includes(word.toLowerCase())) {
                    foundKeywords.push({
                        category,
                        word,
                        weight: this.calculateKeywordWeight(word)
                    });
                }
            }
        }

        return foundKeywords.sort((a, b) => b.weight - a.weight);
    }

    /**
     * 计算关键词权重
     * @param {string} keyword - 关键词
     * @returns {number} 权重值
     */
    calculateKeywordWeight(keyword) {
        const highWeightWords = ['量子', '分子', '星系', '宇宙', 'quantum', 'molecule', 'galaxy', 'universe'];
        const mediumWeightWords = ['导数', '积分', '矩阵', 'derivative', 'integral', 'matrix'];

        if (highWeightWords.some(word => keyword.toLowerCase().includes(word.toLowerCase()))) {
            return 3;
        }
        if (mediumWeightWords.some(word => keyword.toLowerCase().includes(word.toLowerCase()))) {
            return 2;
        }
        return 1;
    }

    /**
     * 计算匹配度
     * @param {Array} keywords - 关键词
     * @param {string} type - 类型
     * @param {Object} config - 配置
     * @returns {Object} 匹配结果
     */
    calculateMatch(keywords, type, config) {
        const relevantKeywords = keywords.filter(k => k.category === type);
        const confidence = relevantKeywords.reduce((sum, k) => sum + k.weight, 0);

        // 检测子类型
        const subtypes = [];
        for (const subtype of config.subtypes) {
            if (relevantKeywords.some(k => this.matchesSubtype(k.word, subtype))) {
                subtypes.push(subtype);
            }
        }

        return {
            confidence,
            subtypes
        };
    }

    /**
     * 匹配子类型
     * @param {string} keyword - 关键词
     * @param {string} subtype - 子类型
     * @returns {boolean} 是否匹配
     */
    matchesSubtype(keyword, subtype) {
        const subtypeMappings = {
            'derivative': ['导数', '微分', 'derivative', 'differentiation'],
            'integral': ['积分', 'integral'],
            'matrix': ['矩阵', 'matrix'],
            'quantum_state': ['量子态', 'quantum_state'],
            'molecular': ['分子', 'molecule'],
            'stellar_evolution': ['恒星演化', 'stellar_evolution']
        };

        const mappedWords = subtypeMappings[subtype] || [];
        return mappedWords.some(word => keyword.toLowerCase().includes(word.toLowerCase()));
    }

    /**
     * 估算生成时间
     * @param {string} complexity - 复杂度
     * @param {number} subtypeCount - 子类型数量
     * @returns {number} 估算时间（秒）
     */
    estimateGenerationTime(complexity, subtypeCount) {
        const baseTimes = {
            'low': 2,
            'medium': 5,
            'high': 10,
            'very_high': 20
        };

        const baseTime = baseTimes[complexity] || baseTimes['medium'];
        return baseTime + (subtypeCount - 1) * 2;
    }

    /**
     * 创建可视化配置
     * @param {string} type - 类型
     * @param {Array} subtypes - 子类型
     * @param {Object} params - 参数
     * @returns {Object} 可视化配置
     */
    createVisualizationConfig(type, subtypes, params = {}) {
        const typeConfig = this.supportedTypes.get(type);
        if (!typeConfig) {
            throw new Error(`不支持的可视化类型: ${type}`);
        }

        const engine = this.renderEngines.get(typeConfig.defaultEngine);
        if (!engine) {
            throw new Error(`找不到渲染引擎: ${typeConfig.defaultEngine}`);
        }

        return {
            type,
            subtypes,
            engine: typeConfig.defaultEngine,
            engineConfig: engine,
            complexity: typeConfig.complexity,
            params: this.generateDefaultParams(type, subtypes, params),
            interactions: this.generateDefaultInteractions(type, subtypes),
            animations: this.generateDefaultAnimations(type, subtypes)
        };
    }

    /**
     * 生成默认参数
     * @param {string} type - 类型
     * @param {Array} subtypes - 子类型
     * @param {Object} userParams - 用户参数
     * @returns {Object} 默认参数
     */
    generateDefaultParams(type, subtypes, userParams = {}) {
        const defaultParams = {
            // 通用参数
            width: 800,
            height: 600,
            title: `${this.supportedTypes.get(type).name}`,
            showGrid: true,
            showLegend: true,
            colorScheme: 'viridis',

            // 交互参数
            enableZoom: true,
            enablePan: true,
            enableRotation: type === 'linear_algebra' || type === 'quantum',

            // 动画参数
            enableAnimation: true,
            animationDuration: 2000,
            animationLoop: false
        };

        // 类型特定参数
        const typeSpecificParams = this.getTypeSpecificParams(type, subtypes);

        return {
            ...defaultParams,
            ...typeSpecificParams,
            ...userParams
        };
    }

    /**
     * 获取类型特定参数
     * @param {string} type - 类型
     * @param {Array} subtypes - 子类型
     * @returns {Object} 类型特定参数
     */
    getTypeSpecificParams(type, subtypes) {
        const params = {};

        switch (type) {
            case 'calculus':
                if (subtypes.includes('derivative')) {
                    params.showDerivative = true;
                    params.showTangent = true;
                }
                if (subtypes.includes('integral')) {
                    params.showArea = true;
                    params.showRiemannSum = true;
                }
                break;

            case 'linear_algebra':
                params.showAxes = true;
                params.showVectors = true;
                params.vectorScale = 1.0;
                if (subtypes.includes('transformation')) {
                    params.showOriginal = true;
                    params.showTransformed = true;
                }
                break;

            case 'quantum':
                params.showWavefunction = true;
                params.showProbability = true;
                params.complexPlane = true;
                if (subtypes.includes('entanglement')) {
                    params.showCorrelation = true;
                }
                break;

            case 'molecular':
                params.showBonds = true;
                params.showAtoms = true;
                params.atomScale = 0.5;
                params.bondRadius = 0.1;
                if (subtypes.includes('orbitals')) {
                    params.showOrbitals = true;
                    params.orbitalOpacity = 0.3;
                }
                break;

            case 'cosmology':
                params.showTime = true;
                params.timeScale = 'logarithmic';
                params.showExpansion = true;
                break;

            case 'stellar':
                params.showTemperature = true;
                params.showLuminosity = true;
                params.colorByTemperature = true;
                break;
        }

        return params;
    }

    /**
     * 生成默认交互
     * @param {string} type - 类型
     * @param {Array} subtypes - 子类型
     * @returns {Object} 交互配置
     */
    generateDefaultInteractions(type, subtypes) {
        const interactions = {
            hover: {
                enabled: true,
                showTooltip: true,
                highlightElements: true
            },
            click: {
                enabled: true,
                showDetails: true,
                enableSelection: true
            }
        };

        // 类型特定交互
        switch (type) {
            case 'linear_algebra':
                interactions.drag = {
                    enabled: true,
                    transformVectors: true,
                    updateMatrix: true
                };
                break;

            case 'quantum':
                interactions.slider = {
                    enabled: true,
                    controlParameters: ['time', 'phase', 'amplitude'],
                    realTimeUpdate: true
                };
                break;

            case 'molecular':
                interactions.rotate = {
                    enabled: true,
                    autoRotate: false,
                    rotationSpeed: 0.01
                };
                break;
        }

        return interactions;
    }

    /**
     * 生成默认动画
     * @param {string} type - 类型
     * @param {Array} subtypes - 子类型
     * @returns {Object} 动画配置
     */
    generateDefaultAnimations(type, subtypes) {
        const animations = {
            enabled: true,
            duration: 2000,
            easing: 'ease-in-out',
            loop: false
        };

        // 类型特定动画
        switch (type) {
            case 'calculus':
                if (subtypes.includes('derivative')) {
                    animations.tangentAnimation = {
                        enabled: true,
                        sweepAlong: true,
                        showNormal: true
                    };
                }
                if (subtypes.includes('integral')) {
                    animations.riemannAnimation = {
                        enabled: true,
                        increasingRectangles: true,
                        showConvergence: true
                    };
                }
                break;

            case 'linear_algebra':
                animations.transformationAnimation = {
                    enabled: true,
                    showIntermediate: true,
                    stepDuration: 500
                };
                break;

            case 'quantum':
                animations.waveAnimation = {
                    enabled: true,
                    showTimeEvolution: true,
                    probabilityFlow: true
                };
                break;

            case 'stellar':
                animations.evolutionAnimation = {
                    enabled: true,
                    trackPath: true,
                    showStages: true
                };
                break;
        }

        return animations;
    }

    /**
     * 解析CSV数据
     * @param {string} data - CSV数据
     * @returns {Object} 解析结果
     */
    parseCSV(data) {
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
                row[header] = isNaN(value) ? value : parseFloat(value);
            });
            rows.push(row);
        }

        return {
            headers,
            rows,
            columnCount: headers.length,
            rowCount: rows.length
        };
    }

    /**
     * 解析JSON数据
     * @param {string} data - JSON数据
     * @returns {Object} 解析结果
     */
    parseJSON(data) {
        try {
            const parsed = JSON.parse(data);
            return {
                data: parsed,
                structure: this.analyzeJSONStructure(parsed)
            };
        } catch (error) {
            throw new Error(`JSON解析失败: ${error.message}`);
        }
    }

    /**
     * 解析数学表达式
     * @param {string} expression - 数学表达式
     * @returns {Object} 解析结果
     */
    parseMathematical(expression) {
        // 这里可以集成数学表达式解析库
        return {
            expression,
            variables: this.extractVariables(expression),
            type: this.detectMathType(expression)
        };
    }

    /**
     * 解析天文数据
     * @param {string} data - 天文数据
     * @returns {Object} 解析结果
     */
    parseAstronomical(data) {
        return {
            coordinates: this.parseCoordinates(data),
            time: this.parseTimeData(data),
            objects: this.identifyAstronomicalObjects(data)
        };
    }

    /**
     * 解析仿真数据
     * @param {string} data - 仿真数据
     * @returns {Object} 解析结果
     */
    parseSimulation(data) {
        return {
            timeSeries: this.extractTimeSeries(data),
            particles: this.extractParticleData(data),
            fields: this.extractFieldData(data)
        };
    }

    /**
     * 获取所有支持的可视化类型
     * @returns {Array} 类型列表
     */
    getSupportedTypes() {
        return Array.from(this.supportedTypes.entries()).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * 获取所有可用的渲染引擎
     * @returns {Array} 引擎列表
     */
    getAvailableEngines() {
        return Array.from(this.renderEngines.entries()).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    /**
     * 验证可视化配置
     * @param {Object} config - 配置对象
     * @returns {Object} 验证结果
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        // 检查必需字段
        if (!config.type) {
            errors.push('缺少可视化类型');
        }

        if (!config.engine) {
            errors.push('缺少渲染引擎');
        }

        if (!config.params) {
            warnings.push('缺少参数配置，将使用默认值');
        }

        // 检查类型支持
        if (config.type && !this.supportedTypes.has(config.type)) {
            errors.push(`不支持的可视化类型: ${config.type}`);
        }

        // 检查引擎支持
        if (config.engine && !this.renderEngines.has(config.engine)) {
            errors.push(`不支持的渲染引擎: ${config.engine}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // 辅助方法
    analyzeJSONStructure(obj) {
        // 分析JSON结构的逻辑
        return {
            type: Array.isArray(obj) ? 'array' : typeof obj,
            depth: this.getObjectDepth(obj),
            keys: this.getObjectKeys(obj)
        };
    }

    extractVariables(expression) {
        // 提取数学表达式中的变量
        const variables = expression.match(/[a-zA-Z]/g) || [];
        return [...new Set(variables)];
    }

    detectMathType(expression) {
        // 检测数学表达式类型
        if (expression.includes('∫') || expression.includes('integral')) return 'integral';
        if (expression.includes('d/') || expression.includes('derivative')) return 'derivative';
        if (expression.includes('lim') || expression.includes('limit')) return 'limit';
        return 'expression';
    }

    parseCoordinates(data) {
        // 解析坐标数据
        return { /* 坐标解析逻辑 */ };
    }

    parseTimeData(data) {
        // 解析时间数据
        return { /* 时间解析逻辑 */ };
    }

    identifyAstronomicalObjects(data) {
        // 识别天文对象
        return { /* 对象识别逻辑 */ };
    }

    extractTimeSeries(data) {
        // 提取时间序列数据
        return { /* 时间序列提取逻辑 */ };
    }

    extractParticleData(data) {
        // 提取粒子数据
        return { /* 粒子数据提取逻辑 */ };
    }

    extractFieldData(data) {
        // 提取场数据
        return { /* 场数据提取逻辑 */ };
    }

    getObjectDepth(obj) {
        // 计算对象深度
        if (typeof obj !== 'object' || obj === null) return 0;
        return 1 + Math.max(...Object.values(obj).map(v => this.getObjectDepth(v)));
    }

    getObjectKeys(obj) {
        // 获取对象的所有键
        if (typeof obj !== 'object' || obj === null) return [];
        return Object.keys(obj);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizationExtensions;
} else {
    window.VisualizationExtensions = VisualizationExtensions;
}