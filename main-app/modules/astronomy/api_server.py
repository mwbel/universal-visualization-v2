#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
天文可视化 API 服务器
集成Python天文计算代码，提供Web API接口
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

# 导入天文可视化模块
try:
    from skyfield.api import load, Topos
    import plotly.graph_objects as go
    import plotly.utils
    from PIL import Image
    from scipy.ndimage import map_coordinates
    from calendar import isleap
    from moon_phase_integration import get_moon_phase_data
    print("✅ 天文计算库加载成功")
except ImportError as e:
    print(f"⚠️  缺少依赖库: {e}")
    print("请运行: pip install flask flask-cors plotly scipy pillow skyfield")
    # 设置空函数以避免导入错误
    def get_moon_phase_data(*args, **kwargs):
        return {'error': '月相模块未加载'}

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量
ts = None
eph = None
moon_texture = None

def initialize_astronomy():
    """初始化天文计算环境"""
    global ts, eph, moon_texture
    try:
        # 初始化Skyfield
        ts = load.timescale()
        eph = load('de421.bsp')

        # 加载月球纹理
        moon_texture_path = os.path.join(src_dir, 'moon_texture_map.tif')
        if os.path.exists(moon_texture_path):
            moon_texture = Image.open(moon_texture_path).convert("L")
            moon_texture = np.array(moon_texture) / 255.0
            print("✅ 月球纹理加载成功")
        else:
            print("⚠️  月球纹理文件未找到")

        return True
    except Exception as e:
        print(f"❌ 天文计算环境初始化失败: {e}")
        return False

@app.route('/')
def index():
    """API根路径，返回API文档"""
    return jsonify({
        'name': '天文可视化 API 服务器',
        'version': '1.0.0',
        'description': '集成Python天文计算代码，提供Web API接口',
        'endpoints': {
            '/moon-phases': '月相可视化',
            '/celestial-sphere': '天球模型',
            '/planetary-orbits': '行星轨道',
            '/solar-eclipse': '日食模拟',
            '/daily-motion': '周日运动'
        },
        'status': 'running' if ts else 'initializing'
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

@app.route('/static/<path:filename>')
def static_files(filename):
    """提供静态文件服务"""
    return send_from_directory('src', filename)

def create_moon_phase_plot(year, day):
    """创建月相Plotly图表"""
    if not ts or not eph:
        return None

    try:
        # 计算月相
        t = ts.utc(year, 1, 1) + timedelta(days=day-1)
        sun, earth, moon = eph['sun'], eph['earth'], eph['moon']

        # 计算月相角度
        earth_pos = sun.at(t).observe(earth)
        moon_pos = earth.at(t).observe(moon)

        # 创建简单的月相可视化
        fig = go.Figure()

        # 添加月球圆盘
        theta = np.linspace(0, 2*np.pi, 100)
        x_moon = np.cos(theta)
        y_moon = np.sin(theta)

        fig.add_trace(go.Scatter(
            x=x_moon, y=y_moon,
            mode='lines',
            fill='toself',
            name='月球',
            line=dict(color='lightgray'),
            fillcolor='lightgray'
        ))

        # 设置图表布局
        fig.update_layout(
            title=f'{year}年第{day}天月相',
            xaxis=dict(scaleanchor="y", scaleratio=1),
            yaxis=dict(scaleanchor="x", scaleratio=1),
            showlegend=False,
            width=400,
            height=400,
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0.8)',
            font=dict(color='white')
        )

        return json.loads(fig.to_json())

    except Exception as e:
        print(f"创建月相图表失败: {e}")
        return None

@app.route('/moon-phases-plot')
def moon_phases_plot():
    """月相图表API - 使用集成的月相模块"""
    try:
        year = request.args.get('year', datetime.now().year, type=int)
        day = request.args.get('day', 1, type=int)
        visualization_type = request.args.get('type', 'disc')  # disc 或 orbital

        plot_data = get_moon_phase_data(year, day, visualization_type)
        if plot_data and 'error' not in plot_data:
            return jsonify(plot_data)
        else:
            return jsonify({'error': plot_data.get('error', '无法生成月相图表')}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🌟 启动天文可视化API服务器...")

    # 初始化天文计算环境
    if initialize_astronomy():
        print("🚀 API服务器启动成功！")
        print("📊 API文档: http://localhost:5000")
        print("🌙 月相API: http://localhost:5000/moon-phases")
        print("🌌 天球API: http://localhost:5000/celestial-sphere")

        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ API服务器启动失败，请检查依赖库")
        sys.exit(1)