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