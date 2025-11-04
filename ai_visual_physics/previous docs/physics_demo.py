import numpy as np
import matplotlib.pyplot as plt

# 时间序列
t = np.linspace(0, 10, 500)
A = 1.0     # 振幅
omega = 2*np.pi*0.5  # 角频率 (Hz=0.5)

# 简谐振动公式 y = A sin(ωt)
y = A * np.sin(omega * t)

# 绘制图像
plt.figure(figsize=(8, 4))
plt.plot(t, y, label='Simple Harmonic Motion')
plt.title("Physics Demo: Simple Harmonic Oscillator")
plt.xlabel("Time (s)")
plt.ylabel("Displacement")
plt.grid(True)
plt.legend()
plt.show()
