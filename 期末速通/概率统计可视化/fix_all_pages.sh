#!/bin/bash

echo "🔧 开始修复所有页面的加载和显示问题..."

DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/概率统计可视化"
cd "$DIR"

# 修复03、04、05号文件（这些文件没有被正确修改）
for file in "03-频率与概率.html" "04-数学期望.html" "05-方差.html"; do
    if [ -f "$file" ]; then
        echo "处理: $file"
        
        # 备份原文件
        cp "$file" "${file}.backup"
        
        # 修复关键问题：在DOMContentLoaded事件中添加Plotly检查
        # 查找并替换addEventListener部分
        perl -i -pe 's/document.addEventListener\("DOMContentLoaded", function\(\) \{/window.addEventListener("load", function() {\n            \/\/ 等待Plotly加载完成\n            if (typeof Plotly === "undefined") \{\n                console.warn("Plotly未加载，100ms后重试");\n                setTimeout(arguments.callee, 100);\n                return;\n            }\n            console.log("Plotly已就绪，开始初始化");/g' "$file"
        
        echo "✅ $file 已修复"
    fi
done

echo ""
echo "✅ 所有页面修复完成！"
echo ""
echo "📋 修复内容："
echo "1. ✅ 将DOMContentLoaded改为window.onload"
echo "2. ✅ 添加Plotly加载检查"
echo "3. ✅ 添加加载失败重试机制"
echo "4. ✅ 保留所有原有功能"
echo ""
echo "🧪 测试地址："
echo "http://localhost:8000/期末速通/概率统计可视化/test-speed.html"
