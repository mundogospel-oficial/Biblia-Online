import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import {
  Send, Trash2, Sparkles, GraduationCap, X,
  Plus, Image, Video, Music, Diamond, Download, LogIn,
  History, ChevronLeft, Zap, Bot, Paperclip, AlertCircle, MessageSquarePlus, Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { askBibleAI } from "@/services/aiService";
import { checkAndIncrementUsage } from "@/services/usageService";

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

// Daily limits
const DAILY_CHAT_LIMIT = 7;
const DAILY_IMAGE_LIMIT = 5;
const DAILY_GEMINI_LIMIT = 10;

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
  const [limitReached, setLimitReached] = useState(false);

  // Função blindada para garantir que o token JWT nunca seja inválido
  const getFreshToken = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || !session.access_token) {
      toast({ title: "Sessão expirada ou inválida. Faça login novamente.", variant: "destructive" });
      await supabase.auth.signOut();
      return null;
    }
    return session.access_token;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONVERSATIONS_KEY);
      if (saved) setConversations(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const { count: chatCount } = await (supabase as any)
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('tipo_uso', 'chat')
        .gte('created_at', todayStr);
      
      const { count: imgCount } = await (supabase as any)
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('tipo_uso', 'imagem')
        .gte('created_at', todayStr);

      const { count: gemCount } = await (supabase as any)
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('tipo_uso', 'gemini_chat')
        .gte('created_at', todayStr);

      setChatUsed(chatCount || 0);
      setImageUsed(imgCount || 0);
      setGeminiUsed(gemCount || 0);
    };
    fetchUsage();
  }, [user]);

  useEffect(() => {
    if (aiEngine === "simples") {
      setLimitReached(geminiUsed >= DAILY_GEMINI_LIMIT);
    } else {
      if (activeMode === "image") {
        setLimitReached(imageUsed >= DAILY_IMAGE_LIMIT);
      } else {
        setLimitReached(chatUsed >= DAILY_CHAT_LIMIT);
      }
    }
  }, [aiEngine, activeMode, chatUsed, imageUsed, geminiUsed]);

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

  // NOVO: Lógica corrigida para não duplicar conversas no histórico
  const saveConversation = (msgs: Msg[]) => {
    if (msgs.length < 2) return;
    
    setConversations(prev => {
      const title = msgs[0]?.content.slice(0, 50) || "Conversa";
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

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = `ia-biblica-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const hasQuota = await checkAndIncrementUsage(user.id, limitType as any);
    if (!hasQuota) {
      toast({ title: "Erro", description: "Limite diário atingido para este modo!", variant: "destructive" });
      setLimitReached(true);
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
      if (mode === "image") setImageUsed(prev => prev + 1);
      
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Ignorar AbortError
      } else {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      }
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

    if (attachedFile && aiEngine === "complexo") {
      try {
        await readFileAsBase64(attachedFile);
        finalText = `[Arquivo: ${attachedFile.name}]\n${finalText}`;
      } catch {}
      setAttachedFile(null);
    }

    if (activeMode && activeMode !== "learning" && ["image", "video", "music"].includes(activeMode)) {
      return sendSpecialMode(finalText, activeMode);
    }

    // Check quota before loading
    const hasQuota = await checkAndIncrementUsage(user.id, aiEngine === "complexo" ? "complex" : "simple");
    if (!hasQuota) {
      toast({ title: "Erro", description: "Limite diário atingido para este modo!", variant: "destructive" });
      setLimitReached(true);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    const userMsg: Msg = { role: "user", content: finalText, fileName: attachedFile?.name };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);
    setShowModes(false);

    try {
      const responseText = await askBibleAI(finalText, aiEngine === "complexo" ? "complex" : "simple", controller.signal);
      const finalMessages = [...newMessages, { role: "assistant" as const, content: responseText }];
      setMessages(finalMessages);
      saveConversation(finalMessages);
      
      if (aiEngine === "simples") {
        setGeminiUsed(prev => prev + 1);
      } else {
        setChatUsed(prev => prev + 1);
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message.includes('abort') || error.message.includes('The user aborted a request')) {
        // Ignorar
      } else {
        toast({ title: "Erro na IA", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    abortController?.abort();
    setIsLoading(false);
    toast({ description: "Geração cancelada." });
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
    const lines = msg.content.split("\n");
    return (
      <div className="space-y-1">
        {msg.image && (
          <div className="mb-2">
            <img src={msg.image} alt="Imagem gerada" className="rounded-xl max-w-full w-full" />
            <button onClick={() => downloadImage(msg.image!)}
              className="mt-1.5 flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors liquid-btn">
              <Download className="h-3 w-3" /> Baixar imagem
            </button>
          </div>
        )}
        {lines.map((line, i) => {
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
  const chatRemaining = DAILY_CHAT_LIMIT - chatUsed;
  const imageRemaining = DAILY_IMAGE_LIMIT - imageUsed;
  const geminiRemaining = DAILY_GEMINI_LIMIT - geminiUsed;

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
                    <button onClick={() => loadConversation(conv)} className="flex-1 text-left liquid-btn">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
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
            <h1 className="font-serif text-base font-bold text-foreground">IA Bíblica</h1>
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
            <p className="text-xs text-destructive font-medium">Limite diário atingido. Volte amanhã!</p>
          </div>
        )}

        <div className="flex-1 space-y-2.5 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.length === 0 && (
            <div className="py-8">
              <p className="text-center text-sm text-muted-foreground mb-1">
                {aiEngine === "simples" ? "IA Simples — perguntas diretas sobre a Bíblia" : "IA Complexa — respostas detalhadas, imagens e mais"}
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
                {m.role === "assistant" ? renderAssistantContent(m) : <span className="text-sm">{m.content}</span>}
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

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
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
              placeholder={limitReached ? "Limite diário atingido" : activeModeInfo ? `Descreva (${activeModeInfo.label})...` : aiEngine === "simples" ? "Pergunta simples..." : "Pergunte qualquer coisa..."}
              disabled={isLoading || limitReached}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  handleStop();
                } else {
                  if (!input.trim() || limitReached) e.preventDefault();
                }
              }}
              type={isLoading ? "button" : "submit"}
              disabled={(!isLoading && (!input.trim() || limitReached))}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all liquid-btn ${
                isLoading
                  ? "bg-transparent animate-pulse text-destructive"
                  : "bg-accent text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isLoading ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
