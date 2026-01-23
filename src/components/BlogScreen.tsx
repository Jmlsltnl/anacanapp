import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Clock, Eye, ChevronRight, 
  BookOpen, Sparkles, Heart, Bookmark
} from 'lucide-react';
import { useBlog, BlogPost, BlogCategory } from '@/hooks/useBlog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import BlogPostDetail from '@/components/blog/BlogPostDetail';

interface BlogScreenProps {
  onBack: () => void;
}

const BlogScreen = ({ onBack }: BlogScreenProps) => {
  const { posts, categories, featuredPosts, loading, searchPosts, getPostsByCategory } = useBlog();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const filteredPosts = searchQuery 
    ? searchPosts(searchQuery)
    : selectedCategory 
      ? getPostsByCategory(selectedCategory)
      : posts;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Post detail view
  if (selectedPost) {
    return (
      <BlogPostDetail 
        post={selectedPost} 
        categories={categories} 
        onBack={() => setSelectedPost(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Bloq</h1>
            <p className="text-white/80 text-sm">Faydalı məqalələr</p>
          </div>
          <BookOpen className="w-8 h-8 text-white/80" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Məqalə axtar..."
            className="pl-12 h-12 rounded-2xl bg-white/90 border-0"
          />
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCategory 
                ? 'bg-primary text-white shadow-button' 
                : 'bg-card text-foreground border border-border/50'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Hamısı
          </motion.button>
          {categories.map(category => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category.slug 
                  ? 'bg-primary text-white shadow-button' 
                  : 'bg-card text-foreground border border-border/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </div>

        {/* Featured Posts */}
        {!selectedCategory && !searchQuery && featuredPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Önə çıxan</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPost(post)}
                  className="shrink-0 w-72 bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 text-left"
                >
                  {post.cover_image_url ? (
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 gradient-primary flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-0 text-xs">
                      {categories.find(c => c.slug === post.category)?.name || post.category}
                    </Badge>
                    <h3 className="font-bold text-foreground line-clamp-2">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{post.reading_time} dəq</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="font-bold text-foreground mb-3">
            {selectedCategory 
              ? categories.find(c => c.slug === selectedCategory)?.name 
              : searchQuery 
                ? `"${searchQuery}" üçün nəticələr` 
                : 'Son məqalələr'
            }
          </h2>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-muted-foreground">Məqalə tapılmadı</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Fərqli açar sözlərlə axtarın' : 'Tezliklə yeni məqalələr əlavə olunacaq'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post, index) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPost(post)}
                  className="w-full bg-card rounded-2xl p-4 flex gap-4 shadow-card border border-border/50 text-left"
                >
                  {post.cover_image_url ? (
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <BookOpen className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-1 bg-primary/10 text-primary border-0 text-xs">
                      {categories.find(c => c.slug === post.category)?.name || post.category}
                    </Badge>
                    <h3 className="font-bold text-foreground line-clamp-2 mb-1">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.reading_time} dəq</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.view_count}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogScreen;
