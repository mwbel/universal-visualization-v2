/**
 * LoadingStates.js - 加载状态管理组件
 * 提供多种加载动画和进度指示器
 */
(function(global) {
  'use strict';

  class LoadingStates {
    constructor(options = {}) {
      this.options = {
        overlaySelector: '#loadingOverlay',
        progressFillSelector: '#progressFill',
        progressTextSelector: '#progressText',
        loadingTextSelector: '.loading-text',
        spinnerSelector: '.loading-spinner',
        ...options
      };

      this.state = {
        isVisible: false,
        currentProgress: 0,
        currentText: '',
        animationFrame: null,
        startTime: null,
        estimatedDuration: null
      };

      this.elements = {};
      this.loadingTexts = [
        '正在生成可视化...',
        '正在处理您的请求...',
        '正在准备可视化内容...',
        '正在渲染图表...',
        '即将完成...',
        '请稍候...'
      ];

      this.init();
    }

    init() {
      this.bindElements();
      this.setupDefaultAnimations();
    }

    bindElements() {
      this.elements.overlay = document.querySelector(this.options.overlaySelector);
      this.elements.progressFill = document.querySelector(this.options.progressFillSelector);
      this.elements.progressText = document.querySelector(this.options.progressTextSelector);
      this.elements.loadingText = document.querySelector(this.options.loadingTextSelector);
      this.elements.spinner = document.querySelector(this.options.spinnerSelector);
    }

    setupDefaultAnimations() {
      // 添加CSS动画类
      if (!document.getElementById('loading-animations-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-animations-styles';
        style.textContent = `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes fade-out {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.9); }
          }

          .loading-overlay.show {
            animation: fade-in 0.3s ease-out;
          }

          .loading-overlay.hide {
            animation: fade-out 0.3s ease-out;
          }

          .loading-spinner.pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .loading-spinner.bounce {
            animation: bounce 1s ease-in-out infinite;
          }

          .loading-spinner.rotate {
            animation: rotate 1s linear infinite;
          }

          .progress-bar.transition {
            transition: width 0.3s ease-out;
          }

          .loading-text.typewriter {
            overflow: hidden;
            white-space: nowrap;
            animation: typewriter 2s steps(40, end);
          }

          @keyframes typewriter {
            from { width: 0; }
            to { width: 100%; }
          }

          .skeleton {
            background: linear-gradient(90deg,
              var(--bg-tertiary) 25%,
              var(--border-primary) 50%,
              var(--bg-tertiary) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }

    /**
     * 显示加载状态
     */
    show(text = '加载中...', progress = 0, options = {}) {
      const {
        estimatedDuration = null,
        showProgress = true,
        showSpinner = true,
        animation = 'default',
        backdrop = true
      } = options;

      this.state.isVisible = true;
      this.state.currentText = text;
      this.state.currentProgress = progress;
      this.state.startTime = Date.now();
      this.state.estimatedDuration = estimatedDuration;

      // 设置加载文本
      if (this.elements.loadingText) {
        this.elements.loadingText.textContent = text;
      }

      // 设置进度
      this.updateProgress(progress);

      // 显示加载动画
      if (this.elements.spinner) {
        this.elements.spinner.style.display = showSpinner ? 'block' : 'none';
        this.setSpinnerAnimation(animation);
      }

      // 显示进度条
      if (this.elements.progressFill?.parentElement) {
        this.elements.progressFill.parentElement.style.display = showProgress ? 'block' : 'none';
      }

      // 显示遮罩
      if (this.elements.overlay) {
        this.elements.overlay.style.display = 'flex';
        this.elements.overlay.classList.add('show');
        this.elements.overlay.classList.remove('hide');

        if (backdrop) {
          this.elements.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        } else {
          this.elements.overlay.style.backgroundColor = 'transparent';
        }
      }

      // 开始文本动画
      this.startTextAnimation();

      // 开始进度估算
      if (estimatedDuration) {
        this.startProgressEstimation();
      }

      this.emit('loading:show', { text, progress, options });
    }

    /**
     * 隐藏加载状态
     */
    hide(options = {}) {
      const { delay = 0, fadeOut = true } = options;

      if (!this.state.isVisible) return;

      if (delay > 0) {
        setTimeout(() => this.hide({ ...options, delay: 0 }), delay);
        return;
      }

      this.state.isVisible = false;

      if (this.elements.overlay) {
        if (fadeOut) {
          this.elements.overlay.classList.add('hide');
          setTimeout(() => {
            this.elements.overlay.style.display = 'none';
            this.elements.overlay.classList.remove('show', 'hide');
          }, 300);
        } else {
          this.elements.overlay.style.display = 'none';
        }
      }

      // 清理动画
      this.clearAnimations();

      this.emit('loading:hide', { options });
    }

    /**
     * 更新进度
     */
    updateProgress(progress, text) {
      this.state.currentProgress = Math.max(0, Math.min(100, progress));

      if (this.elements.progressFill) {
        this.elements.progressFill.style.width = `${this.state.currentProgress}%`;
        this.elements.progressFill.classList.add('transition');
      }

      if (this.elements.progressText) {
        this.elements.progressText.textContent = `${Math.round(this.state.currentProgress)}%`;
      }

      if (text && this.elements.loadingText) {
        this.elements.loadingText.textContent = text;
        this.state.currentText = text;
      }

      this.emit('loading:progress', { progress: this.state.currentProgress, text });
    }

    /**
     * 更新文本
     */
    updateText(text) {
      this.state.currentText = text;
      if (this.elements.loadingText) {
        this.elements.loadingText.textContent = text;
      }

      this.emit('loading:text', { text });
    }

    /**
     * 设置加载动画类型
     */
    setSpinnerAnimation(type) {
      if (!this.elements.spinner) return;

      // 清除所有动画类
      this.elements.spinner.classList.remove('pulse', 'bounce', 'rotate');

      // 设置新动画
      switch (type) {
        case 'pulse':
          this.elements.spinner.classList.add('pulse');
          break;
        case 'bounce':
          this.elements.spinner.classList.add('bounce');
          break;
        case 'rotate':
          this.elements.spinner.classList.add('rotate');
          break;
        case 'none':
          // 不添加动画类
          break;
        default:
          // 使用默认动画
          this.elements.spinner.classList.add('pulse');
      }
    }

    /**
     * 开始文本动画
     */
    startTextAnimation() {
      this.clearTextAnimation();

      let textIndex = 0;
      const changeText = () => {
        if (!this.state.isVisible) return;

        const texts = this.loadingTexts;
        this.updateText(texts[textIndex % texts.length]);
        textIndex++;

        // 每3秒更换一次文本
        this.textAnimationFrame = setTimeout(changeText, 3000);
      };

      // 5秒后开始更换文本
      this.textAnimationFrame = setTimeout(changeText, 5000);
    }

    clearTextAnimation() {
      if (this.textAnimationFrame) {
        clearTimeout(this.textAnimationFrame);
        this.textAnimationFrame = null;
      }
    }

    /**
     * 开始进度估算
     */
    startProgressEstimation() {
      if (!this.state.estimatedDuration) return;

      this.clearProgressEstimation();

      const updateProgress = () => {
        if (!this.state.isVisible || !this.state.estimatedDuration) return;

        const elapsed = Date.now() - this.state.startTime;
        const estimatedProgress = Math.min(100, (elapsed / this.state.estimatedDuration) * 100);

        // 平滑更新进度
        const currentProgress = this.state.currentProgress;
        const targetProgress = Math.max(currentProgress, estimatedProgress * 0.8); // 不要超过实际进度的80%

        if (targetProgress > currentProgress) {
          this.updateProgress(targetProgress);
        }

        this.progressAnimationFrame = requestAnimationFrame(updateProgress);
      };

      this.progressAnimationFrame = requestAnimationFrame(updateProgress);
    }

    clearProgressEstimation() {
      if (this.progressAnimationFrame) {
        cancelAnimationFrame(this.progressAnimationFrame);
        this.progressAnimationFrame = null;
      }
    }

    clearAnimations() {
      this.clearTextAnimation();
      this.clearProgressEstimation();
    }

    /**
     * 预定义的加载状态
     */
    showGenerating() {
      this.show('正在生成可视化...', 0, {
        estimatedDuration: 10000,
        animation: 'rotate'
      });
    }

    showProcessing() {
      this.show('正在处理您的请求...', 10, {
        animation: 'pulse'
      });
    }

    showUploading() {
      this.show('正在上传文件...', 20, {
        estimatedDuration: 5000,
        animation: 'bounce'
      });
    }

    showDownloading() {
      this.show('正在下载内容...', 30, {
        estimatedDuration: 8000,
        animation: 'default'
      });
    }

    showSaving() {
      this.show('正在保存数据...', 80, {
        animation: 'pulse'
      });
    }

    /**
     * 骨架屏加载
     */
    showSkeleton(container, lines = 3) {
      const skeletonHTML = `
        <div class="skeleton-container">
          ${Array.from({ length: lines }, (_, i) => `
            <div class="skeleton-line" style="width: ${Math.random() * 40 + 60}%; height: 16px; margin-bottom: 8px;"></div>
          `).join('')}
        </div>
      `;

      const targetElement = document.querySelector(container);
      if (targetElement) {
        targetElement.innerHTML = skeletonHTML;
      }
    }

    hideSkeleton(container) {
      const targetElement = document.querySelector(container);
      if (targetElement) {
        targetElement.innerHTML = '';
      }
    }

    /**
     * 进度条模式
     */
    showProgressBar(target, options = {}) {
      const {
        height = '4px',
        color = 'var(--accent-primary)',
        backgroundColor = 'var(--bg-tertiary)',
        animated = true
      } = options;

      const progressHTML = `
        <div class="custom-progress-bar" style="
          height: ${height};
          background-color: ${backgroundColor};
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
        ">
          <div class="custom-progress-fill" style="
            height: 100%;
            background-color: ${color};
            width: 0%;
            transition: width 0.3s ease;
            ${animated ? 'background: linear-gradient(90deg, ' + color + ', ' + this.adjustColor(color, 20) + ');' : ''}
          "></div>
        </div>
      `;

      const targetElement = document.querySelector(target);
      if (targetElement) {
        targetElement.innerHTML = progressHTML;
        return targetElement.querySelector('.custom-progress-fill');
      }

      return null;
    }

    updateProgressBar(progressBar, progress) {
      if (progressBar) {
        progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
      }
    }

    /**
     * 工具方法
     */
    adjustColor(color, percent) {
      // 简单的颜色调整函数
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    isVisible() {
      return this.state.isVisible;
    }

    getCurrentProgress() {
      return this.state.currentProgress;
    }

    getCurrentText() {
      return this.state.currentText;
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`loading-states:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`loading-states:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`loading-states:${eventName}`, handler);
    }

    /**
     * 销毁方法
     */
    destroy() {
      this.hide();
      this.clearAnimations();
      this.elements = {};
      console.log('LoadingStates destroyed');
    }
  }

  // 创建全局实例
  global.LoadingStates = LoadingStates;

})(window);