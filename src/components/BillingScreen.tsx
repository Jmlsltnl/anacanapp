import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Crown, CheckCircle, 
  XCircle, Sparkles, AlertTriangle, Loader2, RotateCcw,
  Zap, Shield, CreditCard, icons, Calendar, TrendingUp,
  Lock, Star, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { PremiumModal } from '@/components/PremiumModal';
import { useBillingConfig } from '@/hooks/usePaywallConfig';
import { usePremiumConfig } from '@/hooks/usePremiumConfig';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

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
  const { manageSubscriptions, isSupported: isIAPSupported } = useInAppPurchase();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCancelSubscription = async () => {
    // On native platforms, redirect to App Store / Play Store subscription management
    if (isIAPSupported) {
      if (!confirm('Abunəliyi ləğv etmək üçün App Store / Google Play abunəlik idarəetmə səhifəsinə yönləndiriləcəksiniz.')) return;
      setIsCanceling(true);
      await manageSubscriptions();
      setIsCanceling(false);
      return;
    }
    
    // Fallback for web
    if (!confirm('Abunəliyi ləğv etmək istədiyinizə əminsiniz? Cari dövrün sonuna qədər Premium xüsusiyyətlərdən istifadə edə biləcəksiniz.')) return;
    setIsCanceling(true);
    const success = await cancelSubscription();
    toast(success 
      ? { title: 'Abunəlik ləğv edildi', description: 'Cari dövrün sonuna qədər Premium istifadə edə bilərsiniz.' }
      : { title: 'Xəta', description: 'Abunəliyi ləğv etmək mümkün olmadı.', variant: 'destructive' }
    );
    setIsCanceling(false);
  };

  const handleRestoreSubscription = async () => {
    setIsRestoring(true);
    const success = await restoreSubscription();
    toast(success
      ? { title: 'Abunəlik bərpa edildi', description: 'Premium abunəliyiniz yenidən aktivdir.' }
      : { title: 'Xəta', description: 'Abunəliyi bərpa etmək mümkün olmadı.', variant: 'destructive' }
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
  const premiumOnlyFeatures = dbFeatures.filter(f => !f.is_included_free && f.is_included_premium);

  return (
    <div className="min-h-screen bg-background pb-safe overflow-y-auto">
      {/* Header with gradient */}
      <div 
        className="px-5 pb-8 rounded-b-[2rem] relative overflow-hidden"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          background: isPremium 
            ? `linear-gradient(135deg, ${config.header_gradient_from}, ${config.header_gradient_via}, ${config.header_gradient_to})`
            : `linear-gradient(135deg, ${config.header_free_from}, ${config.header_free_via}, ${config.header_free_to})`
        }}
      >
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
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-white/20' : 'bg-white/10'}`}>
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-lg">{planName}</h2>
                  {isPremium && !isCancelled && (
                    <span className="bg-emerald-400/20 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                      <CheckCircle className="w-3 h-3" />{config.active_badge}
                    </span>
                  )}
                  {isCancelled && (
                    <span className="bg-amber-400/20 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/30">
                      <AlertTriangle className="w-3 h-3" />{config.cancelled_badge}
                    </span>
                  )}
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
        {isFreeUser && (
          <>
            {/* Premium promotion card */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 rounded-2xl p-4 border border-primary/15 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Premium-a yüksəldin!</h3>
                  <p className="text-[10px] text-muted-foreground">Sınırsız imkanlar əldə edin</p>
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
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {feat ? (
                          <span className="text-xs">{feat.icon}</span>
                        ) : (
                          renderIcon((f as any).icon, 'w-3 h-3 text-primary')
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground flex-1">
                        {feat ? (feat.title_az || feat.title) : (f as any).text}
                      </span>
                      <Lock className="w-3 h-3 text-muted-foreground/50" />
                    </motion.div>
                  );
                })}
              </div>

              <Button
                onClick={() => setShowPremiumModal(true)}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/15"
              >
                <Crown className="w-4 h-4 mr-2" />{config.get_premium_cta}
              </Button>
            </motion.div>

            {/* Current free limits info */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
            >
              <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />Pulsuz plana daxildir
              </h3>
              <div className="space-y-2">
                {[
                  { text: 'Gündəlik limitli AI çat', included: true },
                  { text: 'Əsas izləmə alətləri', included: true },
                  { text: 'Topluluk girişi', included: true },
                  { text: 'Reklam ilə istifadə', included: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Premium comparison teaser */}
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              onClick={() => setShowPremiumModal(true)}
              className="w-full bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3 text-left"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Planları müqayisə edin</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Premium ilə nələr əldə edəcəyinizi görün</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </>
        )}

        {/* ═══ PREMIUM USER CONTENT ═══ */}
        {/* Cancelled but active notice */}
        {cancelledButActive && subscription?.expires_at && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-start gap-2.5 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {config.cancelled_notice.replace('{date}', format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az }))}
            </p>
          </motion.div>
        )}

        {/* Subscription dates */}
        {subscription && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{config.start_date_label}</p>
                </div>
                <p className="font-bold text-foreground text-sm">{format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}</p>
              </div>
              {subscription.expires_at && (
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{isCancelled ? config.expiry_label : config.renewal_label}</p>
                  </div>
                  <p className={`font-bold text-sm ${isCancelled ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Features summary - premium only */}
        {isPremium && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />{config.features_title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {config.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    {renderIcon(f.icon, 'w-3.5 h-3.5 text-primary')}
                  </div>
                  <span className="font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions - premium */}
        {isPremium && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2.5">
            {subscription?.plan_type === 'premium' && !isCancelled && (
              <Button
                onClick={() => setShowPremiumModal(true)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {config.upgrade_cta} ({config.upgrade_savings.replace('{percent}', String(savingsPercent))})
              </Button>
            )}

            {isCancelled ? (
              <Button
                onClick={handleRestoreSubscription}
                disabled={isRestoring}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg"
              >
                {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                {config.restore_cta}
              </Button>
            ) : (
              <Button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                variant="outline"
                className="w-full h-11 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 text-sm"
              >
                {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                {config.cancel_cta}
              </Button>
            )}
          </motion.div>
        )}

        {/* Payment history */}
        {isPremium && subscription && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />{config.payment_title}
            </h3>
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <div>
                <p className="font-semibold text-foreground text-sm">{planName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground text-sm">{planPrice}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{config.paid_label}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Support */}
        <div className="text-center py-4">
          <p className="text-[10px] text-muted-foreground">
            {config.support_text} <a href={`mailto:${config.support_email}`} className="text-primary font-semibold">{config.support_email}</a>
          </p>
        </div>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default BillingScreen;
