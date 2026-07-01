import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { User, LogIn, LogOut, Settings, Bell, BellOff, Download, KeyRound, Camera, Pencil, WifiOff, CheckCircle, Eye, EyeOff, Trash2, AlertTriangle, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Turnstile } from '@marsidev/react-turnstile';
import { useSentinel } from "@/hooks/useSentinel";
import { setupPushNotifications } from "@/services/pushService";
import { sendLocalNotification, getNotificationSettings, saveNotificationSettings } from "@/services/notificationService";

const NOTIFICATIONS_KEY = "bible-notifications-enabled";
const OFFLINE_KEY = "bible-offline-enabled";

// Helper to translate common Supabase auth errors
const translateAuthError = (message: string) => {
  const lowered = message.toLowerCase();
  if (lowered.includes("timeout-or-duplicate")) return "A verificação de segurança expirou. Por favor, tente novamente.";
  if (lowered.includes("failed to fetch")) return "Erro de conexão. Verifique sua internet ou se o serviço está disponível.";
  if (lowered.includes("invalid login credentials")) return "Credenciais inválidas. Verifique seu e-mail e senha.";
  if (lowered.includes("user already registered")) return "Este e-mail já está em uso.";
  if (lowered.includes("password should contain at least one character of each")) return "A senha deve conter letras (maiúsculas e minúsculas), números e símbolos (!@#$).";
  if (lowered.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (lowered.includes("email not confirmed")) return "Por favor, verifique seu e-mail antes de entrar.";
  if (lowered.includes("refresh token") || lowered.includes("refresh_token") || lowered.includes("not found")) return "Sessão expirada ou inválida. Por favor, entre novamente.";
  return message; // fallback
};

const AccountPage = () => {
  const authCtx = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(authCtx.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<any>(null);
  const { toast } = useToast();
  const { checkRisk } = useSentinel();

  const [turnstileToken, setTurnstileToken] = useState("");
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    setLoading(authCtx.loading);
  }, [authCtx.loading]);

  useEffect(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setAppVersion(data.version))
      .catch(() => setAppVersion("2.0"));

    const loadProfile = async () => {
      if (authCtx.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', authCtx.user.sub)
            .maybeSingle();

          if (profile) {
            setDisplayName(profile.display_name || authCtx.user.name || "");
            // Preferimos a imagem do perfil do Supabase se houver, senão usamos a do Google
            setAvatarUrl(profile.avatar_url || authCtx.user.picture || null);
          } else {
            // Se o perfil não existir no banco, usamos os dados do Google
            setDisplayName(authCtx.user.name || "");
            const googlePicture = authCtx.user.picture || null;
            setAvatarUrl(googlePicture);
            
            // Criação silenciosa do perfil se possível para garantir persistência
            try {
              await supabase.from('profiles').upsert({ 
                id: authCtx.user.sub, 
                display_name: authCtx.user.name, 
                avatar_url: googlePicture 
              });
            } catch (upsertErr) {
              console.warn("Silent profile creation failed:", upsertErr);
            }
          }
        } catch (err) {
          console.error("Error loading profile:", err);
          setDisplayName(authCtx.user.name || "");
          setAvatarUrl(authCtx.user.picture || null);
        }
      }
    };

    if (!authCtx.loading) {
      loadProfile();
      setNotificationsEnabled(localStorage.getItem(NOTIFICATIONS_KEY) === "true");
      setOfflineEnabled(localStorage.getItem(OFFLINE_KEY) === "true");
    }
  }, [authCtx.loading, authCtx.user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) await handleAuthError(error);
      if (session?.user) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `avatars/${session.user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
        const avatarWithBuster = `${publicUrl}?t=${Date.now()}`;
        setAvatarUrl(avatarWithBuster);
        await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: avatarWithBuster });
        toast({ title: "Foto de perfil atualizada! 📸" });
        return;
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    }
    toast({ title: "Erro", description: "Sessão não encontrada. Faça login novamente.", variant: "destructive" });
  };

  const saveName = async () => {
    setEditingName(false);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) await handleAuthError(error);
      if (session?.user) {
        await supabase.from('profiles').upsert({ id: session.user.id, display_name: displayName });
      }
    } catch {}
    toast({ title: "Nome salvo! ✨" });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    // Sentinel check as first layer
    const risk = await checkRisk();
    if (risk.score >= 70) {
      console.warn("[Sentinel] Blocked suspicious attempt:", risk.reasons);
      toast({ 
        title: "Acesso Restrito", 
        description: "Detectamos uma atividade incomum. Por favor, tente novamente mais tarde ou contate o suporte.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!turnstileToken) {
      toast({ title: "Atenção", description: "Por favor, valide o captcha de segurança.", variant: "destructive" });
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            captchaToken: turnstileToken
          }
        });

        if (error) {
          console.error("Erro Supabase:", error);
          toast({ title: "Erro", description: translateAuthError(error.message), variant: "destructive" });
          turnstileRef.current?.reset();
          setTurnstileToken("");
          return;
        }

        if (data.user) {
          toast({ title: "Conta criada com sucesso! 🎉", description: "Redirecionando..." });
          navigate("/");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: {
            captchaToken: turnstileToken
          }
        });

        if (error) {
          console.error("Erro Supabase:", error);
          toast({ title: "Erro", description: translateAuthError(error.message), variant: "destructive" });
          turnstileRef.current?.reset();
          setTurnstileToken("");
          return;
        }

        if (data.user) {
          toast({ title: "Login realizado! 🎉" });
          if ((window as any).PasswordCredential) {
            try {
              const cred = new (window as any).PasswordCredential({ id: email, password, name: email });
              await navigator.credentials.store(cred);
            } catch {}
          }
          navigate("/");
        }
      }
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast({ title: "Erro", description: "Ocorreu um erro inesperado ao criar a conta.", variant: "destructive" });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("1. Iniciando recuperação de senha...");

    if (!resetEmail.trim()) {
      toast({ title: "Erro", description: "Por favor, digite seu e-mail.", variant: "destructive" });
      return;
    }

    // Sentinel check as first layer
    const risk = await checkRisk();
    if (risk.score >= 70) {
      console.warn("[Sentinel] Blocked suspicious recovery attempt:", risk.reasons);
      toast({ 
        title: "Acesso Restrito", 
        description: "Detectamos uma atividade incomum. Por favor, tente novamente mais tarde.", 
        variant: "destructive" 
      });
      return;
    }

    if (!turnstileToken) {
      toast({ title: "Atenção", description: "Por favor, valide o captcha de segurança.", variant: "destructive" });
      return;
    }

    setAuthLoading(true);
    try {
      console.log("2. Enviando requisição para o Supabase...");
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
        captchaToken: turnstileToken,
      });

      console.log("3. Resposta do Supabase:", { error });

      if (error) {
        toast({ title: "Erro", description: `Erro: ${translateAuthError(error.message)}`, variant: "destructive" });
        turnstileRef.current?.reset();
        setTurnstileToken("");
        return;
      }

      toast({ title: "Sucesso", description: "Link enviado! Verifique sua caixa de entrada e SPAM." });
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setShowForgotPassword(false);

    } catch (err) {
      console.error("Erro inesperado no catch:", err);
      toast({ title: "Erro", description: "Ocorreu um erro ao processar o pedido.", variant: "destructive" });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://online-biblia.vercel.app`
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Erro ao entrar com Google", description: translateAuthError(e.message), variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    authCtx.logout();
    toast({ title: "Logout realizado" });
    navigate("/");
  };

  const handleDeleteData = async () => {
    if (!authCtx.user) {
      toast({ title: "Sessão não encontrada", variant: "destructive" });
      return;
    }
    
    setDeleting(true);
    setShowDeleteModal(false);
    try {
      // 1. Chamada RPC: Função no banco que deleta o usuário da auth.users
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        console.error("RPC Error:", error);
        throw new Error("Falha ao comunicar com o servidor de banco de dados.");
      }
      
      // 2. Limpeza local e logout seguro
      localStorage.clear();
      await supabase.auth.signOut().catch(() => {});
      authCtx.logout();
      
      toast({ title: "Conta Excluída", description: "Todos os seus dados foram removidos permanentemente." });
      
      // 3. Redirecionamento imediato
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Erro fatal na exclusão:", error);
      toast({ 
        title: "Erro na exclusão", 
        description: "Ocorreu um problema ao processar sua solicitação. Tente novamente mais tarde.", 
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
    }
  };

  const isIOSPWA = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    return { isIOS, isStandalone };
  };

  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        // Ativa nas configurações de notificações locais
        const localSettings = getNotificationSettings();
        localSettings.enabled = true;
        saveNotificationSettings(localSettings);

        setNotificationsEnabled(true);
        localStorage.setItem(NOTIFICATIONS_KEY, "true");

        if (authCtx.user) {
          try {
            await setupPushNotifications(authCtx.user.sub);
          } catch (err) {
            console.warn("Erro ao registrar push notifications do OneSignal:", err);
          }
          toast({ title: "Notificações do OneSignal ativadas! 🔔" });
        } else {
          // If not logged in, request permission directly
          try {
            const { oneSignalService } = await import("@/services/oneSignalService");
            await oneSignalService.requestPermission();
          } catch (err) {
            console.warn("Erro ao solicitar permissão de push no OneSignal:", err);
          }
          toast({ 
            title: "Notificações locais e OneSignal ativadas! 🔔", 
            description: "Você receberá o versículo diário e mensagens importantes." 
          });
        }
      } else {
        // Desativa nas configurações locais
        const localSettings = getNotificationSettings();
        localSettings.enabled = false;
        saveNotificationSettings(localSettings);

        setNotificationsEnabled(false);
        localStorage.setItem(NOTIFICATIONS_KEY, "false");
        
        if (authCtx.user) {
          try {
            const { oneSignalService } = await import("@/services/oneSignalService");
            await oneSignalService.logout();
          } catch (err) {
            console.warn("Erro ao desvincular OneSignal:", err);
          }
        }
        
        toast({ title: "Notificações desativadas" });
      }
    } catch (error) {
      console.error("Erro ao alternar notificações:", error);
      toast({ 
        title: "Erro ao configurar", 
        description: "Ocorreu um problema ao salvar suas configurações.", 
        variant: "destructive" 
      });
    }
  };

  const [offlineProgress, setOfflineProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleOffline = async () => {
    if (offlineEnabled) {
      try {
        const cache = await caches.open('biblia-offline-data');
        await cache.keys().then(keys => Promise.all(keys.map(k => cache.delete(k))));
        setOfflineEnabled(false);
        localStorage.setItem(OFFLINE_KEY, "false");
        toast({ title: "Dados offline removidos" });
      } catch {
        toast({ title: "Erro ao remover dados offline", variant: "destructive" });
      }
      return;
    }

    setIsDownloading(true);
    setOfflineProgress(0);
    try {
      const cache = await caches.open('biblia-offline-data');
      
      const activeScripts = Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src')).filter(Boolean) as string[];
      const activeStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href')).filter(Boolean) as string[];
      const activeImages = Array.from(document.querySelectorAll('img')).map(i => i.getAttribute('src')).filter(Boolean) as string[];

      const filesToCache = Array.from(new Set([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/apple-touch-icon.png',
        '/apple-touch-icon-precomposed.png',
        '/icon-192.png',
        '/icon-512.png',
        '/icons/logo2.png',
        '/icons/icon-any-192.png',
        '/icons/icon-any-512.png',
        '/placeholder.svg',
        '/criar',
        '/ai',
        '/pesquisa',
        '/favoritos',
        '/devocional',
        '/conta',
        'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json',
        ...activeScripts,
        ...activeStyles,
        ...activeImages
      ]));

      let completed = 0;
      for (const url of filesToCache) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } catch {}
        completed++;
        setOfflineProgress(Math.round((completed / filesToCache.length) * 100));
      }

      if ('serviceWorker' in navigator) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout waiting for Service Worker")), 3000)
          );
          const reg = await Promise.race([navigator.serviceWorker.ready, timeoutPromise]) as ServiceWorkerRegistration;
          reg?.active?.postMessage({ type: 'CACHE_OFFLINE' });
        } catch (swErr) {
          console.warn("Service Worker not ready for offline cache:", swErr);
        }
      }
      
      setOfflineProgress(100);
      setOfflineEnabled(true);
      localStorage.setItem(OFFLINE_KEY, "true");
      toast({ title: "Biblia baixada com sucesso! 📖", description: "Agora funciona sem internet." });
    } catch {
      toast({ title: "Erro ao baixar", description: "Verifique sua conexão.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setOfflineProgress(0), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto max-w-md px-4 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {authCtx.user ? (
            <>
              <div className="mb-4 text-center">
                <div className="relative mx-auto mb-3 h-24 w-24">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="" 
                      className="h-24 w-24 rounded-full object-cover border-3 border-accent"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        console.warn("Avatar image failed to load, trying fallback");
                        // Se falhou a imagem do Supabase e temos a do Google, tenta a do Google
                        if (avatarUrl !== authCtx.user?.picture && authCtx.user?.picture) {
                          setAvatarUrl(authCtx.user.picture);
                        } else {
                          setAvatarUrl(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
                      <User className="h-12 w-12 text-primary-foreground" />
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                {editingName ? (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("your_name")}
                      className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent w-48"
                      autoFocus onKeyDown={(e) => e.key === "Enter" && saveName()} />
                    <button onClick={saveName} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-accent-foreground liquid-btn">OK</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)} className="mt-1 flex items-center gap-1 mx-auto text-base font-semibold text-foreground hover:text-accent transition-colors">
                    {displayName || t("add_name")} <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{authCtx.user?.email}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="glass-card rounded-xl p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4 text-accent" /> {t("settings_title")}
                  </h3>
                  <div className="space-y-3">
                    {/* Idioma Selection Row */}
                    <div className="rounded-xl bg-secondary/30 p-3 flex flex-col gap-2 border border-border/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            <Languages className="h-4 w-4 text-accent" />
                          </span>
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">{t("language_title")}</p>
                            <p className="text-[10px] text-muted-foreground">{t("language_sub")}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setLanguage("pt")}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all duration-200 ${
                            language === "pt"
                              ? "border-accent bg-accent/10 text-accent font-bold"
                              : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          Português
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage("en")}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all duration-200 ${
                            language === "en"
                              ? "border-accent bg-accent/10 text-accent font-bold"
                              : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          Inglês (English)
                        </button>
                      </div>
                    </div>

                    <button onClick={toggleNotifications} className="flex w-full items-center justify-between rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary liquid-btn">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{notificationsEnabled ? <Bell className="h-4 w-4 text-accent" /> : <BellOff className="h-4 w-4" />}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{t("notifications_title")}</p>
                          <p className="text-[10px] text-muted-foreground">{notificationsEnabled ? t("notifications_desc_active") : t("notifications_desc_inactive")}</p>
                        </div>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${notificationsEnabled ? "bg-accent" : "bg-muted"} flex items-center px-0.5`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${notificationsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>

                    {notificationsEnabled && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {authCtx.user ? (
                          <button 
                            onClick={async () => {
                              try {
                                const session = await supabase.auth.getSession();
                                const token = session.data.session?.access_token;
                                if (!token) {
                                  toast({ title: "Erro de sessão", description: "Não foi possível obter o token de sessão.", variant: "destructive" });
                                  return;
                                }
                                
                                const response = await fetch('/api/push/test', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                const responseText = await response.text();
                                let data: any = {};
                                try {
                                  data = responseText ? JSON.parse(responseText) : {};
                                } catch (e) {
                                  console.error("Failed to parse response JSON:", responseText, e);
                                  throw new Error(language === "en" ? "Server returned an invalid response." : "O servidor retornou uma resposta inválida.");
                                }
                                
                                if (response.ok) {
                                  toast({ 
                                    title: language === "en" ? "Real Push Sent! 📡" : "Push Real Enviado! 📡", 
                                    description: language === "en" ? "A real push notification was triggered by the server." : "Uma notificação push real foi disparada pelo servidor." 
                                  });
                                } else {
                                  if (data.error === "NO_SUBSCRIPTION") {
                                    toast({
                                      title: language === "en" ? "No Subscription" : "Sem Inscrição",
                                      description: language === "en" 
                                        ? "Active push subscription not found. Try toggling notifications off and on again to register."
                                        : "Inscrição de push ativa não encontrada. Experimente desativar e reativar as notificações para registrar seu navegador.",
                                      variant: "destructive"
                                    });
                                  } else {
                                    toast({ 
                                      title: language === "en" ? "Server Error" : "Falha no servidor", 
                                      description: data.message || (language === "en" ? "Unknown error sending push." : "Erro desconhecido ao enviar push."), 
                                      variant: "destructive" 
                                    });
                                  }
                                }
                              } catch (err) {
                                console.error("Erro ao disparar teste de push:", err);
                                toast({ 
                                  title: language === "en" ? "Connection Error" : "Erro de conexão", 
                                  description: language === "en" ? "Failed to communicate with the server." : "Falha ao se comunicar com o servidor.", 
                                  variant: "destructive" 
                                });
                              }
                            }}
                            className="flex-1 min-w-[80px] rounded-lg bg-blue-500/10 py-2 text-[10px] font-medium text-blue-500 hover:bg-blue-500/20 transition-colors"
                          >
                            {language === "en" ? "Test" : "Testar"}
                          </button>
                        ) : (
                          <div className="flex-1 py-2 text-[10px] text-muted-foreground italic text-center">
                            {language === "en" ? "Sign in to test push notifications" : "Faça login para testar as notificações push"}
                          </div>
                        )}

                        <div className="flex-[1.5] min-w-[120px] rounded-lg bg-secondary/30 px-3 py-2 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{t("clock_status")}</span>
                          <span className="text-[10px] font-mono text-accent animate-pulse">{t("clock_active")}</span>
                        </div>
                      </div>
                    )}

                    <button onClick={toggleOffline} disabled={isDownloading} className="flex w-full items-center justify-between rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary disabled:opacity-70 liquid-btn">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {offlineEnabled ? <CheckCircle className="h-4 w-4 text-accent" /> : isDownloading ? <Download className="h-4 w-4 animate-bounce text-accent" /> : <WifiOff className="h-4 w-4" />}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{t("offline_title")}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {isDownloading ? `${t("offline_desc_downloading")} ${offlineProgress}%` : offlineEnabled ? t("offline_desc_active") : t("offline_desc_inactive")}
                          </p>
                          {isDownloading && (
                            <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${offlineProgress}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${offlineEnabled ? "bg-accent" : "bg-muted"} flex items-center px-0.5`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${offlineEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setShowDeleteModal(true)} 
                      disabled={deleting}
                      className="flex w-full items-center gap-3 rounded-xl bg-destructive/10 p-3 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed liquid-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{deleting ? t("deleting_profile") : t("delete_account")}</p>
                        <p className="text-[10px] opacity-70">{t("delete_account_desc")}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 liquid-btn">
                  <LogOut className="h-4 w-4" /> {t("sign_out")}
                </button>
              </div>
            </>
          ) : showForgotPassword ? (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary">
                  <KeyRound className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="font-serif text-xl font-bold text-foreground">Recuperar Senha</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Seu e-mail" required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                
                <button type="submit" disabled={authLoading || !turnstileToken}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 liquid-btn">
                  {authLoading ? "Enviando..." : "Enviar Link"}
                </button>
              </form>
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setTurnstileToken("");
                  turnstileRef.current?.reset();
                }} 
                className="mt-4 w-full text-center text-sm text-accent hover:underline"
              >
                Voltar ao login
              </button>
              
              <div className="flex justify-center overflow-hidden min-h-[65px] w-[300px] mx-auto mt-4 relative">
                <Turnstile 
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || ""} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => {
                    setTurnstileToken("");
                    turnstileRef.current?.reset();
                  }}
                  onError={() => {
                    console.warn("Turnstile widget failed to load or domain is not authorized.");
                  }}
                  options={{ theme: "auto" }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary">
                  <LogIn className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="font-serif text-xl font-bold text-foreground">{isSignUp ? "Criar Conta" : "Entrar"}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{isSignUp ? "Crie sua conta para salvar progresso" : "Acesse sua conta"}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-3" autoComplete="on">
                <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required minLength={6}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {isSignUp && password.length > 0 && (() => {
                  const result = zxcvbn(password);
                  const score = result.score;
                  const colors = ['bg-destructive', 'bg-destructive', 'bg-[hsl(40,90%,50%)]', 'bg-[hsl(100,60%,45%)]', 'bg-[hsl(140,70%,40%)]'];
                  const widths = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'];
                  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'];
                  return (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${colors[score]} ${widths[score]}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${score < 3 ? 'text-destructive' : 'text-muted-foreground'}`}>{labels[score]}</span>
                      </div>
                      {score < 3 && (
                        <p className="text-[11px] text-destructive">Para sua segurança, crie uma senha mais forte e menos comum.</p>
                      )}
                    </div>
                  );
                })()}

                <button type="submit" disabled={authLoading || !turnstileToken || (isSignUp && zxcvbn(password).score < 3)}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed liquid-btn">
                  {authLoading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
                </button>

                {!isSignUp && (
                  <button type="button" onClick={() => {
                    setShowForgotPassword(true);
                    setTurnstileToken("");
                    turnstileRef.current?.reset();
                  }} className="w-full text-center text-sm text-accent hover:underline">
                    Esqueci minha senha
                  </button>
                )}

                <div className="flex justify-center overflow-hidden min-h-[65px] w-[300px] mx-auto mt-4 relative">
                  <Turnstile 
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || ""} 
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => {
                      setTurnstileToken("");
                      turnstileRef.current?.reset();
                    }}
                    onError={() => {
                      console.warn("Turnstile widget failed to load or domain is not authorized.");
                    }}
                    options={{ theme: "auto" }}
                  />
                </div>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                <button onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary liquid-btn">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
                <button onClick={() => {
                  setIsSignUp(!isSignUp);
                  setTurnstileToken("");
                  turnstileRef.current?.reset();
                }} className="font-medium text-accent hover:underline">
                  {isSignUp ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </>
          )}

          <div className="mt-8 pb-4 text-center">
            <p className="text-xs text-muted-foreground font-sans font-medium tracking-wide">
              Biblia Online — Versão {appVersion || "2.0"}
            </p>
          </div>

        </motion.div>
      </section>

      {/* Modal de Confirmação de Exclusão de Conta */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative max-w-sm w-full glass-card border border-border/50 rounded-2xl p-6 shadow-2xl bg-zinc-950/95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ícone de Aviso */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-8 w-8 animate-pulse" />
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-2">{t("delete_modal_title")}</h3>
                
                <p className="text-sm text-red-200 bg-red-950/30 border border-red-500/20 rounded-xl p-4 mb-6 leading-relaxed font-medium">
                  {t("delete_modal_alert")}
                </p>

                {/* Botões */}
                <div className="flex w-full flex-col gap-2">
                  <button
                    onClick={() => handleDeleteData()}
                    disabled={deleting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white py-3 text-sm font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {deleting ? (language === "en" ? "Deleting..." : "Apagando...") : t("delete_modal_confirm")}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 active:scale-95 text-foreground py-3 text-sm font-semibold transition-all"
                  >
                    {t("delete_modal_cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountPage;