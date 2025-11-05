import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np
from matplotlib.widgets import Slider, Button
import matplotlib as mpl

# --- Matplotlib 中文显示配置 ---
# 尝试设置中文字体，如果系统没有，可能需要手动安装或更改
# 例如：'SimHei' (Windows), 'WenQuanYi Micro Hei' (Linux), 'Heiti TC' (macOS)
mpl.rcParams['font.sans-serif'] = ['Arial Unicode MS'] # 适用于macOS的常见中文字体
mpl.rcParams['axes.unicode_minus'] = False # 解决负号显示问题

# --- 固定参数 ---
g = 9.8  # 重力加速度 (m/s^2)
fixed_xlim = (0, 100) # 固定水平坐标轴范围
fixed_ylim = (0, 50)  # 固定垂直坐标轴范围

# --- 初始可调参数 ---
initial_v0 = 10  # 初速度 (m/s)
initial_theta = 45 # 发射角度 (度)

# --- 全局变量用于存储动画对象和艺术家，以便更新 ---
fig, ax = plt.subplots(figsize=(10, 6))
line_full, = ax.plot([], [], 'r--', alpha=0.5, label='完整轨迹') # 完整轨迹
point, = ax.plot([], [], 'o', color='blue', markersize=8, label='运动小球') # 运动小球
current_animation = None # 用于存储当前的动画对象

def calculate_trajectory(v0, theta_degrees):
    """
    计算抛体运动的轨迹数据。
    :param v0: 初速度 (m/s)
    :param theta_degrees: 发射角度 (度)
    :return: 时间序列 t, 水平位移 x, 垂直位移 y
    """
    theta_radians = np.deg2rad(theta_degrees)
    
    # 计算水平和垂直方向的初速度分量
    vx = v0 * np.cos(theta_radians)
    vy = v0 * np.sin(theta_radians)

    # 计算飞行时间
    # 垂直方向速度变为0的时间是 vy / g，总飞行时间是其两倍
    t_flight = 2 * vy / g
    if t_flight < 0: # 确保飞行时间不为负
        t_flight = 0
    
    # 生成时间序列，用于计算轨迹点
    t = np.linspace(0, t_flight, 200)

    # 计算每个时间点的水平位移 (x) 和垂直位移 (y)
    x = vx * t
    y = vy * t - 0.5 * g * t**2
    
    # 确保y值不为负（即物体落地后不再计算负高度）
    y[y < 0] = 0 
    
    return t, x, y

def update_plot(v0_val, theta_val):
    """
    根据新的参数更新轨迹和动画。
    """
    global current_animation
    
    t, x, y = calculate_trajectory(v0_val, theta_val)

    # 更新完整轨迹线数据
    line_full.set_data(x, y)
    
    # 更新图表标题
    ax.set_title(f"抛体运动 (速度: {v0_val:.1f} m/s, 角度: {theta_val:.1f}°)")

    # 停止之前的动画（如果存在）
    if current_animation:
        current_animation.event_source.stop()
    
    # 动画更新函数
    def animate(i):
        point.set_data([x[i]], [y[i]])
        return point,

    # 创建新的动画
    current_animation = animation.FuncAnimation(
        fig, animate, frames=len(t), interval=50, blit=True, repeat=False
    )
    fig.canvas.draw_idle() # 重新绘制画布

def main():
    global fig, ax, line_full, point, current_animation

    # 设置坐标轴标签和固定范围
    ax.set_xlim(fixed_xlim)
    ax.set_ylim(fixed_ylim)
    ax.set_xlabel("水平距离 (m)")
    ax.set_ylabel("垂直距离 (m)")
    ax.grid(True)
    ax.legend()

    # 调整主图的底部空间，为滑块留出位置
    fig.subplots_adjust(left=0.1, bottom=0.35)

    # 创建滑块的轴
    ax_v0 = fig.add_axes((0.1, 0.2, 0.8, 0.03)) # [left, bottom, width, height]
    ax_theta = fig.add_axes((0.1, 0.15, 0.8, 0.03))

    # 创建滑块
    s_v0 = Slider(ax_v0, '初速度 (m/s)', 1.0, 30.0, valinit=initial_v0, valstep=0.1)
    s_theta = Slider(ax_theta, '发射角度 (度)', 0.0, 90.0, valinit=initial_theta, valstep=0.1)

    # 定义滑块更新函数
    def sliders_on_changed(val):
        update_plot(s_v0.val, s_theta.val)

    s_v0.on_changed(sliders_on_changed)
    s_theta.on_changed(sliders_on_changed)

    # 添加重置按钮
    reset_ax = fig.add_axes((0.8, 0.05, 0.1, 0.04))
    button = Button(reset_ax, '重置', hovercolor='0.975')

    def reset(event):
        s_v0.reset()
        s_theta.reset()
        # 重置后手动调用更新，因为reset()不会触发on_changed事件
        update_plot(initial_v0, initial_theta) 
    button.on_clicked(reset)

    # 初始绘制
    update_plot(initial_v0, initial_theta)

    plt.show()

    # 保存动画为mp4文件 (需要安装ffmpeg)
    # ani.save(f'projectile_interactive.mp4', writer='ffmpeg', fps=30)
    
    # 保存动画为gif文件 (需要安装imagemagick)
    ani.save(f'projectile_interactive.gif', writer='imagemagick', fps=30)
    print(f"交互式抛体运动模拟已启动。如需保存动画，请取消注释代码中的 ani.save 行。")

if __name__ == "__main__":
    main()
