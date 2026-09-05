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
                    <h3 className="font-bold text-foreground mb-1 text-sm">1. Aceitação dos Termos</h3>
                    <p>Ao acessar, cadastrar-se ou utilizar o site e o aplicativo Bíblia Online, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e Política de Privacidade. Caso o usuário não concorde com qualquer uma das disposições estabelecidas neste documento, deve abster-se imediatamente de utilizar os nossos serviços e funcionalidades.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">2. Uso da Inteligência Artificial (IA) e Isenção de Responsabilidade</h3>
                    <p>A Inteligência Artificial disponibilizada pela plataforma atua exclusivamente como ferramenta auxiliar para pesquisas, consultas e estudos bíblicos.</p>
                    <ul className="mt-2 space-y-1.5 pl-4 list-disc text-muted-foreground">
                      <li><strong className="text-foreground font-semibold">Ausência de Aconselhamento:</strong> As respostas e interações geradas por IA não substituem, sob nenhuma hipótese, o aconselhamento humano, seja ele pastoral, teológico, médico, jurídico, financeiro ou psicológico.</li>
                      <li><strong className="text-foreground font-semibold">Inconsistências e "Alucinações":</strong> Embora a plataforma adote medidas contínuas para mitigar erros, o usuário reconhece que sistemas de IA podem gerar conteúdos incorretos, imprecisos ou fora de contexto ("alucinações"). Tais respostas possuem caráter estritamente informativo e não devem ser utilizadas como fonte única para decisões pessoais.</li>
                      <li><strong className="text-foreground font-semibold">Escopo de Aplicação:</strong> Os avisos sobre as limitações da IA aplicam-se a todas as funcionalidades baseadas nessa tecnologia, incluindo o chat, o Fórum, o modo Bilíngue, o Dicionário e demais ferramentas integradas.</li>
                      <li><strong className="text-foreground font-semibold">Recomendação de Segurança:</strong> Desaconselha-se expressamente o envio ou compartilhamento de dados pessoais sensíveis, senhas, documentos ou informações financeiras no ambiente de chat com a IA.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">3. Privacidade e Proteção de Dados</h3>
                    <p>A segurança e a privacidade das informações dos usuários são compromissos prioritários do Bíblia Online. Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais contra acessos não autorizados, perdas ou alterações. Contudo, tendo em vista a natureza dos ambientes digitais, o usuário reconhece que nenhum sistema é inexpugnável. Ocorrendo qualquer incidente de segurança relevante, a plataforma agirá com prontidão para mitigar os impactos, em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">4. Ferramenta de Geração de Imagens</h3>
                    <p>O recurso de geração visual destina-se exclusivamente à criação de artes com versículos, trechos e mensagens de cunho cristão e edificante.</p>
                    <ul className="mt-2 space-y-1.5 pl-4 list-disc text-muted-foreground">
                      <li><strong className="text-foreground font-semibold">Uso Proibido:</strong> É vedada a utilização da ferramenta para gerar conteúdos ofensivos, ilícitos, difamatórios, de cunho odioso ou incompatíveis com a finalidade espiritual e ética da plataforma.</li>
                      <li><strong className="text-foreground font-semibold">Mecanismos de Controle e Sanções:</strong> A ferramenta conta com filtros automatizados que podem aplicar suspensões temporárias preventivas. Qualquer tentativa de burlar esses controles ou fazer uso indevido do sistema sujeitará a conta do usuário à análise técnica e humana, podendo acarretar o banimento definitivo, sem prejuízo das penalidades legais cabíveis.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">5. Contas de Usuário e Credenciais</h3>
                    <p>Ao criar uma conta no aplicativo, o usuário responsabiliza-se integralmente pela manutenção da confidencialidade de suas credenciais de acesso (e-mail e senha) e por todas as atividades realizadas sob sua conta. O acesso é estritamente pessoal e intransferível, sendo vedado o compartilhamento de credenciais com terceiros.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">6. Modificações dos Termos de Uso</h3>
                    <p>O Bíblia Online reserva-se o direito de revisar, alterar ou atualizar estes Termos a qualquer tempo, visando ao aprimoramento dos serviços ou ao cumprimento de exigências legais. Em caso de alterações substanciais que impactem os direitos dos usuários, envidaremos esforços razoáveis para notificá-los por meio da plataforma ou e-mail cadastrado. O uso continuado dos serviços após a publicação das alterações constituirá aceitação tácita dos novos Termos.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">7. Suporte e Atendimento ao Usuário</h3>
                    <p>O atendimento a dúvidas, solicitações de suporte e reclamações deve ser canalizado prioritariamente através do Fórum Bíblia Online, integrado ao sistema da plataforma. Para maior agilidade, o usuário poderá optar pelo Suporte Rápido de IA, ciente de que se trata de um atendimento automatizado sujeito a eventuais inconsistências informacionais. Atendimentos diretos também podem ser solicitados pelo e-mail: <a href="mailto:suporte.mundogospel@gmail.com" className="text-accent hover:underline font-semibold">suporte.mundogospel@gmail.com</a>.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">8. Exclusão de Conta e Eliminação de Dados</h3>
                    <p>O usuário possui o direito de encerrar sua conta e solicitar a exclusão de seus dados a qualquer momento. O procedimento pode ser realizado diretamente pelo aplicativo, na seção de configurações da conta, resultando no desligamento e remoção automatizada dos dados. Alternativamente, a solicitação pode ser formalizada por meio do nosso Portal de Direitos de Dados ou enviando um e-mail para <a href="mailto:suporte.mundogospel@gmail.com" className="text-accent hover:underline font-semibold">suporte.mundogospel@gmail.com</a>.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">9. Direitos sobre os Dados e Limitação de Responsabilidade por Terceiros</h3>
                    <p>Por meio do Portal de Direitos de Dados disponível em nosso site ou pelo e-mail <a href="mailto:suporte.mundogospel@gmail.com" className="text-accent hover:underline font-semibold">suporte.mundogospel@gmail.com</a>, o usuário pode exercer suas prerrogativas legais, solicitando:</p>
                    <ul className="my-2 space-y-1 pl-4 list-disc text-muted-foreground">
                      <li>Confirmação e acesso aos seus dados pessoais;</li>
                      <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                      <li>Exclusão permanente da conta e dados vinculados;</li>
                      <li>Portabilidade dos dados, mediante envio de relatório seguro ao e-mail cadastrado.</li>
                    </ul>
                    <p><strong className="text-foreground font-semibold">Isenções e Revisão:</strong> A plataforma garante o direito de revisão humana para casos de banimentos permanentes aplicados ao usuário. O Bíblia Online não se responsabiliza pela transmissão não autorizada de dados efetuada diretamente pelo próprio usuário a serviços externos, tampouco por indisponibilidades técnicas decorrentes de ataques cibernéticos ou falhas de infraestrutura alheias ao seu controle direto.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">10. Atendimento e Suporte Humano Complementar</h3>
                    <p>Garantimos ao usuário o direito de suporte para o uso adequado da plataforma. O atendimento inicial, o Suporte Rápido e os e-mails informativos podem ser intermediados por sistemas automatizados de Inteligência Artificial para otimização de tempo. Caso a resposta automatizada não solucione a demanda de maneira satisfatória, o usuário poderá acionar a opção Ajuda Humana no site ou escrever para <a href="mailto:suporte.mundogospel@gmail.com" className="text-accent hover:underline font-semibold">suporte.mundogospel@gmail.com</a>, direcionando a solicitação para nossa equipe especializada. O atendimento humano está sujeito a prazos de resposta que variam conforme a demanda do serviço.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">11. Avaliações, Feedbacks e Melhoria Contínua</h3>
                    <p>O usuário é incentivado a enviar avaliações, comentários e sugestões de melhoria por meio do Fórum, do Portal de Direitos de Dados ou do canal dedicado a Avaliações. Toda contribuição é tratada como subsídio para o aprimoramento da plataforma. Caso identifique imprecisões geradas pela IA nesses canais, o usuário deve acionar a ferramenta de Ajuda Humana para os devidos ajustes.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">12. Transparência no Processamento e Treinamento de IA</h3>
                    <p>Ao utilizar o chat da plataforma, o usuário interage com um modelo de Inteligência Artificial. Os dados das interações podem ser processados para fins de aprimoramento da experiência de uso, sendo submetidos a processos rigorosos de anonimização e pseudonimização. Nenhuma informação pessoal identificável será vinculada ao treinamento público de modelos, assegurando a conformidade com as diretrizes de privacidade dos nossos provedores de tecnologia.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">13. Coleta de Dados, Finalidades e Transferência Internacional</h3>
                    <p>Coletamos dados estritamente necessários para a operação e segurança da plataforma — tais como nome, endereço de e-mail e registros de acesso (endereço IP anonimizado) —, cumprindo as disposições do Marco Civil da Internet (Lei nº 12.965/2014) e da LGPD. Para garantir alta disponibilidade, a plataforma utiliza infraestrutura em nuvem de ponta (como Supabase e Vercel), o que pode envolver a transferência internacional de dados para servidores localizados no exterior. Tais prestadores adotam padrões globais rígidos de segurança da informação compatíveis com a legislação brasileira.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">14. Direitos do Titular dos Dados e Encarregado (Art. 18 da LGPD)</h3>
                    <p>Em conformidade com o Artigo 18 da LGPD, o usuário, na condição de titular dos dados pessoais, pode a qualquer momento requerer a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incorretos, a anonimização, bloqueio ou eliminação de dados desnecessários, bem como a revogação do consentimento.</p>
                    <p className="mt-1">As solicitações referentes à proteção de dados e ao exercício dos direitos do titular devem ser direcionadas ao nosso canal de atendimento / encarregado através do e-mail: <a href="mailto:suporte.mundogospel@gmail.com" className="text-accent hover:underline font-semibold">suporte.mundogospel@gmail.com</a>.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">15. Gerenciamento e Uso de Cookies</h3>
                    <p>A plataforma utiliza:</p>
                    <ul className="mt-1.5 space-y-1 pl-4 list-disc text-muted-foreground">
                      <li><strong className="text-foreground font-semibold">Cookies Essenciais:</strong> Indispensáveis para o funcionamento do sistema, autenticação de sessão e segurança;</li>
                      <li><strong className="text-foreground font-semibold">Cookies Analíticos:</strong> Utilizados (de forma opcional) para compreender o comportamento de navegação e melhorar a performance da aplicação. O usuário pode gerenciar suas preferências e aceite de cookies não essenciais a qualquer momento por meio do banner de consentimento disponibilizado na plataforma.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">16. Proteção de Menores de Idade</h3>
                    <p>O Bíblia Online incentiva o estudo bíblico por jovens e adolescentes.</p>
                    <ul className="mt-1.5 space-y-1 pl-4 list-disc text-muted-foreground">
                      <li><strong className="text-foreground font-semibold">Adolescentes (entre 12 e 18 anos):</strong> Declaram que utilizam a plataforma sob a supervisão de seus pais ou responsáveis legais.</li>
                      <li><strong className="text-foreground font-semibold">Crianças (menores de 12 anos):</strong> O cadastro e o fornecimento de qualquer dado pessoal deverão ser realizados exclusivamente por um dos pais ou pelo responsável legal, em estrita observância ao Artigo 14 da LGPD e ao Estatuto da Criança e do Adolescente (ECA).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">17. Segurança e Proteção (Sentinel Security)</h3>
                    <p>Para manter um ambiente seguro contra fraudes e acessos indevidos, nossa plataforma realiza um monitoramento contínuo. Se você encontrar uma "tela azul" no aplicativo, entenda que é uma medida automática de segurança para proteger a sua conta. Para normalizar o acesso, basta realizar o login na sua conta pelo botão “entrar e remover bloqueio” ou solicitar uma revisão pelo nosso fórum. Embora possamos restringir o uso em casos de atividades mal-intencionadas, asseguramos que todo usuário tem o direito de solicitar uma revisão do bloqueio a qualquer momento.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">18. Serviços de Terceiros e Processamento Terceirizado</h3>
                    <p>Para viabilizar as funcionalidades avançadas da aplicação, o Bíblia Online integra APIs de processamento de dados e modelos de linguagem mantidos por terceiros. Os dados pessoais identificáveis são removidos das requisições enviadas à IA sempre que viável. No entanto, o usuário é ostensivamente alertado a não inserir dados sigilosos, financeiros ou sensíveis no chat. Para tratar de assuntos confidenciais, o usuário deve recorrer exclusivamente aos canais de suporte humano.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">19. Natureza do Serviço e Diretrizes de Comunidade</h3>
                    <p>O Bíblia Online é um serviço de acesso público e gratuito destinado ao fomento e estudo da fé cristã. A utilização da plataforma está condicionada ao uso ético, respeitoso e alinhado com suas finalidades institucionais. Recomendamos que usuários que não concordem com os valores éticos e cristãos promovidos pela plataforma observem estritamente as diretrizes de convivência e respeitem o propósito comunitário do aplicativo.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">20. Propriedade Intelectual e Legislação Aplicável</h3>
                    <p>Todos os direitos de propriedade intelectual referentes ao software, código-fonte, interface visual, layout, arquitetura de sistema, bases de dados e conteúdos originais do Bíblia Online pertencem exclusivamente aos seus desenvolvedores e mantenedores, sendo protegidos pela legislação brasileira de direitos autorais e de software (Lei nº 9.610/1998 e Lei nº 9.609/1998). O acesso e uso da plataforma não concedem ao usuário qualquer licença, cessão ou direito de cópia, engenharia reversa ou reprodução não autorizada desses elementos.</p>
                    <p className="mt-2 text-xs font-semibold text-accent">Este documento é regido, interpretado e sujeito integralmente às leis vigentes da República Federativa do Brasil.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">21. Fotos e Arquivos Compartilhados</h3>
                    <p>Ao enviar imagens ou arquivos para a IA, lembre-se de que eles são processados por sistemas parceiros para gerar as respostas que você busca. Para sua segurança e privacidade, pedimos que não compartilhe fotos pessoais, documentos ou arquivos que não estejam relacionados ao estudo bíblico. Recomendamos usar apenas conteúdos que façam parte da sua pesquisa dentro do aplicativo.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground mb-1 text-sm">22. Programa Beta</h3>
                    <p>O acesso às funcionalidades em versão Beta é disponibilizado sem coleta de dados adicionais. Tratam-se de recursos finalizados para lançamento antecipado, que não apresentam riscos e destinam-se exclusivamente ao teste de novas funções pelo usuário.</p>
                  </section>

                  <div className="pt-4 flex justify-end pb-4 pr-1">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 rounded-xl bg-primary text-[12px] font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.05] active:scale-95 liquid-btn"
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
