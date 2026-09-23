import React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  iconClassName?: string;
  title?: string;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "icon";
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = "",
  iconClassName = "",
  title = "Falar por voz",
  disabled = false,
  size = "md"
}) => {
  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onTranscript
  });

  const sizeClasses = {
    xs: "h-7 w-7 p-1 text-xs",
    sm: "h-8 w-8 p-1.5 text-xs",
    md: "h-9 w-9 p-2 text-sm",
    icon: "h-8 w-8 sm:h-9 sm:w-9"
  }[size];

  const iconSizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-4 w-4",
    icon: "h-4 w-4"
  }[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          toggleListening();
        }
      }}
      disabled={disabled}
      title={
        isListening
          ? "Ouvindo... Fale agora (clique para parar)"
          : !isSupported
          ? "Reconhecimento de voz não suportado neste navegador"
          : title
      }
      aria-label={isListening ? "Parar ditado por voz" : title}
      className={`relative inline-flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${
        isListening
          ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-sm shadow-red-500/20 animate-pulse ring-2 ring-red-500/30"
          : "text-muted-foreground hover:text-accent hover:bg-accent/15"
      } ${className}`}
    >
      {isListening ? (
        <>
          <Mic className={`${iconSizes} ${iconClassName} text-red-500 animate-bounce`} />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </>
      ) : (
        <Mic className={`${iconSizes} ${iconClassName}`} />
      )}
    </button>
  );
};

export default VoiceInputButton;
