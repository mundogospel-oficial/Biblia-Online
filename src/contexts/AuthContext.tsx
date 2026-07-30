import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isAuthRefreshError } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { setupPushNotifications } from "@/services/pushService";
import { syncAllUserDataFromSupabaseOnLogin, deactivatePlansAndSyncOnLogout, clearAllLocalUserData } from "@/services/userSyncService";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  login: (userData: GoogleUser) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const BIBLE_USER_KEY = "bible-google-user";

const getStoredUser = (): GoogleUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BIBLE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && (parsed.email || parsed.sub)) {
      return parsed as GoogleUser;
    }
  } catch (e) {
    console.error("Erro ao ler dados do usuário do localStorage:", e);
  }
  return null;
};

const setStoredUser = (userData: GoogleUser | null) => {
  if (typeof window === "undefined") return;
  try {
    if (userData) {
      localStorage.setItem(BIBLE_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(BIBLE_USER_KEY);
    }
  } catch (e) {
    console.error("Erro ao salvar dados do usuário no localStorage:", e);
  }
};

const isInvalidName = (name?: string | null) => {
  if (!name || !name.trim()) return true;
  const clean = name.trim().toLowerCase();
  return clean.includes("@") || clean.includes("gmail") || clean.includes("outlook");
};

function mapSupabaseUser(su: SupaUser): GoogleUser {
  const meta = su.user_metadata || {};
  
  const candidates = [
    meta.display_name,
    meta.full_name,
    meta.name,
  ];

  const validName = candidates.find(n => typeof n === "string" && !isInvalidName(n)) || "";

  return {
    name: validName,
    email: su.email || meta.email || "",
    picture: meta.avatar_url || meta.picture || "",
    sub: su.id,
  };
}

export const forceSignOut = async () => {
  try {
    // 1. Previne reautenticação automática do navegador (Credential Manager API)
    if (typeof window !== "undefined" && (navigator as any).credentials?.preventSilentAccess) {
      try {
        await (navigator as any).credentials.preventSilentAccess();
      } catch {}
    }

    // 2. Limpeza completa dos dados do usuário do localStorage
    clearAllLocalUserData();

    // 3. Encerra a sessão no Supabase globalmente
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      try {
        await supabase.auth.signOut();
      } catch {}
    }

    // 4. Limpeza manual agressiva de TODOS os tokens e chaves do Supabase no localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase.auth') || 
        key.includes('user_') ||
        key === 'bible-google-user'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 5. Limpa sessionStorage
    try { sessionStorage.clear(); } catch {}

    // 6. Notifica outras abas e componentes locais sobre o deslogamento
    localStorage.setItem('auth-sync-logout', Date.now().toString());
    window.dispatchEvent(new Event('auth-sync-logout-local'));

    console.log("Limpeza profunda e completa de sessão realizada.");
  } catch (err) {
    console.error("Erro durante a limpeza de sessão:", err);
  }
};

/**
 * Centrally handles auth errors, specifically "Invalid Refresh Token"
 */
export const handleAuthError = async (error: any): Promise<boolean> => {
  if (!error) return false;
  
  if (isAuthRefreshError(error)) {
    console.warn("Auth error detected, cleaning up session...");
    await forceSignOut();
    return true;
  }
  return false;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-sync-logout') {
        setUser(null);
        setStoredUser(null);
        setLoading(false);
      } else if (e.key === BIBLE_USER_KEY) {
        if (!e.newValue) {
          setUser(null);
        } else {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {}
        }
      }
    };
    
    const handleLogoutLocal = () => {
      setUser(null);
      setStoredUser(null);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-sync-logout-local', handleLogoutLocal);

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          const wasCleaned = await handleAuthError(error);
          if (wasCleaned && isSubscribed) {
            setUser(null);
            setStoredUser(null);
            setLoading(false);
            return;
          }
          if (error.message?.includes("Failed to fetch")) {
            console.warn("Sem conexão para verificar sessão.");
          }
        }

        if (isSubscribed) {
          if (session?.user) {
            const mapped = mapSupabaseUser(session.user);
            setUser(mapped);
            setStoredUser(mapped);
            setupPushNotifications(session.user.id);
            syncAllUserDataFromSupabaseOnLogin().catch(console.error);
          } else {
            const localUser = getStoredUser();
            if (!localUser) {
              setUser(null);
            }
          }
        }
      } catch (err) {
        await handleAuthError(err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setUser(mapped);
        setStoredUser(mapped);
        syncAllUserDataFromSupabaseOnLogin().catch(console.error);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setStoredUser(null);
      }
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-sync-logout-local', handleLogoutLocal);
    };
  }, []);

  const login = (userData: GoogleUser) => {
    setUser(userData);
    setStoredUser(userData);
    if (userData.sub) {
      setupPushNotifications(userData.sub);
    }
  };

  const logout = async () => {
    // 1. Limpa o estado local imediatamente para feedback de UI de 0ms
    setUser(null);
    setStoredUser(null);
    clearAllLocalUserData();
    window.dispatchEvent(new Event('auth-sync-logout-local'));

    // 2. Executa encerramento de sessão e sincronização em segundo plano usando try/catch/finally
    try {
      try {
        await deactivatePlansAndSyncOnLogout();
      } catch (syncErr) {
        console.error("Erro na sincronização de logout:", syncErr);
      }

      await forceSignOut();
    } catch (err) {
      console.error("Erro durante o encerramento da sessão:", err);
    } finally {
      setUser(null);
      setStoredUser(null);
      clearAllLocalUserData();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
