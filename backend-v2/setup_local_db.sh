#!/bin/bash
# ============================================
# 万物可视化项目 - 本地数据库快速设置脚本
# ============================================

set -e  # 遇到错误立即退出

echo "============================================"
echo "  万物可视化项目 - 本地数据库设置"
echo "============================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}✓ 项目根目录: $PROJECT_ROOT${NC}"
echo ""

# ============================================
# 步骤1：检查 PostgreSQL 是否安装
# ============================================
echo -e "${YELLOW}[1/6] 检查 PostgreSQL...${NC}"

if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓ PostgreSQL 已安装: $PSQL_VERSION${NC}"
else
    echo -e "${RED}✗ PostgreSQL 未安装${NC}"
    echo ""
    echo "请先安装 PostgreSQL："
    echo "  macOS:   brew install postgresql@16"
    echo "  Ubuntu:  sudo apt install postgresql"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# 检查服务是否运行
if pg_isready &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL 服务正在运行${NC}"
else
    echo -e "${YELLOW}! PostgreSQL 服务未运行，尝试启动...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql@16
    else
        sudo systemctl start postgresql
    fi
    sleep 2

    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL 服务已启动${NC}"
    else
        echo -e "${RED}✗ 无法启动 PostgreSQL 服务${NC}"
        exit 1
    fi
fi

echo ""

# ============================================
# 步骤2：获取数据库配置信息
# ============================================
echo -e "${YELLOW}[2/6] 配置数据库信息...${NC}"

# 默认配置
DB_NAME="universal_viz_db"
DB_USER="universal_viz_user"

# 检查是否已存在
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}✓ 数据库 '$DB_NAME' 已存在${NC}"
    CREATE_DB=false
else
    echo -e "${YELLOW}! 将创建新数据库: $DB_NAME${NC}"
    CREATE_DB=true
fi

# 询问密码
if [ "$CREATE_DB" = true ]; then
    echo ""
    read -sp "请输入数据库用户 '$DB_USER' 的密码: " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}✗ 密码不能为空${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}! 使用现有数据库，跳过密码设置${NC}"
    DB_PASSWORD="*"
fi

echo ""

# ============================================
# 步骤3：创建数据库和用户（如果需要）
# ============================================
if [ "$CREATE_DB" = true ]; then
    echo -e "${YELLOW}[3/6] 创建数据库和用户...${NC}"

    # 创建用户和数据库
    psql postgres << EOF
-- 创建用户
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';

-- 创建数据库
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- 连接到新数据库并授予 schema 权限
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 数据库和用户创建成功${NC}"
    else
        echo -e "${RED}✗ 创建失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[3/6] 跳过数据库创建（已存在）${NC}"
fi

echo ""

# ============================================
# 步骤4：安装 Python 依赖
# ============================================
echo -e "${YELLOW}[4/6] 安装 Python 依赖...${NC}"

cd "$PROJECT_ROOT/backend-v2"

if [ ! -f "requirements.txt" ]; then
    echo "创建 requirements.txt..."
    cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
asyncpg==0.29.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
google-generativeai==0.3.2
python-dotenv==1.0.0
aiofiles==23.2.1
httpx==0.25.2
EOF
fi

echo "安装依赖包..."
pip3 install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Python 依赖安装成功${NC}"
else
    echo -e "${RED}✗ 依赖安装失败${NC}"
    exit 1
fi

echo ""

# ============================================
# 步骤5：配置 .env 文件
# ============================================
echo -e "${YELLOW}[5/6] 配置环境变量...${NC}"

ENV_FILE="$PROJECT_ROOT/backend-v2/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}! .env 文件已存在，备份旧文件...${NC}"
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$ENV_FILE" << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Gemini API（请填入你的 API Key）
GEMINI_API_KEY=your_gemini_api_key_here

# MinerU API（可选）
USE_MINERU_FALLBACK=false
MINERU_API_KEY=

# 质量阈值
QUALITY_THRESHOLD=0.85

# 文件限制
MAX_FILE_SIZE=52428800

# 服务器配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
EOF

echo -e "${GREEN}✓ .env 文件创建成功${NC}"
echo -e "${YELLOW}! 请修改 .env 文件中的 GEMINI_API_KEY${NC}"

echo ""

# ============================================
# 步骤6：初始化数据库
# ============================================
echo -e "${YELLOW}[6/6] 初始化数据库表和数据...${NC}"

if [ -f "database/init_database.py" ]; then
    python3 database/init_database.py --init
else
    echo -e "${RED}✗ 找不到初始化脚本${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo -e "${GREEN}  ✅ 数据库设置完成！${NC}"
echo "============================================"
echo ""
echo "📝 后续步骤："
echo ""
echo "1. 编辑 .env 文件，填入你的 GEMINI_API_KEY:"
echo "   vim backend-v2/.env"
echo ""
echo "2. 测试数据库连接:"
echo "   cd backend-v2"
echo "   python3 database/init_database.py --test"
echo ""
echo "3. 启动后端服务:"
echo "   cd backend-v2"
echo "   python3 -m uvicorn main:app --reload"
echo ""
echo "4. 访问 API 文档:"
echo "   http://localhost:8000/docs"
echo ""
echo "5. 查看数据库管理命令:"
echo "   python3 database/init_database.py --help"
echo ""
echo -e "${GREEN}祝使用愉快！🎉${NC}"
