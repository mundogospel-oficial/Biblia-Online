/**
 * Utilitário centralizado para higienizar e simplificar mensagens de erro.
 * Remove termos técnicos (HTTP, códigos de status, nomes de APIs internas, stacktraces)
 * e exibe apenas avisos claros, elegantes e compreensíveis para o usuário final.
 */

export function formatFriendlyErrorMessage(
  error: unknown,
  fallbackMessage: string = "Não foi possível concluir a solicitação. Tente novamente em instantes."
): string {
  if (!error) return fallbackMessage;

  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message || "";
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, any>;
    rawMessage = obj.error || obj.message || obj.details || obj.hint || "";
  }

  const lowered = rawMessage.toLowerCase();

  // 1. Abort / Cancelamento intencional do usuário
  if (lowered.includes("abort") || lowered.includes("cancelado") || lowered.includes("interrompid")) {
    return "Operação interrompida.";
  }

  // 2. Moderação de Conteúdo e Diretrizes
  if (
    lowered.includes("improprio") ||
    lowered.includes("impróprio") ||
    lowered.includes("bloqueado") ||
    lowered.includes("inapropriad") ||
    lowered.includes("diretrizes") ||
    lowered.includes("termos") ||
    lowered.includes("conteúdo visual") ||
    lowered.includes("safety")
  ) {
    return "A descrição fornecida contém termos que não atendem às diretrizes de conteúdo visual.";
  }

  // 3. Limites de Cota diária
  if (
    lowered.includes("limite") ||
    lowered.includes("cota") ||
    lowered.includes("quota") ||
    lowered.includes("recarrega em") ||
    lowered.includes("atingiu o seu limite")
  ) {
    return "Você atingiu o limite de uso diário. Sua cota será renovada em breve.";
  }

  // 4. Conexão de Rede e Offline
  if (
    lowered.includes("failed to fetch") ||
    lowered.includes("fetch failed") ||
    lowered.includes("networkerror") ||
    lowered.includes("sem conexão") ||
    lowered.includes("offline") ||
    lowered.includes("net::err") ||
    lowered.includes("econnrefused") ||
    lowered.includes("timed out") ||
    lowered.includes("timeout")
  ) {
    return "Erro de conexão com o servidor. Verifique sua internet e tente novamente.";
  }

  // 5. Sessão e Autenticação
  if (
    lowered.includes("sessão expirada") ||
    lowered.includes("unauthorized") ||
    lowered.includes("jwt") ||
    lowered.includes("refresh_token") ||
    lowered.includes("not authenticated") ||
    lowered.includes("não autenticado")
  ) {
    return "Sua sessão expirou. Por favor, faça login novamente.";
  }

  // 6. Se a mensagem contiver dados técnicos brutos (HTTP, status codes, JSON, nomes de servidores), limpa e simplifica
  const containsTechnicalJargon =
    /http\s*[0-9]{3}/i.test(rawMessage) ||
    /status\s*[0-9]{3}/i.test(rawMessage) ||
    lowered.includes("cloudflare") ||
    lowered.includes("openrouter") ||
    lowered.includes("workers ai") ||
    lowered.includes("gemini api") ||
    lowered.includes("bolls.life") ||
    lowered.includes("pgrst") ||
    lowered.includes("postgrest") ||
    lowered.includes("typeerror") ||
    lowered.includes("syntaxerror") ||
    lowered.includes("json.parse") ||
    rawMessage.includes("{") ||
    rawMessage.includes("}") ||
    rawMessage.length > 200;

  if (containsTechnicalJargon) {
    return fallbackMessage;
  }

  // Se for uma mensagem curta e clara já em português, pode ser exibida
  if (rawMessage.trim().length > 0) {
    return rawMessage.trim();
  }

  return fallbackMessage;
}
