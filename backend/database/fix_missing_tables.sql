-- 添加wheel_settings表的theme列
DO $$
BEGIN
    -- 检查wheel_settings表是否存在，如果不存在则创建
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wheel_settings') THEN
        CREATE TABLE wheel_settings (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    END IF;
END $$;

-- 创建邀请码表
DO $$
BEGIN
    -- 检查invite_codes表是否存在，如果不存在则创建
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invite_codes') THEN
        CREATE TABLE invite_codes (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(20) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            used_at TIMESTAMP,
            used_by UUID REFERENCES users(id)
        );
        
        -- 为invite_codes表添加唯一约束（每个用户只能有一个邀请码）
        ALTER TABLE invite_codes ADD CONSTRAINT unique_user_invite_code UNIQUE(created_by);
        
        -- 为invite_codes表启用RLS
        ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
        
        -- 创建RLS策略
        CREATE POLICY "Users can view their own invite codes" ON invite_codes
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own invite codes" ON invite_codes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own invite codes" ON invite_codes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 添加invited_by列到users表
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