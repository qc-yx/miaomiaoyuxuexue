const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试用户名认证系统
async function testUsernameAuth() {
    console.log('=== 开始测试用户名认证系统 ===\n');
    
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = 'password123';
    const testName = '测试用户';
    
    try {
        // 1. 测试注册功能
        console.log('1. 测试注册功能...');
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
            username: testUsername,
            password: testPassword,
            name: testName
        });
        
        console.log('注册成功:', registerResponse.data.message);
        console.log('用户信息:', {
            id: registerResponse.data.user.id,
            username: registerResponse.data.user.username,
            name: registerResponse.data.user.name
        });
        
        const token = registerResponse.data.token;
        console.log('获取到Token:', token ? 'Yes' : 'No');
        console.log('');
        
        // 2. 测试登录功能
        console.log('2. 测试登录功能...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: testUsername,
            password: testPassword
        });
        
        console.log('登录成功:', loginResponse.data.message);
        console.log('用户信息:', {
            id: loginResponse.data.user.id,
            username: loginResponse.data.user.username,
            name: loginResponse.data.user.name
        });
        
        const loginToken = loginResponse.data.token;
        console.log('获取到Token:', loginToken ? 'Yes' : 'No');
        console.log('');
        
        // 3. 测试获取用户信息功能
        console.log('3. 测试获取用户信息功能...');
        const meResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('获取用户信息成功:', meResponse.data);
        console.log('');
        
        // 4. 测试重复注册（应该失败）
        console.log('4. 测试重复注册（应该失败）...');
        try {
            await axios.post(`${API_BASE}/auth/register`, {
                username: testUsername,
                password: 'different_password',
                name: '重复用户'
            });
            console.log('错误：重复注册应该失败！');
        } catch (error) {
            console.log('正确：重复注册被阻止:', error.response.data.message);
        }
        console.log('');
        
        // 5. 测试错误密码（应该失败）
        console.log('5. 测试错误密码（应该失败）...');
        try {
            await axios.post(`${API_BASE}/auth/login`, {
                username: testUsername,
                password: 'wrong_password'
            });
            console.log('错误：错误密码应该失败！');
        } catch (error) {
            console.log('正确：错误密码被阻止:', error.response.data.message);
        }
        console.log('');
        
        console.log('=== 用户名认证系统测试完成 ===');
        
    } catch (error) {
        console.error('测试失败:', error.response?.data || error.message);
    }
}

// 运行测试
testUsernameAuth();