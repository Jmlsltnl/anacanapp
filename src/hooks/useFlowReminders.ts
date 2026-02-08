import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ReminderType = 'period_start' | 'period_end' | 'ovulation' | 'fertile_start' | 'fertile_end' | 'pms' | 'pill' | 'custom';

export interface FlowReminder {
  id: string;
  user_id: string;
  reminder_type: ReminderType;
  days_before: number;
  time_of_day: string;
  is_enabled: boolean;
  title: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export const REMINDER_TYPE_INFO: Record<ReminderType, { label: string; labelAz: string; emoji: string; description: string }> = {
  period_start: { label: 'Period Start', labelAz: 'Period Başlanğıcı', emoji: '🔴', description: 'Period başlamadan əvvəl xəbərdar ol' },
  period_end: { label: 'Period End', labelAz: 'Period Sonu', emoji: '✅', description: 'Period bitəndə xəbərdar ol' },
  ovulation: { label: 'Ovulation', labelAz: 'Ovulyasiya', emoji: '🌸', description: 'Ovulyasiya günündən əvvəl xəbərdar ol' },
  fertile_start: { label: 'Fertile Window Start', labelAz: 'Məhsuldar Günlər', emoji: '💕', description: 'Məhsuldar günlər başlayanda xəbərdar ol' },
  fertile_end: { label: 'Fertile Window End', labelAz: 'Məhsuldar Günlər Sonu', emoji: '📅', description: 'Məhsuldar günlər bitəndə xəbərdar ol' },
  pms: { label: 'PMS', labelAz: 'PMS Dövrü', emoji: '⚡', description: 'PMS dövrü başlayanda xəbərdar ol' },
  pill: { label: 'Pill Reminder', labelAz: 'Həb Xatırlatması', emoji: '💊', description: 'Gündəlik həb xatırlatması' },
  custom: { label: 'Custom', labelAz: 'Xüsusi', emoji: '🔔', description: 'Xüsusi xatırlatma' },
};

export const useFlowReminders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flow-reminders'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('flow_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) throw error;
      return data as FlowReminder[];
    },
    enabled: !!user?.id,
  });
};

export const useSaveFlowReminder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: Partial<FlowReminder> & { reminder_type: ReminderType }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('flow_reminders')
        .upsert({
          ...reminder,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,reminder_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-reminders'] });
    },
  });
};

export const useToggleReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from('flow_reminders')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-reminders'] });
    },
  });
};

export const useDeleteFlowReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flow_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-reminders'] });
    },
  });
};

// Initialize default reminders for a new user
export const useInitializeFlowReminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const defaultReminders: Omit<FlowReminder, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          user_id: user.id,
          reminder_type: 'period_start',
          days_before: 2,
          time_of_day: '09:00',
          is_enabled: true,
          title: 'Period yaxınlaşır',
          message: 'Perioda 2 gün qaldı, hazır ol!',
        },
        {
          user_id: user.id,
          reminder_type: 'ovulation',
          days_before: 1,
          time_of_day: '09:00',
          is_enabled: true,
          title: 'Ovulyasiya günü',
          message: 'Sabah ovulyasiya günüdür!',
        },
        {
          user_id: user.id,
          reminder_type: 'fertile_start',
          days_before: 1,
          time_of_day: '09:00',
          is_enabled: true,
          title: 'Məhsuldar günlər',
          message: 'Sabahdan məhsuldar günlər başlayır!',
        },
      ];

      const { error } = await supabase
        .from('flow_reminders')
        .upsert(defaultReminders, { onConflict: 'user_id,reminder_type' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-reminders'] });
    },
  });
};
