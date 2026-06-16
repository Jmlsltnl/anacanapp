import { tr } from "@/lib/tr";import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { PremiumModal } from '@/components/PremiumModal';

const AIChatScreen = lazy(() => import('@/components/AIChatScreen'));

const fallback =
<div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>;


const PartnerAIPremiumGate = () => {
  const { isPremium, loading } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (loading) return fallback;

  if (isPremium) {
    return (
      <Suspense fallback={fallback}>
        <AIChatScreen />
      </Suspense>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-background px-5 pt-8 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            <motion.div
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}>
              
              <Crown className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              
              <Sparkles className="w-4 h-4 text-amber-500" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">
            {tr("partneraipremiumgate_anacan_ai_premium_ucundur_37ae9a", "Anacan.AI Premium \xFC\xE7\xFCnd\xFCr")}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {tr("partneraipremiumgate_anacan_ai_komekcisi_ve_partnyo_b352ea", "Anacan.AI k\xF6m\u0259k\xE7isi v\u0259 partnyor funksiyalar\u0131 yaln\u0131z Premium istifad\u0259\xE7il\u0259r \xFC\xE7\xFCnd\xFCr.\n            H\u0259yat yolda\u015F\u0131n\u0131z\u0131n v\u0259 ya \xF6z hesab\u0131n\u0131z\u0131n Premium aboneliyi aktiv olduqda burada\n            ekspert m\u0259sl\u0259h\u0259tl\u0259ri ala bil\u0259rsiniz.")}
          

          </p>
        </div>

        <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-card mb-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {tr("partneraipremiumgate_premium_da_ne_var_d28116", "Premium-da n\u0259 var?")}
          </h3>
          <ul className="space-y-2.5">
            {[tr("partneraipremiumgate_anacan_ai_ile_limitsiz_sohbet_431177", "Anacan.AI il\u0259 limitsiz s\xF6hb\u0259t"), tr("partneraipremiumgate_hamilelik_ve_korpe_bilgileri_9b3dc5", "Hamil\u0259lik v\u0259 k\xF6rp\u0259 bilgil\u0259ri"), tr("partneraipremiumgate_partnyor_mod_ve_sinxronizasiya_1e764c", "Partnyor mod v\u0259 sinxronizasiya"), tr("partneraipremiumgate_butun_premium_aletler_b6b57d", "B\xFCt\xFCn premium al\u0259tl\u0259r")].




            map((item) =>
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                {item}
              </li>
            )}
          </ul>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-amber-500/30">
          
          <Crown className="w-5 h-5 mr-2" />
          {tr("partneraipremiumgate_premium_a_kec_9dadb6", "Premium-a ke\xE7")}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          {tr("partneraipremiumgate_aboneliyi_heyat_yoldasiniz_da__8eb9a1", "Aboneliyi h\u0259yat yolda\u015F\u0131n\u0131z da \u0259ld\u0259 ed\u0259 bil\u0259r \u2014 ikiniz \xFC\xE7\xFCn d\u0259 a\xE7\u0131lacaq.")}
        </p>
      </motion.div>

      <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>);

};

export default PartnerAIPremiumGate;