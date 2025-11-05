/**
 * 批量操作系统
 * 支持批量生成、管理、导出可视化内容
 */
class BatchOperations {
    constructor() {
        this.currentBatch = [];
        this.batchHistory = [];
        this.batchQueue = [];
        this.isProcessing = false;
        this.maxConcurrent = 3; // 最大并发数
        this.retryAttempts = 3;
        this.eventListeners = new Map();

        this.initializeEventHandlers();
    }

    /**
     * 初始化事件处理器
     */
    initializeEventHandlers() {
        this.eventListeners.set('batchStart', []);
        this.eventListeners.set('batchProgress', []);
        this.eventListeners.set('batchComplete', []);
        this.eventListeners.set('batchError', []);
        this.eventListeners.set('itemComplete', []);
        this.eventListeners.set('itemError', []);
    }

    /**
     * 添加事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    addEventListener(eventType, callback) {
        if (this.eventListeners.has(eventType)) {
            this.eventListeners.get(eventType).push(callback);
        }
    }

    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {*} data - 事件数据
     */
    triggerEvent(eventType, data) {
        const listeners = this.eventListeners.get(eventType) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Event handler error for ${eventType}:`, error);
            }
        });
    }

    /**
     * 创建批量操作
     * @param {Array} items - 操作项目
     * @param {Object} options - 选项
     * @returns {Object} 批量操作对象
     */
    createBatch(items, options = {}) {
        const batch = {
            id: this.generateBatchId(),
            items: items.map((item, index) => ({
                id: `item-${index}`,
                data: item,
                status: 'pending',
                result: null,
                error: null,
                attempts: 0,
                startTime: null,
                endTime: null,
                duration: null
            })),
            options: {
                priority: options.priority || 'normal',
                maxConcurrent: options.maxConcurrent || this.maxConcurrent,
                retryAttempts: options.retryAttempts || this.retryAttempts,
                timeout: options.timeout || 30000,
                continueOnError: options.continueOnError || true,
                ...options
            },
            status: 'created',
            startTime: null,
            endTime: null,
            totalItems: items.length,
            completedItems: 0,
            failedItems: 0,
            progress: 0
        };

        this.currentBatch = batch;
        this.triggerEvent('batchCreated', batch);

        return batch;
    }

    /**
     * 执行批量操作
     * @param {Object} batch - 批量操作对象
     * @param {Function} processor - 处理函数
     * @returns {Promise} 执行结果
     */
    async executeBatch(batch, processor) {
        if (this.isProcessing) {
            throw new Error('另一个批量操作正在进行中');
        }

        this.isProcessing = true;
        batch.status = 'running';
        batch.startTime = Date.now();

        this.triggerEvent('batchStart', batch);

        try {
            await this.processBatchItems(batch, processor);
            batch.status = 'completed';
            batch.endTime = Date.now();

            this.triggerEvent('batchComplete', batch);

        } catch (error) {
            batch.status = 'failed';
            batch.endTime = Date.now();
            batch.error = error.message;

            this.triggerEvent('batchError', { batch, error });
        } finally {
            this.isProcessing = false;
            this.batchHistory.push({ ...batch });
            this.currentBatch = null;
        }

        return batch;
    }

    /**
     * 处理批量项目
     * @param {Object} batch - 批量操作对象
     * @param {Function} processor - 处理函数
     */
    async processBatchItems(batch, processor) {
        const { items, options } = batch;
        const maxConcurrent = options.maxConcurrent;

        // 分组处理
        for (let i = 0; i < items.length; i += maxConcurrent) {
            const chunk = items.slice(i, i + maxConcurrent);
            const promises = chunk.map(item => this.processItem(item, processor, batch));

            try {
                await Promise.allSettled(promises);
            } catch (error) {
                if (!options.continueOnError) {
                    throw error;
                }
            }

            // 更新进度
            batch.completedItems = items.filter(item => item.status === 'completed').length;
            batch.failedItems = items.filter(item => item.status === 'failed').length;
            batch.progress = Math.round((batch.completedItems + batch.failedItems) / batch.totalItems * 100);

            this.triggerEvent('batchProgress', batch);
        }
    }

    /**
     * 处理单个项目
     * @param {Object} item - 项目对象
     * @param {Function} processor - 处理函数
     * @param {Object} batch - 批量操作对象
     */
    async processItem(item, processor, batch) {
        item.status = 'processing';
        item.startTime = Date.now();
        item.attempts++;

        try {
            // 设置超时
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('操作超时')), batch.options.timeout);
            });

            // 执行处理函数
            const processPromise = processor(item.data, item, batch);

            const result = await Promise.race([processPromise, timeoutPromise]);

            item.status = 'completed';
            item.result = result;
            item.endTime = Date.now();
            item.duration = item.endTime - item.startTime;

            this.triggerEvent('itemComplete', { item, batch });

        } catch (error) {
            item.error = error.message;
            item.endTime = Date.now();
            item.duration = item.endTime - item.startTime;

            // 重试逻辑
            if (item.attempts < batch.options.retryAttempts) {
                item.status = 'retrying';
                await new Promise(resolve => setTimeout(resolve, 1000 * item.attempts));
                return this.processItem(item, processor, batch);
            } else {
                item.status = 'failed';
                this.triggerEvent('itemError', { item, batch, error });

                if (!batch.options.continueOnError) {
                    throw error;
                }
            }
        }
    }

    /**
     * 取消批量操作
     */
    cancelBatch() {
        if (this.currentBatch) {
            this.currentBatch.status = 'cancelled';
            this.currentBatch.endTime = Date.now();
            this.isProcessing = false;
            this.triggerEvent('batchCancelled', this.currentBatch);
        }
    }

    /**
     * 暂停批量操作
     */
    pauseBatch() {
        if (this.currentBatch && this.currentBatch.status === 'running') {
            this.currentBatch.status = 'paused';
            this.triggerEvent('batchPaused', this.currentBatch);
        }
    }

    /**
     * 恢复批量操作
     */
    resumeBatch() {
        if (this.currentBatch && this.currentBatch.status === 'paused') {
            this.currentBatch.status = 'running';
            this.triggerEvent('batchResumed', this.currentBatch);
        }
    }

    /**
     * 生成批量ID
     */
    generateBatchId() {
        return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取批量统计
     * @param {Object} batch - 批量操作对象
     * @returns {Object} 统计信息
     */
    getBatchStats(batch) {
        const completed = batch.items.filter(item => item.status === 'completed');
        const failed = batch.items.filter(item => item.status === 'failed');
        const processing = batch.items.filter(item => item.status === 'processing');
        const pending = batch.items.filter(item => item.status === 'pending');

        return {
            total: batch.totalItems,
            completed: completed.length,
            failed: failed.length,
            processing: processing.length,
            pending: pending.length,
            progress: batch.progress,
            successRate: batch.totalItems > 0 ? Math.round((completed.length / batch.totalItems) * 100) : 0,
            avgDuration: completed.length > 0
                ? Math.round(completed.reduce((sum, item) => sum + item.duration, 0) / completed.length)
                : 0,
            totalDuration: batch.endTime ? batch.endTime - batch.startTime : Date.now() - batch.startTime
        };
    }

    /**
     * 导出批量结果
     * @param {Object} batch - 批量操作对象
     * @param {string} format - 导出格式 ('json', 'csv', 'zip')
     * @returns {Blob} 导出数据
     */
    async exportBatchResults(batch, format = 'json') {
        const results = batch.items
            .filter(item => item.status === 'completed')
            .map(item => ({
                id: item.id,
                data: item.data,
                result: item.result,
                duration: item.duration,
                timestamp: new Date(item.startTime).toISOString()
            }));

        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(results, batch);
            case 'csv':
                return this.exportAsCSV(results, batch);
            case 'zip':
                return this.exportAsZip(results, batch);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 导出为JSON
     */
    exportAsJSON(results, batch) {
        const exportData = {
            batchId: batch.id,
            exportTime: new Date().toISOString(),
            stats: this.getBatchStats(batch),
            results: results
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    /**
     * 导出为CSV
     */
    exportAsCSV(results, batch) {
        if (results.length === 0) {
            return new Blob([''], { type: 'text/csv' });
        }

        // 提取表头
        const headers = ['ID', '输入数据', '结果', '耗时(ms)', '时间戳'];
        const csvRows = [headers.join(',')];

        // 添加数据行
        results.forEach(result => {
            const row = [
                `"${result.id}"`,
                `"${JSON.stringify(result.data).replace(/"/g, '""')}"`,
                `"${JSON.stringify(result.result).replace(/"/g, '""')}"`,
                result.duration,
                `"${result.timestamp}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        return new Blob([csvString], { type: 'text/csv' });
    }

    /**
     * 导出为ZIP
     */
    async exportAsZip(results, batch) {
        // 这里需要引入JSZip库
        // 为了简化，这里返回JSON格式的ZIP替代方案
        const jsonBlob = this.exportAsJSON(results, batch);
        const zipContent = {
            'batch-results.json': jsonBlob,
            'batch-stats.txt': new Blob([JSON.stringify(this.getBatchStats(batch), null, 2)], { type: 'text/plain' })
        };

        // 实际实现中应该使用JSZip创建真正的ZIP文件
        return jsonBlob;
    }

    /**
     * 批量生成可视化
     * @param {Array} requests - 生成请求列表
     * @param {Object} options - 选项
     * @returns {Promise} 批量操作结果
     */
    async batchGenerateVisualizations(requests, options = {}) {
        const batch = this.createBatch(requests, {
            priority: options.priority || 'normal',
            maxConcurrent: options.maxConcurrent || 2, // 可视化生成限制并发
            timeout: options.timeout || 60000, // 1分钟超时
            ...options
        });

        return this.executeBatch(batch, async (request, item, batch) => {
            // 这里调用API生成可视化
            const apiClient = new ApiClient();
            const response = await apiClient.request('POST', '/api/resolve_or_generate', {
                input: request.input,
                type: request.type,
                parameters: request.parameters || {}
            });

            if (!response.ok) {
                throw new Error(`生成失败: ${response.statusText}`);
            }

            return await response.json();
        });
    }

    /**
     * 批量参数调整
     * @param {Array} items - 参数调整项列表
     * @param {Object} options - 选项
     * @returns {Promise} 批量操作结果
     */
    async batchAdjustParameters(items, options = {}) {
        const batch = this.createBatch(items, {
            priority: options.priority || 'high',
            maxConcurrent: options.maxConcurrent || 5,
            timeout: options.timeout || 10000,
            ...options
        });

        return this.executeBatch(batch, async (item, batchItem, batch) => {
            // 参数调整逻辑
            const { visualizationId, parameters, adjustments } = item;

            // 应用参数调整
            const adjustedParams = { ...parameters };
            for (const [key, adjustment] of Object.entries(adjustments)) {
                if (typeof adjustment === 'function') {
                    adjustedParams[key] = adjustment(adjustedParams[key]);
                } else {
                    adjustedParams[key] = adjustment;
                }
            }

            // 调用API更新可视化
            const apiClient = new ApiClient();
            const response = await apiClient.request('PUT', `/api/visualizations/${visualizationId}`, {
                parameters: adjustedParams
            });

            if (!response.ok) {
                throw new Error(`参数调整失败: ${response.statusText}`);
            }

            return await response.json();
        });
    }

    /**
     * 批量导出功能
     * @param {Array} items - 导出项目列表
     * @param {string} format - 导出格式
     * @param {Object} options - 选项
     * @returns {Promise} 批量操作结果
     */
    async batchExport(items, format = 'png', options = {}) {
        const batch = this.createBatch(items, {
            priority: options.priority || 'normal',
            maxConcurrent: options.maxConcurrent || 3,
            timeout: options.timeout || 30000,
            ...options
        });

        return this.executeBatch(batch, async (item, batchItem, batch) => {
            const { visualizationId, exportOptions } = item;

            // 调用导出API
            const apiClient = new ApiClient();
            const response = await apiClient.request('POST', `/api/visualizations/${visualizationId}/export`, {
                format,
                options: exportOptions || {}
            });

            if (!response.ok) {
                throw new Error(`导出失败: ${response.statusText}`);
            }

            return await response.blob();
        });
    }

    /**
     * 获取批量历史
     * @returns {Array} 历史记录
     */
    getBatchHistory() {
        return this.batchHistory.slice().sort((a, b) => b.startTime - a.startTime);
    }

    /**
     * 清理历史记录
     * @param {number} olderThan - 清理多少天前的记录
     */
    cleanupHistory(olderThan = 30) {
        const cutoffTime = Date.now() - (olderThan * 24 * 60 * 60 * 1000);
        this.batchHistory = this.batchHistory.filter(batch => batch.startTime > cutoffTime);
    }

    /**
     * 获取当前批量操作状态
     * @returns {Object|null} 当前批量操作
     */
    getCurrentBatch() {
        return this.currentBatch;
    }

    /**
     * 获取系统状态
     * @returns {Object} 系统状态
     */
    getSystemStatus() {
        return {
            isProcessing: this.isProcessing,
            currentBatch: this.currentBatch ? {
                id: this.currentBatch.id,
                status: this.currentBatch.status,
                progress: this.currentBatch.progress
            } : null,
            queueLength: this.batchQueue.length,
            maxConcurrent: this.maxConcurrent,
            historyCount: this.batchHistory.length
        };
    }
}

// 扩展：批量操作管理器
class BatchManager {
    constructor() {
        this.batches = new Map();
        this.activeBatches = new Set();
        this.scheduler = new BatchScheduler();
        this.eventEmitter = new EventTarget();
    }

    /**
     * 创建批量操作
     */
    createBatch(name, items, options = {}) {
        const batch = new BatchOperations();
        const batchId = batch.generateBatchId();

        this.batches.set(batchId, {
            id: batchId,
            name,
            batch,
            options,
            createdAt: Date.now()
        });

        return { batchId, batch };
    }

    /**
     * 执行批量操作
     */
    async executeBatch(batchId, processor) {
        const batchInfo = this.batches.get(batchId);
        if (!batchInfo) {
            throw new Error(`批量操作不存在: ${batchId}`);
        }

        this.activeBatches.add(batchId);

        try {
            const result = await batchInfo.batch.executeBatch(batchInfo.batch, processor);
            this.eventEmitter.dispatchEvent(new CustomEvent('batchComplete', {
                detail: { batchId, result }
            }));
            return result;
        } finally {
            this.activeBatches.delete(batchId);
        }
    }

    /**
     * 获取所有批量操作
     */
    getAllBatches() {
        return Array.from(this.batches.entries()).map(([id, info]) => ({
            id,
            name: info.name,
            status: info.batch.status,
            progress: info.batch.progress,
            createdAt: info.createdAt
        }));
    }

    /**
     * 取消批量操作
     */
    cancelBatch(batchId) {
        const batchInfo = this.batches.get(batchId);
        if (batchInfo) {
            batchInfo.batch.cancelBatch();
            this.activeBatches.delete(batchId);
        }
    }
}

// 批量调度器
class BatchScheduler {
    constructor() {
        this.queue = [];
        this.running = false;
        this.maxConcurrent = 2;
        this.currentJobs = 0;
    }

    /**
     * 添加任务到队列
     */
    enqueue(task) {
        this.queue.push(task);
        this.queue.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        this.processQueue();
    }

    /**
     * 处理队列
     */
    async processQueue() {
        if (this.running || this.currentJobs >= this.maxConcurrent) {
            return;
        }

        this.running = true;

        while (this.queue.length > 0 && this.currentJobs < this.maxConcurrent) {
            const task = this.queue.shift();
            this.currentJobs++;

            this.executeTask(task).finally(() => {
                this.currentJobs--;
                this.processQueue();
            });
        }

        this.running = false;
    }

    /**
     * 执行任务
     */
    async executeTask(task) {
        try {
            await task.execute();
        } catch (error) {
            console.error('Task execution failed:', error);
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BatchOperations, BatchManager, BatchScheduler };
} else {
    window.BatchOperations = BatchOperations;
    window.BatchManager = BatchManager;
    window.BatchScheduler = BatchScheduler;
}