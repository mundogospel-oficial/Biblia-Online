import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Heart, Trash2, Copy, BookOpen, Lightbulb } from "lucide-react";
import { getFavorites, removeFavorite, addFavorite, isFavorite, FavoriteVerse } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const recommendations = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", reference: "João 3:16" },
  { text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "Não temas, porque eu sou contigo.", reference: "Isaías 41:10" },
  { text: "Confia no Senhor de todo o teu coração.", reference: "Provérbios 3:5" },
  { text: "Os que esperam no Senhor renovarão as forças.", reference: "Isaías 40:31" },
];

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(getFavorites());
  const { toast } = useToast();

  const handleRemove = (id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
    toast({ title: "Removido dos favoritos" });
  };

  const handleCopy = (fav: FavoriteVerse) => {
    navigator.clipboard.writeText(`"${fav.text}" — ${fav.reference}`);
    toast({ title: "Versículo copiado!" });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
            <h1 className="font-serif text-lg font-bold text-foreground sm:text-2xl">Favoritos</h1>
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum versículo salvo ainda.</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">Toque no ❤ para salvar versículos.</p>
              <Link to="/" className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Explorar Bíblia</Link>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {favorites.map((fav) => (
                  <motion.div key={fav.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
                    className="glass-card rounded-lg p-3"
                  >
                    <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">{fav.reference}</p>
                    <p className="font-serif text-xs leading-relaxed text-card-foreground">"{fav.text}"</p>
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => handleCopy(fav)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary"><Copy className="h-2.5 w-2.5" /> Copiar</button>
                      <button onClick={() => handleRemove(fav.id)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-destructive hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5" /> Remover</button>
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
                const recId = `rec:${r.reference}`;
                const favorited = isFavorite(recId);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="cursor-pointer glass-card rounded-lg p-3 transition-colors hover:!border-accent"
                    onClick={() => {
                      if (favorited) {
                        removeFavorite(recId);
                        toast({ title: "Removido dos favoritos" });
                      } else {
                        addFavorite({ id: recId, text: r.text, reference: r.reference });
                        toast({ title: "Adicionado aos favoritos! ❤️" });
                      }
                      setFavorites(getFavorites());
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">{r.reference}</p>
                      <Heart className={`h-3.5 w-3.5 transition-colors ${favorited ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{r.text}"</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default FavoritesPage;
