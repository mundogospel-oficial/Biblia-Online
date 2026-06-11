import { useState, useRef, useEffect, Fragment } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VerseCard, { themes, type CardFormat } from "@/components/VerseCard";
import { motion } from "framer-motion";
import {
  Download, Palette, RectangleVertical, Square, RectangleHorizontal,
  Image, Type, Search, Loader2, Sparkles, Wand2, Eye, Share2,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadBibleImage, shareBibleImage } from "@/lib/downloadUtils";
import { generateBiblicalImage } from "@/services/imageGenerationService";

const formats: { key: CardFormat; label: string; icon: React.ReactNode }[] = [
  { key: "square", label: "Quadrado", icon: <Square className="h-3.5 w-3.5" /> },
  { key: "story", label: "Story", icon: <RectangleVertical className="h-3.5 w-3.5" /> },
  { key: "landscape", label: "Paisagem", icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
];

const exportFormats = [
  { key: "png", label: "PNG", mime: "image/png" },
  { key: "jpg", label: "JPG", mime: "image/jpeg" },
  { key: "webp", label: "WEBP", mime: "image/webp" },
] as const;

const fontOptions = [
  { key: "serif", label: "Serifada", className: "font-serif" },
  { key: "sans", label: "Moderna", className: "font-sans" },
  { key: "mono", label: "Mono", className: "font-mono" },
  { key: "cursive", label: "Cursiva", className: "font-serif italic" },
  { key: "display", label: "Display", className: "font-serif font-bold" },
  { key: "condensed", label: "Condensada", className: "font-sans font-light tracking-tight" },
  { key: "wide", label: "Espaçada", className: "font-sans tracking-widest uppercase text-sm" },
  { key: "elegant", label: "Elegante", className: "font-serif font-light italic" },
  { key: "bold", label: "Negrito", className: "font-sans font-black" },
  { key: "thin", label: "Fina", className: "font-sans font-thin tracking-wide" },
];

const imageStyles = [
  "paisagem serena com luz suave",
  "céu estrelado com nuvens",
  "montanhas ao amanhecer",
  "jardim florido e pacífico",
  "oceano calmo ao pôr do sol",
];

const verseSuggestions = ["João 3:16", "Salmos 23:1", "Filipenses 4:13", "Romanos 8:28", "Provérbios 3:5", "Isaías 41:10"];

const presetColors = [
  "#1a2744", "#0f172a", "#1e3a5f", "#2d1b69", "#1a1a2e",
  "#0d2137", "#1b4332", "#3c1642", "#0c1821", "#2c003e",
  "#800020", "#1a1a1a", "#003366", "#004d40", "#4a0e4e",
];

const CreatePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRef = searchParams.get("ref") || "";
  const initialText = searchParams.get("text") || "";
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [verseText, setVerseText] = useState(initialText);
  const [reference, setReference] = useState(initialRef);
  const [activeTheme, setActiveTheme] = useState(0);
  const [activeFormat, setActiveFormat] = useState<CardFormat>("square");
  const [exportFormat, setExportFormat] = useState<(typeof exportFormats)[number]>(exportFormats[0]);
  const [activeFont, setActiveFont] = useState("serif");
  const [fontSize, setFontSize] = useState(24);
  const [customColor, setCustomColor] = useState("#1a2744");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [useAIImage, setUseAIImage] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState(imageStyles[0]);
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
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=almeida`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.text) {
        setVerseText(data.text.trim());
        setReference(data.reference || query);
        toast({ title: "Versículo encontrado! ✨" });
      } else {
        toast({ title: "Versículo não encontrado", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao buscar versículo", variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  };

  // Daily AI image generation limit for create page
  const [createImageCount, setCreateImageCount] = useState(0);
  const CREATE_IMAGE_LIMIT = 3;

  useEffect(() => {
    if (!authUser) return;
    const checkCreateUsage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const { count } = await (supabase as any)
        .from('user_ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('tipo_uso', 'create_image')
        .gte('created_at', today.toISOString());
      setCreateImageCount(count || 0);
    };
    checkCreateUsage();
  }, [authUser]);

  const createImageLimitReached = createImageCount >= CREATE_IMAGE_LIMIT;

  const handleGenerateAIImage = async () => {
    toast({ 
      title: "Recurso em Manutenção", 
      description: "A geração de imagens com Inteligência Artificial está temporariamente indisponível devido a manutenção programada do motor de renderização da IA Google.", 
      variant: "destructive" 
    });
    return;
  };

  const handleDownload = async () => {
    if (!cardContainerRef.current) return;
    try {
      const el = cardContainerRef.current;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = el.scrollWidth + "px";
      clone.style.height = el.scrollHeight + "px";
      clone.style.overflow = "visible";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        x: 0,
        y: 0,
      });
      
      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL(exportFormat.mime, 0.95);
      await downloadBibleImage(dataUrl);
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      toast({ title: "Erro ao baixar imagem", variant: "destructive" });
    }
  };

  const handleShareImage = async () => {
    if (!cardContainerRef.current) return;
    try {
      const el = cardContainerRef.current;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = el.scrollWidth + "px";
      clone.style.height = el.scrollHeight + "px";
      clone.style.overflow = "visible";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 3, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: null, 
        logging: false,
        width: clone.scrollWidth, 
        height: clone.scrollHeight,
      });
      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      await shareBibleImage(dataUrl);
    } catch (err) {
      console.error("Share error:", err);
      toast({ title: "Erro ao compartilhar", variant: "destructive" });
    }
  };

  const currentTheme = useCustomColor
    ? { name: "Personalizado", bg: "", text: "text-white", accent: "bg-white/20", style: `background-color: ${customColor}` }
    : themes[activeTheme];

  const selectedFont = fontOptions.find(f => f.key === activeFont);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 font-serif text-xl font-bold text-foreground sm:text-2xl">Criar Página</h1>
          <p className="mb-5 text-xs text-muted-foreground sm:text-sm">Personalize e baixe uma imagem com seu versículo</p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-3">
              {/* Search */}
              <div className="glass-card rounded-xl p-4">
                <label className="mb-2 block text-sm font-medium text-foreground">🔍 Buscar Versículo</label>
                <div className="flex gap-2">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={!isOnline ? "Indisponível offline" : "Ex: João 3:16"}
                    onKeyDown={(e) => e.key === "Enter" && isOnline && handleSearchVerse()}
                    disabled={!isOnline}
                    className="flex-1 rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                  <button onClick={() => { if (isOnline) handleSearchVerse(); }} disabled={searchLoading || !isOnline} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {verseSuggestions.map((s) => (
                    <button key={s} onClick={() => { setSearchQuery(s); handleSearchVerse(s); }}
                      className="rounded-lg bg-secondary px-2 py-1 text-[10px] text-secondary-foreground hover:bg-muted"
                    >{s}</button>
                  ))}
                </div>
              </div>

              {verseText && (
                <div className="glass-card rounded-xl p-4">
                  <p className="font-serif text-sm italic leading-relaxed text-card-foreground">"{verseText}"</p>
                  <p className="mt-1 text-xs font-medium text-accent">— {reference}</p>
                </div>
              )}

              {/* AI / Theme toggle */}
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    if (isOnline) {
                      setUseAIImage(true);
                      toast({
                        title: "Geração de Cenários em Manutenção",
                        description: "A geração de imagens com Inteligência Artificial está temporariamente indisponível devido a uma manutenção severa planejada no motor do Google AI.",
                        variant: "destructive"
                      });
                    } else {
                      toast({ title: "Modo Offline", description: "Conecte-se à internet para usar a IA." });
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium border transition-all ${useAIImage ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground"} ${!isOnline ? "opacity-50 grayscale" : ""}`}
                ><Wand2 className="h-3.5 w-3.5" /> IA</button>
                <button onClick={() => setUseAIImage(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium border ${!useAIImage ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground"}`}
                ><Palette className="h-3.5 w-3.5" /> Cor</button>
              </div>

              {useAIImage && (
                <div className="glass-card rounded-xl p-4 border border-destructive/20 text-center space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent pointer-events-none" />
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive relative z-10">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-xs font-bold text-foreground">Geração IA em Manutenção</p>
                    <p className="text-[10.5px] text-muted-foreground leading-relaxed px-2">
                      Nosso motor artístico da IA está no momento passando por uma manutenção severa e aprimoramento técnico. A criação de novos cenários via IA está suspensa temporariamente por algumas semanas.
                    </p>
                  </div>
                  <div className="bg-secondary/60 border border-border/50 p-2 rounded-lg text-center relative z-10">
                    <p className="text-[9px] text-accent font-semibold uppercase tracking-wider">🔧 Manutenção em andamento</p>
                  </div>
                </div>
              )}

              {!useAIImage && (
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-1.5"><Palette className="h-4 w-4" /> Tema</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {themes.map((theme, i) => (
                        <button key={theme.name} onClick={() => { setActiveTheme(i); setUseCustomColor(false); }}
                          className={`flex flex-col items-center gap-0.5 rounded-lg p-1 border ${!useCustomColor && i === activeTheme ? "border-accent" : "border-transparent hover:border-border"}`}
                        >
                          <div className={`h-6 w-6 rounded-full ${theme.bg} ring-1 ring-white/10`} />
                          <span className="text-[7px] text-muted-foreground">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">🎨 Personalizada</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {presetColors.map((c) => (
                        <button key={c} onClick={() => { setCustomColor(c); setUseCustomColor(true); }}
                          className={`h-6 w-6 rounded-full border-2 transition-all ${useCustomColor && customColor === c ? "border-accent scale-110" : "border-transparent hover:border-border"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setUseCustomColor(true); }} className="h-8 w-8 cursor-pointer rounded border border-border" />
                      <input type="text" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setUseCustomColor(true); }} className="w-20 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {/* Font */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-1.5"><Type className="h-4 w-4" /> Fonte</p>
                  <div className="flex flex-wrap gap-1">
                    {fontOptions.map((f) => (
                      <button key={f.key} onClick={() => setActiveFont(f.key)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium border ${f.className} ${activeFont === f.key ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground"}`}
                      >{f.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Tamanho do Texto</p>
                    <span className="text-xs text-muted-foreground font-mono">{fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="14" 
                    max="64" 
                    step="1" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-accent bg-secondary h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Format + Export */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-1.5"><Image className="h-4 w-4" /> Formato</p>
                  <div className="flex gap-1.5">
                    {formats.map((f) => (
                      <button key={f.key} onClick={() => setActiveFormat(f.key)}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border ${activeFormat === f.key ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground"}`}
                      >{f.icon} {f.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground flex items-center gap-1.5"><Download className="h-4 w-4" /> Arquivo</p>
                  <div className="flex gap-1.5">
                    {exportFormats.map((f) => (
                      <button key={f.key} onClick={() => setExportFormat(f)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${exportFormat.key === f.key ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground"}`}
                      >{f.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {verseText && (
                <div className="flex gap-2">
                  <button onClick={handleDownload}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" /> Baixar {exportFormat.label}
                  </button>
                  <button onClick={handleShareImage}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Eye className="h-4 w-4 text-accent" /> Pré-visualização
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-4 overflow-hidden">
                {verseText ? (
                  <div ref={cardContainerRef} className="w-full">
                    {useAIImage && (aiImageUrl || aiImageLoading) ? (
                      <div
                        className={`relative overflow-hidden rounded-xl shadow-verse flex flex-col items-center justify-center p-6 sm:p-10 ${
                          activeFormat === "square" ? "aspect-square" : activeFormat === "story" ? "aspect-[9/16]" : "aspect-video"
                        }`}
                      >
                        {aiImageLoading ? (
                          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-10">
                            {/* Grid dourado */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                            {/* Laser Escaneador */}
                            <motion.div 
                              animate={{ y: ["0%", "450%"] }} 
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/80 to-transparent shadow-[0_0_10px_rgba(212,175,55,1)] z-20 pointer-events-none"
                            />
                            <div className="relative z-10 flex flex-col items-center">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-3">
                                <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                              </motion.div>
                              <span className="text-xs font-bold text-accent tracking-wide uppercase">Pintando Quadro Sagrado... ✨</span>
                              <span className="text-[10px] text-muted-foreground mt-1 max-w-[220px] leading-relaxed block">
                                Transformando suas palavras em uma obra prima visual em alta definição.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <Fragment>
                            <motion.img
                              key={aiImageUrl}
                              src={aiImageUrl}
                              alt="Background com IA"
                              className="absolute inset-0 w-full h-full object-cover"
                              initial={{ opacity: 0, scale: 1.05, filter: "blur(18px)" }}
                              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                            {/* Varredura Final */}
                            <motion.div 
                              initial={{ y: "-100%" }}
                              animate={{ y: "150%" }}
                              transition={{ duration: 1.4, ease: "easeOut" }}
                              className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_rgba(212,175,55,1)] z-10 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/45" />
                          </Fragment>
                        )}

                        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md text-primary-foreground">
                          <div className="mb-4 flex justify-center"><div className="h-px w-12 bg-primary-foreground/50" /></div>
                          <blockquote 
                            className={`leading-relaxed text-center italic ${selectedFont?.className || "font-serif"}`}
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            "{verseText}"
                          </blockquote>
                          <div className="mt-4 flex justify-center"><div className="h-px w-12 bg-primary-foreground/50" /></div>
                          <p className="mt-3 text-center text-xs font-sans font-medium opacity-80 tracking-wider uppercase">{reference}</p>
                        </div>
                      </div>
                    ) : (
                      <div style={useCustomColor ? { backgroundColor: customColor } : undefined}>
                        <VerseCard 
                          text={verseText} 
                          reference={reference} 
                          theme={useCustomColor ? { ...currentTheme, bg: "" } : currentTheme} 
                          format={activeFormat} 
                          animate={false} 
                          fontSize={fontSize}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 p-8 ${
                    activeFormat === "square" ? "aspect-square" : activeFormat === "story" ? "aspect-[9/16]" : "aspect-video"
                  }`}>
                    <Sparkles className="mb-2 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Busque um versículo para começar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePage;
