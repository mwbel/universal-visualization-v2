# 🎯 API端点实际顺序列表

按照 http://localhost:8003/docs 页面中的实际显示顺序

## 📋 **API端点按实际显示顺序排列**

### **1. 根端点**
```
GET /
[GET] Root
API根端点，返回基本信息
```
**位置**: 页面顶部
**用途**: 获取API的基本信息和欢迎信息

---

### **2. 学科分类**
```
POST /api/v2/classify
[POST] Classify Visualization Request
智能识别用户输入的学科类别
```
**位置**: 靠近页面顶部
**用途**: 将用户输入分类到具体学科（数学、天文、物理等）

---

### **3. 通用生成**
```
POST /api/v2/generate
[POST] Universal Generate
通用可视化生成接口 - 方案A核心入口

功能流程：
1. 智能学科识别
2. Agent需求解析
3. 模板匹配
4. 可视化生成
```
**位置**: 页面中上部
**用途**: 支持所有学科的通用可视化生成

---

### **4. 系统健康检查**
```
GET /api/v2/health
[GET] Health Check
检查API服务器的健康状态
```
**位置**: 页面中部（第4个端点）
**用途**: 监控API服务器状态和性能

**注意**: 还有另一个健康检查端点 `/health` 在页面底部

---

### **5. 茅塞顿开专用生成**
```
POST /api/v2/highschool/generate
[POST] Highschool Generate
茅塞顿开专用生成接口 - 高中全科可视化
```
**位置**: 页面中部
**用途**: 专门针对高中学科的可视化生成

---

### **6. 高中科目列表**
```
GET /api/v2/highschool/subjects
[GET] Get High School Subjects
获取支持的高中科目列表
```
**位置**: 页面中部
**用途**: 查看茅塞顿开系统支持的所有高中科目

---

### **7. 高中学科专用生成**
```
POST /api/v2/highschool/{subject}/generate
[POST] High School Subject Generate
针对特定高中科目的生成接口
```
**位置**: 页面中部
**用途**: 明确指定高中科目的可视化生成
**参数**: subject - 科目代码（如：mathematics、physics等）

---

### **8. 系统注册信息**
```
GET /api/v2/registry
[GET] Get System Registry
获取系统组件注册信息
```
**位置**: 页面中下部
**用途**: 查看已加载的Agent和模板信息

---

### **9. 生成状态查询**
```
GET /api/v2/status/{generation_id}
[GET] Get Generation Status
查询可视化生成的进度和状态
```
**位置**: 页面中下部
**用途**: 跟踪异步生成任务的进度
**参数**: generation_id - 生成任务ID

---

### **10. 获取所有模板**
```
GET /api/v2/templates
[GET] Get Available Templates
获取所有可用的可视化模板
```
**位置**: 页面下部
**用途**: 查看系统支持的所有可视化模板

---

### **11. 搜索模板**
```
GET /api/v2/templates/search
[GET] Search Templates
搜索匹配关键词的模板
```
**位置**: 页面下部
**用途**: 根据关键词搜索相关模板
**参数**:
- q (query): 搜索关键词
- subject: 可选的学科筛选

---

### **12. 获取可视化结果**
```
GET /api/v2/visualizations/{viz_id}
[GET] Get Visualization Result
获取生成的可视化HTML内容
```
**位置**: 页面下部
**用途**: 获取完整的可视化页面内容
**参数**: viz_id - 可视化ID

---

### **13. 学科专用生成**
```
POST /api/v2/{subject}/generate
[POST] Subject Specific Generate
针对特定学科的生成接口
```
**位置**: 页面下部
**用途**: 明确指定学科的可视化生成
**参数**: subject - 学科名称（如：astronomy、mathematics等）

---

### **14. 学科模板列表**
```
GET /api/v2/{subject}/templates
[GET] Get Subject Templates
获取特定学科的模板列表
```
**位置**: 页面下部
**用途**: 查看指定学科的所有可用模板
**参数**: subject - 学科名称

---

### **15. 独立健康检查**
```
GET /health
[GET] Health Check
独立的健康检查端点
```
**位置**: 页面底部（最后一个端点）
**用途**: 与 `/api/v2/health` 功能相同的健康检查

## 🎯 **在实际文档页面中的查找技巧**

### **快速定位方法**:

1. **使用搜索框**:
   - 在页面顶部的搜索框输入关键词
   - 如搜索 "health"、"generate"、"classify" 等

2. **使用浏览器查找**:
   - 按 `Ctrl+F` (Windows) 或 `Cmd+F` (Mac)
   - 输入端点名称快速定位

3. **注意端点顺序**:
   - 根端点 `/` 在最前面
   - 核心功能接口（classify、generate）在中上部
   - 状态查询和结果获取在中下部
   - 健康检查 `/health` 在最后面

### **按功能分组查找**:

#### **基础功能** (页面中上部):
- `GET /` (根端点)
- `POST /api/v2/classify` (学科分类)
- `POST /api/v2/generate` (通用生成)

#### **系统监控** (页面中部和底部):
- `GET /api/v2/health` (系统健康检查)
- `GET /health` (独立健康检查)

#### **茅塞顿开功能** (页面中部):
- `POST /api/v2/highschool/generate` (高中生成)
- `GET /api/v2/highschool/subjects` (科目列表)
- `POST /api/v2/highschool/{subject}/generate` (高中科目生成)

#### **模板管理** (页面下部):
- `GET /api/v2/templates` (所有模板)
- `GET /api/v2/templates/search` (搜索模板)
- `GET /api/v2/{subject}/templates` (学科模板)

#### **结果管理** (页面中下部):
- `GET /api/v2/status/{generation_id}` (查询状态)
- `GET /api/v2/visualizations/{viz_id}` (获取结果)

#### **系统信息** (页面中下部):
- `GET /api/v2/registry` (系统注册信息)

#### **专业功能** (页面下部):
- `POST /api/v2/{subject}/generate` (学科专用生成)

## 🔄 **推荐的使用顺序（按页面位置）**

### **新用户测试流程**:

1. **第一步**: 健康检查
   - 查找: `GET /api/v2/health` (页面中部)
   - 或者: `GET /health` (页面底部)

2. **第二步**: 学科分类（可选）
   - 查找: `POST /api/v2/classify` (页面顶部)

3. **第三步**: 发起生成
   - 通用: `POST /api/v2/generate` (页面中上部)
   - 或高中: `POST /api/v2/highschool/generate` (页面中部)

4. **第四步**: 查询状态
   - 查找: `GET /api/v2/status/{generation_id}` (页面中下部)

5. **第五步**: 获取结果
   - 查找: `GET /api/v2/visualizations/{viz_id}` (页面下部)

### **开发者测试流程**:

1. **系统信息**: `GET /api/v2/registry` (页面中下部)
2. **模板查看**: `GET /api/v2/templates` (页面下部)
3. **完整工作流**: 按照新用户流程

### **茅塞顿开测试流程**:

1. **科目查看**: `GET /api/v2/highschool/subjects` (页面中部)
2. **专用生成**: `POST /api/v2/highschool/generate` (页面中部)
3. **状态结果**: 同新用户流程的4、5步

## 💡 **实际使用提示**

### **记住关键位置**:
- **基础功能**: 页面顶部和中部
- **健康检查**: 中部和底部有两个
- **模板相关**: 页面下部
- **结果相关**: 页面中下部

### **搜索技巧**:
1. **按功能搜索**: 输入 "generate" 找到所有生成接口
2. **按学科搜索**: 输入 "highschool" 找到茅塞顿开相关接口
3. **按状态搜索**: 输入 "status" 或 "health" 找到监控接口

### **快速测试**:
- 不用记住顺序，直接使用搜索框
- 或者记住核心几个：`/`、`/api/v2/classify`、`/api/v2/generate`、`/health`

现在你可以轻松地在 http://localhost:8003/docs 页面中找到任何你需要的API端点了！