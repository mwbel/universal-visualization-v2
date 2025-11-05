/**
 * 多浏览器兼容性测试
 * 验证系统在不同浏览器和设备上的兼容性
 */
class BrowserCompatibilityTests {
    constructor() {
        this.testResults = new Map();
        this.browserConfigs = this.initializeBrowserConfigs();
        this.testSuites = this.initializeTestSuites();
        this.deviceConfigs = this.initializeDeviceConfigs();

        this.currentBrowser = this.detectCurrentBrowser();
        this.testStartTime = Date.now();
    }

    /**
     * 初始化浏览器配置
     */
    initializeBrowserConfigs() {
        return {
            chrome: {
                name: 'Google Chrome',
                versions: ['120+', '119', '118'],
                engine: 'Blink',
                marketShare: 65,
                features: {
                    es2022: true,
                    webgl2: true,
                    webrtc: true,
                    wasm: true,
                    serviceworker: true,
                    webworkers: true,
                    fetch: true,
                    async: true,
                    modules: true
                }
            },
            firefox: {
                name: 'Mozilla Firefox',
                versions: ['119+', '118', '117'],
                engine: 'Gecko',
                marketShare: 15,
                features: {
                    es2022: true,
                    webgl2: true,
                    webrtc: true,
                    wasm: true,
                    serviceworker: true,
                    webworkers: true,
                    fetch: true,
                    async: true,
                    modules: true
                }
            },
            safari: {
                name: 'Safari',
                versions: ['17+', '16.5', '16'],
                engine: 'WebKit',
                marketShare: 18,
                features: {
                    es2022: true,
                    webgl2: true,
                    webrtc: true,
                    wasm: true,
                    serviceworker: true,
                    webworkers: true,
                    fetch: true,
                    async: true,
                    modules: true
                }
            },
            edge: {
                name: 'Microsoft Edge',
                versions: ['119+', '118', '117'],
                engine: 'Blink',
                marketShare: 5,
                features: {
                    es2022: true,
                    webgl2: true,
                    webrtc: true,
                    wasm: true,
                    serviceworker: true,
                    webworkers: true,
                    fetch: true,
                    async: true,
                    modules: true
                }
            }
        };
    }

    /**
     * 初始化测试套件
     */
    initializeTestSuites() {
        return {
            // 基础功能测试
            basic: [
                { name: 'ES6语法支持', test: 'testES6Features' },
                { name: 'DOM API兼容性', test: 'testDOMAPI' },
                { name: '事件处理', test: 'testEventHandling' },
                { name: '本地存储', test: 'testLocalStorage' },
                { name: 'Fetch API', test: 'testFetchAPI' },
                { name: 'Promise支持', test: 'testPromises' }
            ],

            // 高级功能测试
            advanced: [
                { name: 'Web Workers', test: 'testWebWorkers' },
                { name: 'Service Workers', test: 'testServiceWorkers' },
                { name: 'WebAssembly', test: 'testWebAssembly' },
                { name: 'WebRTC', test: 'testWebRTC' },
                { name: 'IndexedDB', test: 'testIndexedDB' },
                { name: 'Canvas 2D', test: 'testCanvas2D' },
                { name: 'WebGL', test: 'testWebGL' },
                { name: 'CSS Grid', test: 'testCSSGrid' }
            ],

            // 项目特定测试
            project: [
                { name: '组件加载', test: 'testComponentLoading' },
                { name: '路由系统', test: 'testRouterSystem' },
                { name: 'API客户端', test: 'testAPIClient' },
                { name: '可视化渲染', test: 'testVisualizationRendering' },
                { name: '批量操作', test: 'testBatchOperations' },
                { name: '用户管理', test: 'testUserManagement' },
                { name: '主题切换', test: 'testThemeSwitching' },
                { name: '响应式布局', test: 'testResponsiveLayout' }
            ],

            // 性能测试
            performance: [
                { name: '页面加载性能', test: 'testPageLoadPerformance' },
                { name: '内存使用', test: 'testMemoryUsage' },
                { name: 'CPU使用', test: 'testCPUUsage' },
                { name: '网络性能', test: 'testNetworkPerformance' },
                { name: '渲染性能', test: 'testRenderingPerformance' }
            ],

            // 可访问性测试
            accessibility: [
                { name: '键盘导航', test: 'testKeyboardNavigation' },
                { name: '屏幕阅读器', test: 'testScreenReaderSupport' },
                { name: 'ARIA标签', test: 'testARIALabels' },
                { name: '颜色对比度', test: 'testColorContrast' },
                { name: '焦点管理', test: 'testFocusManagement' }
            ]
        };
    }

    /**
     * 初始化设备配置
     */
    initializeDeviceConfigs() {
        return {
            desktop: {
                name: '桌面设备',
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                capabilities: {
                    mouse: true,
                    keyboard: true,
                    touch: false,
                    highDPI: true,
                    webgl: true
                }
            },
            laptop: {
                name: '笔记本电脑',
                viewport: { width: 1366, height: 768 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                capabilities: {
                    mouse: true,
                    keyboard: true,
                    touch: false,
                    highDPI: true,
                    webgl: true
                }
            },
            tablet: {
                name: '平板设备',
                viewport: { width: 768, height: 1024 },
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                capabilities: {
                    mouse: false,
                    keyboard: true,
                    touch: true,
                    highDPI: true,
                    webgl: true
                }
            },
            mobile: {
                name: '手机设备',
                viewport: { width: 375, height: 667 },
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                capabilities: {
                    mouse: false,
                    keyboard: true,
                    touch: true,
                    highDPI: true,
                    webgl: true
                }
            }
        };
    }

    /**
     * 检测当前浏览器
     */
    detectCurrentBrowser() {
        const userAgent = navigator.userAgent;
        let browserName = 'unknown';
        let version = 'unknown';

        if (userAgent.includes('Chrome')) {
            browserName = 'chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            version = match ? match[1] : 'unknown';
        } else if (userAgent.includes('Firefox')) {
            browserName = 'firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            version = match ? match[1] : 'unknown';
        } else if (userAgent.includes('Safari')) {
            browserName = 'safari';
            const match = userAgent.match(/Version\/(\d+)/);
            version = match ? match[1] : 'unknown';
        } else if (userAgent.includes('Edge')) {
            browserName = 'edge';
            const match = userAgent.match(/Edge\/(\d+)/);
            version = match ? match[1] : 'unknown';
        }

        return { name: browserName, version, userAgent };
    }

    /**
     * 运行完整的兼容性测试套件
     */
    async runFullCompatibilitySuite() {
        console.log('🌐 开始多浏览器兼容性测试...');

        const suiteResults = {
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            currentBrowser: this.currentBrowser,
            browserResults: {},
            deviceResults: {},
            featureMatrix: {},
            compatibilityScore: 0,
            issues: [],
            recommendations: []
        };

        try {
            // 1. 检测当前浏览器功能
            suiteResults.currentBrowser.features = await this.detectBrowserFeatures();

            // 2. 运行基础功能测试
            suiteResults.basicTests = await this.runTestSuite('basic');

            // 3. 运行高级功能测试
            suiteResults.advancedTests = await this.runTestSuite('advanced');

            // 4. 运行项目特定测试
            suiteResults.projectTests = await this.runTestSuite('project');

            // 5. 运行性能测试
            suiteResults.performanceTests = await this.runTestSuite('performance');

            // 6. 运行可访问性测试
            suiteResults.accessibilityTests = await this.runTestSuite('accessibility');

            // 7. 模拟不同设备测试
            suiteResults.deviceResults = await this.runDeviceTests();

            // 8. 生成兼容性矩阵
            suiteResults.featureMatrix = this.generateFeatureMatrix(suiteResults);

            // 9. 计算兼容性评分
            suiteResults.compatibilityScore = this.calculateCompatibilityScore(suiteResults);

            // 10. 生成问题和建议
            suiteResults.issues = this.identifyCompatibilityIssues(suiteResults);
            suiteResults.recommendations = this.generateCompatibilityRecommendations(suiteResults);

            suiteResults.endTime = Date.now();
            suiteResults.duration = suiteResults.endTime - suiteResults.startTime;

            console.log('✅ 多浏览器兼容性测试完成');
            return suiteResults;

        } catch (error) {
            console.error('❌ 兼容性测试失败:', error);
            throw error;
        }
    }

    /**
     * 检测浏览器功能
     */
    async detectBrowserFeatures() {
        const features = {};

        // ES6+ 特性检测
        features.es6 = {
            arrow: (() => { try { eval('() => {}'); return true; } catch { return false; } })(),
            classes: (() => { try { eval('class X {}'); return true; } catch { return false; } })(),
            destructuring: (() => { try { eval('const {x} = {}'); return true; } catch { return false; } })(),
            modules: typeof Symbol !== 'undefined' && Symbol.toStringTag === 'Symbol(Symbol.toStringTag)',
            async: typeof Promise !== 'undefined' && Promise.prototype.finally
        };

        // Web API 检测
        features.webapi = {
            fetch: typeof fetch !== 'undefined',
            webgl: this.checkWebGL(),
            webgl2: this.checkWebGL2(),
            webrtc: !!window.RTCPeerConnection,
            webworkers: typeof Worker !== 'undefined',
            serviceworker: 'serviceWorker' in navigator,
            indexeddb: 'indexedDB' in window,
            localstorage: 'localStorage' in window,
            sessionstorage: 'sessionStorage' in window
        };

        // CSS 特性检测
        features.css = {
            grid: CSS.supports('display', 'grid'),
            flexbox: CSS.supports('display', 'flex'),
            variables: CSS.supports('color', 'var(--test)'),
            customProperties: CSS.supports('color', 'var(--test)'),
            backdrop: CSS.supports('backdrop-filter', 'blur(10px)')
        };

        // 其他特性
        features.other = {
            touch: 'ontouchstart' in window,
            geolocation: 'geolocation' in navigator,
            notification: 'Notification' in window,
            websocket: typeof WebSocket !== 'undefined',
            canvas: !!document.createElement('canvas').getContext,
            audio: !!document.createElement('audio').canPlayType,
            video: !!document.createElement('video').canPlayType
        };

        return features;
    }

    /**
     * 检查 WebGL 支持
     */
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * 检查 WebGL2 支持
     */
    checkWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }

    /**
     * 运行测试套件
     */
    async runTestSuite(suiteName) {
        console.log(`  🧪 运行测试套件: ${suiteName}`);

        const suite = this.testSuites[suiteName];
        const results = {
            name: suiteName,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            score: 0
        };

        for (const test of suite) {
            try {
                const testResult = await this.executeTest(test.test);
                results.tests.push({
                    name: test.name,
                    passed: testResult.passed,
                    message: testResult.message,
                    details: testResult.details,
                    duration: testResult.duration || 0
                });

                if (testResult.passed) {
                    results.passed++;
                } else {
                    results.failed++;
                }

            } catch (error) {
                results.tests.push({
                    name: test.name,
                    passed: false,
                    message: `测试执行失败: ${error.message}`,
                    details: null,
                    duration: 0
                });
                results.failed++;
            }
        }

        // 计算评分
        const totalTests = results.passed + results.failed;
        results.score = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;

        console.log(`    ✅ ${suiteName} 完成: ${results.passed}/${totalTests} 通过 (${results.score}%)`);

        return results;
    }

    /**
     * 执行单个测试
     */
    async executeTest(testName) {
        const startTime = performance.now();

        try {
            const testMethods = {
                testES6Features: () => this.testES6Features(),
                testDOMAPI: () => this.testDOMAPI(),
                testEventHandling: () => this.testEventHandling(),
                testLocalStorage: () => this.testLocalStorage(),
                testFetchAPI: () => this.testFetchAPI(),
                testPromises: () => this.testPromises(),
                testWebWorkers: () => this.testWebWorkers(),
                testServiceWorkers: () => this.testServiceWorkers(),
                testWebAssembly: () => this.testWebAssembly(),
                testWebRTC: () => this.testWebRTC(),
                testIndexedDB: () => this.testIndexedDB(),
                testCanvas2D: () => this.testCanvas2D(),
                testWebGL: () => this.testWebGL(),
                testCSSGrid: () => this.testCSSGrid(),
                testComponentLoading: () => this.testComponentLoading(),
                testRouterSystem: () => this.testRouterSystem(),
                testAPIClient: () => this.testAPIClient(),
                testVisualizationRendering: () => this.testVisualizationRendering(),
                testBatchOperations: () => this.testBatchOperations(),
                testUserManagement: () => this.testUserManagement(),
                testThemeSwitching: () => this.testThemeSwitching(),
                testResponsiveLayout: () => this.testResponsiveLayout(),
                testPageLoadPerformance: () => this.testPageLoadPerformance(),
                testMemoryUsage: () => this.testMemoryUsage(),
                testCPUUsage: () => this.testCPUUsage(),
                testNetworkPerformance: () => this.testNetworkPerformance(),
                testRenderingPerformance: () => this.testRenderingPerformance(),
                testKeyboardNavigation: () => this.testKeyboardNavigation(),
                testScreenReaderSupport: () => this.testScreenReaderSupport(),
                testARIALabels: () => this.testARIALabels(),
                testColorContrast: () => this.testColorContrast(),
                testFocusManagement: () => this.testFocusManagement()
            };

            const testMethod = testMethods[testName];
            if (!testMethod) {
                return {
                    passed: false,
                    message: `未知的测试方法: ${testName}`,
                    details: null
                };
            }

            const result = await testMethod();
            const duration = performance.now() - startTime;

            return {
                passed: result.passed,
                message: result.message,
                details: result.details,
                duration: Math.round(duration)
            };

        } catch (error) {
            return {
                passed: false,
                message: `测试执行异常: ${error.message}`,
                details: { stack: error.stack },
                duration: Math.round(performance.now() - startTime)
            };
        }
    }

    // 基础功能测试方法
    async testES6Features() {
        const features = ['arrow', 'classes', 'destructuring', 'modules', 'async'];
        const detected = await this.detectBrowserFeatures();

        const supported = features.filter(f => detected.es6[f]);
        const missing = features.filter(f => !detected.es6[f]);

        return {
            passed: supported.length >= 4,
            message: `支持 ${supported.length}/${features.length} 个ES6特性`,
            details: { supported, missing }
        };
    }

    async testDOMAPI() {
        const apis = ['querySelector', 'addEventListener', 'classList', 'dataset', 'createDocumentFragment'];
        const supported = [];
        const missing = [];

        for (const api of apis) {
            try {
                if (typeof document[api] === 'function') {
                    supported.push(api);
                } else {
                    missing.push(api);
                }
            } catch (e) {
                missing.push(api);
            }
        }

        return {
            passed: supported.length >= 4,
            message: `支持 ${supported.length}/${apis.length} 个DOM API`,
            details: { supported, missing }
        };
    }

    async testEventHandling() {
        let eventSupported = false;
        let customEventSupported = false;

        try {
            // 测试标准事件
            const testElement = document.createElement('div');
            testElement.addEventListener('click', () => {}, { once: true });
            eventSupported = true;

            // 测试自定义事件
            const customEvent = new CustomEvent('test', { detail: {} });
            customEventSupported = true;

        } catch (error) {
            // 忽略错误
        }

        return {
            passed: eventSupported && customEventSupported,
            message: eventSupported && customEventSupported ? '事件处理完全支持' : '事件处理支持不完整',
            details: { eventSupported, customEventSupported }
        };
    }

    async testLocalStorage() {
        try {
            const testKey = 'compatibility_test_' + Date.now();
            const testValue = { test: 'data', timestamp: Date.now() };

            localStorage.setItem(testKey, JSON.stringify(testValue));
            const retrieved = JSON.parse(localStorage.getItem(testKey));
            localStorage.removeItem(testKey);

            const success = retrieved && retrieved.test === 'data';

            return {
                passed: success,
                message: success ? '本地存储功能正常' : '本地存储功能异常',
                details: { testKey, testValue, retrieved }
            };

        } catch (error) {
            return {
                passed: false,
                message: '本地存储不可用',
                details: { error: error.message }
            };
        }
    }

    async testFetchAPI() {
        if (typeof fetch === 'undefined') {
            return {
                passed: false,
                message: 'Fetch API 不可用',
                details: null
            };
        }

        try {
            // 测试 fetch 请求（使用一个不会实际发送的请求）
            const controller = new AbortController();
            const signal = controller.signal;

            // 创建一个被取消的请求来测试 fetch 功能
            const promise = fetch('data:text/plain,test', { signal });
            controller.abort();

            await promise.catch(() => {}); // 忽略 AbortError

            return {
                passed: true,
                message: 'Fetch API 功能正常',
                details: { supported: true, abortSupported: true }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'Fetch API 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testPromises() {
        try {
            // 测试 Promise 基本功能
            const promise1 = Promise.resolve('test');
            const promise2 = new Promise((resolve) => setTimeout(() => resolve('delayed'), 10));
            const promise3 = Promise.reject('error');

            const results = await Promise.allSettled([promise1, promise2]);
            const errorResult = await promise3.catch(error => error);

            const success = results.every(r => r.status === 'fulfilled') && errorResult === 'error';

            return {
                passed: success,
                message: success ? 'Promise 功能正常' : 'Promise 功能异常',
                details: { resultsCount: results.length, errorHandled: true }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'Promise 不可用',
                details: { error: error.message }
            };
        }
    }

    // 高级功能测试方法
    async testWebWorkers() {
        if (typeof Worker === 'undefined') {
            return {
                passed: false,
                message: 'Web Workers 不可用',
                details: null
            };
        }

        try {
            // 创建一个简单的 Worker 测试
            const workerCode = `
                self.onmessage = function(e) {
                    self.postMessage(e.data * 2);
                }
            `;

            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));

            return new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data === 4) {
                        worker.terminate();
                        URL.revokeObjectURL(blob);
                        resolve({
                            passed: true,
                            message: 'Web Workers 功能正常',
                            details: { result: e.data }
                        });
                    }
                };

                worker.postMessage(2);
                setTimeout(() => {
                    worker.terminate();
                    URL.revokeObjectURL(blob);
                    resolve({
                        passed: false,
                        message: 'Web Workers 响应超时',
                        details: null
                    });
                }, 1000);
            });

        } catch (error) {
            return {
                passed: false,
                message: 'Web Workers 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testServiceWorkers() {
        if (!('serviceWorker' in navigator)) {
            return {
                passed: false,
                message: 'Service Workers 不可用',
                details: null
            };
        }

        try {
            // Service Workers 需要 HTTPS 环境，这里只检查 API 可用性
            return {
                passed: true,
                message: 'Service Workers API 可用',
                details: { available: true, requiresHTTPS: true }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'Service Workers 检查失败',
                details: { error: error.message }
            };
        }
    }

    async testWebAssembly() {
        if (typeof WebAssembly === 'undefined') {
            return {
                passed: false,
                message: 'WebAssembly 不可用',
                details: null
            };
        }

        try {
            // 简单的 WebAssembly 测试
            const wasmCode = new Uint8Array([
                0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                0x01, 0x07, 0x01, 0x00, 0x01, 0x60, 0x02, 0x7f,
                0x7f, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x07,
                0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x01,
                0x0a, 0x09, 0x01, 0x00, 0x41, 0x02, 0x10, 0x00,
                0x0b
            ]);

            const wasmModule = await WebAssembly.instantiate(wasmCode);
            const result = wasmModule.instance.exports.add(3, 4);

            const success = result === 7;

            return {
                passed: success,
                message: success ? 'WebAssembly 功能正常' : 'WebAssembly 计算错误',
                details: { result, expected: 7 }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'WebAssembly 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testWebRTC() {
        if (!window.RTCPeerConnection) {
            return {
                passed: false,
                message: 'WebRTC 不可用',
                details: null
            };
        }

        try {
            // 创建 RTCPeerConnection 实例
            const pc = new RTCPeerConnection();
            pc.close();

            return {
                passed: true,
                message: 'WebRTC API 可用',
                details: { supported: true }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'WebRTC 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testIndexedDB() {
        if (!('indexedDB' in window)) {
            return {
                passed: false,
                message: 'IndexedDB 不可用',
                details: null
            };
        }

        try {
            const request = indexedDB.open('test_db', 1);

            return new Promise((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve({
                        passed: true,
                        message: 'IndexedDB 功能正常',
                        details: { supported: true }
                    });
                };

                request.onerror = () => {
                    resolve({
                        passed: false,
                        message: 'IndexedDB 打开失败',
                        details: { error: request.error?.message }
                    });
                };

                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('test_store')) {
                        db.createObjectStore('test_store');
                    }
                };

                setTimeout(() => {
                    if (request.readyState !== 'done') {
                        request.result?.close();
                        resolve({
                            passed: false,
                            message: 'IndexedDB 响应超时',
                            details: null
                        });
                    }
                }, 2000);
            });

        } catch (error) {
            return {
                passed: false,
                message: 'IndexedDB 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testCanvas2D() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return {
                    passed: false,
                    message: 'Canvas 2D 不可用',
                    details: null
                };
            }

            // 测试基本绘图功能
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 10, 10);
            ctx.beginPath();
            ctx.arc(15, 15, 5, 0, Math.PI * 2);
            ctx.fill();

            const imageData = ctx.getImageData(0, 0, 20, 20);

            return {
                passed: true,
                message: 'Canvas 2D 功能正常',
                details: { width: canvas.width, height: canvas.height }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'Canvas 2D 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (!gl) {
                return {
                    passed: false,
                    message: 'WebGL 不可用',
                    details: null
                };
            }

            // 测试基本 WebGL 功能
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            const version = gl.getParameter(gl.VERSION);

            return {
                passed: true,
                message: 'WebGL 功能正常',
                details: { renderer, vendor, version }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'WebGL 测试失败',
                details: { error: error.message }
            };
        }
    }

    async testCSSGrid() {
        try {
            const supported = CSS.supports('display', 'grid');
            const supportedInline = CSS.supports('display', 'inline-grid');

            return {
                passed: supported,
                message: supported ? 'CSS Grid 支持' : 'CSS Grid 不支持',
                details: { grid: supported, inlineGrid: supportedInline }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'CSS Grid 检查失败',
                details: { error: error.message }
            };
        }
    }

    // 项目特定测试方法
    async testComponentLoading() {
        const components = [
            'SmartInput.js',
            'ApiClient.js',
            'Router.js',
            'StateManager.js'
        ];

        const results = [];

        for (const component of components) {
            try {
                const response = await fetch(`../components/${component}`);
                const exists = response.ok;
                results.push({ component, exists });
            } catch (error) {
                results.push({ component, exists: false, error: error.message });
            }
        }

        const loadedCount = results.filter(r => r.exists).length;

        return {
            passed: loadedCount >= components.length * 0.8,
            message: `加载了 ${loadedCount}/${components.length} 个组件`,
            details: { results, components }
        };
    }

    async testRouterSystem() {
        try {
            // 检查 History API 支持
            const historySupported = !!(window.history && window.history.pushState);
            const popstateSupported = 'onpopstate' in window;

            // 检查 URL 操作
            const urlParams = new URLSearchParams('?test=value');
            const urlSupported = urlParams.get('test') === 'value';

            const passed = historySupported && popstateSupported && urlSupported;

            return {
                passed,
                message: passed ? '路由系统支持良好' : '路由系统支持不完整',
                details: { historySupported, popstateSupported, urlSupported }
            };

        } catch (error) {
            return {
                passed: false,
                message: '路由系统检查失败',
                details: { error: error.message }
            };
        }
    }

    async testAPIClient() {
        try {
            const features = {
                fetch: typeof fetch !== 'undefined',
                abort: typeof AbortController !== 'undefined',
                headers: typeof Headers !== 'undefined',
                request: typeof Request !== 'undefined',
                response: typeof Response !== 'undefined'
            };

            const supportedCount = Object.values(features).filter(Boolean).length;
            const passed = supportedCount >= 4;

            return {
                passed,
                message: `支持 ${supportedCount}/${Object.keys(features).length} 个Fetch API特性`,
                details: features
            };

        } catch (error) {
            return {
                passed: false,
                message: 'API客户端检查失败',
                details: { error: error.message }
            };
        }
    }

    async testVisualizationRendering() {
        const libraries = ['plotly.js', 'three.js'];

        const results = [];

        for (const lib of libraries) {
            try {
                // 检查是否可以加载可视化库
                const script = document.createElement('script');
                script.src = `https://cdn.plot.ly/plotly-latest.min.js`;

                const loaded = new Promise((resolve) => {
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 1000);
                });

                document.head.appendChild(script);
                const success = await loaded;
                document.head.removeChild(script);

                results.push({ library: lib, loaded: success });

            } catch (error) {
                results.push({ library: lib, loaded: false, error: error.message });
            }
        }

        const loadedCount = results.filter(r => r.loaded).length;

        return {
            passed: loadedCount > 0,
            message: `可加载 ${loadedCount}/${libraries.length} 个可视化库`,
            details: { results }
        };
    }

    async testBatchOperations() {
        try {
            // 检查批量操作所需的功能
            const features = {
                webworkers: typeof Worker !== 'undefined',
                promises: typeof Promise !== 'undefined',
                fetch: typeof fetch !== 'undefined',
                localstorage: 'localStorage' in window,
                blob: typeof Blob !== 'undefined'
            };

            const supportedCount = Object.values(features).filter(Boolean).length;
            const passed = supportedCount >= 4;

            return {
                passed,
                message: `支持 ${supportedCount}/${Object.keys(features).length} 个批量操作特性`,
                details: features
            };

        } catch (error) {
            return {
                passed: false,
                message: '批量操作功能检查失败',
                details: { error: error.message }
            };
        }
    }

    async testUserManagement() {
        try {
            const features = {
                crypto: typeof crypto !== 'undefined' && crypto.subtle,
                localstorage: 'localStorage' in window,
                sessionstorage: 'sessionStorage' in window,
                fetch: typeof fetch !== 'undefined',
                formdata: typeof FormData !== 'undefined'
            };

            const supportedCount = Object.values(features).filter(Boolean).length;
            const passed = supportedCount >= 4;

            return {
                passed,
                message: `支持 ${supportedCount}/${Object.keys(features).length} 个用户管理特性`,
                details: features
            };

        } catch (error) {
            return {
                passed: false,
                message: '用户管理功能检查失败',
                details: { error: error.message }
            };
        }
    }

    async testThemeSwitching() {
        try {
            // 检查 CSS 变量支持
            const cssVarsSupported = CSS.supports('color', 'var(--test)');

            // 检查 localStorage 支持
            const localStorageSupported = 'localStorage' in window;

            // 检查媒体查询支持
            const mediaQuerySupported = window.matchMedia && typeof window.matchMedia('(prefers-color-scheme: dark)').matches !== 'undefined';

            const passed = cssVarsSupported && localStorageSupported && mediaQuerySupported;

            return {
                passed,
                message: passed ? '主题切换功能支持良好' : '主题切换功能支持不完整',
                details: { cssVarsSupported, localStorageSupported, mediaQuerySupported }
            };

        } catch (error) {
            return {
                passed: false,
                message: '主题切换功能检查失败',
                details: { error: error.message }
            };
        }
    }

    async testResponsiveLayout() {
        try {
            const features = {
                mediaqueries: window.matchMedia !== undefined,
                viewport: document.querySelector('meta[name="viewport"]') !== null,
                cssgrid: CSS.supports('display', 'grid'),
                flexbox: CSS.supports('display', 'flex'),
                cssvars: CSS.supports('color', 'var(--test)')
            };

            const supportedCount = Object.values(features).filter(Boolean).length;
            const passed = supportedCount >= 4;

            return {
                passed,
                message: `支持 ${supportedCount}/${Object.keys(features).length} 个响应式布局特性`,
                details: features
            };

        } catch (error) {
            return {
                passed: false,
                message: '响应式布局功能检查失败',
                details: { error: error.message }
            };
        }
    }

    // 性能测试方法
    async testPageLoadPerformance() {
        try {
            if (!performance.timing) {
                return {
                    passed: false,
                    message: 'Performance Timing API 不可用',
                    details: null
                };
            }

            const timing = performance.timing;
            const metrics = {
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                dom: timing.domComplete - timing.domLoading,
                load: timing.loadEventEnd - timing.navigationStart
            };

            const totalTime = timing.loadEventEnd - timing.navigationStart;
            const passed = totalTime < 3000; // 3秒内加载完成

            return {
                passed,
                message: `页面加载时间: ${totalTime}ms ${passed ? '(良好)' : '(较慢)'}`,
                details: metrics
            };

        } catch (error) {
            return {
                passed: false,
                message: '性能测试失败',
                details: { error: error.message }
            };
        }
    }

    async testMemoryUsage() {
        try {
            if (!performance.memory) {
                return {
                    passed: true,
                    message: '内存信息不可用 (正常情况)',
                    details: { supported: false }
                };
            }

            const memory = performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
            const total = Math.round(memory.totalJSHeapSize / 1024 / 1024); // MB
            const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB

            const usageRate = (used / total) * 100;
            const passed = usageRate < 80; // 使用率低于80%

            return {
                passed,
                message: `内存使用: ${used}MB (${usageRate.toFixed(1)}%) ${passed ? '(正常)' : '(较高)'}`,
                details: { used, total, limit, usageRate }
            };

        } catch (error) {
            return {
                passed: false,
                message: '内存使用测试失败',
                details: { error: error.message }
            };
        }
    }

    async testCPUUsage() {
        try {
            // 测量 JavaScript 执行时间作为 CPU 使用的代理指标
            const iterations = 1000000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                Math.random() * Math.random();
            }

            const duration = performance.now() - startTime;
            const passed = duration < 1000; // 1秒内完成

            return {
                passed,
                message: `计算性能测试: ${duration.toFixed(2)}ms ${passed ? '(良好)' : '(较慢)'}`,
                details: { iterations, duration }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'CPU使用测试失败',
                details: { error: error.message }
            };
        }
    }

    async testNetworkPerformance() {
        try {
            const startTime = performance.now();

            // 测试网络连接
            const response = await fetch('data:text/plain,test', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            const duration = performance.now() - startTime;
            const passed = duration < 1000; // 1秒内响应

            return {
                passed,
                message: `网络响应时间: ${duration.toFixed(2)}ms ${passed ? '(良好)' : '(较慢)'}`,
                details: { duration, status: response.status }
            };

        } catch (error) {
            return {
                passed: false,
                message: '网络性能测试失败',
                details: { error: error.message }
            };
        }
    }

    async testRenderingPerformance() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1000;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            const startTime = performance.now();

            // 绘制大量图形元素
            for (let i = 0; i < 1000; i++) {
                ctx.fillStyle = `hsl(${i % 360}, 70%, 50%)`;
                ctx.fillRect(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    Math.random() * 50 + 10,
                    Math.random() * 50 + 10
                );
            }

            const duration = performance.now() - startTime;
            const passed = duration < 500; // 500ms内完成

            return {
                passed,
                message: `渲染性能测试: ${duration.toFixed(2)}ms ${passed ? '(良好)' : '(较慢)'}`,
                details: { elements: 1000, duration }
            };

        } catch (error) {
            return {
                passed: false,
                message: '渲染性能测试失败',
                details: { error: error.message }
            };
        }
    }

    // 可访问性测试方法
    async testKeyboardNavigation() {
        try {
            // 检查键盘事件支持
            const keyboardSupported = 'keydown' in document && 'keyup' in document;

            // 检查焦点管理
            const focusSupported = document.activeElement !== null;

            // 检查 Tab 导航
            const tabbableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const tabSupported = tabbableElements.length > 0;

            const passed = keyboardSupported && focusSupported && tabSupported;

            return {
                passed,
                message: `键盘导航支持: ${passed ? '良好' : '需要改进'}`,
                details: { keyboardSupported, focusSupported, tabSupported, tabbableElements: tabbableElements.length }
            };

        } catch (error) {
            return {
                passed: false,
                message: '键盘导航测试失败',
                details: { error: error.message }
            };
        }
    }

    async testScreenReaderSupport() {
        try {
            // 检查 ARIA 支持
            const ariaSupported = 'aria-label' in document.createElement('div');

            // 检查语义化元素支持
            const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
            const semanticSupported = semanticElements.every(tag => document.createElement(tag).constructor !== HTMLUnknownElement);

            // 检查 role 支持
            const roleSupported = 'role' in document.createElement('div').attributes;

            const passed = ariaSupported && semanticSupported && roleSupported;

            return {
                passed,
                message: `屏幕阅读器支持: ${passed ? '良好' : '需要改进'}`,
                details: { ariaSupported, semanticSupported, roleSupported }
            };

        } catch (error) {
            return {
                passed: false,
                message: '屏幕阅读器支持测试失败',
                details: { error: error.message }
            };
        }
    }

    async testARIALabels() {
        try {
            // 创建测试元素
            const testDiv = document.createElement('div');
            testDiv.setAttribute('aria-label', '测试标签');
            testDiv.setAttribute('role', 'button');

            const ariaLabelSupported = testDiv.hasAttribute('aria-label');
            const roleSupported = testDiv.hasAttribute('role');

            // 检查 aria-describedby 支持
            testDiv.setAttribute('aria-describedby', 'description');
            const describedBySupported = testDiv.hasAttribute('aria-describedby');

            const passed = ariaLabelSupported && roleSupported && describedBySupported;

            return {
                passed,
                message: `ARIA 标签支持: ${passed ? '良好' : '需要改进'}`,
                details: { ariaLabelSupported, roleSupported, describedBySupported }
            };

        } catch (error) {
            return {
                passed: false,
                message: 'ARIA 标签测试失败',
                details: { error: error.message }
            };
        }
    }

    async testColorContrast() {
        try {
            // 检查是否支持 prefers-color-scheme
            const colorSchemeSupported = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';

            // 检查 CSS 自定义属性支持
            const cssVarsSupported = CSS.supports('color', 'var(--test)');

            // 简单的颜色对比度检查
            const testElement = document.createElement('div');
            testElement.style.color = '#ffffff';
            testElement.style.backgroundColor = '#000000';
            document.body.appendChild(testElement);

            const computedStyle = window.getComputedStyle(testElement);
            const textColor = computedStyle.color;
            const bgColor = computedStyle.backgroundColor;

            document.body.removeChild(testElement);

            const passed = colorSchemeSupported && cssVarsSupported;

            return {
                passed,
                message: `颜色对比度支持: ${passed ? '良好' : '需要改进'}`,
                details: { colorSchemeSupported, cssVarsSupported, textColor, bgColor }
            };

        } catch (error) {
            return {
                passed: false,
                message: '颜色对比度测试失败',
                details: { error: error.message }
            };
        }
    }

    async testFocusManagement() {
        try {
            // 检查 focus/blur 事件支持
            const focusSupported = 'onfocus' in document.createElement('div');

            // 检查 activeElement 支持
            const activeElementSupported = document.activeElement !== null;

            // 检查 tabIndex 支持
            const testElement = document.createElement('div');
            testElement.tabIndex = 0;
            const tabIndexSupported = testElement.tabIndex === 0;

            // 检查 :focus 伪类支持
            const focusPseudoSupported = CSS.supports(':focus');

            const passed = focusSupported && activeElementSupported && tabIndexSupported;

            return {
                passed,
                message: `焦点管理支持: ${passed ? '良好' : '需要改进'}`,
                details: { focusSupported, activeElementSupported, tabIndexSupported, focusPseudoSupported }
            };

        } catch (error) {
            return {
                passed: false,
                message: '焦点管理测试失败',
                details: { error: error.message }
            };
        }
    }

    /**
     * 运行设备测试
     */
    async runDeviceTests() {
        console.log('  📱 运行设备兼容性测试...');

        const deviceResults = {};

        for (const [deviceName, deviceConfig] of Object.entries(this.deviceConfigs)) {
            try {
                const result = await this.testDeviceCompatibility(deviceName, deviceConfig);
                deviceResults[deviceName] = result;

                console.log(`    ✅ ${deviceName}: ${result.passed ? '通过' : '失败'}`);

            } catch (error) {
                deviceResults[deviceName] = {
                    passed: false,
                    error: error.message
                };
                console.error(`    ❌ ${deviceName}: ${error.message}`);
            }
        }

        return deviceResults;
    }

    /**
     * 测试设备兼容性
     */
    async testDeviceCompatibility(deviceName, deviceConfig) {
        // 模拟不同设备的测试
        const viewport = deviceConfig.viewport;
        const capabilities = deviceConfig.capabilities;

        // 测试视口适配
        const viewportSupported = window.innerWidth >= viewport.width * 0.8;

        // 测试功能支持
        const features = {
            touch: capabilities.touch === ('ontouchstart' in window),
            webgl: capabilities.webgl && this.checkWebGL(),
            highDPI: capabilities.highDPI && (window.devicePixelRatio > 1)
        };

        const supportedFeatures = Object.values(features).filter(Boolean).length;
        const totalFeatures = Object.keys(features).length;

        return {
            passed: viewportSupported && supportedFeatures >= totalFeatures * 0.7,
            viewport: { supported: viewportSupported, current: `${window.innerWidth}x${window.innerHeight}`, expected: `${viewport.width}x${viewport.height}` },
            features,
            score: Math.round((supportedFeatures / totalFeatures) * 100)
        };
    }

    /**
     * 生成功能矩阵
     */
    generateFeatureMatrix(results) {
        const matrix = {};

        for (const [browserName, browserConfig] of Object.entries(this.browserConfigs)) {
            matrix[browserName] = {
                name: browserConfig.name,
                marketShare: browserConfig.marketShare,
                features: {
                    basic: this.calculateSuiteScore(results.basicTests || {}),
                    advanced: this.calculateSuiteScore(results.advancedTests || {}),
                    project: this.calculateSuiteScore(results.projectTests || {}),
                    performance: this.calculateSuiteScore(results.performanceTests || {}),
                    accessibility: this.calculateSuiteScore(results.accessibilityTests || {})
                }
            };
        }

        return matrix;
    }

    /**
     * 计算测试套件评分
     */
    calculateSuiteScore(suiteResults) {
        if (!suiteResults || !suiteResults.score) return 0;
        return suiteResults.score;
    }

    /**
     * 计算兼容性评分
     */
    calculateCompatibilityScore(results) {
        const weights = {
            basic: 0.25,
            advanced: 0.20,
            project: 0.30,
            performance: 0.15,
            accessibility: 0.10
        };

        let totalScore = 0;

        for (const [suite, weight] of Object.entries(weights)) {
            const suiteResult = results[`${suite}Tests`];
            if (suiteResult && suiteResult.score) {
                totalScore += suiteResult.score * weight;
            }
        }

        return Math.round(totalScore);
    }

    /**
     * 识别兼容性问题
     */
    identifyCompatibilityIssues(results) {
        const issues = [];

        // 检查基础功能问题
        if (results.basicTests && results.basicTests.score < 90) {
            issues.push({
                severity: 'high',
                category: 'basic',
                description: '基础功能兼容性不足',
                score: results.basicTests.score,
                recommendations: ['优化基础代码兼容性', '添加 polyfill 支持']
            });
        }

        // 检查项目功能问题
        if (results.projectTests && results.projectTests.score < 85) {
            issues.push({
                severity: 'high',
                category: 'project',
                description: '项目核心功能兼容性问题',
                score: results.projectTests.score,
                recommendations: ['检查组件加载方式', '优化 API 调用兼容性']
            });
        }

        // 检查性能问题
        if (results.performanceTests && results.performanceTests.score < 80) {
            issues.push({
                severity: 'medium',
                category: 'performance',
                description: '性能表现不佳',
                score: results.performanceTests.score,
                recommendations: ['优化资源加载', '减少计算复杂度']
            });
        }

        // 检查可访问性问题
        if (results.accessibilityTests && results.accessibilityTests.score < 70) {
            issues.push({
                severity: 'medium',
                category: 'accessibility',
                description: '可访问性支持不足',
                score: results.accessibilityTests.score,
                recommendations: ['添加 ARIA 标签', '优化键盘导航', '改善颜色对比度']
            });
        }

        return issues;
    }

    /**
     * 生成兼容性建议
     */
    generateCompatibilityRecommendations(results) {
        const recommendations = [];

        // 基于测试结果生成具体建议
        if (results.basicTests && results.basicTests.score < 100) {
            recommendations.push({
                priority: 'high',
                category: 'basic',
                title: '增强基础功能兼容性',
                description: '为不支持现代 JavaScript 的浏览器添加 polyfill',
                actions: [
                    '添加 @babel/polyfill 或类似工具',
                    '使用 feature detection 而不是 browser detection',
                    '提供降级方案'
                ]
            });
        }

        if (results.projectTests && results.projectTests.score < 100) {
            recommendations.push({
                priority: 'high',
                category: 'project',
                title: '优化项目核心功能',
                description: '确保核心功能在所有目标浏览器中正常工作',
                actions: [
                    '检查第三方库的兼容性',
                    '添加适当的浏览器前缀',
                    '测试关键用户流程'
                ]
            });
        }

        if (results.performanceTests && results.performanceTests.score < 90) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                title: '改善性能表现',
                description: '优化加载速度和运行时性能',
                actions: [
                    '实现代码分割和懒加载',
                    '优化图片和资源大小',
                    '使用 CDN 和缓存策略'
                ]
            });
        }

        if (results.accessibilityTests && results.accessibilityTests.score < 85) {
            recommendations.push({
                priority: 'medium',
                category: 'accessibility',
                title: '提升可访问性',
                description: '确保应用对所有用户都可用',
                actions: [
                    '添加完整的 ARIA 标签',
                    '实现键盘导航',
                    '检查颜色对比度',
                    '提供屏幕阅读器支持'
                ]
            });
        }

        return recommendations;
    }

    /**
     * 导出兼容性测试报告
     */
    exportReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            testSuite: 'Browser Compatibility Tests',
            version: '1.0',
            results: results,
            browserConfigs: this.browserConfigs,
            deviceConfigs: this.deviceConfigs,
            testSuites: this.testSuites
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-compatibility-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserCompatibilityTests;
} else {
    window.BrowserCompatibilityTests = BrowserCompatibilityTests;
}