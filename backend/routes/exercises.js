const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 运动相关API

// 获取当前用户的所有运动
router.get('/', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 查找用户的所有运动
            const { rows: exercises } = await client.query(
                'SELECT * FROM exercises WHERE user_id = $1 ORDER BY created_at DESC',
                [decoded.id]
            );
            
            res.status(200).json(exercises);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取运动列表错误:', error);
        res.status(500).json({ message: '获取运动列表失败', error: error.message });
    }
});

// 创建新运动
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { name, type, duration, intensity } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });