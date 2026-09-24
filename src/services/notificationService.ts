
import { toast } from "@/hooks/use-toast";
import { dailyVerses } from "./dailyVerses";

export const NOTIFICATION_SETTINGS_KEY = "biblia_online_notification_settings";
export const LAST_VISIT_KEY = "biblia_online_last_visit";

interface NotificationSettings {
  enabled: boolean;
  morningVerse: boolean;
  eveningVerse: boolean;
  inactivityAlert: boolean;
}

export const defaultSettings: NotificationSettings = {
  enabled: false,
  morningVerse: true,
  eveningVerse: true,
  inactivityAlert: true,
};

export const getNotificationSettings = (): NotificationSettings => {
  const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return saved ? JSON.parse(saved) : defaultSettings;
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * Retorna a data local formatada (YYYY-MM-DD) de acordo com o fuso horário do dispositivo do usuário.
 * Evita bugs de UTC onde a data virava às 21h em fusos como o do Brasil (UTC-3).
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const requestNotificationPermission = async () => {
  const lang = typeof window !== "undefined" ? localStorage.getItem("app-language") || "pt" : "pt";
  if (!("Notification" in window)) {
    toast({
      title: lang === "en" ? "Not supported" : "Não suportado",
      description: lang === "en" ? "This browser does not support desktop notifications." : "Este navegador não suporta notificações desktop.",
      variant: "destructive",
    });
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const updateLastVisit = () => {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
};

export const checkInactivity = () => {
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  if (!lastVisit) return;

  const now = new Date();
  const todayStr = getLocalDateString(now);
  const lastInactivity = localStorage.getItem("biblia_online_last_inactivity_notification");
  
  // Garante que o alerta de inatividade nunca dispare mais de 1 vez por dia
  if (lastInactivity === todayStr) {
    return;
  }

  const lastVisitDate = new Date(lastVisit);
  const diffInDays = (now.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24);

  if (diffInDays >= 1) {
    const settings = getNotificationSettings();
    if (settings.enabled && settings.inactivityAlert) {
      // Bloqueia imediatamente para evitar disparos duplicados por múltiplas abas ou re-renders
      localStorage.setItem("biblia_online_last_inactivity_notification", todayStr);

      const lang = typeof window !== "undefined" ? localStorage.getItem("app-language") || "pt" : "pt";
      const title = lang === "en" ? "Did you forget to read the Bible?" : "Esqueceu de ler a Bíblia?";
      const body = lang === "en"
        ? "How about reading a verse and meditating on the Word of God today?"
        : "Que tal ler um versículo e meditar na palavra de Deus hoje?";
      sendLocalNotification(title, body, `biblia-inactivity-${todayStr}`, false);
    }
  }
};

export const getDailyVerseForSlot = (isEvening: boolean) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = ((dayOfYear * 2) + (isEvening ? 1 : 0)) % dailyVerses.length;
  return dailyVerses[index];
};

export const checkScheduledNotifications = () => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = getLocalDateString(now);
  const lang = typeof window !== "undefined" ? localStorage.getItem("app-language") || "pt" : "pt";

  // 8 AM (8h) window (from 8 to 12) - Disparo único pela manhã
  if (currentHour >= 8 && currentHour < 12 && settings.morningVerse) {
    const lastMorning = localStorage.getItem("biblia_online_last_morning_notification");
    if (lastMorning !== todayStr) {
      // Bloqueio atômico imediato no localStorage para evitar corridas entre abas/intervalos
      localStorage.setItem("biblia_online_last_morning_notification", todayStr);
      const verse = getDailyVerseForSlot(false);
      const title = lang === "en"
        ? `Verse of the Day - ${verse.reference}`
        : `Versículo do Dia - ${verse.reference}`;
      sendLocalNotification(
        title,
        verse.text,
        `biblia-morning-${todayStr}`,
        false
      );
    }
  }

  // 8 PM (20h) window (from 20 to 24 / 8 PM to midnight) - Disparo único à noite
  if (currentHour >= 20 && currentHour < 24 && settings.eveningVerse) {
    const lastEvening = localStorage.getItem("biblia_online_last_evening_notification");
    if (lastEvening !== todayStr) {
      // Bloqueio atômico imediato no localStorage para evitar corridas entre abas/intervalos
      localStorage.setItem("biblia_online_last_evening_notification", todayStr);
      const verse = getDailyVerseForSlot(true);
      const title = lang === "en"
        ? `Evening Verse - ${verse.reference}`
        : `Versículo da Noite - ${verse.reference}`;
      sendLocalNotification(
        title,
        verse.text,
        `biblia-evening-${todayStr}`,
        false
      );
    }
  }
};

export const sendLocalNotification = async (
  title: string, 
  body: string, 
  tag: string = "biblia-notification",
  renotify: boolean = false
): Promise<void> => {
  const lang = typeof window !== "undefined" ? localStorage.getItem("app-language") || "pt" : "pt";
  if (!("Notification" in window)) {
    throw new Error(lang === "en" ? "Your browser does not support notifications." : "Seu navegador não suporta notificações.");
  }

  if (Notification.permission !== "granted") {
    throw new Error(lang === "en" ? "Notification permission not granted. Please enable notifications in your browser settings." : "Permissão de notificação não concedida. Por favor, ative as notificações nas configurações do seu navegador.");
  }

  if (!window.isSecureContext) {
    throw new Error(lang === "en" ? "Notifications require a secure connection (HTTPS)." : "Notificações requerem uma conexão segura (HTTPS).");
  }

  const isInIframe = window.self !== window.top;
  if (isInIframe) {
    console.warn("[Notification] Executando dentro de um iframe. Algumas permissões ou registros de Service Worker podem ser bloqueados pelo navegador.");
  }

  // 1. Prioritize service worker ready registration (safest for PWAs, background notifications, and offline)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === "function") {
        await registration.showNotification(title, {
          body,
          icon: "/icons/logo2.png",
          badge: "/apple-touch-icon.png",
          vibrate: [200, 100, 200],
          tag,
          renotify,
          data: {
            isLocalTest: tag.includes("test"),
            notificationId: tag,
            url: "/"
          }
        });
        return;
      } else {
        throw new Error(lang === "en" ? "The active Service Worker does not support notifications." : "O Service Worker ativo não suporta notificações.");
      }
    } catch (err: any) {
      console.warn("[Notification] SW showNotification falhou, tentando fallback direto:", err);
      try {
        new Notification(title, {
          body,
          icon: "/icons/logo2.png",
          tag,
        });
      } catch (fallbackErr: any) {
        throw new Error(lang === "en" ? "Could not display notification. Check your device permissions." : "Não foi possível exibir a notificação. Verifique as permissões do seu dispositivo.");
      }
    }
  } else {
    // 2. Direct fallback for browsers without service worker support (e.g., standard Safari outside of PWA)
    try {
      new Notification(title, {
        body,
        icon: "/icons/logo2.png",
        tag,
      });
    } catch (err: any) {
      throw new Error(lang === "en" ? "Could not display notification. Check your device permissions." : "Não foi possível exibir a notificação. Verifique as permissões do seu dispositivo.");
    }
  }
};
