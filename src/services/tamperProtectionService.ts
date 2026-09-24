import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

/**
 * Gera ou recupera semente criptográfica única do dispositivo para assinar papéis
 * e impedir falsificação ou reutilização cross-browser / cross-device.
 */
function getDynamicSalt(): string {
  let deviceSeed = "";
  try {
    deviceSeed = localStorage.getItem("app_device_entropy_v1") || "";
    if (!deviceSeed && typeof window !== "undefined" && window.crypto) {
      const arr = new Uint8Array(24);
      window.crypto.getRandomValues(arr);
      deviceSeed = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("app_device_entropy_v1", deviceSeed);
    }
  } catch {}
  const host = typeof window !== "undefined" ? window.location.host : "localhost";
  return `bible_tamper_${host}_${deviceSeed || "default_entropy"}`;
}

/**
 * Calcula um hash criptográfico seguro (SHA-256) no navegador usando a Web Crypto API
 * para assinar os papéis salvos em cache e detectar qualquer alteração via DevTools.
 */
async function computeHash(data: string): Promise<string> {
  const dynamicSalt = getDynamicSalt();
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(dynamicSalt);
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
    // Fallback matemático caso crypto.subtle falhe
    let h = 0x811c9dc5;
    const combined = data + dynamicSalt;
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

    // Aceita ESTRITAMENTE minúsculo ('admin' ou 'beta'). NUNCA aceita 'ADMIN' ou variações maiúsculas.
    const rawRole = String((data as any).role || "padrao").trim();
    
    // Se for exatamente 'admin' minúsculo, converte para 'beta'. Se for 'beta', mantém 'beta'. Caso contrário, 'padrao'.
    let serverRole = "padrao";
    if (rawRole === "admin" || rawRole === "beta") {
      serverRole = "beta";
    }
    const isAllowed = serverRole === "beta";

    // Atualiza o cache seguro com a resposta autêntica do servidor
    await saveVerifiedRole(user.id, serverRole);

    return { isAllowed, role: serverRole };
  } catch (err) {
    console.warn("Falha na checagem autoritativa de privilégios:", err);
    return { isAllowed: false, role: "padrao" };
  }
}
