import { useState } from "react";
import { Link } from "react-router-dom";
import { bibleBooks } from "@/lib/bibleData";
import { getDailyVerse } from "@/lib/dailyVerse";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { ChevronRight, Sun, Youtube } from "lucide-react";
import logoImg from "../assets/logo.svg.png";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('old');
  const dailyVerse = getDailyVerse();

  const filteredBooks = bibleBooks.filter(b => b.testament === activeTab);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card px-4 py-12 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            // AQUI: Aumentado max-w para 800px, padding (py-16 sm:py-24) e bordas (rounded-3xl)
            className="glass-card rounded-3xl px-6 py-16 sm:px-16 sm:py-24 mx-auto w-full max-w-[800px]"
          >
            <img src={logoImg} className="mx-auto mb-4 h-14 w-14 object-contain" alt="Bíblia Online Logo" />
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

      {/* Verse of the Day */}
      <section className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-xl p-4 shadow-verse sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sun className="h-4 w-4 text-accent" />
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-accent">
              Versículo do Dia
            </h2>
          </div>
          <blockquote className="font-serif text-base italic leading-relaxed text-card-foreground sm:text-lg">
            "{dailyVerse.text}"
          </blockquote>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            — {dailyVerse.reference}
          </p>
          <Link
            to={`/criar?ref=${encodeURIComponent(dailyVerse.reference)}&text=${encodeURIComponent(dailyVerse.text)}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Criar página com este versículo
          </Link>
        </motion.div>
      </section>

      {/* Book List */}
      <section className="container mx-auto px-4 py-6">
        <div className="mb-5 flex justify-center gap-2">
          <button
            onClick={() => setActiveTab('old')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors liquid-btn ${
              activeTab === 'old'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Antigo Testamento
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors liquid-btn ${
              activeTab === 'new'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Novo Testamento
          </button>
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
    </div>
  );
};

export default Index;
