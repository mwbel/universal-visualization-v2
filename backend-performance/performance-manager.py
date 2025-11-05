"""
Performance Manager - Backend Performance Integration
性能管理器 - 后端性能优化集成

整合所有后端性能优化组件：
- API优化器
- 数据库优化器
- 并发处理器
- 监控和统计
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

from api_optimizer import APIOptimizer, PerformanceStats
from database_optimizer import DatabaseOptimizer, ConnectionPoolMonitor
from concurrent_optimizer import ConcurrentProcessor, BatchProcessor

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """性能指标"""
    timestamp: datetime
    api_stats: Dict
    db_stats: Dict
    concurrent_stats: Dict
    system_stats: Dict
    memory_usage: float
    cpu_usage: float

class PerformanceManager:
    """性能管理器主类"""

    def __init__(self, config: Dict = None):
        self.config = config or self._get_default_config()

        # 初始化各组件
        self.api_optimizer = APIOptimizer(
            redis_url=self.config.get('redis_url', 'redis://localhost:6379')
        )

        self.db_optimizer = DatabaseOptimizer(
            config=self.config.get('database', {})
        )

        self.concurrent_processor = ConcurrentProcessor(
            config=self.config.get('concurrent', {})
        )

        self.batch_processor = BatchProcessor(self.concurrent_processor)

        # 监控器
        self.pool_monitor = None
        self.performance_stats = PerformanceStats()

        # 性能历史数据
        self.metrics_history = []
        self.alerts = []

        # 运行状态
        self.running = False
        self.start_time = None

    def _get_default_config(self) -> Dict:
        """获取默认配置"""
        return {
            'redis_url': 'redis://localhost:6379',
            'database': {
                'url': 'sqlite+aiosqlite:///./visualization.db',
                'pool_size': 20,
                'max_overflow': 30
            },
            'concurrent': {
                'max_workers': 10,
                'max_concurrent_tasks': 50,
                'task_timeout': 300.0
            },
            'monitoring': {
                'enabled': True,
                'interval': 30,  # 30秒
                'metrics_retention_hours': 24,
                'alert_thresholds': {
                    'response_time': 2.0,  # 2秒
                    'error_rate': 0.05,    # 5%
                    'memory_usage': 0.85,  # 85%
                    'cpu_usage': 0.80      # 80%
                }
            }
        }

    async def initialize(self):
        """初始化所有组件"""
        try:
            logger.info("🚀 性能管理器初始化开始")

            # 初始化各组件
            await self.api_optimizer.initialize()
            await self.db_optimizer.initialize()
            await self.concurrent_processor.start()

            # 初始化监控器
            if self.config.get('monitoring', {}).get('enabled', True):
                self.pool_monitor = ConnectionPoolMonitor(self.db_optimizer.engine)

            self.running = True
            self.start_time = datetime.now()

            logger.info("✅ 性能管理器初始化完成")

        except Exception as e:
            logger.error(f"❌ 性能管理器初始化失败: {e}")
            raise

    async def shutdown(self):
        """关闭所有组件"""
        logger.info("🛑 性能管理器开始关闭")

        try:
            self.running = False

            # 关闭各组件
            await self.concurrent_processor.stop()
            await self.db_optimizer.close()

            logger.info("✅ 性能管理器已关闭")

        except Exception as e:
            logger.error(f"❌ 性能管理器关闭失败: {e}")

    async def process_api_request(self, request_func, *args, **kwargs):
        """处理API请求（整合所有优化）"""
        # 应用API优化装饰器
        cached_func = self.api_optimizer.cache_response(ttl=300)(request_func)
        rate_limited_func = self.api_optimizer.rate_limit()(cached_func)
        deduplicated_func = self.api_optimizer.deduplicate_request()(rate_limited_func)
        optimized_func = self.api_optimizer.compress_response()(deduplicated_func)

        # 执行请求
        return await optimized_func(*args, **kwargs)

    async def submit_background_task(self, func, *args, **kwargs) -> str:
        """提交后台任务"""
        return await self.concurrent_processor.submit_task(func, *args, **kwargs)

    async def submit_batch_task(self, func, items: List[Any], **kwargs) -> List[str]:
        """提交批量任务"""
        return await self.batch_processor.process_batch(func, items, **kwargs)

    async def get_cached_data(self, key: str) -> Optional[Any]:
        """获取缓存数据"""
        return await self.api_optimizer.cache.get(key)

    async def set_cached_data(self, key: str, data: Any, ttl: int = 300):
        """设置缓存数据"""
        await self.api_optimizer.cache.set(key, data, ttl)

    async def execute_db_query(self, query: str, params: Dict = None, cache_ttl: int = 300):
        """执行数据库查询（带缓存）"""
        @self.db_optimizer.cache_query_result(ttl=cache_ttl)
        async def _execute_query():
            return await self.db_optimizer.execute_optimized_query(query, params)

        return await _execute_query()

    async def start_monitoring(self):
        """启动性能监控"""
        if not self.config.get('monitoring', {}).get('enabled', True):
            return

        monitoring_interval = self.config.get('monitoring', {}).get('interval', 30)

        while self.running:
            try:
                # 收集性能指标
                metrics = await self._collect_performance_metrics()

                # 存储历史数据
                self._store_metrics(metrics)

                # 检查告警
                await self._check_alerts(metrics)

                # 清理旧数据
                await self._cleanup_old_metrics()

                await asyncio.sleep(monitoring_interval)

            except Exception as e:
                logger.error(f"❌ 性能监控异常: {e}")
                await asyncio.sleep(5)

    async def _collect_performance_metrics(self) -> PerformanceMetrics:
        """收集性能指标"""
        timestamp = datetime.now()

        # API统计
        api_stats = self.performance_stats.get_stats()

        # 数据库统计
        db_stats = await self.db_optimizer.get_performance_report()

        # 并发处理统计
        concurrent_stats = await self.concurrent_processor.get_performance_stats()

        # 连接池统计
        pool_stats = {}
        if self.pool_monitor:
            pool_stats = await self.pool_monitor.monitor_pool_health()

        # 系统统计
        system_stats = await self._get_system_stats()

        return PerformanceMetrics(
            timestamp=timestamp,
            api_stats=api_stats,
            db_stats=db_stats,
            concurrent_stats=concurrent_stats,
            system_stats={**system_stats, 'pool_stats': pool_stats},
            memory_usage=system_stats.get('memory_usage', 0),
            cpu_usage=system_stats.get('cpu_usage', 0)
        )

    async def _get_system_stats(self) -> Dict:
        """获取系统统计"""
        try:
            import psutil

            return {
                'memory_usage': psutil.virtual_memory().percent / 100,
                'cpu_usage': psutil.cpu_percent() / 100,
                'disk_usage': psutil.disk_usage('/').percent / 100,
                'network_io': {
                    'bytes_sent': psutil.net_io_counters().bytes_sent,
                    'bytes_recv': psutil.net_io_counters().bytes_recv
                }
            }
        except ImportError:
            logger.warning("⚠️ psutil未安装，无法获取系统统计")
            return {}

    def _store_metrics(self, metrics: PerformanceMetrics):
        """存储性能指标"""
        self.metrics_history.append(metrics)

        # 限制历史数据数量
        max_history = self.config.get('monitoring', {}).get('metrics_retention_hours', 24) * 120  # 每30秒一个点
        if len(self.metrics_history) > max_history:
            self.metrics_history = self.metrics_history[-max_history:]

    async def _check_alerts(self, metrics: PerformanceMetrics):
        """检查告警条件"""
        thresholds = self.config.get('monitoring', {}).get('alert_thresholds', {})

        # 检查响应时间
        avg_response_time = metrics.api_stats.get('average_response_times', {})
        for endpoint, response_time in avg_response_time.items():
            if response_time > thresholds.get('response_time', 2.0):
                await self._create_alert(
                    'high_response_time',
                    f"端点 {endpoint} 响应时间过高: {response_time:.2f}s",
                    metrics
                )

        # 检查错误率
        total_requests = metrics.api_stats.get('total_requests', 0)
        rate_limited_requests = metrics.api_stats.get('rate_limited_requests', 0)
        error_rate = rate_limited_requests / total_requests if total_requests > 0 else 0

        if error_rate > thresholds.get('error_rate', 0.05):
            await self._create_alert(
                'high_error_rate',
                f"错误率过高: {error_rate:.2%}",
                metrics
            )

        # 检查内存使用
        if metrics.memory_usage > thresholds.get('memory_usage', 0.85):
            await self._create_alert(
                'high_memory_usage',
                f"内存使用率过高: {metrics.memory_usage:.1%}",
                metrics
            )

        # 检查CPU使用
        if metrics.cpu_usage > thresholds.get('cpu_usage', 0.80):
            await self._create_alert(
                'high_cpu_usage',
                f"CPU使用率过高: {metrics.cpu_usage:.1%}",
                metrics
            )

    async def _create_alert(self, alert_type: str, message: str, metrics: PerformanceMetrics):
        """创建告警"""
        alert = {
            'id': len(self.alerts),
            'type': alert_type,
            'message': message,
            'timestamp': metrics.timestamp,
            'metrics': asdict(metrics)
        }

        self.alerts.append(alert)
        logger.warning(f"🚨 性能告警: {message}")

        # 限制告警数量
        if len(self.alerts) > 1000:
            self.alerts = self.alerts[-1000]

    async def _cleanup_old_metrics(self):
        """清理旧的性能数据"""
        retention_hours = self.config.get('monitoring', {}).get('metrics_retention_hours', 24)
        cutoff_time = datetime.now() - timedelta(hours=retention_hours)

        self.metrics_history = [
            metrics for metrics in self.metrics_history
            if metrics.timestamp > cutoff_time
        ]

    async def get_performance_dashboard(self) -> Dict:
        """获取性能仪表板数据"""
        if not self.metrics_history:
            return {'error': '暂无性能数据'}

        latest_metrics = self.metrics_history[-1]

        # 计算趋势
        trends = self._calculate_trends()

        return {
            'current_status': asdict(latest_metrics),
            'trends': trends,
            'alerts': self.alerts[-10:],  # 最近10个告警
            'summary': {
                'uptime_hours': (datetime.now() - self.start_time).total_seconds() / 3600 if self.start_time else 0,
                'total_requests': latest_metrics.api_stats.get('total_requests', 0),
                'cache_hit_rate': latest_metrics.api_stats.get('cache_hit_rate', '0%'),
                'avg_response_time': latest_metrics.api_stats.get('average_response_times', {}),
                'concurrent_tasks_processed': latest_metrics.concurrent_stats.get('tasks_processed', 0),
                'success_rate': latest_metrics.concurrent_stats.get('success_rate', 0),
                'total_alerts': len(self.alerts)
            },
            'recommendations': await self._generate_recommendations(latest_metrics)
        }

    def _calculate_trends(self) -> Dict:
        """计算性能趋势"""
        if len(self.metrics_history) < 2:
            return {}

        recent_metrics = self.metrics_history[-10:]  # 最近10个数据点
        older_metrics = self.metrics_history[-20:-10] if len(self.metrics_history) >= 20 else []

        trends = {}

        # 响应时间趋势
        recent_avg = sum(m.api_stats.get('total_requests', 0) for m in recent_metrics) / len(recent_metrics)
        if older_metrics:
            older_avg = sum(m.api_stats.get('total_requests', 0) for m in older_metrics) / len(older_metrics)
            trends['requests_trend'] = 'up' if recent_avg > older_avg else 'down'

        # 内存使用趋势
        recent_memory = sum(m.memory_usage for m in recent_metrics) / len(recent_metrics)
        if older_metrics:
            older_memory = sum(m.memory_usage for m in older_metrics) / len(older_metrics)
            trends['memory_trend'] = 'up' if recent_memory > older_memory else 'down'

        return trends

    async def _generate_recommendations(self, metrics: PerformanceMetrics) -> List[str]:
        """生成优化建议"""
        recommendations = []

        # 基于当前指标生成建议
        if metrics.memory_usage > 0.8:
            recommendations.append("内存使用率较高，建议优化内存使用或增加内存配置")

        if metrics.cpu_usage > 0.7:
            recommendations.append("CPU使用率较高，建议优化算法或增加处理能力")

        cache_hit_rate = float(metrics.api_stats.get('cache_hit_rate', '0%').rstrip('%'))
        if cache_hit_rate < 50:
            recommendations.append("缓存命中率较低，建议优化缓存策略")

        if metrics.concurrent_stats.get('tasks_failed', 0) > 0:
            recommendations.append("存在失败任务，建议检查任务逻辑和错误处理")

        # 基于历史趋势生成建议
        if len(self.metrics_history) >= 10:
            recent_tasks = sum(m.concurrent_stats.get('tasks_processed', 0) for m in self.metrics_history[-10:])
            if recent_tasks == 0:
                recommendations.append("最近处理任务数量较少，可能存在性能瓶颈")

        return recommendations

    async def generate_performance_report(self, hours: int = 24) -> Dict:
        """生成性能报告"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        relevant_metrics = [
            m for m in self.metrics_history
            if m.timestamp > cutoff_time
        ]

        if not relevant_metrics:
            return {'error': f'过去{hours}小时内无性能数据'}

        # 计算统计数据
        total_requests = sum(m.api_stats.get('total_requests', 0) for m in relevant_metrics)
        total_tasks = sum(m.concurrent_stats.get('tasks_processed', 0) for m in relevant_metrics)
        total_failures = sum(m.concurrent_stats.get('tasks_failed', 0) for m in relevant_metrics)

        avg_memory = sum(m.memory_usage for m in relevant_metrics) / len(relevant_metrics)
        avg_cpu = sum(m.cpu_usage for m in relevant_metrics) / len(relevant_metrics)

        # 找出峰值时间
        peak_request_time = max(relevant_metrics, key=lambda m: m.api_stats.get('total_requests', 0))
        peak_memory_time = max(relevant_metrics, key=lambda m: m.memory_usage)

        return {
            'report_period': f'{hours} hours',
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_api_requests': total_requests,
                'total_background_tasks': total_tasks,
                'task_success_rate': ((total_tasks - total_failures) / total_tasks * 100) if total_tasks > 0 else 0,
                'average_memory_usage': f'{avg_memory:.1%}',
                'average_cpu_usage': f'{avg_cpu:.1%}',
                'peak_requests_time': peak_request_time.timestamp.isoformat(),
                'peak_requests_count': peak_request_time.api_stats.get('total_requests', 0),
                'peak_memory_time': peak_memory_time.timestamp.isoformat(),
                'peak_memory_usage': f'{peak_memory_time.memory_usage:.1%}'
            },
            'alerts_summary': {
                'total_alerts': len([a for a in self.alerts if a.timestamp > cutoff_time]),
                'alert_types': list(set(a['type'] for a in self.alerts if a.timestamp > cutoff_time))
            },
            'recommendations': await self._generate_recommendations(relevant_metrics[-1]),
            'detailed_metrics': [asdict(m) for m in relevant_metrics[::6]]  # 每6个数据点取一个
        }

# FastAPI集成示例
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()
performance_manager = PerformanceManager()

@app.on_event("startup")
async def startup():
    await performance_manager.initialize()
    # 启动监控
    asyncio.create_task(performance_manager.start_monitoring())

@app.on_event("shutdown")
async def shutdown():
    await performance_manager.shutdown()

@app.post("/api/visualize")
async def generate_visualization(request: Request, data: dict):
    try:
        # 使用性能管理器处理请求
        result = await performance_manager.process_api_request(
            _generate_visualization_impl,
            request=request,
            data=data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@performance_manager.api_optimizer.cache_response(ttl=300)
@performance_manager.api_optimizer.rate_limit()
async def _generate_visualization_impl(request: Request, data: dict):
    # 实际的可视化生成逻辑
    await asyncio.sleep(1)  # 模拟耗时操作
    return {"status": "success", "data": data}

@app.get("/api/performance/dashboard")
async def get_performance_dashboard():
    return await performance_manager.get_performance_dashboard()

@app.get("/api/performance/report")
async def get_performance_report(hours: int = 24):
    return await performance_manager.generate_performance_report(hours)
"""

# 使用示例
"""
async def main():
    # 创建性能管理器
    manager = PerformanceManager()

    # 初始化
    await manager.initialize()

    # 启动监控（在后台运行）
    monitoring_task = asyncio.create_task(manager.start_monitoring())

    try:
        # 提交一些任务
        task_id = await manager.submit_background_task(
            lambda: asyncio.sleep(2) or "Task completed"
        )

        # 获取性能数据
        dashboard = await manager.get_performance_dashboard()
        print("Performance Dashboard:", json.dumps(dashboard, indent=2, default=str))

        # 等待一段时间收集数据
        await asyncio.sleep(60)

        # 生成报告
        report = await manager.generate_performance_report(1)  # 最近1小时
        print("Performance Report:", json.dumps(report, indent=2, default=str))

    finally:
        # 关闭
        await manager.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
"""