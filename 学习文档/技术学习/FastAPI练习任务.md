# FastAPI实践练习任务

## 🎯 学习目标
通过实际操作掌握FastAPI的核心概念

## 📋 练习步骤

### 第1步：测试基础端点

#### 1.1 访问API文档
打开浏览器访问：http://localhost:8001/docs

您会看到一个漂亮的Swagger UI界面，这就是FastAPI自动生成的API文档！

#### 1.2 测试根端点
```bash
curl http://localhost:8001/
```

#### 1.3 测试健康检查
```bash
curl http://localhost:8001/health
```

### 第2步：创建数据

#### 2.1 创建问候消息
```bash
curl -X POST "http://localhost:8001/greetings" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello World!",
    "language": "English"
  }'
```

#### 2.2 创建用户
```bash
curl -X POST "http://localhost:8001/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25
  }'
```

#### 2.3 创建第二个用户（试试不同的数据）
```bash
curl -X POST "http://localhost:8001/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李四",
    "email": "lisi@example.com",
    "age": 30
  }'
```

### 第3步：查询数据

#### 3.1 获取所有问候
```bash
curl http://localhost:8001/greetings
```

#### 3.2 获取所有用户
```bash
curl http://localhost:8001/users
```

#### 3.3 获取特定用户
```bash
curl http://localhost:8001/users/1
```

### 第4步：测试数据验证

#### 4.1 测试无效数据（空姓名）
```bash
curl -X POST "http://localhost:8001/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "test@example.com"
  }'
```

#### 4.2 测试重复邮箱
```bash
curl -X POST "http://localhost:8001/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "王五",
    "email": "zhangsan@example.com"
  }'
```

#### 4.3 测试不存在的用户
```bash
curl http://localhost:8001/users/999
```

## 🔍 观察要点

### 1. 自动生成的API文档
- 打开 http://localhost:8001/docs
- 注意每个端点的详细说明
- 尝试在网页中直接测试API

### 2. 数据验证效果
- 观察Pydantic如何验证数据
- 注意错误信息的格式
- 理解字段验证规则的作用

### 3. HTTP状态码
- 200: 成功
- 400: 客户端错误（数据验证失败）
- 404: 资源未找到

### 4. JSON响应格式
- 观察成功的响应格式
- 注意错误响应的结构
- 理解response_model的作用

## 💡 思考问题

1. **数据模型的作用**：
   - 如果删除User类中的Field验证会发生什么？
   - 为什么需要数据验证？

2. **路由设计**：
   - 为什么用POST创建用户，用GET获取用户？
   - RESTful API的设计原则是什么？

3. **错误处理**：
   - HTTPException的作用是什么？
   - 如何处理不同的错误情况？

4. **API文档**：
   - FastAPI是如何自动生成API文档的？
   - 文档中的信息来自哪里？

## 🚀 进阶练习

### 1. 添加新功能
尝试为practice_api.py添加以下功能：
- 更新用户信息的PUT端点
- 删除用户的DELETE端点
- 按姓名搜索用户的GET端点

### 2. 数据持久化
- 尝试将数据保存到文件中
- 实现重启后数据不丢失

### 3. 更复杂的数据模型
- 创建包含嵌套对象的复杂数据模型
- 实现List类型字段

## 📚 学习资源

- FastAPI官方文档：https://fastapi.tiangolo.com/
- Pydantic文档：https://pydantic-docs.helpmanual.io/
- HTTP协议基础：https://developer.mozilla.org/zh-CN/docs/Web/HTTP

---

**完成这些练习后，您将掌握FastAPI的核心概念和使用方法！** 🎉