/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PoopAnalysisRequest {
  imageBase64: string;
}

interface ImageValidation {
  isValidDiaperImage: boolean;
  imageType: string;
  confidence: number;
  message: string;
}

// Stage 1: Validate if image contains a diaper/poop
async function validateImage(imageBase64: string, apiKey: string): Promise<ImageValidation> {
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64
                  }
                },
                {
                  text: `Bu şəklin NƏ OLDUĞUNU müəyyən et. YALNIZ aşağıdakı kateqoriyalardan birini seç:

ŞƏKİL TİPLƏRİ:
1. "diaper_with_poop" - Körpə bezi İÇİNDƏ nəcis görünür
2. "diaper_empty" - Boş körpə bezi (nəcis yoxdur)
3. "poop_no_diaper" - Nəcis var amma bez yoxdur (tualet, pot və s.)
4. "baby_photo" - Körpə şəkli (bez/nəcis yoxdur)
5. "adult_content" - Yetkin insan şəkli
6. "food" - Yemək şəkli
7. "animal" - Heyvan şəkli
8. "screenshot" - Ekran görüntüsü, mətni olan şəkil
9. "landscape" - Mənzərə, bina, küçə
10. "object" - Əşya, məhsul
11. "other" - Digər

YALNIZ "diaper_with_poop" və ya "poop_no_diaper" olduqda analiz edilə bilər.

CAVAB FORMATI (STRICT JSON, heç bir əlavə mətn yoxdur):
{
  "imageType": "kateqoriya_adı",
  "isValidForAnalysis": true/false,
  "confidence": 0-100,
  "description": "Şəkildə nə görünür (1 cümlə)"
}`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 5,
              topP: 0.8,
              maxOutputTokens: 256,
            }
          })
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit on ${model} for validation, trying next...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Validation error on ${model}:`, errText);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const imageType = result.imageType || 'unknown';
        const isValid = result.isValidForAnalysis === true || 
                       imageType === 'diaper_with_poop' || 
                       imageType === 'poop_no_diaper';
        
        // Generate appropriate message based on image type
        const messages: Record<string, string> = {
          'diaper_empty': 'Bu bez boşdur, nəcis görünmür. Nəcis olan bez şəkli çəkin.',
          'baby_photo': 'Bu körpə şəklidir. Zəhmət olmasa körpə bezinin şəklini çəkin.',
          'adult_content': 'Bu şəkil körpə bezi deyil. Zəhmət olmasa düzgün şəkil seçin.',
          'food': 'Bu yemək şəklidir. Zəhmət olmasa körpə bezinin şəklini çəkin.',
          'animal': 'Bu heyvan şəklidir. Zəhmət olmasa körpə bezinin şəklini çəkin.',
          'screenshot': 'Bu ekran görüntüsüdür. Zəhmət olmasa körpə bezinin real şəklini çəkin.',
          'landscape': 'Bu mənzərə şəklidir. Zəhmət olmasa körpə bezinin şəklini çəkin.',
          'object': 'Bu əşya şəklidir. Zəhmət olmasa körpə bezinin şəklini çəkin.',
          'other': 'Bu şəkil analiz üçün uyğun deyil. Körpə bezinin içindəki nəcisin şəklini çəkin.',
          'unknown': 'Şəkil tanınmadı. Zəhmət olmasa daha aydın şəkil çəkin.'
        };

        return {
          isValidDiaperImage: isValid,
          imageType: imageType,
          confidence: result.confidence || 0,
          message: isValid ? 'Şəkil uyğundur' : (messages[imageType] || messages['other'])
        };
      }
    } catch (e) {
      console.error(`Validation parse error on ${model}:`, e);
      continue;
    }
  }

  return {
    isValidDiaperImage: false,
    imageType: 'unknown',
    confidence: 0,
    message: 'Şəkil yoxlanıla bilmədi. Yenidən cəhd edin.'
  };
}

// Stage 2: Analyze the poop
async function analyzePoop(imageBase64: string, apiKey: string): Promise<Response | null> {
  const models = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'];
  
  for (const model of models) {
    console.log(`Trying analysis with model: ${model}`);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                text: `Sən pediatrik sağlamlıq mütəxəssisisən. Bu körpə bezindəki NƏCİSİ DİQQƏTLƏ analiz et.

ƏN MÜHÜM: Nəcisin RƏNGİNİ, KONSİSTENSİYASINI və GÖRÜNÜŞÜNÜ qiymətləndir.

RƏNG ANALİZİ (TİBBİ ƏHƏMİYYƏT):

✅ NORMAL RƏNGLƏR:
- Qəhvəyi (hər çalar): Normal, sağlam həzm
- Sarı/Xardal: Normal, xüsusilə ana südü ilə qidalanan körpələrdə
- Yaşılımtıl-sarı: Normal, formula ilə qidalanan körpələrdə
- Yaşıl: Adətən normal, dəmir qəbulu və ya yaşıl qidalardan

⚠️ DİQQƏT TƏLƏB EDƏN:
- Qara (mekonium istisna): Həzm qanaması ola bilər - TƏCİLİ
- Qırmızı/Qanlı: Həzm problemləri, anal çat - TƏCİLİ
- Ağ/Solğun/Gil rəngi: Qaraciyər/öd problemi - ÇOX TƏCİLİ
- Çox sulu/köpüklü: İshal, infeksiya riski

KONSİSTENSİYA:
- Normal: Yumşaq, pasta kimi
- Sulu: İshal əlaməti ola bilər
- Bərk: Qəbizlik əlaməti
- Köpüklü: Həzm problemi

CAVAB FORMATI (STRICT JSON):
{
  "colorDetected": "brown|yellow|green|black|red|white|unknown",
  "colorNameAz": "Azərbaycanca rəng adı",
  "consistency": "normal|sulu|bərk|köpüklü",
  "isNormal": true/false,
  "concernLevel": "normal|attention|warning|urgent",
  "explanation": "Azərbaycan dilində ətraflı izahat (2-3 cümlə)",
  "recommendations": ["tövsiyə 1", "tövsiyə 2", "tövsiyə 3"],
  "shouldSeeDoctor": true/false,
  "doctorUrgency": "none|soon|today|immediate"
}

XƏBƏRDARLIQ: Ağ, qara və ya qırmızı rəng gördükdə "urgent" səviyyəsi VER!`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 10,
            topP: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (response.ok) {
      console.log(`Analysis success with model: ${model}`);
      return response;
    }

    if (response.status === 429) {
      console.log(`Rate limit on ${model}, trying next...`);
      continue;
    }

    const errText = await response.text();
    console.error(`Analysis error on ${model}:`, errText);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

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

    const { imageBase64 } = await req.json() as PoopAnalysisRequest;

    if (!imageBase64) {
      throw new Error('Image data is required');
    }

    // Stage 1: Validate image
    console.log('Stage 1: Validating image...');
    const validation = await validateImage(imageBase64, GEMINI_API_KEY);
    console.log('Validation result:', validation);

    if (!validation.isValidDiaperImage) {
      // Return validation failure - not a valid diaper/poop image
      return new Response(JSON.stringify({
        success: true,
        isValidImage: false,
        validation: {
          imageType: validation.imageType,
          confidence: validation.confidence,
          message: validation.message
        },
        analysis: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Stage 2: Analyze poop
    console.log('Stage 2: Analyzing poop...');
    const response = await analyzePoop(imageBase64, GEMINI_API_KEY);

    if (!response) {
      throw new Error('AI analysis failed - all models exhausted');
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      analysisResult = {
        colorDetected: 'unknown',
        colorNameAz: 'Naməlum',
        consistency: 'normal',
        isNormal: true,
        concernLevel: 'normal',
        explanation: 'Şəkil analiz edildi. Daha aydın şəkil çəkməyə cəhd edin.',
        recommendations: ['Körpənin ümumi vəziyyətini izləyin', 'Hər hansı narahatlıq olsa həkimə müraciət edin'],
        shouldSeeDoctor: false,
        doctorUrgency: 'none'
      };
    }

    // Save analysis to database
    const { error: insertError } = await supabase
      .from('poop_analyses')
      .insert({
        user_id: user.id,
        analysis_result: analysisResult,
        color_detected: analysisResult.colorDetected,
        is_normal: analysisResult.isNormal,
        concern_level: analysisResult.concernLevel
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      isValidImage: true,
      validation: {
        imageType: validation.imageType,
        confidence: validation.confidence,
        message: 'Şəkil uğurla analiz edildi'
      },
      analysis: analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-poop:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
