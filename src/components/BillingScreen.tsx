import { useState, useEffect } from 'react';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Crown, CheckCircle,
  XCircle, AlertTriangle, Loader2, RotateCcw,
  CreditCard, icons, Calendar, TrendingUp,
  Lock, ChevronRight, RefreshCw,
  Gift, LayoutGrid, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { PremiumModal } from '@/components/PremiumModal';
import { useBillingConfig } from '@/hooks/usePaywallConfig';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { getPlatform, isNativePlatform } from '@/lib/revenuecat';
import { format } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { tr } from "@/lib/tr";

interface PaymentEntry {
  productId: string;
  date: string;
  type: 'original' | 'renewal' | 'next';
  willRenew?: boolean;
}

interface BillingScreenProps {
  onBack: () => void;
}

const BillingScreen = ({ onBack }: BillingScreenProps) => {
  useScrollToTop();

  const { profile } = useAuth();
  const { isPremium, subscription, isCancelled, cancelledButActive, cancelSubscription, restoreSubscription, loading: isLoading } = useSubscription();
  const { toast } = useToast();
  const config = useBillingConfig();
  const { features: dbFeatures } = usePremiumConfig();
  const { showCustomerCenter, isSupported: isIAPSupported } = useInAppPurchase();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const isAndroidNative = isNativePlatform() && getPlatform() === 'android';

  const fetchPaymentHistory = async () => {
    if (!isNativePlatform()) return;
    setLoadingPayments(true);
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.getCustomerInfo();
      const entries: PaymentEntry[] = [];
      const allPurchases = (customerInfo as any).allPurchaseDatesByProduct || {};
      const allExpirations = (customerInfo as any).allExpirationDatesByProduct || {};
      const activeEntitlements = customerInfo.entitlements?.active || {};

      const original = (customerInfo as any).originalPurchaseDate;
      if (original) {
        entries.push({ productId: 'original', date: original, type: 'original' });
      }

      Object.entries(allPurchases).forEach(([productId, date]) => {
        if (!date) return;
        if (original && new Date(date as string).getTime() === new Date(original).getTime()) return;
        entries.push({ productId, date: date as string, type: 'renewal' });
      });

      Object.values(activeEntitlements).forEach((ent: any) => {
        if (ent?.expirationDate && ent.willRenew) {
          entries.push({
            productId: ent.productIdentifier || 'next',
            date: ent.expirationDate,
            type: 'next',
            willRenew: true
          });
        }
      });

      entries.sort((a, b) => {
        if (a.type === 'next' && b.type !== 'next') return -1;
        if (b.type === 'next' && a.type !== 'next') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setPayments(entries);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const handleCancelSubscription = async () => {
    if (isIAPSupported && !isAndroidNative) {
      if (!confirm(tr("billingscreen_cancel_appstore", "You will be redirected to the App Store / Google Play subscription management page to cancel your subscription."))) return;
      setIsCanceling(true);
      await showCustomerCenter();
      setIsCanceling(false);
      return;
    }
    if (!confirm(tr("billingscreen_cancel_confirm", "Are you sure you want to cancel your subscription? You will continue to have Premium access until the end of the current period."))) return;
    setIsCanceling(true);
    const success = await cancelSubscription();
    toast(success ?
      { title: tr("billingscreen_cancel_success", "Subscription Cancelled"), description: tr("billingscreen_cancel_success_desc", "You can use Premium until the end of the current period.") } :
      { title: tr("billingscreen_error", "Error"), description: tr("billingscreen_cancel_error", "Failed to cancel subscription."), variant: 'destructive' }
    );
    setIsCanceling(false);
  };

  const handleRestoreSubscription = async () => {
    setIsRestoring(true);
    const success = await restoreSubscription();
    toast(success ?
      { title: tr("billingscreen_restore_success", "Subscription Restored"), description: tr("billingscreen_restore_success_desc", "Your Premium subscription is active again.") } :
      { title: tr("billingscreen_error", "Error"), description: tr("billingscreen_restore_error", "Failed to restore subscription."), variant: 'destructive' }
    );
    setIsRestoring(false);
  };

  const hasPremiumSub = subscription && (subscription.plan_type === 'premium' || subscription.plan_type === 'premium_plus');
  const isPremiumPlus = subscription?.plan_type === 'premium_plus';
  const planName = !hasPremiumSub && !isPremium ? config.free_plan_name : isPremiumPlus ? config.premium_yearly_name : config.premium_monthly_name;
  const planPrice = !hasPremiumSub && !isPremium ? '₼0' : isPremiumPlus ? '₼79.99' : '₼9.99';
  const planPeriod = !hasPremiumSub && !isPremium ? '' : isPremiumPlus ? tr("common_per_year", "/year") : tr("common_per_month", "/month");

  const renderIcon = (iconName: string, className: string) => {
    const IconComp = icons[iconName as keyof typeof icons];
    return IconComp ? <IconComp className={className} /> : <Sparkles className={className} />;
  };

  const isFreeUser = !hasPremiumSub && !isPremium;
  const allFeaturesList = dbFeatures.filter((f) => f.is_included_premium);

  return (
    <div className="min-h-screen bg-muted/20 pb-safe overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <motion.button 
          onClick={onBack} 
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="text-lg font-bold text-foreground">{tr("billingscreen_title", "My Subscription")}</h1>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        
        {/* Status Card (Compact Bento) */}
        <div className={`rounded-2xl p-4 border shadow-sm ${isPremium ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20' : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{planName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPremium && !isCancelled ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {config.active_badge}
                    </span>
                  ) : isCancelled && isPremium ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {config.cancelled_badge}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{tr("billingscreen_status_free", "Current Status: Free")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-black text-foreground">{planPrice}</span>
            <span className="text-sm font-semibold text-muted-foreground mb-1.5">{planPeriod}</span>
          </div>

          {isFreeUser && (
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold shadow-md relative overflow-hidden group"
            >
              <motion.div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Crown className="w-4 h-4 mr-2" />
              {tr("billingscreen_upgrade_btn", "Upgrade to Premium")}
            </Button>
          )}
        </div>

        {/* Subscription Details (Compact Grid) */}
        {isPremium && subscription && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-3 border border-border flex flex-col justify-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {config.start_date_label}
              </p>
              <p className="font-bold text-sm text-foreground">
                {format(new Date(subscription.started_at), 'd MMM yyyy', { locale: getCurrentDateLocale() })}
              </p>
            </div>

            {subscription.expires_at && (
              <div className="bg-card rounded-2xl p-3 border border-border flex flex-col justify-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                  {isCancelled ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <TrendingUp className="w-3 h-3 text-primary" />} 
                  {isCancelled ? config.expiry_label : config.renewal_label}
                </p>
                <p className={`font-bold text-sm ${isCancelled ? 'text-amber-600' : 'text-foreground'}`}>
                  {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: getCurrentDateLocale() })}
                </p>
              </div>
            )}

            <div className="col-span-2 bg-card rounded-2xl p-2 border border-border flex gap-2">
              {isCancelled ? (
                <Button onClick={handleRestoreSubscription} disabled={isRestoring} className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm">
                  {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  {config.restore_cta}
                </Button>
              ) : subscription?.plan_type === 'premium' ? (
                <>
                  <Button onClick={() => setShowPremiumModal(true)} className="flex-1 h-11 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm">
                    <Crown className="w-4 h-4 mr-1.5" /> {tr("billingscreen_upgrade", "Upgrade")}
                  </Button>
                  <Button onClick={handleCancelSubscription} disabled={isCanceling} variant="ghost" className="flex-1 h-11 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-sm">
                    {isCanceling ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />} {config.cancel_cta}
                  </Button>
                </>
              ) : (
                <Button onClick={handleCancelSubscription} disabled={isCanceling} variant="ghost" className="w-full h-11 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-sm">
                  {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} {config.cancel_cta}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Compact Premium Tools Showcase */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-primary" />
              {tr("billingscreen_premium_features", "Premium Features")}
            </h3>
          </div>
          
          <div className="p-2 grid grid-cols-1 gap-1">
            {allFeaturesList.map((f, i) => {
              const feat = 'title_en' in f ? f : null;
              const text = feat ? (getCurrentDateLocale().code === 'az' ? feat.title_az || feat.title : feat.title_en || feat.title) : (f as any).text;
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {feat ? <span className="text-sm">{feat.icon}</span> : renderIcon((f as any).icon, 'w-4 h-4 text-primary')}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-xs text-foreground">{text}</p>
                  </div>
                  {!isPremium ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mr-1" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500/70 shrink-0 mr-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Payment History */}
        {isPremium && subscription && payments.length > 0 && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />
                {config.payment_title}
              </h3>
              <button onClick={fetchPaymentHistory} disabled={loadingPayments} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loadingPayments ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>

            <div className="relative pl-5 space-y-4 border-l border-border ml-1.5">
              {payments.map((p, i) => {
                const isNext = p.type === 'next';
                const isOriginal = p.type === 'original';
                const isYearly = p.productId.toLowerCase().includes('year') || p.productId.toLowerCase().includes('annual');
                
                const label = isOriginal ? tr("billingscreen_first_purchase", "First Purchase") :
                              isNext ? tr("billingscreen_next_renewal", "Next Renewal") : 
                              tr("billingscreen_auto_renewal", "Auto Renewal");

                return (
                  <div key={`${p.productId}-${p.date}-${i}`} className="relative">
                    <div className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-card ${isNext ? 'bg-amber-400' : 'bg-primary'}`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-foreground">
                          {isYearly ? tr("billingscreen_annual_premium", "Annual Premium") : tr("billingscreen_monthly_premium", "Monthly Premium")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(p.date), 'd MMM yyyy', { locale: getCurrentDateLocale() })} · {label}</p>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isNext ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {isNext ? tr("billingscreen_scheduled", "Scheduled") : config.paid_label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isIAPSupported && !isAndroidNative && (
              <button
                onClick={async () => { await showCustomerCenter(); fetchPaymentHistory(); }}
                className="w-full mt-4 py-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-xs font-semibold text-primary flex items-center justify-center gap-1.5"
              >
                {tr("billingscreen_open_in_store", "View in App Store")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Footer Support */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            {tr("billingscreen_need_help", "Need help?")} <a href={`mailto:${config.support_email}`} className="text-primary font-bold">{config.support_email}</a>
          </p>
        </div>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default BillingScreen;
