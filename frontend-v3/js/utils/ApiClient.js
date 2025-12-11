import { visualizationTemplates } from '../templates/visualization_templates.js';
import { VisualizationPrompts } from './PromptTemplates.js';
import { MockEngine } from './MockEngine.js';

/**
 * API客户端
 */
export class ApiClient {
  constructor() {
    this.mockEngine = new MockEngine();
    this.baseUrl = this.getApiUrl();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    this.timeout = 30000; // 30秒超时

    // 配置项
    this.config = {
      // 模式: 'mock' | 'gemini' | 'glm' | 'openai'
      mode: 'mock', 
      
      // API Keys (由用户输入)
      keys: {
        gemini: '',
        glm: '',
        openai: ''
      },

      // 模型配置
      models: {
        gemini: 'gemini-1.5-flash',
        glm: 'glm-4',
        openai: 'gpt-3.5-turbo'
      }
    };
    
    // 从 localStorage 读取配置
    const savedConfig = localStorage.getItem('visualization_llm_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // 合并配置，保留默认结构
      this.config = { 
        ...this.config, 
        ...parsed,
        keys: { ...this.config.keys, ...(parsed.keys || {}) },
        models: { ...this.config.models, ...(parsed.models || {}) }
      };
    }
  }

  /**
   * 获取API基础URL
   */
  getApiUrl() {
    // 连接到我们的v3 API - 使用完整URL因为后端在不同端口
    return 'http://localhost:9999/api/v3';
  }

  /**
   * 发送HTTP请求
   */
  async request(endpoint, options = {}) {
    // 确保endpoint以/开头，但避免重复的/
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    // 添加超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }

      throw error;
    }
  }

  /**
   * 发送GET请求
   */
  async get(endpoint, params = {}) {
    let url = `${this.baseUrl}${endpoint}`;

    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          searchParams.append(key, params[key]);
        }
      });
      url += '?' + searchParams.toString();
    }

    return this.request(endpoint, {
      method: 'GET'
    });
  }

  /**
   * 发送POST请求
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * 发送PUT请求
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * 发送DELETE请求
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * 上传文件
   */
  async uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (onProgress && event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload failed: Timeout'));
      });

      xhr.timeout = this.timeout;
      xhr.open('POST', `${this.baseUrl}/files/upload`, true);
      xhr.send(formData);
    });
  }

  /**
   * 匹配本地可视化模板
   */
  matchLocalTemplate(message) {
    const lower = message.toLowerCase();
    
    // 1. 线性代数 (Let MockEngine handle this for better quality)
    // if (lower.includes('行列式') || lower.includes('determinant') || lower.includes('线性代数') || lower.includes('linear algebra')) {
    //   return {
    //     title: '二阶行列式可视化',
    //     html_content: visualizationTemplates.determinant(),
    //     visualization_type: 'determinant'
    //   };
    // }
    
    // 2. 正态分布 (Let MockEngine handle this)
    // if (lower.includes('正态') || lower.includes('normal distribution') || lower.includes('高斯')) {
    //   return {
    //     title: '正态分布可视化',
    //     html_content: visualizationTemplates.normal_distribution(),
    //     visualization_type: 'normal_distribution'
    //   };
    // }

    // 3. 指数分布 (Let MockEngine handle this)
    // if (lower.includes('指数') || lower.includes('exponential')) {
    //   return {
    //     title: '指数分布可视化',
    //     html_content: visualizationTemplates.exponential_distribution(),
    //     visualization_type: 'exponential_distribution'
    //   };
    // }
    
    // 4. 太阳系
    if (lower.includes('太阳系') || lower.includes('solar system') || lower.includes('行星') || lower.includes('planet')) {
      return {
        title: '太阳系模拟',
        html_content: visualizationTemplates.solar_system(),
        visualization_type: 'solar_system'
      };
    }
    
    // 5. 抛体运动
    if (lower.includes('抛体') || lower.includes('projectile') || lower.includes('弹道')) {
      return {
        title: '抛体运动模拟',
        html_content: visualizationTemplates.projectile(),
        visualization_type: 'projectile'
      };
    }
    
    // 6. 简谐振动
    if (lower.includes('简谐') || lower.includes('harmonic') || lower.includes('振动') || lower.includes('oscillation')) {
      return {
        title: '简谐振动模拟',
        html_content: visualizationTemplates.harmonic_motion(),
        visualization_type: 'harmonic'
      };
    }

    // 7. 柱状图 (Let MockEngine handle this)
    // if (lower.includes('柱状') || lower.includes('bar chart') || lower.includes('histogram') || lower.includes('统计')) {
    //   return {
    //     title: '统计柱状图',
    //     html_content: visualizationTemplates.bar_chart(),
    //     visualization_type: 'bar_chart'
    //   };
    // }

    // 8. 饼图 (Let MockEngine handle this)
    // if (lower.includes('饼') || lower.includes('pie') || lower.includes('占比') || lower.includes('比例')) {
    //   return {
    //     title: '数据占比饼图',
    //     html_content: visualizationTemplates.pie_chart(),
    //     visualization_type: 'pie_chart'
    //   };
    // }

    // 9. 混沌/Logistic (Let MockEngine handle this)
    // if (lower.includes('混沌') || lower.includes('chaos') || lower.includes('logistic') || lower.includes('分岔') || lower.includes('bifurcation')) {
    //   return {
    //     title: 'Logistic 映射 (混沌理论)',
    //     html_content: visualizationTemplates.logistic_map(),
    //     visualization_type: 'logistic_map'
    //   };
    // }

    return null;
  }

  /**
   * 发送消息到AI
   */
  async sendMessage({ message, conversationId = null, options = {} }) {
    console.log('ApiClient: sendMessage called with:', message);
    
    // 1. 检查本地模板 (优先匹配)
    const localViz = this.matchLocalTemplate(message);

    if (localViz) {
       // 模拟网络延迟
       await new Promise(resolve => setTimeout(resolve, 800)); 
       
       return {
         content: {
           type: 'visualization',
           title: localViz.title,
           html: localViz.html_content,
           visualization_type: localViz.visualization_type,
           config: localViz.config || {}
         },
         metadata: {
           has_visualization: true,
           source: 'local_template'
         }
       };
    }

    // 2. 动态生成逻辑 (LLM / Mock)
    console.log('ApiClient: No local template matched. Checking LLM configuration...');
    
    const mode = this.config.mode;
    const provider = mode.includes(':') ? mode.split(':')[0] : mode;
    const hasKey = this.config.keys[provider];
    
    if (provider !== 'mock' && hasKey) {
      console.log(`ApiClient: Using ${provider} for dynamic generation`);
      if (provider === 'gemini') {
        return await this.callGemini(message);
      } else if (provider === 'glm') {
        return await this.callGLM(message);
      } else {
        return await this.callRealLLM(message);
      }
    }
    
    // 3. 默认 Mock 生成
    return await this.mockDynamicGeneration(message);
  }

  /**
   * 根据用户输入决定系统提示词 (路由逻辑)
   */
  getSystemPrompt(userPrompt) {
    const lower = userPrompt.toLowerCase();
    
    // 物理/运动学
    if (lower.includes('运动') || lower.includes('力') || lower.includes('physics') || lower.includes('motion') || lower.includes('抛体') || lower.includes('碰撞')) {
      return VisualizationPrompts.PHYSICS_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }
    
    // 天文/宇宙
    if (lower.includes('星') || lower.includes('轨道') || lower.includes('orbit') || lower.includes('planet') || lower.includes('solar')) {
      return VisualizationPrompts.ASTRONOMY_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }

    // 数学/函数
    if (lower.includes('函数') || lower.includes('方程') || lower.includes('math') || lower.includes('function') || lower.includes('plot') || lower.includes('graph')) {
      return VisualizationPrompts.MATH_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }

    // 化学
    if (lower.includes('化学') || lower.includes('分子') || lower.includes('chemistry') || lower.includes('molecule') || lower.includes('reaction') || lower.includes('atom')) {
      return VisualizationPrompts.CHEMISTRY_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }

    // 生物
    if (lower.includes('生物') || lower.includes('细胞') || lower.includes('dna') || lower.includes('biology') || lower.includes('cell') || lower.includes('protein')) {
      return VisualizationPrompts.BIOLOGY_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }

    // 经济/统计
    if (lower.includes('经济') || lower.includes('供需') || lower.includes('股票') || lower.includes('economics') || lower.includes('finance') || lower.includes('gdp')) {
      return VisualizationPrompts.ECONOMICS_VISUALIZATION + '\n\n' + VisualizationPrompts.GENERAL_VISUALIZATION;
    }

    // 默认
    return VisualizationPrompts.GENERAL_VISUALIZATION;
  }

  /**
   * 调用 Gemini API
   */
  async callGemini(userPrompt) {
    console.log('ApiClient: Calling Gemini API...');
    const API_KEY = this.config.keys.gemini;
    const MODEL = this.config.models.gemini || 'gemini-pro';
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    const systemPrompt = this.getSystemPrompt(userPrompt);

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser Request: ${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096 // 增加 token 数以支持完整代码
          }
        })
      });

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
      
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // 增强的 HTML 提取逻辑
      let htmlContent = rawText;
      const htmlMatch = rawText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || rawText.match(/<html[\s\S]*<\/html>/i);
      
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      } else {
        // Fallback: 清理 Markdown 标记
        htmlContent = rawText.replace(/```html/g, '').replace(/```/g, '').trim();
      }

      return {
        content: {
          type: 'visualization',
          title: 'Gemini 可视化',
          html: htmlContent,
          visualization_type: 'gemini_generated'
        },
        metadata: {
          has_visualization: true,
          source: 'gemini'
        }
      };
    } catch (e) {
      console.error('Gemini Call Failed:', e);
      return await this.mockDynamicGeneration(userPrompt);
    }
  }

  /**
   * 调用 GLM-4 API (智谱AI)
   */
  async callGLM(userPrompt) {
    console.log('ApiClient: Calling GLM-4 API...');
    const API_KEY = this.config.keys.glm;
    const URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    const systemPrompt = this.getSystemPrompt(userPrompt);

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'glm-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error(`GLM API Error: ${response.status}`);

      const data = await response.json();
      const rawText = data.choices[0].message.content;
      
      // 增强的 HTML 提取逻辑
      let htmlContent = rawText;
      const htmlMatch = rawText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || rawText.match(/<html[\s\S]*<\/html>/i);
      
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      } else {
        htmlContent = rawText.replace(/```html/g, '').replace(/```/g, '').trim();
      }

      return {
        content: {
          type: 'visualization',
          title: 'GLM-4 可视化',
          html: htmlContent,
          visualization_type: 'glm_generated'
        },
        metadata: {
          has_visualization: true,
          source: 'glm'
        }
      };
    } catch (e) {
      console.error('GLM Call Failed:', e);
      return await this.mockDynamicGeneration(userPrompt);
    }
  }

  /**
   * 通用 OpenAI 兼容调用
   */
  async callRealLLM(userPrompt) {
    const config = this.config;
    const systemPrompt = this.getSystemPrompt(userPrompt);

    // 1. 尝试 Gemini
    if (config.mode === 'gemini') {
      return this.callGemini(userPrompt);
    }
    
    // 2. 尝试 GLM
    if (config.mode === 'glm') {
      return this.callGLM(userPrompt);
    }

    // 3. OpenAI / 其他
    console.log('ApiClient: Calling OpenAI Compatible API...');
    const API_KEY = config.keys.openai;
    const URL = 'https://api.openai.com/v1/chat/completions'; // 需根据实际情况配置

    try {
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.choices[0].message.content;
      
      // 增强的 HTML 提取逻辑
      let htmlContent = rawText;
      const htmlMatch = rawText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) || rawText.match(/<html[\s\S]*<\/html>/i);
      
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      } else {
        htmlContent = rawText.replace(/```html/g, '').replace(/```/g, '').trim();
      }

      return {
        content: {
          type: 'visualization',
          title: 'AI 生成可视化',
          html: htmlContent,
          visualization_type: 'llm_generated'
        },
        metadata: {
          has_visualization: true,
          source: 'llm'
        }
      };

    } catch (error) {
      console.error('LLM Call Failed:', error);
      // 失败时降级到 Mock
      return await this.mockDynamicGeneration(userPrompt);
    }
  }

  /**
   * 模拟动态生成 (Mock LLM)
   * 实际上这里应该调用后端 API，将 Prompt 发送给大模型
   */
  async mockDynamicGeneration(userPrompt) {
    console.log('ApiClient: Mocking LLM generation for:', userPrompt);
    
    // 模拟思考时间 (1.5秒)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 使用 MockEngine 生成结果
    const mockResult = this.mockEngine.generate(userPrompt);

    return {
      content: {
        type: 'visualization',
        title: mockResult.title,
        html: mockResult.html,
        visualization_type: 'dynamic_generated'
      },
      metadata: {
        has_visualization: true,
        source: 'mock'
      }
    };
  }

  /**
   * 流式发送消息
   */
  async sendMessageStream({ message, conversationHistory = [], options = {} }, onChunk) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        model: options.model || 'gpt-3.5-turbo',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (error) {
              console.warn('Failed to parse SSE chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 生成可视化
   */
  async generateVisualization({ prompt, type = 'auto', options = {} }) {
    return this.post('/visualize/generate', {
      prompt,
      type,
      options: {
        width: options.width || 800,
        height: options.height || 600,
        format: options.format || 'html',
        interactive: options.interactive !== false,
        ...options
      }
    });
  }

  /**
   * 获取对话列表
   */
  async getConversations(params = {}) {
    return this.get('/chat/conversations', {
      page: params.page || 1,
      page_size: params.pageSize || 20
    });
  }

  /**
   * 创建新对话
   */
  async createConversation(title = '新对话') {
    return this.post('/chat/conversations', {
      title,
      settings: {}
    });
  }

  /**
   * 更新对话
   */
  async updateConversation(id, updates) {
    return this.put(`/chat/conversations/${id}`, updates);
  }

  /**
   * 删除对话
   */
  async deleteConversation(id) {
    return this.delete(`/chat/conversations/${id}`);
  }

  /**
   * 获取对话详情
   */
  async getConversation(id) {
    return this.get(`/chat/conversations/${id}`);
  }

  /**
   * 获取用户设置
   */
  async getUserSettings() {
    return this.get('/user/me');
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(settings) {
    return this.put('/user/settings', settings);
  }

  /**
   * 获取使用统计
   */
  async getUserStats() {
    return this.get('/user/stats');
  }

  /**
   * 上传头像
   */
  async uploadAvatar(file) {
    return this.uploadFile(file, (progress) => {
      console.log(`Avatar upload progress: ${progress.toFixed(1)}%`);
    });
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(apiKey) {
    return this.post('/user/validate-key', { api_key: apiKey });
  }

  /**
   * 获取可用模型
   */
  async getAvailableModels() {
    return this.get('/models');
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus() {
    return this.get('/status');
  }

  /**
   * 重试请求
   */
  async retryRequest(requestFn, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // 指数退避重试
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken() {
    delete this.defaultHeaders.Authorization;
  }
}
