/**
 * 紧急按钮修复 - 完全绕过原有按钮
 * 直接在页面中插入一个全新的按钮
 */

console.log('🚨 紧急按钮修复启动');

// 创建全新的按钮，绕过所有原有CSS
function createEmergencyButton() {
    console.log('🔥 创建紧急按钮');

    // 移除任何可能存在的旧紧急按钮
    const oldBtn = document.getElementById('emergency-generate-btn');
    if (oldBtn) {
        oldBtn.remove();
    }

    // 创建全新的按钮元素
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'emergency-generate-btn';
    emergencyBtn.innerHTML = '🔥 紧急生成按钮 🔥';
    emergencyBtn.textContent = '🔥 紧急生成按钮 🔥';

    // 应用绝对无法被隐藏的样式
    emergencyBtn.style.cssText = `
        position: fixed !important;
        top: 100px !important;
        right: 50px !important;
        z-index: 2147483647 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: auto !important;
        height: auto !important;
        min-width: 250px !important;
        min-height: 60px !important;
        padding: 15px 25px !important;
        background: linear-gradient(135deg, #ff0000, #ff4444) !important;
        border: 5px solid #ffff00 !important;
        border-radius: 15px !important;
        color: #ffffff !important;
        font-size: 20px !important;
        font-weight: bold !important;
        font-family: Arial, sans-serif !important;
        cursor: pointer !important;
        text-align: center !important;
        line-height: 1.2 !important;
        box-shadow: 0 10px 30px rgba(255, 0, 0, 0.7) !important;
        transform: rotate(-2deg) !important;
        animation: pulse 2s infinite !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        pointer-events: auto !important;
        clip: auto !important;
        clip-path: none !important;
        mask: none !important;
        filter: none !important;
        will-change: auto !important;
        contain: none !important;
        isolation: isolate !important;
        backface-visibility: visible !important;
        transform-style: flat !important;
        perspective: none !important;
    `;

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: rotate(-2deg) scale(1); }
            50% { transform: rotate(-2deg) scale(1.1); }
            100% { transform: rotate(-2deg) scale(1); }
        }

        #emergency-generate-btn:hover {
            background: linear-gradient(135deg, #ff6b6b, #ff8888) !important;
            transform: rotate(2deg) scale(1.2) !important;
            box-shadow: 0 15px 40px rgba(255, 0, 0, 0.9) !important;
        }

        #emergency-generate-btn:active {
            transform: rotate(0deg) scale(0.95) !important;
        }
    `;

    // 先添加样式
    if (!document.querySelector('#emergency-btn-styles')) {
        style.id = 'emergency-btn-styles';
        document.head.appendChild(style);
    }

    // 将按钮直接添加到body末尾，避免被其他元素影响
    document.body.appendChild(emergencyBtn);

    // 绑定点击事件
    emergencyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🎉 紧急按钮被点击！');

        // 获取输入内容
        const mainInput = document.getElementById('mainInput');
        const inputContent = mainInput ? mainInput.value : '未找到输入框';

        // 显示提示
        alert(`🎉 紧急按钮工作正常！\n\n输入内容: ${inputContent}\n\n这个按钮完全绕过了原有的CSS和JavaScript限制！`);

        // 可以在这里添加实际的生成逻辑
        if (inputContent && inputContent.trim()) {
            console.log('📝 输入内容:', inputContent);
            // 这里可以调用原有的生成函数
            if (window.handleGenerate) {
                window.handleGenerate();
            } else if (window.UniversalVisFusion && window.UniversalVisFusion.handleGenerate) {
                window.UniversalVisFusion.handleGenerate();
            } else {
                console.log('🔧 生成函数未找到，但按钮显示正常');
            }
        }
    });

    // 双击按钮隐藏/显示
    emergencyBtn.addEventListener('dblclick', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const currentDisplay = emergencyBtn.style.display;
        emergencyBtn.style.display = currentDisplay === 'none' ? 'block' : 'none';
        console.log('👁️ 按钮显示状态:', emergencyBtn.style.display);
    });

    console.log('✅ 紧急按钮创建完成');
    return emergencyBtn;
}

// 立即创建按钮
createEmergencyButton();

// DOM加载完成后再次创建（以防第一次失败）
document.addEventListener('DOMContentLoaded', createEmergencyButton);

// 延迟创建按钮（确保在所有其他脚本执行后）
setTimeout(createEmergencyButton, 1000);
setTimeout(createEmergencyButton, 3000);
setTimeout(createEmergencyButton, 5000);

// 定时检查按钮是否存在
let checkCount = 0;
const checkInterval = setInterval(function() {
    checkCount++;
    const btn = document.getElementById('emergency-generate-btn');

    if (!btn) {
        console.log(`⚠️ 紧急按钮不存在，第${checkCount}次重新创建`);
        createEmergencyButton();
    } else {
        // 检查按钮是否真的可见
        const rect = btn.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        if (!isVisible) {
            console.log(`⚠️ 紧急按钮不可见，第${checkCount}次修复`);
            btn.style.cssText = btn.style.cssText.replace(/display:\s*[^!;]*[;!]?/gi, 'display: block !important;');
        } else {
            console.log(`✅ 紧急按钮可见，位置: x=${rect.left}, y=${rect.top}, w=${rect.width}, h=${rect.height}`);
        }
    }

    // 20次检查后停止
    if (checkCount >= 20) {
        clearInterval(checkInterval);
        console.log('🏁 紧急按钮检查完成');
    }
}, 500);

console.log('🚨 紧急按钮修复脚本加载完成');

// 导出全局函数供手动调用
window.createEmergencyButton = createEmergencyButton;