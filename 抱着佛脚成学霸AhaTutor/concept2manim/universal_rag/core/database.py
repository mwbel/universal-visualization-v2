"""
数据库适配器 - 支持多种数据源
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import sqlite3
import json
from pathlib import Path


class DatabaseAdapter(ABC):
    """数据库适配器基类"""

    @abstractmethod
    def connect(self):
        """连接数据库"""
        pass

    @abstractmethod
    def get_documents(self, filters: Optional[Dict] = None) -> List[Dict]:
        """获取文档列表"""
        pass

    @abstractmethod
    def get_document_by_id(self, doc_id: Any) -> Optional[Dict]:
        """根据ID获取文档"""
        pass

    @abstractmethod
    def get_relations(self, source_id: Any) -> List[Dict]:
        """获取关系"""
        pass

    @abstractmethod
    def search(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索文档"""
        pass

    @abstractmethod
    def close(self):
        """关闭连接"""
        pass


class SQLiteAdapter(DatabaseAdapter):
    """SQLite 适配器"""

    def __init__(self, config):
        self.config = config
        self.conn = None

    def connect(self):
        """连接数据库"""
        self.conn = sqlite3.connect(self.config.data_source_path)
        self.conn.row_factory = sqlite3.Row

    def get_documents(self, filters: Optional[Dict] = None) -> List[Dict]:
        """获取文档列表"""
        cursor = self.conn.cursor()

        query = f"SELECT * FROM {self.config.documents_table}"
        params = []

        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(f"{key} = ?")
                params.append(value)
            query += " WHERE " + " AND ".join(conditions)

        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    def get_document_by_id(self, doc_id: Any) -> Optional[Dict]:
        """根据ID获取文档"""
        cursor = self.conn.cursor()
        cursor.execute(
            f"SELECT * FROM {self.config.documents_table} WHERE {self.config.id_field} = ?",
            (doc_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_relations(self, source_id: Any) -> List[Dict]:
        """获取关系"""
        if not self.config.enable_graph:
            return []

        cursor = self.conn.cursor()

        # 检查关系表是否存在
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (self.config.relations_table,)
        )
        if not cursor.fetchone():
            return []

        cursor.execute(
            f"SELECT * FROM {self.config.relations_table} WHERE source_concept_id = ?",
            (source_id,)
        )
        return [dict(row) for row in cursor.fetchall()]

    def search(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索文档"""
        cursor = self.conn.cursor()

        # 简单的 LIKE 搜索
        search_query = f"""
            SELECT * FROM {self.config.documents_table}
            WHERE {self.config.content_field} LIKE ?
               OR {self.config.title_field} LIKE ?
            LIMIT ?
        """

        search_term = f"%{query}%"
        cursor.execute(search_query, (search_term, search_term, limit))
        return [dict(row) for row in cursor.fetchall()]

    def close(self):
        """关闭连接"""
        if self.conn:
            self.conn.close()


class JSONAdapter(DatabaseAdapter):
    """JSON 文件适配器"""

    def __init__(self, config):
        self.config = config
        self.data = None
        self.relations = None

    def connect(self):
        """加载 JSON 文件"""
        with open(self.config.data_source_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 支持两种格式
        if isinstance(data, dict):
            self.data = data.get('documents', [])
            self.relations = data.get('relations', [])
        else:
            self.data = data
            self.relations = []

    def get_documents(self, filters: Optional[Dict] = None) -> List[Dict]:
        """获取文档列表"""
        if not filters:
            return self.data

        # 过滤文档
        filtered = []
        for doc in self.data:
            match = True
            for key, value in filters.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                filtered.append(doc)
        return filtered

    def get_document_by_id(self, doc_id: Any) -> Optional[Dict]:
        """根据ID获取文档"""
        for doc in self.data:
            if doc.get(self.config.id_field) == doc_id:
                return doc
        return None

    def get_relations(self, source_id: Any) -> List[Dict]:
        """获取关系"""
        if not self.config.enable_graph or not self.relations:
            return []

        return [
            rel for rel in self.relations
            if rel.get('source_id') == source_id
        ]

    def search(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索文档"""
        query_lower = query.lower()
        results = []

        for doc in self.data:
            content = str(doc.get(self.config.content_field, "")).lower()
            title = str(doc.get(self.config.title_field, "")).lower()

            if query_lower in content or query_lower in title:
                results.append(doc)

            if len(results) >= limit:
                break

        return results

    def close(self):
        """关闭连接"""
        pass


class CSVAdapter(DatabaseAdapter):
    """CSV 文件适配器"""

    def __init__(self, config):
        self.config = config
        self.data = None
        self.relations = []

    def connect(self):
        """加载 CSV 文件"""
        import csv
        import os

        # 加载文档
        self.data = []
        with open(self.config.data_source_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.data = list(reader)

        # 加载关系（如果存在）
        relations_path = self.config.relations_table
        if relations_path and os.path.exists(relations_path):
            with open(relations_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.relations = list(reader)

    def get_documents(self, filters: Optional[Dict] = None) -> List[Dict]:
        """获取文档列表"""
        if not filters:
            return self.data

        filtered = []
        for doc in self.data:
            match = True
            for key, value in filters.items():
                if doc.get(key) != str(value):
                    match = False
                    break
            if match:
                filtered.append(doc)
        return filtered

    def get_document_by_id(self, doc_id: Any) -> Optional[Dict]:
        """根据ID获取文档"""
        for doc in self.data:
            if doc.get(self.config.id_field) == str(doc_id):
                return doc
        return None

    def get_relations(self, source_id: Any) -> List[Dict]:
        """获取关系"""
        results = []
        for rel in self.relations:
            if rel.get('source_id') == str(source_id):
                results.append(rel)
        return results

    def search(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索文档"""
        query_lower = query.lower()
        results = []

        for doc in self.data:
            content = str(doc.get(self.config.content_field, "")).lower()
            title = str(doc.get(self.config.title_field, "")).lower()

            if query_lower in content or query_lower in title:
                results.append(doc)

            if len(results) >= limit:
                break

        return results

    def close(self):
        """关闭连接"""
        pass


def create_adapter(config) -> DatabaseAdapter:
    """工厂方法：根据配置创建适配器"""
    adapters = {
        'sqlite': SQLiteAdapter,
        'json': JSONAdapter,
        'csv': CSVAdapter,
    }

    adapter_class = adapters.get(config.data_source_type)
    if not adapter_class:
        raise ValueError(f"Unsupported data source type: {config.data_source_type}")

    adapter = adapter_class(config)
    adapter.connect()
    return adapter
