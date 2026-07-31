import React, { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import {
  Send, ArrowUp, Trash2, Sparkles, GraduationCap, X,
  Plus, Image, ImagePlus, Upload, Video, Music, Download, LogIn,
  History, ChevronLeft, Zap, Bot, Paperclip, AlertCircle, MessageSquarePlus, Square, Share2,
  Loader2, ImageOff, FileText, ZoomIn, ZoomOut, WifiOff, Palette, ChevronDown, Check,
  Search, Edit3, Clock, ArrowRight, ShieldAlert, Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError } from "@/contexts/AuthContext";

import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";

import { askBibleAI, AIAttachment } from "@/services/aiService";
import { checkAndIncrementUsage, getUserUsage, refundUsage } from "@/services/usageService";
import { saveAIHistory } from "@/services/userDataService";
import { syncKeyToSupabase } from "@/services/userSyncService";
import { generateBiblicalImage } from "@/services/imageGenerationService";
import { APP_WHITE_LOGO_DATA_URL } from "@/assets/appLogoWhite";
import { encryptConversationMessages, decryptConversationMessages } from "@/lib/security/cryptoService";
import { safeSetLocalStorage } from "@/lib/storage";
import { maskPiiInText } from "@/lib/security/privacyGuard";
import { validateImageContent } from "@/services/imageModerationService";

const formatMessageForDisplay = (text: string): string => {
  if (!text) return "";
  // Limpa as tags completas e também qualquer tag que possivelmente foi cortada no final
  return text.replace(/\[.*?\]/g, '').replace(/\[[^\]]*$/, '').trim();
};

const cleanImageLinksFromText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/!\[.*?\]/g, '')
    .replace(/!\(data:image.*?\)/g, '')
    .replace(/!\(https?:\/\/.*?\)/g, '')
    .replace(/\[data:image.*?\]/g, '')
    .replace(/\(data:image.*?\)/g, '')
    .replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const generateTitleFromAI = (msgs: Msg[]): string => {
  if (!msgs || msgs.length === 0) return "Conversa Bíblica";

  const assistantMsg = msgs.find(m => m.role === "assistant");
  const userMsg = msgs.find(m => m.role === "user");

  if (!assistantMsg || !assistantMsg.content) {
    if (userMsg?.content) {
      const cleanUser = cleanImageLinksFromText(formatMessageForDisplay(userMsg.content)).replace(/\[.*?\]/g, '').trim();
      return cleanUser ? `Pergunta: ${cleanUser.slice(0, 32)}...` : "Nova Conversa";
    }
    return "Conversa Bíblica";
  }

  const rawContent = assistantMsg.content.trim();

  // Se a resposta for estritamente uma imagem gerada pela IA
  if (rawContent.startsWith("http") || rawContent.startsWith("data:image") || rawContent.includes("generate-chat-image")) {
    if (userMsg?.content) {
      const cleanUser = cleanImageLinksFromText(formatMessageForDisplay(userMsg.content)).replace(/\[.*?\]/g, '').trim();
      return `Arte Bíblica: ${cleanUser.slice(0, 32) || "Ilustração"}`;
    }
    return "Ilustração Bíblica Sagrada";
  }

  const content = cleanImageLinksFromText(rawContent);

  // Tenta extrair o primeiro título em negrito gerado pela IA (**Título**)
  const boldMatches = Array.from(content.matchAll(/\*\*(.*?)\*\*/g));
  for (const match of boldMatches) {
    if (match[1]) {
      const rawBold = match[1].trim();
      const cleanBold = rawBold
        .replace(/^(título|tema|assunto|estudo|reflexão|música|vídeo|aula|resposta):\s*/i, '')
        .replace(/\[.*?\]/g, '')
        .trim();

      if (
        cleanBold.length >= 3 && 
        cleanBold.length <= 60 && 
        !cleanBold.toLowerCase().startsWith("regras") && 
        !cleanBold.toLowerCase().startsWith("limite")
      ) {
        return cleanBold.charAt(0).toUpperCase() + cleanBold.slice(1);
      }
    }
  }

  // Se não encontrar negrito, pega a primeira frase significativa da resposta da IA
  const cleanContent = formatMessageForDisplay(content)
    .replace(/^(\d+\.|-|•|\*)\s*/, '')
    .replace(/^(com certeza|olá|paz do senhor|graça e paz|com prazer|excelente pergunta|que bênção)[!,.\s]*/i, '')
    .trim();

  const lines = cleanContent.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/\*\*/g, '').replace(/\[.*?\]/g, '').trim();
    if (firstLine) {
      const shortTitle = firstLine.slice(0, 42).trim();
      return shortTitle.length < firstLine.length ? `${shortTitle}...` : shortTitle;
    }
  }

  return "Resposta Bíblica com IA";
};

const formatRelativeDate = (timestamp: number): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Hoje às ${timeStr}`;
  if (isYesterday) return `Ontem às ${timeStr}`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ` às ${timeStr}`;
};

const getConversationCategoryInfo = (conv: Conversation) => {
  const lastMsg = conv.messages[conv.messages.length - 1];
  const firstUserMsg = conv.messages.find(m => m.role === 'user')?.content || "";
  const content = lastMsg?.content || "";

  if (content.startsWith("http") || content.startsWith("data:image") || firstUserMsg.includes("[Modo: Imagem]") || firstUserMsg.includes("[Modo: Gerar Imagem]")) {
    return { label: "Imagem", category: "image", icon: Image, badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  }

  if (
    conv.engine === "complexo" ||
    firstUserMsg.includes("[Modo: Aprendizado]") ||
    firstUserMsg.includes("[Modo: Gerar Vídeo]") ||
    firstUserMsg.includes("[Modo: Criar Música]") ||
    firstUserMsg.includes("[Modo: Vídeo]") ||
    firstUserMsg.includes("[Modo: Música]")
  ) {
    return { label: "IA Complexa", category: "complex", icon: Bot, badgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
  }

  return { label: "IA Simples", category: "simple", icon: Zap, badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
};

const getConversationPreview = (conv: Conversation): string => {
  const assistantMsgs = conv.messages.filter(m => m.role === "assistant");
  if (assistantMsgs.length === 0) return "Aguardando resposta da IA...";

  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  const text = lastAssistant.content || "";

  if (text.startsWith("http") || text.startsWith("data:image")) {
    return "🎨 Imagem bíblica gerada pela IA";
  }

  const textWithoutImages = cleanImageLinksFromText(text);

  const cleanText = formatMessageForDisplay(textWithoutImages)
    .replace(/^(\d+\.|-|•|\*)\s*/, '')
    .replace(/\*\*/g, '')
    .trim();

  if (!cleanText) {
    return "🎨 Imagem bíblica gerada pela IA";
  }

  return cleanText.slice(0, 110) + (cleanText.length > 110 ? "..." : "");
};

const getFilesForMessage = (m: Msg) => {
  if (m.files && m.files.length > 0) {
    return m.files;
  }
  if (m.fileName) {
    return m.fileName.split(', ').map(name => {
      const isImg = name.toLowerCase().match(/\.(jpe?g|png|gif|webp|svg)$/);
      return {
        name,
        size: undefined,
        type: isImg ? "image/png" : "application/octet-stream"
      };
    });
  }
  return [];
};

type Msg = { role: "user" | "assistant"; content: string; image?: string; fileName?: string; files?: Array<{ name: string; size?: number; type?: string }> };

const defaultSuggestions = [
  "O que significa João 3:16?",
  "Quem foi o rei Davi?",
  "O que a Bíblia diz sobre ansiedade?",
  "Explique as parábolas de Jesus",
  "Me ensine sobre os frutos do Espírito",
  "Qual a história de Moisés?",
];

const imageSuggestions = [
  "Cruz de Cristo ao pôr do sol em alta resolução",
  "Arca de Noé sob o arco-íris no mar",
  "Moisés abrindo o Mar Vermelho em glória",
  "O Rei Davi tocando harpa nos campos de Belém",
  "A criação do mundo e a luz divina brilhando",
  "A última ceia de Jesus com os doze discípulos",
];

const videoSuggestions = [
  "Roteiro para Reels sobre o Salmo 91",
  "Vídeo curto explicando a parábola do filho pródigo",
  "Roteiro educativo sobre as doze tribos de Israel",
  "Mini documentário sobre a vida do Apóstolo Paulo",
  "Esboço para vídeo de reflexão matinal",
  "Roteiro para Shorts: 3 versículos sobre esperança",
];

const musicSuggestions = [
  "Letra de louvor congregacional sobre gratidão",
  "Composição acústica de adoração e paz",
  "Hino solene inspirado no Salmo 23",
  "Letra de música jovem sobre fé e propósito",
  "Canção de ninar cristã para crianças",
  "Louvor de celebração e vitória em Cristo",
];

const learningSuggestions = [
  "Estudo aprofundado sobre o livro de Romanos",
  "Contexto histórico do Sermão da Montanha",
  "Explique as alianças bíblicas no Antigo Testamento",
  "Significado dos nomes de Deus na Bíblia",
  "Diferença entre lei e graça no Novo Testamento",
  "Estudo sobre os dons do Espírito Santo",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-chat`;
const GEMINI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;
const GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-image`;

const getConversationsKey = (userSub?: string) => {
  return userSub ? `ia-biblica-conversations_${userSub}` : "ia-biblica-conversations_guest";
};

// Daily limits - Sincronizado com usageService.ts
const LIMIT_COMPLEX = 5;
const LIMIT_SIMPLE = 7;
const LIMIT_IMAGE = 3;

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  timestamp: number;
  engine?: "simples" | "complexo";
}

interface ThinkingSpinnerProps {
  engine?: "simples" | "complexo";
  mode?: "chat" | "image" | "video" | "music";
}

const ThinkingSpinner = ({ engine = "simples", mode = "chat" }: ThinkingSpinnerProps) => {
  if (mode === "image") {
    return (
      <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-amber-500/60"
        />
        <motion.div
          animate={{ scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image className="h-3.5 w-3.5 text-amber-500" />
        </motion.div>
      </div>
    );
  }

  if (mode === "video") {
    return (
      <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dotted border-purple-500/70"
        />
        <motion.div
          animate={{ scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Video className="h-3.5 w-3.5 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  if (mode === "music") {
    return (
      <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-sky-400/50"
        />
        <motion.div
          animate={{ y: [-1, 1, -1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Music className="h-3.5 w-3.5 text-sky-400" />
        </motion.div>
      </div>
    );
  }

  if (engine === "simples") {
    return (
      <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-amber-500/30 border-t-amber-500"
        />
        <motion.div
          animate={{ scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="h-3 w-3 text-amber-500 fill-amber-500/20" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-accent/30 border-t-accent border-b-primary"
      />
      <motion.div
        animate={{ scale: [0.85, 1.1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bot className="h-3.5 w-3.5 text-accent" />
      </motion.div>
    </div>
  );
};

const ImageGeneratingBubble = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const phrases = [
    "Interpretando o tema e iluminação bíblica...",
    "Renderizando fotorrealismo e iluminação de estúdio...",
    "Refinando rostos, olhos e textura de pele ultra-realista...",
    "Finalizando ilustração de alta definição em 8K..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % phrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-400/35 dark:border-sky-400/25 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-sky-950/90 backdrop-blur-2xl p-3.5 sm:p-4 shadow-[0_8px_32px_0_rgba(2,132,199,0.3)] dark:shadow-[0_8px_32px_0_rgba(2,132,199,0.5)] min-w-[270px] sm:min-w-[340px]">
      {/* Liquid Glass Specular Blue Highlight */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-sky-400/25 via-blue-400/10 to-transparent rounded-t-2xl pointer-events-none" />

      {/* Floating Ambient Blue Liquid Light Orbs */}
      <motion.div
        animate={{
          x: [-12, 16, -12],
          y: [-8, 8, -8],
          scale: [0.9, 1.2, 0.9],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-sky-500/30 blur-2xl pointer-events-none"
      />
      <motion.div
        animate={{
          x: [12, -14, 12],
          y: [8, -8, 8],
          scale: [1.15, 0.85, 1.15],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-blue-600/35 blur-2xl pointer-events-none"
      />

      {/* Liquid Shimmer Light Sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-300/20 to-transparent animate-shimmer pointer-events-none" />

      {/* Glowing Blue Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-300 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.9)] animate-pulse" />

      <div className="flex items-center gap-3 relative z-10">
        {/* Liquid Glass Icon Badge */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-900/40 border border-sky-400/40 shadow-[0_4px_16px_rgba(2,132,199,0.25)] backdrop-blur-md">
          {/* Animated liquid gradient outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-0.5 rounded-2xl p-[1.5px] bg-gradient-to-tr from-sky-400 via-blue-500 to-cyan-300 opacity-90 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-2xl border border-dashed border-sky-300/80"
          />
          <Wand2 className="h-4 sm:h-5 w-4 sm:w-5 text-sky-300 animate-pulse drop-shadow-[0_0_10px_rgba(56,189,248,0.9)] z-10" />
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-sky-100 flex items-center gap-1.5 tracking-tight drop-shadow-sm">
              Gerando Imagem com IA
              <Sparkles className="h-3.5 w-3.5 text-sky-300 animate-spin" style={{ animationDuration: '3.5s' }} />
            </span>
          </div>

          <div className="h-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={stepIndex}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-[11px] sm:text-xs text-sky-200/90 truncate block font-medium tracking-wide"
              >
                {phrases[stepIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

const ResilientImage: React.FC<ResilientImageProps> = ({ src, alt, className = "absolute inset-0 w-full h-full object-cover", onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    // If image has already completed loading (cached, base64 data URI), disable loader
    if (imgRef.current && imgRef.current.complete) {
      setIsLoading(false);
    }
  }, [src]);

  return (
    <div 
      className={`relative w-full h-full bg-muted flex items-center justify-center overflow-hidden rounded-xl ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
          <Loader2 className="h-6 w-6 text-accent animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-medium">Carregando imagem...</span>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-4 text-center border border-border rounded-xl">
          <ImageOff className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <span className="text-xs text-muted-foreground font-semibold">Falha ao carregar imagem</span>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
            Ocorreu um erro ao carregar a imagem gerada. Por favor, tente novamente de forma consistente.
          </p>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className} ${onClick ? 'hover:scale-[1.02] transition-transform duration-300' : ''}`}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
};

type ModeKey = "image" | "video" | "learning" | "music";
type AIEngine = "complexo" | "simples";

const modes: { key: ModeKey; icon: React.ReactNode; label: string; prefix: string }[] = [
  { key: "image", icon: <Image className="h-4 w-4" />, label: "Gerar Imagens", prefix: "[Modo: Gerar Imagem] " },
  { key: "video", icon: <Video className="h-4 w-4" />, label: "Roteiros de Vídeo", prefix: "[Modo: Gerar Vídeo] " },
  { key: "learning", icon: <GraduationCap className="h-4 w-4" />, label: "Aprendizado", prefix: "[Modo: Aprendizado] " },
  { key: "music", icon: <Music className="h-4 w-4" />, label: "Criar Músicas", prefix: "[Modo: Criar Música] " },
];

export type ImageStyleOption = {
  id: string;
  label: string;
  badge: string;
  promptAddon: string;
  description: string;
};

const IMAGE_STYLES: ImageStyleOption[] = [
  {
    id: "cinematic",
    label: "Cinematográfico",
    badge: "Cinematográfico",
    promptAddon: "CINEMATOGRÁFICO: Ultra-realistic epic movie still, masterwork dramatic lighting, tack-sharp focal precision across entire face and eyes, perfectly aligned symmetrical human eyes with identical matching dark brown irises, flawless round dark pupils, crisp razor-sharp iris texture without blur or double pupils, 100% sharp focus on both eyes, pristine natural skin texture, masterwork 8k resolution, no motion blur, no depth of field blur on eyes, no cat eyes, no split pupils, no double irises, no heterochromia, no strabismus, no deformed eyes, no cloudy irises, ultra sharp eyes",
    description: "Luz de cinema épica com nitidez total e olhos perfeitos"
  },
  {
    id: "animation",
    label: "Animação 3D",
    badge: "Animação 3D",
    promptAddon: "ANIMAÇÃO 3D: 3D animated character art style, smooth Pixar/Disney rendering, soft subsurface scattering lighting, expressive features, clear aligned eyes with razor-sharp pupil clarity, vibrant color palette",
    description: "Estilo 3D estilizado Pixar e Disney"
  },
  {
    id: "pixel",
    label: "Pixel Art",
    badge: "Pixel Art",
    promptAddon: "PIXEL ART: Detailed 16-bit pixel art style, retro video game aesthetic, crisp pixel edges, nostalgic color palette, masterfully crafted pixel scene",
    description: "Arte retrô 16-bit em pixels"
  },
  {
    id: "realistic",
    label: "Fotorrealismo",
    badge: "Fotorrealismo",
    promptAddon: "FOTORREALISMO: Award-winning ultra-realistic DSLR portrait photography, 8k UHD, bright soft natural daylight, pristine clean skin, tack-sharp focal precision across entire face and eyes, perfectly aligned symmetrical human eyes with identical matching dark brown irises, flawless round dark pupils, crisp razor-sharp iris texture without blur or double pupils, 100% sharp focus on both eyes, authentic historical accuracy, no motion blur, no depth of field blur on eyes, no cat eyes, no split pupils, no double irises, no heterochromia, no strabismus, no deformed eyes, no cloudy irises, ultra sharp eyes",
    description: "Fotografia fotorrealista com nitidez máxima e olhos hiper-detalhados"
  },
  {
    id: "anime",
    label: "Anime / Desenho",
    badge: "Anime",
    promptAddon: "ANIME: High quality Studio Ghibli inspired anime illustration, clean line art, luminous lighting, vibrant colors, detailed hand-drawn anime aesthetic",
    description: "Ilustração estilo Ghibli / Manga"
  },
];

const AIPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("query");
    if (qParam) {
      setInput(qParam);
    }
  }, [searchParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyleOption | null>(() => IMAGE_STYLES.find(s => s.id === "cinematic") || IMAGE_STYLES[0]);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyFilterCategory, setHistoryFilterCategory] = useState<"all" | "simple" | "complex" | "image">("all");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleInput, setEditingTitleInput] = useState("");
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);

  const activeSuggestions = 
    activeMode === "image"
      ? imageSuggestions
      : activeMode === "video"
      ? videoSuggestions
      : activeMode === "music"
      ? musicSuggestions
      : activeMode === "learning"
      ? learningSuggestions
      : defaultSuggestions;
  const [aiEngine, setAiEngine] = useState<AIEngine>("simples");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ name: string; url: string | null; type: string; size: number }>>([]);
  const [brokenPreviews, setBrokenPreviews] = useState<Record<number, boolean>>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  useEffect(() => {
    if (!lightboxImage) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [lightboxImage]);

  const lightboxImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const imgEl = lightboxImgRef.current;
    if (!imgEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomScale(prev => {
        const newScale = prev - e.deltaY * 0.004;
        const finalScale = Math.min(Math.max(newScale, 1), 4.5);
        if (finalScale <= 1) {
          setPanOffset({ x: 0, y: 0 });
        }
        return finalScale;
      });
    };

    imgEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      imgEl.removeEventListener("wheel", onWheel);
    };
  }, [lightboxImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDraggingImage(true);
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingImage && zoomScale > 1) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      const maxPanX = (zoomScale - 1) * 300;
      const maxPanY = (zoomScale - 1) * 300;
      setPanOffset({
        x: Math.min(Math.max(newX, -maxPanX), maxPanX),
        y: Math.min(Math.max(newY, -maxPanY), maxPanY)
      });
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDraggingImage(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (zoomScale > 1) {
        setIsDraggingImage(true);
        const touch = e.touches[0];
        dragStart.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingImage && zoomScale > 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.current.x;
      const newY = touch.clientY - dragStart.current.y;
      const maxPanX = (zoomScale - 1) * 300;
      const maxPanY = (zoomScale - 1) * 300;
      setPanOffset({
        x: Math.min(Math.max(newX, -maxPanX), maxPanX),
        y: Math.min(Math.max(newY, -maxPanY), maxPanY)
      });
    } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastTouchDistance.current;
      setZoomScale(prev => {
        const newScale = prev + delta * 0.015;
        const finalScale = Math.min(Math.max(newScale, 1), 4.5);
        if (finalScale <= 1) {
          setPanOffset({ x: 0, y: 0 });
        }
        return finalScale;
      });
      lastTouchDistance.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingImage(false);
    lastTouchDistance.current = null;
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
    }
  };

  useEffect(() => {
    setBrokenPreviews({});
    // Generate object URLs for images, other files get null url
    const newPreviews = attachedFiles.map(file => {
      if (file.type.startsWith("image/")) {
        return {
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size
        };
      }
      return {
        name: file.name,
        url: null,
        type: file.type,
        size: file.size
      };
    });

    setPreviews(newPreviews);

    // Cleanup function to revoke Object URLs
    return () => {
      newPreviews.forEach(p => {
        if (p.url) {
          try {
            URL.revokeObjectURL(p.url);
          } catch (e) {
            console.error("Erro ao revogar URL do anexo:", e);
          }
        }
      });
    };
  }, [attachedFiles]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentChatIdRef = useRef<string | null>(null); // NOVO: Referência para manter o ID da conversa atual
  
  const { toast } = useToast();

  const [chatUsed, setChatUsed] = useState(0);
  const [imageUsed, setImageUsed] = useState(0);
  const [geminiUsed, setGeminiUsed] = useState(0);
  const [usageStats, setUsageStats] = useState({ simple: 0, complex: 0, image: 0 });
  const [limitReached, setLimitReached] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const isMobileScreen = () => window.innerWidth < 768;

    const handleFocusIn = (e: FocusEvent) => {
      if (!isMobileScreen()) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        setIsKeyboardOpen(true);
        if (window.visualViewport) {
          setViewportHeight(window.visualViewport.height);
        }
        window.scrollTo(0, 0);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    };

    const handleFocusOut = () => {
      if (!isMobileScreen()) return;
      setIsKeyboardOpen(false);
      setViewportHeight(null);
      window.scrollTo(0, 0);
    };

    const handleViewportResize = () => {
      if (!isMobileScreen()) {
        setIsKeyboardOpen(false);
        setViewportHeight(null);
        return;
      }
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const isSmall = currentHeight < window.innerHeight * 0.85;
        setIsKeyboardOpen(isSmall);
        if (isSmall) {
          setViewportHeight(currentHeight);
          window.scrollTo(0, 0);
        } else {
          setViewportHeight(null);
        }
      }
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
      window.visualViewport.addEventListener("scroll", handleViewportResize);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
        window.visualViewport.removeEventListener("scroll", handleViewportResize);
      }
    };
  }, []);

  // Função blindada para garantir que o token JWT nunca seja inválido
  const getFreshToken = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const wasCleaned = await handleAuthError(error);
        if (wasCleaned) {
          toast({ title: "Sessão expirada", description: "Faça login novamente para continuar.", variant: "destructive" });
          return null;
        }

        if (error.message.includes("Failed to fetch")) {
          toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor. Verifique sua internet.", variant: "destructive" });
          return null;
        }
        throw error;
      }

      if (!session || !session.access_token) {
        toast({ title: "Sessão expirada ou inválida. Faça login novamente.", variant: "destructive" });
        await forceSignOut();
        return null;
      }
      return session.access_token;
    } catch (e: any) {
      console.error("Erro crítico ao obter token:", e);
      return null;
    }
  };

  useEffect(() => {
    async function loadSavedConversations() {
      const userSecret = user?.sub;
      const userKey = getConversationsKey(userSecret);

      // Se o usuário está logado, mescla conversas criadas no modo visitante se existirem
      if (userSecret) {
        const guestKey = "ia-biblica-conversations_guest";
        const guestData = localStorage.getItem(guestKey);
        if (guestData) {
          try {
            const guestConvs: Conversation[] = JSON.parse(guestData);
            if (guestConvs.length > 0) {
              const localData = localStorage.getItem(userKey);
              let localConvs: Conversation[] = localData ? JSON.parse(localData) : [];
              const existingIds = new Set(localConvs.map(c => c.id));
              const merged = [...guestConvs.filter(c => !existingIds.has(c.id)), ...localConvs];
              safeSetLocalStorage(userKey, JSON.stringify(merged));
              localStorage.removeItem(guestKey);
            }
          } catch (e) {
            console.error("Erro ao mesclar conversas de visitante:", e);
          }
        }

        try {
          await loadKeyFromSupabase("AI_CONVERSATIONS", userKey);
        } catch (e) {
          console.warn("Não foi possível buscar do Supabase, mantendo dados locais:", e);
        }
      }

      try {
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const parsed: Conversation[] = JSON.parse(saved);
          const decryptedConversations = await Promise.all(
            parsed.map(async (c) => {
              const msgs = userSecret ? await decryptConversationMessages(c.messages, userSecret) : c.messages;
              const assistantMsg = msgs.find(m => m.role === 'assistant');
              const firstUserMsg = msgs.find(m => m.role === 'user')?.content || "";

              let finalTitle = c.title;
              if (assistantMsg && (!c.title || c.title === "Conversa" || c.title === firstUserMsg || c.title === formatMessageForDisplay(firstUserMsg).slice(0, 50))) {
                finalTitle = generateTitleFromAI(msgs);
              }

              return {
                ...c,
                title: finalTitle || "Conversa Bíblica",
                messages: msgs
              };
            })
          );
          setConversations(decryptedConversations);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.warn("Erro ao carregar histórico de conversas:", err);
        setConversations([]);
      }
    }
    loadSavedConversations();
  }, [user?.sub]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserUsage(user.sub);
      setUsageStats({
        simple: data.simple_count || 0,
        complex: data.complex_count || 0,
        image: data.image_count || 0,
      });
    } catch (e) {
      console.error("Erro ao buscar estatísticas de uso:", e);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (activeMode === "image") {
      setLimitReached(usageStats.image >= LIMIT_IMAGE);
    } else if (activeMode && (activeMode === "video" || activeMode === "music")) {
      setLimitReached(usageStats.complex >= LIMIT_COMPLEX);
    } else if (aiEngine === "simples") {
      setLimitReached(usageStats.simple >= LIMIT_SIMPLE);
    } else {
      setLimitReached(usageStats.complex >= LIMIT_COMPLEX);
    }
  }, [aiEngine, activeMode, usageStats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0 relative overflow-hidden select-none">
        <Header />
        
        {/* Ambient Liquid Glows */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/20 blur-[130px] animate-pulse" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />

        <div className="flex flex-1 items-center justify-center px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card w-full max-w-md rounded-3xl border border-accent/30 bg-gradient-to-b from-card/60 via-card/35 to-accent/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_35px_rgba(56,189,248,0.15)] backdrop-blur-3xl backdrop-saturate-200 text-center flex flex-col items-center space-y-6 relative overflow-hidden ring-1 ring-accent/20"
          >
            {/* Top Liquid Glass Light Highlights - Blue Accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-28 bg-accent/25 blur-2xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-primary/20 blur-2xl rounded-full pointer-events-none" />

            {/* Liquid Glass Badge Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold tracking-wider uppercase shadow-[inset_0_1px_1px_rgba(56,189,248,0.3)] backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-spin-slow" />
              <span>IA BÍBLICA ASSISTENTE</span>
            </div>

            {/* Glowing Liquid Glass Icon Sphere */}
            <div className="relative group">
              <div className="absolute -inset-2.5 rounded-2xl bg-gradient-to-tr from-accent via-sky-400 to-accent opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-90 animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-500/30 to-accent/10 border border-sky-400/50 backdrop-blur-2xl shadow-[inset_0_1px_3px_rgba(56,189,248,0.6),0_8px_20px_rgba(0,0,0,0.4)]">
                <Bot className="h-10 w-10 text-sky-200 drop-shadow-[0_0_18px_rgba(56,189,248,1)]" strokeWidth={2.4} />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-accent p-1.5 text-accent-foreground shadow-lg border border-accent/40">
                  <LogIn className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
                Login Necessário
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Faça login para ter acesso completo ao seu assistente bíblico pessoal com inteligência artificial.
              </p>
            </div>

            {/* Liquid Glass Feature Perks Box */}
            <div className="w-full rounded-2xl border border-accent/20 bg-accent/5 backdrop-blur-xl p-4 text-left space-y-3 shadow-[inset_0_1px_1px_rgba(56,189,248,0.2)]">
              <div className="flex items-center gap-3 text-xs font-medium text-foreground/90">
                <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-accent/25 border border-accent/30 text-accent shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <span>Conversas teológicas e respostas bíblicas</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-foreground/90">
                <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-accent/25 border border-accent/30 text-accent shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <span>Geração de imagens e ilustrações sagradas</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-foreground/90">
                <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-accent/25 border border-accent/30 text-accent shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
                <span>Histórico criptografado e seguro</span>
              </div>
            </div>

            {/* Liquid Glass CTA Button */}
            <button
              onClick={() => navigate("/conta")}
              className="w-full group relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent via-accent/90 to-primary py-3.5 px-6 font-semibold text-accent-foreground shadow-[0_10px_30px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-accent/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <LogIn className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
              <span className="tracking-wide">Criar conta / Fazer login</span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Lógica criptografada de persistência com título gerado pela IA
  const saveConversation = (msgs: Msg[], explicitTitle?: string) => {
    if (msgs.length < 2) return;
    const userSecret = user?.sub;
    const userKey = getConversationsKey(userSecret);
    
    setConversations(prev => {
      const aiTitle = generateTitleFromAI(msgs);
      let updated: Conversation[];

      if (currentChatIdRef.current) {
        const exists = prev.some(c => c.id === currentChatIdRef.current);
        if (exists) {
          // Se já existe no histórico, atualiza mantendo/gerando o título da IA
          updated = prev.map(c => 
            c.id === currentChatIdRef.current 
              ? { ...c, title: explicitTitle || (c.title && c.title !== msgs[0]?.content ? c.title : aiTitle), messages: msgs, timestamp: Date.now(), engine: c.engine || aiEngine } 
              : c
          );
        } else {
          // Se o ID atual foi definido mas ainda não estava na lista
          const conv: Conversation = { id: currentChatIdRef.current, title: explicitTitle || aiTitle, messages: msgs, timestamp: Date.now(), engine: aiEngine };
          updated = [conv, ...prev];
        }
      } else {
        // Se for a primeira resposta, cria um ID novo com o título gerado pela IA
        const newId = Date.now().toString();
        currentChatIdRef.current = newId;
        const conv: Conversation = { id: newId, title: explicitTitle || aiTitle, messages: msgs, timestamp: Date.now(), engine: aiEngine };
        updated = [conv, ...prev];
      }

      // 1. Salva imediatamente o estado no localStorage (funciona logado ou visitante)
      try {
        safeSetLocalStorage(userKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar localmente:", e);
      }

      // 2. Se o usuário estiver logado, criptografa e sincroniza com o Supabase em segundo plano
      if (userSecret) {
        Promise.all(
          updated.map(async (c) => ({
            ...c,
            messages: await encryptConversationMessages(c.messages, userSecret)
          }))
        ).then(async (encryptedConversations) => {
          const jsonStr = JSON.stringify(encryptedConversations);
          safeSetLocalStorage(userKey, jsonStr);
          await syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
        }).catch(console.error);
      }

      return updated;
    });
  };

  // NOVO: Função para limpar o chat e iniciar um novo
  const startNewChat = () => {
    setMessages([]);
    currentChatIdRef.current = null;
    setActiveMode(null);
    setAttachedFiles([]);
  };

  const loadConversation = (conv: Conversation) => {
    currentChatIdRef.current = conv.id; // Atualiza a referência para continuar o mesmo chat
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    
    const userSecret = user?.sub;
    const userKey = getConversationsKey(userSecret);

    try {
      safeSetLocalStorage(userKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Erro ao remover no localStorage:", e);
    }

    if (userSecret) {
      Promise.all(
        updated.map(async (c) => ({
          ...c,
          messages: await encryptConversationMessages(c.messages, userSecret)
        }))
      ).then(async (encryptedConversations) => {
        const jsonStr = JSON.stringify(encryptedConversations);
        safeSetLocalStorage(userKey, jsonStr);
        await syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
      }).catch(console.error);
    }

    if (currentChatIdRef.current === id) {
      startNewChat(); // Se apagar o chat atual, limpa a tela
    }
  };

  const downloadImage = async (dataUrl: string) => {
    await downloadBibleImage(dataUrl, "Biblia-Online-IA");
  };

  const validateAndAddFile = async (file: File) => {
    if (attachedFiles.length >= 2) {
      toast({ title: "Limite de arquivos atingido", description: "Você só pode anexar no máximo 2 arquivos por mensagem.", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O limite de tamanho para cada arquivo é de 50MB.", variant: "destructive" });
      return;
    }

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.doc', '.docx'];
    const fileNameLower = file.name.toLowerCase();
    const hasAllowedExt = allowedExtensions.some(ext => fileNameLower.endsWith(ext));

    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const hasAllowedMime = allowedMimeTypes.includes(file.type) || file.type.startsWith('image/');

    if (!hasAllowedExt || !hasAllowedMime) {
      toast({ 
        title: "Formato não suportado", 
        description: "Formatos permitidos: Imagens (PNG, JPG, JPEG, WEBP, GIF), PDF e Word (DOC, DOCX).", 
        variant: "destructive" 
      });
      return;
    }

    // Filtro de segurança para imagem inapropriada/obscena/fora do escopo cristão
    const moderation = await validateImageContent(file);
    if (!moderation.isAppropriate) {
      toast({ 
        title: "Envio Bloqueado", 
        description: moderation.reason || "Imagem não pode ser enviada pois contém conteúdo impróprio ou fora do escopo ético/cristão.", 
        variant: "destructive" 
      });
      return;
    }

    setAttachedFiles(prev => [...prev, file]);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        validateAndAddFile(file);
      });
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (limitReached || !isOnline) return;
    
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          validateAndAddFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!limitReached && isOnline) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (limitReached || !isOnline) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        validateAndAddFile(file);
      });
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendSpecialMode = async (text: string, mode: ModeKey, attachments?: AIAttachment[], attachedFileName?: string | null, attachedFilesList?: Array<{ name: string; size?: number; type?: string }>) => {
    if (!user) return;
    
    // Check quota before loading
    const isImageMode = mode === 'image';
    const limitType = mode === 'video' || mode === 'music' ? 'complex' : (isImageMode ? 'image' : 'simple');
    try {
      if (isImageMode) {
        if (usageStats.image >= LIMIT_IMAGE) {
          toast({ title: "Limite atingido", description: "Sua cota diária para imagens acabou. Recarga em até 12h.", variant: "destructive" });
          setLimitReached(true);
          setIsLoading(false);
          return;
        }
      } else {
        const hasQuota = await checkAndIncrementUsage(limitType as any, user.sub);
        await fetchUsage();
        if (!hasQuota) {
          toast({ title: "Limite atingido", description: "Sua cota diária para este recurso acabou. Recarga em até 12h.", variant: "destructive" });
          setLimitReached(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (error: any) {
      console.error("Erro na verificação de cotas:", error);
      toast({ title: "Aviso", description: error.message || "Não foi possível verificar suas cotas de uso.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    
    const userMsg: Msg = { role: "user", content: maskPiiInText(text), fileName: attachedFileName || undefined, files: attachedFilesList };
    const currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setInput("");
    setIsLoading(true);
    setShowModes(false);

    const videoSystemPrompt = `Atue como um roteirista profissional de vídeos, especializado em teologia e conteúdo cristão focado em engajamento digital (YouTube/Instagram/TikTok). Seu objetivo é criar um roteiro dinâmico, profundo e estritamente fiel às Escrituras Sagradas.

🛑 REGRAS INVIOLÁVEIS DE ESCOPO E TAMANHO:
- ESCOPO BÍBLICO ESTRITO: Se o tema solicitado pelo usuário NÃO for de contexto bíblico ou cristão, RECUSE COM EXTREMA EDUCAÇÃO: "Olá! Este gerador de roteiros atende exclusivamente temas bíblicos e cristãos. Não posso criar roteiros para temas seculares. Como posso ajudar em seus estudos ou vídeos cristãos hoje?"
- ⚠️ LIMITE DE TAMANHO OBRIGATÓRIO DE ATÉ 2.000 CARACTERES: Sua resposta inteira DEVE ter no MÁXIMO 2.000 CARACTERES no total. Seja conciso, dinâmico, objetivo e direto ao ponto.
- Fidelidade Bíblica Rigorosa: Todo o conteúdo deve ser fundamentado diretamente na Bíblia, citando a referência exata (Ex: João 3:16).
- Tom de Voz: Reverente, inspirador, acolhedor e com autoridade bíblica.

🎬 Estrutura do Roteiro (deve ser conciso e objetivo):
- O Gancho (Primeiros 15s): Pergunta ou afirmação impactante.
- A Introdução: Apresentação do tema e versículo-chave.
- O Desenvolvimento (1 ou 2 pontos diretos): Explicação bíblica e espiritual.
- A Aplicação Prática e Conclusão com CTA.

NUNCA use # para títulos, use **negrito**.`;

    const musicSystemPrompt = `Você é um compositor de músicas cristãs talentoso. Crie uma letra de música completa e inspiradora.

🛑 REGRAS INVIOLÁVEIS DE ESCOPO E TAMANHO:
- ESCOPO BÍBLICO ESTRITO: Se o tema solicitado pelo usuário NÃO for de contexto bíblico ou cristão, RECUSE COM EXTREMA EDUCAÇÃO: "Olá! Este compositor atende exclusivamente hinos, louvores e canções de fé cristã. Não posso compor músicas para temas seculares. Como posso ajudar na sua composição cristã hoje?"
- ⚠️ LIMITE DE TAMANHO OBRIGATÓRIO DE ATÉ 2.000 CARACTERES: Sua resposta inteira DEVE ter no MÁXIMO 2.000 CARACTERES no total. Crie uma composição profunda, emocionante e marcante sem ultrapassar 2000 caracteres.

Inclua:
- Título da música
- Estilo musical sugerido (ex: worship, gospel contemporâneo)
- Versos
- Refrão marcante
- Ponte
- Tom sugerido

NUNCA use # para títulos, use **negrito**.`;

    const systemPrompt = mode === 'video' ? videoSystemPrompt : musicSystemPrompt;

    try {
      const cleanPrompt = text.replace(/\[Modo:.*?\]\s*/g, "");
      let responseText = await askBibleAI(cleanPrompt, "complex", controller.signal, attachments, systemPrompt, true);

      if (responseText && responseText.length > 2000) {
        responseText = responseText.slice(0, 1997) + "...";
      }
      
      const assistantMsg: Msg = { role: "assistant", content: responseText || "Conteúdo gerado!" };
      const finalMessages = [...currentMsgs, assistantMsg];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      fetchUsage();
      
      saveAIHistory(text, assistantMsg.content, mode).catch(console.error);
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast({ description: "Geração interrompida." });
      } else {
        toast({ title: "Erro na IA", description: "Tente novamente mais tarde.", variant: "destructive" });
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const send = async (text: string) => {
    if (!user || !text.trim() || isLoading || limitReached) return;

    let finalText = maskPiiInText(text.trim());
    const currentMode = activeMode ? modes.find(m => m.key === activeMode) : null;
    if (currentMode && !finalText.startsWith(currentMode.prefix.trim())) {
      finalText = currentMode.prefix + finalText;
    }

    const attachments: AIAttachment[] = [];
    let fileNamesStr = "";
    const filesListForMsg: Array<{ name: string; size?: number; type?: string }> = [];

    if (attachedFiles.length > 0) {
      const namesList: string[] = [];
      for (const file of attachedFiles) {
        try {
          const base64 = await readFileAsBase64(file);
          attachments.push({
            base64,
            mimeType: file.type,
            name: file.name
          });
          namesList.push(file.name);
          filesListForMsg.push({
            name: file.name,
            size: file.size,
            type: file.type
          });
          finalText = `[Arquivo: ${file.name}]\n${finalText}`;
        } catch (e) {
          console.error("Erro ao ler arquivo como base64:", e);
        }
      }
      fileNamesStr = namesList.join(", ");
      setAttachedFiles([]);
    }

    if (activeMode && activeMode !== "learning" && ["video", "music"].includes(activeMode)) {
      return sendSpecialMode(finalText, activeMode, attachments, fileNamesStr, filesListForMsg.length > 0 ? filesListForMsg : undefined);
    }

    // Check quota before loading
    try {
      if (activeMode === "image") {
        if (usageStats.image >= LIMIT_IMAGE) {
          toast({ 
            title: "Limite atingido", 
            description: `Limite de ${LIMIT_IMAGE} imagens atingido. Recarga em 12h.`, 
            variant: "destructive" 
          });
          setLimitReached(true);
          setIsLoading(false);
          return;
        }
        // Note: image usage is recorded automatically on generation success by server / fallback
      } else {
        const limitType = aiEngine === "complexo" ? "complex" : "simple";
        const hasQuota = await checkAndIncrementUsage(limitType, user.sub);
        await fetchUsage();
        if (!hasQuota) {
          toast({ 
            title: "Limite atingido", 
            description: "Sua cota diária de mensagens acabou. Recarga em até 12h.", 
            variant: "destructive" 
          });
          setLimitReached(true);
          setIsLoading(false);
          return;
        }
      }
    } catch (error: any) {
      console.error("Erro na verificação de cotas:", error);
      toast({ title: "Aviso", description: error.message || "Não foi possível verificar suas cotas de uso.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    const userMsg: Msg = { role: "user", content: finalText, fileName: fileNamesStr || undefined, files: filesListForMsg.length > 0 ? filesListForMsg : undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowModes(false);
    setShowStylePicker(false);

    try {
      let responseText = "";
      if (activeMode === 'image') {
        const activeStyle = selectedImageStyle || IMAGE_STYLES.find(st => st.id === "cinematic") || IMAGE_STYLES[0];
        const imagePromptWithStyle = `[Estilo: ${activeStyle.label} - ${activeStyle.promptAddon}] ${finalText}`;
        responseText = await generateBiblicalImage(imagePromptWithStyle, controller.signal, 'square', false, 'chat', aiEngine === 'complexo');
      } else if (activeMode === 'learning') {
        const learningPrompt = `Você é um professor e teólogo cristão dedicado ao ensino bíblico de forma altamente didática, passo a passo e interativa.

🛑 REGRAS INVIOLÁVEIS DE ESCOPO E TAMANHO:
- ESCOPO BÍBLICO ESTRITO: Se o tema solicitado pelo usuário NÃO for de contexto bíblico ou cristão, RECUSE COM EXTREMA EDUCAÇÃO: "Olá! O modo aprendizado é exclusivo para estudos da Bíblia Sagrada e fé cristã. Não posso ensinar sobre temas seculares. Como posso ajudar em seus estudos bíblicos hoje?"
- ⚠️ LIMITE DE TAMANHO OBRIGATÓRIO DE ATÉ 2.000 CARACTERES: Sua resposta inteira DEVE ter no MÁXIMO 2.000 CARACTERES no total. Seja conciso, objetivo e direto para garantir que todo o texto caiba em até 2000 caracteres.

Seu objetivo é ensinar o tema bíblico solicitado seguindo estas diretrizes:
1. Ensine o tema de forma PASSO A PASSO (dividido em etapas curtas e claras).
2. Seja conciso e objetivo: evite explicações redundantes ou exageradamente longas.
3. Apresente um RESUMO claro com as principais lições práticas e espirituais.
4. Finalize OBRIGATORIAMENTE com uma PERGUNTA reflexiva sobre o tema.

Mantenha fidelidade bíblica rigorosa, citando referências bíblicas exatas (ex: João 3:16, Efésios 2:8). NUNCA use # para títulos, use **negrito**.`;
        responseText = await askBibleAI(finalText, aiEngine === "complexo" ? "complex" : "simple", controller.signal, attachments, learningPrompt, true);
        if (responseText && responseText.length > 2000) {
          responseText = responseText.slice(0, 1997) + "...";
        }
      } else {
        responseText = await askBibleAI(finalText, aiEngine === "complexo" ? "complex" : "simple", controller.signal, attachments, undefined, true);
      }
      
      const finalMessages = [...newMessages, { role: "assistant" as const, content: responseText }];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      fetchUsage();
      
      saveAIHistory(finalText, responseText, aiEngine === "complexo" ? "complex" : "simple").catch(console.error);

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort') || error.message?.includes('The user aborted a request')) {
        toast({ description: "Geração interrompida." });
      } else {
        const errMsg = error?.message || "";
        if (
          errMsg.toLowerCase().includes("improprio") || 
          errMsg.toLowerCase().includes("impróprio") || 
          errMsg.toLowerCase().includes("bloqueado") || 
          errMsg.toLowerCase().includes("inapropriad") ||
          errMsg.toLowerCase().includes("diretrizes") ||
          errMsg.toLowerCase().includes("termos") ||
          errMsg.toLowerCase().includes("conteúdo visual")
        ) {
          toast({ title: "Conteúdo Bloqueado", description: "A descrição fornecida contém termos que violam as diretrizes de conteúdo visual.", variant: "destructive" });
        } else {
          const formattedMsg = errMsg.includes("Failed to fetch") 
            ? "Erro de conexão com o servidor. Verifique sua internet e tente novamente." 
            : (errMsg || "Tente novamente mais tarde.");
          toast({ title: "Erro na IA", description: formattedMsg, variant: "destructive" });
        }
        if (
          activeMode !== "image"
        ) {
          refundUsage(aiEngine === "complexo" ? "complex" : "simple").catch(console.error);
        }
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      toast({ description: "Resposta interrompida." });
    }
  };

  const handleModeSelect = (mode: typeof modes[0]) => {
    const isCurrentlyEmpty = messages.length === 0;

    if (activeMode === mode.key) {
      setActiveMode(null);
      setSelectedImageStyle(null);
      setShowModes(false);
      if (!isCurrentlyEmpty) {
        startNewChat();
        toast({
          title: "Modo encerrado",
          description: `Você saiu do modo ${mode.label}. Nova conversa iniciada!`,
        });
      }
    } else {
      const isSwitchingImage = activeMode === "image" || mode.key === "image";
      const prevModeLabel = activeModeInfo?.label;

      setActiveMode(mode.key);
      if (mode.key !== "image") {
        setAiEngine("complexo");
      }
      setShowModes(false);

      if (!isCurrentlyEmpty && isSwitchingImage) {
        startNewChat();
        toast({
          title: `Modo ${mode.label} ativado`,
          description: prevModeLabel
            ? `Modo alterado de ${prevModeLabel} para ${mode.label}. Nova conversa iniciada!`
            : `Modo ${mode.label} ativado! Nova conversa iniciada para gerar imagens.`,
        });
      }
    }
  };

  const renderAssistantContent = (msg: Msg) => {
    const formattedContent = (msg.content || "").replace(/\[Arquivo:\s*(.*?)\]/gi, "**$1**");
    const lines = formattedContent.split("\n");

    const parseInlineBold = (text: string) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      );
    };

    return (
      <div className="space-y-1">
        {msg.image && (
          <Fragment>
            <div className="mb-2 relative w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-xl bg-muted border border-border shadow-md">
              <ResilientImage src={msg.image} alt="Imagem bíblica gerada" onClick={() => setLightboxImage(msg.image!)} />
            </div>
            <div className="mt-1.5 flex gap-2">
              <button onClick={() => downloadImage(msg.image!)}
                className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.8 text-[11px] font-semibold text-accent hover:bg-accent/25 transition-all liquid-btn">
                <Download className="h-3.5 w-3.5" /> Baixar
              </button>
              <button onClick={() => shareBibleImage(msg.image!)}
                className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.8 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-all liquid-btn">
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </button>
            </div>
          </Fragment>
        )}
        {lines.map((line, i) => {
          const imgMatch = line.match(/!\[.*?\]\((https?:\/\/.*?\?.*|data:image\/.*?;base64,.*?)\)/);
          if (imgMatch) {
             const imageUrl = imgMatch[1];
             return (
               <Fragment key={i}>
                 <div className="mb-2 mt-2 relative w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-xl bg-muted border border-border shadow-md">
                   <ResilientImage src={imageUrl} alt="Imagem bíblica gerada" onClick={() => setLightboxImage(imageUrl)} />
                 </div>
                 <div className="mt-1.5 flex gap-2">
                   <button onClick={() => downloadImage(imageUrl)}
                     className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.8 text-[11px] font-semibold text-accent hover:bg-accent/25 transition-all liquid-btn">
                     <Download className="h-3.5 w-3.5" /> Baixar
                   </button>
                   <button onClick={() => shareBibleImage(imageUrl)}
                     className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.8 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-all liquid-btn">
                     <Share2 className="h-3.5 w-3.5" /> Compartilhar
                   </button>
                 </div>
               </Fragment>
             );
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={i} className="text-xs font-bold text-foreground mt-1.5">{line.slice(2, -2)}</p>;
          }
          if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
            const text = line.startsWith("• ") ? line.slice(2) : line.slice(2);
            return (
              <p key={i} className="text-xs pl-2 border-l-2 border-accent/30 py-0.5 leading-relaxed">
                {parseInlineBold(text)}
              </p>
            );
          }
          const numMatch = line.match(/^(\d+\.\s)(.*)/);
          if (numMatch) {
            const prefix = numMatch[1];
            const rest = numMatch[2];
            return (
              <p key={i} className="text-xs pl-2 leading-relaxed">
                <span className="font-medium text-muted-foreground">{prefix}</span>
                {parseInlineBold(rest)}
              </p>
            );
          }
          if (line.trim() === "") return <div key={i} className="h-0.5" />;
          
          return (
            <p key={i} className="text-xs leading-relaxed">
              {parseInlineBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const activeModeInfo = activeMode ? modes.find(m => m.key === activeMode) : null;
  const chatRemaining = LIMIT_COMPLEX - usageStats.complex;
  const imageRemaining = LIMIT_IMAGE - usageStats.image;
  const geminiRemaining = LIMIT_SIMPLE - usageStats.simple;

  if (showHistory) {
    const filteredConversations = conversations.filter(conv => {
      const categoryInfo = getConversationCategoryInfo(conv);
      if (historyFilterCategory !== "all" && categoryInfo.category !== historyFilterCategory) {
        return false;
      }

      if (!historySearchQuery.trim()) return true;

      const q = historySearchQuery.toLowerCase();
      const titleMatches = (conv.title || "").toLowerCase().includes(q);
      const msgMatches = conv.messages.some(m => (m.content || "").toLowerCase().includes(q));

      return titleMatches || msgMatches;
    });

    const handleSaveTitle = (id: string) => {
      if (!editingTitleInput.trim()) {
        setEditingTitleId(null);
        return;
      }
      const updated = conversations.map(c => 
        c.id === id ? { ...c, title: editingTitleInput.trim() } : c
      );
      setConversations(updated);
      setEditingTitleId(null);

      Promise.all(
        updated.map(async (c) => ({
          ...c,
          messages: await encryptConversationMessages(c.messages, user?.sub)
        }))
      ).then(encryptedConversations => {
        const jsonStr = JSON.stringify(encryptedConversations);
        const userKey = getConversationsKey(user?.sub);
        safeSetLocalStorage(userKey, jsonStr);
        syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
      }).catch(console.error);
    };

    const handleClearAllHistory = () => {
      setConversations([]);
      const userKey = getConversationsKey(user?.sub);
      localStorage.removeItem(userKey);
      syncKeyToSupabase("AI_CONVERSATIONS", "[]");
      setShowClearAllModal(false);
      startNewChat();
      toast({ title: "Histórico Limpo", description: "Todas as conversas foram apagadas com sucesso." });
    };

    return (
      <div className="flex h-[100dvh] flex-col bg-background relative overflow-hidden">
        <Header />

        <div className="flex-1 flex flex-col min-h-0 container mx-auto max-w-4xl px-3 sm:px-4 pb-4">
          
          {/* Header Superior do Histórico */}
          <div className="flex items-center justify-between py-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setShowHistory(false)} 
                className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all liquid-btn"
                title="Voltar ao Chat"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/20">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-foreground leading-tight">Histórico de Conversas</h2>
                  <p className="text-[10px] text-muted-foreground">{conversations.length} {conversations.length === 1 ? 'conversa salva' : 'conversas salvas'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setShowHistory(false);
                  startNewChat();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold transition-all shadow-xs active:scale-95 liquid-btn"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nova Conversa</span>
              </button>

              {conversations.length > 0 && (
                <button
                  onClick={() => setShowClearAllModal(true)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                  title="Apagar todo o histórico"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cards de Uso Diário / Cota */}
          <div className="glass-card rounded-2xl p-3.5 mt-3 shrink-0 border border-accent/20 bg-gradient-to-r from-secondary/40 via-background/60 to-secondary/40 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                <Zap className="h-3 w-3" /> Cota Diária de Uso
              </span>
              <span className="text-[10px] text-muted-foreground">Recarrega a cada 12h</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center rounded-xl bg-background/80 border border-border/50 p-2 text-center transition-all hover:border-accent/30">
                <p className="text-base sm:text-lg font-bold text-foreground leading-none mb-0.5">{Math.max(0, chatRemaining)}</p>
                <p className="text-[9px] font-medium text-muted-foreground">IA Complexa</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-background/80 border border-border/50 p-2 text-center transition-all hover:border-accent/30">
                <p className="text-base sm:text-lg font-bold text-foreground leading-none mb-0.5">{Math.max(0, geminiRemaining)}</p>
                <p className="text-[9px] font-medium text-muted-foreground">IA Simples</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-background/80 border border-border/50 p-2 text-center transition-all hover:border-accent/30">
                <p className="text-base sm:text-lg font-bold text-foreground leading-none mb-0.5">{Math.max(0, imageRemaining)}</p>
                <p className="text-[9px] font-medium text-muted-foreground">Imagens</p>
              </div>
            </div>
          </div>

          {/* Barra de Pesquisa e Filtros com Efeito Liquid Glass */}
          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Input de Busca Liquid Glass */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Buscar no histórico de conversas..."
                className="w-full liquid-glass-input rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full z-10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Categorias de Filtro Liquid Glass */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
              {[
                { key: "all", label: "Todos" },
                { key: "simple", label: "IA Simples" },
                { key: "complex", label: "IA Complexa" },
                { key: "image", label: "Imagens" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setHistoryFilterCategory(cat.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap liquid-btn ${
                    historyFilterCategory === cat.key
                      ? "liquid-glass-pill-active font-semibold shadow-md"
                      : "liquid-glass-pill text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Conversas do Histórico */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground mb-3 border border-border/60">
                  <Bot className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">
                  {historySearchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa salva"}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mb-4">
                  {historySearchQuery
                    ? `Não encontramos resultados para "${historySearchQuery}". Tente outro termo.`
                    : "Suas mensagens e ensinamentos da IA ficam salvos aqui de forma privada e criptografada."}
                </p>
                {!historySearchQuery ? (
                  <button
                    onClick={() => {
                      setShowHistory(false);
                      startNewChat();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Iniciar conversa com IA
                  </button>
                ) : (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Limpar filtro de pesquisa
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredConversations.map((conv) => {
                  const categoryInfo = getConversationCategoryInfo(conv);
                  const CategoryIcon = categoryInfo.icon;
                  const previewText = getConversationPreview(conv);
                  const isEditing = editingTitleId === conv.id;

                  return (
                    <motion.div
                      key={conv.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card group relative flex flex-col rounded-2xl p-3.5 border border-border/70 hover:border-accent/40 bg-card/80 hover:bg-card transition-all shadow-xs hover:shadow-md"
                    >
                      {/* Top Bar Card */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryInfo.badgeBg}`}>
                            <CategoryIcon className="h-3 w-3" />
                            {categoryInfo.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/70" />
                            {formatRelativeDate(conv.timestamp)}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(conv.id);
                              setEditingTitleInput(conv.title || "");
                            }}
                            className="p-1.5 text-muted-foreground hover:text-accent rounded-lg hover:bg-accent/10 transition-colors"
                            title="Renomear título"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Excluir conversa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Título e Edição */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 my-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitleInput}
                            onChange={(e) => setEditingTitleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(conv.id);
                              if (e.key === 'Escape') setEditingTitleId(null);
                            }}
                            autoFocus
                            className="flex-1 bg-secondary/80 border border-accent rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveTitle(conv.id)}
                            className="p-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-medium"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTitleId(null)}
                            className="p-1.5 bg-secondary text-muted-foreground rounded-lg text-xs"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => loadConversation(conv)}
                          className="text-left w-full group-hover:text-accent transition-colors cursor-pointer"
                        >
                          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1 mb-1">
                            {conv.title || "Conversa Bíblica"}
                          </h3>

                          {/* Prévia da Resposta da IA */}
                          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                            {previewText}
                          </p>
                        </button>
                      )}

                      {/* Indicador de Abertura no Rodapé */}
                      <div 
                        onClick={() => loadConversation(conv)}
                        className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-accent/80 group-hover:text-accent transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          Continuar conversa <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Criptografia local ativada
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Modal de Confirmação para Apagar Todo o Histórico */}
        <AnimatePresence>
          {showClearAllModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card max-w-sm w-full p-5 rounded-2xl bg-card border border-border shadow-xl text-center"
              >
                <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-base font-bold text-foreground mb-2">Apagar Todo o Histórico?</h3>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                  Esta ação excluirá permanentemente todas as conversas e respostas salvas da IA. Não é possível desfazer.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowClearAllModal(false)}
                    className="flex-1 py-2 rounded-xl bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearAllHistory}
                    className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold transition-all hover:bg-destructive/90 shadow-xs"
                  >
                    Sim, Apagar Tudo
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex h-[100dvh] flex-col bg-background relative">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center container mx-auto max-w-md">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/5 border border-amber-500/20">
            <WifiOff className="h-10 w-10 animate-pulse" />
          </div>
          
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Sem Conexão</h2>
          
          <p className="text-sm text-muted-foreground bg-secondary/40 border border-border/50 rounded-2xl p-5 mb-8 leading-relaxed font-medium">
            Você precisa de internet para usar IA. Por favor, verifique sua conexão Wi-Fi ou dados móveis e tente novamente.
          </p>

          <button 
            onClick={() => setIsOnline(navigator.onLine)} 
            className="flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-sm font-bold transition-all shadow-md active:scale-95 liquid-btn"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col bg-background relative w-full overflow-hidden transition-[height,max-height,padding] duration-300 ease-out ${
        isKeyboardOpen ? "fixed inset-0 z-30 md:relative md:inset-auto md:z-auto md:h-[100dvh]" : "h-[100dvh]"
      }`}
      style={
        isKeyboardOpen && viewportHeight && window.innerWidth < 768
          ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
          : undefined
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden container mx-auto max-w-4xl px-3">
        <div className="flex shrink-0 items-center justify-between gap-1.5 sm:gap-2 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button onClick={() => setShowHistory(true)} className="flex items-center justify-center rounded-lg bg-secondary p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors liquid-btn" title="Histórico">
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            {/* NOVO BOTÃO PARA INICIAR NOVA CONVERSA */}
            <button onClick={startNewChat} className="flex items-center justify-center rounded-lg bg-secondary p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors liquid-btn" title="Nova Conversa">
              <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Título posicionado no lado esquerdo junto com os botões */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-0.5 sm:ml-1">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary shrink-0">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <h1 className="font-serif text-xs sm:text-base font-bold text-foreground whitespace-nowrap">IA Bíblia</h1>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center rounded-xl border border-border bg-secondary/50 p-0.5 sm:p-1">
            <button
              type="button"
              onClick={() => {
                if (aiEngine !== "simples") {
                  const hadMessages = messages.length > 0;
                  setAiEngine("simples");
                  setShowModes(false);
                  setActiveMode(null);
                  if (hadMessages) {
                    startNewChat();
                    toast({
                      title: "IA Simples ativada",
                      description: "Nova conversa iniciada ao alternar para a IA Simples.",
                    });
                  }
                }
              }}
              className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] font-semibold transition-colors duration-200 ${
                aiEngine === "simples" ? "text-white font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {aiEngine === "simples" && (
                <motion.div
                  layoutId="activeEnginePill"
                  className="absolute inset-0 z-0 rounded-lg bg-accent shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Zap className="h-3 w-3 relative z-10 text-white" />
              <span className="relative z-10 text-white">Simples</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (aiEngine !== "complexo") {
                  const hadMessages = messages.length > 0;
                  setAiEngine("complexo");
                  if (hadMessages) {
                    startNewChat();
                    toast({
                      title: "IA Complexa ativada",
                      description: "Nova conversa iniciada ao alternar para a IA Complexa.",
                    });
                  }
                }
              }}
              className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] font-semibold transition-colors duration-200 ${
                aiEngine === "complexo" ? "text-white font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {aiEngine === "complexo" && (
                <motion.div
                  layoutId="activeEnginePill"
                  className="absolute inset-0 z-0 rounded-lg bg-accent shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Bot className="h-3 w-3 relative z-10 text-white" />
              <span className="relative z-10 text-white">Complexo</span>
            </button>
          </div>
        </div>

        {limitReached && (
          <motion.div 
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="shrink-0 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 backdrop-blur-md shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20"
              >
                <AlertCircle className="h-4 w-4" />
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-rose-200 truncate">
                    Limite Diário Atingido
                  </p>
                  <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-300 border border-rose-500/30">
                    Cota Esgotada
                  </span>
                </div>
                <p className="text-[11px] text-rose-300/80 truncate mt-0.5">
                  A cota para este modo foi atingida. Recarga em até 12 horas.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-950/40 px-2.5 py-1 text-[11px] text-rose-300 border border-rose-500/20 font-medium">
              <span>Recarga 00:00</span>
            </div>
          </motion.div>
        )}

        <div className="flex-1 space-y-2.5 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.length === 0 && (
            <div className="py-6 flex flex-col items-center text-center">
              <h2 className="text-base font-bold text-foreground mb-1">
                {activeMode === "image"
                  ? "Gerador de Imagens Bíblicas"
                  : activeMode === "video"
                  ? "Roteiros para Vídeo"
                  : activeMode === "music"
                  ? "Composição de Músicas"
                  : activeMode === "learning"
                  ? "Aprendizado Bíblico"
                  : aiEngine === "simples"
                  ? "IA Simples"
                  : "IA Complexa"}
              </h2>
              <p className="text-xs text-muted-foreground mb-3 max-w-sm leading-relaxed">
                {activeMode === "image"
                  ? "Crie ilustrações e arte bíblica realista com inteligência artificial."
                  : activeMode === "video"
                  ? "Gere roteiros completos para vídeos do YouTube, Reels ou TikTok."
                  : activeMode === "music"
                  ? "Crie letras e arranjos musicais para louvores e hinos."
                  : activeMode === "learning"
                  ? "Estudos e explicações bíblicas aprofundadas com a IA."
                  : aiEngine === "simples"
                  ? "Perguntas diretas sobre a Bíblia, com resposta rápida e resumida."
                  : "Respostas detalhadas, geração de imagens, estudos e áudios."}
              </p>

              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-1.5 text-xs font-bold shadow-md border border-accent/40">
                  {activeMode === "image" ? (
                    <Image className="h-3.5 w-3.5 text-white shrink-0" />
                  ) : activeMode === "video" ? (
                    <Video className="h-3.5 w-3.5 text-white shrink-0" />
                  ) : activeMode === "music" ? (
                    <Music className="h-3.5 w-3.5 text-white shrink-0" />
                  ) : activeMode === "learning" ? (
                    <GraduationCap className="h-3.5 w-3.5 text-white shrink-0" />
                  ) : aiEngine === "simples" ? (
                    <Zap className="h-3.5 w-3.5 fill-current text-white shrink-0" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-white shrink-0" />
                  )}
                  <span className="text-white font-bold">
                    {activeMode === "image"
                      ? `${Math.max(0, imageRemaining)} imgs restantes`
                      : activeMode
                      ? `${Math.max(0, chatRemaining)} msgs restantes`
                      : aiEngine === "simples"
                      ? `${Math.max(0, geminiRemaining)} msgs restantes`
                      : `${Math.max(0, chatRemaining)} msgs restantes`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                {activeSuggestions.map((s) => (
                  <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => !limitReached && send(s)}
                    disabled={limitReached}
                    className="glass-card rounded-xl p-3 text-left text-xs text-card-foreground transition-colors hover:!border-accent liquid-btn disabled:opacity-50 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-accent">
                      {activeMode === "image" ? (
                        <Image className="h-3.5 w-3.5" />
                      ) : activeMode === "video" ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : activeMode === "music" ? (
                        <Music className="h-3.5 w-3.5" />
                      ) : activeMode === "learning" ? (
                        <GraduationCap className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span>{s}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
                  {aiEngine === "simples" ? <Zap className="h-3.5 w-3.5 text-primary-foreground" /> : <Bot className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "glass-card rounded-bl-md"
              }`}>
                {m.role === "user" && getFilesForMessage(m).length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-2 mt-0.5">
                    {getFilesForMessage(m).map((file, idx) => {
                      const isImg = file.type ? file.type.startsWith("image/") : file.name.toLowerCase().match(/\.(jpe?g|png|gif|webp|svg)$/);
                      return (
                        <div key={idx} className="flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-xl px-3 py-2 w-full max-w-[240px]">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                            {isImg ? (
                              <Image className="h-4.5 w-4.5" />
                            ) : (
                              <FileText className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                            <p className="text-[10px] text-white/70">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Anexo"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {m.role === "assistant" ? renderAssistantContent(m) : <span className="text-sm">{formatMessageForDisplay(m.content)}</span>}
              </div>
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
                {aiEngine === "simples" ? <Zap className="h-3.5 w-3.5 text-primary-foreground" /> : <Bot className="h-3.5 w-3.5 text-primary-foreground" />}
              </div>
              {activeMode === "image" ? (
                <ImageGeneratingBubble />
              ) : (
                <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
                  <ThinkingSpinner engine={aiEngine} mode={activeMode} />
                  <span className="text-xs text-muted-foreground">
                    {activeMode === "video" ? "Escrevendo roteiro..." : "Pensando..."}
                  </span>
                </div>
              )}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={`shrink-0 bg-background pt-2 transition-all duration-300 ease-out ${isKeyboardOpen ? 'pb-2 md:pb-3' : 'pb-16 md:pb-3'}`}>
          <AnimatePresence>
            {activeModeInfo && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-2xl border border-accent/40 bg-card/95 p-2.5 sm:px-3.5 sm:py-2 shadow-md backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-accent min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent shrink-0">
                    {activeModeInfo.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate">
                      Modo Ativo: <strong className="font-bold text-foreground">{activeModeInfo.label}</strong>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate">
                      Ao fechar este modo, um novo chat é iniciado para alternar os tópicos.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const modeLabel = activeModeInfo.label;
                    const hadMessages = messages.length > 0;
                    setActiveMode(null);
                    setSelectedImageStyle(null);
                    if (hadMessages) {
                      startNewChat();
                      toast({
                        title: "Modo encerrado",
                        description: `Você saiu do modo ${modeLabel}. Nova conversa iniciada.`,
                      });
                    }
                  }}
                  className="flex h-7 px-2.5 items-center gap-1.5 rounded-xl bg-secondary hover:bg-destructive hover:text-destructive-foreground text-[11px] font-semibold text-muted-foreground transition-all shrink-0 self-end sm:self-center"
                  title="Sair do modo"
                >
                  <span>Sair do Modo</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showModes && aiEngine !== "simples" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 flex flex-wrap gap-1.5">
                {modes.map((m) => (
                  <button key={m.key}
                    type="button"
                    onClick={() => handleModeSelect(m)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors liquid-btn ${
                      activeMode === m.key ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-card-foreground hover:border-accent"
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => { e.preventDefault(); if (isOnline) send(input); }} className="flex flex-col gap-2">
            {!isOnline && (
              <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 p-2 text-[10px] font-medium text-orange-500 border border-orange-500/20">
                <Zap className="h-3 w-3" /> A IA requer conexão com a internet.
              </div>
            )}
            
            <div className={`flex flex-col rounded-2xl border border-border bg-card p-1.5 focus-within:border-accent/70 transition-all duration-300 shadow-sm relative ${isDragging ? "min-h-[140px] justify-center" : ""}`}>
              {/* Localized Drag & Drop Overlay */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col sm:flex-row items-center justify-center gap-3.5 bg-card/95 border-2 border-dashed border-accent rounded-2xl transition-all duration-200 pointer-events-none p-5"
                  >
                    <div className="rounded-full bg-accent/10 p-3 animate-bounce">
                      <Paperclip className="h-6 w-6 text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="font-semibold text-sm text-foreground">Solte seu arquivo aqui</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Anexe imagens, PDFs ou Word (Máx 2 de 50MB)
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Preview area - Gemini style */}
              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="p-2 border-b border-border/50 mb-1.5 flex gap-2 flex-wrap"
                  >
                    {previews.map((prev, index) => {
                      const isImg = prev.type.startsWith("image/");
                      return (
                        <div key={index} className="relative">
                          {/* Uniform File Card */}
                          <div className="relative flex items-center gap-2.5 bg-secondary/70 hover:bg-secondary/90 border border-border/80 rounded-xl px-3.5 py-2 w-fit max-w-xs transition-colors pr-8">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                              {isImg ? (
                                <Image className="h-4.5 w-4.5" />
                              ) : (
                                <FileText className="h-4.5 w-4.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[150px]">{prev.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(prev.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                setAttachedFiles(files => files.filter((_, idx) => idx !== index));
                              }}
                              className="absolute top-2 right-2 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Style Badge in Image Mode */}
              <AnimatePresence>
                {activeMode === "image" && selectedImageStyle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2 px-3 border-b border-border/60 mb-1 flex items-center justify-between bg-accent/15 rounded-xl border border-accent/30 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2 text-xs text-accent font-semibold truncate pr-2">
                      <Palette className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="truncate">Estilo selecionado: <strong className="font-bold text-foreground">{selectedImageStyle.label}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle(null)}
                      className="text-muted-foreground hover:text-foreground text-xs p-1 hover:bg-secondary/80 rounded-lg transition-colors shrink-0"
                      title="Remover estilo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 pl-0.5">
                  {aiEngine !== "simples" && (
                    <button type="button" onClick={() => setShowModes(!showModes)}
                      title="Alternar modos e ferramentas"
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors liquid-btn ${showModes ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={limitReached}
                    title="Anexar arquivos ou imagens"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-xs disabled:opacity-50"
                  >
                    <Upload size={17} className="stroke-[2.2]" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={handleFileAttach} />

                  {/* Botão de Estilo de Imagem (Modo Gerar Imagens) */}
                  {activeMode === "image" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStylePicker(!showStylePicker)}
                        className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all liquid-btn border ${
                          selectedImageStyle
                            ? "border-accent bg-accent/15 text-accent shadow-sm"
                            : "border-border/80 bg-secondary/80 text-muted-foreground hover:text-foreground hover:border-accent/50"
                        }`}
                        title="Selecione o estilo da imagem"
                      >
                        <Palette className="h-4 w-4 shrink-0 text-accent" />
                        <span className="text-[11px] font-semibold max-w-[95px] truncate">
                          {selectedImageStyle ? selectedImageStyle.label : "Cinematográfico"}
                        </span>
                        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${showStylePicker ? "rotate-180" : ""}`} />
                      </button>

                      {/* Menu Popover de Estilos */}
                      <AnimatePresence>
                        {showStylePicker && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowStylePicker(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute bottom-full mb-3 left-0 z-50 w-72 sm:w-80 rounded-2xl border border-border/90 bg-card/95 p-3 shadow-2xl backdrop-blur-2xl"
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 px-1">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  <Palette className="h-4 w-4 text-accent" /> Selecionar Estilo Visual
                                </span>
                                {selectedImageStyle?.id !== "cinematic" && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImageStyle(IMAGE_STYLES.find(s => s.id === "cinematic") || null)}
                                    className="text-[11px] text-accent hover:text-accent/80 font-semibold transition-colors"
                                  >
                                    Restaurar Padrão
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1.5 custom-scrollbar">
                                {IMAGE_STYLES.map((st) => {
                                  const isSelected = selectedImageStyle?.id === st.id;
                                  const isDefault = st.id === "cinematic";
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedImageStyle(st);
                                        setShowStylePicker(false);
                                      }}
                                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                                        isSelected
                                          ? "bg-accent/20 font-bold text-accent border border-accent/40 shadow-sm"
                                          : "hover:bg-secondary/80 text-foreground border border-transparent"
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1 pr-2">
                                        <p className="font-semibold text-xs text-foreground flex items-center justify-between gap-1">
                                          <span>{st.label}</span>
                                          {isDefault && <span className="text-[10px] text-accent font-normal">(Padrão)</span>}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{st.description}</p>
                                      </div>
                                      {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <input
                  id="ai-prompt-input"
                  aria-label="Campo de mensagem para a IA Bíblica"
                  maxLength={2000}
                  value={input} onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                  onPaste={handlePaste}
                  onFocus={() => {
                    window.scrollTo(0, 0);
                    setTimeout(() => {
                      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }}
                  placeholder={
                    !isOnline
                      ? "Necessário internet para IA"
                      : limitReached
                      ? "Limite diário atingido"
                      : activeMode === "image"
                      ? "Descreva sua imagem..."
                      : activeMode === "video"
                      ? "Descreva seu roteiro de vídeo..."
                      : activeMode === "learning"
                      ? "Descreva o que quer aprender..."
                      : activeMode === "music"
                      ? "Descreva a letra da música..."
                      : aiEngine === "simples"
                      ? "Pergunta Bíblica simples..."
                      : "Pergunte qualquer tema bíblico..."
                  }
                  disabled={isLoading || limitReached || !isOnline}
                  className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {input.length > 1000 && (
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 px-1">
                    {input.length}/2000
                  </span>
                )}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors liquid-btn mr-0.5"
                    title="Parar resposta"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || limitReached || !isOnline}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors liquid-btn disabled:opacity-50 disabled:cursor-not-allowed mr-0.5 shadow-sm"
                    title="Enviar"
                  >
                    <ArrowUp size={18} className="stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60 font-medium italic">
            A IA biblica é uma IA ela comete erros
          </p>
        </div>
      </div>

      {/* Lightbox Modal de Imagem em Tela Cheia */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/95 p-3 sm:p-5 backdrop-blur-md select-none"
            onClick={() => setLightboxImage(null)}
          >
            {/* Top Bar Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-lg flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-full px-4 py-2 shadow-xl shrink-0 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Visualizador de Arte</span>
                {zoomScale > 1 && (
                  <span className="text-[10px] font-mono bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                    {Math.round(zoomScale * 100)}%
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all hover:scale-105 active:scale-95"
                title="Fechar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Container Central da Imagem (flex-1 para ajustar dinamicamente o espaço) */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex-1 min-h-0 w-full flex items-center justify-center my-3 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                ref={lightboxImgRef}
                src={lightboxImage}
                alt="Arte bíblica em alta definição"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 block mx-auto touch-none transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                  cursor: zoomScale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                referrerPolicy="no-referrer"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
              />
            </motion.div>

            {/* Painel de Ações Inferior */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.05 }}
              className="w-full max-w-lg flex items-center justify-between gap-2 sm:gap-3 bg-zinc-900/95 border border-white/15 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl shrink-0 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => downloadImage(lightboxImage)}
                className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-accent hover:bg-accent/90 py-2.5 px-3 text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>Baixar Imagem</span>
              </button>

              <button
                type="button"
                onClick={() => shareBibleImage(lightboxImage)}
                className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-accent/80 hover:bg-accent py-2.5 px-3 text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap"
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span>Compartilhar</span>
              </button>

              <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 sm:pl-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(prev => {
                      const next = prev - 0.5;
                      if (next <= 1) {
                        setPanOffset({ x: 0, y: 0 });
                        return 1;
                      }
                      return next;
                    });
                  }}
                  disabled={zoomScale <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(prev => Math.min(prev + 0.5, 4.5));
                  }}
                  disabled={zoomScale >= 4.5}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPage;
