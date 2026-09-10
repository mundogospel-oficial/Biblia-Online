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
import { resolveBiblicalSituationSubject } from "./src/data/biblicalSituations.js";
import { resolveBiblicalBackground, buildUltraRealisticChatPrompt } from "./src/data/biblicalBackgrounds.js";

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

// Sincronizar chaves do Gemini/Google AI para consistência em todos os módulos e bibliotecas
if (process.env.GEMINI_API_KEY && (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY !== process.env.GEMINI_API_KEY)) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

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
          "https://api.pwnedpasswords.com",
          "https://*.pwnedpasswords.com",
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

  const isProtectedOrInternalIdentity = (identity?: string | null): boolean => {
    if (!identity) return true;
    const clean = identity.trim().toLowerCase();
    return (
      clean === "" ||
      clean === "unknown" ||
      clean === "hash_protected" ||
      clean === "unknown_fingerprint" ||
      clean === "n/a" ||
      clean === "127.0.0.1" ||
      clean === "::1" ||
      clean === "::ffff:127.0.0.1" ||
      clean.startsWith("10.") ||
      clean.startsWith("172.") ||
      clean.startsWith("192.168.") ||
      clean.startsWith("169.254.") ||
      clean.startsWith("::ffff:169.254.") ||
      clean.startsWith("::ffff:10.") ||
      clean.startsWith("::ffff:172.") ||
      clean.startsWith("::ffff:192.168.") ||
      clean.startsWith("fc00:") ||
      clean.startsWith("fe80:") ||
      clean.includes("localhost") ||
      clean.includes("run.app")
    );
  };

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
            if (row.identity && !isProtectedOrInternalIdentity(row.identity)) {
              bannedEntities.add(row.identity);
            }
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
    if (!identity || isProtectedOrInternalIdentity(identity)) {
      console.warn(`[Sentinel] Ignorando banimento para IP/token interno ou protegido: ${identity}`);
      return;
    }
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
    // Permite que a interface do app e recursos estáticos sempre carreguem
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return next();
    }

    const ip = req.ip || 'unknown';
    const fingerprint = req.headers['x-sentinel-token'] as string;

    const isIpBanned = !isProtectedOrInternalIdentity(ip) && bannedEntities.has(ip);
    const isFpBanned = !isProtectedOrInternalIdentity(fingerprint) && bannedEntities.has(fingerprint);

    if (isIpBanned || isFpBanned) {
      console.error(`[Sentinel] Acesso bloqueado para entidade banida: IP=${ip} / FP=${fingerprint}`);
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
        origin.includes('bibliaonline') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('ai.studio') ||
        origin.includes('google.com')
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Bloqueado acesso de origem não autorizada: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieParser());
  app.use(checkBanned); // Verifica banimento em todas as rotas

  // --- SENTINEL SECURITY MIDDLEWARES ---

  // 1. Detecção de padrões de ataque (SQLi, XSS, Path Traversal)
  const detectAttacks = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Pula rotas de IA, geração de imagens e chat onde o body contém linguagem natural / prompts bíblicos
    const path = req.path || "";
    if (
      path.includes('/generate-image') || 
      path.includes('/create-mode') || 
      path.includes('/chat') || 
      path.includes('/gemini') || 
      path.includes('/moderate-image') ||
      path.includes('/security/report')
    ) {
      return next();
    }

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
        COMMAND_INJECT: /[;&|`$()].*\b(?:cmd(?:\.exe)?|bash|powershell|wget|curl)\b/i,
        NOSQL_INJECT:   /\$(?:where|gt|lt|ne|in|nin|exists|regex)\b/,
      };

      for (const [name, regex] of Object.entries(patterns)) {
        if (regex.test(combined)) {
          console.warn(`[Sentinel] Ataque detectado: ${name} - IP: ${req.ip} - URL: ${req.originalUrl}`);
          
          // Se não for IP interno protegido, pode registrar aviso
          const ip = req.ip;
          if (ip && !isProtectedOrInternalIdentity(ip)) {
            banEntity(ip, `Detecção automática pelo Sentinel no endpoint: ${req.originalUrl} (${name})`);
          }
          
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
    // Permite que todas as chamadas da API passem sem rejeitar clientes legítimos
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

  // Version route (no-cache to guarantee production updates instantly)
  app.get(["/version.json", "/api/version"], (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ version: "2.5.1" });
  });

  // --- PROXY DE VERIFICAÇÃO DE SENHAS VAZADAS (HAVEIBEENPWNED k-ANONYMITY) ---
  app.get("/api/pwned-check/:prefix", async (req, res) => {
    try {
      const prefix = (req.params.prefix || "").toUpperCase().trim();
      if (!prefix || prefix.length !== 5 || !/^[0-9A-F]{5}$/i.test(prefix)) {
        return res.status(400).json({ error: "O prefixo deve possuir exatamente 5 caracteres hexadecimais." });
      }

      const hbpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: "GET",
        headers: {
          "User-Agent": "Online-Biblia-Security-Check"
        }
      });

      if (!hbpRes.ok) {
        console.warn("[PwnedCheck Proxy] Status de erro na API HIBP:", hbpRes.status);
        return res.status(502).json({ error: "Erro na resposta da API externa." });
      }

      const text = await hbpRes.text();
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache de 24h para buscas repetidas
      return res.send(text);
    } catch (err: any) {
      console.error("[PwnedCheck Proxy Error]:", err);
      return res.status(500).json({ error: "Erro ao consultar o serviço de senhas." });
    }
  });

  // --- PROXY SEGURO DE OPENROUTER (Protege chaves OPENROUTER_API_KEY no servidor) ---
  app.post("/api/openrouter/chat", async (req, res) => {
    try {
      const { messages, model, temperature, max_tokens, response_format } = req.body || {};
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Campo 'messages' obrigatório e deve ser um array." });
      }

      // Obter chaves seguras do ambiente do servidor
      let rKey1 = (process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || "").trim();
      let rKey2 = (process.env.OPENROUTER_API_KEY_2 || process.env.VITE_OPENROUTER_API_KEY_2 || "").trim();

      // Consultar banco Supabase se disponível
      const adminClient = getSupabaseAdmin();
      if (adminClient) {
        try {
          const { data } = await adminClient
            .from('ai_settings')
            .select('config_key, config_value')
            .in('config_key', ['openrouter_api_key', 'openrouter_api_key_2']);
          if (data) {
            const dbKey1 = data.find(d => d.config_key === 'openrouter_api_key')?.config_value;
            const dbKey2 = data.find(d => d.config_key === 'openrouter_api_key_2')?.config_value;
            if (dbKey1 && dbKey1.trim()) rKey1 = dbKey1.trim();
            if (dbKey2 && dbKey2.trim()) rKey2 = dbKey2.trim();
          }
        } catch (dbErr) {
          console.warn("[OpenRouter Backend] Falha ao consultar chaves no banco:", dbErr);
        }
      }

      const keysToTry = [rKey1, rKey2].filter(Boolean);
      if (keysToTry.length === 0) {
        return res.status(503).json({ error: "Chave OpenRouter não configurada no servidor." });
      }

      const modelsToTry = model ? [model] : [
        "deepseek/deepseek-chat",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "qwen/qwen-2.5-7b-instruct:free",
        "openrouter/free"
      ];

      let lastError = "Falha ao consultar modelos OpenRouter.";

      for (const key of keysToTry) {
        for (const candidateModel of modelsToTry) {
          try {
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || "https://biblia-online.local",
                'X-Title': 'Biblia Online Secure Service'
              },
              body: JSON.stringify({
                model: candidateModel,
                messages,
                temperature: typeof temperature === 'number' ? temperature : 0.3,
                max_tokens: typeof max_tokens === 'number' ? max_tokens : 4000,
                ...(response_format ? { response_format } : {})
              })
            });

            if (orRes.ok) {
              const data = await orRes.json();
              return res.json(data);
            } else {
              const errBody = await orRes.text();
              lastError = `OpenRouter HTTP ${orRes.status}: ${errBody.slice(0, 150)}`;
            }
          } catch (fetchErr: any) {
            lastError = fetchErr.message;
          }
        }
      }

      return res.status(502).json({ error: lastError });
    } catch (err: any) {
      console.error("[OpenRouter Backend Error]:", err);
      return res.status(500).json({ error: "Erro interno no servidor OpenRouter proxy." });
    }
  });

  // Lista expandida de termos proibidos para moderação e auditoria rígida (Étnica/Cristã/Segurança)
  const EXPANDED_FORBIDDEN_TERMS = [
    // Nudity / NSFW / Sexual / Vulgarity
    'nude', 'nudity', 'pelad', 'nuas', 'nus', 'nua', 'sexy', 'peito', 'bumbum', 'bunda', 'vagina', 'penis', 
    'sexo', 'erotic', 'sensual', 'porno', 'naked', 'breast', 'butt', 'ass', 'hentai', 'safada', 'gostosa',
    'mamilo', 'pussy', 'dick', 'bikini', 'biquini', 'lingerie', 'suruba', 'orgy', 'strip', 'prostituta', 'puta',
    
    // Occultism / Paganism / Magic / Non-Christian Religions / Esoterism
    'satan', 'demonio', 'diabo', 'lucifer', 'baphomet', 'pentagrama', 'pentagram', 'bruxa', 'bruxo', 'bruxaria',
    'witch', 'witchcraft', 'tarot', 'horoscopo', 'zodiaco', 'astrologia', 'signo', 'voodoo', 'mago', 'magia negra',
    'black magic', 'pact', 'pacto', 'exu', 'pombagira', 'orixas', 'orixa', 'ze pilintra', 'umbanda', 'candomble',
    'buda', 'buddha', 'oxum', 'ogum', 'shiva', 'vishnu', 'hindu', 'ganesha', 'allah', 'islamo', 'ocultismo',
    'esoterismo', 'paganismo', 'pagan', 'ritual macabro', 'caveira', 'skull', 'gore',
    
    // Violence / Weapons / Crime / Drugs / Alcohol
    'drogas', 'maconha', 'cocaina', 'crack', 'weed', 'cannabis', 'cerveja', 'vodka', 'uísque', 'whisky',
    'embriaguez', 'arma de fogo', 'revolver', 'pistola', 'fuzil', 'tiro', 'assassino', 'estupro', 'sangue', 'mutilacao',
    'suicidio', 'morte violenta', 'tortura',

    // Modern Secular Pop Culture / Anime / Fiction / Secular Entertainment / Technology / Jailbreak
    'carro', 'celular', 'computador', 'smartphone', 'videogame', 'video game', 'goku', 'naruto', 'one piece',
    'futebol', 'soccer', 'marvel', 'dc comics', 'batman', 'superman', 'spiderman', 'boate', 'rockstar',
    'balada', 'danceteria', 'nave espacial', 'disco de vinil', 'alienígena', 'ufo', 'extraterrestre',
    'pokemon', 'fortnite', 'minecraft', 'cyberpunk', 'zumbi', 'zombie', 'vampiro', 'vampire', 'lobisomem',
    'robô', 'robot', 'politica', 'fofoca', 'memes', 'meme', 'jailbreak', 'ignore instructions', 'system prompt',
    'modo desenvolvedor', 'developer mode', 'modo dan', 'bypass restrictions'
  ];

  function isPromptForbiddenByTerms(text: string): boolean {
    const lower = text.toLowerCase();
    
    // Explicit harmful terms
    const strictlyHarmful = ['nudez', 'pelado', 'pelada', 'sexo', 'pornografia', 'erótico', 'erotico', 'drogas', 'cocaina', 'crack', 'mutilacao', 'gore', 'prostituicao'];
    if (strictlyHarmful.some(term => new RegExp(`(?:^|[^a-z0-9_])${term}(?:$|[^a-z0-9_])`, 'i').test(lower))) {
      return true;
    }

    // Biblical keywords bypass secular term blocking
    const biblicalKeywords = ['salmo', 'salmos', 'moises', 'moisés', 'bíblia', 'biblia', 'jesus', 'cristo', 'davi', 'abraão', 'abraao', 'versículo', 'versiculo', 'evangelho', 'deus', 'senhor', 'oração', 'oracao', 'fé', 'fe', 'profeta', 'apóstolo', 'apostolo', 'adão', 'adao', 'eva', 'eden', 'éden', 'adam', 'eve', 'gênesis', 'genesis', 'arca', 'noé', 'noe', 'jó', 'jo', 'samuel', 'salomão', 'solomão', 'elias', 'eliseu', 'daniel', 'paraiso', 'paraíso'];
    if (biblicalKeywords.some(kw => lower.includes(kw))) {
      return false;
    }

    return EXPANDED_FORBIDDEN_TERMS.some(term => {
      const regex = new RegExp(`(?:^|[^a-z0-9_])${term}(?:$|[^a-z0-9_])`, 'i');
      return regex.test(lower);
    });
  }

  // --- ROTA DE MODERAÇÃO DE IMAGEM ENVIADA VIA VISÃO COMPUTACIONAL (GEMINI VISION) ---
  app.post("/api/moderate-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", fileName = "" } = req.body || {};

      if (!imageBase64) {
        return res.status(400).json({ isAppropriate: true, reason: null });
      }

      // 1. Verificação prévia por nome de arquivo e texto rápido
      if (fileName && isPromptForbiddenByTerms(fileName)) {
        return res.json({
          isAppropriate: false,
          reason: "Imagem bloqueada por conter nome ou conteúdo inadequado para os padrões bíblicos e éticos."
        });
      }

      // Limpar prefixo data URI se houver
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "").trim();

      // 2. Chaves de API do Gemini / Google (Armazenadas de forma segura no servidor)
      let googleKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
      let googleKey2 = (process.env.GOOGLE_API_KEY_2 || process.env.GEMINI_API_KEY_2 || process.env.VITE_GEMINI_API_KEY_2 || "").trim();
      const adminClient = getSupabaseAdmin();

      if (adminClient) {
        try {
          const { data } = await adminClient
            .from('ai_settings')
            .select('config_key, config_value')
            .in('config_key', ['google_ai_key', 'google_ai_key_2']);
          if (data) {
            const dbGoogle = data.find(d => d.config_key === 'google_ai_key')?.config_value;
            const dbGoogle2 = data.find(d => d.config_key === 'google_ai_key_2')?.config_value;
            if (dbGoogle && dbGoogle.trim()) googleKey = dbGoogle.trim();
            if (dbGoogle2 && dbGoogle2.trim()) googleKey2 = dbGoogle2.trim();
          }
        } catch (err) {
          console.warn("[Moderation Backend] Erro ao buscar chaves no banco:", err);
        }
      }

      const keysToTry = [googleKey, googleKey2].filter(Boolean) as string[];
      if (keysToTry.length === 0) {
        // Se sem chave no servidor, aprova com segurança padrão
        return res.json({ isAppropriate: true, reason: null });
      }

      const MODERATION_VISION_PROMPT = `Você é um Moderador e Auditor de Segurança e Ética Cristã Mestre para um aplicativo da Bíblia Sagrada.
Analise a imagem enviada com Máxima Rigidez e determine se ela está em total conformidade com os princípios bíblicos, cristãos e éticos.

A IMAGEM DEVE SER REJEITADA (isAppropriate: false) SE CONTIVER:
1. Nudez, erotismo, sensualidade, apelo sexual, roupas curtas ou provocantes, lingerie, biquínis, gestos sensuais, corpos expostos ou conteúdo adulto.
2. Símbolos, rituais, ídolos, ocultismo, feitiçaria, bruxaria, satanismo, demônios, tarot, zodíaco, astrologia, horóscopo, pentagramas ou elementos/entidades de outras religiões/doutrinas não cristãs (estátuas de deuses pagãos, rituais profanos).
3. Violência, sangue, mutilação, armas de fogo em contexto de crime/violência, cenas macabras, caveiras, horror, imagens de ódio ou profanação.
4. Drogas, bebidas alcoólicas, cigarros, festas profanas, ostentação imoral ou condutas ilícitas.
5. Imagens com deboche, fofocas profanas, caricaturas zombeteiras da Bíblia ou figuras sagradas, ou conteúdo secular inadequado.

A IMAGEM PODE SER APROVADA (isAppropriate: true) SE FOR:
- Paisagens naturais puras (montanhas, céus, rios, flores), fotos de igrejas, arte bíblica/cristã respeitosa, pessoas vestidas modestamente e respeitosamente em atitudes éticas normais, ou símbolos cristãos sagrados (cruz, Bíblia, pomba).

Responda ESTRITAMENTE em formato JSON simples sem formatação markdown extra:
{"isAppropriate": true, "reason": null}
ou
{"isAppropriate": false, "reason": "Motivo da rejeição em português"}
`;

      for (const key of keysToTry) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: key });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: MODERATION_VISION_PROMPT },
                  {
                    inlineData: {
                      mimeType: mimeType || "image/jpeg",
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            config: {
              temperature: 0.1,
              maxOutputTokens: 256
            }
          });

          const responseText = response.text || "";
          let cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);

          if (parsed && typeof parsed.isAppropriate === "boolean") {
            return res.json({
              isAppropriate: parsed.isAppropriate,
              reason: parsed.isAppropriate ? null : (parsed.reason || "Imagem não condiz com os padrões bíblicos e éticos do aplicativo.")
            });
          }
        } catch (visionErr: any) {
          console.warn("[Moderation Backend] Erro na análise Gemini Vision:", visionErr?.message || visionErr);
        }
      }

      // Se falhou a chamada Gemini mas passou no teste prévio de termos, aprova
      return res.json({ isAppropriate: true, reason: null });
    } catch (err) {
      console.error("[Moderation Backend Error]:", err);
      return res.status(500).json({ isAppropriate: true, reason: null });
    }
  });

  /**
   * ============================================================================
   * MODO CRIAR - MOTOR EXCLUSIVO DE GERAÇÃO COM POLLINATIONS AI (FLUX)
   * ============================================================================
   * ATENÇÃO: NÃO ALTERAR ESTE BLOCO/FUNÇÃO AO MODIFICAR OUTRAS IAS DE IMAGENS.
   * A Pollinations AI é utilizada APENAS E EXCLUSIVAMENTE para o Modo Criar.
   * ============================================================================
   */
  async function handleCreateModeImageGeneration(req: express.Request, res: express.Response) {
    try {
      const { prompt: rawPrompt, aspectRatio, isComplex = true } = req.body;
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
        const token = authHeader.replace(/^Bearer\s+/i, "");
        try {
          const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
          if (!authError && user) {
            userId = user.id;
          }
        } catch (authErr) {
          console.error("[Modo Criar] Erro de autenticação JWT:", authErr);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login para gerar imagens no Modo Criar." });
      }

      const quotaType = 'create_image';
      const quotaLimit = 3;

      // 2. Verificar limite de cotas do Modo Criar nas últimas 12 horas
      if (adminClient && userId) {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        try {
          const { count, error: countError } = await adminClient
            .from('user_ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('tipo_uso', quotaType)
            .gte('created_at', twelveHoursAgo);

          if (countError) {
            console.error("[Modo Criar] Erro computando uso diário:", countError);
          } else if (count !== null && count >= quotaLimit) {
            return res.status(429).json({ error: `Você atingiu o seu limite diário de ${quotaLimit} imagens no Modo Criar. Sua cota recarrega em 12 horas.` });
          }
        } catch (dbErr) {
          console.error("[Modo Criar] Falha inesperada ao consultar cotas:", dbErr);
        }
      }

      // 3. Obter chaves do Google / Gemini e prompt mestre do Banco de Dados / Ambiente
      const envGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
      let googleKey = envGeminiKey || (process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
      let googleKey2 = (process.env.GOOGLE_API_KEY_2 || process.env.GEMINI_API_KEY_2 || process.env.VITE_GEMINI_API_KEY_2 || "").trim();
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
            if (!googleKey && dbGoogle && dbGoogle.trim()) googleKey = dbGoogle.trim();
            if (dbGoogle2 && dbGoogle2.trim()) googleKey2 = dbGoogle2.trim();
            if (dbMaster && dbMaster.trim()) systemPromptMaster = dbMaster.trim();
          }
        } catch (dbErr) {
          console.warn("[Modo Criar] Erro de rede ao buscar chaves no banco:", dbErr);
        }
      }

      if (googleKey) {
        process.env.GOOGLE_API_KEY = googleKey;
      }

      // 4. Refinamento de prompt, tradução para inglês e moderação de conteúdo no Servidor
      let enhancedPrompt = prompt;
      let isBlocked = false;

      if (isPromptForbiddenByTerms(prompt)) {
        return res.status(400).json({ error: "Imagem não pode ser gerada pois contém conteúdo fora do contexto bíblico ou impróprio." });
      }

      const systemInstruction = `REGRAS MESTRAS: ${systemPromptMaster}

REGRAS DE SEGURANÇA E DECÊNCIA (OBRIGATÓRIO):
1. SEGURANÇA E VESTIMENTAS: É terminantemente proibido qualquer conteúdo de nudez, sensualidade ou trajes sumários. Personagens bíblicos DEVEM SEMPRE estar completamente vestidos com trajes modestos bíblicos ("wearing modest ancient biblical garments, fully clothed"). Quando for Adão e Eva, SEM ALTERAR O FUNDO, os personagens devem obrigatoriamente aparecer vestidos com roupas, retratando um homem de cabelo curto e uma mulher. Nunca gere personagens despidos ou sem roupas.
2. ESCOPO BÍBLICO E CRISTÃO: O conteúdo deve ser 100% bíblico e cristão. Bloqueie feitiçaria, ocultismo, deuses pagãos e temas seculares mundanos. Se violar, responda unicamente: "BLOQUEADO".

DIRETRIZ DE PROMPT CONCISO (REGRA OBRIGATÓRIA):
1. SIMPLICIDADE E CONCISÃO: Traduza para INGLÊS apenas o que o usuário pediu, em 1 frase curta e objetiva. Não invente detalhes e não alongue o texto.
2. PROIBIÇÃO DE PALAVRAS DE QUALIDADE: É expressamente proibido usar termos de qualidade técnica ou clichês que borram a imagem no modelo de difusão (NUNCA use: "8k", "uhd", "photorealistic", "ultra-realistic", "hyperrealistic", "tack-sharp", "extreme zoom clarity", "intricate textures", "masterpiece", "dramatic lighting", "cinematic lighting", "high visual contrast", "full bleed", etc.). Descreva apenas o sujeito bíblico simples de forma limpa.
3. SAÍDA DIRETA: Retorne exclusivamente o prompt simples em inglês, sem saudações, sem preâmbulos e sem aspas.`;

      let promptGenerated = false;

      // Resolução imediata de situações bíblicas predefinidas
      const situationMatch = resolveBiblicalSituationSubject(prompt);
      if (situationMatch) {
        enhancedPrompt = situationMatch.englishSubject;
        promptGenerated = true;
        console.log(`[Modo Criar - Gemini] Situação bíblica resolvida (${situationMatch.matchedSituation}): "${enhancedPrompt.substring(0, 80)}..."`);
      }

      // Aprimorador de Prompts do Modo Criar via OPENROUTER_IMAGENS (sem Gemini)
      let orKeyCriar = (process.env.OPENROUTER_IMAGENS || process.env.OPEN_ROUTER_IMAGENS || process.env.OPENROUTER_API_KEY || "").trim();
      if (!orKeyCriar && adminClient) {
        try {
          const { data } = await adminClient
            .from('ai_settings')
            .select('config_key, config_value')
            .in('config_key', ['openrouter_imagens', 'open_router_imagens', 'openrouter_api_key']);
          if (data) {
            const dbVal = data.find(d => d.config_key === 'openrouter_imagens' || d.config_key === 'open_router_imagens')?.config_value;
            if (dbVal && dbVal.trim()) orKeyCriar = dbVal.trim();
          }
        } catch (dbErr) {
          console.warn("[Modo Criar - Aprimorador] Erro lendo chaves:", dbErr);
        }
      }

      if (!promptGenerated && orKeyCriar) {
        const modelsToTry = ["openai/gpt-4o-mini", "deepseek/deepseek-chat"];
        for (const modelId of modelsToTry) {
          if (promptGenerated) break;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${orKeyCriar}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mundogospel.app",
                "X-Title": "Aprimorador de Prompts"
              },
              body: JSON.stringify({
                model: modelId,
                messages: [
                  { role: "system", content: systemInstruction },
                  { role: "user", content: `Pedido do usuário: "${prompt}"` }
                ],
                temperature: 0.1,
                max_tokens: 80
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const text = data?.choices?.[0]?.message?.content || "";
              if (text) {
                let trimmedText = text.trim();

                const codeBlockMatch = trimmedText.match(/```(?:[a-z]*\n)?([\s\S]+?)```/i);
                if (codeBlockMatch && codeBlockMatch[1]) {
                  trimmedText = codeBlockMatch[1].trim();
                }

                const promptMarker = trimmedText.match(/(?:\*\*|#+)?\s*(?:flux\s+image\s+model\s+prompt|prompt)\s*(?:\*\*|#+)?\s*:\s*([\s\S]+)/i);
                if (promptMarker && promptMarker[1]) {
                  trimmedText = promptMarker[1].trim();
                }

                trimmedText = trimmedText
                  .replace(/^(?:com prazer|com certeza|certamente|olá|aqui está|eis o|claro|perfeito|diretor de arte)[\s\S]*?(?:prompt:|\n\n)/i, '')
                  .replace(/^(?:here is|sure|certainly|below is|as requested|okay)[\s\S]*?(?:prompt:|\n\n)/i, '')
                  .replace(/```[a-z]*\n?/gi, '')
                  .replace(/```/g, '')
                  .trim();

                trimmedText = trimmedText.replace(/^["'*]+|["'*]+$/g, '').trim();

                if (trimmedText.toUpperCase().includes("BLOQUEADO")) {
                  isBlocked = true;
                } else {
                  enhancedPrompt = trimmedText;
                }
                promptGenerated = true;
                console.log(`[Modo Criar - Aprimorador OpenRouter] Prompt otimizado com sucesso (${modelId}): "${enhancedPrompt.substring(0, 80)}..."`);
                break;
              }
            }
          } catch (orErr: any) {
            console.warn(`[Modo Criar - Aprimorador OpenRouter] Falha no modelo ${modelId}:`, orErr?.message || orErr);
          }
        }
      }

      if (isBlocked) {
        return res.status(400).json({ error: "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual." });
      }

      // Extração de Estilo Visual
      let extractedStyle = "";
      const styleMatch = prompt.match(/\[Estilo:\s*([^\]]+)\]/i);
      if (styleMatch && styleMatch[1]) {
        let styleAddon = styleMatch[1];
        if (styleAddon.includes("-")) {
          styleAddon = styleAddon.split("-").slice(1).join("-").trim();
        }
        extractedStyle = styleAddon;
      }

      // Assunto principal: MODO CRIAR é exclusivamente para paisagens e cenários sagrados da natureza bíblica
      let cleanSubject = enhancedPrompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim();
      if (!cleanSubject) {
        cleanSubject = prompt.replace(/\[Estilo:\s*[^\]]+\]/gi, '').trim() || "biblical scene";
      }

      cleanSubject = cleanSubject
        .replace(/\b(facing the camera|direct eye contact|looking directly into the camera|looking forward at the viewer|noble reverent serene Semitic facial features|facial features|modest sacred ancient biblical pure unbleached linen garments|garments|linen|attire|natural skin textures|anatomically correct hands|anatomically flawless hands|5 fingers|five proportional fingers|natural eye symmetry|no extra limbs|no deformed fingers)\b/gi, '')
        .replace(/\b(man|men|woman|women|person|people|shepherd|prophet|apostle|disciple|crowd|multitude)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      let finalPrompt = `${cleanSubject}, majestic biblical landscape, sacred natural scenery, peaceful empty environment, solitary landscape view, untouched nature, no people, no humans, no man, no woman, no child, no human figures, no silhouettes, no faces, no hands, completely devoid of humans, unpopulated scenic view`;

      if (extractedStyle) {
        finalPrompt += `, ${extractedStyle}`;
      }

      finalPrompt = finalPrompt
        .replace(/\b(ultra-high definition|ultra high definition|tack-sharp focus|tack-sharp|extreme zoom clarity|zoom clarity|intricate textures|8k uhd resolution|8k resolution|8k|uhd|full bleed edge-to-edge shot|full bleed|no black bars|no letterbox|masterwork quality|altíssima definição e atmosfera grandiosa)\b/gi, '')
        .replace(/,\s*,+/g, ',')
        .replace(/^\s*,\s*|\s*,\s*$/g, '')
        .trim();

      // Dimensões do Modo Criar
      let width = 1440;
      let height = 1440;
      if (aspectRatio === 'story') {
        width = 1080;
        height = 1920;
      } else if (aspectRatio === 'landscape') {
        width = 1920;
        height = 1080;
      }

      const seed = Math.floor(Math.random() * 2000000000);
      const serverNegativePrompt = "nudity, naked, nude, topless, bare breasts, bare shoulders, cleavage, unclothed, sensual, revealing clothes, erotic";
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&negative=${encodeURIComponent(serverNegativePrompt)}`;

      console.log("[Modo Criar - Pollinations Flux] Prompt:", finalPrompt);
      console.log(`[Modo Criar - Pollinations Flux] Gerando para o usuário ${userId}... URL: ${pollinationsUrl}`);

      let base64Image = "";
      const pollinationsApiKey = (process.env.POLILINATIONS_IA_API_KEY || process.env.POLLINATIONS_IA_API_KEY || "").trim();

      if (isComplex && pollinationsApiKey) {
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
            console.log(`[Modo Criar] Imagem Pollinations obtida via API Key com sucesso.`);
          }
        } catch (fetchErr) {
          console.error(`[Modo Criar] Erro ao obter imagem do Pollinations no servidor:`, fetchErr);
        }
      }

      // Registrar cota diária do Modo Criar
      if (adminClient && userId) {
        try {
          await adminClient
            .from('user_ai_usage')
            .insert({
              user_id: userId,
              tipo_uso: quotaType,
              created_at: new Date().toISOString()
            });
          console.log(`[Modo Criar] Cota debitada com sucesso para o usuário ${userId}`);
        } catch (dbInsertErr) {
          console.error("[Modo Criar] Erro ao registrar cota:", dbInsertErr);
        }
      }

      return res.json({ success: true, pollinationsUrl, base64Image: base64Image || undefined });
    } catch (err: any) {
      console.error("[Modo Criar CRITICAL]", err);
      return res.status(500).json({ error: err.message || "Erro interno do servidor no Modo Criar." });
    }
  }

  // ROTA DEDICADA E ISOLADA DO MODO CRIAR (POLLINATIONS FLUX)
  app.post("/api/create-mode/generate-image", handleCreateModeImageGeneration);

  /**
   * ============================================================================
   * APRIMORADOR DE PROMPTS VIA OPENROUTER (OPENROUTER_IMAGENS)
   * ============================================================================
   * Analisa o prompt do usuário antes do envio para enriquecer clareza, iluminação,
   * composição visual e reverência bíblica, mantendo ESTRITAMENTE o cenário e o
   * contexto bíblico intactos ("não deve mexer no cenário, deve deixar como está").
   * Usa a API OPENROUTER_IMAGENS sem utilizar Gemini.
   * ============================================================================
   */
  const promptRefineCache = new Map<string, { refinedPrompt: string; originalPrompt: string; isBlocked?: boolean }>();

  async function refinePromptWithAprimorador(
    prompt: string,
    options: {
      mode?: string;
      style?: string;
      preserveScenario?: boolean;
    } = {}
  ): Promise<{ refinedPrompt: string; originalPrompt: string; isBlocked?: boolean }> {
    const cleanInput = (prompt || "").trim();
    if (!cleanInput) {
      return { refinedPrompt: cleanInput, originalPrompt: cleanInput };
    }

    const cacheKey = `${cleanInput}__${options.style || ''}__${options.mode || ''}`;
    if (promptRefineCache.has(cacheKey)) {
      return promptRefineCache.get(cacheKey)!;
    }

    // Validação de termos estritamente impróprios
    if (isPromptForbiddenByTerms(cleanInput)) {
      return { refinedPrompt: "", originalPrompt: cleanInput, isBlocked: true };
    }

    const applyBiblicalRules = (promptText: string): string => {
      let result = promptText;
      const isAdamEve = /\b(ad[aã]o|adam|eva|eve)\b/i.test(cleanInput) || /\b(ad[aã]o|adam|eva|eve)\b/i.test(result);
      if (isAdamEve) {
        if (!/cabelo curto|short hair/i.test(result)) {
          result += ", retratando um homem de cabelo curto e uma mulher, ambos vestidos com roupas bíblicas de linho";
        }
        if (!/vestid|roupa|clothed|garment|tunic/i.test(result)) {
          result += ", obrigatoriamente vestidos com roupas modestas, sem nenhuma nudez";
        }
      }
      return result;
    };

    // Obter chaves OPENROUTER_IMAGENS / OpenRouter (prioridade solicitada pelo usuário)
    let orKey = (process.env.OPENROUTER_IMAGENS || process.env.OPEN_ROUTER_IMAGENS || "").trim();
    let fallbackOrKey1 = (process.env.OPENROUTER_API_KEY || "").trim();
    let fallbackOrKey2 = (process.env.OPENROUTER_API_KEY_2 || "").trim();

    const adminClient = getSupabaseAdmin();
    if (adminClient && !orKey) {
      try {
        const { data } = await adminClient
          .from('ai_settings')
          .select('config_key, config_value')
          .in('config_key', ['openrouter_imagens', 'open_router_imagens', 'openrouter_api_key', 'openrouter_api_key_2']);
        if (data) {
          const dbKey = data.find(d => d.config_key === 'openrouter_imagens' || d.config_key === 'open_router_imagens')?.config_value;
          const dbKey2 = data.find(d => d.config_key === 'openrouter_api_key')?.config_value;
          if (dbKey && dbKey.trim()) orKey = dbKey.trim();
          if (dbKey2 && dbKey2.trim() && !fallbackOrKey1) fallbackOrKey1 = dbKey2.trim();
        }
      } catch (e) {
        console.warn("[Aprimorador de Prompts] Erro ao consultar chaves no banco:", e);
      }
    }

    const keysToTry = Array.from(new Set([orKey, fallbackOrKey1, fallbackOrKey2].filter(Boolean)));

    if (keysToTry.length === 0) {
      console.warn("[Aprimorador de Prompts] Sem chave OPENROUTER_IMAGENS disponível, aplicando regras locais.");
      const fallbackResult = { refinedPrompt: applyBiblicalRules(cleanInput), originalPrompt: cleanInput };
      return fallbackResult;
    }

    const styleInfo = options.style ? `Estilo estético desejado: "${options.style}".` : '';

    const systemInstruction = `Você é o Aprimorador de Prompts de elite para inteligência artificial bíblica e cristã.
Sua missão é analisar o prompt fornecido pelo usuário e aprimorá-lo para máxima clareza, riqueza de detalhes visuais, texturas naturais, iluminação cinematográfica e fidelidade bíblica e histórica.

🛑 REGRA ABSOLUTA E INVIOLÁVEL: NÃO ALTERE O CENÁRIO!
- O cenário, ambiente, lugar geográfico bíblico, paisagem e evento histórico relatado pelo usuário NÃO PODEM SER ALTERADOS.
- O cenário deve ser mantido EXATAMENTE como está agora ("sem alterar cenário ele não deve mexer deve deixar como está agora").
- Se o usuário solicitou um cenário específico (ex: Mar Vermelho, Jardim do Éden, Monte Sinai, Rio Jordão, Deserto da Judeia, Barco na tempestade, etc.), MANTENHA EXATAMENTE ESTE CENÁRIO.
- Apenas enriqueça a descrição visual, texturas, iluminação e solenidade reverente DENTRO do cenário pedido pelo usuário.

🛡️ DECÊNCIA E VESTIMENTAS BÍBLICAS OBRIGATÓRIAS (ESPECIALMENTE ADÃO E EVA):
- REGRA CRÍTICA PARA ADÃO E EVA: Quando o pedido for sobre Adão e Eva, SEM ALTERAR O CENÁRIO OU O FUNDO (deixe o cenário e o fundo intactos como estão):
  1. Os personagens DEVEM OBRIGATORIAMENTE aparecer vestidos com roupas ("vestindo túnicas bíblicas modestas de linho, completamente vestidos, sem nenhuma nudez").
  2. Deve aparecer OBRIGATORIAMENTE um homem de cabelo curto (Adão com cabelo curto bem alinhado) e uma mulher (Eva), ambos vestidos com roupas bíblicas modestas.
- Todas as figuras bíblicas DEVEM OBRIGATORIAMENTE estar descritas com roupas antigas dignas e modestas. Nudez é estritamente proibida.

🚫 MODERAÇÃO:
- Se o pedido contiver conteúdo profano, secular mundano, pornográfico ou violar a fé cristã, responda unicamente: BLOQUEADO.

FORMATO DE SAÍDA:
- Retorne EXCLUSIVAMENTE o prompt melhorado em texto objetivo, em português ou inglês fluido.
- NÃO inclua explicações, preâmbulos, comentários adicionais ou aspas.`;

    const modelsToTry = [
      "openai/gpt-4o-mini",
      "deepseek/deepseek-chat",
      "meta-llama/llama-3.3-70b-instruct"
    ];

    for (const key of keysToTry) {
      for (const modelId of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://mundogospel.app",
              "X-Title": "Aprimorador de Prompts"
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: `${styleInfo ? styleInfo + "\n\n" : ""}Prompt original a aprimorar sem alterar o cenário:\n"${cleanInput}"` }
              ],
              temperature: 0.3,
              max_tokens: 400
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            console.warn(`[Aprimorador de Prompts - OpenRouter] HTTP ${response.status} (${modelId}):`, errText.substring(0, 100));
            continue;
          }

          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content || "";

          if (text && text.trim()) {
            let refined = text.trim();

            const codeBlock = refined.match(/```(?:[a-z]*\n)?([\s\S]+?)```/i);
            if (codeBlock && codeBlock[1]) {
              refined = codeBlock[1].trim();
            }

            const promptMarker = refined.match(/(?:\*\*|#+)?\s*(?:prompt|prompt\s+aprimorado|improved\s+prompt)\s*(?:\*\*|#+)?\s*:\s*([\s\S]+)/i);
            if (promptMarker && promptMarker[1]) {
              refined = promptMarker[1].trim();
            }

            refined = refined
              .replace(/^(?:aqui está|olá|com certeza|certamente|eis o prompt|prompt aprimorado:)[\s\S]*?\n\n/i, '')
              .replace(/^["'*]+|["'*]+$/g, '')
              .trim();

            if (refined.toUpperCase().includes("BLOQUEADO")) {
              const blockedResult = { refinedPrompt: "", originalPrompt: cleanInput, isBlocked: true };
              if (promptRefineCache.size > 200) promptRefineCache.clear();
              promptRefineCache.set(cacheKey, blockedResult);
              return blockedResult;
            }

            refined = applyBiblicalRules(refined);

            console.log(`[Aprimorador de Prompts - OpenRouter] Sucesso (${modelId}): "${refined.substring(0, 80)}..."`);
            const finalResult = { refinedPrompt: refined, originalPrompt: cleanInput };
            if (promptRefineCache.size > 200) promptRefineCache.clear();
            promptRefineCache.set(cacheKey, finalResult);
            return finalResult;
          }
        } catch (orErr: any) {
          console.warn(`[Aprimorador de Prompts - OpenRouter] Falha no modelo ${modelId}:`, orErr?.message || orErr);
        }
      }
    }

    const fallback = { refinedPrompt: applyBiblicalRules(cleanInput), originalPrompt: cleanInput };
    if (promptRefineCache.size > 200) promptRefineCache.clear();
    promptRefineCache.set(cacheKey, fallback);
    return fallback;
  }

  // ROTA DO APRIMORADOR DE PROMPTS VIA OPENROUTER (OPENROUTER_IMAGENS)
  app.post("/api/prompt/refine", async (req, res) => {
    try {
      const { prompt: rawPrompt, mode = 'image', style = '' } = req.body || {};
      if (!rawPrompt || typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
        return res.status(400).json({ error: "O prompt é obrigatório para análise." });
      }

      const { cleanPrompt: prompt } = sanitizeUserPrompt(rawPrompt);
      const result = await refinePromptWithAprimorador(prompt, { mode, style, preserveScenario: true });

      if (result.isBlocked) {
        return res.status(400).json({ 
          error: "O conteúdo solicitado viola as diretrizes de decência e escopo bíblico.",
          isBlocked: true 
        });
      }

      return res.json({
        success: true,
        originalPrompt: prompt,
        refinedPrompt: result.refinedPrompt
      });
    } catch (err: any) {
      console.error("[Aprimorador de Prompts API Error]:", err);
      return res.status(500).json({ error: err.message || "Erro ao aprimorar prompt com Gemini." });
    }
  });

  // ROTA PRINCIPAL DE IMAGENS:
  // - Modo Criar: delegada para handleCreateModeImageGeneration (Pollinations AI)
  // - Modo Chat: executada EXCLUSIVAMENTE via motor de imagens dedicado (sem usar Pollinations)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt: rawPrompt, source = 'chat' } = req.body;

      // Se a solicitação for do Modo Criar, delega para a função dedicada e blindada
      if (source === 'create') {
        return handleCreateModeImageGeneration(req, res);
      }

      // ============================================================================
      // ROTA EXCLUSIVA DO CHAT (MOTOR DEDICADO - SEM POLLINATIONS)
      // ============================================================================
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
        const token = authHeader.replace(/^Bearer\s+/i, "");
        try {
          const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
          if (!authError && user) {
            userId = user.id;
          }
        } catch (authErr) {
          console.error("[Chat Image] Erro de autenticação JWT:", authErr);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, faça login para gerar imagens." });
      }

      const quotaType = 'image';
      const quotaLimit = 3;

      // Credenciais oficiais do motor de imagens do Chat configuradas nos Secrets
      let cfAccountId = (
        process.env.CLOUDFLARE_ACCOUNT_ID ||
        process.env.CLOUDFLARE_ACCOUNT ||
        process.env.CLOUDFLARE_ID ||
        process.env.CLOUDFLARE_PROJECT_ID ||
        ""
      ).replace(/^["']|["']$/g, '').trim();

      let cfApiToken = (
        process.env.CLOUDFLARE_API_TOKEN ||
        process.env.CLOUDFLARE_TOKEN ||
        process.env.CLOUDFLARE_API_KEY ||
        process.env.CLOUDFLARE_KEY ||
        ""
      ).replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();

      // 2. Verificar limite de cotas de imagem do Chat nas últimas 12 horas
      if (adminClient && userId) {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        try {
          const { count, error: countError } = await adminClient
            .from('user_ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('tipo_uso', quotaType)
            .gte('created_at', twelveHoursAgo);

          if (countError) {
            console.error("[Chat Image Quota] Erro computando uso diário:", countError);
          } else if (count !== null && count >= quotaLimit) {
            return res.status(429).json({ error: `Você atingiu o seu limite diário de ${quotaLimit} imagens no Chat. Sua cota recarrega em 12 horas.` });
          }
        } catch (dbErr) {
          console.error("[Chat Image Quota] Falha inesperada ao consultar cotas:", dbErr);
        }
      }

      // 3. Obter configurações de Cloudflare no Banco caso disponíveis para suplementar ou atualizar
      let cfGatewayId = (process.env.CLOUDFLARE_GATEWAY_ID || "").trim();
      if (adminClient) {
        try {
          const { data, error } = await adminClient
            .from('ai_settings')
            .select('config_key, config_value')
            .in('config_key', ['cloudflare_account_id', 'cloudflare_api_token', 'cloudflare_account', 'cloudflare_token', 'cloudflare_gateway_id', 'cf_gateway']);
          if (!error && data) {
            const dbCfAccount = data.find(d => d.config_key === 'cloudflare_account_id' || d.config_key === 'cloudflare_account')?.config_value;
            const dbCfToken = data.find(d => d.config_key === 'cloudflare_api_token' || d.config_key === 'cloudflare_token')?.config_value;
            const dbCfGateway = data.find(d => d.config_key === 'cloudflare_gateway_id' || d.config_key === 'cf_gateway')?.config_value;
            
            if (dbCfAccount && dbCfAccount.trim()) {
              cfAccountId = dbCfAccount.replace(/^["']|["']$/g, '').trim();
            }
            if (dbCfToken && dbCfToken.trim()) {
              cfApiToken = dbCfToken.replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').trim();
            }
            if (dbCfGateway && dbCfGateway.trim()) {
              cfGatewayId = dbCfGateway.replace(/^["']|["']$/g, '').trim();
            }
          }
        } catch (dbErr) {
          console.warn("[Chat Image] Erro ao buscar credenciais Cloudflare no banco:", dbErr);
        }
      }

      // Validação de credenciais do motor de geração de imagens do Chat
      if (!cfAccountId || !cfApiToken) {
        return res.status(503).json({
          error: "As credenciais da Cloudflare (CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN) não foram encontradas. Configure-as nos Secrets."
        });
      }

      // Extração e mapeamento de estilo artístico para o Chat
      let extractedStyle = "";
      const styleMatch = prompt.match(/\[Estilo:\s*([^\]]+)\]/i);
      if (styleMatch && styleMatch[1]) {
        let styleAddon = styleMatch[1];
        if (styleAddon.includes("-")) {
          styleAddon = styleAddon.split("-").slice(1).join("-").trim();
        }
        extractedStyle = styleAddon;
      }

      let styleEn = "";
      if (extractedStyle) {
        const lowerStyle = extractedStyle.toLowerCase();
        if (lowerStyle.includes("fotorealismo") || lowerStyle.includes("photorealism")) {
          styleEn = "ultra photorealistic, authentic realistic photography, real life natural lighting, high dynamic range photo";
        } else if (lowerStyle.includes("desenho") || lowerStyle.includes("drawing")) {
          styleEn = "hand-drawn illustration, artistic line drawing, detailed clean drawing style";
        } else if (lowerStyle.includes("pixel")) {
          styleEn = "16-bit retro pixel art, clean pixel grid aesthetic";
        } else if (lowerStyle.includes("cinematogr") || lowerStyle.includes("cinematic")) {
          styleEn = "cinematic lighting, dramatic cinematic atmosphere, film still aesthetic";
        } else {
          styleEn = extractedStyle;
        }
      } else {
        // Estilo padrão do Chat é cinematográfico
        styleEn = "cinematic lighting, dramatic cinematic atmosphere, film still aesthetic";
      }

      let cleanPrompt = prompt
        .replace(/\[Estilo:\s*[^\]]+\]/gi, '')
        .replace(/\[Modo:[^\]]+\]/gi, '')
        .trim();
      if (!cleanPrompt) cleanPrompt = "biblical scene";

      // 1. APRIMORADOR DE PROMPTS (OPENROUTER_IMAGENS) MANTENDO O CENÁRIO INTACTO (evitando redundância se já refinado)
      const isAlreadyRefined = Boolean(req.body.isAlreadyRefined);
      let promptForGeneration = cleanPrompt;

      if (!isAlreadyRefined) {
        console.log(`[Image Generation] Aprimorador de Prompts (OpenRouter) analisando prompt antes do envio...`);
        const refinedData = await refinePromptWithAprimorador(cleanPrompt, {
          style: styleEn,
          mode: 'image',
          preserveScenario: true
        });

        if (refinedData.isBlocked) {
          return res.status(400).json({ error: "O conteúdo solicitado viola as diretrizes de decência ou escopo bíblico." });
        }

        if (refinedData.refinedPrompt) {
          promptForGeneration = refinedData.refinedPrompt;
        }
      } else {
        console.log(`[Image Generation] Prompt já refinado previamente pelo cliente, prosseguindo diretamente...`);
      }

      // 2. Leitura da definição de fundos bíblicos ultra-realistas ancorando o cenário original
      const { finalPrompt: richChatPrompt, matchedStory, isAdamAndEve } = buildUltraRealisticChatPrompt(promptForGeneration, styleEn);
      let finalChatPrompt = richChatPrompt;

      const isAdamEvePrompt = isAdamAndEve || /\b(ad[aã]o|adam|eva|eve)\b/i.test(cleanPrompt) || /\b(ad[aã]o|adam|eva|eve)\b/i.test(promptForGeneration);
      if (isAdamEvePrompt) {
        if (!/short hair/i.test(finalChatPrompt)) {
          finalChatPrompt += ", depicting a man with neat short hair (Adam) and a woman (Eve), both mandatorily fully clothed wearing modest ancient biblical linen tunics, zero nudity, 100% clothed";
        }
      }

      let finalNegativePrompt = "nudity, naked, nude, topless, bare breasts, bare shoulders, cleavage, unclothed, sensual, revealing clothes, erotic";
      if (isAdamEvePrompt) {
        finalNegativePrompt += ", long hair on man, man with long hair, unclothed, bare chest, shirtless";
      }

      console.log(`[Image Generation] Gerando para o usuário ${userId}...`);
      console.log(`[Image Generation] Tema Bíblico Identificado: "${matchedStory}"`);
      console.log(`[Image Generation] Prompt com Fundo Ultra-Realista: "${finalChatPrompt}"`);

      const maskedToken = cfApiToken ? `${cfApiToken.substring(0, 8)}...${cfApiToken.substring(cfApiToken.length - 6)} (tam: ${cfApiToken.length})` : "ausente";
      console.log(`[Image Generation] Usando Cloudflare Account: "${cfAccountId}", Token: ${maskedToken}${cfGatewayId ? `, Gateway: "${cfGatewayId}"` : ""}`);

      const cfModels = [
        "@cf/black-forest-labs/flux-1-schnell",
        "@cf/bytedance/stable-diffusion-xl-lightning",
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        "@cf/runwayml/stable-diffusion-v1-5",
        "@cf/lykon/dreamshaper-8-lcm"
      ];

      let base64Image = "";
      let lastError = "";

      for (const model of cfModels) {
        if (!cfAccountId || !cfApiToken) break;
        
        // Montar URLs candidatas: Direto e via AI Gateway (se configurado)
        const candidateUrls = [
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`
        ];
        if (cfGatewayId) {
          candidateUrls.push(`https://gateway.ai.cloudflare.com/v1/${cfAccountId}/${cfGatewayId}/workers-ai/${model}`);
        }

        const isFlux = model.includes("flux");
        const isLightning = model.includes("lightning");
        const requestBody: Record<string, any> = { prompt: finalChatPrompt };
        
        if (isFlux) {
          requestBody.steps = 4;
        } else {
          if (finalNegativePrompt) {
            requestBody.negative_prompt = finalNegativePrompt;
          }
          requestBody.num_steps = isLightning ? 8 : 20;
          requestBody.guidance = 7.5;
        }

        for (const cfUrl of candidateUrls) {
          try {
            console.log(`[Image Generation] Renderizando com modelo ${model} via ${cfUrl.includes("gateway") ? "AI Gateway" : "API Direta"}...`);
            
            const headers: Record<string, string> = {
              "Authorization": `Bearer ${cfApiToken}`,
              "Content-Type": "application/json"
            };
            if (cfUrl.includes("gateway")) {
              headers["cf-aig-authorization"] = `Bearer ${cfApiToken}`;
            }

            const cfRes = await fetch(cfUrl, {
              method: "POST",
              headers,
              body: JSON.stringify(requestBody)
            });

            if (!cfRes.ok) {
              const errText = await cfRes.text();
              console.warn(`[Image Generation] Falha no modelo ${model} (HTTP ${cfRes.status}):`, errText);
              lastError = `Status ${cfRes.status}: ${errText}`;
              continue;
            }

            const contentType = cfRes.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const json = await cfRes.json();
              const imgData = json.result?.image || json.image;
              if (imgData) {
                base64Image = imgData.startsWith("data:") ? imgData : `data:image/jpeg;base64,${imgData}`;
                console.log(`[Image Generation] Imagem obtida com sucesso via Cloudflare Workers AI (${model})!`);
                break;
              } else {
                lastError = JSON.stringify(json.errors || json);
                continue;
              }
            } else {
              const arrayBuffer = await cfRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mime = contentType.includes("png") ? "image/png" : "image/jpeg";
              base64Image = `data:${mime};base64,${buffer.toString("base64")}`;
              console.log(`[Image Generation] Imagem obtida via stream da Cloudflare Workers AI (${model})!`);
              break;
            }
          } catch (cfErr: any) {
            console.error(`[Image Generation] Erro ao renderizar no modelo ${model}:`, cfErr);
            lastError = cfErr.message || String(cfErr);
          }
        }
        if (base64Image) break;
      }

      if (!base64Image) {
        return res.status(500).json({
          error: "Não foi possível gerar a imagem no momento pelo motor da Cloudflare Workers AI. Por favor, verifique as credenciais ou tente novamente em alguns instantes."
        });
      }

      // Registrar cota do Chat
      if (adminClient && userId) {
        try {
          await adminClient
            .from('user_ai_usage')
            .insert({
              user_id: userId,
              tipo_uso: quotaType,
              created_at: new Date().toISOString()
            });
          console.log(`[Chat Image] Cota debitada com sucesso para o usuário ${userId}`);
        } catch (dbInsertErr) {
          console.error("[Chat Image] Erro ao registrar cota:", dbInsertErr);
        }
      }

      return res.json({ 
        success: true, 
        base64Image, 
        imageUrl: base64Image 
      });
    } catch (err: any) {
      console.error("[Chat Image CRITICAL]", err);
      return res.status(500).json({ error: err.message || "Erro interno ao gerar imagem no Chat." });
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
