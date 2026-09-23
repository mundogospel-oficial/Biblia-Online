export interface MapLocation {
  id: string;
  name: string;
  modernName?: string;
  lat: number;
  lng: number;
  x?: number; // legacy percentage
  y?: number; // legacy percentage
  era: 'patriarcas' | 'exodo' | 'reinos' | 'jesus' | 'paulo' | 'apocalipse';
  summary: string;
  historicalNote: string;
  keyVerse: string;
  reference: string;
  bookAbbrev: string;
  chapter: number;
  verseNum?: number;
}

export interface BiblicalMapTheme {
  id: string;
  title: string;
  subtitle: string;
  era: string;
  region: string;
  description: string;
  period: string;
  center: [number, number]; // [lat, lng]
  defaultZoom: number;
  locations: MapLocation[];
  routeCoordinates?: [number, number][]; // [[lat, lng], ...]
}

export const biblicalMaps: BiblicalMapTheme[] = [
  {
    id: "viagens-paulo",
    title: "As Viagens Missionárias de Paulo",
    subtitle: "A expansão do Evangelho pelo Império Romano e Mediterrâneo",
    era: "paulo",
    region: "Mar Mediterrâneo (Grécia, Turquia, Itália, Israel)",
    period: "Aprox. 46 d.C. – 62 d.C.",
    center: [38.2, 24.5],
    defaultZoom: 5,
    description: "Acompanhe as grandiosas jornadas missionárias do apóstolo Paulo desde Antioquia e Jerusalém até Atenas, Corinto, Éfeso e seu testemunho final em Roma.",
    routeCoordinates: [
      [31.7683, 35.2137], // Jerusalém
      [32.5000, 34.8917], // Cesareia
      [36.2021, 36.1606], // Antioquia
      [36.9167, 34.8958], // Tarso
      [34.7754, 32.4245], // Pafos
      [37.9489, 27.3678], // Éfeso
      [39.7567, 26.1633], // Trôade
      [41.0125, 24.2831], // Filipos
      [40.6401, 22.9444], // Tessalônica
      [40.5238, 22.2036], // Bereia
      [37.9715, 23.7257], // Atenas
      [37.9056, 22.8797], // Corinto
      [37.5303, 27.2764], // Mileto
      [34.9333, 24.8000], // Creta
      [35.9375, 14.3754], // Malta
      [37.0755, 15.2866], // Siracusa
      [41.9028, 12.4964]  // Roma
    ],
    locations: [
      {
        id: "loc-jerusalem",
        name: "Jerusalém",
        modernName: "Jerusalém, Israel",
        lat: 31.7683,
        lng: 35.2137,
        era: "paulo",
        summary: "Berço da Igreja Primitiva e local do Concílio de Jerusalém.",
        historicalNote: "Paulo visitou Jerusalém após sua conversão e lá participou do histórico concílio (Atos 15) que confirmou a salvação pela graça aos gentios sem jugo da lei cerimonial.",
        keyVerse: "Então pareceu bem aos apóstolos e aos anciãos, com toda a igreja, eleger homens dentre eles e enviá-los com Paulo e Barnabé a Antioquia.",
        reference: "Atos 15:22",
        bookAbbrev: "at",
        chapter: 15,
        verseNum: 22
      },
      {
        id: "loc-cesareia",
        name: "Cesareia Marítima",
        modernName: "Cesareia, Israel",
        lat: 32.5000,
        lng: 34.8917,
        era: "paulo",
        summary: "Porto romano e local onde Paulo esteve preso e testemunhou diante de Félix, Festo e o Rei Agripa.",
        historicalNote: "Foi na residência do procurador romano em Cesareia que Paulo apelou para César, garantindo sua viagem à capital do império.",
        keyVerse: "Disse Agripa a Paulo: Por pouco me queres persuadir a que me torne cristão!",
        reference: "Atos 26:28",
        bookAbbrev: "at",
        chapter: 26,
        verseNum: 28
      },
      {
        id: "loc-antioquia",
        name: "Antioquia da Síria",
        modernName: "Antakya, Turquia",
        lat: 36.2021,
        lng: 36.1606,
        era: "paulo",
        summary: "Base missionária de onde Paulo e Barnabé partiram enviados pelo Espírito Santo.",
        historicalNote: "Foi em Antioquia que os discípulos foram chamados de 'cristãos' pela primeira vez na história cristã.",
        keyVerse: "E em Antioquia foram os discípulos, pela primeira vez, chamados cristãos.",
        reference: "Atos 11:26",
        bookAbbrev: "at",
        chapter: 11,
        verseNum: 26
      },
      {
        id: "loc-tarso",
        name: "Tarso da Cilícia",
        modernName: "Tarsus, Turquia",
        lat: 36.9167,
        lng: 34.8958,
        era: "paulo",
        summary: "Cidade natal do apóstolo Paulo, centro comercial e cultural do mundo greco-romano.",
        historicalNote: "Paulo era cidadão romano de nascença por ter nascido em Tarso, prerrogativa legal que utilizou para a defesa do Evangelho.",
        keyVerse: "Eu sou judeu, nascido em Tarso da Cilícia, mas criado nesta cidade aos pés de Gamaliel.",
        reference: "Atos 22:3",
        bookAbbrev: "at",
        chapter: 22,
        verseNum: 3
      },
      {
        id: "loc-pafos",
        name: "Pafos (Chipre)",
        modernName: "Pafos, Chipre",
        lat: 34.7754,
        lng: 32.4245,
        era: "paulo",
        summary: "Primeira parada da 1ª viagem missionária; o procônsul Sérgio Paulo converteu-se.",
        historicalNote: "Local onde o mágico Elimas tentou desviar o procônsul e ficou cego temporariamente pela palavra de Paulo.",
        keyVerse: "Então o procônsul, vendo o que havia acontecido, creu, maravilhado da doutrina do Senhor.",
        reference: "Atos 13:12",
        bookAbbrev: "at",
        chapter: 13,
        verseNum: 12
      },
      {
        id: "loc-efeso",
        name: "Éfeso",
        modernName: "Selçuk, Turquia",
        lat: 37.9489,
        lng: 27.3678,
        era: "paulo",
        summary: "Grande metrópole da Ásia Menor onde Paulo permaneceu ensinando por quase 3 anos.",
        historicalNote: "Centro do templo de Diana; o ministério de Paulo abalou o comércio idólatra da cidade e gerou um avivamento onde livros de feitiçaria foram queimados.",
        keyVerse: "Assim a palavra do Senhor crescia poderosamente e prevalecia.",
        reference: "Atos 19:20",
        bookAbbrev: "at",
        chapter: 19,
        verseNum: 20
      },
      {
        id: "loc-troade",
        name: "Trôade",
        modernName: "Çanakkale, Turquia",
        lat: 39.7567,
        lng: 26.1633,
        era: "paulo",
        summary: "Porto marítimo onde Paulo teve a famosa visão do 'homem macedônio' chamando: 'Passa à Macedônia e ajuda-nos'.",
        historicalNote: "Ponto de virada onde o Evangelho cruzou da Ásia para a Europa.",
        keyVerse: "E de noite pareceu a Paulo uma visão, na qual se pôs em pé um homem da Macedônia, e lhe rogou, dizendo: Passa à Macedônia, e ajuda-nos.",
        reference: "Atos 16:9",
        bookAbbrev: "at",
        chapter: 16,
        verseNum: 9
      },
      {
        id: "loc-filipos",
        name: "Filipos",
        modernName: "Kavala / Philippi, Grécia",
        lat: 41.0125,
        lng: 24.2831,
        era: "paulo",
        summary: "Primeira colônia romana na Europa a receber o Evangelho através de Paulo e Silas.",
        historicalNote: "Local onde Lídia comerciante de púrpura foi batizada e onde o carcereiro de Filipos converteu-se após louvores à meia-noite e um grande terremoto.",
        keyVerse: "E eles disseram: Crê no Senhor Jesus Cristo e serás salvo, tu e a tua casa.",
        reference: "Atos 16:31",
        bookAbbrev: "at",
        chapter: 16,
        verseNum: 31
      },
      {
        id: "loc-tessalonica",
        name: "Tessalônica",
        modernName: "Thessaloniki, Grécia",
        lat: 40.6401,
        lng: 22.9444,
        era: "paulo",
        summary: "Capital da província da Macedônia onde Paulo debateu na sinagoga por três sábados.",
        historicalNote: "Igreja modelo em fé, esperança e amor que aguardava fervorosamente a Segunda Vinda de Cristo.",
        keyVerse: "Lembrando-nos sem cessar da obra da vossa fé, do trabalho do amor, e da paciência da esperança em nosso Senhor Jesus Cristo.",
        reference: "1 Tessalonicenses 1:3",
        bookAbbrev: "1ts",
        chapter: 1,
        verseNum: 3
      },
      {
        id: "loc-atenas",
        name: "Atenas (Areópago)",
        modernName: "Atenas, Grécia",
        lat: 37.9715,
        lng: 23.7257,
        era: "paulo",
        summary: "Paulo discursou aos filósofos estóicos e epicureus sobre o 'Deus Desconhecido'.",
        historicalNote: "Paulo usou a própria busca filosófica dos gregos no monte de Marte (Areópago) para anunciar o Deus Criador e a ressurreição de Jesus.",
        keyVerse: "Porque nele vivemos, e nos movemos, e existimos; como também alguns dos vossos poetas disseram: Pois somos também sua geração.",
        reference: "Atos 17:28",
        bookAbbrev: "at",
        chapter: 17,
        verseNum: 28
      },
      {
        id: "loc-corinto",
        name: "Corinto",
        modernName: "Corinto, Grécia",
        lat: 37.9056,
        lng: 22.8797,
        era: "paulo",
        summary: "Grande polo comercial onde Paulo trabalhou fazendo tendas com Áquila e Priscila.",
        historicalNote: "Paulo permaneceu 1 ano e 6 meses ensinando a palavra de Deus, fundando uma igreja vibrante repleta de dons espirituais.",
        keyVerse: "Não temas, mas fala, e não te cales; porque eu sou contigo, e ninguém lançará mão de ti para te fazer mal, pois tenho muito povo nesta cidade.",
        reference: "Atos 18:9-10",
        bookAbbrev: "at",
        chapter: 18,
        verseNum: 9
      },
      {
        id: "loc-malta",
        name: "Ilha de Malta",
        modernName: "República de Malta",
        lat: 35.9375,
        lng: 14.3754,
        era: "paulo",
        summary: "Local do célebre naufrágio durante a viagem de Paulo como prisioneiro até Roma.",
        historicalNote: "Mesmo picado por uma víbora venenosa saída da lenha, Paulo nada sofreu pelo poder de Deus e curou o pai de Públio e outros enfermos.",
        keyVerse: "Mas ele, sacudindo a víbora no fogo, não sofreu nenhum mal.",
        reference: "Atos 28:5",
        bookAbbrev: "at",
        chapter: 28,
        verseNum: 5
      },
      {
        id: "loc-roma",
        name: "Roma (Capital Imperial)",
        modernName: "Roma, Itália",
        lat: 41.9028,
        lng: 12.4964,
        era: "paulo",
        summary: "Coração do Império Romano onde Paulo testemunhou o Evangelho guardado por soldados.",
        historicalNote: "Durante 2 anos em prisão domiciliar, escreveu cartas fundamentais da fé cristã (Efésios, Filipenses, Colossenses, Filemom) e coroou sua carreira.",
        keyVerse: "Pregando o reino de Deus, e ensinando com toda a liberdade as coisas pertencentes ao Senhor Jesus Cristo, sem impedimento algum.",
        reference: "Atos 28:31",
        bookAbbrev: "at",
        chapter: 28,
        verseNum: 31
      }
    ]
  },
  {
    id: "vida-jesus",
    title: "O Ministério de Jesus na Terra Santa",
    subtitle: "A Galiléia, Samaria e Judéia nos passos do Messias",
    era: "jesus",
    region: "Israel (Galiléia, Samaria, Judéia e Jerusalém)",
    period: "Aprox. 4 a.C. – 33 d.C.",
    center: [32.35, 35.35],
    defaultZoom: 9,
    description: "Explore as vilas, cidades históricas, o Mar da Galileia e as montanhas onde Jesus Cristo nasceu, ensinou o Sermão do Monte, realizou milagres, morreu e ressuscitou vitorioso.",
    routeCoordinates: [
      [31.7054, 35.2024], // Belém
      [32.6996, 35.3035], // Nazaré
      [32.7483, 35.3386], // Caná
      [32.6869, 35.3900], // Tabor
      [32.8808, 35.5750], // Cafarnaum
      [32.8806, 35.5558], // Bem-Aventuranças
      [32.8222, 35.5847], // Mar da Galileia
      [31.8364, 35.5458], // Batismo no Jordão
      [32.2133, 35.2833], // Sicar (Samaria)
      [31.8560, 35.4630], // Jericó
      [31.7708, 35.2606], // Betânia
      [31.7767, 35.2345]  // Jerusalém
    ],
    locations: [
      {
        id: "loc-belem",
        name: "Belém de Judá",
        modernName: "Belém, Cisjordânia / Israel",
        lat: 31.7054,
        lng: 35.2024,
        era: "jesus",
        summary: "Cidade natal do Rei Davi e berço do nascimento do Messias Jesus Cristo.",
        historicalNote: "Cumprimento exato da profecia de Miquéias 5:2 anunciando que de Belém viria o Soberano de Israel.",
        keyVerse: "E tu, Belém Efrata, posto que pequena entre os milhares de Judá, de ti me sairá o que governará em Israel.",
        reference: "Miquéias 5:2 / Lucas 2:4-7",
        bookAbbrev: "lc",
        chapter: 2,
        verseNum: 4
      },
      {
        id: "loc-nazare",
        name: "Nazaré da Galileia",
        modernName: "Nazaré, Israel",
        lat: 32.6996,
        lng: 35.3035,
        era: "jesus",
        summary: "Cidade onde Jesus foi criado e onde anunciou o início do Seu ministério messiânico.",
        historicalNote: "Na sinagoga de Nazaré, Jesus desenrolou o profeta Isaías 61 e proclamou o cumprimento da profecia messiânica.",
        keyVerse: "O Espírito do Senhor é sobre mim, pois que me ungiu para evangelizar os pobres.",
        reference: "Lucas 4:18",
        bookAbbrev: "lc",
        chapter: 4,
        verseNum: 18
      },
      {
        id: "loc-cana",
        name: "Caná da Galileia",
        modernName: "Kafr Kanna, Israel",
        lat: 32.7483,
        lng: 35.3386,
        era: "jesus",
        summary: "Palco do primeiro milagre público de Jesus, transformando água em vinho num casamento.",
        historicalNote: "Jesus manifestou a Sua glória e Seus discípulos creram Nele no início do Seu ministério galileu.",
        keyVerse: "Jesus principiou assim os seus sinais em Caná da Galileia, e manifestou a sua glória; e os seus discípulos creram nele.",
        reference: "João 2:11",
        bookAbbrev: "jo",
        chapter: 2,
        verseNum: 11
      },
      {
        id: "loc-cafarnaum",
        name: "Cafarnaum",
        modernName: "Kfar Nahum, Israel",
        lat: 32.8808,
        lng: 35.5750,
        era: "jesus",
        summary: "A 'Sua própria cidade' - o grande centro do ministério público de Jesus na Galileia.",
        historicalNote: "Local da casa de Pedro, da cura do servo do centurião e da libertação de possessos na sinagoga local.",
        keyVerse: "E, entrando de novo em Cafarnaum alguns dias depois, soube-se que estava em casa.",
        reference: "Marcos 2:1",
        bookAbbrev: "mc",
        chapter: 2,
        verseNum: 1
      },
      {
        id: "loc-monte-bencoes",
        name: "Monte das Bem-Aventuranças",
        modernName: "Monte Eremos, Lago Kinneret",
        lat: 32.8806,
        lng: 35.5558,
        era: "jesus",
        summary: "Encosta com vista panorâmica para o lago onde Jesus proferiu o Sermão do Monte.",
        historicalNote: "O manifesto moral e espiritual do Reino de Deus (Mateus 5 a 7), ensinando sobre a luz do mundo e a oração do Pai Nosso.",
        keyVerse: "Bem-aventurados os puros de coração, porque eles verão a Deus.",
        reference: "Mateus 5:8",
        bookAbbrev: "mt",
        chapter: 5,
        verseNum: 8
      },
      {
        id: "loc-mar-galileia",
        name: "Mar da Galileia (Lago de Genesaré)",
        modernName: "Lago Kinneret, Israel",
        lat: 32.8222,
        lng: 35.5847,
        era: "jesus",
        summary: "Cenário de grandes milagres: acalmar a tempestade, andar sobre as águas e a pesca milagrosa.",
        historicalNote: "Neste lago de água doce, Jesus chamou os pescadores Pedro, André, Tiago e João para serem pescadores de almas.",
        keyVerse: "E ele, levantando-se, repreendeu o vento, e disse ao mar: Cala-te, aquieta-te. E o vento aquietou, e houve grande bonança.",
        reference: "Marcos 4:39",
        bookAbbrev: "mc",
        chapter: 4,
        verseNum: 39
      },
      {
        id: "loc-jordao-batismo",
        name: "Rio Jordão (Local do Batismo)",
        modernName: "Qasr al-Yahud / Rio Jordão",
        lat: 31.8364,
        lng: 35.5458,
        era: "jesus",
        summary: "Local onde João Batista batizou Jesus e o Espírito Santo desceu em forma de pomba.",
        historicalNote: "A voz do Pai ecoou dos céus: 'Este é o meu Filho amado, em quem me comprazo'.",
        keyVerse: "E, sendo Jesus batizado, saiu logo da água; e eis que se lhe abriram os céus, e viu o Espírito de Deus descendo como pomba.",
        reference: "Mateus 3:16-17",
        bookAbbrev: "mt",
        chapter: 3,
        verseNum: 16
      },
      {
        id: "loc-sicar",
        name: "Sicar (Poço de Jacó, Samaria)",
        modernName: "Nablus / Tel Balata",
        lat: 32.2133,
        lng: 35.2833,
        era: "jesus",
        summary: "Local do encontro de Jesus com a Mulher Samaritana junto ao poço histórico de Jacó.",
        historicalNote: "Jesus quebrou preconceitos culturais e revelou a água viva da salvação e a adoração em espírito e em verdade.",
        keyVerse: "Aquele que beber da água que eu lhe der nunca terá sede, porque a água que eu lhe der se fará nele uma fonte de água que jorre para a vida eterna.",
        reference: "João 4:14",
        bookAbbrev: "jo",
        chapter: 4,
        verseNum: 14
      },
      {
        id: "loc-jerico",
        name: "Jericó",
        modernName: "Jericó, Cisjordânia",
        lat: 31.8560,
        lng: 35.4630,
        era: "jesus",
        summary: "A cidade mais antiga do mundo onde Jesus curou o cego Bartimeu e jantou na casa de Zaqueu.",
        historicalNote: "O publicano Zaqueu converteu-se e restituiu quadruplicadamente, evidenciando o poder do Evangelho.",
        keyVerse: "Porque o Filho do homem veio buscar e salvar o que se havia perdido.",
        reference: "Lucas 19:10",
        bookAbbrev: "lc",
        chapter: 19,
        verseNum: 10
      },
      {
        id: "loc-betania",
        name: "Betânia",
        modernName: "Al-Eizariya, Monte das Oliveiras",
        lat: 31.7708,
        lng: 35.2606,
        era: "jesus",
        summary: "Lar de Maria, Marta e Lázaro, onde Jesus ressuscitou Lázaro após 4 dias na sepultura.",
        historicalNote: "Jesus declarou perante a tumba aberta: 'Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá'.",
        keyVerse: "Disse-lhe Jesus: Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá.",
        reference: "João 11:25",
        bookAbbrev: "jo",
        chapter: 11,
        verseNum: 25
      },
      {
        id: "loc-jerusalem-jesus",
        name: "Jerusalém e o Gólgota",
        modernName: "Cidade Velha de Jerusalém",
        lat: 31.7767,
        lng: 35.2345,
        era: "jesus",
        summary: "Cenário da Santa Ceia, agonia no Getsemani, Crucificação e Gloriosa Ressurreição.",
        historicalNote: "A tumba vazia de Cristo é o selo e garantia eterna da salvação e vitória sobre a morte.",
        keyVerse: "Ele não está aqui, porque já ressuscitou, como havia dito. Vinde, vede o lugar onde o Senhor jazia.",
        reference: "Mateus 28:6",
        bookAbbrev: "mt",
        chapter: 28,
        verseNum: 6
      }
    ]
  },
  {
    id: "exodo-peregrinacao",
    title: "O Êxodo e a Rota do Deserto",
    subtitle: "A libertação do Egito até a travessia do Rio Jordão",
    era: "exodo",
    region: "Egito, Península do Sinai, Neguebe e Canaã",
    period: "Aprox. 1446 a.C. – 1406 a.C.",
    center: [29.8, 33.6],
    defaultZoom: 7,
    description: "Siga os 40 anos da jornada dos hebreus sob Moisés: as pragas, a abertura do Mar Vermelho, a revelação no Monte Sinai e a entrada na Terra Prometida.",
    routeCoordinates: [
      [30.7870, 31.8310], // Ramsés
      [30.5500, 32.1000], // Sucote
      [29.9667, 32.5500], // Mar Vermelho
      [29.2500, 32.8500], // Mara
      [28.9500, 33.2000], // Elim
      [28.7000, 33.6500], // Refidim
      [28.5397, 33.9753], // Monte Sinai
      [28.8500, 34.4000], // Hazerote
      [30.6500, 34.4200], // Cades-Barnéia
      [30.3167, 35.4167], // Monte Hor
      [31.7681, 35.7275], // Monte Nebo
      [31.8600, 35.5400]  // Jericó
    ],
    locations: [
      {
        id: "loc-ramses",
        name: "Ramsés / Terra de Gósen",
        modernName: "Delta Oriental do Nilo, Egito",
        lat: 30.7870,
        lng: 31.8310,
        era: "exodo",
        summary: "Ponto de partida do povo de Israel após a décima praga e a celebração da 1ª Páscoa.",
        historicalNote: "Deus libertou o povo com braço forte após mais de quatro séculos de permanência no Egito.",
        keyVerse: "Assim partiram os filhos de Israel de Ramsés para Sucote, cerca de seiscentos mil a pé, somente de homens.",
        reference: "Êxodo 12:37",
        bookAbbrev: "ex",
        chapter: 12,
        verseNum: 37
      },
      {
        id: "loc-mar-vermelho",
        name: "Travessia do Mar Vermelho",
        modernName: "Golfo de Suez / Mar Vermelho",
        lat: 29.9667,
        lng: 32.5500,
        era: "exodo",
        summary: "O grande livramento sobrenatural onde as águas se abriram em muralhas.",
        historicalNote: "Moisés estendeu a sua vara sobre o mar e o Senhor abriu um caminho seco no meio das águas.",
        keyVerse: "O Senhor pelejará por vós, e vós vos calareis.",
        reference: "Êxodo 14:14",
        bookAbbrev: "ex",
        chapter: 14,
        verseNum: 14
      },
      {
        id: "loc-mara-elim",
        name: "Mara e Elim",
        modernName: "Oásis de Wadi Gharandel, Sinai",
        lat: 28.9500,
        lng: 33.2000,
        era: "exodo",
        summary: "As águas amargas saradas com o lenho e o oásis de 12 fontes e 70 palmeiras.",
        historicalNote: "Deus Se revelou como 'Jeová Rafá' — o Senhor que te sara.",
        keyVerse: "E disse: Se ouvires atento a voz do Senhor teu Deus... nenhuma das enfermidades porei sobre ti; porque eu sou o Senhor que te sara.",
        reference: "Êxodo 15:26",
        bookAbbrev: "ex",
        chapter: 15,
        verseNum: 26
      },
      {
        id: "loc-refidim",
        name: "Refidim",
        modernName: "Wadi Feiran, Península do Sinai",
        lat: 28.7000,
        lng: 33.6500,
        era: "exodo",
        summary: "A rocha ferida em Horebe que brotou água e a vitória sobre Amaleque com os braços erguidos de Moisés.",
        historicalNote: "Arão e Hur sustentaram as mãos de Moisés até o pôr do sol, edificando o altar 'Jeová Nissi' (O Senhor é minha bandeira).",
        keyVerse: "E Moisés edificou um altar, ao qual chamou: O Senhor é minha bandeira.",
        reference: "Êxodo 17:15",
        bookAbbrev: "ex",
        chapter: 17,
        verseNum: 15
      },
      {
        id: "loc-monte-sinai",
        name: "Monte Sinai (Horebe)",
        modernName: "Gebel Musa, Península do Sinai",
        lat: 28.5397,
        lng: 33.9753,
        era: "exodo",
        summary: "A Montanha Sagrada onde a Lei, a Aliança e os Dez Mandamentos foram entregues em tábuas de pedra.",
        historicalNote: "Local onde a glória de Deus desceu como fogo e fumaça e onde o modelo do Tabernáculo celestial foi revelado.",
        keyVerse: "E todo o monte Sinai fumegava, porque o Senhor descera sobre ele em fogo; e a sua fumaça subia como fumaça de uma fornalha.",
        reference: "Êxodo 19:18",
        bookAbbrev: "ex",
        chapter: 19,
        verseNum: 18
      },
      {
        id: "loc-cades-barneia",
        name: "Cades-Barnéia",
        modernName: "Ein el-Qudeirat, Neguebe",
        lat: 30.6500,
        lng: 34.4200,
        era: "exodo",
        summary: "Oásis estratégico de onde os 12 espias foram enviados para reconhecer Canaã.",
        historicalNote: "Josué e Calebe mantiveram a fé na promessa de Deus enquanto os outros temeram os gigantes.",
        keyVerse: "Porém Josué, filho de Num, e Calebe, filho de Jefoné... disseram: A terra pela qual passamos para espiar é terra muito boa.",
        reference: "Números 14:6-7",
        bookAbbrev: "nm",
        chapter: 14,
        verseNum: 6
      },
      {
        id: "loc-monte-nebo",
        name: "Monte Nebo e Rio Jordão",
        modernName: "Monte Nebo, Jordânia",
        lat: 31.7681,
        lng: 35.7275,
        era: "exodo",
        summary: "Moisés contemplou toda a Terra Prometida antes de ser recolhido pelo Senhor.",
        historicalNote: "Sob o comando de Josué, a nova geração atravessou o Jordão a seco e tomou posse da herança prometida aos patriarcas.",
        keyVerse: "Sê forte e corajoso; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.",
        reference: "Josué 1:9",
        bookAbbrev: "js",
        chapter: 1,
        verseNum: 9
      }
    ]
  },
  {
    id: "sete-igrejas-apocalipse",
    title: "As Sete Igrejas do Apocalipse",
    subtitle: "As cartas proféticas de Cristo enviadas da Ilha de Patmos",
    era: "apocalipse",
    region: "Ásia Menor (Atual Turquia Ocidental e Mar Egeu)",
    period: "Aprox. 95 d.C.",
    center: [38.4, 27.8],
    defaultZoom: 8,
    description: "Descubra a rota postal romana e as cidades históricas das sete igrejas do livro de Apocalipse: Éfeso, Esmirna, Pérgamo, Tiatira, Sardes, Filadélfia e Laodiceia.",
    routeCoordinates: [
      [37.3150, 26.5417], // Patmos
      [37.9489, 27.3678], // 1. Éfeso
      [38.4192, 27.1287], // 2. Esmirna
      [39.1294, 27.1806], // 3. Pérgamo
      [38.9244, 27.8397], // 4. Tiatira
      [38.4883, 28.0400], // 5. Sardes
      [38.3514, 28.5175], // 6. Filadélfia
      [37.8344, 29.1083]  // 7. Laodiceia
    ],
    locations: [
      {
        id: "loc-patmos",
        name: "Ilha de Patmos",
        modernName: "Patmos, Ilhas do Dodecaneso, Grécia",
        lat: 37.3150,
        lng: 26.5417,
        era: "apocalipse",
        summary: "Ilha rochosa no mar Egeu onde o apóstolo João esteve exilado e recebeu a Revelação do Senhor.",
        historicalNote: "João estava no Espírito no Dia do Senhor quando ouviu a voz majestosa como som de muitas águas.",
        keyVerse: "Eu, João... estava na ilha chamada Patmos, por causa da palavra de Deus, e pelo testemunho de Jesus Cristo.",
        reference: "Apocalipse 1:9",
        bookAbbrev: "ap",
        chapter: 1,
        verseNum: 9
      },
      {
        id: "loc-efeso-apoc",
        name: "1. Éfeso (A Igreja Desejável)",
        modernName: "Selçuk / Ephesus, Turquia",
        lat: 37.9489,
        lng: 27.3678,
        era: "apocalipse",
        summary: "Igreja zelosa e trabalhadora que rejeitou os falsos apóstolos, exortada a voltar ao Primeiro Amor.",
        historicalNote: "Ponto inicial da rota postal romana das 7 igrejas na província da Ásia.",
        keyVerse: "Tenho, porém, contra ti que deixaste o teu primeiro amor. Lembra-te, pois, de onde caíste, e arrepende-te.",
        reference: "Apocalipse 2:4-5",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 4
      },
      {
        id: "loc-esmirna",
        name: "2. Esmirna (A Igreja Perseguida)",
        modernName: "Izmir, Turquia",
        lat: 38.4192,
        lng: 27.1287,
        era: "apocalipse",
        summary: "A igreja provada pelo sofrimento e perseguição imperial que recebeu a promessa da Coroa da Vida.",
        historicalNote: "Uma das duas únicas igrejas que não receberam repreensão de Jesus.",
        keyVerse: "Sê fiel até à morte, e dar-te-ei a coroa da vida.",
        reference: "Apocalipse 2:10",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 10
      },
      {
        id: "loc-pergamo",
        name: "3. Pérgamo (A Igreja no Trono de Satanás)",
        modernName: "Bergama, Turquia",
        lat: 39.1294,
        lng: 27.1806,
        era: "apocalipse",
        summary: "Cidade de grandes templos pagãos e biblioteca colossal, exortada contra o compromisso mundano.",
        historicalNote: "Aos que vencerem, Cristo promete o 'maná escondido' e uma 'pedrinha branca' com nome novo.",
        keyVerse: "Ao que vencer darei do maná escondido, e dar-lhe-ei uma pedra branca, e na pedra um novo nome escrito.",
        reference: "Apocalipse 2:17",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 17
      },
      {
        id: "loc-tiatira",
        name: "4. Tiatira (A Igreja Tolerante)",
        modernName: "Akhisar, Turquia",
        lat: 38.9244,
        lng: 27.8397,
        era: "apocalipse",
        summary: "Centro comercial de corporações e tinturaria de púrpura, advertida contra a falsa doutrina.",
        historicalNote: "A promessa ao vencedor é autoridade sobre as nações e a gloriosa Estrela da Manhã.",
        keyVerse: "E ao que vencer, e guardar até ao fim as minhas obras, eu lhe darei poder sobre as nações.",
        reference: "Apocalipse 2:26",
        bookAbbrev: "ap",
        chapter: 2,
        verseNum: 26
      },
      {
        id: "loc-sardes",
        name: "5. Sardes (A Igreja que Parecia Viva)",
        modernName: "Sart, Turquia",
        lat: 38.4883,
        lng: 28.0400,
        era: "apocalipse",
        summary: "Antiga capital lendária do reino da Lídia, conclamada a vigiar para não ser surpreendida.",
        historicalNote: "Famosa acrópole considerada inexpugnável que caiu historicamente por falta de vigias noturnos.",
        keyVerse: "Sê vigilante, e confirma os restantes, que estavam para morrer; porque não achei as tuas obras perfeitas diante de Deus.",
        reference: "Apocalipse 3:2",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 2
      },
      {
        id: "loc-filadelfia",
        name: "6. Filadélfia (A Igreja do Amor Fraternal)",
        modernName: "Alaşehir, Turquia",
        lat: 38.3514,
        lng: 28.5175,
        era: "apocalipse",
        summary: "A igreja da 'Porta Aberta' que guardou a Palavra da paciência e não negou o Santo Nome.",
        historicalNote: "Região de frequentes terremotos; Cristo promete fazer do vencedor uma coluna inabalável no Seu Santuário eterno.",
        keyVerse: "Conheço as tuas obras; eis que diante de ti pus uma porta aberta, e ninguém a pode fechar.",
        reference: "Apocalipse 3:8",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 8
      },
      {
        id: "loc-laodiceia",
        name: "7. Laodiceia (A Igreja Morna)",
        modernName: "Denizli / Pamukkale, Turquia",
        lat: 37.8344,
        lng: 29.1083,
        era: "apocalipse",
        summary: "Cidade rica, bancária e medicinal, repreendida por sua mornidão e auto-suficiência espiritual.",
        historicalNote: "As águas termais de Hierápolis chegavam mornas à cidade. Cristo bate à porta oferecendo ouro refinado no fogo e vestes brancas.",
        keyVerse: "Eis que estou à porta, e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei em sua casa, e com ele cearei, e ele comigo.",
        reference: "Apocalipse 3:20",
        bookAbbrev: "ap",
        chapter: 3,
        verseNum: 20
      }
    ]
  },
  {
    id: "antigo-testamento-reinos",
    title: "Terras Bíblicas e Reinos de Israel",
    subtitle: "Canaã, os Patriarcas, Juízes e os Reis de Judá e Israel",
    era: "reinos",
    region: "Canaã e as Tribos de Israel (Dan a Berseba)",
    period: "Aprox. 2000 a.C. – 586 a.C.",
    center: [32.1, 35.2],
    defaultZoom: 8,
    description: "Conheça os santuários, montanhas e cidades sagradas dos Patriarcas Abraão, Isaque e Jacó, a Cidade de Davi e os grandes feitos dos profetas de Israel.",
    routeCoordinates: [
      [31.2589, 34.7997], // Berseba
      [31.5247, 35.1107], // Hebrom
      [31.7767, 35.2345], // Jerusalém
      [31.9306, 35.2208], // Betel
      [32.0556, 35.2894], // Siló
      [32.2139, 35.2847], // Siquém
      [32.2778, 35.1889], // Samaria
      [32.7381, 35.0489], // Carmelo
      [33.2486, 35.6528]  // Dã
    ],
    locations: [
      {
        id: "loc-hebrom",
        name: "Hebrom (Macpela)",
        modernName: "Hebrom (Al-Khalil), Cisjordânia",
        lat: 31.5247,
        lng: 35.1107,
        era: "patriarcas",
        summary: "Local dos carvalhais de Manre e do sepulcro dos Patriarcas (Abraão, Sara, Isaque, Rebeca, Jacó e Léia).",
        historicalNote: "Foi também onde Davi foi ungido rei sobre Judá e reinou por sete anos e seis meses antes de conquistar Jerusalém.",
        keyVerse: "E vieram todos os anciãos de Israel ao rei, em Hebrom... e ungiram a Davi rei sobre Israel.",
        reference: "2 Samuel 5:3",
        bookAbbrev: "2sm",
        chapter: 5,
        verseNum: 3
      },
      {
        id: "loc-jerusalem-davi",
        name: "Jerusalém (Sião e Monte Moriá)",
        modernName: "Jerusalém, Israel",
        lat: 31.7767,
        lng: 35.2345,
        era: "reinos",
        summary: "Capital eterna de Davi e local onde Salomão edificou o Primeiro Templo sobre o Monte Moriá.",
        historicalNote: "Onde Abraão ofereceu Isaque e a Arca da Aliança foi colocada no Santo dos Santos entre os querubins.",
        keyVerse: "Orai pela paz de Jerusalém; prosperarão aqueles que te amam.",
        reference: "Salmos 122:6",
        bookAbbrev: "sl",
        chapter: 122,
        verseNum: 6
      },
      {
        id: "loc-silo",
        name: "Siló",
        modernName: "Tel Shiloh, Samaria",
        lat: 32.0556,
        lng: 35.2894,
        era: "reinos",
        summary: "Centro espiritual de Israel no período dos Juízes onde o Tabernáculo permaneceu por mais de três séculos.",
        historicalNote: "Local onde Ana orou derramando a alma e onde o jovem profeta Samuel ouviu a voz de Deus no silêncio da noite.",
        keyVerse: "E veio o Senhor, e pôs-se ali, e chamou como das outras vezes: Samuel, Samuel. E disse Samuel: Fala, porque o teu servo ouve.",
        reference: "1 Samuel 3:10",
        bookAbbrev: "1sm",
        chapter: 3,
        verseNum: 10
      },
      {
        id: "loc-samaria",
        name: "Samaria (Sebaste)",
        modernName: "Sebastia, Samaria",
        lat: 32.2778,
        lng: 35.1889,
        era: "reinos",
        summary: "Capital do Reino do Norte fundada pelo rei Onri e adornada por Acabe.",
        historicalNote: "Cenário de grandes confrontos proféticos com Elias e Eliseu até a queda perante o Império Assírio em 722 a.C.",
        keyVerse: "E comprou de Sêmer o monte de Samaria... e edificou no monte a cidade de Samaria.",
        reference: "1 Reis 16:24",
        bookAbbrev: "1rs",
        chapter: 16,
        verseNum: 24
      },
      {
        id: "loc-carmelo",
        name: "Monte Carmelo",
        modernName: "Monte Carmelo (Muhraqa), Haifa",
        lat: 32.7381,
        lng: 35.0489,
        era: "reinos",
        summary: "Montanha sagrada onde o profeta Elias desafiou os 450 profetas de Baal e o fogo do Senhor desceu dos céus.",
        historicalNote: "O povo prostrou-se clamando: 'O Senhor é Deus! O Senhor é Deus!', seguido por abundante chuva após 3 anos e meio de seca.",
        keyVerse: "Então caiu fogo do Senhor, e consumiu o holocausto, e a lenha, e as pedras, e o pó, e ainda lambeu a água que estava no rego.",
        reference: "1 Reis 18:38",
        bookAbbrev: "1rs",
        chapter: 18,
        verseNum: 38
      },
      {
        id: "loc-dan",
        name: "Dã (Extremo Norte de Israel)",
        modernName: "Tel Dan, Reserva Natural Hermon",
        lat: 33.2486,
        lng: 35.6528,
        era: "reinos",
        summary: "Fronteira setentrional de Israel ('de Dã a Berseba'), célebre por suas nascentes cristalinas que alimentam o Jordão.",
        historicalNote: "Local onde Jeroboão I colocou um dos bezerros de ouro para impedir que o povo subisse a adorar no Templo em Jerusalém.",
        keyVerse: "E todo o Israel, desde Dã até Berseba, conheceu que Samuel estava confirmado por profeta do Senhor.",
        reference: "1 Samuel 3:20",
        bookAbbrev: "1sm",
        chapter: 3,
        verseNum: 20
      },
      {
        id: "loc-berseba",
        name: "Berseba (Poço do Juramento)",
        modernName: "Beer Sheva, Israel",
        lat: 31.2589,
        lng: 34.7997,
        era: "patriarcas",
        summary: "Fronteira meridional de Israel onde Abraão e Isaque cavaram poços de aliança e plantaram tamargueiras.",
        historicalNote: "Abraão invocou ali o Nome do Senhor, o Deus Eterno (El Olam).",
        keyVerse: "E plantou Abraão uma tamargueira em Berseba, e invocou ali o nome do Senhor, o Deus eterno.",
        reference: "Gênesis 21:33",
        bookAbbrev: "gn",
        chapter: 21,
        verseNum: 33
      }
    ]
  }
];

import { biblicalMapsEn } from "./biblicalMapsDataEn";

export const getLocalizedBiblicalMaps = (language: string = "pt"): BiblicalMapTheme[] => {
  if (language === "en") {
    return biblicalMapsEn;
  }
  return biblicalMaps;
};
