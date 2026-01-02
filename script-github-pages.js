// GitHub Pages 版本 - 连接真实后端API
// 使用后端API存储数据，删除降级本地存储

// 真实API基础URL - 替换为实际的后端API地址
const API_BASE_URL = 'http://localhost:3001/api';

// 检查是否有token
function getToken() {
    return localStorage.getItem('token');
}

// 真实API请求函数
async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'API请求失败');
    }
    
    return data;
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
    
    // 更新运动状态
    async updateExerciseStatus(id, completed) {
        return await apiRequest(`/exercises/${id}/completed`, {
            method: 'PUT',
            body: JSON.stringify({ completed })
        });
    },
    
    // 删除运动
    async deleteExercise(id) {
        return await apiRequest(`/exercises/${id}`, {
            method: 'DELETE'
        });
    },
    
    // 获取运动类型列表
    async getExerciseTypes() {
        return await apiRequest('/exercises/types');
    },
    
    // 创建运动类型
    async createExerciseType(type) {
        return await apiRequest('/exercises/types', {
            method: 'POST',
            body: JSON.stringify({ type })
        });
    },
    
    // 获取提醒设置
    async getReminderSettings() {
        return await apiRequest('/exercises/reminder');
    },
    
    // 更新提醒设置
    async updateReminderSettings(settings) {
        return await apiRequest('/exercises/reminder', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
};

// 饮食API函数
const cuisineAPI = {
    // 获取当前用户的所有饮食记录
    async getCuisines() {
        return await apiRequest('/cuisine');
    },
    
    // 创建新饮食记录
    async createCuisine(name, type, calories, date) {
        return await apiRequest('/cuisine', {
            method: 'POST',
            body: JSON.stringify({ name, type, calories, date })
        });
    },
    
    // 更新饮食记录
    async updateCuisine(id, name, type, calories, date) {
        return await apiRequest(`/cuisine/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, type, calories, date })
        });
    },
    
    // 删除饮食记录
    async deleteCuisine(id) {
        return await apiRequest(`/cuisine/${id}`, {
            method: 'DELETE'
        });
    },
    
    // 获取菜系分类
    async getCategories() {
        return await apiRequest('/cuisine/categories');
    },
    
    // 添加菜系分类
    async addCategory(category) {
        return await apiRequest('/cuisine/categories', {
            method: 'POST',
            body: JSON.stringify({ category })
        });
    },
    
    // 删除菜系分类
    async deleteCategory(category) {
        return await apiRequest(`/cuisine/categories/${category}`, {
            method: 'DELETE'
        });
    },
    
    // 保存或更新菜系分类
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

// 转盘API函数
const wheelAPI = {
    // 获取当前用户的所有转盘方案
    async getAllWheelSettings() {
        return await apiRequest('/wheel/settings');
    },
    
    // 获取指定ID的转盘方案
    async getWheelSettings(id) {
        return await apiRequest(`/wheel/settings/${id}`);
    },
    
    // 保存或更新转盘方案
    async saveWheelSettings(id, name, options, theme) {
        return await apiRequest('/wheel/settings', {
            method: 'POST',
            body: JSON.stringify({ id, name, options, theme })
        });
    },
    
    // 删除转盘方案
    async deleteWheelSettings(id) {
        return await apiRequest(`/wheel/settings/${id}`, {
            method: 'DELETE'
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

// 计数器API函数
const countersAPI = {
    // 获取所有计数器
    async getCounters() {
        return await apiRequest('/counters');
    },
    
    // 更新计数器
    async updateCounter(type, operation) {
        return await apiRequest('/counters/update', {
            method: 'POST',
            body: JSON.stringify({ type, operation })
        });
    },
    
    // 重置所有计数器
    async resetAllCounters() {
        return await apiRequest('/counters/reset', {
            method: 'POST'
        });
    }
};

// 邀请API函数
const inviteAPI = {
    // 获取我的邀请码
    async getMyInviteCode() {
        return await apiRequest('/invite/my-code');
    },
    
    // 使用邀请码
    async useInviteCode(code) {
        return await this.bindInviteCode(code);
    },
    
    // 绑定邀请码
    async bindInviteCode(code) {
        return await apiRequest('/invite/bind', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }
};

// 认证相关函数
const authAPI = {
    // 登录
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');
        } else {
            throw new Error(data.message || '登录失败');
        }
        
        return data;
    },
    
    // 注册
    async register(username, password, name, inviteCode = '') {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, name, inviteCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');
        } else {
            throw new Error(data.message || '注册失败');
        }
        
        return data;
    },
    
    // 检查登录状态
    isLoggedIn() {
        return !!getToken();
    },
    
    // 获取当前用户
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // 退出登录
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        return { success: true };
    }
};

// 全局API对象
window.sharedListsAPI = sharedListsAPI;
window.notesAPI = notesAPI;
window.exercisesAPI = exercisesAPI;
window.cuisineAPI = cuisineAPI;
window.wheelAPI = wheelAPI;
window.countersAPI = countersAPI;
window.inviteAPI = inviteAPI;
window.authAPI = authAPI;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    // 获取当前页面的文件名
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 1. 检查登录状态 - 只在登录/注册页面(index.html)中执行
    if (currentPage === 'index.html') {
        if (authAPI.isLoggedIn()) {
            // 如果已登录，跳转到main.html
            window.location.href = 'main.html';
            return;
        }
        
        // 2. 选项卡切换功能
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // 移除所有活动状态
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // 添加当前活动状态
                btn.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });
        
        // 3. 登录表单处理
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(loginForm);
                const username = formData.get('username');
                const password = formData.get('password');
                
                try {
                    const result = await authAPI.login(username, password);
                    alert('登录成功！');
                    window.location.href = 'main.html';
                } catch (error) {
                    console.error('登录错误:', error);
                    alert('登录失败，请稍后重试！');
                }
            });
        }
        
        // 4. 注册表单处理
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(registerForm);
                const username = formData.get('username');
                const password = formData.get('password');
                const confirmPassword = formData.get('confirmPassword');
                const name = formData.get('name');
                const inviteCode = formData.get('inviteCode');
                
                // 验证密码一致性
                if (password !== confirmPassword) {
                    alert('两次输入的密码不一致！');
                    return;
                }
                
                try {
                    const result = await authAPI.register(username, password, name, inviteCode);
                    alert('注册成功！');
                    window.location.href = 'main.html';
                } catch (error) {
                    console.error('注册错误:', error);
                    alert('注册失败，请稍后重试！');
                }
            });
        }
    } else {
        // 非登录页面，检查登录状态
        if (!authAPI.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }
    }
});