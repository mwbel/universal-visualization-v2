/**
 * ARIA可访问性管理系统
 * 任务3.2.1中优先级改进 - 可访问性支持完善
 * 目标: WCAG 2.1 AA级合规，屏幕阅读器支持，键盘导航优化
 */

class ARIAManager {
    constructor(options = {}) {
        this.options = {
            autoInit: options.autoInit !== false,
            verbose: options.verbose || false,
            enableLiveRegions: options.enableLiveRegions !== false,
            enableFocusManagement: options.enableFocusManagement !== false,
            enableAnnouncements: options.enableAnnouncements !== false,
            language: options.language || 'zh-CN',
            ...options
        };

        // ARIA状态管理
        this.ariaStates = new Map();
        this.liveRegions = new Map();
        this.announcer = null;
        this.focusTrapStack = [];
        this.keyboardNavigation = new Map();

        // 可访问性配置
        this.config = {
            roles: {
                // 应用角色
                application: ['main', 'app'],
                // 导航角色
                navigation: ['nav', 'menu'],
                // 内容角色
                article: ['article', 'section'],
                // 表单角色
                form: ['form', 'search'],
                // 列表角色
                list: ['ul', 'ol', 'dl'],
                // 表格角色
                table: ['table', 'grid'],
                // 对话框角色
                dialog: ['dialog', 'modal'],
                // 交互元素角色
                button: ['button', 'link'],
                input: ['input', 'textarea', 'select'],
                // 媒体角色
                img: ['img', 'figure'],
                // 状态角色
                status: ['status', 'alert'],
                // 计时器角色
                timer: ['timer', 'counter']
            },
            properties: {
                // 标签属性
                label: ['aria-label', 'aria-labelledby', 'title'],
                // 描述属性
                description: ['aria-describedby'],
                // 状态属性
                expanded: ['aria-expanded'],
                selected: ['aria-selected'],
                checked: ['aria-checked'],
                pressed: ['aria-pressed'],
                disabled: ['aria-disabled'],
                readonly: ['aria-readonly'],
                required: ['aria-required'],
                invalid: ['aria-invalid'],
                // 值属性
                valuenow: ['aria-valuenow'],
                valuetext: ['aria-valuetext'],
                valuemin: ['aria-valuemin'],
                valuemax: ['aria-valuemax'],
                // 结构属性
                level: ['aria-level'],
                setsize: ['aria-setsize'],
                posinset: ['aria-posinset'],
                // 控制属性
                controls: ['aria-controls'],
                owns: ['aria-owns'],
                flowto: ['aria-flowto']
            },
            states: {
                // 可见性状态
                hidden: ['aria-hidden'],
                // 忙碌状态
                busy: ['aria-busy'],
                // 实时状态
                live: ['aria-live'],
                atomic: ['aria-atomic'],
                relevant: ['aria-relevant']
            }
        };

        this.init();
    }

    /**
     * 初始化ARIA管理系统
     */
    init() {
        try {
            // 检测用户可访问性偏好
            this.detectAccessibilityPreferences();

            // 创建实时区域
            if (this.options.enableLiveRegions) {
                this.createLiveRegions();
            }

            // 创建通知器
            if (this.options.enableAnnouncements) {
                this.createAnnouncer();
            }

            // 初始化焦点管理
            if (this.options.enableFocusManagement) {
                this.initFocusManagement();
            }

            // 扫描和增强现有元素
            if (this.options.autoInit) {
                this.enhanceExistingElements();
            }

            // 监听动态内容
            this.observeDynamicContent();

            // 初始化键盘导航
            this.initKeyboardNavigation();

            console.log('♿ ARIA管理系统初始化完成');
            console.log(`🌐 语言设置: ${this.options.language}`);

        } catch (error) {
            console.error('❌ ARIA管理系统初始化失败:', error);
        }
    }

    /**
     * 检测用户可访问性偏好
     */
    detectAccessibilityPreferences() {
        // 检测是否使用屏幕阅读器
        this.usesScreenReader = this.detectScreenReader();

        // 检测是否偏好减少动画
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 检测是否偏好高对比度
        this.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

        // 检测是否使用键盘导航
        this.usesKeyboardNavigation = this.detectKeyboardNavigation();

        console.log('🔍 可访问性偏好检测:', {
            screenReader: this.usesScreenReader,
            reducedMotion: this.prefersReducedMotion,
            highContrast: this.prefersHighContrast,
            keyboardNavigation: this.usesKeyboardNavigation
        });

        // 应用偏好设置
        this.applyAccessibilityPreferences();
    }

    detectScreenReader() {
        // 简单的屏幕阅读器检测
        return (
            window.speechSynthesis ||
            window.navigator.userAgent.includes('NVDA') ||
            window.navigator.userAgent.includes('JAWS') ||
            window.navigator.userAgent.includes('VoiceOver')
        );
    }

    detectKeyboardNavigation() {
        let usingKeyboard = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                usingKeyboard = true;
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            usingKeyboard = false;
            document.body.classList.remove('keyboard-navigation');
        });

        return usingKeyboard;
    }

    /**
     * 应用可访问性偏好
     */
    applyAccessibilityPreferences() {
        // 减少动画
        if (this.prefersReducedMotion) {
            document.documentElement.style.setProperty('--transition-duration', '0.01ms');
            document.documentElement.classList.add('reduced-motion');
        }

        // 高对比度
        if (this.prefersHighContrast) {
            document.documentElement.classList.add('high-contrast');
        }

        // 屏幕阅读器模式
        if (this.usesScreenReader) {
            document.documentElement.classList.add('screen-reader-mode');
        }
    }

    /**
     * 创建实时区域
     */
    createLiveRegions() {
        // 创建不同类型的实时区域
        const regions = {
            polite: { priority: 'polite', ariaLive: 'polite' },
            assertive: { priority: 'assertive', ariaLive: 'assertive' },
            status: { priority: 'status', ariaLive: 'polite', ariaAtomic: 'true', ariaRelevant: 'additions text' },
            alert: { priority: 'alert', ariaLive: 'assertive', ariaAtomic: 'true' }
        };

        Object.entries(regions).forEach(([key, config]) => {
            const region = document.createElement('div');
            region.setAttribute('aria-live', config.ariaLive);
            region.className = `sr-only live-region live-region--${key}`;
            region.style.cssText = `
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            `;

            if (config.ariaAtomic) {
                region.setAttribute('aria-atomic', config.ariaAtomic);
            }
            if (config.ariaRelevant) {
                region.setAttribute('aria-relevant', config.ariaRelevant);
            }

            document.body.appendChild(region);
            this.liveRegions.set(key, region);

            if (this.options.verbose) {
                console.log(`📢 创建实时区域: ${key}`);
            }
        });
    }

    /**
     * 创建通知器
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only announcer';
        this.announcer.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;

        document.body.appendChild(this.announcer);
        console.log('📢 通知器已创建');
    }

    /**
     * 宣布消息给屏幕阅读器
     */
    announce(message, priority = 'polite', clearPrevious = true) {
        if (!this.announcer) {
            console.warn('⚠️ 通知器未初始化');
            return;
        }

        try {
            if (clearPrevious) {
                this.announcer.textContent = '';
            }

            // 使用短暂延迟确保屏幕阅读器能检测到变化
            setTimeout(() => {
                this.announcer.textContent = message;
            }, 100);

            console.log(`📢 宣布消息 [${priority}]: ${message}`);

            // 记录通知历史
            if (!this.notificationHistory) {
                this.notificationHistory = [];
            }
            this.notificationHistory.push({
                message,
                priority,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ 宣布消息失败:', error);
        }
    }

    /**
     * 实时区域公告
     */
    liveAnnounce(message, region = 'polite') {
        const liveRegion = this.liveRegions.get(region);
        if (!liveRegion) {
            console.warn(`⚠️ 实时区域不存在: ${region}`);
            return;
        }

        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 50);

        console.log(`📢 实时公告 [${region}]: ${message}`);
    }

    /**
     * 焦点管理初始化
     */
    initFocusManagement() {
        // 记录初始焦点
        this.lastFocusedElement = document.activeElement;

        // 监听焦点变化
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));

        // 监听模态框和对话框
        this.observeModalsAndDialogs();

        console.log('🎯 焦点管理系统已初始化');
    }

    handleFocusIn(event) {
        const element = event.target;
        this.lastFocusedElement = element;

        // 添加焦点指示器
        document.body.classList.add('focus-visible');

        // 焦点进入可访问性组件时的处理
        if (element.hasAttribute('role') || element.hasAttribute('aria-label')) {
            this.handleAccessibleElementFocus(element);
        }

        if (this.options.verbose) {
            console.log(`🎯 焦点进入: ${element.tagName}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ').join('.')}` : ''}`);
        }
    }

    handleFocusOut(event) {
        // 延迟移除焦点指示器，允许焦点转移
        setTimeout(() => {
            if (document.activeElement === document.body) {
                document.body.classList.remove('focus-visible');
            }
        }, 10);
    }

    handleAccessibleElementFocus(element) {
        // 为可访问性元素提供额外的上下文信息
        const role = element.getAttribute('role');
        const label = this.getAccessibleLabel(element);

        if (role && label) {
            this.announce(`${role}: ${label}`, 'polite', false);
        }
    }

    /**
     * 观察模态框和对话框
     */
    observeModalsAndDialogs() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查是否是对话框或模态框
                        if (node.matches('[role="dialog"], .modal, .dialog')) {
                            this.trapFocus(node);
                        }
                    }
                });

                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('[role="dialog"], .modal, .dialog')) {
                            this.releaseFocus();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 焦点陷阱
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
            console.warn('⚠️ 焦点陷阱容器内没有可聚焦元素');
            return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // 记录当前焦点
        this.previousFocus = document.activeElement;

        // 设置初始焦点
        firstElement.focus();

        // 添加键盘事件监听
        const handleKeydown = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                this.releaseFocus();
            }
        };

        container.addEventListener('keydown', handleKeydown);
        this.focusTrapStack.push({ container, handleKeydown });

        // 添加ARIA属性
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-modal', 'true');

        console.log('🎯 焦点陷阱已激活');
    }

    /**
     * 释放焦点陷阱
     */
    releaseFocus() {
        if (this.focusTrapStack.length > 0) {
            const { container, handleKeydown } = this.focusTrapStack.pop();

            container.removeEventListener('keydown', handleKeydown);
            container.removeAttribute('aria-modal');

            // 恢复之前的焦点
            if (this.previousFocus && this.previousFocus.focus) {
                this.previousFocus.focus();
            }

            console.log('🎯 焦点陷阱已释放');
        }
    }

    /**
     * 增强现有元素
     */
    enhanceExistingElements() {
        // 增强按钮
        this.enhanceButtons();

        // 增强表单元素
        this.enhanceFormElements();

        // 增强导航
        this.enhanceNavigation();

        // 增强图像
        this.enhanceImages();

        // 增强表格
        this.enhanceTables();

        // 增强列表
        this.enhanceLists();

        console.log('🔧 现有元素增强完成');
    }

    /**
     * 增强按钮
     */
    enhanceButtons() {
        // 增强标准按钮
        document.querySelectorAll('button').forEach(button => {
            this.enhanceButton(button);
        });

        // 增强按钮链接
        document.querySelectorAll('a[href], button[type="button"]').forEach(link => {
            if (!link.hasAttribute('role')) {
                link.setAttribute('role', 'button');
            }
        });

        // 增强图标按钮
        document.querySelectorAll('.icon-btn, [class*="icon"]').forEach(iconBtn => {
            if (!iconBtn.getAttribute('aria-label') && !iconBtn.textContent.trim()) {
                const iconClass = Array.from(iconBtn.classList).find(cls => cls.includes('icon-'));
                if (iconClass) {
                    const iconName = iconClass.replace('icon-', '').replace(/-/g, ' ');
                    iconBtn.setAttribute('aria-label', iconName);
                }
            }
        });
    }

    enhanceButton(button) {
        // 确保有可访问的标签
        if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
            const title = button.getAttribute('title');
            if (title) {
                button.setAttribute('aria-label', title);
            }
        }

        // 添加状态指示
        if (button.disabled) {
            button.setAttribute('aria-disabled', 'true');
        }

        // 添加加载状态
        if (button.classList.contains('loading')) {
            button.setAttribute('aria-busy', 'true');
        }
    }

    /**
     * 增强表单元素
     */
    enhanceFormElements() {
        // 增强输入框
        document.querySelectorAll('input, textarea, select').forEach(input => {
            this.enhanceInput(input);
        });

        // 增强表单标签关联
        document.querySelectorAll('label').forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
                const input = document.getElementById(forAttr);
                if (input && !input.getAttribute('aria-label')) {
                    input.setAttribute('aria-labelledby', label.id || this.generateId(label));
                }
            }
        });

        // 增强表单验证
        document.querySelectorAll('form').forEach(form => {
            this.enhanceForm(form);
        });
    }

    enhanceInput(input) {
        // 添加必需指示
        if (input.required && !input.hasAttribute('aria-required')) {
            input.setAttribute('aria-required', 'true');
        }

        // 添加无效状态
        if (!input.validity.valid && !input.hasAttribute('aria-invalid')) {
            input.setAttribute('aria-invalid', 'true');
        }

        // 添加描述信息
        const description = input.getAttribute('placeholder') || input.getAttribute('title');
        if (description && !input.hasAttribute('aria-describedby')) {
            const descId = this.generateId();
            input.setAttribute('aria-describedby', descId);

            // 创建描述元素
            const descElement = document.createElement('span');
            descElement.id = descId;
            descElement.className = 'sr-only';
            descElement.textContent = description;
            input.parentNode.insertBefore(descElement, input.nextSibling);
        }
    }

    enhanceForm(form) {
        // 添加表单角色
        if (!form.hasAttribute('role')) {
            form.setAttribute('role', 'form');
        }

        // 监听验证事件
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.setAttribute('aria-invalid', 'true');
                    this.announce(`表单验证失败: ${firstInvalid.validationMessage}`, 'assertive');
                }
            }
        });
    }

    /**
     * 增强导航
     */
    enhanceNavigation() {
        // 增强主导航
        document.querySelectorAll('nav, .navigation, .menu').forEach(nav => {
            if (!nav.hasAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }

            // 添加标签
            if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
                nav.setAttribute('aria-label', '主导航');
            }
        });

        // 增强面包屑导航
        document.querySelectorAll('.breadcrumb, .breadcrumbs').forEach(breadcrumb => {
            breadcrumb.setAttribute('role', 'navigation');
            breadcrumb.setAttribute('aria-label', '面包屑导航');

            const list = breadcrumb.querySelector('ol, ul');
            if (list) {
                list.setAttribute('role', 'list');
                list.querySelectorAll('li').forEach((item, index) => {
                    item.setAttribute('role', 'listitem');
                    item.setAttribute('aria-label', `第 ${index + 1} 项`);
                });
            }
        });

        // 增强分页导航
        document.querySelectorAll('.pagination').forEach(pagination => {
            pagination.setAttribute('role', 'navigation');
            pagination.setAttribute('aria-label', '分页导航');
        });
    }

    /**
     * 增强图像
     */
    enhanceImages() {
        document.querySelectorAll('img').forEach(img => {
            this.enhanceImage(img);
        });

        // 增强响应式图像
        document.querySelectorAll('picture').forEach(picture => {
            const img = picture.querySelector('img');
            if (img && !img.hasAttribute('alt')) {
                img.setAttribute('alt', ''); // 装饰性图像
            }
        });
    }

    enhanceImage(img) {
        // 确保有alt属性
        if (!img.hasAttribute('alt')) {
            const src = img.src;
            const filename = src.split('/').pop().split('.')[0];
            img.setAttribute('alt', filename.replace(/[-_]/g, ' '));
        }

        // 添加长描述（如果需要）
        if (img.hasAttribute('data-longdesc') && !img.hasAttribute('aria-describedby')) {
            const descId = this.generateId();
            img.setAttribute('aria-describedby', descId);

            // 创建长描述元素
            const descElement = document.createElement('div');
            descElement.id = descId;
            descElement.className = 'sr-only';
            descElement.textContent = img.getAttribute('data-longdesc');
            img.parentNode.insertBefore(descElement, img.nextSibling);
        }

        // 添加加载状态
        if (!img.complete) {
            img.setAttribute('aria-busy', 'true');
            img.addEventListener('load', () => {
                img.removeAttribute('aria-busy');
            });
        }
    }

    /**
     * 增强表格
     */
    enhanceTables() {
        document.querySelectorAll('table').forEach(table => {
            this.enhanceTable(table);
        });
    }

    enhanceTable(table) {
        // 添加表格角色
        if (!table.hasAttribute('role')) {
            table.setAttribute('role', 'table');
        }

        // 添加标题
        const caption = table.querySelector('caption');
        if (!caption) {
            const title = table.getAttribute('title') || '数据表格';
            const newCaption = document.createElement('caption');
            newCaption.textContent = title;
            newCaption.className = 'sr-only';
            table.insertBefore(newCaption, table.firstChild);
        }

        // 增强表头
        table.querySelectorAll('th').forEach(th => {
            if (!th.hasAttribute('scope')) {
                const row = th.closest('tr');
                const isRowHeader = row && row.parentElement.tagName === 'THEAD';
                th.setAttribute('scope', isRowHeader ? 'col' : 'row');
            }

            // 添加排序指示
            if (th.hasAttribute('data-sortable')) {
                th.setAttribute('aria-sort', 'none');
                th.setAttribute('role', 'columnheader');
            }
        });

        // 增强数据单元格
        table.querySelectorAll('td').forEach(td => {
            // 添加行/列标题关联
            const row = td.closest('tr');
            if (row) {
                const rowHeader = row.querySelector('th[scope="row"]');
                if (rowHeader && !td.hasAttribute('aria-describedby')) {
                    const headerId = this.generateId(rowHeader);
                    rowHeader.id = headerId;
                    td.setAttribute('aria-describedby', headerId);
                }
            }
        });
    }

    /**
     * 增强列表
     */
    enhanceLists() {
        // 增强有序列表
        document.querySelectorAll('ol').forEach(ol => {
            ol.setAttribute('role', 'list');
            const items = ol.querySelectorAll('li');
            items.forEach((item, index) => {
                item.setAttribute('role', 'listitem');
                item.setAttribute('aria-label', `第 ${index + 1} 项`);
            });
        });

        // 增强无序列表
        document.querySelectorAll('ul').forEach(ul => {
            if (!ul.classList.contains('nav') && !ul.classList.contains('menu')) {
                ul.setAttribute('role', 'list');
                ul.querySelectorAll('li').forEach(item => {
                    item.setAttribute('role', 'listitem');
                });
            }
        });
    }

    /**
     * 监听动态内容
     */
    observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 增强新添加的元素
                        this.enhanceNode(node);

                        // 如果是重要的内容变化，通知屏幕阅读器
                        if (this.isImportantContentChange(node)) {
                            this.announceImportantContentChange(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'aria-expanded', 'aria-selected', 'aria-checked']
        });

        console.log('👁️ 动态内容监控已启动');
    }

    enhanceNode(node) {
        // 根据节点类型进行增强
        if (node.matches) {
            if (node.matches('button')) {
                this.enhanceButton(node);
            } else if (node.matches('input, textarea, select')) {
                this.enhanceInput(node);
            } else if (node.matches('img')) {
                this.enhanceImage(node);
            } else if (node.matches('table')) {
                this.enhanceTable(node);
            } else if (node.matches('nav, .navigation, .menu')) {
                node.setAttribute('role', 'navigation');
            }

            // 递归处理子元素
            node.querySelectorAll('button, input, textarea, select, img, table, nav').forEach(child => {
                this.enhanceNode(child);
            });
        }
    }

    isImportantContentChange(node) {
        // 判断是否是重要的内容变化
        return (
            node.matches('.alert, .error, .success, .warning') ||
            node.matches('[role="alert"], [role="status"]') ||
            node.textContent.includes('错误') ||
            node.textContent.includes('成功') ||
            node.textContent.includes('警告')
        );
    }

    announceImportantContentChange(node) {
        const text = node.textContent.trim();
        if (text) {
            const role = node.getAttribute('role') || this.getSemanticRole(node);
            this.announce(`${role}: ${text}`, 'assertive');
        }
    }

    getSemanticRole(element) {
        // 获取元素的语义角色
        if (element.matches('.alert, .error')) return '错误';
        if (element.matches('.success')) return '成功';
        if (element.matches('.warning')) return '警告';
        if (element.matches('.info')) return '信息';
        return '内容';
    }

    /**
     * 键盘导航初始化
     */
    initKeyboardNavigation() {
        // 全局键盘快捷键
        document.addEventListener('keydown', this.handleGlobalKeyboardShortcuts.bind(this));

        // 跳转到主内容
        this.createSkipLinks();

        console.log('⌨️ 键盘导航已初始化');
    }

    handleGlobalKeyboardShortcuts(event) {
        // Alt + S: 跳转到搜索
        if (event.altKey && event.key === 's') {
            event.preventDefault();
            const searchInput = document.querySelector('input[type="search"], #search');
            if (searchInput) {
                searchInput.focus();
                this.announce('已跳转到搜索框');
            }
        }

        // Alt + N: 跳转到主导航
        if (event.altKey && event.key === 'n') {
            event.preventDefault();
            const mainNav = document.querySelector('nav[role="navigation"], .navigation');
            if (mainNav) {
                mainNav.focus();
                this.announce('已跳转到主导航');
            }
        }

        // Alt + M: 跳转到主内容
        if (event.altKey && event.key === 'm') {
            event.preventDefault();
            const mainContent = document.querySelector('main, [role="main"], #main');
            if (mainContent) {
                mainContent.focus();
                this.announce('已跳转到主内容');
            }
        }
    }

    /**
     * 创建跳转链接
     */
    createSkipLinks() {
        const skipLinks = [
            { target: 'main', text: '跳转到主内容' },
            { target: 'nav', text: '跳转到导航' },
            { target: '[role="search"]', text: '跳转到搜索' }
        ];

        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            right: 0;
            z-index: 10000;
            text-align: center;
        `;

        skipLinks.forEach(link => {
            const skipLink = document.createElement('a');
            skipLink.href = `#${link.target}`;
            skipLink.textContent = link.text;
            skipLink.style.cssText = `
                display: inline-block;
                padding: 8px 16px;
                background: #000;
                color: #fff;
                text-decoration: none;
                margin: 0 4px;
                border-radius: 4px;
            `;

            skipLink.addEventListener('focus', () => {
                skipLinksContainer.style.top = '0';
            });

            skipLink.addEventListener('blur', () => {
                skipLinksContainer.style.top = '-40px';
            });

            skipLinksContainer.appendChild(skipLink);
        });

        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    }

    /**
     * 工具方法
     */
    generateId(element) {
        if (element && element.id) {
            return element.id;
        }
        return `aria-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getAccessibleLabel(element) {
        // 按优先级获取可访问标签
        return (
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            element.textContent.trim() ||
            element.getAttribute('alt') ||
            ''
        );
    }

    /**
     * 公共API方法
     */

    // 动态设置ARIA属性
    setAttribute(element, attribute, value) {
        element.setAttribute(attribute, value);
        this.ariaStates.set(element, { ...this.ariaStates.get(element), [attribute]: value });

        // 宣告重要的状态变化
        if (this.isImportantAriaChange(attribute, value)) {
            const label = this.getAccessibleLabel(element);
            this.announce(`${label}: ${this.getAriaStateDescription(attribute, value)}`);
        }
    }

    isImportantAriaChange(attribute, value) {
        const importantAttributes = ['aria-expanded', 'aria-selected', 'aria-checked', 'aria-disabled', 'aria-busy'];
        return importantAttributes.includes(attribute);
    }

    getAriaStateDescription(attribute, value) {
        const descriptions = {
            'aria-expanded': { true: '已展开', false: '已收起' },
            'aria-selected': { true: '已选中', false: '未选中' },
            'aria-checked': { true: '已选中', false: '未选中', mixed: '部分选中' },
            'aria-disabled': { true: '已禁用', false: '已启用' },
            'aria-busy': { true: '正在加载', false: '加载完成' }
        };

        return descriptions[attribute]?.[value] || value;
    }

    // 获取可访问性统计
    getAccessibilityStats() {
        const stats = {
            elementsWithAria: document.querySelectorAll('[aria-label], [aria-labelledby], [role]').length,
            buttonsEnhanced: document.querySelectorAll('button[aria-label], button[title]').length,
            imagesWithAlt: document.querySelectorAll('img[alt]').length,
            formElementsEnhanced: document.querySelectorAll('input[aria-required], input[aria-invalid]').length,
            tablesEnhanced: document.querySelectorAll('table caption, th[scope]').length,
            focusableElements: document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
            liveRegions: this.liveRegions.size,
            notifications: this.notificationHistory?.length || 0,
            userPreferences: {
                screenReader: this.usesScreenReader,
                reducedMotion: this.prefersReducedMotion,
                highContrast: this.prefersHighContrast,
                keyboardNavigation: this.usesKeyboardNavigation
            }
        };

        return stats;
    }

    // 运行可访问性审计
    runAccessibilityAudit() {
        const issues = [];

        // 检查图像alt属性
        document.querySelectorAll('img:not([alt])').forEach(img => {
            issues.push({
                type: 'missing-alt',
                element: img,
                message: '图像缺少alt属性',
                severity: 'warning'
            });
        });

        // 检查按钮标签
        document.querySelectorAll('button:not([aria-label]):not([title])').forEach(button => {
            if (!button.textContent.trim()) {
                issues.push({
                    type: 'missing-button-label',
                    element: button,
                    message: '按钮缺少可访问标签',
                    severity: 'error'
                });
            }
        });

        // 检查表单标签
        document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label) {
                issues.push({
                    type: 'missing-form-label',
                    element: input,
                    message: '表单元素缺少标签',
                    severity: 'error'
                });
            }
        });

        // 检查表格标题
        document.querySelectorAll('table:not(caption)').forEach(table => {
            issues.push({
                type: 'missing-table-caption',
                element: table,
                message: '表格缺少标题',
                severity: 'warning'
            });
        });

        // 生成报告
        const report = {
            timestamp: new Date().toISOString(),
            totalIssues: issues.length,
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length,
            issues: issues,
            stats: this.getAccessibilityStats()
        };

        console.log('🔍 可访问性审计完成:', report);
        this.emit('accessibility:audit-complete', report);

        return report;
    }

    /**
     * 事件系统
     */
    on(event, listener) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    off(event, listener) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ 事件监听器错误 (${event}):`, error);
                }
            });
        }

        if (this.options.verbose) {
            console.log(`📢 ARIA事件: ${event}`, data);
        }
    }
}

// 创建全局实例
const ariaManager = new ARIAManager({
    autoInit: true,
    verbose: false,
    enableLiveRegions: true,
    enableFocusManagement: true,
    enableAnnouncements: true,
    language: 'zh-CN'
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARIAManager;
}

// 全局暴露
window.ARIAManager = ARIAManager;
window.ariaManager = ariaManager;