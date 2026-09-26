import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bibleBooks, fetchChapter, getBookByAbbrev } from "@/lib/bibleData";
import { getDailyVerseReference, type DailyVerseEntry } from "@/lib/dailyVerse";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import TermsModal from "@/components/TermsModal";
import SecurityCaptchaModal from "@/components/SecurityCaptchaModal";
import { ChevronRight, ChevronLeft, Sun, Instagram, Loader2, BookOpen, Sparkles, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('old');
  const [dailyVerse, setDailyVerse] = useState<DailyVerseEntry | null>(() => getDailyVerseReference());
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
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
    const isEn = language === "en";
    const selectedTranslation = isEn ? "kjv" : "blivre";
    const book = getBookByAbbrev(reference.abbrev);
    const formattedRef = isEn
      ? (reference.referenceEn || `${book?.nameEn || reference.reference} ${reference.chapter}:${reference.verse}`)
      : reference.reference;

    // Puxando da fonte certa: KJV para Inglês, Bíblia Livre offline para Português
    fetchChapter(reference.abbrev, reference.chapter, selectedTranslation)
      .then((chap) => {
        const verseText = chap.verses.find(v => v.verse === reference.verse)?.text || "";
        setDailyVerse({ 
          ...reference, 
          reference: formattedRef,
          text: verseText || (isEn ? (reference.textEn || reference.text) : reference.text) || "" 
        });
      })
      .catch(() => {
        const fallbackText = isEn ? (reference.textEn || reference.text || "") : (reference.text || "");
        setDailyVerse({ 
          ...reference, 
          reference: formattedRef,
          text: fallbackText || (isEn 
            ? "Could not load the verse. Check your connection or offline data." 
            : "Não foi possível carregar o versículo. Verifique sua conexão ou dados offline.")
        });
      });
  }, [language]);

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
              {t("hero_subtitle")}
            </p>
            <p className="mx-auto mt-2 text-xs font-semibold text-accent">
              {t("created_by")}
            </p>
            <button
              type="button"
              onClick={() => setIsSecurityModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95 liquid-btn cursor-pointer"
            >
              <Instagram className="h-4 w-4" />
              {t("subscribe")}
            </button>
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
                    {t("verse_of_the_day")}
                  </h2>
                </>
              )}
              {activeSlide === 1 && (
                <>
                  <BookOpen className="h-4 w-4 text-accent" />
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">
                    {t("thousands_verses")}
                  </h2>
                </>
              )}
              {activeSlide === 2 && (
                <>
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-accent">
                    {t("ai_dictionary_title")}
                  </h2>
                </>
              )}
            </div>

            {/* Navigation Indicators e Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
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
                aria-label="Previous slide"
                className="rounded-full p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                aria-label="Next slide"
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
                      <Loader2 className="h-4 w-4 animate-spin" /> {language === "en" ? "Loading verse of the day..." : "Carregando versículo do dia..."}
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
                        {t("create_page_verse")}
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
                    {t("thousands_verses_sub")}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {t("thousands_verses_desc")}
                  </p>
                  <Link
                    to="/livro/gn/1"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02] active:scale-95"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("start_reading_genesis")}
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
                    {t("ai_dictionary_sub")}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {t("ai_dictionary_desc")}
                  </p>
                  <Link
                    to="/ia"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("access_ai")}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Book List */}
      <section className="container mx-auto iphone-duo-container safe-area-inset-padding px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full glass-card border border-border/60 shadow-card backdrop-blur-xl select-none">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('old')}
              className={`relative rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 z-10 ${
                activeTab === 'old'
                  ? 'text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {activeTab === 'old' && (
                <motion.div
                  layoutId="activeTestamentTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md shadow-primary/25 border border-primary/40 [box-shadow:inset_0_1px_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(30,136,229,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {t("old_testament")}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab('new')}
              className={`relative rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 z-10 ${
                activeTab === 'new'
                  ? 'text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {activeTab === 'new' && (
                <motion.div
                  layoutId="activeTestamentTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md shadow-primary/25 border border-primary/40 [box-shadow:inset_0_1px_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(30,136,229,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {t("new_testament")}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map((book) => {
            const displayName = language === "en" ? (book.nameEn || book.name) : book.name;
            return (
              <Link
                key={book.abbrev}
                to={`/livro/${book.abbrev}/1`}
                className="glass-card group flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:!border-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{book.chapters} {t("chapters_count")}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/30 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground font-medium">
            {t("all_rights_reserved")}
          </p>
          <button 
            onClick={() => setIsTermsOpen(true)}
            className="text-[11px] text-accent hover:text-accent/80 transition-all font-bold hover:underline underline-offset-4"
          >
            {t("terms_privacy")}
          </button>
        </div>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <SecurityCaptchaModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
    </div>
  );
};

export default Index;
