/**
 * ============================================================================
 * DEFINIÇÃO DETERMINÍSTICA DE FUNDOS BÍBLICOS ULTRA-REALISTAS (CHAT DE IMAGENS)
 * ============================================================================
 * Este módulo contém a definição especializada de cenários e paisagens
 * ultra-realistas para todas as histórias e temas bíblicos.
 *
 * Quando uma geração de imagem é solicitada no Chat, este código analisa o
 * pedido do usuário e injeta o cenário e fundo exatos da respectiva passagem
 * bíblica (ex: Adão e Eva -> Jardim do Éden exuberante; Torre de Babel ->
 * Monumental Zigurate de Babel na planície de Sinar; Mar Vermelho -> Muralhas
 * colossais de água cristalina, etc.), com a mesma qualidade de paisagens
 * deslumbrantes do Modo Criar.
 * ============================================================================
 */

export interface BiblicalBackgroundDefinition {
  id: string;
  title: string;
  category: 'antigo-testamento' | 'novo-testamento' | 'profetas' | 'paisagens-sagradas';
  triggers: RegExp;
  storySubjectEn: string;
  ultraRealisticBackgroundEn: string;
  modestyRequired?: boolean;
}

export interface BiblicalBackgroundMatch {
  matchedStory: string;
  storySubjectEn: string;
  ultraRealisticBackgroundEn: string;
  fullComposedPrompt: string;
  modestyRequired: boolean;
}

/**
 * Fundo Padrão Ultra-Realista da Terra Santa Bíblica
 * Aplicado como cenário paisagístico cinematográfico quando o pedido bíblico não especificar uma história individual.
 */
export const DEFAULT_ULTRA_REALISTIC_BACKGROUND = 
  "background of a breathtaking majestic ancient biblical Holy Land landscape, sun-drenched rolling terraced hills with ancient gnarled olive trees, blooming wild mountain anemones and golden wheat fields, winding limestone path under epic dramatic sky with glorious golden volumetric god rays piercing through parted clouds, sweeping tranquil valley horizon, authentic natural depth of field, ultra-photorealistic cinematic composition";

/**
 * Normaliza strings para facilitar matching determinístico sem conflito com acentos
 */
function normalizeText(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Catálogo completo de fundos bíblicos determinísticos
 */
export const BIBLICAL_BACKGROUNDS: BiblicalBackgroundDefinition[] = [
  // 1. ADÃO E EVA / JARDIM DO ÉDEN
  {
    id: 'adao-e-eva-jardim-eden',
    title: 'Adão e Eva no Jardim do Éden',
    category: 'antigo-testamento',
    triggers: /\b(adao|adam)\b.*\b(eva|eve)\b|\b(eva|eve)\b.*\b(adao|adam)\b|\b(adao|adam)\b|\b(eva|eve)\b|\b(jardim\s+do\s+eden|garden\s+of\s+eden|eden|paraiso\s+terreal|paraiso\s+perdido|fruto\s+proibido|arvore\s+do\s+conhecimento|arvore\s+da\s+vida)\b/i,
    storySubjectEn: "a handsome Semitic man with neat short hair (Adam) and a graceful Semitic woman (Eve), both mandatorily fully clothed wearing modest ancient biblical linen tunics, dignified and reverent, zero nudity, 100% clothed",
    ultraRealisticBackgroundEn: "background of the lush sacred paradise of the Garden of Eden, vibrant emerald vegetation, ancient flowering fruit trees laden with golden fruit, crystal-clear winding River of Life with turquoise water cascading over smooth river stones, soft golden volumetric sunbeams filtering through leafy tree canopies, blooming exotic white lilies and wild flowers, gentle peaceful untouched nature, idyllic heavenly atmosphere, ultra-photorealistic landscape depth",
    modestyRequired: true
  },

  // 2. TORRE DE BABEL
  {
    id: 'torre-de-babel',
    title: 'Torre de Babel na Planície de Sinar',
    category: 'antigo-testamento',
    triggers: /\b(torre\s+de\s+babel|tower\s+of\s+babel|babel|planicie\s+de\s+sinar|shinar)\b/i,
    storySubjectEn: "The monumental colossal Tower of Babel ascending into the heavens",
    ultraRealisticBackgroundEn: "background of the colossal monumental Tower of Babel rising into the heavens on the sprawling ancient plains of Shinar, massive stepped spiral ziggurat architecture crafted of sun-dried clay and baked mud bricks, authentic rustic wooden scaffolding and ramps winding around the monumental tower, vast sweeping Mesopotamian desert horizon at dramatic golden hour sunset, parted stormy clouds with intense amber and violet volumetric sunbeams, photorealistic historical landscape, epic scale and depth",
    modestyRequired: false
  },

  // 3. ARCA DE NOÉ E O MONTE ARARATE
  {
    id: 'arca-de-noe-diluvio',
    title: 'Arca de Noé e o Monte Ararate',
    category: 'antigo-testamento',
    triggers: /\b(arca\s+de\s+noe|noah'?s?\s+ark|noe\b|noah\b|diluvio|deluge|monte\s+ararate|mount\s+ararat|ararate|ararat|grande\s+diluvio)\b/i,
    storySubjectEn: "The colossal biblical Ark of Noah crafted of ancient dark gopher wood resting upon the heights",
    ultraRealisticBackgroundEn: "background of the majestic rugged peak of Mount Ararat with the massive wooden ark resting on misty mountain slopes, a vibrant brilliant luminous rainbow arching across wide dramatic blue sky, dramatic receding storm clouds parted by radiant golden celestial light rays, pristine alpine mountain ridges with cascading clear waters, epic tranquil biblical wilderness, ultra-photorealistic panoramic nature",
    modestyRequired: false
  },

  // 4. ABRAÃO E O SACRIFÍCIO NO MONTE MORIÁ / CÉU ESTRELADO
  {
    id: 'abraao-moria-estrelas',
    title: 'Abraão e a Promessa das Estrelas / Monte Moriá',
    category: 'antigo-testamento',
    triggers: /\b(abraao|abraham|isaque|isaac|monte\s+moria|moriah|estrelas\s+do\s+ceu|promessa\s+de\s+abraao|tendas\s+de\s+abraao)\b/i,
    storySubjectEn: "Patriarch Abraham standing in faith and devotion under the boundless sky",
    ultraRealisticBackgroundEn: "background of ancient rolling limestone hills of Judea and Mount Moriah, weathered ancient stone altar, rustic desert tents in the distant valley, sweeping horizon under a pristine deep indigo sky ablaze with millions of luminous brilliant stars and the milky way, soft warm campfire glow reflecting on natural rocks, awe-inspiring sacred nocturnal landscape",
    modestyRequired: false
  },

  // 5. MOISÉS E A SARÇA ARDENTE
  {
    id: 'moises-sarca-ardente',
    title: 'Moisés e a Sarça Ardente no Monte Horebe',
    category: 'antigo-testamento',
    triggers: /\b(sarca\s+ardente|burning\s+bush|monte\s+horebe|mount\s+horeb|sarca|chama\s+sagrada|tira\s+as\s+sandalias)\b/i,
    storySubjectEn: "Moses removing his sandals on holy ground before the miraculous divine presence",
    ultraRealisticBackgroundEn: "background of the rugged arid red sandstone terrain of Mount Horeb, an ancient desert thorn bush burning with intense supernatural living golden and amber flame without being consumed, luminous divine aura radiating warm holy light across rugged desert rocks, sheer dramatic desert canyon walls under dusky amber twilight sky, tack-sharp ultra-photorealistic scenic depth",
    modestyRequired: false
  },

  // 6. ABERTURA DO MAR VERMELHO
  {
    id: 'mar-vermelho-aberto',
    title: 'Abertura do Mar Vermelho',
    category: 'antigo-testamento',
    triggers: /\b(mar\s+vermelho|red\s+sea|abertura\s+do\s+mar|parting\s+of\s+the\s+red\s+sea|travessia\s+do\s+mar|farao|exodo)\b/i,
    storySubjectEn: "The miraculous crossing of the Red Sea by the Hebrew people guided by divine providence",
    ultraRealisticBackgroundEn: "background of the awe-inspiring parting of the Red Sea, colossal vertical towering walls of surging crystal-clear turquoise ocean water on both sides, wide dry seabed pathway with natural sea bed sand ripples, dramatic sky illuminated by a towering radiant pillar of divine fire and celestial glowing cloud, epic cinematic scale and breathtaking depth",
    modestyRequired: false
  },

  // 7. MOISÉS NO MONTE SINAI / TÁBUAS DA LEI
  {
    id: 'moises-monte-sinai',
    title: 'Moisés no Monte Sinai / Tábuas da Lei',
    category: 'antigo-testamento',
    triggers: /\b(monte\s+sinai|mount\s+sinai|sinai|tabuas\s+da\s+lei|ten\s+commandments|dez\s+mandamentos)\b/i,
    storySubjectEn: "Moses receiving the sacred stone tablets of the Ten Commandments on the holy mountain summit",
    ultraRealisticBackgroundEn: "background of the colossal jagged rocky crags of Mount Sinai engulfed in dense billowing divine storm clouds and heavenly smoke, brilliant golden divine lightning branching through deep charcoal skies, celestial fire glowing on the mountain peak, vast arid desert mountain panorama stretching to the distant horizon, epic dramatic cinematic lighting",
    modestyRequired: false
  },

  // 8. ARCA DA ALIANÇA E O SANTO DOS SANTOS
  {
    id: 'arca-da-alianca-shekinah',
    title: 'A Arca da Aliança e a Glória Shekinah',
    category: 'antigo-testamento',
    triggers: /\b(arca\s+da\s+alianca|ark\s+of\s+the\s+covenant|santo\s+dos\s+santos|holy\s+of\s+holies|shekinah|propiciatorio|querubins)\b/i,
    storySubjectEn: "The sacred Ark of the Covenant crafted of pure gleaming beaten gold with outstretched cherubim wings",
    ultraRealisticBackgroundEn: "background of the inner sanctuary Holy of Holies in the ancient Tabernacle, rich woven curtains of blue, purple, and scarlet linen, luminous radiant white and golden Shekinah glory glowing brilliantly above the mercy seat, soft warm candlelight from golden menorah, sacred solemn reverence, ultra-photorealistic textures",
    modestyRequired: false
  },

  // 9. QUEDA DAS MURALHAS DE JERICÓ / JOSUÉ
  {
    id: 'muralhas-de-jerico',
    title: 'Muralhas de Jericó e Josué',
    category: 'antigo-testamento',
    triggers: /\b(jerico|jericho|muralhas\s+de\s+jerico|walls\s+of\s+jericho|josue|joshua|trombetas|shofar)\b/i,
    storySubjectEn: "Joshua and the priests carrying the ark and blowing sacred ram horn trumpets",
    ultraRealisticBackgroundEn: "background of the colossal ancient stone fortified ramparts and stone bastion of Jericho in the vast Jordan Valley, lush date palm oases in the distance, arid rocky hills of Canaan under a blazing golden afternoon sky with suspended dust particles catching sunlight, monumental biblical landscape",
    modestyRequired: false
  },

  // 10. GIDEÃO E A FONTE DE HARODE
  {
    id: 'gideao-fonte-harode',
    title: 'Gideão e a Fonte de Harode',
    category: 'antigo-testamento',
    triggers: /\b(gideao|gideon|fonte\s+de\s+harode|trezentos|300\s+de\s+gideao|tochas\s+e\s+cantaros)\b/i,
    storySubjectEn: "Gideon and the chosen three hundred men prepared for the divine battle",
    ultraRealisticBackgroundEn: "background of the tranquil mountain spring of Harod at the base of Mount Gilboa, crystal clear mountain spring water pool reflecting rugged limestone cliffs, ancient wild olive bushes, tranquil evening breeze under dramatic twilight sky with glowing stars",
    modestyRequired: false
  },

  // 11. SANSÃO E OS FILISTEUS
  {
    id: 'sansao-filisteus',
    title: 'Sansão e as Colunas do Templo',
    category: 'antigo-testamento',
    triggers: /\b(sansao|samson|dalila|delilah|filisteus|philistines|colunas\s+do\s+templo|leao\s+de\s+timna)\b/i,
    storySubjectEn: "Samson endowed with mighty strength standing between massive stone pillars",
    ultraRealisticBackgroundEn: "background of colossal monumental Philistine limestone temple architecture, massive carved stone pillars and open courtyards, Mediterranean coastal atmospheric light with warm golden dust rays streaming through towering porticos, distant arid hills of Sorek",
    modestyRequired: false
  },

  // 12. RUTE E BOAZ NOS CAMPOS DE TRIGO DE BELÉM
  {
    id: 'rute-boaz-campos-trigo',
    title: 'Rute e Boaz na Seara de Belém',
    category: 'antigo-testamento',
    triggers: /\b(rute|ruth|boaz|noemi|naomi|respigar|seara|campos\s+de\s+belem|colheita\s+de\s+trigo)\b/i,
    storySubjectEn: "Ruth gleaning ears of golden grain in the harvest field under the guidance of Boaz",
    ultraRealisticBackgroundEn: "background of expansive rolling golden wheat and barley harvest fields in biblical Bethlehem, neatly bundled grain sheaves, terrace hillside with ancient olive orchards and fig trees, warm late afternoon golden hour sunshine casting long soft shadows, peaceful pastoral serenity, photorealistic natural landscape",
    modestyRequired: false
  },

  // 13. DAVI E GOLIAS NO VALE DE ELÁ
  {
    id: 'davi-e-golias-vale-ela',
    title: 'Davi e Golias no Vale de Elá',
    category: 'antigo-testamento',
    triggers: /\b(davi\s+e\s+golias|david\s+and\s+goliath|golias|goliath|vale\s+de\s+ela|valley\s+of\s+elah|funda\s+de\s+davi|cinco\s+pedras)\b/i,
    storySubjectEn: "Young David holding a shepherd staff and sling facing the towering armor-clad Goliath",
    ultraRealisticBackgroundEn: "background of the historic Valley of Elah with sweeping gentle green slopes and ancient knobby olive trees, a winding clear babbling brook with smooth white riverbed stones, distant military canvas tents pitched on opposite Judean hill ridges under a dramatic early morning golden sky, epic cinematic atmosphere, tack-sharp focal depth",
    modestyRequired: false
  },

  // 14. DAVI O BOM PASTOR / SALMO 23
  {
    id: 'davi-pastor-salmo-23',
    title: 'Davi Pastoreando / Salmo 23',
    category: 'antigo-testamento',
    triggers: /\b(salmo\s+23|psalm\s+23|pastos\s+verdejantes|green\s+pastures|aguas\s+tranquilas|still\s+waters|davi\s+pastor|harpa\s+de\s+davi|bom\s+pastor)\b/i,
    storySubjectEn: "A faithful Hebrew shepherd gently holding a wooden staff watching over grazing sheep",
    ultraRealisticBackgroundEn: "background of lush verdant green pastures and tranquil crystal-clear still waters in the Judean highlands, blooming hillside wild anemones and lavender, gentle stream meandering between smooth limestone rocks, peaceful white sheep grazing in the serene valley, soft warm luminous sunlight under blue skies, idyllic pastoral peace",
    modestyRequired: false
  },

  // 15. SALOMÃO E O TEMPLO DE JERUSALÉM
  {
    id: 'salomao-templo-jerusalem',
    title: 'Salomão e o Templo de Jerusalém',
    category: 'antigo-testamento',
    triggers: /\b(salomao|solomon|templo\s+de\s+salomao|temple\s+of\s+solomon|rainha\s+de\s+saba|queen\s+of\s+sheba|sabedoria\s+de\s+salomao)\b/i,
    storySubjectEn: "King Solomon dressed in majestic royal biblical robes of purple and gold",
    ultraRealisticBackgroundEn: "background of Mount Moriah crowned with the glorious Temple of Solomon, monumental polished white limestone walls, ornate gleaming pure gold exterior reliefs and twin towering bronze pillars, vast marble courtyards, sweeping panoramic view of ancient Jerusalem hills under clear Mediterranean azure skies, magnificent historical grandeur",
    modestyRequired: false
  },

  // 16. ELIAS NO MONTE CARMELO
  {
    id: 'elias-monte-carmelo',
    title: 'Elias no Monte Carmelo / Fogo Celestial',
    category: 'antigo-testamento',
    triggers: /\b(elias|elijah|monte\s+carmelo|mount\s+carmel|fogo\s+do\s+ceu|carruagem\s+de\s+fogo|chariot\s+of\s+fire|profetas\s+de\s+baal)\b/i,
    storySubjectEn: "Prophet Elijah praying fervently beside a restored stone altar",
    ultraRealisticBackgroundEn: "background of the rugged mountain peak of Mount Carmel overlooking the distant blue Mediterranean Sea, a rustic unhewn stone altar consumed by a miraculous vertical pillar of roaring golden celestial fire descending from parted clouds, dramatic sweeping storm clouds catching orange and amber light, awe-inspiring divine power",
    modestyRequired: false
  },

  // 17. JONAS E A PRAIA DE NÍNIVE
  {
    id: 'jonas-grande-peixe-ninive',
    title: 'Jonas e a Costa de Nínive',
    category: 'antigo-testamento',
    triggers: /\b(jonas|jonah|grande\s+peixe|big\s+fish|baleia|ninive|nineveh|mar\s+de\s+tarsis|tempestade\s+no\s+mar)\b/i,
    storySubjectEn: "Prophet Jonah kneeling in thanksgiving and repentance on the Mediterranean shore",
    ultraRealisticBackgroundEn: "background of the vast Mediterranean sandy shoreline where powerful emerald ocean waves break peacefully, dynamic storm clouds clearing above to reveal brilliant warm sunlight, distant colossal fortified clay walls and majestic winged bull gates of Nineveh on the horizon, ultra-photorealistic coastal atmosphere",
    modestyRequired: false
  },

  // 18. DANIEL NA COVA DOS LEÕES
  {
    id: 'daniel-cova-dos-leoes',
    title: 'Daniel na Cova dos Leões',
    category: 'antigo-testamento',
    triggers: /\b(daniel\s+na\s+cova|cova\s+dos\s+leoes|lions'?\s+den|daniel\s+e\s+os\s+leoes|babilonia|fornalha\s+ardente|sadraque|mesaque|abednego)\b/i,
    storySubjectEn: "Prophet Daniel peacefully praying in humble faith surrounded by calm majestic lions",
    ultraRealisticBackgroundEn: "background of an ancient subterranean Babylonian stone pit with glazed lapis-lazuli brick reliefs on massive stone walls, a celestial vertical shaft of divine golden light beaming down from the circular ceiling opening onto the sand floor, majestic noble lions resting quietly in serene peace, mystical holy stillness",
    modestyRequired: false
  },

  // 19. O NASCIMENTO DE JESUS EM BELÉM / MANJEDOURA
  {
    id: 'nascimento-jesus-belem',
    title: 'O Nascimento de Jesus em Belém',
    category: 'novo-testamento',
    triggers: /\b(nascimento\s+de\s+jesus|nativity|manjedoura|manger|belem|bethlehem|estrela\s+de\s+belem|star\s+of\s+bethlehem|maria\s+e\s+jose|menino\s+jesus|pastores\s+de\s+belem|tres\s+reis\s+magos|magos\s+do\s+oriente)\b/i,
    storySubjectEn: "The Nativity scene with Baby Jesus in a humble wooden manger with Mary and Joseph in loving reverence",
    ultraRealisticBackgroundEn: "background of a humble ancient Judean limestone shelter cave in the quiet hills of Bethlehem, sweet golden straw, warm gentle lantern candlelight illuminating natural rock walls, open stone entrance showing the deep indigo night sky ablaze with the radiant supernatural Star of Bethlehem casting brilliant celestial rays over tranquil sleeping hills, deeply touching holy night atmosphere",
    modestyRequired: true
  },

  // 20. O BATISMO DE JESUS NO RIO JORDÃO
  {
    id: 'batismo-jesus-rio-jordao',
    title: 'O Batismo de Jesus no Rio Jordão',
    category: 'novo-testamento',
    triggers: /\b(batismo\s+de\s+jesus|baptism\s+of\s+jesus|batismo|rio\s+jordao|jordan\s+river|joao\s+batista|john\s+the\s+baptist|ceus\s+abertos|espirito\s+em\s+forma\s+de\s+pomba)\b/i,
    storySubjectEn: "Jesus Christ standing reverently in the calm river water alongside John the Baptist",
    ultraRealisticBackgroundEn: "background of the serene winding emerald waters of the Jordan River fringed with lush papyrus reeds, weeping willows and wild tamarisk trees, parted heavenly skies above with brilliant glorious divine sunbeams pouring down through parted clouds, soft golden water ripples, serene tranquil holy landscape",
    modestyRequired: false
  },

  // 21. SERMÃO DA MONTANHA / MAR DA GALILEIA
  {
    id: 'sermao-da-montanha-galileia',
    title: 'Sermão da Montanha / Mar da Galileia',
    category: 'novo-testamento',
    triggers: /\b(sermao\s+da\s+montanha|sermon\s+on\s+the\s+mount|bem-aventurados|beatitudes|monte\s+das\s+bem-aventurancas|mar\s+da\s+galileia|sea\s+of\s+galilee)\b/i,
    storySubjectEn: "Jesus Christ teaching with grace and divine authority on the hillside",
    ultraRealisticBackgroundEn: "background of the rolling lush green slopes of the Mount of Beatitudes carpeted with wild scarlet anemones and yellow mustard flowers, panoramic breathtaking view of the tranquil sparkling blue Sea of Galilee below under a serene morning sky, warm golden dawn lighting, gentle hill breeze, ultra-photorealistic landscape",
    modestyRequired: false
  },

  // 22. A TEMPESTADE ACALMADA NO MAR DA GALILEIA
  {
    id: 'tempestade-acalmada',
    title: 'A Tempestade Acalmada no Mar',
    category: 'novo-testamento',
    triggers: /\b(tempestade\s+acalmada|calming\s+the\s+storm|cala-te\s+aquieta-te|mar\s+agitado|barco\s+na\s+tempestade|pesca\s+maravilhosa|redes\s+cheias)\b/i,
    storySubjectEn: "Jesus Christ calming the wind and the waves with sovereign divine peace",
    ultraRealisticBackgroundEn: "background of the vast Sea of Galilee with crystal-clear turquoise waters returning to mirror-like stillness, dramatic receding dark storm clouds parting to reveal warm golden celestial sunshine reflecting on water, distant Golan mountain ridges in soft purple haze, authentic ancient wooden fishing boat with rustic sail",
    modestyRequired: false
  },

  // 23. ENTRADA TRIUNFAL EM JERUSALÉM / DOMINGO DE RAMOS
  {
    id: 'entrada-triunfal-jerusalem',
    title: 'Entrada Triunfal em Jerusalém',
    category: 'novo-testamento',
    triggers: /\b(entrada\s+triunfal|triumphal\s+entry|domingo\s+de\s+ramos|palm\s+sunday|hosana|ramos\s+de\s+palmeira|montado\s+no\s+jumentinho|porta\s+dourada)\b/i,
    storySubjectEn: "Jesus Christ riding into Jerusalem with humility and majestic gentleness",
    ultraRealisticBackgroundEn: "background of the ancient stone path descending the Mount of Olives lined with vibrant green date palm fronds and ancient olive groves, panoramic sweeping view of the golden limestone walls of ancient Jerusalem, the eastern Golden Gate bathed in crisp morning Mediterranean sunlight, joyful festive biblical atmosphere",
    modestyRequired: false
  },

  // 24. A ÚLTIMA CEIA NO CENÁCULO
  {
    id: 'ultima-ceia-cenaculo',
    title: 'A Última Ceia no Cenáculo',
    category: 'novo-testamento',
    triggers: /\b(ultima\s+ceia|last\s+supper|cenaculo|upper\s+room|partir\s+do\s+pao|calice\s+da\s+alianca|lava-pes)\b/i,
    storySubjectEn: "Jesus Christ breaking bread and sharing the cup with His beloved disciples",
    ultraRealisticBackgroundEn: "background of an authentic ancient Jerusalem upper room with vaulted limestone arches, rustic open stone windows showing warm golden dusk sky over ancient Jerusalem rooftops, low rustic cedar banquet table draped in pure unbleached linen, ancient clay oil lamps and soft warm candlelight casting intimate glow on natural stone walls",
    modestyRequired: false
  },

  // 25. JARDIM DO GETSÊMANI / ORAÇÃO DE JESUS
  {
    id: 'jardim-getsemani',
    title: 'Jardim do Getsêmani ao Luar',
    category: 'novo-testamento',
    triggers: /\b(getsemani|gethsemane|jardim\s+das\s+oliveiras|jardim\s+do\s+getsemani|calice\s+amargo|oracao\s+no\s+getsemani|suor\s+de\s+sangue)\b/i,
    storySubjectEn: "Jesus Christ kneeling in deep fervent prayer beside ancient stone outcroppings",
    ultraRealisticBackgroundEn: "background of the sacred Garden of Gethsemane filled with ancient gnarled centuries-old olive trees, luminous silver full moonlight filtering through silver-green olive foliage under a pristine starry night sky, soft ethereal mist hovering above natural stone pathway, deep solemn reverence, breathtaking nocturnal atmosphere",
    modestyRequired: false
  },

  // 26. CRUCIFICAÇÃO NO MONTE CALVÁRIO / GÓLGOTA (SEMPRE CRUZ VAZIA DE RESSURREIÇÃO)
  {
    id: 'cruz-monte-calvario-golgota',
    title: 'Cruz no Monte Calvário (Gólgota)',
    category: 'novo-testamento',
    triggers: /\b(cruz|cross|crucifica|crucifixo|calvario|calvary|golgota|golgotha|esta\s+consumado|it\s+is\s+finished)\b/i,
    storySubjectEn: "The solitary, completely empty rugged weathered wooden Christian cross standing tall on the sacred rocky mount, with zero bodies, no person and no Christ hanging on the cross, pure unoccupied cross of resurrection",
    ultraRealisticBackgroundEn: "background of the rocky windswept summit of Mount Calvary (Golgotha) at dramatic late afternoon sunset, breathtaking fiery amber, deep crimson and violet volumetric light rays piercing through heavy parted stormy clouds, distant rugged Judean mountain ridges, awe-inspiring sacred atmosphere, photorealistic cinematic lighting",
    modestyRequired: false
  },

  // 27. A RESSURREIÇÃO E O TÚMULO VAZIO
  {
    id: 'ressurreicao-tumulo-vazio',
    title: 'A Ressurreição e o Túmulo Vazio',
    category: 'novo-testamento',
    triggers: /\b(ressurrei|resurrection|tumulo\s+vazio|empty\s+tomb|sepulcro\s+vazio|sepulcro|pedra\s+rolada|rolled\s+stone|ele\s+vive|he\s+is\s+risen|ressuscitou|ressurreto)\b/i,
    storySubjectEn: "The triumphant Risen Lord radiating celestial light beside the opened tomb",
    ultraRealisticBackgroundEn: "background of a peaceful blossoming spring garden outside Jerusalem at early dawn, an ancient rock-carved tomb with the colossal round stone rolled completely away from the entrance, radiant warm golden celestial light pouring forth from within the empty tomb, morning dew glistening on olive leaves and white wild lilies, breathtaking pastel sunrise sky, ultra-photorealistic depth",
    modestyRequired: false
  },

  // 28. A ASCENSÃO NO MONTE DAS OLIVEIRAS
  {
    id: 'ascensao-jesus',
    title: 'A Ascensão no Monte das Oliveiras',
    category: 'novo-testamento',
    triggers: /\b(ascensao|ascension|subiu\s+aos\s+ceus|elevado\s+ao\s+ceu|nuvem\s+de\s+gloria)\b/i,
    storySubjectEn: "Jesus Christ ascending into the heavens surrounded by radiant divine glory",
    ultraRealisticBackgroundEn: "background of the high summit of the Mount of Olives overlooking Jerusalem and the Kidron Valley, vast majestic open sky filled with luminous golden and white heavenly clouds, divine volumetric shafts of brilliant celestial sunlight beaming downward, breathtaking panoramic vista, heavenly awe",
    modestyRequired: false
  },

  // 29. PENTECOSTES E O DERRAMAMENTO DO ESPÍRITO SANTO
  {
    id: 'pentecostes-espirito-santo',
    title: 'Pentecostes e o Espírito Santo',
    category: 'novo-testamento',
    triggers: /\b(pentecostes|pentecost|espirito\s+santo|holy\s+spirit|linguas\s+de\s+fogo|tongues\s+of\s+fire|vento\s+veemente|cenaculo\s+cheio)\b/i,
    storySubjectEn: "The disciples gathered in unified prayer with gentle tongues of divine fire resting above them",
    ultraRealisticBackgroundEn: "background of an authentic Jerusalem limestone upper chamber with tall arched windows, ethereal golden heavenly breeze stirring clean linen drapes, soft radiant divine light permeating the sacred space, warm amber architectural glow, deeply spiritual sacred atmosphere",
    modestyRequired: false
  },

  // 30. APOCALIPSE E A NOVA JERUSALÉM CELESTIAL
  {
    id: 'apocalipse-nova-jerusalem',
    title: 'A Nova Jerusalém Celestial e o Rio da Vida',
    category: 'paisagens-sagradas',
    triggers: /\b(apocalipse|revelation|nova\s+jerusalem|new\s+jerusalem|rio\s+da\s+vida|river\s+of\s+life|arvore\s+da\s+vida|tree\s+of\s+life|cidade\s+celestial|trono\s+de\s+deus|ruas\s+de\s+ouro|mar\s+de\s+vidro)\b/i,
    storySubjectEn: "The majestic celestial vision of the heavenly city of God",
    ultraRealisticBackgroundEn: "background of the magnificent celestial New Jerusalem, monumental crystalline gold architecture and translucent jasper walls gleaming with divine radiance, the crystal-clear River of the Water of Life flowing through lush verdant banks lined with flourishing Trees of Life bearing vibrant fruit, perpetual celestial dawn with pure golden divine luminescence without shadow, breathtaking heavenly panorama",
    modestyRequired: false
  }
];

/**
 * Analisa o prompt do usuário e retorna a correspondência exata do fundo bíblico.
 * Se nenhuma história individual for detectada, retorna o fundo bíblico panorâmico ultra-realista da Terra Santa.
 */
export function resolveBiblicalBackground(userPrompt: string): BiblicalBackgroundMatch {
  const clean = (userPrompt || "")
    .replace(/\[Modo:[^\]]+\]/gi, "")
    .replace(/\[Arquivo:[^\]]+\]/gi, "")
    .replace(/\[Estilo:[^\]]+\]/gi, "")
    .trim();

  const normalized = normalizeText(clean);

  // 1. Procurar nas definições determinísticas
  for (const item of BIBLICAL_BACKGROUNDS) {
    if (item.triggers.test(normalized) || item.triggers.test(clean)) {
      const modestyNotice = item.modestyRequired
        ? ", both fully clothed wearing modest ancient biblical pure unbleached linen tunics, reverent and dignified"
        : "";

      return {
        matchedStory: item.title,
        storySubjectEn: item.storySubjectEn,
        ultraRealisticBackgroundEn: item.ultraRealisticBackgroundEn,
        fullComposedPrompt: `${item.storySubjectEn}${modestyNotice}, ${item.ultraRealisticBackgroundEn}`,
        modestyRequired: !!item.modestyRequired
      };
    }
  }

  // 2. Fallback: Fundo bíblico geral ultra-realista
  return {
    matchedStory: "Paisagem Bíblica Sagrada da Terra Santa",
    storySubjectEn: clean || "Reverent biblical scene",
    ultraRealisticBackgroundEn: DEFAULT_ULTRA_REALISTIC_BACKGROUND,
    fullComposedPrompt: `${clean || "Reverent biblical scene"}, ${DEFAULT_ULTRA_REALISTIC_BACKGROUND}`,
    modestyRequired: /adao|adam|eva\b|eve\b/i.test(normalized)
  };
}

/**
 * Construtor Mestre de Prompts Ultra-Realistas para o Chat de Imagens
 * Lê o pedido do usuário, determina o fundo exato da história bíblica correspondente
 * e combina com o estilo artístico selecionado.
 */
export function buildUltraRealisticChatPrompt(userPrompt: string, styleEn: string = ""): {
  finalPrompt: string;
  matchedStory: string;
  isAdamAndEve: boolean;
} {
  const match = resolveBiblicalBackground(userPrompt);
  
  // Limpeza de prompt do usuário para extrair o sujeito em inglês se houver
  let userSubject = userPrompt
    .replace(/\[Modo:[^\]]+\]/gi, "")
    .replace(/\[Arquivo:[^\]]+\]/gi, "")
    .replace(/\[Estilo:[^\]]+\]/gi, "")
    .trim();

  // Tradução básica de entidades frequentes para enriquecer a menção
  const translatedSubject = userSubject
    .replace(/\bad[aã]o\b/gi, 'Adam')
    .replace(/\beva\b/gi, 'Eve')
    .replace(/\bjardim\s+do\s+[eé]den\b/gi, 'Garden of Eden')
    .replace(/\bpara[ií]so\b/gi, 'Paradise Eden')
    .replace(/\btorre\s+de\s+babel\b/gi, 'Tower of Babel')
    .replace(/\bmar\s+vermelho\b/gi, 'Red Sea')
    .replace(/\bmois[eé]s\b/gi, 'Moses')
    .replace(/\bdavi\s+e\s+golias\b/gi, 'David and Goliath')
    .replace(/\bdavi\b/gi, 'David')
    .replace(/\bgolias\b/gi, 'Goliath')
    .replace(/\barca\s+de\s+no[eé]\b/gi, "Noah's Ark")
    .replace(/\bno[eé]\b/gi, 'Noah')
    .replace(/\bjesus(\s+cristo)?\b/gi, 'Jesus Christ')
    .replace(/\bressurrei[cç][aã]o\b/gi, 'Resurrection')
    .replace(/\bt[uú]mulo\s+vazio\b/gi, 'Empty Tomb');

  let finalPrompt = `${translatedSubject}, ${match.ultraRealisticBackgroundEn}`;

  // Se a história combinada tiver sujeito específico e o usuário pediu algo curto, reforçar o sujeito
  if (match.storySubjectEn && match.matchedStory !== "Paisagem Bíblica Sagrada da Terra Santa") {
    finalPrompt = `${translatedSubject}, ${match.storySubjectEn}, ${match.ultraRealisticBackgroundEn}`;
  }

  // Regra inviolável de decência: Adão e Eva com roupas obrigatórias, homem de cabelo curto e mulher, sem alterar o fundo
  const isAdamAndEve = match.modestyRequired || 
    (/\b(ad[aã]o|adam)\b.*\b(eva|eve)\b|\b(eva|eve)\b.*\b(ad[aã]o|adam)\b/i.test(userPrompt)) ||
    (/\b(adao|adam)\b/i.test(normalizeText(userPrompt)) && /\b(eva|eve)\b/i.test(normalizeText(userPrompt))) ||
    (/\b(adao|adam)\b/i.test(normalizeText(userPrompt))) ||
    (/\b(eva|eve)\b/i.test(normalizeText(userPrompt)));

  if (isAdamAndEve) {
    if (!/neat short hair|short hair/i.test(finalPrompt)) {
      finalPrompt += ", depicting a man with neat short hair (Adam) and a woman (Eve), both mandatorily and strictly fully clothed wearing modest ancient biblical linen tunics, dignified, reverent, zero nudity, 100% clothed";
    }
  }

  // Regra absoluta inviolável: Quando gerar uma cruz no chat, NÃO PODE ter Cristo pendurado, somente a cruz vazia de madeira
  const isCrossPrompt = match.id === 'cruz-monte-calvario-golgota' ||
    /\b(cruz|cruzes|cross|crosses|crucif|calv[aá]rio|calvary|g[oó]lgota|golgotha)\b/i.test(userPrompt) ||
    /\b(cruz|cruzes|cross|crosses|crucif|calv[aá]rio|calvary|g[oó]lgota|golgotha)\b/i.test(translatedSubject);

  if (isCrossPrompt) {
    // Purga menções a corpo pendurado
    finalPrompt = finalPrompt
      .replace(/\b(jesus|christ|cristo)\s+(on|upon|na|no|sobre\s+a|hanging\s+on)\s+(the\s+)?(cross|cruz)\b/gi, 'empty wooden cross')
      .replace(/\b(crucificado|crucified|pregad[oa]|hanging\s+body|pendurad[oa])\b/gi, '');

    if (!/empty wooden cross|empty cross|completely empty|vacant/i.test(finalPrompt)) {
      finalPrompt += ", depicting strictly an empty wooden cross, solitary empty cross, completely vacant wooden cross standing tall, no body on the cross, no Jesus hanging, no corpse on cross, no human figure on the cross, unoccupied sacred Christian cross of resurrection and victory";
    }
  }

  // Adicionar o estilo visual se especificado
  if (styleEn) {
    finalPrompt += `, ${styleEn}`;
  }

  // Limpeza de vírgulas duplicadas
  finalPrompt = finalPrompt
    .replace(/,\s*,+/g, ',')
    .replace(/^\s*,\s*|\s*,\s*$/g, '')
    .trim();

  return {
    finalPrompt,
    matchedStory: match.matchedStory,
    isAdamAndEve,
    isCrossPrompt
  };
}
