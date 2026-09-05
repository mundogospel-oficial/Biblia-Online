export interface BiblicalSituation {
  id: string;
  title: string;
  category: 'cruzes' | 'cenarios' | 'simbolos' | 'personagens';
  categoryLabel: string;
  description: string;
  prompt: string;
  directEnglishPrompt: string;
  requiresHuman: boolean;
  badge: string;
}

export const BIBLICAL_SITUATION_CATEGORIES = [
  { id: 'todas', label: 'Todas as Situações' },
  { id: 'cruzes', label: '✝️ Cruzes & Gólgota (Sem Pessoas)' },
  { id: 'cenarios', label: '🌄 Cenários & Sepulcro (Sem Pessoas)' },
  { id: 'simbolos', label: '👑 Símbolos & Animais (Sem Pessoas)' },
  { id: 'personagens', label: '👤 Personagens Bíblicos Fidedignos' }
] as const;

export const BIBLICAL_SITUATIONS: BiblicalSituation[] = [
  // 1. CRÚZES E GÓLGOTA (SEM PESSOAS)
  {
    id: 'cruz-por-do-sol',
    title: 'Cruz de Cristo ao Pôr do Sol',
    category: 'cruzes',
    categoryLabel: 'Cruzes & Gólgota',
    description: 'Cruz de madeira rústica solitária no Monte Calvário ao pôr do sol dourado',
    prompt: 'Cruz de madeira rústica solitária no Monte Calvário ao pôr do sol dourado, céu dramático com raios de luz divina, sem pessoas',
    directEnglishPrompt: 'A solitary, empty, rugged weathered wooden Christian cross standing tall on the rocky hill of Golgotha at dramatic golden hour sunset, breathtaking fiery orange and amber volumetric light rays piercing through parted clouds, empty landscape, no people, no humans, no woman, no man, no human figures, no faces, no hands, ultra-photorealistic masterwork, 8k uhd resolution, cinematic lighting, tack-sharp focus, edge-to-edge bleed',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'cruz-luz-celestial',
    title: 'Cruz sob Raios de Glória',
    category: 'cruzes',
    categoryLabel: 'Cruzes & Gólgota',
    description: 'Cruz de madeira no topo da montanha com feixes celestiais de luz divina',
    prompt: 'Cruz de madeira antiga iluminada por poderosos raios de luz celestial descendo do céu azul profundo, montanha serena, sem pessoas',
    directEnglishPrompt: 'A solitary rugged ancient wooden cross atop a serene hill, powerful dramatic celestial god rays of radiant golden white light beaming down from parting heavenly clouds in deep blue sky, empty tranquil landscape, no people, no humans, no woman, no man, no faces, tack-sharp focus, ultra-photorealistic 8k, edge-to-edge, full bleed',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'cruz-amanhecer-nevoa',
    title: 'Cruz ao Amanhecer Sereno',
    category: 'cruzes',
    categoryLabel: 'Cruzes & Gólgota',
    description: 'Cruz no nascer do sol com névoa mística e atmosfera de paz e ressurreição',
    prompt: 'Cruz de madeira rústica ao nascer do sol celestial com névoa suave matinal sobre colinas da Judeia, atmosfera de paz, sem pessoas',
    directEnglishPrompt: 'A solitary weathered wooden Christian cross at peaceful sunrise on Judean hills, soft morning golden mist, tranquil dawn sky with warm pastel pink and gold hues, empty scenic nature, no people, no humans, no faces, photorealistic 8k, tack-sharp focus, full bleed edge-to-edge',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'altar-pedras-cruz',
    title: 'Altar de Pedras e Cruz',
    category: 'cruzes',
    categoryLabel: 'Cruzes & Gólgota',
    description: 'Altar bíblico de pedras brutas com cruz ao fundo sob céu estrelado',
    prompt: 'Altar sagrado de pedras rústicas não lavradas no deserto com cruz de madeira rústica ao fundo sob céu estrelado límpido, sem pessoas',
    directEnglishPrompt: 'An ancient biblical stone altar made of unhewn natural stones in desert landscape, solitary weathered wooden cross standing on distant ridge under pristine starry night sky with Milky Way, sacred quiet atmosphere, no people, no humans, no woman, no man, no faces, 8k resolution, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },

  // 2. CENÁRIOS E SEPULCRO (SEM PESSOAS)
  {
    id: 'tumulo-vazio-ressurreicao',
    title: 'O Túmulo Vazio e a Pedra Rolada',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Sepulcro esculpido na rocha aberto com a pedra redonda rolada e lençóis de linho',
    prompt: 'Túmulo bíblico esculpido na rocha aberto e vazio, a grande pedra redonda rolada para o lado, lençóis de linho dobrados na laje, luz celestial dourada saindo do sepulcro ao amanhecer, sem pessoas',
    directEnglishPrompt: 'The empty tomb of Jesus Christ carved into ancient rock, massive round stone rolled away from the entrance, folded white linen burial cloths resting on stone bench inside, radiant golden celestial light emanating from within the empty tomb at sunrise, garden flowers outside, no people, no humans, no woman, no man, no faces, no hands, ultra-photorealistic 8k uhd, cinematic lighting, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'mar-vermelho-aberto',
    title: 'Abertura do Mar Vermelho',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Muralhas colossais de água cristalina divididas com solo seco',
    prompt: 'As águas do Mar Vermelho abertas formando colossais paredes de água cristalina límpida, caminho de solo seco no leito do mar iluminado por coluna de luz celestial, sem pessoas',
    directEnglishPrompt: 'The miraculous parting of the Red Sea, towering colossal vertical walls of surging crystal-clear turquoise ocean water on both sides, wide dry seabed pathway illuminated by a pillar of divine celestial light, epic dramatic biblical atmosphere, no people, no humans, no faces, no figures, cinematic 8k resolution, tack-sharp focus, wide angle masterwork',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'monte-sinai-gloria',
    title: 'Monte Sinai sob Glória Divina',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Pico colossal rochoso do Monte Sinai envolto em nuvens sagradas e relâmpagos',
    prompt: 'O colossal pico rochoso do Monte Sinai envolto em densas nuvens de glória divina, raios dourados e fogo celestial no cume, paisagem árida e majestosa, sem pessoas',
    directEnglishPrompt: 'Majestic jagged rocky peak of Mount Sinai surrounded by epic divine storm clouds, golden celestial fire and radiant light glowing on mountain summit, dramatic volumetric lightning, rugged arid desert mountain range, no people, no humans, no faces, no figures, 8k uhd, tack-sharp focus, epic cinematic landscape',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'getsemani-luar',
    title: 'Jardim do Getsêmani ao Luar',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Oliveiras centenárias e retorcidas sob a luz prateada da lua cheia',
    prompt: 'Oliveiras centenárias com troncos retorcidos no Jardim do Getsêmani sob a suave luz prateada da lua cheia e céu estrelado de Jerusalém, atmosfera solene e serena, sem pessoas',
    directEnglishPrompt: 'Ancient gnarled centuries-old olive trees in the Garden of Gethsemane under bright silver full moonlight and pristine starry night sky, soft ethereal mist, ancient stone pathways, deeply solemn, sacred peaceful atmosphere, no people, no humans, no faces, no figures, 8k resolution, tack-sharp focus, cinematic full bleed',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'mar-da-galileia-entardecer',
    title: 'Mar da Galileia ao Entardecer',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Águas tranquilas refletindo o pôr do sol com barco de pesca de madeira ancorado',
    prompt: 'Águas cristalinas e tranquilas do Mar da Galileia ao pôr do sol dourado, colinas suaves ao fundo, barco de pesca rústico de madeira ancorado na margem com pedras, sem pessoas',
    directEnglishPrompt: 'Calm crystal-clear waters of the Sea of Galilee at golden sunset, rolling green hills in background, solitary authentic wooden biblical fishing boat anchored near pebble shoreline, warm glowing reflections on water, peaceful spiritual atmosphere, no people, no humans, no faces, ultra-photorealistic 8k, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'jardim-eden-criacao',
    title: 'Jardim do Éden e Rio da Vida',
    category: 'cenarios',
    categoryLabel: 'Cenários & Sepulcro',
    description: 'Natureza pura da Criação com rio cristalino, árvores floridas e luz celestial',
    prompt: 'O Jardim do Éden perfeito com rio de águas puras e cristalinas, árvores verdejantes repletas de frutos, flores coloridas e raios de luz celestial da Criação, sem pessoas',
    directEnglishPrompt: 'Pristine untouched Garden of Eden paradise, crystal-clear flowing river of life, lush verdant trees with glowing fruit, vibrant blooming biblical flowers, divine rays of golden sunlight piercing the canopy, harmonious nature, no people, no humans, no woman, no man, no faces, 8k uhd masterwork, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },

  // 3. SÍMBOLOS SAGRADOS E ANIMAIS (SEM PESSOAS)
  {
    id: 'arca-da-alianca-shekinah',
    title: 'A Arca da Aliança e a Glória Shekinah',
    category: 'simbolos',
    categoryLabel: 'Símbolos & Animais',
    description: 'A Arca de ouro puro com querubins de asas abertas sob a luz divina no Tabernáculo',
    prompt: 'A Arca da Aliança revestida em ouro puro brilhante com querubins esculpidos de asas estendidas no Santo dos Santos do Tabernáculo, banhada pela nuvem de glória Shekinah, sem pessoas',
    directEnglishPrompt: 'The sacred Ark of the Covenant crafted of pure hammered gleaming gold, two sculptured cherubim with outstretched wings facing the Mercy Seat in the Holy of Holies, radiant luminous divine Shekinah glory glowing from above, rich ancient linen tapestries in background, no people, no humans, no faces, no hands, ultra-photorealistic 8k, tack-sharp focus, cinematic masterwork',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'leao-de-juda-nobre',
    title: 'O Leão de Judá Majestoso',
    category: 'simbolos',
    categoryLabel: 'Símbolos & Animais',
    description: 'Leão majestoso sobre rochas antigas sob a luz dourada do pôr do sol',
    prompt: 'O majestoso e imponente Leão da Tribo de Judá com juba farta e olhar nobre e sereno sobre rochedos antigos ao pôr do sol dourado, atmosfera divina cinematográfica, sem pessoas',
    directEnglishPrompt: 'A solitary magnificent noble Lion of Judah standing with calm sovereign authority atop ancient rugged rocks, thick luxuriant golden mane catching golden hour sunset light, clear dignified eyes, vast dramatic biblical valley in background, no people, no humans, no faces, ultra-photorealistic wildlife masterwork, 8k uhd, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'cordeiro-pastos-verdes',
    title: 'Cordeiro Santo em Pastos Verdejantes',
    category: 'simbolos',
    categoryLabel: 'Símbolos & Animais',
    description: 'Cordeiro branco e dócil repousando junto a águas mansas da Judeia',
    prompt: 'Um dócil e puro cordeiro branco descansando em pastos verdejantes e floridos junto a águas tranquilas e límpidas de um riacho, sob luz solar calorosa, sem pessoas',
    directEnglishPrompt: 'A solitary pure white innocent woolly lamb resting peacefully in lush green blooming pasture beside still crystal-clear waters, soft warm golden sunshine, picturesque Judean landscape, no people, no humans, no faces, 8k resolution, tack-sharp focus, peaceful biblical scene',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'pomba-da-paz-celeste',
    title: 'Pomba da Paz e Céus Abertos',
    category: 'simbolos',
    categoryLabel: 'Símbolos & Animais',
    description: 'Pomba branca voando sob raios celestiais dourados entre nuvens de glória',
    prompt: 'Pomba branca pura voando com asas abertas sob feixes de luz celestial dourada descendo de céus abertos entre nuvens resplandecentes, sem pessoas',
    directEnglishPrompt: 'A solitary pure white dove in flight with graceful outstretched wings, illuminated by brilliant celestial golden light rays bursting through majestic parting clouds, radiant spiritual halo of light, no people, no humans, no faces, ultra-photorealistic 8k, tack-sharp focus, edge-to-edge bleed',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },
  {
    id: 'menora-templo-ouro',
    title: 'A Menorá Sagrada no Templo',
    category: 'simbolos',
    categoryLabel: 'Símbolos & Animais',
    description: 'Candelabro sagrado de ouro puro com sete chamas vivas de azeite',
    prompt: 'A sagrada Menorá de ouro puro batido com seus sete braços e chamas vivas acesas com azeite de oliva no interior de pedra do templo antigo, iluminação acolhedora e solene, sem pessoas',
    directEnglishPrompt: 'The sacred golden Menorah of beaten pure gold, seven burning flames with natural olive oil illumination, ancient temple stone altar room with warm flickering candlelight, golden reflections, solemn reverence, no people, no humans, no faces, no hands, ultra-photorealistic 8k, tack-sharp focus',
    requiresHuman: false,
    badge: 'Sem Pessoas'
  },

  // 4. PERSONAGENS BÍBLICOS (FIDEDIGNOS E HISTÓRICOS - COM RIGOR ANATÔMICO)
  {
    id: 'jesus-orando-getsemani',
    title: 'Jesus em Oração no Getsêmani',
    category: 'personagens',
    categoryLabel: 'Personagens Bíblicos',
    description: 'Jesus Cristo em oração fervorosa sob a luz da lua, semblante de paz e 5 dedos perfeitos',
    prompt: 'Jesus Cristo de 33 anos com túnica de linho cru do século I e manto drapeado, de joelhos em profunda oração sob a luz prateada da lua entre oliveiras, semblante sereno de paz e compaixão divina, mãos naturais com exatamente 5 dedos proporcionais em cada mão, rigor histórico bíblico',
    directEnglishPrompt: 'Jesus Christ, a 33-year-old first-century Semitic Jewish man with neat dark brown hair and natural beard, wearing an authentic seamless unbleached rustic linen tunic and draped mantle, kneeling in devout prayer in the Garden of Gethsemane under soft silver moonlight, compassionate serene expression of holy reverence and peace, anatomically flawless hands with exactly five distinct proportional fingers clasped in prayer, natural human skin texture with pores, tack-sharp focus, cinematic biblical masterpiece, 8k uhd, no mutations, no extra limbs',
    requiresHuman: true,
    badge: 'Personagem Bíblico'
  },
  {
    id: 'bom-pastor-ovelha',
    title: 'O Bom Pastor com a Ovelha',
    category: 'personagens',
    categoryLabel: 'Personagens Bíblicos',
    description: 'O Bom Pastor segurando carinhosamente a ovelha nos ombros com feições de amor',
    prompt: 'O Bom Pastor com semblante compassivo e afetuoso, túnica rústica de linho bíblico, segurando com cuidado e carinho uma ovelha dócil nos ombros, em pastos verdejantes ensolarados, mãos anatômicas perfeitas com 5 dedos naturais',
    directEnglishPrompt: 'The Good Shepherd, Semitic first-century man with warm compassionate loving gaze, authentic rustic woven wool tunic, gently carrying a docile white woolly sheep on his shoulders, sunny green hillside pasture with Judean rolling hills, anatomically perfect natural hands with exactly five fingers firmly and tenderly holding the lamb, realistic skin, photorealistic 8k uhd, tack-sharp focus',
    requiresHuman: true,
    badge: 'Personagem Bíblico'
  },
  {
    id: 'moises-tabuas-lei',
    title: 'Moisés no Monte Sinai com as Tábuas',
    category: 'personagens',
    categoryLabel: 'Personagens Bíblicos',
    description: 'Moisés no cume do Sinai segurando as duas tábuas de pedra com a lei de Deus',
    prompt: 'Moisés, patriarca venerável com cabelos e barba grisalha natural, túnica rústica de peregrino do deserto, segurando com firmeza as duas tábuas de pedra dos Dez Mandamentos no Monte Sinai sob céus dramáticos, semblante solene e reverente, mãos perfeitas com 5 dedos',
    directEnglishPrompt: 'Moses, venerable first-century Semitic elder with weathered dignified features and natural grey beard, rustic desert linen robes and leather sandals, holding the two stone tablets of the Ten Commandments atop Mount Sinai, dramatic sky with parted clouds and golden rays, anatomically perfect five-fingered hands gripping stone tablets, photorealistic 8k, tack-sharp focus, historical biblical accuracy',
    requiresHuman: true,
    badge: 'Personagem Bíblico'
  },
  {
    id: 'davi-pastor-harpa',
    title: 'Davi Louvando com a Harpa',
    category: 'personagens',
    categoryLabel: 'Personagens Bíblicos',
    description: 'Jovem Davi com harpa rústica de madeira louvando sob o céu estrelado',
    prompt: 'O jovem Davi pastor de ovelhas com túnica rústica simples de lã, tocando uma harpa rústica de madeira antiga em colinas de Belém sob céu noturno estrelado, olhar sincero de adoração a Deus, anatomia perfeita e mãos com 5 dedos',
    directEnglishPrompt: 'Young shepherd David with authentic ancient simple wool tunic, sitting on rocks on hills of Bethlehem under spectacular starry night sky, playing an authentic ancient wooden lyre harp, joyful reverent expression looking up in praise, anatomically perfect natural hands with five proportional fingers plucking the strings, 8k uhd photorealistic, tack-sharp focus',
    requiresHuman: true,
    badge: 'Personagem Bíblico'
  },
  {
    id: 'pessoa-adoracao-oracao',
    title: 'Cristão em Fervorosa Oração',
    category: 'personagens',
    categoryLabel: 'Personagens Bíblicos',
    description: 'Pessoa em humilde oração de joelhos sob luz celestial acolhedora',
    prompt: 'Pessoa de joelhos em sincera e humilde oração a Deus, mãos postas com respeito, sob um raio acolhedor de luz celestial dourada, semblante sereno de fé e paz, anatomia perfeita sem deformações',
    directEnglishPrompt: 'A devout worshipper kneeling in sincere humble prayer, hands clasped naturally in prayer with anatomically perfect five fingers on each hand, gentle beam of warm golden celestial light illuminating the scene, calm serene expression of faith, authentic modest biblical attire, tack-sharp focus, photorealistic 8k, no distortions',
    requiresHuman: true,
    badge: 'Personagem Bíblico'
  }
];

export interface ResolvedSubjectResult {
  englishSubject: string;
  requiresHuman: boolean;
  matchedSituation?: string;
}

/**
 * Resolução ultra-precisa e imediata de assuntos bíblicos para prompts prontos e termos comuns.
 * Garante que objetos e cenários sagrados (Cruz, Túmulo, Mar Vermelho, etc.)
 * NUNCA gerem pessoas, mulheres ou rostos aleatórios por engano.
 */
export function resolveBiblicalSituationSubject(rawPrompt: string): ResolvedSubjectResult | null {
  if (!rawPrompt) return null;
  const lower = rawPrompt.toLowerCase();

  // Limpeza de prefixos de estilo ou tags para verificação
  const clean = lower
    .replace(/\[estilo:[^\]]+\]/gi, '')
    .replace(/\[modo:[^\]]+\]/gi, '')
    .replace(/\[foco:[^\]]+\]/gi, '')
    .trim();

  // 1. Busca direta na lista de situações oficiais
  for (const sit of BIBLICAL_SITUATIONS) {
    if (clean.includes(sit.title.toLowerCase()) || clean.includes(sit.prompt.toLowerCase())) {
      return {
        englishSubject: sit.directEnglishPrompt,
        requiresHuman: sit.requiresHuman,
        matchedSituation: sit.title
      };
    }
  }

  // 2. Mapeamento determinístico de termos para garantir ZERO aleatoriedade em objetos e cenários
  const hasHumanRequest = /\b(homem|mulher|pessoa|pessoas|menino|menina|criança|apóstolo|apóstolos|discípulo|discípulos|profeta|profetas|rosto|rostos|mãos|pregado|crucificado|adão|eva)\b/i.test(clean);

  // Cruz / Calvário (sem humanos)
  if (/cruz|cross|crucifixo|calv[aá]rio|g[oó]lgota/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "A solitary, empty, rugged weathered wooden Christian cross standing tall on the rocky hill of Golgotha at dramatic golden hour sunset, breathtaking fiery orange and amber volumetric light rays piercing through parted clouds, empty landscape, no people, no humans, no woman, no man, no human figures, no faces, no hands",
      requiresHuman: false,
      matchedSituation: "Cruz de Cristo ao Pôr do Sol"
    };
  }

  // Túmulo Vazio / Ressurreição (sem humanos)
  if (/t[uú]mulo|sepulcro|ressurrei|pedra\s+rolada/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "The empty tomb of Jesus Christ carved into ancient rock, massive round stone rolled away from the entrance, folded white linen burial cloths resting on stone bench inside, radiant golden celestial light emanating from within the empty tomb at sunrise, empty garden, no people, no humans, no woman, no man, no faces",
      requiresHuman: false,
      matchedSituation: "O Túmulo Vazio e a Pedra Rolada"
    };
  }

  // Mar Vermelho (sem exército/faraó)
  if (/mar\s+vermelho|red\s+sea/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "The miraculous parting of the Red Sea, towering colossal vertical walls of surging crystal-clear turquoise ocean water on both sides, wide dry seabed pathway illuminated by a pillar of divine celestial light, no people, no humans, no faces",
      requiresHuman: false,
      matchedSituation: "Abertura do Mar Vermelho"
    };
  }

  // Monte Sinai (sem humanos)
  if (/monte\s+sinai|mount\s+sinai/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "Majestic jagged rocky peak of Mount Sinai surrounded by epic divine storm clouds, golden celestial fire and radiant light glowing on mountain summit, dramatic volumetric lightning, rugged arid desert mountain range, no people, no humans, no faces",
      requiresHuman: false,
      matchedSituation: "Monte Sinai sob Glória Divina"
    };
  }

  // Arca da Aliança
  if (/arca\s+da\s+alian[cç]a|ark\s+of\s+the\s+covenant|santo\s+dos\s+santos|shekinah/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "The sacred Ark of the Covenant crafted of pure hammered gleaming gold, two sculptured cherubim with outstretched wings facing the Mercy Seat in the Holy of Holies, radiant luminous divine Shekinah glory glowing from above, rich ancient linen tapestries in background, no people, no humans, no faces, no hands",
      requiresHuman: false,
      matchedSituation: "A Arca da Aliança e a Glória Shekinah"
    };
  }

  // Leão de Judá
  if (/le[aã]o\s+de\s+jud[aá]|lion\s+of\s+judah/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "A solitary magnificent noble Lion of Judah standing with calm sovereign authority atop ancient rugged rocks, thick luxuriant golden mane catching golden hour sunset light, clear dignified eyes, vast dramatic biblical valley in background, no people, no humans, no faces",
      requiresHuman: false,
      matchedSituation: "O Leão de Judá Majestoso"
    };
  }

  // Pomba da Paz
  if (/pomba|pomba\s+branca|pomba\s+da\s+paz|white\s+dove/i.test(clean) && !hasHumanRequest) {
    return {
      englishSubject: "A solitary pure white dove in flight with graceful outstretched wings, illuminated by brilliant celestial golden light rays bursting through majestic parting clouds, radiant spiritual halo of light, no people, no humans, no faces",
      requiresHuman: false,
      matchedSituation: "Pomba da Paz e Céus Abertos"
    };
  }

  // Jardim do Getsêmani (cenário de oliveiras sem pessoas)
  if (/gets[eê]mani|gethsemane|oliveiras/i.test(clean) && !hasHumanRequest && !/jesus|orando/i.test(clean)) {
    return {
      englishSubject: "Ancient gnarled centuries-old olive trees in the Garden of Gethsemane under bright silver full moonlight and pristine starry night sky, soft ethereal mist, ancient stone pathways, deeply solemn, sacred peaceful atmosphere, no people, no humans, no faces, no figures",
      requiresHuman: false,
      matchedSituation: "Jardim do Getsêmani ao Luar"
    };
  }

  return null;
}
