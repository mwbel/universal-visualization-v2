# 万物可视化 - 部署指南

## 📋 目录

1. [部署概述](#部署概述)
2. [系统要求](#系统要求)
3. [环境准备](#环境准备)
4. [快速部署](#快速部署)
5. [详细配置](#详细配置)
6. [性能优化](#性能优化)
7. [安全配置](#安全配置)
8. [监控维护](#监控维护)
9. [故障排除](#故障排除)
10. [升级指南](#升级指南)

## 🎯 部署概述

### 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器      │    │    CDN/静态资源   │    │   负载均衡器      │
│   (Frontend)     │◄──►│   (Static Files) │◄──►│   (Load Balancer)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Web服务器       │    │   API服务器       │
                       │ (Nginx/Apache)   │◄──►│ (FastAPI)        │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │   数据库缓存      │
                                              │ (PostgreSQL+Redis)│
                                              └─────────────────┘
```

### 部署选项

#### 1. 单机部署
- 适用于：开发环境、测试环境、小型生产环境
- 特点：简单快速，资源占用少
- 性能：适合中等并发量（< 1000 用户）

#### 2. 容器化部署
- 适用于：生产环境、需要快速扩展的场景
- 特点：环境一致、易于扩展、便于维护
- 性能：支持高并发（1000-10000 用户）

#### 3. 云原生部署
- 适用于：大型生产环境、需要高可用的场景
- 特点：高可用、自动扩展、服务发现
- 性能：支持超高并发（> 10000 用户）

## 💻 系统要求

### 最低配置

**单机部署**:
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB SSD
- **网络**: 10Mbps 带宽
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

**容器化部署**:
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps 带宽
- **容器运行时**: Docker 20.10+ / Kubernetes 1.20+

### 推荐配置

**生产环境**:
- **CPU**: 8核心+
- **内存**: 16GB+ RAM
- **存储**: 100GB+ SSD
- **网络**: 1Gbps+ 带宽
- **负载均衡**: Nginx / HAProxy
- **数据库**: PostgreSQL 13+ (独立服务器)
- **缓存**: Redis 6+ (独立服务器)

### 软件依赖

#### 基础软件
```bash
# Node.js 18+
node --version  # v18.x.x

# Python 3.9+
python --version  # 3.9.x

# Git
git --version  # 2.x.x

# Nginx (可选)
nginx -v  # 1.20+
```

#### Python依赖
```bash
# 核心框架
fastapi>=0.104.0
uvicorn>=0.24.0
sqlalchemy>=2.0.0
alembic>=1.12.0

# 数据库驱动
asyncpg>=0.29.0          # PostgreSQL
aiosqlite>=0.19.0        # SQLite
redis>=5.0.0             # Redis

# 性能优化
aioredis>=2.0.0
psutil>=5.9.0
prometheus-client>=0.17.0

# 安全
python-jose>=3.3.0
passlib>=1.7.4
python-multipart>=0.0.6

# 工具库
pydantic>=2.4.0
python-dotenv>=1.0.0
httpx>=0.25.0
```

#### 前端依赖
```json
{
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-legacy": "^4.1.0",
    "terser": "^5.19.0"
  },
  "dependencies": {
    "modern-normalize": "^2.0.0"
  }
}
```

## 🛠️ 环境准备

### 1. 服务器准备

#### 创建用户
```bash
# 创建专用用户
sudo useradd -m -s /bin/bash alviz
sudo usermod -aG sudo alviz

# 切换用户
sudo su - alviz
```

#### 系统更新
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 防火墙配置
```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Docker部署准备

#### 安装Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker alviz

# CentOS
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker
```

#### 安装Docker Compose
```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 数据库准备

#### PostgreSQL安装
```bash
# Ubuntu
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE alvisualization;
CREATE USER alviz WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE alvisualization TO alviz;
ALTER USER alviz CREATEDB;
EOF
```

#### Redis安装
```bash
# Ubuntu
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试Redis
redis-cli ping
```

## 🚀 快速部署

### 方式1: Docker Compose部署（推荐）

#### 1. 克隆项目
```bash
git clone https://github.com/your-org/al-visualization.git
cd al-visualization
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**.env文件配置**:
```env
# 应用配置
APP_NAME=万物可视化
APP_VERSION=1.0.0
APP_ENV=production
APP_DEBUG=false

# 数据库配置
DATABASE_URL=postgresql+asyncpg://alviz:your_secure_password@localhost:5432/alvisualization
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Redis配置
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your_redis_password

# 安全配置
SECRET_KEY=your_very_secure_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]

# 性能配置
MAX_WORKERS=10
MAX_CONCURRENT_TASKS=50
CACHE_TTL=300

# 监控配置
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=INFO
```

#### 3. 构建和启动
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 初始化数据库
```bash
# 运行数据库迁移
docker-compose exec api python -m alembic upgrade head

# 创建初始数据
docker-compose exec api python scripts/init_data.py
```

### 方式2: 手动部署

#### 1. 前端部署
```bash
# 进入前端目录
cd main-app

# 安装依赖
npm install

# 构建生产版本
npm run build

# 配置Nginx
sudo cp nginx/alviz.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/alviz.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### 2. 后端部署
```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑.env文件

# 运行数据库迁移
python -m alembic upgrade head

# 启动服务
# 开发模式
uvicorn main:app --host 0.0.0.0 --port 8000

# 生产模式
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 3. 系统服务配置
```bash
# 创建systemd服务文件
sudo nano /etc/systemd/system/alviz-api.service
```

**alviz-api.service**:
```ini
[Unit]
Description=AlVisualization API
After=network.target

[Service]
Type=exec
User=alviz
Group=alviz
WorkingDirectory=/home/alviz/al-visualization/backend
Environment=PATH=/home/alviz/al-visualization/backend/venv/bin
ExecStart=/home/alviz/al-visualization/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl enable alviz-api
sudo systemctl start alviz-api
sudo systemctl status alviz-api
```

## ⚙️ 详细配置

### 1. 数据库优化配置

#### PostgreSQL配置
```bash
# 编辑PostgreSQL配置
sudo nano /etc/postgresql/13/main/postgresql.conf
```

**关键配置项**:
```ini
# 内存配置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# 连接配置
max_connections = 100
listen_addresses = '*'

# 性能配置
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# 日志配置
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
```

#### Redis配置
```bash
# 编辑Redis配置
sudo nano /etc/redis/redis.conf
```

**关键配置项**:
```ini
# 内存配置
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 网络配置
bind 127.0.0.1
port 6379
timeout 300

# 安全配置
requirepass your_redis_password
```

### 2. Web服务器配置

#### Nginx配置
```nginx
# /etc/nginx/sites-available/alviz.conf
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # 前端静态文件
    location / {
        root /home/alviz/al-visualization/main-app/dist;
        try_files $uri $uri/ /index.html;

        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传限制
    client_max_body_size 10M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 3. 性能监控配置

#### Prometheus配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alviz_rules.yml"

scrape_configs:
  - job_name: 'alviz-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgresql-exporter'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
```

#### Grafana仪表板
```json
{
  "dashboard": {
    "title": "AlVisualization Performance",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      }
    ]
  }
}
```

## 🔒 安全配置

### 1. SSL/TLS配置

#### Let's Encrypt证书
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 防火墙配置

#### iptables规则
```bash
# 基本规则
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

### 3. 应用安全

#### 环境变量安全
```bash
# 设置文件权限
chmod 600 .env
chown alviz:alviz .env

# 生成安全密钥
python -c "
import secrets
print('SECRET_KEY=' + secrets.token_urlsafe(32))
print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))
"
```

#### 数据库安全
```sql
-- 限制数据库用户权限
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO alviz;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO alviz;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO alviz;
```

## 📊 监控维护

### 1. 健康检查

#### API健康检查
```bash
# 创建健康检查脚本
cat > health_check.sh << 'EOF'
#!/bin/bash

API_URL="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ API健康检查通过"
    exit 0
else
    echo "❌ API健康检查失败: HTTP $RESPONSE"
    # 发送告警
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -H 'Content-type: application/json' \
         --data "{\"text\":\"🚨 API健康检查失败: HTTP $RESPONSE\"}"
    exit 1
fi
EOF

chmod +x health_check.sh

# 添加到crontab
echo "*/5 * * * * /home/alviz/health_check.sh" | crontab -
```

### 2. 日志管理

#### Logrotate配置
```bash
# 创建logrotate配置
sudo nano /etc/logrotate.d/alviz
```

```
/var/log/alviz/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 alviz alviz
    postrotate
        systemctl reload alviz-api
    endscript
}
```

### 3. 备份策略

#### 数据库备份
```bash
# 创建备份脚本
cat > backup_db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/alviz/backups"
DB_NAME="alvisualization"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/alviz_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -h localhost -U alviz -d $DB_NAME > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "数据库备份完成: $BACKUP_FILE.gz"
EOF

chmod +x backup_db.sh

# 每天凌晨2点执行备份
echo "0 2 * * * /home/alviz/backup_db.sh" | crontab -
```

## 🔧 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查服务状态
sudo systemctl status alviz-api

# 查看日志
sudo journalctl -u alviz-api -f

# 检查端口占用
sudo netstat -tlnp | grep :8000

# 检查防火墙
sudo ufw status
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
psql -h localhost -U alviz -d alvisualization

# 检查PostgreSQL状态
sudo systemctl status postgresql

# 查看PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h
htop

# 调整Python进程内存限制
# 在systemd服务中添加
MemoryLimit=2G
```

#### 4. 磁盘空间不足
```bash
# 检查磁盘使用
df -h

# 清理日志文件
sudo journalctl --vacuum-time=7d

# 清理Docker镜像
docker system prune -a
```

### 性能调优

#### 1. 数据库性能
```sql
-- 查看慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 分析表统计信息
ANALYZE;

-- 重建索引
REINDEX DATABASE alvisualization;
```

#### 2. 缓存优化
```bash
# 监控Redis性能
redis-cli --latency-history -i 1

# 查看Redis内存使用
redis-cli info memory

# 清理过期键
redis-cli --scan --pattern "expired:*" | xargs redis-cli del
```

## 🔄 升级指南

### 1. 应用升级

#### 滚动升级
```bash
# 1. 备份数据库
./backup_db.sh

# 2. 更新代码
git pull origin main

# 3. 更新依赖
pip install -r requirements.txt

# 4. 运行数据库迁移
python -m alembic upgrade head

# 5. 重启服务
sudo systemctl restart alviz-api
```

#### 蓝绿部署
```bash
# 1. 部署新版本到绿色环境
docker-compose -f docker-compose.green.yml up -d

# 2. 健康检查
curl -f http://localhost:8001/api/health

# 3. 切换流量
# 更新负载均衡器配置

# 4. 停止蓝色环境
docker-compose -f docker-compose.blue.yml down
```

### 2. 数据库升级

#### 主要版本升级
```bash
# 1. 完整备份
pg_dump -h localhost -U alviz alvisualization > full_backup.sql

# 2. 停止应用
sudo systemctl stop alviz-api

# 3. 升级PostgreSQL
sudo apt install postgresql-14

# 4. 迁移数据
sudo pg_upgradecluster 13 main 14 main

# 5. 更新配置
# 编辑postgresql.conf

# 6. 启动新版本
sudo systemctl start postgresql@14-main

# 7. 测试应用
python -m alembic upgrade head
sudo systemctl start alviz-api
```

### 3. 回滚计划

#### 快速回滚
```bash
# 1. 恢复代码
git checkout previous_version_tag

# 2. 恢复数据库
psql -h localhost -U alviz -d alvisualization < backup.sql

# 3. 重启服务
sudo systemctl restart alviz-api
```

---

## 📞 技术支持

如果在部署过程中遇到问题，可以通过以下方式获取帮助：

- **技术文档**: https://docs.alvisualization.com
- **GitHub Issues**: https://github.com/your-org/al-visualization/issues
- **邮件支持**: ops@alvisualization.com
- **社区论坛**: https://community.alvisualization.com

感谢您选择万物可视化！我们致力于为您提供最优质的部署体验。