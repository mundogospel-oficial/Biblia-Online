import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Calendar, Heart, Sun, Cloud, Zap, Star, Gift, Cross, Flame, BookOpen } from "lucide-react";

interface VerseEntry { text: string; reference: string; meditation: string; }

const daysOfWeek: { day: string; icon: React.ReactNode; verse: VerseEntry }[] = [
  { day: "Domingo", icon: <Sun className="h-4 w-4" />, verse: { text: "Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.", reference: "Salmos 118:24", meditation: "O domingo é um dia especial de celebração e gratidão. Deus nos concedeu mais um dia para viver, amar e servir ao próximo com alegria no coração. Quando acordamos pela manhã, podemos escolher a alegria — não porque tudo seja perfeito em nossas vidas, mas porque o Criador do universo está conosco em cada momento.\n\nQue tal começar o dia agradecendo por três coisas simples? Pode ser pela saúde, pela família, ou até mesmo pelo ar que respiramos. A gratidão transforma nossa perspectiva e nos aproxima de Deus. Lembre-se: cada dia é um presente, e o domingo é um convite para celebrar a bondade do Senhor em sua vida." } },
  { day: "Segunda", icon: <Zap className="h-4 w-4" />, verse: { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13", meditation: "O início da semana pode parecer pesado, com tantas responsabilidades e desafios pela frente. Mas lembre-se de uma verdade poderosa: você não precisa dar conta de tudo sozinho. A força que precisamos para enfrentar cada obstáculo vem diretamente de Deus, que nunca nos abandona.\n\nPaulo escreveu essas palavras enquanto estava preso, passando por dificuldades enormes. Se ele conseguiu encontrar força em Cristo naquela situação, nós também podemos. Cada desafio da segunda-feira é uma oportunidade de depender mais Dele. Entregue suas preocupações ao Senhor e confie que Ele vai te sustentar durante toda a semana." } },
  { day: "Terça", icon: <Heart className="h-4 w-4" />, verse: { text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1", meditation: "Imagine ter alguém que cuida de cada detalhe da sua vida — alguém que nunca dorme, nunca se cansa e nunca te abandona. Esse é o nosso Deus. Assim como um pastor conhece cada ovelha pelo nome, Deus conhece você profundamente e sabe exatamente do que você precisa.\n\nQuando Davi escreveu este salmo, ele sabia bem o que significava ser pastor. Ele enfrentou leões e ursos para proteger suas ovelhas. Da mesma forma, Deus nos protege dos perigos visíveis e invisíveis. Descanse nessa promessa hoje: com Deus como seu pastor, absolutamente nada vai faltar na sua vida. Ele supre todas as necessidades." } },
  { day: "Quarta", icon: <BookOpen className="h-4 w-4" />, verse: { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105", meditation: "No meio da semana, podemos nos sentir perdidos ou confusos sobre qual direção tomar. A Palavra de Deus funciona como um GPS espiritual — ela ilumina nosso caminho e nos mostra exatamente por onde devemos ir, passo a passo.\n\nNote que o salmista diz 'lâmpada para os meus pés', não para quilômetros à frente. Deus nos guia um passo de cada vez, e isso exige confiança. Quando você abrir a Bíblia hoje, leia com o coração aberto, pedindo ao Espírito Santo para revelar a direção certa. A Palavra de Deus nunca nos leva para o lugar errado — ela é segura, confiável e eterna." } },
  { day: "Quinta", icon: <Star className="h-4 w-4" />, verse: { text: "Confia no Senhor de todo o teu coração.", reference: "Provérbios 3:5", meditation: "Confiar é entregar o controle — e isso é uma das coisas mais difíceis de fazer. Muitas vezes queremos resolver tudo com nossa própria inteligência e capacidade, mas Deus nos convida a confiar Nele de todo o coração, sem reservas.\n\nA segunda parte do versículo diz: 'e não te estribes no teu próprio entendimento'. Isso não significa que devemos ignorar a razão, mas sim que nossa confiança final deve estar em Deus, não em nós mesmos. Quando entregamos nossas decisões, medos e sonhos a Ele, descobrimos que Seus planos são infinitamente melhores que os nossos. Pratique a confiança hoje — entregue aquela situação que te preocupa." } },
  { day: "Sexta", icon: <Cross className="h-4 w-4" />, verse: { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", reference: "João 3:16", meditation: "Na sexta-feira, lembramos do maior ato de amor da história da humanidade. Jesus Cristo, o Filho de Deus, deu Sua vida na cruz por cada um de nós. Esse amor não é baseado em nossos méritos ou boas obras — é pura graça, imerecida e abundante.\n\nPense nisso: antes mesmo de você nascer, Deus já tinha um plano de salvação para sua vida. Ele não esperou que fôssemos perfeitos para nos amar. O sacrifício de Jesus na cruz é a prova definitiva de que somos amados incondicionalmente. Viva essa sexta-feira com gratidão pelo preço que foi pago, e compartilhe esse amor com alguém que precisa ouvir essa mensagem." } },
  { day: "Sábado", icon: <Cloud className="h-4 w-4" />, verse: { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28", meditation: "O sábado é um convite sagrado ao descanso — não apenas o descanso físico do corpo, mas principalmente o descanso espiritual da alma. Jesus nos chama pessoalmente: 'Vinde a mim'. Ele não está distante, Ele está de braços abertos, esperando por você.\n\nNa correria da semana, acumulamos cansaço, estresse e preocupações. Mas Jesus promete aliviar nossos fardos quando os entregamos a Ele. Permita-se pausar hoje. Desconecte-se das pressões, respire fundo e passe um tempo na presença de Deus. Leia a Palavra, ore com sinceridade, e deixe que o Espírito Santo renove suas forças para a nova semana que se aproxima." } },
];

interface Category { name: string; icon: React.ReactNode; verses: VerseEntry[]; }

const categories: Category[] = [
  { name: "🎄 Natal", icon: <Gift className="h-4 w-4" />, verses: [
    { text: "Porque um menino nos nasceu, um filho se nos deu.", reference: "Isaías 9:6", meditation: "O Natal celebra a maior dádiva que Deus já deu à humanidade. Um bebê numa manjedoura simples mudou completamente a história do mundo para sempre. Isaías profetizou sobre Jesus centenas de anos antes do Seu nascimento, e cada detalhe se cumpriu perfeitamente.\n\nEsse menino que nasceu é chamado de Maravilhoso Conselheiro, Deus Forte, Pai da Eternidade e Príncipe da Paz. O verdadeiro significado do Natal vai muito além de presentes e festas — é sobre celebrar o amor infinito de Deus que se manifestou em forma humana para nos salvar." },
    { text: "E o Verbo se fez carne, e habitou entre nós.", reference: "João 1:14", meditation: "Deus não ficou distante observando nosso sofrimento do céu — Ele veio morar entre nós. O Criador do universo se tornou humano, experimentou fome, sede, cansaço e dor, tudo para se identificar conosco e nos mostrar o caminho da salvação.\n\nJoão usa a palavra 'Verbo' (Logos em grego) para descrever Jesus, mostrando que Ele é a expressão perfeita de Deus. Quando Jesus caminhou pela terra, as pessoas viram a glória de Deus face a face. Hoje, embora não possamos vê-Lo fisicamente, Ele continua habitando entre nós através do Espírito Santo em nossos corações." },
  ]},
  { name: "✝️ Páscoa", icon: <Cross className="h-4 w-4" />, verses: [
    { text: "Ele não está aqui, porque já ressuscitou.", reference: "Mateus 28:6", meditation: "O túmulo vazio é a prova definitiva de que a morte não teve a última palavra sobre Jesus Cristo. Quando as mulheres foram ao sepulcro naquela manhã, esperavam encontrar um corpo, mas encontraram uma promessa cumprida — a promessa da ressurreição.\n\nA Páscoa é o coração da fé cristã. Se Jesus não tivesse ressuscitado, nossa fé seria em vão. Mas Ele venceu a morte, e por causa disso, nós também temos a esperança da vida eterna. A pedra foi removida não para Jesus sair, mas para que nós pudéssemos olhar para dentro e ver que Ele vive. Essa verdade transforma tudo." },
  ]},
  { name: "😢 Tristeza", icon: <Cloud className="h-4 w-4" />, verses: [
    { text: "Perto está o Senhor dos que têm o coração quebrantado.", reference: "Salmos 34:18", meditation: "Nos momentos mais difíceis da vida, quando a tristeza parece nos consumir, Deus não está distante — pelo contrário, Ele se aproxima especialmente daqueles que sofrem. O salmista nos garante que Deus está perto dos coraçoes quebrantados.\n\nNão tenha vergonha de chorar ou de sentir dor. Jesus mesmo chorou diante do túmulo de Lázaro. Deus não nos condena por nossas emoções; Ele nos acolhe com compaixão. Se você está passando por um momento de tristeza, saiba que Deus está bem ao seu lado, secando suas lágrimas e cuidando das feridas do seu coração. Você não está sozinho nessa jornada." },
  ]},
  { name: "😰 Ansiedade", icon: <Zap className="h-4 w-4" />, verses: [
    { text: "Não andeis ansiosos de coisa alguma.", reference: "Filipenses 4:6", meditation: "A ansiedade tenta roubar nosso presente, nos fazendo viver no futuro que ainda não chegou. O apóstolo Paulo nos dá um antídoto poderoso contra ela: a oração com ações de graça. Em vez de se preocupar, apresente suas necessidades a Deus.\n\nO versículo completo diz: 'em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças'. Note que Paulo inclui 'ações de graças' — agradecer mesmo antes de receber a resposta é um ato de fé. Quando praticamos a gratidão, a paz de Deus, que excede todo entendimento, começa a guardar nosso coração e mente." },
  ]},
  { name: "💪 Força", icon: <Flame className="h-4 w-4" />, verses: [
    { text: "Não temas, porque eu sou contigo.", reference: "Isaías 41:10", meditation: "O medo é uma emoção real e poderosa, mas Deus é infinitamente maior do que qualquer medo que possamos enfrentar. Ele promete categoricamente estar conosco em todas as situações — nas batalhas, nas dificuldades e nos momentos de incerteza.\n\nO versículo continua: 'não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça'. São três promessas em uma: Ele fortalece, ajuda e sustenta. Quando você sentir que suas forças acabaram, lembre-se que a força de Deus se aperfeiçoa na nossa fraqueza. Confie Nele e avance com coragem." },
  ]},
  { name: "🙏 Gratidão", icon: <Star className="h-4 w-4" />, verses: [
    { text: "Em tudo dai graças.", reference: "1 Tessalonicenses 5:18", meditation: "A gratidão é uma escolha que transforma completamente nossa perspectiva sobre a vida. Paulo nos ensina a dar graças em todas as circunstâncias — não apenas quando tudo vai bem, mas também nos momentos difíceis, porque sabemos que Deus está no controle.\n\nPraticar a gratidão diariamente tem o poder de mudar nossa mente e coração. Quando agradecemos, tiramos o foco dos problemas e colocamos nossa atenção nas bênçãos que já temos. Experimente fazer uma lista de coisas pelas quais você é grato hoje. Você vai descobrir que as bênçãos de Deus são muito mais numerosas do que imaginava." },
  ]},
  { name: "❤️ Amor", icon: <Heart className="h-4 w-4" />, verses: [
    { text: "Amados, amemo-nos uns aos outros; porque o amor é de Deus.", reference: "1 João 4:7", meditation: "O amor verdadeiro não é apenas um sentimento passageiro — ele tem origem em Deus e é a marca principal de quem O conhece. João nos ensina que amar é uma consequência natural de conhecer a Deus, porque Deus é amor em sua essência.\n\nO amor que Deus nos ensina vai além das emoções. É um amor que escolhe servir, perdoar e se sacrificar pelo próximo, mesmo quando não é fácil. Jesus demonstrou esse amor supremo na cruz. Quando amamos uns aos outros, estamos refletindo o caráter de Deus para o mundo. Pergunte-se: como posso demonstrar o amor de Deus a alguém hoje?" },
  ]},
  { name: "🕊️ Paz", icon: <Cloud className="h-4 w-4" />, verses: [
    { text: "Tu conservarás em paz aquele cuja mente está firme em ti.", reference: "Isaías 26:3", meditation: "A paz interior que todos buscam começa com uma decisão simples: manter nossa mente firmada em Deus. Em um mundo cheio de distrações, notícias alarmantes e pressões constantes, fixar nossos pensamentos no Senhor é o segredo para uma paz que o mundo não pode dar nem tirar.\n\nIsaías nos revela que essa paz é 'conservada' por Deus — ou seja, Ele é quem a mantém, não nós. Nossa parte é manter a mente firme Nele, através da oração, leitura da Palavra e adoração. Quando os pensamentos ansiosos tentarem dominar sua mente, redirecione seu foco para Deus. A paz Dele vai envolver seu coração como um abraço." },
  ]},
];

const DevotionalPage = () => {
  const [activeTab, setActiveTab] = useState<"semana" | "ocasioes">("semana");
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);
  const todayIndex = new Date().getDay();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <section className="container mx-auto px-4 py-5 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
            <h1 className="font-serif text-lg font-bold text-foreground sm:text-2xl">Devocionais</h1>
          </div>
          <p className="mb-5 text-[11px] text-muted-foreground sm:text-sm">Versículos e meditações para cada momento</p>

          <div className="mb-5 flex gap-1.5">
            {[{ key: "semana" as const, label: "Dias da Semana" }, { key: "ocasioes" as const, label: "Ocasiões" }].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >{t.label}</button>
            ))}
          </div>

          {activeTab === "semana" && (
            <div className="space-y-2">
              {daysOfWeek.map((d, i) => {
                const isExpanded = expandedVerse === `semana-${i}`;
                return (
                  <motion.div key={d.day} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`glass-card rounded-lg p-3 transition-all cursor-pointer ${i === todayIndex ? "!border-accent !bg-accent/5" : ""}`}
                    onClick={() => setExpandedVerse(isExpanded ? null : `semana-${i}`)}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className={i === todayIndex ? "text-accent" : "text-muted-foreground"}>{d.icon}</span>
                      <span className={`text-xs font-semibold ${i === todayIndex ? "text-accent" : "text-foreground"}`}>
                        {d.day}
                        {i === todayIndex && <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[8px] text-accent">HOJE</span>}
                      </span>
                    </div>
                    <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{d.verse.text}"</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">— {d.verse.reference}</p>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 rounded-lg bg-secondary/50 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-2">📖 Meditação</p>
                        {d.verse.meditation.split("\n\n").map((paragraph, pi) => (
                          <p key={pi} className="text-xs leading-relaxed text-foreground/80 mb-2 last:mb-0">{paragraph}</p>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {activeTab === "ocasioes" && (
            <div className="space-y-4">
              {categories.map((cat, ci) => (
                <motion.div key={cat.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.03 }}>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{cat.name}</h3>
                  <div className="space-y-1.5">
                    {cat.verses.map((v, vi) => {
                      const key = `${ci}-${vi}`;
                      const isExpanded = expandedVerse === key;
                      return (
                        <div key={vi} className="glass-card rounded-lg p-3 cursor-pointer transition-colors hover:!border-accent"
                          onClick={() => setExpandedVerse(isExpanded ? null : key)}
                        >
                          <p className="font-serif text-xs italic leading-relaxed text-card-foreground">"{v.text}"</p>
                          <p className="mt-1 text-[10px] font-medium text-muted-foreground">— {v.reference}</p>
                          {isExpanded && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 rounded-lg bg-secondary/50 p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-2">📖 Meditação</p>
                              {v.meditation.split("\n\n").map((paragraph, pi) => (
                                <p key={pi} className="text-xs leading-relaxed text-foreground/80 mb-2 last:mb-0">{paragraph}</p>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default DevotionalPage;
