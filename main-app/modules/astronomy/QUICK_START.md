# 🚀 Python天文可视化快速启动指南

## ✅ 当前状态
Python API服务器已经成功启动并运行在 `http://localhost:5001`！

## 📋 启动步骤

### 1. 确保API服务器运行
API服务器应该已经在后台运行。如果需要重新启动：

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/astronomy
./start_api_server.sh
```

### 2. 确保Web服务器运行
在另一个终端启动Web服务器：

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/astronomy/original
python3 -m http.server 8080
```

### 3. 访问页面
- **Python月相可视化**: http://localhost:8080/python_moon_phase.html
- **天文模块主页**: http://localhost:8080/index.html
- **API文档**: http://localhost:5001

## 🌟 功能特色

### Python月相可视化
- ✅ **高精度计算** - 基于Skyfield天文库
- ✅ **双重视图** - 月相圆盘 + 轨道系统
- ✅ **实时交互** - 年份选择、日期滑块、自动播放
- ✅ **准确数据** - 考虑闰年、月相周期

### API接口
- `GET /status` - 服务器状态检查
- `GET /moon-phases` - 月相信息
- `GET /moon-phases-plot` - 月相可视化数据

## 🔧 故障排除

### 如果页面显示"❌ Python API服务器未连接"
1. 检查API服务器是否在运行：
   ```bash
   curl http://localhost:5001/status
   ```
2. 如果没有响应，重新启动API服务器：
   ```bash
   cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/astronomy
   ./start_api_server.sh
   ```

### 如果依赖库问题
```bash
pip3 install flask flask-cors numpy plotly skyfield
```

## 📝 使用说明

1. **选择年份** - 使用年份选择器选择要查看的年份
2. **调整日期** - 拖动日期滑块查看不同日期的月相
3. **自动播放** - 点击播放按钮观看月相变化动画
4. **查看信息** - 底部显示详细的月相数据

## 🎯 测试

访问以下链接确认一切正常：
- http://localhost:5001/status - API状态
- http://localhost:8080/python_moon_phase.html - 月相可视化

---

**状态**: ✅ 已就绪
**最后更新**: 2025-12-12