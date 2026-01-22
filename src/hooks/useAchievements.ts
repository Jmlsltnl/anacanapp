import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Achievement definitions for all user types
export const ACHIEVEMENTS = {
  // Flow achievements
  flow: [
    { id: 'first_log', name: 'İlk qeyd', description: 'İlk gündəlik qeydinizi etdiniz', emoji: '📝', points: 10 },
    { id: 'water_champion', name: 'Su çempionu', description: '7 gün ardıcıl 8 stəkan su içdiniz', emoji: '💧', points: 50 },
    { id: 'symptom_tracker', name: 'Simptom izləyicisi', description: '30 gün simptom qeyd etdiniz', emoji: '📊', points: 100 },
    { id: 'cycle_expert', name: 'Dövr eksperti', description: '3 ay dövr izlədiniz', emoji: '🔄', points: 150 },
  ],
  // Bump achievements
  bump: [
    { id: 'first_kick', name: 'İlk təpik', description: 'İlk təpiki qeyd etdiniz', emoji: '👣', points: 10 },
    { id: 'kick_master', name: 'Təpik ustası', description: '100 təpik qeyd etdiniz', emoji: '🦶', points: 50 },
    { id: 'weight_tracker', name: 'Çəki izləyicisi', description: '10 çəki qeydi etdiniz', emoji: '⚖️', points: 30 },
    { id: 'trimester_1', name: '1-ci trimester', description: '1-ci trimestri tamamladınız', emoji: '🌱', points: 100 },
    { id: 'trimester_2', name: '2-ci trimester', description: '2-ci trimestri tamamladınız', emoji: '🌿', points: 150 },
    { id: 'trimester_3', name: '3-cü trimester', description: '3-cü trimestri tamamladınız', emoji: '🌳', points: 200 },
    { id: 'hospital_bag_ready', name: 'Xəstəxana çantası hazır', description: 'Xəstəxana çantasını tamamladınız', emoji: '🎒', points: 75 },
  ],
  // Mommy achievements
  mommy: [
    { id: 'first_feed', name: 'İlk qidalanma', description: 'İlk qidalanmanı qeyd etdiniz', emoji: '🍼', points: 10 },
    { id: 'feeding_pro', name: 'Qidalanma ustası', description: '100 qidalanma qeyd etdiniz', emoji: '🤱', points: 100 },
    { id: 'sleep_tracker', name: 'Yuxu izləyicisi', description: '50 yuxu qeyd etdiniz', emoji: '😴', points: 50 },
    { id: 'diaper_hero', name: 'Bez qəhrəmanı', description: '100 bez dəyişmə qeyd etdiniz', emoji: '👶', points: 75 },
    { id: 'milestone_first', name: 'İlk mərhələ', description: 'İlk inkişaf mərhələsini qeyd etdiniz', emoji: '⭐', points: 25 },
    { id: 'milestone_5', name: '5 mərhələ', description: '5 inkişaf mərhələsini qeyd etdiniz', emoji: '🏆', points: 100 },
  ],
  // Partner achievements
  partner: [
    { id: 'first_message', name: 'İlk mesaj', description: 'İlk mesajı göndərdiniz', emoji: '💬', points: 10 },
    { id: 'support_star', name: 'Dəstək ulduzu', description: '10 sevgi göndərdiniz', emoji: '❤️', points: 30 },
    { id: 'shopping_helper', name: 'Alış-veriş köməkçisi', description: '10 məhsul əlavə etdiniz', emoji: '🛒', points: 50 },
    { id: 'active_partner', name: 'Aktiv partner', description: '7 gün ardıcıl tətbiqi istifadə etdiniz', emoji: '🌟', points: 100 },
  ],
  // General achievements
  general: [
    { id: 'profile_complete', name: 'Profil tamamlandı', description: 'Profilinizi tamamladınız', emoji: '✅', points: 20 },
    { id: 'first_week', name: 'İlk həftə', description: 'Tətbiqi 1 həftə istifadə etdiniz', emoji: '📅', points: 25 },
    { id: 'first_month', name: 'İlk ay', description: 'Tətbiqi 1 ay istifadə etdiniz', emoji: '🗓️', points: 100 },
    { id: 'community_member', name: 'İcma üzvü', description: 'İlk paylaşımınızı etdiniz', emoji: '👥', points: 30 },
  ],
};

export interface Achievement {
  id: string;
  achievement_id: string;
  achievement_type: string;
  achieved_at: string;
  notified: boolean;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();

    // Subscribe to realtime updates
    if (user) {
      const channel = supabase
        .channel('achievements-channel')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'user_achievements',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newAchievement = payload.new as Achievement;
            setAchievements(prev => [newAchievement, ...prev]);
            
            // Find achievement details
            const allAchievements = Object.values(ACHIEVEMENTS).flat();
            const details = allAchievements.find(a => a.id === newAchievement.achievement_id);
            
            if (details && !newAchievement.notified) {
              toast({
                title: `🎉 Nailiyyət: ${details.name}`,
                description: details.description,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchAchievements, toast]);

  const unlockAchievement = useCallback(async (achievementId: string, achievementType: string) => {
    if (!user) return false;

    // Check if already unlocked
    const existing = achievements.find(a => a.achievement_id === achievementId);
    if (existing) return false;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          achievement_type: achievementType,
          notified: false,
        });

      if (error) {
        // Ignore duplicate key errors
        if (error.code === '23505') return false;
        throw error;
      }

      // Mark as notified after showing toast
      await supabase
        .from('user_achievements')
        .update({ notified: true })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }, [user, achievements]);

  const hasAchievement = useCallback((achievementId: string) => {
    return achievements.some(a => a.achievement_id === achievementId);
  }, [achievements]);

  const getAchievementsByType = useCallback((type: string) => {
    return achievements.filter(a => a.achievement_type === type);
  }, [achievements]);

  const getTotalPoints = useCallback(() => {
    const allAchievements = Object.values(ACHIEVEMENTS).flat();
    return achievements.reduce((total, a) => {
      const details = allAchievements.find(d => d.id === a.achievement_id);
      return total + (details?.points || 0);
    }, 0);
  }, [achievements]);

  return {
    achievements,
    loading,
    unlockAchievement,
    hasAchievement,
    getAchievementsByType,
    getTotalPoints,
    refetch: fetchAchievements,
    ACHIEVEMENTS,
  };
};
