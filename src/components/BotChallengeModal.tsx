import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Bot, CheckCircle2, ArrowRight } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

interface BotChallengeModalProps {
  isOpen: boolean;
  onVerified: (token: string) => void;
}

export const BotChallengeModal: React.FC<BotChallengeModalProps> = ({
  isOpen,
  onVerified,
}) => {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const turnstileRef = useRef<any>(null);

  const handleSuccess = (token: string) => {
    setTurnstileToken(token);
    setIsVerifying(true);

    // Pequeno delay visual para proporcionar feedback satisfatório ao usuário
    setTimeout(() => {
      setVerifiedSuccess(true);
      setTimeout(() => {
        setIsVerifying(false);
        setVerifiedSuccess(false);
        setTurnstileToken("");
        turnstileRef.current?.reset();
        onVerified(token);
      }, 700);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop escuro e desfocado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Card com efeito glass idêntico ao da página de Conta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[440px] rounded-3xl bg-[#0a1120]/95 border border-sky-500/25 p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden backdrop-blur-xl"
        >
          {/* Luz de fundo sutil */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          {/* Ícone de Destaque */}
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/10">
            {verifiedSuccess ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-400 transition-all duration-300 animate-in zoom-in-75" />
            ) : (
              <Bot className="h-9 w-9 text-sky-400 stroke-[2.2]" />
            )}
          </div>

          {/* Título */}
          <h2 className="font-serif text-2xl font-bold tracking-tight text-white mb-2">
            {verifiedSuccess ? "Humano Verificado!" : "Verificação de Segurança"}
          </h2>

          {/* Descrição clara sobre o bloqueio de bot */}
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-normal px-2 mb-5">
            {verifiedSuccess
              ? "Identidade confirmada com sucesso. Liberando seu acesso à Bíblia Online..."
              : "Detectamos atividade automatizada ou incomum (bloqueio temporário de bot). Conclua a verificação rápida da Cloudflare abaixo para remover o bloqueio e continuar:"}
          </p>

          {/* Widget da Cloudflare Turnstile idêntico ao da página de Conta */}
          <div className="flex flex-col items-center justify-center min-h-[75px] w-full max-w-[340px] mx-auto rounded-xl border border-slate-800 bg-[#121927]/90 p-3 shadow-inner relative overflow-hidden mb-4">
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={handleSuccess}
              onExpire={() => {
                setTurnstileToken("");
                turnstileRef.current?.reset();
              }}
              onError={() => {
                console.warn("[Turnstile] Falha ao carregar widget ou domínio não autorizado. Permitindo bypass.");
                handleSuccess("bypass");
              }}
              options={{ theme: "dark" }}
            />
          </div>

          {/* Botão de ação manual se o token já estiver preenchido */}
          {turnstileToken && !verifiedSuccess && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onVerified(turnstileToken)}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-accent text-white font-semibold py-2.5 px-4 text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer mt-2"
            >
              <span>Liberar Acesso e Remover Bloqueio</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          )}

          {/* Rodapé informativo */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Proteção contra bots Cloudflare &middot; Bíblia Online</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BotChallengeModal;
