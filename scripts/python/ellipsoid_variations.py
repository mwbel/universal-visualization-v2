import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D

def create_ellipsoid_surface(a, b, c, resolution=50):
    """
    创建椭球体表面数据
    """
    u = np.linspace(0, 2 * np.pi, resolution)  # 经度
    v = np.linspace(0, np.pi, resolution)     # 纬度

    x = a * np.outer(np.sin(v), np.cos(u))
    y = b * np.outer(np.sin(v), np.sin(u))
    z = c * np.outer(np.cos(v), np.ones(np.size(u)))

    return x, y, z

def draw_ellipsoid_wireframe(ax, a, b, c, num_meridians=12, num_parallels=8, color_scheme='classic'):
    """
    绘制椭球体线框结构
    """
    # 经线 (Meridians) - 从北极到南极
    phi_meridian = np.linspace(0, 2 * np.pi, 100)
    theta_values = np.linspace(0, np.pi, num_meridians, endpoint=False)

    for i, theta in enumerate(theta_values):
        x_m = a * np.sin(theta) * np.cos(phi_meridian)
        y_m = b * np.sin(theta) * np.sin(phi_meridian)
        z_m = c * np.cos(theta)

        if color_scheme == 'classic':
            color = 'white'
            alpha = 0.8
            linewidth = 1.5
        elif color_scheme == 'rainbow':
            color = cm.rainbow(i / num_meridians)
            alpha = 0.9
            linewidth = 1.8
        elif color_scheme == 'depth':
            # 基于z值的深度着色
            z_normalized = (z_m - z_m.min()) / (z_m.max() - z_m.min())
            color = cm.coolwarm(z_normalized.mean())
            alpha = 0.7
            linewidth = 1.5

        ax.plot(x_m, y_m, z_m, color=color, alpha=alpha, linewidth=linewidth)

    # 纬线 (Parallels) - 环绕赤道
    theta_parallel = np.linspace(0, np.pi, 100)
    phi_parallel = np.linspace(0, 2 * np.pi, 100)

    for i, theta in enumerate(theta_parallel):
        x_p = a * np.sin(theta) * np.cos(phi_parallel)
        y_p = b * np.sin(theta) * np.sin(phi_parallel)
        z_p = c * np.cos(theta) * np.ones_like(phi_parallel)

        if color_scheme == 'classic':
            if i % 3 == 0:
                # 主要纬线
                line_style = '-'
                color = 'white'
                linewidth = 2.0
                alpha = 1.0
            else:
                # 次要纬线
                line_style = '--'
                color = 'lightgray'
                linewidth = 0.8
                alpha = 0.6
        elif color_scheme == 'rainbow':
            color = cm.rainbow(i / len(theta_parallel))
            line_style = '-'
            linewidth = 1.2
            alpha = 0.8
        elif color_scheme == 'depth':
            z_normalized = (z_p - z_p.min()) / (z_p.max() - z_p.min())
            color = cm.coolwarm(z_normalized.mean())
            line_style = '-'
            linewidth = 1.0
            alpha = 0.7

        ax.plot(x_p, y_p, z_p, color=color, alpha=alpha,
                linewidth=linewidth, linestyle=line_style)

def plot_multiple_ellipsoids():
    """
    绘制多种类型的椭球体对比
    """
    fig = plt.figure(figsize=(16, 12))

    # 设置深蓝色背景
    fig.patch.set_facecolor((0.05, 0.05, 0.15))

    # 1. 球体 (a = b = c)
    ax1 = fig.add_subplot(221, projection='3d')
    ax1.set_facecolor((0.05, 0.05, 0.15))
    draw_ellipsoid_wireframe(ax1, 1.0, 1.0, 1.0, color_scheme='rainbow')
    x1, y1, z1 = create_ellipsoid_surface(1.0, 1.0, 1.0, 30)
    ax1.plot_surface(x1, y1, z1, alpha=0.1, color='lightblue')
    ax1.set_title('球体\n(a = b = c)', color='white', fontsize=12, pad=10)
    ax1.view_init(elev=20, azim=45)

    # 2. 扁椭球体 (a = b > c)
    ax2 = fig.add_subplot(222, projection='3d')
    ax2.set_facecolor((0.05, 0.05, 0.15))
    draw_ellipsoid_wireframe(ax2, 1.0, 1.0, 0.7, color_scheme='rainbow')
    x2, y2, z2 = create_ellipsoid_surface(1.0, 1.0, 0.7, 30)
    ax2.plot_surface(x2, y2, z2, alpha=0.1, color='lightgreen')
    ax2.set_title('扁椭球体\n(a = b > c)', color='white', fontsize=12, pad=10)
    ax2.view_init(elev=20, azim=45)

    # 3. 长椭球体 (a > b = c)
    ax3 = fig.add_subplot(223, projection='3d')
    ax3.set_facecolor((0.05, 0.05, 0.15))
    draw_ellipsoid_wireframe(ax3, 1.5, 1.0, 1.0, color_scheme='rainbow')
    x3, y3, z3 = create_ellipsoid_surface(1.5, 1.0, 1.0, 30)
    ax3.plot_surface(x3, y3, z3, alpha=0.1, color='lightcoral')
    ax3.set_title('长椭球体\n(a > b = c)', color='white', fontsize=12, pad=10)
    ax3.view_init(elev=20, azim=45)

    # 4. 一般椭球体 (a ≠ b ≠ c)
    ax4 = fig.add_subplot(224, projection='3d')
    ax4.set_facecolor((0.05, 0.05, 0.15))
    draw_ellipsoid_wireframe(ax4, 1.2, 1.8, 0.9, color_scheme='rainbow')
    x4, y4, z4 = create_ellipsoid_surface(1.2, 1.8, 0.9, 30)
    ax4.plot_surface(x4, y4, z4, alpha=0.1, color='lightyellow')
    ax4.set_title('一般椭球体\n(a ≠ b ≠ c)', color='white', fontsize=12, pad=10)
    ax4.view_init(elev=20, azim=45)

    # 设置所有子图的属性
    for ax in [ax1, ax2, ax3, ax4]:
        max_radius = 2.0
        ax.set_xlim([-max_radius, max_radius])
        ax.set_ylim([-max_radius, max_radius])
        ax.set_zlim([-max_radius, max_radius])

        # 隐藏坐标轴
        ax.set_box_on(False)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_zticks([])

        # 隐藏边框线
        ax.w_xaxis.line.set_color((1.0, 1.0, 1.0, 0.0))
        ax.w_yaxis.line.set_color((1.0, 1.0, 1.0, 0.0))
        ax.w_zaxis.line.set_color((1.0, 1.0, 1.0, 0.0))

    plt.suptitle("3D 椭球体类型对比\n(线框模型 + 半透明表面)",
                 color='white', fontsize=16, fontweight='bold', y=0.95)

    plt.tight_layout()
    plt.show()

def plot_interactive_ellipsoid():
    """
    绘制交互式椭球体（可调整参数）
    """
    # 椭球体参数
    a, b, c = 1.0, 1.5, 1.0

    fig = plt.figure(figsize=(14, 10))
    fig.patch.set_facecolor((0.05, 0.05, 0.15))

    ax = fig.add_subplot(121, projection='3d')
    ax.set_facecolor((0.05, 0.05, 0.15))

    # 绘制椭球体
    draw_ellipsoid_wireframe(ax, a, b, c, num_meridians=16, num_parallels=10, color_scheme='depth')
    x, y, z = create_ellipsoid_surface(a, b, c, 40)
    ax.plot_surface(x, y, z, alpha=0.2, color='cyan',
                    linewidth=0.5, antialiased=False)

    ax.set_title(f'椭球体参数\na={a}, b={b}, c={c}',
                 color='white', fontsize=14, pad=20)

    # 信息面板
    ax2 = fig.add_subplot(122)
    ax2.axis('off')

    info_text = f"""
    椭球体方程:
    (x/a)² + (y/b)² + (z/c)² = 1

    当前参数:
    • a = {a} (X轴半径)
    • b = {b} (Y轴半径)
    • c = {c} (Z轴半径)

    特征分析:
    • 表面积: {4*np.pi*((a*b)**1.6 + (a*c)**1.6 + (b*c)**1.6)/3:.2f}
    • 体积: {4/3*np.pi*a*b*c:.2f}
    • 偏心率: {np.sqrt(1-(min(a,b,c)/max(a,b,c))**2):.3f}

    类型分类:
    • 球体: a ≈ b ≈ c
    • 扁椭球体: a = b > c
    • 长椭球体: a > b = c
    • 一般椭球体: a ≠ b ≠ c
    """

    ax2.text(0.1, 0.5, info_text, transform=ax2.transAxes,
              fontsize=11, color='white', verticalalignment='center',
              fontfamily='monospace',
              bbox=dict(boxstyle="round,pad=0.5",
                       facecolor=(0.1, 0.1, 0.2),
                       edgecolor='white',
                       alpha=0.8))

    ax.view_init(elev=25, azim=45)
    ax.set_xlim([-2, 2])
    ax.set_ylim([-2, 2])
    ax.set_zlim([-2, 2])

    # 隐藏坐标轴
    ax.set_box_on(False)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_zticks([])

    plt.suptitle("3D 椭球体可视化",
                 color='white', fontsize=18, fontweight='bold', y=0.95)

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    print("选择绘制模式:")
    print("1. 多种椭球体对比")
    print("2. 单个详细椭球体")

    choice = input("请输入选择 (1 或 2): ").strip()

    if choice == "1":
        plot_multiple_ellipsoids()
    elif choice == "2":
        plot_interactive_ellipsoid()
    else:
        print("无效选择，运行默认模式...")
        plot_multiple_ellipsoids()