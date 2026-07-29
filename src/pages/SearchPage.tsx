import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { 
  Search, Loader2, Clock, X, Filter, Sparkles, Bot, 
  BookOpen, Heart, Highlighter, StickyNote, Copy, 
  ArrowRight, User, Flame, Shield, Star, Sun, Cross, Crown, MessageSquare, Compass, ChevronDown,
  Eye, CheckCircle2, Bookmark, Share2, Check, Calendar, Trash2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";
import { isFavorite, addFavorite, removeFavorite, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { 
  SearchResult, BiblicalEntity, RecommendedDevotional, PopularVerse,
  allBiblicalCharacters, allBiblicalTopics, allBiblicalEntities,
  allRecommendedDevotionals, allPopularVerses, stripLeadingNumber
} from "@/lib/searchData";
import { devotionals as allDailyDevotionals, Devotional as MainDevotional } from "@/lib/devotionalsData";
import { readingPlans } from "@/lib/readingPlansData";
import { shareBibleText } from "@/lib/downloadUtils";
import { syncKeyToSupabase } from "@/services/userSyncService";

const HISTORY_KEY = "bible-search-history";

// Interface for unified devotionals in search page
export interface UnifiedSearchDevotional {
  id: string;
  numId: number;
  title: string;
  category: string;
  verse: string;
  reference: string;
  meditation: string;
  prayer: string;
  summary: string;
}

// Normalize strings by removing accents and lowercasing
const normalizeStr = (str: string) => {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

function getShortTitle(name: string): string {
  if (!name) return "";
  const clean = stripLeadingNumber(name);
  if (clean.includes(':')) {
    return clean.split(':')[0].trim();
  }
  if (clean.includes(' - ')) {
    return clean.split(' - ')[0].trim();
  }
  return clean;
}

// Precise word boundary check to avoid partial substring false positives (e.g., 'jo' inside 'joao')
const hasExactWord = (source: string, token: string) => {
  if (!source || !token) return false;
  const words = source.split(/[\s,.:;!?"'()[\]{}–-]+/);
  return words.some(w => w === token || (token.length >= 4 && w.startsWith(token)));
};

// Smart Relevance Scoring Engine
function calculateRelevanceScore(
  query: string,
  fields: {
    primaryName?: string;
    secondaryName?: string;
    reference?: string;
    category?: string;
    badge?: string;
    summary?: string;
    tags?: string[];
  }
): number {
  if (!query.trim()) return 1;

  const qNorm = normalizeStr(query);
  if (!qNorm) return 1;

  const qTokens = qNorm.split(/\s+/).filter(t => t.length > 0);

  const primary = normalizeStr(fields.primaryName || "");
  const secondary = normalizeStr(fields.secondaryName || "");
  const ref = normalizeStr(fields.reference || "");
  const cat = normalizeStr(fields.category || fields.badge || "");
  const summary = normalizeStr(fields.summary || "");
  const tags = (fields.tags || []).map(normalizeStr);

  let score = 0;

  // Exact or prefix match on Primary Name or Reference
  if (primary === qNorm || ref === qNorm) {
    score += 250;
  } else if (primary.startsWith(qNorm) || ref.startsWith(qNorm)) {
    score += 180;
  } else if (primary.includes(qNorm) || ref.includes(qNorm)) {
    score += 120;
  }

  // Token level matching
  for (const token of qTokens) {
    if (token.length === 0) continue;

    // Check if token is chapter/verse number like "23" or "3:17"
    const isNumRef = /^(\d+|[0-9:]+)$/.test(token);

    if (isNumRef) {
      if (ref && ref.includes(token)) {
        score += 90;
      }
      continue;
    }

    // Short tokens (length <= 2) MUST match as exact words (e.g. "Jó" vs "João")
    if (token.length <= 2) {
      if (hasExactWord(primary, token)) score += 80;
      if (hasExactWord(ref, token)) score += 90;
      if (hasExactWord(cat, token)) score += 60;
      if (tags.some(t => t === token)) score += 70;
      continue;
    }

    // For tokens length >= 3:
    let matchedInToken = false;

    // Primary name match
    if (hasExactWord(primary, token)) {
      score += 100;
      matchedInToken = true;
    } else if (primary.includes(token)) {
      const pWords = primary.split(/\s+/);
      if (pWords.some(w => w.startsWith(token))) {
        score += 60;
        matchedInToken = true;
      }
    }

    // Reference match
    if (hasExactWord(ref, token) || ref.includes(token)) {
      score += 110;
      matchedInToken = true;
    }

    // Category / Badge match
    if (hasExactWord(cat, token) || cat.includes(token)) {
      score += 70;
      matchedInToken = true;
    }

    // Tags match
    if (tags.some(t => t === token || t.startsWith(token) || hasExactWord(t, token))) {
      score += 60;
      matchedInToken = true;
    }

    // Summary / Meditation match
    if (hasExactWord(summary, token)) {
      score += 40;
      matchedInToken = true;
    } else if (summary.includes(token)) {
      score += 20;
      matchedInToken = true;
    }
  }

  return score;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState(""); // Live input value typed by user
  const [searchQuery, setSearchQuery] = useState(""); // Submitted query used for filtering & results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"todos" | "planos" | "personagens" | "assuntos" | "devocionais" | "passagens">("todos");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Devotional Modal state
  const [selectedDevotional, setSelectedDevotional] = useState<UnifiedSearchDevotional | null>(null);
  const [devotionalFavorites, setDevotionalFavorites] = useState<number[]>([]);
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [copiedDevotional, setCopiedDevotional] = useState(false);

  // Visible counts for "Ver mais" / pagination in tabs
  const [visiblePlansCount, setVisiblePlansCount] = useState(12);
  const [visibleCharactersCount, setVisibleCharactersCount] = useState(12);
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(12);
  const [visibleDevotionalsCount, setVisibleDevotionalsCount] = useState(12);
  const [visibleVersesCount, setVisibleVersesCount] = useState(12);

  // Load history & devotional favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));

      const savedFavs = localStorage.getItem("biblia-devocionais-favoritos");
      if (savedFavs) setDevotionalFavorites(JSON.parse(savedFavs));
    } catch {}
  }, []);

  // Build unified searchable devotionals from devotionalsData (exactly 105)
  const unifiedSearchDevotionals = useMemo<UnifiedSearchDevotional[]>(() => {
    return allDailyDevotionals.map((d) => ({
      id: `dev-${d.id}`,
      numId: d.id,
      title: d.title,
      category: d.category,
      verse: d.verse,
      reference: d.reference,
      meditation: d.meditation,
      prayer: d.prayer,
      summary: d.meditation.length > 140 ? d.meditation.slice(0, 140) + "..." : d.meditation
    }));
  }, []);

  const addToHistory = (q: string) => {
    const updated = [q, ...history.filter(h => h !== q)].slice(0, 20);
    setHistory(updated);
    const jsonStr = JSON.stringify(updated);
    localStorage.setItem(HISTORY_KEY, jsonStr);
    syncKeyToSupabase("BIBLE_SEARCH_HISTORY", jsonStr);
  };

  const removeFromHistory = (q: string) => {
    const updated = history.filter(h => h !== q);
    setHistory(updated);
    const jsonStr = JSON.stringify(updated);
    localStorage.setItem(HISTORY_KEY, jsonStr);
    syncKeyToSupabase("BIBLE_SEARCH_HISTORY", jsonStr);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    syncKeyToSupabase("BIBLE_SEARCH_HISTORY", "[]");
  };

  const handleSearch = async (searchText?: string) => {
    const q = (searchText !== undefined ? searchText : query).trim();
    if (!q || loading) return;
    setQuery(q);
    setSearchQuery(q);
    setActiveTab("todos");
    setLoading(true);
    setSearched(true);
    addToHistory(q);

    // Reset pagination counts when new search is run
    setVisiblePlansCount(12);
    setVisibleCharactersCount(12);
    setVisibleTopicsCount(12);
    setVisibleDevotionalsCount(12);
    setVisibleVersesCount(12);

    try {
      try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=almeida`);
        if (res.ok) {
          const data = await res.json();
          if (data.verses?.length) {
            setResults(data.verses.map((v: any) => ({ book_name: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text })));
            return;
          }
        }
      } catch (err) {
        console.warn("[SearchPage] bible-api search failed, trying local fallback:", err);
      }

      // Offline / Local search fallback by book and chapter/verse
      const match = q.match(/^([1-3]?\s?[A-Za-zÀ-ÿ]+)\s+(\d+)(?::(\d+))?/);
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
            const v = chapData.verses.filter(item => item.verse === verseNum);
            if (v.length) {
              setResults(v.map(item => ({ book_name: book.name, chapter: chapterNum, verse: item.verse, text: item.text })));
              return;
            }
          } else if (chapData.verses?.length) {
            setResults(chapData.verses.map(item => ({ book_name: book.name, chapter: chapterNum, verse: item.verse, text: item.text })));
            return;
          }
        }
      }

      setResults([]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const findAbbrev = (bookName: string) => {
    const book = bibleBooks.find((b) => b.name.toLowerCase() === bookName.toLowerCase());
    return book?.abbrev || "gn";
  };

  const handleAskAI = (promptText: string) => {
    if (!promptText.trim()) return;
    navigate(`/ia?q=${encodeURIComponent(promptText)}`);
  };

  const toggleDevotionalFavorite = (id: number) => {
    const isFav = devotionalFavorites.includes(id);
    const updated = isFav ? devotionalFavorites.filter(fId => fId !== id) : [...devotionalFavorites, id];
    setDevotionalFavorites(updated);
    localStorage.setItem("biblia-devocionais-favoritos", JSON.stringify(updated));
    toast({
      title: isFav ? "Removido dos favoritos" : "Devocional salvo com sucesso!",
      description: isFav ? "Devocional removido de seus favoritos." : "Acesse sempre que quiser na página de devocionais."
    });
  };

  // Rank Matched Entities (Personagens & Conhecimento Geral)
  const matchedEntities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return allBiblicalEntities
      .map(entity => ({
        entity,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: entity.name,
          badge: entity.badge,
          summary: entity.summary,
          tags: entity.tags
        })
      }))
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .map(item => item.entity);
  }, [searchQuery]);

  // Rank Characters
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return allBiblicalCharacters;

    return allBiblicalCharacters
      .map(c => ({
        character: c,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: c.name,
          badge: c.badge,
          summary: c.summary,
          tags: c.tags
        })
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.character);
  }, [searchQuery]);

  // Rank Topics / Conhecimento
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return allBiblicalTopics;

    return allBiblicalTopics
      .map(t => ({
        topic: t,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: t.name,
          badge: t.badge,
          summary: t.summary,
          tags: t.tags
        })
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.topic);
  }, [searchQuery]);

  // Rank Reading Plans
  const filteredReadingPlans = useMemo(() => {
    if (!searchQuery.trim()) return readingPlans;

    return readingPlans
      .map(p => ({
        plan: p,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: p.title,
          secondaryName: p.subtitle,
          category: p.category,
          badge: p.badge,
          summary: p.description
        })
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.plan);
  }, [searchQuery]);

  // Rank Devotionals
  const filteredDevotionals = useMemo(() => {
    if (!searchQuery.trim()) return unifiedSearchDevotionals;

    return unifiedSearchDevotionals
      .map(d => ({
        devotional: d,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: d.title,
          category: d.category,
          reference: d.reference,
          summary: d.meditation
        })
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.devotional);
  }, [searchQuery, unifiedSearchDevotionals]);

  // Rank Popular Verses
  const filteredPopularVerses = useMemo(() => {
    if (!searchQuery.trim()) return allPopularVerses;

    return allPopularVerses
      .map(v => ({
        verse: v,
        score: calculateRelevanceScore(searchQuery, {
          primaryName: v.reference,
          reference: v.reference,
          category: v.theme,
          summary: v.text
        })
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.verse);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-6">
          
          {/* Header Title */}
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Busca Bíblica e Conhecimento
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pesquise qualquer palavra, versículo, mais de 100 personagens bíblicos, temas e devocionais completos.
            </p>
          </div>

          {/* Search Input Bar */}
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="relative w-full">
                  <input 
                    id="search-input"
                    type="text"
                    inputMode="search"
                    aria-label="Campo de busca bíblica"
                    maxLength={68}
                    value={query} 
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 68);
                      setQuery(val);
                      if (!val) {
                        setSearchQuery("");
                        setSearched(false);
                        setResults([]);
                      }
                    }} 
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch(query);
                      }
                    }}
                    placeholder="Busque sobre algo bíblico..."
                    className={`w-full rounded-xl glass-card py-3.5 ${query ? "pl-4" : "pl-10"} pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 shadow-sm`}
                  />
                  {!query && <Search className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
                  {query && (
                    <button
                      type="button"
                      aria-label="Limpar campo de busca"
                      onClick={() => { setQuery(""); setSearchQuery(""); setSearched(false); setResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* BOTÃO "PERGUNTAR À IA BÍBLICA" - Exibido apenas quando o usuário digita alguma busca */}
                {query.trim().length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleAskAI(`Fale mais sobre o conhecimento bíblico, devocionais ou personagem referente a: ${query}`)}
                      className="w-full rounded-xl border border-accent/40 bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 p-3 hover:border-accent hover:bg-accent/20 transition-all flex items-center justify-between group shadow-sm text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0 shadow-sm">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                            Perguntar à IA Bíblica sobre <span className="text-accent underline font-serif truncate">"{query}"</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Obtenha explicações teológicas, contexto histórico e devocionais instantâneos.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-bold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all flex items-center gap-1 shrink-0 ml-2">
                        <Bot className="h-3.5 w-3.5" /> Perguntar
                      </div>
                    </button>
                  </motion.div>
                )}
              </div>

              <button type="submit" disabled={loading || !query.trim()} aria-label="Executar busca bíblica" className="rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:opacity-90 shadow-sm flex items-center gap-1.5 shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <> <Search className="h-4 w-4" /> Buscar </>}
              </button>
            </form>
          </div>

          {/* Quick Category Tabs with Counts */}
          <div className="flex gap-1.5 overflow-x-auto pb-2.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-border/30 relative">
            {[
              { id: "todos", label: "Todos e Destaques", icon: Compass },
              { id: "planos", label: `Planos Diários (${filteredReadingPlans.length})`, icon: Calendar },
              { id: "personagens", label: `Personagens (${filteredCharacters.length})`, icon: User },
              { id: "assuntos", label: `Conhecimento (${filteredTopics.length})`, icon: BookOpen },
              { id: "devocionais", label: `Devocionais (${filteredDevotionals.length})`, icon: Flame },
              { id: "passagens", label: `Passagens Populares (${filteredPopularVerses.length})`, icon: Star },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors select-none ${
                    isActive 
                      ? "text-primary-foreground font-bold" 
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSearchTabPill"
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <IconComp className="h-3.5 w-3.5" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MATCHED BIBLICAL ENTITY CARD WHEN SEARCHING */}
          {activeTab === "todos" && searched && matchedEntities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-accent" />
                  <h2 className="font-serif text-sm font-bold text-foreground sm:text-base">
                    Conhecimento e Personagens Relacionados ({matchedEntities.length})
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {matchedEntities.slice(0, 6).map((entity) => {
                  const shortName = getShortTitle(entity.name);
                  return (
                    <motion.div
                      key={entity.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                            {entity.badge.split("•")[0].trim()}
                          </span>
                          <button
                            onClick={() => handleAskAI(entity.aiPrompt)}
                            className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0"
                            title="Perguntar à IA"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground">
                          {stripLeadingNumber(entity.name)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                          {entity.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleAskAI(entity.aiPrompt)}
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          <Bot className="h-3.5 w-3.5" /> Perguntar à IA
                        </button>
                        <button
                          onClick={() => handleSearch(shortName)}
                          className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 truncate"
                        >
                          <Search className="h-3 w-3 shrink-0" /> <span className="truncate">Buscar sobre {shortName}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE SEARCH RESULTS FROM BIBLE API */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Buscando versículos na Bíblia Sagrada...</p>
            </div>
          )}

          {!loading && searched && activeTab === "todos" && results.length === 0 && matchedEntities.length === 0 && filteredCharacters.length === 0 && filteredTopics.length === 0 && filteredDevotionals.length === 0 && filteredPopularVerses.length === 0 && filteredReadingPlans.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                Não há resultados para sua pesquisa tente novamente mais tarde.
              </p>
              <button
                onClick={() => handleAskAI(`O que a Bíblia ensina sobre: ${searchQuery}?`)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/90 transition-all shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" /> Perguntar à IA Bíblica sobre "{searchQuery}"
              </button>
            </div>
          )}

          {!loading && (activeTab === "todos" || activeTab === "passagens") && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-sm font-bold text-foreground sm:text-base flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-accent" /> Versículos na Bíblia ({results.length})
                </h2>
              </div>

              <div className="space-y-2.5">
                {results.map((r, i) => {
                  const abbrev = findAbbrev(r.book_name);
                  const verseId = `${abbrev}:${r.chapter}:${r.verse}`;
                  const reference = `${r.book_name} ${r.chapter}:${r.verse}`;

                  const toggleReaction = (e: React.MouseEvent, type: ReactionType) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isFavorite(verseId, type)) {
                      removeFavorite(verseId, type);
                    } else {
                      addFavorite({ id: verseId, text: r.text, reference }, type);
                    }
                    setRefreshTrigger(p => p + 1);
                  };

                  return (
                    <motion.div key={`${i}-${refreshTrigger}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <Link to={`/livro/${abbrev}/${r.chapter}`} className="relative block rounded-xl glass-card p-4 transition-all hover:border-accent/60 shadow-sm">
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{reference}</p>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => toggleReaction(e, "favorites")} title="Favoritos" className={`p-1 transition-colors ${isFavorite(verseId, "favorites") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <Heart className={`h-3.5 w-3.5 ${isFavorite(verseId, "favorites") ? "fill-accent" : ""}`} />
                            </button>
                            <button onClick={(e) => toggleReaction(e, "markings")} title="Marcações" className={`p-1 transition-colors ${isFavorite(verseId, "markings") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <Highlighter className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(e) => toggleReaction(e, "notes")} title="Anotações" className={`p-1 transition-colors ${isFavorite(verseId, "notes") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="font-serif text-xs sm:text-sm leading-relaxed text-card-foreground">"{r.text}"</p>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HISTORY AND SUGGESTIONS WHEN NOT SEARCHED OR BELOW SEARCH */}
          <div className="space-y-6 pt-2">
            
            {/* History if available */}
            {!searched && history.length > 0 && (
              <div className="glass-card rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-3 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/20">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="font-serif text-sm font-bold text-foreground">
                      Histórico de Buscas
                    </span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Limpar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {history.map((h) => (
                    <div
                      key={h}
                      className="group inline-flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 hover:bg-secondary/80 hover:border-accent/40 px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-200 shadow-2xs"
                    >
                      <button
                        onClick={() => handleSearch(h)}
                        className="flex items-center gap-1.5 text-foreground hover:text-accent font-medium transition-colors cursor-pointer"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                        <span>{h}</span>
                      </button>
                      <button
                        onClick={() => removeFromHistory(h)}
                        className="p-0.5 rounded-md text-muted-foreground/70 hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
                        title="Remover do histórico"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PLANOS DIÁRIOS DE LEITURA */}
            {((activeTab === "todos" && filteredReadingPlans.length > 0) || activeTab === "planos") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground">
                      Planos Diários de Leitura ({filteredReadingPlans.length})
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <Link to="/devocionais" className="text-xs text-accent hover:underline font-medium">
                      Ver Todos em Devocionais e Planos →
                    </Link>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredReadingPlans.slice(0, activeTab === "todos" ? 4 : visiblePlansCount).map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold border ${plan.bgGradient}`}>
                            {plan.badge}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {plan.durationDays} Dias
                          </span>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground">{plan.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{plan.description}</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">{plan.category}</span>
                        <Link
                          to="/devocionais"
                          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Acessar Plano →
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredReadingPlans.length === 0 && activeTab === "planos" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    Nenhum plano de leitura encontrado para sua busca.
                  </div>
                )}

                {activeTab === "planos" && visiblePlansCount < filteredReadingPlans.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisiblePlansCount(prev => prev + 12)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> Carregar Mais Planos ({filteredReadingPlans.length - visiblePlansCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PERSONAGENS BÍBLICOS (100+) */}
            {((activeTab === "todos" && filteredCharacters.length > 0) || activeTab === "personagens") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground">
                      Personagens Bíblicos ({filteredCharacters.length})
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <button onClick={() => setActiveTab("personagens")} className="text-xs text-accent hover:underline font-medium">
                      Ver Mais ({filteredCharacters.length}) →
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredCharacters.slice(0, activeTab === "todos" ? 6 : visibleCharactersCount).map((p) => {
                    const shortName = getShortTitle(p.name);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                              {p.badge.split("•")[0].trim()}
                            </span>
                            <button
                              onClick={() => handleAskAI(p.aiPrompt)}
                              title="Perguntar à IA Bíblica"
                              className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-foreground">{stripLeadingNumber(p.name)}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {p.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleAskAI(p.aiPrompt)}
                            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                          >
                            <Bot className="h-3.5 w-3.5" /> Perguntar à IA
                          </button>
                          <button
                            onClick={() => handleSearch(shortName)}
                            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 truncate"
                          >
                            <Search className="h-3 w-3 shrink-0" /> <span className="truncate">Buscar sobre {shortName}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredCharacters.length === 0 && activeTab === "personagens" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    Não há resultados para sua pesquisa tente novamente mais tarde.
                  </div>
                )}

                {activeTab === "personagens" && visibleCharactersCount < filteredCharacters.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleCharactersCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> Carregar Mais Personagens ({filteredCharacters.length - visibleCharactersCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CONHECIMENTO & TEMAS (100+) */}
            {((activeTab === "todos" && filteredTopics.length > 0) || activeTab === "assuntos") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground">
                      Conhecimento e Temas Bíblicos ({filteredTopics.length})
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <button onClick={() => setActiveTab("assuntos")} className="text-xs text-accent hover:underline font-medium">
                      Ver Mais ({filteredTopics.length}) →
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTopics.slice(0, activeTab === "todos" ? 6 : visibleTopicsCount).map((a) => {
                    const shortName = getShortTitle(a.name);
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                              {a.badge.split("•")[0].trim()}
                            </span>
                            <button
                              onClick={() => handleAskAI(a.aiPrompt)}
                              className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-foreground">{stripLeadingNumber(a.name)}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {a.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleAskAI(a.aiPrompt)}
                            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                          >
                            <Bot className="h-3.5 w-3.5" /> Perguntar à IA
                          </button>
                          <button
                            onClick={() => handleSearch(shortName)}
                            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 truncate"
                          >
                            <Search className="h-3 w-3 shrink-0" /> <span className="truncate">Buscar sobre {shortName}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredTopics.length === 0 && activeTab === "assuntos" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    Não há resultados para sua pesquisa tente novamente mais tarde.
                  </div>
                )}

                {activeTab === "assuntos" && visibleTopicsCount < filteredTopics.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleTopicsCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> Carregar Mais Conhecimentos ({filteredTopics.length - visibleTopicsCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEVOCIONAIS (100+) */}
            {((activeTab === "todos" && filteredDevotionals.length > 0) || activeTab === "devocionais") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground">
                      Devocionais Relacionados ({filteredDevotionals.length})
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <Link to="/devocionais" className="text-xs text-accent hover:underline font-medium">
                      Ir para Página Devocionais →
                    </Link>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredDevotionals.slice(0, activeTab === "todos" ? 6 : visibleDevotionalsCount).map((d) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/60 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase text-accent">
                            {d.category}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground">{d.reference}</span>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground">{d.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{d.summary}</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedDevotional(d)}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver Devocional
                        </button>
                        <button
                          onClick={() => toggleDevotionalFavorite(d.numId)}
                          className={`p-1 text-xs transition-colors ${
                            devotionalFavorites.includes(d.numId) ? "text-accent" : "text-muted-foreground hover:text-accent"
                          }`}
                          title="Favoritar Devocional"
                        >
                          <Heart className={`h-3.5 w-3.5 ${devotionalFavorites.includes(d.numId) ? "fill-accent" : ""}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredDevotionals.length === 0 && activeTab === "devocionais" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    Não há resultados para sua pesquisa tente novamente mais tarde.
                  </div>
                )}

                {activeTab === "devocionais" && visibleDevotionalsCount < filteredDevotionals.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleDevotionalsCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> Carregar Mais Devocionais ({filteredDevotionals.length - visibleDevotionalsCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PASSAGENS BÍBLICAS POPULARES (100+) */}
            {((activeTab === "todos" && filteredPopularVerses.length > 0) || activeTab === "passagens") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground">
                      Passagens Bíblicas Mais Buscadas ({filteredPopularVerses.length})
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredPopularVerses.slice(0, activeTab === "todos" ? 6 : visibleVersesCount).map((pv, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{pv.reference}</span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{stripLeadingNumber(pv.theme)}</span>
                        </div>
                        <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{pv.text}"</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                        <button
                          onClick={() => handleSearch(pv.reference)}
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                        >
                          <Search className="h-3 w-3" /> Ler / Buscar
                        </button>
                        <button
                          onClick={() => handleAskAI(`Me explique o contexto e o significado teológico de ${pv.reference}`)}
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          Explicar na IA <Sparkles className="h-3 w-3 text-accent" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPopularVerses.length === 0 && activeTab === "passagens" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    Não há resultados para sua pesquisa tente novamente mais tarde.
                  </div>
                )}

                {activeTab === "passagens" && visibleVersesCount < filteredPopularVerses.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleVersesCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> Carregar Mais Passagens ({filteredPopularVerses.length - visibleVersesCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </motion.div>
      </section>

      {/* DEVOCIONAL FULL VIEW MODAL */}
      <AnimatePresence>
        {selectedDevotional && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6 border border-border shadow-2xl bg-card text-card-foreground space-y-5"
            >
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent tracking-wider flex items-center gap-1">
                      <Flame className="h-3 w-3" /> {selectedDevotional.category}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{selectedDevotional.reference}</span>
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                    {selectedDevotional.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDevotional(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bible Verse Box */}
              {selectedDevotional.verse && (
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> Versículo Base
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`"${selectedDevotional.verse}" - ${selectedDevotional.reference}`);
                        setCopiedVerse(true);
                        setTimeout(() => setCopiedVerse(false), 2000);
                      }}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                    >
                      {copiedVerse ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedVerse ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <p className="font-serif text-sm italic leading-relaxed text-foreground">
                    "{selectedDevotional.verse}"
                  </p>
                  <p className="text-xs font-semibold text-accent text-right">
                    — {selectedDevotional.reference}
                  </p>
                </div>
              )}

              {/* Reflection / Meditation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-accent" /> Reflexão para Hoje
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-sans">
                  {selectedDevotional.meditation}
                </p>
              </div>

              {/* Prayer */}
              {selectedDevotional.prayer && (
                <div className="rounded-xl border border-border/50 bg-secondary/50 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-accent" /> Oração para Hoje
                  </h3>
                  <p className="font-serif text-xs sm:text-sm italic text-foreground/90 leading-relaxed">
                    "{selectedDevotional.prayer}"
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDevotionalFavorite(selectedDevotional.numId)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      devotionalFavorites.includes(selectedDevotional.numId)
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${devotionalFavorites.includes(selectedDevotional.numId) ? "fill-accent text-accent" : ""}`} />
                    {devotionalFavorites.includes(selectedDevotional.numId) ? "Favoritado" : "Favoritar"}
                  </button>

                  <button
                    onClick={() => {
                      const fullText = `${selectedDevotional.title}\n${selectedDevotional.reference}\n\n"${selectedDevotional.verse}"\n\nREFLEXÃO:\n${selectedDevotional.meditation}\n\nORAÇÃO:\n${selectedDevotional.prayer}`;
                      navigator.clipboard.writeText(fullText);
                      setCopiedDevotional(true);
                      setTimeout(() => setCopiedDevotional(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-accent transition-all"
                  >
                    {copiedDevotional ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copiedDevotional ? "Copiado!" : "Copiar"}
                  </button>

                  <button
                    onClick={() => {
                      const fullText = `📖 ${selectedDevotional.title}\n\n📜 "${selectedDevotional.verse}" (${selectedDevotional.reference})\n\n✍️ REFLEXÃO:\n${selectedDevotional.meditation}\n\n🙏 ORAÇÃO:\n${selectedDevotional.prayer}`;
                      shareBibleText(fullText, `Devocional: ${selectedDevotional.title}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold hover:opacity-90 transition-all shadow-xs"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </button>
                </div>

                <Link
                  to="/devocionais"
                  onClick={() => setSelectedDevotional(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  Ir para Devocionais Diários →
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SearchPage;

