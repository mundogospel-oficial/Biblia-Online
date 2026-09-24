import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { 
  Calendar, 
  Heart, 
  Sun, 
  Cloud, 
  Zap, 
  Star, 
  Gift, 
  Cross, 
  Flame, 
  BookOpen, 
  Search, 
  Copy, 
  Share2, 
  Sparkles, 
  Compass, 
  Check, 
  HeartHandshake,
  ArrowRight,
  Filter,
  Clock,
  MapPin,
  X
} from "lucide-react";
import { getLocalizedDevotionals, getTodayDevotional } from "@/lib/devotionalsData";
import { readingPlans, getLocalizedReadingPlans } from "@/lib/readingPlansData";
import { getFavoritePlanIds, toggleFavoritePlan } from "@/services/readingPlanService";
import { shareBibleText } from "@/lib/downloadUtils";
import { ReadingPlansSection } from "@/components/ReadingPlansSection";
import { BiblicalMapsSection } from "@/components/BiblicalMapsSection";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

// Helper function to get the icon associated with a category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Fé": case "Faith": return <Cross className="h-4 w-4" />;
    case "Amor": case "Love": return <Heart className="h-4 w-4" />;
    case "Paz": case "Peace": return <Cloud className="h-4 w-4" />;
    case "Força": case "Strength": return <Flame className="h-4 w-4" />;
    case "Gratidão": case "Gratitude": return <Star className="h-4 w-4" />;
    case "Sabedoria": case "Wisdom": return <BookOpen className="h-4 w-4" />;
    case "Ansiedade": case "Anxiety": return <Zap className="h-4 w-4" />;
    case "Esperança": case "Hope": return <Sun className="h-4 w-4" />;
    case "Oração": case "Prayer": return <HeartHandshake className="h-4 w-4" />;
    case "Propósito": case "Purpose": return <Sparkles className="h-4 w-4" />;
    case "Proteção": case "Protection": return <Gift className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
};

const DevotionalPage = () => {
  const { isBeta, isAdmin, role } = useAuth();
  const { t, language } = useLanguage();
  const canAccessBeta = isBeta || isAdmin || role === "beta" || role === "admin";

  const devotionals = useMemo(() => getLocalizedDevotionals(language), [language]);
  const localizedReadingPlans = useMemo(() => getLocalizedReadingPlans(language), [language]);

  const [activeTab, setActiveTab] = useState<"hoje" | "planos" | "mapas" | "explorar" | "favoritos">("hoje");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [expandedDevotionalId, setExpandedDevotionalId] = useState<number | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<number[]>([]);
  const [favoritedPlanIds, setFavoritedPlanIds] = useState<string[]>(getFavoritePlanIds());
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [isMapsFullscreen, setIsMapsFullscreen] = useState(false);

  // If user does not have beta access, ensure activeTab does not stay on mapas
  useEffect(() => {
    if (activeTab === "mapas" && !canAccessBeta) {
      setActiveTab("hoje");
    }
    if (activeTab !== "mapas" && isMapsFullscreen) {
      setIsMapsFullscreen(false);
    }
  }, [activeTab, canAccessBeta, isMapsFullscreen]);

  // Load favorites from localStorage on mount e when switching tabs
  useEffect(() => {
    const saved = localStorage.getItem("biblia-devocionais-favoritos");
    if (saved) {
      try {
        setFavoritedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing favorites", e);
      }
    }
    setFavoritedPlanIds(getFavoritePlanIds());
  }, [activeTab]);

  // Save favorites to localStorage when they change
  const toggleFavorite = (id: number) => {
    let updated;
    if (favoritedIds.includes(id)) {
      updated = favoritedIds.filter(favId => favId !== id);
    } else {
      updated = [...favoritedIds, id];
    }
    setFavoritedIds(updated);
    localStorage.setItem("biblia-devocionais-favoritos", JSON.stringify(updated));
  };

  // Determine the Devotional of the Day based on current language
  const todayDevotional = useMemo(() => {
    return getTodayDevotional(language);
  }, [language]);

  // Format today's date based on current language
  const formattedTodayDate = useMemo(() => {
    const today = new Date();
    const locale = language === "en" ? "en-US" : "pt-BR";
    return today.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, [language]);

  // Copy helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Get distinct categories
  const categories = useMemo(() => {
    const list = new Set(devotionals.map(d => d.category));
    return ["Todas", ...Array.from(list)];
  }, [devotionals]);

  // Reset category on language change if current selection is invalid
  useEffect(() => {
    setSelectedCategory("Todas");
  }, [language]);

  // Filter devotionals based on search and category selected
  const filteredDevotionals = useMemo(() => {
    return devotionals.filter(d => {
      const matchesCategory = selectedCategory === "Todas" || d.category === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanQuery || 
        d.title.toLowerCase().includes(cleanQuery) ||
        d.verse.toLowerCase().includes(cleanQuery) ||
        d.reference.toLowerCase().includes(cleanQuery) ||
        d.meditation.toLowerCase().includes(cleanQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, devotionals]);

  // Favorited devotionals
  const favoritedDevotionals = useMemo(() => {
    return devotionals.filter(d => favoritedIds.includes(d.id));
  }, [favoritedIds, devotionals]);

  return (
    <div className={`min-h-screen bg-background ${isMapsFullscreen ? "pb-0 overflow-y-auto lg:overflow-hidden" : "pb-20 md:pb-0"}`}>
      {/* Oculta o Header no modo tela cheia dos mapas */}
      {!isMapsFullscreen && <Header />}
      <section className={`transition-all ${
        isMapsFullscreen
          ? "w-full max-w-none p-2.5 sm:p-4 min-h-screen lg:h-screen flex flex-col"
          : activeTab === "mapas"
            ? "container mx-auto px-4 py-5 sm:py-8 max-w-6xl"
            : "container mx-auto px-4 py-5 sm:py-8 max-w-4xl"
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={isMapsFullscreen ? "h-full flex flex-col flex-1 min-h-0" : ""}
        >
          {/* Page Heading - Ocultado em tela cheia */}
          {!isMapsFullscreen && (
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
                  <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">{t("devotional_title")}</h1>
                </div>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t("devotional_subtitle")}
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation - Ocultado em tela cheia */}
          {!isMapsFullscreen && (
            <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2.5 border-b border-border/30 relative scroll-smooth themed-scrollbar select-none">
              {[
                { id: "hoje", label: t("tab_today_devotional"), icon: Sparkles },
                { id: "planos", label: t("tab_reading_plans"), icon: BookOpen },
                ...(canAccessBeta ? [{ id: "mapas", label: t("tab_biblical_maps"), icon: MapPin, isBeta: true }] : []),
                { id: "explorar", label: `${t("tab_explore_devotionals")} (${devotionals.length})`, icon: Compass },
                { id: "favoritos", label: `${t("tab_my_favorites")} (${favoritedIds.length + favoritedPlanIds.length})`, icon: Heart },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors select-none shrink-0 ${
                      tab.id === "mapas" ? "hidden md:inline-flex" : "inline-flex"
                    } ${
                      isActive
                        ? "text-primary-foreground font-bold"
                        : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDevotionalTabPill"
                        className="absolute inset-0 rounded-full bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                      {tab.isBeta && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent/20 text-accent"
                        }`}>
                          Beta
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* 1. DEVOCIONAL DE HOJE TAB */}
            {activeTab === "hoje" && (
              <motion.div
                key="hoje-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header card info */}
                <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border bg-card/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
                      <Sparkles className="h-3.5 w-3.5" /> {t("meditation_of_the_day")}
                    </span>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground capitalize">
                      {formattedTodayDate}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground border border-border/80 shadow-xs shrink-0 self-start md:self-center">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span>{t("changes_at_midnight")}</span>
                  </div>
                </div>

                {/* Main Devotional Card */}
                <div className="glass-card rounded-2xl p-5 sm:p-8 space-y-6 border border-border bg-card/50 shadow-md">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-accent font-semibold text-xs uppercase tracking-wider">
                        {getCategoryIcon(todayDevotional.category)}
                        <span>{t("theme_label")} {todayDevotional.category}</span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-foreground">
                        {todayDevotional.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleFavorite(todayDevotional.id)}
                      className={`rounded-full p-2.5 border transition-all ${
                        favoritedIds.includes(todayDevotional.id)
                          ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                          : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title={favoritedIds.includes(todayDevotional.id) ? (language === "en" ? "Remove from favorites" : "Remover dos favoritos") : (language === "en" ? "Save to favorites" : "Salvar nos favoritos")}
                    >
                      <Heart className="h-5 w-5" fill={favoritedIds.includes(todayDevotional.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Bible Verse Section */}
                  <div className="rounded-xl bg-accent/5 p-4 sm:p-6 border-l-4 border-accent relative overflow-hidden">
                    <p className="font-serif text-sm sm:text-base italic leading-relaxed text-foreground/90 relative z-10">
                      "{todayDevotional.verse}"
                    </p>
                    <div className="mt-3 flex justify-between items-center relative z-10">
                      <p className="text-xs font-bold text-accent">— {todayDevotional.reference}</p>
                      
                      <button
                        onClick={() => handleCopy("today-verse", `"${todayDevotional.verse}" — ${todayDevotional.reference}`)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 bg-background/60 px-2 py-1 rounded-md border border-border/40 transition-colors"
                      >
                        {copyStatus["today-verse"] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        {copyStatus["today-verse"] ? t("copied") : t("copy")}
                      </button>
                    </div>
                  </div>

                  {/* Meditation */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-accent" />
                      {t("reflection_title")}
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground/80 text-justify">
                      {todayDevotional.meditation}
                    </p>
                  </div>

                  {/* Short Prayer */}
                  <div className="rounded-xl bg-secondary/30 p-5 border border-border/60 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <HeartHandshake className="h-3.5 w-3.5 text-primary" />
                      {t("today_prayer")}
                    </h4>
                    <p className="text-xs sm:text-sm italic leading-relaxed text-foreground/75">
                      {todayDevotional.prayer}
                    </p>
                  </div>

                  {/* Share e Copy Full Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => handleCopy(
                        "today-full", 
                        `📖 ${t("tab_today_devotional").toUpperCase()}\n\n✨ ${todayDevotional.title}\n\n🏷️ ${t("theme_label")} ${todayDevotional.category}\n\n📜 ${language === "en" ? "Verse" : "Versículo"}: "${todayDevotional.verse}" (${todayDevotional.reference})\n\n✍️ ${t("reflection_title")}: ${todayDevotional.meditation}\n\n🙏 ${t("today_prayer")}: ${todayDevotional.prayer}`
                      )}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors text-foreground"
                    >
                      {copyStatus["today-full"] ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copyStatus["today-full"] ? t("copied") : t("copy_devotional")}
                    </button>
                    <button
                      onClick={() => shareBibleText(
                        `📖 ${t("tab_today_devotional").toUpperCase()}\n\n✨ ${todayDevotional.title}\n\n🏷️ ${t("theme_label")} ${todayDevotional.category}\n\n📜 ${language === "en" ? "Verse" : "Versículo"}: "${todayDevotional.verse}" (${todayDevotional.reference})\n\n✍️ ${t("reflection_title")}: ${todayDevotional.meditation}\n\n🙏 ${t("today_prayer")}: ${todayDevotional.prayer}`,
                        `${t("tab_today_devotional")}: ${todayDevotional.title}`
                      )}
                      className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {t("share_devotional")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. PLANOS DE LEITURA TAB */}
            {activeTab === "planos" && (
              <motion.div
                key="planos-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ReadingPlansSection />
              </motion.div>
            )}

            {/* 3. MAPAS BÍBLICOS (EM TESTES) TAB - Oculto em celulares */}
            {activeTab === "mapas" && canAccessBeta && (
              <motion.div
                key="mapas-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`hidden md:block ${isMapsFullscreen ? "h-full flex flex-col flex-1 min-h-0" : ""}`}
              >
                <BiblicalMapsSection
                  isFullscreen={isMapsFullscreen}
                  onToggleFullscreen={setIsMapsFullscreen}
                />
              </motion.div>
            )}

            {/* 4. EXPLORAR ALL TAB */}
            {activeTab === "explorar" && (
              <motion.div
                key="explorar-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                  {/* Search e Category Filter Section */}
                  <div className="space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={200}
                      placeholder={t("search_devotionals_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.slice(0, 200))}
                      className={`w-full rounded-xl glass-card py-2.5 sm:py-3 ${searchQuery ? "pl-4" : "pl-10"} pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 shadow-sm`}
                    />
                    {!searchQuery && (
                      <Search className="absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title={language === "en" ? "Clear search" : "Limpar busca"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Horizontal Scroll Categories */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      {t("filter_by_theme")}
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-2.5 scroll-smooth themed-scrollbar select-none">
                      {categories.map((cat) => {
                        const isActive = selectedCategory === cat;
                        const label = cat === "Todas" ? t("all_categories") : cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setExpandedDevotionalId(null);
                            }}
                            className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors select-none shrink-0 ${
                              isActive
                                ? "text-primary-foreground font-bold"
                                : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeDevotionalCategoryPill"
                                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                              {cat !== "Todas" && getCategoryIcon(cat)}
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Info summary */}
                <div className="text-xs text-muted-foreground">
                  {t("showing_devotionals_count")} <span className="font-bold text-foreground">{filteredDevotionals.length}</span> {t("of_devotionals")} <span className="font-bold text-foreground">{devotionals.length}</span> {t("devotionals_available")}
                </div>

                {/* Devotionals grid/list */}
                {filteredDevotionals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredDevotionals.map((d, index) => {
                      const isExpanded = expandedDevotionalId === d.id;
                      const copyKey = `explorar-full-${d.id}`;
                      const isFavorited = favoritedIds.includes(d.id);

                      return (
                        <motion.div
                          key={d.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.3) }}
                          className={`glass-card rounded-xl border transition-all cursor-pointer p-4 hover:border-accent/40 ${
                            isExpanded ? "bg-secondary/20 !border-accent/30 shadow-sm" : "bg-card/40"
                          }`}
                          onClick={() => setExpandedDevotionalId(isExpanded ? null : d.id)}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-accent font-semibold text-[10px] uppercase tracking-wider">
                                {getCategoryIcon(d.category)}
                                <span>{d.category}</span>
                              </div>
                              <h3 className="font-serif text-sm sm:text-base font-bold text-foreground hover:text-accent transition-colors">
                                {d.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleFavorite(d.id)}
                                className={`rounded-full p-1.5 border transition-all ${
                                  isFavorited
                                    ? "bg-accent/10 border-accent/30 text-accent"
                                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <Heart className="h-3.5 w-3.5" fill={isFavorited ? "currentColor" : "none"} />
                              </button>
                              <span className="text-[10px] text-muted-foreground/60 font-semibold px-1">#{d.id}</span>
                            </div>
                          </div>

                          <p className="mt-2.5 font-serif text-xs italic leading-relaxed text-card-foreground line-clamp-2">
                            "{d.verse}"
                          </p>
                          <p className="mt-1 text-[10px] font-bold text-accent/90 flex justify-between items-center">
                            <span>— {d.reference}</span>
                            <span className="text-[10px] font-normal text-muted-foreground/75 flex items-center gap-0.5 group">
                              {isExpanded ? t("collapse_reflection") : t("read_full_reflection")}
                              <ArrowRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </span>
                          </p>

                          {/* Expanded content */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-4 pt-4 border-t border-border/50 space-y-4"
                            >
                              {/* Meditation */}
                              <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="h-3 w-3 text-accent" />
                                  {t("reflection_title")}
                                </h4>
                                <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-line text-justify">
                                  {d.meditation}
                                </p>
                              </div>

                              {/* Prayer */}
                              <div className="rounded-lg bg-background p-3.5 border border-border/50 space-y-1">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <HeartHandshake className="h-3 w-3 text-primary" />
                                  {t("recommended_prayer")}
                                </h4>
                                <p className="text-xs italic leading-relaxed text-foreground/75">
                                  {d.prayer}
                                </p>
                              </div>

                              {/* Action buttons */}
                              <div className="flex gap-2 justify-end pt-2">
                                <button
                                  onClick={() => handleCopy(
                                    copyKey, 
                                    `📖 ${t("tab_today_devotional")}: ${d.title}\n\n📜 "${d.verse}" — ${d.reference}\n\n✍️ ${t("reflection_title")}: ${d.meditation}\n\n🙏 ${t("today_prayer")}: ${d.prayer}`
                                  )}
                                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-secondary transition-colors text-foreground"
                                >
                                  {copyStatus[copyKey] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                  {copyStatus[copyKey] ? t("copied") : t("copy")}
                                </button>
                                <button
                                  onClick={() => shareBibleText(
                                    `📖 ${t("tab_today_devotional")}: ${d.title}\n\n📜 "${d.verse}" — ${d.reference}\n\n✍️ ${t("reflection_title")}: ${d.meditation}\n\n🙏 ${t("today_prayer")}: ${d.prayer}`,
                                    `${t("tab_today_devotional")}: ${d.title}`
                                  )}
                                  className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-[10px] font-semibold hover:opacity-90 transition-all shadow-xs"
                                >
                                  <Share2 className="h-3 w-3" />
                                  {language === "en" ? "Share" : "Compartilhar"}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border bg-secondary/10">
                    <p className="text-sm text-muted-foreground">{t("no_devotionals_found")}</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("Todas"); }}
                      className="mt-3 text-xs text-accent font-semibold hover:underline"
                    >
                      {t("clear_search_filters")}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. MEUS FAVORITOS TAB */}
            {activeTab === "favoritos" && (
              <motion.div
                key="favoritos-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Devocionais Favoritos */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2 font-serif">
                    <Heart className="h-4 w-4 text-accent fill-accent" />
                    {t("favorited_devotionals")} ({favoritedDevotionals.length})
                  </h2>

                  {favoritedDevotionals.length > 0 ? (
                    <div className="space-y-3">
                      {favoritedDevotionals.map((d, index) => {
                        const isExpanded = expandedDevotionalId === d.id;
                        const copyKey = `favorito-full-${d.id}`;

                        return (
                          <motion.div
                            key={d.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`glass-card rounded-xl border transition-all cursor-pointer p-4 hover:border-accent/40 ${
                              isExpanded ? "bg-secondary/20 !border-accent/30 shadow-sm" : "bg-card/40"
                            }`}
                            onClick={() => setExpandedDevotionalId(isExpanded ? null : d.id)}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-accent font-semibold text-[10px] uppercase tracking-wider">
                                  {getCategoryIcon(d.category)}
                                  <span>{d.category}</span>
                                </div>
                                <h3 className="font-serif text-sm sm:text-base font-bold text-foreground">
                                  {d.title}
                                </h3>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(d.id);
                                }}
                                className="rounded-full p-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                                title={language === "en" ? "Remove from favorites" : "Remover dos favoritos"}
                              >
                                <Heart className="h-3.5 w-3.5" fill="currentColor" />
                              </button>
                            </div>

                            <p className="mt-2.5 font-serif text-xs italic leading-relaxed text-card-foreground line-clamp-2">
                              "{d.verse}"
                            </p>
                            <p className="mt-1 text-[10px] font-bold text-accent/90 flex justify-between items-center">
                              <span>— {d.reference}</span>
                              <span className="text-[10px] font-normal text-muted-foreground/75 flex items-center gap-0.5">
                                {isExpanded ? t("collapse_reflection") : t("read_full_reflection")}
                                <ArrowRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </span>
                            </p>

                            {/* Expanded content */}
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-4 pt-4 border-t border-border/50 space-y-4"
                              >
                                {/* Meditation */}
                                <div className="space-y-1.5">
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <BookOpen className="h-3 w-3 text-accent" />
                                    {t("reflection_title")}
                                  </h4>
                                  <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-line text-justify">
                                    {d.meditation}
                                  </p>
                                </div>

                                {/* Prayer */}
                                <div className="rounded-lg bg-background p-3.5 border border-border/50 space-y-1">
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <HeartHandshake className="h-3 w-3 text-primary" />
                                    {t("recommended_prayer")}
                                  </h4>
                                  <p className="text-xs italic leading-relaxed text-foreground/75">
                                    {d.prayer}
                                  </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => handleCopy(
                                      copyKey, 
                                      `📖 ${t("tab_today_devotional")}: ${d.title}\n\n📜 "${d.verse}" — ${d.reference}\n\n✍️ ${t("reflection_title")}: ${d.meditation}\n\n🙏 ${t("today_prayer")}: ${d.prayer}`
                                    )}
                                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-secondary transition-colors text-foreground"
                                  >
                                    {copyStatus[copyKey] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                    {copyStatus[copyKey] ? t("copied") : t("copy")}
                                  </button>
                                  <button
                                    onClick={() => shareBibleText(
                                      `📖 ${t("tab_today_devotional")}: ${d.title}\n\n📜 "${d.verse}" — ${d.reference}\n\n✍️ ${t("reflection_title")}: ${d.meditation}\n\n🙏 ${t("today_prayer")}: ${d.prayer}`,
                                      `${t("tab_today_devotional")}: ${d.title}`
                                    )}
                                    className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-[10px] font-semibold hover:opacity-90 transition-all shadow-xs"
                                  >
                                    <Share2 className="h-3 w-3" />
                                    {language === "en" ? "Share" : "Compartilhar"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-secondary/20 p-3 rounded-lg border border-border/40">
                      {t("no_favorited_devotionals")}
                    </p>
                  )}
                </div>

                {/* Planos de Leitura Favoritados */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2 font-serif">
                    <Calendar className="h-4 w-4 text-accent" />
                    {t("favorited_reading_plans")} ({favoritedPlanIds.length})
                  </h2>

                  {favoritedPlanIds.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {localizedReadingPlans
                        .filter((p) => favoritedPlanIds.includes(p.id))
                        .map((plan) => (
                          <div
                            key={plan.id}
                            className="glass-card rounded-2xl p-4 border border-border/60 bg-card/40 space-y-3 flex flex-col justify-between hover:border-accent/40 transition-all shadow-xs"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${plan.bgGradient}`}>
                                  {plan.badge}
                                </span>
                                <button
                                  onClick={() => {
                                    toggleFavoritePlan(plan.id);
                                    setFavoritedPlanIds(getFavoritePlanIds());
                                  }}
                                  className="p-1 rounded-full text-accent hover:bg-accent/10 transition-colors"
                                  title={language === "en" ? "Remove from favorites" : "Remover dos favoritos"}
                                >
                                  <Heart className="h-4 w-4 fill-accent" />
                                </button>
                              </div>

                              <div>
                                <h3 className="font-serif text-base font-bold text-foreground">{plan.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{plan.description}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {plan.durationDays} {t("days_unit")}
                              </span>
                              <button
                                onClick={() => setActiveTab("planos")}
                                className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                              >
                                {t("go_to_plan")} <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-secondary/20 p-3 rounded-lg border border-border/40">
                      {t("no_favorited_plans")}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default DevotionalPage;
