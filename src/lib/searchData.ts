export interface SearchResult {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
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
  { name: "Lia & Raquel", badge: "As Duas Mães da Casa de Israel", book: "Gênesis 30", summary: "Juntas edifiçaram a casa de Israel de onde surgiram as doze tribos sob a promessa abençoada de Deus." },
  { name: "Labão", badge: "Sogro de Jacó em Padã-Aram", book: "Gênesis 29-31", summary: "Irmão de Rebeca. Trabalhou com Jacó durante vinte anos até selarem uma aliança de paz na montanha de Gileade." },
  { name: "Judá", badge: "Filho de Jacó e Ancestral do Leão de Judá", book: "Gênesis 37-49", summary: "Ofereceu-se como fiador da vida de seu irmão Benjamim no Egito. Recebeu a bênção patriarcal do cetro real." },
  { name: "Tamar", badge: "Nora de Judá de Coragem Persistente", book: "Gênesis 38", summary: "Lutou pela justiça da sua descendência na família patriarcal. Entrou na genealogia do Rei Davi e de Jesus Cristo." },
  { name: "Seforá", badge: "Esposa de Moisés em Midiã", book: "Êxodo 2-4", summary: "Filha do sacerdote Jetro. Salvou a vida de seu esposo pela obediência no sinal do pacto da circuncisão." },
  { name: "Jetro (Reuel)", badge: "Sacerdote de Midiã e Sogro de Moisés", book: "Êxodo 18", summary: "Aconselhou Moisés a delegar a liderança e instituir juízes sobre milhares, centenas e dezenas em Israel." },
  { name: "Efraim e Manassés", badge: "Filhos de José Abençoados por Jacó", book: "Gênesis 48", summary: "Nascidos no Egito e adotados por Jacó como tribos completas em Israel. Jacó cruzou as mãos para abençoar Efraim." },
  { name: "Josué & Calebe", badge: "Os Dois Espias Fiéis", book: "Números 14", summary: "Os únicos dois espias que trouxeram relatório de fé ao povo no deserto, encorajando Israel a tomar a terra." },
  { name: "Balaão", badge: "O Profeta Confrontado pela Jumenta", book: "Números 22-24", summary: "Contratado por Balaque para amaldiçoar Israel, mas teve a boca aberta por Deus para proclamar bênção e a Estrela de Jacó." },
  { name: "Sansão & Manoá", badge: "A Promessa do Anjo à Família", book: "Juízes 13", summary: "Receberam a visita do anjo do Senhor com instruções para a criação de um filho nazireu consagrado desde o ventre." },
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
  { name: "Rei Acabe & Jezabel", badge: "O Rei e a Rainha de Samaria", book: "1 Reis 16-21", summary: "Promoveram o culto a Baal em Israel. Enfrentaram o profeta Elias nas secas e no confronto no Monte Carmelo." },
  { name: "Viúva de Sarepta", badge: "A Mulher da Farinha e do Azeite", book: "1 Reis 17", summary: "Acolheu o profeta Elias com sua última refeição. A panela de farinha não se esgotou e o azeite não faltou." },
  { name: "Obadias (Mordomo de Acabe)", badge: "O Homem que Escondeu Cem Profetas", book: "1 Reis 18", summary: "Temia grandemente ao Senhor desde a sua juventude e escondeu cem profetas em cavernas, sustentando-os com pão e água." },
  { name: "Sunamita", badge: "A Mulher de Fé e Hospitalidade", book: "2 Reis 4", summary: "Preparou um quarto para o profeta Eliseu. Diante da tragédia com seu filho, proclamou com fé: 'Vai tudo bem'." },
  { name: "Naamã o Sírio", badge: "O Comandante Curado no Jordão", book: "2 Reis 5", summary: "Comandante do exército da Síria que sofria de lepra. Atendeu ao conselho de mergulhar sete vezes no Rio Jordão e foi limpo." },
  { name: "Menina Serva de Naamã", badge: "A Menina Israelita de Fé", book: "2 Reis 5", summary: "Levada cativa, não guardou ressentimento e testemunhou ao seu senhor sobre o profeta em Samaria que podia curá-lo." },
  { name: "Geazi", badge: "Moço de Eliseu", book: "2 Reis 5", summary: "Cedeu à ganância e correu atrás de Naamã para pedir presentes. Adverte sobre o perigo da cobiça no ministério." },
  { name: "Rei Manassés", badge: "O Rei que se Arrependeu na Prisão", book: "2 Crônicas 33", summary: "Reinou 55 anos em Jerusalém. Após terríveis erros, humilhou-se profundamente na prisão da Babilônia e foi restaurado." },
  { name: "Zorobabel & Josué Sacerdote", badge: "Os Dois Construtores do Segundo Templo", book: "Esdras 3", summary: "Lançaram os alicerces do segundo templo com choro de emoção e louvor ao Senhor porque Ele é bom." },
  { name: "Gamaliel", badge: "Doutor da Lei no Sinédrio", book: "Atos 5", summary: "Mestre de Paulo. Aconselhou o Sinédrio a não combater os apóstolos: 'Se esta obra for de Deus, não podereis desfazê-la'." },
  { name: "Ananias de Damasco", badge: "O Discípulo Obediente", book: "Atos 9", summary: "Enviado por Deus à rua chamada Direita para impor as mãos sobre Saulo de Tarso para que este recuperasse a vista." },
  { name: "Dorcas (Tabita)", badge: "Mulher Notável em Boas Obras", book: "Atos 9", summary: "Costurava túnicas e vestidos para as viúvas em Jope. O apóstolo Pedro orou por ela e a ressuscitou pelo poder de Deus." },
  { name: "Eutíco", badge: "Jovem Restaurado em Trôade", book: "Atos 20", summary: "Adormeceu enquanto Paulo pregava até tarde e caiu do terceiro andar. Paulo o abraçou e declarou: 'Não vos perturbeis, a vida está nele'." },
  { name: "Lúcio, Manean e Barnabé", badge: "Líderes da Igreja em Antioquia", book: "Atos 13", summary: "Serviam ao Senhor e jejuavam quando o Espírito Santo disse: 'Separai-me Barnabé e Saulo para a obra a que os tenho chamado'." }
];

// Combine all character list items into a clean unified collection
export const allBiblicalCharacters: BiblicalEntity[] = [
  ...baseCharacters,
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
];

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
];

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
    category: i % 2 === 0 ? "Fé & Vida" : "Espiritualidade",
    verse: "Bíblia Sagrada",
    text: `Meditação diária inspiradora sobre ${topic}.`,
    summary: `Fortalecimento diário para sua caminhada cristã com reflexões sobre ${topic}.`
  }))
];

// ---------------------------------------------------------------------------
// 100+ PASSAGENS BÍBLICAS MAIS BUSCADAS
// ---------------------------------------------------------------------------
export const popularVerses: PopularVerse[] = [
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "Amor & Salvação" },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará.", theme: "Proteção & Cuidado" },
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", theme: "Força nas Provações" },
  { reference: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", theme: "Consolo & Amparo" },
  { reference: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", theme: "Confiança & Direção" },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", theme: "Propósito Divino" },
  { reference: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", theme: "Futuro & Esperança" },
  { reference: "Mateus 6:33", text: "Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", theme: "Prioridade Espiritual" },
  { reference: "Salmos 91:1-2", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Omnipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e neles confiarei.", theme: "Esconderijo Altíssimo" },
  { reference: "Josué 1:9", text: "Não te mandei eu? Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", theme: "Coragem & Liderança" },
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

export const allPopularVerses: PopularVerse[] = [
  ...popularVerses,
  ...popularPassageReferences.map(p => ({
    reference: p.ref || p.reference || "Bíblia",
    text: p.text,
    theme: p.theme
  }))
];
