const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 获取当前用户的所有共享清单
router.get('/', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        const client = await pool.connect();
        try {
            // 获取用户参与的所有清单
            const { rows: lists } = await client.query(
                `SELECT DISTINCT sl.* FROM shared_lists sl 
                 INNER JOIN list_members lm ON sl.id = lm.list_id 
                 WHERE lm.user_id = $1 
                 ORDER BY sl.created_at DESC`,
                [userId]
            );
            
            res.status(200).json({
                message: '获取清单成功',
                lists
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取清单错误:', error);
        res.status(500).json({ message: '获取清单失败', error: error.message });
    }
});

// 创建共享清单
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;