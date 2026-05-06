import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Check, Shield, X, Sparkles, Loader2 } from 'lucide-react';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { isNativePlatform } from '@/lib/revenuecat';
import { useToast } from '@/hooks/use-toast';

interface PaywallStepProps {
  onPurchase: (planId: string) => void;
  onClose: () => void;
}

export default function PaywallStep({ onPurchase, onClose }: PaywallStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const { toast } = useToast();
  const {
    packages,
    isLoading,
    isPurchasing,
    isSupported,
    purchaseMonthly,
    purchaseYearly,
    error,
  } = useInAppPurchase();

  // Find packages from RevenueCat offerings
  const monthlyPkg = useMemo(
    () => packages.find(p => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly' || p.product.identifier.includes('monthly')),
    [packages]
  );
  const yearlyPkg = useMemo(
    () => packages.find(p => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual' || p.product.identifier.includes('yearly') || p.product.identifier.includes('annual')),
    [packages]
  );

  // Real prices from RevenueCat or fallback
  const monthlyPriceNum = monthlyPkg?.product?.price ?? 5.99;
  const yearlyPriceNum = yearlyPkg?.product?.price ?? 46.99;
  const currency = monthlyPkg?.product?.currencyCode || yearlyPkg?.product?.currencyCode || 'USD';
  const symbol = currency === 'AZN' ? '₼' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';

  const monthlyPriceStr = monthlyPkg?.product?.priceString || `${symbol}${monthlyPriceNum.toFixed(2)}`;
  const yearlyPriceStr = yearlyPkg?.product?.priceString || `${symbol}${yearlyPriceNum.toFixed(2)}`;

  const yearlyMonthly = +(yearlyPriceNum / 12).toFixed(2);
  const yearlyMonthlyStr = `${symbol}${yearlyMonthly.toFixed(2)}`;
  const savingsPercent = monthlyPriceNum > 0 ? Math.round((1 - yearlyMonthly / monthlyPriceNum) * 100) : 0;

  const handlePurchase = async () => {
    // Web / non-native fallback — just continue
    if (!isNativePlatform() || !isSupported) {
      onPurchase(selectedPlan);
      return;
    }

    const ok = selectedPlan === 'yearly' ? await purchaseYearly() : await purchaseMonthly();
    if (ok) {
      toast({ title: 'Premium aktivləşdi 🎉', description: '3 günlük pulsuz dövrünüz başladı' });
      onPurchase(selectedPlan);
    } else if (error) {
      toast({ title: 'Alış uğursuz', description: error, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col min-h-full px-6 py-6 relative">
      <button
        onClick={onClose}
        disabled={isPurchasing}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center z-10 disabled:opacity-50"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex-1">
        <div className="text-center mb-5 pt-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Anacan Premium</h2>
          <p className="text-sm text-muted-foreground mt-1">Tam imkanlardan yararlanın</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">3 GÜN PULSUZ SINAQ</span>
          </div>
        </div>

        {isLoading && isNativePlatform() ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Qiymətlər yüklənir...</span>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <button
              onClick={() => setSelectedPlan('yearly')}
              disabled={isPurchasing}
              className={`w-full p-4 rounded-2xl border-2 transition-all relative ${
                selectedPlan === 'yearly' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'
              }`}
            >
              {savingsPercent > 0 && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  Ən sərfəli · {savingsPercent}% qənaət
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">İllik</p>
                  <p className="text-xs text-muted-foreground">3 gün pulsuz, sonra {yearlyPriceStr}/il</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{yearlyMonthlyStr}</span>
                  <span className="text-xs text-muted-foreground">/ay</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('monthly')}
              disabled={isPurchasing}
              className={`w-full p-4 rounded-2xl border-2 transition-all ${
                selectedPlan === 'monthly' ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Aylıq</p>
                  <p className="text-xs text-muted-foreground">3 gün pulsuz, sonra {monthlyPriceStr}/ay</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{monthlyPriceStr}</span>
                  <span className="text-xs text-muted-foreground">/ay</span>
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-2.5 mb-5">
          {[
            'Bütün alətlərə sınırsız giriş',
            '24/7 AI Asistan',
            'Yuxu Səsləri & Meditasiya',
            'Fərdi həftəlik hesabatlar',
            'Reklamsız təcrübə',
          ].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>İstədiyin an ləğv et · Zəmanətli</span>
        </div>
      </div>

      <div className="mt-5 pb-safe space-y-2">
        <Button
          onClick={handlePurchase}
          disabled={isPurchasing || (isLoading && isNativePlatform())}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg disabled:opacity-70"
        >
          {isPurchasing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Emal edilir...</>
          ) : (
            '3 Gün Pulsuz Başla'
          )}
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          3 gün pulsuz sınayın · Sonra {selectedPlan === 'yearly' ? `${yearlyPriceStr}/il` : `${monthlyPriceStr}/ay`} · İstənilən vaxt ləğv edin
        </p>
      </div>
    </div>
  );
}
