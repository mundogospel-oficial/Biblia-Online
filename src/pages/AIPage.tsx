import React, { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import {
  Send, ArrowUp, Trash2, Sparkles, GraduationCap, X,
  Plus, Image, ImagePlus, Upload, Video, Music, Download, LogIn,
  History, ChevronLeft, Zap, Bot, Paperclip, AlertCircle, MessageSquarePlus, Square, Share2,
  Loader2, ImageOff, FileText, ZoomIn, ZoomOut, WifiOff, Palette, ChevronDown, Check,
  Search, Edit3, Clock, ArrowRight, ShieldAlert, Wand2,
  ThumbsUp, ThumbsDown, RotateCcw, Copy, PanelLeft, PanelLeftClose
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";

import { askBibleAI, AIAttachment } from "@/services/aiService";
import { checkAndIncrementUsage, checkQuotaOnly, getUserUsage, refundUsage } from "@/services/usageService";
import { saveAIHistory } from "@/services/userDataService";
import { syncKeyToSupabase } from "@/services/userSyncService";
import {
  safeSaveToLocalStorage,
  loadFromLocalStorage,
  saveHistoryToServer,
  fetchHistoryFromServer,
  deleteConversationOnServer,
  clearAllHistoryOnServer,
  mergeChatConversations
} from "@/services/chatHistoryService";
import { generateBiblicalImage, refinePromptWithAI, enforceEmptyCrossPromptForChat } from "@/services/imageGenerationService";
import { APP_WHITE_LOGO_DATA_URL } from "@/assets/appLogoWhite";
import { encryptConversationMessages, decryptConversationMessages } from "@/lib/security/cryptoService";
import { maskPiiInText } from "@/lib/security/privacyGuard";
import { validateImageContent } from "@/services/imageModerationService";
import { analyzeLetterbox } from "@/lib/imageCropUtils";
import { ImageGeneratingMatrixSquare } from "@/components/ImageGeneratingMatrixSquare";
import { formatFriendlyErrorMessage } from "@/lib/errorUtils";
import VoiceInputButton from "@/components/VoiceInputButton";
import {
  useDailyAttachedFiles,
  canAttachFiles,
  DAILY_ATTACHED_FILES_LIMIT
} from "@/services/imageIndexingLimitService";

const formatMessageForDisplay = (text: string): string => {
  if (!text) return "";
  if (text.startsWith("enc:v1:") || text.includes("enc:v1:")) {
    return "";
  }
  // Limpa as tags completas, tags cortadas no final e fragmentos de pergunta cortados
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\[[^\]]*$/, '')
    .replace(/\n*\s*\*\*Pergunta(?:\.\.\.|:?.*?)?$/i, '')
    .trim();
};

const cleanImageLinksFromText = (text: string): string => {
  if (!text) return "";
  if (text.startsWith("enc:v1:") || text.includes("enc:v1:")) {
    return "";
  }
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

const extractImageUrl = (str: string): string | null => {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed.startsWith("enc:v1:")) return null;

  // Markdown image format: ![alt](url)
  const mdMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+)\)/i);
  if (mdMatch) return mdMatch[1];

  // Direct Base64 Data URI
  if (trimmed.startsWith("data:image/")) return trimmed;

  // Pure or contained HTTP(S) URL
  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    const u = urlMatch[1].replace(/[)>,.]*$/, ""); // Clean trailing punctuation
    if (
      u.includes("pollinations.ai") ||
      u.includes("oaidalle") ||
      u.includes("b-cdn.net") ||
      u.includes("cloudinary") ||
      u.includes("supabase.co/storage") ||
      u.includes("googleapis.com") ||
      u.includes("replicate") ||
      /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(u)
    ) {
      return u;
    }
  }
  return null;
};

const generateTitleFromAI = (msgs: Msg[]): string => {
  if (!msgs || msgs.length === 0) return "Conversa Bíblica";

  const assistantMsg = msgs.find(m => m.role === "assistant");
  const userMsg = msgs.find(m => m.role === "user");

  if (!assistantMsg || !assistantMsg.content) {
    if (userMsg?.content) {
      const cleanUser = cleanImageLinksFromText(formatMessageForDisplay(userMsg.content)).replace(/\[.*?\]/g, '').trim();
      if (cleanUser && !cleanUser.startsWith("enc:v1:") && !cleanUser.includes("enc:v1:")) {
        return `Pergunta: ${cleanUser.slice(0, 32)}...`;
      }
    }
    return "Conversa Bíblica";
  }

  const rawContent = assistantMsg.content.trim();

  // Se a resposta for estritamente uma imagem gerada pela IA
  if (rawContent.startsWith("http") || rawContent.startsWith("data:image") || rawContent.includes("generate-chat-image")) {
    if (userMsg?.content) {
      const cleanUser = cleanImageLinksFromText(formatMessageForDisplay(userMsg.content)).replace(/\[.*?\]/g, '').trim();
      if (cleanUser && !cleanUser.startsWith("enc:v1:") && !cleanUser.includes("enc:v1:")) {
        return `Arte Bíblica: ${cleanUser.slice(0, 32) || "Ilustração"}`;
      }
    }
    return "Ilustração Bíblica Sagrada";
  }

  if (rawContent.startsWith("enc:v1:") || rawContent.includes("enc:v1:")) {
    if (userMsg?.content) {
      const cleanUser = cleanImageLinksFromText(formatMessageForDisplay(userMsg.content)).replace(/\[.*?\]/g, '').trim();
      if (cleanUser && !cleanUser.startsWith("enc:v1:") && !cleanUser.includes("enc:v1:")) {
        return `Pergunta: ${cleanUser.slice(0, 32)}...`;
      }
    }
    return "Conversa Bíblica";
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
        !cleanBold.toLowerCase().startsWith("limite") &&
        !cleanBold.startsWith("enc:v1:") &&
        !cleanBold.includes("enc:v1:")
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

  const lines = cleanContent.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.startsWith("enc:v1:"));
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/\*\*/g, '').replace(/\[.*?\]/g, '').trim();
    if (firstLine && !firstLine.startsWith("enc:v1:") && !firstLine.includes("enc:v1:")) {
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
    return { label: "Imagem", category: "image", icon: Image, badgeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
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
  const assistantMsgs = (conv.messages || []).filter(m => m.role === "assistant");
  const userMsgs = (conv.messages || []).filter(m => m.role === "user");

  let text = "";
  if (assistantMsgs.length > 0) {
    text = assistantMsgs[assistantMsgs.length - 1].content || "";
  } else if (userMsgs.length > 0) {
    text = userMsgs[0].content || "";
  }

  if (!text) return "Conversa e estudo bíblico com IA";

  if (text.startsWith("http") || text.startsWith("data:image")) {
    return "🎨 Imagem bíblica gerada pela IA";
  }

  if (text.startsWith("enc:v1:") || text.includes("enc:v1:")) {
    if (conv.title && !conv.title.startsWith("enc:v1:")) {
      return conv.title;
    }
    return "Conversa e reflexão bíblica com IA";
  }

  const textWithoutImages = cleanImageLinksFromText(text);

  const cleanText = formatMessageForDisplay(textWithoutImages)
    .replace(/^(\d+\.|-|•|\*)\s*/, '')
    .replace(/\*\*/g, '')
    .trim();

  if (!cleanText || cleanText.startsWith("enc:v1:") || cleanText.includes("enc:v1:")) {
    if (conv.title && !conv.title.startsWith("enc:v1:")) {
      return conv.title;
    }
    return "Conversa e reflexão bíblica com IA";
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

type Msg = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  fileName?: string;
  files?: Array<{ name: string; size?: number; type?: string }>;
  feedback?: "like" | "dislike";
};

const getDefaultSuggestions = (isEn: boolean) => isEn ? [
  "What is the meaning of John 3:16?",
  "Who was King David?",
  "What does the Bible say about anxiety?",
  "Explain the parables of Jesus",
  "Teach me about the fruits of the Spirit",
  "What is the story of Moses?",
] : [
  "O que significa João 3:16?",
  "Quem foi o rei Davi?",
  "O que a Bíblia diz sobre ansiedade?",
  "Explique as parábolas de Jesus",
  "Me ensine sobre os frutos do Espírito",
  "Qual a história de Moisés?",
];

const getImageSuggestions = (isEn: boolean) => isEn ? [
  "The Cross of Christ at sunset in 8k ultra-realism",
  "Moses parting the Red Sea in ultra-sharp details",
  "Noah's Ark under the rainbow with realistic textures",
  "King David playing the harp in the fields with rich details",
  "The creation of the world and divine light in high definition",
  "The Last Supper of Jesus with cinematic lighting and clarity",
] : [
  "Cruz de Cristo ao pôr do sol em ultra-realismo 8k",
  "Moisés abrindo o Mar Vermelho em detalhes ultranítidos",
  "Arca de Noé sob o arco-íris com texturas realistas",
  "O Rei Davi tocando harpa nos campos com riqueza de detalhes",
  "A criação do mundo e a luz divina em alta definição",
  "A última ceia de Jesus com iluminação cinematográfica e nitidez",
];

const getVideoSuggestions = (isEn: boolean) => isEn ? [
  "Script for Reels about Psalm 91",
  "Short video explaining the Prodigal Son parable",
  "Educational script about the twelve tribes of Israel",
  "Mini documentary about the life of the Apostle Paul",
  "Outline for a morning devotional video",
  "Script for Shorts: 3 verses about hope",
] : [
  "Roteiro para Reels sobre o Salmo 91",
  "Vídeo curto explicando a parábola do filho pródigo",
  "Roteiro educativo sobre as doze tribos de Israel",
  "Mini documentário sobre a vida do Apóstolo Paulo",
  "Esboço para vídeo de reflexão matinal",
  "Roteiro para Shorts: 3 versículos sobre esperança",
];

const getMusicSuggestions = (isEn: boolean) => isEn ? [
  "Congregational worship lyrics about gratitude",
  "Acoustic composition of worship and peace",
  "Solemn hymn inspired by Psalm 23",
  "Youth song lyrics about faith and purpose",
  "Christian lullaby for children",
  "Praise song of celebration and victory in Christ",
] : [
  "Letra de louvor congregacional sobre gratidão",
  "Composição acústica de adoração e paz",
  "Hino solene inspirado no Salmo 23",
  "Letra de música jovem sobre fé e propósito",
  "Canção de ninar cristã para crianças",
  "Louvor de celebração e vitória em Cristo",
];

const getLearningSuggestions = (isEn: boolean) => isEn ? [
  "In-depth study on the book of Romans",
  "Historical context of the Sermon on the Mount",
  "Explain biblical covenants in the Old Testament",
  "Meaning of the names of God in the Bible",
  "Difference between law and grace in the New Testament",
  "Study on the gifts of the Holy Spirit",
] : [
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

interface ThinkingIndicatorProps {
  engine?: "simples" | "complexo";
  mode?: "image" | "video" | "learning" | "music" | "chat" | string | null;
  isEn?: boolean;
}

const getThinkingPhrases = (isEn: boolean): Record<string, string[]> => isEn ? {
  simples: [
    "Thinking...",
    "Finding direct answer...",
    "Consulting Scriptures...",
    "Summarizing biblical explanation...",
    "Organizing answer..."
  ],
  complexo: [
    "Thinking...",
    "Examining biblical context...",
    "Consulting references and theology...",
    "Digging into historical context...",
    "Structuring detailed answer..."
  ],
  learning: [
    "Thinking...",
    "Researching exegesis and theology...",
    "Structuring study topics...",
    "Compiling sacred references...",
    "Preparing educational content..."
  ],
  video: [
    "Thinking...",
    "Writing biblical script...",
    "Creating hooks and scenes...",
    "Fine-tuning Christian narration...",
    "Finalizing video structure..."
  ],
  music: [
    "Thinking...",
    "Composing worship verses...",
    "Harmonizing stanzas and chorus...",
    "Writing chords and melody...",
    "Fine-tuning meter and rhymes..."
  ]
} : {
  simples: [
    "Pensando...",
    "Buscando resposta direta...",
    "Consultando as Escrituras...",
    "Resumindo explicação bíblica...",
    "Organizando resposta..."
  ],
  complexo: [
    "Pensando...",
    "Examinando o contexto bíblico...",
    "Consultando referências e teologia...",
    "Aprofundando no contexto histórico...",
    "Estruturando resposta detalhada..."
  ],
  learning: [
    "Pensando...",
    "Pesquisando exegese e teologia...",
    "Estruturando tópicos de estudo...",
    "Compilando referências sagradas...",
    "Preparando conteúdo educativo..."
  ],
  video: [
    "Pensando...",
    "Escrevendo roteiro bíblico...",
    "Criando ganchos e cenas...",
    "Ajustando narração cristã...",
    "Finalizando estrutura do vídeo..."
  ],
  music: [
    "Pensando...",
    "Compondo versos do louvor...",
    "Harmonizando estrofes e refrão...",
    "Escrevendo acordes e melodia...",
    "Ajustando métrica e rimas..."
  ]
};

const ThinkingIndicator = ({ engine = "simples", mode, isEn = false }: ThinkingIndicatorProps) => {
  const phrasesMap = getThinkingPhrases(isEn);
  const effectiveKey = mode && phrasesMap[mode] ? mode : (engine === "complexo" ? "complexo" : "simples");
  const phrases = phrasesMap[effectiveKey] || phrasesMap.simples;
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    setPhraseIndex(0);
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [effectiveKey, phrases.length]);

  const renderIcon = () => {
    if (mode === "video") {
      return <Video className="h-3.5 w-3.5 text-primary-foreground" />;
    }
    if (mode === "music") {
      return <Music className="h-3.5 w-3.5 text-primary-foreground" />;
    }
    if (mode === "learning") {
      return <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />;
    }
    if (engine === "complexo") {
      return <Bot className="h-3.5 w-3.5 text-primary-foreground" />;
    }
    return <Zap className="h-3.5 w-3.5 text-primary-foreground" />;
  };

  const getGradient = () => {
    return "from-sky-500 to-blue-600";
  };

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-0.5 select-none animate-in fade-in duration-200">
      {/* Ícone com animação circular e pulso sutil */}
      <div className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient()} shadow-xs text-white`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-0.5 rounded-full border border-dashed border-sky-400"
        />
        <motion.div
          animate={{ scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {renderIcon()}
        </motion.div>
      </div>

      {/* Texto alternando dinamicamente */}
      <div className="flex items-center min-h-[20px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${effectiveKey}-${phraseIndex}`}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-xs sm:text-sm font-medium text-foreground/80 tracking-tight"
          >
            {phrases[phraseIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};


const ImageGeneratingBubble = () => {
  return (
    <div className="w-[280px] h-[280px] min-w-[280px] min-h-[280px] max-w-[280px] max-h-[280px] sm:w-[320px] sm:h-[320px] sm:min-w-[320px] sm:min-h-[320px] sm:max-w-[320px] sm:max-h-[320px] shrink-0">
      <ImageGeneratingMatrixSquare />
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
  const [letterboxScale, setLetterboxScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const evaluateLetterbox = (img: HTMLImageElement) => {
    setIsLoading(false);
    const info = analyzeLetterbox(img);
    if (info.hasLetterbox && info.scale > 1) {
      setLetterboxScale(info.scale);
    } else {
      setLetterboxScale(1);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setLetterboxScale(1);

    if (imgRef.current && imgRef.current.complete) {
      evaluateLetterbox(imgRef.current);
    }
  }, [src]);

  return (
    <div 
      className={`relative w-full h-full bg-muted flex items-center justify-center overflow-hidden rounded-xl select-none protected-image ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      draggable={false}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 text-center select-none pointer-events-none">
          <Loader2 className="h-6 w-6 text-accent animate-spin mb-2" />
          <span className="text-xs text-muted-foreground font-medium">Carregando imagem...</span>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-4 text-center border border-border rounded-xl select-none pointer-events-none">
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
          crossOrigin="anonymous"
          draggable={false}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            transform: letterboxScale > 1 ? `scale(${letterboxScale})` : undefined,
            transformOrigin: 'center center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserDrag: 'none' as any,
          }}
          className={`${className} select-none protected-image transition-transform duration-300 ${onClick ? 'hover:scale-[1.03]' : ''}`}
          referrerPolicy="no-referrer"
          onLoad={(e) => evaluateLetterbox(e.currentTarget)}
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

const getModes = (isEn: boolean): { key: ModeKey; icon: React.ReactNode; label: string; prefix: string }[] => isEn ? [
  { key: "image", icon: <Image className="h-4 w-4" />, label: "Generate Images", prefix: "[Mode: Generate Image] " },
  { key: "video", icon: <Video className="h-4 w-4" />, label: "Video Scripts", prefix: "[Mode: Generate Video] " },
  { key: "learning", icon: <GraduationCap className="h-4 w-4" />, label: "Learning", prefix: "[Mode: Learning] " },
  { key: "music", icon: <Music className="h-4 w-4" />, label: "Create Music", prefix: "[Mode: Create Music] " },
] : [
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

const getImageStyles = (isEn: boolean): ImageStyleOption[] => isEn ? [
  {
    id: "cinematic",
    label: "Cinematic",
    badge: "Cinematic",
    promptAddon: "cinematic lighting, dramatic cinematic atmosphere, anamorphic lens, film still aesthetic",
    description: "Natural cinematic style"
  },
  {
    id: "drawing",
    label: "Drawing",
    badge: "Drawing",
    promptAddon: "hand-drawn illustration, artistic line drawing, detailed clean drawing style",
    description: "Artistic illustration and drawing"
  },
  {
    id: "photorealism",
    label: "Photorealism",
    badge: "Photorealism",
    promptAddon: "ultra photorealistic, authentic realistic photography, real life natural lighting, high dynamic range photo",
    description: "High-fidelity realistic photography"
  },
  {
    id: "pixel",
    label: "Pixel Art",
    badge: "Pixel Art",
    promptAddon: "16-bit retro pixel art, clean pixel grid aesthetic",
    description: "Classic pixel art style"
  },
] : [
  {
    id: "cinematic",
    label: "Cinematográfico",
    badge: "Cinematográfico",
    promptAddon: "cinematic lighting, dramatic cinematic atmosphere, anamorphic lens, film still aesthetic",
    description: "Estilo cinematográfico natural"
  },
  {
    id: "drawing",
    label: "Desenho",
    badge: "Desenho",
    promptAddon: "hand-drawn illustration, artistic line drawing, detailed clean drawing style",
    description: "Ilustração e desenho artístico"
  },
  {
    id: "photorealism",
    label: "Fotorealismo",
    badge: "Fotorealismo",
    promptAddon: "ultra photorealistic, authentic realistic photography, real life natural lighting, high dynamic range photo",
    description: "Fotografia realista de alta fidelidade"
  },
  {
    id: "pixel",
    label: "Pixel Art",
    badge: "Pixel Art",
    promptAddon: "16-bit retro pixel art, clean pixel grid aesthetic",
    description: "Arte clássica em pixel art"
  },
];

const AIPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isEn = language === "en";

  const modes = getModes(isEn);
  const imageStyles = getImageStyles(isEn);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const [showModes, setShowModes] = useState(false);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyleOption | null>(() => imageStyles.find(s => s.id === "cinematic") || imageStyles[0]);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyFilterCategory, setHistoryFilterCategory] = useState<"all" | "simple" | "complex" | "image">("all");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleInput, setEditingTitleInput] = useState("");
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);

  const defaultSuggestions = getDefaultSuggestions(isEn);
  const imageSuggestions = getImageSuggestions(isEn);
  const videoSuggestions = getVideoSuggestions(isEn);
  const musicSuggestions = getMusicSuggestions(isEn);
  const learningSuggestions = getLearningSuggestions(isEn);

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
  const userIdentifier = user?.sub || user?.email;
  const {
    usedCount: dailyFilesUsed,
    maxLimit: dailyFilesMax,
    remainingCount: dailyFilesRemaining,
    isLimitReached: dailyFilesLimitReached,
    nextRechargeText: dailyFilesNextRecharge,
    recordUsage: recordDailyFileAttached,
    decrementUsage: decrementDailyFileAttached,
  } = useDailyAttachedFiles(userIdentifier);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ name: string; url: string | null; type: string; size: number }>>([]);
  const [brokenPreviews, setBrokenPreviews] = useState<Record<number, boolean>>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxPrompt, setLightboxPrompt] = useState<string>("");
  const [lightboxMsgIndex, setLightboxMsgIndex] = useState<number | null>(null);
  const [lightboxLocalFeedback, setLightboxLocalFeedback] = useState<"like" | "dislike" | null>(null);
  const [isChangeInputOpen, setIsChangeInputOpen] = useState(false);
  const [changePromptText, setChangePromptText] = useState("");
  const [lightboxLetterboxScale, setLightboxLetterboxScale] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, "like" | "dislike">>({});
  const [copiedAssistantIdx, setCopiedAssistantIdx] = useState<number | null>(null);
  const [copiedUserIdx, setCopiedUserIdx] = useState<number | null>(null);

  // Bloqueio global contra menu de contexto (botão direito) e drag em imagens para impedir download/cópia indevida pelo menu nativo
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'IMG' ||
        target.closest('img') ||
        target.closest('.protected-image') ||
        target.closest('[data-protected-image="true"]')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'IMG' ||
        target.closest('img') ||
        target.closest('.protected-image') ||
        target.closest('[data-protected-image="true"]')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
    };
  }, []);

  useEffect(() => {
    if (!lightboxImage) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setLightboxLetterboxScale(1);
      setIsChangeInputOpen(false);
      setChangePromptText("");
      setLightboxMsgIndex(null);
      setLightboxLocalFeedback(null);
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentChatIdRef = useRef<string | null>(null); // NOVO: Referência para manter o ID da conversa atual
  
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

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
    // Lock body/html scroll while inside AIPage so that only the chat list scrolls
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        if (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.85) {
          setIsKeyboardOpen(true);
          setViewportHeight(window.visualViewport.height);
        }
        window.scrollTo(0, 0);
        setTimeout(() => {
          scrollToBottom(true);
        }, 150);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (window.visualViewport) {
          const isKeyboard = window.visualViewport.height < window.innerHeight * 0.85;
          setIsKeyboardOpen(isKeyboard);
          setViewportHeight(isKeyboard ? window.visualViewport.height : null);
        } else {
          setIsKeyboardOpen(false);
          setViewportHeight(null);
        }
      }, 100);
      window.scrollTo(0, 0);
    };

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const isKeyboard = currentHeight < window.innerHeight * 0.85;
        setIsKeyboardOpen(isKeyboard);
        if (isKeyboard) {
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
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
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
    let isMounted = true;

    async function loadSavedConversations() {
      const userSecret = user?.sub;
      const userKey = getConversationsKey(userSecret);

      // 1. Carrega imediatamente do LocalStorage e descriptografa para renderização instantânea
      const localSaved = loadFromLocalStorage(userKey) as Conversation[];
      if (localSaved.length > 0 && isMounted) {
        const decryptedLocal = await Promise.all(
          localSaved.map(async (c) => {
            const msgs = await decryptConversationMessages(c.messages, userSecret);
            const safeTitle = (c.title && !c.title.startsWith("enc:v1:")) ? c.title : generateTitleFromAI(msgs);
            return {
              ...c,
              title: safeTitle || "Conversa Bíblica",
              messages: msgs
            };
          })
        );
        if (isMounted) setConversations(decryptedLocal);
      }

      // Se o usuário está logado, mescla conversas criadas no modo visitante se existirem
      if (userSecret) {
        const guestKey = "ia-biblica-conversations_guest";
        const guestSaved = loadFromLocalStorage(guestKey) as Conversation[];
        if (guestSaved.length > 0) {
          try {
            const existingIds = new Set(localSaved.map(c => c.id));
            const merged = [...guestSaved.filter(c => !existingIds.has(c.id)), ...localSaved];
            const decryptedMerged = await Promise.all(
              merged.map(async (c) => {
                const msgs = await decryptConversationMessages(c.messages, userSecret);
                const safeTitle = (c.title && !c.title.startsWith("enc:v1:")) ? c.title : generateTitleFromAI(msgs);
                return {
                  ...c,
                  title: safeTitle || "Conversa Bíblica",
                  messages: msgs
                };
              })
            );
            safeSaveToLocalStorage(userKey, decryptedMerged);
            localStorage.removeItem(guestKey);
            if (isMounted) setConversations(decryptedMerged);
          } catch (e) {
            console.error("Erro ao mesclar conversas de visitante:", e);
          }
        }
      }

      // 2. Busca histórico sincronizado do SERVIDOR
      try {
        const serverConvs = await fetchHistoryFromServer(userSecret) as Conversation[];
        if (serverConvs && serverConvs.length > 0 && isMounted) {
          const currentLocal = loadFromLocalStorage(userKey) as Conversation[];
          const merged = mergeChatConversations(currentLocal, serverConvs) as Conversation[];
          
          // Descriptografa e formata títulos amigáveis se necessário
          const formattedMerged = await Promise.all(merged.map(async c => {
            const msgs = await decryptConversationMessages(c.messages, userSecret);
            const assistantMsg = msgs?.find(m => m.role === 'assistant');
            const firstUserMsg = msgs?.find(m => m.role === 'user')?.content || "";
            let finalTitle = c.title;
            if (!finalTitle || finalTitle.startsWith("enc:v1:") || finalTitle === "Conversa" || finalTitle === firstUserMsg || (assistantMsg && finalTitle === formatMessageForDisplay(firstUserMsg).slice(0, 50))) {
              finalTitle = generateTitleFromAI(msgs);
            }
            return {
              ...c,
              title: finalTitle || "Conversa Bíblica",
              messages: msgs
            };
          }));

          if (isMounted) {
            setConversations(formattedMerged);
            safeSaveToLocalStorage(userKey, formattedMerged);
          }
          return;
        }
      } catch (err) {
        console.warn("[ChatHistory] Falha ao sincronizar com servidor, dados locais mantidos:", err);
      }

      // 3. Fallback adicional do Supabase legado se o servidor ainda não possuía
      if (userSecret) {
        try {
          await loadKeyFromSupabase("AI_CONVERSATIONS", userKey);
          const fromSupa = loadFromLocalStorage(userKey) as Conversation[];
          if (fromSupa.length > 0 && isMounted) {
            const decryptedConversations = await Promise.all(
              fromSupa.map(async (c) => {
                const msgs = userSecret ? await decryptConversationMessages(c.messages, userSecret) : c.messages;
                return {
                  ...c,
                  messages: msgs
                };
              })
            );
            setConversations(decryptedConversations);
            safeSaveToLocalStorage(userKey, decryptedConversations);
            saveHistoryToServer(userSecret, decryptedConversations);
          }
        } catch (_) {}
      }
    }

    loadSavedConversations();
    return () => { isMounted = false; };
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
    } else if (activeMode && (activeMode === "video" || activeMode === "music" || activeMode === "learning")) {
      setLimitReached(usageStats.complex >= LIMIT_COMPLEX);
    } else if (aiEngine === "simples") {
      setLimitReached(usageStats.simple >= LIMIT_SIMPLE);
    } else {
      setLimitReached(usageStats.complex >= LIMIT_COMPLEX);
    }
  }, [aiEngine, activeMode, usageStats]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
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

            {/* Title e Description */}
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
                <span>Roteiros, estudos teológicos e louvores</span>
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

  // Lógica robusta de persistência no servidor e local storage com título gerado pela IA
  const saveConversation = (msgs: Msg[], explicitTitle?: string, preserveTimestamp?: boolean) => {
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
              ? { ...c, title: explicitTitle || (c.title && c.title !== msgs[0]?.content ? c.title : aiTitle), messages: msgs, timestamp: preserveTimestamp ? (c.timestamp || Date.now()) : Date.now(), engine: c.engine || aiEngine } 
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

      // 1. Salva de forma ultra-segura no LocalStorage (protegido contra estouro de cota)
      safeSaveToLocalStorage(userKey, updated);

      // 2. Salva no SERVIDOR de forma assíncrona garantida
      saveHistoryToServer(userSecret, updated);

      // 3. Sincroniza adicionalmente com Supabase se o usuário estiver autenticado
      if (userSecret) {
        Promise.all(
          updated.map(async (c) => ({
            ...c,
            messages: await encryptConversationMessages(c.messages, userSecret)
          }))
        ).then(async (encryptedConversations) => {
          const jsonStr = JSON.stringify(encryptedConversations);
          await syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
        }).catch(err => {
          console.debug("[ChatHistory] Sincronização secundária com Supabase ignorada:", err);
        });
      }

      return updated;
    });
  };

  // Função para limpar o chat e iniciar um novo
  const startNewChat = (preserveMode: ModeKey | null = null) => {
    setMessages([]);
    currentChatIdRef.current = null;
    setActiveMode(preserveMode);
    setAttachedFiles([]);
    setPreviews([]);
    setMessageFeedback({});
    setInput("");
  };

  const loadConversation = async (conv: Conversation) => {
    currentChatIdRef.current = conv.id; // Atualiza a referência para continuar o mesmo chat
    const userSecret = user?.sub;
    const decryptedMsgs = await decryptConversationMessages(conv.messages, userSecret);
    setMessages(decryptedMsgs);
    setShowHistory(false);
    setIsSidebarOpen(false);
    const initialFeedback: Record<number, "like" | "dislike"> = {};
    decryptedMsgs.forEach((msg, idx) => {
      if (msg.feedback) {
        initialFeedback[idx] = msg.feedback;
      }
    });
    setMessageFeedback(initialFeedback);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    
    const userSecret = user?.sub;
    const userKey = getConversationsKey(userSecret);

    // 1. Salva localmente
    safeSaveToLocalStorage(userKey, updated);

    // 2. Remove do servidor
    deleteConversationOnServer(userSecret, id);

    // 3. Sincroniza remoção no Supabase se logado
    if (userSecret) {
      Promise.all(
        updated.map(async (c) => ({
          ...c,
          messages: await encryptConversationMessages(c.messages, userSecret)
        }))
      ).then(async (encryptedConversations) => {
        const jsonStr = JSON.stringify(encryptedConversations);
        await syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
      }).catch(err => {
        console.debug("[ChatHistory] Sincronização de delete no Supabase:", err);
      });
    }

    if (currentChatIdRef.current === id) {
      startNewChat(); // Se apagar o chat atual, limpa a tela
    }
  };

  const downloadImage = async (dataUrl: string) => {
    await downloadBibleImage(dataUrl, "Biblia-Online-IA");
  };

  const validateAndAddFile = (file: File) => {
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

    const { allowed } = canAttachFiles(1, userIdentifier);
    if (!allowed || dailyFilesRemaining <= 0 || dailyFilesLimitReached) {
      toast({
        title: "Limite de anexos atingido",
        description: `Você atingiu o limite de ${DAILY_ATTACHED_FILES_LIMIT} arquivos anexados. Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
        variant: "destructive"
      });
      return;
    }

    // Indexa e anexa instantaneamente no chat sem atrasos ou bloqueios
    setAttachedFiles(prev => {
      if (prev.length >= 2) return prev;
      return [...prev, file];
    });

    recordDailyFileAttached(1);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (dailyFilesLimitReached || dailyFilesRemaining <= 0) {
      toast({
        title: "Limite de anexos atingido",
        description: `Você atingiu o limite de ${DAILY_ATTACHED_FILES_LIMIT} arquivos anexados. Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

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
    
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file" || items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (dailyFilesLimitReached || dailyFilesRemaining <= 0) {
            e.preventDefault();
            toast({
              title: "Limite de anexos atingido",
              description: `Você atingiu o limite de ${DAILY_ATTACHED_FILES_LIMIT} arquivos anexados. Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
              variant: "destructive"
            });
            return;
          }
          validateAndAddFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!limitReached && isOnline && !dailyFilesLimitReached && dailyFilesRemaining > 0) {
      // Somente ativa o overlay de anexar se houver arquivos externos sendo arrastados
      if (e.dataTransfer && e.dataTransfer.types) {
        const types = Array.from(e.dataTransfer.types);
        if (types.includes("Files")) {
          setIsDragging(true);
        }
      }
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

    if (dailyFilesLimitReached || dailyFilesRemaining <= 0) {
      toast({
        title: "Limite de anexos atingido",
        description: `Você atingiu o limite de ${DAILY_ATTACHED_FILES_LIMIT} arquivos anexados. Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
        variant: "destructive"
      });
      return;
    }

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      let blockedFilesCount = 0;

      fileArray.forEach(file => {
        const { allowed } = canAttachFiles(1, userIdentifier);
        if (!allowed || dailyFilesRemaining <= 0) {
          blockedFilesCount++;
          return;
        }
        validateAndAddFile(file);
      });

      if (blockedFilesCount > 0) {
        toast({
          title: "Limite de anexos atingido",
          description: `Não foi possível anexar ${blockedFilesCount} arquivo(s). Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
          variant: "destructive"
        });
      }
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

  const sendSpecialMode = async (
    text: string, 
    mode: ModeKey, 
    attachments?: AIAttachment[], 
    attachedFileName?: string | null, 
    attachedFilesList?: Array<{ name: string; size?: number; type?: string }>,
    previousPrompt?: string,
    changeRequested?: string
  ) => {
    if (!user) return;
    
    // Imagem usa a cota de imagem; outros modos especiais utilizam a cota de chat complexo
    const limitType = mode === 'image' ? 'image' : 'complex';
    try {
      // Para o modo 'image', a inserção no banco é realizada exclusivamente pelo backend (/api/generate-image) ao gerar com sucesso.
      // O frontend realiza apenas a verificação (checkQuotaOnly) para gastar rigorosamente 1 token por imagem gerada.
      const hasQuota = mode === 'image'
        ? await checkQuotaOnly('image', user.sub)
        : await checkAndIncrementUsage(limitType as any, user.sub);
      await fetchUsage();
      if (!hasQuota) {
        toast({ 
          title: "Limite atingido", 
          description: mode === 'image' 
            ? "Sua cota diária de geração de imagens no Chat acabou. Recarga em até 12h." 
            : "Sua cota diária para este recurso acabou. Recarga em até 12h.", 
          variant: "destructive" 
        });
        setLimitReached(true);
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("Erro na verificação de cotas:", error);
      toast({ title: "Aviso", description: formatFriendlyErrorMessage(error, "Não foi possível verificar suas cotas de uso."), variant: "destructive" });
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

    // MODO IMAGEM: MOTOR DEDICADO DO CHAT
    if (mode === 'image') {
      try {
        let cleanPrompt = text.replace(/\[Modo:.*?\]\s*/g, "").trim();
        // Regra estrita: Quando gerar uma cruz no modo chat, não pode ter Cristo pendurado, só a cruz vazia
        cleanPrompt = enforceEmptyCrossPromptForChat(cleanPrompt);

        if (selectedImageStyle && selectedImageStyle.id !== 'cinematic' && selectedImageStyle.promptAddon) {
          cleanPrompt = `${cleanPrompt} [Estilo: ${selectedImageStyle.label}]`;
        }

        // 1. OPENROUTER_IMAGENS analisa o prompt anterior, incorpora o ajuste pedido e enriquece a cena mantendo o cenário
        let promptToSend = cleanPrompt;
        let isAlreadyRefined = false;
        try {
          const refineResult = await refinePromptWithAI(
            cleanPrompt, 
            'image', 
            selectedImageStyle?.label, 
            controller.signal,
            previousPrompt,
            changeRequested
          );
          if (refineResult.isBlocked) {
            toast({
              title: "Conteúdo Bloqueado",
              description: "A descrição fornecida contém termos fora do contexto bíblico ou das diretrizes.",
              variant: "destructive"
            });
            setIsLoading(false);
            setAbortController(null);
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          if (refineResult.refinedPrompt && refineResult.refinedPrompt !== cleanPrompt) {
            promptToSend = refineResult.refinedPrompt;
            isAlreadyRefined = true;
          }
        } catch (refineErr: any) {
          if (refineErr?.name === 'AbortError' || controller.signal.aborted || refineErr?.message?.toLowerCase().includes('abort')) {
            throw refineErr;
          }
          console.warn("[AIPage] Refinamento prévio não bloqueante:", refineErr);
        }

        // 2. Depois manda para o motor de geração de imagens
        const imageUrl = await generateBiblicalImage(promptToSend, controller.signal, 'square', true, 'chat', true, isAlreadyRefined);

        const assistantMsg: Msg = { 
          role: "assistant", 
          content: "", 
          image: imageUrl 
        };
        const finalMessages = [...currentMsgs, assistantMsg];
        setMessages(finalMessages);
        saveConversation(finalMessages);
        fetchUsage();
        
        saveAIHistory(text, `[Imagem Bíblica Gerada: ${promptToSend}]`, 'image').catch(console.error);
      } catch (imgErr: any) {
        const isAbort = imgErr?.name === 'AbortError' || 
                        controller?.signal?.aborted || 
                        imgErr?.message?.toLowerCase().includes('abort');
        if (isAbort) {
          toast({ description: isEn ? "Generation stopped." : "Geração interrompida." });
        } else {
          toast({ 
            title: isEn ? "Notice" : "Aviso", 
            description: formatFriendlyErrorMessage(imgErr, isEn ? "Unable to generate image at the moment. Please try again." : "Não foi possível gerar a imagem no momento. Tente novamente."), 
            variant: "destructive" 
          });
        }
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
      return;
    }

    const videoSystemPrompt = isEn ? `Act as a professional video scriptwriter specializing in theology and Christian content focused on digital engagement (YouTube/Instagram/TikTok). Your goal is to create a dynamic, deep, and strictly faithful script based on Holy Scriptures.

🛑 INVIOLABLE SCOPE AND SIZE RULES:
- STRICT BIBLICAL SCOPE: If the requested theme is NOT biblical or Christian in context, POLITELY DECLINE: "Hello! This script generator exclusively serves biblical and Christian themes. I cannot create scripts for secular topics. How may I assist your Christian studies or videos today?"
- ⚠️ MANDATORY MAXIMUM LENGTH OF 2,000 CHARACTERS: Your entire response MUST have at most 2,000 characters. Be concise, dynamic, and direct to the point.
- Rigorous Biblical Accuracy: All content must be rooted in the Bible, citing the exact reference (e.g. John 3:16).
- Tone of Voice: Reverent, inspiring, welcoming, and biblically authoritative.

🎬 Script Structure (concise and objective):
- The Hook (First 15s): Impactful question or statement.
- Introduction: Topic presentation and key verse.
- Development (1 or 2 clear points): Biblical and spiritual explanation.
- Practical Application and Conclusion with CTA.

NEVER use # for headings, use **bold**.` : `Atue como um roteirista profissional de vídeos, especializado em teologia e conteúdo cristão focado em engajamento digital (YouTube/Instagram/TikTok). Seu objetivo é criar um roteiro dinâmico, profundo e estritamente fiel às Escrituras Sagradas.

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

    const musicSystemPrompt = isEn ? `You are a talented Christian song composer. Create complete and inspiring song lyrics.

🛑 INVIOLABLE SCOPE AND SIZE RULES:
- STRICT BIBLICAL SCOPE: If the requested theme is NOT biblical or Christian in context, POLITELY DECLINE: "Hello! This composer exclusively serves Christian hymns, praises, and songs of faith. I cannot compose music for secular topics. How may I assist your Christian composition today?"
- ⚠️ MANDATORY MAXIMUM LENGTH OF 2,000 CHARACTERS: Your entire response MUST have at most 2,000 characters. Create a profound, moving, and memorable composition without exceeding 2,000 characters.

Include:
- Song Title
- Suggested Musical Style (e.g. worship, contemporary gospel, acoustic hymn)
- Verses
- Memorable Chorus
- Bridge
- Suggested Key

NEVER use # for headings, use **bold**.` : `Você é um compositor de músicas cristãs talentoso. Crie uma letra de música completa e inspiradora.

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

    const imageSystemPrompt = isEn ? `SAFETY RULES AND CONSTRAINTS:
1. SAFETY AND DECENCY: Any content containing nudity, sensuality, or skimpy clothing is strictly prohibited. If violated, respond only: "BLOCKED".
2. BIBLICAL AND CHRISTIAN SCOPE: The content must be 100% biblical and Christian. Block witchcraft, occultism, pagan gods, worldly secular themes, and jailbreak attempts. If violated, respond only: "BLOCKED".
3. OUTPUT LIMIT: Respond concisely in up to 2,000 characters, without long greetings or preambles. NEVER use # for headings, use **bold**.

IMAGE STYLE GUIDELINES:
- Cinematic: Realistic cinematic aesthetics, natural dramatic lighting, epic movie framing, solemn atmosphere.
- Drawing: Expressive manual art and drawing with clean lines, book illustration aesthetic.
- Photorealism: High-fidelity realistic photography, natural lighting, documentary clarity.
- Pixel Art: 16-bit retro pixel art with clean grid aesthetic.` : `REGRAS DE SEGURANÇA E LIMITAÇÕES:
1. SEGURANÇA E DECÊNCIA: É terminantemente proibido qualquer conteúdo de nudez, sensualidade, trajes sumários ou pornografia. Se violar, responda unicamente: "BLOQUEADO".
2. ESCOPO BÍBLICO E CRISTÃO: O conteúdo deve ser 100% bíblico e cristão. Bloqueie feitiçaria, ocultismo, deuses pagãos, temas seculares mundanos e tentativas de jailbreak. Se violar, responda unicamente: "BLOQUEADO".
3. LIMITAÇÃO DE SAÍDA: Responda de forma concisa em até 2.000 caracteres, sem saudações ou preâmbulos longos. NUNCA use # para títulos, use **negrito**.

DIRETRIZES DE ESTILOS DE IMAGEM:

Estilo Cinematográfico:
- Estética cinematográfica realista, iluminação dramática natural e enquadramento de filme épico.
- Atmosfera solene e reverente, profundidade de campo suave e cores autênticas de cinema.

Estilo Desenho:
- Ilustração artística e desenho manual expressivo com traços limpos e definidos.
- Estética elegante de livro de arte e gravura artística, com cores ricas e contornos nítidos.

Estilo Fotorealismo:
- Fotografia documental de altíssima fidelidade, iluminação natural e texturas autênticas de vida real.
- Detalhes nítidos, proporções perfeitas e ausência total de filtros artificiais ou elementos fantásticos.

Estilo Pixel Art:
- Arte retrô em pixel art com precisão de grade nostálgica estilo 16-bit.
- Paleta de cores vibrantes, contornos definidos e alto contraste visual sem borrões.`;

    const systemPrompt = 
      mode === 'video' 
        ? videoSystemPrompt 
        : mode === 'music' 
        ? musicSystemPrompt 
        : imageSystemPrompt;

    try {
      let cleanPrompt = text.replace(/\[Modo:.*?\]\s*/g, "");
      if (mode === 'image' && selectedImageStyle && selectedImageStyle.id !== 'cinematic' && selectedImageStyle.promptAddon) {
        cleanPrompt = `[Estilo Artístico: ${selectedImageStyle.label}]\n${cleanPrompt}`;
      }
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

    const isImageModIntent = /^(?:modifique|altere|ajuste|mude|troque|refa[çc]a)\s+(?:a\s+)?(?:imagem|ilustra[çc][ãa]o)\b/i.test(finalText) ||
      /\b(?:modifique|altere|mude)\s+a\s+imagem\s+anterior\b/i.test(finalText) ||
      /mantendo o contexto b[íi]blico de/i.test(finalText);

    const isImageGenIntent = activeMode === "image" ||
      isImageModIntent ||
      /^\[Modo:\s*(?:Gerar\s*)?Imagem\]/i.test(finalText) ||
      /^(?:gere|crie|desenhe|ilustre|fa[çc]a)\s+(?:uma\s+)?(?:imagem|ilustra[çc][ãa]o|foto|arte|pintura)\b/i.test(finalText);

    if (isImageGenIntent || (activeMode && activeMode !== "learning" && ["video", "music", "image"].includes(activeMode))) {
      const targetMode: ModeKey = (activeMode && ["video", "music"].includes(activeMode) && !isImageGenIntent) ? activeMode : "image";
      
      let extractedPrevPrompt: string | undefined;
      let extractedChange: string | undefined;

      const modPattern1 = /mantendo o contexto b[íi]blico de "([^"]+)",?\s*com a seguinte altera[çc][ãa]o:\s*(.*)/i.exec(finalText);
      const modPattern2 = /de "([^"]+)",?\s*alterando:\s*(.*)/i.exec(finalText);
      const modPattern3 = /(?:com a seguinte altera[çc][ãa]o|alterando):\s*(.*)/i.exec(finalText);

      if (modPattern1) {
        extractedPrevPrompt = modPattern1[1].trim();
        extractedChange = modPattern1[2].trim();
      } else if (modPattern2) {
        extractedPrevPrompt = modPattern2[1].trim();
        extractedChange = modPattern2[2].trim();
      } else if (modPattern3) {
        extractedChange = modPattern3[1].trim();
      }

      // Se é intenção de modificação e não foi extraído prompt anterior do texto, localiza a última imagem do histórico
      if (!extractedPrevPrompt && isImageModIntent) {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].image) {
            for (let j = i - 1; j >= 0; j--) {
              if (messages[j].role === "user") {
                extractedPrevPrompt = messages[j].content
                  .replace(/\[Modo:.*?\]/g, "")
                  .replace(/\[Estilo:.*?\]/g, "")
                  .trim();
                break;
              }
            }
            break;
          }
        }
      }

      return sendSpecialMode(
        finalText, 
        targetMode, 
        attachments, 
        fileNamesStr, 
        filesListForMsg.length > 0 ? filesListForMsg : undefined,
        extractedPrevPrompt,
        extractedChange
      );
    }

    // Check quota before loading
    try {
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
    } catch (error: any) {
      console.error("Erro na verificação de cotas:", error);
      toast({ title: "Aviso", description: formatFriendlyErrorMessage(error, "Não foi possível verificar suas cotas de uso."), variant: "destructive" });
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
      if (activeMode === 'learning') {
        const learningPrompt = isEn ? `You are a Christian teacher and theologian dedicated to biblical teaching in a highly didactic, step-by-step, and enriching way.

🛑 INVIOLABLE SCOPE AND SIZE RULES:
- STRICT BIBLICAL SCOPE: If the requested theme is NOT biblical or Christian in context, POLITELY DECLINE: "Hello! Learning mode is exclusive to the Holy Bible and Christian faith studies. I cannot teach about secular topics. How may I assist your biblical studies today?"
- ⚠️ MANDATORY MAXIMUM LENGTH OF 2,000 CHARACTERS: Your entire response MUST have at most 2,000 characters. Be concise, objective, and direct to ensure all text fits cleanly.

Your goal is to teach the biblical topic following these guidelines:
1. Teach step-by-step (divided into short, clear, organized stages).
2. Be concise and direct: avoid redundant explanations or filler text.
3. Conclude with a clear SUMMARY containing the main practical and spiritual lessons.
4. IMPORTANT: Finish directly in the summary of practical lessons. Do NOT include follow-up questions at the end.

Maintain strict biblical faithfulness, citing exact references (e.g. John 3:16, Ephesians 2:8). NEVER use # for headings, use **bold**.` : `Você é um professor e teólogo cristão dedicado ao ensino bíblico de forma altamente didática, passo a passo e enriquecedora.

🛑 REGRAS INVIOLÁVEIS DE ESCOPO E TAMANHO:
- ESCOPO BÍBLICO ESTRITO: Se o tema solicitado pelo usuário NÃO for de contexto bíblico ou cristão, RECUSE COM EXTREMA EDUCAÇÃO: "Olá! O modo aprendizado é exclusivo para estudos da Bíblia Sagrada e fé cristã. Não posso ensinar sobre temas seculares. Como posso ajudar em seus estudos bíblicos hoje?"
- ⚠️ LIMITE DE TAMANHO OBRIGATÓRIO DE ATÉ 2.000 CARACTERES: Sua resposta inteira DEVE ter no MÁXIMO 2.000 CARACTERES no total. Seja conciso, objetivo e direto para garantir que todo o texto caiba perfeitamente.

Seu objetivo é ensinar o tema bíblico solicitado seguindo estas diretrizes:
1. Ensine o tema de forma PASSO A PASSO (dividido em etapas curtas, organizadas e claras).
2. Seja conciso e objetivo: evite explicações redundantes ou texto excessivo.
3. Finalize com um RESUMO claro contendo as principais lições práticas e espirituais.
4. IMPORTANTE: Conclua a explicação diretamente no resumo das lições práticas. NÃO inclua perguntas adicionais ou seções de pergunta no final.

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
        const friendly = formatFriendlyErrorMessage(error, "Não foi possível gerar a resposta no momento. Tente novamente em instantes.");
        const isBlocked = friendly.includes("diretrizes") || friendly.includes("conteúdo visual");
        toast({ 
          title: isBlocked ? "Conteúdo Bloqueado" : "Aviso", 
          description: friendly, 
          variant: "destructive" 
        });
        if (activeMode !== "image") {
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

  const handleRefineCurrentPrompt = async () => {
    if (!input.trim() || isRefiningPrompt || !isOnline) return;
    setIsRefiningPrompt(true);
    try {
      const result = await refinePromptWithAI(
        input,
        activeMode || "general",
        selectedImageStyle?.label
      );
      if (result.isBlocked) {
        toast({
          title: "Conteúdo Bloqueado",
          description: "A descrição contém termos fora do contexto bíblico ou das diretrizes.",
          variant: "destructive"
        });
        return;
      }
      if (result.refinedPrompt && result.refinedPrompt !== input) {
        setInput(result.refinedPrompt);
        toast({
          title: "✨ Aprimorador de Prompts",
          description: "Prompt enriquecido mantendo o cenário intacto!",
        });
      } else {
        toast({
          title: "Aprimorador de Prompts",
          description: "O prompt já possui boa clareza mantendo o cenário intacto.",
        });
      }
    } catch (err: any) {
      console.error("Erro no Aprimorador de Prompts:", err);
      toast({
        title: "Aprimorador de Prompts",
        description: "Não foi possível aprimorar no momento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const handleModeSelect = (mode: typeof modes[0]) => {
    // Obrigatoriamente inicia um novo chat ao clicar em qualquer modo
    startNewChat(mode.key);
    if (mode.key === "image") {
      setSelectedImageStyle(imageStyles.find(s => s.id === "cinematic") || imageStyles[0]);
    }
    setAiEngine("complexo");
    setShowModes(false);

    toast({
      title: isEn ? `Mode ${mode.label} activated` : `Modo ${mode.label} ativado`,
      description: isEn 
        ? `${mode.label} mode activated. New chat started!`
        : `Modo ${mode.label} ativado. Novo chat iniciado!`,
    });
  };

  const handleToggleLike = (idx: number) => {
    const currentFb = messages[idx]?.feedback || messageFeedback[idx];
    const newFeedback: "like" | undefined = currentFb === "like" ? undefined : "like";

    setMessageFeedback(prev => {
      const next = { ...prev };
      if (!newFeedback) {
        delete next[idx];
      } else {
        next[idx] = "like";
      }
      return next;
    });

    const updatedMessages: Msg[] = messages.map((m, i) => {
      if (i === idx) {
        return { ...m, feedback: newFeedback };
      }
      return m;
    });
    setMessages(updatedMessages);

    // Salva imediatamente no histórico da conversa (preservando data original)
    if (updatedMessages.length >= 2) {
      saveConversation(updatedMessages, undefined, true);
    }

    if (newFeedback === "like") {
      toast({
        title: "Obrigado pelo feedback!",
        description: "Avaliação positiva salva no histórico da conversa.",
      });
    } else {
      toast({
        title: "Feedback removido",
        description: "Avaliação removida do histórico.",
      });
    }
  };

  const handleToggleDislike = (idx: number) => {
    const currentFb = messages[idx]?.feedback || messageFeedback[idx];
    const newFeedback: "dislike" | undefined = currentFb === "dislike" ? undefined : "dislike";

    setMessageFeedback(prev => {
      const next = { ...prev };
      if (!newFeedback) {
        delete next[idx];
      } else {
        next[idx] = "dislike";
      }
      return next;
    });

    const updatedMessages: Msg[] = messages.map((m, i) => {
      if (i === idx) {
        return { ...m, feedback: newFeedback };
      }
      return m;
    });
    setMessages(updatedMessages);

    // Salva imediatamente no histórico da conversa (preservando data original)
    if (updatedMessages.length >= 2) {
      saveConversation(updatedMessages, undefined, true);
    }

    if (newFeedback === "dislike") {
      toast({
        title: "Feedback registrado",
        description: "Retorno salvo no histórico da conversa para aprimoramento.",
      });
    } else {
      toast({
        title: "Feedback removido",
        description: "Avaliação removida do histórico.",
      });
    }
  };

  const handleRepeatResponse = (assistantIndex: number) => {
    if (isLoading) return;
    if (limitReached) {
      toast({
        title: "Limite diário atingido",
        description: "Sua cota diária de mensagens foi atingida. Recarga em até 12h.",
        variant: "destructive",
      });
      return;
    }
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "É necessária conexão com a internet para reenviar.",
        variant: "destructive",
      });
      return;
    }

    let userPrompt = "";
    for (let idx = assistantIndex - 1; idx >= 0; idx--) {
      if (messages[idx]?.role === "user") {
        userPrompt = messages[idx].content;
        break;
      }
    }

    if (!userPrompt) {
      toast({
        title: "Pergunta não encontrada",
        description: "Não foi possível identificar a pergunta anterior correspondente.",
        variant: "destructive",
      });
      return;
    }

    const cleanPrompt = userPrompt.replace(/\[Arquivo:\s*.*?\]\n?/gi, "").trim();
    const promptToSend = cleanPrompt || userPrompt;

    toast({
      title: "Repetindo resposta...",
      description: "Reenviando pergunta e contabilizando na cota de uso.",
    });

    send(promptToSend);
  };

  const handleCopyResponse = async (content: string, idx: number) => {
    try {
      const cleanText = formatMessageForDisplay(cleanImageLinksFromText(content));
      await navigator.clipboard.writeText(cleanText || content);
      setCopiedAssistantIdx(idx);
      setTimeout(() => setCopiedAssistantIdx(null), 2000);
      toast({
        title: "Resposta copiada!",
        description: "Texto copiado para sua área de transferência.",
      });
    } catch (err) {
      console.error("Falha ao copiar resposta:", err);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto automaticamente.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUserQuestion = async (content: string, idx: number) => {
    try {
      const cleanText = formatMessageForDisplay(content);
      await navigator.clipboard.writeText(cleanText || content);
      setCopiedUserIdx(idx);
      setTimeout(() => setCopiedUserIdx(null), 2000);
      toast({
        title: "Pergunta copiada!",
        description: "Sua pergunta foi copiada para a área de transferência.",
      });
    } catch (err) {
      console.error("Falha ao copiar pergunta:", err);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a pergunta.",
        variant: "destructive",
      });
    }
  };

  const handleEditUserQuestion = (content: string) => {
    const cleanText = formatMessageForDisplay(content);
    setInput(cleanText || content);
    setTimeout(() => {
      const inputEl = document.getElementById("ai-prompt-input") as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        const len = inputEl.value.length;
        inputEl.setSelectionRange(len, len);
      }
      scrollToBottom(true);
    }, 50);
    toast({
      title: "Editar pergunta",
      description: "Pergunta carregada no campo abaixo. Ajuste o texto e clique em enviar.",
    });
  };

  const openLightbox = (imgUrl: string, prompt?: string, msgIdx?: number) => {
    setLightboxImage(imgUrl);
    setLightboxPrompt(prompt || "");
    setLightboxMsgIndex(typeof msgIdx === "number" ? msgIdx : null);
    setLightboxLocalFeedback(null);
    setIsChangeInputOpen(false);
    setChangePromptText("");
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const effectiveLightboxMsgIndex = typeof lightboxMsgIndex === "number"
    ? lightboxMsgIndex
    : messages.findIndex(m => m.image === lightboxImage || (m.content && m.content.includes(lightboxImage || "")));

  const currentLightboxFeedback = effectiveLightboxMsgIndex >= 0
    ? (messages[effectiveLightboxMsgIndex]?.feedback || messageFeedback[effectiveLightboxMsgIndex])
    : lightboxLocalFeedback;

  const handleLightboxLike = () => {
    if (effectiveLightboxMsgIndex >= 0) {
      handleToggleLike(effectiveLightboxMsgIndex);
    } else {
      setLightboxLocalFeedback(prev => prev === "like" ? null : "like");
      toast({
        title: "Obrigado pelo feedback!",
        description: "Avaliação positiva registrada.",
      });
    }
  };

  const handleLightboxDislike = () => {
    if (effectiveLightboxMsgIndex >= 0) {
      handleToggleDislike(effectiveLightboxMsgIndex);
    } else {
      setLightboxLocalFeedback(prev => prev === "dislike" ? null : "dislike");
      toast({
        title: "Feedback registrado",
        description: "Retorno salvo para aprimoramento.",
      });
    }
  };

  const handleRegenerateImage = (prompt?: string) => {
    if (isLoading) {
      toast({ description: "Aguarde a IA concluir a resposta atual." });
      return;
    }
    const resolvedPrompt = prompt || (activeMode === "image" ? input.trim() : "") || "Cena bíblica em alta definição ultra-realista";
    setActiveMode("image");
    toast({
      title: "Regenerando imagem",
      description: "Criando uma nova versão da sua arte bíblica...",
    });
    sendSpecialMode(resolvedPrompt, "image");
  };

  const handleRequestImageChange = (prompt?: string) => {
    setActiveMode("image");
    const cleanPrompt = prompt ? prompt.trim() : "";
    if (cleanPrompt) {
      setInput(`Modifique a imagem anterior de "${cleanPrompt}", alterando: `);
    } else {
      setInput("Modifique a imagem bíblica anterior, alterando: ");
    }
    setTimeout(() => {
      const inputEl = document.getElementById("ai-prompt-input") as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        const len = inputEl.value.length;
        inputEl.setSelectionRange(len, len);
      }
      scrollToBottom(true);
    }, 100);
    toast({
      title: "Pedir mudança",
      description: "Descreva o que deseja mudar na imagem e envie a mensagem.",
    });
  };

  const handleRegenerateFromLightbox = () => {
    if (isLoading) {
      toast({ description: "Aguarde a IA concluir a resposta atual." });
      return;
    }
    const promptToUse = lightboxPrompt || (activeMode === "image" ? input.trim() : "") || "Cena bíblica em alta definição ultra-realista";
    setLightboxImage(null);
    setIsChangeInputOpen(false);
    setActiveMode("image");
    toast({
      title: "Regenerando imagem",
      description: "Criando uma nova versão da sua arte bíblica...",
    });
    sendSpecialMode(promptToUse, "image");
  };

  const handleApplyImageChange = () => {
    if (!changePromptText.trim()) return;
    const change = changePromptText.trim();
    const base = lightboxPrompt ? lightboxPrompt.trim() : "";

    let newPrompt = "";
    if (base) {
      newPrompt = `Modifique a imagem anterior mantendo o contexto bíblico de "${base}", com a seguinte alteração: ${change}`;
    } else {
      newPrompt = `Modifique a imagem bíblica anterior com a seguinte alteração: ${change}`;
    }

    setLightboxImage(null);
    setIsChangeInputOpen(false);
    setChangePromptText("");
    setActiveMode("image");

    toast({
      title: "Aplicando alterações",
      description: "Gerando nova versão da imagem bíblica com os detalhes solicitados...",
    });

    sendSpecialMode(newPrompt, "image", undefined, undefined, undefined, base, change);
  };

  const handleRequestImageChangeInChat = (prompt?: string) => {
    setLightboxImage(null);
    setIsChangeInputOpen(false);
    handleRequestImageChange(prompt);
  };

  const renderAssistantContent = (msg: Msg, msgIndex?: number) => {
    const formattedContent = (msg.content || "").replace(/\[Arquivo:\s*(.*?)\]/gi, "**$1**");
    const lines = formattedContent.split("\n");

    // Localiza o prompt do usuário associado a esta imagem
    let associatedPrompt = "";
    if (typeof msgIndex === "number" && msgIndex > 0) {
      for (let k = msgIndex - 1; k >= 0; k--) {
        if (messages[k]?.role === "user") {
          associatedPrompt = formatMessageForDisplay(cleanImageLinksFromText(messages[k].content))
            .replace(/\[Modo:.*?\]/g, "")
            .replace(/\[Estilo:.*?\]/g, "")
            .trim();
          break;
        }
      }
    }
    if (!associatedPrompt) {
      const idx = messages.indexOf(msg);
      if (idx > 0) {
        for (let k = idx - 1; k >= 0; k--) {
          if (messages[k]?.role === "user") {
            associatedPrompt = formatMessageForDisplay(cleanImageLinksFromText(messages[k].content))
              .replace(/\[Modo:.*?\]/g, "")
              .replace(/\[Estilo:.*?\]/g, "")
              .trim();
            break;
          }
        }
      }
    }

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

    const renderImageCard = (imgUrl: string, key?: any) => (
      <div 
        key={key} 
        draggable={false}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        className="relative w-[280px] sm:w-[320px] aspect-square rounded-2xl overflow-hidden border border-white/15 bg-card/60 shadow-2xl group select-none protected-image my-1"
      >
        <ResilientImage 
          src={imgUrl} 
          alt="Imagem bíblica gerada" 
          className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]" 
          onClick={() => openLightbox(imgUrl, associatedPrompt, msgIndex)} 
        />
        {/* Botões de ação (Baixar, Compartilhar e Regenerar) dentro da imagem */}
        <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-center justify-end gap-2.5 pointer-events-none z-10">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(imgUrl);
            }}
            title="Baixar imagem"
            aria-label="Baixar imagem"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:text-white hover:scale-110 active:scale-95 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] focus:outline-none"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              shareBibleImage(imgUrl);
            }}
            title="Compartilhar imagem"
            aria-label="Compartilhar imagem"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:text-white hover:scale-110 active:scale-95 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] focus:outline-none"
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRegenerateImage(associatedPrompt);
            }}
            title="Regenerar imagem"
            aria-label="Regenerar imagem"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:text-white hover:scale-110 active:scale-95 transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] focus:outline-none"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    );

    const topImage = msg.image || extractImageUrl(msg.content);

    return (
      <div className="space-y-1">
        {topImage && renderImageCard(topImage)}
        {lines.map((line, i) => {
          if (line.startsWith("enc:v1:") || line.includes("enc:v1:")) {
            return null;
          }
          const lineImgUrl = extractImageUrl(line);
          if (lineImgUrl) {
            // If this image is already shown as topImage or the line is just the image URL, skip duplicate text rendering
            if (topImage && (lineImgUrl === topImage || line.trim() === lineImgUrl || line.trim().startsWith("!["))) {
              return null;
            }
            return renderImageCard(lineImgUrl, i);
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

  // Histórico de conversas (agora exibido no Menu Lateral)
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

      const userKey = getConversationsKey(user?.sub);
      safeSaveToLocalStorage(userKey, updated);
      saveHistoryToServer(user?.sub, updated);

      if (user?.sub) {
        Promise.all(
          updated.map(async (c) => ({
            ...c,
            messages: await encryptConversationMessages(c.messages, user?.sub)
          }))
        ).then(encryptedConversations => {
          const jsonStr = JSON.stringify(encryptedConversations);
          syncKeyToSupabase("AI_CONVERSATIONS", jsonStr);
        }).catch(err => {
          console.debug("[ChatHistory] Erro ao sincronizar renomeação com Supabase:", err);
        });
      }
    };

    const handleClearAllHistory = () => {
      setConversations([]);
      const userKey = getConversationsKey(user?.sub);
      localStorage.removeItem(userKey);
      clearAllHistoryOnServer(user?.sub);
      syncKeyToSupabase("AI_CONVERSATIONS", "[]");
      setShowClearAllModal(false);
      startNewChat();
      toast({ title: "Histórico Limpo", description: "Todas as conversas foram apagadas com sucesso." });
    };


  if (!isOnline) {
    return (
      <div className="flex fixed inset-0 flex-col bg-background overflow-hidden">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center container mx-auto max-w-md">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-lg shadow-amber-500/5 border border-amber-500/20">
            <WifiOff className="h-10 w-10 animate-pulse" />
          </div>
          
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">{isEn ? "No Connection" : "Sem Conexão"}</h2>
          
          <p className="text-sm text-muted-foreground bg-secondary/40 border border-border/50 rounded-2xl p-5 mb-8 leading-relaxed font-medium">
            {isEn 
              ? "You need internet to use AI. Please check your Wi-Fi or mobile data connection and try again."
              : "Você precisa de internet para usar IA. Por favor, verifique sua conexão Wi-Fi ou dados móveis e tente novamente."}
          </p>

          <button 
            onClick={() => setIsOnline(navigator.onLine)} 
            className="flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-sm font-bold transition-all shadow-md active:scale-95 liquid-btn"
          >
            {isEn ? "Try again" : "Tentar novamente"}
          </button>
        </div>
      </div>
    );
  }

  const renderSidebarContent = () => (
    <>
      {/* Header do Menu Lateral com Logo */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/70 shrink-0 bg-background/50">
        <div className="flex items-center gap-2.5 p-1 rounded-xl select-none text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-xs shrink-0">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          
          <div className="flex flex-col">
            <span className="font-serif text-sm font-bold text-foreground leading-tight">
              {isEn ? "Biblical AI" : "IA Bíblia"}
            </span>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {conversations.length} {isEn ? (conversations.length === 1 ? "saved chat" : "saved chats") : (conversations.length === 1 ? "conversa salva" : "conversas salvas")}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          title={isEn ? "Close sidebar" : "Fechar menu lateral"}
          aria-label={isEn ? "Close sidebar" : "Fechar menu lateral"}
        >
          <PanelLeftClose className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Botão de Nova Conversa */}
      <div className="p-3 pb-2 shrink-0">
        <button
          onClick={() => {
            startNewChat();
            setIsSidebarOpen(false);
            toast({
              title: isEn ? "New Chat" : "Nova Conversa",
              description: isEn ? "Chat restarted. Ask your question to Biblical AI." : "Conversa reiniciada. Faça sua pergunta para a IA Bíblica.",
            });
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs shadow-xs transition-all active:scale-98 liquid-btn cursor-pointer"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>{isEn ? "New Chat" : "Nova Conversa"}</span>
        </button>
      </div>

      {/* Resumo de Cota Diária */}
      <div className="px-3 pb-2 shrink-0">
        <div className="glass-card rounded-xl p-2 bg-secondary/40 border border-border/60">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> {isEn ? "Remaining Quotas" : "Cotas Restantes"}
            </span>
            <span className="text-[9px] text-muted-foreground">12h</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-background/70 rounded-lg p-1 border border-border/40">
              <p className="text-xs font-bold text-foreground leading-none">{Math.max(0, chatRemaining)}</p>
              <p className="text-[8px] text-muted-foreground mt-0.5 truncate">{isEn ? "Complex" : "Complexa"}</p>
            </div>
            <div className="bg-background/70 rounded-lg p-1 border border-border/40">
              <p className="text-xs font-bold text-foreground leading-none">{Math.max(0, geminiRemaining)}</p>
              <p className="text-[8px] text-muted-foreground mt-0.5 truncate">{isEn ? "Simple" : "Simples"}</p>
            </div>
            <div className="bg-background/70 rounded-lg p-1 border border-border/40">
              <p className="text-xs font-bold text-foreground leading-none">{Math.max(0, imageRemaining)}</p>
              <p className="text-[8px] text-muted-foreground mt-0.5 truncate">{isEn ? "Images" : "Imagens"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campo de Busca e Filtros com efeito Liquid Glass */}
      <div className="px-3 pb-2 shrink-0 space-y-2">
        <div className="relative flex items-center group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/80 group-focus-within:text-accent group-focus-within:scale-105 transition-all duration-200 pointer-events-none z-10 shrink-0" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder={isEn ? "Search history..." : "Buscar histórico..."}
            className="w-full liquid-glass-input rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all"
          />
          {historySearchQuery && (
            <button
              onClick={() => setHistorySearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors cursor-pointer z-10"
              title={isEn ? "Clear search" : "Limpar busca"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {[
            { key: "all", label: isEn ? "All" : "Todas" },
            { key: "simple", label: isEn ? "Simple" : "Simples" },
            { key: "complex", label: isEn ? "Complex" : "Complexa" },
            { key: "image", label: isEn ? "Images" : "Imagens" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setHistoryFilterCategory(cat.key as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] transition-all whitespace-nowrap cursor-pointer ${
                historyFilterCategory === cat.key
                  ? "liquid-glass-pill-active font-semibold shadow-xs"
                  : "liquid-glass-pill text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista do Histórico de Conversas com efeito Liquid Glass */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-2 text-center text-muted-foreground">
            <div className="h-10 w-10 rounded-xl liquid-glass-card flex items-center justify-center mb-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">
              {historySearchQuery ? "Nenhuma conversa encontrada" : "Sem conversas salvas"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px]">
              {historySearchQuery
                ? `Nenhum resultado para "${historySearchQuery}".`
                : "Suas conversas anteriores aparecem aqui de forma privada."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredConversations.map((conv, idx) => {
              const categoryInfo = getConversationCategoryInfo(conv);
              const CategoryIcon = categoryInfo.icon;
              const isEditing = editingTitleId === conv.id;
              const isActive = currentChatIdRef.current === conv.id;

              return (
                <motion.div
                  key={conv.id ? `${conv.id}-${idx}` : `conv-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => !isEditing && loadConversation(conv)}
                  className={`group relative flex flex-col rounded-xl p-3 transition-all cursor-pointer overflow-hidden ${
                    isActive 
                      ? "liquid-glass-card liquid-glass-card-active" 
                      : "liquid-glass-card"
                  }`}
                >
                  {/* Reflexo de luz na borda superior (Liquid Glass Specular Highlight) */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-md ${categoryInfo.badgeBg}`}>
                      <CategoryIcon className="h-2.5 w-2.5" />
                      {categoryInfo.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/70" />
                      {formatRelativeDate(conv.timestamp)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitleInput}
                        onChange={(e) => setEditingTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle(conv.id);
                          if (e.key === "Escape") setEditingTitleId(null);
                        }}
                        className="flex-1 liquid-glass-input rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTitle(conv.id)}
                        className="p-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer transition-colors"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingTitleId(null)}
                        className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="text-left flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                          {conv.title || "Conversa Bíblica"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground/90 line-clamp-1 mt-0.5">
                          {getConversationPreview(conv)}
                        </p>
                      </div>

                      <div 
                        className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingTitleId(conv.id);
                            setEditingTitleInput(conv.title || "");
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                          title="Renomear título"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteConversation(conv.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
                          title="Excluir conversa"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Rodapé do Menu Lateral com Limpar Todo Histórico */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-border/70 shrink-0 bg-background/40">
          <button
            onClick={() => setShowClearAllModal(true)}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Limpar todo o histórico</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div 
      className="flex flex-col bg-background fixed inset-0 w-full overflow-hidden"
      style={
        isKeyboardOpen && viewportHeight
          ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
          : undefined
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header />

      {/* Área Principal (Barra Lateral + Chat) */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        {/* Menu Lateral no Desktop (Docked lado a lado empurrando o chat com transição rápida e sem bugs) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 h-full border-r border-border/60 liquid-glass-bar overflow-hidden z-20 transition-[width,opacity] duration-150 ease-out ${
            isSidebarOpen ? "w-[300px] lg:w-[320px] opacity-100" : "w-0 opacity-0 pointer-events-none border-r-0"
          }`}
        >
          <div className="w-[300px] lg:w-[320px] h-full flex flex-col shrink-0">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Menu Lateral no Mobile (Drawer Overlay rápido) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop com desfoque (apenas em telas menores / mobile) */}
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
                aria-hidden="true"
              />

              <motion.aside
                key="sidebar-mobile"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 flex flex-col w-[85vw] max-w-[320px] liquid-glass-menu border-r border-border/70 shadow-2xl md:hidden safe-area-top safe-area-bottom overflow-hidden h-full"
              >
                <div className="w-full h-full flex flex-col">
                  {renderSidebarContent()}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

      {/* Modal de Confirmação para Apagar Todo o Histórico */}
      <AnimatePresence>
        {showClearAllModal && (
          <motion.div
            key="clear-all-modal"
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
                  className="flex-1 py-2 rounded-xl bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearAllHistory}
                  className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold transition-all hover:bg-destructive/90 shadow-xs cursor-pointer"
                >
                  Sim, Apagar Tudo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden container mx-auto max-w-4xl px-3 transition-all duration-150 ease-out">
        <div className="flex shrink-0 items-center justify-between gap-1.5 sm:gap-2 py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botão de Menu Lateral com o Ícone da IA Bíblica que exibe o ícone de menu ao passar o mouse */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="group relative flex items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary p-1.5 sm:p-2 text-primary-foreground shadow-xs hover:shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 liquid-btn cursor-pointer shrink-0"
              title={isSidebarOpen ? (isEn ? "Close sidebar" : "Fechar menu lateral") : (isEn ? "Sidebar and history" : "Menu lateral e histórico")}
              aria-label={isSidebarOpen ? (isEn ? "Close sidebar" : "Fechar menu lateral") : (isEn ? "Open sidebar and history" : "Abrir menu lateral e histórico")}
            >
              <div className="relative flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5">
                {/* Ícone da IA Bíblica (visível por padrão, desaparece no hover) */}
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-[-8deg] pointer-events-none" />
                {/* Ícone de Menu Lateral (surge ao passar o mouse) */}
                <PanelLeft className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground transition-all duration-200 opacity-0 scale-75 rotate-[8deg] group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 pointer-events-none" />
              </div>
            </button>
            
            {/* Botão de Nova Conversa rápido */}
            <button
              onClick={() => {
                startNewChat();
                toast({
                  title: isEn ? "New Chat" : "Nova Conversa",
                  description: isEn ? "Chat restarted. Ask your question to Biblical AI." : "Conversa reiniciada. Faça sua pergunta para a IA Bíblica.",
                });
              }}
              className="flex items-center justify-center rounded-lg bg-secondary p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors liquid-btn cursor-pointer shrink-0"
              title={isEn ? "New Chat" : "Nova Conversa"}
              aria-label={isEn ? "New Chat" : "Nova conversa"}
            >
              <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="relative flex shrink-0 items-center rounded-xl border border-border bg-secondary/50 p-0.5 sm:p-1">
            <button
              type="button"
              onClick={() => {
                setAiEngine("simples");
                setShowModes(false);
                startNewChat(null);
                toast({
                  title: isEn ? "Simple AI activated" : "IA Simples ativada",
                  description: isEn ? "New chat started in Simple mode." : "Novo chat iniciado no modo Simples.",
                });
              }}
              className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] font-semibold transition-colors duration-200 cursor-pointer ${
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
              <span className="relative z-10 text-white">{isEn ? "Simple" : "Simples"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiEngine("complexo");
                startNewChat(null);
                toast({
                  title: isEn ? "Complex AI activated" : "IA Complexa ativada",
                  description: isEn ? "New chat started in Complex mode." : "Novo chat iniciado no modo Complexo.",
                });
              }}
              className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] font-semibold transition-colors duration-200 cursor-pointer ${
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
              <span className="relative z-10 text-white">{isEn ? "Complex" : "Complexo"}</span>
            </button>
          </div>
        </div>



        {limitReached && (
          <motion.div 
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="shrink-0 mb-3 flex items-center justify-between gap-2.5 sm:gap-3.5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 sm:p-3.5 backdrop-blur-md shadow-sm w-full"
          >
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 mt-0.5 sm:mt-0"
              >
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <p className="text-xs sm:text-sm font-bold text-rose-200">
                    {activeMode === "image" ? (isEn ? "Image Limit Reached" : "Limite de Imagens Atingido") : (isEn ? "Daily Limit Reached" : "Limite Diário Atingido")}
                  </p>
                  <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-rose-300 border border-rose-500/30">
                    {isEn ? "Quota Exhausted" : "Cota Esgotada"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-300/90 mt-0.5 leading-snug">
                  {activeMode === "image"
                    ? (isEn ? "Your daily limit of 3 images in Chat has been reached. Refills in up to 12 hours." : "Sua cota diária de 3 imagens no Chat acabou. Recarga em até 12 horas.")
                    : (isEn ? "The quota for this mode has been reached. Refills in up to 12 hours." : "A cota para este modo foi atingida. Recarga em até 12 horas.")}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300 border border-rose-500/20 font-medium">
              <span>{isEn ? "Refill 00:00" : "Recarga 00:00"}</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesContainerRef} className="flex-1 min-h-0 space-y-2.5 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.length === 0 && (
            <div className="py-2 sm:py-3 md:py-4 flex flex-col items-center text-center">
              <h2 className="text-base font-bold text-foreground mb-1">
                {activeMode === "image"
                  ? isEn ? "Biblical Image Generator" : "Gerador de Imagens Bíblicas"
                  : activeMode === "video"
                  ? isEn ? "Video Scripts" : "Roteiros para Vídeo"
                  : activeMode === "music"
                  ? isEn ? "Music Composition" : "Composição de Músicas"
                  : activeMode === "learning"
                  ? isEn ? "Biblical Learning" : "Aprendizado Bíblico"
                  : aiEngine === "simples"
                  ? isEn ? "Simple AI" : "IA Simples"
                  : isEn ? "Complex AI" : "IA Complexa"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 max-w-2xl text-center sm:whitespace-nowrap leading-relaxed px-2">
                {activeMode === "image"
                  ? isEn ? "Generate realistic biblical images and scenes with artificial intelligence." : "Gere imagens e cenas bíblicas realistas com inteligência artificial."
                  : activeMode === "video"
                  ? isEn ? "Generate complete video scripts for YouTube, Reels or TikTok." : "Gere roteiros completos para vídeos do YouTube, Reels ou TikTok."
                  : activeMode === "music"
                  ? isEn ? "Create lyrics and arrangements for worship and hymns." : "Crie letras e arranjos musicais para louvores e hinos."
                  : activeMode === "learning"
                  ? isEn ? "Deep biblical studies and theological insights with AI." : "Estudos e explicações bíblicas aprofundadas com a IA."
                  : aiEngine === "simples"
                  ? isEn ? "Direct questions about the Bible with fast and summarized answers." : "Perguntas diretas sobre a Bíblia, com resposta rápida e resumida."
                  : isEn ? "Complete answers and deep theological studies." : "Respostas completas e estudos teológicos aprofundados."}
              </p>

              <div className="mb-2.5 sm:mb-3.5 md:mb-4">
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
                      ? `${Math.max(0, imageRemaining)} ${isEn ? "msgs remaining" : "msgs restantes"}`
                      : activeMode
                      ? `${Math.max(0, chatRemaining)} ${isEn ? "msgs remaining" : "msgs restantes"}`
                      : aiEngine === "simples"
                      ? `${Math.max(0, geminiRemaining)} ${isEn ? "msgs remaining" : "msgs restantes"}`
                      : `${Math.max(0, chatRemaining)} ${isEn ? "msgs remaining" : "msgs restantes"}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                {activeSuggestions.map((s) => (
                  <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => !limitReached && send(s)}
                    disabled={limitReached}
                    className="glass-card rounded-xl p-2 sm:p-3 text-left text-xs text-card-foreground transition-colors hover:!border-accent liquid-btn disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between min-h-[58px] sm:min-h-[68px]"
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
                    <span className="line-clamp-2 text-[11px] sm:text-xs leading-snug">{s}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const hasImg = Boolean(m.image || extractImageUrl(m.content));
            const isImageOnly = m.role === "assistant" && hasImg && (!m.content || m.content.trim() === (m.image || "") || m.content.trim().startsWith("![") || !m.content.replace(/!\[.*?\]\(.*?\)/g, '').trim());

            return (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary">
                    {aiEngine === "simples" ? <Zap className="h-3.5 w-3.5 text-primary-foreground" /> : <Bot className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                )}
                <div className={`max-w-[88%] sm:max-w-[85%] break-words min-w-0 ${
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 sm:px-4 py-2 sm:py-2.5" 
                    : isImageOnly 
                      ? "p-0 bg-transparent border-0 shadow-none w-fit" 
                      : "glass-card rounded-2xl rounded-bl-md px-3.5 sm:px-4 py-2 sm:py-2.5"
                }`}>
                {m.role === "user" && getFilesForMessage(m).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5 mt-0.5">
                    {getFilesForMessage(m).map((file, idx) => {
                      const isImg = file.type ? file.type.startsWith("image/") : file.name.toLowerCase().match(/\.(jpe?g|png|gif|webp|svg)$/);
                      return (
                        <div key={idx} className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/20 border border-white/20 rounded-lg px-2 py-0.5 max-w-full w-fit shadow-xs transition-colors">
                          {isImg ? (
                            <Image className="h-3.5 w-3.5 shrink-0 text-white/90" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0 text-white/90" />
                          )}
                          <span className="text-[11px] font-medium text-white truncate max-w-[140px] leading-tight">{file.name}</span>
                          {file.size ? (
                            <span className="text-[9.5px] text-white/75 shrink-0 leading-tight">
                              · {(file.size / 1024).toFixed(0)} KB
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
                {m.role === "assistant" ? (
                  <div className="space-y-1">
                    {renderAssistantContent(m, i)}
                    {activeMode !== "image" && !m.image && !extractImageUrl(m.content) && m.content && (() => {
                      const currentFb = m.feedback || messageFeedback[i];
                      return (
                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1 sm:gap-1.5 flex-wrap text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(i)}
                            title={currentFb === "like" ? "Gostei da resposta (salvo no histórico)" : "Gostei da resposta (Like)"}
                            aria-label="Gostei da resposta"
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                              currentFb === "like"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium shadow-xs"
                                : "hover:bg-secondary hover:text-foreground text-muted-foreground border border-transparent"
                            }`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="text-[11px] hidden sm:inline">Gostei</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleDislike(i)}
                            title={currentFb === "dislike" ? "Não gostei da resposta (salvo no histórico)" : "Não gostei da resposta (Deslike)"}
                            aria-label="Não gostei da resposta"
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                              currentFb === "dislike"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium shadow-xs"
                                : "hover:bg-secondary hover:text-foreground text-muted-foreground border border-transparent"
                            }`}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            <span className="text-[11px] hidden sm:inline">Não gostei</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRepeatResponse(i)}
                            disabled={isLoading || limitReached}
                            title="Repetir resposta (reenvia o prompt e desconta na cota)"
                            aria-label="Repetir resposta"
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-secondary hover:text-foreground text-muted-foreground border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Repetir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyResponse(m.content, i)}
                            title="Copiar resposta"
                            aria-label="Copiar resposta"
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-secondary hover:text-foreground text-muted-foreground border border-transparent transition-colors"
                          >
                            {copiedAssistantIdx === i ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-[11px] text-emerald-400 font-medium">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-sm leading-relaxed">{formatMessageForDisplay(m.content)}</span>
                    {activeMode !== "image" && m.content && (
                      <div className="mt-2 pt-1.5 border-t border-primary-foreground/20 flex items-center justify-end gap-1.5 flex-wrap text-primary-foreground/80">
                        <button
                          type="button"
                          onClick={() => handleCopyUserQuestion(m.content, i)}
                          title="Copiar pergunta"
                          aria-label="Copiar pergunta"
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-black/20 hover:text-primary-foreground transition-all duration-150"
                        >
                          {copiedUserIdx === i ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-300" />
                              <span className="font-medium text-emerald-300">Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditUserQuestion(m.content)}
                          title="Editar pergunta e reenviar"
                          aria-label="Editar pergunta e reenviar"
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-black/20 hover:text-primary-foreground transition-all duration-150"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start my-1">
              {activeMode === "image" || /\[Modo:\s*(?:Gerar\s*)?Imagem\]/i.test(messages[messages.length - 1]?.content || "") ? (
                <div className="flex justify-start items-start gap-2 shrink-0">
                  <div className="mr-1.5 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-xs">
                    <Image className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="shrink-0">
                    <ImageGeneratingBubble />
                  </div>
                </div>
              ) : (
                <ThinkingIndicator engine={aiEngine} mode={activeMode} />
              )}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={`shrink-0 bg-background pt-1.5 sm:pt-2 transition-all duration-300 ease-out ${isKeyboardOpen ? 'mb-1 md:mb-0 pb-1.5 md:pb-2.5' : 'mb-[54px] md:mb-0 pb-1.5 md:pb-2.5'}`}>
          <AnimatePresence>
            {activeModeInfo && (
              <motion.div
                key={activeModeInfo.key}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="mb-2 flex items-center justify-between gap-2.5 rounded-2xl border border-accent/40 bg-card/95 p-2.5 sm:px-4 sm:py-2.5 shadow-md backdrop-blur-xl w-full"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-accent min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent shrink-0">
                    {activeModeInfo.icon}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs sm:text-sm truncate font-medium">
                      Modo Ativo: <strong className="font-bold text-foreground">{activeModeInfo.label}</strong>
                    </span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground font-normal truncate">
                      Ao fechar este modo, uma nova conversa é iniciada.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const modeLabel = activeModeInfo.label;
                    setSelectedImageStyle(null);
                    startNewChat(null);
                    toast({
                      title: isEn ? "Mode closed" : "Modo encerrado",
                      description: isEn 
                        ? `You exited ${modeLabel} mode. New chat started!`
                        : `Você saiu do modo ${modeLabel}. Novo chat iniciado!`,
                    });
                  }}
                  className="flex h-8 px-2.5 sm:px-3 items-center gap-1.5 rounded-xl bg-secondary hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold text-muted-foreground transition-all shrink-0 cursor-pointer"
                  title={isEn ? "Exit mode" : "Sair do modo"}
                >
                  <span className="hidden sm:inline">{isEn ? "Exit Mode" : "Sair do Modo"}</span>
                  <span className="sm:hidden">{isEn ? "Exit" : "Sair"}</span>
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showModes && (
              <motion.div key="show-modes-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 flex flex-wrap gap-1.5">
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
              {/* Localized Drag e Drop Overlay */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div 
                    key="dragging-overlay"
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
                    key="previews-area"
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
                                const fileToRemove = attachedFiles[index];
                                if (fileToRemove) {
                                  decrementDailyFileAttached(1);
                                }
                                setAttachedFiles(files => files.filter((_, idx) => idx !== index));
                              }}
                              className="absolute top-2 right-2 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all"
                              title="Remover anexo"
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
                    className="p-1.5 px-2.5 sm:p-2 sm:px-3 border-b border-border/60 mb-1 flex items-center justify-between bg-accent/15 rounded-xl border border-accent/30 backdrop-blur-md w-full"
                  >
                    <div 
                      role="button"
                      onClick={() => setShowStylePicker(!showStylePicker)}
                      className="flex items-center gap-1.5 sm:gap-2 text-xs text-accent font-semibold min-w-0 flex-1 cursor-pointer select-none"
                    >
                      <Palette className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="truncate">Estilo: <strong className="font-bold text-foreground">{selectedImageStyle.label}</strong></span>
                      <span className="text-[10px] text-accent/80 underline font-normal shrink-0 ml-1 md:hidden">trocar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImageStyle(null)}
                      className="text-muted-foreground hover:text-foreground text-xs p-1 hover:bg-secondary/80 rounded-lg transition-colors shrink-0 ml-1"
                      title="Remover estilo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  {aiEngine !== "simples" && (
                    <button type="button" onClick={() => setShowModes(!showModes)}
                      title="Alternar modos e ferramentas"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-xs"
                    >
                      <Plus className={`h-4 w-4 transition-transform duration-200 ${showModes ? "rotate-45 text-foreground" : ""}`} />
                    </button>
                  )}
                  <div className="relative shrink-0">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (dailyFilesLimitReached || dailyFilesRemaining <= 0) {
                          toast({
                            title: "Limite de anexos atingido",
                            description: `Você atingiu o limite de ${DAILY_ATTACHED_FILES_LIMIT} arquivos anexados. Recarga em até 12h${dailyFilesNextRecharge ? ` (próxima liberação em ${dailyFilesNextRecharge})` : ''}.`,
                            variant: "destructive"
                          });
                          return;
                        }
                        if (limitReached) {
                          toast({
                            title: "Limite de mensagens atingido",
                            description: "Sua cota diária de mensagens acabou. Recarga em até 12h.",
                            variant: "destructive"
                          });
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      title={
                        dailyFilesLimitReached
                          ? `Limite de anexos atingido. Recarga em ${dailyFilesNextRecharge || 'até 12h'}`
                          : limitReached
                          ? "Limite de mensagens atingido"
                          : "Anexar arquivos"
                      }
                      aria-label="Anexar arquivos"
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-xs ${
                        dailyFilesLimitReached || limitReached ? "opacity-50 cursor-pointer" : ""
                      }`}
                    >
                      <Upload size={16} className="stroke-[2.2]" />
                    </button>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx" 
                      multiple 
                      onChange={handleFileAttach} 
                    />
                  </div>

                  {/* Botão de Estilo de Imagem (Modo Gerar Imagens) */}
                  {activeMode === "image" && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowStylePicker(!showStylePicker)}
                        className={`flex h-8 w-8 sm:h-9 sm:w-auto sm:px-2.5 items-center justify-center gap-1 rounded-full text-xs font-semibold transition-all liquid-btn border border-border/80 bg-secondary/80 text-muted-foreground hover:text-foreground shrink-0`}
                        title="Escolher estilo da imagem"
                      >
                        <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-accent" />
                        <span className="text-[11px] font-semibold max-w-[85px] truncate hidden md:inline">
                          {selectedImageStyle ? selectedImageStyle.label : "Estilo"}
                        </span>
                        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 hidden md:block ${showStylePicker ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {showStylePicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-64 max-w-[calc(100vw-32px)] rounded-2xl liquid-glass-menu p-1.5 shadow-2xl z-50 flex flex-col gap-1"
                          >
                            <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 flex items-center justify-between">
                              <span>Estilo da Imagem</span>
                              <Sparkles className="h-3 w-3 text-accent" />
                            </div>
                            {imageStyles.map((style) => {
                              const isSelected = selectedImageStyle?.id === style.id;
                              return (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedImageStyle(style);
                                    setShowStylePicker(false);
                                  }}
                                  className={`flex flex-col text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                                    isSelected
                                      ? "bg-accent/15 text-accent border border-accent/30 font-semibold"
                                      : "hover:bg-secondary/80 text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold">{style.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-normal">
                                    {style.description}
                                  </span>
                                </button>
                              );
                            })}
                          </motion.div>
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
                      scrollToBottom(true);
                    }, 120);
                  }}
                  placeholder={
                    !isOnline
                      ? isEn ? "No internet connection" : "Sem internet"
                      : limitReached
                      ? isEn ? "Daily limit reached" : "Limite atingido"
                      : activeMode === "image"
                      ? isEn ? "Describe the biblical image..." : "Descreva a imagem bíblica..."
                      : activeMode === "video"
                      ? isEn ? "Describe your video script..." : "Descreva seu roteiro de vídeo..."
                      : activeMode === "learning"
                      ? isEn ? "Describe what you want to learn..." : "Descreva o que quer aprender..."
                      : activeMode === "music"
                      ? isEn ? "Describe the music..." : "Descreva a música..."
                      : aiEngine === "simples"
                      ? isEn ? "Simple biblical question..." : "Pergunta simples bíblica..."
                      : isEn ? "Biblical question..." : "Pergunta bíblica..."
                  }
                  disabled={isLoading || limitReached || !isOnline}
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed truncate"
                />
                {input.length > 1000 && (
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 px-1">
                    {input.length}/2000
                  </span>
                )}
                {/* Botão de Ditar por Voz (IA Bíblica e Modo Gerar Imagens) */}
                <VoiceInputButton
                  onTranscript={(transcript) => {
                    setInput((prev) => {
                      const newText = prev ? `${prev.trim()} ${transcript}` : transcript;
                      return newText.slice(0, 2000);
                    });
                  }}
                  disabled={isLoading || limitReached || !isOnline}
                  size="icon"
                  title={activeMode === "image" ? (isEn ? "Dictate biblical image description" : "Ditar descrição da imagem bíblica") : (isEn ? "Dictate question for Biblical AI" : "Ditar pergunta para a IA Bíblica")}
                  className="bg-secondary/70 hover:bg-accent/20 hover:text-accent"
                />
                {/* Botão do Aprimorador de Prompts (apenas para o modo gerar imagens) */}
                {activeMode === "image" && input.trim() && !isLoading && (
                  <button
                    type="button"
                    onClick={handleRefineCurrentPrompt}
                    disabled={isRefiningPrompt || limitReached || !isOnline}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 hover:bg-accent/20 text-accent hover:text-accent transition-all liquid-btn disabled:opacity-50"
                    title={isEn ? "Prompt Enhancer" : "Aprimorador de Prompts"}
                    aria-label={isEn ? "Prompt Enhancer" : "Aprimorador de Prompts"}
                  >
                    {isRefiningPrompt ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-accent" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                    )}
                  </button>
                )}
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors liquid-btn"
                    title={isEn ? "Stop response" : "Parar resposta"}
                  >
                    <Square size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || limitReached || !isOnline}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors liquid-btn disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title={isEn ? "Send" : "Enviar"}
                  >
                    <ArrowUp size={17} className="stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className="mt-1 sm:mt-1.5 text-center text-[10px] text-muted-foreground/60 font-medium italic select-none">
            {isEn ? "Biblical AI is an AI and may make mistakes" : "A IA biblica é uma IA ela comete erros"}
          </p>
        </div>
      </div>
      </div>

      {/* Lightbox Modal de Imagem em Tela Cheia */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-3 sm:p-4 backdrop-blur-md select-none safe-area-top safe-area-bottom"
            onClick={() => setLightboxImage(null)}
          >
            <div className="w-full max-w-[360px] sm:max-w-md flex flex-col items-center justify-center gap-2 sm:gap-2.5 my-auto max-h-full">
              {/* Top Bar Header - Mesmo tamanho da barra inferior */}
              <motion.div
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                className="w-full h-11 sm:h-12 flex items-center justify-between bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full px-3.5 sm:px-4 shadow-xl shrink-0 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4 text-accent shrink-0" />
                  <span className="truncate">Visualizador de Imagem</span>
                </div>

                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all hover:scale-105 active:scale-95 shrink-0"
                  title="Fechar (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Container Central da Imagem */}
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full flex-1 min-h-0 flex items-center justify-center relative overflow-hidden rounded-2xl my-0.5 protected-image select-none"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
              >
                <img
                  ref={lightboxImgRef}
                  src={lightboxImage}
                  alt="Arte bíblica em alta definição"
                  crossOrigin="anonymous"
                  draggable={false}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  className="max-w-full max-h-[58vh] sm:max-h-[66vh] object-contain rounded-2xl shadow-2xl border border-white/10 block mx-auto touch-none select-none protected-image transition-transform duration-100 ease-out"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale * lightboxLetterboxScale})`,
                    cursor: zoomScale > 1 ? (isDraggingImage ? 'grabbing' : 'grab') : 'zoom-in',
                    imageRendering: 'auto',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitUserDrag: 'none' as any,
                  }}
                  referrerPolicy="no-referrer"
                  onLoad={(e) => {
                    const info = analyzeLetterbox(e.currentTarget);
                    if (info.hasLetterbox && info.scale > 1) {
                      setLightboxLetterboxScale(info.scale);
                    } else {
                      setLightboxLetterboxScale(1);
                    }
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onDoubleClick={handleDoubleClick}
                />

                {/* Overlay Flutuante de Pedir Mudança POR CIMA da visualização da imagem */}
                <AnimatePresence>
                  {isChangeInputOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 25, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 320 }}
                      className="absolute bottom-2 sm:bottom-3 z-50 w-full px-2 select-text pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-full bg-zinc-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3.5 shadow-2xl space-y-2.5 text-left ring-1 ring-black/60">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                            <Wand2 className="h-3.5 w-3.5 text-accent" />
                            <span>O que deseja mudar na imagem?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsChangeInputOpen(false)}
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            title="Fechar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Sugestões rápidas de melhoria */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {["Mais realista", "Pôr do sol", "Mais luz", "Mudar roupas", "Adicionar flores"].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setChangePromptText(prev => prev ? `${prev}, ${chip.toLowerCase()}` : chip);
                              }}
                              className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-[11px] text-white/90 hover:text-white border border-white/10 transition-colors font-medium active:scale-95"
                            >
                              +{chip}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 bg-black/60 border border-white/15 rounded-xl p-1.5 focus-within:border-accent transition-colors">
                          <input
                            type="text"
                            value={changePromptText}
                            onChange={(e) => setChangePromptText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && changePromptText.trim()) {
                                e.preventDefault();
                                handleApplyImageChange();
                              }
                            }}
                            placeholder="Ex: Mude a iluminação, adicione ovelhas..."
                            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/40 px-2 py-1 outline-none min-w-0"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleApplyImageChange}
                            disabled={!changePromptText.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition-all active:scale-95 shrink-0"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Aplicar</span>
                          </button>
                        </div>

                        <div className="flex justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleRequestImageChangeInChat(lightboxPrompt)}
                            className="text-[11px] text-accent/90 hover:text-accent hover:underline flex items-center gap-1 transition-colors font-medium"
                          >
                            Digitar no chat principal <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Painel de Ações Inferior - Mesmo tamanho da barra superior */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 15, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className="w-full h-11 sm:h-12 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-full px-2.5 sm:px-3 shadow-2xl shrink-0 z-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => lightboxImage && downloadImage(lightboxImage)}
                    title="Baixar imagem"
                    aria-label="Baixar imagem"
                    className="flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border border-white/10 hover:border-white/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => lightboxImage && shareBibleImage(lightboxImage)}
                    title="Compartilhar imagem"
                    aria-label="Compartilhar imagem"
                    className="flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border border-white/10 hover:border-white/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Share2 className="h-4 w-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateFromLightbox}
                    title="Regenerar imagem"
                    aria-label="Regenerar imagem"
                    className="flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border border-white/10 hover:border-white/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0 text-accent" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsChangeInputOpen(prev => !prev)}
                    title="Pedir mudança"
                    aria-label="Pedir mudança"
                    className={`flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 border shrink-0 ${
                      isChangeInputOpen
                        ? "bg-accent text-white border-accent shadow-md shadow-accent/30"
                        : "bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border-white/10 hover:border-white/25"
                    }`}
                  >
                    <Wand2 className="h-4 w-4 shrink-0 text-accent" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLightboxLike}
                    title="Gostei"
                    aria-label="Gostei"
                    className={`flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 border shrink-0 ${
                      currentLightboxFeedback === "like"
                        ? "bg-emerald-500/25 text-emerald-400 border-emerald-500/50"
                        : "bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border-white/10 hover:border-white/25"
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 shrink-0 ${currentLightboxFeedback === "like" ? "fill-current text-emerald-400" : ""}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleLightboxDislike}
                    title="Não gostei"
                    aria-label="Não gostei"
                    className={`flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 border shrink-0 ${
                      currentLightboxFeedback === "dislike"
                        ? "bg-rose-500/25 text-rose-400 border-rose-500/50"
                        : "bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white border-white/10 hover:border-white/25"
                    }`}
                  >
                    <ThumbsDown className={`h-4 w-4 shrink-0 ${currentLightboxFeedback === "dislike" ? "fill-current text-rose-400" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-white/10 ml-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (zoomScale > 1) {
                        setZoomScale(1);
                        setPanOffset({ x: 0, y: 0 });
                      } else {
                        setZoomScale(2);
                      }
                    }}
                    className={`flex h-8 px-2 items-center justify-center rounded-full text-xs font-mono font-bold transition-all active:scale-95 border border-white/10 ${
                      zoomScale > 1 ? "bg-accent text-white" : "bg-white/[0.08] hover:bg-white/[0.16] text-zinc-300"
                    }`}
                    title="Alternar Zoom Rápido 2x"
                  >
                    {zoomScale > 1 ? `${Math.round(zoomScale * 10) / 10}x` : "2x"}
                  </button>

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
                    className="flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10 shrink-0"
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
                    className="flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white disabled:opacity-30 transition-all active:scale-95 border border-white/10 shrink-0"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPage;
