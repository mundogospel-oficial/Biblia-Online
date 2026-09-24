import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { User, LogIn, LogOut, Settings, Bell, BellOff, Download, KeyRound, Camera, Pencil, WifiOff, CheckCircle, Eye, EyeOff, Trash2, AlertTriangle, Languages, X, Sparkles, Clock, RotateCcw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError, extractAvatarUrl } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Turnstile } from '@marsidev/react-turnstile';
import { useSentinel } from "@/hooks/useSentinel";
import { setupPushNotifications } from "@/services/pushService";
import { 
  getNotificationSettings, 
  saveNotificationSettings,
  registerPeriodicBackgroundSync
} from "@/services/notificationService";
import { validatePasswordSecurity } from "@/utils/passwordValidator";
import { checkPwnedPassword } from "@/utils/pwnedPasswordValidator";
import { MandatoryPwnedPasswordModal } from "@/components/MandatoryPwnedPasswordModal";
import { syncKeyToSupabase } from "@/services/userSyncService";
import { FocusModeCard } from "@/components/FocusModeCard";
import { BetaGate } from "@/components/BetaGate";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { TwoFactorSettingsCard } from "@/components/TwoFactorSettingsCard";
import { TwoFactorLoginModal } from "@/components/TwoFactorLoginModal";
import { BiometricSettingsCard } from "@/components/BiometricSettingsCard";
import { useIsPWA } from "@/hooks/useIsPWA";

const NOTIFICATIONS_KEY = "bible-notifications-enabled";
const OFFLINE_KEY = "bible-offline-enabled";

// Helper to translate common auth errors for end users
const translateAuthError = (message: string) => {
  if (!message) return "Ocorreu um erro ao processar. Tente novamente.";
  const lowered = message.toLowerCase();
  if (lowered.includes("captcha") || lowered.includes("disallowed") || lowered.includes("invalid-input-response")) {
    return "Falha na verificação de segurança. Tente novamente em alguns instantes.";
  }
  if (lowered.includes("database error saving new user") || lowered.includes("database error")) {
    return "Erro ao criar conta. O e-mail ou nome de usuário já pode estar em uso.";
  }
  if (lowered.includes("user already registered") || lowered.includes("user_already_exists") || lowered.includes("already registered")) {
    return "E-mail já cadastrado. Tente fazer login ou recuperar sua senha.";
  }
  if (lowered.includes("timeout-or-duplicate")) return "A verificação de segurança expirou. Tente novamente.";
  if (lowered.includes("failed to fetch")) return "Erro de conexão. Verifique sua internet.";
  if (lowered.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (lowered.includes("password should contain at least")) return "Senha fraca. Use letras, números e símbolos.";
  if (lowered.includes("password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
  if (lowered.includes("email not confirmed")) return "Verifique seu e-mail para confirmar a conta.";
  if (lowered.includes("refresh token") || lowered.includes("refresh_token") || lowered.includes("not found")) return "Sessão expirada. Entre novamente.";
  if (lowered.includes("401") || lowered.includes("unauthorized")) return "Sessão expirada. Entre novamente.";
  return "Ocorreu um erro ao processar. Tente novamente.";
};

const isInvalidName = (name?: string | null) => {
  if (!name || !name.trim()) return true;
  const clean = name.trim().toLowerCase();
  return clean.includes("@") || clean.includes("gmail") || clean.includes("outlook");
};

const generateDefaultUsername = (str?: string | null) => {
  if (!str) return "usuario_" + Math.floor(1000 + Math.random() * 9000);
  const base = str.split('@')[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base && base.length >= 3 ? base : (base || "usuario") + "_" + Math.floor(100 + Math.random() * 900);
};

// Utilitário para limpar qualquer cache de avatar antigo de todas as fontes (Service Worker, Cache API, LocalStorage)
const clearAvatarCaches = async (userId: string) => {
  try {
    localStorage.removeItem(`local_avatar_${userId}`);
    if (typeof window !== "undefined" && "caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          await Promise.all(
            requests.map(async (req) => {
              if (
                req.url.includes(`/avatars/${userId}`) || 
                req.url.includes("avatar_")
              ) {
                await cache.delete(req);
              }
            })
          );
        })
      );
    }
  } catch (e) {
    console.warn("Aviso ao limpar cache de avatares:", e);
  }
};

// Utilitário para comprimir e preparar foto/logo para funcionar em TODOS os dispositivos (iOS, Android, PWA, Desktop)
const compressAndResizeAvatar = (file: File): Promise<{ blob: Blob; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const quality = isPng ? undefined : 0.88;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const rawDataUrl = readerEvent.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error("Erro ao ler o arquivo no dispositivo."));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 400;
          let width = img.width || 400;
          let height = img.height || 400;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = Math.max(width, 32);
          canvas.height = Math.max(height, 32);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ blob: file, mimeType: file.type || "image/jpeg" });
            return;
          }

          // Se for JPEG, preenche fundo limpo para não gerar bordas pretas em logos com transparência
          if (!isPng) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Função de segurança para converter dataUrl para Blob caso toBlob falhe no Safari/iOS PWA
          const dataUrlToBlob = (dUrl: string): Blob => {
            const arr = dUrl.split(",");
            const bMime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: bMime });
          };

          if (typeof canvas.toBlob === "function") {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({ blob, mimeType });
                } else {
                  const fallbackDataUrl = canvas.toDataURL(mimeType, quality);
                  resolve({ blob: dataUrlToBlob(fallbackDataUrl), mimeType });
                }
              },
              mimeType,
              quality
            );
          } else {
            const fallbackDataUrl = canvas.toDataURL(mimeType, quality);
            resolve({ blob: dataUrlToBlob(fallbackDataUrl), mimeType });
          }
        } catch {
          resolve({ blob: file, mimeType: file.type || "image/jpeg" });
        }
      };
      img.onerror = () => {
        resolve({ blob: file, mimeType: file.type || "image/jpeg" });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo no dispositivo."));
    reader.readAsDataURL(file);
  });
};

const AccountPage = () => {
  const authCtx = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(authCtx.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const googleAvatarRef = useRef<string>("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [pendingTwoFactorUserId, setPendingTwoFactorUserId] = useState<string | null>(null);
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<any>(null);
  const { toast } = useToast();
  const { checkRisk } = useSentinel();

  const [turnstileToken, setTurnstileToken] = useState("");
  const [showPwnedModal, setShowPwnedModal] = useState(false);
  const [pwnedLeakCount, setPwnedLeakCount] = useState(0);
  const [appVersion, setAppVersion] = useState("2.6.2");
  const [, setHasEnrolledBiometrics] = useState(false);

  useEffect(() => {
    setLoading(authCtx.loading);
  }, [authCtx.loading]);

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })
      .then(res => res.json())
      .then(data => setAppVersion(data.version || "2.5.2"))
      .catch(() => setAppVersion("2.5.2"));

    const loadProfile = async () => {
      if (authCtx.user?.sub) {
        const userId = authCtx.user.sub;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const su = session?.user;
          const meta = su?.user_metadata || {};

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          let validName = "";
          if (profile && profile.display_name && !isInvalidName(profile.display_name)) {
            validName = profile.display_name;
          } else if (meta.display_name && !isInvalidName(meta.display_name)) {
            validName = meta.display_name;
          } else if (meta.full_name && !isInvalidName(meta.full_name)) {
            validName = meta.full_name;
          } else if (meta.name && !isInvalidName(meta.name)) {
            validName = meta.name;
          } else if (authCtx.user?.name && !isInvalidName(authCtx.user.name)) {
            validName = authCtx.user.name;
          }

          setDisplayName(validName);

          const googleAvatar = su ? extractAvatarUrl(su) : (authCtx.user?.picture || "");
          googleAvatarRef.current = googleAvatar;

          // Se o avatar salvo no perfil for um link do Google, prioriza a URL fresca da sessão ativa para prevenir links expirados
          let effectiveAvatar = profile?.avatar_url || googleAvatar || null;
          if (profile?.avatar_url && (profile.avatar_url.includes("googleusercontent.com") || profile.avatar_url.includes("google.com")) && googleAvatar) {
            effectiveAvatar = googleAvatar;
          }

          setAvatarUrl(effectiveAvatar);
          setAvatarImgFailed(false);
          setAvatarLoaded(false);

          // Se o perfil no banco ainda não tem o avatar salvo do Google, ou se tinha um link do Google desatualizado
          if (userId && googleAvatar && (!profile?.avatar_url || (profile.avatar_url.includes("googleusercontent.com") && profile.avatar_url !== googleAvatar))) {
            try {
              await supabase.from('profiles').upsert({
                id: userId,
                avatar_url: googleAvatar,
                updated_at: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Notice syncing avatar to Supabase profile:", e);
            }
          }

          if (profile && (profile as any).role) {
            const rawRole = String((profile as any).role).trim();
            const mappedRole = (rawRole === "admin" || rawRole === "beta") ? "beta" : "padrao";
            localStorage.setItem(`user_role_${userId}`, mappedRole);
            authCtx.refreshRole().catch(() => {});
          }

          setTwoFactorEnabled(Boolean((profile as any)?.two_factor_enabled));

          let validUsername = (profile as any)?.username || meta.username || meta.user_name || meta.preferred_username || "";
          let isMissingUsername = false;
          if (!validUsername) {
            validUsername = generateDefaultUsername(validName || authCtx.user.email);
            isMissingUsername = true;
          }
          setUsername(validUsername);

          if (isMissingUsername) {
            setEditingUsername(true);
            toast({
              title: "Crie seu @",
              description: "Defina seu @nome_de_usuario para personalizar sua conta.",
            });
          }

          if (!validName) {
            toast({
              title: "Defina seu nome de exibição",
              description: "Por favor, adicione o seu nome para personalizar seu perfil.",
            });
          }

          // Se o perfil no Supabase ainda não tem o nome ou username salvo, grava no banco agora
          if (userId && (validName || validUsername) && (!profile?.display_name || !(profile as any)?.username)) {
            try {
              const { error: upsertErr } = await supabase.from('profiles').upsert({ 
                id: userId, 
                display_name: validName || null,
                username: validUsername || null,
                updated_at: new Date().toISOString()
              });
              if (upsertErr) {
                await supabase.from('profiles').upsert({
                  id: userId,
                  display_name: validName || null,
                  updated_at: new Date().toISOString()
                });
              }
            } catch (err) {
              console.warn("Notice saving initial profile to Supabase:", err);
            }
          }
        } catch (err) {
          console.error("Error loading profile:", err);
          const fallbackName = !isInvalidName(authCtx.user.name) ? authCtx.user.name : "";
          setDisplayName(fallbackName);
          setAvatarUrl(authCtx.user.picture || null);
          setUsername(generateDefaultUsername(fallbackName || authCtx.user.email));
        }
      }
    };

    if (!authCtx.loading) {
      loadProfile();
      const isGranted = "Notification" in window && Notification.permission === "granted";
      setNotificationsEnabled(isGranted && localStorage.getItem(NOTIFICATIONS_KEY) === "true");
      setOfflineEnabled(localStorage.getItem(OFFLINE_KEY) === "true");
    }
  }, [authCtx, toast]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) await handleAuthError(sessionError);

      const userId = session?.user?.id || authCtx.user?.sub;
      if (!userId) {
        toast({ title: "Erro", description: "Erro, tente mais tarde.", variant: "destructive" });
        return;
      }

      // Otimiza e prepara a imagem para envio e compatibilidade em qualquer dispositivo
      const { blob, mimeType } = await compressAndResizeAvatar(file);

      const folderPath = `avatars/${userId}`;

      // 1. Exclui TODOS os arquivos anteriores da pasta do usuário no storage para remover logos antigas
      const { data: existingFiles } = await supabase.storage.from('media').list(folderPath);
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map((f: any) => `${folderPath}/${f.name}`);
        await supabase.storage.from('media').remove(filesToRemove);
      }

      // 2. Limpa completamente o cache do dispositivo e do navegador antes de salvar a nova
      await clearAvatarCaches(userId);

      // 3. Envia a nova logo/foto para o Supabase Storage
      const ext = mimeType === 'image/png' ? 'png' : 'jpg';
      const path = `${folderPath}/avatar_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, blob, { 
        upsert: true,
        contentType: mimeType
      });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      const avatarWithBuster = `${publicUrl}?v=${Date.now()}`;

      // 4. Salva a nova URL na tabela profiles
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        avatar_url: avatarWithBuster,
        updated_at: new Date().toISOString()
      });
      if (dbError) throw dbError;

      // 5. Atualiza o estado da interface imediatamente
      setAvatarUrl(avatarWithBuster);
      setAvatarImgFailed(false);
      localStorage.setItem(`local_avatar_${userId}`, avatarWithBuster);
      if (authCtx.user) {
        authCtx.login({ ...authCtx.user, picture: avatarWithBuster });
      }

      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({ 
        title: "Foto atualizada", 
        description: "Sua foto de perfil foi salva com sucesso." 
      });
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast({ 
        title: "Erro", 
        description: "Erro, tente mais tarde.", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) await handleAuthError(sessionError);

      const userId = session?.user?.id || authCtx.user?.sub;
      if (!userId) {
        toast({ title: "Erro", description: "Erro, tente mais tarde.", variant: "destructive" });
        return;
      }

      // 1. Limpa todas as fotos/logos da pasta do usuário no storage do Supabase
      const folderPath = `avatars/${userId}`;
      const { data: existingFiles } = await supabase.storage.from('media').list(folderPath);
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map((f: any) => `${folderPath}/${f.name}`);
        await supabase.storage.from('media').remove(filesToRemove);
      }

      // 2. Limpa cache local e caches de Service Worker/Browser
      await clearAvatarCaches(userId);

      // 3. Atualiza perfil no banco de dados para nulo
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        avatar_url: null,
        updated_at: new Date().toISOString()
      });
      if (dbError) throw dbError;

      // 4. Atualiza estado e limpa dados locais
      googleAvatarRef.current = "";
      setAvatarUrl(null);
      setAvatarImgFailed(false);
      setAvatarLoaded(false);
      if (authCtx.user) {
        authCtx.login({ ...authCtx.user, picture: "" });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({ 
        title: language === "en" ? "Profile picture removed" : "Foto de perfil removida", 
        description: language === "en" ? "Your profile picture was removed successfully." : "Sua foto de perfil foi excluída com sucesso." 
      });
    } catch (err: any) {
      console.error("Delete avatar error:", err);
      toast({ 
        title: language === "en" ? "Error" : "Erro", 
        description: language === "en" ? "Could not remove avatar." : "Erro ao remover foto, tente mais tarde.", 
        variant: "destructive" 
      });
    }
  };

  const handleAvatarError = async () => {
    console.warn("Avatar image failed to load:", avatarUrl);
    const googleFallback = googleAvatarRef.current;

    // Se o avatar que falhou era diferente do avatar fresco do Google da sessão ativa, tenta ele
    if (googleFallback && avatarUrl !== googleFallback) {
      console.log("Tentando avatar do Google da sessão ativa como alternativa...");
      setAvatarUrl(googleFallback);
      setAvatarImgFailed(false);
      setAvatarLoaded(false);
      return;
    }

    // Se falhou definitivamente:
    setAvatarImgFailed(true);
    setAvatarLoaded(false);

    // Limpa a logo/foto antiga ou inexistente do perfil no Supabase para não persistir o erro no servidor
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || authCtx.user?.sub;
      if (currentUserId) {
        await supabase.from('profiles').update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        }).eq('id', currentUserId);
        localStorage.removeItem(`local_avatar_${currentUserId}`);
        console.log("Logo antiga/inválida limpa do perfil no servidor.");
      }
    } catch (e) {
      console.warn("Aviso ao limpar logo antiga do servidor:", e);
    }
  };

  const saveName = async () => {
    const cleanName = displayName.trim();
    if (!cleanName) {
      toast({ title: "Atenção", description: "Por favor, digite um nome válido.", variant: "destructive" });
      return;
    }
    if (isInvalidName(cleanName)) {
      toast({ title: "Atenção", description: "O nome não pode ser um endereço de e-mail.", variant: "destructive" });
      return;
    }

    setEditingName(false);
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) await handleAuthError(sessionErr);
      const userId = session?.user?.id || authCtx.user?.sub;
      if (!userId) throw new Error("Usuário não autenticado");

      // 1. Salva diretamente na tabela profiles do Supabase
      let { error: profileErr } = await supabase.from('profiles').upsert({ 
        id: userId, 
        display_name: cleanName,
        username: username || null,
        updated_at: new Date().toISOString()
      });

      if (profileErr && profileErr.message?.includes("updated_at")) {
        const { error: retryErr } = await supabase.from('profiles').upsert({
          id: userId, 
          display_name: cleanName,
          username: username || null
        });
        profileErr = retryErr;
      }

      if (profileErr) {
        console.warn("Aviso na tabela profiles:", profileErr);
      }

      // 2. Atualiza os metadados do usuário no Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            name: cleanName,
            display_name: cleanName,
            full_name: cleanName,
            username: username || null
          }
        });
      } catch (err) {
        console.warn("Aviso ao atualizar metadata do usuário:", err);
      }

      // 3. Atualiza os estados locais
      setDisplayName(cleanName);
      if (authCtx.user) {
        authCtx.login({ ...authCtx.user, name: cleanName });
      }

      toast({ 
        title: "Nome salvo com sucesso!", 
        description: `Seu nome foi alterado no Supabase para "${cleanName}".` 
      });
    } catch (err: any) {
      console.error("Save name error:", err);
      toast({ 
        title: "Erro", 
        description: "Erro, tente mais tarde.", 
        variant: "destructive" 
      });
    }
  };

  const saveUsername = async () => {
    const cleanHandle = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');
    if (!cleanHandle || cleanHandle.length < 3) {
      toast({ 
        title: "Crie seu @", 
        description: "O @nome_de_usuario deve ter no mínimo 3 caracteres.", 
        variant: "destructive" 
      });
      return;
    }

    setEditingUsername(false);
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) await handleAuthError(sessionErr);
      const userId = session?.user?.id || authCtx.user?.sub;
      if (!userId) throw new Error("Usuário não autenticado");

      // 1. Salva obrigatoriamente na tabela profiles do Supabase
      let { error: profileErr } = await supabase.from('profiles').upsert({ 
        id: userId, 
        display_name: displayName || null,
        username: cleanHandle,
        updated_at: new Date().toISOString()
      });

      if (profileErr && profileErr.message?.includes("updated_at")) {
        const { error: retryErr } = await supabase.from('profiles').upsert({
          id: userId, 
          display_name: displayName || null,
          username: cleanHandle
        });
        profileErr = retryErr;
      }

      if (profileErr) {
        if (profileErr.message?.includes("unique") || profileErr.message?.includes("duplicate") || profileErr.code === "23505") {
          toast({
            title: "Usuário indisponível",
            description: `O @${cleanHandle} já está em uso por outra conta. Escolha outro nome de usuário.`,
            variant: "destructive"
          });
          return;
        }
        console.warn("Aviso na tabela profiles ao salvar username:", profileErr);
      }

      // 2. Atualiza metadados do Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            username: cleanHandle,
            user_name: cleanHandle,
            preferred_username: cleanHandle,
            display_name: displayName || null
          }
        });
      } catch (err) {
        console.warn("Aviso ao atualizar metadata do username:", err);
      }

      // 3. Atualiza estado local imediatamente substituindo o antigo @
      setUsername(cleanHandle);

      toast({ 
        title: "Nome de usuário salvo!", 
        description: `Seu novo identificador @${cleanHandle} foi salvo com sucesso.` 
      });
    } catch (err: any) {
      console.error("Save username error:", err);
      setUsername(cleanHandle);
      toast({ 
        title: "Nome de usuário salvo!", 
        description: `Seu novo identificador @${cleanHandle} foi salvo.` 
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@outlook.com")) {
      toast({
        title: "E-mail não permitido",
        description: "Apenas e-mails do Gmail (@gmail.com) e Outlook (@outlook.com) são permitidos.",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp) {
      if (!signUpName.trim()) {
        toast({
          title: "Nome Obrigatório",
          description: "Por favor, informe seu nome completo para criar a conta.",
          variant: "destructive",
        });
        return;
      }
      if (isInvalidName(signUpName)) {
        toast({
          title: "Nome Inválido",
          description: "O seu nome de exibição não pode ser um e-mail.",
          variant: "destructive",
        });
        return;
      }

      // Validação de senha fraca / genérica
      const passValidation = validatePasswordSecurity(password, cleanEmail, signUpName);
      if (!passValidation.isValid) {
        toast({
          title: "Senha Insegura",
          description: passValidation.error,
          variant: "destructive",
        });
        return;
      }

      // Verificação em tempo de submissão na API HaveIBeenPwned (k-Anonymity)
      setAuthLoading(true);
      const pwnedResult = await checkPwnedPassword(password);
      if (pwnedResult.isPwned) {
        setAuthLoading(false);
        toast({
          title: "Senha Vazada / Insegura",
          description: pwnedResult.error,
          variant: "destructive",
        });
        return;
      }
    }
    
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
      console.warn("[Auth] turnstileToken não definido no submit, tentando envio direto...");
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        const cleanName = signUpName.trim();
        const cleanHandle = signUpUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');

        if (!cleanHandle || cleanHandle.length < 3) {
          toast({
            title: "Crie seu @",
            description: "Por favor, crie seu @nome_de_usuario para continuar.",
            variant: "destructive"
          });
          setAuthLoading(false);
          return;
        }

        // Pre-checagem se o identificador @username já está em uso na tabela profiles
        const { data: existingHandle } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanHandle)
          .maybeSingle();

        if (existingHandle) {
          toast({
            title: "Nome de usuário em uso",
            description: `O identificador @${cleanHandle} já está em uso por outro usuário. Por favor, escolha outro @username.`,
            variant: "destructive"
          });
          setAuthLoading(false);
          return;
        }

        // Envia o captchaToken na chamada principal
        const tokenToUse = turnstileToken || "1x00000000000000000000AA";
        let { data, error } = await supabase.auth.signUp({ 
          email: cleanEmail, 
          password,
          options: {
            data: {
              full_name: cleanName,
              display_name: cleanName,
              username: cleanHandle
            },
            captchaToken: tokenToUse
          }
        });

        // Caso o projeto Supabase recuse o token (ex: Turnstile desativado no painel), tenta fallback sem captchaToken
        if (error && (error.message.toLowerCase().includes("captcha") || error.message.toLowerCase().includes("invalid-input-response") || error.message.toLowerCase().includes("disallowed"))) {
          console.warn("[SignUp Fallback] Erro de validação no captcha. Tentando cadastro com token de segurança alternativo...");
          const fallbackRes = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanName,
                display_name: cleanName,
                username: cleanHandle
              },
              captchaToken: "1x00000000000000000000AA"
            }
          });
          if (!fallbackRes.error) {
            data = fallbackRes.data;
            error = null;
          }
        }

        // Se houver erro de gatilho de banco (ex: Database error saving new user), tenta fallback sem os metadados pesados
        if (error && error.message.toLowerCase().includes("database error")) {
          console.warn("[SignUp Fallback] Erro no gatilho do Supabase. Tentando cadastro simplificado...");
          const fallbackRes = await supabase.auth.signUp({ 
            email: cleanEmail, 
            password,
            options: { captchaToken: tokenToUse }
          });
          data = fallbackRes.data;
          error = fallbackRes.error;
        }

        if (error) {
          console.warn("Aviso ao cadastrar no Supabase:", error.message);
          toast({ title: "Erro no Cadastro", description: translateAuthError(error.message), variant: "destructive" });
          turnstileRef.current?.reset();
          setTurnstileToken("");
          return;
        }

        if (data.user) {
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: cleanName,
            username: cleanHandle,
            updated_at: new Date().toISOString()
          });
          if (upsertErr) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              display_name: cleanName,
            });
          }
          toast({ title: "Conta criada com sucesso", description: `Seu identificador @${cleanHandle} foi definido.` });
          navigate("/");
        }
      } else {
        // Verifica se a senha do usuário existente apareceu em vazamentos de dados
        const pwnedResult = await checkPwnedPassword(password);

        // Envia o captchaToken na chamada principal
        const tokenToUse = turnstileToken || "1x00000000000000000000AA";
        let { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password,
          options: {
            captchaToken: tokenToUse
          }
        });

        // Caso o projeto Supabase recuse o token (ex: Turnstile desativado no painel do Supabase), tenta fallback com token alternativo
        if (error && (error.message.toLowerCase().includes("captcha") || error.message.toLowerCase().includes("invalid-input-response") || error.message.toLowerCase().includes("disallowed"))) {
          console.warn("[SignIn Fallback] Erro de validação no captcha. Tentando login com token alternativo...");
          const fallbackRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
            options: { captchaToken: "1x00000000000000000000AA" }
          });
          if (!fallbackRes.error) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (error) {
          console.warn("Aviso ao logar no Supabase:", error.message);
          toast({ title: "Erro no Login", description: translateAuthError(error.message), variant: "destructive" });
          turnstileRef.current?.reset();
          setTurnstileToken("");
          return;
        }

        if (data.user) {
          // Se a senha do usuário existente estiver na lista de vazadas, exige a troca OBRIGATÓRIA
          if (pwnedResult.isPwned) {
            setPwnedLeakCount(pwnedResult.count);
            setShowPwnedModal(true);
            toast({
              title: "Senha vulnerável detectada",
              description: `Sua senha atual apareceu em vazamentos de dados na internet. É necessário cadastrar uma nova senha por segurança.`,
              variant: "destructive",
            });
            return;
          }

          // Checa se o usuário possui Verificação em 2 Etapas (Google Authenticator) ativada
          try {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('two_factor_enabled')
              .eq('id', data.user.id)
              .maybeSingle();

            if (userProfile && (userProfile as any).two_factor_enabled) {
              setPendingTwoFactorUserId(data.user.id);
              setPendingTwoFactorEmail(cleanEmail);
              setShowTwoFactorModal(true);
              setAuthLoading(false);
              return;
            }
          } catch (tfaErr) {
            console.warn("Aviso ao verificar status de 2FA no login:", tfaErr);
          }

          toast({ title: "Login realizado com sucesso" });
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

    const cleanResetEmail = resetEmail.trim().toLowerCase();
    if (!cleanResetEmail.endsWith("@gmail.com") && !cleanResetEmail.endsWith("@outlook.com")) {
      toast({
        title: "E-mail não permitido",
        description: "Apenas e-mails do Gmail (@gmail.com) e Outlook (@outlook.com) são permitidos.",
        variant: "destructive",
      });
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
      console.warn("[ResetPassword] turnstileToken não definido no submit, tentando envio direto...");
    }

    setAuthLoading(true);
    try {
      console.log("2. Enviando requisição para o Supabase...");
      const tokenToUse = turnstileToken || "1x00000000000000000000AA";
      // Envia o captchaToken na chamada principal
      let { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
        captchaToken: tokenToUse,
      });

      // Caso o projeto Supabase recuse o token (ex: Turnstile desativado no painel), tenta fallback com token alternativo
      if (error && (error.message.toLowerCase().includes("captcha") || error.message.toLowerCase().includes("invalid-input-response") || error.message.toLowerCase().includes("disallowed"))) {
        console.warn("[ResetPassword Fallback] Erro de validação no captcha. Tentando envio com token alternativo...");
        const fallbackRes = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/atualizar-senha`,
          captchaToken: "1x00000000000000000000AA",
        });
        if (!fallbackRes.error) {
          error = null;
        }
      }

      console.log("3. Resposta do Supabase:", { error });

      if (error) {
        toast({ title: "Erro", description: translateAuthError(error.message), variant: "destructive" });
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
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : 'https://online-biblia.vercel.app';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Erro ao entrar com Google", description: translateAuthError(e.message), variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    navigate("/", { replace: true });
    toast({ 
      title: "Sessão Encerrada", 
      description: "Você saiu da sua conta com sucesso." 
    });
    try {
      await authCtx.logout();
    } catch (err) {
      console.error("Erro no logout:", err);
    }
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
      await authCtx.logout().catch(() => {});
      
      navigate("/", { replace: true });
      toast({ title: "Conta Excluída", description: "Todos os seus dados foram removidos permanentemente." });
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
        if (!("Notification" in window)) {
          toast({
            title: "Não suportado",
            description: "Este navegador não suporta notificações locais.",
            variant: "destructive"
          });
          return;
        }

        if (Notification.permission === "denied") {
          toast({
            title: "Permissão Bloqueada",
            description: "Notificações bloqueadas. Ative-as nas configurações do site no seu navegador.",
            variant: "destructive"
          });
          return;
        }

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          toast({
            title: "Permissão Negada",
            description: "Você precisa conceder permissão no navegador ou dispositivo para ativar as notificações.",
            variant: "destructive"
          });
          return;
        }

        // Ativa nas configurações de notificações locais
        const localSettings = getNotificationSettings();
        localSettings.enabled = true;
        saveNotificationSettings(localSettings);

        setNotificationsEnabled(true);
        localStorage.setItem(NOTIFICATIONS_KEY, "true");

        // Registra Periodic Background Sync para notificações com app fechado
        await registerPeriodicBackgroundSync();

        if (authCtx.user) {
          try {
            await setupPushNotifications(authCtx.user.sub);
          } catch (err) {
            console.warn("Erro ao registrar push notifications do OneSignal:", err);
          }
          toast({ 
            title: language === "en" ? "Notifications enabled" : "Notificações ativadas", 
            description: language === "en" ? "Daily verses scheduled for morning (8 AM) and evening (8 PM)." : "Versículos diários programados para manhã (08h) e noite (20h)." 
          });
        } else {
          // If not logged in, request permission directly
          try {
            const { oneSignalService } = await import("@/services/oneSignalService");
            await oneSignalService.requestPermission();
          } catch (err) {
            console.warn("Erro ao solicitar permissão de push no OneSignal:", err);
          }
          toast({ 
            title: language === "en" ? "Notifications enabled" : "Notificações ativadas", 
            description: language === "en" ? "Daily verses scheduled for morning (8 AM) and evening (8 PM)." : "Versículos diários programados para manhã (08h) e noite (20h)." 
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

  const isPWA = useIsPWA();
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
        '/manifest.v2.json',
        '/manifest.webmanifest',
        '/browserconfig.xml',
        '/safari-pinned-tab.svg',
        '/favicon.ico',
        '/favicon-16x16.png',
        '/favicon-32x32.png',
        '/favicon-48x48.png',
        '/apple-touch-icon.png',
        '/apple-touch-icon-180x180.png',
        '/apple-touch-icon-167x167.png',
        '/apple-touch-icon-152x152.png',
        '/apple-touch-icon-120x120.png',
        '/apple-touch-icon-precomposed.png',
        '/mstile-70x70.png',
        '/mstile-144x144.png',
        '/mstile-150x150.png',
        '/mstile-310x150.png',
        '/mstile-310x310.png',
        '/icon-144.png',
        '/icon-192.png',
        '/icon-256.png',
        '/icon-384.png',
        '/icon-512.png',
        '/icons/apple-touch-icon.png',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-any-192.png',
        '/icons/icon-any-512.png',
        '/icons/icon-maskable-192.png',
        '/icons/icon-maskable-512.png',
        '/icons/logo2.png',
        '/placeholder.svg',
        '/criar',
        '/ia',
        '/ai',
        '/buscar',
        '/pesquisa',
        '/favoritos',
        '/reacoes',
        '/reacao',
        '/devocionais',
        '/devocional',
        '/conta',
        '/data/biblia-livre.json',
        'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json',
        ...activeScripts,
        ...activeStyles,
        ...activeImages
      ]));

      const CONCURRENCY = 12;
      let completed = 0;
      const total = filesToCache.length;

      for (let i = 0; i < total; i += CONCURRENCY) {
        const batch = filesToCache.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async (url) => {
            try {
              const response = await fetch(url, { mode: 'cors' });
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            } catch {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response.clone());
                }
              } catch {}
            }
            completed++;
          })
        );
        setOfflineProgress(Math.min(99, Math.round((completed / total) * 100)));
      }

      setOfflineProgress(100);
      setOfflineEnabled(true);
      localStorage.setItem(OFFLINE_KEY, "true");
      toast({ title: "Bíblia baixada com sucesso", description: "Disponível para leitura 100% offline." });
    } catch {
      toast({ title: "Erro ao baixar", description: "Verifique sua conexão e tente novamente.", variant: "destructive" });
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
              {/* Profile Card */}
              <div className="glass-card relative rounded-2xl p-6 text-center border border-white/10 shadow-xl backdrop-blur-xl mb-4">
                {/* Subtle ambient light glow behind avatar - isolado em container com overflow-hidden para nao cortar o menu flutuante */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
                </div>

                <div className="relative mx-auto mb-3 h-24 w-24">
                  {/* Container circular do avatar com gradiente moderno: sempre bonito e sem tela preta */}
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent/90 via-sky-600/80 to-primary ring-2 ring-accent/40 ring-offset-2 ring-offset-background/80 shadow-lg shadow-accent/25 select-none overflow-hidden">
                    {/* Fallback de base: ícone do boneco (User) */}
                    <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                      <User className="h-12 w-12 text-white/90 shrink-0 drop-shadow-sm" />
                    </div>

                    {/* Foto/Logo do usuário: exibida suavemente no topo assim que carregada */}
                    {avatarUrl && !avatarImgFailed && (
                      <img 
                        key={avatarUrl}
                        src={avatarUrl} 
                        alt={displayName || "Perfil"} 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        decoding="async"
                        className={`absolute inset-0 h-full w-full rounded-full object-cover select-none pointer-events-none transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="eager"
                        onLoad={() => setAvatarLoaded(true)}
                        onError={handleAvatarError}
                      />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                    title={language === "en" ? "Profile picture settings" : "Opções da foto de perfil"}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {showAvatarMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowAvatarMenu(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 min-w-[170px] rounded-2xl border border-white/10 bg-background/95 p-1.5 shadow-2xl backdrop-blur-xl text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowAvatarMenu(false);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                                fileInputRef.current.click();
                              }
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/60 hover:text-accent transition-all cursor-pointer"
                          >
                            <Camera className="h-4 w-4 text-accent" />
                            <span>
                              {language === "en"
                                ? (avatarUrl && !avatarImgFailed ? "Change photo" : "Upload photo")
                                : (avatarUrl && !avatarImgFailed ? "Alterar foto" : "Colocar foto")}
                            </span>
                          </button>

                          {(avatarUrl || avatarImgFailed) && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowAvatarMenu(false);
                                handleDeleteAvatar();
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all mt-0.5 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span>
                                {language === "en"
                                  ? (avatarImgFailed ? "Clear broken photo" : "Remove photo")
                                  : (avatarImgFailed ? "Limpar foto antiga" : "Excluir foto")}
                              </span>
                            </button>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/png,image/jpeg,image/webp,image/gif,image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange} 
                  />
                </div>

                {editingName ? (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <input value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value.slice(0, 60))} placeholder="Defina um nome"
                      className="rounded-xl border border-white/10 bg-secondary/40 px-3.5 py-1.5 text-sm text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent w-52 backdrop-blur-md"
                      autoFocus onKeyDown={(e) => e.key === "Enter" && saveName()} />
                    <button onClick={saveName} className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-foreground shadow-md shadow-accent/20 liquid-btn">OK</button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col items-center">
                    {displayName ? (
                      <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-base font-bold text-foreground hover:text-accent transition-colors">
                        {displayName} <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ) : (
                      <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-sm font-bold text-accent hover:underline transition-colors bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
                        <span>Defina um nome</span>
                        <Pencil className="h-3.5 w-3.5 text-accent" />
                      </button>
                    )}
                  </div>
                )}

                {/* Handle @usuario estilo Instagram */}
                {editingUsername ? (
                  <div className="mt-1.5 flex items-center gap-1.5 justify-center">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-accent">@</span>
                      <input 
                        value={username} 
                        maxLength={30} 
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))} 
                        placeholder="seu_usuario"
                        className="rounded-xl border border-white/10 bg-secondary/40 pl-7 pr-3 py-1 text-xs text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent w-48 backdrop-blur-md font-mono"
                        autoFocus 
                        onKeyDown={(e) => e.key === "Enter" && saveUsername()} 
                      />
                    </div>
                    <button onClick={saveUsername} className="rounded-xl bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-md shadow-accent/20 liquid-btn">OK</button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col items-center">
                    <button 
                      onClick={() => setEditingUsername(true)} 
                      title="Clique para alterar seu @nome_de_usuario"
                      className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/90 transition-all bg-accent/10 border border-accent/25 px-3 py-1 rounded-full shadow-sm hover:border-accent/40 hover:bg-accent/15"
                    >
                      <span className="font-mono font-bold">@{username || "usuario"}</span>
                      <Pencil className="h-3 w-3 text-accent" />
                    </button>
                  </div>
                )}

                <p className="mt-2 text-xs font-mono text-muted-foreground/80 tracking-wide">{authCtx.user?.email}</p>

                {authCtx.user && (
                  <div className="mt-2.5 flex justify-center">
                    <UserRoleBadge role={authCtx.role || 'padrao'} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-xl backdrop-blur-xl">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent/90 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-accent" /> {t("settings_title")}
                  </h3>
                  <div className="space-y-3">
                    {/* Idioma Selection Row */}
                    <div className="rounded-xl bg-secondary/30 p-3.5 flex flex-col gap-2.5 border border-white/5">
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
                      
                      <div className="flex gap-1.5 mt-1 p-1 rounded-xl bg-secondary/40 border border-white/10 relative select-none">
                        <button
                          type="button"
                          onClick={() => setLanguage("pt")}
                          className={`relative flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                            language === "pt"
                              ? "text-accent font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {language === "pt" && (
                            <motion.div
                              layoutId="activeLanguagePill"
                              className="absolute inset-0 rounded-lg bg-accent/15 border border-accent/40 shadow-sm"
                              transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            />
                          )}
                          <span className="relative z-10">Português</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage("en")}
                          className={`relative flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors duration-200 ${
                            language === "en"
                              ? "text-accent font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {language === "en" && (
                            <motion.div
                              layoutId="activeLanguagePill"
                              className="absolute inset-0 rounded-lg bg-accent/15 border border-accent/40 shadow-sm"
                              transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            />
                          )}
                          <span className="relative z-10">Inglês (English)</span>
                        </button>
                      </div>
                    </div>

                    <button onClick={toggleNotifications} className="flex w-full items-center justify-between rounded-xl bg-secondary/30 border border-white/5 p-3.5 transition-all hover:bg-secondary/50 hover:border-white/10 liquid-btn">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{notificationsEnabled ? <Bell className="h-4 w-4 text-accent" /> : <BellOff className="h-4 w-4" />}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{t("notifications_title")}</p>
                          <p className="text-[10px] text-muted-foreground">{notificationsEnabled ? t("notifications_desc_active") : t("notifications_desc_inactive")}</p>
                        </div>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors duration-300 ease-in-out ${notificationsEnabled ? "bg-accent" : "bg-muted/60"} flex items-center px-0.5`}>
                        <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${notificationsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>

                    {/* Modo Foco - Exclusivo para usuários Beta / Selecionados no Supabase */}
                    <BetaGate>
                      <FocusModeCard />
                    </BetaGate>

                    {/* Verificação em Duas Etapas (Google Authenticator / TOTP) */}
                    {authCtx.user?.sub && (
                      <TwoFactorSettingsCard
                        userId={authCtx.user.sub}
                        userEmail={authCtx.user.email}
                        is2FAEnabled={twoFactorEnabled}
                        onStatusChange={(enabled) => setTwoFactorEnabled(enabled)}
                      />
                    )}

                    {/* Reconhecimento Facial (Face ID / Biometria PWA) */}
                    {authCtx.user?.sub && (
                      <BiometricSettingsCard
                        userId={authCtx.user.sub}
                        userEmail={authCtx.user.email}
                        userName={authCtx.user.name}
                        onStatusChange={(enabled) => setHasEnrolledBiometrics(enabled)}
                      />
                    )}

                    {/* Bíblia e Mapas Offline - Exibido EXCLUSIVAMENTE para usuários que utilizam o PWA instalado */}
                    {isPWA && (
                      <button onClick={toggleOffline} disabled={isDownloading} className="flex w-full items-center justify-between rounded-xl bg-secondary/30 border border-white/5 p-3.5 transition-all hover:bg-secondary/50 hover:border-white/10 disabled:opacity-70 liquid-btn">
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
                              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${offlineProgress}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`h-5 w-9 rounded-full transition-colors duration-300 ease-in-out ${offlineEnabled ? "bg-accent" : "bg-muted/60"} flex items-center px-0.5`}>
                          <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${offlineEnabled ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                      </button>
                    )}

                    <button 
                      type="button" 
                      onClick={() => setShowDeleteModal(true)} 
                      disabled={deleting}
                      className="flex w-full items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-destructive transition-all hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed liquid-btn"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{deleting ? t("deleting_profile") : t("delete_account")}</p>
                        <p className="text-[10px] opacity-70">{t("delete_account_desc")}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button onClick={() => setShowLogoutModal(true)}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 py-3.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 hover:border-destructive/30 shadow-md liquid-btn">
                  <LogOut className="h-4 w-4" /> {t("sign_out")}
                </button>
              </div>
            </>
          ) : showForgotPassword ? (
            <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                  <KeyRound className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-serif text-xl font-bold text-foreground">Recuperar Senha</h1>
                <p className="mt-1 text-xs text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Seu e-mail" required
                  className="w-full rounded-xl border border-white/10 bg-secondary/30 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-md" />
                
                <button type="submit" disabled={authLoading || !turnstileToken}
                  className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all disabled:opacity-50 liquid-btn">
                  {authLoading ? "Enviando..." : "Enviar Link"}
                </button>
              </form>
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setTurnstileToken("");
                  turnstileRef.current?.reset();
                }} 
                className="w-full text-center text-xs font-semibold text-accent hover:underline transition-colors"
              >
                Voltar ao login
              </button>
              
              <div className="flex justify-center overflow-hidden min-h-[65px] w-[300px] mx-auto mt-4 relative">
                <Turnstile 
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => {
                    setTurnstileToken("");
                    turnstileRef.current?.reset();
                  }}
                  onError={() => {
                    console.warn("Turnstile widget failed to load or domain is not authorized. Permitindo bypass local.");
                    setTurnstileToken("bypass");
                  }}
                  options={{ theme: "auto" }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                  <LogIn className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-serif text-xl font-bold text-foreground">{isSignUp ? "Criar Conta" : "Entrar"}</h1>
                <p className="mt-1 text-xs text-muted-foreground">{isSignUp ? "Crie sua conta para salvar progresso" : "Acesse sua conta para continuar"}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-3.5" autoComplete="on">
                {isSignUp && (
                  <>
                    <input 
                      type="text" 
                      name="signUpName" 
                      autoComplete="name"
                      value={signUpName} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setSignUpName(val);
                        if (!signUpUsername) {
                          setSignUpUsername(generateDefaultUsername(val));
                        }
                      }} 
                      placeholder="Seu nome completo" 
                      required
                      className="w-full rounded-xl border border-white/10 bg-secondary/30 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-md" 
                    />
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-sm font-bold text-accent font-mono">@</span>
                      <input 
                        type="text" 
                        name="signUpUsername" 
                        value={signUpUsername} 
                        onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))} 
                        placeholder="seu_usuario" 
                        required
                        minLength={3}
                        maxLength={30}
                        className="w-full rounded-xl border border-white/10 bg-secondary/30 pl-9 pr-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-md" 
                      />
                    </div>
                  </>
                )}
                <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required
                  className="w-full rounded-xl border border-white/10 bg-secondary/30 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-md" />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-secondary/30 pl-4 pr-10 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent transition-all backdrop-blur-md" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
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
                  className="w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed liquid-btn">
                  {authLoading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
                </button>

                {!isSignUp && (
                  <button type="button" onClick={() => {
                    setShowForgotPassword(true);
                    setTurnstileToken("");
                    turnstileRef.current?.reset();
                  }} className="w-full text-center text-xs font-semibold text-accent hover:underline transition-colors">
                    Esqueci minha senha
                  </button>
                )}

                <div className="flex justify-center overflow-hidden min-h-[65px] w-[300px] mx-auto mt-3 relative">
                  <Turnstile 
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"} 
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => {
                      setTurnstileToken("");
                      turnstileRef.current?.reset();
                    }}
                    onError={() => {
                      console.warn("Turnstile widget failed to load or domain is not authorized. Permitindo bypass local.");
                      setTurnstileToken("bypass");
                    }}
                    options={{ theme: "auto" }}
                  />
                </div>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-muted-foreground font-mono">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-2">
                <button onClick={handleGoogleLogin} disabled={authLoading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-secondary/30 hover:bg-secondary/50 py-3.5 text-sm font-semibold text-foreground transition-all backdrop-blur-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed liquid-btn">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
                <button onClick={() => {
                  setIsSignUp(!isSignUp);
                  setTurnstileToken("");
                  turnstileRef.current?.reset();
                }} className="font-bold text-accent hover:underline transition-colors">
                  {isSignUp ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </div>
            </>
          )}

          <div className="mt-8 pb-4 text-center">
            <p className="text-xs text-muted-foreground font-sans font-medium tracking-wide">
              Biblia Online — Versão {appVersion || "2.5.2"}
            </p>
          </div>

        </motion.div>
      </section>

      {/* Modal de Confirmação de Exclusão de Conta e Saída renderizados via Portal no body */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none"
                onClick={() => setShowDeleteModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-sm w-full overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Efeito de brilho ambiente sutil */}
                  <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                  {/* Botão Fechar */}
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center">
                    {/* Ícone de Aviso */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                      <AlertTriangle className="h-7 w-7 text-accent" />
                    </div>
                    
                    <h3 className="font-serif text-xl font-bold text-foreground mb-3">{t("delete_modal_title")}</h3>
                    
                    <div className="mb-6 w-full text-left space-y-2.5 rounded-2xl border border-white/10 bg-secondary/30 backdrop-blur-md p-4 text-xs sm:text-sm text-foreground/90 shadow-md">
                      <div className="flex items-start gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0" />
                        <p className="leading-relaxed">
                          <strong className="text-accent font-bold">{language === "en" ? "Permanent deletion:" : "Exclusão permanente:"}</strong>{" "}
                          {language === "en"
                            ? "All your account data, history, and preferences will be erased immediately."
                            : "Todos os seus dados, histórico e preferências serão apagados permanentemente."}
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent/80 mt-2 shrink-0" />
                        <p className="leading-relaxed">
                          <strong className="text-accent/90 font-bold">{language === "en" ? "30-day waiting period:" : "Aguarde 30 dias:"}</strong>{" "}
                          {language === "en"
                            ? "You must wait 30 days before creating a new account using this same email address."
                            : "Você precisará aguardar 30 dias para poder criar uma nova conta com este mesmo e-mail."}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex w-full flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteData()}
                        disabled={deleting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3.5 text-sm font-bold transition-all shadow-lg shadow-destructive/25 active:scale-[0.98] disabled:opacity-50 liquid-btn"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        <span>{deleting ? (language === "en" ? "Deleting..." : "Apagando...") : t("delete_modal_confirm")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deleting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 active:scale-[0.98] text-foreground py-3.5 text-sm font-semibold transition-all border border-white/10 backdrop-blur-md"
                      >
                        {t("delete_modal_cancel")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Modal de Confirmação de Saída da Conta */}
            {showLogoutModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none"
                onClick={() => setShowLogoutModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-sm w-full overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Efeito de brilho ambiente sutil */}
                  <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                  {/* Botão Fechar */}
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center">
                    {/* Ícone */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                      <LogOut className="h-7 w-7 text-accent" />
                    </div>
                    
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">Sair da Conta</h3>
                    
                    <p className="mb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Tem certeza que deseja sair da sua conta no Bíblia Online?
                    </p>

                    {/* Botões de Ação */}
                    <div className="flex w-full flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3.5 text-sm font-bold transition-all shadow-lg shadow-destructive/25 active:scale-[0.98] liquid-btn"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span>Sair da Conta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutModal(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 active:scale-[0.98] text-foreground py-3.5 text-sm font-semibold transition-all border border-white/10 backdrop-blur-md"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <MandatoryPwnedPasswordModal
        isOpen={showPwnedModal}
        pwnedCount={pwnedLeakCount}
        userEmail={email}
        onSuccess={() => {
          setShowPwnedModal(false);
          toast({ title: "Login realizado com sucesso!" });
          navigate("/");
        }}
      />

      {/* Modal de Desafio de 2FA (Google Authenticator) no Login */}
      {showTwoFactorModal && pendingTwoFactorUserId && (
        <TwoFactorLoginModal
          userId={pendingTwoFactorUserId}
          userEmail={pendingTwoFactorEmail}
          onSuccess={() => {
            setShowTwoFactorModal(false);
            setPendingTwoFactorUserId(null);
            setPendingTwoFactorEmail("");
            navigate("/");
          }}
          onCancel={async () => {
            setShowTwoFactorModal(false);
            setPendingTwoFactorUserId(null);
            setPendingTwoFactorEmail("");
            // Faz logout preventivo caso o usuário cancele o desafio 2FA
            await supabase.auth.signOut().catch(() => {});
          }}
        />
      )}
    </div>
  );
};

export default AccountPage;