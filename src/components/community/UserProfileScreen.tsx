import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid3X3, Film, Settings, Crown, Shield, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import PostCard from './PostCard';
import { CommunityPost } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { tr } from "@/lib/tr";

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
  onSendMessage?: (userId: string, name: string, avatar: string | null) => void;
}

const UserProfileScreen = ({ userId, onBack, onSendMessage }: UserProfileScreenProps) => {
  useScrollToTop();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Postlar react-query-dÉ™ â€” useToggleLike-Ä±n optimistic patch-i ['user-posts']
  // cache-ini yenilÉ™diyi Ã¼Ã§Ã¼n Ã¼rÉ™k burada da dÉ™rhal iÅŸlÉ™yir.
  // (ÆvvÉ™llÉ™r is_liked: false hardcode idi vÉ™ local state heÃ§ vaxt yenilÉ™nmirdi.)
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async (): Promise<CommunityPost[]> => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const [{ data: cardData }, { data: postsData }] = await Promise.all([
      (supabase as any).
      from('public_profile_cards').
      select('name, avatar_url, badge_type').
      eq('user_id', userId).
      maybeSingle(),
      supabase.
      from('community_posts').
      select('*').
      eq('user_id', userId).
      eq('is_active', true).
      order('created_at', { ascending: false })]
      );

      // Cari istifadÉ™Ã§inin bÉ™yÉ™ndiklÉ™ri â€” tÉ™k batch sorÄŸu
      const likedSet = new Set<string>();
      if (currentUser && postsData && postsData.length > 0) {
        const { data: likeRows } = await supabase.
        from('post_likes').
        select('post_id').
        eq('user_id', currentUser.id).
        in('post_id', postsData.map((p: any) => p.id));
        (likeRows || []).forEach((r: any) => likedSet.add(r.post_id));
      }

      return (postsData || []).map((post: any) => ({
        ...post,
        author: {
          name: cardData?.name || tr("userprofilescreen_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
          avatar_url: cardData?.avatar_url || null,
          badge_type: cardData?.badge_type || null
        },
        is_liked: likedSet.has(post.id)
      })) as CommunityPost[];
    },
    enabled: !!userId
  });

  const stats = useMemo(() => ({
    postsCount: posts.length,
    storiesCount: stories.length,
    likesCount: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)
  }), [posts, stories]);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);

    try {
      // Check if current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setIsCurrentUser(currentUser?.id === userId);

      // Fetch profile (public-safe projection for Community)
      const { data: profileData, error: profileError } = await (supabase as any).
      from('public_profile_cards').
      select('user_id, name, avatar_url, life_stage, is_premium, badge_type, created_at').
      eq('user_id', userId).
      maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
      }

      // Fetch stories - community_stories doesn't have is_active column
      const { data: storiesData } = await supabase.
      from('community_stories').
      select('id, media_url, media_type, created_at').
      eq('user_id', userId).
      gte('expires_at', new Date().toISOString()) // Only show non-expired stories
      .order('created_at', { ascending: false });

      if (storiesData) {
        setStories(storiesData as UserStory[]);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Palitra konvensiyasÄ±: tint fon + sabit ink
  const getBadgeLabel = (type: string | null) => {
    if (!type) return null;
    switch (type) {
      case 'admin':return { label: 'Admin', icon: Shield, bg: 'var(--a-pink-1)', ink: 'var(--a-alert-ink)' };
      case 'premium':return { label: 'Premium', icon: Crown, bg: 'var(--a-yellow-1)', ink: 'var(--a-yellow-ink)' };
      case 'moderator':return { label: 'Moderator', icon: Shield, bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)' };
      default:return null;
    }
  };

  const getLifeStageLabel = (stage: string | null) => {
    switch (stage) {
      case 'flow':return { label: 'Flow', bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)' };
      case 'bump':return { label: tr("userprofilescreen_hamile_0080af", 'HamilÉ™'), bg: 'var(--a-peach-1)', ink: 'var(--a-accent-ink)' };
      case 'mommy':return { label: tr("common_ana", 'Ana'), bg: 'var(--a-lav-1)', ink: 'var(--a-lav-ink)' };
      case 'partner':return { label: 'Partner', bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)' };
      default:return null;
    }
  };

  if (loading || postsLoading) {
    return (
      <div className="a-scope min-h-screen flex items-center justify-center" style={{ background: 'var(--a-bg)' }}>
        <div className="w-8 h-8 rounded-full animate-spin"
        style={{ border: '3px solid var(--a-peach-2)', borderTopColor: 'transparent' }} />
      </div>);

  }

  if (!profile) {
    return (
      <div className="a-scope safe-top min-h-screen" style={{ background: 'var(--a-bg)' }}>
        <div className="a-shell">
          <header className="a-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.9 }} aria-label={tr("common_geri", "Geri")}>
                <ArrowLeft size={16} strokeWidth={2} />
              </motion.button>
              <p className="a-wordmark" style={{ fontSize: 16 }}>{tr("untranslated_profil_v8b0sk", "Profil")}</p>
            </div>
          </header>
          <div className="a-card" style={{ textAlign: 'center', padding: '38px 18px' }}>
            <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{tr("userprofilescreen_istifadeci_tapilmadi_4e2156", "Ä°stifadÉ™Ã§i tapÄ±lmadÄ±")}</p>
          </div>
        </div>
      </div>);

  }

  const badge = getBadgeLabel(profile.badge_type);
  const lifeStage = getLifeStageLabel(profile.life_stage);

  return (
    <div className="a-scope safe-top min-h-screen pb-24 overflow-y-auto" style={{ background: 'var(--a-bg)' }}>
      <div className="a-shell">
        {/* Top bar */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.9 }} aria-label={tr("common_geri", "Geri")}>
              <ArrowLeft size={16} strokeWidth={2} />
            </motion.button>
            <p className="a-wordmark" style={{ fontSize: 16 }}>{tr("untranslated_profil_v8b0sk", "Profil")}</p>
          </div>
          {isCurrentUser &&
          <div className="a-topbar-actions">
              <motion.button className="a-icon-btn" whileTap={{ scale: 0.95 }} aria-label={tr("common_parametrler", "ParametrlÉ™r")}>
                <Settings size={16} strokeWidth={2} />
              </motion.button>
            </div>
          }
        </header>

        {/* Profile Card */}
        <div className="a-card" style={{ padding: 18, marginBottom: 14 }}>
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20" style={{ border: '3px solid var(--a-peach-1)' }}>
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback style={{ background: 'var(--a-peach-1)', color: 'var(--a-accent-ink)', fontSize: 24, fontWeight: 800 }}>
                {profile.name?.charAt(0) || tr("common_initial_i", "Ä°")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--a-ink)' }}>{profile.name}</h2>
                {badge &&
                <span className="inline-flex items-center gap-1"
                style={{ background: badge.bg, color: badge.ink, borderRadius: 999, padding: '3px 10px', fontSize: 10.5, fontWeight: 800 }}>
                    <badge.icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                }
              </div>

              {lifeStage &&
              <span className="inline-block mt-1.5"
              style={{ background: lifeStage.bg, color: lifeStage.ink, borderRadius: 999, padding: '3px 10px', fontSize: 10.5, fontWeight: 700 }}>
                  {lifeStage.label}
                </span>
              }

              <p className="mt-2" style={{ fontSize: 11, color: 'var(--a-ink-soft)' }}>
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: getCurrentDateLocale() })} {tr("userprofilescreen_qosuldu_78ba1a", "qo\u015Fuldu")}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-5">
            {[
            { value: stats.postsCount, label: 'Post' },
            { value: stats.storiesCount, label: 'Story' },
            { value: stats.likesCount, label: tr("userprofilescreen_beyenme_488df4", "BÉ™yÉ™nmÉ™") }].
            map((s) =>
            <div key={s.label} className="text-center" style={{ background: 'var(--a-surface-soft)', borderRadius: 16, padding: '12px 8px' }}>
                <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--a-ink)' }}>{s.value}</p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--a-ink-soft)', marginTop: 1 }}>{s.label}</p>
              </div>
            )}
          </div>

          {/* Message Button */}
          {!isCurrentUser && onSendMessage && profile &&
          <motion.button
            onClick={() => onSendMessage(profile.user_id, profile.name, profile.avatar_url)}
            className="a-btn-solid w-full mt-4 justify-center"
            style={{ height: 44, fontSize: 13 }}
            whileTap={{ scale: 0.97 }}>

              <MessageCircle size={15} />
              {tr("userprofilescreen_mesaj_gonder_ad33c9", "Mesaj gÃ¶ndÉ™r")}
            </motion.button>
          }
        </div>

        {/* Tabs */}
        <div className="a-tabs" style={{ marginBottom: 14 }}>
          <button onClick={() => setActiveTab('posts')} className={`a-tab ${activeTab === 'posts' ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-1.5"><Grid3X3 size={13} />{tr("userprofilescreen_postlar", "Postlar")}</span>
          </button>
          <button onClick={() => setActiveTab('stories')} className={`a-tab ${activeTab === 'stories' ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-1.5"><Film size={13} />{tr("userprofilescreen_story_ler_670373", "Story-lÉ™r")}</span>
          </button>
        </div>

        {activeTab === 'posts' &&
        <div className="space-y-4">
            {posts.length === 0 ?
          <div className="a-card" style={{ textAlign: 'center', padding: '34px 18px' }}>
                <div className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--a-surface-soft)' }}>
                  <Grid3X3 size={26} style={{ color: 'var(--a-ink-faint)' }} />
                </div>
                <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{tr("userprofilescreen_hele_post_yoxdur_a26a62", "HÉ™lÉ™ post yoxdur")}</p>
              </div> :

          posts.map((post) =>
          <PostCard key={post.id} post={post} groupId={post.group_id} />
          )
          }
          </div>
        }

        {activeTab === 'stories' &&
        <div>
            {stories.length === 0 ?
          <div className="a-card" style={{ textAlign: 'center', padding: '34px 18px' }}>
                <div className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--a-surface-soft)' }}>
                  <Film size={26} style={{ color: 'var(--a-ink-faint)' }} />
                </div>
                <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{tr("userprofilescreen_hele_story_yoxdur_d7ad34", "HÉ™lÉ™ story yoxdur")}</p>
              </div> :

          <div className="grid grid-cols-3 gap-2">
                {stories.map((story) =>
            <motion.div
              key={story.id}
              className="relative aspect-[9/16] overflow-hidden"
              style={{ borderRadius: 16, background: 'var(--a-surface-soft)', boxShadow: 'var(--a-card-shadow)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>

                    {story.media_type === 'video' ?
              <video
                src={story.media_url}
                className="w-full h-full object-cover"
                muted /> :


              <img
                src={story.media_url}
                alt="Story"
                className="w-full h-full object-cover" />

              }
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-white/90 bg-black/40 px-2 py-0.5 rounded-full" style={{ fontSize: 10 }}>
                        {formatDistanceToNow(new Date(story.created_at), { addSuffix: false, locale: getCurrentDateLocale() })}
                      </span>
                    </div>
                  </motion.div>
            )}
              </div>
          }
          </div>
        }
      </div>
    </div>);

};

export default UserProfileScreen;
