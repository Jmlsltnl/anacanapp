import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  reminder_enabled: boolean;
  created_at: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment: {
    title: string;
    description?: string;
    event_date: string;
    event_time?: string;
    event_type?: string;
    reminder_enabled?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          ...appointment,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Randevu əlavə edildi! 📅',
        description: appointment.title,
      });

      await fetchAppointments();
      return data;
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchAppointments();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Randevu silindi',
      });

      await fetchAppointments();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
    }
  };

  const getUpcoming = (days: number = 7) => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.event_date);
      return aptDate >= today && aptDate <= endDate;
    });
  };

  const getByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.event_date === dateStr);
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getUpcoming,
    getByDate,
    refetch: fetchAppointments,
  };
};
