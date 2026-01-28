import { motion } from 'framer-motion';
import { Baby, Moon, Clock, TrendingUp, Droplets, Activity } from 'lucide-react';
import { useBabyLogs } from '@/hooks/useBabyLogs';
import { useUserStore } from '@/store/userStore';

interface DayStats {
  date: string;
  feedingCount: number;
  sleepHours: number;
  diaperCount: number;
}

const QuickStatsWidget = () => {
  const { logs } = useBabyLogs();
  const { getBabyData } = useUserStore();
  const babyData = getBabyData();

  // Calculate last 7 days stats
  const getWeeklyStats = (): DayStats[] => {
    const stats: DayStats[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(log => log.start_time.startsWith(dateStr));
      const feedingLogs = dayLogs.filter(l => l.log_type === 'feeding');
      const sleepLogs = dayLogs.filter(l => l.log_type === 'sleep');
      const diaperLogs = dayLogs.filter(l => l.log_type === 'diaper');
      
      let sleepMinutes = 0;
      sleepLogs.forEach(log => {
        if (log.end_time) {
          const start = new Date(log.start_time);
          const end = new Date(log.end_time);
          sleepMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
        }
      });
      
      stats.push({
        date: dateStr,
        feedingCount: feedingLogs.length,
        sleepHours: Math.round(sleepMinutes / 60 * 10) / 10,
        diaperCount: diaperLogs.length,
      });
    }
    
    return stats;
  };

  const weeklyStats = getWeeklyStats();
  
  // Calculate averages
  const avgFeeding = weeklyStats.reduce((sum, d) => sum + d.feedingCount, 0) / 7;
  const avgSleep = weeklyStats.reduce((sum, d) => sum + d.sleepHours, 0) / 7;
  const avgDiaper = weeklyStats.reduce((sum, d) => sum + d.diaperCount, 0) / 7;
  
  // Get today vs average
  const today = weeklyStats[6];
  const feedingTrend = today.feedingCount >= avgFeeding;
  const sleepTrend = today.sleepHours >= avgSleep;

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['B', 'B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş'];
    return days[date.getDay()];
  };

  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Həftəlik Baxış</h3>
        </div>
      </div>
      
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-amber-50 dark:bg-amber-500/15 rounded-xl p-2.5 text-center">
          <Baby className="w-4 h-4 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
          <p className="text-lg font-black text-amber-700 dark:text-amber-300">
            {avgFeeding.toFixed(1)}
          </p>
          <p className="text-[9px] text-amber-600/70 dark:text-amber-400/70">Ort. qidalanma</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-500/15 rounded-xl p-2.5 text-center">
          <Moon className="w-4 h-4 mx-auto mb-1 text-violet-600 dark:text-violet-400" />
          <p className="text-lg font-black text-violet-700 dark:text-violet-300">
            {avgSleep.toFixed(1)}
          </p>
          <p className="text-[9px] text-violet-600/70 dark:text-violet-400/70">Ort. yuxu (s)</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/15 rounded-xl p-2.5 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
            {avgDiaper.toFixed(1)}
          </p>
          <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Ort. bez</p>
        </div>
      </div>
      
      {/* Mini Chart - Sleep hours per day */}
      <div className="bg-muted/30 rounded-xl p-3">
        <p className="text-[10px] text-muted-foreground mb-2 font-medium">Həftəlik yuxu (saat)</p>
        <div className="flex items-end justify-between h-12 gap-1">
          {weeklyStats.map((day, idx) => {
            const maxHours = 16;
            const height = day.sleepHours > 0 ? `${Math.min((day.sleepHours / maxHours) * 100, 100)}%` : '4px';
            const isToday = idx === 6;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full rounded-t ${
                    isToday 
                      ? 'bg-primary' 
                      : 'bg-violet-300 dark:bg-violet-500/50'
                  }`}
                  style={{ height }}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                />
                <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {getDayLabel(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickStatsWidget;
