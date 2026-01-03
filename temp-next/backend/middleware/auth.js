const { jwt, jwtSecret } = require('../server');

// 认证中间件，用于验证 JWT token
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: '无效或过期的令牌' });
    }
};

module.exports = { authMiddleware };