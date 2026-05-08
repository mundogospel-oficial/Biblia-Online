import { useState, useEffect, useCallback } from "react";
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
  Highlighter, StickyNote, X, Languages, BookOpen, WifiOff, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DICT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bible-chat`;

import { translateVersesAI, checkAndIncrementQuota } from "@/services/translationService";
import { askDictionaryAI } from "@/services/aiService";

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

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState<number | null>(null);
  const [highlightsMap, setHighlightsMap] = useState<Record<number, HighlightColor>>({});
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const [dictVerse, setDictVerse] = useState<number | null>(null);
  const [dictContent, setDictContent] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictMode, setDictMode] = useState(false);

  const book = getBookByAbbrev(abbrev || "");
  const chapterNum = parseInt(chapter || "1");

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

  useEffect(() => {
    if (!bilingual || !verses.length) {
      setBilingualVerses([]);
      return;
    }

    const cacheKey = `bilingual_v2:${abbrev}:${chapter}:${translation}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setBilingualVerses(JSON.parse(cached));
        return;
      } catch {}
    }

    setBilingualLoading(true);
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
          toast({ 
            title: "Limite de Tradução Atingido", 
            description: "Você atingiu o limite de 5 capítulos traduzidos por dia no modo gratuito.", 
            variant: "destructive" 
          });
          setBilingual(false);
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
        const BATCH_SIZE = 10;
        const batches = [];
        for (let i = 0; i < allVerses.length; i += BATCH_SIZE) {
          batches.push(allVerses.slice(i, i + BATCH_SIZE));
        }

        const allTranslations: any[] = [];
        for (const batch of batches) {
          const results = await translateVersesAI(batch, targetLang as 'en' | 'pt');
          allTranslations.push(...results);
        }

        const translated: VerseData[] = (allTranslations).map((t: any) => ({
          book_name: verses[0]?.book_name || "",
          chapter: parseInt(chapter || "1"),
          verse: t.verse,
          text: t.text,
        }));

        setBilingualVerses(translated);
        sessionStorage.setItem(cacheKey, JSON.stringify(translated));
      } catch (e: any) {
        toast({ title: e.message || "Erro ao traduzir versículos", variant: "destructive" });
        setBilingual(false);
      } finally {
        setBilingualLoading(false);
      }
    };

    translateVerses();
  }, [bilingual, verses, abbrev, chapter, translation, toast]);

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
    toast({ title: noteText.trim() ? "Nota salva ✏️" : "Nota removida" });
  };

  const handleCreatePage = () => {
    if (!book || selectedVerses.size === 0) return;
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedTexts = sorted.map((v) => verses.find((vd) => vd.verse === v)?.text.trim() || "");
    const ref = `${book.name} ${chapterNum}:${sorted.join(",")}`;
    navigate(`/criar?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(selectedTexts.join(" "))}`);
  };

  const handleDictionary = async (verseNum: number) => {
    if (dictVerse === verseNum) {
      setDictVerse(null);
      return;
    }
    const v = verses.find(vd => vd.verse === verseNum);
    if (!v || !book) return;

    setDictVerse(verseNum);
    setDictLoading(true);
    setDictContent("");

    try {
      const reference = `${book.name} ${chapterNum}:${verseNum}`;
      const content = await askDictionaryAI(v.text.trim(), reference);
      setDictContent(content);
    } catch (error: any) {
      console.error("Erro no dicionário:", error);
      setDictContent("Erro ao carregar o dicionário. Tente novamente.");
      toast({ title: "Erro no dicionário", description: error.message, variant: "destructive" });
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

  const renderDictContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs font-bold text-foreground mt-1">{line.slice(2, -2)}</p>;
      if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        const text = line.startsWith("• ") ? line.slice(2) : line.slice(2);
        return <p key={i} className="text-xs pl-2 border-l-2 border-accent/30 py-0.5">{text}</p>;
      }
      if (line.trim() === "") return <div key={i} className="h-1" />;
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

      <div className="sticky top-[52px] md:top-[45px] z-40 glass-card !rounded-none bg-[hsl(var(--card)/0.95)]" style={{ borderBottom: '1px solid hsl(var(--border))', backdropFilter: 'blur(24px) saturate(1.8)' }}>
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Livros
          </Link>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            {book.name} {chapterNum}
          </h2>
          <div className="w-16" />
        </div>

        <div className="container mx-auto flex flex-wrap items-center gap-2 px-4 pb-3">
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              setBilingual(!bilingual);
            }}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              bilingual
                ? "bg-accent text-accent-foreground"
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
              {!bilingualLoading && (
                <span className="text-[9px] text-muted-foreground/60 italic">
                  O modo Bilíngue é uma IA ela comete erros.
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => {
              if (!authUser) { toast({ title: "Faça login para usar o dicionário" }); return; }
              setDictMode(!dictMode);
            }}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              dictMode
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Dicionário
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
            <Link
              key={c}
              to={`/livro/${abbrev}/${c}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                c === chapterNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pb-32">
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
            className="space-y-1"
          >
            {verses.map((v) => {
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
                      {bilingual && bilingualVerse && (
                        <p className="mt-1 font-sans text-sm italic leading-relaxed text-muted-foreground">
                          {bilingualVerse.text.trim()}
                        </p>
                      )}
                    </button>

                    <div className="mt-2 flex shrink-0 flex-col gap-0.5">
                      <button
                        onClick={() => {
                          if (isFavorite(verseId)) {
                            removeFavorite(verseId);
                            setFavSet((p) => { const n = new Set(p); n.delete(v.verse); return n; });
                            toast({ title: "Removido dos favoritos" });
                          } else {
                            addFavorite({ id: verseId, text: v.text.trim(), reference: `${book.name} ${chapterNum}:${v.verse}` });
                            setFavSet((p) => new Set(p).add(v.verse));
                            toast({ title: "Salvo nos favoritos ❤" });
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
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Escreva sua anotação..."
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
                    {dictVerse === v.verse && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-3 py-2"
                      >
                        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-accent" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Dicionário Bíblico</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 italic">
                              O modo Dicionário é uma IA ela comete erros.
                            </span>
                          </div>
                          {dictLoading ? (
                            <div className="flex items-center gap-2 py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-accent" />
                              <span className="text-xs text-muted-foreground">Analisando versículo...</span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">{renderDictContent(dictContent)}</div>
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
          </motion.div>
        )}
      </div>

      {selectedVerses.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <button
            onClick={handleCreatePage}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-sans text-sm font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            Criar página ({selectedVerses.size} {selectedVerses.size === 1 ? 'versículo' : 'versículos'})
          </button>
        </motion.div>
      )}

      {verses.length > 0 && (
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 flex justify-between px-3 pointer-events-none">
          {chapterNum > 1 ? (
            <Link
              to={`/livro/${abbrev}/${chapterNum - 1}`}
              className="pointer-events-auto flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-md border border-border px-3 py-2 text-xs font-medium text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 text-accent" />
              Cap. {chapterNum - 1}
            </Link>
          ) : <div />}
          {chapterNum < book.chapters ? (
            <Link
              to={`/livro/${abbrev}/${chapterNum + 1}`}
              className="pointer-events-auto flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-md border border-border px-3 py-2 text-xs font-medium text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Cap. {chapterNum + 1}
              <ChevronRight className="h-4 w-4 text-accent" />
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
};

export default Reader;
