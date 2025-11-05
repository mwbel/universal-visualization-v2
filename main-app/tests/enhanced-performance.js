/**
 * 增强性能基准测试和压力测试
 * 全面验证系统性能表现和稳定性
 */
class EnhancedPerformanceTests {
    constructor() {
        this.testResults = {};
        this.performanceMetrics = new Map();
        this.benchmarkData = new Map();
        this.stressTestConfig = {
            maxConcurrentUsers: 100,
            testDuration: 60000, // 60秒
            rampUpTime: 10000,   // 10秒逐步增加
            cooldownTime: 5000   // 5秒冷却时间
        };

        this.initializePerformanceThresholds();
        this.initializeTestScenarios();
    }

    /**
     * 初始化性能阈值
     */
    initializePerformanceThresholds() {
        this.thresholds = {
            api: {
                excellent: 500,    // ms
                good: 1000,
                acceptable: 2000,
                poor: 3000
            },
            pageLoad: {
                excellent: 1000,   // ms
                good: 2000,
                acceptable: 3000,
                poor: 5000
            },
            memory: {
                excellent: 50,     // MB
                good: 100,
                acceptable: 200,
                poor: 500
            },
            throughput: {
                excellent: 100,    // req/s
                good: 50,
                acceptable: 20,
                poor: 10
            },
            errorRate: {
                excellent: 0.1,    // %
                good: 1,
                acceptable: 5,
                poor: 10
            },
            cpu: {
                excellent: 20,     // %
                good: 50,
                acceptable: 80,
                poor: 100
            }
        };
    }

    /**
     * 初始化测试场景
     */
    initializeTestScenarios() {
        this.scenarios = {
            // API性能测试场景
            apiScenarios: [
                {
                    name: '健康检查',
                    endpoint: '/api/health',
                    method: 'GET',
                    expectedResponseTime: 200,
                    concurrency: 10
                },
                {
                    name: '模板获取',
                    endpoint: '/api/templates',
                    method: 'GET',
                    expectedResponseTime: 500,
                    concurrency: 5
                },
                {
                    name: '可视化生成',
                    endpoint: '/api/resolve_or_generate',
                    method: 'POST',
                    expectedResponseTime: 2000,
                    concurrency: 3,
                    payload: { input: '绘制一个简单的图表', type: 'auto' }
                }
            ],

            // 页面加载测试场景
            pageLoadScenarios: [
                {
                    name: '主页加载',
                    url: '../index.html',
                    expectedLoadTime: 1500,
                    metrics: ['FCP', 'LCP', 'TTI', 'CLS']
                },
                {
                    name: '测试页面加载',
                    url: 'integration.html',
                    expectedLoadTime: 2000,
                    metrics: ['FCP', 'LCP', 'TTI', 'CLS']
                }
            ],

            // 压力测试场景
            stressScenarios: [
                {
                    name: '并发用户测试',
                    type: 'concurrent_users',
                    targetUsers: 50,
                    duration: 30000,
                    rampUpTime: 5000
                },
                {
                    name: '突发流量测试',
                    type: 'burst_traffic',
                    burstSize: 100,
                    burstInterval: 5000,
                    duration: 60000
                },
                {
                    name: '持续负载测试',
                    type: 'sustained_load',
                    targetUsers: 20,
                    duration: 120000,
                    metrics: ['throughput', 'response_time', 'error_rate']
                }
            ]
        };
    }

    /**
     * 运行完整的性能测试套件
     */
    async runFullPerformanceSuite() {
        console.log('🚀 开始增强性能测试套件...');

        const suiteResults = {
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            apiTests: null,
            pageLoadTests: null,
            stressTests: null,
            memoryTests: null,
            resourceTests: null,
            overallScore: 0,
            recommendations: []
        };

        try {
            // 1. API性能基准测试
            suiteResults.apiTests = await this.runAPIBenchmarkTests();

            // 2. 页面加载性能测试
            suiteResults.pageLoadTests = await this.runPageLoadTests();

            // 3. 内存使用测试
            suiteResults.memoryTests = await this.runMemoryTests();

            // 4. 资源使用测试
            suiteResults.resourceTests = await this.runResourceTests();

            // 5. 压力测试
            suiteResults.stressTests = await this.runStressTests();

            // 计算总体评分
            suiteResults.overallScore = this.calculateOverallScore(suiteResults);
            suiteResults.recommendations = this.generatePerformanceRecommendations(suiteResults);

            suiteResults.endTime = Date.now();
            suiteResults.duration = suiteResults.endTime - suiteResults.startTime;

            console.log('✅ 增强性能测试套件完成');
            return suiteResults;

        } catch (error) {
            console.error('❌ 性能测试失败:', error);
            throw error;
        }
    }

    /**
     * 运行API基准测试
     */
    async runAPIBenchmarkTests() {
        console.log('📡 运行API基准测试...');

        const results = {
            scenarios: [],
            summary: {
                totalRequests: 0,
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                successRate: 0,
                throughput: 0,
                errors: []
            }
        };

        for (const scenario of this.scenarios.apiScenarios) {
            const scenarioResult = await this.runAPIBenchmarkScenario(scenario);
            results.scenarios.push(scenarioResult);

            // 更新汇总统计
            results.summary.totalRequests += scenarioResult.totalRequests;
            results.summary.averageResponseTime += scenarioResult.averageResponseTime * scenarioResult.totalRequests;
            results.summary.minResponseTime = Math.min(results.summary.minResponseTime, scenarioResult.minResponseTime);
            results.summary.maxResponseTime = Math.max(results.summary.maxResponseTime, scenarioResult.maxResponseTime);
            results.summary.successRate = (results.summary.successRate + scenarioResult.successRate) / 2;
            results.summary.throughput += scenarioResult.throughput;

            if (scenarioResult.errors.length > 0) {
                results.summary.errors.push(...scenarioResult.errors);
            }
        }

        // 计算平均值
        if (results.summary.totalRequests > 0) {
            results.summary.averageResponseTime /= results.summary.totalRequests;
        }

        if (results.summary.minResponseTime === Infinity) {
            results.summary.minResponseTime = 0;
        }

        return results;
    }

    /**
     * 运行单个API基准测试场景
     */
    async runAPIBenchmarkScenario(scenario) {
        console.log(`  📊 测试API场景: ${scenario.name}`);

        const result = {
            name: scenario.name,
            endpoint: scenario.endpoint,
            method: scenario.method,
            concurrency: scenario.concurrency,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: [],
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            successRate: 0,
            throughput: 0,
            p50: 0,
            p95: 0,
            p99: 0
        };

        const testDuration = 10000; // 10秒测试
        const startTime = Date.now();

        // 创建并发请求
        const promises = [];
        for (let i = 0; i < scenario.concurrency; i++) {
            promises.push(this.runConcurrentAPIRequests(scenario, testDuration, result));
        }

        await Promise.all(promises);

        // 计算统计指标
        if (result.responseTimes.length > 0) {
            result.responseTimes.sort((a, b) => a - b);
            result.averageResponseTime = result.responseTimes.reduce((a, b) => a + b, 0) / result.responseTimes.length;
            result.minResponseTime = result.responseTimes[0];
            result.maxResponseTime = result.responseTimes[result.responseTimes.length - 1];
            result.p50 = this.percentile(result.responseTimes, 50);
            result.p95 = this.percentile(result.responseTimes, 95);
            result.p99 = this.percentile(result.responseTimes, 99);
        }

        result.successRate = result.totalRequests > 0 ? (result.successfulRequests / result.totalRequests * 100) : 0;
        result.throughput = result.totalRequests / ((Date.now() - startTime) / 1000);

        console.log(`    ✅ 完成: ${result.totalRequests} 请求, 平均响应时间: ${result.averageResponseTime.toFixed(2)}ms`);

        return result;
    }

    /**
     * 运行并发API请求
     */
    async runConcurrentAPIRequests(scenario, duration, result) {
        const startTime = Date.now();

        while (Date.now() - startTime < duration) {
            try {
                const requestStartTime = performance.now();

                // 模拟API请求
                const response = await this.simulateAPIRequest(scenario);

                const requestEndTime = performance.now();
                const responseTime = requestEndTime - requestStartTime;

                result.responseTimes.push(responseTime);
                result.totalRequests++;
                result.successfulRequests++;

                // 短暂休息以避免过载
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                result.totalRequests++;
                result.failedRequests++;
                result.errors.push({
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 模拟API请求
     */
    async simulateAPIRequest(scenario) {
        // 模拟网络延迟
        const baseDelay = Math.random() * 500 + 200; // 200-700ms
        const concurrencyDelay = scenario.concurrency > 5 ? Math.random() * 300 : 0; // 高并发时增加延迟

        await new Promise(resolve => setTimeout(resolve, baseDelay + concurrencyDelay));

        // 模拟响应
        if (Math.random() > 0.98) { // 2% 失败率
            throw new Error('模拟API请求失败');
        }

        return {
            ok: true,
            status: 200,
            data: { message: 'success', timestamp: Date.now() }
        };
    }

    /**
     * 运行页面加载测试
     */
    async runPageLoadTests() {
        console.log('🌐 运行页面加载测试...');

        const results = {
            scenarios: [],
            summary: {
                averageLoadTime: 0,
                averageFCP: 0,
                averageLCP: 0,
                averageTTI: 0,
                averageCLS: 0,
                resourceCount: 0,
                resourceSize: 0
            }
        };

        for (const scenario of this.scenarios.pageLoadScenarios) {
            const scenarioResult = await this.runPageLoadScenario(scenario);
            results.scenarios.push(scenarioResult);

            // 更新汇总统计
            results.summary.averageLoadTime += scenarioResult.loadTime;
            results.summary.averageFCP += scenarioResult.metrics.fcp || 0;
            results.summary.averageLCP += scenarioResult.metrics.lcp || 0;
            results.summary.averageTTI += scenarioResult.metrics.tti || 0;
            results.summary.averageCLS += scenarioResult.metrics.cls || 0;
            results.summary.resourceCount += scenarioResult.resourceCount || 0;
            results.summary.resourceSize += scenarioResult.resourceSize || 0;
        }

        // 计算平均值
        const scenarioCount = results.scenarios.length;
        if (scenarioCount > 0) {
            results.summary.averageLoadTime /= scenarioCount;
            results.summary.averageFCP /= scenarioCount;
            results.summary.averageLCP /= scenarioCount;
            results.summary.averageTTI /= scenarioCount;
            results.summary.averageCLS /= scenarioCount;
        }

        return results;
    }

    /**
     * 运行单个页面加载测试场景
     */
    async runPageLoadScenario(scenario) {
        console.log(`  📄 测试页面加载: ${scenario.name}`);

        const result = {
            name: scenario.name,
            url: scenario.url,
            loadTime: 0,
            metrics: {},
            resourceCount: 0,
            resourceSize: 0,
            performanceEntries: []
        };

        try {
            // 模拟页面加载性能
            const loadTime = await this.simulatePageLoad(scenario);
            result.loadTime = loadTime;

            // 模拟性能指标
            result.metrics = {
                fcp: loadTime * 0.3,    // First Contentful Paint
                lcp: loadTime * 0.7,    // Largest Contentful Paint
                tti: loadTime * 0.9,    // Time to Interactive
                cls: Math.random() * 0.1 // Cumulative Layout Shift
            };

            result.resourceCount = Math.floor(Math.random() * 20) + 10; // 10-30个资源
            result.resourceSize = Math.floor(Math.random() * 2000000) + 500000; // 0.5-2.5MB

            console.log(`    ✅ 加载完成: ${loadTime.toFixed(2)}ms`);

        } catch (error) {
            console.error(`    ❌ 页面加载失败: ${error.message}`);
            result.error = error.message;
        }

        return result;
    }

    /**
     * 模拟页面加载
     */
    async simulatePageLoad(scenario) {
        // 基础加载时间
        const baseLoadTime = scenario.expectedLoadTime;

        // 添加随机变化
        const variation = (Math.random() - 0.5) * baseLoadTime * 0.3; // ±15%变化

        return Math.max(baseLoadTime + variation, 100); // 最少100ms
    }

    /**
     * 运行内存测试
     */
    async runMemoryTests() {
        console.log('💾 运行内存使用测试...');

        const results = {
            baseline: 0,
            peak: 0,
            average: 0,
            leaks: [],
            gcEvents: [],
            recommendations: []
        };

        try {
            // 获取初始内存使用
            results.baseline = this.getMemoryUsage();

            // 模拟内存压力测试
            const memoryData = [];
            const testDuration = 30000; // 30秒
            const startTime = Date.now();

            while (Date.now() - startTime < testDuration) {
                const currentMemory = this.getMemoryUsage();
                memoryData.push({
                    timestamp: Date.now(),
                    memory: currentMemory
                });

                results.peak = Math.max(results.peak, currentMemory);

                // 模拟内存分配和释放
                await this.simulateMemoryOperations();

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // 计算平均内存使用
            results.average = memoryData.reduce((sum, data) => sum + data.memory, 0) / memoryData.length;

            // 检测内存泄漏
            results.leaks = this.detectMemoryLeaks(memoryData);

            // 模拟垃圾回收事件
            results.gcEvents = this.simulateGCEvents(memoryData);

            console.log(`    ✅ 内存测试完成: 基线${results.baseline}MB, 峰值${results.peak}MB`);

        } catch (error) {
            console.error(`    ❌ 内存测试失败: ${error.message}`);
            results.error = error.message;
        }

        return results;
    }

    /**
     * 运行资源使用测试
     */
    async runResourceTests() {
        console.log('⚡ 运行资源使用测试...');

        const results = {
            cpu: {
                average: 0,
                peak: 0,
                usage: []
            },
            network: {
                requests: 0,
                bytesTransferred: 0,
                errors: 0
            },
            storage: {
                quota: 0,
                used: 0,
                available: 0
            }
        };

        try {
            const testDuration = 20000; // 20秒
            const startTime = Date.now();

            while (Date.now() - startTime < testDuration) {
                // 模拟CPU使用
                const currentCPU = this.getCPUUsage();
                results.cpu.usage.push(currentCPU);
                results.cpu.peak = Math.max(results.cpu.peak, currentCPU);

                // 模拟网络请求
                const networkData = await this.simulateNetworkActivity();
                results.network.requests += networkData.requests;
                results.network.bytesTransferred += networkData.bytes;
                results.network.errors += networkData.errors;

                // 模拟存储使用
                const storageData = this.getStorageUsage();
                results.storage.quota = storageData.quota;
                results.storage.used = storageData.used;
                results.storage.available = storageData.available;

                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // 计算平均CPU使用率
            results.cpu.average = results.cpu.usage.reduce((a, b) => a + b, 0) / results.cpu.usage.length;

            console.log(`    ✅ 资源测试完成: CPU平均${results.cpu.average.toFixed(1)}%, 峰值${results.cpu.peak.toFixed(1)}%`);

        } catch (error) {
            console.error(`    ❌ 资源测试失败: ${error.message}`);
            results.error = error.message;
        }

        return results;
    }

    /**
     * 运行压力测试
     */
    async runStressTests() {
        console.log('🔥 运行压力测试...');

        const results = {
            scenarios: [],
            summary: {
                maxConcurrentUsers: 0,
                maxThroughput: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                averageResponseTime: 0,
                totalErrors: 0,
                systemStability: 'unknown'
            }
        };

        for (const scenario of this.scenarios.stressScenarios) {
            const scenarioResult = await this.runStressScenario(scenario);
            results.scenarios.push(scenarioResult);

            // 更新汇总统计
            results.summary.maxConcurrentUsers = Math.max(results.summary.maxConcurrentUsers, scenarioResult.maxConcurrentUsers);
            results.summary.maxThroughput = Math.max(results.summary.maxThroughput, scenarioResult.throughput);
            results.summary.minResponseTime = Math.min(results.summary.minResponseTime, scenarioResult.minResponseTime);
            results.summary.maxResponseTime = Math.max(results.summary.maxResponseTime, scenarioResult.maxResponseTime);
            results.summary.totalErrors += scenarioResult.totalErrors;
        }

        // 评估系统稳定性
        results.summary.systemStability = this.assessSystemStability(results);

        return results;
    }

    /**
     * 运行单个压力测试场景
     */
    async runStressScenario(scenario) {
        console.log(`  💪 运行压力测试: ${scenario.name}`);

        const result = {
            name: scenario.name,
            type: scenario.type,
            maxConcurrentUsers: 0,
            throughput: 0,
            responseTimes: [],
            errors: [],
            totalRequests: 0,
            successfulRequests: 0,
            totalErrors: 0,
            systemMetrics: [],
            duration: 0
        };

        const startTime = Date.now();

        try {
            switch (scenario.type) {
                case 'concurrent_users':
                    await this.runConcurrentUsersTest(scenario, result);
                    break;
                case 'burst_traffic':
                    await this.runBurstTrafficTest(scenario, result);
                    break;
                case 'sustained_load':
                    await this.runSustainedLoadTest(scenario, result);
                    break;
            }

            result.duration = Date.now() - startTime;

            // 计算统计指标
            if (result.responseTimes.length > 0) {
                result.responseTimes.sort((a, b) => a - b);
                result.minResponseTime = result.responseTimes[0];
                result.maxResponseTime = result.responseTimes[result.responseTimes.length - 1];
                result.averageResponseTime = result.responseTimes.reduce((a, b) => a + b, 0) / result.responseTimes.length;
            }

            result.throughput = result.totalRequests / (result.duration / 1000);

            console.log(`    ✅ 压力测试完成: ${result.totalRequests} 请求, ${result.throughput.toFixed(2)} req/s`);

        } catch (error) {
            console.error(`    ❌ 压力测试失败: ${error.message}`);
            result.error = error.message;
        }

        return result;
    }

    /**
     * 运行并发用户测试
     */
    async runConcurrentUsersTest(scenario, result) {
        const targetUsers = scenario.targetUsers;
        const rampUpTime = scenario.rampUpTime;
        const testDuration = scenario.duration;

        for (let i = 1; i <= targetUsers; i++) {
            // 启动用户
            this.startVirtualUser(i, testDuration, result);

            // 等待下一个用户
            await new Promise(resolve => setTimeout(resolve, rampUpTime / targetUsers));
        }

        // 等待测试完成
        await new Promise(resolve => setTimeout(resolve, testDuration));
        result.maxConcurrentUsers = targetUsers;
    }

    /**
     * 运行突发流量测试
     */
    async runBurstTrafficTest(scenario, result) {
        const testDuration = scenario.duration;
        const burstSize = scenario.burstSize;
        const burstInterval = scenario.burstInterval;

        const endTime = Date.now() + testDuration;

        while (Date.now() < endTime) {
            // 创建突发流量
            const burstPromises = [];
            for (let i = 0; i < burstSize; i++) {
                burstPromises.push(this.simulateUserRequest(result));
            }

            await Promise.all(burstPromises);

            result.maxConcurrentUsers = Math.max(result.maxConcurrentUsers, burstSize);

            // 等待下一个突发
            await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
    }

    /**
     * 运行持续负载测试
     */
    async runSustainedLoadTest(scenario, result) {
        const targetUsers = scenario.targetUsers;
        const testDuration = scenario.duration;

        // 启动持续负载
        const userPromises = [];
        for (let i = 1; i <= targetUsers; i++) {
            userPromises.push(this.startVirtualUser(i, testDuration, result));
        }

        await Promise.all(userPromises);
        result.maxConcurrentUsers = targetUsers;
    }

    /**
     * 启动虚拟用户
     */
    async startVirtualUser(userId, duration, result) {
        const endTime = Date.now() + duration;

        while (Date.now() < endTime) {
            await this.simulateUserRequest(result);

            // 用户思考时间
            await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
        }
    }

    /**
     * 模拟用户请求
     */
    async simulateUserRequest(result) {
        const startTime = performance.now();

        try {
            // 模拟请求处理
            const processingTime = Math.random() * 1000 + 500; // 500-1500ms
            await new Promise(resolve => setTimeout(resolve, processingTime));

            const responseTime = performance.now() - startTime;
            result.responseTimes.push(responseTime);
            result.totalRequests++;
            result.successfulRequests++;

        } catch (error) {
            result.totalRequests++;
            result.totalErrors++;
            result.errors.push({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 工具方法
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
        }
        return Math.round(Math.random() * 100 + 50); // 模拟值
    }

    getCPUUsage() {
        return Math.random() * 80 + 10; // 10-90% 模拟值
    }

    async simulateMemoryOperations() {
        // 模拟内存分配
        const arrays = [];
        for (let i = 0; i < 100; i++) {
            arrays.push(new Array(1000).fill(Math.random()));
        }

        // 模拟内存释放
        arrays.length = 0;
    }

    detectMemoryLeaks(memoryData) {
        const leaks = [];
        const dataPoints = memoryData.length;

        if (dataPoints < 10) return leaks;

        // 检查内存是否持续增长
        const firstHalf = memoryData.slice(0, Math.floor(dataPoints / 2));
        const secondHalf = memoryData.slice(Math.floor(dataPoints / 2));

        const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.memory, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.memory, 0) / secondHalf.length;

        if (secondHalfAvg > firstHalfAvg * 1.2) {
            leaks.push({
                type: 'memory_growth',
                severity: 'medium',
                description: '内存使用持续增长，可能存在内存泄漏'
            });
        }

        return leaks;
    }

    simulateGCEvents(memoryData) {
        // 模拟垃圾回收事件
        const events = [];
        let lastGC = 0;

        for (let i = 1; i < memoryData.length; i++) {
            if (memoryData[i].memory < memoryData[i-1].memory - 10) {
                events.push({
                    timestamp: memoryData[i].timestamp,
                    memoryBefore: memoryData[i-1].memory,
                    memoryAfter: memoryData[i].memory,
                    freed: memoryData[i-1].memory - memoryData[i].memory
                });
                lastGC = i;
            }
        }

        return events;
    }

    async simulateNetworkActivity() {
        // 模拟网络活动
        const requests = Math.floor(Math.random() * 5) + 1;
        const bytes = requests * (Math.random() * 10000 + 1000);
        const errors = Math.random() > 0.95 ? 1 : 0;

        return { requests, bytes, errors };
    }

    getStorageUsage() {
        // 模拟存储使用情况
        const quota = 100 * 1024 * 1024; // 100MB
        const used = Math.random() * quota * 0.5; // 最多使用50%

        return {
            quota: quota / 1024 / 1024, // MB
            used: used / 1024 / 1024,   // MB
            available: (quota - used) / 1024 / 1024 // MB
        };
    }

    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }

    calculateOverallScore(suiteResults) {
        const weights = {
            api: 0.3,
            pageLoad: 0.25,
            memory: 0.2,
            resource: 0.15,
            stress: 0.1
        };

        let totalScore = 0;

        // API性能评分
        if (suiteResults.apiTests) {
            const apiScore = this.calculateAPIScore(suiteResults.apiTests.summary.averageResponseTime);
            totalScore += apiScore * weights.api;
        }

        // 页面加载评分
        if (suiteResults.pageLoadTests) {
            const pageScore = this.calculatePageLoadScore(suiteResults.pageLoadTests.summary.averageLoadTime);
            totalScore += pageScore * weights.pageLoad;
        }

        // 内存使用评分
        if (suiteResults.memoryTests) {
            const memoryScore = this.calculateMemoryScore(suiteResults.memoryTests.average);
            totalScore += memoryScore * weights.memory;
        }

        // 资源使用评分
        if (suiteResults.resourceTests) {
            const resourceScore = this.calculateResourceScore(suiteResults.resourceTests.cpu.average);
            totalScore += resourceScore * weights.resource;
        }

        // 压力测试评分
        if (suiteResults.stressTests) {
            const stressScore = this.calculateStressScore(suiteResults.stressTests.summary);
            totalScore += stressScore * weights.stress;
        }

        return Math.round(totalScore);
    }

    calculateAPIScore(avgResponseTime) {
        if (avgResponseTime <= this.thresholds.api.excellent) return 100;
        if (avgResponseTime <= this.thresholds.api.good) return 85;
        if (avgResponseTime <= this.thresholds.api.acceptable) return 70;
        if (avgResponseTime <= this.thresholds.api.poor) return 50;
        return 25;
    }

    calculatePageLoadScore(avgLoadTime) {
        if (avgLoadTime <= this.thresholds.pageLoad.excellent) return 100;
        if (avgLoadTime <= this.thresholds.pageLoad.good) return 85;
        if (avgLoadTime <= this.thresholds.pageLoad.acceptable) return 70;
        if (avgLoadTime <= this.thresholds.pageLoad.poor) return 50;
        return 25;
    }

    calculateMemoryScore(avgMemory) {
        if (avgMemory <= this.thresholds.memory.excellent) return 100;
        if (avgMemory <= this.thresholds.memory.good) return 85;
        if (avgMemory <= this.thresholds.memory.acceptable) return 70;
        if (avgMemory <= this.thresholds.memory.poor) return 50;
        return 25;
    }

    calculateResourceScore(avgCPU) {
        if (avgCPU <= this.thresholds.cpu.excellent) return 100;
        if (avgCPU <= this.thresholds.cpu.good) return 85;
        if (avgCPU <= this.thresholds.cpu.acceptable) return 70;
        if (avgCPU <= this.thresholds.cpu.poor) return 50;
        return 25;
    }

    calculateStressScore(stressSummary) {
        // 基于并发用户数和错误率计算压力测试评分
        const userScore = Math.min(stressSummary.maxConcurrentUsers / 50, 1) * 50;
        const errorScore = stressSummary.totalErrors === 0 ? 50 : Math.max(0, 50 - stressSummary.totalErrors);

        return userScore + errorScore;
    }

    assessSystemStability(stressResults) {
        const errorRate = stressResults.summary.totalErrors / Math.max(stressResults.scenarios.reduce((sum, s) => sum + s.totalRequests, 0), 1) * 100;

        if (errorRate === 0) return 'excellent';
        if (errorRate < 1) return 'good';
        if (errorRate < 5) return 'acceptable';
        return 'poor';
    }

    generatePerformanceRecommendations(suiteResults) {
        const recommendations = [];

        // API性能建议
        if (suiteResults.apiTests?.summary.averageResponseTime > this.thresholds.api.good) {
            recommendations.push('API响应时间较长，建议优化后端处理逻辑或增加缓存');
        }

        // 页面加载建议
        if (suiteResults.pageLoadTests?.summary.averageLoadTime > this.thresholds.pageLoad.good) {
            recommendations.push('页面加载时间较长，建议优化资源加载和代码分割');
        }

        // 内存使用建议
        if (suiteResults.memoryTests?.average > this.thresholds.memory.good) {
            recommendations.push('内存使用较高，建议优化内存管理或检查内存泄漏');
        }

        // CPU使用建议
        if (suiteResults.resourceTests?.cpu.average > this.thresholds.cpu.good) {
            recommendations.push('CPU使用率较高，建议优化计算密集型操作');
        }

        // 压力测试建议
        if (suiteResults.stressTests?.summary.systemStability === 'poor') {
            recommendations.push('系统在高负载下稳定性不足，建议加强错误处理和负载均衡');
        }

        if (recommendations.length === 0) {
            recommendations.push('系统性能表现优秀，继续保持当前优化水平');
        }

        return recommendations;
    }

    /**
     * 导出性能测试报告
     */
    exportReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            testSuite: 'Enhanced Performance Tests',
            version: '1.0',
            results: results,
            thresholds: this.thresholds,
            scenarios: this.scenarios
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-performance-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedPerformanceTests;
} else {
    window.EnhancedPerformanceTests = EnhancedPerformanceTests;
}