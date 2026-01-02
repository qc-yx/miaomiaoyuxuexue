require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// 初始化 Express 应用
const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Neon 数据库配置
const neonUrl = process.env.NEON_URL;
const pool = new Pool({
    connectionString: neonUrl,
    ssl: {
        rejectUnauthorized: false
    },
    // 适配 Neon 自动休眠的连接配置
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
    max: 20,
    min: 2
});

// 数据库连接重试逻辑
async function testDatabaseConnection() {
    let retries = 5;
    const retryDelay = 2000;
    
    while (retries > 0) {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('数据库连接成功');
            return true;
        } catch (error) {
            retries--;
            console.error(`数据库连接失败，剩余重试次数: ${retries}`, error.message);
            if (retries === 0) {
                console.error('数据库连接重试失败，服务将继续运行但数据库功能不可用');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }