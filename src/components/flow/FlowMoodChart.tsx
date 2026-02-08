import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Smile, Zap, Heart } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { az } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useFlowMoodChart } from '@/hooks/useFlowDailyLogs';

const FlowMoodChart = () => {
  const { data: moodData = [], isLoading } = useFlowMoodChart();

  const chartData = useMemo(() => {
    // Create array of last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = moodData.find(d => d.log_date === dateStr);
      
      days.push({
        date: dateStr,
        dayLabel: format(date, 'd', { locale: az }),
        mood: dayData?.mood || null,
        energy: dayData?.energy_level || null,
        pain: dayData?.pain_level || null,
        sleep: dayData?.sleep_quality || null,
      });
    }
    return days;
  }, [moodData]);

  const averages = useMemo(() => {
    const withMood = moodData.filter(d => d.mood);
    const withEnergy = moodData.filter(d => d.energy_level);
    const withSleep = moodData.filter(d => d.sleep_quality);

    return {
      mood: withMood.length > 0 ? (withMood.reduce((a, b) => a + (b.mood || 0), 0) / withMood.length).toFixed(1) : '-',
      energy: withEnergy.length > 0 ? (withEnergy.reduce((a, b) => a + (b.energy_level || 0), 0) / withEnergy.length).toFixed(1) : '-',
      sleep: withSleep.length > 0 ? (withSleep.reduce((a, b) => a + (b.sleep_quality || 0), 0) / withSleep.length).toFixed(1) : '-',
      totalLogs: moodData.length,
    };
  }, [moodData]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {format(parseISO(data.date), 'd MMMM', { locale: az })}
          </p>
          {data.mood && (
            <p className="text-xs text-muted-foreground">
              Əhval: {['', '😢', '😔', '😐', '😊', '🥰'][data.mood]} ({data.mood}/5)
            </p>
          )}
          {data.energy && (
            <p className="text-xs text-muted-foreground">
              Enerji: {data.energy}/5
            </p>
          )}
          {data.sleep && (
            <p className="text-xs text-muted-foreground">
              Yuxu: {data.sleep}/5
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Əhval Qrafiki
        </h3>
        <span className="text-xs text-muted-foreground">Son 14 gün</span>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
          <Smile className="w-5 h-5 text-pink-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{averages.mood}</p>
          <p className="text-[10px] text-muted-foreground">Orta Əhval</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{averages.energy}</p>
          <p className="text-[10px] text-muted-foreground">Orta Enerji</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
          <Heart className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{averages.totalLogs}</p>
          <p className="text-[10px] text-muted-foreground">Qeyd Sayı</p>
        </div>
      </div>

      {/* Chart */}
      {moodData.length > 0 ? (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="dayLabel" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis 
                domain={[0, 5]} 
                hide 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#ec4899"
                strokeWidth={2}
                fill="url(#moodGradient)"
                connectNulls
                dot={{ r: 3, fill: '#ec4899' }}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#energyGradient)"
                connectNulls
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <div className="text-center">
            <Smile className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Əhval qeydləri əlavə edin
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="text-xs text-muted-foreground">Əhval</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">Enerji</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FlowMoodChart;
