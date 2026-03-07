#!/bin/bash

#内存监控脚本 - 检查茅塞顿开助教和 OpenClaw 的资源占用

echo "========================================"
echo "   系统资源使用情况"
echo "========================================"
echo ""

# 显示总体内存使用
echo "💾 内存使用情况:"
echo ""
if command -v vm_stat &> /dev/null; then
    # 计算 Page 大小（通常是 4096 字节）
    PAGE_SIZE=$(vm_stat | head -1 | awk '{print $NF}' | tr -d '.')
    if [ -z "$PAGE_SIZE" ]; then
        PAGE_SIZE=4096
    fi

    # 获取内存统计
    FREE_PAGES=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
    WIRED_PAGES=$(vm_stat | grep "Pages wired" | awk '{print $4}' | tr -d '.')
    ACTIVE_PAGES=$(vm_stat | grep "Pages active" | awk '{print $3}' | tr -d '.')
    INACTIVE_PAGES=$(vm_stat | grep "Pages inactive" | awk '{print $3}' | tr -d '.')

    # 转换为 GB
    FREE_GB=$(echo "scale=2; $FREE_PAGES * $PAGE_SIZE / 1024 / 1024 / 1024" | bc)
    WIRED_GB=$(echo "scale=2; $WIRED_PAGES * $PAGE_SIZE / 1024 / 1024 / 1024" | bc)
    ACTIVE_GB=$(echo "scale=2; $ACTIVE_PAGES * $PAGE_SIZE / 1024 / 1024 / 1024" | bc)
    INACTIVE_GB=$(echo "scale=2; $INACTIVE_PAGES * $PAGE_SIZE / 1024 / 1024 / 1024" | bc)
    USED_GB=$(echo "scale=2; $WIRED_GB + $ACTIVE_GB + $INACTIVE_GB" | bc)
    TOTAL_GB=$(echo "scale=2; $USED_GB + $FREE_GB" | bc)

    echo "   总内存:    ${TOTAL_GB} GB"
    echo "   已使用:    ${USED_GB} GB"
    echo "   空闲:      ${FREE_GB} GB"
    echo "   活跃:      ${ACTIVE_GB} GB"
    echo "   非活跃:    ${INACTIVE_GB} GB"
    echo "   固定:      ${WIRED_GB} GB"
    echo ""
    echo "   内存使用率: $(echo "scale=1; $USED_GB * 100 / $TOTAL_GB" | bc)%"
else
    echo "   无法获取内存信息"
fi

echo ""
echo "========================================"
echo "🔍 Python 进程资源占用:"
echo ""

# 显示 Python 进程
PYTHON_PROCESSES=$(ps aux | grep -E "(python|uvicorn|paddleocr)" | grep -v grep | grep -v switch_to_tutor)

if [ -n "$PYTHON_PROCESSES" ]; then
    echo "$PYTHON_PROCESSES" | awk '{
        pid = $2
        cpu = $3
        mem = $4
        cmd = $11
        for(i=12;i<=NF;i++) cmd = cmd " " $i
        printf "   PID: %-7s CPU: %-5s 内存: %-5s %s\n", pid, cpu"%", mem"%", cmd
    }'
else
    echo "   未检测到 Python 进程"
fi

echo ""
echo "========================================"
echo "🎯 建议:"
echo ""

# 检查内存压力
MEM_USAGE=$(echo "scale=0; $USED_GB * 100 / $TOTAL_GB" | bc)

if [ "$MEM_USAGE" -lt 70 ]; then
    echo "   ✅ 内存使用正常，系统运行流畅"
elif [ "$MEM_USAGE" -lt 85 ]; then
    echo "   ⚠️  内存使用较高，建议关闭不必要的应用"
else
    echo "   🔴 内存使用过高！"
    echo "   建议："
    echo "   1. 关闭浏览器标签页"
    echo "   2. 退出不使用的应用"
    echo "   3. 考虑停止 OpenClaw 或助教服务之一"
fi

echo ""
echo "========================================"
echo ""

# 提供交互式监控选项
read -p "是否持续监控（每 5 秒刷新）？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    WATCH_COUNT=0
    while [ $WATCH_COUNT -lt 12 ]; do  # 监控 1 分钟
        clear
        echo "持续监控中... (Ctrl+C 退出, $(($WATCH_COUNT * 5))秒已过去)"
        echo ""
        exec $0
        WATCH_COUNT=$(($WATCH_COUNT + 1))
        sleep 5
    done
fi
