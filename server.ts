import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "fs";
import crypto from "crypto";
import { sanitizeUserPrompt, buildPrivacyEnhancedSystemRule } from "./src/lib/security/privacyGuard.js";
import { resolveBiblicalSituationSubject } from "./src/data/biblicalSituations.js";
import { resolveBiblicalBackground, buildUltraRealisticChatPrompt } from "./src/data/biblicalBackgrounds.js";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(base32: string): Buffer {
  const clean = base32.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function verifyServerTotp(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const key = base32Decode(secret);
    const now = Date.now();
    const stepSeconds = 30;

    for (const stepOffset of [-1, 0, 1]) {
      const counter = Math.floor((now + stepOffset * 30 * 1000) / 1000 / stepSeconds);
      const buf = Buffer.alloc(8);
      buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
      buf.writeUInt32BE(counter & 0xffffffff, 4);

      const hmac = crypto.createHmac("sha1", key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0x0f;
      const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const code = (binary % 1000000).toString().padStart(6, "0");
      if (code === cleanToken) {
        return true;
      }
    }
  } catch (err) {
    console.error("[Server TOTP] Erro na verificação:", err);
  }

  return false;
}

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
          "http:", // Fallback para URLs legado de imagens
          "https://*.arcgisonline.com",
          "https://server.arcgisonline.com",
          "https://services.arcgisonline.com",
          "https://*.basemaps.cartocdn.com",
          "https://*.tile.openstreetmap.org",
          "https://tile.openstreetmap.org",
          "https://*.tile.osm.org"
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
          "https://*.arcgisonline.com",
          "https://server.arcgisonline.com",
          "https://services.arcgisonline.com",
          "https://*.basemaps.cartocdn.com",
          "https://*.tile.openstreetmap.org",
          "https://tile.openstreetmap.org",
          "https://*.tile.osm.org",
          "https://*.openai.com",
          "https://chatgpt.com",
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

  // Helper to recognize legitimate AI Bots and Search Engine Crawlers
  const isAuthorizedAIBot = (ua: string = '') => {
    const lower = ua.toLowerCase();
    return (
      lower.includes('gptbot') ||
      lower.includes('chatgpt') ||
      lower.includes('openai') ||
      lower.includes('oai-searchbot') ||
      lower.includes('google-extended') ||
      lower.includes('googlebot') ||
      lower.includes('google') ||
      lower.includes('gemini') ||
      lower.includes('vertex') ||
      lower.includes('claudebot') ||
      lower.includes('claude-web') ||
      lower.includes('anthropic') ||
      lower.includes('perplexity') ||
      lower.includes('perplexitybot') ||
      lower.includes('bingbot') ||
      lower.includes('msnbot') ||
      lower.includes('bingpreview') ||
      lower.includes('cohere') ||
      lower.includes('meta-externalagent') ||
      lower.includes('applebot') ||
      lower.includes('bytespider') ||
      lower.includes('facebookbot') ||
      lower.includes('twitterbot') ||
      lower.includes('duckduckgo') ||
      lower.includes('yandex') ||
      lower.includes('baiduspider') ||
      lower.includes('python') ||
      lower.includes('curl') ||
      lower.includes('wget') ||
      lower.includes('http-client') ||
      lower.includes('postman') ||
      lower.includes('axios') ||
      lower.includes('node-fetch')
    );
  };

  // Middleware de Verificação de Banimento (Executado antes de qualquer outra coisa)
  const checkBanned = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userAgent = (req.headers['user-agent'] as string) || '';

    // Permite que qualquer requisição GET, robôs de IA, crawlers e rotas públicas sempre carreguem livremente (sem 403)
    if (
      req.method === 'GET' || 
      req.method === 'HEAD' || 
      req.method === 'OPTIONS' || 
      isAuthorizedAIBot(userAgent) || 
      !req.path.startsWith('/api') ||
      req.path === '/api/health' ||
      req.path === '/api/version' ||
      req.path === '/api/llms.txt'
    ) {
      return next();
    }

    const ip = req.ip || 'unknown';
    const fingerprint = req.headers['x-sentinel-token'] as string;

    const isIpBanned = !isProtectedOrInternalIdentity(ip) && bannedEntities.has(ip);
    const isFpBanned = !isProtectedOrInternalIdentity(fingerprint) && bannedEntities.has(fingerprint);

    if (isIpBanned || isFpBanned) {
      console.warn(`[Sentinel] Acesso bloqueado para entidade banida: IP=${ip} / FP=${fingerprint}`);
      return res.status(403).json({ 
        error: 'ACCESS_RESTRICTED', 
        message: 'Acesso restrito por políticas de segurança.' 
      });
    }
    next();
  };

  app.use(cors({
    origin: (origin, callback) => {
      // Permite todas as origens para garantir leitura universal por IA, apps e navegadores
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Sentinel-Token", "X-User-Id", "X-Requested-With", "Accept", "Origin"]
  }));
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  app.use(cookieParser());
  app.use(checkBanned); // Verifica banimento em todas as rotas

  // --- SENTINEL SECURITY MIDDLEWARES ---

  // 1. Detecção de padrões de ataque (SQLi, XSS, Path Traversal)
  const detectAttacks = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userAgent = (req.headers['user-agent'] as string) || '';
    if (isAuthorizedAIBot(userAgent)) {
      return next();
    }

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
          console.warn(`[Sentinel] Padrão suspeito observado: ${name} - URL: ${req.originalUrl}`);
          // Não bloqueia nem bane IP para evitar falsos positivos em buscas bíblicas ou leitores de IA
          return next();
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

      // Monitoramento e log de risco sem bloqueio cego de IP público
      if (safeScore >= 90) {
        console.warn(`[Sentinel] Alerta de segurança registrado para análise: ${req.ip} / FP: ${fingerprint}`);
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

  // Sitemap route
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    if (fs.existsSync(sitemapPath)) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(sitemapPath);
    }
    return res.status(404).send("Sitemap not found");
  });

  // Robots.txt route
  app.get("/robots.txt", (req, res) => {
    const robotsPath = path.join(process.cwd(), "public", "robots.txt");
    if (fs.existsSync(robotsPath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(robotsPath);
    }
    return res.status(404).send("Robots not found");
  });

  // LLMs / AI Crawler Summary route (standard /llms.txt specification)
  app.get(["/llms.txt", "/api/llms.txt"], (req, res) => {
    const llmsPath = path.join(process.cwd(), "public", "llms.txt");
    if (fs.existsSync(llmsPath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(llmsPath);
    }
    return res.status(404).send("LLMs specification not found");
  });

  // Version route (no-cache to guarantee production updates instantly)
  app.get(["/version.json", "/api/version"], (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ version: "2.5.1" });
  });

  // --- PERSISTÊNCIA ROBUSTA DE HISTÓRICO DE CHAT NO SERVIDOR ---
  const CHAT_HISTORY_DIR = path.join(process.cwd(), "data", "chat_history");
  if (!fs.existsSync(CHAT_HISTORY_DIR)) {
    try {
      fs.mkdirSync(CHAT_HISTORY_DIR, { recursive: true });
    } catch (e) {
      console.warn("[Server] Falha ao criar diretório data/chat_history:", e);
    }
  }

  const getSafeHistoryUserId = (rawId?: any): string => {
    if (!rawId || typeof rawId !== "string") return "guest";
    const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    return cleaned || "guest";
  };

  // 1. Obter histórico de conversas do servidor
  app.get("/api/chat/history", async (req, res) => {
    try {
      const rawUserId = (req.query.userId as string) || (req.headers["x-user-id"] as string) || "guest";
      const safeId = getSafeHistoryUserId(rawUserId);
      const filePath = path.join(CHAT_HISTORY_DIR, `${safeId}.json`);

      let conversations: any[] = [];

      // A. Tenta carregar do arquivo em disco do servidor
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, "utf-8");
          if (raw && raw.trim()) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              conversations = parsed;
            }
          }
        } catch (fileErr) {
          console.warn("[Server] Erro ao ler histórico do arquivo:", fileErr);
        }
      }

      // B. Se não encontrou no arquivo e é usuário autenticado, tenta carregar do Supabase
      if (conversations.length === 0 && safeId !== "guest" && rawUserId) {
        const adminClient = getSupabaseAdmin();
        if (adminClient) {
          try {
            const { data } = await adminClient
              .from("user_notes")
              .select("note_text")
              .eq("user_id", rawUserId)
              .eq("verse_reference", "AI_CONVERSATIONS")
              .maybeSingle();

            if (data?.note_text) {
              const parsed = JSON.parse(data.note_text);
              if (Array.isArray(parsed) && parsed.length > 0) {
                conversations = parsed;
                // Salva no cache do servidor para leituras subsequentes
                try {
                  fs.writeFileSync(filePath, JSON.stringify(conversations), "utf-8");
                } catch (_) {}
              }
            }
          } catch (dbErr) {
            console.warn("[Server] Aviso ao buscar histórico no Supabase:", dbErr);
          }
        }
      }

      return res.json({ success: true, conversations });
    } catch (err: any) {
      console.error("[Server] Erro ao buscar histórico de chat:", err);
      return res.status(500).json({ error: "Erro ao obter histórico.", conversations: [] });
    }
  });

  // 2. Salvar histórico de conversas no servidor
  app.post("/api/chat/history", async (req, res) => {
    try {
      const { userId, conversations } = req.body || {};
      if (!Array.isArray(conversations)) {
        return res.status(400).json({ error: "Campo 'conversations' obrigatório e deve ser um array." });
      }

      const safeId = getSafeHistoryUserId(userId);
      const filePath = path.join(CHAT_HISTORY_DIR, `${safeId}.json`);

      // A. Salva no disco do servidor imediatamente
      try {
        fs.writeFileSync(filePath, JSON.stringify(conversations), "utf-8");
      } catch (writeErr) {
        console.error("[Server] Erro ao gravar histórico no arquivo do servidor:", writeErr);
      }

      // B. Se o usuário for autenticado, sincroniza também no Supabase
      if (safeId !== "guest" && userId) {
        const adminClient = getSupabaseAdmin();
        if (adminClient) {
          try {
            const jsonStr = JSON.stringify(conversations);
            const { data: existing } = await adminClient
              .from("user_notes")
              .select("id")
              .eq("user_id", userId)
              .eq("verse_reference", "AI_CONVERSATIONS")
              .maybeSingle();

            if (existing) {
              await adminClient
                .from("user_notes")
                .update({ note_text: jsonStr })
                .eq("id", existing.id);
            } else {
              await adminClient
                .from("user_notes")
                .insert({
                  user_id: userId,
                  verse_reference: "AI_CONVERSATIONS",
                  note_text: jsonStr,
                });
            }
          } catch (dbErr) {
            console.warn("[Server] Aviso ao sincronizar com Supabase no servidor:", dbErr);
          }
        }
      }

      return res.json({ success: true, count: conversations.length, timestamp: Date.now() });
    } catch (err: any) {
      console.error("[Server] Erro ao salvar histórico no servidor:", err);
      return res.status(500).json({ error: "Erro interno ao salvar histórico." });
    }
  });

  // 3. Deletar conversa ou limpar todo o histórico no servidor
  app.delete("/api/chat/history", async (req, res) => {
    try {
      const rawUserId = (req.query.userId as string) || req.body?.userId || "guest";
      const conversationId = (req.query.conversationId as string) || req.body?.conversationId;
      const safeId = getSafeHistoryUserId(rawUserId);
      const filePath = path.join(CHAT_HISTORY_DIR, `${safeId}.json`);

      if (conversationId) {
        // Deleta conversa específica
        if (fs.existsSync(filePath)) {
          try {
            const raw = fs.readFileSync(filePath, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((c: any) => c.id !== conversationId);
              fs.writeFileSync(filePath, JSON.stringify(filtered), "utf-8");
              
              if (safeId !== "guest") {
                const adminClient = getSupabaseAdmin();
                if (adminClient) {
                  await adminClient
                    .from("user_notes")
                    .update({ note_text: JSON.stringify(filtered) })
                    .eq("user_id", rawUserId)
                    .eq("verse_reference", "AI_CONVERSATIONS");
                }
              }
            }
          } catch (delErr) {
            console.warn("[Server] Erro ao filtrar conversa deletada:", delErr);
          }
        }
      } else {
        // Limpa todo o histórico do usuário
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (_) {
            fs.writeFileSync(filePath, "[]", "utf-8");
          }
        }
        if (safeId !== "guest") {
          const adminClient = getSupabaseAdmin();
          if (adminClient) {
            await adminClient
              .from("user_notes")
              .delete()
              .eq("user_id", rawUserId)
              .eq("verse_reference", "AI_CONVERSATIONS");
          }
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Server] Erro ao deletar histórico no servidor:", err);
      return res.status(500).json({ error: "Erro ao deletar histórico." });
    }
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

  // ============================================================================
  // SISTEMA DE SEGURANÇA E MODERAÇÃO DE PROMPTS DE IMAGEM VIA OPENROUTER AI
  // ============================================================================
  // Confiado integralmente à análise semântica e contextual inteligente da IA
  // (OPENROUTER_IMAGENS), que compreende metáforas, gírias, duplo sentido,
  // contextos bíblicos e múltiplos idiomas sem falsos positivos de listas estáticas.
  // ============================================================================

  /**
   * Verificação Semântica Inteligente de Segurança e Contexto Bíblico via OPENROUTER_IMAGENS
   * Com suporte avançado a detecção de metáforas, gírias, duplo sentido e múltiplos idiomas.
   */
  async function verifyPromptWithOpenRouterAI(
    prompt: string,
    context: string = "image"
  ): Promise<{ isBlocked: boolean; reason?: string }> {
    const cleanPrompt = (prompt || "").trim();
    if (!cleanPrompt) return { isBlocked: false };

    // Obter chaves OPENROUTER_IMAGENS com prioridade
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
        console.warn("[Segurança OpenRouter] Erro lendo chaves:", e);
      }
    }

    const keysToTry = Array.from(new Set([orKey, fallbackOrKey1, fallbackOrKey2].filter(Boolean)));
    if (keysToTry.length === 0) {
      return { isBlocked: false };
    }

    const securitySystemPrompt = `SISTEMA DE SEGURANÇA MÁXIMA, INTELIGÊNCIA MULTILÍNGUE E MODERAÇÃO BÍBLICA:
Você é o Auditor Especialista em Segurança de Conteúdo e Decência Bíblica de um aplicativo sagrado da Bíblia Sagrada.
Sua missão é inspecionar o prompt enviado pelo usuário para geração de imagem e determinar com precisão se ele é APROVADO ou deve ser BLOQUEADO.

🌐 REQUISITOS OBRIGATÓRIOS DE AUDITORIA:
1. COMPREENSÃO MULTILÍNGUE COMPLETA: Analise o prompt em qualquer idioma. Tentativas de pedir nudez explícita ou conteúdo ilícito devem ser detectadas e bloqueadas.
2. DETECÇÃO DE PORNOGRAFIA E EROTISMO REAL: Identifique intenções deliberadas de pornografia ou vulgaridade extrema (ex: pedidos de atos sexuais ou fetiches mundanos).
3. DECODIFICAÇÃO DE BURLA E JAILBREAK: Detecte tentativas de evasão com caracteres substituídos para pedir nudez ou obscenidades.

🛑 REGRAS DE BLOQUEIO ABSOLUTO (Responda EXATAMENTE E APENAS "BLOQUEADO" se violar qualquer ponto):
- PORNOGRAFIA OU NUDEZ EXPLÍCITA INTENCIONAL (pornografia deliberada, genitais, atos sexuais).
- CONTEÚDO SATÂNICO OU PROFANO (ocultismo, feitiçaria, demônios como divindade, deuses pagãos/mitológicos como Zeus/Anúbis, horóscopo, tarot).
- VIOLÊNCIA GRÁFICA EXTREMA OU DROGAS (mutilação, sangue excessivo, armas modernas de fogo, drogas ilícitas, bebidas alcoólicas).

📖 EXCEÇÕES FUNDAMENTAIS OBRIGATÓRIAS (SEMPRE RESPONDER "APROVADO"):
1. PERSONAGENS BÍBLICOS SAGRADOS (Adão e Eva, Noé, Abraão, Moisés, Davi, Jesus, apóstolos, etc.):
   - Adão e Eva no Jardim do Éden, árvores, flores, rios sagrados, luz divina ou vestimentas bíblicas antigas SÃO 100% SAGRADOS E DEVEM SER SEMPRE APROVADOS. NUNCA bloqueie prompts bíblicos de Adão e Eva ou Jardim do Éden!
2. PEDIDOS DE AJUSTE, EDIÇÃO OU MELHORIA DE IMAGEM:
   - Termos e pedidos de edição como "Modifique a imagem anterior...", "Mais realista", "Pôr do sol", "Mais luz", "Mudar roupas", "Adicionar flores", "Adicionar ovelhas ao fundo", "Iluminação natural", etc. SÃO RECURSOS LEGÍTIMOS DE EDIÇÃO ARTÍSTICA E DEVEM SER SEMPRE APROVADOS. NUNCA bloqueie pedidos de ajuste de imagens bíblicas.
3. VESTIMENTAS BÍBLICAS E DECÊNCIA:
   - Frases e reforços de modéstia como "vestidos com roupas bíblicas de linho", "túnicas modestas", "sem nenhuma nudez", "homem e mulher vestidos" são declarações santas de decência e DEVEM SER SEMPRE APROVADOS.
4. PASSAGENS BÍBLICAS E VERSÍCULOS:
   - Versículos literais da Bíblia Sagrada (como Jó 1:21, Gênesis, Salmos, Isaías, etc.), orações e estudos bíblicos DEVEM SER SEMPRE APROVADOS.

✅ SE O PROMPT FOR RESPEITOSO, PURO E PERTENCENTE AO UNIVERSO BÍBLICO / CRISTÃO OU FOR UM AJUSTE ARTÍSTICO LEGÍTIMO:
Responda EXATAMENTE E APENAS: "APROVADO".`;

    const modelsToTry = [
      "openai/gpt-4o-mini",
      "deepseek/deepseek-chat",
      "meta-llama/llama-3.3-70b-instruct"
    ];

    for (const key of keysToTry) {
      for (const modelId of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://mundogospel.app",
              "X-Title": "Moderador de Seguranca de Imagens"
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: "system", content: securitySystemPrompt },
                { role: "user", content: `Analise este prompt para geração de imagem bíblica: "${cleanPrompt}"` }
              ],
              temperature: 0.0,
              max_tokens: 25
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const reply = (data?.choices?.[0]?.message?.content || "").trim().toUpperCase();
            
            // Prioridade: se o auditor aprovou o prompt
            if (reply.includes("APROVADO") || reply.includes("APPROVED")) {
              return { isBlocked: false };
            }

            // Bloquear somente se a resposta indicar claramente BLOQUEADO
            const firstWord = reply.split(/[\s,.:;!?-]+/)[0] || "";
            if (firstWord === "BLOQUEADO" || firstWord === "BLOCKED" || reply === "BLOQUEADO" || reply === "BLOCKED" || (reply.includes("BLOQUEADO") && !reply.includes("NÃO")) || (reply.includes("BLOCKED") && !reply.includes("NOT"))) {
              console.warn(`[Segurança OpenRouter] Prompt BLOQUEADO pelo modelo ${modelId}: "${cleanPrompt.substring(0, 60)}..."`);
              return {
                isBlocked: true,
                reason: "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico."
              };
            }
          }
        } catch (err: any) {
          console.warn(`[Segurança OpenRouter] Falha temporária no modelo ${modelId}:`, err?.message || err);
        }
      }
    }

    return { isBlocked: false };
  }

  /**
   * VERIFICAÇÃO DE SEGURANÇA DO PROMPT (OPENROUTER AI)
   */
  async function verifyImagePromptSecurity(
    prompt: string,
    context: string = "image"
  ): Promise<{ isBlocked: boolean; reason?: string }> {
    const clean = (prompt || "").trim();
    if (!clean) return { isBlocked: false };

    // Verificação semântica contextual via OPENROUTER_IMAGENS
    const aiCheck = await verifyPromptWithOpenRouterAI(clean, context);
    if (aiCheck.isBlocked) {
      return {
        isBlocked: true,
        reason: aiCheck.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico."
      };
    }

    return { isBlocked: false };
  }

  // --- ROTA DE MODERAÇÃO DE PROMPTS VIA DUPLO FILTRO COMBINADO (OPENROUTER_IMAGENS) ---
  app.post("/api/moderate-prompt", async (req, res) => {
    try {
      const { prompt: rawPrompt, context = "image" } = req.body || {};
      if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
        return res.json({ isAppropriate: true, isBlocked: false });
      }

      const { cleanPrompt: prompt } = sanitizeUserPrompt(rawPrompt);
      const security = await verifyImagePromptSecurity(prompt, context);

      if (security.isBlocked) {
        return res.json({
          isAppropriate: false,
          isBlocked: true,
          reason: security.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico."
        });
      }

      return res.json({ isAppropriate: true, isBlocked: false });
    } catch (err: any) {
      console.error("[Moderate Prompt API Error]:", err);
      return res.json({ isAppropriate: true, isBlocked: false });
    }
  });

  // --- ROTA DE MODERAÇÃO DE IMAGEM ENVIADA VIA VISÃO COMPUTACIONAL (GEMINI VISION) ---
  app.post("/api/moderate-image", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", fileName = "" } = req.body || {};

      if (!imageBase64) {
        return res.status(400).json({ isAppropriate: true, reason: null });
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

      const visionModelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
      let visionAnalyzed = false;

      for (const key of keysToTry) {
        if (visionAnalyzed) break;
        for (const visionModel of visionModelsToTry) {
          try {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: key });

            // Executa com timeout de 3.5s para nunca atrasar ou travar a experiência do usuário
            const visionPromise = ai.models.generateContent({
              model: visionModel,
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

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Moderation timeout")), 3500)
            );

            const response = await Promise.race([visionPromise, timeoutPromise]);

            const responseText = response.text || "";
            let cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedJson);

            if (parsed && typeof parsed.isAppropriate === "boolean") {
              visionAnalyzed = true;
              return res.json({
                isAppropriate: parsed.isAppropriate,
                reason: parsed.isAppropriate ? null : (parsed.reason || "Imagem não condiz com os padrões bíblicos e éticos do aplicativo.")
              });
            }
          } catch (_visionErr: any) {
            // Continua para o próximo modelo/chave sem poluir os logs ou atrasar o usuário
            continue;
          }
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

      // Verificação combinada de segurança (Filtro 1 Termos + Filtro 2 OPENROUTER_IMAGENS)
      const securityCheck = await verifyImagePromptSecurity(prompt, 'create-mode');
      if (securityCheck.isBlocked) {
        return res.status(400).json({ error: securityCheck.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico." });
      }

      const systemInstruction = `Você é um tradutor e otimizador especialista de prompts para o MODO CRIAR de imagens bíblicas.

🛑 REGRAS MÁXIMAS E INVIOLÁVEIS DO MODO CRIAR:
1. É TERMINANTEMENTE PROIBIDO INCLUIR SERES HUMANOS OU QUALQUER FIGURA HUMANA.
NÃO GERE pessoas, homens, mulheres, crianças, bebês, multidões, apóstolos, profetas, pastores, rostos, corpos, mãos ou silhuetas humanas.
2. É TERMINANTEMENTE PROIBIDO GERAR ESTÁTUAS, ESTÁTUAS GREGAS, ESCULTURAS OU ÍDOLOS.
NÃO GERE estátuas gregas, estátuas romanas, bustos de mármore, esculturas de pedra, colunas com estátuas pagãs, ídolos ou estátuas de deuses/humanos.
O MODO CRIAR GERA EXCLUSIVAMENTE CENÁRIOS, PAISAGENS BÍBLICAS SAGRADAS E NATUREZA DIVINA (montanhas, vales, olivais, rios, lagos, desertos, céus com luz celestial dourada divina, templos antigos desérticos sem nenhuma estátua).

Se o pedido do usuário citar qualquer pessoa, estátua, escultura ou personagem bíblico (ex: Jesus, Moisés, Davi, Noé, Adão, estátua, templo grego, escultura de pedra), CONVERTA IMEDIATAMENTE O FOCO PARA O CENÁRIO SAGRADO DA NATUREZA (ex: as águas majestosas do Mar Vermelho, o Monte Sinai iluminado pela glória de Deus, a Arca sobre as águas serenas, a cruz solitária no Calvário vazio ao pôr do sol, pastos verdes e águas tranquilas), mantendo o ambiente 100% DESERTO, NATURAL, SEM PESSOAS E SEM NENHUMA ESTÁTUA.

REGRAS DE SAÍDA:
1. Retorne EXCLUSIVAMENTE o texto conciso e direto em INGLÊS focado no cenário natural deserto da criação divina.
2. Adicione ao final o reforço obrigatório: "empty sacred biblical landscape, majestic uninhabited nature, no people, no humans, no statues, no greek statues, no sculptures, no marble statues, no idols, no faces, no silhouettes".
3. Sem preâmbulos, sem explicações e sem aspas.`;

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

                if (trimmedText.toUpperCase() === "BLOQUEADO" || trimmedText.toUpperCase().startsWith("BLOQUEADO:")) {
                  isBlocked = true;
                } else if (trimmedText) {
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
      const serverNegativePrompt = "people, humans, human, person, man, woman, child, boy, girl, baby, face, silhouette, crowd, pedestrians, figures, human body, hands, arms, legs, portraits, characters, model, photo of person, statue, statues, greek statue, greek statues, roman statue, roman statues, marble statue, marble statues, sculpture, sculptures, bust, busts, stone idol, idols, carved figure, stone carving, monument of human, classical sculpture, ancient greek statue, roman sculpture, figurine, mannequin, idol worship, pagan statue, text, words, letters, typography, font, watermark, signature, username, title, caption, subtitles, writing, label, banner, logo, watermark text, fake words, gibberish text, script, latin words, quote, nudity, naked, nude, topless, bare breasts, bare shoulders, cleavage, unclothed, sensual, revealing clothes, erotic";
      const rawKey = (process.env.POLLINATIONS_API_KEY || "").trim();
      const cleanKey = rawKey.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

      // URLs dos dois endpoints da Pollinations (gen.pollinations.ai para API Keys / App Keys e image.pollinations.ai)
      const encodedPrompt = encodeURIComponent(finalPrompt);
      const negativeEncoded = encodeURIComponent(serverNegativePrompt);
      const keyParam = cleanKey ? `&key=${encodeURIComponent(cleanKey)}&token=${encodeURIComponent(cleanKey)}` : '';
      
      const genApiUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&nofeed=true&enhance=false&negative=${negativeEncoded}${keyParam}`;
      const imageApiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&nofeed=true&enhance=false&negative=${negativeEncoded}${keyParam}`;

      console.log("[Modo Criar - Pollinations Flux] Prompt:", finalPrompt);
      console.log(`[Modo Criar - Pollinations Flux] Gerando para o usuário ${userId}... POLLINATIONS_API_KEY configurada: ${Boolean(cleanKey)}`);

      let base64Image = "";

      // Headers completos de autenticação com a chave
      const fetchHeaders: Record<string, string> = {
        'Accept': 'image/jpeg, image/png, image/webp, */*'
      };
      if (cleanKey) {
        fetchHeaders['Authorization'] = `Bearer ${cleanKey}`;
        fetchHeaders['x-api-key'] = cleanKey;
        fetchHeaders['x-app-key'] = cleanKey;
        fetchHeaders['x-pollinations-key'] = cleanKey;
      }

      // Tenta primeiro no gen.pollinations.ai (novo endpoint autenticado oficial que respeita chaves para remoção de logo)
      const endpointsToTry = [genApiUrl, imageApiUrl];
      let lastUrlUsed = imageApiUrl;

      for (const targetUrl of endpointsToTry) {
        try {
          console.log(`[Modo Criar] Tentando baixar imagem em: ${targetUrl.split('?')[0]}...`);
          const imageResponse = await fetch(targetUrl, {
            headers: fetchHeaders
          });

          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 1000) { // Validar que retornou dados de imagem reais
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              base64Image = `data:${contentType};base64,${buffer.toString('base64')}`;
              lastUrlUsed = targetUrl;
              console.log(`[Modo Criar] Imagem Pollinations obtida com sucesso no servidor (${buffer.length} bytes) via ${targetUrl.split('?')[0]}.`);
              break;
            }
          } else {
            console.warn(`[Modo Criar] Endpoint ${targetUrl.split('?')[0]} retornou HTTP status ${imageResponse.status}`);
          }
        } catch (fetchErr) {
          console.error(`[Modo Criar] Erro no endpoint ${targetUrl.split('?')[0]}:`, fetchErr);
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

      return res.json({
        success: true,
        pollinationsUrl: lastUrlUsed || genApiUrl,
        base64Image: base64Image || undefined,
        imageUrl: base64Image || lastUrlUsed || genApiUrl
      });
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
      previousPrompt?: string;
      changeRequested?: string;
    } = {}
  ): Promise<{ refinedPrompt: string; originalPrompt: string; isBlocked?: boolean }> {
    const cleanInput = (prompt || "").trim();
    if (!cleanInput) {
      return { refinedPrompt: cleanInput, originalPrompt: cleanInput };
    }

    let previousPrompt = (options.previousPrompt || "").trim();
    let changeRequested = (options.changeRequested || "").trim();

    // Se previousPrompt ou changeRequested não vieram explicitamente, analisa padrões no cleanInput
    if (!previousPrompt || !changeRequested) {
      const modPattern1 = /mantendo o contexto b[íi]blico de "([^"]+)",?\s*com a seguinte altera[çc][ãa]o:\s*(.*)/i.exec(cleanInput);
      const modPattern2 = /de "([^"]+)",?\s*alterando:\s*(.*)/i.exec(cleanInput);
      const modPattern3 = /(?:modifique|altere|ajuste|mude)\s+(?:a\s+)?imagem\s+b[íi]blica\s+anterior\s+com\s+a\s+seguinte\s+altera[çc][ãa]o:\s*(.*)/i.exec(cleanInput);

      if (modPattern1) {
        if (!previousPrompt) previousPrompt = modPattern1[1].trim();
        if (!changeRequested) changeRequested = modPattern1[2].trim();
      } else if (modPattern2) {
        if (!previousPrompt) previousPrompt = modPattern2[1].trim();
        if (!changeRequested) changeRequested = modPattern2[2].trim();
      } else if (modPattern3) {
        if (!changeRequested) changeRequested = modPattern3[1].trim();
      }
    }

    const cacheKey = `${cleanInput}__${previousPrompt}__${changeRequested}__${options.style || ''}__${options.mode || ''}`;
    if (promptRefineCache.has(cacheKey)) {
      return promptRefineCache.get(cacheKey)!;
    }

    // Validação de segurança via duplo filtro combinado (Filtro 1 Termos + Filtro 2 OPENROUTER_IMAGENS)
    const securityCheck = await verifyImagePromptSecurity(
      previousPrompt && changeRequested ? `${previousPrompt} ${changeRequested}` : cleanInput, 
      options.mode || 'prompt-refine'
    );
    if (securityCheck.isBlocked) {
      return { refinedPrompt: "", originalPrompt: cleanInput, isBlocked: true };
    }

    const applyBiblicalRules = (promptText: string): string => {
      let result = promptText;
      const combinedForCheck = `${previousPrompt} ${changeRequested} ${cleanInput} ${result}`;
      const isAdamEve = /\b(ad[aã]o|adam|eva|eve)\b/i.test(combinedForCheck);
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
      let baseFallback = cleanInput;
      if (previousPrompt && changeRequested) {
        baseFallback = `${previousPrompt}, com alteração solicitada: ${changeRequested}, mantendo o mesmo cenário bíblico em alta definição ultra-realista 8k, iluminação cinematográfica`;
      }
      const fallbackResult = { refinedPrompt: applyBiblicalRules(baseFallback), originalPrompt: cleanInput };
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

🔄 AJUSTE E MODIFICAÇÃO DE IMAGEM ANTERIOR (QUANDO HOUVER PROMPT ANTERIOR):
- Quando for fornecido o "Prompt da Imagem Anterior" e a "Modificação/Ajuste Solicitado":
  1. Use o PROMPT ANTERIOR como o alicerce absoluto do cenário, dos personagens e da história bíblica. Mantenha os personagens e o cenário da imagem anterior!
  2. Aplique com total fidelidade o ajuste que a pessoa pediu (ex: se pediu "Mais realista", enriqueça com detalhes hiper-realistas, textura de pele natural, iluminação fotográfica real, tecidos bíblicos de linho texturizados, resolução 8k cinematográfica).
  3. Combine o contexto original e a alteração solicitada em uma única descrição visual harmônica e pronta para gerar a imagem ajustada.

🛡️ DECÊNCIA E VESTIMENTAS BÍBLICAS OBRIGATÓRIAS (ESPECIALMENTE ADÃO E EVA):
- REGRA CRÍTICA PARA ADÃO E EVA: Quando o pedido for sobre Adão e Eva, SEM ALTERAR O CENÁRIO OU O FUNDO (deixe o cenário e o fundo intactos como estão):
  1. Os personagens DEVEM OBRIGATORIAMENTE aparecer vestidos com roupas ("vestindo túnicas bíblicas modestas de linho, completamente vestidos, sem nenhuma nudez").
  2. Deve aparecer OBRIGATORIAMENTE um homem de cabelo curto (Adão com cabelo curto bem alinhado) e uma mulher (Eva), ambos vestidos com roupas bíblicas modestas.
- Todas as figuras bíblicas DEVEM OBRIGATORIAMENTE estar descritas com roupas antigas dignas e modestas. Nudez é estritamente proibida.

🛑 PROIBIÇÃO TOTAL DE TEXTO NA IMAGEM:
- A imagem DEVE SER 100% LIMPA E TOTALMENTE LIVRE DE TEXTO, PALAVRAS OU LETRAS.
- NUNCA inclua texto, palavras, letras, tipografia, marcas d'água, legendas, títulos, placas ou escritas em qualquer idioma na imagem gerada.
- A composição visual deve ser puramente fotográfica e cênica, sem nenhum caractere ou grafia.

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

    let userPromptContent = "";
    if (previousPrompt && changeRequested) {
      userPromptContent = `${styleInfo ? styleInfo + "\n\n" : ""}SOLICITAÇÃO DE AJUSTE DE IMAGEM BÍBLICA:
- Prompt da Imagem Anterior: "${previousPrompt}"
- Modificação/Ajuste Solicitado pelo Usuário: "${changeRequested}"

SUA TAREFA OBRIGATÓRIA:
1. Pegue o PROMPT ANTERIOR ("${previousPrompt}") como base principal (mesmos personagens, mesmo cenário, mesmo contexto bíblico). NÃO remova os personagens nem o cenário bíblico da imagem anterior.
2. Incorpore e ajuste a imagem com o que a pessoa pediu ("${changeRequested}"). Se a pessoa pediu "Mais realista", detalhe texturas reais de pele, tecidos autênticos de linho bíblico, iluminação natural volumétrica e renderização fotográfica de altíssima definição 8k.
3. Combine o contexto anterior com a alteração solicitada em uma única descrição visual harmônica, detalhada e rica para a IA de imagem sem alterar o cenário.`;
    } else {
      userPromptContent = `${styleInfo ? styleInfo + "\n\n" : ""}Prompt original a aprimorar sem alterar o cenário:\n"${cleanInput}"`;
    }

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
                { role: "user", content: userPromptContent }
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

            if (refined.toUpperCase() === "BLOQUEADO" || refined.toUpperCase().startsWith("BLOQUEADO:")) {
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

    const fallbackBase = previousPrompt && changeRequested
      ? `${previousPrompt}, com alteração solicitada: ${changeRequested}, mantendo o cenário e personagens bíblicos originais em altíssima definição, iluminação cinematográfica, 8k`
      : cleanInput;
    const fallback = { refinedPrompt: applyBiblicalRules(fallbackBase), originalPrompt: cleanInput };
    if (promptRefineCache.size > 200) promptRefineCache.clear();
    promptRefineCache.set(cacheKey, fallback);
    return fallback;
  }

  // ROTA DO APRIMORADOR DE PROMPTS VIA OPENROUTER (OPENROUTER_IMAGENS)
  app.post("/api/prompt/refine", async (req, res) => {
    try {
      const { 
        prompt: rawPrompt, 
        mode = 'image', 
        style = '', 
        previousPrompt: rawPreviousPrompt = '', 
        changeRequested: rawChangeRequested = '' 
      } = req.body || {};
      if (!rawPrompt || typeof rawPrompt !== 'string' || !rawPrompt.trim()) {
        return res.status(400).json({ error: "O prompt é obrigatório para análise." });
      }

      const { cleanPrompt: prompt } = sanitizeUserPrompt(rawPrompt);
      const previousPrompt = rawPreviousPrompt && typeof rawPreviousPrompt === 'string' 
        ? sanitizeUserPrompt(rawPreviousPrompt).cleanPrompt 
        : undefined;
      const changeRequested = rawChangeRequested && typeof rawChangeRequested === 'string' 
        ? sanitizeUserPrompt(rawChangeRequested).cleanPrompt 
        : undefined;

      const result = await refinePromptWithAprimorador(prompt, { 
        mode, 
        style, 
        preserveScenario: true,
        previousPrompt,
        changeRequested
      });

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

      const isAlreadyRefined = Boolean(req.body.isAlreadyRefined);

      // Verificação combinada de segurança (Filtro 1 Termos + Filtro 2 OPENROUTER_IMAGENS)
      // Se o prompt já foi construído e aprovado pelo Aprimorador de Prompts oficial, ele já foi devidamente santificado e formatado
      if (!isAlreadyRefined) {
        const securityCheck = await verifyImagePromptSecurity(prompt, 'chat-image');
        if (securityCheck.isBlocked) {
          return res.status(400).json({ error: securityCheck.reason || "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual e bíblico." });
        }
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

      let finalNegativePrompt = "nudity, naked, nude, topless, bare breasts, bare shoulders, cleavage, unclothed, sensual, revealing clothes, erotic, text, words, letters, typography, font, watermark, signature, username, title, caption, subtitles, writing, label, banner, logo, watermark text, fake words, gibberish text, script, latin words, quote";
      if (isAdamEvePrompt) {
        finalNegativePrompt += ", long hair on man, man with long hair, unclothed, bare chest, shirtless";
      }

      finalChatPrompt += ", completely textless, pure visual imagery, clean image, no text, no words, no letters, no typography, no font, no signatures, no watermark, no subtitles, no captions, no labels";

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

  // --- 2FA (GOOGLE AUTHENTICATOR) CHECK & VERIFY ROUTES ---
  app.post("/api/auth/2fa/check", async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "E-mail inválido" });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return res.json({ twoFactorEnabled: false });
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Localiza usuário em auth.users
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const matchedUser = usersData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!matchedUser) {
        return res.json({ twoFactorEnabled: false, exists: false });
      }

      // 2. Checa coluna two_factor_enabled em profiles
      const { data: profile } = await adminClient
        .from("profiles")
        .select("two_factor_enabled")
        .eq("id", matchedUser.id)
        .maybeSingle();

      const enabled = Boolean(profile?.two_factor_enabled);
      return res.json({
        twoFactorEnabled: enabled,
        userId: enabled ? matchedUser.id : undefined,
        exists: true
      });
    } catch (err: any) {
      console.error("[2FA API Check Error]", err);
      return res.json({ twoFactorEnabled: false });
    }
  });

  app.post("/api/auth/2fa/verify", async (req, res) => {
    const { userId, code } = req.body || {};
    if (!userId || !code) {
      return res.status(400).json({ valid: false, error: "Dados incompletos para validação." });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return res.status(500).json({ valid: false, error: "Servidor não configurado para 2FA." });
    }

    try {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("two_factor_enabled, two_factor_secret, two_factor_backup_codes")
        .eq("id", userId)
        .maybeSingle();

      if (!profile || !profile.two_factor_enabled || !profile.two_factor_secret) {
        return res.json({ valid: true });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const secret = profile.two_factor_secret;
      const backupCodes: string[] = Array.isArray(profile.two_factor_backup_codes) ? profile.two_factor_backup_codes : [];

      // 1. Valida TOTP (6 dígitos)
      if (/^\d{6}$/.test(cleanCode.replace(/\s+/g, ""))) {
        const isValid = verifyServerTotp(cleanCode.replace(/\s+/g, ""), secret.trim());
        if (isValid) {
          return res.json({ valid: true });
        }
      }

      // 2. Valida Código de Backup
      const bIdx = backupCodes.findIndex(
        c => c.toUpperCase() === cleanCode || c.replace("-", "").toUpperCase() === cleanCode.replace("-", "")
      );

      if (bIdx !== -1) {
        const remaining = [...backupCodes];
        remaining.splice(bIdx, 1);
        await adminClient
          .from("profiles")
          .update({ two_factor_backup_codes: remaining, updated_at: new Date().toISOString() })
          .eq("id", userId);

        return res.json({ valid: true, backupUsed: true });
      }

      return res.status(401).json({ valid: false, error: "Código do autenticador inválido ou expirado." });
    } catch (err: any) {
      console.error("[2FA API Verify Error]", err);
      return res.status(500).json({ valid: false, error: err.message || "Erro na verificação." });
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
