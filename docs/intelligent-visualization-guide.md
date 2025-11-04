# 智能可视化功能使用指南

## 概述

智能可视化功能是万物可视化平台的革命性新特性，支持三种输入模式，能够自动生成专业的可视化页面。通过AI驱动的智能解析，用户只需输入自然语言描述，即可快速创建高质量的可视化内容。

## 🚀 快速开始

### 基本使用流程

1. **选择输入模式**：文本输入、模板选择或概念搜索
2. **输入需求**：描述您的可视化需求
3. **查看推荐**：系统智能推荐最合适的可视化方案
4. **调整参数**：根据需要调整可视化参数
5. **生成结果**：一键生成专业可视化页面

### 在线演示

访问演示页面：[智能可视化演示](../test/intelligent-viz-demo.html)

## 📝 三种输入模式详解

### 1. 文本输入模式

**适用场景**：当您有具体的可视化需求但不确定使用哪种模板时

**使用方法**：
```
输入自然语言描述，例如：
- "显示正态分布曲线，均值0，标准差1"
- "创建一个二次函数图像，a=2, b=-3, c=1"
- "展示简谐振动的位移时间图像"
```

**支持的描述类型**：
- 数学函数和图形
- 物理现象和运动
- 天文学概念和天体运动
- 化学分子和反应

**智能识别能力**：
- 自动识别学科领域
- 提取数值参数
- 推断用户意图
- 推荐最佳模板

### 2. 模板选择模式

**适用场景**：当您明确知道要使用的可视化模板时

**使用方法**：
```
输入模板ID或名称，例如：
- "normal_distribution"
- "quadratic_function"
- "simple_harmonic_motion"
```

**可用模板类别**：
- **数学可视化**：概率分布、函数图像、矩阵变换
- **天文学可视化**：行星轨道、月相变化、天球坐标
- **物理学可视化**：振动、运动、能量
- **化学可视化**：分子结构、周期表、化学反应

### 3. 概念搜索模式

**适用场景**：当您想探索特定概念的可视化表现时

**使用方法**：
```
输入关键词或概念，例如：
- "概率分布"
- "函数图像"
- "振动"
- "行星运动"
```

**搜索特性**：
- 语义匹配和模糊搜索
- 专业术语识别
- 相关概念推荐
- 深度链接支持

## 🛠️ 核心组件架构

### IntelligentInputProcessor（智能输入处理器）

负责处理用户输入的核心组件，支持：
- 自然语言处理和意图识别
- 参数提取和验证
- 多模式输入统一处理
- 智能推荐生成

**基本用法**：
```javascript
const processor = new IntelligentInputProcessor();

// 处理文本输入
const result = await processor.processInput("显示正态分布曲线", {
  mode: 'text'
});

console.log(result.recommendations); // 推荐的可视化方案
```

### TemplateMatchingSystem（模板匹配系统）

负责将用户需求与可视化模板进行智能匹配：
- 相似度计算算法
- 多维度匹配策略
- 个性化推荐
- 缓存优化

**基本用法**：
```javascript
const matcher = new TemplateMatchingSystem(templates);

// 匹配模板
const matches = await matcher.match("正态分布", {
  category: 'mathematics',
  limit: 5
});

console.log(matches); // 匹配结果列表
```

### VisualizationEngine（可视化引擎）

负责生成实际的可视化内容：
- 多渲染器支持（Chart.js、D3.js、Three.js）
- 动态组件创建
- 交互功能实现
- 性能优化

**基本用法**：
```javascript
const engine = new VisualizationEngine();

// 生成可视化
const visualization = await engine.generate({
  type: 'chart',
  category: 'mathematics',
  template: selectedTemplate,
  parameters: { mu: 0, sigma: 1 }
});
```

### PageBuilder（页面构建器）

负责构建完整的可视化页面：
- 多种布局支持
- 组件组装和管理
- 主题系统
- 响应式设计

**基本用法**：
```javascript
const builder = new PageBuilder();

// 构建页面
const page = await builder.build({
  title: '正态分布可视化',
  layout: 'single-column',
  components: [
    {
      type: 'visualization',
      config: visualizationConfig
    }
  ]
});
```

## 📊 支持的可视化类型

### 数学可视化

#### 正态分布
```javascript
// 输入示例
"显示正态分布曲线，均值0，标准差1"

// 参数配置
{
  mu: 0,      // 均值
  sigma: 1    // 标准差
}
```

#### 二次函数
```javascript
// 输入示例
"创建二次函数 y = 2x² - 3x + 1"

// 参数配置
{
  a: 2,       // 二次项系数
  b: -3,      // 一次项系数
  c: 1        // 常数项
}
```

#### 三角函数
```javascript
// 输入示例
"显示正弦和余弦函数图像"

// 参数配置
{
  amplitude: 1,    // 振幅
  frequency: 1,    // 频率
  phase: 0         // 相位
}
```

### 物理学可视化

#### 简谐振动
```javascript
// 输入示例
"展示简谐振动的位移时间图像"

// 参数配置
{
  amplitude: 1,    // 振幅
  frequency: 1,    // 频率
  phase: 0         // 初相位
}
```

#### 自由落体
```javascript
// 输入示例
"模拟物体从100米高度自由落体"

// 参数配置
{
  height: 100,     // 初始高度
  gravity: 9.8,    // 重力加速度
  initialVelocity: 0  // 初速度
}
```

### 天文学可视化

#### 行星运动轨迹
```javascript
// 输入示例
"显示地球绕太阳的运动轨迹"

// 参数配置
{
  planet: 'earth',    // 行星选择
  timeScale: 1,       // 时间缩放
  showOrbit: true     // 显示轨道
}
```

#### 月相变化
```javascript
// 输入示例
"展示一个月的月相变化"

// 参数配置
{
  days: 30,          // 天数
  speed: 1           // 播放速度
}
```

## 🎨 高级功能

### 自定义模板

您可以创建自己的可视化模板：

```javascript
const customTemplate = {
  id: 'my_custom_viz',
  name: '我的自定义可视化',
  description: '自定义可视化描述',
  category: 'custom',
  tags: ['自定义', '特殊'],
  keywords: ['custom', 'special'],
  parameters: [
    {
      name: 'param1',
      label: '参数1',
      type: 'number',
      default: 1,
      min: 0,
      max: 10
    }
  ]
};

// 注册到模板匹配系统
templateMatcher.addTemplate(customTemplate);
```

### 参数配置

可视化支持丰富的参数配置：

```javascript
const config = {
  // 基础参数
  width: 800,
  height: 600,
  title: '可视化标题',
  description: '可视化描述',

  // 交互参数
  interactions: {
    zoom: true,      // 支持缩放
    pan: true,       // 支持平移
    select: true     // 支持选择
  },

  // 动画参数
  animation: {
    enabled: true,
    duration: 1000,
    easing: 'ease-in-out'
  },

  // 响应式参数
  responsive: true,
  maintainAspectRatio: false
};
```

### 主题定制

支持深色和浅色主题：

```javascript
// 应用深色主题
pageBuilder.applyTheme(page, 'dark');

// 切换主题
pageBuilder.toggleTheme();
```

## 🔧 集成指南

### 基本集成

1. **引入组件**：
```html
<script src="components/IntelligentInputProcessor.js"></script>
<script src="components/TemplateMatchingSystem.js"></script>
<script src="components/VisualizationEngine.js"></script>
<script src="components/PageBuilder.js"></script>
```

2. **初始化系统**：
```javascript
// 加载模板数据
const templates = await loadTemplates();

// 初始化组件
const processor = new IntelligentInputProcessor();
const matcher = new TemplateMatchingSystem(templates);
const engine = new VisualizationEngine();
const builder = new PageBuilder();
```

3. **处理用户输入**：
```javascript
async function handleUserInput(input, mode) {
  try {
    // 处理输入
    const result = await processor.processInput(input, { mode });

    // 选择最佳匹配
    const bestMatch = result.recommendations[0];

    // 生成可视化
    const visualization = await engine.generate({
      type: 'chart',
      category: bestMatch.template.category,
      template: bestMatch.template,
      parameters: result.parameters
    });

    // 构建页面
    const page = await builder.build({
      title: bestMatch.template.name,
      components: [{
        type: 'visualization',
        config: visualization
      }]
    });

    return page;

  } catch (error) {
    console.error('处理失败:', error);
    throw error;
  }
}
```

### 与现有系统集成

#### 集成到SmartInput

```javascript
// 扩展现有SmartInput组件
smartInput.on('generate', async (event) => {
  const { prompt } = event.detail;

  // 使用智能处理器
  const result = await processor.processInput(prompt);

  if (result.recommendations.length > 0) {
    // 自动选择最佳推荐并生成
    await generateFromRecommendation(result.recommendations[0]);
  }
});
```

#### 集成到用户系统

```javascript
// 保存用户生成历史
if (window.userManager && window.userManager.isLoggedIn()) {
  const userHistory = {
    input: userInput,
    result: result,
    timestamp: Date.now()
  };

  window.userManager.saveToHistory(userHistory);
}
```

## 🐛 故障排除

### 常见问题

#### 1. 组件加载失败
**问题**：ReferenceError: IntelligentInputProcessor is not defined

**解决方案**：
- 确保所有脚本文件按正确顺序加载
- 检查文件路径是否正确
- 确认没有JavaScript语法错误

#### 2. 模板匹配失败
**问题**：没有找到合适的可视化模板

**解决方案**：
- 尝试使用更具体的描述
- 检查关键词拼写
- 使用模板选择模式直接指定模板

#### 3. 可视化渲染失败
**问题**：图表无法正常显示

**解决方案**：
- 确保Chart.js库正确加载
- 检查canvas元素是否存在
- 验证参数配置是否正确

#### 4. 性能问题
**问题**：处理速度较慢

**解决方案**：
- 启用缓存功能
- 减少同时处理的请求数量
- 优化输入描述的长度

### 调试模式

启用调试模式获取详细信息：

```javascript
// 启用详细日志
const processor = new IntelligentInputProcessor({
  debug: true
});

// 监听所有事件
processor.on('*', (event, data) => {
  console.log(`Event: ${event}`, data);
});
```

## 📈 性能优化

### 缓存策略

系统内置了多级缓存机制：

1. **输入处理缓存**：缓存相似输入的处理结果
2. **模板匹配缓存**：缓存模板匹配结果
3. **可视化缓存**：缓存生成的可视化组件

```javascript
// 配置缓存
const processor = new IntelligentInputProcessor({
  enableCache: true,
  cacheSize: 100,
  cacheTimeout: 30 * 60 * 1000 // 30分钟
});
```

### 懒加载

对于复杂可视化，支持懒加载：

```javascript
const config = {
  enableLazyLoad: true,
  lazyLoadThreshold: 1000 // 1秒后加载
};
```

## 🔮 未来发展

### 计划中的功能

1. **更多可视化类型**
   - 机器学习模型可视化
   - 地理信息系统（GIS）
   - 网络图和关系图

2. **AI增强**
   - GPT集成用于更智能的解析
   - 图像识别生成可视化
   - 语音输入支持

3. **协作功能**
   - 多用户实时协作
   - 版本控制和历史记录
   - 评论和标注系统

4. **导出和分享**
   - 多格式导出（PNG、SVG、PDF）
   - 交互式网页分享
   - 嵌入代码生成

### 贡献指南

欢迎贡献代码和建议：

1. Fork 项目仓库
2. 创建功能分支
3. 提交 Pull Request
4. 参与代码审查

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. 查看本文档的故障排除部分
2. 在GitHub上提交Issue
3. 联系开发团队

---

*本文档持续更新中，最新版本请访问项目仓库。*