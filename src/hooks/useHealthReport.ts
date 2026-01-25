import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, startOfMonth, subDays, subMonths, format } from 'date-fns';

interface HealthTrend {
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}

interface HealthReportData {
  trends: HealthTrend[];
  isLoading: boolean;
}

// Calculate health trends from user's actual data
export const useHealthReport = (period: string = '1month'): HealthReportData => {
  const { profile } = useAuth();

  // Get date range based on period
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    switch (period) {
      case '1week':
        start = subDays(now, 7);
        break;
      case '1month':
        start = subMonths(now, 1);
        break;
      case '3months':
        start = subMonths(now, 3);
        break;
      case 'all':
        start = new Date(2020, 0, 1); // Far back date
        break;
      default:
        start = subMonths(now, 1);
    }
    
    return { startDate: start, endDate: now };
  }, [period]);

  // Fetch weight entries
  const { data: weightEntries = [], isLoading: weightLoading } = useQuery({
    queryKey: ['weight-entries-report', profile?.user_id, period],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  // Fetch daily logs for water and mood
  const { data: dailyLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['daily-logs-report', profile?.user_id, period],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('log_date', format(startDate, 'yyyy-MM-dd'))
        .lte('log_date', format(endDate, 'yyyy-MM-dd'))
        .order('log_date', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  // Fetch exercise logs
  const { data: exerciseLogs = [], isLoading: exerciseLoading } = useQuery({
    queryKey: ['exercise-logs-report', profile?.user_id, period],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  // Calculate trends
  const trends = useMemo((): HealthTrend[] => {
    const result: HealthTrend[] = [];

    // Weight trend
    if (weightEntries.length > 0) {
      const latestWeight = weightEntries[weightEntries.length - 1]?.weight || 0;
      const firstWeight = weightEntries[0]?.weight || latestWeight;
      const weightChange = latestWeight - firstWeight;
      result.push({
        label: 'Orta çəki',
        value: `${latestWeight.toFixed(1)} kq`,
        trend: weightChange >= 0 ? `+${weightChange.toFixed(1)} kq` : `${weightChange.toFixed(1)} kq`,
        positive: profile?.life_stage === 'bump' ? weightChange >= 0 : weightChange <= 0,
      });
    } else {
      result.push({
        label: 'Orta çəki',
        value: 'Məlumat yoxdur',
        trend: '-',
        positive: true,
      });
    }

    // Water intake trend
    if (dailyLogs.length > 0) {
      const avgWater = dailyLogs.reduce((sum, log) => sum + (log.water_intake || 0), 0) / dailyLogs.length;
      const halfIndex = Math.floor(dailyLogs.length / 2);
      const firstHalfAvg = halfIndex > 0 
        ? dailyLogs.slice(0, halfIndex).reduce((sum, log) => sum + (log.water_intake || 0), 0) / halfIndex 
        : avgWater;
      const secondHalfAvg = halfIndex > 0 
        ? dailyLogs.slice(halfIndex).reduce((sum, log) => sum + (log.water_intake || 0), 0) / (dailyLogs.length - halfIndex)
        : avgWater;
      const waterChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100) : 0;
      
      result.push({
        label: 'Su qəbulu',
        value: `${avgWater.toFixed(1)} stəkan/gün`,
        trend: waterChange >= 0 ? `+${waterChange.toFixed(0)}%` : `${waterChange.toFixed(0)}%`,
        positive: waterChange >= 0,
      });
    } else {
      result.push({
        label: 'Su qəbulu',
        value: 'Məlumat yoxdur',
        trend: '-',
        positive: true,
      });
    }

    // Mood trend (average mood)
    if (dailyLogs.length > 0) {
      const logsWithMood = dailyLogs.filter(log => log.mood != null);
      if (logsWithMood.length > 0) {
        const avgMood = logsWithMood.reduce((sum, log) => sum + (log.mood || 0), 0) / logsWithMood.length;
        const moodLabels = ['Çox pis', 'Pis', 'Normal', 'Yaxşı', 'Əla'];
        const moodText = moodLabels[Math.round(avgMood) - 1] || 'Normal';
        
        result.push({
          label: 'Orta əhval',
          value: moodText,
          trend: avgMood >= 3.5 ? '😊' : avgMood >= 2.5 ? '😐' : '😔',
          positive: avgMood >= 3,
        });
      }
    }

    // Exercise frequency
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksInPeriod = Math.max(1, Math.ceil(daysInPeriod / 7));
    const exercisePerWeek = exerciseLogs.length / weeksInPeriod;
    
    result.push({
      label: 'Məşqlər',
      value: `${exercisePerWeek.toFixed(1)} dəfə/həftə`,
      trend: exercisePerWeek >= 3 ? 'Əla!' : exercisePerWeek >= 1 ? 'Yaxşı' : 'Artırın',
      positive: exercisePerWeek >= 2,
    });

    return result;
  }, [weightEntries, dailyLogs, exerciseLogs, profile?.life_stage, startDate, endDate]);

  return {
    trends,
    isLoading: weightLoading || logsLoading || exerciseLoading,
  };
};
