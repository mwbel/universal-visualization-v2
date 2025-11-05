/**
 * high-school.js - 高中学科导航页面JavaScript
 * 处理页面交互、学科选择和导航逻辑
 */

(function() {
    'use strict';

    class HighSchoolApp {
        constructor() {
            this.currentSubject = null;
            this.themeManager = null;
            this.isLoading = false;

            this.init();
        }

        async init() {
            try {
                // 初始化主题管理器
                this.initThemeManager();

                // 绑定事件
                this.bindEvents();

                // 加载用户数据
                await this.loadUserData();

                // 初始化页面动画
                this.initAnimations();

                console.log('High School App initialized successfully');

            } catch (error) {
                console.error('High School App initialization failed:', error);
                this.showError('应用初始化失败，请刷新页面重试');
            }
        }

        initThemeManager() {
            // 初始化主题管理器
            if (typeof ThemeManager !== 'undefined') {
                this.themeManager = new ThemeManager();
            } else {
                console.warn('ThemeManager not found');
            }
        }

        bindEvents() {
            // 主题切换按钮
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    if (this.themeManager) {
                        this.themeManager.toggleTheme();
                    }
                });
            }

            // 学科卡片点击事件
            document.querySelectorAll('.subject-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // 如果点击的是按钮，不触发卡片点击
                    if (e.target.closest('.subject-actions')) {
                        return;
                    }

                    const subject = card.dataset.subject;
                    this.selectSubject(subject);
                });
            });

            // 页面可见性变化事件
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.refreshUserData();
                }
            });

            // 窗口大小变化事件
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }

        async loadUserData() {
            try {
                // 从本地存储加载用户数据
                const userData = localStorage.getItem('highschool_user_data');
                if (userData) {
                    const data = JSON.parse(userData);
                    this.updateUserStats(data);
                }

                // 模拟加载学习进度
                await this.loadLearningProgress();

            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        }

        async loadLearningProgress() {
            // 模拟加载各学科的学习进度
            const progressData = {
                math: {
                    completedConcepts: 0,
                    totalConcepts: 50,
                    progress: 0
                },
                physics: {
                    completedConcepts: 15,
                    totalConcepts: 50,
                    progress: 30
                },
                chemistry: {
                    completedConcepts: 10,
                    totalConcepts: 50,
                    progress: 20
                },
                biology: {
                    completedConcepts: 5,
                    totalConcepts: 50,
                    progress: 10
                }
            };

            // 更新每个学科卡片的进度
            Object.keys(progressData).forEach(subject => {
                this.updateSubjectProgress(subject, progressData[subject]);
            });
        }

        updateSubjectProgress(subject, progress) {
            const card = document.querySelector(`[data-subject="${subject}"]`);
            if (!card) return;

            const progressFill = card.querySelector('.progress-fill');
            const progressText = card.querySelector('.progress-text');

            if (progressFill) {
                progressFill.style.width = `${progress.progress}%`;
            }

            if (progressText) {
                progressText.textContent = subject === 'math'
                    ? `${progress.completedConcepts}/${progress.totalConcepts} 概念`
                    : '开发中';
            }
        }

        updateUserStats(userData) {
            const stats = document.querySelectorAll('.stat-card .stat-number');
            if (stats.length >= 4) {
                stats[0].textContent = userData.studyTime || 0;
                stats[1].textContent = userData.completedConcepts || 0;
                stats[2].textContent = userData.completedExercises || 0;
                stats[3].textContent = userData.achievements || 0;
            }
        }

        selectSubject(subject) {
            // 移除之前的选中状态
            document.querySelectorAll('.subject-card').forEach(card => {
                card.classList.remove('selected');
            });

            // 添加选中状态
            const card = document.querySelector(`[data-subject="${subject}"]`);
            if (card) {
                card.classList.add('selected');
                this.currentSubject = subject;

                // 触发选中动画
                this.animateSelection(card);
            }
        }

        animateSelection(card) {
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);
        }

        initAnimations() {
            // 添加滚动动画观察器
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.animationPlayState = 'running';
                        }
                    });
                }, {
                    threshold: 0.1
                });

                // 观察所有需要动画的元素
                document.querySelectorAll('.subject-card, .feature-item, .stat-card').forEach(el => {
                    el.style.animationPlayState = 'paused';
                    observer.observe(el);
                });
            }

            // 添加数字递增动画
            this.animateNumbers();
        }

        animateNumbers() {
            const animateValue = (element, start, end, duration) => {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    const value = Math.floor(progress * (end - start) + start);
                    element.textContent = value;
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            };

            // 为统计数字添加动画
            document.querySelectorAll('.stat-number').forEach(stat => {
                const endValue = parseInt(stat.textContent);
                if (endValue > 0) {
                    animateValue(stat, 0, endValue, 2000);
                }
            });
        }

        handleResize() {
            // 处理响应式布局调整
            if (window.innerWidth < 768) {
                // 移动端适配
                document.body.classList.add('mobile-view');
            } else {
                document.body.classList.remove('mobile-view');
            }
        }

        async refreshUserData() {
            // 刷新用户数据
            await this.loadUserData();
        }

        // 显示加载状态
        showLoading(message = '正在加载...') {
            this.isLoading = true;
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.querySelector('p').textContent = message;
                overlay.style.display = 'flex';
            }
        }

        // 隐藏加载状态
        hideLoading() {
            this.isLoading = false;
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }

        // 显示Toast消息
        showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;

            container.appendChild(toast);

            // 3秒后自动移除
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }

        // 显示成功消息
        showSuccess(message) {
            this.showToast(message, 'success');
        }

        // 显示错误消息
        showError(message) {
            this.showToast(message, 'error');
        }

        // 显示警告消息
        showWarning(message) {
            this.showToast(message, 'warning');
        }

        // 显示信息消息
        showInfo(message) {
            this.showToast(message, 'info');
        }
    }

    // 全局函数，供HTML调用
    window.enterSubject = function(subject) {
        if (!window.highSchoolApp || window.highSchoolApp.isLoading) return;

        const availableSubjects = ['math'];

        if (availableSubjects.includes(subject)) {
            window.highSchoolApp.showLoading('正在进入学科...');

            // 模拟加载延迟
            setTimeout(() => {
                // 根据学科跳转到相应的学习页面
                const subjectUrls = {
                    math: 'math/index.html',
                    physics: 'physics/index.html',
                    chemistry: 'chemistry/index.html',
                    biology: 'biology/index.html'
                };

                const url = subjectUrls[subject];
                if (url) {
                    window.location.href = url;
                } else {
                    window.highSchoolApp.hideLoading();
                    window.highSchoolApp.showError('该学科页面正在开发中');
                }
            }, 1000);
        } else {
            window.highSchoolApp.showWarning('该学科正在开发中，敬请期待');
        }
    };

    window.viewCurriculum = function(subject) {
        if (!window.highSchoolApp) return;

        window.highSchoolApp.showLoading('正在加载教材内容...');

        // 模拟加载教材内容
        setTimeout(() => {
            window.highSchoolApp.hideLoading();
            window.highSchoolApp.showInfo(`${subject.toUpperCase()}教材内容正在整理中`);

            // 这里可以跳转到教材预览页面
            // window.location.href = `curriculum/${subject}.html`;
        }, 800);
    };

    // 页面加载完成后初始化应用
    document.addEventListener('DOMContentLoaded', () => {
        window.highSchoolApp = new HighSchoolApp();
    });

})();