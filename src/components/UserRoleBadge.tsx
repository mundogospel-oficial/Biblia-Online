import React from "react";
import { Sparkles, Crown, ShieldCheck } from "lucide-react";

interface UserRoleBadgeProps {
  role?: string | null;
  className?: string;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role = "padrao",
  className = "",
}) => {
  const cleanRole = (role || "").trim().toLowerCase();

  // Não exibe nada para o papel comum 'padrao' ou vazio
  if (!cleanRole || cleanRole === "padrao") {
    return null;
  }

  const isAdmin = cleanRole === "admin";
  const isBeta = cleanRole === "beta";

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {isAdmin ? (
        /* Selo Administrador */
        <div
          id="user-role-badge-admin"
          className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-950/80 via-zinc-900/90 to-amber-950/80 border border-amber-400/40 shadow-[0_2px_14px_rgba(245,158,11,0.22)] backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          </span>
          <Crown className="h-3.5 w-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 font-mono">
            Conta Administrador
          </span>
        </div>
      ) : isBeta ? (
        /* Selo Conta Beta Premium Esmeralda / Neon Obsidian */
        <div
          id="user-role-badge-beta"
          className="relative flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-950/85 via-zinc-900/90 to-emerald-950/85 border border-emerald-400/40 shadow-[0_2px_14px_rgba(16,185,129,0.22)] backdrop-blur-md transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-100 font-mono">
            Conta Beta
          </span>
        </div>
      ) : (
        /* Outro papel especial */
        <div
          id="user-role-badge-custom"
          className="relative flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-950/85 via-zinc-900/90 to-purple-950/85 border border-indigo-400/40 shadow-[0_2px_14px_rgba(99,102,241,0.22)] backdrop-blur-md"
        >
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-200 font-mono capitalize">
            {cleanRole}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserRoleBadge;
