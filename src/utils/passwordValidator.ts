import zxcvbn from "zxcvbn";

const COMMON_GENERIC_PASSWORDS = new Set([
  // Senhas numéricas e sequenciais comuns
  "123456", "1234567", "12345678", "123456789", "1234567890", "000000", "111111", "123123", "654321", "987654321", "12341234",
  // Senhas em português comuns
  "senha", "senha123", "senha1234", "senhasegura", "minhasenha", "mudar123", "mudar1234", "123mudar", "brasil123",
  "biblia", "biblia123", "jesus", "jesus123", "deus", "deus123", "igreja", "igreja123", "amor123", "fe123456", "oracao123", "salvacao123",
  // Senhas em inglês e padrões globais
  "password", "password123", "pass1234", "admin", "admin123", "welcome", "welcome123", "qwerty", "qwertyuiop",
  "asdfghjkl", "zxcvbnm", "iloveyou", "abcdef", "1234abcd", "123456a", "letmein123"
]);

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  score?: number;
}

/**
  Valida se a senha atende aos requisitos de segurança:
  - Não ser vazia nem genérica/comum
  - Mínimo de 8 caracteres
  - Não conter sequências óbvias ou caracteres repetidos
  - Não conter partes do e-mail ou nome do usuário
  - Score mínimo no zxcvbn
 */
export const validatePasswordSecurity = (
  password: string, 
  userEmail?: string, 
  userName?: string
): PasswordValidationResult => {
  if (!password) {
    return { isValid: false, error: "A senha não pode estar vazia." };
  }

  // 1. Mínimo de 8 caracteres
  if (password.length < 8) {
    return { isValid: false, error: "A senha é muito curta. A senha deve ter no mínimo 8 caracteres." };
  }

  const cleanPass = password.toLowerCase().trim();

  // 2. Bloqueio de senhas genéricas da lista de conhecidas
  if (COMMON_GENERIC_PASSWORDS.has(cleanPass)) {
    return { 
      isValid: false, 
      error: "Esta senha é genérica e muito comum. Escolha uma senha mais segura e única." 
    };
  }

  // 3. Verificação de caracteres totalmente repetidos (ex: "aaaaaaaa", "11111111")
  if (/^(.)\1+$/.test(password)) {
    return { 
      isValid: false, 
      error: "A senha não pode ser composta apenas pela repetição do mesmo caractere." 
    };
  }

  // 4. Verificação de sequências muito simples no início (ex: "qwerty...", "12345...", "abcdef...")
  if (/^(12345|qwerty|asdfgh|zxcvbn|abcdef)/i.test(password)) {
    return { 
      isValid: false, 
      error: "A senha contém uma sequência genérica e previsível." 
    };
  }

  // 5. Impede conter o e-mail do usuário na senha (se fornecido)
  if (userEmail) {
    const emailPrefix = userEmail.split("@")[0]?.toLowerCase().trim();
    if (emailPrefix && emailPrefix.length >= 3 && cleanPass.includes(emailPrefix)) {
      return { 
        isValid: false, 
        error: "A senha não pode conter o seu nome de usuário ou partes do seu e-mail." 
      };
    }
  }

  // 6. Impede conter partes do nome do usuário na senha (se fornecido)
  if (userName) {
    const nameParts = userName.toLowerCase().trim().split(/\s+/).filter(part => part.length >= 3);
    for (const part of nameParts) {
      if (cleanPass.includes(part)) {
        return { 
          isValid: false, 
          error: "A senha não pode conter partes do seu nome." 
        };
      }
    }
  }

  // 7. Teste de Força com ZXCVBN
  const userInputs = [userEmail || "", userName || "", "biblia", "gospel", "igreja"];
  const zResult = zxcvbn(password, userInputs);

  // Score 0 ou 1 são muito fracos
  if (zResult.score < 2) {
    const suggestion = zResult.feedback.warning || "Senha fácil de adivinhar.";
    return { 
      isValid: false, 
      score: zResult.score,
      error: `Senha fraca (${suggestion}). Combine letras maiúsculas, minúsculas, números e símbolos.` 
    };
  }

  return { isValid: true, score: zResult.score };
};
