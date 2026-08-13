/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// food-calories: istifadəçi custom qida əlavə edəndə adına görə təxmini
// kalorini AI ilə təyin edir (1 porsiya). Tapa bilməsə null qaytarır.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callGeminiSmart } from "../_shared/vertex-ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name } = await req.json() as { name: string };
    const food = String(name || '').trim().slice(0, 60);
    if (food.length < 2) throw new Error('name required');

    const prompt = `Qida: "${food}"
Bu qidanın 1 standart porsiyasının təxmini kalorisini müəyyən et (kcal, tam ədəd).
QAYDALAR:
1. YALNIZ JSON qaytar: {"found":true,"calories":250,"portion":"1 boşqab (250q)"}
2. Qida adı deyilsə və ya əmin deyilsənsə: {"found":false}
3. Azərbaycan, türk, rus mətbəxi daxil beynəlxalq qidaları tanı (plov, dolma, borş, mantı və s.)
4. calories 1-2000 aralığında realistik olsun.`;

    let out: { found: boolean; calories?: number; portion?: string } = { found: false };
    for (const model of ['gemini-2.5-flash-lite', 'gemini-2.5-flash']) {
      const resp = await callGeminiSmart(model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      });
      if (!resp.ok) continue;
      const g = await resp.json();
      const text = g?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed.found && Number.isFinite(Number(parsed.calories))) {
            const cal = Math.round(Number(parsed.calories));
            if (cal >= 1 && cal <= 2000) {
              out = { found: true, calories: cal, portion: String(parsed.portion || '').slice(0, 60) };
              break;
            }
          }
          out = { found: false };
          break;
        } catch { /* növbəti model */ }
      }
    }

    return new Response(JSON.stringify({ success: true, ...out }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('food-calories error:', error);
    return new Response(JSON.stringify({ success: false, found: false }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
