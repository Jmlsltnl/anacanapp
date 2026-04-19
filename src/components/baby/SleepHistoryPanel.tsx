import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Moon, Pencil, Trash2, X, Check } from 'lucide-react';
import { useBabyLogs } from '@/hooks/useBabyLogs';
import { format, isToday, isYesterday } from 'date-fns';
import { az } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { tr } from "@/lib/tr";

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return `${hours} saat ${mins} dəq`;
  return `${mins} dəq`;
};

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Bu gün';
  if (isYesterday(date)) return 'Dünən';
  return format(date, 'd MMMM', { locale: az });
};

interface SleepHistoryPanelProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  defaultExpanded?: boolean;
}

const SleepHistoryPanel = ({ isExpanded: externalExpanded, onToggle, defaultExpanded = false }: SleepHistoryPanelProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const { logs, todayLogs, deleteLog, updateLog } = useBabyLogs();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  // Today's sleep stats
  const todaySleepStats = useMemo(() => {
    const sleepLogs = todayLogs.filter(l => l.log_type === 'sleep');
    let totalMinutes = 0;
    sleepLogs.forEach(log => {
      if (log.end_time) {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
      }
    });
    return { count: sleepLogs.length, totalMinutes };
  }, [todayLogs]);

  // Sleep history for last 3 days
  const sleepHistory = useMemo(() => {
    const sleepLogs = logs.filter(l => l.log_type === 'sleep');
    const historyMap = new Map<string, typeof sleepLogs>();
    const dates: string[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      historyMap.set(dateStr, []);
    }
    sleepLogs.forEach(log => {
      const dateStr = log.start_time.split('T')[0];
      if (dates.includes(dateStr)) {
        const existing = historyMap.get(dateStr) || [];
        existing.push(log);
        historyMap.set(dateStr, existing);
      }
    });
    return Array.from(historyMap.entries());
  }, [logs]);

  const handleDelete = async (id: string) => {
    const result = await deleteLog(id);
    if (!result.error) {
      toast({ title: 'Yuxu qeydi silindi' });
      setDeletingId(null);
    } else {
      toast({ title: tr("sleephistorypanel_xeta_bas_verdi_f22fba", 'Xəta baş verdi'), variant: 'destructive' });
    }
  };

  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setEditStartTime(format(new Date(log.start_time), 'HH:mm'));
    setEditEndTime(log.end_time ? format(new Date(log.end_time), 'HH:mm') : '');
  };

  const handleSaveEdit = async (log: any) => {
    const [sh, sm] = editStartTime.split(':').map(Number);
    const newStart = new Date(log.start_time);
    newStart.setHours(sh, sm, 0, 0);
    const updates: any = { start_time: newStart.toISOString() };
    if (editEndTime) {
      const [eh, em] = editEndTime.split(':').map(Number);
      const newEnd = new Date(log.start_time);
      newEnd.setHours(eh, em, 0, 0);
      updates.end_time = newEnd.toISOString();
    }
    const result = await updateLog(log.id, updates);
    if (!result.error) {
      toast({ title: tr("sleephistorypanel_yuxu_qeydi_yenilendi_26a02f", 'Yuxu qeydi yeniləndi') });
      setEditingId(null);
    } else {
      toast({ title: tr("sleephistorypanel_xeta_bas_verdi_f22fba", 'Xəta baş verdi'), variant: 'destructive' });
    }
  };

  return (
    <div className="bg-violet-50/50 dark:bg-violet-500/10 rounded-2xl overflow-hidden border border-violet-100 dark:border-violet-500/20">
      <button
        onClick={handleToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-violet-100/30 dark:hover:bg-violet-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Yuxu xülasəsi</p>
            <p className="text-[10px] text-muted-foreground">
              {todaySleepStats.count > 0
                ? `🌙 ${todaySleepStats.count} dəfə · ${formatDuration(todaySleepStats.totalMinutes)}`
                : 'Qeyd yoxdur'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {todaySleepStats.count > 0 && (
            <div className="text-right mr-2">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">
                {formatDuration(todaySleepStats.totalMinutes)}
              </p>
              <p className="text-[10px] text-muted-foreground">bu gün</p>
            </div>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {sleepHistory.map(([date, items]) => (
                <div key={date} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{getDateLabel(date)}</p>
                    <p className="text-[10px] text-muted-foreground">{items.length} yuxu</p>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Qeyd yoxdur</p>
                  ) : (
                    <div className="space-y-1">
                      {items.map((log) => {
                        const startTime = new Date(log.start_time);
                        const endTime = log.end_time ? new Date(log.end_time) : null;
                        const durationMin = endTime ? (endTime.getTime() - startTime.getTime()) / (1000 * 60) : 0;

                        return (
                          <div key={log.id} className="relative">
                            {deletingId === log.id ? (
                              <div className="flex items-center justify-between bg-destructive/10 rounded-lg px-2.5 py-2 border border-destructive/20">
                                <span className="text-xs text-destructive font-medium">Silmək istəyirsiniz?</span>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleDelete(log.id)} className="p-1.5 rounded-full bg-destructive/20 text-destructive">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setDeletingId(null)} className="p-1.5 rounded-full bg-muted text-muted-foreground">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : editingId === log.id ? (
                              <div className="bg-primary/5 rounded-lg px-2.5 py-2 border border-primary/20 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🌙</span>
                                  <span className="text-xs font-medium text-foreground">Yuxu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 w-24"
                                  />
                                  <span className="text-xs text-muted-foreground">-</span>
                                  <input
                                    type="time"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="text-xs bg-background border border-border rounded px-2 py-1 w-24"
                                  />
                                </div>
                                <div className="flex justify-end gap-1.5">
                                  <button onClick={() => handleSaveEdit(log)} className="p-1.5 rounded-full bg-primary/20 text-primary">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-full bg-muted text-muted-foreground">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-white/60 dark:bg-card/60 rounded-lg px-2.5 py-1.5 border border-transparent dark:border-border/30 group">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🌙</span>
                                  <div>
                                    <p className="text-xs font-medium text-foreground">Yuxu</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {format(startTime, 'HH:mm')}
                                      {endTime && ` - ${format(endTime, 'HH:mm')}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs font-bold">{formatDuration(durationMin)}</span>
                                  </div>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(log)} className="p-1 rounded text-muted-foreground hover:text-primary">
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setDeletingId(log.id)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SleepHistoryPanel;
