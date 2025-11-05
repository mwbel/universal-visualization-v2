"""
API Performance Optimizer
API性能优化器

功能包括：
- 响应缓存
- 请求去重
- 并发控制
- 响应压缩
- 限流保护
"""

import asyncio
import hashlib
import json
import gzip
import time
from functools import wraps
from typing import Dict, Any, Optional, Callable, List
from dataclasses import dataclass
from collections import defaultdict
import aioredis
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

@dataclass
class CacheConfig:
    """缓存配置"""
    ttl: int = 300  # 5分钟
    max_size: int = 1000
    key_prefix: str = "api_cache"
    compress_threshold: int = 1024  # 1KB以上压缩

@dataclass
class RateLimitConfig:
    """限流配置"""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_size: int = 10

class APICache:
    """API响应缓存"""

    def __init__(self, redis_url: str = "redis://localhost:6379", config: CacheConfig = None):
        self.redis = None
        self.redis_url = redis_url
        self.config = config or CacheConfig()
        self.local_cache = {}  # 本地缓存作为后备
        self.local_cache_timestamps = {}

    async def connect(self):
        """连接Redis"""
        try:
            self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
            logger.info("✅ Redis缓存连接成功")
        except Exception as e:
            logger.warning(f"⚠️ Redis连接失败，使用本地缓存: {e}")
            self.redis = None

    def _generate_cache_key(self, request: Request, params: Dict = None) -> str:
        """生成缓存键"""
        # 包含方法、路径、查询参数、请求体
        key_data = {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "params": params or {}
        }

        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{self.config.key_prefix}:{key_hash}"

    async def get(self, request: Request, params: Dict = None) -> Optional[Dict]:
        """获取缓存响应"""
        cache_key = self._generate_cache_key(request, params)

        # 先尝试Redis
        if self.redis:
            try:
                cached_data = await self.redis.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data)
                    logger.info(f"💾 Redis缓存命中: {cache_key}")
                    return data
            except Exception as e:
                logger.warning(f"Redis读取失败: {e}")

        # 回退到本地缓存
        if cache_key in self.local_cache:
            timestamp = self.local_cache_timestamps.get(cache_key, 0)
            if time.time() - timestamp < self.config.ttl:
                logger.info(f"💾 本地缓存命中: {cache_key}")
                return self.local_cache[cache_key]
            else:
                # 过期删除
                del self.local_cache[cache_key]
                del self.local_cache_timestamps[cache_key]

        return None

    async def set(self, request: Request, response_data: Dict, params: Dict = None):
        """设置缓存响应"""
        cache_key = self._generate_cache_key(request, params)

        # 压缩大数据
        if len(json.dumps(response_data)) > self.config.compress_threshold:
            response_data["_compressed"] = True
            response_data["_original_size"] = len(json.dumps(response_data))

        # 存储到Redis
        if self.redis:
            try:
                await self.redis.setex(
                    cache_key,
                    self.config.ttl,
                    json.dumps(response_data)
                )
                logger.info(f"💾 Redis缓存存储: {cache_key}")
                return
            except Exception as e:
                logger.warning(f"Redis存储失败: {e}")

        # 回退到本地缓存
        self.local_cache[cache_key] = response_data
        self.local_cache_timestamps[cache_key] = time.time()

        # 清理过期的本地缓存
        await self._cleanup_local_cache()

    async def _cleanup_local_cache(self):
        """清理过期的本地缓存"""
        current_time = time.time()
        expired_keys = []

        for key, timestamp in self.local_cache_timestamps.items():
            if current_time - timestamp > self.config.ttl:
                expired_keys.append(key)

        for key in expired_keys:
            del self.local_cache[key]
            del self.local_cache_timestamps[key]

        # 限制本地缓存大小
        if len(self.local_cache) > self.config.max_size:
            # 删除最旧的缓存
            oldest_keys = sorted(
                self.local_cache_timestamps.items(),
                key=lambda x: x[1]
            )[:len(self.local_cache) - self.config.max_size]

            for key, _ in oldest_keys:
                del self.local_cache[key]
                del self.local_cache_timestamps[key]

    async def invalidate(self, pattern: str = None):
        """清除缓存"""
        if self.redis:
            try:
                if pattern:
                    keys = await self.redis.keys(f"{self.config.key_prefix}:{pattern}*")
                    if keys:
                        await self.redis.delete(*keys)
                        logger.info(f"🗑️ 清除缓存模式: {pattern}")
                else:
                    # 清除所有应用缓存
                    keys = await self.redis.keys(f"{self.config.key_prefix}:*")
                    if keys:
                        await self.redis.delete(*keys)
                        logger.info("🗑️ 清除所有缓存")
            except Exception as e:
                logger.warning(f"Redis清除失败: {e}")

        # 清除本地缓存
        if pattern:
            keys_to_remove = [k for k in self.local_cache.keys() if pattern in k]
            for key in keys_to_remove:
                del self.local_cache[key]
                del self.local_cache_timestamps[key]
            logger.info(f"🗑️ 清除本地缓存模式: {pattern}")
        else:
            self.local_cache.clear()
            self.local_cache_timestamps.clear()
            logger.info("🗑️ 清除所有本地缓存")

class RateLimiter:
    """API限流器"""

    def __init__(self, redis_url: str = "redis://localhost:6379", config: RateLimitConfig = None):
        self.redis = None
        self.redis_url = redis_url
        self.config = config or RateLimitConfig()
        self.local_counters = defaultdict(list)

    async def connect(self):
        """连接Redis"""
        try:
            self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
            logger.info("✅ Redis限流连接成功")
        except Exception as e:
            logger.warning(f"⚠️ Redis限流连接失败，使用本地计数: {e}")
            self.redis = None

    def _get_client_key(self, request: Request) -> str:
        """获取客户端标识"""
        # 优先使用API密钥，然后是IP地址
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"api_key:{api_key}"

        # 获取真实IP（考虑代理）
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"

        return f"ip:{request.client.host}"

    async def is_allowed(self, request: Request) -> tuple[bool, Dict]:
        """检查是否允许请求"""
        client_key = self._get_client_key(request)
        current_time = int(time.time())

        # 检查分钟级限流
        minute_key = f"rate_limit:minute:{client_key}:{current_time // 60}"
        minute_count = await self._get_count(minute_key, 60)

        if minute_count >= self.config.requests_per_minute:
            return False, {
                "error": "Rate limit exceeded",
                "limit": self.config.requests_per_minute,
                "window": "1 minute",
                "retry_after": 60 - (current_time % 60)
            }

        # 检查小时级限流
        hour_key = f"rate_limit:hour:{client_key}:{current_time // 3600}"
        hour_count = await self._get_count(hour_key, 3600)

        if hour_count >= self.config.requests_per_hour:
            return False, {
                "error": "Rate limit exceeded",
                "limit": self.config.requests_per_hour,
                "window": "1 hour",
                "retry_after": 3600 - (current_time % 3600)
            }

        # 检查突发限流
        burst_key = f"rate_limit:burst:{client_key}"
        burst_count = await self._get_burst_count(burst_key)

        if burst_count >= self.config.burst_size:
            return False, {
                "error": "Burst rate limit exceeded",
                "limit": self.config.burst_size,
                "window": "10 seconds",
                "retry_after": 10
            }

        # 增加计数
        await self._increment_count(minute_key, 60)
        await self._increment_count(hour_key, 3600)
        await self._increment_burst_count(burst_key)

        return True, {}

    async def _get_count(self, key: str, window: int) -> int:
        """获取计数"""
        if self.redis:
            try:
                count = await self.redis.get(key)
                return int(count) if count else 0
            except Exception as e:
                logger.warning(f"Redis计数读取失败: {e}")

        # 回退到本地计数
        current_time = time.time()
        cutoff_time = current_time - window

        # 清理过期计数
        if key in self.local_counters:
            self.local_counters[key] = [
                timestamp for timestamp in self.local_counters[key]
                if timestamp > cutoff_time
            ]
            return len(self.local_counters[key])

        return 0

    async def _increment_count(self, key: str, window: int):
        """增加计数"""
        if self.redis:
            try:
                await self.redis.incr(key)
                await self.redis.expire(key, window)
                return
            except Exception as e:
                logger.warning(f"Redis计数写入失败: {e}")

        # 回退到本地计数
        if key not in self.local_counters:
            self.local_counters[key] = []
        self.local_counters[key].append(time.time())

    async def _get_burst_count(self, key: str) -> int:
        """获取突发计数"""
        if self.redis:
            try:
                count = await self.redis.get(key)
                return int(count) if count else 0
            except Exception:
                pass

        # 简化的本地突发计数
        return len([t for t in self.local_counters.get(key, []) if time.time() - t < 10])

    async def _increment_burst_count(self, key: str):
        """增加突发计数"""
        if self.redis:
            try:
                await self.redis.incr(key)
                await self.redis.expire(key, 10)
                return
            except Exception:
                pass

        # 本地突发计数
        if key not in self.local_counters:
            self.local_counters[key] = []
        self.local_counters[key].append(time.time())

class APIOptimizer:
    """API性能优化器主类"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.cache = APICache(redis_url)
        self.rate_limiter = RateLimiter(redis_url)
        self.request_deduplicator = RequestDeduplicator()

    async def initialize(self):
        """初始化所有组件"""
        await self.cache.connect()
        await self.rate_limiter.connect()
        logger.info("🚀 API优化器初始化完成")

    def cache_response(self, ttl: int = 300, key_prefix: str = None):
        """缓存响应装饰器"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # 构建模拟请求对象
                request = kwargs.get('request')
                if not request:
                    return await func(*args, **kwargs)

                # 检查缓存
                cached_response = await self.cache.get(request, kwargs)
                if cached_response:
                    # 如果是压缩数据，解压
                    if cached_response.get("_compressed"):
                        cached_response.pop("_compressed", None)
                        cached_response.pop("_original_size", None)

                    return JSONResponse(
                        content=cached_response,
                        headers={"X-Cache": "HIT"}
                    )

                # 执行原函数
                response = await func(*args, **kwargs)

                # 缓存响应
                if hasattr(response, 'body_dict'):
                    await self.cache.set(request, response.body_dict, kwargs)
                elif isinstance(response, dict):
                    await self.cache.set(request, response, kwargs)

                return response

            return wrapper
        return decorator

    def rate_limit(self, requests_per_minute: int = None, requests_per_hour: int = None):
        """限流装饰器"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                request = kwargs.get('request')
                if not request:
                    return await func(*args, **kwargs)

                # 检查限流
                allowed, error_info = await self.rate_limiter.is_allowed(request)

                if not allowed:
                    return JSONResponse(
                        status_code=429,
                        content=error_info,
                        headers={
                            "X-RateLimit-Limit": str(requests_per_minute or self.rate_limiter.config.requests_per_minute),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Retry": str(error_info.get("retry_after", 60))
                        }
                    )

                # 执行原函数
                response = await func(*args, **kwargs)

                # 添加限流头信息
                if hasattr(response, 'headers'):
                    response.headers["X-RateLimit-Limit"] = str(requests_per_minute or self.rate_limiter.config.requests_per_minute)

                return response

            return wrapper
        return decorator

    def deduplicate_request(self):
        """请求去重装饰器"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                request = kwargs.get('request')
                if not request:
                    return await func(*args, **kwargs)

                # 检查是否是重复请求
                result = await self.request_deduplicator.check_duplicate(request)
                if result:
                    return result

                # 标记请求开始处理
                await self.request_deduplicator.mark_processing(request)

                try:
                    # 执行原函数
                    response = await func(*args, **kwargs)

                    # 缓存结果以供重复请求使用
                    await self.request_deduplicator.cache_result(request, response)

                    return response
                finally:
                    # 标记请求处理完成
                    await self.request_deduplicator.mark_completed(request)

            return wrapper
        return decorator

    def compress_response(self, threshold: int = 1024):
        """响应压缩装饰器"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                response = await func(*args, **kwargs)

                # 检查是否需要压缩
                if hasattr(response, 'body'):
                    content_length = len(response.body)
                    if content_length > threshold:
                        # 压缩响应
                        compressed_body = gzip.compress(response.body)

                        # 更新响应
                        response.body = compressed_body
                        response.headers["Content-Encoding"] = "gzip"
                        response.headers["Content-Length"] = str(len(compressed_body))
                        response.headers["X-Compressed"] = "true"
                        response.headers["X-Original-Size"] = str(content_length)

                return response

            return wrapper
        return decorator

class RequestDeduplicator:
    """请求去重器"""

    def def __init__(self):
        self.processing_requests = set()
        self.request_results = {}
        self.request_timestamps = {}

    def _generate_request_key(self, request: Request) -> str:
        """生成请求唯一标识"""
        key_data = {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers)
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    async def check_duplicate(self, request: Request) -> Optional[Any]:
        """检查重复请求"""
        request_key = self._generate_request_key(request)

        # 如果请求正在处理中，等待结果
        if request_key in self.processing_requests:
            logger.info(f"🔄 检测到重复请求，等待处理: {request_key}")

            # 等待请求完成（最多等待30秒）
            for _ in range(300):  # 30秒，每100ms检查一次
                if request_key in self.request_results:
                    result = self.request_results[request_key]
                    # 清理过期结果
                    del self.request_results[request_key]
                    del self.request_timestamps[request_key]
                    return result

                await asyncio.sleep(0.1)

            logger.warning(f"⚠️ 重复请求等待超时: {request_key}")

        return None

    async def mark_processing(self, request: Request):
        """标记请求开始处理"""
        request_key = self._generate_request_key(request)
        self.processing_requests.add(request_key)

    async def mark_completed(self, request: Request):
        """标记请求处理完成"""
        request_key = self._generate_request_key(request)
        self.processing_requests.discard(request_key)

    async def cache_result(self, request: Request, result: Any):
        """缓存请求结果"""
        request_key = self._generate_request_key(request)
        self.request_results[request_key] = result
        self.request_timestamps[request_key] = time.time()

        # 清理过期结果（5分钟后）
        await self._cleanup_expired_results()

    async def _cleanup_expired_results(self):
        """清理过期结果"""
        current_time = time.time()
        expired_keys = []

        for key, timestamp in self.request_timestamps.items():
            if current_time - timestamp > 300:  # 5分钟
                expired_keys.append(key)

        for key in expired_keys:
            del self.request_results[key]
            del self.request_timestamps[key]

# 使用示例
"""
api_optimizer = APIOptimizer()

@api_optimizer.cache_response(ttl=600)
@api_optimizer.rate_limit(requests_per_minute=100)
@api_optimizer.deduplicate_request()
@api_optimizer.compress_response(threshold=2048)
async def generate_visualization(request: Request, data: dict):
    # 处理可视化生成逻辑
    pass
"""

# 性能统计
class PerformanceStats:
    """性能统计"""

    def __init__(self):
        self.request_counts = defaultdict(int)
        self.response_times = defaultdict(list)
        self.cache_hits = 0
        self.cache_misses = 0
        self.rate_limited_requests = 0

    def record_request(self, endpoint: str, response_time: float):
        """记录请求"""
        self.request_counts[endpoint] += 1
        self.response_times[endpoint].append(response_time)

        # 保持最近1000个响应时间记录
        if len(self.response_times[endpoint]) > 1000:
            self.response_times[endpoint] = self.response_times[endpoint][-1000:]

    def record_cache_hit(self):
        """记录缓存命中"""
        self.cache_hits += 1

    def record_cache_miss(self):
        """记录缓存未命中"""
        self.cache_misses += 1

    def record_rate_limit(self):
        """记录限流"""
        self.rate_limited_requests += 1

    def get_stats(self) -> Dict:
        """获取统计信息"""
        total_requests = sum(self.request_counts.values())
        cache_hit_rate = (self.cache_hits / (self.cache_hits + self.cache_misses) * 100) if (self.cache_hits + self.cache_misses) > 0 else 0

        avg_response_times = {}
        for endpoint, times in self.response_times.items():
            if times:
                avg_response_times[endpoint] = sum(times) / len(times)

        return {
            "total_requests": total_requests,
            "requests_per_endpoint": dict(self.request_counts),
            "average_response_times": avg_response_times,
            "cache_hit_rate": f"{cache_hit_rate:.2f}%",
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "rate_limited_requests": self.rate_limited_requests,
            "timestamp": time.time()
        }

# 全局实例
performance_stats = PerformanceStats()