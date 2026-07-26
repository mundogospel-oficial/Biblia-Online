import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Sparkles, 
  Calendar, 
  Clock,
  Check,
  Zap,
  Lock,
  ShieldCheck,
  X,
  PowerOff,
  Heart,
  Eye,
  FileText,
  Send,
  StickyNote,
  Copy,
  LockKeyhole,
  Info
} from "lucide-react";
import { readingPlans, PlanDay, ReadingPlan } from "@/lib/readingPlansData";
import { 
  getLocalPlanProgress, 
  loadPlanProgressWithSync, 
  toggleDayCompletion, 
  setActivePlan, 
  UserPlanProgress,
  getFavoritePlanIds,
  toggleFavoritePlan,
  isPlanFavorited,
  getPlanReflections,
  getPlanReflection,
  savePlanReflection,
  PlanReflection
} from "@/services/readingPlanService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const ReadingPlansSection = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserPlanProgress>(() => {
    return user ? getLocalPlanProgress() : {
      activePlanId: null,
      activePlanStartDate: null,
      completedDaysByPlan: {},
      streakDays: 0,
      lastCompletedDate: null
    };
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string>("paz-7-dias");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Favorites state
  const [favoritedPlanIds, setFavoritedPlanIds] = useState<string[]>(() => {
    return user ? getFavoritePlanIds() : [];
  });

  // Reflections state
  const [reflectionsMap, setReflectionsMap] = useState<Record<string, PlanReflection>>(() => {
    return user ? getPlanReflections() : {};
  });

  // Modal states
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [completingDay, setCompletingDay] = useState<PlanDay | null>(null);
  const [reflectionInput, setReflectionInput] = useState<string>("");
  const [viewingSavedLesson, setViewingSavedLesson] = useState<{
    day: PlanDay;
    plan: ReadingPlan;
    reflection?: PlanReflection | null;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setProgress({
          activePlanId: null,
          activePlanStartDate: null,
          completedDaysByPlan: {},
          streakDays: 0,
          lastCompletedDate: null,
        });
        setFavoritedPlanIds([]);
        setReflectionsMap({});
        return;
      }

      const synced = await loadPlanProgressWithSync();
      setProgress(synced);
      setFavoritedPlanIds(getFavoritePlanIds());
      setReflectionsMap(getPlanReflections());
      if (synced.activePlanId) {
        setSelectedPlanId(synced.activePlanId);
      }
    };
    init();
  }, [user]);

  const activePlan = user ? (readingPlans.find((p) => p.id === progress.activePlanId) || null) : null;
  const currentPlanViewed = readingPlans.find((p) => p.id === selectedPlanId) || readingPlans[0];

  const isCurrentPlanActive = user && activePlan?.id === currentPlanViewed.id;
  const completedDays = user ? (progress.completedDaysByPlan[currentPlanViewed.id] || []) : [];
  const percentComplete = Math.round((completedDays.length / currentPlanViewed.durationDays) * 100);

  const categories = ["Todas", "Geral", "Antigo Testamento", "Novo Testamento", "Sabedoria", "Temático", "Iniciantes"];

  const filteredPlans = readingPlans.filter(
    (p) => selectedCategory === "Todas" || p.category === selectedCategory
  );

  const handleToggleFavorite = (planId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nowFavorited = toggleFavoritePlan(planId);
    setFavoritedPlanIds(getFavoritePlanIds());
    
    const plan = readingPlans.find((p) => p.id === planId);
    toast({
      title: nowFavorited ? "Plano Favoritado" : "Removido dos Favoritos",
      description: nowFavorited
        ? `"${plan?.title || 'Plano'}" foi adicionado ao menu Meus Favoritos.`
        : `"${plan?.title || 'Plano'}" foi removido dos favoritos.`,
    });
  };

  // Handle clicking on a day check button or item
  const handleDayClick = async (day: PlanDay) => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Você precisa fazer login para ativar planos de leitura e acompanhar seu progresso.",
        variant: "destructive",
      });
      return;
    }

    const isAlreadyDone = completedDays.includes(day.dayNumber);

    if (isAlreadyDone) {
      // If already done, user can toggle completion off directly or open saved view
      executeToggleDay(day.dayNumber);
      return;
    }

    if (!isCurrentPlanActive) {
      // Automatically activate plan when user clicks on an uncompleted day to mark it
      const updated = await setActivePlan(currentPlanViewed.id);
      setProgress(updated);
      setSelectedPlanId(currentPlanViewed.id);
    }

    // Opening completion reflection modal
    const existingRef = getPlanReflection(currentPlanViewed.id, day.dayNumber);
    setReflectionInput(existingRef?.reflectionText || "");
    setCompletingDay(day);
  };

  const handleSaveReflectionAndComplete = async () => {
    if (!completingDay) return;

    const dayNumber = completingDay.dayNumber;
    const readingsSummary = completingDay.readings
      .map((r) => `${r.bookName} ${r.chapter}${r.verseRange ? `:${r.verseRange}` : ""}`)
      .join(", ");

    const nowFormatted = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const newReflection: PlanReflection = {
      planId: currentPlanViewed.id,
      dayNumber,
      planTitle: currentPlanViewed.title,
      dayTitle: completingDay.title,
      devotionText: completingDay.devotionText,
      readingsSummary,
      reflectionText: reflectionInput.trim(),
      savedAt: nowFormatted
    };

    savePlanReflection(newReflection);
    setReflectionsMap(getPlanReflections());

    const updated = await toggleDayCompletion(currentPlanViewed.id, dayNumber);
    setProgress(updated);

    setCompletingDay(null);
    setReflectionInput("");

    toast({
      title: `Dia ${dayNumber} Concluído e Salvo!`,
      description: reflectionInput.trim() 
        ? "Sua reflexão foi salva no histórico permanente da lição."
        : "Leitura registrada com sucesso!",
    });
  };

  const executeToggleDay = async (dayNumber: number) => {
    const isNowCompleted = !completedDays.includes(dayNumber);
    const updated = await toggleDayCompletion(currentPlanViewed.id, dayNumber);
    setProgress(updated);

    if (isNowCompleted) {
      toast({
        title: `Dia ${dayNumber} Concluído`,
        description: `Seu progresso foi salvo com sucesso!`,
      });
    }
  };

  const handleOpenSavedLessonModal = (day: PlanDay) => {
    const savedRef = getPlanReflection(currentPlanViewed.id, day.dayNumber);
    setViewingSavedLesson({
      day,
      plan: currentPlanViewed,
      reflection: savedRef
    });
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Você precisa fazer login para ativar planos de leitura e acompanhar seu progresso.",
        variant: "destructive",
      });
      return;
    }

    const updated = await setActivePlan(planId);
    setProgress(updated);
    setSelectedPlanId(planId);
    setShowActivationModal(false);
    toast({
      title: "Plano Ativado!",
      description: "As leituras estão liberadas! Acompanhe seu progresso diário.",
    });
  };

  const handleDeactivatePlan = async () => {
    const updated = await setActivePlan(null);
    setProgress(updated);
    toast({
      title: "Plano Desativado",
      description: "Nenhum plano está ativo no momento. Você pode ativar qualquer plano quando desejar.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Active Plan Banner & Streak Overview */}
      {activePlan ? (
        <div className="glass-card rounded-2xl p-5 sm:p-7 border border-border bg-card/60 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border/60 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> Plano Ativo Em Andamento
                </span>
                {progress.streakDays > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-400">
                    <Flame className="h-3.5 w-3.5 fill-orange-400" /> {progress.streakDays} dias seguidos
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                  {activePlan.title}
                </h2>
                <button
                  onClick={(e) => handleToggleFavorite(activePlan.id, e)}
                  className={`p-2 rounded-full transition-colors ${
                    favoritedPlanIds.includes(activePlan.id)
                      ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                      : "text-muted-foreground hover:text-red-500 hover:bg-secondary"
                  }`}
                  title={favoritedPlanIds.includes(activePlan.id) ? "Remover dos Favoritos" : "Favoritar este Plano"}
                >
                  <Heart className={`h-5 w-5 ${favoritedPlanIds.includes(activePlan.id) ? "fill-red-500" : ""}`} />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {activePlan.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between">
              <div className="text-right">
                <span className="text-xs font-medium text-muted-foreground block">Progresso Total</span>
                <span className="font-sans text-xl font-extrabold text-accent">
                  {(progress.completedDaysByPlan[activePlan.id] || []).length} / {activePlan.durationDays} dias
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-xs text-accent">
                {Math.round(((progress.completedDaysByPlan[activePlan.id] || []).length / activePlan.durationDays) * 100)}%
              </div>
              
              {/* Deactivate Button */}
              <button
                onClick={handleDeactivatePlan}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all shrink-0 ml-2"
                title="Desativar este plano"
              >
                <PowerOff className="h-3.5 w-3.5" /> Desativar Plano
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.round(
                    ((progress.completedDaysByPlan[activePlan.id] || []).length / activePlan.durationDays) * 100
                  )}%`,
                }}
                className="h-full bg-accent transition-all duration-500 rounded-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-border/80 bg-card/60 text-center space-y-4 shadow-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-accent/10 text-accent border border-accent/20">
            <Lock className="h-7 w-7 text-accent" />
          </div>
          <div className="space-y-1.5 max-w-xl mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Nenhum Plano Ativado no Momento
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Para liberar a marcação das leituras diárias, escolha um plano no catálogo abaixo e clique em <strong className="text-accent font-bold">"Ativar Este Plano"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Plan Details & Day-by-Day List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-lg font-bold text-foreground">
                {currentPlanViewed.title}
              </h3>
              
              <button
                onClick={(e) => handleToggleFavorite(currentPlanViewed.id, e)}
                className={`p-1.5 rounded-full transition-colors ${
                  favoritedPlanIds.includes(currentPlanViewed.id)
                    ? "text-red-500 bg-red-500/10"
                    : "text-muted-foreground hover:text-red-500 hover:bg-secondary"
                }`}
                title={favoritedPlanIds.includes(currentPlanViewed.id) ? "Favoritado" : "Favoritar Plano"}
              >
                <Heart className={`h-4 w-4 ${favoritedPlanIds.includes(currentPlanViewed.id) ? "fill-red-500" : ""}`} />
              </button>

              {!isCurrentPlanActive && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/20">
                  <Info className="h-3 w-3" /> Inativo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedDays.length} de {currentPlanViewed.durationDays} dias concluídos ({percentComplete}%)
            </p>
          </div>

          {!isCurrentPlanActive ? (
            <button
              onClick={() => handleSelectPlan(currentPlanViewed.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <Zap className="h-4 w-4" /> Ativar Este Plano Agora
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" /> Plano Ativo
              </span>
              <button
                onClick={handleDeactivatePlan}
                className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 text-xs font-bold transition-all"
              >
                <PowerOff className="h-3.5 w-3.5" /> Desativar
              </button>
            </div>
          )}
        </div>

        {/* Notice if inactive */}
        {!isCurrentPlanActive && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
              <span>
                {completedDays.length > 0
                  ? `Seu progresso está salvo! (${completedDays.length} de ${currentPlanViewed.durationDays} dias concluídos). Ative este plano para continuar marcando seus dias.`
                  : 'Clique em "Ativar Este Plano Agora" para iniciar o acompanhamento diário e registrar suas reflexões.'}
              </span>
            </div>
            <button
              onClick={() => handleSelectPlan(currentPlanViewed.id)}
              className="px-3.5 py-1.5 bg-accent text-accent-foreground font-bold rounded-lg text-[11px] hover:opacity-90 transition-colors shrink-0 shadow-sm"
            >
              Ativar Este Plano Agora
            </button>
          </div>
        )}

        {/* Days List */}
        <div className="grid gap-3.5">
          {currentPlanViewed.days.map((day) => {
            const isDone = completedDays.includes(day.dayNumber);
            const savedRef = reflectionsMap[`${currentPlanViewed.id}_${day.dayNumber}`];

            return (
              <motion.div
                key={day.dayNumber}
                layout
                className={`glass-card rounded-xl p-4 border transition-all duration-200 ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                    : !isCurrentPlanActive
                    ? "border-border/60 bg-card/20 opacity-80"
                    : "border-border/80 bg-card/40 hover:border-accent/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleDayClick(day)}
                      className={`mt-0.5 shrink-0 rounded-full p-1 transition-transform active:scale-90 ${
                        isDone
                          ? "text-emerald-500"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                      title={
                        isDone
                          ? "Clique para desmarcar ou ver lição salva"
                          : "Concluir e responder reflexão da lição"
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-6 w-6 fill-emerald-500/20 text-emerald-500" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                          Dia {day.dayNumber}
                        </span>
                        <h4 className={`text-sm font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {day.title}
                        </h4>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="h-3 w-3" /> Concluído
                          </span>
                        )}
                      </div>

                      {day.devotionText && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {day.devotionText}
                        </p>
                      )}

                      {/* Passage readings with direct Reader link */}
                      <div className="pt-1.5 flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] text-muted-foreground font-medium">Leitura da Palavra:</span>
                        {day.readings.map((r, idx) => (
                          <Link
                            key={idx}
                            to={`/livro/${r.bookAbbrev}/${r.chapter}`}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary/80 hover:bg-accent/20 px-2.5 py-1 text-xs font-semibold text-foreground hover:text-accent border border-border transition-colors"
                          >
                            <BookOpen className="h-3 w-3 text-accent" />
                            {r.bookName} {r.chapter}
                            {r.verseRange ? `:${r.verseRange}` : ""}
                          </Link>
                        ))}
                      </div>

                      {/* Preview of saved reflection if present */}
                      {savedRef?.reflectionText && (
                        <div className="mt-2 rounded-lg bg-accent/5 border-l-2 border-accent p-2 text-xs text-muted-foreground">
                          <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                            <StickyNote className="h-3 w-3" /> Sua Reflexão Registrada:
                          </p>
                          <p className="italic line-clamp-2 text-foreground/90 mt-0.5">
                            "{savedRef.reflectionText}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Botão para ver a tela/lição salva sem editar */}
                    {(isDone || savedRef) && (
                      <button
                        onClick={() => handleOpenSavedLessonModal(day)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 text-xs font-bold transition-all shadow-sm"
                        title="Ver lição salva com reflexão em modo leitura"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver Lição Salva
                      </button>
                    )}

                    <button
                      onClick={() => handleDayClick(day)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : !isCurrentPlanActive
                          ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25"
                          : "bg-accent text-accent-foreground hover:opacity-90 shadow-sm"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Concluído
                        </>
                      ) : !isCurrentPlanActive ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" /> Ativar & Responder
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Responder & Marcar Lido
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Catalog of Plans Section */}
      <div className="pt-6 border-t border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">
              Catálogo de Planos de Leitura
            </h3>
            <p className="text-xs text-muted-foreground">
              Escolha o plano ideal para o seu momento, favorite e ative para acompanhar
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto themed-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-foreground font-bold"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPlans.map((plan) => {
            const isCurrentActive = activePlan?.id === plan.id;
            const isViewed = currentPlanViewed.id === plan.id;
            const planCompleted = progress.completedDaysByPlan[plan.id] || [];
            const isFav = favoritedPlanIds.includes(plan.id);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
                  isViewed
                    ? "border-accent ring-2 ring-accent/20 bg-accent/5"
                    : "border-border/80 bg-card/40 hover:border-border"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${plan.bgGradient}`}>
                      {plan.badge}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" /> {plan.durationDays} Dias
                      </span>
                      <button
                        onClick={(e) => handleToggleFavorite(plan.id, e)}
                        className={`p-1.5 rounded-full transition-colors ${
                          isFav
                            ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-secondary"
                        }`}
                        title={isFav ? "Remover dos Favoritos" : "Favoritar Plano"}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? "fill-red-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-lg font-bold text-foreground">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {planCompleted.length} / {plan.durationDays} dias lidos
                  </span>

                  {isCurrentActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeactivatePlan();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                    >
                      <PowerOff className="h-3.5 w-3.5" /> Desativar
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                    >
                      Ativar Plano
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: COMPLETION & REFLECTION SCREEN */}
      <AnimatePresence>
        {completingDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card rounded-2xl p-5 sm:p-7 border border-border bg-card shadow-2xl max-w-lg w-full space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent/15 text-accent">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
                      Concluir Lição - Dia {completingDay.dayNumber}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      {completingDay.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setCompletingDay(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Versículos / Passagens */}
              <div className="space-y-1.5 rounded-xl bg-secondary/40 p-3.5 border border-border/50">
                <p className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Passagens da Lição de Hoje:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {completingDay.readings.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground border border-border/80 shadow-xs"
                    >
                      {r.bookName} {r.chapter}{r.verseRange ? `:${r.verseRange}` : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Conteúdo / Devocional da Lição */}
              {completingDay.devotionText && (
                <div className="space-y-1 rounded-xl bg-card p-3.5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> Lição do Dia:
                  </p>
                  <p className="text-foreground/90">{completingDay.devotionText}</p>
                </div>
              )}

              {/* Caixa de Texto para Responder o que Entendeu */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <StickyNote className="h-4 w-4 text-accent" />
                    O que você entendeu desta lição?
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">Sua reflexão pessoal ({reflectionInput.length}/1500)</span>
                </label>
                <textarea
                  maxLength={1500}
                  value={reflectionInput}
                  onChange={(e) => setReflectionInput(e.target.value.slice(0, 1500))}
                  placeholder="Escreva aqui o que você entendeu, aprendeu ou sentiu ao ler este capítulo e lição da Palavra de Deus..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 leading-relaxed resize-none custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  onClick={() => setCompletingDay(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveReflectionAndComplete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Send className="h-4 w-4" /> Concluir e Salvar Lição
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: TELA DE LIÇÃO SALVA (SOMENTE LEITURA - SEM EDITAR) */}
      <AnimatePresence>
        {viewingSavedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card rounded-2xl p-5 sm:p-7 border border-accent/40 bg-card shadow-2xl max-w-lg w-full space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        Lição Salva & Concluída
                      </span>
                      {viewingSavedLesson.reflection?.savedAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          • {viewingSavedLesson.reflection.savedAt}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      Dia {viewingSavedLesson.day.dayNumber} — {viewingSavedLesson.day.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSavedLesson(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Versículos / Passagens */}
              <div className="space-y-1.5 rounded-xl bg-secondary/40 p-3.5 border border-border/50">
                <p className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Passagens da Lição:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {viewingSavedLesson.day.readings.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-foreground border border-border/80"
                    >
                      {r.bookName} {r.chapter}{r.verseRange ? `:${r.verseRange}` : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Devocional */}
              {viewingSavedLesson.day.devotionText && (
                <div className="space-y-1 rounded-xl bg-card p-3.5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> Conteúdo da Lição:
                  </p>
                  <p className="text-foreground/90">{viewingSavedLesson.day.devotionText}</p>
                </div>
              )}

              {/* Reflexão Registrada em Modo Leitura Protegido (Sem Editar) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <StickyNote className="h-4 w-4 text-accent" />
                    O Que Você Entendeu (Reflexão Salva)
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                    <LockKeyhole className="h-3 w-3 text-emerald-400" /> Sem edição
                  </span>
                </div>

                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2 relative">
                  {viewingSavedLesson.reflection?.reflectionText ? (
                    <p className="font-serif text-xs leading-relaxed text-foreground whitespace-pre-wrap italic">
                      "{viewingSavedLesson.reflection.reflectionText}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhuma anotação de texto foi escrita no momento da conclusão desta lição.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                {viewingSavedLesson.reflection?.reflectionText ? (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingSavedLesson.reflection?.reflectionText || "");
                      toast({ title: "Reflexão copiada!" });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar Minha Reflexão
                  </button>
                ) : <div />}

                <button
                  onClick={() => setViewingSavedLesson(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ACTIVATION REQUIRED PROMPT */}
      <AnimatePresence>
        {showActivationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 border border-border bg-card shadow-xl max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-serif text-base">
                  <Lock className="h-5 w-5" /> Ativação Necessária
                </div>
                <button
                  onClick={() => setShowActivationModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  Para marcar caixas de leitura e salvar seu progresso no plano <strong className="text-foreground">"{currentPlanViewed.title}"</strong>, você precisa ativá-lo primeiro.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowActivationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSelectPlan(currentPlanViewed.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Zap className="h-4 w-4" /> Ativar Plano Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
