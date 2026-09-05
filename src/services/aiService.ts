import { supabase } from '@/integrations/supabase/client';
import { sanitizeUserPrompt, buildPrivacyEnhancedSystemRule } from '@/lib/security/privacyGuard';

let cachedSystemRule: string | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

let cachedGoogleKey: string | null = null;
let cachedGoogleKey2: string | null = null;
let cachedOpenRouterKey: string | null = null;
let cachedOpenRouterKey2: string | null = null;
let lastKeyFetchTime = 0;

export const fetchKeys = async (): Promise<{ googleKey: string; googleKey2: string; openRouterKey: string; openRouterKey2: string }> => {
  const now = Date.now();
  if (
    cachedGoogleKey !== null && 
    cachedGoogleKey2 !== null && 
    cachedOpenRouterKey !== null && 
    cachedOpenRouterKey2 !== null && 
    (now - lastKeyFetchTime < CACHE_DURATION)
  ) {
    return { googleKey: cachedGoogleKey, googleKey2: cachedGoogleKey2, openRouterKey: cachedOpenRouterKey, openRouterKey2: cachedOpenRouterKey2 };
  }

  // Chaves de IA gerenciadas de forma segura (sem expor segredos no bundle público)
  let envGoogle = "";
  let envGoogle2 = "";
  let envOpenRouter = "";
  let envOpenRouter2 = "";

  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('config_key, config_value')
      .in('config_key', ['google_ai_key', 'google_ai_key_2', 'openrouter_api_key', 'openrouter_api_key_2']);
      
    if (!error && data) {
      const dbGoogle = data.find(d => d.config_key === 'google_ai_key')?.config_value;
      const dbGoogle2 = data.find(d => d.config_key === 'google_ai_key_2')?.config_value;
      const dbOpenRouter = data.find(d => d.config_key === 'openrouter_api_key')?.config_value;
      const dbOpenRouter2 = data.find(d => d.config_key === 'openrouter_api_key_2')?.config_value;
      
      if (dbGoogle && dbGoogle.trim()) envGoogle = dbGoogle.trim();
      if (dbGoogle2 && dbGoogle2.trim()) envGoogle2 = dbGoogle2.trim();
      if (dbOpenRouter && dbOpenRouter.trim()) envOpenRouter = dbOpenRouter.trim();
      if (dbOpenRouter2 && dbOpenRouter2.trim()) envOpenRouter2 = dbOpenRouter2.trim();
    }
  } catch (err) {
    console.warn("Falha ao buscar chaves no banco de dados, usando do ambiente:", err);
  }

  cachedGoogleKey = envGoogle;
  cachedGoogleKey2 = envGoogle2;
  cachedOpenRouterKey = envOpenRouter;
  cachedOpenRouterKey2 = envOpenRouter2;
  lastKeyFetchTime = now;

  return { googleKey: envGoogle, googleKey2: envGoogle2, openRouterKey: envOpenRouter, openRouterKey2: envOpenRouter2 };
};

export interface AIAttachment {
  base64: string; // complete data URI (e.g. data:image/png;base64,...)
  mimeType: string;
  name: string;
}

const normalizeAttachments = (attachments?: AIAttachment[] | string | null): AIAttachment[] => {
  if (!attachments) return [];
  if (typeof attachments === 'string') {
    const mimeMatch = attachments.match(/^data:(.*?);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    return [{
      base64: attachments,
      mimeType: mimeType,
      name: 'file'
    }];
  }
  return attachments;
};

const tryComplexGemini = async (
  prompt: string,
  googleKey: string,
  systemRule: string,
  attachments?: AIAttachment[] | string | null,
  signal?: AbortSignal,
  skipBracketRemoval: boolean = false,
  googleKey2?: string
): Promise<string> => {
  if (!googleKey && !googleKey2) throw new Error("Chave Gemini não disponível.");
  
  const normalized = normalizeAttachments(attachments);
  const geminiModels = [
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ];
  let lastErrorMessage = "";
  
  const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];

  for (const key of keysToTry) {
    let keyFailed = false;
    for (const model of geminiModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const parts: any[] = [{ text: prompt }];
        
        normalized.forEach(att => {
          const commaIndex = att.base64.indexOf(',');
          const dataPart = commaIndex !== -1 ? att.base64.substring(commaIndex + 1) : att.base64;
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: dataPart
            }
          });
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemRule }] },
            contents: [{ parts }],
            generationConfig: { 
              temperature: 0.4, 
              maxOutputTokens: 4000 
            }
          }),
          signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errMsg = errorData?.error?.message || `Status HTTP: ${response.status}`;
          const isKeyError = response.status === 400 || response.status === 403 || response.status === 429 || 
                             errMsg.toLowerCase().includes("key") || errMsg.toLowerCase().includes("quota");
          if (isKeyError) {
            keyFailed = true;
            throw new Error(`key_error: ${errMsg}`);
          }
          throw new Error(errMsg);
        }
        
        const data = await response.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return sanitizeAIResponse(data.candidates[0].content.parts[0].text, skipBracketRemoval);
        }
      } catch (e: any) {
        if (e.name === 'AbortError' || e.message?.includes('abort')) throw e;
        lastErrorMessage = e.message;
        console.warn(`[Aviso] Falha com a chave ${key.substring(0, 8)}... usando o modelo ${model}: ${e.message}`);
        if (e.message?.startsWith('key_error:')) {
          break;
        }
      }
    }
    if (keyFailed) continue;
  }
  throw new Error(lastErrorMessage || "Falha ao gerar resposta com modelos do Gemini.");
};

const trySimpleOpenRouter = async (
  prompt: string,
  openRouterKey: string,
  systemRule: string,
  attachments?: AIAttachment[] | string | null,
  signal?: AbortSignal,
  skipBracketRemoval: boolean = false,
  openRouterKey2?: string
): Promise<string> => {
  if (!openRouterKey && !openRouterKey2) throw new Error("Chave OpenRouter não disponível.");

  const normalized = normalizeAttachments(attachments);
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
  const keysToTry = [openRouterKey, openRouterKey2].filter(Boolean) as string[];

  for (const key of keysToTry) {
    let keyFailed = false;
    for (const model of freeModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const userContent: any[] = [{ type: "text", text: prompt }];
        normalized.forEach(att => {
          if (att.mimeType.startsWith('image/')) {
            userContent.push({ type: "image_url", image_url: { url: att.base64 } });
          }
        });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'IA Bíblica'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", "content": systemRule },
              { role: "user", "content": userContent.length > 1 ? userContent : prompt }
            ],
            temperature: 0.5,
            max_tokens: 4000
          }),
          signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || response.statusText;
          const errMsgLower = errMsg.toLowerCase();
          
          // Determine if it is a transient error from the upstream model provider
          const isProviderError = errMsgLower.includes("provider") || 
                                  errMsgLower.includes("upstream") || 
                                  errMsgLower.includes("moderation") || 
                                  errMsgLower.includes("safety") || 
                                  errMsgLower.includes("blocked") ||
                                  errMsgLower.includes("content filter") ||
                                  errMsgLower.includes("overloaded") ||
                                  errMsgLower.includes("rate limit") ||
                                  response.status >= 500;

          // Only consider it a key/quota error if it is genuinely a credential or billing issue
          const isKeyError = !isProviderError && (
            response.status === 401 || 
            response.status === 402 || 
            errMsgLower.includes("api key") || 
            errMsgLower.includes("api_key") || 
            errMsgLower.includes("invalid key") || 
            errMsgLower.includes("credit") || 
            errMsgLower.includes("balance") || 
            errMsgLower.includes("unauthorized")
          );

          if (isKeyError) {
            keyFailed = true;
            lastErrorMessage = `key_error: ${errMsg}`;
            break;
          }
          lastErrorMessage = errMsg;
          continue; 
        }
        
        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          return sanitizeAIResponse(data.choices[0].message.content, skipBracketRemoval);
        }
      } catch (e: any) {
        if (e.name === 'AbortError') throw e;
        lastErrorMessage = e.message;
      }
    }
    if (keyFailed) continue;
  }

  throw new Error(lastErrorMessage || "Falha ao gerar resposta com modelos do OpenRouter.");
};



const sanitizeAIResponse = (text: string, skipBracketRemoval: boolean = true): string => {
  if (!text) return "";
  // Remove tags técnicas, caracteres de controle (\x00-\x1F exceto \n \r \t)
  // e caracteres que podem quebrar o Supabase/JSON.
  let clean = text;
  if (!skipBracketRemoval) {
    clean = clean.replace(/\[(?!\s*Arquivo:).*?\]/gi, '');
  }
  return clean
    /* eslint-disable no-control-regex */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    /* eslint-enable no-control-regex */
    .trim();
};

export const BIBLE_VERSIONS_DIRECTIVE = `\n\n[INTEGRAÇÃO DAS VERSÕES BÍBLICAS DO APLICATIVO]:
1. As versões e traduções da Bíblia Sagrada que estão oficialmente integradas e disponíveis no aplicativo são:
   - Bíblia Sagrada de Almeida (Almeida / Almeida Corrigida Fiel - ARC / Almeida 1980 - Português) [Versão Principal do App]
   - Bíblia Livre (BLivre 2018 - Português)
   - King James Version (KJV - Inglês)
   - Bible in Basic English (BBE - Inglês)
   - World English Bible (WEB - Inglês)
2. REGRA DE RESPOSTA E CITAÇÃO OBRIGATÓRIA:
   - Quando responder a perguntas, explicar estudos ou citar versículos bíblicos, utilize ESTRITAMENTE o texto exato e fiel destas versões integradas no aplicativo (em português, priorize a Bíblia Sagrada de Almeida e a Bíblia Livre).
   - NUNCA invente ou altere palavras do texto bíblico oficial nem forneça traduções que não existem no app.
   - Quando citar diretamente versículos na íntegra, informe sempre a referência com o nome do livro, capítulo, versículo e a versão utilizada entre parênteses (exemplo: "João 3:16 - Almeida" ou "Salmos 23:1 - Bíblia Livre").`;

export const getSystemRule = async (specificKey?: string): Promise<string> => {
  const christianEthicsDirective = `\n\n[DIRETIVA BÍBLICA E CRISTÃ DE COMPREENSÃO DE INTENÇÃO E CONTEXTO - REGRA MESTRA]:
1. VOCÊ É UMA INTELIGÊNCIA ARTIFICIAL E ASSISTENTE BÍBLICO ESPECIALIZADO EXCLUSIVAMENTE NA BÍBLIA SAGRADA E NA FÉ CRISTÃ.
2. AVALIAÇÃO INTELIGENTE DE CONTEXTO E INTENÇÃO (OBRIGATÓRIO PARA EVITAR FALSOS POSITIVOS):
   - Você DEVE analisar o SENTIDO REAL e a INTENÇÃO PRINCIPAL da mensagem do usuário.
   - Se o tema central for BÍBLICO, TEOLÓGICO, CRISTÃO, DE ORAÇÃO OU HISTÓRIA SAGRADA (exemplo: Salmos, Moisés, Jesus, Paulo, versículos, fé, conduta cristã, estudos bíblicos, teologia), VOCÊ DEVE RESPONDER COMPLETA E NORMALMENTE AO CONTEÚDO BÍBLICO.
   - NUNCA bloqueie ou classifique uma mensagem bíblica como "assunto secular" por causa de formatações, links, trechos em inglês, termos técnicos de TI, tags de código ou símbolos anexados à pergunta. Ignore esses elementos técnicos/anexados e responda com excelência ao assunto bíblico central.
3. RESTRIÇÃO A ASSUNTOS PURAMENTE SECULARES:
   - Recuse apenas quando a pergunta for EXCLUSIVAMENTE e 100% sobre assuntos seculares e mundanos desvinculados da fé (como futebol, receitas de culinária, política partidária secular, jogos, fofocas, finanças mundanas, etc.).
4. RESPOSTA DE RECUSA PARA TEMAS ESTRITAMENTE SECULARES:
   - Se e somente se a pergunta for exclusivamente secular, responda educadamente:
   "Olá! Sou uma Inteligência Artificial dedicada exclusivamente aos estudos da Bíblia Sagrada e aos ensinamentos da fé cristã. Por este motivo, não posso responder sobre assuntos seculares ou fora do contexto bíblico. Como posso ajudar você em seus estudos da Palavra de Deus hoje?"
5. É estritamente proibido atender a pedidos que promovam crimes, pornografia, violência, roubo, imoralidade ou ofensas.`;

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
      
      const baseRule = `${master}\n\n${specific}`.trim() || "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";
      return `${baseRule}${BIBLE_VERSIONS_DIRECTIVE}${christianEthicsDirective}${privacyDirective}`;
    }
  } catch (err) {
    console.warn("Falha ao ler regras do Supabase, usando fallback.");
  }
  return `Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.${BIBLE_VERSIONS_DIRECTIVE}${christianEthicsDirective}`;
};

export const generateChatTitle = async (userPrompt: string, aiResponse: string): Promise<string> => {
  const cleanPrompt = userPrompt ? userPrompt.replace(/\[.*?\]/g, '').trim() : "";
  const safeFallback = cleanPrompt.length > 0 
    ? (cleanPrompt.length > 30 ? cleanPrompt.substring(0, 30) + "..." : cleanPrompt) 
    : "Geração de Imagem";

  try {
    const { googleKey, googleKey2 } = await fetchKeys();
    if (!googleKey && !googleKey2) return safeFallback;

    const context = cleanPrompt ? `Usuário: ${cleanPrompt}` : `IA gerou imagem baseada em: ${aiResponse}`;

    const rules = await getSystemRule();
    const systemInstruction = `Você é um gerador de títulos curtos. REGRAS MESTRAS: ${rules}. Crie um título de NO MÁXIMO 4 a 5 palavras para esta interação.
REGRAS ABSOLUTAS: 
1. NÃO use aspas, não use ponto final.
2. NÃO use formatação Markdown.
3. Retorne APENAS o texto puro do título.`;

    const combinedPrompt = `Tarefa: Crie um título curto de 3-5 palavras para o seguinte contexto: ${context}`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest'];
    const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];

    for (const key of keysToTry) {
      let keyFailed = false;
      for (const model of modelsToTry) {
        try {
          if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
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
          } else {
            const errorData = await response.json().catch(() => null);
            const errMsg = errorData?.error?.message || "";
            const isKeyError = response.status === 400 || response.status === 403 || response.status === 429 || 
                               errMsg.toLowerCase().includes("key") || errMsg.toLowerCase().includes("quota");
            if (isKeyError) {
              keyFailed = true;
              break;
            }
          }
        } catch (e) {
          console.warn(`[Aviso] Modelo ${model} falhou ao gerar título.`);
        }
      }
      if (keyFailed) continue;
    }
    return safeFallback;
  } catch (error) {
    return safeFallback;
  }
};

export const askDictionaryAI = async (verseText: string, reference: string, signal?: AbortSignal): Promise<string> => {
  const { googleKey, googleKey2, openRouterKey, openRouterKey2 } = await fetchKeys();

  const dictSystemInstruction = `Você é um Dicionário e Léxico Teológico Bíblico Conciso e Erudito.
Sua missão é explicar o versículo bíblico fornecido de forma direta, teológica e linguisticamente precisa, com no MÁXIMO 500 CARACTERES.

ESCOPO BÍBLICO E CRISTÃO ESTRITO:
Você está restrito EXCLUSIVAMENTE ao contexto da Bíblia Sagrada e Fé Cristã.

REGRAS OBRIGATÓRIAS (RIGOROSAS):
1. LIMITE RIGOROSO DE TAMANHO (MÁXIMO 500 CARACTERES):
   - A resposta inteira NUNCA pode ultrapassar 500 caracteres.
   - Seja extremamente conciso, direto e vá ao ponto essencial.

2. RESPOSTAS COMPLETAS E SEM CORTES:
   - Toda frase deve ter início, meio e fim. Conclua 100% dos pensamentos e pontue corretamente.
   - NUNCA deixe palavras ou frases incompletas.

3. ANÁLISE LINGUÍSTICA (HEBRAICO / GREGO):
   - Inclua pelo menos 1 palavra-chave no idioma original com transliteração em itálico e seu significado teológico (Hebraico no AT / Grego no NT).

4. ESTRUTURA DIRETA E SINTÉTICA EM MARKDOWN:
   - **Termo Original**: palavra em Hebraico/Grego (*transliteração*) — significado teológico.
   - **Contexto Teológico**: explicação direta e essencial da passagem.
   - **Aplicação**: 1 frase prática para a vida cristã.

5. IDIOMA: Português limpo, elegante e direto.`;

  const dictPrompt = `Forneça a explicação concisa (MÁXIMO 500 CARACTERES com frases completas) do dicionário bíblico para:
"${verseText}" — Referência: ${reference}`;

  const geminiModels = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];
  let lastError = "";

  for (const key of keysToTry) {
    let keyFailed = false;
    for (const model of geminiModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: dictSystemInstruction }] },
            contents: [{ parts: [{ text: dictPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4000
            }
          }),
          signal
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content && content.trim().length > 30) {
            return sanitizeAIResponse(content);
          }
        } else {
          const errorData = await response.json().catch(() => null);
          const errMsg = errorData?.error?.message || `Status HTTP: ${response.status}`;
          const isKeyError = response.status === 400 || response.status === 403 || response.status === 429 || 
                             errMsg.toLowerCase().includes("key") || errMsg.toLowerCase().includes("quota");
          if (isKeyError) {
            keyFailed = true;
            lastError = errMsg;
            break;
          }
          lastError = errMsg;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') throw e;
        lastError = e.message;
      }
    }
    if (keyFailed) continue;
  }

  // Fallback para OpenRouter via proxy seguro do servidor (OPENROUTER_API_KEY protegida)
  try {
    const backendRes = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: dictSystemInstruction },
          { role: 'user', content: dictPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
      signal
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 30) {
        return sanitizeAIResponse(content);
      }
    }
  } catch (backendErr: any) {
    if (backendErr.name === 'AbortError') throw backendErr;
  }

  // Fallback secundário local se chaves estiverem salvas no Supabase ai_settings
  const openRouterKeys = [openRouterKey, openRouterKey2].filter(Boolean) as string[];
  const freeModels = [
    "deepseek/deepseek-chat",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "openrouter/free"
  ];

  for (const rKey of openRouterKeys) {
    for (const model of freeModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${rKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Bíblia Digital Dicionário'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: dictSystemInstruction },
              { role: 'user', content: dictPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
          }),
          signal
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && content.trim().length > 30) {
            return sanitizeAIResponse(content);
          }
        }
      } catch (orErr: any) {
        if (orErr.name === 'AbortError') throw orErr;
      }
    }
  }

  throw new Error(`Dicionário indisponível: ${lastError || "Serviço de IA temporariamente indisponível."}`);
};

export const askBibleAI = async (
  prompt: string, 
  complexity: 'simple' | 'complex' = 'simple', 
  signal?: AbortSignal, 
  attachments?: AIAttachment[] | string | null,
  customSystemRule?: string,
  skipBracketRemoval: boolean = true
): Promise<string> => {
  const { googleKey, googleKey2, openRouterKey, openRouterKey2 } = await fetchKeys();

  if (!googleKey && !googleKey2 && !openRouterKey && !openRouterKey2) {
    throw new Error("Chave de API não configurada. Configure a sua chave do Gemini ou do OpenRouter nas configurações de chaves da Conta.");
  }

  const ruleKey = complexity === 'simple' ? 'gemini_prompt_simples' : 'gemini_prompt_complexo';
  const baseRule = await getSystemRule(ruleKey);
  const rawRule = customSystemRule ? `${customSystemRule}${BIBLE_VERSIONS_DIRECTIVE}` : baseRule;
  const SYSTEM_RULE = buildPrivacyEnhancedSystemRule(rawRule);

  const MAX_PROMPT_LENGTH = 2000;
  const rawClean = prompt 
    ? (skipBracketRemoval ? prompt.trim() : prompt.replace(/\[(?!\s*Arquivo:).*?\]/gi, '').trim()).slice(0, MAX_PROMPT_LENGTH) 
    : "";

  const { cleanPrompt } = sanitizeUserPrompt(rawClean);

  try {
    if (complexity === 'complex') {
      if (googleKey || googleKey2) {
        return await tryComplexGemini(cleanPrompt, googleKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, googleKey2);
      } else {
        throw new Error("Chave do Google AI (Gemini) indisponível para o Chat Complexo.");
      }
    } else {
      // Chat Simples
      if (openRouterKey || openRouterKey2) {
        return await trySimpleOpenRouter(cleanPrompt, openRouterKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, openRouterKey2);
      } else {
        // Fallback to Gemini if OpenRouter key is not found but Google is
        if (googleKey || googleKey2) {
          return await tryComplexGemini(cleanPrompt, googleKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, googleKey2);
        }
        throw new Error("Chave do OpenRouter indisponível para o Chat Simples.");
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('abort')) throw error;
    if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch failed') || error.message?.includes('NetworkError')) {
      throw new Error("Erro de conexão: Não foi possível alcançar o servidor da IA. Verifique sua conexão com a internet.");
    }
    throw new Error(error.message || "Ocorreu um erro inesperado ao consultar a IA.");
  }
};
