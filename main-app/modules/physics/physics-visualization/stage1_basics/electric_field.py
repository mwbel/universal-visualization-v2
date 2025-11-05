import numpy as np
import matplotlib.pyplot as plt

def electric_field_lines(q1_pos, q2_pos, q1_charge, q2_charge, num_lines=20, field_strength_scale=0.1):
    """
    绘制两个点电荷的电场场线分布图。
    :param q1_pos: 第一个点电荷的位置 (x, y)
    :param q2_pos: 第二个点电荷的位置 (x, y)
    :param q1_charge: 第一个点电荷的电荷量
    :param q2_charge: 第二个点电荷的电荷量
    :param num_lines: 每种电荷绘制的场线数量
    :param field_strength_scale: 场线箭头长度的缩放因子
    """
    k = 8.9875e9 # 库仑常数

    # 定义电场函数
    def E_field(x, y):
        rx1, ry1 = x - q1_pos[0], y - q1_pos[1]
        r1 = np.sqrt(rx1**2 + ry1**2)
        Ex1, Ey1 = k * q1_charge * rx1 / r1**3, k * q1_charge * ry1 / r1**3

        rx2, ry2 = x - q2_pos[0], y - q2_pos[1]
        r2 = np.sqrt(rx2**2 + ry2**2)
        Ex2, Ey2 = k * q2_charge * rx2 / r2**3, k * q2_charge * ry2 / r2**3
        
        # 避免在电荷位置处出现无穷大
        if r1 == 0: Ex1, Ey1 = 0, 0
        if r2 == 0: Ex2, Ey2 = 0, 0

        return Ex1 + Ex2, Ey1 + Ey2

    # 创建网格
    x_min = min(q1_pos[0], q2_pos[0]) - 2
    x_max = max(q1_pos[0], q2_pos[0]) + 2
    y_min = min(q1_pos[1], q2_pos[1]) - 2
    y_max = max(q1_pos[1], q2_pos[1]) + 2

    Y, X = np.mgrid[y_min:y_max:100j, x_min:x_max:100j]
    U, V = E_field(X, Y)
    
    # 归一化电场强度用于绘制箭头
    magnitude = np.sqrt(U**2 + V**2)
    U_norm, V_norm = U / magnitude, V / magnitude
    
    fig, ax = plt.subplots(figsize=(8, 8))

    # 绘制电荷
    ax.plot(q1_pos[0], q1_pos[1], 'o', color='red' if q1_charge > 0 else 'blue', markersize=10, label=f'Q1 ({q1_charge}C)')
    ax.plot(q2_pos[0], q2_pos[1], 'o', color='red' if q2_charge > 0 else 'blue', markersize=10, label=f'Q2 ({q2_charge}C)')

    # 绘制电场线 (使用 streamplot)
    ax.streamplot(X, Y, U, V, color=magnitude, cmap='viridis', linewidth=1, density=2, arrowstyle='->', arrowsize=1.5)

    ax.set_xlabel("X 坐标 (m)")
    ax.set_ylabel("Y 坐标 (m)")
    ax.set_title("电场场线分布")
    ax.set_aspect('equal', adjustable='box')
    ax.grid(True)
    ax.legend()
    plt.show()

if __name__ == "__main__":
    # 示例：一个正电荷和一个负电荷
    electric_field_lines(q1_pos=(-1, 0), q2_pos=(1, 0), q1_charge=1e-9, q2_charge=-1e-9)

    # 示例：两个正电荷
    # electric_field_lines(q1_pos=(-1, 0), q2_pos=(1, 0), q1_charge=1e-9, q2_charge=1e-9)
