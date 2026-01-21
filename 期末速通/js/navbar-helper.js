/**
 * 期末速通 - 导航栏辅助工具
 *
 * 用于快速在子页面中添加导航栏功能
 */

// ========== 自动检测并添加导航栏 ==========

/**
 * 自动为页面添加导航栏（如果在iframe中）
 */
function autoAddNavbarToIframe() {
    // 检测是否在iframe中
    if (window.self !== window.top) {
        // 在iframe中，添加返回父页面的按钮
        const navbar = document.createElement('div');
        navbar.className = 'iframe-navbar';
        navbar.innerHTML = `
            <button onclick="window.parent.postMessage({action: 'back'}, '*')" class="iframe-nav-btn">
                ← 返回学习界面
            </button>
            <button onclick="window.parent.postMessage({action: 'home'}, '*')" class="iframe-nav-btn">
                🏠 返回主页
            </button>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .iframe-navbar {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10000;
                display: flex;
                gap: 10px;
            }

            .iframe-nav-btn {
                padding: 10px 16px;
                background: rgba(66, 133, 244, 0.95);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.3s;
                backdrop-filter: blur(10px);
            }

            .iframe-nav-btn:hover {
                background: rgba(66, 133, 244, 1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(navbar);
    }
}

// ========== 监听来自iframe的消息 ==========

/**
 * 在主页（index.html）中监听来自iframe的消息
 */
function setupIframeMessageListener() {
    window.addEventListener('message', function(event) {
        // 安全检查：确保消息来自可信来源
        // 注意：在生产环境中应该验证event.origin

        if (event.data.action === 'back') {
            // 返回课程选择界面
            if (typeof backToSelection === 'function') {
                backToSelection();
            }
        } else if (event.data.action === 'home') {
            // 返回期末速通主页
            window.location.href = 'index.html';
        }
    });
}

// ========== 快速添加导航栏到HTML页面 ==========

/**
 * 快速在现有页面中插入导航栏HTML
 * @param {string} pageTitle - 页面标题
 * @param {string} breadcrumb - 面包屑导航（HTML格式）
 */
function insertNavbar(pageTitle, breadcrumb) {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            _insertNavbarHTML(pageTitle, breadcrumb);
        });
    } else {
        _insertNavbarHTML(pageTitle, breadcrumb);
    }
}

/**
 * 内部函数：插入导航栏HTML
 */
function _insertNavbarHTML(pageTitle, breadcrumb) {
    const navbarHTML = `
        <nav class="page-navbar">
            <div class="nav-buttons">
                <button class="nav-btn nav-btn-back" onclick="history.back()">
                    返回上一级
                </button>
                <a href="index.html" class="nav-btn nav-btn-home">
                    期末速通主页
                </a>
            </div>

            <div class="page-title">
                <h1>${pageTitle}</h1>
            </div>

            <div class="breadcrumb">
                ${breadcrumb}
            </div>
        </nav>
    `;

    // 在body开始处插入导航栏
    const body = document.querySelector('body');
    body.insertAdjacentHTML('afterbegin', navbarHTML);

    // 添加导航栏样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/page-navbar.css';
    document.head.appendChild(link);
}

// ========== 预设的面包屑模板 ==========

const BreadcrumbTemplates = {
    probability: `
        <div class="breadcrumb-item">
            <a href="index.html">期末速通</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="index.html" onclick="selectCourse('probability')">概率统计</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="#">当前页面</a>
        </div>
    `,

    physics: `
        <div class="breadcrumb-item">
            <a href="index.html">期末速通</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="index.html" onclick="selectCourse('physics')">大学物理</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="#">当前页面</a>
        </div>
    `,

    cpp: `
        <div class="breadcrumb-item">
            <a href="index.html">期末速通</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="index.html" onclick="selectCourse('cpp')">C++程序设计</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="#">当前页面</a>
        </div>
    `
};

// ========== 导航栏配置 ==========

/**
 * 自定义导航栏配置
 */
const NavbarConfig = {
    // 是否自动添加到iframe页面
    autoAddToIframe: true,

    // 是否显示面包屑
    showBreadcrumb: true,

    // 是否显示返回上一级按钮
    showBackButton: true,

    // 主页URL
    homeUrl: 'index.html'
};

// ========== 初始化 ==========

/**
 * 初始化导航栏功能
 */
function initNavbar() {
    // 如果启用了自动添加到iframe
    if (NavbarConfig.autoAddToIframe) {
        autoAddNavbarToIframe();
    }

    // 设置消息监听器
    setupIframeMessageListener();

    console.log('✅ 导航栏辅助工具已加载');
}

// 页面加载时自动初始化
if (typeof window !== 'undefined') {
    window.addEventListener('load', initNavbar);
}

// ========== 导出到全局 ==========

if (typeof window !== 'undefined') {
    window.NavbarHelper = {
        insertNavbar,
        BreadcrumbTemplates,
        NavbarConfig
    };
}
