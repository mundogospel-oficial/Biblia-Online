import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FaceIdLottieAnimationProps {
  className?: string;
  isSuccess?: boolean;
  authenticating?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  onComplete?: () => void;
  size?: number | string;
}

/**
 * Animação oficial Apple Face ID recriada em SVG Vetorial Nativo + Framer Motion.
 * - Transição limpa e perfeita: O rosto desaparece totalmente antes de exibir o checkmark (✓), sem sobreposição.
 * - 100% transparente (sem fundos cinzas).
 * - Modo Leitura (authenticating): Efeito de respiração ("inchando e desinchando") com varredura infravermelha.
 * - Modo Sucesso (isSuccess): Exibe exclusivamente o anel verde e o checkmark oficial da Apple (✓).
 */
export const FaceIdLottieAnimation: React.FC<FaceIdLottieAnimationProps> = ({
  className = "w-20 h-20",
  isSuccess = false,
  authenticating = false,
  onComplete,
  size,
}) => {
  // Dispara o callback após a conclusão da animação de sucesso
  useEffect(() => {
    if (isSuccess && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onComplete]);

  const containerStyle: React.CSSProperties = {
    width: size ?? undefined,
    height: size ?? undefined,
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={containerStyle}
      aria-label="Reconhecimento Facial Face ID"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Laser de Varredura Biométrica */}
          <linearGradient id="faceIdLaser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#67e8f9" stopOpacity="1" />
            <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Brilho do Laser */}
          <linearGradient id="faceIdLaserGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Máscara interna para a varredura */}
          <clipPath id="faceIdClipArea">
            <rect x="12" y="12" width="76" height="76" rx="18" />
          </clipPath>

          {/* Filtro de Glow Sutil */}
          <filter id="faceIdSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* ========================================================
               ESTADO 1: ROSTO FACE ID (REPOUSO OU VARREDURA BIOMÉTRICA)
               ======================================================== */
            <motion.g
              key="face-id-scan-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                authenticating
                  ? {
                      opacity: 1,
                      scale: [1, 1.09, 1],
                    }
                  : {
                      opacity: 1,
                      scale: 1,
                    }
              }
              exit={{
                opacity: 0,
                scale: 0.82,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
              transition={
                authenticating
                  ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 0.3,
                      ease: "easeOut",
                    }
              }
              style={{ originX: "50px", originY: "50px" }}
            >
              {/* ========================================================
                  4 CANTOS DO FACE ID (BRACKETS)
                  ======================================================== */}
              {/* Canto Superior Esquerdo */}
              <motion.path
                d="M 12 36 L 12 24 C 12 17.37 17.37 12 24 12 L 36 12"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  authenticating
                    ? { x: [0, -3, 0], y: [0, -3, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Canto Superior Direito */}
              <motion.path
                d="M 64 12 L 76 12 C 82.63 12 88 17.37 88 24 L 88 36"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  authenticating
                    ? { x: [0, 3, 0], y: [0, -3, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Canto Inferior Esquerdo */}
              <motion.path
                d="M 12 64 L 12 76 C 12 82.63 17.37 88 24 88 L 36 88"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  authenticating
                    ? { x: [0, -3, 0], y: [0, 3, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Canto Inferior Direito */}
              <motion.path
                d="M 64 88 L 76 88 C 82.63 88 88 82.63 88 76 L 88 64"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  authenticating
                    ? { x: [0, 3, 0], y: [0, 3, 0] }
                    : { x: 0, y: 0 }
                }
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* ========================================================
                  FEIÇÕES FACIAIS (OLHOS, NARIZ, BOCA)
                  ======================================================== */}
              {/* Olho Esquerdo */}
              <motion.rect
                x="32"
                y="35"
                width="5.5"
                height="11"
                rx="2.75"
                fill="currentColor"
                animate={
                  authenticating
                    ? {
                        scaleY: [1, 1, 0.15, 1, 1, 0.15, 1],
                      }
                    : { scaleY: 1 }
                }
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  times: [0, 0.45, 0.48, 0.52, 0.85, 0.88, 1],
                  ease: "easeInOut",
                }}
                style={{ originX: "34.75px", originY: "40.5px" }}
              />

              {/* Olho Direito */}
              <motion.rect
                x="62.5"
                y="35"
                width="5.5"
                height="11"
                rx="2.75"
                fill="currentColor"
                animate={
                  authenticating
                    ? {
                        scaleY: [1, 1, 0.15, 1, 1, 0.15, 1],
                      }
                    : { scaleY: 1 }
                }
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  times: [0, 0.45, 0.48, 0.52, 0.85, 0.88, 1],
                  ease: "easeInOut",
                }}
                style={{ originX: "65.25px", originY: "40.5px" }}
              />

              {/* Nariz */}
              <path
                d="M 50 36 L 50 54 C 50 57.5 46.5 59.5 43 59.5"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Sorriso / Boca */}
              <path
                d="M 33 68 C 38 75.5 62 75.5 67 68"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
              />

              {/* ========================================================
                  LASER DE VARREDURA INFRAVERMELHO (DURANTE A LEITURA)
                  ======================================================== */}
              {authenticating && (
                <g clipPath="url(#faceIdClipArea)">
                  <motion.g
                    animate={{ y: [18, 76, 18] }}
                    transition={{
                      duration: 2.0,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <line
                      x1="16"
                      y1="0"
                      x2="84"
                      y2="0"
                      stroke="url(#faceIdLaser)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#faceIdSoftGlow)"
                    />
                    <rect
                      x="16"
                      y="-14"
                      width="68"
                      height="14"
                      fill="url(#faceIdLaserGlow)"
                    />
                  </motion.g>
                </g>
              )}
            </motion.g>
          ) : (
            /* ========================================================
               ESTADO 2: SUCESSO EXCLUSIVO (CHECKMARK APPLE ISOLADO)
               ======================================================== */
            <motion.g
              key="face-id-success-state"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: "50px", originY: "50px" }}
            >
              {/* Onda de choque / expansão suave */}
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#34C759"
                strokeWidth="2"
                initial={{ scale: 0.75, opacity: 0.8 }}
                animate={{ scale: 1.25, opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              />

              {/* Círculo verde do Face ID com fundo suave */}
              <motion.circle
                cx="50"
                cy="50"
                r="38"
                fill="#34C759"
                fillOpacity="0.16"
                stroke="#34C759"
                strokeWidth="4.5"
                initial={{ pathLength: 0, scale: 0.85, opacity: 0 }}
                animate={{ pathLength: 1, scale: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.45, ease: "easeInOut" },
                  scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 },
                }}
              />

              {/* Traço do Checkmark (✓) desenhado perfeitamente no centro */}
              <motion.path
                d="M 34 50.5 L 44.5 61 L 66 37.5"
                fill="none"
                stroke="#34C759"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
};

export default FaceIdLottieAnimation;
