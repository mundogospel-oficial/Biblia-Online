import { supabase } from '@/integrations/supabase/client';

let cachedSystemRule: string | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

let cachedGoogleKey: string | null = null;
let cachedOpenRouterKey: string | null = null;
let lastKeyFetchTime = 0;

const fetchKeys = async (): Promise<{ googleKey: string; openRouterKey: string }> => {
  const now = Date.now();
  if (
    cachedGoogleKey !== null && 
    cachedOpenRouterKey !== null && 
    (now - lastKeyFetchTime < CACHE_DURATION)
  ) {
    return { googleKey: cachedGoogleKey, openRouterKey: cachedOpenRouterKey };
  }

  let envGoogle = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
  let envOpenRouter = (import.meta.env.VITE_OPENROUTER_API_KEY || "").trim();

  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('config_key, config_value')
      .in('config_key', ['google_ai_key', 'openrouter_api_key']);
      
    if (!error && data) {
      const dbGoogle = data.find(d => d.config_key === 'google_ai_key')?.config_value;
      const dbOpenRouter = data.find(d => d.config_key === 'openrouter_api_key')?.config_value;
      
      if (dbGoogle && dbGoogle.trim()) envGoogle = dbGoogle.trim();
      if (dbOpenRouter && dbOpenRouter.trim()) envOpenRouter = dbOpenRouter.trim();
    }
  } catch (err) {
    console.warn("Falha ao buscar chaves no banco de dados, usando do ambiente:", err);
  }

  cachedGoogleKey = envGoogle;
  cachedOpenRouterKey = envOpenRouter;
  lastKeyFetchTime = now;

  return { googleKey: envGoogle, openRouterKey: envOpenRouter };
};

const tryComplexGemini = async (
  prompt: string,
  googleKey: string,
  systemRule: string,
  base64Image?: string | null,
  signal?: AbortSignal
): Promise<string> => {
  if (!googleKey) throw new Error("Chave Gemini não disponível.");
  
  const geminiModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];
  let lastErrorMessage = "";
  
  for (const model of geminiModels) {
    try {
      if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemRule }] },
          contents: [{ 
            parts: [
              { text: prompt },
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
  throw new Error(lastErrorMessage || "Falha ao gerar resposta com modelos do Gemini.");
};

const trySimpleOpenRouter = async (
  prompt: string,
  openRouterKey: string,
  systemRule: string,
  base64Image?: string | null,
  signal?: AbortSignal
): Promise<string> => {
  if (!openRouterKey) throw new Error("Chave OpenRouter não disponível.");

  let freeModels: string[] = [];
  const preferredFreeModels = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "deepseek/deepseek-r1-distill-llama-70b:free",
    "mistralai/mistral-7b-instruct:free"
  ];

  try {
    const modelsRes = await fetch("https://openrouter.ai/api/v1/models");
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      const fetchedFree = modelsData.data
        .filter((m: any) => {
          const id = m.id.toLowerCase();
          return id.endsWith(':free') && 
            !id.includes('guard') && 
            !id.includes('safety') && 
            !id.includes('moderator') && 
            !id.includes('moderation') && 
            !id.includes('embed') && 
            !id.includes('classifier') && 
            !id.includes('classify');
        })
        .map((m: any) => m.id);

      const orderedModels = [
        ...preferredFreeModels.filter(p => fetchedFree.includes(p)),
        ...fetchedFree.filter((f: string) => !preferredFreeModels.includes(f))
      ];

      freeModels = orderedModels.length > 0 ? orderedModels : preferredFreeModels;
    }
  } catch (e) {
    console.warn("Falha ao buscar modelos do OpenRouter:", e);
  }

  if (freeModels.length === 0) {
    freeModels = preferredFreeModels;
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
            { role: "system", "content": systemRule },
            { role: "user", "content": base64Image ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: base64Image } }
            ] : prompt }
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

  throw new Error(lastErrorMessage || "Falha ao gerar resposta com modelos do OpenRouter.");
};



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
      
      const privacyDirective = "\n\n[PRIVACY_DIRECTIVE]: Esta conversa é privada. Não armazene, processe ou utilize este histórico para treinamento de modelos ou melhoria de serviços de terceiros. Trate as informações como efêmeras.";
      
      return `${master}\n\n${specific}${privacyDirective}`.trim() || "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo." + privacyDirective;
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
    const { googleKey } = await fetchKeys();
    if (!googleKey) return safeFallback;

    const context = cleanPrompt ? `Usuário: ${cleanPrompt}` : `IA gerou imagem baseada em: ${aiResponse}`;

    const rules = await getSystemRule();
    const systemInstruction = `Você é um gerador de títulos curtos. REGRAS MESTRAS: ${rules}. Crie um título de NO MÁXIMO 4 a 5 palavras para esta interação.
REGRAS ABSOLUTAS: 
1. NÃO use aspas, não use ponto final.
2. NÃO use formatação Markdown.
3. Retorne APENAS o texto puro do título.`;

    const combinedPrompt = `Tarefa: Crie um título curto de 3-5 palavras para o seguinte contexto: ${context}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

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
  throw new Error("SISTEMA EM MANUTENÇÃO: O Dicionário Bíblico Teológico com IA está temporariamente em manutenção preventiva. Retornaremos em breve!");
};

export const askBibleAI = async (
  prompt: string, 
  complexity: 'simple' | 'complex' = 'simple', 
  signal?: AbortSignal, 
  base64Image?: string | null
): Promise<string> => {
  throw new Error("SISTEMA EM MANUTENÇÃO: Nossos modelos de Inteligência Artificial estão temporariamente em manutenção preventiva para otimização do servidor. Retornaremos em breve!");
};
