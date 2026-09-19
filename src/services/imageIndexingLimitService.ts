import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DAILY_ATTACHED_FILES_LIMIT = 2;
export const ATTACHMENT_QUOTA_WINDOW_MS = 12 * 60 * 60 * 1000; // Janela de 12 horas rolantes (igual às outras cotas de IA)

export interface DailyAttachedFilesUsage {
  count: number;
  max: number;
  remaining: number;
  isLimitReached: boolean;
  nextRechargeMs: number | null; // Milissegundos até a próxima liberação de cota
  nextRechargeText: string | null; // Texto amigável (ex: "em 3h 15min" ou "em até 12h")
  timestamps: number[];
}

const STORAGE_PREFIX = 'biblia_attached_files_v2';

export const getStorageKey = (userId?: string): string => {
  const cleanId = userId ? userId.trim().replace(/[^a-zA-Z0-9_-]/g, '') : 'global';
  return `${STORAGE_PREFIX}_${cleanId || 'global'}`;
};

export const formatRechargeTime = (ms: number | null): string => {
  if (!ms || ms <= 0) return 'em instantes';
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${Math.max(1, minutes)}min`;
  }
};

/**
 * Lê os timestamps válidos nas últimas 12 horas do LocalStorage
 */
export const getDailyAttachedFilesUsage = (userId?: string): DailyAttachedFilesUsage => {
  const key = getStorageKey(userId);
  const now = Date.now();
  const cutoff = now - ATTACHMENT_QUOTA_WINDOW_MS;

  let activeTimestamps: number[] = [];

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.timestamps)) {
        activeTimestamps = parsed.timestamps
          .filter((t: any) => typeof t === 'number' && t >= cutoff && t <= now + 1000)
          .sort((a: number, b: number) => a - b);
      }
    } else {
      // Migração de formato legado v1 caso exista
      const legacyKey = `biblia_daily_attached_files_${userId ? userId.trim().replace(/[^a-zA-Z0-9_-]/g, '') : 'global'}`;
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          if (legacyParsed?.count && typeof legacyParsed.count === 'number') {
            const count = Math.min(DAILY_ATTACHED_FILES_LIMIT, legacyParsed.count);
            for (let i = 0; i < count; i++) {
              activeTimestamps.push(now);
            }
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('[AttachmentLimit] Erro ao ler do localStorage:', err);
  }

  // Se o array de timestamps mudou devido à expiração de 12h, salva a versão limpa
  try {
    localStorage.setItem(key, JSON.stringify({ timestamps: activeTimestamps }));
  } catch (_) {}

  const count = Math.min(DAILY_ATTACHED_FILES_LIMIT, activeTimestamps.length);
  const remaining = Math.max(0, DAILY_ATTACHED_FILES_LIMIT - count);
  const isLimitReached = count >= DAILY_ATTACHED_FILES_LIMIT;

  let nextRechargeMs: number | null = null;
  let nextRechargeText: string | null = null;

  if (activeTimestamps.length > 0) {
    const oldestTimestamp = activeTimestamps[0];
    const rechargeAt = oldestTimestamp + ATTACHMENT_QUOTA_WINDOW_MS;
    nextRechargeMs = Math.max(0, rechargeAt - now);
    nextRechargeText = formatRechargeTime(nextRechargeMs);
  }

  return {
    count,
    max: DAILY_ATTACHED_FILES_LIMIT,
    remaining,
    isLimitReached,
    nextRechargeMs,
    nextRechargeText,
    timestamps: activeTimestamps,
  };
};

export const canAttachFiles = (
  countToAdd: number = 1,
  userId?: string
): {
  allowed: boolean;
  currentUsed: number;
  remaining: number;
  max: number;
  allowedCount: number;
  nextRechargeText: string | null;
} => {
  const usage = getDailyAttachedFilesUsage(userId);
  const allowedCount = Math.max(0, Math.min(countToAdd, usage.remaining));
  return {
    allowed: allowedCount > 0 && !usage.isLimitReached,
    currentUsed: usage.count,
    remaining: usage.remaining,
    max: DAILY_ATTACHED_FILES_LIMIT,
    allowedCount,
    nextRechargeText: usage.nextRechargeText,
  };
};

export const recordAttachedFiles = (
  count: number = 1,
  userId?: string
): DailyAttachedFilesUsage => {
  const key = getStorageKey(userId);
  const current = getDailyAttachedFilesUsage(userId);
  const now = Date.now();

  const newTimestamps = [...current.timestamps];
  for (let i = 0; i < count; i++) {
    if (newTimestamps.length < DAILY_ATTACHED_FILES_LIMIT) {
      newTimestamps.push(now);
    }
  }

  const newCount = Math.min(DAILY_ATTACHED_FILES_LIMIT, newTimestamps.length);
  const remaining = Math.max(0, DAILY_ATTACHED_FILES_LIMIT - newCount);
  const isLimitReached = newCount >= DAILY_ATTACHED_FILES_LIMIT;

  const oldestTimestamp = newTimestamps.length > 0 ? Math.min(...newTimestamps) : now;
  const nextRechargeMs = Math.max(0, (oldestTimestamp + ATTACHMENT_QUOTA_WINDOW_MS) - now);

  const newUsage: DailyAttachedFilesUsage = {
    count: newCount,
    max: DAILY_ATTACHED_FILES_LIMIT,
    remaining,
    isLimitReached,
    nextRechargeMs,
    nextRechargeText: formatRechargeTime(nextRechargeMs),
    timestamps: newTimestamps,
  };

  try {
    localStorage.setItem(key, JSON.stringify({ timestamps: newTimestamps }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('daily_file_attached_updated', { detail: newUsage })
      );
    }
  } catch (err) {
    console.error('[AttachmentLimit] Erro ao salvar cota no localStorage:', err);
  }

  // Sincroniza consumo de 12h com o Supabase
  try {
    if (navigator.onLine) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        const uid = user?.id || userId;
        if (uid) {
          for (let i = 0; i < count; i++) {
            supabase
              .from('user_ai_usage')
              .insert({
                user_id: uid,
                tipo_uso: 'attached_file',
                created_at: new Date().toISOString(),
              })
              .then(() => {})
              .catch(() => {});
          }
        }
      }).catch(() => {});
    }
  } catch (e) {
    // Fallback seguro offline
  }

  return newUsage;
};

export const decrementAttachedFiles = (
  count: number = 1,
  userId?: string
): DailyAttachedFilesUsage => {
  const key = getStorageKey(userId);
  const current = getDailyAttachedFilesUsage(userId);
  const newTimestamps = [...current.timestamps];

  for (let i = 0; i < count; i++) {
    if (newTimestamps.length > 0) {
      newTimestamps.pop();
    }
  }

  const newCount = Math.max(0, newTimestamps.length);
  const remaining = Math.max(0, DAILY_ATTACHED_FILES_LIMIT - newCount);
  const isLimitReached = newCount >= DAILY_ATTACHED_FILES_LIMIT;
  const nextRechargeMs = newTimestamps.length > 0
    ? Math.max(0, (Math.min(...newTimestamps) + ATTACHMENT_QUOTA_WINDOW_MS) - Date.now())
    : null;

  const newUsage: DailyAttachedFilesUsage = {
    count: newCount,
    max: DAILY_ATTACHED_FILES_LIMIT,
    remaining,
    isLimitReached,
    nextRechargeMs,
    nextRechargeText: nextRechargeMs ? formatRechargeTime(nextRechargeMs) : null,
    timestamps: newTimestamps,
  };

  try {
    localStorage.setItem(key, JSON.stringify({ timestamps: newTimestamps }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('daily_file_attached_updated', { detail: newUsage })
      );
    }
  } catch (err) {
    console.error('[AttachmentLimit] Erro ao decrementar no localStorage:', err);
  }

  return newUsage;
};

// Aliases para retrocompatibilidade
export const DAILY_INDEXED_IMAGES_LIMIT = DAILY_ATTACHED_FILES_LIMIT;
export const canIndexImages = canAttachFiles;
export const recordIndexedImages = recordAttachedFiles;
export const decrementIndexedImages = decrementAttachedFiles;
export const getDailyIndexedImagesUsage = getDailyAttachedFilesUsage;

export const useDailyAttachedFiles = (userId?: string) => {
  const [usage, setUsage] = useState<DailyAttachedFilesUsage>(() =>
    getDailyAttachedFilesUsage(userId)
  );

  const refresh = useCallback(async () => {
    const localUsage = getDailyAttachedFilesUsage(userId);
    setUsage(localUsage);

    // Sincroniza com a nuvem (Supabase) consultando as últimas 12 horas
    if (navigator.onLine) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || userId;
        if (uid) {
          const cutoffISO = new Date(Date.now() - ATTACHMENT_QUOTA_WINDOW_MS).toISOString();

          const { data: records, error } = await supabase
            .from('user_ai_usage')
            .select('created_at')
            .eq('user_id', uid)
            .in('tipo_uso', ['attached_file', 'indexed_image'])
            .gte('created_at', cutoffISO)
            .order('created_at', { ascending: true });

          if (!error && Array.isArray(records)) {
            const serverTimestamps = records
              .map(r => new Date(r.created_at).getTime())
              .filter(t => !isNaN(t) && t >= Date.now() - ATTACHMENT_QUOTA_WINDOW_MS);

            // Mescla timestamps locais e do servidor para garantir sincronismo
            const allUniqueTimestamps = Array.from(
              new Set([...localUsage.timestamps, ...serverTimestamps])
            )
              .filter(t => t >= Date.now() - ATTACHMENT_QUOTA_WINDOW_MS)
              .sort((a, b) => a - b)
              .slice(0, DAILY_ATTACHED_FILES_LIMIT);

            const key = getStorageKey(userId);
            localStorage.setItem(key, JSON.stringify({ timestamps: allUniqueTimestamps }));

            const syncedCount = Math.min(DAILY_ATTACHED_FILES_LIMIT, allUniqueTimestamps.length);
            const syncedRemaining = Math.max(0, DAILY_ATTACHED_FILES_LIMIT - syncedCount);
            const oldest = allUniqueTimestamps.length > 0 ? allUniqueTimestamps[0] : null;
            const nextRechargeMs = oldest ? Math.max(0, (oldest + ATTACHMENT_QUOTA_WINDOW_MS) - Date.now()) : null;

            setUsage({
              count: syncedCount,
              max: DAILY_ATTACHED_FILES_LIMIT,
              remaining: syncedRemaining,
              isLimitReached: syncedCount >= DAILY_ATTACHED_FILES_LIMIT,
              nextRechargeMs,
              nextRechargeText: nextRechargeMs ? formatRechargeTime(nextRechargeMs) : null,
              timestamps: allUniqueTimestamps,
            });
          }
        }
      } catch {
        // Fallback local
      }
    }
  }, [userId]);

  useEffect(() => {
    refresh();

    const handleCustomUpdate = () => {
      setUsage(getDailyAttachedFilesUsage(userId));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        setUsage(getDailyAttachedFilesUsage(userId));
      }
    };

    window.addEventListener('daily_file_attached_updated', handleCustomUpdate);
    window.addEventListener('daily_image_indexed_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Timer periódico a cada 30 segundos para recarregar automaticamente quando expirar as 12h
    const timer = setInterval(() => {
      setUsage(getDailyAttachedFilesUsage(userId));
    }, 30000);

    return () => {
      window.removeEventListener('daily_file_attached_updated', handleCustomUpdate);
      window.removeEventListener('daily_image_indexed_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(timer);
    };
  }, [userId, refresh]);

  return {
    usage,
    usedCount: usage.count,
    maxLimit: DAILY_ATTACHED_FILES_LIMIT,
    remainingCount: usage.remaining,
    isLimitReached: usage.isLimitReached,
    nextRechargeText: usage.nextRechargeText,
    canAddFiles: (count: number = 1) => canAttachFiles(count, userId),
    recordUsage: (count: number = 1) => recordAttachedFiles(count, userId),
    decrementUsage: (count: number = 1) => decrementAttachedFiles(count, userId),
    refreshUsage: refresh,
  };
};

export const useDailyIndexedImages = useDailyAttachedFiles;
