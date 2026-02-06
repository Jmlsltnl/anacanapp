import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Sparkles, Star, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/iap';
import { useToast } from '@/hooks/use-toast';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

// Fallback features if no data from DB
const defaultFeatures = [
  { icon: '📸', title: 'Limitsiz fotosessiya', description: 'Sonsuz sayda körpə fotosu yaradın' },
  { icon: '🎵', title: 'Limitsiz bəyaz küy', description: 'Gün boyu bəyaz küy dinləyin' },
  { icon: '👗', title: 'Premium geyimlər', description: 'Eksklüziv geyim seçimləri' },
  { icon: '🏰', title: 'Premium fonlar', description: 'Xüsusi dizayn edilmiş fonlar' },
  { icon: '✨', title: 'Yüksək keyfiyyət', description: '8K keyfiyyətində şəkillər' },
  { icon: '🚀', title: 'Prioritet dəstək', description: 'Sürətli texniki dəstək' },
];

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  const { toast } = useToast();
  const { features: dbFeatures, plans: dbPlans, loading: configLoading } = usePremiumConfig();
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

  // Use DB features if available, otherwise fallback
  const premiumFeatures = dbFeatures.length > 0 
    ? dbFeatures.filter(f => f.is_included_premium).map(f => ({
        icon: f.icon,
        title: f.title_az || f.title,
        description: f.description_az || f.description || ''
      }))
    : defaultFeatures;

  // Get premium plan prices from DB
  const premiumPlan = dbPlans.find(p => p.plan_key === 'premium');
  const dbMonthlyPrice = premiumPlan?.price_monthly;
  const dbYearlyPrice = premiumPlan?.price_yearly;
  const dbCurrency = premiumPlan?.currency || 'AZN';

  const isNative = isNativePlatform();

  // Get prices from products or DB config or use defaults
  const monthlyProduct = products.find(p => p.productId.includes('monthly'));
  const yearlyProduct = products.find(p => p.productId.includes('yearly'));

  const currencySymbol = dbCurrency === 'AZN' ? '₼' : dbCurrency;
  const monthlyPrice = monthlyProduct?.price || (dbMonthlyPrice ? `${currencySymbol}${dbMonthlyPrice}` : '₼9.99');
  const yearlyPrice = yearlyProduct?.price || (dbYearlyPrice ? `${currencySymbol}${dbYearlyPrice}` : '₼79.99');
  const yearlyMonthly = yearlyProduct 
    ? `${currencySymbol}${(yearlyProduct.priceAmount / 12).toFixed(2)}`
    : (dbYearlyPrice ? `${currencySymbol}${(dbYearlyPrice / 12).toFixed(2)}` : '₼6.67');

  const handleMonthlyPurchase = async () => {
    if (!isNative) {
      toast({
        title: 'Premium mövcud deyil',
        description: 'Premium almaq üçün mobil tətbiqi yükləyin.',
        variant: 'destructive',
      });
      return;
    }

    const success = await purchaseMonthly();
    if (success) {
      toast({
        title: 'Premium aktivləşdirildi! 🎉',
        description: 'İndi bütün xüsusiyyətlərdən istifadə edə bilərsiniz.',
      });
      onClose();
    }
  };

  const handleYearlyPurchase = async () => {
    if (!isNative) {
      toast({
        title: 'Premium mövcud deyil',
        description: 'Premium almaq üçün mobil tətbiqi yükləyin.',
        variant: 'destructive',
      });
      return;
    }

    const success = await purchaseYearly();
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
      toast({
        title: 'Alışlar bərpa edildi',
        description: 'Premium abunəliyiniz aktivləşdirildi.',
      });
      onClose();
    } else {
      toast({
        title: 'Alış tapılmadı',
        description: 'Əvvəlki premium abunəlik tapılmadı.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-8 pb-12 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                disabled={isPurchasing}
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Anacan Premium</h2>
              <p className="text-white/90">Tam təcrübə üçün Premium-a keçin</p>
              
              {feature && (
                <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 inline-block">
                  <p className="text-white text-sm">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    {feature} üçün Premium lazımdır
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="px-6 py-6 -mt-6 bg-card rounded-t-3xl relative">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {premiumFeatures.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl p-3"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <motion.button
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white relative overflow-hidden disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleYearlyPurchase}
                  disabled={isPurchasing || isLoading}
                >
                  <div className="absolute top-2 right-2 bg-white text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    ƏN POPULYAR
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">İllik Plan</p>
                    <p className="text-white/90 text-sm">{yearlyPrice}/il • {yearlyMonthly}/ay</p>
                  </div>
                  <div className="absolute bottom-2 right-4 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                    <span className="text-sm font-medium">44% qənaət</span>
                  </div>
                </motion.button>

                <motion.button
                  className="w-full p-4 rounded-2xl bg-muted text-foreground border-2 border-border disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMonthlyPurchase}
                  disabled={isPurchasing || isLoading}
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">Aylıq Plan</p>
                    <p className="text-muted-foreground text-sm">{monthlyPrice}/ay</p>
                  </div>
                </motion.button>
              </div>

              {/* CTA */}
              <Button
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
                onClick={handleYearlyPurchase}
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
                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Alışları bərpa et
                </button>
              )}

              <p className="text-center text-xs text-muted-foreground mt-4">
                İstənilən vaxt ləğv edə bilərsiniz
              </p>

              {!isNative && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  💡 Premium almaq üçün App Store və ya Google Play-dən tətbiqi yükləyin
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
