import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Loader2, RefreshCw, Lock, Check, Zap, Shield, Star } from 'lucide-react';
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

  useEffect(() => {
    if (isPremium && subscription?.plan_type === 'premium') {
      setSelectedPlan('yearly');
    }
  }, [isPremium, subscription]);

  useEffect(() => {
    if (!isOpen) return;
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
  const allFeatures = [...premiumOnlyFeatures, ...limitedFreeFeatures];

  const isCurrentlyMonthly = isPremium && subscription?.plan_type === 'premium';
  const ctaText = isCurrentlyMonthly && selectedPlan === 'yearly'
    ? 'İllik Plana Keç'
    : isPremium ? 'Planı Yenilə' : 'Premium-a Keç';

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
          className="fixed inset-0 z-[100] flex flex-col"
          onClick={onClose}
          role="presentation"
        >
          {/* Fullscreen gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-600 via-orange-600 to-rose-700" />
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
            aria-label="Anacan Premium abunəlik"
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors z-10"
              style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
              disabled={isPurchasing}
              aria-label="Bağla"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* ── Top: Branding ── */}
            <div className="text-center pt-6 pb-3 px-5 shrink-0">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Crown className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Anacan Premium</h2>
              <p className="text-white/70 text-xs mt-0.5">Tam təcrübə · Sınırsız imkanlar</p>

              {feature && (
                <div className="mt-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-medium">{feature} üçün Premium lazımdır</span>
                </div>
              )}
            </div>

            {/* ── Middle: Features (scrollable if needed, but compact) ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 min-h-0">
              {error && (
                <div className="mb-2 p-2 bg-white/10 text-white rounded-xl text-xs text-center" role="alert">{error}</div>
              )}

              {/* Benefits pills */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {[
                  { icon: Zap, text: 'Limitsiz' },
                  { icon: Shield, text: 'Reklamsız' },
                  { icon: Sparkles, text: 'AI dəstəyi' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                    <b.icon className="w-3 h-3" />
                    {b.text}
                  </div>
                ))}
              </div>

              {/* Feature list - compact 2-column grid */}
              {allFeatures.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {allFeatures.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-2.5 py-2"
                    >
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="text-[10px] font-medium text-white/90 leading-tight line-clamp-2">{item.title_az || item.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Plan Selection - compact side by side */}
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
                    {savingsPercent}% QƏNAƏT
                  </span>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-xs">İllik</p>
                    {selectedPlan === 'yearly' && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-black">{currencySymbol}{yearlyMonthly}<span className="text-[10px] font-normal opacity-60">/ay</span></p>
                  <p className={`text-[10px] mt-0.5 ${selectedPlan === 'yearly' ? 'text-muted-foreground' : 'text-white/50'}`}>{currencySymbol}{yearlyPrice}/il</p>
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
                    <p className="font-bold text-xs">Aylıq</p>
                    {selectedPlan === 'monthly' && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-black">{currencySymbol}{monthlyPrice}<span className="text-[10px] font-normal opacity-60">/ay</span></p>
                  <p className={`text-[10px] mt-0.5 ${selectedPlan === 'monthly' ? 'text-muted-foreground' : 'text-white/50'}`}>&nbsp;</p>
                </motion.button>
              </div>
            </div>

            {/* ── Bottom: CTA + Legal (always visible) ── */}
            <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
              <Button
                className="w-full h-12 rounded-2xl bg-white hover:bg-white/95 text-orange-600 font-bold text-sm shadow-xl shadow-black/15 border-0 disabled:opacity-50 transition-all"
                onClick={handlePurchase}
                disabled={isPurchasing || isLoading}
                aria-label={isPurchasing ? 'Emal edilir' : ctaText}
              >
                {isPurchasing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Emal edilir...</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" />{ctaText}</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {isNative && isSupported && (
                  <>
                    <button onClick={handleRestore} disabled={isPurchasing || isLoading} className="text-[10px] text-white/50 hover:text-white/80 transition-colors disabled:opacity-50 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />Bərpa et
                    </button>
                    <span className="text-[10px] text-white/30">•</span>
                  </>
                )}
                <a href="https://anacanapp.lovable.app/legal/terms_of_service" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/50 underline hover:text-white/80">Şərtlər</a>
                <span className="text-[10px] text-white/30">•</span>
                <a href="https://anacanapp.lovable.app/legal/privacy_policy" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/50 underline hover:text-white/80">Məxfilik</a>
              </div>
              <p className="text-center text-[9px] text-white/40 mt-1">
                İstənilən vaxt ləğv edə bilərsiniz • Avtomatik yenilənir
              </p>
              {!isNative && (
                <p className="text-center text-[10px] text-white/40 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3" />App Store / Google Play-dən yükləyin
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
