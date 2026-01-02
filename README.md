# 多功能应用项目

## 项目介绍

这是一个多功能Web应用，包含以下核心功能模块：

- 🎡 **转盘小游戏** - 自定义选项的随机转盘
- 🍜 **今日菜系** - 随机菜品推荐系统
- 📝 **日历记事本** - 基于日期的笔记管理
- 🏃 **今日运动** - 运动记录与提醒系统
- 🔗 **邀请码系统** - 用户邀请机制

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript
- 响应式设计，适配移动端和桌面端
- 无框架纯原生开发

### 后端
- Node.js + Express
- Neon PostgreSQL 数据库
- JWT 认证
- RESTful API 设计

## 环境配置步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 后端配置

#### 2.1 安装依赖

```bash
cd temp-next/backend
npm install
```

#### 2.2 配置环境变量

1. 复制 `.env.example` 为 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填写以下配置：
   ```env
   # Neon 数据库配置
   NEON_URL=postgresql://<username>:<password>@<neon-endpoint>/<database-name>?sslmode=require
   
   # JWT 配置
   JWT_SECRET=your-jwt-secret-key-123456
   
   # 服务器配置
   PORT=3001
   ```

#### 2.3 启动后端服务

```bash
node server.js
```

后端服务将在 `http://localhost:3001` 启动

### 3. 前端配置

前端无需额外依赖，直接在浏览器中打开 `index.html` 即可。

#### 3.1 本地开发启动

推荐使用本地服务器启动前端，以避免跨域问题：

```bash
# 在项目根目录执行
npx http-server -p 9000 -c-1 --proxy http://127.0.0.1:9000 .
```

前端页面将在 `http://localhost:9000` 访问

## Neon 数据库连接指引

### 1. 创建 Neon 数据库

1. 访问 [Neon 官网](https://neon.tech/) 注册并登录
2. 创建新的项目和数据库
3. 在 "Connection Details" 中获取连接字符串

### 2. 连接字符串格式

```
postgresql://<username>:<password>@<neon-endpoint>/<database-name>?sslmode=require
```

### 3. 数据库适配说明

- 项目已配置自动处理 Neon 数据库休眠问题的重连逻辑
- 所有数据库查询均使用参数化查询，防止 SQL 注入
- 数据库连接池配置优化，适配 Neon 的连接特性

## 双人协作 Git 操作流程

### 1. 分支管理规范

- `main` - 主分支，用于部署生产环境
- `develop` - 开发分支，用于集成所有功能开发
- `feature/xxx` - 功能分支，用于开发具体功能
- `bugfix/xxx` - Bug 修复分支，用于修复生产环境问题

### 2. 协作流程

#### 2.1 初始化流程

1. 项目负责人创建 `main` 和 `develop` 分支
2. 团队成员克隆仓库
3. 成员基于 `develop` 分支创建功能分支

#### 2.2 日常开发流程

```bash
# 1. 确保本地 develop 分支为最新
cd <project-directory>
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/<feature-name>

# 3. 开发功能，提交代码
git add .
git commit -m "feat: 实现 xxx 功能"

# 4. 推送功能分支到远程仓库
git push origin feature/<feature-name>

# 5. 在 GitHub 上创建 Pull Request，请求合并到 develop 分支
# 6. 代码评审通过后，合并到 develop 分支

# 7. 切换回 develop 分支，拉取最新代码
git checkout develop
git pull origin develop

# 8. 删除本地功能分支
git branch -d feature/<feature-name>
```

#### 2.3 部署流程

1. 确保 `develop` 分支代码稳定可用
2. 从 `develop` 分支创建 `release/<version>` 分支
3. 在 `release` 分支进行最终测试和版本号更新
4. 将 `release` 分支合并到 `main` 分支
5. 基于 `main` 分支部署生产环境
6. 将 `release` 分支合并回 `develop` 分支

### 3. Git 提交规范

提交信息应遵循以下格式：

```
<type>: <description>
```

**Type 类型包括：**
- `feat` - 新功能
- `fix` - 修复 Bug
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 代码重构
- `test` - 测试用例更新
- `chore` - 构建配置或依赖更新

**示例：**
```
feat: 添加转盘游戏自定义主题功能
fix: 修复注册页面表单验证问题
docs: 更新 README.md 中的部署步骤
```

## 项目结构

```
.
├── index.html              # 登录注册页面
├── main.html               # 主应用页面
├── exercise.html           # 运动记录页面
├── script.js               # 前端API函数库
├── styles.css              # 全局样式
├── temp-next/              # 后端目录
│   ├── backend/            # Express 应用
│   │   ├── server.js       # 服务器入口
│   │   ├── routes/         # API 路由
│   │   ├── .env.example    # 环境变量示例
│   │   └── package.json    # 后端依赖
├── .gitignore              # Git 忽略文件配置
└── README.md               # 项目文档
```

## 核心API说明

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 转盘游戏
- `GET /api/wheel/settings` - 获取转盘设置
- `POST /api/wheel/settings` - 保存转盘设置
- `GET /api/wheel/history` - 获取转盘历史记录
- `POST /api/wheel/history` - 保存转盘结果

### 今日菜系
- `GET /api/cuisine/categories` - 获取菜系分类
- `POST /api/cuisine/categories` - 保存菜系分类
- `GET /api/cuisine/random` - 获取随机菜品
- `GET /api/cuisine/history` - 获取历史记录

### 日历记事本
- `GET /api/notes` - 获取所有笔记
- `GET /api/notes/:date` - 获取特定日期笔记
- `POST /api/notes` - 保存/更新笔记
- `DELETE /api/notes/:date` - 删除笔记

### 今日运动
- `GET /api/exercises` - 获取所有运动记录
- `POST /api/exercises` - 创建运动记录
- `PUT /api/exercises/:id` - 更新运动记录
- `DELETE /api/exercises/:id` - 删除运动记录
- `GET /api/exercises/types` - 获取运动类型
- `POST /api/exercises/types` - 创建运动类型

### 邀请码系统
- `GET /api/invite/my-code` - 获取邀请码
- `POST /api/invite/bind` - 绑定邀请码

## 前端性能优化建议

1. **静态资源压缩**
   - 使用工具压缩 CSS 和 JavaScript 文件
   - 图片资源使用适当的格式和压缩比例
   - 考虑使用 CDN 加速静态资源访问

2. **代码优化**
   - 减少不必要的 DOM 操作
   - 优化 API 请求，减少请求次数
   - 使用事件委托减少事件监听器数量

3. **加载优化**
   - 实现资源懒加载
   - 使用缓存策略减少重复请求
   - 优化首屏加载速度

## 安全注意事项

1. **环境变量管理**
   - 敏感信息（数据库连接串、JWT密钥）必须放在 `.env` 文件中
   - `.env` 文件必须加入 `.gitignore`，禁止提交到代码仓库

2. **数据库安全**
   - 所有数据库查询必须使用参数化查询
   - 定期备份数据库
   - 限制数据库用户权限

3. **API 安全**
   - 所有 API 请求必须进行身份验证
   - 实现适当的请求频率限制
   - 验证所有输入参数

4. **前端安全**
   - 防止 XSS 攻击，对用户输入进行转义
   - 防止 CSRF 攻击，使用适当的防护机制
   - 不要在前端存储敏感信息

## 常见问题解决

### 1. 后端启动失败

**问题**：`Error: connect ECONNREFUSED 127.0.0.1:3001`
**解决**：检查 `.env` 文件中的端口配置，确保端口未被占用

### 2. 数据库连接失败

**问题**：`error: no pg_hba.conf entry for host`
**解决**：确保 `.env` 文件中的 NEON_URL 配置正确，包含完整的连接字符串和 sslmode=require 参数

### 3. 前端无法访问后端 API

**问题**：`Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:9000' has been blocked by CORS policy`
**解决**：检查后端 CORS 配置，确保允许前端域名访问

### 4. JWT 认证失败

**问题**：`401 Unauthorized`
**解决**：检查 localStorage 中的 token 是否存在且有效，重新登录获取新 token

## 联系方式

如有问题或建议，请联系项目负责人：

- 负责人：[Your Name]
- 邮箱：[your-email@example.com]
- GitHub：[your-github-username]

## 许可证

MIT License