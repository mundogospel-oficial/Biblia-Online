import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, RotateCcw, X } from "lucide-react";
import { useFocusMode, formatRemainingTime } from "@/services/focusModeService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useFeatureGate } from "@/hooks/useFeatureGate";

interface FocusModeCardProps {
  compact?: boolean;
}

export const FocusModeCard: React.FC<FocusModeCardProps> = ({ compact = false }) => {
  const { canAccess } = useFeatureGate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const {
    active,
    remainingSeconds,
    durationSeconds,
    toggleFocus,
    renewFocus,
  } = useFocusMode();

  // Oculta 100% o Modo Foco para usuários comuns que não possuam a role beta no Supabase
  if (!canAccess("beta")) {
    return null;
  }

  const handleToggle = async () => {
    if (active) {
      await toggleFocus();
      toast({
        title: "Modo Foco desativado",
        description: "As notificações e avisos normais voltaram a ser exibidos.",
        important: true,
      });
    } else {
      await toggleFocus();
      toast({
        title: "Modo Foco ativado (1 hora)",
        description: "Toasts normais desativados para você focar na Palavra.",
        important: true,
      });
    }
  };

  const handleRenew = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await renewFocus();
    toast({
      title: "Timer renovado",
      description: "Mais 1 hora de leitura focada e sem distrações.",
      important: true,
    });
  };

  const handleTurnOff = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFocus();
    toast({
      title: "Modo Foco desativado",
      description: "As notificações e avisos normais voltaram a ser exibidos.",
      important: true,
    });
  };

  const percent = Math.min(100, Math.max(0, (remainingSeconds / (durationSeconds || 3600)) * 100));

  return (
    <div
      className="rounded-xl bg-secondary/30 border border-white/5 p-3.5 flex flex-col gap-2.5 transition-all hover:bg-secondary/40 hover:border-white/10"
    >
      <div
        onClick={handleToggle}
        className="flex w-full items-center justify-between cursor-pointer select-none"
        role="button"
        tabIndex={0}
        aria-label="Alternar Modo Foco de 1 hora"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            <Sparkles className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
          </span>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{t("focus_title") || "Foco"}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                Beta
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {active
                ? (t("focus_desc_active") || "Ativado — toasts normais silenciados para focar na Palavra")
                : (t("focus_desc_inactive") || "Ative para uma leitura Bíblica mais limpa")}
            </p>
          </div>
        </div>

        <div
          className={`h-5 w-9 rounded-full transition-colors duration-300 ease-in-out ${
            active ? "bg-accent" : "bg-muted/60"
          } flex items-center px-0.5 shrink-0`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
              active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 flex flex-col gap-2.5 pt-2.5 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {t("focus_time_remaining") || "Tempo restante de foco:"}
                </span>
                <span className="font-mono text-xs font-bold text-accent">
                  {formatRemainingTime(remainingSeconds)}
                </span>
              </div>

              {/* Barra de progresso visual do timer de 1h - idêntica ao estilo de progresso do app */}
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={handleRenew}
                  className="flex-1 rounded-xl bg-accent/10 border border-accent/20 py-2 px-3 text-xs font-semibold text-accent hover:bg-accent/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm liquid-btn"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t("focus_renew") || "Renovar 1h"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleTurnOff}
                  className="rounded-xl bg-secondary/40 border border-white/5 hover:border-white/10 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{t("focus_turn_off") || "Desativar"}</span>
                </button>
              </div>

              <div className="rounded-xl bg-secondary/20 border border-white/5 p-2.5 text-[10px] text-muted-foreground leading-relaxed">
                Toasts e avisos normais estão silenciados para dedicação à Palavra. Apenas erros ou avisos importantes serão exibidos.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
