import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal = ({ isOpen, onClose }: TermsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] focus:outline-none overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 bg-accent/20 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 bg-primary/20 blur-[100px] rounded-full animate-pulse delay-700" />
              </div>

              <div className="relative flex items-center justify-between p-8 border-b border-white/5 bg-white/5">
                <h2 className="text-xl font-bold text-foreground font-serif tracking-tight">Termos de Uso – Bíblia Online</h2>
                <button 
                  onClick={onClose} 
                  className="rounded-full p-2 bg-white/5 hover:bg-white/10 hover:scale-110 transition-all duration-300"
                >
                  <X className="h-5 w-5 text-accent" />
                </button>
              </div>
                          <div className="relative flex-1 overflow-y-auto p-8 md:p-10 scrollbar-hide">
                <div className="space-y-6 text-[13px] leading-relaxed text-foreground/80 pb-6">
                <section>
                  <h3 className="font-bold text-foreground mb-1">1. Aceitação dos Termos</h3>
                  <p>Ao acessar ou utilizar o site e o aplicativo Bíblia Online, o usuário manifesta sua concordância integral com estes Termos de Uso. Caso não concorde com quaisquer das diretrizes aqui estabelecidas, orientamos que se abstenha de utilizar nossos serviços.</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">2. Uso da Inteligência Artificial (IA) e Isenção de Responsabilidade</h3>
                  <p>Nossa Inteligência Artificial atua exclusivamente como uma ferramenta assistiva para pesquisas e estudos bíblicos, não substituindo, sob nenhuma hipótese, o aconselhamento humano ou pastoral. O Bíblia Online exime-se de responsabilidade por eventuais inconsistências ou "alucinações" (erros técnicos) geradas pela IA, bem como por decisões tomadas pelo usuário com base nas informações fornecidas.</p>
                  <p className="mt-2 text-accent font-semibold italic text-xs">Aviso de Segurança: É expressamente desaconselhado o compartilhamento de dados pessoais, senhas ou informações financeiras no ambiente de chat da IA.</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">3. Privacidade e Proteção de Dados</h3>
                  <p>A proteção da sua privacidade é a nossa prioridade. Empregamos rigorosas práticas de segurança da informação e criptografia para salvaguardar seus dados. O usuário compreende, contudo, que nenhum sistema virtual é integralmente imune a incidentes. Em caso de eventualidades, a plataforma compromete-se a atuar com prontidão e em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">4. Ferramenta de Geração de Imagens</h3>
                  <p>Este recurso é destinado exclusivamente à criação de artes contendo versículos e mensagens de cunho cristão. A utilização indevida da ferramenta para a geração de conteúdos ofensivos, ilícitos ou divergentes do propósito bíblico ensejará a análise da conta do usuário, estando sujeita a sanções que variam da suspensão ao banimento definitivo da plataforma.</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">5. Contas de Usuário</h3>
                  <p>Ao registrar-se no aplicativo, o usuário assume a responsabilidade exclusiva pela manutenção da confidencialidade de suas credenciais de acesso, bem como por todas as atividades realizadas em sua conta. O acesso é de caráter estritamente pessoal e intransferível.</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">6. Modificações dos Termos</h3>
                  <p>O Bíblia Online reserva-se o direito de revisar e atualizar estes Termos de Uso a qualquer momento. A utilização contínua da plataforma após a implementação de eventuais alterações configurará a concordância tácita do usuário com os novos termos.</p>
                </section>

                <section>
                  <h3 className="font-bold text-foreground mb-1">7. Suporte e Atendimento ao Usuário</h3>
                  <p>Dúvidas, solicitações de suporte ou reclamações deverão ser encaminhadas exclusivamente por meio do Fórum Bíblia Online, ferramenta devidamente integrada ao nosso sistema.</p>
                </section>

                <div className="pt-8 border-t border-white/5">
                  <h2 className="text-xl font-bold text-accent font-serif mb-6 tracking-tight">Política de Privacidade e LGPD</h2>
                  
                  <section className="mb-6">
                    <h3 className="font-bold text-foreground mb-2 text-sm">8. Transparência no Uso da IA</h3>
                    <p>Ao utilizar nosso chat, o usuário interage com um sistema de Inteligência Artificial. As interações são processadas com a finalidade de aprimoramento e treinamento do modelo, assegurando-se rigorosamente a anonimização dos dados, conforme detalhado nas cláusulas a seguir.</p>
                  </section>

                  <section className="mb-6">
                    <h3 className="font-bold text-foreground mb-2 text-sm">9. Coleta de Dados, Finalidade e Transferência Internacional</h3>
                    <p>A plataforma realiza a coleta de dados básicos (Nome, E-mail e Logs de Acesso com IP anonimizado) para fins de segurança, suporte e cumprimento do Marco Civil da Internet. A operação do sistema é sustentada por infraestrutura tecnológica de alta performance (como Supabase e Vercel), o que pode implicar a transferência internacional de dados. Ressaltamos que tais servidores atendem a rigorosos padrões globais de segurança, em total compatibilidade com as exigências da LGPD.</p>
                  </section>

                  <section className="mb-6">
                    <h3 className="font-bold text-foreground mb-2 text-sm">10. Direitos do Titular dos Dados (Art. 18 da LGPD)</h3>
                    <p>É assegurado ao usuário o direito de acessar, retificar ou solicitar a exclusão permanente de seus dados pessoais. Os procedimentos para a exclusão da conta e dos dados a ela vinculados podem ser realizados diretamente no menu de configurações do aplicativo ou por meio de solicitação no Fórum.</p>
                  </section>

                  <section className="mb-6">
                    <h3 className="font-bold text-foreground mb-2 text-sm">11. Gerenciamento e Uso de Cookies</h3>
                    <p>A plataforma utiliza cookies essenciais, estritamente necessários para os processos de autenticação e segurança, e cookies analíticos, de caráter opcional. O usuário possui total autonomia para gerenciar suas preferências relativas aos cookies a qualquer momento, por meio do nosso banner de consentimento.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-2 text-sm">12. Usuários Menores de Idade</h3>
                    <p>O Bíblia Online incentiva o estudo das escrituras por jovens. Usuários menores de 18 anos declaram estar sob supervisão de seus pais ou responsáveis ao utilizar esta plataforma. No caso de crianças (menores de 12 anos), o cadastro e o fornecimento de dados devem ser realizados exclusivamente pelo responsável legal, em conformidade com o Art. 14 da LGPD.</p>
                  </section>
                </div>
              </div>
            </div>

              <div className="mt-2 p-8 pt-0">
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl bg-primary py-4 text-center text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-95 liquid-btn"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
