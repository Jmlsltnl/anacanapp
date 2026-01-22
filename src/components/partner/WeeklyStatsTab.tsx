import { motion } from 'framer-motion';
import { 
  Droplets, Dumbbell, Smile, TrendingUp, 
  TrendingDown, Minus, Flame
} from 'lucide-react';
import { usePartnerWeeklyStats } from '@/hooks/usePartnerWeeklyStats';

const WeeklyStatsTab = () => {
  const { stats, loading } = usePartnerWeeklyStats();

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['B', 'B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş'];
    return days[date.getDay()];
  };

  const getMoodEmoji = (mood: number | null) => {
    if (mood === null) return '—';
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '—';
  };

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return 'bg-muted';
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400'];
    return colors[mood - 1] || 'bg-muted';
  };

  const getMoodTrend = () => {
    if (!stats) return null;
    const moods = stats.dailyMoods.filter(d => d.mood !== null);
    if (moods.length < 2) return null;

    const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
    const secondHalf = moods.slice(Math.floor(moods.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.3) return 'up';
    if (secondAvg < firstAvg - 0.3) return 'down';
    return 'stable';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Statistika yüklənə bilmədi</p>
      </div>
    );
  }

  const moodTrend = getMoodTrend();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <h2 className="font-bold text-lg">Həftəlik Statistika</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 text-white"
        >
          <Droplets className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-black">{(stats.totalWater / 1000).toFixed(1)}L</p>
          <p className="text-white/70 text-sm">Ümumi su</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white"
        >
          <Dumbbell className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-black">{stats.exerciseCount}</p>
          <p className="text-white/70 text-sm">Məşq sayı</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white"
        >
          <Flame className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-black">{stats.totalCalories}</p>
          <p className="text-white/70 text-sm">Kalori</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-6 h-6 opacity-80" />
            {moodTrend === 'up' && <TrendingUp className="w-4 h-4" />}
            {moodTrend === 'down' && <TrendingDown className="w-4 h-4" />}
            {moodTrend === 'stable' && <Minus className="w-4 h-4" />}
          </div>
          <p className="text-2xl font-black">{stats.avgMood.toFixed(1)}</p>
          <p className="text-white/70 text-sm">Orta əhval</p>
        </motion.div>
      </div>

      {/* Mood Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      >
        <h3 className="font-bold mb-4">Əhval Dəyişiklikləri</h3>
        <div className="flex justify-between items-end h-32 gap-1">
          {stats.dailyMoods.map((day, idx) => {
            const height = day.mood ? `${(day.mood / 5) * 100}%` : '10%';
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full max-w-[40px] rounded-t-lg relative flex items-end justify-center"
                  style={{ height: '80px' }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                >
                  <motion.div
                    className={`w-full rounded-t-lg ${getMoodColor(day.mood)}`}
                    style={{ height }}
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.5 }}
                  />
                </motion.div>
                <span className="text-xl">{getMoodEmoji(day.mood)}</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {getDayName(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Water Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      >
        <h3 className="font-bold mb-4">Su İçmə (ml)</h3>
        <div className="flex justify-between items-end h-24 gap-1">
          {stats.dailyMoods.map((day, idx) => {
            const maxWater = 2500;
            const height = day.water_intake ? `${Math.min((day.water_intake / maxWater) * 100, 100)}%` : '5%';
            const isGoalMet = day.water_intake >= 2000;
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full max-w-[40px] rounded-t-lg relative flex items-end"
                  style={{ height: '60px' }}
                >
                  <motion.div
                    className={`w-full rounded-t-lg ${isGoalMet ? 'bg-cyan-500' : 'bg-cyan-300'}`}
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.35 + idx * 0.05, duration: 0.5 }}
                  />
                </motion.div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {day.water_intake > 0 ? `${(day.water_intake / 1000).toFixed(1)}L` : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {getDayName(day.date)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded bg-cyan-500" />
          <span>Hədəfə çatdı (2L+)</span>
          <div className="w-3 h-3 rounded bg-cyan-300 ml-2" />
          <span>Hədəf altı</span>
        </div>
      </motion.div>

      {/* Exercise Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      >
        <h3 className="font-bold mb-4">Məşqlər</h3>
        <div className="flex justify-between items-end h-24 gap-1">
          {stats.exerciseData.map((day, idx) => {
            const maxMinutes = 60;
            const height = day.minutes ? `${Math.min((day.minutes / maxMinutes) * 100, 100)}%` : '5%';
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full max-w-[40px] rounded-t-lg relative flex items-end"
                  style={{ height: '60px' }}
                >
                  <motion.div
                    className={`w-full rounded-t-lg ${day.count > 0 ? 'bg-violet-500' : 'bg-muted'}`}
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.4 + idx * 0.05, duration: 0.5 }}
                  />
                </motion.div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {day.minutes > 0 ? `${day.minutes}dk` : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {getDayName(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyStatsTab;
