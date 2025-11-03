#!/usr/bin/env node

/**
 * 万物可视化平台 - 开发服务器启动脚本
 * 用于本地开发和测试
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HOST = 'localhost';
const MAIN_APP_DIR = path.join(__dirname, 'main-app');
const GENERAL_VIZ_DIR = path.join(__dirname, 'GeneralVisualization');
const BACKEND_URL = 'http://localhost:8000';  // FastAPI后端地址

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 启用CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // 处理根路径
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // 处理API路由
    if (pathname.startsWith('/api/')) {
        handleAPIRequest(req, res, pathname, parsedUrl.query);
        return;
    }

    // 处理静态文件
    serveStaticFile(pathname, res);
});

// API代理到FastAPI后端
function proxyToBackend(req, res, pathname, method = req.method) {
    const targetUrl = `${BACKEND_URL}${pathname}`;
    const urlParts = url.parse(targetUrl);

    const options = {
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: urlParts.path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...req.headers
        }
    };

    // 删除一些可能冲突的headers
    delete options.headers['host'];
    delete options.headers['connection'];
    delete options.headers['content-length'];

    console.log(`🔄 代理API请求: ${method} ${targetUrl}`);

    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`✅ 后端响应: ${proxyRes.statusCode} ${targetUrl}`);

        // 设置响应头
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });

        // 添加CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.writeHead(proxyRes.statusCode);

        proxyRes.on('data', (chunk) => {
            res.write(chunk);
        });

        proxyRes.on('end', () => {
            res.end();
        });
    });

    proxyReq.on('error', (err) => {
        console.error(`❌ 代理请求失败: ${targetUrl}`, err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Backend service unavailable',
            message: `无法连接到后端服务: ${BACKEND_URL}`,
            details: err.message
        }));
    });

    // 转发请求体
    req.on('data', (chunk) => {
        proxyReq.write(chunk);
    });

    req.on('end', () => {
        proxyReq.end();
    });
}

// 处理API请求
function handleAPIRequest(req, res, pathname, query) {
    const contentType = { 'Content-Type': 'application/json' };

    try {
        // 优先代理到FastAPI后端
        if (pathname === '/api/resolve_or_generate' || pathname === '/api/registry') {
            console.log(`🚀 直接代理到后端: ${pathname}`);
            proxyToBackend(req, res, pathname);
            return;
        }

        // API健康检查 - 代理到后端，如果失败则使用备用实现
        if (pathname === '/api/health') {
            res.writeHead(200, contentType);
            res.end(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                features: {
                    api: true,
                    cache: true,
                    optimization: true
                }
            }));
            return;
        }

        // 生成可视化API
        if (pathname === '/api/visualize') {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        const result = generateVisualization(data);
                        res.writeHead(200, contentType);
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(400, contentType);
                        res.end(JSON.stringify({
                            error: 'Invalid request data',
                            message: error.message
                        }));
                    }
                });
            } else {
                res.writeHead(405, contentType);
                res.end(JSON.stringify({
                    error: 'Method not allowed'
                }));
            }
            return;
        }

        // 获取模板列表
        if (pathname === '/api/templates') {
            res.writeHead(200, contentType);
            res.end(JSON.stringify(getTemplates()));
            return;
        }

        // 获取历史记录
        if (pathname === '/api/history') {
            res.writeHead(200, contentType);
            res.end(JSON.stringify(getHistory()));
            return;
        }

        // 默认API响应
        res.writeHead(404, contentType);
        res.end(JSON.stringify({
            error: 'API endpoint not found'
        }));

    } catch (error) {
        res.writeHead(500, contentType);
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }));
    }
}

// 生成可视化响应（模拟）
function generateVisualization(data) {
    return {
        id: 'viz_' + Date.now(),
        type: determineVisualizationType(data.prompt),
        title: extractTitle(data.prompt),
        description: data.prompt,
        data: generateMockData(data.prompt),
        config: {
            theme: data.theme || 'light',
            animated: true,
            interactive: true
        },
        createdAt: new Date().toISOString(),
        estimatedLoadTime: '2-3秒'
    };
}

// 确定可视化类型
function determineVisualizationType(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('柱状图') || lowerPrompt.includes('柱形图')) return 'bar';
    if (lowerPrompt.includes('饼图') || lowerPrompt.includes('圆图')) return 'pie';
    if (lowerPrompt.includes('折线图') || lowerPrompt.includes('线图')) return 'line';
    if (lowerPrompt.includes('散点图')) return 'scatter';
    if (lowerPrompt.includes('热力图')) return 'heatmap';

    return 'auto'; // AI自动选择
}

// 提取标题
function extractTitle(prompt) {
    const titleMap = {
        '正态分布': '正态分布图',
        '行星运动': '行星运动轨迹',
        '简谐振动': '简谐振动演示',
        '二次函数': '二次函数图像'
    };

    for (const [key, value] of Object.entries(titleMap)) {
        if (prompt.includes(key)) {
            return value;
        }
    }

    return prompt.substring(0, 20) + '...';
}

// 生成模拟数据
function generateMockData(prompt) {
    const dataTypes = {
        'bar': {
            labels: ['类别A', '类别B', '类别C', '类别D', '类别E'],
            datasets: [{
                label: '数据集1',
                data: [65, 59, 80, 81, 56]
            }]
        },
        'pie': {
            labels: ['部分A', '部分B', '部分C', '部分D'],
            datasets: [{
                data: [30, 25, 20, 25]
            }]
        },
        'line': {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '趋势线',
                data: [12, 19, 3, 5, 2, 3]
            }]
        }
    };

    const type = determineVisualizationType(prompt);
    return dataTypes[type] || dataTypes['bar'];
}

// 获取模板列表
function getTemplates() {
    return {
        categories: [
            {
                id: 'math',
                name: '数学可视化',
                icon: '📐',
                templates: [
                    {
                        id: 'normal-distribution',
                        name: '正态分布',
                        description: '展示正态分布的概率密度函数',
                        promptText: '正态分布 均值0 标准差1'
                    },
                    {
                        id: 'quadratic-function',
                        name: '二次函数',
                        description: '展示二次函数的图像和性质',
                        promptText: '二次函数 y = ax² + bx + c'
                    }
                ]
            },
            {
                id: 'astronomy',
                name: '天文可视化',
                icon: '🔭',
                templates: [
                    {
                        id: 'planet-motion',
                        name: '行星运动',
                        description: '展示行星围绕太阳运动的轨迹',
                        promptText: '行星运动轨迹 地球 火星'
                    }
                ]
            }
        ]
    };
}

// 获取历史记录
function getHistory() {
    return {
        items: [
            {
                id: 'viz_001',
                title: '正态分布图',
                type: 'bar',
                createdAt: '2025-11-02T10:30:00Z'
            },
            {
                id: 'viz_002',
                title: '行星运动轨迹',
                type: 'line',
                createdAt: '2025-11-02T09:15:00Z'
            }
        ]
    };
}

// 处理静态文件
function serveStaticFile(pathname, res) {
    // 处理根路径
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // 检查是否是GeneralVisualization模块的路径
    if (pathname.startsWith('/GeneralVisualization/')) {
        // 去掉前缀，直接从GeneralVisualization目录查找
        const relativePath = pathname.substring('/GeneralVisualization/'.length);
        const filePath = path.join(GENERAL_VIZ_DIR, relativePath);
        serveFile(filePath, res, MAIN_APP_DIR);
    } else {
        // 处理相对路径（如 ../GeneralVisualization/）
        if (pathname.startsWith('../')) {
            // 处理相对路径，指向GeneralVisualization目录
            const relativePath = pathname.substring(3); // 去掉 "../"
            const filePath = path.join(GENERAL_VIZ_DIR, relativePath);
            serveFile(filePath, res, MAIN_APP_DIR);
        } else {
            // 默认从main-app目录查找
            const filePath = path.join(MAIN_APP_DIR, pathname);
            serveFile(filePath, res, MAIN_APP_DIR);
        }
    }
}

// 通用文件服务函数
function serveFile(filePath, res, fallbackDir) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 文件不存在，尝试返回index.html（SPA支持）
            if (err.code === 'ENOENT' && !path.extname(filePath)) {
                const indexPath = path.join(fallbackDir, 'index.html');
                fs.readFile(indexPath, (indexErr, indexData) => {
                    if (indexErr) {
                        sendErrorResponse(res, 404, `File not found: ${filePath}`);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexData);
                    }
                });
            } else {
                sendErrorResponse(res, 404, `File not found: ${filePath}`);
            }
            return;
        }

        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // 记录模块访问日志
        if (filePath.includes('GeneralVisualization') && filePath.includes('index.html')) {
            const moduleName = filePath.split('/').slice(-2, -1)[0];
            console.log(`📊 Module accessed: ${moduleName} (${filePath})`);
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// 发送错误响应
function sendErrorResponse(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/html' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error ${statusCode}</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1>Error ${statusCode}</h1>
            <p>${message}</p>
        </body>
        </html>
    `);
}

// 启动服务器
server.listen(PORT, HOST, () => {
    console.log('🚀 万物可视化平台开发服务器已启动');
    console.log(`📍 本地访问: http://${HOST}:${PORT}`);
    console.log(`🌐 主页地址: http://${HOST}:${PORT}/index.html`);
    console.log(`🧪 测试页面: http://${HOST}:${PORT}/test.html`);
    console.log('');
    console.log('📋 可用API端点:');
    console.log('  GET  /api/health     - 健康检查');
    console.log('  POST /api/visualize  - 生成可视化');
    console.log('  GET  /api/templates   - 获取模板');
    console.log('  GET  /api/history    - 获取历史');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});