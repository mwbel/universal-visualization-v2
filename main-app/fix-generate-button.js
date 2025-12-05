/**
 * 修复生成按钮功能
 * 确保API调用正常工作
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 修复生成按钮脚本已加载');

    // 确保生成按钮功能正常
    const generateBtn = document.getElementById('generateBtn');
    const mainInput = document.getElementById('mainInput');

    if (generateBtn && mainInput) {
        console.log('✅ 找到生成按钮和输入框');

        // 强制设置按钮样式确保可见
        generateBtn.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1000 !important;
            padding: 12px 48px !important;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
            border: none !important;
            border-radius: 16px !important;
            color: white !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            cursor: pointer !important;
            align-items: center !important;
            gap: 8px !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
            margin-left: 20px !important;
        `;

        // 添加额外的点击事件监听
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('🔘 生成按钮被点击');

            // 检查输入内容
            const inputValue = mainInput.value.trim();
            if (!inputValue) {
                console.warn('⚠️ 输入内容为空');
                showMessage('请输入要生成的内容', 'warning');
                return;
            }

            console.log('📝 输入内容:', inputValue);

            // 调用生成函数
            if (window.UniversalVisFusion && window.UniversalVisFusion.handleGenerate) {
                window.UniversalVisFusion.handleGenerate();
            } else {
                console.warn('⚠️ 主应用函数不可用，使用备用生成方法');
                fallbackGenerate(inputValue);
            }
        });

        // 监听输入变化，但不禁用按钮
        mainInput.addEventListener('input', function() {
            const hasContent = this.value.trim().length > 0;
            // 不再禁用按钮，保持始终可用
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.visibility = 'visible';

            if (hasContent) {
                generateBtn.classList.add('active');
            } else {
                generateBtn.classList.remove('active');
            }
        });

        // 初始化按钮状态 - 确保按钮始终可见
        const initialValue = mainInput.value.trim();
        generateBtn.disabled = false; // 强制启用按钮，不依赖输入内容
        generateBtn.style.opacity = '1'; // 确保不透明度
        generateBtn.style.visibility = 'visible'; // 确保可见性
        generateBtn.style.display = 'flex'; // 确保显示

        console.log('🔘 按钮状态已强制设置: 可见并启用');

        console.log('✅ 生成按钮修复完成');
    } else {
        console.error('❌ 未找到生成按钮或输入框');
    }

    // 添加演示按钮功能
    const demoBtn = document.getElementById('demoFeatures');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            console.log('🎯 演示按钮被点击');

            // 填入示例内容
            if (mainInput) {
                const examplePrompts = [
                    '正态分布 均值0 标准差1',
                    '行星运动轨迹 地球 火星',
                    '简谐振动 振幅2 频率1Hz',
                    '二次函数 y = x^2 + 2x + 1'
                ];

                const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
                mainInput.value = randomPrompt;
                mainInput.dispatchEvent(new Event('input'));

                showMessage(`已填入示例: ${randomPrompt}`, 'info');

                // 滚动到输入区域
                const inputSection = document.querySelector('.input-section');
                if (inputSection) {
                    inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
});

/**
 * 备用生成方法
 */
async function fallbackGenerate(prompt) {
    console.log('🔄 使用备用生成方法:', prompt);

    // 显示加载状态
    showLoading();

    try {
        // 尝试调用正确的API端点
        const response = await fetch('http://localhost:9999/api/v2/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                subject: 'general',
                grade_level: 'high_school',
                interaction_mode: 'visualization'
            })
        });

        console.log('📡 API响应状态:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📊 API响应结果:', result);

        if (result.success) {
            showMessage('✅ 可视化生成成功！', 'success');
            showVisualizationResult(result);
        } else {
            throw new Error(result.error || result.message || '生成失败');
        }

    } catch (error) {
        console.error('❌ 生成失败:', error);

        // 如果API调用失败，生成模拟可视化
        showMessage('🎨 正在生成本地演示...', 'info');
        setTimeout(() => {
            generateLocalVisualization(prompt);
        }, 1000);

    } finally {
        hideLoading();
    }
}

/**
 * 显示可视化结果
 */
function showVisualizationResult(result) {
    try {
        // 检查是否有HTML内容
        if (result.visualization && result.visualization.html_content) {
            showVisualizationInModal(result.visualization.html_content, result.title || '可视化结果');
        } else {
            showMessage('📊 数据可视化功能开发中...', 'info');
        }
    } catch (error) {
        console.error('显示结果失败:', error);
        showMessage('显示结果时出错', 'error');
    }
}

/**
 * 在模态框中显示可视化
 */
function showVisualizationInModal(htmlContent, title) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'visualization-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow: auto;
        position: relative;
        margin: 20px;
    `;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: #f0f0f0;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 20px;
        cursor: pointer;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
    `;

    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 创建iframe
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
        width: 100%;
        height: 80vh;
        border: none;
        border-radius: 15px;
    `;

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 设置iframe内容
    iframe.onload = () => {
        console.log('✨ 可视化已在模态框中加载');
    };

    iframe.srcdoc = htmlContent;

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * 生成本地演示可视化
 */
function generateLocalVisualization(prompt) {
    console.log('🎨 生成本地演示:', prompt);

    // 创建简单的可视化页面
    const demoHtml = createDemoVisualization(prompt);
    showVisualizationInModal(demoHtml, `演示: ${prompt}`);
}

/**
 * 创建演示可视化
 */
function createDemoVisualization(prompt) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>演示可视化</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .demo-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .demo-title {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        .demo-chart {
            width: 100%;
            height: 400px;
        }
        .demo-info {
            margin-top: 20px;
            padding: 15px;
            background: #e8f4fd;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h2 class="demo-title">🎨 可视化演示</h2>
        <p><strong>输入内容:</strong> ${prompt}</p>

        <div id="demoChart" class="demo-chart"></div>

        <div class="demo-info">
            <h4>💡 提示</h4>
            <p>这是一个演示可视化。实际的可视化功能正在开发中，将提供更丰富的交互式图表和定制选项。</p>
        </div>
    </div>

    <script>
        // 生成演示数据
        const demoData = {
            x: ['类别A', '类别B', '类别C', '类别D', '类别E'],
            y: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
            type: 'bar',
            marker: {
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
            }
        };

        const layout = {
            title: '演示数据可视化',
            xaxis: { title: '类别' },
            yaxis: { title: '数值' },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot('demoChart', [demoData], layout, {responsive: true});
    </script>
</body>
</html>
    `;
}

/**
 * 显示加载状态
 */
function showLoading() {
    let overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    let overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
        <span class="message-text">${message}</span>
        <button class="message-close">×</button>
    `;

    container.appendChild(messageEl);

    // 显示动画
    setTimeout(() => messageEl.classList.add('show'), 10);

    // 绑定关闭事件
    const closeBtn = messageEl.querySelector('.message-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideMessage(messageEl);
        });
    }

    // 自动移除
    setTimeout(() => {
        hideMessage(messageEl);
    }, 5000);
}

/**
 * 隐藏消息
 */
function hideMessage(messageEl) {
    if (messageEl && messageEl.parentNode) {
        messageEl.classList.remove('show');
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }
}