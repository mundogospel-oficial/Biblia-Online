import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  ChevronDown,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  Type,
  Palette,
  Keyboard,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Presentation,
  MoreHorizontal,
  Search
} from "lucide-react";
import {
  bibleBooks,
  fetchChapter,
  getBookByAbbrev,
  translations,
  type VerseData,
  type BibleBook
} from "@/lib/bibleData";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useLanguage } from "@/contexts/LanguageContext";

export interface PulpitModeProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookAbbrev: string;
  initialChapter: number;
  initialVerseNumber?: number;
  translation?: string;
  onTranslationChange?: (newTranslation: string) => void;
  onNavigateChapter?: (abbrev: string, chapter: number) => void;
}

type ThemeMode = "app_blue" | "black" | "midnight";

interface ThemeStyles {
  bg: string;
  cardBg: string;
  text: string;
  accent: string;
  subtext: string;
  border: string;
  buttonBg: string;
  buttonHover: string;
}

const THEMES: Record<ThemeMode, ThemeStyles> = {
  app_blue: {
    bg: "bg-background bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.15),transparent_70%)]",
    cardBg: "glass-card border-border/50",
    text: "text-foreground",
    accent: "text-primary",
    subtext: "text-muted-foreground",
    border: "border-border/50",
    buttonBg: "bg-secondary/60 hover:bg-secondary/90 text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/40",
    buttonHover: "hover:bg-secondary hover:border-primary/40 hover:text-foreground",
  },
  black: {
    bg: "bg-[#030303]",
    cardBg: "bg-[#0f0f12]/90 backdrop-blur-2xl border-white/10",
    text: "text-[#f8fafc]",
    accent: "text-sky-400",
    subtext: "text-[#94a3b8]",
    border: "border-white/10",
    buttonBg: "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 hover:border-white/25",
    buttonHover: "hover:bg-white/15 hover:border-white/25",
  },
  midnight: {
    bg: "bg-[#040915]",
    cardBg: "bg-[#081226]/90 backdrop-blur-2xl border-blue-500/20",
    text: "text-[#e2e8f0]",
    accent: "text-blue-400",
    subtext: "text-[#8da2c0]",
    border: "border-blue-500/20",
    buttonBg: "bg-blue-950/50 hover:bg-blue-900/60 text-blue-200 hover:text-white border border-blue-500/20 hover:border-blue-400/40",
    buttonHover: "hover:bg-blue-900/60 hover:border-blue-400/40",
  },
};

export const PulpitMode = ({
  isOpen,
  onClose,
  initialBookAbbrev,
  initialChapter,
  initialVerseNumber = 1,
  translation = "almeida",
  onTranslationChange,
  onNavigateChapter,
}: PulpitModeProps) => {
  const { canAccess } = useFeatureGate();
  const { t, language } = useLanguage();
  const [currentBookAbbrev, setCurrentBookAbbrev] = useState(initialBookAbbrev);
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [currentTranslation, setCurrentTranslation] = useState(translation || (language === "en" ? "kjv" : "almeida"));
  const [showTranslationMenu, setShowTranslationMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [bookSearchFilter, setBookSearchFilter] = useState("");
  const [bookTestamentFilter, setBookTestamentFilter] = useState<"all" | "old" | "new">("all");

  const [verses, setVerses] = useState<VerseData[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Controles de apresentação
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(8); // segundos
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(26); // pixels
  const [isSerif, setIsSerif] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("app_blue");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const book: BibleBook | undefined = getBookByAbbrev(currentBookAbbrev);

  // Sincroniza estado quando reabre
  useEffect(() => {
    if (isOpen) {
      setCurrentBookAbbrev(initialBookAbbrev);
      setCurrentChapter(initialChapter);
    }
  }, [isOpen, initialBookAbbrev, initialChapter]);

  useEffect(() => {
    if (translation) {
      setCurrentTranslation(translation);
    }
  }, [translation]);

  // Centraliza o ponto do versículo atual suavemente
  useEffect(() => {
    const activeDot = document.getElementById(`pulpit-dot-${currentVerseIndex}`);
    if (activeDot) {
      activeDot.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentVerseIndex]);

  // Carrega versículos do capítulo
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    setLoading(true);

    fetchChapter(currentBookAbbrev, currentChapter, currentTranslation)
      .then((data) => {
        if (!isSubscribed) return;
        setVerses(data.verses);
        setLoading(false);

        // Se tiver initialVerseNumber no primeiro carregamento
        if (initialVerseNumber && currentChapter === initialChapter && currentBookAbbrev === initialBookAbbrev) {
          const targetIndex = data.verses.findIndex((v) => v.verse === initialVerseNumber);
          setCurrentVerseIndex(targetIndex >= 0 ? targetIndex : 0);
        } else {
          setCurrentVerseIndex(0);
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error("[PulpitMode] Erro ao carregar capítulo:", err);
        setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, currentBookAbbrev, currentChapter, currentTranslation, initialChapter, initialVerseNumber, initialBookAbbrev]);

  // Avança para o próximo versículo com suporte a avanço de capítulos no livro
  const handleNextVerse = useCallback(() => {
    setProgress(0);
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex((prev) => prev + 1);
    } else {
      // Se chegou no último versículo do capítulo atual, avança para o próximo capítulo se houver
      if (book && currentChapter < book.chapters) {
        const nextChapter = currentChapter + 1;
        setCurrentChapter(nextChapter);
        onNavigateChapter?.(currentBookAbbrev, nextChapter);
      } else {
        // Se era o último versículo do último capítulo do livro, pausa
        setIsPlaying(false);
      }
    }
  }, [currentVerseIndex, verses.length, book, currentChapter, currentBookAbbrev, onNavigateChapter]);

  // Retorna para o versículo anterior com suporte a recuo de capítulos
  const handlePrevVerse = useCallback(() => {
    setProgress(0);
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex((prev) => prev - 1);
    } else {
      // Se está no primeiro versículo e pode recuar para o capítulo anterior
      if (currentChapter > 1) {
        const prevChapter = currentChapter - 1;
        setCurrentChapter(prevChapter);
        onNavigateChapter?.(currentBookAbbrev, prevChapter);
      }
    }
  }, [currentVerseIndex, currentChapter, currentBookAbbrev, onNavigateChapter]);

  // Pular 5 versículos para frente
  const handleJumpForward = useCallback(() => {
    setProgress(0);
    if (currentVerseIndex + 5 < verses.length) {
      setCurrentVerseIndex((prev) => prev + 5);
    } else {
      handleNextVerse();
    }
  }, [currentVerseIndex, verses.length, handleNextVerse]);

  // Pular 5 versículos para trás
  const handleJumpBackward = useCallback(() => {
    setProgress(0);
    if (currentVerseIndex - 5 >= 0) {
      setCurrentVerseIndex((prev) => prev - 5);
    } else {
      setCurrentVerseIndex(0);
    }
  }, [currentVerseIndex]);

  // Alternar Play / Pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setProgress(0);
  }, []);

  // Alternar Tela Cheia nativa
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Monitora evento de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Gerenciamento de Autoplay e Barra de Progresso
  useEffect(() => {
    if (!isOpen || !isPlaying || loading || verses.length === 0) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(0);
      return;
    }

    const stepMs = 100;
    const totalSteps = (autoPlayInterval * 1000) / stepMs;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / totalSteps;
        if (next >= 100) {
          handleNextVerse();
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, isPlaying, loading, verses.length, autoPlayInterval, handleNextVerse]);

  // Travar rolagem da página ao abrir o modo púlpito (eliminando barras de rolagem da janela)
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, [isOpen]);

  // Auto-ocultação dos controles por inatividade do mouse
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    hideTimerRef.current = setTimeout(() => {
      // Se não estiver em modal de ajuda ou seletor, oculta os controles
      if (!showShortcutsModal && !showBookSelector) {
        setControlsVisible(false);
      }
    }, 3500);
  }, [showShortcutsModal, showBookSelector]);

  // Listener para teclado (Atalhos do Usuário)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Se o usuário estiver interagindo com um input ou select, não interceptar
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }

      // Ao navegar pelo teclado, NÃO forçar a aparição dos controles para não poluir o telão
      if (controlsVisible && hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (!showShortcutsModal && !showBookSelector) {
            setControlsVisible(false);
          }
        }, 3500);
      }

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case "Enter":
          e.preventDefault();
          handleNextVerse();
          break;

        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          handlePrevVerse();
          break;

        case " ": // Barra de espaço
          e.preventDefault();
          togglePlay();
          break;

        case "p":
        case "P":
          e.preventDefault();
          togglePlay();
          break;

        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;

        case "+":
        case "=":
          e.preventDefault();
          setFontSize((prev) => Math.min(prev + 4, 68));
          break;

        case "-":
        case "_":
          e.preventDefault();
          setFontSize((prev) => Math.max(prev - 4, 22));
          break;

        case "t":
        case "T": {
          e.preventDefault();
          const themeOrder: ThemeMode[] = ["app_blue", "black", "midnight"];
          const nextIndex = (themeOrder.indexOf(theme) + 1) % themeOrder.length;
          setTheme(themeOrder[nextIndex]);
          break;
        }

        case "s":
        case "S":
          e.preventDefault();
          setIsSerif((prev) => !prev);
          break;

        case "h":
        case "H":
        case "?":
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;

        case "Escape":
          e.preventDefault();
          if (showShortcutsModal) {
            setShowShortcutsModal(false);
          } else if (showBookSelector) {
            setShowBookSelector(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;

        case "Home":
          e.preventDefault();
          setCurrentVerseIndex(0);
          setProgress(0);
          break;

        case "End":
          e.preventDefault();
          setCurrentVerseIndex(Math.max(0, verses.length - 1));
          setProgress(0);
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    controlsVisible,
    handleNextVerse,
    handlePrevVerse,
    togglePlay,
    toggleFullscreen,
    theme,
    showShortcutsModal,
    showBookSelector,
    verses.length,
    onClose,
  ]);

  // Copiar versículo atual
  const currentVerse = verses[currentVerseIndex];
  const handleCopyCurrentVerse = () => {
    if (!currentVerse || !book) return;
    const textToCopy = `"${currentVerse.text.trim()}" — ${book.name} ${currentChapter}:${currentVerse.verse}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !canAccess("beta")) return null;

  const currentTheme = THEMES[theme];

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text}`}
      style={{ touchAction: "manipulation" }}
    >
      {/* ── CABEÇALHO SUPERIOR (ESTILO MENU HOME: GLASS-CARD) ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className={`relative z-40 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-3.5 min-h-[58px] sm:min-h-[62px] backdrop-blur-2xl glass-card !rounded-none border-b border-border/50 safe-area-top shadow-sm ${
          controlsVisible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Lado Esquerdo: Identificação e Seletor Rápido de Livro no Estilo Menu Home */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm select-none">
            <Presentation className="h-3.5 w-3.5 text-primary-foreground" />
            <span>{t("present")}</span>
            <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-white/20 text-white tracking-wider leading-none">
              Beta
            </span>
          </div>
          <button
            onClick={() => setShowBookSelector((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium bg-secondary/60 hover:bg-secondary/90 border border-border/50 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={t("present_change_book_chapter")}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{language === "en" ? (book?.nameEn || book?.name) : book?.name} {currentChapter}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
          </button>
        </div>

        {/* Centro: Indicador Discreto do Versículo e Seletor Clicável de Versão no Estilo Menu Home */}
        <div className="flex items-center gap-2 text-xs relative">
          <span className="font-semibold text-primary">
            {t("present_verse_of")} {currentVerse ? currentVerse.verse : "-"} {t("present_of")} {verses.length}
          </span>
          <span className="text-muted-foreground/40">•</span>

          {/* Botão Clicável para mudar de versão (Pill Menu Home) */}
          <div className="relative">
            <button
              onClick={() => setShowTranslationMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary/90 border border-border/50 hover:border-primary/40 text-[11px] font-semibold text-foreground hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Clique para mudar a versão da Bíblia"
            >
              <span className="uppercase tracking-wider">{currentTranslation}</span>
              <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${showTranslationMenu ? "rotate-180 text-primary" : ""}`} />
            </button>

            {/* Menu Dropdown de Versões (Opaco e de Alto Contraste) */}
            <AnimatePresence>
              {showTranslationMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTranslationMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 rounded-2xl border border-white/15 bg-[#0d1629] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] space-y-1"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/10">
                      {language === "en" ? "Bible Version" : "Versão da Bíblia"}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                      {translations.map((t) => {
                        const isSelected = t.id === currentTranslation;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setCurrentTranslation(t.id);
                              onTranslationChange?.(t.id);
                              setShowTranslationMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-foreground/80 hover:bg-white/10 hover:text-foreground"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="uppercase font-bold text-[11px]">{t.id}</span>
                              <span className="text-[10px] opacity-75 truncate max-w-[180px]">{t.name}</span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas no Estilo Menu Home (Pills / Círculos) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão Copiar */}
          <button
            onClick={handleCopyCurrentVerse}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-secondary/60 hover:bg-secondary/90 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
            title="Copiar versículo"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Atalhos de Teclado */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-secondary/60 hover:bg-secondary/90 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
            title="Comandos do Teclado"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          {/* Alternador de Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-secondary/60 hover:bg-secondary/90 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
            title={isFullscreen ? t("present_exit_fullscreen") : t("present_fullscreen")}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* Botão Fechar Apresentação */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 hover:border-destructive/60 bg-secondary/60 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110 active:scale-95 ml-1 cursor-pointer shadow-xs"
            title={t("present_exit_esc")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.header>

      {/* ── ÁREA CENTRAL DE EXIBIÇÃO DO VERSÍCULO (LIMPA & MAJESTOSA) ── */}
      <main className="relative flex-1 flex items-center justify-center px-6 sm:px-20 md:px-28 py-8 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
            <p className={`text-sm font-medium ${currentTheme.subtext}`}>Carregando Palavra Sagrada...</p>
          </div>
        ) : !currentVerse ? (
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Nenhum versículo encontrado.</p>
            <button
              onClick={() => setCurrentVerseIndex(0)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
            >
              Recarregar
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentBookAbbrev}-${currentChapter}-${currentVerse.verse}`}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-5xl w-full text-center space-y-4 sm:space-y-6 my-auto"
            >
              {/* Texto do versículo em destaque limpo e bem proporcionado */}
              <div className="relative px-4 sm:px-8">
                <p
                  className={`leading-[1.6] tracking-normal font-normal transition-all ${
                    isSerif ? "font-serif" : "font-sans"
                  } text-white/95 drop-shadow-sm`}
                  style={{
                    fontSize: `${fontSize}px`,
                    textWrap: "balance" as any,
                  }}
                >
                  "{currentVerse.text.trim()}"
                </p>
              </div>

              {/* Referência Bíblica Limpa */}
              <div className="space-y-1 pt-1">
                <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-sky-400">
                  {book?.name} {currentChapter}:{currentVerse.verse}
                </h2>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── BARRA DE CONTROLES INFERIOR (ESTILO MENU HOME: GLASS-CARD & PILLS) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        className="relative z-40 pb-4 px-4 flex flex-col items-center pointer-events-none"
      >
        <div
          className="pointer-events-auto flex flex-col items-center gap-1.5 px-6 sm:px-10 py-2 sm:py-2.5 rounded-full backdrop-blur-2xl glass-card border border-border/50 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_24px_hsl(var(--primary)/0.1)] w-auto min-w-[320px] sm:min-w-[500px] md:min-w-[620px] max-w-[94vw] transition-all duration-300 hover:border-primary/40"
        >
          {/* Linha de Slides (Dots) dos Versículos no Estilo Menu Home */}
          <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 w-full max-w-[85vw] sm:max-w-xl md:max-w-2xl overflow-x-auto no-scrollbar scroll-smooth">
            {verses.map((v, idx) => {
              const isActive = idx === currentVerseIndex;
              return (
                <button
                  key={v.verse}
                  id={`pulpit-dot-${idx}`}
                  onClick={() => {
                    setCurrentVerseIndex(idx);
                    setProgress(0);
                  }}
                  className={`transition-all duration-200 rounded-full flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "w-6 h-1.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)] scale-105"
                      : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-primary/70 hover:scale-150"
                  }`}
                  title={`Ir para Versículo ${v.verse}`}
                />
              );
            })}
          </div>

          {/* Controles Circulares Centrais e Botão de 3 Pontinhos no Estilo Menu Home */}
          <div className="flex items-center gap-2.5 sm:gap-3 relative">
            {/* Botão Anterior */}
            <button
              onClick={handlePrevVerse}
              disabled={currentVerseIndex === 0 && currentChapter === 1}
              className="h-8.5 w-8.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-90 shadow-xs disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
              title="Versículo Anterior (←)"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.2]" />
            </button>

            {/* Botão Central Play / Pause Circular em Destaque no Estilo Menu Home */}
            <button
              onClick={togglePlay}
              className={`h-9.5 w-9.5 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                isPlaying
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.6)] ring-2 ring-primary/40"
                  : "bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary-foreground hover:text-white shadow-xs hover:shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
              }`}
              title={isPlaying ? "Pausar reprodução (Espaço)" : "Reproduzir automaticamente (Espaço)"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Botão Próximo */}
            <button
              onClick={handleNextVerse}
              className="h-8.5 w-8.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-90 shadow-xs cursor-pointer"
              title="Próximo Versículo (→)"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.2]" />
            </button>

            {/* Botão de 3 Pontinhos para Outras Opções */}
            <div className="relative ml-1 sm:ml-1.5">
              <button
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className={`h-8 w-8 sm:h-8.5 sm:w-8.5 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${
                  showMoreMenu
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_14px_hsl(var(--primary)/0.5)]"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/40 shadow-xs"
                }`}
                title="Mais Opções de Apresentação"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {/* Menu Flutuante Popover das Outras Opções (Opaco e de Alto Contraste) */}
              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-3 z-50 w-72 sm:w-80 rounded-2xl border border-white/15 bg-[#0d1629] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.95)] space-y-4 text-foreground"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          {t("present_options")}
                        </span>
                        <button
                          onClick={() => setShowMoreMenu(false)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-full cursor-pointer hover:bg-white/10 transition-all duration-150 hover:scale-105"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Ajuste de Tamanho de Fonte */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-foreground">
                          <span>{t("present_font_size")}</span>
                          <span className="font-mono text-primary font-bold">{fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFontSize((prev) => Math.max(prev - 2, 18))}
                            className="flex-1 py-1.5 px-2 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 hover:scale-105 shadow-xs"
                          >
                            <ZoomOut className="h-3.5 w-3.5" />
                            <span>{language === "en" ? "Smaller (A-)" : "Menor (A-)"}</span>
                          </button>
                          <button
                            onClick={() => setFontSize((prev) => Math.min(prev + 2, 52))}
                            className="flex-1 py-1.5 px-2 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 hover:scale-105 shadow-xs"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                            <span>{language === "en" ? "Larger (A+)" : "Maior (A+)"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Estilo da Fonte (Serifa vs Sans) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-foreground">
                          <span>{language === "en" ? "Typography Style" : "Estilo da Tipografia"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setIsSerif(true)}
                            className={`py-1.5 px-2 rounded-full text-xs font-serif font-semibold border transition-all duration-150 hover:scale-105 cursor-pointer ${
                              isSerif
                                ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                                : "bg-slate-800/90 hover:bg-slate-700 border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {language === "en" ? "Serif" : "Com Serifa"}
                          </button>
                          <button
                            onClick={() => setIsSerif(false)}
                            className={`py-1.5 px-2 rounded-full text-xs font-sans font-semibold border transition-all duration-150 hover:scale-105 cursor-pointer ${
                              !isSerif
                                ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                                : "bg-slate-800/90 hover:bg-slate-700 border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {language === "en" ? "Sans-Serif" : "Sem Serifa"}
                          </button>
                        </div>
                      </div>

                      {/* Temas de Cor */}
                      <div className="space-y-1.5">
                        <span className="text-xs text-foreground">{t("present_screen_theme")}</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["app_blue", "black", "midnight"] as ThemeMode[]).map((tMode) => {
                            const labelMap: Record<ThemeMode, string> = {
                              app_blue: t("present_theme_app"),
                              black: t("present_theme_dark"),
                              midnight: t("present_theme_emerald"),
                            };
                            const isSelected = theme === tMode;
                            return (
                              <button
                                key={tMode}
                                onClick={() => setTheme(tMode)}
                                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-xs text-center transition-all duration-150 hover:scale-105 cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/20 border-primary text-foreground font-semibold shadow-xs ring-1 ring-primary/50"
                                    : "bg-slate-800/80 border-white/10 text-muted-foreground hover:bg-slate-700 hover:text-foreground hover:border-primary/30"
                                }`}
                              >
                                <span
                                  className={`h-3.5 w-3.5 rounded-full border flex-shrink-0 transition-transform ${
                                    tMode === "app_blue"
                                      ? "bg-[#0b1424] border-primary"
                                      : tMode === "black"
                                      ? "bg-black border-white/40"
                                      : "bg-[#040915] border-blue-500/40"
                                  }`}
                                />
                                <span className="text-[10px] truncate max-w-full font-medium">{labelMap[tMode]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Velocidade de Reprodução Automática */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-foreground">
                          <span>{language === "en" ? "Slide Duration" : "Tempo por Slide"}</span>
                          <span className="font-mono text-primary font-bold">{autoPlayInterval}s</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[5, 8, 12, 15].map((sec) => (
                            <button
                              key={sec}
                              onClick={() => {
                                setAutoPlayInterval(sec);
                                setProgress(0);
                              }}
                              className={`py-1 rounded-full text-xs font-medium border transition-all duration-150 hover:scale-105 cursor-pointer ${
                                autoPlayInterval === sec
                                  ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                                  : "bg-slate-800/90 hover:bg-slate-700 border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Navegação Rápida +/- 5 versículos */}
                      <div className="space-y-1.5 pt-1 border-t border-white/10">
                        <span className="text-[11px] text-muted-foreground">{language === "en" ? "Skip verses" : "Pular versículos"}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleJumpBackward}
                            disabled={currentVerseIndex === 0}
                            className="py-1.5 px-2 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer transition-all duration-150 hover:scale-105 shadow-xs"
                          >
                            <ChevronFirst className="h-3.5 w-3.5" />
                            <span>{language === "en" ? "-5 Verses" : "-5 Versículos"}</span>
                          </button>
                          <button
                            onClick={handleJumpForward}
                            className="py-1.5 px-2 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 hover:scale-105 shadow-xs"
                          >
                            <span>{language === "en" ? "+5 Verses" : "+5 Versículos"}</span>
                            <ChevronLast className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── BARRA DE TEMPO (PROGRESSO) ABAIXO DOS BOTÕES DE PAUSE E SETAS ── */}
          <div
            className="w-full max-w-[180px] sm:max-w-[260px] md:max-w-[320px] flex items-center gap-2 px-1 pt-0.5 pb-0 group/time cursor-pointer"
            title={isPlaying ? `Reproduzindo automaticamente (${autoPlayInterval}s)` : "Pausado (Espaço para reproduzir)"}
            onClick={togglePlay}
          >
            <div className="relative flex-1 h-[2.5px] group-hover/time:h-[3.5px] bg-secondary/80 border border-border/50 rounded-full overflow-hidden transition-all duration-200">
              <motion.div
                className="h-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            {isPlaying && (
              <span className="text-[9px] font-mono text-primary font-medium tabular-nums flex-shrink-0 tracking-wide">
                {Math.round((progress / 100) * autoPlayInterval)}s / {autoPlayInterval}s
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── MODAL DE ATALHOS DE TECLADO (ESTILO MENU HOME: GLASS-CARD) ── */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d1629] text-foreground p-6 shadow-[0_24px_60px_rgba(0,0,0,0.95)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Keyboard className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base tracking-wide text-foreground">
                    {language === "en" ? "Keyboard Shortcuts" : "Comandos pelo Teclado"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-150 hover:scale-105 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Next verse" : "Próximo versículo"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    {language === "en" ? "→ or Enter" : "→ ou Enter"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Previous verse" : "Versículo anterior"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    {language === "en" ? "← or Backspace" : "← ou Backspace"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">Play / Pause</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    {language === "en" ? "Space or P" : "Espaço ou P"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Fullscreen" : "Tela Cheia"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    F
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Larger font" : "Aumentar letra"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    {language === "en" ? "+ or =" : "+ ou ="}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Smaller font" : "Diminuir letra"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    {language === "en" ? "- or _" : "- ou _"}
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Toggle theme" : "Alternar tema"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    T
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Serif / Sans font" : "Fonte Serifa/Sans"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    S
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "First verse" : "Primeiro versículo"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    Home
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-white/10 transition-colors hover:border-primary/40">
                  <span className="text-muted-foreground">{language === "en" ? "Exit" : "Sair"}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-background/80 border border-white/10 font-mono text-primary font-semibold">
                    Esc
                  </kbd>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all duration-150 hover:scale-[1.02] active:scale-98 cursor-pointer shadow-md"
                >
                  {language === "en" ? "Got it" : "Entendido"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL SELETOR RÁPIDO DE LIVRO E CAPÍTULO (O PACO E ALTO CONTRASTE) ── */}
      <AnimatePresence>
        {showBookSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl border border-white/15 bg-[#0d1629] text-foreground shadow-[0_24px_60px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {/* Header Fixo */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base tracking-wide text-foreground">{t("present_select_book_chapter")}</h3>
                </div>
                <button
                  onClick={() => setShowBookSelector(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150 hover:scale-105 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corpo com scroll contido e customizado */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 min-h-0">
                {/* Seletor Customizado de Livro (com filtros, busca e scrollbar estilizada) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">{t("books")}:</label>
                    <span className="text-[11px] text-primary font-semibold">
                      {language === "en" ? (book?.nameEn || book?.name) : book?.name} ({book?.chapters} {t("chapters_count")})
                    </span>
                  </div>

                  {/* Filtros de Testamento e Campo de Busca */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={bookSearchFilter}
                        onChange={(e) => setBookSearchFilter(e.target.value)}
                        placeholder={language === "en" ? "Search book (e.g. Genesis, Psalms, Matthew)..." : "Pesquisar livro (ex: Gênesis, Salmos, Mateus)..."}
                        className="w-full rounded-full border border-border/50 bg-secondary/60 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                      {bookSearchFilter && (
                        <button
                          onClick={() => setBookSearchFilter("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/50">
                      {(["all", "old", "new"] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setBookTestamentFilter(filter)}
                          className={`flex-1 py-1 rounded-full text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                            bookTestamentFilter === filter
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {filter === "all" ? (language === "en" ? "All (66)" : "Todos (66)") : filter === "old" ? (language === "en" ? "Old (39)" : "Antigo (39)") : (language === "en" ? "New (27)" : "Novo (27)")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Livros com barra de rolagem customizada */}
                  <div className="max-h-44 overflow-y-auto custom-scrollbar pr-1.5 rounded-xl border border-border/50 bg-secondary/40 p-1.5 space-y-1">
                    {bibleBooks
                      .filter((b) => {
                        if (bookTestamentFilter !== "all" && b.testament !== bookTestamentFilter) return false;
                        if (!bookSearchFilter.trim()) return true;
                        const query = bookSearchFilter.toLowerCase();
                        return (
                          b.name.toLowerCase().includes(query) ||
                          (b.nameEn && b.nameEn.toLowerCase().includes(query)) ||
                          b.abbrev.toLowerCase().includes(query)
                        );
                      })
                      .map((b) => {
                        const isSelected = b.abbrev === currentBookAbbrev;
                        const bookDisplayName = language === "en" ? (b.nameEn || b.name) : b.name;
                        return (
                          <button
                            key={b.abbrev}
                            onClick={() => {
                              setCurrentBookAbbrev(b.abbrev);
                              setCurrentChapter(1);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:scale-[1.01] cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : "bg-secondary/60 hover:bg-secondary text-foreground hover:text-primary border border-border/40 hover:border-primary/40"
                            }`}
                          >
                            <span className="font-medium">{bookDisplayName}</span>
                            <span className={`text-[10px] ${isSelected ? "text-primary-foreground/90 font-medium" : "text-muted-foreground"}`}>
                              {b.chapters} {b.chapters === 1 ? (language === "en" ? "ch." : "cap.") : (language === "en" ? "chapters" : "capítulos")}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Grade de Capítulos do Livro */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      {t("present_select_chapter")}
                    </label>
                    <span className="text-[11px] text-primary font-semibold">
                      {t("present_current_chapter")} {currentChapter}
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar pr-1.5 rounded-xl border border-border/50 bg-secondary/40 p-1.5">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                      {Array.from({ length: book?.chapters || 1 }, (_, i) => i + 1).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCurrentChapter(c);
                            onNavigateChapter?.(currentBookAbbrev, c);
                            setShowBookSelector(false);
                          }}
                          className={`h-9 rounded-xl text-xs font-bold transition-all duration-150 hover:scale-110 cursor-pointer ${
                            c === currentChapter
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105 font-bold"
                              : "bg-secondary/60 hover:bg-secondary text-foreground hover:text-primary border border-border/50 hover:border-primary/40"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé Fixo */}
              <div className="border-t border-border/50 px-6 py-3 flex-shrink-0 bg-secondary/20">
                <button
                  onClick={() => setShowBookSelector(false)}
                  className="w-full py-2 rounded-full bg-secondary/70 hover:bg-secondary text-foreground hover:text-primary border border-border/50 hover:border-primary/40 font-medium text-xs transition-all duration-150 hover:scale-[1.01] active:scale-98 cursor-pointer shadow-xs"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
