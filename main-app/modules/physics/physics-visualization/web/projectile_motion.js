// Geogebra Classic 5 全局脚本，演示物体平抛运动

// 初始化 Geogebra 应用
var ggbApplet;

function ggbOnInit(appletID) {
    ggbApplet = document.getElementById(appletID);
    initializeSimulation();
}

function initializeSimulation() {
    // 清除所有旧对象
    ggbApplet.evalCommand("ClearAll()");

    // 创建可调节参数
    // 平台高度 h
    ggbApplet.evalCommand("h = 5");
    ggbApplet.evalCommand("SetFixed(h, false, false)"); // 允许用户拖动滑块
    ggbApplet.evalCommand("SetVisibleInView(h, 1, true)"); // 在代数区显示
    ggbApplet.evalCommand("SetCaption(h, \"平台高度\")");
    ggbApplet.evalCommand("SetAnimating(h, false)");
    ggbApplet.evalCommand("SetSlider(h, 0.1, 10, 0.1)");

    // 初始速度 v0
    ggbApplet.evalCommand("v0 = 5");
    ggbApplet.evalCommand("SetFixed(v0, false, false)");
    ggbApplet.evalCommand("SetVisibleInView(v0, 1, true)");
    ggbApplet.evalCommand("SetCaption(v0, \"初始速度\")");
    ggbApplet.evalCommand("SetAnimating(v0, false)");
    ggbApplet.evalCommand("SetSlider(v0, 0.1, 10, 0.1)");

    // 重力加速度 g (常量)
    ggbApplet.evalCommand("g = 9.8");
    ggbApplet.evalCommand("SetFixed(g, true, false)"); // 固定值，不可更改
    ggbApplet.evalCommand("SetVisibleInView(g, 1, true)");
    ggbApplet.evalCommand("SetCaption(g, \"重力加速度\")");

    // 计算运动时间 t_flight
    ggbApplet.evalCommand("t_flight = sqrt(2 * h / g)");
    ggbApplet.evalCommand("SetVisibleInView(t_flight, 1, true)");
    ggbApplet.evalCommand("SetCaption(t_flight, \"运动时间\")");

    // 定义时间变量 t，用于动画
    ggbApplet.evalCommand("t = 0");
    ggbApplet.evalCommand("SetFixed(t, false, false)");
    ggbApplet.evalCommand("SetVisibleInView(t, 1, false)"); // 不在代数区显示
    ggbApplet.evalCommand("SetAnimating(t, true)");
    ggbApplet.evalCommand("SetAnimationSpeed(t, 0.05)");
    ggbApplet.evalCommand("SetSlider(t, 0, t_flight, 0.01)");

    // 定义物体位置 (x, y)
    ggbApplet.evalCommand("X(t) = v0 * t");
    ggbApplet.evalCommand("Y(t) = h - 0.5 * g * t^2");
    ggbApplet.evalCommand("P = (X(t), Y(t))");
    ggbApplet.evalCommand("SetPointSize(P, 5)");
    ggbApplet.evalCommand("SetPointStyle(P, 1)"); // 圆点
    ggbApplet.evalCommand("SetColor(P, 0, 0, 255)"); // 蓝色

    // 显示运动轨迹
    ggbApplet.evalCommand("Trajectory = Curve(v0 * k, h - 0.5 * g * k^2, k, 0, t_flight)");
    ggbApplet.evalCommand("SetColor(Trajectory, 255, 0, 0)"); // 红色轨迹
    ggbApplet.evalCommand("SetLineThickness(Trajectory, 5)");

    // 显示平台
    ggbApplet.evalCommand("Platform = Segment((-1, h), (0, h))");
    ggbApplet.evalCommand("SetColor(Platform, 0, 128, 0)"); // 绿色平台
    ggbApplet.evalCommand("SetLineThickness(Platform, 7)");

    // 显示运动时间文本
    ggbApplet.evalCommand("TimeText = Text(\"运动时间: \" + Round(t_flight, 2) + \" s\", (v0 * t_flight / 2, h / 2))");
    ggbApplet.evalCommand("SetColor(TimeText, 0, 0, 0)"); // 黑色文本
    ggbApplet.evalCommand("SetFixed(TimeText, true, false)");

    // 监听参数变化，更新动画和文本
    ggbApplet.registerObjectUpdateListener("h", "updateSimulation");
    ggbApplet.registerObjectUpdateListener("v0", "updateSimulation");
    ggbApplet.registerObjectUpdateListener("t_flight", "updateTimeText");

    // 启动动画
    ggbApplet.startAnimation();
}

function updateSimulation() {
    // 更新运动时间
    ggbApplet.evalCommand("t_flight = sqrt(2 * h / g)");
    // 重置时间变量 t 的范围
    ggbApplet.evalCommand("SetSlider(t, 0, t_flight, 0.01)");
    // 重置动画
    ggbApplet.stopAnimation();
    ggbApplet.setValue("t", 0);
    ggbApplet.startAnimation();
    updateTimeText();
}

function updateTimeText() {
    var flightTime = ggbApplet.getValue("t_flight");
    ggbApplet.evalCommand("TimeText = Text(\"运动时间: \" + Round(t_flight, 2) + \" s\", (v0 * t_flight / 2, h / 2))");
}
