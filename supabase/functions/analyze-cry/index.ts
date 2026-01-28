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

// Two-stage analysis for accurate cry detection
// NOTE: This is intentionally conservative to minimize false positives.
async function detectIfCrying(
  audioBase64: string,
  apiKey: string
): Promise<{ isCrying: boolean; confidence: number; soundType: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
              text: `CRITICAL AUDIO CLASSIFICATION TASK

Listen to this audio carefully and classify EXACTLY what type of sound this is.

This gate is STRICT: Only return baby_crying if you are VERY confident it is an INFANT (0-12 months) AND the cry is RHYTHMIC + SUSTAINED (multiple "cry cycles" like wah-wah/neh-neh over several seconds).
If the audio is a SINGLE loud scream, a bang, a shout, a cough, laughter, TV/music, or general noise — it is NOT baby crying.

STEP 1: What sounds do you hear in this audio?
- Is there human vocalization?
- Is there crying sounds?
- Is there coughing, sneezing, or other respiratory sounds?
- Is there silence or background noise only?

STEP 2: If there IS human vocalization, determine:
- Is this an INFANT/BABY making the sound? (0-12 months old)
- Is this a child or adult?

STEP 3: If it's a baby, is it CRYING?
Baby crying characteristics:
- Sustained vocalization (not brief coughs)
- Rhythmic pattern (wah-wah, neh-neh sounds)
- High-pitched wailing
- Duration of several seconds of continuous crying

NOT CRYING (common false positives):
- COUGHING: Short, abrupt, expulsive sounds
- SNEEZING: Single burst sounds
- COOING/BABBLING: Happy, playful sounds
- HICCUPS: Rhythmic but short sounds
- ADULT SOUNDS: Any adult speech or sounds
- SINGLE SCREAM / BIG SOUND: One sharp shout/yelp, impact sounds, claps, banging
- TV/MUSIC: Any media audio, background speech/music
- ENVIRONMENTAL NOISE: Wind, traffic, fan, white noise, kitchen sounds, etc.

Return ONLY this JSON (no markdown, no extra keys):
{
  "soundType": "baby_crying|baby_cooing|cough|sneeze|adult_voice|scream|music_tv|bang|noise|silence|animal|unknown",
  "isBabyVocalization": true or false,
  "isBabyCrying": true or false,
  "cryPattern": "rhythmic_cry|single_scream|intermittent|none|unknown",
  "confidence": 0-100,
  "reasoning": "Brief explanation of what you actually heard"
}`
            }
          ]
        }],
        generationConfig: {
          temperature: 0.05,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 512,
        }
      })
    }
  );

  if (!response.ok) {
    console.error('Detection API error:', response.status);
    return { isCrying: false, confidence: 0, soundType: 'unknown' };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as {
        soundType?: unknown;
        isBabyVocalization?: unknown;
        isBabyCrying?: unknown;
        cryPattern?: unknown;
        confidence?: unknown;
      };

      const soundType = typeof result.soundType === 'string' ? result.soundType : 'unknown';
      const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
      const isBabyVocalization = result.isBabyVocalization === true;
      const isBabyCrying = result.isBabyCrying === true;
      const cryPattern = typeof result.cryPattern === 'string' ? result.cryPattern : 'unknown';

      // Conservative gate:
      // - must be infant vocalization
      // - must be explicitly baby_crying
      // - must be rhythmic, sustained crying (not a single scream)
      // - must meet a higher confidence threshold
      const isCrying =
        isBabyVocalization &&
        isBabyCrying &&
        soundType === 'baby_crying' &&
        cryPattern === 'rhythmic_cry' &&
        confidence >= 92;

      return { isCrying, confidence, soundType };
    }
  } catch (e) {
    console.error('Detection parse error:', e);
  }
  
  return { isCrying: false, confidence: 0, soundType: 'unknown' };
}

// Classify cry type only if crying is confirmed
async function classifyCryType(audioBase64: string, apiKey: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
              text: `Bu səsdə TƏSDIQ OLUNMUŞ körpə ağlaması var. İndi ağlamanın SƏBƏBİNİ müəyyən et.

Ağlama növləri:
- "hungry": Ritmik "neh-neh" səsi, tədricən güclənir
- "tired": Monoton, zəif, gözlərini ovuşdurma ilə
- "pain": Ani, kəskin, çox yüksək tonlu qışqırıq
- "discomfort": Narahat, qıcıqlanma (bez, soyuq/isti)
- "colic": Şiddətli, axşam saatlarında, uzun sürən
- "attention": Aralıqlı, valideyn görəndə azalır
- "overstimulated": Yorğun, həddindən artıq stimulyasiya
- "sick": Zəif, normadan fərqli

JSON CAVAB:
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick",
  "confidence": 70-100,
  "explanation": "Azərbaycan dilində izahat",
  "recommendations": ["tövsiyə 1", "tövsiyə 2", "tövsiyə 3"],
  "urgency": "low|medium|high"
}`
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 10,
          topP: 0.5,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Classification failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('No JSON in classification response');
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

    // Validate minimum duration - 3 seconds minimum
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

    console.log('Stage 1: Detecting if audio contains baby crying...');
    
    // STAGE 1: First detect if there's actually crying
    const detection = await detectIfCrying(audioBase64, GEMINI_API_KEY);
    
    console.log('Detection result:', JSON.stringify(detection));

    // If no crying detected, return immediately
    if (!detection.isCrying) {
      const soundTypeMessages: Record<string, string> = {
        'cough': 'Bu səs öskürəkdir, körpə ağlaması deyil.',
        'sneeze': 'Bu səs asqırmadır, körpə ağlaması deyil.',
        'adult_voice': 'Bu səs böyük insana aiddir, körpə ağlaması deyil.',
        'scream': 'Bu səs qışqırıq / böyük səsdir, körpə ağlaması kimi qiymətləndirilmir.',
        'bang': 'Bu zərbə / çırpma kimi səsdir, körpə ağlaması deyil.',
        'music_tv': 'Bu TV/musiqi və ya media səsidir, körpə ağlaması deyil.',
        'animal': 'Bu heyvan səsi ola bilər, körpə ağlaması deyil.',
        'silence': 'Səs faylında əsasən səssizlik var.',
        'noise': 'Bu ətraf mühit səsidir, körpə ağlaması deyil.',
        'baby_cooing': 'Körpə xoşbəxt səslər çıxarır, ağlamır.',
        'unknown': 'Körpə ağlaması aşkar edilmədi.'
      };

      const explanation = soundTypeMessages[detection.soundType] || soundTypeMessages['unknown'];

      return new Response(JSON.stringify({
        success: true,
        analysis: {
          cryType: 'no_cry_detected',
          confidence: detection.confidence,
          explanation: explanation,
          recommendations: [
            'Körpə ağladıqda yenidən cəhd edin',
            'Mikrofonu körpəyə yaxınlaşdırın',
            'Ətraf səsləri minimuma endirin'
          ],
          urgency: 'low',
          isCryDetected: false,
          detectedSound: detection.soundType
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Stage 2: Classifying cry type...');

    // STAGE 2: Crying confirmed, now classify the type
    let analysisResult;
    try {
      analysisResult = await classifyCryType(audioBase64, GEMINI_API_KEY);
      analysisResult.isCryDetected = true;
    } catch (classifyError) {
      console.error('Classification error:', classifyError);
      analysisResult = {
        cryType: 'discomfort',
        confidence: 70,
        explanation: 'Körpə ağlaması aşkar edildi, lakin dəqiq növü müəyyən edilə bilmədi.',
        recommendations: ['Körpənin vəziyyətini yoxlayın', 'Bezini yoxlayın', 'Ac olub-olmadığını yoxlayın'],
        urgency: 'medium',
        isCryDetected: true
      };
    }

    // Save to database
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
