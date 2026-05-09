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
                <h2 className="text-xl font-bold text-foreground font-serif tracking-tight">Termos de Uso e Política de Privacidade – Bíblia Online</h2>
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
                    <p>Ao acessar ou utilizar o site e o aplicativo Bíblia Online, o usuário manifesta sua concordância integral com estes Termos de Uso. Caso não concorde com quaisquer das diretrizes aqui estabelecidas, recomendamos que se abstenha de utilizar nossos serviços.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">2. Uso da Inteligência Artificial (IA) e Isenção de Responsabilidade</h3>
                    <p>Nossa Inteligência Artificial atua exclusivamente como uma ferramenta de apoio para pesquisas e estudos bíblicos, não substituindo, sob nenhuma hipótese, o aconselhamento humano ou pastoral. O Bíblia Online trabalha para minimizar eventuais inconsistências ou "alucinações" (erros gerados por sistemas de IA), mas reforça que as respostas geradas possuem caráter estritamente informativo. Elas não devem ser utilizadas como única base para decisões pessoais, jurídicas, médicas, financeiras ou espirituais relevantes. O aviso sobre essa limitação está disponível no próprio chat do aplicativo. As respostas do Fórum e de qualquer outra funcionalidade baseada em IA, incluindo o modo Bilíngue e o Dicionário, também estão sujeitas a essas imprecisões.</p>
                    <p className="mt-2 text-accent font-semibold italic text-xs">Aviso de Segurança: É expressamente desaconselhado o compartilhamento de dados pessoais, senhas ou informações financeiras no ambiente de chat da IA.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">3. Privacidade e Proteção de Dados</h3>
                    <p>A proteção da privacidade dos nossos usuários é uma prioridade. Adotamos práticas rigorosas de segurança da informação e criptografia para salvaguardar os dados pessoais coletados. O usuário compreende, contudo, que nenhum sistema digital é completamente imune a incidentes. Caso alguma eventualidade ocorra, a plataforma se compromete a agir com prontidão e em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">4. Ferramenta de Geração de Imagens</h3>
                    <p>Este recurso destina-se exclusivamente à criação de conteúdos visuais com versículos e mensagens de cunho cristão. O uso indevido da ferramenta para geração de conteúdos ofensivos, ilícitos ou incompatíveis com o propósito bíblico da plataforma resultará na análise da conta do usuário, podendo culminar em sanções que vão da suspensão temporária ao banimento definitivo.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">5. Contas de Usuário</h3>
                    <p>Ao registrar-se no aplicativo, o usuário assume responsabilidade exclusiva pela confidencialidade de suas credenciais de acesso, bem como por todas as atividades realizadas em sua conta. O acesso é estritamente pessoal e intransferível.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">6. Modificações dos Termos</h3>
                    <p>O Bíblia Online reserva-se o direito de revisar e atualizar estes Termos de Uso. Em caso de mudanças significativas que afetem os direitos dos usuários, envidaremos esforços para notificá-los previamente. A continuidade no uso da plataforma após a publicação das alterações será interpretada como concordância com os novos termos.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">7. Suporte e Atendimento ao Usuário</h3>
                    <p>Dúvidas, solicitações de suporte ou reclamações devem ser encaminhadas prioritariamente pelo Fórum Bíblia Online, ferramenta devidamente integrada ao sistema da plataforma.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">8. Exclusão de Conta</h3>
                    <p>O usuário tem the direito de excluir sua conta a qualquer momento. Essa ação pode ser realizada diretamente no aplicativo, por meio da página de configurações da conta, e o sistema excluirá automaticamente todos os dados associados. Alternativamente, o usuário pode solicitar a exclusão por meio do Portal de Direitos de Dados.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">9. Direitos sobre os Dados</h3>
                    <p>O usuário pode exercer seus direitos de dados acessando o Portal de Direitos de Dados, disponível em nosso site. Por meio desse portal, é possível solicitar: acesso aos seus dados; exclusão permanente de dados e da conta; correção de informações incorretas; e portabilidade de dados, com envio de um relatório completo para o e-mail cadastrado, de forma segura. Atualmente, a plataforma não utiliza IA para banir ou restringir usuários de forma autônoma. O Bíblia Online não se responsabiliza pelo envio de dados a serviços de terceiros realizado pelo próprio usuário, nem por restrições de acesso decorrentes de tentativas de ataque à infraestrutura do aplicativo.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">10. Atendimento e Ajuda Humana</h3>
                    <p>O usuário tem direito a suporte contínuo para os serviços do Bíblia Online. O atendimento inicial, o Suporte Rápido e as respostas por e-mail podem ser intermediados por sistemas de Inteligência Artificial para maior agilidade, estando sujeitos a eventuais imprecisões. Caso a IA não consiga resolver a sua solicitação de forma satisfatória, o usuário poderá acionar imediatamente a opção Ajuda Humana no site, garantindo o direcionamento do seu caso para a nossa equipe de suporte dedicada.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1">11. Avaliações e Melhoria Contínua</h3>
                    <p>O usuário tem o direito e é encorajado a enviar avaliações e feedbacks sobre o aplicativo. Disponibilizamos espaços dedicados a esse exercício no Fórum, no Portal de Direitos de Dados e no canal de Avaliações. Valorizamos cada contribuição e nos comprometemos a utilizá-la como subsídio para a melhoria contínua da experiência. Caso encontre qualquer inconsistência gerada pela IA nesses ambientes, recomendamos o uso da ferramenta de Ajuda Humana para os devidos esclarecimentos.</p>
                  </section>

                  <div className="pt-8 border-t border-white/5">
                    <h2 className="text-xl font-bold text-accent font-serif mb-6 tracking-tight">Política de Privacidade e LGPD</h2>
                    
                    <section className="mb-6">
                      <h3 className="font-bold text-foreground mb-2 text-sm">12. Transparência no Uso da IA</h3>
                      <p>Ao utilizar o chat da plataforma, o usuário interage com um sistema de Inteligência Artificial. As interações podem ser processadas com o objetivo de aprimorar a experiência, sendo garantida a anonimização rigorosa dos dados. Nenhuma informação pessoal será vinculada ao treinamento do modelo de forma que possa identificar o usuário, garantindo sua total privacidade em conformidade com as políticas dos nossos parceiros de tecnologia.</p>
                    </section>

                    <section className="mb-6">
                      <h3 className="font-bold text-foreground mb-2 text-sm">13. Coleta de Dados, Finalidade e Transferência Internacional</h3>
                      <p>A plataforma coleta dados básicos — nome, e-mail e logs de acesso com IP anonimizado — para fins de segurança, suporte e cumprimento do Marco Civil da Internet. A operação do sistema é sustentada por infraestrutura tecnológica de alta performance (como Supabase e Vercel), o que pode implicar o armazenamento em servidores internacionais. Esses servidores seguem padrões globais rigorosos de segurança, em plena compatibilidade com as exigências da LGPD.</p>
                    </section>

                    <section className="mb-6">
                      <h3 className="font-bold text-foreground mb-2 text-sm">14. Direitos do Titular dos Dados (Art. 18 da LGPD)</h3>
                      <p>É assegurado ao usuário o direito de acessar, retificar ou solicitar a exclusão permanente de seus dados pessoais. Os procedimentos para exclusão de conta e dos dados a ela vinculados podem ser realizados diretamente no menu de configurações do aplicativo ou por meio de solicitação no Portal de Direitos de Dados.</p>
                    </section>

                    <section className="mb-6">
                      <h3 className="font-bold text-foreground mb-2 text-sm">15. Gerenciamento e Uso de Cookies</h3>
                      <p>A plataforma utiliza cookies essenciais, necessários para autenticação e segurança, e cookies analíticos, de uso opcional. O usuário tem total autonomia para gerenciar suas preferências de cookies a qualquer momento por meio do banner de consentimento disponível na plataforma.</p>
                    </section>

                    <section className="mb-6">
                      <h3 className="font-bold text-foreground mb-2 text-sm">16. Usuários Menores de Idade</h3>
                      <p>O Bíblia Online incentiva o estudo das Escrituras por jovens. Usuários com menos de 18 anos declaram estar sob supervisão de seus pais ou responsáveis ao utilizar a plataforma. No caso de crianças com menos de 12 anos, o cadastro e o fornecimento de dados devem ser realizados exclusivamente pelo responsável legal, em estrita conformidade com o Art. 14 da LGPD.</p>
                    </section>

                    <section>
                      <h3 className="font-bold text-foreground mb-2 text-sm">17. Segurança e Prevenção de Abusos (Sentinel Security)</h3>
                      <p>Para garantir a integridade da plataforma e a segurança dos dados dos usuários, utilizamos tecnologias avançadas de monitoramento. Coletamos dados técnicos do dispositivo — como o fingerprint — e analisamos padrões de interação e navegação de forma anonimizada. O objetivo é detectar automações indevidas e prevenir ataques cibernéticos, assegurando que o acesso à plataforma ocorra de maneira legítima e protegida para toda a comunidade.</p>
                    </section>
                  </div>

                  <div className="pt-8 flex justify-end pb-4">
                    <button
                      onClick={onClose}
                      className="px-10 py-3 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.05] active:scale-95 liquid-btn"
                    >
                      Entendi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
