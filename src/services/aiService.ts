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

export const getSystemRule = async (specificKey?: string): Promise<string> => {
  try {
    const keysToFetch = ['system_prompt_master'];
    if (specificKey) keysToFetch.push(specificKey);

    const { data } = await supabase
      .from('ai_settings')
      .select('config_key, config_value')
      .in('config_key', keysToFetch);
    
    if (data) {
      const master = data.find(d => d.config_key === 'system_prompt_master')?.config_value || "";
      const specific = specificKey ? (data.find(d => d.config_key === specificKey)?.config_value || "") : "";
      
      return `${master}\n\n${specific}`.trim() || "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";
    }
  } catch (err) {
    console.warn("Falha ao ler regras do Supabase, usando fallback.");
  }
  return "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";
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

    const rules = await getSystemRule();
    const systemInstruction = `Você é um gerador de títulos curtos. REGRAS MESTRAS: ${rules}. Crie um título de NO MÁXIMO 4 a 5 palavras para esta interação.
REGRAS ABSOLUTAS: 
1. NÃO use aspas, não use ponto final.
2. NÃO use formatação Markdown.
3. Retorne APENAS o texto puro do título.`;

    const combinedPrompt = `Tarefa: Crie um título curto de 3-5 palavras para o seguinte contexto: ${context}`;

    const modelsToTry = ['gemini-1.5-flash', 'gemini-pro'];

    for (const model of modelsToTry) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: combinedPrompt }] }] 
          })
        });

        if (response.ok) {
          const data = await response.json();
          const title = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (title) return title.replace(/["*]/g, '');
        }
      } catch (e) {
        console.warn(`[Aviso] Modelo ${model} falhou ao gerar título.`);
      }
    }
    return safeFallback;
  } catch (error) {
    return safeFallback;
  }
};

export const askDictionaryAI = async (verseText: string, reference: string, signal?: AbortSignal): Promise<string> => {
  const googleKey = import.meta.env.VITE_GOOGLE_AI_KEY;
  if (!googleKey) throw new Error("Chave VITE_GOOGLE_AI_KEY não configurada.");

  const combinedRule = await getSystemRule('gemini_prompt_dicionario');
  const dictPrompt = `Aja como um Dicionário Bíblico Erudito. Analise o versículo abaixo.
Versículo: "${verseText}" — ${reference}`;

  const geminiModels = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-pro'
  ];

  let lastError = "";
  for (const model of geminiModels) {
    try {
      if (!navigator.onLine) throw new Error("Sem conexão com a internet.");
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: combinedRule }] },
          contents: [{ parts: [{ text: dictPrompt }] }]
        }),
        signal
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return sanitizeAIResponse(content);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
      lastError = e.message;
    }
  }
  throw new Error(`Dicionário indisponível: ${lastError}`);
};

export const askBibleAI = async (prompt: string, complexity: 'simple' | 'complex' = 'simple', signal?: AbortSignal, base64Image?: string | null): Promise<string> => {
  const googleKey = import.meta.env.VITE_GOOGLE_AI_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const ruleKey = complexity === 'simple' ? 'gemini_prompt_simples' : 'gemini_prompt_complexo';
  const SYSTEM_RULE = await getSystemRule(ruleKey);

  try {
    if (complexity === 'complex') {
      if (!googleKey) throw new Error("Chave VITE_GOOGLE_AI_KEY não configurada.");
      
      const cleanPrompt = prompt ? prompt.replace(/\[.*?\]/g, '').trim() : "";
      const geminiModels = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-pro'
      ];
      let lastErrorMessage = "";
      
      for (const model of geminiModels) {
        try {
          if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

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
                maxOutputTokens: 1000 
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
          lastErrorMessage = e.message;
        }
      }
      throw new Error(`O modo Complexo (Gemini) está indisponível no momento. Detalhe: ${lastErrorMessage}`);

    } else {
      if (!openRouterKey) throw new Error("Chave VITE_OPENROUTER_API_KEY não configurada.");

      const cleanPrompt = prompt ? prompt.replace(/\[.*?\]/g, '').trim() : "";
      
      // Busca modelos gratuitos dinamicamente
      let freeModels: string[] = [];
      try {
        const modelsRes = await fetch("https://openrouter.ai/api/v1/models");
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          freeModels = modelsData.data
            .filter((m: any) => m.id.endsWith(':free'))
            .map((m: any) => m.id);
        }
      } catch (e) {
        console.warn("Falha ao buscar modelos free do OpenRouter, usando fallback local.");
      }

      // Fallback caso a busca falhe ou retorne vazio
      if (freeModels.length === 0) {
        freeModels = [
          "google/gemma-2-9b-it:free",
          "meta-llama/llama-3.3-70b-instruct:free",
          "qwen/qwen-2.5-72b-instruct:free",
          "mistralai/mistral-7b-instruct:free"
        ];
      }

      let lastErrorMessage = "";

      for (const model of freeModels) {
        try {
          if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'IA Bíblica'
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
              max_tokens: 1000
            }),
            signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            lastErrorMessage = errorData.error?.message || response.statusText;
            continue; 
          }
          
          const data = await response.json();
          if (data?.choices?.[0]?.message?.content) {
            return sanitizeAIResponse(data.choices[0].message.content);
          }
        } catch (e: any) {
          if (e.name === 'AbortError') throw e;
          lastErrorMessage = e.message;
        }
      }

      throw new Error(`O modo Simples (OpenRouter) está indisponível no momento. Detalhe: ${lastErrorMessage}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('abort')) throw error;
    if (error.message === 'Failed to fetch') {
      throw new Error("Erro de conexão: Não foi possível alcançar o servidor da IA. Verifique sua internet.");
    }
    throw new Error(error.message || "Ocorreu um erro inesperado ao consultar a IA.");
  }
};
