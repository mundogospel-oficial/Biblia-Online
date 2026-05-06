
import { toast } from "@/hooks/use-toast";

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
      sendLocalNotification("Você esqueceu de ler!", "Faz mais de um dia que você não abre seu app da Bíblia. Que tal ler um versículo agora?");
    }
  }
};

export const sendLocalNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    // Try via service worker if available for better background support
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: "/favicon.ico", // Ensure path is correct
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        tag: "biblia-notification",
      });
    }).catch(() => {
      // Fallback to standard notification
      new Notification(title, { body });
    });
  }
};
