import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGES = 15;
const MAX_MESSAGE_LENGTH = 1500;
const DAILY_LIMIT = 10;
const MODEL = "google/gemini-2.5-flash-lite";

const systemInstruction = `Você é uma assistente bíblica simples e direta. Regras:
- Responda APENAS sobre a Bíblia, versículos, personagens bíblicos e temas cristãos.
- Seja concisa: máximo 2 parágrafos curtos.
- Use linguagem acolhedora em português do Brasil.
- NUNCA use cabeçalhos markdown (# ou ##). Use **negrito** para destaques.
- Responda de forma natural, como uma conversa, sem parecer um artigo ou textão.
- Se perguntarem algo fora do tema bíblico, redirecione gentilmente.
- Cite versículos quando relevante.`;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Token ausente ou mal formatado" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return json(401, { error: "Sessão inválida. Faça login novamente." });
    }

    const body = await req.json().catch(() => null);
    const rawMessages = body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return json(400, { error: "Mensagens inválidas" });
    }

    const messages = rawMessages
      .slice(-MAX_MESSAGES)
      .map((m: any) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: typeof m?.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH).trim() : "",
      }))
      .filter((m: { content: string }) => Boolean(m.content));

    if (messages.length === 0) return json(400, { error: "Mensagens inválidas" });

    const { data: permitido, error: rpcError } = await supabase.rpc("registrar_uso_ia_atomico", {
      p_user_id: user.id,
      p_tipo_uso: "gemini_chat",
      p_limite_diario: DAILY_LIMIT,
    });

    if (rpcError) { console.error("Erro limite:", rpcError); throw rpcError; }
    if (!permitido) {
      return json(429, { error: `Limite de ${DAILY_LIMIT} mensagens da IA Simples por dia atingido. Volte amanhã!` });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemInstruction }, ...messages],
        max_tokens: 280,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) return json(429, { error: "Muitas requisições. Tente novamente em instantes." });
      if (response.status === 402) return json(402, { error: "Serviço de IA indisponível no momento." });
      return json(500, { error: "Erro no serviço de IA" });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";

    return json(200, { choices: [{ message: { role: "assistant", content: text } }] });
  } catch (e) {
    console.error("gemini-chat error:", e);
    return json(500, { error: "Erro interno do servidor" });
  }
});
