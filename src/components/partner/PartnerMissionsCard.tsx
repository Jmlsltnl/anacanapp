import { motion } from 'framer-motion';
import { Target, CheckCircle, Star, Zap, Timer } from 'lucide-react';
import { usePartnerMissions } from '@/hooks/usePartnerMissions';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/native';

interface PartnerMissionsCardProps {
  showAll?: boolean;
}

const PartnerMissionsCard = ({ showAll = false }: PartnerMissionsCardProps) => {
  const { 
    missions, 
    toggleMission, 
    totalPoints, 
    level, 
    levelProgress, 
    pointsToNextLevel,
    completedCount 
  } = usePartnerMissions();
  const { toast } = useToast();

  const displayMissions = showAll ? missions : missions.slice(0, 3);

  const handleToggleMission = async (id: string, points: number, title: string) => {
    await hapticFeedback.medium();
    const result = await toggleMission(id, points);
    
    if (result?.completed) {
      toast({
        title: `+${result.pointsEarned} xal qazandın! 🎉`,
        description: title,
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'hard': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Asan';
      case 'medium': return 'Orta';
      case 'hard': return 'Çətin';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Level Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">Gündəlik Tapşırıqlar</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{missions.length} tamamlandı</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 px-3 py-1.5 rounded-xl">
          <Star className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-amber-700 dark:text-amber-400">{totalPoints}</span>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="bg-muted/50 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Səviyyə {level}</span>
          <span className="text-xs text-muted-foreground">{pointsToNextLevel} xal sonrakı səviyyəyə</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-2">
        {displayMissions.map((mission, idx) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              mission.isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-card border-border/50 hover:border-partner/30'
            }`}
          >
            <motion.button
              onClick={() => handleToggleMission(mission.id, mission.points, mission.title)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                mission.isCompleted
                  ? 'bg-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-partner/20 hover:text-partner'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {mission.isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <mission.icon className="w-5 h-5" />
              )}
            </motion.button>

            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm ${mission.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {mission.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(mission.difficulty)}`}>
                  {getDifficultyLabel(mission.difficulty)}
                </span>
                <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                  <Zap className="w-3 h-3" />
                  +{mission.points}
                </span>
              </div>
            </div>

            {!mission.isCompleted && (
              <Timer className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PartnerMissionsCard;
