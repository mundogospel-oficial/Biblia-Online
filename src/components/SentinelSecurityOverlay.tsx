import React, { useEffect, useState, useRef } from "react";
import { ShieldAlert, RefreshCw, AlertTriangle, Lock, EyeOff, ShieldCheck, X, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Turnstile } from '@marsidev/react-turnstile';
import { enableAntiF12Protection, deleteBanRecordAndUnban } from "@/services/securityService";
import { supabase } from "@/integrations/supabase/client";

export interface SentinelSecurityOverlayProps {
  isBlocked: boolean;
  blockReason?: string;
  errorCode?: string;
  fingerprint?: string;
  isExtensionDetected: boolean;
  extensionReasons?: string[];
  onReload?: () => void;
}

export const SentinelSecurityOverlay: React.FC<SentinelSecurityOverlayProps> = ({
  isBlocked,
  blockReason = "Acesso suspenso por atividade não permitida.",
  errorCode = "BAN_SECURITY_0x800403",
  fingerprint = "HASH_PROTECTED",
  isExtensionDetected,
  extensionReasons = [],
  onReload = () => {},
}) => {
  const [showExtensionHelp, setShowExtensionHelp] = useState(false);
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isCloudflareVerified, setIsCloudflareVerified] = useState(false);
  const turnstileRef = useRef<any>(null);

  // Formata o código do ban garantindo prefixo BAN_ sem a palavra "ERR_"
  const rawCode = errorCode || fingerprint || "BAN_SECURITY_0x800403";
  const displayBanCode = rawCode.replace(/^ERR_/, "BAN_");

  const handleCloudflareLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCloudflareVerified && !turnstileToken) {
      setLoginError("Por favor, conclua a verificação de segurança antes de prosseguir.");
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
      });

      if (error) {
        setLoginError("Credenciais inválidas: " + (error.message || "Email ou senha incorretos."));
        setIsSubmitting(false);
        turnstileRef.current?.reset();
        setTurnstileToken("");
        return;
      }

      if (data.user) {
        // Exclui o registro de banimento no Supabase e limpa o estado local
        await deleteBanRecordAndUnban(data.user.email || email, fingerprint);
        setShowCloudflareModal(false);
        // Notifica o app sem recarregar a página a todo momento
        onReload();
      }
    } catch {
      setLoginError("Erro ao validar login no Supabase. Verifique suas credenciais.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Anti-bypass locks for BSOD
  useEffect(() => {
    if (!isBlocked) return;

    // Ativa proteção anti-F12 e fechamento de abas DevTools
    enableAntiF12Protection();

    // 1. Lock scroll on body & html
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.userSelect = "none";

    // 2. Intercept key combinations (F12, Ctrl+U, Ctrl+Shift+I, Alt+Left, Tab, Esc)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        e.key === "Escape" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u" || e.key === "S" || e.key === "s")) ||
        (e.altKey && e.key === "ArrowLeft")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Intercept context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.userSelect = "";
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [isBlocked]);

  // SCENARIO 1: BLUE SCREEN OF DEATH (BSOD) ON IP / USER BLOCKED
  if (isBlocked) {
    return (
      <div 
        id="sentinel-bsod-root"
        className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#001c4d] text-white p-6 sm:p-12 font-mono select-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundColor: "#001e4d",
          backgroundImage: "radial-gradient(circle at 50% 30%, #002b6e 0%, #001233 100%)",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-2xl w-full space-y-8 animate-fade-in">
          {/* Error Face */}
          <div className="text-7xl sm:text-8xl font-bold tracking-tighter text-white/95 select-none">
            :(
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-white">
              Seu dispositivo foi bloqueado por motivos de segurança
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 font-sans leading-relaxed">
              Identificamos uma atividade suspeita associada a este dispositivo. O acesso foi suspenso por medida de segurança.
            </p>
          </div>

          {/* Details Box */}
          <div className="rounded-xl bg-blue-950/80 border border-blue-400/20 p-5 space-y-3 text-xs sm:text-sm backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 text-blue-300 font-bold border-b border-blue-400/20 pb-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>DETALHES DO REGISTRO DE SEGURANÇA</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-blue-300/70 block text-[11px] mb-1">CÓDIGO DO BAN</span>
                <span className="font-bold text-blue-100">{displayBanCode}</span>
              </div>
              <div>
                <span className="text-blue-300/70 block text-[11px] mb-1">MOTIVO DO REGISTRO</span>
                <span className="font-semibold text-blue-200">{blockReason || "Atividade suspeita ou violadora de segurança detectada"}</span>
              </div>
            </div>
          </div>

          {/* Footer Warning */}
          <div className="text-xs sm:text-sm text-blue-200/80 font-sans space-y-2 border-t border-blue-400/10 pt-4 leading-relaxed">
            <p>
              Se você acha que este bloqueio foi por engano, acesse o portal do site e envie um pedido de revisão no Fórum da Bíblia Online.
            </p>
            <p className="text-[11px] text-blue-300/40 font-mono">
              Sistema de Segurança Bíblia Online
            </p>
          </div>
        </div>

        {/* Botão no canto inferior direito para acesso autorizado */}
        <button
          type="button"
          onClick={() => setShowCloudflareModal(true)}
          className="fixed bottom-4 right-4 z-[99999999] flex items-center gap-2 bg-blue-950/90 border border-blue-400/40 hover:border-blue-400/80 hover:bg-blue-900 text-blue-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-sans font-medium transition-all shadow-xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Entrar para remover bloqueio</span>
        </button>

        {/* Modal de Login */}
        {showCloudflareModal && (
          <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="max-w-md w-full bg-[#0a1120] border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative space-y-5 text-white">
              {/* Botão Fechar */}
              <button
                type="button"
                onClick={() => {
                  setShowCloudflareModal(false);
                  setLoginError(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cabeçalho no tema do app */}
              <div className="flex items-center gap-3 border-b border-blue-500/20 pb-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center shrink-0 text-orange-400 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white tracking-tight">Autenticação de Segurança</h3>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 font-mono px-2 py-0.5 rounded-full border border-orange-500/30">
                      PROTECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Entrar para remover bloqueio sem redefinir senha
                  </p>
                </div>
              </div>

              {/* Turnstile Widget Real da Cloudflare */}
              <div className="bg-[#121c30] border border-slate-700/80 rounded-xl p-3 flex flex-col items-center justify-center min-h-[75px] shadow-inner relative overflow-hidden">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setIsCloudflareVerified(true);
                  }}
                  onExpire={() => {
                    setTurnstileToken("");
                    setIsCloudflareVerified(false);
                    turnstileRef.current?.reset();
                  }}
                  onError={() => {
                    // Fallback para dev/preview caso a domain key esteja em localhost
                    setIsCloudflareVerified(true);
                  }}
                  options={{ theme: "dark" }}
                />
                
                {/* Indicador visual de verificação */}
                {isCloudflareVerified && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Navegador Verificado com Sucesso</span>
                  </div>
                )}
              </div>

              {/* Formulário de Login para remoção do Ban */}
              <form onSubmit={handleCloudflareLoginSubmit} className="space-y-4">
                <div className="text-xs text-slate-300 bg-blue-950/70 border border-blue-500/25 p-3 rounded-xl leading-relaxed">
                  Entre com seu e-mail e senha para comprovar sua identidade. Se o login for válido, <b>o registro de banimento do seu dispositivo será permanentemente excluído do Supabase</b> e o acesso será liberado sem reiniciar o app.
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-200">E-mail da conta</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#121c30] border border-slate-700/80 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-200">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121c30] border border-slate-700/80 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (!isCloudflareVerified && !turnstileToken)}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando e Excluindo Ban no Supabase...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Entrar e Excluir Banimento</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SCENARIO 2: EXTENSION / TAMPERING WARNING MODAL
  if (isExtensionDetected) {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-6 shadow-2xl space-y-5 text-foreground relative overflow-hidden">
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

          {/* Icon Header */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center shrink-0 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                Desative as Extensões para Continuar
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proteção de Integridade do Sistema
              </p>
            </div>
          </div>

          {/* Main Body */}
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Identificamos a presença de extensões no seu navegador ou scripts que interagem com os campos e dados do aplicativo.
            </p>
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-foreground space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Risco de Comprometimento de Segurança</span>
              </div>
              <p className="text-muted-foreground leading-snug">
                Extensões de terceiros podem ler senhas, interceptar requisições ou alterar o comportamento do sistema. Para sua segurança, desative as extensões e reinicie a página.
              </p>
            </div>

            {extensionReasons.length > 0 && (
              <div className="text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground">Sinais detectados:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {extensionReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Extension Help Toggle */}
          {showExtensionHelp && (
            <div className="rounded-xl bg-secondary/50 p-3.5 text-xs text-foreground space-y-2 border border-white/10">
              <p className="font-bold">Como desativar extensões:</p>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Clique no ícone de <b>peça de quebra-cabeça</b> (🧩) no topo do seu navegador.</li>
                <li>Desative temporariamente as extensões ativas.</li>
                <li>Em seguida, clique no botão <b>Reiniciar e Recarregar</b> abaixo.</li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={onReload}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <RefreshCw className="h-4 w-4 animate-spin-slow" />
              <span>Reiniciar e Recarregar Página</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExtensionHelp(!showExtensionHelp)}
              className="text-xs text-muted-foreground hover:text-foreground text-center py-1 transition-colors underline"
            >
              {showExtensionHelp ? "Ocultar instruções" : "Como desativar extensões?"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
