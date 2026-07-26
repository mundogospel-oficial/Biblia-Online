import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isAuthRefreshError } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { setupPushNotifications } from "@/services/pushService";
import { syncAllUserDataFromSupabaseOnLogin, deactivatePlansAndSyncOnLogout } from "@/services/userSyncService";

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  login: (userData: GoogleUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

function mapSupabaseUser(su: SupaUser): GoogleUser {
  const meta = su.user_metadata || {};
  return {
    name: meta.full_name || meta.name || meta.display_name || su.email || "",
    email: su.email || meta.email || "",
    picture: meta.avatar_url || meta.picture || "",
    sub: su.id,
  };
}

export const forceSignOut = async () => {
  try {
    localStorage.removeItem("bible-google-user");

    // 1. Tenta signOut suave
    await supabase.auth.signOut().catch(() => {});

    // 2. Limpeza manual agressiva de TODOS os tokens do Supabase
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 3. Notifica outras abas sobre a limpeza
    localStorage.setItem('auth-sync-logout', Date.now().toString());

    console.log("Limpeza profunda de sessão concluída.");
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
