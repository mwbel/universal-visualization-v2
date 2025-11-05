/**
 * 用户管理系统
 * 提供用户认证、权限管理、个人项目等功能
 */
class UserManagement {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.sessions = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.userProjects = new Map();
        this.userPreferences = new Map();
        this.apiKeys = new Map();

        this.initializeRoles();
        this.initializePermissions();
        this.createTestUsers();
        this.loadFromStorage();
    }

    /**
     * 创建测试用户
     */
    createTestUsers() {
        // 只在没有用户时创建测试用户
        if (this.users.size > 0) {
            return;
        }

        const testUsers = [
            {
                username: 'admin',
                email: 'admin@alvis.com',
                password: 'admin123',
                role: 'admin',
                displayName: '系统管理员',
                bio: '万物可视化平台管理员账户',
                institution: 'AlVisual Team'
            },
            {
                username: 'user',
                email: 'user@alvis.com',
                password: 'user123',
                role: 'user',
                displayName: '测试用户',
                bio: '这是一个普通的测试用户账户',
                institution: '示例大学'
            },
            {
                username: 'premium',
                email: 'premium@alvis.com',
                password: 'premium123',
                role: 'premium',
                displayName: '高级用户',
                bio: '拥有高级权限的测试账户',
                institution: '高级研究院'
            },
            {
                username: 'educator',
                email: 'edu@alvis.com',
                password: 'edu123',
                role: 'educator',
                displayName: '教育者',
                bio: '专注于教育可视化的教师账户',
                institution: '教育学院'
            },
            {
                username: 'researcher',
                email: 'research@alvis.com',
                password: 'research123',
                role: 'researcher',
                displayName: '研究员',
                bio: '科学研究可视化专家',
                institution: '科学研究所'
            }
        ];

        // 为每个测试用户创建账户（使用简单的密码哈希）
        testUsers.forEach((userData) => {
            try {
                // 简单的密码哈希（用于测试）
                const hashedPassword = btoa(userData.password + 'salt');

                const user = {
                    id: this.generateUserId(),
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    isActive: true,
                    profile: {
                        displayName: userData.displayName || userData.username,
                        avatar: null,
                        bio: userData.bio || '',
                        institution: userData.institution || '',
                        interests: []
                    },
                    settings: {
                        theme: 'auto',
                        language: 'zh-CN',
                        notifications: {
                            email: true,
                            browser: true,
                            projects: true,
                            security: true
                        },
                        privacy: {
                            profileVisibility: 'public',
                            projectVisibility: 'public',
                            showEmail: false
                        }
                    },
                    statistics: {
                        projectsCreated: 0,
                        projectsShared: 0,
                        totalViews: 0,
                        apiCalls: 0,
                        storageUsed: 0
                    }
                };

                this.users.set(user.id, user);
                console.log(`✅ 测试用户创建成功: ${userData.username} (${userData.role})`);
            } catch (error) {
                console.error(`❌ 创建测试用户失败: ${userData.username}`, error);
            }
        });
    }

    /**
     * 初始化角色系统
     */
    initializeRoles() {
        this.roles.set('guest', {
            name: '访客',
            level: 0,
            description: '只读权限，可以查看公开内容'
        });

        this.roles.set('user', {
            name: '普通用户',
            level: 1,
            description: '基础用户权限，可以创建和管理个人项目'
        });

        this.roles.set('premium', {
            name: '高级用户',
            level: 2,
            description: '高级权限，可以使用所有功能和高级特性'
        });

        this.roles.set('educator', {
            name: '教育者',
            level: 3,
            description: '教育专用权限，可以创建教学材料和班级管理'
        });

        this.roles.set('researcher', {
            name: '研究者',
            level: 4,
            description: '研究权限，可以访问高级分析工具和原始数据'
        });

        this.roles.set('admin', {
            name: '管理员',
            level: 5,
            description: '完全权限，可以管理所有用户和系统设置'
        });
    }

    /**
     * 初始化权限系统
     */
    initializePermissions() {
        // 基础权限
        this.permissions.set('view_public', ['guest', 'user', 'premium', 'educator', 'researcher', 'admin']);
        // 临时为访客添加项目管理权限（等认证功能完善后再移除）
        this.permissions.set('create_project', ['guest', 'user', 'premium', 'educator', 'researcher', 'admin']);
        this.permissions.set('edit_own_project', ['guest', 'user', 'premium', 'educator', 'researcher', 'admin']);
        this.permissions.set('delete_own_project', ['guest', 'user', 'premium', 'educator', 'researcher', 'admin']);

        // 高级功能权限（临时为访客添加部分权限）
        this.permissions.set('batch_operations', ['guest', 'premium', 'educator', 'researcher', 'admin']);
        this.permissions.set('export_high_quality', ['premium', 'educator', 'researcher', 'admin']);
        this.permissions.set('api_access', ['researcher', 'admin']);
        this.permissions.set('collaboration', ['premium', 'educator', 'researcher', 'admin']);

        // 教育专用权限
        this.permissions.set('create_class', ['educator', 'admin']);
        this.permissions.set('manage_students', ['educator', 'admin']);
        this.permissions.set('create_materials', ['educator', 'admin']);

        // 研究专用权限
        this.permissions.set('access_raw_data', ['researcher', 'admin']);
        this.permissions.set('advanced_analysis', ['researcher', 'admin']);
        this.permissions.set('publish_research', ['researcher', 'admin']);

        // 管理员权限（临时为访客添加查看自己分析数据的权限）
        this.permissions.set('manage_users', ['admin']);
        this.permissions.set('system_settings', ['admin']);
        this.permissions.set('view_analytics', ['guest', 'admin']);
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @returns {Promise} 注册结果
     */
    async register(userDataOrUsername, email, password, role = 'user') {
        // 支持两种调用方式：register(userData) 或 register(username, email, password, role)
        let userData;
        if (typeof userDataOrUsername === 'object') {
            // register(userData) 调用方式
            userData = userDataOrUsername;
        } else {
            // register(username, email, password, role) 调用方式
            userData = {
                username: userDataOrUsername,
                email: email,
                password: password,
                role: role
            };
        }

        const { username, email: userEmail, password: userPassword, role: userRole = 'user' } = userData;

        // 验证输入
        if (!username || !userEmail || !userPassword) {
            throw new Error('用户名、邮箱和密码不能为空');
        }

        if (this.getUserByUsername(username)) {
            throw new Error('用户名已存在');
        }

        if (this.getUserByEmail(userEmail)) {
            throw new Error('邮箱已被注册');
        }

        // 创建用户
        const user = {
            id: this.generateUserId(),
            username,
            email: userEmail,
            password: await this.hashPassword(userPassword),
            role: userRole,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            profile: {
                displayName: username,
                avatar: null,
                bio: '',
                institution: '',
                interests: []
            },
            settings: {
                theme: 'auto',
                language: 'zh-CN',
                notifications: true,
                privacy: 'public'
            },
            usage: {
                projectsCreated: 0,
                visualizationsGenerated: 0,
                storageUsed: 0,
                apiCalls: 0
            },
            limits: {
                maxProjects: this.getRoleLimits(role).maxProjects,
                maxStorage: this.getRoleLimits(role).maxStorage,
                maxApiCalls: this.getRoleLimits(role).maxApiCalls
            }
        };

        this.users.set(user.id, user);
        this.userProjects.set(user.id, []);
        this.userPreferences.set(user.id, {});

        this.saveToStorage();

        return {
            success: true,
            user: this.sanitizeUser(user)
        };
    }

    /**
     * 用户登录
     * @param {string|null} username - 用户名（为null时使用邮箱登录）
     * @param {string|null} email - 邮箱（为null时使用用户名登录）
     * @param {string} password - 密码
     * @param {boolean} rememberMe - 是否记住登录状态
     * @returns {Promise} 登录结果
     */
    async login(username, email, password, rememberMe = false) {
        // 查找用户 - 支持用户名或邮箱登录
        let user = null;

        if (username && !email) {
            // 使用用户名登录
            user = this.getUserByUsername(username);
        } else if (email && !username) {
            // 使用邮箱登录
            user = this.getUserByEmail(email);
        } else if (username && email) {
            // 如果都提供了，优先使用用户名
            user = this.getUserByUsername(username);
            if (!user) {
                user = this.getUserByEmail(email);
            }
        } else {
            // 都为空，尝试按用户名或邮箱查找
            user = this.getUserByUsername(password);
            if (!user) {
                user = this.getUserByEmail(password);
            }
        }

        if (!user) {
            throw new Error('用户不存在');
        }

        if (!user.isActive) {
            throw new Error('账户已被禁用');
        }

        // 验证密码
        const isPasswordValid = await this.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('密码错误');
        }

        // 创建会话
        const session = {
            id: this.generateSessionId(),
            userId: user.id,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
        };

        this.sessions.set(session.id, session);
        this.currentUser = user;

        // 更新最后登录时间
        user.lastLogin = new Date().toISOString();
        this.saveToStorage();

        // 计算会话过期时间
        const sessionDuration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7天或24小时

        return {
            success: true,
            user: this.sanitizeUser(user),
            session: {
                id: session.id,
                expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
                rememberMe: rememberMe
            }
        };
    }

    /**
     * 用户登出
     */
    logout() {
        if (this.currentUser) {
            // 清除会话
            const session = this.getCurrentSession();
            if (session) {
                this.sessions.delete(session.id);
            }

            this.currentUser = null;
            this.saveToStorage();
        }
    }

    /**
     * 检查权限
     * @param {string} permission - 权限名称
     * @returns {boolean} 是否有权限
     */
    hasPermission(permission) {
        if (!this.currentUser) {
            return this.permissions.get(permission)?.includes('guest') || false;
        }

        const userRole = this.currentUser.role;
        return this.permissions.get(permission)?.includes(userRole) || false;
    }

    /**
     * 获取用户项目
     * @param {string} userId - 用户ID
     * @returns {Array} 项目列表
     */
    getUserProjects(userId) {
        return this.userProjects.get(userId) || [];
    }

    /**
     * 创建用户项目
     * @param {Object} projectData - 项目数据
     * @returns {Object} 创建结果
     */
    createUserProject(projectData) {
        if (!this.hasPermission('create_project')) {
            throw new Error('没有创建项目的权限');
        }

        const userProjects = this.getUserProjects(this.currentUser.id);
        const limits = this.currentUser.limits;

        if (userProjects.length >= limits.maxProjects) {
            throw new Error('已达到项目数量限制');
        }

        const project = {
            id: this.generateProjectId(),
            userId: this.currentUser.id,
            name: projectData.name,
            description: projectData.description || '',
            type: projectData.type || 'visualization',
            visibility: projectData.visibility || 'private',
            tags: projectData.tags || [],
            content: projectData.content || {},
            settings: projectData.settings || {},
            collaborators: projectData.collaborators || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            isPublic: projectData.visibility === 'public',
            statistics: {
                views: 0,
                likes: 0,
                forks: 0,
                comments: 0
            }
        };

        userProjects.push(project);
        this.currentUser.usage.projectsCreated++;
        this.saveToStorage();

        return project;
    }

    /**
     * 更新用户项目
     * @param {string} projectId - 项目ID
     * @param {Object} updates - 更新数据
     * @returns {Object} 更新结果
     */
    updateUserProject(projectId, updates) {
        const userProjects = this.getUserProjects(this.currentUser.id);
        const project = userProjects.find(p => p.id === projectId);

        if (!project) {
            throw new Error('项目不存在');
        }

        if (!this.hasPermission('edit_own_project') && project.userId !== this.currentUser.id) {
            throw new Error('没有编辑权限');
        }

        // 更新项目
        Object.assign(project, updates);
        project.updatedAt = new Date().toISOString();
        project.version++;

        this.saveToStorage();

        return project;
    }

    /**
     * 删除用户项目
     * @param {string} projectId - 项目ID
     * @returns {boolean} 删除结果
     */
    deleteUserProject(projectId) {
        const userProjects = this.getUserProjects(this.currentUser.id);
        const projectIndex = userProjects.findIndex(p => p.id === projectId);

        if (projectIndex === -1) {
            throw new Error('项目不存在');
        }

        const project = userProjects[projectIndex];

        if (!this.hasPermission('delete_own_project') && project.userId !== this.currentUser.id) {
            throw new Error('没有删除权限');
        }

        userProjects.splice(projectIndex, 1);
        this.saveToStorage();

        return true;
    }

    /**
     * 更新用户配置
     * @param {Object} preferences - 用户偏好
     */
    updateUserPreferences(preferences) {
        if (!this.currentUser) return;

        const currentPrefs = this.userPreferences.get(this.currentUser.id) || {};
        const updatedPrefs = { ...currentPrefs, ...preferences };

        this.userPreferences.set(this.currentUser.id, updatedPrefs);
        this.saveToStorage();
    }

    /**
     * 获取用户偏好
     * @returns {Object} 用户偏好
     */
    getUserPreferences() {
        if (!this.currentUser) return {};
        return this.userPreferences.get(this.currentUser.id) || {};
    }

    /**
     * 生成API密钥
     * @param {Object} options - 选项
     * @returns {Object} API密钥信息
     */
    generateApiKey(options = {}) {
        if (!this.hasPermission('api_access')) {
            throw new Error('没有API访问权限');
        }

        const apiKey = {
            id: this.generateApiKeyId(),
            userId: this.currentUser.id,
            name: options.name || 'API密钥',
            key: this.generateRandomKey(),
            permissions: options.permissions || ['read'],
            createdAt: new Date().toISOString(),
            expiresAt: options.expiresAt || null,
            lastUsed: null,
            usageCount: 0,
            isActive: true
        };

        if (!this.apiKeys.has(this.currentUser.id)) {
            this.apiKeys.set(this.currentUser.id, []);
        }

        this.apiKeys.get(this.currentUser.id).push(apiKey);
        this.saveToStorage();

        return apiKey;
    }

    /**
     * 验证API密钥
     * @param {string} apiKey - API密钥
     * @returns {Object|null} 用户信息
     */
    validateApiKey(apiKey) {
        for (const [userId, keys] of this.apiKeys.entries()) {
            const key = keys.find(k => k.key === apiKey && k.isActive);
            if (key) {
                // 更新使用记录
                key.lastUsed = new Date().toISOString();
                key.usageCount++;
                this.saveToStorage();

                const user = this.users.get(userId);
                return user ? this.sanitizeUser(user) : null;
            }
        }
        return null;
    }

    /**
     * 获取角色限制
     * @param {string} role - 角色名称
     * @returns {Object} 角色限制
     */
    getRoleLimits(role) {
        const limits = {
            guest: {
                maxProjects: 0,
                maxStorage: 0,
                maxApiCalls: 0
            },
            user: {
                maxProjects: 10,
                maxStorage: 100 * 1024 * 1024, // 100MB
                maxApiCalls: 1000
            },
            premium: {
                maxProjects: 100,
                maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
                maxApiCalls: 100000
            },
            educator: {
                maxProjects: 500,
                maxStorage: 50 * 1024 * 1024 * 1024, // 50GB
                maxApiCalls: 500000
            },
            researcher: {
                maxProjects: 1000,
                maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
                maxApiCalls: 1000000
            },
            admin: {
                maxProjects: -1, // 无限制
                maxStorage: -1,
                maxApiCalls: -1
            }
        };

        return limits[role] || limits.user;
    }

    /**
     * 获取用户统计信息
     * @returns {Object} 统计信息
     */
    getUserStats() {
        if (!this.currentUser) return null;

        const userProjects = this.getUserProjects(this.currentUser.id);
        const totalViews = userProjects.reduce((sum, project) => sum + project.statistics.views, 0);
        const totalLikes = userProjects.reduce((sum, project) => sum + project.statistics.likes, 0);

        return {
            projectsCount: userProjects.length,
            totalViews,
            totalLikes,
            storageUsed: this.currentUser.usage.storageUsed,
            apiCallsUsed: this.currentUser.usage.apiCalls,
            memberSince: this.currentUser.createdAt,
            lastLogin: this.currentUser.lastLogin,
            role: this.currentUser.role,
            limits: this.currentUser.limits
        };
    }

    /**
     * 搜索用户项目
     * @param {string} query - 搜索查询
     * @param {Object} filters - 过滤器
     * @returns {Array} 搜索结果
     */
    searchUserProjects(query, filters = {}) {
        const userProjects = this.getUserProjects(this.currentUser.id);
        let results = userProjects;

        // 文本搜索
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(project =>
                project.name.toLowerCase().includes(lowerQuery) ||
                project.description.toLowerCase().includes(lowerQuery) ||
                project.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        // 类型过滤
        if (filters.type) {
            results = results.filter(project => project.type === filters.type);
        }

        // 标签过滤
        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(project =>
                filters.tags.some(tag => project.tags.includes(tag))
            );
        }

        // 可见性过滤
        if (filters.visibility) {
            results = results.filter(project => project.visibility === filters.visibility);
        }

        // 时间过滤
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            results = results.filter(project => new Date(project.createdAt) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            results = results.filter(project => new Date(project.createdAt) <= toDate);
        }

        return results;
    }

    /**
     * 导出用户数据
     * @param {string} format - 导出格式
     * @returns {Blob} 导出数据
     */
    exportUserData(format = 'json') {
        if (!this.currentUser) {
            throw new Error('用户未登录');
        }

        const userData = {
            user: this.sanitizeUser(this.currentUser),
            projects: this.getUserProjects(this.currentUser.id),
            preferences: this.getUserPreferences(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        switch (format.toLowerCase()) {
            case 'json':
                return new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
            case 'csv':
                return this.exportProjectsAsCSV(userData.projects);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 导出项目为CSV
     */
    exportProjectsAsCSV(projects) {
        const headers = ['ID', '名称', '类型', '可见性', '创建时间', '更新时间', '浏览量', '点赞数'];
        const csvRows = [headers.join(',')];

        projects.forEach(project => {
            const row = [
                project.id,
                `"${project.name}"`,
                project.type,
                project.visibility,
                project.createdAt,
                project.updatedAt,
                project.statistics.views,
                project.statistics.likes
            ];
            csvRows.push(row.join(','));
        });

        return new Blob([csvRows.join('\n')], { type: 'text/csv' });
    }

    // 工具方法
    generateUserId() {
        return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionId() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateProjectId() {
        return 'project-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateApiKeyId() {
        return 'apikey-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateRandomKey() {
        return 'ak-' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async hashPassword(password) {
        // 在实际应用中应该使用更安全的哈希算法
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async verifyPassword(password, hash) {
        // 首先检查是否是测试密码（简单哈希）
        const testHash = btoa(password + 'salt');
        if (testHash === hash) {
            return true;
        }

        // 然后检查正常密码哈希
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }

    getUserByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }

    getUserByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    getCurrentSession() {
        if (!this.currentUser) return null;

        for (const session of this.sessions.values()) {
            if (session.userId === this.currentUser.id) {
                return session;
            }
        }
        return null;
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    getClientIP() {
        // 在实际应用中应该从服务器获取真实IP
        return '127.0.0.1';
    }

    saveToStorage() {
        const data = {
            users: Array.from(this.users.entries()),
            sessions: Array.from(this.sessions.entries()),
            userProjects: Array.from(this.userProjects.entries()),
            userPreferences: Array.from(this.userPreferences.entries()),
            apiKeys: Array.from(this.apiKeys.entries()),
            currentUser: this.currentUser ? this.currentUser.id : null
        };
        localStorage.setItem('userManagement', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('userManagement');
            if (data) {
                const parsed = JSON.parse(data);
                this.users = new Map(parsed.users || []);
                this.sessions = new Map(parsed.sessions || []);
                this.userProjects = new Map(parsed.userProjects || []);
                this.userPreferences = new Map(parsed.userPreferences || []);
                this.apiKeys = new Map(parsed.apiKeys || []);

                if (parsed.currentUser) {
                    this.currentUser = this.users.get(parsed.currentUser) || null;
                }
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManagement;
} else {
    window.UserManagement = UserManagement;
}