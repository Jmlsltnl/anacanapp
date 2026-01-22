import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid3X3, Film, Settings, UserPlus, UserMinus, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from './PostCard';
import { CommunityPost } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface UserProfile {
  user_id: string;
  name: string;
  avatar_url: string | null;
  life_stage: string | null;
  is_premium: boolean;
  badge_type: string | null;
  created_at: string;
}

interface UserStory {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

interface UserProfileScreenProps {
  userId: string;
  onBack: () => void;
}

const UserProfileScreen = ({ userId, onBack }: UserProfileScreenProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [stats, setStats] = useState({ postsCount: 0, storiesCount: 0, likesCount: 0 });

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      // Check if current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setIsCurrentUser(currentUser?.id === userId);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, life_stage, is_premium, badge_type, created_at')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
      }

      // Fetch posts
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (postsData && profileData) {
        // Add author info to posts
        const postsWithAuthor = postsData.map(post => ({
          ...post,
          author: {
            name: profileData?.name || 'İstifadəçi',
            avatar_url: profileData?.avatar_url || null,
            badge_type: profileData?.badge_type || null
          },
          is_liked: false
        }));
        setPosts(postsWithAuthor as CommunityPost[]);
      }

      // Fetch stories - community_stories doesn't have is_active column
      const { data: storiesData } = await supabase
        .from('community_stories')
        .select('id, media_url, media_type, created_at')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString()) // Only show non-expired stories
        .order('created_at', { ascending: false });

      if (storiesData) {
        setStories(storiesData as UserStory[]);
      }

      // Calculate stats
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      setStats({
        postsCount: postsData?.length || 0,
        storiesCount: storiesData?.length || 0,
        likesCount: totalLikes
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeLabel = (type: string | null) => {
    if (!type) return null;
    switch (type) {
      case 'admin': return { label: 'Admin', icon: Shield, color: 'from-red-500 to-orange-500' };
      case 'premium': return { label: 'Premium', icon: Crown, color: 'from-amber-400 to-amber-600' };
      case 'moderator': return { label: 'Moderator', icon: Shield, color: 'from-blue-500 to-cyan-500' };
      default: return null;
    }
  };

  const getLifeStageLabel = (stage: string | null) => {
    switch (stage) {
      case 'flow': return { label: 'Flow', color: 'bg-pink-100 text-pink-700' };
      case 'bump': return { label: 'Hamilə', color: 'bg-orange-100 text-orange-700' };
      case 'mommy': return { label: 'Ana', color: 'bg-purple-100 text-purple-700' };
      case 'partner': return { label: 'Partner', color: 'bg-blue-100 text-blue-700' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-5">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          Geri
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">İstifadəçi tapılmadı</p>
        </div>
      </div>
    );
  }

  const badge = getBadgeLabel(profile.badge_type);
  const lifeStage = getLifeStageLabel(profile.life_stage);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground flex-1">Profil</h1>
          {isCurrentUser && (
            <motion.button
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-5 py-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {profile.name?.charAt(0) || 'İ'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
              {badge && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${badge.color}`}>
                  <badge.icon className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>

            {lifeStage && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${lifeStage.color}`}>
                {lifeStage.label}
              </span>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: az })} qoşuldu
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.postsCount}</p>
            <p className="text-xs text-muted-foreground">Post</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.storiesCount}</p>
            <p className="text-xs text-muted-foreground">Story</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.likesCount}</p>
            <p className="text-xs text-muted-foreground">Bəyənmə</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="px-5">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Postlar
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Story-lər
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Grid3X3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hələ post yoxdur</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} groupId={post.group_id} />
            ))
          )}
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hələ story yoxdur</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {stories.map(story => (
                <motion.div
                  key={story.id}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {story.media_type === 'video' ? (
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={story.media_url}
                      alt="Story"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                      {formatDistanceToNow(new Date(story.created_at), { addSuffix: false, locale: az })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfileScreen;
