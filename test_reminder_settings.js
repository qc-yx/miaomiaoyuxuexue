const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testReminderSettings() {
    console.log('=== 提醒设置 API 测试 ===\n');
    
    try {
        // 1. 登录获取token
        console.log('1. 用户登录...');
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
            
            // 2. 获取当前提醒设置
            console.log('\n2. 获取当前提醒设置...');
            try {
                const reminderResponse = await axios.get(`${API_BASE}/exercises/reminder`, { headers });
                console.log('✅ 获取提醒设置成功:', reminderResponse.data);
                
                // 3. 更新提醒设置
                console.log('\n3. 更新提醒设置...');
                const updateResponse = await axios.post(`${API_BASE}/exercises/reminder`, 
                    { enabled: true, time: '18:00' }, 
                    { headers }
                );
                console.log('✅ 更新提醒设置成功:', updateResponse.data);
                
                // 4. 再次获取确认
                console.log('\n4. 确认提醒设置更新...');
                const updatedReminder = await axios.get(`${API_BASE}/exercises/reminder`, { headers });
                console.log('✅ 更新后的提醒设置:', updatedReminder.data);
                
                // 5. 测试禁用提醒
                console.log('\n5. 测试禁用提醒...');
                const disableResponse = await axios.post(`${API_BASE}/exercises/reminder`, 
                    { enabled: false, time: '09:00' }, 
                    { headers }
                );
                console.log('✅ 禁用提醒成功:', disableResponse.data);
                
            } catch (error) {
                console.log('❌ 提醒设置 API 错误:', error.response?.data || error.message);
            }
        } else {
            console.log('❌ 登录失败');
        }
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    }
}

testReminderSettings();