import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  ShieldCheck, 
  ScanFace,
  KeyRound,
  X, 
  Lock,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  isPWAMode, 
  isBiometricAvailable, 
  isUserBiometricEnrolled, 
  registerBiometricCredential, 
  removeBiometricCredential,
  setAppBiometricLockEnabled,
  setAppSessionUnlocked
} from "@/services/biometricAuthService";
import { useToast } from "@/hooks/use-toast";

interface BiometricSettingsCardProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onStatusChange?: (enabled: boolean) => void;
}

export const BiometricSettingsCard: React.FC<BiometricSettingsCardProps> = ({
  userId,
  userEmail,
  userName,
  onStatusChange,
}) => {
  const [inPWA, setInPWA] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPWAGuideModal, setShowPWAGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const isPwa = isPWAMode();
    setInPWA(isPwa);

    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(checkIOS);

    const enrolled = isUserBiometricEnrolled(userId);
    setIsEnabled(enrolled);
  }, [userId]);

  // Alterna ativação / desativação do Face ID / Touch ID / PIN
  const handleToggleBiometric = async () => {
    if (!inPWA) {
      setShowPWAGuideModal(true);
      return;
    }

    if (isEnabled) {
      // Desativa
      const removed = removeBiometricCredential(userId);
      if (removed) {
        setIsEnabled(false);
        setAppBiometricLockEnabled(false);
        onStatusChange?.(false);
        toast({
          title: "Proteção Desativada",
          description: "O bloqueio por biometria ou PIN foi desativado.",
        });
      }
      return;
    }

    // Ativa
    setLoading(true);
    try {
      const res = await registerBiometricCredential({
        id: userId,
        email: userEmail,
        name: userName,
      });

      const isEnrolledNow = res.success || isUserBiometricEnrolled(userId);

      if (isEnrolledNow) {
        setIsEnabled(true);
        setAppBiometricLockEnabled(true);
        setAppSessionUnlocked(true);
        onStatusChange?.(true);
        toast({
          title: "Proteção do App Ativada!",
          description: "O app solicitará biometria ou PIN toda vez que for aberto.",
        });
      }
    } catch {
      if (isUserBiometricEnrolled(userId)) {
        setIsEnabled(true);
        setAppBiometricLockEnabled(true);
        setAppSessionUnlocked(true);
        onStatusChange?.(true);
        toast({
          title: "Proteção do App Ativada!",
          description: "O app solicitará biometria ou PIN toda vez que for aberto.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão no mesmo tamanho e layout dos outros cards de configuração */}
      <button
        type="button"
        onClick={handleToggleBiometric}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl bg-secondary/30 border border-white/5 p-3.5 transition-all hover:bg-secondary/50 hover:border-white/10 liquid-btn text-left disabled:opacity-70"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground flex items-center">
            {isEnabled ? (
              <ScanFace className="h-4 w-4 text-accent" />
            ) : (
              <ScanFace className="h-4 w-4" />
            )}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              Biometria
            </p>
            <p className="text-[10px] text-muted-foreground">
              {loading
                ? "Configurando..."
                : !inPWA
                ? "Exclusivo no App (PWA) • Toque para ver"
                : isEnabled
                ? "Ativo (solicita biometria/senha ao abrir)"
                : "Desativada"}
            </p>
          </div>
        </div>

        <div
          className={`h-5 w-9 rounded-full transition-colors duration-300 ease-in-out ${
            isEnabled ? "bg-accent" : "bg-muted/60"
          } flex items-center px-0.5 shrink-0`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
              isEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </button>

      {/* Modal de Orientação quando clicado no navegador comum (Web) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showPWAGuideModal && (
              <div 
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none"
                onClick={() => setShowPWAGuideModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-sm w-full overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Brilho ambiente */}
                  <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                  {/* Botão Fechar */}
                  <button
                    type="button"
                    onClick={() => setShowPWAGuideModal(false)}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                    <ScanFace className="h-7 w-7 text-accent" />
                  </div>

                  <h3 className="font-serif text-xl font-bold text-foreground">
                    Biometria e PIN
                  </h3>

                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    O acesso por biometria ou código do celular está disponível <strong>exclusivamente no aplicativo instalado (PWA)</strong>:
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Processamento 100% Local • Zero Envio a Servidores</span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-secondary/30 p-4 text-left space-y-3 text-xs text-foreground/90">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-accent mb-1 pb-2 border-b border-white/5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Usa a segurança nativa do seu aparelho:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-muted-foreground pb-2 border-b border-white/5">
                      <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-secondary/50">
                        <ScanFace className="h-4 w-4 text-accent" />
                        <span>Biometria (Face ID)</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-secondary/50">
                        <KeyRound className="h-4 w-4 text-accent" />
                        <span>PIN / Código</span>
                      </div>
                    </div>

                    {isIOS ? (
                      <>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            1
                          </div>
                          <p className="leading-snug">
                            Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima) no Safari.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            2
                          </div>
                          <p className="leading-snug">
                            Role a lista e selecione <strong>Adicionar à Tela de Início</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            3
                          </div>
                          <p className="leading-snug">
                            Abra o app pela tela inicial para ativar o Face ID / Touch ID / PIN.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            1
                          </div>
                          <p className="leading-snug">
                            Toque no menu do Chrome/navegador (os três pontinhos no topo).
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            2
                          </div>
                          <p className="leading-snug">
                            Selecione <strong>Instalar Aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0 mt-0.5">
                            3
                          </div>
                          <p className="leading-snug">
                            Abra pelo ícone instalado para ativar o login biométrico ou por PIN.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPWAGuideModal(false)}
                    className="mt-5 w-full rounded-xl bg-accent py-3 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all liquid-btn"
                  >
                    Entendido
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
