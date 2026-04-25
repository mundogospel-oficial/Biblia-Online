// Highlight & Notes system stored in localStorage

export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

export interface VerseHighlight {
  verseId: string; // "abbrev:chapter:verse"
  color: HighlightColor;
}

export interface VerseNote {
  verseId: string;
  text: string;
  createdAt: number;
}

const HIGHLIGHTS_KEY = 'bible-highlights';
const NOTES_KEY = 'bible-notes';

// --- Highlights ---
export function getHighlights(): VerseHighlight[] {
  try {
    return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '[]');
  } catch { return []; }
}

export function getHighlight(verseId: string): VerseHighlight | undefined {
  return getHighlights().find(h => h.verseId === verseId);
}

export function setHighlight(verseId: string, color: HighlightColor): void {
  const list = getHighlights().filter(h => h.verseId !== verseId);
  list.push({ verseId, color });
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(list));
}

export function removeHighlight(verseId: string): void {
  const list = getHighlights().filter(h => h.verseId !== verseId);
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(list));
}

// --- Notes ---
export function getNotes(): VerseNote[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  } catch { return []; }
}

export function getNote(verseId: string): VerseNote | undefined {
  return getNotes().find(n => n.verseId === verseId);
}

export function setNote(verseId: string, text: string): void {
  const list = getNotes().filter(n => n.verseId !== verseId);
  if (text.trim()) {
    list.push({ verseId, text: text.trim(), createdAt: Date.now() });
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(list));
}

export function removeNote(verseId: string): void {
  const list = getNotes().filter(n => n.verseId !== verseId);
  localStorage.setItem(NOTES_KEY, JSON.stringify(list));
}

export const highlightColors: { key: HighlightColor; label: string; hsl: string }[] = [
  { key: 'yellow', label: 'Amarelo', hsl: '50 100% 70%' },
  { key: 'blue', label: 'Azul', hsl: '210 80% 70%' },
  { key: 'green', label: 'Verde', hsl: '140 60% 65%' },
  { key: 'pink', label: 'Rosa', hsl: '330 80% 70%' },
];
