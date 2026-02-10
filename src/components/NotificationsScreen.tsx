import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Bell, Check, Trash2, Calendar, 
  Heart, Pill, Gift
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface NotificationsScreenProps {
  onBack: () => void;
}

const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
  useScrollToTop();
  
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return { icon: Bell, color: 'bg-blue-100 text-blue-600' };
      case 'appointment': return { icon: Calendar, color: 'bg-violet-100 text-violet-600' };
      case 'tip': return { icon: Pill, color: 'bg-emerald-100 text-emerald-600' };
      case 'partner': return { icon: Heart, color: 'bg-pink-100 text-pink-600' };
      case 'achievement': return { icon: Gift, color: 'bg-amber-100 text-amber-600' };
      default: return { icon: Bell, color: 'bg-gray-100 text-gray-600' };
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
    if (diffMins < 60) return `${diffMins} dəq əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    if (diffDays === 1) return 'Dünən';
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-3 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Bildirişlər</h1>
            <p className="text-white/80 text-xs">{unreadCount} oxunmamış</p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Hamısını oxu
            </motion.button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-3 pt-3">
        <AnimatePresence>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Bildiriş yoxdur</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => {
                const { icon: Icon, color } = getNotificationIcon(notification.notification_type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card rounded-2xl p-4 shadow-card border ${
                      notification.is_read ? 'border-border/50' : 'border-primary/30 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold ${notification.is_read ? 'text-foreground' : 'text-primary'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        
                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {!notification.is_read && (
                            <motion.button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
                              whileTap={{ scale: 0.95 }}
                            >
                              <Check className="w-3 h-3" />
                              Oxundu
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Sil
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsScreen;
