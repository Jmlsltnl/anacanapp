import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Syringe, CheckCircle2, Clock, AlertTriangle, Ban,
  Info, Globe, ExternalLink, X, Calendar as CalendarIcon, Sparkles, ChevronDown,
} from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import {
  useVaccineCountries, useVaccineScheduleForCountry, useChildVaccinations,
  useUpsertChildVaccination, useDeleteChildVaccination,
  type VaccineScheduleRow, type ChildVaccination,
} from '@/hooks/useVaccines';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onBack: () => void;
}

type TabKey = 'upcoming' | 'all' | 'done';

const STATUS = {
  done: { label: 'Vuruldu', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  pending: { label: 'Gözləmədə', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  overdue: { label: 'Gecikdi', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
  skipped: { label: 'Buraxıldı', icon: Ban, color: 'text-gray-500', bg: 'bg-gray-100', ring: 'ring-gray-200' },
  future:  { label: 'Növbədə', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
} as const;

type StatusKey = keyof typeof STATUS;

const dayDiffFromBirth = (birthDate: string) => {
  const b = new Date(birthDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - b.getTime()) / 86400000);
};

const formatDateAz = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' });
};

const computeStatus = (row: VaccineScheduleRow, ageDays: number, log?: ChildVaccination | null): StatusKey => {
  if (log?.administered_at) return 'done';
  if (log?.is_skipped) return 'skipped';
  const max = row.max_age_days ?? (row.recommended_age_days + 60);
  if (ageDays > max) return 'overdue';
  if (ageDays >= (row.min_age_days ?? row.recommended_age_days)) return 'pending';
  return 'future';
};

const groupByAge = (rows: VaccineScheduleRow[]) => {
  const groups = new Map<string, { label: string; days: number; rows: VaccineScheduleRow[] }>();
  rows.forEach(r => {
    const key = r.age_label_az;
    if (!groups.has(key)) groups.set(key, { label: key, days: r.recommended_age_days, rows: [] });
    groups.get(key)!.rows.push(r);
  });
  return Array.from(groups.values()).sort((a, b) => a.days - b.days);
};

export default function VaccineCalendar({ onBack }: Props) {
  const { children, selectedChild, setSelectedChild, getChildAge } = useChildren();
  const { data: countries = [] } = useVaccineCountries();
  const { toast } = useToast();
  const qc = useQueryClient();

  const childCountry = (selectedChild as any)?.country_code || 'AZ';
  const [countryCode, setCountryCode] = useState<string>(childCountry);
  const effectiveCountry = countryCode || childCountry;

  const { data: schedule = [], isLoading: schedLoading } = useVaccineScheduleForCountry(effectiveCountry);
  const { data: logs = [] } = useChildVaccinations(selectedChild?.id || null);
  const upsert = useUpsertChildVaccination();
  const del = useDeleteChildVaccination();

  const [tab, setTab] = useState<TabKey>('upcoming');
  const [detailRow, setDetailRow] = useState<VaccineScheduleRow | null>(null);
  const [actionRow, setActionRow] = useState<VaccineScheduleRow | null>(null);
  const [actionMode, setActionMode] = useState<'done' | 'skip' | null>(null);

  const ageDays = selectedChild ? getChildAge(selectedChild).days : 0;

  const rowsWithStatus = useMemo(() => {
    const logMap = new Map(logs.map(l => [l.vaccine_schedule_id, l]));
    return schedule.map(r => {
      const log = logMap.get(r.id) || null;
      return { row: r, log, status: computeStatus(r, ageDays, log) };
    });
  }, [schedule, logs, ageDays]);

  const stats = useMemo(() => {
    const total = rowsWithStatus.length;
    const done = rowsWithStatus.filter(x => x.status === 'done').length;
    const overdue = rowsWithStatus.filter(x => x.status === 'overdue').length;
    const upcoming = rowsWithStatus.filter(x => x.status === 'pending' || x.status === 'overdue').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, overdue, upcoming, pct };
  }, [rowsWithStatus]);

  const upcomingRows = rowsWithStatus
    .filter(x => x.status === 'overdue' || x.status === 'pending' || x.status === 'future')
    .sort((a, b) => a.row.recommended_age_days - b.row.recommended_age_days)
    .slice(0, 30);

  const doneRows = rowsWithStatus
    .filter(x => x.status === 'done')
    .sort((a, b) => (b.log?.administered_at || '').localeCompare(a.log?.administered_at || ''));

  const groupedAll = groupByAge(schedule);
  const country = countries.find(c => c.code === effectiveCountry);

  const handleChangeCountry = async (code: string) => {
    setCountryCode(code);
    if (selectedChild) {
      await supabase.from('user_children').update({ country_code: code } as any).eq('id', selectedChild.id);
      qc.invalidateQueries({ queryKey: ['children'] });
    }
  };

  const renderStatusBadge = (s: StatusKey) => {
    const meta = STATUS[s];
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </span>
    );
  };

  const renderCard = (item: { row: VaccineScheduleRow; log: ChildVaccination | null; status: StatusKey }) => {
    const { row, log, status } = item;
    return (
      <motion.button
        key={row.id}
        layout
        whileTap={{ scale: 0.98 }}
        onClick={() => setDetailRow(row)}
        className={`w-full text-left bg-white rounded-2xl border border-gray-100 p-3 shadow-sm active:shadow-none transition-all`}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${row.vaccine.color_hex || '#F28155'}1a`, color: row.vaccine.color_hex || '#F28155' }}
          >
            <Syringe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-[13px] font-bold text-gray-900 truncate">{row.vaccine.name_az}</h4>
              {!row.vaccine.is_mandatory && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">könüllü</span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {row.age_label_az} • {row.dose_label_az}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              {renderStatusBadge(status)}
              {log?.administered_at && (
                <span className="text-[10px] text-gray-400">{formatDateAz(log.administered_at)}</span>
              )}
            </div>
          </div>
        </div>
      </motion.button>
    );
  };

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] flex flex-col">
        <Header onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Syringe className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-900">Uşaq seçilməyib</h3>
          <p className="text-xs text-gray-500 mt-1">Peyvənd təqvimini görmək üçün əvvəlcə uşaq profili yaradın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] pb-24">
      <Header onBack={onBack} />

      {/* Child + Country selector */}
      <div className="px-3 pt-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg shrink-0">
                {selectedChild.avatar_emoji}
              </div>
              <div className="min-w-0">
                {children.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      {selectedChild.name} <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {children.map(c => (
                        <DropdownMenuItem key={c.id} onClick={() => setSelectedChild(c)}>
                          {c.avatar_emoji} {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <h2 className="text-sm font-bold text-gray-900 truncate">{selectedChild.name}</h2>
                )}
                <p className="text-[11px] text-gray-500">{getChildAge(selectedChild).displayText}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 rounded-full">
                  <span className="text-base leading-none">{country?.flag_emoji || '🌍'}</span>
                  <span className="text-[11px] font-semibold">{country?.name_az || effectiveCountry}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {countries.map(c => (
                  <DropdownMenuItem key={c.code} onClick={() => handleChangeCountry(c.code)}>
                    <span className="mr-2">{c.flag_emoji}</span>{c.name_az}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Stat label="Cəmi" value={stats.total} />
            <Stat label="Tamam" value={stats.done} color="text-emerald-600" />
            <Stat label="Qalan" value={stats.upcoming} color="text-amber-600" />
            <Stat label="Gecikən" value={stats.overdue} color="text-red-600" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 font-medium">Tərəqqi</span>
              <span className="text-[10px] font-bold text-gray-900">{stats.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                animate={{ width: `${stats.pct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 mt-3 sticky top-0 z-10">
        <div className="flex bg-white rounded-full border border-gray-100 p-0.5 shadow-sm">
          {([
            { k: 'upcoming', l: 'Yaxınlaşan' },
            { k: 'all', l: 'Tam qrafik' },
            { k: 'done', l: 'Tamamlanmış' },
          ] as { k: TabKey; l: string }[]).map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
                tab === t.k ? 'bg-[#F28155] text-white shadow' : 'text-gray-500'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 mt-3 space-y-2">
        {schedLoading && <p className="text-center text-xs text-gray-400 py-6">Yüklənir...</p>}

        {!schedLoading && schedule.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
            <Globe className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Bu ölkə üçün qrafik hələ hazırlanmayıb</p>
            <p className="text-xs text-gray-500 mt-1">Tezliklə əlavə olunacaq.</p>
          </div>
        )}

        {tab === 'upcoming' && upcomingRows.map(renderCard)}
        {tab === 'done' && (
          doneRows.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">Hələ tamamlanmış peyvənd yoxdur.</p>
          ) : doneRows.map(renderCard)
        )}
        {tab === 'all' && groupedAll.map(g => {
          const groupRows = rowsWithStatus.filter(x => x.row.age_label_az === g.label);
          return (
            <div key={g.label} className="mt-3 first:mt-0">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F28155]" />
                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{g.label}</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-2">{groupRows.map(renderCard)}</div>
            </div>
          );
        })}
      </div>

      {/* Source */}
      {country?.source_url && (
        <div className="px-3 mt-5">
          <a
            href={country.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 justify-center text-[10px] text-gray-400 hover:text-gray-600"
          >
            <Info className="w-3 h-3" />
            <span>Mənbə: {country.source_label || country.source_url}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl">
          {detailRow && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${detailRow.vaccine.color_hex || '#F28155'}1a`, color: detailRow.vaccine.color_hex || '#F28155' }}
                  >
                    <Syringe className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <SheetTitle className="text-base">{detailRow.vaccine.name_az}</SheetTitle>
                    <p className="text-[11px] text-gray-500">{detailRow.age_label_az} • {detailRow.dose_label_az}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-3 text-sm">
                {detailRow.vaccine.short_description_az && (
                  <p className="text-[13px] text-gray-700 leading-relaxed">{detailRow.vaccine.short_description_az}</p>
                )}
                {detailRow.vaccine.full_description_az && (
                  <div className="bg-orange-50/50 rounded-xl p-3">
                    <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">
                      {detailRow.vaccine.full_description_az}
                    </p>
                  </div>
                )}
                {detailRow.vaccine.disease_az && (
                  <DetailRow label="Qarşısı alınan xəstəlik" value={detailRow.vaccine.disease_az} />
                )}
                {detailRow.vaccine.route_az && (
                  <DetailRow label="Vurma üsulu" value={detailRow.vaccine.route_az} />
                )}
                {detailRow.vaccine.side_effects_az && (
                  <DetailRow label="Mümkün yan təsirlər" value={detailRow.vaccine.side_effects_az} />
                )}
                {detailRow.vaccine.contraindications_az && (
                  <DetailRow label="Əks-göstərişlər" value={detailRow.vaccine.contraindications_az} />
                )}
                {detailRow.notes_az && <DetailRow label="Qeyd" value={detailRow.notes_az} />}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => { setActionRow(detailRow); setActionMode('done'); setDetailRow(null); }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Vuruldu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setActionRow(detailRow); setActionMode('skip'); setDetailRow(null); }}
                  >
                    <Ban className="w-4 h-4 mr-1" /> Buraxıldı
                  </Button>
                </div>

                {logs.find(l => l.vaccine_schedule_id === detailRow.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500"
                    onClick={async () => {
                      const log = logs.find(l => l.vaccine_schedule_id === detailRow.id);
                      if (log && selectedChild) {
                        await del.mutateAsync({ id: log.id, child_id: selectedChild.id });
                        toast({ title: 'Status sıfırlandı' });
                        setDetailRow(null);
                      }
                    }}
                  >
                    Statusu sıfırla
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Action dialog */}
      <ActionDialog
        open={!!actionRow && !!actionMode}
        mode={actionMode}
        row={actionRow}
        onClose={() => { setActionRow(null); setActionMode(null); }}
        onSubmit={async (payload) => {
          if (!actionRow || !selectedChild) return;
          await upsert.mutateAsync({
            child_id: selectedChild.id,
            vaccine_schedule_id: actionRow.id,
            country_code: effectiveCountry,
            ...payload,
          });
          toast({ title: 'Yadda saxlandı', description: actionRow.vaccine.name_az });
          setActionRow(null);
          setActionMode(null);
        }}
      />
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="px-3 h-12 flex items-center gap-2">
        <button onClick={onBack} className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-gray-900 leading-tight">Peyvənd Təqvimi</h1>
          <p className="text-[10px] text-gray-500 leading-tight">Milli İmmunizasiya Qrafiki</p>
        </div>
        <Sparkles className="w-4 h-4 text-[#F28155]" />
      </div>
    </header>
  );
}

function Stat({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-base font-extrabold leading-none ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-orange-200 pl-3">
      <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wide">{label}</p>
      <p className="text-[13px] text-gray-800 leading-relaxed mt-0.5 whitespace-pre-line">{value}</p>
    </div>
  );
}

function ActionDialog({
  open, mode, row, onClose, onSubmit,
}: {
  open: boolean;
  mode: 'done' | 'skip' | null;
  row: VaccineScheduleRow | null;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState('');
  const [batch, setBatch] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'done' ? 'Peyvənd vuruldu' : 'Peyvəndi buraxıldı kimi qeyd et'}
          </DialogTitle>
        </DialogHeader>
        {row && <p className="text-xs text-gray-500 -mt-2">{row.vaccine.name_az} • {row.dose_label_az}</p>}
        {mode === 'done' ? (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Tarix</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} />
            </div>
            <div>
              <Label className="text-xs">Yer (xəstəxana/klinika)</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="məs. Bakı Uşaq Klinik Xəstəxanası" />
            </div>
            <div>
              <Label className="text-xs">Partiya nömrəsi (istəyə bağlı)</Label>
              <Input value={batch} onChange={e => setBatch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Qeyd</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              onClick={() => onSubmit({
                administered_at: date, is_skipped: false, skip_reason: null,
                location_az: location || null, batch_number: batch || null, notes: notes || null,
              })}
            >
              Yadda saxla
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Səbəb</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="məs. Tibbi əks-göstəriş" />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSubmit({
                administered_at: null, is_skipped: true, skip_reason: reason || null,
              })}
            >
              Təsdiq et
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
