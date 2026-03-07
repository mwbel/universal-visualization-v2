#!/bin/bash

#茅塞顿开助教 - 存储空间检查脚本
#用于检查 Mac 的可用存储空间

echo "========================================"
echo "   存储空间检查"
echo "========================================"
echo ""

# 检查磁盘使用
echo "💾 磁盘使用情况:"
echo ""
df -h / | grep -v "Filesystem"

echo ""
echo "========================================"

# 解析可用空间
AVAILABLE=$(df / | tail -1 | awk '{print $4}')
AVAILABLE_NUM=$(df / | tail -1 | awk '{print $4}' | sed 's/Gi//')

echo "📊 空间分析:"
echo ""

if (( $(echo "$AVAILABLE_NUM >= 50" | bc -l) )); then
    echo "   ✅ 可用空间: ${AVAILABLE} - 非常充裕！"
    echo "   完全可以安装茅塞顿开助教（需要约 2GB）"
elif (( $(echo "$AVAILABLE_NUM >= 20" | bc -l) )); then
    echo "   ⚠️  可用空间: ${AVAILABLE} - 够用，但建议先清理"
    echo "   可以安装茅塞顿开助教，但建议清理一些文件"
else
    echo "   ❌ 可用空间: ${AVAILABLE} - 空间不足！"
    echo "   需要先清理至少 10GB 空间才能安装"
fi

echo ""
echo "========================================"

# 检查茅塞顿开助教占用（如果已安装）
if [ -d ~/Downloads/maosai_tutor_proto ] || [ -d ~/Desktop/maosai_tutor_proto ] || [ -d ~/Documents/maosai_tutor_proto ]; then
    echo "📁 茅塞顿开助教占用:"
    echo ""

    if [ -d ~/Downloads/maosai_tutor_proto ]; then
        SIZE=$(du -sh ~/Downloads/maosai_tutor_proto 2>/dev/null | awk '{print $1}')
        echo "   ~/Downloads/maosai_tutor_proto: ${SIZE}"
    fi

    if [ -d ~/Desktop/maosai_tutor_proto ]; then
        SIZE=$(du -sh ~/Desktop/maosai_tutor_proto 2>/dev/null | awk '{print $1}')
        echo "   ~/Desktop/maosai_tutor_proto: ${SIZE}"
    fi

    if [ -d ~/Documents/maosai_tutor_proto ]; then
        SIZE=$(du -sh ~/Documents/maosai_tutor_proto 2>/dev/null | awk '{print $1}')
        echo "   ~/Documents/maosai_tutor_proto: ${SIZE}"
    fi
else
    echo "📁 茅塞顿开助教: 未安装"
fi

echo ""
echo "========================================"

# 检查大文件
echo "🔍 查找大文件（可选清理）:"
echo ""
echo "   最耗空间的文件夹:"
echo ""

du -sh ~/* 2>/dev/null | sort -hr | head -5 | while read size path; do
    dirname=$(basename "$path")
    echo "   ${size}   ${dirname}"
done

echo ""
echo "========================================"

# 建议
echo "💡 存储优化建议:"
echo ""

if (( $(echo "$AVAILABLE_NUM < 50" | bc -l) )); then
    echo "   1. 清理下载文件夹: ~/Downloads"
    echo "   2. 清理废纸篓"
    echo "   3. 卸载不使用的应用"
    echo "   4. 删除旧的 iOS 备份"
    echo "   5. 清理浏览器缓存"
    echo ""
    echo "   详细清理方法见 COMPLETE_INSTALLATION_GUIDE.md"
else
    echo "   你的存储空间充足，无需优化"
fi

echo ""
echo "========================================"
