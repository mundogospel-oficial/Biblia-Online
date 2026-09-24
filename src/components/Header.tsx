import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home, Search, Heart, Bot, Calendar, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Header = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detecção estrita de Desktop real (apenas computadores com mouse/teclado, tela grande e fora de PWA móvel)
  // Em qualquer celular (Android, iOS, PWA, navegadores móveis), a barra de navegação fica SEMPRE no rodapé (bottom nav estilo iOS).
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const ua = (navigator.userAgent || "").toLowerCase();
    const isMobileUA = /iphone|ipad|ipod|android|mobile|blackberry|iemobile|kindle|silk|opera mini/i.test(ua);
    const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    const isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (window.navigator as any).standalone === true;
    
    // É desktop APENAS se não for mobile UA, não for touch, não for standalone e a tela tiver pelo menos 1024px
    return !isMobileUA && !isTouch && !isStandalone && window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleCheckDevice = () => {
      const ua = (navigator.userAgent || "").toLowerCase();
      const isMobileUA = /iphone|ipad|ipod|android|mobile|blackberry|iemobile|kindle|silk|opera mini/i.test(ua);
      const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      const isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || (window.navigator as any).standalone === true;
      
      const desktop = !isMobileUA && !isTouch && !isStandalone && window.innerWidth >= 1024;
      setIsDesktop(desktop);
    };

    handleCheckDevice();
    window.addEventListener("resize", handleCheckDevice);
    window.addEventListener("orientationchange", handleCheckDevice);
    return () => {
      window.removeEventListener("resize", handleCheckDevice);
      window.removeEventListener("orientationchange", handleCheckDevice);
    };
  }, []);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const isViewportSmall = window.visualViewport.height < window.innerHeight * 0.82;
        setIsKeyboardOpen(isViewportSmall);
      }
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
      }
    };
  }, []);

  const links = [
    { to: "/", label: t("nav_home"), shortLabel: t("nav_home"), icon: <Home className="h-4 w-4 shrink-0" /> },
    { to: "/buscar", label: t("nav_search"), shortLabel: t("nav_search"), icon: <Search className="h-4 w-4 shrink-0" /> },
    { to: "/ia", label: t("nav_ai"), shortLabel: t("nav_ai"), icon: <Bot className="h-4 w-4 shrink-0" /> },
    { to: "/devocionais", label: t("nav_devotional"), shortLabel: t("nav_devotional_short"), icon: <Calendar className="h-4 w-4 shrink-0" /> },
    { to: "/favoritos", label: t("nav_favorites"), shortLabel: t("nav_favorites"), icon: <Heart className="h-4 w-4 shrink-0" /> },
    { to: "/criar", label: t("nav_create"), shortLabel: t("nav_create"), icon: <Sparkles className="h-4 w-4 shrink-0" /> },
    { to: "/conta", label: t("nav_account"), shortLabel: t("nav_account"), icon: <User className="h-4 w-4 shrink-0" /> },
  ];

  const mobileLinks = [
    { to: "/", icon: <Home className="h-5 w-5" />, label: t("nav_home") },
    { to: "/buscar", icon: <Search className="h-5 w-5" />, label: t("nav_search") },
    { to: "/ia", icon: <Bot className="h-5 w-5" />, label: t("nav_ai") },
    { to: "/devocionais", icon: <Calendar className="h-5 w-5" />, label: t("nav_devotional_short") },
    { to: "/favoritos", icon: <Heart className="h-5 w-5" />, label: t("nav_favorites") },
    { to: "/criar", icon: <Sparkles className="h-5 w-5" />, label: t("nav_create") },
    { to: "/conta", icon: <User className="h-5 w-5" />, label: t("nav_account") },
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
      {/* Desktop Header - Exibido EXCLUSIVAMENTE em Computadores/Telas Grandes não móveis */}
      {isDesktop && (
        <header className="sticky top-0 z-50 hidden lg:block desktop-header-nav glass-card !rounded-none border-b border-border/50 safe-area-top shrink-0">
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
      )}

      {/* Mobile Top Header - Clean Glass Bar (Exibido em celulares, PWA e telas móveis) */}
      {!isDesktop && (
        <header className="sticky top-0 z-50 mobile-top-header block lg:hidden glass-card !rounded-none border-b border-border/50 safe-area-top shrink-0">
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
      )}

      {/* Mobile Bottom Navigation - Barra Fixa na Parte Inferior com Efeito Glass e Pílulas Ativas (Estilo iOS) */}
      {!isDesktop && !isKeyboardOpen && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav block lg:hidden border-t border-border/50 bg-[hsl(215,40%,8%)]/95 backdrop-blur-xl safe-area-bottom shadow-lg">
          <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
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
      )}
    </>
  );
};

export default Header;


