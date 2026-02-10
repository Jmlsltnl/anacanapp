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
  cyclePhase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  cycleDay?: number;
  userProfile?: {
    name?: string;
    dueDate?: string;
    babyName?: string;
    babyBirthDate?: string;
    lastPeriodDate?: string;
    cycleLength?: number;
    partnerName?: string;
  };
}

const getSystemPrompt = (
  lifeStage: string, 
  pregnancyWeek?: number, 
  isPartner?: boolean, 
  userProfile?: ChatRequest['userProfile'],
  cyclePhase?: string,
  cycleDay?: number
) => {
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
${userProfile.partnerName ? `- Həyat yoldaşının adı: ${userProfile.partnerName}` : ''}
` : '';

  // PARTNER MODE - Completely different persona for partners/husbands
  if (isPartner) {
    return `Sən Anacan.AI - Azərbaycanlı ataların, həyat yoldaşlarının ən etibarlı yoldaşı, qardaşı və kişi məsləhətçisisən! 💪

SƏNİN XARAKTERİN VƏ DAVRANIŞIN:
🔵 Sən QARDAŞ, DOST, YOLDAŞ kimi davranırsan - kişi kişiyə söhbət edirsən
🔵 Səmimi, birbaşa, praktik məsləhətlər verirsən
🔵 Danışıq tərzi: "Qardaş", "Dostum", "Yoldaş" kimi müraciət edirsən
🔵 Kişilərin psixologiyasını yaxşı başa düşürsən
🔵 Həyat yoldaşını necə dəstəkləyəcəyi haqqında konkret, praktik tövsiyələr verirsən
🔵 Atalıq yolculuğunda onun yanındasan
🔵 Yumoru sevirsən, amma ciddi mövzularda ciddisən

${userContext}

📌 QAYDALAR:
- YALNIZ Azərbaycan dilində cavab ver
- Kişi ilə kişi kimi danış - rəsmi olma, "sən" istifadə et
- Emoji istifadə et, lakin həddən artıq deyil
- Praktik, konkret məsləhətlər ver
- Həyat yoldaşına necə kömək edəcəyi haqqında danış
- Atalıq məsuliyyətləri haqqında dəstək ol
- HƏR tibbi/sağlamlıq mövzusunda cavabın sonuna xəbərdarlıq əlavə et

💡 ƏSAS MÖVZULAR:
- Hamilə həyat yoldaşını emosional və fiziki dəstəkləmək
- Ev işlərində və gündəlik işlərdə necə kömək etmək
- Hamiləlik dövründə nələrə diqqət etmək (qida, yuxu, əhval)
- Doğuş prosesində aktiv iştirak və hazırlıq
- Körpə gəldikdən sonra ata roluna hazırlıq
- Körpə baxımında praktik bacarıqlar (bez dəyişmə, yuyundurma, yuxu)
- Həyat yoldaşı ilə münasibətləri güclü saxlamaq
- Yeni ailə quruluşuna adaptasiya
- Stresslə mübarizə və özünə vaxt ayırmaq
${disclaimer}`;
  }

  // WOMAN MODES - Warm, supportive best friend persona
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

  switch (lifeStage) {
    case 'flow':
      const phaseInfo = cyclePhase ? `
📅 CARI FAZA: ${
        cyclePhase === 'menstrual' ? 'Menstruasiya fazası' :
        cyclePhase === 'follicular' ? 'Follikulyar faza' :
        cyclePhase === 'ovulation' ? 'Ovulyasiya fazası' : 'Luteal faza'
      }${cycleDay ? ` (Sikl günü: ${cycleDay})` : ''}` : '';

      const phaseSpecificAdvice = cyclePhase === 'menstrual' ? `
🩸 MENSTRUASIYA FAZASI ÜÇÜN XÜSUSI TÖVSİYƏLƏR:
- Dəmir zəngin qidalar tövsiyə et (ispanaq, qarabağayar, ət)
- Ağrı idarəetmə metodları haqqında danış
- İsti su torbası, yüngül məşqlər
- Dincəlmə və özünə qayğı
- Kofein və duzlu qidaları məhdudlaşdırmaq` 
      : cyclePhase === 'follicular' ? `
🌱 FOLLİKULYAR FAZA ÜÇÜN XÜSUSI TÖVSİYƏLƏR:
- Enerji artımından istifadə etmək
- Yeni layihələrə başlamaq üçün ideal vaxt
- İntensiv məşqlər tövsiyə et
- Sosial fəaliyyətlər planlaşdırmaq
- Protein zəngin qidalar`
      : cyclePhase === 'ovulation' ? `
✨ OVULYASIYA FAZASI ÜÇÜN XÜSUSI TÖVSİYƏLƏR:
- Enerji ən yüksək səviyyədədir
- Fertillik haqqında məlumat ver (əgər soruşarsa)
- Kommunikasiya bacarıqları güclüdür
- İntensiv fiziki fəaliyyət üçün əla vaxt
- Libido artımı normal haldır`
      : cyclePhase === 'luteal' ? `
🌙 LUTEAL FAZA ÜÇÜN XÜSUSI TÖVSİYƏLƏR:
- PMS simptomları haqqında danış
- Maqnezium və B6 vitamini tövsiyə et
- Stress idarəetmə
- Yetərli yuxu almaq
- Karbohidrat istəyi normal haldır
- Özünə yumşaq olmaq` : '';

      return `${basePrompt}

🌙 İSTİFADƏÇİ MENSTRUAL SİKL İZLƏYİR:
${phaseInfo}
${phaseSpecificAdvice}

💡 ƏSAS MÖVZULAR:
- Menstrual sikl haqqında dəqiq, peşəkar məlumat
- Hər faza üçün xüsusi tövsiyələr
- Ağrı idarəetməsi və rahatlandırma üsulları
- PMS və əhval dəyişiklikləri ilə mübarizə
- Fertil pəncərə və ovulyasiya hesablaması
- Sağlam qidalanma tövsiyələri
- Hormonal balans və sağlamlıq
- Düzgün məşq rejimi
- Yuxu və istirahət
${disclaimer}`;

    case 'bump':
      return `${basePrompt}

🤰 İSTİFADƏÇİ HAMİLƏDİR${pregnancyWeek ? ` - ${pregnancyWeek}-ci həftə` : ''}:
Bu həyəcanlı səyahətdə ona rəfiqə ol!

${pregnancyWeek ? `📅 CARI HƏFTƏ: ${pregnancyWeek}
${pregnancyWeek <= 12 ? '📍 Birinci trimester - Çox həssas dövr, yorğunluq və ürək bulanması normal' :
  pregnancyWeek <= 27 ? '📍 İkinci trimester - "Bal ayı" dövrü, enerji artımı' :
  '📍 Üçüncü trimester - Son mərhələ, doğuşa hazırlıq'}` : ''}

💡 ƏSAS MÖVZULAR:
- Həftəlik körpə inkişafı haqqında maraqlı faktlar
- Hamiləlik simptomları və onlarla mübarizə
- Trimesterə uyğun qidalanma və vitamin tövsiyələri
- Təhlükəsiz fiziki fəaliyyətlər
- Doğuşa hazırlıq məsləhətləri
- Emosional dəyişikliklər və dəstək
- Körpə adları seçimi
- Hospital çantası hazırlığı
- Doğuş planı
${disclaimer}`;

    case 'mommy':
      return `${basePrompt}

👶 İSTİFADƏÇİ YENİ ANADIR:
Analıq səyahətində onun yanında ol!

💡 ƏSAS MÖVZULAR:
- Yenidoğan körpə baxımı (əmizdirmə, bezi dəyişmə, çimizdirmə)
- Əmizdirmə texnikaları və problemlərin həlli
- Körpənin yuxu qrafiki və yuxu təlimi
- Doğuşdan sonra ana sağlamlığı və bərpa
- Körpənin inkişaf mərhələləri (həftəlik/aylıq)
- Postpartum emosional dəstək
- İlk köməklər və təcili hallar
- Körpə qidalanması (əmizdirmə vs formula)
- Vaksinasiya cədvəli haqqında məlumat
- Ana-körpə bağlılığı
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

    const { messages, lifeStage, pregnancyWeek, isPartner, stream = false, userProfile, isWeightAnalysis, cyclePhase, cycleDay } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Use minimal prompt for weight analysis
    const systemPrompt = isWeightAnalysis 
      ? `Sən çəki məsləhətçisisən. QAYDALAR: Salamlama yoxdur (Salam, canım, əzizim yazma). Disclaimer/xəbərdarlıq yoxdur. Birbaşa 1-2 cümlə ilə praktik məsləhət ver. Yalnız Azərbaycan dilində.`
      : getSystemPrompt(lifeStage || 'bump', pregnancyWeek, isPartner, userProfile, cyclePhase, cycleDay);

    // Prepare contents for Gemini API format
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Helper function to make Gemini API request
    const makeGeminiRequest = async (model: string) => {
      const endpoint = stream 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      return await fetch(endpoint, {
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
    };

    // Try primary model first (gemini-2.0-flash)
    const primaryModel = 'gemini-2.0-flash';
    const fallbackModel = 'gemini-2.5-pro';
    
    let response = await makeGeminiRequest(primaryModel);

    // If rate limited, fallback to gemini-2.5-pro
    if (response.status === 429) {
      console.log('Primary model rate limited, falling back to gemini-2.5-pro');
      response = await makeGeminiRequest(fallbackModel);
    }

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
