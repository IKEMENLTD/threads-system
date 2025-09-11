-- 正しいパスワードハッシュで更新
-- 全てのパスワードを「password123」に統一

-- 管理者アカウント
UPDATE users SET password_hash = '$2a$10$nLGwLsfOjNij/AGm7jaTzOWxTzYLhlpRRYqd9Czzfu0mqxWqUWtAG' 
WHERE email = 'admin@threads.com';

-- ユーザー1-10
UPDATE users SET password_hash = '$2a$10$nLGwLsfOjNij/AGm7jaTzOWxTzYLhlpRRYqd9Czzfu0mqxWqUWtAG' 
WHERE email LIKE 'user%@test.com';

-- 確認用
SELECT email, username, 
       CASE 
         WHEN password_hash = '$2a$10$nLGwLsfOjNij/AGm7jaTzOWxTzYLhlpRRYqd9Czzfu0mqxWqUWtAG' 
         THEN '✅ 正しいハッシュ' 
         ELSE '❌ 無効なハッシュ' 
       END as status
FROM users 
ORDER BY username;