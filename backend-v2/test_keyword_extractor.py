#!/usr/bin/env python3
"""
关键词提取服务准确率测试
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.keyword_extractor import extract_keywords_with_subject, classify_text_subject

def test_keyword_extraction_accuracy():
    """测试关键词提取准确率"""

    # 测试数据集（文本，期望学科，期望关键词）
    test_cases = [
        {
            "text": "画一个二次函数y=x^2的图像，包含坐标轴",
            "expected_subject": "数学",
            "expected_keywords": ["函数", "图像", "坐标", "二次函数"]
        },
        {
            "text": "生成正弦波的波动图像，频率2Hz，波长3m",
            "expected_subject": "物理",
            "expected_keywords": ["波动", "频率", "波长", "正弦波"]
        },
        {
            "text": "显示水分子的3D结构模型，包含化学键",
            "expected_subject": "化学",
            "expected_keywords": ["分子", "结构", "化学键", "3D模型"]
        },
        {
            "text": "模拟太阳系行星运行，包含地球和火星轨道",
            "expected_subject": "天文",
            "expected_keywords": ["太阳系", "行星", "轨道", "模拟"]
        },
        {
            "text": "展示植物细胞和动物细胞的对比图",
            "expected_subject": "生物",
            "expected_keywords": ["细胞", "植物", "动物", "结构"]
        },
        {
            "text": "绘制三角函数y=sin(x)和y=cos(x)的图像",
            "expected_subject": "数学",
            "expected_keywords": ["三角函数", "图像", "函数"]
        },
        {
            "text": "创建电磁波的传播动画",
            "expected_subject": "物理",
            "expected_keywords": ["电磁波", "波动", "动画"]
        },
        {
            "text": "展示甲烷CH4分子的球棍模型",
            "expected_subject": "化学",
            "expected_keywords": ["分子", "甲烷", "球棍模型"]
        },
        {
            "text": "模拟小行星撞击地球的过程",
            "expected_subject": "天文",
            "expected_keywords": ["小行星", "地球", "模拟", "撞击"]
        },
        {
            "text": "展示DNA双螺旋结构模型",
            "expected_subject": "生物",
            "expected_keywords": ["DNA", "双螺旋", "结构", "模型"]
        }
    ]

    # 评估指标
    subject_correct = 0
    keyword_precision_total = 0
    keyword_recall_total = 0
    total_cases = len(test_cases)

    print("关键词提取准确率测试")
    print("=" * 60)

    for i, test_case in enumerate(test_cases, 1):
        text = test_case["text"]
        expected_subject = test_case["expected_subject"]
        expected_keywords = set(test_case["expected_keywords"])

        # 执行关键词提取
        result = extract_keywords_with_subject(text, max_keywords=8)
        predicted_subject = result["subject"]
        predicted_keywords = set(result["keywords"])

        # 评估学科分类
        subject_is_correct = predicted_subject == expected_subject
        if subject_is_correct:
            subject_correct += 1

        # 评估关键词提取
        # 精确率：预测关键词中正确的比例
        true_positives = predicted_keywords & expected_keywords
        false_positives = predicted_keywords - expected_keywords
        precision = len(true_positives) / len(predicted_keywords) if predicted_keywords else 0

        # 召回率：期望关键词中被找到的比例
        false_negatives = expected_keywords - predicted_keywords
        recall = len(true_positives) / len(expected_keywords) if expected_keywords else 0

        keyword_precision_total += precision
        keyword_recall_total += recall

        # 打印结果
        status = "✅" if subject_is_correct else "❌"
        print(f"{status} 测试 {i}: {expected_subject}")
        print(f"   文本: {text[:50]}...")
        print(f"   学科: {predicted_subject} (期望: {expected_subject})")
        print(f"   关键词: {list(predicted_keywords)}")
        print(f"   期望关键词: {list(expected_keywords)}")
        print(f"   关键词重叠: {list(true_positives)}")
        print(f"   精确率: {precision:.2f}, 召回率: {recall:.2f}")
        print()

    # 计算总体准确率
    subject_accuracy = subject_correct / total_cases
    avg_precision = keyword_precision_total / total_cases
    avg_recall = keyword_recall_total / total_cases
    f1_score = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall) if (avg_precision + avg_recall) > 0 else 0

    print("=" * 60)
    print("总体评估结果:")
    print(f"测试用例数: {total_cases}")
    print(f"学科分类准确率: {subject_accuracy:.2f} ({subject_correct}/{total_cases})")
    print(f"关键词提取精确率: {avg_precision:.2f}")
    print(f"关键词提取召回率: {avg_recall:.2f}")
    print(f"关键词提取F1分数: {f1_score:.2f}")

    # 判断是否达到目标要求（>90%）
    target_met = subject_accuracy >= 0.90 and avg_precision >= 0.90
    print(f"\n是否达到目标 (>90%): {'✅ 是' if target_met else '❌ 否'}")

    return {
        "subject_accuracy": subject_accuracy,
        "keyword_precision": avg_precision,
        "keyword_recall": avg_recall,
        "f1_score": f1_score,
        "target_met": target_met
    }

if __name__ == "__main__":
    results = test_keyword_extraction_accuracy()

    # 根据测试结果决定退出码
    sys.exit(0 if results["target_met"] else 1)