import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Unlock, 
  AlertCircle, 
  Fingerprint, 
  KeyRound, 
  LogOut
} from "lucide-react";
import { 
  isPWAMode, 
  isAppBiometricLockEnabled, 
  isAppSessionUnlocked, 
  setAppSessionUnlocked, 
  authenticateWithBiometric,
  getEnrolledBiometricUsers
} from "@/services/biometricAuthService";
import { forceSignOut } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Ícone vetorial idêntico ao oficial do Apple Face ID
const AppleFaceIdIcon: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Cantos de enquadramento suaves */}
    <path d="M7 3.5H5a2 2 0 0 0-2 2v2" strokeWidth="2.1" />
    <path d="M17 3.5h2a2 2 0 0 1 2 2v2" strokeWidth="2.1" />
    <path d="M3 16.5v2a2 2 0 0 0 2 2h2" strokeWidth="2.1" />
    <path d="M21 16.5v2a2 2 0 0 1-2 2h-2" strokeWidth="2.1" />
    {/* Olhos em pílula verticais oficiais */}
    <line x1="8.8" y1="8.5" x2="8.8" y2="10.2" strokeWidth="2.4" />
    <line x1="15.2" y1="8.5" x2="15.2" y2="10.2" strokeWidth="2.4" />
    {/* Nariz angular clássico do Face ID */}
    <path d="M12 8.8v4.2h1.6" strokeWidth="1.9" />
    {/* Boca / Curva de sorriso do Face ID */}
    <path d="M8.2 16.2c1.2 1.3 2.5 1.8 3.8 1.8s2.6-.5 3.8-1.8" strokeWidth="1.9" />
  </svg>
);

export const BiometricAppLockOverlay: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrolledUser, setEnrolledUser] = useState<{ email: string; name: string } | null>(null);
  const { toast } = useToast();

  const checkLockState = useCallback(() => {
    if (!isPWAMode()) {
      setIsLocked(false);
      return;
    }

    const lockEnabled = isAppBiometricLockEnabled();
    const sessionUnlocked = isAppSessionUnlocked();

    if (lockEnabled && !sessionUnlocked) {
      setIsLocked(true);
      const users = getEnrolledBiometricUsers();
      if (users.length > 0) {
        setEnrolledUser({
          email: users[users.length - 1].email,
          name: users[users.length - 1].name,
        });
      }
    } else {
      setIsLocked(false);
    }
  }, []);

  // Executa autenticação biométrica / Face ID / Touch ID / PIN
  const handleUnlock = useCallback(async (isAuto = false) => {
    setAuthenticating(true);
    setAuthError(null);

    try {
      const res = await authenticateWithBiometric();

      if (res.success) {
        setIsSuccess(true);
        setAppSessionUnlocked(true);
        
        setTimeout(() => {
          setIsLocked(false);
          setIsSuccess(false);
          setAuthenticating(false);
        }, 600);
      } else {
        setAuthenticating(false);
        if (!isAuto) {
          setAuthError(res.error || "Autenticação biométrica não concluída.");
        }
      }
    } catch (err: any) {
      setAuthenticating(false);
      if (!isAuto) {
        setAuthError(err?.message || "Erro ao autenticar no dispositivo.");
      }
    }
  }, []);

  // Inicialização e disparo automático na abertura do PWA
  useEffect(() => {
    checkLockState();

    if (isPWAMode() && isAppBiometricLockEnabled() && !isAppSessionUnlocked()) {
      setIsLocked(true);
      // Dispara o prompt biométrico nativo automaticamente
      const timer = setTimeout(() => {
        handleUnlock(true);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [checkLockState, handleUnlock]);

  // Re-bloqueia quando o aplicativo volta do segundo plano após inatividade
  useEffect(() => {
    let backgroundTime = 0;

    const handleVisibilityChange = () => {
      if (!isPWAMode() || !isAppBiometricLockEnabled()) return;

      if (document.hidden) {
        backgroundTime = Date.now();
      } else {
        // Se ficou em segundo plano por mais de 30 segundos, exige biometria novamente
        const timeInBackground = Date.now() - backgroundTime;
        if (backgroundTime > 0 && timeInBackground > 30000) {
          setAppSessionUnlocked(false);
          setIsLocked(true);
          handleUnlock(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleUnlock]);

  // Opção para trocar de conta / desbloquear manualmente
  const handleSwitchAccount = async () => {
    setAppSessionUnlocked(true);
    setIsLocked(false);
    await forceSignOut();
    toast({
      title: "Sessão Encerrada",
      description: "Você pode entrar com outra conta ou senha.",
    });
  };

  if (!isLocked) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[999999] flex flex-col items-center justify-between bg-background/95 p-6 backdrop-blur-2xl select-none"
      >
        {/* Efeitos visuais de fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        {/* Topo: Identidade do App */}
        <div className="pt-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <img 
              src="/icons/logo2.png" 
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.tried) {
                  target.dataset.tried = "1";
                  target.src = "/logo2.png";
                } else if (target.dataset.tried === "1") {
                  target.dataset.tried = "2";
                  target.src = "/icons/logo3.png";
                }
              }}
              alt="Biblia Online" 
              draggable={false}
              className="h-8 w-8 rounded-xl object-contain shadow-md shrink-0 select-none" 
            />
            <span className="font-serif font-bold text-lg text-foreground tracking-tight">
              Biblia Online
            </span>
          </div>
        </div>

        {/* Centro: Card de Desbloqueio */}
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-xs flex flex-col items-center text-center space-y-5"
        >
          {/* Ícone Pulsante de Biometria */}
          <button
            type="button"
            onClick={() => handleUnlock(false)}
            disabled={authenticating}
            className={`relative group flex h-24 w-24 items-center justify-center rounded-3xl border transition-all duration-300 shadow-2xl ${
              isSuccess
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-105"
                : authenticating
                ? "bg-accent/20 border-accent/60 text-accent animate-pulse"
                : "bg-secondary/40 border-white/10 text-accent hover:bg-secondary/70 hover:scale-105 active:scale-95"
            }`}
          >
            <div className="absolute inset-0 rounded-3xl bg-accent/10 blur-xl group-hover:bg-accent/20 transition-all pointer-events-none" />
            
            {isSuccess ? (
              <Unlock className="h-10 w-10 text-emerald-400" />
            ) : (
              <AppleFaceIdIcon className="h-11 w-11 text-accent transition-transform group-hover:scale-110" />
            )}
          </button>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground font-serif">
              {isSuccess
                ? "Desbloqueado!"
                : authenticating
                ? "Aguardando Leitura..."
                : "Aplicativo Bloqueado"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
              Confirme seu Face ID, Touch ID ou Código para continuar.
            </p>
          </div>

          {authError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs text-left max-w-xs animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* Botão Principal de Desbloqueio */}
          <button
            type="button"
            onClick={() => handleUnlock(false)}
            disabled={authenticating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 px-4 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 active:scale-[0.98] transition-all liquid-btn disabled:opacity-50"
          >
            <AppleFaceIdIcon className="h-4 w-4 shrink-0" />
            <span>{authenticating ? "Lendo Biometria / Código..." : "Desbloquear com Face ID / Biometria"}</span>
          </button>
        </motion.div>

        {/* Rodapé: Alternativas */}
        <div className="pb-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Fingerprint className="h-3.5 w-3.5 text-accent/80" /> Touch ID
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <AppleFaceIdIcon className="h-3.5 w-3.5 text-accent/80" /> Face ID
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5 text-accent/80" /> Código
            </span>
          </div>

          <button
            type="button"
            onClick={handleSwitchAccount}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Entrar com outra conta</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
