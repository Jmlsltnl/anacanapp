import { useState, useEffect, useCallback } from 'react';
import { tr } from '@/lib/tr';
import { supabase } from '@/integrations/supabase/client';
import { localNotifications, isNative } from '@/lib/native';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface NotificationSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  water_reminder: boolean;
  vitamin_reminder: boolean;
  exercise_reminder: boolean;
  vitamin_time: string; // HH:MM format
  exercise_days: number[]; // 0-6 (Sunday-Saturday)
}

const defaultSettings: NotificationSettings = {
  notifications_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  water_reminder: true,
  vitamin_reminder: true,
  exercise_reminder: false,
  vitamin_time: '09:00',
  exercise_days: [1, 3, 5], // Monday, Wednesday, Friday
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('notifications_enabled, sound_enabled, vibration_enabled, water_reminder, vitamin_reminder, exercise_reminder, vitamin_time, exercise_days')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading notification settings:', error);
        }

        if (data) {
          setSettings({
            notifications_enabled: data.notifications_enabled ?? true,
            sound_enabled: data.sound_enabled ?? true,
            vibration_enabled: data.vibration_enabled ?? true,
            water_reminder: data.water_reminder ?? true,
            vitamin_reminder: data.vitamin_reminder ?? true,
            exercise_reminder: data.exercise_reminder ?? false,
            vitamin_time: data.vitamin_time ?? '09:00',
            exercise_days: data.exercise_days ?? [1, 3, 5],
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Schedule water reminders
  const scheduleWaterReminders = useCallback(async () => {
    if (!settings.notifications_enabled || !settings.water_reminder || !isNative) {
      return;
    }

    const now = new Date();
    const reminders = [];
    
    // Schedule reminders every 2 hours from 8am to 8pm
    for (let hour = 8; hour <= 20; hour += 2) {
      const reminderTime = new Date(now);
      reminderTime.setHours(hour, 0, 0, 0);
      
      if (reminderTime > now) {
        reminders.push({
          id: 100 + hour,
          title: tr("usenotificationsettings_su_icmek_vaxti_cecdf9", "Su içmək vaxtı! 💧"),
          body: 'Sağlamlığınız və körpəniz üçün su içməyi unutmayın.',
          schedule: { at: reminderTime }
        });
      }
    }

    if (reminders.length > 0) {
      await localNotifications.schedule(reminders);
      console.log(`Scheduled ${reminders.length} water reminders`);
    }
  }, [settings.notifications_enabled, settings.water_reminder]);

  // Schedule vitamin reminder
  const scheduleVitaminReminder = useCallback(async () => {
    if (!settings.notifications_enabled || !settings.vitamin_reminder || !isNative) {
      return;
    }

    const now = new Date();
    const [hours, minutes] = settings.vitamin_time.split(':').map(Number);
    
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If time passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await localNotifications.schedule([{
      id: 200,
      title: tr("usenotificationsettings_vitamin_vaxti_9bfc40", "Vitamin vaxtı! 💊"),
      body: 'Gündəlik prenatal vitaminlərinizi qəbul etməyi unutmayın.',
      schedule: { at: reminderTime }
    }]);

    console.log('Scheduled vitamin reminder for:', reminderTime);
  }, [settings.notifications_enabled, settings.vitamin_reminder, settings.vitamin_time]);

  // Schedule exercise reminders
  const scheduleExerciseReminders = useCallback(async () => {
    if (!settings.notifications_enabled || !settings.exercise_reminder || !isNative) {
      return;
    }

    const now = new Date();
    const reminders = [];

    // Schedule for next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      
      if (settings.exercise_days.includes(dayOfWeek)) {
        const reminderTime = new Date(checkDate);
        reminderTime.setHours(10, 0, 0, 0);
        
        if (reminderTime > now) {
          reminders.push({
            id: 300 + i,
            title: tr("usenotificationsettings_mesq_vaxti_4a1396", "Məşq vaxtı! 🧘‍♀️"),
            body: 'Hamiləlik üçün sağlam məşqlər edərək günə enerji ilə başlayın.',
            schedule: { at: reminderTime }
          });
        }
      }
    }

    if (reminders.length > 0) {
      await localNotifications.schedule(reminders);
      console.log(`Scheduled ${reminders.length} exercise reminders`);
    }
  }, [settings.notifications_enabled, settings.exercise_reminder, settings.exercise_days]);

  // Schedule appointment reminder
  const scheduleAppointmentReminder = useCallback(async (appointmentDate: Date, title: string) => {
    if (!settings.notifications_enabled || !isNative) {
      return;
    }

    const reminderTime = new Date(appointmentDate);
    reminderTime.setDate(reminderTime.getDate() - 1);
    reminderTime.setHours(10, 0, 0, 0);

    const now = new Date();
    if (reminderTime <= now) {
      // If reminder time passed, set for same day morning
      reminderTime.setTime(appointmentDate.getTime());
      reminderTime.setHours(8, 0, 0, 0);
      
      if (reminderTime <= now) {
        return; // Skip if appointment is too soon
      }
    }

    await localNotifications.schedule([{
      id: 400 + Math.floor(Math.random() * 100),
      title: 'Sabah randevunuz var! 📅',
      body: title,
      schedule: { at: reminderTime }
    }]);

    toast.success('Randevu xatırlatması təyin edildi');
  }, [settings.notifications_enabled]);

  // Update a single setting - persists to database
  const updateSetting = useCallback(async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Persist to database
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      // If no row exists, insert it
      if (error && error.code === 'PGRST116') {
        await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, [key]: value });
      } else if (error) {
        console.error('Error saving notification setting:', error);
        // Revert on error
        setSettings(settings);
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      setSettings(settings);
      return;
    }

    // Cancel all notifications if disabled
    if (key === 'notifications_enabled' && !value) {
      if (isNative) {
        await localNotifications.cancelAll();
      }
      toast.info('Bütün bildirişlər deaktiv edildi');
      return;
    }

    // Re-schedule notifications based on changes
    if (key === 'water_reminder') {
      if (value) {
        await scheduleWaterReminders();
        toast.success('Su xatırlatmaları aktivləşdirildi');
      } else {
        toast.info('Su xatırlatmaları deaktiv edildi');
      }
    }

    if (key === 'vitamin_reminder' || key === 'vitamin_time') {
      if (newSettings.vitamin_reminder) {
        await scheduleVitaminReminder();
        toast.success('Vitamin xatırlatması aktivləşdirildi');
      }
    }

    if (key === 'exercise_reminder' || key === 'exercise_days') {
      if (newSettings.exercise_reminder) {
        await scheduleExerciseReminders();
        toast.success('Məşq xatırlatmaları aktivləşdirildi');
      }
    }
  }, [user, settings, scheduleWaterReminders, scheduleVitaminReminder, scheduleExerciseReminders]);

  // Initialize all reminders
  const initializeReminders = useCallback(async () => {
    if (!settings.notifications_enabled || !isNative) return;

    // Request permissions first
    const permStatus = await localNotifications.requestPermissions();
    if (permStatus.display !== 'granted') {
      toast.error('Bildiriş icazəsi verilmədi');
      return;
    }

    // Schedule all enabled reminders
    await Promise.all([
      settings.water_reminder ? scheduleWaterReminders() : Promise.resolve(),
      settings.vitamin_reminder ? scheduleVitaminReminder() : Promise.resolve(),
      settings.exercise_reminder ? scheduleExerciseReminders() : Promise.resolve(),
    ]);

    console.log('All reminders initialized');
  }, [settings, scheduleWaterReminders, scheduleVitaminReminder, scheduleExerciseReminders]);

  return {
    settings,
    loading,
    updateSetting,
    scheduleAppointmentReminder,
    initializeReminders,
    isNative,
  };
};
