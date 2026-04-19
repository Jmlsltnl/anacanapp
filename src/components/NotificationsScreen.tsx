import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Check, Trash2, Calendar, Heart, Pill, Gift, MessageCircle, Reply, Megaphone } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { useTranslation } from "@/hooks/useTranslation";

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigateToCommunity?: () => void;
}

type FilterType = 'all' | 'community' | 'system';

const NotificationsScreen = ({ onBack, onNavigateToCommunity }: NotificationsScreenProps) => {
  const { t } = useTranslation();
  useScrollToTop();
  useScreenAnalytics('Notifications', 'Notifications');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const communityTypes = ['community_like', 'community_comment', 'community_reply'];

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'community') return communityTypes.includes(n.notification_type);
    if (filter === 'system') return !communityTypes.includes(n.notification_type);
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'community_like': return { icon: Heart, color: 'bg-rose-500/10 text-rose-500' };
      case 'community_comment': return { icon: MessageCircle, color: 'bg-blue-500/10 text-blue-500' };
      case 'community_reply': return { icon: Reply, color: 'bg-violet-500/10 text-violet-500' };
      case 'reminder': return { icon: Bell, color: 'bg-blue-500/10 text-blue-500' };
      case 'appointment': return { icon: Calendar, color: 'bg-violet-500/10 text-violet-500' };
      case 'tip': return { icon: Pill, color: 'bg-emerald-500/10 text-emerald-500' };
      case 'partner': return { icon: Heart, color: 'bg-pink-500/10 text-pink-500' };
      case 'achievement': return { icon: Gift, color: 'bg-amber-500/10 text-amber-500' };
      case 'push': case 'scheduled': return { icon: Megaphone, color: 'bg-primary/10 text-primary' };
      default: return { icon: Bell, color: 'bg-muted text-muted-foreground' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'İndicə';
    if (diffMins < 60) return `${diffMins} dəq`;
    if (diffHours < 24) return `${diffHours} saat`;
    if (diffDays === 1) return 'Dünən';
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (communityTypes.includes(notification.notification_type) && onNavigateToCommunity) {
      onNavigateToCommunity();
    }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: t("notificationsscreen_hamisi_c73c4d", 'Hamısı') },
    { id: 'community', label: t("notificationsscreen_cemiyyet_2dc44d", 'Cəmiyyət') },
    { id: 'system', label: 'Sistem' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-3xl border-b border-border/10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-[18px] font-black text-foreground">Bildirişlər</h1>
              {unreadCount > 0 && <p className="text-[10px] text-muted-foreground/50 font-medium">{unreadCount} oxunmamış</p>}
            </div>
            {unreadCount > 0 && (
              <motion.button onClick={markAllAsRead} className="px-3 py-1.5 rounded-full bg-primary/8 text-primary text-[10px] font-bold" whileTap={{ scale: 0.95 }}>
                <Check className="w-3 h-3 inline mr-1" />Hamısını oxu
              </motion.button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-3">
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`relative px-3.5 py-1.5 text-[11px] font-bold transition-colors ${filter === f.id ? 'text-foreground' : 'text-muted-foreground/35'}`}>
                {f.label}
                {filter === f.id && (
                  <motion.div layoutId="notif-filter" className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-3">
        {loading ? (
          <div className="text-center py-16"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/15 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-muted-foreground/20" />
            </div>
            <p className="text-[13px] font-bold text-muted-foreground/35">Bildiriş yoxdur</p>
            <p className="text-[11px] text-muted-foreground/25 mt-1">Yeni bildirişlər burada görünəcək</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification, index) => {
              const { icon: Icon, color } = getNotificationIcon(notification.notification_type);
              const isCommunity = communityTypes.includes(notification.notification_type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-card rounded-2xl p-3.5 border transition-all ${
                    notification.is_read ? 'border-border/8' : 'border-primary/15 bg-primary/3'
                  } ${isCommunity ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-[12px] font-bold ${notification.is_read ? 'text-foreground' : 'text-primary'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap font-medium">{formatTime(notification.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">{notification.message}</p>
                      {isCommunity && (
                        <p className="text-[9px] text-primary/50 font-bold mt-1.5">Görmək üçün toxun →</p>
                      )}
                    </div>
                  </div>
                  {/* Swipe actions alternative: button row */}
                  <div className="flex gap-1.5 mt-2.5 ml-13 justify-end">
                    {!notification.is_read && (
                      <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                        className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[9px] font-bold">
                        Oxundu
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                      className="px-2.5 py-1 rounded-full bg-destructive/8 text-destructive text-[9px] font-bold">
                      <Trash2 className="w-2.5 h-2.5 inline mr-0.5" />Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
