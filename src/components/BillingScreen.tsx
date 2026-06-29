import { useState, useEffect } from 'react';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crown, CheckCircle,
  XCircle, Sparkles, AlertTriangle, Loader2, RotateCcw,
  Zap, Shield, CreditCard, icons, Calendar, TrendingUp,
  Lock, Star, ChevronRight, RefreshCw,
  Gift, LayoutGrid
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
  date: string; // ISO
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

  // Fetch real purchase history from RevenueCat
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

      // Original purchase (first ever)
      const original = (customerInfo as any).originalPurchaseDate;
      if (original) {
        entries.push({ productId: 'original', date: original, type: 'original' });
      }

      // Latest purchase per product (each renewal observed by SDK)
      Object.entries(allPurchases).forEach(([productId, date]) => {
        if (!date) return;
        // Skip duplicates of original
        if (original && new Date(date as string).getTime() === new Date(original).getTime()) return;
        entries.push({ productId, date: date as string, type: 'renewal' });
      });

      // Next renewal (upcoming auto-renewal)
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

      // Sort newest first, but keep "next" last
      entries.sort((a, b) => {
        if (a.type === 'next' && b.type !== 'next') return -1; // 'next' goes first in the visual timeline, wait no, let's put it first
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
    // On native platforms, redirect to App Store / Play Store subscription management
    if (isIAPSupported && !isAndroidNative) {
      if (!confirm(tr("billingscreen_abuneliyi_legv_etmek_ucun_app__ee8b2a", "Abunəliyi ləğv etmək üçün App Store / Google Play abunəlik idarəetmə səhifəsinə yönləndiriləcəksiniz."))) return;
      setIsCanceling(true);
      await showCustomerCenter();
      setIsCanceling(false);
      return;
    }

    // Fallback for web
    if (!confirm(tr("billingscreen_abuneliyi_legv_etmek_istediyin_8c90e4", "Abunəliyi ləğv etmək istədiyinizə əminsiniz? Cari dövrün sonuna qədər Premium xüsusiyyətlərdən istifadə edə biləcəksiniz."))) return;
    setIsCanceling(true);
    const success = await cancelSubscription();
    toast(success ?
      { title: tr("billingscreen_abunelik_legv_edildi_0023e9", 'Abunəlik ləğv edildi'), description: tr("billingscreen_cari_dovrun_sonuna_qeder_premium_istifad_e3e35c", 'Cari dövrün sonuna qədər Premium istifadə edə bilərsiniz.') } :
      { title: tr("billingscreen_xeta_3cdbb6", 'Xəta'), description: tr("billingscreen_abuneliyi_legv_etmek_mumkun_olmadi_413b1f", 'Abunəliyi ləğv etmək mümkün olmadı.'), variant: 'destructive' }
    );
    setIsCanceling(false);
  };

  const handleRestoreSubscription = async () => {
    setIsRestoring(true);
    const success = await restoreSubscription();
    toast(success ?
      { title: tr("billingscreen_abunelik_berpa_edildi_1b680a", 'Abunəlik bərpa edildi'), description: tr("billingscreen_premium_abuneliyiniz_yeniden_aktivdir_2f1843", 'Premium abunəliyiniz yenidən aktivdir.') } :
      { title: tr("billingscreen_xeta_3cdbb6", 'Xəta'), description: tr("billingscreen_abuneliyi_berpa_etmek_mumkun_olmadi_3a4a58", 'Abunəliyi bərpa etmək mümkün olmadı.'), variant: 'destructive' }
    );
    setIsRestoring(false);
  };

  const hasPremiumSub = subscription && (subscription.plan_type === 'premium' || subscription.plan_type === 'premium_plus');
  const isPremiumPlus = subscription?.plan_type === 'premium_plus';
  const planName = !hasPremiumSub && !isPremium ? config.free_plan_name : isPremiumPlus ? config.premium_yearly_name : config.premium_monthly_name;
  const planPrice = !hasPremiumSub && !isPremium ? '₼0' : isPremiumPlus ? '₼79.99' : '₼9.99';
  const planPeriod = !hasPremiumSub && !isPremium ? '' : isPremiumPlus ? tr("common_per_year", '/il') : tr("common_per_month", '/ay');

  const renderIcon = (iconName: string, className: string) => {
    const IconComp = icons[iconName as keyof typeof icons];
    return IconComp ? <IconComp className={className} /> : <Sparkles className={className} />;
  };

  const savingsPercent = 44;
  const isFreeUser = !hasPremiumSub && !isPremium;

  // Get premium-only features for showcase
  const premiumOnlyFeatures = dbFeatures.filter((f) => !f.is_included_free && f.is_included_premium);
  const allFeaturesList = dbFeatures.filter((f) => f.is_included_premium);

  return (
    <div className="min-h-screen bg-background pb-safe overflow-y-auto">
      {/* Redesigned Hero Section */}
      <div className="relative pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-24 px-5 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-background" />
        {isPremium ? (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 opacity-40 mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 80% -20%, ${config.header_gradient_to}, transparent 60%),
                             radial-gradient(circle at -20% 40%, ${config.header_gradient_from}, transparent 60%)`
              }}
            />
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <motion.button 
              onClick={onBack} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border ${isPremium ? 'bg-white/10 border-white/20 text-white shadow-xl' : 'bg-card border-border text-foreground shadow-sm'}`}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className={`text-xl font-bold flex-1 ${isPremium ? 'text-white' : 'text-foreground'}`}>{tr("billingscreen_title", "Abunəliyim")}</h1>
          </div>

          {/* Master Status Card (Bento Layout) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-[2rem] p-6 backdrop-blur-xl border overflow-hidden ${
              isPremium 
                ? 'bg-white/10 border-white/20 shadow-2xl shadow-primary/20' 
                : 'bg-card border-border shadow-lg shadow-black/5'
            }`}
          >
            {isPremium && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
            )}
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-white/20 text-white shadow-inner' : 'bg-primary/10 text-primary'}`}>
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black ${isPremium ? 'text-white' : 'text-foreground'}`}>{planName}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isPremium && !isCancelled ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">{config.active_badge}</span>
                        </div>
                      ) : isCancelled && isPremium ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 text-amber-300" />
                          <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">{config.cancelled_badge}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{tr("billingscreen_pulsuz_status", "Hazırkı Status: Pulsuz")}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className={`text-4xl font-black tracking-tight ${isPremium ? 'text-white' : 'text-foreground'}`}>
                    {planPrice}
                    <span className={`text-base font-medium ml-1 ${isPremium ? 'text-white/60' : 'text-muted-foreground'}`}>{planPeriod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Free User Promo CTA inside Master Card */}
            {isFreeUser && (
              <div className="mt-6">
                <Button
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-black text-base shadow-xl shadow-primary/25 relative overflow-hidden group"
                >
                  <motion.div 
                    className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                  />
                  <Crown className="w-5 h-5 mr-2" />
                  {tr("billingscreen_go_premium", "Premium-a Yüksəlt")}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-20 space-y-4 pb-12">
        {/* ═══ PREMIUM DETAILS (BENTO) ═══ */}
        {isPremium && subscription && (
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date Box */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-3xl p-5 border border-border shadow-lg shadow-black/5 flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">{config.start_date_label}</p>
                <p className="font-black text-foreground text-lg leading-tight">
                  {format(new Date(subscription.started_at), 'd MMM\nyyyy', { locale: getCurrentDateLocale() })}
                </p>
              </div>
            </motion.div>

            {/* End/Renewal Date Box */}
            {subscription.expires_at && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className={`bg-card rounded-3xl p-5 border border-border shadow-lg flex flex-col justify-between aspect-square ${isCancelled ? 'shadow-amber-500/5' : 'shadow-primary/5'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isCancelled ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                  {isCancelled ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <TrendingUp className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                    {isCancelled ? config.expiry_label : config.renewal_label}
                  </p>
                  <p className={`font-black text-lg leading-tight ${isCancelled ? 'text-amber-600' : 'text-foreground'}`}>
                    {format(new Date(subscription.expires_at), 'd MMM\nyyyy', { locale: getCurrentDateLocale() })}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Cancel/Restore Full Width Box */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="col-span-2 bg-card rounded-3xl p-2 border border-border shadow-sm">
              {isCancelled ? (
                <Button
                  onClick={handleRestoreSubscription}
                  disabled={isRestoring}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md"
                >
                  {isRestoring ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <RotateCcw className="w-5 h-5 mr-2" />}
                  {config.restore_cta}
                </Button>
              ) : subscription?.plan_type === 'premium' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setShowPremiumModal(true)}
                    className="h-14 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {tr("billingscreen_upgrade_plan", "Planı Yüksəlt")}
                  </Button>
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    variant="ghost"
                    className="h-14 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-sm"
                  >
                    {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {config.cancel_cta}
                  </Button>
                </div>
              ) : (
                <Button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-bold text-sm"
                  >
                    {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {config.cancel_cta}
                </Button>
              )}
            </motion.div>
          </div>
        )}

        {/* ═══ PREMIUM TOOLS SHOWCASE (For both) ═══ */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-[2rem] border border-border shadow-xl shadow-black/5 overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                {tr("billingscreen_premium_features_list", "Premium Alətlər & Funksiyalar")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isPremium ? tr("billingscreen_enjoy_all_tools", "Bütün Premium alətlərdən limitsiz istifadə edin.") : tr("billingscreen_unlock_all_tools", "Premium alaraq aşağıdakı bütün alətləri aktivləşdirin.")}
              </p>
            </div>
            {isPremium && (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            )}
          </div>
          
          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allFeaturesList.map((f, i) => {
              const feat = 'title_az' in f ? f : null;
              const text = feat ? feat.title_az || feat.title : (f as any).text;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 border border-primary/10 shadow-inner">
                    {feat ? <span className="text-xl">{feat.icon}</span> : renderIcon((f as any).icon, 'w-5 h-5 text-primary')}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{text}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{isPremium ? tr("billingscreen_unlocked", "Açıqdır") : tr("billingscreen_locked", "Premium ilə açılır")}</p>
                  </div>
                  {!isPremium && <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ PAYMENT HISTORY TIMELINE ═══ */}
        {isPremium && subscription && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="bg-card rounded-[2rem] border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {config.payment_title}
              </h3>
              <button
                onClick={fetchPaymentHistory}
                disabled={loadingPayments}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${loadingPayments ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>

            <div className="relative pl-6 space-y-6 border-l-2 border-border ml-2">
              <AnimatePresence>
                {payments.length === 0 ? (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-card" />
                    <p className="font-bold text-sm text-foreground">{planName}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(subscription.started_at), 'd MMM yyyy, HH:mm', { locale: getCurrentDateLocale() })}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">
                      {planPrice} - {config.paid_label}
                    </div>
                  </div>
                ) : (
                  payments.map((p, i) => {
                    const isNext = p.type === 'next';
                    const isOriginal = p.type === 'original';
                    const isYearly = p.productId.toLowerCase().includes('year') || p.productId.toLowerCase().includes('annual');
                    
                    const label = isOriginal ? tr("billingscreen_i_lk_alis_2f33af", "İlk alış") :
                                  isNext ? tr("billingscreen_novbeti_yenilenme_0ab0fe", "Növbəti yenilənmə") : 
                                  tr("billingscreen_avtomatik_yenilenme_251a6c", "Avtomatik yenilənmə");

                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={`${p.productId}-${p.date}-${i}`} 
                        className="relative"
                      >
                        <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full ring-4 ring-card ${isNext ? 'bg-amber-400' : 'bg-primary'}`} />
                        <p className="font-bold text-sm text-foreground">
                          {isYearly ? tr("billingscreen_illik_premium", 'İllik Premium') : tr("billingscreen_ayliq_premium_45f3bf", "Aylıq Premium")}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.date), 'd MMM yyyy, HH:mm', { locale: getCurrentDateLocale() })} · {label}</p>
                        <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isNext ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {isNext ? tr("billingscreen_planli_74dfd2", "Planlı") : config.paid_label}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {isIAPSupported && !isAndroidNative && (
              <button
                onClick={async () => { await showCustomerCenter(); fetchPaymentHistory(); }}
                className="w-full mt-6 py-3 rounded-xl bg-muted/50 text-xs font-semibold text-primary hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                {tr("billingscreen_tam_tarixceni_magazada_ac_946d4d", "Tam tarixçəni mağazada aç")}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}

        {/* Footer Support */}
        <div className="text-center pt-8 pb-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Gift className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            {config.support_text} <br/>
            <a href={`mailto:${config.support_email}`} className="text-primary font-bold mt-1 inline-block">{config.support_email}</a>
          </p>
        </div>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default BillingScreen;
