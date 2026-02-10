import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface PartnerDailyTip {
  id: string;
  tip_text: string;
  tip_text_az: string | null;
  tip_emoji: string;
  life_stage: string;
  week_number: number | null;
  sort_order: number;
}

// Fetch partner daily tips from database
export const usePartnerDailyTips = (lifeStage?: string) => {
  return useQuery({
    queryKey: ['partner-daily-tips', lifeStage],
    queryFn: async () => {
      let query = supabase
        .from('partner_daily_tips')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (lifeStage) {
        query = query.eq('life_stage', lifeStage);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching partner daily tips:', error);
        return [];
      }

      return data as PartnerDailyTip[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Get a random daily tip based on date (changes daily)
export const useDailyTip = (lifeStage?: string, weekNumber?: number) => {
  const { data: tips = [], isLoading } = usePartnerDailyTips(lifeStage);

  const dailyTip = useMemo(() => {
    if (!tips.length) return null;

    // Filter by week if provided
    let filteredTips = tips;
    if (weekNumber) {
      const weekSpecific = tips.filter(t => t.week_number === weekNumber);
      if (weekSpecific.length > 0) {
        filteredTips = weekSpecific;
      } else {
        // Fallback to general tips (no week specified)
        filteredTips = tips.filter(t => !t.week_number);
      }
    }

    if (!filteredTips.length) {
      filteredTips = tips;
    }

    // Use date to get consistent daily tip
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const index = dayOfYear % filteredTips.length;
    
    return filteredTips[index];
  }, [tips, weekNumber]);

  return {
    tip: dailyTip,
    isLoading,
    tipText: dailyTip?.tip_text_az || dailyTip?.tip_text || 'Həyat yoldaşınıza bu gün gözəl bir jest edin!',
    tipEmoji: dailyTip?.tip_emoji || '💕',
  };
};

// Static fallback tips
export const FALLBACK_PARTNER_TIPS = [
  { tip_text_az: 'Həyat yoldaşınıza bu gün gözəl bir jest edin!', tip_emoji: '💕' },
  { tip_text_az: 'Ona sevdiyi qəlyanaltı alın', tip_emoji: '🍫' },
  { tip_text_az: 'Ayaq masajı etməyi təklif edin', tip_emoji: '💆' },
  { tip_text_az: 'Ona bu gün nə qədər gözəl göründüyünü söyləyin', tip_emoji: '💕' },
  { tip_text_az: 'Ev işlərinə kömək edin', tip_emoji: '🧹' },
];
