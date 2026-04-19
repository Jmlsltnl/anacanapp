import { motion } from 'framer-motion';
import { 
  Package, FileText, Vote, BarChart3, 
  Gift, AlertTriangle, ChevronRight
} from 'lucide-react';
import { usePartnerHospitalBag } from '@/hooks/usePartnerHospitalBag';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useSurprises } from '@/hooks/useSurprises';
import { useTranslation } from "@/hooks/useTranslation";

interface SyncedFeaturesGridProps {
  onNavigate: (screen: string) => void;
  onTabChange: (tab: string) => void;
}

const SyncedFeaturesGrid = ({ onNavigate, onTabChange }: SyncedFeaturesGridProps) => {
  const { t } = useTranslation();
  const { checkedCount, totalCount, getProgress } = usePartnerHospitalBag();
  const { todaySummary } = useDailySummary();
  const { plannedSurprises, totalPoints } = useSurprises();

  const features = [
    {
      id: 'hospital-bag',
      title: t("syncedfeaturesgrid_xestexana_cantasi_045078", 'Xəstəxana Çantası'),
      subtitle: `${checkedCount}/${totalCount} hazır`,
      icon: Package,
      gradient: 'from-teal-500 to-emerald-600',
      progress: getProgress(),
      action: () => onNavigate('partner-hospital-bag'),
    },
    {
      id: 'daily-summary',
      title: t("syncedfeaturesgrid_gundelik_xulase_3d07a5", 'Gündəlik Xülasə'),
      subtitle: todaySummary ? 'Bugün göndərildi' : 'Gözləyir...',
      icon: FileText,
      gradient: 'from-purple-500 to-violet-600',
      badge: todaySummary ? ['😢', '😔', '😐', '🙂', '😊'][(todaySummary.mood || 3) - 1] : null,
      action: () => onNavigate('daily-summary'),
    },
    {
      id: 'name-voting',
      title: t("syncedfeaturesgrid_ad_secimi_465d2a", 'Ad Seçimi'),
      subtitle: 'Swipe ilə seç',
      icon: Vote,
      gradient: 'from-pink-500 to-rose-600',
      action: () => onNavigate('name-voting'),
    },
    {
      id: 'weekly-stats',
      title: t("syncedfeaturesgrid_heftelik_statistika_292953", 'Həftəlik Statistika'),
      subtitle: 'Əhval & aktivlik',
      icon: BarChart3,
      gradient: 'from-cyan-500 to-blue-600',
      action: () => onTabChange('stats'),
    },
    {
      id: 'surprises',
      title: t("syncedfeaturesgrid_surpriz_planla_d495ce", 'Sürpriz Planla'),
      subtitle: plannedSurprises.length > 0 ? `${plannedSurprises.length} planlanıb` : 'Planlaşdır',
      icon: Gift,
      gradient: 'from-amber-500 to-orange-600',
      badge: totalPoints > 0 ? `${totalPoints} xal` : null,
      action: () => onTabChange('surprise'),
    },
    {
      id: 'sos',
      title: t("syncedfeaturesgrid_sos_xeberdarliq_6bd6d8", 'SOS Xəbərdarlıq'),
      subtitle: 'Təcili bildiriş',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-700',
      isEmergency: true,
      action: () => {}, // SOS handled separately
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Sinxron Funksiyalar
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {features.slice(0, 5).map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={feature.action}
              className={`bg-card rounded-2xl p-4 border border-border/50 text-left relative overflow-hidden group`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className="flex items-center gap-3 mb-2 relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{feature.subtitle}</p>
                </div>
              </div>

              {/* Progress bar if applicable */}
              {feature.progress !== undefined && (
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <motion.div 
                    className={`h-full bg-gradient-to-r ${feature.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              )}

              {/* Badge */}
              {feature.badge && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-muted/50 rounded-lg text-xs font-medium">
                  {feature.badge}
                </div>
              )}

              {/* Arrow indicator */}
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SyncedFeaturesGrid;
