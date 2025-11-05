/**
 * 概念数据管理
 * 管理所有可视化概念的信息和深度链接
 */

const CONCEPTS_DATABASE = {
  math: {
    name: '数学可视化',
    submodules: {
      'probability-stats': {
        name: '概率论与数理统计',
        icon: '📊',
        concepts: [
          {
            id: 'binomial-distribution',
            name: '二项分布',
            description: '离散型概率分布，描述n次独立试验中成功次数的概率',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#binomial',
            tags: ['概率分布', '离散分布', '伯努利试验'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'exponential-distribution',
            name: '指数分布',
            description: '连续型概率分布，常用于描述事件发生的时间间隔',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#exponential',
            tags: ['概率分布', '连续分布', '泊松过程'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'normal-distribution',
            name: '正态分布',
            description: '最重要的连续概率分布，自然界和社会科学中广泛存在',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#normal',
            tags: ['概率分布', '连续分布', '高斯分布', '中心极限定理'],
            difficulty: '基础',
            interactive: true
          },
          {
            id: 'poisson-distribution',
            name: '泊松分布',
            description: '离散型概率分布，描述单位时间内事件发生的次数',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#poisson',
            tags: ['概率分布', '离散分布', '计数过程'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'three-sigma-principle',
            name: '3σ原则',
            description: '正态分布中99.7%的数据落在均值±3个标准差范围内',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#sigma',
            tags: ['统计规则', '正态分布', '经验法则'],
            difficulty: '基础',
            interactive: true
          },
          {
            id: 'quantiles',
            name: '分位数',
            description: '将概率分布分成等概率区间的数值',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#quantile',
            tags: ['统计量', '概率分布', '中位数', '四分位数'],
            difficulty: '基础',
            interactive: true
          },
          {
            id: 'bivariate-normal',
            name: '二元正态分布',
            description: '两个正态随机变量的联合分布',
            url: '../GeneralVisualization/app/modules/probability_statistics/index.html#bivariate',
            tags: ['概率分布', '多维分布', '相关性'],
            difficulty: '高级',
            interactive: true
          }
        ]
      },
      'linear-algebra': {
        name: '线性代数',
        icon: '🔢',
        concepts: [
          {
            id: 'determinant',
            name: '行列式',
            description: '方阵的标量值，表示矩阵的缩放因子',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#determinant',
            tags: ['矩阵运算', '几何意义', '可逆性'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'matrix-multiplication',
            name: '矩阵乘法',
            description: '线性变换的复合运算',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#multiplication',
            tags: ['矩阵运算', '线性变换', '复合变换'],
            difficulty: '基础',
            interactive: true
          },
          {
            id: 'eigenvalues',
            name: '特征值与特征向量',
            description: '矩阵的重要性质，描述线性变换的主轴',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#eigenvalues',
            tags: ['矩阵理论', '线性变换', '主成分分析'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'vector-spaces',
            name: '向量空间',
            description: '向量及其线性组合构成的集合',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#vectorspace',
            tags: ['抽象代数', '线性结构', '基与维数'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'rotations',
            name: '旋转矩阵',
            description: '表示二维或三维空间中的旋转变换',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#rotation',
            tags: ['几何变换', '正交矩阵', '角度'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'orthogonal-decomposition',
            name: '正交分解',
            description: '向量在正交基上的分解',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#orthogonal',
            tags: ['向量运算', '投影', '最小二乘'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'singular-value',
            name: '奇异值分解',
            description: '矩阵的重要分解方法，广泛应用于数据分析',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#svd',
            tags: ['矩阵分解', '数据分析', '图像压缩'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'linear-equations',
            name: '线性方程组',
            description: '多个线性方程组成的方程组',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#equations',
            tags: ['方程求解', '高斯消元法', '解空间'],
            difficulty: '基础',
            interactive: true
          },
          {
            id: 'matrix-inverse',
            name: '矩阵逆',
            description: '矩阵的逆运算，用于解线性方程组',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#inverse',
            tags: ['矩阵运算', '可逆性', '方程求解'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'linear-transformations',
            name: '线性变换',
            description: '保持向量加法和标量乘法的变换',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#transform',
            tags: ['几何变换', '矩阵表示', '变换复合'],
            difficulty: '中级',
            interactive: true
          },
          {
            id: 'inner-product',
            name: '内积空间',
            description: '定义了内积运算的向量空间',
            url: '../GeneralVisualization/app/modules/linear_algebra/index.html#innerproduct',
            tags: ['向量运算', '几何度量', '正交性'],
            difficulty: '中级',
            interactive: true
          }
        ]
      },
      'differential-geometry': {
        name: '微分几何',
        icon: '🌐',
        concepts: [
          {
            id: 'geodesics',
            name: '测地线',
            description: '曲面上两点间距离最短的曲线',
            url: '../GeneralVisualization/app/modules/differential_geometry/index.html#geodesics',
            tags: ['曲面几何', '最短路径', '黎曼几何'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'gaussian-curvature',
            name: '高斯曲率',
            description: '曲面在某点处弯曲程度的内在度量',
            url: '../GeneralVisualization/app/modules/differential_geometry/index.html#gaussian',
            tags: ['曲面几何', '内在性质', '微分几何'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'parallel-transport',
            name: '平行移动',
            description: '向量沿曲面保持方向不变的移动',
            url: '../GeneralVisualization/app/modules/differential_geometry/index.html#parallel',
            tags: ['向量场', '曲面几何', '联络'],
            difficulty: '高级',
            interactive: true
          },
          {
            id: 'gauss-bonnet',
            name: '高斯-博内定理',
            description: '连接曲面拓扑和几何的重要定理',
            url: '../GeneralVisualization/app/modules/differential_geometry/index.html#gaussbonnet',
            tags: ['拓扑学', '曲面几何', '欧拉特征数'],
            difficulty: '高级',
            interactive: true
          }
        ]
      }
    }
  }
};

/**
 * 概念搜索和管理类
 */
class ConceptManager {
  constructor() {
    this.concepts = CONCEPTS_DATABASE;
    this.searchIndex = this.buildSearchIndex();
  }

  /**
   * 构建搜索索引
   */
  buildSearchIndex() {
    const index = [];

    Object.entries(this.concepts).forEach(([domain, domainData]) => {
      Object.entries(domainData.submodules).forEach(([submoduleId, submoduleData]) => {
        submoduleData.concepts.forEach(concept => {
          index.push({
            ...concept,
            domain,
            submoduleId,
            submoduleName: submoduleData.name,
            submoduleIcon: submoduleData.icon,
            domainName: domainData.name,
            searchText: [
              concept.name,
              concept.description,
              ...concept.tags,
              submoduleData.name,
              domainData.name
            ].join(' ').toLowerCase()
          });
        });
      });
    });

    return index;
  }

  /**
   * 搜索概念
   */
  search(query, options = {}) {
    const {
      domain = null,
      submodule = null,
      tags = [],
      difficulty = null,
      interactive = null
    } = options;

    let results = this.searchIndex;

    // 文本搜索
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(concept =>
        concept.searchText.includes(queryLower)
      );
    }

    // 按领域过滤
    if (domain) {
      results = results.filter(concept => concept.domain === domain);
    }

    // 按子模块过滤
    if (submodule) {
      results = results.filter(concept => concept.submoduleId === submodule);
    }

    // 按标签过滤
    if (tags.length > 0) {
      results = results.filter(concept =>
        tags.some(tag => concept.tags.includes(tag))
      );
    }

    // 按难度过滤
    if (difficulty) {
      results = results.filter(concept => concept.difficulty === difficulty);
    }

    // 按交互性过滤
    if (interactive !== null) {
      results = results.filter(concept => concept.interactive === interactive);
    }

    // 按相关性排序
    if (query) {
      const queryLower = query.toLowerCase();
      results.sort((a, b) => {
        // 优先匹配名称
        const aNameMatch = a.name.toLowerCase().includes(queryLower);
        const bNameMatch = b.name.toLowerCase().includes(queryLower);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // 其次匹配标签
        const aTagMatch = a.tags.some(tag => tag.toLowerCase().includes(queryLower));
        const bTagMatch = b.tags.some(tag => tag.toLowerCase().includes(queryLower));

        if (aTagMatch && !bTagMatch) return -1;
        if (!aTagMatch && bTagMatch) return 1;

        return 0;
      });
    }

    return results;
  }

  /**
   * 获取概念详情
   */
  getConcept(domain, submoduleId, conceptId) {
    const submodule = this.concepts[domain]?.submodules[submoduleId];
    if (!submodule) return null;

    return submodule.concepts.find(concept => concept.id === conceptId);
  }

  /**
   * 获取所有概念标签
   */
  getAllTags() {
    const tags = new Set();

    this.searchIndex.forEach(concept => {
      concept.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  }

  /**
   * 获取领域和子模块列表
   */
  getDomains() {
    return Object.entries(this.concepts).map(([domain, data]) => ({
      id: domain,
      name: data.name,
      submodules: Object.entries(data.submodules).map(([id, subdata]) => ({
        id,
        name: subdata.name,
        icon: subdata.icon,
        conceptCount: subdata.concepts.length
      }))
    }));
  }

  /**
   * 获取推荐概念
   */
  getRecommendations(conceptId, limit = 5) {
    const currentConcept = this.searchIndex.find(c => c.id === conceptId);
    if (!currentConcept) return [];

    // 基于标签和子模块推荐
    const recommendations = this.searchIndex
      .filter(concept =>
        concept.id !== conceptId && // 排除自身
        (concept.submoduleId === currentConcept.submoduleId || // 同子模块
         concept.tags.some(tag => currentConcept.tags.includes(tag))) // 共同标签
      )
      .slice(0, limit);

    return recommendations;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONCEPTS_DATABASE, ConceptManager };
}

// 全局暴露
window.CONCEPTS_DATABASE = CONCEPTS_DATABASE;
window.ConceptManager = ConceptManager;