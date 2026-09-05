import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isAuthRefreshError } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { setupPushNotifications } from "@/services/pushService";
import { syncAllUserDataFromSupabaseOnLogin, deactivatePlansAndSyncOnLogout, clearAllLocalUserData } from "@/services/userSyncService";
import { saveVerifiedRole, getVerifiedRoleFromCache, verifyBetaPermissionWithServer } from "@/services/tamperProtectionService";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
  role?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  login: (userData: GoogleUser) => void;
  logout: () => Promise<void>;
  loading: boolean;
  role: string;
  isBeta: boolean;
  isAdmin: boolean;
  hasAccess: (requiredRole?: string) => boolean;
  refreshRole: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: async () => {},
  loading: true,
  role: 'padrao',
  isBeta: false,
  isAdmin: false,
  hasAccess: () => false,
  refreshRole: async () => 'padrao',
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
      await (navigator as any).credentials.preventSilentAccess().catch(() => {});
    }

    // 2. Limpeza completa dos dados do usuário do localStorage
    clearAllLocalUserData();

    // 3. Encerra a sessão no Supabase globalmente
    await supabase.auth.signOut({ scope: "global" }).catch(() => {
      return supabase.auth.signOut().catch(() => {});
    });

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

const fetchProfileRole = async (userId: string): Promise<string> => {
  if (!userId) return 'padrao';
  try {
    // 1. Consulta autoritativa direta com o Supabase
    const { isAllowed, role: serverRole } = await verifyBetaPermissionWithServer();
    if (serverRole && serverRole !== 'padrao') {
      return serverRole;
    }

    // 2. Se a rede estiver offline temporariamente, valida usando hash criptográfico
    const verifiedCachedRole = await getVerifiedRoleFromCache(userId);
    return verifiedCachedRole;
  } catch {
    return await getVerifiedRoleFromCache(userId);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('padrao');

  const refreshRole = async (): Promise<string> => {
    const current = user || getStoredUser();
    if (current?.sub) {
      const r = await fetchProfileRole(current.sub);
      setRole(r);
      return r;
    }
    setRole('padrao');
    return 'padrao';
  };

  useEffect(() => {
    let isSubscribed = true;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-sync-logout') {
        setUser(null);
        setStoredUser(null);
        setRole('padrao');
        setLoading(false);
      } else if (e.key === BIBLE_USER_KEY) {
        if (!e.newValue) {
          setUser(null);
          setRole('padrao');
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setUser(parsed);
            if (parsed?.sub) {
              getVerifiedRoleFromCache(parsed.sub).then((r) => {
                if (isSubscribed) setRole(r);
              });
            }
          } catch {}
        }
      }
    };
    
    const handleLogoutLocal = () => {
      setUser(null);
      setStoredUser(null);
      setRole('padrao');
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
            setRole('padrao');
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
            fetchProfileRole(session.user.id).then(r => {
              if (isSubscribed) setRole(r);
            });
          } else {
            const localUser = getStoredUser();
            if (!localUser) {
              setUser(null);
              setRole('padrao');
            } else if (localUser.sub) {
              getVerifiedRoleFromCache(localUser.sub).then(r => {
                if (isSubscribed) setRole(r);
              });
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
        fetchProfileRole(session.user.id).then(r => {
          if (isSubscribed) setRole(r);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setStoredUser(null);
        setRole('padrao');
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
      fetchProfileRole(userData.sub).then(r => setRole(r));
    }
  };

  const logout = async () => {
    // 1. Limpa o estado local imediatamente para feedback de UI de 0ms
    setUser(null);
    setStoredUser(null);
    setRole('padrao');
    clearAllLocalUserData();
    window.dispatchEvent(new Event('auth-sync-logout-local'));

    // 2. Executa encerramento de sessão e sincronização em segundo plano
    try {
      deactivatePlansAndSyncOnLogout().catch(console.error);
      await forceSignOut().catch(console.error);
    } catch (err) {
      console.error("Erro no logout em segundo plano:", err);
    }
  };

  const isBeta = role.toLowerCase() === 'beta' || role.toLowerCase() === 'admin';
  const isAdmin = role.toLowerCase() === 'admin';

  const hasAccess = (requiredRole: string = 'beta') => {
    const current = role.toLowerCase();
    const target = requiredRole.toLowerCase();
    if (current === 'admin') return true;
    if (target === 'beta') return current === 'beta' || current === 'admin';
    return current === target;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, role, isBeta, isAdmin, hasAccess, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}
