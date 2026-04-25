import { useState, useEffect, useRef } from "react";
import zxcvbn from "zxcvbn";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { User, LogIn, LogOut, Settings, Bell, BellOff, Download, KeyRound, Camera, Pencil, WifiOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Turnstile } from '@marsidev/react-turnstile';
import { lovable } from "@/integrations/lovable";

const NOTIFICATIONS_KEY = "bible-notifications-enabled";
const OFFLINE_KEY = "bible-offline-enabled";

const AccountPage = () => {
  const authCtx = useAuth();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [turnstileToken, setTurnstileToken] = useState("");
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setAppVersion(data.version))
      .catch(() => setAppVersion("1.4"));

    const loadFromDb = async () => {
      if (authCtx.user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setDisplayName(profile.display_name || authCtx.user.name || "");
            setAvatarUrl(profile.avatar_url || authCtx.user.picture || null);
          } else {
            setDisplayName(authCtx.user.name || "");
            setAvatarUrl(authCtx.user.picture || null);
          }
        } else {
          setDisplayName(authCtx.user.name || "");
          setAvatarUrl(authCtx.user.picture || null);
        }
      }
      setLoading(authCtx.loading);
      setNotificationsEnabled(localStorage.getItem(NOTIFICATIONS_KEY) === "true");
      setOfflineEnabled(localStorage.getItem(OFFLINE_KEY) === "true");
    };
    loadFromDb();
  }, [authCtx.loading, authCtx.user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({ id: session.user.id, display_name: displayName });
      }
    } catch {}
    toast({ title: "Nome salvo! ✨" });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    if (!turnstileToken) {
      toast({ title: "Atenção", description: "Por favor, conclua a verificação de humano antes de continuar.", variant: "destructive" });
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { captchaToken: turnstileToken }
        });
        if (error) throw error;
        if (data.session) {
          toast({ title: "Conta criada com sucesso! 🎉" });
        } else {
          toast({ title: "Conta criada com sucesso! 🎉", description: "Faça login para continuar." });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: { captchaToken: turnstileToken }
        });
        if (error) throw error;
        toast({ title: "Login realizado! 🎉" });
      }
      if ((window as any).PasswordCredential) {
        try {
          const cred = new (window as any).PasswordCredential({ id: email, password, name: email });
          await navigator.credentials.store(cred);
        } catch {}
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      setTurnstileToken("");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "E-mail de recuperação enviado! 📧" });
      setShowForgotPassword(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/conta`,
      });
      if (result && 'error' in result && result.error) {
        toast({ title: "Erro ao entrar com Google", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao entrar com Google", variant: "destructive" });
    }
  };

  const handleAppleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/conta`,
      });
      if (result && 'error' in result && result.error) {
        toast({ title: "Erro ao entrar com Apple", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao entrar com Apple", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    authCtx.logout();
    toast({ title: "Logout realizado" });
  };

  const isIOSPWA = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    return { isIOS, isStandalone };
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const { isIOS, isStandalone } = isIOSPWA();
      if (!('Notification' in window)) {
        toast({ title: "Sem suporte", description: "Seu navegador não suporta notificações.", variant: "destructive" });
        return;
      }
      if (isIOS && !isStandalone) {
        toast({ title: "Adicione à tela inicial", description: "No iOS, as notificações só funcionam se o app estiver adicionado à tela inicial.", variant: "destructive" });
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationsEnabled(true);
          localStorage.setItem(NOTIFICATIONS_KEY, "true");
          const reg = await navigator.serviceWorker?.ready;
          reg?.active?.postMessage({ type: 'ENABLE_NOTIFICATIONS' });
          reg?.active?.postMessage({ type: 'TEST_NOTIFICATION' });
          toast({ title: "Notificações ativadas! 🔔" });
        } else {
          toast({ title: "Permissão negada", variant: "destructive" });
        }
      } catch {
        toast({ title: "Erro", description: "Não foi possível ativar notificações.", variant: "destructive" });
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem(NOTIFICATIONS_KEY, "false");
      toast({ title: "Notificações desativadas" });
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
      
      const filesToCache = [
        '/data/biblia-livre.json',
        '/manifest.json',
        '/placeholder.svg',
        '/',
      ];

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
        const reg = await navigator.serviceWorker.ready;
        reg?.active?.postMessage({ type: 'CACHE_OFFLINE' });
      }
      
      setOfflineProgress(100);
      setOfflineEnabled(true);
      localStorage.setItem(OFFLINE_KEY, "true");
      toast({ title: "Bíblia baixada com sucesso! 📖", description: "Agora funciona sem internet." });
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
                    <img src={avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover border-3 border-accent" />
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
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome"
                      className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent w-48"
                      autoFocus onKeyDown={(e) => e.key === "Enter" && saveName()} />
                    <button onClick={saveName} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-accent-foreground liquid-btn">OK</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)} className="mt-1 flex items-center gap-1 mx-auto text-base font-semibold text-foreground hover:text-accent transition-colors">
                    {displayName || "Adicionar nome"} <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{authCtx.user?.email}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="glass-card rounded-xl p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4 text-accent" /> Configurações
                  </h3>
                  <div className="space-y-2">
                    <button onClick={toggleNotifications} className="flex w-full items-center justify-between rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary liquid-btn">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{notificationsEnabled ? <Bell className="h-4 w-4 text-accent" /> : <BellOff className="h-4 w-4" />}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Notificações</p>
                          <p className="text-[10px] text-muted-foreground">{notificationsEnabled ? "Versículos às 08h, 12h e 20h" : "Desativadas"}</p>
                        </div>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${notificationsEnabled ? "bg-accent" : "bg-muted"} flex items-center px-0.5`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${notificationsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>

                    <button onClick={toggleOffline} disabled={isDownloading} className="flex w-full items-center justify-between rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary disabled:opacity-70 liquid-btn">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {offlineEnabled ? <CheckCircle className="h-4 w-4 text-accent" /> : isDownloading ? <Download className="h-4 w-4 animate-bounce text-accent" /> : <WifiOff className="h-4 w-4" />}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Bíblia Offline</p>
                          <p className="text-[10px] text-muted-foreground">
                            {isDownloading ? `Baixando... ${offlineProgress}%` : offlineEnabled ? "Baixada — funciona sem internet" : "Baixar para usar offline"}
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
                  </div>
                </div>

                <button onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 liquid-btn">
                  <LogOut className="h-4 w-4" /> Sair da Conta
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
                <button type="submit" disabled={authLoading}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 liquid-btn">
                  {authLoading ? "Enviando..." : "Enviar Link"}
                </button>
              </form>
              <button onClick={() => setShowForgotPassword(false)} className="mt-4 w-full text-center text-sm text-accent hover:underline">Voltar ao login</button>
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
                <input type="password" name="password" autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required minLength={6}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                
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
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-center text-sm text-accent hover:underline">
                    Esqueci minha senha
                  </button>
                )}

                <div className="flex justify-center overflow-hidden">
                  <Turnstile 
                    siteKey="0x4AAAAAACq9pwmAwoFQtvOP" 
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => toast({ title: "Erro na verificação", description: "Falha ao carregar segurança", variant: "destructive" })}
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
                <button onClick={handleAppleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary liquid-btn">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuar com Apple
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-accent hover:underline">
                  {isSignUp ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </>
          )}

          <div className="mt-8 pb-4 text-center">
            <p className="text-xs text-muted-foreground font-sans font-medium tracking-wide">
              Bíblia Online — Versão {appVersion || "1.4"}
            </p>
          </div>

        </motion.div>
      </section>
    </div>
  );
};

export default AccountPage;
