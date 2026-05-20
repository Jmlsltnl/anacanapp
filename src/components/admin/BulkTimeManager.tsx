import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Clock, ArrowRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type SourceKey = 'pregnancy_day_notifications' | 'mommy_day_notifications' | 'flow_reminders';

const SOURCES: { key: SourceKey; label: string; timeCol: string; labelCol: string }[] = [
  { key: 'pregnancy_day_notifications', label: 'Hamiləlik (bump)', timeCol: 'send_time', labelCol: 'title' },
  { key: 'mommy_day_notifications', label: 'Ana (mommy)', timeCol: 'send_time', labelCol: 'title' },
  { key: 'flow_reminders', label: 'Tsikl (flow)', timeCol: 'send_time', labelCol: 'title' },
];

/** Normalize "9:00" / "09:00:00" → "09:00" */
function normTime(v: string | null | undefined): string {
  if (!v) return '';
  const [h = '00', m = '00'] = v.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

type Row = { id: string; send_time: string; title?: string; day_number?: number | null };

const BulkTimeManager = () => {
  const [source, setSource] = useState<SourceKey>('pregnancy_day_notifications');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [newTime, setNewTime] = useState<string>('12:00');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const cfg = SOURCES.find((s) => s.key === source)!;

  const load = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const { data, error } = await supabase
        .from(source as any)
        .select('*')
        .limit(5000);
      if (error) throw error;
      const mapped: Row[] = (data ?? []).map((r: any) => ({
        id: r.id,
        send_time: normTime(r[cfg.timeCol]),
        title: r[cfg.labelCol] ?? '—',
        day_number: r.day_number ?? null,
      }));
      setRows(mapped);
    } catch (e: any) {
      toast.error('Yükləmə xətası: ' + (e?.message ?? 'naməlum'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [source]);

  const uniqueTimes = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => counts.set(r.send_time || '—', (counts.get(r.send_time || '—') ?? 0) + 1));
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    if (timeFilter === 'all') return rows;
    return rows.filter((r) => (r.send_time || '—') === timeFilter);
  }, [rows, timeFilter]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((r) => next.delete(r.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((r) => next.add(r.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const applyBulk = async () => {
    if (selected.size === 0) {
      toast.error('Heç bir sətir seçilməyib');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast.error('Yeni saat formatı yanlışdır (HH:MM)');
      return;
    }
    if (!confirm(`${selected.size} sətrin saatı "${newTime}" olaraq dəyişdiriləcək. Davam edək?`)) return;
    setSaving(true);
    try {
      const ids = Array.from(selected);
      const chunk = 500;
      for (let i = 0; i < ids.length; i += chunk) {
        const slice = ids.slice(i, i + chunk);
        const { error } = await supabase
          .from(source as any)
          .update({ [cfg.timeCol]: newTime } as any)
          .in('id', slice);
        if (error) throw error;
      }
      toast.success(`${ids.length} bildirişin saatı ${newTime} oldu`);
      await load();
    } catch (e: any) {
      toast.error('Yeniləmə xətası: ' + (e?.message ?? 'naməlum'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Toplu saat dəyişdirici</h3>
            <p className="text-xs text-muted-foreground">
              Mənbə seçin → mövcud saata görə filterləyin → yeni saatı təyin edib seçilənləri toplu yeniləyin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Mənbə</Label>
            <Select value={source} onValueChange={(v) => setSource(v as SourceKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Mövcud saat filteri</Label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamısı ({rows.length})</SelectItem>
                {uniqueTimes.map(([t, c]) => (
                  <SelectItem key={t} value={t}>{t} ({c})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Yeni saat (HH:MM)</Label>
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={applyBulk} disabled={saving || selected.size === 0} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-1" />}
              {selected.size} sətrə tətbiq et
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Cəmi yüklənən: {rows.length}</Badge>
          <Badge variant="outline">Filterlənmiş: {filtered.length}</Badge>
          <Badge variant="secondary">Seçilmiş: {selected.size}</Badge>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null} Yenilə
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th className="p-2 text-left w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th className="p-2 text-left">Saat</th>
                {source !== 'flow_reminders' && <th className="p-2 text-left">Gün</th>}
                <th className="p-2 text-left">Başlıq</th>
                <th className="p-2 text-left">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="p-2">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                  </td>
                  <td className="p-2 font-mono">{r.send_time || '—'}</td>
                  {source !== 'flow_reminders' && <td className="p-2">{r.day_number ?? '—'}</td>}
                  <td className="p-2 truncate max-w-md">{r.title}</td>
                  <td className="p-2 font-mono text-muted-foreground truncate max-w-[180px]">{r.id}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sətir yoxdur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BulkTimeManager;
