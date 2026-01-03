# GLM-4.6 快速测试指南

## 步骤 1: 设置 API 密钥

### 方式 A: 临时设置（推荐用于快速测试）

在终端运行：
```bash
export ZHIPU_API_KEY=你的密钥
```

然后运行测试：
```bash
python test_glm_animation.py
```

### 方式 B: 创建 .env 文件（推荐用于长期使用）

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，填入你的密钥
# 将这行：ZHIPU_API_KEY=your_zhipu_api_key_here
# 改为：ZHIPU_API_KEY=你的实际密钥
```

然后运行测试：
```bash
python test_glm_animation.py
```

## 步骤 2: 运行测试

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization
python test_glm_animation.py
```

## 测试内容

测试脚本会依次执行：

1. **测试 1: API 连接**
   - 验证密钥是否有效
   - 测试基本连接

2. **测试 2: 简单代码生成**
   - 生成一个简单的圆形动画
   - 验证 Manim 代码生成能力

3. **测试 3: 从术语生成动画**
   - 使用你的术语表中的"正弦"
   - 生成完整的教学动画
   - 包含代码和场景说明

## 预期输出

成功后会在 `output/test_animations/` 目录生成：
- `test_circle.py` - 圆形动画代码
- `sine_animation.py` - 正弦动画代码
- `sine_generation_result.md` - 完整生成结果

## 成本估算

整个测试约消耗：
- GLM-4-Flash: ~500 tokens
- GLM-4-Air: ~1500 tokens
- **总成本**: ¥0.001-0.002（不到 1 分钱！）

## 下一步

如果测试成功：
1. ✅ 查看 `output/test_animations/` 生成的代码
2. ✅ 如果安装了 Manim，运行代码看效果
3. ✅ 批量生成第1章术语动画

如果需要安装 Manim：
```bash
conda create -n manim-env python=3.9
conda activate manim-env
pip install manim
```

## 常见问题

**Q: 提示 "未找到 ZHIPU_API_KEY"**
A: 请先运行 `export ZHIPU_API_KEY=你的密钥`

**Q: API 连接失败**
A: 检查密钥是否正确，网络是否正常

**Q: 生成的代码有语法错误**
A: 这是正常的，我们可以添加代码验证和自动修复功能
