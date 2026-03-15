#!/usr/bin/env python3
"""
高等数学知识库数据导入框架
用于将 books/高等数学/ 目录下的教材内容导入知识库系统
"""

import json
import re
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class KnowledgeNode:
    """知识节点数据模型"""

    id: str
    subject: str
    chapter: str
    section: str
    label: str
    title: str
    details: str
    viz: Dict[str, Any]
    ui_binding: Dict[str, Any]
    metadata: Dict[str, Any]


class AdvancedMathImporter:
    """高等数学知识库导入器"""

    # 章节映射表
    CHAPTER_MAPPING = {
        "01": {
            "name": "第1章 基本知识",
            "sections": ["集合与逻辑", "实数与函数", "初等函数"],
        },
        "02": {
            "name": "第2章 极限与连续",
            "sections": ["数列极限", "函数极限", "极限运算法则", "连续性"],
        },
        "03": {
            "name": "第3章 导数与微分",
            "sections": ["导数概念", "求导法则", "微分", "高阶导数"],
        },
        "04": {
            "name": "第4章 微分中值定理与导数的应用",
            "sections": ["中值定理", "洛必达法则", "泰勒公式", "函数性态"],
        },
        "05": {
            "name": "第5章 积分",
            "sections": ["不定积分", "定积分", "积分应用", "反常积分"],
        },
        "06": {
            "name": "第6章 定积分的应用",
            "sections": ["几何应用", "物理应用", "经济应用"],
        },
        "07": {
            "name": "第7章 空间解析几何",
            "sections": ["向量代数", "平面与直线", "曲面与曲线"],
        },
        "08": {
            "name": "第8章 多元函数微分学及其应用",
            "sections": ["多元函数", "偏导数", "全微分", "极值"],
        },
        "09": {"name": "第9章 重积分", "sections": ["二重积分", "三重积分", "应用"]},
        "10": {
            "name": "第10章 曲线积分和曲面积分",
            "sections": ["曲线积分", "曲面积分", "场论"],
        },
        "11": {
            "name": "第11章 无穷级数",
            "sections": ["数项级数", "幂级数", "傅里叶级数"],
        },
        "12": {
            "name": "第12章 微分方程",
            "sections": ["一阶方程", "高阶方程", "方程组"],
        },
        "13": {
            "name": "第13章 差分方程",
            "sections": ["差分概念", "一阶差分方程", "应用"],
        },
    }

    # 可视化组件映射
    VIZ_MAPPING = {
        "极限": {"viz_id": "limit_animator", "tech": ["D3.js", "Rough.js"]},
        "导数": {"viz_id": "derivative_visualizer", "tech": ["D3.js", "KaTeX"]},
        "积分": {"viz_id": "integral_visualizer", "tech": ["D3.js", "Rough.js"]},
        "函数": {"viz_id": "function_plotter", "tech": ["Plotly", "MathJax"]},
        "几何": {"viz_id": "geometry_viewer", "tech": ["Three.js", "D3.js"]},
        "级数": {"viz_id": "series_visualizer", "tech": ["D3.js", "Rough.js"]},
        "方程": {"viz_id": "equation_solver", "tech": ["KaTeX", "CustomControls"]},
        "向量": {"viz_id": "vector_lab", "tech": ["Plotly", "CustomControls"]},
        "默认": {"viz_id": "info_card", "tech": ["Markdown", "MathJax"]},
    }

    def __init__(self, books_dir: Path, output_dir: Path):
        self.books_dir = books_dir
        self.output_dir = output_dir
        self.knowledge_nodes: List[KnowledgeNode] = []
        self.processed_files: List[str] = []

    def generate_node_id(
        self, chapter_num: str, section_idx: int, point_idx: int
    ) -> str:
        """生成知识节点ID"""
        return f"adv_math.C{chapter_num}.S{section_idx:02d}.P{point_idx:03d}"

    def detect_viz_type(self, content: str, title: str) -> Dict[str, Any]:
        """根据内容自动检测可视化类型"""
        content_lower = (content + title).lower()

        for keyword, viz_config in self.VIZ_MAPPING.items():
            if keyword in content_lower:
                return {
                    "viz_id": viz_config["viz_id"],
                    "viz_desc": f"{keyword}可视化组件",
                    "tech": viz_config["tech"],
                }

        return {
            "viz_id": "info_card",
            "viz_desc": "概念卡片/步骤推导",
            "tech": ["Markdown", "MathJax"],
        }

    def parse_chapter_content(self, file_path: Path) -> List[KnowledgeNode]:
        """解析章节内容，提取知识点"""
        nodes = []
        content = file_path.read_text(encoding="utf-8")

        # 提取章节号
        chapter_match = re.search(r"(\d+)_第(\d+)章", file_path.name)
        if not chapter_match:
            return nodes

        file_num = chapter_match.group(1)
        chapter_num = chapter_match.group(2)
        chapter_info = self.CHAPTER_MAPPING.get(
            chapter_num, {"name": f"第{chapter_num}章", "sections": ["概览"]}
        )

        # 按知识点分割（使用标题模式）
        # 匹配类似 "### 1.1 知识点名称" 或 "## 1. 知识点" 的模式
        pattern = r"(?:^|\n)(?:#{1,3}\s*)(\d+(?:\.\d+)?)\s*([^\n]+)"
        sections = re.split(pattern, content)

        if len(sections) < 3:
            # 如果没有找到标准格式，按段落分割
            return self._parse_by_paragraphs(content, chapter_num, chapter_info)

        point_idx = 1
        for i in range(1, len(sections), 3):
            if i + 2 > len(sections):
                break

            label = sections[i].strip()
            title = sections[i + 1].strip()
            details = sections[i + 2].strip() if i + 2 < len(sections) else ""

            # 限制details长度
            details = details[:2000] + "..." if len(details) > 2000 else details

            # 确定section
            section_idx = min(
                int(float(label.split(".")[0])) - 1, len(chapter_info["sections"]) - 1
            )
            section = chapter_info["sections"][max(0, section_idx)]

            # 检测可视化类型
            viz = self.detect_viz_type(details, title)

            node = KnowledgeNode(
                id=self.generate_node_id(chapter_num, section_idx + 1, point_idx),
                subject="高等数学",
                chapter=chapter_info["name"],
                section=section,
                label=label,
                title=title,
                details=details,
                viz=viz,
                ui_binding={
                    "project_path": ["高等数学", chapter_info["name"], section],
                    "default_view_id": viz["viz_id"],
                    "search_keywords": self._extract_keywords(title, details),
                },
                metadata={
                    "source_file": file_path.name,
                    "imported_at": datetime.now().isoformat(),
                    "version": "1.0",
                },
            )

            nodes.append(node)
            point_idx += 1

        return nodes

    def _parse_by_paragraphs(
        self, content: str, chapter_num: str, chapter_info: Dict
    ) -> List[KnowledgeNode]:
        """按段落解析内容（备用方法）"""
        nodes = []
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

        point_idx = 1
        for i, para in enumerate(paragraphs[:50]):  # 限制每章最多50个知识点
            if len(para) < 20:  # 跳过太短的段落
                continue

            # 提取标题（第一行或前50字符）
            lines = para.split("\n")
            title = lines[0][:100] if lines else f"知识点 {point_idx}"
            details = para[:1500]

            section = (
                chapter_info["sections"][0] if chapter_info["sections"] else "概览"
            )
            viz = self.detect_viz_type(details, title)

            node = KnowledgeNode(
                id=self.generate_node_id(chapter_num, 1, point_idx),
                subject="高等数学",
                chapter=chapter_info["name"],
                section=section,
                label=str(point_idx),
                title=title,
                details=details,
                viz=viz,
                ui_binding={
                    "project_path": ["高等数学", chapter_info["name"], section],
                    "default_view_id": viz["viz_id"],
                    "search_keywords": self._extract_keywords(title, details),
                },
                metadata={
                    "source_file": "auto_parsed",
                    "imported_at": datetime.now().isoformat(),
                    "version": "1.0",
                },
            )

            nodes.append(node)
            point_idx += 1

        return nodes

    def _extract_keywords(self, title: str, details: str) -> List[str]:
        """提取搜索关键词"""
        text = (title + " " + details).lower()

        # 数学关键词列表
        math_keywords = [
            "极限",
            "导数",
            "微分",
            "积分",
            "函数",
            "连续",
            "级数",
            "方程",
            "向量",
            "矩阵",
            "行列式",
            "几何",
            "空间",
            "曲面",
            "曲线",
            "偏导",
            "重积分",
            "线积分",
            "面积分",
            "泰勒",
            "洛必达",
            "牛顿",
            "莱布尼茨",
            "微积分",
            "定理",
            "公式",
        ]

        keywords = []
        for keyword in math_keywords:
            if keyword in text:
                keywords.append(keyword)

        # 添加标题中的前5个词
        title_words = title.split()[:5]
        keywords.extend([w for w in title_words if len(w) > 1])

        return list(set(keywords))[:20]  # 最多20个关键词

    def import_all_chapters(self, max_chapters: int = 13) -> Dict[str, Any]:
        """导入所有章节"""
        stats = {"total_files": 0, "processed_files": 0, "total_nodes": 0, "errors": []}

        # 查找所有章节文件
        chapter_files = sorted(self.books_dir.glob("*_第*_*.md"))

        for file_path in chapter_files[:max_chapters]:
            stats["total_files"] += 1

            try:
                nodes = self.parse_chapter_content(file_path)
                self.knowledge_nodes.extend(nodes)
                self.processed_files.append(file_path.name)
                stats["processed_files"] += 1
                stats["total_nodes"] += len(nodes)
                print(f"✓ 已处理: {file_path.name} -> {len(nodes)} 个知识点")
            except Exception as e:
                error_msg = f"处理 {file_path.name} 时出错: {str(e)}"
                stats["errors"].append(error_msg)
                print(f"✗ {error_msg}")

        return stats

    def export_to_jsonc(self) -> Path:
        """导出为JSONC格式"""
        output_file = self.output_dir / "advanced_math_catalog.jsonc"

        catalog = {
            "themeName": "AdvancedMath",
            "description": "高等数学知识库 - 包含13章核心内容",
            "version": "1.0.0",
            "created_at": datetime.now().isoformat(),
            "knowledge_nodes": [asdict(node) for node in self.knowledge_nodes],
        }

        # 写入文件（带注释）
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("// 高等数学知识库目录\n")
            f.write(f"// 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"// 知识点总数: {len(self.knowledge_nodes)}\n\n")
            json.dump(catalog, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 知识库已导出到: {output_file}")
        return output_file

    def generate_import_report(self) -> str:
        """生成导入报告"""
        report = []
        report.append("=" * 60)
        report.append("高等数学知识库导入报告")
        report.append("=" * 60)
        report.append(f"\n总知识点数: {len(self.knowledge_nodes)}")
        report.append(f"处理文件数: {len(self.processed_files)}")

        # 按章节统计
        chapter_stats = {}
        for node in self.knowledge_nodes:
            chapter = node.chapter
            chapter_stats[chapter] = chapter_stats.get(chapter, 0) + 1

        report.append("\n各章节知识点分布:")
        for chapter, count in sorted(chapter_stats.items()):
            report.append(f"  {chapter}: {count} 个知识点")

        # 可视化组件统计
        viz_stats = {}
        for node in self.knowledge_nodes:
            viz_id = node.viz.get("viz_id", "unknown")
            viz_stats[viz_id] = viz_stats.get(viz_id, 0) + 1

        report.append("\n可视化组件分布:")
        for viz_id, count in sorted(viz_stats.items(), key=lambda x: -x[1]):
            report.append(f"  {viz_id}: {count} 个节点")

        report.append("\n" + "=" * 60)
        return "\n".join(report)


def main():
    """主函数"""
    # 设置路径
    workspace_root = Path(__file__).parent.parent
    books_dir = workspace_root / ".." / "books" / "高等数学"
    output_dir = workspace_root / "data"
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("高等数学知识库导入工具")
    print("=" * 60)

    # 检查目录
    if not books_dir.exists():
        print(f"\n✗ 错误: 找不到教材目录 {books_dir}")
        print("请确保 books/高等数学/ 目录存在")
        return

    print(f"\n教材目录: {books_dir}")
    print(f"输出目录: {output_dir}")

    # 创建导入器
    importer = AdvancedMathImporter(books_dir, output_dir)

    # 导入所有章节
    print("\n开始导入...")
    stats = importer.import_all_chapters(max_chapters=13)

    # 导出结果
    if importer.knowledge_nodes:
        output_file = importer.export_to_jsonc()

        # 打印报告
        report = importer.generate_import_report()
        print(report)

        # 保存报告
        report_file = output_dir / "import_report.txt"
        report_file.write_text(report, encoding="utf-8")
        print(f"\n✓ 报告已保存到: {report_file}")
    else:
        print("\n✗ 没有成功导入任何知识点")
        print("\n错误详情:")
        for error in stats.get("errors", []):
            print(f"  - {error}")


if __name__ == "__main__":
    main()
