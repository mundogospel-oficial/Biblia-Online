import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Nav
    "nav_home": "Início",
    "nav_search": "Buscar",
    "nav_ai": "IA",
    "nav_favorites": "Reações",
    "nav_devotional": "Devocionais e Planos",
    "nav_create": "Criar",
    "nav_account": "Conta",
    // Account Settings Page
    "settings_title": "Configurações",
    "language_title": "Idioma",
    "language_sub": "Idioma do aplicativo",
    "language_pt": "Português",
    "language_en": "Inglês",
    "notifications_title": "Notificações",
    "notifications_desc_active": "Mensagens Diárias (8h e 20h)",
    "notifications_desc_inactive": "Desativadas",
    "focus_title": "Foco",
    "focus_badge_timer": "Timer de 1 hora",
    "focus_desc_active": "Ativado — toasts normais silenciados para focar na Palavra",
    "focus_desc_inactive": "Desativa toasts normais para focar na Palavra (1h de timer)",
    "focus_time_remaining": "Tempo restante de foco:",
    "focus_renew": "Renovar 1h",
    "focus_turn_off": "Desativar",
    "test_now": "Testar Agora",
    "clock_status": "Status do Relógio:",
    "clock_active": "Ativo",
    "offline_title": "Bíblia Offline",
    "offline_desc_downloading": "Baixando...",
    "offline_desc_active": "Baixada — funciona sem internet",
    "offline_desc_inactive": "Baixar para usar offline",
    "focus_desc_inactive": "Ative para uma leitura Bíblica mais limpa",
    "focus_desc_active": "Ativado — toasts normais silenciados para focar na Palavra",
    "delete_account": "Excluir Minha Conta e Dados",
    "delete_account_desc": "Apagar perfil e atividades permanentemente",
    "sign_out": "Sair da Conta",
    "add_name": "Adicionar nome",
    "your_name": "Seu nome",
    "not_supported": "Não suportado",
    "not_supported_desc": "Seu navegador não suporta notificações.",
    "permission_denied": "Permissão Negada",
    "permission_denied_desc": "Você precisa permitir notificações nas configurações do seu navegador para testar.",
    "notifications_blocked": "Notificações Bloqueadas",
    "notifications_blocked_desc": "Por favor, libere a permissão de notificações nas configurações do site no seu navegador.",
    "test_sent": "Teste enviado! 🔔",
    "test_sent_desc": "Você deve receber uma notificação em instantes.",
    "login_needed": "Faça login para salvar seu progresso e sincronizar seus dados.",
    "enter_account": "Entrar na Conta",
    "deleting_profile": "Carregando...",
    "delete_modal_title": "Excluir Conta",
    "delete_modal_alert": "Alerta: ao excluir sua conta você apagará todos seus dados e não poderá recuperá-los. Além disso, você terá que aguardar um período de 30 dias para poder criar uma nova conta com este mesmo e-mail.",
    "delete_modal_confirm": "Apagar meus dados",
    "delete_modal_cancel": "Cancelar",
    // Offline AI
    "no_connection": "Sem Conexão",
    "no_internet_ai_desc": "Você precisa de internet para usar IA. Por favor, verifique sua conexão Wi-Fi ou dados móveis e tente novamente.",
    "try_again": "Tentar novamente",
    "no_internet_dict_desc": "Você precisa de internet para usar o Dicionário com IA",
    "no_internet_dict_sub": "Por favor, reconecte-se e tente novamente.",
    "no_internet_translation_desc": "Você precisa de internet para usar Tradução com IA",
    "no_internet_translation_sub": "O modo Bilíngue requer internet para traduzir dinamicamente os versículos via Inteligência Artificial.",
    "no_internet_create_desc": "Você precisa de internet para usar IA",
    "no_internet_create_sub": "O modo Criar com IA requer uma conexão ativa com a internet para gerar novos fundos baseados em versículos."
  },
  en: {
    // Nav
    "nav_home": "Home",
    "nav_search": "Search",
    "nav_ai": "AI",
    "nav_favorites": "Reactions",
    "nav_devotional": "Devotionals and Plans",
    "nav_create": "Create",
    "nav_account": "Account",
    // Account Settings Page
    "settings_title": "Settings",
    "language_title": "Language",
    "language_sub": "Application language",
    "language_pt": "Portuguese",
    "language_en": "English",
    "notifications_title": "Notifications",
    "notifications_desc_active": "Daily Messages (8am and 8pm)",
    "notifications_desc_inactive": "Disabled",
    "focus_title": "Focus",
    "focus_badge_timer": "1-hour timer",
    "focus_desc_active": "Active — normal toasts silenced to focus on the Word",
    "focus_desc_inactive": "Disables normal toasts to focus on the Word (1h timer)",
    "focus_time_remaining": "Focus time remaining:",
    "focus_renew": "Renew 1h",
    "focus_turn_off": "Turn Off",
    "test_now": "Test Now",
    "clock_status": "Clock Status:",
    "clock_active": "Active",
    "offline_title": "Offline Bible",
    "offline_desc_downloading": "Downloading...",
    "offline_desc_active": "Downloaded — works without internet",
    "offline_desc_inactive": "Download to use offline",
    "focus_desc_inactive": "Turn on for a cleaner Bible reading experience",
    "focus_desc_active": "Active — normal toasts silenced to focus on the Word",
    "delete_account": "Delete My Account and Data",
    "delete_account_desc": "Permanently delete profile and activities",
    "sign_out": "Sign Out",
    "add_name": "Add name",
    "your_name": "Your name",
    "not_supported": "Not supported",
    "not_supported_desc": "Your browser does not support notifications.",
    "permission_denied": "Permission Denied",
    "permission_denied_desc": "You need to allow notifications in your browser settings to test.",
    "notifications_blocked": "Notifications Blocked",
    "notifications_blocked_desc": "Please enable notification permission in your browser's site settings.",
    "test_sent": "Test sent! 🔔",
    "test_sent_desc": "You should receive a notification in a moment.",
    "login_needed": "Log in to save your progress and sync your data.",
    "enter_account": "Sign In",
    "deleting_profile": "Loading...",
    "delete_modal_title": "Delete Account",
    "delete_modal_alert": "Warning: deleting your account will erase all your data and cannot be recovered. Additionally, you will have to wait for a period of 30 days before being able to create a new account with this same email.",
    "delete_modal_confirm": "Delete my data",
    "delete_modal_cancel": "Cancel",
    // Offline AI
    "no_connection": "No Connection",
    "no_internet_ai_desc": "You need internet to use AI. Please check your Wi-Fi or mobile data connection and try again.",
    "try_again": "Try again",
    "no_internet_dict_desc": "You need internet to use Bible Dictionary AI",
    "no_internet_dict_sub": "Please reconnect and try again.",
    "no_internet_translation_desc": "You need internet to use AI Translation",
    "no_internet_translation_sub": "Bilingual mode requires internet to dynamically translate verses via Artificial Intelligence.",
    "no_internet_create_desc": "You need internet to use AI",
    "no_internet_create_sub": "Create with AI mode requires an active internet connection to generate new verse-based backgrounds."
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: "pt",
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved === "en" || saved === "pt") ? saved : "pt";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["pt"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
