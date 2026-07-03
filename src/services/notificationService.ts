
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

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    toast({
      title: "Não suportado",
      description: "Este navegador não suporta notificações desktop.",
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

  const lastVisitDate = new Date(lastVisit);
  const now = new Date();
  const diffInDays = (now.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24);

  if (diffInDays >= 1) {
    const settings = getNotificationSettings();
    if (settings.enabled && settings.inactivityAlert) {
      const lang = localStorage.getItem("app-language") || "pt";
      const title = lang === "en" ? "Forgot to read the Bible?" : "Esqueceu de ler a Bíblia?";
      const body = lang === "en"
        ? "Que tal ler um versículo e meditar na palavra de Deus hoje?"
        : "Que tal ler um versículo e meditar na palavra de Deus hoje?";
      sendLocalNotification(title, body);
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
  const todayStr = now.toISOString().split('T')[0];

  // 8 AM (8h) window (from 8 to 12)
  if (currentHour >= 8 && currentHour < 12 && settings.morningVerse) {
    const lastMorning = localStorage.getItem("biblia_online_last_morning_notification");
    if (lastMorning !== todayStr) {
      const verse = getDailyVerseForSlot(false);
      sendLocalNotification(
        `Versículo do Dia 🌅 - ${verse.reference}`,
        verse.text
      );
      localStorage.setItem("biblia_online_last_morning_notification", todayStr);
    }
  }

  // 8 PM (20h) window (from 20 to 24 / 8 PM to midnight)
  if (currentHour >= 20 && currentHour < 24 && settings.eveningVerse) {
    const lastEvening = localStorage.getItem("biblia_online_last_evening_notification");
    if (lastEvening !== todayStr) {
      const verse = getDailyVerseForSlot(true);
      sendLocalNotification(
        `Versículo da Noite 🌌 - ${verse.reference}`,
        verse.text
      );
      localStorage.setItem("biblia_online_last_evening_notification", todayStr);
    }
  }
};

export const sendLocalNotification = async (title: string, body: string): Promise<void> => {
  if (!("Notification" in window)) {
    throw new Error("Suporte a notificações não encontrado no navegador (Notification API indisponível).");
  }

  if (Notification.permission !== "granted") {
    throw new Error(`Permissão de notificação não concedida (Status atual: '${Notification.permission}'). Por favor, habilite as notificações nas configurações do seu navegador.`);
  }

  if (!window.isSecureContext) {
    throw new Error("Notificações em navegadores requerem um ambiente seguro (HTTPS ou localhost).");
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
          tag: "biblia-notification",
          renotify: true,
        });
        return;
      } else {
        throw new Error("O Service Worker ativo não suporta a API de notificações (showNotification).");
      }
    } catch (err: any) {
      console.warn("[Notification] SW showNotification falhou, tentando fallback direto:", err);
      try {
        new Notification(title, {
          body,
          icon: "/icons/logo2.png",
          tag: "biblia-notification",
        });
      } catch (fallbackErr: any) {
        throw new Error(`Falha no Service Worker e no Fallback. Erro SW: ${err?.message || err}. Erro Fallback: ${fallbackErr?.message || fallbackErr}`);
      }
    }
  } else {
    // 2. Direct fallback for browsers without service worker support (e.g., standard Safari outside of PWA)
    try {
      new Notification(title, {
        body,
        icon: "/icons/logo2.png",
        tag: "biblia-notification",
      });
    } catch (err: any) {
      throw new Error(`Falha ao disparar notificação direta: ${err?.message || err}`);
    }
  }
};
