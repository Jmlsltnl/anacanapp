import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { differenceInDays, format } from 'date-fns';

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

      // KRİTİK TZ DÜZƏLİŞİ: toISOString() lokal gecəyarısını UTC-yə çevirir —
      // UTC+4-də seçilən gün BAZADA 1 GÜN ƏVVƏL kimi yazılırdı (toxunulan
      // nöqtə ilə görünən nöqtə uyğunsuzluğunun kökü). Lokal format istifadə et.
      const dateStr = format(date, 'yyyy-MM-dd');

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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['period-day-logs'] });
      // Sync in background without awaiting to avoid re-render loops
      syncPeriodLogsToProfile(user!.id, queryClient).catch(console.error);
    },
  });
};

// Fizioloji ağlabatan tsikl uzunluğu — bundan kənar dəyərlər KEÇMİŞ tsikli
// korlamaq əvəzinə null yazılır (statistikaya da düşmür)
const MIN_CYCLE_LEN = 15;
const MAX_CYCLE_LEN = 60;
const saneCycleLen = (n: number): number | null =>
n >= MIN_CYCLE_LEN && n <= MAX_CYCLE_LEN ? n : null;

/**
 * After period days are toggled on calendar, sync the most recent
 * contiguous period block to profile & cycle_history.
 *
 * BUG DÜZƏLİŞLƏRİ:
 *  1) life_stage='flow' QORUMASI — əvvəllər hamilə (bump) istifadəçi köhnə
 *     period loglarına toxunanda LMP-si (hamiləlik həftəsi!) səssizcə
 *     dəyişirdi.
 *  2) REDAKTƏ ≠ YENİ TSİKL — əvvəllər başlanğıc tarixini düzəltmək "yeni
 *     tsikl" sayılırdı: əvvəlki tsiklin tarixi/uzunluğu əzilir, 1-2 günlük
 *     saxta tsikllər + dublikat sətirlər yaranırdı. İndi ±12 gün daxilindəki
 *     dəyişiklik mövcud tsiklin REDAKTƏSİ sayılır.
 *  3) Köhnə tarixçə redaktəsi LMP-ni GERİ çəkmir.
 */
async function syncPeriodLogsToProfile(userId: string, queryClient: any) {
  try {
    // Profil konteksti: bu sinxronizasiya YALNIZ flow istifadəçiləri üçündür
    const { data: prof } = await supabase
      .from('profiles')
      .select('life_stage, last_period_date')
      .eq('user_id', userId)
      .maybeSingle();

    if (!prof || prof.life_stage !== 'flow') return;

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

    // Mövcud son tsikl sətri — redaktə/yeni qərarını LMP yox, BU verir
    const { data: lastCycle } = await supabase
      .from('cycle_history')
      .select('cycle_number, start_date')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    // startDiff > 0 → yeni block son tsikldən SONRA; < 0 → ƏVVƏL
    const startDiff = lastCycle?.start_date ?
    differenceInDays(new Date(periodStart), new Date(lastCycle.start_date)) :
    null;

    // KÖHNƏ TARİXÇƏ REDAKTƏSİ: block son tsikldən xeyli (>12 gün) ƏVVƏLdirsə,
    // istifadəçi keçmiş ayları düzəldir — NƏ LMP-yə, NƏ tsikl sətirlərinə toxun
    // (əks halda LMP geri çəkilir, cari tsikl "silinmiş" kimi görünürdü).
    if (startDiff !== null && startDiff < -12) {
      queryClient.invalidateQueries({ queryKey: ['cycle-history'] });
      return;
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({
        last_period_date: periodStart,
        period_length: periodLength,
      })
      .eq('user_id', userId);

    // Update local store (batch to avoid multiple re-renders)
    const store = useUserStore.getState();
    const currentLPD = store.lastPeriodDate ? format(new Date(store.lastPeriodDate), 'yyyy-MM-dd') : null;
    if (currentLPD !== periodStart || store.periodLength !== periodLength) {
      store.setLastPeriodDate(new Date(periodStart));
      store.setPeriodLength(periodLength);

      // Health inteqrasiyası aktivdirsə → Apple Health / Health Connect-ə yaz (arxa planda).
      if (currentLPD !== periodStart) {
        import('@/lib/healthCycle').then((m) =>
          m.writePeriodToHealth(new Date(periodStart), periodLength || 5)
        ).catch(() => {});
      }
    }

    // ── cycle_history: REDAKTƏ vs YENİ TSİKL ──
    if (!lastCycle) {
      // İlk tsikl
      await supabase.from('cycle_history').insert({
        user_id: userId,
        cycle_number: 1,
        start_date: periodStart,
        period_length: periodLength,
      });
    } else if (lastCycle.start_date === periodStart) {
      // Eyni başlanğıc — yalnız uzunluq yenilənir
      await supabase
        .from('cycle_history')
        .update({ period_length: periodLength })
        .eq('user_id', userId)
        .eq('cycle_number', lastCycle.cycle_number);
    } else if (startDiff !== null && Math.abs(startDiff) <= 12) {
      // REDAKTƏ: istifadəçi CARİ tsiklin başlanğıcını düzəldir (±12 gün) —
      // yeni sətir YARADILMIR, mövcud sətrin start_date-i yenilənir.
      await supabase
        .from('cycle_history')
        .update({ start_date: periodStart, period_length: periodLength })
        .eq('user_id', userId)
        .eq('cycle_number', lastCycle.cycle_number);

      // Əvvəlki tsiklin end_date/cycle_length-i yeni başlanğıca uyğunlaşdırılır
      // (sanity xaricindədirsə null — statistika zəhərlənmir)
      const { data: prevCycle } = await supabase
        .from('cycle_history')
        .select('cycle_number, start_date')
        .eq('user_id', userId)
        .eq('cycle_number', lastCycle.cycle_number - 1)
        .maybeSingle();
      if (prevCycle?.start_date) {
        const prevLen = differenceInDays(new Date(periodStart), new Date(prevCycle.start_date));
        await supabase
          .from('cycle_history')
          .update({ end_date: periodStart, cycle_length: saneCycleLen(prevLen) })
          .eq('user_id', userId)
          .eq('cycle_number', prevCycle.cycle_number);
      }
    } else {
      // YENİ TSİKL (>12 gün sonra): əvvəlkini sanity-qoruma ilə bağla
      const cycleLen = startDiff as number;
      await supabase
        .from('cycle_history')
        .update({ end_date: periodStart, cycle_length: saneCycleLen(cycleLen) })
        .eq('user_id', userId)
        .eq('cycle_number', lastCycle.cycle_number);

      await supabase
        .from('cycle_history')
        .insert({
          user_id: userId,
          cycle_number: lastCycle.cycle_number + 1,
          start_date: periodStart,
          period_length: periodLength,
        });
    }

    // ── ADAPTİV PROQNOZ: tamamlanmış tsikllərdən çəkili ortalama ilə
    //    profiles.cycle_length-i yenilə → dashboard, təqvim, partnyor görünüşü
    //    və server bildirişləri (send-flow-reminders) avtomatik öyrənmiş olur.
    try {
      const { data: allCycles } = await supabase
        .from('cycle_history')
        .select('*')
        .eq('user_id', userId)
        .order('cycle_number', { ascending: false })
        .limit(12);

      if (allCycles && allCycles.length > 0) {
        const { computeAdaptiveCycleStats } = await import('@/lib/cycle-predictions');
        const adaptive = computeAdaptiveCycleStats(allCycles as any, store.cycleLength || 28, periodLength);

        if (adaptive.basedOnCycles >= 2 && adaptive.predictedCycleLength !== store.cycleLength) {
          await supabase
            .from('profiles')
            .update({ cycle_length: adaptive.predictedCycleLength })
            .eq('user_id', userId);
          store.setCycleLength(adaptive.predictedCycleLength);
        }
      }
    } catch (adaptErr) {
      console.warn('Adaptive cycle length update skipped:', adaptErr);
    }

    queryClient.invalidateQueries({ queryKey: ['cycle-history'] });
  } catch (err) {
    console.error('Error syncing period logs:', err);
  }
}
