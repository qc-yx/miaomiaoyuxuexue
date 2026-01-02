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
        
        // 返回用户信息和 token
        res.status(201).json({
            message: '注册成功',
            user: newUser[0],
            token
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('注册错误:', error);
        res.status(500).json({ message: '注册失败', error: error.message });
    } finally {
        client.release();
    }
});

// 登录路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 检查必填字段
        if (!username || !password) {
            return res.status(400).json({ message: '请提供完整的登录信息' });
        }
        
        // 查找用户
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        const user = users[0];
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        // 生成 JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name },
            jwtSecret,
            { expiresIn: '7d' }
        );
        
        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            message: '登录成功',
            user: userWithoutPassword,
            token
        });
        
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '登录失败', error: error.message });
    }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        // 查找用户信息
        const { rows: users } = await pool.query(
            'SELECT id, username, name, created_at, invited_by FROM users WHERE id = $1',
            [decoded.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 返回用户信息（不包含密码）
        res.status(200).json(users[0]);
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ message: '获取用户信息失败', error: error.message });
    }
});

module.exports = router;