/**
 * 设置弹窗组件
 * 用于配置 API Key 和模型选择
 */
export class SettingsModal {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.modal = null;
    this.init();
  }

  init() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.style.display = 'none'; // 默认隐藏
    
    // 从 ApiClient 获取当前配置
    const config = this.apiClient.config;
    
    // 构造当前选中的组合值
    const currentMode = config.mode;
    const currentModel = config.models[currentMode] || '';
    const selectedValue = currentMode === 'mock' ? 'mock:mock' : `${currentMode}:${currentModel}`;

    this.modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>🤖 AI 模型设置</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label style="display:block; margin-bottom:8px; font-weight:bold;">选择模型</label>
            <select id="unifiedModelSelect" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd; margin-bottom:15px; font-size:14px;">
              <optgroup label="✨ 本地演示">
                <option value="mock:mock" ${currentMode === 'mock' ? 'selected' : ''}>🎨 Mock (本地模拟 - 免费)</option>
              </optgroup>
              
              <optgroup label="🌟 Google Gemini">
                <option value="gemini:gemini-1.5-flash" ${selectedValue === 'gemini:gemini-1.5-flash' ? 'selected' : ''}>⚡ Gemini 1.5 Flash (免费/快速/推荐)</option>
                <option value="gemini:gemini-pro" ${selectedValue === 'gemini:gemini-pro' ? 'selected' : ''}>🤖 Gemini 1.0 Pro (免费/经典)</option>
                <option value="gemini:gemini-1.5-pro" ${selectedValue === 'gemini:gemini-1.5-pro' ? 'selected' : ''}>🧠 Gemini 1.5 Pro (更强/可能有配额限制)</option>
              </optgroup>

              <optgroup label="🟣 智谱 GLM">
                <option value="glm:glm-4" ${selectedValue === 'glm:glm-4' ? 'selected' : ''}>🟣 GLM-4</option>
                <option value="glm:glm-4-air" ${selectedValue === 'glm:glm-4-air' ? 'selected' : ''}>🟣 GLM-4 Air</option>
                <option value="glm:glm-3-turbo" ${selectedValue === 'glm:glm-3-turbo' ? 'selected' : ''}>🟣 GLM-3 Turbo</option>
              </optgroup>

              <optgroup label="🟢 OpenAI / 兼容">
                <option value="openai:gpt-3.5-turbo" ${selectedValue === 'openai:gpt-3.5-turbo' ? 'selected' : ''}>🟢 GPT-3.5 Turbo</option>
                <option value="openai:gpt-4" ${selectedValue === 'openai:gpt-4' ? 'selected' : ''}>🟢 GPT-4</option>
                <option value="openai:gpt-4o" ${selectedValue === 'openai:gpt-4o' ? 'selected' : ''}>🟢 GPT-4o</option>
              </optgroup>
            </select>
          </div>

          <!-- Gemini 设置 -->
          <div id="gemini-settings" class="api-settings" style="display:none;">
            <!-- 模型选择已移至上方统一列表 -->
            <div class="form-group">
              <label>Gemini API Key</label>
              <input type="password" id="geminiKey" placeholder="AIzaSy..." value="${config.keys.gemini || ''}" style="width:100%; padding:8px; margin-top:5px;">
              <div style="font-size:0.8em; color:#666; margin-top:5px;">Google AI Studio 申请的 Key</div>
            </div>
            
            <!-- 批量检测工具 -->
            <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
              <button id="toggleKeyChecker" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:0.9em; padding:0;">
                🛠️ 批量检测 Key 有效性 (v2.1 增强版)
              </button>
              <div id="keyCheckerArea" style="display:none; margin-top:10px;">
                <textarea id="batchKeysInput" placeholder="在此粘贴多个 Key，每行一个" style="width:100%; height:100px; padding:8px; border:1px solid #ddd; border-radius:6px; font-family:monospace; font-size:12px;"></textarea>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                  <div>
                    <button id="startCheckBtn" style="padding:4px 12px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.9em;">开始检测</button>
                    <button id="testConnectBtn" style="padding:4px 12px; margin-left:5px; background:#6366f1; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.9em;" title="测试能否连接到 Google API 服务器">📡 测试连通性</button>
                  </div>
                  <span id="checkStatus" style="font-size:0.85em; color:#666;"></span>
                </div>
                
                <!-- 代理设置 (可选) -->
                <div style="margin-top:8px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
                  <input type="checkbox" id="useProxy" style="cursor:pointer;">
                  <label for="useProxy" style="font-size:12px; cursor:pointer;">使用自定义代理地址</label>
                  <input type="text" id="proxyUrl" placeholder="例如: https://my-proxy.com (无需 /v1beta)" value="https://generativelanguage.googleapis.com" style="flex:1; font-size:12px; padding:4px; border:1px solid #ddd; border-radius:4px; display:none; min-width: 200px;">
                </div>
                <div style="font-size:10px; color:#999; margin-left:20px; margin-top:2px;">
                   提示: 如果使用 OpenAI 兼容代理，通常不支持 Gemini 格式。请确保代理支持 Google Gemini 协议。
                </div>

                <div id="checkResults" style="margin-top:10px; max-height:150px; overflow-y:auto; border:1px solid #eee; border-radius:4px; padding:5px; background:#f9f9f9; font-size:12px;"></div>
              </div>
            </div>
          </div>

          <!-- GLM 设置 -->
          <div id="glm-settings" class="api-settings" style="display:none;">
            <div class="form-group">
              <label>智谱 GLM API Key</label>
              <input type="password" id="glmKey" placeholder="例如: 852...def.abc" value="${config.keys.glm || ''}" style="width:100%; padding:8px; margin-top:5px;">
            </div>
          </div>

          <!-- OpenAI 设置 -->
          <div id="openai-settings" class="api-settings" style="display:none;">
            <div class="form-group">
              <label>API Base URL</label>
              <input type="text" id="apiBaseUrl" value="${config.apiBaseUrl || 'https://api.deepseek.com/v1'}" style="width:100%; padding:8px; margin-top:5px;">
            </div>
            <div class="form-group" style="margin-top:10px;">
              <label>API Key</label>
              <input type="password" id="openaiKey" value="${config.keys.openai || ''}" style="width:100%; padding:8px; margin-top:5px;">
            </div>
          </div>

        </div>
        <div class="modal-footer" style="text-align:right; margin-top:20px;">
          <button id="cancelSettings" style="padding:8px 16px; margin-right:10px; background:transparent; border:1px solid #ccc; border-radius:4px; cursor:pointer;">取消</button>
          <button id="saveSettings" style="padding:8px 16px; background:var(--primary-color); color:white; border:none; border-radius:4px; cursor:pointer;">保存配置</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.updateVisibleSettings(config.mode);
  }

  bindEvents() {
    // 监听打开事件
    window.addEventListener('open-settings-modal', () => {
      this.modal.style.display = 'flex';
      // 重新从内存读取最新值填充 (防止不同步)
      const config = this.apiClient.config;
      
      const currentMode = config.mode;
      const currentModel = config.models[currentMode] || '';
      const selectedValue = currentMode === 'mock' ? 'mock:mock' : `${currentMode}:${currentModel}`;
      
      const selectEl = document.getElementById('unifiedModelSelect');
      if (selectEl) {
         // 尝试选中当前值，如果列表里没有（可能是旧配置），则尝试仅匹配 provider 或默认第一个
         if (selectEl.querySelector(`option[value="${selectedValue}"]`)) {
            selectEl.value = selectedValue;
         } else {
            // Fallback: 比如 config 里存的是 gemini-pro-1.0 但列表里只有 gemini-pro
            // 简单处理：如果 mode 是 gemini，就选 gemini 的第一个
            const firstOption = selectEl.querySelector(`option[value^="${currentMode}:"]`);
            if (firstOption) selectEl.value = firstOption.value;
         }
      }

      document.getElementById('geminiKey').value = config.keys.gemini || '';
      document.getElementById('glmKey').value = config.keys.glm || '';
      
      this.updateVisibleSettings(currentMode);
    });

    // 关闭按钮
    this.modal.querySelector('.close-btn').addEventListener('click', () => {
      this.modal.style.display = 'none';
    });

    this.modal.querySelector('#cancelSettings').addEventListener('click', () => {
      this.modal.style.display = 'none';
    });

    // 模式切换联动
    const modeSelect = document.getElementById('unifiedModelSelect');
    modeSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      const [provider, model] = value.split(':');
      this.updateVisibleSettings(provider);
    });

    // 保存设置
    this.modal.querySelector('#saveSettings').addEventListener('click', () => {
      this.saveConfig();
    });

    // 绑定批量检测工具事件
    const toggleBtn = this.modal.querySelector('#toggleKeyChecker');
    const checkerArea = this.modal.querySelector('#keyCheckerArea');
    const startCheckBtn = this.modal.querySelector('#startCheckBtn');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = checkerArea.style.display === 'none';
        checkerArea.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '🔼 收起检测工具' : '🛠️ 批量检测 Key 有效性';
        
        // 预填充（如果为空）
        const input = this.modal.querySelector('#batchKeysInput');
        if (input && !input.value.trim()) {
          input.value = `AIzaSyAU3B5coLYWQnlCjOwZg0JQQj7K5sw8q80
AIzaSyA6_9MBfmKHGbH7OI0GV5FiV0N8Mh8o1GY
AIzaSyA2oPOk-nJMJDlc0jVvOTN1fhzW45pzt9w
AIzaSyBxCbCpjnEGyIeAIV2eBjeyCGhGerPC1Ro
AIzaSyD5AegzQTwS8A2o_jbyw3m5yGxvIlRGjj8
AIzaSyDe3zpjNwyMyXPIdnCcLYJ8HrgWc_sdu-I
AIzaSyB3blgFw-aq2QJrE2RzBjR-msa9SmhP_TM
AIzaSyABd-tykN_UhDqygrCKW5ReyMXM2k6SjOg
AIzaSyAROtWYKYVIUTQ--KCM-zQCofLWYTNttZU
AIzaSyDKYPcocYVQp_0SUeG0BKH7E4AwKMeWTKI
AIzaSyDQumq0V2TqAdTTXj9TSy0uHtiwgrfRDY4
AIzaSyBlqJyj878Hp7z9POhG2wIGKMw9KMMyaZc
AIzaSyCZISN0EG9glYADK0_y5Flyr3kRjDKLKbw
AIzaSyA_4uZD0uR1VxpyyM8QP7OFdhxnMkzCoAI
AIzaSyBIKSIfQpyey3VARICCFmBZoYgqseh0jzo
AIzaSyBC0CKcEAjRAEiAXSOlJNOufzdTaKw_RXk
AIzaSyCK7n8soqlCL0V9-G94_7jpY_BD86GoWcg`;
        }
      });
    }

    if (startCheckBtn) {
      startCheckBtn.addEventListener('click', () => this.runBatchCheck());
    }
    
    // 连通性测试按钮
    const testConnectBtn = this.modal.querySelector('#testConnectBtn');
    if (testConnectBtn) {
       testConnectBtn.addEventListener('click', async () => {
          const status = document.getElementById('checkStatus');
          const results = document.getElementById('checkResults');
          status.textContent = '正在测试网络连通性...';
          results.innerHTML = '';
          
          let baseUrl = 'https://generativelanguage.googleapis.com';
          if (document.getElementById('useProxy').checked) {
             baseUrl = document.getElementById('proxyUrl').value.replace(/\/$/, '');
          }
          
          // 尝试清理 baseUrl 以便测试 discovery 文档
          let cleanBase = baseUrl;
          if (cleanBase.includes('/v1beta')) cleanBase = cleanBase.split('/v1beta')[0];
          
          const testUrl = `${cleanBase}/$discovery/rest?version=v1beta`;
          
          const div = document.createElement('div');
          div.innerHTML = `📡 Testing connection to: <code>${cleanBase}</code>...`;
          results.appendChild(div);
          
          try {
             const start = Date.now();
             const res = await fetch(testUrl);
             const duration = Date.now() - start;
             
             if (res.ok) {
                div.innerHTML += `<br>✅ <span style="color:#10b981">连接成功!</span> (HTTP ${res.status}, ${duration}ms)`;
                div.innerHTML += `<br><span style="color:#666;font-size:10px;">网络通路正常，如果 Key 检测失败，请检查 Key 本身是否欠费或受限。</span>`;
                status.textContent = '网络连通性测试通过';
             } else {
                div.innerHTML += `<br>❌ <span style="color:#ef4444">连接失败</span> (HTTP ${res.status})`;
                if (res.status === 404) {
                   div.innerHTML += `<br><span style="color:#f59e0b;font-size:10px;">提示: 404 表示服务器可达但路径不对。如果使用代理，请确认该代理支持 Google API 原生协议。</span>`;
                }
                status.textContent = '网络连通性测试失败';
             }
          } catch (e) {
             div.innerHTML += `<br>❌ <span style="color:#ef4444">网络错误</span> (${e.message})`;
             div.innerHTML += `<br><span style="color:#f59e0b;font-size:10px;">提示: 无法连接到服务器。请检查 VPN/代理设置。</span>`;
             status.textContent = '网络无法连接';
          }
       });
    }

    // 代理输入框联动
    const proxyCheck = this.modal.querySelector('#useProxy');
    const proxyInput = this.modal.querySelector('#proxyUrl');
    if (proxyCheck && proxyInput) {
      proxyCheck.addEventListener('change', (e) => {
        proxyInput.style.display = e.target.checked ? 'block' : 'none';
        // 自动填充 OpenAI 的 BaseUrl 如果有的话
        if (e.target.checked && !proxyInput.value.includes('your-proxy')) {
             const existingBase = document.getElementById('apiBaseUrl').value.trim();
             if (existingBase && !existingBase.includes('api.deepseek.com')) {
                 // 简单的启发式填充，可能不完全准确
                 proxyInput.value = existingBase; 
             }
        }
      });
    }
  }

  async runBatchCheck() {
    const input = document.getElementById('batchKeysInput');
    const status = document.getElementById('checkStatus');
    const results = document.getElementById('checkResults');
    const useProxy = document.getElementById('useProxy').checked;
    let baseUrl = 'https://generativelanguage.googleapis.com';
    
    if (useProxy) {
        baseUrl = document.getElementById('proxyUrl').value.replace(/\/$/, ''); // 去除末尾斜杠
    }
    
    if (!input || !input.value.trim()) {
      alert('请输入要检测的 Key');
      return;
    }

    const keys = [...new Set(input.value.split(/[\n,]+/).map(k => k.trim()).filter(k => k.startsWith('AIzaSy')))];
    
    if (keys.length === 0) {
      alert('未找到有效的 Key 格式 (应以 AIzaSy 开头)');
      return;
    }

    status.textContent = `准备检测 ${keys.length} 个 Key...`;
    results.innerHTML = '';
    
    let validCount = 0;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const div = document.createElement('div');
      div.style.marginBottom = '4px';
      div.style.fontFamily = 'monospace';
      div.textContent = `⏳ Checking ${key.substring(0, 10)}...`;
      results.appendChild(div);
      results.scrollTop = results.scrollHeight;

      status.textContent = `正在检测 (${i + 1}/${keys.length})...`;

      try {
        const result = await this.checkGeminiKey(key, baseUrl);
        if (result.ok) {
          div.innerHTML = `✅ <span style="color:#10b981; font-weight:bold;">有效</span> ${key} <button class="use-key-btn" data-key="${key}" style="margin-left:5px; font-size:10px; cursor:pointer;">使用此Key</button>`;
          
          // 绑定使用按钮
          div.querySelector('.use-key-btn').addEventListener('click', () => {
            document.getElementById('geminiKey').value = key;
            alert('已填充到 API Key 输入框，请记得点击“保存配置”');
          });
          
          validCount++;
        } else {
          // 显示具体的错误原因
          let errorMsg = `HTTP ${result.status}`;
          if (result.status === 0) errorMsg = "网络/跨域错误 (请检查代理/网络)";
          if (result.status === 403) errorMsg = "Key 无效 (403)";
          if (result.status === 404) errorMsg = "API 地址/模型错误 (404)";
          if (result.status === 400) errorMsg = "请求格式错误 (400)";
          
          if (result.error) {
              // 截断过长的错误信息
              const shortError = result.error.length > 50 ? result.error.substring(0, 50) + '...' : result.error;
              errorMsg += ` [${shortError}]`;
          }

          div.innerHTML = `❌ <span style="color:#ef4444;">无效</span> ${key} <span style="color:#888;font-size:10px;">(${errorMsg})</span>
          <div style="font-size:9px; color:#aaa; margin-top:2px; word-break:break-all;">URL: ${result.url}</div>`;
          div.style.opacity = '0.9';
        }
      } catch (err) {
        div.innerHTML = `⚠️ <span style="color:#f59e0b;">错误</span> ${key} (${err.message})`;
      }
      
      // 稍微延迟避免速率限制
      await new Promise(r => setTimeout(r, 200));
    }

    status.textContent = `检测完成: ${validCount} 个有效 / ${keys.length} 总数`;
  }

  async checkGeminiKey(key, baseUrl) {
    // 智能清理 baseUrl
    let cleanBaseUrl = baseUrl.replace(/\/$/, '');
    if (cleanBaseUrl.includes('/v1beta')) cleanBaseUrl = cleanBaseUrl.split('/v1beta')[0];
    if (cleanBaseUrl.includes('/models')) cleanBaseUrl = cleanBaseUrl.split('/models')[0];

    // 策略1: 优先尝试列出模型 (GET /v1beta/models)
    // 这是最准确的验证方式，因为如果 Key 有效，它一定会返回模型列表
    try {
      const listUrl = `${cleanBaseUrl}/v1beta/models?key=${key}&pageSize=50`;
      const listRes = await fetch(listUrl);
      
      if (listRes.ok) {
        const data = await listRes.json();
        if (data.models && Array.isArray(data.models)) {
          // Key 有效！现在查找最佳模型
          const modelNames = data.models.map(m => m.name.replace('models/', ''));
          
          // 优先匹配 Flash
          let bestModel = 'gemini-1.5-flash';
          if (modelNames.includes('gemini-1.5-flash')) bestModel = 'gemini-1.5-flash';
          else if (modelNames.includes('gemini-1.5-pro')) bestModel = 'gemini-1.5-pro';
          else if (modelNames.includes('gemini-pro')) bestModel = 'gemini-pro';
          else if (modelNames.length > 0) bestModel = modelNames[0]; // 随便拿一个
          
          return { ok: true, status: 200, model: bestModel, details: `Found ${modelNames.length} models` };
        }
      } else if (listRes.status === 403) {
         // Key 无效或无权限
         const data = await listRes.json().catch(() => ({}));
         return { ok: false, status: 403, error: data.error?.message || 'Key permission denied (List Models failed)', url: listUrl };
      }
      // 如果是 404 或其他错误，继续尝试 generateContent 方法作为兜底
    } catch (e) {
      console.warn('List models check failed, falling back to generateContent:', e);
    }

    // 策略2: 兜底尝试 generateContent (针对某些不支持 List Models 的代理或特殊情况)
    // 定义要尝试的模型列表 (按优先级)
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-pro', 'gemini-1.0-pro'];
    
    let lastError = null;
    let lastStatus = 0;
    let lastUrl = '';

    for (const model of modelsToTry) {
      try {
        const url = `${cleanBaseUrl}/v1beta/models/${model}:generateContent?key=${key}`;
        lastUrl = url;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hi" }] }]
          })
        });

        if (response.ok) {
          return { ok: true, status: 200, model: model };
        }

        lastStatus = response.status;
        
        // 尝试获取错误详情 (JSON 或 Text)
        let errorDetail = '';
        try {
          const text = await response.text();
          try {
             const data = JSON.parse(text);
             if (data.error && data.error.message) {
               errorDetail = data.error.message;
             } else {
               errorDetail = text.substring(0, 100); // 非标准 JSON 错误
             }
          } catch {
             errorDetail = text.substring(0, 100); // 纯文本错误 (如 HTML 404 页面)
          }
        } catch(e) {}
        
        // 如果是 404，可能是模型不存在，继续尝试下一个
        if (response.status === 404) {
           lastError = errorDetail; // 记录下 404 的具体内容
           continue;
        }
        
        // 如果是 403 (无效 Key) 或其他错误，直接返回
        return { ok: false, status: response.status, error: errorDetail, url: url };

      } catch (e) {
        console.warn(`Model ${model} check failed:`, e);
        lastError = e.message;
        // 网络错误 (status 0)
        return { ok: false, status: 0, error: e.message, url: lastUrl };
      }
    }

    // 所有模型都失败了
    return { ok: false, status: lastStatus, error: lastError, url: lastUrl };
  }

  updateVisibleSettings(mode) {
    // 隐藏所有特定设置
    document.querySelectorAll('.api-settings').forEach(el => el.style.display = 'none');
    
    // 显示当前模式的设置
    if (mode === 'gemini') {
      document.getElementById('gemini-settings').style.display = 'block';
    } else if (mode === 'glm') {
      document.getElementById('glm-settings').style.display = 'block';
    } else if (mode === 'openai') {
      document.getElementById('openai-settings').style.display = 'block';
    }
  }

  saveConfig() {
    const unifiedValue = document.getElementById('unifiedModelSelect').value;
    const [mode, model] = unifiedValue.split(':');

    // 更新对应模式的模型选择
    const updatedModels = { ...this.apiClient.config.models };
    if (mode !== 'mock') {
        updatedModels[mode] = model;
    }

    const newConfig = {
      mode: mode,
      keys: {
        gemini: document.getElementById('geminiKey').value.trim(),
        glm: document.getElementById('glmKey').value.trim(),
        openai: document.getElementById('openaiKey').value.trim()
      },
      models: updatedModels,
      apiBaseUrl: document.getElementById('apiBaseUrl').value.trim()
    };

    // 更新 ApiClient
    this.apiClient.config = {
      ...this.apiClient.config,
      ...newConfig,
      keys: { ...this.apiClient.config.keys, ...newConfig.keys },
      models: { ...this.apiClient.config.models, ...newConfig.models }
    };

    // 持久化到 localStorage
    localStorage.setItem('visualization_llm_config', JSON.stringify(this.apiClient.config));

    // 通知其他组件配置已更新
    window.dispatchEvent(new CustomEvent('config-updated', { detail: this.apiClient.config }));

    alert('配置已保存！现在可以使用新的 AI 模型进行生成了。');
    this.modal.style.display = 'none';
  }
}
