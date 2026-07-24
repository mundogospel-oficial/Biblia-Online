import { supabase } from "@/integrations/supabase/client";

export interface UserPlanProgress {
  activePlanId: string | null;
  activePlanStartDate: string | null;
  completedDaysByPlan: Record<string, number[]>; // planId -> array of completed day numbers
  streakDays: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export interface PlanReflection {
  planId: string;
  dayNumber: number;
  planTitle: string;
  dayTitle: string;
  devotionText?: string;
  readingsSummary?: string;
  reflectionText: string;
  savedAt: string;
}

const LOCAL_STORAGE_KEY = "biblia_planos_leitura_progresso_v1";
const PLAN_FAVORITES_KEY = "biblia-planos-favoritos";
const PLAN_REFLECTIONS_KEY = "biblia_planos_reflexoes_v1";

// Plan Favorites Helpers
export const getFavoritePlanIds = (): string[] => {
  try {
    const raw = localStorage.getItem(PLAN_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isPlanFavorited = (planId: string): boolean => {
  return getFavoritePlanIds().includes(planId);
};

export const toggleFavoritePlan = (planId: string): boolean => {
  const current = getFavoritePlanIds();
  let updated: string[];
  const isFav = current.includes(planId);
  if (isFav) {
    updated = current.filter((id) => id !== planId);
  } else {
    updated = [...current, planId];
  }
  localStorage.setItem(PLAN_FAVORITES_KEY, JSON.stringify(updated));
  return !isFav;
};

// Plan Reflection Helpers
export const getPlanReflections = (): Record<string, PlanReflection> => {
  try {
    const raw = localStorage.getItem(PLAN_REFLECTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getPlanReflection = (planId: string, dayNumber: number): PlanReflection | null => {
  const reflections = getPlanReflections();
  return reflections[`${planId}_${dayNumber}`] || null;
};

export const savePlanReflection = (reflection: PlanReflection): Record<string, PlanReflection> => {
  const current = getPlanReflections();
  const key = `${reflection.planId}_${reflection.dayNumber}`;
  const updated = {
    ...current,
    [key]: reflection
  };
  localStorage.setItem(PLAN_REFLECTIONS_KEY, JSON.stringify(updated));
  return updated;
};

export const deletePlanReflection = (planId: string, dayNumber: number): Record<string, PlanReflection> => {
  const current = getPlanReflections();
  const key = `${planId}_${dayNumber}`;
  delete current[key];
  localStorage.setItem(PLAN_REFLECTIONS_KEY, JSON.stringify(current));
  return current;
};

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Helper to check if two YYYY-MM-DD dates are consecutive days
export const isYesterday = (lastDateStr: string): boolean => {
  if (!lastDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = lastDateStr.split("-").map(Number);
  if (parts.length !== 3) return false;
  const last = new Date(parts[0], parts[1] - 1, parts[2]);
  last.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  return diffDays === 1;
};

// Default empty state
const getDefaultProgress = (): UserPlanProgress => ({
  activePlanId: null,
  activePlanStartDate: null,
  completedDaysByPlan: {},
  streakDays: 0,
  lastCompletedDate: null
});

// Load progress from LocalStorage
export const getLocalPlanProgress = (): UserPlanProgress => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw);
    return {
      activePlanId: parsed.activePlanId ?? null,
      activePlanStartDate: parsed.activePlanStartDate ?? null,
      completedDaysByPlan: parsed.completedDaysByPlan ?? {},
      streakDays: typeof parsed.streakDays === "number" ? parsed.streakDays : 0,
      lastCompletedDate: parsed.lastCompletedDate ?? null
    };
  } catch (err) {
    console.error("Error reading reading plan progress", err);
    return getDefaultProgress();
  }
};

// Save progress to LocalStorage & Supabase
export const savePlanProgress = async (progress: UserPlanProgress): Promise<void> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));

    // Supabase Sync if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Sincroniza o progresso na conta do Supabase
      const jsonStr = JSON.stringify(progress);
      
      // Salva nas notas/perfil de forma resiliente
      const { data: existingNote } = await supabase
        .from("user_notes")
        .select("id")
        .eq("user_id", user.id)
        .eq("verse_reference", "READING_PLAN_PROGRESS")
        .maybeSingle();

      if (existingNote) {
        await supabase
          .from("user_notes")
          .update({ note_text: jsonStr })
          .eq("id", existingNote.id);
      } else {
        await supabase
          .from("user_notes")
          .insert({
            user_id: user.id,
            verse_reference: "READING_PLAN_PROGRESS",
            note_text: jsonStr
          });
      }
    }
  } catch (err) {
    console.warn("Could not save reading plan progress to Supabase", err);
  }
};

// Load progress with Supabase Sync on login
export const loadPlanProgressWithSync = async (): Promise<UserPlanProgress> => {
  const local = getLocalPlanProgress();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingNote } = await supabase
        .from("user_notes")
        .select("note_text")
        .eq("user_id", user.id)
        .eq("verse_reference", "READING_PLAN_PROGRESS")
        .maybeSingle();

      if (existingNote?.note_text) {
        try {
          const remote: UserPlanProgress = JSON.parse(existingNote.note_text);
          // Merge: use remote if it exists or has more completed days
          const localCount = Object.values(local.completedDaysByPlan).flat().length;
          const remoteCount = Object.values(remote.completedDaysByPlan || {}).flat().length;
          
          if (remoteCount >= localCount) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remote));
            return remote;
          } else {
            // Push local to remote
            savePlanProgress(local);
          }
        } catch (e) {
          console.error("Error parsing remote plan progress", e);
        }
      }
    }
  } catch (err) {
    console.warn("Could not load reading plan progress from Supabase", err);
  }
  return local;
};

// Toggle a day completion
export const toggleDayCompletion = async (
  planId: string,
  dayNumber: number
): Promise<UserPlanProgress> => {
  const current = getLocalPlanProgress();
  const currentCompleted = current.completedDaysByPlan[planId] || [];
  const isCompleted = currentCompleted.includes(dayNumber);

  let updatedCompleted: number[];
  if (isCompleted) {
    updatedCompleted = currentCompleted.filter((d) => d !== dayNumber);
  } else {
    updatedCompleted = [...currentCompleted, dayNumber].sort((a, b) => a - b);
  }

  const todayStr = getTodayDateString();
  let newStreak = current.streakDays;
  let newLastCompletedDate = current.lastCompletedDate;

  if (!isCompleted) {
    // We marked a day as completed
    if (current.lastCompletedDate === todayStr) {
      // Already completed a day today, keep streak
    } else if (isYesterday(current.lastCompletedDate || "")) {
      newStreak += 1;
      newLastCompletedDate = todayStr;
    } else {
      newStreak = 1;
      newLastCompletedDate = todayStr;
    }
  }

  const updatedProgress: UserPlanProgress = {
    ...current,
    activePlanId: current.activePlanId || planId,
    completedDaysByPlan: {
      ...current.completedDaysByPlan,
      [planId]: updatedCompleted
    },
    streakDays: newStreak,
    lastCompletedDate: newLastCompletedDate
  };

  await savePlanProgress(updatedProgress);
  return updatedProgress;
};

// Set active plan (or pass null to deactivate)
export const setActivePlan = async (planId: string | null): Promise<UserPlanProgress> => {
  const current = getLocalPlanProgress();
  const updated: UserPlanProgress = {
    ...current,
    activePlanId: planId,
    activePlanStartDate: planId ? (current.activePlanId === planId ? current.activePlanStartDate : getTodayDateString()) : null
  };
  await savePlanProgress(updated);
  return updated;
};
