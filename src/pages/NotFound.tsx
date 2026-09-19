import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {/* Sutil iluminação de fundo no tema do app */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
        aria-hidden="true"
      >
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-sm sm:max-w-md mx-auto text-center"
      >
        <div className="bg-card/80 border border-border/80 rounded-2xl p-7 sm:p-9 shadow-xl backdrop-blur-md">
          {/* Ícone de aviso / erro */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <AlertTriangle className="w-8 h-8 stroke-[1.85]" />
            </div>
          </div>

          {/* Código 404 sutil */}
          <span className="inline-block text-xs font-semibold tracking-widest text-amber-400/90 uppercase mb-2">
            Erro 404
          </span>

          {/* Título: Página não encontrada */}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Página não encontrada
          </h1>

          {/* Mensagem simples e objetiva */}
          <p className="text-sm text-muted-foreground mb-6">
            O endereço que você acessou não existe ou foi removido.
          </p>

          {/* Botão de retorno ao Início */}
          <div className="flex justify-center">
            <Button
              asChild
              className="font-medium px-6 py-2.5 rounded-xl shadow-md"
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Ir para o Início
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



