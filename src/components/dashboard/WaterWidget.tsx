import { motion } from 'framer-motion';
import { Droplets, Plus } from 'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useUserStore } from '@/store/userStore';
import { tr } from '@/lib/tr';

// Fallback targets for different life stages
const fallbackTargets = {
  bump: { water_glasses: 10 },
  mommy: { water_glasses: 12 },
  flow: { water_glasses: 8 }
};

export default function WaterWidget() {
  const { todayLog, updateWaterIntake } = useDailyLogs();
  const { lifeStage } = useUserStore();
  
  const waterGlasses = todayLog?.water_intake || 0;
  const stage = lifeStage || 'flow';
  const target = fallbackTargets[stage as keyof typeof fallbackTargets]?.water_glasses || 8;
  
  const percentage = Math.min((waterGlasses / target) * 100, 100);

  return (
    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white shadow-card relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute -top-4 -right-4 p-3 opacity-20">
        <Droplets className="w-24 h-24" />
      </div>
      
      <div className="relative z-10 flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-sm mb-0.5 flex items-center gap-1.5 opacity-90">
            <Droplets className="w-3.5 h-3.5" />
            {tr("common_su_water", "Su")}
          </h3>
          <div className="text-2xl font-black leading-none flex items-baseline gap-1">
            {waterGlasses} <span className="text-xs font-medium opacity-75">/ {target}</span>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            if (waterGlasses < 12) updateWaterIntake(1);
          }}
          disabled={waterGlasses >= 12}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
      
      <div className="relative z-10 mt-auto pt-2">
        <div className="bg-black/10 h-1.5 rounded-full overflow-hidden w-full backdrop-blur-sm">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white h-full rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
