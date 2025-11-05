"""
Concurrent Processing Optimizer
并发处理优化器

功能包括：
- 异步任务队列
- 并发控制
- 任务调度
- 资源管理
- 性能监控
"""

import asyncio
import time
import uuid
import json
import logging
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import aioredis
from functools import wraps
import inspect
import traceback

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

class TaskPriority(Enum):
    """任务优先级"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class Task:
    """任务对象"""
    id: str
    func: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    priority: TaskPriority = TaskPriority.NORMAL
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: Optional[Exception] = None
    retry_count: int = 0
    dependencies: List[str] = field(default_factory=list)

@dataclass
class WorkerConfig:
    """工作进程配置"""
    max_workers: int = 10
    max_concurrent_tasks: int = 50
    task_timeout: float = 300.0  # 5分钟
    worker_idle_timeout: float = 60.0  # 1分钟
    health_check_interval: float = 30.0  # 30秒

class TaskQueue:
    """异步任务队列"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = None
        self.redis_url = redis_url
        self.queues = {
            TaskPriority.CRITICAL: asyncio.PriorityQueue(),
            TaskPriority.HIGH: asyncio.PriorityQueue(),
            TaskPriority.NORMAL: asyncio.PriorityQueue(),
            TaskPriority.LOW: asyncio.PriorityQueue()
        }
        self.running_tasks = {}
        self.completed_tasks = {}

    async def connect(self):
        """连接Redis"""
        try:
            self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
            logger.info("✅ 任务队列Redis连接成功")
        except Exception as e:
            logger.warning(f"⚠️ Redis连接失败，使用内存队列: {e}")

    async def put_task(self, task: Task) -> str:
        """添加任务到队列"""
        # 生成任务ID
        if not task.id:
            task.id = str(uuid.uuid4())

        # 添加到内存队列
        priority_value = -task.priority.value  # 负数实现高优先级
        await self.queues[task.priority].put((priority_value, task.id, task))

        # 持久化到Redis
        if self.redis:
            try:
                task_data = {
                    'id': task.id,
                    'priority': task.priority.value,
                    'created_at': task.created_at.isoformat(),
                    'status': task.status.value
                }
                await self.redis.hset(
                    f"task:{task.id}",
                    mapping=task_data
                )
                await self.redis.expire(f"task:{task.id}", 86400)  # 24小时过期
            except Exception as e:
                logger.warning(f"Redis任务存储失败: {e}")

        logger.info(f"📝 任务已添加: {task.id} (优先级: {task.priority.name})")
        return task.id

    async def get_task(self) -> Optional[Task]:
        """从队列获取任务"""
        # 按优先级顺序检查队列
        for priority in sorted(TaskPriority, key=lambda x: x.value, reverse=True):
            try:
                if not self.queues[priority].empty():
                    _, task_id, task = await asyncio.wait_for(
                        self.queues[priority].get(),
                        timeout=0.1
                    )
                    return task
            except asyncio.TimeoutError:
                continue

        return None

    async def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """根据ID获取任务"""
        # 检查运行中的任务
        if task_id in self.running_tasks:
            return self.running_tasks[task_id]

        # 检查已完成的任务
        if task_id in self.completed_tasks:
            return self.completed_tasks[task_id]

        # 从Redis获取任务信息
        if self.redis:
            try:
                task_data = await self.redis.hgetall(f"task:{task_id}")
                if task_data:
                    # 这里需要重建完整的任务对象
                    # 实际实现中可能需要更复杂的反序列化逻辑
                    logger.info(f"从Redis获取任务: {task_id}")
            except Exception as e:
                logger.warning(f"Redis任务读取失败: {e}")

        return None

    async def update_task_status(self, task_id: str, status: TaskStatus, result: Any = None, error: Exception = None):
        """更新任务状态"""
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            task.status = status

            if status == TaskStatus.RUNNING:
                task.started_at = datetime.now()
            elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                task.completed_at = datetime.now()
                if result is not None:
                    task.result = result
                if error is not None:
                    task.error = error

                # 移动到完成队列
                self.completed_tasks[task_id] = self.running_tasks.pop(task_id)

            # 更新Redis状态
            if self.redis:
                try:
                    await self.redis.hset(
                        f"task:{task_id}",
                        mapping={
                            'status': status.value,
                            'updated_at': datetime.now().isoformat()
                        }
                    )
                except Exception as e:
                    logger.warning(f"Redis状态更新失败: {e}")

            logger.info(f"🔄 任务状态更新: {task_id} -> {status.value}")

    async def get_queue_stats(self) -> Dict:
        """获取队列统计"""
        stats = {
            'pending_tasks': {
                priority.name: queue.qsize()
                for priority, queue in self.queues.items()
            },
            'running_tasks': len(self.running_tasks),
            'completed_tasks': len(self.completed_tasks),
            'total_pending': sum(queue.qsize() for queue in self.queues.values())
        }

        # Redis统计
        if self.redis:
            try:
                redis_keys = await self.redis.keys("task:*")
                stats['redis_tasks'] = len(redis_keys)
            except Exception:
                stats['redis_tasks'] = 0

        return stats

class ConcurrentProcessor:
    """并发处理器"""

    def __init__(self, config: WorkerConfig = None):
        self.config = config or WorkerConfig()
        self.task_queue = TaskQueue()
        self.workers = []
        self.thread_executor = ThreadPoolExecutor(max_workers=self.config.max_workers)
        self.process_executor = ProcessPoolExecutor(max_workers=self.config.max_workers // 2)
        self.running = False
        self.stats = {
            'tasks_processed': 0,
            'tasks_failed': 0,
            'tasks_cancelled': 0,
            'avg_processing_time': 0.0,
            'start_time': None
        }

    async def start(self):
        """启动并发处理器"""
        if self.running:
            logger.warning("⚠️ 并发处理器已在运行")
            return

        await self.task_queue.connect()
        self.running = True
        self.stats['start_time'] = datetime.now()

        # 启动工作协程
        for i in range(self.config.max_concurrent_tasks):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)

        # 启动监控协程
        monitor = asyncio.create_task(self._monitor())
        self.workers.append(monitor)

        logger.info(f"🚀 并发处理器已启动: {self.config.max_concurrent_tasks} 个工作协程")

    async def stop(self):
        """停止并发处理器"""
        if not self.running:
            return

        self.running = False

        # 等待所有工作协程完成
        await asyncio.gather(*self.workers, return_exceptions=True)

        # 关闭执行器
        self.thread_executor.shutdown(wait=True)
        self.process_executor.shutdown(wait=True)

        logger.info("🛑 并发处理器已停止")

    async def _worker(self, name: str):
        """工作协程"""
        logger.info(f"👷 工作协程启动: {name}")

        while self.running:
            try:
                # 获取任务
                task = await asyncio.wait_for(
                    self.task_queue.get_task(),
                    timeout=self.config.worker_idle_timeout
                )

                if task:
                    await self._execute_task(task, name)
                else:
                    # 空闲等待
                    await asyncio.sleep(0.1)

            except asyncio.TimeoutError:
                logger.debug(f"💤 工作协程空闲超时: {name}")
            except Exception as e:
                logger.error(f"❌ 工作协程异常: {name} - {e}")

        logger.info(f"👷 工作协程停止: {name}")

    async def _execute_task(self, task: Task, worker_name: str):
        """执行任务"""
        task_id = task.id

        # 检查任务依赖
        if not await self._check_dependencies(task):
            logger.info(f"⏳ 任务依赖未满足，重新入队: {task_id}")
            await self.task_queue.put_task(task)
            return

        # 更新任务状态
        await self.task_queue.update_task_status(task_id, TaskStatus.RUNNING)
        self.task_queue.running_tasks[task_id] = task

        try:
            # 执行任务
            start_time = time.time()

            if inspect.iscoroutinefunction(task.func):
                # 异步函数
                result = await asyncio.wait_for(
                    task.func(*task.args, **task.kwargs),
                    timeout=task.timeout or self.config.task_timeout
                )
            else:
                # 同步函数，在线程池中执行
                loop = asyncio.get_event_loop()
                result = await asyncio.wait_for(
                    loop.run_in_executor(
                        self.thread_executor,
                        lambda: task.func(*task.args, **task.kwargs)
                    ),
                    timeout=task.timeout or self.config.task_timeout
                )

            execution_time = time.time() - start_time

            # 更新统计
            self.stats['tasks_processed'] += 1
            self._update_avg_processing_time(execution_time)

            # 任务完成
            await self.task_queue.update_task_status(task_id, TaskStatus.COMPLETED, result=result)
            logger.info(f"✅ 任务完成: {task_id} ({worker_name}) - 耗时 {execution_time:.2f}s")

        except asyncio.TimeoutError:
            logger.warning(f"⏰ 任务超时: {task_id}")
            await self._handle_task_timeout(task)
        except Exception as e:
            logger.error(f"❌ 任务失败: {task_id} - {e}")
            await self._handle_task_failure(task, e)

    async def _check_dependencies(self, task: Task) -> bool:
        """检查任务依赖"""
        for dep_id in task.dependencies:
            dep_task = await self.task_queue.get_task_by_id(dep_id)
            if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                return False
        return True

    async def _handle_task_timeout(self, task: Task):
        """处理任务超时"""
        task.retry_count += 1

        if task.retry_count <= task.max_retries:
            # 重试任务
            await asyncio.sleep(task.retry_delay)
            task.status = TaskStatus.RETRYING
            await self.task_queue.put_task(task)
            logger.info(f"🔄 任务重试: {task.id} (第{task.retry_count}次)")
        else:
            # 标记为失败
            await self.task_queue.update_task_status(
                task.id,
                TaskStatus.FAILED,
                error=TimeoutError(f"任务超时: {task.timeout}s")
            )
            self.stats['tasks_failed'] += 1

    async def _handle_task_failure(self, task: Task, error: Exception):
        """处理任务失败"""
        task.retry_count += 1
        task.error = error

        if task.retry_count <= task.max_retries:
            # 重试任务
            await asyncio.sleep(task.retry_delay)
            task.status = TaskStatus.RETRYING
            await self.task_queue.put_task(task)
            logger.info(f"🔄 任务重试: {task.id} (第{task.retry_count}次) - {error}")
        else:
            # 标记为失败
            await self.task_queue.update_task_status(
                task.id,
                TaskStatus.FAILED,
                error=error
            )
            self.stats['tasks_failed'] += 1

    def _update_avg_processing_time(self, execution_time: float):
        """更新平均处理时间"""
        total_tasks = self.stats['tasks_processed']
        if total_tasks == 1:
            self.stats['avg_processing_time'] = execution_time
        else:
            self.stats['avg_processing_time'] = (
                (self.stats['avg_processing_time'] * (total_tasks - 1) + execution_time) / total_tasks
            )

    async def _monitor(self):
        """监控协程"""
        while self.running:
            try:
                # 获取队列统计
                queue_stats = await self.task_queue.get_queue_stats()

                # 计算运行时间
                runtime = (datetime.now() - self.stats['start_time']).total_seconds()

                # 计算吞吐量
                throughput = self.stats['tasks_processed'] / runtime if runtime > 0 else 0

                logger.info(f"📊 性能统计 - 处理器状态: 运行中 {runtime:.1f}s, "
                           f"已处理 {self.stats['tasks_processed']} 个任务, "
                           f"失败 {self.stats['tasks_failed']} 个, "
                           f"吞吐量 {throughput:.2f} 任务/秒, "
                           f"待处理 {queue_stats['total_pending']} 个")

                # 检查健康状态
                await self._health_check()

                await asyncio.sleep(self.config.health_check_interval)

            except Exception as e:
                logger.error(f"❌ 监控协程异常: {e}")
                await asyncio.sleep(5)

    async def _health_check(self):
        """健康检查"""
        # 检查内存使用
        try:
            import psutil
            memory_percent = psutil.virtual_memory().percent
            if memory_percent > 90:
                logger.warning(f"⚠️ 内存使用率过高: {memory_percent:.1f}%")
        except ImportError:
            pass

        # 检查任务积压
        queue_stats = await self.task_queue.get_queue_stats()
        if queue_stats['total_pending'] > 1000:
            logger.warning(f"⚠️ 任务积压严重: {queue_stats['total_pending']} 个待处理任务")

    async def submit_task(self, func: Callable, *args,
                         priority: TaskPriority = TaskPriority.NORMAL,
                         max_retries: int = 3,
                         timeout: Optional[float] = None,
                         dependencies: List[str] = None,
                         **kwargs) -> str:
        """提交任务"""
        task = Task(
            id=str(uuid.uuid4()),
            func=func,
            args=args,
            kwargs=kwargs,
            priority=priority,
            max_retries=max_retries,
            timeout=timeout,
            dependencies=dependencies or []
        )

        return await self.task_queue.put_task(task)

    async def get_task_status(self, task_id: str) -> Optional[Dict]:
        """获取任务状态"""
        task = await self.task_queue.get_task_by_id(task_id)
        if not task:
            return None

        return {
            'id': task.id,
            'status': task.status.value,
            'created_at': task.created_at.isoformat(),
            'started_at': task.started_at.isoformat() if task.started_at else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'priority': task.priority.name,
            'retry_count': task.retry_count,
            'max_retries': task.max_retries,
            'result': task.result if task.status == TaskStatus.COMPLETED else None,
            'error': str(task.error) if task.error else None
        }

    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        task = await self.task_queue.get_task_by_id(task_id)
        if task and task.status == TaskStatus.PENDING:
            await self.task_queue.update_task_status(task_id, TaskStatus.CANCELLED)
            self.stats['tasks_cancelled'] += 1
            logger.info(f"🚫 任务已取消: {task_id}")
            return True
        return False

    async def get_performance_stats(self) -> Dict:
        """获取性能统计"""
        queue_stats = await self.task_queue.get_queue_stats()
        runtime = (datetime.now() - self.stats['start_time']).total_seconds() if self.stats['start_time'] else 0

        return {
            'runtime_seconds': runtime,
            'tasks_processed': self.stats['tasks_processed'],
            'tasks_failed': self.stats['tasks_failed'],
            'tasks_cancelled': self.stats['tasks_cancelled'],
            'avg_processing_time': self.stats['avg_processing_time'],
            'throughput_per_second': self.stats['tasks_processed'] / runtime if runtime > 0 else 0,
            'success_rate': (self.stats['tasks_processed'] / (self.stats['tasks_processed'] + self.stats['tasks_failed']) * 100) if (self.stats['tasks_processed'] + self.stats['tasks_failed']) > 0 else 0,
            'queue_stats': queue_stats,
            'worker_count': len(self.workers),
            'max_workers': self.config.max_workers,
            'max_concurrent_tasks': self.config.max_concurrent_tasks
        }

def concurrent_task(priority: TaskPriority = TaskPriority.NORMAL,
                   max_retries: int = 3,
                   timeout: Optional[float] = None):
    """并发任务装饰器"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 如果已经在并发处理器环境中，直接执行
            if 'concurrent_processor' in kwargs:
                processor = kwargs['concurrent_processor']
                return await processor.submit_task(
                    func, *args,
                    priority=priority,
                    max_retries=max_retries,
                    timeout=timeout,
                    **{k: v for k, v in kwargs.items() if k != 'concurrent_processor'}
                )
            else:
                # 否则直接执行
                if inspect.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)

        return wrapper
    return decorator

# 使用示例
"""
# 创建并发处理器
processor = ConcurrentProcessor()
await processor.start()

# 定义任务函数
@concurrent_task(priority=TaskPriority.HIGH, max_retries=3)
async def generate_visualization(data: dict):
    # 耗时的可视化生成逻辑
    await asyncio.sleep(2)
    return {"status": "completed", "data": data}

# 提交任务
task_id = await processor.submit_task(generate_visualization, {"type": "chart"})

# 检查任务状态
status = await processor.get_task_status(task_id)

# 获取性能统计
stats = await processor.get_performance_stats()
"""

# 批量任务处理器
class BatchProcessor:
    """批量任务处理器"""

    def __init__(self, concurrent_processor: ConcurrentProcessor):
        self.processor = concurrent_processor

    async def process_batch(self, func: Callable, items: List[Any],
                           batch_size: int = 10,
                           max_concurrent_batches: int = 5) -> List[str]:
        """批量处理任务"""
        task_ids = []

        # 分批处理
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            task_id = await self.processor.submit_task(func, batch)
            task_ids.append(task_id)

            # 控制并发批次数量
            if len(task_ids) >= max_concurrent_batches:
                # 等待一些任务完成
                await self._wait_for_tasks_completion(task_ids[:-max_concurrent_batches//2])

        return task_ids

    async def _wait_for_tasks_completion(self, task_ids: List[str], timeout: float = 300.0):
        """等待任务完成"""
        start_time = time.time()

        while task_ids and time.time() - start_time < timeout:
            completed_tasks = []

            for task_id in task_ids:
                status = await self.processor.get_task_status(task_id)
                if status and status['status'] in ['completed', 'failed', 'cancelled']:
                    completed_tasks.append(task_id)

            # 移除已完成的任务
            for task_id in completed_tasks:
                task_ids.remove(task_id)

            if task_ids:
                await asyncio.sleep(1)

        return len(task_ids) == 0

# 全局实例（可选）
_global_processor = None

async def get_global_processor() -> ConcurrentProcessor:
    """获取全局并发处理器"""
    global _global_processor
    if _global_processor is None:
        _global_processor = ConcurrentProcessor()
        await _global_processor.start()
    return _global_processor