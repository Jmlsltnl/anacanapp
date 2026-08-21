import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HandHeart, Siren, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { usePartnerMessages } from '@/hooks/usePartnerMessages';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { tr } from '@/lib/tr';
import MotherSOSSheet from './MotherSOSSheet';

/**
 * Ana dashboard-u — "Partnyorum" kartı.
 * Bu gün ondan gələn sevgi/mesajlar + Təşəkkür + SOS/Doğuş girişi.
 * Sürprizlər BİLƏRƏKDƏN göstərilmir (sürpriz qalsın!).
 */

interface Props {
  lifeStage?: string | null;
  onOpenSharing?: () => void;
}

const PartnerCareCard = ({ lifeStage, onOpenSharing }: Props) => {
  const { user, profile } = useAuth();
  const { partnerProfile } = usePartnerData(); // ana üçün: partnyorun profili
  const { messages } = usePartnerMessages();
  const { toast } = useToast();
  const [sosOpen, setSosOpen] = useState(false);
  const [thanking, setThanking] = useState(false);

  const todayStats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayFromPartner = (messages || []).filter((m: any) =>
    m.receiver_id === user?.id &&
    new Date(m.created_at) >= startOfDay
    );
    return {
      loves: todayFromPartner.filter((m: any) => m.message_type === 'love').length,
      texts: todayFromPartner.filter((m: any) => ['text', 'image', 'audio'].includes(m.message_type)).length
    };
  }, [messages, user?.id]);

  if (!profile?.linked_partner_id || !partnerProfile) return null;

  const partnerName = partnerProfile.name || tr('common_partnyor', 'Partnyor');

  const sendThankYou = async () => {
    if (!user || thanking) return;
    setThanking(true);
    await hapticFeedback.medium();
    const payload = {
      type: 'thank_you',
      title: tr('partnerv2_thank_title', '🙏 Təşəkkür aldınız!'),
      body: tr('partnerv2_thank_body', 'Xanımınız sizə minnətdardır. Əla iş görürsən!'),
      timestamp: new Date().toISOString()
    };
    try {
      // thank_you tipi (migration tətbiq olunmayıbsa mətnə düş)
      const { error } = await supabase.from('partner_messages').insert({
        sender_id: user.id,
        receiver_id: partnerProfile.user_id,
        message_type: 'thank_you',
        content: JSON.stringify(payload)
      });
      if (error) {
        await supabase.from('partner_messages').insert({
          sender_id: user.id,
          receiver_id: partnerProfile.user_id,
          message_type: 'text',
          content: tr('partnerv2_thank_fallback_text', '🙏 Təşəkkür edirəm! Sən əla partnyorsan!')
        });
      }
      try {
        const { invokeSendPush } = await import('@/lib/push');
        await invokeSendPush({
          userId: partnerProfile.user_id,
          title: payload.title,
          body: payload.body,
          data: { type: 'thank_you', context: 'partner' }
        });
      } catch {/* push optional */}
      toast({ title: tr('partnerv2_thank_sent', 'Təşəkkür göndərildi! 💙') });
    } catch (e) {
      console.error(e);
    } finally {
      setThanking(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="a-card"
        style={{ marginBottom: 14 }}>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--a-blue-1)' }}>
            💙
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate" style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--a-ink)' }}>{partnerName}</h3>
            <p style={{ fontSize: 11, color: 'var(--a-ink-soft)' }}>
              {todayStats.loves > 0 || todayStats.texts > 0 ?
              `${tr('partnerv2_bu_gun_short', 'Bu gün')}: ${todayStats.loves > 0 ? `${todayStats.loves} ❤️` : ''}${todayStats.loves > 0 && todayStats.texts > 0 ? ' · ' : ''}${todayStats.texts > 0 ? `${todayStats.texts} ${tr('partnerv2_mesaj', 'mesaj')}` : ''}` :
              tr('partnerv2_yaninizdadir', 'Yanınızdadır 💙')}
            </p>
          </div>
          {onOpenSharing &&
          <button onClick={onOpenSharing} className="a-icon-btn shrink-0" style={{ width: 34, height: 34 }} aria-label={tr('partnerv2_partnyor_nleri_gorur', 'Partnyor nələri görür?')}>
              <Settings2 size={14} />
            </button>
          }
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={sendThankYou}
            disabled={thanking}
            className="flex-1 flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ height: 42, borderRadius: 999, background: 'var(--a-blue-1)', color: 'var(--a-blue-ink)', fontSize: 12.5, fontWeight: 700 }}
            whileTap={{ scale: 0.96 }}>
            <HandHeart size={15} />
            {tr('partnerv2_tesekkur_et', 'Təşəkkür et')}
          </motion.button>
          <motion.button
            onClick={() => setSosOpen(true)}
            className="flex items-center justify-center gap-1.5"
            style={{ height: 42, borderRadius: 999, background: 'var(--a-alert-bg)', color: 'var(--a-alert-ink)', fontSize: 12.5, fontWeight: 800, padding: '0 18px' }}
            whileTap={{ scale: 0.96 }}>
            <Siren size={15} />
            SOS
          </motion.button>
        </div>
      </motion.div>

      <MotherSOSSheet open={sosOpen} onClose={() => setSosOpen(false)} lifeStage={lifeStage} />
    </>);

};

export default PartnerCareCard;
