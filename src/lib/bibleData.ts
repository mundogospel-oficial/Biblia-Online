export interface BibleBook {
  name: string;
  abbrev: string;
  chapters: number;
  testament: 'old' | 'new';
  usfm: string;
}

export const bibleBooks: BibleBook[] = [
  // Antigo Testamento
  { name: 'Gênesis', abbrev: 'gn', chapters: 50, testament: 'old', usfm: 'GEN' },
  { name: 'Êxodo', abbrev: 'ex', chapters: 40, testament: 'old', usfm: 'EXO' },
  { name: 'Levítico', abbrev: 'lv', chapters: 27, testament: 'old', usfm: 'LEV' },
  { name: 'Números', abbrev: 'nm', chapters: 36, testament: 'old', usfm: 'NUM' },
  { name: 'Deuteronômio', abbrev: 'dt', chapters: 34, testament: 'old', usfm: 'DEU' },
  { name: 'Josué', abbrev: 'js', chapters: 24, testament: 'old', usfm: 'JOS' },
  { name: 'Juízes', abbrev: 'jz', chapters: 21, testament: 'old', usfm: 'JDG' },
  { name: 'Rute', abbrev: 'rt', chapters: 4, testament: 'old', usfm: 'RUT' },
  { name: '1 Samuel', abbrev: '1sm', chapters: 31, testament: 'old', usfm: '1SA' },
  { name: '2 Samuel', abbrev: '2sm', chapters: 24, testament: 'old', usfm: '2SA' },
  { name: '1 Reis', abbrev: '1rs', chapters: 22, testament: 'old', usfm: '1KI' },
  { name: '2 Reis', abbrev: '2rs', chapters: 25, testament: 'old', usfm: '2KI' },
  { name: '1 Crônicas', abbrev: '1cr', chapters: 29, testament: 'old', usfm: '1CH' },
  { name: '2 Crônicas', abbrev: '2cr', chapters: 36, testament: 'old', usfm: '2CH' },
  { name: 'Esdras', abbrev: 'ed', chapters: 10, testament: 'old', usfm: 'EZR' },
  { name: 'Neemias', abbrev: 'ne', chapters: 13, testament: 'old', usfm: 'NEH' },
  { name: 'Ester', abbrev: 'et', chapters: 10, testament: 'old', usfm: 'EST' },
  { name: 'Jó', abbrev: 'job', chapters: 42, testament: 'old', usfm: 'JOB' },
  { name: 'Salmos', abbrev: 'sl', chapters: 150, testament: 'old', usfm: 'PSA' },
  { name: 'Provérbios', abbrev: 'pv', chapters: 31, testament: 'old', usfm: 'PRO' },
  { name: 'Eclesiastes', abbrev: 'ec', chapters: 12, testament: 'old', usfm: 'ECC' },
  { name: 'Cânticos', abbrev: 'ct', chapters: 8, testament: 'old', usfm: 'SNG' },
  { name: 'Isaías', abbrev: 'is', chapters: 66, testament: 'old', usfm: 'ISA' },
  { name: 'Jeremias', abbrev: 'jr', chapters: 52, testament: 'old', usfm: 'JER' },
  { name: 'Lamentações', abbrev: 'lm', chapters: 5, testament: 'old', usfm: 'LAM' },
  { name: 'Ezequiel', abbrev: 'ez', chapters: 48, testament: 'old', usfm: 'EZK' },
  { name: 'Daniel', abbrev: 'dn', chapters: 12, testament: 'old', usfm: 'DAN' },
  { name: 'Oséias', abbrev: 'os', chapters: 14, testament: 'old', usfm: 'HOS' },
  { name: 'Joel', abbrev: 'jl', chapters: 3, testament: 'old', usfm: 'JOL' },
  { name: 'Amós', abbrev: 'am', chapters: 9, testament: 'old', usfm: 'AMO' },
  { name: 'Obadias', abbrev: 'ob', chapters: 1, testament: 'old', usfm: 'OBA' },
  { name: 'Jonas', abbrev: 'jn', chapters: 4, testament: 'old', usfm: 'JON' },
  { name: 'Miquéias', abbrev: 'mq', chapters: 7, testament: 'old', usfm: 'MIC' },
  { name: 'Naum', abbrev: 'na', chapters: 3, testament: 'old', usfm: 'NAM' },
  { name: 'Habacuque', abbrev: 'hc', chapters: 3, testament: 'old', usfm: 'HAB' },
  { name: 'Sofonias', abbrev: 'sf', chapters: 3, testament: 'old', usfm: 'ZEP' },
  { name: 'Ageu', abbrev: 'ag', chapters: 2, testament: 'old', usfm: 'HAG' },
  { name: 'Zacarias', abbrev: 'zc', chapters: 14, testament: 'old', usfm: 'ZEC' },
  { name: 'Malaquias', abbrev: 'ml', chapters: 4, testament: 'old', usfm: 'MAL' },
  // Novo Testamento
  { name: 'Mateus', abbrev: 'mt', chapters: 28, testament: 'new', usfm: 'MAT' },
  { name: 'Marcos', abbrev: 'mc', chapters: 16, testament: 'new', usfm: 'MRK' },
  { name: 'Lucas', abbrev: 'lc', chapters: 24, testament: 'new', usfm: 'LUK' },
  { name: 'João', abbrev: 'jo', chapters: 21, testament: 'new', usfm: 'JHN' },
  { name: 'Atos', abbrev: 'at', chapters: 28, testament: 'new', usfm: 'ACT' },
  { name: 'Romanos', abbrev: 'rm', chapters: 16, testament: 'new', usfm: 'ROM' },
  { name: '1 Coríntios', abbrev: '1co', chapters: 16, testament: 'new', usfm: '1CO' },
  { name: '2 Coríntios', abbrev: '2co', chapters: 13, testament: 'new', usfm: '2CO' },
  { name: 'Gálatas', abbrev: 'gl', chapters: 6, testament: 'new', usfm: 'GAL' },
  { name: 'Efésios', abbrev: 'ef', chapters: 6, testament: 'new', usfm: 'EPH' },
  { name: 'Filipenses', abbrev: 'fp', chapters: 4, testament: 'new', usfm: 'PHP' },
  { name: 'Colossenses', abbrev: 'cl', chapters: 4, testament: 'new', usfm: 'COL' },
  { name: '1 Tessalonicenses', abbrev: '1ts', chapters: 5, testament: 'new', usfm: '1TH' },
  { name: '2 Tessalonicenses', abbrev: '2ts', chapters: 3, testament: 'new', usfm: '2TH' },
  { name: '1 Timóteo', abbrev: '1tm', chapters: 6, testament: 'new', usfm: '1TI' },
  { name: '2 Timóteo', abbrev: '2tm', chapters: 4, testament: 'new', usfm: '2TI' },
  { name: 'Tito', abbrev: 'tt', chapters: 3, testament: 'new', usfm: 'TIT' },
  { name: 'Filemom', abbrev: 'fm', chapters: 1, testament: 'new', usfm: 'PHM' },
  { name: 'Hebreus', abbrev: 'hb', chapters: 13, testament: 'new', usfm: 'HEB' },
  { name: 'Tiago', abbrev: 'tg', chapters: 5, testament: 'new', usfm: 'JAS' },
  { name: '1 Pedro', abbrev: '1pe', chapters: 5, testament: 'new', usfm: '1PE' },
  { name: '2 Pedro', abbrev: '2pe', chapters: 3, testament: 'new', usfm: '2PE' },
  { name: '1 João', abbrev: '1jo', chapters: 5, testament: 'new', usfm: '1JN' },
  { name: '2 João', abbrev: '2jo', chapters: 1, testament: 'new', usfm: '2JN' },
  { name: '3 João', abbrev: '3jo', chapters: 1, testament: 'new', usfm: '3JN' },
  { name: 'Judas', abbrev: 'jd', chapters: 1, testament: 'new', usfm: 'JUD' },
  { name: 'Apocalipse', abbrev: 'ap', chapters: 22, testament: 'new', usfm: 'REV' },
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
// Prioritizes standard 3-letter USFM code to eliminate book/chapter collisions (e.g., Judges vs Jude),
// followed by unambiguous Portuguese and English names.
const apiBookNames: Record<string, string[]> = {
  'gn': ['GEN', 'Genesis', 'Gênesis'],
  'ex': ['EXO', 'Exodus', 'Êxodo', 'Exodo'],
  'lv': ['LEV', 'Leviticus', 'Levítico', 'Levitico'],
  'nm': ['NUM', 'Numbers', 'Números', 'Numeros'],
  'dt': ['DEU', 'Deuteronomy', 'Deuteronômio', 'Deuteronomio'],
  'js': ['JOS', 'Joshua', 'Josué', 'Josue'],
  'jz': ['JDG', 'Juízes', 'Juizes', 'Judges'],
  'rt': ['RUT', 'Ruth', 'Rute'],
  '1sm': ['1SA', '1 Samuel', '1Samuel'],
  '2sm': ['2SA', '2 Samuel', '2Samuel'],
  '1rs': ['1KI', '1 Kings', '1Kings', '1 Reis', '1Reis'],
  '2rs': ['2KI', '2 Kings', '2Kings', '2 Reis', '2Reis'],
  '1cr': ['1CH', '1 Chronicles', '1Chronicles', '1 Crônicas', '1 Cronicas'],
  '2cr': ['2CH', '2 Chronicles', '2Chronicles', '2 Crônicas', '2 Cronicas'],
  'ed': ['EZR', 'Ezra', 'Esdras'],
  'ne': ['NEH', 'Nehemiah', 'Neemias'],
  'et': ['EST', 'Esther', 'Ester'],
  'job': ['JOB', 'Job', 'Jó', 'Jo'],
  'sl': ['PSA', 'Psalms', 'Psalm', 'Salmos'],
  'pv': ['PRO', 'Proverbs', 'Provérbios', 'Proverbios'],
  'ec': ['ECC', 'Ecclesiastes', 'Eclesiastes'],
  'ct': ['SNG', 'Song of Solomon', 'Cânticos', 'Canticos', 'Cantares'],
  'is': ['ISA', 'Isaiah', 'Isaías', 'Isaias'],
  'jr': ['JER', 'Jeremiah', 'Jeremias'],
  'lm': ['LAM', 'Lamentations', 'Lamentações', 'Lamentacoes'],
  'ez': ['EZK', 'Ezekiel', 'Ezequiel'],
  'dn': ['DAN', 'Daniel'],
  'os': ['HOS', 'Hosea', 'Oséias', 'Oseias'],
  'jl': ['JOL', 'Joel'],
  'am': ['AMO', 'Amos', 'Amós'],
  'ob': ['OBA', 'Obadiah', 'Obadias'],
  'jn': ['JON', 'Jonah', 'Jonas'],
  'mq': ['MIC', 'Micah', 'Miquéias', 'Miqueias'],
  'na': ['NAM', 'Nahum', 'Naum'],
  'hc': ['HAB', 'Habakkuk', 'Habacuque'],
  'sf': ['ZEP', 'Zephaniah', 'Sofonias'],
  'ag': ['HAG', 'Haggai', 'Ageu'],
  'zc': ['ZEC', 'Zechariah', 'Zacarias'],
  'ml': ['MAL', 'Malachi', 'Malaquias'],
  'mt': ['MAT', 'Matthew', 'Mateus'],
  'mc': ['MRK', 'Mark', 'Marcos'],
  'lc': ['LUK', 'Luke', 'Lucas'],
  'jo': ['JHN', 'John', 'João', 'Joao'],
  'at': ['ACT', 'Acts', 'Atos'],
  'rm': ['ROM', 'Romans', 'Romanos'],
  '1co': ['1CO', '1 Corinthians', '1Corinthians', '1 Coríntios', '1 Corintios'],
  '2co': ['2CO', '2 Corinthians', '2Corinthians', '2 Coríntios', '2 Corintios'],
  'gl': ['GAL', 'Galatians', 'Gálatas', 'Galatas'],
  'ef': ['EPH', 'Ephesians', 'Efésios', 'Efesios'],
  'fp': ['PHP', 'Philippians', 'Filipenses'],
  'cl': ['COL', 'Colossians', 'Colossenses'],
  '1ts': ['1TH', '1 Thessalonians', '1Thessalonians', '1 Tessalonicenses'],
  '2ts': ['2TH', '2 Thessalonians', '2Thessalonians', '2 Tessalonicenses'],
  '1tm': ['1TI', '1 Timothy', '1Timothy', '1 Timóteo', '1 Timoteo'],
  '2tm': ['2TI', '2 Timothy', '2Timothy', '2 Timóteo', '2 Timoteo'],
  'tt': ['TIT', 'Titus', 'Tito'],
  'fm': ['PHM', 'Philemon', 'Filemom'],
  'hb': ['HEB', 'Hebrews', 'Hebreus'],
  'tg': ['JAS', 'James', 'Tiago'],
  '1pe': ['1PE', '1 Peter', '1Peter', '1 Pedro'],
  '2pe': ['2PE', '2 Peter', '2Peter', '2 Pedro'],
  '1jo': ['1JN', '1 John', '1John', '1 João', '1 Joao'],
  '2jo': ['2JN', '2 John', '2John', '2 João', '2 Joao'],
  '3jo': ['3JN', '3 John', '3John', '3 João', '3 Joao'],
  'jd': ['JUD', 'Jude', 'Judas'],
  'ap': ['REV', 'Revelation', 'Apocalipse'],
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

export async function loadBibliaLivre(): Promise<any[]> {
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
  const book = bibleBooks.find(b => b.abbrev === abbrev);
  const names = apiBookNames[abbrev];
  if (!names || !book) throw new Error('Livro não encontrado');

  const expectedUsfm = book.usfm;

  for (const apiName of names) {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(apiName)}+${chapter}?translation=${translation}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.error || !data.verses?.length) continue;

      const firstVerse = data.verses[0];

      // 1. Strict Validation: book_id must match expected USFM code if present
      const returnedBookId = (firstVerse.book_id || '').toUpperCase().trim();
      if (returnedBookId && expectedUsfm && returnedBookId !== expectedUsfm) {
        console.warn(`[BibleAPI] Book mismatch: expected ${expectedUsfm} (${book.name}), but API returned ${returnedBookId} (${data.reference}). Skipping.`);
        continue;
      }

      // 2. Strict Validation: chapter must match requested chapter
      if (typeof firstVerse.chapter === 'number' && firstVerse.chapter !== chapter) {
        console.warn(`[BibleAPI] Chapter mismatch: expected chapter ${chapter}, but API returned ${firstVerse.chapter}. Skipping.`);
        continue;
      }

      // 3. Strict Validation: reference text check for single-chapter book false matches (e.g. Judas vs Juízes)
      if (data.reference) {
        const refLower = data.reference.toLowerCase();
        if (abbrev === 'jz' && refLower.startsWith('judas')) {
          console.warn(`[BibleAPI] Returned Judas instead of Juízes. Skipping.`);
          continue;
        }
      }

      const cleanHtml = (str: string) => (str || '').replace(/<[^>]*>/g, '').trim();

      return {
        reference: `${book.name} ${chapter}`,
        verses: data.verses.map((v: any) => ({
          book_name: book.name,
          chapter: v.chapter ?? chapter,
          verse: v.verse,
          text: cleanHtml(v.text),
        })),
        text: data.verses.map((v: any) => cleanHtml(v.text)).join(' '),
      };
    } catch (err: any) {
      console.warn(`[BibleAPI] Falha ao buscar em ${apiName}:`, err.message);
      continue;
    }
  }

  throw new Error('Não foi possível carregar versículos com validação correta');
}

// ── Fallback: bolls.life (ARC09, KJV, WEB) ──
async function fetchFromBolls(
  abbrev: string,
  chapter: number,
  translation: string = 'almeida'
): Promise<ChapterResponse> {
  const bookId = bollsBookIndex[abbrev];
  if (!bookId) throw new Error('Livro não encontrado');

  const book = bibleBooks.find(b => b.abbrev === abbrev);
  const bookName = book?.name || abbrev;

  let bollsVersion = 'ARC09';
  if (translation === 'kjv') bollsVersion = 'KJV';
  else if (translation === 'web' || translation === 'bbe') bollsVersion = 'WEB';

  try {
    const url = `https://bolls.life/get-text/${bollsVersion}/${bookId}/${chapter}/`;
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
          const result = await fetchFromBolls(abbrev, chapter, 'almeida');
          chapterCache.set(cacheKey, result);
          return result;
        } catch {}
      }
      throw new Error('OFFLINE_DATA_MISSING: Sem conexão e dados offline não encontrados.');
    }
  }

  // Para outras traduções (Almeida, KJV, WEB, etc):
  // 1ª Camada: bible-api.com com validação de livro e capítulo
  try {
    const result = await fetchFromBibleApi(abbrev, chapter, translation);
    chapterCache.set(cacheKey, result);
    return result;
  } catch {
    // Falha na API primária
  }

  // 2ª Camada: bolls.life (ARC09 para Almeida, KJV para King James, WEB para Web/BBE)
  try {
    const result = await fetchFromBolls(abbrev, chapter, translation);
    chapterCache.set(cacheKey, result);
    return result;
  } catch {
    // Falha na API secundária
  }

  // 3ª Camada: Bíblia Livre offline (banco de dados completo local verificado)
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
