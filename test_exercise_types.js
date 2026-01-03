const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testExerciseTypes() {
    console.log('=== 运动类型 API 测试 ===\n');
    
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
            
            // 2. 获取现有运动类型
            console.log('\n2. 获取现有运动类型...');
            try {
                const typesResponse = await axios.get(`${API_BASE}/exercises/types`, { headers });
                console.log('✅ 获取运动类型成功:', typesResponse.data);
                
                // 3. 尝试创建一个已存在的运动类型（应该失败）
                console.log('\n3. 尝试创建已存在的运动类型（应该失败）...');
                try {
                    const createResponse = await axios.post(`${API_BASE}/exercises/types`, 
                        { type: '跑步' }, 
                        { headers }
                    );
                    console.log('❌ 意外成功:', createResponse.data);
                } catch (error) {
                    if (error.response?.status === 400) {
                        console.log('✅ 正确处理了重复运动类型:', error.response.data.message);
                    } else {
                        console.log('❌ 错误响应:', error.response?.data || error.message);
                    }
                }
                
                // 4. 尝试创建一个新的运动类型
                console.log('\n4. 尝试创建新的运动类型...');
                try {
                    const newType = `游泳${Date.now()}`;
                    const createResponse = await axios.post(`${API_BASE}/exercises/types`, 
                        { type: newType }, 
                        { headers }
                    );
                    console.log('✅ 创建新运动类型成功:', createResponse.data);
                    
                    // 5. 再次获取类型列表确认
                    console.log('\n5. 确认类型列表更新...');
                    const updatedTypes = await axios.get(`${API_BASE}/exercises/types`, { headers });
                    console.log('✅ 更新后的运动类型:', updatedTypes.data);
                    
                } catch (error) {
                    console.log('❌ 创建新运动类型失败:', error.response?.data || error.message);
                }
                
            } catch (error) {
                console.log('❌ 运动类型 API 错误:', error.response?.data || error.message);
            }
        } else {
            console.log('❌ 登录失败');
        }
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    }
}

testExerciseTypes();