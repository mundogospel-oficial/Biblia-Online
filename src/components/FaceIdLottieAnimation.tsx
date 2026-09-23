import React, { useEffect } from "react";
import { useLottie } from "lottie-react";
import faceIdAnimationData from "@/assets/face-id-animation.json";

interface FaceIdLottieAnimationProps {
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  isSuccess?: boolean;
  onComplete?: () => void;
  size?: number | string;
}

export const FaceIdLottieAnimation: React.FC<FaceIdLottieAnimationProps> = ({
  className = "w-24 h-24",
  loop = true,
  autoplay = true,
  isSuccess = false,
  onComplete,
  size,
}) => {
  const options = {
    animationData: faceIdAnimationData,
    loop: !isSuccess && loop,
    autoplay: autoplay,
    onComplete: onComplete,
    style: { width: "100%", height: "100%" },
  };

  const { View, playSegments, setLoop, play } = useLottie(options);

  useEffect(() => {
    if (isSuccess) {
      setLoop(false);
      playSegments([93, 240], true);
    } else {
      setLoop(loop);
      if (autoplay) {
        play();
      }
    }
  }, [isSuccess, loop, autoplay, playSegments, setLoop, play]);

  const styleProps: React.CSSProperties = size
    ? { width: size, height: size }
    : {};

  return (
    <div 
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      style={styleProps}
    >
      {View}
    </div>
  );
};

export default FaceIdLottieAnimation;
