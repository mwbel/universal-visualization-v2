# 共享模块目录

这个目录包含可被多个父项目引用的共享模块。

## 📦 已有模块

### probability_statistics (概率论与数理统计)
- **版本**: 3.0.0
- **类型**: 可插拔模块
- **大小**: 5.5MB
- **内容**: 43个可视化页面 + 知识导航系统

**引用项目**:
- ✅ 万物可视化 (main-app)
- ✅ 期末速通 (期末速通)

**文档**: [probability_statistics/README.md](./probability_statistics/README.md)

---

## 🎯 共享模块设计原则

### 1. 单一数据源
- 每个模块只维护一份代码
- 避免重复和不一致

### 2. 可插拔架构
- 模块可以被多个父项目引用
- 通过适配器适配不同环境

### 3. 独立性
- 模块可以独立开发和测试
- 不依赖特定父项目

### 4. 版本管理
- 每个模块有独立的版本号
- 支持语义化版本控制

---

## 📂 模块结构规范

```
module_name/
├── core/                   # 核心内容
│   ├── pages/             # 页面文件
│   ├── lib/               # 库文件
│   ├── assets/            # 资源文件
│   └── data/              # 数据文件
├── adapters/              # 适配器
│   ├── adapter-interface.js
│   └── [parent]-adapter.js
├── config/                # 配置
├── docs/                  # 文档
├── module.json            # 模块元数据
└── README.md              # 模块说明
```

---

## 🔧 如何创建新模块

### 1. 创建模块目录
```bash
mkdir -p shared-modules/your_module/{core,adapters,config,docs}
```

### 2. 创建 module.json
```json
{
  "name": "your_module",
  "version": "1.0.0",
  "displayName": "模块显示名称",
  "type": "pluggable-module",
  "exports": {
    "pages": "./core/pages",
    "lib": "./core/lib"
  },
  "adapters": {
    "main-app": "./adapters/main-app-adapter.js"
  }
}
```

### 3. 实现适配器
继承 `ModuleAdapter` 接口，实现必要的方法。

### 4. 在父项目中引用
创建 `module-ref.json` 配置文件，指向共享模块。

---

## 📖 参考文档

- [模块化架构设计.md](../模块化架构设计.md)
- [可插拔模块整合完成报告.md](../可插拔模块整合完成报告.md)

---

**创建日期**: 2026年3月17日
