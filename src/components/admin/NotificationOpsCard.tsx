import { useEffect, useState, useCallback } from 'react';
import { tr } from '@/lib/tr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Send, ServerCog, Clock3, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type CronJob = {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
  last_run?: { status: string; return_message: string; start_time: string; end_time: string } | null;
};

type RunSummary = {
  function_name: string;
  runs: number;
  success_runs: number;
  error_runs: number;
  sent_total: number;
  failed_total: number;
  skipped_total: number;
  last_ended_at: string;
};

type SendStat = {
  notification_type: string | null;
  status: string;
  reason: string;
  cnt: number;
};

type StatusPayload = {
  server_utc: string;
  server_baku: string;
  cron_jobs: CronJob[];
  today_runs: RunSummary[];
  today_sends: SendStat[];
};

/**
 * Parse a cron expression's hour field and map it to Baku local hours (UTC+4).
 * Supports comma lists and "*". Returns null if hour field is "*" (every hour).
 */
function cronUtcHoursToBaku(schedule: string): { utc: string; baku: string; allHours: boolean } {
  const parts = schedule.trim().split(/\s+/);
  const hourField = parts[1] ?? '*';
  if (hourField === '*' || hourField.includes('/')) {
    return { utc: hourField, baku: hourField === '*' ? 'hər saat' : hourField, allHours: true };
  }
  const utcHours = hourField.split(',').map((h) => Number(h.trim())).filter((n) => !Number.isNaN(n));
  const bakuHours = utcHours.map((h) => (h + 4) % 24).sort((a, b) => a - b);
  return {
    utc: utcHours.join(','),
    baku: bakuHours.join(','),
    allHours: false,
  };
}

const EXPECTED_BAKU_HOURS: Record<string, number[]> = {
  'send-daily-notifications-slots': [9, 10, 12, 14, 15, 19],
  'send-flow-reminders-every-hour': [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
};

function validateSchedule(job: CronJob): { ok: boolean; message: string } {
  const expected = EXPECTED_BAKU_HOURS[job.jobname];
  if (!expected) return { ok: true, message: tr("notificationopscard_teleb_tanimlanmayib_e57484", "tələb tanımlanmayıb") };
  const { baku, allHours } = cronUtcHoursToBaku(job.schedule);
  if (allHours) return { ok: false, message: `gözlənilən: ${expected.join(',')} — alındı: ${baku}` };
  const actual = baku.split(',').map((s) => Number(s));
  const missing = expected.filter((h) => !actual.includes(h));
  if (missing.length) return { ok: false, message: `çatışmayan: ${missing.join(',')} (Baku saat)` };
  return { ok: true, message: `Baku ${baku}` };
}

const NotificationOpsCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StatusPayload | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_notification_admin_status');
      if (error) throw error;
      setData(data as StatusPayload);
    } catch (e: any) {
      toast.error('Status alınmadı: ' + (e?.message ?? 'naməlum'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const callTest = async (fn: 'send-daily-notifications' | 'send-flow-reminders' | 'send-vitamin-reminders') => {
    if (!user) { toast.error('Giriş etməlisiniz'); return; }
    setTesting(fn);
    setLastTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { manual: true, userId: user.id, skipDedup: true },
      });
      if (error) throw error;
      setLastTestResult({ fn, payload: data });
      const sent = (data as any)?.sent ?? 0;
      if (sent > 0) toast.success(`${fn}: ${sent} push göndərildi`);
      else toast.warning(`${fn}: 0 push (səbəbə bax)`);
      refresh();
    } catch (e: any) {
      setLastTestResult({ fn, payload: { error: e?.message } });
      toast.error('Test xətası: ' + (e?.message ?? 'naməlum'));
    } finally {
      setTesting(null);
    }
  };

  return (
    <Card className="p-4 border-2 border-primary/30 bg-primary/5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <ServerCog className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">{tr("notificationopscard_bildiris_emeliyyatlari_b18578", "Bildiriş əməliyyatları")}</h3>
            <p className="text-xs text-muted-foreground">
              Cron statusu, vaxt zonası uyğunluğu, günlük hesabat və test push düymələri.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Yenilə
          </Button>
          <Button size="sm" onClick={() => callTest('send-daily-notifications')} disabled={testing !== null}>
            {testing === 'send-daily-notifications' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Test: Daily
          </Button>
          <Button size="sm" variant="secondary" onClick={() => callTest('send-flow-reminders')} disabled={testing !== null}>
            {testing === 'send-flow-reminders' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Test: Flow
          </Button>
          <Button size="sm" variant="secondary" onClick={() => callTest('send-vitamin-reminders')} disabled={testing !== null}>
            {testing === 'send-vitamin-reminders' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Test: Vitamin
          </Button>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <Clock3 className="h-3 w-3" />
            <span>Server UTC: <code className="bg-background px-1 rounded">{data.server_utc}</code></span>
            <span>Baku: <code className="bg-background px-1 rounded">{data.server_baku}</code></span>
          </div>

          {/* Cron jobs */}
          <div>
            <div className="text-sm font-semibold mb-2">{tr("notificationopscard_cron_isleri_vaxt_zonasi_ce0ec5", "Cron işləri & vaxt zonası")}</div>
            <div className="overflow-x-auto rounded border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Ad</th>
                    <th className="text-left p-2">Schedule (UTC)</th>
                    <th className="text-left p-2">{tr("notificationopscard_baku_saatlari_de5041", "Baku saatları")}</th>
                    <th className="text-left p-2">Validation</th>
                    <th className="text-left p-2">Son icra</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cron_jobs.map((j) => {
                    const baku = cronUtcHoursToBaku(j.schedule);
                    const v = validateSchedule(j);
                    return (
                      <tr key={j.jobid} className="border-t">
                        <td className="p-2 font-medium">
                          {j.jobname}{' '}
                          {!j.active && <Badge variant="outline" className="ml-1">{tr("notificationopscard_sondurulub_0ea98c", "söndürülüb")}</Badge>}
                        </td>
                        <td className="p-2 font-mono">{j.schedule}</td>
                        <td className="p-2 font-mono">{baku.baku}</td>
                        <td className="p-2">
                          {v.ok ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {v.message}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" /> {v.message}
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          {j.last_run ? (
                            <span className="inline-flex items-center gap-1">
                              {j.last_run.status === 'succeeded' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span>{new Date(j.last_run.start_time).toLocaleString('az-AZ')}</span>
                              <Badge variant="outline">{j.last_run.return_message}</Badge>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{tr("notificationopscard_hec_vaxt_1c2a46", "heç vaxt")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {data.cron_jobs.length === 0 && (
                    <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">{tr("notificationopscard_cron_isi_tapilmadi_7af00b", "Cron işi tapılmadı")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today runs */}
          <div>
            <div className="text-sm font-semibold mb-2">{tr("notificationopscard_bu_gun_cron_icralari_baku_e3b082", "Bu gün cron icraları (Baku)")}</div>
            <div className="overflow-x-auto rounded border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Funksiya</th>
                    <th className="text-right p-2">{tr("notificationopscard_icralar_5cb87f", "İcralar")}</th>
                    <th className="text-right p-2">{tr("notificationopscard_ugurlu_7fe64c", "Uğurlu")}</th>
                    <th className="text-right p-2">{tr("notificationopscard_xeta_3cdbb6", "Xəta")}</th>
                    <th className="text-right p-2">{tr("notificationopscard_gonderilen_686392", "Göndərilən")}</th>
                    <th className="text-right p-2">{tr("notificationopscard_ugursuz_541932", "Uğursuz")}</th>
                    <th className="text-right p-2">{tr("notificationopscard_kecilen_271294", "Keçilən")}</th>
                    <th className="text-left p-2">{tr("notificationopscard_son_bitme_8a369d", "Son bitmə")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.today_runs.map((r) => (
                    <tr key={r.function_name} className="border-t">
                      <td className="p-2 font-medium">{r.function_name}</td>
                      <td className="p-2 text-right">{r.runs}</td>
                      <td className="p-2 text-right text-emerald-600">{r.success_runs}</td>
                      <td className="p-2 text-right text-destructive">{r.error_runs}</td>
                      <td className="p-2 text-right">{r.sent_total ?? 0}</td>
                      <td className="p-2 text-right">{r.failed_total ?? 0}</td>
                      <td className="p-2 text-right">{r.skipped_total ?? 0}</td>
                      <td className="p-2">{r.last_ended_at ? new Date(r.last_ended_at).toLocaleString('az-AZ') : '—'}</td>
                    </tr>
                  ))}
                  {data.today_runs.length === 0 && (
                    <tr><td colSpan={8} className="p-3 text-center text-muted-foreground">{tr("notificationopscard_bu_gun_cron_icrasi_yoxdur_f33b6f", "Bu gün cron icrası yoxdur")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today sends */}
          <div>
            <div className="text-sm font-semibold mb-2">{tr("notificationopscard_bu_gun_gonderme_hesabati_tip_status_sebe_158578", "Bu gün göndərmə hesabatı (tip × status × səbəb)")}</div>
            <div className="overflow-x-auto rounded border bg-background max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Tip</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">{tr("notificationopscard_sebeb_7b51f1", "Səbəb")}</th>
                    <th className="text-right p-2">Say</th>
                  </tr>
                </thead>
                <tbody>
                  {data.today_sends.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{s.notification_type ?? '—'}</td>
                      <td className="p-2">
                        <Badge variant={s.status === 'sent' ? 'default' : s.status === 'failed' ? 'destructive' : 'outline'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono break-all">{s.reason}</td>
                      <td className="p-2 text-right">{s.cnt}</td>
                    </tr>
                  ))}
                  {data.today_sends.length === 0 && (
                    <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">{tr("notificationopscard_bu_gun_gonderme_qeydi_yoxdur_653c4a", "Bu gün göndərmə qeydi yoxdur")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {lastTestResult && (
            <div>
              <div className="text-sm font-semibold mb-1">Son test ({lastTestResult.fn})</div>
              <pre className="text-xs bg-background border rounded p-3 max-h-60 overflow-auto whitespace-pre-wrap break-words">
                {JSON.stringify(lastTestResult.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default NotificationOpsCard;
