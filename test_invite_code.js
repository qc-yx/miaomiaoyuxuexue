const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testInviteCode() {
    console.log('=== 邀请码功能测试 ===\n');
    
    try {
        // 1. 首先登录获取token
        console.log('1. 用户登录获取token...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: '111111',
            password: '111111'
        });
        
        if (loginResponse.data.token) {
            console.log('✅ 登录成功');
            const token = loginResponse.data.token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // 2. 测试获取邀请码
            console.log('\n2. 测试获取邀请码...');
            try {
                const inviteCodeResponse = await axios.get(`${API_BASE}/invite/my-code`, { headers });
                console.log('✅ 获取邀请码成功:', inviteCodeResponse.data);
            } catch (error) {
                console.log('❌ 获取邀请码失败:', error.response?.data || error.message);
            }
            
            // 3. 测试绑定邀请码（用错误的邀请码）
            console.log('\n3. 测试绑定邀请码...');
            try {
                const bindResponse = await axios.post(`${API_BASE}/invite/bind`, 
                    { code: 'INVALID' }, 
                    { headers }
                );
                console.log('✅ 绑定邀请码响应:', bindResponse.data);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log('✅ 正确处理了无效邀请码');
                } else {
                    console.log('❌ 绑定邀请码错误:', error.response?.data || error.message);
                }
            }
            
        } else {
            console.log('❌ 登录失败');
        }
        
    } catch (error) {
        console.log('❌ 测试失败:', error.response?.data || error.message);
    }
}

testInviteCode();