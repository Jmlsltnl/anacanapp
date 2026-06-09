import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useCycleStats } from '@/hooks/useCycleHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PeriodDelayBanner = () => {
  const { lastPeriodDate, cycleLength } = useUserStore();
  const { user } = useAuth();
  const stats = useCycleStats();
  const navigate = useNavigate();

  if (!lastPeriodDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lpd = new Date(lastPeriodDate);
  lpd.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - lpd.getTime()) / (1000 * 60 * 60 * 24));
  const avgCycle = stats.averageCycleLength || cycleLength || 28;
  const delayDays = daysSince - avgCycle;

  // Throttled notification: only insert into notifications once per 24h
  useEffect(() => {
    if (delayDays < 3 || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('last_delay_notification_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const last = prefs?.last_delay_notification_at ? new Date(prefs.last_delay_notification_at) : null;
      const hoursAgo = last ? (Date.now() - last.getTime()) / 36e5 : Infinity;
      if (hoursAgo < 24) return;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Period gecikir',
        body: `Periodunuz təxmini tarixdən ${delayDays} gün gecikir. Hamiləlik testi etməyi və ya Dr. Anacan-dan soruşmağı düşünün.`,
        type: 'flow_delay',
        is_read: false,
      });
      await supabase
        .from('user_preferences')
        .update({ last_delay_notification_at: new Date().toISOString() })
        .eq('user_id', user.id);
    })();
    return () => { cancelled = true; };
  }, [delayDays, user?.id]);

  if (delayDays < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border border-rose-200 dark:border-rose-800"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-foreground text-sm mb-0.5">Periodunuz {delayDays} gün gecikir</h4>
          <p className="text-xs text-muted-foreground leading-snug mb-3">
            Orta tsikliniz {avgCycle} gündür. Stress, çəki dəyişikliyi, hormonal dalğalanma və ya hamiləlik səbəb ola bilər. Hamiləlik testi etməyi düşünün.
          </p>
          <button
            onClick={() => navigate(`/ai-chat?prompt=${encodeURIComponent(`Periodum ${delayDays} gün gecikib, nə edə bilərəm?`)}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Dr. Anacan-dan soruş
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PeriodDelayBanner;
