"""
Database Performance Optimizer
数据库性能优化器

功能包括：
- 连接池管理
- 查询优化
- 索引建议
- 缓存策略
- 批量操作优化
"""

import asyncio
import time
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
from sqlalchemy import text, create_engine, MetaData, inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker
import aioredis
from functools import wraps
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """数据库配置"""
    url: str = "sqlite+aiosqlite:///./visualization.db"
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    connection_timeout: int = 60

@dataclass
class QueryOptimization:
    """查询优化结果"""
    original_query: str
    optimized_query: str
    suggestions: List[str] = field(default_factory=list)
    estimated_improvement: float = 0.0
    added_indexes: List[str] = field(default_factory=list)

class DatabaseOptimizer:
    """数据库优化器主类"""

    def __init__(self, config: DatabaseConfig = None):
        self.config = config or DatabaseConfig()
        self.engine = None
        self.async_session_factory = None
        self.redis = None
        self.query_cache = {}
        self.query_stats = {}
        self.slow_queries = []
        self.index_suggestions = []

    async def initialize(self):
        """初始化数据库连接"""
        await self._create_engine()
        await self._setup_redis()
        await self._analyze_schema()
        logger.info("🚀 数据库优化器初始化完成")

    async def _create_engine(self):
        """创建数据库引擎"""
        try:
            # 创建异步引擎
            self.engine = create_async_engine(
                self.config.url,
                poolclass=QueuePool,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                echo=self.config.echo,
                connect_args={"timeout": self.config.connection_timeout}
            )

            # 创建会话工厂
            self.async_session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )

            logger.info("✅ 数据库引擎创建成功")
        except Exception as e:
            logger.error(f"❌ 数据库引擎创建失败: {e}")
            raise

    async def _setup_redis(self):
        """设置Redis缓存"""
        try:
            self.redis = await aioredis.from_url("redis://localhost:6379", decode_responses=True)
            logger.info("✅ Redis缓存连接成功")
        except Exception as e:
            logger.warning(f"⚠️ Redis连接失败，使用本地缓存: {e}")

    async def _analyze_schema(self):
        """分析数据库模式"""
        async with self.get_session() as session:
            try:
                # 获取表信息
                inspector = inspect(self.engine.sync_engine if hasattr(self.engine, 'sync_engine') else self.engine)
                tables = inspector.get_table_names()

                for table_name in tables:
                    # 分析表的索引
                    indexes = inspector.get_indexes(table_name)
                    columns = inspector.get_columns(table_name)

                    # 生成索引建议
                    await self._generate_index_suggestions(table_name, columns, indexes)

                logger.info(f"✅ 数据库模式分析完成，共{len(tables)}张表")
            except Exception as e:
                logger.warning(f"⚠️ 数据库模式分析失败: {e}")

    async def _generate_index_suggestions(self, table_name: str, columns: List[Dict], existing_indexes: List[Dict]):
        """生成索引建议"""
        # 常见需要索引的列类型
        index_candidate_types = ['varchar', 'text', 'integer', 'timestamp']

        # 查找可能需要索引的列
        for column in columns:
            column_name = column['name']
            column_type = column['type'].lower()

            # 跳过已有索引的列
            if any(column_name in idx['column_names'] for idx in existing_indexes):
                continue

            # 为特定类型列建议索引
            if any(col_type in column_type for col_type in index_candidate_types):
                # 检查是否是外键或常用查询列
                if (column_name.endswith('_id') or
                    column_name in ['name', 'type', 'status', 'created_at', 'updated_at'] or
                    'user' in column_name.lower()):

                    suggestion = f"CREATE INDEX idx_{table_name}_{column_name} ON {table_name} ({column_name})"
                    if suggestion not in self.index_suggestions:
                        self.index_suggestions.append(suggestion)

    @asynccontextmanager
    async def get_session(self):
        """获取数据库会话"""
        if not self.async_session_factory:
            raise RuntimeError("数据库未初始化")

        async with self.async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    def cache_query_result(self, ttl: int = 300, key_prefix: str = "db_cache"):
        """查询结果缓存装饰器"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # 生成缓存键
                cache_key = f"{key_prefix}:{self._generate_query_cache_key(func.__name__, args, kwargs)}"

                # 尝试从缓存获取
                cached_result = await self._get_cached_result(cache_key)
                if cached_result is not None:
                    logger.info(f"💾 查询缓存命中: {func.__name__}")
                    return cached_result

                # 执行查询
                start_time = time.time()
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time

                # 记录查询统计
                await self._record_query_stats(func.__name__, execution_time)

                # 缓存结果
                await self._cache_result(cache_key, result, ttl)

                # 检查慢查询
                if execution_time > 1.0:  # 超过1秒的查询
                    await self._record_slow_query(func.__name__, args, kwargs, execution_time)

                return result

            return wrapper
        return decorator

    async def _generate_query_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """生成查询缓存键"""
        # 序列化参数
        try:
            args_str = json.dumps(args, sort_keys=True, default=str)
            kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
        except (TypeError, ValueError):
            # 如果序列化失败，使用字符串表示
            args_str = str(args)
            kwargs_str = str(kwargs)

        # 生成哈希
        key_data = f"{func_name}:{args_str}:{kwargs_str}"
        return hashlib.md5(key_data.encode()).hexdigest()

    async def _get_cached_result(self, cache_key: str) -> Optional[Any]:
        """获取缓存结果"""
        if self.redis:
            try:
                cached_data = await self.redis.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Redis缓存读取失败: {e}")

        # 回退到本地缓存
        return self.query_cache.get(cache_key)

    async def _cache_result(self, cache_key: str, result: Any, ttl: int):
        """缓存查询结果"""
        # 尝试缓存到Redis
        if self.redis:
            try:
                await self.redis.setex(cache_key, ttl, json.dumps(result, default=str))
                return
            except Exception as e:
                logger.warning(f"Redis缓存写入失败: {e}")

        # 回退到本地缓存
        self.query_cache[cache_key] = result

        # 限制本地缓存大小
        if len(self.query_cache) > 1000:
            # 删除最旧的一半缓存
            keys_to_remove = list(self.query_cache.keys())[:500]
            for key in keys_to_remove:
                del self.query_cache[key]

    async def _record_query_stats(self, query_name: str, execution_time: float):
        """记录查询统计"""
        if query_name not in self.query_stats:
            self.query_stats[query_name] = {
                'count': 0,
                'total_time': 0.0,
                'avg_time': 0.0,
                'min_time': float('inf'),
                'max_time': 0.0
            }

        stats = self.query_stats[query_name]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['max_time'] = max(stats['max_time'], execution_time)

    async def _record_slow_query(self, query_name: str, args: tuple, kwargs: dict, execution_time: float):
        """记录慢查询"""
        slow_query = {
            'query_name': query_name,
            'args': str(args)[:200],  # 限制长度
            'kwargs': str(kwargs)[:200],
            'execution_time': execution_time,
            'timestamp': time.time()
        }

        self.slow_queries.append(slow_query)

        # 保持最近100个慢查询记录
        if len(self.slow_queries) > 100:
            self.slow_queries = self.slow_queries[-100:]

        logger.warning(f"🐌 慢查询检测: {query_name} 耗时 {execution_time:.2f}s")

    async def execute_optimized_query(self, query: str, params: Dict = None) -> List[Dict]:
        """执行优化的查询"""
        async with self.get_session() as session:
            try:
                # 分析并优化查询
                optimized_query = await self._optimize_query(query)

                # 执行查询
                result = await session.execute(text(optimized_query), params or {})
                rows = result.fetchall()

                # 转换为字典列表
                return [dict(row._mapping) for row in rows]

            except Exception as e:
                logger.error(f"❌ 查询执行失败: {e}")
                raise

    async def _optimize_query(self, query: str) -> str:
        """优化SQL查询"""
        optimized_query = query.strip()

        # 基本查询优化建议
        optimizations = [
            # 避免SELECT *
            ("SELECT *", "SELECT specific_columns"),
            # 添加LIMIT子句（如果没有）
            ("SELECT", "SELECT"),
            # 使用索引提示（如果适用）
            ("FROM", "FROM"),
        ]

        # 这里可以添加更复杂的查询优化逻辑
        # 比如查询计划分析、索引使用建议等

        return optimized_query

    async def batch_insert(self, table_name: str, data: List[Dict], batch_size: int = 1000) -> int:
        """批量插入优化"""
        if not data:
            return 0

        total_inserted = 0

        async with self.get_session() as session:
            try:
                # 分批插入
                for i in range(0, len(data), batch_size):
                    batch = data[i:i + batch_size]

                    # 构建批量插入语句
                    columns = list(batch[0].keys())
                    placeholders = ", ".join([f":{col}" for col in columns])
                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)})
                        VALUES ({placeholders})
                    """

                    await session.execute(text(query), batch)
                    total_inserted += len(batch)

                    logger.info(f"批量插入: {table_name} {len(batch)} 条记录")

                return total_inserted

            except Exception as e:
                logger.error(f"❌ 批量插入失败: {e}")
                raise

    async def bulk_update(self, table_name: str, data: List[Dict], key_column: str = 'id', batch_size: int = 1000) -> int:
        """批量更新优化"""
        if not data:
            return 0

        total_updated = 0

        async with self.get_session() as session:
            try:
                # 分批更新
                for i in range(0, len(data), batch_size):
                    batch = data[i:i + batch_size]

                    for row in batch:
                        # 构建更新语句
                        key_value = row[key_column]
                        update_columns = {k: v for k, v in row.items() if k != key_column}

                        if update_columns:
                            set_clause = ", ".join([f"{col} = :{col}" for col in update_columns])
                            query = f"""
                                UPDATE {table_name}
                                SET {set_clause}
                                WHERE {key_column} = :{key_column}
                            """

                            await session.execute(text(query), {**update_columns, key_column: key_value})
                            total_updated += 1

                    logger.info(f"批量更新: {table_name} {len(batch)} 条记录")

                return total_updated

            except Exception as e:
                logger.error(f"❌ 批量更新失败: {e}")
                raise

    async def analyze_table_performance(self, table_name: str) -> Dict:
        """分析表性能"""
        async with self.get_session() as session:
            try:
                # 获取表统计信息
                stats_query = f"""
                    SELECT
                        COUNT(*) as row_count,
                        AVG(LENGTH(CAST(* AS TEXT))) as avg_row_size
                    FROM {table_name}
                """

                result = await session.execute(text(stats_query))
                stats = result.fetchone()

                # 获取索引信息
                index_query = f"""
                    SELECT
                        indexname,
                        indexdef
                    FROM pg_indexes
                    WHERE tablename = '{table_name}'
                """

                try:
                    index_result = await session.execute(text(index_query))
                    indexes = [dict(row._mapping) for row in index_result.fetchall()]
                except:
                    # 如果不是PostgreSQL，使用通用查询
                    indexes = []

                return {
                    'table_name': table_name,
                    'row_count': stats[0] if stats else 0,
                    'avg_row_size': stats[1] if stats else 0,
                    'indexes': indexes,
                    'index_suggestions': self._get_table_index_suggestions(table_name)
                }

            except Exception as e:
                logger.error(f"❌ 表性能分析失败: {e}")
                return {'error': str(e)}

    def _get_table_index_suggestions(self, table_name: str) -> List[str]:
        """获取表的索引建议"""
        return [suggestion for suggestion in self.index_suggestions if table_name in suggestion]

    async def get_performance_report(self) -> Dict:
        """获取性能报告"""
        return {
            'query_statistics': self.query_stats,
            'slow_queries': self.slow_queries[-10:],  # 最近10个慢查询
            'index_suggestions': self.index_suggestions,
            'cache_stats': {
                'local_cache_size': len(self.query_cache),
                'redis_connected': self.redis is not None
            },
            'top_slow_queries': self._get_top_slow_queries(),
            'query_performance_summary': self._get_query_performance_summary()
        }

    def _get_top_slow_queries(self) -> List[Dict]:
        """获取最慢的查询"""
        return sorted(self.slow_queries, key=lambda x: x['execution_time'], reverse=True)[:10]

    def _get_query_performance_summary(self) -> Dict:
        """获取查询性能摘要"""
        if not self.query_stats:
            return {}

        total_queries = sum(stats['count'] for stats in self.query_stats.values())
        total_time = sum(stats['total_time'] for stats in self.query_stats.values())
        avg_query_time = total_time / total_queries if total_queries > 0 else 0

        slowest_query = max(self.query_stats.items(), key=lambda x: x[1]['max_time'])
        fastest_query = min(self.query_stats.items(), key=lambda x: x[1]['min_time'])

        return {
            'total_queries': total_queries,
            'total_time': total_time,
            'average_query_time': avg_query_time,
            'slowest_query': {
                'name': slowest_query[0],
                'time': slowest_query[1]['max_time']
            },
            'fastest_query': {
                'name': fastest_query[0],
                'time': fastest_query[1]['min_time']
            }
        }

    async def cleanup_cache(self):
        """清理缓存"""
        # 清理本地缓存
        self.query_cache.clear()

        # 清理Redis缓存
        if self.redis:
            try:
                keys = await self.redis.keys("db_cache:*")
                if keys:
                    await self.redis.delete(*keys)
                    logger.info(f"🗑️ 清理Redis缓存: {len(keys)} 个键")
            except Exception as e:
                logger.warning(f"Redis缓存清理失败: {e}")

        logger.info("🧹 缓存清理完成")

    async def close(self):
        """关闭连接"""
        if self.engine:
            await self.engine.dispose()

        if self.redis:
            await self.redis.close()

        logger.info("🔌 数据库连接已关闭")

# 使用示例
"""
db_optimizer = DatabaseOptimizer()
await db_optimizer.initialize()

@db_optimizer.cache_query_result(ttl=600)
async def get_user_visualizations(user_id: int):
    async with db_optimizer.get_session() as session:
        result = await session.execute(
            text("SELECT * FROM visualizations WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        return [dict(row._mapping) for row in result.fetchall()]
"""

# 连接池监控器
class ConnectionPoolMonitor:
    """连接池监控器"""

    def __init__(self, engine):
        self.engine = engine
        self.pool_stats = {}

    async def get_pool_stats(self) -> Dict:
        """获取连接池统计"""
        if hasattr(self.engine, 'pool'):
            pool = self.engine.pool
            return {
                'size': pool.size(),
                'checked_in': pool.checkedin(),
                'checked_out': pool.checkedout(),
                'overflow': pool.overflow(),
                'invalid': pool.invalid()
            }
        return {}

    async def monitor_pool_health(self):
        """监控连接池健康状态"""
        stats = await self.get_pool_stats()

        if stats:
            # 检查连接池使用率
            usage_rate = (stats['checked_out'] / stats['size']) * 100 if stats['size'] > 0 else 0

            if usage_rate > 80:
                logger.warning(f"⚠️ 连接池使用率过高: {usage_rate:.1f}%")

            # 检查溢出连接
            if stats['overflow'] > 0:
                logger.warning(f"⚠️ 存在溢出连接: {stats['overflow']}")

            # 检查无效连接
            if stats['invalid'] > 0:
                logger.warning(f"⚠️ 存在无效连接: {stats['invalid']}")

        return stats