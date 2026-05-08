import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- SISTEMA DE BANIMENTO PERSISTENTE (SIMULADO COM STORE LOCAL + SUPABASE) ---
  const bannedEntities = new Set<string>(); // Cache rápido para IPs/Fingerprints banidos

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
    // Ignora rotas públicas se necessário, mas aqui aplicaremos a tudo exceto o report
    if (req.path === '/api/security/report' || req.path.startsWith('/@vite') || req.path.startsWith('/src')) {
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
  app.use('/api', detectAttacks);
  app.use('/api', customRateLimiter);
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
