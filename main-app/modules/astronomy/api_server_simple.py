#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
天文可视化 API 服务器 - 简化版
暂时不依赖PIL库，专注于核心天文计算功能
"""

import os
import sys
import json
import numpy as np
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# 添加src目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量
ts = None
eph = None

def initialize_astronomy():
    """初始化天文计算环境"""
    global ts, eph
    try:
        # 初始化Skyfield
        from skyfield.api import load, Topos
        ts = load.timescale()

        # 尝试加载星历数据
        eph_path = os.path.join(src_dir, 'de421.bsp')
        if os.path.exists(eph_path):
            eph = load(eph_path)
            print("✅ 天文计算环境初始化成功")
        else:
            print("⚠️  星历数据文件未找到，使用简化计算模式")

        # 尝试加载高级可视化模块
        try:
            from advanced_astronomy_visualization import get_celestial_sphere_data, get_advanced_moon_phase_data
            global advanced_viz_available
            advanced_viz_available = True
            print("✅ 高级天文可视化模块加载成功")
        except ImportError as e:
            print(f"⚠️  高级可视化模块加载失败: {e}")
            advanced_viz_available = False

        # 尝试加载天球滑块模块
        try:
            from src.celestial_sphere_slider import create_celestial_sphere_slider_plot
            global slider_viz_available
            slider_viz_available = True
            print("✅ 天球滑块模块加载成功")
        except ImportError as e:
            print(f"⚠️  天球滑块模块加载失败: {e}")
            slider_viz_available = False

        return True
    except Exception as e:
        print(f"❌ 天文计算环境初始化失败: {e}")
        return False

@app.route('/')
def index():
    """API根路径，返回API文档"""
    return jsonify({
        'name': '天文可视化 API 服务器 - 简化版',
        'version': '1.0.0',
        'description': '集成Python天文计算代码，提供Web API接口',
        'endpoints': {
            '/moon-phases': '月相可视化',
            '/celestial-sphere': '天球模型',
            '/planetary-orbits': '行星轨道',
            '/celestial-sphere-slider-plot': '天球滑块视运动系统',
            '/status': 'API状态检查'
        },
        'status': 'running' if ts else 'initializing'
    })

@app.route('/status')
def status():
    """检查API状态"""
    return jsonify({
        'status': 'success',
        'data': {
            'skyfield_loaded': ts is not None,
            'ephemeris_loaded': eph is not None,
            'server_time': datetime.now().isoformat()
        }
    })

@app.route('/moon-phases')
def moon_phases_api():
    """月相可视化API"""
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        day = request.args.get('day', 1, type=int)

        return jsonify({
            'status': 'success',
            'data': {
                'year': year,
                'day': day,
                'message': '月相数据计算中...',
                'plot_url': f'/moon-phases-plot?year={year}&day={day}'
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/moon-phases-plot')
def moon_phases_plot():
    """月相图表API - 简化版"""
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        day = request.args.get('day', 1, type=int)

        plot_data = create_simple_moon_phase_plot(year, day)
        if plot_data:
            return jsonify(plot_data)
        else:
            return jsonify({'error': '无法生成月相图表'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_simple_moon_phase_plot(year, day):
    """创建简化的月相Plotly图表"""
    try:
        # 简化的月相计算
        day_of_year = day
        moon_phase = (day_of_year / 29.53) % 1  # 月相周期约29.53天
        phase_angle = moon_phase * 360
        illumination = abs(np.cos(moon_phase * np.pi))

        # 获取月相名称
        if moon_phase < 0.03 or moon_phase > 0.97:
            phase_name = "新月 🌑"
        elif moon_phase < 0.22:
            phase_name = "蛾眉月 🌒"
        elif moon_phase < 0.28:
            phase_name = "上弦月 🌓"
        elif moon_phase < 0.47:
            phase_name = "盈凸月 🌔"
        elif moon_phase < 0.53:
            phase_name = "满月 🌕"
        elif moon_phase < 0.72:
            phase_name = "亏凸月 🌖"
        elif moon_phase < 0.78:
            phase_name = "下弦月 🌗"
        else:
            phase_name = "残月 🌘"

        # 创建月相圆盘
        resolution = 200
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
                    # 简化的月相计算
                    if X[i, j] <= np.cos(np.radians(phase_angle)):
                        Z[i, j] = 1.0

        # 转换为Python列表以确保JSON序列化
        Z_list = Z.tolist()

        # 创建Plotly图表
        fig = {
            'data': [
                {
                    'z': Z_list,
                    'type': 'heatmap',
                    'colorscale': 'gray',
                    'showscale': False,
                    'hoverinfo': 'skip'
                }
            ],
            'layout': {
                'title': f'{year}年第{day}天 月相<br>{phase_name}<br>照明度: {illumination:.1%}',
                'xaxis': {'visible': False},
                'yaxis': {'visible': False, 'scaleanchor': 'x', 'scaleratio': 1},
                'width': 400,
                'height': 400,
                'paper_bgcolor': 'rgba(0,0,0,0)',
                'plot_bgcolor': 'rgba(0,0,0,0)',
                'margin': {'l': 20, 'r': 20, 't': 60, 'b': 20},
                'font': {'color': 'white', 'size': 12},
                'shapes': [
                    {
                        'type': 'circle',
                        'x0': -1, 'y0': -1, 'x1': 1, 'y1': 1,
                        'line': {'color': 'black', 'width': 2}
                    }
                ]
            }
        }

        return fig

    except Exception as e:
        print(f"创建月相图表失败: {e}")
        return None

@app.route('/celestial-sphere')
def celestial_sphere_api():
    """天球模型API"""
    try:
        lat = request.args.get('lat', 39.9, type=float)
        lon = request.args.get('lon', 116.4, type=float)
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

        return jsonify({
            'status': 'success',
            'data': {
                'latitude': lat,
                'longitude': lon,
                'date': date,
                'message': '天球数据计算中...',
                'plot_url': f'/celestial-sphere-plot?lat={lat}&lon={lon}&date={date}'
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/planetary-orbits')
def planetary_orbits_api():
    """行星轨道API"""
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))

        return jsonify({
            'status': 'success',
            'data': {
                'date': date,
                'message': '行星轨道数据计算中...',
                'plot_url': f'/planetary-orbits-plot?date={date}'
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/celestial-sphere-plot')
def celestial_sphere_plot():
    """天球模型图表API"""
    try:
        lat = request.args.get('lat', 31.23, type=float)
        lon = request.args.get('lon', 121.47, type=float)
        year = request.args.get('year', datetime.now().year, type=int)
        month = request.args.get('month', 1, type=int)
        day = request.args.get('day', 1, type=int)
        hour = request.args.get('hour', 12, type=int)
        minute = request.args.get('minute', 0, type=int)

        if 'advanced_viz_available' in globals() and advanced_viz_available:
            from advanced_astronomy_visualization import get_celestial_sphere_data
            plot_data = get_celestial_sphere_data(lat, lon, year, month, day, hour, minute)
        else:
            plot_data = {'error': '高级天球模型模块未加载'}

        if plot_data and 'error' not in plot_data:
            return jsonify(plot_data)
        else:
            return jsonify({'error': plot_data.get('error', '无法生成天球模型图表')}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/advanced-moon-phase-plot')
def advanced_moon_phase_plot():
    """高级月相图表API"""
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        day = request.args.get('day', 1, type=int)

        if 'advanced_viz_available' in globals() and advanced_viz_available:
            from advanced_astronomy_visualization import get_advanced_moon_phase_data
            plot_data = get_advanced_moon_phase_data(year, day)
        else:
            plot_data = {'error': '高级月相模块未加载'}

        if plot_data and 'error' not in plot_data:
            return jsonify(plot_data)
        else:
            return jsonify({'error': plot_data.get('error', '无法生成高级月相图表')}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/celestial-sphere-slider-plot')
def celestial_sphere_slider_plot():
    """天球滑块图表API"""
    try:
        latitude = request.args.get('latitude', 31.23, type=float)
        longitude = request.args.get('longitude', 121.47, type=float)
        timezone = request.args.get('timezone', 'Asia/Shanghai', type=str)
        year = request.args.get('year', datetime.now().year, type=int)
        hour = request.args.get('hour', 12, type=int)
        minute = request.args.get('minute', 0, type=int)
        date_index = request.args.get('date_index', 0, type=int)

        if 'slider_viz_available' in globals() and slider_viz_available:
            from src.celestial_sphere_slider import create_celestial_sphere_slider_plot
            plot_data = create_celestial_sphere_slider_plot(
                latitude, longitude, timezone, year, hour, minute, date_index
            )
        else:
            plot_data = {'error': '天球滑块模块未加载'}

        if plot_data and 'error' not in plot_data:
            return jsonify(plot_data)
        else:
            return jsonify({'error': plot_data.get('error', '无法生成天球滑块图表')}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    """提供静态文件服务"""
    return send_from_directory('src', filename)

if __name__ == '__main__':
    print("🌟 启动天文可视化API服务器（简化版）...")

    # 初始化天文计算环境
    if initialize_astronomy():
        print("🚀 API服务器启动成功！")
        print("📊 API文档: http://localhost:5001")
        print("🌙 月相API: http://localhost:5001/moon-phases")
        print("🌌 天球API: http://localhost:5001/celestial-sphere")
        print("🌐 天球滑块API: http://localhost:5001/celestial-sphere-slider-plot")
        print("🔧 状态检查: http://localhost:5001/status")

        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ API服务器启动失败，请检查依赖库")
        sys.exit(1)