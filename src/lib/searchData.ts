export interface SearchResult {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export function stripLeadingNumber(str?: string): string {
  if (!str) return "";
  return str.replace(/^\d{1,5}[.\s-]+\s*/, '').trim();
}

export interface BiblicalEntity {
  id: string;
  name: string;
  type: "personagem" | "assunto" | "conhecimento";
  badge: string;
  summary: string;
  keyVerses: { reference: string; text: string }[];
  devotionalTitle?: string;
  devotionalCategory?: string;
  aiPrompt: string;
  tags: string[];
}

export interface RecommendedDevotional {
  id: string;
  title: string;
  category: string;
  verse: string;
  text: string;
  summary: string;
}

export interface PopularVerse {
  reference: string;
  text: string;
  theme: string;
}

// ---------------------------------------------------------------------------
// BASE DATA: CORE PERSONAGENS BÍBLICOS
// ---------------------------------------------------------------------------
const baseCharacters: BiblicalEntity[] = [
  {
    id: "maria-nazare",
    name: "Maria de Nazaré",
    type: "personagem",
    badge: "Mãe de Jesus • Exemplo de Fé e Humildade",
    summary: "Jovem temente a Deus escolhida para ser a mãe do Salvador Jesus Cristo. Exemplo de entrega total à vontade do Pai ('Eis aqui a serva do Senhor').",
    keyVerses: [
      { reference: "Lucas 1:38", text: "Disse então Maria: Eis aqui a serva do Senhor; cumpra-se em mim segundo a tua palavra." },
      { reference: "Lucas 1:46-47", text: "Disse então Maria: A minha alma engrandece ao Senhor, e o meu espírito se alegra em Deus meu Salvador." }
    ],
    devotionalTitle: "A Fé Submissa de Maria",
    devotionalCategory: "Fé",
    aiPrompt: "Quem foi Maria de Nazaré na Bíblia e qual o significado da sua história para nossa vida de fé?",
    tags: ["maria", "mariah", "mae de jesus", "virgem maria", "lucas 1", "magnificat", "nazare"]
  },
  {
    id: "jose-egito",
    name: "José do Egito",
    type: "personagem",
    badge: "Governador do Egito • Perdão e Integridade",
    summary: "Filho amado de Jacó, vendido por seus irmãos como escravo. Permaneceu fiel a Deus na prisão e tornou-se governador do Egito, salvando sua família da fome e perdoando seus irmãos.",
    keyVerses: [
      { reference: "Gênesis 50:20", text: "Vós bem intentastes mal contra mim; porém Deus o intentou para bem, para fazer como se vê neste dia, para conservar muita gente com vida." }
    ],
    devotionalTitle: "Sobrevivendo às Provações com José",
    devotionalCategory: "Força",
    aiPrompt: "Conte a história de José do Egito e como Deus transformou o mal em bem em sua vida.",
    tags: ["jose", "jose do egito", "sonhos de jose", "genesis", "jaco", "sonhos", "egito"]
  },
  {
    id: "jose-nazare",
    name: "José de Nazaré",
    type: "personagem",
    badge: "Esposo de Maria • Homem Justo e Protetor",
    summary: "Carpinteiro justo e temente a Deus em Nazaré. Aceitou a missão divina de proteger Maria e criar o menino Jesus sob a orientação dos anjos em sonhos.",
    keyVerses: [
      { reference: "Mateus 1:19", text: "Então José, seu marido, como era justo, e a não queria infamar, intentou deixá-la secretamente." }
    ],
    devotionalTitle: "A Obediência Silenciosa de José",
    devotionalCategory: "Obediência",
    aiPrompt: "Quem foi José de Nazaré, esposo de Maria, e quais eram suas virtudes segundo a Bíblia?",
    tags: ["jose", "jose de nazare", "carpinteiro", "mateus 1", "esposo de maria", "pai de jesus"]
  },
  {
    id: "davi",
    name: "Rei Davi",
    type: "personagem",
    badge: "O Maior Rei de Israel • Homem segundo o Coração de Deus",
    summary: "Pastor de ovelhas, salmista e guerreiro que venceu Golias. Tornou-se rei de Israel e deixou um legado de adoração profunda e verdadeiro arrependimento.",
    keyVerses: [
      { reference: "1 Samuel 16:7", text: "O Senhor olha para o coração." },
      { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará." }
    ],
    devotionalTitle: "Coração Segundo Deus",
    devotionalCategory: "Adoração",
    aiPrompt: "Quem foi o Rei Davi na Bíblia e por que ele foi chamado de homem segundo o coração de Deus?",
    tags: ["davi", "david", "rei davi", "golias", "salmos", "1 samuel", "pastor"]
  },
  {
    id: "moises",
    name: "Moisés",
    type: "personagem",
    badge: "Libertador de Israel • Profeta da Lei",
    summary: "Conduziu o povo de Deus para fora do Egito, abriu o Mar Vermelho e recebeu a Lei no Monte Sinai. Falava com Deus como um amigo fala com outro.",
    keyVerses: [
      { reference: "Êxodo 3:14", text: "Disse Deus a Moisés: EU SOU O QUE SOU." }
    ],
    devotionalTitle: "Liderança e Intimidade com Moisés",
    devotionalCategory: "Propósito",
    aiPrompt: "Quem foi Moisés e quais foram os momentos mais marcantes da sua liderança no Êxodo?",
    tags: ["moises", "moses", "exodo", "dez mandamentos", "mar vermelho", "sarça ardente"]
  },
  {
    id: "jesus-cristo",
    name: "Jesus Cristo",
    type: "personagem",
    badge: "O Filho de Deus • Salvador e Senhor",
    summary: "O Messias prometido nas Escrituras, Deus encarnado, que ofereceu a Sua vida na cruz e ressuscitou para conceder salvação eterna a todo aquele que nele crê.",
    keyVerses: [
      { reference: "João 14:6", text: "Eu sou o caminho, a verdade e a vida." },
      { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira..." }
    ],
    devotionalTitle: "O Amor Incondicional do Salvador",
    devotionalCategory: "Amor",
    aiPrompt: "Explique quem é Jesus Cristo segundo as Escrituras e qual a importância da sua ressurreição.",
    tags: ["jesus", "jesus cristo", "cristo", "messias", "salvador", "filho de deus", "cruz", "ressurreicao"]
  },
  {
    id: "paulo-apostolo",
    name: "Apóstolo Paulo",
    type: "personagem",
    badge: "Apóstolo dos Gentios • Autor das Epístolas",
    summary: "Transformado no caminho de Damasco de perseguidor a maior missionário do cristianismo primitivo. Escreveu grande parte do Novo Testamento.",
    keyVerses: [
      { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece." },
      { reference: "Romanos 8:38-39", text: "Nada poderá nos separar do amor de Deus." }
    ],
    devotionalTitle: "Uma Vida Transformada pela Graça",
    devotionalCategory: "Graça",
    aiPrompt: "Quem foi o Apóstolo Paulo e como sua conversão impactou o cristianismo mundial?",
    tags: ["paulo", "saulo", "apostolo paulo", "damasco", "epistolas", "romanos", "filipenses"]
  },
  {
    id: "pedro-apostolo",
    name: "Apóstolo Pedro",
    type: "personagem",
    badge: "Líder dos Apóstolos • Pescador de Homens",
    summary: "Pescador no Mar da Galileia chamado por Jesus. Apesar das suas falhas, tornou-se uma das colunas da igreja primitiva e pregador no Pentecostes.",
    keyVerses: [
      { reference: "Mateus 16:16", text: "Tu és o Cristo, o Filho do Deus vivo." },
      { reference: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade..." }
    ],
    devotionalTitle: "Restauração e Coragem em Pedro",
    devotionalCategory: "Restauração",
    aiPrompt: "Quem foi o Apóstolo Pedro na Bíblia e o que aprendemos com o seu chamado e restauração por Jesus?",
    tags: ["pedro", "simao pedro", "pescador", "pentecostes", "1 pedro", "2 pedro"]
  },
  {
    id: "abraao",
    name: "Abraão",
    type: "personagem",
    badge: "Pai da Fé • Amigo de Deus",
    summary: "Patriarca que creu na promessa de Deus mesmo na velhice. Deixou sua terra e seguiu a voz divina para tornar-se o pai de muitas nações.",
    keyVerses: [
      { reference: "Gênesis 15:6", text: "E creu ele no Senhor, e imputou-lhe isto por justiça." }
    ],
    devotionalTitle: "Caminhando por Fé e Não por Vista",
    devotionalCategory: "Fé",
    aiPrompt: "Quem foi Abraão na Bíblia e qual o significado do pacto de Deus com ele?",
    tags: ["abraao", "abraham", "pai da fe", "isaque", "genesis 12", "promessa"]
  },
  {
    id: "ester",
    name: "Rainha Ester",
    type: "personagem",
    badge: "Rainha da Pérsia • Coragem e Intercessão",
    summary: "Jovem judia orfã que se tornou rainha da Pérsia. Arriscou sua vida ao apresentar-se ao rei para salvar o povo judeu do extermínio.",
    keyVerses: [
      { reference: "Ester 4:14", text: "E quem sabe se para tal tempo como este não chegaste a este reino?" }
    ],
    devotionalTitle: "Chamados para um Propósito Específico",
    devotionalCategory: "Propósito",
    aiPrompt: "Quem foi a Rainha Ester na Bíblia e como Deus a usou para salvar o Seu povo?",
    tags: ["ester", "esther", "rainha ester", "hama", "purim", "persia"]
  },
  {
    id: "rute",
    name: "Rute",
    type: "personagem",
    badge: "Moabita Leal • Ancestral de Jesus Cristo",
    summary: "Mulher moabita que demonstrou amor e lealdade à sua sogra Noemi. Tornou-se esposa de Boaz e bisavó do Rei Davi.",
    keyVerses: [
      { reference: "Rute 1:16", text: "O teu povo é o meu povo, o teu Deus é o meu Deus." }
    ],
    devotionalTitle: "Lealdade e a Providência Divina",
    devotionalCategory: "Amor",
    aiPrompt: "Qual a história de Rute na Bíblia e a lição do seu compromisso com Noemi?",
    tags: ["rute", "ruth", "noemi", "boaz", "lealdade", "ancestral de jesus"]
  },
  {
    id: "daniel",
    name: "Profeta Daniel",
    type: "personagem",
    badge: "Fidelidade na Babilônia • Homem de Oração",
    summary: "Jovem hebreu levado cativo para a Babilônia. Recusou-se a se contaminar com a comida do rei, sobreviveu à cova dos leões e interpretou sonhos proféticos.",
    keyVerses: [
      { reference: "Daniel 6:10", text: "Três vezes ao dia se punha de joelhos, e orava, e dava graças diante do seu Deus." }
    ],
    devotionalTitle: "Inabalável em Meio à Cultura",
    devotionalCategory: "Integridade",
    aiPrompt: "Quem foi Daniel na Bíblia e como ele manteve sua fidelidade na Babilônia?",
    tags: ["daniel", "cova dos leoes", "babilonia", "oracao", "sonhos", "proprio deus"]
  },
  {
    id: "elias",
    name: "Profeta Elias",
    type: "personagem",
    badge: "Profeta de Fogo • Oração Poderosa",
    summary: "Profeta fervoroso que confrontou os profetas de Baal no Monte Carmelo. Orou para que chovesse e foi levado ao céu em um redemoinho de fogo.",
    keyVerses: [
      { reference: "Tiago 5:17", text: "Elias era homem sujeito às mesmas paixões que nós e, orando, pediu que não chovesse..." }
    ],
    devotionalTitle: "O Poder de uma Oração Fervorosa",
    devotionalCategory: "Oração",
    aiPrompt: "Quem foi o profeta Elias na Bíblia e quais foram seus principais milagres?",
    tags: ["elias", "elijah", "monte carmelo", "baal", "fogo do ceu", "oracao"]
  },
  {
    id: "eliseu",
    name: "Profeta Eliseu",
    type: "personagem",
    badge: "Sucessor de Elias • Porção Dobrada do Espírito",
    summary: "Discípulo e sucessor de Elias. Pediu porção dobrada do espírito do seu mestre e realizou inúmeros milagres de cura e restauração em Israel.",
    keyVerses: [
      { reference: "2 Reis 2:9", text: "Peço-te que haja em mim porção dobrada do teu espírito." }
    ],
    devotionalTitle: "Buscando o Sobrenatural de Deus",
    devotionalCategory: "Poder Divino",
    aiPrompt: "Quem foi Eliseu na Bíblia e quais foram os seus milagres mais conhecidos?",
    tags: ["eliseu", "elisha", "2 reis", "porcao dobrada", "naaman", "milagres"]
  },
  {
    id: "joao-batista",
    name: "João Batista",
    type: "personagem",
    badge: "Voz que Clama no Deserto • Precursor de Cristo",
    summary: "Profeta que preparou o caminho para o Messias, pregando o batismo de arrependimento no Rio Jordão e apontando para Jesus como o Cordeiro de Deus.",
    keyVerses: [
      { reference: "João 1:29", text: "Eis o Cordeiro de Deus, que tira o pecado do mundo." }
    ],
    devotionalTitle: "Diminuir para que Cristo Cresça",
    devotionalCategory: "Humildade",
    aiPrompt: "Quem foi João Batista na Bíblia e qual a sua missão no Novo Testamento?",
    tags: ["joao batista", "john the baptist", "jordao", "batismo", "cordeiro de deus"]
  }
];

// Generate extra rich character entities to reach 100+
const extraCharacterList = [
  { name: "Aarão", badge: "Primeiro Sumo Sacerdote de Israel", book: "Êxodo 28", summary: "Irmão de Moisés e primeiro sumo sacerdote. Representou o povo diante do tabernáculo e conduziu as ofertas a Deus." },
  { name: "Miriã", badge: "Profetisa e Cantora de Israel", book: "Êxodo 15", summary: "Irmã de Moisés e Aarão. Liderou as mulheres em cantos de vitória com tamboris após a travessia do Mar Vermelho." },
  { name: "Calebe", badge: "Homem de Espírito Diferente", book: "Josué 14", summary: "Um dos doze espias enviado a Canaã. Aos 85 anos, manteve a mesma fé fervorosa e pediu a montanha dos gigantes por herança." },
  { name: "Raabe", badge: "Mulher de Fé em Jericó", book: "Josué 2", summary: "Acolheu os espias de Israel em Jericó. Pela fé, salvou sua família através do cordão escarlate e entrou na genealogia de Jesus." },
  { name: "Débora", badge: "Juíza e Profetisa de Israel", book: "Juízes 4", summary: "Liderou Israel sob as palmeiras entre Ramá e Betel. Julgava as causas do povo e inspirou Baraque na vitória sobre Sísera." },
  { name: "Baraque", badge: "Comandante do Exército de Israel", book: "Juízes 4", summary: "Liderou dez mil homens no Monte Tabor sob a liderança profética de Débora, alcançando libertação contra os cananeus." },
  { name: "Gideão", badge: "Guerreiro dos 300 Homens", book: "Juízes 6", summary: "Chamado por Deus como varão valoroso. Venceu a multidão dos midianitas com apenas 300 homens e trombetas." },
  { name: "Sansão", badge: "Juiz de Força Sobrenatural", book: "Juízes 13", summary: "Nazireu consagrado com força extraordinária concedida pelo Espírito. Restaurou sua fé em seu último clamor a Deus." },
  { name: "Abigail", badge: "Mulher Prudente e Pacificadora", book: "1 Samuel 25", summary: "Esposa de Nabal que agiu com rapidez e sabedoria, levando mantimentos a Davi e evitando um derramamento de sangue desnecessário." },
  { name: "Jônatas", badge: "Filho de Saul e Amigo Leal de Davi", book: "1 Samuel 18", summary: "Exemplo supremo de amizade, humildade e aliança leal. Amou a Davi como à sua própria alma e o protegeu do rei Saul." },
  { name: "Benaia", badge: "O Guerreiro de Valente Coragem", book: "2 Samuel 23", summary: "Capitão da guarda de Davi que desceu a uma cova em um dia de neve e matou um leão, além de derrotar um gigante egípcio." },
  { name: "Rei Ezequias", badge: "Rei que Orou e Teve Saúde Restaurada", book: "2 Reis 20", summary: "Orou ao Senhor voltando o rosto para a parede ao receber a notícia da morte. Deus acrescentou 15 anos à sua vida." },
  { name: "Rei Josias", badge: "O Rei Menino da Reforma Espiritual", book: "2 Reis 22", summary: "Começou a reinar aos 8 anos. Ao encontrar o Livro da Lei no templo, rasgou suas vestes e promoveu um grande avivamento em Israel." },
  { name: "Neemias", badge: "O Reconstrutor dos Muros", book: "Neemias 2", summary: "Copeiro do rei persa que liderou com oração, planejamento e coragem a reconstrução das muralhas de Jerusalém em 52 dias." },
  { name: "Esdras", badge: "Sacerdote e Escriba da Palavra", book: "Esdras 7", summary: "Preparou o coração para buscar, cumprir e ensinar a Lei do Senhor. Liderou a renovação espiritual do povo retornado do exílio." },
  { name: "Mordecai", badge: "Guardião Fiel de Ester", book: "Ester 2", summary: "Judeu íntegro que servia à porta do rei persa. Recusou curvar-se ao ímpio Hamã e instruiu Ester para salvar o povo judeu." },
  { name: "Jó", badge: "Servo Íntegro e Paciente", book: "Jó 1", summary: "Provedor, homem justo e reto que confiou no Redentor Vivo no auge da dor, sendo duplamente abençoado ao final da provação." },
  { name: "Profeta Oséias", badge: "O Espelho do Amor Incondicional", book: "Oséias 3", summary: "Casou-se por ordem divina para demonstrar graficamente o amor perdoador e restaurador de Deus para com o Seu povo." },
  { name: "Profeta Joel", badge: "O Anunciador do Derramamento do Espírito", book: "Joel 2", summary: "Profetizou que nos últimos dias Deus derramaria do Seu Espírito sobre toda a carne, alcançando jovens, velhos e servos." },
  { name: "Profeta Amós", badge: "O Clamor pela Justiça como Rio", book: "Amós 5", summary: "Pastor de ovelhas de Tecoa chamado para anunciar a justiça social de Deus e a busca sincera pelo bem." },
  { name: "Profeta Miqueias", badge: "O Profeta do Berço de Belém", book: "Miqueias 5", summary: "Anunciou que de Belém-Efrata sairia o Governador eterno de Israel e ensinou a praticar a justiça e andar humildemente com Deus." },
  { name: "Profeta Habacuque", badge: "O Vigia da Fé na Torre", book: "Habacuque 2", summary: "Postou-se em sua torre de vigia e escreveu que 'o justo viverá da sua fé', alegrando-se no Deus da sua salvação." },
  { name: "Profeta Zacarias", badge: "O Anunciador do Rei Humilde", book: "Zacarias 9", summary: "Profetizou sobre o Rei que viria montado num jumentinho e sobre o derramamento do Espírito de graça e súplicas." },
  { name: "Profeta Malaquias", badge: "O Anunciador do Sol da Justiça", book: "Malaquias 4", summary: "Último profeta do Antigo Testamento que prometeu a vinda do Sol da Justiça trazendo cura em suas asas." },
  { name: "Isabel", badge: "Mãe de João Batista", book: "Lucas 1", summary: "Prima de Maria, estéril até a velhice. Ficou cheia do Espírito Santo e abençoou a mãe do Senhor no encontro em Judá." },
  { name: "Zacarias (Pai de João)", badge: "Sacerdote da Ordem de Abias", book: "Lucas 1", summary: "Recebeu o anúncio do nascimento de João Batista pelo anjo Gabriel perto do altar do incenso no Templo." },
  { name: "Simeão", badge: "O Homem que Abraçou o Consolo de Israel", book: "Lucas 2", summary: "Prometido pelo Espírito Santo que não morreria sem ver o Cristo. Segurou o Menino Jesus e entoou o Nunc Dimittis." },
  { name: "Ana a Profetisa", badge: "Profetisa da Oração Constante", book: "Lucas 2", summary: "Viúva de 84 anos que não se afastava do templo, servindo a Deus noite e dia com jejuns e orações. Deu graças ao ver o Menino." },
  { name: "Mateus (Levi)", badge: "Publicano que Virou Evangelista", book: "Mateus 9", summary: "Cobrador de impostos em Cafarnaum que deixou tudo ao ouvir o chamado de Jesus: 'Segue-me'. Escreveu o primeiro Evangelho." },
  { name: "Tomé", badge: "Apóstolo que Proclamou 'Meu Senhor e Meu Deus'", book: "João 20", summary: "Necessitou ver as marcas dos cravos para crer na ressurreição, mas fez a mais solene confissão da divindade de Jesus." },
  { name: "Natanael (Bartolomeu)", badge: "Israelita em Quem Não Há Dolo", book: "João 1", summary: "Reconhecido por Jesus debaixo da figueira antes mesmo de ser chamado por Filipe. Declarou Jesus como o Filho de Deus." },
  { name: "Tiago (Irmão do Senhor)", badge: "Líder da Igreja em Jerusalém", book: "Tiago 1", summary: "Conhecido pela profunda vida de oração. Liderou o Concílio de Jerusalém em Atos 15 e escreveu a carta prática de Tiago." },
  { name: "Judas Tadeu", badge: "Apóstolo do Zelo pelo Evangelho", book: "João 14", summary: "Perguntou a Jesus na última ceia como Ele se manifestaria aos discípulos e não ao mundo. Escreveu a epístola de Judas." },
  { name: "Silas", badge: "Companheiro de Paulo na Prisão de Filipos", book: "Atos 16", summary: "Profeta e líder da igreja. Cantava hinos a Deus junto com Paulo na prisão à meia-noite até que os alicerces tremeram." },
  { name: "Tito", badge: "Companheiro e Lider de Creta", book: "Tito 1", summary: "Discipulado por Paulo para estabelecer presbíteros e exortar as igrejas nas ilhas com sã doutrina e boas obras." },
  { name: "Filemom", badge: "Cristão Generoso em Colossos", book: "Filemom 1", summary: "Hospedava a igreja em sua casa. Recebeu a carta de Paulo apelando para que acolhesse Onésimo não como escravo, mas como irmão." },
  { name: "Onésimo", badge: "Servo Transformado em Irmão Amado", book: "Filemom 1", summary: "Convertido pelo ministério de Paulo enquanto este estava preso. Tornou-se um auxiliar fiel e muito amado no reino." },
  { name: "Adão", badge: "Primeiro Homem Criado por Deus", book: "Gênesis 1-3", summary: "Colocado no Jardim do Éden para o cultivar e guardar. Recebeu o fôlego de vida diretamente das mãos do Criador." },
  { name: "Eva", badge: "Mãe de Todos os Viventes", book: "Gênesis 2-3", summary: "Criada por Deus para ser auxiliadora correspondente de Adão. Primeira mulher e mãe de Caim, Abel e Sete." },
  { name: "Abel", badge: "O Guardador de Ovelhas de Oferta Sincera", book: "Gênesis 4", summary: "Ofereceu a Deus das primeiras criações das suas ovelhas com fé sincera. Seu testemunho fala até hoje." },
  { name: "Enoque", badge: "O Homem que Andou com Deus", book: "Gênesis 5", summary: "Andou intimamente com Deus por 300 anos. Teve o testemunho de agradar ao Senhor e foi levado para o céu sem ver a morte." },
  { name: "Melquisedeque", badge: "Rei de Salém e Sacerdote do Deus Altíssimo", book: "Gênesis 14", summary: "Sem início nem fim de dias registrado, abençoou Abraão com pão e vinho, sendo figura profética do sacerdócio eterno de Jesus." },
  { name: "Ló", badge: "Sobrinho de Abraão", book: "Gênesis 13-19", summary: "Escolheu as campinas do Jordão perto de Sodoma. Resgatado por anjos da destruição pela intercessão de seu tio Abraão." },
  { name: "Agar", badge: "A Mulher que Viu o Deus que Tudo Vê", book: "Gênesis 16", summary: "Servo egípcia acolhida por Deus no deserto de Sur. Chamou o Senhor de 'Tu és o Deus que me vê' (El Roi)." },
  { name: "Ismael", badge: "Filho de Abraão e Agar", book: "Gênesis 16-21", summary: "Abençoado por Deus no deserto. O Senhor ouviu o choro do menino e prometeu fazer dele uma grande nação." },
  { name: "Lia (Léa)", badge: "Mãe da Tribo de Judá", book: "Gênesis 29", summary: "Embora menos favorecida pelos olhos humanos, Deus viu sua aflição e honrou-a como mãe da tribo real de onde veio o Messias." },
  { name: "Raquel", badge: "Mãe de José e Benjamim", book: "Gênesis 30", summary: "Esposa amada de Jacó. Orou fervorosamente até que Deus se lembrou dela e tirou seu opróbrio dando-lhe filhos." },
  { name: "Lia e Raquel", badge: "As Duas Mães da Casa de Israel", book: "Gênesis 30", summary: "Juntas edifiçaram a casa de Israel de onde surgiram as doze tribos sob a promessa abençoada de Deus." },
  { name: "Labão", badge: "Sogro de Jacó em Padã-Aram", book: "Gênesis 29-31", summary: "Irmão de Rebeca. Trabalhou com Jacó durante vinte anos até selarem uma aliança de paz na montanha de Gileade." },
  { name: "Judá", badge: "Filho de Jacó e Ancestral do Leão de Judá", book: "Gênesis 37-49", summary: "Ofereceu-se como fiador da vida de seu irmão Benjamim no Egito. Recebeu a bênção patriarcal do cetro real." },
  { name: "Tamar", badge: "Nora de Judá de Coragem Persistente", book: "Gênesis 38", summary: "Lutou pela justiça da sua descendência na família patriarcal. Entrou na genealogia do Rei Davi e de Jesus Cristo." },
  { name: "Seforá", badge: "Esposa de Moisés em Midiã", book: "Êxodo 2-4", summary: "Filha do sacerdote Jetro. Salvou a vida de seu esposo pela obediência no sinal do pacto da circuncisão." },
  { name: "Jetro (Reuel)", badge: "Sacerdote de Midiã e Sogro de Moisés", book: "Êxodo 18", summary: "Aconselhou Moisés a delegar a liderança e instituir juízes sobre milhares, centenas e dezenas em Israel." },
  { name: "Efraim e Manassés", badge: "Filhos de José Abençoados por Jacó", book: "Gênesis 48", summary: "Nascidos no Egito e adotados por Jacó como tribos completas em Israel. Jacó cruzou as mãos para abençoar Efraim." },
  { name: "Josué e Calebe", badge: "Os Dois Espias Fiéis", book: "Números 14", summary: "Os únicos dois espias que trouxeram relatório de fé ao povo no deserto, encorajando Israel a tomar a terra." },
  { name: "Balaão", badge: "O Profeta Confrontado pela Jumenta", book: "Números 22-24", summary: "Contratado por Balaque para amaldiçoar Israel, mas teve a boca aberta por Deus para proclamar bênção e a Estrela de Jacó." },
  { name: "Sansão e Manoá", badge: "A Promessa do Anjo à Família", book: "Juízes 13", summary: "Receberam a visita do anjo do Senhor com instruções para a criação de um filho nazireu consagrado desde o ventre." },
  { name: "Eli", badge: "Sumo Sacerdote em Siló", book: "1 Samuel 1-4", summary: "Acolheu e treinou o menino Samuel no tabernáculo, ensinando-o a responder ao chamado de Deus." },
  { name: "Penina", badge: "Outra Mulher de Elcana", book: "1 Samuel 1", summary: "Rival de Ana que a provocava por ser estéril, servindo involuntariamente como catalisador para a oração de Ana." },
  { name: "Saul", badge: "Primeiro Rei de Israel", book: "1 Samuel 9-15", summary: "Ungido por Samuel. Começou com grande estatura e humildade, mas perdeu o reino ao desobedecer a voz do Senhor." },
  { name: "Mefibosete", badge: "O Filho de Jônatas Acolhido no Palácio", book: "2 Samuel 9", summary: "Aleijado de ambos os pés, foi tirado de Lo-Debar por Davi e assentou-se para sempre à mesa real." },
  { name: "Absalão", badge: "Filho de Davi", book: "2 Samuel 15", summary: "Jovem formoso que intentou usurpar o trono do pai. Sua história adverte sobre o perigo do orgulho e da mágoa." },
  { name: "Aitofel", badge: "Conselheiro de Davi", book: "2 Samuel 16", summary: "Cujos conselhos eram como a própria palavra de Deus. Davi orou para que Deus transformasse seu conselho em loucura." },
  { name: "Hushai o Arquita", badge: "Amigo Leal de Davi", book: "2 Samuel 17", summary: "Permaneceu no palácio durante a rebelião de Absalão e frustrou o conselho destrutivo de Aitofel." },
  { name: "Rainha de Sabá", badge: "A Rainha em Busca de Sabedoria", book: "1 Reis 10", summary: "Viajou de terras distantes com comitiva e especiarias para comprovar a sabedoria de Salomão, glorificando a Deus." },
  { name: "Roboão", badge: "Filho de Salomão", book: "1 Reis 12", summary: "Rei que rejeitou o conselho dos anciãos e seguiu os jovens, provocando a divisão do reino em Israel e Judá." },
  { name: "Jeroboão", badge: "Primeiro Rei do Reino do Norte", book: "1 Reis 12", summary: "Edificou altares em Dã e Betel. Sua atitude tornou-se o exemplo negativo conhecido como 'o caminho de Jeroboão'." },
  { name: "Rei Acabe e Jezabel", badge: "O Rei e a Rainha de Samaria", book: "1 Reis 16-21", summary: "Promoveram o culto a Baal em Israel. Enfrentaram o profeta Elias nas secas e no confronto no Monte Carmelo." },
  { name: "Viúva de Sarepta", badge: "A Mulher da Farinha e do Azeite", book: "1 Reis 17", summary: "Acolheu o profeta Elias com sua última refeição. A panela de farinha não se esgotou e o azeite não faltou." },
  { name: "Obadias (Mordomo de Acabe)", badge: "O Homem que Escondeu Cem Profetas", book: "1 Reis 18", summary: "Temia grandemente ao Senhor desde a sua juventude e escondeu cem profetas em cavernas, sustentando-os com pão e água." },
  { name: "Sunamita", badge: "A Mulher de Fé e Hospitalidade", book: "2 Reis 4", summary: "Preparou um quarto para o profeta Eliseu. Diante da tragédia com seu filho, proclamou com fé: 'Vai tudo bem'." },
  { name: "Naamã o Sírio", badge: "O Comandante Curado no Jordão", book: "2 Reis 5", summary: "Comandante do exército da Síria que sofria de lepra. Atendeu ao conselho de mergulhar sete vezes no Rio Jordão e foi limpo." },
  { name: "Menina Serva de Naamã", badge: "A Menina Israelita de Fé", book: "2 Reis 5", summary: "Levada cativa, não guardou ressentimento e testemunhou ao seu senhor sobre o profeta em Samaria que podia curá-lo." },
  { name: "Geazi", badge: "Moço de Eliseu", book: "2 Reis 5", summary: "Cedeu à ganância e correu atrás de Naamã para pedir presentes. Adverte sobre o perigo da cobiça no ministério." },
  { name: "Rei Manassés", badge: "O Rei que se Arrependeu na Prisão", book: "2 Crônicas 33", summary: "Reinou 55 anos em Jerusalém. Após terríveis erros, humilhou-se profundamente na prisão da Babilônia e foi restaurado." },
  { name: "Zorobabel e Josué Sacerdote", badge: "Os Dois Construtores do Segundo Templo", book: "Esdras 3", summary: "Lançaram os alicerces do segundo templo com choro de emoção e louvor ao Senhor porque Ele é bom." },
  { name: "Gamaliel", badge: "Doutor da Lei no Sinédrio", book: "Atos 5", summary: "Mestre de Paulo. Aconselhou o Sinédrio a não combater os apóstolos: 'Se esta obra for de Deus, não podereis desfazê-la'." },
  { name: "Ananias de Damasco", badge: "O Discípulo Obediente", book: "Atos 9", summary: "Enviado por Deus à rua chamada Direita para impor as mãos sobre Saulo de Tarso para que este recuperasse a vista." },
  { name: "Dorcas (Tabita)", badge: "Mulher Notável em Boas Obras", book: "Atos 9", summary: "Costurava túnicas e vestidos para as viúvas em Jope. O apóstolo Pedro orou por ela e a ressuscitou pelo poder de Deus." },
  { name: "Eutíco", badge: "Jovem Restaurado em Trôade", book: "Atos 20", summary: "Adormeceu enquanto Paulo pregava até tarde e caiu do terceiro andar. Paulo o abraçou e declarou: 'Não vos perturbeis, a vida está nele'." },
  { name: "Lúcio, Manean e Barnabé", badge: "Líderes da Igreja em Antioquia", book: "Atos 13", summary: "Serviam ao Senhor e jejuavam quando o Espírito Santo disse: 'Separai-me Barnabé e Saulo para a obra a que os tenho chamado'." }
];

// ---------------------------------------------------------------------------
// DOCUMENT DATASET: PERSONAGENS BÍBLICOS E HISTÓRIAS DE FÉ (1006 A 1050)
// ---------------------------------------------------------------------------
export const expandedCharacterStories: BiblicalEntity[] = [
  {
    id: "story-1006",
    name: "1006. O Chamado de Abrão e a Promessa",
    type: "personagem",
    badge: "História de Fé • Gênesis 12",
    summary: "Deus chama Abrão para sair de sua terra e parentela em Harã, prometendo fazer dele uma grande nação e abençoar todas as famílias da terra através de sua obediência.",
    keyVerses: [{ reference: "Gênesis 12:1-3", text: "Ora, o Senhor disse a Abrão: Sai-te da tua terra, da tua parentela... e abençoarei os que te abençoarem..." }],
    aiPrompt: "Explique a história do chamado de Abrão em Gênesis 12 e o significado das promessas de Deus.",
    tags: ["abraao", "abraão", "chamado", "fe", "promessa", "obediencia", "ur dos caldeus", "hara", "harã", "genesis 12", "pai da fe"]
  },
  {
    id: "story-1007",
    name: "1007. Melquisedeque: Rei de Salém e Sacerdote",
    type: "personagem",
    badge: "Sacerdote do Deus Altíssimo • Figura de Cristo",
    summary: "Misteriosa figura do Antigo Testamento, Melquisedeque era rei de Salém e sacerdote do Deus Altíssimo. Ele abençoou Abraão e prefigura o sacerdócio eterno de Jesus Cristo.",
    keyVerses: [{ reference: "Hebreus 7:1-3", text: "Porque este Melquisedeque, rei de Salém, sacerdote do Deus Altíssimo... feito semelhante ao Filho de Deus, permanece sacerdote para sempre." }],
    aiPrompt: "Quem foi Melquisedeque na Bíblia e qual o seu significado profético como figura de Jesus Cristo?",
    tags: ["melquisedeque", "salem", "salém", "sacerdote", "pao e vinho", "dizimo", "dízimo", "hebreus", "sacerdocio eterno", "figura de cristo"]
  },
  {
    id: "story-1008",
    name: "1008. A Provocação da Fé no Monte Moriá",
    type: "personagem",
    badge: "Jeová Jireh • Sacrifício de Isaque",
    summary: "Deus provou a fé de Abraão pedindo-lhe que oferecesse seu filho Isaque em sacrifício. Diante da obediência, Deus proveu um carneiro, revelando-se como Jeová Jireh.",
    keyVerses: [{ reference: "Gênesis 22:14", text: "E chamou Abraão o nome daquele lugar: O Senhor Proverá; donde se diz até ao dia de hoje: No monte do Senhor se proverá." }],
    aiPrompt: "O que aconteceu no Monte Moriá com Abraão e Isaque e qual a lição sobre Jeová Jireh?",
    tags: ["isaque", "monte moria", "moriá", "sacrificio", "provisao", "jeova jireh", "jeová jireh", "fe", "obediencia", "carneiro preso no mato"]
  },
  {
    id: "story-1009",
    name: "1009. Hagar e o Deus Que Tudo Vê (El Roi)",
    type: "personagem",
    badge: "El Roi • Consolo no Deserto",
    summary: "Sozinha e desesperada no deserto após fugir da casa de Abraão e Sara, Hagar é visitada pelo Anjo do Senhor, descobrindo que Deus enxerga a dor dos marginalizados.",
    keyVerses: [{ reference: "Gênesis 16:13", text: "E ela chamou o nome do Senhor, que com ela falava: Tu és Deus que me vê; porque disse: Não hei eu também visto aqui o posterior daquele que me vê?" }],
    aiPrompt: "Quem foi Hagar e qual o significado da revelação do Deus que tudo vê (El Roi)?",
    tags: ["hagar", "ismael", "el roi", "deserto", "deus que me ve", "consolo", "amparo", "poco de laai-roi"]
  },
  {
    id: "story-1010",
    name: "1010. A Visão da Escada de Jacó em Betel",
    type: "personagem",
    badge: "Casa de Deus • Visão de Betel",
    summary: "Durante sua fuga de Esaú, Jacó adormece e tem uma visão de uma escada que tocava o céu, com anjos subindo e descendo, marcando aquele lugar como Betel (Casa de Deus).",
    keyVerses: [{ reference: "Gênesis 28:16-17", text: "E acordou Jacó do seu sono, e disse: Na verdade o Senhor está neste lugar; e eu não o sabia... Este não é outro lugar senão a casa de Deus." }],
    aiPrompt: "O que significa a visão da Escada de Jacó em Betel segundo a Bíblia?",
    tags: ["jaco", "jacó", "escada de jaco", "betel", "sonhos", "anjos", "presenca de deus", "casa de deus", "visao"]
  },
  {
    id: "story-1011",
    name: "1011. A Luta de Jacó com o Anjo no Vade de Jaboque",
    type: "personagem",
    badge: "Peniel • Mudança para Israel",
    summary: "Em uma noite decisiva antes de reencontrar seu irmão Esaú, Jacó luta com um homem misterioso até o amanhecer, tem seu nome mudado para Israel e recebe uma bênção.",
    keyVerses: [{ reference: "Gênesis 32:28", text: "Então disse: Não se chamará mais o teu nome Jacó, mas Israel; pois como príncipe lutaste com Deus e com os homens, e prevaleceste." }],
    aiPrompt: "Explique a luta de Jacó no Vade de Jaboque e a mudança de seu nome para Israel.",
    tags: ["jaco", "jacó", "peniel", "jaboque", "luta com o anjo", "mudanca de nome", "israel", "perseveranca", "transformacao"]
  },
  {
    id: "story-1012",
    name: "1012. José na Prisão e a Interpretação de Sonhos",
    type: "personagem",
    badge: "Dons Espirituais • Fidelidade no Egito",
    summary: "Mesmo injustamente preso no Egito após a acusação da mulher de Potifar, José permaneceu fiel a Deus e usou o dom divino para interpretar os sonhos do padeiro e do copeiro.",
    keyVerses: [{ reference: "Gênesis 40:8", text: "Porventura não pertencem a Deus as interpretações? Contai-mas, peço-vos." }],
    aiPrompt: "Como José do Egito interpretou os sonhos do copeiro e do padeiro na prisão?",
    tags: ["jose do egito", "prisao", "sonhos", "copeiro e padeiro", "fidelidade", "interpretacao", "dons espirituais"]
  },
  {
    id: "story-1013",
    name: "1013. O Sonho do Faraó e a Ascensão de José",
    type: "personagem",
    badge: "Governador do Egito • Sabedoria",
    summary: "Faraó tem sonhos com vacas gordas e magras e espigas cheias e mirradas. José interpreta a profecia de 7 anos de fartura e 7 de fome, tornando-se governador do Egito.",
    keyVerses: [{ reference: "Gênesis 41:39-40", text: "Depois disse Faraó a José: Pois que Deus te fez saber tudo isto, ninguém há tão prudente e sábio como tu. Tu estarás sobre a minha casa..." }],
    aiPrompt: "Como José interpretou os sonhos do Faraó e se tornou o governador do Egito?",
    tags: ["jose governador", "sonho do farao", "vacas magras", "7 anos de fome", "sabedoria", "administracao", "providencia divina"]
  },
  {
    id: "story-1014",
    name: "1014. Joquebede: A Mãe Que Teve Fé para Salvar o Filho",
    type: "personagem",
    badge: "Proteção Maternal • Coragem e Fé",
    summary: "Diante do decreto de Faraó para matar os bebês hebreus, Joquebede escondeu o pequeno Moisés por três meses e depois o colocou num cesto no rio Nilo, confiando na proteção de Deus.",
    keyVerses: [{ reference: "Êxodo 2:3", text: "Não podendo, porém, mais escondê-lo, tomou um cesto de juncos, e o calafetou com betume e pez; e, pondo nele o menino, o pôs nos juncos à borda do rio." }],
    aiPrompt: "Quem foi Joquebede e como sua fé salvou a vida do pequeno Moisés no rio Nilo?",
    tags: ["joquebede", "moises", "cesto no nilo", "protecao maternal", "coragem", "fe", "libertacao de israel"]
  },
  {
    id: "story-1015",
    name: "1015. Moisés e o Arbusto Ardente no Monte Horebe",
    type: "personagem",
    badge: "Eu Sou o Que Sou • Sarça Ardente",
    summary: "Enquanto apascentava o rebanho no deserto de Midiã, Moisés viu uma sarça que ardia em fogo sem se consumir e ouviu a voz de Deus chamando-o para libertar Israel do Egito.",
    keyVerses: [{ reference: "Êxodo 3:2", text: "E apareceu-lhe o anjo do Senhor em uma chama de fogo do meio duma sarça; e olhou, e eis que a sarça ardia no fogo, e a sarça não se consumia." }],
    aiPrompt: "O que Deus revelou a Moisés na sarça ardente no Monte Horebe?",
    tags: ["moises", "sarca ardente", "monte horebe", "eu sou o que sou", "chamado divino", "santidade", "libertacao"]
  },
  {
    id: "story-1016",
    name: "1016. Miriã: A Profetisa e o Cântico do Mar Vermelho",
    type: "personagem",
    badge: "Louvor e Celebração • Vitória no Mar",
    summary: "Miriã liderou as mulheres de Israel com tamboris e danças na celebração da vitória após Deus abrir e fechar o Mar Vermelho, destruindo o exército egípcio.",
    keyVerses: [{ reference: "Êxodo 15:20", text: "Então Miriã, a profetisa, a irmã de Arão, tomou o tamboril na sua mão, e todas as mulheres saíram atrás dela com tamboris e com danças." }],
    aiPrompt: "Qual a história de Miriã liderando o louvor após a vitória no Mar Vermelho?",
    tags: ["miria", "miriã", "louvor", "tamboril", "danca", "mar vermelho", "vitoria", "profetisa", "celebracao"]
  },
  {
    id: "story-1017",
    name: "1017. Bezalel e Aoliabe: Artesãos Cheios do Espírito",
    type: "personagem",
    badge: "Talentos e Arte • Tabernáculo",
    summary: "Deus capacitou Bezalel e Aoliabe com sabedoria, entendimento e habilidades artísticas especiais pelo Espírito Santo para construírem o Tabernáculo e suas peças sagradas.",
    keyVerses: [{ reference: "Êxodo 35:31", text: "E o encheu do Espírito de Deus, de sabedoria, de entendimento, de ciência e de todo o lavor..." }],
    aiPrompt: "Quem foram Bezalel e Aoliabe e como o Espírito Santo capacita para a arte e o trabalho?",
    tags: ["bezalel", "aoliabe", "tabernaculo", "artesaos", "talentos", "criatividade", "uncao", "espirito santo"]
  },
  {
    id: "story-1018",
    name: "1018. Calebe: O Homem de Espírito Diferente aos 85 Anos",
    type: "personagem",
    badge: "Fé Vigorosa • Conquista de Hebrom",
    summary: "Calebe foi um dos 12 espias enviados a Canaã. Aos 85 anos, demonstrando fé inabalável nas promessas de Deus, reivindicou e conquistou a região montanhosa dos gigantes.",
    keyVerses: [{ reference: "Josué 14:11", text: "E ainda hoje estou tão forte como no dia em que Moisés me enviou; qual a minha força então era, tal é agora a minha força..." }],
    aiPrompt: "Qual a lição de fé de Calebe ao conquistar a montanha de Hebrom aos 85 anos?",
    tags: ["calebe", "josue", "espias", "hebrom", "montanha", "perseveranca", "fe vigorosa", "promessa"]
  },
  {
    id: "story-1019",
    name: "1019. Raabe e o Cordão Escarlate na Janela",
    type: "personagem",
    badge: "Salvação de Jericó • Linhagem do Messias",
    summary: "Raabe, uma moradora de Jericó, escondeu os espias de Israel por crer no Deus vivo. Como sinal de aliança e proteção, colocou um cordão vermelho na janela e salvou sua família.",
    keyVerses: [{ reference: "Josué 2:18", text: "Eis que, quando nós entrarmos na terra, atarás este cordão de fio de escarlata à janela por onde nos fizeste descer..." }],
    aiPrompt: "Quem foi Raabe e qual o significado do cordão escarlate pendurado na sua janela?",
    tags: ["raabe", "jerico", "cordao escarlate", "espias", "fe", "salvacao da familia", "linhagem de jesus"]
  },
  {
    id: "story-1020",
    name: "1020. Débora e a Liderança Sob as Palmeiras",
    type: "personagem",
    badge: "Juíza e Profetisa • Monte Tabor",
    summary: "Débora atuou como juíza e profetisa em Israel num tempo de opressão. Ela convocou Baraque para a guerra e marchou à frente do exército com coragem e discernimento espiritual.",
    keyVerses: [{ reference: "Juízes 4:5", text: "E habitava debaixo da palmeira de Débora... e os filhos de Israel subiam a ela a juízo." }],
    aiPrompt: "Quem foi Débora na Bíblia e como exercia sua liderança espiritual em Israel?",
    tags: ["debora", "débora", "juiza", "profetisa", "baraque", "lideranca feminina", "monte tabor", "vitoria", "coragem"]
  },
  {
    id: "story-1021",
    name: "1021. Jael e a Derrota do Comandante Sísera",
    type: "personagem",
    badge: "Estratégia e Coragem • Livramento",
    summary: "Jael cumpriu a profecia de Débora ao demonstrar astúcia e coragem, derrotando Sísera, o comandante das forças opressoras de Canaã, libertando o povo de Deus.",
    keyVerses: [{ reference: "Juízes 5:24", text: "Bendita seja sobre as mulheres, Jael... bendita seja sobre as mulheres nas tendas." }],
    aiPrompt: "Como Jael derrotou Sísera e libertou Israel segundo o livro de Juízes?",
    tags: ["jael", "sisera", "tenda", "libertacao", "coragem", "juizes", "estrategia"]
  },
  {
    id: "story-1022",
    name: "1022. A Escolha dos 300 Valentes de Gideão",
    type: "personagem",
    badge: "Prova da Água • Vitória do Senhor",
    summary: "Deus reduziu o exército de Gideão de 32 mil homens para apenas 300, testando-os pela forma como bebiam água no ribeiro, mostrando que a vitória pertence ao Senhor e não à força humana.",
    keyVerses: [{ reference: "Juízes 7:7", text: "E disse o Senhor a Gideão: Com estes trezentos homens... vos livrarei, e darei os meandritas na tua mão." }],
    aiPrompt: "Como Deus escolheu os 300 valentes de Gideão no ribeiro e qual o ensinamento da vitória?",
    tags: ["gideao", "gideão", "300 valentes", "prova da agua", "midiagitas", "livramento", "dependencia de deus"]
  },
  {
    id: "story-1023",
    name: "1023. Rute e a Declaração de Lealdade a Noemi",
    type: "personagem",
    badge: "Amor Incondicional • O Teu Deus é o Meu Deus",
    summary: "A moabita Rute demonstrou amor incondicional e fidelidade à sua sogra Noemi, proferindo o famoso voto: 'O teu povo será o meu povo, e o teu Deus o meu Deus'.",
    keyVerses: [{ reference: "Rute 1:16", text: "Não me instes para que te deixe, e me abandone... o teu povo é o meu povo, o teu Deus é o meu Deus." }],
    aiPrompt: "Qual o compromisso de Rute com Noemi e a lição de lealdade para as nossas famílias?",
    tags: ["rute", "noemi", "lealdade", "moabita", "amizade", "familia", "compromisso", "remidor"]
  },
  {
    id: "story-1024",
    name: "1024. Boaz: O Remidor Generoso de Belém",
    type: "personagem",
    badge: "Parente Remidor • Ancestral do Rei Davi",
    summary: "Boaz, um homem rico e temente a Deus, agiu como parente remidor na vida de Rute e Noemi, resgatando suas terras e casando-se com Rute, tornando-se bisavô do rei Davi.",
    keyVerses: [{ reference: "Rute 2:12", text: "O Senhor retribua o teu feito; e te seja concedido pleno galardão da parte do Senhor Deus de Israel, sob cujas asas te vieste abrigar." }],
    aiPrompt: "Quem foi Boaz e qual a figura do parente remidor como tipo de Cristo resgatador?",
    tags: ["boaz", "remidor", "resgate", "rute", "generosidade", "belem", "ancestral de cristo"]
  },
  {
    id: "story-1025",
    name: "1025. Ana e a Oração Silenciosa no Tabernáculo",
    type: "personagem",
    badge: "Oração de Coração • Resposta no Tabernáculo",
    summary: "Estéril e angustiada, Ana orou de todo o coração no Tabernáculo em Siló, movendo os lábios sem emitir som. Deus respondeu sua oração concedendo-lhe o nascimento do profeta Samuel.",
    keyVerses: [{ reference: "1 Samuel 1:15", text: "Porém Ana respondeu... Sou uma mulher atribulada de espírito... e tenho derramado a minha alma perante o Senhor." }],
    aiPrompt: "Como Ana orou no Tabernáculo em Siló e como Deus concedeu o nascimento de Samuel?",
    tags: ["ana", "oracao de coracao", "dor", "esterilidade", "samuel", "voto", "persistencia", "deus responde"]
  },
  {
    id: "story-1026",
    name: "1026. Samuel: O Jovem Que Ouviu a Voz do Senhor",
    type: "personagem",
    badge: "Fala Senhor • Chamado do Profeta",
    summary: "Servindo no templo desde criança, o menino Samuel ouviu a voz de Deus chamando seu nome durante a noite e respondeu: 'Fala, Senhor, porque o teu servo ouve'.",
    keyVerses: [{ reference: "1 Samuel 3:9", text: "Se te chamar, dirás: Fala, Senhor, porque o teu servo ouve." }],
    aiPrompt: "Como o jovem Samuel aprendeu a ouvir a voz de Deus no Templo com a ajuda de Eli?",
    tags: ["samuel", "voz de deus", "chamado", "infancia", "discernimento", "obediencia", "profeta"]
  },
  {
    id: "story-1027",
    name: "1027. A Amizade Aliançada de Jônatas e Davi",
    type: "personagem",
    badge: "Lealdade Bíblica • Aliança de Irmãos",
    summary: "Jônatas, filho do rei Saul, fez um pacto de amizade profunda e desinteressada com Davi, protegendo-o da fúria e inveja do próprio pai Saul.",
    keyVerses: [{ reference: "1 Samuel 20:42", text: "Vai-te em paz; porque nós temos jurado ambos em nome do Senhor, dizendo: O Senhor seja entre mim e ti..." }],
    aiPrompt: "O que a história da amizade entre Jônatas e Davi nos ensina sobre fidelidade e lealdade?",
    tags: ["jonatas", "jônatas", "davi", "amizade biblica", "lealdade", "alianca", "protecao", "amor fraterno"]
  },
  {
    id: "story-1028",
    name: "1028. Abigail: A Mulher Que Evitou a Derramamento de Sangue",
    type: "personagem",
    badge: "Pacificadora • Sabedoria e Diplomacia",
    summary: "Com sabedoria, discernimento e diplomacia, Abigail intercedeu junto a Davi para impedir que ele destruísse sua casa após a insensatez e grosseria de seu marido Nabal.",
    keyVerses: [{ reference: "1 Samuel 25:33", text: "Bendita seja a tua prudência, e bendita sejas tu, que hoje me impediste de vir com sangue..." }],
    aiPrompt: "Quem foi Abigail e como sua sabedoria evitou que Davi fizesse justiça com as próprias mãos?",
    tags: ["abigail", "nabal", "davi", "paciencia", "prudencia", "pacificadora", "sabedoria feminina"]
  },
  {
    id: "story-1029",
    name: "1029. Mefibosete e a Graça do Rei na Mesa Real",
    type: "personagem",
    badge: "Restauração de Lo-Debar • Graça Real",
    summary: "Mefibosete, neto de Saul e aleijado de ambos os pés, vivia esquecido em Lo-Debar até que Davi demonstrou bondade por amor a Jônatas, restaurando suas terras e colocando-o em sua mesa.",
    keyVerses: [{ reference: "2 Samuel 9:13", text: "Morava, pois, Mefibosete em Jerusalém, porquanto comia sempre à mesa do rei; e era coxo de ambos os pés." }],
    aiPrompt: "Como Davi acolheu Mefibosete de Lo-Debar e qual a ilustração da graça de Deus?",
    tags: ["mefibosete", "lo-debar", "bondade", "graca", "alianca", "restauracao", "mesa do rei", "consideracao"]
  },
  {
    id: "story-1030",
    name: "1030. Benaia: O Homem Que Matou um Leão num Poço na Neve",
    type: "personagem",
    badge: "Valentes de Davi • Ousadia e Coragem",
    summary: "Benaia, um dos valentes de Davi, destacou-se por atos inacreditáveis de coragem, como descer a uma cova num dia de neve para combater e matar um leão.",
    keyVerses: [{ reference: "1 Crônicas 11:22", text: "Benaia... homem valente, grande em feitos... ele desceu e matou um leão dentro de uma cova, no tempo da neve." }],
    aiPrompt: "Quem foi Benaia e qual o significado de enfrentar e matar um leão na cova num dia de neve?",
    tags: ["benaia", "valentes de davi", "coragem", "leao no poco", "superacao", "ousadia", "guerreiro"]
  },
  {
    id: "story-1031",
    name: "1031. O Profeta Natã e a Parábola da Ovelhinha",
    type: "personagem",
    badge: "Confronto Profético • Tu És Este Homem",
    summary: "Natã confrontou o rei Davi com coragem profética após o pecado de adultério e assassinato com Bate-Seba, utilizando uma parábola impactante para levar Davi ao arrependimento.",
    keyVerses: [{ reference: "2 Samuel 12:13", text: "Então disse Davi a Natã: Pequei contra o Senhor. E disse Natã a Davi: Também o Senhor perdoou o teu pecado; não morrerás." }],
    aiPrompt: "Como a parábola de Natã levou Davi ao verdadeiro arrependimento relatado no Salmo 51?",
    tags: ["nata", "natã", "davi", "confronto", "arrependimento", "pecado", "restauracao", "parabola da ovelha"]
  },
  {
    id: "story-1032",
    name: "1032. Salomão e o Julgamento das Duas Mães",
    type: "personagem",
    badge: "Tribunal de Salomão • Discernimento",
    summary: "Recém-empossado rei, Salomão demonstrou a sabedoria divina ao resolver a disputa entre duas mulheres que reivindicavam a maternidade do mesmo bebê vivo.",
    keyVerses: [{ reference: "1 Reis 3:27", text: "Então respondeu o rei, e disse: Dai a esta o menino vivo, e de modo nenhum o mateis; esta é sua mãe." }],
    aiPrompt: "Como o rei Salomão resolveu a disputa entre as duas mulheres pelo mesmo bebê?",
    tags: ["salomao", "salomão", "sabedoria", "julgamento", "duas maes", "discernimento", "justica", "tribunal real"]
  },
  {
    id: "story-1033",
    name: "1033. Elias e os Ravenos no Ribeiro de Querite",
    type: "personagem",
    badge: "Sustento Milagroso • Ribeiro de Querite",
    summary: "Durante a época de grande seca em Israel, Deus sustentou o profeta Elias escondido no ribeiro de Querite, enviando corvos para lhe trazerem pão e carne todos os dias.",
    keyVerses: [{ reference: "1 Reis 17:4", text: "E há de ser que beberás do ribeiro; e eu tenho ordenado aos corvos que ali te sustentem." }],
    aiPrompt: "Como Deus usou corvos para sustentar o profeta Elias no ribeiro durante a seca?",
    tags: ["elias", "querite", "corvos", "provisao milagrosa", "seca", "obediencia", "cuidado de deus"]
  },
  {
    id: "story-1034",
    name: "1034. A Viúva de Sarepta e o Pote de Azeite Inesgotável",
    type: "personagem",
    badge: "Multiplicação do Azeite • Provisão na Fome",
    summary: "Uma viúva pobre preparava-se para fazer sua última refeição com o filho quando o profeta Elias pediu água e pão. Pela fé, a farinha da panela e o azeite da botija não se acabaram.",
    keyVerses: [{ reference: "1 Reis 17:14", text: "Porque assim diz o Senhor Deus de Israel: A farinha da panela não se acabará, e o azeite da botija não faltará..." }],
    aiPrompt: "Qual o milagre da farinha e do azeite na casa da viúva de Sarepta?",
    tags: ["viuva de sarepta", "elias", "milagre do azeite", "farinha", "fe", "provisao", "generosidade"]
  },
  {
    id: "story-1035",
    name: "1035. Eliseu e o Machado Flutuante",
    type: "personagem",
    badge: "Poder do Profeta • Cuidado com o Pequeno",
    summary: "Durante a construção de uma acomodação para os discípulos dos profetas, a cabeça de ferro de um machado emprestado caiu na água. Eliseu jogou um pedaço de pau e fez o ferro flutuar.",
    keyVerses: [{ reference: "2 Reis 6:6", text: "E cortou um pau, e o deitou ali, e fez flutuar o ferro." }],
    aiPrompt: "O que nos ensina o milagre de Eliseu fazendo o machado de ferro flutuar nas águas?",
    tags: ["eliseu", "machado flutuante", "milagre", "sensibilidade", "cuidado com coisas pequenas", "poder divino"]
  },
  {
    id: "story-1036",
    name: "1036. Naamã e o Mergulho Sete Vezes no Rio Jordão",
    type: "personagem",
    badge: "Cura da Lepra • Obediência e Humildade",
    summary: "Naamã, um poderoso comandante do exército sírio, precisou vencer o orgulho e obedecer à ordem do profeta Eliseu para mergulhar sete vezes no turvo rio Jordão e ser curado da lepra.",
    keyVerses: [{ reference: "2 Reis 5:10", text: "E Eliseu lhe mandou um mensageiro, dizendo: Vai, e lava-te sete vezes no Jordão, e a tua carne te恢复á, e ficarás purificado." }],
    aiPrompt: "Como Naamã foi curado ao mergulhar sete vezes no rio Jordão?",
    tags: ["naama", "naamã", "lepra", "cura", "rio jordao", "humildade", "obediencia", "milagre", "eliseu"]
  },
  {
    id: "story-1037",
    name: "1037. A Mulher Sunamita e o Quarto de Profeta",
    type: "personagem",
    badge: "Vai Tudo Bem • Ressurreição do Filho",
    summary: "Uma mulher rica da cidade de Suném demonstrou hospitalidade ao construir um quarto em sua casa para o profeta Eliseu. Mais tarde, Deus retribuiu sua generosidade ressuscitando seu filho.",
    keyVerses: [{ reference: "2 Reis 4:35", text: "Então o menino espirrou sete vezes, e abriu os olhos." }],
    aiPrompt: "Quem foi a mulher Sunamita e qual a história do quarto preparado para Eliseu e o milagre do seu filho?",
    tags: ["sunamita", "hospitalidade", "quarto do profeta", "ressurreicao", "recompensa", "generosidade"]
  },
  {
    id: "story-1038",
    name: "1038. O Rei Ezequias e a Oração no Templo",
    type: "personagem",
    badge: "Oração no Templo • Livramento da Assíria",
    summary: "Quando a cidade de Jerusalém foi cercada pelo exército assírio e ameaçada por Rabsaqué, o rei Ezequias apresentou as cartas de chantagem no Templo e Deus enviou livramento.",
    keyVerses: [{ reference: "2 Reis 19:19", text: "Agora, pois, ó Senhor nosso Deus, te rogo que nos livres da sua mão; e assim saberao todos os reinos da terra que só tu és o Senhor Deus." }],
    aiPrompt: "Como o rei Ezequias levou a ameaça assíria ao altar do Templo em oração?",
    tags: ["ezequias", "assirios", "oracao no templo", "livramento", "livramento divino", "confianca", "vitoria"]
  },
  {
    id: "story-1039",
    name: "1039. Josias: O Rei Menino Que Restaurou a Aliança",
    type: "personagem",
    badge: "Achado da Lei • Reforma Espiritual",
    summary: "Ao tornar-se rei com apenas 8 anos, Josias promoveu uma das maiores reformas espirituais de Judá após encontrar o Livro da Lei esquecido dentro do Templo.",
    keyVerses: [{ reference: "2 Crônicas 34:15", text: "E respondeu Hilquias... Achei o livro da lei na casa do Senhor." }],
    aiPrompt: "Como o rei menino Josias promoveu a reforma espiritual em Judá após achar o Livro da Lei?",
    tags: ["josias", "livro da lei", "reforma espiritual", "templo", "avivamento", "obediencia", "jovialidade"]
  },
  {
    id: "story-1040",
    name: "1040. Os Três Jovens na Fornalha de Fogo Ardente",
    type: "personagem",
    badge: "Fornalha Ardente • O Quarto Homem",
    summary: "Sadraque, Mesaque e Abednego recusaram-se a adorar a estátua de ouro do rei Nabucodonosor. Lançados na fornalha ardente, foram salvos e vistos andando com um quarto homem semelhante ao Filho de Deus.",
    keyVerses: [{ reference: "Daniel 3:17-18", text: "Eis que o nosso Deus, a quem nós servimos, é capaz de nos livrar da fornalha de fogo ardente... E, se não, fica sabendo, ó rei, que não serviremos a teus deuses." }],
    aiPrompt: "Qual a lição de fidelidade incondicional de Sadraque, Mesaque e Abednego na fornalha?",
    tags: ["sadraque", "mesaque", "abednego", "fornalha ardente", "fidelidade", "quarto homem", "integridade"]
  },
  {
    id: "story-1041",
    name: "1041. Daniel na Cova dos Leões e a Fidelidade na Oração",
    type: "personagem",
    badge: "Anjo Fechou a Boca dos Leões • Oração Diária",
    summary: "Por manter seu costume de orar a Deus três vezes ao dia contra o decreto do rei Dario, Daniel foi lançado na cova dos leões, mas Deus enviou seu anjo e fechou a boca dos animais.",
    keyVerses: [{ reference: "Daniel 6:10", text: "Daniel... entrava em sua casa (ora, havia no seu quarto janelas abertas da banda de Jerusalém), e três vezes ao dia se punha de joelhos, e orava..." }],
    aiPrompt: "Por que Daniel foi jogado na cova dos leões e como sua fidelidade de oração o salvou?",
    tags: ["daniel", "cova dos leoes", "oracao diaria", "integridade", "protecao divina", "fidelidade", "livramento"]
  },
  {
    id: "story-1042",
    name: "1042. Ester: A Rainha Corajosa Que Intercedeu Pelo Povo",
    type: "personagem",
    badge: "Se Perecer, Pereci • Festa de Purim",
    summary: "Diante do decreto de extermínio dos judeus formulado por Hamã, a rainha Ester jejuou e arriscou a própria vida ao entrar na presença do rei Xerxes sem ser chamada.",
    keyVerses: [{ reference: "Ester 4:16", text: "E assim irei ter com o rei, ainda que não é segundo a lei; e se perecer, pereci." }],
    aiPrompt: "Quem foi a rainha Ester e como sua coragem salvou o povo judeu da destruição?",
    tags: ["ester", "mardoqueu", "hama", "jejum", "coragem", "providencia", "salvamento", "purim"]
  },
  {
    id: "story-1043",
    name: "1043. Neemias e a Reconstrução dos Muros de Jerusalém",
    type: "personagem",
    badge: "Muros de Jerusalém • Liderança em 52 Dias",
    summary: "Copo-de-leite no palácio persa, Neemias sentiu profunda dor ao saber das ruínas de Jerusalém. Ele liderou o povo na reconstrução dos muros da cidade em apenas 52 dias sob oração e vigília.",
    keyVerses: [{ reference: "Neemias 4:9", text: "Porém nós oramos ao nosso Deus e pusemos uma guarda contra eles, de dia e de noite..." }],
    aiPrompt: "Como Neemias reconstruiu os muros de Jerusalém e venceu as estratégias dos inimigos?",
    tags: ["neemias", "muros de jerusalem", "reconstrucao", "lideranca", "oracao e acao", "superacao de oposicao"]
  },
  {
    id: "story-1044",
    name: "1044. Jó e o Reestabelecimento do Dobro",
    type: "personagem",
    badge: "Paciência de Jó • Restauração em Dobro",
    summary: "Após perder bens, filhos e a própria saúde sem amaldiçoar a Deus, Jó permaneceu firme em sua fé. No final do processo, o Senhor restaurou a vida de Jó e lhe deu o dobro de tudo o que tinha.",
    keyVerses: [{ reference: "Jó 1:21", text: "O Senhor o deu, e o Senhor o tomou: bendito seja o nome do Senhor." }],
    aiPrompt: "Como foi o processo de restauração da vida de Jó após a grande provação?",
    tags: ["jo", "paciencia", "provacao", "integridade", "restauracao", "bencao dobrada", "soberania de deus"]
  },
  {
    id: "story-1045",
    name: "1045. A Oração de Zacarias e a Visita do Anjo Gabriel",
    type: "personagem",
    badge: "Anúncio de João Batista • Oração Ouvida",
    summary: "O sacerdote Zacarias e sua esposa Isabel eram idosos e irrepreensíveis. Enquanto Zacarias queimava incenso no Templo, o anjo Gabriel apareceu para anunciar o nascimento de João Batista.",
    keyVerses: [{ reference: "Lucas 1:13", text: "Zacarias, não temas, porque a tua oração foi ouvida, e Isabel, tua mulher, te dará à luz um filho..." }],
    aiPrompt: "Como o anjo Gabriel apareceu a Zacarias no Templo para anunciar João Batista?",
    tags: ["zacarias", "isabel", "anjo gabriel", "joao batista", "milagre na velhice", "oracao ouvida"]
  },
  {
    id: "story-1046",
    name: "1046. A Anunciação do Anjo a Maria e o Magnificat",
    type: "personagem",
    badge: "Magnificat • Eis Aqui a Serva do Senhor",
    summary: "O anjo Gabriel visitou a virgem Maria em Nazaré para anunciar que ela geraria o Messias pelo poder do Espírito Santo. Maria aceitou com humildade e entoou o belo cântico do Magnificat.",
    keyVerses: [{ reference: "Lucas 1:46-47", text: "A minha alma engrandece ao Senhor, e o meu espírito se alegra em Deus meu Salvador." }],
    aiPrompt: "O que foi a Anunciação do anjo Gabriel a Maria e o significado do seu louvor no Magnificat?",
    tags: ["maria", "anjo gabriel", "anunciacao", "magnificat", "submissao", "encarnacao", "graca"]
  },
  {
    id: "story-1047",
    name: "1047. Os Magos do Oriente e as Ofertas ao Rei",
    type: "personagem",
    badge: "Estrela de Belém • Ouro, Incenso e Mirra",
    summary: "Guiados por uma estrela no céu, sábios e magos vindos do Oriente viajaram até Belém para adorar o menino Jesus, presenteando-o com ouro, incenso e mirra.",
    keyVerses: [{ reference: "Mateus 2:2", text: "Onde está aquele que é nascido rei dos judeus? Porque vimos a sua estrela no oriente, e viemos a adorá-lo." }],
    aiPrompt: "Qual o significado da visita dos Magos do Oriente ao menino Jesus em Belém?",
    tags: ["magos do oriente", "estrela de belem", "ouro incenso mirra", "adoracao", "nascimento de jesus"]
  },
  {
    id: "story-1048",
    name: "1048. Simeão e Ana no Templo de Jerusalém",
    type: "personagem",
    badge: "Consolação de Israel • Apresentação no Templo",
    summary: "O idoso Simeão e a profetisa Ana esperaram durante décadas pela consolação de Israel. Ao verem o bebê Jesus sendo apresentado no Templo, reconheceram-no como a luz do mundo.",
    keyVerses: [{ reference: "Lucas 2:29-30", text: "Agora, Senhor, despedes em paz o teu servo, segundo a tua palavra; pois já os meus olhos viram a tua salvação." }],
    aiPrompt: "Quem foram Simeão e a profetisa Ana ao presenciarem o bebê Jesus no Templo?",
    tags: ["simeao", "ana", "templo", "promessa cumprida", "consolo de israel", "bebe jesus", "fidelidade"]
  },
  {
    id: "story-1049",
    name: "1049. João Batista: A Voz Que Clama no Deserto",
    type: "personagem",
    badge: "Eis o Cordeiro de Deus • Pregador do Deserto",
    summary: "Pregando o batismo de arrependimento no deserto da Judeia, João Batista preparou o caminho para a chegada do Messias, exclamando: 'Eis o Cordeiro de Deus, que tira o pecado do mundo'.",
    keyVerses: [{ reference: "Mateus 3:3", text: "Voz do que clama no deserto: Preparai o caminho do Senhor, endireitai as suas veredas." }],
    aiPrompt: "Quem foi João Batista e qual sua missão ao pregar o batismo de arrependimento?",
    tags: ["joao batista", "deserto", "batismo", "cordeiro de deus", "pregador", "arrependimento", "precursor"]
  },
  {
    id: "story-1050",
    name: "1050. Natanael Encontrado debaixo da Figueira",
    type: "personagem",
    badge: "Um Verdadeiro Israelita • Visão sob a Figueira",
    summary: "Filipe chamou Natanael para conhecer Jesus de Nazaré. Impressionado por Jesus revelar que já o tinha visto orando sob a figueira antes mesmo do encontro, Natanael professou sua fé.",
    keyVerses: [{ reference: "João 1:47", text: "Eis aqui um verdadeiro israelita, em quem não há dolo." }],
    aiPrompt: "Como foi o encontro de Jesus com Natanael e a revelação de tê-lo visto sob a figueira?",
    tags: ["natanael", "figueira", "filipe", "visao de jesus", "sinceridade", "discipulo", "chamado"]
  }
].map(item => ({
  ...item,
  name: stripLeadingNumber(item.name),
  devotionalTitle: item.devotionalTitle ? stripLeadingNumber(item.devotionalTitle) : undefined,
  aiPrompt: stripLeadingNumber(item.aiPrompt)
}));

// ---------------------------------------------------------------------------
// DOCUMENT DATASET: CONHECIMENTO BÍBLICO, TEOLOGIA E VIDA CRISTÃ (1351 A 1370)
// ---------------------------------------------------------------------------
export const expandedTheologyTopics: BiblicalEntity[] = [
  {
    id: "theo-1351",
    name: "1351. O Significado da Graça Extravagante de Deus",
    type: "assunto",
    badge: "Sola Gratia • Favor Imerecido",
    summary: "A graça é o favor imerecido de Deus concedido à humanidade. Ela não pode ser comprada nem alcançada por obras, sendo a fonte da nossa salvação mediante a fé em Jesus.",
    keyVerses: [{ reference: "Efésios 2:8-9", text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus..." }],
    aiPrompt: "O que é a graça de Deus segundo a Bíblia e por que a salvação é gratuita?",
    tags: ["graca", "favor imerecido", "salvacao", "efesios 2", "misericordia", "dom gratuito", "amor incondicional"]
  },
  {
    id: "theo-1352",
    name: "1352. A Doutrina da Justificação Pela Fé (Sola Fide)",
    type: "assunto",
    badge: "Sola Fide • Declarado Justo",
    summary: "A justificação é o ato judicial de Deus em que Ele declara o pecador justo com base no sacrifício purificador de Jesus, recebido unicamente por meio da fé e não por mérito pessoal.",
    keyVerses: [{ reference: "Romanos 5:1", text: "Tendo sido, pois, justificados pela fé, temos paz com Deus, por nosso Senhor Jesus Cristo." }],
    aiPrompt: "O que ensina a doutrina da justificação pela fé na Teologia Reformada e em Romanos?",
    tags: ["justificacao", "sola fide", "fe", "justica de cristo", "perdao", "tribunal divino", "reforma protestante"]
  },
  {
    id: "theo-1353",
    name: "1353. A Santificação Contínua e a Transformação Diária",
    type: "assunto",
    badge: "Crescimento no Espírito • Maturidade",
    summary: "A santificação é o processo progressivo operado pelo Espírito Santo na vida do crente, separando-o do pecado e conformando seu caráter e atitudes à imagem de Jesus Cristo.",
    keyVerses: [{ reference: "2 Coríntios 3:18", text: "Mas todos nós, com rosto descoberto, refletindo como um espelho a glória do Senhor, somos transformados de glória em glória..." }],
    aiPrompt: "O que é a santificação do crente e como o Espírito Santo nos molda dia após dia?",
    tags: ["santificacao", "crescimento espiritual", "processo", "espirito santo", "purificacao", "frutos", "maturidade"]
  },
  {
    id: "theo-1354",
    name: "1354. O Mistério da União Hipostática em Jesus Cristo",
    type: "assunto",
    badge: "Cristologia • Verdadeiro Deus e Verdadeiro Homem",
    summary: "O conceito teológico da União Hipostática explica que Jesus Cristo é totalmente Deus e totalmente homem simultaneamente, unindo duas naturezas perfeitas em uma só pessoa.",
    keyVerses: [{ reference: "Colossenses 2:9", text: "Porque nele habita corporalmente toda a plenitude da divindade." }],
    aiPrompt: "Explique a União Hipostática e como Jesus é 100% Deus e 100% homem.",
    tags: ["uniao hipostatica", "divindade de jesus", "humanidade de jesus", "encarnacao", "teologia", "cristo"]
  },
  {
    id: "theo-1355",
    name: "1355. A Doutrina do Espírito Santo (Pneumatologia)",
    type: "assunto",
    badge: "Pneumatologia • O Parácleto e Guia",
    summary: "A Pneumatologia é o estudo teológico sobre a pessoa, os atributos e a obra do Espírito Santo, terceira pessoa da Trindade que habita, guia, consola e capacita a Igreja.",
    keyVerses: [{ reference: "João 16:13", text: "Mas, quando vier aquele Espírito de verdade, ele vos me guiará em toda a verdade..." }],
    aiPrompt: "Quem é o Espírito Santo segundo a Pneumatologia e qual a Sua habitação no crente?",
    tags: ["pneumatologia", "espirito santo", "consolador", "paracleto", "habitacao", "santificador", "dons espirituais"]
  },
  {
    id: "theo-1356",
    name: "1356. Os Nomes Redentores de Deus no Antigo Testamento",
    type: "assunto",
    badge: "Yahweh • Revelação do Nome Sagrado",
    summary: "Os nomes revelados de Deus revelam aspectos do Seu caráter e do Seu cuidado: Jeová Jireh (Provedor), Jeová Rapha (Curador), Jeová Shalom (Nossa Paz) e Jeová Nissi (Bandeira).",
    keyVerses: [{ reference: "Êxodo 3:14", text: "Disse Deus a Moisés: EU SOU O QUE SOU." }],
    aiPrompt: "Quais os principais nomes redentores de Deus no Antigo Testamento e seus significados?",
    tags: ["nomes de deus", "jeova jireh", "jeova rapha", "jeova shalom", "yahweh", "revelacao", "carater divino"]
  },
  {
    id: "theo-1357",
    name: "1357. O Amor Ágape vs. Outros Tipos de Amor",
    type: "assunto",
    badge: "Amor Divino • Ágape, Philia e Eros",
    summary: "A Bíblia utiliza a palavra grega 'Ágape' para descrever o amor incondicional, sacrificial e eterno de Deus, diferenciando-o do amor fraterno (Philia) e do amor romântico (Eros).",
    keyVerses: [{ reference: "1 João 4:10", text: "Nisto está o amor, não em que nós tenhamos amado a Deus, mas em que ele nos amou a nós, e enviou seu Filho para propiciação pelos nossos pecados." }],
    aiPrompt: "Qual a diferença entre amor Ágape, Philia e Eros na Bíblia?",
    tags: ["amor agape", "amor de deus", "philia", "eros", "1 corintios 13", "sacrificio", "amor incondicional"]
  },
  {
    id: "theo-1358",
    name: "1358. O Papel e o Significado do Fruto do Espírito",
    type: "assunto",
    badge: "Virtudes Cristãs • Gálatas 5",
    summary: "Em Gálatas 5, o Fruto do Espírito representa a transformação interna e as virtudes morais produzidas pelo Espírito no crente: amor, alegria, paz, paciência, benignidade, bondade, fidelidade, mansidão e domínio próprio.",
    keyVerses: [{ reference: "Gálatas 5:22-23", text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança." }],
    aiPrompt: "O que é o Fruto do Espírito em Gálatas 5 e como ele se manifesta em nossas atitudes?",
    tags: ["fruto do espirito", "galatas 5", "virtudes", "carater cristao", "dominio proprio", "mansidao", "amor"]
  },
  {
    id: "theo-1359",
    name: "1359. O Que É a Batalha Espiritual e Como Lutá-la",
    type: "assunto",
    badge: "Armadura de Deus • Efésios 6",
    summary: "A batalha espiritual é o combate invisível contra forças malignas e tentações. É vencida através de armas espirituais: oração, verdade, fé, Palavra de Deus e a armadura do crente.",
    keyVerses: [{ reference: "2 Coríntios 10:4", text: "Porque as armas da nossa milícia não são carnais, mas sim poderosas em Deus para destruição das fortalezas." }],
    aiPrompt: "Como travar e vencer a batalha espiritual usando a armadura de Deus?",
    tags: ["batalha espiritual", "armadura de deus", "efesios 6", "oracao", "autoridade espiritual", "libertacao"]
  },
  {
    id: "theo-1360",
    name: "1360. A Importância do Perdão para a Saúde da Alma",
    type: "assunto",
    badge: "Liberdade da Amargura • Cura da Alma",
    summary: "O perdão bíblico é uma decisão de libertar o devedor da culpa e da amargura, espelhando o perdão que recebemos de Deus em Cristo e trazendo cura emocional e libertação espiritual.",
    keyVerses: [{ reference: "Mateus 6:14-15", text: "Porque, se perdoardes aos homens as suas ofensas, também vosso Pai celestial vos perdoará a vós..." }],
    aiPrompt: "O que a Bíblia ensina sobre perdoar para alcançar a cura da alma?",
    tags: ["perdao", "cura da alma", "amargura", "libertacao", "reconciliacao", "pai nosso", "magoa"]
  },
  {
    id: "theo-1361",
    name: "1361. Como Praticar o Jejum Bíblico com Propósito",
    type: "assunto",
    badge: "Consagração do Corpo • Jejum e Oração",
    summary: "O jejum é a abstinência voluntária de alimentos por razões espirituais, visando consagrar o corpo, intensificar a oração, buscar a direção de Deus e subjugar a carne.",
    keyVerses: [{ reference: "Mateus 6:17-18", text: "Tu, porém, quando jejuares, unge a tua cabeça, e lava o teu rosto, para não pareceres aos homens que jejuas..." }],
    aiPrompt: "Como praticar o jejum bíblico de forma agradável ao Senhor e com propósito espiritual?",
    tags: ["jejum", "oracao", "consagracao", "disciplina espiritual", "direcao divina", "fortalecimento"]
  },
  {
    id: "theo-1362",
    name: "1362. O Significado e a Prática do Dízimo e Ofertas",
    type: "assunto",
    badge: "Malaquias 3 • Adoração e Generosidade",
    summary: "O dízimo (dez por cento) e as ofertas voluntárias são atos de adoração, gratidão e reconhecimento de que tudo pertence a Deus, apoiando a obra da igreja e a assistência social.",
    keyVerses: [{ reference: "2 Coríntios 9:7", text: "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." }],
    aiPrompt: "O que a Bíblia fala sobre dízimos e ofertas como ato de adoração?",
    tags: ["dizimo", "ofertas", "generosidade", "dizimos e ofertas", "malaquias 3", "sustentaculo da igreja", "mordomia"]
  },
  {
    id: "theo-1363",
    name: "1363. O Que É a Mordomia Cristã das Finanças",
    type: "assunto",
    badge: "Administração Sábia • Fidelidade com Recursos",
    summary: "A mordomia cristã é a administração sábia e responsável de todos os recursos que Deus confiou ao ser humano: tempo, dinheiro, talentos, corpo e a criação.",
    keyVerses: [{ reference: "Lucas 16:10", text: "Quem é fiel no pouco, também é fiel no muito; quem é injusto no pouco, também é injusto no muito." }],
    aiPrompt: "O que é mordomia cristã e como gerir nossas finanças de forma bíblica?",
    tags: ["mordomia crista", "financas", "orcamento", "fidelidade", "administracao", "talentos", "responsabilidade"]
  },
  {
    id: "theo-1364",
    name: "1364. A Oração Intercessora: Orando Pelos Outros",
    type: "assunto",
    badge: "Estar na Brecha • Amor ao Próximo",
    summary: "Interceder é colocar-se na brecha em favor de outra pessoa diante de Deus, clamando por suas necessidades, salvação, cura, proteção e restauração espiritual.",
    keyVerses: [{ reference: "1 Timóteo 2:1", text: "Admoesto-te, pois, antes de tudo, que se façam deprecações, orações, intercessões, e ações de graças, por todos os homens..." }],
    aiPrompt: "Como funciona a oração de intercessão e a missão de colocar-se na brecha pelos outros?",
    tags: ["intercessao", "oracao intercessora", "colocar na brecha", "orar pelos outros", "amor pratico"]
  },
  {
    id: "theo-1365",
    name: "1365. Como Ter um Devocional Diário Relevante",
    type: "assunto",
    badge: "Momento a Sós • Hábito com Deus",
    summary: "O devocional diário é o tempo a sós reservado para cultivar o relacionamento com Deus por meio da leitura meditada da Bíblia, reflexão e oração pessoal.",
    keyVerses: [{ reference: "Mateus 6:6", text: "Mas tu, quando orares, entra no teu quarto e, fechando a tua porta, ora a teu Pai que está em secreto..." }],
    aiPrompt: "Como ter um tempo devocional diário consistente e transformador?",
    tags: ["devocional diario", "momento a sos", "leitura da biblia", "oracao", "comunhao", "habito diario"]
  },
  {
    id: "theo-1366",
    name: "1366. Como Vencer o Desânimo e a Frieza Espiritual",
    type: "assunto",
    badge: "Avivamento Pessoal • Renovar o Fogo",
    summary: "O desânimo espiritual pode ser superado reavivando a chama da oração, voltando à Palavra de Deus, buscando comunhão com a igreja e focando nas promessas eternas de Deus.",
    keyVerses: [{ reference: "2 Timóteo 1:6", text: "Por esta razão te lembro que despertes o dom de Deus que existe em ti pela imposição das minhas mãos." }],
    aiPrompt: "Como vencer o desânimo espiritual e reacender a fé na vida diária?",
    tags: ["desanimo espiritual", "frieza espiritual", "primeiro amor", "renovacao", "avivamento pessoal"]
  },
  {
    id: "theo-1367",
    name: "1367. O Que Diz a Bíblia Sobre a Ansiedade",
    type: "assunto",
    badge: "Filipenses 4 • Paz de Deus que Guarda",
    summary: "A Palavra de Deus orienta a lançar toda a ansiedade e preocupação sobre o Senhor mediante a oração e súplica com ações de graças, recebendo a paz que excede o entendimento.",
    keyVerses: [{ reference: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." }],
    aiPrompt: "O que a Bíblia orienta sobre como lidar e superar crises de ansiedade?",
    tags: ["ansiedade", "preocupacao", "filipenses 4", "paz de deus", "descanso", "confianca", "saude mental"]
  },
  {
    id: "theo-1368",
    name: "1368. O Luto na Perspectiva Cristã de Esperança",
    type: "assunto",
    badge: "Consolo do Espírito • Vida Eterna",
    summary: "Embora o cristão sinta a dor da separação e da perda de entes queridos, o luto é vivido com a esperança viva da ressurreição em Cristo e da reunião eterna no céu.",
    keyVerses: [{ reference: "João 14:1-3", text: "Não se turbe o vosso coração; credes em Deus, crede também em mim. Na casa de meu Pai há muitas moradas..." }],
    aiPrompt: "Como o evangelho traz esperança e consolo durante o momento de luto e dor?",
    tags: ["luto", "perda", "consolacao", "esperanca", "ressurreicao", "vida eterna", "consolo do espirito"]
  },
  {
    id: "theo-1369",
    name: "1369. O Papel do Cristão no Trabalho e na Profissão",
    type: "assunto",
    badge: "Ética Profissional • Servir com Excelência",
    summary: "A Bíblia ensina que todo trabalho honesto deve ser realizado com excelência, ética e dedicação, como se estivesse sendo feito para o próprio Senhor Jesus e não para homens.",
    keyVerses: [{ reference: "Efésios 6:7", text: "Servindo de boa vontade como ao Senhor, e não como aos homens..." }],
    aiPrompt: "Como ser um bom testemunho cristão no ambiente de trabalho e profissão?",
    tags: ["trabalho", "profissao", "etica profissional", "excelencia", "colossenses 3", "testemunho profissional"]
  },
  {
    id: "theo-1370",
    name: "1370. O Verdadeiro Culto Familiar (Altar da Família)",
    type: "assunto",
    badge: "Altar no Lar • Ensino da Família",
    summary: "O culto doméstico é a prática regular de reunir a família no lar para ler as Escrituras, cantar louvores e orar juntos, fortalecendo a fé e a unidade familiar.",
    keyVerses: [{ reference: "Josué 24:15", text: "Eu e a minha casa serviremos ao Senhor." }],
    aiPrompt: "Como criar o hábito do culto familiar em casa para ensinar a fé aos filhos?",
    tags: ["culto domestico", "altar familiar", "oracao em familia", "ensino dos filhos", "unidade"]
  }
].map(item => ({
  ...item,
  name: stripLeadingNumber(item.name),
  devotionalTitle: item.devotionalTitle ? stripLeadingNumber(item.devotionalTitle) : undefined,
  aiPrompt: stripLeadingNumber(item.aiPrompt)
}));

// Combine all character list items into a clean unified collection
export const allBiblicalCharacters: BiblicalEntity[] = [
  ...baseCharacters,
  ...expandedCharacterStories,
  ...extraCharacterList.map((item, idx) => ({
    id: `char-extra-${idx}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    name: item.name,
    type: "personagem" as const,
    badge: `${item.badge} • ${item.book}`,
    summary: item.summary,
    keyVerses: [{ reference: item.book, text: item.summary }],
    devotionalTitle: `Lições da Vida de ${item.name}`,
    devotionalCategory: "Fé e Vida",
    aiPrompt: `Quem foi ${item.name} na Bíblia (${item.book}) e qual o significado da sua história?`,
    tags: [item.name.toLowerCase(), item.book.toLowerCase(), "personagem", "biblia"]
  }))
].map(item => ({
  ...item,
  name: stripLeadingNumber(item.name),
  devotionalTitle: item.devotionalTitle ? stripLeadingNumber(item.devotionalTitle) : undefined,
  aiPrompt: stripLeadingNumber(item.aiPrompt)
}));

// ---------------------------------------------------------------------------
// 100+ ASSUNTOS E CONHECIMENTOS BÍBLICOS
// ---------------------------------------------------------------------------
export const baseTopics: BiblicalEntity[] = [
  {
    id: "amor-de-deus",
    name: "Amor de Deus (Ágape)",
    type: "assunto",
    badge: "Fundamento Bíblico • Incondicional e Eterno",
    summary: "O amor de Deus é a essência do Seu ser. Revelado perfeitamente no sacrifício de Jesus Cristo na cruz, é eterno, sacrificial e transforma nossa vida.",
    keyVerses: [
      { reference: "1 João 4:8", text: "Aquele que não ama não conhece a Deus; porque Deus é amor." },
      { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito..." }
    ],
    devotionalTitle: "O Amor Imensurável do Pai",
    devotionalCategory: "Amor",
    aiPrompt: "O que a Bíblia ensina sobre o amor de Deus e como vivenciá-lo diariamente?",
    tags: ["amor", "agape", "amor de deus", "1 joao 4", "graca"]
  },
  {
    id: "fe-e-confianca",
    name: "Fé e Confiança",
    type: "assunto",
    badge: "Vida Espiritual • O Cerne do Cristão",
    summary: "A fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem. É a chave que nos conecta com a graça de Deus.",
    keyVerses: [
      { reference: "Hebreus 11:1", text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem." },
      { reference: "Hebreus 11:6", text: "Sem fé é impossível agradar a Deus." }
    ],
    devotionalTitle: "A Fé que Transforma Impossíveis",
    devotionalCategory: "Fé",
    aiPrompt: "O que é a fé segundo Hebreus 11 e como desenvolver uma fé inabalável em Deus?",
    tags: ["fe", "faith", "confianca", "hebreus 11", "crer"]
  },
  {
    id: "perdao-e-misericordia",
    name: "Perdão e Misericórdia",
    type: "assunto",
    badge: "Relacionamentos • Libertação da Alma",
    summary: "O perdão é a decisão deliberada de soltar a dívida emocional e perdoar como Cristo nos perdoou. Traz cura espiritual, emocional e restauração.",
    keyVerses: [
      { reference: "Efésios 4:32", text: "Sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como Deus vos perdoou em Cristo." },
      { reference: "Mateus 6:14", text: "Se perdoardes aos homens as suas ofensas, também vosso Pai celestial vos perdoará." }
    ],
    devotionalTitle: "A Liberdade de Perdoar",
    devotionalCategory: "Paz",
    aiPrompt: "O que a Bíblia ensina sobre o perdão e como superar ressentimentos com a ajuda de Deus?",
    tags: ["perdao", "misericordia", "reconciliacao", "efesios 4", "ofensas"]
  },
  {
    id: "ansiedade-e-paz",
    name: "Paz e Cura da Ansiedade",
    type: "assunto",
    badge: "Saúde Emocional • Descanso em Deus",
    summary: "A Bíblia nos orienta a depositar todas as nossas preocupações aos pés do Senhor pela oração, recebendo a paz que excede todo o entendimento.",
    keyVerses: [
      { reference: "Filipenses 4:6-7", text: "Não estejais inquietos por coisa alguma... E a paz de Deus guardará os vossos corações." },
      { reference: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." }
    ],
    devotionalTitle: "Descansando na Tempestade",
    devotionalCategory: "Ansiedade",
    aiPrompt: "O que a Bíblia fala para quem sofre com ansiedade e como encontrar a paz de Deus?",
    tags: ["ansiedade", "paz", "medo", "filipenses 4", "descanso", "1 pedro 5"]
  },
  {
    id: "oracao-e-jejum",
    name: "Oração e Jejum",
    type: "assunto",
    badge: "Disciplinas Espirituais • Intimidade com o Pai",
    summary: "A oração é a conversa contínua com o Criador. O jejum intensifica nossa busca espiritual, alinhando nossa vontade com o coração de Deus.",
    keyVerses: [
      { reference: "1 Tessalonicenses 5:17", text: "Orai sem cessar." },
      { reference: "Jeremias 33:3", text: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes." }
    ],
    devotionalTitle: "O Poder da Oração Persistente",
    devotionalCategory: "Oração",
    aiPrompt: "Como ter uma vida de oração constante e qual o propósito do jejum segundo as Escrituras?",
    tags: ["oracao", "jejum", "intimidade", "1 tessalonicenses 5", "clamor"]
  }
];

// Rich list of 100 biblical subjects
const biblicalTopicTitles = [
  "A Salvação pela Graça", "O Espírito Santo e Seus Dons", "O Fruto do Espírito Santo",
  "A Armadura de Deus", "A Segunda Vinda de Cristo", "O Poder da Palavra de Deus",
  "A Sabedoria Proverbial", "O Casamento Cristão e Família", "A Criacão do Universo",
  "O Louvor e a Adoração em Espírito", "A Santidade e Pureza de Coração", "A Esperança da Vida Eterna",
  "O Dízimo e a Generosidade", "O Jejum Espiritual", "As Parábolas de Jesus",
  "Os Milagres de Jesus", "A Grande Comissão e Evangelismo", "A Gratidão e o Contentamento",
  "A Humildade e o Serviço", "A Batalha Espiritual", "A Providência Divina nas Aflições",
  "A Oração do Pai Nosso", "Os Dez Mandamentos", "O Sermão da Montanha",
  "As Bem-Aventuranças", "A Ressurreição de Jesus", "O Batismo nas Águas",
  "A Santa Ceia do Senhor", "A Aliança de Deus com o Homem", "O Fruto da Justiça",
  "A Luz do Mundo e o Sal da Terra", "O Discipulado Cristão", "A Paternidade de Deus",
  "A Arca da Aliança", "O Tabernáculo de Moisés", "O Templo de Salomão",
  "O Jejum que Agrada a Deus", "A Liberdade em Cristo", "O Fruto dos Lábios que Confessam",
  "O Amor ao Próximo", "A Consolação do Espírito Santo", "A Vitória sobre o Pecado",
  "A Integridade nos Negócios", "A Criação dos Anjos e Mensageiros", "O Cuidado com a Língua",
  "A Domínio Próprio", "A Perseverança na Tribulação", "A Fidelidade nas Pequenas Coisas",
  "A Unidade do Corpo de Cristo", "O Perdão dos Inimigos", "A Cura Divina e Libertação",
  "A Proteção dos Salmos", "O Temor do Senhor", "O Fruto da Paciência",
  "A Autoridade do Nome de Jesus", "O Sangue de Jesus que Purifica", "A Vida de Oração Familiar",
  "A Sabedoria para Educat Filhos", "A Resposta Branda que Desvia a Fúria", "A Alegria da Salvação",
  "A Sobriedade e Vigilância", "A Luz nas Trevas", "A Herança dos Santos",
  "O Consolador e Guia", "A Justiça Espiritual", "O Jejum de Daniel",
  "A Verdade que Liberta", "O Bom Pastor e as Ovelhas", "A Videira Verdadeira e os Ramos",
  "A Porta Estreita", "A Casa Edificada sobre a Rocha", "O Grão de Mostarda",
  "O Semeador e a Semente", "O Filho Pródigo", "O Bom Samaritano",
  "A Pérola de Grande Valor", "A Ovelha Perdida", "A Moeda Perdida",
  "Os Talentos e as Minas", "As Dez Virgens", "O Trono da Graça",
  "O Livro da Vida", "O Novo Céu e a Nova Terra", "O Rio da Água da Vida",
  "A Árvore da Vida", "A Ceia das Bodas do Cordeiro", "A Visão de Patmos",
  "O Selo do Espírito Santo", "A Mente de Cristo", "A Edificação da Igreja",
  "O Poder do Testemunho", "A Fidelidade no Ministério", "A Generosidade Alegre",
  "O Cuidado com os Órfãos e Viúvas", "A Restauração do Caído", "A Mansidão e Suavidade",
  "A Coragem no Dia Mau", "A Presença Manifesta de Deus", "A Renovação da Mente"
];

export const allBiblicalTopics: BiblicalEntity[] = [
  ...baseTopics,
  ...expandedTheologyTopics,
  ...biblicalTopicTitles.map((title, idx) => ({
    id: `topic-extra-${idx}-${title.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    name: title,
    type: "assunto" as const,
    badge: "Conhecimento Bíblico • Estudo e Meditação",
    summary: `Estudo profundo das Escrituras sobre ${title}. Descubra os princípios de Deus para fortalecer sua caminhada cristã, sua fé e seu entendimento teológico.`,
    keyVerses: [
      { reference: "Bíblia Sagrada", text: `Ensinamento bíblico sobre ${title} e aplicação prática no cotidiano.` }
    ],
    devotionalTitle: `Meditação sobre ${title}`,
    devotionalCategory: "Conhecimento",
    aiPrompt: `O que a Bíblia ensina detalhadamente sobre ${title}? Me dê versículos e explicações práticas.`,
    tags: [title.toLowerCase(), "conhecimento", "assunto", "teologia", "estudo biblico"]
  }))
].map(item => ({
  ...item,
  name: stripLeadingNumber(item.name),
  devotionalTitle: item.devotionalTitle ? stripLeadingNumber(item.devotionalTitle) : undefined,
  aiPrompt: stripLeadingNumber(item.aiPrompt)
}));

// Combine both lists for unified searches
export const allBiblicalEntities: BiblicalEntity[] = [
  ...allBiblicalCharacters,
  ...allBiblicalTopics
];

// ---------------------------------------------------------------------------
// 100+ DEVOCIONAIS RECOMENDADOS
// ---------------------------------------------------------------------------
export const recommendedDevotionals: RecommendedDevotional[] = [
  { id: "dev-1", title: "A Fé que Move Montanhas", category: "Fé", verse: "Mateus 17:20", text: "Se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá...", summary: "Descubra como a menor centelha de fé genuína ligada ao Deus Todo-Poderoso pode remover grandes obstáculos na sua vida." },
  { id: "dev-2", title: "O Amor Imensurável de Deus", category: "Amor", verse: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...", summary: "O amor de Deus não depende do seu desempenho. Ele amou você primeiro e entregou tudo por você na cruz." },
  { id: "dev-3", title: "Vencendo a Ansiedade na Oração", category: "Ansiedade", verse: "Filipenses 4:6-7", text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam conhecidas...", summary: "Troque a inquietação da sua mente pelo descanso da oração. Deus guarda seu coração em perfeita paz." },
  { id: "dev-4", title: "O Escudo da Fé nas Provações", category: "Força", verse: "Efésios 6:16", text: "Tomando sobretudo o escudo da fé, com o qual podereis apagar os dardos inflamados...", summary: "Nas batalhas diárias, ative o escudo da fé meditando na Palavra e rejeitando os pensamentos de dúvida." },
  { id: "dev-5", title: "O Senhor é o Meu Pastor", category: "Paz", verse: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará.", summary: "Quando o Criador do Universo guia seus passos, você tem provisão, proteção e descanso em pastos verdejantes." },
  { id: "dev-6", title: "Buscai Primeiro o Reino", category: "Prioridades", verse: "Mateus 6:33", text: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", summary: "Coloque Deus no centro das suas decisões diárias e veja como Ele cuida dos detalhes da sua vida." },
  { id: "dev-7", title: "A Alegria do Senhor é a Nossa Força", category: "Alegria", verse: "Neemias 8:10", text: "Não vos entristeçais; porque a alegria do Senhor é a vossa força.", summary: "Sua força não vem das circunstâncias externas, mas da alegria inabalável de pertencer a Cristo." },
  { id: "dev-8", title: "Renovando as Forças como Águias", category: "Esperança", verse: "Isaías 40:31", text: "Os que esperam no Senhor renovarão as forças, subirão com asas como águias...", summary: "Se você se sente cansado ou sem forças, aprenda a esperar no Senhor e experimente um novo fôlego espiritual." },
  { id: "dev-9", title: "Perdoar para Ser Liberto", category: "Perdão", verse: "Colossenses 3:13", text: "Assim como o Senhor vos perdoou, assim fazei vós também.", summary: "O perdão não justifica o erro do outro, mas liberta a sua alma para viver a plenitude do amor de Deus." },
  { id: "dev-10", title: "Lâmpada para os Meus Pés", category: "Palavra de Deus", verse: "Salmos 119:105", text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", summary: "A Bíblia é o mapa seguro para tomar decisões sábias e iluminar seus passos nos dias incertos." },
  { id: "dev-11", title: "Tudo Posso Naquele que me Fortalece", category: "Vitória", verse: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", summary: "Sua capacidade de superar limites vem da presença constante de Cristo fortalecendo o seu espírito." },
  { id: "dev-12", title: "O Poder da Oração Eficaz", category: "Oração", verse: "Tiago 5:16", text: "A oração feita por um justo pode muito em seus efeitos.", summary: "Deus ouve suas orações sinceras. Continue intercedendo por sua família, saúde e propósitos." },
  { id: "dev-13", title: "Guardando o Coração", category: "Sabedoria", verse: "Provérbios 4:23", text: "Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida.", summary: "Filtre o que você ouve, vê e pensa para manter suas emoções e seu espírito puros e fortalecidos." },
  { id: "dev-14", title: "O Fruto do Espírito Santo", category: "Caráter Cristão", verse: "Gálatas 5:22-23", text: "O fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.", summary: "Permita que o Espírito Santo transforme suas reações e frutifique virtudes celestiais no seu dia a dia." },
  { id: "dev-15", title: "Deus Cuida dos Pássaros e de Você", category: "Providência", verse: "Mateus 6:26", text: "Olhai para as aves do céu... o vosso Pai celestial as sustenta. Não tendes vós muito mais valor?", summary: "Lembre-se do seu valor inestimável para Deus e livre-se das garras do medo em relação ao amanhã." }
];

// Expand to 100+ Devotionals programmatically
const extraDevotionalTopics = [
  "Caminhando sobre as Águas da Fé", "O Refúgio na Hora da Angústia", "Liderança com Humildade de Servo",
  "O Deus que Restaura o Queimado", "Fidelidade no Pouco e Sobre o Muito", "A Luz do Mundo que Resplandece",
  "Coragem para Enfrentar Gigantes", "O Poder da Resposta Branda", "Saindo do Deserto para a Promessa",
  "A Unção que Quebra o Yugo", "A Esperança que Não Decepciona", "O Cuidado de Deus nas Madrugadas",
  "O Escudo dos Íntegros", "Semeando com Lágrimas e Colhendo com Alegria", "A Casa Edificada sobre a Rocha",
  "Permanecendo Firme na Videira", "A Misericórdia que se Renova a Cada Manhã", "A Presença de Deus no Vale de Sombras",
  "Confiando no Tempo Perfeito de Deus", "A Beleza de uma Mente Renovada", "Vencendo as Tentações Diárias",
  "A Paz que Sobrevém nas Lutas", "A Oração do Justo no Quarto Fechado", "O Deus que Cura as Feridas da Alma",
  "Restaurando Altares Caídos", "Servindo com Alegria e Gratidão", "A Benção de uma Família Firmada em Deus",
  "A Sabedoria para Calar e Falar", "Livre do Peso da Culpa pelo Sangue", "O Abrigo do Altíssimo no Salmo 91",
  "A Coragem de Estêvão perante a Oposição", "Aprendendo a Ouvir a Voz Mansa de Deus", "O Exemplo de Generosidade da Viúva Pobre",
  "O Poder da Unidade entre os Irmãos", "Guardando a Fé no Fim da Carreira", "O Pão da Vida que Satisfaz a Alma",
  "Água Viva que Jorra para a Vida Eterna", "A Salvação na Casa de Zaqueu", "A Alegria da Ovelha Encontrada",
  "Lançando as Redes ao Mandado do Mestre", "A Firmeza de Daniel na Babilônia", "O Louvor de Paulo e Silas na Prisão",
  "A Fé de Abraão no Sacrifício", "A Sabedoria de Salomão para Decidir", "A Oração Fervorosa da Mãe Ana",
  "O Perdão Restaurador de Jesus a Pedro", "A Intercessão Apaixonada de Moisés", "A Visão Espiritual do Exército do Senhor",
  "A Libertação das Cadeias do Passado", "Caminhando no Propósito de Deus", "O Amor que Tira Todo o Medo",
  "A Armadura Completa para o Dia Mau", "A Doce Presença do Espírito Consolador", "A Certeza da Pátria Celestial",
  "O Fruto da Paciência na Tribulação", "A Vitória Conquistada na Cruz", "O Fogo do Espírito Santo no Pentecostes",
  "A Graça Abundante Onde Abundou o Pecado", "A Integridade nas Finanças e Trabalho", "O Exemplo de Dedicação de Néemias",
  "A Esperança Radiante do Novo Céu", "A Coragem para Testemunhar de Jesus", "A Obediência que Abre Portas de Bênçãos",
  "O Cuidado com as Palavras que Saem da Boca", "A Proteção dos Anjos ao Redor dos Que Temem", "A Doce Comunhão na Mesa do Senhor",
  "A Transformação na Estrada de Damasco", "A Vitória do Leão da Tribo de Judá", "A Restauração Completa de Jó",
  "O Descanso de Deus no Sábado da Alma", "A Beleza do Povo do Senhor Unido", "O Zelo pela Casa do Pai",
  "A Firmeza diante dos Ventos de Doutrina", "O Brilho da Estrela da Manhã", "O Deus de Abraão, Isaque e Jacó",
  "A Resposta de Deus ao Clamor do Humilde", "A Mansidão que Herda a Terra", "O Fruto do Amor Prático em Ação",
  "A Cura do Cego de Jericó", "A Ressurreição de Lázaro e Nossos Sonhos", "A Pesca Maravilhosa no Mar da Galileia",
  "O Toque de Fé na Orla do Manto", "A Multiplicação dos Pães e Peixes", "A Tempestade Acalmada pela Palavra",
  "A Luz da Aurora que Vai Brilhando Mais", "O Deus das Causas Impossíveis", "A Benção de Ser Chamado Filho de Deus",
  "A Herança do Reino dos Céus", "A Constância na Oração e Louvor"
];

export const allRecommendedDevotionals: RecommendedDevotional[] = [
  ...recommendedDevotionals,
  ...extraDevotionalTopics.map((topic, i) => ({
    id: `dev-extra-${i}`,
    title: topic,
    category: i % 2 === 0 ? "Fé e Vida" : "Espiritualidade",
    verse: "Bíblia Sagrada",
    text: `Meditação diária inspiradora sobre ${topic}.`,
    summary: `Fortalecimento diário para sua caminhada cristã com reflexões sobre ${topic}.`
  }))
];

// ---------------------------------------------------------------------------
// 100+ PASSAGENS BÍBLICAS MAIS BUSCADAS
// ---------------------------------------------------------------------------
export const popularVerses: PopularVerse[] = [
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "Amor e Salvação" },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará.", theme: "Proteção e Cuidado" },
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", theme: "Força nas Provações" },
  { reference: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", theme: "Consolo e Amparo" },
  { reference: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", theme: "Confiança e Direção" },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", theme: "Propósito Divino" },
  { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", theme: "Futuro e Esperança" },
  { reference: "Mateus 6:33", text: "Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", theme: "Prioridade Espiritual" },
  { reference: "Salmos 91:1-2", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Omnipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e neles confiarei.", theme: "Esconderijo Altíssimo" },
  { reference: "Josué 1:9", text: "Não te mandei eu? Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", theme: "Coragem e Liderança" },
  { reference: "Salmos 121:1-2", text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do Senhor que fez o céu e a terra.", theme: "Socorro Presente" },
  { reference: "Romanos 12:2", text: "E não sede conformados com este mundo, mas sede transformados pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus.", theme: "Mente Renovada" },
  { reference: "1 Coríntios 13:4-7", text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com levidade, não se ensoberbece. Não se porta com indecência, não busca os seus interesses, não se irrita, não suspeita mal.", theme: "Amor Verdadeiro" },
  { reference: "Gálatas 5:22-23", text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança. Contra estas coisas não há lei.", theme: "Fruto do Espírito" },
  { reference: "Efésios 2:8-9", text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus. Não vem das obras, para que ninguém se glorie.", theme: "Salvação pela Graça" },
  { reference: "Isaías 40:31", text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", theme: "Asas de Águia" },
  { reference: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", theme: "Alívio em Jesus" },
  { reference: "João 14:6", text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.", theme: "O Caminho Único" },
  { reference: "2 Crônicas 7:14", text: "E se o meu povo, que se chama pelo meu nome, se humilhar, e orar, e buscar a minha face e se converter dos seus maus caminhos, então eu ouvirei dos céus, e perdoarei os seus pecados, e sararei a sua terra.", theme: "Oração e Arrependimento" },
  { reference: "Salmos 46:1", text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", theme: "Fortaleza na Angústia" },
  { reference: "Salmos 119:105", text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", theme: "Guia Diário" },
  { reference: "Tiago 1:5", text: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.", theme: "Pedido de Sabedoria" },
  { reference: "1 João 1:9", text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda a injustiça.", theme: "Confissão e Perdão" },
  { reference: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", theme: "Cuidado de Deus" },
  { reference: "Salmos 37:5", text: "Entrega o teu caminho ao Senhor; confia nele, e ele o fará.", theme: "Entrega Total" },
  { reference: "Apocalipse 3:20", text: "Eis que estou à porta, e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei em sua casa, e com ele cearei, e ele comigo.", theme: "Convite de Jesus" },
  { reference: "Habacuque 3:17-18", text: "Porque ainda que a figueira não floresça... todavia eu me alegrarei no Senhor; exultarei no Deus da minha salvação.", theme: "Alegria na Escassez" },
  { reference: "Mateus 28:19-20", text: "Portanto ide, fazei discípulos de todas as nações... e eis que eu estou convosco todos os dias, até à consumação do século.", theme: "A Grande Comissão" },
  { reference: "Romanos 8:31", text: "Que diremos, pois, a estas coisas? Se Deus é por nós, quem será contra nós?", theme: "Deus Conosco" },
  { reference: "Gálatas 2:20", text: "Já estou crucificado com Cristo; e vivo, não mais eu, mas Cristo vive em mim; e a vida que agora vivo na carne, vivo-a na fé do Filho de Deus.", theme: "Nova Vida em Cristo" }
];

// Add extra popular passages programmatically to reach 100+
const popularPassageReferences = [
  { ref: "Gênesis 1:1", text: "No princípio criou Deus os céus e a terra.", theme: "A Criação" },
  { ref: "Gênesis 12:2", text: "E far-te-ei uma grande nação, e abençoar-te-ei e engrandecerei o teu nome; e tu serás uma bênção.", theme: "Promessa a Abraão" },
  { ref: "Êxodo 20:3", text: "Não terás outros deuses diante de mim.", theme: "Os Mandamentos" },
  { ref: "Deuteronômio 6:5", text: "Amarás, pois, o Senhor teu Deus de todo o teu coração, e de toda a tua alma, e de todas as tuas forças.", theme: "O Grande Mandamento" },
  { ref: "Salmos 1:1-2", text: "Bem-aventurado o homem que não anda segundo o conselho dos ímpios... Antes tem o seu prazer na lei do Senhor.", theme: "A Árvore Junto ao Rio" },
  { ref: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", theme: "Luz e Salvação" },
  { ref: "Salmos 34:8", text: "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", theme: "A Bondade do Senhor" },
  { ref: "Salmos 103:1-2", text: "Bendiz, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.", theme: "Louvor do Coração" },
  { ref: "Salmos 139:14", text: "Eu te louvarei, porque de um modo assombroso, e tão maravilhoso fui feito.", theme: "Criado com Propósito" },
  { ref: "Provérbios 16:3", text: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.", theme: "Projetos em Deus" },
  { ref: "Provérbios 18:10", text: "Torre forte é o nome do Senhor; para ela corre o justo, e está em alto refúgio.", theme: "Torre Forte" },
  { ref: "Eclesiastes 3:1", text: "Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.", theme: "O Tempo de Deus" },
  { ref: "Isaías 9:6", text: "Porque um menino nos nasceu, um filho se nos deu; e o principado está sobre os seus ombros.", theme: "Nascimento do Messias" },
  { ref: "Isaías 26:3", text: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.", theme: "Paz Perfeita" },
  { ref: "Isaías 43:2", text: "Quando passares pelas águas estarei contigo, e quando pelos rios, eles não te submergirão.", theme: "Presença nas Águas" },
  { ref: "Isaías 53:5", text: "Mas ele foi ferido por causa das nossas transgressões, e moído por causa das nossas iniquidades; o castigo que nos traz a paz estava sobre ele.", theme: "O Castigo de Nossa Paz" },
  { ref: "Isaías 55:6", text: "Buscai ao Senhor enquanto se pode achar, invocai-o enquanto está perto.", theme: "Busca ao Senhor" },
  { ref: "Jeremias 33:3", text: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.", theme: "Resposta ao Clamor" },
  { ref: "Lamentações 3:22-23", text: "As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; novas são cada manhã.", theme: "Misericórdias Novas" },
  { ref: "Miqueias 6:8", text: "Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti, senão que meças a justiça, e ames a misericórdia, e andes humildemente com o teu Deus?", theme: "O Que Deus Pede" },
  { ref: "Mateus 5:14", text: "Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte.", theme: "Luz do Mundo" },
  { ref: "Mateus 7:7", text: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.", theme: "Pedi e Recebereis" },
  { ref: "Mateus 18:20", text: "Porque, onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles.", theme: "Presença de Jesus" },
  { ref: "Marcos 11:24", text: "Por isso vos digo que todas as coisas que pedirdes, orando, crede receber, e tê-las-eis.", theme: "Oração com Fé" },
  { ref: "Lucas 1:37", text: "Porque para Deus nada é impossível.", theme: "Nada Impossível" },
  { ref: "João 1:1", text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", theme: "O Verbo Divino" },
  { ref: "João 8:32", text: "E conhecereis a verdade, e a verdade vos libertará.", theme: "A Verdade Liberta" },
  { reference: "João 10:10", text: "O ladrão não vem senão a roubar, a matar, e a destruir; eu vim para que tenham vida, e a tenham com abundância.", theme: "Vida Abundante" },
  { reference: "João 11:25", text: "Disse-lhe Jesus: Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá.", theme: "Ressurreição e Vida" },
  { reference: "João 15:5", text: "Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.", theme: "A Videira Verdadeira" },
  { reference: "João 16:33", text: "Tenho-vos dito isto, para que em mim tenhais paz; no mundo tereis aflições, mas tende bom ânimo, eu venci o mundo.", theme: "Tende Bom Ânimo" },
  { reference: "Atos 1:8", text: "Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós; e ser-me-eis testemunhas.", theme: "Poder do Espírito" },
  { reference: "Atos 4:12", text: "E em nenhum outro há salvação, porque também debaixo do céu nenhum outro nome há, dado entre os homens, pelo qual devamos ser salvos.", theme: "Único Nome" },
  { reference: "Atos 16:31", text: "E eles disseram: Crê no Senhor Jesus Cristo e serás salvo, tu e a tua casa.", theme: "Salvação na Casa" },
  { reference: "Romanos 1:16", text: "Porque não me envergonho do evangelho de Cristo, pois é o poder de Deus para salvação de todo aquele que crê.", theme: "Poder do Evangelho" },
  { reference: "Romanos 3:23-24", text: "Porque todos pecaram e destituídos estão da glória de Deus; sendo justificados gratuitamente pela sua graça.", theme: "Justificação Gratuita" },
  { reference: "Romanos 5:1", text: "Tendo sido, pois, justificados pela fé, temos paz com Deus, por nosso Senhor Jesus Cristo.", theme: "Paz com Deus" },
  { reference: "Romanos 8:1", text: "Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus.", theme: "Nenhuma Condenação" },
  { reference: "Romanos 8:18", text: "Porque para mim tenho por certo que as aflições deste tempo presente não são para comparar com a glória que em nós há de ser revelada.", theme: "Glória Futura" },
  { reference: "Romanos 8:38-39", text: "Porque estou certo de que nem a morte, nem a vida... nos poderá separar do amor de Deus, que está em Cristo Jesus nosso Senhor.", theme: "Amor Inseparável" },
  { reference: "Romanos 10:9", text: "A saber: Se com a tua boca confessares ao Senhor Jesus, e em teu coração creres que Deus o ressuscitou dentre os mortos, serás salvo.", theme: "Confissão de Fé" },
  { reference: "1 Coríntios 2:9", text: "As coisas que o olho não viu, e o ouvido não ouviu, e não subiram ao coração do homem, são as que Deus preparou para os que o amam.", theme: "Promessas Preparadas" },
  { reference: "1 Coríntios 10:13", text: "Não vos sobreveio tentação, senão humana; mas fiel é Deus, que não vos deixará tentar acima do que podeis.", theme: "Fidelidade nas Tentativas" },
  { reference: "1 Coríntios 15:57", text: "Mas graças a Deus que nos dá a vitória por nosso Senhor Jesus Cristo.", theme: "Vitória por Cristo" },
  { reference: "2 Coríntios 5:17", text: "Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.", theme: "Nova Criatura" },
  { reference: "2 Coríntios 12:9", text: "E disse-me: A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", theme: "A Graça que Basta" },
  { reference: "Gálatas 6:9", text: "E não nos cansemos de fazer bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.", theme: "Colheita de Boas Obras" },
  { reference: "Efésios 3:20", text: "Ora, àquele que é poderoso para fazer tudo muito mais abundantemente além daquilo que pedimos ou pensamos.", theme: "Muito Mais Abundantemente" },
  { reference: "Efésios 6:10-11", text: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder. Revesti-vos de toda a armadura de Deus.", theme: "Armadura de Deus" },
  { reference: "Filipenses 1:6", text: "Tendo por certo isto mesmo, que aquele que em vós começou a boa obra a aperfeiçoará até ao dia de Jesus Cristo.", theme: "A Boa Obra Aperfeiçoada" },
  { reference: "Filipenses 2:9-11", text: "Por isso, também Deus o exaltou soberanamente, e lhe deu um nome que é sobre todo o nome...", theme: "Nome Sobre Todo Nome" },
  { reference: "Filipenses 4:6-7", text: "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica.", theme: "Paz e Súplica" },
  { reference: "Colossenses 3:23", text: "E, tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.", theme: "Feito para o Senhor" },
  { reference: "1 Tessalonicenses 5:16-18", text: "Regozijai-vos sempre. Orai sem cessar. Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", theme: "A Alegria e Gratidão" },
  { reference: "2 Timóteo 1:7", text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", theme: "Espírito de Fortaleza" },
  { reference: "2 Timóteo 3:16", text: "Toda a Escritura é divinamente inspirada, e proveitosa para ensinar, para redarguir, para corrigir, para instruir em justiça.", theme: "Palavra Inspirada" },
  { reference: "2 Timóteo 4:7", text: "Combati o bom combate, acabei a carreira, guardei a fé.", theme: "O Bom Combate" },
  { reference: "Hebreus 4:16", text: "Cheguemos, pois, com confiança ao trono da graça, para que possamos alcançar misericórdia e achar graça.", theme: "Trono da Graça" },
  { reference: "Hebreus 11:1", text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.", theme: "Fundamento da Fé" },
  { reference: "Hebreus 12:2", text: "Olhando para Jesus, autor e consumador da fé.", theme: "Olhares em Jesus" },
  { reference: "Hebreus 13:8", text: "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente.", theme: "Jesus Imutável" },
  { reference: "Tiago 1:22", text: "E sede cumpridores da palavra, e não somente ouvintes, enganando-vos a vós mesmos.", theme: "Praticantes da Palavra" },
  { reference: "Tiago 4:7", text: "Sujeitai-vos, pois, a Deus, resisti ao diabo, e ele fugirá de vós.", theme: "Resistência ao Mal" },
  { reference: "1 Pedro 2:9", text: "Mas vós sois a geração eleita, o sacerdócio real, a nação santa, o povo adquirido.", theme: "Povo Eleito" },
  { reference: "1 João 4:19", text: "Nós o amamos a ele porque ele nos amou primeiro.", theme: "Amor Primeiro" },
  { reference: "Apocalipse 21:4", text: "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor.", theme: "Enxugará Toda Lágrima" }
];

// ---------------------------------------------------------------------------
// DOCUMENT DATASET: PASSAGENS, VERSÍCULOS E ORAÇÕES (1701 A 1725)
// ---------------------------------------------------------------------------
export const expandedPassagesAndVerses: PopularVerse[] = [
  { reference: "Salmos 91", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.", theme: "1701. Salmo 91: O Esconderijo do Altíssimo" },
  { reference: "Salmos 23", text: "O Senhor é o meu pastor, nada me faltará. Deita-me faz em verdes pastos, guia-me mansamente a águas tranquilas. Refrigera a minha alma...", theme: "1702. Salmo 23: O Senhor É o Meu Pastor" },
  { reference: "Salmos 121", text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro? O meu socorro vem do Senhor que fez o céu e a terra.", theme: "1703. Salmo 121: De Onde Vem o Meu Socorro" },
  { reference: "Salmos 46", text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. Portanto não temeremos, ainda que a terra se mude...", theme: "1704. Salmo 46: Deus É o Nosso Refúgio e Fortaleza" },
  { reference: "Salmos 139", text: "Senhor, tu me sondaste, e me conheces. Tu sabes o meu assentar e o meu levantar; de longe entendes o meu pensamento.", theme: "1705. Salmo 139: O Deus Que Tudo Sondou e Conhece" },
  { reference: "Salmos 51", text: "Tem misericórdia de mim, ó Deus, segundo a tua benignidade; apaga as minhas transgressões, segundo a multidão das tuas misericórdias. Lava-me completamente da minha iniquidade...", theme: "1706. Salmo 51: O Clamor de Arrependimento de Davi" },
  { reference: "Salmos 37:4-5", text: "Deleita-te também no Senhor, e ele te concederá os desejos do teu coração. Entrega o teu caminho ao Senhor; confia nele, e ele o fará.", theme: "1707. Salmo 37: Confia e Deleita-te no Senhor" },
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "1708. João 3:16 - O Amor de Deus Manifestado no Mundo" },
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", theme: "1709. Filipenses 4:13 - Tudo Posso Naquele Que Me Fortalece" },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas cooperam juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", theme: "1710. Romanos 8:28 - Todas as Coisas Cooperam Para o Bem" },
  { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", theme: "1711. Jeremias 29:11 - Pensamentos de Paz e Não de Mal" },
  { reference: "Isaías 40:31", text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", theme: "1712. Isaías 40:31 - Os Que Esperam no Senhor Renovam Suas Forças" },
  { reference: "Josué 1:9", text: "Não te mandei eu? Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", theme: "1713. Josué 1:9 - Sê Forte e Corajoso, Não Temas" },
  { reference: "Mateus 6:33", text: "Mas, buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", theme: "1714. Mateus 6:33 - Buscai Primeiro o Reino de Deus" },
  { reference: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", theme: "1715. Provérbios 3:5-6 - Confia no Senhor de Todo o Teu Coração" },
  { reference: "2 Crônicas 7:14", text: "E se o meu povo, que se chama pelo meu nome, se humilhar, e orar, e buscar a minha face e se converter dos seus maus caminhos, então eu ouvirei dos céus, e perdoarei os seus pecados, e sararei a sua terra.", theme: "1716. 2 Crônicas 7:14 - Se o Meu Povo Se Humilhar e Orar" },
  { reference: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", theme: "1717. Isaías 41:10 - Não Temas, Porque Eu Sou Contigo" },
  { reference: "1 Coríntios 13:4-7", text: "O amor é paciente, é bondoso. O amor não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor...", theme: "1718. 1 Coríntios 13:4-7 - O Amor É Paciente e Bondoso" },
  { reference: "Efésios 6:10-18", text: "Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as astutas ciladas do diabo... Cingindo os vossos lombos com a verdade, e vestindo-vos da couraça da justiça...", theme: "1719. Efésios 6:10-18 - A Armadura Completa de Deus" },
  { reference: "Êxodo 15:26 / Isaías 53:5", text: "Eu sou o Senhor que te sara. Pelas suas pisaduras fomos sarados. Ele enviou a sua palavra e os curou, e os livrou da sua destruição.", theme: "1720. Versículos de Cura e Saúde para Enfermos" },
  { reference: "2 Timóteo 1:7 / 1 João 4:18", text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, de amor e de moderação. No amor não há medo, antes o perfeito amor lança fora o medo.", theme: "1721. Versículos de Vitória Sobre o Medo e Pânico" },
  { reference: "Salmos 118:24 / Luta 3:22", text: "Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele. As misericórdias do Senhor são a causa de não sermos consumidos, novas são cada manhã.", theme: "1722. Versículos para Início do Dia e Agradecimento" },
  { reference: "João 11:25-26 / Apocalipse 21:4", text: "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá. E Deus limpará de seus olhos toda a lágrima...", theme: "1723. Versículos de Consolo para Momentos de Luto" },
  { reference: "Filipenses 4:19 / Salmos 34:10", text: "O meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus. Os leõezinhos passam necessidade e fome, mas aos que buscam o Senhor bem nenhum faltará.", theme: "1724. Orações e Versículos de Provisão Financeira" },
  { reference: "Mateus 6:9-13", text: "Pai nosso, que estás nos céus, santificado seja o teu nome. Venha o teu reino. Seja feita a tua vontade, tanto na terra como no céu. O pão nosso de cada dia nos dá hoje...", theme: "1725. Oração do Pai Nosso Versículo por Versículo" }
].map(item => ({
  ...item,
  theme: item.theme ? stripLeadingNumber(item.theme) : undefined
}));

export const allPopularVerses: PopularVerse[] = [
  ...popularVerses,
  ...expandedPassagesAndVerses,
  ...popularPassageReferences.map(p => ({
    reference: p.ref || p.reference || "Bíblia",
    text: p.text,
    theme: p.theme
  }))
].map(item => ({
  ...item,
  theme: item.theme ? stripLeadingNumber(item.theme) : undefined
}));
