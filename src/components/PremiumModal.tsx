import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Loader2, RefreshCw, Lock, Check, Zap, Shield, Star, icons } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/iap';
import { useToast } from '@/hooks/use-toast';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { usePaywallConfig } from '@/hooks/usePaywallConfig';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { tr } from "@/lib/tr";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const { toast } = useToast();
  const { features: dbFeatures, plans: dbPlans, loading: configLoading } = usePremiumConfig();
  const paywallConfig = usePaywallConfig();
  const { isPremium, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const {
    packages, isLoading, isPurchasing, error, isSupported,
    purchaseMonthly, purchaseYearly, restorePurchases,
  } = useInAppPurchase();

  useEffect(() => {
    if (isPremium && subscription?.plan_type === 'premium') setSelectedPlan('yearly');
  }, [isPremium, subscription]);

  useEffect(() => {
    if (!isOpen) return;
    import('@/lib/analytics').then(m => m.analytics.logPaywallShown(feature || 'general')).catch(() => {});
    setTimeout(() => closeButtonRef.current?.focus(), 100);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPurchasing) { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [isOpen, onClose, isPurchasing]);

  const premiumPlan = dbPlans.find(p => p.plan_key === 'premium');
  const dbMonthlyPrice = premiumPlan?.price_monthly;
  const dbYearlyPrice = premiumPlan?.price_yearly;
  const dbCurrency = premiumPlan?.currency || 'AZN';
  const isNative = isNativePlatform();

  const monthlyProduct = packages.find(p => p?.product?.identifier?.includes('monthly'));
  const yearlyProduct = packages.find(p => p?.product?.identifier?.includes('yearly'));

  const currencySymbol = dbCurrency === 'AZN' ? '₼' : dbCurrency;
  const monthlyPrice = monthlyProduct?.product?.priceString || (dbMonthlyPrice ? `${dbMonthlyPrice}` : '9.99');
  const yearlyPrice = yearlyProduct?.product?.priceString || (dbYearlyPrice ? `${dbYearlyPrice}` : '79.99');
  const yearlyMonthly = yearlyProduct
    ? (yearlyProduct.product.price / 12).toFixed(2)
    : (dbYearlyPrice ? (dbYearlyPrice / 12).toFixed(2) : '6.67');

  const savingsPercent = dbMonthlyPrice && dbYearlyPrice
    ? Math.round((1 - dbYearlyPrice / (dbMonthlyPrice * 12)) * 100)
    : 44;

  const premiumOnlyFeatures = dbFeatures.filter(f => !f.is_included_free && f.is_included_premium);
  const limitedFreeFeatures = dbFeatures.filter(f => f.is_included_free && f.is_included_premium);
  const allFeatures = [...premiumOnlyFeatures, ...limitedFreeFeatures];

  const isCurrentlyMonthly = isPremium && subscription?.plan_type === 'premium';
  const showFreeTrial = paywallConfig.free_trial_enabled && !isPremium;
  const freeTrialNote = paywallConfig.free_trial_note.replace('{days}', String(paywallConfig.free_trial_days));
  const ctaText = showFreeTrial
    ? paywallConfig.free_trial_cta
    : isCurrentlyMonthly && selectedPlan === 'yearly'
      ? paywallConfig.cta_switch_yearly
      : isPremium ? paywallConfig.cta_upgrade : paywallConfig.cta_new_user;

  const handlePurchase = useCallback(async () => {
    if (!isNative) {
      toast({ title: tr("premiummodal_premium_movcud_deyil_821534", 'Premium mövcud deyil'), description: tr("premiummodal_premium_almaq_ucun_mobil_tetbiqi_yukleyi_8f5604", 'Premium almaq üçün mobil tətbiqi yükləyin.'), variant: 'destructive' });
      return;
    }
    import('@/lib/analytics').then(m => m.analytics.logPaywallClicked(feature || 'general', selectedPlan)).catch(() => {});
    const purchaseFn = selectedPlan === 'yearly' ? purchaseYearly : purchaseMonthly;
    const success = await purchaseFn();
    if (success) {
      import('@/lib/analytics').then(m => m.analytics.logPremiumSubscribed(selectedPlan)).catch(() => {});
      toast({ title: tr("premiummodal_premium_aktivlesdirildi_eb58f2", 'Premium aktivləşdirildi! 🎉'), description: tr("premiummodal_i_ndi_butun_xususiyyetlerden_istifade_ed_20a814", 'İndi bütün xüsusiyyətlərdən istifadə edə bilərsiniz.') });
      onClose();
    }
  }, [isNative, selectedPlan, purchaseYearly, purchaseMonthly, toast, onClose]);

  const handleRestore = useCallback(async () => {
    const success = await restorePurchases();
    if (success) {
      toast({ title: tr("premiummodal_alislar_berpa_edildi_42cc61", 'Alışlar bərpa edildi'), description: tr("premiummodal_premium_abuneliyiniz_aktivlesdirildi_edabd7", 'Premium abunəliyiniz aktivləşdirildi.') });
      onClose();
    } else {
      toast({ title: tr("premiummodal_alis_tapilmadi_a77421", 'Alış tapılmadı'), description: tr("premiummodal_evvelki_premium_abunelik_tapilmadi_88feae", 'Əvvəlki premium abunəlik tapılmadı.'), variant: 'destructive' });
    }
  }, [restorePurchases, toast, onClose]);

  const renderPillIcon = (iconName: string) => {
    const IconComp = icons[iconName as keyof typeof icons];
    return IconComp ? <IconComp className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />;
  };

  const savingsBadgeText = paywallConfig.savings_badge.replace('{percent}', String(savingsPercent));
  const featureLockText = feature ? paywallConfig.feature_lock_text.replace('{feature}', feature) : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col"
          onClick={onClose}
          role="presentation"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${paywallConfig.gradient_from}, ${paywallConfig.gradient_via}, ${paywallConfig.gradient_to})`,
            }}
          />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex flex-col h-full w-full max-w-md mx-auto"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={paywallConfig.title}
          >
            {/* Close */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors z-10"
              style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
              disabled={isPurchasing}
              aria-label={tr("premiummodal_bagla_84bdc9", "Bağla")}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Top: Branding */}
            <div className="text-center pt-6 pb-3 px-5 shrink-0">
              {showFreeTrial && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                  className="mb-4 mx-auto"
                >
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      animate={{ boxShadow: ['0 0 20px rgba(52,211,153,0.3)', '0 0 40px rgba(52,211,153,0.5)', '0 0 20px rgba(52,211,153,0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-emerald-400/25 to-teal-500/30 border border-emerald-400/40 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Sparkles className="w-5 h-5 text-emerald-300" />
                        </motion.div>
                        <span className="text-sm font-black text-white tracking-wider">{paywallConfig.free_trial_badge}</span>
                        <motion.div
                          animate={{ rotate: [0, -15, 15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        >
                          <Sparkles className="w-5 h-5 text-emerald-300" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="h-0.5 mt-1.5 rounded-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                    />
                  </div>
                </motion.div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Crown className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{paywallConfig.title}</h2>
              <p className="text-white/70 text-xs mt-0.5">{paywallConfig.subtitle}</p>

              {feature && (
                <div className="mt-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-medium">{featureLockText}</span>
                </div>
              )}
            </div>

            {/* Middle: Features */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 min-h-0">
              {error && (
                <div className="mb-2 p-2 bg-white/10 text-white rounded-xl text-xs text-center" role="alert">{error}</div>
              )}

              {/* Benefit pills */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {paywallConfig.pills.map((b, i) => (
                  <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                    {renderPillIcon(b.icon)}
                    {b.text}
                  </div>
                ))}
              </div>

              {/* Feature grid */}
              {allFeatures.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {allFeatures.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-2.5 py-2">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="text-[10px] font-medium text-white/90 leading-tight line-clamp-2">{item.title_az || item.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Plan Selection */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {/* Yearly */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className={`relative p-3 rounded-2xl text-left transition-all duration-200 ${
                    selectedPlan === 'yearly'
                      ? 'bg-white text-foreground shadow-xl shadow-black/20'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                  onClick={() => setSelectedPlan('yearly')}
                  aria-pressed={selectedPlan === 'yearly'}
                >
                  <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                    selectedPlan === 'yearly'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {savingsBadgeText}
                  </span>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-xs">{paywallConfig.yearly_label}</p>
                    {selectedPlan === 'yearly' && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-black">{currencySymbol}{yearlyMonthly}<span className="text-[10px] font-normal opacity-60">{paywallConfig.yearly_suffix}</span></p>
                  <p className={`text-[10px] mt-0.5 ${selectedPlan === 'yearly' ? 'text-muted-foreground' : 'text-white/50'}`}>{currencySymbol}{yearlyPrice}{paywallConfig.yearly_total_suffix}</p>
                </motion.button>

                {/* Monthly */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className={`relative p-3 rounded-2xl text-left transition-all duration-200 ${
                    selectedPlan === 'monthly'
                      ? 'bg-white text-foreground shadow-xl shadow-black/20'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                  aria-pressed={selectedPlan === 'monthly'}
                >
                  <div className="flex items-center justify-between mb-0.5 mt-1">
                    <p className="font-bold text-xs">{paywallConfig.monthly_label}</p>
                    {selectedPlan === 'monthly' && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-black">{currencySymbol}{monthlyPrice}<span className="text-[10px] font-normal opacity-60">{paywallConfig.monthly_suffix}</span></p>
                  <p className={`text-[10px] mt-0.5 ${selectedPlan === 'monthly' ? 'text-muted-foreground' : 'text-white/50'}`}>&nbsp;</p>
                </motion.button>
              </div>
            </div>

            {/* Bottom: CTA + Legal */}
            <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
              {showFreeTrial && (
                <p className="text-center text-[11px] text-white/80 mb-2 font-medium">
                  {freeTrialNote}
                </p>
              )}
              <Button
                className="w-full h-12 rounded-2xl bg-white hover:bg-white/95 text-orange-600 font-bold text-sm shadow-xl shadow-black/15 border-0 disabled:opacity-50 transition-all"
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading}
                aria-label={isPurchasing ? paywallConfig.purchasing_text : ctaText}
              >
                {isPurchasing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{paywallConfig.purchasing_text}</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" />{ctaText}</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {isNative && isSupported && (
                  <>
                    <button onClick={handleRestore} disabled={isPurchasing || isLoading} className="text-[10px] text-white/50 hover:text-white/80 transition-colors disabled:opacity-50 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />{paywallConfig.restore_text}
                    </button>
                    <span className="text-[10px] text-white/30">•</span>
                  </>
                )}
                <a href="https://anacanapp.lovable.app/legal/terms_of_service" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/50 underline hover:text-white/80">{paywallConfig.terms_label}</a>
                <span className="text-[10px] text-white/30">•</span>
                <a href="https://anacanapp.lovable.app/legal/privacy_policy" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/50 underline hover:text-white/80">{paywallConfig.privacy_label}</a>
              </div>
              <p className="text-center text-[9px] text-white/40 mt-1">
                {paywallConfig.cancel_notice}
              </p>
              {!isNative && paywallConfig.non_native_notice && (
                <p className="text-center text-[10px] text-white/40 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />{paywallConfig.non_native_notice}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
