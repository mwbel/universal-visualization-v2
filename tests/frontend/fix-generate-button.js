// 修复生成按钮的脚本
(function() {
    console.log('🔧 开始修复生成按钮...');

    // 获取元素
    const mainInput = document.getElementById('mainInput');
    const generateBtn = document.getElementById('generateBtn');

    if (!mainInput) {
        console.error('❌ 找不到输入框');
        return;
    }

    if (!generateBtn) {
        console.error('❌ 找不到生成按钮');
        return;
    }

    console.log('✅ 找到输入框和生成按钮');

    // 修复按钮状态更新函数
    function updateButtonState() {
        const hasContent = mainInput.value.trim().length > 0;
        generateBtn.disabled = !hasContent;

        console.log('🔄 按钮状态更新:', {
            inputValue: mainInput.value,
            hasContent: hasContent,
            disabled: generateBtn.disabled
        });
    }

    // 立即更新一次状态
    updateButtonState();

    // 移除旧的事件监听器（如果存在）
    mainInput.removeEventListener('input', updateButtonState);
    mainInput.removeEventListener('keyup', updateButtonState);
    mainInput.removeEventListener('paste', updateButtonState);

    // 添加新的事件监听器
    mainInput.addEventListener('input', updateButtonState);
    mainInput.addEventListener('keyup', updateButtonState);
    mainInput.addEventListener('paste', () => {
        setTimeout(updateButtonState, 10);
    });

    console.log('✅ 事件监听器已添加');

    // 如果已有内容，立即启用按钮
    if (mainInput.value.trim().length > 0) {
        generateBtn.disabled = false;
        console.log('✅ 已有内容，按钮已启用');
    }

    // 确保点击事件正常工作
    generateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!this.disabled) {
            console.log('🚀 生成按钮被点击');
            if (typeof window.UniversalVisFusion?.handleGenerate === 'function') {
                window.UniversalVisFusion.handleGenerate();
            } else {
                console.warn('⚠️ handleGenerate 函数不存在');
            }
        } else {
            console.warn('⚠️ 按钮被禁用，无法点击');
        }
    });

    console.log('✅ 点击事件已绑定');

    // 显示修复完成提示
    setTimeout(() => {
        if (generateBtn.disabled) {
            generateBtn.style.backgroundColor = '#fbbf24';
            generateBtn.innerHTML = '<span class="btn-icon">⚠️</span> 请输入内容';
        } else {
            generateBtn.style.backgroundColor = '#10b981';
            generateBtn.innerHTML = '<span class="btn-icon">🚀</span> 开始生成';
        }

        console.log('🎉 按钮修复完成！');
    }, 500);
})();