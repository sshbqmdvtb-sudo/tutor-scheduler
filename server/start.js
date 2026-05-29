// Zeabur 入口：构建前端 + 启动服务
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 确保前端已构建
const distPath = path.join(__dirname, '../client/dist');
if (!fs.existsSync(distPath)) {
  console.log('正在构建前端...');
  execSync('npm install && npx vite build', {
    cwd: path.join(__dirname, '../client'),
    stdio: 'inherit'
  });
}

// 启动服务
console.log('启动服务...');
require('./app.js');
