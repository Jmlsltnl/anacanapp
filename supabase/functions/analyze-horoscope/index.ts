import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HoroscopeRequest {
  mom_birth_date: string;
  mom_birth_time?: string;
  dad_birth_date?: string;
  dad_birth_time?: string;
  baby_birth_date?: string;
  baby_birth_time?: string;
  baby_due_date?: string;
}

// Calculate zodiac sign from date
function getZodiacSign(dateStr: string): { sign: string; signAz: string; symbol: string; element: string } {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signs = [
    { sign: 'Capricorn', signAz: 'Oğlaq', symbol: '♑', element: 'earth', start: [12, 22], end: [1, 19] },
    { sign: 'Aquarius', signAz: 'Dolça', symbol: '♒', element: 'air', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', signAz: 'Balıqlar', symbol: '♓', element: 'water', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', signAz: 'Qoç', symbol: '♈', element: 'fire', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', signAz: 'Buğa', symbol: '♉', element: 'earth', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', signAz: 'Əkizlər', symbol: '♊', element: 'air', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', signAz: 'Xərçəng', symbol: '♋', element: 'water', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', signAz: 'Şir', symbol: '♌', element: 'fire', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', signAz: 'Qız', symbol: '♍', element: 'earth', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', signAz: 'Tərəzi', symbol: '♎', element: 'air', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', signAz: 'Əqrəb', symbol: '♏', element: 'water', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', signAz: 'Oxatan', symbol: '♐', element: 'fire', start: [11, 22], end: [12, 21] },
  ];

  for (const s of signs) {
    const [startMonth, startDay] = s.start;
    const [endMonth, endDay] = s.end;

    if (startMonth > endMonth) {
      // Crosses year boundary (Capricorn)
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return s;
      }
    } else {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay) ||
          (month > startMonth && month < endMonth)) {
        return s;
      }
    }
  }

  return signs[0]; // Default to Capricorn
}

// Calculate rising sign based on birth time (simplified)
function calculateRisingSign(birthDate: string, birthTime: string): { sign: string; signAz: string; symbol: string } {
  const signs = [
    { sign: 'Aries', signAz: 'Qoç', symbol: '♈' },
    { sign: 'Taurus', signAz: 'Buğa', symbol: '♉' },
    { sign: 'Gemini', signAz: 'Əkizlər', symbol: '♊' },
    { sign: 'Cancer', signAz: 'Xərçəng', symbol: '♋' },
    { sign: 'Leo', signAz: 'Şir', symbol: '♌' },
    { sign: 'Virgo', signAz: 'Qız', symbol: '♍' },
    { sign: 'Libra', signAz: 'Tərəzi', symbol: '♎' },
    { sign: 'Scorpio', signAz: 'Əqrəb', symbol: '♏' },
    { sign: 'Sagittarius', signAz: 'Oxatan', symbol: '♐' },
    { sign: 'Capricorn', signAz: 'Oğlaq', symbol: '♑' },
    { sign: 'Aquarius', signAz: 'Dolça', symbol: '♒' },
    { sign: 'Pisces', signAz: 'Balıqlar', symbol: '♓' },
  ];

  const [hours, minutes] = birthTime.split(':').map(Number);
  const date = new Date(birthDate);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Simplified rising sign calculation (actual calculation is more complex)
  const risingIndex = Math.floor((hours * 60 + minutes + dayOfYear * 4) / 120) % 12;
  
  return signs[risingIndex];
}

// Calculate moon sign (simplified)
function calculateMoonSign(birthDate: string): { sign: string; signAz: string; symbol: string } {
  const signs = [
    { sign: 'Aries', signAz: 'Qoç', symbol: '♈' },
    { sign: 'Taurus', signAz: 'Buğa', symbol: '♉' },
    { sign: 'Gemini', signAz: 'Əkizlər', symbol: '♊' },
    { sign: 'Cancer', signAz: 'Xərçəng', symbol: '♋' },
    { sign: 'Leo', signAz: 'Şir', symbol: '♌' },
    { sign: 'Virgo', signAz: 'Qız', symbol: '♍' },
    { sign: 'Libra', signAz: 'Tərəzi', symbol: '♎' },
    { sign: 'Scorpio', signAz: 'Əqrəb', symbol: '♏' },
    { sign: 'Sagittarius', signAz: 'Oxatan', symbol: '♐' },
    { sign: 'Capricorn', signAz: 'Oğlaq', symbol: '♑' },
    { sign: 'Aquarius', signAz: 'Dolça', symbol: '♒' },
    { sign: 'Pisces', signAz: 'Balıqlar', symbol: '♓' },
  ];

  const date = new Date(birthDate);
  // Simplified moon phase calculation
  const lunarCycle = 29.53059;
  const refNewMoon = new Date('2000-01-06').getTime();
  const daysSinceRef = (date.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const moonPhase = daysSinceRef % lunarCycle;
  const moonIndex = Math.floor((moonPhase / lunarCycle) * 12);

  return signs[moonIndex];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mom_birth_date, mom_birth_time, dad_birth_date, dad_birth_time, baby_birth_date, baby_birth_time, baby_due_date } = await req.json() as HoroscopeRequest;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Calculate all astrological data
    const momSun = getZodiacSign(mom_birth_date);
    const momMoon = calculateMoonSign(mom_birth_date);
    const momRising = mom_birth_time ? calculateRisingSign(mom_birth_date, mom_birth_time) : null;

    let dadSun = null, dadMoon = null, dadRising = null;
    if (dad_birth_date) {
      dadSun = getZodiacSign(dad_birth_date);
      dadMoon = calculateMoonSign(dad_birth_date);
      dadRising = dad_birth_time ? calculateRisingSign(dad_birth_date, dad_birth_time) : null;
    }

    let babySun = null, babyMoon = null, babyRising = null;
    const babyDate = baby_birth_date || baby_due_date;
    if (babyDate) {
      babySun = getZodiacSign(babyDate);
      babyMoon = calculateMoonSign(babyDate);
      babyRising = baby_birth_time ? calculateRisingSign(babyDate, baby_birth_time) : null;
    }

    // Build AI prompt
    const prompt = `Sən peşəkar astroloqsan. Azərbaycan dilində ailənin doğum xəritəsi analizini hazırla.

## Ailə Məlumatları:

### Ana:
- Günəş bürcü: ${momSun.signAz} (${momSun.symbol})
- Ay bürcü: ${momMoon.signAz} (${momMoon.symbol})
${momRising ? `- Yüksələn bürc: ${momRising.signAz} (${momRising.symbol})` : '- Yüksələn bürc: məlum deyil (doğum saatı yoxdur)'}
- Element: ${momSun.element === 'fire' ? 'Od' : momSun.element === 'water' ? 'Su' : momSun.element === 'air' ? 'Hava' : 'Torpaq'}

${dadSun ? `### Ata:
- Günəş bürcü: ${dadSun.signAz} (${dadSun.symbol})
- Ay bürcü: ${dadMoon?.signAz} (${dadMoon?.symbol})
${dadRising ? `- Yüksələn bürc: ${dadRising.signAz} (${dadRising.symbol})` : '- Yüksələn bürc: məlum deyil'}
- Element: ${dadSun.element === 'fire' ? 'Od' : dadSun.element === 'water' ? 'Su' : dadSun.element === 'air' ? 'Hava' : 'Torpaq'}` : ''}

${babySun ? `### ${baby_birth_date ? 'Körpə' : 'Gözlənilən Körpə'}:
- Günəş bürcü: ${babySun.signAz} (${babySun.symbol})
- Ay bürcü: ${babyMoon?.signAz} (${babyMoon?.symbol})
${babyRising ? `- Yüksələn bürc: ${babyRising.signAz} (${babyRising.symbol})` : '- Yüksələn bürc: məlum deyil'}
- Element: ${babySun.element === 'fire' ? 'Od' : babySun.element === 'water' ? 'Su' : babySun.element === 'air' ? 'Hava' : 'Torpaq'}` : ''}

## Aşağıdakı formatda cavab ver:

### 1. ÜMUMI UYĞUNLUQ BALI (0-100)
Sadəcə rəqəm ver.

### 2. ƏSAS AÇAR SÖZLƏR
3 söz, vergüllə ayrılmış (məsələn: Harmoniya, Sevgi, Çağırış)

### 3. ANA ANALİZİ
Ananın doğum xəritəsi haqqında 3-4 cümlə. Şəxsiyyət xüsusiyyətləri, güclü tərəfləri, analıq potensialı.

### 4. ${dadSun ? 'ATA ANALİZİ' : 'ATA ANALİZİ YOX'}
${dadSun ? 'Atanın doğum xəritəsi haqqında 3-4 cümlə. Şəxsiyyət, atalıq potensialı.' : 'Ata məlumatı daxil edilməyib.'}

### 5. ${babySun ? (baby_birth_date ? 'KÖRPƏ ANALİZİ' : 'GÖZLƏNƏN KÖRPƏ PROQNOZU') : 'KÖRPƏ ANALİZİ YOX'}
${babySun ? 'Körpənin doğum xəritəsi haqqında 3-4 cümlə. Şəxsiyyət potensialı, xüsusiyyətləri.' : 'Körpə məlumatı daxil edilməyib.'}

### 6. AİLƏ DİNAMİKASI
Ailə üzvləri arasındakı enerji axını, güclü və zəif cəhətlər haqqında 4-5 cümlə.

### 7. ANA-KÖRPƏ ƏLAQƏSİ
${babySun ? 'Ana ilə körpə arasındakı kosmik bağ haqqında 3-4 cümlə.' : 'Körpə məlumatı yoxdur.'}

### 8. ${dadSun && babySun ? 'ATA-KÖRPƏ ƏLAQƏSİ' : 'ATA-KÖRPƏ ƏLAQƏSİ YOX'}
${dadSun && babySun ? 'Ata ilə körpə arasındakı kosmik bağ haqqında 3-4 cümlə.' : 'Əlaqəli məlumat yoxdur.'}

### 9. ${dadSun ? 'VALİDEYNLƏR UYĞUNLUĞU' : 'VALİDEYNLƏR UYĞUNLUĞU YOX'}
${dadSun ? 'Ana və ata arasındakı kosmik uyğunluq haqqında 3-4 cümlə.' : 'Ata məlumatı yoxdur.'}

### 10. KOSMIK TÖVSIYƏLƏR
Ailə üçün 3-5 praktik tövsiyə. Hər biri yeni sətirdə, "•" işarəsi ilə başlasın.

### 11. UĞURLU RƏNGLƏR
Ailə üçün 3 uğurlu rəng, vergüllə ayrılmış.

### 12. UĞURLU GÜNLƏR
Həftənin 2 uğurlu günü, vergüllə ayrılmış.

### 13. XOŞBƏXT RƏQƏMLƏR
3 xoşbəxt rəqəm, vergüllə ayrılmış.

Cavabını yalnız Azərbaycan dilində ver. Pozitiv və dəstəkləyici ton saxla.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the AI response
    const parseSection = (text: string, sectionName: string): string => {
      const regex = new RegExp(`###\\s*\\d+\\.\\s*${sectionName}[\\s\\S]*?(?=###|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[0].replace(new RegExp(`###\\s*\\d+\\.\\s*${sectionName}`, 'i'), '').trim();
      }
      return '';
    };

    const overallScoreMatch = aiResponse.match(/ÜMUMI UYĞUNLUQ BALI[^0-9]*(\d+)/i);
    const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 75;

    const result = {
      charts: {
        mom: {
          sun: momSun,
          moon: momMoon,
          rising: momRising,
          birthDate: mom_birth_date,
          birthTime: mom_birth_time,
        },
        dad: dadSun ? {
          sun: dadSun,
          moon: dadMoon,
          rising: dadRising,
          birthDate: dad_birth_date,
          birthTime: dad_birth_time,
        } : null,
        baby: babySun ? {
          sun: babySun,
          moon: babyMoon,
          rising: babyRising,
          birthDate: baby_birth_date || baby_due_date,
          birthTime: baby_birth_time,
          isExpected: !baby_birth_date,
        } : null,
      },
      analysis: {
        overallScore: Math.min(100, Math.max(0, overallScore)),
        keywords: parseSection(aiResponse, 'ƏSAS AÇAR SÖZLƏR').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3),
        momAnalysis: parseSection(aiResponse, 'ANA ANALİZİ'),
        dadAnalysis: parseSection(aiResponse, 'ATA ANALİZİ'),
        babyAnalysis: parseSection(aiResponse, baby_birth_date ? 'KÖRPƏ ANALİZİ' : 'GÖZLƏNƏN KÖRPƏ PROQNOZU'),
        familyDynamics: parseSection(aiResponse, 'AİLƏ DİNAMİKASI'),
        momBabyConnection: parseSection(aiResponse, 'ANA-KÖRPƏ ƏLAQƏSİ'),
        dadBabyConnection: parseSection(aiResponse, 'ATA-KÖRPƏ ƏLAQƏSİ'),
        parentCompatibility: parseSection(aiResponse, 'VALİDEYNLƏR UYĞUNLUĞU'),
        recommendations: parseSection(aiResponse, 'KOSMIK TÖVSIYƏLƏR').split('•').map(s => s.trim()).filter(Boolean),
        luckyColors: parseSection(aiResponse, 'UĞURLU RƏNGLƏR').split(',').map(s => s.trim()).filter(Boolean),
        luckyDays: parseSection(aiResponse, 'UĞURLU GÜNLƏR').split(',').map(s => s.trim()).filter(Boolean),
        luckyNumbers: parseSection(aiResponse, 'XOŞBƏXT RƏQƏMLƏR').split(',').map(s => s.trim()).filter(Boolean),
      },
      rawResponse: aiResponse,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Horoscope analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
