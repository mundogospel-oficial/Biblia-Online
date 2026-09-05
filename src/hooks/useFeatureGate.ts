import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para controle de liberação de funcionalidades (Feature Gates / Beta Flags).
 * Permite que componentes verifiquem de forma simples e reativa se o usuário
 * logado possui a permissão/role necessária (ex: 'beta', 'admin', ou outra palavra definida no Supabase).
 */
export function useFeatureGate() {
  const { role, isBeta, isAdmin, hasAccess, refreshRole, user } = useAuth();

  return {
    /** Papel/palavra atual do usuário (ex: 'padrao', 'beta', 'admin') */
    role,
    /** Verdadeiro se o usuário for 'beta' ou 'admin' */
    isBeta,
    /** Verdadeiro se o usuário for 'admin' */
    isAdmin,
    /** Função utilitária para checar uma palavra específica ou 'beta' por padrão */
    canAccess: (requiredRole: string = 'beta') => hasAccess(requiredRole),
    /** Atualiza o papel do usuário consultando o Supabase novamente */
    refreshRole,
    /** Indica se há um usuário autenticado */
    isAuthenticated: !!user,
  };
}
