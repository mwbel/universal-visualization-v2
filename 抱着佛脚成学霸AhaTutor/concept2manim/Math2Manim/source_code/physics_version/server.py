#!/usr/bin/env python3
"""
物理动画生成器 - 后端服务
使用Flask提供API接口，处理Manim动画生成请求
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import os
import json
from pathlib import Path
import time
from datetime import datetime

app = Flask(__name__, static_folder='web', static_url_path='')
CORS(app)

# 配置
BASE_DIR = Path(__file__).parent
MEDIA_DIR = BASE_DIR / 'media'
WEB_DIR = BASE_DIR / 'web'

# 概念到场景的映射
CONCEPT_MAPPING = {
    '牛顿第二定律': {
        'scene': 'NewtonSecondLaw',
        'file': 'physics_generator.py',
        'category': 'mechanics'
    },
    '简谐运动': {
        'scene': 'SimpleHarmonicMotion',
        'file': 'physics_generator.py',
        'category': 'mechanics'
    },
    '动能定理': {
        'scene': 'KineticEnergyTheorem',
        'file': 'physics_generator.py',
        'category': 'mechanics'
    },
    '电场': {
        'scene': 'ElectricField',
        'file': 'physics_generator.py',
        'category': 'electromagnetism'
    },
    '抛体运动': {
        'scene': 'ProjectileMotion',
        'file': 'advanced_physics.py',
        'category': 'mechanics'
    },
    '波的干涉': {
        'scene': 'WaveInterference',
        'file': 'advanced_physics.py',
        'category': 'waves'
    },
    '电磁感应': {
        'scene': 'ElectromagneticInduction',
        'file': 'advanced_physics.py',
        'category': 'electromagnetism'
    },
    '多普勒效应': {
        'scene': 'DopplerEffect',
        'file': 'advanced_physics.py',
        'category': 'waves'
    },
    '光电效应': {
        'scene': 'PhotoelectricEffect',
        'file': 'advanced_physics.py',
        'category': 'modern'
    }
}


@app.route('/')
def index():
    """返回主页"""
    return send_from_directory(WEB_DIR, 'index.html')


@app.route('/api/concepts', methods=['GET'])
def get_concepts():
    """获取所有可用的物理概念"""
    concepts = []
    for name, info in CONCEPT_MAPPING.items():
        concepts.append({
            'name': name,
            'scene': info['scene'],
            'category': info['category']
        })
    return jsonify({
        'success': True,
        'concepts': concepts
    })


@app.route('/api/generate', methods=['POST'])
def generate_animation():
    """生成动画"""
    try:
        data = request.json
        concept = data.get('concept')
        quality = data.get('quality', 'l')  # l, m, h, k

        if not concept:
            return jsonify({
                'success': False,
                'error': '请提供物理概念'
            }), 400

        if concept not in CONCEPT_MAPPING:
            return jsonify({
                'success': False,
                'error': f'不支持的概念: {concept}'
            }), 400

        # 获取场景信息
        scene_info = CONCEPT_MAPPING[concept]
        scene_name = scene_info['scene']
        script_file = scene_info['file']

        # 检查脚本文件是否存在
        script_path = BASE_DIR / script_file
        if not script_path.exists():
            return jsonify({
                'success': False,
                'error': f'脚本文件不存在: {script_file}'
            }), 500

        # 生成动画
        print(f"开始生成动画: {concept} ({scene_name})")
        start_time = time.time()

        result = run_manim(script_file, scene_name, quality)

        if not result['success']:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500

        elapsed_time = time.time() - start_time
        print(f"动画生成完成，耗时: {elapsed_time:.2f}秒")

        # 读取生成的代码
        code = read_source_code(script_path, scene_name)

        # 返回结果
        return jsonify({
            'success': True,
            'concept': concept,
            'scene': scene_name,
            'videoUrl': result['video_url'],
            'code': code,
            'generationTime': elapsed_time,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"生成动画时出错: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def run_manim(script_file, scene_name, quality='l'):
    """运行Manim生成动画"""
    try:
        # 构建命令
        cmd = [
            'python3', '-m', 'manim',
            f'-q{quality}',
            script_file,
            scene_name
        ]

        # 执行命令
        result = subprocess.run(
            cmd,
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=120  # 2分钟超时
        )

        if result.returncode != 0:
            return {
                'success': False,
                'error': f'Manim执行失败: {result.stderr}'
            }

        # 查找生成的视频文件
        video_path = find_video_file(script_file, scene_name, quality)

        if not video_path:
            return {
                'success': False,
                'error': '未找到生成的视频文件'
            }

        # 返回相对URL
        relative_path = video_path.relative_to(BASE_DIR)
        video_url = f'/{relative_path.as_posix()}'

        return {
            'success': True,
            'video_url': video_url
        }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': '生成超时（超过2分钟）'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def find_video_file(script_file, scene_name, quality):
    """查找生成的视频文件"""
    # 根据质量确定分辨率目录
    quality_dirs = {
        'l': '480p15',
        'm': '720p30',
        'h': '1080p60',
        'k': '2160p60'
    }

    quality_dir = quality_dirs.get(quality, '480p15')

    # 构建视频路径
    script_name = Path(script_file).stem
    video_dir = MEDIA_DIR / 'videos' / script_name / quality_dir
    video_file = video_dir / f'{scene_name}.mp4'

    if video_file.exists():
        return video_file

    return None


def read_source_code(script_path, scene_name):
    """读取源代码"""
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取特定场景的代码
        # 简单实现：返回整个文件内容
        # 可以改进为只提取特定类的代码
        return content

    except Exception as e:
        print(f"读取源代码失败: {str(e)}")
        return f"# 无法读取源代码\n# 错误: {str(e)}"


@app.route('/media/<path:filename>')
def serve_media(filename):
    """提供媒体文件"""
    return send_from_directory(MEDIA_DIR, filename)


@app.route('/api/status', methods=['GET'])
def get_status():
    """获取服务状态"""
    return jsonify({
        'success': True,
        'status': 'running',
        'version': '1.0.0',
        'availableConcepts': len(CONCEPT_MAPPING),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """获取统计信息"""
    # 统计生成的视频数量
    video_count = 0
    if MEDIA_DIR.exists():
        for video_file in MEDIA_DIR.rglob('*.mp4'):
            video_count += 1

    return jsonify({
        'success': True,
        'stats': {
            'totalVideos': video_count,
            'availableConcepts': len(CONCEPT_MAPPING),
            'categories': {
                'mechanics': 4,
                'electromagnetism': 2,
                'waves': 2,
                'modern': 1
            }
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("物理动画生成器 - 后端服务")
    print("=" * 60)
    print(f"工作目录: {BASE_DIR}")
    print(f"媒体目录: {MEDIA_DIR}")
    print(f"可用概念: {len(CONCEPT_MAPPING)}个")
    print("=" * 60)
    print("\n启动服务器...")
    print("访问地址: http://localhost:5000")
    print("\n按 Ctrl+C 停止服务器\n")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
