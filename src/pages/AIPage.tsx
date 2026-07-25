import React, { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import {
  Send, Trash2, Sparkles, GraduationCap, X,
  Plus, Image, Video, Music, Download, LogIn,
  History, ChevronLeft, Zap, Bot, Paperclip, AlertCircle, MessageSquarePlus, Square, Share2,
  Loader2, ImageOff, FileText, ZoomIn, ZoomOut, WifiOff, Palette, ChevronDown, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError } from "@/contexts/AuthContext";

import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";

import { askBibleAI, AIAttachment } from "@/services/aiService";
import { checkAndIncrementUsage, getUserUsage, refundUsage } from "@/services/usageService";
import { saveAIHistory } from "@/services/userDataService";
import { generateBiblicalImage } from "@/services/imageGenerationService";
import { encryptConversationMessages, decryptConversationMessages } from "@/lib/security/cryptoService";
import { maskPiiInText } from "@/lib/security/privacyGuard";
import { validateImageContent } from "@/services/imageModerationService";

const formatMessageForDisplay = (text: string): string => {
  if (!text) return "";
  // Limpa as tags completas e também qualquer tag que possivelmente foi cortada no final
  return text.replace(/\[.*?\]/g, '').replace(/\[[^\]]*$/, '').trim();
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

const suggestions = [
  "O que significa João 3:16?",
  "Quem foi o rei Davi?",
  "O que a Bíblia diz sobre ansiedade?",
  "Explique as parábolas de Jesus",
  "Me ensine sobre os frutos do Espírito",
  "Qual a história de Moisés?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-chat`;
const GEMINI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;
const GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chat-image`;
const CONVERSATIONS_KEY = "ia-biblica-conversations";

// Daily limits - Sincronizado com usageService.ts
const LIMIT_COMPLEX = 5;
const LIMIT_SIMPLE = 7;
const LIMIT_IMAGE = 3;

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  timestamp: number;
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
    promptAddon: "CINEMATOGRÁFICO: Ultra-realistic epic movie still, crisp focal clarity, soft golden sunlight, anamorphic camera lens, shallow depth of field, sharp focus on eyes and face, pristine realistic skin tones, 8k resolution",
    description: "Luz dourada de cinema e lente anamórfica de alta clareza"
  },
  {
    id: "animation",
    label: "Animação 3D",
    badge: "Animação 3D",
    promptAddon: "ANIMAÇÃO 3D: 3D animated character art style, smooth Pixar/Disney rendering, soft subsurface scattering lighting, expressive features, vibrant color palette",
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
    promptAddon: "FOTORREALISMO: Award-winning ultra-realistic DSLR portrait photography, 8k UHD, shot on 85mm lens f/1.4, bright soft natural daylight, pristine clean skin, hyper-detailed clear eyes, sharp focus, authentic historical accuracy",
    description: "Fotografia fotorrealista com pele limpa e iluminação natural"
  },
  {
    id: "oil_painting",
    label: "Pintura a Óleo",
    badge: "Pintura a Óleo",
    promptAddon: "PINTURA A ÓLEO: Classical master oil painting on canvas, refined elegant brushstrokes, warm luminous lighting, deep museum quality fine art",
    description: "Técnica clássica com iluminação luminosa e textura em tela"
  },
  {
    id: "watercolor",
    label: "Aquarela",
    badge: "Aquarela",
    promptAddon: "AQUARELA: Delicate watercolor painting on textured paper, soft fluid color washes, graceful ink outlines, artistic pigment splashes",
    description: "Tons suaves e pigmentos fluidos"
  },
  {
    id: "anime",
    label: "Anime / Desenho",
    badge: "Anime",
    promptAddon: "ANIME: High quality Studio Ghibli inspired anime illustration, clean line art, luminous lighting, vibrant colors, detailed hand-drawn anime aesthetic",
    description: "Ilustração estilo Ghibli / Manga"
  },
  {
    id: "biblical_art",
    label: "Ilustração Bíblica Sacra",
    badge: "Ilustração Bíblica",
    promptAddon: "ILUSTRAÇÃO BÍBLICA SACRA: Sacred medieval illuminated manuscript art, golden leaf accents, stained glass window radiance, reverent biblical fresco style, royal gold hues",
    description: "Arte sacra medieval com folhas de ouro"
  },
];

const AIPage = () => {
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
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyleOption | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);
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
        await supabase.auth.signOut().catch(() => {});
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
      try {
        const saved = localStorage.getItem(CONVERSATIONS_KEY);
        if (saved) {
          const parsed: Conversation[] = JSON.parse(saved);
          const decryptedConversations = await Promise.all(
            parsed.map(async (c) => ({
              ...c,
              messages: await decryptConversationMessages(c.messages, user?.sub)
            }))
          );
          setConversations(decryptedConversations);
        }
      } catch (err) {
        console.warn("Erro ao carregar histórico criptografado:", err);
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
    } else if (activeMode) {
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
      <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-full bg-accent/10 p-4">
            <LogIn className="h-8 w-8 text-accent" />
          </div>
          <h2 className="font-serif text-xl font-bold text-foreground">Login Necessário</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Faça login na aba <strong>Conta</strong> para acessar a IA Bíblica.
          </p>
        </div>
      </div>
    );
  }

  // NOVO: Lógica criptografada de persistência para proibir vazamentos
  const saveConversation = (msgs: Msg[]) => {
    if (msgs.length < 2) return;
    const userSecret = user?.sub;
    
    setConversations(prev => {
      const title = formatMessageForDisplay(msgs[0]?.content).slice(0, 50) || "Conversa";
      let updated: Conversation[];

      if (currentChatIdRef.current) {
        // Se já existe um ID atual, atualiza a conversa existente
        updated = prev.map(c => 
          c.id === currentChatIdRef.current ? { ...c, messages: msgs, timestamp: Date.now() } : c
        );
      } else {
        // Se for a primeira mensagem, cria um ID novo
        const newId = Date.now().toString();
        currentChatIdRef.current = newId;
        const conv: Conversation = { id: newId, title, messages: msgs, timestamp: Date.now() };
        updated = [conv, ...prev].slice(0, 50);
      }

      // Salva criptografado em background no localStorage
      Promise.all(
        updated.map(async (c) => ({
          ...c,
          messages: await encryptConversationMessages(c.messages, userSecret)
        }))
      ).then(encryptedConversations => {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(encryptedConversations));
      }).catch(console.error);

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
    
    Promise.all(
      updated.map(async (c) => ({
        ...c,
        messages: await encryptConversationMessages(c.messages, user?.sub)
      }))
    ).then(encryptedConversations => {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(encryptedConversations));
    }).catch(console.error);

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

    // Filtro de segurança para imagem inapropriada/obscena
    const moderation = await validateImageContent(file);
    if (!moderation.isAppropriate) {
      toast({ 
        title: "Aviso", 
        description: "Imagem inapropriada tente novamente", 
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
    const limitType = mode === 'video' || mode === 'music' ? 'complex' : 'image';
    try {
      const hasQuota = await checkAndIncrementUsage(limitType as any, user.sub);
      if (!hasQuota) {
        toast({ title: "Limite atingido", description: "Sua cota diária para este recurso acabou. Recarga em até 12h.", variant: "destructive" });
        setLimitReached(true);
        setIsLoading(false);
        return;
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

🛑 Regras de Ouro (Proibido Violar)
- Fidelidade Bíblica Rigorosa: Todo o conteúdo deve ser fundamentado diretamente na Bíblia. Não invente diálogos que não estão no texto, não use livros apócrifos, lendas urbanas ou interpretações seculares que distorçam o sentido original.
- Citação de Fontes: Sempre que citar um acontecimento, milagre, parábola ou ensinamento, inclua a referência bíblica exata (Ex: Gênesis 1:1 ou João 3:16).
- Sem Desvios: Mantenha o foco absoluto no tema proposto. Evite filosofias humanas, debates políticos ou analogias mundanas longas que tirem a centralidade da Palavra de Deus.
- Tom de Voz: Reverente, inspirador, acolhedor e com autoridade bíblica, sem ser excessivamente acadêmico ou cansativo.
- Respostas Equilibradas: Escreva de maneira rica mas direta, evitando explicações redundantes ou textos exageradamente longos. O roteiro deve ser completo e de tamanho médio, sem enrolação.

🎬 Estrutura do Roteiro
O roteiro deve conter as seguintes divisões claras, indicando o que deve ser falado (locução) e o que deve aparecer na tela (instruções visuais/B-roll):
- O Gancho (Primeiros 15 segundos): Uma pergunta ou afirmação forte baseada no tema para capturar a atenção imediatamente.
- A Introdução: Apresentação do tema central e leitura do versículo-chave que guiará o vídeo.
- O Desenvolvimento (Dividido em 2 ou 3 pontos): Explicação do contexto histórico e cultural da época, destrinchando o significado espiritual do tema.
- A Aplicação Prática: Como o cristão de hoje pode aplicar essa verdade bíblica em sua vida diária (família, fé, trabalho).
- Conclusão e Chamada para Ação (CTA): Uma oração ou reflexão final rápida, seguida do pedido de inscrição/curtida e uma pergunta para os comentários (Ex: "Qual desses pontos falou mais ao seu coração?").

📝 Informações do Vídeo atual
- Tema do Vídeo: [O que o usuário disser]
- Plataforma: [A que o usuário disser]
- Tempo de Duração Estimado: [O que o usuário disser]

Gere o roteiro completo seguindo essas diretrizes. NUNCA use # para títulos, use **negrito**.`;

    const musicSystemPrompt = `Você é um compositor de músicas cristãs talentoso. Crie uma letra de música completa e inspiradora. Inclua:
- Título da música
- Estilo musical sugerido (ex: worship, gospel contemporâneo, etc)
- Versos (pelo menos 2)
- Refrão marcante
- Ponte
- Tom sugerido
A letra deve ser profunda, emocionante e bíblica. NUNCA use # para títulos, use **negrito**.`;

    const systemPrompt = mode === 'video' ? videoSystemPrompt : musicSystemPrompt;

    try {
      const cleanPrompt = text.replace(/\[Modo:.*?\]\s*/g, "");
      const responseText = await askBibleAI(cleanPrompt, "complex", controller.signal, attachments, systemPrompt, true);
      
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
        let imagePromptWithStyle = finalText;
        if (selectedImageStyle) {
          imagePromptWithStyle = `[Estilo: ${selectedImageStyle.label} - ${selectedImageStyle.promptAddon}] ${finalText}`;
        }
        responseText = await generateBiblicalImage(imagePromptWithStyle, controller.signal, 'square', false, 'chat', aiEngine === 'complexo');
      } else if (activeMode === 'learning') {
        const learningPrompt = `Você é um professor e teólogo cristão dedicado ao ensino bíblico de forma altamente didática, passo a passo e interativa.

Seu objetivo é ensinar o tema bíblico solicitado seguindo rigorosamente estas diretrizes:
1. Ensine o tema de forma PASSO A PASSO (dividido em etapas claras e estruturadas). Explique o contexto histórico, teológico e espiritual de cada etapa de maneira progressiva, clara e de fácil compreensão, sem colocar todas as informações de uma vez só de forma massiva.
2. Seja conciso e objetivo: evite explicações redundantes ou exageradamente longas. O texto deve ser de tamanho médio, rico em conteúdo, mas direto ao ponto e sem enrolação.
3. Ao final da explicação passo a passo, apresente um RESUMO claro e objetivo com as principais lições práticas e espirituais que o cristão pode extrair desse aprendizado para sua vida hoje.
4. Finalize OBRIGATORIAMENTE com uma PERGUNTA reflexiva ou desafiadora sobre o tema para incentivar a reflexão e resposta do usuário.

Mantenha fidelidade bíblica rigorosa, citando referências bíblicas exatas (ex: João 3:16, Efésios 2:8). NUNCA use # para títulos, use **negrito**.`;
        responseText = await askBibleAI(finalText, aiEngine === "complexo" ? "complex" : "simple", controller.signal, attachments, learningPrompt, true);
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
        if (errMsg.toLowerCase().includes("improprio") || errMsg.toLowerCase().includes("bloqueado") || errMsg.toLowerCase().includes("inapropriad")) {
          toast({ title: "Geração Cancelada", description: "Imagem não pode ser gerada pois contem conteudo improprio", variant: "destructive" });
        } else {
          toast({ title: "Erro na IA", description: "Tente novamente mais tarde.", variant: "destructive" });
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
    if (activeMode === mode.key) {
      setActiveMode(null);
      setShowModes(false);
    } else {
      setActiveMode(mode.key);
      if (mode.key !== "image") {
        setAiEngine("complexo");
      }
      setShowModes(false);
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
            <div className="mb-2 relative w-full aspect-square overflow-hidden rounded-xl bg-muted border border-border shadow-inner">
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
                 <div className="mb-2 mt-2 relative w-full aspect-square overflow-hidden rounded-xl bg-muted border border-border shadow-inner">
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
    return (
      <div className="flex h-[100dvh] flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden container mx-auto max-w-4xl px-3 pb-4">
          <div className="flex items-center gap-3 py-3 border-b border-border shrink-0">
            <button onClick={() => setShowHistory(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors liquid-btn">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-serif text-base font-bold text-foreground">Histórico</h2>
          </div>

          <div className="glass-card rounded-xl p-3 mt-3 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-2">Uso diário restante</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-lg font-bold text-foreground">{Math.max(0, chatRemaining)}</p>
                <p className="text-[9px] text-muted-foreground">Complexo</p>
              </div>
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-lg font-bold text-foreground">{Math.max(0, geminiRemaining)}</p>
                <p className="text-[9px] text-muted-foreground">Simples</p>
              </div>
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-lg font-bold text-foreground">{Math.max(0, imageRemaining)}</p>
                <p className="text-[9px] text-muted-foreground">Imagens</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto py-3 my-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {conversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma conversa salva</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div key={conv.id} className="glass-card flex items-center justify-between rounded-xl px-4 py-3">
                    <button onClick={() => loadConversation(conv)} className="flex-1 text-left liquid-btn min-w-0">
                      <h3 className="text-sm font-normal not-italic truncate w-full text-left text-white">
                        { formatMessageForDisplay(conv.title || conv.messages?.[0]?.content || "") || "Conversa Bíblica" }
                      </h3>
                      <p className="text-[10px] text-muted-foreground">{new Date(conv.timestamp).toLocaleDateString('pt-BR')} · {conv.messages.length} msgs</p>
                    </button>
                    <button onClick={() => deleteConversation(conv.id)} className="ml-3 p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
      className="flex h-[100dvh] flex-col bg-background relative"
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
              onClick={() => { setAiEngine("simples"); setShowModes(false); setActiveMode(null); startNewChat(); }}
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
              onClick={() => { setAiEngine("complexo"); startNewChat(); }}
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
                {suggestions.map((s) => (
                  <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => !limitReached && send(s)}
                    disabled={limitReached}
                    className="glass-card rounded-xl p-3 text-left text-xs text-card-foreground transition-colors hover:!border-accent liquid-btn disabled:opacity-50"
                  >
                    <Sparkles className="mb-1 h-3.5 w-3.5 text-accent" />
                    {s}
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
              <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
                <ThinkingSpinner engine={aiEngine} mode={activeMode} />
                <span className="text-xs text-muted-foreground">
                  {activeMode === "image" ? "Gerando imagem..." : activeMode === "video" ? "Escrevendo roteiro..." : "Pensando..."}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 bg-background pb-16 pt-2 md:pb-3">
          <AnimatePresence>
            {activeModeInfo && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-accent/40 bg-card/95 px-3.5 py-2 shadow-md backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-accent shrink-0">
                    {activeModeInfo.icon}
                  </div>
                  <span>Modo Ativo: <strong className="font-bold text-foreground">{activeModeInfo.label}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode(null);
                    setSelectedImageStyle(null);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                  title="Desativar modo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showModes && aiEngine === "complexo" && (
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
                  {aiEngine === "complexo" && (
                    <button type="button" onClick={() => setShowModes(!showModes)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors liquid-btn ${showModes ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={limitReached}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors liquid-btn disabled:opacity-50"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={handleFileAttach} />

                  {/* Botão de Estilo de Imagem (Modo Gerar Imagens) */}
                  {activeMode === "image" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStylePicker(!showStylePicker)}
                        className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all liquid-btn border ${
                          selectedImageStyle
                            ? "border-accent bg-accent/15 text-accent shadow-sm"
                            : "border-border/80 bg-secondary/80 text-muted-foreground hover:text-foreground hover:border-accent/50"
                        }`}
                        title="Selecione o estilo da imagem"
                      >
                        <Palette className="h-4 w-4 shrink-0 text-accent" />
                        <span className="text-[11px] font-semibold max-w-[95px] truncate">
                          {selectedImageStyle ? selectedImageStyle.label : "Estilo"}
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
                                {selectedImageStyle && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImageStyle(null)}
                                    className="text-[11px] text-accent hover:text-accent/80 font-semibold transition-colors"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1.5 custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedImageStyle(null);
                                    setShowStylePicker(false);
                                  }}
                                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                                    !selectedImageStyle ? "bg-accent/20 font-bold text-accent border border-accent/40" : "hover:bg-secondary/80 text-foreground"
                                  }`}
                                >
                                  <div>
                                    <p className="font-semibold text-xs">Nenhum (Padrão Livre)</p>
                                    <p className="text-[10px] text-muted-foreground">A IA decide o melhor estilo com base no pedido</p>
                                  </div>
                                  {!selectedImageStyle && <Check className="h-4 w-4 text-accent shrink-0" />}
                                </button>

                                {IMAGE_STYLES.map((st) => {
                                  const isSelected = selectedImageStyle?.id === st.id;
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
                  placeholder={!isOnline ? "Necessário internet para IA" : limitReached ? "Limite diário atingido" : activeModeInfo ? `Descreva (${activeModeInfo.label})...` : aiEngine === "simples" ? "Pergunta simples..." : "Pergunte qualquer coisa..."}
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors liquid-btn mr-0.5"
                    title="Parar resposta"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || limitReached || !isOnline}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors liquid-btn disabled:opacity-50 disabled:cursor-not-allowed mr-0.5"
                    title="Enviar"
                  >
                    <Send size={16} />
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
