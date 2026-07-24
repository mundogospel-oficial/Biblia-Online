import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "fs";
import { sanitizeUserPrompt, buildPrivacyEnhancedSystemRule } from "./src/lib/security/privacyGuard.js";

// --- ESM & CJS COMPATIBLE RUNTIME RESOLUTION ---

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
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://*.supabase.co",
          "https://*.supabase.in",
          "https://*.supabase.net",
          "https://*.google.com",
          "https://*.vercel.app",
          "https://*.vercel.live",
          "https://challenges.cloudflare.com",
          "https://*.onesignal.com",
          "https://onesignal.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://*.onesignal.com",
          "https://onesignal.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:", // Permite imagens seguras de qualquer site para avatares/logos
          "http:" // Fallback para URLs legado de imagens
        ],
        connectSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://fonts.googleapis.com",
          "https://*.supabase.co",
          "https://*.supabase.in",
          "https://*.supabase.net",
          "https://*.googleapis.com",
          "wss://*.supabase.co",
          "wss://*.supabase.in",
          "https://raw.githubusercontent.com",
          "https://bible-api.com",
          "https://bolls.life",
          "https://openrouter.ai",
          "https://*.cloudflare.com",
          "https://*.vercel.live",
          "https://*.onesignal.com",
          "https://onesignal.com",
          "https://img.os-content.com",
          "https://*.os-content.com",
          "wss:",
          "ws:"
        ],
        frameSrc: [
          "'self'",
          "https://*.vercel.live",
          "https://challenges.cloudflare.com"
        ],
        workerSrc: [
          "'self'",
          "blob:",
          "https://*.onesignal.com",
          "https://onesignal.com"
        ],
        childSrc: [
          "'self'",
          "https://*.onesignal.com",
          "https://onesignal.com"
        ],
        frameAncestors: ["'self'", "*"], // Essencial para o preview do AI Studio
      },
    },
    // Desativamos o HSTS automático do helmet para controlá-lo de forma cirúrgica no middleware abaixo,
    // garantindo que ele NUNCA seja enviado em ambientes de desenvolvimento ou previews temporários.
    hsts: false,
    // Impede que navegadores tentem adivinhar o MIME-type da resposta (X-Content-Type-Options: nosniff)
    noSniff: true,
    // Permite controlar a inclusão do cabeçalho X-Frame-Options (X-Frame-Options: SAMEORIGIN)
    // O CSP frame-ancestors moderno é priorizado nos navegadores, mas mantemos SAMEORIGIN como fallback seguro
    frameguard: {
      action: "sameorigin",
    },
    // Configura o X-XSS-Protection de forma explícita para desativar filtros legados que introduziam falhas
    xssFilter: true,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // Habilita confiança no proxy para o express-rate-limit identificar o IP real do cliente
  // quando rodando atrás de um balanceador de carga ou proxy (como Cloud Run)
  app.set("trust proxy", 1);

  // --- REDIRECIONAMENTO AUTOMÁTICO HTTP PARA HTTPS ---
  // Detecta tráfego HTTP inseguro e redireciona automaticamente para HTTPS em produção de forma ultra-segura.
  // Permite conexões locais e plataformas de preview de desenvolvimento sem criptografia ou loops de redirecionamento.
  app.use((req, res, next) => {
    const host = req.hostname.toLowerCase();
    
    // Identifica se estamos em ambiente local (localhost, IPs de rede local ou de containers)
    const isLocalhost = 
      host === "localhost" || 
      host === "127.0.0.1" || 
      host.startsWith("192.168.") || 
      host.startsWith("10.") || 
      host.startsWith("172.");

    // Identifica se estamos em qualquer plataforma de desenvolvimento/preview de IA ou CI/CD
    const isDevPlatform = 
      host.endsWith(".run.app") || 
      host.includes("aistudio") || 
      host.includes("lovable") || 
      host.includes("preview") || 
      host.includes("sandbox") || 
      host.includes("gitpod") || 
      host.includes("github") || 
      host.includes("stackblitz") || 
      host.includes("glitch") || 
      host.includes("codesandbox") ||
      (host.includes("vercel.app") && host !== "online-biblia.vercel.app");

    const isHttp = req.headers["x-forwarded-proto"] === "http" || !req.secure;

    // Redireciona APENAS em produção real e usa redirecionamento 302 (temporário) para evitar que o navegador
    // cacheie loops de redirecionamento antigos ou incorretos se houver mudanças na infraestrutura.
    if (isHttp && !isLocalhost && !isDevPlatform) {
      return res.redirect(302, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });

  // --- CABEÇALHOS DE SEGURANÇA EXPLICITOS ADICIONAIS ---
  // Configura de forma visível e direta os cabeçalhos de proteção exigidos por ferramentas de auditoria (como Strix),
  // garantindo proteção máxima contra Clickjacking, ataques MIME-sniffing, XSS e interceptações de tráfego.
  app.use((req, res, next) => {
    const host = req.hostname.toLowerCase();
    
    const isLocalhost = 
      host === "localhost" || 
      host === "127.0.0.1" || 
      host.startsWith("192.168.") || 
      host.startsWith("10.") || 
      host.startsWith("172.");

    const isDevPlatform = 
      host.endsWith(".run.app") || 
      host.includes("aistudio") || 
      host.includes("lovable") || 
      host.includes("preview") || 
      host.includes("sandbox") || 
      host.includes("gitpod") || 
      host.includes("github") || 
      host.includes("stackblitz") || 
      host.includes("glitch") || 
      host.includes("codesandbox") ||
      (host.includes("vercel.app") && host !== "online-biblia.vercel.app") ||
      isLocalhost;

    // 1. Strict-Transport-Security (HSTS): Obriga conexões totalmente seguras em HTTPS por 1 ano, incluindo subdomínios e preload.
    // É essencial que NÃO seja enviado no ambiente de desenvolvimento/preview (.run.app ou localhost) para permitir HTTP normal,
    // mas em produção (como Vercel ou domínio próprio) ele é obrigatório para garantir segurança máxima.
    if (!isDevPlatform) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    } else {
      res.removeHeader("Strict-Transport-Security");
    }

    // 2. X-Content-Type-Options: Protege contra sniffing e execução maliciosa de tipos MIME incorretos
    res.setHeader("X-Content-Type-Options", "nosniff");

    // 3. X-XSS-Protection: Ativa proteção XSS integrada de navegadores legados (modo de bloqueio ativo)
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // 4. Referrer-Policy: Minimiza vazamento de dados de referência entre origens
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // 5. X-Frame-Options: Bloqueia ataques de clickjacking.
    // Para manter o painel de desenvolvimento/preview do AI Studio operando normalmente, removemos em desenvolvimento.
    // Em produção (domínio real do usuário, ex: vercel, domínio próprio), ativamos SAMEORIGIN ou DENY com rigor absoluto.
    if (!isDevPlatform) {
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    } else {
      res.removeHeader("X-Frame-Options");
    }

    next();
  });

  // --- SISTEMA DE BANIMENTO PERSISTENTE (HÍBRIDO: EM MEMÓRIA PARA VELOCIDADE + SUPABASE PAR PERSISTÊNCIA) ---
  const bannedEntities = new Set<string>(); // Cache de leitura rápido (0ms latency por request)

  // Carregar as entidades banidas existentes no banco no momento que o servidor sobe
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    (async () => {
      try {
        const { data, error } = await adminClient
          .from("banned_entities")
          .select("identity");
        
        if (error) {
          console.error("[Sentinel] Erro ao sincronizar cache inicial de banimentos do Supabase:", error.message);
        } else if (data) {
          data.forEach(row => {
            if (row.identity) bannedEntities.add(row.identity);
          });
          console.log(`[Sentinel] ${bannedEntities.size} entidades banidas carregadas com sucesso do Supabase para cache local.`);
        }
      } catch (err) {
        console.error("[Sentinel] Falha crítica de conexão para carregar banimentos:", err);
      }
    })();
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
      const { prompt: rawPrompt, aspectRatio, source = 'chat', isComplex = false } = req.body;
      if (!rawPrompt) {
        return res.status(400).json({ error: "O prompt é obrigatório." });
      }

      const { cleanPrompt: prompt } = sanitizeUserPrompt(rawPrompt);
      if (!prompt) {
        return res.status(400).json({ error: "O prompt enviado não possui conteúdo válido após desinfecção de dados." });
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
      const quotaLimit = 3;

      // 2. Verificar limite de cotas diárias de imagem no Banco de Dados (independente e separada)
      if (adminClient && userId) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

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
        'carro', 'celular', 'computador', 'smartphone', 'videogame', 'video game', 'goku', 'naruto', 
        'futebol', 'soccer', 'marvel', 'dc comics', 'batman', 'superman', 'boate', 'cerveja', 'vodka', 
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

      const isCreateMode = source === 'create';

      const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

Você é um Diretor de Arte de Imagens Bíblicas e Moderador de Conteúdo Mestre, especialista em Engenharia de Prompts para geradores de imagem avançados (FLUX / Midjourney).

REGRA 1 (Nudez e Conteúdo Impróprio): Verifique se o pedido contém qualquer menção direta ou indireta a nudez, sensualidade, erotismo ou conteúdo impróprio/adulto. Se violar esta regra, responda EXATAMENTE: "BLOQUEADO".

REGRA 2 (Filtro Bíblico / Cristão Estrito): Verifique se o pedido é sobre temas, passagens, cenários, profecias ou personagens descritos na Bíblia Sagrada ou relacionados à história cristã. Se for sobre qualquer assunto secular não-bíblico (como carros modernos, tecnologia moderna, ficção científica, super-heróis, outras religiões), responda EXATAMENTE: "BLOQUEADO".

${isCreateMode ? `REGRA 3 (MODO CRIAR COM VERSÍCULOS - PAISAGENS NATURAIS SEM HUMANOS):
ATENÇÃO OBRIGATÓRIA: Este pedido é do Modo Criar com Versículos (fundo de imagem para texto/post). A imagem DEVE SER EXCLUSIVAMENTE UMA PAISAGEM NATURAL BÍBLICA, SEM NENHUMA PESSOA, SEM SERES HUMANOS, SEM ROSTOS, SEM CORPOS E SEM FIGURAS HUMANAS.
Gere um prompt em inglês focado 100% em elementos de natureza inspiradora (céu, montanhas, vales, desertos, rios, mares, árvores, flores, luz solar divina, névoa, nascer do sol) e adicione OBRIGATORIAMENTE ao final do prompt: "serene scenic natural landscape, no people, no humans, empty nature background, peaceful biblical environment, 8k resolution".` : `REGRA 3 (ANATOMIA E OLHOS NATURAIS PERFEITOS):
Ao traduzir e enriquecer o pedido para o INGLÊS, crie uma descrição natural, fluida e de altíssima fidelidade.
- ANATOMIA E OLHOS NATURAIS (CRÍTICO): Os olhos devem ser humanos, anatômicos e totalmente naturais ("natural realistic human eyes, crystal-clear iris, anatomically accurate round pupils, natural realistic eye gaze, sharp eye focus"). NUNCA use olhos desalinhados, vesgos, pupilas deformadas ou íris borradas. Se duas pessoas estiverem na cena, especifique o olhar natural entre elas ("looking at each other with natural emotional connection, natural eye contact") ou olhando naturalmente para o cenário/câmera.
- COMPOSIÇÃO E ENQUADRAMENTO: Mantenha um enquadramento equilibrado de retrato (medium shot portrait or standard portrait composition, balanced facial proportions) para evitar deformação facial de lente super próxima.
- ILUMINAÇÃO E PELE: Iluminação natural e cristalina (bright soft natural daylight), cores vivas e pele limpa e realista.
- ESTILOS ESPECÍFICOS ([Estilo: ...]):
  * CINEMATOGRÁFICO: "A high-end cinematic movie still, medium shot portrait, crisp focal clarity on face, natural realistic human eyes, clear detailed iris and pupils, soft golden sunlight, anamorphic lens, shallow depth of field, vivid natural colors, 8k resolution."
  * ANIMAÇÃO 3D: "A beautiful 3D animated character illustration, Pixar and Disney studio art style, expressive face, clear aligned eyes, smooth 3D rendering, vibrant colors."
  * PIXEL ART: "Crisp 16-bit pixel art style, detailed retro video game graphics, clean pixel edges, nostalgic vibrant colors."
  * FOTORREALISMO / PADRÃO: "An award-winning ultra-realistic 8k DSLR portrait photograph, medium portrait composition, crystal clear focus on face, natural realistic human eyes, authentic iris detail and pupils, natural eye gaze, pristine clean skin, bright natural daylight, 85mm lens f/2, authentic historical accuracy."
  * PINTURA A ÓLEO: "Master classical oil painting on canvas, refined elegant brushwork, luminous lighting, clear detailed facial features and expressive natural eyes, museum fine art quality."
  * AQUARELA: "Delicate watercolor painting on textured paper, soft fluid pastel colors, clean artistic outlines, graceful watercolor washes."
  * ANIME: "High quality Studio Ghibli inspired anime illustration, clean line art, luminous soft lighting, vibrant colors, expressive clear eyes."
  * ILUSTRAÇÃO BÍBLICA SACRA: "Sacred illuminated manuscript artwork, royal gold leaf accents, stained glass radiance, reverent biblical classical art."`}

REGRA 4 (Saída Limpa): Responda APENAS com o prompt final refinado em INGLÊS em um único parágrafo fluido. Não inclua aspas, preâmbulos, avisos ou explicações. Se for inadequado, responda APENAS: "BLOQUEADO".`;

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

      // 5. Geração de imagens via Pollinations.ai usando modelo FLUX para máxima fidelidade e realismo
      let finalPrompt = enhancedPrompt;
      if (source === 'create') {
        if (!enhancedPrompt.toLowerCase().includes("no people") && !enhancedPrompt.toLowerCase().includes("no humans")) {
          finalPrompt = `${enhancedPrompt}, serene scenic natural landscape, no people, no humans, empty nature background, peaceful biblical environment, bright soft natural daylight, high resolution 8k`;
        }
      } else if (!enhancedPrompt.toLowerCase().includes("natural human eyes") && !/pixel art|watercolor|anime|3d animated/i.test(enhancedPrompt)) {
        finalPrompt = `${enhancedPrompt}, natural realistic human eyes, crystal clear iris and pupils, anatomically correct natural gaze, medium portrait framing, clean skin, bright soft natural daylight, high resolution`;
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
