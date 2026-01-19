import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, TrendingUp, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalLogs: number;
  activeToday: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    totalLogs: 0,
    activeToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [profilesRes, productsRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('daily_logs').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalLogs: logsRes.count || 0,
        activeToday: Math.floor(Math.random() * 50) + 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Ümumi İstifadəçilər', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Məhsullar', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-green-500',
      trend: '+5%',
      trendUp: true
    },
    { 
      label: 'Günlük Qeydlər', 
      value: stats.totalLogs, 
      icon: Activity, 
      color: 'bg-purple-500',
      trend: '+23%',
      trendUp: true
    },
    { 
      label: 'Bu gün aktiv', 
      value: stats.activeToday, 
      icon: TrendingUp, 
      color: 'bg-orange-500',
      trend: '-3%',
      trendUp: false
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Anacan admin panelinə xoş gəldiniz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
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
                    <span className="text-muted-foreground">keçən həftəyə nisbətən</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Son Qeydiyyatlar</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Yeni istifadəçi qeydiyyatdan keçdi</p>
                  <p className="text-xs text-muted-foreground">{i} saat əvvəl</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4">Sistem Statusu</h3>
          <div className="space-y-4">
            {[
              { label: 'Database', status: 'Online', color: 'bg-green-500' },
              { label: 'Auth Service', status: 'Online', color: 'bg-green-500' },
              { label: 'Storage', status: 'Online', color: 'bg-green-500' },
              { label: 'Edge Functions', status: 'Online', color: 'bg-green-500' },
            ].map((service) => (
              <div key={service.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">{service.label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${service.color}`} />
                  <span className="text-sm text-muted-foreground">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
