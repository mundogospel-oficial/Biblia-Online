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

    // Consulta no Supabase na tabela security_bans
    const queries: string[] = [];
    if (effectiveFp && effectiveFp !== "HASH_PROTECTED" && effectiveFp !== "unknown_fingerprint") {
      queries.push(`ip_hash.eq.${effectiveFp}`);
    }
    if (localBan?.ipAddress) {
      queries.push(`ip_address.eq.${localBan.ipAddress}`);
      queries.push(`client_ip.eq.${localBan.ipAddress}`);
    }
    if (currentUserId) queries.push(`user_id.eq.${currentUserId}`);
    if (currentUserEmail) queries.push(`user_email.eq.${currentUserEmail}`);

    if (queries.length === 0) {
      return { isBanned: !!localBan, record: localBan || undefined };
    }

    const { data: banData, error } = await supabase
      .from("security_bans" as any)
      .select("*")
      .or(queries.join(","))
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Consulta Supabase security_bans:", error.message);
      // Se deu erro no Supabase (ex: tabela ainda não criada), mantemos a trava local intacta!
      return { isBanned: !!localBan, record: localBan || undefined };
    }

    // Se encontrou registro no Supabase
    if (banData) {
      // Se estiver explicitamente desbanido pelo admin no Supabase (status === 'unbanned' ou status === 'active' === false)
      if (banData.status === "unbanned" || banData.status === "active_false") {
        clearLocalBan();
        return { isBanned: false };
      }

      // Caso contrário (status === 'banned' ou qualquer outro), está bloqueado!
      const record: SecurityBanRecord = {
        fingerprint: banData.ip_hash || effectiveFp || "HASH_PROTECTED",
        userId: banData.user_id || currentUserId,
        userEmail: banData.user_email || currentUserEmail,
        reason: banData.reason || "Seu IP ou conta foi bloqueada na tabela de segurança por motivos de violação.",
        errorCode: banData.error_code || "ERR_SENTINEL_SECURITY_0x800403",
        score: banData.score || 100,
        url: banData.url || "",
        timestamp: banData.banned_at || new Date().toISOString(),
      };

      saveLocalBan(record);
      return { isBanned: true, record };
    }

    // Se o usuário já tinha um bloqueio local e no Supabase não retornou nada:
    // MANTÉM o bloqueio local! Não remove automaticamente para impedir que recarregar a página desfaça o bloqueio!
    if (localBan) {
      return { isBanned: true, record: localBan };
    }

    return { isBanned: false };
  } catch (err) {
    console.error("Erro ao verificar status de banimento no Supabase:", err);
    return { isBanned: !!localBan, record: localBan || undefined };
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
      error_code: record.errorCode || "ERR_SENTINEL_SECURITY_0x800403",
      score: record.score || 100,
      url: record.url || (typeof window !== "undefined" ? window.location.href : ""),
      status: "banned",
      banned_at: record.timestamp || new Date().toISOString(),
    };

    // Tenta gravar na tabela security_bans
    const { error: banErr } = await supabase.from("security_bans" as any).upsert(payload as any, { onConflict: "ip_hash" });

    if (banErr) {
      console.warn("Notificação Supabase (security_bans):", banErr.message);
      // Tenta gravar como log alternativo na tabela security_logs
      await supabase.from("security_logs" as any).insert({
        event: "IP_BLOCKED",
        details: payload,
        created_at: new Date().toISOString(),
      } as any).catch(() => {});
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
