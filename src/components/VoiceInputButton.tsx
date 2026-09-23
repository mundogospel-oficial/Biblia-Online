import React from "react";
import { Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  size = "md",
}) => {
  const { isListening, isSpeaking, isSupported, toggleListening } = useVoiceInput({
    onTranscript,
  });

  const sizeClasses = {
    xs: "h-7 w-7 p-1 text-xs",
    sm: "h-8 w-8 p-1.5 text-xs",
    md: "h-9 w-9 p-2 text-sm",
    icon: "h-8 w-8 sm:h-9 sm:w-9",
  }[size];

  const iconSizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-4 w-4",
    icon: "h-4 w-4",
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
          ? "Ouvindo sua voz... Fale normalmente. Ao parar de falar, enviaremos automaticamente."
          : !isSupported
          ? "Reconhecimento de voz não suportado neste navegador (Recomendamos Chrome)"
          : title
      }
      aria-label={isListening ? "Ouvindo... Clique para cancelar ou parar" : title}
      className={`relative inline-flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${
        isListening
          ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-md shadow-red-500/20 ring-2 ring-red-500/30"
          : "text-muted-foreground hover:text-accent hover:bg-accent/15"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.div
            key="mic-listening"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="relative flex items-center justify-center"
          >
            {/* Onda sonora expansiva ao detectar voz */}
            {isSpeaking && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.0, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-red-500/40 pointer-events-none"
              />
            )}

            <Mic
              className={`${iconSizes} ${iconClassName} text-red-500 ${
                isSpeaking ? "animate-pulse scale-110" : ""
              } transition-transform duration-200`}
            />

            {/* Ponto indicador de gravação ativa no canto */}
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="mic-idle"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="flex items-center justify-center"
          >
            <Mic className={`${iconSizes} ${iconClassName}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default VoiceInputButton;
