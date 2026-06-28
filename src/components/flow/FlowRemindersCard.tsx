import { tr } from "@/lib/tr";import { useState } from 'react';
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
      </div>);

  }

  const displayedReminders = showAll ? reminders : reminders.slice(0, 3);
  const enabledCount = reminders.filter((r) => r.is_enabled).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          {tr("flowreminderscard_xatirlatmalar_ddd8e7", "Xat\u0131rlatmalar")}
        </h3>
        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
          {enabledCount} {tr("flowreminderscard_aktiv_d7a82c", "aktiv")}
        </span>
      </div>

      {reminders.length > 0 ?
      <div className="space-y-2">
          {displayedReminders.map((reminder) => {
          const info = REMINDER_TYPE_INFO[reminder.reminder_type as ReminderType];
          return (
            <div
              key={reminder.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
              reminder.is_enabled ?
              'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
              'bg-muted/50 border border-transparent'}`
              }>
              
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info?.emoji || '🔔'}</span>
                  <div>
                    <p className={`text-sm font-medium ${reminder.is_enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {reminder.reminder_type !== 'custom' 
                        ? tr(`useflowreminders_title_${reminder.reminder_type}`, reminder.title || info?.labelAz || info?.label || '') 
                        : reminder.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{reminder.time_of_day?.slice(0, 5) || '09:00'}</span>
                      {reminder.days_before > 0 &&
                    <span>• {tr("flow_days_before", "{days} gün əvvəl").replace("{days}", String(reminder.days_before))}</span>
                    }
                    </div>
                  </div>
                </div>
                <Switch
                checked={reminder.is_enabled}
                onCheckedChange={() => handleToggle(reminder.id, reminder.is_enabled)}
                disabled={toggleReminder.isPending} />
              
              </div>);

        })}

          {reminders.length > 3 &&
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1">
          
              {showAll ? tr("flowreminderscard_daha_az_goster_47a81d", "Daha az g\xF6st\u0259r") : tr("flowreminderscard_hamisini_goster_f123bc", "Hamısını göstər ({count})").replace("{count}", String(reminders.length))}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
        }
        </div> :

      <div className="text-center py-6">
          <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {tr("flowreminderscard_hec_bir_xatirlatma_yoxdur_dc234b", "He\xE7 bir xat\u0131rlatma yoxdur")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tr("flowreminderscard_tenzimlemelerden_xatirlatmalar_389fd8", "T\u0259nziml\u0259m\u0259l\u0259rd\u0259n xat\u0131rlatmalar \u0259lav\u0259 edin")}
          </p>
        </div>
      }
    </motion.div>);

};

export default FlowRemindersCard;