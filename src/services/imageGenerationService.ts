import { supabase } from '@/integrations/supabase/client';

export const generateBiblicalImage = async (
  userPrompt: string, 
  signal?: AbortSignal,
  aspectRatio: 'square' | 'story' | 'landscape' = 'square',
  returnRawUrl: boolean = false,
  source: 'chat' | 'create' = 'chat',
  isComplex: boolean = false
): Promise<string> => {
  // Limpar qualquer prefixo estrutural, tags de arquivos ou colchetes extras do prompt
  const cleanPrompt = userPrompt
    .replace(/\[Modo:[^\]]+\]/g, "")
    .replace(/\[Arquivo:[^\]]+\]/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[\r\n]+/g, " ") // REMOVER quebras de linha para evitar quebras em URLs e Markdowns
    .trim();

  // Chamar o proxy do backend para geração de imagem protegida pelo Sentinel e por token de autenticação
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    let response: Response | null = null;
    let isVercelOrFallbackNeeded = false;
    let fallbackErrorMessage: string | null = null;

    try {
      response = await fetch('/api/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: cleanPrompt,
          aspectRatio,
          source,
          isComplex
        }),
        signal
      });

      if (response.status === 405 || response.status === 404 || response.status === 502 || response.status === 504) {
        console.warn(`[Proxy] Servidor retornou código ${response.status}. Ativando fallback de geração do cliente.`);
        isVercelOrFallbackNeeded = true;
      } else if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMessage = errData?.error || `Status: ${response.status} ${response.statusText}`;
        throw new Error(errMessage);
      }
    } catch (fetchErr: any) {
      // Se for erro de quota (que já foi lançado acima com throw new Error), propaga ele
      if (fetchErr.message && (fetchErr.message.includes("atingiu") || fetchErr.message.includes("limite") || fetchErr.message.includes("Sessão inválida"))) {
        throw fetchErr;
      }
      console.warn("[Proxy] Falha de comunicação de rede com o servidor, ativando fallback do cliente:", fetchErr);
      isVercelOrFallbackNeeded = true;
      fallbackErrorMessage = fetchErr.message;
    }

    // fallback de geração local para Vercel (onde não há backend rodando Express) ou se o container estiver inacessível
    if (isVercelOrFallbackNeeded) {
      console.log("[Fallback Cliente] Executando pipeline completo de geração de imagem de forma segura no navegador...");
      
      // 1. Obter usuário e verificar cota diária localmente no Supabase se logado
      const { data: { user } } = await supabase.auth.getUser();
      const isCreateSource = source === 'create';
      const quotaType = isCreateSource ? 'create_image' : 'image';
      const quotaLimit = isCreateSource ? 3 : 5;

      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
          const { count, error: countError } = await supabase
            .from('user_ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('tipo_uso', quotaType)
            .gte('created_at', today.toISOString());

          if (!countError && count !== null && count >= quotaLimit) {
            const displayLimitMsg = isCreateSource 
              ? `Você atingiu o seu limite diário de ${quotaLimit} imagens no Modo Criar. Sua cota recarrega em 12 horas.`
              : `Você atingiu o seu limite diário de ${quotaLimit} imagens no Chat. Sua cota recarrega em 12 horas.`;
            throw new Error(displayLimitMsg);
          }
        } catch (dbErr: any) {
          console.warn("[Fallback Cliente] Erro ao verificar cota no Supabase:", dbErr);
          // Se for uma mensagem de limite estourado, propaga para o usuário
          if (dbErr.message && dbErr.message.includes("atingiu")) {
            throw dbErr;
          }
        }
      } else {
        throw new Error("Sessão inválida ou expirada. Por favor, faça login para gerar imagens.");
      }

      // 2. Moderação local e detecção de conteúdo impróprio ou fora do escopo
      const forbiddenTerms = [
        'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda', 'vagina', 'penis', 
        'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt', 'ass', 'hentai', 'safada', 'gostosa',
        'carro', 'celular', 'computador', 'smartphone', 'videogame', 'video game', 'anime', 'goku', 'naruto', 
        'futebol', 'soccer', 'disney', 'marvel', 'dc comics', 'batman', 'superman', 'boate', 'cerveja', 'vodka', 
        'uísque', 'whisky', 'rockstar', 'balada', 'danceteria', 'nave espacial', 'disco de vinil', 'alienígena'
      ];
      const lowercasePrompt = cleanPrompt.toLowerCase();
      const hasForbiddenTerm = forbiddenTerms.some(term => {
        const regex = new RegExp(`\\b${term}`, 'i');
        return regex.test(lowercasePrompt);
      });
      if (hasForbiddenTerm) {
        throw new Error("O pedido contém termos impróprios ou fora do contexto bíblico permitido.");
      }

      // 3. Obter chaves do Gemini do Supabase para tradução/refinamento local
      let googleKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
      let googleKey2 = (import.meta.env.VITE_GEMINI_API_KEY_2 || "").trim();
      let systemPromptMaster = "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";

      try {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('config_key, config_value')
          .in('config_key', ['google_ai_key', 'google_ai_key_2', 'system_prompt_master']);
          
        if (!error && data) {
          const dbGoogle = data.find(d => d.config_key === 'google_ai_key')?.config_value;
          const dbGoogle2 = data.find(d => d.config_key === 'google_ai_key_2')?.config_value;
          const dbMaster = data.find(d => d.config_key === 'system_prompt_master')?.config_value;
          if (dbGoogle && dbGoogle.trim()) googleKey = dbGoogle.trim();
          if (dbGoogle2 && dbGoogle2.trim()) googleKey2 = dbGoogle2.trim();
          if (dbMaster && dbMaster.trim()) systemPromptMaster = dbMaster.trim();
        }
      } catch (err) {
        console.warn("[Fallback Cliente] Erro de rede ao buscar chaves no banco:", err);
      }

      let enhancedPrompt = cleanPrompt;
      let isBlocked = false;

      const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];
      let promptGenerated = false;

      if (keysToTry.length > 0) {
        const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

Você é um Diretor de Arte de imagens bíblicas e Moderador de Conteúdo extremamente rigoroso.

REGRA 1 (Nudez e Conteúdo Impróprio): Verifique se o pedido contém qualquer menção direta ou indireta a nudez total ou parcial, sensualidade, erotismo, posições vulgares ou qualquer conteúdo impróprio/adulto. Se violar esta regra, responda EXATAMENTE: "BLOQUEADO".

REGRA 2 (Filtro Bíblico / Cristão Estrito): Verifique se o pedido é estritamente sobre temas, passagens, cenários, profecias ou personagens descritos na Bíblia Sagrada ou relacionados à história cristã. Se for sobre qualquer assunto secular, moderno (tecnologia moderna, ficção científica, carros, robôs, etc.), super-heróis, outras crenças, esportes modernos, etc., responda EXATAMENTE: "BLOQUEADO".

REGRA 3 (Estilo Super Realista): O usuário exige imagens extremamente realistas de acordo com o pedido. Portanto, se o pedido for aprovado, traduza-o para o INGLÊS e adicione tags avançadas de ultra-realismo fotográfico, por exemplo: "ultra-realistic photo, high-end hyperrealistic human features, detailed skin texture, real eyes, historically accurate clothing, cinematic lighting, 8k resolution, masterpiece". EVITE termos de cartoon, anime, desenho ou 3D irrealista.

REGRA 4 (Saída): Responda APENAS com o prompt purificado em inglês enriquecido para ultra-realismo, sem aspas, preâmbulos, notas ou explicações adicionais. Se for inadequado, responda APENAS: "BLOQUEADO".`;

        for (const key of keysToTry) {
          if (promptGenerated) break;
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ parts: [{ text: `Pedido: ${cleanPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
              }),
              signal
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                let trimmedText = text.trim();
                if (trimmedText.startsWith('"') && trimmedText.endsWith('"')) {
                  trimmedText = trimmedText.slice(1, -1).trim();
                }
                if (trimmedText.startsWith("'") && trimmedText.endsWith("'")) {
                  trimmedText = trimmedText.slice(1, -1).trim();
                }
                trimmedText = trimmedText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
                trimmedText = trimmedText.replace(/^(here is your prompt|prompt|translation|here is a prompt for your image|gerar imagem de|imagem de|desenhar)\s*:\s*/i, '');

                if (trimmedText.toUpperCase().includes("BLOQUEADO")) {
                  isBlocked = true;
                } else {
                  enhancedPrompt = trimmedText;
                }
                promptGenerated = true;
                break;
              }
            }
          } catch (geminiErr: any) {
            console.warn(`[Fallback Cliente] Falha no refinamento do prompt local:`, geminiErr);
          }
        }
      }

      if (isBlocked) {
        throw new Error("Apenas imagens de temas bíblicos/cristãos são permitidas e sem conteúdo impróprio.");
      }

      const qualityTags = "ultra-realistic portrait photography, hyperrealism, 8k resolution, highly detailed, real human features, historical accuracy, masterpieces, cinematic composition";
      const finalPrompt = `${enhancedPrompt}, ${qualityTags}`;

      let width = 1024;
      let height = 1024;
      if (aspectRatio === 'story') {
        width = 576;
        height = 1024;
      } else if (aspectRatio === 'landscape') {
        width = 1024;
        height = 576;
      }

      const seed = Math.floor(Math.random() * 2000000000);
      const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=false`;

      // 4. Registrar consumo de cota diária localmente no Supabase se logado e com sucesso
      if (user) {
        try {
          await supabase
            .from('user_ai_usage')
            .insert({
              user_id: user.id,
              tipo_uso: quotaType,
              created_at: new Date().toISOString()
            });
          console.log(`[Fallback Cliente] Cota de IA debitada localmente com sucesso para o usuário ${user.id}`);
        } catch (insertErr) {
          console.error("[Fallback Cliente] Erro ao gravar uso local no Supabase:", insertErr);
        }
      }

      // 5. Baixar e converter imagem para base64 ou retornar URL direta
      try {
        const base64Bytes = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const timer = setTimeout(() => {
            img.src = "";
            reject(new Error("O tempo limite para gerar e carregar a imagem no navegador expirou (Timeout)."));
          }, 50000);

          img.onload = () => {
            clearTimeout(timer);
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Não foi possível obter o contexto 2D para renderização local."));
                return;
              }
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/jpeg", 0.95));
            } catch (canvasErr: any) {
              reject(canvasErr);
            }
          };

          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error("Falha ao baixar os bytes da imagem. O serviço pode estar temporariamente congestionado."));
          };

          img.src = pollinationsUrl;
        });

        if (returnRawUrl) {
          return base64Bytes;
        }
        return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${base64Bytes})`;
      } catch (clientErr: any) {
        console.warn("[Fallback Cliente] Falha ao converter imagem para base64 local, aplicando fallback com link direto:", clientErr);
        if (returnRawUrl) {
          return pollinationsUrl;
        }
        return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${pollinationsUrl})`;
      }
    }

    // Se a requisição do backend funcionou normalmente, processar a resposta padrão
    if (!response) {
      throw new Error("Não foi possível obter uma resposta do serviço de imagens.");
    }

    const data = await response.json();
    const pollinationsUrl = data.pollinationsUrl;
    const base64Image = data.base64Image;

    if (!pollinationsUrl) {
      throw new Error("O servidor não retornou uma URL de imagem válida.");
    }

    // Se o backend já retornou a imagem convertida em Base64, use-a imediatamente
    if (base64Image) {
      if (returnRawUrl) {
        return base64Image;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${base64Image})`;
    }

    try {
      // Baixar e converter a imagem usando a API de Imagens do navegador para contornar restrições de CORS em fetch diretor e limites de IP
      const base64Bytes = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Timeout de segurança para evitar carregamentos travados
        const timer = setTimeout(() => {
          img.src = "";
          reject(new Error("O tempo limite para gerar e carregar a imagem no navegador expirou (Timeout)."));
        }, 50000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Não foi possível obter o contexto 2D para renderização local."));
              return;
            }
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            resolve(dataUrl);
          } catch (canvasErr: any) {
            reject(new Error(`Erro ao renderizar imagem localmente: ${canvasErr.message}`));
          }
        };

        img.onerror = () => {
          clearTimeout(timer);
          reject(new Error("Falha ao baixar os bytes da imagem. O serviço pode estar temporariamente congestionado."));
        };

        img.src = pollinationsUrl;
      });

      if (returnRawUrl) {
        return base64Bytes;
      }

      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${base64Bytes})`;
    } catch (fetchErr: any) {
      console.warn("Falha ao converter imagem gerada para base64 local, aplicando fallback com link direto:", fetchErr);
      if (returnRawUrl) {
        return pollinationsUrl;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${pollinationsUrl})`;
    }
  } catch (error: any) {
    console.error("Falha ao gerar imagem:", error);
    throw new Error(error.message || "Erro de comunicação ao acionar o serviço de imagens.");
  }
};
