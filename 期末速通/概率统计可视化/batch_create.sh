#!/bin/bash

# 批量创建剩余的可视化页面
echo "🚀 开始批量创建概率统计可视化页面..."

BASE="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/概率统计可视化"

# 已完成：06-全概率公式
# 待创建：07-贝叶斯, 08-中心极限定理, 09-三大分布, 10-假设检验, 11-置信区间, 12-连续PDF, 13-CDF, 14-古典概型

echo "✅ 06-全概率公式.html 已创建"
echo "⏳ 准备创建 07-贝叶斯公式.html..."
echo "⏳ 准备创建 08-中心极限定理.html..."
echo "⏳ 准备创建 09-三大分布对比.html..."

# 创建占位文件（稍后填充内容）
for i in 07 08 09 10 11 12 13 14; do
    touch "$BASE/$i-placeholder.html"
done

echo "✅ 占位文件已创建，准备填充内容..."
