#!/bin/bash

# 终极优化脚本 - 本地资源 + 懒加载
# 实现最极致的加载速度优化

echo "🚀 开始终极优化..."
echo ""

BASE_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/概率统计可视化"
cd "$BASE_DIR" || exit 1

# 创建备份
echo "📦 备份文件..."
BACKUP_DIR="backup-ultimate-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp *.html "$BACKUP_DIR/" 2>/dev/null
echo "✅ 备份完成: $BACKUP_DIR"
echo ""

echo "📊 优化内容:"
echo "   ✓ 使用本地Plotly.js (3.4MB)"
echo "   ✓ 使用本地MathJax (1.1MB)"
echo "   ✓ 实现懒加载（滚动到可视区域才加载）"
echo "   ✓ 添加资源预加载提示"
echo "   ✓ 优化脚本加载顺序"
echo ""

# 创建优化的head模板
create_optimized_head() {
    local file=$1

    # 删除旧的CDN引用
    sed -i '' '/cdn.bootcdn.net.*plotly/d' "$file"
    sed -i '' '/cdn.bootcdn.net.*mathjax/d' "$file"

    # 在</head>前插入优化的脚本
    # 1. 本地资源 + 懒加载
    # 2. MathJax配置内联
    # 3. 预加载关键资源

    if ! grep -q "lib/plotly.min.js" "$file"; then
        # 找到最后一个</style>标签，在其后插入优化的脚本
        sed -i '' '/<\/style>/a\
\
    <!-- 🚀 极速加载优化：本地资源 + 懒加载 -->\
    <script>\
    /* Plotly懒加载：只在需要时加载 */\
    window.PlotlyLazyLoader = {\
        loaded: false,\
        callbacks: [],\
        load: function(callback) {\
            if (this.loaded) {\
                callback();\
            } else {\
                this.callbacks.push(callback);\
                if (this.callbacks.length === 1) {\
                    var script = document.createElement("script");\
                    script.src = "lib/plotly.min.js";\
                    script.onload = () => {\
                        this.loaded = true;\
                        this.callbacks.forEach(cb => cb());\
                        this.callbacks = [];\
                    };\
                    document.head.appendChild(script);\
                }\
            }\
        }\
    };\
    </script>\
    <script>\
    /* MathJax配置 - 内联以加快渲染 */\
    window.MathJax = {\
        tex: {\
            inlineMath: [["\\$","\\$"], ["\\\\(","\\\\)"]],\
            displayMath: [["\\\\$","\\\\$"], ["\\\\[","\\\\]"]],\
            processEscapes: true\
        },\
        svg: {\
            fontCache: "global"\
        },\
        startup: {\
            typeset: false,\
            ready: () => {\
                MathJax.startup.defaultReady();\
                console.log("✅ MathJax加载完成");\
            }\
        }\
    };\
    </script>\
    <link rel="preload" href="lib/plotly.min.js" as="script" crossorigin="anonymous">\
    <link rel="preload" href="lib/tex-mml-chtml.js" as="script" crossorigin="anonymous">\
    <script id="MathJax-script" defer src="lib/tex-mml-chtml.js" onload="console.log("✅ MathJax脚本加载完成")"></script>
' "$file"
        echo "   ✓ $file"
    fi
}

# 添加懒加载初始化脚本
add_lazy_init() {
    local file=$1

    # 在</body>前添加懒加载初始化
    if ! grep -q "PlotlyLazyLoader" "$file"; then
        sed -i '' '/<\/body>/i\
    <script>\
    /* 懒加载初始化：检测元素进入可视区域 */\
    document.addEventListener("DOMContentLoaded", function() {\
        var observerOptions = {\
            root: null,\
            rootMargin: "50px",\
            threshold: 0.1\
        };\
        \
        var observer = new IntersectionObserver(function(entries) {\
            entries.forEach(function(entry) {\
                if (entry.isIntersecting) {\
                    var plotDiv = entry.target.querySelector("div[id*=\\"plot\\"], .plotly-graph-div");\
                    if (plotDiv && !plotDiv.hasAttribute("data-loaded")) {\
                        console.log("🎯 加载图表:", entry.target.id || plotDiv.id);\
                        window.PlotlyLazyLoader.load(function() {\
                            // 触发绘图函数\
                            if (typeof drawChart === "function") drawChart();\
                            else if (typeof initChart === "function") initChart();\
                            plotDiv.setAttribute("data-loaded", "true");\
                        });\
                        observer.unobserve(entry.target);\
                    }\
                }\
            });\
        }, observerOptions);\
        \
        // 观察所有包含图表的section\
        document.querySelectorAll(".section-container, .content").forEach(function(section) {\
            observer.observe(section);\
        });\
        \
        console.log("✅ 懒加载初始化完成");\
    });\
    </script>
' "$file"
    fi
}

# 优化加载动画
optimize_loading_animation() {
    local file=$1

    # 加快加载动画消失速度
    sed -i '' 's/setTimeout.*300/setTimeout(100/g' "$file"
    sed -i '' 's/transition: opacity 0\.3s/transition: opacity 0.1s/g' "$file"

    # 优化loading文字
    sed -i '' 's/正在加载可视化/加载中.../g' "$file"
}

# 批量处理所有HTML文件
echo "🔄 处理HTML文件..."
for file in *.html; do
    if [ -f "$file" ] && [ "$file" != "quick-test-fast.html" ] && [ "$file" != "test-all-pages.html" ]; then
        echo "   处理: $file"
        create_optimized_head "$file"
        add_lazy_init "$file"
        optimize_loading_animation "$file"
    fi
done

echo ""
echo "🎉 优化完成！"
echo ""
echo "📊 优化效果:"
echo "   ✓ 本地资源：首次加载后永久缓存"
echo "   ✓ 懒加载：只在需要时加载Plotly"
echo "   ✓ 预加载：提前声明资源"
echo "   ✓ 快速动画：加载动画从300ms减至100ms"
echo ""
echo "⚡ 预期提升:"
echo "   • 首次加载: 2-5秒 → 1-3秒"
echo "   • 再次访问: <1秒 (完全缓存)"
echo "   • 滚动加载: 按需加载，更流畅"
echo ""
echo "🧪 测试方法:"
echo "   1. 清空浏览器缓存 (Cmd+Shift+Delete)"
echo "   2. 强制刷新页面 (Cmd+Shift+R)"
echo "   3. 观察页面加载速度"
echo "   4. 查看Console日志"
echo ""
echo "💡 提示:"
echo "   • 首次访问会下载资源(~4.5MB)"
echo "   • 之后访问会使用本地缓存，极快"
echo "   • 如有问题，从备份恢复: cp $BACKUP_DIR/*.html ."
echo ""
echo "📁 备份位置: $BACKUP_DIR"
echo "🌐 测试地址: http://localhost:8001/quick-test.html"
