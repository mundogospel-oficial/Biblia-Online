/**
 * Utilitário de segurança para verificação de senhas vazadas usando HaveIBeenPwned (k-Anonymity)
 * e Web Crypto API nativa (crypto.subtle).
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
  // Se a senha for muito curta ou vazia, não faz a requisição
  if (!password || password.length < 8) {
    return { isPwned: false, count: 0 };
  }

  try {
    // 1. Gera o hash SHA-1 da senha em maiúsculas usando a Web Crypto API nativa
    const fullHash = await sha1Hex(password);

    // 2. Separa os 5 primeiros caracteres (prefixo de k-Anonymity) e os 35 restantes (sufixo)
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    // 3. Executa a requisição HTTP com timeout de 3.5 segundos para não travar o formulário caso a API oscile
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true" // Técnica de preenchimento para segurança k-Anonymity
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[PwnedCheck] Resposta diferente de OK da API HaveIBeenPwned:", response.status);
      return { isPwned: false, count: 0 };
    }

    const responseText = await response.text();

    // 4. Analisa a lista de sufixos retornados
    const lines = responseText.split("\n");
    for (const line of lines) {
      const [lineSuffix, countStr] = line.trim().split(":");
      if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
        const count = parseInt(countStr || "0", 10);
        if (count > 0) {
          const formattedCount = count.toLocaleString("pt-BR");
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
    // Caso a API esteja fora do ar, offline ou ocorra timeout, loga um aviso e libera a criação
    console.warn("[PwnedCheck] Falha na verificação de vazamento de senha (fallback gracioso):", err);
    return { isPwned: false, count: 0 };
  }
}
