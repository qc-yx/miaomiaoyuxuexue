const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testServerBasic() {
    console.log('🧪 测试服务器基本功能...\n');

    try {
        // 测试注册接口
        console.log('📝 测试注册接口...');
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
            username: 'test_user_123',
            password: '123456',
            name: 'Test User'
        });
        console.log('✅ 注册成功');
        console.log('响应数据:', registerResponse.data);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        
        // 如果是连接错误，尝试其他端口
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔍 尝试端口3000...');
            try {
                const response = await axios.post('http://localhost:3000/api/auth/register', {
                    username: 'test_user_123',
                    password: '123456',
                    email: 'test@test.com'
                });
                console.log('✅ 在端口3000上找到服务器');
                console.log('响应数据:', response.data);
            } catch (error2) {
                console.error('❌ 端口3000也失败:', error2.message);
            }
        }
    }
}

testServerBasic();