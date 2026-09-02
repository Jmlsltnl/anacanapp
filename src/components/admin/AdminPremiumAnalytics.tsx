import { useEffect, useMemo, useState } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import {
  Crown, Users, Clock, XCircle, AlertTriangle, Gift, Search, Globe2,
  TrendingDown, CalendarClock, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import countriesData from '../../../countries.json';
import { fetchAllRows } from '@/lib/supabaseFetchAll';

interface Country {
  id: number;
  name: string;
  isoAlpha2: string;
  flag: string;
}
const COUNTRIES = countriesData as Country[];
const countryByCode = new Map(COUNTRIES.map((c) => [c.isoAlpha2, c]));

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'premium_plus';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  is_trial?: boolean;
  cancelled_at?: string | null;
}

interface ProfileRow {
  user_id: string;
  name: string | null;
  email: string | null;
  country_code: string | null;
  life_stage: string | null;
}

interface CancellationRow {
  id: string;
  user_id: string;
  reason_code: string;
  reason_text: string | null;
  plan_type: string | null;
  was_trial: boolean;
  cancel_flow: 'in_app' | 'store_reported';
  created_at: string;
}

const COLORS = ['#f28155', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

// tr() ilə — admin paneli də tam multilanguage olmalıdır
function reasonLabel(code: string): string {
  const labels: Record<string, string> = {
    too_expensive: tr('adminpremium_reason_too_expensive', 'Qiymət baha oldu'),
    not_using_enough: tr('adminpremium_reason_not_using_enough', 'Kifayət qədər istifadə etmədi'),
    missing_features: tr('adminpremium_reason_missing_features', 'İstədiyi funksiya yox idi'),
    technical_issues: tr('adminpremium_reason_technical_issues', 'Texniki problem'),
    found_alternative: tr('adminpremium_reason_found_alternative', 'Alternativ tapdı'),
    temporary_break: tr('adminpremium_reason_temporary_break', 'Müvəqqəti fasilə'),
    other: tr('adminpremium_reason_other', 'Digər'),
    store_unsubscribe: tr('adminpremium_reason_store_unsubscribe', 'Mağazadan ləğv (özü)'),
    store_billing_error: tr('adminpremium_reason_store_billing_error', 'Ödəniş xətası'),
    store_customer_support: tr('adminpremium_reason_store_customer_support', 'Dəstək xidməti'),
    store_price_increase: tr('adminpremium_reason_store_price_increase', 'Qiymət artımı'),
    store_developer_initiated: tr('adminpremium_reason_store_developer_initiated', 'Tərəfimizdən ləğv'),
    store_unknown: tr('adminpremium_reason_store_unknown', 'Naməlum (mağaza)'),
  };
  return labels[code] || code;
}

type StatusFilter = 'all' | 'premium' | 'trial' | 'cancelled' | 'expired' | 'free';

const AdminPremiumAnalytics = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'expires_at' | 'started_at'>('expires_at');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // DÜZƏLİŞ: bu 3 sorğu əvvəllər `.select('*')` ilə HEÇ BİR limit/range
      // olmadan çağırılırdı — Supabase/PostgREST-in defolt "db-max-rows"
      // (1000) həddi SƏSSİZCƏ tətbiq olunurdu, ona görə profiles/subscriptions
      // 1000-dən çox olanda (bizdə qat-qat çoxdur) YALNIZ ilk 1000 sətir
      // gəlirdi — bütün KPI/faiz/ölkə hesablamaları səhv idi. İndi
      // fetchAllRows() ilə .range() loop-u vasitəsilə BÜTÜN sətirlər gətirilir.
      // DİQQƏT: 'subscription_cancellations' hələ generated types.ts-də yoxdur
      // (Duzelis51.sql tətbiq olunana/tiplər yenilənənə qədər) — `as any` ilə keçici həll.
      const [subs, profilesData, cancellationsData] = await Promise.all([
        fetchAllRows((from, to) =>
          supabase.from('subscriptions').select('*').range(from, to)
        ),
        fetchAllRows<ProfileRow>((from, to) =>
          supabase.from('profiles').select('user_id, name, email, country_code, life_stage').range(from, to)
        ),
        fetchAllRows((from, to) =>
          supabase.from('subscription_cancellations' as any).select('*').order('created_at', { ascending: false }).range(from, to)
        ),
      ]);
      setSubscriptions(subs as unknown as SubscriptionRow[]);
      setProfiles(profilesData);
      setCancellations(cancellationsData as unknown as CancellationRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const profileByUserId = useMemo(() => {
    const map = new Map<string, ProfileRow>();
    profiles.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [profiles]);

  // ── Ümumi KPI-lər ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = subscriptions.length;
    const premiumActive = subscriptions.filter((s) => s.status === 'active' && s.plan_type !== 'free' && !s.is_trial);
    const trialActive = subscriptions.filter((s) => s.status === 'active' && s.plan_type !== 'free' && s.is_trial);
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
    const expired = subscriptions.filter((s) => s.status === 'expired');
    const free = subscriptions.filter((s) => s.plan_type === 'free' && s.status !== 'cancelled');
    const payingTotal = premiumActive.length + cancelled.length; // cancelled = hələ çıxışı var, ödəniş edib
    const churnRate = payingTotal > 0 ? ((cancelled.length / (payingTotal + expired.length)) * 100) : 0;
    return {
      total,
      premiumActive: premiumActive.length,
      trialActive: trialActive.length,
      cancelled: cancelled.length,
      expired: expired.length,
      free: free.length,
      churnRate,
    };
  }, [subscriptions]);

  // ── Plan tipi bölgüsü (pie chart) ─────────────────────────────
  const planBreakdown = useMemo(() => {
    const premiumPlus = subscriptions.filter((s) => s.status === 'active' && s.plan_type === 'premium_plus').length;
    const premium = subscriptions.filter((s) => s.status === 'active' && s.plan_type === 'premium').length;
    const trial = kpis.trialActive;
    const free = kpis.free;
    return [
      { name: tr('adminpremium_plan_premium', 'Premium'), value: premium },
      { name: tr('adminpremium_plan_premium_plus', 'Premium Plus'), value: premiumPlus },
      { name: tr('adminpremium_plan_trial', 'Free Trial'), value: trial },
      { name: tr('adminpremium_plan_free', 'Pulsuz'), value: free },
    ].filter((d) => d.value > 0);
  }, [subscriptions, kpis]);

  // ── Ölkə üzrə bölgü ────────────────────────────────────────────
  const countryBreakdown = useMemo(() => {
    const map = new Map<string, { code: string; total: number; premium: number; trial: number }>();
    profiles.forEach((p) => {
      const code = p.country_code || '??';
      if (!map.has(code)) map.set(code, { code, total: 0, premium: 0, trial: 0 });
      const entry = map.get(code)!;
      entry.total++;
      const sub = subscriptions.find((s) => s.user_id === p.user_id);
      if (sub?.status === 'active' && sub.plan_type !== 'free') {
        if (sub.is_trial) entry.trial++;
        else entry.premium++;
      }
    });
    return Array.from(map.values())
      .filter((e) => e.code !== '??')
      .sort((a, b) => b.premium + b.trial - (a.premium + a.trial));
  }, [profiles, subscriptions]);

  // ── Ləğv səbəbləri bölgüsü ─────────────────────────────────────
  const reasonBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    cancellations.forEach((c) => {
      map.set(c.reason_code, (map.get(c.reason_code) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([code, count]) => ({ code, label: reasonLabel(code), count }))
      .sort((a, b) => b.count - a.count);
  }, [cancellations]);

  const inAppReasonsCount = cancellations.filter((c) => c.cancel_flow === 'in_app').length;
  const storeReasonsCount = cancellations.filter((c) => c.cancel_flow === 'store_reported').length;

  // ── Yaxınlaşan bitmə tarixləri (30 gün) ────────────────────────
  const expiringSoon = useMemo(() => {
    const now = new Date();
    return subscriptions
      .filter((s) => s.expires_at && s.status !== 'expired' && s.plan_type !== 'free')
      .map((s) => ({ ...s, daysLeft: differenceInCalendarDays(new Date(s.expires_at!), now) }))
      .filter((s) => s.daysLeft >= 0 && s.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  // ── Detallı, axtarıla/filtrlənə bilən cədvəl ───────────────────
  const detailedRows = useMemo(() => {
    let rows = subscriptions.map((s) => {
      const profile = profileByUserId.get(s.user_id);
      return { ...s, name: profile?.name || '—', email: profile?.email || '—', country: profile?.country_code || null };
    });

    if (statusFilter === 'premium') rows = rows.filter((r) => r.status === 'active' && r.plan_type !== 'free' && !r.is_trial);
    else if (statusFilter === 'trial') rows = rows.filter((r) => r.status === 'active' && r.is_trial);
    else if (statusFilter === 'cancelled') rows = rows.filter((r) => r.status === 'cancelled');
    else if (statusFilter === 'expired') rows = rows.filter((r) => r.status === 'expired');
    else if (statusFilter === 'free') rows = rows.filter((r) => r.plan_type === 'free');

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
    }

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortKey === 'expires_at') cmp = new Date(a.expires_at || 0).getTime() - new Date(b.expires_at || 0).getTime();
      else cmp = new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime();
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [subscriptions, profileByUserId, statusFilter, search, sortKey, sortAsc]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const statusBadge = (row: SubscriptionRow) => {
    if (row.status === 'active' && row.is_trial) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Gift className="w-3 h-3 me-1" />{tr('adminpremium_trial_badge', 'Trial')}</Badge>;
    if (row.status === 'active' && row.plan_type !== 'free') return <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:opacity-90"><Crown className="w-3 h-3 me-1" />{row.plan_type === 'premium_plus' ? 'Premium+' : 'Premium'}</Badge>;
    if (row.status === 'cancelled') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><AlertTriangle className="w-3 h-3 me-1" />{tr('adminpremium_cancelled_badge', 'Ləğv edilib')}</Badge>;
    if (row.status === 'expired') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 me-1" />{tr('adminpremium_expired_badge', 'Bitib')}</Badge>;
    return <Badge variant="outline">{tr('adminpremium_free_badge', 'Pulsuz')}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { label: tr('adminpremium_kpi_total', 'Ümumi İstifadəçi'), value: kpis.total, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: tr('adminpremium_kpi_premium', 'Aktiv Premium'), value: kpis.premiumActive, icon: Crown, color: 'bg-amber-100 text-amber-600' },
    { label: tr('adminpremium_kpi_trial', 'Free Trial-da'), value: kpis.trialActive, icon: Gift, color: 'bg-blue-100 text-blue-600' },
    { label: tr('adminpremium_kpi_cancelled', 'Ləğv edilib (giriş var)'), value: kpis.cancelled, icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
    { label: tr('adminpremium_kpi_expired', 'Bitib'), value: kpis.expired, icon: XCircle, color: 'bg-red-100 text-red-600' },
    { label: tr('adminpremium_kpi_churn', 'Churn Nisbəti'), value: `${kpis.churnRate.toFixed(1)}%`, icon: TrendingDown, color: 'bg-purple-100 text-purple-600' },
  ];

  const visibleCountries = showAllCountries ? countryBreakdown : countryBreakdown.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold">{tr('adminpremium_title', 'Premium Analitika')}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-card rounded-xl p-4 border border-border">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
              <k.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan bölgüsü */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-4">{tr('adminpremium_plan_breakdown', 'Plan Tipi Bölgüsü')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(e) => `${e.name}: ${e.value}`}>
                  {planBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ləğv səbəbləri */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{tr('adminpremium_cancel_reasons', 'Ləğv Səbəbləri')}</h3>
            <div className="text-xs text-muted-foreground">
              {tr('adminpremium_reasons_in_app', 'Tətbiq-daxili')}: {inAppReasonsCount} · {tr('adminpremium_reasons_store', 'Mağaza')}: {storeReasonsCount}
            </div>
          </div>
          {reasonBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{tr('adminpremium_no_cancellations', 'Hələ heç bir ləğv qeydə alınmayıb')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonBreakdown} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#f28155" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Ölkə üzrə bölgü */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe2 className="w-4 h-4" />{tr('adminpremium_by_country', 'Ölkələr Üzrə Premium')}</h3>
        <div className="space-y-2">
          {visibleCountries.map((c) => {
            const country = countryByCode.get(c.code);
            const pct = c.total > 0 ? (((c.premium + c.trial) / c.total) * 100).toFixed(1) : '0';
            return (
              <div key={c.code} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                {country?.flag && <img src={country.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{country?.name || c.code}</span>
                <span className="text-xs text-muted-foreground shrink-0">{tr('adminpremium_total_users', 'ümumi')}: {c.total}</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0"><Crown className="w-3 h-3 me-1" />{c.premium}</Badge>
                {c.trial > 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0"><Gift className="w-3 h-3 me-1" />{c.trial}</Badge>}
                <span className="text-xs font-semibold text-muted-foreground shrink-0 w-12 text-end">{pct}%</span>
              </div>
            );
          })}
        </div>
        {countryBreakdown.length > 8 && (
          <button onClick={() => setShowAllCountries(!showAllCountries)} className="text-xs font-semibold text-primary mt-3 flex items-center gap-1">
            {showAllCountries ? tr('adminpremium_show_less', 'Az göstər') : tr('adminpremium_show_all', 'Hamısını göstər ({n})').replace('{n}', String(countryBreakdown.length))}
            {showAllCountries ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Yaxınlaşan bitmə tarixləri */}
      {expiringSoon.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><CalendarClock className="w-4 h-4" />{tr('adminpremium_expiring_soon', 'Növbəti 30 Gündə Bitəcək')} ({expiringSoon.length})</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {expiringSoon.map((s) => {
              const profile = profileByUserId.get(s.user_id);
              return (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="font-medium truncate flex-1">{profile?.name || profile?.email || s.user_id.slice(0, 8)}</span>
                  {statusBadge(s)}
                  <span className={`text-xs font-semibold ms-3 shrink-0 ${s.daysLeft <= 3 ? 'text-red-600' : s.daysLeft <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {s.daysLeft === 0 ? tr('adminpremium_today', 'bu gün') : tr('adminpremium_days_left', '{n} gün qalıb').replace('{n}', String(s.daysLeft))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detallı cədvəl */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('adminpremium_search_placeholder', 'Ad və ya email axtar...')} className="ps-10" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'premium', 'trial', 'cancelled', 'expired', 'free'] as StatusFilter[]).map((f) => (
              <Button key={f} size="sm" variant={statusFilter === f ? 'default' : 'outline'} onClick={() => setStatusFilter(f)}>
                {{
                  all: tr('adminpremium_filter_all', 'Hamısı'),
                  premium: 'Premium',
                  trial: 'Trial',
                  cancelled: tr('adminpremium_filter_cancelled', 'Ləğv'),
                  expired: tr('adminpremium_filter_expired', 'Bitib'),
                  free: tr('adminpremium_filter_free', 'Pulsuz'),
                }[f]}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-start py-2 px-2 cursor-pointer select-none" onClick={() => toggleSort('name')}>{tr('adminpremium_col_user', 'İstifadəçi')} {sortKey === 'name' && (sortAsc ? '↑' : '↓')}</th>
                <th className="text-start py-2 px-2">{tr('adminpremium_col_country', 'Ölkə')}</th>
                <th className="text-start py-2 px-2">{tr('adminpremium_col_status', 'Status')}</th>
                <th className="text-start py-2 px-2 cursor-pointer select-none" onClick={() => toggleSort('started_at')}>{tr('adminpremium_col_started', 'Başladı')} {sortKey === 'started_at' && (sortAsc ? '↑' : '↓')}</th>
                <th className="text-start py-2 px-2 cursor-pointer select-none" onClick={() => toggleSort('expires_at')}>{tr('adminpremium_col_expires', 'Bitir/Bitib')} {sortKey === 'expires_at' && (sortAsc ? '↑' : '↓')}</th>
              </tr>
            </thead>
            <tbody>
              {detailedRows.slice(0, 200).map((row) => {
                const country = row.country ? countryByCode.get(row.country) : null;
                return (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-2">
                      <div className="font-medium truncate max-w-[160px]">{row.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{row.email}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        {country?.flag && <img src={country.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                        <span className="text-xs">{country?.isoAlpha2 || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">{statusBadge(row)}</td>
                    <td className="py-2 px-2 text-xs">{row.started_at ? format(new Date(row.started_at), 'dd.MM.yyyy') : '—'}</td>
                    <td className="py-2 px-2 text-xs">{row.expires_at ? format(new Date(row.expires_at), 'dd.MM.yyyy') : '—'}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {detailedRows.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">{tr('adminpremium_no_results', 'Nəticə tapılmadı')}</p>
          )}
          {detailedRows.length > 200 && (
            <p className="text-center text-muted-foreground py-3 text-xs">{tr('adminpremium_showing_first_200', 'İlk 200 nəticə göstərilir (cəmi {n})').replace('{n}', String(detailedRows.length))}</p>
          )}
        </div>
      </div>

      {/* Son ləğv rəyləri (mətn olanlar) */}
      {cancellations.some((c) => c.reason_text) && (
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold mb-4">{tr('adminpremium_recent_feedback', 'Son Ətraflı Rəylər')}</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {cancellations.filter((c) => c.reason_text).slice(0, 30).map((c) => {
              const profile = profileByUserId.get(c.user_id);
              return (
                <div key={c.id} className="p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{profile?.name || profile?.email || c.user_id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'dd.MM.yyyy HH:mm')}</span>
                  </div>
                  <Badge variant="outline" className="text-xs mb-1.5">{reasonLabel(c.reason_code)}</Badge>
                  <p className="text-sm text-foreground/90">{c.reason_text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPremiumAnalytics;
