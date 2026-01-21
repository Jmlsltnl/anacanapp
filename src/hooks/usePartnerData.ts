import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

    // Set up realtime subscription for partner's daily logs
    if (profile?.linked_partner_id) {
      const channel = supabase
        .channel('partner-logs')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'daily_logs'
          },
          () => {
            fetchPartnerData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.linked_partner_id]);

  // Calculate pregnancy week if partner is in 'bump' stage
  const getPregnancyWeek = (): number => {
    if (!partnerProfile?.last_period_date || partnerProfile.life_stage !== 'bump') {
      return 0;
    }
    const lastPeriod = new Date(partnerProfile.last_period_date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  };

  // Calculate days until due date
  const getDaysUntilDue = (): number => {
    if (!partnerProfile?.due_date) {
      // Calculate from last period if no due date set
      if (partnerProfile?.last_period_date) {
        const lastPeriod = new Date(partnerProfile.last_period_date);
        const dueDate = new Date(lastPeriod.getTime() + 280 * 24 * 60 * 60 * 1000);
        return Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      }
      return 0;
    }
    const due = new Date(partnerProfile.due_date);
    return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  // Get baby age in days for 'mommy' stage
  const getBabyAgeDays = (): number => {
    if (!partnerProfile?.baby_birth_date || partnerProfile.life_stage !== 'mommy') {
      return 0;
    }
    const birthDate = new Date(partnerProfile.baby_birth_date);
    return Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return {
    partnerProfile,
    partnerDailyLog,
    loading,
    error,
    refetch: fetchPartnerData,
    getPregnancyWeek,
    getDaysUntilDue,
    getBabyAgeDays,
  };
};
