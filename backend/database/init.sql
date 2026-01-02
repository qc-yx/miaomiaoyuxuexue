-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建共享清单表
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建清单项目表
CREATE TABLE IF NOT EXISTS list_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shared_lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建清单成员表（用于管理谁可以访问哪个清单）
CREATE TABLE IF NOT EXISTS list_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shared_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'owner' or 'member'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- 为所有表启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

-- 用户表的 RLS 策略
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- 共享清单表的 RLS 策略
CREATE POLICY "Users can view shared lists they are members of" ON shared_lists
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM list_members
    WHERE list_members.list_id = shared_lists.id
    AND list_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create lists" ON shared_lists
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own lists" ON shared_lists
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own lists" ON shared_lists
  FOR DELETE USING (auth.uid() = owner_id);

-- 清单项目表的 RLS 策略
CREATE POLICY "Users can view items in lists they are members of" ON list_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM list_members
    JOIN shared_lists ON list_members.list_id = shared_lists.id
    WHERE list_items.list_id = shared_lists.id
    AND list_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create items in lists they are members of" ON list_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM list_members
    WHERE list_members.list_id = list_items.list_id
    AND list_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in lists they are members of" ON list_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM list_members
    WHERE list_members.list_id = list_items.list_id
    AND list_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items in lists they are members of" ON list_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM list_members
    WHERE list_members.list_id = list_items.list_id
    AND list_members.user_id = auth.uid()
  ));

-- 清单成员表的 RLS 策略
CREATE POLICY "Users can view list members" ON list_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Users can add list members" ON list_members
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Users can remove list members" ON list_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));

-- 创建菜系分类表
CREATE TABLE IF NOT EXISTS cuisine_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建菜品表
CREATE TABLE IF NOT EXISTS dishes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES cuisine_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建菜系历史记录表
CREATE TABLE IF NOT EXISTS cuisine_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  time VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 为菜系相关表启用 RLS
ALTER TABLE cuisine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisine_history ENABLE ROW LEVEL SECURITY;

-- 菜系分类表的 RLS 策略
CREATE POLICY "Users can view their own cuisine categories" ON cuisine_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuisine categories" ON cuisine_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuisine categories" ON cuisine_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuisine categories" ON cuisine_categories
  FOR DELETE USING (auth.uid() = user_id);

-- 菜品表的 RLS 策略
CREATE POLICY "Users can view their own dishes" ON dishes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM cuisine_categories
    WHERE cuisine_categories.id = dishes.category_id
    AND cuisine_categories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create dishes in their own categories" ON dishes
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM cuisine_categories
    WHERE cuisine_categories.id = dishes.category_id
    AND cuisine_categories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own dishes" ON dishes
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM cuisine_categories
    WHERE cuisine_categories.id = dishes.category_id
    AND cuisine_categories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own dishes" ON dishes
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM cuisine_categories
    WHERE cuisine_categories.id = dishes.category_id
    AND cuisine_categories.user_id = auth.uid()
  ));

-- 菜系历史记录表的 RLS 策略
CREATE POLICY "Users can view their own cuisine history" ON cuisine_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuisine history" ON cuisine_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuisine history" ON cuisine_history
  FOR DELETE USING (auth.uid() = user_id);

-- 创建运动表
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  intensity VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建运动类型表
CREATE TABLE IF NOT EXISTS exercise_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- 创建提醒设置表
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  time VARCHAR(5) NOT NULL, -- 格式为 HH:MM
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 为运动表启用 RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

-- 运动表的 RLS 策略
CREATE POLICY "Users can view their own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- 运动类型表的 RLS 策略
CREATE POLICY "Users can view their own exercise types" ON exercise_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise types" ON exercise_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise types" ON exercise_types
  FOR DELETE USING (auth.uid() = user_id);

-- 提醒设置表的 RLS 策略
CREATE POLICY "Users can view their own reminder settings" ON reminder_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminder settings" ON reminder_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings" ON reminder_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 为笔记表启用 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 笔记表的 RLS 策略
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 为笔记表添加更新时间触发器
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建 JWT 认证策略
CREATE OR REPLACE FUNCTION check_user_role() RETURNS TRIGGER AS $$
BEGIN
  -- 这里可以添加自定义的角色检查逻辑
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为用户表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为共享清单表添加更新时间触发器
CREATE TRIGGER update_shared_lists_updated_at
BEFORE UPDATE ON shared_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为清单项目表添加更新时间触发器
CREATE TRIGGER update_list_items_updated_at
BEFORE UPDATE ON list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为运动表添加更新时间触发器
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为提醒设置表添加更新时间触发器
CREATE TRIGGER update_reminder_settings_updated_at
BEFORE UPDATE ON reminder_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建笔记表
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- 格式为 YYYY-MM-DD
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE POLICY "Users can view members of lists they are members of" ON list_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM list_members AS lm
    WHERE lm.list_id = list_members.list_id
    AND lm.user_id = auth.uid()
  ));

CREATE POLICY "Users can add members to lists they own" ON list_members
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update member roles in lists they own" ON list_members
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));

CREATE POLICY "Users can remove members from lists they own" ON list_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM shared_lists
    WHERE shared_lists.id = list_members.list_id
    AND shared_lists.owner_id = auth.uid()
  ));