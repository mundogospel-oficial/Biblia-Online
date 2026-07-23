import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Heart, Trash2, Copy, BookOpen, Lightbulb, Highlighter, StickyNote, Edit3, Check, X, Sparkles } from "lucide-react";
import { getFavorites, removeFavorite, addFavorite, isFavorite, updateNote, FavoriteVerse, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";

interface RecommendationItem {
  text: string;
  reference: string;
  theme?: string;
}

const recommendationsByTab: Record<ReactionType, { title: string; subtitle: string; items: RecommendationItem[] }> = {
  favorites: {
    title: "Recomendações para Favoritos",
    subtitle: "Versículos de amor, consolo, fé e promessas de Deus para guardar no coração.",
    items: [
      { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16", theme: "Amor de Deus" },
      { text: "O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.", reference: "Salmos 23:1", theme: "Cuidado Divino" },
      { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13", theme: "Força & Vitória" },
      { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento.", reference: "Isaías 41:10", theme: "Proteção" },
      { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5", theme: "Confiança" },
      { text: "Os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão.", reference: "Isaías 40:31", theme: "Esperança" },
      { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal.", reference: "Jeremias 29:11", theme: "Futuro & Paz" },
      { text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", reference: "Romanos 8:28", theme: "Propósito" },
    ]
  },
  markings: {
    title: "Recomendações para Marcações",
    subtitle: "Trechos de sabedoria, conduta, princípios e ensinamentos essenciais da Palavra.",
    items: [
      { text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.", reference: "Salmos 119:105", theme: "Direção" },
      { text: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.", reference: "Romanos 12:2", theme: "Transformação" },
      { text: "O temor do Senhor é o princípio da sabedoria, e o conhecimento do Santo é prudência.", reference: "Provérbios 9:10", theme: "Sabedoria" },
      { text: "Toda a Escritura é divinamente inspirada e proveitosa para ensinar, para redarguir, para corrigir, para instruir em justiça.", reference: "2 Timóteo 3:16", theme: "Ensino" },
      { text: "E sede cumpridores da palavra e não somente ouvintes, enganando-vos a vós mesmos.", reference: "Tiago 1:22", theme: "Prática da Fé" },
      { text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, temperança.", reference: "Gálatas 5:22", theme: "Fruta do Espírito" },
      { text: "Guardei a tua palavra no meu coração, para não pecar contra ti.", reference: "Salmos 119:11", theme: "Santidade" },
      { text: "Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, nisso pensai.", reference: "Filipenses 4:8", theme: "Mente Pura" },
    ]
  },
  notes: {
    title: "Recomendações para Anotações & Reflexão",
    subtitle: "Passagens profundas para meditação, oração e anotações do seu diário espiritual.",
    items: [
      { text: "Sonda-me, ó Deus, e conhece o meu coração; prova-me e conhece os meus pensamentos. E vê se há em mim algum caminho mau.", reference: "Salmos 139:23", theme: "Auto-exame" },
      { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei. Tomai sobre vós o meu jugo, e aprendei de mim.", reference: "Mateus 11:28", theme: "Descanso" },
      { text: "Clama a mim, e responder-te-ei e anunciar-te-ei coisas grandes e firmes, que não sabes.", reference: "Jeremias 33:3", theme: "Oração" },
      { text: "Buscai primeiro o Reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", reference: "Mateus 6:33", theme: "Prioridades" },
      { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7", theme: "Entrega" },
      { text: "Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações; serei exaltado sobre a terra.", reference: "Salmos 46:10", theme: "Meditação" },
      { text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus.", reference: "Filipenses 4:6", theme: "Gratidão" },
      { text: "Sejam agradáveis as palavras da minha boca e a meditação do meu coração perante a tua face.", reference: "Salmos 19:14", theme: "Devoção" },
    ]
  }
};

const FavoritesPage = () => {
  const [activeTab, setActiveTab] = useState<ReactionType>("favorites");
  const [items, setItems] = useState<FavoriteVerse[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setItems(getFavorites(activeTab));
    setEditingNoteId(null);
  }, [activeTab]);

  const handleRemove = (id: string) => {
    removeFavorite(id, activeTab);
    setItems(getFavorites(activeTab));
    toast({ title: `Removido de ${getLabel()}` });
  };

  const handleCopy = (item: FavoriteVerse) => {
    const textToCopy = item.note 
      ? `"${item.text}" — ${item.reference}\nNota: ${item.note}`
      : `"${item.text}" — ${item.reference}`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Versículo copiado" });
  };

  const handleStartEditNote = (item: FavoriteVerse) => {
    setEditingNoteId(item.id);
    setNoteInputValue(item.note || "");
  };

  const handleSaveNoteText = (id: string) => {
    updateNote(id, noteInputValue.trim(), "notes");
    setItems(getFavorites("notes"));
    setEditingNoteId(null);
    toast({ title: noteInputValue.trim() ? "Anotação salva" : "Anotação removida" });
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
      case "favorites": return "Nenhum versículo nos favoritos ainda.";
      case "markings": return "Nenhuma marcação feita ainda.";
      case "notes": return "Nenhuma anotação feita ainda.";
    }
  };

  const getInstructions = () => {
    switch (activeTab) {
      case "favorites": return "Toque no ❤ para guardar seus versículos mais amados.";
      case "markings": return "Toque no ícone de marca texto para destacar versículos.";
      case "notes": return "Toque no ícone de nota para criar anotações e meditações.";
    }
  };

  const currentTabRecs = recommendationsByTab[activeTab];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex p-1 gap-1 rounded-full bg-secondary/40 border border-border/60 backdrop-blur-xl shadow-inner relative select-none max-w-lg mx-auto">
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
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-bold transition-colors duration-200 ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFavoriteTabPill"
                      className="absolute inset-0 rounded-full bg-primary shadow-md"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <IconComp className="h-4 w-4" />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={activeTab}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getIcon("h-5 w-5 text-accent sm:h-6 sm:w-6")}
                <h1 className="font-serif text-lg font-bold text-foreground sm:text-2xl">{getLabel()}</h1>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12 px-4 text-center">
                <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">{getEmptyMessage()}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">{getInstructions()}</p>
                <Link to="/" className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90">
                  Explorar Bíblia
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const isEditingNote = editingNoteId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="glass-card rounded-lg p-3.5 space-y-2 border border-border/40 shadow-sm hover:border-accent/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{item.reference}</p>
                          <div className="flex items-center gap-1">
                            {activeTab === "notes" && (
                              <button
                                onClick={() => isEditingNote ? setEditingNoteId(null) : handleStartEditNote(item)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-accent hover:bg-accent/10 transition-colors"
                                title="Editar anotação"
                              >
                                <Edit3 className="h-3 w-3" />
                                {item.note ? "Editar Nota" : "+ Nota"}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="font-serif text-xs leading-relaxed text-card-foreground">"{item.text}"</p>

                        {/* Note block if exists or editing */}
                        {activeTab === "notes" && (
                          <div className="mt-2">
                            {isEditingNote ? (
                              <div className="space-y-2 rounded-md bg-secondary/60 p-2.5">
                                <textarea
                                  value={noteInputValue}
                                  onChange={(e) => setNoteInputValue(e.target.value)}
                                  placeholder="Escreva sua reflexão, oração ou notas sobre este versículo..."
                                  rows={3}
                                  className="w-full resize-none rounded border border-border/50 bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                                  >
                                    <X className="h-3 w-3" /> Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSaveNoteText(item.id)}
                                    className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground shadow-sm"
                                  >
                                    <Check className="h-3 w-3" /> Salvar Nota
                                  </button>
                                </div>
                              </div>
                            ) : item.note ? (
                              <div className="rounded-md bg-accent/5 border-l-2 border-accent p-2.5 text-xs text-muted-foreground space-y-1">
                                <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                                  <StickyNote className="h-3 w-3" /> Minha Anotação:
                                </p>
                                <p className="italic leading-relaxed whitespace-pre-wrap text-card-foreground">{item.note}</p>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between border-t border-border/20">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCopy(item)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary transition-colors"
                            >
                              <Copy className="h-2.5 w-2.5" /> Copiar
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Remover
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Distinct Tab Recommendations */}
            <div className="mt-9 rounded-xl border border-border/30 bg-card/40 p-4 sm:p-5 shadow-sm">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-serif text-base font-bold text-foreground sm:text-lg">
                    {currentTabRecs.title}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {currentTabRecs.subtitle}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {currentTabRecs.items.map((r, i) => {
                  const refParts = r.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
                  let recId = `rec:${r.reference}`;

                  if (refParts) {
                    const [_, bookName, chapter, verse] = refParts;
                    const book = bibleBooks.find((b) => b.name.toLowerCase() === bookName.toLowerCase());
                    if (book) {
                      recId = `${book.abbrev}:${chapter}:${verse}`;
                    }
                  }

                  const isSavedInActiveTab = isFavorite(recId, activeTab);

                  return (
                    <motion.div
                      key={r.reference}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`glass-card rounded-lg p-3 flex flex-col justify-between transition-all hover:border-accent/50 ${
                        isSavedInActiveTab ? "border-accent/60 bg-accent/5" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                            {r.reference}
                          </p>
                          {r.theme && (
                            <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                              {r.theme}
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-xs italic leading-relaxed text-card-foreground">
                          "{r.text}"
                        </p>
                      </div>

                      <div className="mt-3 pt-2 flex items-center justify-between border-t border-border/20">
                        <button
                          onClick={() => {
                            if (isSavedInActiveTab) {
                              removeFavorite(recId, activeTab);
                            } else {
                              addFavorite({ id: recId, text: r.text, reference: r.reference }, activeTab);
                            }
                            setItems(getFavorites(activeTab));
                          }}
                          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                            isSavedInActiveTab
                              ? "bg-accent/20 text-accent"
                              : "bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {getIcon("h-3 w-3")}
                          {isSavedInActiveTab ? "Salvo" : `Salvar em ${getLabel()}`}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {activeTab !== "favorites" && (
                            <button
                              onClick={() => {
                                if (isFavorite(recId, "favorites")) removeFavorite(recId, "favorites");
                                else addFavorite({ id: recId, text: r.text, reference: r.reference }, "favorites");
                              }}
                              title="Favoritos"
                              className={`p-1 transition-colors ${
                                isFavorite(recId, "favorites") ? "text-accent" : "text-muted-foreground hover:text-accent"
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${isFavorite(recId, "favorites") ? "fill-accent" : ""}`} />
                            </button>
                          )}
                          {activeTab !== "markings" && (
                            <button
                              onClick={() => {
                                if (isFavorite(recId, "markings")) removeFavorite(recId, "markings");
                                else addFavorite({ id: recId, text: r.text, reference: r.reference }, "markings");
                              }}
                              title="Marcações"
                              className={`p-1 transition-colors ${
                                isFavorite(recId, "markings") ? "text-accent" : "text-muted-foreground hover:text-accent"
                              }`}
                            >
                              <Highlighter className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {activeTab !== "notes" && (
                            <button
                              onClick={() => {
                                if (isFavorite(recId, "notes")) removeFavorite(recId, "notes");
                                else addFavorite({ id: recId, text: r.text, reference: r.reference }, "notes");
                              }}
                              title="Anotações"
                              className={`p-1 transition-colors ${
                                isFavorite(recId, "notes") ? "text-accent" : "text-muted-foreground hover:text-accent"
                              }`}
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
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
