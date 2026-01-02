require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// 初始化 Express 应用
const app = express();

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Neon 数据库配置
const neonUrl = process.env.NEON_URL;
const pool = new Pool({
    connectionString: neonUrl,
    ssl: {
        rejectUnauthorized: false
    },
    // 适配 Neon 自动休眠的连接配置
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
    max: 20,
    min: 2
});

// 数据库连接重试逻辑
async function testDatabaseConnection() {
    let retries = 5;
    const retryDelay = 2000;
    
    while (retries > 0) {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('数据库连接成功');
            return true;
        } catch (error) {
            retries--;
            console.error(`数据库连接失败，剩余重试次数: ${retries}`, error.message);
            if (retries === 0) {
                console.error('数据库连接重试失败，服务将继续运行但数据库功能不可用');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

// JWT 配置
const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';

// 导出配置以便在其他文件中使用
module.exports = { app, pool, jwt, jwtSecret };

// 导入路由
const authRoutes = require('./routes/auth');
const listsRoutes = require('./routes/lists');
const notesRoutes = require('./routes/notes');
const exercisesRoutes = require('./routes/exercises');
const cuisineRoutes = require('./routes/cuisine');
const wheelRoutes = require('./routes/wheel');
const inviteRoutes = require('./routes/invite');
const countersRoutes = require('./routes/counters');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/cuisine', cuisineRoutes);
app.use('/api/wheel', wheelRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/counters', countersRoutes);

// 静态文件服务 - 提供前端文件
const path = require('path');
app.use(express.static(path.join(__dirname, '../../')));

// 处理SPA路由 - 所有非API请求都返回index.html
app.use((req, res, next) => {
    // 检查是否是API请求
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // 检查是否是静态资源请求
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
        return next();
    }
    // 否则返回index.html
    res.sendFile(path.join(__dirname, '../../', 'index.html'));
});

// 数据库表修复函数
async function fixMissingTables() {
    try {
        // 首先创建更新时间触发器函数
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 添加wheel_settings表的theme和name列
        await pool.query(`
            DO $$
            BEGIN
                -- 检查wheel_settings表是否存在，如果不存在则创建
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wheel_settings') THEN
                    CREATE TABLE wheel_settings (
                        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(100) DEFAULT '默认方案',
                        options TEXT[] NOT NULL,
                        theme VARCHAR(50) DEFAULT 'green',
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    );
                ELSE
                    -- 如果表存在，检查是否有theme列，如果没有则添加
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'wheel_settings' AND column_name = 'theme'
                    ) THEN
                        ALTER TABLE wheel_settings ADD COLUMN theme VARCHAR(50) DEFAULT 'green';
                    END IF;
                    
                    -- 检查是否有name列，如果没有则添加
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'wheel_settings' AND column_name = 'name'
                    ) THEN
                        ALTER TABLE wheel_settings ADD COLUMN name VARCHAR(100) DEFAULT '默认方案';
                    END IF;
                END IF;
            END $$;
        `);

        // 添加invited_by列到users表
        await pool.query(`
            DO $$
            BEGIN
                -- 检查users表是否有invited_by列，如果没有则添加
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'invited_by'
                ) THEN
                    ALTER TABLE users ADD COLUMN invited_by UUID REFERENCES users(id);
                END IF;
            END $$;
        `);

        // 添加username字段到users表（用于用户名认证系统）
        await pool.query(`
            DO $$
            BEGIN
                -- 检查users表是否有username列，如果没有则添加
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'username'
                ) THEN
                    -- 添加username列，设置唯一约束
                    ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
                END IF;
            END $$;
        `);

        // 将现有的email值复制到username字段
        await pool.query(`
            UPDATE users 
            SET username = email 
            WHERE email IS NOT NULL 
            AND username IS NULL
        `);

        // 确保username字段不为空
        await pool.query(`
            ALTER TABLE users ALTER COLUMN username SET NOT NULL
        `);

        // 创建邀请码表
        await pool.query(`
            DO $$
            BEGIN
                -- 检查invite_codes表是否存在，如果不存在则创建
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invite_codes') THEN
                    CREATE TABLE invite_codes (
                        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
                        code VARCHAR(20) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        used_at TIMESTAMP,
                        used_by UUID REFERENCES users(id)
                    );
                    
                    -- 为invite_codes表添加唯一约束（每个用户只能有一个邀请码）
                    ALTER TABLE invite_codes ADD CONSTRAINT unique_user_invite_code UNIQUE(created_by);
                END IF;
            END $$;
        `);

        // 创建计数器表
        await pool.query(`
            DO $$
            BEGIN
                -- 检查counters表是否存在，如果不存在则创建
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'counters') THEN
                    CREATE TABLE counters (
                        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                        user_id UUID REFERENCES users(id),
                        type VARCHAR(50) NOT NULL,
                        value INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        UNIQUE(user_id, type)
                    );
                    
                    -- 为计数器表添加更新时间触发器
                    CREATE TRIGGER update_counters_updated_at
                    BEFORE UPDATE ON counters
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                    

                END IF;
            END $$;
        `);

        // 创建运动类型表
        await pool.query(`
            DO $$
            BEGIN
                -- 检查exercise_types表是否存在，如果不存在则创建
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exercise_types') THEN
                    CREATE TABLE exercise_types (
                        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        type VARCHAR(100) NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                    
                    -- 为exercise_types表添加唯一约束（每个用户每个运动类型只能有一个）
                    ALTER TABLE exercise_types ADD CONSTRAINT unique_user_exercise_type UNIQUE(user_id, type);
                END IF;
            END $$;
        `);

        // 创建提醒设置表
        await pool.query(`
            DO $$
            BEGIN
                -- 检查reminder_settings表是否存在，如果不存在则创建
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reminder_settings') THEN
                    CREATE TABLE reminder_settings (
                        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        enabled BOOLEAN DEFAULT false,
                        time TIME NOT NULL DEFAULT '09:00',
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    );
                    
                    -- 为reminder_settings表添加唯一约束（每个用户只能有一个提醒设置）
                    ALTER TABLE reminder_settings ADD CONSTRAINT unique_user_reminder_settings UNIQUE(user_id);
                END IF;
            END $$;
        `);

        console.log('数据库表修复完成');
    } catch (error) {
        console.error('数据库表修复失败:', error);
    }
}

// 启动服务器
const PORT = process.env.PORT || 3001;

// 启动流程：先测试数据库连接，再修复数据库表，最后启动服务器
async function startServer() {
    try {
        // 测试数据库连接
        await testDatabaseConnection();
        
        // 修复数据库表
        await fixMissingTables();
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();