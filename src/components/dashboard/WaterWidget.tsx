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
    <div className="bg-cyan-50/80 border border-cyan-100/50 rounded-xl p-3 text-cyan-800 shadow-sm relative overflow-hidden h-full flex flex-col justify-between min-h-[80px]">
      <div className="absolute -top-3 -right-3 p-2 opacity-5">
        <Droplets className="w-16 h-16 text-cyan-600" />
      </div>
      
      <div className="relative z-10 flex justify-between items-center mb-1">
        <div>
          <h3 className="font-medium text-xs mb-0.5 flex items-center gap-1 opacity-80 text-cyan-700">
            <Droplets className="w-3 h-3" />
            {tr("common_su_water", "Su")}
          </h3>
          <div className="text-xl font-black leading-none flex items-baseline gap-1 text-cyan-950">
            {waterGlasses} <span className="text-[10px] font-medium opacity-50">/ {target}</span>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            updateWaterIntake(1);
          }}
          className="w-7 h-7 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded-full flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      
      <div className="relative z-10 mt-auto pt-2">
        <div className="bg-cyan-100 h-1.5 rounded-full overflow-hidden w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-cyan-500 h-full rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
