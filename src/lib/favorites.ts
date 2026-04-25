const STORAGE_KEY = "bible-favorites";

export interface FavoriteVerse {
  id: string; // "abbrev:chapter:verse"
  text: string;
  reference: string;
  addedAt: number;
}

export function getFavorites(): FavoriteVerse[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addFavorite(verse: Omit<FavoriteVerse, "addedAt">): void {
  const list = getFavorites();
  if (list.some((f) => f.id === verse.id)) return;
  list.unshift({ ...verse, addedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function removeFavorite(id: string): void {
  const list = getFavorites().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}
