import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: number | null;
  symptoms: string[] | null;
  water_intake: number | null;
  temperature: number | null;
  bleeding: string | null;
  notes: string | null;
  created_at: string;
}

export const useDailyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      
      setLogs(data || []);
      
      // Check for today's log
      const today = new Date().toISOString().split('T')[0];
      const todayData = data?.find(log => log.log_date === today) || null;
      setTodayLog(todayData);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (log: Omit<DailyLog, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert({
          ...log,
          user_id: user.id,
          log_date: log.log_date || new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,log_date'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchLogs();
      return { data, error: null };
    } catch (error) {
      console.error('Error adding daily log:', error);
      return { data: null, error };
    }
  };

  const updateWaterIntake = async (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const currentIntake = todayLog?.water_intake || 0;
    
    return addLog({
      log_date: today,
      water_intake: currentIntake + amount,
      mood: todayLog?.mood || null,
      symptoms: todayLog?.symptoms || null,
      temperature: todayLog?.temperature || null,
      bleeding: todayLog?.bleeding || null,
      notes: todayLog?.notes || null
    });
  };

  const updateMood = async (mood: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    return addLog({
      log_date: today,
      mood,
      water_intake: todayLog?.water_intake || 0,
      symptoms: todayLog?.symptoms || null,
      temperature: todayLog?.temperature || null,
      bleeding: todayLog?.bleeding || null,
      notes: todayLog?.notes || null
    });
  };

  const updateSymptoms = async (symptoms: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    return addLog({
      log_date: today,
      symptoms,
      mood: todayLog?.mood || null,
      water_intake: todayLog?.water_intake || 0,
      temperature: todayLog?.temperature || null,
      bleeding: todayLog?.bleeding || null,
      notes: todayLog?.notes || null
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return {
    logs,
    todayLog,
    loading,
    addLog,
    updateWaterIntake,
    updateMood,
    updateSymptoms,
    refetch: fetchLogs
  };
};
