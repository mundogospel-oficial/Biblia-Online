/**
 * ═══════════════════════════════════════════════════════════════
 *  SENTINEL SECURITY — GUIA DE IMPLEMENTAÇÃO
 *  Exemplos prontos para usar em qualquer projeto
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
// EXEMPLO 1: IMPLEMENTAÇÃO BÁSICA (Vanilla JS / qualquer site)
// Adicione na tag <head> ou antes do </body>
// ─────────────────────────────────────────────────────────────

/*
<script type="module">
  import SentinelCore from './sentinel-security.js';

  const sentinel = new SentinelCore({
    debug: true,  // remova em produção
    action: 'monitor',  // 'monitor' | 'challenge' | 'block'
    reportEndpoint: '/api/security/report',  // seu endpoint no servidor
    onThreatDetected: (evaluation) => {
      console.warn('Atividade suspeita detectada', evaluation);
    },
    onBotConfirmed: (evaluation) => {
      // Redireciona para CAPTCHA quando bot confirmado
      window.location.href = '/captcha?session=' + sentinel.sessionToken;
    },
  });

  document.addEventListener('DOMContentLoaded', () => {
    sentinel.init().then(({ sessionToken, fingerprint }) => {
      console.log('Sentinel ativo. Session:', sessionToken);
    });
  });
</script>
*/

// ─────────────────────────────────────────────────────────────
// EXEMPLO 2: REACT HOOK
// ─────────────────────────────────────────────────────────────

/*
// hooks/useSentinel.js
import { useEffect, useRef, useCallback } from 'react';
import SentinelCore from '../sentinel-security.js';

export function useSentinel(config = {}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    sentinelRef.current = new SentinelCore({
      debug: process.env.NODE_ENV === 'development',
      ...config,
    });
    sentinelRef.current.init();

    return () => sentinelRef.current?.destroy();
  }, []);

  const checkRateLimit = useCallback((action) => {
    return sentinelRef.current?.checkRateLimit(action);
  }, []);

  const getStatus = useCallback(() => {
    return sentinelRef.current?.getStatus();
  }, []);

  return { checkRateLimit, getStatus };
}

// Uso em um componente de login:
// function LoginForm() {
//   const { checkRateLimit } = useSentinel({
//     onBotConfirmed: () => navigate('/captcha'),
//   });
//
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const limit = checkRateLimit('login');
//     if (!limit.allowed) {
//       showError(`Muitas tentativas. Aguarde ${limit.retryAfter}s`);
//       return;
//     }
//     // prossegue com o login...
//   };
// }
*/

// ─────────────────────────────────────────────────────────────
// EXEMPLO 3: BACKEND NODE.JS (Express) — Rate Limiter + Validação
// ─────────────────────────────────────────────────────────────

/*
// middleware/sentinel-server.js
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Rate Limiter por IP com Redis (produção)
const createRateLimiter = (options) => rateLimit({
  windowMs: options.windowMs || 60 * 1000,
  max: options.max || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usa IP + fingerprint como chave composta
    const fp = req.headers['x-sentinel-token'] || '';
    return `${req.ip}:${fp}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

// Middleware de validação de token de sessão
const validateSentinelToken = (req, res, next) => {
  const token = req.headers['x-sentinel-token'];
  const timestamp = parseInt(req.headers['x-request-timestamp'] || '0');

  // Token deve existir
  if (!token || token.length !== 32) {
    return res.status(403).json({ error: 'INVALID_SESSION_TOKEN' });
  }

  // Timestamp não pode ser muito antigo (previne replay attacks)
  const age = Date.now() - timestamp;
  if (age > 30000) { // 30 segundos
    return res.status(403).json({ error: 'REQUEST_EXPIRED' });
  }

  next();
};

// Middleware de detecção de padrões de ataque
const detectAttacks = (req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  const body = JSON.stringify(req.body || {});
  const combined = (url + ' ' + body).toLowerCase();

  const patterns = {
    SQL_INJECTION:  /(\bselect\b|\bunion\b|\binsert\b|\bdrop\b).{0,50}(\bfrom\b|\bwhere\b|\binto\b)/i,
    XSS_ATTEMPT:    /(<script|javascript:|onerror\s*=|alert\s*\()/i,
    PATH_TRAVERSAL: /\.\.[\/\\]/,
    COMMAND_INJECT: /[;&|`$()].*(?:cmd|bash|sh|powershell|wget|curl)/i,
    NOSQL_INJECT:   /\$(?:where|gt|lt|ne|in|nin|exists|regex)\b/,
  };

  for (const [name, regex] of Object.entries(patterns)) {
    if (regex.test(combined)) {
      console.warn(`[Sentinel] Ataque detectado: ${name} - IP: ${req.ip} - URL: req.originalUrl`);
      
      // Loga o ataque no banco de dados
      // SecurityLog.create({ type: name, ip: req.ip, url: req.originalUrl, ... });
      
      return res.status(400).json({ error: 'MALICIOUS_REQUEST_DETECTED' });
    }
  }

  next();
};

// Middleware de validação de CSRF com token duplo
const validateCSRF = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.['csrf-token'];
  
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'CSRF_VALIDATION_FAILED' });
  }
  next();
};

// Endpoint para receber relatórios do cliente
const securityReportHandler = async (req, res) => {
  const {
    sessionToken, fingerprint, score,
    level, reasons, url, timestamp
  } = req.body;

  // Loga eventos de alto risco
  if (level === 'dangerous' || level === 'suspicious') {
    console.warn('[Sentinel] Evento de segurança:', {
      ip: req.ip,
      fingerprint,
      score,
      level,
      reasons,
      url,
      timestamp,
    });

    // Salva no banco para análise posterior
    // await SecurityEvent.create({ ... });
    
    // Bloqueia fingerprint reincidente
    if (score >= 85) {
      await blockFingerprint(fingerprint); // sua função de bloqueio
    }
  }

  res.json({ received: true });
};

// Uso no Express:
// const app = express();
// app.use('/api/', createRateLimiter({ windowMs: 60000, max: 60 }));
// app.use('/api/auth/', createRateLimiter({ windowMs: 60000, max: 10 }));
// app.use(detectAttacks);
// app.use(validateCSRF);
// app.post('/api/security/report', securityReportHandler);

module.exports = {
  createRateLimiter,
  validateSentinelToken,
  detectAttacks,
  validateCSRF,
  securityReportHandler,
};
*/

// ─────────────────────────────────────────────────────────────
// EXEMPLO 4: PROTEÇÃO DE FORMULÁRIO DE LOGIN
// Com rate limiting + honeypot + validação
// ─────────────────────────────────────────────────────────────

/*
<form id="login-form">
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <!-- Honeypots são injetados automaticamente pelo Sentinel -->
  <button type="submit">Entrar</button>
  <p id="error-msg" style="color:red;display:none"></p>
</form>

<script type="module">
  import SentinelCore from './sentinel-security.js';

  const sentinel = new SentinelCore({ debug: false });
  await sentinel.init();

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Verifica honeypots
    const trapCheck = sentinel.traps.validateSubmission(new FormData(e.target));
    if (!trapCheck.valid) {
      console.warn('Bot detectado no login:', trapCheck.reason);
      return; // silenciosamente ignora
    }

    // 2. Rate limit de tentativas de login
    const rateCheck = sentinel.checkRateLimit('login');
    if (!rateCheck.allowed) {
      document.getElementById('error-msg').textContent =
        `Muitas tentativas. Aguarde ${rateCheck.retryAfter} segundos.`;
      document.getElementById('error-msg').style.display = 'block';
      return;
    }

    // 3. Avaliação de risco em tempo real
    const risk = await sentinel._evaluate();
    if (risk.score >= 70) {
      // Redireciona para CAPTCHA em vez de bloquear diretamente
      window.location.href = '/challenge?t=' + sentinel.sessionToken;
      return;
    }

    // 4. Prossegue com o login normal
    const formData = new FormData(e.target);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        // O token é adicionado automaticamente pelo RequestValidator
      }),
    });

    const data = await response.json();
    // trata resposta...
  });
</script>
*/

// ─────────────────────────────────────────────────────────────
// NÍVEIS DE PROTEÇÃO — ESCOLHA O ADEQUADO AO SEU CASO
// ─────────────────────────────────────────────────────────────

const PROTECTION_LEVELS = {
  
  // Nível 1: Blog / Site Institucional
  BASIC: {
    action: 'monitor',
    rateLimiter: { maxRequests: 100, windowMs: 60000 },
    features: ['honeypots', 'behavioral', 'rate_limiting'],
    notes: 'Apenas monitora e loga. Não bloqueia usuários.',
  },

  // Nível 2: E-commerce / Portal com Login
  STANDARD: {
    action: 'challenge',
    rateLimiter: { maxRequests: 50, maxLoginAttempts: 5, windowMs: 60000 },
    features: ['honeypots', 'behavioral', 'fingerprint', 'rate_limiting', 'csrf'],
    notes: 'Exibe CAPTCHA quando suspeito. Bloqueia após confirmação.',
  },

  // Nível 3: Banco / Fintech / Dados Sensíveis
  HIGH_SECURITY: {
    action: 'block',
    rateLimiter: { maxRequests: 20, maxLoginAttempts: 3, windowMs: 60000 },
    features: ['ALL_MODULES', 'server_side_validation', 'ip_reputation', 'mfa'],
    notes: 'Bloqueia imediatamente qualquer atividade suspeita.',
  },
};

module.exports = { PROTECTION_LEVELS };
