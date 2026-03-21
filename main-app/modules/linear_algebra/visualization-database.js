/**
 * 线性代数可视化数据库系统
 * 用于管理已完成的可视化页面和概念映射
 */

class LinearAlgebraVisualizationDB {
  constructor() {
    this.concepts = new Map();
    this.chapters = new Map();
    this.initializeDatabase();
  }

  /**
   * 初始化数据库，导入现有的可视化页面
   */
  initializeDatabase() {
    // 第一章 行列式
    this.addChapter(1, '行列式', [
      {
        concept: '二阶行列式',
        section: '1.1',
        description: '平行四边形面积的几何意义',
        page: 'pages/二阶行列式可视化.html',
        keywords: ['行列式', '二阶', '面积', '几何意义'],
        status: 'completed'
      },
      {
        concept: '三阶行列式',
        section: '1.1',
        description: '平行六面体体积的可视化',
        page: 'pages/三阶行列式可视化.html',
        keywords: ['行列式', '三阶', '体积', '几何意义'],
        status: 'completed'
      }
    ]);

    // 第二章 矩阵
    this.addChapter(2, '矩阵', [
      {
        concept: '矩阵运算',
        section: '2.2',
        description: '矩阵加法、乘法、转置的交互演示',
        page: 'pages/矩阵运算可视化.html',
        keywords: ['矩阵', '加法', '乘法', '转置', '运算'],
        status: 'completed'
      },
      {
        concept: '矩阵的初等变换',
        section: '2.5',
        description: '初等变换的矩阵表示',
        page: 'pages/初等方阵可视化.html',
        keywords: ['初等变换', '初等方阵', '矩阵'],
        status: 'completed'
      },
      {
        concept: '高斯消元法',
        section: '2.7',
        description: '逐步展示矩阵化简过程',
        page: 'pages/矩阵高斯消元法可视化.html',
        keywords: ['高斯消元', '消元法', '线性方程组', '矩阵化简'],
        status: 'completed'
      },
      {
        concept: '矩阵的秩',
        section: '2.5',
        description: '秩的概念及其几何意义',
        page: 'pages/矩阵秩的可视化.html',
        keywords: ['秩', '矩阵秩', '线性相关'],
        status: 'completed'
      }
    ]);

    // 第三章 n维向量与线性方程组
    this.addChapter(3, 'n维向量与线性方程组', [
      {
        concept: '向量的线性关系',
        section: '3.2',
        description: '向量的线性组合、基和维数的展示',
        page: 'pages/向量空间可视化.html',
        keywords: ['向量', '线性组合', '基', '维数', '线性空间'],
        status: 'completed'
      },
      {
        concept: '向量投影',
        section: '3.2',
        description: '投影和正交分解的可视化',
        page: 'pages/向量投影可视化.html',
        keywords: ['向量投影', '正交分解', '投影'],
        status: 'completed'
      },
      {
        concept: '线性方程组',
        section: '3.4, 3.5',
        description: '唯一解、无穷多解、无解的几何解释',
        page: 'pages/线性方程组可视化.html',
        keywords: ['线性方程组', '解的情况', '几何解释'],
        status: 'completed'
      }
    ]);

    // 第四章 线性空间
    this.addChapter(4, '线性空间', [
      {
        concept: '线性空间',
        section: '4.1, 4.2',
        description: '线性空间的概念、基和维数',
        page: 'pages/向量空间可视化.html',
        keywords: ['线性空间', '基', '维数', '坐标'],
        status: 'completed'
      }
    ]);

    // 第五章 矩阵的对角化
    this.addChapter(5, '矩阵的对角化', [
      {
        concept: '特征值与特征向量',
        section: '5.1',
        description: '特征值和特征向量的几何意义',
        page: 'pages/特征值分解可视化.html',
        keywords: ['特征值', '特征向量', '对角化'],
        status: 'completed'
      },
      {
        concept: '正交矩阵',
        section: '5.3',
        description: '正交矩阵和QR分解的可视化',
        page: 'pages/正交分解可视化.html',
        keywords: ['正交矩阵', 'QR分解', '正交分解'],
        status: 'completed'
      },
      {
        concept: '旋转矩阵',
        section: '5.3',
        description: '2D和3D旋转变换',
        page: 'pages/旋转矩阵可视化.html',
        keywords: ['旋转矩阵', '旋转变换', '正交矩阵'],
        status: 'completed'
      },
      {
        concept: '奇异值分解',
        section: '扩展内容',
        description: '理解SVD的几何意义：旋转-拉伸-旋转的组合',
        page: 'pages/奇异值分解可视化.html',
        keywords: ['SVD', '奇异值分解', '矩阵分解'],
        status: 'completed'
      },
      {
        concept: '最小二乘法',
        section: '扩展内容',
        description: '数据拟合与线性回归的可视化演示',
        page: 'pages/最小二乘法可视化.html',
        keywords: ['最小二乘法', '线性回归', '数据拟合'],
        status: 'completed'
      }
    ]);

    // 第六章 实二次型
    this.addChapter(6, '实二次型', [
      {
        concept: '二次型标准化',
        section: '6.1, 6.2',
        description: '将二次型化为标准形的可视化过程',
        page: 'pages/二次型标准化可视化.html',
        keywords: ['二次型', '标准形', '正定', '负定'],
        status: 'completed'
      }
    ]);

    // 第七章 线性变换
    this.addChapter(7, '线性变换', [
      {
        concept: '线性变换',
        section: '7.1, 7.2',
        description: '矩阵作为线性变换的几何解释和动态演示',
        page: 'pages/线性变换可视化.html',
        keywords: ['线性变换', '矩阵变换', '几何变换'],
        status: 'completed'
      }
    ]);
  }

  /**
   * 添加章节
   */
  addChapter(chapterNum, chapterName, concepts) {
    this.chapters.set(chapterNum, {
      name: chapterName,
      concepts: concepts
    });

    // 将概念添加到概念映射中
    concepts.forEach(concept => {
      this.concepts.set(concept.concept, {
        ...concept,
        chapter: chapterNum,
        chapterName: chapterName
      });
    });
  }

  /**
   * 搜索概念
   */
  searchConcept(query) {
    query = query.toLowerCase();
    const results = [];

    for (const [conceptName, conceptData] of this.concepts) {
      // 检查概念名称
      if (conceptName.toLowerCase().includes(query)) {
        results.push({ ...conceptData, matchType: 'name', score: 10 });
        continue;
      }

      // 检查关键词
      const keywordMatch = conceptData.keywords.some(keyword =>
        keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase())
      );
      if (keywordMatch) {
        results.push({ ...conceptData, matchType: 'keyword', score: 5 });
        continue;
      }

      // 检查描述
      if (conceptData.description.toLowerCase().includes(query)) {
        results.push({ ...conceptData, matchType: 'description', score: 3 });
      }
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * 获取概念详情
   */
  getConcept(conceptName) {
    return this.concepts.get(conceptName);
  }

  /**
   * 检查概念是否已存在
   */
  hasConcept(conceptName) {
    return this.concepts.has(conceptName);
  }

  /**
   * 添加新概念
   */
  addConcept(chapterNum, conceptData) {
    const chapter = this.chapters.get(chapterNum);
    if (!chapter) {
      throw new Error(`章节 ${chapterNum} 不存在`);
    }

    // 添加到章节
    chapter.concepts.push(conceptData);

    // 添加到概念映射
    this.concepts.set(conceptData.concept, {
      ...conceptData,
      chapter: chapterNum,
      chapterName: chapter.name
    });

    return conceptData;
  }

  /**
   * 获取所有章节
   */
  getAllChapters() {
    const chapters = [];
    for (const [num, data] of this.chapters) {
      chapters.push({
        number: num,
        name: data.name,
        conceptCount: data.concepts.length,
        concepts: data.concepts
      });
    }
    return chapters;
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    let totalConcepts = 0;
    let completedConcepts = 0;

    for (const chapter of this.chapters.values()) {
      totalConcepts += chapter.concepts.length;
      completedConcepts += chapter.concepts.filter(c => c.status === 'completed').length;
    }

    return {
      totalChapters: this.chapters.size,
      totalConcepts: totalConcepts,
      completedConcepts: completedConcepts,
      completionRate: (completedConcepts / totalConcepts * 100).toFixed(1) + '%'
    };
  }

  /**
   * 导出数据库为JSON
   */
  exportToJSON() {
    const data = {
      chapters: [],
      metadata: {
        version: '3.0',
        lastUpdated: new Date().toISOString(),
        statistics: this.getStatistics()
      }
    };

    for (const [num, chapter] of this.chapters) {
      data.chapters.push({
        number: num,
        name: chapter.name,
        concepts: chapter.concepts
      });
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * 从JSON导入数据库
   */
  importFromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    this.concepts.clear();
    this.chapters.clear();

    data.chapters.forEach(chapter => {
      this.addChapter(chapter.number, chapter.name, chapter.concepts);
    });
  }
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinearAlgebraVisualizationDB;
}
