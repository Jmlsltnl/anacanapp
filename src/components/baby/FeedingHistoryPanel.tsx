import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, ArrowLeft, ArrowRight, Baby, UtensilsCrossed } from 'lucide-react';
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
  defaultExpanded?: boolean;
}

const FeedingHistoryPanel = ({ isExpanded: externalExpanded, onToggle, defaultExpanded = false }: FeedingHistoryPanelProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const { getFeedingHistory, getTodayFeedingBreakdown } = useBabyLogs();
  
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));
  
  const feedingHistory = getFeedingHistory(3);
  const todayBreakdown = getTodayFeedingBreakdown;
  
  // Convert map to array for rendering
  const historyArray = Array.from(feedingHistory.entries());

  // Calculate totals for all types
  const totalFeedings = todayBreakdown.leftCount + todayBreakdown.rightCount + todayBreakdown.formulaCount + todayBreakdown.solidCount;
  const hasAnyFeedings = totalFeedings > 0;

  // Build summary text dynamically
  const buildSummaryText = () => {
    const parts: string[] = [];
    
    if (todayBreakdown.leftCount > 0 || todayBreakdown.rightCount > 0) {
      parts.push(`🤱 ${todayBreakdown.leftCount + todayBreakdown.rightCount}`);
    }
    if (todayBreakdown.formulaCount > 0) {
      parts.push(`🍼 ${todayBreakdown.formulaCount}`);
    }
    if (todayBreakdown.solidCount > 0) {
      parts.push(`🥣 ${todayBreakdown.solidCount}`);
    }
    
    return parts.length > 0 ? parts.join(' · ') : 'Qeyd yoxdur';
  };

  return (
    <div className="bg-amber-50/50 rounded-2xl overflow-hidden border border-amber-100">
      {/* Summary Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-amber-100/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Baby className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Qidalanma xülasəsi</p>
            <p className="text-[10px] text-muted-foreground">
              {buildSummaryText()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyFeedings && (
            <div className="text-right mr-2">
              <p className="text-xs font-bold text-amber-600">
                {totalFeedings} dəfə
              </p>
              <p className="text-[10px] text-muted-foreground">bu gün</p>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

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
              {/* Today's detailed breakdown - All types */}
              {hasAnyFeedings && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Breast Left */}
                  {todayBreakdown.leftCount > 0 && (
                    <div className="bg-pink-100/50 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ArrowLeft className="w-3 h-3 text-pink-500" />
                        <span className="text-xs font-semibold">Sol sinə</span>
                      </div>
                      <p className="text-sm font-bold text-pink-600">{formatDuration(todayBreakdown.leftTotalSeconds)}</p>
                      <p className="text-[10px] text-muted-foreground">{todayBreakdown.leftCount} dəfə</p>
                    </div>
                  )}
                  
                  {/* Breast Right */}
                  {todayBreakdown.rightCount > 0 && (
                    <div className="bg-blue-100/50 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs font-semibold">Sağ sinə</span>
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                      </div>
                      <p className="text-sm font-bold text-blue-600">{formatDuration(todayBreakdown.rightTotalSeconds)}</p>
                      <p className="text-[10px] text-muted-foreground">{todayBreakdown.rightCount} dəfə</p>
                    </div>
                  )}
                  
                  {/* Formula */}
                  {todayBreakdown.formulaCount > 0 && (
                    <div className="bg-purple-100/50 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-lg">🍼</span>
                        <span className="text-xs font-semibold">Süni qida</span>
                      </div>
                      <p className="text-sm font-bold text-purple-600">{todayBreakdown.formulaCount} dəfə</p>
                      <p className="text-[10px] text-muted-foreground">bu gün</p>
                    </div>
                  )}
                  
                  {/* Solid Food */}
                  {todayBreakdown.solidCount > 0 && (
                    <div className="bg-orange-100/50 rounded-xl p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-lg">🥣</span>
                        <span className="text-xs font-semibold">Bərk qida</span>
                      </div>
                      <p className="text-sm font-bold text-orange-600">{todayBreakdown.solidCount} dəfə</p>
                      <p className="text-[10px] text-muted-foreground">bu gün</p>
                    </div>
                  )}
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