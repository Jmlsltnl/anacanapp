import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Star, Loader2, RefreshCw, Lock, Infinity as InfinityIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/iap';
import { useToast } from '@/hooks/use-toast';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { useState, useEffect, useRef, useCallback } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const { toast } = useToast();
  const { features: dbFeatures, plans: dbPlans, loading: configLoading } = usePremiumConfig();
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

  const monthlyProduct = products.find(p => p.productId.includes('monthly'));
  const yearlyProduct = products.find(p => p.productId.includes('yearly'));

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
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl flex flex-col"
            style={{ maxHeight: 'calc(95dvh - env(safe-area-inset-top, 0px))' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Anacan Premium abunəlik"
          >
            {/* ── Compact Header ── */}
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-5 pt-4 pb-8 text-center shrink-0 rounded-t-3xl sm:rounded-t-3xl">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                disabled={isPurchasing}
                aria-label="Bağla"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="w-6 h-6 text-white" aria-hidden="true" />
                <h2 className="text-xl font-bold text-white">Anacan Premium</h2>
              </div>
              <p className="text-white/80 text-xs">Bütün xüsusiyyətlər • Heç bir limit</p>

              {feature && (
                <div className="mt-2 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-white" aria-hidden="true" />
                  <span className="text-white text-[11px] font-medium">{feature} üçün Premium lazımdır</span>
                </div>
              )}
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 -mt-4 bg-card rounded-t-2xl relative overscroll-contain min-h-0">
              <div className="px-4 pt-5 pb-3">
                {error && (
                  <div className="mb-3 p-2.5 bg-destructive/10 text-destructive rounded-xl text-xs text-center" role="alert">
                    {error}
                  </div>
                )}

                {/* Features Grid - compact */}
                {premiumOnlyFeatures.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Crown className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                      <h3 className="text-xs font-semibold text-foreground">Yalnız Premium</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5" role="list">
                      {premiumOnlyFeatures.map((item) => (
                        <div
                          key={item.id}
                          role="listitem"
                          className="flex items-center gap-2 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl px-2.5 py-2 border border-amber-200/30 dark:border-amber-800/20"
                        >
                          <span className="text-base shrink-0" aria-hidden="true">{item.icon}</span>
                          <span className="text-[11px] font-medium text-foreground leading-tight">{item.title_az || item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unlimited features - compact */}
                {limitedFreeFeatures.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                      <h3 className="text-xs font-semibold text-foreground">Limitsiz istifadə</h3>
                    </div>
                    <div className="space-y-1" role="list">
                      {limitedFreeFeatures.map((item) => (
                        <div key={item.id} role="listitem" className="flex items-center gap-2.5 bg-muted/30 rounded-xl px-3 py-2">
                          <span className="text-base shrink-0" aria-hidden="true">{item.icon}</span>
                          <span className="flex-1 text-[11px] font-medium text-foreground">{item.title_az || item.title}</span>
                          <InfinityIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-label="Limitsiz" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan Selection - side by side */}
                <fieldset className="mb-4">
                  <legend className="text-xs font-semibold text-foreground mb-2">Plan seçin</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Yearly */}
                    <button
                      className={`relative p-3 rounded-2xl text-left transition-all ${
                        selectedPlan === 'yearly'
                          ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-md'
                          : 'bg-muted/40 text-foreground border border-border'
                      }`}
                      onClick={() => setSelectedPlan('yearly')}
                      aria-pressed={selectedPlan === 'yearly'}
                    >
                      {selectedPlan === 'yearly' && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                          {savingsPercent}% QƏNAƏT
                        </span>
                      )}
                      <p className="font-bold text-sm">İllik</p>
                      <p className="text-lg font-extrabold mt-0.5">{currencySymbol}{yearlyMonthly}<span className="text-[11px] font-normal opacity-80">/ay</span></p>
                      <p className={`text-[10px] mt-0.5 ${selectedPlan === 'yearly' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {currencySymbol}{yearlyPrice}/il
                      </p>
                      {selectedPlan === 'yearly' && (
                        <div className="absolute top-2.5 right-2.5">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>

                    {/* Monthly */}
                    <button
                      className={`relative p-3 rounded-2xl text-left transition-all ${
                        selectedPlan === 'monthly'
                          ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-md'
                          : 'bg-muted/40 text-foreground border border-border'
                      }`}
                      onClick={() => setSelectedPlan('monthly')}
                      aria-pressed={selectedPlan === 'monthly'}
                    >
                      <p className="font-bold text-sm">Aylıq</p>
                      <p className="text-lg font-extrabold mt-0.5">{currencySymbol}{monthlyPrice}<span className="text-[11px] font-normal opacity-80">/ay</span></p>
                      <p className={`text-[10px] mt-0.5 ${selectedPlan === 'monthly' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        &nbsp;
                      </p>
                      {selectedPlan === 'monthly' && (
                        <div className="absolute top-2.5 right-2.5">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>

            {/* ── Sticky Footer - always visible ── */}
            <div
              className="shrink-0 border-t border-border/40 bg-card px-4 pt-3 pb-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              <Button
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 border-0 disabled:opacity-50"
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading}
                aria-label={isPurchasing ? 'Emal edilir' : 'Premium-a keç'}
              >
                {isPurchasing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />Emal edilir...</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" aria-hidden="true" />Premium-a Keç</>
                )}
              </Button>

              {/* Restore + legal links row */}
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
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

              <p className="text-center text-[9px] text-muted-foreground mt-1.5">
                İstənilən vaxt ləğv edə bilərsiniz • Abunəlik avtomatik yenilənir
              </p>

              {!isNative && (
                <p className="text-center text-[9px] text-muted-foreground mt-1">
                  💡 App Store / Google Play-dən yükləyin
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
