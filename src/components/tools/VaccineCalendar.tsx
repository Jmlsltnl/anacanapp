import { tr, getPersistedLanguage } from "@/lib/tr";import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Syringe, CheckCircle2, Clock, AlertTriangle, Ban,
  Info, Globe, ExternalLink, X, Calendar as CalendarIcon, Sparkles, ChevronDown } from
'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import {
  useVaccineCountries, useVaccineScheduleForCountry, useChildVaccinations,
  useUpsertChildVaccination, useDeleteChildVaccination,
  type VaccineScheduleRow, type ChildVaccination } from
'@/hooks/useVaccines';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onBack: () => void;
}

type TabKey = 'upcoming' | 'all' | 'done';

const STATUS = {
  done: { label: () => tr("vaccinecalendar_vuruldu", "Vuruldu"), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  pending: { label: () => tr("vaccinecalendar_gozlemede_80f70e", "G\xF6zl\u0259m\u0259d\u0259"), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  overdue: { label: () => tr("vaccinecalendar_gecikdi", "Gecikdi"), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
  skipped: { label: () => tr("vaccinecalendar_buraxildi_61c6a0", "Burax\u0131ld\u0131"), icon: Ban, color: 'text-muted-foreground', bg: 'bg-muted', ring: 'ring-gray-200' },
  future: { label: () => tr("vaccinecalendar_novbede_b7ecbc", "N\xF6vb\u0259d\u0259"), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' }
} as const;

type StatusKey = keyof typeof STATUS;

const dayDiffFromBirth = (birthDate: string) => {
  const b = new Date(birthDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - b.getTime()) / 86400000);
};

const formatVaccineDate = (iso: string) => {
  const d = new Date(iso);
  const lang = getPersistedLanguage();
  const locale = lang === 'en' ? 'en-US' : 'az-AZ';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
};

const translateVaccineLabel = (text: string | undefined | null, lang: string): string => {
  if (!text) return '';
  if (lang !== 'en') return text;

  const dict: Record<string, string> = {
    // Ages
    "Doğulanda": "At birth",
    "2 aylıq": "2 months",
    "3 aylıq": "3 months",
    "4 aylıq": "4 months",
    "6 aylıq": "6 months",
    "12 aylıq": "12 months",
    "18 aylıq": "18 months",
    "24 aylıq": "24 months",
    "6 yaş": "6 years",
    
    // Doses
    "1-ci doza": "1st dose",
    "2-ci doza": "2nd dose",
    "3-cü doza": "3rd dose",
    "4-cü doza": "4th dose",
    "Bustər": "Booster",
    "Bustər (revaksinasiya)": "Booster (revaccination)",
    "İkinci bustər": "Second booster",
    "1-ci doza (doğulanda)": "1st dose (at birth)",
  };

  return dict[text] || text;
};

const computeStatus = (row: VaccineScheduleRow, ageDays: number, log?: ChildVaccination | null): StatusKey => {
  if (log?.administered_at) return 'done';
  if (log?.is_skipped) return 'skipped';
  const max = row.max_age_days ?? row.recommended_age_days + 60;
  if (ageDays > max) return 'overdue';
  if (ageDays >= (row.min_age_days ?? row.recommended_age_days)) return 'pending';
  return 'future';
};

const groupByAge = (rows: VaccineScheduleRow[], lang: string) => {
  const groups = new Map<string, {label: string;days: number;rows: VaccineScheduleRow[];}>();
  rows.forEach((r) => {
    const key = r.age_label || '';
    const translatedKey = translateVaccineLabel(key, lang);
    if (!groups.has(translatedKey)) groups.set(translatedKey, { label: translatedKey, days: r.recommended_age_days, rows: [] });
    groups.get(translatedKey)!.rows.push(r);
  });
  return Array.from(groups.values()).sort((a, b) => a.days - b.days);
};

export default function VaccineCalendar({ onBack }: Props) {
  const { children, selectedChild, setSelectedChild, getChildAge } = useChildren();
  const { data: countries = [] } = useVaccineCountries();
  const { toast } = useToast();
  const qc = useQueryClient();
  const lang = getPersistedLanguage();

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
    const logMap = new Map(logs.map((l) => [l.vaccine_schedule_id, l]));
    return schedule.map((r) => {
      const log = logMap.get(r.id) || null;
      return { row: r, log, status: computeStatus(r, ageDays, log) };
    });
  }, [schedule, logs, ageDays]);

  const stats = useMemo(() => {
    const total = rowsWithStatus.length;
    const done = rowsWithStatus.filter((x) => x.status === 'done').length;
    const overdue = rowsWithStatus.filter((x) => x.status === 'overdue').length;
    const upcoming = rowsWithStatus.filter((x) => x.status === 'pending' || x.status === 'overdue').length;
    const pct = total ? Math.round(done / total * 100) : 0;
    return { total, done, overdue, upcoming, pct };
  }, [rowsWithStatus]);

  const upcomingRows = rowsWithStatus.
  filter((x) => x.status === 'overdue' || x.status === 'pending' || x.status === 'future').
  sort((a, b) => a.row.recommended_age_days - b.row.recommended_age_days).
  slice(0, 30);

  const doneRows = rowsWithStatus.
  filter((x) => x.status === 'done').
  sort((a, b) => (b.log?.administered_at || '').localeCompare(a.log?.administered_at || ''));

  const groupedAll = useMemo(() => groupByAge(schedule, lang), [schedule, lang]);
  const country = countries.find((c) => c.code === effectiveCountry);

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
        {meta.label()}
      </span>);

  };

  const renderCard = (item: {row: VaccineScheduleRow;log: ChildVaccination | null;status: StatusKey;}) => {
    const { row, log, status } = item;
    return (
      <motion.button
        key={row.id}
        layout
        whileTap={{ scale: 0.98 }}
        onClick={() => setDetailRow(row)}
        className={`w-full text-left bg-card rounded-2xl border border-border p-3 shadow-sm active:shadow-none transition-all`}>
        
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${row.vaccine.color_hex || '#F28155'}1a`, color: row.vaccine.color_hex || '#F28155' }}>
            
            <Syringe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-[13px] font-bold text-foreground truncate">{row.vaccine.name}</h4>
              {!row.vaccine.is_mandatory &&
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{tr("vaccinecalendar_konullu_6b1c0e", "k\xF6n\xFCll\xFC")}</span>
              }
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {translateVaccineLabel(row.age_label, lang)} • {translateVaccineLabel(row.dose_label, lang)}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              {renderStatusBadge(status)}
              {log?.administered_at &&
              <span className="text-[10px] text-muted-foreground">{formatVaccineDate(log.administered_at)}</span>
              }
            </div>
          </div>
        </div>
      </motion.button>);

  };

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Syringe className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-base font-bold text-foreground">{tr("vaccinecalendar_usaq_secilmeyib_a26423", "U\u015Faq se\xE7ilm\u0259yib")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{tr("vaccinecalendar_peyvend_teqvimini_gormek_ucun__8ce451", "Peyv\u0259nd t\u0259qvimini g\xF6rm\u0259k \xFC\xE7\xFCn \u0259vv\u0259lc\u0259 u\u015Faq profili yarad\u0131n.")}</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header onBack={onBack} />

      {/* Child + Country selector */}
      <div className="px-3 pt-2">
        <div className="bg-card rounded-2xl border border-border p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                {selectedChild.avatar_emoji}
              </div>
              <div className="min-w-0">
                {children.length > 1 ?
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-bold text-foreground">
                      {selectedChild.name} <ChevronDown className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {children.map((c) =>
                    <DropdownMenuItem key={c.id} onClick={() => setSelectedChild(c)}>
                          {c.avatar_emoji} {c.name}
                        </DropdownMenuItem>
                    )}
                    </DropdownMenuContent>
                  </DropdownMenu> :

                <h2 className="text-sm font-bold text-foreground truncate">{selectedChild.name}</h2>
                }
                <p className="text-[11px] text-muted-foreground">{getChildAge(selectedChild).displayText}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 rounded-full">
                  <span className="text-base leading-none">{country?.flag_emoji || '🌍'}</span>
                  <span className="text-[11px] font-semibold">{country?.name || effectiveCountry}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {countries.map((c) =>
                <DropdownMenuItem key={c.code} onClick={() => handleChangeCountry(c.code)}>
                    <span className="mr-2">{c.flag_emoji}</span>{c.name}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Stat label={tr("vaccinecalendar_cemi_84214a", "C\u0259mi")} value={stats.total} />
            <Stat label={tr("vaccine_stat_done", "Tamam")} value={stats.done} color="text-emerald-600" />
            <Stat label={tr("vaccine_stat_pending", "Qalan")} value={stats.upcoming} color="text-amber-600" />
            <Stat label={tr("vaccinecalendar_geciken_c7adb0", "Gecik\u0259n")} value={stats.overdue} color="text-red-600" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-medium">{tr("vaccinecalendar_tereqqi_9cf2fe", "T\u0259r\u0259qqi")}</span>
              <span className="text-[10px] font-bold text-foreground">{stats.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                animate={{ width: `${stats.pct}%` }}
                transition={{ duration: 0.6 }} />
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 mt-3 sticky top-0 z-10">
        <div className="flex bg-card rounded-full border border-border p-0.5 shadow-sm">
          {([
          { k: 'upcoming', l: tr("vaccinecalendar_yaxinlasan_773e16", "Yax\u0131nla\u015Fan") },
          { k: 'all', l: tr("vaccinecalendar_tam_qrafik", "Tam qrafik") },
          { k: 'done', l: tr("vaccinecalendar_tamamlanmis_e36252", "Tamamlanm\u0131\u015F") }] as
          {k: TabKey;l: string;}[]).map((t) =>
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
            tab === t.k ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`
            }>
            
              {t.l}
            </button>
          )}
        </div>
      </div>

      <div className="px-3 mt-3 space-y-2">
        {schedLoading && <p className="text-center text-xs text-muted-foreground py-6">{tr("vaccinecalendar_yuklenir_5557de", "Y\xFCkl\u0259nir...")}</p>}

        {!schedLoading && schedule.length === 0 &&
        <div className="bg-card rounded-2xl p-6 text-center border border-border">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">{tr("vaccinecalendar_bu_olke_ucun_qrafik_hele_hazir_726119", "Bu \xF6lk\u0259 \xFC\xE7\xFCn qrafik h\u0259l\u0259 haz\u0131rlanmay\u0131b")}</p>
            <p className="text-xs text-muted-foreground mt-1">{tr("vaccinecalendar_tezlikle_elave_olunacaq_da1414", "Tezlikl\u0259 \u0259lav\u0259 olunacaq.")}</p>
          </div>
        }

        {tab === 'upcoming' && upcomingRows.map(renderCard)}
        {tab === 'done' && (
        doneRows.length === 0 ?
        <p className="text-center text-xs text-muted-foreground py-6">{tr("vaccinecalendar_hele_tamamlanmis_peyvend_yoxdu_c76148", "H\u0259l\u0259 tamamlanm\u0131\u015F peyv\u0259nd yoxdur.")}</p> :
        doneRows.map(renderCard))
        }
        {tab === 'all' && groupedAll.map((g) => {
          const groupRows = rowsWithStatus.filter((x) => translateVaccineLabel(x.row.age_label, lang) === g.label);
          return (
            <div key={g.label} className="mt-3 first:mt-0">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wide">{g.label}</h3>
                <div className="flex-1 h-px bg-muted" />
              </div>
              <div className="space-y-2">{groupRows.map(renderCard)}</div>
            </div>);

        })}
      </div>

      {/* Source */}
      {country?.source_url &&
      <div className="px-3 mt-5">
          <a
          href={country.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 justify-center text-[10px] text-muted-foreground hover:text-foreground">
          
            <Info className="w-3 h-3" />
            <span>
              {tr("vaccinecalendar_menbe_87d8be", "M\u0259nb\u0259:")}{" "}
              {lang === 'en' && (country.source_label || '').includes('Səhiyyə Nazirliyi')
                ? 'Ministry of Health of the Republic of Azerbaijan — National Immunization Schedule'
                : country.source_label || country.source_url}
            </span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      }

      {/* Detail sheet */}
      <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl">
          {detailRow &&
          <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${detailRow.vaccine.color_hex || '#F28155'}1a`, color: detailRow.vaccine.color_hex || '#F28155' }}>
                  
                    <Syringe className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <SheetTitle className="text-base">{detailRow.vaccine.name}</SheetTitle>
                    <p className="text-[11px] text-muted-foreground">{translateVaccineLabel(detailRow.age_label, lang)} • {translateVaccineLabel(detailRow.dose_label, lang)}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-3 text-sm">
                {detailRow.vaccine.short_description &&
              <p className="text-[13px] text-foreground leading-relaxed">{detailRow.vaccine.short_description}</p>
              }
                {detailRow.vaccine.full_description &&
              <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">
                      {detailRow.vaccine.full_description}
                    </p>
                  </div>
              }
                {detailRow.vaccine.disease &&
              <DetailRow label={tr("vaccinecalendar_qarsisi_alinan_xestelik_862a71", "Qar\u015F\u0131s\u0131 al\u0131nan x\u0259st\u0259lik")} value={detailRow.vaccine.disease} />
              }
                {detailRow.vaccine.route &&
              <DetailRow label={tr("vaccinecalendar_vurma_usulu_689cd3", "Vurma \xFCsulu")} value={detailRow.vaccine.route} />
              }
                {detailRow.vaccine.side_effects &&
              <DetailRow label={tr("vaccinecalendar_mumkun_yan_tesirler_fc6796", "M\xFCmk\xFCn yan t\u0259sirl\u0259r")} value={detailRow.vaccine.side_effects} />
              }
                {detailRow.vaccine.contraindications &&
              <DetailRow label={tr("vaccinecalendar_eks_gosterisler_f34875", "\u018Fks-g\xF6st\u0259ri\u015Fl\u0259r")} value={detailRow.vaccine.contraindications} />
              }
                {detailRow.notes && <DetailRow label={tr("untranslated_qeyd_z0999u", "Qeyd")} value={detailRow.notes} />}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => {setActionRow(detailRow);setActionMode('done');setDetailRow(null);}}>
                  
                    <CheckCircle2 className="w-4 h-4 mr-1" /> {tr("vaccinecalendar_vuruldu", "Vuruldu")}
                  </Button>
                  <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {setActionRow(detailRow);setActionMode('skip');setDetailRow(null);}}>
                  
                    <Ban className="w-4 h-4 mr-1" /> {tr("vaccinecalendar_buraxildi_61c6a0", "Burax\u0131ld\u0131")}
                  </Button>
                </div>

                {logs.find((l) => l.vaccine_schedule_id === detailRow.id) &&
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-500"
                onClick={async () => {
                  const log = logs.find((l) => l.vaccine_schedule_id === detailRow.id);
                  if (log && selectedChild) {
                    await del.mutateAsync({ id: log.id, child_id: selectedChild.id });
                    toast({ title: tr("vaccinecalendar_status_sifirlandi_77a21e", "Status s\u0131f\u0131rland\u0131") });
                    setDetailRow(null);
                  }
                }}>
                    {tr("vaccinecalendar_statusu_sifirla_dce807", "Statusu s\u0131f\u0131rla")}
                  
              </Button>
              }
              </div>
            </>
          }
        </SheetContent>
      </Sheet>

      {/* Action dialog */}
      <ActionDialog
        open={!!actionRow && !!actionMode}
        mode={actionMode}
        row={actionRow}
        onClose={() => {setActionRow(null);setActionMode(null);}}
        onSubmit={async (payload) => {
          if (!actionRow || !selectedChild) return;
          await upsert.mutateAsync({
            child_id: selectedChild.id,
            vaccine_schedule_id: actionRow.id,
            country_code: effectiveCountry,
            ...payload
          });
          toast({ title: tr("vaccinecalendar_yadda_saxlandi_f72ffd", "Yadda saxland\u0131"), description: actionRow.vaccine.name });
          setActionRow(null);
          setActionMode(null);
        }} />
      
    </div>);

}

function Header({ onBack }: {onBack: () => void;}) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-20">
      <div className="px-3 h-12 flex items-center gap-2">
        <button onClick={onBack} className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground leading-tight">{tr("vaccinecalendar_peyvend_teqvimi_d84c87", "Peyv\u0259nd T\u0259qvimi")}</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">{tr("vaccine_national_schedule", "Milli İmmunizasiya Qrafiki")}</p>
        </div>
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
    </header>);

}

function Stat({ label, value, color = 'text-foreground' }: {label: string;value: number;color?: string;}) {
  return (
    <div className="text-center">
      <div className={`text-base font-extrabold leading-none ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>);

}

function DetailRow({ label, value }: {label: string;value: string;}) {
  return (
    <div className="border-l-2 border-primary/30 pl-3">
      <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">{label}</p>
      <p className="text-[13px] text-foreground leading-relaxed mt-0.5 whitespace-pre-line">{value}</p>
    </div>);

}

function ActionDialog({
  open, mode, row, onClose, onSubmit
}: {open: boolean;mode: 'done' | 'skip' | null;row: VaccineScheduleRow | null;onClose: () => void;onSubmit: (payload: any) => Promise<void>;}) {
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
            {mode === 'done' ? tr("vaccinecalendar_peyvend_vuruldu_22c2e5", "Peyv\u0259nd vuruldu") : tr("vaccinecalendar_peyvendi_buraxildi_kimi_qeyd_e_64265a", "Peyv\u0259ndi burax\u0131ld\u0131 kimi qeyd et")}
          </DialogTitle>
        </DialogHeader>
        {row && <p className="text-xs text-muted-foreground -mt-2">{row.vaccine.name} • {translateVaccineLabel(row.dose_label, getPersistedLanguage())}</p>}
        {mode === 'done' ?
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{tr("untranslated_tarix_6hhkyx", "Tarix")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} />
            </div>
            <div>
              <Label className="text-xs">{tr("vaccinecalendar_yer_xestexana_klinika_d8c111", "Yer (x\u0259st\u0259xana/klinika)")}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={tr("vaccinecalendar_mes_baki_usaq_klinik_xestexana_8a2157", "m\u0259s. Bak\u0131 U\u015Faq Klinik X\u0259st\u0259xanas\u0131")} />
            </div>
            <div>
              <Label className="text-xs">{tr("vaccinecalendar_partiya_nomresi_isteye_bagli_4b290a", "Partiya n\xF6mr\u0259si (ist\u0259y\u0259 ba\u011Fl\u0131)")}</Label>
              <Input value={batch} onChange={(e) => setBatch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{tr("untranslated_qeyd_z0999u", "Qeyd")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            onClick={() => onSubmit({
              administered_at: date, is_skipped: false, skip_reason: null,
              location_az: location || null, batch_number: batch || null, notes: notes || null
            })}>{tr("untranslated_yadda_saxla_bpdu9v", "Yadda saxla")}</Button>
          </div> :

        <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{tr("vaccinecalendar_sebeb_7b51f1", "S\u0259b\u0259b")}</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={tr("vaccinecalendar_mes_tibbi_eks_gosteris_d1b954", "m\u0259s. Tibbi \u0259ks-g\xF6st\u0259ri\u015F")} />
            </div>
            <Button
            variant="outline"
            className="w-full"
            onClick={() => onSubmit({
              administered_at: null, is_skipped: true, skip_reason: reason || null
            })}>
              {tr("vaccinecalendar_tesdiq_et_87b1a4", "T\u0259sdiq et")}
            
          </Button>
          </div>
        }
      </DialogContent>
    </Dialog>);

}