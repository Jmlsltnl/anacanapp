import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tr } from '@/lib/tr';

// Global leaderboard support for Mini Games.
// NOTE: reads/writes are wrapped defensively — if the `game_scores` table
// hasn't been migrated to a given Supabase project yet, these hooks simply
// degrade to an empty leaderboard instead of throwing, so gameplay (which is
// fully local-first via useLocalGameProgress) is never blocked.

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  bestScore: number;
  bestLevel: number;
  isCurrentUser?: boolean;
}

export function useGameLeaderboard(gameId: string, limit = 20) {
  return useQuery({
    queryKey: ['game-leaderboard', gameId, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('game_scores' as any)
        .select('user_id, best_score, best_level')
        .eq('game_id', gameId)
        .order('best_score', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      const rows = data as unknown as { user_id: string; best_score: number; best_level: number }[];
      if (rows.length === 0) return [];

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      // Use the public, RLS-safe profile projection (regular `profiles` rows are
      // only readable by their owner/partner/admin — see public_profile_cards).
      const { data: profiles } = await supabase
        .from('public_profile_cards' as any)
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileRows = (profiles || []) as unknown as {
        user_id: string;
        name: string | null;
        avatar_url: string | null;
      }[];
      const profileMap = new Map(profileRows.map((p) => [p.user_id, p]));

      return rows.map((r) => ({
        userId: r.user_id,
        name: profileMap.get(r.user_id)?.name || tr("games_user_fallback", "Anacan istifadəçisi"),
        avatarUrl: profileMap.get(r.user_id)?.avatar_url || null,
        bestScore: r.best_score,
        bestLevel: r.best_level,
      }));
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useMyGameScore(gameId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-game-score', gameId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('game_scores' as any)
        .select('best_score, best_level, total_plays')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as { best_score: number; best_level: number; total_plays: number };
    },
    enabled: !!user,
    retry: false,
  });
}

export function useSubmitGameScore(gameId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ score, level }: { score: number; level: number }) => {
      if (!user) return null;

      // Fetch current best first so we only ever upgrade the record.
      const { data: existing } = await supabase
        .from('game_scores' as any)
        .select('best_score, best_level, total_plays')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();

      const row = existing as unknown as { best_score: number; best_level: number; total_plays: number } | null;
      const nextBestScore = Math.max(row?.best_score || 0, score);
      const nextBestLevel = Math.max(row?.best_level || 1, level);
      const nextPlays = (row?.total_plays || 0) + 1;

      const { error } = await supabase.from('game_scores' as any).upsert(
        {
          user_id: user.id,
          game_id: gameId,
          best_score: nextBestScore,
          best_level: nextBestLevel,
          total_plays: nextPlays,
        },
        { onConflict: 'user_id,game_id' }
      );

      if (error) throw error;
      return { bestScore: nextBestScore, bestLevel: nextBestLevel };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-leaderboard', gameId] });
      queryClient.invalidateQueries({ queryKey: ['my-game-score', gameId] });
    },
    // Never let a failed remote sync surface as a crash — local progress already saved.
    onError: () => {},
  });
}
