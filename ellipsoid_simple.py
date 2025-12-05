import numpy as np
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端，避免PIL问题
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# ============================================================
# 1. 定义椭球体参数
# ============================================================
a = 1.0  # X轴半径
b = 1.5  # Y轴半径 (拉长)
c = 1.0  # Z轴半径

print(f"椭球体参数: a={a}, b={b}, c={c}")

# ============================================================
# 2. 创建椭球体表面数据
# ============================================================
u = np.linspace(0, 2 * np.pi, 50)  # 经度 (phi)
v = np.linspace(0, np.pi, 25)     # 纬度 (theta)

x = a * np.outer(np.sin(v), np.cos(u))
y = b * np.outer(np.sin(v), np.sin(u))
z = c * np.outer(np.cos(v), np.ones(np.size(u)))

# ============================================================
# 3. 设置绘图
# ============================================================
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

# 绘制表面
surf = ax.plot_surface(x, y, z,
                     alpha=0.7,
                     linewidth=0.2,
                     antialiased=True,
                     rstride=1,
                     cstride=1,
                     cmap='viridis')

# ============================================================
# 4. 绘制线框结构
# ============================================================
# 经线
num_meridians = 12
phi_lines = np.linspace(0, 2 * np.pi, num_meridians)
for phi in phi_lines:
    x_m = a * np.cos(phi) * np.sin(v)
    y_m = b * np.sin(phi) * np.sin(v)
    z_m = c * np.cos(v)
    ax.plot(x_m, y_m, z_m, color='white', linewidth=1.0, alpha=0.8)

# 纬线
num_parallels = 8
theta_lines = np.linspace(0, np.pi, num_parallels)
for theta in theta_lines:
    x_p = a * np.sin(theta) * np.cos(u)
    y_p = b * np.sin(theta) * np.sin(u)
    z_p = c * np.cos(theta) * np.ones(np.size(u))
    ax.plot(x_p, y_p, z_p, color='lightblue', linewidth=0.8, alpha=0.6)

# ============================================================
# 5. 设置视角和样式
# ============================================================
# 设置视角
ax.view_init(elev=25, azim=45)

# 设置坐标轴范围
max_radius = max(a, b, c) * 1.1
ax.set_xlim([-max_radius, max_radius])
ax.set_ylim([-max_radius, max_radius])
ax.set_zlim([-max_radius, max_radius])

# 设置标签
ax.set_xlabel('X轴', fontsize=12)
ax.set_ylabel('Y轴', fontsize=12)
ax.set_zlabel('Z轴', fontsize=12)

# 设置网格
ax.grid(True, alpha=0.3)

# 设置标题
ax.set_title('3D 椭球体\n线框 + 表面', fontsize=14, fontweight='bold', pad=20)

# 设置背景颜色
ax.xaxis.pane.fill = False
ax.yaxis.pane.fill = False
ax.zaxis.pane.fill = False

# ============================================================
# 6. 保存图像
# ============================================================
plt.tight_layout()
plt.savefig('ellipsoid_3d_simple.png',
            dpi=300,
            bbox_inches='tight',
            facecolor='black',
            edgecolor='white')

print("椭球体图像已保存为 'ellipsoid_3d_simple.png'")
print(f"椭球体特征:")
print(f"  类型: {'长椭球体' if a > b and a > c else '扁椭球体' if b > a and b > c else '一般椭球体'}")
print(f"  表面积: {4*np.pi*((a*b)**1.6 + (a*c)**1.6 + (b*c)**1.6)/3:.2f}")
print(f"  体积: {4/3*np.pi*a*b*c:.2f}")
print(f"  偏心率: {np.sqrt(1-(min(a,b,c)/max(a,b,c))**2):.3f}")

# 尝试显示（可能失败，但至少保存了图像）
try:
    plt.show()
    print("图像显示成功")
except Exception as e:
    print(f"图像显示失败: {e}")
    print("请查看保存的PNG文件")