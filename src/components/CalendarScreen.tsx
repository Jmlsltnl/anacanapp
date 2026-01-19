import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Plus,
  Droplets, Heart, Baby, Pill, Calendar as CalendarIcon
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface CalendarScreenProps {
  onBack: () => void;
}

interface DayEvent {
  type: 'period' | 'fertile' | 'ovulation' | 'appointment' | 'pill';
  label: string;
}

const CalendarScreen = ({ onBack }: CalendarScreenProps) => {
  const { lifeStage, getCycleData, getPregnancyData } = useUserStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDayEvents = (day: number): DayEvent[] => {
    if (!day) return [];
    
    const events: DayEvent[] = [];
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    if (lifeStage === 'flow' && cycleData) {
      // Check if this day is in period
      const dayOfCycle = Math.floor((checkDate.getTime() - new Date(cycleData.lastPeriodDate).getTime()) / (1000 * 60 * 60 * 24)) % cycleData.cycleLength;
      
      if (dayOfCycle >= 0 && dayOfCycle < cycleData.periodLength) {
        events.push({ type: 'period', label: 'Menstruasiya' });
      }
      
      // Check fertile window
      const ovulationDay = cycleData.cycleLength - 14;
      if (dayOfCycle >= ovulationDay - 5 && dayOfCycle <= ovulationDay + 1) {
        if (dayOfCycle === ovulationDay) {
          events.push({ type: 'ovulation', label: 'Ovulyasiya' });
        } else {
          events.push({ type: 'fertile', label: 'Fertil' });
        }
      }
    }

    if (lifeStage === 'bump' && pregData) {
      // Add due date
      if (pregData.dueDate) {
        const dueDate = new Date(pregData.dueDate);
        if (checkDate.toDateString() === dueDate.toDateString()) {
          events.push({ type: 'appointment', label: 'Doğuş tarixi' });
        }
      }
    }

    // Mock appointments
    if (day === 15) {
      events.push({ type: 'appointment', label: 'Həkim' });
    }
    if (day === 8 || day === 22) {
      events.push({ type: 'pill', label: 'Vitamin' });
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
      default: return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
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

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Təqvim</h1>
            <p className="text-white/80 text-sm">Dövrənizi izləyin</p>
          </div>
          <motion.button
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      <div className="px-5 -mt-3">
        {/* Calendar Card */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
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
            <h3 className="font-bold mb-3">
              {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
            </h3>
            {getDayEvents(selectedDate.getDate()).length > 0 ? (
              <div className="space-y-2">
                {getDayEvents(selectedDate.getDate()).map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                    <span className="text-sm font-medium">{event.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bu gün üçün hadisə yoxdur</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CalendarScreen;
