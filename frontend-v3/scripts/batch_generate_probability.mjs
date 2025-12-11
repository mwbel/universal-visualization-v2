import { MockEngine } from '../js/utils/MockEngine.js';
import { VisualizationPrompts } from '../js/utils/PromptTemplates.js';
import fs from 'fs';
import path from 'path';

// 创建输出目录
const outputDir = './generated_pages_v3_structured';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 按照教材目录顺序定义生成任务
const textbookTasks = [
    // 第一章 概率论的基本概念
    {
        subject: 'probability_statistics',
        topic: '古典概型',
        keywords: '古典概型 等可能概型 排列组合 概率计算',
        filename: 'classical_probability.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '条件概率',
        keywords: '条件概率 贝叶斯公式 概率更新 后验概率',
        filename: 'conditional_probability.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '事件独立性',
        keywords: '独立事件 概率乘法 相关性检验 统计独立',
        filename: 'independent_events.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第二章 随机变量及其分布
    {
        subject: 'probability_statistics',
        topic: '分布函数',
        keywords: '分布函数 累积分布函数 CDF 概率计算',
        filename: 'distribution_function.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '连续型随机变量',
        keywords: '概率密度函数 PDF 连续分布 积分概率',
        filename: 'continuous_random_variable.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第四章 随机变量的数字特征
    {
        subject: 'probability_statistics',
        topic: '数学期望',
        keywords: '数学期望 均值 期望值 加权平均',
        filename: 'mathematical_expectation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '方差与标准差',
        keywords: '方差 标准差 离散程度 变异系数',
        filename: 'variance_std_deviation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '协方差与相关系数',
        keywords: '协方差 相关系数 相关性 线性关系',
        filename: 'covariance_correlation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第五章 大数定律及中心极限定理
    {
        subject: 'probability_statistics',
        topic: '大数定律',
        keywords: '大数定律 频率稳定性 收敛性 极限定理',
        filename: 'law_of_large_numbers.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '中心极限定理',
        keywords: '中心极限定理 正态近似 抽样分布 标准化',
        filename: 'central_limit_theorem.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第六章 样本及抽样分布
    {
        subject: 'probability_statistics',
        topic: '直方图与箱线图',
        keywords: '直方图 箱线图 数据可视化 描述统计',
        filename: 'histogram_boxplot.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '抽样分布',
        keywords: '抽样分布 样本统计量 分布形态 样本量影响',
        filename: 'sampling_distribution.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第七章 参数估计
    {
        subject: 'probability_statistics',
        topic: '点估计',
        keywords: '点估计 最大似然估计 矩估计 估计量性质',
        filename: 'point_estimation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '区间估计',
        keywords: '区间估计 置信区间 置信水平 误差范围',
        filename: 'interval_estimation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '正态总体参数估计',
        keywords: '正态分布 均值估计 方差估计 t分布 chi2分布',
        filename: 'normal_parameter_estimation.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第八章 假设检验
    {
        subject: 'probability_statistics',
        topic: '假设检验流程',
        keywords: '假设检验 原假设 备择假设 p值 显著性水平',
        filename: 'hypothesis_testing_process.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: 't检验',
        keywords: 't检验 均值检验 学生t分布 双样本检验',
        filename: 't_test.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '卡方检验',
        keywords: '卡方检验 拟合优度 独立性检验 列联表',
        filename: 'chi_square_test.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },

    // 第九章 方差分析及回归分析
    {
        subject: 'probability_statistics',
        topic: '方差分析',
        keywords: '方差分析 ANOVA 单因素 双因素 均值比较',
        filename: 'anova.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '线性回归',
        keywords: '线性回归 最小二乘法 残差分析 回归系数',
        filename: 'linear_regression.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    },
    {
        subject: 'probability_statistics',
        topic: '多元线性回归',
        keywords: '多元回归 多重共线性 变量选择 模型诊断',
        filename: 'multiple_regression.html',
        template: VisualizationPrompts.PROBABILITY_STATISTICS_VISUALIZATION
    }
];

// 批量生成函数
async function batchGenerate() {
    console.log('开始批量生成概率统计可视化页面...');
    console.log(`共 ${textbookTasks.length} 个任务`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const task of textbookTasks) {
        const outputPath = path.join(outputDir, task.filename);
        
        // 检查文件是否已存在 - 强制重新生成，注释掉跳过逻辑
        // if (fs.existsSync(outputPath)) {
        //     console.log(`跳过已存在文件: ${task.filename}`);
        //     skipCount++;
        //     continue;
        // }
        
        try {
            console.log(`正在生成: ${task.topic} (${task.filename})`);
            
            // 使用MockEngine生成页面
            const mockEngine = new MockEngine();
            const result = mockEngine.generate(`${task.topic} - ${task.keywords}`);
            const htmlContent = result.html;
            
            // 保存HTML文件
            fs.writeFileSync(outputPath, htmlContent, 'utf8');
            console.log(`✓ 生成成功: ${task.filename}`);
            successCount++;
            
            // 添加短暂延迟避免过度请求
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`✗ 生成失败 ${task.filename}:`, error.message);
        }
    }
    
    console.log('\n批量生成完成!');
    console.log(`成功: ${successCount}, 跳过: ${skipCount}, 总计: ${textbookTasks.length}`);
    
    if (successCount > 0) {
        console.log(`\n生成的文件位于: ${path.resolve(outputDir)}`);
    }
}

// 执行批量生成
batchGenerate().catch(console.error);