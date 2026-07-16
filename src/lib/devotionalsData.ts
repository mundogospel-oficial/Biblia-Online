export interface Devotional {
  id: number;
  title: string;
  verse: string;
  reference: string;
  category: string;
  meditation: string;
  prayer: string;
}

export const devotionals: Devotional[] = [
  // FÉ (1-10)
  {
    id: 1,
    title: "A Fé que Move Montanhas",
    verse: "Se tiverdes fé como um grão de mostarda, direis a este monte: Passa daqui para acolá, e ele passará.",
    reference: "Mateus 17:20",
    category: "Fé",
    meditation: "A fé não precisa ser gigante para operar milagres; ela precisa apenas ser viva. Um pequeno grão de mostarda tem em si o potencial de crescer e se tornar uma grande árvore. Assim também, uma pequena fé depositada no Deus Todo-Poderoso é capaz de desatar nós, abrir portas fechadas e acalmar as tempestades mais violentas do coração.",
    prayer: "Senhor, aumenta a minha fé hoje, mesmo que ela pareça pequena. Entrego em tuas mãos os montes de dificuldades diante de mim, confiando no teu poder soberano. Amém."
  },
  {
    id: 2,
    title: "Caminhando por Fé, Não por Vista",
    verse: "Porque andamos por fé, e não por vista.",
    reference: "2 Coríntios 5:7",
    category: "Fé",
    meditation: "Caminhar por vista significa depender das circunstâncias físicas ao nosso redor. Caminhar por fé significa olhar para as promessas eternas de Deus. Quando as circunstâncias dizem 'não', a fé olha para o Criador e diz 'Deus proverá'. Treine seus olhos espirituais para ver além das nuvens cinzentas.",
    prayer: "Pai celeste, ajuda-me a não ser guiado pelo medo do que vejo, mas pela certeza de quem Tu és. Guarda meus passos firmes na tua verdade. Amém."
  },
  {
    id: 3,
    title: "O Escudo da Fé",
    verse: "Tomando sobretudo o escudo da fé, com o qual podereis apagar todos os dardos inflamados do maligno.",
    reference: "Efésios 6:16",
    category: "Fé",
    meditation: "Todos os dias somos bombardeados por pensamentos de dúvida, medo, acusação e desânimo. A fé funciona como um escudo protetor que intercepta e apaga esses ataques antes que eles penetrem e firam nossa alma. Fortaleça sua mente meditando na Palavra de Deus.",
    prayer: "Deus zeloso, levanto hoje o escudo da fé sobre a minha mente e meu coração. Protege-me das mentiras do inimigo e enche-me de tua verdade absoluta. Amém."
  },
  {
    id: 4,
    title: "A Certeza das Coisas que Não se Veem",
    verse: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.",
    reference: "Hebreus 11:1",
    category: "Fé",
    meditation: "A fé é a ponte entre o reino invisível de Deus e a nossa realidade visível. Ela nos dá a garantia interna de que Deus está trabalhando nos bastidores, mesmo quando nada parece estar acontecendo. É a certeza absoluta de que as promessas de Deus são reais e imutáveis.",
    prayer: "Senhor Deus, obrigado porque o invisível aos meus olhos é perfeitamente conhecido por Ti. Descanso na certeza de que Tu estás agindo em meu favor. Amém."
  },
  {
    id: 5,
    title: "A Fé no Tempo da Prova",
    verse: "Sabendo que a prova da vossa fé produz a paciência.",
    reference: "Tiago 1:3",
    category: "Fé",
    meditation: "Ninguém gosta de passar por provações, mas elas exercem um papel crucial em nosso amadurecimento espiritual. Uma fé que nunca passou por testes não pode ser plenamente provada. O fogo da provação purifica o ouro da nossa fé, removendo as impurezas e gerando perseverança espiritual.",
    prayer: "Pai Amado, dá-me paciência e firmeza durante as provações. Que minha fé saia fortalecida e purificada de cada momento de desafio. Amém."
  },
  {
    id: 6,
    title: "Firme no Fundamento Correto",
    verse: "Todo aquele, pois, que escuta estas minhas palavras, e as pratica, assemelhá-lo-ei ao homem prudente, que edificou a sua casa sobre a rocha.",
    reference: "Mateus 7:24",
    category: "Fé",
    meditation: "A rocha inabalável é a Palavra de Cristo. Quando edificamos nossas vidas na obediência e na fé prática das Escrituras, as chuvas de problemas e os ventos de crises podem soprar com toda força, mas nossa estrutura espiritual permanecerá intacta e firme.",
    prayer: "Jesus Cristo, Rocha da minha salvação, ajuda-me a praticar os teus ensinamentos diariamente, para que minha vida seja espiritualmente inabalável. Amém."
  },
  {
    id: 7,
    title: "O Justo Viverá da Fé",
    verse: "Mas o justo viverá da fé; e, se ele recuar, a minha alma não terá prazer nele.",
    reference: "Hebreus 10:38",
    category: "Fé",
    meditation: "A vida de fé não é um evento isolado ou uma emoção de momento, mas um estilo de vida diário. Viver da fé significa tomar decisões, falar, agir e planejar o futuro confiando que Deus está no comando, sem retroceder diante das barreiras do caminho.",
    prayer: "Deus eterno, capacita-me a caminhar com integridade e fé inabalável todos os dias, sem olhar para trás ou desanimar com os obstáculos. Amém."
  },
  {
    id: 8,
    title: "A Fé que Agrada a Deus",
    verse: "Sem fé é impossível agradar-lhe; porque é necessário que aquele que se aproxima de Deus creia que ele existe, e que é galardoador dos que o buscam.",
    reference: "Hebreus 11:6",
    category: "Fé",
    meditation: "Deus não busca perfeição religiosa ou rituais vazios, Ele busca corações que creiam verdadeiramente em Sua existência e em Sua bondade ativa. Quando você se aproxima de Deus em oração, faça-o sabendo que Ele ouve e recompensa os que o buscam com sinceridade.",
    prayer: "Pai Celestial, eu creio na tua presença e no teu amor recompensador. Aproximo-me de Ti com o coração aberto, buscando a tua face hoje. Amém."
  },
  {
    id: 9,
    title: "Deus é o Nosso Refúgio",
    verse: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?",
    reference: "Salmos 27:1",
    category: "Fé",
    meditation: "O medo paralisa, mas a fé liberta. Quando reconhecemos que o próprio Criador do universo é a nossa luz pessoal e a fortaleza da nossa existência, os temores perdem o poder sobre nós. Não há treva ou adversidade que possa prevalecer contra a luz do Senhor.",
    prayer: "Senhor, Tu és o meu porto seguro. Afasta de mim todo espírito de medo e ansiedade, e preenche-me com a tua coragem e paz divina. Amém."
  },
  {
    id: 10,
    title: "Olhando para o Autor da Fé",
    verse: "Olhando para Jesus, autor e consumador da fé.",
    reference: "Hebreus 12:2",
    category: "Fé",
    meditation: "Se olharmos para as nossas próprias limitações ou para as falhas dos outros, ficaremos desapontados. A chave para manter a fé ativa é manter os olhos fixos em Jesus. Ele começou a boa obra em nós e Ele mesmo a completará perfeitamente.",
    prayer: "Jesus, ajusta o foco dos meus olhos hoje. Que eu olhe somente para Ti, encontrando em tua vida o exemplo perfeito e a fonte da minha força. Amém."
  },

  // AMOR (11-20)
  {
    id: 11,
    title: "O Amor que Tudo Sofre",
    verse: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se envaidece.",
    reference: "1 Coríntios 13:4",
    category: "Amor",
    meditation: "O verdadeiro amor, conforme descrito pela Bíblia, não é um sentimento instável, mas uma decisão ativa da vontade. Ele se expressa através da paciência, da bondade prática e do respeito mútuo. Amar significa colocar o bem do outro acima do nosso próprio egoísmo.",
    prayer: "Deus de amor, ensina-me a amar as pessoas ao meu redor com paciência e benignidade. Remove do meu coração todo egoísmo, inveja ou orgulho. Amém."
  },
  {
    id: 12,
    title: "A Prova Máxima do Amor",
    verse: "Ninguém tem maior amor do que este: de dar alguém a sua vida pelos seus amigos.",
    reference: "João 15:13",
    category: "Amor",
    meditation: "Jesus demonstrou o amor não apenas com palavras bonitas, mas entregando-se voluntariamente na cruz. Esse sacrifício nos mostra o valor que temos para Ele. O amor de Deus é sacrificial, incondicional e totalmente focado em nossa salvação e restauração.",
    prayer: "Jesus amado, obrigado por me amar a ponto de entregar a tua vida por mim na cruz. Ajuda-me a refletir esse amor sacrificial nas minhas relações cotidianas. Amém."
  },
  {
    id: 13,
    title: "O Perfeito Amor Lança Fora o Medo",
    verse: "No amor não há temor, antes o perfeito amor lança fora o temor.",
    reference: "1 João 4:18",
    category: "Amor",
    meditation: "O medo nos faz sentir inseguros e ameaçados. No entanto, quando compreendemos e aceitamos o amor perfeito e incondicional que o Pai tem por nós, a segurança espiritual toma o lugar do medo. Sabemos que estamos seguros nas mãos de quem nos ama infinitamente.",
    prayer: "Pai Celestial, inunda-me com o teu amor perfeito hoje. Que esse amor dissipe todo medo do futuro, da rejeição ou do fracasso. Amém."
  },
  {
    id: 14,
    title: "Amando com Atitudes Práticas",
    verse: "Meus filhinhos, não amemos de palavra, nem de língua, mas por obra e em verdade.",
    reference: "1 João 3:18",
    category: "Amor",
    meditation: "Falar sobre amor é fácil; demonstrá-lo exige esforço prático. O evangelho nos desafia a transformar nossas palavras de afeto em atitudes reais de serviço, apoio emocional e generosidade material. O amor verdadeiro deixa pegadas de bondade por onde passa.",
    prayer: "Senhor Deus, abre meus olhos para as necessidades práticas daqueles ao meu redor hoje. Que minhas ações demonstrem o teu amor de forma tangível. Amém."
  },
  {
    id: 15,
    title: "O Vínculo da Perfeição",
    verse: "E, sobre tudo isto, revesti-vos de amor, que é o vínculo da perfeição.",
    reference: "Colossenses 3:14",
    category: "Amor",
    meditation: "Podemos ter talentos brilhantes, conhecimento profundo e grandes realizações, mas sem o amor, tudo se torna vazio. O amor é como a vestimenta que coroa e une todas as outras virtudes cristãs, trazendo harmonia e equilíbrio completo às nossas vidas.",
    prayer: "Deus compassivo, que eu me revista de amor todas as manhãs. Que minhas palavras e reações sejam guiadas por esse vínculo perfeito de união. Amém."
  },
  {
    id: 16,
    title: "Amar como Fomos Amados",
    verse: "Um novo mandamento vos dou: Que vos ameis uns aos outros; como eu vos amei a vós, que também vós uns aos outros vos ameis.",
    reference: "João 13:34",
    category: "Amor",
    meditation: "O padrão para o nosso amor ao próximo não é o nosso sentimento humano, mas a forma perfeita como Jesus nos amou: com graça, paciência, perdão sem limites e entrega total. Esse amor mútuo é o maior testemunho que podemos dar ao mundo.",
    prayer: "Senhor, capacita-me a amar as pessoas exatamente como Tu me amaste, perdoando quando necessário e estendendo a mão com misericórdia. Amém."
  },
  {
    id: 17,
    title: "O Amor de Deus é Eterno",
    verse: "Com amor eterno te amei; por isso, com benignidade te atraí.",
    reference: "Jeremias 31:3",
    category: "Amor",
    meditation: "Os amores humanos podem falhar, mudar ou esfriar, mas o amor de Deus é uma constante universal eterna. Ele nos amou antes de fazermos qualquer coisa para merecer e continua nos amando com uma fidelidade que nunca se esgota ao longo do tempo.",
    prayer: "Pai Amado, obrigado por me amar com um amor que nunca falha e nunca muda. Descanso hoje na doce segurança do teu infinito afeto. Amém."
  },
  {
    id: 18,
    title: "A Essência Divina",
    verse: "Aquele que não ama não conhece a Deus; porque Deus é amor.",
    reference: "1 João 4:8",
    category: "Amor",
    meditation: "Deus não apenas pratica o amor; Ele é a própria definição e essência do amor. Consequentemente, nossa comunhão real com Deus é validada pelo quanto permitimos que o amor flua de nós para os nossos semelhantes, transformando o ambiente ao redor.",
    prayer: "Deus Santo, que és a própria fonte de amor, flui através de mim hoje. Que minha vida reflita a tua natureza amorosa e compassiva para todos. Amém."
  },
  {
    id: 19,
    title: "O Amor que Perdoa as Falhas",
    verse: "O amor cobre uma multidão de pecados.",
    reference: "1 Pedro 4:8",
    category: "Amor",
    meditation: "O amor não se alegra com o erro alheio nem expõe as fraquezas dos outros para humilhar. Em vez disso, o amor prefere perdoar, cobrir com misericórdia e buscar a restauração. Perdoar é libertar o outro e libertar a si mesmo do peso do rancor.",
    prayer: "Senhor misericordioso, dá-me um coração pronto para perdoar e esquecer as ofensas. Que o amor prevaleça sobre qualquer mágoa no meu coração. Amém."
  },
  {
    id: 20,
    title: "Nada Pode nos Separar",
    verse: "Quem nos separará do amor de Cristo? A tribulação, ou a angústia, ou a perseguição, ou a fome, ou a nudez, ou o perigo, ou a espada?",
    reference: "Romanos 8:35",
    category: "Amor",
    meditation: "Nenhuma crise financeira, doença, perda ou desafio emocional é forte o suficiente para nos afastar do amor protetor de Cristo. Estamos firmemente guardados sob os Seus cuidados eternos e, em todas as dificuldades, somos mais do que vencedores.",
    prayer: "Obrigado, Jesus, por teu amor inabalável que me protege de todas as tempestades. Sinto-me seguro e amparado debaixo das tuas asas hoje. Amém."
  },

  // PAZ (21-30)
  {
    id: 21,
    title: "A Paz que Excede o Entendimento",
    verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.",
    reference: "Filipenses 4:7",
    category: "Paz",
    meditation: "A paz do mundo depende de circunstâncias favoráveis. A paz de Deus se manifesta em meio ao caos. É uma tranquilidade sobrenatural que não faz sentido lógico para quem olha de fora, mas que estabelece uma fortaleza protetora sobre as nossas emoções.",
    prayer: "Pai amado, derrama sobre mim a tua paz incompreensível hoje. Guarda minhas emoções e pensamentos firmes e serenos em Cristo Jesus. Amém."
  },
  {
    id: 22,
    title: "A Paz do Senhor Como Herança",
    verse: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.",
    reference: "João 14:27",
    category: "Paz",
    meditation: "Antes de ir para a cruz, Jesus deixou um presente inestimável para os Seus discípulos: a Sua própria paz. Não é uma ausência de problemas externos, mas a presença constante e consoladora do Espírito Santo habitando dentro de nós em cada momento.",
    prayer: "Obrigado, Jesus, pelo presente da tua paz. Decido hoje não permitir que o medo ou a perturbação controlem minhas decisões e atitudes. Amém."
  },
  {
    id: 23,
    title: "Em Paz me Deitarei e Dormirei",
    verse: "Em paz me deitarei e dormirei, porque só tu, Senhor, me fazes habitar em segurança.",
    reference: "Salmos 4:8",
    category: "Paz",
    meditation: "A insônia muitas vezes é o reflexo de uma mente sobrecarregada por preocupações e ansiedades. Quando entregamos nosso amanhã nas mãos Daquele que nunca dorme, podemos descansar o corpo e a mente na mais absoluta e doce segurança espiritual.",
    prayer: "Senhor, entrego todas as minhas preocupações do dia em tuas mãos. Concede-me uma noite de sono reparador e em paz absoluta sob tua guarda. Amém."
  },
  {
    id: 24,
    title: "O Castigo que nos Trouxe a Paz",
    verse: "Mas ele foi ferido por causa das nossas transgressões... o castigo que nos traz a paz estava sobre ele.",
    reference: "Isaías 53:5",
    category: "Paz",
    meditation: "Nossa reconciliação com Deus custou um preço altíssimo. Jesus levou sobre si a condenação dos nossos pecados para que hoje pudéssemos usufruir de livre acesso ao Pai e de paz real na nossa consciência espiritual. Viva com alegria essa paz conquistada na cruz.",
    prayer: "Jesus, obrigado pelo sacrifício glorioso que me deu acesso à verdadeira paz com o Pai. Celebro a redenção e o perdão que tenho em Ti. Amém."
  },
  {
    id: 25,
    title: "Ele Conduz às Águas Tranquilas",
    verse: "Guia-me mansamente a águas tranquilas. Refrigera a minha alma.",
    reference: "Salmos 23:2-3",
    category: "Paz",
    meditation: "O Bom Pastor sabe quando nossa alma está cansada e estressada pela rotina pesada. Ele nos convida a pausar a correria e a nos deixarmos ser guiados por Ele para pastos verdejantes e fontes de águas tranquilas, onde nossa alma é restaurada e reenergizada.",
    prayer: "Meu Bom Pastor, guia-me hoje a esses momentos de quietude espiritual. Restaura minhas forças e traz refrigério para a minha alma cansada. Amém."
  },
  {
    id: 26,
    title: "Confiar Produz Paz Perfeita",
    verse: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.",
    reference: "Isaías 26:3",
    category: "Paz",
    meditation: "Nossa mente se assemelha ao leme de um navio: se estiver fixa nos problemas, seremos jogados pelas ondas da ansiedade. Se estiver fixada na grandeza, fidelidade e amor de Deus, navegaremos em águas de paz perfeita e constante, independentemente do tempo.",
    prayer: "Deus Altíssimo, decido fixar meus pensamentos na tua fidelidade e grandeza hoje. Mantém minha mente em paz enquanto confio em Ti. Amém."
  },
  {
    id: 27,
    title: "O Senhor da Paz Convosco",
    verse: "Ora, o mesmo Senhor da paz vos dê sempre paz de toda maneira.",
    reference: "2 Tessalonicenses 3:16",
    category: "Paz",
    meditation: "O desejo do apóstolo Paulo para a igreja era que eles experimentassem paz de todas as maneiras e em todas as situações possíveis. Deus deseja inundar sua casa, seu trabalho, sua mente e seus relacionamentos com a Sua harmonia celestial inigualável.",
    prayer: "Senhor da Paz, rogo que derrames a tua paz sobre a minha família, meus negócios e minha mente hoje, de todas as formas possíveis. Amém."
  },
  {
    id: 28,
    title: "Segurança debaixo das Asas Divinas",
    verse: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.",
    reference: "Salmos 91:1",
    category: "Paz",
    meditation: "Há um lugar espiritual de proteção e paz profunda chamado 'esconderijo do Altíssimo'. É um abrigo seguro onde as tempestades da vida não podem nos atingir no espírito. Habitar ali exige intimidade diária através da oração e da adoração sincera.",
    prayer: "Pai Amado, escolho habitar no teu esconderijo hoje. Encontro meu descanso seguro e minha paz profunda à sombra das tuas asas protetoras. Amém."
  },
  {
    id: 29,
    title: "Promover a Paz Traz Felicidade",
    verse: "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.",
    reference: "Mateus 5:9",
    category: "Paz",
    meditation: "Ser pacificador é mais do que apenas evitar brigas; é ser um agente ativo de reconciliação, perdão e harmonia nos ambientes em que frequentamos. Quando promovemos a paz nas nossas palavras e atitudes, refletimos diretamente o caráter do nosso Pai.",
    prayer: "Senhor, faz-me um canal da tua paz hoje. Onde houver discórdia ou ressentimento, que eu possa levar palavras de perdão e união. Amém."
  },
  {
    id: 30,
    title: "Segurança no Vale Escuro",
    verse: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo.",
    reference: "Salmos 23:4",
    category: "Paz",
    meditation: "O vale escuro é uma realidade temporária na jornada humana, mas a paz permanece porque a presença do Pastor é contínua. Ele não nos abandona no momento de escuridão; Sua vara e Seu cajado nos protegem, guiam e nos dão profundo consolo na alma.",
    prayer: "Senhor, mesmo nos dias difíceis em que tudo parece escuro ao meu redor, confio plenamente que estás comigo e que me guiarás para a luz. Amém."
  },

  // FORÇA (31-40)
  {
    id: 31,
    title: "Força Para os Cansados",
    verse: "Dá força ao cansado, e multiplica as forças ao que não tem nenhum vigor.",
    reference: "Isaías 40:29",
    category: "Força",
    meditation: "Deus não exige que sejamos fortes o tempo todo por nós mesmos. Pelo contrário, Ele se especializa em restaurar os cansados e recarregar as energias daqueles que chegaram ao limite das suas próprias capacidades humanas. Aceite a força divina hoje.",
    prayer: "Pai compassivo, confesso que me sinto cansado e sem forças físicas ou emocionais. Multiplica minhas forças hoje segundo a tua promessa. Amém."
  },
  {
    id: 32,
    title: "Como Águias que Voam Alto",
    verse: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.",
    reference: "Isaías 40:31",
    category: "Força",
    meditation: "A palavra chave aqui é 'esperar'. Esperar em Deus não é uma atitude passiva de preguiça, mas uma postura ativa de confiança inabalável. Aqueles que gastam tempo na presença do Senhor recebem uma renovação diária e conseguem voar acima das crises do mundo.",
    prayer: "Senhor, escolho esperar pacientemente em Ti hoje. Renova minhas forças espirituais e físicas para que eu possa voar alto e caminhar firme. Amém."
  },
  {
    id: 33,
    title: "Tudo Posso em Cristo",
    verse: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13",
    category: "Força",
    meditation: "Muitas vezes usamos esse versículo de forma triunfalista, mas o contexto de Paulo era sobre passar por escassez ou abundância mantendo o contentamento. O fortalecimento de Cristo nos capacita a enfrentar qualquer fase da vida com dignidade, fé e integridade.",
    prayer: "Senhor Jesus, derrama sobre mim a tua capacitação sobrenatural hoje para que eu enfrente com alegria e integridade todo e qualquer desafio. Amém."
  },
  {
    id: 34,
    title: "A Alegria do Senhor é a Nossa Força",
    verse: "Não vos entristeçais, porque a alegria do Senhor é a vossa força.",
    reference: "Neemias 8:10",
    category: "Força",
    meditation: "A tristeza profunda drena nossa energia vital física e emocional. A verdadeira alegria, que provém de saber que somos amados, perdoados e guardados por Deus, atua como um tônico revigorante que nos enche de ânimo novo e força para seguir em frente na jornada.",
    prayer: "Pai Amado, inunda meu ser com a tua alegria celestial hoje. Que esse contentamento divino seja o meu combustível e a minha fortaleza diária. Amém."
  },
  {
    id: 35,
    title: "Sê Forte e Corajoso",
    verse: "Não to mandei eu? Sê forte e corajoso; não temas, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares.",
    reference: "Josué 1:9",
    category: "Força",
    meditation: "Josué tinha a imensa tarefa de liderar uma nação inteira rumo à Terra Prometida. A ordem de Deus foi clara: coragem e força. O motivo da coragem não estava nas habilidades militares de Josué, mas na presença constante do Deus Todo-Poderoso ao seu lado.",
    prayer: "Senhor, assumo hoje o compromisso de ser forte e corajoso. Afasto o medo e avanço rumo às tuas promessas, sabendo que caminhas comigo. Amém."
  },
  {
    id: 36,
    title: "O Senhor é o Meu Escudo",
    verse: "O Senhor é a minha força e o meu escudo; nele confiou o meu coração, e fui socorrido; pelo que o meu coração salta de prazer.",
    reference: "Salmos 28:7",
    category: "Força",
    meditation: "Ter a Deus como força significa que não estamos desamparados nas batalhas diárias. Ter a Ele como escudo significa que somos ativamente protegidos de perigos. O resultado dessa maravilhosa confiança é um coração grato e transbordante de alegria pura.",
    prayer: "Deus Poderoso, Tu és minha fortaleza impenetrável e o meu defensor. Agradeço hoje por teu socorro sempre presente nas horas difíceis. Amém."
  },
  {
    id: 37,
    title: "O Poder Aperfeiçoado na Fraqueza",
    verse: "E disse-me: A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.",
    reference: "2 Coríntios 12:9",
    category: "Força",
    meditation: "Quando achamos que somos autossuficientes, não deixamos espaço para o agir de Deus. Mas quando reconhecemos nossas limitações e fraquezas sinceras, o poder sobrenatural de Deus encontra o canal perfeito para se manifestar com toda glória em nós.",
    prayer: "Senhor Jesus, tua graça me basta por completo. Que o teu poder se manifeste poderosamente através das minhas limitações e fraquezas hoje. Amém."
  },
  {
    id: 38,
    title: "Fortalecidos no Homem Interior",
    verse: "Para que... vos conceda que sejais corroborados com poder pelo seu Espírito no homem interior.",
    reference: "Efésios 3:16",
    category: "Força",
    meditation: "Muitas vezes cuidamos excessivamente do nosso corpo exterior, mas negligenciamos nossa saúde e vigor espiritual. O Espírito Santo deseja fortalecer o nosso 'homem interior' diariamente, dando-nos vigor moral, paz mental e convicção firme de fé.",
    prayer: "Espírito Santo de Deus, sopra vigor e poder sobre a minha alma hoje. Fortalece o meu espírito para que eu resista a todas as tentações e pressões. Amém."
  },
  {
    id: 39,
    title: "O Senhor Dá Força ao Seu Povo",
    verse: "O Senhor dará força ao seu povo; o Senhor abençoará o seu povo com paz.",
    reference: "Salmos 29:11",
    category: "Força",
    meditation: "Deus não é um espectador indiferente à nossa caminhada. Ele derrama força soberana sobre o Seu povo e nos coroa com a Sua paz celestial inabalável. Temos a herança divina do fortalecimento espiritual e da quietude emocional garantida em Sua Palavra.",
    prayer: "Deus de Israel, recebo hoje a tua força sobrenatural e a tua bênção de paz sobre a minha vida, minha casa e todos os meus projetos. Amém."
  },
  {
    id: 40,
    title: "Fortalecei-vos no Senhor",
    verse: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder.",
    reference: "Efésios 6:10",
    category: "Força",
    meditation: "As batalhas espirituais não podem ser travadas com armas humanas. Nossa força deve vir diretamente da nossa união com o Senhor e do revestimento do Seu Espírito. Permaneça conectado à videira verdadeira para receber a energia diária espiritual.",
    prayer: "Senhor Deus, eu me conecto a Ti hoje. Revisto-me da tua força divina e da tua armadura espiritual para vencer todos os ataques do dia. Amém."
  },

  // GRATIDÃO (41-50)
  {
    id: 41,
    title: "Em Tudo Dai Graças",
    verse: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.",
    reference: "1 Tessalonicenses 5:18",
    category: "Gratidão",
    meditation: "Dar graças em tudo não significa agradecer pelo mal em si, mas sim manter uma atitude de gratidão a Deus *apesar* das circunstâncias ruins. É saber que Ele é soberano e pode transformar qualquer situação adversa em bênção e crescimento espiritual.",
    prayer: "Deus soberano, mesmo diante dos desafios de hoje, escolho te dar graças porque sei que estás no controle de cada detalhe da minha vida. Amém."
  },
  {
    id: 42,
    title: "Bendize, ó Minha Alma, ao Senhor",
    verse: "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.",
    reference: "Salmos 103:2",
    category: "Gratidão",
    meditation: "A nossa mente tem uma tendência natural a se esquecer das bênçãos recebidas e focar apenas nas queixas atuais. Faça um esforço consciente hoje para listar as orações respondidas, os livramentos invisíveis e o sustento diário que Deus tem te dado.",
    prayer: "Minha alma bendiz ao Senhor hoje! Obrigado por tua fidelidade diária, pelo pão na mesa, pela saúde e por tantos livramentos concedidos. Amém."
  },
  {
    id: 43,
    title: "Entrando com Ações de Graças",
    verse: "Entrai pelas portas dele com louvor, e em seus átrios com hinos; louvai-o, e bendizei o seu nome.",
    reference: "Salmos 100:4",
    category: "Gratidão",
    meditation: "A nossa oração não deve começar com uma lista de pedidos egoístas, mas com um coração transbordante de gratidão e louvor por quem Deus é. A ação de graças abre as portas da percepção da doce presença do Espírito Santo ao nosso redor.",
    prayer: "Senhor maravilhoso, entro em tua presença louvando o teu santo nome. Tu és bom, fiel e misericordioso de geração em geração. Amém."
  },
  {
    id: 44,
    title: "Transbordando em Ações de Graças",
    verse: "Arraigados e edificados nele, e confirmados na fé, assim como fostes ensinados, crescendo nela com ações de graças.",
    reference: "Colossenses 2:7",
    category: "Gratidão",
    meditation: "Uma fé madura e enraizada em Cristo sempre se expressa através de uma gratidão abundante. Quanto mais conhecemos o amor do Salvador, mais motivos descobrimos para agradecer diariamente, tornando nossa vida mais leve, produtiva e feliz.",
    prayer: "Jesus amado, firma minhas raízes em Ti hoje. Que meu coração transborde em ações de graças genuínas e contínuas por tua obra em minha vida. Amém."
  },
  {
    id: 45,
    title: "A Gratidão Guarda o Coração",
    verse: "E a paz de Deus... guardará os vossos corações... Sejam conhecidas diante de Deus as vossas petições... com ações de graças.",
    reference: "Filipenses 4:6-7",
    category: "Gratidão",
    meditation: "Agradecer antes mesmo de ver a resposta de uma oração é um dos maiores exercícios de fé que existem. Mostra que confiamos no caráter de Deus de forma incondicional, sabendo que Ele responderá de acordo com Sua perfeita vontade.",
    prayer: "Pai Amado, apresento a Ti minhas preocupações hoje, mas também já te agradeço antecipadamente pelo teu agir e pela tua resposta perfeita. Amém."
  },
  {
    id: 46,
    title: "O Senhor é Bom e Fiel",
    verse: "Porque o Senhor é bom, e eterna a sua misericórdia; e a sua fidelidade dura de geração em geração.",
    reference: "Salmos 100:5",
    category: "Gratidão",
    meditation: "Se fôssemos depender do que merecemos, estaríamos perdidos. Mas a nossa gratidão se fundamenta na verdade consoladora de que a misericórdia de Deus é eterna e Sua bondade nunca falha. Sua fidelidade atravessa as gerações da nossa família.",
    prayer: "Senhor, obrigado por tua imensa bondade que me sustenta e por tua misericórdia que se renova sobre a minha vida a cada nova manhã. Amém."
  },
  {
    id: 47,
    title: "Agradecer Pela Salvação Gloriosa",
    verse: "Graças a Deus, pois, pelo seu dom inefável.",
    reference: "2 Coríntios 9:15",
    category: "Gratidão",
    meditation: "O maior motivo de gratidão que um ser humano pode possuir é a salvação e a vida eterna concedidas gratuitamente através de Jesus Cristo. Nenhum problema terreno é capaz de anular a maravilhosa realidade de termos nossos nomes escritos no livro da vida.",
    prayer: "Obrigado, Deus, pelo teu dom indescritível: Jesus Cristo! Agradeço pela redenção, pela vida eterna e pela certeza do meu lar celestial. Amém."
  },
  {
    id: 48,
    title: "A Gratidão Afasta a Murmuração",
    verse: "Fazei todas as coisas sem murmurações nem contendas.",
    reference: "Filipenses 2:14",
    category: "Gratidão",
    meditation: "A reclamação constante adoece a alma e cega nossos olhos para a beleza da provisão diária de Deus. A gratidão é o único antídoto eficaz contra a murmuração. Substitua cada queixa por um agradecimento sincero hoje e veja o ambiente mudar.",
    prayer: "Pai querido, perdoa-me pelas vezes em que murmurei. Decido hoje vigiar minhas palavras e cultivar um coração grato pelas tuas bênçãos. Amém."
  },
  {
    id: 49,
    title: "Dando Graças Pelo Pão Diário",
    verse: "E, tomando os sete pães e os peixes, e dando graças, partiu-os, e deu-os aos seus discípulos.",
    reference: "Mateus 15:36",
    category: "Gratidão",
    meditation: "Jesus nos deu o exemplo de dar graças pelo alimento diário, mesmo quando ele parecia insuficiente para a multidão. Quando agradecemos pelo pouco que temos, Deus honra a nossa gratidão e multiplica a provisão de forma sobrenatural em nossas mãos.",
    prayer: "Obrigado, Senhor, pelo alimento de cada dia na minha mesa e pela provisão que nunca falta na minha casa. Abençoa os necessitados hoje. Amém."
  },
  {
    id: 50,
    title: "Coração Grato no Lar",
    verse: "Seja a paz de Cristo o árbitro em vossos corações... e sede agradecidos.",
    reference: "Colossenses 3:15",
    category: "Gratidão",
    meditation: "Uma atmosfera doméstica saudável é cultivada quando os membros da família são gratos a Deus e expressam gratidão uns aos outros pelas pequenas coisas do dia a dia. Valorize sua família e agradeça a Deus pela vida de cada um hoje.",
    prayer: "Senhor Jesus, abençoa a minha casa e minha família. Que a gratidão seja a marca principal do nosso relacionamento diário e do nosso lar. Amém."
  },

  // SABEDORIA (51-60)
  {
    id: 51,
    title: "Pedindo Sabedoria ao Pai",
    verse: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente.",
    reference: "Tiago 1:5",
    category: "Sabedoria",
    meditation: "A sabedoria divina é diferente do conhecimento intelectual acumulado. É a capacidade espiritual de tomar decisões acertadas de acordo com os princípios eternos de Deus. Se você está enfrentando uma encruzilhada, não hesite em pedir sabedoria em oração.",
    prayer: "Deus Sábio, preciso de direção para as decisões da minha vida hoje. Peço que derrames sobre mim sabedoria espiritual e discernimento claro. Amém."
  },
  {
    id: 52,
    title: "O Princípio da Sabedoria",
    verse: "O temor do Senhor é o princípio da sabedoria, e o conhecimento do Santo, a prudência.",
    reference: "Provérbios 9:10",
    category: "Sabedoria",
    meditation: "O temor do Senhor não significa ter pavor de Deus, mas nutrir um respeito profundo e reverente por Sua santidade, autoridade e Palavra. Esse respeito nos afasta do erro e estabelece a base correta para uma vida sábia e verdadeiramente próspera.",
    prayer: "Senhor, cultiva em meu coração um temor reverente pela tua santidade e pela tua Palavra. Que minhas escolhas glorifiquem o teu santo nome. Amém."
  },
  {
    id: 53,
    title: "Guardando as Palavras de Sabedoria",
    verse: "Filho meu, se aceitares as minhas palavras, e esconderes contigo os meus mandamentos... então entenderás o temor do Senhor.",
    reference: "Provérbios 2:1-5",
    category: "Sabedoria",
    meditation: "A busca pela sabedoria exige dedicação ativa e estudo sincero da Palavra de Deus. Quando valorizamos as Escrituras acima das opiniões humanas passageiras e guardamos Seus conselhos em nosso coração, somos guardados de ciladas e caminhos perigosos.",
    prayer: "Pai Amado, dá-me fome e sede pela tua Palavra hoje. Desejo guardar os teus mandamentos no mais profundo da minha alma para não pecar contra Ti. Amém."
  },
  {
    id: 54,
    title: "A Sabedoria que Vem do Alto",
    verse: "Mas a sabedoria que do alto vem é, primeiramente, pura, depois, pacífica, moderada, tratável, cheia de misericórdia e de bons frutos.",
    reference: "Tiago 3:17",
    category: "Sabedoria",
    meditation: "A sabedoria deste mundo muitas vezes promove o egoísmo e a competição desleal. A sabedoria que vem do céu se manifesta através de um caráter pacífico, moderado, bondoso e repleto de frutos de amor. Avalie suas ações sob este padrão celestial hoje.",
    prayer: "Espírito Santo, inspira-me a agir com a sabedoria que vem do céu hoje: com pureza, paciência, misericórdia e moderação em todas as coisas. Amém."
  },
  {
    id: 55,
    title: "Remindo o Tempo Sabiamente",
    verse: "Portanto, vede prudentemente como andais, não como néscios, mas como sábios, remindo o tempo; porquanto os dias são maus.",
    reference: "Efésios 5:15-16",
    category: "Sabedoria",
    meditation: "O tempo é um dos recursos mais preciosos e escassos que Deus nos confiou. Viver sabiamente significa priorizar as coisas eternas e não desperdiçar nossa energia com distrações fúteis ou conflitos estéreis. Planeje seu dia com sabedoria.",
    prayer: "Senhor, ensina-me a usar o meu tempo de forma inteligente e produtiva hoje. Que eu priorize o que realmente importa para a tua glória. Amém."
  },
  {
    id: 56,
    title: "O Valor Conselheiro da Sabedoria",
    verse: "Melhor é a sabedoria do que a força; ainda que a sabedoria do pobre seja desprezada.",
    reference: "Eclesiastes 9:16",
    category: "Sabedoria",
    meditation: "A força bruta ou a agressividade podem parecer eficazes no início, mas a sabedoria silenciosa e o conselho prudente sempre prevalecem a longo prazo. Prefira agir com calma, bom senso e inteligência em vez de se deixar levar pelo impulso.",
    prayer: "Senhor, afasta de mim as reações impulsivas. Concede-me serenidade e palavras sábias para resolver todos os conflitos que surgirem hoje. Amém."
  },
  {
    id: 57,
    title: "Conselhos que Trazem Vitória",
    verse: "Onde não há conselhos os projetos fracassam, mas com muitos conselheiros eles se estabelecem.",
    reference: "Provérbios 15:22",
    category: "Sabedoria",
    meditation: "O orgulho nos faz acreditar que sabemos tudo e que não precisamos de ninguém. O sábio reconhece suas limitações e busca mentores experientes e amigos fiéis para aconselhar suas decisões importantes antes de dar passos precipitados.",
    prayer: "Deus do conselho, coloca em meu caminho mentores e amigos sábios que possam me orientar com verdade e sabedoria em minhas decisões. Amém."
  },
  {
    id: 58,
    title: "A Sabedoria Edifica a Casa",
    verse: "Com a sabedoria se edifica a casa, e com o entendimento ela se estabelece.",
    reference: "Provérbios 24:3",
    category: "Sabedoria",
    meditation: "Construir uma família sólida e feliz exige mais do que recursos financeiros; exige sabedoria espiritual nas palavras, discernimento nas atitudes diárias e paciência para lidar com as diferenças de temperamento. Deixe que a sabedoria seja a arquiteta do seu lar.",
    prayer: "Senhor Jesus, edifica a minha casa e a minha família com a tua sabedoria. Que a paciência e a harmonia reinem em nossas conversas diárias. Amém."
  },
  {
    id: 59,
    title: "Vigiar as Palavras Proferidas",
    verse: "O que guarda a sua boca e a sua língua guarda a sua alma das angústias.",
    reference: "Provérbios 21:23",
    category: "Sabedoria",
    meditation: "Muitas das dores de cabeça e arrependimentos que temos na vida provêm de coisas que dissemos sem pensar no calor do momento. A sabedoria nos ensina a pensar antes de falar, escolhendo palavras que edifiquem em vez de ferir.",
    prayer: "Senhor, põe uma guarda na minha boca hoje. Que minhas palavras sejam sempre temperadas com graça, verdade, respeito e amor pelo próximo. Amém."
  },
  {
    id: 60,
    title: "Contando Nossos Dias",
    verse: "Ensina-nos a contar os nossos dias, de tal maneira que alcancemos corações sábios.",
    reference: "Salmos 90:12",
    category: "Sabedoria",
    meditation: "A nossa vida terrena é breve e passa rapidamente como um sopro. Ter a consciência de que nossa existência aqui é temporária nos motiva a focar no que realmente possui valor eterno e a buscar intimidade diária com o nosso Criador e Salvador.",
    prayer: "Senhor Deus, ajuda-me a compreender a brevidade da vida para que eu invista meu tempo, amor e recursos nas coisas que duram para sempre. Amém."
  },

  // ANSIEDADE (61-70)
  {
    id: 61,
    title: "Entregando Suas Preocupações",
    verse: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
    reference: "1 Pedro 5:7",
    category: "Ansiedade",
    meditation: "A ansiedade é um fardo pesado demais para os ombros humanos carregarem sozinhos. O convite do apóstolo Pedro é para transferir ativamente esse peso para Deus. Ele não é indiferente; Ele tem um cuidado minucioso e diário com cada área da sua vida.",
    prayer: "Pai Amado, entrego em tuas mãos todas as minhas ansiedades e medos em relação ao meu futuro. Escolho confiar no teu cuidado infinito por mim. Amém."
  },
  {
    id: 62,
    title: "Buscando Primeiro o Reino",
    verse: "Mas, buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.",
    reference: "Mateus 6:33",
    category: "Ansiedade",
    meditation: "A ansiedade nos faz focar obsessivamente nas nossas necessidades de provisão diária (comida, roupas, dinheiro). Jesus nos convida a reajustar o foco: buscar o Seu Reino em primeiro lugar. Ele promete cuidar das nossas necessidades secundárias pessoalmente.",
    prayer: "Senhor, reajusto minhas prioridades hoje. Busco primeiro a tua presença e a tua justiça, descansando na promessa de que Tu suprirás minhas necessidades. Amém."
  },
  {
    id: 63,
    title: "O Amanhã Pertence a Deus",
    verse: "Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal.",
    reference: "Mateus 6:34",
    category: "Ansiedade",
    meditation: "Viver no futuro é o combustível da ansiedade. Deus nos concede a graça necessária para enfrentar um dia de cada vez, não o ano inteiro de uma só vez. Traga seus pensamentos de volta para o presente e execute as tarefas de hoje com paz.",
    prayer: "Jesus, perdoa-me por tentar adiantar os problemas de amanhã. Ajuda-me a viver o hoje com fidelidade e a descansar sabendo que amanhã estarás lá. Amém."
  },
  {
    id: 64,
    title: "Não Andeis Ansiosos",
    verse: "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica.",
    reference: "Filipenses 4:6",
    category: "Ansiedade",
    meditation: "A ordem bíblica de 'não andar ansioso' parece difícil, mas ela vem acompanhada de um método prático: a oração fervorosa acompanhada de gratidão. Sempre que a preocupação bater à porta, converta-a imediatamente em uma petição fervorosa a Deus.",
    prayer: "Senhor, em vez de me desesperar com as dificuldades de hoje, escolho orar e te entregar cada detalhe em total gratidão. Guarda o meu coração. Amém."
  },
  {
    id: 65,
    title: "O Senhor Sustenta o Teu Fardo",
    verse: "Entrega o teu caminho ao Senhor, confia nele, e o mais ele fará.",
    reference: "Salmos 37:5",
    category: "Ansiedade",
    meditation: "A palavra 'entrega' no original tem a ideia de rolar um fardo pesado das suas costas para as costas de outra pessoa mais forte. Quando você entrega verdadeiramente o seu caminho a Deus e confia em Seu amor, Ele se encarrega de agir em seu favor.",
    prayer: "Deus eterno, rolo para cima de Ti todos os meus problemas, decisões difíceis e fardos. Confio inteiramente no teu poder para agir por mim. Amém."
  },
  {
    id: 66,
    title: "A Paz Diante das Tempestades",
    verse: "E ele, despertando, repreendeu o vento, e disse ao mar: Cala-te, aquieta-te. E o vento se aquietou, e houve grande bonança.",
    reference: "Marcos 4:39",
    category: "Ansiedade",
    meditation: "Jesus estava dormindo tranquilamente no barco durante uma violenta tempestade porque confiava plenamente no Pai. Quando os discípulos o acordaram desesperados, Ele mostrou que Sua voz é soberana sobre as forças da natureza e as tempestades da nossa alma.",
    prayer: "Jesus amado, entra na tempestade dos meus pensamentos hoje e diz: 'Cala-te, aquieta-te'. Restaura a grande bonança no meu coração cansado. Amém."
  },
  {
    id: 67,
    title: "Deus Sabe do Que Precisamos",
    verse: "Pois vosso Pai celestial sabe que necessitais de todas estas coisas.",
    reference: "Mateus 6:32",
    category: "Ansiedade",
    meditation: "Deus não é um Pai distante que ignora as nossas lutas ou necessidades de sobrevivência financeira e física. Ele conhece cada detalhe do que você precisa hoje. Essa certeza deve acalmar nossos corações agitados pelas pressões da vida diária.",
    prayer: "Obrigado, Pai Celestial, porque me conheces profundamente e já sabes de todas as minhas necessidades de hoje. Descanso na tua provisão amorosa. Amém."
  },
  {
    id: 68,
    title: "Como Criança Desmamada no Colo da Mãe",
    verse: "Pelo contrário, fiz calar e sossegar a minha alma; como a criança desmamada nos braços de sua mãe.",
    reference: "Salmos 131:2",
    category: "Ansiedade",
    meditation: "Uma criança desmamada não busca a mãe apenas pelo alimento físico imediato, mas pelo simples prazer de estar em seus braços quentes e seguros. Busque a presença de Deus hoje não apenas pelo que Ele pode dar, mas pelo valor imenso de estar perto Dele.",
    prayer: "Senhor, acalma e sossega a minha alma agitada hoje. Desejo desfrutar do aconchego e da segurança da tua doce e reconfortante presença. Amém."
  },
  {
    id: 69,
    title: "O Senhor é o Meu Ajudador",
    verse: "De maneira que com confiança ousemos dizer: O Senhor é o meu ajudador, e não temerei o que me possa fazer o homem.",
    reference: "Hebreus 13:6",
    category: "Ansiedade",
    meditation: "A ansiedade em relação à rejeição humana ou às ameaças dos outros perde a força quando declaramos com fé que o próprio Deus Todo-Poderoso é a nossa ajuda ativa e protetor pessoal. Se Deus é por nós, quem poderá prevalecer contra nossa caminhada?",
    prayer: "Senhor, Tu és o meu ajudador e escudo fiel. Não temerei as más notícias, as opiniões alheias ou o futuro, pois sei que estás comigo. Amém."
  },
  {
    id: 70,
    title: "A Palavra de Ânimo Cura a Alma",
    verse: "A ansiedade no coração deixa o homem abatido, mas uma boa palavra o alegra.",
    reference: "Provérbios 12:25",
    category: "Ansiedade",
    meditation: "A ansiedade prolongada deprime o ânimo físico e emocional. Uma das melhores formas de vencer o abatimento é meditar nas boas palavras de encorajamento da Bíblia e ser também aquele que leva uma palavra de consolo e ânimo para quem está sofrendo.",
    prayer: "Pai Amado, que as boas promessas da tua Palavra alegrem o meu coração hoje. Usa-me também para levar ânimo novo a alguém que está cansado. Amém."
  },

  // ESPERANÇA (71-80)
  {
    id: 71,
    title: "O Deus da Esperança",
    verse: "O Deus da esperança vos encha de todo o gozo e paz no vosso crer, para que abundeis em esperança pelo poder do Espírito Santo.",
    reference: "Romanos 15:13",
    category: "Esperança",
    meditation: "Nossa esperança não é um otimismo humano artificial ou ilusório; ela é uma força viva gerada diretamente pelo Espírito Santo dentro de nós. Quando confiamos em Deus, Ele nos preenche com uma alegria e paz profundas que nos sustentam em dias difíceis.",
    prayer: "Deus da esperança, inunda o meu coração com alegria e paz no meu crer diário. Que eu transborde de esperança pelo poder do teu Espírito hoje. Amém."
  },
  {
    id: 72,
    title: "Pensamentos de Paz e Futuro",
    verse: "Porque eu bem sei os pensamentos que tenho sobre vós, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    reference: "Jeremias 29:11",
    category: "Esperança",
    meditation: "Essas palavras foram ditas ao povo de Israel durante o exílio na Babilônia, um momento de extrema dor e incerteza. Deus assegurou a eles que, apesar da crise atual, Ele possuía um plano soberano de restauração, paz e um futuro brilhante pela frente.",
    prayer: "Pai querido, obrigado porque os teus planos para a minha vida são planos de paz, restauração e futuro. Descanso no teu agir bondoso. Amém."
  },
  {
    id: 73,
    title: "A Âncora Segura da Alma",
    verse: "A qual temos como âncora da alma, segura e firme, e que penetra até ao interior do véu.",
    reference: "Hebreus 6:19",
    category: "Esperança",
    meditation: "Um navio precisa de uma âncora firme para não ser arrastado pelas tempestades marinhas. A nossa esperança baseada na promessa e no sacrifício de Jesus atua como a âncora da nossa alma, mantendo-nos firmes, seguros e inabaláveis em meio às crises.",
    prayer: "Jesus, Tu és a âncora inabalável da minha alma. Que a minha esperança em Ti me mantenha firme e sereno diante de qualquer tempestade da vida. Amém."
  },
  {
    id: 74,
    title: "Esperando Contra a Esperança",
    verse: "O qual, em esperança, creu contra a esperança, para que se tornasse pai de muitas nações.",
    reference: "Romanos 4:18",
    category: "Esperança",
    meditation: "Abraão creu na promessa de Deus mesmo quando sua idade avançada e a esterilidade de Sara diziam que era humanamente impossível. A esperança cristã brilha mais forte quando as possibilidades humanas chegam ao fim, pois ela confia no Deus dos milagres.",
    prayer: "Deus do impossível, ajuda-me a crer nas tuas promessas mesmo quando as circunstâncias externas disserem o contrário. Confio no teu poder. Amém."
  },
  {
    id: 75,
    title: "O Choro Pode Durar Uma Noite",
    verse: "O choro pode durar uma noite, mas a alegria vem pela manhã.",
    reference: "Salmos 30:5",
    category: "Esperança",
    meditation: "As noites de dor e lágrimas são inevitáveis na jornada humana, mas elas possuem um limite de tempo determinado por Deus. A escuridão não vai durar para sempre; o sol da justiça de Deus vai nascer novamente e trazer alegria de volta ao seu coração.",
    prayer: "Senhor, console o meu coração nas noites de choro e dor. Renova a minha esperança na promessa de que a alegria virá com a nova manhã. Amém."
  },
  {
    id: 76,
    title: "Aqueles que Esperam Não Serão Confundidos",
    verse: "E saberás que eu sou o Senhor, que os que esperam em mim não serão confundidos.",
    reference: "Isaías 49:23",
    category: "Esperança",
    meditation: "Colocar nossa esperança em pessoas ou em riquezas materiais muitas vezes nos leva à frustração e decepção. Mas colocar nossa esperança e confiança no caráter imutável de Deus é a única garantia de que nunca seremos envergonhados ou confundidos.",
    prayer: "Senhor Deus, deposito toda a minha confiança e expectativa em Ti. Sei que a minha esperança não será frustrada porque Tu és fiel. Amém."
  },
  {
    id: 77,
    title: "Espera no Senhor e Sê Forte",
    verse: "Espera no Senhor, anima-te, e ele fortalecerá o teu coração; espera, pois, no Senhor.",
    reference: "Salmos 27:14",
    category: "Esperança",
    meditation: "Esperar em Deus exige coragem ativa e ânimo interior. Quando decidimos esperar pelo tempo perfeito Dele em vez de agirmos por impulsividade humana, o Senhor injeta força sobrenatural em nosso coração para perseverarmos com dignidade.",
    prayer: "Senhor Jesus, ajuda-me a saber esperar o teu tempo ideal para cada coisa. Fortalece o meu coração enquanto aguardo as tuas respostas. Amém."
  },
  {
    id: 78,
    title: "A Esperança Não Nos Decepciona",
    verse: "E a esperança não traz confusão, porquanto o amor de Deus está derramado em nossos corações pelo Espírito Santo.",
    reference: "Romanos 5:5",
    category: "Esperança",
    meditation: "A nossa esperança não falha porque ela está enraizada no amor infinito de Deus que nos foi revelado e derramado em nossas almas pelo Espírito Santo. Esse amor nos dá a certeza absoluta de que Deus está cuidando do nosso futuro de forma perfeita.",
    prayer: "Obrigado, Deus, pelo teu amor derramado em meu coração pelo teu Espírito Santo. Sinto-me seguro de que meu futuro está seguro em Ti. Amém."
  },
  {
    id: 79,
    title: "Espero na Tua Palavra",
    verse: "A minha alma anseia pelo Senhor, mais do que os guardas pela manhã... Eu espero na sua palavra.",
    reference: "Salmos 130:5-6",
    category: "Esperança",
    meditation: "Os guardas noturnos esperam com certeza a chegada da luz do amanhecer porque sabem que o sol sempre nasce. Com essa mesma certeza absoluta devemos aguardar o agir de Deus em nossas vidas, ancorados fielmente nas promessas inerrantes da Sua Palavra.",
    prayer: "Senhor, minha alma anseia por Ti e pela tua intervenção em minha vida. Espero com total certeza nas promessas infalíveis da tua Palavra. Amém."
  },
  {
    id: 80,
    title: "Esperança Além desta Vida",
    verse: "Se esperamos em Cristo só nesta vida, somos os mais miseráveis de todos os homens.",
    reference: "1 Coríntios 15:19",
    category: "Esperança",
    meditation: "A nossa esperança como cristãos não se limita a receber bênçãos ou resoluções de problemas terrenos imediatos. A nossa maior e mais gloriosa esperança está na eternidade, na ressurreição e no dia em que viveremos para sempre com o Senhor.",
    prayer: "Senhor Jesus, eleva o meu olhar para as realidades eternas da minha salvação. Obrigado porque a minha maior esperança está em Ti para sempre. Amém."
  },

  // ORAÇÃO (81-90)
  {
    id: 81,
    title: "Clama a Mim e Responder-te-ei",
    verse: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.",
    reference: "Jeremias 33:3",
    category: "Oração",
    meditation: "Deus faz um convite direto e ousado para conversarmos com Ele de forma sincera e intensa. A oração sincera não é um monólogo vazio, mas uma chave espiritual que abre as portas do céu para revelações e milagres que transcendem nossa compreensão humana.",
    prayer: "Senhor Deus, eu clamo a Ti hoje. Abre os meus olhos espirituais e revela-me os teus caminhos excelentes e os teus propósitos maravilhosos. Amém."
  },
  {
    id: 82,
    title: "O Poder da Oração Sincera",
    verse: "A oração feita por um justo pode muito em seus efeitos.",
    reference: "Tiago 5:16",
    category: "Oração",
    meditation: "A oração de uma pessoa que busca viver em retidão e comunhão sincera com Deus possui um poder tremendo diante do trono do Pai. Ela cura enfermos, desfaz jugos e transforma realidades inteiras porque Deus ouve com alegria a voz dos Seus filhos fiéis.",
    prayer: "Pai Amado, purifica o meu coração hoje. Que a minha oração seja sincera, cheia de fé e eficaz para edificar vidas e trazer o teu mover à terra. Amém."
  },
  {
    id: 83,
    title: "A Oração do Pai Nosso",
    verse: "Portanto, vós orareis assim: Pai nosso, que estás nos céus, santificado seja o teu nome.",
    reference: "Mateus 6:9",
    category: "Oração",
    meditation: "Jesus nos ensinou a base correta da oração: o relacionamento de filhos íntimos com o 'Pai'. A oração deve buscar primeiro a santificação do Seu nome e a implantação do Seu Reino, para depois apresentar nossas necessidades diárias de pão, perdão e proteção.",
    prayer: "Pai nosso que estás nos céus, que a tua perfeita vontade seja feita na minha vida hoje assim como ela é feita perfeitamente no céu. Amém."
  },
  {
    id: 84,
    title: "Orando em Todo o Tempo",
    verse: "Orai sem cessar.",
    reference: "1 Tessalonicenses 5:17",
    category: "Oração",
    meditation: "Orar sem cessar não significa ficar de joelhos o dia inteiro sem trabalhar, mas sim cultivar uma atmosfera contínua de diálogo e intimidade com Deus em todas as tarefas da nossa rotina — conversando com o Espírito Santo no trânsito, no trabalho e no lar.",
    prayer: "Espírito Santo, ensina-me a manter o meu coração conectado em Ti durante todo o dia de hoje, em cada conversa, decisão e pensamento. Amém."
  },
  {
    id: 85,
    title: "Vigilância na Oração",
    verse: "Vigiai e orai, para que não entreis em tentação; na verdade, o espírito está pronto, mas a carne é fraca.",
    reference: "Mateus 26:41",
    category: "Oração",
    meditation: "A nossa natureza humana é frágil e propensa a falhar diante das tentações diárias. A oração vigilante atua como uma sentinela espiritual que fortalece nossa mente e nosso espírito, blindando-nos contra as ciladas do pecado e do desânimo moral.",
    prayer: "Senhor, ajuda-me a vigiar minhas atitudes e a orar constantemente. Fortalece o meu espírito para que eu vença todas as tentações de hoje. Amém."
  },
  {
    id: 86,
    title: "Pedi e Dar-se-vos-á",
    verse: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.",
    reference: "Mateus 7:7",
    category: "Oração",
    meditation: "Jesus nos incentiva à perseverança e à persistência em nossa vida de oração através de três ações dinâmicas: pedir com fé, buscar com determinação e bater com insistência. Deus tem prazer em responder à persistência sincera de Seus filhos.",
    prayer: "Deus generoso, eu peço, busco e bato diante da tua porta hoje, sabendo que és um Pai amoroso que tem o melhor preparado para dar a mim. Amém."
  },
  {
    id: 87,
    title: "Orando de Acordo com a Vontade Dele",
    verse: "E esta é a confiança que temos nele, que, se pedirmos alguma coisa, segundo a sua vontade, ele nos ouve.",
    reference: "1 João 5:14",
    category: "Oração",
    meditation: "A oração eficaz não busca manipular a vontade de Deus para satisfazer nossos caprichos egoístas, mas sim alinhar os nossos desejos ao Seu plano soberano e perfeito. Quando oramos alinhados à Palavra de Deus, temos a certeza da resposta favorável.",
    prayer: "Pai Amado, alinha os desejos do meu coração à tua perfeita e boa vontade. Que minhas orações reflitam sempre os teus princípios eternos. Amém."
  },
  {
    id: 88,
    title: "A Oração Que Humilha e Cura",
    verse: "E se o meu povo, que se chama pelo meu nome, se humilhar, e orar, e buscar a minha face... então eu ouvirei dos céus, perdoarei os seus pecados e sararei a sua terra.",
    reference: "2 Crônicas 7:14",
    category: "Oração",
    meditation: "A cura de uma família, de uma igreja ou de uma nação inteira começa com a postura humilde e de arrependimento sincero do povo de Deus em oração. Quando buscamos a face do Senhor de todo o coração, Ele se inclina dos céus para derramar perdão e cura.",
    prayer: "Senhor Deus, eu me humilho na tua presença hoje. Perdoa os meus pecados e cura o meu lar, a minha família e a nossa nação com o teu poder. Amém."
  },
  {
    id: 89,
    title: "O Espírito Intercede por Nós",
    verse: "E da mesma maneira também o Espírito ajuda as nossas fraquezas; porque não sabemos o que havemos de pedir como convém, mas o mesmo Espírito intercede por nós.",
    reference: "Romanos 8:26",
    category: "Oração",
    meditation: "Muitas vezes a dor ou o cansaço são tão intensos que não conseguimos formular palavras para orar de forma adequada. Nesses momentos difíceis, o Espírito Santo traduz os gemidos da nossa alma abatida e intercede perfeitamente por nós diante de Deus.",
    prayer: "Espírito Santo, obrigado por compreenderes minhas dores e fraquezas. Intercede por mim hoje e traduz minhas orações diante do trono do Pai. Amém."
  },
  {
    id: 90,
    title: "Aproximando-se com Confiança",
    verse: "Cheguemos, pois, com confiança ao trono da graça, para que possamos alcançar misericórdia e achar graça, a fim de sermos ajudados em tempo oportuno.",
    reference: "Hebreus 4:16",
    category: "Oração",
    meditation: "Por causa do sangue vertido por Jesus na cruz, não precisamos nos aproximar de Deus com medo ou culpa de escravos. Temos livre acesso ao 'trono da graça' como filhos amados, prontos para receber o socorro, a misericórdia e o acolhimento oportuno.",
    prayer: "Jesus, meu Salvador, obrigado por me dar livre acesso ao trono da graça. Aproximo-me hoje buscando tua misericórdia e o teu auxílio diário. Amém."
  },

  // PROPÓSITO & PROTEÇÃO (91-105)
  {
    id: 91,
    title: "Todas as Coisas Cooperam para o Bem",
    verse: "E sabemos que todas as coisas cooperam juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
    reference: "Romanos 8:28",
    category: "Propósito",
    meditation: "Deus é o mestre tecelão da nossa história. Ele pega as linhas brilhantes de nossas vitórias e as linhas escuras de nossos sofrimentos e as entrelaça em um design magnífico para cumprir o Seu propósito eterno em nós: moldar-nos à imagem de Cristo.",
    prayer: "Senhor, confio que mesmo os momentos dolorosos ou incompreensíveis de hoje cooperarão para o meu amadurecimento e para o teu propósito em mim. Amém."
  },
  {
    id: 92,
    title: "Eu Sei Que o Meu Redentor Vive",
    verse: "Porque eu sei que o meu Redentor vive, e que por fim se levantará sobre a terra.",
    reference: "Jó 19:25",
    category: "Propósito",
    meditation: "Mesmo tendo perdido seus filhos, riquezas e saúde física, Jó manteve viva a sua maior certeza espiritual: a existência de um Deus vivo e redentor que traria justiça final sobre sua história. Essa mesma verdade vitoriosa sustenta nossa caminhada hoje.",
    prayer: "Senhor, eu sei que estás vivo e que cuidas de mim em meio a qualquer perda ou sofrimento terreno. Minha redenção final está segura em Ti. Amém."
  },
  {
    id: 93,
    title: "Aquele Que Começou a Boa Obra",
    verse: "Tendo por certo isto mesmo, que aquele que em vós começou a boa obra a aperfeiçoará até ao dia de Jesus Cristo.",
    reference: "Filipenses 1:6",
    category: "Propósito",
    meditation: "Deus nunca deixa Seus projetos inacabados ou pela metade. Ele iniciou a obra de transformação na sua vida através do novo nascimento espiritual, e Ele mesmo é quem vai garantir o aperfeiçoamento contínuo do seu caráter até o dia da glória eterna.",
    prayer: "Jesus maravilhoso, continua a esculpir o meu caráter hoje. Conclui em mim a tua boa obra para que eu reflita cada vez mais o teu amor. Amém."
  },
  {
    id: 94,
    title: "Criados Para Boas Obras",
    verse: "Porque somos feitura sua, criados em Cristo Jesus para as boas obras, as quais Deus preparou para que andássemos nelas.",
    reference: "Efésios 2:10",
    category: "Propósito",
    meditation: "Você não é fruto do acaso ou de um acidente biológico; você é uma obra de arte planejada e executada de forma excelente pelas mãos do Criador do universo. Deus já preparou um roteiro de boas obras e serviço para você trilhar com amor hoje.",
    prayer: "Criador do universo, obrigado por me planejar com tanto amor e propósito. Ajuda-me a trilhar hoje as boas obras que preparaste para mim. Amém."
  },
  {
    id: 95,
    title: "A Provisão do Altíssimo",
    verse: "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.",
    reference: "Salmos 91:11",
    category: "Proteção",
    meditation: "Deus estabelece um sistema ativo e poderoso de proteção angelical invisível ao redor daqueles que amam e confiam no Seu nome. Você está guardado ao ir para o trabalho, ao voltar para casa e em cada passo da sua jornada debaixo da ordem divina.",
    prayer: "Obrigado, Pai querido, por enviar os teus santos anjos para me guardarem e protegerem a mim e à minha família de todos os perigos visíveis e invisíveis. Amém."
  },
  {
    id: 96,
    title: "O Senhor te Guardará de Todo o Mal",
    verse: "O Senhor guardará a tua entrada e a tua saída, desde agora e para sempre.",
    reference: "Salmos 121:8",
    category: "Proteção",
    meditation: "Esse salmo nos lembra que nossa segurança real não provém de muros altos ou exércitos humanos, mas Daquele que fez o céu e a terra e que nunca cochila ou dorme. Ele vigia nossos caminhos e nos garante proteção eterna e incondicional.",
    prayer: "Deus eterno, vigia a minha saída de casa hoje e abençoa o meu retorno seguro no fim do dia. Minha segurança total está depositada em Ti. Amém."
  },
  {
    id: 97,
    title: "O Escudo da Minha Salvação",
    verse: "Tu me deste também o escudo da tua salvação; a tua mão direita me susteve, e a tua mansidão me engrandeceu.",
    reference: "Salmos 18:35",
    category: "Proteção",
    meditation: "Davi conhecia bem as batalhas físicas da guerra, mas reconhecia que seu verdadeiro sustento vinha da mão direita vitoriosa do Senhor. Deus nos sustenta nas lutas espirituais e mentais cotidianas com paciência, amor e graça incomparáveis.",
    prayer: "Senhor, obrigado por me sustentares com a tua mão direita vitoriosa em todas as lutas. Tua mansidão e bondade me transformam hoje. Amém."
  },
  {
    id: 98,
    title: "Nenhuma Arma Prevalecerá",
    verse: "Toda a ferramenta preparada contra ti não prosperará; e toda a língua que se levantar contra ti em juízo tu a condenarás.",
    reference: "Isaías 54:17",
    category: "Proteção",
    meditation: "Esta promessa gloriosa nos dá a garantia de que as conspirações invisíveis, invejas, mentiras ou calúnias que tentarem se levantar para atrapalhar nossa história de fé perderão a força e fracassarão por completo debaixo da justiça soberana de Deus.",
    prayer: "Senhor Altíssimo, defende a minha vida, a minha carreira e o meu lar de toda inveja, malícia ou injustiça. Tua justiça é o meu escudo protetor. Amém."
  },
  {
    id: 99,
    title: "O Selo Protetor do Espírito",
    verse: "Em quem também vós, tendo ouvido a palavra da verdade... fostes selados com o Espírito Santo da promessa.",
    reference: "Efésios 1:13",
    category: "Proteção",
    meditation: "O selo antigamente indicava propriedade e proteção absoluta do rei sobre um objeto. Nós fomos selados espiritualmente com o Espírito Santo de Deus. Pertencemos ao Rei dos reis e nenhuma força das trevas tem autorização para violar essa maravilhosa propriedade divina.",
    prayer: "Espírito Santo de Deus, obrigado pelo privilégio de ser selado e pertencer para sempre ao meu Pai Celestial. Sinto-me plenamente seguro e guardado. Amém."
  },
  {
    id: 100,
    title: "O Senhor é o Meu Refúgio",
    verse: "Porque tu, ó Senhor, és o meu refúgio! O Altíssimo fizeste a tua habitação. Nenhum mal te sucederá, nem praga alguma chegará à tua tenda.",
    reference: "Salmos 91:9-10",
    category: "Proteção",
    meditation: "Fazer de Deus a nossa habitação diária significa gastar tempo em oração e viver debaixo dos Seus princípios. Quando nossa vida está oculta em Cristo com Deus, as flechas da destruição perdem o alvo e nossa tenda é resguardada sob a benção do céu.",
    prayer: "Deus Onipotente, faço de Ti a minha habitação segura hoje. Declaro que o mal e as pragas da destruição não têm autoridade para tocar no meu lar. Amém."
  },
  {
    id: 101,
    title: "O Propósito Inabalável",
    verse: "Bem sei eu que tudo podes, e que nenhum dos teus pensamentos pode ser impedido.",
    reference: "Jó 42:2",
    category: "Propósito",
    meditation: "Depois de passar por um longo processo de lutas, Jó reconheceu a soberania inigualável e indomável de Deus. Quando Deus determina realizar algo na vida de um de Seus servos, não há circunstância terrena ou poder infernal que possa barrar o Seu agir.",
    prayer: "Senhor Soberano, eu me submeto aos teus pensamentos e planos inabaláveis para mim hoje. Cumpra em minha história toda a tua perfeita vontade. Amém."
  },
  {
    id: 102,
    title: "Um Futuro Cheio de Esperança",
    verse: "Porque há esperança para a árvore que, se for cortada, ainda se renovará, e não cessarão os seus renovos.",
    reference: "Jó 14:7",
    category: "Esperança",
    meditation: "Mesmo que você sinta que foi cortado pelas circunstâncias difíceis ou que perdeu suas folhas, saiba que no seu espírito há uma raiz viva alimentada pela Palavra de Deus. Ao cheiro das águas do mover do Espírito Santo, você vai brotar e florescer novamente.",
    prayer: "Espírito Santo de Deus, derrama a tua chuva de refrigério sobre as minhas raízes hoje. Faça-me brotar, florescer e dar frutos abundantes novamente. Amém."
  },
  {
    id: 103,
    title: "A Segurança da Ovelha",
    verse: "As minhas ovelhas ouvem a minha voz, e eu conheço-as, e elas me seguem... e ninguém as arrebatará da minha mão.",
    reference: "João 10:27-28",
    category: "Proteção",
    meditation: "A nossa segurança eterna não depende da nossa própria capacidade de se segurar em Deus, mas da força inigualável da mão do Bom Pastor que nos segura com firmeza inabalável. Escute a Sua voz suave hoje através das Escrituras e siga Seus passos.",
    prayer: "Jesus, meu Bom Pastor, obrigado por me segurar firme em tuas mãos protetoras de onde ninguém pode me arrebatar. Escolho te ouvir e seguir. Amém."
  },
  {
    id: 104,
    title: "Deus Combaterá Por Vós",
    verse: "O Senhor pelejará por vós, e vós vos calareis.",
    reference: "Êxodo 14:14",
    category: "Proteção",
    meditation: "Diante do Mar Vermelho e com o exército de Faraó se aproximando, o povo de Israel entrou em desespero. A instrução divina foi clara: aquietar o coração. Muitas vezes nossa melhor atitude diante das lutas é silenciar, descansar e permitir que Deus guerree por nós.",
    prayer: "Senhor, acalmo o meu coração diante das batalhas de hoje. Escolho silenciar e confiar que Tu mesmo pelejarás por mim e me darás vitória. Amém."
  },
  {
    id: 105,
    title: "O Propósito das Nossas Vidas",
    verse: "O Senhor cumprirá o seu propósito para comigo; a tua misericórdia, ó Senhor, dura para sempre.",
    reference: "Salmos 138:8",
    category: "Propósito",
    meditation: "Podemos respirar aliviados hoje sabendo que a responsabilidade final de cumprir o plano de Deus para nossas vidas repousa na fidelidade e no poder do próprio Senhor. A Sua misericórdia inesgotável garante que Ele não abandonará o trabalho de Suas mãos.",
    prayer: "Deus eterno, obrigado por teu compromisso amoroso em cumprir o teu propósito em mim. Entrego-me inteiramente em tuas mãos criadoras e fiéis. Amém."
  }
];
