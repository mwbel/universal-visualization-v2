import numpy as np
import matplotlib.pyplot as plt
#import matplotlib as mpl
#mpl.rc_file("matplotlibrc")  # 指向你的配置文件

# 设置字体（macOS 推荐用苹方/华文黑体，Windows 推荐 SimHei）
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # 或 ['PingFang SC', 'Heiti TC', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False  # 正常显示负号

n = 1000  # 抛硬币次数
results = np.random.randint(0, 2, n)  # 0=反, 1=正
freq = np.cumsum(results) / np.arange(1, n+1)

# 图名
plt.title("抛硬币实验")

plt.plot(freq)
plt.axhline(0.5, color='r', linestyle='--', label="理论概率")
plt.xlabel("试验次数")
plt.ylabel("频率")
plt.legend()
plt.show()