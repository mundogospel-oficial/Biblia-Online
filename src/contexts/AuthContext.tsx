import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialSessionChecked = false;

    // Clean up legacy localStorage auth data
    localStorage.removeItem("bible-google-user");

    // 1. Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setUser(mapped);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      if (initialSessionChecked) {
        setLoading(false);
      }
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      initialSessionChecked = true;
      if (error) {
        console.warn("Erro ao recuperar sessão inicial:", error.message);
        if (error.message.includes("Failed to fetch")) {
          // Offline ou bloqueado por CSP/Rede
          console.error("Erro de conexão com o Supabase. Verifique sua internet.");
        } else if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_grant")) {
          // Limpa tokens inválidos para evitar loops de erro
          supabase.auth.signOut().catch(() => {});
          setUser(null);
        }
      }
      if (session?.user) {
        const mapped = mapSupabaseUser(session.user);
        setUser(mapped);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Erro crítico na sessão do Supabase:", err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // login kept for interface compatibility but is a no-op;
  // auth state is driven exclusively by Supabase session
  const login = (_userData: GoogleUser) => {};

  const logout = async () => {
    setUser(null);
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
