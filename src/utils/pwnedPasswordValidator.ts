/**
 * Utilitário de segurança para verificação de senhas vazadas usando HaveIBeenPwned (k-Anonymity)
 * e Web Crypto API nativa do navegador (crypto.subtle).
 */

/**
 * Calcula o hash SHA-1 de uma string usando a Web Crypto API nativa do navegador (crypto.subtle).
 * Retorna a string do hash em letras maiúsculas (40 caracteres hexadecimais).
 */
export async function sha1Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export interface PwnedCheckResult {
  isPwned: boolean;
  count: number;
  error?: string;
}

/**
 * Consulta a API gratuita HaveIBeenPwned usando o modelo de k-Anonymity.
 * Envia apenas os 5 primeiros caracteres do hash SHA-1 da senha para a API.
 * A senha original NUNCA é transmitida nem sai do navegador do usuário.
 * 
 * @param password A senha a ser verificada
 * @returns Promessa com PwnedCheckResult
 */
export async function checkPwnedPassword(password: string): Promise<PwnedCheckResult> {
  if (!password) {
    return { isPwned: false, count: 0 };
  }

  try {
    // 1. Gera o hash SHA-1 completo em maiúsculas usando a Web Crypto API nativa
    const fullHash = await sha1Hex(password);

    // 2. Separa os 5 primeiros caracteres (prefixo de k-Anonymity) e os 35 restantes (sufixo)
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    let responseText: string | null = null;

    // Estratégia 1: Tenta via rota Proxy do Servidor local (/api/pwned-check/PREFIX)
    try {
      const controller1 = new AbortController();
      const timeout1 = setTimeout(() => controller1.abort(), 4000);
      const proxyRes = await fetch(`/api/pwned-check/${prefix}`, {
        method: "GET",
        signal: controller1.signal
      });
      clearTimeout(timeout1);
      if (proxyRes.ok) {
        responseText = await proxyRes.text();
      }
    } catch (e) {
      console.warn("[PwnedCheck] Proxy local falhou, tentando requisição direta HIBP...", e);
    }

    // Estratégia 2: Se a proxy local não respondeu, tenta diretamente a API pública HIBP
    if (!responseText) {
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 4000);
        const directRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
          method: "GET",
          signal: controller2.signal
        });
        clearTimeout(timeout2);
        if (directRes.ok) {
          responseText = await directRes.text();
        }
      } catch (e) {
        console.warn("[PwnedCheck] Requisição direta HIBP também falhou.", e);
      }
    }

    if (!responseText) {
      console.warn("[PwnedCheck] Não foi possível obter a lista de vazamentos da HIBP.");
      return { isPwned: false, count: 0 };
    }

    // 3. Analisa os sufixos retornados pela API (formato SUFIXO:QUANTIDADE)
    const lines = responseText.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const lineSuffix = line.substring(0, colonIdx).trim().toUpperCase();
      const countStr = line.substring(colonIdx + 1).trim();

      if (lineSuffix === suffix) {
        const count = parseInt(countStr, 10);
        if (!isNaN(count) && count > 0) {
          const formattedCount = count.toLocaleString("pt-BR");
          console.warn(`[PwnedCheck] ALERTA: Senha encontrada em ${formattedCount} vazamentos públicos!`);
          return {
            isPwned: true,
            count,
            error: `Esta senha já apareceu em ${formattedCount} vazamentos de dados na internet. Por segurança, escolha outra senha mais forte.`
          };
        }
      }
    }

    return { isPwned: false, count: 0 };
  } catch (err) {
    console.warn("[PwnedCheck] Erro inesperado ao consultar HaveIBeenPwned:", err);
    return { isPwned: false, count: 0 };
  }
}
