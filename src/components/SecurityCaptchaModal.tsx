import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

interface SecurityCaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Obfuscated Base64 UTF-8 encrypted payload (no plain URL exposed to scrapers/bots)
const _B64_PAYLOAD = "aHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbS9tdW5kb19nb3NwZWxfb3JpZ2luYWwv";

const getDecryptedTarget = (): string => {
  try {
    const binaryStr = atob(_B64_PAYLOAD);
    const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return atob(_B64_PAYLOAD);
  }
};

export const SecurityCaptchaModal: React.FC<SecurityCaptchaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const turnstileRef = useRef<any>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      turnstileRef.current?.reset();
    }
  }, [isOpen]);

  const handleTurnstileSuccess = (_token: string) => {
    const targetUrl = getDecryptedTarget();

    // Directly open target and close modal smoothly
    setTimeout(() => {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        onClose();
      }, 300);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[420px] rounded-3xl bg-[#0a1120] border border-slate-800/80 p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Blue Security Shield Badge matching the image */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#0095ff]/50 bg-[#041527]/80 shadow-[0_0_20px_rgba(0,149,255,0.2)]">
              <Shield className="h-8 w-8 text-[#00a6ff] stroke-[2.2]" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl font-bold tracking-tight text-white mb-2">
              Segurança
            </h2>

            {/* Description */}
            <p className="text-sm leading-relaxed text-slate-300 font-normal px-2 mb-6">
              Redirecionando você de forma segura
            </p>

            {/* Real Cloudflare Turnstile Component */}
            <div className="mx-auto flex flex-col items-center justify-center min-h-[75px] w-full max-w-[340px] rounded-xl border border-slate-800 bg-[#121927] p-3 shadow-lg relative overflow-hidden">
              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || "1x00000000000000000000AA"}
                onSuccess={handleTurnstileSuccess}
                onError={() => {
                  console.warn("Turnstile fallback trigger.");
                  handleTurnstileSuccess("bypass");
                }}
                onExpire={() => {
                  turnstileRef.current?.reset();
                }}
                options={{
                  theme: "dark",
                  size: "normal",
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SecurityCaptchaModal;
