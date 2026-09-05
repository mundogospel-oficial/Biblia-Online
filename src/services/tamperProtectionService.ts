import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const INTEGRITY_SALT = "bible_tamper_shield_2026_salt_v1";

/**
 * Calcula um hash criptográfico seguro (SHA-256) no navegador usando a Web Crypto API
 * para assinar os papéis salvos em cache e detectar qualquer alteração via DevTools.
 */
async function computeHash(data: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(INTEGRITY_SALT);
    const msgData = enc.encode(data);
    
    // Importa chave HMAC nativa
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    // Fallback matemático simples caso crypto.subtle falhe
    let h = 0x811c9dc5;
    const combined = data + INTEGRITY_SALT;
    for (let i = 0; i < combined.length; i++) {
      h ^= combined.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }
}

/**
 * Salva o papel do usuário com assinatura criptográfica anti-violação.
 */
export async function saveVerifiedRole(userId: string, role: string): Promise<void> {
  if (!userId) return;
  const cleanRole = String(role || "padrao").trim().toLowerCase();
  const signature = await computeHash(`${userId}:${cleanRole}`);

  const payload = {
    role: cleanRole,
    sig: signature,
    ts: Date.now(),
  };

  try {
    localStorage.setItem(`secure_role_payload_${userId}`, JSON.stringify(payload));
  } catch {}
}

/**
 * Obtém o papel salvo apenas se a assinatura criptográfica for 100% válida.
 * Se alguém alterou manualmente via DevTools (ex: trocou 'padrao' para 'beta'),
 * a assinatura será inválida e o acesso será IMEDIATAMENTE revogado.
 */
export async function getVerifiedRoleFromCache(userId: string): Promise<string> {
  if (!userId) return "padrao";

  try {
    const raw = localStorage.getItem(`secure_role_payload_${userId}`);
    if (!raw) return "padrao";

    const payload = JSON.parse(raw);
    if (!payload || !payload.role || !payload.sig) {
      // Violação ou formato inválido: purga e rejeita
      localStorage.removeItem(`secure_role_payload_${userId}`);
      return "padrao";
    }

    const expectedSig = await computeHash(`${userId}:${payload.role}`);
    if (payload.sig !== expectedSig) {
      console.warn("[Segurança] Tentativa de adulteração de privilégios detectada via DevTools!");
      localStorage.removeItem(`secure_role_payload_${userId}`);
      localStorage.removeItem(`user_role_${userId}`);
      return "padrao";
    }

    return payload.role;
  } catch (err) {
    return "padrao";
  }
}

/**
 * Validação AUTORITATIVA no servidor (Supabase):
 * Esta função consulta DIRETAMENTE o banco de dados Supabase para confirmar se o usuário atual
 * realmente possui permissão de beta ou admin.
 * Não depende de nada no cliente ou no localStorage, impedindo qualquer fraude via DevTools.
 */
export async function verifyBetaPermissionWithServer(): Promise<{ isAllowed: boolean; role: string }> {
  if (!isSupabaseConfigured) {
    return { isAllowed: false, role: "padrao" };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isAllowed: false, role: "padrao" };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return { isAllowed: false, role: "padrao" };
    }

    const serverRole = String((data as any).role || "padrao").trim().toLowerCase();
    const isAllowed = serverRole === "beta" || serverRole === "admin";

    // Atualiza o cache seguro com a resposta autêntica do servidor
    await saveVerifiedRole(user.id, serverRole);

    return { isAllowed, role: serverRole };
  } catch (err) {
    console.warn("Falha na checagem autoritativa de privilégios:", err);
    return { isAllowed: false, role: "padrao" };
  }
}
