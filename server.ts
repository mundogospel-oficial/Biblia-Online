import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import rateLimit from "express-rate-limit";
import webpush from "web-push";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Habilita confiança no proxy para o express-rate-limit identificar o IP real do cliente
  // quando rodando atrás de um balanceador de carga ou proxy (como Cloud Run)
  app.set("trust proxy", 1);

  // --- SISTEMA DE BANIMENTO PERSISTENTE (SIMULADO COM STORE LOCAL + SUPABASE) ---
  const bannedEntities = new Set<string>(); // Cache rápido para IPs/Fingerprints banidos

  // --- RATE LIMITERS ---
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por janela de 15m
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    },
    validate: { trustProxy: false },
    message: { error: "TOO_MANY_REQUESTS", message: "Muitas requisições. Tente novamente mais tarde." }
  });

  const securityLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Apenas 5 tentativas por hora para operações sensíveis
    keyGenerator: (req) => {
      return (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    },
    validate: { trustProxy: false },
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
      // Permite requisições sem origin (como mobile apps ou curl se não bloqueado) e as listadas
      if (!origin || allowedOrigins.includes(origin)) {
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
    const url = decodeURIComponent(req.originalUrl);
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
        
        // Se for um ataque claro do tipo SQLi ou XSS, bane o IP imediatamente
        if (req.ip) bannedEntities.add(req.ip);
        
        return res.status(400).json({ error: 'MALICIOUS_REQUEST_DETECTED', type: name });
      }
    }
    next();
  };

  // 2. Validação de Token de Sessão Sentinel
  const validateSentinelToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Ignora rotas públicas, recursos estáticos e rota de exclusão (já protegida por Supabase JWT)
    if (
      req.path === '/api/security/report' || 
      req.path === '/api/user/delete' ||
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
    const { sessionToken, fingerprint, score, level, reasons, url, timestamp } = req.body;
    
    console.log(`[Sentinel Report] Risk Level: ${level} (${score}/100)`);
    if (reasons?.length) {
      console.log(`Reasons: ${reasons.join(', ')}`);
    }

    // Banimento Automático de Alta Confiança
    if (score >= 90) {
      console.error(`[Sentinel] BANIMENTO AUTOMÁTICO: ${req.ip} / FP: ${fingerprint}`);
      if (req.ip) bannedEntities.add(req.ip);
      if (fingerprint) bannedEntities.add(fingerprint);
    }
    
    res.json({ status: "received", incidentId: Date.now() });
  });

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  // --- WEB PUSH CRON ROUTE ---
  app.get("/api/cron/send-push", async (req, res) => {
    // Basic auth check for cron (can be improved with a dedicated secret)
    const cronSecret = req.headers["x-cron-secret"];
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const adminClient = getSupabaseAdmin();
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:support@bibliaonline.com";

    if (!adminClient || !publicKey || !privateKey) {
      return res.status(500).json({ error: "Push configuration missing" });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

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

        try {
          await webpush.sendNotification(
            user.push_subscription,
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
