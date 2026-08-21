import { useState, useEffect, useCallback } from 'react';
import { tr } from '@/lib/tr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPublicProfileCards } from '@/lib/public-profile-cards';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { detectLang, isFeedLang, FeedLang } from '@/lib/langDetect';
import { defaultFeedLanguages } from '@/hooks/useFeedLanguages';

export interface CommunityGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  cover_image_url: string | null;
  icon_emoji: string | null;
  is_active: boolean;
  is_auto_join: boolean;
  auto_join_criteria: Record<string, any> | null;
  member_count: number;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  group_id: string | null;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_anonymous: boolean;
  /** Postun MƏZMUN dili (az/en/ru/tr) — UI dili deyil; tərcümə düyməsi buna baxır */
  language?: string | null;
  created_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
    badge_type?: string;
    is_verified?: boolean | null;
    verified_until?: string | null;
  };
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  is_anonymous?: boolean;
  author?: {
    name: string;
    avatar_url: string | null;
    badge_type?: string;
    is_verified?: boolean | null;
    verified_until?: string | null;
  };
  is_liked?: boolean;
}

export const useCommunityGroups = () => {
  return useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('community_groups').
      select('*').
      eq('is_active', true).
      order('group_type', { ascending: true }).
      order('name', { ascending: true });

      if (error) throw error;
      return data as CommunityGroup[];
    }
  });
};

export const useUserMemberships = () => {
  return useQuery({
    queryKey: ['user-memberships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.
      from('group_memberships').
      select('group_id, role, joined_at').
      eq('user_id', user.id);

      if (error) throw error;
      return data;
    }
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('group_memberships').
      insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast({ title: tr("usecommunity_qrupa_qosuldunuz_bea9e3", "Qrupa qoşuldunuz! 🎉") });
    },
    onError: () => {
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('group_memberships').
      delete().
      eq('group_id', groupId).
      eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
      toast({ title: tr("usecommunity_qrupdan_ayrildiniz_2ad166", "Qrupdan ayrıldınız") });
    }
  });
};

/** Postlara müəllif kartı + like statusu əlavə et (feed və backfill üçün ortaq) */
const enrichPosts = async (posts: any[], userId?: string | null): Promise<CommunityPost[]> => {
  const authorMap = await getPublicProfileCards((posts || []).map((p: any) => p.user_id));

  // İstifadəçinin bəyəndikləri — TƏK batch sorğu (əvvəllər hər post üçün ayrıca sorğu idi — N+1)
  const likedSet = new Set<string>();
  if (userId && posts && posts.length > 0) {
    const { data: likeRows } = await supabase.
    from('post_likes').
    select('post_id').
    eq('user_id', userId).
    in('post_id', posts.map((p: any) => p.id));
    (likeRows || []).forEach((r: any) => likedSet.add(r.post_id));
  }

  return (posts || []).map((post: any) => {
    const isAnon = post.is_anonymous === true;
    const authorData = isAnon ? null : authorMap[post.user_id];

    return {
      ...post,
      is_anonymous: isAnon,
      author: isAnon ?
      { name: 'Anonim', avatar_url: null, badge_type: null, is_verified: false, verified_until: null } :
      authorData ?
      {
        name: authorData.name || tr("usecommunity_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
        avatar_url: authorData.avatar_url || null,
        badge_type: authorData.badge_type || null,
        is_verified: authorData.is_verified || false,
        verified_until: authorData.verified_until || null
      } :
      { name: tr("usecommunity_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null, badge_type: null, is_verified: false, verified_until: null },
      is_liked: likedSet.has(post.id)
    };
  }) as CommunityPost[];
};

/**
 * Qlobal feed üçün post-siyahısını istifadəçinin ölkəsinə görə dil PRİORİTETİ
 * ilə sıralayır (FİLTR DEYİL — heç bir post gizlədilmir). Pinlənmiş postlar
 * həmişə əvvəl qalır; hər iki qrup (pinlənmiş/adi) daxilində əvvəl prioritet
 * dildəki postlar, sonra digərləri (öz aralarında tarix sırası ilə).
 */
function sortByLanguagePriority<T extends { is_pinned?: boolean; language?: string | null; created_at: string }>(
  posts: T[],
  priorityLangs: string[]
): T[] {
  const rank = (lang: string | null | undefined) => {
    const idx = priorityLangs.indexOf(lang || 'az');
    return idx === -1 ? priorityLangs.length : idx;
  };
  return [...posts].sort((a, b) => {
    if (!!a.is_pinned !== !!b.is_pinned) return a.is_pinned ? -1 : 1;
    const rankDiff = rank(a.language) - rank(b.language);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export const useGroupPosts = (groupId: string | null) => {
  const { profile } = useAuth();
  const uiLang = useUserStore((s) => s.language) || 'az';
  const countryCode = profile?.country_code || useUserStore.getState().countryCode;
  const queryClient = useQueryClient();
  const queryKey = ['group-posts', groupId] as const;

  // Real-time: yeni/redaktə/silinmiş postlar gələn kimi feed-i yenilə —
  // əvvəllər BUNUN ƏVƏZİNƏ heç nə yox idi, ona görə yeni postlar/dəyişikliklər
  // yalnız tam ekran remount-unda (tab dəyişəndə) və ya 30san staleTime
  // keçəndə görünürdü ("hard refresh olmadan gəlmir" şikayətinin əsas səbəbi).
  useEffect(() => {
    if (groupId === undefined) return;
    const channel = supabase
      .channel(`community-posts-${groupId ?? 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          // Qrup feedi üçün server-side filtr; qlobal feed üçün (group_id IS NULL)
          // Realtime "is.null" filtrini etibarlı dəstəkləmədiyinə görə client-side yoxlanılır.
          ...(groupId ? { filter: `group_id=eq.${groupId}` } : {})
        },
        (payload) => {
          if (!groupId) {
            const row: any = payload.new || payload.old;
            if (row?.group_id) return; // bu qlobal feed — qrup postlarını atla
          }
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, queryClient]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase.
      from('community_posts').
      select('*').
      eq('is_active', true).
      order('is_pinned', { ascending: false }).
      order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        // Qlobal feed — HEÇ BİR dil filtri yoxdur, bütün postlar gəlir.
        query = query.is('group_id', null);
      }

      // Sərhədsiz idi — cəmiyyət/paylaşım sayı vaxtla böyüdükcə bu sorğu
      // (hər feed açılışında!) getdikcə ağırlaşırdı. Son 150 paylaşım kifayət
      // qədər dolğun feed verir; tam "daha çox yüklə" pagination gələcək
      // təkmilləşdirmə kimi qeyd olunub.
      query = query.limit(150);

      const { data: posts, error } = await query;
      if (error) throw error;

      const enriched = await enrichPosts(posts || [], user?.id);
      if (groupId) return enriched; // qrup feedi dil prioritetindən azaddır

      const priorityLangs = defaultFeedLanguages(countryCode, uiLang);
      return sortByLanguagePriority(enriched, priorityLangs);
    },
    enabled: groupId !== undefined
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, content, mediaUrls, isAnonymous, language }: {groupId: string | null;content: string;mediaUrls?: string[];isAnonymous?: boolean;language?: FeedLang;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Post dili = MƏZMUNUN dili (composer çipi > avtomatik aşkarlama > UI dili).
      // Əvvəllər UI dili yazılırdı — EN interfeysdə az yazan ananın postu az feedində görünmürdü.
      const uiLang = useUserStore.getState().language || 'az';
      const fallbackLang: FeedLang = isFeedLang(uiLang) ? uiLang : 'az';
      const postLanguage: FeedLang = language || detectLang(content, fallbackLang);

      const { error } = await supabase.
      from('community_posts').
      insert([
        {
          group_id: groupId,
          user_id: user.id,
          content,
          media_urls: mediaUrls || [],
          is_anonymous: isAnonymous || false,
          language: postLanguage
        }
      ]);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] });
      toast({ title: tr("usecommunity_paylasim_elave_edildi_379020", "Paylaşım əlavə edildi! ✨") });
    },
    onError: () => {
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });
};

export const useEditPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, currentLanguage }: {postId: string;content: string;currentLanguage?: string | null;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Redaktədə dili yenidən aşkarla (qeyri-müəyyəndirsə köhnə dil qalır).
      // Köhnəlmiş tərcümə keşini DB trigger özü silir (trg_purge_post_translations).
      const uiLang = useUserStore.getState().language || 'az';
      const fallbackLang: FeedLang = isFeedLang(currentLanguage) ? currentLanguage : isFeedLang(uiLang) ? uiLang : 'az';

      const { error } = await supabase.
      from('community_posts').
      update({ content, language: detectLang(content, fallbackLang) }).
      eq('id', postId).
      eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast({ title: tr("usecommunity_post_redakte_edildi_c4540d", "Post redaktə edildi ✏️") });
    },
    onError: () => {
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('community_posts').
      delete().
      eq('id', postId).
      eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast({ title: tr("usecommunity_post_silindi", 'Post silindi') + ' 🗑️' });
    },
    onError: () => {
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });
};

/**
 * Post pin/unpin — YALNIZ admin RLS-də icazəlidir ("Admins can manage all
 * posts" FOR ALL policy, community_posts). Pinlənmiş post feed sorğusunda
 * artıq `.order('is_pinned', {ascending:false})` sayəsində avtomatik ən
 * üstdə görünür — VƏ filtr (dil/qrup) sıralamadan ƏVVƏL tətbiq olunduğu üçün
 * pin yalnız postun öz dilinin/qrupunun feed-i daxilində ən üstə çıxır.
 */
export const useTogglePinPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, pin }: { postId: string; pin: boolean }) => {
      const { error } = await supabase.
      from('community_posts').
      update({ is_pinned: pin }).
      eq('id', postId);

      if (error) throw error;
    },
    onSuccess: (_, { pin }) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast({
        title: pin ?
        tr("usecommunity_post_pinlendi", "📌 Post pinləndi") :
        tr("usecommunity_post_pini_goturuldu", "Post pindən çıxarıldı")
      });
    },
    onError: () => {
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    }
  });
};

/**
 * Post like toggle — optimistic.
 *  - Ürək DƏRHAL dolur/boşalır (server cavabı gözlənilmir)
 *  - Push bildirişi arxa planda göndərilir (like-ı bloklamır)
 *  - Duplicate insert (sürətli double-tap, 23505) uğur sayılır, push təkrarlanmır
 *  - Xətada cache geri qaytarılır (rollback)
 *  - Feed invalidate EDİLMİR — tam refetch (N+1) hər like-da lazımsız yük idi
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  // Postu bütün feed cache-lərində yenilə (ümumi feed, qrup feed-ləri, profil postları)
  const patchPostInCaches = (postId: string, patch: (p: any) => any) => {
    (['group-posts', 'user-posts'] as const).forEach((root) => {
      queryClient.setQueriesData({ queryKey: [root] }, (old: any) =>
      Array.isArray(old) ? old.map((p: any) => p.id === postId ? patch(p) : p) : old
      );
    });
  };

  return useMutation({
    mutationFn: async ({ postId, isLiked, groupId }: {postId: string;isLiked: boolean;groupId: string | null;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase.
        from('post_likes').
        delete().
        eq('post_id', postId).
        eq('user_id', user.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.
      from('post_likes').
      insert({ post_id: postId, user_id: user.id });

      if (error) {
        // 23505 = unikal açar (artıq bəyənilib) — double-tap yarışı, uğur say + push YOX
        if ((error as any).code === '23505') return;
        throw error;
      }

      // Push bildirişi ARXA PLANDA — istifadəçini gözlətmir
      void (async () => {
        try {
          const { data: post } = await supabase.from('community_posts').select('user_id').eq('id', postId).maybeSingle();
          if (post && post.user_id !== user.id) {
            const { data: profile } = await supabase.from('public_profile_cards').select('name').eq('user_id', user.id).maybeSingle();
            const likerName = profile?.name || tr("usecommunity_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i");
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: post.user_id,
                title: tr("usecommunity_yeni_beyenme_3fd88a", "Yeni bəyənmə ❤️"),
                body: `${likerName} ${tr("usecommunity_paylasiminizi_beyendi", "paylaşımınızı bəyəndi")}`,
                data: { type: 'community_like', postId, groupId, context: 'community_post' }
              }
            });
          }
        } catch (e) {console.error('Like notification error:', e);}
      })();
    },
    onMutate: async ({ postId, isLiked }) => {
      // Uçuşdakı refetch-lər optimistic dəyəri əzməsin
      await queryClient.cancelQueries({ queryKey: ['group-posts'] });
      await queryClient.cancelQueries({ queryKey: ['user-posts'] });

      // Rollback üçün snapshot
      const prevGroup = queryClient.getQueriesData({ queryKey: ['group-posts'] });
      const prevUser = queryClient.getQueriesData({ queryKey: ['user-posts'] });

      patchPostInCaches(postId, (p) => ({
        ...p,
        is_liked: !isLiked,
        likes_count: Math.max(0, (p.likes_count || 0) + (isLiked ? -1 : 1))
      }));

      return { prevGroup, prevUser };
    },
    onError: (_err, _vars, ctx) => {
      // Server xətası → köhnə vəziyyətə qaytar
      ctx?.prevGroup?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      ctx?.prevUser?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    }
  });
};

/**
 * Şərh like toggle — optimistic (postlarla eyni prinsip).
 * Əvvəllər CommentReply xam supabase + tam refetch edirdi.
 */
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: {commentId: string;isLiked: boolean;postId: string;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase.
        from('comment_likes').
        delete().
        eq('comment_id', commentId).
        eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.
        from('comment_likes').
        insert({ comment_id: commentId, user_id: user.id });
        if (error && (error as any).code !== '23505') throw error;
      }
    },
    onMutate: async ({ commentId, isLiked, postId }) => {
      await queryClient.cancelQueries({ queryKey: ['post-comments', postId] });
      const prev = queryClient.getQueryData(['post-comments', postId]);

      queryClient.setQueryData(['post-comments', postId], (old: any) =>
      Array.isArray(old) ?
      old.map((c: any) => c.id === commentId ?
      { ...c, is_liked: !isLiked, likes_count: Math.max(0, (c.likes_count || 0) + (isLiked ? -1 : 1)) } :
      c) :
      old
      );

      return { prev };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(['post-comments', vars.postId], ctx.prev);
    }
  });
};

/**
 * @param enabled Şərhlər panelinin AÇIQ olub-olmadığı (PostCard.showComments).
 *   Əvvəllər BU HOOK hər feed-də görünən post üçün QEYD-ŞƏRTSİZ çağırılırdı
 *   (150 posta qədər feed-də = 150 paralel sorğu, N+1 performans problemi) —
 *   indi yalnız istifadəçi "Şərhlər" panelini açanda sorğu/kanal yaranır.
 */
export const usePostComments = (postId: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const isEnabled = !!postId && enabled;

  // Real-time: yeni/redaktə/silinmiş şərhlər gələn kimi paneli yenilə —
  // əvvəllər post_comments üçün HEÇ bir realtime abunəlik yox idi, başqa
  // istifadəçinin şərhi yalnız tam remount/30san staleTime-da görünürdü.
  useEffect(() => {
    if (!isEnabled) return;
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isEnabled, postId, queryClient]);

  return useQuery({
    queryKey: ['post-comments', postId],
    enabled: isEnabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: comments, error } = await supabase.
      from('post_comments').
      select('*').
      eq('post_id', postId).
      eq('is_active', true).
      order('created_at', { ascending: true });

      if (error) throw error;

      const authorMap = await getPublicProfileCards((comments || []).map((c: any) => c.user_id));

      // Şərh like-ları — TƏK batch sorğu (əvvəllər hər şərh üçün ayrıca — N+1)
      const likedSet = new Set<string>();
      if (user && comments && comments.length > 0) {
        const { data: likeRows } = await supabase.
        from('comment_likes').
        select('comment_id').
        eq('user_id', user.id).
        in('comment_id', comments.map((c: any) => c.id));
        (likeRows || []).forEach((r: any) => likedSet.add(r.comment_id));
      }

      const commentsWithDetails = (comments || []).map((comment: any) => {
        const authorData = authorMap[comment.user_id];
        const isAnon = comment.is_anonymous === true;
        return {
          ...comment,
          author: isAnon ?
          { name: 'Anonim', avatar_url: null, badge_type: null, is_verified: false, verified_until: null } :
          authorData ?
          {
            name: authorData.name || tr("usecommunity_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"),
            avatar_url: authorData.avatar_url || null,
            badge_type: authorData.badge_type || null,
            is_verified: authorData.is_verified || false,
            verified_until: authorData.verified_until || null
          } :
          { name: tr("usecommunity_istifadeci_b6bdd6", "İstifadəçi"), avatar_url: null, badge_type: null, is_verified: false, verified_until: null },
          is_liked: likedSet.has(comment.id)
        };
      });

      return commentsWithDetails as PostComment[];
    }
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      parentCommentId,
      postAuthorId,
      commenterName,
      isAnonymous







    }: {postId: string;content: string;parentCommentId?: string | null;postAuthorId?: string;commenterName?: string;isAnonymous?: boolean;}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.
      from('post_comments').
      insert({
        post_id: postId,
        user_id: user.id,
        parent_comment_id: parentCommentId ?? null,
        content,
        is_anonymous: isAnonymous || false
      });

      if (error) throw error;

      if (postAuthorId && postAuthorId !== user.id) {
        const preview = content.length > 50 ? `${content.slice(0, 50)}...` : content;
        const senderName = isAnonymous ? 'Anonim' : commenterName?.trim() || tr("usecommunity_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i");

        // Push notification (also stores in-app notification via edge function)
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: postAuthorId,
              title: parentCommentId ? tr("usecommunity_yeni_cavab_3b1b2c", "Yeni cavab 💬") : tr("usecommunity_yeni_serh_25bb56", "Yeni \u015F\u0259rh \uD83D\uDCAC"),
              body: `${senderName}: ${preview}`,
              data: { type: parentCommentId ? 'community_reply' : 'community_comment', postId, context: 'community_post' }
            }
          });
        } catch (e) {console.error('Comment notification error:', e);}
      }
    },
    // Optimistic insert — əvvəllər BUNUN ƏVƏZİNƏ heç nə yox idi ("insert →
    // invalidate → şəbəkə round-trip gözlə") — buna görə öz şərhin bəzən
    // gecikirdi/heç görünmürdü. İndi dərhal (server cavabını gözləmədən)
    // panelə əlavə olunur; uğursuz olarsa onError geri qaytarır.
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['post-comments', vars.postId] });
      const prev = queryClient.getQueryData<PostComment[]>(['post-comments', vars.postId]);

      const optimisticComment: PostComment = {
        id: `optimistic-${Date.now()}`,
        post_id: vars.postId,
        user_id: 'optimistic',
        parent_comment_id: vars.parentCommentId ?? null,
        content: vars.content,
        likes_count: 0,
        created_at: new Date().toISOString(),
        is_anonymous: vars.isAnonymous || false,
        author: vars.isAnonymous ?
        { name: 'Anonim', avatar_url: null, badge_type: null, is_verified: false, verified_until: null } :
        { name: vars.commenterName || tr("usecommunity_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i"), avatar_url: null, badge_type: null, is_verified: false, verified_until: null },
        is_liked: false
      };

      queryClient.setQueryData<PostComment[]>(
        ['post-comments', vars.postId],
        (old) => [...(old || []), optimisticComment]
      );

      return { prev };
    },
    onError: (err: any, vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(['post-comments', vars.postId], ctx.prev);
      toast({ title: tr("usecommunity_xeta_bas_verdi_f22fba", "Xəta baş verdi"), description: err?.message, variant: 'destructive' });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    }
  });
};

export const useAutoJoinGroups = () => {
  const queryClient = useQueryClient();

  const autoJoin = useCallback(async (profile: {
    life_stage?: string;
    baby_birth_date?: string;
    baby_gender?: string;
    multiples_type?: string;
    due_date?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all auto-join groups
    const { data: groups } = await supabase.
    from('community_groups').
    select('*').
    eq('is_active', true).
    eq('is_auto_join', true);

    if (!groups) return;

    // Get user's current memberships
    const { data: memberships } = await supabase.
    from('group_memberships').
    select('group_id').
    eq('user_id', user.id);

    const memberGroupIds = new Set(memberships?.map((m) => m.group_id) || []);

    // Check each group's criteria
    for (const group of groups) {
      if (memberGroupIds.has(group.id)) continue;

      const criteria = group.auto_join_criteria as Record<string, any> | null;
      if (!criteria) continue;

      let shouldJoin = true;

      // Check life stage
      if (criteria.life_stage && criteria.life_stage !== profile.life_stage) {
        shouldJoin = false;
      }

      // Check birth month for mommy stage
      if (criteria.birth_month && profile.baby_birth_date) {
        const birthMonth = profile.baby_birth_date.substring(0, 7);
        if (criteria.birth_month !== birthMonth) {
          shouldJoin = false;
        }
      }

      // Check baby gender
      if (criteria.baby_gender && criteria.baby_gender !== profile.baby_gender) {
        shouldJoin = false;
      }

      // Check multiples type
      if (criteria.multiples_type && criteria.multiples_type !== profile.multiples_type) {
        shouldJoin = false;
      }

      // Check pregnancy month
      if (criteria.pregnancy_month && profile.due_date) {
        const dueDate = new Date(profile.due_date);
        const now = new Date();
        const weeksPregnant = Math.floor((dueDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const monthsPregnant = Math.ceil((40 - weeksPregnant) / 4);
        if (criteria.pregnancy_month !== monthsPregnant) {
          shouldJoin = false;
        }
      }

      if (shouldJoin) {
        await supabase.
        from('group_memberships').
        insert({ group_id: group.id, user_id: user.id }).
        then(() => {});
      }
    }

    queryClient.invalidateQueries({ queryKey: ['user-memberships'] });
  }, [queryClient]);

  return { autoJoin };
}; 
