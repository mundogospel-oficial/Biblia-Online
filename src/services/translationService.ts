import { supabase } from '@/integrations/supabase/client';
import { checkAndIncrementUsage } from './usageService';

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
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!openRouterKey) throw new Error("Chave VITE_OPENROUTER_API_KEY não configurada.");

  const freeModels = [
    "deepseek/deepseek-chat",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-8b:free",
    "openrouter/free"
  ];

  const sourceLang = targetLang === 'en' ? 'Português' : 'Inglês';
  const languageName = targetLang === 'en' ? 'Inglês' : 'Português';
  
  const prompt = `Você é um tradutor bíblico especializado. Sua missão é traduzir versículos do ${sourceLang} para o ${languageName}.
Diretrizes:
- Use uma linguagem reverente e erudita (Almeida no PT, KJV/NIV no EN).
- Mantenha a numeração original dos versículos.
- NÃO adicione justificativas, comentários ou explicações.
- Responda apenas com o JSON solicitado.

Formato esperado:
{
  "translations": [
    { "verse": número, "text": "tradução aqui" }
  ]
}

Versículos para traduzir:
${verses.map(v => `${v.verse}: ${v.text}`).join('\n')}`;

  let lastError = "";

  for (const model of freeModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Bíblia Online Translation'
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `Status HTTP: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      
      if (content) {
        try {
          // Remover possíveis blocos de código markdown se o modelo ignorar o system prompt
          const cleanContent = content.replace(/```json\n?|```/g, '').trim();
          const parsed = JSON.parse(cleanContent);
          if (parsed && Array.isArray(parsed.translations)) {
            return parsed.translations;
          }
        } catch (parseError) {
          console.warn(`Erro ao processar JSON do modelo ${model}:`, parseError);
          lastError = "JSON inválido retornado pelo modelo";
          continue; // Tenta o próximo modelo
        }
      }
    } catch (error: any) {
      console.warn(`Modelo ${model} falhou na tradução:`, error.message);
      lastError = error.message;
      if (error.name === 'AbortError') throw error;
    }
  }
  
  throw new Error(`Falha em todos os modelos de tradução. Detalhe: ${lastError}`);
};
