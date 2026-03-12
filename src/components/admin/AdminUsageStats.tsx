import { useState, useEffect, useMemo } from 'react';
import { Activity, Users, TrendingUp, Clock, RefreshCw, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { az } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UsageUser {
  user_id: string;
  count: number;
  name?: string;
  email?: string;
  is_premium?: boolean;
  last_used?: string;
}

interface AdminUsageStatsProps {
  /** Event names to filter by */
  eventNames: string[];
  /** Title shown above the stats */
  title: string;
  /** Whether to show the detailed user table */
  showUsers?: boolean;
  /** Whether to show event_data details */
  showEventData?: boolean;
  /** Label mapping for event_data keys */
  dataLabels?: Record<string, string>;
}

const AdminUsageStats = ({ eventNames, title, showUsers = true, showEventData = false, dataLabels }: AdminUsageStatsProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<UsageUser[]>([]);
  const [profiles, setProfiles] = useState<Map<string, { name: string; email: string | null; is_premium: boolean }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sinceDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .in('event_name', eventNames)
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;
      const evts = data || [];
      setEvents(evts);

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(evts.map(e => e.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, name, email, is_premium')
          .in('user_id', userIds.slice(0, 100));
        
        const profileMap = new Map<string, { name: string; email: string | null; is_premium: boolean }>();
        profileData?.forEach(p => profileMap.set(p.user_id, { name: p.name || 'İstifadəçi', email: p.email, is_premium: p.is_premium || false }));
        setProfiles(profileMap);

        // Build user stats
        const userCounts = new Map<string, { count: number; last_used: string }>();
        evts.forEach(e => {
          const existing = userCounts.get(e.user_id);
          if (!existing || e.created_at > existing.last_used) {
            userCounts.set(e.user_id, { 
              count: (existing?.count || 0) + 1, 
              last_used: e.created_at 
            });
          } else {
            existing.count++;
          }
        });

        const usersArr: UsageUser[] = Array.from(userCounts.entries())
          .map(([userId, { count, last_used }]) => {
            const profile = profileMap.get(userId);
            return {
              user_id: userId,
              count,
              name: profile?.name || 'Naməlum',
              email: profile?.email || '',
              is_premium: profile?.is_premium || false,
              last_used,
            };
          })
          .sort((a, b) => b.count - a.count);
        setUsers(usersArr);
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange, eventNames.join(',')]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const totalCount = events.length;
  const uniqueUsers = new Set(events.map(e => e.user_id)).size;
  const premiumUsers = new Set(events.filter(e => e.is_premium).map(e => e.user_id)).size;

  // Daily trend
  const dailyTrend = useMemo(() => {
    const days = Math.min(parseInt(dateRange), 14);
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCount = events.filter(e => e.created_at?.startsWith(dateStr)).length;
      trend.push({ date: format(date, 'dd MMM', { locale: az }), count: dayCount });
    }
    return trend;
  }, [events, dateRange]);

  // Event data breakdown (e.g. which tool_id, which style, etc.)
  const eventDataBreakdown = useMemo(() => {
    if (!showEventData) return [];
    const counts = new Map<string, number>();
    events.forEach(e => {
      const data = e.event_data as Record<string, any>;
      if (data) {
        const key = Object.values(data).filter(Boolean).join(' / ') || 'Bilinmir';
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [events, showEventData]);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Bu gün</SelectItem>
              <SelectItem value="7">7 gün</SelectItem>
              <SelectItem value="30">30 gün</SelectItem>
              <SelectItem value="90">90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{loading ? '...' : totalCount}</p>
          <p className="text-xs text-muted-foreground">Cəmi istifadə</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{loading ? '...' : uniqueUsers}</p>
          <p className="text-xs text-muted-foreground">Unikal istifadəçi</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{loading ? '...' : premiumUsers}</p>
          <p className="text-xs text-muted-foreground">Premium istifadəçi</p>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyTrend.length > 0 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="İstifadə" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event Data Breakdown */}
      {showEventData && eventDataBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Detallı Paylanma</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {eventDataBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-sm">
                <span className="truncate flex-1">{item.label}</span>
                <span className="font-semibold ml-2">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Table */}
      {showUsers && users.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Ən aktiv istifadəçilər</h4>
          <div className="rounded-md border max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">İstifadəçi</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs text-center">Premium</TableHead>
                  <TableHead className="text-xs text-right">Sayı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 15).map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="text-xs font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-center">
                      {u.is_premium ? <span className="text-xs bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Premium</span> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs">{u.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!loading && events.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">Bu müddətdə istifadə məlumatı yoxdur</p>
      )}
    </Card>
  );
};

export default AdminUsageStats;
