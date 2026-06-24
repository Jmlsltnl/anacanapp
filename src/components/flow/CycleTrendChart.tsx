import { tr } from "@/lib/tr";import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { useCycleHistory, useCycleStats } from '@/hooks/useCycleHistory';

const CycleTrendChart = () => {
  const { data: cycles = [], isLoading } = useCycleHistory();
  const stats = useCycleStats();

  const chartData = cycles.
  filter((c) => c.cycle_length && c.cycle_length > 0).
  slice(0, 12).
  reverse().
  map((c) => ({
    cycle: `#${c.cycle_number}`,
    length: c.cycle_length!
  }));

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="h-40 bg-muted rounded" />
      </div>);

  }

  if (chartData.length < 2) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border">
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          {tr("cycletrendchart_tsikl_uzunlugu_trendi_13a67d", "Tsikl Uzunlu\u011Fu Trendi")}
        </h3>
        <span className="text-xs text-muted-foreground">{tr("cycletrendchart_tsikl_count", "{count} tsikl").replace("{count}", String(chartData.length))}</span>
      </div>

      <div className="h-44 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="cycle" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[15, 45]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={28} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12
              }}
              formatter={(v: number) => [`${v} ${tr("common_gun", "gün")}`, tr("cycletrendchart_uzunluq_f427cd", "Uzunluq")]} />
            
            <ReferenceLine y={stats.averageCycleLength} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: `${tr("common_orta", "Orta")} ${stats.averageCycleLength}`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--primary))' }} />
            <ReferenceLine y={21} stroke="hsl(var(--destructive))" strokeOpacity={0.3} strokeDasharray="2 4" />
            <ReferenceLine y={35} stroke="hsl(var(--destructive))" strokeOpacity={0.3} strokeDasharray="2 4" />
            <Line type="monotone" dataKey="length" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {tr("cycletrendchart_normal_diapazon_21_35_gun_acog_48b2bf", "Normal diapazon: 21\u201335 g\xFCn (ACOG)")}
      </p>
    </motion.div>);

};

export default CycleTrendChart;