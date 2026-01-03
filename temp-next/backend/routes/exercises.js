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
        }
        
        if (!name || !type || !duration || !intensity) {
            return res.status(400).json({ message: '请提供完整的运动信息' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 创建新运动
        const { rows: newExercise } = await client.query(
            'INSERT INTO exercises (user_id, name, type, duration, intensity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [decoded.id, name, type, parseInt(duration), intensity]
        );
        
        await client.query('COMMIT');
        res.status(201).json(newExercise[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('创建运动错误:', error);
        res.status(500).json({ message: '创建运动失败', error: error.message });
    } finally {
        client.release();
    }
});

// 更新运动
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.params;
        const { name, type, duration, intensity } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!name || !type || !duration || !intensity) {
            return res.status(400).json({ message: '请提供完整的运动信息' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 更新运动
        const { rows: updatedExercise } = await client.query(
            'UPDATE exercises SET name = $1, type = $2, duration = $3, intensity = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [name, type, parseInt(duration), intensity, id, decoded.id]
        );
        
        if (updatedExercise.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '运动不存在' });
        }
        
        await client.query('COMMIT');
        res.status(200).json(updatedExercise[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('更新运动错误:', error);
        res.status(500).json({ message: '更新运动失败', error: error.message });
    } finally {
        client.release();
    }
});

// 删除运动
router.delete('/:id', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.params;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 删除运动
            const result = await client.query(
                'DELETE FROM exercises WHERE id = $1 AND user_id = $2',
                [id, decoded.id]
            );
            
            res.status(200).json({ message: '运动删除成功' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('删除运动错误:', error);
        res.status(500).json({ message: '删除运动失败', error: error.message });
    }
});

// 更新运动的完成状态
router.put('/:id/completed', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.params;
        const { completed } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 更新运动的完成状态
        const { rows: updatedExercise } = await client.query(
            'UPDATE exercises SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [completed, id, decoded.id]
        );
        
        if (updatedExercise.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '运动不存在' });
        }
        
        await client.query('COMMIT');
        res.status(200).json(updatedExercise[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('更新运动状态错误:', error);
        res.status(500).json({ message: '更新运动状态失败', error: error.message });
    } finally {
        client.release();
    }
});

// 运动类型相关API

// 获取当前用户的所有运动类型
router.get('/types', async (req, res) => {
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
            // 查找用户的所有运动类型
            const { rows: exerciseTypes } = await client.query(
                'SELECT * FROM exercise_types WHERE user_id = $1 ORDER BY created_at ASC',
                [decoded.id]
            );
            
            // 转换为前端需要的格式
            const types = exerciseTypes.map(type => type.type);
            
            res.status(200).json(types);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取运动类型错误:', error);
        res.status(500).json({ message: '获取运动类型失败', error: error.message });
    }
});

// 创建新的运动类型
router.post('/types', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { type } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!type) {
            return res.status(400).json({ message: '请提供运动类型' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 检查运动类型是否已存在
        const { rows: existingType } = await client.query(
            'SELECT id FROM exercise_types WHERE user_id = $1 AND type = $2',
            [decoded.id, type]
        );
        
        if (existingType.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: '该运动类型已存在' });
        }
        
        // 创建新的运动类型
        const { rows: newType } = await client.query(
            'INSERT INTO exercise_types (user_id, type) VALUES ($1, $2) RETURNING *',
            [decoded.id, type]
        );
        
        await client.query('COMMIT');
        res.status(201).json(newType[0].type);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('创建运动类型错误:', error);
        res.status(500).json({ message: '创建运动类型失败', error: error.message });
    } finally {
        client.release();
    }
});

// 删除运动类型
router.delete('/types/:id', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.params;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 删除运动类型
            await client.query(
                'DELETE FROM exercise_types WHERE id = $1 AND user_id = $2',
                [id, decoded.id]
            );
            
            res.status(200).json({ message: '运动类型删除成功' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('删除运动类型错误:', error);
        res.status(500).json({ message: '删除运动类型失败', error: error.message });
    }
});

// 提醒设置相关API

// 获取当前用户的提醒设置
router.get('/reminder', async (req, res) => {
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
            // 查找用户的提醒设置
            const { rows: reminder } = await client.query(
                'SELECT * FROM reminder_settings WHERE user_id = $1',
                [decoded.id]
            );
            
            if (reminder.length === 0) {
                // 没有找到提醒设置，返回默认设置
                return res.status(200).json({ enabled: false, time: '09:00' });
            }
            
            // 只返回前端需要的字段
            const { enabled, time } = reminder[0];
            res.status(200).json({ enabled, time });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取提醒设置错误:', error);
        res.status(500).json({ message: '获取提醒设置失败', error: error.message });
    }
});

// 创建或更新提醒设置
router.post('/reminder', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { enabled, time } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!time) {
            return res.status(400).json({ message: '请提供提醒时间' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 查找是否已存在提醒设置
        const { rows: existingReminder } = await client.query(
            'SELECT id FROM reminder_settings WHERE user_id = $1',
            [decoded.id]
        );
        
        let result;
        
        if (existingReminder.length > 0) {
            // 更新现有提醒设置
            const { rows: updatedReminder } = await client.query(
                'UPDATE reminder_settings SET enabled = $1, time = $2 WHERE id = $3 RETURNING *',
                [enabled, time, existingReminder[0].id]
            );
            result = updatedReminder[0];
        } else {
            // 创建新的提醒设置
            const { rows: newReminder } = await client.query(
                'INSERT INTO reminder_settings (user_id, enabled, time) VALUES ($1, $2, $3) RETURNING *',
                [decoded.id, enabled, time]
            );
            result = newReminder[0];
        }
        
        await client.query('COMMIT');
        
        // 只返回前端需要的字段
        const { enabled: updatedEnabled, time: updatedTime } = result;
        res.status(200).json({ enabled: updatedEnabled, time: updatedTime });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('保存提醒设置错误:', error);
        res.status(500).json({ message: '保存提醒设置失败', error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;