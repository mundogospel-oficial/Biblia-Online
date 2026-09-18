import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home, Search, Heart, Bot, Calendar, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Header = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const checkKeyboardState = () => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputActive = !!activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable
      );

      if (!isInputActive) {
        setIsKeyboardOpen(false);
        return;
      }

      if (window.visualViewport) {
        const isViewportSmall = window.visualViewport.height < window.innerHeight * 0.72;
        setIsKeyboardOpen(isViewportSmall);
      } else {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        // Pequeno atraso para aguardar a animação do teclado
        setTimeout(checkKeyboardState, 150);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        const isInputActive = !!activeEl && (
          activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable
        );
        if (!isInputActive) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", checkKeyboardState);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", checkKeyboardState);
      }
    };
  }, []);

  const links = [
    { to: "/", label: t("nav_home"), shortLabel: t("nav_home"), icon: <Home className="h-4 w-4 shrink-0" /> },
    { to: "/buscar", label: t("nav_search"), shortLabel: t("nav_search"), icon: <Search className="h-4 w-4 shrink-0" /> },
    { to: "/ia", label: t("nav_ai"), shortLabel: t("nav_ai"), icon: <Bot className="h-4 w-4 shrink-0" /> },
    { to: "/devocionais", label: t("nav_devotional"), shortLabel: "Devocionais", icon: <Calendar className="h-4 w-4 shrink-0" /> },
    { to: "/favoritos", label: t("nav_favorites"), shortLabel: t("nav_favorites"), icon: <Heart className="h-4 w-4 shrink-0" /> },
    { to: "/criar", label: t("nav_create"), shortLabel: t("nav_create"), icon: <Sparkles className="h-4 w-4 shrink-0" /> },
    { to: "/conta", label: t("nav_account"), shortLabel: t("nav_account"), icon: <User className="h-4 w-4 shrink-0" /> },
  ];

  const mobileLinks = [
    { to: "/", icon: <Home className="h-5 w-5" />, label: "Início" },
    { to: "/buscar", icon: <Search className="h-5 w-5" />, label: "Buscar" },
    { to: "/ia", icon: <Bot className="h-5 w-5" />, label: "IA" },
    { to: "/devocionais", icon: <Calendar className="h-5 w-5" />, label: "Devocionais e Planos" },
    { to: "/favoritos", icon: <Heart className="h-5 w-5" />, label: "Favoritos" },
    { to: "/criar", icon: <Sparkles className="h-5 w-5" />, label: "Criar" },
    { to: "/conta", icon: <User className="h-5 w-5" />, label: "Conta" },
  ];

  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/livro") ||
        location.pathname.startsWith("/ler")
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop & Tablet Header - Full-width Glass Bar with Oval Pills */}
      <header className="sticky top-0 z-50 hidden md:block glass-card !rounded-none border-b border-border/50 safe-area-top shrink-0">
        <div className="w-full flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5">
          <Link to="/" className="flex items-center gap-2 md:gap-2.5 group shrink-0 select-none">
            <img
              src="/icons/logo2.png"
              alt="Logo Biblia Online"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="h-6 w-6 md:h-7 md:w-7 object-contain transition-transform duration-200 group-hover:scale-105 pointer-events-none select-none no-copy-logo shrink-0"
            />
            <span className="font-serif text-base md:text-lg font-bold text-foreground whitespace-nowrap">
              Biblia Online
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0">
            {links.map((l) => {
              const active = isActiveRoute(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative flex items-center gap-1.5 rounded-full px-3 md:px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
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
                  <span className="relative z-10 flex items-center gap-1 md:gap-1.5">
                    {l.icon}
                    <span className="hidden xl:inline">{l.label}</span>
                    <span className="inline xl:hidden">{l.shortLabel}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Top Header - Clean Glass Bar */}
      <header className="sticky top-0 z-50 md:hidden glass-card !rounded-none border-b border-border/50 safe-area-top shrink-0">
        <div className="flex items-center justify-center px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 select-none">
            <img
              src="/icons/logo2.png"
              alt="Logo Biblia Online"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="h-7 w-7 object-contain pointer-events-none select-none no-copy-logo"
            />
            <span className="font-serif text-lg font-bold text-foreground">
              Biblia Online
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Glass Bar with Oval Active Pills */}
      {!isKeyboardOpen && (
        <nav 
          id="mobile-bottom-navigation"
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/50 bg-[hsl(215,40%,8%)]/95 backdrop-blur-xl safe-area-bottom mobile-bottom-nav"
        >
          <div className="flex items-center justify-around px-1 py-1">
            {mobileLinks.map((l) => {
              const active = isActiveRoute(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-full transition-colors select-none ${
                    active ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-active-pill"
                      className="absolute inset-0 rounded-full bg-accent/15 border border-accent/30 pointer-events-none"
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
      )}
    </>
  );
};

export default Header;


