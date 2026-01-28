/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CryAnalysisRequest {
  audioBase64: string;
  audioDuration: number;
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

    const { audioBase64, audioDuration } = await req.json() as CryAnalysisRequest;

    if (!audioBase64) {
      throw new Error('Audio data is required');
    }

    // Validate minimum duration - 3 seconds minimum for reliable analysis
    if (audioDuration < 3) {
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          cryType: 'no_cry_detected',
          confidence: 0,
          explanation: 'Səs çox qısadır. Daha dəqiq analiz üçün minimum 3 saniyə səs lazımdır.',
          recommendations: ['Minimum 3 saniyə səs yazın', 'Körpənin ağlamasını yaxından yazın'],
          urgency: 'low',
          isCryDetected: false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use Gemini 2.0 Flash for audio analysis
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: audioBase64
                }
              },
              {
                text: `Sən pediatrik audio analiz mütəxəssisisən. Bu səs faylını DİQQƏTLƏ dinlə.

🔴 BİRİNCİ VƏ ƏN VACİB ADDIM - BU SƏS NƏDİR?
Səsi dinlə və DÜRÜST cavab ver:

1. Bu səsdə HƏQIQI körpə ağlaması eşidirsən? (Körpə ağlaması = ritmik, davamlı, yüksək tonlu ağlama səsi)
2. Bu səs sadəcə öskürək, asqırma, danışma, gülmə və ya digər səsdir?

🚫 BUNLAR AĞLAMA DEYİL - "no_cry_detected" qaytarmalısan:
- Öskürək səsi (qısa, kəsik səslər)
- Asqırma
- Gülmə
- Danışma/mırıldanma
- Səssizlik
- Ətraf mühit səsləri (maşın, musiqi, TV)
- Heyvan səsləri
- Böyüklərin təqlid etdiyi səslər

✅ BUNLAR HƏQİQİ AĞLAMADIR - yalnız bunları analiz et:
- "hungry": "Neh-neh" ritmik səs, əmizdirmə hərəkəti ilə
- "tired": Monoton, zəif, davamlı ağlama
- "pain": Ani, kəskin, çox yüksək tonlu qışqırıq
- "discomfort": Narahat, qıcıqlanma səsi
- "colic": 3+ saat davam edən şiddətli ağlama
- "attention": Aralıqlı ağlama, valideyn görəndə dayanır
- "overstimulated": Yorğun, həddindən artıq stimulyasiya
- "sick": Zəif, normadan fərqli ağlama

⚠️ QƏRAR QAYDASI:
- Əgər səs öskürək, asqırma və ya ağlama olmayan hər hansı səsdirsə → "no_cry_detected"
- Əgər şübhən varsa → "no_cry_detected" 
- YALNIZ 85%+ əmin olduqda həqiqi ağlama növü göstər
- Öskürək HEÇBIR ZAMAN ağlama deyil!

JSON CAVAB (YALNIZ JSON, BAŞQA HEÇ NƏ):
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick|no_cry_detected",
  "confidence": 0-100,
  "explanation": "Azərbaycan dilində - nə eşitdiyini və niyə bu qərar verdiyini izah et",
  "recommendations": ["tövsiyə 1", "tövsiyə 2"],
  "urgency": "low|medium|high",
  "isCryDetected": true/false
}`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 5,
            topP: 0.5,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      // Fallback to gemini-2.0-flash if preview model fails
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/webm',
                    data: audioBase64
                  }
                },
                {
                  text: `Analyze this audio for baby crying. Return JSON only:
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick|no_cry_detected|false_positive",
  "confidence": 0-100,
  "explanation": "Brief explanation in Azerbaijani",
  "recommendations": ["tip1", "tip2"],
  "urgency": "low|medium|high",
  "isCryDetected": true/false
}

If no real baby crying detected, use "no_cry_detected". If fake/TV sounds, use "false_positive".`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!fallbackResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const fallbackData = await fallbackResponse.json();
      const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let fallbackResult;
      try {
        const jsonMatch = fallbackText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          fallbackResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        fallbackResult = {
          cryType: 'no_cry_detected',
          confidence: 50,
          explanation: 'Səs analiz edildi, lakin dəqiq nəticə əldə edilmədi.',
          recommendations: ['Yenidən cəhd edin', 'Körpənin ağlamasını yaxından yazın'],
          urgency: 'low',
          isCryDetected: false
        };
      }

      // Ensure proper isCryDetected value
      if (fallbackResult.cryType === 'no_cry_detected' || fallbackResult.cryType === 'false_positive') {
        fallbackResult.isCryDetected = false;
      } else {
        fallbackResult.isCryDetected = true;
      }

      // Only save if cry was detected
      if (fallbackResult.isCryDetected) {
        await supabase.from('cry_analyses').insert({
          user_id: user.id,
          audio_duration_seconds: audioDuration,
          analysis_result: fallbackResult,
          cry_type: fallbackResult.cryType,
          confidence_score: fallbackResult.confidence
        });
      }

      return new Response(JSON.stringify({
        success: true,
        analysis: fallbackResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', textContent);
      // Default to no cry detected on parse failure
      analysisResult = {
        cryType: 'no_cry_detected',
        confidence: 50,
        explanation: 'Səs analiz edildi, lakin dəqiq nəticə əldə edilmədi. Yenidən cəhd edin.',
        recommendations: ['Körpənin ağlamasını yaxından yazın', 'Ən az 3 saniyə səs yazın', 'Ətraf səsləri minimuma endirin'],
        urgency: 'low',
        isCryDetected: false
      };
    }

    // Ensure isCryDetected is correctly set based on cryType
    if (analysisResult.cryType === 'no_cry_detected' || analysisResult.cryType === 'false_positive') {
      analysisResult.isCryDetected = false;
    } else {
      analysisResult.isCryDetected = true;
    }

    // Increase threshold to 70% for more accurate detection
    if (analysisResult.confidence < 70 && analysisResult.isCryDetected) {
      analysisResult.cryType = 'no_cry_detected';
      analysisResult.isCryDetected = false;
      analysisResult.explanation = 'Həqiqi körpə ağlaması aşkar edilmədi. Bu səs öskürək, asqırma və ya digər səs ola bilər.';
      analysisResult.recommendations = ['Körpənin ağlamasını yaxından yazın', 'Ətraf səsləri azaldın', 'Minimum 3 saniyə ağlama yazın'];
    }

    // Only save to database if cry was actually detected
    if (analysisResult.isCryDetected) {
      const { error: insertError } = await supabase
        .from('cry_analyses')
        .insert({
          user_id: user.id,
          audio_duration_seconds: audioDuration,
          analysis_result: analysisResult,
          cry_type: analysisResult.cryType,
          confidence_score: analysisResult.confidence
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-cry:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
