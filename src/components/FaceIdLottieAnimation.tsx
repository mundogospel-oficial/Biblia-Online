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
      // Usa renderer 'canvas' para compatibilidade perfeita com todas as camadas e efeitos
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "canvas",
        loop: loop,
        autoplay: autoplay,
        animationData: faceIdAnimationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          clearCanvas: true,
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
      // Avança para o quadro de validação/sucesso (checkmark verde)
      anim.loop = false;
      anim.playSegments([90, 180], true);
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 900);
      return () => clearTimeout(timer);
    } else if (authenticating) {
      anim.loop = true;
      anim.playSegments([0, 90], true);
    } else {
      anim.loop = loop;
      anim.play();
    }
  }, [isSuccess, authenticating, loop, onComplete]);

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
