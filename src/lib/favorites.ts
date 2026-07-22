const STORAGE_KEYS = {
  favorites: "bible-favorites",
  markings: "bible-markings",
  notes: "bible-notes"
};

export type ReactionType = "favorites" | "markings" | "notes";

export interface FavoriteVerse {
  id: string; // "abbrev:chapter:verse"
  text: string;
  reference: string;
  note?: string;
  addedAt: number;
}

export function getFavorites(type: ReactionType = "favorites"): FavoriteVerse[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS[type]) || "[]");
  } catch {
    return [];
  }
}

export function addFavorite(verse: Omit<FavoriteVerse, "addedAt">, type: ReactionType = "favorites"): void {
  const list = getFavorites(type);
  const existingIndex = list.findIndex((f) => f.id === verse.id);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...verse };
  } else {
    list.unshift({ ...verse, addedAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(list));
}

export function updateNote(id: string, noteText: string, type: ReactionType = "notes"): void {
  const list = getFavorites(type);
  const item = list.find((f) => f.id === id);
  if (item) {
    item.note = noteText;
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(list));
  }
}

export function removeFavorite(id: string, type: ReactionType = "favorites"): void {
  const list = getFavorites(type).filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(list));
}

export function isFavorite(id: string, type: ReactionType = "favorites"): boolean {
  return getFavorites(type).some((f) => f.id === id);
}
