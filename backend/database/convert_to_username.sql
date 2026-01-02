-- 为users表添加username字段
DO $$
BEGIN
    -- 检查users表是否有username列，如果没有则添加
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        -- 添加username列，设置唯一约束
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        
        -- 将现有的email值复制到username字段（如果email不为空）
        UPDATE users SET username = email WHERE email IS NOT NULL;
        
        -- 确保username字段不为空
        ALTER TABLE users ALTER COLUMN username SET NOT NULL;
    END IF;
END $$;

-- 更新RLS策略以适应新的username字段
-- 注意：RLS策略在迁移中可能需要额外调整，这里我们主要处理schema