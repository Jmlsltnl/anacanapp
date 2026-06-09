import { motion } from 'framer-motion';
import { Heart, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { usePartnerData } from '@/hooks/usePartnerData';

const PHASE_INFO: Record<string, { label: string; emoji: string; tip: string; color: string }> = {
  menstrual: { label: 'Menstruasiya', emoji: '🩸', tip: 'Yumşaq ol, isti çay təklif et, ev işlərində kömək et.', color: 'from-rose-500 to-red-500' },
  follicular: { label: 'Follikular', emoji: '🌱', tip: 'Enerjisi yüksəkdir — birlikdə aktiv vaxt keçirin.', color: 'from-emerald-500 to-teal-500' },
  ovulation: { label: 'Ovulyasiya', emoji: '🌸', tip: 'Fertil dövrdür. Yaxınlığa diqqət göstər.', color: 'from-pink-500 to-fuchsia-500' },
  luteal: { label: 'Lutein (PMS)', emoji: '🌙', tip: 'Səbirli ol, mənfi reaksiyaları şəxsi qəbul etmə.', color: 'from-indigo-500 to-purple-500' },
};

const PartnerFlowStatusCard = () => {
  const { partnerProfile, getCyclePhaseInfo, getDaysUntilNextPeriod } = usePartnerData();

  if (!partnerProfile || partnerProfile.life_stage !== 'flow') return null;
  const phaseInfo = getCyclePhaseInfo();
  if (!phaseInfo) return null;

  const phase = PHASE_INFO[phaseInfo.phase];
  const daysUntilPeriod = getDaysUntilNextPeriod();
  const pmsWarning = phaseInfo.phase === 'luteal' && daysUntilPeriod <= 3 && daysUntilPeriod > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${phase.color}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/80 text-xs">{partnerProfile.name}</p>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">{phase.emoji}</span>
              {phase.label}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px]">Tsikl günü</p>
            <p className="text-3xl font-bold text-white">{phaseInfo.dayInCycle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/15 backdrop-blur rounded-xl p-2.5">
            <Calendar className="w-4 h-4 text-white mb-1" />
            <p className="text-white text-base font-bold">{daysUntilPeriod}</p>
            <p className="text-white/70 text-[10px]">növbəti perioda</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-2.5">
            {phaseInfo.isFertileDay ? <Sparkles className="w-4 h-4 text-white mb-1" /> : <Heart className="w-4 h-4 text-white mb-1" />}
            <p className="text-white text-base font-bold">{phaseInfo.isFertileDay ? 'Fertil' : 'Normal'}</p>
            <p className="text-white/70 text-[10px]">{phaseInfo.isFertileDay ? 'reproduktiv dövr' : 'gün'}</p>
          </div>
        </div>

        {pmsWarning && (
          <div className="bg-white/20 backdrop-blur rounded-xl p-2.5 mb-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
            <p className="text-white text-xs">PMS dövrü yaxınlaşır — əlavə dəstək lazım ola bilər 💕</p>
          </div>
        )}

        <div className="bg-white/15 backdrop-blur rounded-xl p-3">
          <p className="text-white/90 text-xs leading-snug">💡 {phase.tip}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PartnerFlowStatusCard;
