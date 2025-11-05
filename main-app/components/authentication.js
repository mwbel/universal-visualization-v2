/**
 * 用户认证界面管理
 * 处理登录、注册、密码重置等认证相关的界面交互
 */

class AuthenticationUI {
    constructor() {
        this.userManagement = null;
        this.currentModal = null;
        this.isInitialized = false;
        this.toastContainer = null;
        this.init();
    }

    /**
     * 初始化认证界面
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // 初始化 UserManagement 实例
            if (typeof UserManagement !== 'undefined') {
                this.userManagement = new UserManagement();
                await this.setupEventListeners();
                await this.restoreUserState();
                this.checkAndShowTestAccounts();
                this.isInitialized = true;
                console.log('✅ 认证界面初始化完成');
            } else {
                console.error('❌ UserManagement 类未找到');
                this.showToast('系统组件加载失败，请刷新页面重试', 'error');
            }
        } catch (error) {
            console.error('❌ 认证界面初始化失败:', error);
            this.showToast('认证系统初始化失败', 'error');
        }
    }

    /**
     * 设置事件监听器
     */
    async setupEventListeners() {
        // 认证按钮事件
        this.bindElement('loginBtn', 'click', () => this.showModal('login'));
        this.bindElement('registerBtn', 'click', () => this.showModal('register'));

        // 模态框关闭事件
        this.bindElement('closeLoginModal', 'click', () => this.hideModal('login'));
        this.bindElement('closeRegisterModal', 'click', () => this.hideModal('register'));
        this.bindElement('closeForgotPasswordModal', 'click', () => this.hideModal('forgotPassword'));

        // 模态框切换事件
        this.bindElement('switchToRegister', 'click', (e) => {
            e.preventDefault();
            this.hideModal('login');
            this.showModal('register');
        });

        this.bindElement('switchToLogin', 'click', (e) => {
            e.preventDefault();
            this.hideModal('register');
            this.showModal('login');
        });

        this.bindElement('forgotPasswordLink', 'click', (e) => {
            e.preventDefault();
            this.hideModal('login');
            this.showModal('forgotPassword');
        });

        this.bindElement('backToLogin', 'click', (e) => {
            e.preventDefault();
            this.hideModal('forgotPassword');
            this.showModal('login');
        });

        // 表单提交事件
        this.bindElement('loginForm', 'submit', (e) => this.handleLogin(e));
        this.bindElement('registerForm', 'submit', (e) => this.handleRegister(e));
        this.bindElement('forgotPasswordForm', 'submit', (e) => this.handleForgotPassword(e));

        // 用户下拉菜单事件
        this.bindElement('dropdownToggle', 'click', () => this.toggleUserDropdown());

        // 登出按钮事件
        this.bindElement('logoutBtn', 'click', () => this.handleLogout());

        // 测试账号相关事件
        this.bindElement('testAccountsToggle', 'click', () => this.toggleTestAccountsDropdown());

        // 点击模态框外部关闭
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const modalId = modal.id;
                    this.hideModal(modalId.replace('Modal', ''));
                }
            });
        });

        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hideModal(this.currentModal);
            }
        });

        // 表单验证事件
        this.setupFormValidation();

        // 测试账号点击事件（使用事件委托）
        document.addEventListener('click', (e) => {
            if (e.target.closest('.test-account-item')) {
                this.handleTestAccountClick(e);
            }
        });

        // 初始化 Toast 容器
        this.initToastContainer();
    }

    /**
     * 绑定元素事件
     */
    bindElement(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`⚠️ 元素 #${id} 未找到`);
        }
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        // 登录表单验证
        const loginIdentifier = document.getElementById('loginIdentifier');
        const loginPassword = document.getElementById('loginPassword');

        if (loginIdentifier) {
            loginIdentifier.addEventListener('input', () => {
                this.clearFieldError('loginIdentifier');
            });
        }

        if (loginPassword) {
            loginPassword.addEventListener('input', () => {
                this.clearFieldError('loginPassword');
            });
        }

        // 注册表单验证
        const registerFields = ['registerUsername', 'registerEmail', 'registerPassword', 'registerConfirmPassword'];
        registerFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    this.validateRegisterField(fieldId);
                });
                field.addEventListener('blur', () => {
                    this.validateRegisterField(fieldId);
                });
            }
        });

        // 密码重置表单验证
        const resetEmail = document.getElementById('resetEmail');
        if (resetEmail) {
            resetEmail.addEventListener('input', () => {
                this.clearFieldError('resetEmail');
            });
        }
    }

    /**
     * 验证注册字段
     */
    validateRegisterField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field ? field.value.trim() : '';
        let error = '';

        switch (fieldId) {
            case 'registerUsername':
                if (!value) {
                    error = '用户名不能为空';
                } else if (value.length < 3 || value.length > 20) {
                    error = '用户名长度应在3-20字符之间';
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    error = '用户名只能包含字母、数字和下划线';
                }
                break;

            case 'registerEmail':
                if (!value) {
                    error = '邮箱地址不能为空';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = '请输入有效的邮箱地址';
                }
                break;

            case 'registerPassword':
                if (!value) {
                    error = '密码不能为空';
                } else if (value.length < 8) {
                    error = '密码长度至少8位';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    error = '密码必须包含大小写字母和数字';
                }
                break;

            case 'registerConfirmPassword':
                const password = document.getElementById('registerPassword');
                const passwordValue = password ? password.value : '';
                if (!value) {
                    error = '请确认密码';
                } else if (value !== passwordValue) {
                    error = '两次密码输入不一致';
                }
                break;
        }

        this.setFieldError(fieldId, error);
        return !error;
    }

    /**
     * 设置字段错误
     */
    setFieldError(fieldId, error) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const field = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = error;
        }

        if (field) {
            if (error) {
                field.classList.add('validation-error');
            } else {
                field.classList.remove('validation-error');
            }
        }
    }

    /**
     * 清除字段错误
     */
    clearFieldError(fieldId) {
        this.setFieldError(fieldId, '');
    }

    /**
     * 显示模态框
     */
    showModal(type) {
        this.hideModal(this.currentModal);
        this.currentModal = type;

        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.classList.add('auth-modal');
            modal.style.display = 'flex';

            // 聚焦第一个输入框
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }

        // 禁用背景滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 隐藏模态框
     */
    hideModal(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.style.display = 'none';
        }

        if (this.currentModal === type) {
            this.currentModal = null;
            document.body.style.overflow = '';
        }

        // 清除表单错误和状态
        this.clearFormState(type);
    }

    /**
     * 清除表单状态
     */
    clearFormState(type) {
        const form = document.getElementById(`${type}Form`);
        if (form) {
            form.reset();
            // 清除所有错误提示
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
            // 移除验证错误样式
            form.querySelectorAll('.validation-error').forEach(field => {
                field.classList.remove('validation-error');
            });
        }
    }

    /**
     * 处理登录
     */
    async handleLogin(e) {
        e.preventDefault();

        if (!this.userManagement) {
            this.showToast('系统未就绪，请稍后重试', 'error');
            return;
        }

        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 清除之前的错误
        this.clearFieldError('loginIdentifier');
        this.clearFieldError('loginPassword');

        // 验证输入
        let hasError = false;
        if (!identifier) {
            this.setFieldError('loginIdentifier', '请输入用户名或邮箱');
            hasError = true;
        }
        if (!password) {
            this.setFieldError('loginPassword', '请输入密码');
            hasError = true;
        }

        if (hasError) return;

        // 显示加载状态
        const submitBtn = document.getElementById('loginSubmitBtn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        this.setButtonLoading(submitBtn, true);

        try {
            // 判断是用户名还是邮箱
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
            const result = await this.userManagement.login(
                isEmail ? null : identifier,
                isEmail ? identifier : null,
                password,
                rememberMe
            );

            if (result.success) {
                this.showToast('登录成功！', 'success');
                this.hideModal('login');
                await this.updateUserUI();

                // 如果是记住登录，显示欢迎消息
                if (rememberMe) {
                    setTimeout(() => {
                        this.showToast(`欢迎回来，${result.user.username}！`, 'info');
                    }, 1000);
                }
            } else {
                // 显示具体错误信息
                switch (result.message) {
                    case 'User not found':
                        this.setFieldError('loginIdentifier', '用户不存在');
                        break;
                    case 'Incorrect password':
                        this.setFieldError('loginPassword', '密码错误');
                        break;
                    default:
                        this.showToast(result.message || '登录失败，请重试', 'error');
                }
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showToast('登录过程中发生错误，请重试', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }

    /**
     * 处理注册
     */
    async handleRegister(e) {
        e.preventDefault();

        if (!this.userManagement) {
            this.showToast('系统未就绪，请稍后重试', 'error');
            return;
        }

        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const agreeToTerms = document.getElementById('agreeToTerms').checked;

        // 验证所有字段
        const fields = ['registerUsername', 'registerEmail', 'registerPassword', 'registerConfirmPassword'];
        let hasError = false;

        for (const field of fields) {
            if (!this.validateRegisterField(field)) {
                hasError = true;
            }
        }

        if (!agreeToTerms) {
            this.showToast('请同意服务条款和隐私政策', 'warning');
            hasError = true;
        }

        if (hasError) return;

        // 显示加载状态
        const submitBtn = document.getElementById('registerSubmitBtn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        this.setButtonLoading(submitBtn, true);

        try {
            const result = await this.userManagement.register(username, email, password);

            if (result.success) {
                this.showToast('注册成功！正在自动登录...', 'success');
                this.hideModal('register');

                // 自动登录
                const loginResult = await this.userManagement.login(username, null, password, false);
                if (loginResult.success) {
                    await this.updateUserUI();
                    setTimeout(() => {
                        this.showToast(`欢迎加入万物可视化，${username}！`, 'info');
                    }, 1500);
                }
            } else {
                // 显示具体错误信息
                switch (result.message) {
                    case 'Username already exists':
                        this.setFieldError('registerUsername', '用户名已存在');
                        break;
                    case 'Email already exists':
                        this.setFieldError('registerEmail', '邮箱已被注册');
                        break;
                    default:
                        this.showToast(result.message || '注册失败，请重试', 'error');
                }
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showToast('注册过程中发生错误，请重试', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }

    /**
     * 处理忘记密码
     */
    async handleForgotPassword(e) {
        e.preventDefault();

        if (!this.userManagement) {
            this.showToast('系统未就绪，请稍后重试', 'error');
            return;
        }

        const email = document.getElementById('resetEmail').value.trim();

        // 清除之前的错误
        this.clearFieldError('resetEmail');

        // 验证输入
        let hasError = false;
        if (!email) {
            this.setFieldError('resetEmail', '请输入邮箱地址');
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.setFieldError('resetEmail', '请输入有效的邮箱地址');
            hasError = true;
        }

        if (hasError) return;

        // 显示加载状态
        const submitBtn = document.getElementById('resetSubmitBtn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        this.setButtonLoading(submitBtn, true);

        try {
            const result = await this.userManagement.forgotPassword(email);

            if (result.success) {
                // 演示版本：显示重置令牌
                this.showToast(`密码重置链接已发送！${result.message ? `演示令牌：${result.message}` : ''}`, 'success');

                // 清空表单
                document.getElementById('resetEmail').value = '';

                // 延迟返回登录界面
                setTimeout(() => {
                    this.hideModal('forgotPassword');
                    this.showModal('login');
                }, 2000);
            } else {
                this.showToast(result.message || '密码重置失败，请重试', 'error');
            }
        } catch (error) {
            console.error('密码重置错误:', error);
            this.showToast('密码重置过程中发生错误，请重试', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }

    /**
     * 处理登出
     */
    async handleLogout() {
        if (!this.userManagement) return;

        try {
            const result = await this.userManagement.logout();
            if (result.success) {
                this.showToast('已安全登出', 'info');
                await this.updateUserUI();
                this.hideUserDropdown();
            } else {
                this.showToast('登出失败，请重试', 'error');
            }
        } catch (error) {
            console.error('登出错误:', error);
            this.showToast('登出过程中发生错误', 'error');
        }
    }

    /**
     * 恢复用户状态
     */
    async restoreUserState() {
        if (!this.userManagement) return;

        try {
            const currentUser = this.userManagement.getCurrentUser();
            if (currentUser) {
                await this.updateUserUI();
                console.log('✅ 用户状态已恢复:', currentUser.username);
            }
        } catch (error) {
            console.error('恢复用户状态失败:', error);
        }
    }

    /**
     * 更新用户界面
     */
    async updateUserUI() {
        const currentUser = this.userManagement ? this.userManagement.getCurrentUser() : null;
        const userInfo = document.getElementById('userInfo');
        const guestAuth = document.getElementById('guestAuth');

        if (currentUser) {
            // 显示已登录状态
            if (userInfo) {
                userInfo.style.display = 'flex';

                // 更新用户信息
                const userName = document.getElementById('userName');
                const userRole = document.getElementById('userRole');

                if (userName) {
                    userName.textContent = currentUser.username;
                }

                if (userRole) {
                    userRole.textContent = this.getUserRoleDisplayName(currentUser.role);
                }

                // 更新头像（使用用户名首字母或默认头像）
                const avatarImg = userInfo.querySelector('.avatar-img');
                if (avatarImg) {
                    const initial = currentUser.username.charAt(0).toUpperCase();
                    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=6366f1&color=ffffff&size=128`;
                    avatarImg.alt = currentUser.username;
                }
            }

            if (guestAuth) {
                guestAuth.style.display = 'none';
            }
        } else {
            // 显示访客状态
            if (userInfo) {
                userInfo.style.display = 'none';
            }

            if (guestAuth) {
                guestAuth.style.display = 'flex';
            }
        }
    }

    /**
     * 获取用户角色显示名称
     */
    getUserRoleDisplayName(role) {
        const roleNames = {
            'guest': '访客',
            'user': '普通用户',
            'premium': '高级用户',
            'admin': '管理员'
        };
        return roleNames[role] || '用户';
    }

    /**
     * 切换用户下拉菜单
     */
    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            const isActive = dropdown.classList.contains('active');

            // 关闭所有下拉菜单
            document.querySelectorAll('.user-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });

            if (!isActive) {
                dropdown.classList.add('active');
            }
        }
    }

    /**
     * 隐藏用户下拉菜单
     */
    hideUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }

    /**
     * 设置按钮加载状态
     */
    setButtonLoading(button, loading, originalText = '') {
        const textSpan = button.querySelector('.btn-text');
        const loadingSpan = button.querySelector('.btn-loading');

        if (loading) {
            if (textSpan && !originalText) {
                originalText = textSpan.textContent;
            }
            if (textSpan) textSpan.style.display = 'none';
            if (loadingSpan) loadingSpan.style.display = 'inline';
            button.disabled = true;
        } else {
            if (textSpan) {
                textSpan.style.display = 'inline';
                if (originalText) textSpan.textContent = originalText;
            }
            if (loadingSpan) loadingSpan.style.display = 'none';
            button.disabled = false;
        }
    }

    /**
     * 初始化 Toast 容器
     */
    initToastContainer() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            this.toastContainer.id = 'toastContainer';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * 显示 Toast 消息
     */
    showToast(message, type = 'info', title = null, duration = 5000) {
        if (!this.toastContainer) {
            this.initToastContainer();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // 图标
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = icons[type] || icons.info;

        // 内容
        const content = document.createElement('div');
        content.className = 'toast-content';

        if (title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'toast-title';
            titleElement.textContent = title;
            content.appendChild(titleElement);
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(closeBtn);

        this.toastContainer.appendChild(toast);

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
    }

    /**
     * 移除 Toast
     */
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.userManagement ? this.userManagement.getCurrentUser() : null;
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    /**
     * 获取用户角色
     */
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : 'guest';
    }

    /**
     * 切换测试账号下拉菜单
     */
    toggleTestAccountsDropdown() {
        const dropdown = document.getElementById('testAccountsInfo');
        if (dropdown) {
            const isActive = dropdown.classList.contains('active');

            // 关闭所有下拉菜单
            document.querySelectorAll('.test-accounts-info.active').forEach(d => {
                d.classList.remove('active');
            });
            document.querySelectorAll('.user-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });

            if (!isActive) {
                dropdown.classList.add('active');
            }
        }
    }

    /**
     * 处理测试账号点击
     */
    async handleTestAccountClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const accountItem = e.target.closest('.test-account-item');
        if (!accountItem) return;

        const username = accountItem.dataset.username;
        const password = accountItem.dataset.password;

        if (!username || !password) {
            this.showToast('账号信息不完整', 'error');
            return;
        }

        // 关闭测试账号下拉菜单
        const testAccountsInfo = document.getElementById('testAccountsInfo');
        if (testAccountsInfo) {
            testAccountsInfo.classList.remove('active');
        }

        // 自动填充登录表单并登录
        await this.autoLoginWithTestAccount(username, password);
    }

    /**
     * 使用测试账号自动登录
     */
    async autoLoginWithTestAccount(username, password) {
        if (!this.userManagement) {
            this.showToast('系统未就绪，请稍后重试', 'error');
            return;
        }

        // 显示登录模态框
        this.showModal('login');

        // 填充表单
        const identifierField = document.getElementById('loginIdentifier');
        const passwordField = document.getElementById('loginPassword');
        const rememberMeField = document.getElementById('rememberMe');

        if (identifierField) {
            identifierField.value = username;
            this.clearFieldError('loginIdentifier');
        }

        if (passwordField) {
            passwordField.value = password;
            this.clearFieldError('loginPassword');
        }

        if (rememberMeField) {
            rememberMeField.checked = false; // 测试账号不记住登录状态
        }

        // 显示提示
        this.showToast(`正在使用测试账号 ${username} 登录...`, 'info');

        // 短暂延迟后自动提交登录
        setTimeout(async () => {
            const form = document.getElementById('loginForm');
            if (form) {
                // 模拟表单提交
                const submitEvent = new Event('submit', { cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        }, 500);
    }

    /**
     * 检查是否为开发环境并显示测试账号
     */
    checkAndShowTestAccounts() {
        // 在开发环境中自动显示测试账号提示
        const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        if (isDevelopment && !this.isLoggedIn()) {
            // 延迟显示测试账号提示
            setTimeout(() => {
                this.showToast('💡 开发模式：点击右上角 👥 查看测试账号', 'info', '测试账号提示', 8000);
            }, 2000);
        }
    }
}

// 创建全局实例
window.authUI = new AuthenticationUI();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationUI;
}