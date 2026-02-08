import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronRight, Clock, Check, X } from 'lucide-react';
import { useFlowReminders, useToggleReminder, REMINDER_TYPE_INFO, ReminderType } from '@/hooks/useFlowReminders';
import { Switch } from '@/components/ui/switch';

const FlowRemindersCard = () => {
  const { data: reminders = [], isLoading } = useFlowReminders();
  const toggleReminder = useToggleReminder();
  const [showAll, setShowAll] = useState(false);

  const handleToggle = async (id: string, currentValue: boolean) => {
    await toggleReminder.mutateAsync({ id, is_enabled: !currentValue });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const displayedReminders = showAll ? reminders : reminders.slice(0, 3);
  const enabledCount = reminders.filter(r => r.is_enabled).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Xatırlatmalar
        </h3>
        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
          {enabledCount} aktiv
        </span>
      </div>

      {reminders.length > 0 ? (
        <div className="space-y-2">
          {displayedReminders.map((reminder) => {
            const info = REMINDER_TYPE_INFO[reminder.reminder_type as ReminderType];
            return (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  reminder.is_enabled
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info?.emoji || '🔔'}</span>
                  <div>
                    <p className={`text-sm font-medium ${reminder.is_enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {reminder.title || info?.labelAz || info?.label}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{reminder.time_of_day?.slice(0, 5) || '09:00'}</span>
                      {reminder.days_before > 0 && (
                        <span>• {reminder.days_before} gün əvvəl</span>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={reminder.is_enabled}
                  onCheckedChange={() => handleToggle(reminder.id, reminder.is_enabled)}
                  disabled={toggleReminder.isPending}
                />
              </div>
            );
          })}

          {reminders.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
            >
              {showAll ? 'Daha az göstər' : `Hamısını göstər (${reminders.length})`}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Heç bir xatırlatma yoxdur
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tənzimləmələrdən xatırlatmalar əlavə edin
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default FlowRemindersCard;
