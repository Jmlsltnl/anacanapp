import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Crown, Calendar, CheckCircle, 
  XCircle, Sparkles, AlertTriangle, Loader2, RotateCcw,
  Zap, Shield, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { PremiumModal } from '@/components/PremiumModal';
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCancelSubscription = async () => {
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
  const planName = !hasPremiumSub && !isPremium ? 'Pulsuz Plan' : isPremiumPlus ? 'Premium İllik' : 'Premium Aylıq';
  const planPrice = !hasPremiumSub && !isPremium ? '₼0' : isPremiumPlus ? '₼79.99' : '₼9.99';
  const planPeriod = !hasPremiumSub && !isPremium ? '' : isPremiumPlus ? '/il' : '/ay';

  return (
    <div className="min-h-screen bg-background pb-safe overflow-y-auto">
      {/* Header */}
      <div 
        className={`px-5 pb-6 rounded-b-3xl ${
          isPremium 
            ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600' 
            : 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800'
        }`} 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <motion.button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center" whileTap={{ scale: 0.95 }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-lg font-bold text-white flex-1">Abunəliyim</h1>
        </div>

        {/* Plan card inline */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-white/20' : 'bg-white/10'}`}>
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-lg">{planName}</h2>
              {isPremium && !isCancelled && (
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />Aktiv
                </span>
              )}
              {isCancelled && (
                <span className="bg-amber-300/30 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />Ləğv edilib
                </span>
              )}
            </div>
            <p className="text-white/80 text-xl font-black mt-0.5">{planPrice}<span className="text-sm font-normal text-white/60">{planPeriod}</span></p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 space-y-4">
        {/* Cancelled but active notice */}
        {cancelledButActive && subscription?.expires_at && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })} tarixinə qədər Premium aktiv qalacaq.
            </p>
          </motion.div>
        )}

        {/* Subscription dates */}
        {subscription && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">Başlama</p>
                <p className="font-semibold text-foreground text-sm mt-0.5">{format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}</p>
              </div>
              {subscription.expires_at && (
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">{isCancelled ? 'Premium bitir' : 'Yenilənmə'}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${isCancelled ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Features summary */}
        {isPremium && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />Planınıza daxildir
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Zap, text: 'Limitsiz AI' },
                { icon: Shield, text: 'Reklamsız' },
                { icon: Crown, text: 'Premium fonlar' },
                { icon: Sparkles, text: 'Prioritet dəstək' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
                    <f.icon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {isPremium ? (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2.5">
            {subscription?.plan_type === 'premium' && !isCancelled && (
              <Button
                onClick={() => setShowPremiumModal(true)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />İllik Plana Keç ({44}% qənaət)
              </Button>
            )}

            {isCancelled ? (
              <Button
                onClick={handleRestoreSubscription}
                disabled={isRestoring}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm"
              >
                {isRestoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Abunəliyi Bərpa Et
              </Button>
            ) : (
              <Button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                variant="outline"
                className="w-full h-11 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 text-sm"
              >
                {isCanceling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Abunəliyi Ləğv Et
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-bold text-base shadow-lg shadow-orange-500/20"
            >
              <Crown className="w-5 h-5 mr-2" />Premium-a Keç
            </Button>
          </motion.div>
        )}

        {/* Payment history */}
        {isPremium && subscription && (
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />Son ödəniş
            </h3>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground text-sm">{planName}</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground text-sm">{planPrice}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ödənildi</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Support */}
        <div className="text-center py-3">
          <p className="text-[10px] text-muted-foreground">
            Suallarınız üçün: <a href="mailto:info@anacan.az" className="text-primary font-medium">info@anacan.az</a>
          </p>
        </div>
      </div>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default BillingScreen;
