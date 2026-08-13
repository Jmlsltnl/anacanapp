import { jsPDF } from 'jspdf';
import { getLocaleTag } from '@/lib/i18n';
import { Capacitor } from '@capacitor/core';
import { tr } from '@/lib/tr';

/**
 * Real PDF Həkim Hesabatı — jsPDF + NotoSans (AZ hərfləri üçün).
 * Şriftlər public/fonts-dan lazy yüklənir və modul səviyyəsində keşlənir.
 */

interface StageRow {label: string;value: string;}
interface TrendRow {label: string;value: string;trend: string;}
interface BpRow {date: string;reading: string;category: string;}

export interface DoctorReportData {
  userName: string;
  stageTitle: string;
  stageRows: StageRow[];
  trends: TrendRow[];
  bpRows?: BpRow[];
  babyCareRows?: StageRow[]; // körpə qulluq statistikası (yuxu/qida/bez)
  notes?: string;
  periodLabel: string;
}

// ── Şrift keşi ─────────────────────────────────────────────────
let fontsLoaded = false;

const fetchFontBase64 = async (path: string): Promise<string> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Font fetch failed: ${path}`);
  const buf = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const ensureFonts = async (doc: jsPDF): Promise<boolean> => {
  try {
    if (!fontsLoaded) {
      const [regular, bold] = await Promise.all([
      fetchFontBase64('/fonts/NotoSans-Regular.ttf'),
      fetchFontBase64('/fonts/NotoSans-Bold.ttf')]
      );
      // VFS qlobaldir — bir dəfə əlavə etmək kifayətdir
      doc.addFileToVFS('NotoSans-Regular.ttf', regular);
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.addFileToVFS('NotoSans-Bold.ttf', bold);
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
      fontsLoaded = true;
    } else {
      // Yeni doc instansiyasında da qeydiyyat lazımdır (VFS statikdir, font map deyil)
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    }
    return true;
  } catch (e) {
    console.warn('PDF fonts unavailable, falling back to helvetica:', e);
    return false;
  }
};

// ── Palitra ────────────────────────────────────────────────────
const PEACH: [number, number, number] = [255, 157, 99];
const PEACH_SOFT: [number, number, number] = [255, 231, 225];
const INK: [number, number, number] = [51, 51, 51];
const INK_SOFT: [number, number, number] = [140, 129, 119];

export const generateDoctorReportPdf = async (data: DoctorReportData): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const hasFonts = await ensureFonts(doc);
  const font = hasFonts ? 'NotoSans' : 'helvetica';

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  const setFont = (weight: 'normal' | 'bold', size: number, color: [number, number, number] = INK) => {
    doc.setFont(font, weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > 282) {
      doc.addPage();
      y = 18;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(16);
    y += 4;
    setFont('bold', 12);
    doc.text(title, margin, y);
    y += 2.5;
    doc.setDrawColor(PEACH[0], PEACH[1], PEACH[2]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + 24, y);
    y += 6;
  };

  // ── Başlıq zolağı ──
  doc.setFillColor(PEACH_SOFT[0], PEACH_SOFT[1], PEACH_SOFT[2]);
  doc.rect(0, 0, pageW, 34, 'F');
  doc.setFillColor(PEACH[0], PEACH[1], PEACH[2]);
  doc.circle(margin + 5, 17, 5, 'F');
  setFont('bold', 17);
  doc.text('Anacan', margin + 14, 15);
  setFont('normal', 10.5, INK_SOFT);
  doc.text(tr('pdf_report_subtitle', 'Həkim Hesabatı'), margin + 14, 21.5);
  setFont('normal', 8.5, INK_SOFT);
  const dateStr = new Date().toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(dateStr, pageW - margin, 15, { align: 'right' });
  doc.text(data.periodLabel, pageW - margin, 20.5, { align: 'right' });
  y = 44;

  // ── Pasiyent ──
  setFont('bold', 13.5);
  doc.text(data.userName, margin, y);
  setFont('normal', 10, INK_SOFT);
  doc.text(data.stageTitle, margin, y + 6);
  y += 14;

  // ── Əsas məlumatlar (2 sütun grid) ──
  if (data.stageRows.length > 0) {
    sectionTitle(tr('pdf_section_basics', 'Əsas Məlumatlar'));
    const colW = contentW / 2;
    data.stageRows.forEach((row, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(12);
      const x = margin + col * colW;
      setFont('normal', 8.5, INK_SOFT);
      doc.text(row.label, x, y);
      setFont('bold', 11);
      doc.text(String(row.value ?? '—'), x, y + 5);
      if (col === 1 || i === data.stageRows.length - 1) y += 12;
    });
  }

  // ── Sağlamlıq trendləri ──
  if (data.trends.length > 0) {
    sectionTitle(tr('pdf_section_trends', 'Sağlamlıq Trendləri'));
    data.trends.forEach((t) => {
      ensureSpace(8);
      setFont('normal', 9.5);
      doc.text(t.label, margin, y);
      setFont('normal', 9, INK_SOFT);
      doc.text(t.value, margin + 70, y);
      setFont('bold', 9.5);
      doc.text(t.trend, pageW - margin, y, { align: 'right' });
      y += 3;
      doc.setDrawColor(235, 228, 222);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
    });
  }

  // ── Körpə qulluq statistikası (yuxu/qidalanma/bez) ──
  if (data.babyCareRows && data.babyCareRows.length > 0) {
    sectionTitle(tr('pdf_section_babycare', 'Körpə Qulluğu (dövr üzrə)'));
    const colW = contentW / 2;
    data.babyCareRows.forEach((row, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(12);
      const x = margin + col * colW;
      setFont('normal', 8.5, INK_SOFT);
      doc.text(row.label, x, y);
      setFont('bold', 11);
      doc.text(String(row.value ?? '—'), x, y + 5);
      if (col === 1 || i === data.babyCareRows.length - 1) y += 12;
    });
  }

  // ── Qan təzyiqi ──
  if (data.bpRows && data.bpRows.length > 0) {
    sectionTitle(tr('pdf_section_bp', 'Qan Təzyiqi (son ölçmələr)'));
    data.bpRows.forEach((b) => {
      ensureSpace(8);
      setFont('normal', 9, INK_SOFT);
      doc.text(b.date, margin, y);
      setFont('bold', 10);
      doc.text(b.reading, margin + 45, y);
      setFont('normal', 9, INK_SOFT);
      doc.text(b.category, pageW - margin, y, { align: 'right' });
      y += 7;
    });
  }

  // ── Qeydlər ──
  if (data.notes && data.notes.trim()) {
    sectionTitle(tr('pdf_section_notes', 'Həkim üçün Qeydlər'));
    setFont('normal', 9.5);
    const lines = doc.splitTextToSize(data.notes.trim(), contentW);
    ensureSpace(lines.length * 5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // ── Alt yazı ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setFont('normal', 7.5, INK_SOFT);
    doc.text(
      tr('pdf_footer', 'Anacan tətbiqi ilə yaradılıb · Bu hesabat tibbi sənəd deyil, məlumat xarakterlidir.'),
      pageW / 2, 291, { align: 'center' }
    );
    doc.text(`${p}/${pageCount}`, pageW - margin, 291, { align: 'right' });
  }

  return doc;
};

/** PDF-i paylaş (native share picker) və ya yüklə (web). */
export const deliverPdf = async (doc: jsPDF, fileName: string, mode: 'download' | 'share'): Promise<'shared' | 'downloaded'> => {
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const canShareFiles = typeof navigator !== 'undefined' &&
  !!navigator.canShare && navigator.canShare({ files: [file] });

  // Native-də (və dəstəkləyən brauzerlərdə) paylaşma pəncərəsi
  if ((mode === 'share' || Capacitor.isNativePlatform()) && canShareFiles) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'shared'; // istifadəçi bağladı
      console.warn('share failed, falling back to download:', e);
    }
  }

  doc.save(fileName);
  return 'downloaded';
};
