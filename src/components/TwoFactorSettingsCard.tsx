import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Copy, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  generateTwoFactorSetup,
  enableTwoFactorForUser,
  disableTwoFactorForUser,
  TwoFactorSetupData,
} from "@/services/twoFactorService";

interface TwoFactorSettingsCardProps {
  userId: string;
  userEmail: string;
  is2FAEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export const TwoFactorSettingsCard: React.FC<TwoFactorSettingsCardProps> = ({
  userId,
  userEmail,
  is2FAEnabled,
  onStatusChange,
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [step, setStep] = useState<"qr" | "backup" | "verify">("qr");

  // Inicia o processo de configuração do Google Authenticator
  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const data = await generateTwoFactorSetup(userEmail);
      setSetupData(data);
      setVerificationCode("");
      setStep("qr");
      setShowSetupModal(true);
    } catch (err: any) {
      console.error("Erro ao gerar QR Code:", err);
      toast({
        title: language === "en" ? "Error generating QR Code" : "Erro ao gerar QR Code",
        description: language === "en" ? "Could not start 2FA setup at this time." : "Não foi possível iniciar a configuração do 2FA no momento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copia a chave manual (secret)
  const handleCopySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    toast({
      title: t("two_factor_key_copied"),
      description: language === "en" ? "Secret key copied to clipboard." : "Código secreto copiado para a área de transferência.",
    });
  };

  // Copia os códigos de backup
  const handleCopyBackupCodes = () => {
    if (!setupData) return;
    const header = language === "en" ? "RECOVERY BACKUP CODES - BIBLIA ONLINE (2FA):" : "CÓDIGOS DE RECUPERAÇÃO - BÍBLIA ONLINE (2FA):";
    const footer = language === "en" ? "Keep these codes in a safe place. Each code can only be used once." : "Guarde estes códigos em local seguro. Cada código só pode ser usado 1 vez.";
    const text = `${header}\n\n${setupData.backupCodes.join("\n")}\n\n${footer}`;
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
    toast({
      title: t("two_factor_codes_copied"),
      description: language === "en" ? "Save them in a safe place." : "Salve-os em um local seguro.",
    });
  };

  // Confirma o primeiro código e ativa o 2FA
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !verificationCode.trim()) return;

    setLoading(true);
    const result = await enableTwoFactorForUser(
      userId,
      setupData.secret,
      setupData.backupCodes,
      verificationCode.trim()
    );

    setLoading(false);

    if (!result.success) {
      toast({
        title: language === "en" ? "Verification Failed" : "Falha na verificação",
        description: result.error || (language === "en" ? "The code entered does not match Google Authenticator." : "O código digitado não confere com o Google Authenticator."),
        variant: "destructive",
      });
      return;
    }

    onStatusChange(true);
    setShowSetupModal(false);
    setSetupData(null);
    setVerificationCode("");
    toast({
      title: language === "en" ? "2FA Enabled Successfully! 🛡️" : "2FA Ativado com Sucesso! 🛡️",
      description: language === "en" ? "Your account is now protected with Google Authenticator Two-Factor Verification." : "Sua conta agora está protegida com a Verificação em Duas Etapas do Google Authenticator.",
    });
  };

  // Desativa o 2FA
  const handleConfirmDisable = async () => {
    setLoading(true);
    const result = await disableTwoFactorForUser(userId);
    setLoading(false);

    if (!result.success) {
      toast({
        title: language === "en" ? "Error Disabling" : "Erro ao desativar",
        description: result.error || (language === "en" ? "Could not disable 2-step verification." : "Não foi possível desativar a verificação em 2 etapas."),
        variant: "destructive",
      });
      return;
    }

    onStatusChange(false);
    setShowDisableModal(false);
    toast({
      title: language === "en" ? "2FA Disabled" : "2FA Desativado",
      description: language === "en" ? "Two-factor verification has been disabled from your account." : "A verificação em 2 etapas foi desativada da sua conta.",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (is2FAEnabled) {
            setShowDisableModal(true);
          } else {
            handleStartSetup();
          }
        }}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-xl bg-secondary/30 border border-white/5 p-3.5 transition-all hover:bg-secondary/50 hover:border-white/10 liquid-btn text-left disabled:opacity-70"
      >
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {is2FAEnabled ? (
              <ShieldCheck className="h-4 w-4 text-accent" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">{t("two_factor_title")}</p>
            <p className="text-[10px] text-muted-foreground">
              {loading
                ? t("two_factor_loading")
                : is2FAEnabled
                ? t("two_factor_active")
                : t("two_factor_inactive")}
            </p>
          </div>
        </div>

        <div
          className={`h-5 w-9 rounded-full transition-colors duration-300 ease-in-out ${
            is2FAEnabled ? "bg-accent" : "bg-muted/60"
          } flex items-center px-0.5 shrink-0`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
              is2FAEnabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </button>

      {/* Modal de Configuração do Google Authenticator e Desativação renderizados via Portal no body para cobrir 100% da tela */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showSetupModal && setupData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto select-none"
                onClick={() => setShowSetupModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl my-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Brilho ambiente sutil */}
                  <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => setShowSetupModal(false)}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title={t("cancel")}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative text-center mb-5">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-lg shadow-accent/10">
                      <ShieldCheck className="h-7 w-7 text-accent" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {t("two_factor_setup_title")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "en" ? "Protect your account with Two-Factor Verification (TOTP)" : "Proteja sua conta com a Verificação em Duas Etapas (TOTP)"}
                    </p>
                  </div>

                  {/* Barra de Progresso dos Passos */}
                  <div className="relative flex items-center justify-between mb-5 px-4 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStep("qr")}
                      className={`flex items-center gap-1.5 transition-colors ${
                        step === "qr" ? "text-accent font-bold" : "text-muted-foreground"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/80 border border-white/5 text-[11px]">1</span>
                      QR Code
                    </button>
                    <div className="h-px w-8 bg-white/10" />
                    <button
                      type="button"
                      onClick={() => setStep("backup")}
                      className={`flex items-center gap-1.5 transition-colors ${
                        step === "backup" ? "text-accent font-bold" : "text-muted-foreground"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/80 border border-white/5 text-[11px]">2</span>
                      {language === "en" ? "Backup" : "Recuperação"}
                    </button>
                    <div className="h-px w-8 bg-white/10" />
                    <button
                      type="button"
                      onClick={() => setStep("verify")}
                      className={`flex items-center gap-1.5 transition-colors ${
                        step === "verify" ? "text-accent font-bold" : "text-muted-foreground"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/80 border border-white/5 text-[11px]">3</span>
                      {language === "en" ? "Confirm" : "Confirmar"}
                    </button>
                  </div>

                  {/* Passo 1: QR Code */}
                  {step === "qr" && (
                    <div className="relative space-y-4 text-center animate-fadeIn">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("two_factor_step_1_desc")}
                      </p>

                      <div className="mx-auto inline-block p-3.5 rounded-2xl bg-white shadow-xl">
                        <img
                          src={setupData.qrCodeDataUrl}
                          alt="QR Code Google Authenticator"
                          className="h-44 w-44 rounded-lg object-contain mx-auto"
                        />
                      </div>

                      <div className="rounded-2xl bg-secondary/30 border border-white/10 p-3.5 text-left">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          {t("two_factor_cant_scan")}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono font-bold text-accent break-all select-all">
                            {setupData.secret}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="flex shrink-0 items-center gap-1 rounded-xl bg-secondary/80 border border-white/10 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-all"
                          >
                            {copiedKey ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span className="text-[10px]">{copiedKey ? (language === "en" ? "Copied" : "Copiado") : t("two_factor_copy_key")}</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep("backup")}
                        className="w-full rounded-xl bg-accent py-3.5 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all liquid-btn"
                      >
                        {language === "en" ? "Next: Backup Codes →" : "Próximo: Códigos de Recuperação →"}
                      </button>
                    </div>
                  )}

                  {/* Passo 2: Códigos de Recuperação (Backup) */}
                  {step === "backup" && (
                    <div className="relative space-y-4 animate-fadeIn">
                      <div className="rounded-2xl bg-accent/10 border border-accent/20 p-3.5 text-xs text-foreground flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {t("two_factor_step_2_desc")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-secondary/30 border border-white/10 font-mono text-center">
                        {setupData.backupCodes.map((code, idx) => (
                          <div key={idx} className="rounded-xl bg-background/80 py-2 px-2 text-xs font-bold text-foreground border border-white/5">
                            {code}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyBackupCodes}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-white/10 py-3 text-xs font-semibold text-foreground transition-all"
                      >
                        {copiedCodes ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        {copiedCodes
                          ? (language === "en" ? "Codes Copied Successfully!" : "Códigos Copiados com Sucesso!")
                          : t("two_factor_copy_codes")}
                      </button>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setStep("qr")}
                          className="w-1/3 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-white/10 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                        >
                          ← {language === "en" ? "Back" : "Voltar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep("verify")}
                          className="w-2/3 rounded-xl bg-accent py-3 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all liquid-btn"
                        >
                          {language === "en" ? "Next: Confirm →" : "Próximo: Confirmar →"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Passo 3: Confirmação e Ativação */}
                  {step === "verify" && (
                    <form onSubmit={handleConfirmVerification} className="relative space-y-4 animate-fadeIn">
                      <p className="text-xs text-muted-foreground leading-relaxed text-center">
                        {t("two_factor_step_3_desc")}
                      </p>

                      <div className="space-y-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoFocus
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          className="w-full text-center text-2xl font-mono tracking-[0.4em] font-bold rounded-xl border border-white/10 bg-secondary/40 py-3.5 text-foreground placeholder:text-muted-foreground/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        <p className="text-[10px] text-muted-foreground text-center">
                          {language === "en" ? "The code expires and changes every 30 seconds" : "O código expira e muda a cada 30 segundos"}
                        </p>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep("backup")}
                          className="w-1/3 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-white/10 py-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                        >
                          ← {language === "en" ? "Back" : "Voltar"}
                        </button>
                        <button
                          type="submit"
                          disabled={loading || verificationCode.length !== 6}
                          className="w-2/3 rounded-xl bg-accent py-3.5 text-xs font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/35 transition-all liquid-btn disabled:opacity-50"
                        >
                          {loading ? (language === "en" ? "Verifying..." : "Verificando...") : t("two_factor_verify_btn")}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Modal de Desativação de 2FA */}
            {showDisableModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none"
                onClick={() => setShowDisableModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-sm w-full overflow-hidden rounded-[2rem] border border-white/10 bg-background/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Efeito de brilho ambiente sutil */}
                  <div className="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-destructive/15 blur-3xl pointer-events-none" />

                  {/* Botão Fechar */}
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(false)}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title={t("cancel")}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center">
                    {/* Ícone */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive shadow-lg shadow-destructive/10">
                      <ShieldAlert className="h-7 w-7 text-destructive" />
                    </div>

                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                      {t("two_factor_disable_title")}
                    </h3>

                    <p className="mb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t("two_factor_disable_desc")}
                    </p>

                    {/* Botões de Ação */}
                    <div className="flex w-full flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleConfirmDisable}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3.5 text-sm font-bold transition-all shadow-lg shadow-destructive/25 active:scale-[0.98] disabled:opacity-50 liquid-btn"
                      >
                        <span>{loading ? (language === "en" ? "Disabling..." : "Desativando...") : t("two_factor_disable_confirm")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableModal(false)}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 active:scale-[0.98] text-foreground py-3.5 text-sm font-semibold transition-all border border-white/10 backdrop-blur-md"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default TwoFactorSettingsCard;
