import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncKeyToSupabase } from "./userSyncService";

export const FOCUS_MODE_KEY = "bible_focus_mode";
export const FOCUS_DURATION_MS = 60 * 60 * 1000; // 1 hora em milissegundos (3600 segundos)

export interface FocusModeData {
  active: boolean;
  expiresAt: number;
  startedAt: number;
  durationSeconds: number;
}

export interface FocusModeState extends FocusModeData {
  remainingSeconds: number;
}

/**
 * Obtém o estado atual do Modo Foco a partir do localStorage
 */
export const getLocalFocusModeState = (): FocusModeState => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {
      active: false,
      expiresAt: 0,
      startedAt: 0,
      durationSeconds: 3600,
      remainingSeconds: 0,
    };
  }

  try {
    const raw = localStorage.getItem(FOCUS_MODE_KEY);
    if (!raw) {
      return {
        active: false,
        expiresAt: 0,
        startedAt: 0,
        durationSeconds: 3600,
        remainingSeconds: 0,
      };
    }

    const data: Partial<FocusModeData> = JSON.parse(raw);
    const now = Date.now();

    if (data.active && data.expiresAt && data.expiresAt > now) {
      const remainingSeconds = Math.max(0, Math.ceil((data.expiresAt - now) / 1000));
      return {
        active: true,
        expiresAt: data.expiresAt,
        startedAt: data.startedAt || (data.expiresAt - (data.durationSeconds || 3600) * 1000),
        durationSeconds: data.durationSeconds || 3600,
        remainingSeconds,
      };
    }

    // Se já passou do tempo de expiração mas ainda constava como ativo, encerra
    if (data.active && data.expiresAt && data.expiresAt <= now) {
      const expiredData: FocusModeData = {
        active: false,
        expiresAt: 0,
        startedAt: 0,
        durationSeconds: 3600,
      };
      localStorage.setItem(FOCUS_MODE_KEY, JSON.stringify(expiredData));
      window.dispatchEvent(new CustomEvent("bible-focus-mode-change", { detail: { ...expiredData, manual: false } }));
      saveFocusModeToServer(expiredData);
    }

    return {
      active: false,
      expiresAt: 0,
      startedAt: 0,
      durationSeconds: 3600,
      remainingSeconds: 0,
    };
  } catch (e) {
    console.warn("Erro ao ler estado do Modo Foco do localStorage:", e);
    return {
      active: false,
      expiresAt: 0,
      startedAt: 0,
      durationSeconds: 3600,
      remainingSeconds: 0,
    };
  }
};

/**
 * Retorna se o Modo Foco está ativo no momento (usado pelo sistema de toasts)
 */
export const isFocusModeActive = (): boolean => {
  return getLocalFocusModeState().active;
};

/**
 * Salva o estado do Modo Foco no servidor (Supabase Auth Metadata e tabela de notas de sincronização)
 */
export const saveFocusModeToServer = async (data: FocusModeData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Salva nos metadados do usuário no Supabase Auth para rápida recuperação de sessão
    await supabase.auth.updateUser({
      data: {
        focus_mode: data,
      },
    }).catch(err => console.warn("Aviso ao salvar focus_mode em user_metadata:", err));

    // 2. Salva também através do syncKeyToSupabase para persistência relacional unificada
    await syncKeyToSupabase(FOCUS_MODE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Falha ao sincronizar Modo Foco com o servidor:", err);
  }
};

/**
 * Ativa o Modo Foco por 1 hora (ou duração customizada) e salva no localStorage e servidor
 */
export const enableFocusMode = async (durationMs: number = FOCUS_DURATION_MS): Promise<FocusModeState> => {
  const now = Date.now();
  const expiresAt = now + durationMs;
  const durationSeconds = Math.floor(durationMs / 1000);

  const data: FocusModeData = {
    active: true,
    expiresAt,
    startedAt: now,
    durationSeconds,
  };

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(FOCUS_MODE_KEY, JSON.stringify(data));
  }

  const state: FocusModeState = {
    ...data,
    remainingSeconds: durationSeconds,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bible-focus-mode-change", { detail: state }));
  }

  // Sincroniza em segundo plano com o servidor
  saveFocusModeToServer(data);

  return state;
};

/**
 * Desativa o Modo Foco e atualiza o localStorage e o servidor
 */
export const disableFocusMode = async (manual: boolean = true): Promise<FocusModeState> => {
  const data: FocusModeData = {
    active: false,
    expiresAt: 0,
    startedAt: 0,
    durationSeconds: 3600,
  };

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(FOCUS_MODE_KEY, JSON.stringify(data));
  }

  const state: FocusModeState = {
    ...data,
    remainingSeconds: 0,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bible-focus-mode-change", { detail: { ...state, manual } }));
  }

  // Sincroniza encerramento com o servidor
  saveFocusModeToServer(data);

  return state;
};

/**
 * Sincroniza o Modo Foco com o servidor (chamado ao carregar perfil ou página de conta)
 */
export const syncFocusModeWithServer = async (): Promise<FocusModeState> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getLocalFocusModeState();

    let serverData: Partial<FocusModeData> | null = null;

    // Tenta primeiro do user_metadata do Supabase
    if (user.user_metadata && user.user_metadata.focus_mode) {
      serverData = user.user_metadata.focus_mode;
    }

    // Se não encontrou, tenta buscar da tabela user_notes
    if (!serverData) {
      const { data: noteRow } = await supabase
        .from("user_notes")
        .select("note_text")
        .eq("user_id", user.id)
        .eq("verse_reference", FOCUS_MODE_KEY)
        .maybeSingle();

      if (noteRow?.note_text) {
        try {
          serverData = JSON.parse(noteRow.note_text);
        } catch {
          // ignora
        }
      }
    }

    const localState = getLocalFocusModeState();
    const now = Date.now();

    if (serverData && serverData.active && serverData.expiresAt && serverData.expiresAt > now) {
      // Servidor tem um timer ativo válido
      // Se local estiver inativo ou com expiração anterior, assume o do servidor
      if (!localState.active || localState.expiresAt < serverData.expiresAt) {
        const activeData: FocusModeData = {
          active: true,
          expiresAt: serverData.expiresAt,
          startedAt: serverData.startedAt || (serverData.expiresAt - 3600 * 1000),
          durationSeconds: serverData.durationSeconds || 3600,
        };
        localStorage.setItem(FOCUS_MODE_KEY, JSON.stringify(activeData));
        window.dispatchEvent(new CustomEvent("bible-focus-mode-change", { detail: activeData }));
        return {
          ...activeData,
          remainingSeconds: Math.max(0, Math.ceil((activeData.expiresAt - now) / 1000)),
        };
      }
    } else if (localState.active && localState.expiresAt > now) {
      // Local tem timer ativo, salva no servidor para sincronizar
      saveFocusModeToServer({
        active: true,
        expiresAt: localState.expiresAt,
        startedAt: localState.startedAt,
        durationSeconds: localState.durationSeconds,
      });
    }

    return getLocalFocusModeState();
  } catch (err) {
    console.warn("Erro ao sincronizar foco com servidor:", err);
    return getLocalFocusModeState();
  }
};

/**
 * Hook React para usar e observar o Modo Foco com contagem regressiva em tempo real
 */
export const useFocusMode = () => {
  const [state, setState] = useState<FocusModeState>(() => getLocalFocusModeState());

  useEffect(() => {
    // Sincroniza com servidor ao montar
    syncFocusModeWithServer().then((synced) => {
      setState(synced);
    });

    const handleFocusChange = () => {
      setState(getLocalFocusModeState());
    };

    window.addEventListener("bible-focus-mode-change", handleFocusChange);
    window.addEventListener("storage", handleFocusChange);

    return () => {
      window.removeEventListener("bible-focus-mode-change", handleFocusChange);
      window.removeEventListener("storage", handleFocusChange);
    };
  }, []);

  // Intervalo de contagem regressiva de 1 segundo quando o modo está ativo
  useEffect(() => {
    if (!state.active) return;

    const interval = setInterval(() => {
      const current = getLocalFocusModeState();
      if (!current.active) {
        setState(current);
        clearInterval(interval);
      } else {
        setState(current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.active, state.expiresAt]);

  const toggleFocus = async () => {
    if (state.active) {
      return await disableFocusMode(true);
    } else {
      return await enableFocusMode(FOCUS_DURATION_MS);
    }
  };

  const renewFocus = async () => {
    return await enableFocusMode(FOCUS_DURATION_MS);
  };

  return {
    ...state,
    toggleFocus,
    renewFocus,
    disable: disableFocusMode,
    enable: enableFocusMode,
  };
};

/**
 * Formata segundos restantes em string legível (ex: 59:45 ou 1h 00m 00s)
 */
export const formatRemainingTime = (seconds: number): string => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${pad(remM)}m ${pad(s)}s`;
  }
  return `${pad(m)}:${pad(s)}`;
};

