const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 获取当前用户的所有菜系分类和菜品
router.get('/categories', async (req, res) => {
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
            // 查找用户的所有菜系分类
            const { rows: categories } = await client.query(
                'SELECT * FROM cuisine_categories WHERE user_id = $1',
                [decoded.id]
            );
            
            // 转换为前端需要的格式
            const formattedCategories = {};
            
            // 为每个分类获取菜品
            for (const category of categories) {
                const { rows: dishes } = await client.query(
                    'SELECT name FROM dishes WHERE category_id = $1 ORDER BY name ASC',
                    [category.id]
                );
                
                formattedCategories[category.name] = dishes.map(dish => dish.name);
            }
            
            res.status(200).json(formattedCategories);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取菜系分类错误:', error);
        res.status(500).json({ message: '获取菜系分类失败', error: error.message });
    }
});