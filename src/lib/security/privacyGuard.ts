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
 * Mask PII in text for UI display and AI transmission
 */
export function maskPiiInText(text: string): string {
  if (!text) return text;
  let result = text;

  // 1. Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  result = result.replace(emailRegex, "[E-MAIL OCULTO]");

  // 2. CPF (Formatted: 000.000.000-00 or Unformatted with explicit cpf label)
  const formattedCpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  result = result.replace(formattedCpfRegex, "[CPF OCULTO]");

  // Unformatted 11 digits ONLY if explicitly preceded by CPF label or keyword
  const labeledCpfRegex = /(?:cpf\s*:?\s*)(\d{11})\b/gi;
  result = result.replace(labeledCpfRegex, "cpf: [CPF OCULTO]");

  // 3. CNPJ (Formatted: 00.000.000/0001-00)
  const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
  result = result.replace(cnpjRegex, "[CNPJ OCULTO]");

  // 4. Cartão de Crédito / Dados de Pagamento / PIX / Conta Bancária
  const pixKeyRegex = /(?:chave\s*pix|cart[aã]o|cvv|senha|dados\s*de\s*pagamento)\s*:?\s*[a-zA-Z0-9.\-_@+]+/gi;
  result = result.replace(pixKeyRegex, (match) => {
    const prefix = match.split(/[:\s]+/)[0];
    return `${prefix}: [DADOS DE PAGAMENTO OCULTOS]`;
  });

  // 5. Telefone (explicit format like (XX) 9XXXX-XXXX or +55 XX 9XXXX-XXXX or labeled as tel/fone/whatsapp)
  const phoneRegex = /(?:\+?55\s?)?(?:\(\d{2}\)\s?)(?:9\d{4}|\d{4})[-.\s]?\d{4}\b|(?:tel|fone|celular|whatsapp)\s*:?\s*[\d\s-]{8,15}\b/gi;
  result = result.replace(phoneRegex, "[TELEFONE OCULTO]");

  // 6. Credenciais / API Keys
  const secretsRegex = /\b(?:sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|sbp_[a-zA-Z0-9]{20,}|bearer\s+[a-zA-Z0-9._-]{20,})\b/gi;
  result = result.replace(secretsRegex, "[CREDENCIAIS OCULTAS]");

  return result;
}

/**
 * Sanitizes user prompt by removing PII data (CPF, CNPJ, Email, Phone, Credit Cards, Keys)
 * and neutralizing potential prompt injection triggers.
 */
export function sanitizeUserPrompt(rawPrompt: string): SanitizedPromptResult {
  if (!rawPrompt) {
    return { cleanPrompt: "", hasPiiDetected: false, detectedTypes: [] };
  }

  const maskedText = maskPiiInText(rawPrompt);
  const hasPii = maskedText !== rawPrompt;
  const detectedTypes: string[] = [];

  if (maskedText.includes("[CPF OCULTO]")) detectedTypes.push("CPF");
  if (maskedText.includes("[E-MAIL OCULTO]")) detectedTypes.push("Email");
  if (maskedText.includes("[DADOS DE PAGAMENTO OCULTOS]")) detectedTypes.push("Dados_Pagamento");
  if (maskedText.includes("[TELEFONE OCULTO]")) detectedTypes.push("Telefone");
  if (maskedText.includes("[CNPJ OCULTO]")) detectedTypes.push("CNPJ");

  // Strip potential Jailbreak / System Prompt Exfiltration attempts
  const injectionRegex = /(?:ignore\s+(?:previous|all|system)?\s*(?:instructions|rules|guidelines)|system\s+prompt|revelar\s+instruç[õo]es|exibir\s+chave|mostre\s+seu\s+prompt|ignore\s+todas\s+as\s+regras|modo\s+desenvolvedor|developer_mode|jailbreak|modo\s+dan|act\s+as|finja\s+ser|mude\s+sua\s+personalidade|esque[çc]a\s+as\s+regras|desative\s+(?:os\s+)?filtros|pretend\s+to\s+be|bypass\s+restrictions|habilidade\s+especial)/gi;
  let text = maskedText;
  if (injectionRegex.test(text)) {
    detectedTypes.push("Tentativa_Injecao");
    text = text.replace(injectionRegex, " ");
  }

  return {
    cleanPrompt: text.trim(),
    hasPiiDetected: hasPii,
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
