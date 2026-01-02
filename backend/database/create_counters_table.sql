-- 创建计数器表
CREATE TABLE IF NOT EXISTS counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 计数器类型: miaomiao-punish, miaomiao-super-punish, xuexue-punish, xuexue-super-punish
  value INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type) -- 每个用户每种类型只有一个计数器
);

-- 为计数器表添加更新时间触发器
CREATE TRIGGER update_counters_updated_at
BEFORE UPDATE ON counters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为计数器表启用 RLS
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- 计数器表的 RLS 策略
CREATE POLICY "Users can view their own counters" ON counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own counters" ON counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own counters" ON counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own counters" ON counters
  FOR DELETE USING (auth.uid() = user_id);

-- 创建一个允许被绑定用户访问邀请者计数器的策略
CREATE POLICY "Invited users can view their inviter's counters" ON counters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = counters.user_id
      AND users.id IN (
        SELECT invited_by FROM users
        WHERE users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Invited users can update their inviter's counters" ON counters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = counters.user_id
      AND users.id IN (
        SELECT invited_by FROM users
        WHERE users.id = auth.uid()
      )
    )
  );
