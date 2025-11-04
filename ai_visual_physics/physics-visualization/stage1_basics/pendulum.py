import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.animation import PillowWriter

# 加入中文支持
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False

def solve_pendulum(L, theta0, omega0, g, t_max=10):
    """
    实现单摆微分方程的数值解。
    参数:
        L (float): 摆长。
        theta0 (float): 初始角度（弧度）。
        omega0 (float): 初始角速度（rad/s）。
        g (float): 重力加速度。
        t_max (float): 模拟时间上限。
    返回:
        tuple: (t 数组, theta 数组)
    """
    def pendulum_ode(t, y):
        """
        单摆的微分方程组。
        y[0] = theta (角度)
        y[1] = omega (角速度)
        """
        theta, omega = y
        dtheta_dt = omega
        domega_dt = -(g / L) * np.sin(theta)
        return [dtheta_dt, domega_dt]

    # 初始条件
    y0 = [theta0, omega0]

    # 时间范围
    t_span = (0, t_max)
    t_eval = np.linspace(0, t_max, 500) # 评估时间点

    # 求解微分方程
    solution = solve_ivp(pendulum_ode, t_span, y0, t_eval=t_eval, rtol=1e-6, atol=1e-9)

    return solution.t, solution.y[0]

if __name__ == "__main__":
    # 参数设置
    L = 1.0  # 摆长 (米)
    g = 9.81 # 重力加速度 (m/s^2)
    theta0 = np.pi / 4  # 初始角度 (45度)
    omega0 = 0.0  # 初始角速度 (rad/s)
    t_max = 20  # 模拟时间 (秒)

    # 求解单摆运动
    t, theta = solve_pendulum(L, theta0, omega0, g, t_max)

    # 设置动画
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    fig.suptitle(f'单摆运动 (L={L:.2f}m, θ0={np.degrees(theta0):.2f}°, ω0={omega0:.2f}rad/s)')

    # 左侧子图：单摆运动
    ax1.set_xlim(-L * 1.2, L * 1.2)
    ax1.set_ylim(-L * 1.2, L * 1.2)
    ax1.set_aspect('equal', adjustable='box')
    ax1.set_title('单摆')
    ax1.grid(True)
    line, = ax1.plot([], [], 'k-', lw=2)  # 绳子
    ball, = ax1.plot([], [], 'o', color='blue', markersize=10) # 小球

    # 右侧子图：角度-时间曲线
    ax2.set_xlim(0, t_max)
    ax2.set_ylim(min(theta) * 1.1, max(theta) * 1.1)
    ax2.set_title('角度-时间曲线')
    ax2.set_xlabel('时间 (s)')
    ax2.set_ylabel('角度 (rad)')
    ax2.grid(True)
    theta_line, = ax2.plot([], [], 'r-', lw=2) # 角度曲线
    current_point, = ax2.plot([], [], 'ro', markersize=5) # 当前点

    def init():
        line.set_data([], [])
        ball.set_data([], [])
        theta_line.set_data([], [])
        current_point.set_data([], [])
        return line, ball, theta_line, current_point

    def update(frame):
        # 单摆位置
        x = L * np.sin(theta[frame])
        y = -L * np.cos(theta[frame])
        line.set_data([0, x], [0, y])
        ball.set_data([x], [y])

        # 角度-时间曲线
        theta_line.set_data(t[:frame], theta[:frame])
        current_point.set_data([t[frame]], [theta[frame]])

        # 动态标题
        fig.suptitle(f'单摆运动 (L={L:.2f}m, θ0={np.degrees(theta0):.2f}°, ω0={omega0:.2f}rad/s, Time={t[frame]:.2f}s)')

        return line, ball, theta_line, current_point

    ani = animation.FuncAnimation(fig, update, frames=len(t), init_func=init, blit=True, interval=1000/30) # 30 fps

    # 保存动画
    ani.save("pendulum.gif", writer=PillowWriter(fps=30))

    plt.show()
