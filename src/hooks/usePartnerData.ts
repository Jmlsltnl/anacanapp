import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getPregnancyWeek, getDaysUntilDue as calcDaysUntilDue, getDaysElapsed, getRealCalendarAge } from '@/lib/pregnancy-utils';
import { getPhaseInfoForDate, type CyclePhaseInfo } from '@/lib/cycle-utils';

export interface PartnerWomanData {
  id: string;
  user_id: string;
  name: string;
  life_stage: 'flow' | 'bump' | 'mommy' | null;
  last_period_date: string | null;
  due_date: string | null;
  baby_birth_date: string | null;
  baby_name: string | null;
  baby_gender: 'boy' | 'girl' | null;
  cycle_length: number;
  period_length: number;
}

export interface PartnerDailyLog {
  mood: number | null;
  symptoms: string[] | null;
  water_intake: number | null;
  log_date: string;
}

export const usePartnerData = () => {
  const { profile } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState<PartnerWomanData | null>(null);
  const [partnerDailyLog, setPartnerDailyLog] = useState<PartnerDailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartnerData = async () => {
    if (!profile?.linked_partner_id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch partner's profile using the linked_partner_id
      const { data: partnerData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, name, life_stage, last_period_date, due_date, baby_birth_date, baby_name, baby_gender, cycle_length, period_length')
        .eq('id', profile.linked_partner_id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching partner profile:', profileError);
        setError('Partner məlumatları yüklənə bilmədi');
        setLoading(false);
        return;
      }

      if (partnerData) {
        setPartnerProfile(partnerData as PartnerWomanData);

        // Fetch today's daily log for the partner
        const today = new Date().toISOString().split('T')[0];
        const { data: logData, error: logError } = await supabase
          .from('daily_logs')
          .select('mood, symptoms, water_intake, log_date')
          .eq('user_id', partnerData.user_id)
          .eq('log_date', today)
          .maybeSingle();

        if (!logError && logData) {
          setPartnerDailyLog(logData);
        }
      }
    } catch (err) {
      console.error('Error in fetchPartnerData:', err);
      setError('Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();

    // Set up realtime subscription for partner's daily logs (filtered to this partner only)
    if (profile?.linked_partner_id) {
      const channel = supabase
        .channel(`partner-logs-${profile.linked_partner_id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'daily_logs',
          },
          (payload: any) => {
            // Client-side guard: only refetch when this partner's log changes
            const changedUserId = payload?.new?.user_id || payload?.old?.user_id;
            if (changedUserId && partnerProfile?.user_id && changedUserId !== partnerProfile.user_id) {
              return;
            }
            fetchPartnerData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.linked_partner_id, partnerProfile?.user_id]);

  // Calculate pregnancy week if partner is in 'bump' stage - using centralized utility
  const getPartnerPregnancyWeek = (): number => {
    if (!partnerProfile?.last_period_date || partnerProfile.life_stage !== 'bump') {
      return 0;
    }
    return getPregnancyWeek(partnerProfile.last_period_date);
  };

  // Calculate days until due date - using centralized utility
  const getPartnerDaysUntilDue = (): number => {
    if (!partnerProfile?.last_period_date && !partnerProfile?.due_date) {
      return 0;
    }
    return calcDaysUntilDue(partnerProfile.last_period_date, partnerProfile.due_date);
  };

  // Get baby age in days for 'mommy' stage
  const getBabyAgeDays = (): number => {
    if (!partnerProfile?.baby_birth_date || partnerProfile.life_stage !== 'mommy') {
      return 0;
    }
    return getRealCalendarAge(partnerProfile.baby_birth_date).totalDays;
  };

  // Get cycle phase info for 'flow' stage
  const getCyclePhaseInfo = (): CyclePhaseInfo | null => {
    if (!partnerProfile?.last_period_date || partnerProfile.life_stage !== 'flow') {
      return null;
    }
    return getPhaseInfoForDate(
      new Date(),
      new Date(partnerProfile.last_period_date),
      partnerProfile.cycle_length || 28,
      partnerProfile.period_length || 5
    );
  };

  // Days until next period for 'flow' stage
  const getDaysUntilNextPeriod = (): number => {
    if (!partnerProfile?.last_period_date || partnerProfile.life_stage !== 'flow') {
      return 0;
    }
    const cycleLength = partnerProfile.cycle_length || 28;
    const lmp = new Date(partnerProfile.last_period_date);
    const today = new Date();
    const daysSince = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const daysIntoCycle = ((daysSince % cycleLength) + cycleLength) % cycleLength;
    return Math.max(0, cycleLength - daysIntoCycle);
  };

  return {
    partnerProfile,
    partnerDailyLog,
    loading,
    error,
    refetch: fetchPartnerData,
    getPregnancyWeek: getPartnerPregnancyWeek,
    getDaysUntilDue: getPartnerDaysUntilDue,
    getBabyAgeDays,
    getCyclePhaseInfo,
    getDaysUntilNextPeriod,
  };
};
