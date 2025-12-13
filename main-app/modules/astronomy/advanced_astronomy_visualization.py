#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高级天文可视化集成模块
集成三大核心功能：天球模型、交互式天球、高级月相系统
"""

import numpy as np
import plotly.graph_objects as go
import plotly.utils
from datetime import datetime, timedelta, date
import json
import os
import sys
import math
from calendar import isleap

# 添加src目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

# 导入Skyfield
try:
    from skyfield.api import load, Topos
    from skyfield import almanac
    print("✅ Skyfield库加载成功")
except ImportError as e:
    print(f"⚠️  Skyfield库未加载: {e}")
    # 创建空函数以避免错误
    def load(*args, **kwargs):
        return None
    class DummyAlmanac: pass
    almanac = DummyAlmanac

class AdvancedAstronomyVisualizer:
    """高级天文可视化类"""

    def __init__(self):
        self.ts = None
        self.eph = None
        self.moon_texture = None
        self.initialize_data()

    def initialize_data(self):
        """初始化天文数据"""
        try:
            self.ts = load.timescale()
            eph_path = os.path.join(src_dir, 'de421.bsp')

            if os.path.exists(eph_path):
                self.eph = load(eph_path)
                self.sun, self.earth, self.moon = self.eph['sun'], self.eph['earth'], self.eph['moon']
                print("✅ 星历数据加载成功")
            else:
                print("⚠️  星历数据文件未找到，使用简化模式")
                return False

            # 尝试加载月球纹理
            texture_path = os.path.join(src_dir, 'moon_texture_map.tif')
            if os.path.exists(texture_path):
                try:
                    from PIL import Image
                    moon_texture_img = Image.open(texture_path).convert("L")
                    self.moon_texture = np.array(moon_texture_img) / 255.0
                    print("✅ 月球纹理加载成功")
                except Exception as e:
                    print(f"⚠️  月球纹理加载失败: {e}")
                    self.moon_texture = None
            else:
                print("⚠️  月球纹理文件未找到")

            return True
        except Exception as e:
            print(f"❌ 天文数据初始化失败: {e}")
            return False

    # ==================== 工具函数 ====================

    def _spherical_to_cartesian(self, azimuth_deg, altitude_deg, radius=1.0):
        """地平坐标转笛卡尔坐标"""
        az_rad = np.radians(azimuth_deg)
        alt_rad = np.radians(altitude_deg)

        x = radius * np.cos(alt_rad) * np.sin(az_rad)  # 东
        y = radius * np.cos(alt_rad) * np.cos(az_rad)  # 北
        z = radius * np.sin(alt_rad)                    # 天顶
        return x, y, z

    def unit(self, v):
        """单位向量"""
        v = np.asarray(v, dtype=float)
        n = np.linalg.norm(v)
        if n < 1e-12:
            return v * 0.0
        return v / n

    def earth_helio(self, t):
        """地球相对太阳的位置"""
        if self.eph is None:
            return np.array([1.0, 0.0, 0.0])
        return self.sun.at(t).observe(self.earth).position.au

    def moon_geo(self, t):
        """月球相对地球的位置"""
        if self.eph is None:
            return np.array([0.1, 0.0, 0.0])
        return self.earth.at(t).observe(self.moon).position.au

    # ==================== 天球模型功能 ====================

    def create_celestial_sphere_plot(self, latitude=31.23, longitude=121.47,
                                   year=None, month=1, day=1, hour=12, minute=0):
        """创建天球模型3D图表"""
        try:
            if year is None:
                year = datetime.now().year

            # 创建时间对象
            dt = datetime(year, month, day, hour, minute)
            if self.ts:
                t = self.ts.utc(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)
            else:
                t = None

            fig = go.Figure()

            # 绘制天球网格
            self._draw_celestial_sphere_grid(fig)

            # 绘制地平面和坐标轴
            self._draw_horizon_plane(fig, latitude)

            # 绘制天体位置
            if t and self.eph:
                self._draw_celestial_bodies(fig, t, latitude, longitude)

            # 设置布局
            fig.update_layout(
                title=f'天球模型 - {latitude}°N, {longitude}°E<br>{dt.strftime("%Y-%m-%d %H:%M")}',
                scene=dict(
                    xaxis=dict(title='东', range=[-1.5, 1.5]),
                    yaxis=dict(title='北', range=[-1.5, 1.5]),
                    zaxis=dict(title='天顶', range=[-1.5, 1.5]),
                    aspectmode='cube',
                    bgcolor='rgb(0,0,0)'
                ),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                width=800,
                height=600
            )

            return json.loads(fig.to_json())

        except Exception as e:
            print(f"创建天球模型失败: {e}")
            return self._create_error_plot("天球模型", str(e))

    def _draw_celestial_sphere_grid(self, fig):
        """绘制天球网格"""
        n_sphere = 15
        u = np.linspace(0, 2*np.pi, n_sphere)
        v = np.linspace(0, np.pi, n_sphere)

        # 经线
        for i in range(0, n_sphere, 3):
            x = np.cos(u[i]) * np.sin(v)
            y = np.sin(u[i]) * np.sin(v)
            z = np.cos(v)
            fig.add_trace(go.Scatter3d(
                x=x, y=y, z=z,
                mode='lines',
                line=dict(color='rgba(100,100,255,0.3)', width=1),
                showlegend=False,
                hoverinfo='skip'
            ))

        # 纬线
        for i in range(0, n_sphere, 3):
            x = np.cos(u) * np.sin(v[i])
            y = np.sin(u) * np.sin(v[i])
            z = np.full_like(u, np.cos(v[i]))
            fig.add_trace(go.Scatter3d(
                x=x, y=y, z=z,
                mode='lines',
                line=dict(color='rgba(100,100,255,0.3)', width=1),
                showlegend=False,
                hoverinfo='skip'
            ))

    def _draw_horizon_plane(self, fig, latitude):
        """绘制地平面和坐标轴"""
        # 地平面
        size = 1.2
        x_plane = [-size, size, size, -size, -size]
        y_plane = [-size, -size, size, size, -size]
        z_plane = [0, 0, 0, 0, 0]

        fig.add_trace(go.Scatter3d(
            x=x_plane, y=y_plane, z=z_plane,
            mode='lines',
            line=dict(color='rgba(255,255,100,0.5)', width=2),
            showlegend=False,
            hoverinfo='skip',
            name='地平面'
        ))

        # 坐标轴
        axes = [
            ([0, 1.3, 0, 0], '东', 'red'),
            ([0, 0, 1.3, 0], '北', 'green'),
            ([0, 0, 0, 1.3], '天顶', 'blue')
        ]

        for coords, label, color in axes:
            fig.add_trace(go.Scatter3d(
                x=coords[::2], y=coords[1::2], z=coords[2::2],
                mode='lines+markers',
                line=dict(color=color, width=3),
                marker=dict(size=5, color=color),
                text=[label], textposition='top center',
                showlegend=False,
                hoverinfo='skip'
            ))

    def _draw_celestial_bodies(self, fig, t, latitude, longitude):
        """绘制天体位置"""
        try:
            # 创建观测者位置
            observer = self.eph['earth'] + Topos(latitude_degrees=latitude, longitude_degrees=longitude)

            # 太阳位置
            astrometric_sun = observer.at(t).observe(self.sun)
            alt_sun, az_sun, _ = astrometric_sun.apparent().altaz()
            if alt_sun.degrees > 0:  # 太阳在地平线以上
                x, y, z = self._spherical_to_cartesian(az_sun.degrees, alt_sun.degrees, 0.8)
                fig.add_trace(go.Scatter3d(
                    x=[x], y=[y], z=[z],
                    mode='markers',
                    marker=dict(size=15, color='yellow', symbol='circle'),
                    name='太阳',
                    text=[f'太阳: 高度{alt_sun.degrees:.1f}° 方位{az_sun.degrees:.1f}°'],
                    textposition='top center'
                ))

            # 月亮位置
            astrometric_moon = observer.at(t).observe(self.moon)
            alt_moon, az_moon, _ = astrometric_moon.apparent().altaz()
            if alt_moon.degrees > 0:  # 月亮在地平线以上
                x, y, z = self._spherical_to_cartesian(az_moon.degrees, alt_moon.degrees, 0.8)
                fig.add_trace(go.Scatter3d(
                    x=[x], y=[y], z=[z],
                    mode='markers',
                    marker=dict(size=12, color='lightgray', symbol='circle'),
                    name='月亮',
                    text=[f'月亮: 高度{alt_moon.degrees:.1f}° 方位{az_moon.degrees:.1f}°'],
                    textposition='top center'
                ))

            # 行星位置
            planets_data = {
                'mercury': {'name': '水星', 'color': 'orange', 'size': 8},
                'venus': {'name': '金星', 'color': 'yellow', 'size': 10},
                'mars': {'name': '火星', 'color': 'red', 'size': 9},
                'jupiter': {'name': '木星', 'color': 'tan', 'size': 12},
                'saturn': {'name': '土星', 'color': 'gold', 'size': 11}
            }

            for planet_key, planet_info in planets_data.items():
                try:
                    planet = self.eph[planet_key]
                    astrometric_planet = observer.at(t).observe(planet)
                    alt_planet, az_planet, _ = astrometric_planet.apparent().altaz()

                    if alt_planet.degrees > 0:
                        x, y, z = self._spherical_to_cartesian(az_planet.degrees, alt_planet.degrees, 0.7)
                        fig.add_trace(go.Scatter3d(
                            x=[x], y=[y], z=[z],
                            mode='markers',
                            marker=dict(size=planet_info['size'], color=planet_info['color'], symbol='diamond'),
                            name=planet_info['name'],
                            text=[f'{planet_info["name"]}: 高度{alt_planet.degrees:.1f}°'],
                            textposition='top center'
                        ))
                except:
                    continue

        except Exception as e:
            print(f"绘制天体位置失败: {e}")

    # ==================== 高级月相功能 ====================

    def create_advanced_moon_phase_plot(self, year=None, day=1):
        """创建高级月相图表（基于v6版本）"""
        try:
            if year is None:
                year = datetime.now().year

            # 检查闰年
            max_days = 366 if isleap(year) else 365
            day = min(max(1, day), max_days)

            # 计算月相数据
            dt = datetime(year, 1, 1) + timedelta(days=day-1)
            if self.ts:
                t = self.ts.utc(dt)
                phase_data = self._calculate_moon_phase_data(t, year, day)
            else:
                phase_data = self._calculate_simple_moon_phase(day, max_days)

            # 创建双子图布局
            fig = go.Figure()

            # 左子图：轨道系统
            self._add_orbital_subplot(fig, dt, phase_data)

            # 右子图：月相圆盘
            self._add_moon_disc_subplot(fig, dt, phase_data)

            # 更新布局为双图并排
            fig.update_layout(
                title=f'高级月相系统 - {year}年第{day}天<br>{phase_data.get("phase_name", "计算中...")}',
                height=600,
                showlegend=False,
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                grid=dict(rows=1, columns=2, pattern='independent')
            )

            return json.loads(fig.to_json())

        except Exception as e:
            print(f"创建高级月相图表失败: {e}")
            return self._create_error_plot("高级月相系统", str(e))

    def _calculate_moon_phase_data(self, t, year, day):
        """计算精确月相数据"""
        try:
            # 计算太阳和月球位置
            earth_pos = self.earth_helio(t)
            moon_pos = self.moon_geo(t)

            # 计算相位角
            earth_to_moon = self.unit(moon_pos)
            sun_to_earth = self.unit(earth_pos)

            phase_angle = np.arccos(np.clip(np.dot(earth_to_moon, sun_to_earth), -1, 1))
            phase_degrees = np.degrees(phase_angle)
            illumination = (1 + np.cos(phase_angle)) / 2

            # 获取月相名称
            phase_name = self._get_phase_name(phase_degrees)

            return {
                'phase_angle': phase_degrees,
                'illumination': illumination,
                'phase_name': phase_name,
                'earth_pos': earth_pos.tolist(),
                'moon_pos': moon_pos.tolist()
            }

        except Exception as e:
            print(f"计算月相数据失败: {e}")
            return self._calculate_simple_moon_phase(day, 365)

    def _calculate_simple_moon_phase(self, day, max_days):
        """简化月相计算"""
        moon_phase = (day / 29.53) % 1
        phase_angle = moon_phase * 360
        illumination = abs(np.cos(moon_phase * np.pi))

        return {
            'phase_angle': phase_angle,
            'illumination': illumination,
            'phase_name': self._get_phase_name(phase_angle),
            'earth_pos': [np.cos(2*np.pi*day/max_days), np.sin(2*np.pi*day/max_days), 0],
            'moon_pos': [1.1*np.cos(2*np.pi*day/max_days), 1.1*np.sin(2*np.pi*day/max_days), 0]
        }

    def _get_phase_name(self, phase_degrees):
        """获取月相名称"""
        phase = phase_degrees / 360
        if phase < 0.03 or phase > 0.97:
            return "新月 🌑"
        elif phase < 0.22:
            return "蛾眉月 🌒"
        elif phase < 0.28:
            return "上弦月 🌓"
        elif phase < 0.47:
            return "盈凸月 🌔"
        elif phase < 0.53:
            return "满月 🌕"
        elif phase < 0.72:
            return "亏凸月 🌖"
        elif phase < 0.78:
            return "下弦月 🌗"
        else:
            return "残月 🌘"

    def _add_orbital_subplot(self, fig, dt, phase_data):
        """添加轨道系统子图"""
        # 地球轨道
        orbit_points = 100
        theta = np.linspace(0, 2*np.pi, orbit_points)
        earth_orbit_x = np.cos(theta)
        earth_orbit_y = np.sin(theta)
        earth_orbit_z = np.zeros_like(theta)

        fig.add_trace(go.Scatter3d(
            x=earth_orbit_x, y=earth_orbit_y, z=earth_orbit_z,
            mode='lines',
            line=dict(color='blue', width=1),
            showlegend=False,
            hoverinfo='skip'
        ))

        # 太阳（原点）
        fig.add_trace(go.Scatter3d(
            x=[0], y=[0], z=[0],
            mode='markers',
            marker=dict(size=20, color='yellow', symbol='star'),
            name='太阳',
            text=['太阳'],
            textposition='top center'
        ))

        # 地球
        earth_pos = phase_data['earth_pos']
        fig.add_trace(go.Scatter3d(
            x=[earth_pos[0]], y=[earth_pos[1]], z=[earth_pos[2]],
            mode='markers',
            marker=dict(size=12, color='blue', symbol='circle'),
            name='地球',
            text=['地球'],
            textposition='top center'
        ))

        # 月球
        moon_pos = phase_data['moon_pos']
        fig.add_trace(go.Scatter3d(
            x=[moon_pos[0]], y=[moon_pos[1]], z=[moon_pos[2]],
            mode='markers',
            marker=dict(size=8, color='gray', symbol='circle'),
            name='月球',
            text=['月球'],
            textposition='top center'
        ))

    def _add_moon_disc_subplot(self, fig, dt, phase_data):
        """添加月相圆盘子图"""
        phase_angle = phase_data['phase_angle']
        illumination = phase_data['illumination']
        phase_name = phase_data['phase_name']

        # 创建月相圆盘
        resolution = 256
        x = np.linspace(-1, 1, resolution)
        y = np.linspace(-1, 1, resolution)
        X, Y = np.meshgrid(x, y)
        R = np.sqrt(X**2 + Y**2)

        # 月球圆盘遮罩
        moon_mask = R <= 1

        # 计算照明区域
        Z = np.zeros_like(R)
        for i in range(resolution):
            for j in range(resolution):
                if moon_mask[i, j]:
                    if X[i, j] <= np.cos(np.radians(phase_angle)):
                        Z[i, j] = 1.0

        # 如果有纹理，应用纹理
        if self.moon_texture is not None:
            try:
                from scipy.ndimage import map_coordinates
                # 缩放纹理
                texture_resized = np.array(
                    np.resize(self.moon_texture, (resolution, resolution))
                )
                Z = Z * texture_resized
            except:
                pass  # 纹理处理失败时使用简化版本

        fig.add_trace(go.Heatmap(
            z=Z.tolist(),
            colorscale='gray',
            showscale=False,
            hoverinfo='skip'
        ))

    def _create_error_plot(self, title, error_msg):
        """创建错误提示图表"""
        fig = {
            'data': [
                {
                    'x': [0, 1],
                    'y': [0, 1],
                    'type': 'scatter',
                    'mode': 'text',
                    'text': [f'{title}错误\n{error_msg}'],
                    'textposition': 'middle center',
                    'showlegend': False
                }
            ],
            'layout': {
                'title': f'{title} - 错误',
                'xaxis': {'visible': False},
                'yaxis': {'visible': False},
                'paper_bgcolor': 'rgba(0,0,0,0)',
                'plot_bgcolor': 'rgba(0,0,0,0)',
                'font': {'color': 'white'}
            }
        }
        return fig

# 全局实例
advanced_visualizer = AdvancedAstronomyVisualizer()

def get_celestial_sphere_data(latitude, longitude, year, month, day, hour, minute):
    """获取天球模型数据的API接口"""
    try:
        return advanced_visualizer.create_celestial_sphere_plot(
            latitude, longitude, year, month, day, hour, minute
        )
    except Exception as e:
        return {'error': str(e)}

def get_advanced_moon_phase_data(year, day):
    """获取高级月相数据的API接口"""
    try:
        return advanced_visualizer.create_advanced_moon_phase_plot(year, day)
    except Exception as e:
        return {'error': str(e)}