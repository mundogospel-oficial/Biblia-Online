import { supabase } from '@/integrations/supabase/client';
import { maskPiiInText, sanitizeUserPrompt, buildPrivacyEnhancedSystemRule } from '@/lib/security/privacyGuard';

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

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const tryComplexGemini = async (
  prompt: string,
  googleKey: string,
  systemRule: string,
  attachments?: AIAttachment[] | string | null,
  signal?: AbortSignal,
  skipBracketRemoval: boolean = false,
  googleKey2?: string,
  history?: AIChatMessage[]
): Promise<string> => {
  const normalized = normalizeAttachments(attachments);

  // 1. Prioridade Segura: Envia para o proxy do servidor (chaves de API protegidas no backend)
  try {
    const proxyRes = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        systemInstruction: systemRule,
        attachments: normalized,
        history,
        temperature: 0.4,
        maxTokens: 4000
      }),
      signal
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data?.text) {
        return sanitizeAIResponse(data.text, skipBracketRemoval);
      }
    }
  } catch (proxyErr: any) {
    if (proxyErr.name === 'AbortError' || proxyErr.message?.includes('abort')) throw proxyErr;
    console.warn("[Gemini Proxy Server] Tentando fallback...", proxyErr);
  }

  // 2. Fallback local se o servidor não tiver as chaves configuradas
  if (!googleKey && !googleKey2) throw new Error("Chave Gemini não disponível.");
  
  const geminiModels = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ];
  let lastErrorMessage = "";
  
  const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];

  for (const key of keysToTry) {
    let keyFailed = false;
    for (const model of geminiModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

        if (Array.isArray(history) && history.length > 0) {
          for (const item of history) {
            if (!item || typeof item.content !== "string") continue;
            const cleanText = item.content.trim();
            if (!cleanText) continue;

            const role: 'user' | 'model' = (item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';

            if (contents.length === 0 && role !== 'user') continue;

            const lastTurn = contents.length > 0 ? contents[contents.length - 1] : null;
            if (lastTurn && lastTurn.role === role) {
              lastTurn.parts.push({ text: cleanText });
            } else {
              contents.push({ role, parts: [{ text: cleanText }] });
            }
          }
        }

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

        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts.push(...parts);
        } else {
          contents.push({ role: 'user', parts });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemRule }] },
            contents,
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
  openRouterKey2?: string,
  history?: AIChatMessage[]
): Promise<string> => {
  const normalized = normalizeAttachments(attachments);

  const historyMessages = (Array.isArray(history) ? history : [])
    .filter(h => h && typeof h.content === 'string' && h.content.trim().length > 0)
    .map(h => ({
      role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: h.content.trim()
    }));

  const userContent: any[] = [{ type: "text", text: prompt }];
  normalized.forEach(att => {
    userContent.push({
      type: "image_url",
      image_url: { url: att.base64 }
    });
  });

  const fullMessages = [
    { role: "system", content: systemRule },
    ...historyMessages,
    { role: "user", content: userContent.length > 1 ? userContent : prompt }
  ];

  // 1. Prioridade Segura: Envia para o proxy do servidor (chaves protegidas no backend)
  try {
    const proxyRes = await fetch("/api/openrouter/chat", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Data-Collection": "deny"
      },
      body: JSON.stringify({
        messages: fullMessages,
        provider: {
          data_collection: "deny"
        },
        temperature: 0.5,
        max_tokens: 4000
      }),
      signal
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data?.choices?.[0]?.message?.content) {
        return sanitizeAIResponse(data.choices[0].message.content, skipBracketRemoval);
      }
    }
  } catch (proxyErr: any) {
    if (proxyErr.name === 'AbortError' || proxyErr.message?.includes('abort')) throw proxyErr;
    console.warn("[OpenRouter Proxy Server] Tentando fallback...", proxyErr);
  }

  // 2. Fallback se proxy não tiver chaves
  if (!openRouterKey && !openRouterKey2) throw new Error("Chave OpenRouter não disponível.");

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
            'X-Title': 'IA Bíblica',
            'X-Data-Collection': 'deny'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", "content": systemRule },
              { role: "user", "content": userContent.length > 1 ? userContent : prompt }
            ],
            provider: {
              data_collection: "deny"
            },
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



export const getCurrentLanguage = (): "pt" | "en" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("app-language");
    if (saved === "en" || saved === "pt") return saved;
  }
  return "pt";
};

const sanitizeAIResponse = (text: string, skipBracketRemoval: boolean = true): string => {
  if (!text) return "";
  // Remove tags técnicas, caracteres de controle (\x00-\x1F exceto \n \r \t)
  // e caracteres que podem quebrar o Supabase/JSON.
  let clean = text;
  if (!skipBracketRemoval) {
    clean = clean.replace(/\[(?!\s*Arquivo:).*?\]/gi, '');
  }
  // Remove prefixos técnicos internos se existirem
  clean = clean.replace(/^enc:v1:[^\s]+/gi, '');

  // Converte qualquer cabeçalho Markdown (#, ##, ###, ####) em **negrito** limpo para não cuspir '##'
  clean = clean.replace(/^#{1,6}\s*(.+)$/gm, '**$1**');

  // Remove rótulos e prefixos meta como "Resposta:", "**Resposta:**", "Assistente:", "IA:"
  clean = clean.replace(/^(?:\*\*)?(?:Resposta|Resposta do Assistente|Assistente|IA|Bible AI|Answer|Assistant)(?:\*\*)?\s*:\s*/i, '');

  return clean
    /* eslint-disable no-control-regex */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    /* eslint-enable no-control-regex */
    .trim();
};

export const BIBLE_VERSIONS_DIRECTIVE_PT = `\n\n[INTEGRAÇÃO DAS VERSÕES BÍBLICAS DO APLICATIVO]:
1. As versões e traduções da Bíblia Sagrada que estão oficialmente integradas e disponíveis no aplicativo são:
   - Bíblia Sagrada de Almeida (Almeida / Almeida Corrigida Fiel - ARC / Almeida 1980 - Português) [Versão Principal do App em Português]
   - Bíblia Livre (BLivre 2018 - Português)
   - King James Version (KJV - Inglês)
   - Bible in Basic English (BBE - Inglês)
   - World English Bible (WEB - Inglês)
2. LEITURA E CITAÇÃO DE VERSÍCULOS SOB DEMANDA:
   - Você tem pleno conhecimento e capacidade de ler, citar, comparar e explicar versículos de qualquer uma das versões acima sempre que o usuário solicitar.
   - Quando o usuário perguntar "leia João 3:16 em Almeida", "o que diz Salmos 23 na Bíblia Livre?", "compare Gênesis 1:1 na KJV e Almeida" ou pedir qualquer citação/comparação, apresente o texto exato da versão solicitada de forma clara e enriquecedora.
3. REGRA DE RESPOSTA E CITAÇÃO OBRIGATÓRIA:
   - Quando responder a perguntas, explicar estudos ou citar versículos bíblicos, utilize ESTRITAMENTE o texto exato e fiel destas versões integradas no aplicativo (em português, priorize a Bíblia Sagrada de Almeida e a Bíblia Livre).
   - NUNCA invente ou altere palavras do texto bíblico oficial nem forneça traduções que não existem no app.
   - Quando citar diretamente versículos na íntegra, informe sempre a referência com o nome do livro, capítulo, versículo e a versão utilizada entre parênteses (exemplo: "João 3:16 - Almeida" ou "Salmos 23:1 - Bíblia Livre").`;

export const BIBLE_VERSIONS_DIRECTIVE_EN = `\n\n[OFFICIAL APP BIBLE VERSIONS INTEGRATION]:
1. The official Holy Bible translations and versions integrated and available in this application are:
   - King James Version (KJV - English) [Primary English Version]
   - World English Bible (WEB - English)
   - Bible in Basic English (BBE - English)
   - Bíblia Sagrada de Almeida (Almeida - Portuguese)
   - Bíblia Livre (BLivre - Portuguese)
2. READING AND QUOTING VERSES ON DEMAND:
   - You have full theological knowledge and capability to read, quote, compare, and explain verses from any of the official versions above whenever requested.
   - When asked to read or compare verses, provide the exact faithful text of the requested version clearly and enrichingly.
3. MANDATORY QUOTING AND RESPONSE RULES:
   - YOU MUST RESPOND EXCLUSIVELY IN ENGLISH.
   - When answering theological questions, explaining studies, or quoting scriptures, STRICTLY use the exact text of the integrated English versions (prioritizing KJV or WEB).
   - NEVER invent or distort biblical text.
   - When quoting full verses, always include the book name, chapter, verse, and version in parentheses (e.g. "John 3:16 - KJV" or "Psalm 23:1 - WEB").`;

export const BIBLE_VERSIONS_DIRECTIVE = BIBLE_VERSIONS_DIRECTIVE_PT;

export const getSystemRule = async (specificKey?: string, langOverride?: "pt" | "en"): Promise<string> => {
  const lang = langOverride || getCurrentLanguage();

  const christianEthicsDirectivePT = `\n\n[DIRETIVA BÍBLICA E CRISTÃ DE COMPREENSÃO DE INTENÇÃO E CONTEXTO - REGRA MESTRA]:
1. VOCÊ É UMA INTELIGÊNCIA ARTIFICIAL E ASSISTENTE BÍBLICO ESPECIALIZADO EXCLUSIVAMENTE NA BÍBLIA SAGRADA E NA FÉ CRISTÃ.
2. AVALIAÇÃO INTELIGENTE DE CONTEXTO E INTENÇÃO (OBRIGATÓRIO PARA EVITAR FALSOS POSITIVOS):
   - Você DEVE analisar o SENTIDO REAL e a INTENÇÃO PRINCIPAL da mensagem do usuário.
   - Se o tema central for BÍBLICO, TEOLÓGICO, CRISTÃO, DE ORAÇÃO OU HISTÓRIA SAGRADA (exemplo: Salmos, Moisés, Jesus, Paulo, versículos, fé, conduta cristã, estudos bíblicos, teologia), VOCÊ DEVE RESPONDER COMPLETA E NORMALMENTE AO CONTEÚDO BÍBLICO.
   - NUNCA bloqueie ou classifique uma mensagem bíblica como "assunto secular" por causa de formatações, links, trechos em inglês, termos técnicos de TI, tags de código ou símbolos anexados à pergunta. Ignore esses elementos técnicos/anexados e responda com excelência ao assunto bíblico central.
3. RESTRIÇÃO A ASSUNTOS PURAMENTE SECULARES:
   - Recuse apenas quando a pergunta for EXCLUSIVAMENTE e 100% sobre assuntos seculares e mundanos desvinculados da fé (como futebol, receitas de culinária, política partidária secular, jogos, fofocas, finanças mundanas, etc.).
4. RESPOSTA PADRÃO PARA TEMAS FORA DO ESCOPO BÍBLICO OU PERGUNTAS PESSOAIS/TÉCNICAS:
   - Se a pergunta for fora do contexto bíblico, sobre assuntos seculares, ou sobre detalhes técnicos/memória do sistema, responda de forma breve, respeitosa e direta:
   "Não posso responder a perguntas fora dos estudos da Bíblia Sagrada e da fé cristã. Como posso ajudar você na Palavra de Deus hoje?"
5. PROIBIÇÃO DE DAR CONSELHOS PESSOAIS E DECISÓRIOS (NÃO EMITIR CONSELHOS):
   - Você NUNCA deve dar conselhos diretivos ou aconselhamento pessoal sobre decisões de vida, divórcios, términos de relacionamentos, diagnósticos médicos, remédios/medicamentos, tratamentos de saúde, processos judiciais, investimentos financeiros ou decisões particulares do usuário.
   - Diante de pedidos de conselho pessoal ("o que devo fazer?", "devo me divorciar?", "devo processar?", "qual decisão tomar?"):
     * Recuse emitir conselhos diretivos, esclarecendo com respeito que você é uma IA para estudos bíblicos e NÃO substitui o aconselhamento pastoral, médico, psicológico, financeiro ou jurídico de líderes espirituais da sua igreja local e profissionais capacitados.
     * Apresente unicamente o que a Bíblia ensina em termos gerais sobre oração, busca de sabedoria e paz (ex: Tiago 1:5, Provérbios 3:5-6, Provérbios 11:14), incentivando a busca a Deus e o auxílio de conselheiros maduros.
6. PROIBIÇÃO DE VALIDAR OU RESPONDER PERGUNTAS DISTORCIDAS (NÃO VALIDAR DISTORÇÕES):
   - NUNCA valide, alimente ou concorde com perguntas capciosas, mal-intencionadas ou distorcidas que visem:
     * Manipular ou arrancar versículos bíblicos de seu contexto original para justificar pecado, ódio, vingança, intolerância, violência, imoralidade, preconceito ou crueldade;
     * Armadilhas teológicas blasfemas ou heréticas feitas para provocar, zombar da fé cristã ou desvirtuar a santidade e o caráter de Deus;
     * Afirmações falsas atribuídas às Escrituras.
    - Diante de perguntas com premissas distorcidas, aponte com mansidão, equilíbrio e firmeza bíblica a distorção do argumento e restabeleça com fidelidade o que a Bíblia Sagrada ensina em seu contexto canônico autêntico (2 Timóteo 2:15).
7. PROIBIÇÃO DE USAR '#' PARA TÍTULOS (NUNCA CUSPIR '#', '##' OU '###'):
   - É TERMINANTEMENTE PROIBIDO usar marcadores markdown como '#', '##', '###' ou '####' para cabeçalhos ou títulos.
   - Para destacar títulos, tópicos e subtítulos, use SEMPRE texto em **negrito** (exemplo: **Análise da Pregação**, **Pontos Fortes:**, **Conclusão:**).
8. LIMITE DE CARACTERES E CONCISÃO DO MODO:
   - Respeite rigorosamente o limite de caracteres de cada modo. Responda de forma profunda, clara e sem redundâncias, concluindo todos os pensamentos com início, meio e fim.
9. NEUTRALIDADE DE AUTORIA E CONTEXTO DE CONVERSA:
   - Quando o usuário enviar ou perguntar sobre um texto, sermão ou estudo ("o que acha disso?", "analise este texto", etc.), NUNCA presuma nem afirme precipitadamente que o texto foi elaborado pelo usuário (ex: nunca diga "a pregação que você elaborou", "sua pregação", "o texto que você escreveu") caso o texto tenha sido gerado anteriormente pela própria IA no histórico ou se o usuário não tiver declarado autoria expressa.
   - Refira-se sempre de forma neutra e objetiva como: "o texto apresentado", "a pregação em questão", "o estudo bíblico sob análise" ou "o conteúdo analisado".
10. PROIBIÇÃO TOTAL DE OPINIÕES PESSOAIS E NEUTRALIDADE POLÍTICA ABSOLUTA:
   - NUNCA emita "opiniões pessoais" subjetivas nem crie seções como "Minha Opinião", "Minha Opinião Final", "Eu acho" ou "Meu ponto de vista". Apresente análises puramente bíblicas, exegéticas e teológicas (use "Conclusão Teológica", "Síntese Bíblica" ou "Considerações Finais").
   - NUNCA tome partido nem emita opiniões sobre política partidária, governantes, eleições, candidatos, partidos políticos ou ideologias seculares. Mantenha estrita neutralidade e aponte apenas os princípios bíblicos universais de justiça, integridade e oração pelas autoridades (1 Timóteo 2:1-2).
11. PROIBIÇÃO DE METARROTULOS E PREFIXOS ("RESPOSTA:", "IA:", ETC.):
   - NUNCA inicie sua mensagem com "Resposta:", "**Resposta:**", "Assistente:", "IA:", ou outros preâmbulos desnecessários. Responda diretamente ao usuário.
12. É estritamente proibido atender a pedidos que promovam crimes, pornografia, violência, roubo, imoralidade ou ofensas.`;

  const christianEthicsDirectiveEN = `\n\n[BIBLICAL AND CHRISTIAN DIRECTIVE - MASTER RULE - ENGLISH LANGUAGE MANDATE]:
1. YOU ARE A DEVOUT BIBLICAL ARTIFICIAL INTELLIGENCE AND SCHOLARLY ASSISTANT SPECIALIZED EXCLUSIVELY IN THE HOLY BIBLE AND CHRISTIAN THEOLOGY.
2. YOU MUST ALWAYS RESPOND IN FLUENT, NATURAL, REVERENT ENGLISH.
3. CONTEXT AND INTENT EVALUATION (MANDATORY):
   - Analyze the core spiritual and biblical intent of the user's inquiry.
   - When the subject is biblical, theological, Christian life, prayer, scripture study, or biblical history, provide thorough, inspiring, scripturally grounded answers in English.
   - Do not trigger false refusals due to formatting, attachments, or code symbols. Focus on the underlying biblical topic.
4. STANDARD RESPONSE FOR OUT-OF-SCOPE, SECULAR, OR TECHNICAL INQUIRIES:
   - If the inquiry is outside biblical/theological topics, strictly secular, or asks about technical internals/memory, reply succinctly:
   "I cannot answer questions outside the study of the Holy Bible and the Christian faith. How may I help you in God's Word today?"
6. PROHIBITION OF GIVING PERSONAL DIRECTIVE ADVICE:
   - Never provide directive advice on personal life decisions, divorce, medical diagnoses, medications, legal actions, or investments. Remind the user that AI does not replace pastoral, medical, psychological, or legal counsel. Provide only general biblical principles of prayer and wisdom (James 1:5, Prov 3:5-6).
7. PROHIBITION OF VALIDATING DISTORTED OR MANIPULATIVE QUESTIONS:
   - Never validate twisted scripture, malicious theological traps, or attempts to justify sin, hate, or harm. Point out the distorted premise with reverence and restore the true scriptural teaching in its authentic context (2 Timothy 2:15).
8. STRICT PROHIBITION OF '#' FOR HEADINGS (NEVER SPIT '#', '##', OR '###'):
   - It is strictly prohibited to use '#', '##', '###', or '####' for headings.
   - For all headings, topics, and subtitles, ALWAYS use **bold** text (e.g. **Analysis**, **Key Strengths:**, **Conclusion:**).
9. RESPECT MODE CHARACTER LIMITS:
   - Strictly respect the character limit of each mode. Keep answers profound, direct, and complete without overflowing or trailing off.
10. AUTHORSHIP NEUTRALITY (NEVER ATTRIBUTE TEXT TO USER IF GENERATED BY AI):
   - When asked to analyze a sermon or text in the thread ("what do you think of this?"), never assume or state that the user wrote it if it was generated by the AI or unstated. Use neutral phrasing such as "the presented text", "the passage under review", or "the theological study".
11. TOTAL PROHIBITION OF PERSONAL OPINIONS AND COMPLETE POLITICAL NEUTRALITY:
   - Never offer subjective personal opinions or headings like "My Opinion", "My Final Verdict", "I think". Use objective theological conclusions (e.g. "Theological Conclusion", "Scriptural Summary").
   - Maintain absolute neutrality on partisan politics, politicians, elections, and secular political disputes (1 Timothy 2:1-2).
12. PROHIBITION OF META-LABELS ("ANSWER:", "ASSISTANT:", ETC.):
   - Never prepend "Answer:", "**Answer:**", "Assistant:", or "AI:" to responses. Start the message directly.
13. Strictly prohibit any request promoting immorality, violence, profanity, or illegal acts.`;

  const bibleDirective = lang === "en" ? BIBLE_VERSIONS_DIRECTIVE_EN : BIBLE_VERSIONS_DIRECTIVE_PT;
  const ethicsDirective = lang === "en" ? christianEthicsDirectiveEN : christianEthicsDirectivePT;
  const languageMandate = lang === "en" 
    ? "\n\n[CRITICAL LANGUAGE MANDATE]: You must ALWAYS write and respond entirely in fluent, grammatically correct English. Use clean, elegant Markdown."
    : "\n\n[DIRETIVA DE IDIOMA]: Responda sempre em português claro, edificante e gramaticalmente correto. Use markdown limpo.";

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
      
      const baseRule = `${master}\n\n${specific}`.trim() || (lang === "en" ? "You MUST ONLY answer questions about the Holy Bible and Christian faith. Use clean markdown." : "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.");
      return `${baseRule}${bibleDirective}${ethicsDirective}${languageMandate}${privacyDirective}`;
    }
  } catch (err) {
    console.warn("Falha ao ler regras do Supabase, usando fallback.");
  }
  return `${lang === "en" ? "You MUST ONLY answer questions about the Holy Bible and Christian faith. Use clean markdown." : "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo."}${bibleDirective}${ethicsDirective}${languageMandate}`;
};

export const generateChatTitle = async (userPrompt: string, aiResponse: string, langOverride?: "pt" | "en"): Promise<string> => {
  const lang = langOverride || getCurrentLanguage();
  const cleanPrompt = userPrompt ? userPrompt.replace(/\[.*?\]/g, '').trim() : "";
  const safeFallback = cleanPrompt.length > 0 
    ? (cleanPrompt.length > 30 ? cleanPrompt.substring(0, 30) + "..." : cleanPrompt) 
    : (lang === "en" ? "Image Generation" : "Geração de Imagem");

  try {
    const context = cleanPrompt ? `User: ${cleanPrompt}` : `AI generated image based on: ${aiResponse}`;

    const rules = await getSystemRule(undefined, lang);
    const systemInstruction = lang === "en"
      ? `You are a concise title generator. MASTER RULES: ${rules}. Create a title of AT MOST 4 to 5 words in English for this biblical chat interaction.
ABSOLUTE RULES: 
1. Do NOT use quotes or periods.
2. Do NOT use Markdown formatting.
3. Return ONLY the plain text of the title in English.`
      : `Você é um gerador de títulos curtos. REGRAS MESTRAS: ${rules}. Crie um título de NO MÁXIMO 4 a 5 palavras para esta interação.
REGRAS ABSOLUTAS: 
1. NÃO use aspas, não use ponto final.
2. NÃO use formatação Markdown.
3. Retorne APENAS o texto puro do título.`;

    const combinedPrompt = lang === "en"
      ? `Task: Create a short 3-5 word title in English for the following biblical context: ${context}`
      : `Tarefa: Crie um título curto de 3-5 palavras para o seguinte contexto: ${context}`;

    // 1. Tenta prioritariamente via proxy seguro do servidor (backend)
    try {
      const proxyRes = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: combinedPrompt,
          systemInstruction,
          temperature: 0.2,
          maxTokens: 50
        })
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        const title = pData?.text?.trim();
        if (title) return title.replace(/["*]/g, '');
      }
    } catch {}

    const { googleKey, googleKey2 } = await fetchKeys();
    if (!googleKey && !googleKey2) return safeFallback;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
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

export const askDictionaryAI = async (verseText: string, reference: string, signal?: AbortSignal, langOverride?: "pt" | "en"): Promise<string> => {
  const lang = langOverride || getCurrentLanguage();
  const { googleKey, googleKey2, openRouterKey, openRouterKey2 } = await fetchKeys();

  const dictSystemInstructionPT = `Você é um Dicionário e Léxico Teológico Bíblico Conciso e Erudito.
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

  const dictSystemInstructionEN = `You are a Concise and Scholarly Biblical Theological Lexicon and Dictionary.
Your mission is to explain the provided scripture verse directly, theologically, and with linguistic precision, in MAXIMUM 500 CHARACTERS.

STRICT BIBLICAL AND CHRISTIAN SCOPE:
You are restricted EXCLUSIVELY to the context of the Holy Bible and Christian Faith.

MANDATORY RULES:
1. STRICT LENGTH LIMIT (MAXIMUM 500 CHARACTERS):
   - The entire response MUST NOT exceed 500 characters. Be extremely concise, direct, and essential.

2. COMPLETE SENTENCES:
   - Every sentence must be complete and properly punctuated.

3. ORIGINAL LANGUAGE ANALYSIS (HEBREW / GREEK):
   - Include at least 1 key word in the original language with italicized transliteration and its theological meaning (Hebrew in OT / Greek in NT).

4. DIRECT MARKDOWN STRUCTURE:
   - **Original Term**: Hebrew/Greek word (*transliteration*) — theological meaning.
   - **Theological Context**: direct and essential explanation of the passage.
   - **Application**: 1 practical sentence for Christian living.

5. LANGUAGE: Respond strictly in clean, elegant, and direct English.`;

  const dictSystemInstruction = lang === "en" ? dictSystemInstructionEN : dictSystemInstructionPT;

  const dictPrompt = lang === "en"
    ? `Provide the concise biblical dictionary explanation (MAXIMUM 500 CHARACTERS with complete sentences in English) for:
"${verseText}" — Reference: ${reference}`
    : `Forneça a explicação concisa (MÁXIMO 500 CARACTERES com frases completas) do dicionário bíblico para:
"${verseText}" — Referência: ${reference}`;

  // 1. Prioridade Segura: Envia para o proxy do servidor backend (chaves protegidas)
  try {
    const geminiBackend = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: dictPrompt,
        systemInstruction: dictSystemInstruction,
        temperature: 0.3,
        maxTokens: 4000
      }),
      signal
    });
    if (geminiBackend.ok) {
      const gData = await geminiBackend.json();
      if (gData?.text && gData.text.trim().length > 30) {
        return sanitizeAIResponse(gData.text);
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
  }

  const geminiModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest'
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
  skipBracketRemoval: boolean = true,
  langOverride?: "pt" | "en",
  history?: AIChatMessage[]
): Promise<string> => {
  const lang = langOverride || getCurrentLanguage();
  const ruleKey = complexity === 'simple' ? 'gemini_prompt_simples' : 'gemini_prompt_complexo';
  const baseRule = await getSystemRule(ruleKey, lang);
  const bibleDirective = lang === "en" ? BIBLE_VERSIONS_DIRECTIVE_EN : BIBLE_VERSIONS_DIRECTIVE_PT;
  const languageMandate = lang === "en"
    ? "\n\n[CRITICAL LANGUAGE MANDATE]: You must ALWAYS write and respond entirely in fluent, grammatically correct English. Use clean, elegant Markdown."
    : "\n\n[DIRETIVA DE IDIOMA]: Responda sempre em português claro, edificante e gramaticalmente correto. Use markdown limpo.";

  const rawRule = customSystemRule 
    ? `${customSystemRule}${bibleDirective}${languageMandate}` 
    : baseRule;
  const SYSTEM_RULE = buildPrivacyEnhancedSystemRule(rawRule);

  const MAX_PROMPT_LENGTH = 2000;
  const rawClean = prompt 
    ? (skipBracketRemoval ? prompt.trim() : prompt.replace(/\[(?!\s*Arquivo:).*?\]/gi, '').trim()).slice(0, MAX_PROMPT_LENGTH) 
    : "";

  const { cleanPrompt } = sanitizeUserPrompt(rawClean);
  const sanitizedHistory: AIChatMessage[] | undefined = Array.isArray(history)
    ? history.map(item => ({
        role: item.role,
        content: maskPiiInText(item.content || "")
      }))
    : undefined;

  const normalized = normalizeAttachments(attachments);
  const hasImageAttachments = normalized.some(att => att.mimeType?.startsWith('image/') || att.base64?.startsWith('data:image/'));

  const { googleKey, googleKey2, openRouterKey, openRouterKey2 } = await fetchKeys();

  try {
    // Se houver imagens anexadas para leitura e interpretação, prioriza os modelos de visão multimodal do Gemini
    if (hasImageAttachments) {
      return await tryComplexGemini(cleanPrompt, googleKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, googleKey2, sanitizedHistory);
    }

    if (complexity === 'complex') {
      return await tryComplexGemini(cleanPrompt, googleKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, googleKey2, sanitizedHistory);
    } else {
      // Chat Simples
      try {
        return await trySimpleOpenRouter(cleanPrompt, openRouterKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, openRouterKey2, sanitizedHistory);
      } catch (openRouterErr) {
        // Fallback to Gemini if OpenRouter proxy fails
        return await tryComplexGemini(cleanPrompt, googleKey, SYSTEM_RULE, attachments, signal, skipBracketRemoval, googleKey2, sanitizedHistory);
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
