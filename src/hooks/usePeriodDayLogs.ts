import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { differenceInDays } from 'date-fns';

export interface PeriodDayLog {
  id: string;
  user_id: string;
  log_date: string;
  flow_intensity: string | null;
  notes: string | null;
  created_at: string;
}

export const usePeriodDayLogs = (month?: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['period-day-logs', month?.getFullYear(), month?.getMonth()],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('period_day_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true });

      // If month specified, fetch ±1 month for edge cases
      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth() - 1, 1);
        const end = new Date(month.getFullYear(), month.getMonth() + 2, 0);
        query = query
          .gte('log_date', start.toISOString().split('T')[0])
          .lte('log_date', end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PeriodDayLog[];
    },
    enabled: !!user?.id,
  });
};

export const useTogglePeriodDay = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, flowIntensity = 'medium' }: { date: Date; flowIntensity?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = date.toISOString().split('T')[0];

      // Check if day already logged
      const { data: existing } = await supabase
        .from('period_day_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (existing) {
        // Remove the period day
        const { error } = await supabase
          .from('period_day_logs')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const, date: dateStr };
      } else {
        // Add the period day
        const { error } = await supabase
          .from('period_day_logs')
          .insert({
            user_id: user.id,
            log_date: dateStr,
            flow_intensity: flowIntensity,
          });
        if (error) throw error;
        return { action: 'added' as const, date: dateStr };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['period-day-logs'] });

      // After toggling, recalculate cycle data from logged period days
      await syncPeriodLogsToProfile(user!.id, queryClient);
    },
  });
};

/**
 * After period days are toggled on calendar, sync the most recent
 * contiguous period block to profile & cycle_history
 */
async function syncPeriodLogsToProfile(userId: string, queryClient: any) {
  try {
    // Get all period logs ordered by date desc
    const { data: logs } = await supabase
      .from('period_day_logs')
      .select('log_date')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(60);

    if (!logs || logs.length === 0) return;

    // Find the most recent contiguous period block
    const sortedDates = logs.map(l => l.log_date).sort();
    const blocks: string[][] = [];
    let currentBlock: string[] = [sortedDates[0]];

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = differenceInDays(curr, prev);

      if (diff <= 1) {
        currentBlock.push(sortedDates[i]);
      } else {
        blocks.push(currentBlock);
        currentBlock = [sortedDates[i]];
      }
    }
    blocks.push(currentBlock);

    // The last block (most recent) is the current/latest period
    const latestBlock = blocks[blocks.length - 1];
    if (!latestBlock || latestBlock.length === 0) return;

    const periodStart = latestBlock[0];
    const periodLength = latestBlock.length;

    // Update profile
    await supabase
      .from('profiles')
      .update({
        last_period_date: periodStart,
        period_length: periodLength,
      })
      .eq('user_id', userId);

    // Update local store
    useUserStore.getState().setLastPeriodDate(new Date(periodStart));
    useUserStore.getState().setPeriodLength(periodLength);

    // Update or insert cycle_history for this period
    const { data: lastCycle } = await supabase
      .from('cycle_history')
      .select('cycle_number, start_date')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCycle?.start_date === periodStart) {
      // Update existing cycle's period length
      await supabase
        .from('cycle_history')
        .update({ period_length: periodLength })
        .eq('user_id', userId)
        .eq('cycle_number', lastCycle.cycle_number);
    } else if (!lastCycle || lastCycle.start_date !== periodStart) {
      // Close previous cycle if exists
      if (lastCycle?.start_date) {
        const cycleLen = differenceInDays(new Date(periodStart), new Date(lastCycle.start_date));
        if (cycleLen > 0) {
          await supabase
            .from('cycle_history')
            .update({ end_date: periodStart, cycle_length: cycleLen })
            .eq('user_id', userId)
            .eq('cycle_number', lastCycle.cycle_number);
        }
      }

      // Insert new cycle
      await supabase
        .from('cycle_history')
        .insert({
          user_id: userId,
          cycle_number: (lastCycle?.cycle_number || 0) + 1,
          start_date: periodStart,
          period_length: periodLength,
        });
    }

    queryClient.invalidateQueries({ queryKey: ['cycle-history'] });
  } catch (err) {
    console.error('Error syncing period logs:', err);
  }
}
