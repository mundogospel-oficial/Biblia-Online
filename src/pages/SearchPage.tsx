import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Search, Loader2, Clock, X, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";
import { isFavorite, addFavorite, removeFavorite, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { Heart, Highlighter, StickyNote } from "lucide-react";

interface SearchResult {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

const searchSuggestions = [
  "João 3:16", "Salmos 23", "Gênesis 1", "Romanos 8:28",
  "Provérbios 3:5-6", "Filipenses 4:13", "Isaías 41:10",
];

const filterCategories = [
  { key: "all", label: "Todos" },
  { key: "keyword", label: "Palavra-chave" },
  { key: "subject", label: "Assunto" },
  { key: "character", label: "Personagem" },
];

const subjectSuggestions: Record<string, string[]> = {
  keyword: ["amor", "fé", "esperança", "paz", "salvação", "graça"],
  subject: ["criação", "aliança", "profecia", "milagres", "parábolas"],
  character: ["Moisés", "Davi", "Jesus", "Paulo", "Abraão", "Maria"],
};

const HISTORY_KEY = "bible-search-history";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const addToHistory = (q: string) => {
    const updated = [q, ...history.filter(h => h !== q)].slice(0, 20);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const removeFromHistory = (q: string) => {
    const updated = history.filter(h => h !== q);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleSearch = async (searchText: string) => {
    const q = searchText || query;
    if (!q.trim() || loading) return;
    setQuery(q);
    setLoading(true);
    setSearched(true);
    addToHistory(q);
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=almeida`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.verses?.map((v: any) => ({ book_name: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text })) || []);
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
          <h1 className="mb-3 font-serif text-xl font-bold text-foreground sm:text-2xl">Buscar na Bíblia</h1>

          <form onSubmit={(e) => { e.preventDefault(); handleSearch(""); }} className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Ex: João 3:16, amor, Davi..."
                className={`w-full rounded-xl glass-card py-3 ${query ? "pl-4" : "pl-10"} pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200`}
              />
              {!query && <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
            </div>
            <button type="submit" disabled={loading} className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 liquid-btn">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </button>
          </form>

          {/* Filters */}
          <div className="mb-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {filterCategories.map((f) => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors liquid-btn ${
                    activeFilter === f.key ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions and history */}
          {!searched && (
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">💡 Sugestões</p>
                <div className="flex flex-wrap gap-1.5">
                  {(activeFilter !== "all" ? subjectSuggestions[activeFilter] || [] : searchSuggestions).map((s) => (
                    <button key={s} onClick={() => handleSearch(s)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-card-foreground hover:border-accent liquid-btn">{s}</button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Histórico
                    </div>
                    <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">Limpar</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <div key={h} className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1">
                        <button onClick={() => handleSearch(h)} className="text-xs text-card-foreground hover:text-foreground">{h}</button>
                        <button onClick={() => removeFromHistory(h)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}

          {!loading && searched && results.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Nenhum resultado. Tente "João 3:16".</p>
          )}

          {!loading && results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.map((r, i) => {
                const abbrev = findAbbrev(r.book_name);
                const verseId = `${abbrev}:${r.chapter}:${r.verse}`;
                const reference = `${r.book_name} ${r.chapter}:${r.verse}`;

                const toggleReaction = (e: React.MouseEvent, type: ReactionType) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isFavorite(verseId, type)) {
                    removeFavorite(verseId, type);
                    toast({ title: "Removido" });
                  } else {
                    addFavorite({ id: verseId, text: r.text, reference }, type);
                    toast({ title: "Salvo!" });
                  }
                  setRefreshTrigger(p => p + 1);
                };

                return (
                  <motion.div key={`${i}-${refreshTrigger}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <Link to={`/livro/${abbrev}/${r.chapter}`} className="relative block rounded-xl glass-card p-4 transition-colors hover:!border-accent liquid-btn">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-accent">{reference}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => toggleReaction(e, "favorites")} className={`p-1 transition-colors ${isFavorite(verseId, "favorites") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                            <Heart className={`h-3.5 w-3.5 ${isFavorite(verseId, "favorites") ? "fill-accent" : ""}`} />
                          </button>
                          <button onClick={(e) => toggleReaction(e, "markings")} className={`p-1 transition-colors ${isFavorite(verseId, "markings") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                            <Highlighter className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => toggleReaction(e, "notes")} className={`p-1 transition-colors ${isFavorite(verseId, "notes") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
                            <StickyNote className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="font-serif text-sm leading-relaxed text-card-foreground">{r.text}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default SearchPage;
