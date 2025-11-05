/**
 * Bundle Manager
 * 资源打包管理器
 *
 * 负责CSS和JavaScript文件的打包、压缩和优化
 */

class BundleManager {
  constructor(options = {}) {
    this.options = {
      enableMinification: true,
      enableCompression: true,
      enableTreeShaking: true,
      chunkSizeLimit: 250 * 1024, // 250KB
      enableSourceMaps: false,
      enableCaching: true,
      ...options
    };

    this.bundles = new Map();
    this.moduleDependencies = new Map();
    this.loadedBundles = new Set();
    this.stats = {
      totalBundles: 0,
      totalSize: 0,
      compressedSize: 0,
      loadingTime: 0
    };
  }

  /**
   * 注册资源包
   */
  registerBundle(name, files, options = {}) {
    const bundle = {
      name,
      files,
      type: this.determineBundleType(files),
      loaded: false,
      loading: false,
      size: 0,
      compressedSize: 0,
      loadTime: 0,
      dependencies: options.dependencies || [],
      priority: options.priority || 'normal',
      async: options.async || false
    };

    this.bundles.set(name, bundle);
    this.stats.totalBundles++;

    console.log(`📦 注册资源包: ${name} (${bundle.type}, ${files.length} 文件)`);
  }

  /**
   * 确定包类型
   */
  determineBundleType(files) {
    const hasCSS = files.some(file => file.endsWith('.css'));
    const hasJS = files.some(file => file.endsWith('.js'));

    if (hasCSS && hasJS) return 'mixed';
    if (hasCSS) return 'css';
    if (hasJS) return 'js';
    return 'unknown';
  }

  /**
   * 添加CSS文件
   */
  addCSSFile(url) {
    if (!this.moduleDependencies.has('css')) {
      this.moduleDependencies.set('css', []);
    }
    this.moduleDependencies.get('css').push(url);
  }

  /**
   * 添加JS文件
   */
  addJSFile(url) {
    if (!this.moduleDependencies.has('js')) {
      this.moduleDependencies.set('js', []);
    }
    this.moduleDependencies.get('js').push(url);
  }

  /**
   * 创建CSS包
   */
  async createCSSBundle(files) {
    console.log('🎨 创建CSS包:', files);

    const startTime = Date.now();
    let bundleContent = '';

    try {
      // 收集CSS内容
      for (const file of files) {
        const css = await this.fetchCSSContent(file);
        if (css) {
          // 移除重复的选择器
          const optimizedCSS = this.optimizeCSS(css);
          bundleContent += optimizedCSS + '\n';
        }
      }

      // 压缩CSS
      if (this.options.enableMinification) {
        bundleContent = this.minifyCSS(bundleContent);
      }

      // 计算包大小
      const originalSize = bundleContent.length;
      const compressedSize = this.options.enableCompression ?
        this.compressContent(bundleContent) : bundleContent.length;

      // 创建Blob URL
      const blob = new Blob([bundleContent], { type: 'text/css' });
      const bundleURL = URL.createObjectURL(blob);

      const loadTime = Date.now() - startTime;

      // 更新统计
      this.stats.totalSize += originalSize;
      this.stats.compressedSize += compressedSize;
      this.stats.loadingTime += loadTime;

      console.log(`✅ CSS包创建完成: ${(compressedSize / 1024).toFixed(1)}KB (${loadTime}ms)`);

      return bundleURL;

    } catch (error) {
      console.error('❌ CSS包创建失败:', error);
      throw error;
    }
  }

  /**
   * 创建JS包
   */
  async createJSBundle(files) {
    console.log('📜 创建JS包:', files);

    const startTime = Date.now();
    let bundleContent = '';

    try {
      // 添加模块包装器
      bundleContent += '(function() {\n';
      bundleContent += '"use strict";\n\n';

      // 收集JS内容
      for (const file of files) {
        const js = await this.fetchJSContent(file);
        if (js) {
          // 优化JavaScript
          const optimizedJS = this.optimizeJS(js);
          bundleContent += `// File: ${file}\n`;
          bundleContent += optimizedJS + '\n\n';
        }
      }

      // 闭包结束
      bundleContent += '})();\n';

      // 压缩JS
      if (this.options.enableMinification) {
        bundleContent = this.minifyJS(bundleContent);
      }

      // 计算包大小
      const originalSize = bundleContent.length;
      const compressedSize = this.options.enableCompression ?
        this.compressContent(bundleContent) : bundleContent.length;

      // 创建Blob URL
      const blob = new Blob([bundleContent], { type: 'application/javascript' });
      const bundleURL = URL.createObjectURL(blob);

      const loadTime = Date.now() - startTime;

      // 更新统计
      this.stats.totalSize += originalSize;
      this.stats.compressedSize += compressedSize;
      this.stats.loadingTime += loadTime;

      console.log(`✅ JS包创建完成: ${(compressedSize / 1024).toFixed(1)}KB (${loadTime}ms)`);

      return bundleURL;

    } catch (error) {
      console.error('❌ JS包创建失败:', error);
      throw error;
    }
  }

  /**
   * 获取CSS内容
   */
  async fetchCSSContent(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`无法加载CSS文件: ${url}`, error);
    }
    return '';
  }

  /**
   * 获取JS内容
   */
  async fetchJSContent(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`无法加载JS文件: ${url}`, error);
    }
    return '';
  }

  /**
   * 优化CSS
   */
  optimizeCSS(css) {
    // 移除重复规则
    const rules = this.extractCSSRules(css);
    const uniqueRules = this.deduplicateCSSRules(rules);

    // 重新构建CSS
    return this.rebuildCSS(uniqueRules);
  }

  /**
   * 提取CSS规则
   */
  extractCSSRules(css) {
    const rules = [];
    const regex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(css)) !== null) {
      rules.push({
        selector: match[1].trim(),
        properties: match[2].trim()
      });
    }

    return rules;
  }

  /**
   * 去重CSS规则
   */
  deduplicateCSSRules(rules) {
    const ruleMap = new Map();

    rules.forEach(rule => {
      const key = rule.selector;
      if (ruleMap.has(key)) {
        // 合并属性
        const existing = ruleMap.get(key);
        const mergedProps = this.mergeCSSProperties(existing.properties, rule.properties);
        ruleMap.set(key, { ...rule, properties: mergedProps });
      } else {
        ruleMap.set(key, rule);
      }
    });

    return Array.from(ruleMap.values());
  }

  /**
   * 合并CSS属性
   */
  mergeCSSProperties(existing, newProps) {
    const existingProps = this.parseCSSProperties(existing);
    const newPropsParsed = this.parseCSSProperties(newProps);

    // 新属性覆盖旧属性
    const merged = { ...existingProps, ...newPropsParsed };

    // 重新构建属性字符串
    return Object.entries(merged)
      .map(([prop, value]) => `${prop}: ${value};`)
      .join(' ');
  }

  /**
   * 解析CSS属性
   */
  parseCSSProperties(propString) {
    const props = {};
    const regex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = regex.exec(propString)) !== null) {
      props[match[1].trim()] = match[2].trim();
    }

    return props;
  }

  /**
   * 重新构建CSS
   */
  rebuildCSS(rules) {
    return rules.map(rule => `${rule.selector} { ${rule.properties} }`).join('\n');
  }

  /**
   * 优化JavaScript
   */
  optimizeJS(js) {
    let optimized = js;

    // 移除console.log（生产环境）
    if (this.options.enableMinification) {
      optimized = optimized.replace(/console\.(log|warn|error)\([^)]*\);?/g, '');
    }

    // 简单的死代码消除
    if (this.options.enableTreeShaking) {
      optimized = this.removeDeadCode(optimized);
    }

    return optimized;
  }

  /**
   * 移除死代码
   */
  removeDeadCode(js) {
    // 简单的死代码消除示例
    // 实际实现需要更复杂的AST分析
    return js
      .replace(/\/\*\*[\s\S]*?\*\//g, '') // 移除JSDoc注释
      .replace(/if\s*\(false\)\s*\{[^}]*\}/g, ''); // 移除if (false) 代码块
  }

  /**
   * 压缩CSS
   */
  minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 移除最后的分号
      .replace(/\s*{\s*/g, '{') // 压缩大括号
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';') // 压缩分号
      .replace(/\s*:\s*/g, ':') // 压缩冒号
      .replace(/\s*,\s*/g, ',') // 压缩逗号
      .trim();
  }

  /**
   * 压缩JS
   */
  minifyJS(js) {
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
      .replace(/\/\/.*$/gm, '') // 移除行注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 移除最后的分号
      .replace(/\s*{\s*/g, '{') // 压缩大括号
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';') // 压缩分号
      .replace(/\s*,\s*/g, ',') // 压缩逗号
      .replace(/\s*=\s*/g, '=') // 压缩等号
      .trim();
  }

  /**
   * 压缩内容
   */
  compressContent(content) {
    // 简单的压缩模拟
    // 实际应该使用Gzip/Brotli
    return Math.floor(content.length * 0.7);
  }

  /**
   * 加载包
   */
  async loadBundle(name) {
    const bundle = this.bundles.get(name);
    if (!bundle) {
      throw new Error(`包不存在: ${name}`);
    }

    if (bundle.loaded) {
      return;
    }

    if (bundle.loading) {
      // 等待加载完成
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (bundle.loaded) {
            resolve();
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      });
    }

    bundle.loading = true;

    try {
      const startTime = Date.now();

      // 加载依赖
      for (const dep of bundle.dependencies) {
        await this.loadBundle(dep);
      }

      // 创建包URL
      const bundleURL = bundle.type === 'css' ?
        await this.createCSSBundle(bundle.files) :
        await this.createJSBundle(bundle.files);

      // 加载包
      await this.injectBundle(bundleURL, bundle.type);

      bundle.loaded = true;
      bundle.loading = false;
      bundle.loadTime = Date.now() - startTime;

      this.loadedBundles.add(name);

      console.log(`✅ 包加载完成: ${name} (${bundle.loadTime}ms)`);

    } catch (error) {
      bundle.loading = false;
      console.error(`❌ 包加载失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 注入包到页面
   */
  async injectBundle(url, type) {
    return new Promise((resolve, reject) => {
      if (type === 'css') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      } else if (type === 'js') {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      } else {
        reject(new Error(`不支持的包类型: ${type}`));
      }
    });
  }

  /**
   * 跟踪模块加载
   */
  trackModuleLoad(moduleId) {
    console.log(`📊 模块加载跟踪: ${moduleId}`);

    // 分析模块依赖
    this.analyzeModuleDependencies(moduleId);

    // 可能的动态包创建
    this.considerDynamicBundling(moduleId);
  }

  /**
   * 分析模块依赖
   */
  analyzeModuleDependencies(moduleId) {
    // 简化的依赖分析
    const commonDeps = {
      'math': ['plotly.js', 'mathjax.js'],
      'astronomy': ['three.js', 'd3.js'],
      'physics': ['matter.js', 'chart.js'],
      'chemistry': ['three.js', 'd3.js']
    };

    const deps = commonDeps[moduleId] || [];
    this.moduleDependencies.set(moduleId, deps);
  }

  /**
   * 考虑动态打包
   */
  considerDynamicBundling(moduleId) {
    const deps = this.moduleDependencies.get(moduleId);
    if (deps && deps.length > 2) {
      console.log(`💡 建议为模块 ${moduleId} 创建专用包`);
    }
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions() {
    const suggestions = [];

    // 分析包大小
    for (const [name, bundle] of this.bundles) {
      if (bundle.size > this.options.chunkSizeLimit) {
        suggestions.push({
          type: 'split-bundle',
          message: `包 ${name} 过大 (${(bundle.size / 1024).toFixed(1)}KB)，建议拆分`,
          priority: 'high'
        });
      }
    }

    // 分析重复依赖
    const depCount = new Map();
    for (const deps of this.moduleDependencies.values()) {
      deps.forEach(dep => {
        depCount.set(dep, (depCount.get(dep) || 0) + 1);
      });
    }

    for (const [dep, count] of depCount) {
      if (count > 2) {
        suggestions.push({
          type: 'vendor-bundle',
          message: `依赖 ${dep} 被多个包使用 (${count}次)，建议创建vendor包`,
          priority: 'medium'
        });
      }
    }

    // 分析加载时间
    if (this.stats.loadingTime > 1000) {
      suggestions.push({
        type: 'loading-time',
        message: `包加载时间过长 (${this.stats.loadingTime}ms)，建议启用并行加载`,
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      bundleCount: this.bundles.size,
      loadedCount: this.loadedBundles.size,
      compressionRatio: this.stats.totalSize > 0 ?
        (1 - this.stats.compressedSize / this.stats.totalSize) * 100 : 0,
      averageLoadTime: this.stats.totalBundles > 0 ?
        this.stats.loadingTime / this.stats.totalBundles : 0
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.bundles.clear();
    this.moduleDependencies.clear();
    this.loadedBundles.clear();

    // 重置统计
    this.stats = {
      totalBundles: 0,
      totalSize: 0,
      compressedSize: 0,
      loadingTime: 0
    };

    console.log('🧹 BundleManager 已清理');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BundleManager;
}

// 全局暴露
window.BundleManager = BundleManager;