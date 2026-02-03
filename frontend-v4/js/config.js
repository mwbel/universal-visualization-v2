// 前端配置文件
const CONFIG = {
  // API基础URL
  API_BASE_URL: 'http://localhost:9999',

  // 应用设置
  APP_NAME: '万物可视化 AI',
  VERSION: 'v3.8',

  // 文件上传设置
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
                        '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf',
                        '.csv', '.xlsx', '.xls', '.json', '.xml'],

  // 重试设置
  MAX_RETRY_ATTEMPTS: 3,

  // 开发模式
  DEV_MODE: true
};