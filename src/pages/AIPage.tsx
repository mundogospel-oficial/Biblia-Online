import React, { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import {
  Send, Trash2, Sparkles, GraduationCap, X,
  Plus, Image, Video, Music, Diamond, Download, LogIn,
  History, ChevronLeft, Zap, Bot, Paperclip, AlertCircle, MessageSquarePlus, Square, Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, forceSignOut, handleAuthError } from "@/contexts/AuthContext";

import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";

import { askBibleAI } from "@/services/aiService";
import { checkAndIncrementUsage, getUserUsage, refundUsage } from "@/services/usageService";
import { saveAIHistory } from "@/services/userDataService";
import { generateBiblicalImage } from "@/services/imageGenerationService";

const formatMessageForDisplay = (text: string): string => {
  if (!text) return "";
  // Limpa as tags completas e também qualquer tag que possivelmente foi cortada no final
  return text.replace(/\[.*?\]/g, '').replace(/\[[^\]]*$/, '').trim();
};

type Msg = { role: "user" | "assistant"; content: string; image?: string; fileName?: string };

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
const LIMIT_COMPLEX = 7;
const LIMIT_SIMPLE = 10;
const LIMIT_IMAGE = 5;

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  timestamp: number;
}

const DiamondSpinner = () => (
  <motion.div
    animate={{ rotateY: 360 }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    className="flex items-center justify-center"
  >
    <Diamond className="h-5 w-5 text-accent" />
  </motion.div>
);

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

const ResilientImage: React.FC<ResilientImageProps> = ({ src, alt, className = "absolute inset-0 w-full h-full object-cover" }) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (retryCount < 4) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const urlObj = new URL(src);
          urlObj.searchParams.set("retry", String(nextRetry));
          setCurrentSrc(urlObj.toString());
        } catch (err) {
          setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${nextRetry}`);
        }
      }, 2000);
    } else {
      setIsLoading(false);
      setHasError(true);
      setCurrentSrc("/icons/logo2.png");
    }
  };

  return (
    <div className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden rounded-xl">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md p-4 text-center">
          {/* Grid de fundo simulando blueprint de IA bíblica */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          {/* Efeito de scanline laser correndo */}
          <motion.div 
            animate={{ y: ["0%", "450%"] }} 
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/70 to-transparent shadow-[0_0_8px_rgba(212,175,55,0.8)] z-20 pointer-events-none"
          />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-3 relative"
          >
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          </motion.div>
          <span className="text-xs font-semibold text-accent tracking-wide uppercase">
            {retryCount > 0 ? `Refinando detalhes... (${retryCount}/4)` : "Renderizando Arte Sagrada... ✨"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed block">
            Nossos algoritmos estão pintando uma representação bíblica sob medida.
          </span>
        </div>
      )}
      
      {/* Efeito de varredura final quando a imagem carrega */}
      {!isLoading && !hasError && (
        <motion.div 
          initial={{ y: "-100%" }}
          animate={{ y: "150%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_rgba(212,175,55,1)] z-15 pointer-events-none"
        />
      )}

      <motion.img
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        className={hasError ? "absolute inset-0 m-auto w-10 h-10 opacity-20 grayscale" : className}
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
        initial={hasError ? { opacity: 0.2 } : { opacity: 0, scale: 1.05, filter: "blur(20px)" }}
        animate={hasError ? { opacity: 0.2 } : { 
          opacity: isLoading ? 0 : 1, 
          scale: isLoading ? 1.05 : 1, 
          filter: isLoading ? "blur(20px)" : "blur(0px)" 
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

type ModeKey = "image" | "video" | "learning" | "music";
type AIEngine = "complexo" | "simples";

const modes: { key: ModeKey; icon: React.ReactNode; label: string; prefix: string }[] = [
  { key: "image", icon: <Image className="h-4 w-4" />, label: "Gerar Imagens", prefix: "[Modo: Gerar Imagem] " },
  { key: "video", icon: <Video className="h-4 w-4" />, label: "Gerar Vídeos", prefix: "[Modo: Gerar Vídeo] " },
  { key: "learning", icon: <GraduationCap className="h-4 w-4" />, label: "Aprendizado", prefix: "[Modo: Aprendizado] " },
  { key: "music", icon: <Music className="h-4 w-4" />, label: "Criar Músicas", prefix: "[Modo: Criar Música] " },
];

const AIPage = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);
  const [aiEngine, setAiEngine] = useState<AIEngine>("simples");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
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
    try {
      const saved = localStorage.getItem(CONVERSATIONS_KEY);
      if (saved) setConversations(JSON.parse(saved));
    } catch {}
  }, []);

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
    if (aiEngine === "simples") {
      setLimitReached(usageStats.simple >= LIMIT_SIMPLE);
    } else {
      if (activeMode === "image" || activeMode === "video" || activeMode === "music") {
        setLimitReached(usageStats.image >= LIMIT_IMAGE);
      } else {
        setLimitReached(usageStats.complex >= LIMIT_COMPLEX);
      }
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full glass-card border border-border/80 rounded-2xl p-6 md:p-8 text-center space-y-6 shadow-xl relative overflow-hidden"
        >
          {/* Grid sutil de fundo geométrico */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Sparkles className="h-8 w-8 text-accent" />
            </motion.div>
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-background shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            />
          </div>

          <div className="space-y-2 relative z-10">
            <h2 className="text-xl font-serif font-black text-foreground tracking-tight">IA Bíblica em Manutenção</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              Nossos serviços de inteligência artificial estão passando por uma manutenção severa, e dentro de algumas semanas será liberado.
            </p>
          </div>

          <div className="bg-secondary/40 border border-border/60 p-4 rounded-xl space-y-2 relative z-10">
            <p className="text-[10px] font-bold tracking-wider text-accent uppercase flex items-center justify-center gap-1.5">
              <span>🔧</span> Status: Manutenção em andamento
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto leading-normal">
              A previsão de liberação dos serviços de IA é dentro de algumas semanas. Agradecemos sua atenção.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <button 
              onClick={() => window.location.href = "/"}
              className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Voltar para as Escrituras
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // NOVO: Lógica corrigida para não duplicar conversas no histórico
  const saveConversation = (msgs: Msg[]) => {
    if (msgs.length < 2) return;
    
    setConversations(prev => {
      const title = formatMessageForDisplay(msgs[0]?.content).slice(0, 50) || "Conversa";
      let updated;

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

      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // NOVO: Função para limpar o chat e iniciar um novo
  const startNewChat = () => {
    setMessages([]);
    currentChatIdRef.current = null;
    setActiveMode(null);
    setAttachedFile(null);
  };

  const loadConversation = (conv: Conversation) => {
    currentChatIdRef.current = conv.id; // Atualiza a referência para continuar o mesmo chat
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
    if (currentChatIdRef.current === id) {
      startNewChat(); // Se apagar o chat atual, limpa a tela
    }
  };

  const downloadImage = async (dataUrl: string) => {
    await downloadBibleImage(dataUrl);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo 10MB", variant: "destructive" });
        return;
      }
      setAttachedFile(file);
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

  const sendSpecialMode = async (text: string, mode: ModeKey) => {
    if (!user) return;
    
    // Check quota before loading
    const limitType = mode === 'image' || mode === 'video' || mode === 'music' ? 'image' : 'complex';
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
    
    const userMsg: Msg = { role: "user", content: text };
    const currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setInput("");
    setIsLoading(true);
    setShowModes(false);

    try {
      const token = await getFreshToken();
      if (!token) { setIsLoading(false); return; }
      
      const resp = await fetch(GEN_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt: text.replace(/\[Modo:.*?\]\s*/g, ""), mode }),
        signal: controller.signal
      });

      if (!resp.ok) { 
        const err = await resp.json().catch(() => ({})); 
        throw new Error(err.error || "Erro ao gerar conteúdo"); 
      }
      
      const data = await resp.json();
      const assistantMsg: Msg = { role: "assistant", content: data.text || "Conteúdo gerado!", image: data.imageUrl };
      const finalMessages = [...currentMsgs, assistantMsg];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      fetchUsage();
      
      saveAIHistory(text, assistantMsg.content, mode).catch(console.error);
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast({ description: "Geração interrompida." });
      } else {
        toast({ title: "Erro", description: e.message || "Erro ao gerar resposta.", variant: "destructive" });
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const send = async (text: string) => {
    if (!user || !text.trim() || isLoading || limitReached) return;

    let finalText = text.trim();
    const currentMode = activeMode ? modes.find(m => m.key === activeMode) : null;
    if (currentMode && !finalText.startsWith(currentMode.prefix.trim())) {
      finalText = currentMode.prefix + finalText;
    }

    let base64Image: string | null = null;
    let fileName: string | null = null;
    if (attachedFile && aiEngine === "complexo") {
      try {
        base64Image = await readFileAsBase64(attachedFile);
        fileName = attachedFile.name;
        finalText = `[Arquivo: ${attachedFile.name}]\n${finalText}`;
      } catch {}
      setAttachedFile(null);
    }

    if (activeMode && activeMode !== "learning" && ["video", "music"].includes(activeMode)) {
      return sendSpecialMode(finalText, activeMode);
    }

    // Check quota before loading
    try {
      const limitType = activeMode === "image" ? "image" : (aiEngine === "complexo" ? "complex" : "simple");
      const hasQuota = await checkAndIncrementUsage(limitType, user.sub);
      if (!hasQuota) {
        toast({ 
          title: "Limite atingido", 
          description: activeMode === "image" ? "Limite de 5 imagens atingido. Recarga em 12h." : "Sua cota diária de mensagens acabou. Recarga em até 12h.", 
          variant: "destructive" 
        });
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

    const userMsg: Msg = { role: "user", content: finalText, fileName: fileName || attachedFile?.name };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);
    setShowModes(false);

    try {
      let responseText = "";
      if (activeMode === 'image') {
        responseText = await generateBiblicalImage(finalText, controller.signal);
      } else {
        responseText = await askBibleAI(finalText, aiEngine === "complexo" ? "complex" : "simple", controller.signal, base64Image);
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
        toast({ title: "Erro na IA", description: error.message || "Erro ao gerar resposta.", variant: "destructive" });
        if (
          error.message?.includes('Chave da API') || 
          error.message?.includes('Todos os modelos falharam') || 
          error.message?.includes('Falha Gemini') ||
          error.message?.includes('BLOQUEADO') ||
          error.message?.includes('Falha de comunicação')
        ) {
          refundUsage(activeMode === "image" ? "image" : (aiEngine === "complexo" ? "complex" : "simple")).catch(console.error);
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
      toast({ title: `${mode.label} desativado` });
    } else {
      setActiveMode(mode.key);
      setShowModes(false);
      toast({ title: `${mode.label} ativado! 🎯` });
    }
  };

  const renderAssistantContent = (msg: Msg) => {
    const lines = (msg.content || "").split("\n");
    return (
      <div className="space-y-1">
        {msg.image && (
          <Fragment>
            <div className="mb-2 relative w-full aspect-square overflow-hidden rounded-xl bg-muted border border-border shadow-inner">
              <ResilientImage src={msg.image} alt="Imagem bíblica gerada" />
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
                   <ResilientImage src={imageUrl} alt="Imagem bíblica gerada" />
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
          if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs font-bold text-foreground mt-1.5">{line.slice(2, -2)}</p>;
          if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="text-xs pl-2 border-l-2 border-accent/30 py-0.5">{line.slice(2)}</p>;
          if (line.match(/^\d+\.\s/)) return <p key={i} className="text-xs pl-2">{line}</p>;
          if (line.trim() === "") return <div key={i} className="h-0.5" />
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className="text-xs leading-relaxed">
              {parts.map((part, j) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={j}>{part.slice(2, -2)}</strong>
                  : part
              )}
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
        <div className="flex-1 overflow-hidden container mx-auto max-w-4xl px-3">
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <button onClick={() => setShowHistory(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors liquid-btn">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-serif text-base font-bold text-foreground">Histórico</h2>
          </div>

          <div className="glass-card rounded-xl p-3 mt-3">
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

          <div className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <Header />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden container mx-auto max-w-4xl px-3">
        <div className="flex shrink-0 items-center gap-2 py-3">
          <button onClick={() => setShowHistory(true)} className="flex items-center justify-center rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors liquid-btn">
            <History className="h-5 w-5" />
          </button>
          
          {/* NOVO BOTÃO PARA INICIAR NOVA CONVERSA */}
          <button onClick={startNewChat} className="flex items-center justify-center rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors liquid-btn" title="Nova Conversa">
            <MessageSquarePlus className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 flex-1 ml-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-base font-bold text-foreground">IA Biblia</h1>
          </div>

          <div className="flex items-center rounded-xl border border-border bg-secondary/50 p-0.5">
            <button
              onClick={() => { setAiEngine("simples"); startNewChat(); }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                aiEngine === "simples" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3 w-3" /> Simples
            </button>
            <button
              onClick={() => { setAiEngine("complexo"); startNewChat(); }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                aiEngine === "complexo" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3 w-3" /> Complexo
            </button>
          </div>
        </div>

        {limitReached && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium">Limite atingido. Recarga em até 12h.</p>
          </div>
        )}

        <div className="flex-1 space-y-2.5 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.length === 0 && (
            <div className="py-8">
              <p className="text-center text-sm text-muted-foreground mb-1">
                {aiEngine === "simples" ? "IA Simples — perguntas diretas sobre a Biblia" : "IA Complexa — respostas detalhadas, imagens e mais"}
              </p>
              <p className="text-center text-[10px] text-muted-foreground/60 mb-4">
                {aiEngine === "simples" ? `${Math.max(0, geminiRemaining)} msgs restantes` : `${Math.max(0, chatRemaining)} msgs restantes`}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                {m.fileName && m.role === "user" && (
                  <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                    <Paperclip className="h-3 w-3" /> {m.fileName}
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
                <DiamondSpinner />
                <span className="text-xs text-muted-foreground">
                  {activeMode === "image" ? "Gerando imagem..." : "Pensando..."}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 bg-background pb-16 pt-2 md:pb-3">
          <AnimatePresence>
            {activeModeInfo && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="mb-2 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2"
              >
                {activeModeInfo.icon}
                <span className="text-xs font-medium text-accent flex-1">{activeModeInfo.label} ativo</span>
                <button onClick={() => setActiveMode(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Paperclip className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-foreground flex-1 truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {showModes && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 flex flex-wrap gap-1.5">
                {modes.map((m) => (
                  <button key={m.key}
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
            <div className="flex items-end gap-2">
              {aiEngine === "complexo" && (
              <div className="flex gap-1">
                <button type="button" onClick={() => setShowModes(!showModes)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors liquid-btn ${showModes ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={limitReached}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors liquid-btn disabled:opacity-50"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.doc,.docx" onChange={handleFileAttach} />
              </div>
            )}
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={!isOnline ? "Necessário internet para IA" : limitReached ? "Limite diário atingido" : activeModeInfo ? `Descreva (${activeModeInfo.label})...` : aiEngine === "simples" ? "Pergunta simples..." : "Pergunte qualquer coisa..."}
              disabled={isLoading || limitReached || !isOnline}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopResponse}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-colors liquid-btn"
                title="Parar resposta"
              >
                <Square size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || limitReached || !isOnline}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors liquid-btn disabled:opacity-50 disabled:cursor-not-allowed"
                title="Enviar"
              >
                <Send size={18} />
              </button>
            )}
            </div>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60 font-medium italic">
            A IA biblica é uma IA ela comete erros
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
