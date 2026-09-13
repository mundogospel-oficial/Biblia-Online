import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PHRASES = [
  "Criando imagem",
  "Analisando referências bíblicas...",
  "Definindo iluminação e atmosfera sagrada...",
  "Compondo cenário e perspectiva...",
  "Sintetizando detalhes e texturas...",
  "Renderizando iluminação celestial...",
  "Aprimorando nitidez e resolução...",
  "Finalizando imagem sagrada..."
];

export const ImageGeneratingMatrixSquare: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycling status phrases at the top
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  // Smooth realistic progress percentage starting at 10%
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let p = 10;
      if (elapsed < 2) {
        p = 10 + (elapsed / 2) * 8; // 10 -> 18%
      } else if (elapsed < 5) {
        p = 18 + ((elapsed - 2) / 3) * 16; // 18 -> 34%
      } else if (elapsed < 9) {
        p = 34 + ((elapsed - 5) / 4) * 22; // 34 -> 56%
      } else if (elapsed < 14) {
        p = 56 + ((elapsed - 9) / 5) * 20; // 56 -> 76%
      } else if (elapsed < 20) {
        p = 76 + ((elapsed - 14) / 6) * 16; // 76 -> 92%
      } else {
        p = 92 + (1 - Math.exp(-(elapsed - 20) / 10)) * 6.5; // 92 -> 98.5%
      }
      setProgress(Math.min(99, Math.round(p)));
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Canvas animated dot matrix grid with Retina DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();

    const cols = 22;
    const rows = 22;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const cellW = width / (cols + 1);
      const cellH = height / (rows + 1);
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 1) * cellW;
          const y = (r + 1) * cellH;

          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Wave propagation from center outward
          const wave = Math.sin(dist * 0.045 - elapsed * 3.2);
          // Secondary cross ripple
          const wave2 = Math.cos(dx * 0.03 + elapsed * 1.8) * Math.sin(dy * 0.03 - elapsed * 1.8);
          // Twinkle / diffusion sparkle noise
          const twinkle = Math.sin(c * 17.13 + r * 91.41 + elapsed * 4.5);

          // Center bias (dots around the center are more frequently lit, as in reference)
          const centerBias = Math.max(0, 1 - dist / (maxDist * 0.65));
          let intensity = (wave + 1) * 0.35 + (wave2 + 1) * 0.2 + centerBias * 0.35;

          if (twinkle > 0.82) {
            intensity += 0.3;
          }

          intensity = Math.min(1, Math.max(0, intensity));

          ctx.beginPath();
          if (intensity > 0.52) {
            // Illuminated glowing blue/cyan dot
            const radius = 1.4 + intensity * 1.1;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${0.45 + intensity * 0.55})`;
            ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
            ctx.shadowBlur = 7 * intensity;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
          } else {
            // Dim background dot
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(148, 163, 184, ${0.08 + intensity * 0.12})`;
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl bg-[#04060a] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 select-none my-1"
    >
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />

      {/* Top Header with changing phrase - Posicionado no topo com margem limpa */}
      <div className="relative z-10 flex items-center justify-between w-full pt-1 px-1">
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <div className="h-5 relative overflow-hidden flex items-center w-full">
            <AnimatePresence mode="wait">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-xs sm:text-sm font-semibold text-white/95 tracking-tight truncate block"
              >
                {PHRASES[phraseIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Center Matrix Dot Canvas - Delimitado abaixo do texto */}
      <div className="absolute inset-x-0 top-9 bottom-9 px-3 flex items-center justify-center pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Row with Percentage Badge at Bottom-Right */}
      <div className="relative z-10 flex items-center justify-end w-full mt-auto pb-0.5 px-0.5">
        <div className="rounded-full px-3 py-1 bg-[#141824]/90 border border-slate-700/60 shadow-lg backdrop-blur-md flex items-center">
          <span className="text-sky-400 font-mono font-semibold text-xs tracking-tight">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
