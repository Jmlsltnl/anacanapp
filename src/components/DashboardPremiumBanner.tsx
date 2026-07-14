import { useState } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Check, ChevronRight, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserStore } from '@/store/userStore';
import PremiumFunnelModal from '@/components/premium/PremiumFunnelModal';

interface DashboardPremiumBannerProps {
  onOpenPremium?: () => void;
}

const BENEFITS = [
{ icon: '🤖', text: tr("dashboardpremiumbanner_ai_beledci_8bfb55", "AI Bələdçi") },
{ icon: '🎵', text: tr("dashboardpremiumbanner_yuxu_sesleri_4b518b", "Yuxu Səsləri") },
{ icon: '📸', text: tr("common_ai_fotosessiya", 'AI Fotosessiya') },
{ icon: '📊', text: tr("dashboardpremiumbanner_heftelik_hesabat_283d76", "Həftəlik Hesabat") },
{ icon: '💊', text: tr("dashboardpremiumbanner_vitamin_izleyici_31ce7c", "Vitamin İzləyici") },
{ icon: '🍽️', text: tr("dashboardpremiumbanner_qidalanma_plani_a3dde8", "Qidalanma Planı") },
{ icon: '📖', text: tr("dashboardpremiumbanner_nagil_generatoru_a86172", "Nağıl Generatoru") },
{ icon: '🚫', text: tr("dashboardpremiumbanner_reklamsiz_tecrube_07620a", "Reklamsız Təcrübə") }];


const MONTHLY_PRICE = 5.99;
const YEARLY_PRICE = 46.99;
const YEARLY_MONTHLY = +(YEARLY_PRICE / 12).toFixed(2);
const SAVINGS_PCT = Math.round((1 - YEARLY_MONTHLY / MONTHLY_PRICE) * 100);

export default function DashboardPremiumBanner({ onOpenPremium }: DashboardPremiumBannerProps) {
  const { isPremium } = useSubscription();
  const role = useUserStore((s) => s.role);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [modalOpen, setModalOpen] = useState(false);
  // Partnyora premium satışı yoxdur — yalnız qadın üçün premium upsell göstərilir.
  const shouldHideBanner = role === 'partner' || isPremium && !import.meta.env.DEV;

  const handleOpen = () => {
    if (onOpenPremium) onOpenPremium();else
    setModalOpen(true);
  };

  // Keep visible in dev so the paywall can be tested even on premium/dev accounts.
  if (shouldHideBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 mb-6 mt-2">
      
      <div className="rounded-3xl overflow-hidden border border-amber-200/30 dark:border-amber-700/30 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) =>
            <Sparkles key={i} className="absolute text-white" style={{
              top: `${15 + i * 20}%`,
              left: `${10 + i * 18}%`,
              width: 12,
              height: 12,
              animationDelay: `${i * 0.3}s`
            }} />
            )}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-white" />
              <span className="text-lg font-bold text-white">Anacan Premium</span>
            </div>
            <p className="text-xs text-white/80">{tr("dashboardpremiumbanner_tam_imkanlar_limitsiz_giris_25c339", "Tam imkanlar · Limitsiz giriş")}</p>
          </div>
        </div>

        {/* Free trial highlight */}
        <div className="flex justify-center -mt-3 relative z-10">
          <div className="px-5 py-1.5 bg-white dark:bg-card rounded-full shadow-lg border border-border/50">
            <span className="text-xs font-bold text-foreground">{tr("dashboardpremiumbanner_ilk_3_gun_tamamile_odenissiz_0a15ef", "🎁 İlk 3 gün tamamilə ödənişsiz")}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-5 pb-5">
          {/* Benefits grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {BENEFITS.map((b, i) =>
            <motion.div
              key={b.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-2 py-1.5">
              
                <span className="text-sm">{b.icon}</span>
                <span className="text-[11px] font-medium text-foreground">{b.text}</span>
              </motion.div>
            )}
          </div>

          {/* Plan selector - compact */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all relative ${
              selectedPlan === 'yearly' ?
              'border-amber-500 bg-amber-500/10' :
              'border-border bg-card'}`
              }>
              
              {selectedPlan === 'yearly' &&
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full whitespace-nowrap">
                  {SAVINGS_PCT}{tr("dashboardpremiumbanner_qenaet_e2248a", "% Q\u018FNA\u018FT")}
                </span>
              }
              <p className="text-xs font-semibold text-foreground">{tr("dashboardpremiumbanner_illik_4a3cef", "İllik")}</p>
              <p className="text-sm font-bold text-foreground">${YEARLY_MONTHLY}<span className="text-[10px] text-muted-foreground font-normal">{tr("common_per_month", '/ay')}</span></p>
              <p className="text-[10px] text-muted-foreground">${YEARLY_PRICE}{tr("usepaywallconfig_yearly_total_suffix", '/il')}</p>
            </button>
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
              selectedPlan === 'monthly' ?
              'border-amber-500 bg-amber-500/10' :
              'border-border bg-card'}`
              }>
              
              <p className="text-xs font-semibold text-foreground">{tr("dashboardpremiumbanner_ayliq_6f265e", "Aylıq")}</p>
              <p className="text-sm font-bold text-foreground">${MONTHLY_PRICE}<span className="text-[10px] text-muted-foreground font-normal">{tr("common_per_month", '/ay')}</span></p>
              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
            </button>
          </div>

          {/* CTA */}
          <Button
            onClick={handleOpen}
            className="w-full h-12 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20">
            
            <Sparkles className="w-4 h-4 mr-1" />
            {tr("dashboardpremiumbanner_3_gun_pulsuz_basla_2564a7", "3 G\xFCn Pulsuz Ba\u015Fla")}
          </Button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {tr("dashboardpremiumbanner_3_gun_pulsuz_sonra_77de61", "3 g\xFCn pulsuz \xB7 Sonra")} {selectedPlan === 'yearly' ? `$${YEARLY_PRICE}${tr("usepaywallconfig_yearly_total_suffix", '/il')}` : `$${MONTHLY_PRICE}${tr("common_per_month", '/ay')}`} {tr("dashboardpremiumbanner_i_stenilen_vaxt_legv_edin_d41c16", "\xB7 \u0130st\u0259nil\u0259n vaxt l\u0259\u011Fv edin")}
            </span>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((i) =>
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            )}
            <span className="text-[10px] text-muted-foreground ml-1">{tr("dashboardpremiumbanner_1_000_qadin_terefinden_secildi_40fdd7", "1,000+ qadın tərəfindən seçildi")}</span>
          </div>
        </div>
      </div>
      <PremiumFunnelModal isOpen={modalOpen} onClose={() => setModalOpen(false)} feature="dashboard_banner" />
    </motion.div>);

}