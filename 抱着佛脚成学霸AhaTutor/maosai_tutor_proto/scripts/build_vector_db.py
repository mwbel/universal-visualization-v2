#!/usr/bin/env python3
"""
文档预处理脚本 - 构建向量数据库
解析 数学rag 目录中的 Markdown 文件，生成向量嵌入并存入 ChromaDB
"""
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple
import hashlib

# 添加项目根目录到 Python 路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.services.rag_service import get_rag_service


class MarkdownChunker:
    """Markdown 文档智能分块器"""
    
    # 最小和最大块大小
    MIN_CHUNK_SIZE = 100
    MAX_CHUNK_SIZE = 1500
    
    def __init__(self):
        self.chunks = []
    
    def parse_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """
        解析 Markdown 文件并分块
        
        Args:
            file_path: 文件路径
            
        Returns:
            分块列表
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 获取文件主题（从文件名）
        topic = self._extract_topic_from_filename(file_path.stem)
        
        # 分块
        chunks = self._chunk_content(content, topic, str(file_path))
        
        return chunks
    
    def _extract_topic_from_filename(self, filename: str) -> str:
        """从文件名提取主题"""
        # 移除常见后缀
        name = re.sub(r'(p\d+|part\d+)$', '', filename, flags=re.IGNORECASE)
        return name.strip()
    
    def _chunk_content(self, content: str, topic: str, source: str) -> List[Dict[str, Any]]:
        """
        智能分块策略：
        1. 首先按 H2 (##) 分割成大块
        2. 如果大块太大，按 H3 (###) 继续分割
        3. 如果还是太大，按段落分割
        """
        chunks = []
        
        # 按 H2 分割
        h2_sections = re.split(r'\n(?=## )', content)
        
        for section in h2_sections:
            if not section.strip():
                continue
            
            # 提取标题
            title_match = re.match(r'^##\s+(.+)$', section, re.MULTILINE)
            section_title = title_match.group(1).strip() if title_match else topic
            
            # 检查大小
            if len(section) <= self.MAX_CHUNK_SIZE:
                # 直接作为一个块
                chunks.append(self._create_chunk(section, topic, source, section_title))
            else:
                # 按 H3 继续分割
                h3_chunks = self._split_by_h3(section, topic, source, section_title)
                chunks.extend(h3_chunks)
        
        return chunks
    
    def _split_by_h3(self, content: str, topic: str, source: str, parent_title: str) -> List[Dict[str, Any]]:
        """按 H3 分割"""
        chunks = []
        h3_sections = re.split(r'\n(?=### )', content)
        
        for section in h3_sections:
            if not section.strip():
                continue
            
            # 提取 H3 标题
            title_match = re.match(r'^###\s+(.+)$', section, re.MULTILINE)
            section_title = f"{parent_title} - {title_match.group(1).strip()}" if title_match else parent_title
            
            if len(section) <= self.MAX_CHUNK_SIZE:
                chunks.append(self._create_chunk(section, topic, source, section_title))
            else:
                # 按段落分割
                para_chunks = self._split_by_paragraphs(section, topic, source, section_title)
                chunks.extend(para_chunks)
        
        return chunks
    
    def _split_by_paragraphs(self, content: str, topic: str, source: str, title: str) -> List[Dict[str, Any]]:
        """按段落分割"""
        chunks = []
        paragraphs = content.split('\n\n')
        
        current_chunk = ""
        chunk_index = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # 如果添加这段后超过限制，保存当前块并开启新块
            if len(current_chunk) + len(para) > self.MAX_CHUNK_SIZE and current_chunk:
                if len(current_chunk) >= self.MIN_CHUNK_SIZE:
                    chunks.append(self._create_chunk(
                        current_chunk, topic, source, f"{title} (Part {chunk_index + 1})"
                    ))
                    chunk_index += 1
                current_chunk = para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
        
        # 保存最后一块
        if current_chunk and len(current_chunk) >= self.MIN_CHUNK_SIZE:
            suffix = f" (Part {chunk_index + 1})" if chunk_index > 0 else ""
            chunks.append(self._create_chunk(current_chunk, topic, source, f"{title}{suffix}"))
        
        return chunks
    
    def _create_chunk(self, content: str, topic: str, source: str, title: str) -> Dict[str, Any]:
        """创建分块对象"""
        # 生成唯一 ID
        chunk_id = hashlib.md5(f"{source}:{title}:{content[:50]}".encode()).hexdigest()[:16]
        
        # 清理内容
        clean_content = self._clean_content(content)
        
        return {
            'id': f"chunk_{chunk_id}",
            'content': clean_content,
            'metadata': {
                'topic': topic,
                'source': Path(source).name,
                'title': title,
                'char_count': len(clean_content)
            }
        }
    
    def _clean_content(self, content: str) -> str:
        """清理内容"""
        # 移除多余空行
        content = re.sub(r'\n{3,}', '\n\n', content)
        # 移除行首行尾空白
        content = content.strip()
        return content


def build_vector_db():
    """构建向量数据库"""
    print("=" * 60)
    print("开始构建知识库索引...")
    print("=" * 60)
    
    # 获取 RAG 服务
    rag = get_rag_service()
    
    # 清空现有集合
    print("\n清空现有知识库...")
    rag.clear_collection()
    
    # 定位 数学rag 目录
    rag_dir = PROJECT_ROOT / "数学rag"
    if not rag_dir.exists():
        print(f"错误: 找不到目录 {rag_dir}")
        return False
    
    # 获取所有 Markdown 文件
    md_files = list(rag_dir.glob("*.md"))
    print(f"\n找到 {len(md_files)} 个 Markdown 文件")
    
    # 初始化分块器
    chunker = MarkdownChunker()
    all_chunks = []
    
    # 处理每个文件
    for file_path in md_files:
        print(f"\n处理文件: {file_path.name}")
        
        try:
            chunks = chunker.parse_file(file_path)
            all_chunks.extend(chunks)
            print(f"  → 生成 {len(chunks)} 个分块")
        except Exception as e:
            print(f"  ✗ 处理失败: {e}")
    
    print(f"\n总计生成 {len(all_chunks)} 个分块")
    
    # 批量添加到知识库
    if all_chunks:
        print("\n正在添加到向量数据库...")
        
        # 分批添加（每批 100 个）
        batch_size = 100
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i + batch_size]
            success = rag.add_documents(batch)
            if success:
                print(f"  → 已添加 {min(i + batch_size, len(all_chunks))}/{len(all_chunks)} 个文档")
            else:
                print(f"  ✗ 批次添加失败")
    
    # 验证
    print("\n验证知识库...")
    topics = rag.get_topics()
    print(f"知识主题: {len(topics)} 个")
    for topic in topics[:5]:
        print(f"  - {topic['name']}: {topic['count']} 个文档")
    if len(topics) > 5:
        print(f"  ... 还有 {len(topics) - 5} 个主题")
    
    # 测试搜索
    print("\n测试搜索功能...")
    test_query = "三角函数的周期性"
    results = rag.search(test_query, top_k=3)
    print(f"查询: '{test_query}'")
    print(f"返回 {len(results)} 个结果:")
    for i, r in enumerate(results):
        print(f"  {i+1}. [{r.topic}] {r.content[:80]}...")
    
    print("\n" + "=" * 60)
    print("向量数据库构建完成!")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    success = build_vector_db()
    sys.exit(0 if success else 1)
