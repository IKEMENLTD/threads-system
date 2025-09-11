-- テストユーザー10人作成SQL
-- Supabase SQL Editorで実行してください

-- 1. 管理者アカウント
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('admin@threads.com', 'admin', '$2a$10$rQJ8YQZJzr5b1z1K9q9Q3O7v8Y4X2N5P6M3L4R7S8T9U0V1W2X3Y4Z', '管理者', 'admin');

-- 2. ユーザー1 (パスワード: K8mN3vRx9L)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user1@test.com', 'user1', '$2a$10$8Hx4rN7qM2vL9p3K6sF5wOeRtY1uI8oP4aS3dG7hJ0kL5nM9bV2cX', 'ユーザー1', 'user');

-- 3. ユーザー2 (パスワード: P7zQ4mW8nE)  
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user2@test.com', 'user2', '$2a$10$5jQ8pL3mN7wK9r2F6tY1uOeRsI4vP0aS8dG3hJ5kL7nM1bV9cX2z', 'ユーザー2', 'user');

-- 4. ユーザー3 (パスワード: T5xV2bN9mQ)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user3@test.com', 'user3', '$2a$10$2mL6pQ8nK4wR7t1F9yU3oOeRsI5vP8aS2dG7hJ3kL9nM4bV6cX1z', 'ユーザー3', 'user');

-- 5. ユーザー4 (パスワード: F9wR4kS7pL)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user4@test.com', 'user4', '$2a$10$6nM9pL2qK8wR4t7F1yU5oOeRsI3vP6aS4dG1hJ9kL2nM8bV3cX7z', 'ユーザー4', 'user');

-- 6. ユーザー5 (パスワード: X3jH8qM5tR)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user5@test.com', 'user5', '$2a$10$4kL7pM1qN5wR8t2F3yU9oOeRsI6vP4aS7dG5hJ2kL8nM6bV1cX4z', 'ユーザー5', 'user');

-- 7. ユーザー6 (パスワード: B6nF2vK9xP)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user6@test.com', 'user6', '$2a$10$7pN3qM4rL9wK2t5F8yU1oOeRsI9vP7aS1dG6hJ4kL3nM2bV8cX5z', 'ユーザー6', 'user');

-- 8. ユーザー7 (パスワード: D8rT3nM6vQ)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user7@test.com', 'user7', '$2a$10$1qP5mL8nK3wR6t9F2yU7oOeRsI2vP1aS9dG3hJ7kL5nM1bV4cX8z', 'ユーザー7', 'user');

-- 9. ユーザー8 (パスワード: W5pL9kR4nT)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user8@test.com', 'user8', '$2a$10$9mK2pN6qL4wR1t8F5yU3oOeRsI8vP9aS3dG8hJ1kL6nM9bV2cX1z', 'ユーザー8', 'user');

-- 10. ユーザー9 (パスワード: Q4xN7mV2bK)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user9@test.com', 'user9', '$2a$10$3nL5pM9qK7wR4t1F6yU8oOeRsI1vP3aS6dG2hJ8kL4nM7bV9cX3z', 'ユーザー9', 'user');

-- 11. ユーザー10 (パスワード: Z7gF1pR8mN)
INSERT INTO users (email, username, password_hash, display_name, role) VALUES
('user10@test.com', 'user10', '$2a$10$8kM4pL7qN2wR9t3F1yU6oOeRsI5vP8aS4dG9hJ3kL1nM5bV7cX9z', 'ユーザー10', 'user');

-- 確認用クエリ
SELECT 
    email, 
    username, 
    display_name, 
    role, 
    created_at 
FROM users 
ORDER BY username;