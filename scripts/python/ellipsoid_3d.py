import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D

# ============================================================
# 1. 定义椭球体参数
# ============================================================
# 设置椭球体的三个半径：a, b, c
# 接近于球体：a ≈ b ≈ c。如果 a > b 和 a > c，则为长轴椭球体
a = 1.0  # X轴半径
b = 1.5  # Y轴半径 (使它在Y轴上稍微拉长，形成椭球体感)
c = 1.0  # Z轴半径

print(f"椭球体参数: a={a}, b={b}, c={c}")

# ============================================================
# 2. 设置绘图环境
# ============================================================
fig = plt.figure(figsize=(12, 12))
ax = fig.add_subplot(111, projection='3d')

# 设置深蓝色背景，类似原图
ax.set_facecolor((0.05, 0.05, 0.15))
fig.patch.set_facecolor((0.05, 0.05, 0.15))

# ============================================================
# 3. 绘制经线 (Meridians) - 从北极到南极
# ============================================================
# 经度角（phi）：从 0 到 2π
phi_meridian = np.linspace(0, 2 * np.pi, 100)
# 选择几条经线进行绘制
num_meridians = 16
theta_values = np.linspace(0, np.pi, num_meridians, endpoint=False)

for i, theta in enumerate(theta_values):
    # 椭球体的参数方程：x = a * sin(theta) * cos(phi)
    # 对于经线，我们固定theta，变化phi
    x_m = a * np.sin(theta) * np.cos(phi_meridian)
    y_m = b * np.sin(theta) * np.sin(phi_meridian)
    z_m = c * np.cos(theta)

    # 颜色循环，模拟原图的彩色线条
    color = plt.cm.hsv(i / num_meridians)
    ax.plot(x_m, y_m, z_m, color=color, linewidth=1.5, alpha=0.8)

# ============================================================
# 4. 绘制纬线 (Parallels) - 环绕赤道
# ============================================================
# 纬度角（theta）：从 0 到 π
theta_parallel = np.linspace(0, np.pi, 50)
# 经度角（phi）：从 0 到 2π
phi_parallel = np.linspace(0, 2 * np.pi, 100)

# 循环绘制纬线 (环)
for i, theta in enumerate(theta_parallel):
    # 椭球体的参数方程
    x_p = a * np.sin(theta) * np.cos(phi_parallel)
    y_p = b * np.sin(theta) * np.sin(phi_parallel)
    z_p = c * np.cos(theta) * np.ones_like(phi_parallel)

    # 根据纬度赋予不同的颜色和线条样式
    if i % 4 == 0:
        # 主要纬线使用白色实线 (模拟原图中的主要结构线)
        line_style = '-'
        color = 'white'
        lw = 2
    elif i % 4 == 1:
        # 次要纬线使用彩色实线
        color = plt.cm.rainbow(i / len(theta_parallel))
        line_style = '-'
        lw = 1.5
    else:
        # 其他线使用白色虚线 (模拟原图中的点线/虚线)
        color = 'white'
        line_style = '--'
        lw = 0.8

    ax.plot(x_p, y_p, z_p, color=color, linewidth=lw, linestyle=line_style, alpha=0.9)

# ============================================================
# 5. 添加椭球体表面 (可选的半透明表面)
# ============================================================
# 创建完整的椭球体表面
u = np.linspace(0, 2 * np.pi, 50)  # phi (经度)
v = np.linspace(0, np.pi, 50)     # theta (纬度)

x_surface = a * np.outer(np.sin(v), np.cos(u))
y_surface = b * np.outer(np.sin(v), np.sin(u))
z_surface = c * np.outer(np.cos(v), np.ones(np.size(u)))

# 添加半透明表面
ax.plot_surface(x_surface, y_surface, z_surface,
                alpha=0.15, color='cyan',
                linewidth=0, antialiased=False)

# ============================================================
# 6. 设置视图角度和比例
# ============================================================
# 调整视角以获得最佳的3D效果
ax.view_init(elev=25, azim=45)

# 强制x, y, z轴的比例相等，以确保椭球体的形状不会失真
max_radius = max(a, b, c) * 1.2
ax.set_xlim([-max_radius, max_radius])
ax.set_ylim([-max_radius, max_radius])
ax.set_zlim([-max_radius, max_radius])

# 隐藏坐标轴刻度、标签和面板，以获得更干净的视觉效果
ax.set_box_on(False)
ax.set_xticks([])
ax.set_yticks([])
ax.set_zticks([])

# 隐藏坐标轴的边框线
ax.w_xaxis.line.set_color((1.0, 1.0, 1.0, 0.0))
ax.w_yaxis.line.set_color((1.0, 1.0, 1.0, 0.0))
ax.w_zaxis.line.set_color((1.0, 1.0, 1.0, 0.0))

# 设置标题和样式
plt.title("3D 椭球体线框模型\n(基础结构线 + 半透明表面)",
          color='white', fontsize=16, fontweight='bold', pad=20)

# 添加网格
ax.grid(True, alpha=0.3, color='gray', linestyle='--')

# ============================================================
# 7. 显示图像
# ============================================================
plt.tight_layout()
plt.show()

# 保存图像 (可选)
# plt.savefig('ellipsoid_3d.png', dpi=300, bbox_inches='tight',
#             facecolor=(0.05, 0.05, 0.15), edgecolor='none')