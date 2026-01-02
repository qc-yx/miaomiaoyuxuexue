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