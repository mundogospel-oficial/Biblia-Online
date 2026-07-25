import React, { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, AlertTriangle, Lock, EyeOff } from "lucide-react";

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
  blockReason = "Comportamento violador ou atividade suspeita detectada pelo Sentinel Security.",
  errorCode = "ERR_SENTINEL_SECURITY_0x800403",
  fingerprint = "HASH_PROTECTED",
  isExtensionDetected,
  extensionReasons = [],
  onReload = () => window.location.reload(),
}) => {
  const [showExtensionHelp, setShowExtensionHelp] = useState(false);

  // Anti-bypass locks for BSOD
  useEffect(() => {
    if (!isBlocked) return;

    // 1. Lock scroll on body
    document.body.style.overflow = "hidden";
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
        className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#001c4d] text-white p-6 sm:p-12 font-mono select-none overflow-y-auto"
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
              Seu IP foi bloqueado por motivos de segurança
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 font-sans leading-relaxed">
              O sistema Sentinel identificou uma atividade altamente suspeita ou violadora de segurança associada a este endereço IP/dispositivo. O acesso a esta aplicação foi suspenso para proteger os dados e o ambiente.
            </p>
          </div>

          {/* Details Box */}
          <div className="rounded-xl bg-blue-950/80 border border-blue-400/20 p-5 space-y-3 text-xs sm:text-sm backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 text-blue-300 font-bold border-b border-blue-400/20 pb-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>DETALHES DO REGISTRO DE SEGURANÇA</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-blue-300/70 block text-[11px]">CÓDIGO DE ERRO</span>
                <span className="font-bold text-blue-100">{errorCode}</span>
              </div>
              <div>
                <span className="text-blue-300/70 block text-[11px]">MOTIVO DO REGISTRO</span>
                <span className="font-semibold text-blue-200">{blockReason}</span>
              </div>
              <div>
                <span className="text-blue-300/70 block text-[11px]">HASH DO DISPOSITIVO</span>
                <span className="font-mono text-blue-300">{fingerprint.slice(0, 18)}...</span>
              </div>
              <div>
                <span className="text-blue-300/70 block text-[11px]">REGISTRO ENVIADO AO BANCO</span>
                <span className="text-emerald-400 font-bold">SUPABASE SECURITY LOGGED</span>
              </div>
            </div>
          </div>

          {/* Footer Warning */}
          <div className="text-xs text-blue-200/60 font-sans space-y-2 border-t border-blue-400/10 pt-4">
            <p>
              Se você acredita que este bloqueio foi efetuado por engano, entre em contato com o suporte do sistema fornecendo o código de erro acima.
            </p>
            <p className="text-[11px] text-blue-300/40 font-mono">
              Sentinel Security Shield v2.4 • Supabase Auto-Ban Enabled
            </p>
          </div>
        </div>
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
