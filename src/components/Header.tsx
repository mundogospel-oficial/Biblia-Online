import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home, Search, Heart, Bot, Calendar, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Header = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const links = [
    { to: "/", label: t("nav_home"), icon: <Home className="h-4 w-4" /> },
    { to: "/buscar", label: t("nav_search"), icon: <Search className="h-4 w-4" /> },
    { to: "/ia", label: t("nav_ai"), icon: <Bot className="h-4 w-4" /> },
    { to: "/devocionais", label: t("nav_devotional"), icon: <Calendar className="h-4 w-4" /> },
    { to: "/favoritos", label: t("nav_favorites"), icon: <Heart className="h-4 w-4" /> },
    { to: "/criar", label: t("nav_create"), icon: <Sparkles className="h-4 w-4" /> },
    { to: "/conta", label: t("nav_account"), icon: <User className="h-4 w-4" /> },
  ];

  const mobileLinks = [
    { to: "/", icon: <Home className="h-5 w-5" />, label: "Início" },
    { to: "/buscar", icon: <Search className="h-5 w-5" />, label: "Buscar" },
    { to: "/ia", icon: <Bot className="h-5 w-5" />, label: "IA" },
    { to: "/devocionais", icon: <Calendar className="h-5 w-5" />, label: "Devocional" },
    { to: "/favoritos", icon: <Heart className="h-5 w-5" />, label: "Favoritos" },
    { to: "/criar", icon: <Sparkles className="h-5 w-5" />, label: "Criar" },
    { to: "/conta", icon: <User className="h-5 w-5" />, label: "Conta" },
  ];

  const isActiveRoute = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Header - Full-width Glass Bar with Oval Pills */}
      <header className="sticky top-0 z-50 hidden md:block glass-card !rounded-none border-b border-border/50 safe-area-top">
        <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/icons/logo2.png"
              alt="Logo Biblia Online"
              className="h-7 w-7 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-serif text-lg font-bold text-foreground">
              Biblia Online
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = isActiveRoute(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "text-primary-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="desktop-active-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {l.icon}
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Top Header - Clean Glass Bar */}
      <header className="sticky top-0 z-50 md:hidden glass-card !rounded-none border-b border-border/50 safe-area-top">
        <div className="flex items-center justify-center px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/icons/logo2.png"
              alt="Logo Biblia Online"
              className="h-7 w-7 object-contain"
            />
            <span className="font-serif text-lg font-bold text-foreground">
              Biblia Online
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Glass Bar with Oval Active Pills */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/50 bg-[hsl(215,40%,8%)]/95 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileLinks.map((l) => {
            const active = isActiveRoute(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-colors ${
                  active ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active-pill"
                    className="absolute inset-0 rounded-full bg-accent/15 border border-accent/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {l.icon}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;


