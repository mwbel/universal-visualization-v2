/**
 * MobileEnhancer.js - 移动端增强组件
 * 提供触摸优化、手势支持、移动端导航等功能
 */
(function(global) {
  'use strict';

  class MobileEnhancer {
    constructor(options = {}) {
      this.options = {
        enableGestures: true,
        enableTouchOptimization: true,
        enableMobileNavigation: true,
        enableSwipeNavigation: true,
        enablePullToRefresh: false,
        enableHapticFeedback: true,
        touchThreshold: 10,
        swipeThreshold: 50,
        longPressThreshold: 500,
        doubleTapThreshold: 300,
        ...options
      };

      this.state = {
        isMobile: this.detectMobile(),
        isTouch: this.detectTouch(),
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0,
        lastTapTime: 0,
        tapCount: 0,
        longPressTimer: null,
        isScrolling: false,
        navigationOpen: false,
        swipeDirection: null,
        touchElements: new Set()
      };

      this.elements = {};
      this.gestures = {};
      this.init();
    }

    init() {
      if (!this.state.isMobile && !this.state.isTouch) {
        console.log('MobileEnhancer: Not a mobile/touch device, skipping initialization');
        return;
      }

      this.bindElements();
      this.setupTouchOptimizations();
      this.setupGestures();
      this.setupMobileNavigation();
      this.setupViewportOptimizations();
      this.bindEvents();

      console.log('MobileEnhancer initialized for', this.state.isMobile ? 'mobile' : 'touch', 'device');
    }

    detectMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             window.innerWidth <= 768;
    }

    detectTouch() {
      return 'ontouchstart' in window ||
             navigator.maxTouchPoints > 0 ||
             navigator.msMaxTouchPoints > 0;
    }

    bindElements() {
      // 主要交互元素
      this.elements.main = document.querySelector('main');
      this.elements.header = document.querySelector('.app-header');
      this.elements.navToggle = document.querySelector('.mobile-nav-toggle');
      this.elements.mobileNav = document.querySelector('.mobile-navigation');
      this.elements.content = document.querySelector('.app-main');

      // 输入相关元素
      this.elements.inputs = document.querySelectorAll('input, textarea, select');
      this.elements.buttons = document.querySelectorAll('button, .btn, .module-btn');
      this.elements.links = document.querySelectorAll('a');

      // 模块相关元素
      this.elements.moduleCards = document.querySelectorAll('.module-card');
      this.elements.templateCards = document.querySelectorAll('.template-card');
      this.elements.quickNav = document.querySelectorAll('.quick-nav-item');
    }

    setupTouchOptimizations() {
      if (!this.options.enableTouchOptimization) return;

      // 优化触摸目标大小
      this.enlargeTouchTargets();

      // 禁用点击延迟
      this.disableClickDelay();

      // 添加触摸反馈
      this.addTouchFeedback();

      // 优化表单输入
      this.optimizeFormInputs();

      // 优化滚动
      this.optimizeScrolling();
    }

    enlargeTouchTargets() {
      // 确保按钮和链接有足够的触摸区域
      const touchTargets = document.querySelectorAll(`
        button, .btn, .module-btn, input[type="button"],
        .nav-btn, .generate-btn, .mode-btn
      `);

      touchTargets.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const width = parseInt(computedStyle.width);
        const height = parseInt(computedStyle.height);

        // 确保最小触摸区域为44x44px
        if (width < 44 || height < 44) {
          element.style.minWidth = '44px';
          element.style.minHeight = '44px';
          element.style.display = 'flex';
          element.style.alignItems = 'center';
          element.style.justifyContent = 'center';
        }

        // 添加到触摸元素集合
        this.state.touchElements.add(element);
      });
    }

    disableClickDelay() {
      // FastClick - 移除300ms点击延迟
      document.addEventListener('touchstart', function(e) {
        // 标记触摸元素
        const touchElement = e.target.closest('button, a, input, label, [onclick]');
        if (touchElement) {
          touchElement.setAttribute('data-touch', 'true');
        }
      });

      // 处理触摸结束
      document.addEventListener('touchend', function(e) {
        const touchElement = e.target.closest('[data-touch]');
        if (touchElement) {
          e.preventDefault();
          touchElement.click();
          touchElement.removeAttribute('data-touch');
        }
      });
    }

    addTouchFeedback() {
      // 添加触摸开始反馈
      document.addEventListener('touchstart', (e) => {
        const target = e.target.closest('button, .btn, .module-btn, .quick-nav-item, .template-card');
        if (target) {
          target.classList.add('touch-active');
        }
      });

      // 移除触摸反馈
      document.addEventListener('touchend', (e) => {
        const targets = document.querySelectorAll('.touch-active');
        targets.forEach(target => target.classList.remove('touch-active'));
      });

      // 处理触摸取消
      document.addEventListener('touchcancel', (e) => {
        const targets = document.querySelectorAll('.touch-active');
        targets.forEach(target => target.classList.remove('touch-active'));
      });
    }

    optimizeFormInputs() {
      this.elements.inputs.forEach(input => {
        // 防止iOS缩放
        input.style.fontSize = '16px';

        // 添加更好的触摸体验
        input.addEventListener('focus', () => {
          input.classList.add('input-focused');
        });

        input.addEventListener('blur', () => {
          input.classList.remove('input-focused');
        });

        // 优化数字输入
        if (input.type === 'number') {
          input.setAttribute('inputmode', 'numeric');
          input.setAttribute('pattern', '[0-9]*');
        }
      });
    }

    optimizeScrolling() {
      // 平滑滚动
      if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
      }

      // iOS滚动优化
      document.body.style.webkitOverflowScrolling = 'touch';

      // 监听滚动状态
      let scrollTimer;
      window.addEventListener('scroll', () => {
        this.state.isScrolling = true;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.state.isScrolling = false;
        }, 150);
      });
    }

    setupGestures() {
      if (!this.options.enableGestures) return;

      // 绑定触摸事件
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

      // 设置手势处理器
      this.gestures = {
        swipe: new Set(),
        pinch: new Set(),
        longPress: new Set(),
        doubleTap: new Set()
      };
    }

    handleTouchStart(e) {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      this.state.touchStartX = touch.clientX;
      this.state.touchStartY = touch.clientY;
      this.state.touchStartTime = Date.now();

      // 长按检测
      this.state.longPressTimer = setTimeout(() => {
        this.handleLongPress(e);
      }, this.options.longPressThreshold);
    }

    handleTouchMove(e) {
      // 清除长按定时器
      if (this.state.longPressTimer) {
        clearTimeout(this.state.longPressTimer);
        this.state.longPressTimer = null;
      }

      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.state.touchStartX;
      const deltaY = touch.clientY - this.state.touchStartY;

      // 检测滑动方向
      if (Math.abs(deltaX) > this.options.touchThreshold || Math.abs(deltaY) > this.options.touchThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          this.state.swipeDirection = deltaX > 0 ? 'right' : 'left';
        } else {
          this.state.swipeDirection = deltaY > 0 ? 'down' : 'up';
        }
      }
    }

    handleTouchEnd(e) {
      // 清除长按定时器
      if (this.state.longPressTimer) {
        clearTimeout(this.state.longPressTimer);
        this.state.longPressTimer = null;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.state.touchStartX;
      const deltaY = touch.clientY - this.state.touchStartY;
      const deltaTime = Date.now() - this.state.touchStartTime;

      // 检测点击
      if (Math.abs(deltaX) < this.options.touchThreshold && Math.abs(deltaY) < this.options.touchThreshold) {
        this.handleTap(e);
      }

      // 检测滑动
      if (Math.abs(deltaX) > this.options.swipeThreshold || Math.abs(deltaY) > this.options.swipeThreshold) {
        this.handleSwipe(deltaX, deltaY, deltaTime);
      }

      // 重置状态
      this.state.swipeDirection = null;
    }

    handleTap(e) {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - this.state.lastTapTime;

      // 双击检测
      if (timeSinceLastTap < this.options.doubleTapThreshold) {
        this.state.tapCount++;
        if (this.state.tapCount === 2) {
          this.handleDoubleTap(e);
          this.state.tapCount = 0;
        }
      } else {
        this.state.tapCount = 1;
      }

      this.state.lastTapTime = currentTime;

      // 触发点击反馈
      this.triggerHapticFeedback('light');
    }

    handleDoubleTap(e) {
      // 双击缩放或其他操作
      this.triggerHapticFeedback('medium');
      this.emit('double-tap', { event: e });
    }

    handleLongPress(e) {
      this.triggerHapticFeedback('heavy');
      this.emit('long-press', { event: e });

      // 添加长按样式
      const target = e.target;
      if (target) {
        target.classList.add('long-pressed');
        setTimeout(() => {
          target.classList.remove('long-pressed');
        }, 200);
      }
    }

    handleSwipe(deltaX, deltaY, deltaTime) {
      const direction = this.state.swipeDirection;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      this.emit('swipe', {
        direction,
        deltaX,
        deltaY,
        distance,
        velocity,
        event: { preventDefault: () => {} }
      });

      // 处理导航滑动
      if (this.options.enableSwipeNavigation) {
        this.handleSwipeNavigation(direction);
      }

      // 触发滑动反馈
      this.triggerHapticFeedback('light');
    }

    handleSwipeNavigation(direction) {
      switch (direction) {
        case 'left':
          // 下一个项目
          this.navigateNext();
          break;
        case 'right':
          // 上一个项目
          this.navigatePrevious();
          break;
        case 'up':
          // 关闭当前面板
          this.closeCurrentPanel();
          break;
        case 'down':
          // 打开菜单
          this.toggleMobileNavigation();
          break;
      }
    }

    setupMobileNavigation() {
      if (!this.options.enableMobileNavigation) return;

      // 创建移动端导航按钮
      this.createMobileNavToggle();

      // 创建移动端导航菜单
      this.createMobileNavMenu();

      // 处理导航状态
      this.updateNavigationState();
    }

    createMobileNavToggle() {
      if (this.elements.navToggle) return;

      const navToggle = document.createElement('button');
      navToggle.className = 'mobile-nav-toggle';
      navToggle.setAttribute('aria-label', '切换导航菜单');
      navToggle.innerHTML = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      `;

      // 添加到头部
      if (this.elements.header) {
        this.elements.header.appendChild(navToggle);
        this.elements.navToggle = navToggle;
      }

      // 绑定事件
      navToggle.addEventListener('click', () => {
        this.toggleMobileNavigation();
      });
    }

    createMobileNavMenu() {
      if (this.elements.mobileNav) return;

      const mobileNav = document.createElement('nav');
      mobileNav.className = 'mobile-navigation';
      mobileNav.innerHTML = `
        <div class="mobile-nav-header">
          <h3 class="mobile-nav-title">导航菜单</h3>
          <button class="mobile-nav-close" aria-label="关闭导航">
            <span>×</span>
          </button>
        </div>
        <div class="mobile-nav-content">
          <div class="mobile-nav-section">
            <h4>快速导航</h4>
            <div class="mobile-nav-quick">
              <a href="#math-section" class="mobile-nav-link">
                <span class="nav-icon">📐</span>
                <span>数学可视化</span>
              </a>
              <a href="#astronomy-section" class="mobile-nav-link">
                <span class="nav-icon">🔭</span>
                <span>天文可视化</span>
              </a>
              <a href="#physics-section" class="mobile-nav-link">
                <span class="nav-icon">⚛️</span>
                <span>物理可视化</span>
              </a>
              <a href="#chemistry-section" class="mobile-nav-link">
                <span class="nav-icon">🧪</span>
                <span>化学可视化</span>
              </a>
            </div>
          </div>
          <div class="mobile-nav-section">
            <h4>功能</h4>
            <div class="mobile-nav-actions">
              <button class="mobile-nav-btn" id="mobileThemeToggle">
                <span class="nav-icon">🌓</span>
                <span>切换主题</span>
              </button>
              <button class="mobile-nav-btn" id="mobileHelpBtn">
                <span class="nav-icon">❓</span>
                <span>使用帮助</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // 添加遮罩层
      const overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';

      // 添加到body
      document.body.appendChild(mobileNav);
      document.body.appendChild(overlay);

      this.elements.mobileNav = mobileNav;
      this.elements.mobileNavOverlay = overlay;

      // 绑定事件
      this.bindMobileNavEvents();
    }

    bindMobileNavEvents() {
      // 关闭按钮
      const closeBtn = this.elements.mobileNav.querySelector('.mobile-nav-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeMobileNavigation();
        });
      }

      // 遮罩层点击
      if (this.elements.mobileNavOverlay) {
        this.elements.mobileNavOverlay.addEventListener('click', () => {
          this.closeMobileNavigation();
        });
      }

      // 导航链接
      const navLinks = this.elements.mobileNav.querySelectorAll('.mobile-nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          this.scrollToSection(targetId);
          this.closeMobileNavigation();
        });
      });

      // 主题切换
      const themeToggle = this.elements.mobileNav.querySelector('#mobileThemeToggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.toggleTheme();
          this.closeMobileNavigation();
        });
      }

      // 帮助按钮
      const helpBtn = this.elements.mobileNav.querySelector('#mobileHelpBtn');
      if (helpBtn) {
        helpBtn.addEventListener('click', () => {
          this.showHelp();
          this.closeMobileNavigation();
        });
      }
    }

    toggleMobileNavigation() {
      if (this.state.navigationOpen) {
        this.closeMobileNavigation();
      } else {
        this.openMobileNavigation();
      }
    }

    openMobileNavigation() {
      this.state.navigationOpen = true;

      // 添加active类
      this.elements.mobileNav.classList.add('active');
      this.elements.mobileNavOverlay.classList.add('active');
      document.body.classList.add('nav-open');

      // 禁用背景滚动
      document.body.style.overflow = 'hidden';

      // 触发反馈
      this.triggerHapticFeedback('light');

      // 触发事件
      this.emit('navigation-opened');
    }

    closeMobileNavigation() {
      this.state.navigationOpen = false;

      // 移除active类
      this.elements.mobileNav.classList.remove('active');
      this.elements.mobileNavOverlay.classList.remove('active');
      document.body.classList.remove('nav-open');

      // 恢复背景滚动
      document.body.style.overflow = '';

      // 触发事件
      this.emit('navigation-closed');
    }

    updateNavigationState() {
      // 根据滚动位置更新导航状态
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // 更新header样式
      if (this.elements.header) {
        if (scrollTop > 100) {
          this.elements.header.classList.add('scrolled');
        } else {
          this.elements.header.classList.remove('scrolled');
        }
      }
    }

    setupViewportOptimizations() {
      // 设置viewport
      this.setupViewport();

      // 处理屏幕旋转
      this.handleOrientationChange();

      // 优化虚拟键盘
      this.optimizeVirtualKeyboard();
    }

    setupViewport() {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }

      // 移动端优化viewport设置
      viewport.content = [
        'width=device-width',
        'initial-scale=1.0',
        'maximum-scale=5.0',
        'user-scalable=yes',
        'viewport-fit=cover'
      ].join(', ');
    }

    handleOrientationChange() {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          // 方向改变后重新计算布局
          this.updateLayout();
          this.emit('orientation-changed', {
            orientation: window.orientation
          });
        }, 100);
      });

      // 监听大小变化
      window.addEventListener('resize', () => {
        this.updateLayout();
      });
    }

    updateLayout() {
      // 重新计算布局相关尺寸
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // 更新触摸目标
      this.enlargeTouchTargets();
    }

    optimizeVirtualKeyboard() {
      // 处理虚拟键盘弹出
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          // 滚动到输入框
          setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);

          // 调整布局
          document.body.classList.add('keyboard-open');
        });

        input.addEventListener('blur', () => {
          document.body.classList.remove('keyboard-open');
        });
      });
    }

    // 导航辅助方法
    scrollToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        const headerHeight = this.elements.header ? this.elements.header.offsetHeight : 0;
        const sectionTop = section.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: sectionTop,
          behavior: 'smooth'
        });
      }
    }

    navigateNext() {
      // 实现下一个项目的导航逻辑
      this.emit('navigate-next');
    }

    navigatePrevious() {
      // 实现上一个项目的导航逻辑
      this.emit('navigate-previous');
    }

    closeCurrentPanel() {
      // 关闭当前打开的面板
      const openPanels = document.querySelectorAll('.panel.open, .dropdown.open, .modal.open');
      openPanels.forEach(panel => {
        panel.classList.remove('open');
      });

      this.emit('panel-closed');
    }

    toggleTheme() {
      // 切换主题 - 使用全局主题管理器
      if (window.app && window.app.components.themeManager) {
        window.app.components.themeManager.handleThemeToggle();
      }
    }

    showHelp() {
      // 显示帮助信息
      if (window.app && window.app.showHelp) {
        window.app.showHelp();
      }
    }

    // 触觉反馈
    triggerHapticFeedback(type) {
      if (!this.options.enableHapticFeedback) return;

      // 检查是否支持触觉反馈
      if ('vibrate' in navigator) {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'medium':
            navigator.vibrate(25);
            break;
          case 'heavy':
            navigator.vibrate(50);
            break;
          default:
            navigator.vibrate(25);
        }
      }
    }

    // 事件系统
    emit(eventName, data) {
      const event = new CustomEvent(`mobile-enhancer:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`mobile-enhancer:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`mobile-enhancer:${eventName}`, handler);
    }

    // 公共API
    isMobile() {
      return this.state.isMobile;
    }

    isTouch() {
      return this.state.isTouch;
    }

    isNavigationOpen() {
      return this.state.navigationOpen;
    }

    // 销毁方法
    destroy() {
      // 清理事件监听器
      document.removeEventListener('touchstart', this.handleTouchStart);
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);

      // 清理导航
      if (this.elements.mobileNav && this.elements.mobileNav.parentNode) {
        this.elements.mobileNav.parentNode.removeChild(this.elements.mobileNav);
      }
      if (this.elements.mobileNavOverlay && this.elements.mobileNavOverlay.parentNode) {
        this.elements.mobileNavOverlay.parentNode.removeChild(this.elements.mobileNavOverlay);
      }
      if (this.elements.navToggle && this.elements.navToggle.parentNode) {
        this.elements.navToggle.parentNode.removeChild(this.elements.navToggle);
      }

      // 清理定时器
      if (this.state.longPressTimer) {
        clearTimeout(this.state.longPressTimer);
      }

      console.log('MobileEnhancer destroyed');
    }
  }

  // 导出到全局
  global.MobileEnhancer = MobileEnhancer;

})(window);