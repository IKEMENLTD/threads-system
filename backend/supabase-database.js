const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client initialization
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Database connection test
const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) throw error;
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
};

// ========================================
// User operations
// ========================================

const users = {
    // Create user
    create: async (userData) => {
        const { email, username, passwordHash, displayName } = userData;
        const { data, error } = await supabase
            .from('users')
            .insert([{
                email,
                username,
                password_hash: passwordHash,
                display_name: displayName || username,
                role: 'user'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Find user by email
    findByEmail: async (email) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Find user by ID
    findById: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Update user
    update: async (userId, updateData) => {
        const { data, error } = await supabase
            .from('users')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ========================================
// Post operations
// ========================================

const posts = {
    // Get all posts with filters
    findAll: async (userId = null, filters = {}) => {
        let query = supabase
            .from('post_with_hashtags')
            .select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        query = query.order('created_at', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Create post
    create: async (postData) => {
        const { userId, content, title, imageUrls, status, scheduledAt, hashtags } = postData;

        // Create post
        const { data: post, error: postError } = await supabase
            .from('posts')
            .insert([{
                user_id: userId,
                title: title || '',
                content,
                image_urls: imageUrls || [],
                status: status || 'draft',
                scheduled_at: scheduledAt
            }])
            .select()
            .single();

        if (postError) throw postError;

        // Handle hashtags
        if (hashtags && hashtags.length > 0) {
            // Insert or get hashtags
            for (const tag of hashtags) {
                // Check if hashtag exists
                let { data: hashtagData, error: hashtagError } = await supabase
                    .from('hashtags')
                    .select('id')
                    .eq('name', tag)
                    .single();

                if (!hashtagData) {
                    // Create new hashtag
                    const { data: newHashtag, error: createError } = await supabase
                        .from('hashtags')
                        .insert([{ name: tag, usage_count: 1 }])
                        .select()
                        .single();

                    if (createError) throw createError;
                    hashtagData = newHashtag;
                } else {
                    // Increment usage count
                    await supabase
                        .from('hashtags')
                        .update({ usage_count: supabase.raw('usage_count + 1') })
                        .eq('id', hashtagData.id);
                }

                // Create relationship
                await supabase
                    .from('post_hashtags')
                    .insert([{
                        post_id: post.id,
                        hashtag_id: hashtagData.id
                    }]);
            }
        }

        return post;
    },

    // Update post
    update: async (postId, updateData) => {
        const { title, content, status, scheduledAt, hashtags, imageUrls } = updateData;

        // Update post
        const { data: post, error: postError } = await supabase
            .from('posts')
            .update({
                title,
                content,
                image_urls: imageUrls,
                status,
                scheduled_at: scheduledAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId)
            .select()
            .single();

        if (postError) throw postError;

        // Update hashtags if provided
        if (hashtags !== undefined) {
            // Delete existing relationships
            await supabase
                .from('post_hashtags')
                .delete()
                .eq('post_id', postId);

            // Add new hashtags
            if (hashtags && hashtags.length > 0) {
                for (const tag of hashtags) {
                    let { data: hashtagData } = await supabase
                        .from('hashtags')
                        .select('id')
                        .eq('name', tag)
                        .single();

                    if (!hashtagData) {
                        const { data: newHashtag } = await supabase
                            .from('hashtags')
                            .insert([{ name: tag, usage_count: 1 }])
                            .select()
                            .single();
                        hashtagData = newHashtag;
                    }

                    await supabase
                        .from('post_hashtags')
                        .insert([{
                            post_id: postId,
                            hashtag_id: hashtagData.id
                        }]);
                }
            }
        }

        return post;
    },

    // Delete post
    delete: async (postId) => {
        // Delete relationships first
        await supabase
            .from('post_hashtags')
            .delete()
            .eq('post_id', postId);

        // Delete post
        const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Duplicate post
    duplicate: async (postId, userId) => {
        // Get original post
        const { data: original, error: fetchError } = await supabase
            .from('post_with_hashtags')
            .select('*')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;

        // Create duplicate
        const newPost = await posts.create({
            userId,
            title: original.title + ' (コピー)',
            content: original.content,
            imageUrls: original.image_urls,
            status: 'draft',
            hashtags: original.hashtags ? original.hashtags.split(',').map(h => h.trim()) : []
        });

        return newPost;
    },

    // Get post by ID
    findById: async (postId) => {
        const { data, error } = await supabase
            .from('post_with_hashtags')
            .select('*')
            .eq('id', postId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Get scheduled posts
    getScheduledPosts: async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Update post status
    updateStatus: async (postId, status, errorMessage = null) => {
        const updateData = {
            status,
            error_message: errorMessage,
            updated_at: new Date().toISOString()
        };

        if (status === 'published') {
            updateData.published_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ========================================
// Post statistics operations
// ========================================

const postStats = {
    // Record statistics
    record: async (postId, stats) => {
        const { viewCount, likeCount, replyCount } = stats;

        const { data, error } = await supabase
            .from('post_stats')
            .insert([{
                post_id: postId,
                view_count: viewCount || 0,
                like_count: likeCount || 0,
                reply_count: replyCount || 0,
                fetched_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get latest stats
    getLatest: async (postId) => {
        const { data, error } = await supabase
            .from('post_stats')
            .select('*')
            .eq('post_id', postId)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Get stats history
    getHistory: async (postId, limit = 30) => {
        const { data, error } = await supabase
            .from('post_stats')
            .select('*')
            .eq('post_id', postId)
            .order('fetched_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
};

// ========================================
// Template operations
// ========================================

const templates = {
    // Get all templates
    findAll: async (userId) => {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create template
    create: async (templateData) => {
        const { userId, name, content, hashtags, isActive } = templateData;

        const { data, error } = await supabase
            .from('templates')
            .insert([{
                user_id: userId,
                name,
                content,
                hashtags: hashtags ? hashtags.join(', ') : '',
                is_active: isActive !== false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update template
    update: async (templateId, updateData) => {
        const { data, error } = await supabase
            .from('templates')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete template
    delete: async (templateId) => {
        const { data, error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// Initialize database
const initializeDatabase = async () => {
    try {
        console.log('🔧 Initializing Supabase database...');

        // Test connection
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Failed to initialize Supabase database');
            return false;
        }

        // Check tables
        const tables = ['users', 'posts', 'hashtags', 'post_hashtags', 'post_stats', 'templates'];
        console.log('📊 Available tables:', tables.join(', '));

        return true;
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        return false;
    }
};

module.exports = {
    supabase,
    testConnection,
    initializeDatabase,
    users,
    posts,
    postStats,
    templates
};