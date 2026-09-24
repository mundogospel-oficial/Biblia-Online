import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Languages, Scroll } from "lucide-react";

interface BiblicalAIOrbProps {
  size?: "sm" | "md" | "lg";
  variant?: "dictionary" | "bilingual";
  className?: string;
}

/**
 * Sacred Biblical AI Orb:
 * Features a glowing celestial halo, smooth orbital rings, and a sacred breathing icon.
 * Replaces generic spinning star icons with a revered, divine Biblical AI aesthetic.
 */
export const BiblicalAIOrb: React.FC<BiblicalAIOrbProps> = ({
  size = "md",
  variant = "dictionary",
  className = "",
}) => {
  const sizeMap = {
    sm: {
      container: "h-6 w-6",
      outerRing: "-inset-0.5",
      innerGlow: "h-5 w-5",
      iconSize: "h-3 w-3",
    },
    md: {
      container: "h-8 w-8",
      outerRing: "-inset-1",
      innerGlow: "h-7 w-7",
      iconSize: "h-4 w-4",
    },
    lg: {
      container: "h-11 w-11",
      outerRing: "-inset-1.5",
      innerGlow: "h-9 w-9",
      iconSize: "h-5 w-5",
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${currentSize.container} ${className}`}>
      {/* Radiant Divine Aura (soft pulse behind the icon) */}
      <motion.div
        animate={{
          scale: [0.85, 1.25, 0.85],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/40 to-amber-300/20 blur-md pointer-events-none"
      />

      {/* Outer Celestial Golden Halo (smooth rotating orbital aura) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute ${currentSize.outerRing} rounded-full border border-dashed border-amber-400/60 pointer-events-none`}
      />

      {/* Inner Concentric Golden Orbit Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute inset-0 rounded-full border border-yellow-500/30 pointer-events-none`}
      />

      {/* Sacred Central Orb */}
      <motion.div
        animate={{
          scale: [0.94, 1.06, 0.94],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.45)] border border-amber-300/40 ${currentSize.innerGlow}`}
      >
        {variant === "bilingual" ? (
          <Languages className={`${currentSize.iconSize} drop-shadow-sm text-amber-50`} />
        ) : (
          <BookOpen className={`${currentSize.iconSize} drop-shadow-sm text-amber-50`} />
        )}
      </motion.div>
    </div>
  );
};

interface BiblicalAIDictionaryLoadingProps {
  language?: string;
}

/**
 * Biblical AI Theological Dictionary Generation Card:
 * Displays rotating scholarly theological steps (Hebrew/Greek lexicons, context, exegesis)
 * and sacred shimmering skeleton loaders.
 */
export const BiblicalAIDictionaryLoading: React.FC<BiblicalAIDictionaryLoadingProps> = ({
  language = "pt",
}) => {
  const isEn = language === "en";

  const phrases = isEn
    ? [
        "Consulting Hebrew and Greek biblical lexicons...",
        "Examining historical and theological exegesis...",
        "Illuminating scripture with Biblical AI...",
        "Structuring doctrinal and practical insights...",
      ]
    : [
        "Consultando léxico bíblico original (Hebraico e Grego)...",
        "Examinando exegese e contexto histórico-teológico...",
        "Iluminando as Sagradas Escrituras com a IA Bíblica...",
        "Estruturando explicação doutrinária e pastoral...",
      ];

  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    setPhraseIndex(0);
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="space-y-3 py-2 select-none">
      {/* Header with Biblical AI Orb and Divine Thinking Steps */}
      <div className="flex items-center gap-3">
        <BiblicalAIOrb size="md" variant="dictionary" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/90 font-mono">
              IA BÍBLICA TEOLÓGICA
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="h-5 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIndex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-xs font-medium text-foreground/90 tracking-tight truncate"
              >
                {phrases[phraseIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sacred Golden Shimmer Skeletal Bars */}
      <div className="space-y-2 pt-1">
        <div className="relative h-2.5 w-4/5 rounded-full overflow-hidden bg-amber-500/10 border border-amber-500/20">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent w-1/2"
          />
        </div>
        <div className="relative h-2.5 w-full rounded-full overflow-hidden bg-amber-500/10 border border-amber-500/20">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.2 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent w-1/2"
          />
        </div>
        <div className="relative h-2.5 w-3/4 rounded-full overflow-hidden bg-amber-500/10 border border-amber-500/20">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut", delay: 0.4 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent w-1/2"
          />
        </div>
      </div>
    </div>
  );
};

interface BiblicalAIBilingualBannerProps {
  currentCount: number;
  totalCount: number;
  language?: string;
}

/**
 * Biblical AI Bilingual Streaming Banner:
 * Features the sacred orb with celestial halo and radiant real-time translation progress.
 */
export const BiblicalAIBilingualBanner: React.FC<BiblicalAIBilingualBannerProps> = ({
  currentCount,
  totalCount,
  language = "pt",
}) => {
  const isEn = language === "en";
  const percent = Math.min(100, Math.round((currentCount / (totalCount || 1)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mb-4 p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 backdrop-blur-md shadow-md space-y-2.5"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <BiblicalAIOrb size="sm" variant="bilingual" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                IA BÍBLICA TRADUTORA
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-foreground/90">
              {isEn
                ? "Translating Sacred Scriptures in real-time..."
                : "Iluminando as Sagradas Escrituras em tempo real..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full text-amber-300 font-mono text-[11px] font-bold">
          <span>{currentCount}</span>
          <span className="opacity-50">/</span>
          <span>{totalCount}</span>
        </div>
      </div>

      {/* Radiant Golden Shimmer Progress Track */}
      <div className="relative h-2 w-full bg-amber-950/40 border border-amber-500/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
          style={{ width: `${percent}%` }}
        />
        {/* Divine glint sweeping along the track */}
        <motion.div
          animate={{ x: ["-100%", "250%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/3 pointer-events-none"
        />
      </div>
    </motion.div>
  );
};

interface BiblicalAIVerseTranslatingProps {
  language?: string;
}

/**
 * Subtle Biblical AI indicator for individual verse being translated
 */
export const BiblicalAIVerseTranslating: React.FC<BiblicalAIVerseTranslatingProps> = ({
  language = "pt",
}) => {
  const isEn = language === "en";

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-400/90 select-none py-0.5">
      <BiblicalAIOrb size="sm" variant="bilingual" className="scale-75 origin-left" />
      <span className="italic text-[11px] font-medium text-amber-300/90">
        {isEn ? "Translating with Biblical AI..." : "Traduzindo com IA Bíblica..."}
      </span>
    </div>
  );
};
