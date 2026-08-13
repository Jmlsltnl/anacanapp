import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock, Loader2, Shield } from 'lucide-react';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/revenuecat';
import { useToast } from '@/hooks/use-toast';
import { parseIsoTrialDays } from '@/components/paywall/PaywallCore';
import { tr } from '@/lib/tr';

/**
 * Son şans endirim/trial təklifi — tam custom (a-* stil).
 * "Pulsuz Başla" birbaşa illik paketi alır (Purchases.purchase binding);
 * RevenueCat native paywall UI istifadə olunmur.
 */

interface DiscountedPaywallStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function DiscountedPaywallStep({ onAccept, onDecline }: DiscountedPaywallStepProps) {
  const { toast } = useToast();
  const { isSupported, isPurchasing, purchaseYearly, packages, error } = useInAppPurchase();
  const [busy, setBusy] = useState(false);

  const yearlyPkg = packages.find((p) => p.packageType === 'ANNUAL' || p.product.identifier.includes('yearly') || p.product.identifier.includes('annual'));
  const trialDays = parseIsoTrialDays(yearlyPkg?.product.defaultOptionTrialPeriod) ?? 3;
  const priceStr = yearlyPkg?.product.priceString || '';

  const handleAccept = async () => {
    if (busy || isPurchasing) return;

    // Web / İAP yoxdursa — funnel bloklanmır
    if (!isNativePlatform() || !isSupported) {
      onAccept();
      return;
    }

    setBusy(true);
    try {
      const ok = await purchaseYearly();
      if (ok) {
        toast({
          title: tr('pw_success_title', 'Premium aktivləşdirildi! 🎉'),
          description: tr('dps_trial_started', '{days} günlük pulsuz dövrünüz başladı').replace('{days}', String(trialDays))
        });
        onAccept();
      } else if (error) {
        toast({ title: tr('dps_purchase_failed', 'Alış uğursuz'), description: error, variant: 'destructive' });
      }
    } finally {
      setBusy(false);
    }
  };

  const working = busy || isPurchasing;

  return (
    <div className="a-scope relative flex flex-col items-center justify-center min-h-full px-6 py-8 text-center" style={{ background: 'var(--a-bg)' }}>
      <div className="a-sky" aria-hidden>
        <span className="a-cloud c1" />
        <span className="a-cloud c2" />
        <span className="a-cloud c4" />
      </div>

      <div className="relative z-[1] w-full max-w-md mx-auto">
        {/* Hədiyyə hero */}
        <motion.div
          initial={{ scale: 0, rotate: -14 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="mx-auto mb-5 grid place-items-center relative"
          style={{
            width: 76, height: 76, borderRadius: 26,
            background: 'var(--a-grad-pink)',
            boxShadow: '0 18px 36px -14px rgba(177, 39, 91, 0.5)'
          }}>
          <Gift size={34} strokeWidth={2} style={{ color: 'var(--a-berry-ink)' }} />
          <motion.span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 text-base"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8 }}>
            🎁
          </motion.span>
        </motion.div>

        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--a-ink)', margin: '0 0 6px' }}>
          {tr('dps_wait', 'Bir dəqiqə! 🎀')}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--a-ink)', margin: '0 0 2px' }}>
          {tr('dps_special_offer', 'Xüsusi təklif — yalnız sizin üçün')}
        </p>
        <p className="a-list-sub" style={{ whiteSpace: 'normal', marginBottom: 22 }}>
          {tr('dps_try_free', 'Premium-u {days} gün tamamilə pulsuz sınayın').replace('{days}', String(trialDays))}
        </p>

        {/* Təklif kartı */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="a-card relative overflow-hidden text-center"
          style={{ padding: '22px 18px', marginBottom: 20, border: '2px solid var(--a-peach-2)' }}>

          <span className="absolute top-0 right-0" aria-hidden
          style={{ width: 110, height: 110, borderRadius: 999, background: 'var(--a-peach-1)', opacity: 0.55, transform: 'translate(35%, -35%)' }} />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 mb-2.5"
            style={{ background: 'var(--a-yellow-1)', color: 'var(--a-warn-ink)', borderRadius: 999, padding: '4px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
              <Clock size={11} strokeWidth={2.4} />
              {tr('dps_once_only', 'BU TƏKLİF YALNIZ 1 DƏFƏ GÖSTƏRİLİR')}
            </div>

            <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--a-ink)', margin: '0 0 4px' }}>
              {tr('dps_free_premium', '{days} Gün Pulsuz Premium').replace('{days}', String(trialDays))}
            </p>
            <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>
              {tr('dps_full_access', 'Bütün funksiyalara tam giriş. Bəyənməsəniz, heç bir ödəniş tutulmur.')}
              {priceStr && ` ${tr('dps_then_price', 'Sonra {price}/il.').replace('{price}', priceStr)}`}
            </p>
          </div>
        </motion.div>

        {/* CTA-lar */}
        <motion.button
          onClick={handleAccept}
          disabled={working}
          whileTap={{ scale: working ? 1 : 0.98 }}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: 56, borderRadius: 999, border: 'none',
            background: 'linear-gradient(135deg, var(--a-peach-2), #e86a4c)',
            color: '#fff', fontSize: 15.5, fontWeight: 800, cursor: working ? 'default' : 'pointer',
            boxShadow: '0 18px 36px -12px rgba(217, 108, 74, 0.65)',
            opacity: working ? 0.65 : 1
          }}>
          {working ?
          <><Loader2 size={17} className="animate-spin" /> {tr('paywall_emal_edilir', 'Emal edilir...')}</> :

          <>🎁 {tr('dps_start_free', 'Pulsuz Başla')}</>
          }
        </motion.button>

        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Shield size={12} style={{ color: 'var(--a-green-ink)' }} />
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--a-ink-soft)' }}>
            {tr('dps_cancel_anytime', 'İstənilən vaxt ləğv edin — sual verilmir')}
          </span>
        </div>

        <button
          onClick={onDecline}
          disabled={working}
          className="w-full py-3.5 mt-2 disabled:opacity-50"
          style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--a-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {tr('dps_no_thanks', 'Xeyr, pulsuz davam edirəm')}
        </button>
      </div>
    </div>);

}
