import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';

export interface MommyHeroProps {
  babyData: {
    name: string;
    ageInMonths: number;
    ageInDays: number;
  };
  exactMonths: number;
  remainingDays: number;
  babyIllustration: string;
}

/**
 * MommyHeroClassic — redesigned to match the Pregnancy Hero layout.
 * Same structural pattern: gradient card → centered image → main text → badge chips → progress bar.
 */
const MommyHeroClassic = ({ babyData, exactMonths, remainingDays, babyIllustration }: MommyHeroProps) => {
  // Mommy stage colors (coral/salmon family to match existing brand)
  const colors = {
    bg: 'from-rose-400/10 via-orange-300/5 to-rose-400/10 dark:from-rose-500/20 dark:via-orange-400/10 dark:to-rose-500/20',
    border: 'border-rose-400/20 dark:border-rose-500/30',
    accent: 'bg-rose-400/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-400/10 text-rose-600 dark:text-rose-400',
    progress: 'bg-rose-500',
  };

  const totalFirstYearDays = 365;
  const progressPercent = Math.min((babyData.ageInDays / totalFirstYearDays) * 100, 100);

  // Days until next month milestone
  const daysUntilNextMonth = remainingDays > 0 ? remainingDays : 0;

  return (
    <motion.div
      className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} rounded-2xl p-4 shadow-card ${colors.border}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Background blur orbs — same style as pregnancy hero */}
      <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full ${colors.accent} blur-2xl`} />
      <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full ${colors.accent} blur-xl opacity-50`} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Baby Image — centered with subtle float, matching pregnancy fetus image style */}
        <motion.div
          className="w-[178px] h-[178px] mb-3 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: [0, -4, 0],
          }}
          transition={{
            scale: { delay: 0.2, type: 'spring' },
            opacity: { delay: 0.2 },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <img
            src={babyIllustration}
            alt={`${babyData.name} — ${babyData.ageInMonths} aylıq`}
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </motion.div>

        {/* Main Text — baby name + day info */}
        <div className="text-center">
          <p className="text-lg font-bold text-foreground mb-1">
            {babyData.name} • {babyData.ageInDays}. gün
          </p>

          {/* Badge chips — same style as pregnancy badges */}
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {exactMonths > 0 && (
              <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                {exactMonths} ay
              </span>
            )}
            {remainingDays > 0 && (
              <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                {remainingDays} gün
              </span>
            )}
            <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
              {babyData.ageInDays} gün
            </span>
            {daysUntilNextMonth > 0 && exactMonths < 12 && (
              <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                {daysUntilNextMonth} gün qaldı
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar — progress through first year, matching pregnancy style */}
        <div className="w-full mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{tr("dashboard_dogus_6b7bfd", "Doğuş")}</span>
            <span className={`${colors.text} font-semibold`}>{Math.round(progressPercent)}%</span>
            <span>{tr("dashboard_1_yas_a1b2c3", "1 yaş")}</span>
          </div>
          <div className={`h-2 ${colors.accent} rounded-full overflow-hidden`}>
            <motion.div
              className={`h-full ${colors.progress} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MommyHeroClassic;
