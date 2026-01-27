import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Droplet, Plus, TrendingUp, TrendingDown, 
  Minus, Calendar, Clock, Trash2, AlertTriangle, CheckCircle,
  Edit, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday, subDays, startOfDay } from 'date-fns';
import { az } from 'date-fns/locale';

interface BloodSugarTrackerProps {
  onBack: () => void;
}

interface BloodSugarLog {
  id: string;
  user_id: string;
  reading_value: number;
  reading_type: string;
  meal_context: string | null;
  notes: string | null;
  logged_at: string;
  created_at: string;
}

const readingTypes = [
  { id: 'fasting', label: 'Aclıq', emoji: '🌅', description: 'Səhər tezdən, yeməkdən əvvəl' },
  { id: 'before_meal', label: 'Yeməkdən əvvəl', emoji: '🍽️', description: 'Yeməkdən 30 dəq əvvəl' },
  { id: 'after_meal', label: 'Yeməkdən sonra', emoji: '⏰', description: 'Yeməkdən 2 saat sonra' },
  { id: 'bedtime', label: 'Yatmazdan əvvəl', emoji: '🌙', description: 'Gecə yatmaq üçün' },
  { id: 'random', label: 'Təsadüfi', emoji: '📊', description: 'İstənilən vaxt' },
];

const mealContexts = [
  { id: 'breakfast', label: 'Səhər yeməyi', emoji: '🥞' },
  { id: 'lunch', label: 'Nahar', emoji: '🍲' },
  { id: 'dinner', label: 'Şam yeməyi', emoji: '🍛' },
  { id: 'snack', label: 'Qəlyanaltı', emoji: '🍎' },
];

// Blood sugar level thresholds (mg/dL)
const getReadingStatus = (value: number, type: string) => {
  if (type === 'fasting') {
    if (value < 70) return { status: 'low', label: 'Aşağı', color: 'text-blue-600', bg: 'bg-blue-500/10' };
    if (value <= 95) return { status: 'normal', label: 'Normal', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (value <= 125) return { status: 'elevated', label: 'Yüksəlmiş', color: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { status: 'high', label: 'Yüksək', color: 'text-red-600', bg: 'bg-red-500/10' };
  } else {
    if (value < 70) return { status: 'low', label: 'Aşağı', color: 'text-blue-600', bg: 'bg-blue-500/10' };
    if (value <= 140) return { status: 'normal', label: 'Normal', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (value <= 180) return { status: 'elevated', label: 'Yüksəlmiş', color: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { status: 'high', label: 'Yüksək', color: 'text-red-600', bg: 'bg-red-500/10' };
  }
};

const BloodSugarTracker = ({ onBack }: BloodSugarTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReading, setNewReading] = useState('');
  const [selectedType, setSelectedType] = useState('random');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['blood-sugar-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('blood_sugar_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as BloodSugarLog[];
    },
    enabled: !!user?.id,
  });

  const addLogMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newReading) throw new Error('Məlumat yoxdur');
      
      const { error } = await supabase
        .from('blood_sugar_logs')
        .insert({
          user_id: user.id,
          reading_value: parseFloat(newReading),
          reading_type: selectedType,
          meal_context: selectedMeal,
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-sugar-logs'] });
      setShowAddModal(false);
      setNewReading('');
      setSelectedType('random');
      setSelectedMeal(null);
      setNotes('');
      toast({ title: 'Qeyd əlavə edildi', description: 'Qan şəkəri səviyyəsi uğurla qeyd edildi' });
    },
    onError: () => {
      toast({ title: 'Xəta', description: 'Qeyd əlavə edilə bilmədi', variant: 'destructive' });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blood_sugar_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-sugar-logs'] });
      toast({ title: 'Silindi', description: 'Qeyd silindi' });
    },
  });

  // Calculate statistics
  const todayLogs = logs.filter(log => isToday(new Date(log.logged_at)));
  const weekLogs = logs.filter(log => new Date(log.logged_at) >= subDays(new Date(), 7));
  
  const avgToday = todayLogs.length > 0 
    ? Math.round(todayLogs.reduce((sum, log) => sum + log.reading_value, 0) / todayLogs.length)
    : null;
  
  const avgWeek = weekLogs.length > 0
    ? Math.round(weekLogs.reduce((sum, log) => sum + log.reading_value, 0) / weekLogs.length)
    : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Bu gün';
    if (isYesterday(date)) return 'Dünən';
    return format(date, 'd MMM', { locale: az });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Qan Şəkəri</h1>
              <p className="text-xs text-muted-foreground">Səviyyəni izləyin</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="rounded-xl"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Əlavə et
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <motion.div 
          className="bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-2xl p-4 border border-red-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-5 h-5 text-red-500" />
            <span className="text-xs text-muted-foreground">Bu gün orta</span>
          </div>
          <p className="text-2xl font-bold">
            {avgToday ? `${avgToday}` : '—'}
            {avgToday && <span className="text-sm font-normal text-muted-foreground ml-1">mg/dL</span>}
          </p>
          {avgToday && (
            <Badge className={`mt-1 text-[10px] ${getReadingStatus(avgToday, 'random').bg} ${getReadingStatus(avgToday, 'random').color} border-0`}>
              {getReadingStatus(avgToday, 'random').label}
            </Badge>
          )}
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Həftəlik orta</span>
          </div>
          <p className="text-2xl font-bold">
            {avgWeek ? `${avgWeek}` : '—'}
            {avgWeek && <span className="text-sm font-normal text-muted-foreground ml-1">mg/dL</span>}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {weekLogs.length} ölçmə
          </p>
        </motion.div>
      </div>

      {/* Info Card */}
      <div className="px-4 mb-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Hamiləlik zamanı normal səviyyələr:</p>
              <p>• Aclıq: 70-95 mg/dL</p>
              <p>• Yeməkdən 2 saat sonra: &lt;140 mg/dL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="px-4">
        <h2 className="font-semibold text-sm mb-3">Son ölçmələr</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-3 border border-border/50 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-6 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Droplet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Hələ heç bir qeyd yoxdur</p>
            <p className="text-muted-foreground text-xs mt-1">İlk ölçmənizi əlavə edin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => {
              const status = getReadingStatus(log.reading_value, log.reading_type);
              const typeInfo = readingTypes.find(t => t.id === log.reading_type);
              const mealInfo = mealContexts.find(m => m.id === log.meal_context);
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl p-3 border border-border/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center`}>
                        <span className="text-lg">{typeInfo?.emoji || '📊'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{log.reading_value}</span>
                          <span className="text-xs text-muted-foreground">mg/dL</span>
                          <Badge className={`text-[10px] ${status.bg} ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{typeInfo?.label}</span>
                          {mealInfo && (
                            <>
                              <span>•</span>
                              <span>{mealInfo.emoji} {mealInfo.label}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-medium">{formatDate(log.logged_at)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(log.logged_at), 'HH:mm')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteLogMutation.mutate(log.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pl-13">{log.notes}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-card rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Yeni ölçmə</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Reading Value */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Qan şəkəri səviyyəsi (mg/dL)</label>
              <input
                type="number"
                inputMode="decimal"
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
                placeholder="Məsələn: 95"
                className="w-full h-14 px-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-2xl font-bold text-center transition-all outline-none"
              />
              {newReading && (
                <div className="mt-2 text-center">
                  <Badge className={`${getReadingStatus(parseFloat(newReading), selectedType).bg} ${getReadingStatus(parseFloat(newReading), selectedType).color} border-0`}>
                    {getReadingStatus(parseFloat(newReading), selectedType).label}
                  </Badge>
                </div>
              )}
            </div>

            {/* Reading Type */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Ölçmə növü</label>
              <div className="grid grid-cols-2 gap-2">
                {readingTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedType === type.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 bg-card'
                    }`}
                  >
                    <span className="text-lg mr-2">{type.emoji}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Context (optional) */}
            {(selectedType === 'before_meal' || selectedType === 'after_meal') && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Yemək</label>
                <div className="grid grid-cols-4 gap-2">
                  {mealContexts.map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        selectedMeal === meal.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border/50 bg-card'
                      }`}
                    >
                      <span className="text-xl block">{meal.emoji}</span>
                      <span className="text-[10px]">{meal.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Qeyd (istəyə bağlı)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Əlavə qeydlər..."
                className="w-full h-20 px-3 py-2 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-sm resize-none transition-all outline-none"
              />
            </div>

            <Button 
              className="w-full h-12 rounded-xl font-semibold"
              disabled={!newReading || addLogMutation.isPending}
              onClick={() => addLogMutation.mutate()}
            >
              {addLogMutation.isPending ? 'Əlavə edilir...' : 'Qeyd et'}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BloodSugarTracker;
