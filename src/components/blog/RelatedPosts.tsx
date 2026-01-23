import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { BlogPost } from '@/hooks/useBlog';

interface RelatedPostsProps {
  currentPost: BlogPost;
  allPosts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
}

const RelatedPosts = ({ currentPost, allPosts, onSelectPost }: RelatedPostsProps) => {
  // Find related posts based on category and tags
  const getRelatedPosts = () => {
    const scored = allPosts
      .filter(post => post.id !== currentPost.id && post.is_published)
      .map(post => {
        let score = 0;
        
        // Same category = +3 points
        if (post.category === currentPost.category) {
          score += 3;
        }
        
        // Matching tags = +1 point each
        const currentTags = currentPost.tags || [];
        const postTags = post.tags || [];
        const matchingTags = currentTags.filter(tag => 
          postTags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
        score += matchingTags.length;
        
        // Same author = +1 point
        if (post.author_name === currentPost.author_name) {
          score += 1;
        }
        
        return { post, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(item => item.post);
    
    // If not enough related posts, add recent posts
    if (scored.length < 3) {
      const recentPosts = allPosts
        .filter(post => 
          post.id !== currentPost.id && 
          post.is_published &&
          !scored.some(s => s.id === post.id)
        )
        .slice(0, 3 - scored.length);
      
      return [...scored, ...recentPosts];
    }
    
    return scored;
  };

  const relatedPosts = getRelatedPosts();

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        📚 Oxşar Məqalələr
      </h3>
      
      <div className="space-y-3">
        {relatedPosts.map((post, index) => (
          <motion.button
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="w-full bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
          >
            {post.cover_image_url ? (
              <img 
                src={post.cover_image_url} 
                alt={post.title}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl">📖</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                {post.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{post.reading_time} dəq</span>
                <span>•</span>
                <span>{post.view_count} baxış</span>
              </div>
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
