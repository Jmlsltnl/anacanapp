/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  lifeStage?: "flow" | "bump" | "mommy" | "partner";
  pregnancyWeek?: number;
  isPartner?: boolean;
  language?: string;
  stream?: boolean;
  isWeightAnalysis?: boolean;
  cyclePhase?: "menstrual" | "follicular" | "ovulation" | "luteal";
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

import { getSystemPrompt } from "./prompts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    const {
      messages,
      lifeStage,
      pregnancyWeek,
      isPartner,
      stream = false,
      userProfile,
      isWeightAnalysis,
      cyclePhase,
      cycleDay,
    } = (await req.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid messages format");
    }

    const systemPrompt = isWeightAnalysis
      ? `Sən çəki məsləhətçisisən. QAYDALAR: Salamlama yoxdur. "Canım", "əzizim", "balacam" kimi ifadələr İSTİFADƏ ETMƏ. Disclaimer/xəbərdarlıq yoxdur. Birbaşa 1-2 cümlə ilə praktik məsləhət ver. Yalnız Azərbaycan dilində.`
      : getSystemPrompt(lifeStage || "bump", pregnancyWeek, isPartner, userProfile, cyclePhase, cycleDay);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits.", success: false }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Streaming: pass through directly (already OpenAI-compatible SSE)
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const assistantMessage =
      data.choices?.[0]?.message?.content || "Bağışlayın, cavab ala bilmədim. Yenidən cəhd edin.";

    return new Response(
      JSON.stringify({ message: assistantMessage, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in dr-anacan-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
