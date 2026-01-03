const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testDataSharingUnique() {
    console.log('🧪 开始测试数据共享功能（使用唯一用户名）...\n');

    // 生成唯一用户名
    const timestamp = Date.now();
    const user1Username = `inviter_${timestamp}`;
    const user2Username = `invited_${timestamp}`;

    try {
        // 1. 创建邀请者用户（用户1）
        console.log('📝 步骤1: 创建邀请者用户...');
        const user1Response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            username: user1Username,
            password: '123456',
            name: 'Inviter Test'
        });
        console.log('✅ 邀请者用户创建成功');
        const user1Token = user1Response.data.token;
        const user1Id = user1Response.data.user.id;
        console.log(`👤 邀请者用户ID: ${user1Id}\n`);

        // 2. 创建邀请码
        console.log('📝 步骤2: 创建邀请码...');
        const inviteCodeResponse = await axios.post(`${API_BASE_URL}/api/invite/create`, {}, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });
        console.log('✅ 邀请码创建成功');
        const inviteCode = inviteCodeResponse.data.code;
        console.log(`🔗 邀请码: ${inviteCode}\n`);

        // 3. 创建被邀请者用户（用户2）
        console.log('📝 步骤3: 创建被邀请者用户...');
        const user2Response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            username: user2Username,
            password: '123456',
            name: 'Invited Test'
        });
        console.log('✅ 被邀请者用户创建成功');
        const user2Token = user2Response.data.token;
        const user2Id = user2Response.data.user.id;
        console.log(`👤 被邀请者用户ID: ${user2Id}\n`);

        // 4. 绑定邀请码
        console.log('📝 步骤4: 绑定邀请码...');
        await axios.post(`${API_BASE_URL}/api/invite/bind`, {
            code: inviteCode
        }, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });
        console.log('✅ 邀请码绑定成功\n');

        // 5. 邀请者设置转盘数据
        console.log('📝 步骤5: 邀请者设置转盘数据...');
        const wheelOptions = ['测试选项1', '测试选项2', '测试选项3', '测试选项4'];
        const wheelTheme = 'blue';
        
        await axios.post(`${API_BASE_URL}/api/wheel/settings`, {
            options: wheelOptions,
            theme: wheelTheme
        }, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });
        console.log('✅ 邀请者转盘设置完成\n');

        // 6. 测试邀请者获取数据
        console.log('📝 步骤6: 测试邀请者获取数据...');
        const user1Settings = await axios.get(`${API_BASE_URL}/api/wheel/settings`, {
            headers: { Authorization: `Bearer ${user1Token}` }
        });
        console.log('📊 邀请者数据:', {
            options: user1Settings.data.options,
            theme: user1Settings.data.theme,
            isShared: user1Settings.data.isShared,
            dataUserId: user1Settings.data.dataUserId
        });
        console.log(`✅ 邀请者获取数据成功，isShared: ${user1Settings.data.isShared}\n`);

        // 7. 测试被邀请者获取数据（应该共享邀请者的数据）
        console.log('📝 步骤7: 测试被邀请者获取数据...');
        const user2Settings = await axios.get(`${API_BASE_URL}/api/wheel/settings`, {
            headers: { Authorization: `Bearer ${user2Token}` }
        });
        console.log('📊 被邀请者数据:', {
            options: user2Settings.data.options,
            theme: user2Settings.data.theme,
            isShared: user2Settings.data.isShared,
            dataUserId: user2Settings.data.dataUserId
        });
        console.log(`✅ 被邀请者获取数据成功，isShared: ${user2Settings.data.isShared}\n`);

        // 8. 验证数据共享
        console.log('📝 步骤8: 验证数据共享...');
        const dataMatches = JSON.stringify(user1Settings.data.options) === JSON.stringify(user2Settings.data.options) &&
                           user1Settings.data.theme === user2Settings.data.theme &&
                           user1Settings.data.dataUserId === user2Settings.data.dataUserId;
        
        const sharedCorrectly = user1Settings.data.isShared === false && user2Settings.data.isShared === true;
        
        console.log(`📈 数据匹配检查: ${dataMatches ? '✅ 通过' : '❌ 失败'}`);
        console.log(`📈 共享标记检查: ${sharedCorrectly ? '✅ 通过' : '❌ 失败'}`);
        console.log(`📈 邀请者dataUserId: ${user1Settings.data.dataUserId}`);
        console.log(`📈 被邀请者dataUserId: ${user2Settings.data.dataUserId}`);
        
        if (dataMatches && sharedCorrectly) {
            console.log('\n🎉 数据共享功能测试全部通过！');
            console.log('✅ 邀请者和被邀请者看到相同的数据');
            console.log('✅ 被邀请者的isShared标志正确设置为true');
            console.log('✅ 两个用户使用相同的dataUserId（邀请者的ID）');
            console.log('✅ 数据共享功能正常工作！');
        } else {
            console.log('\n❌ 数据共享功能测试失败！');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers
        });
        process.exit(1);
    }
}

testDataSharingUnique();