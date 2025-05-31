-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  profile_pic_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  color TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  goal_type TEXT CHECK (goal_type IN ('solo', 'group')),
  progress INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_participants table
CREATE TABLE goal_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, user_id)
);

-- Create goal_logs table
CREATE TABLE goal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  caption TEXT,
  date DATE NOT NULL,
  goal_day INTEGER,
  week TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_flow_state table
CREATE TABLE goal_flow_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flow_state TEXT CHECK (flow_state IN ('still', 'kindling', 'glowing', 'flowing')),
  flow_score INTEGER,
  current_period_start DATE,
  current_period_end DATE,
  current_period_logs_count INTEGER DEFAULT 0,
  required_logs_count INTEGER DEFAULT 0,
  consecutive_missed_periods INTEGER DEFAULT 0,
  last_active_date TIMESTAMP WITH TIME ZONE,
  is_skip_week BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, user_id)
);

-- Insert basic categories
INSERT INTO categories (name) VALUES
  ('Fitness'),
  ('Learning'),
  ('Wellness'),
  ('Habits'),
  ('Creative'),
  ('Productivity'),
  ('Finance'),
  ('Social'),
  ('Fun');

-- Create a trigger function to add creator as participant
CREATE OR REPLACE FUNCTION add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO goal_participants (goal_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Use SECURITY DEFINER to bypass RLS

-- Create trigger to add creator as participant when goal is created
CREATE TRIGGER add_creator_as_participant_trigger
AFTER INSERT ON goals
FOR EACH ROW
EXECUTE FUNCTION add_creator_as_participant();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_flow_states ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple RLS policies for all tables (allow all operations for authenticated users)
-- This eliminates any potential for recursion
CREATE POLICY "users_policy" ON users FOR ALL USING (true);
CREATE POLICY "friendships_policy" ON friendships FOR ALL USING (true);
CREATE POLICY "categories_policy" ON categories FOR ALL USING (true);
CREATE POLICY "goals_policy" ON goals FOR ALL USING (true);
CREATE POLICY "goal_participants_policy" ON goal_participants FOR ALL USING (true);
CREATE POLICY "goal_logs_policy" ON goal_logs FOR ALL USING (true);
CREATE POLICY "goal_flow_states_policy" ON goal_flow_states FOR ALL USING (true); 