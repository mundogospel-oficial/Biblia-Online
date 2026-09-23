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
 * Animação oficial Apple iOS Face ID (pura e fluida, sem texto "Face ID")
 * - Usa a geometria exata do ícone de biometria fornecido pelo usuário.
 * - Estado Leitura/Scanning: Os 4 cantos expandem suavemente, olhos com micro-reação e laser de varredura biométrica infravermelha.
 * - Estado Sucesso: Transição orgânica para anel de confirmação e desenho do checkmark verde Apple (✓).
 * - Totalmente em SVG + Framer Motion, garantindo visibilidade instantânea, sem travas ou erros de JSON.
 */
export const FaceIdLottieAnimation: React.FC<FaceIdLottieAnimationProps> = ({
  className = "w-24 h-24",
  isSuccess = false,
  authenticating = false,
  loop = true,
  onComplete,
  size,
}) => {
  const isScanning = authenticating || (!isSuccess && loop);

  // Dispara onComplete quando a animação de sucesso terminar
  useEffect(() => {
    if (isSuccess && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onComplete]);

  // Dimensões do container
  const containerStyle: React.CSSProperties = {
    width: size ?? undefined,
    height: size ?? undefined,
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={containerStyle}
      aria-label="Animação de Reconhecimento Facial"
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Gradiente do feixe de laser de varredura biométrica */}
          <linearGradient id="faceIdScanBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Gradiente de brilho difuso do scanner */}
          <linearGradient id="faceIdScanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Filtro de brilho sutil */}
          <filter id="faceIdGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Máscara para manter o feixe dentro do rosto */}
          <clipPath id="faceIdFrameClip">
            <rect x="10" y="10" width="60" height="60" rx="14" />
          </clipPath>
        </defs>

        {/* ========================================================
            CANTO SUPERIOR ESQUERDO
            ======================================================== */}
        <motion.path
          d="M4.11428571,21.9428571 L4.11428571,13.0285714 C4.11428571,7.99327149 7.99327149,4.11428571 13.0285714,4.11428571 L21.9428571,4.11428571 C23.0789858,4.11428571 24,3.19327149 24,2.05714286 C24,0.921014229 23.0789858,0 21.9428571,0 L13.0285714,0 C5.72101423,0 0,5.72101423 0,13.0285714 L0,21.9428571 C0,23.0789858 0.921014229,24 2.05714286,24 C3.19327149,24 4.11428571,23.0789858 4.11428571,21.9428571 Z"
          fill="currentColor"
          animate={
            isSuccess
              ? { x: -3, y: -3, opacity: 0, scale: 0.9 }
              : isScanning
              ? { x: [0, -2, 0], y: [0, -2, 0], opacity: [0.9, 1, 0.9] }
              : { x: 0, y: 0, opacity: 0.9 }
          }
          transition={
            isSuccess
              ? { duration: 0.35, ease: "easeOut" }
              : isScanning
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />

        {/* ========================================================
            CANTO SUPERIOR DIREITO
            ======================================================== */}
        <motion.g
          transform="translate(80, 0) scale(-1, 1)"
          animate={
            isSuccess
              ? { x: 3, y: -3, opacity: 0, scale: 0.9 }
              : isScanning
              ? { x: [0, 2, 0], y: [0, -2, 0], opacity: [0.9, 1, 0.9] }
              : { x: 0, y: 0, opacity: 0.9 }
          }
          transition={
            isSuccess
              ? { duration: 0.35, ease: "easeOut" }
              : isScanning
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        >
          <path
            d="M4.11428571,21.9428571 L4.11428571,13.0285714 C4.11428571,7.99327149 7.99327149,4.11428571 13.0285714,4.11428571 L21.9428571,4.11428571 C23.0789858,4.11428571 24,3.19327149 24,2.05714286 C24,0.921014229 23.0789858,0 21.9428571,0 L13.0285714,0 C5.72101423,0 0,5.72101423 0,13.0285714 L0,21.9428571 C0,23.0789858 0.921014229,24 2.05714286,24 C3.19327149,24 4.11428571,23.0789858 4.11428571,21.9428571 Z"
            fill="currentColor"
          />
        </motion.g>

        {/* ========================================================
            CANTO INFERIOR ESQUERDO
            ======================================================== */}
        <motion.g
          transform="translate(0, 80) scale(1, -1)"
          animate={
            isSuccess
              ? { x: -3, y: 3, opacity: 0, scale: 0.9 }
              : isScanning
              ? { x: [0, -2, 0], y: [0, 2, 0], opacity: [0.9, 1, 0.9] }
              : { x: 0, y: 0, opacity: 0.9 }
          }
          transition={
            isSuccess
              ? { duration: 0.35, ease: "easeOut" }
              : isScanning
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        >
          <path
            d="M4.11428571,21.9428571 L4.11428571,13.0285714 C4.11428571,7.99327149 7.99327149,4.11428571 13.0285714,4.11428571 L21.9428571,4.11428571 C23.0789858,4.11428571 24,3.19327149 24,2.05714286 C24,0.921014229 23.0789858,0 21.9428571,0 L13.0285714,0 C5.72101423,0 0,5.72101423 0,13.0285714 L0,21.9428571 C0,23.0789858 0.921014229,24 2.05714286,24 C3.19327149,24 4.11428571,23.0789858 4.11428571,21.9428571 Z"
            fill="currentColor"
          />
        </motion.g>

        {/* ========================================================
            CANTO INFERIOR DIREITO
            ======================================================== */}
        <motion.g
          transform="translate(80, 80) scale(-1, -1)"
          animate={
            isSuccess
              ? { x: 3, y: 3, opacity: 0, scale: 0.9 }
              : isScanning
              ? { x: [0, 2, 0], y: [0, 2, 0], opacity: [0.9, 1, 0.9] }
              : { x: 0, y: 0, opacity: 0.9 }
          }
          transition={
            isSuccess
              ? { duration: 0.35, ease: "easeOut" }
              : isScanning
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        >
          <path
            d="M4.11428571,21.9428571 L4.11428571,13.0285714 C4.11428571,7.99327149 7.99327149,4.11428571 13.0285714,4.11428571 L21.9428571,4.11428571 C23.0789858,4.11428571 24,3.19327149 24,2.05714286 C24,0.921014229 23.0789858,0 21.9428571,0 L13.0285714,0 C5.72101423,0 0,5.72101423 0,13.0285714 L0,21.9428571 C0,23.0789858 0.921014229,24 2.05714286,24 C3.19327149,24 4.11428571,23.0789858 4.11428571,21.9428571 Z"
            fill="currentColor"
          />
        </motion.g>

        {/* ========================================================
            ELEMENTOS FACIAIS (OLHOS, NARIZ, BOCA)
            ======================================================== */}
        <motion.g
          animate={
            isSuccess
              ? { opacity: 0, scale: 0.8, y: -2 }
              : isScanning
              ? { opacity: 1, scale: [1, 1.02, 1], y: 0 }
              : { opacity: 0.9, scale: 1, y: 0 }
          }
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ originX: "40px", originY: "40px" }}
        >
          {/* Olhos com micro-piscar sutil ao escanear */}
          <motion.g
            animate={
              isScanning
                ? {
                    scaleY: [1, 1, 0.15, 1, 1, 1, 0.15, 1, 1],
                  }
                : { scaleY: 1 }
            }
            transition={{
              duration: 3.5,
              repeat: Infinity,
              times: [0, 0.45, 0.48, 0.52, 0.7, 0.85, 0.88, 0.92, 1],
              ease: "easeInOut",
            }}
            style={{ originX: "40px", originY: "33px" }}
          >
            {/* Olho Esquerdo */}
            <path
              d="M21.754386,30.2130321 L21.754386,35.9305515 C21.754386,37.1140188 22.6498165,38.0734087 23.754386,38.0734087 C24.8589555,38.0734087 25.754386,37.1140188 25.754386,35.9305515 L25.754386,30.2130321 C25.754386,29.0295648 24.8589555,28.070175 23.754386,28.070175 C22.6498165,28.070175 21.754386,29.0295648 21.754386,30.2130321 Z"
              fill="currentColor"
            />
            {/* Olho Direito */}
            <path
              d="M54.736842,30.2130321 L54.736842,35.9305515 C54.736842,37.1140188 55.6322725,38.0734087 56.736842,38.0734087 C57.8414115,38.0734087 58.736842,37.1140188 58.736842,35.9305515 L58.736842,30.2130321 C58.736842,29.0295648 57.8414115,28.070175 56.736842,28.070175 C55.6322725,28.070175 54.736842,29.0295648 54.736842,30.2130321 Z"
              fill="currentColor"
            />
          </motion.g>

          {/* Nariz */}
          <path
            d="M40,30.1754386 L40,44.9122807 C40,45.85537 39.539042,46.3157895 38.5912711,46.3157895 L37.1929825,46.3157895 C36.0302777,46.3157895 35.0877193,47.2583479 35.0877193,48.4210526 C35.0877193,49.5837574 36.0302777,50.5263158 37.1929825,50.5263158 L38.5912711,50.5263158 C41.8633505,50.5263158 44.2105263,48.1818819 44.2105263,44.9122807 L44.2105263,30.1754386 C44.2105263,29.0127339 43.2679679,28.0701754 42.1052632,28.0701754 C40.9425584,28.0701754 40,29.0127339 40,30.1754386 Z"
            fill="currentColor"
          />

          {/* Boca / Sorriso */}
          <path
            d="M25.9319616,59.0829234 C29.8331111,62.7239962 34.5578726,64.5614035 40,64.5614035 C45.4421274,64.5614035 50.1668889,62.7239962 54.0680384,59.0829234 C54.9180398,58.2895887 54.9639773,56.9574016 54.1706427,56.1074002 C53.377308,55.2573988 52.0451209,55.2114613 51.1951195,56.0047959 C48.0787251,58.9134307 44.382434,60.3508772 40,60.3508772 C35.617566,60.3508772 31.9212749,58.9134307 28.8048805,56.0047959 C27.9548791,55.2114613 26.622692,55.2573988 25.8293573,56.1074002 C25.0360227,56.9574016 25.0819602,58.2895887 25.9319616,59.0829234 Z"
            fill="currentColor"
          />
        </motion.g>

        {/* ========================================================
            LASER BIOMÉTRICO DE VARREDURA INFRAVERMELHA
            ======================================================== */}
        {isScanning && (
          <g clipPath="url(#faceIdFrameClip)">
            {/* Feixe luminoso passando suavemente para cima e para baixo */}
            <motion.g
              animate={{ y: [16, 62, 16] }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Linha laser de alta tecnologia */}
              <line
                x1="14"
                y1="0"
                x2="66"
                y2="0"
                stroke="url(#faceIdScanBeam)"
                strokeWidth="2.2"
                strokeLinecap="round"
                filter="url(#faceIdGlow)"
              />
              {/* Sombra de brilho projetada na varredura */}
              <rect
                x="14"
                y="-10"
                width="52"
                height="10"
                fill="url(#faceIdScanGlow)"
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
              {/* Onda expansiva de sucesso (Ripple) */}
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#34C759"
                strokeWidth="1.5"
                initial={{ scale: 0.85, opacity: 0.8 }}
                animate={{ scale: 1.15, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />

              {/* Anel de confirmação verde Apple iOS */}
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                fill="#34C759"
                fillOpacity="0.12"
                stroke="#34C759"
                strokeWidth="3.2"
                initial={{ pathLength: 0, scale: 0.9, opacity: 0 }}
                animate={{ pathLength: 1, scale: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.45, ease: "easeInOut" },
                  scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 },
                }}
              />

              {/* Checkmark clássico Apple iOS desenhado com suavidade */}
              <motion.path
                d="M26 41.5 L35.5 51 L54.5 29"
                fill="none"
                stroke="#34C759"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.42,
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
