import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, BookOpen, Camera, Music, 
  Baby, Thermometer, AlertCircle, Sparkles, Star, Heart, LucideIcon, Lock, Crown
} from 'lucide-react';
import { hapticFeedback } from '@/lib/native';
import { useQuickActions } from '@/hooks/useQuickActions';
import { useChildren } from '@/hooks/useChildren';
import { useToolConfigs } from '@/hooks/useDynamicTools';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserStore } from '@/store/userStore';
import { tr } from '@/lib/tr';
import { PremiumModal } from '@/components/PremiumModal';
import { useDisabledTools } from '@/hooks/useDisabledTools';

const ICON_MAP: Record<string, LucideIcon> = {
  Baby, Thermometer, Music, AlertCircle, Sparkles, BookOpen, Camera, Stethoscope, Heart, Star
};

interface QuickActionsBarProps {
  onNavigateToTool?: (tool: string) => void;
}

const QuickActionsBar = ({ onNavigateToTool }: QuickActionsBarProps) => {
  const { selectedChild, getChildAge } = useChildren();
  const { lifeStage, language } = useUserStore();
  const { isPremium } = useSubscription();
  const { data: toolConfigs = [] } = useToolConfigs(lifeStage);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const childAge = selectedChild ? getChildAge(selectedChild) : null;
  const ageInMonths = childAge?.months || 0;
  const ageGroup = ageInMonths < 3 ? 'newborn' : 'older';
  
  const { data: dbActions = [], isLoading } = useQuickActions('mommy', ageGroup);
  const { disabledTools } = useDisabledTools();

  // Filter out actions for disabled tools
  const filteredActions = dbActions.filter(a => !disabledTools.includes(a.tool_key));

  const isToolPremium = (toolKey: string): boolean => {
    const config = toolConfigs.find(t => t.tool_id === toolKey);
    if (!config) return false;
    if (config.is_premium) return true;
    if (lifeStage === 'mommy' && config.mommy_locked) return true;
    if (lifeStage === 'bump' && config.bump_locked) return true;
    if (lifeStage === 'flow' && config.flow_locked) return true;
    return false;
  };

  const handleAction = async (toolKey: string) => {
    await hapticFeedback.light();
    if (!isPremium && isToolPremium(toolKey)) {
      setShowPremiumModal(true);
      return;
    }
    onNavigateToTool?.(toolKey);
  };

  if (isLoading) {
    return (
      <motion.div
        className="bg-card rounded-2xl p-3 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  const getTranslationKey = (toolKey: string): string => {
    const normalized = toolKey.replace(/-/g, '_');
    if (normalized === 'baby_photo') return 'quick_action_baby_photoshoot';
    if (normalized === 'fairy_tales') return 'quick_action_fairy_tale';
    return `quick_action_${normalized}`;
  };

  return (
    <>
      <motion.div
        className="bg-card rounded-2xl p-3 shadow-card border border-border/50"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <p className="text-[10px] text-muted-foreground font-medium mb-2 px-1">
          {ageGroup === 'newborn' ? tr('quickactionsbar_for_newborn', 'Yenidoğan üçün') : tr('quickactionsbar_quick_access', 'Sürətli keçid')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {filteredActions.map((action, idx) => {
            const IconComponent = ICON_MAP[action.icon] || Star;
            const needsPremium = !isPremium && isToolPremium(action.tool_key);
            return (
              <motion.button
                key={action.id}
                onClick={() => handleAction(action.tool_key)}
                className="relative bg-gradient-to-br from-primary to-primary/80 rounded-xl p-3 flex flex-col items-center gap-1.5 text-primary-foreground shadow-sm"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileTap={{ scale: 0.9 }}
              >
                {needsPremium && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400/30 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-amber-200" />
                  </div>
                )}
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px] font-bold">{tr(getTranslationKey(action.tool_key), action.label_az || action.label)}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="tool"
      />
    </>
  );
};

export default QuickActionsBar;
