/**
 * Serviço de Gerenciamento de Mapas Bíblicos Offline
 * Permite baixar e armazenar tiles de mapa e dados geográficos no CacheStorage do navegador (PWA),
 * possibilitando navegação completa por rotas bíblicas sem conexão à internet.
 */

export const MAPS_OFFLINE_CACHE = "biblical-maps-offline";
export const MAPS_OFFLINE_KEY = "biblical-maps-offline-enabled";
export const MAPS_OFFLINE_DATE_KEY = "biblical-maps-offline-date";

// Função matemática para converter coordenadas (lat, lng, zoom) em coordenadas de tile x/y
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y))
  };
}

// Bounding box principal do mundo bíblico (Mediterrâneo, Egito, Israel, Grécia, Roma, Ásia Menor, Mesopotâmia)
const BIBLICAL_BOUNDS = {
  minLat: 27.0, // Sul do Egito / Sinai
  maxLat: 42.5, // Norte de Roma / Grécia / Trôade
  minLng: 12.0, // Oeste de Roma / Sicília
  maxLng: 44.5  // Leste da Mesopotâmia / Babilônia
};

// Cidades e polos centrais para zoom mais aproximado (Z8)
const KEY_BIBLICAL_CENTERS = [
  { name: "Jerusalém e Judeia", lat: 31.77, lng: 35.22 },
  { name: "Galileia e Samaria", lat: 32.80, lng: 35.53 },
  { name: "Monte Sinai", lat: 28.54, lng: 33.97 },
  { name: "Cesareia e Litoral", lat: 32.50, lng: 34.89 },
  { name: "Antioquia da Síria", lat: 36.20, lng: 36.16 },
  { name: "Éfeso e Sete Igrejas", lat: 37.95, lng: 27.37 },
  { name: "Atenas e Corinto", lat: 37.95, lng: 23.30 },
  { name: "Roma", lat: 41.90, lng: 12.50 },
  { name: "Alexandria e Delta", lat: 31.20, lng: 29.92 }
];

/**
 * Gera lista de URLs de tiles de mapas para cobrir a região bíblica
 */
export function generateBiblicalTileUrls(): string[] {
  const urls: string[] = [];

  // 1. Zooms regionais amplos (Z4 a Z6) para toda a bacia bíblica
  for (let z = 4; z <= 6; z++) {
    const nw = latLngToTile(BIBLICAL_BOUNDS.maxLat, BIBLICAL_BOUNDS.minLng, z);
    const se = latLngToTile(BIBLICAL_BOUNDS.minLat, BIBLICAL_BOUNDS.maxLng, z);

    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        // OpenStreetMap Tile (leve, confiável e compatível com CORS)
        urls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
      }
    }
  }

  // 2. Zoom 7 (foco em Israel, Mar Morto, Galileia, Egito e Ásia Menor)
  const z7Regions = [
    { minLat: 29.5, maxLat: 33.8, minLng: 33.5, maxLng: 36.8 }, // Terra Santa & Sinai
    { minLat: 36.0, maxLat: 41.5, minLng: 21.0, maxLng: 29.0 }, // Grécia e Ásia Menor
  ];

  for (const reg of z7Regions) {
    const nw = latLngToTile(reg.maxLat, reg.minLng, 7);
    const se = latLngToTile(reg.minLat, reg.maxLng, 7);
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        urls.push(`https://tile.openstreetmap.org/7/${x}/${y}.png`);
      }
    }
  }

  // 3. Zoom 8 em polos sagrados (Jerusalém, Galileia, Sinai, Éfeso, Atenas, Roma)
  for (const center of KEY_BIBLICAL_CENTERS) {
    const t = latLngToTile(center.lat, center.lng, 8);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        urls.push(`https://tile.openstreetmap.org/8/${t.x + dx}/${t.y + dy}.png`);
      }
    }
  }

  // Remove duplicatas
  return Array.from(new Set(urls));
}

/**
 * Verifica se os mapas bíblicos offline estão ativados e baixados
 */
export function isBiblicalMapsOffline(): boolean {
  try {
    return localStorage.getItem(MAPS_OFFLINE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Retorna a data do último download realizado
 */
export function getBiblicalMapsDownloadDate(): string | null {
  try {
    return localStorage.getItem(MAPS_OFFLINE_DATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Retorna a contagem de itens em cache
 */
export async function getOfflineMapsTileCount(): Promise<number> {
  if (typeof window === "undefined" || !("caches" in window)) return 0;
  try {
    const cache = await caches.open(MAPS_OFFLINE_CACHE);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

/**
 * Baixa o pacote completo de mapas bíblicos offline com retorno de progresso
 */
export async function downloadBiblicalMapsOffline(
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<{ success: boolean; cachedCount: number; error?: string }> {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("O navegador não suporta armazenamento em cache offline.");
  }

  const urls = generateBiblicalTileUrls();
  const total = urls.length;
  let downloaded = 0;

  try {
    const cache = await caches.open(MAPS_OFFLINE_CACHE);

    // Baixa em lotes paralelos (chunks) para agilidade e sem travar a rede
    const CHUNK_SIZE = 8;
    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
      const chunk = urls.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (url) => {
          try {
            // Verifica se já está em cache para evitar download redundante
            const match = await cache.match(url);
            if (match) {
              downloaded++;
              return;
            }

            const response = await fetch(url, {
              mode: "cors",
              cache: "force-cache"
            });

            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch {
            // Ignora tiles individuais com falha transitória
          } finally {
            downloaded++;
          }
        })
      );

      if (onProgress) {
        const pct = Math.min(100, Math.round((downloaded / total) * 100));
        onProgress(pct, downloaded, total);
      }
    }

    localStorage.setItem(MAPS_OFFLINE_KEY, "true");
    localStorage.setItem(
      MAPS_OFFLINE_DATE_KEY,
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    );

    window.dispatchEvent(new CustomEvent("biblical-maps-offline-changed", { detail: { enabled: true } }));

    return { success: true, cachedCount: downloaded };
  } catch (err: any) {
    console.error("[OfflineMaps] Erro ao baixar mapas:", err);
    return { success: false, cachedCount: downloaded, error: err.message || "Erro durante o download" };
  }
}

/**
 * Remove os mapas bíblicos armazenados offline
 */
export async function removeBiblicalMapsOffline(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(MAPS_OFFLINE_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.map((k) => cache.delete(k)));

    localStorage.setItem(MAPS_OFFLINE_KEY, "false");
    localStorage.removeItem(MAPS_OFFLINE_DATE_KEY);

    window.dispatchEvent(new CustomEvent("biblical-maps-offline-changed", { detail: { enabled: false } }));
    return true;
  } catch (err) {
    console.error("[OfflineMaps] Erro ao remover mapas:", err);
    return false;
  }
}
