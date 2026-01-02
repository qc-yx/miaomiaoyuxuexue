const express = require('express');
const { pool, jwt, jwtSecret } = require('../server');

const router = express.Router();

// 生成邀请码
function generateInviteCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// 创建邀请码
router.post('/create', async (req, res) => {
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
        
        // 检查用户是否已经有邀请码
        const { rows: existingCode } = await client.query(
            'SELECT * FROM invite_codes WHERE created_by = $1',
            [decoded.id]
        );
        
        if (existingCode.length > 0) {
            await client.query('COMMIT');
            return res.status(200).json({ code: existingCode[0].code, message: '邀请码已存在' });
        }
        
        // 生成新的邀请码
        const newCode = generateInviteCode();
        
        const { rows: createdCode } = await client.query(
            'INSERT INTO invite_codes (created_by, code, created_at) VALUES ($1, $2, $3) RETURNING *',
            [decoded.id, newCode, new Date().toISOString()]
        );
        
        await client.query('COMMIT');
        res.status(200).json({ code: createdCode[0].code });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('创建邀请码错误:', error);
        res.status(500).json({ message: '创建邀请码失败', error: error.message });
    } finally {
        client.release();
    }
});

// 获取当前用户的邀请码
router.get('/my-code', async (req, res) => {
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
        
        // 查找用户的邀请码
        const { rows: inviteCode } = await client.query(
            'SELECT * FROM invite_codes WHERE created_by = $1',
            [decoded.id]
        );
        
        if (inviteCode.length === 0) {
            // 如果没有邀请码，生成一个新的
            const newCode = generateInviteCode();
            
            const { rows: createdCode } = await client.query(
                'INSERT INTO invite_codes (created_by, code, created_at) VALUES ($1, $2, $3) RETURNING *',
                [decoded.id, newCode, new Date().toISOString()]
            );
            
            await client.query('COMMIT');
            return res.status(200).json({ code: createdCode[0].code });
        }
        
        await client.query('COMMIT');
        res.status(200).json({ code: inviteCode[0].code });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('获取邀请码错误:', error);
        res.status(500).json({ message: '获取邀请码失败', error: error.message });
    } finally {
        client.release();
    }
});

// 绑定邀请码
router.post('/bind', async (req, res) => {
    const client = await pool.connect();
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        const { code } = req.body;
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        
        if (!code) {
            return res.status(400).json({ message: '请提供有效的邀请码' });
        }
        
        // 验证 token
        const decoded = jwt.verify(token, jwtSecret);
        
        await client.query('BEGIN');
        
        // 查找邀请码
        const { rows: inviteCodes } = await client.query(
            'SELECT * FROM invite_codes WHERE code = $1',
            [code]
        );
        
        if (inviteCodes.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '邀请码不存在' });
        }
        
        const inviteCode = inviteCodes[0];
        
        if (inviteCode.created_by === decoded.id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: '不能绑定自己的邀请码' });
        }
        
        // 检查用户是否已经绑定过邀请码
        const { rows: users } = await client.query(
            'SELECT id, invited_by FROM users WHERE id = $1',
            [decoded.id]
        );
        
        if (users.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '用户不存在' });
        }
        
        const user = users[0];
        
        if (user.invited_by) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: '您已经绑定过邀请码' });
        }
        
        // 更新用户信息，绑定邀请码
        await client.query(
            'UPDATE users SET invited_by = $1 WHERE id = $2',
            [inviteCode.created_by, decoded.id]
        );
        
        // 更新邀请码使用时间
        await client.query(
            'UPDATE invite_codes SET used_at = $1, used_by = $2 WHERE id = $3',
            [new Date().toISOString(), decoded.id, inviteCode.id]
        );
        
        await client.query('COMMIT');
        res.status(200).json({ message: '邀请码绑定成功' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('绑定邀请码错误:', error);
        res.status(500).json({ message: '绑定邀请码失败', error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;