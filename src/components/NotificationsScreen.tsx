import { useState } from 'react';
import { motion } from 'framer-motion';
import { getLocaleTag } from '@/lib/i18n';
import { ArrowLeft, Bell, Check, Trash2, Calendar, Heart, Pill, Gift, MessageCircle, Reply, Megaphone } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";
import { useUserStore } from '@/store/userStore';

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigateToCommunity?: () => void;
}

type FilterType = 'all' | 'community' | 'system';

const NotificationsScreen = ({ onBack, onNavigateToCommunity }: NotificationsScreenProps) => {
  useScrollToTop();
  useScreenAnalytics('Notifications', 'Notifications');
  const [filter, setFilter] = useState<FilterType>('all');

  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const communityTypes = ['community_like', 'community_comment', 'community_reply'];

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'community') return communityTypes.includes(n.notification_type);
    if (filter === 'system') return !communityTypes.includes(n.notification_type);
    return true;
  });

  // Palitra: tint fon + sabit ink (dizayn sistemi konvensiyasÄ±)
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'community_like':return { icon: Heart, bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)' };
      case 'community_comment':return { icon: MessageCircle, bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)' };
      case 'community_reply':return { icon: Reply, bg: 'var(--a-lav-1)', ink: 'var(--a-lav-ink)' };
      case 'reminder':return { icon: Bell, bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)' };
      case 'appointment':return { icon: Calendar, bg: 'var(--a-lav-1)', ink: 'var(--a-lav-ink)' };
      case 'tip':return { icon: Pill, bg: 'var(--a-green-1)', ink: 'var(--a-green-ink)' };
      case 'partner':return { icon: Heart, bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)' };
      case 'achievement':return { icon: Gift, bg: 'var(--a-yellow-1)', ink: 'var(--a-yellow-ink)' };
      case 'push':case 'scheduled':return { icon: Megaphone, bg: 'var(--a-peach-1)', ink: 'var(--a-accent-ink)' };
      default:return { icon: Bell, bg: 'var(--a-surface-soft)', ink: 'var(--a-ink-soft)' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return tr("notificationsscreen_i_ndice_3c9745", "\u0130ndic\u0259");
    if (diffMins < 60) return `${diffMins} ${tr("notificationsscreen_mins", "dÉ™q")}`;
    if (diffHours < 24) return `${diffHours} ${tr("notificationsscreen_hours", "saat")}`;
    if (diffDays === 1) return tr("notificationsscreen_dunen_52b701", "D\xFCn\u0259n");
    const { language } = useUserStore.getState();
    return date.toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (communityTypes.includes(notification.notification_type) && onNavigateToCommunity) {
      onNavigateToCommunity();
    }
  };

  const filters: {id: FilterType;label: string;}[] = [
  { id: 'all', label: tr("notificationsscreen_hamisi_c73c4d", 'HamÄ±sÄ±') },
  { id: 'community', label: tr("notificationsscreen_cemiyyet_2dc44d", 'CÉ™miyyÉ™t') },
  { id: 'system', label: tr("notificationsscreen_filter_system", "Sistem") }];


  return (
    <div className="a-scope safe-top h-[100dvh] overflow-y-auto overflow-x-hidden pb-24" style={{ background: 'var(--a-bg)' }} data-scroll-container>
      <div className="a-shell">
        {/* Top bar */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.9 }} aria-label={tr("common_geri", "Geri")}>
              <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
            </motion.button>
            <div style={{ minWidth: 0 }}>
              {unreadCount > 0 && <p className="a-eyebrow">{unreadCount} {tr("notificationsscreen_oxunmamis_8bfc41", "oxunmam\u0131\u015F")}</p>}
              <p className="a-wordmark" style={{ fontSize: 16 }}>{tr("notificationsscreen_bildirisler_54eb88", "BildiriÅŸlÉ™r")}</p>
            </div>
          </div>
          {unreadCount > 0 &&
          <div className="a-topbar-actions">
              <motion.button onClick={markAllAsRead} className="a-btn-soft" whileTap={{ scale: 0.95 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <Check size={12} strokeWidth={2.5} />{tr("notificationsscreen_hamisini_oxu_29ceea", "Ham\u0131s\u0131n\u0131 oxu")}
              </motion.button>
            </div>
          }
        </header>

        {/* Filter tabs */}
        <div className="a-tabs" style={{ marginBottom: 14 }}>
          {filters.map((f) =>
          <button key={f.id} onClick={() => setFilter(f.id)} className={`a-tab ${filter === f.id ? 'active' : ''}`}>
              {f.label}
            </button>
          )}
        </div>

        {/* List */}
        {loading ?
        <div className="text-center py-16">
            <div className="w-7 h-7 rounded-full animate-spin mx-auto"
          style={{ border: '3px solid var(--a-peach-2)', borderTopColor: 'transparent' }} />
          </div> :
        filteredNotifications.length === 0 ?
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="a-card" style={{ textAlign: 'center', padding: '34px 18px' }}>
            <div className="mx-auto mb-4 flex items-center justify-center"
          style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--a-surface-soft)' }}>
              <Bell size={26} style={{ color: 'var(--a-ink-faint)' }} />
            </div>
            <h3 className="a-list-title" style={{ marginBottom: 4 }}>{tr("notificationsscreen_bildiris_yoxdur_6ccf4d", "BildiriÅŸ yoxdur")}</h3>
            <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{tr("notificationsscreen_yeni_bildirisler_burada_gorunecek_a0484a", "Yeni bildiriÅŸlÉ™r burada gÃ¶rÃ¼nÉ™cÉ™k")}</p>
          </motion.div> :

        <div className="space-y-2.5">
            {filteredNotifications.map((notification, index) => {
            const { icon: Icon, bg, ink } = getNotificationIcon(notification.notification_type);
            const isCommunity = communityTypes.includes(notification.notification_type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleNotificationClick(notification)}
                className={isCommunity ? 'cursor-pointer active:scale-[0.99]' : ''}
                style={{
                  background: 'var(--a-surface)',
                  borderRadius: 'var(--a-radius-md)',
                  padding: '14px 15px',
                  boxShadow: 'var(--a-card-shadow)',
                  border: notification.is_read ? '1.5px solid transparent' : '1.5px solid var(--a-peach-2)',
                  transition: 'border-color 0.2s, transform 0.1s'
                }}>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 40, height: 40, borderRadius: 14, background: bg }}>
                      <Icon size={17} style={{ color: ink }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 style={{ fontSize: 12.5, fontWeight: 700, color: notification.is_read ? 'var(--a-ink)' : 'var(--a-accent-ink)', lineHeight: 1.3 }}>
                          {notification.title}
                        </h3>
                        <span className="whitespace-nowrap" style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--a-ink-faint)' }}>{formatTime(notification.created_at)}</span>
                      </div>
                      <p className="mt-0.5 leading-relaxed line-clamp-2" style={{ fontSize: 11.5, color: 'var(--a-ink-soft)' }}>{notification.message}</p>
                      {isCommunity &&
                    <p className="mt-1.5" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--a-accent-ink)' }}>{tr("notificationsscreen_gormek_ucun_toxun_04883f", "GÃ¶rmÉ™k Ã¼Ã§Ã¼n toxun â†’")}</p>
                    }
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2.5 justify-end">
                    {!notification.is_read &&
                  <button onClick={(e) => {e.stopPropagation();markAsRead(notification.id);}}
                  style={{ background: 'var(--a-peach-1)', color: 'var(--a-accent-ink)', borderRadius: 999, padding: '4px 11px', fontSize: 9.5, fontWeight: 700 }}>
                        {tr("notificationsscreen_read", "Oxundu")}
                      </button>
                  }
                    <button onClick={(e) => {e.stopPropagation();deleteNotification(notification.id);}}
                  className="inline-flex items-center gap-1"
                  style={{ background: 'var(--a-alert-bg)', color: 'var(--a-alert-ink)', borderRadius: 999, padding: '4px 11px', fontSize: 9.5, fontWeight: 700 }}>
                      <Trash2 size={10} />{tr("notificationsscreen_delete", "Sil")}
                    </button>
                  </div>
                </motion.div>);

          })}
          </div>
        }
      </div>
    </div>);

};

export default NotificationsScreen;
