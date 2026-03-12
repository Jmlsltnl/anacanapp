import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AGE_GUIDELINES: Record<string, { az: string; en: string; ru: string; tr: string }> = {
  '0-2': {
    az: 'Çox sadə cümlələr (3-5 söz). Təkrarlanan ifadələr. Heyvan səsləri. Rənglər və formalar. Nağıl 1-2 dəqiqəlik olsun.',
    en: 'Very simple sentences (3-5 words). Repetitive phrases. Animal sounds. Colors and shapes. Story should be 1-2 minutes.',
    ru: 'Очень простые предложения (3-5 слов). Повторяющиеся фразы. Звуки животных. Цвета и формы. Сказка на 1-2 минуты.',
    tr: 'Çok basit cümleler (3-5 kelime). Tekrarlanan ifadeler. Hayvan sesleri. Renkler ve şekiller. Masal 1-2 dakika olsun.',
  },
  '3-5': {
    az: 'Sadə amma məzmunlu cümlələr. Dialoqlar olsun. Əyləncəli hadisələr. Tərbiyəvi mesaj aydın olsun. 3-4 dəqiqəlik nağıl.',
    en: 'Simple but meaningful sentences. Include dialogues. Fun events. Clear moral message. 3-4 minute story.',
    ru: 'Простые, но содержательные предложения. Диалоги. Весёлые события. Ясный воспитательный посыл. Сказка на 3-4 минуты.',
    tr: 'Basit ama anlamlı cümleler. Diyaloglar olsun. Eğlenceli olaylar. Net eğitici mesaj. 3-4 dakikalık masal.',
  },
  '6-9': {
    az: 'Daha mürəkkəb süjet xətti. Problemin həlli prosesi göstərilsin. Uşağın düşünməsinə kömək edən suallar. 4-6 dəqiqəlik nağıl.',
    en: 'More complex plot. Show problem-solving process. Questions that help the child think. 4-6 minute story.',
    ru: 'Более сложный сюжет. Показать процесс решения проблем. Вопросы для размышления. Сказка на 4-6 минут.',
    tr: 'Daha karmaşık olay örgüsü. Problem çözme süreci gösterilsin. Çocuğun düşünmesine yardımcı sorular. 4-6 dakikalık masal.',
  },
  '10-12': {
    az: 'Zəngin süjet. Əxlaqi dilemma və seçimlər. Emosional dərinlik. Daha uzun dialoqlar. 5-7 dəqiqəlik nağıl.',
    en: 'Rich plot. Moral dilemmas and choices. Emotional depth. Longer dialogues. 5-7 minute story.',
    ru: 'Богатый сюжет. Моральные дилеммы и выбор. Эмоциональная глубина. Длинные диалоги. Сказка на 5-7 минут.',
    tr: 'Zengin olay örgüsü. Ahlaki ikilemler ve seçimler. Duygusal derinlik. Daha uzun diyaloglar. 5-7 dakikalık masal.',
  },
};

const getSystemPrompt = (language: string, childName: string, ageRange?: string) => {
  const ageGuide = ageRange && AGE_GUIDELINES[ageRange] 
    ? AGE_GUIDELINES[ageRange][language as keyof typeof AGE_GUIDELINES['0-2']] || AGE_GUIDELINES[ageRange]['az']
    : '';
  const ageInstruction = ageGuide ? `\n\nYAŞ QRUPUNA UYĞUN YAZMA QAYDALARI:\n${ageGuide}` : '';

  switch (language) {
    case 'en':
      return `You are an award-winning children's book author. Write a professionally crafted, engaging story for children that follows classic fairy tale structure with logical plot development.

CRITICAL QUALITY RULES:
1. The child's name is "${childName}". ALWAYS use this exact name as the main character.
2. The story MUST have a clear beginning, middle, and end with LOGICAL cause-and-effect progression.
3. Every event must have a REASON — no random magical solutions or deus ex machina.
4. Characters must have consistent personalities and motivations.
5. The moral lesson should emerge NATURALLY from the story events, not be stated artificially.
6. Use vivid sensory descriptions (sights, sounds, smells) to make scenes come alive.
7. Include meaningful dialogue that reveals character personality.
8. The conflict/problem must be resolved through the character's own effort, cleverness, or growth.
9. NO clichés like "and they lived happily ever after" — write a specific, satisfying conclusion.
10. NO exaggerated or unrealistic descriptions. Keep the tone warm but grounded.

FORBIDDEN:
- Generic phrases like "little friend", "magical being" without a proper name
- Random magical solutions without setup
- Preachy moral lectures
- Overly sweet, saccharine language
- Plot holes or illogical sequences

Story structure:
1. Title: "${childName}'s [Specific Adventure]"
2. Setting establishment (WHERE and WHEN, with sensory details)
3. Character introduction with personality
4. Problem/challenge introduction (logical, relatable)
5. Rising action with 2-3 attempts/obstacles
6. Climax where the character grows or learns
7. Resolution that follows logically from events
8. Satisfying ending with natural moral takeaway${ageInstruction}

Format: Return title on first line, then story content. Use paragraphs, not bullet points.`;

    case 'ru':
      return `Ты — известный детский писатель-сказочник. Напиши профессиональную, увлекательную сказку с логичным развитием сюжета.

КРИТИЧЕСКИЕ ПРАВИЛА КАЧЕСТВА:
1. Имя ребёнка — "${childName}". ВСЕГДА используй именно это имя для главного героя.
2. Сказка ДОЛЖНА иметь чёткое начало, середину и конец с ЛОГИЧНОЙ причинно-следственной связью.
3. Каждое событие должно иметь ПРИЧИНУ — никаких случайных магических решений.
4. Персонажи должны иметь последовательные характеры и мотивации.
5. Мораль должна вытекать ЕСТЕСТВЕННО из событий, а не навязываться.
6. Используй яркие сенсорные описания (зрение, звуки, запахи).
7. Включай осмысленные диалоги, раскрывающие характер персонажа.
8. Конфликт должен решаться через усилия, находчивость или рост героя.
9. НЕТ клише типа "и жили они долго и счастливо" — напиши конкретный, удовлетворяющий финал.
10. НЕТ преувеличенных описаний. Тон тёплый, но реалистичный.

ЗАПРЕЩЕНО:
- Безымянные "маленькие друзья"
- Случайные магические решения
- Морализаторские лекции
- Слащавый язык
- Дыры в сюжете

Структура:
1. Заголовок: "Приключение ${childName}" или "${childName} и [что-то]"
2. Описание обстановки (ГДЕ и КОГДА)
3. Знакомство с персонажем
4. Проблема/вызов
5. 2-3 попытки/препятствия
6. Кульминация с ростом героя
7. Логичная развязка
8. Удовлетворительный финал${ageInstruction}

Формат: Заголовок первой строкой, затем текст сказки.`;

    case 'tr':
      return `Sen ödüllü bir çocuk kitabı yazarısın. Mantıklı olay örgüsü ve profesyonel anlatımla çocuklar için etkileyici bir masal yaz.

KRİTİK KALİTE KURALLARI:
1. Çocuğun adı "${childName}". Ana karakter olarak HER ZAMAN bu adı kullan.
2. Masalın net bir başlangıcı, ortası ve sonu OLMALI ve MANTIKLI neden-sonuç ilişkisi içermeli.
3. Her olayın bir SEBEBİ olmalı — rastgele sihirli çözümler YOK.
4. Karakterlerin tutarlı kişilikleri ve motivasyonları olmalı.
5. Ahlaki ders olaylardan DOĞAL olarak çıkmalı, yapay olmamalı.
6. Canlı duyusal betimlemeler kullan (görüntüler, sesler, kokular).
7. Karakter kişiliğini ortaya koyan anlamlı diyaloglar ekle.
8. Çatışma, karakterin kendi çabası veya gelişimiyle çözülmeli.
9. "Sonsuza dek mutlu yaşadılar" gibi klişeler YOK — özgün bir sonuç yaz.
10. Abartılı betimlemeler YOK. Sıcak ama gerçekçi ton.

YASAK:
- İsimsiz "küçük dost" gibi ifadeler
- Rastgele sihirli çözümler
- Vaaz tarzı ahlak dersleri
- Aşırı tatlı dil
- Olay örgüsü boşlukları

Yapı:
1. Başlık: "${childName}'in [Macera Adı]"
2. Mekan tanıtımı (NEREDE ve NE ZAMAN)
3. Karakter tanıtımı
4. Problem/meydan okuma
5. 2-3 deneme/engel
6. Doruk noktası
7. Mantıklı çözüm
8. Tatmin edici son${ageInstruction}

Format: İlk satırda başlık, sonra masal metni.`;

    default: // 'az'
      return `Sən mükafat almış uşaq kitabı müəllifiisən. Məntiqi süjet inkişafı və peşəkar anlatım tərzi ilə uşaqlar üçün maraqlı, keyfiyyətli nağıl yaz.

KRİTİK KEYFİYYƏT QAYDALARI:
1. Uşağın adı "${childName}"-dir. Baş qəhrəman olaraq HƏMİŞƏ bu adı istifadə et.
2. Nağılın aydın başlanğıcı, ortası və sonu OLMALIDIR. MƏNTİQLİ səbəb-nəticə əlaqəsi olmalıdır.
3. Hər hadisənin bir SƏBƏBİ olmalıdır — təsadüfi sehrli həllər OLMAMALIDIR.
4. Personajların ardıcıl xarakterləri və motivasiyaları olmalıdır.
5. Tərbiyəvi mesaj hadisələrdən TƏBİİ şəkildə çıxmalıdır — süni öyüd-nəsihət OLMASIN.
6. Canlı, təsvirli dil istifadə et (rənglər, səslər, qoxular).
7. Personaj xarakterini açan mənalı dialoqlar daxil et.
8. Problem qəhrəmanın ÖZ səyi, ağlı və ya böyüməsi ilə həll olunmalıdır.
9. "Onlar xoşbəxt yaşadılar" kimi klişelər YASAQDIR — konkret, qənaətbəxş sonluq yaz.
10. Şişirdilmiş, mübaliğəli təsvirlər YASAQDIR. İsti amma gerçəkçi ton saxla.

YASAQDIR:
- Adsız "kiçik dost", "sehrli varlıq" kimi ifadələr
- Təsadüfi sehrli həllər
- Moizə tərzi əxlaq dərsləri
- Həddən artıq şirin, süni dil
- Süjet boşluqları və ya məntiqsiz ardıcıllıq

VACİB QRAMMATIKA QAYDALARI:
- Düzgün hal şəkilçiləri (yiyəlik, təsirlik, yerlik, çıxışlıq)
- Düzgün feil zamanları və şəxs sonluqları
- Azərbaycanca doğma adlar: Zübeydə, Əlibala, Günəş, Lalə, Tülkü baba, Ayı dayı, Ceyran, Bülbül

Nağılın strukturu:
1. Başlıq: "${childName}ın [Macəra adı]" və ya "${childName} və [nəsə]"
2. Məkan təsviri (HARADA və NƏ VAXT, duyğusal detallarla)
3. Personaj tanıtımı (xarakter xüsusiyyətləri ilə)
4. Problem/çağırış (məntiqi, uşağın anlayacağı)
5. 2-3 cəhd/maneə (artan çətinlik)
6. Kulminasiya — qəhrəmanın böyüməsi və ya öyrənməsi
7. Hadisələrdən məntiqi olaraq irəli gələn həll
8. Qənaətbəxş sonluq və təbii tərbiyəvi nəticə${ageInstruction}

Format: Birinci sətirdə başlıq, sonra nağıl mətni. Abzaslarla yaz, siyahı formatında yox.`;
  }
};

const getUserPrompt = (language: string, childName: string, theme: string, hero: string, moralLesson: string, ageRange?: string, storyStyle?: string) => {
  const ageText = ageRange ? ` (yaş qrupu: ${ageRange})` : '';
  const styleText = storyStyle || '';

  switch (language) {
    case 'en':
      return `Child's name: ${childName}${ageText}
Theme: ${theme || 'Forest adventure'}
Supporting character: ${hero || 'A wise forest animal'}
Moral lesson: ${moralLesson || 'Friendship and kindness'}
${styleText ? `Story style: ${styleText}` : ''}

Write a PROFESSIONAL story about "${childName}" with logical plot, vivid descriptions, and a satisfying ending. The moral must emerge naturally from the story events.`;

    case 'ru':
      return `Имя ребёнка: ${childName}${ageText}
Тема: ${theme || 'Лесное приключение'}
Помощник-персонаж: ${hero || 'Мудрое лесное животное'}
Воспитательный урок: ${moralLesson || 'Дружба и доброта'}
${styleText ? `Стиль: ${styleText}` : ''}

Напиши ПРОФЕССИОНАЛЬНУЮ сказку о "${childName}" с логичным сюжетом, живыми описаниями и удовлетворяющим финалом.`;

    case 'tr':
      return `Çocuğun adı: ${childName}${ageText}
Tema: ${theme || 'Orman macerası'}
Yardımcı karakter: ${hero || 'Bilge bir orman hayvanı'}
Eğitici mesaj: ${moralLesson || 'Dostluk ve iyilik'}
${styleText ? `Tarz: ${styleText}` : ''}

"${childName}" hakkında PROFESYONEL, mantıklı bir masal yaz. Canlı betimlemeler ve tatmin edici bir son olsun.`;

    default: // 'az'
      return `Uşağın adı: ${childName}${ageText}
Mövzu/Tema: ${theme || 'Meşə macərası'}
Köməkçi qəhrəman: ${hero || 'Müdrik bir meşə heyvanı'}
Tərbiyəvi mesaj: ${moralLesson || 'Dostluq və yaxşılıq'}
${styleText ? `Üslub: ${styleText}` : ''}

VACİB:
- "${childName}" haqqında PEŞƏkar, MƏNTİQLİ nağıl yaz
- Canlı təsvirlər, mənalı dialoqlar, qənaətbəxş sonluq olsun
- Tərbiyəvi mesaj süni yox, hadisələrdən TƏBİİ çıxsın
- Azərbaycan dili qrammatikasına diqqətlə əməl et`;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { childName, theme, hero, moralLesson, language = 'az', ageRange, storyStyle } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    const actualChildName = childName || 'Əli';
    
    const systemPrompt = getSystemPrompt(language, actualChildName, ageRange);
    const userPrompt = getUserPrompt(language, actualChildName, theme, hero, moralLesson, ageRange, storyStyle);

    console.log(`Generating fairy tale in language: ${language}, age: ${ageRange || 'not specified'}...`);

    let generatedText = '';

    const callGemini = async (model: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 30,
              topP: 0.9,
              maxOutputTokens: 3000,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          }),
        }
      );
    };

    // Try Gemini 2.5 Pro first, fallback to Flash on rate limit
    let response = await callGemini('gemini-2.5-pro');
    if (response.status === 429) {
      console.log('Gemini Pro rate limited, falling back to Flash...');
      response = await callGemini('gemini-2.5-flash');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Extract title
    const lines = generatedText.split('\n').filter((line: string) => line.trim());
    let rawTitle = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim() || '';
    
    rawTitle = rawTitle
      .replace(/^(əlbəttə|buyurun|budur|bax|mən sizə|конечно|вот|here is|here's|tabii|buyrun|işte)[,!.\s]*/i, '')
      .replace(/^["«"""]?\s*/, '')
      .replace(/\s*["»"""]?\s*$/, '')
      .replace(new RegExp(`^.*üçün bir nağıl:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*üçün nağıl:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*için bir masal:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*story for.*:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*сказка для.*:\\s*`, 'i'), '')
      .trim();
    
    if (rawTitle && !rawTitle.includes(actualChildName)) {
      rawTitle = `${actualChildName} - ${rawTitle}`;
    }
    
    const defaultTitles: Record<string, string> = {
      az: `${actualChildName}ın Nağılı`,
      en: `${actualChildName}'s Story`,
      ru: `Сказка ${actualChildName}`,
      tr: `${actualChildName}'in Masalı`,
    };
    
    const title = rawTitle || defaultTitles[language] || defaultTitles['az'];
    
    const contentStartIndex = lines.findIndex((line: string, i: number) => {
      if (i === 0) return false;
      const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      return cleaned.length > 0;
    });
    const content = (contentStartIndex > 0 ? lines.slice(contentStartIndex) : lines.slice(1)).join('\n').trim() || generatedText;

    const wordCount = content.split(/\s+/).length;
    const durationMinutes = Math.max(2, Math.ceil(wordCount / 100));

    return new Response(
      JSON.stringify({
        success: true,
        title,
        content,
        durationMinutes,
        childName,
        theme,
        hero,
        moralLesson,
        language,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating fairy tale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Nağıl yaradılarkən xəta baş verdi',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
