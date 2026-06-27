import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Heart, Trash2, Copy, BookOpen, Lightbulb, Highlighter, StickyNote } from "lucide-react";
import { getFavorites, removeFavorite, addFavorite, isFavorite, FavoriteVerse, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";

const recommendations = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", reference: "João 3:16" },
  { text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "Não temas, porque eu sou contigo.", reference: "Isaías 41:10" },
  { text: "Confia no Senhor de todo o teu coração.", reference: "Provérbios 3:5" },
  { text: "Os que esperam no Senhor renovarão as forças.", reference: "Isaías 40:31" },
];

const FavoritesPage = () => {
  const [activeTab, setActiveTab] = useState<ReactionType>("favorites");
  const [items, setItems] = useState<FavoriteVerse[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setItems(getFavorites(activeTab));
  }, [activeTab]);

  const handleRemove = (id: string) => {
    removeFavorite(id, activeTab);
    setItems(getFavorites(activeTab));
    toast({ title: `Removido de ${getLabel()}` });
  };

  const handleCopy = (item: FavoriteVerse) => {
    navigator.clipboard.writeText(`"${item.text}" — ${item.reference}`);
    toast({ title: "Versículo copiado!" });
  };

  const getLabel = () => {
    switch (activeTab) {
      case "favorites": return "Favoritos";
      case "markings": return "Marcações";
      case "notes": return "Anotações";
    }
  };

  const getIcon = (className?: string) => {
    switch (activeTab) {
      case "favorites": return <Heart className={className} />;
      case "markings": return <Highlighter className={className} />;
      case "notes": return <StickyNote className={className} />;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "favorites": return "Nenhum versículo salvo ainda.";
      case "markings": return "Nenhuma marcação feita ainda.";
      case "notes": return "Nenhuma anotação feita ainda.";
    }
  };

  const getInstructions = () => {
    switch (activeTab) {
      case "favorites": return "Toque no ❤ para salvar versículos.";
      case "markings": return "Toque no ícone de marcador para salvar.";
      case "notes": return "Toque no ícone de anotar para salvar.";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex gap-2">
          {(["favorites", "markings", "notes"] as ReactionType[]).map((tab) => {
            const isActive = activeTab === tab;
            let label = "";
            let IconComp: any = Heart;

            if (tab === "markings") {
              label = "Marcações";
              IconComp = Highlighter;
            } else if (tab === "notes") {
              label = "Anotações";
              IconComp = StickyNote;
            } else {
              label = "Favoritos";
              IconComp = Heart;
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[12px] font-bold transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-[#1e293b] text-white/90"
                }`}
              >
                <IconComp className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeTab}>
          <div className="mb-4 flex items-center gap-2">
            {getIcon("h-5 w-5 text-accent sm:h-6 sm:w-6")}
            <h1 className="font-serif text-lg font-bold text-foreground sm:text-2xl">{getLabel()}</h1>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{getEmptyMessage()}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{getInstructions()}</p>
              <Link to="/" className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Explorar Biblia</Link>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }}
                    className="glass-card rounded-lg p-3"
                  >
                    <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">{item.reference}</p>
                    <p className="font-serif text-xs leading-relaxed text-card-foreground">"{item.text}"</p>
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => handleCopy(item)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary"><Copy className="h-2.5 w-2.5" /> Copiar</button>
                      <button onClick={() => handleRemove(item.id)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-destructive hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5" /> Remover</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Recomendações</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {recommendations.map((r, i) => {
                // Generate a version-agnostic ID: "book_abbrev:chapter:verse"
                const refParts = r.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
                let recId = `rec:${r.reference}`;
                
                if (refParts) {
                  const [_, bookName, chapter, verse] = refParts;
                  const book = bibleBooks.find(b => b.name.toLowerCase() === bookName.toLowerCase());
                  if (book) {
                    recId = `${book.abbrev}:${chapter}:${verse}`;
                  }
                }

                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="glass-card rounded-lg p-3 transition-colors hover:!border-accent"
                  >
                    <div className="flex items-start justify-between">
                      <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">{r.reference}</p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            if (isFavorite(recId, "favorites")) removeFavorite(recId, "favorites");
                            else addFavorite({ id: recId, text: r.text, reference: r.reference }, "favorites");
                            setItems(getFavorites(activeTab));
                            toast({ title: isFavorite(recId, "favorites") ? "Salvo em Favoritos!" : "Removido" });
                          }} 
                          className={`p-1 transition-colors ${isFavorite(recId, "favorites") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                        >
                          <Heart className={`h-3 w-3 ${isFavorite(recId, "favorites") ? "fill-accent" : ""}`} />
                        </button>
                        <button 
                          onClick={() => {
                            if (isFavorite(recId, "markings")) removeFavorite(recId, "markings");
                            else addFavorite({ id: recId, text: r.text, reference: r.reference }, "markings");
                            setItems(getFavorites(activeTab));
                            toast({ title: isFavorite(recId, "markings") ? "Salvo em Marcações!" : "Removido" });
                          }} 
                          className={`p-1 transition-colors ${isFavorite(recId, "markings") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                        >
                          <Highlighter className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => {
                            if (isFavorite(recId, "notes")) removeFavorite(recId, "notes");
                            else addFavorite({ id: recId, text: r.text, reference: r.reference }, "notes");
                            setItems(getFavorites(activeTab));
                            toast({ title: isFavorite(recId, "notes") ? "Salvo em Anotações!" : "Removido" });
                          }} 
                          className={`p-1 transition-colors ${isFavorite(recId, "notes") ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                        >
                          <StickyNote className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{r.text}"</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
    </div>
  );
};

export default FavoritesPage;
