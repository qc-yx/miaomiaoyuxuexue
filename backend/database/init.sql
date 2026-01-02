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