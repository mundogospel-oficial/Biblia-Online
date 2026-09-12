import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, Puzzle, CheckCircle2, Sparkles } from "lucide-react";

export const AdBlockDetector: React.FC = () => {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isRechecking, setIsRechecking] = useState<boolean>(false);

  // Lock scroll when blocker modal is active to prevent page scrolling
  useEffect(() => {
    if (isBlocked) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isBlocked]);

  // Detect strictly if an ad blocker is actively altering the page
  const checkAdBlock = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    let isAlteringFunctions = false;

    try {
      // Test strictly for ad blocker cosmetic filtering altering DOM elements
      const bait = document.createElement("div");
      bait.className = "adsbox pub_300x250 banner-ad ad-placement";
      bait.setAttribute(
        "style",
        "position: absolute !important; left: -9999px !important; top: -9999px !important; width: 100px !important; height: 100px !important; pointer-events: none !important;"
      );
      document.body.appendChild(bait);

      // Allow extension scripts and cosmetic styles to apply
      await new Promise((resolve) => setTimeout(resolve, 350));

      const style = window.getComputedStyle(bait);
      const isDisplayNone = style.display === "none";
      const isVisibilityHidden = style.visibility === "hidden";
      const isCollapsed = bait.offsetHeight === 0 && bait.offsetWidth === 0;

      if (isDisplayNone || isVisibilityHidden || isCollapsed) {
        isAlteringFunctions = true;
      }

      if (document.body.contains(bait)) {
        document.body.removeChild(bait);
      }
    } catch {
      isAlteringFunctions = false;
    }

    return isAlteringFunctions;
  }, []);

  const runDetection = useCallback(async () => {
    try {
      const detected = await checkAdBlock();
      setIsBlocked(detected);
    } catch {
      // Never throw errors to the app
    }
  }, [checkAdBlock]);

  useEffect(() => {
    // Delay detection after initial page render to avoid false triggers
    const timer = setTimeout(() => {
      runDetection();
    }, 2000);

    return () => clearTimeout(timer);
  }, [runDetection]);

  const handleRecheck = async () => {
    setIsRechecking(true);
    try {
      const detected = await checkAdBlock();
      if (!detected) {
        setIsBlocked(false);
      } else {
        window.location.reload();
      }
    } finally {
      setIsRechecking(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!isBlocked) return null;

  return (
    <AnimatePresence>
      <div
        id="adblock-overlay-barrier"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/95 backdrop-blur-2xl overflow-y-auto select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="w-full max-w-lg glass-card border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center"
        >
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-primary" />
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-serif tracking-tight">
              Experiência Completa do Aplicativo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Detectamos um bloqueador de anúncios ativo interferindo diretamente no funcionamento do aplicativo.
            </p>
          </div>

          {/* Destaque solicitado: Não é por ter anúncios, mas para entregar a experiência completa */}
          <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Garantia de Qualidade e Fluidez</span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              <strong>Este aviso não é sobre o site ter ou não anúncios</strong>, mas sim para <strong>entregar a você a experiência completa</strong>.
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Extensões de bloqueio de anúncios frequentemente bloqueiam scripts vitais da Bíblia Online, como os <strong>mapas bíblicos interativos em satélite</strong>, <strong>fontes sagradas</strong>, <strong>reprodução de áudio dos capítulos</strong> e <strong>respostas da Inteligência Artificial</strong>.
            </p>
          </div>

          {/* Step by step guide */}
          <div className="text-left bg-secondary/40 border border-border/60 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
              <Puzzle className="w-4 h-4 text-primary shrink-0" />
              <span>Como liberar o acesso completo:</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 pl-1">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Abra o ícone da sua extensão de bloqueio (AdBlock, uBlock, etc.) no topo do navegador.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Selecione <strong>"Pausar neste site"</strong> ou adicione a Bíblia Online à lista de permissões.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Clique no botão azul abaixo para <strong>reiniciar a página</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              id="adblock-btn-reload"
              onClick={handleReload}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 transition-all duration-200 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Página
            </button>
            <button
              id="adblock-btn-recheck"
              onClick={handleRecheck}
              disabled={isRechecking}
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-sm font-semibold border border-border/50 transition-all duration-200 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isRechecking ? "Verificando..." : "Verificar Novamente"}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/75">
            Ao pausar o bloqueador para este site e recarregar, o aviso desaparece e todas as funcionalidades estarão 100% liberadas.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
