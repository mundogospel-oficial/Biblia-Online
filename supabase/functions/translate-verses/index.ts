// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const ALLOWED_LANGS = ["en", "es", "fr", "de", "it", "pt"];
const MAX_VERSES = 10;
const DAILY_LIMIT = 5;

// ATENÇÃO: Verifique no seu banco de dados se a tabela se chama "user_ai_usage" ou "uso_de_IA_do_usuario".
// Substitua na variável abaixo para o nome EXATO que está no banco.
const USAGE_TABLE_NAME = "user_ai_usage"; 

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 1. Cliente para validação do Auth (Usa as permissões normais do usuário)
    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser();

    if (authError || !authData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = authData.user.id;
    const requestData = await req.json();
    const verses = requestData.verses;
    const targetLang = requestData.targetLang;

    if (!Array.isArray(verses) || verses.length === 0 || verses.length > MAX_VERSES) {
      return new Response(
        JSON.stringify({ error: `verses must be an array of 1-${MAX_VERSES} items` }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!targetLang || !ALLOWED_LANGS.includes(targetLang)) {
      return new Response(
        JSON.stringify({ error: `targetLang must be one of: ${ALLOWED_LANGS.join(", ")}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Cliente ADMIN para leitura/gravação no banco (Ignora o RLS e garante a operação)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Usa o supabaseAdmin para garantir a contagem real
    const { count, error: countError } = await supabaseAdmin
      .from(USAGE_TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    if (countError) {
      console.error("count error:", countError);
      throw countError;
    }

    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Limite diário de uso da IA atingido." }),
        { status: 429, headers: corsHeaders }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const verseList = verses
      .map((v) => `${v.verse}. ${v.text}`)
      .join("\n");

    const langNames = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
    };

    const langName = langNames[targetLang] || targetLang;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a Bible translator. Translate each verse faithfully and literally word-by-word into ${langName}. Preserve exact meaning. Return ONLY a JSON array with "verse" and "text".`,
          },
          {
            role: "user",
            content: `Translate:\n\n${verseList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: corsHeaders,
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: corsHeaders,
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("parse error:", err, content);
      throw new Error("Failed to parse translation");
    }

    // Usa o supabaseAdmin para garantir a gravação na auditoria
    const { error: insertError } = await supabaseAdmin
      .from(USAGE_TABLE_NAME)
      .insert({ user_id: userId });

    if (insertError) {
      console.error("insert error:", insertError);
    }

    return new Response(JSON.stringify({ translations: parsed }), {
      headers: corsHeaders,
    });

  } catch (e) {
    console.error("translate-verses error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor. Tente novamente mais tarde." }),
      { status: 500, headers: corsHeaders }
    );
  }
});
