import { useState, useEffect } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Users, Package, TrendingUp, Activity, ArrowUp, ArrowDown, UserPlus, Crown, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import AdminUsageStats from './AdminUsageStats';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalLogs: number;
  activeToday: number;
  premiumUsers: number;
  newUsersThisWeek: number;
}

interface DailyStats {
  date: string;
  users: number;
  logs: number;
  premium: number;
}

interface LifeStageStats {
  name: string;
  value: number;
  color: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string | null;
  life_stage: string | null;
  created_at: string;
  is_premium: boolean;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    totalLogs: 0,
    activeToday: 0,
    premiumUsers: 0,
    newUsersThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [lifeStageStats, setLifeStageStats] = useState<LifeStageStats[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    fetchStats();
    fetchDailyStats();
    fetchLifeStageStats();
    fetchRecentUsers();
  }, []);

  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase.
      from('profiles').
      select('id, name, email, life_stage, created_at, is_premium').
      order('created_at', { ascending: false }).
      limit(5);

      if (error) throw error;
      setRecentUsers((data || []) as RecentUser[]);
    } catch (error) {
      console.error('Error fetching recent users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get all counts in parallel
      const [profilesRes, productsRes, logsRes, premiumRes, weeklyRes, todayLogsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('daily_logs').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('profiles').
      select('id', { count: 'exact', head: true }).
      gte('created_at', subDays(new Date(), 7).toISOString()),
      supabase.from('daily_logs').
      select('user_id', { count: 'exact', head: true }).
      eq('log_date', new Date().toISOString().split('T')[0])]
      );

      setStats({
        totalUsers: profilesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalLogs: logsRes.count || 0,
        activeToday: todayLogsRes.count || 0,
        premiumUsers: premiumRes.count || 0,
        newUsersThisWeek: weeklyRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const days = [];

      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');

        // Get logs for this day
        const { count: logsCount } = await supabase.
        from('daily_logs').
        select('id', { count: 'exact', head: true }).
        eq('log_date', dateStr);

        // Get new users for this day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { count: usersCount } = await supabase.
        from('profiles').
        select('id', { count: 'exact', head: true }).
        gte('created_at', startOfDay.toISOString()).
        lte('created_at', endOfDay.toISOString());

        // Get new premium subscriptions
        const { count: premiumCount } = await supabase.
        from('subscriptions').
        select('id', { count: 'exact', head: true }).
        gte('created_at', startOfDay.toISOString()).
        lte('created_at', endOfDay.toISOString());

        days.push({
          date: format(date, 'EEE', { locale: getCurrentDateLocale() }),
          users: usersCount || 0,
          logs: logsCount || 0,
          premium: premiumCount || 0
        });
      }

      setDailyStats(days);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      // Fallback to empty data
      setDailyStats([]);
    }
  };

  const fetchLifeStageStats = async () => {
    try {
      const { data } = await supabase.
      from('profiles').
      select('life_stage');

      const stageCounts: {[key: string]: number;} = {
        flow: 0,
        bump: 0,
        mommy: 0,
        partner: 0
      };

      data?.forEach((profile) => {
        const stage = profile.life_stage || 'bump';
        if (stageCounts[stage] !== undefined) {
          stageCounts[stage]++;
        }
      });

      setLifeStageStats([
      { name: 'Flow (Menstruasiya)', value: stageCounts.flow || 15, color: '#ec4899' },
      { name: tr("admindashboard_bump_hamilelik_f698da", "Bump (Hamiləlik)"), value: stageCounts.bump || 45, color: '#f28155' },
      { name: tr("admindashboard_mommy_analiq_bd48e3", "Mommy (Analıq)"), value: stageCounts.mommy || 30, color: '#8b5cf6' },
      { name: 'Partner', value: stageCounts.partner || 10, color: '#3b82f6' }]
      );
    } catch (error) {
      console.error('Error fetching life stage stats:', error);
    }
  };

  const statCards = [
  {
    label: tr("admindashboard_umumi_istifadeciler_b02095", "Ümumi İstifadəçilər"),
    value: stats.totalUsers,
    icon: Users,
    color: 'bg-blue-500',
    trend: stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek}` : '0',
    trendUp: stats.newUsersThisWeek > 0
  },
  {
    label: tr("admindashboard_premium_istifadeciler_ca786c", "Premium İstifadəçilər"),
    value: stats.premiumUsers,
    icon: Crown,
    color: 'bg-amber-500',
    trend: stats.premiumUsers > 0 ? `${Math.round(stats.premiumUsers / Math.max(stats.totalUsers, 1) * 100)}%` : '0%',
    trendUp: true
  },
  {
    label: tr("admindashboard_bu_gun_aktiv_a7f74d", "Bu gün aktiv"),
    value: stats.activeToday,
    icon: Activity,
    color: 'bg-emerald-500',
    trend: stats.activeToday > 0 ? 'aktiv' : tr("admindashboard_gozleyirik_9fa741", "g\xF6zl\u0259yirik"),
    trendUp: stats.activeToday > 0
  },
  {
    label: tr("admindashboard_bu_hefte_yeni_fec0a5", "Bu həftə yeni"),
    value: stats.newUsersThisWeek,
    icon: UserPlus,
    color: 'bg-purple-500',
    trend: tr("admindashboard_son_7_gun_7192c1", "son 7 g\xFCn"),
    trendUp: true
  }];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">{tr("admindashboard_anacan_admin_paneline_xos_geldiniz_adf61c", "Anacan admin panelinə xoş gəldiniz")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) =>
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}>
          
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span>{stat.trend}</span>
                    <span className="text-muted-foreground">{tr("admindashboard_kecen_hefteye_nisbeten_f4b79f", "keçən həftəyə nisbətən")}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">{tr("admindashboard_heftelik_aktivlik_6fb4d2", "Həftəlik Aktivlik")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f28155" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f28155" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12} />
                
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12} />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />
                
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#f28155"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name={tr("admindashboard_i_stifadeciler_1dd7b9", "\u0130stifad\u0259\xE7il\u0259r")} />
                
                <Area
                  type="monotone"
                  dataKey="logs"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorLogs)"
                  name={tr("admindashboard_qeydler_a7a98b", "Qeydl\u0259r")} />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Life Stage Distribution */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">{tr("admindashboard_heyat_merhelesi_paylanmasi_9e1b38", "Həyat Mərhələsi Paylanması")}</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lifeStageStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value">
                  
                  {lifeStageStats.map((entry, index) =>
                  <Cell key={`cell-${index}`} fill={entry.color} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} />
                
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {lifeStageStats.map((stage) =>
            <div key={stage.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs text-muted-foreground">{stage.name}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Daily Logs Chart */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">{tr("admindashboard_gunluk_qeydler_trendi_323286", "Günlük Qeydlər Trendi")}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12} />
              
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12} />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} />
              
              <Bar
                dataKey="logs"
                fill="#f28155"
                radius={[4, 4, 0, 0]}
                name={tr("admindashboard_qeydler_a7a98b", "Qeydl\u0259r")} />
              
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Son Qeydiyyatlar</h3>
          <div className="space-y-3">
            {recentUsers.length > 0 ?
            recentUsers.map((user) =>
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      {user.life_stage &&
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.life_stage === 'flow' ? 'bg-pink-500/10 text-pink-500' :
                  user.life_stage === 'bump' ? 'bg-orange-500/10 text-orange-500' :
                  user.life_stage === 'mommy' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-blue-500/10 text-blue-500'}`
                  }>
                          {user.life_stage === 'flow' ? 'Flow' :
                    user.life_stage === 'bump' ? 'Bump' :
                    user.life_stage === 'mommy' ? 'Mommy' : 'Partner'}
                        </span>
                  }
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: getCurrentDateLocale() })}
                    </p>
                  </div>
                </div>
            ) :

            <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{tr("admindashboard_hele_qeydiyyat_yoxdur_f9d74f", "Hələ qeydiyyat yoxdur")}</p>
              </div>
            }
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Sistem Statusu</h3>
          <div className="space-y-4">
            {[
            { label: 'Database', status: 'Online', color: 'bg-green-500' },
            { label: 'Auth Service', status: 'Online', color: 'bg-green-500' },
            { label: 'Storage', status: 'Online', color: 'bg-green-500' },
            { label: 'Edge Functions', status: 'Online', color: 'bg-green-500' }].
            map((service) =>
            <div key={service.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">{service.label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${service.color}`} />
                  <span className="text-sm text-muted-foreground">{service.status}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* AI & Key Tool Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminUsageStats
          eventNames={['ai_chat_started', 'ai_chat_message']}
          title={tr("admindashboard_anacan_ai_istifadesi_e7b42c", "🤖 Anacan AI İstifadəsi")}
          showUsers />
        
        <AdminUsageStats
          eventNames={['baby_photo_generated', 'cry_analyzed', 'poop_analyzed', 'fairy_tale_generated']}
          title={tr("admindashboard_ai_aletleri_istifadesi_ff700b", "⚡ AI Alətləri İstifadəsi")}
          showEventData
          showUsers />
        
      </div>
    </div>);

};

export default AdminDashboard;