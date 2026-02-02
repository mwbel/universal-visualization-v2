// 线性代数模块 - Google DynamicView 风格交互功能

// MathJax 配置
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
  },
};

// 平滑滚动到章节
function smoothScrollToChapter(chapterId) {
    const element = document.getElementById(chapterId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 更新当前章节高亮
function updateCurrentChapter() {
    const chapters = document.querySelectorAll('.chapter-section');
    const navLinks = document.querySelectorAll('.sidebar .nav-list a[href^="#"]');

    let currentChapter = '';

    chapters.forEach(chapter => {
        const rect = chapter.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
            currentChapter = chapter.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('current');
        if (link.getAttribute('href') === `#${currentChapter}`) {
            link.classList.add('current');
        }
    });
}

// 绑定章节导航点击事件
function bindChapterNavigation() {
    const navLinks = document.querySelectorAll('.sidebar .nav-list a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const chapterId = link.getAttribute('href').substring(1);
            smoothScrollToChapter(chapterId);

            // 更新URL但不刷新页面
            history.pushState(null, null, `#${chapterId}`);
        });
    });
}

// 页面加载时滚动到指定章节
function scrollToHashChapter() {
    const hash = window.location.hash;
    if (hash) {
        const chapterId = hash.substring(1);
        setTimeout(() => {
            smoothScrollToChapter(chapterId);
        }, 100);
    }
}

// 添加卡片点击动画
function addCardAnimations() {
    const cards = document.querySelectorAll('.feature-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 进度条动画
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');

    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.transition = 'width 1s ease-out';
            bar.style.width = width;
        }, 300);
    });
}

// 返回顶部按钮
function addBackToTopButton() {
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '↑';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #4285f4;
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
        transition: all 0.3s;
        display: none;
        z-index: 1000;
    `;

    document.body.appendChild(backToTopButton);

    // 显示/隐藏按钮
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // 点击滚动到顶部
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 悬停效果
    backToTopButton.addEventListener('mouseenter', () => {
        backToTopButton.style.transform = 'scale(1.1)';
        backToTopButton.style.boxShadow = '0 6px 16px rgba(66, 133, 244, 0.6)';
    });

    backToTopButton.addEventListener('mouseleave', () => {
        backToTopButton.style.transform = 'scale(1)';
        backToTopButton.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.4)';
    });
}

// 统计信息动画
function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(stat => {
        const finalValue = stat.textContent;
        const isNumber = !isNaN(parseInt(finalValue));

        if (isNumber && finalValue.includes('+')) {
            // 对于带"+"的值（如"25+"），直接显示
            return;
        }

        if (isNumber) {
            const target = parseInt(finalValue);
            let current = 0;
            const increment = Math.ceil(target / 30);

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = current;
            }, 50);
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📐 线性代数可视化 - Google DynamicView 风格');

    // 绑定所有事件和功能
    bindChapterNavigation();
    scrollToHashChapter();
    addCardAnimations();
    animateProgressBars();
    addBackToTopButton();
    animateStats();

    // 监听滚动，更新当前章节
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateCurrentChapter, 100);
    });

    // 初始化时更新一次
    setTimeout(updateCurrentChapter, 500);

    // MathJax 渲染
    if (typeof MathJax !== "undefined") {
        MathJax.typesetPromise().catch((err) => console.log(err.message));
    }
});

// 页面卸载时保存滚动位置
window.addEventListener('beforeunload', function() {
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('linearAlgebraScrollPosition', scrollPosition);
});

// 页面加载时恢复滚动位置
window.addEventListener('load', function() {
    const savedScrollPosition = sessionStorage.getItem('linearAlgebraScrollPosition');
    if (savedScrollPosition) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScrollPosition));
        }, 100);
    }
});

// 导出函数供外部使用
window.LinearAlgebraModule = {
    smoothScrollToChapter,
    updateCurrentChapter,
    animateProgressBars
};
