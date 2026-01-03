const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testStepByStep() {
    console.log('🧪 逐步测试数据共享功能...\n');

    let user1Token;

    try {
        // 步骤1: 测试注册用户
        console.log('📝 步骤1: 测试注册用户...');
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username: 'inviter_test',
                password: '123456',
                name: 'Inviter Test'
            });
            console.log('✅ 注册成功');
            console.log('响应状态:', response.status);
            console.log('响应数据:', response.data);
            user1Token = response.data.token;
            console.log('用户1 token:', user1Token.substring(0, 50) + '...');
        } catch (error) {
            console.error('❌ 注册失败:', error.response?.data || error.message);
            return;
        }

        // 步骤3: 测试创建邀请码
        console.log('\n📝 步骤3: 测试创建邀请码...');
        try {
            const inviteResponse = await axios.post(`${API_BASE_URL}/invite/create`, {}, {
                headers: { Authorization: `Bearer ${user1Token}` }
            });
            console.log('✅ 邀请码创建成功');
            console.log('响应数据:', inviteResponse.data);
            const inviteCode = inviteResponse.data.code;
            console.log('邀请码:', inviteCode);
        } catch (error) {
            console.error('❌ 创建邀请码失败:', error.response?.data || error.message);
            return;
        }

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
    }
}

testStepByStep();