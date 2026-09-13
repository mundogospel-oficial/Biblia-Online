import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

// Implementação RFC 6238 / RFC 4226 TOTP compatível universal com Google Authenticator
// sem depender de módulos Node.js no bundle do navegador do Vite.

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decodifica uma chave Base32 (padrão Google Authenticator) em Uint8Array
 */
function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Gera um segredo Base32 aleatório (160 bits / 32 chars)
 */
export function generateTotpSecret(): string {
  const buffer = new Uint8Array(20);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < 20; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }

  let secret = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      secret += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    secret += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return secret;
}

/**
 * Gera o código TOTP de 6 dígitos para um determinado timestamp usando Web Crypto HMAC-SHA1
 */
export async function generateTotpCode(secret: string, timestamp: number = Date.now(), stepSeconds = 30): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Big-endian 64-bit integer
  counterView.setUint32(0, Math.floor(counter / 0x100000000));
  counterView.setUint32(4, counter & 0xffffffff);

  const keyBytes = base32ToUint8Array(secret);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
  const hmacResult = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Valida o token TOTP com janela de tolerância de ±1 passo (30s antes e depois)
 */
export async function verifyTotpCode(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const now = Date.now();
  const steps = [-1, 0, 1]; // Tolerância de 30s para relógios dessincronizados

  for (const stepOffset of steps) {
    try {
      const generated = await generateTotpCode(secret, now + stepOffset * 30 * 1000);
      if (generated === cleanToken) {
        return true;
      }
    } catch (err) {
      console.error("[TOTP Verify] Erro ao calcular HMAC:", err);
    }
  }

  return false;
}

export interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
}

/**
 * Gera um segredo TOTP, URL otpauth, QR Code e códigos de backup para o usuário
 */
export async function generateTwoFactorSetup(userEmail: string, appName = "Biblia Online"): Promise<TwoFactorSetupData> {
  const secret = generateTotpSecret();
  const cleanEmail = encodeURIComponent(userEmail.trim().toLowerCase());
  const cleanApp = encodeURIComponent(appName);
  
  const otpauthUrl = `otpauth://totp/${cleanApp}:${cleanEmail}?secret=${secret}&issuer=${cleanApp}&algorithm=SHA1&digits=6&period=30`;
  
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 260,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  // Gera 6 códigos de backup alfanuméricos seguros (ex: ABCD-1234)
  const backupCodes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    backupCodes.push(`${part1}-${part2}`);
  }

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Ativa o 2FA para o usuário no banco de dados (tabela profiles) após confirmação do primeiro código
 */
export async function enableTwoFactorForUser(
  userId: string,
  secret: string,
  backupCodes: string[],
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyTotpCode(verificationToken, secret);
  if (!isValid) {
    return { success: false, error: "Código do autenticador inválido ou expirado. Tente novamente." };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[2FA] Erro ao salvar 2FA em profiles:", error);
      return { success: false, error: "Erro ao salvar verificação em duas etapas no servidor." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[2FA] Erro inesperado ao ativar 2FA:", err);
    return { success: false, error: err?.message || "Erro inesperado ao ativar 2FA." };
  }
}

/**
 * Desativa o 2FA para o usuário
 */
export async function disableTwoFactorForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[2FA] Erro ao desativar 2FA em profiles:", error);
      return { success: false, error: "Não foi possível desativar o 2FA." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[2FA] Erro ao desativar 2FA:", err);
    return { success: false, error: err?.message || "Erro ao desativar 2FA." };
  }
}

/**
 * Consulta o status de 2FA do usuário
 */
export async function getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("two_factor_enabled, two_factor_secret")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return { enabled: false, hasSecret: false };
    }

    return {
      enabled: Boolean((data as any).two_factor_enabled),
      hasSecret: Boolean((data as any).two_factor_secret),
    };
  } catch (err) {
    console.error("[2FA] Erro ao verificar status:", err);
    return { enabled: false, hasSecret: false };
  }
}

/**
 * Valida o 2FA no momento do login contra o banco de dados do usuário
 */
export async function validateLoginTwoFactor(
  userId: string,
  codeOrBackup: string
): Promise<{ success: boolean; error?: string }> {
  const cleanInput = codeOrBackup.trim().toUpperCase();

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("two_factor_enabled, two_factor_secret, two_factor_backup_codes")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return { success: false, error: "Perfil do usuário não encontrado." };
    }

    const isEnabled = Boolean((profile as any).two_factor_enabled);
    const secret = (profile as any).two_factor_secret;
    const backupCodes: string[] = Array.isArray((profile as any).two_factor_backup_codes)
      ? (profile as any).two_factor_backup_codes
      : [];

    if (!isEnabled || !secret) {
      // 2FA não está ativo para esta conta
      return { success: true };
    }

    // 1. Testa se é um código TOTP de 6 dígitos
    if (/^\d{6}$/.test(cleanInput.replace(/\s+/g, ""))) {
      const isValidTotp = await verifyTotpCode(cleanInput, secret);
      if (isValidTotp) {
        return { success: true };
      }
    }

    // 2. Testa se é um código de backup (ex: ABCD-1234)
    const backupIndex = backupCodes.findIndex(
      (c) => c.toUpperCase() === cleanInput || c.replace("-", "").toUpperCase() === cleanInput.replace("-", "")
    );

    if (backupIndex !== -1) {
      // Remove o código de backup já utilizado para não permitir reuso
      const updatedCodes = [...backupCodes];
      updatedCodes.splice(backupIndex, 1);

      await supabase
        .from("profiles")
        .update({
          two_factor_backup_codes: updatedCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      return { success: true };
    }

    return { success: false, error: "Código de autenticação ou código de recuperação incorreto." };
  } catch (err: any) {
    console.error("[2FA] Erro na validação de login:", err);
    return { success: false, error: err?.message || "Erro ao validar 2FA." };
  }
}
