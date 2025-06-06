-- Create the social_posts table
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    goal_log_id UUID NOT NULL REFERENCES goal_logs(id) ON DELETE CASCADE,
    caption TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the social_posts table
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Users can view posts from themselves and their friends/connections
CREATE POLICY "Users can view their own posts and posts from their connections"
ON social_posts
FOR SELECT
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM goal_participants 
        WHERE goal_participants.goal_id = social_posts.goal_id AND 
              goal_participants.user_id = auth.uid()
    )
);

-- Users can insert their own posts
CREATE POLICY "Users can insert their own posts"
ON social_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON social_posts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON social_posts
FOR DELETE
USING (auth.uid() = user_id); 