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
                text: `Sən peşəkar pediatrik audio analizcisən. Bu körpə ağlama səsini diqqətlə analiz et.

TAPŞIRIQ:
1. Ağlamanın NÖVünü müəyyən et (aşağıdakılardan BİRİ):
   - "hungry" (Ac): Ritmik, təkrarlanan, yemək istəyi
   - "tired" (Yuxulu): Monoton, zəif, yorğunluq əlaməti
   - "pain" (Ağrı): Kəskin, yüksək tonlu, davamlı
   - "discomfort" (Narahatlıq): Qıcıqlı, bez/soyuq/isti
   - "colic" (Kolik): Uzun, intensiv, axşam saatlarında
   - "attention" (Diqqət): Aralıqlı, valideyn istəyi
   - "overstimulated" (Həddən artıq stimul): Yorucu mühit
   - "sick" (Xəstəlik): Zəif, hıçqırıqlı, anormal

2. Əminlik faizi (0-100%)
3. Qısa izahat (Azərbaycan dilində, 1-2 cümlə)
4. Tövsiyələr (Azərbaycan dilində, 2-3 maddə)

CAVAB FORMATI (STRICT JSON):
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick",
  "confidence": 85,
  "explanation": "...",
  "recommendations": ["...", "..."],
  "urgency": "low|medium|high"
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
        urgency: 'medium'
      };
    }

    // Save analysis to database
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
