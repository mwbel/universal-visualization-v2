"""
Markdown 解析器
从高等数学教材的 Markdown 文件中提取概念、定义、定理等
"""

import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ParsedConcept:
    """解析出的概念"""
    name: str
    type: str  # definition, theorem, formula, example
    content: str
    latex_formulas: List[str]
    chapter: str
    section: str
    line_number: int


class MarkdownParser:
    """Markdown 文件解析器"""

    # 概念类型标识
    CONCEPT_PATTERNS = {
        'definition': [r'定义\s*\d+\.\d+\.\d+', r'定义：', r'定义\s+'],
        'theorem': [r'定理\s*\d+\.\d+\.\d+', r'定理：', r'定理\s+'],
        'property': [r'性质\s*\d+', r'性质：'],
        'formula': [r'公式\s*\d+', r'公式：'],
        'example': [r'例\s*\d+\.\d+\.\d+', r'例题\s*\d+', r'例\s+'],
    }

    def __init__(self, books_dir: str):
        """
        初始化解析器

        Args:
            books_dir: 教材目录路径
        """
        self.books_dir = Path(books_dir)

    def parse_all_chapters(self) -> List[ParsedConcept]:
        """解析所有章节"""
        all_concepts = []

        # 获取所有章节文件（01-13章）
        chapter_files = sorted(self.books_dir.glob("0[0-9]_第*章*.md"))

        for chapter_file in chapter_files:
            print(f"📖 解析: {chapter_file.name}")
            concepts = self.parse_chapter(chapter_file)
            all_concepts.extend(concepts)
            print(f"   找到 {len(concepts)} 个概念")

        return all_concepts

    def parse_chapter(self, file_path: Path) -> List[ParsedConcept]:
        """解析单个章节文件"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

        # 提取章节信息
        chapter_name = self._extract_chapter_name(file_path.name)

        concepts = []
        current_section = ""

        i = 0
        while i < len(lines):
            line = lines[i]

            # 更新当前小节
            if line.startswith('# ') and not line.startswith('# 第'):
                current_section = line.strip('# ').strip()

            # 检测概念类型
            concept_type = self._detect_concept_type(line)

            if concept_type:
                # 提取概念内容
                concept_data = self._extract_concept(
                    lines, i, concept_type, chapter_name, current_section
                )
                if concept_data:
                    concepts.append(concept_data)

            i += 1

        return concepts

    def _extract_chapter_name(self, filename: str) -> str:
        """从文件名提取章节名"""
        match = re.search(r'第(\d+)章', filename)
        if match:
            return f"第{match.group(1)}章"
        return "未知章节"

    def _detect_concept_type(self, line: str) -> Optional[str]:
        """检测行是否包含概念标识"""
        for concept_type, patterns in self.CONCEPT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, line):
                    return concept_type
        return None

    def _extract_concept(self, lines: List[str], start_idx: int,
                        concept_type: str, chapter: str, section: str) -> Optional[ParsedConcept]:
        """提取概念的完整内容"""
        # 提取概念名称
        name = self._extract_concept_name(lines[start_idx], concept_type)
        if not name:
            return None

        # 提取内容（直到下一个标题或空行）
        content_lines = []
        formulas = []

        i = start_idx + 1
        while i < len(lines):
            line = lines[i]

            # 遇到新的概念或大标题，停止
            if self._detect_concept_type(line) or line.startswith('# '):
                break

            # 提取 LaTeX 公式
            latex_matches = re.findall(r'\$\$(.*?)\$\$', line, re.DOTALL)
            formulas.extend([f.strip() for f in latex_matches])

            inline_latex = re.findall(r'\$([^\$]+)\$', line)
            formulas.extend([f.strip() for f in inline_latex if len(f) > 3])

            content_lines.append(line)

            # 连续两个空行，停止
            if i > start_idx + 1 and not line.strip() and not lines[i-1].strip():
                break

            i += 1

        content = '\n'.join(content_lines).strip()

        # 过滤掉太短的内容
        if len(content) < 10:
            return None

        return ParsedConcept(
            name=name,
            type=concept_type,
            content=content,
            latex_formulas=list(set(formulas)),  # 去重
            chapter=chapter,
            section=section,
            line_number=start_idx + 1
        )

    def _extract_concept_name(self, line: str, concept_type: str) -> Optional[str]:
        """从行中提取概念名称"""
        # 移除 Markdown 标记
        line = re.sub(r'^#+\s*', '', line)

        # 尝试不同的模式
        patterns = [
            r'定义\s*\d+\.\d+\.\d+\s+(.+)',  # 定义2.1.1 数列
            r'定理\s*\d+\.\d+\.\d+\s+(.+)',  # 定理3.1.1 导数
            r'例\s*\d+\.\d+\.\d+\s+(.+)',    # 例2.1.1
            r'定义：\s*(.+)',
            r'定理：\s*(.+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                name = match.group(1).strip()
                # 清理名称
                name = re.sub(r'\s*\(.*?\)\s*', '', name)  # 移除括号内容
                name = re.sub(r'\s+', ' ', name)  # 规范化空格
                return name[:50]  # 限制长度

        # 如果没有匹配，尝试提取关键词
        if concept_type == 'definition':
            # 查找"称为"、"叫做"等关键词
            match = re.search(r'称为(.+?)(?:[，。,\.]|$)', line)
            if match:
                return match.group(1).strip()[:30]

        return None

    def extract_key_concepts(self, min_importance: int = 3) -> List[Dict]:
        """
        提取关键概念（定义和定理）

        Args:
            min_importance: 最小重要性（1-5）

        Returns:
            关键概念列表
        """
        all_concepts = self.parse_all_chapters()

        # 过滤关键概念
        key_concepts = [
            c for c in all_concepts
            if c.type in ['definition', 'theorem'] and len(c.latex_formulas) > 0
        ]

        return key_concepts

    def generate_concept_summary(self) -> Dict[str, List[str]]:
        """生成概念摘要（按章节）"""
        all_concepts = self.parse_all_chapters()

        summary = {}
        for concept in all_concepts:
            chapter = concept.chapter
            if chapter not in summary:
                summary[chapter] = []

            summary[chapter].append({
                'name': concept.name,
                'type': concept.type,
                'section': concept.section,
                'has_formula': len(concept.latex_formulas) > 0
            })

        return summary


def extract_prerequisites_from_text(text: str) -> List[str]:
    """
    从文本中提取前置知识

    通过识别"需要"、"基于"、"利用"等关键词
    """
    prerequisites = []

    # 关键词模式
    patterns = [
        r'需要(?:先)?(?:理解|掌握|了解)(.+?)(?:[，。,\.])',
        r'基于(.+?)(?:[，。,\.])',
        r'利用(.+?)(?:[，。,\.])',
        r'根据(.+?)(?:[，。,\.])',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text)
        prerequisites.extend(matches)

    # 清理和去重
    prerequisites = [p.strip() for p in prerequisites]
    prerequisites = list(set(prerequisites))

    return prerequisites


if __name__ == "__main__":
    # 测试解析器
    books_dir = "/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/concept2manim/books/高等数学"

    parser = MarkdownParser(books_dir)

    print("=" * 60)
    print("开始解析高等数学教材")
    print("=" * 60)

    # 解析所有章节
    concepts = parser.parse_all_chapters()

    print(f"\n📊 解析完成!")
    print(f"总共找到 {len(concepts)} 个概念")

    # 按类型统计
    type_counts = {}
    for c in concepts:
        type_counts[c.type] = type_counts.get(c.type, 0) + 1

    print(f"\n按类型统计:")
    for ctype, count in sorted(type_counts.items()):
        print(f"  {ctype}: {count}")

    # 显示前10个概念
    print(f"\n前10个概念:")
    for i, concept in enumerate(concepts[:10], 1):
        print(f"{i}. [{concept.type}] {concept.name}")
        print(f"   章节: {concept.chapter} - {concept.section}")
        if concept.latex_formulas:
            print(f"   公式数: {len(concept.latex_formulas)}")
        print()
