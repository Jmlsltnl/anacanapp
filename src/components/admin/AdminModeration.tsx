import { useState, useEffect } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Ban, Trash2, AlertTriangle, Check, Flag, XCircle, CheckCircle, Image, Video } from 'lucide-react';
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
  DialogTitle } from
'@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { getPublicProfileCards } from '@/lib/public-profile-cards';

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  is_active: boolean;
  likes_count: number;
  comments_count: number;
  media_urls?: string[] | null;
  author?: {name: string;avatar_url?: string | null;};
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  is_active: boolean;
  author?: {name: string;avatar_url?: string | null;};
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
  user?: {name: string;avatar_url?: string | null;};
}

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  post?: {content: string;user_id: string;media_urls?: string[] | null;};
  reporter?: {name: string;avatar_url?: string | null;};
  postAuthor?: {name: string;avatar_url?: string | null;};
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
    const { data, error } = await (supabase as any).
    from('post_reports').
    select('*').
    order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch post info including media_urls
      const postIds = [...new Set(data.map((r: any) => r.post_id))];
      const reporterIds = [...new Set(data.map((r: any) => r.reporter_id))];

      const { data: postsData } = await supabase.
      from('community_posts').
      select('id, content, user_id, media_urls').
      in('id', postIds as string[]);

      // Get all user IDs (reporters + post authors)
      const postAuthorIds = (postsData || []).map((p: any) => p.user_id);
      const allUserIds = [...new Set([...reporterIds, ...postAuthorIds])] as string[];

      // Fetch from public_profile_cards (bypasses RLS)
      const profileMap = await getPublicProfileCards(allUserIds);

      const reportsWithData = data.map((report: any) => {
        const post = postsData?.find((p: any) => p.id === report.post_id);
        return {
          ...report,
          post,
          reporter: profileMap[report.reporter_id] || null,
          postAuthor: post ? profileMap[post.user_id] || null : null
        };
      });
      setReports(reportsWithData);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase.
    from('community_posts').
    select('*').
    order('created_at', { ascending: false }).
    limit(100);

    if (!error && data) {
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const profileMap = await getPublicProfileCards(userIds);

      setPosts(data.map((p) => ({
        ...p,
        author: profileMap[p.user_id] || { name: tr("adminmoderation_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null }
      })));
    }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.
    from('post_comments').
    select('*').
    order('created_at', { ascending: false }).
    limit(100);

    if (!error && data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const profileMap = await getPublicProfileCards(userIds);

      setComments(data.map((c) => ({
        ...c,
        author: profileMap[c.user_id] || { name: tr("adminmoderation_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null }
      })));
    }
  };

  const fetchBlocks = async () => {
    const { data, error } = await supabase.
    from('user_blocks').
    select('*').
    order('created_at', { ascending: false });

    if (!error && data) {
      const userIds = data.map((b) => b.user_id);
      const profileMap = await getPublicProfileCards(userIds);

      const blocksWithUsers = data.map((block) => ({
        ...block,
        user: profileMap[block.user_id] || { name: tr("adminmoderation_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null }
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
    const { error } = await (supabase as any).
    from('post_reports').
    update({
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }).
    eq('id', reportId);

    if (error) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: error.message, variant: 'destructive' });
      return;
    }

    // If reviewed, also delete the post
    if (action === 'reviewed' && postId) {
      await supabase.from('community_posts').delete().eq('id', postId);
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: tr("adminmoderation_sikayet_yoxlanildi_ve_post_silindi_7319cc", "Şikayət yoxlanıldı və post silindi") });
    } else {
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: tr("adminmoderation_sikayet_redd_edildi_309b57", "Şikayət rədd edildi") });
    }
    fetchReports();
    fetchPosts();
  };

  const deletePost = async (postId: string) => {
    if (!confirm(tr("adminmoderation_bu_postu_silmek_isteyirsiniz_2fbc75", "Bu postu silm\u0259k ist\u0259yirsiniz?"))) return;

    const { error } = await supabase.
    from('community_posts').
    delete().
    eq('id', postId);

    if (error) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: 'Post silindi' });
      fetchPosts();
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm(tr("adminmoderation_bu_serhi_silmek_isteyirsiniz_fc50c9", "Bu \u015F\u0259rhi silm\u0259k ist\u0259yirsiniz?"))) return;

    const { error } = await supabase.
    from('post_comments').
    delete().
    eq('id', commentId);

    if (error) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: tr("adminmoderation_serh_silindi_59cfe5", "Şərh silindi") });
      fetchComments();
    }
  };

  const blockUser = async () => {
    if (!blockUserId || !blockReason) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: tr("adminmoderation_butun_saheleri_doldurun_3a413d", "Bütün sahələri doldurun"), variant: 'destructive' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.
    from('user_blocks').
    insert({
      user_id: blockUserId,
      blocked_by: user.id,
      reason: blockReason,
      block_type: blockType,
      is_active: true
    });

    if (error) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: tr("adminmoderation_istifadeci_bloklandi_189b51", "İstifadəçi bloklandı") });
      setShowBlockModal(false);
      setBlockUserId('');
      setBlockReason('');
      fetchBlocks();
    }
  };

  const unblockUser = async (blockId: string) => {
    if (!confirm(tr("adminmoderation_bu_istifadecinin_blokunu_acmaq_b0d1f5", "Bu istifad\u0259\xE7inin blokunu a\xE7maq ist\u0259yirsiniz?"))) return;

    const { error } = await supabase.
    from('user_blocks').
    update({ is_active: false }).
    eq('id', blockId);

    if (error) {
      toast({ title: tr("adminmoderation_xeta_3cdbb6", "Xəta"), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: tr("adminmoderation_ugurlu_7fe64c", "Uğurlu"), description: tr("adminmoderation_blok_acildi_d339d9", "Blok açıldı") });
      fetchBlocks();
    }
  };

  const openBlockModal = (userId: string) => {
    setBlockUserId(userId);
    setShowBlockModal(true);
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const filteredPosts = posts.filter((p) =>
  p.content?.toLowerCase().includes(search.toLowerCase()) ||
  p.author?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredComments = comments.filter((c) =>
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
        {pendingReports.length > 0 &&
        <Badge variant="destructive" className="text-sm px-3 py-1">
            {pendingReports.length} {tr("adminmoderation_yeni_sikayet_9571c6", "yeni \u015Fikay\u0259t")}
          </Badge>
        }
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">{tr("adminmoderation_sikayetler_4ad77f", "Şikayətlər")}</span>
            {pendingReports.length > 0 &&
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingReports.length}
              </Badge>
            }
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Postlar</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{tr("adminmoderation_serhler_30d5d9", "Şərhlər")}</span>
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
              className="pl-10" />
            
          </div>
        </div>

        {loading ?
        <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div> :

        <>
            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-3">
              {reports.length === 0 ?
            <div className="text-center py-12 text-muted-foreground">
                  <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{tr("adminmoderation_hec_bir_sikayet_yoxdur_a67bd4", "Heç bir şikayət yoxdur")}</p>
                </div> :

            reports.map((report) =>
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-xl p-4 border ${
              report.status === 'pending' ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border'}`
              }>
              
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                report.status === 'pending' ?
                'bg-amber-100 text-amber-600' :
                report.status === 'reviewed' ?
                'bg-green-100 text-green-600' :
                'bg-muted text-muted-foreground'}`
                }>
                        <Flag className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={
                    report.status === 'pending' ? 'default' :
                    report.status === 'reviewed' ? 'secondary' : 'outline'
                    }>
                            {report.status === 'pending' ? tr("adminmoderation_gozleyir_9ac18a", "G\xF6zl\u0259yir") :
                      report.status === 'reviewed' ? tr("adminmoderation_yoxlanildi_fc524b", "Yoxlan\u0131ld\u0131") : tr("adminmoderation_redd_edildi_c40149", "R\u0259dd edildi")}
                          </Badge>
                          <Badge variant="outline">{report.reason}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: getCurrentDateLocale() })}
                          </span>
                        </div>

                        {/* Reporter info */}
                        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {report.reporter?.avatar_url ?
                      <img src={report.reporter.avatar_url} alt="" className="w-full h-full object-cover" /> :

                      <span className="text-blue-600 font-bold text-sm">
                                {report.reporter?.name?.charAt(0) || 'İ'}
                              </span>
                      }
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">{tr("adminmoderation_sikayet_eden_17501b", "Şikayət edən:")}</span>
                            <span className="font-medium">{report.reporter?.name || tr("adminmoderation_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</span>
                          </div>
                        </div>
                        
                        {/* Post and author info */}
                        {report.post &&
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                            {/* Post author */}
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {report.postAuthor?.avatar_url ?
                        <img src={report.postAuthor.avatar_url} alt="" className="w-full h-full object-cover" /> :

                        <span className="text-primary font-bold text-sm">
                                    {report.postAuthor?.name?.charAt(0) || 'İ'}
                                  </span>
                        }
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">{tr("adminmoderation_post_muellifi_f1677f", "Post müəllifi:")}</span>
                                <span className="font-medium">{report.postAuthor?.name || tr("adminmoderation_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</span>
                              </div>
                            </div>
                            
                            {/* Post content - full display */}
                            <p className="text-sm whitespace-pre-wrap mb-3">{report.post.content}</p>
                            
                            {/* Post media */}
                            {report.post.media_urls && report.post.media_urls.length > 0 &&
                    <div className="grid grid-cols-2 gap-2 mt-3">
                                {report.post.media_urls.map((url, idx) => {
                        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                        return (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                      {isVideo ?
                            <div className="w-full h-full flex items-center justify-center">
                                          <video src={url} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Video className="w-8 h-8 text-white" />
                                          </div>
                                        </div> :

                            <img src={url} alt="" className="w-full h-full object-cover" />
                            }
                                    </div>);

                      })}
                              </div>
                    }
                          </div>
                  }

                        {/* Report description if any */}
                        {report.description &&
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{tr("adminmoderation_elave_qeyd_58e864", "Əlavə qeyd:")}</p>
                            <p className="text-sm">{report.description}</p>
                          </div>
                  }
                      </div>
                      {report.status === 'pending' &&
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReportAction(report.id, 'reviewed', report.post_id)}
                    className="text-green-600 hover:bg-green-100"
                    title={tr("adminmoderation_sikayeti_qebul_et_ve_postu_sil_45452a", "Şikayəti qəbul et və postu sil")}>
                    
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                          <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReportAction(report.id, 'dismissed')}
                    className="text-red-600 hover:bg-red-100"
                    title={tr("adminmoderation_sikayeti_redd_et_184bc2", "Şikayəti rədd et")}>
                    
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                }
                    </div>
                  </motion.div>
            )
            }
            </TabsContent>

            <TabsContent value="posts" className="space-y-3">
              {filteredPosts.map((post) =>
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border">
              
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {post.author?.avatar_url ?
                  <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" /> :

                  <span className="font-bold text-primary">{post.author?.name?.charAt(0) || 'İ'}</span>
                  }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{post.author?.name || tr("adminmoderation_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: getCurrentDateLocale() })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{post.content}</p>
                      
                      {/* Post media */}
                      {post.media_urls && post.media_urls.length > 0 &&
                  <div className="grid grid-cols-2 gap-2 mb-2">
                          {post.media_urls.slice(0, 4).map((url, idx) => {
                      const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                      return (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                {isVideo ?
                          <div className="w-full h-full flex items-center justify-center">
                                    <video src={url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <Video className="w-6 h-6 text-white" />
                                    </div>
                                  </div> :

                          <img src={url} alt="" className="w-full h-full object-cover" />
                          }
                              </div>);

                    })}
                        </div>
                  }
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count || 0}</span>
                        <span>💬 {post.comments_count || 0}</span>
                        {post.media_urls && post.media_urls.length > 0 &&
                    <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" /> {post.media_urls.length}
                          </span>
                    }
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openBlockModal(post.user_id)}>
                    
                        <Ban className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePost(post.id)}>
                    
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
            )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3">
              {filteredComments.map((comment) =>
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border">
              
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {comment.author?.name?.charAt(0) || 'İ'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{comment.author?.name || tr("adminmoderation_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getCurrentDateLocale() })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openBlockModal(comment.user_id)}>
                    
                        <Ban className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteComment(comment.id)}>
                    
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
            )}
            </TabsContent>

            <TabsContent value="blocks" className="space-y-3">
              {blocks.map((block) =>
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-xl p-4 border ${block.is_active ? 'border-red-200' : 'border-border'}`}>
              
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                block.is_active ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`
                }>
                      <Ban className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{block.user?.name || tr("adminmoderation_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</span>
                        <Badge variant={block.is_active ? 'destructive' : 'secondary'}>
                          {block.is_active ? 'Aktiv' : tr("adminmoderation_acilib_1f71a5", "A\xE7\u0131l\u0131b")}
                        </Badge>
                        <Badge variant="outline">{block.block_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {block.user_id.substring(0, 8)}...</p>
                      <p className="text-sm text-red-600 mt-1">{tr("adminmoderation_sebeb_e614c3", "S\u0259b\u0259b:")} {block.reason}</p>
                    </div>
                    {block.is_active &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblockUser(block.id)}>
                  
                        <Check className="w-4 h-4 mr-1" />
                        {tr("adminmoderation_bloku_ac_b83fbb", "Bloku A\xE7")}
                      </Button>
                }
                  </div>
                </motion.div>
            )}
            </TabsContent>
          </>
        }
      </Tabs>

      {/* Block User Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("adminmoderation_istifadecini_blokla_160336", "İstifadəçini Blokla")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{tr("adminmoderation_blok_novu_57af90", "Blok Növü")}</label>
              <div className="flex gap-2">
                <Button
                  variant={blockType === 'community' ? 'default' : 'outline'}
                  onClick={() => setBlockType('community')}
                  className="flex-1">
                  {tr("adminmoderation_yalniz_community_50b740", "Yaln\u0131z Community")}
                
                </Button>
                <Button
                  variant={blockType === 'full' ? 'default' : 'outline'}
                  onClick={() => setBlockType('full')}
                  className="flex-1">
                  
                  Tam Blok
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tr("adminmoderation_sebeb_7b51f1", "Səbəb")}</label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={tr("adminmoderation_bloklama_sebebini_yazin_994a8a", "Bloklama səbəbini yazın...")}
                rows={3} />
              
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBlockModal(false)} className="flex-1">
                {tr("adminmoderation_legv_et_b5e49c", "L\u0259\u011Fv et")}
              </Button>
              <Button onClick={blockUser} variant="destructive" className="flex-1">
                <Ban className="w-4 h-4 mr-2" />
                Blokla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default AdminModeration;