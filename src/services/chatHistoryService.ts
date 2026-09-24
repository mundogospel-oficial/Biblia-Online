import { syncKeyToSupabase } from './userSyncService';
import { supabase } from '@/integrations/supabase/client';

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  image?: string;
  feedback?: "like" | "dislike";
  timestamp?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  timestamp: number;
  engine?: "simples" | "complexo";
}

const GUEST_KEY = "ia-biblica-conversations_guest";

export const getConversationStorageKey = (userSub?: string | null): string => {
  return userSub ? `ia-biblica-conversations_${userSub}` : GUEST_KEY;
};

/**
 * Cria uma cópia otimizada para o LocalStorage sem exceder os 5MB do navegador.
 * Mantém os dados completos nos chats mais recentes e compacta imagens base64 muito antigas.
 */
function createStorageFriendlyConversations(convs: ChatConversation[]): ChatConversation[] {
  return convs.map((conv, convIdx) => {
    // Para as 2 conversas mais recentes, mantém tudo intacto
    if (convIdx < 2) {
      return conv;
    }

    // Para conversas mais antigas, se houver imagem em base64 gigantesca, guarda uma referência limpa
    const sanitizedMessages = conv.messages.map(m => {
      if (m.image && m.image.startsWith("data:image") && m.image.length > 50000) {
        // Reduz mantendo que havia uma imagem para não quebrar a UI
        return {
          ...m,
          image: m.image.slice(0, 100) + "...[imagem-salva-no-servidor]"
        };
      }
      return m;
    });

    return {
      ...conv,
      messages: sanitizedMessages
    };
  });
}

/**
 * Salva com tolerância total a falhas de cota no localStorage
 */
export function safeSaveToLocalStorage(key: string, convs: ChatConversation[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(convs));
  } catch (err) {
    console.warn("[ChatHistory] Cota do localStorage excedida. Aplicando sanitização de imagens antigas...", err);
    try {
      const optimized = createStorageFriendlyConversations(convs);
      localStorage.setItem(key, JSON.stringify(optimized));
    } catch (err2) {
      console.warn("[ChatHistory] Cota ainda alta. Podando conversas mais antigas no armazenamento local...", err2);
      try {
        // Mantém as 10 conversas mais recentes
        const pruned = convs.slice(0, 10).map(c => ({
          ...c,
          messages: c.messages.map(m => {
            if (m.image && m.image.startsWith("data:image")) {
              return { ...m, image: undefined, content: m.content || "[Arte Bíblica Sagrada]" };
            }
            return m;
          })
        }));
        localStorage.setItem(key, JSON.stringify(pruned));
      } catch (err3) {
        console.error("[ChatHistory] Não foi possível gravar no localStorage:", err3);
      }
    }
  }
}

/**
 * Lê do LocalStorage com fallback seguro
 */
export function loadFromLocalStorage(key: string): ChatConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[ChatHistory] Erro ao ler do localStorage:", err);
  }
  return [];
}

/**
 * Salva o histórico completo no servidor (e sincroniza com Supabase se disponível)
 */
export async function saveHistoryToServer(
  userId: string | undefined | null,
  conversations: ChatConversation[]
): Promise<boolean> {
  const safeId = userId || "guest";

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch("/api/chat/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": safeId,
        ...authHeaders,
      },
      body: JSON.stringify({
        userId: safeId,
        conversations,
      }),
    });

    if (!response.ok) {
      console.warn("[ChatHistory] Servidor retornou erro ao salvar histórico:", response.status);
      return false;
    }

    return true;
  } catch (netErr) {
    console.warn("[ChatHistory] Falha de conexão ao salvar histórico no servidor (mantido local):", netErr);
    return false;
  }
}

/**
 * Busca histórico do servidor
 */
export async function fetchHistoryFromServer(
  userId: string | undefined | null
): Promise<ChatConversation[]> {
  const safeId = userId || "guest";

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`/api/chat/history?userId=${encodeURIComponent(safeId)}`, {
      method: "GET",
      headers: {
        "x-user-id": safeId,
        ...authHeaders,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.conversations)) {
        return data.conversations;
      }
    }
  } catch (err) {
    console.warn("[ChatHistory] Não foi possível carregar do servidor:", err);
  }
  return [];
}

/**
 * Deleta conversa no servidor
 */
export async function deleteConversationOnServer(
  userId: string | undefined | null,
  conversationId: string
): Promise<void> {
  const safeId = userId || "guest";
  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/chat/history?userId=${encodeURIComponent(safeId)}&conversationId=${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
      headers: {
        ...authHeaders,
      },
    });
  } catch (err) {
    console.warn("[ChatHistory] Erro ao deletar no servidor:", err);
  }
}

/**
 * Limpa todo o histórico no servidor
 */
export async function clearAllHistoryOnServer(
  userId: string | undefined | null
): Promise<void> {
  const safeId = userId || "guest";
  try {
    const authHeaders = await getAuthHeader();
    await fetch(`/api/chat/history?userId=${encodeURIComponent(safeId)}`, {
      method: "DELETE",
      headers: {
        ...authHeaders,
      },
    });
  } catch (err) {
    console.warn("[ChatHistory] Erro ao limpar histórico no servidor:", err);
  }
}

/**
 * Mescla conversas locais com as do servidor de forma inteligente
 */
export function mergeChatConversations(
  localList: ChatConversation[],
  serverList: ChatConversation[]
): ChatConversation[] {
  const map = new Map<string, ChatConversation>();

  // 1. Carrega as do servidor
  serverList.forEach((c) => {
    if (c && c.id) {
      map.set(c.id, c);
    }
  });

  // 2. Mescla as locais: se a local tiver mais mensagens ou for mais recente, dá preferência
  localList.forEach((c) => {
    if (!c || !c.id) return;
    const existing = map.get(c.id);
    if (!existing) {
      map.set(c.id, c);
    } else {
      // Se local tem mensagens mais recentes ou iguais
      if ((c.messages?.length || 0) >= (existing.messages?.length || 0)) {
        map.set(c.id, {
          ...existing,
          ...c,
          timestamp: Math.max(c.timestamp || 0, existing.timestamp || 0),
        });
      }
    }
  });

  // Ordena pelas mais recentes no topo
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
