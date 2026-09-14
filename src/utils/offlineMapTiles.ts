import { biblicalMaps } from "@/data/biblicalMapsData";

/**
 * Converte latitude e longitude em coordenadas de tiles (x, y) de acordo com o nível de zoom (Slippy Map).
 */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
  const maxTile = Math.pow(2, zoom) - 1;
  return { 
    x: Math.max(0, Math.min(maxTile, x)), 
    y: Math.max(0, Math.min(maxTile, y)) 
  };
}

/**
 * Retorna todas as URLs de tiles dos mapas bíblicos para serem pré-carregadas no cache offline.
 * Cobre satélite realista (Esri), relevo topográfico, atlas histórico (NatGeo) e mapa padrão (OSM)
 * para todas as rotas bíblicas, centros de mapas e locais históricos em vários níveis de zoom.
 */
export function getBiblicalMapTileUrls(): string[] {
  const urls = new Set<string>();

  const tileServers = [
    // 1. Satélite Realista (Esri World Imagery) - Principal
    (z: number, y: number, x: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    // 2. Relevo Físico e Topografia (Esri World Physical)
    (z: number, y: number, x: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/${z}/${y}/${x}`,
    // 3. Atlas Histórico (NatGeo World Map)
    (z: number, y: number, x: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/${z}/${y}/${x}`,
    // 4. Mapa Padrão (OpenStreetMap)
    (z: number, y: number, x: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  ];

  function addTile(lat: number, lng: number, zoom: number, radius = 0) {
    const { x, y } = latLngToTile(lat, lng, zoom);
    const max = Math.pow(2, zoom) - 1;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const cx = x + dx;
        const cy = y + dy;
        if (cx >= 0 && cx <= max && cy >= 0 && cy <= max) {
          tileServers.forEach(server => {
            urls.add(server(zoom, cy, cx));
          });
        }
      }
    }
  }

  // 1. Visão Geral do Mediterrâneo e Oriente Médio (Zooms 3 a 6)
  for (let z = 3; z <= 6; z++) {
    for (let lat = 28; lat <= 42; lat += 3) {
      for (let lng = 12; lng <= 38; lng += 3) {
        addTile(lat, lng, z, 0);
      }
    }
  }

  // 2. Centros dos temas dos mapas bíblicos (Zooms 5 a 8)
  biblicalMaps.forEach(map => {
    [map.defaultZoom - 1, map.defaultZoom, map.defaultZoom + 1].forEach(z => {
      if (z >= 4 && z <= 9) {
        addTile(map.center[0], map.center[1], z, 1);
      }
    });

    // 3. Locais Bíblicos (Jerusalém, Belém, Galileia, Éfeso, Roma, Sinai, etc.) (Zooms 6 a 10)
    map.locations.forEach(loc => {
      [6, 7, 8, 9, 10].forEach(z => {
        addTile(loc.lat, loc.lng, z, z <= 7 ? 1 : 0);
      });
    });

    // 4. Coordenadas de Rotas Bíblicas (Zooms 5 a 7)
    if (map.routeCoordinates && map.routeCoordinates.length > 0) {
      map.routeCoordinates.forEach(coord => {
        [5, 6, 7].forEach(z => {
          addTile(coord[0], coord[1], z, 0);
        });
      });
    }
  });

  return Array.from(urls);
}
