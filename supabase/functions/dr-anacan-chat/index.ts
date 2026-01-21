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
}

const getSystemPrompt = (lifeStage: string, pregnancyWeek?: number, isPartner?: boolean) => {
  const basePrompt = `Sən Dr. Anacan - Azərbaycanlı qadınların sağlamlıq və analıq yolçuluğunda onlara kömək edən süni intellekt həkim köməkçisisən. 

Qaydalar:
- YALNIZ Azərbaycan dilində cavab ver
- Həmişə mehriban, empatik və peşəkar ol
- Tibbi məsləhətlər verərkən həmişə həkimlə məsləhətləşməyi tövsiyə et
- Qısa, aydın və faydalı cavablar ver
- Emoji istifadə edərək cavabları daha səmimi et`;

  if (isPartner) {
    return `${basePrompt}

Sən partnyor/ər üçün xüsusi məsləhətlər verirsən. Partnyor hamilə xanımını necə dəstəkləyə biləcəyi, onun üçün nə edə biləcəyi, hansı yardımları göstərə biləcəyi haqqında məsləhətlər ver.

Partnyor üçün tövsiyələr:
- Həyat yoldaşını necə dəstəkləməli
- Ev işlərində necə kömək etməli
- Emosional dəstək necə göstərməli
- Hamiləlik dövründə nələrə diqqət etməli`;
  }

  switch (lifeStage) {
    case 'flow':
      return `${basePrompt}

İstifadəçi hazırda menstruasiya dövrünü izləyir. Aşağıdakı mövzularda kömək et:
- Menstrual sikl haqqında məlumat
- Ağrı idarəetməsi
- Əhval dəyişiklikləri
- Sağlam qidalanma
- Fertil pəncərə hesablanması`;

    case 'bump':
      return `${basePrompt}

İstifadəçi hamilədir${pregnancyWeek ? ` və ${pregnancyWeek}-ci həftədədir` : ''}. Aşağıdakı mövzularda kömək et:
- Həftəlik hamiləlik inkişafı
- Simptomlar və narahatlıqlar
- Qidalanma və vitamin tövsiyələri
- Fiziki fəaliyyət
- Körpənin inkişafı
- Doğuşa hazırlıq`;

    case 'mommy':
      return `${basePrompt}

İstifadəçi yeni ana olub. Aşağıdakı mövzularda kömək et:
- Yenidoğan körpə baxımı
- Əmizdirmə məsləhətləri
- Doğuşdan sonra bərpa
- Körpənin yuxu qaydaları
- Körpənin inkişaf mərhələləri
- Ana sağlamlığı`;

    default:
      return basePrompt;
  }
};

// Convert messages to Gemini format
const convertToGeminiFormat = (messages: ChatMessage[], systemPrompt: string) => {
  const contents: { role: string; parts: { text: string }[] }[] = [];
  
  // Add system prompt as first user message for context
  contents.push({
    role: 'user',
    parts: [{ text: `System instructions: ${systemPrompt}` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'Başa düşdüm. Sizə Azərbaycan dilində kömək etməyə hazıram. 🌸' }]
  });

  // Add conversation messages
  for (const msg of messages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  return contents;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { messages, lifeStage, pregnancyWeek, isPartner, stream = false } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const systemPrompt = getSystemPrompt(lifeStage || 'bump', pregnancyWeek, isPartner);
    const contents = convertToGeminiFormat(messages, systemPrompt);

    const model = 'gemini-2.0-flash';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;

    // Streaming response
    if (stream) {
      const response = await fetch(`${baseUrl}:streamGenerateContent?key=${apiKey}&alt=sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      // Transform Gemini SSE format to OpenAI-compatible format
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr.trim() === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                continue;
              }
              
              try {
                const data = JSON.parse(jsonStr);
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                if (content) {
                  const openAIFormat = {
                    choices: [{
                      delta: { content },
                      index: 0,
                      finish_reason: null,
                    }],
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        },
      });

      const transformedStream = response.body?.pipeThrough(transformStream);

      return new Response(transformedStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await fetch(`${baseUrl}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

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
