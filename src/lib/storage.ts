/**
 * Utilitário seguro para manipular o localStorage garantindo proteção contra
 * erros de QuotaExceededError (limite de armazenamento de 5MB atingido pelo navegador).
 */

function sanitizeConversations(conversations: any[]): any[] {
  if (!Array.isArray(conversations)) return conversations;

  return conversations.map((conv) => {
    if (!conv || !Array.isArray(conv.messages)) return conv;
    
    const sanitizedMessages = conv.messages.map((msg: any) => {
      if (!msg) return msg;
      const newMsg = { ...msg };

      // Limpa imagens em base64 com mais de 20KB para liberar espaço crítico
      if (typeof newMsg.imageUrl === "string" && newMsg.imageUrl.startsWith("data:image") && newMsg.imageUrl.length > 20000) {
        newMsg.imageUrl = "[Imagem omitida do armazenamento local para economizar espaço]";
      }

      if (typeof newMsg.content === "string" && newMsg.content.includes("data:image") && newMsg.content.length > 20000) {
        newMsg.content = newMsg.content.replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]{200,}/g, "[Imagem omitida do armazenamento local]");
      }

      if (Array.isArray(newMsg.attachments)) {
        newMsg.attachments = newMsg.attachments.map((att: any) => {
          if (att && typeof att.dataUrl === "string" && att.dataUrl.length > 20000) {
            return { ...att, dataUrl: "" };
          }
          return att;
        });
      }

      return newMsg;
    });

    return { ...conv, messages: sanitizedMessages };
  });
}

/**
 * Salva uma chave no localStorage de maneira resiliente.
 * Se o limite do navegador for excedido, remove imagens pesadas em base64 e dados antigos de forma automática.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[safeSetLocalStorage] Aviso: Espaço em localStorage esgotado para "${key}". Executando otimização automática...`);

    try {
      // 1. Se for uma lista de conversas de IA, reduz dados pesados de imagens em base64
      if (key.startsWith("ia-biblica-conversations")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const sanitized = sanitizeConversations(parsed);
            const sanitizedJson = JSON.stringify(sanitized);
            localStorage.setItem(key, sanitizedJson);
            console.log(`[safeSetLocalStorage] Sucesso ao salvar conversas otimizadas para "${key}".`);
            return true;
          }
        } catch (parseErr) {
          // ignora falha de parse
        }
      }

      // 2. Remove chaves temporárias ou não essenciais do localStorage para liberar espaço
      if (key !== "ia-biblica-conversations_guest") {
        localStorage.removeItem("ia-biblica-conversations_guest");
      }
      localStorage.removeItem("biblia_historico_buscas");

      // 3. Tenta salvar novamente
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        // 4. Se for conversas e ainda estiver estourado, limita às últimas 15 conversas mais recentes
        if (key.startsWith("ia-biblica-conversations")) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 10) {
              const trimmed = sanitizeConversations(parsed.slice(0, 15));
              const trimmedJson = JSON.stringify(trimmed);
              localStorage.setItem(key, trimmedJson);
              console.log(`[safeSetLocalStorage] Salvo com sucesso limitando às últimas 15 conversas.`);
              return true;
            }
          } catch (e) {
            // ignora
          }
        }
      }
    } catch (fallbackErr) {
      console.error(`[safeSetLocalStorage] Erro ao tentar recuperar espaço no localStorage:`, fallbackErr);
    }

    return false;
  }
}
