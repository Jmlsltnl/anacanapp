import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Users, Ban, Trash2, Eye, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_active: boolean;
  likes_count: number;
  comments_count: number;
  author?: { name: string; email: string };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  is_active: boolean;
  author?: { name: string; email: string };
}

interface BlockedUser {
  id: string;
  user_id: string;
  blocked_by: string;
  reason: string;
  block_type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  user?: { name: string; email: string };
}

const AdminModeration = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'blocks'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUserId, setBlockUserId] = useState<string>('');
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState<'community' | 'full'>('community');

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_user_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setPosts(data.map(p => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author })));
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:profiles!post_comments_user_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setComments(data.map(c => ({ ...c, author: Array.isArray(c.author) ? c.author[0] : c.author })));
    }
  };

  const fetchBlocks = async () => {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch user info for each block
      const userIds = data.map(b => b.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const blocksWithUsers = data.map(block => ({
        ...block,
        user: profiles?.find(p => p.user_id === block.user_id),
      }));
      setBlocks(blocksWithUsers);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchPosts(), fetchComments(), fetchBlocks()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deletePost = async (postId: string) => {
    if (!confirm('Bu postu silmək istəyirsiniz?')) return;

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Post silindi' });
      fetchPosts();
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Bu şərhi silmək istəyirsiniz?')) return;

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Şərh silindi' });
      fetchComments();
    }
  };

  const blockUser = async () => {
    if (!blockUserId || !blockReason) {
      toast({ title: 'Xəta', description: 'Bütün sahələri doldurun', variant: 'destructive' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        user_id: blockUserId,
        blocked_by: user.id,
        reason: blockReason,
        block_type: blockType,
        is_active: true,
      });

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'İstifadəçi bloklandı' });
      setShowBlockModal(false);
      setBlockUserId('');
      setBlockReason('');
      fetchBlocks();
    }
  };

  const unblockUser = async (blockId: string) => {
    if (!confirm('Bu istifadəçinin blokunu açmaq istəyirsiniz?')) return;

    const { error } = await supabase
      .from('user_blocks')
      .update({ is_active: false })
      .eq('id', blockId);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Blok açıldı' });
      fetchBlocks();
    }
  };

  const openBlockModal = (userId: string) => {
    setBlockUserId(userId);
    setShowBlockModal(true);
  };

  const filteredPosts = posts.filter(p => 
    p.content?.toLowerCase().includes(search.toLowerCase()) ||
    p.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredComments = comments.filter(c => 
    c.content?.toLowerCase().includes(search.toLowerCase()) ||
    c.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Moderasiya</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Postlar ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Şərhlər ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Bloklar ({blocks.filter(b => b.is_active).length})
          </TabsTrigger>
        </TabsList>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Axtar..."
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="posts" className="space-y-3">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {post.author?.name?.charAt(0) || 'İ'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{post.author?.name || 'İstifadəçi'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: az })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2 line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openBlockModal(post.user_id)}
                      >
                        <Ban className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3">
              {filteredComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {comment.author?.name?.charAt(0) || 'İ'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{comment.author?.name || 'İstifadəçi'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: az })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openBlockModal(comment.user_id)}
                      >
                        <Ban className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="blocks" className="space-y-3">
              {blocks.map((block) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card rounded-xl p-4 border ${block.is_active ? 'border-red-200' : 'border-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      block.is_active ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Ban className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{block.user?.name || 'İstifadəçi'}</span>
                        <Badge variant={block.is_active ? 'destructive' : 'secondary'}>
                          {block.is_active ? 'Aktiv' : 'Açılıb'}
                        </Badge>
                        <Badge variant="outline">{block.block_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{block.user?.email}</p>
                      <p className="text-sm text-red-600 mt-1">Səbəb: {block.reason}</p>
                    </div>
                    {block.is_active && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => unblockUser(block.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Bloku Aç
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Block User Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İstifadəçini Blokla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blok Növü</label>
              <div className="flex gap-2">
                <Button
                  variant={blockType === 'community' ? 'default' : 'outline'}
                  onClick={() => setBlockType('community')}
                  className="flex-1"
                >
                  Yalnız Community
                </Button>
                <Button
                  variant={blockType === 'full' ? 'default' : 'outline'}
                  onClick={() => setBlockType('full')}
                  className="flex-1"
                >
                  Tam Blok
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Səbəb</label>
              <Textarea 
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Bloklama səbəbini yazın..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBlockModal(false)} className="flex-1">
                Ləğv et
              </Button>
              <Button onClick={blockUser} variant="destructive" className="flex-1">
                <Ban className="w-4 h-4 mr-2" />
                Blokla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeration;
