/**
 * ============================================================================
 * MODO CRIAR - SERVIÇO EXCLUSIVO E DEDICADO COM POLLINATIONS IA (FLUX)
 * ============================================================================
 * Este arquivo é 100% EXCLUSIVO do MODO CRIAR (Cartões de Versículos).
 * 
 * DIRETRIZ PERMANENTE:
 * - A Pollinations IA é usada APENAS E EXCLUSIVAMENTE para o Modo Criar.
 * - NENHUMA outra IA de imagens (ex: IA do Chat) deve interferir
 *   ou alterar o Modo Criar.
 * - Ao alterar ou configurar qualquer outra IA de imagens do app, DEIXAR ESTE
 *   MODO CRIAR INTACTO.
 * ============================================================================
 */

import { supabase } from '@/integrations/supabase/client';
import { resolveBiblicalSituationSubject } from '@/data/biblicalSituations';
import { validateImagePrompt } from './imageModerationService';

export interface CreateModeImageOptions {
  signal?: AbortSignal;
  aspectRatio?: 'square' | 'story' | 'landscape';
  returnRawUrl?: boolean;
  isComplex?: boolean;
}

/**
 * Gera imagem bíblica exclusivamente para o Modo Criar usando Pollinations IA (Flux).
 * Totalmente isolada de qualquer outro motor de imagens.
 */
export const generateCreateModeImage = async (
  userPrompt: string,
  options: CreateModeImageOptions = {}
): Promise<string> => {
  const {
    signal,
    aspectRatio = 'square',
    returnRawUrl = true,
    isComplex = true
  } = options;

  // Limpar tags internas preservando o estilo escolhido
  const cleanPrompt = userPrompt
    .replace(/\[Modo:[^\]]+\]/g, "")
    .replace(/\[Arquivo:[^\]]+\]/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim();

  const displayPrompt = cleanPrompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim() || cleanPrompt;

  // Verificação rápida de segurança e escopo bíblico (Filtros Combinados)
  const security = await validateImagePrompt(cleanPrompt, 'create');
  if (security.isBlocked || !security.isAppropriate) {
    const blockedError = new Error(security.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico.");
    (blockedError as any).isServerError = true;
    throw blockedError;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    let response: Response | null = null;
    let isFallbackNeeded = false;

    // 1. Tentar gerar no endpoint backend exclusivo do Modo Criar
    try {
      response = await fetch('/api/create-mode/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: cleanPrompt,
          aspectRatio,
          source: 'create',
          isComplex
        }),
        signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMessage = errData?.error || errData?.message;

        // Se for erro de validação (400) ou limite de cota (429), lança o erro diretamente
        if (response.status === 400 || response.status === 429) {
          const serverError = new Error(errMessage || "A solicitação de imagem do Modo Criar foi recusada.");
          (serverError as any).isServerError = true;
          throw serverError;
        }

        console.warn(`[Modo Criar] Backend retornou HTTP ${response.status}. Ativando fallback direto de Pollinations no cliente.`);
        isFallbackNeeded = true;
      }
    } catch (fetchErr: any) {
      if (fetchErr.isServerError) {
        throw fetchErr;
      }
      console.warn("[Modo Criar] Falha de rede com o backend, ativando fallback direto de Pollinations no cliente:", fetchErr);
      isFallbackNeeded = true;
    }

    // 2. Fallback de cliente exclusivo do Modo Criar (Pollinations IA) para Vercel ou falhas de rede
    if (isFallbackNeeded) {
      console.log("[Modo Criar - Fallback] Gerando diretamente via Pollinations IA no navegador...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sessão inválida ou expirada. Por favor, faça login para gerar imagens no Modo Criar.");
      }

      // Verificação de cota local de 12h
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tipo_uso', 'create_image')
        .gte('created_at', twelveHoursAgo);

      if (!countError && count !== null && count >= 3) {
        throw new Error("Você atingiu o seu limite diário de 3 imagens no Modo Criar. Sua cota recarrega em 12 horas.");
      }

      // Extração de estilo
      let extractedStyle = "";
      const styleMatch = cleanPrompt.match(/\[Estilo:\s*([^\]]+)\]/i);
      if (styleMatch && styleMatch[1]) {
        let styleAddon = styleMatch[1];
        if (styleAddon.includes("-")) {
          styleAddon = styleAddon.split("-").slice(1).join("-").trim();
        }
        extractedStyle = styleAddon;
      }

      // Otimização de assunto bíblico
      let cleanSubject = cleanPrompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim();
      const situationMatch = resolveBiblicalSituationSubject(cleanPrompt);
      if (situationMatch) {
        cleanSubject = situationMatch.englishSubject;
      }

      // Limpar termos de pessoas e estátuas do Modo Criar (Modo Criar é terminantemente proibido humanos e estátuas/esculturas, foca em cenários e paisagens sagradas)
      cleanSubject = cleanSubject
        .replace(/\b(facing the camera|direct eye contact|looking directly into the camera|noble reverent serene Semitic facial features|facial features|modest sacred ancient biblical pure unbleached linen garments|garments|linen|attire|natural skin textures|anatomically correct hands|5 fingers|natural eye symmetry)\b/gi, '')
        .replace(/\b(homem|homens|mulher|mulheres|pessoa|pessoas|gente|criança|crianças|bebê|bebês|menino|menina|pastor|pastores|profeta|profetas|apóstolo|apóstolos|discípulo|discípulos|multidão|multidões|rosto|rostos|face|faces|silhueta|silhuetas|figura\s+humana|figuras\s+humanas|figura|figuras|man|men|woman|women|person|people|child|children|baby|human|humans|shepherd|prophet|apostle|disciple|crowd|multitude|face|faces|silhouette|silhouettes|figure|figures|pedestrian|pedestrians|portrait|portraits)\b/gi, '')
        .replace(/\b(estátua\s+grega|estátuas\s+gregas|estatua\s+grega|estatuas\s+gregas|estátua\s+romana|estátuas\s+romanas|estatua\s+romana|estatuas\s+romanas|estátua|estátuas|estatua|estatuas|escultura|esculturas|busto|bustos|mármore|marmore|ídolo|ídolos|idolo|idolos|monumento\s+de\s+pedra|estatueta|estatuetas|statue|statues|greek\s+statue|greek\s+statues|roman\s+statue|roman\s+statues|sculpture|sculptures|bust|busts|marble\s+statue|marble\s+statues|marble\s+sculpture|marble\s+sculptures|stone\s+statue|stone\s+statues|stone\s+figure|stone\s+figures|classical\s+statue|classical\s+sculpture|ancient\s+greek|ancient\s+roman|idol|idols|pagan\s+statue|pagan\s+statues)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanSubject || cleanSubject.length < 3) {
        cleanSubject = "majestic tranquil sacred biblical landscape, holy nature and celestial light";
      }

      let finalPrompt = `${cleanSubject}, majestic biblical landscape, sacred natural scenery, peaceful empty environment, solitary landscape view, untouched nature, no people, no humans, no man, no woman, no child, no human figures, no silhouettes, no faces, no hands, no statues, no greek statues, no roman statues, no sculptures, no marble statues, no busts, no stone idols, no carved figures, completely devoid of humans and statues, unpopulated scenic view, completely textless, clean image, no text, no words, no letters, no logos, no watermark, no typography, no writing, no labels, no title, no subtitles`;

      if (extractedStyle) {
        finalPrompt += `, ${extractedStyle}`;
      }

      finalPrompt = finalPrompt
        .replace(/\b(ultra-high definition|ultra high definition|tack-sharp focus|tack-sharp|extreme zoom clarity|zoom clarity|intricate textures|8k uhd resolution|8k resolution|8k|uhd|full bleed edge-to-edge shot|full bleed|no black bars|no letterbox|masterwork quality)\b/gi, '')
        .replace(/,\s*,+/g, ',')
        .replace(/^\s*,\s*|\s*,\s*$/g, '')
        .trim();

      let width = 1440;
      let height = 1440;
      if (aspectRatio === 'story') {
        width = 1080;
        height = 1920;
      } else if (aspectRatio === 'landscape') {
        width = 1920;
        height = 1080;
      }

      const clientNegativePrompt = "people, humans, human, person, man, woman, child, boy, girl, baby, face, silhouette, crowd, pedestrians, figures, human body, hands, arms, legs, portraits, characters, model, photo of person, statue, statues, greek statue, greek statues, roman statue, roman statues, marble statue, marble statues, sculpture, sculptures, bust, busts, stone idol, idols, carved figure, stone carving, monument of human, classical sculpture, ancient greek statue, roman sculpture, figurine, mannequin, idol worship, pagan statue, text, words, letters, typography, font, watermark, signature, username, title, caption, subtitles, writing, label, banner, logo, watermark text, fake words, gibberish text, script, latin words, quote, nudity, naked, nude, topless, bare breasts, bare shoulders, cleavage, unclothed, sensual, revealing clothes, erotic";
      const seed = Math.floor(Math.random() * 2000000000);
      const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&nofeed=true&enhance=false&negative=${encodeURIComponent(clientNegativePrompt)}`;

      console.log("[Modo Criar - Pollinations Local URL]:", pollinationsUrl);

      // Registrar cota no Supabase
      try {
        await supabase
          .from('user_ai_usage')
          .insert({
            user_id: user.id,
            tipo_uso: 'create_image',
            created_at: new Date().toISOString()
          });
      } catch (insertErr) {
        console.warn("[Modo Criar] Erro ao gravar uso local no Supabase:", insertErr);
      }

      // Converter para Base64 no cliente
      try {
        const base64Bytes = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const timer = setTimeout(() => {
            img.src = "";
            reject(new Error("O tempo limite para gerar e carregar a imagem expirou."));
          }, 50000);

          img.onload = () => {
            clearTimeout(timer);
            try {
              const rawW = img.naturalWidth || img.width;
              const rawH = img.naturalHeight || img.height;
              // Remove a faixa inferior onde o Pollinations insere sua marca d'água (últimos 4% da altura)
              const cropBottomPixels = Math.round(rawH * 0.045);
              const cleanH = rawH - cropBottomPixels;

              const canvas = document.createElement("canvas");
              canvas.width = rawW;
              canvas.height = cleanH;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Falha ao obter contexto de renderização."));
                return;
              }
              // Desenha cortando os pixels da marca d'água do rodapé
              ctx.drawImage(img, 0, 0, rawW, cleanH, 0, 0, rawW, cleanH);
              resolve(canvas.toDataURL("image/jpeg", 0.95));
            } catch (canvasErr) {
              reject(canvasErr);
            }
          };

          img.onerror = () => {
            clearTimeout(timer);
            reject(new Error("Falha ao baixar os bytes da imagem do Pollinations."));
          };

          img.src = pollinationsUrl;
        });

        return base64Bytes;
      } catch (convErr) {
        console.warn("[Modo Criar] Retornando URL direta do Pollinations:", convErr);
        return pollinationsUrl;
      }
    }

    if (!response) {
      throw new Error("Não foi possível conectar ao serviço de imagens do Modo Criar.");
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      throw new Error("Não foi possível processar a resposta do servidor de imagens.");
    }
    const pollinationsUrl = data.pollinationsUrl;
    const base64Image = data.base64Image || data.imageUrl;

    if (base64Image) {
      if (returnRawUrl) return base64Image;
      return `![${displayPrompt}](${base64Image})`;
    }

    if (!pollinationsUrl) {
      throw new Error("O servidor do Modo Criar não retornou uma imagem válida.");
    }

    // Baixar e converter a URL do Pollinations em base64 no canvas do navegador
    try {
      const base64Bytes = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timer = setTimeout(() => {
          img.src = "";
          reject(new Error("O tempo limite para carregar a imagem expirou."));
        }, 50000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const rawW = img.naturalWidth || img.width;
            const rawH = img.naturalHeight || img.height;
            // Remove a faixa inferior onde o Pollinations insere sua marca d'água (últimos 4.5% da altura)
            const cropBottomPixels = Math.round(rawH * 0.045);
            const cleanH = rawH - cropBottomPixels;

            const canvas = document.createElement("canvas");
            canvas.width = rawW;
            canvas.height = cleanH;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Erro ao criar canvas"));
              return;
            }
            ctx.drawImage(img, 0, 0, rawW, cleanH, 0, 0, rawW, cleanH);
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

      if (returnRawUrl) return base64Bytes;
      return `![${displayPrompt}](${base64Bytes})`;
    } catch {
      if (returnRawUrl) return pollinationsUrl;
      return `![${displayPrompt}](${pollinationsUrl})`;
    }
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError' || signal?.aborted || error?.message?.toLowerCase().includes('abort');
    if (isAbort) {
      const abortError = new Error("Geração interrompida.");
      abortError.name = "AbortError";
      throw abortError;
    }
    console.error("[Modo Criar - Erro ao gerar imagem]:", error);
    const msg = error.message || "Erro ao acionar o serviço do Modo Criar.";
    if (msg.includes("Failed to fetch") || msg.includes("fetch failed") || msg.includes("NetworkError")) {
      throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    throw new Error(msg);
  }
};
