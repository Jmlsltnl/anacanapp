import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Heart, Smile, Activity, AlertCircle, 
  Footprints, Droplets, MessageCircle, Search,
  Filter, X, Calendar
} from 'lucide-react';
import { usePartnerMessages, PartnerMessage } from '@/hooks/usePartnerMessages';
import { useAuth } from '@/hooks/useAuth';

type NotificationFilter = 'all' | 'mood_update' | 'contraction_started' | 'contraction_511' | 'kick_session' | 'water_goal' | 'love' | 'text';

const NotificationsTab = () => {
  const { messages, markAsRead } = usePartnerMessages();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filters: { id: NotificationFilter; label: string; icon: any; color: string }[] = [
    { id: 'all', label: 'Hamısı', icon: Bell, color: 'bg-gray-100 text-gray-600' },
    { id: 'mood_update', label: 'Əhval', icon: Smile, color: 'bg-violet-100 text-violet-600' },
    { id: 'contraction_started', label: 'Sancı', icon: Activity, color: 'bg-amber-100 text-amber-600' },
    { id: 'contraction_511', label: '5-1-1', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    { id: 'kick_session', label: 'Təpik', icon: Footprints, color: 'bg-blue-100 text-blue-600' },
    { id: 'water_goal', label: 'Su', icon: Droplets, color: 'bg-cyan-100 text-cyan-600' },
    { id: 'love', label: 'Sevgi', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  ];

  const dateRanges: { id: typeof dateRange; label: string }[] = [
    { id: 'all', label: 'Hamısı' },
    { id: 'today', label: 'Bu gün' },
    { id: 'week', label: 'Bu həftə' },
    { id: 'month', label: 'Bu ay' },
  ];

  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(m => m.message_type === activeFilter);
    }

    // Filter by date
    if (dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(m => {
        const msgDate = new Date(m.created_at);
        
        switch (dateRange) {
          case 'today':
            return msgDate >= startOfToday;
          case 'week':
            const weekAgo = new Date(startOfToday);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return msgDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(startOfToday);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return msgDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        let content = '';
        try {
          const parsed = JSON.parse(m.content || '{}');
          content = `${parsed.title || ''} ${parsed.body || ''}`.toLowerCase();
        } catch {
          content = (m.content || '').toLowerCase();
        }
        return content.includes(query);
      });
    }

    return filtered;
  }, [messages, activeFilter, dateRange, searchQuery]);

  const getMessageDetails = (msg: PartnerMessage) => {
    let parsedContent: any = null;
    try {
      if (msg.content) {
        parsedContent = JSON.parse(msg.content);
      }
    } catch {
      parsedContent = { body: msg.content };
    }

    switch (msg.message_type) {
      case 'love':
        return { 
          icon: Heart, 
          color: 'bg-pink-100 text-pink-600',
          title: 'Sevgi göndərdi ❤️',
          body: 'Partnyorunuz sizə sevgi göndərdi'
        };
      case 'mood_update':
        return { 
          icon: Smile, 
          color: 'bg-violet-100 text-violet-600',
          title: parsedContent?.title || 'Əhval yeniləndi',
          body: parsedContent?.body || 'Partnyorunuz əhvalını qeyd etdi'
        };
      case 'contraction_started':
        return { 
          icon: Activity, 
          color: 'bg-amber-100 text-amber-600',
          title: parsedContent?.title || 'Sancı başladı! ⏱️',
          body: parsedContent?.body || 'Partnyorunuz sancı qeyd etdi'
        };
      case 'contraction_511':
        return { 
          icon: AlertCircle, 
          color: 'bg-red-100 text-red-600',
          title: '⚠️ 5-1-1 Qaydası!',
          body: 'Xəstəxanaya getmə vaxtı ola bilər!'
        };
      case 'kick_session':
        return { 
          icon: Footprints, 
          color: 'bg-blue-100 text-blue-600',
          title: parsedContent?.title || 'Körpə təpik atdı! 👶',
          body: parsedContent?.body || 'Körpə aktiv idi'
        };
      case 'water_goal':
        return { 
          icon: Droplets, 
          color: 'bg-cyan-100 text-cyan-600',
          title: parsedContent?.title || 'Su hədəfinə çatdı! 💧',
          body: 'Gündəlik su hədəfinə çatdı'
        };
      case 'text':
        return { 
          icon: MessageCircle, 
          color: 'bg-emerald-100 text-emerald-600',
          title: 'Mesaj',
          body: msg.content || ''
        };
      default:
        return { 
          icon: Bell, 
          color: 'bg-gray-100 text-gray-600',
          title: parsedContent?.title || 'Bildiriş',
          body: parsedContent?.body || msg.content || ''
        };
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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Bildiriş Tarixçəsi</h2>
        <span className="text-sm text-muted-foreground">
          {filteredMessages.length} bildiriş
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Bildirişlərdə axtar..."
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted text-sm outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-medium text-primary"
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4" />
        {showFilters ? 'Filterləri gizlət' : 'Filterləri göstər'}
        {activeFilter !== 'all' || dateRange !== 'all' ? (
          <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
            Aktiv
          </span>
        ) : null}
      </motion.button>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Type Filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Bildiriş tipi</p>
              <div className="flex flex-wrap gap-2">
                {filters.map(filter => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <motion.button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : filter.color
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {filter.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Tarix aralığı
              </p>
              <div className="flex flex-wrap gap-2">
                {dateRanges.map(range => {
                  const isActive = dateRange === range.id;
                  return (
                    <motion.button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {range.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters */}
            {(activeFilter !== 'all' || dateRange !== 'all') && (
              <motion.button
                onClick={() => {
                  setActiveFilter('all');
                  setDateRange('all');
                }}
                className="text-xs text-destructive font-medium"
              >
                Filterləri təmizlə
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {searchQuery || activeFilter !== 'all' || dateRange !== 'all'
              ? 'Uyğun bildiriş tapılmadı'
              : 'Hələ bildiriş yoxdur'}
          </p>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {filteredMessages.map((message, index) => {
              const details = getMessageDetails(message);
              const Icon = details.icon;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative pl-14"
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 border-background ${details.color} flex items-center justify-center z-10`}>
                    <div className={`w-2 h-2 rounded-full ${message.is_read ? 'bg-current opacity-50' : 'bg-current'}`} />
                  </div>

                  <div className={`bg-card rounded-2xl p-4 shadow-card border-2 ${
                    message.is_read ? 'border-border/50' : 'border-primary/30 bg-primary/5'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${details.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-semibold text-sm ${message.is_read ? 'text-foreground' : 'text-primary'}`}>
                            {details.title}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{details.body}</p>
                        {!message.is_read && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-medium rounded-full">
                            Yeni
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationsTab;
