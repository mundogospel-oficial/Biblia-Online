import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export type CardFormat = "square" | "story" | "landscape";

interface VerseCardProps {
  text: string;
  reference: string;
  theme: CardTheme;
  format?: CardFormat;
  animate?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontClass?: string;
  textColor?: string;
  customBgColor?: string;
}

export interface CardTheme {
  name: string;
  bg: string;
  text: string;
  accent: string;
  style?: string;
}

export const themes: CardTheme[] = [
  { name: "Marfim", bg: "bg-[hsl(40,33%,96%)]", text: "text-[hsl(220,30%,15%)]", accent: "bg-[hsl(38,70%,50%)]" },
  { name: "Noturno", bg: "bg-[hsl(220,30%,12%)]", text: "text-[hsl(40,20%,92%)]", accent: "bg-[hsl(38,70%,50%)]" },
  { name: "Terracota", bg: "bg-[hsl(15,40%,30%)]", text: "text-[hsl(35,30%,92%)]", accent: "bg-[hsl(35,60%,60%)]" },
  { name: "Oliva", bg: "bg-[hsl(140,20%,22%)]", text: "text-[hsl(80,15%,90%)]", accent: "bg-[hsl(80,30%,55%)]" },
  { name: "Lavanda", bg: "bg-[hsl(260,25%,20%)]", text: "text-[hsl(260,15%,90%)]", accent: "bg-[hsl(280,40%,60%)]" },
  { name: "Oceano", bg: "bg-[hsl(200,40%,18%)]", text: "text-[hsl(195,20%,92%)]", accent: "bg-[hsl(195,50%,50%)]" },
  { name: "Azul Royal", bg: "bg-[hsl(215,50%,15%)]", text: "text-[hsl(210,30%,95%)]", accent: "bg-[hsl(210,70%,55%)]" },
  { name: "Meia-Noite", bg: "bg-[hsl(230,35%,10%)]", text: "text-[hsl(230,20%,90%)]", accent: "bg-[hsl(245,50%,60%)]" },
  { name: "Pôr do Sol", bg: "bg-[hsl(20,50%,20%)]", text: "text-[hsl(35,40%,95%)]", accent: "bg-[hsl(30,80%,55%)]" },
  { name: "Floresta", bg: "bg-[hsl(160,30%,14%)]", text: "text-[hsl(150,20%,92%)]", accent: "bg-[hsl(160,50%,45%)]" },
  { name: "Rosa Antigo", bg: "bg-[hsl(340,20%,18%)]", text: "text-[hsl(340,15%,92%)]", accent: "bg-[hsl(340,50%,60%)]" },
  { name: "Dourado", bg: "bg-[hsl(40,30%,12%)]", text: "text-[hsl(42,40%,92%)]", accent: "bg-[hsl(42,80%,55%)]" },
];

const formatClasses: Record<CardFormat, string> = {
  square: "aspect-square",
  story: "aspect-[9/16]",
  landscape: "aspect-video",
};

const VerseCard = forwardRef<HTMLDivElement, VerseCardProps>(
  ({ text, reference, theme, format = "square", animate = true, fontSize = 24, fontFamily, fontClass, textColor, customBgColor }, ref) => {
    const Wrapper = animate ? motion.div : "div";
    const wrapperProps = animate
      ? { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 } }
      : {};

    const bgStyle = customBgColor ? { backgroundColor: customBgColor } : undefined;

    return (
      <Wrapper
        ref={ref}
        {...(wrapperProps as any)}
        style={bgStyle}
        className={`relative overflow-hidden rounded-2xl ${theme.bg} ${theme.text} shadow-verse ${formatClasses[format]} flex flex-col items-center justify-center p-8 sm:p-12 w-full`}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full ${theme.accent}/30`} />
          <div className={`absolute -bottom-8 -left-8 h-32 w-32 rounded-full ${theme.accent}/20`} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
          {!text ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles className="h-8 w-8 opacity-40 mb-3 animate-pulse" />
              <p className="text-sm font-sans font-medium opacity-60 tracking-normal">
                Busque um versículo para começar
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="h-px w-16 bg-current opacity-30" />
              </div>
              <blockquote 
                className={`leading-relaxed text-center ${fontClass || "font-serif italic"}`}
                style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily || undefined, color: textColor || undefined }}
              >
                "{text}"
              </blockquote>
              {reference ? (
                <>
                  <div className="mt-6 flex justify-center">
                    <div className="h-px w-16 bg-current opacity-30" />
                  </div>
                  <p className="mt-4 text-center text-sm font-sans font-medium opacity-80 tracking-wider uppercase">
                    {reference}
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>

        {/* Marca d'água permanente no canto direito */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-none select-none">
          <img 
            src="/logo-white.png" 
            alt="" 
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            className="h-6 sm:h-8 w-auto object-contain opacity-40 drop-shadow-sm pointer-events-none select-none no-copy-logo"
          />
        </div>
      </Wrapper>
    );
  }
);

VerseCard.displayName = "VerseCard";

export default VerseCard;
