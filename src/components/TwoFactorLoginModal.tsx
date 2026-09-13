import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, AlertCircle, ArrowRight, X } from "lucide-react";
import { validateLoginTwoFactor } from "@/services/twoFactorService";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorLoginModalProps {
  userId: string;
  userEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorLoginModal: React.FC<TwoFactorLoginModalProps> = ({
  userId,
  userEmail,
  onSuccess,
  onCancel,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBackupMode, setIsBackupMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    inputRef.current?.focus();
  }, [isBackupMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Tenta validação via API backend segura primeiro
      const apiRes = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: cleanCode }),
      }).catch(() => null);

      if (apiRes && apiRes.ok) {
        const json = await apiRes.json();
        if (json.valid) {
          toast({
            title: "Verificação concluída! 🛡️",
            description: "Acesso autorizado com sucesso.",
          });
          onSuccess();
          return;
        }
      }

      // 2. Fallback de validação local / supabase direto caso o backend esteja em proxy
      const clientValidation = await validateLoginTwoFactor(userId, cleanCode);
      if (clientValidation.success) {
        toast({
          title: "Verificação concluída! 🛡️",
          description: "Acesso autorizado com sucesso.",
        });
        onSuccess();
        return;
      }

      setErrorMessage(clientValidation.error || "Código do autenticador inválido ou expirado. Tente novamente.");
    } catch (err: any) {
      console.error("[2FA Login Modal] Erro:", err);
      setErrorMessage("Erro ao validar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-center"
      >
        {/* Brilho ambiente sutil */}
        <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
          <ShieldCheck className="h-7 w-7 text-accent" />
        </div>

        <h3 className="relative font-serif text-xl font-bold text-foreground">
          Verificação em 2 Etapas
        </h3>

        <p className="relative mt-1 text-xs text-muted-foreground leading-relaxed">
          {isBackupMode ? (
            <>Digite um dos seus <strong>códigos de recuperação (backup)</strong> para entrar na conta:</>
          ) : (
            <>Abra o <strong>Google Authenticator</strong> e digite o código de 6 dígitos gerado para <strong>{userEmail}</strong>:</>
          )}
        </p>

        <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
          <div className="space-y-1">
            {isBackupMode ? (
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="ABCD-1234"
                className="w-full text-center text-lg font-mono tracking-widest font-bold rounded-xl border border-white/10 bg-secondary/40 py-3.5 text-foreground placeholder:text-muted-foreground/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all uppercase"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-[0.4em] font-bold rounded-xl border border-white/10 bg-secondary/40 py-3.5 text-foreground placeholder:text-muted-foreground/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
              />
            )}
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || (!isBackupMode && code.length !== 6)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all liquid-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando..." : "Confirmar e Entrar"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setIsBackupMode(!isBackupMode);
                setCode("");
                setErrorMessage(null);
              }}
              className="text-xs text-accent hover:underline font-medium transition-colors"
            >
              {isBackupMode ? "← Usar código do Google Authenticator" : "Não está com o celular? Usar código de backup"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};
