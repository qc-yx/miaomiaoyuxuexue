const http = require('http');

// 基础HTTP请求函数
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : body
                    };
                    resolve(response);
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 测试函数
async function testAPIs() {
    console.log('=== 开始API测试 ===\n');
    
    let authToken = null;
    let userId = null;
    
    // 1. 测试用户注册
    console.log('1. 测试用户注册API...');
    try {
        const registerData = {
            email: 'test@example.com',
            password: 'test123456',
            name: 'testuser'
        };
        
        const registerOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const registerResponse = await makeRequest(registerOptions, registerData);
        console.log(`注册响应状态: ${registerResponse.statusCode}`);
        console.log('注册响应内容:', JSON.stringify(registerResponse.body, null, 2));
        
        if (registerResponse.statusCode === 201 || registerResponse.statusCode === 200) {
            authToken = registerResponse.body.token;
            userId = registerResponse.body.user?.id;
            console.log('✅ 用户注册成功');
        } else {
            console.log('❌ 用户注册失败');
        }
    } catch (error) {
        console.error('❌ 注册请求失败:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试用户登录
    console.log('2. 测试用户登录API...');
    try {
        const loginData = {
            email: 'test@example.com',
            password: 'test123456'
        };
        
        const loginOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const loginResponse = await makeRequest(loginOptions, loginData);
        console.log(`登录响应状态: ${loginResponse.statusCode}`);
        console.log('登录响应内容:', JSON.stringify(loginResponse.body, null, 2));
        
        if (loginResponse.statusCode === 200) {
            authToken = loginResponse.body.token;
            console.log('✅ 用户登录成功');
        } else {
            console.log('❌ 用户登录失败');
        }
    } catch (error) {
        console.error('❌ 登录请求失败:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 如果有token，继续测试需要认证的API
    if (authToken) {
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
        
        // 3. 测试转盘API
        console.log('3. 测试转盘API功能...');
        try {
            // 获取转盘设置
            const wheelSettingsOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/wheel/settings',
                method: 'GET',
                headers: authHeaders
            };
            
            const wheelResponse = await makeRequest(wheelSettingsOptions);
            console.log(`转盘设置响应状态: ${wheelResponse.statusCode}`);
            console.log('转盘设置响应内容:', JSON.stringify(wheelResponse.body, null, 2));
            
            if (wheelResponse.statusCode === 200) {
                console.log('✅ 转盘API获取设置成功');
                
                // 测试保存转盘设置
                const saveWheelData = {
                    options: ['一等奖', '二等奖', '三等奖', '参与奖', '谢谢参与', '再来一次'],
                    theme: 'blue'
                };
                
                const saveWheelOptions = {
                    hostname: 'localhost',
                    port: 3001,
                    path: '/api/wheel/settings',
                    method: 'POST',
                    headers: authHeaders
                };
                
                const saveWheelResponse = await makeRequest(saveWheelOptions, saveWheelData);
                console.log(`保存转盘设置响应状态: ${saveWheelResponse.statusCode}`);
                
                if (saveWheelResponse.statusCode === 200) {
                    console.log('✅ 转盘API保存设置成功');
                } else {
                    console.log('❌ 转盘API保存设置失败');
                }
            } else {
                console.log('❌ 转盘API获取设置失败');
            }
        } catch (error) {
            console.error('❌ 转盘API请求失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 4. 测试邀请码API
        console.log('4. 测试邀请码API功能...');
        try {
            const inviteOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/invite/my-code',
                method: 'GET',
                headers: authHeaders
            };
            
            const inviteResponse = await makeRequest(inviteOptions);
            console.log(`邀请码响应状态: ${inviteResponse.statusCode}`);
            console.log('邀请码响应内容:', JSON.stringify(inviteResponse.body, null, 2));
            
            if (inviteResponse.statusCode === 200) {
                console.log('✅ 邀请码API成功');
            } else {
                console.log('❌ 邀请码API失败');
            }
        } catch (error) {
            console.error('❌ 邀请码API请求失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 5. 测试菜系API
        console.log('5. 测试菜系API功能...');
        try {
            const cuisineOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/cuisine/categories',
                method: 'GET',
                headers: authHeaders
            };
            
            const cuisineResponse = await makeRequest(cuisineOptions);
            console.log(`菜系API响应状态: ${cuisineResponse.statusCode}`);
            console.log('菜系API响应内容:', JSON.stringify(cuisineResponse.body, null, 2));
            
            if (cuisineResponse.statusCode === 200) {
                console.log('✅ 菜系API成功');
            } else {
                console.log('❌ 菜系API失败');
            }
        } catch (error) {
            console.error('❌ 菜系API请求失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 6. 测试笔记API
        console.log('6. 测试笔记API功能...');
        try {
            const notesOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/notes',
                method: 'GET',
                headers: authHeaders
            };
            
            const notesResponse = await makeRequest(notesOptions);
            console.log(`笔记API响应状态: ${notesResponse.statusCode}`);
            console.log('笔记API响应内容:', JSON.stringify(notesResponse.body, null, 2));
            
            if (notesResponse.statusCode === 200) {
                console.log('✅ 笔记API成功');
            } else {
                console.log('❌ 笔记API失败');
            }
        } catch (error) {
            console.error('❌ 笔记API请求失败:', error.message);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 7. 测试练习API
        console.log('7. 测试练习API功能...');
        try {
            const exercisesOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/exercises',
                method: 'GET',
                headers: authHeaders
            };
            
            const exercisesResponse = await makeRequest(exercisesOptions);
            console.log(`练习API响应状态: ${exercisesResponse.statusCode}`);
            console.log('练习API响应内容:', JSON.stringify(exercisesResponse.body, null, 2));
            
            if (exercisesResponse.statusCode === 200) {
                console.log('✅ 练习API成功');
            } else {
                console.log('❌ 练习API失败');
            }
        } catch (error) {
            console.error('❌ 练习API请求失败:', error.message);
        }
    } else {
        console.log('❌ 无法获取认证令牌，跳过需要认证的API测试');
    }
    
    console.log('\n=== API测试完成 ===');
}

// 运行测试
testAPIs().catch(console.error);