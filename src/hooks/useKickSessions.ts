import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface KickSession {
  id: string;
  user_id: string;
  kick_count: number;
  duration_seconds: number;
  session_date: string;
  created_at: string;
}

export const useKickSessions = () => {
  const [sessions, setSessions] = useState<KickSession[]>([]);
  const [todaySessions, setTodaySessions] = useState<KickSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('kick_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSessions(data || []);
      
      // Filter today's sessions
      const today = new Date().toISOString().split('T')[0];
      setTodaySessions((data || []).filter(s => s.session_date === today));
    } catch (error: any) {
      console.error('Error fetching kick sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (kickCount: number, durationSeconds: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('kick_sessions')
        .insert({
          user_id: user.id,
          kick_count: kickCount,
          duration_seconds: durationSeconds,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sessiya yadda saxlandı! 👶',
        description: `${kickCount} təpik, ${Math.floor(durationSeconds / 60)} dəqiqə`,
      });

      await fetchSessions();
      return data;
    } catch (error: any) {
      console.error('Error adding kick session:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getTodayStats = () => {
    const totalKicks = todaySessions.reduce((sum, s) => sum + s.kick_count, 0);
    const totalDuration = todaySessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    return { totalKicks, totalDuration, sessionCount: todaySessions.length };
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('kick_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kick_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sessions,
    todaySessions,
    loading,
    addSession,
    getTodayStats,
    refetch: fetchSessions,
  };
};
