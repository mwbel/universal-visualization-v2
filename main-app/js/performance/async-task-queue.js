/**
 * 异步任务队列处理系统
 * 任务3.2.2 - 后端性能优化核心组件
 * 目标: 异步任务处理能力 > 1000/分钟，系统稳定性 > 99.5%
 */

class AsyncTaskQueue {
    constructor(options = {}) {
        this.options = {
            concurrency: options.concurrency || 10,        // 并发处理数量
            maxRetries: options.maxRetries || 3,          // 最大重试次数
            retryDelay: options.retryDelay || 1000,       // 重试延迟
            priorityLevels: options.priorityLevels || 5,   // 优先级级别数
            batchSize: options.batchSize || 20,           // 批处理大小
            batchTimeout: options.batchTimeout || 5000,   // 批处理超时
            storage: {
                type: options.storage?.type || 'memory',  // 'memory', 'redis', 'file'
                options: options.storage?.options || {}
            },
            monitoring: {
                enabled: options.monitoring?.enabled !== false,
                metricsInterval: options.monitoring?.metricsInterval || 30000
            },
            deadLetterQueue: {
                enabled: options.deadLetterQueue?.enabled !== false,
                maxRetries: options.deadLetterQueue?.maxRetries || 5
            },
            ...options
        };

        // 队列存储
        this.queues = Array.from({ length: this.options.priorityLevels }, () => []);
        this.processing = new Set();           // 正在处理的任务
        this.completed = new Map();            // 已完成任务记录
        this.failed = [];                      // 失败任务列表
        this.deadLetterQueue = [];             // 死信队列

        // 统计信息
        this.stats = {
            totalEnqueued: 0,
            totalCompleted: 0,
            totalFailed: 0,
            totalRetries: 0,
            processingTime: 0,
            averageProcessingTime: 0,
            throughput: 0,
            lastResetTime: Date.now()
        };

        // 处理器注册表
        this.processors = new Map();

        // 事件监听器
        this.eventListeners = {
            'task:completed': [],
            'task:failed': [],
            'task:retry': [],
            'queue:empty': [],
            'queue:full': []
        };

        this.init();
    }

    /**
     * 初始化队列系统
     */
    async init() {
        try {
            // 初始化存储
            await this.initStorage();

            // 启动处理器
            this.startProcessors();

            // 启动批处理器
            if (this.options.batchSize > 1) {
                this.startBatchProcessor();
            }

            // 启动监控
            if (this.options.monitoring.enabled) {
                this.startMonitoring();
            }

            console.log('🚀 异步任务队列系统初始化完成');
            console.log(`⚙️ 配置: 并发数=${this.options.concurrency}, 优先级=${this.options.priorityLevels}`);

        } catch (error) {
            console.error('❌ 队列系统初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化存储后端
     */
    async initStorage() {
        switch (this.options.storage.type) {
            case 'redis':
                await this.initRedisStorage();
                break;
            case 'file':
                await this.initFileStorage();
                break;
            case 'memory':
            default:
                console.log('🧠 使用内存存储');
                break;
        }
    }

    async initRedisStorage() {
        // 这里应该初始化Redis连接
        console.log('🔴 Redis存储初始化（模拟）');
    }

    async initFileStorage() {
        const fs = require('fs').promises;
        try {
            await fs.mkdir('./queue-data', { recursive: true });
            console.log('📁 文件存储初始化完成');
        } catch (error) {
            console.error('❌ 文件存储初始化失败:', error);
        }
    }

    /**
     * 添加任务到队列
     */
    async enqueue(task) {
        const taskWithId = {
            id: this.generateTaskId(),
            type: task.type,
            data: task.data || {},
            priority: Math.min(Math.max(task.priority || 0, 0), this.options.priorityLevels - 1),
            attempts: 0,
            createdAt: Date.now(),
            scheduledAt: task.scheduledAt || Date.now(),
            timeout: task.timeout || 30000,
            metadata: task.metadata || {}
        };

        // 验证任务类型
        if (!this.processors.has(taskWithId.type)) {
            throw new Error(`未注册的任务类型: ${taskWithId.type}`);
        }

        // 添加到对应优先级队列
        const queue = this.queues[taskWithId.priority];
        queue.push(taskWithId);

        // 按计划执行时间排序
        queue.sort((a, b) => a.scheduledAt - b.scheduledAt);

        this.stats.totalEnqueued++;

        // 触发事件
        this.emit('task:enqueued', taskWithId);

        console.log(`📥 任务入队: ${taskWithId.id} (${taskWithId.type}, 优先级: ${taskWithId.priority})`);

        return taskWithId.id;
    }

    /**
     * 注册任务处理器
     */
    registerProcessor(type, processor, options = {}) {
        const processorConfig = {
            handler: processor,
            timeout: options.timeout || 30000,
            retries: options.retries || this.options.maxRetries,
            retryDelay: options.retryDelay || this.options.retryDelay,
            concurrent: options.concurrent !== false
        };

        this.processors.set(type, processorConfig);
        console.log(`🔧 注册处理器: ${type}`);
    }

    /**
     * 启动处理器
     */
    startProcessors() {
        for (let i = 0; i < this.options.concurrency; i++) {
            this.startProcessor(i);
        }
    }

    startProcessor(workerId) {
        const processTask = async () => {
            try {
                const task = await this.getNextTask();
                if (!task) {
                    // 没有任务时等待一段时间
                    setTimeout(processTask, 100);
                    return;
                }

                await this.processTask(task, workerId);

            } catch (error) {
                console.error(`❌ 处理器 ${workerId} 错误:`, error);
            }

            // 继续处理下一个任务
            processTask();
        };

        processTask();
    }

    /**
     * 获取下一个任务
     */
    async getNextTask() {
        const now = Date.now();

        // 按优先级顺序查找任务
        for (let priority = 0; priority < this.options.priorityLevels; priority++) {
            const queue = this.queues[priority];

            // 查找到期的任务
            for (let i = 0; i < queue.length; i++) {
                const task = queue[i];
                if (task.scheduledAt <= now) {
                    queue.splice(i, 1);
                    return task;
                }
            }
        }

        return null;
    }

    /**
     * 处理任务
     */
    async processTask(task, workerId) {
        const startTime = Date.now();
        task.startTime = startTime;
        task.workerId = workerId;

        this.processing.add(task);

        try {
            console.log(`⚙️ 处理器 ${workerId} 开始处理任务: ${task.id}`);

            const processor = this.processors.get(task.type);
            if (!processor) {
                throw new Error(`未找到处理器: ${task.type}`);
            }

            // 设置超时
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('任务处理超时')), processor.timeout);
            });

            // 执行处理器
            const processingPromise = processor.handler(task.data);

            // 等待任务完成或超时
            const result = await Promise.race([processingPromise, timeoutPromise]);

            // 任务完成
            const processingTime = Date.now() - startTime;
            this.completeTask(task, result, processingTime);

            console.log(`✅ 任务完成: ${task.id} (${processingTime}ms)`);

        } catch (error) {
            const processingTime = Date.now() - startTime;
            await this.handleTaskFailure(task, error, processingTime);
        }
    }

    /**
     * 任务完成处理
     */
    completeTask(task, result, processingTime) {
        this.processing.delete(task);

        const completedTask = {
            ...task,
            result: result,
            completedAt: Date.now(),
            processingTime: processingTime
        };

        this.completed.set(task.id, completedTask);
        this.stats.totalCompleted++;
        this.updateProcessingTimeStats(processingTime);

        // 限制完成任务记录大小
        if (this.completed.size > 10000) {
            const oldestKey = this.completed.keys().next().value;
            this.completed.delete(oldestKey);
        }

        this.emit('task:completed', completedTask);
    }

    /**
     * 任务失败处理
     */
    async handleTaskFailure(task, error, processingTime) {
        this.processing.delete(task);
        task.attempts++;

        console.error(`❌ 任务失败: ${task.id} (尝试 ${task.attempts}/${this.options.maxRetries + 1})`, error.message);

        if (task.attempts <= this.options.maxRetries) {
            // 重试任务
            await this.retryTask(task);
        } else {
            // 任务最终失败
            this.failTask(task, error, processingTime);
        }
    }

    async retryTask(task) {
        // 计算重试延迟（指数退避）
        const retryDelay = this.options.retryDelay * Math.pow(2, task.attempts - 1);
        task.scheduledAt = Date.now() + retryDelay;

        // 重新入队
        this.queues[task.priority].push(task);
        this.stats.totalRetries++;

        this.emit('task:retry', task);

        console.log(`🔄 任务重试: ${task.id} (将在 ${retryDelay}ms 后重试)`);
    }

    failTask(task, error, processingTime) {
        const failedTask = {
            ...task,
            error: error.message,
            failedAt: Date.now(),
            processingTime: processingTime
        };

        // 添加到失败列表或死信队列
        if (this.options.deadLetterQueue.enabled && task.attempts >= this.options.deadLetterQueue.maxRetries) {
            this.deadLetterQueue.push(failedTask);
            console.warn(`💀 任务进入死信队列: ${task.id}`);
        } else {
            this.failed.push(failedTask);
        }

        // 限制失败任务记录大小
        if (this.failed.length > 1000) {
            this.failed = this.failed.slice(-500);
        }

        this.stats.totalFailed++;
        this.emit('task:failed', failedTask);
    }

    /**
     * 批处理器
     */
    startBatchProcessor() {
        setInterval(async () => {
            await this.processBatch();
        }, this.options.batchTimeout);
    }

    async processBatch() {
        const tasks = [];
        const now = Date.now();

        // 收集可批量处理的任务
        for (let priority = 0; priority < this.options.priorityLevels; priority++) {
            const queue = this.queues[priority];

            while (tasks.length < this.options.batchSize && queue.length > 0) {
                const task = queue[0];
                if (task.scheduledAt <= now && task.metadata.batchable) {
                    tasks.push(queue.shift());
                } else {
                    break;
                }
            }

            if (tasks.length > 0) break;
        }

        if (tasks.length > 1) {
            await this.processBatchTasks(tasks);
        }
    }

    async processBatchTasks(tasks) {
        // 按任务类型分组
        const tasksByType = new Map();
        tasks.forEach(task => {
            if (!tasksByType.has(task.type)) {
                tasksByType.set(task.type, []);
            }
            tasksByType.get(task.type).push(task);
        });

        // 处理每种类型的批量任务
        for (const [type, batchTasks] of tasksByType) {
            const processor = this.processors.get(type);
            if (processor && processor.batchHandler) {
                try {
                    const batchData = batchTasks.map(task => task.data);
                    const results = await processor.batchHandler(batchData);

                    // 标记所有任务为完成
                    batchTasks.forEach((task, index) => {
                        this.completeTask(task, results[index], 0);
                    });

                    console.log(`📦 批量处理完成: ${type} (${batchTasks.length} 个任务)`);

                } catch (error) {
                    // 批量处理失败，单独处理每个任务
                    console.error(`❌ 批量处理失败: ${type}`, error.message);
                    for (const task of batchTasks) {
                        await this.handleTaskFailure(task, error, 0);
                    }
                }
            } else {
                // 不支持批量处理，单独处理
                for (const task of batchTasks) {
                    this.queues[task.priority].push(task);
                }
            }
        }
    }

    /**
     * 监控系统
     */
    startMonitoring() {
        setInterval(() => {
            this.collectMetrics();
            this.checkHealth();
        }, this.options.monitoring.metricsInterval);
    }

    collectMetrics() {
        const now = Date.now();
        const timeDiff = now - this.stats.lastResetTime;

        // 计算吞吐量
        this.stats.throughput = (this.stats.totalCompleted / timeDiff) * 1000; // 任务/秒

        // 计算队列深度
        const queueDepth = this.queues.reduce((sum, queue) => sum + queue.length, 0);

        // 计算成功率
        const totalTasks = this.stats.totalCompleted + this.stats.totalFailed;
        const successRate = totalTasks > 0 ? (this.stats.totalCompleted / totalTasks * 100) : 100;

        const metrics = {
            timestamp: new Date().toISOString(),
            queueDepth: queueDepth,
            processing: this.processing.size,
            completed: this.stats.totalCompleted,
            failed: this.stats.totalFailed,
            throughput: this.stats.throughput.toFixed(2),
            averageProcessingTime: this.stats.averageProcessingTime.toFixed(2),
            successRate: successRate.toFixed(2) + '%',
            deadLetterQueue: this.deadLetterQueue.length
        };

        console.log('📊 队列监控指标:', metrics);
        return metrics;
    }

    checkHealth() {
        const warnings = [];
        const errors = [];

        // 检查队列深度
        const totalQueueSize = this.queues.reduce((sum, queue) => sum + queue.length, 0);
        if (totalQueueSize > 1000) {
            errors.push('队列深度过高');
        } else if (totalQueueSize > 500) {
            warnings.push('队列深度较高');
        }

        // 检查失败率
        const totalTasks = this.stats.totalCompleted + this.stats.totalFailed;
        const failureRate = totalTasks > 0 ? (this.stats.totalFailed / totalTasks) : 0;
        if (failureRate > 0.1) {
            errors.push('失败率过高');
        } else if (failureRate > 0.05) {
            warnings.push('失败率较高');
        }

        // 检查死信队列
        if (this.deadLetterQueue.length > 100) {
            errors.push('死信队列过长');
        }

        if (errors.length > 0) {
            console.error('🚨 队列系统错误:', errors);
        }
        if (warnings.length > 0) {
            console.warn('⚠️ 队列系统警告:', warnings);
        }

        return {
            healthy: errors.length === 0,
            warnings: warnings,
            errors: errors
        };
    }

    /**
     * 任务管理方法
     */
    getTaskStatus(taskId) {
        // 检查处理中的任务
        for (const task of this.processing) {
            if (task.id === taskId) return { status: 'processing', task };
        }

        // 检查已完成的任务
        const completed = this.completed.get(taskId);
        if (completed) return { status: 'completed', task: completed };

        // 检查失败的任务
        const failed = this.failed.find(task => task.id === taskId);
        if (failed) return { status: 'failed', task: failed };

        // 检查死信队列
        const deadLetter = this.deadLetterQueue.find(task => task.id === taskId);
        if (deadLetter) return { status: 'dead_letter', task: deadLetter };

        // 检查队列中的任务
        for (const queue of this.queues) {
            const queued = queue.find(task => task.id === taskId);
            if (queued) return { status: 'queued', task: queued };
        }

        return { status: 'not_found' };
    }

    async cancelTask(taskId) {
        // 从队列中移除任务
        for (let priority = 0; priority < this.options.priorityLevels; priority++) {
            const queue = this.queues[priority];
            const index = queue.findIndex(task => task.id === taskId);
            if (index !== -1) {
                const task = queue.splice(index, 1)[0];
                this.emit('task:cancelled', task);
                console.log(`❌ 任务已取消: ${taskId}`);
                return true;
            }
        }

        return false;
    }

    async retryFailedTask(taskId) {
        const failedIndex = this.failed.findIndex(task => task.id === taskId);
        if (failedIndex !== -1) {
            const task = this.failed.splice(failedIndex, 1)[0];
            task.attempts = 0;
            task.scheduledAt = Date.now();
            return await this.enqueue(task);
        }

        return false;
    }

    clearQueue(priority = null) {
        if (priority !== null && priority >= 0 && priority < this.options.priorityLevels) {
            const cleared = this.queues[priority].length;
            this.queues[priority] = [];
            console.log(`🧹 清空优先级 ${priority} 队列: ${cleared} 个任务`);
            return cleared;
        } else {
            let totalCleared = 0;
            this.queues.forEach(queue => {
                totalCleared += queue.length;
                queue.length = 0;
            });
            console.log(`🧹 清空所有队列: ${totalCleared} 个任务`);
            return totalCleared;
        }
    }

    /**
     * 工具方法
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateProcessingTimeStats(processingTime) {
        const totalProcessingTime = this.stats.averageProcessingTime * (this.stats.totalCompleted - 1);
        this.stats.averageProcessingTime = (totalProcessingTime + processingTime) / this.stats.totalCompleted;
        this.stats.processingTime += processingTime;
    }

    /**
     * 事件系统
     */
    on(event, listener) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(listener);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ 事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 统计信息
     */
    getStats() {
        const queueDepth = this.queues.reduce((sum, queue) => sum + queue.length, 0);

        return {
            ...this.stats,
            queueDepth: queueDepth,
            processing: this.processing.size,
            completed: this.completed.size,
            failed: this.failed.length,
            deadLetterQueue: this.deadLetterQueue.length,
            registeredProcessors: this.processors.size,
            uptime: Date.now() - this.stats.lastResetTime
        };
    }

    /**
     * 系统控制
     */
    pause() {
        this.paused = true;
        console.log('⏸️ 队列系统已暂停');
    }

    resume() {
        this.paused = false;
        console.log('▶️ 队列系统已恢复');
    }

    reset() {
        this.queues = Array.from({ length: this.options.priorityLevels }, () => []);
        this.processing.clear();
        this.completed.clear();
        this.failed = [];
        this.deadLetterQueue = [];

        this.stats = {
            totalEnqueued: 0,
            totalCompleted: 0,
            totalFailed: 0,
            totalRetries: 0,
            processingTime: 0,
            averageProcessingTime: 0,
            throughput: 0,
            lastResetTime: Date.now()
        };

        console.log('🔄 队列系统已重置');
    }
}

/**
 * 任务队列装饰器
 */
function queueTask(queue, options = {}) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;

        descriptor.value = async function(...args) {
            const task = {
                type: propertyName,
                data: { args: args },
                priority: options.priority || 0,
                timeout: options.timeout,
                metadata: options.metadata || {}
            };

            if (options.async) {
                return await queue.enqueue(task);
            } else {
                // 同步执行
                return await method.apply(this, args);
            }
        };

        return descriptor;
    };
}

module.exports = {
    AsyncTaskQueue,
    queueTask
};