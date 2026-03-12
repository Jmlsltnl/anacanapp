import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Crown, MousePointerClick, 
  Eye, Smartphone, Activity, RefreshCw, Calendar, Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { az } from 'date-fns/locale';

interface EventStat {
  event_name: string;
  count: number;
  unique_users: number;
}

interface DailyTrend {
  date: string;
  label: string;
  total: number;
  unique: number;
}

interface ToolUsage {
  tool_id: string;
  tool_name: string;
  count: number;
  unique_users: number;
}

interface PremiumFunnel {
  paywall_shown: number;
  paywall_clicked: number;
  subscribed: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  tools: 'Alətlər',
  health: 'Sağlamlıq',
  content: 'Məzmun',
  ai: 'AI',
  premium: 'Premium',
  auth: 'Giriş/Qeydiyyat',
  community: 'İcma',
  social: 'Sosial',
  navigation: 'Naviqasiya',
  notification: 'Bildiriş',
  general: 'Ümumi',
};

const EVENT_LABELS: Record<string, string> = {
  tool_opened: 'Alət Açıldı',
  tool_used: 'Alət İstifadəsi',
  blog_read: 'Bloq Oxundu',
  blog_liked: 'Bloq Bəyənildi',
  blog_saved: 'Bloq Saxlanıldı',
  ai_chat_started: 'AI Söhbət Başladı',
  ai_chat_message: 'AI Mesaj',
  water_logged: 'Su Qeyd',
  symptom_logged: 'Simptom Qeyd',
  weight_logged: 'Çəki Qeyd',
  kick_counted: 'Təpik Sayıldı',
  contraction_timed: 'Sancı Ölçüldü',
  meal_logged: 'Yemək Qeyd',
  exercise_completed: 'Məşq Tamamlandı',
  mood_logged: 'Əhval Qeyd',
  baby_photo_generated: 'Körpə Foto',
  cry_analyzed: 'Ağlama Analizi',
  poop_analyzed: 'Poop Analizi',
  fairy_tale_generated: 'Nağıl Yaradıldı',
  breathing_exercise_done: 'Nəfəs Məşqi',
  white_noise_played: 'Ağ Səs',
  horoscope_viewed: 'Bürclər',
  recipe_viewed: 'Resept',
  name_searched: 'Ad Axtarış',
  baby_growth_logged: 'Böyümə Qeyd',
  premium_paywall_shown: 'Paywall Göstərildi',
  premium_paywall_clicked: 'Paywall Klik',
  premium_subscribed: 'Abunəlik',
  premium_cancelled: 'Ləğv',
  login: 'Giriş',
  sign_up: 'Qeydiyyat',
  community_post_created: 'Post Yaradıldı',
  community_post_liked: 'Post Bəyənildi',
  screen_view: 'Ekran Baxışı',
  partner_linked: 'Partner Bağlandı',
  shopping_item_added: 'Alışveriş Əlavə',
  appointment_created: 'Görüş Yaradıldı',
  place_viewed: 'Məkan Baxışı',
  product_viewed: 'Məhsul Baxışı',
};

const COLORS = ['#f28155', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#6366f1'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const sinceDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // Computed stats
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return events;
    return events.filter(e => e.event_category === categoryFilter);
  }, [events, categoryFilter]);

  const overviewStats = useMemo(() => {
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;
    const premiumEvents = events.filter(e => e.is_premium).length;
    const toolEvents = events.filter(e => e.event_category === 'tools').length;
    const premiumConversions = events.filter(e => e.event_name === 'premium_subscribed').length;
    return { totalEvents: events.length, uniqueUsers, premiumEvents, toolEvents, premiumConversions };
  }, [events]);

  // Top events
  const topEvents = useMemo(() => {
    const counts = new Map<string, { count: number; users: Set<string> }>();
    filteredEvents.forEach(e => {
      const existing = counts.get(e.event_name) || { count: 0, users: new Set() };
      existing.count++;
      existing.users.add(e.user_id);
      counts.set(e.event_name, existing);
    });
    return Array.from(counts.entries())
      .map(([name, { count, users }]) => ({
        event_name: name,
        label: EVENT_LABELS[name] || name,
        count,
        unique_users: users.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filteredEvents]);

  // Tool usage breakdown
  const toolUsage = useMemo(() => {
    const counts = new Map<string, { count: number; users: Set<string> }>();
    events
      .filter(e => e.event_name === 'tool_opened' || e.event_name === 'tool_used')
      .forEach(e => {
        const toolId = (e.event_data as any)?.tool_id || 'unknown';
        const toolName = (e.event_data as any)?.tool_name || toolId;
        const key = toolId;
        const existing = counts.get(key) || { count: 0, users: new Set(), name: toolName };
        existing.count++;
        existing.users.add(e.user_id);
        (existing as any).name = toolName;
        counts.set(key, existing);
      });
    return Array.from(counts.entries())
      .map(([id, data]) => ({
        tool_id: id,
        tool_name: (data as any).name || id,
        count: data.count,
        unique_users: data.users.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const days = parseInt(dateRange);
    const trend: DailyTrend[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEvents = filteredEvents.filter(e => 
        e.created_at.startsWith(dateStr)
      );
      const uniqueUsers = new Set(dayEvents.map(e => e.user_id)).size;
      trend.push({
        date: dateStr,
        label: format(date, days <= 7 ? 'EEE' : 'dd MMM', { locale: az }),
        total: dayEvents.length,
        unique: uniqueUsers,
      });
    }
    return trend;
  }, [filteredEvents, dateRange]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => {
      counts.set(e.event_category, (counts.get(e.event_category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // Life stage breakdown
  const lifeStageBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => {
      const stage = e.life_stage || 'Naməlum';
      counts.set(stage, (counts.get(stage) || 0) + 1);
    });
    const stageLabels: Record<string, string> = {
      bump: 'Hamilə', mommy: 'Ana', flow: 'Flow', partner: 'Partner', 'Naməlum': 'Naməlum'
    };
    const stageColors: Record<string, string> = {
      bump: '#f28155', mommy: '#8b5cf6', flow: '#ec4899', partner: '#3b82f6', 'Naməlum': '#9ca3af'
    };
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: stageLabels[name] || name,
      value,
      color: stageColors[name] || '#9ca3af',
    }));
  }, [events]);

  // Premium funnel
  const premiumFunnel = useMemo((): PremiumFunnel => {
    return {
      paywall_shown: events.filter(e => e.event_name === 'premium_paywall_shown').length,
      paywall_clicked: events.filter(e => e.event_name === 'premium_paywall_clicked').length,
      subscribed: events.filter(e => e.event_name === 'premium_subscribed').length,
    };
  }, [events]);

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => {
      counts.set(e.platform || 'web', (counts.get(e.platform || 'web') || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: name === 'ios' ? 'iOS' : name === 'android' ? 'Android' : 'Web',
      value,
    }));
  }, [events]);

  const statCards = [
    { label: 'Cəmi Hadisə', value: overviewStats.totalEvents, icon: Activity, color: 'bg-blue-500' },
    { label: 'Unikal İstifadəçi', value: overviewStats.uniqueUsers, icon: Users, color: 'bg-emerald-500' },
    { label: 'Alət İstifadəsi', value: overviewStats.toolEvents, icon: MousePointerClick, color: 'bg-purple-500' },
    { label: 'Premium Keçid', value: overviewStats.premiumConversions, icon: Crown, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 Analitika</h1>
          <p className="text-muted-foreground">İstifadəçi davranışı və alət istifadəsi</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Bu gün</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Yenilə
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ümumi Baxış</TabsTrigger>
          <TabsTrigger value="tools">Alət İstifadəsi</TabsTrigger>
          <TabsTrigger value="premium">Premium Analiz</TabsTrigger>
          <TabsTrigger value="users">İstifadəçi Segmentləri</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trend */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Gündəlik Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f28155" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f28155" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="total" stroke="#f28155" fillOpacity={1} fill="url(#colorTotal)" name="Hadisələr" />
                  <Area type="monotone" dataKey="unique" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUnique)" name="Unikal İstifadəçi" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Events */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">Ən Çox Baş Verən Hadisələr</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {topEvents.map((ev, i) => (
                  <div key={ev.event_name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium">{ev.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{ev.unique_users} istifadəçi</span>
                      <span className="text-sm font-bold text-foreground min-w-[40px] text-right">{ev.count}</span>
                    </div>
                  </div>
                ))}
                {topEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Hələ məlumat yoxdur</p>
                )}
              </div>
            </Card>

            {/* Category Pie */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">Kateqoriya Paylanması</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {categoryDistribution.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{cat.name} ({cat.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Alət İstifadə Statistikası</h3>
            {toolUsage.length > 0 ? (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolUsage.slice(0, 12)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis type="category" dataKey="tool_name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#f28155" radius={[0, 4, 4, 0]} name="İstifadə" />
                      <Bar dataKey="unique_users" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Unikal İstifadəçi" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {toolUsage.map((tool, i) => (
                    <div key={tool.tool_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{tool.tool_name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-bold">{tool.count}</p>
                          <p className="text-xs text-muted-foreground">istifadə</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{tool.unique_users}</p>
                          <p className="text-xs text-muted-foreground">istifadəçi</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12">Alət istifadə məlumatı hələ yoxdur</p>
            )}
          </Card>
        </TabsContent>

        {/* Premium Tab */}
        <TabsContent value="premium" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center">
              <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.paywall_shown}</p>
              <p className="text-sm text-muted-foreground">Paywall Göstərildi</p>
            </Card>
            <Card className="p-5 text-center">
              <MousePointerClick className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.paywall_clicked}</p>
              <p className="text-sm text-muted-foreground">Klik Edildi</p>
              {premiumFunnel.paywall_shown > 0 && (
                <p className="text-xs text-emerald-500 mt-1">
                  {((premiumFunnel.paywall_clicked / premiumFunnel.paywall_shown) * 100).toFixed(1)}% konversiya
                </p>
              )}
            </Card>
            <Card className="p-5 text-center">
              <Crown className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.subscribed}</p>
              <p className="text-sm text-muted-foreground">Abunə Oldu</p>
              {premiumFunnel.paywall_clicked > 0 && (
                <p className="text-xs text-emerald-500 mt-1">
                  {((premiumFunnel.subscribed / premiumFunnel.paywall_clicked) * 100).toFixed(1)}% tamamlandı
                </p>
              )}
            </Card>
          </div>

          {/* Premium events by source */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Paywall Mənbələri</h3>
            <div className="space-y-2">
              {(() => {
                const sources = new Map<string, number>();
                events
                  .filter(e => e.event_name === 'premium_paywall_shown')
                  .forEach(e => {
                    const src = (e.event_data as any)?.source || 'unknown';
                    sources.set(src, (sources.get(src) || 0) + 1);
                  });
                return Array.from(sources.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{source}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ));
              })()}
              {events.filter(e => e.event_name === 'premium_paywall_shown').length === 0 && (
                <p className="text-center text-muted-foreground py-8">Hələ paywall məlumatı yoxdur</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Life Stage */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">Həyat Mərhələsinə Görə Aktivlik</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lifeStageBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {lifeStageBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {lifeStageBreakdown.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Platform */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">Platforma Paylanması</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {platformBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {platformBreakdown.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{p.name} ({p.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Premium vs Free activity */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Premium vs Pulsuz İstifadəçi Aktivliyi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">
                  {events.filter(e => !e.is_premium).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Pulsuz İstifadəçi Hadisələri</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(events.filter(e => !e.is_premium).map(e => e.user_id)).size} unikal istifadəçi
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-500/10">
                <p className="text-3xl font-bold text-amber-500">
                  {events.filter(e => e.is_premium).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Premium İstifadəçi Hadisələri</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(events.filter(e => e.is_premium).map(e => e.user_id)).size} unikal istifadəçi
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
