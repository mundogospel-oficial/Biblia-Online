import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_VERSE_LENGTH = 2000;
const MAX_STYLE_LENGTH = 500;
const MAX_REFERENCE_LENGTH = 200;

// LIMITE DIÁRIO INQUEBRÁVEL
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

    const { verse, reference, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Input validation
    if (!verse || typeof verse !== "string" || verse.length > MAX_VERSE_LENGTH) {
      return new Response(JSON.stringify({ error: "Versículo inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // =======================================================================
    // TRAVA INQUEBRÁVEL DE BANCO DE DADOS (POR DIA E POR USUÁRIO)
    // =======================================================================
    const usageType = 'imagem';
    const currentLimit = DAILY_IMAGE_LIMIT;

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
      return new Response(
        JSON.stringify({ error: `Você já chegou ao seu limite de ${currentLimit} imagens por dia. Volte amanhã!` }), 
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // =======================================================================

    const safeVerse = verse.slice(0, MAX_VERSE_LENGTH);
    const safeReference = typeof reference === "string" ? reference.slice(0, MAX_REFERENCE_LENGTH) : "Bíblia";
    const safeStyle = typeof style === "string" ? style.slice(0, MAX_STYLE_LENGTH) : "serene landscape with soft light";

    const prompt = `Create a beautiful, artistic image for a Bible verse card. Style: ${safeStyle}. The image should be peaceful, spiritual, and inspiring. Do NOT include any text in the image. The verse is: "${safeVerse}" - ${safeReference}. Make it suitable as a background for overlaying text. Ultra high resolution, 16:9 aspect ratio.`;

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
          messages: [{ role: "user", content: prompt }],
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
      const t = await response.text();
      console.error("Image gen error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar a imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-verse-image error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
