import { supabase } from '@/integrations/supabase/client';
import { refundUsage } from './usageService';
import { APP_WHITE_LOGO_DATA_URL } from '@/assets/appLogoWhite';

// Singleton cache para a logo do aplicativo em branco
let watermarkLogoCache: HTMLImageElement | null = null;
const getWatermarkLogo = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (watermarkLogoCache && watermarkLogoCache.complete && watermarkLogoCache.naturalWidth) {
      resolve(watermarkLogoCache);
      return;
    }
    const img = new Image();
    img.onload = () => {
      watermarkLogoCache = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = APP_WHITE_LOGO_DATA_URL;
  });
};

/**
 * Desenha a marca d'água permanente do app (logo branca com transparência e sombra)
 * diretamente no canvas da imagem gerada, tornando impossível removê-la ou burlar.
 */
export const drawWatermarkOnCanvas = (
  ctx: CanvasRenderingContext2D, 
  canvasWidth: number, 
  canvasHeight: number, 
  logoImg?: HTMLImageElement | null
) => {
  try {
    const watermarkImg = logoImg || watermarkLogoCache;
    if (!watermarkImg || !watermarkImg.complete || !watermarkImg.naturalWidth) return;

    const w = canvasWidth;
    const h = canvasHeight;

    // Calcular tamanho proporcional da marca d'água (~6.5% da altura da imagem, mínimo de 32px)
    const watermarkHeight = Math.max(32, Math.round(h * 0.065));
    const aspect = (watermarkImg.naturalWidth || 200) / (watermarkImg.naturalHeight || 200);
    const watermarkWidth = Math.round(watermarkHeight * aspect);

    // Margens do canto inferior direito (~3.5% do tamanho da imagem)
    const paddingRight = Math.max(12, Math.round(w * 0.035));
    const paddingBottom = Math.max(12, Math.round(h * 0.035));

    const x = w - watermarkWidth - paddingRight;
    const y = h - watermarkHeight - paddingBottom;

    ctx.save();
    ctx.globalAlpha = 0.50; // 50% de opacidade (estilo idêntico ao Modo Criar)
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = Math.round(watermarkHeight * 0.15);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
    ctx.restore();
  } catch (err) {
    console.warn("[Watermark] Erro ao desenhar marca d'água no canvas:", err);
  }
};

/**
 * Garante que qualquer imagem (data URL ou HTTP) receba a marca d'água carimbada no canvas em base64
 */
export const ensureWatermarkedImage = async (imageUrl: string): Promise<string> => {
  if (!imageUrl) return imageUrl;

  try {
    const logoImg = await getWatermarkLogo();
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const timeout = setTimeout(() => {
        resolve(imageUrl);
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 1024;
          canvas.height = img.naturalHeight || img.height || 1024;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imageUrl);
            return;
          }
          ctx.drawImage(img, 0, 0);
          drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        } catch (canvasErr) {
          console.warn("[Watermark] Falha ao gravar no canvas:", canvasErr);
          resolve(imageUrl);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(imageUrl);
      };

      img.src = imageUrl;
    });
  } catch {
    return imageUrl;
  }
};

export const generateBiblicalImage = async (
  userPrompt: string, 
  signal?: AbortSignal,
  aspectRatio: 'square' | 'story' | 'landscape' = 'square',
  returnRawUrl: boolean = false,
  source: 'chat' | 'create' = 'chat',
  isComplex: boolean = false
): Promise<string> => {
  // Limpar apenas tags internas de sistema/arquivos, PRESERVANDO a tag de [Estilo: ...]
  const cleanPrompt = userPrompt
    .replace(/\[Modo:[^\]]+\]/g, "")
    .replace(/\[Arquivo:[^\]]+\]/g, "")
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

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMessage = errData?.error || errData?.message;

        // Se for erro de validação/moderação (400) ou limite de cota (429), propaga a mensagem específica para o usuário
        if (response.status === 400 || response.status === 429) {
          const serverError = new Error(errMessage || "A solicitação de imagem foi recusada.");
          (serverError as any).isServerError = true;
          throw serverError;
        }

        // Para outros status (403, 401, 404, 405, 500, 502, 503, 504), ativa o fallback de geração direta no cliente
        console.warn(`[Proxy] Servidor retornou código de status HTTP ${response.status}. Ativando fallback de geração no navegador.`);
        isVercelOrFallbackNeeded = true;
      }
    } catch (fetchErr: any) {
      // Se for erro específico do servidor (quota, bloqueio, moderação), propaga direto sem ativar fallback
      if (fetchErr.isServerError) {
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
      const quotaLimit = 3;

      if (user) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
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

      // 2. Moderação local e detecção de conteúdo impróprio ou fora do escopo cristão
      const forbiddenTerms = [
        // Nudity/NSFW/Vulgar/Sensual
        'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda', 'vagina', 'penis', 
        'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt', 'ass', 'hentai', 'safada', 'gostosa',
        'biquini', 'lingerie', 'toples', 'topless', 'sensualidade', 'erotismo', 'despida', 'despido',
        // Non-Christian / Occult / Pagan / Satanism / Other religions
        'diabo', 'demônio', 'demonio', 'satanas', 'satã', 'satanismo', 'buda', 'budismo', 'orixá', 'orixas', 
        'umbanda', 'candomblé', 'candomble', 'exu', 'pombagira', 'pomba gira', 'ze pilintra', 'bruxaria', 
        'feitiçaria', 'feitico', 'ocultismo', 'horóscopo', 'horoscopo', 'astrologia', 'signos', 'tarô', 'tarot', 
        'hindu', 'shiva', 'zeus', 'thor', 'mitologia', 'paganismo', 'pagão', 'pagao', 'magia negra', 'voodoo', 
        'pacto', 'ritual pagão', 'deus pagão', 'idolo', 'ídolo', 'baphomet', 'pentagrama',
        // Drugs / Alcohol / Crime / Violence / Weapons
        'drogas', 'maconha', 'cocaina', 'crack', 'lança perfume', 'vape', 'cigarro', 'tabaco', 'arma', 'tiro', 
        'sangue', 'violencia', 'mutilacao', 'morte sangrenta', 'assassino', 'crime', 'cerveja', 'vodka', 
        'uísque', 'whisky', 'vinho com bebedeira', 'balada', 'boate', 'danceteria', 'prostituta', 'prostituição', 
        'cassino', 'apostas', 'tigrinho', 'poker',
        // Secular non-Christian themes / Modern pop culture / Sports / Technology
        'carro', 'celular', 'computador', 'smartphone', 'videogame', 'video game', 'goku', 'naruto', 
        'futebol', 'soccer', 'marvel', 'dc comics', 'batman', 'superman', 'rockstar', 'funk', 'ostentação', 
        'anime', 'otaku', 'alienígena', 'disco voador', 'robô', 'robot', 'politica', 'fofoca', 'memes', 'meme',
        // Jailbreak / Prompt Injection Attempts
        'ignore instructions', 'jailbreak', 'system prompt', 'modo desenvolvedor', 'developer mode', 'modo dan',
        'bypass restrictions', 'desative os filtros'
      ];
      const lowercasePrompt = cleanPrompt.toLowerCase();

      const biblicalKeywords = [
        'salmo', 'salmos', 'moises', 'moisés', 'bíblia', 'biblia', 'jesus', 'cristo', 'davi', 'abraão', 'abraao', 
        'versículo', 'versiculo', 'evangelho', 'deus', 'senhor', 'oração', 'oracao', 'fé', 'fe', 'profeta', 
        'apóstolo', 'apostolo', 'genesis', 'gênesis', 'exodo', 'êxodo', 'paulo', 'pedro', 'joão', 'joao',
        'adão', 'adao', 'eva', 'adam', 'eve', 'éden', 'eden', 'arca', 'noé', 'noe', 'jó', 'jo', 'samuel',
        'salomão', 'solomão', 'elias', 'eliseu', 'daniel', 'paraiso', 'paraíso'
      ];
      const hasBiblicalContext = biblicalKeywords.some(kw => lowercasePrompt.includes(kw));

      const strictlyHarmfulTerms = [
        'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'porn', 'porno', 'sexo', 'erotic', 'erotico', 
        'drogas', 'cocaina', 'crack', 'mutilacao', 'gore', 'prostituicao', 'prostituta', 'estupro'
      ];
      const hasStrictlyHarmful = strictlyHarmfulTerms.some(term => {
        const regex = new RegExp(`(?:^|[^a-z0-9_])${term}(?:$|[^a-z0-9_])`, 'i');
        return regex.test(lowercasePrompt);
      });

      if (hasStrictlyHarmful) {
        throw new Error("A descrição fornecida contém termos que violam as diretrizes de conteúdo visual.");
      }

      // Se não tiver contexto bíblico explícito, verifica termos seculares
      if (!hasBiblicalContext) {
        const hasForbiddenTerm = forbiddenTerms.some(term => {
          const regex = new RegExp(`(?:^|[^a-z0-9_])${term}(?:$|[^a-z0-9_])`, 'i');
          return regex.test(lowercasePrompt);
        });
        if (hasForbiddenTerm) {
          throw new Error("A descrição fornecida contém termos que violam as diretrizes de conteúdo visual.");
        }
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

      const isCreateMode = source === 'create';

      if (keysToTry.length > 0) {
        const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

Você é um Diretor de Arte de Imagens Bíblicas e Moderador de Conteúdo Mestre, especialista em Engenharia de Prompts para geradores de imagem avançados.

REGRA 1 (Nudez e Conteúdo Impróprio/Sensual): Verifique se o pedido contém qualquer menção direta ou indireta a nudez, sensualidade, erotismo, trajes sumários/íntimos ou conteúdo adulto. Se violar esta regra, responda EXATAMENTE: "BLOQUEADO".
EXCEÇÃO SAGRADA OBRIGATÓRIA PARA ADÃO E EVA / JARDIM DO ÉDEN: Se o pedido for sobre "Adão e Eva", "Adam and Eve" ou o "Jardim do Éden", NÃO BLOQUEIE. Em vez disso, transforme o pedido em uma cena bíblica sagrada e highly respeitosa de Adão e Eva vestindo vestes/túnicas modestas e elegantes de linho bíblico no Jardim do Éden paradisíaco, cercados por natureza exuberante, rios e luz divina.

REGRA 2 (Filtro Bíblico e Cristão Estrito): Verifique se o pedido é EXCLUSIVAMENTE sobre temas, passagens, cenários, profecias, virtudes ou personagens descritos na Bíblia Sagrada ou relacionados à fé e história cristã. Se contiver QUALQUER assunto de outras religiões (Budismo, Hinduísmo, Mitologia, Entidades de Matriz Africana, etc.), feitiçaria, bruxaria, ocultismo, satanismo, horóscopo, tarô, astrologia, deuses pagãos ou temas seculares/mundanos (tecnologia moderna, carros, super-heróis, anime, esportes seculares), responda EXATAMENTE: "BLOQUEADO".

${isCreateMode ? `REGRA 3 (MODO CRIAR COM VERSÍCULOS - PAISAGENS NATURAIS SEM HUMANOS):
ATENÇÃO OBRIGATÓRIA: Este pedido é do Modo Criar com Versículos (fundo de imagem para texto/post). A imagem DEVE SER EXCLUSIVAMENTE UMA PAISAGEM NATURAL BÍBLICA, SEM NENHUMA PESSOA, SEM SERES HUMANOS, SEM ROSTOS, SEM CORPOS E SEM FIGURAS HUMANAS.
Gere um prompt em inglês focado 100% em elementos de natureza inspiradora (céu, montanhas, vales, desertos, rios, mares, árvores, flores, luz solar divina, névoa, nascer do sol) e adicione OBRIGATORIAMENTE ao final do prompt: "serene scenic natural landscape, no people, no humans, empty nature background, peaceful biblical environment, 8k resolution".` : `REGRA 3 (ANATOMIA, PERSONAGENS BÍBLICOS E ADÃO E EVA):
Ao traduzir e enriquecer o pedido para o INGLÊS, crie uma descrição natural, fluida e de altíssima fidelidade.
- PERSONAGENS BÍBLICOS, CASAIS E ADÃO E EVA (OBRIGATÓRIO):
  * Para Adão e Eva ("Adão e Eva" / "Adam and Eve"): Descreva obrigatoriamente e com máxima clareza: "one adult male (Adam) with distinct masculine facial structure and short hair, and one adult female (Eve) with distinct feminine facial structure and long flowing hair, a man and a woman couple standing together, wearing modest classical biblical linen garments in the lush Garden of Eden paradise, surrounded by vibrant fruit trees, crystal clear rivers, serene animals, and divine sunlight rays. Respectful, sacred, classical fine art style, no nudity, natural human faces".
  * Para Casais / Homem e Mulher: Sempre diferencie explicitamente "one adult male with masculine features and one adult female with feminine features" para garantir a diferenciação correta dos gêneros sem confundir o gerador de imagem.
  * Para outros personagens bíblicos (Jesus, Moisés, Davi, Abraão, etc.): Descreva feições humanas realistas e serenas, vestes históricas detalhadas e contexto bíblico fiel.
- ANATOMIA E OLHOS NATURAIS (CRÍTICO): Os olhos e rostos devem ser humanos, anatômicos e totalmente naturais ("natural realistic human eyes, crystal-clear iris, anatomically accurate round pupils, natural realistic eye gaze, sharp eye focus"). NUNCA gere rostos rachados, vitrais quebrados, mosaicos disformes, olhos vesgos, heterocromia estranha ou deformações faciais. Se duas pessoas estiverem na cena, especifique a diferenciação anatômica e o olhar natural entre elas.
- COMPOSIÇÃO E ENQUADRAMENTO: Mantenha um enquadramento equilibrado de retrato ou cena (medium portrait or scenic historical composition, balanced facial proportions) para evitar deformação facial de lente super próxima.
- ILUMINAÇÃO E PELE: Iluminação natural e cristalina (bright soft natural daylight), cores vivas e pele limpa e realista.
- ESTILOS ESPECÍFICOS ([Estilo: ...]):
  * CINEMATOGRÁFICO: "A high-end cinematic movie still, medium shot portrait, crisp focal clarity on face and eyes, crystal-clear detailed round pupils and iris with identical matching eye color, soft golden sunlight, anamorphic 85mm lens, shallow depth of field, vivid natural colors, masterwork 8k resolution."
  * ANIMAÇÃO 3D: "A beautiful 3D animated character illustration, Pixar and Disney studio art style, expressive face, clear aligned eyes, smooth 3D rendering, vibrant colors."
  * PIXEL ART: "Crisp 16-bit pixel art style, detailed retro video game graphics, clean pixel edges, nostalgic vibrant colors."
  * FOTORREALISMO / PADRÃO: "An award-winning ultra-realistic 8k DSLR portrait photograph, medium portrait composition, razor-sharp focus on human face and eyes, crystal-clear detailed round pupils and iris with identical matching eye color, natural realistic eye gaze, pristine ultra-detailed human skin texture, bright soft natural daylight, 85mm lens f/1.8, authentic historical accuracy."
  * PINTURA A ÓLEO: "Master classical oil painting on canvas, refined elegant brushwork, luminous lighting, clear detailed facial features and expressive natural eyes, museum fine art quality."
  * AQUARELA: "Delicate watercolor painting on textured paper, soft fluid pastel colors, clean artistic outlines, graceful watercolor washes."
  * ANIME: "High quality Studio Ghibli inspired anime illustration, clean line art, luminous soft lighting, vibrant colors, expressive clear eyes."
  * ILUSTRAÇÃO BÍBLICA SACRA: "Sacred illuminated manuscript artwork, royal gold leaf accents in decorative background frame, stained glass window cathedral architecture background, reverent biblical fresco style with smooth realistic human face and clean skin in foreground, natural realistic human eyes, no stained glass on face, no cracked skin."`}

REGRA 4 (Saída Limpa): Responda APENAS com o prompt final refinado em INGLÊS em um único parágrafo fluido. Não inclua aspas, preâmbulos, avisos ou explicações. Se for inadequado, responda APENAS: "BLOQUEADO".`;

        for (const key of keysToTry) {
          if (promptGenerated) break;
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
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
        throw new Error("A descrição fornecida contém termos que violam as diretrizes de conteúdo visual.");
      }

      let finalPrompt = enhancedPrompt;

      // Extrair tag de estilo se presente no prompt original e garantir que lidera o prompt em inglês
      let extractedStyle = "";
      const styleMatch = cleanPrompt.match(/\[Estilo:\s*([^\]]+)\]/i);
      if (styleMatch && styleMatch[1]) {
        let styleAddon = styleMatch[1];
        if (styleAddon.includes("-")) {
          styleAddon = styleAddon.split("-").slice(1).join("-").trim();
        }
        extractedStyle = styleAddon;
        if (styleAddon && !finalPrompt.toLowerCase().includes(styleAddon.toLowerCase().substring(0, 15))) {
          finalPrompt = `${styleAddon}, ${finalPrompt}`;
        }
      }

      const isAdamAndEve = /(?:adão|adao|adam).*(?:eva|eve)|(?:eva|eve).*(?:adão|adao|adam)|jardim do [ée]den|garden of eden/i.test(cleanPrompt + " " + enhancedPrompt);
      if (isAdamAndEve) {
        const adamEveBase = `Award-winning photorealistic medium portrait photograph of Adam and Eve standing side by side in the Garden of Eden. On the left, Adam: handsome adult man with masculine facial features, short dark hair, clean smooth skin, and natural brown eyes. On the right, Eve: beautiful adult woman with feminine facial features, long wavy brown hair, clean smooth skin, and natural brown eyes. Balanced eye-level medium portrait shot, bright soft uniform key lighting brightly and evenly illuminating both faces, complete 100% unobstructed visibility of both eyes on both people with zero dark shadows or leaf reflections covering the eyes. Razor-sharp 8k focus on both faces, anatomically flawless facial symmetry, perfectly matching symmetrical eyes fully open, crystal-clear round pupils and natural iris reflections on both left and right eyes of each person, natural skin texture, perfectly defined eyebrows and relaxed lips. Pristine high-definition realism, no shadowed eyes, no glitched pupils, no distorted eyelids, no hair or leaves covering eyes, no heterochromia, no blurry face`;
        if (extractedStyle) {
          finalPrompt = `${extractedStyle}, ${adamEveBase}`;
        } else {
          finalPrompt = `${adamEveBase}`;
        }
      }

      const isLandscapeOnly = /no people|no humans|empty nature background|apenas paisagem|sem pessoas|sem rostos|sem seres humanos/i.test(cleanPrompt + " " + enhancedPrompt);

      if (isLandscapeOnly) {
        finalPrompt = `${finalPrompt}, serene scenic natural landscape, empty nature background, peaceful biblical environment, bright soft natural daylight, sharp focus 8k resolution`;
      } else {
        // ARMONIZADOR FACIAL E OCULAR DE ULTRA-REALISMO (CLAREZA MÁXIMA DE OLHOS, ROSTOS E ENQUADRAMENTO LIMPO)
        if (/stained glass|vitral|mosaico|mosaic|cracked/i.test(finalPrompt)) {
          finalPrompt += `, stained glass/mosaic pattern strictly limited to background cathedral architecture frame, smooth clean photorealistic human face and pristine natural skin in foreground`;
        }

        const facialHarmonizerAddon = `photorealistic medium portrait photograph, balanced eye-level composition, bright uniform lighting across all faces with zero shadows on eyes, crisp razor-sharp focus on human faces and eyes, 100% clear unobstructed eyes on all individuals, anatomically perfect facial symmetry, clean smooth skin tone, authentic photorealistic human eyes with crystal-clear round pupils and natural iris texture, symmetrical eye gaze, perfectly defined eyebrows and lips, 8k resolution professional photography, no shadowed eyes, no glitched pupils, no distorted eyelids, no heterochromia, no blurry face`;

        if (!finalPrompt.toLowerCase().includes("photorealistic medium portrait photograph")) {
          finalPrompt = `${finalPrompt}, ${facialHarmonizerAddon}`;
        }
      }

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
      const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

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

          img.onload = async () => {
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
              const logoImg = await getWatermarkLogo();
              drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
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
        const watermarkedUrl = await ensureWatermarkedImage(pollinationsUrl);
        if (returnRawUrl) {
          return watermarkedUrl;
        }
        return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${watermarkedUrl})`;
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

    // Se o backend já retornou a imagem convertida em Base64, adicione a marca d'água e use-a imediatamente
    if (base64Image) {
      const watermarkedBase64 = await ensureWatermarkedImage(base64Image);
      if (returnRawUrl) {
        return watermarkedBase64;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${watermarkedBase64})`;
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

        img.onload = async () => {
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
            const logoImg = await getWatermarkLogo();
            drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
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
      const watermarkedUrl = await ensureWatermarkedImage(pollinationsUrl);
      if (returnRawUrl) {
        return watermarkedUrl;
      }
      return `Aqui está a imagem gerada para: "${cleanPrompt}"\n\n![${cleanPrompt}](${watermarkedUrl})`;
    }
  } catch (error: any) {
    console.error("Falha ao gerar imagem:", error);
    const msg = error.message || "Erro de comunicação ao acionar o serviço de imagens.";
    if (msg.includes("Failed to fetch")) {
      throw new Error("Erro de conexão de rede. Verifique sua internet e tente novamente em instantes.");
    }
    if (msg.includes("Status:") || msg.includes("403") || msg.includes("401") || msg.includes("Forbidden")) {
      throw new Error("Não foi possível gerar a imagem no momento. Tente novamente mais tarde.");
    }
    throw new Error(msg);
  }
};
