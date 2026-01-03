const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 获取当前用户的所有转盘方案（支持绑定用户数据共享）
router.get('/settings', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 查找用户的邀请关系（被邀请者共享邀请者的数据）
        const { rows: userRelations } = await client.query(
            'SELECT invited_by FROM users WHERE id = $1',
            [decoded.id]
        );
        
        let targetUserId = decoded.id;
        let isShared = false;
        
        // 如果用户是被邀请的，使用邀请者的数据
        if (userRelations.length > 0 && userRelations[0].invited_by) {
            targetUserId = userRelations[0].invited_by;
            isShared = true;
        }
        
        // 查找用户的所有转盘方案
        const { rows: allSettings } = await client.query(
            'SELECT * FROM wheel_settings WHERE user_id = $1 ORDER BY created_at DESC',
            [targetUserId]
        );
        
        await client.query('COMMIT');
        
        // 转换数据格式
        const formattedSettings = allSettings.map(setting => {
            let options = setting.options;
            if (typeof options === 'string') {
                // 处理PostgreSQL数组字符串格式，例如：{"一等奖","二等奖","三等奖"}
                options = options.replace(/^\{|\}$/g, '').split(',').map(opt => opt.replace(/^"|"$/g, ''));
            }
            return {
                id: setting.id,
                name: setting.name,
                options: options,
                theme: setting.theme,
                created_at: setting.created_at,
                updated_at: setting.updated_at
            };
        });
        
        res.status(200).json({
            settings: formattedSettings,
            isShared: isShared,
            dataUserId: targetUserId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('获取转盘方案列表错误:', error);
        res.status(500).json({ message: '获取转盘方案列表失败', error: error.message });
    } finally {
        client.release();
    }
});

// 获取指定ID的转盘方案
router.get('/settings/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.params;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 查找用户的邀请关系（被邀请者共享邀请者的数据）
        const { rows: userRelations } = await client.query(
            'SELECT invited_by FROM users WHERE id = $1',
            [decoded.id]
        );
        
        let targetUserId = decoded.id;
        let isShared = false;
        
        // 如果用户是被邀请的，使用邀请者的数据
        if (userRelations.length > 0 && userRelations[0].invited_by) {
            targetUserId = userRelations[0].invited_by;
            isShared = true;
        }
        
        // 查找指定ID的转盘方案
        const { rows: settings } = await client.query(
            'SELECT * FROM wheel_settings WHERE id = $1 AND user_id = $2',
            [id, targetUserId]
        );
        
        await client.query('COMMIT');
        
        // 如果没有找到方案，返回默认值
        if (settings.length === 0) {
            return res.status(200).json({
                options: ['一等奖', '二等奖', '三等奖', '参与奖', '谢谢参与', '再来一次'],
                theme: 'green',
                isShared: false,
                dataUserId: targetUserId
            });
        }
        
        // 将PostgreSQL数组转换为JavaScript数组
        let options = settings[0].options;
        if (typeof options === 'string') {
            // 处理PostgreSQL数组字符串格式，例如：{"一等奖","二等奖","三等奖"}
            options = options.replace(/^\{|\}$/g, '').split(',').map(opt => opt.replace(/^"|"$/g, ''));
        }
        
        res.status(200).json({
            id: settings[0].id,
            name: settings[0].name,
            options: options,
            theme: settings[0].theme,
            isShared: isShared,
            dataUserId: targetUserId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('获取转盘方案错误:', error);
        res.status(500).json({ message: '获取转盘方案失败', error: error.message });
    } finally {
        client.release();
    }
});

// 保存或更新转盘方案
router.post('/settings', async (req, res) => {
    try {
        console.log('收到保存转盘方案请求:', req.body);
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { id, name, options, theme } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!name) {
            return res.status(400).json({ message: '请提供方案名称' });
        }
        
        if (!options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: '请提供有效的转盘选项（至少2个）' });
        }
        
        if (!theme) {
            return res.status(400).json({ message: '请提供有效的主题' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 查找用户的邀请关系（被邀请者共享邀请者的数据）
            const { rows: userRelations } = await client.query(
                'SELECT invited_by FROM users WHERE id = $1',
                [decoded.id]
            );
            
            let targetUserId = decoded.id;
            
            // 如果用户是被邀请的，使用邀请者的数据
            if (userRelations.length > 0 && userRelations[0].invited_by) {
                targetUserId = userRelations[0].invited_by;
            }
            
            let result;
            
            if (id) {
                        // 更新现有方案
                        result = await client.query(
                            'UPDATE wheel_settings SET name = $1, options = $2, theme = $3 WHERE id = $4 AND user_id = $5',
                            [name, options, theme, id, targetUserId]
                        );
                        console.log('更新方案结果:', result.rowCount);
                    } else {
                        // 创建新方案
                        result = await client.query(
                            'INSERT INTO wheel_settings (user_id, name, options, theme) VALUES ($1, $2, $3, $4) RETURNING id',
                            [targetUserId, name, options, theme]
                        );
                        console.log('创建方案结果:', result.rows[0].id);
                    }
            
            await client.query('COMMIT');
            
            // 返回完整的方案信息
            if (id) {
                // 更新操作，返回更新后的方案
                const { rows: updatedScheme } = await client.query(
                    'SELECT * FROM wheel_settings WHERE id = $1',
                    [id]
                );
                res.status(200).json({ 
                    message: '转盘方案保存成功', 
                    scheme: updatedScheme[0] 
                });
            } else {
                // 创建操作，返回新创建的方案
                const { rows: newScheme } = await client.query(
                    'SELECT * FROM wheel_settings WHERE id = $1',
                    [result.rows[0].id]
                );
                res.status(200).json({ 
                    message: '转盘方案保存成功', 
                    scheme: newScheme[0] 
                });
            }
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('保存转盘方案错误:', error);
        res.status(500).json({ message: '保存转盘方案失败', error: error.message });
    }
});

// 删除转盘方案
router.delete('/settings/:id', async (req, res) => {
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
            await client.query('BEGIN');
            
            // 查找用户的邀请关系（被邀请者共享邀请者的数据）
            const { rows: userRelations } = await client.query(
                'SELECT invited_by FROM users WHERE id = $1',
                [decoded.id]
            );
            
            let targetUserId = decoded.id;
            
            // 如果用户是被邀请的，使用邀请者的数据
            if (userRelations.length > 0 && userRelations[0].invited_by) {
                targetUserId = userRelations[0].invited_by;
            }
            
            // 删除方案
            const result = await client.query(
                'DELETE FROM wheel_settings WHERE id = $1 AND user_id = $2',
                [id, targetUserId]
            );
            
            await client.query('COMMIT');
            
            if (result.rowCount === 0) {
                return res.status(404).json({ message: '方案不存在' });
            }
            
            res.status(200).json({ message: '转盘方案删除成功' });
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('删除转盘方案错误:', error);
        res.status(500).json({ message: '删除转盘方案失败', error: error.message });
    }
});

// 获取当前用户的转盘历史记录
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
            // 查找用户的转盘历史记录
            const { rows: history } = await client.query(
                'SELECT * FROM wheel_history WHERE user_id = $1 ORDER BY created_at DESC',
                [decoded.id]
            );
            
            res.status(200).json(history);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('获取转盘历史记录错误:', error);
        res.status(500).json({ message: '获取转盘历史记录失败', error: error.message });
    }
});

// 保存转盘游戏结果到历史记录
router.post('/history', async (req, res) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { result } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!result) {
            return res.status(400).json({ message: '请提供有效的游戏结果' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        const client = await pool.connect();
        try {
            // 保存游戏结果
            await client.query(
                'INSERT INTO wheel_history (user_id, result) VALUES ($1, $2)',
                [decoded.id, result]
            );
            
            res.status(200).json({ message: '游戏结果保存成功' });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('保存游戏结果错误:', error);
        res.status(500).json({ message: '保存游戏结果失败', error: error.message });
    }
});

module.exports = router;