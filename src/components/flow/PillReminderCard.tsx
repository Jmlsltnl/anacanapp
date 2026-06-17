import { tr } from "@/lib/tr";import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFlowReminders, useSaveFlowReminder, useToggleReminder } from '@/hooks/useFlowReminders';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const PILL_NOTIFICATION_ID = 91201;

const PillReminderCard = () => {
  const { data: reminders = [] } = useFlowReminders();
  const save = useSaveFlowReminder();
  const toggle = useToggleReminder();
  const pill = reminders.find((r) => r.reminder_type === 'pill');

  const [time, setTime] = useState(pill?.time_of_day?.slice(0, 5) || '09:00');
  const [title, setTitle] = useState(pill?.title || tr("pillremindercard_hebinizi_qebul_edin_03c5be", "H\u0259binizi q\u0259bul edin"));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (pill) {
      setTime(pill.time_of_day?.slice(0, 5) || '09:00');
      setTitle(pill.title || tr("pillremindercard_hebinizi_qebul_edin_03c5be", "H\u0259binizi q\u0259bul edin"));
    }
  }, [pill?.id]);

  const scheduleNative = async (enabled: boolean, t: string, ttl: string) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: PILL_NOTIFICATION_ID }] });
      if (!enabled) return;
      const [h, m] = t.split(':').map(Number);
      const now = new Date();
      const at = new Date();
      at.setHours(h, m, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);
      await LocalNotifications.schedule({
        notifications: [{
          id: PILL_NOTIFICATION_ID,
          title: ttl || tr("pillremindercard_hebinizi_qebul_edin_03c5be", "H\u0259binizi q\u0259bul edin"),
          body: tr("pillremindercard_gundelik_hebinizi_qebul_etmek__064f3f", "\uD83D\uDC8A G\xFCnd\u0259lik h\u0259binizi q\u0259bul etm\u0259k vaxt\u0131d\u0131r"),
          schedule: { at, repeats: true, every: 'day' }
        }]
      });
    } catch (e) {
      console.warn('Pill reminder schedule failed', e);
    }
  };

  const handleSave = async () => {
    const isEnabled = pill?.is_enabled ?? true;
    await save.mutateAsync({
      reminder_type: 'pill',
      time_of_day: `${time}:00`,
      days_before: 0,
      is_enabled: isEnabled,
      title,
      message: tr("pillremindercard_gundelik_hebinizi_qebul_edin_ea7547", "\uD83D\uDC8A G\xFCnd\u0259lik h\u0259binizi q\u0259bul edin")
    });
    await scheduleNative(isEnabled, time, title);
    toast.success(tr("pillremindercard_heb_xatirlatmasi_yadda_saxlani_27cacb", "H\u0259b xat\u0131rlatmas\u0131 yadda saxlan\u0131ld\u0131"));
    setEditing(false);
  };

  const handleToggle = async () => {
    if (!pill) {
      await save.mutateAsync({
        reminder_type: 'pill',
        time_of_day: `${time}:00`,
        days_before: 0,
        is_enabled: true,
        title,
        message: tr("pillremindercard_gundelik_hebinizi_qebul_edin_ea7547", "\uD83D\uDC8A G\xFCnd\u0259lik h\u0259binizi q\u0259bul edin")
      });
      await scheduleNative(true, time, title);
    } else {
      await toggle.mutateAsync({ id: pill.id, is_enabled: !pill.is_enabled });
      await scheduleNative(!pill.is_enabled, time, title);
    }
  };

  const enabled = pill?.is_enabled ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border">
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Pill className="w-5 h-5 text-amber-500" />
          {tr("pillremindercard_heb_xatirlatmasi_e3e934", "H\u0259b Xat\u0131rlatmas\u0131")}
        </h3>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={save.isPending || toggle.isPending} />
      </div>

      {enabled &&
      <div className="space-y-3">
          {editing ?
        <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{tr("pillremindercard_basliq_e1f6c5", "Ba\u015Fl\u0131q")}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{tr("untranslated_vaxt_8etncj", "Vaxt")}</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={save.isPending} className="flex-1">{tr("untranslated_yadda_saxla_bpdu9v", "Yadda saxla")}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>{tr("pillremindercard_legv_et_b5e49c", "L\u0259\u011Fv et")}</Button>
              </div>
            </> :

        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left">
          
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  {tr("pillremindercard_her_gun_f4fe36", "H\u0259r g\xFCn")} {time}
                </div>
              </div>
              <span className="text-xs text-primary font-medium">{tr("pillremindercard_redakte_d53ba7", "Redakt\u0259")}</span>
            </button>
        }
        </div>
      }

      {!enabled &&
      <p className="text-xs text-muted-foreground">{tr("pillremindercard_gundelik_kontrasepsiya_ve_ya_d_8f8e44", "G\xFCnd\u0259lik kontrasepsiya v\u0259 ya d\u0259rman xat\u0131rlatmas\u0131 \xFC\xE7\xFCn aktiv edin.")}</p>
      }
    </motion.div>);

};

export default PillReminderCard;