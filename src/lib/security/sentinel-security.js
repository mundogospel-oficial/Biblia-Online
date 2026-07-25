/**
 * ═══════════════════════════════════════════════════════════════
 *  SENTINEL SECURITY SYSTEM v2.0
 *  Sistema avançado de detecção de bots, ataques e atividade suspeita
 *  
 *  Desenvolvido para: Implementação em qualquer site/aplicação web
 *  Compatibilidade: Vanilla JS, React, Vue, Node.js (Express/Fastify)
 *  
 *  MÓDULOS INCLUSOS:
 *  1. BehaviorAnalyzer   — análise comportamental do usuário (mouse, teclado, scroll)
 *  2. FingerprintEngine  — impressão digital do browser/dispositivo
 *  3. RateLimiter        — limitação de requisições por IP/sessão
 *  4. TrapSystem         — honeypots e armadilhas para bots
 *  5. RequestValidator   — validação de headers e padrões de requisição
 *  6. AnomalyDetector    — detecção de anomalias com pontuação de risco
 *  7. SentinelCore       — orquestrador central de todos os módulos
 * ═══════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────
// MÓDULO 1: ANALISADOR COMPORTAMENTAL
// Detecta padrões humanos vs. automatizados
// ──────────────────────────────────────────────
class BehaviorAnalyzer {
  constructor() {
    this.events = {
      mouseMovements: [],
      keystrokes: [],
      scrollEvents: [],
      clickPatterns: [],
      touchEvents: [],
      focusEvents: [],
    };
    this.sessionStart = Date.now();
    this.interactionCount = 0;
    this.botScore = 0; // 0 = humano, 100 = bot

    // Inicia monitoramento passivo
    this._bindListeners();
  }

  _bindListeners() {
    // Analisa padrão de movimento do mouse (bots são perfeitos demais)
    document.addEventListener('mousemove', (e) => {
      this.events.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        t: Date.now(),
      });
      // Mantém apenas os últimos 100 movimentos para performance
      if (this.events.mouseMovements.length > 100) {
        this.events.mouseMovements.shift();
      }
      this.interactionCount++;
    }, { passive: true });

    // Analisa velocidade e padrão de digitação
    document.addEventListener('keydown', (e) => {
      this.events.keystrokes.push({
        key: e.code,       // NÃO captura o valor real, apenas o código
        t: Date.now(),
      });
      if (this.events.keystrokes.length > 50) {
        this.events.keystrokes.shift();
      }
      this.interactionCount++;
    }, { passive: true });

    // Analisa scroll (bots geralmente não scrollam de forma natural)
    document.addEventListener('scroll', () => {
      this.events.scrollEvents.push({
        y: window.scrollY,
        t: Date.now(),
      });
      if (this.events.scrollEvents.length > 30) {
        this.events.scrollEvents.shift();
      }
    }, { passive: true });

    // Padrão de cliques
    document.addEventListener('click', (e) => {
      this.events.clickPatterns.push({
        x: e.clientX,
        y: e.clientY,
        t: Date.now(),
        target: e.target?.tagName,
      });
    }, { passive: true });

    // Detecção touch (garante que é dispositivo real)
    document.addEventListener('touchstart', () => {
      this.events.touchEvents.push(Date.now());
    }, { passive: true });

    // Foco e desfoco na aba (bots raramente fazem isso)
    window.addEventListener('blur', () => {
      this.events.focusEvents.push({ type: 'blur', t: Date.now() });
    });
    window.addEventListener('focus', () => {
      this.events.focusEvents.push({ type: 'focus', t: Date.now() });
    });
  }

  /**
   * Calcula entropia dos movimentos do mouse
   * Humanos: movimentos irregulares (alta entropia)
   * Bots: movimentos lineares ou ausentes (baixa entropia)
   */
  _calculateMouseEntropy() {
    const moves = this.events.mouseMovements;
    if (moves.length < 5) return 0;

    let totalDeviation = 0;
    let linearity = 0;

    for (let i = 2; i < moves.length; i++) {
      const dx1 = moves[i-1].x - moves[i-2].x;
      const dy1 = moves[i-1].y - moves[i-2].y;
      const dx2 = moves[i].x - moves[i-1].x;
      const dy2 = moves[i].y - moves[i-1].y;

      // Detecta movimentos perfeitamente retos (suspeito)
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      const angleDiff = Math.abs(angle1 - angle2);
      totalDeviation += angleDiff;

      // Velocidade constante é suspeita
      const speed1 = Math.sqrt(dx1*dx1 + dy1*dy1);
      const speed2 = Math.sqrt(dx2*dx2 + dy2*dy2);
      if (Math.abs(speed1 - speed2) < 0.5) linearity++;
    }

    const avgDeviation = totalDeviation / moves.length;
    const linearityRatio = linearity / moves.length;

    // Alta linearity + baixa deviation = bot
    return Math.min(100, (linearityRatio * 60) + (avgDeviation < 0.1 ? 40 : 0));
  }

  /**
   * Analisa ritmo de digitação
   * Humanos: variação natural entre teclas
   * Bots: intervalos iguais ou impossíveis
   */
  _analyzeKeystrokeRhythm() {
    const keys = this.events.keystrokes;
    if (keys.length < 4) return 0;

    const intervals = [];
    for (let i = 1; i < keys.length; i++) {
      intervals.push(keys[i].t - keys[i-1].t);
    }

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Bots digitam sempre no mesmo intervalo (stdDev muito baixo)
    // Ou digitam impossivelmente rápido (avg < 20ms é impossível para humanos)
    if (avg < 20) return 90;  // impossível para humano
    if (stdDev < 5) return 70; // muito regular = bot
    return 0;
  }

  /**
   * Retorna pontuação de risco comportamental
   * 0-30: humano, 31-60: suspeito, 61-100: bot
   */
  getScore() {
    const mouseScore   = this._calculateMouseEntropy() * 0.4;
    const keystrokeScore = this._analyzeKeystrokeRhythm() * 0.3;

    // Sem interações após 5 segundos = suspeito
    const timeOnPage = Date.now() - this.sessionStart;
    const noInteraction = (this.interactionCount === 0 && timeOnPage > 5000) ? 30 : 0;

    this.botScore = Math.min(100, mouseScore + keystrokeScore + noInteraction);
    return Math.round(this.botScore);
  }
}

// ──────────────────────────────────────────────
// MÓDULO 2: MOTOR DE FINGERPRINT
// Cria identificador único e imutável do dispositivo
// ──────────────────────────────────────────────
class FingerprintEngine {
  constructor() {
    this._components = {};
  }

  async collect() {
    this._components = {
      userAgent:    navigator.userAgent,
      language:     navigator.language,
      languages:    navigator.languages?.join(','),
      platform:     navigator.platform,
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenRes:    `${screen.width}x${screen.height}x${screen.colorDepth}`,
      pixelRatio:   window.devicePixelRatio,
      touchPoints:  navigator.maxTouchPoints,
      memory:       navigator.deviceMemory,
      cpuCores:     navigator.hardwareConcurrency,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack:   navigator.doNotTrack,
      plugins:      this._getPlugins(),
      canvas:       await this._getCanvasHash(),
      webgl:        this._getWebGLInfo(),
      fonts:        await this._detectFonts(),
      mediaDevices: await this._getMediaDevices(),
    };

    return {
      fingerprint: await this._hash(JSON.stringify(this._components)),
      components: this._components,
      anomalies: await this._detectAnomalies(),
    };
  }

  _getPlugins() {
    try {
      return Array.from(navigator.plugins).map(p => p.name).join(',');
    } catch { return 'N/A'; }
  }

  /**
   * Canvas fingerprinting: cada dispositivo renderiza pixels ligeiramente diferente.
   * Bots geralmente retornam canvas vazio ou idêntico.
   */
  async _getCanvasHash() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('Sentinel 🔒 #probe', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Georgia';
      ctx.fillText('Sentinel 🔒 #probe', 4, 17);
      return await this._hash(canvas.toDataURL());
    } catch { return 'canvas_blocked'; }
  }

  _getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no_webgl';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor:   ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      };
    } catch { return 'webgl_blocked'; }
  }

  async _detectFonts() {
    // Detecta presença de fontes padrão do sistema
    const testFonts = ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const baseWidth = {};

    ctx.font = '14px monospace';
    testFonts.forEach(f => {
      ctx.font = `14px ${f}, monospace`;
      baseWidth[f] = ctx.measureText('mmmmmmmmm').width;
    });
    return btoa(JSON.stringify(baseWidth)).slice(0, 16);
  }

  async _getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      return devices?.map(d => d.kind).join(',') || 'N/A';
    } catch { return 'N/A'; }
  }

  /**
   * Detecta inconsistências que revelam bots/spoofing
   */
  async _detectAnomalies() {
    const anomalies = [];
    const c = this._components;

    // User agent claims mobile mas não tem touch
    if (/Mobile|Android|iPhone/i.test(c.userAgent) && c.touchPoints === 0) {
      anomalies.push('UA_MOBILE_NO_TOUCH');
    }
    // Headless Chrome: não tem plugins mas tem WebGL
    if (c.plugins === '' && typeof c.webgl === 'object' && c.webgl.renderer) {
      anomalies.push('HEADLESS_BROWSER_SUSPECTED');
    }
    // Puppeteer/Selenium deixa traces
    if (window.navigator.webdriver) {
      anomalies.push('WEBDRIVER_DETECTED');
    }
    // Playwright/automation flags
    if (window.__playwright || window._selenium || window.callSelenium) {
      anomalies.push('AUTOMATION_FRAMEWORK_DETECTED');
    }
    // Função nativa corrompida (patch de bot)
    if (window.chrome && typeof window.chrome.runtime === 'undefined' &&
        /Chrome/.test(navigator.userAgent)) {
      anomalies.push('CHROME_RUNTIME_MISSING');
    }

    // NOVOS CAÇADORES DE BOTS:
    
    // 1. Detecção de Bateria (Bots raramente mockam estado de bateria dinâmico)
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator).getBattery();
        if (battery.level === 1 && battery.charging === true && battery.chargingTime === 0) {
          // Valores perfeitos de default em alguns emuladores
          // anomalies.push('SUSPICIOUS_BATTERY_STATE');
        }
      } else {
        // Dispositivos modernos quase todos têm, alguns bots não implementam
        if (/Android|iPhone/i.test(c.userAgent)) anomalies.push('BATTERY_API_MISSING');
      }
    } catch (e) {}

    // 2. Detecção de DevTools Suspeito (Tamanho de janela estranho)
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
       // human developers do this too, but for a bot it's a signal
       anomalies.push('DEVTOOLS_SUSPECTED');
    }

    // Idioma inconsistente com timezone
    const tzCountry = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0];
    if (tzCountry === 'America' && c.language && !c.language.startsWith('en') &&
        !c.language.startsWith('es') && !c.language.startsWith('pt')) {
      anomalies.push('LANGUAGE_TIMEZONE_MISMATCH');
    }
    return anomalies;
  }

  async _hash(str) {
    try {
      const buf = new TextEncoder().encode(str);
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').slice(0, 32);
    } catch {
      // Fallback simples se SubtleCrypto não disponível
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
  }
}

// ──────────────────────────────────────────────
// MÓDULO 3: SISTEMA DE HONEYPOTS (ARMADILHAS)
// Campos invisíveis que bots preenchem mas humanos não veem
// ──────────────────────────────────────────────
class TrapSystem {
  constructor() {
    this.traps = new Map();
    this.triggered = [];
  }

  /**
   * Injeta honeypots em todos os formulários da página.
   * Bots tentam preencher todos os campos, incluindo os ocultos.
   * Retorna: função de cleanup para remover ao desmontar
   */
  injectHoneypots() {
    const forms = document.querySelectorAll('form');

    forms.forEach((form, index) => {
      // Campo honeypot — invisível para humanos, visível para bots
      const honeypotField = document.createElement('input');
      honeypotField.type = 'text';
      honeypotField.name = `_hp_${Date.now()}_${index}`;
      honeypotField.id   = `email_confirm_${index}`; // nome convincente para bots
      honeypotField.autocomplete = 'off';
      honeypotField.tabIndex = -1; // fora do fluxo de Tab humano

      // CSS: invisível visualmente mas presente no DOM (diferente de display:none)
      honeypotField.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(0,0,0,0) !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        left: -9999px !important;
      `;

      form.appendChild(honeypotField);
      this.traps.set(honeypotField.name, honeypotField);

      // Monitora se o campo foi preenchido (bot confirmado!)
      honeypotField.addEventListener('input', () => {
        this.triggered.push({
          type: 'HONEYPOT_FILLED',
          field: honeypotField.name,
          value: honeypotField.value,
          t: Date.now(),
        });
      });

      // Também detecta se bot tentou focar no campo
      honeypotField.addEventListener('focus', () => {
        this.triggered.push({
          type: 'HONEYPOT_FOCUSED',
          field: honeypotField.name,
          t: Date.now(),
        });
      });
    });

    // Honeypot de submissão rápida demais
    // Humanos levam > 3 segundos para preencher um form
    forms.forEach(form => {
      const openTime = Date.now();
      form.addEventListener('submit', (e) => {
        const fillTime = Date.now() - openTime;
        if (fillTime < 1500) {
          this.triggered.push({
            type: 'FORM_SUBMITTED_TOO_FAST',
            ms: fillTime,
            t: Date.now(),
          });
          e.preventDefault();
        }
      });
    });

    return () => this.traps.forEach(field => field.remove());
  }

  /**
   * Valida submissão de form — retorna true se humano, false se bot
   */
  validateSubmission(formData) {
    // Verifica campos honeypot preenchidos
    for (const [name, field] of this.traps) {
      const value = formData?.get?.(name) || field.value;
      if (value && value.length > 0) {
        return { valid: false, reason: 'HONEYPOT_TRIGGERED', field: name };
      }
    }
    if (this.triggered.length > 0) {
      return { valid: false, reason: this.triggered[0].type, details: this.triggered };
    }
    return { valid: true };
  }

  getTriggered() {
    return this.triggered;
  }
}

// ──────────────────────────────────────────────
// MÓDULO 4: RATE LIMITER (LADO CLIENTE)
// Complemento para o rate limiter do servidor
// ──────────────────────────────────────────────
class RateLimiter {
  constructor(options = {}) {
    this.limits = {
      maxRequests:   options.maxRequests   || 30,   // por janela
      windowMs:      options.windowMs      || 60000, // 60 segundos
      maxFormSubmit: options.maxFormSubmit || 3,     // submissões por minuto
      maxLoginAttempts: options.maxLoginAttempts || 5,
    };
    this.buckets = new Map();
  }

  /**
   * Verifica se uma ação está dentro do limite permitido
   * @param {string} action — identificador da ação ('api', 'login', 'form', etc.)
   * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
   */
  check(action) {
    const now = Date.now();
    const key = `${action}`;

    if (!this.buckets.has(key)) {
      this.buckets.set(key, { count: 0, windowStart: now, blocked: false });
    }

    const bucket = this.buckets.get(key);

    // Reseta janela se expirou
    if (now - bucket.windowStart > this.limits.windowMs) {
      bucket.count = 0;
      bucket.windowStart = now;
      bucket.blocked = false;
    }

    const limit = this._getLimitForAction(action);
    bucket.count++;

    if (bucket.count > limit) {
      bucket.blocked = true;
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.windowStart + this.limits.windowMs,
        retryAfter: Math.ceil((bucket.windowStart + this.limits.windowMs - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetAt: bucket.windowStart + this.limits.windowMs,
    };
  }

  _getLimitForAction(action) {
    if (action === 'login')  return this.limits.maxLoginAttempts;
    if (action === 'form')   return this.limits.maxFormSubmit;
    return this.limits.maxRequests;
  }

  getStatus(action) {
    return this.buckets.get(action) || { count: 0, blocked: false };
  }
}

// ──────────────────────────────────────────────
// MÓDULO 5: VALIDADOR DE REQUISIÇÕES
// Intercepta fetch/XHR e adiciona tokens de segurança
// ──────────────────────────────────────────────
class RequestValidator {
  constructor(sessionToken) {
    this.sessionToken = sessionToken;
    this.requestLog = [];
    this._originalFetch = window.fetch.bind(window);
    this._originalXHROpen = XMLHttpRequest.prototype.open;
  }

  /**
   * Intercepta todas as chamadas fetch para adicionar headers de segurança
   * e registrar requisições suspeitas
   */
  intercept() {
    const self = this;

    // Override fetch global using a more robust method to avoid "only a getter" errors
    try {
      const originalFetch = window.fetch.bind(window);
      this._originalFetch = originalFetch;

      const newFetch = async function(url, options = {}) {
        let urlString = '';
        let requestInstance = null;
        
        if (typeof url === 'string') {
          urlString = url;
        } else if (url instanceof URL) {
          urlString = url.href;
        } else if (url && typeof url === 'object') {
          if ('url' in url) {
            urlString = url.url;
            if (url instanceof Request) {
              requestInstance = url;
            }
          }
        }
        
        const entry = {
          url: urlString,
          method: options.method || (requestInstance ? requestInstance.method : 'GET'),
          t: Date.now(),
        };
        self.requestLog.push(entry);

        if (self.requestLog.length > 100) self.requestLog.shift();

        const isInternal = !urlString.startsWith('http') || urlString.startsWith(window.location.origin);

        if (isInternal) {
          // Merge headers properly
          const headers = new Headers(options.headers || (requestInstance ? requestInstance.headers : {}));
          headers.set('X-Sentinel-Token', self.sessionToken);
          headers.set('X-Request-Timestamp', Date.now().toString());
          headers.set('X-Tab-Visible', (!document.hidden).toString());

          // If it's a request instance, we must clone it if we want to modify it, 
          // but it's simpler to just pass the merged headers in the options.
          return originalFetch(url, { ...options, headers });
        }

        return originalFetch(url, options);
      };

      // Try direct assignment first, then Object.defineProperty if it fails
      try {
        window.fetch = newFetch;
      } catch (e) {
        Object.defineProperty(window, 'fetch', {
          value: newFetch,
          configurable: true,
          writable: true
        });
      }
    } catch (err) {
      console.warn('[Sentinel] Falha ao interceptar fetch:', err);
    }

    return () => { 
      try {
        window.fetch = this._originalFetch; 
      } catch (e) {
        // Fallback for cleanup
        Object.defineProperty(window, 'fetch', {
          value: this._originalFetch,
          configurable: true,
          writable: true
        });
      }
    };
  }

  /**
   * Detecta padrões de ataque em requisições
   */
  detectAttackPatterns(url, body = '') {
    const combined = (url + body).toLowerCase();
    const patterns = {
      SQL_INJECTION:  /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b).*(\bfrom\b|\binto\b|\bwhere\b)/i,
      XSS_ATTEMPT:    /(<script|javascript:|onerror=|onload=|eval\(|alert\()/i,
      PATH_TRAVERSAL: /(\.\.\/)|(\.\.\\)/,
      COMMAND_INJECT: /(\||;|&&|\$\(|`)/,
      LDAP_INJECT:    /(\*\)|\)\()|([\x00-\x1f])/,
    };

    const detected = [];
    for (const [name, regex] of Object.entries(patterns)) {
      if (regex.test(combined)) {
        detected.push({ type: name, url, timestamp: new Date().toISOString() });
      }
    }
    return detected;
  }

  getLog() { return this.requestLog; }
}

// ──────────────────────────────────────────────
// MÓDULO 6: DETECTOR DE ANOMALIAS (IA SIMPLES)
// Sistema de pontuação que agrega todos os sinais
// ──────────────────────────────────────────────
class AnomalyDetector {
  constructor() {
    this.incidents = [];
    this.riskScore = 0;

    // Pesos de cada sinal (soma = 100)
    this.weights = {
      behaviorScore:    25, // análise comportamental
      fingerprintAnomalies: 30, // anomalias de fingerprint
      honeypotTriggered: 40, // honeypot acionado (quase certeza de bot)
      rateLimitViolation: 15, // excesso de requisições
      attackPattern:    50, // padrão de ataque detectado (XSS, SQLi, etc.)
    };
  }

  /**
   * Calcula score de risco consolidado
   * @returns {{ score: number, level: 'safe'|'suspicious'|'dangerous', reasons: string[] }}
   */
  evaluate({
    behaviorScore = 0,
    fingerprintAnomalies = [],
    honeypotTriggered = false,
    rateLimitViolation = false,
    attackPatterns = [],
  }) {
    let score = 0;
    const reasons = [];

    if (behaviorScore > 40) {
      score += (behaviorScore / 100) * this.weights.behaviorScore;
      reasons.push(`Comportamento não-humano (score: ${behaviorScore})`);
    }
    if (fingerprintAnomalies.length > 0) {
      score += Math.min(this.weights.fingerprintAnomalies, fingerprintAnomalies.length * 10);
      reasons.push(`Fingerprint suspeito: ${fingerprintAnomalies.join(', ')}`);
    }
    if (honeypotTriggered) {
      score += this.weights.honeypotTriggered;
      reasons.push('Honeypot acionado — bot confirmado');
    }
    if (rateLimitViolation) {
      score += this.weights.rateLimitViolation;
      reasons.push('Excesso de requisições detectado');
    }
    if (attackPatterns.length > 0) {
      score += this.weights.attackPattern;
      reasons.push(`Padrão de ataque: ${attackPatterns.map(p => p.type).join(', ')}`);
    }

    this.riskScore = Math.min(100, Math.round(score));

    const level = this.riskScore >= 70 ? 'dangerous'
                : this.riskScore >= 35 ? 'suspicious'
                : 'safe';

    const incident = { score: this.riskScore, level, reasons, t: Date.now() };
    this.incidents.push(incident);

    return incident;
  }

  getHistory() { return this.incidents; }
  getCurrentScore() { return this.riskScore; }
}

// ──────────────────────────────────────────────
// MÓDULO PRINCIPAL: SENTINEL CORE
// Orquestrador central — use este em seu projeto
// ──────────────────────────────────────────────
class SentinelCore {
  /**
   * @param {Object} config — configuração do sistema
   * @param {string} config.reportEndpoint — URL para enviar eventos ao servidor (opcional)
   * @param {Function} config.onThreatDetected — callback ao detectar ameaça
   * @param {Function} config.onBotConfirmed — callback ao confirmar bot
   * @param {'block'|'challenge'|'monitor'} config.action — ação ao detectar ameaça
   * @param {boolean} config.debug — modo debug (loga no console)
   */
  constructor(config = {}) {
    this.config = {
      reportEndpoint:   config.reportEndpoint   || null,
      onThreatDetected: config.onThreatDetected || null,
      onBotConfirmed:   config.onBotConfirmed   || null,
      action:           config.action           || 'monitor',
      debug:            config.debug            || false,
      scanInterval:     config.scanInterval     || 5000, // reavalia a cada 5s
    };

    // Gera token de sessão único
    this.sessionToken = this._generateSessionToken();
    this.startTime = Date.now();
    this.blocked = false;
    this.lastEvaluation = null;

    // Inicializa módulos
    this.behavior   = new BehaviorAnalyzer();
    this.fingerprint = new FingerprintEngine();
    this.traps      = new TrapSystem();
    this.rateLimiter = new RateLimiter();
    this.validator  = new RequestValidator(this.sessionToken);
    this.anomaly    = new AnomalyDetector();

    this._cleanup = [];
    this._alreadyReported = false;
  }

  /**
   * Inicia o sistema de segurança
   * Deve ser chamado assim que a página carregar
   */
  async init() {
    this._log('🛡️  Sentinel Security System iniciando...');

    // Injeta honeypots em formulários
    const cleanupTraps = this.traps.injectHoneypots();
    this._cleanup.push(cleanupTraps);

    // Intercepta requisições
    const cleanupFetch = this.validator.intercept();
    this._cleanup.push(cleanupFetch);

    // Coleta fingerprint inicial
    const fpResult = await this.fingerprint.collect();
    this._log('Fingerprint coletado:', fpResult.fingerprint);

    if (fpResult.anomalies.length > 0) {
      this._log('⚠️  Anomalias de fingerprint:', fpResult.anomalies);
    }

    // Avalia periodicamente
    this._scanInterval = setInterval(() => this._evaluate(), this.config.scanInterval);

    // Avaliação inicial após 3 segundos (dá tempo para interação)
    setTimeout(() => this._evaluate(), 3000);

    this._log('✅ Sistema iniciado. Token de sessão:', this.sessionToken);
    return { sessionToken: this.sessionToken, fingerprint: fpResult.fingerprint };
  }

  /**
   * Avaliação de risco em tempo real
   * Chamada internamente, mas pode ser chamada manualmente
   */
  async _evaluate() {
    if (this.blocked) return this.lastEvaluation;

    const fpResult  = await this.fingerprint.collect();
    this.lastFingerprint = fpResult.fingerprint;
    const trapResult = this.traps.validateSubmission();
    const attackPatterns = this.validator.detectAttackPatterns(window.location.href);
    
    // Verifica presença de extensões suspeitas
    const extCheck = this._checkExtensionTampering();
    this.extensionDetected = extCheck.detected;
    this.extensionReasons = extCheck.reasons;

    if (this.extensionDetected && this.config.onExtensionDetected) {
      this.config.onExtensionDetected(extCheck);
    }

    const evaluation = this.anomaly.evaluate({
      behaviorScore:       this.behavior.getScore(),
      fingerprintAnomalies: fpResult.anomalies,
      honeypotTriggered:   !trapResult.valid,
      rateLimitViolation:  false, // atualizado pelo check() quando necessário
      attackPatterns,
    });

    this.lastEvaluation = evaluation;
    this._log(`📊 Score de risco: ${evaluation.score}/100 [${evaluation.level}]`);

    if (evaluation.reasons.length > 0) {
      this._log('Razões:', evaluation.reasons);
    }

    // Reporta ao servidor se configurado e for o primeiro reporte ou se houver score suspeito (>= 50)
    if (this.config.reportEndpoint && (!this._alreadyReported || evaluation.score >= 50)) {
      this._reportToServer(evaluation, fpResult.fingerprint);
      this._alreadyReported = true;
    }

    // Aciona callbacks
    if (evaluation.level !== 'safe') {
      this.config.onThreatDetected?.(evaluation);
    }
    if (evaluation.score >= 70 || !trapResult.valid || attackPatterns.length > 0) {
      this.config.onBotConfirmed?.(evaluation);
      this._blockRequest(evaluation);
    }

    return evaluation;
  }

  _checkExtensionTampering() {
    try {
      if (typeof document === 'undefined') return { detected: false, reasons: [] };

      const reasons = [];

      // 1. Injected extension DOM elements / overlays
      const extensionNodes = document.querySelectorAll(
        '[src*="chrome-extension://"], [href*="chrome-extension://"], ' +
        '[src*="moz-extension://"], [href*="moz-extension://"], ' +
        'iframe[src*="chrome-extension://"], iframe[src*="moz-extension://"], ' +
        '[data-extension-id], [id*="tampermonkey"], [id*="violentmonkey"]'
      );

      if (extensionNodes.length > 0) {
        reasons.push('Elementos de extensão do navegador injetados no aplicativo');
      }

      // 2. Extension global objects
      if (
        (window).__TAMPERMONKEY__ ||
        (window).__VIOLENTMONKEY__ ||
        (window).__EXT_MESSENGER__ ||
        document.documentElement?.hasAttribute('data-extension-installed') ||
        document.body?.hasAttribute('data-extension-installed')
      ) {
        reasons.push('Scripts de extensão ativas monitorando o navegador');
      }

      return {
        detected: reasons.length > 0,
        reasons
      };
    } catch (e) {
      return { detected: false, reasons: [] };
    }
  }

  /**
   * Verifica rate limit para uma ação específica
   * Use antes de submissões de form, login, etc.
   */
  checkRateLimit(action = 'default') {
    const result = this.rateLimiter.check(action);
    if (!result.allowed) {
      this._log(`🚫 Rate limit excedido para: ${action}`);
      const evalResult = this.anomaly.evaluate({ rateLimitViolation: true });
      if (evalResult.score >= 70) {
        this._blockRequest(evalResult);
      }
    }
    return result;
  }

  /**
   * Bloqueia interação suspeita
   */
  _blockRequest(evaluation) {
    this.blocked = true;
    const errorCode = `ERR_SENTINEL_SECURITY_0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}`;
    const blockInfo = {
      isBlocked: true,
      blockReason: evaluation?.reasons?.join(', ') || 'Atividade maliciosa ou violação de segurança detectada pelo Sentinel.',
      errorCode,
      score: evaluation?.score || 100,
      fingerprint: this.lastFingerprint || 'FINGERPRINT_HASH',
      timestamp: new Date().toISOString()
    };
    this.blockInfo = blockInfo;
    this._log('🚫 Acesso bloqueado (Ativando Tela Azul BSOD):', evaluation.reasons);
    this.config.onBlocked?.(blockInfo);
  }

  /**
   * Envia dados de ameaça ao backend de forma assíncrona
   */
  async _reportToServer(evaluation, fingerprint) {
    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken:  this.sessionToken,
          fingerprint,
          score:         evaluation.score,
          level:         evaluation.level,
          reasons:       evaluation.reasons,
          url:           window.location.href,
          timestamp:     new Date().toISOString(),
          timeOnPage:    Date.now() - this.startTime,
        }),
      });
    } catch (err) {
      this._log('Erro ao reportar ao servidor:', err.message);
    }
  }

  _generateSessionToken() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  _log(...args) {
    if (this.config.debug) {
      console.log('[Sentinel]', ...args);
    }
  }

  /**
   * Retorna status atual do sistema
   */
  getStatus() {
    return {
      sessionToken:    this.sessionToken,
      blocked:         this.blocked,
      lastEvaluation:  this.lastEvaluation,
      behaviorScore:   this.behavior.getScore(),
      trapsTriggered:  this.traps.getTriggered(),
      incidentHistory: this.anomaly.getHistory(),
    };
  }

  /**
   * Para o sistema e limpa listeners
   */
  destroy() {
    clearInterval(this._scanInterval);
    this._cleanup.forEach(fn => fn?.());
    this._log('Sistema Sentinel encerrado.');
  }
}

// ──────────────────────────────────────────────
// EXPORTAÇÃO
// ──────────────────────────────────────────────

// Para uso com módulos ES6 (React, Vue, etc.)
export { SentinelCore, BehaviorAnalyzer, FingerprintEngine, TrapSystem, RateLimiter, RequestValidator, AnomalyDetector };
export default SentinelCore;
