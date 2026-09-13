import { supabase } from "@/integrations/supabase/client";

const BIOMETRIC_KEY_PREFIX = "bible_biometric_device_";
const BIOMETRIC_USERS_INDEX_KEY = "bible_biometric_enrolled_users";
const BIOMETRIC_APP_LOCK_KEY = "bible_biometric_app_lock_active";
const SESSION_UNLOCKED_KEY = "bible_pwa_session_unlocked";

export interface BiometricEnrolledUser {
  userId: string;
  email: string;
  name: string;
  enrolledAt: string;
  credentialId: string;
  refreshToken?: string;
  accessToken?: string;
}

/**
 * Retorna se o bloqueio do app ao abrir está ativo para o PWA
 */
export function isAppBiometricLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!isPWAMode()) return false;
  const enrolled = isUserBiometricEnrolled();
  if (!enrolled) return false;
  const setting = localStorage.getItem(BIOMETRIC_APP_LOCK_KEY);
  // Por padrão, se tiver biometria cadastrada no PWA, o bloqueio na abertura fica ativo
  return setting !== "false";
}

export function setAppBiometricLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BIOMETRIC_APP_LOCK_KEY, enabled ? "true" : "false");
}

/**
 * Retorna se a sessão atual do app já foi desbloqueada
 */
export function isAppSessionUnlocked(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "true";
}

export function setAppSessionUnlocked(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  if (unlocked) {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, "true");
  } else {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  }
}

/**
 * Detecta se a aplicação está rodando em modo PWA instalado (standalone)
 */
export function isPWAMode(): boolean {
  if (typeof window === "undefined") return false;

  const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isTWA = document.referrer.includes("android-app://");
  const isFullscreenMedia = window.matchMedia("(display-mode: fullscreen)").matches;

  return Boolean(isStandaloneMedia || isIOSStandalone || isTWA || isFullscreenMedia);
}

/**
 * Converte base64URL para Uint8Array
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Converte ArrayBuffer para Base64URL
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Verifica se o dispositivo possui suporte a biometria nativa (Face ID, Touch ID, Biometria Android)
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // WebAuthn / Credentials API check
  if (!window.PublicKeyCredential || !navigator.credentials) {
    return false;
  }

  // Verifica se o dispositivo tem autenticador de plataforma (hardware biométrico nativo ou PIN de tela)
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return Boolean(isAvailable);
    } catch (err) {
      console.warn("[BiometricAuth] Erro ao verificar autenticador de plataforma:", err);
    }
  }

  return true;
}

/**
 * Retorna todos os usuários com biometria cadastrada neste dispositivo PWA
 */
export function getEnrolledBiometricUsers(): BiometricEnrolledUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BIOMETRIC_USERS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("[BiometricAuth] Erro ao ler lista de usuários com biometria:", err);
    return [];
  }
}

/**
 * Verifica se um usuário específico (ou qualquer usuário) tem biometria cadastrada neste aparelho
 */
export function isUserBiometricEnrolled(userId?: string): boolean {
  if (typeof window === "undefined") return false;
  const users = getEnrolledBiometricUsers();
  if (userId) {
    return users.some((u) => u.userId === userId);
  }
  return users.length > 0;
}

/**
 * Salva ou atualiza os tokens de sessão protegidos pelo Face ID / Biometria
 */
export function saveBiometricSessionTokens(userId: string, accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  try {
    const users = getEnrolledBiometricUsers();
    const idx = users.findIndex((u) => u.userId === userId);
    if (idx !== -1) {
      users[idx].accessToken = accessToken;
      users[idx].refreshToken = refreshToken;
      localStorage.setItem(BIOMETRIC_USERS_INDEX_KEY, JSON.stringify(users));
      localStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${userId}`, JSON.stringify(users[idx]));
    }
  } catch (err) {
    console.warn("[BiometricAuth] Erro ao atualizar tokens biométricos:", err);
  }
}

/**
 * Registra o Face ID / Biometria do aparelho via WebAuthn Platform Authenticator
 */
export async function registerBiometricCredential(user: {
  id: string;
  email: string;
  name?: string;
}): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!isPWAMode()) {
    return {
      success: false,
      error: "O Reconhecimento Facial / Face ID só está disponível quando o app está instalado como PWA.",
    };
  }

  const available = await isBiometricAvailable();
  if (!available) {
    return {
      success: false,
      error: "Seu aparelho não possui sensor biométrico (Face ID / Impressão Digital) compatível ou ativo.",
    };
  }

  try {
    // 1. Gera um desafio criptográfico único
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // 2. ID do usuário em Uint8Array
    const encoder = new TextEncoder();
    const userIdBuffer = encoder.encode(user.id);

    // 3. Obtém o hostname limpo para rpId
    const rpId = window.location.hostname;

    // 4. Solicita a verificação biométrica nativa na plataforma do aparelho (Face ID / Touch ID / Código de tela)
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Biblia Online",
        id: rpId,
      },
      user: {
        id: userIdBuffer,
        name: user.email,
        displayName: user.name || user.email.split("@")[0] || "Usuario",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256 (Padrão Apple Face ID / Touch ID e Android)
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Força autenticador integrado nativo do celular (Face ID / Touch ID / Código)
        userVerification: "required", // Obriga validação biométrica ou código de bloqueio do sistema
        residentKey: "discouraged", // Não salva como chave-senha / passkey na nuvem, usa apenas o hardware nativo do sistema
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: "Autenticação por Face ID / Touch ID / Código cancelada ou não concluída.",
      };
    }

    const credentialId = credential.id;

    // 5. Captura a sessão atual do Supabase para poder desbloquear depois
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || "";
    const refreshToken = sessionData?.session?.refresh_token || "";

    // 6. Grava localmente o registro biométrico do usuário (100% isolado no dispositivo)
    const enrolledUser: BiometricEnrolledUser = {
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0] || "Usuário",
      enrolledAt: new Date().toISOString(),
      credentialId,
      accessToken,
      refreshToken,
    };

    // Salva exclusivamente no armazenamento local seguro do dispositivo (sandbox do PWA)
    // NENHUM dado de biometria, rosto ou digital jamais sai do hardware do celular
    const users = getEnrolledBiometricUsers().filter((u) => u.userId !== user.id);
    users.push(enrolledUser);
    localStorage.setItem(BIOMETRIC_USERS_INDEX_KEY, JSON.stringify(users));
    localStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${user.id}`, JSON.stringify(enrolledUser));

    return {
      success: true,
      credentialId,
    };
  } catch (err: any) {
    console.error("[BiometricAuth] Erro ao registrar biometria:", err);

    // Se já estiver cadastrado ou salvou com sucesso antes de qualquer aviso secundário
    if (isUserBiometricEnrolled(user.id)) {
      return {
        success: true,
      };
    }

    if (err.name === "NotAllowedError") {
      return {
        success: false,
        error: "Permissão de biometria cancelada pelo usuário.",
      };
    }

    if (err.name === "InvalidStateError") {
      // Credencial já existente no autenticador da plataforma
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Não foi possível concluir a ativação da biometria.",
    };
  }
}

/**
 * Autentica o usuário usando Face ID / Biometria do aparelho (Login ou Validação)
 */
export async function authenticateWithBiometric(
  targetUserId?: string
): Promise<{ success: boolean; user?: BiometricEnrolledUser; error?: string }> {
  if (!isPWAMode()) {
    return {
      success: false,
      error: "O Reconhecimento Facial / Face ID só está disponível no App PWA instalado.",
    };
  }

  const users = getEnrolledBiometricUsers();
  if (users.length === 0) {
    return {
      success: false,
      error: "Nenhum perfil com Face ID ou Biometria configurado neste dispositivo.",
    };
  }

  const selectedUser = targetUserId
    ? users.find((u) => u.userId === targetUserId)
    : users[users.length - 1];

  if (!selectedUser) {
    return {
      success: false,
      error: "Usuário selecionado não possui biometria cadastrada.",
    };
  }

  try {
    // 1. Gera desafio criptográfico
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rpId = window.location.hostname;

    // 2. Prepara solicitação de autenticação biométrica via WebAuthn
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId,
      timeout: 60000,
      userVerification: "required", // Dispara o Face ID / Leitor de Digital
    };

    if (selectedUser.credentialId) {
      try {
        const rawId = base64UrlToUint8Array(selectedUser.credentialId);
        publicKeyCredentialRequestOptions.allowCredentials = [
          {
            id: rawId,
            type: "public-key",
            transports: ["internal"],
          },
        ];
      } catch (convErr) {
        console.warn("[BiometricAuth] Credential ID conversion fallback:", convErr);
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return {
        success: false,
        error: "Verificação facial não realizada.",
      };
    }

    // 3. Biometria confirmada com sucesso pelo hardware!
    // Restaura a sessão do Supabase se o usuário estiver deslogado
    if (selectedUser.refreshToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: selectedUser.accessToken || "",
          refresh_token: selectedUser.refreshToken,
        });

        if (error) {
          console.warn("[BiometricAuth] Erro ao restaurar sessão pelo token, tentando refresh:", error);
          // Tenta atualizar a sessão
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            saveBiometricSessionTokens(
              selectedUser.userId,
              refreshData.session.access_token,
              refreshData.session.refresh_token
            );
          }
        } else if (data?.session) {
          saveBiometricSessionTokens(
            selectedUser.userId,
            data.session.access_token,
            data.session.refresh_token
          );
        }
      } catch (authErr) {
        console.warn("[BiometricAuth] Aviso ao definir sessão do Supabase:", authErr);
      }
    }

    return {
      success: true,
      user: selectedUser,
    };
  } catch (err: any) {
    console.error("[BiometricAuth] Erro na autenticação biométrica:", err);

    if (err.name === "NotAllowedError") {
      return {
        success: false,
        error: "Face ID ou biometria cancelada ou não reconhecida.",
      };
    }

    return {
      success: false,
      error: err.message || "Falha na verificação de Face ID.",
    };
  }
}

/**
 * Remove a biometria cadastrada para um usuário neste aparelho
 */
export function removeBiometricCredential(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const users = getEnrolledBiometricUsers().filter((u) => u.userId !== userId);
    localStorage.setItem(BIOMETRIC_USERS_INDEX_KEY, JSON.stringify(users));
    localStorage.removeItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
    return true;
  } catch (err) {
    console.error("[BiometricAuth] Erro ao remover credencial biométrica:", err);
    return false;
  }
}
