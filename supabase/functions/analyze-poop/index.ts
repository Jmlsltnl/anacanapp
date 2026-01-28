/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PoopAnalysisRequest {
  imageBase64: string;
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

    // Helper function to call Gemini API with a specific model
    async function callGeminiAPI(model: string): Promise<Response> {
      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: `Sən pediatrik sağlamlıq mütəxəssisisən. Bu körpə bezinin şəklini DİQQƏTLƏ analiz et.

ƏN MÜHÜM: Körpənin nəcisinin RƏNGİNİ, KONSENSIYASINI və GÖRÜNÜŞÜNÜ qiymətləndir.

RƏNG ANALİZİ (RƏNGİN TİBBİ ƏHƏMİYYƏTİ):

✅ NORMAL RƏNGLƏR:
- Qəhvəyi (hər çalar): Normal, sağlam həzm
- Sarı/Xardal: Normal, xüsusilə ana südü ilə qidalanan
- Yaşılımtıl-sarı: Normal, formula ilə qidalanan
- Yaşıl: Adətən normal, dəmir qəbulu, yaşıl qidalar

⚠️ DİQQƏT TƏLƏB EDƏN:
- Qara (mekonium istisna): Həzm qanaması ola bilər
- Qırmızı/Qanlı: Həzm problemləri, anal çat
- Ağ/Solğun/Gil rəngi: Qaraciyər/öd problemi - TƏCİLİ
- Çox sulu/köpüklü: İshal, infeksiya

CAVAB FORMATI (STRICT JSON):
{
  "colorDetected": "rəng",
  "consistency": "normal|sulu|bərk|köpüklü",
  "isNormal": true/false,
  "concernLevel": "normal|attention|warning|urgent",
  "explanation": "Azərbaycan dilində izahat (2-3 cümlə)",
  "recommendations": ["tövsiyə 1", "tövsiyə 2"],
  "shouldSeeDoctor": true/false,
  "doctorUrgency": "none|soon|today|immediate"
}

ÇOX MÜHÜM: Əgər ağ, qara və ya qırmızı rəng görürsənsə, "urgent" səviyyəsi ver!`
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
    }

    // Try primary model first, fallback to alternative on rate limit
    const models = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'];
    let response: Response | null = null;
    let lastError = '';

    for (const model of models) {
      console.log(`Trying model: ${model}`);
      response = await callGeminiAPI(model);
      
      if (response.ok) {
        console.log(`Success with model: ${model}`);
        break;
      }
      
      if (response.status === 429) {
        lastError = `Rate limit on ${model}`;
        console.log(`Rate limit hit on ${model}, trying next...`);
        continue;
      }
      
      // For other errors, log and try next
      const errorText = await response.text();
      lastError = `${model}: ${response.status} - ${errorText}`;
      console.error('Gemini API error:', lastError);
    }

    if (!response || !response.ok) {
      console.error('All models failed:', lastError);
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
