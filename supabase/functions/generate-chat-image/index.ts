import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PROMPT_LENGTH = 2000;
const VALID_MODES = ["image", "video", "music"];

// LIMITES DIÁRIOS INQUEBRÁVEIS
const DAILY_CHAT_LIMIT = 10;
const DAILY_IMAGE_LIMIT = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { prompt, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Input validation
    if (!prompt || typeof prompt !== "string" || prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: "Prompt inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!mode || !VALID_MODES.includes(mode)) {
      return new Response(JSON.stringify({ error: "Modo inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // =======================================================================
    // TRAVA INQUEBRÁVEL DE BANCO DE DADOS (POR DIA E POR USUÁRIO)
    // =======================================================================
    const isImageRequest = mode === "image";
    const usageType = isImageRequest ? 'imagem' : 'chat';
    const currentLimit = isImageRequest ? DAILY_IMAGE_LIMIT : DAILY_CHAT_LIMIT;

    // Faz a verificação e inserção em uma única transação atômica
    const { data: permitido, error: rpcError } = await supabase.rpc('registrar_uso_ia_atomico', {
      p_user_id: user.id,
      p_tipo_uso: usageType,
      p_limite_diario: currentLimit
    });

    if (rpcError) {
      console.error("Erro na verificação atômica de limite:", rpcError);
      throw rpcError;
    }

    // Se a função SQL retornar false, o limite foi atingido
    if (!permitido) {
      const tipoMsg = isImageRequest ? "imagens" : "solicitações";
      return new Response(
        JSON.stringify({ error: `Você já chegou ao seu limite de ${currentLimit} ${tipoMsg} por dia. Volte amanhã!` }), 
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // =======================================================================

    const safePrompt = prompt.slice(0, MAX_PROMPT_LENGTH);

    if (mode === "image") {
      const imagePrompt = `Create a beautiful, high-quality biblical/spiritual image based on this request: ${safePrompt}. Make it artistic, inspiring, and visually stunning. Do NOT include any text in the image.`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-1.5-flash",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Muitas requisições. Tente novamente." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos esgotados." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const t = await response.text();
        console.error("Image gen error:", response.status, t);
        return new Response(
          JSON.stringify({ error: "Erro ao gerar imagem" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = data.choices?.[0]?.message?.content || "Imagem gerada com sucesso!";

      return new Response(
        JSON.stringify({ imageUrl, text, mode: "image" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For video and music modes, use text generation
    let systemPrompt = "";
    if (mode === "video") {
      systemPrompt = `Você é um roteirista cristão. Crie um roteiro visual detalhado e cinematográfico baseado no pedido. Inclua:
- Descrição de cada cena com detalhes visuais
- Movimentos de câmera sugeridos
- Trilha sonora sugerida
- Narração quando apropriado
Formato: cenas numeradas com descrições ricas. NUNCA use # para títulos, use **negrito**.`;
    } else if (mode === "music") {
      systemPrompt = `Você é um compositor de músicas cristãs talentoso. Crie uma letra de música completa e inspiradora. Inclua:
- Título da música
- Estilo musical sugerido (ex: worship, gospel contemporâneo, etc)
- Versos (pelo menos 2)
- Refrão marcante
- Ponte
- Tom sugerido
A letra deve ser profunda, emocionante e bíblica. NUNCA use # para títulos, use **negrito**.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: safePrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI error");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ text, mode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-chat-image error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
