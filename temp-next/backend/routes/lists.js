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
        
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        if (!name) {
            return res.status(400).json({ message: '请提供清单名称' });
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 创建清单
            const { rows: list } = await client.query(
                'INSERT INTO shared_lists (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
                [name, description, userId]
            );
            
            // 添加创建者为成员
            await client.query(
                'INSERT INTO list_members (list_id, user_id, role) VALUES ($1, $2, $3)',
                [list[0].id, userId, 'owner']
            );
            
            await client.query('COMMIT');
            
            res.status(201).json({
                message: '清单创建成功',
                list: list[0]
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('创建清单错误:', error);
        res.status(500).json({ message: '创建清单失败', error: error.message });
    }
});

// 获取特定共享清单的详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
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
            // 检查用户是否为清单成员
            const { rows: memberCheck } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: '您没有权限访问此清单' });
            }
            
            // 获取清单详情
            const { rows: list } = await client.query(
                'SELECT * FROM shared_lists WHERE id = $1',
                [id]
            );
            
            if (list.length === 0) {
                return res.status(404).json({ message: '清单不存在' });
            }
            
            // 获取清单成员
            const { rows: members } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1',
                [id]
            );
            
            // 获取清单项
            const { rows: items } = await client.query(
                'SELECT * FROM list_items WHERE list_id = $1 ORDER BY created_at DESC',
                [id]
            );
            
            res.status(200).json({
                message: '获取清单详情成功',
                list: {
                    ...list[0],
                    members,
                    items
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取清单详情错误:', error);
        res.status(500).json({ message: '获取清单详情失败', error: error.message });
    }
});

// 获取清单项
router.get('/:id/items', async (req, res) => {
    try {
        const { id } = req.params;
        
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
            // 检查用户是否为清单成员
            const { rows: memberCheck } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: '您没有权限访问此清单' });
            }
            
            // 获取清单项
            const { rows: items } = await client.query(
                'SELECT * FROM list_items WHERE list_id = $1 ORDER BY created_at DESC',
                [id]
            );
            
            res.status(200).json({
                message: '获取清单项成功',
                items
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取清单项错误:', error);
        res.status(500).json({ message: '获取清单项失败', error: error.message });
    }
});

// 创建清单项
router.post('/:id/items', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, completed } = req.body;
        
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        if (!name) {
            return res.status(400).json({ message: '请提供清单项名称' });
        }
        
        const client = await pool.connect();
        try {
            // 检查用户是否为清单成员
            const { rows: memberCheck } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: '您没有权限访问此清单' });
            }
            
            // 创建清单项
            const { rows: item } = await client.query(
                'INSERT INTO list_items (list_id, name, description, completed, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [id, name, description, completed || false, userId]
            );
            
            res.status(201).json({
                message: '创建清单项成功',
                item: item[0]
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('创建清单项错误:', error);
        res.status(500).json({ message: '创建清单项失败', error: error.message });
    }
});

// 更新清单项
router.put('/items/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, description, completed } = req.body;
        
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
            // 检查清单项是否存在
            const { rows: itemCheck } = await client.query(
                'SELECT * FROM list_items WHERE id = $1',
                [itemId]
            );
            
            if (itemCheck.length === 0) {
                return res.status(404).json({ message: '清单项不存在' });
            }
            
            const item = itemCheck[0];
            
            // 检查用户是否为清单成员
            const { rows: memberCheck } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
                [item.list_id, userId]
            );
            
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: '您没有权限访问此清单' });
            }
            
            // 更新清单项
            const { rows: updatedItem } = await client.query(
                'UPDATE list_items SET name = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
                [name, description, completed, itemId]
            );
            
            res.status(200).json({
                message: '更新清单项成功',
                item: updatedItem[0]
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('更新清单项错误:', error);
        res.status(500).json({ message: '更新清单项失败', error: error.message });
    }
});

// 删除清单项
router.delete('/items/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        
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
            // 检查清单项是否存在
            const { rows: itemCheck } = await client.query(
                'SELECT * FROM list_items WHERE id = $1',
                [itemId]
            );
            
            if (itemCheck.length === 0) {
                return res.status(404).json({ message: '清单项不存在' });
            }
            
            const item = itemCheck[0];
            
            // 检查用户是否为清单成员
            const { rows: memberCheck } = await client.query(
                'SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2',
                [item.list_id, userId]
            );
            
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: '您没有权限访问此清单' });
            }
            
            // 删除清单项
            await client.query(
                'DELETE FROM list_items WHERE id = $1',
                [itemId]
            );
            
            res.status(200).json({ message: '删除清单项成功' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('删除清单项错误:', error);
        res.status(500).json({ message: '删除清单项失败', error: error.message });
    }
});

module.exports = router;