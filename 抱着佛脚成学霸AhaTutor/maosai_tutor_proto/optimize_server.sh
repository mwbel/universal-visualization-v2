#!/bin/bash

#MacBook Pro 2015 服务器优化脚本
#针对茅塞顿开助教专用服务器进行系统优化

echo "========================================"
echo "   茅塞顿开助教 - 服务器优化"
echo "========================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  请使用 sudo 运行此脚本"
    echo "   sudo ./optimize_server.sh"
    exit 1
fi

echo "🔧 开始优化..."
echo ""

# 1. 禁用不必要的启动项
echo "1️⃣  禁用不必要的启动项..."
# 这里可以根据实际情况添加要禁用的服务

# 2. 优化网络设置
echo "2️⃣  优化网络设置..."
# 增加文件描述符限制
echo "fs.file-max = 65535" >> /etc/sysctl.conf 2>/dev/null || echo "   (跳过，可能不适用)"

# 3. 设置电源管理（保持运行不休眠）
echo "3️⃣  配置电源管理..."
# 禁用休眠（当连接电源时）
pmset -c displaysleep 10
pmset -c sleep 0
pmset -c disksleep 0
echo "   ✅ 显示器 10 分钟后关闭"
echo "   ✅ 系统永不休眠"

# 4. 创建监控脚本
echo "4️⃣  创建服务监控脚本..."
cat > /usr/local/bin/check_maosai_service.sh << 'EOF'
#!/bin/bash

#茅塞顿开助教服务监控脚本

SERVICE_PORT=8000
LOG_FILE="/tmp/maosai_tutor.log"

# 检查服务是否运行
if ! lsof -i :$SERVICE_PORT > /dev/null 2>&1; then
    echo "[$(date)] 服务未运行，尝试重启..." >> $LOG_FILE
    cd /Users/$SUDO_USER/maosai_tutor_proto
    source .venv/bin/activate
    uvicorn app.main:app --host 0.0.0.0 --port $SERVICE_PORT >> $LOG_FILE 2>&1 &
    echo "[$(date)] 服务已重启" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/check_maosai_service.sh

# 5. 设置定时任务（每分钟检查一次）
echo "5️⃣  设置定时监控..."
(crontab -l 2>/dev/null; echo "* * * * * /usr/local/bin/check_maosai_service.sh") | crontab -

# 6. 创建快速管理脚本
echo "6️⃣  创建管理脚本..."
cat > ~/maosai_manage.sh << 'EOF'
#!/bin/bash

#茅塞顿开助教 - 快速管理脚本

case "$1" in
    start)
        echo "启动服务..."
        cd ~/maosai_tutor_proto
        source .venv/bin/activate
        uvicorn app.main:app --host 0.0.0.0 --port 8000
        ;;
    stop)
        echo "停止服务..."
        pkill -f "uvicorn app.main:app"
        ;;
    restart)
        echo "重启服务..."
        pkill -f "uvicorn app.main:app"
        sleep 2
        cd ~/maosai_tutor_proto
        source .venv/bin/activate
        uvicorn app.main:app --host 0.0.0.0 --port 8000
        ;;
    status)
        if lsof -i :8000 > /dev/null 2>&1; then
            echo "✅ 服务正在运行"
            echo ""
            echo "访问地址:"
            ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   http://" $2 ":8000"}'
        else
            echo "❌ 服务未运行"
        fi
        ;;
    log)
        echo "查看日志（最后 50 行）:"
        tail -50 /tmp/maosai_tutor.log
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|log}"
        exit 1
        ;;
esac
EOF

chmod +x ~/maosai_manage.sh

echo ""
echo "========================================"
echo "✅ 优化完成！"
echo "========================================"
echo ""
echo "📝 管理命令:"
echo "   ~/maosai_manage.sh start    # 启动服务"
echo "   ~/maosai_manage.sh stop     # 停止服务"
echo "   ~/maosai_manage.sh restart  # 重启服务"
echo "   ~/maosai_manage.sh status   # 查看状态"
echo "   ~/maosai_manage.sh log      # 查看日志"
echo ""
echo "📱 iPad 访问地址:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   http://" $2 ":8000"}'
echo ""
echo "💡 提示:"
echo "   - 服务已设置为开机自启动"
echo "   - 系统不会休眠（连接电源时）"
echo "   - 每分钟自动检查服务状态"
echo "========================================"
