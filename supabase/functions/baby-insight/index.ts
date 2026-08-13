/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// baby-insight: Yuxu / Qidalanma / Bez göstəricilərinin körpənin yaşına görə
// AI norma analizi — qısa, effektiv, 4 dildə. Diaqnoz yox, məlumat + istiqamət.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callGeminiSmart } from "../_shared/vertex-ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface InsightRequest {
  language?: string;
  child: {
    ageMonths: number;
    ageDays: number;
    gender?: string;
  };
  stats: {
    localHour: number;        // günün neçəsidir (0-23) — natamam gün konteksti
    sleepMinutes: number;     // bugünkü cəmi yuxu (dəq)
    sleepCount: number;
    feedingCount: number;
    breastCount: number;
    formulaCount: number;
    formulaMl: number;        // cəmi ml (məlumdursa)
    solidCount: number;
    diaperCount: number;
    wetCount: number;
    dirtyCount: number;
    mixedCount: number;
  };
}

type SectionStatus = 'normal' | 'low' | 'high' | 'watch';
interface SectionInsight { status: SectionStatus; note: string; }
interface Insight { sleep: SectionInsight; feeding: SectionInsight; diaper: SectionInsight; }

const FALLBACK: Record<string, Insight> = {
  az: {
    sleep: { status: 'normal', note: 'Yuxu qeydləri toplanır — gün boyu izləməyə davam edin.' },
    feeding: { status: 'normal', note: 'Qidalanma qeydləri toplanır — hər qidalanmanı qeyd etməyə çalışın.' },
    diaper: { status: 'normal', note: 'Bez qeydləri toplanır — nəm bezlər qidalanmanın yaxşı göstəricisidir.' },
  },
  en: {
    sleep: { status: 'normal', note: 'Sleep data is being collected — keep tracking through the day.' },
    feeding: { status: 'normal', note: 'Feeding data is being collected — try to log every feed.' },
    diaper: { status: 'normal', note: 'Diaper data is being collected — wet diapers are a good sign of feeding.' },
  },
  ru: {
    sleep: { status: 'normal', note: 'Данные о сне собираются — продолжайте отмечать в течение дня.' },
    feeding: { status: 'normal', note: 'Данные о кормлении собираются — старайтесь отмечать каждое кормление.' },
    diaper: { status: 'normal', note: 'Данные о подгузниках собираются — мокрые подгузники — хороший признак питания.' },
  },
  tr: {
    sleep: { status: 'normal', note: 'Uyku kayıtları toplanıyor — gün boyunca izlemeye devam edin.' },
    feeding: { status: 'normal', note: 'Beslenme kayıtları toplanıyor — her beslenmeyi kaydetmeye çalışın.' },
    diaper: { status: 'normal', note: 'Bez kayıtları toplanıyor — ıslak bezler beslenmenin iyi bir göstergesidir.' },
  },
};

const LANG_CONF: Record<string, { outLang: string }> = {
  az: { outLang: '' },
  en: { outLang: 'ENGLISH' },
  ru: { outLang: 'RUSSIAN' },
  tr: { outLang: 'TURKISH' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { language = 'az', child, stats } = await req.json() as InsightRequest;
    if (!child || !stats) throw new Error('child and stats required');

    const langConf = LANG_CONF[language] ?? LANG_CONF.az;

    const ageDesc = child.ageMonths < 1
      ? `${child.ageDays} günlük yenidoğan`
      : child.ageMonths < 24
        ? `${child.ageMonths} aylıq körpə`
        : `${Math.floor(child.ageMonths / 12)} yaşlı uşaq`;

    const sleepH = Math.floor(stats.sleepMinutes / 60);
    const sleepM = stats.sleepMinutes % 60;

    const prompt = `Sən Anacan tətbiqinin pediatrik məlumat köməkçisisən (həkim DEYİLSƏN, diaqnoz qoymursan).
Körpənin BUGÜNKÜ qulluq göstəricilərini yaşına uyğun normalarla (ÜST/AAP təlimatları əsasında) müqayisə et.

KÖRPƏ: ${ageDesc}${child.gender ? ` (${child.gender === 'girl' ? 'qız' : 'oğlan'})` : ''}
VAXT KONTEKSTİ: hazırda saat təxminən ${stats.localHour}:00 — gün hələ bitməyib, göstəriciləri günün bu hissəsinə görə qiymətləndir (məsələn, səhər saatlarında az qeyd normaldır).

BUGÜNKÜ QEYDLƏR:
- Yuxu: ${sleepH} saat ${sleepM} dəq (${stats.sleepCount} seans)
- Qidalanma: cəmi ${stats.feedingCount} dəfə (ana südü: ${stats.breastCount}, süd əvəzedicisi: ${stats.formulaCount}${stats.formulaMl > 0 ? ` / ${stats.formulaMl} ml` : ''}, əlavə qida: ${stats.solidCount})
- Bez: cəmi ${stats.diaperCount} (nəm: ${stats.wetCount}, çirkli: ${stats.dirtyCount}, qarışıq: ${stats.mixedCount})

YAŞ NORMALARI (istinad üçün, 24 saatlıq):
- 0-3 ay: yuxu 14-17s; qidalanma 8-12 dəfə; nəm bez 6+; nəcis 3-4+ (yaş artdıqca seyrəkləşə bilər)
- 4-6 ay: yuxu 12-16s; qidalanma 6-8 dəfə; nəm bez 5-6
- 7-12 ay: yuxu 12-15s; qidalanma 5-6 dəfə + əlavə qida; nəm bez 5-6
- 13-24 ay: yuxu 11-14s; 3 əsas + 2 qəlyanaltı; bez 4-6
- 24+ ay: yuxu 10-13s; 3 əsas + qəlyanaltılar

QAYDALAR:
1. Hər bölmə üçün status seç: "normal" | "low" (günün vaxtına görə gözləniləndən az) | "high" (çox) | "watch" (diqqət tələb edir, məs. 0 nəm bez axşama yaxın)
2. Hər note MAKSİMUM 140 simvol, konkret və faydalı olsun (rəqəm + qısa istiqamət). Ümumi sözlərdən qaç.
3. Sakitləşdirici, dəstəkləyici ton. Qorxutma. Ciddi hal şübhəsində "həkimlə məsləhətləşin" de.
4. Qeyd azdırsa bunu nəzərə al — valideyn hər şeyi qeyd etməyə bilər.

YALNIZ bu JSON formatında cavab ver (başqa heç nə yazma):
{"sleep":{"status":"normal","note":"..."},"feeding":{"status":"normal","note":"..."},"diaper":{"status":"normal","note":"..."}}${langConf.outLang ? `

IMPORTANT: Write ALL "note" text values in ${langConf.outLang}. Keep JSON keys and status enum values exactly as shown.` : ''}`;

    const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    let geminiResponse: Response | null = null;
    for (const model of models) {
      geminiResponse = await callGeminiSmart(model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      });
      if (geminiResponse.ok) break;
    }

    let insight: Insight | null = null;
    if (geminiResponse && geminiResponse.ok) {
      const g = await geminiResponse.json();
      const textContent = g?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const m = textContent.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          const ok = (s: any): s is SectionInsight =>
            s && typeof s.note === 'string' && ['normal', 'low', 'high', 'watch'].includes(s.status);
          if (ok(parsed.sleep) && ok(parsed.feeding) && ok(parsed.diaper)) {
            insight = {
              sleep: { status: parsed.sleep.status, note: String(parsed.sleep.note).slice(0, 200) },
              feeding: { status: parsed.feeding.status, note: String(parsed.feeding.note).slice(0, 200) },
              diaper: { status: parsed.diaper.status, note: String(parsed.diaper.note).slice(0, 200) },
            };
          }
        } catch { /* fallback aşağıda */ }
      }
    }

    if (!insight) {
      insight = FALLBACK[language] ?? FALLBACK.az;
    }

    return new Response(JSON.stringify({ success: true, insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('baby-insight error:', error);
    return new Response(JSON.stringify({ success: false, error: String((error as Error)?.message ?? error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
