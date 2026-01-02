// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

// 通用API请求函数
async function apiRequest(url, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        });
        if (!response.ok) {
            throw new Error('请求失败');
        }
        return await response.json();
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 认证API函数
const authAPI = {
    // 用户注册
    async register(username, password, inviteCode = '') {
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: username, password, invite_code: inviteCode })
        });
    },

    // 用户登录
    async login(username, password) {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: username, password })
        });
    }
};

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // 选项卡切换功能
    if (tabBtns && tabContents) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // 移除所有激活状态
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // 添加当前激活状态
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
    
    // 登录表单提交处理
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            if (!username || !password) {
                alert('请填写所有必填字段');
                return;
            }
            
            try {
                const result = await authAPI.login(username, password);
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                window.location.assign('main.html');
            } catch (error) {
                console.error('登录失败:', error);
                alert('登录失败，请检查用户名和密码');
            }
        });
    }
    
    // 注册表单提交处理
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const inviteCode = document.getElementById('reg-invite-code').value;
            
            if (password !== confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }
            
            if (password.length < 6) {
                alert('密码长度不能少于6位');
                return;
            }
            
            try {
                await authAPI.register(username, password, inviteCode);
                alert('注册成功！');
                this.reset();
                
                // 自动切换到登录选项卡
                if (tabBtns && tabBtns[0]) {
                    tabBtns[0].click();
                }
            } catch (error) {
                console.error('注册失败:', error);
                alert('注册失败，请稍后重试');
            }
        });
    }
});