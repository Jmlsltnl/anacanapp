import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Plus,
  Droplets, Heart, Baby, Pill
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAppointments } from '@/hooks/useAppointments';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Input } from '@/components/ui/input';

interface CalendarScreenProps {
  onBack: () => void;
}

interface DayEvent {
  type: 'period' | 'fertile' | 'ovulation' | 'appointment' | 'pill' | 'mood';
  label: string;
}

const CalendarScreen = ({ onBack }: CalendarScreenProps) => {
  useScrollToTop();
  
  const { lifeStage, getCycleData, getPregnancyData } = useUserStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('appointment');

  const { appointments, addAppointment, deleteAppointment, getByDate } = useAppointments();
  const { logs } = useDailyLogs();
  const cycleData = getCycleData();
  const pregData = getPregnancyData();

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  const dayNames = ['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDayEvents = (day: number): DayEvent[] => {
    if (!day) return [];
    
    const events: DayEvent[] = [];
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    // Check for appointments from DB
    const dayAppointments = appointments.filter(apt => apt.event_date === checkDateStr);
    dayAppointments.forEach(apt => {
      events.push({ type: 'appointment', label: apt.title });
    });

    // Check for mood logs
    const dayLog = logs.find(l => l.log_date === checkDateStr);
    if (dayLog?.mood) {
      events.push({ type: 'mood', label: 'Əhval qeyd' });
    }

    if (lifeStage === 'flow' && cycleData) {
      const dayOfCycle = Math.floor((checkDate.getTime() - new Date(cycleData.lastPeriodDate).getTime()) / (1000 * 60 * 60 * 24)) % cycleData.cycleLength;
      
      if (dayOfCycle >= 0 && dayOfCycle < cycleData.periodLength) {
        events.push({ type: 'period', label: 'Menstruasiya' });
      }
      
      const ovulationDay = cycleData.cycleLength - 14;
      if (dayOfCycle >= ovulationDay - 5 && dayOfCycle <= ovulationDay + 1) {
        if (dayOfCycle === ovulationDay) {
          events.push({ type: 'ovulation', label: 'Ovulyasiya' });
        } else {
          events.push({ type: 'fertile', label: 'Fertil' });
        }
      }
    }

    if (lifeStage === 'bump' && pregData?.dueDate) {
      const dueDate = new Date(pregData.dueDate);
      if (checkDate.toDateString() === dueDate.toDateString()) {
        events.push({ type: 'appointment', label: 'Doğuş tarixi' });
      }
    }

    return events;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'period': return 'bg-rose-500';
      case 'fertile': return 'bg-emerald-500';
      case 'ovulation': return 'bg-amber-500';
      case 'appointment': return 'bg-violet-500';
      case 'pill': return 'bg-blue-500';
      case 'mood': return 'bg-fuchsia-500';
      default: return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const handleAddEvent = async () => {
    if (!newEventTitle || !selectedDate) return;

    await addAppointment({
      title: newEventTitle,
      event_date: selectedDate.toISOString().split('T')[0],
      event_type: newEventType,
    });

    setNewEventTitle('');
    setShowAddForm(false);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const selectedDateEvents = selectedDate ? getDayEvents(selectedDate.getDate()) : [];
  const selectedDateAppointments = selectedDate 
    ? appointments.filter(apt => apt.event_date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Təqvim</h1>
            <p className="text-white/80 text-xs">Dövrənizi və randevularınızı izləyin</p>
          </div>
          <motion.button
            onClick={() => {
              if (selectedDate) {
                setShowAddForm(true);
              }
            }}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      <div className="px-3 -mt-2">
        {/* Calendar Card */}
        <motion.div 
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={() => navigateMonth(-1)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="text-lg font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <motion.button
              onClick={() => navigateMonth(1)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const events = getDayEvents(day as number);
              const selected = selectedDate && day && 
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentDate.getMonth();

              return (
                <motion.button
                  key={index}
                  onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative ${
                    !day ? '' :
                    selected ? 'bg-primary text-white' :
                    isToday(day) ? 'bg-primary/20 text-primary font-bold' :
                    'hover:bg-muted'
                  }`}
                  whileTap={day ? { scale: 0.95 } : undefined}
                  disabled={!day}
                >
                  {day && (
                    <>
                      <span className={`text-sm ${isToday(day) && !selected ? 'font-bold' : ''}`}>
                        {day}
                      </span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {events.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                selected ? 'bg-white' : getEventColor(event.type)
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div 
          className="mt-4 bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold mb-3">İşarələr</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm text-muted-foreground">Menstruasiya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Fertil günlər</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Ovulyasiya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-sm text-muted-foreground">Randevu</span>
            </div>
          </div>
        </motion.div>

        {/* Selected Day Details */}
        {selectedDate && (
          <motion.div 
            className="mt-4 bg-card rounded-2xl p-4 shadow-card border border-border/50"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">
                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
              </h3>
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full flex items-center gap-1"
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                Əlavə et
              </motion.button>
            </div>
            {selectedDateEvents.length > 0 || selectedDateAppointments.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                    <span className="text-sm font-medium">{event.label}</span>
                  </div>
                ))}
                {selectedDateAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-violet-500" />
                      <span className="text-sm font-medium">{apt.title}</span>
                    </div>
                    <motion.button
                      onClick={() => deleteAppointment(apt.id)}
                      className="text-destructive text-xs"
                      whileTap={{ scale: 0.95 }}
                    >
                      Sil
                    </motion.button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bu gün üçün hadisə yoxdur</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddForm && selectedDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-4">
              {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} - Randevu əlavə et
            </h2>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">Başlıq</label>
              <Input
                placeholder="Həkim müayinəsi"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Növ</label>
              <div className="flex gap-2">
                {[
                  { id: 'appointment', label: 'Randevu', icon: '📅' },
                  { id: 'pill', label: 'Dərman', icon: '💊' },
                  { id: 'reminder', label: 'Xatırlatma', icon: '🔔' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setNewEventType(type.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      newEventType === type.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddEvent}
              disabled={!newEventTitle}
              className="w-full h-14 rounded-2xl gradient-primary text-white font-bold shadow-button disabled:opacity-50"
            >
              Yadda saxla
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendarScreen;
