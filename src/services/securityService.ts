import { supabase } from "@/integrations/supabase/client";

export interface SecurityBanRecord {
  fingerprint: string;
  ipAddress?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  reason: string;
  errorCode: string;
  score: number;
  url?: string;
  timestamp?: string;
}

const LOCAL_BAN_KEY = "sentinel_ip_blocked_v1";
const COOKIE_BAN_KEY = "sentinel_ip_blocked_cookie";

// Helper em Cookie para dificultar que a pessoa limpe apenas o localStorage
const setBanCookie = (val: string) => {
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_BAN_KEY}=${encodeURIComponent(val)}; max-age=315360000; path=/; SameSite=Strict;`;
    }
  } catch (e) {
    console.warn("Could not set ban cookie:", e);
  }
};

const getBanCookie = (): string | null => {
  try {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + COOKIE_BAN_KEY + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
};

const removeBanCookie = () => {
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_BAN_KEY}=; max-age=0; path=/;`;
    }
  } catch (e) {
    console.warn("Could not remove ban cookie:", e);
  }
};

export const saveLocalBan = (banInfo: SecurityBanRecord) => {
  try {
    const fullRecord = {
      ...banInfo,
      bannedAt: banInfo.timestamp || new Date().toISOString()
    };
    const jsonStr = JSON.stringify(fullRecord);
    localStorage.setItem(LOCAL_BAN_KEY, jsonStr);
    setBanCookie(jsonStr);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sentinel-block-change", { detail: { isBlocked: true, record: fullRecord } }));
    }
  } catch (e) {
    console.warn("Could not save local ban state:", e);
  }
};

export const getLocalBan = (): SecurityBanRecord | null => {
  try {
    let raw = localStorage.getItem(LOCAL_BAN_KEY);
    if (!raw) {
      raw = getBanCookie();
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearLocalBan = () => {
  try {
    localStorage.removeItem(LOCAL_BAN_KEY);
    removeBanCookie();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sentinel-block-change", { detail: { isBlocked: false, record: null } }));
    }
  } catch (e) {
    console.warn("Could not clear local ban state:", e);
  }
};

export const deleteBanRecordAndUnban = async (userEmail?: string, fingerprint?: string) => {
  try {
    const localBan = getLocalBan();
    const fp = (fingerprint && fingerprint !== "HASH_PROTECTED" ? fingerprint : localBan?.fingerprint) || undefined;
    const emailToUse = userEmail || localBan?.userEmail;

    // Obtém IP do cliente se disponível
    const publicIp = localBan?.ipAddress || await fetchClientPublicIp();

    // Obtém dados da sessão logada no Supabase
    let sessionEmail: string | undefined;
    let sessionUserId: string | undefined;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      sessionEmail = sessionData?.session?.user?.email;
      sessionUserId = sessionData?.session?.user?.id;
    } catch {}

    // Coleção de e-mails, IDs, hashes e IPs a limpar
    const emails = Array.from(new Set([emailToUse, sessionEmail, localBan?.userEmail].filter(Boolean) as string[]));
    const userIds = Array.from(new Set([sessionUserId, localBan?.userId].filter(Boolean) as string[]));
    const fps = Array.from(new Set([fp, localBan?.fingerprint].filter((x): x is string => !!x && x !== "HASH_PROTECTED" && x !== "unknown_fingerprint")));
    const ips = Array.from(new Set([publicIp, localBan?.ipAddress].filter((x): x is string => !!x && x !== "N/A")));

    // 1. Deleção / Atualização por e-mails
    for (const em of emails) {
      try { await supabase.from("security_bans" as any).delete().eq("user_email", em); } catch {}
      try { await supabase.from("security_bans" as any).delete().ilike("user_email", em); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("user_email", em); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).ilike("user_email", em); } catch {}
    }

    // 2. Deleção / Atualização por user_ids
    for (const uid of userIds) {
      try { await supabase.from("security_bans" as any).delete().eq("user_id", uid); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("user_id", uid); } catch {}
    }

    // 3. Deleção / Atualização por fingerprints / ip_hash
    for (const f of fps) {
      try { await supabase.from("security_bans" as any).delete().eq("ip_hash", f); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("ip_hash", f); } catch {}
    }

    // 4. Deleção / Atualização por IPs
    for (const ip of ips) {
      try { await supabase.from("security_bans" as any).delete().eq("ip_address", ip); } catch {}
      try { await supabase.from("security_bans" as any).delete().eq("client_ip", ip); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("ip_address", ip); } catch {}
      try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("client_ip", ip); } catch {}
    }

    // 5. Como o usuário autenticou-se com sucesso, garante a limpeza de todos os registros de ban com status="banned"
    try { await supabase.from("security_bans" as any).delete().eq("status", "banned"); } catch {}
    try { await supabase.from("security_bans" as any).update({ status: "unbanned" }).eq("status", "banned"); } catch {}

    // Limpa estado local do ban e notifica a aplicação em tempo real
    clearLocalBan();
  } catch (err) {
    console.error("Erro ao excluir registro de banimento do Supabase:", err);
    clearLocalBan();
  }
};

// Proteção leve de atalhos F12 / Context Menu para não destruir o DOM da Tela Azul
let antiF12Active = false;

export const enableAntiF12Protection = () => {
  if (typeof window === "undefined" || antiF12Active) return;
  antiF12Active = true;

  // Bloqueia atalhos de inspeção
  window.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      (e.ctrlKey && (e.key === "U" || e.key === "u" || e.key === "S" || e.key === "s"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Bloqueia botão direito
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);
};

// Detecção de injeção pesada (SQLi, XSS, scripts maliciosos)
export const checkSecurityInput = (input: string): { isSafe: boolean; reason?: string } => {
  if (!input || typeof input !== "string") return { isSafe: true };

  const lower = input.toLowerCase();
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /--\s*$/i,
    /or\s+1\s*=\s*1/i,
    /'\s*or\s*'/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      enableAntiF12Protection();
      const reason = "Injeção de código ou payload malicioso detectado pelo Sentinel";
      const banRecord: SecurityBanRecord = {
        fingerprint: "INJECTION_BLOCKED_0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16),
        reason,
        errorCode: "BAN_SENTINEL_INJECTION_0x800999",
        score: 100,
        timestamp: new Date().toISOString()
      };
      reportBanToSupabase(banRecord);
      return { isSafe: false, reason };
    }
  }

  return { isSafe: true };
};

// Controle progressivo de tentativas (Login e IA)
const rateLimitTrackers: Record<string, number[]> = {
  login: [],
  ai_prompt: []
};

const rateLimitWarnings: Record<string, number> = {
  login: 0,
  ai_prompt: 0
};

export const recordRateLimitAttempt = (category: "login" | "ai_prompt"): {
  allowed: boolean;
  isWarning: boolean;
  isBlocked: boolean;
  message?: string;
} => {
  const now = Date.now();
  const windowMs = 60000; // janela de 1 minuto

  // Limpa registros mais antigos que 1 minuto
  rateLimitTrackers[category] = (rateLimitTrackers[category] || []).filter((t) => now - t < windowMs);
  rateLimitTrackers[category].push(now);

  const count = rateLimitTrackers[category].length;

  const limits = {
    login: { warnThreshold: 4, blockThreshold: 8 },
    ai_prompt: { warnThreshold: 6, blockThreshold: 12 }
  };

  const limit = limits[category];

  // 2ª ocorrência / Limite grave -> Bloqueio total com Tela Azul do Sentinel
  if (count >= limit.blockThreshold) {
    enableAntiF12Protection();
    const reason = category === "login"
      ? "Bloqueio Sentinel: Excesso recorrente de tentativas de login (Tentativa de Força Bruta)"
      : "Bloqueio Sentinel: Excesso de solicitações para IA (Rate Limit Severo Violado)";

    const banRecord: SecurityBanRecord = {
      fingerprint: "RATELIMIT_BLOCKED_0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16),
      reason,
      errorCode: "BAN_SENTINEL_RATELIMIT_0x800429",
      score: 100,
      timestamp: new Date().toISOString()
    };
    reportBanToSupabase(banRecord);
    return {
      allowed: false,
      isWarning: false,
      isBlocked: true,
      message: "🚨 Acesso suspenso por violação de segurança e abuso de taxa."
    };
  }

  // 1ª ocorrência -> Aviso de Rate Limit / Desafio Cloudflare
  if (count >= limit.warnThreshold) {
    rateLimitWarnings[category] = (rateLimitWarnings[category] || 0) + 1;
    return {
      allowed: false,
      isWarning: true,
      isBlocked: false,
      message: category === "login"
        ? "⚠️ Aviso de Segurança Cloudflare/Sentinel: Muitas tentativas de login em curto intervalo. Aguarde 1 minuto."
        : "⚠️ Aviso de Rate Limit: Muitas requisições de IA enviadas. Aguarde alguns instantes antes de enviar novamente."
    };
  }

  return { allowed: true, isWarning: false, isBlocked: false };
};

// Execução imediata para destravar computadores travados por cache local antigo
if (typeof window !== "undefined") {
  try {
    clearLocalBan();
  } catch {
    // ignora
  }
}

export const checkIsBannedInSupabase = async (fingerprintHash?: string): Promise<{ isBanned: boolean; record?: SecurityBanRecord }> => {
  const localBan = getLocalBan();
  const effectiveFp = fingerprintHash || localBan?.fingerprint;

  try {
    let currentUserId: string | null = null;
    let currentUserEmail: string | null = null;

    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        currentUserId = data.session.user.id;
        currentUserEmail = data.session.user.email || null;
      }
    } catch {
      // Ignora erro se não autenticado
    }

    // Consulta no Supabase na tabela security_bans estritamente por DISPOSITIVO (fingerprint) ou conta de usuário
    // (Inativada busca por IP para não bloquear subredes/bairros com IPv4 dinâmico ou NAT compartilhado)
    const queries: string[] = [];
    if (effectiveFp && effectiveFp !== "HASH_PROTECTED" && effectiveFp !== "unknown_fingerprint") {
      queries.push(`ip_hash.eq.${effectiveFp}`);
    }
    if (currentUserId) queries.push(`user_id.eq.${currentUserId}`);
    if (currentUserEmail) queries.push(`user_email.eq.${currentUserEmail}`);

    if (queries.length === 0) {
      // Se não há parâmetros de busca válidos, não bloqueia
      clearLocalBan();
      return { isBanned: false };
    }

    const { data: banData, error } = await supabase
      .from("security_bans" as any)
      .select("*")
      .or(queries.join(","))
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Consulta Supabase security_bans:", error.message);
      // Se houver erro de conexão ou tabela ausente, libera por padrão para não bloquear usuários legítimos
      clearLocalBan();
      return { isBanned: false };
    }

    // Se encontrou registro no Supabase
    if (banData && (banData.status === "banned" || !banData.status)) {
      const record: SecurityBanRecord = {
        fingerprint: banData.ip_hash || effectiveFp || "HASH_PROTECTED",
        userId: banData.user_id || currentUserId,
        userEmail: banData.user_email || currentUserEmail,
        reason: banData.reason || "Seu dispositivo ou conta foi bloqueada na tabela de segurança por motivos de violação.",
        errorCode: banData.error_code ? banData.error_code.replace(/^ERR_/, "BAN_") : "BAN_SENTINEL_SECURITY_0x800403",
        score: banData.score || 100,
        url: banData.url || "",
        timestamp: banData.banned_at || new Date().toISOString(),
      };

      saveLocalBan(record);
      return { isBanned: true, record };
    }

    // Se a consulta no Supabase NÃO retornou banimento ativo:
    // Limpa qualquer trava local para destravar o computador!
    clearLocalBan();
    return { isBanned: false };
  } catch (err) {
    console.error("Erro ao verificar status de banimento no Supabase:", err);
    clearLocalBan();
    return { isBanned: false };
  }
};

let cachedIpPromise: Promise<string | null> | null = null;
let lastIpFetchTime = 0;
let cachedIpValue: string | null = null;
let rateLimitBlockedUntil = 0; // Backoff timestamp when 429/708 is encountered

export const fetchClientPublicIp = async (): Promise<string | null> => {
  const now = Date.now();

  // Se estiver em período de Backoff devido a Rate Limit (429 / WAF Challenge)
  if (now < rateLimitBlockedUntil) {
    return cachedIpValue;
  }

  // Cache por 10 minutos (600,000ms)
  if (cachedIpValue && (now - lastIpFetchTime < 600000)) {
    return cachedIpValue;
  }

  // Se já houver uma requisição em andamento, reutiliza a Promise para evitar duplicidade de chamadas
  if (cachedIpPromise) {
    return cachedIpPromise;
  }

  cachedIpPromise = (async () => {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("https://api.ipify.org?format=json", {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 429 || res.status === 708) {
        // Ativa backoff de 60 segundos se receber 429 ou desafio de WAF
        rateLimitBlockedUntil = Date.now() + 60000;
        return cachedIpValue;
      }

      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          cachedIpValue = data.ip;
          lastIpFetchTime = Date.now();
          return data.ip;
        }
      }
    } catch {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch("https://ipapi.co/json/", {
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.status === 429 || res.status === 708) {
          rateLimitBlockedUntil = Date.now() + 60000;
          return cachedIpValue;
        }

        if (res.ok) {
          const data = await res.json();
          if (data && data.ip) {
            cachedIpValue = data.ip;
            lastIpFetchTime = Date.now();
            return data.ip;
          }
        }
      } catch {
        // Ignora falhas de consulta sem travar o aplicativo
      }
    } finally {
      cachedIpPromise = null;
    }
    return cachedIpValue;
  })();

  return cachedIpPromise;
};

export const reportBanToSupabase = async (record: SecurityBanRecord) => {
  try {
    saveLocalBan(record);

    // Tenta capturar o IP público real do cliente
    const publicIp = await fetchClientPublicIp();
    if (publicIp) {
      record.ipAddress = publicIp;
      saveLocalBan(record);
    }

    // Get current auth user if available
    let currentUserId = record.userId;
    let currentUserEmail = record.userEmail;

    if (!currentUserId || !currentUserEmail) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          currentUserId = currentUserId || data.session.user.id;
          currentUserEmail = currentUserEmail || data.session.user.email;
        }
      } catch (err) {
        console.warn("Could not retrieve session user for security log:", err);
      }
    }

    const payload = {
      ip_hash: record.fingerprint || "unknown_fingerprint",
      ip_address: publicIp || record.ipAddress || "N/A",
      client_ip: publicIp || record.ipAddress || "N/A",
      user_id: currentUserId || null,
      user_email: currentUserEmail || null,
      reason: record.reason || "Violacao de seguranca detectada pelo Sentinel",
      error_code: record.errorCode ? record.errorCode.replace(/^ERR_/, "BAN_") : "BAN_SENTINEL_SECURITY_0x800403",
      score: record.score || 100,
      url: record.url || (typeof window !== "undefined" ? window.location.href : ""),
      status: "banned",
      banned_at: record.timestamp || new Date().toISOString(),
    };

    // Tenta gravar na tabela security_bans via upsert e fallback para insert
    let { error: banErr } = await supabase.from("security_bans" as any).upsert(payload as any, { onConflict: "ip_hash" });

    if (banErr) {
      console.warn("Aviso ao tentar UPSERT no Supabase (security_bans):", banErr.message);
      // Fallback 1: Tenta INSERT simples caso a coluna ip_hash não tenha restrição UNIQUE
      const { error: insertErr } = await supabase.from("security_bans" as any).insert(payload as any);
      if (!insertErr) {
        banErr = null;
      } else {
        console.warn("Aviso ao tentar INSERT no Supabase (security_bans):", insertErr.message);
      }
    }

    if (banErr) {
      // Fallback 2: Tenta gravar como log alternativo na tabela security_logs
      await supabase.from("security_logs" as any).insert({
        event: "IP_BLOCKED",
        details: payload,
        created_at: new Date().toISOString(),
      } as any).catch((e) => console.warn("Erro ao salvar security_logs:", e));
    }

    // Se o usuário estiver logado, marca também no perfil
    if (currentUserId) {
      await supabase.from("profiles").upsert({
        id: currentUserId,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Erro ao reportar banimento ao Supabase:", err);
  }
};
