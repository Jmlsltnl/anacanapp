import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PremiumModal } from '@/components/PremiumModal';
import { tr } from '@/lib/tr';

/**
 * Win-back kartı — abunəliyi ləğv etmiş / bitmiş istifadəçilərə
 * geri qayıtma təklifi. 7 gündə bir dəfədən çox göstərilmir (dismiss throttle).
 *
 * variant="banner"  → dashboard-da kompakt sıra
 * variant="card"    → BillingScreen-də tam kart
 */

const DISMISS_KEY = 'anacan_winback_dismissed_at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 3600 * 1000;

interface Props {
  variant?: 'banner' | 'card';
}

const WinBackCard = ({ variant = 'card' }: Props) => {
  const { subscription, isPremium, cancelledButActive } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return Date.now() - at < DISMISS_COOLDOWN_MS;
    } catch {return false;}
  });

  // Hədəf auditoriya: (1) ləğv edib amma hələ aktivdir → qərarı dəyişdir,
  // (2) premium bitib (expired) → geri qazan. Aktiv premium görməz.
  const isExpiredPremium = !isPremium && subscription?.status === 'expired';
  const eligible = cancelledButActive || isExpiredPremium;

  if (!eligible || dismissed && variant === 'banner') return null;

  const dismiss = () => {
    setDismissed(true);
    try {localStorage.setItem(DISMISS_KEY, String(Date.now()));} catch {/* boş */}
  };

  const title = cancelledButActive ?
  tr('winback_cancelled_title', 'Sizi itirmək istəmirik 💛') :
  tr('winback_expired_title', 'Premium-suz darıxdıq 💛');
  const text = cancelledButActive ?
  tr('winback_cancelled_text', 'Abunəliyiniz ləğv edilib. Fikrinizi dəyişsəniz, bütün imkanlar bir toxunuş uzağındadır.') :
  tr('winback_expired_text', 'AI bələdçi, hesabatlar və bütün alətlər sizi gözləyir — 3 gün pulsuz yenidən sınayın.');

  if (variant === 'banner') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="a-card flex items-center gap-3"
          style={{ padding: '12px 14px', marginBottom: 12, border: '1px solid var(--a-peach-2)', cursor: 'pointer' }}
          onClick={() => setShowPaywall(true)}>

          <span className="w-10 h-10 grid place-items-center shrink-0" style={{ borderRadius: 13, background: 'var(--a-grad-peach)' }}>
            <Heart size={17} strokeWidth={2.2} style={{ color: 'var(--a-accent-ink)' }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="a-list-title" style={{ fontSize: 13.5 }}>{title}</p>
            <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{tr('winback_banner_cta', '3 gün pulsuz geri qayıdın')}</p>
          </div>
          <button
            onClick={(e) => {e.stopPropagation();dismiss();}}
            aria-label={tr('winback_dismiss', 'Bağla')}
            style={{ background: 'var(--a-surface-soft)', border: 'none', width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--a-ink-soft)' }}>
            <X size={13} strokeWidth={2.4} />
          </button>
        </motion.div>
        <PremiumModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="winback" />
      </>);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="a-card relative overflow-hidden"
        style={{ marginTop: 12, border: '2px solid var(--a-peach-2)' }}>

        <span className="absolute top-0 right-0" aria-hidden
        style={{ width: 120, height: 120, borderRadius: 999, background: 'var(--a-peach-1)', opacity: 0.5, transform: 'translate(35%, -35%)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="w-11 h-11 grid place-items-center shrink-0" style={{ borderRadius: 14, background: 'var(--a-grad-peach)' }}>
              <Heart size={19} strokeWidth={2.2} style={{ color: 'var(--a-accent-ink)' }} />
            </span>
            <h3 className="a-heading" style={{ fontSize: 16.5, color: 'var(--a-ink)', margin: 0 }}>{title}</h3>
          </div>
          <p className="a-list-sub" style={{ whiteSpace: 'normal', marginBottom: 14 }}>{text}</p>
          <button
            className="a-cta-btn w-full"
            style={{ justifyContent: 'center', height: 48 }}
            onClick={() => setShowPaywall(true)}>
            <Sparkles size={15} strokeWidth={2.2} />
            {tr('winback_cta', 'Yenidən qoşul — 3 gün pulsuz')}
          </button>
        </div>
      </motion.div>
      <PremiumModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="winback" />
    </>);
};

export default WinBackCard;
