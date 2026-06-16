import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { Pill, AlertCircle, Leaf, Info } from 'lucide-react';
import { useVitamins, Vitamin } from '@/hooks/useVitamins';
import { useUserStore } from '@/store/userStore';
import { getPregnancyWeek } from '@/lib/pregnancy-utils';

interface VitaminsTabProps {
  className?: string;
}

const VitaminsTab = ({ className }: VitaminsTabProps) => {
  const { lifeStage, lastPeriodDate } = useUserStore();

  // Calculate current pregnancy week
  const currentWeek =
  lifeStage === 'bump' && lastPeriodDate ?
  Math.max(1, getPregnancyWeek(lastPeriodDate)) :
  undefined;

  const { data: vitamins = [], isLoading } = useVitamins(currentWeek, lifeStage || 'bump');

  // Separate essential and recommended vitamins
  const essentialVitamins = vitamins.filter((v) => v.importance === 'essential');
  const recommendedVitamins = vitamins.filter((v) => v.importance === 'recommended');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  const VitaminCard = ({ vitamin, index, isEssential }: {vitamin: Vitamin;index: number;isEssential: boolean;}) =>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`bg-card rounded-xl p-3 shadow-card border ${
    isEssential ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`
    }>
    
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
      isEssential ? 'bg-primary/20' : 'bg-muted'}`
      }>
          {vitamin.icon_emoji || '💊'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{vitamin.name_az || vitamin.name}</h3>
            {isEssential &&
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                Vacib
              </span>
          }
          </div>
          {vitamin.description_az &&
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {vitamin.description_az}
            </p>
        }
          
          {/* Dosage */}
          {vitamin.dosage &&
        <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-medium">
              <Pill className="w-3 h-3" />
              {vitamin.dosage}
            </div>
        }
        </div>
      </div>

      {/* Benefits */}
      {vitamin.benefits && vitamin.benefits.length > 0 &&
    <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">{tr("vitaminstab_faydalari_8b3d9f", "Faydaları:")}</p>
          <div className="flex flex-wrap gap-1">
            {vitamin.benefits.slice(0, 3).map((benefit, i) =>
        <span
          key={i}
          className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-foreground/80">
          
                {benefit}
              </span>
        )}
          </div>
        </div>
    }

      {/* Food Sources */}
      {vitamin.food_sources && vitamin.food_sources.length > 0 &&
    <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium flex items-center gap-1">
            <Leaf className="w-3 h-3" />
            {tr("vitaminstab_qida_menbeleri_b0a789", "Qida m\u0259nb\u0259l\u0259ri:")}
          </p>
          <p className="text-xs text-foreground/80">
            {vitamin.food_sources.join(', ')}
          </p>
        </div>
    }
    </motion.div>;


  return (
    <motion.div
      key="vitamins"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`space-y-4 ${className}`}>
      
      {/* Current Week Info */}
      {lifeStage === 'bump' && currentWeek &&
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">{tr("vitaminstab_hefte_3aa886", "H\u0259ft\u0259")} {currentWeek}</span> {tr("vitaminstab_ucun_tovsiye_olunan_vitaminler_1552cd", "\xFC\xE7\xFCn t\xF6vsiy\u0259 olunan vitaminl\u0259r")}
          </p>
        </div>
      }

      {/* Essential Vitamins */}
      {essentialVitamins.length > 0 &&
      <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-foreground">{tr("vitaminstab_vacib_vitaminler_167026", "Vacib Vitaminlər")}</h2>
          </div>
          <div className="space-y-2">
            {essentialVitamins.map((vitamin, index) =>
          <VitaminCard key={vitamin.id} vitamin={vitamin} index={index} isEssential={true} />
          )}
          </div>
        </div>
      }

      {/* Recommended Vitamins */}
      {recommendedVitamins.length > 0 &&
      <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bold text-sm text-foreground">{tr("vitaminstab_tovsiye_olunan_f7f407", "Tövsiyə Olunan")}</h2>
          </div>
          <div className="space-y-2">
            {recommendedVitamins.map((vitamin, index) =>
          <VitaminCard key={vitamin.id} vitamin={vitamin} index={index} isEssential={false} />
          )}
          </div>
        </div>
      }

      {vitamins.length === 0 &&
      <div className="text-center py-12 text-muted-foreground">
          <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{tr("vitaminstab_bu_merhele_ucun_vitamin_melumati_yoxdur_d17150", "Bu mərhələ üçün vitamin məlumatı yoxdur")}</p>
        </div>
      }

      {/* Disclaimer */}
      <div className="bg-muted/50 rounded-xl p-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          {tr("vitaminstab_bu_melumatlar_umumi_xarakter_d_0af27f", "\u26A0\uFE0F Bu m\u0259lumatlar \xFCmumi xarakter da\u015F\u0131y\u0131r. Vitamin q\u0259bulundan \u0259vv\u0259l h\u0259kiminizl\u0259 m\u0259sl\u0259h\u0259tl\u0259\u015Fin.")}
        </p>
      </div>
    </motion.div>);

};

export default VitaminsTab;