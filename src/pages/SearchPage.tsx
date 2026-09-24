import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { 
  Search, Loader2, Clock, X, Filter, Sparkles, Bot, 
  BookOpen, Heart, Highlighter, StickyNote, Copy, 
  ArrowRight, User, Flame, Shield, Star, Sun, Cross, Crown, MessageSquare, Compass, ChevronDown,
  Eye, CheckCircle2, Bookmark, Share2, Check, Calendar, Trash2,
  Feather, CloudRain, Zap, HeartHandshake, Activity, Coins, RefreshCw, Home, ShieldCheck, PartyPopper
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { bibleBooks, fetchChapter, loadBibliaLivre } from "@/lib/bibleData";
import { isFavorite, addFavorite, removeFavorite, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { 
  SearchResult, BiblicalEntity, RecommendedDevotional, PopularVerse,
  allBiblicalCharacters, allBiblicalTopics, allBiblicalEntities,
  allRecommendedDevotionals, allPopularVerses, stripLeadingNumber
} from "@/lib/searchData";
import { getLocalizedDevotionals, Devotional as MainDevotional } from "@/lib/devotionalsData";
import { getLocalizedReadingPlans } from "@/lib/readingPlansData";
import { shareBibleText } from "@/lib/downloadUtils";
import { syncKeyToSupabase } from "@/services/userSyncService";
import VoiceInputButton from "@/components/VoiceInputButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  SEMANTIC_CONCEPTS, 
  detectSemanticConcepts, 
  performSemanticBibleSearch, 
  SemanticConcept,
  normalizeSemanticStr
} from "@/lib/semanticBibleSearch";

const HISTORY_KEY = "bible-search-history";

// Visual configuration for each "Momento da Vida" category using representative Lucide-react icons
export interface MomentVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
}

export const MOMENT_VISUAL_MAP: Record<string, MomentVisualConfig> = {
  "ansiedade-medo": {
    icon: Feather, // Leveza, alívio de fardos e paz interior
    iconBg: "bg-sky-500/15",
    iconBorder: "border-sky-500/30",
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-600 dark:text-sky-400",
    accentBorder: "hover:border-sky-500/50"
  },
  "medo-coragem": {
    icon: Shield, // Escudo de proteção e bravura
    iconBg: "bg-amber-500/15",
    iconBorder: "border-amber-500/30",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-600 dark:text-amber-400",
    accentBorder: "hover:border-amber-500/50"
  },
  "tristeza-luto": {
    icon: CloudRain, // Consolo divino em dias de lágrimas
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/30",
    iconColor: "text-blue-500",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-600 dark:text-blue-400",
    accentBorder: "hover:border-blue-500/50"
  },
  "cansaco-desanimo": {
    icon: Zap, // Renovo de energia e forças espirituais
    iconBg: "bg-yellow-500/15",
    iconBorder: "border-yellow-500/30",
    iconColor: "text-yellow-500",
    badgeBg: "bg-yellow-500/15",
    badgeText: "text-yellow-600 dark:text-yellow-400",
    accentBorder: "hover:border-yellow-500/50"
  },
  "solidao-rejeicao": {
    icon: HeartHandshake, // Acolhimento e amizade constante de Cristo
    iconBg: "bg-rose-500/15",
    iconBorder: "border-rose-500/30",
    iconColor: "text-rose-500",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-600 dark:text-rose-400",
    accentBorder: "hover:border-rose-500/50"
  },
  "doenca-cura": {
    icon: Activity, // Vitalidade, cura divina e restauração da saúde
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/30",
    iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "hover:border-emerald-500/50"
  },
  "provisao-financas": {
    icon: Coins, // Provisão diária, livramento de dívidas e sustento
    iconBg: "bg-amber-600/15",
    iconBorder: "border-amber-600/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-600/15",
    badgeText: "text-amber-700 dark:text-amber-300",
    accentBorder: "hover:border-amber-600/50"
  },
  "perdao-culpa": {
    icon: RefreshCw, // Graça purificadora, recomeço e remissão
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/30",
    iconColor: "text-purple-500",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-600 dark:text-purple-400",
    accentBorder: "hover:border-purple-500/50"
  },
  "fe-duvida": {
    icon: Sparkles, // Chama da fé, milagres e firmeza espiritual
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/30",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-600 dark:text-orange-400",
    accentBorder: "hover:border-orange-500/50"
  },
  "sabedoria-direcao": {
    icon: Compass, // Bússola divina, clareza e discernimento
    iconBg: "bg-cyan-500/15",
    iconBorder: "border-cyan-500/30",
    iconColor: "text-cyan-500",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    accentBorder: "hover:border-cyan-500/50"
  },
  "familia-casamento": {
    icon: Home, // Lar abençoado, harmonia familiar e casamento
    iconBg: "bg-pink-500/15",
    iconBorder: "border-pink-500/30",
    iconColor: "text-pink-500",
    badgeBg: "bg-pink-500/15",
    badgeText: "text-pink-600 dark:text-pink-400",
    accentBorder: "hover:border-pink-500/50"
  },
  "protecao-espiritual": {
    icon: ShieldCheck, // Armadura de Deus, cobertura contra ciladas
    iconBg: "bg-indigo-500/15",
    iconBorder: "border-indigo-500/30",
    iconColor: "text-indigo-500",
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-600 dark:text-indigo-400",
    accentBorder: "hover:border-indigo-500/50"
  },
  "gratidao-louvor": {
    icon: PartyPopper, // Celebração, júbilo e ação de graças
    iconBg: "bg-yellow-600/15",
    iconBorder: "border-yellow-600/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-yellow-600/15",
    badgeText: "text-yellow-700 dark:text-yellow-300",
    accentBorder: "hover:border-yellow-600/50"
  },
  "salvacao-graca": {
    icon: Cross, // A cruz vazia, sacrifício e redenção eterna
    iconBg: "bg-red-500/15",
    iconBorder: "border-red-500/30",
    iconColor: "text-red-500",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-600 dark:text-red-400",
    accentBorder: "hover:border-red-500/50"
  }
};

export function getMomentVisual(id?: string): MomentVisualConfig {
  if (id && MOMENT_VISUAL_MAP[id]) {
    return MOMENT_VISUAL_MAP[id];
  }
  return {
    icon: Heart,
    iconBg: "bg-accent/15",
    iconBorder: "border-accent/30",
    iconColor: "text-accent",
    badgeBg: "bg-accent/15",
    badgeText: "text-accent",
    accentBorder: "hover:border-accent/50"
  };
}

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

// Smart Relevance Scoring Engine (Léxico + Semântico)
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
  },
  activeConcept?: SemanticConcept | null
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

  // Boost semântico por conceito identificado
  if (activeConcept) {
    const fullText = `${primary} ${secondary} ${cat} ${summary} ${tags.join(" ")}`;
    
    // Triggers do sentimento
    for (const trigger of activeConcept.triggers) {
      const normTrig = normalizeSemanticStr(trigger);
      if (normTrig && fullText.includes(normTrig)) {
        score += 75;
        break;
      }
    }

    // Sinônimos bíblicos do sentimento
    for (const syn of activeConcept.synonyms) {
      const normSyn = normalizeSemanticStr(syn);
      if (normSyn && fullText.includes(normSyn)) {
        score += 45;
        break;
      }
    }
  }

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
  const { t, language } = useLanguage();
  const isEn = language === "en";

  const [query, setQuery] = useState(""); // Live input value typed by user
  const [searchQuery, setSearchQuery] = useState(""); // Submitted query used for filtering e results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"todos" | "versiculos" | "momentos" | "planos" | "personagens" | "assuntos" | "devocionais" | "passagens">("todos");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados de Sentimentos e Momentos da Vida
  const [detectedConcept, setDetectedConcept] = useState<SemanticConcept | null>(null);
  const [matchedConcepts, setMatchedConcepts] = useState<SemanticConcept[]>([]);

  // Devotional Modal state
  const [selectedDevotional, setSelectedDevotional] = useState<UnifiedSearchDevotional | null>(null);
  const [devotionalFavorites, setDevotionalFavorites] = useState<number[]>([]);
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [copiedDevotional, setCopiedDevotional] = useState(false);

  // Visible counts for "Ver mais" / pagination in tabs
  const [visibleMomentsCount, setVisibleMomentsCount] = useState(12);
  const [visiblePlansCount, setVisiblePlansCount] = useState(12);
  const [visibleCharactersCount, setVisibleCharactersCount] = useState(12);
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(12);
  const [visibleDevotionalsCount, setVisibleDevotionalsCount] = useState(12);
  const [visibleVersesCount, setVisibleVersesCount] = useState(12);

  // Load history e devotional favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));

      const savedFavs = localStorage.getItem("biblia-devocionais-favoritos");
      if (savedFavs) setDevotionalFavorites(JSON.parse(savedFavs));
    } catch {}
  }, []);

  const allDailyDevotionals = useMemo(() => getLocalizedDevotionals(language), [language]);
  const readingPlans = useMemo(() => getLocalizedReadingPlans(language), [language]);

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
  }, [allDailyDevotionals]);

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
    setVisibleMomentsCount(12);
    setVisiblePlansCount(12);
    setVisibleCharactersCount(12);
    setVisibleTopicsCount(12);
    setVisibleDevotionalsCount(12);
    setVisibleVersesCount(12);

    try {
      // 1. Busca Direta por Referência Bíblica (ex: "João 3:16", "John 3:16", "Salmos 23", "Psalms 23")
      const match = q.match(/^([1-3]?\s?[A-Za-zÀ-ÿ]+)\s+(\d+)(?::(\d+))?/);
      if (match) {
        const bookInput = match[1].trim().toLowerCase();
        const chapterNum = parseInt(match[2], 10);
        const verseNum = match[3] ? parseInt(match[3], 10) : null;

        const book = bibleBooks.find(b => 
          b.name.toLowerCase() === bookInput || 
          (b.nameEn && b.nameEn.toLowerCase() === bookInput) ||
          b.abbrev.toLowerCase() === bookInput ||
          b.name.toLowerCase().startsWith(bookInput) ||
          (b.nameEn && b.nameEn.toLowerCase().startsWith(bookInput))
        );

        if (book) {
          const trans = language === "en" ? "kjv" : "blivre";
          const chapData = await fetchChapter(book.abbrev, chapterNum, trans);
          const bookDisplayName = language === "en" ? (book.nameEn || book.name) : book.name;

          if (verseNum) {
            const v = chapData.verses.filter(item => item.verse === verseNum);
            if (v.length) {
              setResults(v.map(item => ({ book_name: bookDisplayName, chapter: chapterNum, verse: item.verse, text: item.text })));
              setDetectedConcept(null);
              setMatchedConcepts([]);
              return;
            }
          } else if (chapData.verses?.length) {
            setResults(chapData.verses.map(item => ({ book_name: bookDisplayName, chapter: chapterNum, verse: item.verse, text: item.text })));
            setDetectedConcept(null);
            setMatchedConcepts([]);
            return;
          }
        }
      }

      // 2. Motor Léxico-Semântico Offline de Sentimentos, Dores e Conceitos Bíblicos
      let localBibleData: any[] | null = null;
      try {
        localBibleData = await loadBibliaLivre();
      } catch (e) {
        console.warn("[SearchPage] Bíblia Livre local em carregamento ou indisponível:", e);
      }

      const semanticRes = await performSemanticBibleSearch(q, localBibleData || undefined);
      if (semanticRes.verses.length > 0) {
        setResults(semanticRes.verses.map(v => ({
          book_name: v.book_name,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
          contextReason: v.contextReason,
          conceptEmoji: v.conceptEmoji,
          conceptName: v.conceptName
        })));
        setDetectedConcept(semanticRes.detectedConcept);
        setMatchedConcepts(semanticRes.allMatchedConcepts);
        return;
      }

      // 3. Fallback online com API pública caso o termo não tenha correspondido localmente
      try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=almeida`);
        if (res.ok) {
          const data = await res.json();
          if (data.verses?.length) {
            setResults(data.verses.map((v: any) => ({ book_name: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text })));
            setDetectedConcept(null);
            setMatchedConcepts([]);
            return;
          }
        }
      } catch (err) {
        console.warn("[SearchPage] bible-api search fallback failed:", err);
      }

      setResults([]);
      setDetectedConcept(null);
      setMatchedConcepts([]);
    } catch (err) {
      console.error("[SearchPage] Erro durante a pesquisa:", err);
      setResults([]);
      setDetectedConcept(null);
      setMatchedConcepts([]);
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
      title: isFav 
        ? (isEn ? "Removed from favorites" : "Removido dos favoritos") 
        : (isEn ? "Devotional saved successfully!" : "Devocional salvo com sucesso!"),
      description: isFav 
        ? (isEn ? "Devotional removed from your favorites." : "Devocional removido de seus favoritos.") 
        : (isEn ? "Access it anytime on the devotionals page." : "Acesse sempre que quiser na página de devocionais.")
    });
  };

  // Conceito semântico ativo calculado a partir da busca do usuário
  const activeSemanticConcept = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return detectSemanticConcepts(searchQuery).topConcept;
  }, [searchQuery]);

  // Rank Matched Entities (Personagens e Conhecimento Geral)
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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .map(item => item.entity);
  }, [searchQuery, activeSemanticConcept]);

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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.character);
  }, [searchQuery, activeSemanticConcept]);

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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.topic);
  }, [searchQuery, activeSemanticConcept]);

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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.plan);
  }, [searchQuery, readingPlans, activeSemanticConcept]);

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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.devotional);
  }, [searchQuery, unifiedSearchDevotionals, activeSemanticConcept]);

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
        }, activeSemanticConcept)
      }))
      .filter(item => item.score > 15)
      .sort((a, b) => b.score - a.score)
      .map(item => item.verse);
  }, [searchQuery, activeSemanticConcept]);

  // Rank Momentos da Vida e Emoções
  const filteredMoments = useMemo(() => {
    if (!searchQuery.trim()) return SEMANTIC_CONCEPTS;
    const qNorm = normalizeSemanticStr(searchQuery);
    return SEMANTIC_CONCEPTS.filter((c) => {
      const nameNorm = normalizeSemanticStr(c.name);
      const badgeNorm = normalizeSemanticStr(c.badge);
      const descNorm = normalizeSemanticStr(c.description);
      const trigMatch = c.triggers.some((t) => {
        const tNorm = normalizeSemanticStr(t);
        return tNorm.includes(qNorm) || qNorm.includes(tNorm);
      });
      const synMatch = c.synonyms.some((s) => {
        const sNorm = normalizeSemanticStr(s);
        return sNorm.includes(qNorm) || qNorm.includes(sNorm);
      });
      return nameNorm.includes(qNorm) || badgeNorm.includes(qNorm) || descNorm.includes(qNorm) || trigMatch || synMatch;
    });
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
              {isEn ? "Biblical Search and Knowledge" : "Busca Bíblica e Conhecimento"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEn 
                ? "Search for any word, verse, 100+ biblical characters, themes, and full devotionals."
                : "Pesquise qualquer palavra, versículo, mais de 100 personagens bíblicos, temas e devocionais completos."}
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="space-y-2.5">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="flex flex-col gap-2.5">
              <div className="flex gap-2 items-center w-full">
                <div className="relative flex-1 min-w-0">
                  <input 
                    id="search-input"
                    type="text"
                    inputMode="search"
                    aria-label={isEn ? "Biblical search field" : "Campo de busca bíblica"}
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
                    placeholder={isEn ? "Search something biblical..." : "Buscar algo bíblico..."}
                    className={`w-full rounded-xl glass-card py-2.5 sm:py-3.5 ${query ? "pl-3.5" : "pl-8 sm:pl-10"} pr-12 sm:pr-20 text-[12px] sm:text-sm text-foreground placeholder:text-[11.5px] sm:placeholder:text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 shadow-sm`}
                  />
                  {!query && <Search className="absolute left-2.5 sm:left-3 top-1/2 z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
                  <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1 z-10">
                    <VoiceInputButton
                      onTranscript={(transcript) => {
                        const newQuery = query ? `${query.trim()} ${transcript}` : transcript;
                        setQuery(newQuery);
                        handleSearch(newQuery);
                      }}
                      size="xs"
                      title={isEn ? "Search with voice" : "Pesquisar por voz"}
                    />
                    {query && (
                      <button
                        type="button"
                        aria-label={isEn ? "Clear search input" : "Limpar campo de busca"}
                        onClick={() => { setQuery(""); setSearchQuery(""); setSearched(false); setResults([]); }}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={loading || !query.trim()} aria-label={isEn ? "Execute biblical search" : "Executar busca bíblica"} className="rounded-xl bg-primary px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:opacity-90 shadow-sm flex items-center gap-1 sm:gap-1.5 shrink-0 active:scale-95">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <> <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {isEn ? "Search" : "Buscar"} </>}
                </button>
              </div>

              {/* BOTÃO "PERGUNTAR À IA BÍBLICA" - Exibido com largura total quando o usuário digita alguma busca */}
              {query.trim().length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                  <button
                    type="button"
                    onClick={() => handleAskAI(isEn ? `Tell me more about the biblical knowledge, devotionals or character related to: ${query}` : `Fale mais sobre o conhecimento bíblico, devocionais ou personagem referente a: ${query}`)}
                    className="w-full rounded-xl border border-accent/40 bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 p-2.5 sm:p-3 hover:border-accent hover:bg-accent/20 transition-all flex items-center justify-between gap-2.5 group shadow-sm text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0 shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {isEn ? "Ask Biblical AI about " : "Perguntar à IA Bíblica sobre "}<span className="text-accent underline font-serif">"{query}"</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {isEn ? "Get theological insights, historical context and instant devotionals." : "Obtenha explicações teológicas, contexto histórico e devocionais instantâneos."}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-accent/20 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all flex items-center gap-1 shrink-0">
                      <Bot className="h-3.5 w-3.5" /> <span className="hidden xs:inline">{isEn ? "Ask" : "Perguntar"}</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </form>
          </div>

          {/* CARD DE DESTAQUE QUANDO MOMENTO DA VIDA É IDENTIFICADO */}
          {searched && detectedConcept && (() => {
            const visual = getMomentVisual(detectedConcept.id);
            const MomentIcon = visual.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border ${visual.iconBorder} bg-gradient-to-r from-card via-card to-accent/10 p-4 sm:p-5 shadow-sm space-y-3`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${visual.iconBg} border ${visual.iconBorder} shadow-2xs`}>
                      <MomentIcon className={`h-6 w-6 ${visual.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${visual.badgeBg} ${visual.badgeText}`}>
                          {isEn ? `Life Moment • ${detectedConcept.badge}` : `Momento da Vida • ${detectedConcept.badge}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {isEn ? `${results.length} verses found` : `${results.length} versículos encontrados`}
                        </span>
                      </div>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-foreground mt-0.5">
                        {detectedConcept.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {detectedConcept.description}
                      </p>
                    </div>
                  </div>
                </div>

                {matchedConcepts.length > 1 && (
                  <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-muted-foreground">{isEn ? "Other related themes:" : "Outros temas relacionados:"}</span>
                    {matchedConcepts.map((c) => {
                      const isCurrent = c.id === detectedConcept.id;
                      const cVisual = getMomentVisual(c.id);
                      const CIcon = cVisual.icon;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setDetectedConcept(c);
                            handleSearch(c.name);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-accent text-accent-foreground shadow-2xs"
                              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <CIcon className="h-3 w-3 shrink-0" />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Quick Category Tabs with Counts */}
          <div className="flex gap-1.5 overflow-x-auto pb-2.5 scroll-smooth themed-scrollbar border-b border-border/30 relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
            {[
              { id: "todos", label: isEn ? "All and Highlights" : "Todos e Destaques", icon: Compass },
              ...(searched && results.length > 0 ? [{ id: "versiculos", label: isEn ? `Verses (${results.length})` : `Versículos (${results.length})`, icon: BookOpen }] : []),
              { id: "momentos", label: isEn ? `Life Moments (${filteredMoments.length})` : `Momentos da Vida (${filteredMoments.length})`, icon: Heart },
              { id: "planos", label: isEn ? `Daily Plans (${filteredReadingPlans.length})` : `Planos Diários (${filteredReadingPlans.length})`, icon: Calendar },
              { id: "personagens", label: isEn ? `Characters (${filteredCharacters.length})` : `Personagens (${filteredCharacters.length})`, icon: User },
              { id: "assuntos", label: isEn ? `Knowledge (${filteredTopics.length})` : `Conhecimento (${filteredTopics.length})`, icon: BookOpen },
              { id: "devocionais", label: isEn ? `Devotionals (${filteredDevotionals.length})` : `Devocionais (${filteredDevotionals.length})`, icon: Flame },
              { id: "passagens", label: isEn ? `Popular Passages (${filteredPopularVerses.length})` : `Passagens Populares (${filteredPopularVerses.length})`, icon: Star },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors select-none cursor-pointer ${
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                    {isEn ? "Related Knowledge and Characters" : "Conhecimento e Personagens Relacionados"}{" "}
                    <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                      ({matchedEntities.length})
                    </span>
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
                      className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group overflow-hidden w-full"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                            {entity.badge.split("•")[0].trim()}
                          </span>
                          <button
                            onClick={() => handleAskAI(entity.aiPrompt)}
                            className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0 cursor-pointer"
                            title={isEn ? "Ask AI" : "Perguntar à IA"}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground truncate">
                          {stripLeadingNumber(entity.name)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                          {entity.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleAskAI(entity.aiPrompt)}
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                        >
                          <Bot className="h-3.5 w-3.5" /> {isEn ? "Ask AI" : "Perguntar à IA"}
                        </button>
                        <button
                          onClick={() => handleSearch(shortName)}
                          className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 max-w-full truncate cursor-pointer"
                        >
                          <Search className="h-3 w-3 shrink-0" /> <span className="truncate">{isEn ? `Search for ${shortName}` : `Buscar sobre ${shortName}`}</span>
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
              <p className="text-xs text-muted-foreground">
                {isEn ? "Searching verses in the Holy Bible..." : "Buscando versículos na Bíblia Sagrada..."}
              </p>
            </div>
          )}

          {!loading && searched && activeTab === "todos" && results.length === 0 && matchedEntities.length === 0 && filteredCharacters.length === 0 && filteredTopics.length === 0 && filteredDevotionals.length === 0 && filteredPopularVerses.length === 0 && filteredReadingPlans.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {isEn ? "No results found for your search. Try again with different terms." : "Não há resultados para sua pesquisa tente novamente mais tarde."}
              </p>
              <button
                onClick={() => handleAskAI(isEn ? `What does the Bible teach about: ${searchQuery}?` : `O que a Bíblia ensina sobre: ${searchQuery}?`)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/90 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> {isEn ? `Ask Biblical AI about "${searchQuery}"` : `Perguntar à IA Bíblica sobre "${searchQuery}"`}
              </button>
            </div>
          )}

          {!loading && (activeTab === "todos" || activeTab === "versiculos") && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                    {isEn ? "Verses in the Bible" : "Versículos na Bíblia"}{" "}
                    <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                      ({results.length})
                    </span>
                  </h2>
                </div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{reference}</p>
                            {r.conceptName && (() => {
                              const vVisual = getMomentVisual(r.conceptId);
                              const VIcon = vVisual.icon;
                              return (
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 ${vVisual.badgeBg} ${vVisual.badgeText}`}>
                                  <VIcon className="h-2.5 w-2.5 shrink-0" />
                                  <span>{r.conceptName}</span>
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => toggleReaction(e, "favorites")} title={isEn ? "Favorites" : "Favoritos"} className={`p-1 transition-colors cursor-pointer ${isFavorite(verseId, "favorites") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <Heart className={`h-3.5 w-3.5 ${isFavorite(verseId, "favorites") ? "fill-accent" : ""}`} />
                            </button>
                            <button onClick={(e) => toggleReaction(e, "markings")} title={isEn ? "Highlights" : "Marcações"} className={`p-1 transition-colors cursor-pointer ${isFavorite(verseId, "markings") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <Highlighter className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={(e) => toggleReaction(e, "notes")} title={isEn ? "Notes" : "Anotações"} className={`p-1 transition-colors cursor-pointer ${isFavorite(verseId, "notes") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="font-serif text-xs sm:text-sm leading-relaxed text-card-foreground">"{r.text}"</p>
                        {r.contextReason && (
                          <div className="mt-2.5 pt-2 border-t border-border/20 flex items-center gap-1.5 text-[11px] text-accent/90 font-medium">
                            <Sparkles className="h-3 w-3 shrink-0 text-accent" />
                            <span className="leading-snug">{r.contextReason}</span>
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && activeTab === "versiculos" && results.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
              {isEn ? "No verses found for your search." : "Não há versículos encontrados para sua busca."}
            </div>
          )}

          {/* HISTORY AND SUGGESTIONS WHEN NOT SEARCHED OR BELOW SEARCH */}
          <div className="space-y-6 pt-2">
            
            {/* History if available */}
            {!searched && activeTab === "todos" && history.length > 0 && (
              <div className="glass-card rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 space-y-3 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/15 text-accent border border-accent/20">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="font-serif text-sm font-bold text-foreground">
                      {isEn ? "Search History" : "Histórico de Buscas"}
                    </span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{isEn ? "Clear" : "Limpar"}</span>
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
                        title={isEn ? "Remove from history" : "Remover do histórico"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MOMENTOS DA VIDA E EMOÇÕES */}
            {((activeTab === "todos" && filteredMoments.length > 0) || activeTab === "momentos") && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Heart className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {activeTab === "momentos" 
                        ? (isEn ? "All Categories" : "Todas as Categorias") 
                        : (isEn ? "Life Moments and Feelings" : "Momentos da Vida e Sentimentos")}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredMoments.length})
                      </span>
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <button
                      onClick={() => setActiveTab("momentos")}
                      className="text-xs text-accent hover:underline font-medium shrink-0 whitespace-nowrap pt-0.5 cursor-pointer"
                    >
                      {isEn ? `View All (${filteredMoments.length}) →` : `Ver Todos (${filteredMoments.length}) →`}
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredMoments.slice(0, activeTab === "todos" ? 4 : visibleMomentsCount).map((moment) => {
                    const visual = getMomentVisual(moment.id);
                    const MomentIcon = visual.icon;
                    return (
                      <motion.div
                        key={moment.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card rounded-xl p-3.5 sm:p-4 space-y-3 border border-border/40 ${visual.accentBorder} transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group overflow-hidden w-full`}
                      >
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.iconBg} border ${visual.iconBorder} shadow-2xs`}>
                                <MomentIcon className={`h-5 w-5 ${visual.iconColor}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${visual.badgeBg} ${visual.badgeText}`}>
                                    {moment.badge}
                                  </span>
                                </div>
                                <h3 className="font-serif text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors truncate mt-0.5">
                                  {moment.name}
                                </h3>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {moment.description}
                          </p>

                          {/* Quick curated verses pill tags */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {moment.curatedVerses.slice(0, 3).map((v, vi) => (
                              <span
                                key={vi}
                                className="text-[10px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-md font-mono"
                              >
                                {v.reference}
                              </span>
                            ))}
                            {moment.curatedVerses.length > 3 && (
                              <span className="text-[10px] text-muted-foreground/80 px-1 py-0.5">
                                +{moment.curatedVerses.length - 3} {isEn ? "more" : "mais"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 truncate">
                            <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            {moment.curatedVerses.length} {isEn ? "passages" : "passagens"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDetectedConcept(moment);
                              handleSearch(moment.name);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline shrink-0 ml-auto cursor-pointer group-hover:translate-x-0.5 transition-transform"
                          >
                            <span>{isEn ? "View Verses" : "Ver Versículos"}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredMoments.length === 0 && activeTab === "momentos" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No life moments found for your search." : "Nenhum momento da vida encontrado para sua busca."}
                  </div>
                )}

                {activeTab === "momentos" && visibleMomentsCount < filteredMoments.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleMomentsCount(prev => prev + 12)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Moments (${filteredMoments.length - visibleMomentsCount} remaining)` : `Carregar Mais Momentos (${filteredMoments.length - visibleMomentsCount} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PLANOS DIÁRIOS DE LEITURA */}
            {((activeTab === "todos" && filteredReadingPlans.length > 0) || activeTab === "planos") && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Calendar className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {isEn ? "Daily Reading Plans" : "Planos Diários de Leitura"}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredReadingPlans.length})
                      </span>
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <Link
                      to="/devocionais"
                      className="text-xs text-accent hover:underline font-medium shrink-0 whitespace-nowrap pt-0.5"
                    >
                      {isEn ? "View in Devotionals →" : "Ver em Devocionais →"}
                    </Link>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredReadingPlans.slice(0, activeTab === "todos" ? 4 : visiblePlansCount).map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 overflow-hidden w-full"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold border ${plan.bgGradient}`}>
                            {plan.badge}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" /> {plan.durationDays} {isEn ? "Days" : "Dias"}
                          </span>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground truncate">{plan.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{plan.description}</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider truncate">{plan.category}</span>
                        <Link
                          to="/devocionais"
                          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline shrink-0 ml-auto"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> {isEn ? "Access Plan →" : "Acessar Plano →"}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredReadingPlans.length === 0 && activeTab === "planos" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No reading plans found for your search." : "Nenhum plano de leitura encontrado para sua busca."}
                  </div>
                )}

                {activeTab === "planos" && visiblePlansCount < filteredReadingPlans.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisiblePlansCount(prev => prev + 12)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Plans (${filteredReadingPlans.length - visiblePlansCount} remaining)` : `Carregar Mais Planos (${filteredReadingPlans.length - visiblePlansCount} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PERSONAGENS BÍBLICOS (100+) */}
            {((activeTab === "todos" && filteredCharacters.length > 0) || activeTab === "personagens") && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {isEn ? "Biblical Characters" : "Personagens Bíblicos"}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredCharacters.length})
                      </span>
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <button
                      onClick={() => setActiveTab("personagens")}
                      className="text-xs text-accent hover:underline font-medium shrink-0 whitespace-nowrap pt-0.5"
                    >
                      {isEn ? `View More (${filteredCharacters.length}) →` : `Ver Mais (${filteredCharacters.length}) →`}
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
                        className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group overflow-hidden w-full"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                              {p.badge.split("•")[0].trim()}
                            </span>
                            <button
                              onClick={() => handleAskAI(p.aiPrompt)}
                              title={isEn ? "Ask Biblical AI" : "Perguntar à IA Bíblica"}
                              className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-foreground truncate">{stripLeadingNumber(p.name)}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {p.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => handleAskAI(p.aiPrompt)}
                            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                          >
                            <Bot className="h-3.5 w-3.5" /> {isEn ? "Ask AI" : "Perguntar à IA"}
                          </button>
                          <button
                            onClick={() => handleSearch(shortName)}
                            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 max-w-full truncate"
                          >
                            <Search className="h-3 w-3 shrink-0" /> <span className="truncate">{isEn ? `Search for ${shortName}` : `Buscar sobre ${shortName}`}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredCharacters.length === 0 && activeTab === "personagens" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No results found for your search. Try again later." : "Não há resultados para sua pesquisa tente novamente mais tarde."}
                  </div>
                )}

                {activeTab === "personagens" && visibleCharactersCount < filteredCharacters.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleCharactersCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Characters (${filteredCharacters.length - visibleCharactersCount} remaining)` : `Carregar Mais Personagens (${filteredCharacters.length - visibleCharactersCount} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CONHECIMENTO E TEMAS (100+) */}
            {((activeTab === "todos" && filteredTopics.length > 0) || activeTab === "assuntos") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <BookOpen className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {isEn ? "Biblical Knowledge and Themes" : "Conhecimento e Temas Bíblicos"}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredTopics.length})
                      </span>
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <button
                      onClick={() => setActiveTab("assuntos")}
                      className="text-xs text-accent hover:underline font-medium shrink-0 whitespace-nowrap pt-0.5"
                    >
                      {isEn ? `View More (${filteredTopics.length}) →` : `Ver Mais (${filteredTopics.length}) →`}
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
                        className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between hover:shadow-md hover:shadow-accent/5 group overflow-hidden w-full"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="rounded bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent line-clamp-1">
                              {a.badge.split("•")[0].trim()}
                            </span>
                            <button
                              onClick={() => handleAskAI(a.aiPrompt)}
                              className="text-muted-foreground hover:text-accent p-1 transition-colors shrink-0"
                              title={isEn ? "Ask AI" : "Perguntar à IA"}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <h3 className="font-serif text-sm font-bold text-foreground truncate">{stripLeadingNumber(a.name)}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {a.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => handleAskAI(a.aiPrompt)}
                            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
                          >
                            <Bot className="h-3.5 w-3.5" /> {isEn ? "Ask AI" : "Perguntar à IA"}
                          </button>
                          <button
                            onClick={() => handleSearch(shortName)}
                            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 min-w-0 max-w-full truncate"
                          >
                            <Search className="h-3 w-3 shrink-0" /> <span className="truncate">{isEn ? `Search for ${shortName}` : `Buscar sobre ${shortName}`}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredTopics.length === 0 && activeTab === "assuntos" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No results found for your search. Try again later." : "Não há resultados para sua pesquisa tente novamente mais tarde."}
                  </div>
                )}

                {activeTab === "assuntos" && visibleTopicsCount < filteredTopics.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleTopicsCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Knowledge (${filteredTopics.length - visibleTopicsCount} remaining)` : `Carregar Mais Conhecimentos (${filteredTopics.length - visibleTopicsCount} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEVOCIONAIS (100+) */}
            {((activeTab === "todos" && filteredDevotionals.length > 0) || activeTab === "devocionais") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Flame className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {isEn ? "Related Devotionals" : "Devocionais Relacionados"}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredDevotionals.length})
                      </span>
                    </h2>
                  </div>
                  {activeTab === "todos" && (
                    <Link
                      to="/devocionais"
                      className="text-xs text-accent hover:underline font-medium shrink-0 whitespace-nowrap pt-0.5"
                    >
                      {isEn ? "Go to Devotionals →" : "Ir para Devocionais →"}
                    </Link>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredDevotionals.slice(0, activeTab === "todos" ? 6 : visibleDevotionalsCount).map((d) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/60 transition-all flex flex-col justify-between overflow-hidden w-full"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase text-accent truncate">
                            {d.category}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{d.reference}</span>
                        </div>
                        <h3 className="font-serif text-sm font-bold text-foreground truncate">{d.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{d.summary}</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDevotional(d)}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> {isEn ? "View Devotional" : "Ver Devocional"}
                        </button>
                        <button
                          onClick={() => toggleDevotionalFavorite(d.numId)}
                          className={`p-1 text-xs transition-colors cursor-pointer ${
                            devotionalFavorites.includes(d.numId) ? "text-accent" : "text-muted-foreground hover:text-accent"
                          }`}
                          title={isEn ? "Favorite Devotional" : "Favoritar Devocional"}
                        >
                          <Heart className={`h-3.5 w-3.5 ${devotionalFavorites.includes(d.numId) ? "fill-accent" : ""}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredDevotionals.length === 0 && activeTab === "devocionais" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No results found for your search. Try again later." : "Não há resultados para sua pesquisa tente novamente mais tarde."}
                  </div>
                )}

                {activeTab === "devocionais" && visibleDevotionalsCount < filteredDevotionals.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleDevotionalsCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Devotionals (${filteredDevotionals.length - visibleDevotionalsCount} remaining)` : `Carregar Mais Devocionais (${filteredDevotionals.length - visibleDevotionalsCount} restantes)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PASSAGENS BÍBLICAS POPULARES (100+) */}
            {((activeTab === "todos" && filteredPopularVerses.length > 0) || activeTab === "passagens") && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Star className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <h2 className="font-serif text-sm sm:text-base font-bold text-foreground leading-snug">
                      {isEn ? "Most Searched Biblical Passages" : "Passagens Bíblicas Mais Buscadas"}{" "}
                      <span className="text-xs font-normal text-muted-foreground font-sans whitespace-nowrap">
                        ({filteredPopularVerses.length})
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredPopularVerses.slice(0, activeTab === "todos" ? 6 : visibleVersesCount).map((pv, i) => (
                    <div key={i} className="glass-card rounded-xl p-3.5 sm:p-4 space-y-2 border border-border/40 hover:border-accent/50 transition-all flex flex-col justify-between overflow-hidden w-full">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider truncate">{pv.reference}</span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground truncate">{stripLeadingNumber(pv.theme)}</span>
                        </div>
                        <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{pv.text}"</p>
                      </div>

                      <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleSearch(pv.reference)}
                          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Search className="h-3 w-3" /> {isEn ? "Read / Search" : "Ler / Buscar"}
                        </button>
                        <button
                          onClick={() => handleAskAI(isEn ? `Explain the context and theological meaning of ${pv.reference}` : `Me explique o contexto e o significado teológico de ${pv.reference}`)}
                          className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {isEn ? "Explain with AI" : "Explicar na IA"} <Sparkles className="h-3 w-3 text-accent" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPopularVerses.length === 0 && activeTab === "passagens" && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-medium text-muted-foreground my-2">
                    {isEn ? "No results found for your search. Try again later." : "Não há resultados para sua pesquisa tente novamente mais tarde."}
                  </div>
                )}

                {activeTab === "passagens" && visibleVersesCount < filteredPopularVerses.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleVersesCount(prev => prev + 16)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-accent hover:text-accent transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4" /> {isEn ? `Load More Passages (${filteredPopularVerses.length - visibleVersesCount} remaining)` : `Carregar Mais Passagens (${filteredPopularVerses.length - visibleVersesCount} restantes)`}
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
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bible Verse Box */}
              {selectedDevotional.verse && (
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {isEn ? "Base Verse" : "Versículo Base"}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`"${selectedDevotional.verse}" - ${selectedDevotional.reference}`);
                        setCopiedVerse(true);
                        setTimeout(() => setCopiedVerse(false), 2000);
                      }}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedVerse ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedVerse ? (isEn ? "Copied!" : "Copiado!") : (isEn ? "Copy" : "Copiar")}
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
                  <Sun className="h-4 w-4 text-accent" /> {isEn ? "Reflection for Today" : "Reflexão para Hoje"}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-sans">
                  {selectedDevotional.meditation}
                </p>
              </div>

              {/* Prayer */}
              {selectedDevotional.prayer && (
                <div className="rounded-xl border border-border/50 bg-secondary/50 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-accent" /> {isEn ? "Prayer for Today" : "Oração para Hoje"}
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
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      devotionalFavorites.includes(selectedDevotional.numId)
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${devotionalFavorites.includes(selectedDevotional.numId) ? "fill-accent text-accent" : ""}`} />
                    {devotionalFavorites.includes(selectedDevotional.numId) 
                      ? (isEn ? "Favorited" : "Favoritado") 
                      : (isEn ? "Favorite" : "Favoritar")}
                  </button>

                  <button
                    onClick={() => {
                      const fullText = `${selectedDevotional.title}\n${selectedDevotional.reference}\n\n"${selectedDevotional.verse}"\n\n${isEn ? "REFLECTION:" : "REFLEXÃO:"}\n${selectedDevotional.meditation}\n\n${isEn ? "PRAYER:" : "ORAÇÃO:"}\n${selectedDevotional.prayer}`;
                      navigator.clipboard.writeText(fullText);
                      setCopiedDevotional(true);
                      setTimeout(() => setCopiedDevotional(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-accent transition-all cursor-pointer"
                  >
                    {copiedDevotional ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copiedDevotional ? (isEn ? "Copied!" : "Copiado!") : (isEn ? "Copy" : "Copiar")}
                  </button>

                  <button
                    onClick={() => {
                      const fullText = `📖 ${selectedDevotional.title}\n\n📜 "${selectedDevotional.verse}" (${selectedDevotional.reference})\n\n✍️ ${isEn ? "REFLECTION:" : "REFLEXÃO:"}\n${selectedDevotional.meditation}\n\n🙏 ${isEn ? "PRAYER:" : "ORAÇÃO:"}\n${selectedDevotional.prayer}`;
                      shareBibleText(fullText, `${isEn ? "Devotional:" : "Devocional:"} ${selectedDevotional.title}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    {isEn ? "Share" : "Compartilhar"}
                  </button>
                </div>

                <Link
                  to="/devocionais"
                  onClick={() => setSelectedDevotional(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  {isEn ? "Go to Daily Devotionals →" : "Ir para Devocionais Diários →"}
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

