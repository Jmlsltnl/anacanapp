/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Use Gemini 2.0 Flash with audio analysis
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
                text: `Sən peşəkar pediatrik audio analizcisən. Bu səs faylını diqqətlə analiz et.

ÇOX VACİB - ÖNCƏ YOXLA:
1. Bu səsdə körpə ağlaması var mı? Əgər yoxdursa, "no_cry_detected" cavabını ver.
2. Bu səs saxta/süni ağlama kimi səslənir? (telefon, TV, imitasiya) - əgər belədirsə "false_positive" ver.
3. Yalnız həqiqi körpə ağlaması aşkar edilərsə növünü müəyyən et.

Ağlama NÖVLƏRİ (yalnız həqiqi ağlama üçün):
- "hungry": Ritmik, təkrarlanan, yemək istəyi
- "tired": Monoton, zəif, yorğunluq
- "pain": Kəskin, yüksək tonlu, davamlı
- "discomfort": Qıcıqlı, bez/soyuq/isti
- "colic": Uzun, intensiv, axşam saatlarında
- "attention": Aralıqlı, valideyn istəyi
- "overstimulated": Yorucu mühit
- "sick": Zəif, hıçqırıqlı, anormal

XÜSUSİ HALLAR:
- "no_cry_detected": Səsdə körpə ağlaması yoxdur
- "false_positive": Saxta/süni ağlama (TV, telefon, imitasiya)

CAVAB FORMATI (STRICT JSON):
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick|no_cry_detected|false_positive",
  "confidence": 85,
  "explanation": "Azərbaycan dilində 1-2 cümlə izahat",
  "recommendations": ["tövsiyə 1", "tövsiyə 2"],
  "urgency": "low|medium|high",
  "isCryDetected": true/false
}`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('AI analysis failed');
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
      // Fallback response
      analysisResult = {
        cryType: 'attention',
        confidence: 60,
        explanation: 'Ağlama analiz edildi, lakin dəqiq səbəb müəyyən edilə bilmədi.',
        recommendations: ['Körpəni yoxlayın', 'Əmizdirməyə cəhd edin', 'Bezini yoxlayın'],
        urgency: 'medium',
        isCryDetected: true
      };
    }

    // Ensure isCryDetected is set correctly
    if (analysisResult.cryType === 'no_cry_detected' || analysisResult.cryType === 'false_positive') {
      analysisResult.isCryDetected = false;
    } else if (analysisResult.isCryDetected === undefined) {
      analysisResult.isCryDetected = true;
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
