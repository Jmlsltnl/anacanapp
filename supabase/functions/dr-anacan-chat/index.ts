/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  lifeStage?: 'flow' | 'bump' | 'mommy' | 'partner';
  pregnancyWeek?: number;
  isPartner?: boolean;
  language?: string;
  stream?: boolean;
  userProfile?: {
    name?: string;
    dueDate?: string;
    babyName?: string;
    babyBirthDate?: string;
    lastPeriodDate?: string;
    cycleLength?: number;
  };
}

const getSystemPrompt = (lifeStage: string, pregnancyWeek?: number, isPartner?: boolean, userProfile?: ChatRequest['userProfile']) => {
  const disclaimer = `

⚠️ MÜHÜM XƏBƏRDARLIQ: Bu məlumatlar YALNIZ ümumi məsləhət xarakterlidir və heç bir halda həkim konsultasiyasını əvəz etmir. Hər hansı sağlamlıq qərarı MÜTLƏQ şəkildə mütəxəssis həkimlə məsləhətləşdikdən sonra verilməlidir.`;

  const userContext = userProfile ? `
İstifadəçi məlumatları:
${userProfile.name ? `- Adı: ${userProfile.name}` : ''}
${userProfile.dueDate ? `- Təxmini doğuş tarixi: ${userProfile.dueDate}` : ''}
${userProfile.babyName ? `- Körpənin adı: ${userProfile.babyName}` : ''}
${userProfile.babyBirthDate ? `- Körpənin doğum tarixi: ${userProfile.babyBirthDate}` : ''}
${userProfile.lastPeriodDate ? `- Son menstruasiya tarixi: ${userProfile.lastPeriodDate}` : ''}
${userProfile.cycleLength ? `- Sikl uzunluğu: ${userProfile.cycleLength} gün` : ''}
` : '';

  const basePrompt = `Sən Anacan.AI - Azərbaycanlı qadınların sağlamlıq və analıq yolçuluğunda onlara kömək edən süni intellekt məsləhətçi və rəfiqəsən. 

SƏN HƏKİM DEYİLSƏN! Sən AI məsləhətçisən, dost kimi kömək edən rəfiqəsən.
${userContext}
Qaydalar:
- YALNIZ Azərbaycan dilində cavab ver
- Həmişə mehriban, empatik və səmimi ol - rəfiqə kimi danış
- Tibbi suallar gəldikdə HƏMİŞƏ həkimlə məsləhətləşməyi tövsiyə et
- Qısa, aydın və faydalı cavablar ver
- Emoji istifadə edərək cavabları daha səmimi et
- HƏR cavabın sonunda (əgər tibbi/sağlamlıq mövzusudursa) xəbərdarlıq əlavə et
- Platformanın çərçivəsindən kənar (siyasət, din və s.) mövzularda cavab vermə
- Yalnız analıq, hamiləlik, körpə baxımı, sağlamlıq və əlaqəli mövzularda kömək et`;

  if (isPartner) {
    return `${basePrompt}

Sən partnyor/ər üçün xüsusi məsləhətlər verirsən. Partnyor hamilə xanımını necə dəstəkləyə biləcəyi, onun üçün nə edə biləcəyi, hansı yardımları göstərə biləcəyi haqqında məsləhətlər ver.

Partnyor üçün tövsiyələr:
- Həyat yoldaşını necə dəstəkləməli
- Ev işlərində necə kömək etməli
- Emosional dəstək necə göstərməli
- Hamiləlik dövründə nələrə diqqət etməli
${disclaimer}`;
  }

  switch (lifeStage) {
    case 'flow':
      return `${basePrompt}

İstifadəçi hazırda menstruasiya dövrünü izləyir. Aşağıdakı mövzularda kömək et:
- Menstrual sikl haqqında məlumat
- Ağrı idarəetməsi
- Əhval dəyişiklikləri
- Sağlam qidalanma
- Fertil pəncərə hesablanması
${disclaimer}`;

    case 'bump':
      return `${basePrompt}

İstifadəçi hamilədir${pregnancyWeek ? ` və ${pregnancyWeek}-ci həftədədir` : ''}. Aşağıdakı mövzularda kömək et:
- Həftəlik hamiləlik inkişafı
- Simptomlar və narahatlıqlar
- Qidalanma və vitamin tövsiyələri
- Fiziki fəaliyyət
- Körpənin inkişafı
- Doğuşa hazırlıq
${disclaimer}`;

    case 'mommy':
      return `${basePrompt}

İstifadəçi yeni ana olub. Aşağıdakı mövzularda kömək et:
- Yenidoğan körpə baxımı
- Əmizdirmə məsləhətləri
- Doğuşdan sonra bərpa
- Körpənin yuxu qaydaları
- Körpənin inkişaf mərhələləri
- Ana sağlamlığı
${disclaimer}`;

    default:
      return `${basePrompt}
${disclaimer}`;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    const { messages, lifeStage, pregnancyWeek, isPartner, stream = false, userProfile } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const systemPrompt = getSystemPrompt(lifeStage || 'bump', pregnancyWeek, isPartner, userProfile);

    // Prepare contents for Gemini API format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiModel = 'gemini-2.0-flash';
    const endpoint = stream 
      ? `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          success: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 403) {
        return new Response(JSON.stringify({ 
          error: "API key invalid or quota exceeded.",
          success: false 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Handle streaming response - convert Gemini SSE to OpenAI-compatible SSE
    if (stream) {
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr.trim() === '') continue;
              
              try {
                const data = JSON.parse(jsonStr);
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                if (content) {
                  // Convert to OpenAI-compatible format
                  const openAIChunk = {
                    choices: [{
                      delta: { content },
                      index: 0,
                    }]
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                }
                
                // Check if this is the final chunk
                if (data.candidates?.[0]?.finishReason) {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      });

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Bağışlayın, cavab ala bilmədim. Yenidən cəhd edin.';

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error in dr-anacan-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
