import matplotlib.pyplot as plt
import numpy as np

plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows
# plt.rcParams['font.sans-serif'] = ['Microsoft YaHei']  # 另一种选择
# plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # macOS 常用
plt.rcParams['axes.unicode_minus'] = False

# Benford 定律公式
def benford_prob(d):
    return np.log10(1 + 1/d)

# 计算首位数 1-9 的概率
digits = np.arange(1, 10)
probs = benford_prob(digits)

# 设置中文字体（尝试常见字体）
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS']  
plt.rcParams['axes.unicode_minus'] = False  

# 绘制直方图
plt.figure(figsize=(8, 5))
plt.bar(digits, probs, tick_label=digits, color='skyblue', edgecolor='black')
plt.title("Benford 定律：首位数字分布", fontsize=14)
plt.xlabel("首位数字", fontsize=12)
plt.ylabel("概率", fontsize=12)
plt.grid(axis="y", linestyle="--", alpha=0.7)

# 显示数值标签
for x, y in zip(digits, probs):
    plt.text(x, y + 0.005, f"{y:.2f}", ha='center', fontsize=10)

plt.show()
