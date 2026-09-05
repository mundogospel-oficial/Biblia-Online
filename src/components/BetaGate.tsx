import React, { ReactNode } from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";

interface BetaGateProps {
  /** Conteúdo que só será exibido para usuários com a permissão/palavra no Supabase */
  children: ReactNode;
  /** Elemento alternativo a exibir para usuários comuns (opcional, padrão: nada/oculto) */
  fallback?: ReactNode;
  /** Palavra requerida na coluna 'role' do Supabase (padrão: 'beta') */
  requiredRole?: string;
}

/**
 * Componente declarativo para ocultar elementos para usuários comuns e exibir
 * exclusivamente para quem tem a palavra correspondente configurada no Supabase (ex: 'beta').
 *
 * Exemplo de uso:
 * <BetaGate>
 *   <MeuRecursoBeta />
 * </BetaGate>
 */
export const BetaGate: React.FC<BetaGateProps> = ({
  children,
  fallback = null,
  requiredRole = "beta",
}) => {
  const { canAccess } = useFeatureGate();

  if (!canAccess(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default BetaGate;
