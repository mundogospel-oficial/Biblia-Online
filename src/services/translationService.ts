import { checkAndIncrementUsage } from './usageService';
import { getSystemRule, fetchKeys } from './aiService';

export interface VerseToTranslate {
  verse: number;
  text: string;
}

export interface TranslatedVerse {
  verse: number;
  text: string;
}

export const checkAndIncrementQuota = async (userId: string): Promise<{ success: boolean; error?: string; remaining?: number }> => {
  try {
    const hasQuota = await checkAndIncrementUsage('translation');
    if (!hasQuota) {
      return { success: false, error: "Limite diário de traduções atingido." };
    }
    return { success: true };
  } catch (error) {
    console.error("Erro ao gerenciar cota:", error);
    return { success: false, error: "Erro ao verificar limite diário" };
  }
};

export const translateVersesAI = async (
  verses: VerseToTranslate[],
  targetLang: 'en' | 'pt',
  signal?: AbortSignal
): Promise<TranslatedVerse[]> => {
  const { openRouterKey, openRouterKey2 } = await fetchKeys();
  const openRouterKeys = [openRouterKey, openRouterKey2, import.meta.env.VITE_OPENROUTER_API_KEY].filter(Boolean) as string[];

  if (openRouterKeys.length === 0) {
    throw new Error("Chave OpenRouter não configurada para tradução.");
  }

  const sourceLang = targetLang === 'en' ? 'Português' : 'Inglês';
  const languageName = targetLang === 'en' ? 'Inglês' : 'Português';

  const systemRule = await getSystemRule();

  const prompt = `REGRAS MESTRAS: ${systemRule}

Você é um tradutor bíblico de altíssima precisão. Traduza do ${sourceLang} para o ${languageName}.
Diretrizes:
- Use linguagem bíblica fluida e erudita (Almeida no PT, KJV/NIV no EN).
- Mantenha a numeração exata dos versículos.
- NÃO adicione notas, comentários ou explicações extra.
- Responda estritamente no formato JSON solicitado.

Formato de resposta JSON:
{
  "translations": [
    { "verse": número, "text": "texto traduzido" }
  ]
}

Versículos para traduzir:
${verses.map(v => `${v.verse}: ${v.text}`).join('\n')}`;

  const freeModels = [
    "deepseek/deepseek-chat",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "openrouter/free"
  ];

  let lastError = "Não foi possível conectar ao serviço OpenRouter de tradução.";

  for (const routerKey of openRouterKeys) {
    for (const model of freeModels) {
      try {
        if (!navigator.onLine) throw new Error("Sem conexão com a internet.");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${routerKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Biblia Online Translation'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "Você é um tradutor especializado em textos bíblicos. Retorne apenas JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          }),
          signal
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const cleanContent = content.replace(/```json\n?|```/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            if (parsed && Array.isArray(parsed.translations)) {
              return parsed.translations;
            }
          }
        } else {
          const errorData = await response.json().catch(() => null);
          lastError = errorData?.error?.message || `Status HTTP: ${response.status}`;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        lastError = err.message;
        console.warn(`[Tradução OpenRouter - ${model}] falhou:`, err.message);
      }
    }
  }

  throw new Error(`Erro na tradução: ${lastError}`);
};

