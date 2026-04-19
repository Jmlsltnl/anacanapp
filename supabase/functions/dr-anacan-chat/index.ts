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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
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

    // Require explicit lifeStage so flow/mommy users don't get a "bump" persona by mistake.
    // Fall back to "bump" only when truly unknown, and log a warning so we can spot misuse.
    let resolvedLifeStage = lifeStage;
    if (!resolvedLifeStage) {
      console.warn("dr-anacan-chat: lifeStage missing from request — defaulting to 'bump'. Caller should always send lifeStage.");
      resolvedLifeStage = "bump";
    }

    const systemPrompt = isWeightAnalysis
      ? `Sən çəki məsləhətçisisən. QAYDALAR: Salamlama yoxdur. "Canım", "əzizim", "balacam" kimi ifadələr İSTİFADƏ ETMƏ. Disclaimer/xəbərdarlıq yoxdur. Birbaşa 1-2 cümlə ilə praktik məsləhət ver. Yalnız Azərbaycan dilində.`
      : getSystemPrompt(resolvedLifeStage, pregnancyWeek, isPartner, userProfile, cyclePhase, cycleDay);

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = messages.map((msg: ChatMessage) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiBody = {
      contents: geminiContents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    const endpoint = stream ? "streamGenerateContent" : "generateContent";
    
    let response: Response | null = null;
    let lastError = "";
    
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?${stream ? "alt=sse&" : ""}key=${GEMINI_API_KEY}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
      
      if (response.ok) {
        console.log(`Using model: ${model}`);
        break;
      }
      
      lastError = await response.text();
      console.error(`Model ${model} failed: ${response.status}`, lastError);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      
      if (response.status >= 500 || response.status === 404) {
        continue; // Try next model on server error or retired model
      }
      
      // For other errors (4xx except 404), don't retry
      break;
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ 
          message: "Bağışlayın, xidmət müvəqqəti əlçatmazdır. Zəhmət olmasa bir az sonra yenidən cəhd edin.", 
          success: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Streaming: transform Gemini SSE to OpenAI-compatible SSE format
    if (stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const transformedStream = new ReadableStream({
        async start(controller) {
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                try {
                  const geminiData = JSON.parse(jsonStr);
                  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (text) {
                    // Convert to OpenAI-compatible delta format
                    const openAIChunk = {
                      choices: [{ delta: { content: text }, index: 0 }],
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          } catch (err) {
            console.error("Stream transform error:", err);
            // CRITICAL: always emit [DONE] so the frontend exits its streaming state,
            // otherwise the user sees the "yazılır..." indicator forever.
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch {
              // controller might already be closed
            }
            controller.close();
          }
        },
      });

      return new Response(transformedStream, {
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
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Bağışlayın, cavab ala bilmədim. Yenidən cəhd edin.";

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
