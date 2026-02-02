# 项目文件整理报告

## 📊 整理统计

**整理时间**: 2026-02-02
**整理文件数**: 99 个

---

## ✅ 整理结果

### 📜 Python 脚本 (25 个)
位置: `scripts/python/`

包含:
- demo 脚本 (demo_*.py)
- 测试脚本 (test_*.py)
- 工具脚本 (check_*.py, verify_*.py)
- OCR 相关脚本 (extract_toc*.py, use_mineru*.py)
- 可视化脚本 (ellipsoid*.py)

### 🐚 Shell 脚本 (15 个)
位置: `scripts/shell/`

包含:
- 部署脚本 (deploy*.sh)
- 安装脚本 (install_*.sh)
- 导出脚本 (export_pdf*.sh)
- 配置脚本 (setup_*.sh, fix_*.sh)
- 快速启动脚本 (quick*.sh)

### 🌐 HTML 测试文件 (18 个)
位置: `tests/frontend/`

包含:
- 可视化测试页面
- 调试页面 (debug-*.html)
- 功能测试页面
- 主页变体 (main-app*.html)

### 📖 指南文档 (16 个)
位置: `docs/guides/`

包含:
- API 测试指南
- Docker 安装指南
- Linux 部署指南
- GLM 使用指南
- VS Code 远程指南
- 离线版/在线版说明

### 📊 报告文档 (15 个)
位置: `docs/reports/`

包含:
- 测试报告
- 对比分析
- 竞品分析
- 版本对比
- 功能改进说明

### 🔌 API 文档 (4 个)
位置: `docs/api/`

包含:
- API 端点列表
- API 测试指南
- 实际端点对照表

### 📸 截图 (6 个)
位置: `screenshots/`

包含:
- 各时期的项目截图

---

## 📁 新建文件夹结构

```
AlVisualization/
├── scripts/
│   ├── python/          # Python 工具脚本
│   └── shell/           # Shell 部署脚本
├── tests/
│   └── frontend/        # HTML 测试文件
├── docs/
│   ├── guides/          # 使用指南
│   ├── reports/         # 测试报告
│   └── api/             # API 文档
├── screenshots/         # 截图文件
└── archive/
    └── zip/             # 压缩包
```

---

## 🎯 整理效果

### 整理前
- 根目录有 100+ 个零散文件
- 难以找到需要的文件
- 文档混杂在一起

### 整理后
- ✅ 99 个文件已分类
- ✅ 文件按类型组织
- ✅ 清晰的目录结构
- ✅ 易于查找和维护

---

## 📝 注意事项

### 需要更新路径的文件

如果某些脚本引用了被移动的文件，需要更新路径：

1. **导入语句**: Python 脚本中的 import 路径
2. **HTML 引用**: HTML 文件中的资源路径
3. **文档链接**: Markdown 文档中的相对链接

### 示例

```python
# 之前
from demo_textbook_simple import process

# 之后
from scripts.python.demo_textbook_simple import process
```

---

## 🚀 下一步建议

1. **测试关键脚本**
   - 确保移动后的脚本仍能正常运行
   - 更新必要的路径引用

2. **更新文档**
   - 更新 README 中的文件路径
   - 更新文档中的相对链接

3. **提交到 Git**
   ```bash
   git add .
   git commit -m "chore: 整理项目文件结构，分类 99 个文件到对应文件夹"
   git push origin main
   ```

---

## 📂 保留在根目录的文件

以下文件保留在根目录未移动：

- **配置文件**: `.env`, `.env.example`, `.gitignore`
- **项目说明**: `CLAUDE.md`, `CLINE.md`, `CODEBUDDY.md`
- **主要目录**: `backend-v2/`, `main-app/`, `期末速通/`, 等
- **核心模块**: `skills/`, `examples/`, `textbook-processor/`

---

**整理完成! 🎉**

项目现在更加整洁有序了！
