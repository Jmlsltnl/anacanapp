import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Clock, Eye, ChevronRight, 
  BookOpen, Sparkles, Bookmark, Heart, TrendingUp,
  Filter, Star
} from 'lucide-react';
import { useBlog, BlogPost, BlogCategory } from '@/hooks/useBlog';
import { useSavedPosts } from '@/hooks/useBlogInteractions';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import BlogPostDetail from '@/components/blog/BlogPostDetail';

interface BlogScreenProps {
  onBack: () => void;
}

const BlogScreen = ({ onBack }: BlogScreenProps) => {
  useScrollToTop();
  
  const { user } = useAuth();
  const { posts, categories, featuredPosts, loading, searchPosts, getPostsByCategory } = useBlog();
  const { savedPosts } = useSavedPosts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const savedPostsList = posts.filter(p => savedPosts.includes(p.id));

  const filteredPosts = showSaved 
    ? savedPostsList
    : searchQuery 
      ? searchPosts(searchQuery)
      : selectedCategory 
        ? getPostsByCategory(selectedCategory)
        : posts;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Məqalələr yüklənir...</p>
        </div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <BlogPostDetail 
        post={selectedPost} 
        categories={categories}
        allPosts={posts}
        onBack={() => setSelectedPost(null)}
        onSelectPost={(post) => setSelectedPost(post)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-5 right-10 w-40 h-40 rounded-full bg-pink-300/20 blur-3xl" />
        </div>
        
        <div className="relative px-4 pt-4 pb-8 safe-area-top z-20">
          <div className="flex items-center gap-3 mb-4 relative z-20">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Ana Bloqu</h1>
              <p className="text-white/80 text-sm">{posts.length} faydalı məqalə</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSaved(false);
              }}
              placeholder="Məqalə axtar..."
              className="pl-12 h-12 rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-md border-0 shadow-lg text-base"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-2xl font-black text-white">{posts.length}</p>
              <p className="text-xs text-white/70">Məqalə</p>
            </motion.div>
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-2xl font-black text-white">{categories.length}</p>
              <p className="text-xs text-white/70">Kateqoriya</p>
            </motion.div>
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-2xl font-black text-white">{savedPosts.length}</p>
              <p className="text-xs text-white/70">Saxlanılmış</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Categories */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            onClick={() => { setSelectedCategory(null); setShowSaved(false); }}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              !selectedCategory && !showSaved
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                : 'bg-card text-foreground border border-border/50'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            Hamısı
          </motion.button>

          {user && (
            <motion.button
              onClick={() => { setShowSaved(true); setSelectedCategory(null); setSearchQuery(''); }}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                showSaved 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-card text-foreground border border-border/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark className="w-4 h-4" />
              Saxlanılanlar
              {savedPosts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{savedPosts.length}</span>
              )}
            </motion.button>
          )}

          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => { setSelectedCategory(category.slug); setShowSaved(false); }}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                selectedCategory === category.slug && !showSaved
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30' 
                  : 'bg-card text-foreground border border-border/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </motion.div>

        {/* Featured Posts */}
        {!selectedCategory && !searchQuery && !showSaved && featuredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-foreground">Önə Çıxan</h2>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.1 }}
                  onClick={() => setSelectedPost(post)}
                  className="shrink-0 w-72 bg-card rounded-2xl overflow-hidden shadow-lg border border-border/50 text-left group"
                >
                  <div className="relative">
                    {post.cover_image_url ? (
                      <img 
                        src={post.cover_image_url} 
                        alt={post.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Seçilmiş
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge variant="secondary" className="bg-white/90 dark:bg-card/90 text-foreground border-0 text-xs">
                        {categories.find(c => c.slug === post.category)?.icon} {categories.find(c => c.slug === post.category)?.name || post.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground line-clamp-2 mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_time} dəq
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-foreground">
                {showSaved 
                  ? 'Saxlanılan Məqalələr'
                  : selectedCategory 
                    ? categories.find(c => c.slug === selectedCategory)?.name 
                    : searchQuery 
                      ? `"${searchQuery}" üçün nəticələr` 
                      : 'Bütün Məqalələr'
                }
              </h2>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {filteredPosts.length} məqalə
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1">
                {showSaved ? 'Saxlanılmış məqalə yoxdur' : 'Məqalə tapılmadı'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {showSaved 
                  ? 'Bəyəndiyiniz məqalələri saxlayın' 
                  : searchQuery 
                    ? 'Fərqli açar sözlərlə axtarın' 
                    : 'Tezliklə yeni məqalələr əlavə olunacaq'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post, index) => (
                <motion.button
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.03 }}
                  onClick={() => setSelectedPost(post)}
                  className="w-full bg-card rounded-2xl p-3 flex gap-4 shadow-sm border border-border/50 text-left hover:shadow-md transition-all group"
                >
                  <div className="relative shrink-0">
                    {post.cover_image_url ? (
                      <img 
                        src={post.cover_image_url} 
                        alt={post.title}
                        className="w-24 h-24 rounded-xl object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    {savedPosts.includes(post.id) && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Bookmark className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <Badge variant="secondary" className="mb-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 text-xs">
                        {categories.find(c => c.slug === post.category)?.icon} {categories.find(c => c.slug === post.category)?.name || post.category}
                      </Badge>
                      <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight">{post.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.reading_time} dəq
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 self-center">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BlogScreen;
