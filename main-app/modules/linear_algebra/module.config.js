/**
 * 线性代数可视化模块配置
 * Linear Algebra Visualization Module Configuration
 *
 * 这是一个可插拔的共享模块，可以被多个项目灵活引用
 */

const LinearAlgebraModuleConfig = {
  // 模块基本信息
  meta: {
    name: 'linear-algebra-visualization',
    version: '3.0.0',
    description: '线性代数可视化模块 - 可插拔共享模块',
    author: 'AI Assistant (Claude)',
    license: 'MIT',
    repository: 'https://github.com/your-repo/linear-algebra-visualization'
  },

  // 模块路径配置（相对于模块根目录）
  paths: {
    root: './',
    pages: './pages/',
    styles: './',
    scripts: './',
    assets: './assets/',
    docs: './'
  },

  // 依赖库配置
  dependencies: {
    plotly: {
      url: 'https://cdn.plot.ly/plotly-2.27.0.min.js',
      version: '2.27.0',
      required: true
    },
    mathjax: {
      url: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
      version: '3.x',
      required: true
    },
    polyfill: {
      url: 'https://polyfill.io/v3/polyfill.min.js?features=es6',
      required: false
    }
  },

  // 样式主题配置
  theme: {
    // 默认主题
    default: {
      primaryColor: '#3747ff',
      secondaryColor: '#ff4737',
      backgroundColor: '#f8f8ff',
      cardBackground: '#ffffff',
      textColor: '#202124',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    // 可选的暗色主题
    dark: {
      primaryColor: '#5b6dff',
      secondaryColor: '#ff6b5b',
      backgroundColor: '#1a1a1a',
      cardBackground: '#2d2d2d',
      textColor: '#e8e8e8',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  },

  // 可视化页面列表
  visualizations: [
    {
      id: 'determinant-2d',
      name: '二阶行列式',
      file: 'pages/二阶行列式可视化.html',
      chapter: 1,
      section: '1.1',
      keywords: ['行列式', '二阶', '面积', '几何意义'],
      status: 'completed'
    },
    {
      id: 'determinant-3d',
      name: '三阶行列式',
      file: 'pages/三阶行列式可视化.html',
      chapter: 1,
      section: '1.1',
      keywords: ['行列式', '三阶', '体积', '几何意义'],
      status: 'completed'
    },
    {
      id: 'matrix-operations',
      name: '矩阵运算',
      file: 'pages/矩阵运算可视化.html',
      chapter: 2,
      section: '2.2',
      keywords: ['矩阵', '加法', '乘法', '转置'],
      status: 'completed'
    },
    {
      id: 'elementary-matrix',
      name: '矩阵的初等变换',
      file: 'pages/初等方阵可视化.html',
      chapter: 2,
      section: '2.5',
      keywords: ['初等变换', '初等方阵'],
      status: 'completed'
    },
    {
      id: 'gaussian-elimination',
      name: '高斯消元法',
      file: 'pages/矩阵高斯消元法可视化.html',
      chapter: 2,
      section: '2.7',
      keywords: ['高斯消元', '消元法', '线性方程组'],
      status: 'completed'
    },
    {
      id: 'matrix-rank',
      name: '矩阵的秩',
      file: 'pages/矩阵秩的可视化.html',
      chapter: 2,
      section: '2.5',
      keywords: ['秩', '矩阵秩', '线性相关'],
      status: 'completed'
    },
    {
      id: 'vector-space',
      name: '向量的线性关系',
      file: 'pages/向量空间可视化.html',
      chapter: 3,
      section: '3.2',
      keywords: ['向量', '线性组合', '基', '维数'],
      status: 'completed'
    },
    {
      id: 'vector-projection',
      name: '向量投影',
      file: 'pages/向量投影可视化.html',
      chapter: 3,
      section: '3.2',
      keywords: ['向量投影', '正交分解', '投影'],
      status: 'completed'
    },
    {
      id: 'linear-equations',
      name: '线性方程组',
      file: 'pages/线性方程组可视化.html',
      chapter: 3,
      section: '3.4, 3.5',
      keywords: ['线性方程组', '解的情况', '几何解释'],
      status: 'completed'
    },
    {
      id: 'eigenvalue',
      name: '特征值与特征向量',
      file: 'pages/特征值分解可视化.html',
      chapter: 5,
      section: '5.1',
      keywords: ['特征值', '特征向量', '对角化'],
      status: 'completed'
    },
    {
      id: 'orthogonal',
      name: '正交矩阵',
      file: 'pages/正交分解可视化.html',
      chapter: 5,
      section: '5.3',
      keywords: ['正交矩阵', 'QR分解', '正交分解'],
      status: 'completed'
    },
    {
      id: 'rotation',
      name: '旋转矩阵',
      file: 'pages/旋转矩阵可视化.html',
      chapter: 5,
      section: '5.3',
      keywords: ['旋转矩阵', '旋转变换', '正交矩阵'],
      status: 'completed'
    },
    {
      id: 'svd',
      name: '奇异值分解',
      file: 'pages/奇异值分解可视化.html',
      chapter: 5,
      section: '扩展内容',
      keywords: ['SVD', '奇异值分解', '矩阵分解'],
      status: 'completed'
    },
    {
      id: 'least-squares',
      name: '最小二乘法',
      file: 'pages/最小二乘法可视化.html',
      chapter: 5,
      section: '扩展内容',
      keywords: ['最小二乘法', '线性回归', '数据拟合'],
      status: 'completed'
    },
    {
      id: 'quadratic-form',
      name: '二次型标准化',
      file: 'pages/二次型标准化可视化.html',
      chapter: 6,
      section: '6.1, 6.2',
      keywords: ['二次型', '标准形', '正定', '负定'],
      status: 'completed'
    },
    {
      id: 'linear-transformation',
      name: '线性变换',
      file: 'pages/线性变换可视化.html',
      chapter: 7,
      section: '7.1, 7.2',
      keywords: ['线性变换', '矩阵变换', '几何变换'],
      status: 'completed'
    }
  ],

  // 模块功能配置
  features: {
    // 数据库管理系统
    database: {
      enabled: true,
      file: 'database-manager.html',
      api: 'visualization-database.js'
    },
    // 页面生成器
    pageGenerator: {
      enabled: true,
      file: 'page-generator.js',
      supportedTypes: [
        'determinant',
        'cramer',
        'inverse',
        'rank',
        'eigenvalue',
        'diagonalization',
        'orthogonal',
        'projection',
        'schmidt',
        'quadratic',
        'transformation',
        'equations',
        'vector',
        'matrix',
        'space',
        'basis'
      ]
    },
    // 动态视图
    dynamicView: {
      enabled: true,
      file: 'main.js',
      styles: 'linear-algebra-dynamic.css'
    }
  },

  // 集成配置
  integration: {
    // 作为独立应用运行
    standalone: {
      enabled: true,
      entryPoint: 'index.html',
      basePath: './'
    },
    // 作为模块嵌入其他项目
    embedded: {
      enabled: true,
      // 容器选择器
      containerSelector: '#linear-algebra-module',
      // 是否自动初始化
      autoInit: true,
      // 初始化选项
      initOptions: {
        theme: 'default',
        showNavigation: true,
        showHeader: true,
        enableDatabase: true
      }
    },
    // iframe 嵌入
    iframe: {
      enabled: true,
      // 推荐的 iframe 尺寸
      recommendedSize: {
        width: '100%',
        height: '800px',
        minWidth: '320px',
        minHeight: '600px'
      }
    }
  },

  // API 配置
  api: {
    // 模块加载器
    loader: 'linear-algebra-loader.js',
    // 公共 API
    publicAPI: 'linear-algebra-api.js',
    // 暴露的方法
    methods: [
      'init',
      'loadVisualization',
      'getVisualizationList',
      'searchConcept',
      'generatePage',
      'setTheme',
      'destroy'
    ]
  },

  // 国际化配置
  i18n: {
    defaultLanguage: 'zh-CN',
    supportedLanguages: ['zh-CN', 'en-US'],
    translations: {
      'zh-CN': {
        moduleName: '线性代数可视化',
        loading: '加载中...',
        error: '加载失败',
        noData: '暂无数据'
      },
      'en-US': {
        moduleName: 'Linear Algebra Visualization',
        loading: 'Loading...',
        error: 'Failed to load',
        noData: 'No data available'
      }
    }
  },

  // 性能配置
  performance: {
    // 懒加载
    lazyLoad: true,
    // 预加载关键资源
    preload: ['shared-styles.css', 'visualization-database.js'],
    // 缓存策略
    cache: {
      enabled: true,
      duration: 3600000 // 1小时
    }
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinearAlgebraModuleConfig;
}

// 全局暴露
if (typeof window !== 'undefined') {
  window.LinearAlgebraModuleConfig = LinearAlgebraModuleConfig;
}
