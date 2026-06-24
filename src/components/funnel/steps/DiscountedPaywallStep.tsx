import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { Button } from '@/components/ui/button';
import { Gift, Clock } from 'lucide-react';

interface DiscountedPaywallStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function DiscountedPaywallStep({ onAccept, onDecline }: DiscountedPaywallStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-full px-6 py-8 text-center">
      
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6">
        <Gift className="w-10 h-10 text-primary-foreground" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">{tr("discountedpaywallstep_gozleyin_199650", "Gözləyin!")}</h2>
      <p className="text-base text-foreground font-medium mb-1">
        {tr("discountedpaywallstep_xususi_teklif_yalniz_sizin_ucu_71a5d3", "X\xFCsusi t\u0259klif \u2014 yaln\u0131z sizin \xFC\xE7\xFCn")}
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        {tr("discountedpaywallstep_i_lk_3_gun_tamamile_pulsuz_sin_4826d3", "\u0130lk 3 g\xFCn tamamil\u0259 pulsuz s\u0131nay\u0131n")}
      </p>

      <div className="bg-card rounded-3xl border-2 border-primary/30 p-6 w-full mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">{tr("discountedpaywallstep_bu_teklif_yalniz_1_defe_gosterilir_6801d4", "Bu təklif yalnız 1 dəfə göstərilir")}</span>
        </div>
        <p className="text-lg font-bold text-foreground mb-1">{tr("discountedpaywallstep_3_gun_pulsuz_premium_06d4ab", "3 Gün Pulsuz Premium")}</p>
        <p className="text-sm text-muted-foreground">
          {tr("discountedpaywallstep_butun_funksiyalara_tam_giris_b_bca218", "B\xFCt\xFCn funksiyalara tam giri\u015F. B\u0259y\u0259nm\u0259s\u0259niz, he\xE7 bir \xF6d\u0259ni\u015F tutulmur.")}
        </p>
      </div>

      <div className="w-full space-y-3 pb-safe">
        <Button
          onClick={onAccept}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow,20_90%_60%))] text-primary-foreground shadow-lg">
          {tr("discountedpaywallstep_pulsuz_basla_4e3982", "Pulsuz Ba\u015Fla")}
        
        </Button>
        <button
          onClick={onDecline}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          
          {tr("discountedpaywallstep_xeyr_davam_et_a831bc", "Xeyr, davam et")}
        </button>
      </div>
    </motion.div>);

}