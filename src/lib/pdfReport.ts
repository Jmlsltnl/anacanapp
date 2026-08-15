import { jsPDF } from 'jspdf';
import { getLocaleTag } from '@/lib/i18n';
import { Capacitor } from '@capacitor/core';
import { tr, getPersistedLanguage } from '@/lib/tr';
import { isRtlLang } from '@/lib/rtl';

/**
 * Real PDF Həkim Hesabatı — jsPDF + NotoSans (AZ/Latin+Kiril hərfləri üçün)
 * + NotoNaskhArabic (ər dili üçün, RTL güzgülənmiş layout).
 * Şriftlər public/fonts-dan lazy yüklənir və modul səviyyəsində keşlənir.
 *
 * QEYD (ar hərf birləşdirmə): jsPDF-in daxili "arabic" əlavəsi (processArabic,
 * preProcessText hook-u ilə) hər doc.text() çağırışında avtomatik işə düşür —
 * hərf birləşdirmə (initial/medial/final/isolated formalar) VƏ düzgün vizual
 * sıralama artıq ediləcək (empirik yoxlanılıb: brauzerin öz render mühərriyi
 * ilə piksel-səviyyəsində müqayisə edilib).
 *
 * QEYD (qarışıq mətn): jsPDF-in xüsusi TTF (Identity-H) şriftləri qlif tapılmayan
 * simvolları SƏSSİZCƏ SİLİR (tofu qutusu əvəzinə) — NotoNaskhArabic-də Latın
 * hərfləri və bəzi durğu işarələri (parentez, defis, mötərizə və s.) YOXDUR.
 * Ona görə ərəb hərfi olan HƏR mətn writeSmart() vasitəsilə "run"-lara bölünür:
 * ərəb-hərfli seqmentlər NotoSansArabic, digərləri (rəqəm/vahid/Latın söz) əsas
 * şriftlə çəkilir, sağ-kənardan-sola kürsör məntiqi ilə düzgün RTL sırada. Bidi
 * güzgüləmə qaydası (parentez/mötərizə RTL-də əks istiqamətdə göstərilir) də
 * tətbiq olunur.
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
let arabicFontLoaded = false;

// Mətndə ərəb hərfi varmı? (langDetect.ts ilə eyni blok)
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;
const hasArabicScript = (s: string): boolean => ARABIC_RE.test(s);

// Unicode bidi güzgüləmə: cüt-mötərizəli simvollar RTL axında əks forma göstərir
// (browser-lər bunu avtomatik edir, jsPDF etmir — özümüz tətbiq edirik).
const MIRROR_MAP: Record<string, string> = {
  '(': ')', ')': '(',
  '[': ']', ']': '[',
  '{': '}', '}': '{',
  '<': '>', '>': '<',
  '«': '»', '»': '«',
};
const mirrorForRtl = (s: string): string => s.replace(/[()[\]{}<>«»]/g, (c) => MIRROR_MAP[c] ?? c);

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

/** Ərəb şriftini lazy yüklə (yalnız language==='ar' olanda çağırılır). */
const ensureArabicFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    if (!arabicFontLoaded) {
      const [regular, bold] = await Promise.all([
      fetchFontBase64('/fonts/NotoNaskhArabic-Regular.ttf'),
      fetchFontBase64('/fonts/NotoNaskhArabic-Bold.ttf')]
      );
      doc.addFileToVFS('NotoNaskhArabic-Regular.ttf', regular);
      doc.addFont('NotoNaskhArabic-Regular.ttf', 'NotoSansArabic', 'normal');
      doc.addFileToVFS('NotoNaskhArabic-Bold.ttf', bold);
      doc.addFont('NotoNaskhArabic-Bold.ttf', 'NotoSansArabic', 'bold');
      arabicFontLoaded = true;
    } else {
      doc.addFont('NotoNaskhArabic-Regular.ttf', 'NotoSansArabic', 'normal');
      doc.addFont('NotoNaskhArabic-Bold.ttf', 'NotoSansArabic', 'bold');
    }
    return true;
  } catch (e) {
    console.warn('Arabic PDF font unavailable, Arabic text may render blank:', e);
    return false;
  }
};

// ── Palitra ────────────────────────────────────────────────────
const PEACH: [number, number, number] = [255, 157, 99];
const PEACH_SOFT: [number, number, number] = [255, 231, 225];
const INK: [number, number, number] = [51, 51, 51];
const INK_SOFT: [number, number, number] = [140, 129, 119];

interface Run {text: string;arabic: boolean;}

/** Mətni ərəb-hərfli / digər seqmentlərə bölür (bitişik boşluqlar əvvəlki seqmenta qoşulur). */
const splitRuns = (text: string): Run[] => {
  const runs: Run[] = [];
  for (const ch of text) {
    const isAr = ARABIC_RE.test(ch);
    const isSpace = ch === ' ';
    const last = runs[runs.length - 1];
    if (last && (isSpace || last.arabic === isAr)) {
      last.text += ch;
    } else {
      runs.push({ text: ch, arabic: isAr });
    }
  }
  return runs;
};

export const generateDoctorReportPdf = async (data: DoctorReportData): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const hasFonts = await ensureFonts(doc);
  const font = hasFonts ? 'NotoSans' : 'helvetica';

  const isRtl = isRtlLang(getPersistedLanguage());
  const hasArabicFont = isRtl ? await ensureArabicFont(doc) : false;

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  /**
   * Bütün mətn çəkilişi bu funksiyadan keçir. Ərəb hərfi olmayan mətnlər üçün
   * sadə tək-şrift yolu (sürətli); ərəb hərfli mətnlər üçün run-əsaslı RTL-təhlükəsiz
   * çəkiliş (heç bir simvol itkisi olmadan, bax fayl başlığındakı qeyd).
   */
  const writeSmart = (
  text: string,
  x: number,
  y2: number,
  weight: 'normal' | 'bold',
  size: number,
  color: [number, number, number] = INK,
  align: 'left' | 'right' | 'center' = 'left')
  : void => {
    doc.setTextColor(color[0], color[1], color[2]);
    if (!hasArabicFont || !hasArabicScript(text)) {
      doc.setFont(font, weight);
      doc.setFontSize(size);
      doc.text(text, x, y2, align === 'left' ? undefined : { align });
      return;
    }
    const runs = splitRuns(text);
    const widths = runs.map((r) => {
      doc.setFont(r.arabic ? 'NotoSansArabic' : font, weight);
      doc.setFontSize(size);
      return doc.getTextWidth(r.arabic ? r.text : mirrorForRtl(r.text));
    });
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const rightEdge = align === 'right' ? x : align === 'center' ? x + totalWidth / 2 : x + totalWidth;
    let cursor = rightEdge;
    for (let i = 0; i < runs.length; i++) {
      doc.setFont(runs[i].arabic ? 'NotoSansArabic' : font, weight);
      doc.setFontSize(size);
      doc.text(runs[i].arabic ? runs[i].text : mirrorForRtl(runs[i].text), cursor, y2, { align: 'right' });
      cursor -= widths[i];
    }
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
    doc.setDrawColor(PEACH[0], PEACH[1], PEACH[2]);
    doc.setLineWidth(0.7);
    if (isRtl) {
      writeSmart(title, pageW - margin, y, 'bold', 12, INK, 'right');
      y += 2.5;
      doc.line(pageW - margin - 24, y, pageW - margin, y);
    } else {
      writeSmart(title, margin, y, 'bold', 12, INK, 'left');
      y += 2.5;
      doc.line(margin, y, margin + 24, y);
    }
    y += 6;
  };

  /** 2-sütunlu grid (əsas məlumatlar / körpə qulluğu) — RTL-də sütun sırası güzgülənir. */
  const drawTwoColGrid = (rows: StageRow[]) => {
    const colW = contentW / 2;
    rows.forEach((row, i) => {
      const col = i % 2;
      if (col === 0) ensureSpace(12);
      const val = String(row.value ?? '—');
      if (isRtl) {
        const cellRight = col === 0 ? pageW - margin : margin + colW;
        writeSmart(row.label, cellRight, y, 'normal', 8.5, INK_SOFT, 'right');
        writeSmart(val, cellRight, y + 5, 'bold', 11, INK, 'right');
      } else {
        const x = margin + col * colW;
        writeSmart(row.label, x, y, 'normal', 8.5, INK_SOFT, 'left');
        writeSmart(val, x, y + 5, 'bold', 11, INK, 'left');
      }
      if (col === 1 || i === rows.length - 1) y += 12;
    });
  };

  // ── Başlıq zolağı ──
  doc.setFillColor(PEACH_SOFT[0], PEACH_SOFT[1], PEACH_SOFT[2]);
  doc.rect(0, 0, pageW, 34, 'F');
  doc.setFillColor(PEACH[0], PEACH[1], PEACH[2]);
  const subtitleText = tr('pdf_report_subtitle', 'Həkim Hesabatı');
  const dateStr = new Date().toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'long', year: 'numeric' });
  if (isRtl) {
    doc.circle(pageW - margin - 5, 17, 5, 'F');
    writeSmart('Anacan', pageW - margin - 14, 15, 'bold', 17, INK, 'right');
    writeSmart(subtitleText, pageW - margin - 14, 21.5, 'normal', 10.5, INK_SOFT, 'right');
    writeSmart(dateStr, margin, 15, 'normal', 8.5, INK_SOFT, 'left');
    writeSmart(data.periodLabel, margin, 20.5, 'normal', 8.5, INK_SOFT, 'left');
  } else {
    doc.circle(margin + 5, 17, 5, 'F');
    writeSmart('Anacan', margin + 14, 15, 'bold', 17, INK, 'left');
    writeSmart(subtitleText, margin + 14, 21.5, 'normal', 10.5, INK_SOFT, 'left');
    writeSmart(dateStr, pageW - margin, 15, 'normal', 8.5, INK_SOFT, 'right');
    writeSmart(data.periodLabel, pageW - margin, 20.5, 'normal', 8.5, INK_SOFT, 'right');
  }
  y = 44;

  // ── Pasiyent ──
  if (isRtl) {
    writeSmart(data.userName, pageW - margin, y, 'bold', 13.5, INK, 'right');
    writeSmart(data.stageTitle, pageW - margin, y + 6, 'normal', 10, INK_SOFT, 'right');
  } else {
    writeSmart(data.userName, margin, y, 'bold', 13.5, INK, 'left');
    writeSmart(data.stageTitle, margin, y + 6, 'normal', 10, INK_SOFT, 'left');
  }
  y += 14;

  // ── Əsas məlumatlar (2 sütun grid) ──
  if (data.stageRows.length > 0) {
    sectionTitle(tr('pdf_section_basics', 'Əsas Məlumatlar'));
    drawTwoColGrid(data.stageRows);
  }

  // ── Sağlamlıq trendləri ──
  if (data.trends.length > 0) {
    sectionTitle(tr('pdf_section_trends', 'Sağlamlıq Trendləri'));
    data.trends.forEach((t) => {
      ensureSpace(8);
      if (isRtl) {
        writeSmart(t.label, pageW - margin, y, 'normal', 9.5, INK, 'right');
        writeSmart(t.value, pageW - margin - 70, y, 'normal', 9, INK_SOFT, 'right');
        writeSmart(t.trend, margin, y, 'bold', 9.5, INK, 'left');
      } else {
        writeSmart(t.label, margin, y, 'normal', 9.5, INK, 'left');
        writeSmart(t.value, margin + 70, y, 'normal', 9, INK_SOFT, 'left');
        writeSmart(t.trend, pageW - margin, y, 'bold', 9.5, INK, 'right');
      }
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
    drawTwoColGrid(data.babyCareRows);
  }

  // ── Qan təzyiqi ──
  if (data.bpRows && data.bpRows.length > 0) {
    sectionTitle(tr('pdf_section_bp', 'Qan Təzyiqi (son ölçmələr)'));
    data.bpRows.forEach((b) => {
      ensureSpace(8);
      if (isRtl) {
        writeSmart(b.date, pageW - margin, y, 'normal', 9, INK_SOFT, 'right');
        writeSmart(b.reading, pageW - margin - 45, y, 'bold', 10, INK, 'right');
        writeSmart(b.category, margin, y, 'normal', 9, INK_SOFT, 'left');
      } else {
        writeSmart(b.date, margin, y, 'normal', 9, INK_SOFT, 'left');
        writeSmart(b.reading, margin + 45, y, 'bold', 10, INK, 'left');
        writeSmart(b.category, pageW - margin, y, 'normal', 9, INK_SOFT, 'right');
      }
      y += 7;
    });
  }

  // ── Qeydlər ──
  if (data.notes && data.notes.trim()) {
    sectionTitle(tr('pdf_section_notes', 'Həkim üçün Qeydlər'));
    const notesText = data.notes.trim();
    // splitTextToSize ölçmə üçün AKTİV şrifti istifadə edir — qarışıq mətndə təxmini
    // (100% dəqiq per-simvol ölçmə tələb etməz), amma simvol itkisi YOXDUR (hər sətir
    // sonra writeSmart-dan keçir).
    doc.setFont(hasArabicFont && hasArabicScript(notesText) ? 'NotoSansArabic' : font, 'normal');
    doc.setFontSize(9.5);
    const lines: string[] = doc.splitTextToSize(notesText, contentW);
    ensureSpace(lines.length * 5 + 4);
    lines.forEach((line, i) => {
      if (isRtl) writeSmart(line, pageW - margin, y + i * 5, 'normal', 9.5, INK, 'right');
      else writeSmart(line, margin, y + i * 5, 'normal', 9.5, INK, 'left');
    });
    y += lines.length * 5 + 4;
  }

  // ── Alt yazı ──
  const pageCount = doc.getNumberOfPages();
  const footerText = tr('pdf_footer', 'Anacan tətbiqi ilə yaradılıb · Bu hesabat tibbi sənəd deyil, məlumat xarakterlidir.');
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    writeSmart(footerText, pageW / 2, 291, 'normal', 7.5, INK_SOFT, 'center');
    const pageNumText = `${p}/${pageCount}`;
    if (isRtl) writeSmart(pageNumText, margin, 291, 'normal', 7.5, INK_SOFT, 'left');
    else writeSmart(pageNumText, pageW - margin, 291, 'normal', 7.5, INK_SOFT, 'right');
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
