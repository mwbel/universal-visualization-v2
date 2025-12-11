const { spawn } = require('child_process');
const opn = require('open');
const path = require('path');

// 启动 Python HTTP 服务器
const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: __dirname,
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(`服务器输出: ${data}`);
  
  // 检测服务器启动成功
  if (data.toString().includes('Serving HTTP')) {
    console.log('服务器启动成功！正在打开浏览器...');
    
    // 打开浏览器
    opn('http://localhost:8000')
      .then(() => console.log('浏览器已打开'))
      .catch(err => console.error('打开浏览器失败:', err));
  }
});

server.stderr.on('data', (data) => {
  console.error(`服务器错误: ${data}`);
});

server.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  server.kill('SIGINT');
  process.exit(0);
});