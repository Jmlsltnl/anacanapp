import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  author_name: string;
  author_avatar_url: string | null;
  reading_time: number;
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  category_ids?: string[]; // For multi-category support
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface BlogPostCategory {
  id: string;
  post_id: string;
  category_id: string;
  created_at: string;
}

export const useBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedPosts = (data || []) as BlogPost[];
      setPosts(typedPosts);
      setFeaturedPosts(typedPosts.filter(p => p.is_featured));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as BlogCategory[]);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
    }
  }, []);

  const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      // Increment view count using RPC function (bypasses RLS)
      if (data) {
        await supabase.rpc('increment_blog_view_count', { post_id: data.id });
      }
      
      return data as BlogPost;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  };

  const getPostsByCategory = useCallback((categorySlug: string) => {
    return posts.filter(p => p.category === categorySlug);
  }, [posts]);

  const searchPosts = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return posts.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(lowerQuery)) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }, [posts]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPosts, fetchCategories]);

  return {
    posts,
    categories,
    featuredPosts,
    loading,
    getPostBySlug,
    getPostsByCategory,
    searchPosts,
    refetch: () => Promise.all([fetchPosts(), fetchCategories()])
  };
};

// Admin hook for managing blog
export const useBlogAdmin = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [postCategories, setPostCategories] = useState<BlogPostCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (error) {
      console.error('Error fetching all posts:', error);
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as BlogCategory[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchPostCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_post_categories')
        .select('*');

      if (error) throw error;
      setPostCategories((data || []) as BlogPostCategory[]);
    } catch (error) {
      console.error('Error fetching post categories:', error);
    }
  }, []);

  // Get category IDs for a specific post
  const getPostCategoryIds = useCallback((postId: string): string[] => {
    return postCategories
      .filter(pc => pc.post_id === postId)
      .map(pc => pc.category_id);
  }, [postCategories]);

  // Set categories for a post (replace all)
  const setPostCategoriesForPost = async (postId: string, categoryIds: string[]) => {
    try {
      // First delete existing categories for this post
      await supabase
        .from('blog_post_categories')
        .delete()
        .eq('post_id', postId);

      // Then insert new categories
      if (categoryIds.length > 0) {
        const inserts = categoryIds.map(categoryId => ({
          post_id: postId,
          category_id: categoryId
        }));

        const { error } = await supabase
          .from('blog_post_categories')
          .insert(inserts);

        if (error) throw error;
      }

      await fetchPostCategories();
      return { error: null };
    } catch (error) {
      console.error('Error setting post categories:', error);
      return { error };
    }
  };

  const createPost = async (post: Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'view_count'>> & { title: string; content: string; slug: string }, categoryIds?: string[]) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      
      // If category IDs provided, set them
      if (data && categoryIds && categoryIds.length > 0) {
        await setPostCategoriesForPost(data.id, categoryIds);
      }

      await fetchAllPosts();
      return { data: data as BlogPost, error: null };
    } catch (error) {
      console.error('Error creating post:', error);
      return { data: null, error };
    }
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>, categoryIds?: string[]) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // If category IDs provided, update them
      if (categoryIds !== undefined) {
        await setPostCategoriesForPost(id, categoryIds);
      }

      await fetchAllPosts();
      return { data: data as BlogPost, error: null };
    } catch (error) {
      console.error('Error updating post:', error);
      return { data: null, error };
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllPosts();
      return { error: null };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { error };
    }
  };

  const createCategory = async (category: Omit<BlogCategory, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      await fetchAllCategories();
      return { data: data as BlogCategory, error: null };
    } catch (error) {
      console.error('Error creating category:', error);
      return { data: null, error };
    }
  };

  const updateCategory = async (id: string, updates: Partial<BlogCategory>) => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchAllCategories();
      return { data: data as BlogCategory, error: null };
    } catch (error) {
      console.error('Error updating category:', error);
      return { data: null, error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // First check if category is used
      const postsUsingCategory = postCategories.filter(pc => pc.category_id === id);
      if (postsUsingCategory.length > 0) {
        return { error: new Error(`Bu kateqoriya ${postsUsingCategory.length} məqalədə istifadə olunur. Əvvəlcə məqalələrdən çıxarın.`) };
      }

      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllCategories();
      return { error: null };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { error };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllPosts(), fetchAllCategories(), fetchPostCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAllPosts, fetchAllCategories, fetchPostCategories]);

  return {
    posts,
    categories,
    postCategories,
    loading,
    getPostCategoryIds,
    setPostCategoriesForPost,
    createPost,
    updatePost,
    deletePost,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: () => Promise.all([fetchAllPosts(), fetchAllCategories(), fetchPostCategories()])
  };
};
