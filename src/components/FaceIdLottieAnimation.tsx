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
 * - 100% à prova de falhas: Sem dependência de JSONs corrompidos ou bibliotecas externas que travam.
 * - Transparente: Sem fundos cinzas ou bordas indesejadas.
 * - Encaixe perfeito no quadrado com proporções oficiais do iOS Face ID.
 * - Modo Leitura (authenticating): Efeito de respiração ("inchando e desinchando") com varredura infravermelha.
 * - Modo Sucesso (isSuccess): Transição orgânica para o anel de confirmação e desenho do checkmark verde Apple (✓).
 */
export const FaceIdLottieAnimation: React.FC<FaceIdLottieAnimationProps> = ({
  className = "w-20 h-20",
  isSuccess = false,
  authenticating = false,
  onComplete,
  size,
}) => {
  // Dispara o callback quando a animação de sucesso terminar
  useEffect(() => {
    if (isSuccess && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 850);
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

        {/* ========================================================
            GRUPO PRINCIPAL DO ROSTO E CANTOS COM EFEITO DE RESPIRAÇÃO
            ======================================================== */}
        <motion.g
          animate={
            authenticating
              ? {
                  scale: [1, 1.09, 1],
                }
              : isSuccess
              ? {
                  scale: [1, 0.95],
                  opacity: [1, 0],
                }
              : {
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            authenticating
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : {
                  duration: 0.35,
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
        </motion.g>

        {/* ========================================================
            LASER DE VARREDURA INFRAVERMELHO (DURANTE A LEITURA)
            ======================================================== */}
        {authenticating && !isSuccess && (
          <g clipPath="url(#faceIdClipArea)">
            <motion.g
              animate={{ y: [18, 76, 18] }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Linha de laser */}
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
              {/* Feixe difuso */}
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

        {/* ========================================================
            ESTADO DE SUCESSO / CONFIRMAÇÃO APPLE (✓)
            ======================================================== */}
        <AnimatePresence>
          {isSuccess && (
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Onda expansiva de validação */}
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#34C759"
                strokeWidth="2"
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{ scale: 1.25, opacity: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />

              {/* Anel de confirmação verde Apple iOS */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="#34C759"
                fillOpacity="0.14"
                stroke="#34C759"
                strokeWidth="4.5"
                initial={{ pathLength: 0, scale: 0.85, opacity: 0 }}
                animate={{ pathLength: 1, scale: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.5, ease: "easeInOut" },
                  scale: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.25 },
                }}
              />

              {/* Checkmark clássico Apple iOS desenhado suavemente */}
              <motion.path
                d="M 33 51.5 L 44.5 63 L 68 37"
                fill="none"
                stroke="#34C759"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.15,
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
