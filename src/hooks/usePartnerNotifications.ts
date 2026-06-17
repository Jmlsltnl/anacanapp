import { useCallback } from 'react';
import { tr } from '@/lib/tr';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type NotificationType = 'mood_update' | 'contraction_started' | 'contraction_511' | 'kick_session' | 'water_goal';

const notificationMessages: Record<NotificationType, {title: string;getBody: (data?: any) => string;}> = {
  mood_update: {
    title: tr("usepartnernotifications_ehval_yenilendi_967cd7", "Əhval yeniləndi 💭"),
    getBody: (data) => {
      const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];
      const mood = data?.mood;
      return mood ? tr("usepartnernotifications_partnyor_mood", "Partnyorunuz bu gün {mood} hiss edir").replace("{mood}", moodEmojis[mood - 1]) : tr("usepartnernotifications_partnyorunuz_ehvalini_qeyd_etd_612302", "Partnyorunuz əhvalını qeyd etdi");
    }
  },
  contraction_started: {
    title: tr("usepartnernotifications_sanci_basladi_c51f20", "Sancı başladı! ⏱️"),
    getBody: () => tr("usepartnernotifications_partnyorunuz_sanci_qeyd_etdi_o_369f2f", "Partnyorunuz sanc\u0131 qeyd etdi. Ona d\u0259st\u0259k olmaq vaxt\u0131d\u0131r!")
  },
  contraction_511: {
    title: tr("usepartnernotifications_5_1_1_qaydasi_976061", "⚠️ 5-1-1 Qaydası!"),
    getBody: () => tr("usepartnernotifications_sancilar_5_deq_araliginda_ve_1_da0619", "Sanc\u0131lar 5 d\u0259q aral\u0131\u011F\u0131nda v\u0259 1 d\u0259q davam edir. X\u0259st\u0259xanaya getm\u0259 vaxt\u0131 ola bil\u0259r!")
  },
  kick_session: {
    title: tr("usepartnernotifications_korpe_tepik_atdi_628b12", "Körpə təpik atdı! 👶"),
    getBody: (data) => tr("usepartnernotifications_baby_kicked", "Körpə {count} dəfə təpik atdı!").replace("{count}", String(data?.kickCount || 0))
  },
  water_goal: {
    title: tr("usepartnernotifications_su_hedefine_catdi_55f2fb", "Su hədəfinə çatdı! 💧"),
    getBody: () => tr("usepartnernotifications_partnyorunuz_gundelik_su_hedef_f06510", "Partnyorunuz g\xFCnd\u0259lik su h\u0259d\u0259fin\u0259 \xE7atd\u0131!")
  }
};

export const usePartnerNotifications = () => {
  const { user, profile } = useAuth();

  // Get partner's user_id from linked_partner_id
  const getPartnerUserId = useCallback(async (): Promise<string | null> => {
    if (!profile?.linked_partner_id) return null;

    try {
      const { data, error } = await supabase.
      from('profiles').
      select('user_id').
      eq('id', profile.linked_partner_id).
      single();

      if (error || !data) return null;
      return data.user_id;
    } catch {
      return null;
    }
  }, [profile?.linked_partner_id]);

  // Send notification to partner via partner_messages table
  const notifyPartner = useCallback(async (
  type: NotificationType,
  data?: Record<string, any>) =>
  {
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
        content
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
    notifyWaterGoal
  };
};