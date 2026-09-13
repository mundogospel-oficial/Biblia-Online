import { useState, useEffect, useCallback } from "react";
import { Clock, Bell, BellRing, Sparkles, Send, ShieldCheck, Sun, Moon, CheckCircle2, AlertCircle, RefreshCw, Radio, Server, Globe } from "lucide-react";
import Header from "@/components/Header";
import { getDailyVerseForSlot, sendLocalNotification, getNotificationSettings, saveNotificationSettings } from "@/services/notificationService";
import { dailyVerses } from "@/services/dailyVerses";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notificationsSent, setNotificationsSent] = useState<{ time: string; verse: string; slot: string; type: string }[]>([]);
  const [lastDispatchedSlot, setLastDispatchedSlot] = useState<string | null>(null);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(true);
  const [serverStatus, setServerStatus] = useState<{
    serverTime?: string;
    oneSignalConfigured?: boolean;
    hasAppId?: boolean;
    hasRestApiKey?: boolean;
    history?: any[];
  } | null>(null);
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [isPushingServer, setIsPushingServer] = useState(false);

  // Carregar status do servidor
  const checkServerSync = useCallback(async () => {
    setIsSyncingServer(true);
    try {
      const res = await fetch("/api/notifications/status");
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (e) {
      console.warn("Aviso ao sincronizar status do servidor:", e);
    } finally {
      setIsSyncingServer(false);
    }
  }, []);

  // Carregar status da permissão e histórico inicial
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }

    checkServerSync();

    // Carregar histórico local salvo
    try {
      const savedHistory = localStorage.getItem("biblia_clock_history");
      if (savedHistory) {
        setNotificationsSent(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error(e);
    }
  }, [checkServerSync]);

  // Calcular próximo horário de disparo (08:00 AM ou 20:00 PM)
  const getNextScheduledTarget = useCallback(() => {
    const now = currentTime;
    const targetMorning = new Date(now);
    targetMorning.setHours(8, 0, 0, 0);

    const targetEvening = new Date(now);
    targetEvening.setHours(20, 0, 0, 0);

    let nextTarget: Date;
    let slotName: "morning" | "evening";

    if (now < targetMorning) {
      nextTarget = targetMorning;
      slotName = "morning";
    } else if (now < targetEvening) {
      nextTarget = targetEvening;
      slotName = "evening";
    } else {
      // Amanhã às 8:00 AM
      nextTarget = new Date(targetMorning);
      nextTarget.setDate(nextTarget.getDate() + 1);
      slotName = "morning";
    }

    const diffMs = Math.max(0, nextTarget.getTime() - now.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return {
      nextTarget,
      slotName,
      hours,
      minutes,
      seconds,
      formattedCountdown: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
  }, [currentTime]);

  const { nextTarget, slotName, formattedCountdown } = getNextScheduledTarget();

  // Disparador de notificação para o slot (Local + Push Server)
  const triggerVerseNotification = useCallback(async (isEvening: boolean, isManual: boolean = false, sendPushServer: boolean = false) => {
    const verse = getDailyVerseForSlot(isEvening);
    const slotTitle = isEvening ? "Versículo da Noite (20:00)" : "Versículo da Manhã (08:00)";
    const fullTitle = `${slotTitle} - ${verse.reference}`;
    const timeFormatted = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    try {
      if (sendPushServer) {
        setIsPushingServer(true);
        const res = await fetch("/api/notifications/dispatch-slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEvening, verse })
        });
        const data = await res.json();
        
        if (data.success) {
          toast({
            title: "Push Global OneSignal Enviado!",
            description: `Versículo disparado para todos os dispositivos inscritos.`
          });
        } else if (!data.configured) {
          toast({
            title: "OneSignal Server",
            description: "Para enviar push mesmo com o app fechado, adicione ONESIGNAL_REST_API_KEY no menu de segredos.",
            variant: "destructive"
          });
        }
        checkServerSync();
      }

      // Envia notificação local / PWA
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          await sendLocalNotification(fullTitle, verse.text);
        } else if (isManual) {
          const req = await Notification.requestPermission();
          setPermission(req);
          if (req === "granted") {
            await sendLocalNotification(fullTitle, verse.text);
          }
        }
      }

      // Adiciona ao histórico do relógio
      const newEntry = {
        time: timeFormatted,
        verse: `${verse.reference}: "${verse.text}"`,
        slot: isEvening ? "20:00 PM (Noite)" : "08:00 AM (Manhã)",
        type: sendPushServer ? "Servidor Push (OneSignal)" : "Local / PWA"
      };

      setNotificationsSent(prev => {
        const updated = [newEntry, ...prev].slice(0, 15);
        try {
          localStorage.setItem("biblia_clock_history", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Salvar registro de disparo para evitar re-disparos no mesmo minuto
      const todayKey = `${new Date().toISOString().split('T')[0]}_${isEvening ? 'evening' : 'morning'}`;
      setLastDispatchedSlot(todayKey);

      if (!sendPushServer) {
        toast({
          title: isManual ? "Notificação enviada com sucesso!" : "Horário atingido: Notificação disparada!",
          description: `${verse.reference}: ${verse.text.slice(0, 70)}...`
        });
      }
    } catch (err: any) {
      console.error("Erro ao enviar notificação no Relógio:", err);
      toast({
        title: "Erro ao enviar notificação",
        description: err.message || "Verifique as permissões de notificação do navegador.",
        variant: "destructive"
      });
    } finally {
      setIsPushingServer(false);
    }
  }, [checkServerSync]);

  // Timer de 1 segundo para o relógio em tempo real e verificação de horários
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!autoDispatchEnabled) return;

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const todayStr = now.toISOString().split('T')[0];

      // Verificar 08:00 AM (Dispara no primeiro segundo do minuto 8:00)
      if (hours === 8 && minutes === 0 && seconds <= 2) {
        const morningKey = `${todayStr}_morning`;
        if (lastDispatchedSlot !== morningKey) {
          triggerVerseNotification(false, false, true);
        }
      }

      // Verificar 20:00 PM (Dispara no primeiro segundo do minuto 20:00)
      if (hours === 20 && minutes === 0 && seconds <= 2) {
        const eveningKey = `${todayStr}_evening`;
        if (lastDispatchedSlot !== eveningKey) {
          triggerVerseNotification(true, false, true);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoDispatchEnabled, lastDispatchedSlot, triggerVerseNotification]);

  const handleRequestPermission = async () => {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        // Habilitar nas configurações gerais também
        const settings = getNotificationSettings();
        settings.enabled = true;
        saveNotificationSettings(settings);
        toast({
          title: "Notificações Ativadas!",
          description: "O sistema agora enviará os versículos nos horários programados."
        });
      }
    }
  };

  const morningVersePreview = getDailyVerseForSlot(false);
  const eveningVersePreview = getDailyVerseForSlot(true);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10 selection:bg-primary/30">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Cabeçalho do Relógio */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span>Painel do Sistema de Notificações</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              Relógio de Versículos & Servidor Push
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento em tempo real sincronizado entre o navegador e o servidor para os horários de <strong className="text-foreground">08:00 AM</strong> e <strong className="text-foreground">20:00 PM</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-secondary/60 border border-border/60 rounded-xl p-2 px-3">
            <span className="text-xs text-muted-foreground">Disparo Automático:</span>
            <button
              onClick={() => setAutoDispatchEnabled(!autoDispatchEnabled)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                autoDispatchEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}
            >
              {autoDispatchEnabled ? "ATIVADO" : "PAUSADO"}
            </button>
          </div>
        </div>

        {/* Card do Relógio Principal e Contagem Regressiva */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Horário Atual */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-border/70 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" />
                Horário Atual do Sistema
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="my-6 text-center">
              <div className="font-mono text-5xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                {currentTime.toLocaleTimeString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground capitalize mt-2 font-medium">
                {currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Status do Navegador:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Sincronizado
              </span>
            </div>
          </div>

          {/* Próximo Disparo */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-accent/30 shadow-lg bg-gradient-to-br from-card/80 to-accent/5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-accent flex items-center gap-1.5">
                {slotName === "morning" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                Próximo Disparo Programado
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                {slotName === "morning" ? "08:00 AM" : "20:00 PM"}
              </span>
            </div>

            <div className="my-6 text-center">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Tempo Restante</div>
              <div className="font-mono text-4xl md:text-5xl font-extrabold tracking-tight text-accent drop-shadow-sm">
                {formattedCountdown}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Programado para às {nextTarget.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} de {nextTarget.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              </p>
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Permissão de Notificação:</span>
              {permission === "granted" ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Concedida
                </span>
              ) : permission === "denied" ? (
                <span className="text-destructive font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Bloqueada
                </span>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="text-accent hover:underline font-semibold flex items-center gap-1"
                >
                  <Bell className="h-3.5 w-3.5" /> Ativar Permissão
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card do Status do Servidor e OneSignal Push Engine */}
        <div className="glass-card rounded-2xl p-6 border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <h2 className="text-base font-serif font-bold text-foreground">
                Servidor de Disparo Automático (Mesmo com App Fechado)
              </h2>
            </div>
            <button
              onClick={checkServerSync}
              disabled={isSyncingServer}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingServer ? "animate-spin" : ""}`} />
              Atualizar Status
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 flex flex-col justify-between">
              <span className="text-muted-foreground">Temporizador do Servidor:</span>
              <span className="font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" /> Ativo (08:00 e 20:00)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 flex flex-col justify-between">
              <span className="text-muted-foreground">OneSignal Server Engine:</span>
              <span className={`font-semibold mt-1 flex items-center gap-1 ${serverStatus?.oneSignalConfigured ? "text-emerald-400" : "text-amber-400"}`}>
                {serverStatus?.oneSignalConfigured ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Conectado e Pronto
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-400" /> Aguardando REST API Key
                  </>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 flex flex-col justify-between">
              <span className="text-muted-foreground">Fuso Horário do Servidor:</span>
              <span className="font-semibold text-foreground mt-1 flex items-center gap-1">
                <Globe className="h-3 w-3 text-primary" /> América/São Paulo (BRT)
              </span>
            </div>
          </div>
        </div>

        {/* Painel de Ações Rápidas de Teste dos Slots */}
        <div className="glass-card rounded-2xl p-6 border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Testar Envio Instantâneo dos Versículos
            </h2>
            <span className="text-xs text-muted-foreground">Dispare agora para testar</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot Manhã (08:00) */}
            <div className="rounded-xl bg-secondary/40 border border-border/60 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sun className="h-4 w-4" />
                    Versículo da Manhã (08:00 AM)
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{morningVersePreview.reference}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{morningVersePreview.text}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => triggerVerseNotification(false, true, false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs font-semibold transition-all active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Notificação Local
                </button>

                <button
                  onClick={() => triggerVerseNotification(false, true, true)}
                  disabled={isPushingServer}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all active:scale-[0.98]"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Push Servidor (OneSignal)
                </button>
              </div>
            </div>

            {/* Slot Noite (20:00) */}
            <div className="rounded-xl bg-secondary/40 border border-border/60 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Moon className="h-4 w-4" />
                    Versículo da Noite (20:00 PM)
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{eveningVersePreview.reference}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{eveningVersePreview.text}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => triggerVerseNotification(true, true, false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-xs font-semibold transition-all active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Notificação Local
                </button>

                <button
                  onClick={() => triggerVerseNotification(true, true, true)}
                  disabled={isPushingServer}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all active:scale-[0.98]"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Push Servidor (OneSignal)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de Disparos Recentes */}
        <div className="glass-card rounded-2xl p-6 border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              Histórico de Disparos Desta Sessão
            </h2>
            {notificationsSent.length > 0 && (
              <button
                onClick={() => {
                  setNotificationsSent([]);
                  localStorage.removeItem("biblia_clock_history");
                  toast({ title: "Histórico limpo com sucesso" });
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {notificationsSent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs bg-secondary/20 rounded-xl border border-dashed border-border/50">
              Nenhuma notificação disparada recentemente nesta sessão.
              <br />
              O sistema disparará automaticamente assim que o relógio atingir <strong className="text-foreground">08:00 AM</strong> ou <strong className="text-foreground">20:00 PM</strong>.
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence>
                {notificationsSent.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px] shrink-0">
                        {item.slot}
                      </span>
                      <span className="text-foreground font-medium">{item.verse}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {item.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

