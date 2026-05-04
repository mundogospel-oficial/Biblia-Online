import { supabase } from '@/integrations/supabase/client';

let cachedSystemRule: string | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

const sanitizeAIResponse = (text: string): string => {
  if (!text) return "";
  // Remove tags técnicas, caracteres de controle (\x00-\x1F exceto \n \r \t)
  // e caracteres que podem quebrar o Supabase/JSON.
  return text
    .replace(/\[.*?\]/g, '')
    /* eslint-disable no-control-regex */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    /* eslint-enable no-control-regex */
    .trim();
};

export const generateChatTitle = async (userPrompt: string, aiResponse: string): Promise<string> => {
  const cleanPrompt = userPrompt ? userPrompt.replace(/\[.*?\]/g, '').trim() : "";
  const safeFallback = cleanPrompt.length > 0 
    ? (cleanPrompt.length > 30 ? cleanPrompt.substring(0, 30) + "..." : cleanPrompt) 
    : "Geração de Imagem";

  try {
    const googleKey = import.meta.env.VITE_GOOGLE_AI_KEY;
    if (!googleKey) return safeFallback;

    const context = cleanPrompt ? `Usuário: ${cleanPrompt}` : `IA gerou imagem baseada em: ${aiResponse}`;

    const systemInstruction = `Você é um gerador de títulos curtos. Crie um título de NO MÁXIMO 4 a 5 palavras para esta interação.
REGRAS ABSOLUTAS: 
1. NÃO use aspas, não use ponto final.
2. NÃO use formatação Markdown.
3. Retorne APENAS o texto puro do título.`;

    // Mesclamos a instrução com o contexto para os modelos mais antigos entenderem
    const combinedPrompt = `${systemInstruction}\n\nContexto da interação: ${context}`;

    // Array de resiliência com o 'gemini-pro' como salvador da pátria
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Enviamos APENAS contents (sem systemInstruction)
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: combinedPrompt }] }] 
          })
        });

        if (response.ok) {
          const data = await response.json();
          const title = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          
          if (title) {
            return title.replace(/["*]/g, ''); // Sucesso! Limpa aspas ou markdown rebelde.
          }
        }
      } catch (e) {
        console.warn(`[Aviso] Modelo ${model} falhou ao gerar título. Tentando o próximo...`);
      }
    }

    // Se TODOS falharem, usa a string limpa
    return safeFallback;
  } catch (error) {
    return safeFallback;
  }
};

export const askBibleAI = async (prompt: string, complexity: 'simple' | 'complex' = 'simple', signal?: AbortSignal, base64Image?: string | null): Promise<string> => {
  const googleKey = import.meta.env.VITE_GOOGLE_AI_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const cleanPrompt = prompt.replace(/\[.*?\]/g, '').trim();

  let SYSTEM_RULE = "Você SÓ PODE responder sobre a Bíblia. Use linguagem erudita, markdown limpo e evite caracteres de controle ilegais.";
  
  // Cache de Regras para velocidade máxima
  const now = Date.now();
  if (cachedSystemRule && (now - lastCacheUpdate < CACHE_DURATION)) {
    SYSTEM_RULE = cachedSystemRule;
  } else {
    try {
      const { data } = await supabase
        .from('ai_settings')
        .select('config_value')
        .eq('config_key', 'system_prompt_master')
        .maybeSingle(); // Usar maybeSingle para evitar erros se não existir
      
      if (data?.config_value) {
        SYSTEM_RULE = data.config_value;
        cachedSystemRule = SYSTEM_RULE;
        lastCacheUpdate = now;
      }
    } catch (err) {
      console.warn("Usando regra local temporária.");
    }
  }

  try {
    if (complexity === 'complex') {
      if (!googleKey) throw new Error("Chave VITE_GOOGLE_AI_KEY não configurada.");
      
      // Modelos Flash são MUITO mais rápidos e confiáveis
      const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-pro'];
      let lastErrorMessage = "";
      
      for (const model of geminiModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_RULE }] },
              contents: [{ 
                parts: [
                  { text: cleanPrompt },
                  ...(base64Image ? [{
                    inlineData: {
                      mimeType: base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')),
                      data: base64Image.substring(base64Image.indexOf(',') + 1)
                    }
                  }] : [])
                ] 
              }],
              generationConfig: { 
                temperature: 0.4, 
                topP: 0.8, 
                topK: 40,
                maxOutputTokens: 800 // Limita resposta para ser mais rápida
              }
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
          if (e.name === 'AbortError' || e.message?.includes('abort')) throw e;
          console.warn(`[Aviso] Modelo Gemini ${model} falhou:`, e.message);
          lastErrorMessage = e.message;
        }
      }
      throw new Error(`O modo Complexo (Gemini) está indisponível no momento. Detalhe: ${lastErrorMessage}`);

    } else {
      // --- MODO SIMPLES: EXCLUSIVO OPENROUTER ---
      if (!openRouterKey) throw new Error("Chave VITE_OPENROUTER_API_KEY não configurada.");

      const freeModels = [
        "google/gemini-2.0-flash-exp:free", 
        "google/gemini-flash-1.5-8b:free", 
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
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
                { role: "user", "content": base64Image ? [
                  { type: "text", text: cleanPrompt },
                  { type: "image_url", image_url: { url: base64Image } }
                ] : cleanPrompt }
              ],
              temperature: 0.5,
              max_tokens: 800
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
          if (e.name === 'AbortError' || e.message?.includes('abort')) throw e;
          console.warn(`[Aviso] Modelo OpenRouter ${model} falhou:`, e.message);
          lastErrorMessage = e.message;
        }
      }
      
      throw new Error(`O modo Simples (OpenRouter) está indisponível no momento. Tente o modo Complexo. Detalhe: ${lastErrorMessage}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('abort')) throw error;
    console.error("Erro fatal no serviço de IA:", error);
    throw new Error(error.message || "Ocorreu um erro inesperado ao consultar a IA.");
  }
};
