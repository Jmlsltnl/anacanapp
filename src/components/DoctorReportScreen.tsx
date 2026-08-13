import { useState, useEffect } from 'react';
import { getLocaleTag } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Download, Share2, Calendar,
  Heart, Droplets, Activity, Loader2,
  Mail } from
'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { useHealthReport } from '@/hooks/useHealthReport';
import { useChildren } from '@/hooks/useChildren';
import { useBloodPressureLogs } from '@/hooks/useBloodPressure';
import { classifyBp } from '@/lib/bloodPressure';
import { useSubscription } from '@/hooks/useSubscription';
import PremiumModal from '@/components/PremiumModal';
import { tr } from "@/lib/tr";

interface DoctorReportScreenProps {
  onBack: () => void;
}

interface BabyCareStats {
  days: number;
  totalLogs: number;
  sleepMinutesPerDay: number;
  feedsPerDay: number;
  breastTotal: number;
  formulaTotal: number;
  solidTotal: number;
  diapersPerDay: number;
  wetTotal: number;
  dirtyTotal: number;
}

const DoctorReportScreen = ({ onBack }: DoctorReportScreenProps) => {
  const { name, lifeStage, getCycleData, getPregnancyData, language } = useUserStore();
  const { selectedChild, getChildAge } = useChildren();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('1month');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [babyCare, setBabyCare] = useState<BabyCareStats | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = useSubscription();

  // Fetch real health data from backend
  const { trends: healthData, isLoading: healthLoading } = useHealthReport(selectedPeriod);
  const { data: bpLogs = [] } = useBloodPressureLogs();

  const cycleData = getCycleData();
  const pregData = getPregnancyData();

  // Derive baby data from selectedChild for multi-child support
  const childAge = selectedChild ? getChildAge(selectedChild) : null;
  const babyData = selectedChild && childAge ? {
    id: selectedChild.id,
    name: selectedChild.name,
    birthDate: new Date(selectedChild.birth_date),
    gender: selectedChild.gender as 'boy' | 'girl',
    ageInDays: childAge.days,
    ageInMonths: childAge.months
  } : null;

  const periods = [
  { id: '1week', label: tr("doctorreportscreen_1_hefte_6d1cb4", '1 Həftə') },
  { id: '1month', label: tr("doctorreport_1_ay", '1 Ay') },
  { id: '3months', label: tr("doctorreport_3_ay", '3 Ay') },
  { id: 'all', label: tr("doctorreportscreen_hamisi_c73c4d", 'Hamısı') }];

  // ── Körpə qulluq statistikası (seçilmiş dövr üzrə baby_logs) ──
  useEffect(() => {
    if (lifeStage !== 'mommy' || !user || !selectedChild) { setBabyCare(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const periodDays = selectedPeriod === '1week' ? 7 : selectedPeriod === '1month' ? 30 : selectedPeriod === '3months' ? 90 : 0;
        let query = supabase.
        from('baby_logs').
        select('log_type, start_time, end_time, feed_type, diaper_type, amount_ml, notes').
        eq('user_id', user.id).
        eq('child_id', selectedChild.id).
        order('start_time', { ascending: true });
        if (periodDays > 0) {
          query = query.gte('start_time', new Date(Date.now() - periodDays * 86400000).toISOString());
        }
        const { data, error } = await query;
        if (error || !data || cancelled) { if (!cancelled) setBabyCare(null); return; }

        const logs = data as any[];
        if (logs.length === 0) { setBabyCare(null); return; }

        // Faktiki əhatə olunan gün sayı (ilk qeyddən bu günə, period ilə məhdud)
        const firstTs = new Date(logs[0].start_time).getTime();
        const spanDays = Math.max(1, Math.min(
          periodDays || 3650,
          Math.ceil((Date.now() - firstTs) / 86400000)
        ));

        let sleepMin = 0, feeds = 0, breast = 0, formula = 0, solid = 0, diapers = 0, wet = 0, dirty = 0;
        for (const l of logs) {
          if (l.log_type === 'sleep' && l.end_time) {
            sleepMin += Math.max(0, (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 60000);
          } else if (l.log_type === 'feeding') {
            feeds++;
            if (l.feed_type === 'breast_left' || l.feed_type === 'breast_right' || l.feed_type === 'left' || l.feed_type === 'right') breast++;
            else if (l.feed_type === 'formula') formula++;
            else if (l.feed_type === 'solid') solid++;
          } else if (l.log_type === 'diaper') {
            diapers++;
            if (l.diaper_type === 'wet') wet++;
            else if (l.diaper_type === 'dirty') dirty++;
            else { wet++; dirty++; } // mixed
          }
        }
        setBabyCare({
          days: spanDays,
          totalLogs: logs.length,
          sleepMinutesPerDay: Math.round(sleepMin / spanDays),
          feedsPerDay: Math.round(feeds / spanDays * 10) / 10,
          breastTotal: breast,
          formulaTotal: formula,
          solidTotal: solid,
          diapersPerDay: Math.round(diapers / spanDays * 10) / 10,
          wetTotal: wet,
          dirtyTotal: dirty
        });
      } catch (e) {
        console.error('baby care stats failed:', e);
        if (!cancelled) setBabyCare(null);
      }
    })();
    return () => { cancelled = true; };
  }, [lifeStage, user, selectedChild, selectedPeriod]);

  const babyCareRows = babyCare ? [
  { label: tr('pdf_bc_sleep_avg', 'Yuxu (orta/gün)'), value: `${Math.floor(babyCare.sleepMinutesPerDay / 60)}${tr("common_h_short", "s")} ${babyCare.sleepMinutesPerDay % 60}${tr("common_m_short", "d")}` },
  { label: tr('pdf_bc_feeds_avg', 'Qidalanma (orta/gün)'), value: `${babyCare.feedsPerDay} ${tr('dashboard_times_unit', 'dəfə')}` },
  { label: tr('pdf_bc_breast', 'Ana südü (cəmi)'), value: `${babyCare.breastTotal}` },
  { label: tr('pdf_bc_formula', 'Süd əvəzedicisi (cəmi)'), value: `${babyCare.formulaTotal}` },
  { label: tr('pdf_bc_solid', 'Əlavə qida (cəmi)'), value: `${babyCare.solidTotal}` },
  { label: tr('pdf_bc_diapers_avg', 'Bez (orta/gün)'), value: `${babyCare.diapersPerDay}` },
  { label: tr('pdf_bc_wet_dirty', 'Nəm / Çirkli (cəmi)'), value: `${babyCare.wetTotal} / ${babyCare.dirtyTotal}` },
  { label: tr('pdf_bc_total', 'Cəmi qeyd'), value: `${babyCare.totalLogs} (${babyCare.days} ${tr("common_gun", "gün")})` }] :
  [];


  // ── REAL PDF generasiyası (əvvəllər stub idi) ──
  const buildAndDeliver = async (mode: 'download' | 'share') => {
    if (generating) return;
    // PDF hesabat — Premium funksiyadır (paywall vədi ilə uyğun)
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setGenerating(true);
    toast({
      title: tr("doctorreportscreen_hesabat_hazirlanir_37c97d", 'Hesabat hazırlanır...'),
      description: tr("doctorreportscreen_pdf_fayli_bir_nece_saniyeye_hazir_olacaq_0304da", 'PDF faylı bir neçə saniyəyə hazır olacaq.')
    });
    try {
      const { generateDoctorReportPdf, deliverPdf } = await import('@/lib/pdfReport');

      const stageTitle = lifeStage === 'bump' ?
      tr('pdf_stage_bump', 'Hamiləlik dövrü') :
      lifeStage === 'mommy' ?
      tr('pdf_stage_mommy', 'Analıq dövrü') :
      tr('pdf_stage_flow', 'Tsikl izləmə');

      const periodLabel = periods.find((p) => p.id === selectedPeriod)?.label || '';

      const bpRows = bpLogs.slice(0, 8).map((b: any) => ({
        date: new Date(b.measured_at).toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'short' }),
        reading: `${b.systolic}/${b.diastolic} mmHg${b.pulse ? ` · ${b.pulse}` : ''}`,
        category: classifyBp(b.systolic, b.diastolic, lifeStage === 'bump').label
      }));

      const doc = await generateDoctorReportPdf({
        userName: name || tr('doctorreportscreen_i_stifadeci_b6bdd6', 'İstifadəçi'),
        stageTitle,
        periodLabel,
        stageRows: getStageSpecificData().map((r) => ({ label: r.label, value: String(r.value ?? '—') })),
        trends: (healthData || []).map((t: any) => ({ label: t.label, value: String(t.value ?? ''), trend: String(t.trend ?? '') })),
        bpRows,
        babyCareRows: babyCareRows.length > 0 ? babyCareRows : undefined,
        notes
      });

      const fileName = `anacan-hesabat-${new Date().toISOString().split('T')[0]}.pdf`;
      const result = await deliverPdf(doc, fileName, mode);

      toast({
        title: result === 'shared' ?
        tr('pdf_shared_toast', 'Hesabat paylaşıldı 📤') :
        tr('pdf_downloaded_toast', 'PDF yükləndi ✓'),
        description: fileName
      });
    } catch (e) {
      console.error('PDF generation failed:', e);
      toast({
        title: tr('pdf_error_toast', 'PDF yaradıla bilmədi'),
        description: tr('pdf_error_desc', 'Yenidən cəhd edin.'),
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => buildAndDeliver('download');
  const handleShare = () => buildAndDeliver('share');

  const getStageSpecificData = () => {
    if (lifeStage === 'flow' && cycleData) {
      return [
      { label: tr("doctorreportscreen_dovre_uzunlugu_c81215", 'Dövrə uzunluğu'), value: `${cycleData.cycleLength} ${tr("common_gun", "gün")}`, icon: Calendar },
      { label: tr("doctorreportscreen_menstruasiya_1c9b68", 'Menstruasiya'), value: `${cycleData.periodLength} ${tr("common_gun", "gün")}`, icon: Droplets },
      { label: tr("doctorreportscreen_cari_faza_b4862a", 'Cari faza'), value: cycleData.phase, icon: Activity },
      { label: tr("doctorreportscreen_dovrenin_gunu_7549f2", 'Dövrənin günü'), value: `${cycleData.currentDay}`, icon: Heart }];

    }
    if (lifeStage === 'bump' && pregData) {
      return [
      { label: tr("doctorreportscreen_hamilelik_heftesi_c9e362", 'Hamiləlik həftəsi'), value: `${pregData.currentWeek} ${tr("common_hefte_suffix", "həftə")}`, icon: Calendar },
      { label: tr("doctorreportscreen_trimester_4dc81e", 'Trimester'), value: tr("doctorreportscreen_trimester_value_8dc81e", "{trimester}-cü").replace("{trimester}", String(pregData.trimester)), icon: Activity },
      { label: tr("doctorreportscreen_korpe_olcusu_cccfc2", 'Körpə ölçüsü'), value: pregData.babySize.fruit, icon: Heart },
      { label: tr("doctorreportscreen_texmini_dogus_98eb77", 'Təxmini doğuş'), value: pregData.dueDate?.toLocaleDateString(getLocaleTag()), icon: Calendar }];

    }
    if (lifeStage === 'mommy' && babyData) {
      return [
      { label: tr("doctorreportscreen_korpenin_adi_8a4e9e", 'Körpənin adı'), value: babyData.name, icon: Heart },
      { label: tr("doctorreportscreen_yas_95595b", 'Yaş'), value: babyData.ageInMonths > 0 ? `${babyData.ageInMonths} ${tr("common_ay", "ay")}` : `${babyData.ageInDays} ${tr("common_gun", "gün")}`, icon: Calendar },
      { label: tr("doctorreportscreen_dogum_tarixi_d96907", 'Doğum tarixi'), value: babyData.birthDate.toLocaleDateString(getLocaleTag()), icon: Calendar },
      { label: tr("doctorreportscreen_cinsiyyet_1526fb", 'Cinsiyyət'), value: babyData.gender === 'boy' ? tr("doctorreportscreen_oglan_e9715e", "O\u011Flan") : tr("doctorreportscreen_qiz_79bf6b", "Q\u0131z"), icon: Activity }];

    }
    return [];
  };

  return (
    <div className="a-scope safe-top min-h-screen pb-28 overflow-y-auto" style={{ background: 'var(--a-bg)' }}>
      <div className="a-shell">
        {/* Top bar */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.95 }} aria-label={tr("common_geri", "Geri")}>
              <ArrowLeft size={16} strokeWidth={2} />
            </motion.button>
            <div>
              <p className="a-eyebrow">{tr("doctorreportscreen_saglamliq_melumatlariniz_fc569c", "Sağlamlıq məlumatlarınız")}</p>
              <p className="a-wordmark" style={{ fontSize: 16 }}>{tr("doctorreportscreen_hekim_hesabati_0525fc", "Həkim Hesabatı")}</p>
            </div>
          </div>
        </header>

        <div className="space-y-3.5">
          {/* Report Preview Card */}
          <motion.div
            className="a-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ borderRadius: 18, background: 'var(--a-peach-1)' }}>
                <FileText size={26} style={{ color: 'var(--a-accent-ink)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--a-ink)' }}>{name || tr("doctorreportscreen_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</h2>
                <p style={{ fontSize: 12.5, color: 'var(--a-ink-soft)' }}>
                  {tr("doctorreport_hesabat_tarixi", 'Hesabat tarixi:')} {new Date().toLocaleDateString(getLocaleTag())}
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="a-tabs" style={{ marginBottom: 16 }}>
              {periods.map((period) =>
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`a-tab ${selectedPeriod === period.id ? 'active' : ''}`}>

                  {period.label}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
              { icon: Download, label: tr("doctorreportscreen_yukle_2b8e67", "Yüklə"), onClick: handleDownload },
              { icon: Share2, label: tr("doctorreportscreen_paylas_b4be3b", "Paylaş"), onClick: handleShare },
              { icon: Mail, label: 'Email', onClick: handleShare }].
              map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={generating}
                    className="flex flex-col items-center gap-2 disabled:opacity-50"
                    style={{ padding: 14, borderRadius: 16, background: 'var(--a-surface-soft)' }}
                    whileTap={{ scale: 0.95 }}>

                    {generating ? <Loader2 size={20} className="animate-spin" style={{ color: 'var(--a-accent-ink)' }} /> : <Icon size={20} style={{ color: 'var(--a-accent-ink)' }} />}
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--a-ink)' }}>{action.label}</span>
                  </motion.button>);

              })}
            </div>
          </motion.div>

          {/* Stage Specific Data */}
          <motion.div
            className="a-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}>

            <h3 className="a-card-title" style={{ marginBottom: 14 }}>{tr("doctorreportscreen_esas_melumatlar_56bfed", "Əsas Məlumatlar")}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {getStageSpecificData().map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    style={{ background: 'var(--a-surface-soft)', borderRadius: 16, padding: 14 }}>

                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={14} style={{ color: 'var(--a-accent-ink)' }} />
                      <span style={{ fontSize: 11, color: 'var(--a-ink-soft)', fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--a-ink)' }}>{item.value}</p>
                  </div>);

              })}
            </div>
          </motion.div>

          {/* Körpə qulluq statistikası (mommy) */}
          {lifeStage === 'mommy' && babyCareRows.length > 0 &&
          <motion.div
            className="a-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}>

              <h3 className="a-card-title" style={{ marginBottom: 14 }}>{tr("pdf_section_babycare", "Körpə Qulluğu (dövr üzrə)")}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {babyCareRows.map((item, index) =>
              <div
                key={index}
                style={{ background: 'var(--a-surface-soft)', borderRadius: 16, padding: 14 }}>

                    <p style={{ fontSize: 11, color: 'var(--a-ink-soft)', fontWeight: 600, marginBottom: 6 }}>{item.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--a-ink)' }}>{item.value}</p>
                  </div>
              )}
              </div>
            </motion.div>
          }

          {/* Health Trends - Real data from backend */}
          <motion.div
            className="a-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}>

            <h3 className="a-card-title" style={{ marginBottom: 14 }}>{tr("doctorreportscreen_saglamliq_trendleri_5c9dd9", "Sağlamlıq Trendləri")}</h3>
            {healthLoading ?
            <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--a-peach-2)', borderTopColor: 'transparent' }} />
              </div> :

            <div className="space-y-2.5">
                {healthData.map((item, index) =>
              <div
                key={index}
                className="flex items-center justify-between"
                style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--a-surface-soft)' }}>

                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-ink)' }}>{item.label}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--a-ink-soft)' }}>{item.value}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: item.positive ? 'var(--a-green-ink)' : 'var(--a-yellow-ink)' }}>
                      {item.trend}
                    </span>
                  </div>
              )}
              </div>
            }
          </motion.div>

          {/* Notes Section */}
          <motion.div
            className="a-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}>

            <h3 className="a-card-title" style={{ marginBottom: 14 }}>{tr("doctorreportscreen_hekim_ucun_qeydler_052b91", "Həkim üçün Qeydlər")}</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr('pdf_notes_ph', 'Həkiminiz üçün əlavə qeydlər yazın...')}
              className="w-full h-24 resize-none outline-none"
              style={{ padding: 14, borderRadius: 16, background: 'var(--a-surface-soft)', fontSize: 13, color: 'var(--a-ink)', border: '1px solid transparent' }} />

          </motion.div>

          {/* Export Full Report */}
          <motion.button
            onClick={handleDownload}
            disabled={generating}
            className="w-full text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--a-peach-2)', borderRadius: 999, padding: '15px 16px', fontSize: 14.5, fontWeight: 700, boxShadow: '0 16px 32px -12px rgba(217, 108, 74, 0.6)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}>

            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {generating ? tr("doctorreportscreen_hesabat_hazirlanir_37c97d", 'Hesabat hazırlanır...') : tr("doctorreportscreen_tam_hesabati_yukle_pdf_108b98", "Tam Hesabat\u0131 Y\xFCkl\u0259 (PDF)")}
            {!isPremium && <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.25)' }}>👑 PREMIUM</span>}
          </motion.button>
        </div>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="doctor_report" />
    </div>);

};

export default DoctorReportScreen;
