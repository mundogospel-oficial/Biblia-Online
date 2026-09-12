import React from "react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserRoleBadgeProps {
  role?: string | null;
  className?: string;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role = "padrao",
  className = "",
}) => {
  const { language, t } = useLanguage();
  const isEn = language === "en";

  const cleanRole = (role || "padrao").trim().toLowerCase();
  const isBeta = cleanRole === "beta" || cleanRole === "admin";
  const isNormal = cleanRole === "padrao" || cleanRole === "normal" || cleanRole === "user";

  if (!isBeta && !isNormal) {
    return null;
  }

  const betaLabel = (t("role_beta") || (isEn ? "Beta Account" : "Conta Beta")).toUpperCase();
  const normalLabel = (t("role_standard") || (isEn ? "Normal Account" : "Conta Normal")).toUpperCase();

  if (isBeta) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <div
          id="user-role-badge-beta"
          className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full bg-gradient-to-r from-[#021f19] via-[#02120f] to-[#042c22] border border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)] backdrop-blur-md transition-all hover:border-[#34d399] hover:shadow-[0_0_16px_rgba(16,185,129,0.35)]"
        >
          {/* Ícone de brilho em verde vibrante */}
          <Sparkles className="h-3.5 w-3.5 text-[#34d399] shrink-0" />

          {/* Texto com tradução */}
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#a7f3d0] font-mono leading-none">
            {betaLabel}
          </span>
        </div>
      </div>
    );
  }

  // Selo Roxo para Conta Normal
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <div
        id="user-role-badge-normal"
        className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full bg-gradient-to-r from-[#1c0a36] via-[#100520] to-[#2c0e52] border border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.25)] backdrop-blur-md transition-all hover:border-[#c084fc] hover:shadow-[0_0_16px_rgba(168,85,247,0.35)]"
      >
        {/* Ícone de brilho em lavanda / roxo vibrante */}
        <Sparkles className="h-3.5 w-3.5 text-[#c084fc] shrink-0" />

        {/* Texto com tradução */}
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#e9d5ff] font-mono leading-none">
          {normalLabel}
        </span>
      </div>
    </div>
  );
};

export default UserRoleBadge;
