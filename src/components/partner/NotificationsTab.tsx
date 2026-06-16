import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Heart, Smile, Activity, AlertCircle,
  Footprints, Droplets, MessageCircle, Search,
  Filter, X, Calendar } from
'lucide-react';
import { usePartnerMessages, PartnerMessage } from '@/hooks/usePartnerMessages';
import { useAuth } from '@/hooks/useAuth';
import { tr } from "@/lib/tr";

type NotificationFilter = 'all' | 'mood_update' | 'contraction_started' | 'contraction_511' | 'kick_session' | 'water_goal' | 'love' | 'text';

const NotificationsTab = () => {
  const { messages, markAsRead } = usePartnerMessages();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filters: {id: NotificationFilter;label: string;icon: any;color: string;}[] = [
  { id: 'all', label: tr("notificationstab_hamisi_c73c4d", 'Hamısı'), icon: Bell, color: 'bg-gray-100 text-gray-600' },
  { id: 'mood_update', label: tr("notificationstab_ehval_0457f9", 'Əhval'), icon: Smile, color: 'bg-violet-100 text-violet-600' },
  { id: 'contraction_started', label: tr("notificationstab_sanci_350c2d", 'Sancı'), icon: Activity, color: 'bg-amber-100 text-amber-600' },
  { id: 'contraction_511', label: '5-1-1', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
  { id: 'kick_session', label: tr("notificationstab_tepik_9a873a", 'Təpik'), icon: Footprints, color: 'bg-blue-100 text-blue-600' },
  { id: 'water_goal', label: 'Su', icon: Droplets, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'love', label: 'Sevgi', icon: Heart, color: 'bg-pink-100 text-pink-600' }];


  const dateRanges: {id: typeof dateRange;label: string;}[] = [
  { id: 'all', label: tr("notificationstab_hamisi_c73c4d", 'Hamısı') },
  { id: 'today', label: tr("notificationstab_bu_gun_786fd4", 'Bu gün') },
  { id: 'week', label: tr("notificationstab_bu_hefte_a5f60b", 'Bu həftə') },
  { id: 'month', label: 'Bu ay' }];


  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter((m) => m.message_type === activeFilter);
    }

    // Filter by date
    if (dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((m) => {
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
      filtered = filtered.filter((m) => {
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
          title: tr("notificationstab_sevgi_gonderdi_8206b9", 'Sevgi göndərdi ❤️'),
          body: tr("notificationstab_partnyorunuz_size_sevgi_gonder_765fb4", "Partnyorunuz siz\u0259 sevgi g\xF6nd\u0259rdi")
        };
      case 'mood_update':
        return {
          icon: Smile,
          color: 'bg-violet-100 text-violet-600',
          title: parsedContent?.title || tr("notificationstab_ehval_yenilendi_0675fd", "\u018Fhval yenil\u0259ndi"),
          body: parsedContent?.body || tr("notificationstab_partnyorunuz_ehvalini_qeyd_etd_612302", "Partnyorunuz \u0259hval\u0131n\u0131 qeyd etdi")
        };
      case 'contraction_started':
        return {
          icon: Activity,
          color: 'bg-amber-100 text-amber-600',
          title: parsedContent?.title || tr("notificationstab_sanci_basladi_c51f20", "Sanc\u0131 ba\u015Flad\u0131! \u23F1\uFE0F"),
          body: parsedContent?.body || tr("notificationstab_partnyorunuz_sanci_qeyd_etdi_ac77ff", "Partnyorunuz sanc\u0131 qeyd etdi")
        };
      case 'contraction_511':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-600',
          title: tr("notificationstab_5_1_1_qaydasi_976061", '⚠️ 5-1-1 Qaydası!'),
          body: tr("notificationstab_xestexanaya_getme_vaxti_ola_bi_b244c0", "X\u0259st\u0259xanaya getm\u0259 vaxt\u0131 ola bil\u0259r!")
        };
      case 'kick_session':
        return {
          icon: Footprints,
          color: 'bg-blue-100 text-blue-600',
          title: parsedContent?.title || tr("notificationstab_korpe_tepik_atdi_628b12", "K\xF6rp\u0259 t\u0259pik atd\u0131! \uD83D\uDC76"),
          body: parsedContent?.body || tr("notificationstab_korpe_aktiv_idi_773118", "K\xF6rp\u0259 aktiv idi")
        };
      case 'water_goal':
        return {
          icon: Droplets,
          color: 'bg-cyan-100 text-cyan-600',
          title: parsedContent?.title || tr("notificationstab_su_hedefine_catdi_55f2fb", "Su h\u0259d\u0259fin\u0259 \xE7atd\u0131! \uD83D\uDCA7"),
          body: tr("notificationstab_gundelik_su_hedefine_catdi_d5260a", "G\xFCnd\u0259lik su h\u0259d\u0259fin\u0259 \xE7atd\u0131")
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
          title: parsedContent?.title || tr("notificationstab_bildiris_307073", "Bildiri\u015F"),
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

    if (diffMins < 1) return tr("notificationstab_i_ndice_3c9745", "\u0130ndic\u0259");
    if (diffMins < 60) return `${diffMins} dəq əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    if (diffDays === 1) return tr("notificationstab_dunen_52b701", "D\xFCn\u0259n");
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4">
      
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">{tr("notificationstab_bildiris_tarixcesi_36bb6a", "Bildiriş Tarixçəsi")}</h2>
        <span className="text-sm text-muted-foreground">
          {filteredMessages.length} {tr("notificationstab_bildiris_98a870", "bildiri\u015F")}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tr("notificationstab_bildirislerde_axtar_ecd1e2", "Bildirişlərdə axtar...")}
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted text-sm outline-none" />
        
        {searchQuery &&
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2">
          
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        }
      </div>

      {/* Filter Toggle */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-medium text-primary"
        whileTap={{ scale: 0.98 }}>
        
        <Filter className="w-4 h-4" />
        {showFilters ? tr("notificationstab_filterleri_gizlet_dd774e", "Filterl\u0259ri gizl\u0259t") : tr("notificationstab_filterleri_goster_da2ab9", "Filterl\u0259ri g\xF6st\u0259r")}
        {activeFilter !== 'all' || dateRange !== 'all' ?
        <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
            Aktiv
          </span> :
        null}
      </motion.button>

      {/* Filters */}
      <AnimatePresence>
        {showFilters &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden space-y-3">
          
            {/* Type Filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">{tr("notificationstab_bildiris_tipi_9b6b8e", "Bildiriş tipi")}</p>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                return (
                  <motion.button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ?
                    'bg-primary text-white' :
                    filter.color}`
                    }
                    whileTap={{ scale: 0.95 }}>
                    
                      <Icon className="w-3.5 h-3.5" />
                      {filter.label}
                    </motion.button>);

              })}
              </div>
            </div>

            {/* Date Range Filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {tr("notificationstab_tarix_araligi_83f692", "Tarix aral\u0131\u011F\u0131")}
              </p>
              <div className="flex flex-wrap gap-2">
                {dateRanges.map((range) => {
                const isActive = dateRange === range.id;
                return (
                  <motion.button
                    key={range.id}
                    onClick={() => setDateRange(range.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ?
                    'bg-primary text-white' :
                    'bg-muted text-muted-foreground'}`
                    }
                    whileTap={{ scale: 0.95 }}>
                    
                      {range.label}
                    </motion.button>);

              })}
              </div>
            </div>

            {/* Clear Filters */}
            {(activeFilter !== 'all' || dateRange !== 'all') &&
          <motion.button
            onClick={() => {
              setActiveFilter('all');
              setDateRange('all');
            }}
            className="text-xs text-destructive font-medium">
                {tr("notificationstab_filterleri_temizle_75f5dd", "Filterl\u0259ri t\u0259mizl\u0259")}
              
          </motion.button>
          }
          </motion.div>
        }
      </AnimatePresence>

      {/* Messages List */}
      {filteredMessages.length === 0 ?
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12">
        
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {searchQuery || activeFilter !== 'all' || dateRange !== 'all' ? tr("notificationstab_uygun_bildiris_tapilmadi_545f51", "Uy\u011Fun bildiri\u015F tap\u0131lmad\u0131") : tr("notificationstab_hele_bildiris_yoxdur_f05fcf", "H\u0259l\u0259 bildiri\u015F yoxdur")

          }
          </p>
        </motion.div> :

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
                onClick={() => !message.is_read && markAsRead(message.id)}>
                
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 border-background ${details.color} flex items-center justify-center z-10`}>
                    <div className={`w-2 h-2 rounded-full ${message.is_read ? 'bg-current opacity-50' : 'bg-current'}`} />
                  </div>

                  <div className={`bg-card rounded-2xl p-4 shadow-card border-2 ${
                message.is_read ? 'border-border/50' : 'border-primary/30 bg-primary/5'}`
                }>
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
                        {!message.is_read &&
                      <span className="inline-block mt-2 px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-medium rounded-full">
                            Yeni
                          </span>
                      }
                      </div>
                    </div>
                  </div>
                </motion.div>);

          })}
          </div>
        </div>
      }
    </motion.div>);

};

export default NotificationsTab;