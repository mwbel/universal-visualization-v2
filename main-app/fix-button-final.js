/**
 * 终极按钮修复脚本
 * 彻底解决main-app按钮不显示问题
 */

console.log('🔧 终极按钮修复脚本开始执行');

// 立即执行，不等待DOMContentLoaded
(function fixButtonImmediately() {
    console.log('🚀 立即执行按钮修复');

    const btn = document.getElementById('generateBtn');
    if (btn) {
        console.log('✅ 找到按钮，应用终极修复');

        // 方法1: 内联样式
        btn.style.cssText = `
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 300px !important;
            right: 50px !important;
            z-index: 999999 !important;
            padding: 15px 30px !important;
            background: linear-gradient(135deg, #ff4444, #ff6b6b) !important;
            border: 3px solid #ffff00 !important;
            border-radius: 12px !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 18px !important;
            cursor: pointer !important;
            align-items: center !important;
            gap: 10px !important;
            box-shadow: 0 8px 25px rgba(255, 68, 68, 0.5) !important;
            transform: none !important;
            clip: auto !important;
            clip-path: none !important;
            mask: none !important;
            filter: none !important;
            will-change: auto !important;
            contain: none !important;
            pointer-events: auto !important;
            user-select: auto !important;
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
        `;

        // 方法2: 直接设置属性
        btn.disabled = false;
        btn.hidden = false;
        btn.removeAttribute('disabled');
        btn.removeAttribute('hidden');
        btn.setAttribute('aria-hidden', 'false');

        // 方法3: 强制显示按钮文本
        btn.innerHTML = '<span style="display: inline-block !important; font-size: 18px !important;">🔥</span> 开始生成';

        console.log('✅ 按钮已修复并强制显示在页面右上角');

        // 添加点击事件
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            alert('🎉 终极修复版本的按钮被点击了！输入内容: ' + (document.getElementById('mainInput')?.value || '空'));
        };

        return true;
    } else {
        console.error('❌ 未找到按钮元素');
        return false;
    }
})();

// 等待DOMContentLoaded再次执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 DOM加载完成，再次执行按钮修复');

    const btn = document.getElementById('generateBtn');
    if (btn) {
        // 重新应用所有修复
        btn.style.cssText = `
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 300px !important;
            right: 50px !important;
            z-index: 999999 !important;
            padding: 15px 30px !important;
            background: linear-gradient(135deg, #ff4444, #ff6b6b) !important;
            border: 3px solid #ffff00 !important;
            border-radius: 12px !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 18px !important;
            cursor: pointer !important;
            align-items: center !important;
            gap: 10px !important;
            box-shadow: 0 8px 25px rgba(255, 68, 68, 0.5) !important;
        `;

        btn.disabled = false;
        btn.innerHTML = '<span style="display: inline-block !important;">🔥</span> 开始生成';

        console.log('✅ DOM加载后按钮修复完成');
    }
});

// 定时检查和修复按钮（每秒检查一次）
let fixCount = 0;
const intervalId = setInterval(function() {
    fixCount++;
    const btn = document.getElementById('generateBtn');

    if (btn) {
        // 检查按钮是否可见
        const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0 &&
                         window.getComputedStyle(btn).display !== 'none' &&
                         window.getComputedStyle(btn).visibility !== 'hidden' &&
                         window.getComputedStyle(btn).opacity !== '0';

        if (!isVisible) {
            console.warn(`⚠️ 按钮不可见，第${fixCount}次修复`);

            // 强制修复
            btn.style.cssText = `
                display: inline-flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: fixed !important;
                top: 300px !important;
                right: 50px !important;
                z-index: 999999 !important;
                padding: 15px 30px !important;
                background: linear-gradient(135deg, #ff4444, #ff6b6b) !important;
                border: 3px solid #ffff00 !important;
                border-radius: 12px !important;
                color: white !important;
                font-weight: bold !important;
                font-size: 18px !important;
                cursor: pointer !important;
                align-items: center !important;
                gap: 10px !important;
                box-shadow: 0 8px 25px rgba(255, 68, 68, 0.5) !important;
            `;

            btn.disabled = false;
        }
    }

    // 10秒后停止检查
    if (fixCount >= 10) {
        clearInterval(intervalId);
        console.log('⏰ 按钮修复检查完成');
    }
}, 1000);

// 添加CSS规则到页面
const style = document.createElement('style');
style.textContent = `
    #generateBtn {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        top: 300px !important;
        right: 50px !important;
        z-index: 999999 !important;
        padding: 15px 30px !important;
        background: linear-gradient(135deg, #ff4444, #ff6b6b) !important;
        border: 3px solid #ffff00 !important;
        border-radius: 12px !important;
        color: white !important;
        font-weight: bold !important;
        font-size: 18px !important;
        cursor: pointer !important;
        align-items: center !important;
        gap: 10px !important;
        box-shadow: 0 8px 25px rgba(255, 68, 68, 0.5) !important;
        transform: none !important;
    }

    #generateBtn:hover {
        background: linear-gradient(135deg, #ff0000, #ff4444) !important;
        transform: scale(1.05) !important;
    }

    #generateBtn:disabled {
        opacity: 1 !important;
        cursor: pointer !important;
    }

    #generateBtn * {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
`;
document.head.appendChild(style);

console.log('🔧 终极按钮修复脚本加载完成');