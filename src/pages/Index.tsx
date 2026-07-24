import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bibleBooks, fetchChapter } from "@/lib/bibleData";
import { getDailyVerseReference, type DailyVerseEntry } from "@/lib/dailyVerse";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import TermsModal from "@/components/TermsModal";
import { ChevronRight, ChevronLeft, Sun, Youtube, Loader2, BookOpen, Sparkles, Image as ImageIcon } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('old');
  const [dailyVerse, setDailyVerse] = useState<DailyVerseEntry | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Alterna o painel de destaques automaticamente a cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const reference = getDailyVerseReference();
    // Puxando da fonte original e certo: Bíblia Livre offline
    fetchChapter(reference.abbrev, reference.chapter, 'blivre')
      .then((chap) => {
        const verseText = chap.verses.find(v => v.verse === reference.verse)?.text || "";
        setDailyVerse({ ...reference, text: verseText });
      })
      .catch(() => {
        setDailyVerse({ ...reference, text: "Não foi possível carregar o versículo. Verifique sua conexão ou dados offline." });
      });
  }, []);

  const filteredBooks = bibleBooks.filter(b => b.testament === activeTab);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card px-4 py-12 sm:py-24 flex items-center justify-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-[2rem] px-6 py-16 sm:px-16 sm:py-24 mx-auto w-full max-w-[720px] text-center shadow-xl border-white/10"
          >
            <img 
              src="/icons/logo2.png" 
              alt="Logo Biblia Online" 
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="mx-auto mb-4 h-14 w-14 object-contain transition-opacity duration-300 pointer-events-none select-none no-copy-logo" 
            />
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Biblia Online
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Leia a Palavra, estude com a IA Bíblica e transforme versículos em arte. Tudo em um só lugar.
            </p>
            <p className="mx-auto mt-2 text-xs font-semibold text-accent">
              Criado por Mundo Gospel
            </p>
            <a
              href="https://youtube.com/@mundo_gospel_original?si=8atFNZStz1XBwXGb"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95 liquid-btn"
            >
              <Youtube className="h-4 w-4" />
              Inscreva-se
            </a>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Rotating Panel */}
      <section className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card relative overflow-hidden rounded-2xl p-5 sm:p-7 shadow-verse border border-border/80"
        >
          {/* Header Controls Bar */}
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/40 pb-3">
            {/* Slide Badge */}
            <div className="flex items-center gap-2">
              {activeSlide === 0 && (
                <>
                  <Sun className="h-4 w-4 text-accent" />
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">
                    Versículo do Dia
                  </h2>
                </>
              )}
              {activeSlide === 1 && (
                <>
                  <BookOpen className="h-4 w-4 text-accent" />
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">
                    + de 1.000 Versículos Sagrados
                  </h2>
                </>
              )}
              {activeSlide === 2 && (
                <>
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">
                    Dicionário e IA Bíblica
                  </h2>
                </>
              )}
            </div>

            {/* Navigation Indicators & Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Ir para slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeSlide === idx 
                        ? 'w-6 bg-accent' 
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                aria-label="Slide anterior"
                className="rounded-full p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                aria-label="Próximo slide"
                className="rounded-full p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Slide Content with AnimatePresence */}
          <div className="min-h-[110px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeSlide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {!dailyVerse ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando versículo do dia...
                    </div>
                  ) : (
                    <>
                      <blockquote className="font-serif text-base italic leading-relaxed text-card-foreground sm:text-lg">
                        "{dailyVerse.text}"
                      </blockquote>
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        — {dailyVerse.reference}
                      </p>
                      <Link
                        to={`/criar?ref=${encodeURIComponent(dailyVerse.reference)}&text=${encodeURIComponent(dailyVerse.text || "")}`}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02] active:scale-95"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Criar página com este versículo
                      </Link>
                    </>
                  )}
                </motion.div>
              )}

              {activeSlide === 1 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                    Mais de 31.000 versículos e 66 Livros Sagrados
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Navegação offline instantânea, comparações de traduções e estudos em qualquer capítulo da Bíblia.
                  </p>
                  <Link
                    to="/livro/gn/1"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02] active:scale-95"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Começar Leitura (Gênesis 1)
                  </Link>
                </motion.div>
              )}

              {activeSlide === 2 && (
                <motion.div
                  key="slide-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-serif text-lg font-bold text-foreground sm:text-xl">
                    Estudo Aprofundado e Dicionário Teológico IA
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Esclareça contextos históricos, palavras originais em hebraico/grego e significados práticos para cada versículo.
                  </p>
                  <Link
                    to="/ia"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Acessar Inteligência Artificial Bíblica
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Book List */}
      <section className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-secondary/60 border border-border/60 shadow-inner">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('old')}
              className={`relative rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 z-10 ${
                activeTab === 'old'
                  ? 'text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'old' && (
                <motion.div
                  layoutId="activeTestamentTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Antigo Testamento
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('new')}
              className={`relative rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 z-10 ${
                activeTab === 'new'
                  ? 'text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'new' && (
                <motion.div
                  layoutId="activeTestamentTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Novo Testamento
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map((book) => (
            <Link
              key={book.abbrev}
              to={`/livro/${book.abbrev}/1`}
              className="glass-card group flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:!border-accent"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {book.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{book.chapters} cap.</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/30 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 Biblia Online. Todos os direitos reservados.
          </p>
          <button 
            onClick={() => setIsTermsOpen(true)}
            className="text-[11px] text-accent hover:text-accent/80 transition-all font-bold hover:underline underline-offset-4"
          >
            Termos de Uso e Política de Privacidade
          </button>
        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default Index;
