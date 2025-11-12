"""
练习API - 学习FastAPI基础概念
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uvicorn

# 1. 创建FastAPI应用实例
app = FastAPI(
    title="练习API", description="用于学习FastAPI基础概念的练习API", version="1.0.0"
)


# 2. 定义数据模型
class User(BaseModel):
    """用户模型"""

    name: str = Field(..., description="用户姓名", min_length=1, max_length=50)
    email: str = Field(..., description="用户邮箱")
    age: Optional[int] = Field(None, ge=0, le=150, description="用户年龄")


class GreetingRequest(BaseModel):
    """问候请求模型"""

    message: str = Field(..., description="问候消息", min_length=1, max_length=100)
    language: str = Field("中文", description="语言")


# 3. 模拟数据存储
users_db = []
greetings_db = []

# 4. 定义API路由


@app.get("/")
async def root():
    """API根端点"""
    return {
        "message": "欢迎来到FastAPI练习API",
        "version": "1.0.0",
        "endpoints": {
            "greetings": "/greetings",
            "users": "/users",
            "health": "/health",
        },
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "users_count": len(users_db),
        "greetings_count": len(greetings_db),
    }


@app.post("/greetings", response_model=dict)
async def create_greeting(request: GreetingRequest):
    """创建问候消息"""
    greeting_id = len(greetings_db) + 1

    greeting = {
        "id": greeting_id,
        "message": request.message,
        "language": request.language,
        "created_at": datetime.now().isoformat(),
    }

    greetings_db.append(greeting)

    return {"message": "问候创建成功", "greeting": greeting}


@app.get("/greetings")
async def get_greetings():
    """获取所有问候消息"""
    return {"count": len(greetings_db), "greetings": greetings_db}


@app.post("/users", response_model=dict)
async def create_user(user: User):
    """创建用户"""
    # 检查邮箱是否已存在
    for existing_user in users_db:
        if existing_user["email"] == user.email:
            raise HTTPException(status_code=400, detail="邮箱已存在")

    user_id = len(users_db) + 1

    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "age": user.age,
        "created_at": datetime.now().isoformat(),
    }

    users_db.append(new_user)

    return {"message": "用户创建成功", "user": new_user}


@app.get("/users")
async def get_users():
    """获取所有用户"""
    return {"count": len(users_db), "users": users_db}


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """获取特定用户"""
    for user in users_db:
        if user["id"] == user_id:
            return user

    raise HTTPException(status_code=404, detail="用户未找到")


# 5. 启动说明
if __name__ == "__main__":
    print("🚀 启动练习API服务器...")
    print("📖 API文档地址: http://localhost:8001/docs")
    print("🌐 API地址: http://localhost:8001")
    print("⏹️  按 Ctrl+C 停止服务")

    uvicorn.run("practice_api:app", host="0.0.0.0", port=8001, reload=True)
