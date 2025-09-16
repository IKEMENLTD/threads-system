-- ========================================
-- Supabase Initialization Script
-- ========================================
-- This file should be executed in Supabase SQL Editor
-- All comments use SQL syntax (--) not JavaScript (//)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
        CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed', 'archived');
    END IF;
END $$;

-- Supabase RLS (Row Level Security) policies
-- These ensure data security in multi-tenant environments

-- Enable RLS on users table
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Enable RLS on posts table
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own posts
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Enable RLS on analytics table
ALTER TABLE IF EXISTS analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access analytics for their own posts
CREATE POLICY "Users can view own post analytics" ON analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = analytics.post_id
            AND posts.user_id::text = auth.uid()::text
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to tables
DO $$
BEGIN
    -- Users table trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Posts table trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
        CREATE TRIGGER update_posts_updated_at
            BEFORE UPDATE ON posts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded_at ON analytics(recorded_at);

-- Insert sample data for testing (optional)
-- Comment out in production
/*
INSERT INTO users (email, username, password_hash, full_name, role)
VALUES (
    'test@example.com',
    'testuser',
    '$2b$10$example.hash.here',
    'Test User',
    'user'
) ON CONFLICT (email) DO NOTHING;
*/

-- Success message
SELECT 'Supabase initialization completed successfully!' as message;