const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 获取当前用户的所有笔记
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
            // 查找用户的所有笔记
            const { rows: notes } = await client.query(
                'SELECT * FROM notes WHERE user_id = $1 ORDER BY date DESC',
                [decoded.id]
            );
            
            // 转换为前端需要的格式
            const formattedNotes = {};
            notes.forEach(note => {
                formattedNotes[note.date] = note.content;
            });
            
            res.status(200).json(formattedNotes);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取笔记错误:', error);
        res.status(500).json({ message: '获取笔记失败', error: error.message });
    }
});

// 获取特定日期的笔记
router.get('/:date', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const date = req.params.date;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 查找用户特定日期的笔记
            const { rows: note } = await client.query(
                'SELECT * FROM notes WHERE user_id = $1 AND date = $2',
                [decoded.id, date]
            );
            
            if (note.length === 0) {
                // 没有找到笔记
                return res.status(200).json({ content: '' });
            }
            
            res.status(200).json({ content: note[0].content });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取笔记错误:', error);
        res.status(500).json({ message: '获取笔记失败', error: error.message });
    }
});

// 保存笔记
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { date, content } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!date || content === undefined) {
            return res.status(400).json({ message: '请提供完整的笔记信息' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 查找是否已存在该日期的笔记
        const { rows: existingNote } = await client.query(
            'SELECT id FROM notes WHERE user_id = $1 AND date = $2',
            [decoded.id, date]
        );
        
        if (existingNote.length > 0) {
            // 更新现有笔记
            if (content.trim()) {
                // 如果内容不为空，更新笔记
                await client.query(
                    'UPDATE notes SET content = $1 WHERE id = $2',
                    [content, existingNote[0].id]
                );
            } else {
                // 如果内容为空，删除笔记
                await client.query(
                    'DELETE FROM notes WHERE id = $1',
                    [existingNote[0].id]
                );
            }
        } else {
            // 创建新笔记
            if (content.trim()) {
                await client.query(
                    'INSERT INTO notes (user_id, date, content) VALUES ($1, $2, $3)',
                    [decoded.id, date, content]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: '笔记保存成功' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('保存笔记错误:', error);
        res.status(500).json({ message: '保存笔记失败', error: error.message });
    } finally {
        client.release();
    }
});

// 删除笔记
router.delete('/:date', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const date = req.params.date;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!date) {
            return res.status(400).json({ message: '请提供要删除的笔记日期' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 删除笔记
            await client.query(
                'DELETE FROM notes WHERE user_id = $1 AND date = $2',
                [decoded.id, date]
            );
            
            res.status(200).json({ message: '笔记删除成功' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('删除笔记错误:', error);
        res.status(500).json({ message: '删除笔记失败', error: error.message });
    }
});

module.exports = router;