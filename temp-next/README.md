# 共享清单应用项目结构

## 项目概述

本项目是一个完整的全栈共享清单应用，包含以下核心功能：

- 用户注册与登录系统
- 共享清单的创建、查看、更新和删除
- 清单项的管理（添加、修改、标记完成、删除）
- 成员邀请功能
- 实时数据同步（基于Supabase的实时订阅）
- 响应式设计，支持多端使用

## 技术栈

### 后端
- **Node.js** - JavaScript运行环境
- **Express.js** - Web应用框架
- **Supabase** - 数据库和实时订阅服务
- **JWT** - 身份验证
- **bcrypt** - 密码加密

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑
- **LocalStorage** - 本地数据存储

## 项目结构

```
temp-next/
├── backend/                 # 后端代码
│   ├── server.js           # Express服务器入口
│   ├── middleware/         # 中间件
│   │   └── auth.js         # JWT认证中间件
│   ├── routes/             # API路由
│   │   ├── auth.js         # 认证相关路由
│   │   └── lists.js        # 共享清单相关路由
│   ├── database/           # 数据库相关
│   │   └── init.sql        # 数据库初始化脚本
│   ├── .env                # 环境变量配置
│   ├── .env.example        # 环境变量示例
│   ├── package.json        # 项目依赖
│   └── package-lock.json   # 依赖锁定文件
└── frontend/               # 前端代码
    ├── index.html          # 登录/注册页面
    ├── main.html           # 主页面
    ├── script.js           # 前端脚本
    └── styles.css          # 样式文件
```

## 快速开始

### 1. 配置Supabase

1. 访问[Supabase官网](https://supabase.com/)并创建一个新的项目
2. 在项目设置中获取以下信息：
   - Project URL
   - API Key (anon key)
   - Database Name

### 2. 配置后端

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   - 复制`.env.example`为`.env`
   - 编辑`.env`文件并填写Supabase相关信息：
     ```
     SUPABASE_URL=your-supabase-url
     SUPABASE_KEY=your-supabase-key
     JWT_SECRET=your-jwt-secret
     PORT=3001
     ```

4. 初始化数据库：
   - 在Supabase的SQL编辑器中执行`database/init.sql`脚本

### 3. 运行后端服务

```bash
npm start
```

服务器将在`http://localhost:3001`启动

### 4. 运行前端

直接在浏览器中打开`index.html`文件即可开始使用应用。

## API文档

### 认证API

#### 注册
```
POST /api/auth/register
```

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### 登录
```
POST /api/auth/login
```

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户
```
GET /api/auth/me
```

**请求头**：
```
Authorization: Bearer your-token
```

### 共享清单API

所有共享清单API都需要在请求头中包含JWT令牌。

#### 创建清单
```
POST /api/lists
```

**请求体**：
```json
{
  "name": "购物清单",
  "description": "每周购物计划"
}
```

#### 获取所有清单
```
GET /api/lists
```

#### 获取清单详情
```
GET /api/lists/:id
```

#### 更新清单
```
PUT /api/lists/:id
```

**请求体**：
```json
{
  "name": "更新的清单名称",
  "description": "更新的描述"
}
```

#### 删除清单
```
DELETE /api/lists/:id
```

#### 邀请用户
```
POST /api/lists/:id/invite
```

**请求体**：
```json
{
  "email": "friend@example.com"
}
```

### 清单项API

#### 获取清单项
```
GET /api/lists/:id/items
```

#### 创建清单项
```
POST /api/lists/:id/items
```

**请求体**：
```json
{
  "name": "牛奶",
  "description": "2升装",
  "completed": false
}
```

#### 更新清单项
```
PUT /api/lists/items/:itemId
```

**请求体**：
```json
{
  "name": "牛奶",
  "description": "1升装",
  "completed": true
}
```

#### 删除清单项
```
DELETE /api/lists/items/:itemId
```

## 数据库结构

### 用户表 (users)
- `id` (UUID) - 用户ID
- `email` (VARCHAR) - 邮箱
- `password` (VARCHAR) - 加密后的密码
- `name` (VARCHAR) - 用户名
- `created_at` (TIMESTAMP) - 创建时间
- `updated_at` (TIMESTAMP) - 更新时间

### 共享清单表 (shared_lists)
- `id` (UUID) - 清单ID
- `name` (VARCHAR) - 清单名称
- `description` (TEXT) - 描述
- `owner_id` (UUID) - 所有者ID
- `created_at` (TIMESTAMP) - 创建时间
- `updated_at` (TIMESTAMP) - 更新时间

### 清单成员表 (list_members)
- `id` (UUID) - 成员关系ID
- `list_id` (UUID) - 清单ID
- `user_id` (UUID) - 用户ID
- `role` (VARCHAR) - 角色 (owner/member)
- `created_at` (TIMESTAMP) - 创建时间

### 清单项表 (list_items)
- `id` (UUID) - 清单项ID
- `list_id` (UUID) - 所属清单ID
- `name` (VARCHAR) - 项目名称
- `description` (TEXT) - 描述
- `completed` (BOOLEAN) - 是否完成
- `created_by` (UUID) - 创建者ID
- `created_at` (TIMESTAMP) - 创建时间
- `updated_at` (TIMESTAMP) - 更新时间

## 实时订阅配置

在Supabase控制台中配置以下实时订阅规则：

1. **共享清单表**：允许订阅所有用户的清单，但只能修改自己的清单
2. **清单项表**：允许订阅和修改自己参与的清单的项目
3. **成员表**：允许订阅和修改自己参与的清单的成员信息

## 部署步骤

### 后端部署

1. 准备生产环境的环境变量
2. 选择部署平台（如Vercel、Heroku、AWS等）
3. 部署Node.js应用
4. 配置环境变量

### 前端部署

1. 将前端文件上传到静态文件服务器
2. 配置API基础URL指向后端服务
3. 确保CORS配置正确

## 安全考虑

- 使用HTTPS保护数据传输
- 密码使用bcrypt加密存储
- JWT令牌设置合理的过期时间
- 实现适当的权限控制
- 定期备份数据库

## 开发说明

### 启动开发服务器

```bash
# 后端
cd backend
npm start

# 前端
直接在浏览器中打开index.html
```

### 测试API

可以使用Postman或curl等工具测试API。

例如，使用curl测试注册功能：

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"测试用户"}'
```

### 实时功能测试

在多个浏览器窗口中登录不同账户，创建共享清单并邀请对方，测试数据的实时同步效果。

## 故障排除

### 常见问题

1. **服务器无法启动**
   - 检查端口是否被占用
   - 确认环境变量配置正确

2. **API请求失败**
   - 检查JWT令牌是否有效
   - 确认请求方法和路径是否正确
   - 查看服务器日志获取详细错误信息

3. **实时同步不工作**
   - 检查Supabase实时订阅配置
   - 确认网络连接正常

## 版本历史

- v1.0.0 (当前版本)
  - 初始版本发布
  - 完整的用户认证系统
  - 共享清单管理功能
  - 清单项管理功能
  - 成员邀请功能
  - 实时数据同步

## 未来改进

- 添加文件上传功能
- 实现清单模板
- 添加提醒功能
- 优化移动端体验
- 增加数据分析功能

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！