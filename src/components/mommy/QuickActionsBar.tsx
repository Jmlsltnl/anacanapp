import { motion } from 'framer-motion';
import { 
  Stethoscope, BookOpen, Camera, Music, 
  Baby, Thermometer, AlertCircle, Sparkles
} from 'lucide-react';
import { hapticFeedback } from '@/lib/native';
import { useUserStore } from '@/store/userStore';

interface QuickAction {
  id: string;
  icon: any;
  label: string;
  color: string;
  tool: string;
}

interface QuickActionsBarProps {
  onNavigateToTool?: (tool: string) => void;
}

const QuickActionsBar = ({ onNavigateToTool }: QuickActionsBarProps) => {
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();
  
  // Show different actions based on baby age
  const isNewborn = babyData && babyData.ageInMonths < 3;
  
  const actions: QuickAction[] = isNewborn ? [
    { id: 'cry', icon: Baby, label: 'Ağlama', color: 'from-pink-400 to-rose-500', tool: 'cry-translator' },
    { id: 'poop', icon: Thermometer, label: 'Nəcis', color: 'from-amber-400 to-orange-500', tool: 'poop-scanner' },
    { id: 'noise', icon: Music, label: 'Ağ Səs', color: 'from-violet-400 to-purple-500', tool: 'white-noise' },
    { id: 'firstaid', icon: AlertCircle, label: 'İlk Yardım', color: 'from-red-400 to-rose-600', tool: 'first-aid' },
  ] : [
    { id: 'play', icon: Sparkles, label: 'Oyun', color: 'from-emerald-400 to-teal-500', tool: 'smart-play' },
    { id: 'fairy', icon: BookOpen, label: 'Nağıl', color: 'from-violet-400 to-purple-500', tool: 'fairy-tales' },
    { id: 'photo', icon: Camera, label: 'Foto', color: 'from-pink-400 to-rose-500', tool: 'baby-photo' },
    { id: 'doctor', icon: Stethoscope, label: 'Həkim', color: 'from-blue-400 to-cyan-500', tool: 'doctor-report' },
  ];

  const handleAction = async (tool: string) => {
    await hapticFeedback.light();
    onNavigateToTool?.(tool);
  };

  return (
    <motion.div
      className="bg-card rounded-2xl p-3 shadow-card border border-border/50"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
    >
      <p className="text-[10px] text-muted-foreground font-medium mb-2 px-1">
        {isNewborn ? 'Yenidoğan üçün' : 'Sürətli keçid'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action, idx) => (
          <motion.button
            key={action.id}
            onClick={() => handleAction(action.tool)}
            className={`bg-gradient-to-br ${action.color} rounded-xl p-3 flex flex-col items-center gap-1.5 text-white shadow-sm`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActionsBar;
