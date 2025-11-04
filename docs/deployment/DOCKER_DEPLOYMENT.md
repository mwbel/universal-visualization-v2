# Docker容器化部署指南

## 📋 目录

1. [Docker架构](#docker架构)
2. [快速开始](#快速开始)
3. [Dockerfile详解](#dockerfile详解)
4. [Docker Compose配置](#docker-compose配置)
5. [生产环境优化](#生产环境优化)
6. [监控和日志](#监控和日志)
7. [故障排除](#故障排除)

## 🐳 Docker架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │      Database    │
│   (Nginx)       │    │   (FastAPI)     │    │  (PostgreSQL)    │
│   Port: 80/443  │    │   Port: 8000    │    │   Port: 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Cache)       │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 🚀 快速开始

### 1. 环境准备

#### 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

#### 安装Docker Compose
```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 项目结构

```
al-visualization/
├── docker-compose.yml              # Docker Compose配置
├── docker-compose.prod.yml         # 生产环境配置
├── docker-compose.dev.yml          # 开发环境配置
├── .env.example                    # 环境变量模板
├── main-app/                       # 前端应用
│   ├── Dockerfile
│   ├── nginx.conf
│   └── dist/
├── backend/                        # 后端应用
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic/
├── nginx/                          # Nginx配置
│   ├── Dockerfile
│   └── default.conf
├── scripts/                        # 部署脚本
│   ├── deploy.sh
│   ├── backup.sh
│   └── health-check.sh
└── monitoring/                     # 监控配置
    ├── prometheus/
    ├── grafana/
    └── docker-compose.monitoring.yml
```

### 3. 一键部署

```bash
# 克隆项目
git clone https://github.com/your-org/al-visualization.git
cd al-visualization

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 📝 Dockerfile详解

### 前端Dockerfile

**main-app/Dockerfile**:
```dockerfile
# 多阶段构建
# 阶段1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 阶段2: 生产阶段
FROM nginx:alpine AS production

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
```

**优化要点**:
- 使用多阶段构建减少镜像大小
- 使用Alpine Linux基础镜像
- 分离构建和运行环境
- 利用Docker层缓存优化构建速度

### 后端Dockerfile

**backend/Dockerfile**:
```dockerfile
# 基础镜像
FROM python:3.11-slim AS base

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要目录
RUN mkdir -p logs uploads static

# 设置文件权限
RUN chown -R appuser:appuser /app

# 切换到应用用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**优化要点**:
- 使用非root用户运行应用
- 安装最小系统依赖
- 分层优化依赖安装
- 添加健康检查
- 设置合适的工作目录和权限

### Nginx Dockerfile

**nginx/Dockerfile**:
```dockerfile
FROM nginx:alpine

# 复制配置文件
COPY default.conf /etc/nginx/conf.d/default.conf

# 复制SSL证书（如果有）
COPY ssl/ /etc/nginx/ssl/

# 添加自定义脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80 443

# 启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

## ⚙️ Docker Compose配置

### 开发环境配置

**docker-compose.dev.yml**:
```yaml
version: '3.8'

services:
  # 前端开发服务
  frontend:
    build:
      context: ./main-app
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./main-app:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8000
    command: npm run dev

  # 后端开发服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DEBUG=true
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/alvisualization_dev
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # 数据库
  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=alvisualization_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./backend/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data

volumes:
  postgres_data_dev:
  redis_data_dev:
```

### 生产环境配置

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  # Nginx反向代理
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - backend
    restart: unless-stopped

  # 后端API服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+asyncpg://alviz:${DB_PASSWORD}@db:5432/alvisualization
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=false
    depends_on:
      - db
      - redis
    volumes:
      - app_logs:/app/logs
      - app_uploads:/app/uploads
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # 数据库
  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=alvisualization
      - POSTGRES_USER=alviz
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  # Redis缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  # 监控服务
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  nginx_logs:
  app_logs:
  app_uploads:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
```

### 主配置文件

**docker-compose.yml**:
```yaml
version: '3.8'

# 包含环境特定配置
include:
  - docker-compose.${ENV:-dev}.yml

# 公共配置
x-common-variables: &common-variables
  TZ: Asia/Shanghai
  LANG: C.UTF-8
  LC_ALL: C.UTF-8

x-healthcheck: &healthcheck
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

services:
  # 服务配置在环境特定文件中定义

# 网络配置
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
  monitoring:
    driver: bridge
```

## 🔧 生产环境优化

### 1. 镜像优化

#### 多阶段构建优化
```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim AS base

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建虚拟环境
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# 复制并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 生产镜像
FROM python:3.11-slim AS production

# 只安装运行时依赖
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制虚拟环境
COPY --from=base /venv /venv
ENV PATH="/venv/bin:$PATH"

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 复制应用代码
WORKDIR /app
COPY --chown=appuser:appuser . .

# 用户切换
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### 镜像大小优化
```bash
# 构建时使用.dockerignore
echo "node_modules
.git
*.log
.DS_Store
coverage/
.nyc_output
.cache
dist
.env*" > .dockerignore

# 分析镜像大小
docker history alvisualization_backend:latest

# 使用多阶段构建减少最终镜像大小
# 目标：后端镜像 < 200MB，前端镜像 < 50MB
```

### 2. 资源限制

#### CPU和内存限制
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'        # 限制为1个CPU核心
          memory: 1G         # 限制为1GB内存
        reservations:
          cpus: '0.5'        # 保留0.5个CPU核心
          memory: 512M       # 保留512MB内存
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
```

#### 磁盘限制
```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/postgres
```

### 3. 安全配置

#### 非root用户
```dockerfile
# 创建专用用户
RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser

# 设置合适的文件权限
COPY --chown=appuser:appuser . /app
USER appuser
```

#### 网络隔离
```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外网
  monitoring:
    driver: bridge

services:
  backend:
    networks:
      - backend
      - frontend  # 如果需要暴露API
  db:
    networks:
      - backend  # 只能在内部网络访问
```

### 4. 性能调优

#### 数据库性能
```yaml
db:
  image: postgres:13-alpine
  environment:
    - POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
  command: >
    postgres
    -c shared_preload_libraries=pg_stat_statements
    -c max_connections=200
    -c shared_buffers=256MB
    -c effective_cache_size=1GB
    -c work_mem=4MB
    -c maintenance_work_mem=64MB
  volumes:
    - ./postgresql.conf:/etc/postgresql/postgresql.conf
```

#### 缓存性能
```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
    --save 900 1
    --save 300 10
    --save 60 10000
```

## 📊 监控和日志

### 1. 日志配置

#### 日志收集
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service,environment"
    labels:
      - "service=backend"
      - "environment=production"
```

#### 集中日志管理
```yaml
# 添加ELK Stack（可选）
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
  environment:
    - discovery.type=single-node
    - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data

logstash:
  image: docker.elastic.co/logstash/logstash:7.15.0
  volumes:
    - ./monitoring/logstash/pipeline:/usr/share/logstash/pipeline
  depends_on:
    - elasticsearch

kibana:
  image: docker.elastic.co/kibana/kibana:7.15.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
```

### 2. 监控配置

#### Prometheus配置
```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
```

#### 告警配置
```yaml
# monitoring/alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@alvisualization.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@alvisualization.com'
    subject: '[ALVIS] {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

## 🔧 故障排除

### 常见Docker问题

#### 1. 容器启动失败
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs backend

# 进入容器调试
docker-compose exec backend bash

# 检查容器资源使用
docker stats
```

#### 2. 网络连接问题
```bash
# 检查网络配置
docker network ls
docker network inspect al-visualization_default

# 测试容器间连通性
docker-compose exec backend ping db

# 端口映射检查
docker-compose port backend 8000
```

#### 3. 数据持久化问题
```bash
# 检查卷挂载
docker volume ls
docker volume inspect al-visualization_postgres_data

# 备份卷数据
docker run --rm -v al-visualization_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# 恢复卷数据
docker run --rm -v al-visualization_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

#### 4. 镜像构建问题
```bash
# 清理Docker缓存
docker builder prune -a

# 重新构建镜像
docker-compose build --no-cache backend

# 查看构建历史
docker history alvisualization_backend:latest

# 分析镜像层
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest alvisualization_backend:latest
```

### 性能优化问题

#### 1. 内存不足
```bash
# 检查内存使用
docker stats --no-stream

# 限制容器内存
docker-compose up -d --scale backend=2

# 优化内存使用
# 减少并发工作进程
# 优化Python代码内存使用
```

#### 2. 磁盘空间不足
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 清理构建缓存
docker builder prune
```

### 调试技巧

#### 1. 实时日志监控
```bash
# 监控所有服务日志
docker-compose logs -f

# 监控特定服务
docker-compose logs -f backend

# 显示最近100行日志
docker-compose logs --tail=100 backend
```

#### 2. 健康检查调试
```bash
# 手动执行健康检查
docker-compose exec backend curl -f http://localhost:8000/api/health

# 查看健康检查状态
docker inspect al-visualization_backend_1 | grep Health -A 10
```

#### 3. 性能分析
```bash
# 容器内性能分析
docker-compose exec backend top

# 容器进程监控
docker-compose exec backend ps aux

# 网络连接监控
docker-compose exec backend netstat -tulpn
```

---

## 📞 技术支持

如果在使用Docker部署时遇到问题，可以通过以下方式获取帮助：

- **Docker文档**: https://docs.docker.com
- **Docker Compose文档**: https://docs.docker.com/compose
- **项目Issues**: https://github.com/your-org/al-visualization/issues
- **邮件支持**: docker@alvisualization.com

感谢您使用Docker部署万物可视化！