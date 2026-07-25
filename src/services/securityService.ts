import { supabase } from "@/integrations/supabase/client";

export interface SecurityBanRecord {
  fingerprint: string;
  userId?: string | null;
  userEmail?: string | null;
  reason: string;
  errorCode: string;
  score: number;
  url?: string;
  timestamp?: string;
}

const LOCAL_BAN_KEY = "sentinel_ip_blocked_v1";

export const saveLocalBan = (banInfo: SecurityBanRecord) => {
  try {
    localStorage.setItem(LOCAL_BAN_KEY, JSON.stringify({
      ...banInfo,
      bannedAt: new Date().toISOString()
    }));
  } catch (e) {
    console.warn("Could not save local ban state:", e);
  }
};

export const getLocalBan = (): SecurityBanRecord | null => {
  try {
    const raw = localStorage.getItem(LOCAL_BAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearLocalBan = () => {
  try {
    localStorage.removeItem(LOCAL_BAN_KEY);
  } catch (e) {
    console.warn("Could not clear local ban state:", e);
  }
};

export const checkIsBannedInSupabase = async (fingerprintHash?: string): Promise<{ isBanned: boolean; record?: SecurityBanRecord }> => {
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
      // Ignora erro de sessão se não autenticado
    }

    // Consulta no Supabase na tabela security_bans
    const queries: string[] = [];
    if (fingerprintHash) queries.push(`ip_hash.eq.${fingerprintHash}`);
    if (currentUserId) queries.push(`user_id.eq.${currentUserId}`);
    if (currentUserEmail) queries.push(`user_email.eq.${currentUserEmail}`);

    if (queries.length === 0) {
      return { isBanned: false };
    }

    const { data: banData, error } = await supabase
      .from("security_bans" as any)
      .select("*")
      .or(queries.join(","))
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Aviso na checagem de banimento no Supabase:", error.message);
    }

    if (banData && (banData.status === "banned" || !banData.status)) {
      const record: SecurityBanRecord = {
        fingerprint: banData.ip_hash || fingerprintHash || "HASH_PROTECTED",
        userId: banData.user_id || currentUserId,
        userEmail: banData.user_email || currentUserEmail,
        reason: banData.reason || "Seu IP ou conta foi bloqueada na tabela de segurança por motivos de violação.",
        errorCode: banData.error_code || "ERR_SENTINEL_SECURITY_0x800403",
        score: banData.score || 100,
        url: banData.url || "",
        timestamp: banData.banned_at || new Date().toISOString(),
      };

      // Atualiza o cache local
      saveLocalBan(record);
      return { isBanned: true, record };
    }

    // Se NÃO encontrou registro banido no Supabase, remove do cache local (permite liberar se o admin removeu da tabela!)
    clearLocalBan();
    return { isBanned: false };
  } catch (err) {
    console.error("Erro ao verificar status de banimento no Supabase:", err);
    return { isBanned: false };
  }
};

export const reportBanToSupabase = async (record: SecurityBanRecord) => {
  try {
    saveLocalBan(record);

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
    const { error: banErr } = await supabase.from("security_bans" as any).upsert(payload as any);

    if (banErr) {
      console.warn("Notificação Supabase (security_bans):", banErr.message);
      // Tenta gravar como log alternativo na tabela security_logs
      await supabase.from("security_logs" as any).insert({
        event: "IP_BLOCKED",
        details: payload,
        created_at: new Date().toISOString(),
      } as any).catch(() => {});
    }

    // Se o usuário estiver logado, marca também no perfil (caso exista coluna status ou flagged)
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
