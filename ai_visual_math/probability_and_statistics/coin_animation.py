import matplotlib.pyplot as plt
import numpy as np
from matplotlib.widgets import Button
from matplotlib.gridspec import GridSpec

# --- 1. 数据初始化 ---
# 存储每次抛硬币的结果 (0=反面, 1=正面)
flips = []
# 记录正面朝上的总次数
heads_count = 0
# 记录总的实验次数
trial_count = 0
# 存储每次实验后累计正面朝上的频率
cumulative_heads_frequency = []

# --- 2. 设置 Matplotlib 图形和布局 ---
fig = plt.figure(figsize=(10, 6)) # 创建一个图形对象，设置大小
# 使用 GridSpec 定义左右两栏布局
# gs[0, 0] 是左栏，gs[0, 1] 是右栏
gs = GridSpec(1, 2, figure=fig, width_ratios=[1, 3]) 

# 左栏：按钮和文本显示
ax_button = fig.add_subplot(gs[0, 0])
ax_button.set_axis_off() # 隐藏坐标轴，因为这里只放置按钮和文本

# 右栏：图表
ax_plot = fig.add_subplot(gs[0, 1])

# --- 3. 按钮和文本显示 ---
# 在左侧 Axes 上创建一个按钮
button_ax = plt.axes((0.1, 0.8, 0.15, 0.075)) # [left, bottom, width, height]
button = Button(button_ax, '抛硬币')

# 初始化一个文本对象，用于显示最近一次抛硬币的结果
# 位置 (0.5, 0.6) 是在 ax_button 坐标系中的相对位置
result_text = ax_button.text(0.5, 0.6, '点击按钮开始抛硬币', 
                             horizontalalignment='center', 
                             verticalalignment='center', 
                             fontsize=12, 
                             transform=ax_button.transAxes)

# --- 4. 图表设置 ---
# 绘制理论概率 0.5 的红色虚线
ax_plot.axhline(0.5, color='red', linestyle='--', label='理论概率 (0.5)')

# 初始化一条蓝色的空折线，用于显示累计正面频率
# line 对象将用于后续动态更新数据
line, = ax_plot.plot([], [], 'b-', label='累计正面频率')

# 设置图表标题和轴标签
ax_plot.set_title('抛硬币实验：正面频率随实验次数的变化')
ax_plot.set_xlabel('实验次数')
ax_plot.set_ylabel('正面频率')
ax_plot.set_ylim(0, 1) # 设置 Y 轴范围为 0 到 1
ax_plot.legend() # 显示图例
ax_plot.grid(True) # 显示网格

# --- 5. 定义按钮回调函数 ---
def on_button_click(event):
    global heads_count, trial_count

    # 模拟一次抛硬币 (0=反面, 1=正面)
    flip_result = np.random.randint(0, 2)
    flips.append(flip_result)

    # 更新实验次数和正面计数
    trial_count += 1
    if flip_result == 1:
        heads_count += 1

    # 更新最近一次抛硬币的结果文本
    if flip_result == 1:
        result_text.set_text(f'最近一次: 正面\n总次数: {trial_count}\n正面次数: {heads_count}')
    else:
        result_text.set_text(f'最近一次: 反面\n总次数: {trial_count}\n正面次数: {heads_count}')

    # 计算当前的累计正面频率
    current_frequency = heads_count / trial_count
    cumulative_heads_frequency.append(current_frequency)

    # 更新蓝色折线的数据
    x_data = np.arange(1, trial_count + 1) # 实验次数从 1 开始
    y_data = np.array(cumulative_heads_frequency)
    line.set_data(x_data, y_data)

    # 动态调整图表的 X 轴范围，确保所有数据点都可见
    ax_plot.set_xlim(0, trial_count + 1) 
    
    # 刷新图表
    fig.canvas.draw_idle()

# --- 6. 连接按钮和回调函数 ---
button.on_clicked(on_button_click)

# --- 7. 显示图表 ---
plt.tight_layout(rect=(0.2, 0, 1, 1)) # 调整布局，为左侧按钮留出空间
plt.show()
