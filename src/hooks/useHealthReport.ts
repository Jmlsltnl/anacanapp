import { useMemo } from 'react';
import { tr } from '@/lib/tr';
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
      const { data, error } = await supabase.
      from('weight_entries').
      select('*').
      eq('user_id', profile.user_id).
      gte('recorded_at', startDate.toISOString()).
      lte('recorded_at', endDate.toISOString()).
      order('recorded_at', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id
  });

  // Fetch daily logs for water and mood
  const { data: dailyLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['daily-logs-report', profile?.user_id, period],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase.
      from('daily_logs').
      select('*').
      eq('user_id', profile.user_id).
      gte('log_date', format(startDate, 'yyyy-MM-dd')).
      lte('log_date', format(endDate, 'yyyy-MM-dd')).
      order('log_date', { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id
  });

  // Fetch exercise logs
  const { data: exerciseLogs = [], isLoading: exerciseLoading } = useQuery({
    queryKey: ['exercise-logs-report', profile?.user_id, period],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase.
      from('exercise_logs').
      select('*').
      eq('user_id', profile.user_id).
      gte('completed_at', startDate.toISOString()).
      lte('completed_at', endDate.toISOString());
      if (error) return [];
      return data || [];
    },
    enabled: !!profile?.user_id
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
        label: tr("usehealthreport_orta_ceki_9c02ad", "Orta çəki"),
        value: `${latestWeight.toFixed(1)} kq`,
        trend: weightChange >= 0 ? `+${weightChange.toFixed(1)} kq` : `${weightChange.toFixed(1)} kq`,
        positive: profile?.life_stage === 'bump' ? weightChange >= 0 : weightChange <= 0
      });
    } else {
      result.push({
        label: tr("usehealthreport_orta_ceki_9c02ad", "Orta çəki"),
        value: tr("usehealthreport_melumat_yoxdur_a3e271", "M\u0259lumat yoxdur"),
        trend: '-',
        positive: true
      });
    }

    // Water intake trend
    if (dailyLogs.length > 0) {
      const avgWater = dailyLogs.reduce((sum, log) => sum + (log.water_intake || 0), 0) / dailyLogs.length;
      const halfIndex = Math.floor(dailyLogs.length / 2);
      const firstHalfAvg = halfIndex > 0 ?
      dailyLogs.slice(0, halfIndex).reduce((sum, log) => sum + (log.water_intake || 0), 0) / halfIndex :
      avgWater;
      const secondHalfAvg = halfIndex > 0 ?
      dailyLogs.slice(halfIndex).reduce((sum, log) => sum + (log.water_intake || 0), 0) / (dailyLogs.length - halfIndex) :
      avgWater;
      const waterChange = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100 : 0;

      result.push({
        label: tr("usehealthreport_su_qebulu_db1f3e", "Su qəbulu"),
        value: `${avgWater.toFixed(1)} ${tr("usehealthreport_stekan_gun", "stəkan/gün")}`,
        trend: waterChange >= 0 ? `+${waterChange.toFixed(0)}%` : `${waterChange.toFixed(0)}%`,
        positive: waterChange >= 0
      });
    } else {
      result.push({
        label: tr("usehealthreport_su_qebulu_db1f3e", "Su qəbulu"),
        value: tr("usehealthreport_melumat_yoxdur_a3e271", "M\u0259lumat yoxdur"),
        trend: '-',
        positive: true
      });
    }

    // Mood trend (average mood)
    if (dailyLogs.length > 0) {
      const logsWithMood = dailyLogs.filter((log) => log.mood != null);
      if (logsWithMood.length > 0) {
        const avgMood = logsWithMood.reduce((sum, log) => sum + (log.mood || 0), 0) / logsWithMood.length;
        const moodLabels = [tr("usehealthreport_cox_pis_e041c5", "\xC7ox pis"), tr("usehealthreport_pis", "Pis"), tr("usehealthreport_normal", "Normal"), tr("usehealthreport_yaxsi_9d8595", "Yax\u015F\u0131"), tr("usehealthreport_ela_720a0e", "\u018Fla")];
        const moodText = moodLabels[Math.round(avgMood) - 1] || 'Normal';

        result.push({
          label: tr("usehealthreport_orta_ehval_1f8ef9", "Orta əhval"),
          value: moodText,
          trend: avgMood >= 3.5 ? '😊' : avgMood >= 2.5 ? '😐' : '😔',
          positive: avgMood >= 3
        });
      }
    }

    // Exercise frequency
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksInPeriod = Math.max(1, Math.ceil(daysInPeriod / 7));
    const exercisePerWeek = exerciseLogs.length / weeksInPeriod;

    result.push({
      label: tr("usehealthreport_mesqler_603be9", "Məşqlər"),
      value: `${exercisePerWeek.toFixed(1)} ${tr("usehealthreport_defe_hefte", "dəfə/həftə")}`,
      trend: exercisePerWeek >= 3 ? tr("usehealthreport_ela_e6330a", "\u018Fla!") : exercisePerWeek >= 1 ? tr("usehealthreport_yaxsi_9d8595", "Yax\u015F\u0131") : tr("usehealthreport_artirin_c4ea43", "Art\u0131r\u0131n"),
      positive: exercisePerWeek >= 2
    });

    return result;
  }, [weightEntries, dailyLogs, exerciseLogs, profile?.life_stage, startDate, endDate]);

  return {
    trends,
    isLoading: weightLoading || logsLoading || exerciseLoading
  };
};