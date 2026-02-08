import { motion } from 'framer-motion';
import { 
  Stethoscope, BookOpen, Camera, Music, 
  Baby, Thermometer, AlertCircle, Sparkles, Star, Heart, LucideIcon
} from 'lucide-react';
import { hapticFeedback } from '@/lib/native';
import { useQuickActions } from '@/hooks/useQuickActions';
import { useChildren } from '@/hooks/useChildren';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Baby, Thermometer, Music, AlertCircle, Sparkles, BookOpen, Camera, Stethoscope, Heart, Star
};

interface QuickActionsBarProps {
  onNavigateToTool?: (tool: string) => void;
}

const QuickActionsBar = ({ onNavigateToTool }: QuickActionsBarProps) => {
  const { selectedChild, getChildAge } = useChildren();
  
  // Determine age group from selected child
  const childAge = selectedChild ? getChildAge(selectedChild) : null;
  const ageInMonths = childAge?.months || 0;
  const ageGroup = ageInMonths < 3 ? 'newborn' : 'older';
  
  // Fetch from database
  const { data: dbActions = [], isLoading } = useQuickActions('mommy', ageGroup);

  const handleAction = async (toolKey: string) => {
    await hapticFeedback.light();
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

  return (
    <motion.div
      className="bg-card rounded-2xl p-3 shadow-card border border-border/50"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
    >
      <p className="text-[10px] text-muted-foreground font-medium mb-2 px-1">
        {ageGroup === 'newborn' ? 'Yenidoğan üçün' : 'Sürətli keçid'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {dbActions.map((action, idx) => {
          const IconComponent = ICON_MAP[action.icon] || Star;
          return (
            <motion.button
              key={action.id}
              onClick={() => handleAction(action.tool_key)}
              className={`bg-gradient-to-br from-${action.color_from} to-${action.color_to} rounded-xl p-3 flex flex-col items-center gap-1.5 text-white shadow-sm`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-[10px] font-bold">{action.label_az || action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActionsBar;
