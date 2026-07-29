import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VerseCard, { themes, type CardFormat } from "@/components/VerseCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Palette, RectangleVertical, Square, RectangleHorizontal,
  Image, Type, Search, Loader2, Sparkles, Wand2, Eye, Share2, ImageOff, WifiOff,
  Sliders, RefreshCw, Check, BookOpen, Quote, Layers, SlidersHorizontal, SlidersVertical,
  Maximize2, AlignmentLeft, AlignmentCenter, AlignmentRight, AlertCircle
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";
import { generateBiblicalImage } from "@/services/imageGenerationService";
import { APP_WHITE_LOGO_DATA_URL } from "@/assets/appLogoWhite";

const formats: { key: CardFormat; label: string; dim: string; icon: React.ReactNode }[] = [
  { key: "square", label: "Quadrado", dim: "1080 × 1080 (1:1)", icon: <Square className="h-4 w-4" /> },
  { key: "story", label: "Story", dim: "1080 × 1920 (9:16)", icon: <RectangleVertical className="h-4 w-4" /> },
  { key: "landscape", label: "Paisagem", dim: "1920 × 1080 (16:9)", icon: <RectangleHorizontal className="h-4 w-4" /> },
];

const exportFormats = [
  { key: "png", label: "PNG", mime: "image/png" },
  { key: "jpg", label: "JPG", mime: "image/jpeg" },
  { key: "webp", label: "WEBP", mime: "image/webp" },
] as const;

export type QualityKey = "sd" | "hd" | "4k";

const qualityOptions = [
  { key: "sd" as const, label: "720p (SD)", desc: "Envio Rápido • 150 DPI", scale: 1.5, badge: "720p SD" },
  { key: "hd" as const, label: "1080p (Full HD)", desc: "Recomendado • 300 DPI", scale: 3, badge: "1080p Full HD" },
  { key: "4k" as const, label: "4K (Ultra HD)", desc: "Máxima Nitidez • 600 DPI", scale: 5, badge: "4K Ultra HD" },
] as const;

const fontOptions = [
  { key: "serif", label: "Playfair (Serif)", family: "'Playfair Display', serif", className: "font-serif italic" },
  { key: "cursive", label: "Cursiva", family: "'Dancing Script', cursive", className: "font-cursive" },
  { key: "cinzel", label: "Cinzel (Romana)", family: "'Cinzel', serif", className: "font-cinzel" },
  { key: "cormorant", label: "Elegante Garamond", family: "'Cormorant Garamond', serif", className: "font-cormorant italic" },
  { key: "caveat", label: "Manuscrita", family: "'Caveat', cursive", className: "font-caveat" },
  { key: "lora", label: "Lora (Clássica)", family: "'Lora', serif", className: "font-lora" },
  { key: "sans", label: "Inter (Moderna)", family: "'Inter', sans-serif", className: "font-sans" },
  { key: "montserrat", label: "Montserrat", family: "'Montserrat', sans-serif", className: "font-montserrat" },
  { key: "mono", label: "Monespaçada", family: "'Space Mono', monospace", className: "font-mono" },
];

const imageStyles = [
  { label: "Pôr do sol sereno", prompt: "Pôr do sol calmo no horizonte com raios dourados e luz suave" },
  { label: "Céu estrelado", prompt: "Céu noturno estrelado e limpo com nuvens sutis e luz celestial" },
  { label: "Montanhas ao amanhecer", prompt: "Montanhas majestosas cobertas de névoa ao amanhecer" },
  { label: "Jardim florido", prompt: "Jardim pacífico com flores silvestres e luz da manhã" },
  { label: "Oceano azul", prompt: "Oceano calmo em dia ensolarado com ondas suaves" },
  { label: "Floresta ensolarada", prompt: "Floresta exuberante com raios de sol atravessando as árvores" },
];

const verseCategorySuggestions = [
  { topic: "Amor e Fé", ref: "1 Coríntios 13:13" },
  { topic: "Paz", ref: "Filipe 4:7" },
  { topic: "Força", ref: "Isaías 40:31" },
  { topic: "Proteção", ref: "Salmos 91:1" },
  { topic: "Esperança", ref: "Jeremias 29:11" },
  { topic: "Salvação", ref: "João 3:16" },
];

const presetColors = [
  "#0f172a", "#1e293b", "#1e3a5f", "#2d1b69", "#1a1a2e",
  "#0d2137", "#1b4332", "#3c1642", "#0c1821", "#2c003e",
  "#800020", "#1a1a1a", "#003366", "#004d40", "#4a0e4e",
];

const gradientPresets = [
  { name: "Aurora", style: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2d1b69 100%)" },
  { name: "Pôr do Sol", style: "linear-gradient(135deg, #2d120d 0%, #4a1c12 50%, #1a0f2e 100%)" },
  { name: "Esmeralda", style: "linear-gradient(135deg, #051c14 0%, #0d382c 50%, #081a24 100%)" },
  { name: "Real", style: "linear-gradient(135deg, #120b2e 0%, #29104d 50%, #120a1f 100%)" },
  { name: "Oceano Profundo", style: "linear-gradient(135deg, #031329 0%, #082d4f 50%, #020b18 100%)" },
  { name: "Dourado Noturno", style: "linear-gradient(135deg, #1c1508 0%, #382a0d 50%, #0f0d07 100%)" },
];

type ActiveTab = "verse" | "background" | "typography" | "export";

const AIImagePreviewLoadingOverlay = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const phrases = [
    "Interpretando a passagem e tema bíblico...",
    "Projetando composição fotorrealista em 8K...",
    "Ajustando feixes de luz e iluminação sagrada...",
    "Refinando traços faciais, olhos e textura ultrarrealista...",
    "Finalizando a obra de arte..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % phrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-black/65 backdrop-blur-2xl rounded-2xl"
    >
      {/* Liquid glass floating background light aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-40 h-40 rounded-full bg-primary/20 blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Shimmer light sweep */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent/10 to-transparent animate-shimmer pointer-events-none" />

      {/* Liquid Glass Badge Card */}
      <motion.div
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 rounded-2xl border border-white/20 dark:border-white/10 bg-background/50 backdrop-blur-xl p-6 sm:p-7 shadow-2xl flex flex-col items-center max-w-xs sm:max-w-sm w-full"
      >
        {/* Animated Icon with liquid ring */}
        <div className="relative flex h-16 w-16 items-center justify-center mb-4">
          {/* Outer rotating dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-accent/70"
          />
          {/* Inner glass icon container */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 shadow-inner backdrop-blur-md">
            <Wand2 className="h-6 w-6 text-accent animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-bold text-base text-foreground tracking-tight">Criando Ilustração IA</span>
          <Sparkles className="h-4 w-4 text-accent animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Rotating phrase */}
        <div className="h-6 relative overflow-hidden w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-muted-foreground font-medium text-center truncate block px-2"
            >
              {phrases[stepIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CreatePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRef = searchParams.get("ref") || "";
  const initialText = searchParams.get("text") || "";
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>("verse");
  const [verseText, setVerseText] = useState(initialText || "");
  const [reference, setReference] = useState(initialRef || "");

  const [activeTheme, setActiveTheme] = useState(0);
  const [activeFormat, setActiveFormat] = useState<CardFormat>("square");
  const [exportFormat, setExportFormat] = useState<(typeof exportFormats)[number]>(exportFormats[0]);
  const [exportQuality, setExportQuality] = useState<QualityKey>("hd");
  const [activeFont, setActiveFont] = useState("serif");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#ffffff");
  const [overlayOpacity, setOverlayOpacity] = useState(50); // % opacity for image dark overlay

  const [bgType, setBgType] = useState<"theme" | "custom_color" | "gradient" | "ai">("custom_color");
  const [customColor, setCustomColor] = useState("#111827");
  const [selectedGradient, setSelectedGradient] = useState(gradientPresets[0].style);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [aiImageUrl, setAiImageUrl] = useState("");
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageError, setAiImageError] = useState(false);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSearchVerse = async (q?: string) => {
    const query = q || searchQuery;
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      let foundText = "";
      let foundRef = "";

      // Try bible-api.com first
      try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=almeida`);
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            foundText = data.text.trim();
            foundRef = data.reference || query;
          }
        }
      } catch (e) {
        console.warn("bible-api fetch failed, attempting local bible data fallback...", e);
      }

      // If online API fails or returns empty, attempt fallback using local Bible data
      if (!foundText) {
        const match = query.match(/^([1-3]?\s?[A-Za-zÀ-ÿ]+)\s+(\d+)(?::(\d+))?/);
        if (match) {
          const bookInput = match[1].trim().toLowerCase();
          const chapterNum = parseInt(match[2], 10);
          const verseNum = match[3] ? parseInt(match[3], 10) : null;

          const book = bibleBooks.find(b => 
            b.name.toLowerCase() === bookInput || 
            b.abbrev.toLowerCase() === bookInput ||
            b.name.toLowerCase().startsWith(bookInput)
          );

          if (book) {
            const chapData = await fetchChapter(book.abbrev, chapterNum, 'blivre');
            if (verseNum) {
              const v = chapData.verses.find(item => item.verse === verseNum);
              if (v) {
                foundText = v.text;
                foundRef = `${book.name} ${chapterNum}:${verseNum}`;
              }
            } else if (chapData.text) {
              foundText = chapData.text;
              foundRef = `${book.name} ${chapterNum}`;
            }
          }
        }
      }

      if (foundText) {
        setVerseText(foundText);
        setReference(foundRef || query);
      } else {
        toast({ title: "Versículo não encontrado", description: "Verifique o nome do livro e capítulo (ex: João 3:16)", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao buscar versículo", description: "Verifique sua conexão ou tente buscar por referência como 'João 3:16'", variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  };

  // Daily AI image usage limit
  const [createImageCount, setCreateImageCount] = useState(0);
  const CREATE_IMAGE_LIMIT = 3;

  const checkCreateUsage = useCallback(async (): Promise<number> => {
    try {
      let targetUserId = authUser?.sub;
      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        targetUserId = session?.user?.id;
      }
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }
      if (!targetUserId) return 0;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('tipo_uso', 'create_image')
        .gte('created_at', today.toISOString());

      if (!error && count !== null) {
        setCreateImageCount(count);
        return count;
      }
      return 0;
    } catch (err) {
      console.error("Erro ao verificar cota no Criar:", err);
      return 0;
    }
  }, [authUser]);

  useEffect(() => {
    checkCreateUsage();
  }, [checkCreateUsage]);

  const createImageLimitReached = createImageCount >= CREATE_IMAGE_LIMIT;

  const handleGenerateAIImage = async () => {
    if (!verseText) { toast({ title: "Adicione um versículo primeiro", variant: "destructive" }); return; }
    if (!authUser) { toast({ title: "Faça login para gerar imagens com IA" }); return; }
    
    // Atualiza cota antes da validação obtendo a cota real direto da consulta
    const freshCount = await checkCreateUsage();

    if (freshCount >= CREATE_IMAGE_LIMIT) { 
      toast({ 
        title: "Limite diário atingido", 
        description: `Você atingiu o limite de ${CREATE_IMAGE_LIMIT} imagens por dia no Modo Criar. Sua cota recarrega em 12 horas.`, 
        variant: "destructive" 
      }); 
      return; 
    }
    
    setAiImageLoading(true);
    setAiImageError(false);
    setBgType("ai");

    try {
      const stylePrompt = customAiPrompt.trim() || imageStyles[selectedStyleIndex].prompt;
      const fullPrompt = `Cenário de paisagem natural inspirada no versículo: "${verseText}". Estilo: ${stylePrompt}. Apenas paisagem natural inspiradora de fundo, sem pessoas, sem rostos e sem seres humanos.`;

      const imageUrl = await generateBiblicalImage(fullPrompt, undefined, activeFormat, true, 'create', true);

      if (imageUrl) {
        setAiImageUrl(imageUrl);
        await checkCreateUsage();
        return;
      }
      
      throw new Error("O modelo não retornou uma imagem. Tente novamente.");
    } catch (e: any) {
      console.error("AI Image Error:", e);
      const errMsg = e.message || "";
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
    } finally {
      await checkCreateUsage();
      setAiImageLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardContainerRef.current) return;
    const activeQualityObj = qualityOptions.find(q => q.key === exportQuality) || qualityOptions[1];

    try {
      const el = cardContainerRef.current;

      const canvas = await html2canvas(el, {
        scale: activeQualityObj.scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
      });

      const dataUrl = canvas.toDataURL(exportFormat.mime, 0.95);
      await downloadBibleImage(dataUrl, "Biblia-Online-Arte");
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      toast({ title: "Erro ao baixar imagem", description: "Ocorreu um problema ao processar os elementos visuais.", variant: "destructive" });
    }
  };

  const handleShareImage = async () => {
    if (!cardContainerRef.current) return;
    const activeQualityObj = qualityOptions.find(q => q.key === exportQuality) || qualityOptions[1];

    try {
      const el = cardContainerRef.current;

      const canvas = await html2canvas(el, {
        scale: activeQualityObj.scale, 
        useCORS: true, 
        allowTaint: false, 
        backgroundColor: null, 
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
      });

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      await shareBibleImage(dataUrl, "Biblia-Online-Arte");
    } catch (err) {
      console.error("Share error:", err);
      toast({ title: "Erro ao processar imagem", description: "Houve um problema ao preparar a imagem.", variant: "destructive" });
    }
  };

  const currentTheme = themes[activeTheme];
  const selectedFont = fontOptions.find(f => f.key === activeFont);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-5 max-w-6xl space-y-6">
        
        {/* Header Banner */}
        <div className="glass-card rounded-2xl p-5 border border-border/60 bg-gradient-to-r from-card/90 via-card/80 to-accent/5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Estúdio de Criação Bíblica</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Crie Artes e Cartões Bíblicos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Personalize o texto, fontes, fundos com IA e baixe em alta resolução para compartilhar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Arte</span>
            </button>
            <button
              onClick={handleShareImage}
              className="flex items-center justify-center p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted active:scale-95 transition-all border border-border/50"
              title="Compartilhar"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Control Panel */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tab Navigation Pill Track */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-secondary/60 border border-border/50 backdrop-blur-md relative overflow-hidden select-none">
              {[
                { id: "verse", label: "Versículo", icon: Quote },
                { id: "background", label: "Fundo", icon: Palette },
                { id: "typography", label: "Texto", icon: Type },
                { id: "export", label: "Formato", icon: Image },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-[11px] font-semibold transition-colors select-none ${
                      isActive
                        ? "text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCreateTabPill"
                        className="absolute inset-0 rounded-xl bg-primary shadow-md"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex flex-col items-center justify-center">
                      <Icon className="h-4 w-4 mb-0.5" />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Verse Content & Search */}
            {activeTab === "verse" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-accent" />
                      Buscar Passagem
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={searchQuery}
                      maxLength={15}
                      onChange={(e) => setSearchQuery(e.target.value.slice(0, 15))}
                      placeholder={!isOnline ? "Indisponível offline" : "Ex: Filipenses 4:13"}
                      onKeyDown={(e) => e.key === "Enter" && isOnline && handleSearchVerse()}
                      disabled={!isOnline}
                      className="flex-1 rounded-xl border border-input bg-secondary/50 px-3.5 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    />
                    <button
                      onClick={() => { if (isOnline) handleSearchVerse(); }}
                      disabled={searchLoading || !isOnline}
                      className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">Sugestões Rápidas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {verseCategorySuggestions.map((item) => (
                        <button
                          key={item.ref}
                          onClick={() => { setSearchQuery(item.ref); handleSearchVerse(item.ref); }}
                          className="rounded-lg bg-secondary/80 hover:bg-accent/20 hover:text-accent border border-border/40 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground transition-all"
                        >
                          {item.topic} ({item.ref})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Text Customization Area */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Quote className="h-3.5 w-3.5 text-accent" />
                    Editar Texto Manualmente
                  </span>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-muted-foreground">Texto do Versículo:</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{verseText.length}/1000</span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={verseText}
                      onChange={(e) => setVerseText(e.target.value.slice(0, 1000))}
                      placeholder="Digite o texto aqui..."
                      className="w-full rounded-xl border border-input bg-secondary/40 p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none custom-scrollbar"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Referência Bíblica:</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={reference}
                      onChange={(e) => setReference(e.target.value.slice(0, 100))}
                      placeholder="Ex: Salmos 23:1"
                      className="w-full rounded-xl border border-input bg-secondary/40 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Backgrounds & Themes */}
            {activeTab === "background" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                
                {/* Background Mode Selector */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-secondary/50 border border-border/40">
                  <button
                    onClick={() => setBgType("theme")}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      bgType === "theme" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Temas
                  </button>
                  <button
                    onClick={() => setBgType("gradient")}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      bgType === "gradient" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Gradiente
                  </button>
                  <button
                    onClick={() => setBgType("custom_color")}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      bgType === "custom_color" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sólida
                  </button>
                  <button
                    onClick={() => setBgType("ai")}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      bgType === "ai" ? "bg-accent text-accent-foreground shadow-sm font-bold" : "text-accent hover:bg-accent/10"
                    }`}
                  >
                    <Wand2 className="h-3 w-3" />
                    IA
                  </button>
                </div>

                {/* Sub-panel 1: Preset Themes */}
                {bgType === "theme" && (
                  <div className="glass-card rounded-2xl p-4 border border-border/60">
                    <span className="text-xs font-semibold text-foreground block mb-3">Temas Pré-definidos</span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {themes.map((t, idx) => (
                        <button
                          key={t.name}
                          onClick={() => { setActiveTheme(idx); }}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                            idx === activeTheme
                              ? "border-accent bg-accent/10 text-foreground shadow-sm"
                              : "border-border/40 bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/60"
                          }`}
                        >
                          <div className={`h-7 w-7 rounded-full ${t.bg} ring-2 ring-white/10 flex items-center justify-center shadow-sm`}>
                            <div className={`h-2.5 w-2.5 rounded-full ${t.accent}`} />
                          </div>
                          <span className="text-[10px] font-medium truncate w-full text-center">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-panel 2: Gradient Presets */}
                {bgType === "gradient" && (
                  <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                    <span className="text-xs font-semibold text-foreground block mb-1">Gradientes Elegantes</span>
                    <div className="grid grid-cols-2 gap-2">
                      {gradientPresets.map((g) => (
                        <button
                          key={g.name}
                          onClick={() => setSelectedGradient(g.style)}
                          className={`h-16 rounded-xl p-3 border transition-all flex items-end justify-between text-white ${
                            selectedGradient === g.style ? "border-accent ring-2 ring-accent/50 scale-[1.02]" : "border-border/40 hover:border-border"
                          }`}
                          style={{ background: g.style }}
                        >
                          <span className="text-[10px] font-semibold drop-shadow-md">{g.name}</span>
                          {selectedGradient === g.style && <Check className="h-3.5 w-3.5 text-accent" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-panel 3: Custom Color */}
                {bgType === "custom_color" && (
                  <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                    <span className="text-xs font-semibold text-foreground block">Cor de Fundo Sólida</span>
                    <div className="grid grid-cols-5 gap-2">
                      {presetColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCustomColor(c)}
                          className={`h-9 rounded-xl border-2 transition-all ${
                            customColor === c ? "border-accent scale-105 shadow-md" : "border-transparent hover:scale-95"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">Personalizado:</span>
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-24 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-panel 4: AI Image Background */}
                {bgType === "ai" && (
                  <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Wand2 className="h-3.5 w-3.5 text-accent" />
                        Fundo Inteligente com IA
                      </span>
                      <span className="text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                        {createImageCount}/{CREATE_IMAGE_LIMIT} hoje
                      </span>
                    </div>

                    {!isOnline ? (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center space-y-2">
                        <WifiOff className="h-5 w-5 text-amber-500 mx-auto" />
                        <p className="text-xs font-medium text-foreground">Conexão necessária</p>
                        <p className="text-[10px] text-muted-foreground">
                          A geração de imagens por IA requer internet ativa.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[11px] text-muted-foreground">Escolha o estilo estético do fundo:</p>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          {imageStyles.map((item, idx) => (
                            <button
                              key={item.label}
                              onClick={() => { setSelectedStyleIndex(idx); setCustomAiPrompt(""); }}
                              className={`p-2 rounded-xl text-left border text-[11px] font-medium transition-all ${
                                selectedStyleIndex === idx && !customAiPrompt
                                  ? "border-accent bg-accent/10 text-foreground font-semibold"
                                  : "border-border/40 bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-1">Ou descreva em poucas palavras (máx. 200 caracteres):</label>
                          <input
                            maxLength={200}
                            value={customAiPrompt}
                            onChange={(e) => setCustomAiPrompt(e.target.value.slice(0, 200))}
                            placeholder="Ex: Cruz ao anoitecer com luz celestial"
                            className="w-full rounded-xl border border-input bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>

                        {/* Overlay opacity for AI Images */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-muted-foreground">Escurecimento de Fundo:</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{overlayOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={overlayOpacity}
                            onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                            className="w-full accent-accent bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Animated Limit Banner */}
                        <AnimatePresence>
                          {createImageLimitReached && (
                            <motion.div 
                              initial={{ opacity: 0, y: -8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.96 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="p-3.5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 backdrop-blur-md shadow-md space-y-2 overflow-hidden"
                            >
                              <div className="flex items-center gap-3">
                                <motion.div 
                                  animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner"
                                >
                                  <AlertCircle className="h-5 w-5" />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <p className="text-xs font-bold text-rose-200 tracking-tight">
                                      Limite Diário Atingido
                                    </p>
                                    <span className="shrink-0 rounded-full bg-rose-500/25 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                                      {CREATE_IMAGE_LIMIT}/{CREATE_IMAGE_LIMIT} hoje
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-rose-300/80 leading-snug mt-0.5">
                                    Você atingiu o limite de {CREATE_IMAGE_LIMIT} imagens por dia. Sua cota recarrega em 12 horas.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={handleGenerateAIImage}
                          disabled={aiImageLoading || createImageLimitReached}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-md ${
                            createImageLimitReached
                              ? "bg-rose-950/40 text-rose-300 border border-rose-500/30 cursor-not-allowed opacity-80"
                              : "bg-accent text-accent-foreground hover:opacity-90 active:scale-95 disabled:opacity-50"
                          }`}
                        >
                          {aiImageLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : createImageLimitReached ? (
                            <AlertCircle className="h-4 w-4 text-rose-400 animate-pulse" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span>
                            {createImageLimitReached
                              ? `Limite diário atingido (${CREATE_IMAGE_LIMIT}/${CREATE_IMAGE_LIMIT})`
                              : aiImageLoading
                              ? "Criando imagem no servidor..."
                              : "Gerar Imagem com IA"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Typography Settings */}
            {activeTab === "typography" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                
                {/* Font selection */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-accent" />
                    Família Tipográfica
                  </span>

                  <div className="grid grid-cols-3 gap-1.5">
                    {fontOptions.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setActiveFont(f.key)}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${f.className} ${
                          activeFont === f.key
                            ? "border-accent bg-accent/15 text-foreground font-semibold shadow-sm ring-1 ring-accent"
                            : "border-border/40 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                        style={{ fontFamily: f.family }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size & Color slider */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-foreground">Tamanho da Fonte</span>
                      <span className="text-xs font-mono font-bold text-accent">{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                        className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground hover:bg-muted"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="14"
                        max="60"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="flex-1 accent-accent bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setFontSize(Math.min(60, fontSize + 2))}
                        className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {bgType === "ai" && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-xs font-semibold text-foreground block mb-2">Cor do Texto (Sobre a Foto)</span>
                      <div className="flex items-center gap-2">
                        {["#ffffff", "#f8fafc", "#fef08a", "#bae6fd", "#fbcfe8", "#000000"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setTextColor(color)}
                            className={`h-7 w-7 rounded-full border-2 transition-transform ${
                              textColor === color ? "border-accent scale-110 shadow-sm" : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 4: Aspect Ratio & Export Formats & Quality */}
            {activeTab === "export" && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                
                {/* Canvas Aspect Ratio */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <span className="text-xs font-semibold text-foreground block">Proporção da Imagem</span>
                  <div className="grid grid-cols-3 gap-2">
                    {formats.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setActiveFormat(f.key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${
                          activeFormat === f.key
                            ? "border-accent bg-accent/15 text-foreground font-semibold shadow-sm"
                            : "border-border/40 bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                        }`}
                      >
                        {f.icon}
                        <span className="text-xs font-bold">{f.label}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{f.dim}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qualidade e Resolução */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      Qualidade e Resolução
                    </span>
                    <span className="text-[10px] font-mono font-medium text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/30">
                      {qualityOptions.find(q => q.key === exportQuality)?.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {qualityOptions.map((q) => (
                      <button
                        key={q.key}
                        onClick={() => setExportQuality(q.key)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all gap-1 ${
                          exportQuality === q.key
                            ? "border-accent bg-accent/15 text-foreground font-bold shadow-sm ring-1 ring-accent"
                            : "border-border/40 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-bold">{q.label}</span>
                        <span className="text-[9px] opacity-75 leading-tight">{q.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download File Format */}
                <div className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                  <span className="text-xs font-semibold text-foreground block">Formato de Arquivo</span>
                  <div className="grid grid-cols-3 gap-2">
                    {exportFormats.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setExportFormat(f)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          exportFormat.key === f.key
                            ? "border-accent bg-accent/15 text-foreground shadow-sm"
                            : "border-border/40 bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90 active:scale-95 transition-all shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Arte ({exportFormat.label} • {qualityOptions.find(q => q.key === exportQuality)?.badge})</span>
                  </button>

                  <button
                    onClick={handleShareImage}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-secondary-foreground hover:bg-muted active:scale-95 transition-all border border-border/50"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Compartilhar Direto</span>
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Column: Live Interactive Canvas Preview */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 lg:self-start space-y-3">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Eye className="h-4 w-4 text-accent" />
                <span>Pré-visualização da Arte</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as QualityKey)}
                  className="text-[11px] font-semibold bg-secondary/90 hover:bg-secondary text-foreground border border-border/50 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                  title="Qualidade de Exportação"
                >
                  {qualityOptions.map((q) => (
                    <option key={q.key} value={q.key}>
                      {q.badge} ({q.label})
                    </option>
                  ))}
                </select>

                <span className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full border border-border/40">
                  {formats.find(f => f.key === activeFormat)?.dim}
                </span>
              </div>
            </div>

            {/* Canvas Outer Frame - Adjusted tightly to image aspect ratio */}
            <div className="flex flex-col items-center justify-center w-full transition-all relative py-1">
              
              <div 
                ref={cardContainerRef} 
                className={`w-full transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-border/40 ${
                  activeFormat === "story" 
                    ? "max-w-xs sm:max-w-sm mx-auto" 
                    : activeFormat === "square" 
                    ? "max-w-md mx-auto" 
                    : "max-w-xl mx-auto"
                }`}
              >
                
                {/* Condition A: AI Image Background */}
                {bgType === "ai" && (aiImageUrl || aiImageLoading) ? (
                  <div
                    className={`relative overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 sm:p-12 w-full ${
                      activeFormat === "square" ? "aspect-square" : activeFormat === "story" ? "aspect-[9/16]" : "aspect-video"
                    }`}
                    style={{
                      background: "linear-gradient(135deg, #090d16 0%, #171d2b 100%)"
                    }}
                  >
                    {aiImageLoading && <AIImagePreviewLoadingOverlay />}

                    {aiImageUrl && !aiImageLoading && (
                      <Fragment>
                        <motion.img
                          key={aiImageUrl}
                          src={aiImageUrl}
                          alt="Background com IA"
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setAiImageError(true)}
                          onLoad={() => setAiImageError(false)}
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6 }}
                        />
                        {/* Adjustable Dark Overlay */}
                        <div
                          className="absolute inset-0 bg-black transition-opacity"
                          style={{ opacity: overlayOpacity / 100 }}
                        />
                      </Fragment>
                    )}

                    <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md text-center">
                      {!verseText ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Sparkles className="h-8 w-8 opacity-40 mb-3 animate-pulse" style={{ color: textColor }} />
                          <p className="text-sm font-sans font-medium opacity-60 tracking-normal" style={{ color: textColor }}>
                            Busque um versículo para começar
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex justify-center">
                            <div className="h-px w-12 bg-white/40" />
                          </div>
                          <blockquote 
                            className={`leading-relaxed ${selectedFont?.className || "font-serif"}`}
                            style={{ fontSize: `${fontSize}px`, color: textColor, fontFamily: selectedFont?.family }}
                          >
                            "{verseText}"
                          </blockquote>
                          {reference && (
                            <>
                              <div className="mt-4 flex justify-center">
                                <div className="h-px w-12 bg-white/40" />
                              </div>
                              <p
                                className="mt-3 text-xs font-sans font-semibold tracking-widest uppercase opacity-90"
                                style={{ color: textColor }}
                              >
                                {reference}
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Marca d'água permanente no canto direito - ícone do app em branco com transparência */}
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-none select-none">
                      <img 
                        src={APP_WHITE_LOGO_DATA_URL} 
                        alt="Bíblia Online" 
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="h-6 sm:h-8 w-auto object-contain opacity-50 drop-shadow-sm pointer-events-none select-none no-copy-logo"
                      />
                    </div>
                  </div>
                ) : bgType === "gradient" ? (
                  /* Condition B: Custom Gradient Background */
                  <div
                    className={`relative overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 sm:p-12 text-white w-full ${
                      activeFormat === "square" ? "aspect-square" : activeFormat === "story" ? "aspect-[9/16]" : "aspect-video"
                    }`}
                    style={{ background: selectedGradient }}
                  >
                    <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md text-center">
                      {!verseText ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Sparkles className="h-8 w-8 opacity-40 mb-3 animate-pulse text-white" />
                          <p className="text-sm font-sans font-medium opacity-60 tracking-normal text-white">
                            Busque um versículo para começar
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex justify-center"><div className="h-px w-12 bg-white/30" /></div>
                          <blockquote 
                            className={`leading-relaxed ${selectedFont?.className || "font-serif"}`}
                            style={{ fontSize: `${fontSize}px`, fontFamily: selectedFont?.family }}
                          >
                            "{verseText}"
                          </blockquote>
                          {reference && (
                            <>
                              <div className="mt-4 flex justify-center"><div className="h-px w-12 bg-white/30" /></div>
                              <p className="mt-3 text-xs font-sans font-semibold tracking-widest uppercase opacity-90">
                                {reference}
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Marca d'água permanente no canto direito - ícone do app em branco com transparência */}
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-none select-none">
                      <img 
                        src={APP_WHITE_LOGO_DATA_URL} 
                        alt="Bíblia Online" 
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="h-6 sm:h-8 w-auto object-contain opacity-50 drop-shadow-sm pointer-events-none select-none no-copy-logo"
                      />
                    </div>
                  </div>
                ) : (
                  /* Condition C: Preset Theme or Custom Solid Color */
                  <div className="w-full rounded-2xl overflow-hidden" style={bgType === "custom_color" ? { backgroundColor: customColor } : undefined}>
                    <VerseCard 
                      text={verseText} 
                      reference={reference} 
                      theme={bgType === "custom_color" ? { name: "Personalizado", bg: "", text: "text-white", accent: "bg-white/20" } : currentTheme} 
                      format={activeFormat} 
                      animate={false} 
                      fontSize={fontSize}
                      fontFamily={selectedFont?.family}
                      fontClass={selectedFont?.className}
                      customBgColor={bgType === "custom_color" ? customColor : undefined}
                    />
                  </div>
                )}

              </div>

              {/* Status Message below canvas */}
              {bgType === "ai" && aiImageError && !aiImageLoading && (
                <div className="w-full p-3 text-xs">
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                    <ImageOff className="h-4 w-4 shrink-0 text-destructive" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-destructive">Falha no carregamento</span>
                      <span className="text-[10px] text-muted-foreground">Erro ao carregar imagem. Tente alterar o estilo ou gerar novamente.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Quick Action Button below Canvas */}
            <div className="pt-1 flex items-center justify-between gap-3 px-1">
              <span className="text-[11px] text-muted-foreground">
                Qualidade: <strong className="text-foreground">{qualityOptions.find(q => q.key === exportQuality)?.badge}</strong>
              </span>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Salvar ({exportFormat.label} • {qualityOptions.find(q => q.key === exportQuality)?.badge})</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CreatePage;
