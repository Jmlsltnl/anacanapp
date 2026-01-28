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

    // Use Gemini 3 Flash Preview for more accurate audio analysis
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
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
                text: `Sən pediatrik audio analiz mütəxəssisisən. Bu səs faylını DİQQƏTLƏ dinlə və analiz et.

🔴 ÇOX VACİB - BİRİNCİ ADDIM:
Bu səsdə HƏQIQI KÖRPƏ AĞLAMASI varmı? Aşağıdakı sualları cavabla:

1. Səsdə insan səsi var mı? (bəli/xeyr)
2. Bu səs körpəyə aiddir? (bəli/xeyr - böyük uşaq və ya böyük deyil)
3. Bu həqiqi ağlamadır? (bəli/xeyr)
4. Bu saxta/süni səsdir? (TV, telefon, video, imitasiya)

🚫 AĞLAMA OLMAYAN SİTUASİYALAR:
- Səssizlik, ətraf mühit səsləri → "no_cry_detected"
- TV/telefon/video səsləri → "false_positive"
- Böyüklərin imitasiyası → "false_positive"  
- Heyvan səsləri → "no_cry_detected"
- Musiqi, radio → "no_cry_detected"
- Güclü küy, maşın səsi → "no_cry_detected"

✅ HƏQİQİ AĞLAMA NÖVLƏRİ (yalnız həqiqi körpə ağlaması üçün):
- "hungry": Ritmik "neh-neh" səsi, əmizdirmə hərəkəti
- "tired": Monoton, zəif, gözlərini ovuşdurma
- "pain": Ani, kəskin, yüksək tezlikli, davamlı
- "discomfort": Qıcıqlanma, bez yaş, soyuq/isti
- "colic": 3+ saat davam edən, axşam saatları
- "attention": Aralıqlı, valideyn görəndə dayanır
- "overstimulated": Mühitdən qaçma, başını döndərmə
- "sick": Zəif, normadan fərqli, hıçqırıqlı

⚠️ QƏRAR VER:
- Əgər HƏQİQİ körpə ağlaması YOXdursa → "no_cry_detected" və ya "false_positive" seç
- Əgər HƏQİQİ körpə ağlaması VAR → yuxarıdakı növlərdən birini seç
- ŞÜBHƏLİ hallarda "no_cry_detected" seç, yalnış-pozitiv vermə!

CAVAB FORMATI (STRICT JSON, BAŞQA HEÇ NƏ YAZMA):
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick|no_cry_detected|false_positive",
  "confidence": 0-100,
  "explanation": "Azərbaycan dilində 1-2 cümlə. Nə eşitdiyini və niyə bu qərarı verdiyini izah et.",
  "recommendations": ["konkret tövsiyə 1", "konkret tövsiyə 2", "konkret tövsiyə 3"],
  "urgency": "low|medium|high",
  "isCryDetected": true/false
}

QEYD: Şübhə halında həmişə "no_cry_detected" seç. Yalnız 70%+ əmin olduqda həqiqi ağlama növü göstər.`
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

    // Low confidence results should be treated as no detection
    if (analysisResult.confidence < 50 && analysisResult.isCryDetected) {
      analysisResult.cryType = 'no_cry_detected';
      analysisResult.isCryDetected = false;
      analysisResult.explanation = 'Ağlama aşkarlandı, lakin aydın deyil. Daha yaxından və aydın səs yazın.';
      analysisResult.recommendations = ['Körpəyə daha yaxın olun', 'Ətraf səsləri azaldın', 'Yenidən cəhd edin'];
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
