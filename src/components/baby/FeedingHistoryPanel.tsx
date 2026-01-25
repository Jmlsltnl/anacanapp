import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBabyLogs, FeedingHistoryItem } from '@/hooks/useBabyLogs';
import { format, isToday, isYesterday } from 'date-fns';
import { az } from 'date-fns/locale';

const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours} saat ${mins} dəq`;
  } else if (mins > 0) {
    return `${mins} dəq ${secs} san`;
  } else {
    return `${secs} san`;
  }
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
}

const FeedingHistoryPanel = ({ isExpanded: externalExpanded, onToggle }: FeedingHistoryPanelProps) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { getFeedingHistory, getTodayFeedingBreakdown } = useBabyLogs();
  
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));
  
  const feedingHistory = getFeedingHistory(3);
  const todayBreakdown = getTodayFeedingBreakdown;
  
  // Convert map to array for rendering
  const historyArray = Array.from(feedingHistory.entries());

  return (
    <div className="bg-amber-50/50 rounded-2xl overflow-hidden border border-amber-100">
      {/* Summary Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-amber-100/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            🤱
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Qidalanma xülasəsi</p>
            <p className="text-[10px] text-muted-foreground">
              {todayBreakdown.totalBreastFeedings > 0 && (
                <>Sol: {todayBreakdown.leftCount}x · Sağ: {todayBreakdown.rightCount}x</>
              )}
              {todayBreakdown.formulaCount > 0 && ` · 🍼${todayBreakdown.formulaCount}`}
              {todayBreakdown.solidCount > 0 && ` · 🥣${todayBreakdown.solidCount}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {todayBreakdown.totalBreastSeconds > 0 && (
            <div className="text-right mr-2">
              <p className="text-xs font-bold text-amber-600">
                {formatDuration(todayBreakdown.totalBreastSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground">cəmi</p>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Today's breakdown - visible when collapsed */}
      {!isExpanded && todayBreakdown.totalBreastFeedings > 0 && (
        <div className="px-3 pb-3 flex gap-2">
          <div className="flex-1 bg-pink-100/50 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3 text-pink-500" />
              <span className="text-xs font-medium">Sol</span>
            </div>
            <p className="text-sm font-bold text-pink-600">{formatDuration(todayBreakdown.leftTotalSeconds)}</p>
            <p className="text-[10px] text-muted-foreground">{todayBreakdown.leftCount} dəfə</p>
          </div>
          <div className="flex-1 bg-blue-100/50 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-medium">Sağ</span>
              <ArrowRight className="w-3 h-3 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-blue-600">{formatDuration(todayBreakdown.rightTotalSeconds)}</p>
            <p className="text-[10px] text-muted-foreground">{todayBreakdown.rightCount} dəfə</p>
          </div>
        </div>
      )}

      {/* Expanded History */}
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
              {/* Today's detailed breakdown */}
              {todayBreakdown.totalBreastFeedings > 0 && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-pink-100/50 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ArrowLeft className="w-3 h-3 text-pink-500" />
                      <span className="text-xs font-semibold">Sol sinə</span>
                    </div>
                    <p className="text-lg font-bold text-pink-600">{formatDuration(todayBreakdown.leftTotalSeconds)}</p>
                    <p className="text-[10px] text-muted-foreground">{todayBreakdown.leftCount} dəfə</p>
                  </div>
                  <div className="flex-1 bg-blue-100/50 rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-xs font-semibold">Sağ sinə</span>
                      <ArrowRight className="w-3 h-3 text-blue-500" />
                    </div>
                    <p className="text-lg font-bold text-blue-600">{formatDuration(todayBreakdown.rightTotalSeconds)}</p>
                    <p className="text-[10px] text-muted-foreground">{todayBreakdown.rightCount} dəfə</p>
                  </div>
                </div>
              )}

              {/* Daily history */}
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
                        <div 
                          key={item.id}
                          className="flex items-center justify-between bg-white/60 rounded-lg px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getFeedTypeEmoji(item.feedType)}</span>
                            <div>
                              <p className="text-xs font-medium">{getFeedTypeLabel(item.feedType)}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(item.startTime, 'HH:mm')}
                                {item.endTime && ` - ${format(item.endTime, 'HH:mm')}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-amber-600">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-bold">
                              {formatDuration(item.durationSeconds)}
                            </span>
                          </div>
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
