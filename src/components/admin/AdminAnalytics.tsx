import { useState, useEffect, useMemo } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Crown, MousePointerClick,
  Eye, Smartphone, Activity, RefreshCw, Calendar, Filter, DollarSign, Zap, Rocket, LineChart as LineChartIcon } from
'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from
'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';

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
  tools: tr("adminanalytics_aletler_4778b4", "Al\u0259tl\u0259r"),
  health: tr("adminanalytics_saglamliq_09460a", "Sa\u011Flaml\u0131q"),
  content: tr("adminanalytics_mezmun_f1d51d", "Məzmun"),
  ai: 'AI',
  premium: 'Premium',
  auth: tr("adminanalytics_giris_qeydiyyat_99a75a", "Giri\u015F/Qeydiyyat"),
  community: 'İcma',
  social: 'Sosial',
  navigation: 'Naviqasiya',
  notification: tr("adminanalytics_bildiris_307073", "Bildiri\u015F"),
  general: tr("adminanalytics_umumi_1b5521", "\xDCmumi")
};

const EVENT_LABELS: Record<string, string> = {
  tool_opened: tr("adminanalytics_alet_acildi_f4ed8e", "Al\u0259t A\xE7\u0131ld\u0131"),
  tool_used: tr("adminanalytics_alet_i_stifadesi_b15cf9", "Al\u0259t \u0130stifad\u0259si"),
  blog_read: 'Bloq Oxundu',
  blog_liked: tr("adminanalytics_bloq_beyenildi_490e98", "Bloq B\u0259y\u0259nildi"),
  blog_saved: tr("adminanalytics_bloq_saxlanildi_46234f", "Bloq Saxlan\u0131ld\u0131"),
  ai_chat_started: tr("adminanalytics_ai_sohbet_basladi_02776f", "AI S\xF6hb\u0259t Ba\u015Flad\u0131"),
  ai_chat_message: 'AI Mesaj',
  water_logged: 'Su Qeyd',
  symptom_logged: 'Simptom Qeyd',
  weight_logged: tr("adminanalytics_ceki_qeyd_71d9f7", "\xC7\u0259ki Qeyd"),
  kick_counted: tr("adminanalytics_tepik_sayildi_8adbf4", "T\u0259pik Say\u0131ld\u0131"),
  contraction_timed: tr("adminanalytics_sanci_olculdu_071805", "Sanc\u0131 \xD6l\xE7\xFCld\xFC"),
  meal_logged: tr("adminanalytics_yemek_qeyd_c5e6b6", "Yem\u0259k Qeyd"),
  exercise_completed: tr("adminanalytics_mesq_tamamlandi_099cb6", "M\u0259\u015Fq Tamamland\u0131"),
  mood_logged: tr("adminanalytics_ehval_qeyd_452485", "\u018Fhval Qeyd"),
  baby_photo_generated: tr("adminanalytics_korpe_foto_d3c8d1", "K\xF6rp\u0259 Foto"),
  cry_analyzed: tr("adminanalytics_aglama_analizi_0713b3", "A\u011Flama Analizi"),
  poop_analyzed: 'Poop Analizi',
  fairy_tale_generated: tr("adminanalytics_nagil_yaradildi_b2b8d6", "Na\u011F\u0131l Yarad\u0131ld\u0131"),
  breathing_exercise_done: tr("adminanalytics_nefes_mesqi_8d98bb", "N\u0259f\u0259s M\u0259\u015Fqi"),
  white_noise_played: tr("adminanalytics_ag_ses_26735e", "A\u011F S\u0259s"),
  horoscope_viewed: tr("adminanalytics_burcler_bb45a3", "B\xFCrcl\u0259r"),
  recipe_viewed: 'Resept',
  name_searched: tr("adminanalytics_ad_axtaris_83a266", "Ad Axtar\u0131\u015F"),
  baby_growth_logged: tr("adminanalytics_boyume_qeyd_241491", "B\xF6y\xFCm\u0259 Qeyd"),
  premium_paywall_shown: tr("adminanalytics_paywall_gosterildi_359f44", "Paywall G\xF6st\u0259rildi"),
  premium_paywall_clicked: 'Paywall Klik',
  premium_subscribed: tr("adminanalytics_abunelik_ce9af7", "Abun\u0259lik"),
  premium_cancelled: tr("adminanalytics_legv_f7100a", "L\u0259\u011Fv"),
  login: tr("adminanalytics_giris_1ffbd7", "Giri\u015F"),
  sign_up: 'Qeydiyyat',
  community_post_created: tr("adminanalytics_post_yaradildi_6e4ece", "Post Yarad\u0131ld\u0131"),
  community_post_liked: tr("adminanalytics_post_beyenildi_620043", "Post B\u0259y\u0259nildi"),
  screen_view: tr("adminanalytics_ekran_baxisi_f0a13c", "Ekran Bax\u0131\u015F\u0131"),
  partner_linked: tr("adminanalytics_partner_baglandi_d519fa", "Partner Ba\u011Fland\u0131"),
  shopping_item_added: tr("adminanalytics_alisveris_elave_d97659", "Al\u0131\u015Fveri\u015F \u018Flav\u0259"),
  appointment_created: tr("adminanalytics_gorus_yaradildi_dc8719", "G\xF6r\xFC\u015F Yarad\u0131ld\u0131"),
  place_viewed: tr("adminanalytics_mekan_baxisi_4db4b8", "M\u0259kan Bax\u0131\u015F\u0131"),
  product_viewed: tr("adminanalytics_mehsul_baxisi_e041d2", "M\u0259hsul Bax\u0131\u015F\u0131")
};

const COLORS = ['#f28155', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#6366f1'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [premiumPlans, setPremiumPlans] = useState<any[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const sinceDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      
      // Fetch startup data concurrently
      const [subsRes, plansRes] = await Promise.all([
        supabase.from('subscriptions').select('*'),
        supabase.from('premium_plans').select('*')
      ]);
      setSubscriptions(subsRes.data || []);
      setPremiumPlans(plansRes.data || []);

      const { data, error } = await supabase.
      from('analytics_events').
      select('*').
      gte('created_at', sinceDate).
      order('created_at', { ascending: false }).
      limit(10000);

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

  // Startup / SaaS Metrics
  const startupStats = useMemo(() => {
    // DAU / MAU Stickiness
    // We estimate DAU from events in the last 24h, and MAU from events in the last 30d (assuming dateRange >= 30, otherwise we use what we have)
    const now = new Date();
    const oneDayAgo = subDays(now, 1).toISOString();
    const thirtyDaysAgo = subDays(now, 30).toISOString();
    
    const dauEvents = events.filter(e => e.created_at >= oneDayAgo);
    const mauEvents = events.filter(e => e.created_at >= thirtyDaysAgo);
    
    const dau = new Set(dauEvents.map(e => e.user_id)).size;
    const mau = new Set(mauEvents.map(e => e.user_id)).size || 1; // avoid div by 0
    const stickiness = ((dau / mau) * 100).toFixed(1);

    // MRR (Monthly Recurring Revenue) & ARR
    // Active subscriptions multiplied by their plan's monthly price
    const activeSubs = subscriptions.filter(s => s.status === 'active' || (s.status === 'cancelled' && new Date(s.expires_at) > now));
    const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled');
    const totalSubs = subscriptions.length || 1;
    const churnRate = ((cancelledSubs.length / totalSubs) * 100).toFixed(1);

    // Estimate MRR based on plans
    let mrr = 0;
    activeSubs.forEach(sub => {
      const plan = premiumPlans.find(p => p.id === sub.plan_id || p.name === sub.plan_type);
      // Fallback estimate if plan not found (e.g. 4.99 AZN)
      mrr += plan ? (plan.price_monthly || 4.99) : 4.99; 
    });

    // ARPU (Average Revenue Per User)
    const activeUsers = new Set(events.map(e => e.user_id)).size || 1;
    const arpu = (mrr / activeUsers).toFixed(2);
    
    // LTV (Life Time Value) = ARPU / Churn Rate (decimal)
    const churnDecimal = (parseFloat(churnRate) / 100) || 0.05; // avoid div by 0, assume 5% if 0
    const ltv = (parseFloat(arpu) / churnDecimal).toFixed(2);

    return {
      dau,
      mau,
      stickiness,
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      activeSubs: activeSubs.length,
      churnRate,
      arpu,
      ltv
    };
  }, [events, subscriptions, premiumPlans]);

  // Computed stats
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return events;
    return events.filter((e) => e.event_category === categoryFilter);
  }, [events, categoryFilter]);

  const overviewStats = useMemo(() => {
    const uniqueUsers = new Set(events.map((e) => e.user_id)).size;
    const premiumEvents = events.filter((e) => e.is_premium).length;
    const toolEvents = events.filter((e) => e.event_category === 'tools').length;
    const premiumConversions = events.filter((e) => e.event_name === 'premium_subscribed').length;
    return { totalEvents: events.length, uniqueUsers, premiumEvents, toolEvents, premiumConversions };
  }, [events]);

  // Top events
  const topEvents = useMemo(() => {
    const counts = new Map<string, {count: number;users: Set<string>;}>();
    filteredEvents.forEach((e) => {
      const existing = counts.get(e.event_name) || { count: 0, users: new Set() };
      existing.count++;
      existing.users.add(e.user_id);
      counts.set(e.event_name, existing);
    });
    return Array.from(counts.entries()).
    map(([name, { count, users }]) => ({
      event_name: name,
      label: EVENT_LABELS[name] || name,
      count,
      unique_users: users.size
    })).
    sort((a, b) => b.count - a.count).
    slice(0, 15);
  }, [filteredEvents]);

  // Tool usage breakdown
  const toolUsage = useMemo(() => {
    const counts = new Map<string, {count: number;users: Set<string>;}>();
    events.
    filter((e) => e.event_name === 'tool_opened' || e.event_name === 'tool_used').
    forEach((e) => {
      const toolId = (e.event_data as any)?.tool_id || 'unknown';
      const toolName = (e.event_data as any)?.tool_name || toolId;
      const key = toolId;
      const existing = counts.get(key) || { count: 0, users: new Set(), name: toolName };
      existing.count++;
      existing.users.add(e.user_id);
      (existing as any).name = toolName;
      counts.set(key, existing);
    });
    return Array.from(counts.entries()).
    map(([id, data]) => ({
      tool_id: id,
      tool_name: (data as any).name || id,
      count: data.count,
      unique_users: data.users.size
    })).
    sort((a, b) => b.count - a.count);
  }, [events]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const days = parseInt(dateRange);
    const trend: DailyTrend[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEvents = filteredEvents.filter((e) =>
      e.created_at.startsWith(dateStr)
      );
      const uniqueUsers = new Set(dayEvents.map((e) => e.user_id)).size;
      trend.push({
        date: dateStr,
        label: format(date, days <= 7 ? 'EEE' : 'dd MMM', { locale: getCurrentDateLocale() }),
        total: dayEvents.length,
        unique: uniqueUsers
      });
    }
    return trend;
  }, [filteredEvents, dateRange]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => {
      counts.set(e.event_category, (counts.get(e.event_category) || 0) + 1);
    });
    return Array.from(counts.entries()).
    map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value
    })).
    sort((a, b) => b.value - a.value);
  }, [events]);

  // Life stage breakdown
  const lifeStageBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => {
      const stage = e.life_stage || tr("adminanalytics_namelum_134662", "Nam\u0259lum");
      counts.set(stage, (counts.get(stage) || 0) + 1);
    });
    const stageLabels: Record<string, string> = {
      bump: tr("adminanalytics_hamile_0080af", "Hamil\u0259"), mommy: 'Ana', flow: 'Flow', partner: 'Partner', 'Naməlum': tr("adminanalytics_namelum_134662", "Nam\u0259lum")
    };
    const stageColors: Record<string, string> = {
      bump: '#f28155', mommy: '#8b5cf6', flow: '#ec4899', partner: '#3b82f6', 'Naməlum': '#9ca3af'
    };
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: stageLabels[name] || name,
      value,
      color: stageColors[name] || '#9ca3af'
    }));
  }, [events]);

  // Premium funnel
  const premiumFunnel = useMemo((): PremiumFunnel => {
    return {
      paywall_shown: events.filter((e) => e.event_name === 'premium_paywall_shown').length,
      paywall_clicked: events.filter((e) => e.event_name === 'premium_paywall_clicked').length,
      subscribed: events.filter((e) => e.event_name === 'premium_subscribed').length
    };
  }, [events]);

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => {
      counts.set(e.platform || 'web', (counts.get(e.platform || 'web') || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: name === 'ios' ? 'iOS' : name === 'android' ? 'Android' : 'Web',
      value
    }));
  }, [events]);

  const statCards = [
  { label: tr("adminanalytics_cemi_hadise_a138e5", "Cəmi Hadisə"), value: overviewStats.totalEvents, icon: Activity, color: 'bg-blue-500' },
  { label: tr("adminanalytics_unikal_istifadeci_7c7eec", "Unikal İstifadəçi"), value: overviewStats.uniqueUsers, icon: Users, color: 'bg-emerald-500' },
  { label: tr("adminanalytics_alet_istifadesi_b15cf9", "Alət İstifadəsi"), value: overviewStats.toolEvents, icon: MousePointerClick, color: 'bg-purple-500' },
  { label: tr("adminanalytics_premium_kecid_62b1e5", "Premium Keçid"), value: overviewStats.premiumConversions, icon: Crown, color: 'bg-amber-500' }];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 Analitika</h1>
          <p className="text-muted-foreground">{tr("adminanalytics_istifadeci_davranisi_ve_alet_istifadesi_879ed3", "İstifadəçi davranışı və alət istifadəsi")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{tr("adminanalytics_bu_gun_786fd4", "Bu gün")}</SelectItem>
              <SelectItem value="7">{tr("adminanalytics_son_7_gun_d6fc2a", "Son 7 gün")}</SelectItem>
              <SelectItem value="30">{tr("adminanalytics_son_30_gun_89778f", "Son 30 gün")}</SelectItem>
              <SelectItem value="90">{tr("adminanalytics_son_90_gun_68d604", "Son 90 gün")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("adminanalytics_hamisi_c73c4d", "Hamısı")}</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) =>
              <SelectItem key={key} value={key}>{label}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {tr("adminanalytics_yenile_570ce2", "Yenil\u0259")}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) =>
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
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{tr("adminanalytics_umumi_baxis_f27f07", "Ümumi Baxış")}</TabsTrigger>
          <TabsTrigger value="tools">{tr("adminanalytics_alet_istifadesi_b15cf9", "Alət İstifadəsi")}</TabsTrigger>
          <TabsTrigger value="premium">Premium Analiz</TabsTrigger>
          <TabsTrigger value="users">{tr("adminanalytics_istifadeci_segmentleri_f5dd13", "İstifadəçi Segmentləri")}</TabsTrigger>
          <TabsTrigger value="startup" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><Rocket className="w-4 h-4 mr-1.5" /> Startup / SaaS</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Daily Trend */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_gundelik_trend_589103", "Gündəlik Trend")}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f28155" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f28155" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="total" stroke="#f28155" fillOpacity={1} fill="url(#colorTotal)" name={tr("adminanalytics_hadiseler_ba83ea", "Hadis\u0259l\u0259r")} />
                  <Area type="monotone" dataKey="unique" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUnique)" name={tr("adminanalytics_unikal_i_stifadeci_7c7eec", "Unikal \u0130stifad\u0259\xE7i")} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Events */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_en_cox_bas_veren_hadiseler_787f85", "Ən Çox Baş Verən Hadisələr")}</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {topEvents.map((ev, i) =>
                <div key={ev.event_name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium">{ev.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{ev.unique_users} {tr("adminanalytics_istifadeci_84a198", "istifad\u0259\xE7i")}</span>
                      <span className="text-sm font-bold text-foreground min-w-[40px] text-right">{ev.count}</span>
                    </div>
                  </div>
                )}
                {topEvents.length === 0 &&
                <p className="text-center text-muted-foreground py-8">{tr("adminanalytics_hele_melumat_yoxdur_91fda8", "Hələ məlumat yoxdur")}</p>
                }
              </div>
            </Card>

            {/* Category Pie */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_kateqoriya_paylanmasi_6a4800", "Kateqoriya Paylanması")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryDistribution.map((_, i) =>
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      )}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {categoryDistribution.map((cat, i) =>
                <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{cat.name} ({cat.value})</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_alet_istifade_statistikasi_24bdb0", "Alət İstifadə Statistikası")}</h3>
            {toolUsage.length > 0 ?
            <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolUsage.slice(0, 12)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis type="category" dataKey="tool_name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#f28155" radius={[0, 4, 4, 0]} name={tr("adminanalytics_i_stifade_9300b8", "\u0130stifad\u0259")} />
                      <Bar dataKey="unique_users" fill="#8b5cf6" radius={[0, 4, 4, 0]} name={tr("adminanalytics_unikal_i_stifadeci_7c7eec", "Unikal \u0130stifad\u0259\xE7i")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {toolUsage.map((tool, i) =>
                <div key={tool.tool_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{tool.tool_name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-bold">{tool.count}</p>
                          <p className="text-xs text-muted-foreground">{tr("adminanalytics_istifade_ddadc5", "istifadə")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{tool.unique_users}</p>
                          <p className="text-xs text-muted-foreground">{tr("adminanalytics_istifadeci_84a198", "istifadəçi")}</p>
                        </div>
                      </div>
                    </div>
                )}
                </div>
              </> :

            <p className="text-center text-muted-foreground py-12">{tr("adminanalytics_alet_istifade_melumati_hele_yoxdur_338696", "Alət istifadə məlumatı hələ yoxdur")}</p>
            }
          </Card>
        </TabsContent>

        {/* Premium Tab */}
        <TabsContent value="premium" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center">
              <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.paywall_shown}</p>
              <p className="text-sm text-muted-foreground">{tr("adminanalytics_paywall_gosterildi_359f44", "Paywall Göstərildi")}</p>
            </Card>
            <Card className="p-5 text-center">
              <MousePointerClick className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.paywall_clicked}</p>
              <p className="text-sm text-muted-foreground">Klik Edildi</p>
              {premiumFunnel.paywall_shown > 0 &&
              <p className="text-xs text-emerald-500 mt-1">
                  {(premiumFunnel.paywall_clicked / premiumFunnel.paywall_shown * 100).toFixed(1)}% konversiya
                </p>
              }
            </Card>
            <Card className="p-5 text-center">
              <Crown className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{premiumFunnel.subscribed}</p>
              <p className="text-sm text-muted-foreground">{tr("adminanalytics_abune_oldu_65a281", "Abunə Oldu")}</p>
              {premiumFunnel.paywall_clicked > 0 &&
              <p className="text-xs text-emerald-500 mt-1">
                  {(premiumFunnel.subscribed / premiumFunnel.paywall_clicked * 100).toFixed(1)}{tr("adminanalytics_tamamlandi_357fc9", "% tamamland\u0131")}
                </p>
              }
            </Card>
          </div>

          {/* Premium events by source */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_paywall_menbeleri_6b7bac", "Paywall Mənbələri")}</h3>
            <div className="space-y-2">
              {(() => {
                const sources = new Map<string, number>();
                events.
                filter((e) => e.event_name === 'premium_paywall_shown').
                forEach((e) => {
                  const src = (e.event_data as any)?.source || 'unknown';
                  sources.set(src, (sources.get(src) || 0) + 1);
                });
                return Array.from(sources.entries()).
                sort((a, b) => b[1] - a[1]).
                map(([source, count]) =>
                <div key={source} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{source}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                );
              })()}
              {events.filter((e) => e.event_name === 'premium_paywall_shown').length === 0 &&
              <p className="text-center text-muted-foreground py-8">{tr("adminanalytics_hele_paywall_melumati_yoxdur_5c3dd4", "Hələ paywall məlumatı yoxdur")}</p>
              }
            </div>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Life Stage */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_heyat_merhelesine_gore_aktivlik_fb5a3f", "Həyat Mərhələsinə Görə Aktivlik")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lifeStageBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {lifeStageBreakdown.map((entry, i) =>
                      <Cell key={i} fill={entry.color} />
                      )}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {lifeStageBreakdown.map((s) =>
                <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.name} ({s.value})</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Platform */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_platforma_paylanmasi_bae2ed", "Platforma Paylanması")}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {platformBreakdown.map((_, i) =>
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      )}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {platformBreakdown.map((p, i) =>
                <div key={p.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{p.name} ({p.value})</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Premium vs Free activity */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">{tr("adminanalytics_premium_vs_pulsuz_istifadeci_aktivliyi_90623a", "Premium vs Pulsuz İstifadəçi Aktivliyi")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">
                  {events.filter((e) => !e.is_premium).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{tr("adminanalytics_pulsuz_istifadeci_hadiseleri_1d304c", "Pulsuz İstifadəçi Hadisələri")}</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(events.filter((e) => !e.is_premium).map((e) => e.user_id)).size} {tr("adminanalytics_unikal_istifadeci_b11345", "unikal istifad\u0259\xE7i")}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-500/10">
                <p className="text-3xl font-bold text-amber-500">
                  {events.filter((e) => e.is_premium).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{tr("adminanalytics_premium_istifadeci_hadiseleri_df62ce", "Premium İstifadəçi Hadisələri")}</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(events.filter((e) => e.is_premium).map((e) => e.user_id)).size} {tr("adminanalytics_unikal_istifadeci_b11345", "unikal istifad\u0259\xE7i")}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        {/* Startup / SaaS Tab */}
        <TabsContent value="startup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-indigo-100 dark:border-indigo-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-16 h-16" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">MRR (Aylıq Gəlir)</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">₼{startupStats.mrr.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground mt-2">ARR: ₼{startupStats.arr.toLocaleString()}</p>
            </Card>
            
            <Card className="p-5 border-emerald-100 dark:border-emerald-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-16 h-16" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Məhsul Stickiness (DAU/MAU)</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{startupStats.stickiness}%</h3>
              <p className="text-xs text-muted-foreground mt-2">DAU: {startupStats.dau} / MAU: {startupStats.mau}</p>
            </Card>

            <Card className="p-5 border-rose-100 dark:border-rose-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-16 h-16" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Churn Rate (İtgi)</p>
              <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{startupStats.churnRate}%</h3>
              <p className="text-xs text-muted-foreground mt-2">Aktiv Abunələr: {startupStats.activeSubs}</p>
            </Card>

            <Card className="p-5 border-amber-100 dark:border-amber-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <LineChartIcon className="w-16 h-16" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">LTV (Həyat Dəyəri)</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">₼{startupStats.ltv}</h3>
              <p className="text-xs text-muted-foreground mt-2">ARPU: ₼{startupStats.arpu}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Rocket className="w-5 h-5 text-indigo-500" /> SaaS Metrikaları İzahı</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-sm">MRR (Monthly Recurring Revenue)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Aylıq təkrarlanan stabil gəlir. Hər ay avtomatik yenilənən abunəliklərdən gələn təxmini gəliri göstərir. İnvestorlar üçün ən vacib rəqəmdir.</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-sm">Stickiness (DAU/MAU nisbəti)</h4>
                  <p className="text-xs text-muted-foreground mt-1">İstifadəçilərin məhsula bağlılıq dərəcəsi. 20% yaxşı, 30% çox yaxşı hesab olunur. Bu rəqəm aktiv istifadəçilərinizin nə qədərinin tətbiqi HƏR GÜN açdığını göstərir.</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-sm">LTV (Life Time Value)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Bir müştərinin tətbiqdə qaldığı müddət ərzində qazandırdığı ortalama məbləğ. Gələcəkdə reklam verərkən CAC (Müştəri Əldəetmə Xərci) bu rəqəmdən az olmalıdır (LTV:CAC nisbəti 3:1 idealıdır).</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default AdminAnalytics;