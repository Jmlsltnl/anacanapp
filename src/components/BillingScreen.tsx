import { useState, useEffect } from 'react';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Crown, CheckCircle,
  XCircle, Sparkles, AlertTriangle, Loader2, RotateCcw,
  Zap, Shield, CreditCard, icons, Calendar, TrendingUp,
  Lock, Star, ChevronRight, RefreshCw } from
'lucide-react';
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
import { az } from 'date-fns/locale';
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
        if (a.type === 'next' && b.type !== 'next') return 1;
        if (b.type === 'next' && a.type !== 'next') return -1;
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
      if (!confirm(tr("billingscreen_abuneliyi_legv_etmek_ucun_app__ee8b2a", "Abun\u0259liyi l\u0259\u011Fv etm\u0259k \xFC\xE7\xFCn App Store / Google Play abun\u0259lik idar\u0259etm\u0259 s\u0259hif\u0259sin\u0259 y\xF6nl\u0259ndiril\u0259c\u0259ksiniz."))) return;
      setIsCanceling(true);
      await showCustomerCenter();
      setIsCanceling(false);
      return;
    }

    // Fallback for web
    if (!confirm(tr("billingscreen_abuneliyi_legv_etmek_istediyin_8c90e4", "Abun\u0259liyi l\u0259\u011Fv etm\u0259k ist\u0259diyiniz\u0259 \u0259minsiniz? Cari d\xF6vr\xFCn sonuna q\u0259d\u0259r Premium x\xFCsusiyy\u0259tl\u0259rd\u0259n istifad\u0259 ed\u0259 bil\u0259c\u0259ksiniz."))) return;
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
  const planPeriod = !hasPremiumSub && !isPremium ? '' : isPremiumPlus ? '/il' : '/ay';

  const renderIcon = (iconName: string, className: string) => {
    const IconComp = icons[iconName as keyof typeof icons];
    return IconComp ? <IconComp className={className} /> : <Sparkles className={className} />;
  };

  const savingsPercent = 44;
  const isFreeUser = !hasPremiumSub && !isPremium;

  // Get premium-only features for free user showcase
  const premiumOnlyFeatures = dbFeatures.filter((f) => !f.is_included_free && f.is_included_premium);

  return (
    <div className="min-h-screen bg-background pb-safe overflow-y-auto">
      {/* Header with gradient */}
      <div
        className="px-5 pb-8 rounded-b-[2rem] relative overflow-hidden"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          background: isPremium ?
          `linear-gradient(135deg, ${config.header_gradient_from}, ${config.header_gradient_via}, ${config.header_gradient_to})` :
          `linear-gradient(135deg, ${config.header_free_from}, ${config.header_free_via}, ${config.header_free_to})`
        }}>
        
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <motion.button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <h1 className="text-lg font-bold text-white flex-1">{config.page_title}</h1>
          </div>

          {/* Plan card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            
            <div className="flex items-center gap-4">
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-white/20' : 'bg-white/10'}`}>
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-lg">{planName}</h2>
                  {isPremium && !isCancelled &&
                  <span className="bg-emerald-400/20 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                      <CheckCircle className="w-3 h-3" />{config.active_badge}
                    </span>
                  }
                  {isCancelled &&
                  <span className="bg-amber-400/20 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/30">
                      <AlertTriangle className="w-3 h-3" />{config.cancelled_badge}
                    </span>
                  }
                </div>
                <p className="text-white/90 text-2xl font-black mt-1">
                  {planPrice}
                  <span className="text-sm font-medium text-white/50 ml-0.5">{planPeriod}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-3.5">
        {/* ═══ FREE USER CONTENT ═══ */}
        {isFreeUser &&
        <>
            {/* Premium promotion card */}
            <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 rounded-2xl p-4 border border-primary/15 shadow-sm">
            
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{tr("billingscreen_premium_a_yukseldin_d29d79", "Premium-a yüksəldin!")}</h3>
                  <p className="text-[10px] text-muted-foreground">{tr("billingscreen_sinirsiz_imkanlar_elde_edin_8ffea5", "Sınırsız imkanlar əldə edin")}</p>
                </div>
              </div>

              {/* What you're missing */}
              <div className="space-y-2 mb-3.5">
                {(premiumOnlyFeatures.length > 0 ? premiumOnlyFeatures.slice(0, 4) : config.features).map((f, i) => {
                const feat = 'title_az' in f ? f : null;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-2.5">
                    
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {feat ?
                      <span className="text-xs">{feat.icon}</span> :

                      renderIcon((f as any).icon, 'w-3 h-3 text-primary')
                      }
                      </div>
                      <span className="text-xs font-medium text-foreground flex-1">
                        {feat ? feat.title_az || feat.title : (f as any).text}
                      </span>
                      <Lock className="w-3 h-3 text-muted-foreground/50" />
                    </motion.div>);

              })}
              </div>

              <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/15">
              
                <Crown className="w-4 h-4 mr-2" />{config.get_premium_cta}
              </Button>
            </motion.div>

            {/* Current free limits info */}
            <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            
              <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />Pulsuz plana daxildir
              </h3>
              <div className="space-y-2">
                {[
              { text: tr("billingscreen_gundelik_limitli_ai_cat_cde61e", "Gündəlik limitli AI çat"), included: true },
              { text: tr("billingscreen_esas_izleme_aletleri_d7a341", "Əsas izləmə alətləri"), included: true },
              { text: tr("billingscreen_topluluk_girisi_4f806d", "Topluluk girişi"), included: true },
              { text: tr("billingscreen_reklam_ile_istifade_6445ef", "Reklam ilə istifadə"), included: true }].
              map((item, i) =>
              <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
              )}
              </div>
            </motion.div>

            {/* Premium comparison teaser */}
            <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => setShowPremiumModal(true)}
            className="w-full bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3 text-left"
            whileTap={{ scale: 0.98 }}>
            
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{tr("billingscreen_planlari_muqayise_edin_13fb70", "Planları müqayisə edin")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tr("billingscreen_premium_ile_neler_elde_edeceyinizi_gorun_5b1bd7", "Premium ilə nələr əldə edəcəyinizi görün")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </>
        }

        {/* ═══ PREMIUM USER CONTENT ═══ */}
        {/* Cancelled but active notice */}
        {cancelledButActive && subscription?.expires_at &&
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-start gap-2.5 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {config.cancelled_notice.replace('{date}', format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az }))}
            </p>
          </motion.div>
        }

        {/* Subscription dates */}
        {subscription &&
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{config.start_date_label}</p>
                </div>
                <p className="font-bold text-foreground text-sm">{format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}</p>
              </div>
              {subscription.expires_at &&
            <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{isCancelled ? config.expiry_label : config.renewal_label}</p>
                  </div>
                  <p className={`font-bold text-sm ${isCancelled ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })}
                  </p>
                </div>
            }
            </div>
          </motion.div>
        }

        {/* Features summary - premium only */}
        {isPremium &&
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />{config.features_title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {config.features.map((f, i) =>
            <div key={i} className="flex items-center gap-2.5 text-xs text-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    {renderIcon(f.icon, 'w-3.5 h-3.5 text-primary')}
                  </div>
                  <span className="font-medium">{f.text}</span>
                </div>
            )}
            </div>
          </motion.div>
        }

        {/* Actions - premium */}
        {isPremium &&
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2.5">
            {subscription?.plan_type === 'premium' && !isCancelled &&
          <Button
            onClick={() => setShowPremiumModal(true)}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
            
                <Sparkles className="w-4 h-4 mr-2" />
                {config.upgrade_cta} ({config.upgrade_savings.replace('{percent}', String(savingsPercent))})
              </Button>
          }

            {isCancelled ?
          <Button
            onClick={handleRestoreSubscription}
            disabled={isRestoring}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg">
            
                {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                {config.restore_cta}
              </Button> :

          <Button
            onClick={handleCancelSubscription}
            disabled={isCanceling}
            variant="outline"
            className="w-full h-11 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 text-sm">
            
                {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                {config.cancel_cta}
              </Button>
          }
          </motion.div>
        }

        {/* Payment history (real RevenueCat data) */}
        {isPremium && subscription &&
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />{config.payment_title}
              </h3>
              <button
              onClick={fetchPaymentHistory}
              disabled={loadingPayments}
              className="text-muted-foreground hover:text-foreground"
              aria-label={tr("billingscreen_yenile_570ce2", "Yenil\u0259")}>
              
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              {payments.length === 0 ?
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{planName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-sm">{planPrice}</p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{config.paid_label}</span>
                  </div>
                </div> :

            payments.map((p, i) => {
              const isYearly = p.productId.toLowerCase().includes('year') || p.productId.toLowerCase().includes('annual');
              const itemLabel =
              p.type === 'original' ? tr("billingscreen_i_lk_alis_2f33af", "\u0130lk al\u0131\u015F") :
              p.type === 'next' ? tr("billingscreen_novbeti_yenilenme_0ab0fe", "N\xF6vb\u0259ti yenil\u0259nm\u0259") : tr("billingscreen_avtomatik_yenilenme_251a6c", "Avtomatik yenil\u0259nm\u0259");

              return (
                <div key={`${p.productId}-${p.date}-${i}`} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {isYearly ? 'İllik Premium' : tr("billingscreen_ayliq_premium_45f3bf", "Ayl\u0131q Premium")}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(p.date), 'd MMM yyyy, HH:mm', { locale: az })} · {itemLabel}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {p.type === 'next' ?
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{tr("billingscreen_planli_74dfd2", "Planlı")}</span> :

                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{config.paid_label}</span>
                    }
                      </div>
                    </div>);

            })
            }
            </div>

            {isIAPSupported && !isAndroidNative &&
          <button
            onClick={async () => {await showCustomerCenter();fetchPaymentHistory();}}
            className="w-full mt-3 text-[11px] text-primary font-semibold hover:underline">
                {tr("billingscreen_tam_tarixceni_magazada_ac_946d4d", "Tam tarix\xE7\u0259ni ma\u011Fazada a\xE7 \u2192")}
              
          </button>
          }
          </motion.div>
        }

        {/* Support */}
        <div className="text-center py-4">
          <p className="text-[10px] text-muted-foreground">
            {config.support_text} <a href={`mailto:${config.support_email}`} className="text-primary font-semibold">{config.support_email}</a>
          </p>
        </div>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>);

};

export default BillingScreen;