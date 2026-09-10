export interface BibleBook {
  name: string;
  abbrev: string;
  chapters: number;
  testament: 'old' | 'new';
}

export const bibleBooks: BibleBook[] = [
  // Antigo Testamento
  { name: 'Gênesis', abbrev: 'gn', chapters: 50, testament: 'old' },
  { name: 'Êxodo', abbrev: 'ex', chapters: 40, testament: 'old' },
  { name: 'Levítico', abbrev: 'lv', chapters: 27, testament: 'old' },
  { name: 'Números', abbrev: 'nm', chapters: 36, testament: 'old' },
  { name: 'Deuteronômio', abbrev: 'dt', chapters: 34, testament: 'old' },
  { name: 'Josué', abbrev: 'js', chapters: 24, testament: 'old' },
  { name: 'Juízes', abbrev: 'jz', chapters: 21, testament: 'old' },
  { name: 'Rute', abbrev: 'rt', chapters: 4, testament: 'old' },
  { name: '1 Samuel', abbrev: '1sm', chapters: 31, testament: 'old' },
  { name: '2 Samuel', abbrev: '2sm', chapters: 24, testament: 'old' },
  { name: '1 Reis', abbrev: '1rs', chapters: 22, testament: 'old' },
  { name: '2 Reis', abbrev: '2rs', chapters: 25, testament: 'old' },
  { name: '1 Crônicas', abbrev: '1cr', chapters: 29, testament: 'old' },
  { name: '2 Crônicas', abbrev: '2cr', chapters: 36, testament: 'old' },
  { name: 'Esdras', abbrev: 'ed', chapters: 10, testament: 'old' },
  { name: 'Neemias', abbrev: 'ne', chapters: 13, testament: 'old' },
  { name: 'Ester', abbrev: 'et', chapters: 10, testament: 'old' },
  { name: 'Jó', abbrev: 'job', chapters: 42, testament: 'old' },
  { name: 'Salmos', abbrev: 'sl', chapters: 150, testament: 'old' },
  { name: 'Provérbios', abbrev: 'pv', chapters: 31, testament: 'old' },
  { name: 'Eclesiastes', abbrev: 'ec', chapters: 12, testament: 'old' },
  { name: 'Cânticos', abbrev: 'ct', chapters: 8, testament: 'old' },
  { name: 'Isaías', abbrev: 'is', chapters: 66, testament: 'old' },
  { name: 'Jeremias', abbrev: 'jr', chapters: 52, testament: 'old' },
  { name: 'Lamentações', abbrev: 'lm', chapters: 5, testament: 'old' },
  { name: 'Ezequiel', abbrev: 'ez', chapters: 48, testament: 'old' },
  { name: 'Daniel', abbrev: 'dn', chapters: 12, testament: 'old' },
  { name: 'Oséias', abbrev: 'os', chapters: 14, testament: 'old' },
  { name: 'Joel', abbrev: 'jl', chapters: 3, testament: 'old' },
  { name: 'Amós', abbrev: 'am', chapters: 9, testament: 'old' },
  { name: 'Obadias', abbrev: 'ob', chapters: 1, testament: 'old' },
  { name: 'Jonas', abbrev: 'jn', chapters: 4, testament: 'old' },
  { name: 'Miquéias', abbrev: 'mq', chapters: 7, testament: 'old' },
  { name: 'Naum', abbrev: 'na', chapters: 3, testament: 'old' },
  { name: 'Habacuque', abbrev: 'hc', chapters: 3, testament: 'old' },
  { name: 'Sofonias', abbrev: 'sf', chapters: 3, testament: 'old' },
  { name: 'Ageu', abbrev: 'ag', chapters: 2, testament: 'old' },
  { name: 'Zacarias', abbrev: 'zc', chapters: 14, testament: 'old' },
  { name: 'Malaquias', abbrev: 'ml', chapters: 4, testament: 'old' },
  // Novo Testamento
  { name: 'Mateus', abbrev: 'mt', chapters: 28, testament: 'new' },
  { name: 'Marcos', abbrev: 'mc', chapters: 16, testament: 'new' },
  { name: 'Lucas', abbrev: 'lc', chapters: 24, testament: 'new' },
  { name: 'João', abbrev: 'jo', chapters: 21, testament: 'new' },
  { name: 'Atos', abbrev: 'at', chapters: 28, testament: 'new' },
  { name: 'Romanos', abbrev: 'rm', chapters: 16, testament: 'new' },
  { name: '1 Coríntios', abbrev: '1co', chapters: 16, testament: 'new' },
  { name: '2 Coríntios', abbrev: '2co', chapters: 13, testament: 'new' },
  { name: 'Gálatas', abbrev: 'gl', chapters: 6, testament: 'new' },
  { name: 'Efésios', abbrev: 'ef', chapters: 6, testament: 'new' },
  { name: 'Filipenses', abbrev: 'fp', chapters: 4, testament: 'new' },
  { name: 'Colossenses', abbrev: 'cl', chapters: 4, testament: 'new' },
  { name: '1 Tessalonicenses', abbrev: '1ts', chapters: 5, testament: 'new' },
  { name: '2 Tessalonicenses', abbrev: '2ts', chapters: 3, testament: 'new' },
  { name: '1 Timóteo', abbrev: '1tm', chapters: 6, testament: 'new' },
  { name: '2 Timóteo', abbrev: '2tm', chapters: 4, testament: 'new' },
  { name: 'Tito', abbrev: 'tt', chapters: 3, testament: 'new' },
  { name: 'Filemom', abbrev: 'fm', chapters: 1, testament: 'new' },
  { name: 'Hebreus', abbrev: 'hb', chapters: 13, testament: 'new' },
  { name: 'Tiago', abbrev: 'tg', chapters: 5, testament: 'new' },
  { name: '1 Pedro', abbrev: '1pe', chapters: 5, testament: 'new' },
  { name: '2 Pedro', abbrev: '2pe', chapters: 3, testament: 'new' },
  { name: '1 João', abbrev: '1jo', chapters: 5, testament: 'new' },
  { name: '2 João', abbrev: '2jo', chapters: 1, testament: 'new' },
  { name: '3 João', abbrev: '3jo', chapters: 1, testament: 'new' },
  { name: 'Judas', abbrev: 'jd', chapters: 1, testament: 'new' },
  { name: 'Apocalipse', abbrev: 'ap', chapters: 22, testament: 'new' },
];

export interface BibleTranslation {
  id: string;
  name: string;
  language: 'pt' | 'en';
}

export const translations: BibleTranslation[] = [
  { id: 'almeida', name: 'Bíblia Sagrada de Almeida 1980', language: 'pt' },
  { id: 'blivre', name: 'Bíblia Livre 2018', language: 'pt' },
  { id: 'bbe', name: 'Bible in Basic English', language: 'en' },
  { id: 'kjv', name: 'King James Version', language: 'en' },
  { id: 'web', name: 'World English Bible', language: 'en' },
];

// ── Bible API book name mappings ──
// bible-api.com uses English names; we try multiple variants for reliability.
const apiBookNames: Record<string, string[]> = {
  'gn': ['Genesis', 'Gênesis'], 'ex': ['Exodus', 'Êxodo'], 'lv': ['Leviticus', 'Levítico'],
  'nm': ['Numbers', 'Números'], 'dt': ['Deuteronomy', 'Deuteronômio'],
  'js': ['Joshua', 'Josué'], 'jz': ['Judges', 'Juízes'], 'rt': ['Ruth', 'Rute'],
  '1sm': ['1 Samuel', '1Samuel'], '2sm': ['2 Samuel', '2Samuel'],
  '1rs': ['1 Kings', '1Kings', '1 Reis'], '2rs': ['2 Kings', '2Kings', '2 Reis'],
  '1cr': ['1 Chronicles', '1Chronicles', '1 Crônicas'], '2cr': ['2 Chronicles', '2Chronicles', '2 Crônicas'],
  'ed': ['Ezra', 'Esdras'], 'ne': ['Nehemiah', 'Neemias'],
  'et': ['Esther', 'Ester'], 'job': ['Job', 'Jó'],
  'sl': ['Psalms', 'Psalm', 'Salmos'],
  'pv': ['Proverbs', 'Provérbios'], 'ec': ['Ecclesiastes', 'Eclesiastes'],
  'ct': ['Song of Solomon', 'SongOfSolomon', 'Cânticos'],
  'is': ['Isaiah', 'Isaías'], 'jr': ['Jeremiah', 'Jeremias'],
  'lm': ['Lamentations', 'Lamentações'], 'ez': ['Ezekiel', 'Ezequiel'],
  'dn': ['Daniel'],
  'os': ['Hosea', 'Oséias'], 'jl': ['Joel'], 'am': ['Amos', 'Amós'],
  'ob': ['Obadiah', 'Obadias'], 'jn': ['Jonah', 'Jonas'],
  'mq': ['Micah', 'Miquéias'], 'na': ['Nahum', 'Naum'],
  'hc': ['Habakkuk', 'Habacuque'], 'sf': ['Zephaniah', 'Sofonias'],
  'ag': ['Haggai', 'Ageu'], 'zc': ['Zechariah', 'Zacarias'],
  'ml': ['Malachi', 'Malaquias'],
  'mt': ['Matthew', 'Mateus'], 'mc': ['Mark', 'Marcos'],
  'lc': ['Luke', 'Lucas'], 'jo': ['John', 'João'],
  'at': ['Acts', 'Atos'], 'rm': ['Romans', 'Romanos'],
  '1co': ['1 Corinthians', '1Corinthians', '1 Coríntios'],
  '2co': ['2 Corinthians', '2Corinthians', '2 Coríntios'],
  'gl': ['Galatians', 'Gálatas'], 'ef': ['Ephesians', 'Efésios'],
  'fp': ['Philippians', 'Filipenses'], 'cl': ['Colossians', 'Colossenses'],
  '1ts': ['1 Thessalonians', '1Thessalonians', '1 Tessalonicenses'],
  '2ts': ['2 Thessalonians', '2Thessalonians', '2 Tessalonicenses'],
  '1tm': ['1 Timothy', '1Timothy', '1 Timóteo'],
  '2tm': ['2 Timothy', '2Timothy', '2 Timóteo'],
  'tt': ['Titus', 'Tito'], 'fm': ['Philemon', 'Filemom'],
  'hb': ['Hebrews', 'Hebreus'], 'tg': ['James', 'Tiago'],
  '1pe': ['1 Peter', '1Peter', '1 Pedro'], '2pe': ['2 Peter', '2Peter', '2 Pedro'],
  '1jo': ['1 John', '1John', '1 João'], '2jo': ['2 John', '2John', '2 João'],
  '3jo': ['3 John', '3John', '3 João'], 'jd': ['Jude', 'Judas'],
  'ap': ['Revelation', 'Apocalipse'],
};

// ── bolls.life book index (1-66 canonical order) ──
const bollsBookIndex: Record<string, number> = {
  'gn': 1, 'ex': 2, 'lv': 3, 'nm': 4, 'dt': 5,
  'js': 6, 'jz': 7, 'rt': 8, '1sm': 9, '2sm': 10,
  '1rs': 11, '2rs': 12, '1cr': 13, '2cr': 14,
  'ed': 15, 'ne': 16, 'et': 17, 'job': 18, 'sl': 19,
  'pv': 20, 'ec': 21, 'ct': 22, 'is': 23, 'jr': 24,
  'lm': 25, 'ez': 26, 'dn': 27, 'os': 28, 'jl': 29,
  'am': 30, 'ob': 31, 'jn': 32, 'mq': 33, 'na': 34,
  'hc': 35, 'sf': 36, 'ag': 37, 'zc': 38, 'ml': 39,
  'mt': 40, 'mc': 41, 'lc': 42, 'jo': 43, 'at': 44,
  'rm': 45, '1co': 46, '2co': 47, 'gl': 48, 'ef': 49,
  'fp': 50, 'cl': 51, '1ts': 52, '2ts': 53, '1tm': 54,
  '2tm': 55, 'tt': 56, 'fm': 57, 'hb': 58, 'tg': 59,
  '1pe': 60, '2pe': 61, '1jo': 62, '2jo': 63, '3jo': 64,
  'jd': 65, 'ap': 66,
};

export interface VerseData {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ChapterResponse {
  reference: string;
  verses: VerseData[];
  text: string;
}

// ── In-memory cache to avoid re-fetching ──
const chapterCache = new Map<string, ChapterResponse>();

// ── Bíblia Livre JSON cache ──
let bibliaLivreData: any[] | null = null;
let bibliaLivreLoadingPromise: Promise<any[]> | null = null;

async function loadBibliaLivre(): Promise<any[]> {
  if (bibliaLivreData) return bibliaLivreData;
  if (bibliaLivreLoadingPromise) return bibliaLivreLoadingPromise;

  bibliaLivreLoadingPromise = (async () => {
    const LOCAL_URL = '/data/biblia-livre.json';
    const GITHUB_URL = 'https://raw.githubusercontent.com/eversondeveloper/bibialivrejson/main/biblialivrecorrecao1.json';
    
    let rawText = '';

    // 1. Tenta carregar do arquivo local do próprio app (alta velocidade, mesmo domínio)
    try {
      const localRes = await fetch(LOCAL_URL);
      if (localRes.ok) {
        rawText = await localRes.text();
        // Garante no cache do ServiceWorker para leitura offline permanente
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.open('biblia-offline-data').then(c => {
            const resp = new Response(rawText, { headers: { 'Content-Type': 'application/json' } });
            c.put(LOCAL_URL, resp.clone());
            c.put(GITHUB_URL, resp);
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Aviso: Falha ao carregar /data/biblia-livre.json diretamente:", err);
    }

    // 2. Se offline ou falha de rede, tenta os caches locais do navegador (PWA / CacheStorage)
    if (!rawText && typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('biblia-offline-data');
        const cached = (await cache.match(LOCAL_URL, { ignoreSearch: true })) ||
                       (await cache.match(GITHUB_URL, { ignoreSearch: true }));
        if (cached) {
          rawText = await cached.text();
        }
      } catch (cacheErr) {
        console.warn("Aviso ao acessar cache offline do navegador:", cacheErr);
      }
    }

    // 3. Fallback externo (GitHub raw)
    if (!rawText) {
      try {
        const gitRes = await fetch(GITHUB_URL);
        if (gitRes.ok) {
          rawText = await gitRes.text();
        }
      } catch (gitErr) {
        console.warn("Aviso: Falha ao carregar Bíblia Livre do GitHub:", gitErr);
      }
    }

    if (!rawText) {
      throw new Error('OFFLINE_DATA_MISSING: Sem conexão e dados offline não encontrados.');
    }

    try {
      const data = JSON.parse(rawText);
      const books = Array.isArray(data) ? (data[0]?.abrev ? data : data.slice(1)) : data;
      bibliaLivreData = books.map((b: any, index: number) => ({
        abrev: (bibleBooks[index]?.abbrev || b.abrev || '').toLowerCase().replace(/\s+/g, ''),
        nome: bibleBooks[index]?.name || b.nome || b.name || b.book || '',
        capitulos: b.capitulos || b.chapters
      })).filter((item: any) => item.capitulos && item.abrev);

      return bibliaLivreData;
    } catch (e) {
      console.error("Erro ao fazer parse da Bíblia Livre:", e);
      throw new Error('OFFLINE_DATA_MISSING: Sem conexão e dados offline não encontrados.');
    } finally {
      bibliaLivreLoadingPromise = null;
    }
  })();

  return bibliaLivreLoadingPromise;
}

// ── Bíblia Livre fetch ──
async function fetchFromBibliaLivre(
  abbrev: string,
  chapter: number
): Promise<ChapterResponse> {
  const data = await loadBibliaLivre();
  const cleanKey = abbrev.toLowerCase().replace(/\s+/g, '');
  
  const bookEntry = data.find((b: any) => 
    b.abrev === cleanKey || 
    b.nome?.toLowerCase() === cleanKey
  );
  if (!bookEntry) throw new Error(`Livro ${abbrev} não encontrado na Bíblia Livre`);

  const chapterIndex = chapter - 1;
  const verses = bookEntry.capitulos[chapterIndex];
  if (!verses?.length) throw new Error('Capítulo não encontrado');

  const book = bibleBooks.find(b => b.abbrev.toLowerCase() === cleanKey);
  const bookName = book?.name || bookEntry.nome;

  const cleanHtml = (str: string) => (str || '').replace(/<[^>]*>/g, '').trim();

  return {
    reference: `${bookName} ${chapter}`,
    verses: verses.map((text: string, i: number) => ({
      book_name: bookName,
      chapter,
      verse: i + 1,
      text: cleanHtml(text),
    })),
    text: verses.map((t: string) => cleanHtml(t)).join(' '),
  };
}

// ── Primary: bible-api.com ──
async function fetchFromBibleApi(
  abbrev: string,
  chapter: number,
  translation: string
): Promise<ChapterResponse> {
  const names = apiBookNames[abbrev];
  if (!names) throw new Error('Livro não encontrado');

  for (const apiName of names) {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(apiName)}+${chapter}?translation=${translation}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error || !data.verses?.length) continue;

      return {
        reference: data.reference || `${apiName} ${chapter}`,
        verses: data.verses.map((v: any) => ({
          book_name: v.book_name || apiName,
          chapter: v.chapter ?? chapter,
          verse: v.verse,
          text: v.text,
        })),
        text: data.text || '',
      };
    } catch (err: any) {
      console.warn(`[BibleAPI] Falha ao buscar em ${apiName}:`, err.message);
      continue;
    }
  }

  throw new Error('Não foi possível carregar versículos');
}

// ── Fallback: bolls.life (ACF — Almeida Corrigida Fiel) ──
async function fetchFromBolls(
  abbrev: string,
  chapter: number
): Promise<ChapterResponse> {
  const bookId = bollsBookIndex[abbrev];
  if (!bookId) throw new Error('Livro não encontrado');

  const book = bibleBooks.find(b => b.abbrev === abbrev);
  const bookName = book?.name || abbrev;

  try {
    const url = `https://bolls.life/get-text/ARC09/${bookId}/${chapter}/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Não foi possível carregar o capítulo');

    const data: Array<{ verse: number; text: string }> = await res.json();
    if (!data?.length) throw new Error('Capítulo não encontrado');

    const cleanHtml = (str: string) => (str || '').replace(/<[^>]*>/g, '').trim();

    return {
      reference: `${bookName} ${chapter}`,
      verses: data.map((v) => ({
        book_name: bookName,
        chapter,
        verse: v.verse,
        text: cleanHtml(v.text),
      })),
      text: data.map(v => cleanHtml(v.text)).join(' '),
    };
  } catch (err: any) {
    console.error('[Bolls API Error]:', err.message);
    throw new Error('Erro ao carregar versículos da Bíblia.');
  }
}

// ── Public API: fetchChapter with cache + multi-source fallback ──
export async function fetchChapter(
  abbrev: string,
  chapter: number,
  translation: string = 'almeida'
): Promise<ChapterResponse> {
  const cacheKey = `${abbrev}:${chapter}:${translation}`;
  const cached = chapterCache.get(cacheKey);
  if (cached) return cached;

  // Se o usuário solicitou Bíblia Livre (offline first):
  if (translation === 'blivre') {
    try {
      const result = await fetchFromBibliaLivre(abbrev, chapter);
      chapterCache.set(cacheKey, result);
      return result;
    } catch (e: any) {
      console.warn(`[fetchChapter] Bíblia Livre local falhou (${e?.message}), tentando redundância online:`);
      try {
        const result = await fetchFromBibleApi(abbrev, chapter, 'almeida');
        chapterCache.set(cacheKey, result);
        return result;
      } catch {
        try {
          const result = await fetchFromBolls(abbrev, chapter);
          chapterCache.set(cacheKey, result);
          return result;
        } catch {}
      }
      throw new Error('OFFLINE_DATA_MISSING: Sem conexão e dados offline não encontrados.');
    }
  }

  // Para outras traduções (Almeida, KJV, etc):
  const isPortuguese = translation === 'almeida';

  // 1ª Camada: bible-api.com
  try {
    const result = await fetchFromBibleApi(abbrev, chapter, translation);
    chapterCache.set(cacheKey, result);
    return result;
  } catch {
    // Falha na API primária
  }

  // 2ª Camada: bolls.life (ARC09) para português
  if (isPortuguese) {
    try {
      const result = await fetchFromBolls(abbrev, chapter);
      chapterCache.set(cacheKey, result);
      return result;
    } catch {
      // Falha na API secundária
    }
  }

  // 3ª Camada: Bíblia Livre offline (banco de dados completo local)
  try {
    const result = await fetchFromBibliaLivre(abbrev, chapter);
    chapterCache.set(cacheKey, result);
    return result;
  } catch {}

  throw new Error('OFFLINE_DATA_MISSING: Sem conexão e dados offline não encontrados.');
}

// ── Public API: fetchVerse (single verse) ──
export async function fetchVerse(
  abbrev: string,
  chapter: number,
  verse: number,
  translation: string = 'almeida'
): Promise<VerseData> {
  // Reuse the chapter fetch (cached) and extract the verse
  const chapterData = await fetchChapter(abbrev, chapter, translation);
  const found = chapterData.verses.find(v => v.verse === verse);
  if (found) return found;

  throw new Error('Versículo não encontrado');
}

export function getBookByAbbrev(abbrev: string): BibleBook | undefined {
  return bibleBooks.find(b => b.abbrev === abbrev);
}
