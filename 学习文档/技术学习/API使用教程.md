# 万物可视化 API使用教程 - 小白版

## 🎯 最常用的API：生成可视化

### 步骤1：在API文档中找到生成接口

1. 打开 http://localhost:8000/docs
2. 向下滚动找到 `POST /api/v2/generate`
3. 点击展开这个接口

### 步骤2：查看接口说明

您会看到以下信息：

**接口描述：** Universal Generate - 通用可视化生成

**请求体格式：**
```json
{
  "prompt": "string",                    // 必需：您想要生成的内容描述
  "template_id": "string",               // 可选：指定模板ID（如：normal_distribution）
  "parameters": {"key": "value"},        // 可选：模板参数（如：{"mu": 0, "sigma": 1}）
  "user_preferences": {"key": "value"}   // 可选：用户偏好设置
}
```

**⚠️ 重要提示：**
- 系统同时支持新格式和旧格式
- 旧格式（discipline, style）仍然可用
- 新格式提供更精确的控制

### 步骤3：在API文档中直接测试

1. 在API文档页面找到 "Try it out" 按钮
2. 点击这个按钮
3. 在弹出的表单中填写您的需求
4. 点击 "Execute" 执行

**示例1：简单描述（自动匹配模板）**
```json
{
  "prompt": "画一个正弦函数图像"
}
```

**示例2：指定特定模板**
```json
{
  "prompt": "正态分布可视化",
  "template_id": "normal_distribution"
}
```

**示例3：指定模板参数**
```json
{
  "prompt": "标准正态分布",
  "template_id": "normal_distribution",
  "parameters": {
    "mu": 0,
    "sigma": 1,
    "show_cdf": true
  }
}
```

**示例4：旧格式（仍然支持）**
```json
{
  "prompt": "展示抛物线运动轨迹",
  "discipline": "physics",
  "style": "plotly"
}
```

### 步骤4：查看结果

执行后您会看到：
- **Response body**: 服务器返回的JSON数据
- **generation_id**: 任务编号
- **status**: "processing"（处理中）或 "completed"（完成）
- **html_url**: 生成结果的访问地址

## 📊 完整工作流程示例

### 示例：生成二次函数图像

#### 第1步：发送生成请求
```bash
curl -X POST "http://localhost:8000/api/v2/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "画一个二次函数 y = x² 的图像",
    "discipline": "mathematics",
    "style": "plotly"
  }'
```

**返回结果：**
```json
{
  "generation_id": "abc123-def456-ghi789",
  "status": "processing",
  "message": "已开始生成可视化，请稍候...",
  "estimated_time": 5,
  "html_url": null
}
```

#### 第2步：检查生成状态
使用返回的 generation_id 查询进度：

```bash
curl "http://localhost:8000/api/v2/status/abc123-def456-ghi789"
```

**返回结果：**
```json
{
  "generation_id": "abc123-def456-ghi789",
  "status": "completed",
  "progress": 100,
  "html_url": "/api/v2/visualizations/viz_abc123",
  "error": null
}
```

#### 第3步：访问生成的可视化
在浏览器中访问：http://localhost:8000/api/v2/visualizations/viz_abc123

## 🔧 其他有用的API

### 1. 查看系统健康状态
```bash
curl "http://localhost:8000/health"
```

### 2. 查看所有可用模板
```bash
curl "http://localhost:8000/api/v2/templates"
```

### 3. 智能学科分类
```bash
curl -X POST "http://localhost:8000/api/v2/classify" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "分析行星运动轨迹"
  }'
```

## 💡 API文档使用技巧

### 1. 颜色编码说明
- **蓝色 GET**: 获取数据（安全操作）
- **绿色 POST**: 创建数据（会产生新内容）
- **黄色 PUT**: 更新数据
- **红色 DELETE**: 删除数据

### 2. 必需参数 vs 可选参数
- **黑色加粗**: 必需参数（必须提供）
- **灰色**: 可选参数（可以省略）

### 3. 响应状态码
- **200**: 成功
- **400**: 请求错误（参数不对）
- **422**: 数据验证失败
- **500**: 服务器内部错误

## 🎨 实践练习

### 练习1：生成不同学科的可视化
尝试用不同的学科和描述：

1. **数学类**：
   - "正弦函数和余弦函数对比"
   - "指数函数增长曲线"
   - "三维空间中的球面"

2. **物理类**：
   - "自由落体运动"
   - "简谐振动"
   - "电磁波传播"

3. **天文类**：
   - "太阳系行星轨道"
   - "月相变化"
   - "恒星演化过程"

### 练习2：查看和理解模板
1. 访问模板列表API
2. 理解每个模板的参数
3. 尝试使用特定模板

## 🚨 常见问题解决

### 问题1：生成失败
**现象：** 返回错误信息
**解决：**
1. 检查prompt描述是否清晰
2. 确认discipline是否正确
3. 查看错误信息了解具体问题

### 问题2：生成超时
**现象：** 长时间没有响应
**解决：**
1. 检查网络连接
2. 简化描述文字
3. 重新尝试生成

### 问题3：结果不满意
**现象：** 生成的图表不符合预期
**解决：**
1. 更详细地描述需求
2. 指定具体的参数
3. 尝试不同的discipline

---

**记住：API文档是您最好的朋友！多尝试，多练习，很快就能熟练使用了！** 🌟