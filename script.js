// API基础URL - 动态获取，适配不同环境
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001/api';

// 通用API请求函数
async function apiRequest(url, options = {}) {
    try {
        // 获取token
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        alert(error.message);
        throw error;
    }
}

// 共享清单API函数
const sharedListsAPI = {
    // 获取当前用户的所有清单
    async getLists() {
        return await apiRequest('/lists');
    },
    
    // 创建新清单
    async createList(name, description = '') {
        return await apiRequest('/lists', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    },
    
    // 获取清单详情
    async getListDetails(listId) {
        return await apiRequest(`/lists/${listId}`);
    },
    
    // 更新清单
    async updateList(listId, name, description = '') {
        return await apiRequest(`/lists/${listId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description })
        });
    },
    
    // 删除清单
    async deleteList(listId) {
        return await apiRequest(`/lists/${listId}`, {
            method: 'DELETE'
        });
    },
    
    // 邀请用户加入清单
    async inviteUser(listId, email) {
        return await apiRequest(`/lists/${listId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    
    // 创建清单项
    async createListItem(listId, name, description = '', completed = false) {
        return await apiRequest(`/lists/${listId}/items`, {
            method: 'POST',
            body: JSON.stringify({ name, description, completed })
        });
    },
    
    // 更新清单项
    async updateListItem(itemId, name, description = '', completed = false) {
        return await apiRequest(`/lists/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description, completed })
        });
    },
    
    // 删除清单项
    async deleteListItem(itemId) {
        return await apiRequest(`/lists/items/${itemId}`, {
            method: 'DELETE'
        });
    }
};

// 笔记API函数
const notesAPI = {
    // 获取当前用户的所有笔记
    async getNotes() {
        return await apiRequest('/notes');
    },
    
    // 获取特定日期的笔记
    async getNote(date) {
        return await apiRequest(`/notes/${date}`);
    },
    
    // 保存或更新笔记
    async saveNote(date, content) {
        return await apiRequest('/notes', {
            method: 'POST',
            body: JSON.stringify({ date, content })
        });
    },
    
    // 删除笔记
    async deleteNote(date) {
        return await apiRequest(`/notes/${date}`, {
            method: 'DELETE'
        });
    }
};

// 运动API函数
const exercisesAPI = {
    // 获取当前用户的所有运动
    async getExercises() {
        return await apiRequest('/exercises');
    },
    
    // 创建新运动
    async createExercise(name, type, duration, intensity) {
        return await apiRequest('/exercises', {
            method: 'POST',
            body: JSON.stringify({ name, type, duration, intensity })
        });
    },
    
    // 更新运动
    async updateExercise(id, name, type, duration, intensity) {
        return await apiRequest(`/exercises/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, type, duration, intensity })
        });
    },
    
    // 删除运动
    async deleteExercise(id) {
        return await apiRequest(`/exercises/${id}`, {
            method: 'DELETE'
        });
    },
    
    // 更新运动的完成状态
    async updateExerciseCompleted(id, completed) {
        return await apiRequest(`/exercises/${id}/completed`, {
            method: 'PUT',
            body: JSON.stringify({ completed })
        });
    },
    
    // 获取当前用户的所有运动类型
    async getExerciseTypes() {
        return await apiRequest('/exercises/types');
    },
    
    // 创建新的运动类型
    async createExerciseType(type) {
        return await apiRequest('/exercises/types', {
            method: 'POST',
            body: JSON.stringify({ type })
        });
    },
    
    // 获取当前用户的提醒设置
    async getReminderSettings() {
        return await apiRequest('/exercises/reminder');
    },
    
    // 创建或更新提醒设置
    async saveReminderSettings(enabled, time) {
        return await apiRequest('/exercises/reminder', {
            method: 'POST',
            body: JSON.stringify({ enabled, time })
        });
    }
};

// 转盘API函数
const wheelAPI = {
    // 获取当前用户的转盘设置
    async getWheelSettings() {
        return await apiRequest('/wheel/settings');
    },
    
    // 保存当前用户的转盘设置
    async saveWheelSettings(options, theme) {
        return await apiRequest('/wheel/settings', {
            method: 'POST',
            body: JSON.stringify({ options, theme })
        });
    },
    
    // 获取当前用户的转盘历史记录
    async getWheelHistory() {
        return await apiRequest('/wheel/history');
    },
    
    // 保存转盘游戏结果到历史记录
    async saveWheelHistory(result) {
        return await apiRequest('/wheel/history', {
            method: 'POST',
            body: JSON.stringify({ result })
        });
    }
};

// 菜系API函数
const cuisineAPI = {
    // 获取当前用户的所有菜系
    async getCategories() {
        return await apiRequest('/cuisine/categories');
    },
    
    // 保存或更新菜系
    async saveCategories(categories) {
        return await apiRequest('/cuisine/categories', {
            method: 'POST',
            body: JSON.stringify({ categories })
        });
    },
    
    // 获取随机菜品
    async getRandomDish() {
        return await apiRequest('/cuisine/random');
    },
    
    // 获取历史记录
    async getHistory() {
        return await apiRequest('/cuisine/history');
    },
    
    // 清除历史记录
    async clearHistory() {
        return await apiRequest('/cuisine/history', {
            method: 'DELETE'
        });
    },
    
    // 保存历史记录
    async saveHistory(history) {
        // 由于API只接受单个历史记录，我们需要逐个保存
        for (const item of history) {
            await apiRequest('/cuisine/history', {
                method: 'POST',
                body: JSON.stringify(item)
            });
        }
    }
};

// 邀请码API函数
const inviteAPI = {
    // 获取用户自己的邀请码
    async getMyInviteCode() {
        return await apiRequest('/invite/my-code');
    },
    
    // 绑定他人的邀请码
    async bindInviteCode(code) {
        return await apiRequest('/invite/bind', {
            method: 'POST',
            body: JSON.stringify({ code })
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
    
    // 登录表单提交处理
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        // 简单验证
        if (!username || !password) {
            alert('请填写所有必填字段');
            return;
        }
        
        try {
            // 调用登录API
            const result = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            // 存储token和用户信息到localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            console.log('登录成功:', result);
            
            // 跳转到主页面
            window.location.assign('main.html');
            
        } catch (error) {
            console.error('登录失败:', error);
            alert('登录失败: ' + error.message);
        }
    });
    }
    
    // 选项卡切换逻辑
    if (tabBtns && tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // 移除所有活动状态
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // 添加当前选项卡的活动状态
                this.classList.add('active');
                
                // 显示对应的内容
                const targetTab = this.getAttribute('data-tab');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    // 注册表单提交处理
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value;
        const name = document.getElementById('reg-name').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const inviteCode = document.getElementById('reg-invite-code').value;
        
        // 验证密码是否一致
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        // 验证密码长度
        if (password.length < 6) {
            alert('密码长度不能少于6位');
            return;
        }
        
        try {
            // 调用注册API
            const result = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ 
                    username, 
                    password, 
                    name
                })
            });
            
            console.log('注册成功:', result);
            
            alert('注册成功！');
            
            // 重置表单
            this.reset();
            
            // 自动切换到登录选项卡
            if (tabBtns && tabBtns[0]) {
                tabBtns[0].click();
            }
            
        } catch (error) {
            console.error('注册失败:', error);
            alert('注册失败: ' + error.message);
        }
    });
    }
    
    // 密码确认实时验证
    const regPassword = document.getElementById('reg-password');
    const regConfirmPassword = document.getElementById('reg-confirm-password');
    
    if (regConfirmPassword) {
        regConfirmPassword.addEventListener('input', function() {
        if (regPassword.value && this.value !== regPassword.value) {
            this.setCustomValidity('两次输入的密码不一致');
        } else {
            this.setCustomValidity('');
        }
    });
    }
    
    // 密码输入时清除确认密码的验证状态
    if (regPassword && regConfirmPassword) {
        regPassword.addEventListener('input', function() {
            regConfirmPassword.setCustomValidity('');
        });
    }
    
    // 添加表单验证的视觉反馈
    function addValidationFeedback() {
        const inputs = document.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.validity.valid) {
                    this.classList.add('valid');
                    this.classList.remove('invalid');
                } else {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                }
            });
        });
    }
    
    // 添加输入框获取焦点时的效果
    function addInputFocusEffects() {
        const inputs = document.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'translateY(-2px)';
                this.parentElement.style.transition = 'transform 0.3s ease';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'translateY(0)';
            });
        });
    }
    
    // 平滑滚动到表单
    function scrollToForm() {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // 调用函数初始化功能
    addValidationFeedback();
    addInputFocusEffects();
    
    // 页面加载后滚动到表单
    setTimeout(scrollToForm, 100);
    
    // 处理Chrome devtools调试文件的404错误
    if (window.location.pathname.includes('.well-known/appspecific/com.chrome.devtools.json')) {
        console.log('Chrome devtools调试文件请求被忽略');
        return;
    }
});
