import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

interface ZodiacInfo {
  sign: string;
  signAz: string;
  symbol: string;
  element: string;
  startDate: string;
  endDate: string;
  rulingPlanet: string;
  rulingPlanetAz: string;
}

const ZODIAC_SIGNS: ZodiacInfo[] = [
  { sign: 'Capricorn', signAz: 'Oğlaq', symbol: '♑', element: 'earth', startDate: '12-22', endDate: '01-19', rulingPlanet: 'Saturn', rulingPlanetAz: 'Saturn' },
  { sign: 'Aquarius', signAz: 'Dolça', symbol: '♒', element: 'air', startDate: '01-20', endDate: '02-18', rulingPlanet: 'Uranus', rulingPlanetAz: 'Uran' },
  { sign: 'Pisces', signAz: 'Balıqlar', symbol: '♓', element: 'water', startDate: '02-19', endDate: '03-20', rulingPlanet: 'Neptune', rulingPlanetAz: 'Neptun' },
  { sign: 'Aries', signAz: 'Qoç', symbol: '♈', element: 'fire', startDate: '03-21', endDate: '04-19', rulingPlanet: 'Mars', rulingPlanetAz: 'Mars' },
  { sign: 'Taurus', signAz: 'Buğa', symbol: '♉', element: 'earth', startDate: '04-20', endDate: '05-20', rulingPlanet: 'Venus', rulingPlanetAz: 'Venera' },
  { sign: 'Gemini', signAz: 'Əkizlər', symbol: '♊', element: 'air', startDate: '05-21', endDate: '06-20', rulingPlanet: 'Mercury', rulingPlanetAz: 'Merkuri' },
  { sign: 'Cancer', signAz: 'Xərçəng', symbol: '♋', element: 'water', startDate: '06-21', endDate: '07-22', rulingPlanet: 'Moon', rulingPlanetAz: 'Ay' },
  { sign: 'Leo', signAz: 'Şir', symbol: '♌', element: 'fire', startDate: '07-23', endDate: '08-22', rulingPlanet: 'Sun', rulingPlanetAz: 'Günəş' },
  { sign: 'Virgo', signAz: 'Qız', symbol: '♍', element: 'earth', startDate: '08-23', endDate: '09-22', rulingPlanet: 'Mercury', rulingPlanetAz: 'Merkuri' },
  { sign: 'Libra', signAz: 'Tərəzi', symbol: '♎', element: 'air', startDate: '09-23', endDate: '10-22', rulingPlanet: 'Venus', rulingPlanetAz: 'Venera' },
  { sign: 'Scorpio', signAz: 'Əqrəb', symbol: '♏', element: 'water', startDate: '10-23', endDate: '11-21', rulingPlanet: 'Pluto', rulingPlanetAz: 'Pluton' },
  { sign: 'Sagittarius', signAz: 'Oxatan', symbol: '♐', element: 'fire', startDate: '11-22', endDate: '12-21', rulingPlanet: 'Jupiter', rulingPlanetAz: 'Yupiter' },
];

const ELEMENT_NAMES: Record<string, string> = {
  fire: 'Od',
  water: 'Su',
  air: 'Hava',
  earth: 'Torpaq',
};

function getZodiacSign(dateStr: string): ZodiacInfo {
  const date = new Date(dateStr);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const monthDay = `${month}-${day}`;

  for (const sign of ZODIAC_SIGNS) {
    if (sign.startDate > sign.endDate) {
      // Crosses year boundary (Capricorn)
      if (monthDay >= sign.startDate || monthDay <= sign.endDate) {
        return sign;
      }
    } else {
      if (monthDay >= sign.startDate && monthDay <= sign.endDate) {
        return sign;
      }
    }
  }

  return ZODIAC_SIGNS[0]; // Default to Capricorn
}

function calculateRisingSign(birthDate: string, birthTime: string): ZodiacInfo {
  const [hours, minutes] = birthTime.split(':').map(Number);
  const date = new Date(birthDate);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Simplified rising sign calculation based on birth time and day of year
  // Each sign rises for approximately 2 hours
  const totalMinutes = hours * 60 + minutes;
  const sunSignIndex = ZODIAC_SIGNS.findIndex(s => s.sign === getZodiacSign(birthDate).sign);
  const risingOffset = Math.floor(totalMinutes / 120); // 2 hours per sign
  const risingIndex = (sunSignIndex + risingOffset + Math.floor(dayOfYear / 30)) % 12;
  
  return ZODIAC_SIGNS[risingIndex];
}

function calculateMoonSign(birthDate: string): ZodiacInfo {
  const date = new Date(birthDate);
  // Simplified moon sign calculation based on lunar cycle
  const lunarCycle = 29.53059;
  const refNewMoon = new Date('2000-01-06').getTime();
  const daysSinceRef = (date.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const moonPhase = daysSinceRef % lunarCycle;
  const moonIndex = Math.floor((moonPhase / lunarCycle) * 12);

  return ZODIAC_SIGNS[moonIndex];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      mom_birth_date, 
      mom_birth_time, 
      dad_birth_date, 
      dad_birth_time, 
      baby_birth_date, 
      baby_birth_time, 
      baby_due_date 
    } = await req.json() as HoroscopeRequest;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Calculate all astrological data for mom
    const momSun = getZodiacSign(mom_birth_date);
    const momMoon = calculateMoonSign(mom_birth_date);
    const momRising = mom_birth_time ? calculateRisingSign(mom_birth_date, mom_birth_time) : null;

    // Calculate for dad if provided
    let dadSun = null, dadMoon = null, dadRising = null;
    if (dad_birth_date) {
      dadSun = getZodiacSign(dad_birth_date);
      dadMoon = calculateMoonSign(dad_birth_date);
      dadRising = dad_birth_time ? calculateRisingSign(dad_birth_date, dad_birth_time) : null;
    }

    // Calculate for baby if provided
    let babySun = null, babyMoon = null, babyRising = null;
    const babyDate = baby_birth_date || baby_due_date;
    const isBabyExpected = !baby_birth_date && !!baby_due_date;
    if (babyDate) {
      babySun = getZodiacSign(babyDate);
      babyMoon = calculateMoonSign(babyDate);
      babyRising = baby_birth_time ? calculateRisingSign(babyDate, baby_birth_time) : null;
    }

    // Build comprehensive AI prompt
    const prompt = `Sən peşəkar astroloq və doğum xəritəsi mütəxəssisisən. Ailənin tam astroloji analizini Azərbaycan dilində hazırla.

## AİLƏ DOĞUM XƏRİTƏLƏRİ:

### 👩 ANA:
- **Günəş bürcü**: ${momSun.signAz} (${momSun.symbol}) - ${ELEMENT_NAMES[momSun.element]} elementi
- **Ay bürcü**: ${momMoon.signAz} (${momMoon.symbol})
- **Yüksələn bürc**: ${momRising ? `${momRising.signAz} (${momRising.symbol})` : 'Məlum deyil (doğum saatı yoxdur)'}
- **Hakim planet**: ${momSun.rulingPlanetAz}
- **Doğum tarixi**: ${mom_birth_date}
${mom_birth_time ? `- **Doğum saatı**: ${mom_birth_time}` : ''}

${dadSun ? `### 👨 ATA:
- **Günəş bürcü**: ${dadSun.signAz} (${dadSun.symbol}) - ${ELEMENT_NAMES[dadSun.element]} elementi
- **Ay bürcü**: ${dadMoon?.signAz} (${dadMoon?.symbol})
- **Yüksələn bürc**: ${dadRising ? `${dadRising.signAz} (${dadRising.symbol})` : 'Məlum deyil'}
- **Hakim planet**: ${dadSun.rulingPlanetAz}
- **Doğum tarixi**: ${dad_birth_date}
${dad_birth_time ? `- **Doğum saatı**: ${dad_birth_time}` : ''}
` : ''}

${babySun ? `### 👶 ${isBabyExpected ? 'GÖZLƏNƏN KÖRPƏ' : 'KÖRPƏ'}:
- **Günəş bürcü**: ${babySun.signAz} (${babySun.symbol}) - ${ELEMENT_NAMES[babySun.element]} elementi
- **Ay bürcü**: ${babyMoon?.signAz} (${babyMoon?.symbol})
- **Yüksələn bürc**: ${babyRising ? `${babyRising.signAz} (${babyRising.symbol})` : 'Məlum deyil'}
- **Hakim planet**: ${babySun.rulingPlanetAz}
- **${isBabyExpected ? 'Gözlənən doğum' : 'Doğum'} tarixi**: ${babyDate}
${baby_birth_time ? `- **Doğum saatı**: ${baby_birth_time}` : ''}
` : ''}

## CAVAB FORMATI (bu formatı dəqiq izlə):

### ÜMUMI_UYĞUNLUQ_BALI
[0-100 arasında bir rəqəm]

### AÇAR_SÖZLƏR
[3 söz, vergüllə ayrılmış, məsələn: Harmoniya, Sevgi, Güc]

### ANA_ANALİZİ
[Ananın Günəş, Ay və ${momRising ? 'Yüksələn' : ''} bürclərinə əsasən 4-5 cümlə. Şəxsiyyət, güclü cəhətlər, analıq potensialı, emosional dünyası haqqında yazın.]

### ATA_ANALİZİ
${dadSun ? `[Atanın bürclərinə əsasən 4-5 cümlə. Şəxsiyyət, atalıq yanaşması, ailədəki rolu haqqında yazın.]` : '[Ata məlumatı daxil edilməyib.]'}

### KÖRPƏ_ANALİZİ
${babySun ? `[${isBabyExpected ? 'Gözlənən körpənin potensial' : 'Körpənin'} şəxsiyyəti haqqında 4-5 cümlə. Xüsusiyyətləri, temperamenti, inkişaf potensialı.]` : '[Körpə məlumatı daxil edilməyib.]'}

### AİLƏ_DİNAMİKASI
[Ailə üzvlərinin element uyğunluğu və enerji axını haqqında 5-6 cümlə. Güclü və zəif tərəflər, balanslaşdırma yolları.]

### ANA_KÖRPƏ_BAĞLANTISI
${babySun ? `[Ana ilə körpə arasındakı kosmik bağ, emosional rezonans, anlaşma səviyyəsi haqqında 4-5 cümlə.]` : '[Körpə məlumatı yoxdur.]'}

### ATA_KÖRPƏ_BAĞLANTISI
${dadSun && babySun ? `[Ata ilə körpə arasındakı kosmik əlaqə haqqında 4-5 cümlə.]` : '[Əlaqəli məlumat yoxdur.]'}

### VALİDEYNLƏR_UYĞUNLUĞU
${dadSun ? `[Ana və ata arasındakı kosmik uyğunluq, romantik harmoniya, ortaq dəyərlər haqqında 4-5 cümlə.]` : '[Ata məlumatı yoxdur.]'}

### KOSMİK_TÖVSİYƏLƏR
[Ailə üçün 5 praktik tövsiyə, hər biri yeni sətirdə "•" ilə başlasın. Konkret, praktik və tətbiq edilə bilən tövsiyələr olsun.]

### UĞURLU_RƏNGLƏR
[3 rəng, vergüllə ayrılmış, məsələn: Mavi, Yaşıl, Qızılı]

### UĞURLU_GÜNLƏR
[Həftənin 2 günü, vergüllə ayrılmış]

### XOŞBƏXT_RƏQƏMLƏR
[3 rəqəm, vergüllə ayrılmış]

## QEYDLƏR:
- Cavabı YALNIZ Azərbaycan dilində yaz
- Pozitiv, dəstəkləyici və konstruktiv ton saxla
- Hər bölməni aydın və mənalı şəkildə doldur
- Astroloji terminləri izah et ki, hamı anlasın
- Stereotiplərdən uzaq dur, fərdi analiz ver`;

    console.log("Calling Gemini API for horoscope analysis...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 3500,
            topP: 0.95,
            topK: 40,
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
    console.log("AI Response received, parsing...");

    // Parse the structured AI response
    const parseSection = (text: string, sectionName: string): string => {
      const regex = new RegExp(`###\\s*${sectionName}[\\s\\S]*?(?=###|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[0].replace(new RegExp(`###\\s*${sectionName}`, 'i'), '').trim();
      }
      return '';
    };

    const overallScoreMatch = aiResponse.match(/ÜMUMI_UYĞUNLUQ_BALI[\s\S]*?(\d+)/i);
    const overallScore = overallScoreMatch ? Math.min(100, Math.max(0, parseInt(overallScoreMatch[1]))) : 75;

    const result = {
      charts: {
        mom: {
          sun: { sign: momSun.sign, signAz: momSun.signAz, symbol: momSun.symbol, element: momSun.element },
          moon: { sign: momMoon.sign, signAz: momMoon.signAz, symbol: momMoon.symbol },
          rising: momRising ? { sign: momRising.sign, signAz: momRising.signAz, symbol: momRising.symbol } : null,
          birthDate: mom_birth_date,
          birthTime: mom_birth_time,
        },
        dad: dadSun ? {
          sun: { sign: dadSun.sign, signAz: dadSun.signAz, symbol: dadSun.symbol, element: dadSun.element },
          moon: { sign: dadMoon!.sign, signAz: dadMoon!.signAz, symbol: dadMoon!.symbol },
          rising: dadRising ? { sign: dadRising.sign, signAz: dadRising.signAz, symbol: dadRising.symbol } : null,
          birthDate: dad_birth_date,
          birthTime: dad_birth_time,
        } : null,
        baby: babySun ? {
          sun: { sign: babySun.sign, signAz: babySun.signAz, symbol: babySun.symbol, element: babySun.element },
          moon: { sign: babyMoon!.sign, signAz: babyMoon!.signAz, symbol: babyMoon!.symbol },
          rising: babyRising ? { sign: babyRising.sign, signAz: babyRising.signAz, symbol: babyRising.symbol } : null,
          birthDate: babyDate,
          birthTime: baby_birth_time,
          isExpected: isBabyExpected,
        } : null,
      },
      analysis: {
        overallScore,
        keywords: parseSection(aiResponse, 'AÇAR_SÖZLƏR').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3),
        momAnalysis: parseSection(aiResponse, 'ANA_ANALİZİ'),
        dadAnalysis: parseSection(aiResponse, 'ATA_ANALİZİ'),
        babyAnalysis: parseSection(aiResponse, 'KÖRPƏ_ANALİZİ'),
        familyDynamics: parseSection(aiResponse, 'AİLƏ_DİNAMİKASI'),
        momBabyConnection: parseSection(aiResponse, 'ANA_KÖRPƏ_BAĞLANTISI'),
        dadBabyConnection: parseSection(aiResponse, 'ATA_KÖRPƏ_BAĞLANTISI'),
        parentCompatibility: parseSection(aiResponse, 'VALİDEYNLƏR_UYĞUNLUĞU'),
        recommendations: parseSection(aiResponse, 'KOSMİK_TÖVSİYƏLƏR').split('•').map(s => s.trim()).filter(Boolean),
        luckyColors: parseSection(aiResponse, 'UĞURLU_RƏNGLƏR').split(',').map(s => s.trim()).filter(Boolean),
        luckyDays: parseSection(aiResponse, 'UĞURLU_GÜNLƏR').split(',').map(s => s.trim()).filter(Boolean),
        luckyNumbers: parseSection(aiResponse, 'XOŞBƏXT_RƏQƏMLƏR').split(',').map(s => s.trim()).filter(Boolean),
      },
    };

    console.log("Horoscope analysis completed successfully");

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
