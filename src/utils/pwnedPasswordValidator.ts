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
  if (!password || !password.trim()) {
    return { isPwned: false, count: 0 };
  }

  try {
    // 1. Gera o hash SHA-1 completo em maiúsculas usando a Web Crypto API nativa
    const fullHash = await sha1Hex(password);

    // 2. Separa os 5 primeiros caracteres (prefixo de k-Anonymity) e os 35 restantes (sufixo)
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    // 3. Executa a requisição HTTP pura sem cabeçalhos customizados para evitar preflight CORS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[PwnedCheck] Resposta de erro da API HIBP:", response.status);
      return { isPwned: false, count: 0 };
    }

    const responseText = await response.text();

    // 4. Analisa a lista de sufixos retornados pela API
    const lines = responseText.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r/g, "").trim();
      if (!line) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const lineSuffix = line.substring(0, colonIdx).trim().toUpperCase();
      const countStr = line.substring(colonIdx + 1).trim();

      if (lineSuffix === suffix) {
        const count = parseInt(countStr, 10);
        if (!isNaN(count) && count > 0) {
          const formattedCount = count.toLocaleString("pt-BR");
          console.warn(`[PwnedCheck] Senha encontrada em ${formattedCount} vazamentos.`);
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
    console.warn("[PwnedCheck] Falha/Timeout ao consultar API HaveIBeenPwned (fallback seguro):", err);
    return { isPwned: false, count: 0 };
  }
}
