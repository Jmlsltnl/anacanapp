import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Star, Loader2, RefreshCw, Lock, Check, Zap, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/iap';
import { useToast } from '@/hooks/use-toast';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const { toast } = useToast();
  const { features: dbFeatures, plans: dbPlans, loading: configLoading } = usePremiumConfig();
  const { isPremium, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const {
    products,
    isLoading,
    isPurchasing,
    error,
    isSupported,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
  } = useInAppPurchase();

  // If already premium, default to yearly (upgrade path)
  useEffect(() => {
    if (isPremium && subscription?.plan_type === 'premium') {
      setSelectedPlan('yearly');
    }
  }, [isPremium, subscription]);

  // Focus trap & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => closeButtonRef.current?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPurchasing) { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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

  const monthlyProduct = products.find(p => p?.productId?.includes('monthly'));
  const yearlyProduct = products.find(p => p?.productId?.includes('yearly'));

  const currencySymbol = dbCurrency === 'AZN' ? '₼' : dbCurrency;
  const monthlyPrice = monthlyProduct?.price || (dbMonthlyPrice ? `${dbMonthlyPrice}` : '9.99');
  const yearlyPrice = yearlyProduct?.price || (dbYearlyPrice ? `${dbYearlyPrice}` : '79.99');
  const yearlyMonthly = yearlyProduct
    ? (yearlyProduct.priceAmount / 12).toFixed(2)
    : (dbYearlyPrice ? (dbYearlyPrice / 12).toFixed(2) : '6.67');

  const savingsPercent = dbMonthlyPrice && dbYearlyPrice
    ? Math.round((1 - dbYearlyPrice / (dbMonthlyPrice * 12)) * 100)
    : 44;

  const premiumOnlyFeatures = dbFeatures.filter(f => !f.is_included_free && f.is_included_premium);
  const limitedFreeFeatures = dbFeatures.filter(f => f.is_included_free && f.is_included_premium);

  // Determine CTA text based on current subscription
  const isCurrentlyMonthly = isPremium && subscription?.plan_type === 'premium';
  const ctaText = isCurrentlyMonthly && selectedPlan === 'yearly'
    ? 'İllik Plana Keç'
    : isPremium
      ? 'Planı Yenilə'
      : 'Premium-a Keç';

  const handlePurchase = useCallback(async () => {
    if (!isNative) {
      toast({ title: 'Premium mövcud deyil', description: 'Premium almaq üçün mobil tətbiqi yükləyin.', variant: 'destructive' });
      return;
    }
    const purchaseFn = selectedPlan === 'yearly' ? purchaseYearly : purchaseMonthly;
    const success = await purchaseFn();
    if (success) {
      toast({ title: 'Premium aktivləşdirildi! 🎉', description: 'İndi bütün xüsusiyyətlərdən istifadə edə bilərsiniz.' });
      onClose();
    }
  }, [isNative, selectedPlan, purchaseYearly, purchaseMonthly, toast, onClose]);

  const handleRestore = useCallback(async () => {
    const success = await restorePurchases();
    if (success) {
      toast({ title: 'Alışlar bərpa edildi', description: 'Premium abunəliyiniz aktivləşdirildi.' });
      onClose();
    } else {
      toast({ title: 'Alış tapılmadı', description: 'Əvvəlki premium abunəlik tapılmadı.', variant: 'destructive' });
    }
  }, [restorePurchases, toast, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(95dvh - env(safe-area-inset-top, 0px))' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Anacan Premium abunəlik"
          >
            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden shrink-0">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600" />
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10"
                />
              </div>

              <div className="relative px-5 pt-5 pb-6 text-center">
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
                  disabled={isPurchasing}
                  aria-label="Bağla"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Crown icon with glow */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-orange-600/30"
                >
                  <Crown className="w-8 h-8 text-white" aria-hidden="true" />
                </motion.div>

                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-extrabold text-white tracking-tight"
                >
                  Anacan Premium
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/80 text-sm mt-1"
                >
                  Tam təcrübə. Sınırsız imkanlar.
                </motion.p>

                {feature && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mt-3 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    <span className="text-white text-xs font-medium">{feature} üçün Premium tələb olunur</span>
                  </motion.div>
                )}

                {isCurrentlyMonthly && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mt-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 inline-flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    <span className="text-white text-xs font-medium">İllik plana keçib qənaət edin!</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 overscroll-contain min-h-0">
              <div className="px-5 pt-5 pb-3">
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-xs text-center" role="alert">
                    {error}
                  </div>
                )}

                {/* Key Benefits - Horizontal pills */}
                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                  {[
                    { icon: Zap, text: 'Limitsiz', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
                    { icon: Shield, text: 'Reklamsız', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
                    { icon: Heart, text: 'Tam dəstək', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
                  ].map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${b.color}`}
                    >
                      <b.icon className="w-3.5 h-3.5" />
                      {b.text}
                    </motion.div>
                  ))}
                </div>

                {/* Premium-only Features */}
                {premiumOnlyFeatures.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Premium Xüsusiyyətlər</h3>
                    </div>
                    <div className="space-y-1.5" role="list">
                      {premiumOnlyFeatures.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.04 }}
                          role="listitem"
                          className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 border border-border/30"
                        >
                          <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                          <span className="text-xs font-medium text-foreground flex-1">{item.title_az || item.title}</span>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unlimited features */}
                {limitedFreeFeatures.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Limitsiz İstifadə</h3>
                    </div>
                    <div className="space-y-1.5" role="list">
                      {limitedFreeFeatures.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.04 }}
                          role="listitem"
                          className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5 border border-border/30"
                        >
                          <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                          <span className="text-xs font-medium text-foreground flex-1">{item.title_az || item.title}</span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">∞</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan Selection */}
                <fieldset className="mb-3">
                  <legend className="text-sm font-bold text-foreground mb-3">Plan Seçin</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Yearly */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-4 rounded-2xl text-left transition-all duration-200 ${
                        selectedPlan === 'yearly'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-muted/30 border-2 border-transparent hover:border-border'
                      }`}
                      onClick={() => setSelectedPlan('yearly')}
                      aria-pressed={selectedPlan === 'yearly'}
                    >
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        {savingsPercent}% QƏNAƏT
                      </span>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-foreground">İllik</p>
                        {selectedPlan === 'yearly' && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-black text-foreground">{currencySymbol}{yearlyMonthly}<span className="text-xs font-normal text-muted-foreground">/ay</span></p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{currencySymbol}{yearlyPrice} / il</p>
                    </motion.button>

                    {/* Monthly */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-4 rounded-2xl text-left transition-all duration-200 ${
                        selectedPlan === 'monthly'
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-muted/30 border-2 border-transparent hover:border-border'
                      }`}
                      onClick={() => setSelectedPlan('monthly')}
                      aria-pressed={selectedPlan === 'monthly'}
                    >
                      <div className="flex items-center justify-between mb-1 mt-1">
                        <p className="font-bold text-sm text-foreground">Aylıq</p>
                        {selectedPlan === 'monthly' && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-black text-foreground">{currencySymbol}{monthlyPrice}<span className="text-xs font-normal text-muted-foreground">/ay</span></p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">&nbsp;</p>
                    </motion.button>
                  </div>
                </fieldset>
              </div>
            </div>

            {/* ── Sticky Footer ── */}
            <div
              className="shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-sm px-5 pt-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
              <Button
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 border-0 disabled:opacity-50 transition-all duration-200"
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading}
                aria-label={isPurchasing ? 'Emal edilir' : ctaText}
              >
                {isPurchasing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />Emal edilir...</>
                ) : (
                  <><Crown className="w-5 h-5 mr-2" aria-hidden="true" />{ctaText}</>
                )}
              </Button>

              {/* Restore + legal links */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {isNative && isSupported && (
                  <>
                    <button
                      onClick={handleRestore}
                      disabled={isPurchasing || isLoading}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" aria-hidden="true" />
                      Bərpa et
                    </button>
                    <span className="text-[10px] text-muted-foreground" aria-hidden="true">•</span>
                  </>
                )}
                <a
                  href="https://anacanapp.lovable.app/legal/terms_of_service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground underline hover:text-foreground"
                >
                  Şərtlər
                </a>
                <span className="text-[10px] text-muted-foreground" aria-hidden="true">•</span>
                <a
                  href="https://anacanapp.lovable.app/legal/privacy_policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground underline hover:text-foreground"
                >
                  Məxfilik
                </a>
              </div>

              <p className="text-center text-[9px] text-muted-foreground mt-2">
                İstənilən vaxt ləğv edə bilərsiniz • Abunəlik avtomatik yenilənir
              </p>

              {!isNative && (
                <p className="text-center text-[10px] text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />
                  App Store / Google Play-dən yükləyin
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
