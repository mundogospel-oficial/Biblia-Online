import React, { useState, useEffect, useRef, useCallback } from "react";
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

interface Point {
  x: number;
  y: number;
}

export const ImageGeneratingMatrixSquare: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [isPlayingSnake, setIsPlayingSnake] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  // Keep isPlayingRef synced with state
  useEffect(() => {
    isPlayingRef.current = isPlayingSnake;
  }, [isPlayingSnake]);

  // Snake game state
  const gameStateRef = useRef<{
    cols: number;
    rows: number;
    snake: Point[];
    direction: Point;
    nextDirection: Point;
    food: Point;
    lastTick: number;
    tickInterval: number;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }>;
  }>({
    cols: 20,
    rows: 20,
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 16, y: 15 },
    lastTick: 0,
    tickInterval: 130,
    particles: []
  });

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

  // Spawn food helper
  const spawnFood = useCallback((cols: number, rows: number, snake: Point[]): Point => {
    const emptyCells: Point[] = [];
    for (let c = 1; c < cols - 1; c++) {
      for (let r = 1; r < rows - 1; r++) {
        const isOccupied = snake.some((s) => s.x === c && s.y === r);
        if (!isOccupied) {
          emptyCells.push({ x: c, y: r });
        }
      }
    }
    if (emptyCells.length === 0) return { x: 5, y: 5 };
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }, []);

  // Direction changer
  const changeDirection = useCallback((dx: number, dy: number) => {
    const game = gameStateRef.current;
    if (game.direction.x !== 0 && dx === -game.direction.x) return;
    if (game.direction.y !== 0 && dy === -game.direction.y) return;
    game.nextDirection = { x: dx, y: dy };
  }, []);

  // Keyboard controls (only active when playing snake)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        e.preventDefault();
        changeDirection(0, -1);
      } else if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        changeDirection(0, 1);
      } else if (key === "arrowleft" || key === "a") {
        e.preventDefault();
        changeDirection(-1, 0);
      } else if (key === "arrowright" || key === "d") {
        e.preventDefault();
        changeDirection(1, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection]);

  // Touch Swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 18) {
      if (!isPlayingRef.current) {
        setIsPlayingSnake(true);
      }
      if (absX > absY) {
        changeDirection(dx > 0 ? 1 : -1, 0);
      } else {
        changeDirection(0, dy > 0 ? 1 : -1);
      }
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();
    const game = gameStateRef.current;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width || (window.innerWidth < 640 ? 280 : 320);
      const h = rect.height || (window.innerWidth < 640 ? 280 : 320);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
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

      const isSnake = isPlayingRef.current;

      if (!isSnake) {
        // ==========================================
        // 1. ORIGINAL GENERATION MATRIX WAVE (IGUAL ANTES)
        // ==========================================
        const cols = 22;
        const rows = 22;
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

            // Original wave propagation from center outward
            const wave = Math.sin(dist * 0.045 - elapsed * 3.2);
            // Secondary cross ripple
            const wave2 = Math.cos(dx * 0.03 + elapsed * 1.8) * Math.sin(dy * 0.03 - elapsed * 1.8);
            // Twinkle noise
            const twinkle = Math.sin(c * 17.13 + r * 91.41 + elapsed * 4.5);

            // Center bias
            const centerBias = Math.max(0, 1 - dist / (maxDist * 0.65));
            let intensity = (wave + 1) * 0.35 + (wave2 + 1) * 0.2 + centerBias * 0.35;

            if (twinkle > 0.82) {
              intensity += 0.3;
            }

            intensity = Math.min(1, Math.max(0, intensity));

            ctx.beginPath();
            if (intensity > 0.52) {
              // Glowing dot
              const radius = 1.4 + intensity * 1.1;
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(56, 189, 248, ${0.45 + intensity * 0.55})`;
              ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
              ctx.shadowBlur = 7 * intensity;
              ctx.fill();
              ctx.shadowBlur = 0;
            } else {
              // Dim background dot
              ctx.arc(x, y, 1.1, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(148, 163, 184, ${0.08 + intensity * 0.12})`;
              ctx.fill();
            }
          }
        }
      } else {
        // ==========================================
        // 2. SNAKE GAME MODE (SEM ANIMAÇÃO DE GERAÇÃO)
        // ==========================================
        const cols = 20;
        const rows = 20;
        game.cols = cols;
        game.rows = rows;
        const cellW = width / cols;
        const cellH = height / rows;

        // Static dark dot grid (exact appearance from image)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = (c + 0.5) * cellW;
            const y = (r + 0.5) * cellH;
            ctx.beginPath();
            ctx.arc(x, y, 1.15, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(100, 116, 139, 0.28)";
            ctx.fill();
          }
        }

        // Update Snake logic
        if (now - game.lastTick > game.tickInterval) {
          game.lastTick = now;
          game.direction = game.nextDirection;

          const head = game.snake[0];
          const newHead = {
            x: head.x + game.direction.x,
            y: head.y + game.direction.y
          };

          // Wrap borders
          if (newHead.x < 0) newHead.x = cols - 1;
          if (newHead.x >= cols) newHead.x = 0;
          if (newHead.y < 0) newHead.y = rows - 1;
          if (newHead.y >= rows) newHead.y = 0;

          const selfHit = game.snake.some((s) => s.x === newHead.x && s.y === newHead.y);
          if (selfHit) {
            game.snake = [
              { x: 10, y: 10 },
              { x: 9, y: 10 },
              { x: 8, y: 10 },
              { x: 7, y: 10 },
              { x: 6, y: 10 }
            ];
            game.direction = { x: 1, y: 0 };
            game.nextDirection = { x: 1, y: 0 };
          } else {
            const ateFood = newHead.x === game.food.x && newHead.y === game.food.y;
            game.snake.unshift(newHead);

            if (ateFood) {
              // Food burst
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const speed = 35 + Math.random() * 40;
                game.particles.push({
                  x: (game.food.x + 0.5) * cellW,
                  y: (game.food.y + 0.5) * cellH,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 0.4,
                  maxLife: 0.4,
                  size: 2
                });
              }
              game.food = spawnFood(cols, rows, game.snake);
            } else {
              game.snake.pop();
            }
          }
        }

        // Draw Particles
        for (let i = game.particles.length - 1; i >= 0; i--) {
          const p = game.particles[i];
          p.x += p.vx * 0.016;
          p.y += p.vy * 0.016;
          p.life -= 0.016;
          if (p.life <= 0) {
            game.particles.splice(i, 1);
            continue;
          }
          const alpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.fill();
        }

        // Draw Food (Blue Glowing Dot)
        const foodX = (game.food.x + 0.5) * cellW;
        const foodY = (game.food.y + 0.5) * cellH;
        const foodRadius = Math.min(cellW, cellH) * 0.38;

        ctx.beginPath();
        ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Snake
        const snakeLen = game.snake.length;
        for (let i = snakeLen - 1; i >= 0; i--) {
          const seg = game.snake[i];
          const segX = (seg.x + 0.5) * cellW;
          const segY = (seg.y + 0.5) * cellH;

          if (i === 0) {
            // Head with 2 white eyes
            const headRadius = Math.min(cellW, cellH) * 0.44;
            ctx.beginPath();
            ctx.arc(segX, segY, headRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;

            const dir = game.direction;
            let eye1X = segX;
            let eye1Y = segY;
            let eye2X = segX;
            let eye2Y = segY;
            const eyeDist = headRadius * 0.38;
            const forwardOffset = headRadius * 0.32;

            if (dir.x === 1) {
              eye1X = segX + forwardOffset;
              eye1Y = segY - eyeDist;
              eye2X = segX + forwardOffset;
              eye2Y = segY + eyeDist;
            } else if (dir.x === -1) {
              eye1X = segX - forwardOffset;
              eye1Y = segY - eyeDist;
              eye2X = segX - forwardOffset;
              eye2Y = segY + eyeDist;
            } else if (dir.y === 1) {
              eye1X = segX - eyeDist;
              eye1Y = segY + forwardOffset;
              eye2X = segX + eyeDist;
              eye2Y = segY + forwardOffset;
            } else {
              eye1X = segX - eyeDist;
              eye1Y = segY - forwardOffset;
              eye2X = segX + eyeDist;
              eye2Y = segY - forwardOffset;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, 1.3, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, 1.3, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
          } else {
            // Body segments
            const ratio = 1 - (i / snakeLen) * 0.28;
            const bodyRadius = Math.min(cellW, cellH) * 0.36 * ratio;
            ctx.beginPath();
            ctx.arc(segX, segY, bodyRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
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
  }, [spawnFood]);

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (!isPlayingSnake) {
          setIsPlayingSnake(true);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-[280px] h-[280px] min-w-[280px] min-h-[280px] max-w-[280px] max-h-[280px] sm:w-[320px] sm:h-[320px] sm:min-w-[320px] sm:min-h-[320px] sm:max-w-[320px] sm:max-h-[320px] shrink-0 aspect-square rounded-2xl bg-[#04060a] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-between px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3 select-none my-1 cursor-pointer"
    >
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />

      {/* Top Header with changing phrase */}
      <div className="relative z-10 flex items-center justify-between w-full pt-0 px-0.5 pointer-events-none">
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

      {/* Center Matrix Dot Canvas & Snake Area */}
      <div className="absolute inset-x-0 top-10 sm:top-11 bottom-8 sm:bottom-9 px-3 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Row with Percentage Badge at Bottom-Right */}
      <div className="relative z-10 flex items-center justify-end w-full mt-auto pb-0.5 px-0.5 pointer-events-none">
        <div className="rounded-full px-3 py-1 bg-[#141824]/90 border border-slate-700/60 shadow-lg backdrop-blur-md flex items-center">
          <span className="text-sky-400 font-mono font-semibold text-xs tracking-tight">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
