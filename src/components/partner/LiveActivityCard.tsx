import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, Droplets, Smile, Zap, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface LiveEvent {
  id: string;
  type: 'kick' | 'water' | 'mood';
  message: string;
  emoji: string;
  timestamp: Date;
  value?: number;
}

const LiveActivityCard = () => {
  const { profile } = useAuth();
  const { partnerProfile } = usePartnerData();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [latestEvent, setLatestEvent] = useState<LiveEvent | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!partnerProfile?.user_id) return;

    const channel = supabase
      .channel('partner-live-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kick_sessions',
          filter: `user_id=eq.${partnerProfile.user_id}`,
        },
        (payload) => {
          const newEvent: LiveEvent = {
            id: payload.new.id,
            type: 'kick',
            message: `${payload.new.kick_count || 1} təpik qeyd olundu!`,
            emoji: '👶',
            timestamp: new Date(),
            value: payload.new.kick_count,
          };
          addEvent(newEvent);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
          filter: `user_id=eq.${partnerProfile.user_id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const oldWater = (payload.old as any)?.water_intake || 0;
            const newWater = payload.new.water_intake || 0;
            const oldMood = (payload.old as any)?.mood;
            const newMood = payload.new.mood;
            
            // Water update
            if (newWater > oldWater) {
              const diff = newWater - oldWater;
              const waterEvent: LiveEvent = {
                id: `water-${Date.now()}`,
                type: 'water',
                message: newWater >= 2000 
                  ? `Hədəfə çatdı! 🎉 ${newWater}ml içdi!` 
                  : `+${diff}ml su içdi (${newWater}ml)`,
                emoji: newWater >= 2000 ? '🏆' : '💧',
                timestamp: new Date(),
                value: newWater,
              };
              addEvent(waterEvent);
            }
            
            // Mood update
            if (newMood && newMood !== oldMood) {
              const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];
              const moodTexts = ['Çox pis', 'Pis', 'Normal', 'Yaxşı', 'Əla'];
              const moodEvent: LiveEvent = {
                id: `mood-${Date.now()}`,
                type: 'mood',
                message: newMood <= 2 
                  ? `Əhvalı ${moodTexts[newMood - 1]} - dəstəyə ehtiyacı ola bilər` 
                  : `Əhvalı: ${moodTexts[newMood - 1]}`,
                emoji: moodEmojis[newMood - 1],
                timestamp: new Date(),
                value: newMood,
              };
              addEvent(moodEvent);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerProfile?.user_id]);

  const addEvent = (event: LiveEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 10));
    setLatestEvent(event);
    setShowNotification(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'kick': return Baby;
      case 'water': return Droplets;
      case 'mood': return Smile;
      default: return Bell;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'kick': return 'from-pink-500 to-rose-600';
      case 'water': return 'from-cyan-500 to-blue-600';
      case 'mood': return 'from-amber-500 to-orange-600';
      default: return 'from-partner to-indigo-600';
    }
  };

  return (
    <>
      {/* Floating notification */}
      <AnimatePresence>
        {showNotification && latestEvent && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-20 left-1/2 z-50 bg-gradient-to-r ${getEventColor(latestEvent.type)} rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3`}
          >
            <motion.span 
              className="text-2xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              {latestEvent.emoji}
            </motion.span>
            <div>
              <p className="text-white font-bold text-sm">{latestEvent.message}</p>
              <p className="text-white/70 text-xs">İndicə</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Feed */}
      {events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-lg border border-border/50"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-partner to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold">Canlı Aktivlik</h3>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((event, idx) => {
              const Icon = getEventIcon(event.type);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getEventColor(event.type)} flex items-center justify-center`}>
                    <span className="text-lg">{event.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: az })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default LiveActivityCard;
