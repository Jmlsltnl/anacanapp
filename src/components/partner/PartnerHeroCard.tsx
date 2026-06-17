import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { Calendar, Baby, Droplets, Heart, Bell, Activity, Flower2, Moon, Sparkles } from 'lucide-react';
import type { CyclePhaseInfo } from '@/lib/cycle-utils';

interface PartnerHeroCardProps {
  womanName: string;
  womanMood: number;
  womanSymptoms: string[];
  waterIntake: number;
  lifeStage: string;
  currentWeek: number;
  daysUntilDue: number;
  babyAgeDays: number;
  babyName?: string | null;
  babyGender?: 'boy' | 'girl' | null;
  cyclePhase?: CyclePhaseInfo | null;
  daysUntilNextPeriod?: number;
  weekData: {emoji?: string;fruit?: string;} | null;
  onSendLove: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

const PHASE_LABEL: Record<CyclePhaseInfo['phase'], {label: string;emoji: string;tip: string;}> = {
  menstrual: { label: 'Menstruasiya', emoji: '🌸', tip: tr("partnerherocard_onu_rahat_saxla_isti_icki_geti_a99254", "Onu rahat saxla, isti i\xE7ki g\u0259tir") },
  follicular: { label: 'Follikulyar faza', emoji: '🌱', tip: tr("partnerherocard_enerjisi_artir_birge_fealiyyet_0f82ed", "Enerjisi art\u0131r \u2014 birg\u0259 f\u0259aliyy\u0259t t\u0259klif et") },
  ovulation: { label: 'Ovulyasiya', emoji: '✨', tip: tr("partnerherocard_en_enerjili_dovru_diqqetli_ol_980ebb", "\u018Fn enerjili d\xF6vr\xFC \u2014 diqq\u0259tli ol") },
  luteal: { label: 'Luteal faza', emoji: '🌙', tip: tr("partnerherocard_ehvali_deyisken_ola_biler_sebi_a69be8", "\u018Fhval\u0131 d\u0259yi\u015Fk\u0259n ola bil\u0259r \u2014 s\u0259birli ol") }
};

const PartnerHeroCard = ({
  womanName,
  womanMood,
  womanSymptoms,
  waterIntake,
  lifeStage,
  currentWeek,
  daysUntilDue,
  babyAgeDays,
  babyName,
  babyGender,
  cyclePhase,
  daysUntilNextPeriod,
  weekData,
  onSendLove,
  onOpenNotifications,
  unreadCount
}: PartnerHeroCardProps) => {
  const getMoodEmoji = (mood: number) => ['😢', '😔', '😐', '🙂', '😊'][mood - 1] || '😊';
  const getMoodText = (mood: number) => [tr("partnerherocard_cox_pis_e041c5", "\xC7ox pis"), 'Pis', 'Normal', tr("partnerherocard_yaxsi_9d8595", "Yax\u015F\u0131"), tr("partnerherocard_ela_720a0e", "\u018Fla")][mood - 1] || tr("partnerherocard_yaxsi_9d8595", "Yax\u015F\u0131");
  const getMoodColor = (mood: number) => {
    if (mood >= 4) return 'from-emerald-400 to-green-500';
    if (mood === 3) return 'from-amber-400 to-yellow-500';
    return 'from-rose-400 to-red-500';
  };

  const avatarEmoji = lifeStage === 'bump' ? '🤰' : lifeStage === 'mommy' ? '👩‍🍼' : '🌸';
  const babyMonths = Math.floor(babyAgeDays / 30);

  // Subtitle per stage
  const subtitle = (() => {
    if (lifeStage === 'bump' && currentWeek > 0) return `${tr("partner_pregnancy_week", "Hamiləlik:")} ${currentWeek}. ${tr("partner_week", "həftə")}`;
    if (lifeStage === 'mommy') {
      const baby = babyName || tr("partnerherocard_korpe_fa2b51", "K\xF6rp\u0259");
      if (babyMonths >= 1) return `${baby}: ${babyMonths} ay ${babyAgeDays % 30} gün`;
      return `${baby}: ${babyAgeDays} günlük`;
    }
    if (lifeStage === 'flow' && cyclePhase) return `${PHASE_LABEL[cyclePhase.phase].label} • ${cyclePhase.dayInCycle}. gün`;
    return tr("partnerherocard_bagli_713069", "Ba\u011Fl\u0131");
  })();

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-4xl shadow-xl ring-4 ring-white/20"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}>
            
            {avatarEmoji}
          </motion.div>
          <motion.div
            className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r ${getMoodColor(womanMood)} flex items-center justify-center text-lg shadow-lg border-3 border-white`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}>
            
            {getMoodEmoji(womanMood)}
          </motion.div>
        </div>

        <div className="flex-1">
          <h2 className="text-white font-black text-xl tracking-tight">{womanName}</h2>
          <p className="text-white/70 text-sm">{subtitle}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getMoodColor(womanMood)} text-white shadow-md`}>
              {getMoodText(womanMood)}
            </span>
            {womanSymptoms.length > 0 &&
            <span className="px-2.5 py-1.5 rounded-full text-xs bg-white/20 text-white font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {womanSymptoms.length}
              </span>
            }
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            onClick={onSendLove}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}>
            
            <Heart className="w-6 h-6 text-white fill-white" />
          </motion.button>
          <motion.button
            onClick={onOpenNotifications}
            className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center relative"
            whileTap={{ scale: 0.95 }}>
            
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 &&
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            }
          </motion.button>
        </div>
      </div>

      {/* BUMP stats */}
      {lifeStage === 'bump' && currentWeek > 0 &&
      <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile icon={Calendar} value={daysUntilDue} label={tr("partnerherocard_gun_qaldi_309c87", "Gün qaldı")} delay={0.1} />
          <StatTile emoji={weekData?.emoji || '👶'} label={weekData?.fruit || tr("partnerherocard_korpe_fa2b51", "K\xF6rp\u0259")} delay={0.15} />
          <StatTile icon={Droplets} value={waterIntake} label="ml su" delay={0.2} />
        </div>
      }

      {/* MOMMY stats */}
      {lifeStage === 'mommy' &&
      <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile
          emoji={babyGender === 'boy' ? '👦' : babyGender === 'girl' ? '👧' : '👶'}
          label={babyName || tr("partnerherocard_korpe_fa2b51", "K\xF6rp\u0259")}
          delay={0.1} />
        
          <StatTile icon={Baby} value={babyMonths} label={tr("partnerherocard_ayliq_0c8da3", "aylıq")} delay={0.15} />
          <StatTile icon={Droplets} value={waterIntake} label="ml su" delay={0.2} />
        </div>
      }

      {/* FLOW stats */}
      {lifeStage === 'flow' && cyclePhase &&
      <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile
          emoji={PHASE_LABEL[cyclePhase.phase].emoji}
          label={PHASE_LABEL[cyclePhase.phase].label}
          delay={0.1} />
        
          <StatTile icon={Moon} value={daysUntilNextPeriod || 0} label={tr("partnerherocard_gun_qaldi_993281", "gün qaldı")} delay={0.15} />
          <StatTile
          icon={cyclePhase.isFertileDay ? Sparkles : Flower2}
          value={cyclePhase.dayInCycle}
          label={cyclePhase.isFertileDay ? tr("partnerherocard_fertil_gun_f451f2", "fertil g\xFCn") : tr("partnerherocard_tsikl_gunu_0d479c", "tsikl g\xFCn\xFC")}
          delay={0.2} />
        
        </div>
      }

      {/* Stage-specific support tip */}
      {lifeStage === 'flow' && cyclePhase &&
      <motion.div
        className="mt-4 bg-white/15 backdrop-blur rounded-2xl p-3 flex items-start gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        
          <Heart className="w-4 h-4 text-white mt-0.5 flex-shrink-0 fill-white/30" />
          <p className="text-white/90 text-xs leading-snug">{PHASE_LABEL[cyclePhase.phase].tip}</p>
        </motion.div>
      }
    </motion.div>);

};

const StatTile = ({
  icon: Icon,
  emoji,
  value,
  label,
  delay = 0






}: {icon?: any;emoji?: string;value?: number | string;label: string;delay?: number;}) =>
<motion.div
  className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay }}>
  
    {emoji ?
  <p className="text-3xl leading-none mb-1">{emoji}</p> :
  Icon ?
  <Icon className="w-5 h-5 text-white/70 mx-auto mb-1" /> :
  null}
    {value !== undefined && <p className="text-white font-black text-xl">{value}</p>}
    <p className="text-white/60 text-[11px] font-medium truncate">{label}</p>
  </motion.div>;


export default PartnerHeroCard;