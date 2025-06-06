-- Update the RLS policy for social_posts to allow friends to see posts
DROP POLICY IF EXISTS "Users can view their own posts and posts from their connections" ON social_posts;

-- Create updated policy that includes friendship relationships
CREATE POLICY "Users can view their own posts, posts from connections, and friends' posts"
ON social_posts
FOR SELECT
USING (
    -- Users can see their own posts
    auth.uid() = user_id 
    OR 
    -- Users can see posts from goal participants (for group goals)
    EXISTS (
        SELECT 1 FROM goal_participants 
        WHERE goal_participants.goal_id = social_posts.goal_id AND 
              goal_participants.user_id = auth.uid()
    )
    OR
    -- Users can see posts from accepted friends
    EXISTS (
        SELECT 1 FROM friendships
        WHERE (
            -- User is either side of the friendship
            (friendships.user_id = auth.uid() AND friendships.friend_id = social_posts.user_id)
            OR 
            (friendships.friend_id = auth.uid() AND friendships.user_id = social_posts.user_id)
        )
        AND friendships.status = 'accepted'
    )
); 