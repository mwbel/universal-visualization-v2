"""
Universal RAG Web 服务
提供 Web 界面和 API 接口
"""

from flask import Flask, render_template, request, jsonify
import sys
import os

# 添加父目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
grandparent_dir = os.path.dirname(parent_dir)
sys.path.insert(0, grandparent_dir)

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector
import json

app = Flask(__name__)

# 全局 RAG 实例
rag_instance = None
current_config = None


def init_rag(config_dict):
    """初始化 RAG 实例"""
    global rag_instance, current_config

    if rag_instance:
        rag_instance.close()

    current_config = RAGConfig(**config_dict)
    rag_instance = RAGPipeline(current_config)
    return rag_instance


@app.route('/')
def index():
    """主页"""
    return render_template('index.html')


@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """获取所有可用策略"""
    strategies = []
    for strategy, config in RAGStrategySelector.STRATEGIES.items():
        strategies.append({
            'id': strategy.value,
            'name': config.name,
            'description': config.description,
            'retrieval_strategy': config.retrieval_strategy,
            'enable_graph': config.enable_graph,
            'top_k': config.top_k,
            'max_hops': config.max_hops
        })
    return jsonify({'strategies': strategies})


@app.route('/api/recommend', methods=['POST'])
def recommend_strategy():
    """推荐策略"""
    data = request.json
    use_case = data.get('use_case', '')

    strategy = RAGStrategySelector.recommend_strategy(use_case)
    config = RAGStrategySelector.get_strategy(strategy)

    return jsonify({
        'strategy_id': strategy.value,
        'name': config.name,
        'description': config.description
    })


@app.route('/api/init', methods=['POST'])
def initialize():
    """初始化 RAG"""
    data = request.json

    try:
        # 基础配置
        config_dict = {
            'data_source_type': data.get('data_source_type', 'json'),
            'data_source_path': data.get('data_source_path', 'sample_data.json'),
            'id_field': data.get('id_field', 'id'),
            'title_field': data.get('title_field', 'title'),
            'content_field': data.get('content_field', 'content')
        }

        # 应用策略
        strategy_id = data.get('strategy')
        if strategy_id:
            strategy = RAGStrategy(strategy_id)
            temp_config = RAGConfig(**config_dict)
            RAGStrategySelector.apply_strategy(temp_config, strategy)
            config_dict.update({
                'retrieval_strategy': temp_config.retrieval_strategy,
                'enable_graph': temp_config.enable_graph,
                'top_k': temp_config.top_k,
                'max_hops': temp_config.max_hops,
                'vector_method': temp_config.vector_method,
                'relation_types': temp_config.relation_types
            })

        init_rag(config_dict)

        return jsonify({
            'success': True,
            'message': 'RAG 初始化成功',
            'config': config_dict
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'初始化失败: {str(e)}'
        }), 400


@app.route('/api/ask', methods=['POST'])
def ask_question():
    """问答"""
    if not rag_instance:
        return jsonify({'error': '请先初始化 RAG'}), 400

    data = request.json
    query = data.get('query', '')

    if not query:
        return jsonify({'error': '查询不能为空'}), 400

    try:
        answer = rag_instance.ask(query)
        return jsonify({
            'query': query,
            'answer': answer,
            'strategy': current_config.retrieval_strategy if current_config else 'unknown'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/search', methods=['POST'])
def search_documents():
    """搜索"""
    if not rag_instance:
        return jsonify({'error': '请先初始化 RAG'}), 400

    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 5)

    if not query:
        return jsonify({'error': '查询不能为空'}), 400

    try:
        results = rag_instance.search(query, top_k=top_k)
        return jsonify({
            'query': query,
            'results': results,
            'count': len(results)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/path', methods=['POST'])
def get_learning_path():
    """获取学习路径"""
    if not rag_instance:
        return jsonify({'error': '请先初始化 RAG'}), 400

    data = request.json
    target_id = data.get('target_id')

    if target_id is None:
        return jsonify({'error': 'target_id 不能为空'}), 400

    try:
        path = rag_instance.get_path(target_id=target_id)
        return jsonify({
            'target_id': target_id,
            'path': path,
            'steps': len(path)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/compare', methods=['POST'])
def compare_strategies():
    """对比策略"""
    data = request.json
    query = data.get('query', '')
    strategies = data.get('strategies', [])
    config_dict = data.get('config', {})

    if not query or not strategies:
        return jsonify({'error': '查询和策略不能为空'}), 400

    results = []

    for strategy_id in strategies:
        try:
            strategy = RAGStrategy(strategy_id)
            temp_config = RAGConfig(**config_dict)
            RAGStrategySelector.apply_strategy(temp_config, strategy)

            temp_rag = RAGPipeline(temp_config)
            search_results = temp_rag.search(query, top_k=5)
            temp_rag.close()

            strategy_config = RAGStrategySelector.get_strategy(strategy)
            results.append({
                'strategy_id': strategy_id,
                'strategy_name': strategy_config.name,
                'results': search_results,
                'count': len(search_results)
            })
        except Exception as e:
            results.append({
                'strategy_id': strategy_id,
                'error': str(e)
            })

    return jsonify({
        'query': query,
        'comparisons': results
    })


@app.route('/api/browse', methods=['POST'])
def browse_files():
    """浏览文件系统"""
    data = request.json
    path = data.get('path', '.')

    try:
        import os

        # 获取绝对路径
        abs_path = os.path.abspath(path)

        # 安全检查：只允许访问项目目录及其子目录
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if not abs_path.startswith(project_root):
            abs_path = project_root

        if not os.path.exists(abs_path):
            return jsonify({'error': '路径不存在'}), 400

        items = []

        # 如果是目录，列出内容
        if os.path.isdir(abs_path):
            for item in sorted(os.listdir(abs_path)):
                item_path = os.path.join(abs_path, item)
                is_dir = os.path.isdir(item_path)

                # 过滤隐藏文件和特殊目录
                if item.startswith('.') or item == '__pycache__':
                    continue

                # 只显示目录和支持的文件类型
                if is_dir or item.endswith(('.json', '.csv', '.db', '.sqlite')):
                    items.append({
                        'name': item,
                        'path': item_path,
                        'is_dir': is_dir,
                        'type': 'directory' if is_dir else os.path.splitext(item)[1][1:]
                    })

        # 获取父目录
        parent_path = os.path.dirname(abs_path) if abs_path != project_root else None

        return jsonify({
            'current_path': abs_path,
            'parent_path': parent_path,
            'items': items,
            'project_root': project_root
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/list_files', methods=['GET'])
def list_files():
    """列出示例数据文件"""
    try:
        import os

        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        examples_dir = os.path.join(project_root, 'examples')

        files = []

        # 扫描 examples 目录
        if os.path.exists(examples_dir):
            for item in os.listdir(examples_dir):
                if item.endswith(('.json', '.csv', '.db', '.sqlite')):
                    files.append({
                        'name': item,
                        'path': os.path.join(examples_dir, item),
                        'relative_path': f'../examples/{item}',
                        'type': os.path.splitext(item)[1][1:]
                    })

        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """获取状态"""
    return jsonify({
        'initialized': rag_instance is not None,
        'config': {
            'retrieval_strategy': current_config.retrieval_strategy if current_config else None,
            'enable_graph': current_config.enable_graph if current_config else None,
            'top_k': current_config.top_k if current_config else None
        } if current_config else None
    })


if __name__ == '__main__':
    print("=" * 70)
    print("Universal RAG Web 服务")
    print("=" * 70)
    print("访问地址: http://localhost:5001")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5001)
