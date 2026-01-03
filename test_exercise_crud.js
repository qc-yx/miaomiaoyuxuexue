const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testExerciseCRUD() {
    console.log('=== 运动 CRUD 操作测试 ===\n');
    
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
            
            // 2. 创建新运动
            console.log('\n2. 创建新运动...');
            try {
                const createResponse = await axios.post(`${API_BASE}/exercises`, {
                    name: '测试跑步',
                    type: '跑步',
                    duration: 30,
                    intensity: '中等'
                }, { headers });
                
                console.log('✅ 创建运动成功:', createResponse.data);
                const exerciseId = createResponse.data.id;
                
                // 3. 更新运动完成状态
                console.log('\n3. 更新运动完成状态...');
                const updateResponse = await axios.put(`${API_BASE}/exercises/${exerciseId}/completed`, {
                    completed: true
                }, { headers });
                
                console.log('✅ 更新运动状态成功:', updateResponse.data);
                
                // 4. 再次更新（取消完成）
                console.log('\n4. 取消运动完成状态...');
                const uncompleteResponse = await axios.put(`${API_BASE}/exercises/${exerciseId}/completed`, {
                    completed: false
                }, { headers });
                
                console.log('✅ 取消运动状态成功:', uncompleteResponse.data);
                
                // 5. 删除运动
                console.log('\n5. 删除运动...');
                const deleteResponse = await axios.delete(`${API_BASE}/exercises/${exerciseId}`, { headers });
                console.log('✅ 删除运动成功:', deleteResponse.data);
                
                // 6. 验证运动已被删除
                console.log('\n6. 验证运动已被删除...');
                const getAllResponse = await axios.get(`${API_BASE}/exercises`, { headers });
                const deletedExercise = getAllResponse.data.find(ex => ex.id === exerciseId);
                
                if (!deletedExercise) {
                    console.log('✅ 运动已被成功删除');
                } else {
                    console.log('❌ 运动仍存在:', deletedExercise);
                }
                
                console.log('\n✅ 所有 CRUD 操作测试通过！');
                
            } catch (error) {
                console.log('❌ CRUD 操作错误:', error.response?.data || error.message);
            }
        } else {
            console.log('❌ 登录失败');
        }
    } catch (error) {
        console.log('❌ 测试失败:', error.message);
    }
}

testExerciseCRUD();