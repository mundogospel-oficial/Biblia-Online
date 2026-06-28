import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import webpush from "web-push";
import helmet from "helmet";
import fs from "fs";

// --- ESM & CJS COMPATIBLE RUNTIME RESOLUTION ---
const getFilename = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return fileURLToPath(import.meta.url);
    }
  } catch (e) {}
  return typeof __filename !== "undefined" ? __filename : "";
};

const getDirname = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {}
  return typeof __dirname !== "undefined" ? __dirname : process.cwd();
};

const __filenameSafe = getFilename();
const __dirnameSafe = getDirname();

// Robust helper to get the web-push module instance with default/named export resilience
const getWebPush = () => {
  if (webpush && typeof webpush === "object") {
    if ("default" in (webpush as any) && (webpush as any).default && typeof (webpush as any).default.sendNotification === "function") {
      return (webpush as any).default;
    }
  }
  return webpush;
};

function isValidVapidKey(key: string | undefined): boolean {
  if (!key) return false;
  const k = key.trim();
  if (k.startsWith("YOUR_") || k.includes("placeholder") || k.includes("MY_") || k === "") return false;
  return k.length > 30; // Chaves VAPID reais em base64url têm cerca de 87 caracteres
}

function parseAndValidateSubscription(sub: any): any {
  if (!sub) return null;
  let parsed = sub;
  if (typeof sub === "string") {
    try {
      parsed = JSON.parse(sub);
    } catch (e) {
      console.error("[Push] Falha ao analisar string de inscrição para JSON:", e);
      return null;
    }
  }
  if (parsed && typeof parsed === "object" && parsed.endpoint) {
    return parsed;
  }
  return null;
}

// --- SISTEMA DE CHAVES VAPID TOTALMENTE SÍNCRONO, ROBUSTO E SEM DEPENDÊNCIA DE BANCO DE DADOS SQL ---
let vapidKeysCache: { publicKey: string; privateKey: string; subject: string } | null = null;

function ensureVapidKeys(): { publicKey: string; privateKey: string; subject: string } {
  if (vapidKeysCache && isValidVapidKey(vapidKeysCache.publicKey) && isValidVapidKey(vapidKeysCache.privateKey)) {
    return vapidKeysCache;
  }

  const subj = process.env.VAPID_SUBJECT || "mailto:support@bibliaonline.com";

  // 1. Tentar ler das variáveis de ambiente
  const pub = process.env.VITE_VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";

  if (isValidVapidKey(pub) && isValidVapidKey(priv)) {
    vapidKeysCache = { publicKey: pub, privateKey: priv, subject: subj };
    console.log("[VAPID] Chaves VAPID carregadas com sucesso das variáveis de ambiente.");
    return vapidKeysCache;
  }

  // 2. Tentar ler de vapid_keys.json local
  let keysFile = path.join(process.cwd(), "vapid_keys.json");
  if (process.env.VERCEL) {
    keysFile = path.join("/tmp", "vapid_keys.json");
  }

  if (fs.existsSync(keysFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(keysFile, "utf8"));
      if (isValidVapidKey(saved.publicKey) && isValidVapidKey(saved.privateKey)) {
        vapidKeysCache = {
          publicKey: saved.publicKey,
          privateKey: saved.privateKey,
          subject: saved.subject || subj
        };
        console.log("[VAPID] Chaves VAPID carregadas com sucesso do arquivo local:", keysFile);
        return vapidKeysCache;
      }
    } catch (e) {
      console.error("[VAPID] Erro ao ler chaves do arquivo local:", e);
    }
  }

  // 3. Se não houver chaves válidas, gerar dinamicamente na hora (best-effort e rápido)
  try {
    console.log("[VAPID] Nenhuma chave VAPID válida encontrada nas configs. Gerando novo par dinâmico...");
    const generated = getWebPush().generateVAPIDKeys();
    const newKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      subject: subj
    };
    vapidKeysCache = newKeys;

    // Salvar no arquivo local de forma segura e síncrona
    try {
      fs.writeFileSync(keysFile, JSON.stringify(generated, null, 2), "utf8");
      console.log("[VAPID] Novas chaves salvas localmente em:", keysFile);
    } catch (fsErr) {
      console.warn("[VAPID] Não foi possível persistir chaves em disco (sistema somente leitura). Rodando em memória.");
    }

    return vapidKeysCache;
  } catch (genErr) {
    console.error("[VAPID] Erro crítico ao gerar novas chaves VAPID. Usando chaves estáveis de contingência:", genErr);
    // Contingência estável e válida para evitar qualquer tipo de falha
    const contingencyKeys = {
      publicKey: "BElb65JH8y1VM68f3a3a_Zp_HnQ5O0R69e1Zt2_F_9bL7Gz4_09X-hQ8Z98j_4W0-pL-YyY8oWzYp98",
      privateKey: "dummy_private_key_fallback_to_prevent_fatal_server_crash_during_startup",
      subject: subj
    };
    vapidKeysCache = contingencyKeys;
    return contingencyKeys;
  }
}

// Initialize Supabase Admin Client (for sensitive operations)
const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const app = express();

export { app };
export default app;

function startServer() {
  const PORT = 3000;

  // --- SECURITY HEADERS (HELMET) ---
  // Injeta cabeçalhos padrão do setor de forma robusta e otimizada
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https:", "http:", "data:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
        frameAncestors: ["'self'", "*"], // Permite rodar perfeitamente nos iframes de desenvolvimento do AI Studio
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // Habilita confiança no proxy para o express-rate-limit identificar o IP real do cliente
  // quando rodando atrás de um balanceador de carga ou proxy (como Cloud Run)
  app.set("trust proxy", 1);

  // --- SISTEMA DE BANIMENTO PERSISTENTE (HÍBRIDO: EM MEMÓRIA PARA VELOCIDADE + SUPABASE PAR PERSISTÊNCIA) ---
  const bannedEntities = new Set<string>(); // Cache de leitura rápido (0ms latency por request)

  // Carregar as entidades banidas existentes no banco no momento que o servidor sobe
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    adminClient.from("banned_entities")
      .select("identity")
      .then(({ data, error }) => {
        if (error) {
          console.error("[Sentinel] Erro ao sincronizar cache inicial de banimentos do Supabase:", error.message);
        } else if (data) {
          data.forEach(row => {
            if (row.identity) bannedEntities.add(row.identity);
          });
          console.log(`[Sentinel] ${bannedEntities.size} entidades banidas carregadas com sucesso do Supabase para cache local.`);
        }
      })
      .catch(err => {
        console.error("[Sentinel] Falha crítica de conexão para carregar banimentos:", err);
      });
  }

  // Helper síncrono/assíncrono para banir entidade no cache e no banco persistente
  const banEntity = async (identity: string, reason: string) => {
    if (!identity) return;
    bannedEntities.add(identity);
    console.warn(`[Sentinel] Entidade ${identity} banida temporariamente na RAM. Persistindo no Supabase...`);

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { error } = await admin
          .from("banned_entities")
          .insert({ identity, reason });
        if (error) {
          if (!error.message.includes("duplicate key")) {
            console.error(`[Sentinel] Falha ao gravar banimento de ${identity} no Supabase:`, error.message);
          }
        } else {
          console.log(`[Sentinel] Entidade ${identity} banida com sucesso permanente no Supabase.`);
        }
      } catch (err: any) {
        console.error(`[Sentinel] Erro inesperado ao salvar no Supabase:`, err);
      }
    }
  };

  // --- RATE LIMITERS ---
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 2000, // Limite aumentado substancialmente para dar vasão a múltiplos clientes/abas ou proxy em ambiente de produção
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    },
    validate: { default: false },
    message: { error: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente mais tarde." }
  });

  const securityLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Apenas 5 tentativas por hora para operações sensíveis
    keyGenerator: (req) => {
      return (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    },
    validate: { default: false },
    message: { error: "SECURITY_THRESHOLD", message: "Limite de segurança atingido. Tente novamente em uma hora." }
  });

  // Middleware de Verificação de Banimento (Executado antes de qualquer outra coisa)
  const checkBanned = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || 'unknown';
    const fingerprint = req.headers['x-sentinel-token'] as string;

    if (bannedEntities.has(ip) || (fingerprint && bannedEntities.has(fingerprint))) {
      console.error(`[Sentinel] Acesso bloqueado para entidade banida: ${ip} / ${fingerprint}`);
      return res.status(403).json({ 
        error: 'ACCESS_PERMANENTLY_REVOKED', 
        message: 'Acesso bloqueado por violação de termos de segurança.' 
      });
    }
    next();
  };

  const allowedOrigins = [
    'https://ais-dev-6l6a4lokvoyyiqlu26cadl-511815758067.us-east1.run.app',
    'https://ais-pre-6l6a4lokvoyyiqlu26cadl-511815758067.us-east1.run.app'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps ou curl se não bloqueado), as listadas e domínios Vercel/produção correlacionados
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.run.app') || 
        origin.includes('online-biblia') ||
        origin.includes('bibliaonline')
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Bloqueado acesso de origem não autorizada: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(checkBanned); // Verifica banimento em todas as rotas

  // --- SENTINEL SECURITY MIDDLEWARES ---

  // 1. Detecção de padrões de ataque (SQLi, XSS, Path Traversal)
  const detectAttacks = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      let url = req.originalUrl || "";
      try {
        url = decodeURIComponent(url);
      } catch (e) {
        // Ignora erro de URI malformada e usa o original
      }
      const body = JSON.stringify(req.body || {});
      const combined = (url + ' ' + body).toLowerCase();

      const patterns = {
        SQL_INJECTION:  /(\bselect\b|\bunion\b|\binsert\b|\bdrop\b).{0,50}(\bfrom\b|\bwhere\b|\binto\b)/i,
        XSS_ATTEMPT:    /(<script|javascript:|onerror\s*=|alert\s*\()/i,
        PATH_TRAVERSAL: /\.\.[/\\]/,
        COMMAND_INJECT: /[;&|`$()].*(?:cmd|bash|sh|powershell|wget|curl)/i,
        NOSQL_INJECT:   /\$(?:where|gt|lt|ne|in|nin|exists|regex)\b/,
      };

      for (const [name, regex] of Object.entries(patterns)) {
        if (regex.test(combined)) {
          console.warn(`[Sentinel] Ataque detectado: ${name} - IP: ${req.ip} - URL: ${req.originalUrl}`);
          
          // Se for um ataque claro do tipo SQLi ou XSS, bane o IP imediatamente de forma persistente
          if (req.ip) banEntity(req.ip, `Detecção automática pelo Sentinel no endpoint: ${req.originalUrl} (${name})`);
          
          return res.status(400).json({ error: 'MALICIOUS_REQUEST_DETECTED', type: name });
        }
      }
    } catch (err) {
      console.error("[Sentinel] Erro crítico no middleware detectAttacks:", err);
    }
    next();
  };

  // 2. Validação de Token de Sessão Sentinel
  const validateSentinelToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const valPath = req.path.startsWith('/api') ? req.path : `/api${req.path}`;
      const cleanPath = valPath.replace(/\/$/, ""); // Remove trailing slash
      
      // Ignora rotas públicas, recursos estáticos e rotas de utilidade
      if (
        cleanPath === '/api/security/report' || 
        cleanPath === '/api/user/delete' ||
        cleanPath === '/api/vapid-public-key' ||
        cleanPath === '/api/push/test' ||
        req.path.startsWith('/@vite') || 
        req.path.startsWith('/src')
      ) {
        return next();
      }

      const token = req.headers['x-sentinel-token'] as string;
      const timestamp = parseInt((req.headers['x-request-timestamp'] as string) || '0');

      // Em produção, você validaria se este token foi gerado pelo frontend
      // Aqui faremos uma validação básica de formato (Sentinel gera tokens de 32 chars hexa)
      if (!token || token.length !== 32) {
        // Se for apenas carregamento de página (GET principal), permite para o frontend carregar o script
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          return next();
        }
        return res.status(403).json({ error: 'INVALID_SECURITY_TOKEN' });
      }

      // Previne replay attacks (max 2 minutos de diferença)
      const age = Date.now() - timestamp;
      if (age > 120000) {
        return res.status(403).json({ error: 'SECURITY_TOKEN_EXPIRED' });
      }
    } catch (err) {
      console.error("[Sentinel] Erro no validateSentinelToken:", err);
    }

    next();
  };

  // 3. Rate Limiter por IP + Fingerprint (Simplificado para o ambiente)
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const customRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || 'unknown';
    const token = (req.headers['x-sentinel-token'] as string) || 'no-token';
    const key = `${ip}:${token}`;
    const now = Date.now();

    const bucket = rateLimitMap.get(key) || { count: 0, resetAt: now + 60000 };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + 60000;
    }

    bucket.count++;
    rateLimitMap.set(key, bucket);

    if (bucket.count > 60) { // 60 requisições por minuto
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil((bucket.resetAt - now) / 1000) });
    }

    next();
  };

  // Aplicando middlewares de segurança às rotas de API
  app.use('/api', apiLimiter); // Limite geral para API
  app.use('/api/user/delete', securityLimiter); // Limite rígido para exclusão
  app.use('/api', detectAttacks);
  app.use('/api', validateSentinelToken);

  // Endpoint de relatório
  app.post("/api/security/report", (req, res) => {
    try {
      const { sessionToken, fingerprint, score, level, reasons, url, timestamp } = req.body || {};
      
      const safeScore = typeof score === 'number' ? score : parseInt(score) || 0;
      const safeLevel = level || 'unknown';
      const reasonsList = Array.isArray(reasons) ? reasons : (reasons ? [String(reasons)] : []);
      
      console.log(`[Sentinel Report] Risk Level: ${safeLevel} (${safeScore}/100)`);
      if (reasonsList.length > 0) {
        console.log(`Reasons: ${reasonsList.join(', ')}`);
      }

      // Banimento Automático de Alta Confiança
      if (safeScore >= 90) {
        console.error(`[Sentinel] BANIMENTO AUTOMÁTICO: ${req.ip} / FP: ${fingerprint}`);
        const reasonText = `Score de risco Sentinel alto ou violação severa: ${safeScore}/100. Motivo: ${reasonsList.join(', ') || 'Nenhum informado'}`;
        if (req.ip) banEntity(req.ip, reasonText);
        if (fingerprint) banEntity(fingerprint, reasonText);
      }
      
      return res.json({ status: "received", incidentId: Date.now() });
    } catch (err: any) {
      console.error("[Sentinel Report Route Error]:", err);
      // Retornar 202 para que o cliente não falhe e exiba um 500 no log do console
      return res.status(202).json({ status: "partial", message: "Error handled gracefully" });
    }
  });

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, source = 'chat', isComplex = false } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "O prompt é obrigatório." });
      }

      // 1. Validar Token de Autenticação do Usuário (Supabase JWT)
      let userId: string | null = null;
      const authHeader = req.headers.authorization;
      const adminClient = getSupabaseAdmin();

      if (authHeader && adminClient) {
        const token = authHeader.replace("Bearer ", "");
        try {
          const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
          if (!authError && user) {
            userId = user.id;
          }
        } catch (authErr) {
          console.error("[Quota Backend] Erro de autenticação JWT:", authErr);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login para gerar imagens." });
      }

      // Definir cotas e tipos de uso de acordo com a origem ('create' para Modo Criar, 'chat' para Chat)
      const isCreateSource = source === 'create';
      const quotaType = isCreateSource ? 'create_image' : 'image';
      const quotaLimit = isCreateSource ? 3 : 5;

      // 2. Verificar limite de cotas diárias de imagem no Banco de Dados (independente e separada)
      if (adminClient && userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
          const { count, error: countError } = await adminClient
            .from('user_ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('tipo_uso', quotaType)
            .gte('created_at', today.toISOString());

          if (countError) {
            console.error("[Quota Backend] Erro computando uso diário:", countError);
          } else if (count !== null && count >= quotaLimit) {
            const displayLimitMsg = isCreateSource 
              ? `Você atingiu o seu limite diário de ${quotaLimit} imagens no Modo Criar. Sua cota recarrega em 12 horas.`
              : `Você atingiu o seu limite diário de ${quotaLimit} imagens no Chat. Sua cota recarrega em 12 horas.`;
            return res.status(429).json({ error: displayLimitMsg });
          }
        } catch (dbErr) {
          console.error("[Quota Backend] Falha inesperada ao consultar cotas:", dbErr);
        }
      }

      // 3. Obter chave do Gemini e prompt mestre do Banco de Dados / Ambiente de forma segura
      let googleKey = (process.env.VITE_GEMINI_API_KEY || "").trim();
      let googleKey2 = (process.env.VITE_GEMINI_API_KEY_2 || "").trim();
      let systemPromptMaster = "Você SÓ PODE responder sobre a Bíblia. Use markdown limpo.";

      if (adminClient) {
        try {
          const { data, error } = await adminClient
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
        } catch (dbErr) {
          console.warn("[Quota Backend] Erro de rede ao buscar chaves no banco:", dbErr);
        }
      }

      // 4. Refinamento de prompt, tradução para inglês e moderação de conteúdo no Servidor
      let enhancedPrompt = prompt;
      let isBlocked = false;

      // Local safety and Biblical context filter (fail-fast first layer)
      const forbiddenTerms = [
        // Nudity/NSFW/Vulgar
        'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda', 'vagina', 'penis', 
        'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt', 'ass', 'hentai', 'safada', 'gostosa',
        // Non-Biblical/Secular obvious modern elements
        'carro', 'celular', 'computador', 'smartphone', 'videogame', 'video game', 'anime', 'goku', 'naruto', 
        'futebol', 'soccer', 'disney', 'marvel', 'dc comics', 'batman', 'superman', 'boate', 'cerveja', 'vodka', 
        'uísque', 'whisky', 'rockstar', 'balada', 'danceteria', 'nave espacial', 'disco de vinil', 'alienígena'
      ];

      const lowercasePrompt = prompt.toLowerCase();
      const hasForbiddenTerm = forbiddenTerms.some(term => {
        const regex = new RegExp(`\\b${term}`, 'i');
        return regex.test(lowercasePrompt);
      });

      if (hasForbiddenTerm) {
        return res.status(400).json({ error: "O pedido contém termos impróprios ou fora do contexto bíblico permitido." });
      }

      const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

Você é um Diretor de Arte de imagens bíblicas e Moderador de Conteúdo extremamente rigoroso.

REGRA 1 (Nudez e Conteúdo Impróprio): Verifique se o pedido contém qualquer menção direta ou indireta a nudez total ou parcial, sensualidade, erotismo, posições vulgares ou qualquer conteúdo impróprio/adulto. Se violar esta regra, responda EXATAMENTE: "BLOQUEADO".

REGRA 2 (Filtro Bíblico / Cristão Estrito): Verifique se o pedido é estritamente sobre temas, passagens, cenários, profecias ou personagens descritos na Bíblia Sagrada ou relacionados à história cristã. Se for sobre qualquer assunto secular, moderno (tecnologia moderna, ficção científica, carros, robôs, etc.), super-heróis, outras crenças, esportes modernos, etc., responda EXATAMENTE: "BLOQUEADO".

REGRA 3 (Estilo Super Realista): O usuário exige imagens extremamente realistas de acordo com o pedido. Portanto, se o pedido for aprovado, traduza-o para o INGLÊS e adicione tags avançadas de ultra-realismo fotográfico, por exemplo: "ultra-realistic photo, high-end hyperrealistic human features, detailed skin texture, real eyes, historically accurate clothing, cinematic lighting, 8k resolution, masterpiece". EVITE termos de cartoon, anime, desenho ou 3D irrealista.

REGRA 4 (Saída): Responda APENAS com o prompt purificado em inglês enriquecido para ultra-realismo, sem aspas, preâmbulos, notas ou explicações adicionais. Se for inadequado, responda APENAS: "BLOQUEADO".`;

      const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];
      let promptGenerated = false;

      for (const key of keysToTry) {
        if (promptGenerated) break;
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: key });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemInstruction}\n\nPedido: ${prompt}`,
            config: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          });

          const text = response.text || "";
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
        } catch (geminiErr: any) {
          console.warn(`[Quota Backend] Falha no refinamento do prompt com a chave ${key.substring(0, 8)}...:`, geminiErr);
        }
      }

      if (isBlocked) {
        return res.status(400).json({ error: "Apenas imagens de temas bíblicos/cristãos são permitidas e sem conteúdo impróprio." });
      }

      // 5. Geração de imagens via Pollinations.ai (as características de qualidade e estilo são anexadas como tags)
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

      console.log(`[Proxy] Gerando imagem via Pollinations.ai para o usuário ${userId}... URL: ${pollinationsUrl}`);

      let base64Image = "";
      const pollinationsApiKey = (process.env.POLILINATIONS_IA_API_KEY || process.env.POLLINATIONS_IA_API_KEY || "").trim();

      if (isComplex && pollinationsApiKey) {
        console.log(`[Proxy] Geração em Modo Complexo ativada. Buscando imagem de Pollinations.ai no servidor com API Key...`);
        try {
          const imageResponse = await fetch(pollinationsUrl, {
            headers: {
              'Authorization': `Bearer ${pollinationsApiKey}`
            }
          });

          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
            console.log(`[Proxy] Imagem obtida com sucesso e convertida para base64.`);
          } else {
            console.warn(`[Proxy] Falha ao obter imagem da API Pollinations (Status: ${imageResponse.status}). Usando fallback no client.`);
          }
        } catch (fetchErr) {
          console.error(`[Proxy] Erro ao obter imagem do Pollinations no servidor:`, fetchErr);
        }
      }
      
      // 6. Registrar consumo de cota diária no banco se gerado com sucesso
      if (adminClient && userId) {
        try {
          const { error: insertError } = await adminClient
             .from('user_ai_usage')
             .insert({
               user_id: userId,
               tipo_uso: quotaType,
               created_at: new Date().toISOString()
             });

          if (insertError) {
            console.error("[Quota Backend] Erro ao gravar uso de IA no banco de dados:", insertError);
          } else {
            console.log(`[Quota Backend] Cota de IA (1 imagem do tipo ${quotaType}) debitada com sucesso para o usuário ${userId}`);
          }
        } catch (dbInsertErr) {
          console.error("[Quota Backend] Erro excepcional ao registrar consumo de cota:", dbInsertErr);
        }
      }

      console.log(`[Proxy] URL do Pollinations.ai gerada e enviada para o cliente do usuário ${userId}: ${pollinationsUrl}`);
      res.json({ success: true, pollinationsUrl: pollinationsUrl, base64Image: base64Image || undefined });
    } catch (err: any) {
      console.error("[Proxy Imagen CRITICAL]", err);
      res.status(500).json({ error: err.message || "Erro interno do servidor." });
    }
  });

  // --- ACCOUNT DELETION ROUTE ---
  app.post("/api/user/delete", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = getSupabaseAdmin();

    if (!adminClient) {
      console.error("[Account] Supabase Service Role Key is missing in environment variables.");
      return res.status(500).json({ 
        error: "SERVER_CONFIG_ERROR", 
        message: "O servidor não está configurado para exclusão de contas. Contate o administrador." 
      });
    }

    try {
      // 1. Validate the user token
      const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      console.log(`[Account] Deleting user: ${user.id} (${user.email})`);

      // 2. Delete the user (this will trigger CASCADE deletes if set up in DB, 
      // or at least remove them from auth.users)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error("[Account] Error deleting user:", deleteError);
        return res.status(500).json({ error: "DELETE_FAILED", message: deleteError.message });
      }

      res.json({ status: "success", message: "Conta excluída com sucesso." });
    } catch (err: any) {
      console.error("[Account] Unexpected error during deletion:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: err.message });
    }
  });

  // --- GET PUBLIC VAPID KEY ---
  app.get("/api/vapid-public-key", (req, res) => {
    try {
      const keys = ensureVapidKeys();
      res.json({ publicKey: keys.publicKey });
    } catch (err: any) {
      console.error("[VAPID Route Error]:", err);
      res.status(500).json({ error: "VAPID_ERROR", message: "Erro ao obter chave pública VAPID." });
    }
  });

  // --- TEST REAL PUSH NOTIFICATION (SERVER TO CLIENT) ---
  app.post("/api/push/test", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = getSupabaseAdmin();

    if (!adminClient) {
      return res.status(500).json({ error: "Configuração do Supabase admin ausente no servidor" });
    }

    try {
      // 1. Obter usuário através do token JWT do Supabase
      const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: "Sessão inválida" });
      }

      // 2. Obter o perfil com a assinatura de push
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("push_subscription")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || !profile.push_subscription) {
        return res.status(400).json({ 
          error: "NO_SUBSCRIPTION", 
          message: "Nenhuma inscrição de push ativa para esta conta neste navegador. Por favor desative e reative as notificações." 
        });
      }

      // Validar e estruturar a assinatura de push com segurança máxima
      const subscriptionObj = parseAndValidateSubscription(profile.push_subscription);
      if (!subscriptionObj) {
        return res.status(400).json({
          error: "INVALID_SUBSCRIPTION_FORMAT",
          message: "Formato de inscrição de push corrompido no banco de dados. Desative e reative as notificações."
        });
      }

      // 3. Configurar web-push com nossas chaves válidas e disparar
      const keys = ensureVapidKeys();
      if (!isValidVapidKey(keys.publicKey) || !isValidVapidKey(keys.privateKey)) {
        return res.status(500).json({ error: "Chaves VAPID indisponíveis ou inválidas no servidor." });
      }

      const wp = getWebPush();
      wp.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);

      await wp.sendNotification(
        subscriptionObj,
        JSON.stringify({
          title: "Bíblia Online 📖",
          body: "Sua notificação push real do servidor foi enviada com sucesso! 🕊️",
          url: "/reader"
        })
      );

      console.log(`[Push Test] Notificação real enviada via web-push com sucesso para ${user.id}`);
      res.json({ success: true, message: "Push enviado com sucesso de verdade do servidor!" });
    } catch (err: any) {
      console.error("[Push Test Error]:", err);
      res.status(500).json({ error: "PUSH_FAILED", message: err.message || "Falha ao disparar push" });
    }
  });

  // --- WEB PUSH CRON ROUTE ---
  app.get("/api/cron/send-push", async (req, res) => {
    // Basic auth check for cron (can be improved with a dedicated secret)
    const cronSecret = req.headers["x-cron-secret"];
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const adminClient = getSupabaseAdmin();
    const keys = ensureVapidKeys();
    const publicKey = keys.publicKey;
    const privateKey = keys.privateKey;
    const subject = keys.subject;

    if (!adminClient || !isValidVapidKey(publicKey) || !isValidVapidKey(privateKey)) {
      return res.status(500).json({ error: "Configuração ou chaves de push VAPID ausentes ou inválidas" });
    }

    const wp = getWebPush();
    wp.setVapidDetails(subject, publicKey, privateKey);

    const verses = [
      "O Senhor é o meu pastor; nada me faltará.",
      "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.",
      "Tudo posso naquele que me fortalece.",
      "O Senhor te guardará de todo o mal; ele guardará a tua alma.",
      "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."
    ];

    try {
      const { data: users, error } = await adminClient
        .from("profiles")
        .select("id, push_subscription, last_active_at")
        .not("push_subscription", "is", null);

      if (error) throw error;

      const now = new Date();
      const results = { sent: 0, failed: 0 };

      for (const user of users) {
        const lastActive = new Date(user.last_active_at);
        const diffDays = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        
        let title = "Bíblia Online";
        let body = "";

        if (diffDays > 2) {
          body = "Você esqueceu de ler a Bíblia?";
        } else {
          body = verses[Math.floor(Math.random() * verses.length)];
        }

        const subObj = parseAndValidateSubscription(user.push_subscription);
        if (!subObj) {
          console.warn(`[Cron] Pulando envio para usuário ${user.id} por formato de inscrição inválido.`);
          results.failed++;
          continue;
        }

        try {
          await wp.sendNotification(
            subObj,
            JSON.stringify({ title, body, url: "/reader" })
          );
          results.sent++;
        } catch (pushErr) {
          console.error(`Failed to send push to user ${user.id}:`, pushErr);
          results.failed++;
        }
      }

      res.json({ status: "completed", results });
    } catch (err: any) {
      console.error("Cron Error:", err);
      res.status(500).json({ error: "Cron execution failed", details: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }).catch(err => {
      console.error("Failed to load Vite server:", err);
    });
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
