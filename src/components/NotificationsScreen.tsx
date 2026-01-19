import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Bell, Check, Trash2, Calendar, 
  Heart, Pill, Baby, MessageCircle, Gift
} from 'lucide-react';

interface NotificationsScreenProps {
  onBack: () => void;
}

interface Notification {
  id: string;
  type: 'reminder' | 'tip' | 'appointment' | 'partner' | 'achievement';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon: any;
  color: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Su içmək vaxtı! 💧',
    message: 'Bu gün hələ 4 stəkan su içmisiniz. Hədəf: 8 stəkan.',
    time: '10 dəq əvvəl',
    isRead: false,
    icon: Bell,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: '2',
    type: 'appointment',
    title: 'Həkim randevusu',
    message: 'Sabah saat 10:00-da USG müayinəsi.',
    time: '1 saat əvvəl',
    isRead: false,
    icon: Calendar,
    color: 'bg-violet-100 text-violet-600'
  },
  {
    id: '3',
    type: 'tip',
    title: 'Günün məsləhəti',
    message: 'Fol turşusu qəbul etməyi unutmayın!',
    time: '3 saat əvvəl',
    isRead: false,
    icon: Pill,
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: '4',
    type: 'partner',
    title: 'Partnyor mesajı ❤️',
    message: 'Əhməd sizə sevgi göndərdi!',
    time: '5 saat əvvəl',
    isRead: true,
    icon: Heart,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: '5',
    type: 'achievement',
    title: 'Yeni nailiyyət!',
    message: '7 gün ardıcıl log etdiniz! 🎉',
    time: 'Dünən',
    isRead: true,
    icon: Gift,
    color: 'bg-amber-100 text-amber-600'
  },
];

const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    activeFilter === 'all' || !n.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
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
            <h1 className="text-xl font-bold text-white">Bildirişlər</h1>
            <p className="text-white/80 text-sm">{unreadCount} oxunmamış</p>
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

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-primary'
                : 'bg-white/20 text-white'
            }`}
          >
            Hamısı
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'unread'
                ? 'bg-white text-primary'
                : 'bg-white/20 text-white'
            }`}
          >
            Oxunmamış ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 pt-4">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
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
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => {
                const Icon = notification.icon;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card rounded-2xl p-4 shadow-card border ${
                      notification.isRead ? 'border-border/50' : 'border-primary/30 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${notification.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold ${notification.isRead ? 'text-foreground' : 'text-primary'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        
                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {!notification.isRead && (
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
