import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Sparkles, Star, Loader2, RefreshCw, Lock, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/iap';
import { useToast } from '@/hooks/use-toast';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { useState } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const { toast } = useToast();
  const { features: dbFeatures, plans: dbPlans, loading: configLoading } = usePremiumConfig();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
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

  // Separate features into premium-only and limited-free
  const premiumOnlyFeatures = dbFeatures.filter(f => !f.is_included_free && f.is_included_premium);
  const limitedFreeFeatures = dbFeatures.filter(f => f.is_included_free && f.is_included_premium);

  const handlePurchase = async () => {
    if (!isNative) {
      toast({
        title: 'Premium mövcud deyil',
        description: 'Premium almaq üçün mobil tətbiqi yükləyin.',
        variant: 'destructive',
      });
      return;
    }

    const purchaseFn = selectedPlan === 'yearly' ? purchaseYearly : purchaseMonthly;
    const success = await purchaseFn();
    if (success) {
      toast({
        title: 'Premium aktivləşdirildi! 🎉',
        description: 'İndi bütün xüsusiyyətlərdən istifadə edə bilərsiniz.',
      });
      onClose();
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      toast({ title: 'Alışlar bərpa edildi', description: 'Premium abunəliyiniz aktivləşdirildi.' });
      onClose();
    } else {
      toast({ title: 'Alış tapılmadı', description: 'Əvvəlki premium abunəlik tapılmadı.', variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Compact & Premium */}
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-6 pb-10 text-center shrink-0">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10"
                disabled={isPurchasing}
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Crown Icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-1">Anacan Premium</h2>
              <p className="text-white/80 text-sm">Bütün xüsusiyyətlər. Heç bir limit.</p>
              
              {feature && (
                <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">{feature} üçün Premium lazımdır</span>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 -mt-5 bg-card rounded-t-3xl relative">
              <div className="px-5 pt-6 pb-4">
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Premium-Only Features */}
                {premiumOnlyFeatures.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Yalnız Premium</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {premiumOnlyFeatures.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-2.5 border border-amber-200/50 dark:border-amber-800/30"
                        >
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <span className="text-xs font-medium text-foreground leading-tight">{item.title_az || item.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limited Free → Unlimited Premium */}
                {limitedFreeFeatures.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Limitsiz istifadə</h3>
                    </div>
                    <div className="space-y-1.5">
                      {limitedFreeFeatures.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.04 }}
                          className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5"
                        >
                          <span className="text-lg shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">{item.title_az || item.title}</p>
                            {item.description_az && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{item.description_az}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <InfinityIcon className="w-3.5 h-3.5" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan Selection */}
                <div className="space-y-2.5 mb-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Plan seçin</h3>
                  
                  {/* Yearly */}
                  <motion.button
                    className={`w-full p-3.5 rounded-2xl relative overflow-hidden transition-all ${
                      selectedPlan === 'yearly'
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-muted/50 text-foreground border-2 border-border hover:border-orange-300'
                    }`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan('yearly')}
                  >
                    {selectedPlan === 'yearly' && (
                      <div className="absolute top-2 right-2 bg-white text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ƏN SƏRFƏLİ
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold text-base">İllik Plan</p>
                        <p className={`text-xs mt-0.5 ${selectedPlan === 'yearly' ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {currencySymbol}{yearlyPrice}/il • {currencySymbol}{yearlyMonthly}/ay
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedPlan === 'yearly' ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                            <span className="text-sm font-semibold">{savingsPercent}% qənaət</span>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 border-muted-foreground/30`} />
                        )}
                      </div>
                    </div>
                  </motion.button>

                  {/* Monthly */}
                  <motion.button
                    className={`w-full p-3.5 rounded-2xl relative overflow-hidden transition-all ${
                      selectedPlan === 'monthly'
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-muted/50 text-foreground border-2 border-border hover:border-orange-300'
                    }`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan('monthly')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-bold text-base">Aylıq Plan</p>
                        <p className={`text-xs mt-0.5 ${selectedPlan === 'monthly' ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {currencySymbol}{monthlyPrice}/ay
                        </p>
                      </div>
                      {selectedPlan === 'monthly' ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                  </motion.button>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-orange-500/20 border-0 hover:shadow-xl hover:shadow-orange-500/30 transition-shadow disabled:opacity-50"
                  onClick={handlePurchase}
                  disabled={isPurchasing || isLoading}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Emal edilir...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Premium-a Keç
                    </>
                  )}
                </Button>

                {/* Restore purchases */}
                {isNative && isSupported && (
                  <button
                    onClick={handleRestore}
                    disabled={isPurchasing || isLoading}
                    className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Alışları bərpa et
                  </button>
                )}

                <p className="text-center text-[10px] text-muted-foreground mt-3">
                  İstənilən vaxt ləğv edə bilərsiniz • Abunəlik avtomatik yenilənir
                </p>

                {!isNative && (
                  <p className="text-center text-[10px] text-muted-foreground mt-1.5 pb-2">
                    💡 Premium almaq üçün App Store və ya Google Play-dən tətbiqi yükləyin
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
