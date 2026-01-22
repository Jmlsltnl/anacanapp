import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Ban, Trash2, AlertTriangle, Check, Flag, XCircle, CheckCircle } from 'lucide-react';
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

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  post?: { content: string; user_id: string };
  reporter?: { name: string };
}

const AdminModeration = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'reports' | 'posts' | 'comments' | 'blocks'>('reports');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockUserId, setBlockUserId] = useState<string>('');
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState<'community' | 'full'>('community');

  const fetchReports = async () => {
    // Use type assertion for new table not yet in generated types
    const { data, error } = await (supabase as any)
      .from('post_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch post info and reporter names
      const postIds = [...new Set(data.map((r: any) => r.post_id))];
      const reporterIds = [...new Set(data.map((r: any) => r.reporter_id))];

      const [postsResult, reportersResult] = await Promise.all([
        supabase.from('community_posts').select('id, content, user_id').in('id', postIds as string[]),
        supabase.from('profiles').select('user_id, name').in('user_id', reporterIds as string[])
      ]);

      const reportsWithData = data.map((report: any) => ({
        ...report,
        post: postsResult.data?.find((p: any) => p.id === report.post_id),
        reporter: reportersResult.data?.find((r: any) => r.user_id === report.reporter_id)
      }));
      setReports(reportsWithData);
    }
  };

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
    await Promise.all([fetchReports(), fetchPosts(), fetchComments(), fetchBlocks()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReportAction = async (reportId: string, action: 'reviewed' | 'dismissed', postId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use type assertion for new table
    const { error } = await (supabase as any)
      .from('post_reports')
      .update({
        status: action,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
      return;
    }

    // If reviewed, also delete the post
    if (action === 'reviewed' && postId) {
      await supabase.from('community_posts').delete().eq('id', postId);
      toast({ title: 'Uğurlu', description: 'Şikayət yoxlanıldı və post silindi' });
    } else {
      toast({ title: 'Uğurlu', description: 'Şikayət rədd edildi' });
    }
    fetchReports();
    fetchPosts();
  };

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

  const pendingReports = reports.filter(r => r.status === 'pending');
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
        {pendingReports.length > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {pendingReports.length} yeni şikayət
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Şikayətlər</span>
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Postlar</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Şərhlər</span>
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            <span className="hidden sm:inline">Bloklar</span>
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
            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Heç bir şikayət yoxdur</p>
                </div>
              ) : (
                reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-card rounded-xl p-4 border ${
                      report.status === 'pending' ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        report.status === 'pending' 
                          ? 'bg-amber-100 text-amber-600' 
                          : report.status === 'reviewed' 
                          ? 'bg-green-100 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Flag className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={
                            report.status === 'pending' ? 'default' : 
                            report.status === 'reviewed' ? 'secondary' : 'outline'
                          }>
                            {report.status === 'pending' ? 'Gözləyir' : 
                             report.status === 'reviewed' ? 'Yoxlanıldı' : 'Rədd edildi'}
                          </Badge>
                          <Badge variant="outline">{report.reason}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: az })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">{report.reporter?.name || 'İstifadəçi'}</span> tərəfindən şikayət edildi
                        </p>
                        {report.post && (
                          <div className="bg-muted/50 rounded-lg p-3 mt-2">
                            <p className="text-sm line-clamp-3">{report.post.content}</p>
                          </div>
                        )}
                      </div>
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleReportAction(report.id, 'reviewed', report.post_id)}
                            className="text-green-600 hover:bg-green-100"
                            title="Şikayəti qəbul et və postu sil"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleReportAction(report.id, 'dismissed')}
                            className="text-red-600 hover:bg-red-100"
                            title="Şikayəti rədd et"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </TabsContent>

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