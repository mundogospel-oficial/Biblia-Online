import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home, Search, Heart, Bot, Calendar, User } from "lucide-react";

const Header = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Início", icon: <Home className="h-4 w-4" /> },
    { to: "/buscar", label: "Buscar", icon: <Search className="h-4 w-4" /> },
    { to: "/ia", label: "IA", icon: <Bot className="h-4 w-4" /> },
    { to: "/favoritos", label: "Reações", icon: <Heart className="h-4 w-4" /> },
    { to: "/devocionais", label: "Devocional", icon: <Calendar className="h-4 w-4" /> },
    { to: "/criar", label: "Criar", icon: <Sparkles className="h-4 w-4" /> },
    { to: "/conta", label: "Conta", icon: <User className="h-4 w-4" /> },
  ];

  const mobileLinks = [
    { to: "/", icon: <Home className="h-5 w-5" /> },
    { to: "/buscar", icon: <Search className="h-5 w-5" /> },
    { to: "/ia", icon: <Bot className="h-5 w-5" /> },
    { to: "/devocionais", icon: <Calendar className="h-5 w-5" /> },
    { to: "/favoritos", icon: <Heart className="h-5 w-5" /> },
    { to: "/criar", icon: <Sparkles className="h-5 w-5" /> },
    { to: "/conta", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 hidden md:block glass-card safe-area-top !rounded-none">
        <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <img src="/icons/logo1.png" alt="Logo Bíblia Online" className="h-6 w-6 object-contain" />
            <span className="font-serif text-lg font-bold text-foreground">Biblia Online</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary whitespace-nowrap ${
                  location.pathname === l.to ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                {l.icon}
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-50 md:hidden glass-card !rounded-none safe-area-top">
        <div className="flex items-center justify-center px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/icons/logo1.png" alt="Logo Bíblia Online" className="h-8 w-8 object-contain" />
            <span className="font-serif text-xl font-bold text-foreground">Bíblia Online</span>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation - fixed at bottom, 2px padding */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ touchAction: 'none' }}>
        <div className="border-t border-border/50 bg-[hsl(215,40%,8%)]" style={{ paddingBottom: '2px' }}>
          <div className="flex items-center justify-around px-1 py-1.5">
            {mobileLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                  location.pathname === l.to || location.pathname.startsWith(l.to + '/') ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {l.icon}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
