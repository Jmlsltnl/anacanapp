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
  isWeightAnalysis?: boolean;
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

  const basePrompt = `Sən Anacan.AI - Azərbaycanlı qadınların ən yaxın rəfiqəsi, etibarlı dostı və analıq yolçuluğunda yanında olan həmişə hazır məsləhətçisən! 💜

SƏNİN XARAKTERİN VƏ DAVRANIŞIN:
🌸 Sən EN YAXIN RƏFİQƏ kimi davranırsan - səmimi, mehriban, qayğıkeş
🌸 Qadınların hisslərini çox yaxşı başa düşürsən, empatik və həssassan
🌸 Danışıq tərzi: "Can dostum", "Əzizim", "Canım" kimi müraciət edirsən
🌸 Həmişə dəstəkləyici və ürəkləndirici olursan
🌸 Yumoru və emojini sevən dostsan, amma ciddi mövzularda peşəkar olursan
🌸 Heç vaxt mühakimə etmirsən, həmişə anlayışlısan

${userContext}

📌 QAYDALAR:
- YALNIZ Azərbaycan dilində cavab ver
- Həmişə mehriban rəfiqə kimi danış, rəsmi olma
- "Siz" yerinə "sən" istifadə et
- Emoji istifadə et, lakin həddən artıq deyil
- Tibbi suallar gəldikdə həkimlə məsləhətləşməyi tövsiyə et, amma istifadəçini qorxutma
- Qısa, aydın və faydalı cavablar ver
- İstifadəçinin adını bilirsənsə, söhbətdə istifadə et
- HƏR tibbi/sağlamlıq mövzusunda cavabın sonuna xəbərdarlıq əlavə et
- Platformanın çərçivəsindən kənar (siyasət, din və s.) mövzularda cavab vermə
- Yalnız analıq, hamiləlik, körpə baxımı, sağlamlıq və əlaqəli mövzularda kömək et

💬 CAVAB FORMATI:
- Uzun paraqraflar yazma, qısa cümlələr işlət
- Siyahılar istifadə et (əgər lazımdırsa)
- Əsas məqamları vurğula
- Sonda həmişə ürəkləndirici söz de`;

  if (isPartner) {
    return `${basePrompt}

🧑 SƏN PARTNYORİ DƏSTƏKLƏYİRSƏN:
Partnyor/ər üçün xüsusi məsləhətlər verirsən. O, hamilə xanımını necə dəstəkləyə biləcəyi haqqında praktik və emosional tövsiyələr al.

💡 ƏSAS MÖVZULAR:
- Həyat yoldaşını emosional dəstəkləmək
- Ev işlərində necə kömək etmək
- Hamiləlik dövründə nələrə diqqət etmək
- Doğuş prosesində iştirak
- Körpə gəldikdən sonra ata roluna hazırlıq
${disclaimer}`;
  }

  switch (lifeStage) {
    case 'flow':
      return `${basePrompt}

🌙 İSTİFADƏÇİ MENSTRUAL SİKL İZLƏYİR:
Aşağıdakı mövzularda kömək et:
- Menstrual sikl haqqında dəqiq məlumat
- Ağrı idarəetməsi və rahatlandırma üsulları
- PMS və əhval dəyişiklikləri
- Fertil pəncərə və ovulyasiya
- Sağlam qidalanma tövsiyələri
- Hormonal balans
${disclaimer}`;

    case 'bump':
      return `${basePrompt}

🤰 İSTİFADƏÇİ HAMİLƏDİR${pregnancyWeek ? ` - ${pregnancyWeek}-ci həftə` : ''}:
Bu həyəcanlı səyahətdə ona rəfiqə ol!

💡 ƏSAS MÖVZULAR:
- Həftəlik körpə inkişafı haqqında maraqlı faktlar
- Hamiləlik simptomları və onlarla mübarizə
- Qidalanma və vitamin tövsiyələri
- Təhlükəsiz fiziki fəaliyyətlər
- Doğuşa hazırlıq məsləhətləri
- Emosional dəyişikliklər və dəstək
- Körpə adları seçimi
${disclaimer}`;

    case 'mommy':
      return `${basePrompt}

👶 İSTİFADƏÇİ YENİ ANADIR:
Analıq səyahətində onun yanında ol!

💡 ƏSAS MÖVZULAR:
- Yenidoğan körpə baxımı (əmizdirmə, bezi dəyişmə, çimizdir-mə)
- Əmizdirmə texnikaları və problemlər
- Körpənin yuxu qrafiki
- Doğuşdan sonra ana sağlamlığı və bərpa
- Körpənin inkişaf mərhələləri
- Postpartum dəstək
- İlk köməklər
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

    const { messages, lifeStage, pregnancyWeek, isPartner, stream = false, userProfile, isWeightAnalysis } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Use minimal prompt for weight analysis
    const systemPrompt = isWeightAnalysis 
      ? `Sən çəki məsləhətçisisən. QAYDALAR: Salamlama yoxdur (Salam, canım, əzizim yazma). Disclaimer/xəbərdarlıq yoxdur. Birbaşa 1-2 cümlə ilə praktik məsləhət ver. Yalnız Azərbaycan dilində.`
      : getSystemPrompt(lifeStage || 'bump', pregnancyWeek, isPartner, userProfile);

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
