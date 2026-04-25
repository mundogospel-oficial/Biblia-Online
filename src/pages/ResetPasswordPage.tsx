import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada com sucesso! 🎉" });
      navigate("/conta");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto max-w-sm px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary">
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-lg font-bold text-foreground">Nova Senha</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Defina sua nova senha</p>
          </div>

          {ready ? (
            <form onSubmit={handleReset} className="space-y-2.5">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" required minLength={6}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar Nova Senha"}
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Link inválido ou expirado. Solicite um novo link de recuperação.</p>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
