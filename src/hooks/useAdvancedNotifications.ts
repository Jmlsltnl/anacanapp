import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ==================== PREGNANCY DAY NOTIFICATIONS ====================
export interface PregnancyDayNotification {
  id: string;
  day_number: number;
  title: string;
  body: string;
  emoji: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const usePregnancyDayNotifications = () => {
  return useQuery({
    queryKey: ['pregnancy-day-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pregnancy_day_notifications')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error fetching pregnancy day notifications:', error);
        throw error;
      }

      return data as PregnancyDayNotification[];
    },
  });
};

export const useCreatePregnancyDayNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<PregnancyDayNotification, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pregnancy_day_notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-day-notifications'] });
    },
  });
};

export const useUpdatePregnancyDayNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PregnancyDayNotification> & { id: string }) => {
      const { error } = await supabase
        .from('pregnancy_day_notifications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-day-notifications'] });
    },
  });
};

export const useDeletePregnancyDayNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pregnancy_day_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-day-notifications'] });
    },
  });
};

// ==================== BULK PUSH NOTIFICATIONS ====================
export interface BulkPushNotification {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number;
  total_failed: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  created_by: string | null;
  created_at: string;
}

export const useBulkPushNotifications = () => {
  return useQuery({
    queryKey: ['bulk-push-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_push_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching bulk notifications:', error);
        throw error;
      }

      return data as BulkPushNotification[];
    },
  });
};

export const useCreateBulkPushNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Pick<BulkPushNotification, 'title' | 'body' | 'target_audience'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bulk_push_notifications')
        .insert({
          ...notification,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BulkPushNotification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-push-notifications'] });
    },
  });
};

export const useSendBulkPushNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase.functions.invoke('send-bulk-push', {
        body: { notificationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-push-notifications'] });
    },
  });
};

// ==================== GET NOTIFICATION FOR PREGNANCY DAY ====================
export const usePregnancyDayNotificationByDay = (day: number | null) => {
  return useQuery({
    queryKey: ['pregnancy-day-notification', day],
    queryFn: async () => {
      if (day === null || day < 0 || day > 280) return null;

      const { data, error } = await supabase
        .from('pregnancy_day_notifications')
        .select('*')
        .eq('day_number', day)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification for day:', error);
        return null;
      }

      return data as PregnancyDayNotification | null;
    },
    enabled: day !== null && day >= 0 && day <= 280,
  });
};
