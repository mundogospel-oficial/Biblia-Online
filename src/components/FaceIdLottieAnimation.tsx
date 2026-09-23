import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import lottie, { AnimationItem } from "lottie-web";
import faceIdAnimationData from "../assets/face-id-animation.json";

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
 * Componente oficial de animação Apple Face ID:
 * - Fundo cinza removido (100% transparente)
 * - Proporção ajustada perfeitamente para preencher o quadrado (88.89x88.89)
 * - Durante a leitura (authenticating): Efeito orgânico de pulsar / respirar ("inchando e desinchando") do Face ID nativo
 * - Na confirmação (isSuccess): Transição fluida para o anel e desenho completo do checkmark (✓)
 */
export const FaceIdLottieAnimation: React.FC<FaceIdLottieAnimationProps> = ({
  className = "w-24 h-24",
  isSuccess = false,
  authenticating = false,
  loop = true,
  autoplay = true,
  onComplete,
  size,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }

      // Renderizador SVG para suporte completo a vetores, máscaras e transparência
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: faceIdAnimationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
          hideOnTransparent: true,
        },
      });

      animRef.current = anim;

      // Inicia no frame 0 com o ícone pronto
      anim.goToAndStop(0, true);

      anim.addEventListener("complete", () => {
        onComplete?.();
      });

      return () => {
        anim.destroy();
        animRef.current = null;
      };
    } catch (err) {
      console.error("Erro ao carregar animação Face ID:", err);
    }
  }, [onComplete]);

  // Controle de estados da animação
  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;

    if (isSuccess) {
      // Sucesso: Morfa os 4 cantos para o círculo e desenha o checkmark (✓)
      anim.loop = false;
      anim.playSegments([30, 180], true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 950);
      return () => clearTimeout(timer);
    } else if (authenticating) {
      // Leitura em andamento: Mantém os 4 cantos no frame inicial enquanto o container respira/incha
      anim.loop = false;
      anim.goToAndStop(0, true);
    } else {
      // Estado de repouso
      anim.loop = false;
      anim.goToAndStop(0, true);
    }
  }, [isSuccess, authenticating, onComplete, loop, autoplay]);

  const containerStyle: React.CSSProperties = {
    width: size ?? undefined,
    height: size ?? undefined,
  };

  return (
    <motion.div
      animate={
        authenticating
          ? {
              scale: [1, 1.14, 1],
              opacity: [0.9, 1, 0.9],
            }
          : isSuccess
          ? {
              scale: [1, 1.05, 1],
              opacity: 1,
            }
          : {
              scale: 1,
              opacity: 1,
            }
      }
      transition={
        authenticating
          ? {
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : {
              duration: 0.35,
              ease: "easeOut",
            }
      }
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={containerStyle}
      aria-label="Animação Face ID"
    >
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:overflow-visible"
      />
    </motion.div>
  );
};

export default FaceIdLottieAnimation;
