/**
 * debug-panel.js - 实时调试面板
 * 提供主页按钮状态监控和调试功能
 */

(function() {
    'use strict';

    // 创建调试面板样式
    const panelStyles = `
        #debug-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 320px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        }

        #debug-panel.minimized {
            height: 40px;
            overflow: hidden;
        }

        #debug-panel h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #4CAF50;
            cursor: pointer;
            user-select: none;
        }

        #debug-panel .status-item {
            margin: 5px 0;
            padding: 3px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        #debug-panel .status-success { color: #4CAF50; }
        #debug-panel .status-warning { color: #FFC107; }
        #debug-panel .status-error { color: #F44336; }
        #debug-panel .status-info { color: #2196F3; }

        #debug-panel .button-test {
            margin-top: 10px;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
        }

        #debug-panel .button-test button {
            margin: 2px;
            padding: 4px 8px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }

        #debug-panel .button-test button:hover {
            background: #1976D2;
        }

        #debug-panel .debug-log {
            max-height: 200px;
            overflow-y: auto;
            margin-top: 10px;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border-radius: 4px;
            font-size: 11px;
            line-height: 1.4;
        }

        #debug-panel .debug-log .log-entry {
            margin: 2px 0;
            padding: 2px 0;
        }

        #debug-panel .debug-log .log-time {
            color: #9E9E9E;
            margin-right: 5px;
        }
    `;

    // 创建调试面板HTML
    function createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.innerHTML = `
            <h3 id="debug-panel-title">🔧 万物可视化调试面板</h3>
            <div id="debug-content">
                <div class="status-item">
                    <span class="status-info">📊 页面状态:</span>
                    <span id="page-status">检查中...</span>
                </div>
                <div class="status-item">
                    <span class="status-info">🔗 App实例:</span>
                    <span id="app-status">检查中...</span>
                </div>
                <div class="status-item">
                    <span class="status-info">🎯 子分类按钮:</span>
                    <span id="subcategory-status">检查中...</span>
                </div>
                <div class="status-item">
                    <span class="status-info">🔄 模式按钮:</span>
                    <span id="mode-btn-status">检查中...</span>
                </div>
                <div class="status-item">
                    <span class="status-info">🚀 探索按钮:</span>
                    <span id="explore-btn-status">检查中...</span>
                </div>
                <div class="button-test">
                    <button onclick="debugPanel.testSubcategoryButtons()">测试子分类按钮</button>
                    <button onclick="debugPanel.testModeButtons()">测试模式按钮</button>
                    <button onclick="debugPanel.runFullDiagnosis()">完整诊断</button>
                    <button onclick="debugPanel.clearLog()">清空日志</button>
                </div>
                <div class="debug-log" id="debug-log">
                    <div class="log-entry">
                        <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
                        <span>调试面板已初始化</span>
                    </div>
                </div>
            </div>
        `;

        return panel;
    }

    // 添加样式
    function addStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = panelStyles;
        document.head.appendChild(styleSheet);
    }

    // 调试面板控制器
    const debugPanel = {
        init: function() {
            addStyles();
            const panel = createDebugPanel();
            document.body.appendChild(panel);

            // 绑定标题点击事件（最小化/展开）
            document.getElementById('debug-panel-title').addEventListener('click', function() {
                panel.classList.toggle('minimized');
            });

            // 初始状态检查
            this.updateStatus();

            // 定期更新状态
            setInterval(() => this.updateStatus(), 5000);

            // 添加控制台日志监听
            this.interceptConsoleLog();

            this.log('调试面板初始化完成', 'success');
        },

        updateStatus: function() {
            // 页面状态
            const pageStatus = document.getElementById('page-status');
            if (pageStatus) {
                pageStatus.textContent = document.readyState === 'complete' ? '✅ 已加载' : '⏳ 加载中';
                pageStatus.className = document.readyState === 'complete' ? 'status-success' : 'status-warning';
            }

            // App实例状态
            const appStatus = document.getElementById('app-status');
            if (appStatus) {
                const app = window.global?.app;
                if (app) {
                    appStatus.textContent = '✅ 已初始化';
                    appStatus.className = 'status-success';
                } else {
                    appStatus.textContent = '❌ 未找到';
                    appStatus.className = 'status-error';
                }
            }

            // 子分类按钮状态
            const subcategoryStatus = document.getElementById('subcategory-status');
            if (subcategoryStatus) {
                const subcategories = document.querySelectorAll('.subcategory');
                subcategoryStatus.textContent = `${subcategories.length} 个`;
                subcategoryStatus.className = subcategories.length > 0 ? 'status-success' : 'status-warning';
            }

            // 模式按钮状态
            const modeBtnStatus = document.getElementById('mode-btn-status');
            if (modeBtnStatus) {
                const modeBtns = document.querySelectorAll('.mode-btn');
                modeBtnStatus.textContent = `${modeBtns.length} 个`;
                modeBtnStatus.className = modeBtns.length > 0 ? 'status-success' : 'status-warning';
            }

            // 探索按钮状态
            const exploreBtnStatus = document.getElementById('explore-btn-status');
            if (exploreBtnStatus) {
                const exploreBtns = document.querySelectorAll('.explore-btn');
                exploreBtnStatus.textContent = `${exploreBtns.length} 个`;
                exploreBtnStatus.className = exploreBtns.length > 0 ? 'status-success' : 'status-warning';
            }
        },

        log: function(message, type = 'info') {
            const logContainer = document.getElementById('debug-log');
            if (logContainer) {
                const entry = document.createElement('div');
                entry.className = 'log-entry';

                const timeSpan = document.createElement('span');
                timeSpan.className = 'log-time';
                timeSpan.textContent = `[${new Date().toLocaleTimeString()}]`;

                const messageSpan = document.createElement('span');
                messageSpan.textContent = message;
                messageSpan.className = `status-${type}`;

                entry.appendChild(timeSpan);
                entry.appendChild(messageSpan);

                logContainer.appendChild(entry);
                logContainer.scrollTop = logContainer.scrollHeight;

                // 限制日志条数
                const entries = logContainer.querySelectorAll('.log-entry');
                if (entries.length > 50) {
                    entries[0].remove();
                }
            }
        },

        testSubcategoryButtons: function() {
            this.log('开始测试子分类按钮...', 'info');
            const subcategories = document.querySelectorAll('.subcategory');

            if (subcategories.length === 0) {
                this.log('❌ 未找到子分类按钮', 'error');
                return;
            }

            this.log(`找到 ${subcategories.length} 个子分类按钮`, 'success');

            // 测试第一个按钮
            if (subcategories[0]) {
                const testBtn = subcategories[0];
                this.log(`测试按钮: ${testBtn.querySelector('.subcategory-name')?.textContent}`, 'info');

                // 模拟点击
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });

                const originalLog = console.log;
                let clickDetected = false;

                console.log = function(...args) {
                    originalLog.apply(console, args);
                    if (args[0] && args[0].includes && args[0].includes('被点击')) {
                        clickDetected = true;
                    }
                };

                testBtn.dispatchEvent(clickEvent);

                setTimeout(() => {
                    console.log = originalLog;
                    this.log(clickDetected ? '✅ 按钮点击事件正常' : '❌ 按钮点击事件未响应', clickDetected ? 'success' : 'error');
                }, 100);
            }
        },

        testModeButtons: function() {
            this.log('开始测试模式按钮...', 'info');
            const modeBtns = document.querySelectorAll('.mode-btn');

            if (modeBtns.length === 0) {
                this.log('❌ 未找到模式按钮', 'error');
                return;
            }

            this.log(`找到 ${modeBtns.length} 个模式按钮`, 'success');

            // 测试第一个按钮
            if (modeBtns[0]) {
                const testBtn = modeBtns[0];
                this.log(`测试模式: ${testBtn.dataset.mode}`, 'info');

                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });

                testBtn.dispatchEvent(clickEvent);
                this.log('✅ 模式按钮点击完成', 'success');
            }
        },

        runFullDiagnosis: function() {
            this.log('开始完整诊断...', 'info');

            if (window.debugMainpage) {
                window.debugMainpage();
                this.log('✅ 完整诊断已启动', 'success');
            } else {
                this.log('❌ 诊断函数不可用', 'error');
            }
        },

        clearLog: function() {
            const logContainer = document.getElementById('debug-log');
            if (logContainer) {
                logContainer.innerHTML = '';
                this.log('日志已清空', 'info');
            }
        },

        interceptConsoleLog: function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            console.log = function(...args) {
                originalLog.apply(console, args);
                if (args[0] && typeof args[0] === 'string' &&
                    (args[0].includes('按钮') || args[0].includes('绑定') || args[0].includes('点击'))) {
                    debugPanel.log(args.join(' '), 'info');
                }
            };

            console.error = function(...args) {
                originalError.apply(console, args);
                debugPanel.log('ERROR: ' + args.join(' '), 'error');
            };

            console.warn = function(...args) {
                originalWarn.apply(console, args);
                debugPanel.log('WARN: ' + args.join(' '), 'warning');
            };
        }
    };

    // 初始化调试面板
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => debugPanel.init());
    } else {
        debugPanel.init();
    }

    // 导出到全局
    window.debugPanel = debugPanel;

})();