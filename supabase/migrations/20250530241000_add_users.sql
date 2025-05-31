-- Add the user that's trying to create goals
INSERT INTO users (id, name, username, email, profile_pic_url) 
VALUES 
('66072573-c089-4e76-9f41-22fcb08614bf', 'Test User', 'testuser', 'test@example.com', 'https://randomuser.me/api/portraits/men/1.jpg');

-- Add some sample friends for testing
INSERT INTO users (id, name, username, email, profile_pic_url) 
VALUES 
('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'Friend 1', 'friend1', 'friend1@example.com', 'https://randomuser.me/api/portraits/women/1.jpg'),
('b2c3d4e5-f6a1-5b2c-9d3e-4f5a6b7c8d9e', 'Friend 2', 'friend2', 'friend2@example.com', 'https://randomuser.me/api/portraits/men/2.jpg'),
('c3d4e5f6-a1b2-6c3d-0e4f-5a6b7c8d9e0f', 'Friend 3', 'friend3', 'friend3@example.com', 'https://randomuser.me/api/portraits/women/3.jpg');

-- Create some friendships
INSERT INTO friendships (user_id, friend_id, status) 
VALUES 
('66072573-c089-4e76-9f41-22fcb08614bf', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'accepted'),
('66072573-c089-4e76-9f41-22fcb08614bf', 'b2c3d4e5-f6a1-5b2c-9d3e-4f5a6b7c8d9e', 'accepted'),
('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', '66072573-c089-4e76-9f41-22fcb08614bf', 'accepted'),
('b2c3d4e5-f6a1-5b2c-9d3e-4f5a6b7c8d9e', '66072573-c089-4e76-9f41-22fcb08614bf', 'accepted'); 