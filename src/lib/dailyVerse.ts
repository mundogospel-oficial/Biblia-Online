// Curated list of popular verses for "Verse of the Day"
export interface DailyVerseEntry {
  abbrev: string;
  chapter: number;
  verse: number;
  text?: string;
  reference: string;
}

const curatedVerses: DailyVerseEntry[] = [
  { abbrev: "jo", chapter: 3, verse: 16, reference: "João 3:16" },
  { abbrev: "sl", chapter: 23, verse: 1, reference: "Salmos 23:1" },
  { abbrev: "fp", chapter: 4, verse: 13, reference: "Filipenses 4:13" },
  { abbrev: "jr", chapter: 29, verse: 11, reference: "Jeremias 29:11" },
  { abbrev: "rm", chapter: 8, verse: 28, reference: "Romanos 8:28" },
  { abbrev: "is", chapter: 41, verse: 10, reference: "Isaías 41:10" },
  { abbrev: "pv", chapter: 3, verse: 5, reference: "Provérbios 3:5" },
  { abbrev: "mt", chapter: 11, verse: 28, reference: "Mateus 11:28" },
  { abbrev: "sl", chapter: 46, verse: 1, reference: "Salmos 46:1" },
  { abbrev: "ef", chapter: 2, verse: 8, reference: "Efésios 2:8" },
  { abbrev: "sl", chapter: 119, verse: 105, reference: "Salmos 119:105" },
  { abbrev: "is", chapter: 40, verse: 31, reference: "Isaías 40:31" },
  { abbrev: "rm", chapter: 12, verse: 2, reference: "Romanos 12:2" },
  { abbrev: "tg", chapter: 1, verse: 5, reference: "Tiago 1:5" },
  { abbrev: "sl", chapter: 27, verse: 1, reference: "Salmos 27:1" },
  { abbrev: "gl", chapter: 5, verse: 22, reference: "Gálatas 5:22" },
  { abbrev: "1co", chapter: 13, verse: 4, reference: "1 Coríntios 13:4" },
  { abbrev: "hb", chapter: 11, verse: 1, reference: "Hebreus 11:1" },
  { abbrev: "sl", chapter: 37, verse: 4, reference: "Salmos 37:4" },
  { abbrev: "2tm", chapter: 1, verse: 7, reference: "2 Timóteo 1:7" },
  { abbrev: "mt", chapter: 6, verse: 33, reference: "Mateus 6:33" },
  { abbrev: "jo", chapter: 14, verse: 27, reference: "João 14:27" },
  { abbrev: "sl", chapter: 91, verse: 1, reference: "Salmos 91:1" },
  { abbrev: "1pe", chapter: 5, verse: 7, reference: "1 Pedro 5:7" },
  { abbrev: "pv", chapter: 18, verse: 10, reference: "Provérbios 18:10" },
  { abbrev: "rm", chapter: 15, verse: 13, reference: "Romanos 15:13" },
  { abbrev: "jo", chapter: 16, verse: 33, reference: "João 16:33" },
  { abbrev: "sl", chapter: 34, verse: 8, reference: "Salmos 34:8" },
  { abbrev: "is", chapter: 26, verse: 3, reference: "Isaías 26:3" },
  { abbrev: "cl", chapter: 3, verse: 23, reference: "Colossenses 3:23" },
  { abbrev: "sl", chapter: 121, verse: 1, reference: "Salmos 121:1" },
];

export function getDailyVerseReference(): DailyVerseEntry {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return curatedVerses[dayOfYear % curatedVerses.length];
}

