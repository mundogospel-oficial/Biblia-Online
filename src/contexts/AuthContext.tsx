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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-sync-logout') {
        setUser(null);
        setLoading(false);
      }
    };
    
    const handleLogoutLocal = () => {
      setUser(null);
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
            setLoading(false);
            return;
          }
          if (error.message.includes("Failed to fetch")) {
            console.warn("Sem conexão para verificar sessão.");
          }
        }

        if (isSubscribed && session?.user) {
          setUser(mapSupabaseUser(session.user));
          setupPushNotifications(session.user.id);
          syncAllUserDataFromSupabaseOnLogin().catch(console.error);
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
        setUser(mapSupabaseUser(session.user));
        syncAllUserDataFromSupabaseOnLogin().catch(console.error);
      } else {
        // Se houve erro no refresh silencioso disparado pelo Supabase, o session virá nulo
        // e o evento pode não ser SIGNED_OUT se for um erro de rede/token
        if (!session) setUser(null);
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

  // login kept for interface compatibility but is a no-op;
  // auth state is driven exclusively by Supabase session
  const login = (_userData: GoogleUser) => {};

  const logout = async () => {
    // Desativa planos de leitura e sincroniza dados antes de deslogar
    await deactivatePlansAndSyncOnLogout().catch(console.error);
    setUser(null);
    await forceSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
