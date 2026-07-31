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

  const displayPrompt = cleanPrompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim() || cleanPrompt;
  const shouldWatermark = source !== 'create';

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
        'salomão', 'solomão', 'salomao', 'elias', 'eliseu', 'daniel', 'paraiso', 'paraíso',
        'judas', 'iscariotes', 'tadeu', 'caim', 'abel', 'pilatos', 'herodes', 'golias', 'sansão', 'sansao', 'dalila', 
        'saul', 'jonas', 'isaías', 'isaias', 'jeremias', 'ezequiel', 'oséias', 'oseias', 'joel', 'amós', 'amos', 
        'obadias', 'miquéias', 'miqueias', 'naum', 'habacuque', 'sofonias', 'ageu', 'zacarias', 'malaquias', 
        'isaque', 'jacó', 'jaco', 'josé', 'jose', 'josué', 'josue', 'gideão', 'gideao', 'jefté', 'jefte', 'débora', 
        'debora', 'rute', 'boaz', 'ester', 'mordecai', 'neemias', 'esdras', 'joão batista', 'joao batista', 'maria', 
        'andré', 'andre', 'filipe', 'bartolomeu', 'tomé', 'tome', 'mateus', 'simão', 'estêvão', 'estevao', 'cornélio', 
        'cornelio', 'barnabé', 'barnabe'
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

      // 3. Obter chaves do Gemini e OpenRouter do Supabase para tradução/refinamento local
      let googleKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
      let googleKey2 = (import.meta.env.VITE_GEMINI_API_KEY_2 || "").trim();
      let openRouterKey = ((import.meta.env as any).VITE_OPEN_ROUTER_IMAGENS || (import.meta.env as any).OPEN_ROUTER_IMAGENS || import.meta.env.VITE_OPENROUTER_API_KEY || "").trim();
      let openRouterKey2 = (import.meta.env.VITE_OPENROUTER_API_KEY_2 || "").trim();
      let systemPromptMaster = "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";

      try {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('config_key, config_value')
          .in('config_key', ['google_ai_key', 'google_ai_key_2', 'openrouter_api_key', 'openrouter_api_key_2', 'system_prompt_master']);
          
        if (!error && data) {
          const dbGoogle = data.find(d => d.config_key === 'google_ai_key')?.config_value;
          const dbGoogle2 = data.find(d => d.config_key === 'google_ai_key_2')?.config_value;
          const dbOpenRouter = data.find(d => d.config_key === 'openrouter_api_key')?.config_value;
          const dbOpenRouter2 = data.find(d => d.config_key === 'openrouter_api_key_2')?.config_value;
          const dbMaster = data.find(d => d.config_key === 'system_prompt_master')?.config_value;
          if (dbGoogle && dbGoogle.trim()) googleKey = dbGoogle.trim();
          if (dbGoogle2 && dbGoogle2.trim()) googleKey2 = dbGoogle2.trim();
          if (dbOpenRouter && dbOpenRouter.trim()) openRouterKey = dbOpenRouter.trim();
          if (dbOpenRouter2 && dbOpenRouter2.trim()) openRouterKey2 = dbOpenRouter2.trim();
          if (dbMaster && dbMaster.trim()) systemPromptMaster = dbMaster.trim();
        }
      } catch (err) {
        console.warn("[Fallback Cliente] Erro de rede ao buscar chaves no banco:", err);
      }

      let enhancedPrompt = cleanPrompt;
      let isBlocked = false;
      let promptGenerated = false;

      const isCreateMode = source === 'create';

      const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

Você é um Diretor de Arte de Imagens Bíblicas e Moderador de Conteúdo Mestre, especialista em Engenharia de Prompts para geradores de imagem avançados.

REGRA 1 (Nudez e Conteúdo Impróprio/Sensual): Verifique se o pedido contém qualquer menção direta ou indireta a nudez, sensualidade, erotismo, trajes sumários/íntimos ou conteúdo adulto. Se violar esta regra, responda EXATAMENTE: "BLOQUEADO".
EXCEÇÃO SAGRADA OBRIGATÓRIA PARA ADÃO E EVA / JARDIM DO ÉDEN: Se o pedido for sobre "Adão e Eva", "Adam and Eve", "Adão", "Eva" ou o "Jardim do Éden", NÃO BLOQUEIE. Em vez disso, transforme o pedido em uma cena bíblica sagrada e highly respeitosa de Adão e Eva no Jardim do Éden paradisíaco, cercados por natureza exuberante (árvores frutíferas, rios cristalinos, animais pacíficos, flores e iluminação divina).
- PERSONAGENS DE ADÃO E EVA: Descreva obrigatoriamente um homem adulto (Adão) com estrutura facial masculina bonita e cabelo curto, e uma mulher adulta (Eva) com estrutura facial feminina graciosa e cabelos longos e ondulados (um casal de homem e mulher) vestindo vestes/túnicas modestas e elegantes de linho bíblico clássico (sem nudez, estilo sacro e respeitoso).
- ROSTOS E OLHOS DE ADÃO E EVA: Exija expressamente rostos bonitos e limpos com olhos humanos altamente realistas da mesma cor ("beautiful clean human faces, ultra-realistic human eyes with identical matching eye color, hyper-detailed crystal-clear iris, razor-sharp pupil definition with zero motion blur even on extreme close-up zoom, 8k focus, lifelike eye catchlight reflections, serene natural expression, pristine skin").

REGRA 2 (Filtro Bíblico e Cristão Estrito): Verifique se o pedido é EXCLUSIVAMENTE sobre temas, passagens, cenários, profecias, virtudes ou personagens descritos na Bíblia Sagrada ou relacionados à fé e história cristã.
ATENÇÃO OBRIGATÓRIA PARA PERSONAGENS BÍBLICOS (EX: JUDAS, JUDAS ISCARIOTES, JUDAS TADEU, CAIM, PILATOS, HERODES, GOLIAS, SANSÃO, DALILA, REI SALOMÃO, ETC.):
Todos os personagens e figuras históricas mencionadas na Bíblia Sagrada — incluindo Apóstolos, Reis, Profetas e figuras controversas bíblicas como Judas Iscariotes, Judas Tadeu, Caim, Pilatos, Herodes, Golias, etc. — SÃO PERSONAGENS BÍBLICOS VÁLIDOS E PERMITIDOS! NUNCA BLOQUEIE pedidos de personagens bíblicos! SÓ BLOQUEIE SE O PEDIDO CONTIVER DIRETA E EXPLICITAMENTE NUDEZ, EROTISMO, CONTEÚDO ADULTO OU VIOLÊNCIA EXTREMA/PORNOGRAFIA. Se contiver QUALQUER assunto de outras religiões (Budismo, Hinduísmo, Mitologia, Entidades de Matriz Africana, etc.), feitiçaria, bruxaria, occultismo, satanismo, horóscopo, tarô, astrologia, deuses pagãos ou temas seculares/mundanos (tecnologia moderna, carros, super-heróis, anime, esportes seculares), responda EXATAMENTE: "BLOQUEADO".

${isCreateMode ? `REGRA 3 (MODO CRIAR COM VERSÍCULOS - PAISAGENS NATURAIS SEM HUMANOS):
ATENÇÃO OBRIGATÓRIA: Este pedido é do Modo Criar com Versículos (fundo de imagem para texto/post). A imagem DEVE SER EXCLUSIVAMENTE UMA PAISAGEM NATURAL BÍBLICA, SEM NENHUMA PESSOA, SEM SERES HUMANOS, SEM ROSTOS, SEM CORPOS E SEM FIGURAS HUMANAS.
Gere um prompt em inglês focado 100% em elementos de natureza inspiradora (céu, montanhas, vales, desertos, rios, mares, árvores, flores, luz solar divina, névoa, nascer do sol) e adicione OBRIGATORIAMENTE ao final do prompt: "serene scenic natural landscape, no people, no humans, empty nature background, peaceful biblical environment, 8k resolution".` : `REGRA 3 (ADAPTAÇÃO SEMÂNTICA, PERSONAGENS BÍBLICOS E MONUMENTOS/ARQUITETURA):
Ao traduzir e enriquecer o pedido para o INGLÊS, identifique e adapte a estrutura do prompt com base no CONTEÚDO SOLICITADO:

TIPO A — ADÃO E EVA, CASAIS E PESSOAS (GARANTIA DE ROSTOS LIMPÍSSIMOS E OLHOS PERFEITOS):
- ROSTOS 100% LIMPÍSSIMOS E SEM BORRÃO: O rosto e a pele NUNCA podem ter borrão, manchas artificiais ou desfoque ("100% clean unobstructed human face, clear gap between foliage/branches and faces with zero leaves covering eyes or cheeks, soft uniform studio fill lighting, zero face blur, zero motion blur, pristine smooth skin texture").
- OLHOS 100% PERFEITOS E SIMÉTRICOS: Exija olhos totalmente focados, nítidos e idênticos em cada pessoa com a mesma cor de íris em ambos os olhos ("crystal-clear focused eyes, perfectly matching iris color on both eyes, flawless round dark pupils, razor-sharp iris texture, no glitched pupils, no cat eyes, no split pupils, no double irises, no heterochromia, no strabismus, ultra sharp eyes").
- Para Adão e Eva: Coloque sempre no Jardim do Éden paradisíaco ("lush Garden of Eden paradise, surrounded by vibrant fruit trees, crystal clear rivers, serene animals, and divine sunlight rays") vestindo vestes modestas e sagradas de linho bíblico (sem nudez).

TIPO B — MONUMENTOS, ARQUITETURA, ESTRUTURAS E PAISAGENS BÍBLICAS (EX: TORRE DE BABEL, ARCA DE NOÉ, MAR VERMELHO, JERICÓ, MONTE SINAI):
- ATENÇÃO CRÍTICA: Se o pedido for sobre estruturas, monumentos, arquitetura ou grandes eventos bíblicos sem foco em retratos humanos (exemplo: "Torre de Babel", "Arca de Noé", "Templo de Salomão", "Mar Vermelho", "Muralhas de Jericó", "Monte Sinai", "Criação do Mundo"):
- NÃO ADICIONE NEM FORCE rostos humanos, olhos em close-up, nem termos de fotografia de retrato! A imagem deve focar 100% no MONUMENTO, NA ARQUITETURA, NA ESCALA ÉPICA E NO SIGNIFICADO HISTÓRICO BÍBLICO.
- Para "TORRE DE BABEL" / "Tower of Babel": Descreva aprimoradamente uma colossal e imponente torre ziggurat antiga de tijolos alcançando as nuvens ("an awe-inspiring epic ancient ziggurat tower of Babel reaching up into dramatic clouds, monumental ancient Mesopotamian clay-brick architecture, detailed ancient construction site at the base with small distant ancient workers, vast biblical plains of Shinar, golden dramatic lighting, volumetric sunbeams, hyper-detailed historical accuracy, 8k resolution").
- Para "ARCA DE NOÉ" / "Noah's Ark": Descreva a imensa arca de madeira em Mount Ararat ou em meio ao dilúvio e arco-íris, focando na majestosa estrutura de madeira de gofer e no cenário épico.
- Para "MAR VERMELHO": Descreva o milagre monumental com paredes colossais de água cristalina nas laterais e caminho seco ao centro.
- Aprimore a descrição para que o gerador de imagem entenda com profundidade a atmosfera, o estilo arquitetônico e a grandiosidade sem adicionar rostos deslocados da cena.

TIPO C — PERSONAGENS BÍBLICOS ESPECÍFICOS (Judas, Rei Salomão, Moisés, Davi, Noé, Elias, Jesus, Caim, Pilatos, etc.):
- IDENTIFIQUE O PERSONAGEM E CRIE O CENÁRIO DEDICADO CORRESPONDENTE AO PEDIDO DO USUÁRIO (NUNCA BLOQUEIE PERSONAGENS BÍBLICOS):
  * JUDAS / JUDAS ISCARIOTES / JUDAS TADEU: Se o pedido mencionar "Judas", "Judas Iscariotes" ou "Judas Tadeu", NUNCA BLOQUEIE. Crie uma representação bíblica histórica e respeitosa do personagem bíblico vestindo trajes do primeiro século na antiga Jerusalém ("Judas, first-century biblical character in ancient Jerusalem wearing traditional linen robes, historical biblical setting, dramatic lighting, 8k resolution").
  * REI SALOMÃO / KING SOLOMON: Se o pedido mencionar "Rei Salomão", "Salomão" ou "King Solomon", crie o Rei Salomão vestindo trajes reais de seda e linho roxo/dourado com coroa de ouro e sabedoria divina no olhar, sentado no imponente trono de marfim e ouro com leões no opulento palácio de Jerusalém ("King Solomon sitting on a magnificent gold and ivory throne in his majestic opulent palace of Jerusalem, wearing a golden crown and regal purple robes, atmosphere of divine wisdom and splendor").
  * MOISÉS / MOSES: Se mencionar "Moisés", crie a cena histórica com seu cajado de madeira no milagre do Mar Vermelho abrindo ou no Monte Sinai com as Tábuas da Lei sob iluminação sagrada e nuvens celestiais.
  * DAVI / DAVID: Se mencionar "Davi", identifique se é o jovem pastor com harpa/funda nas colinas de Belém ou o Rei Davi no palácio com harpa e coroa.
  * OUTROS PERSONAGENS BÍBLICOS (Caim, Pilatos, Herodes, Golias, Abraão, Noé, Elias, Daniel, Apóstolos, Jesus): Identifique a passagem e o cenário específico solicitado e crie uma obra bíblica fiel com trajes históricos e iluminação sagrada sem bloquear.
- OLHOS E ANATOMIA NATURAIS EM TODOS OS PERSONAGENS: Exija rostos limpos, sem borrão de movimento e com olhos humanos totalmente naturais, ultrarrealistas e extremamente nítidos com a mesma cor em cada par de olhos ("100% clean unobstructed faces, clear space around eyes, ultra-realistic human eyes with identical matching eye color, hyper-detailed crystal-clear iris, razor-sharp pupil definition with zero motion blur even on extreme close-up zoom, 8k focus, lifelike eye catchlight reflections, serene natural gaze, pristine clean skin, anatomically correct features, no face blur"). NUNCA insira mosaicos, vitrais, borrões ou folhas cobrindo os olhos.

ESTILOS VISUAIS ([Estilo: ...]):
- Se nenhum estilo específico for solicitado, utilize POR PADRÃO O ESTILO CINEMATOGRÁFICO:
  * CINEMATOGRÁFICO (Padrão): "High-end epic cinematic movie still, masterwork dramatic lighting, tack-sharp focal precision across entire face and eyes, perfectly aligned symmetrical human eyes with identical matching dark brown irises, flawless round dark pupils, crisp razor-sharp iris texture without blur or double pupils, 100% sharp focus on both eyes, pristine natural skin texture, masterwork 8k resolution, no motion blur, no depth of field blur on eyes, no cat eyes, no split pupils, no double irises, no heterochromia, no strabismus, no deformed eyes, no cloudy irises, ultra sharp eyes."
  * ANIMAÇÃO 3D: "A beautiful 3D animated character illustration, Pixar and Disney studio art style, expressive face, clear aligned eyes with identical matching eye color and razor-sharp pupil clarity, smooth 3D rendering, vibrant colors."
  * PIXEL ART: "Crisp 16-bit pixel art style, detailed retro video game graphics, clean pixel edges, nostalgic vibrant colors."
  * FOTORREALISMO: "An award-winning ultra-realistic 8k DSLR photograph, razor-sharp focus on faces and eyes, pristine detailed human skin texture, ultra-realistic human eyes with identical matching eye color, hyper-detailed crystal-clear iris, razor-sharp pupil definition without motion blur even on extreme close-up zoom, natural daylight, authentic historical accuracy, no motion blur, no depth of field blur on eyes, no cat eyes, no split pupils, no double irises, no heterochromia, no strabismus, no deformed eyes, no cloudy irises, ultra sharp eyes."
  * PINTURA A ÓLEO: "Master classical oil painting on canvas, refined elegant brushwork, luminous lighting, museum fine art quality."
  * AQUARELA: "Delicate watercolor painting on textured paper, soft fluid pastel colors, clean artistic outlines."`}

REGRA 4 (Saída Limpa): Responda APENAS com o prompt final refinado em INGLÊS em um único parágrafo fluido. Não inclua aspas, preâmbulos, avisos ou explicações. Se for inadequado, responda APENAS: "BLOQUEADO".`;

      // 1ª Tentativa: Sistema OPEN_ROUTER_IMAGENS via OpenRouter API
      const openRouterKeysToTry = [openRouterKey, openRouterKey2].filter(Boolean) as string[];
      if (openRouterKeysToTry.length > 0) {
        console.log(`[OPEN_ROUTER_IMAGENS] Processando mensagem e gerando prompt via OpenRouter...`);
        const openRouterModels = [
          "google/gemma-2-9b-it:free",
          "meta-llama/llama-3.1-8b-instruct:free",
          "meta-llama/llama-3.3-70b-instruct:free",
          "qwen/qwen-2.5-72b-instruct:free",
          "mistralai/mistral-7b-instruct:free",
          "openai/gpt-4o-mini",
          "openrouter/auto"
        ];

        for (const orKey of openRouterKeysToTry) {
          if (promptGenerated) break;
          for (const modelId of openRouterModels) {
            try {
              const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${orKey}`,
                  "Content-Type": "application/json",
                  "X-Title": "OPEN_ROUTER_IMAGENS"
                },
                body: JSON.stringify({
                  model: modelId,
                  messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Pedido: ${cleanPrompt}` }
                  ],
                  temperature: 0.7,
                  max_tokens: 500
                }),
                signal
              });

              if (orRes.ok) {
                const orData = await orRes.json();
                const text = orData?.choices?.[0]?.message?.content || "";
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
                  console.log(`[OPEN_ROUTER_IMAGENS] Prompt criado com sucesso (${modelId}): "${enhancedPrompt.substring(0, 80)}..."`);
                  break;
                }
              }
            } catch (orErr: any) {
              console.warn(`[OPEN_ROUTER_IMAGENS - Cliente] Modelo ${modelId} falhou:`, orErr);
            }
          }
        }
      }

      // 2ª Tentativa: Gemini API (fallback)
      if (!promptGenerated) {
        const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];
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
        const adamEveBase = `Award-winning photorealistic medium chest-up portrait photograph of Adam and Eve standing in the Garden of Eden, facing forward towards the camera. On the left, Adam: handsome adult man with masculine facial features, short dark hair, clean smooth skin, and natural dark brown eyes. On the right, Eve: beautiful adult woman with feminine facial features, long wavy brown hair, clean smooth skin, and natural brown eyes. Balanced eye-level composition with clear space around faces, soft uniform studio fill lighting evenly illuminating both faces with zero harsh dappled sunlight shadows across eyes or skin. 100% complete unobstructed visibility of all eyes, clear gap between foliage leaves and faces so no leaves cover or touch eyes or eyebrows. Razor-sharp 8k focus on both faces, anatomically flawless facial symmetry, perfectly matching symmetrical eyes fully open, crystal-clear centered round dark pupils, razor-sharp iris texture, natural eye catchlight reflections on both eyes of each person, natural skin texture, perfectly defined eyebrows and relaxed lips. Pristine high-definition realism, no shadowed eyes, no white cloudy eyes, no blinded eyes, no cat eye pupils, no glitched pupils, no distorted eyelids, no hair or leaves covering eyes, no heterochromia, no strabismus, no blurry face, no face blur`;
        if (extractedStyle) {
          finalPrompt = `${extractedStyle}, ${adamEveBase}`;
        } else {
          finalPrompt = `${adamEveBase}`;
        }
      }

      const isKingSolomon = /(?:rei\s+salom[aã]o|salom[aã]o|king\s+solomon)/i.test(cleanPrompt + " " + enhancedPrompt);
      if (isKingSolomon) {
        const solomonBase = `Award-winning epic portrait of King Solomon sitting upon a magnificent ivory and gold throne flanked by regal carved lions in his grand opulent palace of Jerusalem. King Solomon is a majestic king with handsome dignified facial features, short dark hair and beard, wearing a golden royal crown and luxurious embroidered purple and gold linen robes. Soft golden light illuminating his wise serene expression. 100% clear unobstructed face and eyes, zero foliage or leaves obscuring faces, tack-sharp focal precision on both eyes, perfectly symmetrical eyes with identical dark brown irises and round dark pupils, pristine skin texture, 8k resolution masterwork photography, no glitched pupils, no cat eyes, no face blur, no motion blur, ultra sharp eyes`;
        if (extractedStyle) {
          finalPrompt = `${extractedStyle}, ${solomonBase}`;
        } else {
          finalPrompt = `${solomonBase}`;
        }
      }

      const isJudas = /(?:judas|judas\s+iscariote|judas\s+iscariotes|judas\s+tadeu)/i.test(cleanPrompt + " " + enhancedPrompt);
      if (isJudas && !isBlocked) {
        const judasBase = `Award-winning biblical portrait of Judas in first-century ancient Jerusalem wearing traditional linen robes. Soft dramatic lighting illuminating his expressive face. 100% clear unobstructed face and eyes, zero foliage or leaves obscuring face, tack-sharp focal precision on both eyes, perfectly symmetrical eyes with identical dark brown irises and round dark pupils, pristine skin texture, 8k resolution photography, no glitched pupils, no cat eyes, no face blur, no motion blur, ultra sharp eyes`;
        if (extractedStyle) {
          finalPrompt = `${extractedStyle}, ${judasBase}`;
        } else {
          finalPrompt = `${judasBase}`;
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

        const facialHarmonizerAddon = `photorealistic medium chest-up portrait photograph, balanced eye-level composition, soft uniform studio fill lighting across all faces with zero dark shadows or dappled reflections covering eyes, crisp tack-sharp focus on human faces and eyes, 100% clear unobstructed faces and eyes on all individuals, clear gap between foliage or leaves and faces with zero leaves blocking eyes or skin, anatomically perfect facial symmetry, clean smooth skin tone, authentic photorealistic human eyes with crystal-clear centered round dark pupils and natural iris texture, symmetrical forward eye gaze, perfectly defined eyebrows and lips, 8k resolution professional photography, no shadowed eyes, no white cloudy eyes, no glitched pupils, no cat eyes, no split pupils, no double irises, no polycoria, no heterochromia, no strabismus, no distorted eyelids, no blurry face, no face blur, no motion blur, no depth of field blur on eyes, ultra sharp eyes`;

        if (!finalPrompt.toLowerCase().includes("photorealistic medium")) {
          finalPrompt = `${finalPrompt}, ${facialHarmonizerAddon}`;
        }
      }

      if (!isLandscapeOnly && !finalPrompt.toLowerCase().includes("no glitched pupils")) {
        finalPrompt += `, tack-sharp focus, crystal-clear eyes, perfectly round dark pupils, no motion blur, no face blur, no blurry eyes, no out of focus eyes, no glitched pupils, no cat eyes, no split pupils, no double irises, no polycoria, no heterochromia, no distorted eyelids, no deformed eyes, 8k resolution`;
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
              if (shouldWatermark) {
                const logoImg = await getWatermarkLogo();
                drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
              }
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
        return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${base64Bytes})`;
      } catch (clientErr: any) {
        console.warn("[Fallback Cliente] Falha ao converter imagem para base64 local, aplicando fallback com link direto:", clientErr);
        const watermarkedUrl = shouldWatermark ? await ensureWatermarkedImage(pollinationsUrl) : pollinationsUrl;
        if (returnRawUrl) {
          return watermarkedUrl;
        }
        return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${watermarkedUrl})`;
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
      const watermarkedBase64 = shouldWatermark ? await ensureWatermarkedImage(base64Image) : base64Image;
      if (returnRawUrl) {
        return watermarkedBase64;
      }
      return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${watermarkedBase64})`;
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
            if (shouldWatermark) {
              const logoImg = await getWatermarkLogo();
              drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, logoImg);
            }
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

      return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${base64Bytes})`;
    } catch (fetchErr: any) {
      console.warn("Falha ao converter imagem gerada para base64 local, aplicando fallback com link direto:", fetchErr);
      const watermarkedUrl = shouldWatermark ? await ensureWatermarkedImage(pollinationsUrl) : pollinationsUrl;
      if (returnRawUrl) {
        return watermarkedUrl;
      }
      return `Aqui está a imagem gerada para: "${displayPrompt}"\n\n![${displayPrompt}](${watermarkedUrl})`;
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
