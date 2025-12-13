#!/usr/bin/env python3
"""
生成测试数据脚本
为可视化缓存系统创建测试记录和示例数据
"""

import sys
import os
import hashlib
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_database
from models.visualization_models import VisualizationRecord, VisualizationTemplate, KeywordIndex

def generate_record_id(prompt: str) -> str:
    """生成记录ID"""
    return hashlib.md5(f"record_{prompt}_{datetime.now().isoformat()}".encode()).hexdigest()[:16]

def extract_keywords_from_prompt(prompt: str, subject: str) -> List[str]:
    """从提示词中提取关键词"""
    # 简单的关键词提取逻辑
    subject_keywords = {
        "数学": ["函数", "图像", "坐标", "方程", "几何", "代数", "微积分", "图形", "曲线", "数学"],
        "物理": ["波动", "频率", "波长", "力", "运动", "能量", "电", "磁", "光学", "物理"],
        "化学": ["分子", "原子", "化学键", "反应", "结构", "化合物", "元素", "化学", "3D", "模型"],
        "天文": ["太阳系", "行星", "轨道", "恒星", "星系", "宇宙", "天文", "模拟", "时间", "空间"],
        "生物": ["细胞", "结构", "生物", "植物", "动物", "细胞器", "生命", "进化", "生态", "系统"]
    }

    keywords = []
    prompt_lower = prompt.lower()

    # 添加学科相关关键词
    for keyword in subject_keywords.get(subject, []):
        if keyword in prompt_lower:
            keywords.append(keyword)

    # 如果没有找到具体关键词，添加学科名称
    if not keywords:
        keywords.append(subject)

    return keywords[:5]  # 限制最多5个关键词

def get_test_prompts() -> List[Dict]:
    """获取测试提示词列表"""
    return [
        {
            "prompt": "画一个二次函数y=x^2的图像",
            "subject": "数学",
            "source": "llm",
            "generation_time": 1200,
            "quality_score": 4.5
        },
        {
            "prompt": "生成正弦波的波动图像，频率2Hz，波长3m",
            "subject": "物理",
            "source": "mock",
            "generation_time": 800,
            "quality_score": 3.8
        },
        {
            "prompt": "显示水分子的3D结构模型",
            "subject": "化学",
            "source": "template",
            "template_id": "84b31dd0ca703c4f",  # 分子结构3D模型模板ID
            "generation_time": 500,
            "quality_score": 4.2
        },
        {
            "prompt": "模拟太阳系行星运行，包含地球和火星轨道",
            "subject": "天文",
            "source": "llm",
            "generation_time": 2500,
            "quality_score": 4.8
        },
        {
            "prompt": "展示植物细胞和动物细胞的对比图",
            "subject": "生物",
            "source": "template",
            "template_id": "a12e56d4a223d673",  # 细胞结构图解模板ID
            "generation_time": 600,
            "quality_score": 4.6
        },
        {
            "prompt": "绘制三角函数y=sin(x)和y=cos(x)的图像",
            "subject": "数学",
            "source": "mock",
            "generation_time": 900,
            "quality_score": 3.9
        },
        {
            "prompt": "创建电磁波的传播动画",
            "subject": "物理",
            "source": "llm",
            "generation_time": 1800,
            "quality_score": 4.3
        },
        {
            "prompt": "展示甲烷CH4分子的球棍模型",
            "subject": "化学",
            "source": "template",
            "template_id": "84b31dd0ca703c4f",
            "generation_time": 550,
            "quality_score": 4.4
        },
        {
            "prompt": "模拟月相变化过程",
            "subject": "天文",
            "source": "mock",
            "generation_time": 1300,
            "quality_score": 3.7
        },
        {
            "prompt": "显示神经元的结构和工作原理",
            "subject": "生物",
            "source": "llm",
            "generation_time": 2000,
            "quality_score": 4.7
        },
        {
            "prompt": "绘制指数函数y=2^x的图像",
            "subject": "数学",
            "source": "template",
            "template_id": "ee4a49be11ff3c55",  # 函数图像生成器模板ID
            "generation_time": 450,
            "quality_score": 4.1
        },
        {
            "prompt": "创建简谐振动的位移-时间图像",
            "subject": "物理",
            "source": "mock",
            "generation_time": 700,
            "quality_score": 3.6
        },
        {
            "prompt": "展示乙醇分子的化学结构式",
            "subject": "化学",
            "source": "template",
            "template_id": "84b31dd0ca703c4f",
            "generation_time": 480,
            "quality_score": 4.0
        },
        {
            "prompt": "模拟小行星撞击地球的过程",
            "subject": "天文",
            "source": "llm",
            "generation_time": 3200,
            "quality_score": 4.9
        },
        {
            "prompt": "展示DNA双螺旋结构模型",
            "subject": "生物",
            "source": "mock",
            "generation_time": 1100,
            "quality_score": 4.5
        }
    ]

def generate_sample_html_content(subject: str, prompt: str) -> str:
    """生成示例HTML内容"""
    sample_contents = {
        "数学": """
<!DOCTYPE html>
<html>
<head>
    <title>数学函数图像</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h1>函数图像</h1>
    <div id="plot" style="width:100%;height:400px;"></div>
    <script>
        // 示例函数图像生成代码
        const xValues = [];
        const yValues = [];
        for(let x = -10; x <= 10; x += 0.1) {
            xValues.push(x);
            yValues.push(Math.pow(x, 2));
        }
        const trace = {x: xValues, y: yValues, type: 'scatter', mode: 'lines'};
        Plotly.newPlot('plot', [trace]);
    </script>
</body>
</html>
        """,
        "物理": """
<!DOCTYPE html>
<html>
<head>
    <title>物理波动模拟</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h1>波动现象模拟</h1>
    <div id="wave" style="width:100%;height:400px;"></div>
    <script>
        // 示例波动模拟代码
        function generateWave() {
            const t = [];
            const y = [];
            for(let i = 0; i < 100; i++) {
                t.push(i * 0.1);
                y.push(Math.sin(i * 0.2));
            }
            return [{x: t, y: y, type: 'scatter', mode: 'lines'}];
        }
        Plotly.newPlot('wave', generateWave());
    </script>
</body>
</html>
        """,
        "化学": """
<!DOCTYPE html>
<html>
<head>
    <title>化学分子结构</title>
</head>
<body>
    <h1>分子结构模型</h1>
    <div id="molecule">
        <p>分子结构可视化示例</p>
        <div style="width:300px;height:300px;background:#f0f0f0;margin:20px auto;">
            <p style="text-align:center;padding-top:150px;">3D分子模型显示区域</p>
        </div>
    </div>
</body>
</html>
        """,
        "天文": """
<!DOCTYPE html>
<html>
<head>
    <title>天文模拟</title>
</head>
<body>
    <h1>太阳系模拟</h1>
    <div id="solar_system">
        <p>天体运动模拟示例</p>
        <div style="width:500px;height:400px;background:#000033;margin:20px auto;color:white;">
            <p style="text-align:center;padding-top:200px;">太阳系模拟显示区域</p>
        </div>
    </div>
</body>
</html>
        """,
        "生物": """
<!DOCTYPE html>
<html>
<head>
    <title>生物结构图</title>
</head>
<body>
    <h1>细胞结构</h1>
    <div id="cell">
        <p>生物结构可视化示例</p>
        <div style="width:400px;height:300px;background:#e8f5e8;margin:20px auto;">
            <p style="text-align:center;padding-top:150px;">细胞结构显示区域</p>
        </div>
    </div>
</body>
</html>
        """
    }

    return sample_contents.get(subject, sample_contents["数学"])

def generate_test_visualization_records() -> List[VisualizationRecord]:
    """生成测试可视化记录"""
    test_prompts = get_test_prompts()
    records = []

    for i, prompt_data in enumerate(test_prompts):
        # 提取关键词
        keywords = extract_keywords_from_prompt(prompt_data["prompt"], prompt_data["subject"])

        # 生成记录
        record = VisualizationRecord(
            id=generate_record_id(prompt_data["prompt"]),
            prompt=prompt_data["prompt"],
            keywords=",".join(keywords),
            subject=prompt_data["subject"],
            template_id=prompt_data.get("template_id"),
            generation_source=prompt_data["source"],
            html_content=generate_sample_html_content(prompt_data["subject"], prompt_data["prompt"]),
            parameters_used={"prompt": prompt_data["prompt"], **prompt_data},
            generation_time_ms=prompt_data["generation_time"],
            cache_hit=prompt_data["source"] == "template",  # 模板来源算作缓存命中
            usage_count=random.randint(1, 10),
            quality_score=prompt_data["quality_score"],
            expires_at=datetime.utcnow() + timedelta(days=random.randint(7, 30)),
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        )

        records.append(record)

    return records

def update_keyword_usage(db: SessionLocal, records: List[VisualizationRecord]):
    """更新关键词使用频率"""
    # 先获取所有现有关键词
    existing_keywords = {kw.keyword: kw for kw in db.query(KeywordIndex).all()}

    for record in records:
        if record.keywords:
            keywords = record.keywords.split(',')
            for keyword in keywords:
                keyword = keyword.strip()
                if keyword:
                    # 查找或创建关键词
                    if keyword in existing_keywords:
                        # 更新现有关键词
                        db_keyword = existing_keywords[keyword]
                        db_keyword.usage_frequency += 1
                        db_keyword.last_used = datetime.utcnow()
                    else:
                        # 创建新关键词
                        new_keyword = KeywordIndex(
                            keyword=keyword,
                            subject=record.subject,
                            usage_frequency=1
                        )
                        db.add(new_keyword)
                        existing_keywords[keyword] = new_keyword

def generate_test_data():
    """生成测试数据"""
    print("开始生成测试数据...")

    # 确保数据库已初始化
    print("初始化数据库...")
    if not init_database():
        raise Exception("数据库初始化失败")

    db = SessionLocal()
    try:
        # 检查是否已有测试数据
        existing_records = db.query(VisualizationRecord).count()
        if existing_records > 0:
            print(f"数据库中已存在 {existing_records} 条记录，跳过测试数据生成")
            return {"skipped": True, "existing_records": existing_records}

        # 生成测试记录
        print("生成可视化测试记录...")
        test_records = generate_test_visualization_records()

        # 批量插入记录
        db.add_all(test_records)

        # 更新关键词使用频率
        print("更新关键词使用频率...")
        update_keyword_usage(db, test_records)

        # 提交事务
        db.commit()

        print("✅ 测试数据生成完成!")

        # 统计信息
        total_records = db.query(VisualizationRecord).count()
        total_keywords = db.query(KeywordIndex).count()
        subject_stats = {}

        for record in test_records:
            if record.subject not in subject_stats:
                subject_stats[record.subject] = 0
            subject_stats[record.subject] += 1

        print(f"统计信息:")
        print(f"  - 总记录数: {total_records}")
        print(f"  - 关键词数: {total_keywords}")
        print(f"  - 按学科分布:")
        for subject, count in subject_stats.items():
            print(f"    * {subject}: {count} 条")

        return {
            "success": True,
            "total_records": total_records,
            "total_keywords": total_keywords,
            "subject_distribution": subject_stats
        }

    except Exception as e:
        db.rollback()
        print(f"❌ 测试数据生成失败: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

def verify_test_data():
    """验证测试数据"""
    print("\n验证测试数据...")

    db = SessionLocal()
    try:
        # 检查记录数
        record_count = db.query(VisualizationRecord).count()
        print(f"可视化记录总数: {record_count}")

        # 按学科统计
        from sqlalchemy import func
        subject_stats = db.query(
            VisualizationRecord.subject,
            func.count(VisualizationRecord.id).label('count'),
            func.avg(VisualizationRecord.quality_score).label('avg_quality')
        ).group_by(VisualizationRecord.subject).all()

        print("\n按学科分布:")
        for subject, count, avg_quality in subject_stats:
            print(f"  {subject}: {count} 条记录, 平均质量: {avg_quality:.2f}")

        # 检查缓存命中率
        cache_hits = db.query(VisualizationRecord).filter_by(cache_hit=True).count()
        cache_hit_rate = (cache_hits / record_count * 100) if record_count > 0 else 0
        print(f"\n缓存命中率: {cache_hit_rate:.1f}% ({cache_hits}/{record_count})")

        # 检查关键词统计
        keyword_count = db.query(KeywordIndex).count()
        high_freq_keywords = db.query(KeywordIndex).filter(
            KeywordIndex.usage_frequency > 1
        ).order_by(KeywordIndex.usage_frequency.desc()).limit(5).all()

        print(f"\n关键词总数: {keyword_count}")
        print("高频关键词:")
        for kw in high_freq_keywords:
            print(f"  {kw.keyword}: {kw.usage_frequency} 次 ({kw.subject})")

    finally:
        db.close()

if __name__ == "__main__":
    print("开始生成可视化系统测试数据...")

    try:
        result = generate_test_data()

        if not result.get("skipped"):
            verify_test_data()
            print(f"\n🎉 测试数据生成成功!")
            print(f"   新增记录: {result['total_records']}")
            print(f"   关键词总数: {result['total_keywords']}")
        else:
            print(f"\n⏭️  跳过测试数据生成 (已有 {result['existing_records']} 条记录)")

    except Exception as e:
        print(f"\n❌ 测试数据生成失败: {e}")
        sys.exit(1)