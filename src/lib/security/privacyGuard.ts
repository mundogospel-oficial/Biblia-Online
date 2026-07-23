/**
 * Privacy & Security Guard for AI Requests
 * Ensures user prompts do not leak PII (Personally Identifiable Information)
 * or system secrets to AI providers (Google Gemini / OpenRouter).
 */

export interface SanitizedPromptResult {
  cleanPrompt: string;
  hasPiiDetected: boolean;
  detectedTypes: string[];
}

/**
 * Sanitizes user prompt by removing PII data (CPF, CNPJ, Email, Phone, Credit Cards, Keys)
 * and neutralizing potential prompt injection triggers.
 */
export function sanitizeUserPrompt(rawPrompt: string): SanitizedPromptResult {
  if (!rawPrompt) {
    return { cleanPrompt: "", hasPiiDetected: false, detectedTypes: [] };
  }

  let text = rawPrompt;
  const detectedTypes: string[] = [];

  // 1. CPF (e.g., 000.000.000-00 or 11 continuous digits in context)
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
  if (cpfRegex.test(text)) {
    detectedTypes.push("CPF");
    text = text.replace(cpfRegex, "[CPF_REMOVIDO_POR_PRIVACIDADE]");
  }

  // 2. CNPJ
  const cnpjRegex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
  if (cnpjRegex.test(text)) {
    detectedTypes.push("CNPJ");
    text = text.replace(cnpjRegex, "[CNPJ_REMOVIDO_POR_PRIVACIDADE]");
  }

  // 3. Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  if (emailRegex.test(text)) {
    detectedTypes.push("Email");
    text = text.replace(emailRegex, "[EMAIL_REMOVIDO_POR_PRIVACIDADE]");
  }

  // 4. Phone Numbers (BR formats: (11) 99999-9999, +5511999999999, 11 99999-9999)
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b/g;
  if (phoneRegex.test(text)) {
    // Only replace if it looks like a phone and not a bible chapter/verse reference like "11:9" or "John 3:16"
    text = text.replace(phoneRegex, (match) => {
      if (match.includes(":") || match.trim().length < 8) return match;
      detectedTypes.push("Telefone");
      return "[TELEFONE_REMOVIDO_POR_PRIVACIDADE]";
    });
  }

  // 5. Credit Cards (13 to 19 digits)
  const creditCardRegex = /\b(?:\d[ -]*?){13,19}\b/g;
  if (creditCardRegex.test(text)) {
    text = text.replace(creditCardRegex, (match) => {
      const cleanNums = match.replace(/\D/g, "");
      if (cleanNums.length >= 13 && cleanNums.length <= 19) {
        detectedTypes.push("Cartão");
        return "[CARTAO_REMOVIDO_POR_PRIVACIDADE]";
      }
      return match;
    });
  }

  // 6. API Keys / Passwords / Secrets patterns
  const secretsRegex = /\b(?:sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|sbp_[a-zA-Z0-9]{20,}|bearer\s+[a-zA-Z0-9._-]{20,})\b/gi;
  if (secretsRegex.test(text)) {
    detectedTypes.push("Chave/Segredo");
    text = text.replace(secretsRegex, "[CREDENCIAIS_REMOVIDAS]");
  }

  // 7. Strip potential Jailbreak / System Prompt Exfiltration attempts
  const injectionRegex = /(?:ignore\s+previous\s+instructions|system\s+prompt|revelar\s+instruç[õo]es|exibir\s+chave|mostre\s+seu\s+prompt\s+mestre|ignore\s+todas\s+as\s+regras)/gi;
  if (injectionRegex.test(text)) {
    detectedTypes.push("Tentativa_Injecao");
    text = text.replace(injectionRegex, "[COMANDO_RESTRITO_NEUTRALIZADO]");
  }

  return {
    cleanPrompt: text.trim(),
    hasPiiDetected: detectedTypes.length > 0,
    detectedTypes
  };
}

/**
 * Enforces Zero Data Retention & Privacy clause on System Prompt
 */
export function buildPrivacyEnhancedSystemRule(baseSystemRule: string): string {
  const privacyHeader = `[DIRETIVA DE PRIVACIDADE E SEGURANÇA MÁXIMA DO SISTEMA]
1. NUNCA memorize, armazene ou repita dados pessoais, nomes reais, senhas ou identificadores.
2. Trate esta consulta de forma estritamente privada, sem utilizar nenhuma informação para treinamento ou histórico compartilhado.
3. Se o texto contiver marcações de privacidade como [DADO_REMOVIDO], responda focando exclusivamente no aspecto teológico ou bíblico sem pedir o dado de volta.

`;

  return privacyHeader + (baseSystemRule || "");
}
