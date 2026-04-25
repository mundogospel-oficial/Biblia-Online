import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/livro/:abbrev/:chapter" element={<Reader />} />
            <Route path="/criar" element={<CreatePage />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/ia" element={<AIPage />} />
            <Route path="/devocionais" element={<DevotionalPage />} />
            <Route path="/conta" element={<AccountPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
