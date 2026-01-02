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