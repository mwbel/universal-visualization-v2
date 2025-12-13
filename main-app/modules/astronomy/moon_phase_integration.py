#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
月相可视化集成模块
基于 sun_earth_moon_phase_slider.v6 版本
"""

import numpy as np
import plotly.graph_objects as go
import plotly.utils
from datetime import datetime, timedelta
from skyfield.api import load
from calendar import isleap
from scipy.ndimage import map_coordinates
import json
import os

class MoonPhaseVisualizer:
    """月相可视化类"""

    def __init__(self):
        self.ts = load.timescale()
        self.eph = None
        self.moon_texture = None
        self.initialize_data()

    def initialize_data(self):
        """初始化天文数据和月球纹理"""
        try:
            # 加载星历数据
            self.eph = load('de421.bsp')
            self.sun, self.earth, self.moon = self.eph['sun'], self.eph['earth'], self.eph['moon']

            # 尝试加载月球纹理
            texture_path = os.path.join(os.path.dirname(__file__), 'src', 'moon_texture_map.tif')
            if os.path.exists(texture_path):
                from PIL import Image
                moon_texture_img = Image.open(texture_path).convert("L")
                self.moon_texture = np.array(moon_texture_img) / 255.0
                print("✅ 月球纹理加载成功")
            else:
                print("⚠️ 月球纹理文件未找到，使用简化渲染")
                self.moon_texture = None

            return True
        except Exception as e:
            print(f"❌ 月相可视化初始化失败: {e}")
            return False

    def unit(self, v):
        """单位向量"""
        v = np.asarray(v, dtype=float)
        n = np.linalg.norm(v)
        if n < 1e-12:
            return v * 0.0
        return v / n

    def earth_helio(self, t):
        """地球相对太阳的位置（AU）"""
        return self.sun.at(t).observe(self.earth).position.au

    def moon_geo(self, t):
        """月亮相对地球的位置（AU）"""
        return self.earth.at(t).observe(self.moon).position.au

    def calculate_moon_phase(self, year, day):
        """计算指定日期的月相"""
        try:
            t = self.ts.utc(year, 1, 1) + timedelta(days=day-1)

            # 获取位置
            earth_pos = self.earth_helio(t)
            moon_geo_pos = self.moon_geo(t)

            # 计算相位角
            earth_to_moon = self.unit(moon_geo_pos)
            sun_to_earth = self.unit(earth_pos)

            # 月相角度 (0-360度)
            phase_angle = np.arccos(np.clip(np.dot(earth_to_moon, sun_to_earth), -1, 1))
            phase_degrees = np.degrees(phase_angle)

            # 月相照明比例
            illumination = (1 + np.cos(phase_angle)) / 2

            return {
                'phase_angle': phase_degrees,
                'illumination': illumination,
                'phase_name': self.get_phase_name(phase_degrees),
                'earth_position': earth_pos.tolist(),
                'moon_position': moon_geo_pos.tolist()
            }
        except Exception as e:
            print(f"计算月相失败: {e}")
            return None

    def get_phase_name(self, phase_degrees):
        """根据相位角获取月相名称"""
        phase = phase_degrees / 360  # 归一化到0-1

        if phase < 0.03 or phase > 0.97:
            return "新月 🌑"
        elif 0.03 <= phase < 0.22:
            return "蛾眉月 🌒"
        elif 0.22 <= phase < 0.28:
            return "上弦月 🌓"
        elif 0.28 <= phase < 0.47:
            return "盈凸月 🌔"
        elif 0.47 <= phase < 0.53:
            return "满月 🌕"
        elif 0.53 <= phase < 0.72:
            return "亏凸月 🌖"
        elif 0.72 <= phase < 0.78:
            return "下弦月 🌗"
        else:
            return "残月 🌘"

    def create_moon_disc_visualization(self, year, day):
        """创建月相2D圆盘可视化"""
        try:
            moon_data = self.calculate_moon_phase(year, day)
            if not moon_data:
                return None

            phase_angle = np.radians(moon_data['phase_angle'])
            resolution = 256

            # 创建坐标系
            x = np.linspace(-1, 1, resolution)
            y = np.linspace(-1, 1, resolution)
            X, Y = np.meshgrid(x, y)

            # 月球圆盘
            R = np.sqrt(X**2 + Y**2)
            moon_mask = R <= 1

            # 计算照明边界
            illumination = np.zeros_like(R)

            # 简化的月相计算
            terminator_x = np.cos(phase_angle)
            for i in range(resolution):
                for j in range(resolution):
                    if moon_mask[i, j]:
                        # 根据相位角计算照明
                        if X[i, j] <= terminator_x:
                            illumination[i, j] = 1.0
                        else:
                            illumination[i, j] = 0.0

            # 如果有纹理，应用纹理
            if self.moon_texture is not None:
                # 缩放纹理到目标分辨率
                texture_resized = np.array(Image.fromarray(
                    (self.moon_texture * 255).astype(np.uint8)
                ).resize((resolution, resolution)))
                illumination = illumination * (texture_resized / 255.0)

            # 创建Plotly图表
            fig = go.Figure()

            fig.add_trace(go.Heatmap(
                z=illumination,
                colorscale='gray',
                showscale=False,
                hoverinfo='skip'
            ))

            # 添加圆形遮罩
            fig.add_shape(
                type="circle",
                x0=-1, y0=-1, x1=1, y1=1,
                line=dict(color="black", width=2)
            )

            fig.update_layout(
                title=f"{year}年第{day}天 月相<br>{moon_data['phase_name']}<br>照明度: {moon_data['illumination']:.1%}",
                xaxis=dict(showgrid=False, zeroline=False, visible=False),
                yaxis=dict(showgrid=False, zeroline=False, visible=False),
                width=400,
                height=400,
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                margin=dict(l=20, r=20, t=60, b=20),
                font=dict(color='white', size=12)
            )

            return json.loads(fig.to_json())

        except Exception as e:
            print(f"创建月相可视化失败: {e}")
            return None

    def create_orbital_visualization(self, year, day):
        """创建轨道可视化（太阳-地球-月球系统）"""
        try:
            moon_data = self.calculate_moon_phase(year, day)
            if not moon_data:
                return None

            t = self.ts.utc(year, 1, 1) + timedelta(days=day-1)

            # 获取轨道数据
            earth_pos = self.earth_helio(t)
            moon_pos = self.moon_geo(t) + earth_pos  # 月球相对太阳的位置

            # 创建地球轨道
            orbit_points = 100
            earth_orbit = []
            for i in range(orbit_points):
                t_orbit = self.ts.utc(year, 1, 1) + timedelta(days=i * 365 / orbit_points)
                pos = self.earth_helio(t_orbit)
                earth_orbit.append(pos.tolist()[:2])  # 只取x,y

            earth_orbit = np.array(earth_orbit)

            fig = go.Figure()

            # 添加太阳
            fig.add_trace(go.Scatter(
                x=[0], y=[0],
                mode='markers',
                marker=dict(size=20, color='yellow', symbol='star'),
                name='太阳'
            ))

            # 添加地球轨道
            fig.add_trace(go.Scatter(
                x=earth_orbit[:, 0], y=earth_orbit[:, 1],
                mode='lines',
                line=dict(color='blue', width=1),
                name='地球轨道',
                hoverinfo='skip'
            ))

            # 添加地球
            fig.add_trace(go.Scatter(
                x=[earth_pos[0]], y=[earth_pos[1]],
                mode='markers',
                marker=dict(size=12, color='blue'),
                name='地球'
            ))

            # 添加月球
            fig.add_trace(go.Scatter(
                x=[moon_pos[0]], y=[moon_pos[1]],
                mode='markers',
                marker=dict(size=8, color='gray'),
                name='月球'
            ))

            fig.update_layout(
                title=f"{year}年第{day}天 日-地-月系统",
                xaxis=dict(title="X (AU)", gridcolor='gray'),
                yaxis=dict(title="Y (AU)", gridcolor='gray', scaleanchor="x", scaleratio=1),
                width=500,
                height=500,
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,50,0.8)',
                font=dict(color='white'),
                showlegend=True
            )

            return json.loads(fig.to_json())

        except Exception as e:
            print(f"创建轨道可视化失败: {e}")
            return None

# 全局实例
moon_visualizer = MoonPhaseVisualizer()

def get_moon_phase_data(year, day, visualization_type='disc'):
    """获取月相数据的API接口"""
    try:
        if visualization_type == 'disc':
            return moon_visualizer.create_moon_disc_visualization(year, day)
        elif visualization_type == 'orbital':
            return moon_visualizer.create_orbital_visualization(year, day)
        else:
            return moon_visualizer.calculate_moon_phase(year, day)
    except Exception as e:
        return {'error': str(e)}