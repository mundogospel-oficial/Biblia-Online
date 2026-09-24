import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { 
  Heart, 
  Trash2, 
  Copy, 
  BookOpen, 
  Highlighter, 
  StickyNote, 
  Edit3, 
  Check, 
  X, 
  Sparkles
} from "lucide-react";
import { getFavorites, removeFavorite, addFavorite, isFavorite, updateNote, FavoriteVerse, ReactionType } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";
import VoiceInputButton from "@/components/VoiceInputButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecommendationItem {
  text: string;
  textEn?: string;
  reference: string;
  referenceEn?: string;
  theme?: string;
  themeEn?: string;
}

const recommendationsByTab: Record<ReactionType, { title: string; titleEn: string; subtitle: string; subtitleEn: string; items: RecommendationItem[] }> = {
  favorites: {
    title: "Recomendações para Favoritos",
    titleEn: "Recommendations for Favorites",
    subtitle: "Versículos de amor, consolo, fé e promessas de Deus para guardar no coração.",
    subtitleEn: "Verses of love, comfort, faith, and God's promises to keep in your heart.",
    items: [
      {
        text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
        textEn: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        reference: "João 3:16",
        referenceEn: "John 3:16",
        theme: "Amor de Deus",
        themeEn: "God's Love"
      },
      {
        text: "O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.",
        textEn: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
        reference: "Salmos 23:1",
        referenceEn: "Psalms 23:1",
        theme: "Cuidado Divino",
        themeEn: "Divine Care"
      },
      {
        text: "Tudo posso naquele que me fortalece.",
        textEn: "I can do all things through Christ which strengtheneth me.",
        reference: "Filipenses 4:13",
        referenceEn: "Philippians 4:13",
        theme: "Força e Vitória",
        themeEn: "Strength and Victory"
      },
      {
        text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento.",
        textEn: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee.",
        reference: "Isaías 41:10",
        referenceEn: "Isaiah 41:10",
        theme: "Proteção",
        themeEn: "Protection"
      },
      {
        text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.",
        textEn: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
        reference: "Provérbios 3:5",
        referenceEn: "Proverbs 3:5",
        theme: "Confiança",
        themeEn: "Trust"
      },
      {
        text: "Os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão.",
        textEn: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.",
        reference: "Isaías 40:31",
        referenceEn: "Isaiah 40:31",
        theme: "Esperança",
        themeEn: "Hope"
      },
      {
        text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal.",
        textEn: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil.",
        reference: "Jeremias 29:11",
        referenceEn: "Jeremiah 29:11",
        theme: "Futuro e Paz",
        themeEn: "Future and Peace"
      },
      {
        text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.",
        textEn: "And we know that all things work together for good to them that love God.",
        reference: "Romanos 8:28",
        referenceEn: "Romans 8:28",
        theme: "Propósito",
        themeEn: "Purpose"
      },
    ]
  },
  markings: {
    title: "Recomendações para Marcações",
    titleEn: "Recommendations for Highlights",
    subtitle: "Trechos de sabedoria, conduta, princípios e ensinamentos essenciais da Palavra.",
    subtitleEn: "Passages of wisdom, conduct, principles, and essential teachings of the Word.",
    items: [
      {
        text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.",
        textEn: "Thy word is a lamp unto my feet, and a light unto my path.",
        reference: "Salmos 119:105",
        referenceEn: "Psalms 119:105",
        theme: "Direção",
        themeEn: "Guidance"
      },
      {
        text: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento.",
        textEn: "And be not conformed to this world: but be ye transformed by the renewing of your mind.",
        reference: "Romanos 12:2",
        referenceEn: "Romans 12:2",
        theme: "Transformação",
        themeEn: "Transformation"
      },
      {
        text: "O temor do Senhor é o princípio da sabedoria, e o conhecimento do Santo é prudência.",
        textEn: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.",
        reference: "Provérbios 9:10",
        referenceEn: "Proverbs 9:10",
        theme: "Sabedoria",
        themeEn: "Wisdom"
      },
      {
        text: "Toda a Escritura é divinamente inspirada e proveitosa para ensinar, para redarguir, para corrigir, para instruir em justiça.",
        textEn: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness.",
        reference: "2 Timóteo 3:16",
        referenceEn: "2 Timothy 3:16",
        theme: "Ensino",
        themeEn: "Teaching"
      },
      {
        text: "E sede cumpridores da palavra e não somente ouvintes, enganando-vos a vós mesmos.",
        textEn: "But be ye doers of the word, and not hearers only, deceiving your own selves.",
        reference: "Tiago 1:22",
        referenceEn: "James 1:22",
        theme: "Prática da Fé",
        themeEn: "Faith in Action"
      },
      {
        text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fidelidade, mansidão, temperança.",
        textEn: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance.",
        reference: "Gálatas 5:22",
        referenceEn: "Galatians 5:22",
        theme: "Fruto do Espírito",
        themeEn: "Fruit of the Spirit"
      },
      {
        text: "Guardei a tua palavra no meu coração, para não pecar contra ti.",
        textEn: "Thy word have I hid in mine heart, that I might not sin against thee.",
        reference: "Salmos 119:11",
        referenceEn: "Psalms 119:11",
        theme: "Santidade",
        themeEn: "Holiness"
      },
      {
        text: "Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, nisso pensai.",
        textEn: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, think on these things.",
        reference: "Filipenses 4:8",
        referenceEn: "Philippians 4:8",
        theme: "Mente Pura",
        themeEn: "Pure Mind"
      },
    ]
  },
  notes: {
    title: "Recomendações para Anotações e Reflexão",
    titleEn: "Recommendations for Notes and Reflection",
    subtitle: "Passagens profundas para meditação, oração e anotações do seu diário espiritual.",
    subtitleEn: "Deep passages for meditation, prayer, and notes in your spiritual journal.",
    items: [
      {
        text: "Sonda-me, ó Deus, e conhece o meu coração; prova-me e conhece os meus pensamentos. E vê se há em mim algum caminho mau.",
        textEn: "Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me.",
        reference: "Salmos 139:23",
        referenceEn: "Psalms 139:23",
        theme: "Auto-exame",
        themeEn: "Self-examination"
      },
      {
        text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei. Tomai sobre vós o meu jugo, e aprendei de mim.",
        textEn: "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me.",
        reference: "Mateus 11:28",
        referenceEn: "Matthew 11:28",
        theme: "Descanso",
        themeEn: "Rest"
      },
      {
        text: "Clama a mim, e responder-te-ei e anunciar-te-ei coisas grandes e firmes, que não sabes.",
        textEn: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.",
        reference: "Jeremias 33:3",
        referenceEn: "Jeremiah 33:3",
        theme: "Oração",
        themeEn: "Prayer"
      },
      {
        text: "Buscai primeiro o Reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.",
        textEn: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
        reference: "Mateus 6:33",
        referenceEn: "Matthew 6:33",
        theme: "Prioridades",
        themeEn: "Priorities"
      },
      {
        text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
        textEn: "Casting all your care upon him; for he careth for you.",
        reference: "1 Pedro 5:7",
        referenceEn: "1 Peter 5:7",
        theme: "Entrega",
        themeEn: "Surrender"
      },
      {
        text: "Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações; serei exaltado sobre a terra.",
        textEn: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
        reference: "Salmos 46:10",
        referenceEn: "Psalms 46:10",
        theme: "Meditação",
        themeEn: "Meditation"
      },
      {
        text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus.",
        textEn: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
        reference: "Filipenses 4:6",
        referenceEn: "Philippians 4:6",
        theme: "Gratidão",
        themeEn: "Gratitude"
      },
      {
        text: "Sejam agradáveis as palavras da minha boca e a meditação do meu coração perante a tua face.",
        textEn: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD.",
        reference: "Salmos 19:14",
        referenceEn: "Psalms 19:14",
        theme: "Devoção",
        themeEn: "Devotion"
      },
    ]
  }
};

const FavoritesPage = () => {
  const { t, language } = useLanguage();
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
    toast({ title: `${language === "en" ? "Removed from" : "Removido de"} ${getLabel()}` });
  };

  const handleCopy = (item: FavoriteVerse) => {
    const textToCopy = item.note 
      ? `"${item.text}" — ${item.reference}\n${language === "en" ? "Note:" : "Nota:"} ${item.note}`
      : `"${item.text}" — ${item.reference}`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: t("fav_verse_copied") });
  };

  const handleStartEditNote = (item: FavoriteVerse) => {
    setEditingNoteId(item.id);
    setNoteInputValue(item.note || "");
  };

  const handleSaveNoteText = (id: string) => {
    updateNote(id, noteInputValue.trim(), "notes");
    setItems(getFavorites("notes"));
    setEditingNoteId(null);
    toast({ title: noteInputValue.trim() ? (language === "en" ? "Note saved" : "Anotação salva") : (language === "en" ? "Note removed" : "Anotação removida") });
  };

  const getLabel = () => {
    switch (activeTab) {
      case "favorites": return t("fav_title_favorites");
      case "markings": return t("fav_title_markings");
      case "notes": return t("fav_title_notes");
    }
  };

  const getIcon = (className?: string) => {
    switch (activeTab) {
      case "favorites": return <Heart className={className} />;
      case "markings": return <Highlighter className={className} />;
      case "notes": return <StickyNote className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex p-1.5 gap-1.5 rounded-full glass-card border border-border/60 backdrop-blur-xl shadow-card relative select-none max-w-md mx-auto">
            {[
              { id: "favorites", label: t("fav_tab_favorites"), icon: Heart },
              { id: "markings", label: t("fav_tab_markings"), icon: Highlighter },
              { id: "notes", label: t("fav_tab_notes"), icon: StickyNote },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab.id as ReactionType)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-3 text-[12px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap z-10 ${
                    isActive
                      ? "text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFavoriteTabPill"
                      className="absolute inset-0 rounded-full bg-primary -z-10 shadow-md shadow-primary/25 border border-primary/40 [box-shadow:inset_0_1px_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(30,136,229,0.3)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <IconComp className="h-4 w-4" />
                    {tab.label}
                  </span>
                </motion.button>
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
                <p className="text-sm font-medium text-muted-foreground">
                  {activeTab === "favorites" ? t("fav_no_favorites") : activeTab === "markings" ? t("fav_no_markings") : t("fav_no_notes")}
                </p>
                <Link to="/" className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90">
                  {language === "en" ? "Explore Bible" : "Explorar Bíblia"}
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
                                title={language === "en" ? "Edit note" : "Editar anotação"}
                              >
                                <Edit3 className="h-3 w-3" />
                                {item.note ? (language === "en" ? "Edit Note" : "Editar Nota") : (language === "en" ? "+ Note" : "+ Nota")}
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
                                <div className="relative">
                                  <textarea
                                    maxLength={1000}
                                    value={noteInputValue}
                                    onChange={(e) => setNoteInputValue(e.target.value.slice(0, 1000))}
                                    placeholder={language === "en" ? "Write your reflection, prayer or notes on this verse... (max 1000 chars)" : "Escreva sua reflexão, oração ou notas sobre este versículo... (máx. 1000 caracteres)"}
                                    rows={3}
                                    className="w-full resize-none rounded border border-border/50 bg-background p-2 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent custom-scrollbar"
                                  />
                                  <div className="absolute right-2 top-2">
                                    <VoiceInputButton
                                      onTranscript={(transcript) => {
                                        setNoteInputValue((prev) => {
                                          const next = prev ? `${prev.trim()} ${transcript}` : transcript;
                                          return next.slice(0, 1000);
                                        });
                                      }}
                                      size="xs"
                                      title={language === "en" ? "Dictate note with voice" : "Ditar anotação por voz"}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                                  >
                                    <X className="h-3 w-3" /> {t("cancel")}
                                  </button>
                                  <button
                                    onClick={() => handleSaveNoteText(item.id)}
                                    className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground shadow-sm"
                                  >
                                    <Check className="h-3 w-3" /> {language === "en" ? "Save Note" : "Salvar Nota"}
                                  </button>
                                </div>
                              </div>
                            ) : item.note ? (
                              <div className="rounded-md bg-accent/5 border-l-2 border-accent p-2.5 text-xs text-muted-foreground space-y-1">
                                <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                                  <StickyNote className="h-3 w-3" /> {language === "en" ? "My Note:" : "Minha Anotação:"}
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
                              <Copy className="h-2.5 w-2.5" /> {t("copy")}
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> {t("fav_remove")}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Recommendations section for verses tabs */}
            {recommendationsByTab[activeTab] && (
              <div className="mt-9 rounded-xl border border-border/30 bg-card/40 p-4 sm:p-5 shadow-sm">
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <h2 className="font-serif text-base font-bold text-foreground sm:text-lg">
                      {language === "en" ? `${t("fav_recommendations")} for ${getLabel()}` : recommendationsByTab[activeTab].title}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {language === "en" 
                      ? "Recommended passages and verses from scripture to inspire your walk."
                      : recommendationsByTab[activeTab].subtitle}
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {recommendationsByTab[activeTab].items.map((r) => {
                    const isEn = language === "en";
                    const displayRef = isEn ? (r.referenceEn || r.reference) : r.reference;
                    const displayText = isEn ? (r.textEn || r.text) : r.text;
                    const displayTheme = isEn ? (r.themeEn || r.theme) : r.theme;

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
                        className={`glass-card rounded-lg p-3 flex flex-col justify-between transition-all hover:border-accent/50 ${
                          isSavedInActiveTab ? "border-accent/60 bg-accent/5" : ""
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                              {displayRef}
                            </p>
                            {displayTheme && (
                              <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                {displayTheme}
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-xs italic leading-relaxed text-card-foreground">
                            "{displayText}"
                          </p>
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between border-t border-border/20">
                          <button
                            onClick={() => {
                              if (isSavedInActiveTab) {
                                removeFavorite(recId, activeTab);
                              } else {
                                addFavorite({ id: recId, text: displayText, reference: displayRef }, activeTab);
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
                            {isSavedInActiveTab ? (language === "en" ? "Saved" : "Salvo") : `${language === "en" ? "Save to" : "Salvar em"} ${getLabel()}`}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FavoritesPage;
