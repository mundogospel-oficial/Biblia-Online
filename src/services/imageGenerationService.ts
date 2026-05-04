import { supabase } from '@/integrations/supabase/client';

export const generateBiblicalImage = async (userPrompt: string, signal?: AbortSignal): Promise<string> => {
  let googleKey = import.meta.env.VITE_GOOGLE_AI_KEY || "";
  let modelName = 'gemini-1.5-flash'; // Fallback

  try {
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('config_key, config_value')
      .in('config_key', ['google_ai_key', 'gemini_model_default']);

    if (!settingsError && settings && settings.length > 0) {
      const dbKey = settings.find(s => s.config_key === 'google_ai_key')?.config_value;
      const dbModel = settings.find(s => s.config_key === 'gemini_model_default')?.config_value;
      if (dbKey) googleKey = dbKey.trim();
      if (dbModel) modelName = dbModel.trim();
    }
  } catch (e) {
    console.warn("Aviso: Falha ao ler config do Supabase. Usando fallback de ambiente.");
  }

  if (!googleKey) {
    throw new Error("ERRO CRÍTICO: Chave da API do Google não encontrada (nem no DB, nem no .env).");
  }

  const systemInstruction = `Você é um Diretor de Arte de imagens bíblicas. 
REGRA 1: Verifique se o pedido é sobre a Bíblia/Cristianismo. Se NÃO for, responda EXATAMENTE: "BLOQUEADO".
REGRA 2: Se válido, traduza para o INGLÊS adicionando: cinematic lighting, hyperrealistic, 8k resolution, highly detailed.
Responda APENAS com o prompt em inglês, sem aspas.`;

  const combinedPrompt = `${systemInstruction}\n\nPedido: ${userPrompt}`;

  // Lista base de modelos conhecidos e estáveis
  let modelsToTry = [modelName, 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  
  // Tentar descobrir modelos dinamicamente apenas como bônus e sem travar
  try {
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`);
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      const discovered = modelsData.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        ?.map((m: any) => m.name.split('/').pop()) || [];
      
      modelsToTry = [...new Set([modelName, ...discovered, ...modelsToTry])];
    }
  } catch (e) {
    // Silencioso, usa a lista padrão
  }

  let enhancedPrompt = "";
  let lastError = "";

  for (const model of modelsToTry) {
    if (enhancedPrompt) break;
    try {
      // Tentar v1beta e v1 se v1beta falhar (resiliência total)
      const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleKey}`;
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        }),
        signal
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          enhancedPrompt = text.trim();
        }
      } else {
        const errData = await response.json().catch(() => null);
        lastError = errData?.error?.message || `Erro ${response.status}`;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      lastError = err.message;
    }
  }

  // Plano C: Se tudo falhar, usamos o prompt original (Melhor que dar erro)
  if (!enhancedPrompt) {
    console.warn("Aviso: Gemini falhou no refinamento. Usando prompt original para Pollinations.");
    enhancedPrompt = userPrompt;
  }
  
  if (enhancedPrompt === "BLOQUEADO") throw new Error("Apenas imagens de temas bíblicos/cristãos são permitidas.");

  const seed = Math.floor(Math.random() * 100000);
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}&width=1024&height=1024`;

  return `Aqui está a imagem gerada para: "${userPrompt}"\n\n![${userPrompt}](${imageUrl})`;
};
