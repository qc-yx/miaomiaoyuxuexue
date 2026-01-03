// Vercel入口文件
// 从server.js中导入Express应用
const { app } = require('./temp-next/backend/server');

// 导出Express应用作为默认导出，符合Vercel要求
module.exports = app;