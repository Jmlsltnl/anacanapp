import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Pill, Check, Clock, Bell, BellOff, Trash2, X, ChevronDown } from 'lucide-react';
import { useVitaminSchedules, VitaminSchedule } from '@/hooks/useVitaminSchedules';
import { toast } from 'sonner';
import { hapticFeedback } from '@/lib/native';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";
import MedicalDisclaimer from '@/components/MedicalDisclaimer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';

interface VitaminTrackerProps {
  onBack?: () => void;
}

const VITAMIN_PRESETS = [
{ name: tr("vitamintracker_folat_fol_tursusu_941d76", "Folat (Fol turşusu)"), emoji: '🟢' },
{ name: tr("vitamintracker_d_vitamini", "D vitamini"), emoji: '☀️' },
{ name: tr("vitamintracker_demir_30bf6c", "Dəmir"), emoji: '🔴' },
{ name: tr("vitamintracker_kalsium", "Kalsium"), emoji: '🦴' },
{ name: tr("vitamintracker_omega_3", "Omega-3"), emoji: '🐟' },
{ name: tr("vitamintracker_b12_vitamini", "B12 vitamini"), emoji: '💜' },
{ name: tr("vitamintracker_c_vitamini", "C vitamini"), emoji: '🍊' },
{ name: tr("vitamintracker_maqnezium", "Maqnezium"), emoji: '💎' },
{ name: tr("vitamintracker_sink", "Sink"), emoji: '⚡' },
{ name: tr("vitamintracker_yod", "Yod"), emoji: '🌊' },
{ name: tr("vitamintracker_prenatal_vitamin", "Prenatal vitamin"), emoji: '💊' },
{ name: tr("vitamintracker_probiotik", "Probiotik"), emoji: '🦠' }];


const DAY_LABELS = ['B', 'B.e', tr("vitamintracker_c_a_28099e", "Ç.a"), tr("vitamintracker_c_b70344", "Ç"), 'C.a', 'C', tr("vitamintracker_s_b97106", "Ş")];

const VitaminTracker = ({ onBack }: VitaminTrackerProps) => {
  const language = useUserStore((state) => state.language);
  
  const { data: dbVitamins = [] } = useQuery({
    queryKey: ['all_raw_vitamins'],
    queryFn: async () => {
      const { data } = await supabase.from('vitamins').select('name, name_az, icon_emoji').eq('is_active', true);
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const dynamicPresets = dbVitamins.length > 0 ? dbVitamins.map(v => ({
    name: language === 'az' ? (v.name_az || v.name) : v.name,
    emoji: v.icon_emoji || '💊'
  })) : VITAMIN_PRESETS;

  const getTranslatedVitaminName = (savedName: string) => {
    if (!savedName) return savedName;
    const normalized = savedName.trim().toLowerCase();
    
    const dbVit = dbVitamins.find(v => 
      (v.name && v.name.toLowerCase() === normalized) || 
      (v.name_az && v.name_az.toLowerCase() === normalized)
    );
    
    if (dbVit) {
      return language === 'az' ? (dbVit.name_az || dbVit.name) : dbVit.name;
    }
    
    if (normalized === 'folat (fol turşusu)' || normalized === 'folate (folic acid)') return tr("vitamintracker_folat_fol_tursusu_941d76", "Folat (Fol turşusu)");
    if (normalized === 'd vitamini' || normalized === 'vitamin d') return tr("vitamintracker_d_vitamini", "D vitamini");
    if (normalized === 'dəmir' || normalized === 'iron') return tr("vitamintracker_demir_30bf6c", "Dəmir");
    if (normalized === 'kalsium' || normalized === 'calcium') return tr("vitamintracker_kalsium", "Kalsium");
    if (normalized === 'omega-3') return tr("vitamintracker_omega_3", "Omega-3");
    if (normalized === 'b12 vitamini' || normalized === 'vitamin b12') return tr("vitamintracker_b12_vitamini", "B12 vitamini");
    if (normalized === 'c vitamini' || normalized === 'vitamin c') return tr("vitamintracker_c_vitamini", "C vitamini");
    if (normalized === 'maqnezium' || normalized === 'magnesium') return tr("vitamintracker_maqnezium", "Maqnezium");
    if (normalized === 'sink' || normalized === 'zinc') return tr("vitamintracker_sink", "Sink");
    if (normalized === 'yod' || normalized === 'iodine') return tr("vitamintracker_yod", "Yod");
    if (normalized === 'prenatal vitamin') return tr("vitamintracker_prenatal_vitamin", "Prenatal vitamin");
    if (normalized === 'probiotik' || normalized === 'probiotic') return tr("vitamintracker_probiotik", "Probiotik");
    
    return savedName;
  };

  useScreenAnalytics('VitaminTracker', 'Tools');
  const {
    schedules, isLoading, addSchedule, updateSchedule, deleteSchedule,
    logIntake, undoIntake, isVitaminTakenToday, getIntakeLog
  } = useVitaminSchedules();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [newVitamin, setNewVitamin] = useState({ name: '', emoji: '💊', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6], notification: true });

  const handleAdd = async () => {
    if (!newVitamin.name.trim()) {
      toast.error(tr("vitamintracker_vitamin_adini_daxil_edin_3784af", "Vitamin ad\u0131n\u0131 daxil edin"));
      return;
    }
    try {
      await addSchedule.mutateAsync({
        vitamin_name: newVitamin.name,
        icon_emoji: newVitamin.emoji,
        scheduled_time: newVitamin.time + ':00',
        days_of_week: newVitamin.days,
        notification_enabled: newVitamin.notification
      });
      toast.success(tr("vitamintracker_vitamin_elave_edildi_b2e88b", "Vitamin \u0259lav\u0259 edildi"));
      setShowAddModal(false);
      setNewVitamin({ name: '', emoji: '💊', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6], notification: true });
    } catch {
      toast.error(tr("vitamintracker_xeta_bas_verdi_f22fba", "X\u0259ta ba\u015F verdi"));
    }
  };

  const handleToggleTaken = async (schedule: VitaminSchedule) => {
    await hapticFeedback.light();
    const taken = isVitaminTakenToday(schedule.id);
    if (taken) {
      const log = getIntakeLog(schedule.id);
      if (log) await undoIntake.mutateAsync(log.id);
    } else {
      await logIntake.mutateAsync(schedule);
      toast.success(`${getTranslatedVitaminName(schedule.vitamin_name)} ${tr("vitamintracker_taken_status", "qəbul edildi ✓")}`);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSchedule.mutateAsync(id);
    toast.success(tr("vitamintracker_vitamin_deleted", "Vitamin silindi"));
  };

  const handleToggleNotification = async (schedule: VitaminSchedule) => {
    await updateSchedule.mutateAsync({
      id: schedule.id,
      notification_enabled: !schedule.notification_enabled
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  const activeSchedules = schedules.filter((s) => s.is_active);
  const takenCount = activeSchedules.filter((s) => isVitaminTakenToday(s.id)).length;
  const totalCount = activeSchedules.length;
  const progress = totalCount > 0 ? takenCount / totalCount * 100 : 0;

  const toggleDay = (day: number) => {
    setNewVitamin((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day].sort()
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                {tr("vitamintracker_vitamin_izleyicisi_049643", "Vitamin İzləyicisi")}
              </h1>
            </div>
            <button onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-32">
        <MedicalDisclaimer variant="compact" />
        {/* Progress Card */}
        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/70 text-sm">{tr("vitamintracker_bugunku_qebul_ae152d", "Bugünkü qəbul")}</p>
              <p className="text-3xl font-bold">{takenCount}/{totalCount}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Pill className="w-8 h-8" />
            </div>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }} />
            
          </div>
          {totalCount > 0 && takenCount === totalCount &&
          <p className="text-sm text-white/80 mt-2 font-medium">{tr("vitamintracker_butun_vitaminler_qebul_edildi_87d9d1", "🎉 Bütün vitaminlər qəbul edildi!")}</p>
          }
        </motion.div>

        {/* Vitamin List */}
        {isLoading ?
        <div className="space-y-3">
            {[1, 2, 3].map((i) =>
          <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
          )}
          </div> :
        activeSchedules.length === 0 ?
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}>
          
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Pill className="w-10 h-10 text-primary/50" />
            </div>
            <p className="font-semibold text-foreground mb-1">{tr("vitamintracker_vitamin_elave_edin_3a46b1", "Vitamin əlavə edin")}</p>
            <p className="text-sm text-muted-foreground mb-4">{tr("vitamintracker_gundelik_vitamin_qebulunuzu_izleyin_f8d5c5", "Gündəlik vitamin qəbulunuzu izləyin")}</p>
            <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {tr("vitamintracker_vitamin_elave_et_287d28", "+ Vitamin \u0259lav\u0259 et")}
            
          </button>
          </motion.div> :

        <div className="space-y-2.5">
            {activeSchedules.map((schedule, idx) => {
            const taken = isVitaminTakenToday(schedule.id);
            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative bg-card border rounded-2xl p-4 transition-all ${taken ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/50'}`}>
                
                  <div className="flex items-center gap-3">
                    {/* Check button */}
                    <motion.button
                    onClick={() => handleToggleTaken(schedule)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    taken ?
                    'bg-emerald-500 shadow-lg shadow-emerald-500/30' :
                    'bg-muted/60 border-2 border-dashed border-muted-foreground/20'}`
                    }
                    whileTap={{ scale: 0.85 }}>
                    
                      {taken ?
                    <Check className="w-5 h-5 text-white" /> :

                    <span className="text-xl">{schedule.icon_emoji}</span>
                    }
                    </motion.button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${taken ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-foreground'}`}>
                        {getTranslatedVitaminName(schedule.vitamin_name)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatTime(schedule.scheduled_time)}</span>
                        {schedule.notification_enabled &&
                      <Bell className="w-3 h-3 text-primary/60" />
                      }
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                      onClick={() => handleToggleNotification(schedule)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60">
                      
                        {schedule.notification_enabled ?
                      <Bell className="w-4 h-4 text-primary" /> :

                      <BellOff className="w-4 h-4" />
                      }
                      </button>
                      <button
                      onClick={() => handleDelete(schedule.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>);
            })}
          </div>
        }
      </div>
      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal &&
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
            <motion.div
            className="relative w-full max-w-lg bg-card rounded-t-3xl flex flex-col max-h-[85vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
            
              <div className="p-5 pb-0 flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="text-lg font-bold text-foreground">{tr("vitamintracker_vitamin_elave_et_ba4a9c", "Vitamin Əlavə Et")}</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Presets */}
                <div>
                  <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                  
                    <span>{tr("vitamintracker_hazir_vitaminler_73ff90", "Hazır vitaminlər")}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showPresets &&
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    
                        <div className="flex flex-wrap gap-2 mb-3">
                          {dynamicPresets.map((preset) =>
                      <button
                        key={preset.name}
                        onClick={() => {
                          setNewVitamin((prev) => ({ ...prev, name: preset.name, emoji: preset.emoji }));
                          setShowPresets(false);
                        }}
                        className="px-3 py-1.5 rounded-full bg-muted/60 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors">
                        
                              {preset.emoji} {preset.name}
                            </button>
                      )}
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{tr("vitamintracker_vitamin_adi_15e0a6", "Vitamin adı")}</label>
                  <div className="flex gap-2">
                    <button
                    onClick={() => {
                      const emojis = ['💊', '🟢', '☀️', '🔴', '🦴', '🐟', '💜', '🍊', '💎', '⚡', '🌊', '🦠'];
                      const idx = emojis.indexOf(newVitamin.emoji);
                      setNewVitamin((prev) => ({ ...prev, emoji: emojis[(idx + 1) % emojis.length] }));
                    }}
                    className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center text-xl flex-shrink-0">
                    
                      {newVitamin.emoji}
                    </button>
                    <input
                    value={newVitamin.name}
                    onChange={(e) => setNewVitamin((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={tr("vitamintracker_mes_folat_d_vitamini_6e4ad1", "Məs: Folat, D vitamini...")}
                    className="flex-1 h-11 px-3 rounded-xl bg-muted/60 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" />
                  
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{tr("vitamintracker_qebul_saati_b569b1", "Qəbul saatı")}</label>
                  <input
                  type="time"
                  value={newVitamin.time}
                  onChange={(e) => setNewVitamin((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl bg-muted/60 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
                
                </div>

                {/* Days */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">{tr("vitamintracker_qebul_gunleri_5262ae", "Qəbul günləri")}</label>
                  <div className="flex gap-1.5">
                    {DAY_LABELS.map((label, idx) =>
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                    newVitamin.days.includes(idx) ?
                    'bg-primary text-primary-foreground' :
                    'bg-muted/60 text-muted-foreground'}`
                    }>
                    
                        {label}
                      </button>
                  )}
                  </div>
                </div>

                {/* Notification */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{tr("vitamintracker_xatirlatma_bildirisi_8da2b8", "Xatırlatma bildirişi")}</span>
                  </div>
                  <button
                  onClick={() => setNewVitamin((prev) => ({ ...prev, notification: !prev.notification }))}
                  className={`w-11 h-6 rounded-full transition-all ${newVitamin.notification ? 'bg-primary' : 'bg-muted'}`}>
                  
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${newVitamin.notification ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-2 ml-1">
                  {tr("vitamintracker_qebul_vaxtindan_5_deqiqe_evvel_023b26", "Q\u0259bul vaxt\u0131ndan 5 d\u0259qiq\u0259 \u0259vv\u0259l bildiri\u015F g\xF6nd\u0259ril\u0259c\u0259k")}
                </p>
              </div>

              {/* Submit */}
              <div className="p-5 pt-2 border-t border-border/50 pb-[calc(env(safe-area-inset-bottom,20px)+20px)] bg-card">
                <button
                onClick={handleAdd}
                disabled={addSchedule.isPending}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                
                  {addSchedule.isPending ? tr("vitamintracker_elave_edilir_3c28b4", "\u018Flav\u0259 edilir...") : tr("vitamintracker_vitamin_elave_et_ba4a9c", "Vitamin \u018Flav\u0259 Et")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default VitaminTracker;