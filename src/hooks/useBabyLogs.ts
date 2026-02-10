import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useChildren } from './useChildren';

export interface BabyLog {
  id: string;
  user_id: string;
  child_id: string | null;
  log_type: 'feeding' | 'sleep' | 'diaper';
  start_time: string;
  end_time: string | null;
  feed_type: string | null;
  diaper_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeedingHistoryItem {
  id: string;
  feedType: 'left' | 'right' | 'formula' | 'solid';
  startTime: Date;
  endTime: Date | null;
  durationSeconds: number;
  date: string;
}

export const useBabyLogs = () => {
  const { user } = useAuth();
  const { selectedChild } = useChildren();
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<BabyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch last 7 days of logs for history
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let query = supabase
        .from('baby_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', sevenDaysAgo.toISOString())
        .order('start_time', { ascending: false });

      // Filter by selected child if available
      if (selectedChild) {
        query = query.eq('child_id', selectedChild.id);
      }

      const { data, error } = await query;

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
  }, [user, selectedChild]);

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
          child_id: selectedChild?.id || null,
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

  // Get feeding history for last N days
  const getFeedingHistory = useCallback((days: number = 3): Map<string, FeedingHistoryItem[]> => {
    const feedingLogs = logs.filter(l => l.log_type === 'feeding');
    const historyMap = new Map<string, FeedingHistoryItem[]>();
    
    // Get date strings for last N days
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Initialize map with empty arrays
    dates.forEach(date => historyMap.set(date, []));
    
    feedingLogs.forEach(log => {
      const dateStr = log.start_time.split('T')[0];
      if (!dates.includes(dateStr)) return;
      
      const startTime = new Date(log.start_time);
      const endTime = log.end_time ? new Date(log.end_time) : null;
      const durationSeconds = endTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : 0;
      
      // Normalize feed type
      let feedType: 'left' | 'right' | 'formula' | 'solid' = 'left';
      if (log.feed_type === 'breast_left' || log.feed_type === 'left') {
        feedType = 'left';
      } else if (log.feed_type === 'breast_right' || log.feed_type === 'right') {
        feedType = 'right';
      } else if (log.feed_type === 'formula') {
        feedType = 'formula';
      } else if (log.feed_type === 'solid') {
        feedType = 'solid';
      }
      
      const existingItems = historyMap.get(dateStr) || [];
      existingItems.push({
        id: log.id,
        feedType,
        startTime,
        endTime,
        durationSeconds,
        date: dateStr,
      });
      historyMap.set(dateStr, existingItems);
    });
    
    return historyMap;
  }, [logs]);

  // Get today's feeding stats with detailed breakdown
  const getTodayFeedingBreakdown = useMemo(() => {
    const feedingLogs = todayLogs.filter(l => l.log_type === 'feeding');
    
    let leftCount = 0;
    let rightCount = 0;
    let leftTotalSeconds = 0;
    let rightTotalSeconds = 0;
    let formulaCount = 0;
    let solidCount = 0;
    
    feedingLogs.forEach(log => {
      const startTime = new Date(log.start_time);
      const endTime = log.end_time ? new Date(log.end_time) : null;
      const durationSeconds = endTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
        : 0;
      
      if (log.feed_type === 'breast_left' || log.feed_type === 'left') {
        leftCount++;
        leftTotalSeconds += durationSeconds;
      } else if (log.feed_type === 'breast_right' || log.feed_type === 'right') {
        rightCount++;
        rightTotalSeconds += durationSeconds;
      } else if (log.feed_type === 'formula') {
        formulaCount++;
      } else if (log.feed_type === 'solid') {
        solidCount++;
      }
    });
    
    return {
      leftCount,
      rightCount,
      leftTotalSeconds,
      rightTotalSeconds,
      formulaCount,
      solidCount,
      totalBreastFeedings: leftCount + rightCount,
      totalBreastSeconds: leftTotalSeconds + rightTotalSeconds,
    };
  }, [todayLogs]);

  const getTodayStats = useCallback(() => {
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

    // Count feeding by type - support both old and new format
    const breastFeedingCount = feedingLogs.filter(l => 
      l.feed_type === 'breast_left' || l.feed_type === 'breast_right' || 
      l.feed_type === 'left' || l.feed_type === 'right'
    ).length;
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
  }, [todayLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('baby_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'baby_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLogs]);

  return {
    logs,
    todayLogs,
    loading,
    addLog,
    getTodayStats,
    getFeedingHistory,
    getTodayFeedingBreakdown,
    refetch: fetchLogs
  };
};
