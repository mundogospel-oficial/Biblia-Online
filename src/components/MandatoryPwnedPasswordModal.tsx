import React, { useState } from "react";
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, CheckCircle2, Lock } from "lucide-react";
import zxcvbn from "zxcvbn";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validatePasswordSecurity } from "@/utils/passwordValidator";
import { checkPwnedPassword } from "@/utils/pwnedPasswordValidator";

interface MandatoryPwnedPasswordModalProps {
  isOpen: boolean;
  pwnedCount: number;
  userEmail?: string;
  onSuccess: () => void;
}

export const MandatoryPwnedPasswordModal: React.FC<MandatoryPwnedPasswordModalProps> = ({
  isOpen,
  pwnedCount,
  userEmail,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("A confirmação de senha não coincide com a nova senha.");
      return;
    }

    // 1. Validação de estrutura e requisitos de segurança da senha
    const passVal = validatePasswordSecurity(newPassword, userEmail);
    if (!passVal.isValid) {
      setErrorMessage(passVal.error || "A senha digitada não atende aos requisitos de segurança.");
      return;
    }

    setLoading(true);

    try {
      // 2. Checagem em tempo real na API HaveIBeenPwned da NOVA senha
      const pwnedResult = await checkPwnedPassword(newPassword);
      if (pwnedResult.isPwned) {
        setErrorMessage(
          `A nova senha escolhida também já apareceu em ${pwnedResult.count.toLocaleString("pt-BR")} vazamentos de dados na internet. Escolha uma senha diferente e mais exclusiva.`
        );
        setLoading(false);
        return;
      }

      // 3. Atualização oficial da senha no Supabase Auth
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMessage(`Erro ao atualizar a senha no Supabase: ${error.message}`);
        setLoading(false);
        return;
      }

      toast({
        title: "Senha Atualizada com Sucesso! 🛡️",
        description: "Sua conta agora está protegida contra vazamentos conhecidos.",
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao atualizar sua senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formattedCount = pwnedCount.toLocaleString("pt-BR");

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans select-none">
      <div className="max-w-md w-full bg-[#0d1527] border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative space-y-5 text-foreground overflow-hidden">
        {/* Banner superior de alerta */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Troca de Senha Obrigatória
              </h2>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
                SEGURANÇA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Sua senha atual foi encontrada em vazamentos de dados
            </p>
          </div>
        </div>

        {/* Mensagem informativa */}
        <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-200/90 space-y-2 leading-relaxed">
          <p className="flex items-start gap-1.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Identificamos que sua senha atual consta em <b className="text-white underline">{formattedCount} vazamentos públicos de dados</b> na internet.
            </span>
          </p>
          <p className="text-[11px] text-slate-300">
            Para garantir a segurança da sua conta e proteger suas informações, você deve criar uma nova senha única antes de continuar.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Formulário de alteração de senha */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Digite uma Nova Senha Segura
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 8 caracteres)"
                className="w-full bg-[#131f37] border border-slate-700/80 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            {/* Medidor de Força com zxcvbn */}
            {newPassword.length > 0 && (() => {
              const zResult = zxcvbn(newPassword, [userEmail || "", "biblia", "gospel"]);
              const score = zResult.score;
              const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];
              const widths = ["w-1/5", "w-2/5", "w-3/5", "w-4/5", "w-full"];
              const labels = ["Muito Fraca", "Fraca", "Razoável", "Forte", "Muito Forte"];

              return (
                <div className="space-y-1 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${colors[score]} ${widths[score]}`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={score < 2 ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      Força: {labels[score]}
                    </span>
                    {score < 2 && (
                      <span className="text-slate-400">Combine letras, números e símbolos</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Confirme a Nova Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente a nova senha"
              className="w-full bg-[#131f37] border border-slate-700/80 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando e Cadastrando Nova Senha...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cadastrar Nova Senha e Continuar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
