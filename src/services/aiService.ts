import { supabase } from '@/integrations/supabase/client';

const sanitizeAIResponse = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^>\s?/gm, '') // Remove blockquotes (linhas de citação >)
    .replace(/\*/g, '')      // Remove TODOS os asteriscos (mata negrito e itálico)
    .replace(/#/g, '')       // Remove sustenidos de títulos
    .replace(/^-{3,}\s*$/gm, '') // Remove linhas horizontais divisórias
    .replace(/\n{3,}/g, '\n\n') // Remove excesso de linhas de parágrafos vazias
    .trim();
};

export const askBibleAI = async (prompt: string, complexity: 'simple' | 'complex' = 'simple', signal?: AbortSignal): Promise<string> => {
  const googleKey = import.meta.env.VITE_GOOGLE_AI_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // Busca a regra direto do Supabase. Se falhar, usa um fallback de segurança limpo.
  let SYSTEM_RULE = "Responda de forma curta e limpa. Não use asteriscos, negrito ou markdown.";
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('config_value')
      .eq('config_key', 'system_prompt_master')
      .single();
      
    if (data && !error) {
      SYSTEM_RULE = data.config_value;
    }
  } catch (err) {
    console.warn("Falha ao buscar regra do Supabase, usando regra local.", err);
  }

  try {
    if (complexity === 'complex') {
      // --- MODO COMPLEXO: EXCLUSIVO GEMINI ---
      if (!googleKey) throw new Error("Chave VITE_GOOGLE_AI_KEY não configurada.");
      
      const geminiModels = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
      let lastErrorMessage = "";
      
      for (const model of geminiModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_RULE }] },
              contents: [{ parts: [{ text: prompt }] }]
            }),
            signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `Status HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return sanitizeAIResponse(data.candidates[0].content.parts[0].text);
          }
        } catch (e: any) {
          console.warn(`[Aviso] Modelo Gemini ${model} falhou:`, e.message);
          lastErrorMessage = e.message;
        }
      }
      throw new Error(`O modo Complexo (Gemini) está indisponível no momento. Detalhe: ${lastErrorMessage}`);

    } else {
      // --- MODO SIMPLES: EXCLUSIVO OPENROUTER ---
      if (!openRouterKey) throw new Error("Chave VITE_OPENROUTER_API_KEY não configurada.");

      const freeModels = [
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "openrouter/free"
      ];
      let lastErrorMessage = "";

      for (const model of freeModels) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'Bíblia Online'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", "content": SYSTEM_RULE },
                { role: "user", "content": prompt }
              ]
            }),
            signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `Status HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          if (data?.choices?.[0]?.message?.content) {
            return sanitizeAIResponse(data.choices[0].message.content);
          }
        } catch (e: any) {
          console.warn(`[Aviso] Modelo OpenRouter ${model} falhou:`, e.message);
          lastErrorMessage = e.message;
        }
      }
      
      throw new Error(`O modo Simples (OpenRouter) está indisponível no momento. Tente o modo Complexo. Detalhe: ${lastErrorMessage}`);
    }
  } catch (error: any) {
    console.error("Erro fatal no serviço de IA:", error);
    throw new Error(error.message || "Ocorreu um erro inesperado ao consultar a IA.");
  }
};
