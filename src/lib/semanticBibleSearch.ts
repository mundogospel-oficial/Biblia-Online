/**
 * Motor Léxico-Semântico de Sentimentos e Conceitos Bíblicos (100% Offline / Sem IA)
 * 
 * Permite buscar versículos e passagens bíblicas baseando-se em sentimentos,
 * estados emocionais, dores humanas e conceitos teológicos (ex: "ansiedade",
 * "perdi alguém", "estou triste", "dívidas", "cura", "preciso de forças").
 * 
 * Executa em < 25ms, sem rede, sem custos de API e com preservação total de privacidade.
 */

import { bibleBooks } from "./bibleData";

export interface CuratedSemanticVerse {
  reference: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  contextReason: string;
}

export interface SemanticConcept {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  description: string;
  triggers: string[];
  synonyms: string[];
  curatedVerses: CuratedSemanticVerse[];
}

export interface SemanticVerseResult {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  score: number;
  conceptId?: string;
  conceptName?: string;
  conceptEmoji?: string;
  contextReason?: string;
}

export interface SemanticSearchResult {
  detectedConcept: SemanticConcept | null;
  allMatchedConcepts: SemanticConcept[];
  verses: SemanticVerseResult[];
  totalMatches: number;
  isConceptual: boolean;
  searchSummary?: string;
}

// ── 1. Taxonomia de Sentimentos, Dores e Conceitos Bíblicos ──
export const SEMANTIC_CONCEPTS: SemanticConcept[] = [
  {
    id: "ansiedade-medo",
    name: "Ansiedade e Preocupação",
    emoji: "🕊️",
    badge: "Paz e Descanso",
    description: "Passagens bíblicas de alívio, refúgio e a paz de Deus que excede todo o entendimento para acalmar a mente.",
    triggers: [
      "ansiedade", "ansioso", "ansiosa", "angustia", "angustiado", "angustiada",
      "preocupado", "preocupada", "preocupacao", "inquieto", "inquietacao",
      "panico", "crise de panico", "insonia", "nao consigo dormir", "noite em claro",
      "aflicao", "aflito", "aflita", "sufoco", "agonia", "nervoso", "nervosa",
      "nervosismo", "desespero", "desesperado", "taquicardia", "estresse"
    ],
    synonyms: [
      "paz", "descanso", "fardo", "alivio", "aquietar", "nao andeis ansiosos",
      "refugio", "rocha", "cuidado", "abrigo", "mansidao", "tranquilidade"
    ],
    curatedVerses: [
      {
        reference: "Filipenses 4:6-7",
        book_name: "Filipenses",
        chapter: 4,
        verse: 6,
        text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.",
        contextReason: "Ensina a substituir a preocupação pela oração e receber a paz sobrenatural de Deus."
      },
      {
        reference: "1 Pedro 5:7",
        book_name: "1 Pedro",
        chapter: 5,
        verse: 7,
        text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
        contextReason: "O Senhor te convida a entregar todo o peso do amanhã porque Ele cuida de você."
      },
      {
        reference: "Mateus 6:34",
        book_name: "Mateus",
        chapter: 6,
        verse: 34,
        text: "Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal.",
        contextReason: "Jesus nos orienta a viver o presente e confiar na providência diária do Pai."
      },
      {
        reference: "Salmos 94:19",
        book_name: "Salmos",
        chapter: 94,
        verse: 19,
        text: "Na multidão dos meus pensamentos dentro de mim, as tuas consolações recreiam a minha alma.",
        contextReason: "Quando a mente se enche de pensamentos agitados, a Palavra traz refrigério."
      },
      {
        reference: "Provérbios 12:25",
        book_name: "Provérbios",
        chapter: 12,
        verse: 25,
        text: "A ansiedade no coração deixa o homem abatido, mas uma boa palavra o alegra.",
        contextReason: "A sabedoria bíblica reconhece o impacto da ansiedade e aponta a palavra de Deus como alívio."
      },
      {
        reference: "Mateus 11:28",
        book_name: "Mateus",
        chapter: 11,
        verse: 28,
        text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.",
        contextReason: "O convite mais amoroso de Jesus para quem carrega fardos pesados demais."
      },
      {
        reference: "João 14:27",
        book_name: "João",
        chapter: 14,
        verse: 27,
        text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
        contextReason: "A promessa de Jesus de uma paz permanente que não depende das circunstâncias."
      }
    ]
  },
  {
    id: "medo-coragem",
    name: "Medo e Incerteza",
    emoji: "🛡️",
    badge: "Coragem e Proteção",
    description: "Versículos de vitória sobre o temor, fortalecimento nas tempestades e a presença constante do Senhor.",
    triggers: [
      "medo", "temor", "temeroso", "pavor", "terror", "assombro", "assustado",
      "inseguro", "inseguranca", "receio", "covardia", "futuro incerto", "pesadelo",
      "ameaca", "perigo", "trevas", "vulneravel"
    ],
    synonyms: [
      "nao temas", "coragem", "fortaleza", "escudo", "socorro", "amparo",
      "braco forte", "protecao", "livramento", "refugio", "baluarte"
    ],
    curatedVerses: [
      {
        reference: "Isaías 41:10",
        book_name: "Isaías",
        chapter: 41,
        verse: 10,
        text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
        contextReason: "Deus garante Sua presença e te segura firmemente com a mão direita."
      },
      {
        reference: "Josué 1:9",
        book_name: "Josué",
        chapter: 1,
        verse: 9,
        text: "Não te mandei eu? Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.",
        contextReason: "Um chamado divino à bravura respaldado na presença de Deus em cada passo."
      },
      {
        reference: "Salmos 23:4",
        book_name: "Salmos",
        chapter: 23,
        verse: 4,
        text: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.",
        contextReason: "Mesmo nos momentos mais escuros da vida, o Bom Pastor caminha ao seu lado."
      },
      {
        reference: "2 Timóteo 1:7",
        book_name: "2 Timóteo",
        chapter: 1,
        verse: 7,
        text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.",
        contextReason: "O medo não vem de Deus; fomos ungidos com coragem, amor e domínio próprio."
      },
      {
        reference: "Salmos 27:1",
        book_name: "Salmos",
        chapter: 27,
        verse: 1,
        text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?",
        contextReason: "A luz de Deus dissipa as sombras de qualquer ameaça humana ou espiritual."
      },
      {
        reference: "1 João 4:18",
        book_name: "1 João",
        chapter: 4,
        verse: 18,
        text: "No amor não há temor, antes o perfeito amor lança fora o temor; porque o temor tem consigo a pena, e o que teme não é perfeito em amor.",
        contextReason: "O amor incondicional de Deus desfaz todo medo e insegurança da nossa alma."
      }
    ]
  },
  {
    id: "tristeza-luto",
    name: "Tristeza, Luto e Choro",
    emoji: "💧",
    badge: "Consolo e Cura da Alma",
    description: "Palavras de consolo divino para corações partidos, momentos de perda, luto e lágrimas.",
    triggers: [
      "tristeza", "triste", "deprimido", "depressao", "luto", "falecimento",
      "perdi alguem", "morte", "pranto", "choro", "chorar", "lagrimas",
      "desolacao", "vazio", "dor no peito", "coracao partido", "angustia profunda",
      "saudade", "luto familiar", "desesperanca"
    ],
    synonyms: [
      "consolo", "alento", "enxugar lagrimas", "quebrantado", "misericordia",
      "alegria vem pela manha", "restauracao", "refrigerio", "esperanca"
    ],
    curatedVerses: [
      {
        reference: "Salmos 34:18",
        book_name: "Salmos",
        chapter: 34,
        verse: 18,
        text: "Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.",
        contextReason: "Deus não se afasta na dor; Ele se achega ainda mais perto do coração ferido."
      },
      {
        reference: "Apocalipse 21:4",
        book_name: "Apocalipse",
        chapter: 21,
        verse: 4,
        text: "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas.",
        contextReason: "A promessa eterna de que toda lágrima será enxugada pelo próprio Criador."
      },
      {
        reference: "Mateus 5:4",
        book_name: "Mateus",
        chapter: 5,
        verse: 4,
        text: "Bem-aventurados os que choram, porque eles serão consolados.",
        contextReason: "O carinho de Jesus garantindo que o choro da aflição será respondido com consolo divino."
      },
      {
        reference: "Salmos 30:5",
        book_name: "Salmos",
        chapter: 30,
        verse: 5,
        text: "O choro pode durar uma noite, mas a alegria vem pela manhã.",
        contextReason: "A dor é passageira; a aurora da restauração de Deus sempre desponta."
      },
      {
        reference: "Salmos 147:3",
        book_name: "Salmos",
        chapter: 147,
        verse: 3,
        text: "Sara os quebrantados de coração, e lhes ata as suas feridas.",
        contextReason: "Deus cuida como um médico amoroso de cada ferida aberta pela perda."
      },
      {
        reference: "2 Coríntios 1:3-4",
        book_name: "2 Coríntios",
        chapter: 1,
        verse: 3,
        text: "Bendito seja o Deus e Pai de nosso Senhor Jesus Cristo, o Pai das misericórdias e o Deus de toda a consolação, que nos consola em toda a nossa tribulação.",
        contextReason: "Deus é a fonte inesgotável de consolação em qualquer aflição que enfrentemos."
      }
    ]
  },
  {
    id: "cansaco-desanimo",
    name: "Cansaço e Desânimo",
    emoji: "⚡",
    badge: "Renovo e Força",
    description: "Versículos para quem está esgotado, exausto, sem forças ou com vontade de desistir.",
    triggers: [
      "cansaco", "cansado", "cansada", "esgotado", "esgotada", "exausto", "exausta",
      "sem forcas", "desanimo", "desanimado", "desanimada", "desistir", "fraqueza",
      "fraco", "fraca", "sobrecarga", "burnout", "desfalecer", "pesado", "sem energia"
    ],
    synonyms: [
      "renovar forcas", "asas de aguia", "descanso", "alento", "vigor", "sustento",
      "fortalecer", "animo", "refrigera a alma", "poder"
    ],
    curatedVerses: [
      {
        reference: "Isaías 40:29-31",
        book_name: "Isaías",
        chapter: 40,
        verse: 29,
        text: "Dá força ao cansado, e multiplica as forças ao que não tem nenhum vigor. Os jovens se cansarão e se fatigarão... Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.",
        contextReason: "A promessa clássica de renascimento físico e espiritual para quem confia em Deus."
      },
      {
        reference: "Gálatas 6:9",
        book_name: "Gálatas",
        chapter: 6,
        verse: 9,
        text: "E não nos cansemos de fazer bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.",
        contextReason: "Incentivo a permanecer firme, pois o fruto da sua dedicação certamente chegará."
      },
      {
        reference: "Filipenses 4:13",
        book_name: "Filipenses",
        chapter: 4,
        verse: 13,
        text: "Tudo posso naquele que me fortalece.",
        contextReason: "A nossa capacidade não vem de nós mesmos, mas da força inesgotável de Cristo."
      },
      {
        reference: "2 Coríntios 12:9",
        book_name: "2 Coríntios",
        chapter: 12,
        verse: 9,
        text: "E disse-me: A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza. De boa vontade, pois, me gloriarei nas minhas fraquezas, para que em mim habite o poder de Cristo.",
        contextReason: "Quando você se sente no limite da fraqueza, o poder divino se manifesta plenamente."
      },
      {
        reference: "Salmos 73:26",
        book_name: "Salmos",
        chapter: 73,
        verse: 26,
        text: "O meu coração e a minha carne podem falhar, mas Deus é a força do meu coração e a minha herança para sempre.",
        contextReason: "Mesmo se o corpo cansar, o Senhor permanece como nossa rocha inabalável."
      }
    ]
  },
  {
    id: "solidao-rejeicao",
    name: "Solidão e Rejeição",
    emoji: "🤝",
    badge: "Acolhimento e Companhia",
    description: "Versículos para quando você se sente sozinho no mundo, abandonado, esquecido ou incompreendido.",
    triggers: [
      "solidao", "sozinho", "sozinha", "abandonado", "abandonada", "desamparado",
      "desamparada", "isolado", "isolada", "rejeitado", "rejeitada", "rejeicao",
      "desprezado", "ninguem me entende", "ninguem se importa", "excluido",
      "vazio por dentro", "solitario"
    ],
    synonyms: [
      "comigo estas", "nunca te deixarei", "amigo fiel", "acolhimento", "amado",
      "presente", "pai dos orfaos", "abrigo"
    ],
    curatedVerses: [
      {
        reference: "Salmos 27:10",
        book_name: "Salmos",
        chapter: 27,
        verse: 10,
        text: "Porque, quando meu pai e minha mãe me desampararem, o Senhor me recolherá.",
        contextReason: "O amor do Pai Celestial é mais leal e acolhedor do que qualquer laço humano."
      },
      {
        reference: "Hebreus 13:5",
        book_name: "Hebreus",
        chapter: 13,
        verse: 5,
        text: "Porque ele disse: Não te deixarei, nem te desampararei.",
        contextReason: "Um compromisso selado por Deus: você nunca estará verdadeiramente sozinho."
      },
      {
        reference: "Isaías 49:15-16",
        book_name: "Isaías",
        chapter: 49,
        verse: 15,
        text: "Porventura pode uma mulher esquecer-se tanto de seu filho que cria... Todavia eu não me esquecerei de ti. Eis que nas palmas das minhas mãos te gravei.",
        contextReason: "Deus tem o seu nome gravado nas Suas mãos; Ele jamais se esquece de você."
      },
      {
        reference: "Provérbios 18:24",
        book_name: "Provérbios",
        chapter: 18,
        verse: 24,
        text: "Há um amigo mais chegado do que um irmão.",
        contextReason: "Jesus é o amigo fiel que caminha mais perto do que qualquer pessoa."
      },
      {
        reference: "Romanos 8:38-39",
        book_name: "Romanos",
        chapter: 8,
        verse: 38,
        text: "Porque estou certo de que nem a morte, nem a vida... nem qualquer outra criatura nos poderá separar do amor de Deus, que está em Cristo Jesus nosso Senhor.",
        contextReason: "Absolutamente nada pode cortar a sua comunhão com o amor inabalável de Deus."
      }
    ]
  },
  {
    id: "doenca-cura",
    name: "Enfermidade e Cura Divina",
    emoji: "🌿",
    badge: "Saúde e Milagre",
    description: "Passagens sobre restauração da saúde física e emocional, oração pelos enfermos e a graça curadora de Deus.",
    triggers: [
      "doenca", "doente", "enfermidade", "enfermo", "enferma", "dor", "dores",
      "dor fisica", "remedio", "hospital", "saude", "curar", "cura", "sarar",
      "cirurgia", "cancer", "infeccao", "diagnostico", "acamado", "fraqueza fisica",
      "cura divina", "milagre de cura"
    ],
    synonyms: [
      "medico dos medicos", "suas pisaduras", "sarados", "saude e cura",
      "virtude", "restauracao", "vida longa", "sara-me", "livramento"
    ],
    curatedVerses: [
      {
        reference: "Isaías 53:5",
        book_name: "Isaías",
        chapter: 53,
        verse: 5,
        text: "Mas ele foi ferido por causa das nossas transgressões, e moído por causa das nossas iniquidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados.",
        contextReason: "O sacrifício de Jesus na cruz comprou paz espiritual e restauração completa."
      },
      {
        reference: "Jeremias 17:14",
        book_name: "Jeremias",
        chapter: 17,
        verse: 14,
        text: "Sara-me, Senhor, e sararei; salva-me, e serei salvo; porque tu és o meu louvor.",
        contextReason: "A oração sincera de quem coloca seu corpo e vida exclusivamente nas mãos do Médico Divino."
      },
      {
        reference: "Salmos 103:2-3",
        book_name: "Salmos",
        chapter: 103,
        verse: 2,
        text: "Bendiz, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios. É ele quem perdoa todas as tuas iniquidades, e sara todas as tuas enfermidades.",
        contextReason: "Lembrança fiel de que o perdão e a cura são bênçãos do coração bondoso do Pai."
      },
      {
        reference: "Tiago 5:14-15",
        book_name: "Tiago",
        chapter: 5,
        verse: 14,
        text: "Está alguém entre vós doente? Chame os presbíteros da igreja, e orem sobre ele, ungindo-o com azeite em nome do Senhor; e a oração da fé salvará o doente, e o Senhor o levantará.",
        contextReason: "A instrução prática para buscar a oração de fé da comunidade cristã com autoridade."
      },
      {
        reference: "Êxodo 15:26",
        book_name: "Êxodo",
        chapter: 15,
        verse: 26,
        text: "Porque eu sou o Senhor que te sara.",
        contextReason: "A revelação do próprio Deus como Jeová Rafá — o Senhor que restaura e sara."
      }
    ]
  },
  {
    id: "provisao-financas",
    name: "Finanças, Dívidas e Provisão",
    emoji: "🌾",
    badge: "Provisão e Prosperidade",
    description: "Versículos sobre suprimento nas dificuldades financeiras, livramento de dívidas, trabalho e fidelidade a Deus.",
    triggers: [
      "dinheiro", "divida", "dividas", "desemprego", "desempregado", "desempregada",
      "falta de dinheiro", "contas", "crise financeira", "falencia", "escassez",
      "sustento", "fome", "precisando de dinheiro", "dificuldade financeira",
      "aluguel atrasado", "provisao financeira", "abrir portas de emprego"
    ],
    synonyms: [
      "jeova jireh", "o senhor provera", "nada faltara", "portas abertas",
      "trabalho", "prosperidade", "riquezas da gloria", "suprira", "bencaos"
    ],
    curatedVerses: [
      {
        reference: "Filipenses 4:19",
        book_name: "Filipenses",
        chapter: 4,
        verse: 19,
        text: "O meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus.",
        contextReason: "A certeza inabalável de que Deus conhece cada boleto e supre o necessário."
      },
      {
        reference: "Salmos 23:1",
        book_name: "Salmos",
        chapter: 23,
        verse: 1,
        text: "O Senhor é o meu pastor; nada me faltará.",
        contextReason: "A declaração de fé mais poderosa sobre a suficiência do cuidado divino."
      },
      {
        reference: "Mateus 6:31-33",
        book_name: "Mateus",
        chapter: 6,
        verse: 31,
        text: "Não andeis, pois, inquietos, dizendo: Que comeremos, ou que beberemos, ou com que nos vestiremos?... Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.",
        contextReason: "Alinhar o coração com o Reino de Deus abre o fluxo da providência celestial."
      },
      {
        reference: "Salmos 37:25",
        book_name: "Salmos",
        chapter: 37,
        verse: 25,
        text: "Fui moço, e agora sou velho; mas nunca vi desamparado o justo, nem a sua semente a mendigar o pão.",
        contextReason: "O testemunho de vida de Davi sobre a fidelidade protetora de Deus aos Seus filhos."
      },
      {
        reference: "2 Coríntios 9:8",
        book_name: "2 Coríntios",
        chapter: 9,
        verse: 8,
        text: "E Deus é poderoso para fazer abundar em vós toda a graça, a fim de que tendo sempre, em tudo, toda a suficiência, abundeis em toda a boa obra.",
        contextReason: "Deus capacita você a ter o suficiente para viver com dignidade e abençoar outros."
      }
    ]
  },
  {
    id: "perdao-culpa",
    name: "Culpa, Pecado e Perdão",
    emoji: "🕊️",
    badge: "Graça e Liberdade",
    description: "Versículos sobre reconciliação, libertação da culpa pelo sangue de Cristo e o poder de perdoar os outros.",
    triggers: [
      "culpa", "culpado", "culpada", "errei", "pecado", "pequei", "condenacao",
      "remorso", "vergonha", "arrependimento", "pedir perdao", "perdoar", "perdao",
      "magoa", "ressentimento", "limpar a mente", "peso na consciencia", "recomeco"
    ],
    synonyms: [
      "misericordia", "justificacao", "sangue de jesus", "purificar", "lavar",
      "nenhuma condenacao", "nova criatura", "graca superabundante"
    ],
    curatedVerses: [
      {
        reference: "1 João 1:9",
        book_name: "1 João",
        chapter: 1,
        verse: 9,
        text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda a injustiça.",
        contextReason: "A promessa límpida de perdão total e purificação imediata ao confessar a Deus."
      },
      {
        reference: "Romanos 8:1",
        book_name: "Romanos",
        chapter: 8,
        verse: 1,
        text: "Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.",
        contextReason: "A cruz anulou toda sentença de condenação sobre a sua vida."
      },
      {
        reference: "Salmos 103:12",
        book_name: "Salmos",
        chapter: 103,
        verse: 12,
        text: "Assim como está longe o oriente do ocidente, assim afasta de nós as nossas transgressões.",
        contextReason: "Quando Deus perdoa, Ele lança os erros no mar do esquecimento infinito."
      },
      {
        reference: "Efésios 4:32",
        book_name: "Efésios",
        chapter: 4,
        verse: 32,
        text: "Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.",
        contextReason: "Liberte sua alma da amargura perdoando a quem te ofendeu, assim como Cristo te perdoou."
      },
      {
        reference: "2 Coríntios 5:17",
        book_name: "2 Coríntios",
        chapter: 5,
        verse: 17,
        text: "Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.",
        contextReason: "O passado não define mais seu destino: em Jesus você recebeu um recomeço puro."
      }
    ]
  },
  {
    id: "fe-duvida",
    name: "Fé, Dúvida e Crise Espiritual",
    emoji: "✨",
    badge: "Fé e Firmeza",
    description: "Versículos para quando a fé balança, surgem dúvidas ou você precisa de um milagre na caminhada.",
    triggers: [
      "fe", "sem fe", "duvida", "duvidando", "incredulo", "incredulidade",
      "crise espiritual", "desviado", "longe de deus", "oracao nao respondida",
      "silencio de deus", "acreditar", "crer", "fortalecer a fe"
    ],
    synonyms: [
      "autor da fe", "tudo e possivel", "firme fundamento", "prova da fe",
      "montanhas se moverem", "confianca", "certeza"
    ],
    curatedVerses: [
      {
        reference: "Hebreus 11:1",
        book_name: "Hebreus",
        chapter: 11,
        verse: 1,
        text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.",
        contextReason: "A definição definitiva da fé como certeza espiritual antes da manifestação visível."
      },
      {
        reference: "Marcos 9:24",
        book_name: "Marcos",
        chapter: 9,
        verse: 24,
        text: "E logo o pai do menino, clamando, com lágrimas, disse: Eu creio, Senhor! ajuda a minha incredulidade.",
        contextReason: "Jesus acolhe o clamor honesto de quem deseja crer mesmo em meio às incertezas."
      },
      {
        reference: "Romanos 10:17",
        book_name: "Romanos",
        chapter: 10,
        verse: 17,
        text: "De sorte que a fé é pelo ouvir, e o ouvir pela palavra de Deus.",
        contextReason: "A fé se alimenta e cresce ao meditar continuamente nas Sagradas Escrituras."
      },
      {
        reference: "Mateus 17:20",
        book_name: "Mateus",
        chapter: 17,
        verse: 20,
        text: "Se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá, e há de passar; e nada vos será impossível.",
        contextReason: "Não é o tamanho da sua fé que move montes, mas o tamanho do Deus em quem você crê."
      },
      {
        reference: "Provérbios 3:5-6",
        book_name: "Provérbios",
        chapter: 3,
        verse: 5,
        text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
        contextReason: "A entrega total da razão à soberania e sabedoria de Deus."
      }
    ]
  },
  {
    id: "sabedoria-direcao",
    name: "Sabedoria e Direção para Decisões",
    emoji: "🧭",
    badge: "Discernimento e Guiamento",
    description: "Versículos para momentos de encruzilhada, escolhas difíceis, planos de vida e busca por clareza divina.",
    triggers: [
      "sabedoria", "decisao", "decidir", "direcao", "qual caminho", "o que fazer",
      "conselho", "orientacao", "duvida de futuro", "proposito", "proposito de vida",
      "discernimento", "clareza", "escolha dificil", "vontade de deus"
    ],
    synonyms: [
      "lampada para os pes", "conselheiro", "endireitar veredas", "temor do senhor",
      "instrucao", "entendimento", "prudencia", "guia"
    ],
    curatedVerses: [
      {
        reference: "Tiago 1:5",
        book_name: "Tiago",
        chapter: 1,
        verse: 5,
        text: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.",
        contextReason: "Deus concede sabedoria com generosidade e sem reprovações a quem pedir."
      },
      {
        reference: "Salmos 119:105",
        book_name: "Salmos",
        chapter: 119,
        verse: 105,
        text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.",
        contextReason: "A Bíblia ilumina os passos do hoje e a estrada do amanhã."
      },
      {
        reference: "Provérbios 16:3",
        book_name: "Provérbios",
        chapter: 16,
        verse: 3,
        text: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.",
        contextReason: "Entregue seus planos a Deus antes de executá-los e Ele alinhará suas ideias."
      },
      {
        reference: "Salmos 32:8",
        book_name: "Salmos",
        chapter: 32,
        verse: 8,
        text: "Instruir-te-ei, e ensinar-te-ei o caminho que deves seguir; guiar-te-ei com os meus olhos.",
        contextReason: "O Senhor promete te instruir pessoalmente em cada bifurcação da vida."
      },
      {
        reference: "Jeremias 33:3",
        book_name: "Jeremias",
        chapter: 33,
        verse: 3,
        text: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.",
        contextReason: "A oração sincera abre revelações e direções que os olhos humanos não enxergavam."
      }
    ]
  },
  {
    id: "familia-casamento",
    name: "Família, Casamento e Filhos",
    emoji: "🏡",
    badge: "Lar e Relacionamentos",
    description: "Versículos para restauração do casamento, proteção dos filhos, harmonia familiar e amor paciente.",
    triggers: [
      "familia", "casamento", "marido", "esposa", "conjuge", "casal", "filhos",
      "filho", "filha", "pais", "mae", "pai", "lar", "uniao familiar", "matrimonio",
      "crise no casamento", "divorcio", "brigas na familia", "amor conjugal"
    ],
    synonyms: [
      "heranca do senhor", "cordao de tres dobras", "amor paciente",
      "casa sobre a rocha", "paz no lar", "bencao na familia"
    ],
    curatedVerses: [
      {
        reference: "Josué 24:15",
        book_name: "Josué",
        chapter: 24,
        verse: 15,
        text: "Porém eu e a minha casa serviremos ao Senhor.",
        contextReason: "A bandeira sagrada da liderança e devoção de um lar firmado em Deus."
      },
      {
        reference: "1 Coríntios 13:4-7",
        book_name: "1 Coríntios",
        chapter: 13,
        verse: 4,
        text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com levidade, não se ensoberbece. Não se porta com indecência, não busca os seus interesses, não se irrita, não suspeita mal. Tudo sofre, tudo crê, tudo espera, tudo suporta.",
        contextReason: "A bússola do amor verdadeiro indispensável para qualquer casamento e lar."
      },
      {
        reference: "Salmos 127:3",
        book_name: "Salmos",
        chapter: 127,
        verse: 3,
        text: "Eis que os filhos são herança do Senhor, e o fruto do ventre o seu galardão.",
        contextReason: "Os filhos são presentes preciosos confiados por Deus aos pais."
      },
      {
        reference: "Eclesiastes 4:12",
        book_name: "Eclesiastes",
        chapter: 4,
        verse: 12,
        text: "E, se alguém prevalecer contra um, os dois lhe resistirão; e o cordão de três dobras não se quebra tão depressa.",
        contextReason: "Um casal que coloca Deus como a terceira dobra do casamento é inquebrável."
      },
      {
        reference: "Provérbios 22:6",
        book_name: "Provérbios",
        chapter: 22,
        verse: 6,
        text: "Educa a criança no caminho em que deve andar; e até quando envelhecer não se desviará dele.",
        contextReason: "O investimento espiritual na infância gera frutos eternos de retidão."
      }
    ]
  },
  {
    id: "protecao-espiritual",
    name: "Proteção Espiritual e Livramento",
    emoji: "⚔️",
    badge: "Armadura e Escudo",
    description: "Versículos de cobertura celestial contra ciladas espirituais, perigos, inveja e ataques malignos.",
    triggers: [
      "protecao", "proteger", "livramento", "livra-me", "inveja", "mal",
      "inimigo", "perigo", "tentacao", "armadura de deus", "batalha espiritual",
      "espiritual", "perseguicao", "fechado no sangue", "guarda meus passos"
    ],
    synonyms: [
      "esconderijo do altissimo", "anjos acampados", "torre forte", "escudo",
      "espada do espirito", "vencedores", "baluarte"
    ],
    curatedVerses: [
      {
        reference: "Salmos 91:1-2",
        book_name: "Salmos",
        chapter: 91,
        verse: 1,
        text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.",
        contextReason: "A cobertura espiritual máxima para quem faz de Deus sua morada."
      },
      {
        reference: "Salmos 91:11-12",
        book_name: "Salmos",
        chapter: 91,
        verse: 11,
        text: "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos. Eles te sustentarão nas suas mãos, para que não tropeces com o teu pé em pedra.",
        contextReason: "A guarda dos anjos celestiais destacada para a sua proteção em qualquer jornada."
      },
      {
        reference: "Efésios 6:10-11",
        book_name: "Efésios",
        chapter: 6,
        verse: 10,
        text: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder. Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as astutas ciladas do diabo.",
        contextReason: "A armadura divina para permanecer de pé diante de qualquer adversidade."
      },
      {
        reference: "Salmos 121:7-8",
        book_name: "Salmos",
        chapter: 121,
        verse: 7,
        text: "O Senhor te guardará de todo o mal; guardará a tua alma. O Senhor guardará a tua entrada e a tua saída, desde agora e para sempre.",
        contextReason: "A bênção perpétua de proteção para todas as suas idas e vindas."
      },
      {
        reference: "Provérbios 18:10",
        book_name: "Provérbios",
        chapter: 18,
        verse: 10,
        text: "Torre forte é o nome do Senhor; para ela corre o justo, e está em alto refúgio.",
        contextReason: "Invocar o Nome do Senhor é entrar na fortaleza mais impenetrável do universo."
      }
    ]
  },
  {
    id: "gratidao-louvor",
    name: "Gratidão, Louvor e Alegria",
    emoji: "🎉",
    badge: "Celebração e Bênção",
    description: "Versículos para transbordar gratidão a Deus, louvar por Suas bênçãos e celebrar a vitória.",
    triggers: [
      "gratidao", "agradecer", "agradecido", "agradecida", "obrigado deus",
      "louvor", "louvar", "alegria", "vitoria", "bencao", "felicidade",
      "celebrar", "cantar ao senhor", "exultar", "grato", "grata"
    ],
    synonyms: [
      "rendei gracas", "bendize o minha alma", "jubilo", "acao de gracas",
      "magnificar", "cantico novo", "alegria do senhor"
    ],
    curatedVerses: [
      {
        reference: "1 Tessalonicenses 5:16-18",
        book_name: "1 Tessalonicenses",
        chapter: 5,
        verse: 16,
        text: "Regozijai-vos sempre. Orai sem cessar. Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.",
        contextReason: "A gratidão como estilo de vida que transforma o ambiente espiritual."
      },
      {
        reference: "Salmos 103:1-2",
        book_name: "Salmos",
        chapter: 103,
        verse: 1,
        text: "Bendiz, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome. Bendiz, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.",
        contextReason: "Relembrar com louvor todas as misericórdias e milagres que Deus já fez."
      },
      {
        reference: "Neemias 8:10",
        book_name: "Neemias",
        chapter: 8,
        verse: 10,
        text: "Não vos entristeçais; porque a alegria do Senhor é a vossa força.",
        contextReason: "A verdadeira energia espiritual nasce da alegria imutável de pertencer a Deus."
      },
      {
        reference: "Salmos 118:24",
        book_name: "Salmos",
        chapter: 118,
        verse: 24,
        text: "Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele.",
        contextReason: "Cada novo dia é uma dádiva divina para celebrar a vida e o propósito."
      },
      {
        reference: "Filipenses 4:4",
        book_name: "Filipenses",
        chapter: 4,
        verse: 4,
        text: "Regozijai-vos sempre no Senhor; outra vez digo, regozijai-vos.",
        contextReason: "A exortação apostólica de manter o júbilo espiritual contínuo em Jesus."
      }
    ]
  },
  {
    id: "salvacao-graca",
    name: "Salvação, Graça e Esperança Eterna",
    emoji: "✝️",
    badge: "Cruz e Vida Eterna",
    description: "Versículos centrais sobre o amor infinito de Deus, o sacrifício redentor e a certeza da eternidade.",
    triggers: [
      "salvacao", "salvo", "salva", "vida eterna", "ceu", "cruz vazia", "graca",
      "amor de deus", "nascer de novo", "evangelho", "jesus salva", "redencao",
      "novo nascimento", "eternidade", "jesus cristo"
    ],
    synonyms: [
      "filho unigenito", "cre no senhor", "justificado", "ressurreicao",
      "caminho verdade e vida", "dom de deus"
    ],
    curatedVerses: [
      {
        reference: "João 3:16",
        book_name: "João",
        chapter: 3,
        verse: 16,
        text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
        contextReason: "O ápice do Evangelho: a demonstração máxima do amor incondicional de Deus."
      },
      {
        reference: "Efésios 2:8-9",
        book_name: "Efésios",
        chapter: 2,
        verse: 8,
        text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus. Não vem das obras, para que ninguém se glorie.",
        contextReason: "A salvação é um presente imerecido e irrevogável concedido pela graça do Pai."
      },
      {
        reference: "João 14:6",
        book_name: "João",
        chapter: 14,
        verse: 6,
        text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.",
        contextReason: "Jesus Cristo como a única ponte perfeita e viva de reconciliação com o Criador."
      },
      {
        reference: "Romanos 5:8",
        book_name: "Romanos",
        chapter: 5,
        verse: 8,
        text: "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.",
        contextReason: "Ele nos amou antes de qualquer merecimento, quando ainda estávamos perdidos."
      },
      {
        reference: "Romanos 10:9",
        book_name: "Romanos",
        chapter: 10,
        verse: 9,
        text: "A saber: Se com a tua boca confessares ao Senhor Jesus, e em teu coração creres que Deus o ressuscitou dentre os mortos, serás salvo.",
        contextReason: "O simples e poderoso passo de confissão e fé que sela o destino eterno."
      }
    ]
  }
];

// ── 2. Utilitários de Normalização e Stemming Semântico ──
export function normalizeSemanticStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "o", "a", "os", "as", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "como", "e", "ou", "que", "se",
  "meu", "minha", "meus", "minhas", "seu", "sua", "seus", "suas",
  "eu", "tu", "ele", "ela", "nos", "vos", "eles", "elas",
  "estou", "esta", "estamos", "estao", "sinto", "sentindo",
  "muito", "muita", "muitos", "muitas", "tao", "tanto", "tanta",
  "mais", "menos", "sobre", "quando", "onde", "porque", "por que",
  "ter", "tenho", "tem", "temos", "ha", "havia", "tinha",
  "vou", "vai", "vamos", "quero", "preciso", "ajuda", "me", "te"
]);

export function extractSemanticTokens(query: string): string[] {
  const norm = normalizeSemanticStr(query);
  if (!norm) return [];
  return norm
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

// ── 3. Detector de Conceitos e Sentimentos ──
export function detectSemanticConcepts(query: string): {
  topConcept: SemanticConcept | null;
  matchedConcepts: Array<{ concept: SemanticConcept; score: number }>;
} {
  const normQuery = normalizeSemanticStr(query);
  if (!normQuery) {
    return { topConcept: null, matchedConcepts: [] };
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const scoredList: Array<{ concept: SemanticConcept; score: number }> = [];

  for (const concept of SEMANTIC_CONCEPTS) {
    let score = 0;

    // Checagem de triggers diretos (frases completas ou termos de disparo)
    for (const trigger of concept.triggers) {
      const normTrigger = normalizeSemanticStr(trigger);
      if (!normTrigger) continue;

      if (normQuery === normTrigger) {
        score += 250;
      } else if (normQuery.includes(normTrigger)) {
        score += 160;
      } else {
        // Checagem token a token
        const triggerTokens = normTrigger.split(/\s+/);
        const allPresent = triggerTokens.every(t => normQuery.includes(t));
        if (allPresent && triggerTokens.length > 1) {
          score += 120;
        } else {
          for (const qToken of queryTokens) {
            if (qToken.length >= 3 && normTrigger.includes(qToken)) {
              score += 45;
            }
          }
        }
      }
    }

    // Checagem de sinônimos teológicos expandidos
    for (const syn of concept.synonyms) {
      const normSyn = normalizeSemanticStr(syn);
      if (!normSyn) continue;

      if (normQuery.includes(normSyn)) {
        score += 70;
      } else {
        for (const qToken of queryTokens) {
          if (qToken.length >= 4 && normSyn.includes(qToken)) {
            score += 25;
          }
        }
      }
    }

    // Checagem de nome do conceito
    const normName = normalizeSemanticStr(concept.name);
    if (normQuery.includes(normName)) {
      score += 140;
    }

    if (score >= 40) {
      scoredList.push({ concept, score });
    }
  }

  scoredList.sort((a, b) => b.score - a.score);

  return {
    topConcept: scoredList.length > 0 ? scoredList[0].concept : null,
    matchedConcepts: scoredList
  };
}

// ── 4. Motor de Busca Semântica em Versículos ──
export async function performSemanticBibleSearch(
  query: string,
  bibliaData?: any[]
): Promise<SemanticSearchResult> {
  const normQuery = normalizeSemanticStr(query);
  if (!normQuery) {
    return {
      detectedConcept: null,
      allMatchedConcepts: [],
      verses: [],
      totalMatches: 0,
      isConceptual: false
    };
  }

  const { topConcept, matchedConcepts } = detectSemanticConcepts(query);
  const isConceptual = topConcept !== null;
  const meaningfulTokens = extractSemanticTokens(query);

  const resultMap = new Map<string, SemanticVerseResult>();

  // A. Injeta versículos curados dos conceitos identificados com prioridade máxima
  if (topConcept) {
    for (const v of topConcept.curatedVerses) {
      const key = `${v.book_name.toLowerCase()}:${v.chapter}:${v.verse}`;
      resultMap.set(key, {
        book_name: v.book_name,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        reference: v.reference,
        score: 300,
        conceptId: topConcept.id,
        conceptName: topConcept.name,
        conceptEmoji: topConcept.emoji,
        contextReason: v.contextReason
      });
    }

    // Também adiciona os 2 primeiros versículos do segundo conceito mais relevante se houver
    if (matchedConcepts.length > 1) {
      const second = matchedConcepts[1].concept;
      for (const v of second.curatedVerses.slice(0, 2)) {
        const key = `${v.book_name.toLowerCase()}:${v.chapter}:${v.verse}`;
        if (!resultMap.has(key)) {
          resultMap.set(key, {
            book_name: v.book_name,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
            reference: v.reference,
            score: 240,
            conceptId: second.id,
            conceptName: second.name,
            conceptEmoji: second.emoji,
            contextReason: v.contextReason
          });
        }
      }
    }
  }

  // B. Se tiver os dados da Bíblia Livre (offline JSON), faz varredura léxico-semântica ultra rápida
  if (bibliaData && Array.isArray(bibliaData) && bibliaData.length > 0) {
    const searchTerms: Array<{ term: string; weight: number }> = [];

    // Termos da query limpa
    for (const token of meaningfulTokens) {
      if (token.length >= 3) {
        searchTerms.push({ term: token, weight: 60 });
      }
    }

    // Termos sinônimos do conceito identificado
    if (topConcept) {
      for (const syn of topConcept.synonyms.slice(0, 5)) {
        const normSyn = normalizeSemanticStr(syn);
        if (normSyn.length >= 4 && !meaningfulTokens.includes(normSyn)) {
          searchTerms.push({ term: normSyn, weight: 35 });
        }
      }
    }

    if (searchTerms.length > 0) {
      let scannedMatches = 0;
      const MAX_LOCAL_SCAN_MATCHES = 30;

      for (const book of bibliaData) {
        if (!book.capitulos || !Array.isArray(book.capitulos)) continue;

        const bookName = book.nome || book.name || "Bíblia";

        for (let c = 0; c < book.capitulos.length; c++) {
          const chapterArr = book.capitulos[c];
          if (!Array.isArray(chapterArr)) continue;

          for (let v = 0; v < chapterArr.length; v++) {
            const verseText = chapterArr[v];
            if (!verseText || typeof verseText !== "string") continue;

            const normVerse = normalizeSemanticStr(verseText);
            let verseScore = 0;

            for (const { term, weight } of searchTerms) {
              if (normVerse.includes(term)) {
                verseScore += weight;
              }
            }

            if (verseScore > 0) {
              const chapNum = c + 1;
              const verseNum = v + 1;
              const key = `${bookName.toLowerCase()}:${chapNum}:${verseNum}`;

              if (resultMap.has(key)) {
                // Soma pontuação caso já tenha entrado nos curados
                const existing = resultMap.get(key)!;
                existing.score += verseScore;
              } else if (verseScore >= 50 && scannedMatches < MAX_LOCAL_SCAN_MATCHES) {
                resultMap.set(key, {
                  book_name: bookName,
                  chapter: chapNum,
                  verse: verseNum,
                  text: verseText,
                  reference: `${bookName} ${chapNum}:${verseNum}`,
                  score: verseScore,
                  conceptId: topConcept?.id,
                  conceptName: topConcept?.name,
                  conceptEmoji: topConcept?.emoji,
                  contextReason: topConcept ? `Versículo com princípios de ${topConcept.name.toLowerCase()}` : undefined
                });
                scannedMatches++;
              }
            }
          }
        }
      }
    }
  }

  // C. Ordena por pontuação de relevância semântica
  const sortedVerses = Array.from(resultMap.values()).sort((a, b) => b.score - a.score);

  return {
    detectedConcept: topConcept,
    allMatchedConcepts: matchedConcepts.map(m => m.concept),
    verses: sortedVerses,
    totalMatches: sortedVerses.length,
    isConceptual,
    searchSummary: topConcept
      ? `Reconhecido sentimento/tema: "${topConcept.name}" — Encontradas ${sortedVerses.length} passagens sagradas de fortalecimento.`
      : undefined
  };
}
