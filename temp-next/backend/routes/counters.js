const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 获取当前用户的计数器数据（支持绑定用户数据共享）
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        await client.query('BEGIN');
        
        // 查找用户的邀请关系（被邀请者共享邀请者的数据）
        const { rows: userRelations } = await client.query(
            'SELECT invited_by FROM users WHERE id = $1',
            [userId]
        );
        
        let targetUserId = userId;
        let isShared = false;
        
        // 如果用户是被邀请的，使用邀请者的数据
        if (userRelations.length > 0 && userRelations[0].invited_by) {
            targetUserId = userRelations[0].invited_by;
            isShared = true;
        }
        
        // 获取计数器数据
        const { rows: counters } = await client.query(
            'SELECT * FROM counters WHERE user_id = $1',
            [targetUserId]
        );
        
        await client.query('COMMIT');
        
        // 格式化返回数据
        const counterData = {};
        counters.forEach(counter => {
            counterData[counter.type] = counter.value;
        });
        
        // 确保返回所有计数器类型
        const counterTypes = ['miaomiao-punish', 'miaomiao-super-punish', 'xuexue-punish', 'xuexue-super-punish'];
        counterTypes.forEach(type => {
            if (!(type in counterData)) {
                counterData[type] = 0;
            }
        });
        
        res.status(200).json({
            message: '获取计数器成功',
            counters: counterData,
            isShared: isShared,
            dataUserId: targetUserId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('获取计数器错误:', error);
        res.status(500).json({ message: '获取计数器失败', error: error.message });
    } finally {
        client.release();
    }
});

// 更新计数器值
router.post('/update', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { type, value, operation } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!type || (value === undefined && operation === undefined)) {
            return res.status(400).json({ message: '请提供计数器类型和操作' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        await client.query('BEGIN');
        
        // 查找用户的邀请关系（被邀请者共享邀请者的数据）
        const { rows: userRelations } = await client.query(
            'SELECT invited_by FROM users WHERE id = $1',
            [userId]
        );
        
        let targetUserId = userId;
        
        // 如果用户是被邀请的，使用邀请者的数据
        if (userRelations.length > 0 && userRelations[0].invited_by) {
            targetUserId = userRelations[0].invited_by;
        }
        
        // 检查计数器是否存在
        const { rows: existingCounter } = await client.query(
            'SELECT * FROM counters WHERE user_id = $1 AND type = $2',
            [targetUserId, type]
        );
        
        let updatedValue;
        
        if (existingCounter.length > 0) {
            // 更新现有计数器
            if (operation === 'increment') {
                updatedValue = existingCounter[0].value + 1;
            } else if (operation === 'decrement') {
                updatedValue = Math.max(0, existingCounter[0].value - 1); // 不允许负数
            } else if (operation === 'reset') {
                updatedValue = 0;
            } else {
                // 直接设置值
                updatedValue = parseInt(value) || 0;
            }
            
            await client.query(
                'UPDATE counters SET value = $1, updated_at = NOW() WHERE id = $2',
                [updatedValue, existingCounter[0].id]
            );
        } else {
            // 创建新计数器或更新现有计数器（使用ON CONFLICT处理重复键）
            if (operation === 'increment') {
                updatedValue = 1;
            } else if (operation === 'decrement') {
                updatedValue = 0;
            } else if (operation === 'reset') {
                updatedValue = 0;
            } else {
                updatedValue = parseInt(value) || 0;
            }
            
            await client.query(
                'INSERT INTO counters (user_id, type, value) VALUES ($1, $2, $3) ON CONFLICT (user_id, type) DO UPDATE SET value = $3, updated_at = NOW()',
                [targetUserId, type, updatedValue]
            );
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: '计数器更新成功',
            type: type,
            value: updatedValue
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('更新计数器错误:', error);
        res.status(500).json({ message: '更新计数器失败', error: error.message });
    } finally {
        client.release();
    }
});

// 重置所有计数器
router.post('/reset', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.id;
        
        await client.query('BEGIN');
        
        // 查找用户的邀请关系（被邀请者共享邀请者的数据）
        const { rows: userRelations } = await client.query(
            'SELECT invited_by FROM users WHERE id = $1',
            [userId]
        );
        
        let targetUserId = userId;
        
        // 如果用户是被邀请的，使用邀请者的数据
        if (userRelations.length > 0 && userRelations[0].invited_by) {
            targetUserId = userRelations[0].invited_by;
        }
        
        // 重置所有计数器
        await client.query(
            'UPDATE counters SET value = 0, updated_at = NOW() WHERE user_id = $1',
            [targetUserId]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: '所有计数器已重置'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('重置计数器错误:', error);
        res.status(500).json({ message: '重置计数器失败', error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;