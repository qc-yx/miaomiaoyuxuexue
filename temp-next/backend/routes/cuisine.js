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

// 保存或更新菜系分类和菜品
router.post('/categories', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { categories } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!categories || typeof categories !== 'object') {
            return res.status(400).json({ message: '请提供有效的菜系数据' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 先删除用户的所有现有分类和菜品
            const { rows: existingCategories } = await client.query(
                'SELECT id FROM cuisine_categories WHERE user_id = $1',
                [decoded.id]
            );
            
            // 删除现有分类
            for (const category of existingCategories) {
                await client.query(
                    'DELETE FROM dishes WHERE category_id = $1',
                    [category.id]
                );
                
                await client.query(
                    'DELETE FROM cuisine_categories WHERE id = $1',
                    [category.id]
                );
            }
            
            // 保存新的分类和菜品
            for (const [categoryName, dishes] of Object.entries(categories)) {
                // 创建分类
                const { rows: newCategory } = await client.query(
                    'INSERT INTO cuisine_categories (user_id, name) VALUES ($1, $2) RETURNING *',
                    [decoded.id, categoryName]
                );
                
                // 创建菜品
                for (const dishName of dishes) {
                    await client.query(
                        'INSERT INTO dishes (category_id, name) VALUES ($1, $2)',
                        [newCategory[0].id, dishName]
                    );
                }
            }
            
            await client.query('COMMIT');
            res.status(200).json({ message: '菜系保存成功' });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('保存菜系错误:', error);
        res.status(500).json({ message: '保存菜系失败', error: error.message });
    }
});

// 获取随机菜品
router.get('/random', async (req, res) => {
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
            // 查找用户的所有菜品
            const { rows: categories } = await client.query(
                'SELECT id FROM cuisine_categories WHERE user_id = $1',
                [decoded.id]
            );
            
            if (categories.length === 0) {
                return res.status(404).json({ message: '没有找到菜系分类' });
            }
            
            // 获取所有菜品
            const allDishes = [];
            for (const category of categories) {
                const { rows: dishes } = await client.query(
                    'SELECT name FROM dishes WHERE category_id = $1',
                    [category.id]
                );
                
                allDishes.push(...dishes.map(dish => dish.name));
            }
            
            if (allDishes.length === 0) {
                return res.status(404).json({ message: '没有找到菜品' });
            }
            
            // 随机选择一个菜品
            const randomIndex = Math.floor(Math.random() * allDishes.length);
            const randomDish = allDishes[randomIndex];
            
            res.status(200).json({ dish: randomDish });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取随机菜品错误:', error);
        res.status(500).json({ message: '获取随机菜品失败', error: error.message });
    }
});

// 获取历史记录
router.get('/history', async (req, res) => {
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
            // 查找用户的历史记录
            const { rows: history } = await client.query(
                'SELECT time, content FROM cuisine_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
                [decoded.id]
            );
            
            res.status(200).json(history);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取历史记录错误:', error);
        res.status(500).json({ message: '获取历史记录失败', error: error.message });
    }
});

// 清除历史记录
router.delete('/history', async (req, res) => {
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
            // 删除用户的所有历史记录
            await client.query(
                'DELETE FROM cuisine_history WHERE user_id = $1',
                [decoded.id]
            );
            
            res.status(200).json({ message: '历史记录已清除' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('清除历史记录错误:', error);
        res.status(500).json({ message: '清除历史记录失败', error: error.message });
    }
});

// 保存历史记录
router.post('/history', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { time, content } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!time || !content) {
            return res.status(400).json({ message: '请提供完整的历史记录信息' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 保存历史记录
            await client.query(
                'INSERT INTO cuisine_history (user_id, time, content) VALUES ($1, $2, $3)',
                [decoded.id, time, content]
            );
            
            res.status(200).json({ message: '历史记录已保存' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('保存历史记录错误:', error);
        res.status(500).json({ message: '保存历史记录失败', error: error.message });
    }
});

module.exports = router;