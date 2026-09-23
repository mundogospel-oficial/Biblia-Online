import React, { useEffect, useRef } from "react";
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
      // Destrói qualquer instância anterior
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }

      // Carrega o arquivo JSON original separado sem alterar nada nele
      // Usa renderer 'svg' para renderizar perfeitamente máscaras e camadas vetoriais
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: loop,
        autoplay: autoplay,
        animationData: faceIdAnimationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
          hideOnTransparent: true,
        },
      });

      animRef.current = anim;

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
  }, [loop, autoplay, onComplete]);

  // Controle de reprodução e estado de sucesso
  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;

    if (isSuccess) {
      // Quadro de validação / checkmark de sucesso
      anim.loop = false;
      anim.playSegments([112, 180], true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 900);
      return () => clearTimeout(timer);
    } else if (authenticating) {
      // Leitura biométrica ativa com anéis de varredura
      anim.loop = true;
      anim.playSegments([0, 112], true);
    } else {
      // Estado de repouso / ícone pronto
      anim.loop = false;
      anim.goToAndStop(0, true);
    }
  }, [isSuccess, authenticating, onComplete]);

  const containerStyle: React.CSSProperties = {
    width: size ?? undefined,
    height: size ?? undefined,
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none overflow-hidden ${className}`}
      style={containerStyle}
      aria-label="Animação Face ID"
    />
  );
};

export default FaceIdLottieAnimation;
