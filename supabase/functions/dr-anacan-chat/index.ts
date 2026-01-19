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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { messages, lifeStage, pregnancyWeek, isPartner, language } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const systemPrompt = getSystemPrompt(lifeStage || 'bump', pregnancyWeek, isPartner);

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI Gateway error:', errorData);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Bağışlayın, cavab ala bilmədim. Yenidən cəhd edin.';

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
