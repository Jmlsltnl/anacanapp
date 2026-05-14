import { motion } from 'framer-motion';

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
 * CLASSIC variant — the original glassmorphism hero card.
 * Extracted verbatim from Dashboard.tsx so the existing look stays available.
 */
const MommyHeroClassic = ({ babyData, exactMonths, remainingDays, babyIllustration }: MommyHeroProps) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[2rem]"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(12,80%,48%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />

      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-black/5 blur-2xl" />

      <div className="relative z-10 p-4 pt-5">
        <motion.div
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{babyData.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/70 text-sm">
                {exactMonths > 0 ? (
                  <span className="font-medium">
                    <span className="text-white font-bold">{exactMonths}</span> ay{' '}
                    {remainingDays > 0 && (
                      <>
                        <span className="text-white font-bold">{remainingDays}</span> gün
                      </>
                    )}
                  </span>
                ) : (
                  <span className="font-medium">
                    <span className="text-white font-bold">{babyData.ageInDays}</span> günlük
                  </span>
                )}
              </span>
            </div>
          </div>

          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <div className="text-center">
              <span className="text-2xl font-black text-primary">{exactMonths || babyData.ageInDays}</span>
              <span className="text-xs font-bold text-primary/70 ml-0.5">{exactMonths > 0 ? 'ay' : 'gün'}</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex justify-center mb-5"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute -inset-2 bg-white/15 rounded-full blur-xl animate-pulse-soft" />

            <div className="relative p-1 rounded-[2rem] bg-gradient-to-br from-white/80 via-white/50 to-white/30 shadow-2xl">
              <div className="relative w-44 h-44 rounded-[1.75rem] bg-white/30 backdrop-blur-md p-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-[1.75rem]" />

                <div className="relative w-full h-full rounded-[1.5rem] bg-gradient-to-br from-white/60 via-white/40 to-white/20 overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)] opacity-50" />

                  <img
                    src={babyIllustration}
                    alt={`${babyData.ageInMonths} aylıq körpə`}
                    className="relative z-10 w-full h-full object-contain p-2 drop-shadow-2xl scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -inset-3 rounded-full border-2 border-dashed border-white/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg text-lg"
              animate={{ rotate: [0, 15, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-lg text-sm"
              animate={{ rotate: [0, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              💫
            </motion.div>
            <motion.div
              className="absolute top-1/2 -right-4 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-md text-xs"
              animate={{ x: [0, 3, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              🌟
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MommyHeroClassic;
