import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchChapter, getBookByAbbrev, translations, type VerseData } from "@/lib/bibleData";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/favorites";
import {
  getHighlight, setHighlight, removeHighlight, highlightColors,
  getNote, setNote, type HighlightColor,
} from "@/lib/annotations";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Sparkles, Loader2, Heart,
  Highlighter, StickyNote, X, Languages, BookOpen, WifiOff, Download, Share2, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DICT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-chat`;

import { translateVersesAI, checkAndIncrementQuota } from "@/services/translationService";
import { askDictionaryAI } from "@/services/aiService";
import { checkAndIncrementUsage } from "@/services/usageService";
import { shareBibleText } from "@/lib/downloadUtils";

const Reader = () => {
  const { abbrev, chapter } = useParams<{ abbrev: string; chapter: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [verses, setVerses] = useState<VerseData[]>([]);
  const [bilingualVerses, setBilingualVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bilingualLoading, setBilingualLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [favSet, setFavSet] = useState<Set<number>>(new Set());
  const [translation, setTranslation] = useState("almeida");
  const [bilingual, setBilingual] = useState(false);
  const [bilingualLimitReached, setBilingualLimitReached] = useState(false);
  const [dictLimitReached, setDictLimitReached] = useState(false);
  
  // Controle de paginação suave/on-demand para carregar capítulos por demanda
  const [visibleLimit, setVisibleLimit] = useState(25);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState<number | null>(null);
  const [highlightsMap, setHighlightsMap] = useState<Record<number, HighlightColor>>({});
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const [dictVerse, setDictVerse] = useState<number | null>(null);
  const [dictContent, setDictContent] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictMode, setDictMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const chapterStripRef = useRef<HTMLDivElement | null>(null);

  const scrollStrip = (direction: 'left' | 'right') => {
    if (chapterStripRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      chapterStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

  const book = getBookByAbbrev(abbrev || "");
  const chapterNum = parseInt(chapter || "1");

  useEffect(() => {
    if (chapterStripRef.current) {
      const activeEl = chapterStripRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [chapterNum, abbrev]);

  const loadHighlightsAndNotes = useCallback(() => {
    if (!abbrev) return;
    const hMap: Record<number, HighlightColor> = {};
    const nMap: Record<number, string> = {};
    for (let i = 1; i <= 200; i++) {
      const id = `${abbrev}:${chapterNum}:${i}`;
      const h = getHighlight(id);
      if (h) hMap[i] = h.color;
      const n = getNote(id);
      if (n) nMap[i] = n.text;
    }
    setHighlightsMap(hMap);
    setNotesMap(nMap);
  }, [abbrev, chapterNum]);

  useEffect(() => {
    if (!abbrev || !chapter) return;
    setLoading(true);
    setError("");
    setSelectedVerses(new Set());
    setActiveVerse(null);
    setShowNoteInput(null);
    setDictVerse(null);
    setBilingualVerses([]);
    setBilingualLimitReached(false);
    setDictLimitReached(false);
    setVisibleLimit(25); // Reseta a paginação suave ao mudar de capítulo ou livro

    fetchChapter(abbrev, parseInt(chapter), translation)
      .then((primary) => {
        setVerses(primary.verses);
      })
      .catch((err: any) => {
        if (err.message && err.message.includes('OFFLINE_DATA_MISSING')) {
          setError("OFFLINE_MODE");
        } else {
          setError("Erro ao carregar o capítulo. Tente novamente.");
        }
      })
      .finally(() => setLoading(false));

    loadHighlightsAndNotes();
  }, [abbrev, chapter, translation, loadHighlightsAndNotes]);

  // Observador de interseção para carregar mais versículos de forma incremental (evita micro-lags em dispositivos móveis)
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || visibleLimit >= verses.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((prev) => Math.min(prev + 25, verses.length));
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(currentLoader);
    return () => {
      observer.unobserve(currentLoader);
    };
  }, [visibleLimit, verses.length]);

  useEffect(() => {
    if (!bilingual || !verses.length) {
      setBilingualVerses([]);
      return;
    }

    if (!isOnline) {
      setBilingualVerses([]);
      setBilingualLoading(false);
      return;
    }

    setBilingualLoading(true);
    setBilingualLimitReached(false);

    const translateVerses = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({ title: "Faça login para usar o modo bilíngue" });
          setBilingual(false);
          setBilingualLoading(false);
          return;
        }

        // Verificar e Incrementar Cota
        const quotaResult = await checkAndIncrementQuota(session.user.id);
        if (!quotaResult.success) {
          setBilingualLimitReached(true);
          setBilingualLoading(false);
          return;
        }

        if (quotaResult.remaining !== undefined) {
          toast({ 
            title: "Capítulo Traduzido", 
            description: `Você ainda pode traduzir mais ${quotaResult.remaining} capítulos hoje.` 
          });
        }

        // Determinar o idioma de destino com base na versão atual
        const selectedTranslation = translations.find(t => t.id === translation);
        const currentLang = selectedTranslation?.language || 'pt';
        const targetLang = currentLang === 'pt' ? 'en' : 'pt';

        const allVerses = verses.map((v) => ({ verse: v.verse, text: v.text.trim() }));
        const BATCH_SIZE = 5;
        const batches = [];
        for (let i = 0; i < allVerses.length; i += BATCH_SIZE) {
          batches.push(allVerses.slice(i, i + BATCH_SIZE));
        }

        let accumulated: VerseData[] = [];

        await Promise.all(
          batches.map(async (batch) => {
            try {
              const results = await translateVersesAI(batch, targetLang as 'en' | 'pt');
              const formatted: VerseData[] = results.map((t: any) => ({
                book_name: verses[0]?.book_name || "",
                chapter: parseInt(chapter || "1"),
                verse: t.verse,
                text: t.text,
              }));

              accumulated = [...accumulated, ...formatted];

              // Atualiza a interface em tempo real à medida que cada mini-lote de 5 versículos é traduzido
              setBilingualVerses((prev) => {
                const map = new Map(prev.map((v) => [v.verse, v]));
                formatted.forEach((v) => map.set(v.verse, v));
                return Array.from(map.values()).sort((a, b) => a.verse - b.verse);
              });
            } catch (err) {
              console.warn("Erro ao traduzir lote de versículos:", err);
            }
          })
        );

        if (accumulated.length === 0) {
          throw new Error("Não foi possível traduzir os versículos. Tente novamente.");
        }
      } catch (e: any) {
        toast({ title: "Erro na tradução", description: "Tente novamente mais tarde.", variant: "destructive" });
        setBilingual(false);
      } finally {
        setBilingualLoading(false);
      }
    };

    translateVerses();
  }, [bilingual, verses, abbrev, chapter, translation, toast, isOnline]);

  const toggleVerse = (verseNum: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const handleHighlight = (verseNum: number, color: HighlightColor) => {
    const id = `${abbrev}:${chapterNum}:${verseNum}`;
    const verseText = verses.find(v => v.verse === verseNum)?.text.trim() || "";
    const reference = `${book?.name} ${chapterNum}:${verseNum}`;

    if (highlightsMap[verseNum] === color) {
      removeHighlight(id);
      removeFavorite(id, "markings");
      setHighlightsMap((p) => { const n = { ...p }; delete n[verseNum]; return n; });
    } else {
      setHighlight(id, color);
      addFavorite({ id, text: verseText, reference }, "markings");
      setHighlightsMap((p) => ({ ...p, [verseNum]: color }));
    }
    setActiveVerse(null);
  };

  const handleSaveNote = (verseNum: number) => {
    const id = `${abbrev}:${chapterNum}:${verseNum}`;
    const verseText = verses.find(v => v.verse === verseNum)?.text.trim() || "";
    const reference = `${book?.name} ${chapterNum}:${verseNum}`;

    setNote(id, noteText);
    if (noteText.trim()) {
      addFavorite({ id, text: verseText, reference }, "notes");
    } else {
      removeFavorite(id, "notes");
    }

    setNotesMap((p) => noteText.trim() ? { ...p, [verseNum]: noteText.trim() } : (() => { const n = { ...p }; delete n[verseNum]; return n; })());
    setShowNoteInput(null);
    setNoteText("");
    toast({ title: noteText.trim() ? "Nota salva" : "Nota removida" });
  };

  const handleCreatePage = () => {
    if (!book || selectedVerses.size === 0) return;
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedTexts = sorted.map((v) => verses.find((vd) => vd.verse === v)?.text.trim() || "");
    const ref = `${book.name} ${chapterNum}:${sorted.join(",")}`;
    navigate(`/criar?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(selectedTexts.join(" "))}`);
  };

  const handleShare = async () => {
    if (!book || selectedVerses.size === 0) return;
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedTexts = sorted.map((v) => verses.find((vd) => vd.verse === v)?.text.trim() || "");
    const ref = `${book.name} ${chapterNum}:${sorted.join(",")}`;
    
    const shareText = `${selectedTexts.join("\n")}\n- ${ref}`;
    await shareBibleText(shareText, `Versículo Bíblico - ${ref}`);
  };

  const handleDictionary = async (verseNum: number) => {
    if (dictVerse === verseNum) {
      setDictVerse(null);
      return;
    }
    const v = verses.find(vd => vd.verse === verseNum);
    if (!v || !book) return;

    setDictVerse(verseNum);
    setDictLimitReached(false);

    if (!isOnline) {
      setDictLoading(false);
      setDictContent("Você precisa de internet para usar o Dicionário com IA.");
      return;
    }

    setDictLoading(true);
    setDictContent("");

    try {
      const hasQuota = await checkAndIncrementUsage('dictionary', authUser?.id);
      if (!hasQuota) {
        setDictLoading(false);
        setDictLimitReached(true);
        setDictContent("Você atingiu o limite de 3 consultas ao Dicionário por dia no modo gratuito.");
        return;
      }

      const reference = `${book.name} ${chapterNum}:${verseNum}`;
      const content = await askDictionaryAI(v.text.trim(), reference);
      setDictContent(content);
    } catch (error: any) {
      console.error("Erro no dicionário:", error);
      setDictContent("Erro ao carregar o dicionário. Tente novamente.");
      toast({ title: "Erro no dicionário", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setDictLoading(false);
    }
  };

  const highlightBgClass = (color: HighlightColor) => {
    const map: Record<HighlightColor, string> = {
      yellow: 'bg-[hsl(50,100%,70%,0.15)]',
      blue: 'bg-[hsl(210,80%,70%,0.15)]',
      green: 'bg-[hsl(140,60%,65%,0.15)]',
      pink: 'bg-[hsl(330,80%,70%,0.15)]',
    };
    return map[color];
  };

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

  const renderDictContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
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

      if (line.trim() === "") return <div key={i} className="h-1" />;
      
      return (
        <p key={i} className="text-xs leading-relaxed">
          {parseInlineBold(line)}
        </p>
      );
    });
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Livro não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <div className="sticky top-[52px] md:top-[45px] z-40 glass-card !rounded-none bg-[hsl(var(--card)/0.95)] border-b border-border/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-2.5 space-y-2">
          {/* Row 1: Header title */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Livros
            </Link>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {book.name} {chapterNum}
            </h2>
            <div className="w-16" />
          </div>

          {/* Row 2: Controls (Translation, Bilingual, Dictionary) */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {translations.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.language.toUpperCase()})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!authUser) { toast({ title: "Faça login para usar o modo bilíngue" }); return; }
                if (bilingual) {
                  setBilingual(false);
                  setBilingualLimitReached(false);
                } else {
                  setBilingualLimitReached(false);
                  setBilingual(true);
                }
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                bilingual
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              Bilíngue
            </button>
            {bilingual && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  {bilingualLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
                  <span className="text-[10px] text-muted-foreground">
                    {bilingualLoading ? "Traduzindo com IA..." : "Tradução IA ativa"}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                if (!authUser) { toast({ title: "Faça login para usar o dicionário" }); return; }
                if (dictMode) {
                  setDictMode(false);
                  setDictLimitReached(false);
                  setDictVerse(null);
                  setDictContent("");
                } else {
                  setDictLimitReached(false);
                  setDictMode(true);
                }
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                dictMode
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Dicionário
            </button>
          </div>

          {/* Row 3: Chapters Strip (Fixed inside Sticky Top Bar) */}
          <div className="relative flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => scrollStrip('left')}
              className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
              title="Rolar para a esquerda"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div
              ref={chapterStripRef}
              className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => {
                const isActive = c === chapterNum;
                return (
                  <Link
                    key={c}
                    to={`/livro/${abbrev}/${c}`}
                    data-active={isActive ? "true" : "false"}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold ring-1 ring-accent/60 shadow-sm scale-105"
                        : "bg-secondary/80 text-secondary-foreground hover:bg-muted hover:text-foreground border border-border/40"
                    }`}
                  >
                    {c}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => scrollStrip('right')}
              className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
              title="Rolar para a direita"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-6 pb-32">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            {error === "OFFLINE_MODE" ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <WifiOff className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-foreground">Modo Offline</h3>
                  <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                    Sem conexão e sem dados offline baixados. Para ler sem internet, baixe a Biblia.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/conta")}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  Baixar Biblia Offline
                </button>
              </div>
            ) : (
              <p className="text-muted-foreground">{error}</p>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-3.5"
          >
            {/* Animated Bilingual Limit Banner */}
            <AnimatePresence>
              {bilingual && bilingualLimitReached && (
                <motion.div 
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="mb-4 p-3.5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 backdrop-blur-md shadow-md overflow-hidden relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner"
                      >
                        <AlertCircle className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-rose-200 tracking-tight">Limite do Modo Bilíngue Atingido</h4>
                          <span className="rounded-full bg-rose-500/25 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                            3/3 hoje
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-300/80 leading-snug mt-0.5">
                          Você atingiu o limite de 3 capítulos traduzidos por dia no modo gratuito. Sua cota recarrega em 12 horas.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBilingualLimitReached(false)} 
                      className="text-rose-300/60 hover:text-rose-200 p-1 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bilingual Streaming Progress Banner */}
            {bilingual && bilingualLoading && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3.5 rounded-2xl border border-accent/30 bg-accent/10 backdrop-blur-md shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-accent">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin text-accent" />
                    <span>Traduzindo versículos em tempo real (blocos de 5)...</span>
                  </div>
                  <span className="text-[11px] font-bold">
                    {bilingualVerses.length} / {verses.length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-accent/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((bilingualVerses.length / (verses.length || 1)) * 100))}%` }}
                  />
                </div>
              </motion.div>
            )}

            {bilingual && !isOnline && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-center flex flex-col items-center justify-center">
                <WifiOff className="h-6 w-6 text-red-500 animate-pulse mb-2" />
                <h4 className="text-sm font-bold text-foreground mb-1">Você precisa de internet para usar Tradução com IA</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  O modo Bilíngue requer internet para traduzir dinamicamente os versículos via Inteligência Artificial.
                </p>
              </div>
            )}
            {verses.slice(0, visibleLimit).map((v) => {
              const verseId = `${abbrev}:${chapterNum}:${v.verse}`;
              const hl = highlightsMap[v.verse];
              const note = notesMap[v.verse];
              const bilingualVerse = bilingualVerses.find((ev) => ev.verse === v.verse);

              return (
                <div key={v.verse} className="group" style={{ touchAction: 'pan-y' }}>
                  <div className="flex items-start gap-1">
                    <button
                      onClick={() => {
                        if (dictMode) {
                          handleDictionary(v.verse);
                        } else {
                          toggleVerse(v.verse);
                        }
                      }}
                      style={{ touchAction: 'manipulation' }}
                      className={`flex-1 rounded-lg px-3 py-2 text-left transition-colors ${
                        selectedVerses.has(v.verse)
                          ? "bg-accent/15 ring-1 ring-accent/30"
                          : dictVerse === v.verse
                          ? "bg-accent/10 ring-1 ring-accent/20"
                          : hl
                          ? highlightBgClass(hl)
                          : "hover:bg-secondary"
                      }`}
                    >
                      <span className="mr-2 font-sans text-xs font-bold text-accent">
                        {v.verse}
                      </span>
                      <span className="font-serif text-base leading-relaxed text-foreground">
                        {v.text.trim()}
                      </span>
                      {bilingual && (
                        bilingualVerse ? (
                          <motion.p 
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1 font-sans text-sm italic leading-relaxed text-muted-foreground"
                          >
                            {bilingualVerse.text.trim()}
                          </motion.p>
                        ) : bilingualLoading ? (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-accent/60 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin text-accent" />
                            <span className="italic text-[11px]">Traduzindo versículo...</span>
                          </div>
                        ) : null
                      )}
                    </button>

                    <div className="mt-2 flex shrink-0 flex-col gap-0.5">
                      <button
                        onClick={() => {
                          if (isFavorite(verseId)) {
                            removeFavorite(verseId);
                            setFavSet((p) => { const n = new Set(p); n.delete(v.verse); return n; });
                          } else {
                            addFavorite({ id: verseId, text: v.text.trim(), reference: `${book.name} ${chapterNum}:${v.verse}` });
                            setFavSet((p) => new Set(p).add(v.verse));
                          }
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFavorite(verseId) || favSet.has(v.verse) ? "fill-accent text-accent" : ""}`} />
                      </button>
                      <button
                        onClick={() => setActiveVerse(activeVerse === v.verse ? null : v.verse)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <Highlighter className={`h-3.5 w-3.5 ${hl ? "text-accent" : ""}`} />
                      </button>
                      <button
                        onClick={() => {
                          if (showNoteInput === v.verse) {
                            setShowNoteInput(null);
                          } else {
                            setShowNoteInput(v.verse);
                            setNoteText(note || "");
                          }
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <StickyNote className={`h-3.5 w-3.5 ${note ? "text-accent fill-accent/30" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeVerse === v.verse && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-3 flex items-center gap-2 py-2"
                      >
                        {highlightColors.map((c) => (
                          <button
                            key={c.key}
                            onClick={() => handleHighlight(v.verse, c.key)}
                            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                              hl === c.key ? "border-foreground scale-110" : "border-transparent"
                            }`}
                            style={{ backgroundColor: `hsl(${c.hsl})` }}
                            title={c.label}
                          />
                        ))}
                        {hl && (
                          <button
                            onClick={() => { removeHighlight(verseId); setHighlightsMap((p) => { const n = { ...p }; delete n[v.verse]; return n; }); setActiveVerse(null); }}
                            className="ml-1 rounded-lg p-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showNoteInput === v.verse && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-3 py-2"
                      >
                        <textarea
                          maxLength={1000}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value.slice(0, 1000))}
                          placeholder="Escreva sua anotação... (máx. 1000 caracteres)"
                          rows={2}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => handleSaveNote(v.verse)}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setShowNoteInput(null)}
                            className="rounded-lg px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancelar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {dictMode && dictVerse === v.verse && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                        className="ml-3 py-2 overflow-hidden"
                      >
                        <div className="rounded-2xl border border-accent/25 bg-accent/5 p-3.5 backdrop-blur-md shadow-sm">
                          <div className="flex items-center justify-between gap-1.5 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-accent" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Dicionário Bíblico IA</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 italic">
                              IA com auxílio de erudição bíblica
                            </span>
                          </div>
                          {!isOnline ? (
                            <div className="flex flex-col items-center gap-1.5 text-center py-3">
                              <WifiOff className="h-6 w-6 text-red-500 animate-pulse" />
                              <span className="text-xs font-bold text-foreground">Você precisa de internet para usar o Dicionário com IA</span>
                              <span className="text-[10px] text-muted-foreground">Por favor, reconecte-se e tente novamente.</span>
                            </div>
                          ) : dictLoading ? (
                            <div className="space-y-2 py-1.5">
                              <div className="flex items-center gap-2 text-accent text-xs font-semibold animate-pulse">
                                <Sparkles className="h-3.5 w-3.5 animate-spin text-accent" />
                                <span>Analisando versículo e contexto histórico...</span>
                              </div>
                              <div className="space-y-1.5 pt-1">
                                <div className="h-2.5 w-3/4 rounded-full bg-accent/20 animate-pulse" />
                                <div className="h-2.5 w-full rounded-full bg-accent/15 animate-pulse" />
                                <div className="h-2.5 w-5/6 rounded-full bg-accent/10 animate-pulse" />
                              </div>
                            </div>
                          ) : dictLimitReached ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.96, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="p-3 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 backdrop-blur-md shadow-sm"
                            >
                              <div className="flex items-center gap-2.5">
                                <motion.div 
                                  animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-bold text-rose-200 tracking-tight">
                                      Limite do Dicionário Atingido
                                    </p>
                                    <span className="shrink-0 rounded-full bg-rose-500/25 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                                      3/3 hoje
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-rose-300/80 leading-snug mt-0.5">
                                    Você atingiu o limite de 3 consultas ao Dicionário por dia no modo gratuito. Cota recarrega em 12 horas.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-1"
                            >
                              {renderDictContent(dictContent)}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {note && showNoteInput !== v.verse && (
                    <div className="ml-3 mb-1 glass-card rounded-lg px-3 py-2 text-xs text-muted-foreground italic leading-relaxed">
                      {note}
                    </div>
                  )}
                </div>
              );
            })}

            {visibleLimit < verses.length && (
              <div
                ref={loaderRef}
                onClick={() => setVisibleLimit((prev) => Math.min(prev + 25, verses.length))}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span>Carregando mais versículos de forma incremental... ou clique para exibir mais</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {selectedVerses.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center justify-center gap-2 max-w-full p-2 bg-background/95 backdrop-blur-md border border-border/80 rounded-full shadow-2xl"
          >
            <button
              onClick={handleCreatePage}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-sans text-xs sm:text-sm font-semibold text-accent-foreground shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Criar imagem ({selectedVerses.size})
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full bg-secondary border border-border px-5 py-3 font-sans text-xs sm:text-sm font-semibold text-secondary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Share2 className="h-4 w-4 text-accent shrink-0" />
              Compartilhar texto
            </button>
          </motion.div>
        </div>
      )}

      {verses.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 flex justify-between px-4 max-w-5xl mx-auto pointer-events-none">
          {chapterNum > 1 ? (
            <Link
              to={`/livro/${abbrev}/${chapterNum - 1}`}
              className="group pointer-events-auto flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/80 hover:border-accent/50 hover:bg-accent/10 px-4 py-2 text-xs sm:text-sm font-medium text-foreground shadow-lg shadow-black/20 transition-all duration-200 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 text-accent transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Cap. {chapterNum - 1}</span>
            </Link>
          ) : <div />}
          {chapterNum < book.chapters ? (
            <Link
              to={`/livro/${abbrev}/${chapterNum + 1}`}
              className="group pointer-events-auto ml-auto flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/80 hover:border-accent/50 hover:bg-accent/10 px-4 py-2 text-xs sm:text-sm font-medium text-foreground shadow-lg shadow-black/20 transition-all duration-200 active:scale-95"
            >
              <span>Cap. {chapterNum + 1}</span>
              <ChevronRight className="h-4 w-4 text-accent transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
};

export default Reader;
