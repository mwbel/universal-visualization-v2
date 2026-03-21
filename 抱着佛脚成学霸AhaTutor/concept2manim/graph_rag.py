"""
GraphRAG - 基于知识图谱的检索增强生成
结合现有的 concept_database 和 knowledge_tree，实现图检索和推理
"""

import json
import sqlite3
from typing import List, Dict, Optional, Set, Tuple
from dataclasses import dataclass
from pathlib import Path
from collections import deque


@dataclass
class GraphNode:
    """图节点"""
    id: int
    name: str
    type: str
    chapter: str
    description: Optional[str] = None
    keywords: Optional[List[str]] = None


@dataclass
class GraphEdge:
    """图边"""
    source_id: int
    target_id: int
    relation_type: str
    strength: int


@dataclass
class SearchResult:
    """搜索结果"""
    node: GraphNode
    path: List[str]  # 从起点到该节点的路径
    distance: int  # 距离起点的跳数
    relevance_score: float  # 相关性分数


class GraphRAG:
    """
    GraphRAG 实现

    核心功能：
    1. 图遍历和多跳检索
    2. 路径查找
    3. 子图提取
    4. 概念推理
    """

    def __init__(self, db_path: str = "math_concepts.db"):
        self.db_path = db_path
        self.conn = None
        self.graph = None  # 内存图结构
        self._load_graph()

    def _load_graph(self):
        """加载图到内存"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row

        # 加载节点
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, name, type, chapter, description, keywords
            FROM concepts
        """)

        nodes = {}
        for row in cursor.fetchall():
            keywords = json.loads(row['keywords']) if row['keywords'] else []
            nodes[row['id']] = GraphNode(
                id=row['id'],
                name=row['name'],
                type=row['type'],
                chapter=row['chapter'],
                description=row['description'],
                keywords=keywords
            )

        # 加载边
        cursor.execute("""
            SELECT source_concept_id, target_concept_id, relation_type, strength
            FROM concept_relations
        """)

        edges = []
        for row in cursor.fetchall():
            edges.append(GraphEdge(
                source_id=row['source_concept_id'],
                target_id=row['target_concept_id'],
                relation_type=row['relation_type'],
                strength=row['strength']
            ))

        # 构建邻接表
        self.graph = {
            'nodes': nodes,
            'edges': edges,
            'adjacency': self._build_adjacency(edges)
        }

        print(f"✅ 图加载完成: {len(nodes)} 个节点, {len(edges)} 条边")

    def _build_adjacency(self, edges: List[GraphEdge]) -> Dict[int, List[Tuple[int, str, int]]]:
        """构建邻接表"""
        adjacency = {}
        for edge in edges:
            if edge.source_id not in adjacency:
                adjacency[edge.source_id] = []
            adjacency[edge.source_id].append((
                edge.target_id,
                edge.relation_type,
                edge.strength
            ))
        return adjacency

    def get_node_by_name(self, name: str) -> Optional[GraphNode]:
        """根据名称获取节点"""
        for node in self.graph['nodes'].values():
            if name in node.name or node.name in name:
                return node
        return None

    def multi_hop_search(
        self,
        start_concept: str,
        max_hops: int = 3,
        relation_types: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """
        多跳检索

        Args:
            start_concept: 起始概念
            max_hops: 最大跳数
            relation_types: 关系类型过滤（如 ['prerequisite', 'derived']）

        Returns:
            搜索结果列表
        """
        start_node = self.get_node_by_name(start_concept)
        if not start_node:
            return []

        results = []
        visited = set()
        queue = deque([(start_node.id, [], 0)])  # (node_id, path, distance)

        while queue:
            current_id, path, distance = queue.popleft()

            if current_id in visited or distance > max_hops:
                continue

            visited.add(current_id)
            current_node = self.graph['nodes'][current_id]

            # 添加到结果
            results.append(SearchResult(
                node=current_node,
                path=path + [current_node.name],
                distance=distance,
                relevance_score=1.0 / (distance + 1)  # 简单的相关性分数
            ))

            # 遍历邻居
            if current_id in self.graph['adjacency']:
                for neighbor_id, rel_type, strength in self.graph['adjacency'][current_id]:
                    # 关系类型过滤
                    if relation_types and rel_type not in relation_types:
                        continue

                    if neighbor_id not in visited:
                        queue.append((
                            neighbor_id,
                            path + [current_node.name],
                            distance + 1
                        ))

        return results

    def find_path(
        self,
        start_concept: str,
        end_concept: str,
        max_depth: int = 5
    ) -> Optional[List[str]]:
        """
        查找两个概念之间的路径

        Args:
            start_concept: 起始概念
            end_concept: 目标概念
            max_depth: 最大搜索深度

        Returns:
            路径（概念名称列表），如果不存在则返回 None
        """
        start_node = self.get_node_by_name(start_concept)
        end_node = self.get_node_by_name(end_concept)

        if not start_node or not end_node:
            return None

        # BFS 查找最短路径
        queue = deque([(start_node.id, [start_node.name])])
        visited = set()

        while queue:
            current_id, path = queue.popleft()

            if len(path) > max_depth:
                continue

            if current_id == end_node.id:
                return path

            if current_id in visited:
                continue

            visited.add(current_id)

            # 遍历邻居
            if current_id in self.graph['adjacency']:
                for neighbor_id, _, _ in self.graph['adjacency'][current_id]:
                    if neighbor_id not in visited:
                        neighbor_name = self.graph['nodes'][neighbor_id].name
                        queue.append((neighbor_id, path + [neighbor_name]))

        return None

    def get_subgraph(
        self,
        center_concept: str,
        radius: int = 2
    ) -> Dict:
        """
        提取子图

        Args:
            center_concept: 中心概念
            radius: 半径（跳数）

        Returns:
            子图（包含节点和边）
        """
        results = self.multi_hop_search(center_concept, max_hops=radius)

        # 提取节点ID
        node_ids = set(result.node.id for result in results)

        # 提取相关的边
        subgraph_edges = [
            edge for edge in self.graph['edges']
            if edge.source_id in node_ids and edge.target_id in node_ids
        ]

        # 提取节点
        subgraph_nodes = {
            node_id: self.graph['nodes'][node_id]
            for node_id in node_ids
        }

        return {
            'nodes': subgraph_nodes,
            'edges': subgraph_edges,
            'center': center_concept,
            'radius': radius
        }

    def get_prerequisites_chain(
        self,
        concept: str,
        max_depth: int = 5
    ) -> List[List[str]]:
        """
        获取前置知识链

        返回所有从基础概念到目标概念的路径
        """
        results = self.multi_hop_search(
            concept,
            max_hops=max_depth,
            relation_types=['prerequisite']
        )

        # 按距离分组
        chains = {}
        for result in results:
            depth = result.distance
            if depth not in chains:
                chains[depth] = []
            chains[depth].append(result.path)

        return chains

    def recommend_learning_path(
        self,
        target_concept: str,
        current_knowledge: Optional[List[str]] = None
    ) -> List[str]:
        """
        推荐学习路径

        Args:
            target_concept: 目标概念
            current_knowledge: 已掌握的概念列表

        Returns:
            推荐的学习顺序
        """
        if current_knowledge is None:
            current_knowledge = []

        # 获取所有前置知识
        results = self.multi_hop_search(
            target_concept,
            max_hops=10,
            relation_types=['prerequisite']
        )

        # 过滤已掌握的概念
        to_learn = [
            result for result in results
            if result.node.name not in current_knowledge
        ]

        # 按距离排序（从远到近 = 从基础到高级）
        to_learn.sort(key=lambda x: x.distance, reverse=True)

        return [result.node.name for result in to_learn]

    def export_subgraph_json(
        self,
        center_concept: str,
        radius: int = 2,
        output_path: str = "subgraph.json"
    ):
        """导出子图为 JSON"""
        subgraph = self.get_subgraph(center_concept, radius)

        # 转换为可序列化格式
        export_data = {
            'center': center_concept,
            'radius': radius,
            'nodes': [
                {
                    'id': node.id,
                    'name': node.name,
                    'type': node.type,
                    'chapter': node.chapter
                }
                for node in subgraph['nodes'].values()
            ],
            'edges': [
                {
                    'source': edge.source_id,
                    'target': edge.target_id,
                    'type': edge.relation_type,
                    'strength': edge.strength
                }
                for edge in subgraph['edges']
            ]
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        print(f"✅ 子图已导出: {output_path}")
        return export_data

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


if __name__ == "__main__":
    # 测试 GraphRAG
    with GraphRAG() as graph_rag:
        print("\n=== 测试 1: 多跳检索 ===")
        results = graph_rag.multi_hop_search("导数", max_hops=2)
        print(f"从'导数'出发，2跳内找到 {len(results)} 个相关概念")
        for result in results[:5]:
            print(f"  - {result.node.name} (距离: {result.distance})")

        print("\n=== 测试 2: 路径查找 ===")
        path = graph_rag.find_path("导数", "极限")
        if path:
            print(f"从'导数'到'极限'的路径: {' -> '.join(path)}")
        else:
            print("未找到路径")

        print("\n=== 测试 3: 子图提取 ===")
        subgraph = graph_rag.get_subgraph("导数", radius=1)
        print(f"以'导数'为中心，半径1的子图:")
        print(f"  节点数: {len(subgraph['nodes'])}")
        print(f"  边数: {len(subgraph['edges'])}")

        print("\n=== 测试 4: 学习路径推荐 ===")
        learning_path = graph_rag.recommend_learning_path("偏导数")
        print(f"学习'偏导数'的推荐路径:")
        for i, concept in enumerate(learning_path[:5], 1):
            print(f"  {i}. {concept}")
