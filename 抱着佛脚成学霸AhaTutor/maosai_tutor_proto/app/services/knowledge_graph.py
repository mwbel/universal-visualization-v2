"""
知识图谱服务模块
用于构建和查询高等数学知识图谱
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field


@dataclass
class KnowledgeNode:
    """知识节点"""

    id: str
    title: str
    chapter: str
    section: str
    subject: str
    label: str
    prerequisites: List[str] = field(default_factory=list)
    related: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class KnowledgeEdge:
    """知识边"""

    source: str
    target: str
    relation_type: str  # "prerequisite", "related", "example_of", "part_of"
    weight: float = 1.0


class KnowledgeGraph:
    """知识图谱"""

    def __init__(self):
        self.nodes: Dict[str, KnowledgeNode] = {}
        self.edges: List[KnowledgeEdge] = []
        self.chapter_order = [
            "第1章",
            "第2章",
            "第3章",
            "第4章",
            "第5章",
            "第6章",
            "第7章",
            "第8章",
            "第9章",
            "第10章",
            "第11章",
            "第12章",
            "第13章",
        ]

    def add_node(self, node: KnowledgeNode):
        """添加节点"""
        self.nodes[node.id] = node

    def add_edge(self, edge: KnowledgeEdge):
        """添加边"""
        self.edges.append(edge)

    def get_node(self, node_id: str) -> Optional[KnowledgeNode]:
        """获取节点"""
        return self.nodes.get(node_id)

    def get_prerequisites(self, node_id: str) -> List[KnowledgeNode]:
        """获取前置知识点"""
        prerequisites = []
        for edge in self.edges:
            if edge.target == node_id and edge.relation_type == "prerequisite":
                node = self.nodes.get(edge.source)
                if node:
                    prerequisites.append(node)
        return prerequisites

    def get_related(self, node_id: str) -> List[KnowledgeNode]:
        """获取相关知识点"""
        related = []
        for edge in self.edges:
            if (
                edge.source == node_id or edge.target == node_id
            ) and edge.relation_type == "related":
                other_id = edge.target if edge.source == node_id else edge.source
                node = self.nodes.get(other_id)
                if node:
                    related.append(node)
        return related

    def get_learning_path(self, target_node_id: str) -> List[KnowledgeNode]:
        """获取学习路径（从基础到目标知识点）"""
        path = []
        visited = set()

        def dfs(node_id: str):
            if node_id in visited:
                return
            visited.add(node_id)

            # 先访问前置知识点
            prerequisites = self.get_prerequisites(node_id)
            for prereq in prerequisites:
                dfs(prereq.id)

            # 再添加当前节点
            node = self.nodes.get(node_id)
            if node:
                path.append(node)

        dfs(target_node_id)
        return path

    def get_chapter_nodes(self, chapter: str) -> List[KnowledgeNode]:
        """获取某章节的所有知识点"""
        return [node for node in self.nodes.values() if node.chapter == chapter]

    def search_by_keyword(self, keyword: str) -> List[KnowledgeNode]:
        """根据关键词搜索知识点"""
        results = []
        keyword_lower = keyword.lower()
        for node in self.nodes.values():
            if (
                keyword_lower in node.title.lower()
                or keyword_lower in node.section.lower()
            ):
                results.append(node)
        return results

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        chapter_stats = {}
        for node in self.nodes.values():
            chapter = node.chapter
            chapter_stats[chapter] = chapter_stats.get(chapter, 0) + 1

        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "chapters": len(chapter_stats),
            "chapter_distribution": chapter_stats,
        }


class KnowledgeGraphBuilder:
    """知识图谱构建器"""

    # 章节前置关系定义
    CHAPTER_PREREQUISITES = {
        "第2章": ["第1章"],  # 极限与连续 <- 基本知识
        "第3章": ["第2章"],  # 导数与微分 <- 极限与连续
        "第4章": ["第3章"],  # 中值定理 <- 导数与微分
        "第5章": ["第3章"],  # 积分 <- 导数与微分
        "第6章": ["第5章"],  # 定积分应用 <- 积分
        "第7章": ["第1章"],  # 空间几何 <- 基本知识
        "第8章": ["第3章", "第7章"],  # 多元微分 <- 导数、空间几何
        "第9章": ["第5章", "第7章"],  # 重积分 <- 积分、空间几何
        "第10章": ["第7章", "第9章"],  # 曲线曲面积分 <- 空间几何、重积分
        "第11章": ["第2章"],  # 级数 <- 极限
        "第12章": ["第5章"],  # 微分方程 <- 积分
        "第13章": ["第12章"],  # 差分方程 <- 微分方程
    }

    # 关键词关联关系
    KEYWORD_RELATIONS = {
        "导数": ["微分", "切线", "变化率"],
        "积分": ["不定积分", "定积分", "原函数"],
        "极限": ["连续", "无穷小", "收敛"],
        "偏导数": ["全微分", "方向导数", "梯度"],
        "级数": ["收敛", "发散", "泰勒级数"],
    }

    def __init__(self, catalog_path: Path):
        self.catalog_path = catalog_path
        self.graph = KnowledgeGraph()

    def load_catalog(self) -> dict:
        """加载知识库目录"""
        with open(self.catalog_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            json_lines = [line for line in lines if not line.strip().startswith("//")]
            json_content = "".join(json_lines)
            return json.loads(json_content)

    def build(self) -> KnowledgeGraph:
        """构建知识图谱"""
        print("=" * 60)
        print("知识图谱构建工具")
        print("=" * 60)

        # 加载知识库
        print(f"\n加载知识库: {self.catalog_path}")
        catalog = self.load_catalog()
        knowledge_nodes = catalog.get("knowledge_nodes", [])
        print(f"✓ 加载了 {len(knowledge_nodes)} 个知识点")

        # 添加节点
        print("\n添加节点到图谱...")
        for node_data in knowledge_nodes:
            node = KnowledgeNode(
                id=node_data["id"],
                title=node_data["title"],
                chapter=node_data["chapter"],
                section=node_data["section"],
                subject=node_data["subject"],
                label=node_data["label"],
                metadata=node_data.get("metadata", {}),
            )
            self.graph.add_node(node)
        print(f"✓ 添加了 {len(self.graph.nodes)} 个节点")

        # 构建章节前置关系
        print("\n构建章节前置关系...")
        self._build_chapter_prerequisites()

        # 构建关键词关联关系
        print("构建关键词关联关系...")
        self._build_keyword_relations()

        # 构建同章节关联
        print("构建同章节关联关系...")
        self._build_chapter_relations()

        print(f"✓ 添加了 {len(self.graph.edges)} 条边")

        # 统计信息
        stats = self.graph.get_stats()
        print(f"\n图谱统计:")
        print(f"  节点数: {stats['total_nodes']}")
        print(f"  边数: {stats['total_edges']}")
        print(f"  章节数: {stats['chapters']}")

        return self.graph

    def _build_chapter_prerequisites(self):
        """构建章节前置关系"""
        for target_chapter, prereq_chapters in self.CHAPTER_PREREQUISITES.items():
            target_nodes = self.graph.get_chapter_nodes(target_chapter)
            for prereq_chapter in prereq_chapters:
                prereq_nodes = self.graph.get_chapter_nodes(prereq_chapter)

                # 为每个目标章节的节点添加前置章节的代表性节点
                for target_node in target_nodes[:3]:  # 只取前3个节点
                    for prereq_node in prereq_nodes[:2]:  # 只取前2个前置节点
                        edge = KnowledgeEdge(
                            source=prereq_node.id,
                            target=target_node.id,
                            relation_type="prerequisite",
                            weight=0.8,
                        )
                        self.graph.add_edge(edge)

    def _build_keyword_relations(self):
        """构建关键词关联关系"""
        for keyword, related_keywords in self.KEYWORD_RELATIONS.items():
            keyword_nodes = self.graph.search_by_keyword(keyword)

            for related_keyword in related_keywords:
                related_nodes = self.graph.search_by_keyword(related_keyword)

                # 建立关联
                for node1 in keyword_nodes[:5]:  # 限制数量
                    for node2 in related_nodes[:3]:
                        if node1.id != node2.id:
                            edge = KnowledgeEdge(
                                source=node1.id,
                                target=node2.id,
                                relation_type="related",
                                weight=0.6,
                            )
                            self.graph.add_edge(edge)

    def _build_chapter_relations(self):
        """构建同章节内的关联关系"""
        for chapter in self.graph.chapter_order:
            nodes = self.graph.get_chapter_nodes(chapter)

            # 相邻节点建立关联
            for i in range(len(nodes) - 1):
                edge = KnowledgeEdge(
                    source=nodes[i].id,
                    target=nodes[i + 1].id,
                    relation_type="related",
                    weight=0.5,
                )
                self.graph.add_edge(edge)

    def export_to_json(self, output_path: Path):
        """导出为JSON格式"""
        data = {
            "nodes": [
                {
                    "id": node.id,
                    "title": node.title,
                    "chapter": node.chapter,
                    "section": node.section,
                    "subject": node.subject,
                    "label": node.label,
                }
                for node in self.graph.nodes.values()
            ],
            "edges": [
                {
                    "source": edge.source,
                    "target": edge.target,
                    "type": edge.relation_type,
                    "weight": edge.weight,
                }
                for edge in self.graph.edges
            ],
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 知识图谱已导出到: {output_path}")


def main():
    """主函数"""
    workspace_root = Path(__file__).parent.parent.parent
    catalog_path = workspace_root / "data" / "advanced_math_catalog.jsonc"
    output_path = workspace_root / "data" / "knowledge_graph.json"

    if not catalog_path.exists():
        print(f"✗ 错误: 找不到知识库文件 {catalog_path}")
        return

    # 构建图谱
    builder = KnowledgeGraphBuilder(catalog_path)
    graph = builder.build()

    # 导出
    builder.export_to_json(output_path)

    # 测试功能
    print("\n" + "=" * 60)
    print("测试图谱功能")
    print("=" * 60)

    # 测试搜索
    print("\n1. 搜索'导数'相关知识点:")
    results = graph.search_by_keyword("导数")
    for node in results[:5]:
        print(f"   - [{node.chapter}] {node.title}")

    # 测试学习路径
    if results:
        target_node = results[0]
        print(f"\n2. 学习路径到'{target_node.title}':")
        path = graph.get_learning_path(target_node.id)
        for i, node in enumerate(path[-5:], 1):  # 只显示最后5个
            print(f"   {i}. [{node.chapter}] {node.title}")

    print("\n" + "=" * 60)
    print("✓ 知识图谱构建完成")
    print("=" * 60)


if __name__ == "__main__":
    main()
