import { supabase } from "@/integrations/supabase/client";
import { savePlanProgress, getLocalPlanProgress, UserPlanProgress } from "./readingPlanService";

const PLAN_FAVORITES_KEY = "biblia-planos-favoritos";
const PLAN_REFLECTIONS_KEY = "biblia_planos_reflexoes_v1";
const HIGHLIGHTS_KEY = "bible-highlights";
const NOTES_KEY = "bible-notes";
const FAVORITES_KEY = "bible-favorites";
const SEARCH_HISTORY_KEY = "biblia_historico_buscas";
const AI_CONVERSATIONS_KEY = "ia-biblica-conversations";

export const USER_DATA_KEYS = [
  "biblia_planos_leitura_progresso_v1",
  PLAN_FAVORITES_KEY,
  PLAN_REFLECTIONS_KEY,
  HIGHLIGHTS_KEY,
  NOTES_KEY,
  FAVORITES_KEY,
  "bible-markings",
  SEARCH_HISTORY_KEY,
  AI_CONVERSATIONS_KEY,
  "biblia-devocionais-favoritos",
  "bible-google-user",
  "bible_focus_mode",
];

/**
 * Limpa completamente todos os dados de usuário do localStorage
 */
export const clearAllLocalUserData = () => {
  USER_DATA_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Remove também chaves dinâmicas como user_username_* e user_profile_*
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('user_username_') || key.startsWith('user_profile_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
};

/**
 * Salva uma chave de dados no Supabase (tabela user_notes)
 */
export const syncKeyToSupabase = async (referenceKey: string, localValueStr: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("user_notes")
      .select("id")
      .eq("user_id", user.id)
      .eq("verse_reference", referenceKey)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_notes")
        .update({ note_text: localValueStr })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("user_notes")
        .insert({
          user_id: user.id,
          verse_reference: referenceKey,
          note_text: localValueStr,
        });
    }
  } catch (err) {
    console.warn(`Erro ao sincronizar ${referenceKey} com Supabase:`, err);
  }
};

/**
 * Carrega dados do Supabase e salva no localStorage de forma segura
 */
export const loadKeyFromSupabase = async (referenceKey: string, localStorageKey: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing, error } = await supabase
      .from("user_notes")
      .select("note_text")
      .eq("user_id", user.id)
      .eq("verse_reference", referenceKey)
      .maybeSingle();

    if (!error && existing?.note_text) {
      localStorage.setItem(localStorageKey, existing.note_text);
    } else {
      // Se a conta no banco ainda não possui dados gravados, mas temos dados no localStorage do usuário,
      // sincroniza do local para o Supabase para nunca perder o histórico
      const localVal = localStorage.getItem(localStorageKey);
      if (localVal && localVal.trim() !== "" && localVal !== "[]") {
        await syncKeyToSupabase(referenceKey, localVal);
      }
    }
  } catch (err) {
    console.warn(`Erro ao carregar ${referenceKey} do Supabase:`, err);
  }
};

/**
 * Sincroniza TODO o histórico, planos, atividades, reflexões e preferências para o Supabase
 */
export const syncAllUserDataToSupabase = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const aiKey = `ia-biblica-conversations_${user.id}`;
    const keysToSync = [
      { ref: "READING_PLAN_PROGRESS", key: "biblia_planos_leitura_progresso_v1" },
      { ref: "READING_PLAN_FAVORITES", key: PLAN_FAVORITES_KEY },
      { ref: "READING_PLAN_REFLECTIONS", key: PLAN_REFLECTIONS_KEY },
      { ref: "BIBLE_HIGHLIGHTS", key: HIGHLIGHTS_KEY },
      { ref: "BIBLE_NOTES", key: NOTES_KEY },
      { ref: "BIBLE_FAVORITES", key: FAVORITES_KEY },
      { ref: "BIBLE_SEARCH_HISTORY", key: SEARCH_HISTORY_KEY },
      { ref: "AI_CONVERSATIONS", key: aiKey },
    ];

    for (const item of keysToSync) {
      const val = localStorage.getItem(item.key);
      if (val !== null) {
        await syncKeyToSupabase(item.ref, val);
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar todos os dados do usuário:", err);
  }
};

/**
 * Restaura todo o histórico da conta do usuário vindo do Supabase
 */
export const syncAllUserDataFromSupabaseOnLogin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Remove chaves de convidados apenas
    localStorage.removeItem("ia-biblica-conversations_guest");

    const aiKey = `ia-biblica-conversations_${user.id}`;
    const keysToLoad = [
      { ref: "READING_PLAN_PROGRESS", key: "biblia_planos_leitura_progresso_v1" },
      { ref: "READING_PLAN_FAVORITES", key: PLAN_FAVORITES_KEY },
      { ref: "READING_PLAN_REFLECTIONS", key: PLAN_REFLECTIONS_KEY },
      { ref: "BIBLE_HIGHLIGHTS", key: HIGHLIGHTS_KEY },
      { ref: "BIBLE_NOTES", key: NOTES_KEY },
      { ref: "BIBLE_FAVORITES", key: FAVORITES_KEY },
      { ref: "BIBLE_SEARCH_HISTORY", key: SEARCH_HISTORY_KEY },
      { ref: "AI_CONVERSATIONS", key: aiKey },
    ];

    for (const item of keysToLoad) {
      await loadKeyFromSupabase(item.ref, item.key);
    }
  } catch (err) {
    console.error("Erro ao carregar dados da conta do Supabase:", err);
  }
};

/**
 * Executa procedimentos de logout:
 * Salva e sincroniza todo histórico e dados no banco de dados Supabase da conta
 */
export const deactivatePlansAndSyncOnLogout = async () => {
  try {
    // Sincroniza todo o histórico, progresso de planos, reflexões e marcadores na conta antes de sair
    await syncAllUserDataToSupabase().catch(() => {});
  } catch (err) {
    console.error("Erro na sincronização de logout:", err);
  } finally {
    // OBRIGATORIAMENTE limpa os dados do localStorage mesmo se a sincronização falhar
    clearAllLocalUserData();
  }
};
