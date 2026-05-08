import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsent } from "./components/CookieConsent";
import Index from "./pages/Index";
import Reader from "./pages/Reader";
import CreatePage from "./pages/CreatePage";
import SearchPage from "./pages/SearchPage";
import FavoritesPage from "./pages/FavoritesPage";
import AIPage from "./pages/AIPage";
import DevotionalPage from "./pages/DevotionalPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const queryClient = new QueryClient();

const isSupabaseMisconfigured = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return !envUrl || !envUrl.startsWith('http') || !envKey || envKey.includes('YOUR_SUPABASE');
};

const ConfigErrorScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-card border border-destructive/20 rounded-xl p-6 shadow-xl text-center space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-foreground">Configuração do Supabase Inválida</h2>
      <div className="text-sm text-left text-muted-foreground space-y-4">
        <p>Parece que as chaves do Supabase não estão configuradas corretamente.</p>
        <p>Atualmente, o URL do Supabase salvo nos segredos (ícone de cadeado / Settings) no AI Studio parece ser um "hash" interno e não a URL real.</p>
        <div className="bg-secondary p-4 rounded-lg">
          <p className="font-semibold text-foreground mb-2">Como corrigir:</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Abra o menu de Segredos (ícone de cadeado / <i>Settings</i>) no AI Studio.</li>
            <li>Edite o segredo <strong>VITE_SUPABASE_URL</strong> colando a URL <b>REAL</b> do seu banco (ex: <i>https://xyz.supabase.co</i>).</li>
            <li>Certifique-se de que o segredo <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong> (ou ANON_KEY) também possui a chave pública real.</li>
            <li>Depois de alterar os segredos, atualize a página.</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  useEffect(() => {
    // Notify Service Worker that app is opened (for inactivity tracking)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: 'APP_OPENED' });
      }).catch(err => console.warn("App: SW not ready for signal", err));
    }

    // Proactively request notification permissions if supported
    if ("Notification" in window && Notification.permission === "default") {
      // Delay it slightly to not overwhelm the user on first load
      setTimeout(async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("Notification permission granted");
          }
        } catch (e) {
          console.warn("Error requesting notification permission:", e);
        }
      }, 8000); // 8 seconds delay
    }
  }, []);

  if (isSupabaseMisconfigured()) {
    return <ConfigErrorScreen />;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/livro/:abbrev/:chapter" element={<Reader />} />
              <Route path="/criar" element={<CreatePage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
              <Route path="/ia" element={<AIPage />} />
              <Route path="/devocionais" element={<DevotionalPage />} />
              <Route path="/conta" element={<AccountPage />} />
              <Route path="/atualizar-senha" element={<ResetPasswordPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      <CookieConsent />
    </AuthProvider>
  );
};

export default App;
