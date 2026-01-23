import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BabyLog {
  id: string;
  user_id: string;
  log_type: 'feeding' | 'sleep' | 'diaper';
  start_time: string;
  end_time: string | null;
  feed_type: string | null;
  diaper_type: string | null;
  notes: string | null;
  created_at: string;
}

export const useBabyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<BabyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('baby_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLogs((data || []) as BabyLog[]);
      
      // Filter today's logs
      const today = new Date().toISOString().split('T')[0];
      const todayData = (data || []).filter(log => 
        log.start_time.startsWith(today)
      ) as BabyLog[];
      setTodayLogs(todayData);
    } catch (error) {
      console.error('Error fetching baby logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (log: {
    log_type: 'feeding' | 'sleep' | 'diaper';
    start_time?: string;
    end_time?: string | null;
    feed_type?: string | null;
    diaper_type?: string | null;
    notes?: string | null;
  }) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('baby_logs')
        .insert({
          ...log,
          user_id: user.id,
          start_time: log.start_time || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchLogs();
      return { data, error: null };
    } catch (error) {
      console.error('Error adding baby log:', error);
      return { data: null, error };
    }
  };

  const getTodayStats = () => {
    const feedingLogs = todayLogs.filter(l => l.log_type === 'feeding');
    const sleepLogs = todayLogs.filter(l => l.log_type === 'sleep');
    const diaperLogs = todayLogs.filter(l => l.log_type === 'diaper');

    // Calculate total sleep time
    let totalSleepMinutes = 0;
    sleepLogs.forEach(log => {
      if (log.end_time) {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        totalSleepMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });

    // Count feeding by type
    const breastFeedingCount = feedingLogs.filter(l => l.feed_type === 'breast_left' || l.feed_type === 'breast_right').length;
    const formulaCount = feedingLogs.filter(l => l.feed_type === 'formula').length;
    const solidCount = feedingLogs.filter(l => l.feed_type === 'solid').length;

    // Count diaper by type
    const wetCount = diaperLogs.filter(l => l.diaper_type === 'wet').length;
    const dirtyCount = diaperLogs.filter(l => l.diaper_type === 'dirty').length;
    const bothCount = diaperLogs.filter(l => l.diaper_type === 'mixed').length;

    return {
      feedingCount: feedingLogs.length,
      breastFeedingCount,
      formulaCount,
      solidCount,
      sleepHours: Math.round(totalSleepMinutes / 60 * 10) / 10,
      diaperCount: diaperLogs.length,
      wetCount,
      dirtyCount,
      bothCount,
      lastFeeding: feedingLogs[0] || null,
      lastSleep: sleepLogs[0] || null,
      lastDiaper: diaperLogs[0] || null,
      feedingLogs,
      diaperLogs,
    };
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return {
    logs,
    todayLogs,
    loading,
    addLog,
    getTodayStats,
    refetch: fetchLogs
  };
};
