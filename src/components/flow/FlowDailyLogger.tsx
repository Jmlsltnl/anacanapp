import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Meh, Heart, Moon, Thermometer, 
  Droplets, ChevronDown, ChevronUp, Check, Plus,
  Zap, CloudRain, Sun, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFlowDailyLog, useSaveFlowDailyLog, useFlowSymptoms, FlowDailyLog } from '@/hooks/useFlowDailyLogs';
import { toast } from 'sonner';

interface FlowDailyLoggerProps {
  date?: Date;
  compact?: boolean;
  onSave?: () => void;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Çox pis', color: 'bg-red-100 border-red-300 text-red-700' },
  { value: 2, emoji: '😔', label: 'Pis', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { value: 3, emoji: '😐', label: 'Normal', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 4, emoji: '😊', label: 'Yaxşı', color: 'bg-green-100 border-green-300 text-green-700' },
  { value: 5, emoji: '🥰', label: 'Əla', color: 'bg-pink-100 border-pink-300 text-pink-700' },
];

const ENERGY_OPTIONS = [
  { value: 1, icon: CloudRain, label: 'Çox aşağı', color: 'text-slate-400' },
  { value: 2, icon: Meh, label: 'Aşağı', color: 'text-slate-500' },
  { value: 3, icon: Sun, label: 'Normal', color: 'text-yellow-500' },
  { value: 4, icon: Zap, label: 'Yüksək', color: 'text-orange-500' },
  { value: 5, icon: Sparkles, label: 'Çox yüksək', color: 'text-amber-500' },
];

const FLOW_OPTIONS = [
  { value: 'none', label: 'Yoxdur', emoji: '⚪', color: 'bg-slate-100' },
  { value: 'spotting', label: 'Ləkələnmə', emoji: '🔵', color: 'bg-blue-100' },
  { value: 'light', label: 'Yüngül', emoji: '🩸', color: 'bg-red-100' },
  { value: 'medium', label: 'Orta', emoji: '🩸🩸', color: 'bg-red-200' },
  { value: 'heavy', label: 'Güclü', emoji: '🩸🩸🩸', color: 'bg-red-300' },
];

const SLEEP_QUALITY = [
  { value: 1, label: 'Çox pis', emoji: '😫' },
  { value: 2, label: 'Pis', emoji: '😴' },
  { value: 3, label: 'Normal', emoji: '😐' },
  { value: 4, label: 'Yaxşı', emoji: '😌' },
  { value: 5, label: 'Əla', emoji: '😇' },
];

const FlowDailyLogger = ({ date = new Date(), compact = false, onSave }: FlowDailyLoggerProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: existingLog, isLoading } = useFlowDailyLog(dateStr);
  const { data: symptoms = [] } = useFlowSymptoms();
  const saveLog = useSaveFlowDailyLog();

  const [expanded, setExpanded] = useState(!compact);
  const [formData, setFormData] = useState<Partial<FlowDailyLog>>({
    mood: null,
    energy_level: null,
    symptoms: [],
    pain_level: null,
    flow_intensity: null,
    sleep_hours: null,
    sleep_quality: null,
    temperature: null,
    water_glasses: 0,
    notes: null,
  });

  useEffect(() => {
    if (existingLog) {
      setFormData({
        mood: existingLog.mood,
        energy_level: existingLog.energy_level,
        symptoms: existingLog.symptoms || [],
        pain_level: existingLog.pain_level,
        flow_intensity: existingLog.flow_intensity,
        sleep_hours: existingLog.sleep_hours,
        sleep_quality: existingLog.sleep_quality,
        temperature: existingLog.temperature,
        water_glasses: existingLog.water_glasses || 0,
        notes: existingLog.notes,
      });
    }
  }, [existingLog]);

  const toggleSymptom = (symptomKey: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms?.includes(symptomKey)
        ? prev.symptoms.filter(s => s !== symptomKey)
        : [...(prev.symptoms || []), symptomKey],
    }));
  };

  const handleSave = async () => {
    try {
      await saveLog.mutateAsync({
        log_date: dateStr,
        ...formData,
      });
      toast.success('Gündəlik qeyd saxlanıldı!');
      onSave?.();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    mood: existingLog?.mood ?? null,
    energy_level: existingLog?.energy_level ?? null,
    symptoms: existingLog?.symptoms || [],
    pain_level: existingLog?.pain_level ?? null,
    flow_intensity: existingLog?.flow_intensity ?? null,
    sleep_hours: existingLog?.sleep_hours ?? null,
    sleep_quality: existingLog?.sleep_quality ?? null,
    temperature: existingLog?.temperature ?? null,
    water_glasses: existingLog?.water_glasses || 0,
    notes: existingLog?.notes ?? null,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground">Gündəlik Qeyd</h3>
            <p className="text-xs text-muted-foreground">
              {format(date, 'd MMMM, EEEE', { locale: az })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingLog && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Doldurulub
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-6">
              {/* Mood */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Əhval</label>
                <div className="flex gap-2 justify-between">
                  {MOOD_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, mood: option.value }))}
                      className={`flex-1 py-3 rounded-xl text-center transition-all ${
                        formData.mood === option.value
                          ? `${option.color} border-2 scale-105`
                          : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <p className="text-[10px] mt-1 font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Enerji Səviyyəsi</label>
                <div className="flex gap-2 justify-between">
                  {ENERGY_OPTIONS.map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, energy_level: option.value }))}
                        className={`flex-1 py-3 rounded-xl text-center transition-all ${
                          formData.energy_level === option.value
                            ? 'bg-primary/10 border-2 border-primary scale-105'
                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto ${option.color}`} />
                        <p className="text-[10px] mt-1 font-medium">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flow Intensity */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-red-500" /> Qanaxma
                </label>
                <div className="flex gap-2 flex-wrap">
                  {FLOW_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        flow_intensity: option.value as FlowDailyLog['flow_intensity'] 
                      }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.flow_intensity === option.value
                          ? `${option.color} border-2 border-red-300`
                          : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Ağrı Səviyyəsi: {formData.pain_level ?? 0}/10
                </label>
                <Slider
                  value={[formData.pain_level ?? 0]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, pain_level: value }))}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Ağrı yoxdur</span>
                  <span>Çox ağrılı</span>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Simptomlar</label>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map(symptom => (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.symptom_key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        formData.symptoms?.includes(symptom.symptom_key)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {symptom.emoji} {symptom.label_az || symptom.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" /> Yuxu (saat)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={formData.sleep_hours ?? ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      sleep_hours: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    placeholder="7.5"
                    className="text-center"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Yuxu Keyfiyyəti</label>
                  <div className="flex gap-1">
                    {SLEEP_QUALITY.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, sleep_quality: option.value }))}
                        className={`flex-1 py-2 rounded-lg text-lg transition-all ${
                          formData.sleep_quality === option.value
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 scale-110'
                            : 'hover:bg-muted'
                        }`}
                        title={option.label}
                      >
                        {option.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" /> Bədən Temperaturu (°C)
                </label>
                <Input
                  type="number"
                  min={35}
                  max={42}
                  step={0.1}
                  value={formData.temperature ?? ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    temperature: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="36.6"
                  className="max-w-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  BBT ölçmə zamanı dəqiq nəticə üçün səhər yuxudan durduqda ölçün
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Qeydlər</label>
                <Textarea
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || null }))}
                  placeholder="Bu gün haqqında qeydlərinizi yazın..."
                  rows={3}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saveLog.isPending || !hasChanges}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              >
                {saveLog.isPending ? 'Saxlanılır...' : existingLog ? 'Yenilə' : 'Saxla'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FlowDailyLogger;
