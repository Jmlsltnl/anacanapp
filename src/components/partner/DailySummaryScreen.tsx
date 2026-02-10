import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Droplets, 
  Heart, 
  Activity,
  Smile,
  Frown,
  Meh,
  RefreshCw
} from 'lucide-react';
import { useDailySummary, DailySummary } from '@/hooks/useDailySummary';
import { format, isToday, isYesterday } from 'date-fns';
import { az } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { SYMPTOMS } from '@/types/anacan';

interface DailySummaryScreenProps {
  onBack: () => void;
}

const DailySummaryScreen: React.FC<DailySummaryScreenProps> = ({ onBack }) => {
  const { summaries, loading } = useDailySummary();

  const getMoodEmoji = (mood: number | null) => {
    if (!mood) return '❓';
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '❓';
  };

  const getMoodLabel = (mood: number | null) => {
    if (!mood) return 'Qeyd yox';
    const labels = ['Çox pis', 'Pis', 'Normal', 'Yaxşı', 'Əla'];
    return labels[mood - 1] || 'Qeyd yox';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Bu gün';
    if (isYesterday(date)) return 'Dünən';
    return format(date, 'd MMMM', { locale: az });
  };

  const getSymptomLabel = (symptomId: string) => {
    const symptom = SYMPTOMS.find(s => s.id === symptomId);
    return symptom ? `${symptom.icon} ${symptom.label}` : symptomId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Gündəlik Xülasə</h1>
          <div className="w-10" />
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Hələlik xülasə yoxdur
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Partnyorunuz gündəlik məlumatlarını qeyd etdikdə burada xülasə görəcəksiniz
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {summaries.map((summary, index) => (
            <SummaryCard 
              key={summary.id} 
              summary={summary} 
              formatDate={formatDate}
              getMoodEmoji={getMoodEmoji}
              getMoodLabel={getMoodLabel}
              getSymptomLabel={getSymptomLabel}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  summary: DailySummary;
  formatDate: (date: string) => string;
  getMoodEmoji: (mood: number | null) => string;
  getMoodLabel: (mood: number | null) => string;
  getSymptomLabel: (symptomId: string) => string;
  index: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  formatDate,
  getMoodEmoji,
  getMoodLabel,
  getSymptomLabel,
  index,
}) => {
  const isRecent = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border overflow-hidden ${
        isRecent
          ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'
          : 'bg-card border-border'
      }`}
    >
      {/* Date header */}
      <div className={`px-4 py-3 border-b ${isRecent ? 'border-primary/10' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatDate(summary.summary_date)}</span>
          {isRecent && (
            <Badge className="bg-primary/20 text-primary border-0">
              Ən son
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Mood */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            summary.mood && summary.mood >= 4 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : summary.mood && summary.mood <= 2
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-muted'
          }`}>
            {getMoodEmoji(summary.mood)}
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Əhval</div>
            <div className="font-medium">{getMoodLabel(summary.mood)}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {summary.water_intake}ml
            </div>
            <div className="text-xs text-muted-foreground">Su</div>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
            <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
              {summary.kick_count}
            </div>
            <div className="text-xs text-muted-foreground">Təpik</div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {summary.contraction_count}
            </div>
            <div className="text-xs text-muted-foreground">Sancı</div>
          </div>
        </div>

        {/* Symptoms */}
        {summary.symptoms && summary.symptoms.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Simptomlar</div>
            <div className="flex flex-wrap gap-2">
              {summary.symptoms.map((symptom) => (
                <Badge key={symptom} variant="secondary">
                  {getSymptomLabel(symptom)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {summary.notes && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Qeydlər</div>
            <p className="text-sm">{summary.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DailySummaryScreen;
