export interface ReadingPassage {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verseRange?: string;
}

export interface PlanDay {
  dayNumber: number;
  title: string;
  readings: ReadingPassage[];
  devotionText?: string;
  reflectionQuestion?: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Geral" | "Antigo Testamento" | "Novo Testamento" | "Sabedoria" | "Temático" | "Iniciantes";
  durationDays: number;
  badge: string;
  color: string;
  bgGradient: string;
  iconName: "book" | "sparkles" | "flame" | "sun" | "heart" | "star";
  days: PlanDay[];
}

export const readingPlans: ReadingPlan[] = [
  {
    id: "biblia-365-dias",
    title: "Bíblia Inteira em 365 Dias",
    subtitle: "Toda a Palavra de Deus em 1 ano de caminhada diária",
    description: "Leia a Bíblia inteira do Gênesis ao Apocalipse em 365 dias com uma seleção equilibrada e diária do Antigo e Novo Testamento.",
    category: "Geral",
    durationDays: 365,
    badge: "Bíblia Toda",
    color: "from-amber-500 to-yellow-500",
    bgGradient: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconName: "book",
    days: Array.from({ length: 365 }, (_, i) => {
      const day = i + 1;
      const atBook = day <= 50 ? { abbrev: "gn", name: "Gênesis", ch: (day % 50) || 50 }
                   : day <= 90 ? { abbrev: "ex", name: "Êxodo", ch: ((day - 50) % 40) || 40 }
                   : day <= 140 ? { abbrev: "sl", name: "Salmos", ch: ((day - 90) % 150) || 150 }
                   : day <= 200 ? { abbrev: "is", name: "Isaías", ch: ((day - 140) % 66) || 66 }
                   : day <= 270 ? { abbrev: "jr", name: "Jeremias", ch: ((day - 200) % 52) || 52 }
                   : { abbrev: "ez", name: "Ezequiel", ch: ((day - 270) % 48) || 48 };

      const ntBook = day <= 180 ? { abbrev: "mt", name: "Mateus", ch: (day % 28) || 28 }
                   : day <= 280 ? { abbrev: "lc", name: "Lucas", ch: ((day - 180) % 24) || 24 }
                   : { abbrev: "rm", name: "Romanos", ch: ((day - 280) % 16) || 16 };

      return {
        dayNumber: day,
        title: `Dia ${day} - Leitura Anual da Bíblia`,
        readings: [
          { bookAbbrev: atBook.abbrev, bookName: atBook.name, chapter: atBook.ch },
          { bookAbbrev: ntBook.abbrev, bookName: ntBook.name, chapter: ntBook.ch }
        ],
        devotionText: `Avançando na leitura da Palavra no dia ${day}. Alimente sua alma com as promessas e verdades eternas de Deus.`,
        reflectionQuestion: "Que verdade principal você aprendeu na leitura de hoje?"
      };
    })
  },
  {
    id: "at-180-dias",
    title: "Antigo Testamento Completo em 180 Dias",
    subtitle: "Jornada profunda pelos 39 livros do Antigo Testamento",
    description: "Conheça a história da criação, o êxodo, a aliança, os reis de Israel, os Salmos de louvor e a voz forte dos profetas em 180 dias.",
    category: "Antigo Testamento",
    durationDays: 180,
    badge: "Antigo Testamento",
    color: "from-blue-600 to-indigo-600",
    bgGradient: "bg-blue-600/10 text-blue-400 border-blue-600/20",
    iconName: "book",
    days: Array.from({ length: 180 }, (_, i) => {
      const day = i + 1;
      const otBook = day <= 25 ? { abbrev: "gn", name: "Gênesis", ch: (day * 2) }
                   : day <= 45 ? { abbrev: "ex", name: "Êxodo", ch: ((day - 25) * 2) }
                   : day <= 80 ? { abbrev: "sl", name: "Salmos", ch: ((day - 45) * 2) }
                   : day <= 120 ? { abbrev: "is", name: "Isaías", ch: ((day - 80) % 66) || 66 }
                   : day <= 150 ? { abbrev: "jr", name: "Jeremias", ch: ((day - 120) % 52) || 52 }
                   : { abbrev: "dn", name: "Daniel", ch: ((day - 150) % 12) || 12 };

      return {
        dayNumber: day,
        title: `Dia ${day} - Antigo Testamento`,
        readings: [{ bookAbbrev: otBook.abbrev, bookName: otBook.name, chapter: otBook.ch }],
        devotionText: `Estudo e leitura contínua dos livros históricos, poéticos e proféticos do Antigo Testamento.`,
        reflectionQuestion: "Como Deus revelou Sua fidelidade e aliança neste trecho?"
      };
    })
  },
  {
    id: "paz-7-dias",
    title: "Vencendo a Ansiedade e Encontrando Paz",
    subtitle: "7 dias de paz bíblica e descanso para a alma",
    description: "Um plano de 7 dias com passagens bíblicas essenciais sobre superação do medo, descanso em Deus e renovação da mente através da oração e da palavra.",
    category: "Temático",
    durationDays: 7,
    badge: "Mais Popular",
    color: "from-blue-500 to-cyan-500",
    bgGradient: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    iconName: "sun",
    days: [
      {
        dayNumber: 1,
        title: "A Paz que Excede Todo Entendimento",
        readings: [{ bookAbbrev: "fp", bookName: "Filipenses", chapter: 4, verseRange: "4-9" }],
        devotionText: "Não andeis ansiosos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus, pela oração e súplica, com ação de graças. E a paz de Deus trará descanso ao seu coração.",
        reflectionQuestion: "Qual preocupação você pode entregar a Deus em oração hoje?"
      },
      {
        dayNumber: 2,
        title: "O Senhor é o Meu Pastor",
        readings: [{ bookAbbrev: "sl", bookName: "Salmos", chapter: 23, verseRange: "1-6" }],
        devotionText: "Deus promete nos guiar a águas tranqüilas e refrigério para a nossa alma, mesmo quando atravessamos o vale da sombra da morte.",
        reflectionQuestion: "Em qual área da sua vida você precisa se lembrar de que nada lhe faltará?"
      },
      {
        dayNumber: 3,
        title: "Lançando Sobre Ele Toda a Ansiedade",
        readings: [{ bookAbbrev: "1pe", bookName: "1 Pedro", chapter: 5, verseRange: "6-11" }],
        devotionText: "Humilhai-vos, pois, debaixo da potente mão de Deus, para que a seu tempo vos exalte; lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
        reflectionQuestion: "O que significa 'lançar' uma ansiedade e não carregá-la de volta?"
      },
      {
        dayNumber: 4,
        title: "Não Olhe para as Tempestades",
        readings: [{ bookAbbrev: "is", bookName: "Isaías", chapter: 41, verseRange: "10-13" }],
        devotionText: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
        reflectionQuestion: "Como saber que Deus te segura pela mão direita muda sua coragem hoje?"
      },
      {
        dayNumber: 5,
        title: "Buscando o Reino em Primeiro Lugar",
        readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 6, verseRange: "25-34" }],
        devotionText: "Olhai para as aves do céu... Olhai para os lírios do campo... Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo.",
        reflectionQuestion: "Que cuidado de Deus pela natureza te lembra do valor que você tem para Ele?"
      },
      {
        dayNumber: 6,
        title: "A Minha Paz Vos Dou",
        readings: [{ bookAbbrev: "jo", bookName: "João", chapter: 14, verseRange: "1-7" }, { bookAbbrev: "jo", bookName: "João", chapter: 14, verseRange: "27" }],
        devotionText: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
        reflectionQuestion: "Qual é a diferença entre a paz do mundo e a paz de Cristo?"
      },
      {
        dayNumber: 7,
        title: "Sob a Sombra do Onipotente",
        readings: [{ bookAbbrev: "sl", bookName: "Salmos", chapter: 91, verseRange: "1-16" }],
        devotionText: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Ele é o seu refúgio e a sua fortaleza.",
        reflectionQuestion: "Comemore a conclusão deste plano! Como sua mente se sente após 7 dias na Palavra?"
      }
    ]
  },
  {
    id: "cartas-30-dias",
    title: "Cartas Apostólicas em 30 Dias",
    subtitle: "De Romanos a Apocalipse com conselhos da Igreja Primitiva",
    description: "Leia as cartas epistolares de Paulo, Pedro, João, Tiago e Judas com princípios práticos para a fé diária e vida comunitária.",
    category: "Novo Testamento",
    durationDays: 30,
    badge: "Epístolas",
    color: "from-purple-500 to-indigo-500",
    bgGradient: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconName: "book",
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const epBooks = [
        { abbrev: "rm", name: "Romanos", ch: (day % 16) || 16 },
        { abbrev: "1co", name: "1 Coríntios", ch: (day % 16) || 16 },
        { abbrev: "ef", name: "Efésios", ch: (day % 6) || 6 },
        { abbrev: "hb", name: "Hebreus", ch: (day % 13) || 13 },
        { abbrev: "tg", name: "Tiago", ch: (day % 5) || 5 }
      ];
      const sel = epBooks[(day - 1) % epBooks.length];

      return {
        dayNumber: day,
        title: `Dia ${day} - ${sel.name} Capítulo ${sel.ch}`,
        readings: [{ bookAbbrev: sel.abbrev, bookName: sel.name, chapter: sel.ch }],
        devotionText: `Estudo da carta de ${sel.name} para fortalecimento da doutrina e da fé inabalável em Cristo.`,
        reflectionQuestion: "Qual exortação dos apóstolos te desafia hoje?"
      };
    })
  },
  {
    id: "jesus-21-dias",
    title: "Vida e Ensinamentos de Jesus",
    subtitle: "21 dias nos Evangelhos conhecendo Cristo",
    description: "Uma jornada inesquecível de 21 dias focada na pessoa, nos milagres, nas parábolas e no amor de Jesus Cristo relatados nos Evangelhos.",
    category: "Iniciantes",
    durationDays: 21,
    badge: "Iniciantes",
    color: "from-amber-500 to-orange-500",
    bgGradient: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    iconName: "sparkles",
    days: Array.from({ length: 21 }, (_, i) => {
      const day = i + 1;
      const chaptersMap: { [key: number]: { bookAbbrev: string; bookName: string; chapter: number; title: string; desc: string } } = {
        1: { bookAbbrev: "mt", bookName: "Mateus", chapter: 1, title: "O Nascimento do Salvador", desc: "Cumprimento das profecias e o nascimento de Jesus." },
        2: { bookAbbrev: "mt", bookName: "Mateus", chapter: 3, title: "O Batismo de Jesus", desc: "O início do ministério e a aprovação do Pai." },
        3: { bookAbbrev: "mt", bookName: "Mateus", chapter: 5, title: "O Sermão da Montanha", desc: "As bem-aventuranças e o verdadeiro caráter do reino." },
        4: { bookAbbrev: "mt", bookName: "Mateus", chapter: 6, title: "A Oração do Pai Nosso", desc: "Como orar com sinceridade e confiança divina." },
        5: { bookAbbrev: "mc", bookName: "Marcos", chapter: 2, title: "Perdão e Cura do Paralítico", desc: "O poder de Jesus sobre a enfermidade e o pecado." },
        6: { bookAbbrev: "mc", bookName: "Marcos", chapter: 4, title: "A Parábola do Semeador e a Acalma da Tempestade", desc: "Jesus demonstra autoridade sobre a natureza." },
        7: { bookAbbrev: "mc", bookName: "Marcos", chapter: 5, title: "Fé e Milagres Extraordinários", desc: "Curas e ressurreição mediante a fé viva." },
        8: { bookAbbrev: "lc", bookName: "Lucas", chapter: 2, title: "A Infância de Jesus e no Templo", desc: "Crescimento em sabedoria, estatura e graça." },
        9: { bookAbbrev: "lc", bookName: "Lucas", chapter: 10, title: "O Bom Samaritano", desc: "Quem é o nosso próximo e o amor em ação." },
        10: { bookAbbrev: "lc", bookName: "Lucas", chapter: 15, title: "A Parábola do Filho Pródigo", desc: "O abraço amoroso do Pai que nos acolhe de volta." },
        11: { bookAbbrev: "lc", bookName: "Lucas", chapter: 19, title: "Zaqueu e o Propósito do Filho do Homem", desc: "Jesus veio buscar e salvar o que se havia perdido." },
        12: { bookAbbrev: "jo", bookName: "João", chapter: 1, title: "O Verbo Se Fez Carne", desc: "No princípio era o Verbo, e o Verbo estava com Deus." },
        13: { bookAbbrev: "jo", bookName: "João", chapter: 3, title: "Nicodemos e o Novo Nascimento", desc: "Porque Deus amou o mundo de tal maneira..." },
        14: { bookAbbrev: "jo", bookName: "João", chapter: 4, title: "A Mulher Samaritana e a Água da Vida", desc: "Quem beber da água que Jesus der nunca mais terá sede." },
        15: { bookAbbrev: "jo", bookName: "João", chapter: 6, title: "O Pão da Vida", desc: "Multiplicação dos pães e sustento espiritual." },
        16: { bookAbbrev: "jo", bookName: "João", chapter: 10, title: "O Bom Pastor", desc: "Conheço as minhas ovelhas e pelas ovelhas dou a minha vida." },
        17: { bookAbbrev: "jo", bookName: "João", chapter: 11, title: "A Ressurreição de Lázaro", desc: "Eu sou a ressurreição e a vida; quem crê em mim viverá." },
        18: { bookAbbrev: "jo", bookName: "João", chapter: 13, title: "O Lava-pés e o Mandamento do Amor", desc: "A verdadeira grandeza através do serviço humilde." },
        19: { bookAbbrev: "jo", bookName: "João", chapter: 15, title: "A Videira Verdadeira", desc: "Permanecei em mim e eu permanecerei em vós." },
        20: { bookAbbrev: "mt", bookName: "Mateus", chapter: 28, title: "A Ressurreição e a Grande Comissão", desc: "Ele ressuscitou! Ide e fazei discípulos de todas as nações." },
        21: { bookAbbrev: "jo", bookName: "João", chapter: 21, title: "Tu me Amas? Apascenta as Minhas Ovelhas", desc: "A restauração de Pedro e o chamado diário para seguir a Cristo." }
      };

      const curr = chaptersMap[day] || { bookAbbrev: "jo", bookName: "João", chapter: day, title: `Dia ${day} com Jesus`, desc: "Aprofunde-se no amor de Cristo." };
      return {
        dayNumber: day,
        title: curr.title,
        readings: [{ bookAbbrev: curr.bookAbbrev, bookName: curr.bookName, chapter: curr.chapter }],
        devotionText: curr.desc,
        reflectionQuestion: "O que esta leitura revela sobre o coração de Jesus para sua vida hoje?"
      };
    })
  },
  {
    id: "salmos-proverbios-30-dias",
    title: "Salmos e Provérbios em 30 Dias",
    subtitle: "30 dias de louvor, oração e sabedoria diária",
    description: "Combine a intimidade de oração dos Salmos com os conselhos práticos e espirituais de Provérbios em uma rotina diária equilibrada de 30 dias.",
    category: "Sabedoria",
    durationDays: 30,
    badge: "Sabedoria",
    color: "from-emerald-500 to-teal-500",
    bgGradient: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    iconName: "heart",
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const psalmNum1 = day;
      const psalmNum2 = day + 30;
      const psalmNum3 = day + 60;
      const provNum = (day % 31) || 31;

      return {
        dayNumber: day,
        title: `Oração e Sabedoria - Dia ${day}`,
        readings: [
          { bookAbbrev: "sl", bookName: "Salmos", chapter: psalmNum1 },
          { bookAbbrev: "sl", bookName: "Salmos", chapter: psalmNum2 },
          { bookAbbrev: "sl", bookName: "Salmos", chapter: psalmNum3 },
          { bookAbbrev: "pv", bookName: "Provérbios", chapter: provNum }
        ],
        devotionText: `Leitura diária de louvor nos Salmos (${psalmNum1}, ${psalmNum2}, ${psalmNum3}) combinada com o conselho prático de Provérbios ${provNum}.`,
        reflectionQuestion: "Que conselho prático de Provérbios você pode aplicar no seu dia hoje?"
      };
    })
  },
  {
    id: "nt-90-dias",
    title: "Novo Testamento em 90 Dias",
    subtitle: "Dois a três capítulos por dia através de todo o NT",
    description: "Leia todos os 260 capítulos do Novo Testamento em 90 dias com um ritmo leve, acessível e profundamente edificante.",
    category: "Novo Testamento",
    durationDays: 90,
    badge: "Completo",
    color: "from-purple-500 to-indigo-500",
    bgGradient: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    iconName: "book",
    days: [
      { dayNumber: 1, title: "Mateus 1 a 3", readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 1 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 2 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 3 }], devotionText: "Genealogia, nascimento e batismo de Jesus." },
      { dayNumber: 2, title: "Mateus 4 a 6", readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 4 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 5 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 6 }], devotionText: "Tentações no deserto e início do Sermão do Monte." },
      { dayNumber: 3, title: "Mateus 7 a 9", readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 7 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 8 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 9 }], devotionText: "A casa sobre a rocha e milagres de compaixão." },
      { dayNumber: 4, title: "Mateus 10 a 12", readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 10 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 11 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 12 }], devotionText: "Envio dos doze apóstolos e o alívio para os cansados." },
      { dayNumber: 5, title: "Mateus 13 a 15", readings: [{ bookAbbrev: "mt", bookName: "Mateus", chapter: 13 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 14 }, { bookAbbrev: "mt", bookName: "Mateus", chapter: 15 }], devotionText: "Parábolas do Reino e Jesus andando sobre o mar." },
      ...Array.from({ length: 85 }, (_, i) => {
        const d = i + 6;
        return {
          dayNumber: d,
          title: `Dia ${d} do Novo Testamento`,
          readings: [{ bookAbbrev: d > 45 ? "rm" : "lc", bookName: d > 45 ? "Romanos" : "Lucas", chapter: (d % 20) + 1 }],
          devotionText: `Avançando no Novo Testamento com fé e atenção aos ensinamentos apostólicos.`
        };
      })
    ]
  },
  {
    id: "proverbios-31-dias",
    title: "Sabedoria Prática de Provérbios",
    subtitle: "Um capítulo de Provérbios por dia do mês",
    description: "Ganhe sabedoria para finanças, relacionamentos, trabalho, paciência e tomada de decisões lendo um capítulo de Provérbios a cada dia.",
    category: "Sabedoria",
    durationDays: 31,
    badge: "Diário",
    color: "from-rose-500 to-pink-500",
    bgGradient: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    iconName: "star",
    days: Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return {
        dayNumber: day,
        title: `Provérbios Capítulo ${day}`,
        readings: [{ bookAbbrev: "pv", bookName: "Provérbios", chapter: day }],
        devotionText: `Capítulo ${day} de Provérbios traz conselhos de ouro para cultivar um coração prudente, paciente e temente a Deus.`,
        reflectionQuestion: "Qual versículo deste capítulo fala diretamente sobre a sua atitude ou decisão hoje?"
      };
    })
  }
];
