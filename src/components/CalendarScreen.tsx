import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, X,
  Droplets, Heart, Sparkles, Calendar as CalendarIcon } from
'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAppointments } from '@/hooks/useAppointments';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { Input } from '@/components/ui/input';
import { getPhaseInfoForDate, getCycleDayForDate } from '@/lib/cycle-utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import { tr } from "@/lib/tr";

interface CalendarScreenProps {
  onBack: () => void;
}

interface DayEventType {
  type: 'period' | 'fertile' | 'ovulation' | 'appointment' | 'mood';
  label: string;
  color: string;
}

const CalendarScreen = ({ onBack }: CalendarScreenProps) => {
  useScrollToTop();
  useScreenAnalytics('Calendar', 'Calendar');

  const { lifeStage, getCycleData, getPregnancyData, cycleLength, periodLength } = useUserStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('appointment');

  const { appointments, addAppointment, deleteAppointment } = useAppointments();
  const { logs } = useDailyLogs();
  const cycleData = getCycleData();
  const pregData = getPregnancyData();

  // Get last period date
  const lastPeriodDate = cycleData?.lastPeriodDate ?
  new Date(cycleData.lastPeriodDate) :
  new Date();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding for start of week
    const firstDayOfWeek = start.getDay();
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    return { days, paddingDays };
  }, [currentMonth]);

  // Get events for a specific day
  const getDayEvents = (day: Date): DayEventType[] => {
    const events: DayEventType[] = [];
    const dateStr = format(day, 'yyyy-MM-dd');

    // Check for appointments
    const dayAppointments = appointments.filter((apt) => apt.event_date === dateStr);
    dayAppointments.forEach((apt) => {
      events.push({ type: 'appointment', label: apt.title, color: 'bg-violet-500' });
    });

    // Check for mood logs
    const dayLog = logs.find((l) => l.log_date === dateStr);
    if (dayLog?.mood) {
      events.push({ type: 'mood', label: tr("calendarscreen_ehval_qeyd_aa4f19", 'Əhval qeyd'), color: 'bg-fuchsia-500' });
    }

    // Cycle-based events for flow stage
    if (lifeStage === 'flow' && cycleData) {
      const phaseInfo = getPhaseInfoForDate(day, lastPeriodDate, cycleLength, periodLength);

      if (phaseInfo.isPeriodDay) {
        events.push({ type: 'period', label: 'Menstruasiya', color: 'bg-rose-500' });
      }

      if (phaseInfo.isOvulationDay) {
        events.push({ type: 'ovulation', label: 'Ovulyasiya', color: 'bg-amber-500' });
      } else if (phaseInfo.isFertileDay && !phaseInfo.isPeriodDay) {
        events.push({ type: 'fertile', label: tr("calendarscreen_fertil_gun_653ae1", 'Fertil gün'), color: 'bg-emerald-500' });
      }
    }

    // Pregnancy due date
    if (lifeStage === 'bump' && pregData?.dueDate) {
      const dueDate = new Date(pregData.dueDate);
      if (isSameDay(day, dueDate)) {
        events.push({ type: 'appointment', label: tr("calendarscreen_dogus_tarixi_e2caea", 'Doğuş tarixi'), color: 'bg-violet-500' });
      }
    }

    return events;
  };

  // Get day styling based on cycle phase
  const getDayStyle = (day: Date) => {
    if (lifeStage !== 'flow' || !cycleData) {
      return { bg: '', text: '', ring: '' };
    }

    const phaseInfo = getPhaseInfoForDate(day, lastPeriodDate, cycleLength, periodLength);

    if (phaseInfo.isPeriodDay) {
      return {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        text: 'text-rose-700 dark:text-rose-300',
        ring: 'ring-rose-300'
      };
    }

    if (phaseInfo.isOvulationDay) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        ring: 'ring-amber-300'
      };
    }

    if (phaseInfo.isFertileDay) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        ring: 'ring-emerald-300'
      };
    }

    return { bg: '', text: 'text-foreground', ring: '' };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleAddEvent = async () => {
    if (!newEventTitle || !selectedDate) return;

    await addAppointment({
      title: newEventTitle,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      event_type: newEventType
    });

    setNewEventTitle('');
    setShowAddForm(false);
  };

  const today = new Date();

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedDateEvents = selectedDate ? getDayEvents(selectedDate) : [];
  const selectedDateAppointments = appointments.filter((apt) => apt.event_date === selectedDateStr);

  // Current cycle day info for header
  const currentCycleDay = lifeStage === 'flow' && cycleData ?
  getCycleDayForDate(today, lastPeriodDate, cycleLength) :
  null;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header */}
      <div className="gradient-primary px-4 pb-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}>
            
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{tr("calendarscreen_teqvim_584bdd", "Təqvim")}</h1>
            {lifeStage === 'flow' && currentCycleDay &&
            <p className="text-white/80 text-sm">
                {tr("calendarscreen_tsikl_gunu_51cdf3", "Tsikl g\xFCn\xFC:")} {currentCycleDay} / {cycleLength}
              </p>
            }
          </div>
          {selectedDate &&
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}>
            
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          }
        </div>

        {/* Cycle Stats for Flow */}
        {lifeStage === 'flow' &&
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <Droplets className="w-4 h-4 text-white mx-auto mb-1" />
              <p className="text-white text-sm font-bold">{periodLength}</p>
              <p className="text-white/70 text-[10px]">{tr("calendarscreen_gun_period_957849", "gün period")}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <CalendarIcon className="w-4 h-4 text-white mx-auto mb-1" />
              <p className="text-white text-sm font-bold">{cycleLength}</p>
              <p className="text-white/70 text-[10px]">{tr("calendarscreen_gun_tsikl_bb0ab6", "gün tsikl")}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-2.5 text-center">
              <Sparkles className="w-4 h-4 text-white mx-auto mb-1" />
              <p className="text-white text-sm font-bold">{cycleLength - 14}</p>
              <p className="text-white/70 text-[10px]">{tr("calendarscreen_ovulyasiya_gunu_e20a0b", "ovulyasiya günü")}</p>
            </div>
          </div>
        }
      </div>

      <div className="px-4 -mt-3">
        {/* Calendar Card */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="text-lg font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: getCurrentDateLocale() })}
            </h2>
            <motion.button
              onClick={() => navigateMonth('next')}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['B.e.', tr("calendarscreen_c_a_5c29b2", "\xC7.a."), tr("calendarscreen_c_399abb", "\xC7."), 'C.a.', 'C.', tr("calendarscreen_s_f3ddc2", "\u015E."), 'B.'].map((day) =>
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for start padding */}
            {Array.from({ length: calendarDays.paddingDays }).map((_, i) =>
            <div key={`pad-${i}`} className="aspect-square" />
            )}
            
            {calendarDays.days.map((day) => {
              const events = getDayEvents(day);
              const dayStyle = getDayStyle(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <motion.button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isSelected ?
                  'bg-primary text-white ring-2 ring-primary ring-offset-2' :
                  isToday ?
                  `${dayStyle.bg || 'bg-primary/10'} ring-2 ring-primary/50 ${dayStyle.text || 'text-primary'} font-bold` :
                  `${dayStyle.bg} ${dayStyle.text} hover:bg-muted`}`
                  }
                  whileTap={{ scale: 0.95 }}>
                  
                  <span className={`text-sm ${isToday && !isSelected ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Event indicators */}
                  {events.length > 0 &&
                  <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map((event, i) =>
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : event.color}`
                      } />

                    )}
                    </div>
                  }
                </motion.button>);

            })}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="mt-4 bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}>
          
          <h3 className="font-bold mb-3 text-sm">{tr("calendarscreen_isareler_c13095", "İşarələr")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-muted-foreground">{tr("untranslated_menstruasiya_6pect0", "Menstruasiya")}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">{tr("calendarscreen_fertil_gunler_65de2c", "Fertil günlər")}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">{tr("untranslated_ovulyasiya_h9aw8t", "Ovulyasiya")}</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-xs text-muted-foreground">{tr("untranslated_randevu_xc37do", "Randevu")}</span>
            </div>
          </div>
        </motion.div>

        {/* Selected Day Details */}
        <AnimatePresence>
          {selectedDate &&
          <motion.div
            className="mt-4 bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}>
            
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold">
                    {format(selectedDate, 'd MMMM, EEEE', { locale: getCurrentDateLocale() })}
                  </h3>
                  {lifeStage === 'flow' && cycleData &&
                <p className="text-xs text-muted-foreground">
                      {tr("calendarscreen_tsikl_gunu_51cdf3", "Tsikl g\xFCn\xFC:")} {getCycleDayForDate(selectedDate, lastPeriodDate, cycleLength)}
                    </p>
                }
                </div>
                <motion.button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center gap-1"
                whileTap={{ scale: 0.95 }}>
                
                  <Plus className="w-4 h-4" />
                  {tr("calendarscreen_elave_et_6e1b9b", "\u018Flav\u0259 et")}
                </motion.button>
              </div>
              
              {selectedDateEvents.length > 0 || selectedDateAppointments.length > 0 ?
            <div className="space-y-2">
                  {selectedDateEvents.map((event, i) =>
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className={`w-3 h-3 rounded-full ${event.color}`} />
                      <span className="text-sm font-medium">{event.label}</span>
                    </div>
              )}
                  {selectedDateAppointments.map((apt) =>
              <div key={apt.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-violet-500" />
                        <span className="text-sm font-medium">{apt.title}</span>
                      </div>
                      <motion.button
                  onClick={() => deleteAppointment(apt.id)}
                  className="text-destructive text-xs px-2 py-1 bg-destructive/10 rounded-lg"
                  whileTap={{ scale: 0.95 }}>{tr("untranslated_sil_zwa7lz", "Sil")}</motion.button>
                    </div>
              )}
                </div> :

            <div className="text-center py-6">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{tr("calendarscreen_bu_gun_ucun_hadise_yoxdur_a394c8", "Bu gün üçün hadisə yoxdur")}</p>
                </div>
            }
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddForm && selectedDate &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddForm(false)}>
          
            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-card rounded-t-3xl p-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 24px)' }}>
            
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <h2 className="text-lg font-bold text-foreground">
                  {tr("calendarscreen_randevu_elave_et_2cfa5a", "Randevu \u0259lav\u0259 et")}
                </h2>
                <motion.button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.95 }}>
                
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {format(selectedDate, 'd MMMM yyyy', { locale: getCurrentDateLocale() })}
              </p>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">{tr("calendarscreen_basliq_e1f6c5", "Başlıq")}</label>
                <Input
                placeholder={tr("calendarscreen_hekim_muayinesi_78c373", "Həkim müayinəsi")}
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="h-12 rounded-xl" />
              
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">{tr("calendarscreen_nov_98ad7c", "Növ")}</label>
                <div className="flex gap-2">
                  {[
                { id: 'appointment', label: 'Randevu', icon: '📅' },
                { id: 'pill', label: tr("calendarscreen_derman_8b4b27", 'Dərman'), icon: '💊' },
                { id: 'reminder', label: tr("calendarscreen_xatirlatma_3f3c48", 'Xatırlatma'), icon: '🔔' }].
                map((type) =>
                <button
                  key={type.id}
                  onClick={() => setNewEventType(type.id)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  newEventType === type.id ?
                  'bg-primary text-white' :
                  'bg-muted text-muted-foreground'}`
                  }>
                  
                      {type.icon} {type.label}
                    </button>
                )}
                </div>
              </div>

              <button
              onClick={handleAddEvent}
              disabled={!newEventTitle}
              className="w-full h-14 rounded-2xl gradient-primary text-white font-bold shadow-button disabled:opacity-50">{tr("untranslated_yadda_saxla_bpdu9v", "Yadda saxla")}</button>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default CalendarScreen;