/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callGeminiSmart } from "../_shared/vertex-ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CryAnalysisRequest {
  audioBase64: string;
  audioDuration: number;
  language?: string;
  userContext?: {
    babyName?: string;
    babyAgeMonths?: number;
    babyAgeDays?: number;
    babyGender?: string;
  };
}

// Two-stage analysis for accurate cry detection
// NOTE: This is intentionally conservative to minimize false positives.
async function detectIfCrying(
  audioBase64: string,
  _apiKey?: string
): Promise<{ isCrying: boolean; confidence: number; soundType: string }> {
  // Using the more capable gemini-2.5-flash model instead of lite for better audio precision and less hallucination
  const response = await callGeminiSmart("gemini-2.5-flash", {
    contents: [{
      role: 'user',
      parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: audioBase64
              }
            },
            {
              text: `CRITICAL AUDIO CLASSIFICATION TASK

You are an expert pediatric audio analyst AI. You must be extremely strict, objective, and skeptical.
Your task is to classify this audio recording.

IMPORTANT RULE 1: If the audio is mostly SILENT, or just background hiss/static, or general room noise, you MUST return "silence" or "noise".
IMPORTANT RULE 2: If there is no clear human baby (0-12 months) crying, you must NOT classify it as crying.
IMPORTANT RULE 3: Do NOT hallucinate sounds. If you don't hear a baby crying clearly, it is NOT crying.
IMPORTANT RULE 4: Explicitly ignore false positives such as: White noise machines, toys playing music, adult singing (lullabies), pets, and street noise.

STEP 1: Identify the main sound.
- Is it completely silent or just static? -> "silence"
- Is it general background noise (traffic, wind, rustling, fan, white noise machine)? -> "noise"
- Is there an adult speaking, singing, or breathing? -> "adult_voice"
- Is there a baby making happy/neutral sounds? -> "baby_cooing"
- Is there a baby CRYING (sustained, rhythmic wailing)? -> "baby_crying"
- Is it a musical toy or TV? -> "music_tv"

STEP 2: For baby crying, verify it is rhythmic and sustained. A single short shout, cough, or sneeze is NOT crying.

Return ONLY this JSON (no markdown, no extra keys):
{
  "soundType": "baby_crying|baby_cooing|cough|sneeze|adult_voice|scream|music_tv|bang|noise|silence|animal|unknown",
  "isBabyVocalization": true or false,
  "isBabyCrying": true or false,
  "cryPattern": "rhythmic_cry|single_scream|intermittent|none|unknown",
  "confidence": 0-100,
  "reasoning": "What you actually heard in detail. Explain why it is or isn't a baby crying."
}`
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.1,
          maxOutputTokens: 512,
        }
      });

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
        (cryPattern === 'rhythmic_cry' || cryPattern === 'intermittent') &&
        confidence >= 85;

      return { isCrying, confidence, soundType };
    }
  } catch (e) {
    console.error('Detection parse error:', e);
  }
  
  return { isCrying: false, confidence: 0, soundType: 'unknown' };
}

// Classify cry type only if crying is confirmed
async function classifyCryType(audioBase64: string, _apiKey?: string, userContext?: CryAnalysisRequest['userContext'], language: string = 'az'): Promise<any> {
  // Build age context for prompt
  let ageContext = '';
  if (userContext?.babyAgeMonths !== undefined) {
    const months = userContext.babyAgeMonths;
    if (months < 1) {
      ageContext = `Bu ${userContext.babyAgeDays} günlük YENİDOĞULMUŞ körpədir.`;
    } else if (months < 3) {
      ageContext = `Bu ${months} aylıq yenidoğulmuş körpədir (0-3 ay dövrü).`;
    } else if (months < 6) {
      ageContext = `Bu ${months} aylıq kiçik körpədir (3-6 ay dövrü).`;
    } else if (months < 12) {
      ageContext = `Bu ${months} aylıq körpədir (6-12 ay dövrü).`;
    } else {
      ageContext = `Bu ${months} aylıq (${Math.floor(months/12)} yaş) uşaqdır.`;
    }
    if (userContext.babyName) {
      ageContext = `Körpənin adı ${userContext.babyName}. ` + ageContext;
    }
  }

  const response = await callGeminiSmart("gemini-2.5-flash", {
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64
          }
        },
        {
          text: `Sən peşəkar pediatr və çox dəqiq AI-sən. Birinci mərhələ bu səsdə körpə ağlaması olduğunu təxmin edib, lakin sən YENİDƏN və ÇOX DİQQƏTLƏ yoxlamalısan.

Əgər səs sadəcə səssizlik, ağ küy (white noise), oyuncaq musiqisi, böyük adam səsi (hətta laylay çalsa belə) və ya heyvan səsidirsə, DƏRHAL "no_cry_detected" və ya "false_positive" qaytar. Xəyalpərəstlik etmə, olmayan səsi uydurma.

${ageContext ? `KÖRPƏ KONTEKST: ${ageContext}` : ''}

${userContext?.babyAgeMonths !== undefined && userContext.babyAgeMonths < 4 ? `
XÜSUSI QEYD: Bu 4 aydan kiçik körpədir. "Dunstan Baby Language" metodundan istifadə edərək səsləri analiz et:
- "Neh" səsi (dil damağa dəyir) -> "hungry" (Acıqma)
- "Owh" səsi (əsnəməyə bənzər) -> "tired" (Yorğunluq, yuxu)
- "Heh" səsi (qısa, qırıq-qırıq) -> "discomfort" (Narahatlıq - bez, isti/soyuq)
- "Eairh" səsi (sıxılmış, gərgin) -> "colic" (Qaz sancısı, alt qaz)
- "Eh" səsi (döş qəfəsindən qısa) -> "discomfort" (Gəyirmə ehtiyacı)
` : `
XÜSUSI QEYD: Bu 4 aydan böyük körpədir. Ağlamanın emosional və fiziki səbəblərinə diqqət yetir (diş çıxarma, ayrılıq qorxusu, həddən artıq stimulyasiya, aclıq).
`}

Ağlama növləri (ƏGƏR HƏQİQƏTƏN AĞLAYIRSA):
- "hungry": Ritmik ağlama, ağız hərəkətləri ilə
- "tired": Monoton, zəif, əsnəməyə bənzər
- "pain": Ani, kəskin, çox yüksək tonlu qışqırıq
- "discomfort": Narahat, qıcıqlanma (bez, gəyirmə)
- "colic": Şiddətli, sıxılmış, qaz sancısına bənzər
- "attention": Aralıqlı, sızlanma
- "overstimulated": Yorğun, həddən artıq stimulyasiya
- "sick": Zəif, iniltili

Əgər ağlama deyilsə:
- "no_cry_detected": Səssizlik və ya sadəcə səs-küy
- "false_positive": Böyük adam, TV, heyvan, ağ küy (white noise)

JSON CAVAB:
{
  "cryType": "hungry|tired|pain|discomfort|colic|attention|overstimulated|sick|no_cry_detected|false_positive",
  "confidence": 70-100,
  "explanation": "Nə eşitdiyin barədə və analiz haqqında valideynə çox professional, empatiyalı və sakitləşdirici tərzdə Azərbaycan dilində izahat${userContext?.babyName ? ` (${userContext.babyName} adını istifadə et)` : ''}. Əgər səbəb qazdırsa 'Eairh' səsini eşitdiyini vurğula.",
  "recommendations": ["Ayaqları qarına doğru hərəkət etdirərək qazı çıxarmağa kömək et (Bicycle legs)", "Dəri-dəriyə təmas qur (Skin-to-skin)", "Tövsiyə 3"],
  "urgency": "low|medium|high"
}${language === 'en' ? '\n\nIMPORTANT: Write the "explanation" and all "recommendations" entries in ENGLISH in a highly professional, empathetic, pediatric tone. Keep JSON keys and enum values exactly as shown.' : ''}`
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 10,
      topP: 0.5,
      maxOutputTokens: 1024,
    }
  });

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
    // AI handled by callGeminiSmart

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

    const { audioBase64, audioDuration, userContext, language = 'az' } = await req.json() as CryAnalysisRequest;

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
          explanation: language === 'en'
            ? 'The recording is too short. At least 3 seconds of audio is needed for an accurate analysis.'
            : 'Səs çox qısadır. Daha dəqiq analiz üçün minimum 3 saniyə səs lazımdır.',
          recommendations: language === 'en'
            ? ['Record at least 3 seconds of audio', 'Hold the microphone close to the baby']
            : ['Minimum 3 saniyə səs yazın', 'Körpənin ağlamasını yaxından yazın'],
          urgency: 'low',
          isCryDetected: false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Stage 1: Detecting if audio contains baby crying...');
    
    // STAGE 1: First detect if there's actually crying
    const detection = await detectIfCrying(audioBase64);
    
    console.log('Detection result:', JSON.stringify(detection));

    // If no crying detected, return immediately
    if (!detection.isCrying) {
      const soundTypeMessagesAz: Record<string, string> = {
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
      const soundTypeMessagesEn: Record<string, string> = {
        'cough': 'This is a cough, not a baby cry.',
        'sneeze': 'This is a sneeze, not a baby cry.',
        'adult_voice': 'This sounds like an adult voice, not a baby cry.',
        'scream': 'This is a scream or loud sound, not classified as baby crying.',
        'bang': 'This is a bang or impact sound, not a baby cry.',
        'music_tv': 'This is TV/music or media audio, not a baby cry.',
        'animal': 'This may be an animal sound, not a baby cry.',
        'silence': 'The audio is mostly silent.',
        'noise': 'This is environmental noise, not a baby cry.',
        'baby_cooing': 'The baby is making happy sounds, not crying.',
        'unknown': 'No baby crying was detected.'
      };
      const messages = language === 'en' ? soundTypeMessagesEn : soundTypeMessagesAz;
      const explanation = messages[detection.soundType] || messages['unknown'];

      return new Response(JSON.stringify({
        success: true,
        analysis: {
          cryType: 'no_cry_detected',
          confidence: detection.confidence,
          explanation: explanation,
          recommendations: language === 'en'
            ? ['Try again when the baby is crying', 'Move the microphone closer to the baby', 'Minimize background noise']
            : ['Körpə ağladıqda yenidən cəhd edin', 'Mikrofonu körpəyə yaxınlaşdırın', 'Ətraf səsləri minimuma endirin'],
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
      analysisResult = await classifyCryType(audioBase64, undefined, userContext, language);
      analysisResult.isCryDetected = true;
    } catch (classifyError) {
      console.error('Classification error:', classifyError);
      analysisResult = {
        cryType: 'discomfort',
        confidence: 70,
        explanation: language === 'en'
          ? 'Baby crying was detected, but the exact type could not be determined.'
          : 'Körpə ağlaması aşkar edildi, lakin dəqiq növü müəyyən edilə bilmədi.',
        recommendations: language === 'en'
          ? ["Check the baby's overall condition", 'Check the diaper', 'Check if the baby is hungry']
          : ['Körpənin vəziyyətini yoxlayın', 'Bezini yoxlayın', 'Ac olub-olmadığını yoxlayın'],
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
