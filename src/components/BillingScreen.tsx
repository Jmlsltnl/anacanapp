import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Crown, CreditCard, Calendar, CheckCircle, 
  XCircle, Sparkles, AlertTriangle, Loader2, RotateCcw
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
    if (!confirm('Abunəliyi ləğv etmək istədiyinizə əminsiniz? Cari dövrün sonuna qədər Premium xüsusiyyətlərdən istifadə edə biləcəksiniz.')) {
      return;
    }

    setIsCanceling(true);
    const success = await cancelSubscription();
    if (success) {
      toast({
        title: 'Abunəlik ləğv edildi',
        description: 'Cari dövrün sonuna qədər Premium istifadə edə bilərsiniz.',
      });
    } else {
      toast({ title: 'Xəta', description: 'Abunəliyi ləğv etmək mümkün olmadı.', variant: 'destructive' });
    }
    setIsCanceling(false);
  };

  const handleRestoreSubscription = async () => {
    setIsRestoring(true);
    const success = await restoreSubscription();
    if (success) {
      toast({ title: 'Abunəlik bərpa edildi', description: 'Premium abunəliyiniz yenidən aktivdir.' });
    } else {
      toast({ title: 'Xəta', description: 'Abunəliyi bərpa etmək mümkün olmadı.', variant: 'destructive' });
    }
    setIsRestoring(false);
  };

  const getPlanDetails = () => {
    // Check if premium via profile OR subscription
    const hasPremiumSubscription = subscription && (subscription.plan_type === 'premium' || subscription.plan_type === 'premium_plus');
    
    if (!hasPremiumSubscription && !isPremium) {
      return {
        name: 'Pulsuz Plan',
        price: '₼0',
        period: '',
        isYearly: false,
        features: [
          { name: '3 AI foto yaratma', included: true },
          { name: '20 dəqiqə/gün bəyaz küy', included: true },
          { name: 'Əsas alətlər', included: true },
          { name: 'Premium fonlar', included: false },
          { name: 'Premium geyimlər', included: false },
          { name: 'Limitsiz fotosessiya', included: false },
        ]
      };
    }

    // Premium or Premium Plus
    const isPremiumPlus = subscription?.plan_type === 'premium_plus';
    return {
      name: isPremiumPlus ? 'Premium Plus' : 'Premium',
      price: isPremiumPlus ? '₼79.99' : '₼9.99',
      period: isPremiumPlus ? '/il' : '/ay',
      isYearly: isPremiumPlus,
      features: [
        { name: 'Limitsiz AI foto yaratma', included: true },
        { name: 'Limitsiz bəyaz küy', included: true },
        { name: 'Bütün alətlər', included: true },
        { name: 'Premium fonlar', included: true },
        { name: 'Premium geyimlər', included: true },
        { name: 'Prioritet dəstək', included: true },
      ]
    };
  };

  const plan = getPlanDetails();

  return (
    <div className="min-h-screen bg-background pb-safe overflow-y-auto">
      {/* Header with safe area */}
      <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-5 pb-8 rounded-b-3xl" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Abunəliyim</h1>
            <p className="text-white/80 text-sm">Plan və ödənişlər</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-5">
        {/* Current Plan Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-3xl p-6 shadow-elevated ${
            isPremium 
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800'
              : 'bg-card border border-border'
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isPremium 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                : 'bg-muted'
            }`}>
              <Crown className={`w-7 h-7 ${isPremium ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">{plan.name}</h2>
              <p className="text-2xl font-black text-foreground">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
              </p>
            </div>
            {isPremium && (
              <div className={`${isCancelled ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                {isCancelled ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Ləğv edilib
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Aktiv
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cancelled but active notice */}
          {cancelledButActive && subscription?.expires_at && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Abunəliyiniz ləğv edilib, lakin {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })} tarixinə qədər Premium xüsusiyyətlərdən istifadə edə bilərsiniz.
              </p>
            </div>
          )}

          {/* Subscription dates */}
          {subscription && (
            <div className="flex gap-4 mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-xl">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Başlama tarixi</p>
                <p className="font-medium text-foreground text-sm">
                  {format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}
                </p>
              </div>
              {subscription.expires_at && (
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{isCancelled ? 'Premium bitir' : 'Bitmə tarixi'}</p>
                  <p className={`font-medium text-sm ${isCancelled ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {format(new Date(subscription.expires_at), 'd MMM yyyy', { locale: az })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.included ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        {isPremium ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {/* Upgrade plan */}
            {subscription?.plan_type === 'premium' && !isCancelled && (
              <Button
                onClick={() => setShowPremiumModal(true)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Premium Plus-a Yüksəlt (44% qənaət)
              </Button>
            )}

            {isCancelled ? (
              <>
                {/* Restore subscription */}
                <Button
                  onClick={handleRestoreSubscription}
                  disabled={isRestoring}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold"
                >
                  {isRestoring ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-5 h-5 mr-2" />
                  )}
                  Abunəliyi Bərpa Et
                </Button>
              </>
            ) : (
              <>
                {/* Cancel subscription */}
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                >
                  {isCanceling ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  Abunəliyi Ləğv Et
                </Button>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Abunəliyi ləğv etdikdən sonra cari dövrün sonuna qədər Premium xüsusiyyətlərdən istifadə edə biləcəksiniz.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-lg shadow-lg"
            >
              <Crown className="w-6 h-6 mr-2" />
              Premium-a Keç
            </Button>
          </motion.div>
        )}

        {/* Payment history placeholder */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-5 border border-border"
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Ödəniş Tarixçəsi
          </h3>
          
          {isPremium && subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {subscription.plan_type === 'premium_plus' ? 'Premium Plus' : 'Premium'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(subscription.started_at), 'd MMM yyyy', { locale: az })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {subscription.plan_type === 'premium_plus' ? '₼79.99' : '₼9.99'}
                  </p>
                  <span className="text-xs text-green-600 font-medium">Ödənildi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">Hələ ödəniş yoxdur</p>
            </div>
          )}
        </motion.div>

        {/* Support info */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Suallarınız üçün:{' '}
            <a href="mailto:info@anacan.az" className="text-primary font-medium">
              info@anacan.az
            </a>
          </p>
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default BillingScreen;
