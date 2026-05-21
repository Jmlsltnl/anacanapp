import { useCallback } from 'react';
import { tr } from '@/lib/tr';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type NotificationType = 'mood_update' | 'contraction_started' | 'contraction_511' | 'kick_session' | 'water_goal';

const notificationMessages: Record<NotificationType, { title: string; getBody: (data?: any) => string }> = {
  mood_update: {
    title: tr("usepartnernotifications_ehval_yenilendi_967cd7", "Əhval yeniləndi 💭"),
    getBody: (data) => {
      const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];
      const mood = data?.mood;
      return mood ? `Partnyorunuz bu gün ${moodEmojis[mood - 1]} hiss edir` : 'Partnyorunuz əhvalını qeyd etdi';
    }
  },
  contraction_started: {
    title: tr("usepartnernotifications_sanci_basladi_c51f20", "Sancı başladı! ⏱️"),
    getBody: () => 'Partnyorunuz sancı qeyd etdi. Ona dəstək olmaq vaxtıdır!'
  },
  contraction_511: {
    title: tr("usepartnernotifications_5_1_1_qaydasi_976061", "⚠️ 5-1-1 Qaydası!"),
    getBody: () => 'Sancılar 5 dəq aralığında və 1 dəq davam edir. Xəstəxanaya getmə vaxtı ola bilər!'
  },
  kick_session: {
    title: tr("usepartnernotifications_korpe_tepik_atdi_628b12", "Körpə təpik atdı! 👶"),
    getBody: (data) => `Körpə ${data?.kickCount || 0} dəfə təpik atdı!`
  },
  water_goal: {
    title: tr("usepartnernotifications_su_hedefine_catdi_55f2fb", "Su hədəfinə çatdı! 💧"),
    getBody: () => 'Partnyorunuz gündəlik su hədəfinə çatdı!'
  }
};

export const usePartnerNotifications = () => {
  const { user, profile } = useAuth();

  // Get partner's user_id from linked_partner_id
  const getPartnerUserId = useCallback(async (): Promise<string | null> => {
    if (!profile?.linked_partner_id) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profile.linked_partner_id)
        .single();

      if (error || !data) return null;
      return data.user_id;
    } catch {
      return null;
    }
  }, [profile?.linked_partner_id]);

  // Send notification to partner via partner_messages table
  const notifyPartner = useCallback(async (
    type: NotificationType,
    data?: Record<string, any>
  ) => {
    if (!user) return;

    const partnerUserId = await getPartnerUserId();
    if (!partnerUserId) return;

    const notification = notificationMessages[type];
    const content = JSON.stringify({
      type,
      title: notification.title,
      body: notification.getBody(data),
      data,
      timestamp: new Date().toISOString()
    });

    try {
      await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerUserId,
        message_type: type,
        content,
      });
    } catch (error) {
      console.error('Error sending partner notification:', error);
    }
  }, [user, getPartnerUserId]);

  // Convenience methods for specific notification types
  const notifyMoodUpdate = useCallback((mood: number) => {
    return notifyPartner('mood_update', { mood });
  }, [notifyPartner]);

  const notifyContractionStarted = useCallback((durationSeconds: number, intervalSeconds?: number) => {
    return notifyPartner('contraction_started', { durationSeconds, intervalSeconds });
  }, [notifyPartner]);

  const notifyContraction511 = useCallback(() => {
    return notifyPartner('contraction_511');
  }, [notifyPartner]);

  const notifyKickSession = useCallback((kickCount: number, durationSeconds: number) => {
    return notifyPartner('kick_session', { kickCount, durationSeconds });
  }, [notifyPartner]);

  const notifyWaterGoal = useCallback(() => {
    return notifyPartner('water_goal');
  }, [notifyPartner]);

  return {
    notifyPartner,
    notifyMoodUpdate,
    notifyContractionStarted,
    notifyContraction511,
    notifyKickSession,
    notifyWaterGoal,
  };
};
