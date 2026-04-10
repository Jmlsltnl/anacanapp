import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, ArrowLeft, ArrowRight, Baby, Pencil, Trash2, X, Check } from 'lucide-react';
import { useBabyLogs, FeedingHistoryItem } from '@/hooks/useBabyLogs';
import { useMealLogs } from '@/hooks/useMealLogs';
import { format, isToday, isYesterday } from 'date-fns';
import { az } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours} saat ${mins} dəq`;
  if (mins > 0) return `${mins} dəq ${secs} san`;
  return `${secs} san`;
};

const getFeedTypeLabel = (type: string): string => {
  switch (type) {
    case 'left': return 'Sol sinə';
    case 'right': return 'Sağ sinə';
    case 'formula': return 'Süni qida';
    case 'solid': return 'Bərk qida';
    default: return type;
  }
};

const getFeedTypeEmoji = (type: string): string => {
  switch (type) {
    case 'left': return '🤱←';
    case 'right': return '→🤱';
    case 'formula': return '🍼';
    case 'solid': return '🥣';
    default: return '🍼';
  }
};

const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Bu gün';
  if (isYesterday(date)) return 'Dünən';
  return format(date, 'd MMMM', { locale: az });
};

interface FeedingHistoryPanelProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  defaultExpanded?: boolean;
}

const FeedingHistoryPanel = ({ isExpanded: externalExpanded, onToggle, defaultExpanded = false }: FeedingHistoryPanelProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const { getFeedingHistory, getTodayFeedingBreakdown, deleteLog, updateLog } = useBabyLogs();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));
  
  const feedingHistory = getFeedingHistory(3);
  const todayBreakdown = getTodayFeedingBreakdown;
  const historyArray = Array.from(feedingHistory.entries());

  const totalFeedings = todayBreakdown.leftCount + todayBreakdown.rightCount + todayBreakdown.formulaCount + todayBreakdown.solidCount;
  const hasAnyFeedings = totalFeedings > 0;

  const buildSummaryText = () => {
    const parts: string[] = [];
    if (todayBreakdown.leftCount > 0 || todayBreakdown.rightCount > 0) {
      parts.push(`🤱 ${todayBreakdown.leftCount + todayBreakdown.rightCount}`);
    }
    if (todayBreakdown.formulaCount > 0) parts.push(`🍼 ${todayBreakdown.formulaCount}`);
    if (todayBreakdown.solidCount > 0) parts.push(`🥣 ${todayBreakdown.solidCount}`);
    return parts.length > 0 ? parts.join(' · ') : 'Qeyd yoxdur';
  };

  const handleDelete = async (id: string) => {
    const result = await deleteLog(id);
    if (!result.error) {
      toast({ title: 'Qeyd silindi' });
      setDeletingId(null);
    } else {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleEdit = (item: FeedingHistoryItem) => {
    setEditingId(item.id);
    setEditStartTime(format(item.startTime, "HH:mm"));
    setEditEndTime(item.endTime ? format(item.endTime, "HH:mm") : '');
  };

  const handleSaveEdit = async (item: FeedingHistoryItem) => {
    const dateStr = item.date;
    const [sh, sm] = editStartTime.split(':').map(Number);
    const newStart = new Date(item.startTime);
    newStart.setHours(sh, sm, 0, 0);

    const updates: any = { start_time: newStart.toISOString() };
    if (editEndTime) {
      const [eh, em] = editEndTime.split(':').map(Number);
      const newEnd = new Date(item.startTime);
      newEnd.setHours(eh, em, 0, 0);
      updates.end_time = newEnd.toISOString();
    }

    const result = await updateLog(item.id, updates);
    if (!result.error) {
      toast({ title: 'Qeyd yeniləndi' });
      setEditingId(null);
    } else {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  return (
    <div className="bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl overflow-hidden border border-amber-100 dark:border-amber-500/20">
      <button
        onClick={handleToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-amber-100/30 dark:hover:bg-amber-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <Baby className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Qidalanma xülasəsi</p>
            <p className="text-[10px] text-muted-foreground">{buildSummaryText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyFeedings && (
            <div className="text-right mr-2">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{totalFeedings} dəfə</p>
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
              {hasAnyFeedings && (
                <div className="grid grid-cols-2 gap-2">
                  {todayBreakdown.leftCount > 0 && (
                    <div className="bg-pink-100/50 dark:bg-pink-500/15 rounded-xl p-2.5 text-center border border-pink-100 dark:border-pink-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ArrowLeft className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                        <span className="text-xs font-semibold text-foreground">Sol sinə</span>
                      </div>
                      <p className="text-sm font-bold text-pink-600 dark:text-pink-400">{formatDuration(todayBreakdown.leftTotalSeconds)}</p>
                      <p className="text-[10px] text-muted-foreground">{todayBreakdown.leftCount} dəfə</p>
                    </div>
                  )}
                  {todayBreakdown.rightCount > 0 && (
                    <div className="bg-blue-100/50 dark:bg-blue-500/15 rounded-xl p-2.5 text-center border border-blue-100 dark:border-blue-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs font-semibold text-foreground">Sağ sinə</span>
                        <ArrowRight className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatDuration(todayBreakdown.rightTotalSeconds)}</p>
                      <p className="text-[10px] text-muted-foreground">{todayBreakdown.rightCount} dəfə</p>
                    </div>
                  )}
                  {todayBreakdown.formulaCount > 0 && (
                    <div className="bg-purple-100/50 dark:bg-purple-500/15 rounded-xl p-2.5 text-center border border-purple-100 dark:border-purple-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-lg">🍼</span>
                        <span className="text-xs font-semibold text-foreground">Süni qida</span>
                      </div>
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{todayBreakdown.formulaCount} dəfə</p>
                      <p className="text-[10px] text-muted-foreground">bu gün</p>
                    </div>
                  )}
                  {todayBreakdown.solidCount > 0 && (
                    <div className="bg-orange-100/50 dark:bg-orange-500/15 rounded-xl p-2.5 text-center border border-orange-100 dark:border-orange-500/20">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-lg">🥣</span>
                        <span className="text-xs font-semibold text-foreground">Bərk qida</span>
                      </div>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{todayBreakdown.solidCount} dəfə</p>
                      <p className="text-[10px] text-muted-foreground">bu gün</p>
                    </div>
                  )}
                </div>
              )}

              {historyArray.map(([date, items]) => (
                <div key={date} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{getDateLabel(date)}</p>
                    <p className="text-[10px] text-muted-foreground">{items.length} qidalanma</p>
                  </div>
                  
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Qeyd yoxdur</p>
                  ) : (
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div key={item.id} className="relative">
                          {/* Delete confirmation */}
                          {deletingId === item.id ? (
                            <div className="flex items-center justify-between bg-destructive/10 rounded-lg px-2.5 py-2 border border-destructive/20">
                              <span className="text-xs text-destructive font-medium">Silmək istəyirsiniz?</span>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-full bg-destructive/20 text-destructive">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => setDeletingId(null)} className="p-1.5 rounded-full bg-muted text-muted-foreground">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : editingId === item.id ? (
                            <div className="bg-primary/5 rounded-lg px-2.5 py-2 border border-primary/20 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{getFeedTypeEmoji(item.feedType)}</span>
                                <span className="text-xs font-medium text-foreground">{getFeedTypeLabel(item.feedType)}</span>
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
                                <button onClick={() => handleSaveEdit(item)} className="p-1.5 rounded-full bg-primary/20 text-primary">
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
                                <span className="text-sm">{getFeedTypeEmoji(item.feedType)}</span>
                                <div>
                                  <p className="text-xs font-medium text-foreground">
                                    {getFeedTypeLabel(item.feedType)}
                                    {item.feedType === 'formula' && item.notes && item.notes.includes('ml') && (
                                      <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">({item.notes})</span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {format(item.startTime, 'HH:mm')}
                                    {item.endTime && ` - ${format(item.endTime, 'HH:mm')}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs font-bold">{formatDuration(item.durationSeconds)}</span>
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(item)} className="p-1 rounded text-muted-foreground hover:text-primary">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setDeletingId(item.id)} className="p-1 rounded text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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

export default FeedingHistoryPanel;
