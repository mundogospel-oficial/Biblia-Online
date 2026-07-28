import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import zxcvbn from "zxcvbn";
import Header from "@/components/Header";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSentinel } from "@/hooks/useSentinel";
import { validatePasswordSecurity } from "@/utils/passwordValidator";
import { checkPwnedPassword } from "@/utils/pwnedPasswordValidator";

const translateAuthError = (message: string) => {
  if (!message) return "Ocorreu um erro ao atualizar a senha.";
  const lowered = message.toLowerCase();
  if (lowered.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (lowered.includes("new password should be different")) return "A nova senha deve ser diferente da antiga.";
  if (lowered.includes("401") || lowered.includes("unauthorized")) return "Sessão expirada. Tente novamente.";
  return "Ocorreu um erro ao atualizar a senha.";
};

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkRisk } = useSentinel();

  useEffect(() => {
    const hash = window.location.hash;
    // When returning from Supabase password reset, it usually appends a hash like #access_token=...&type=recovery
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const passValidation = validatePasswordSecurity(password);
    if (!passValidation.isValid) {
      toast({
        title: "Senha Insegura",
        description: passValidation.error,
        variant: "destructive",
      });
      return;
    }

    const pwnedResult = await checkPwnedPassword(password);
    if (pwnedResult.isPwned) {
      toast({
        title: "Senha Vazada / Insegura",
        description: pwnedResult.error,
        variant: "destructive",
      });
      return;
    }
    
    // Sentinel check
    const risk = await checkRisk();
    if (risk.score >= 70) {
      toast({ 
        title: "Ação Bloqueada", 
        description: "Atividade suspeita detectada. Tente novamente mais tarde.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "Erro", description: `Erro: ${translateAuthError(error.message)}`, variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Senha atualizada com sucesso!" });
      navigate("/conta");
    } catch (err: any) {
      toast({ title: "Erro", description: "Ocorreu um erro ao atualizar a senha.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto max-w-sm px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary">
              <KeyRound className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-xl font-bold text-foreground">Criar Nova Senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">Defina sua nova senha</p>
          </div>

          {ready ? (
            <form onSubmit={handleReset} className="space-y-3">
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" required minLength={6}
                  className="w-full rounded-xl border border-border bg-card pl-4 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>

              {password.length > 0 && (() => {
                const result = zxcvbn(password);
                const score = result.score;
                const colors = ['bg-destructive', 'bg-destructive', 'bg-[hsl(40,90%,50%)]', 'bg-[hsl(100,60%,45%)]', 'bg-[hsl(140,70%,40%)]'];
                const widths = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'];
                const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'];
                return (
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${colors[score]} ${widths[score]}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${score < 3 ? 'text-destructive' : 'text-muted-foreground'}`}>{labels[score]}</span>
                    </div>
                    {score < 3 && (
                      <p className="text-[11px] text-destructive">Para sua segurança, crie uma senha mais forte e menos comum.</p>
                    )}
                  </div>
                );
              })()}

              <button type="submit" disabled={loading || (password.length > 0 && zxcvbn(password).score < 3)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed liquid-btn"
              >
                {loading ? "Salvando..." : "Salvar Nova Senha"}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Link inválido ou expirado. Navegue de volta e solicite um novo link de recuperação.</p>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default ResetPasswordPage;