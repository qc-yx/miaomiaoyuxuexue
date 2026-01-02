const express = require('express');
const { app, pool, jwt, jwtSecret } = require('../server');
const bcrypt = require('bcrypt');

const router = express.Router();

// 注册路由
router.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('收到注册请求:', req.body);
        const { username, password, name } = req.body;
        console.log('解析的字段:', { username, password, name });
        
        // 检查必填字段
        if (!username || !password || !name) {
            console.log('字段验证失败:', { username: !!username, password: !!password, name: !!name });
            return res.status(400).json({ message: '请提供完整的注册信息' });
        }
        
        await client.query('BEGIN');
        
        // 检查用户名是否已被注册
        const { rows: existingUser } = await client.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (existingUser.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: '该用户名已被注册' });
        }
        
        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建新用户（同时设置username和email字段以保持兼容性）
        const { rows: newUser } = await client.query(
            'INSERT INTO users (username, email, password, name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, name, created_at',
            [username, username, hashedPassword, name]
        );
        
        await client.query('COMMIT');
        
        // 生成 JWT token
        const token = jwt.sign(
            { id: newUser[0].id, username: newUser[0].username, name: newUser[0].name },
            jwtSecret,
            { expiresIn: '7d' }
        );