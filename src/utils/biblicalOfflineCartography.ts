/**
 * Motor de Cartografia Bíblica Offline (100% Client-Side & Local)
 * Renderiza tiles cartográficos procedurais em Canvas para Leaflet sem precisar de conexão com a internet.
 * Inclui linhas de costa reais do Mediterrâneo, Israel, Galileia, Mar Morto, Rio Jordão, Nilo, Grécia, Roma e Ásia Menor.
 */

import L from "leaflet";

export type CartographyTheme = "parchment" | "dark" | "satellite_offline";

interface CoordinatePoint {
  lat: number;
  lng: number;
}

// Bounding box e coordenadas dos corpos d'água e regiões bíblicas
interface WaterBody {
  name: string;
  type: "polygon" | "line";
  coords: CoordinatePoint[];
  labelPos?: CoordinatePoint;
}

interface MountainPeak {
  name: string;
  lat: number;
  lng: number;
  elevation: string;
}

interface AncientRegion {
  name: string;
  lat: number;
  lng: number;
  minZoom: number;
  maxZoom: number;
}

// Principais corpos d'água da Terra Santa e do Mundo Bíblico
const BIBLICAL_WATER_BODIES: WaterBody[] = [
  // Mar da Galileia (Kinneret)
  {
    name: "Mar da Galileia",
    type: "polygon",
    coords: [
      { lat: 32.89, lng: 35.58 },
      { lat: 32.87, lng: 35.63 },
      { lat: 32.83, lng: 35.65 },
      { lat: 32.78, lng: 35.64 },
      { lat: 32.71, lng: 35.59 },
      { lat: 32.72, lng: 35.56 },
      { lat: 32.77, lng: 35.53 },
      { lat: 32.83, lng: 35.53 },
      { lat: 32.87, lng: 35.55 }
    ],
    labelPos: { lat: 32.81, lng: 35.59 }
  },
  // Mar Morto (Mar Salgado)
  {
    name: "Mar Morto",
    type: "polygon",
    coords: [
      { lat: 31.78, lng: 35.48 },
      { lat: 31.65, lng: 35.48 },
      { lat: 31.50, lng: 35.44 },
      { lat: 31.32, lng: 35.39 },
      { lat: 31.14, lng: 35.37 },
      { lat: 31.06, lng: 35.40 },
      { lat: 31.06, lng: 35.45 },
      { lat: 31.25, lng: 35.48 },
      { lat: 31.42, lng: 35.53 },
      { lat: 31.60, lng: 35.56 },
      { lat: 31.75, lng: 35.54 }
    ],
    labelPos: { lat: 31.45, lng: 35.48 }
  },
  // Rio Jordão
  {
    name: "Rio Jordão",
    type: "line",
    coords: [
      { lat: 33.25, lng: 35.62 },
      { lat: 33.05, lng: 35.61 },
      { lat: 32.89, lng: 35.58 }, // Entra na Galileia
      { lat: 32.71, lng: 35.57 }, // Sai da Galileia
      { lat: 32.55, lng: 35.55 },
      { lat: 32.35, lng: 35.56 },
      { lat: 32.15, lng: 35.53 },
      { lat: 31.95, lng: 35.52 },
      { lat: 31.78, lng: 35.48 }  // Deságua no Mar Morto
    ],
    labelPos: { lat: 32.30, lng: 35.57 }
  },
  // Rio Nilo & Delta do Nilo
  {
    name: "Rio Nilo",
    type: "line",
    coords: [
      { lat: 26.00, lng: 32.50 },
      { lat: 27.20, lng: 31.18 },
      { lat: 29.00, lng: 31.10 },
      { lat: 30.05, lng: 31.23 }, // Cairo
      { lat: 30.70, lng: 31.00 },
      { lat: 31.45, lng: 30.40 }  // Foz de Roseta
    ],
    labelPos: { lat: 29.50, lng: 31.15 }
  },
  // Ramo Oriental do Nilo (Damieta)
  {
    name: "Nilo (Ramo Damieta)",
    type: "line",
    coords: [
      { lat: 30.05, lng: 31.23 },
      { lat: 30.75, lng: 31.50 },
      { lat: 31.52, lng: 31.84 }
    ]
  },
  // Rio Eufrates
  {
    name: "Rio Eufrates",
    type: "line",
    coords: [
      { lat: 38.50, lng: 39.50 },
      { lat: 37.00, lng: 38.00 },
      { lat: 35.90, lng: 39.00 },
      { lat: 34.40, lng: 41.00 },
      { lat: 32.00, lng: 44.40 },
      { lat: 30.50, lng: 47.80 }
    ],
    labelPos: { lat: 35.00, lng: 40.00 }
  },
  // Rio Tigre
  {
    name: "Rio Tigre",
    type: "line",
    coords: [
      { lat: 38.40, lng: 40.00 },
      { lat: 37.00, lng: 42.00 },
      { lat: 36.30, lng: 43.10 }, // Nínive
      { lat: 33.30, lng: 44.40 }, // Bagdá
      { lat: 31.00, lng: 47.40 }
    ],
    labelPos: { lat: 36.00, lng: 43.00 }
  },
  // Golfo de Suez (Mar Vermelho Ocidental)
  {
    name: "Golfo de Suez",
    type: "polygon",
    coords: [
      { lat: 29.97, lng: 32.55 },
      { lat: 29.50, lng: 32.70 },
      { lat: 28.50, lng: 33.30 },
      { lat: 27.70, lng: 34.00 },
      { lat: 27.80, lng: 34.30 },
      { lat: 28.80, lng: 33.20 },
      { lat: 29.90, lng: 32.60 }
    ],
    labelPos: { lat: 28.80, lng: 33.00 }
  },
  // Golfo de Ácaba (Mar Vermelho Oriental)
  {
    name: "Golfo de Ácaba",
    type: "polygon",
    coords: [
      { lat: 29.55, lng: 34.98 },
      { lat: 29.00, lng: 34.75 },
      { lat: 28.20, lng: 34.50 },
      { lat: 28.00, lng: 34.40 },
      { lat: 28.10, lng: 34.60 },
      { lat: 29.00, lng: 34.90 },
      { lat: 29.53, lng: 35.01 }
    ],
    labelPos: { lat: 28.90, lng: 34.75 }
  }
];

// Costa Simplificada do Mediterrâneo Oriental e Oriente Médio (Terras Emersas vs Mar)
// Polígonos de Grandes Massas de Terra
const LAND_POLYGONS: CoordinatePoint[][] = [
  // Israel / Levante / Síria / Anatólia / Egito
  [
    { lat: 42.0, lng: 26.0 }, // Europa / Trácia
    { lat: 41.0, lng: 29.0 }, // Bósforo
    { lat: 41.5, lng: 35.0 }, // Mar Negro
    { lat: 41.0, lng: 41.0 },
    { lat: 37.0, lng: 44.0 }, // Mesopotâmia
    { lat: 30.0, lng: 48.0 }, // Golfo Pérsico
    { lat: 25.0, lng: 40.0 }, // Península Arábica
    { lat: 27.5, lng: 35.0 }, // Mar Vermelho
    { lat: 27.7, lng: 34.2 }, // Ponta do Sinai
    { lat: 29.9, lng: 32.5 }, // Suez
    { lat: 31.3, lng: 34.2 }, // Faixa de Gaza
    { lat: 31.8, lng: 34.6 }, // Jope / Tel Aviv
    { lat: 32.8, lng: 35.0 }, // Monte Carmelo / Haifa
    { lat: 33.2, lng: 35.2 }, // Tiro
    { lat: 33.5, lng: 35.3 }, // Sidom
    { lat: 34.4, lng: 35.8 }, // Trípoli
    { lat: 35.5, lng: 35.7 }, // Antioquia / Foz Orontes
    { lat: 36.6, lng: 35.3 }, // Tarso / Cilícia
    { lat: 36.2, lng: 32.3 }, // Panfília
    { lat: 36.6, lng: 29.1 }, // Lícia
    { lat: 37.5, lng: 27.2 }, // Éfeso / Mileto
    { lat: 38.4, lng: 27.1 }, // Esmirna
    { lat: 39.7, lng: 26.1 }, // Trôade
    { lat: 40.2, lng: 26.5 }  // Dardanelos
  ],
  // Península do Sinai
  [
    { lat: 31.1, lng: 32.5 },
    { lat: 31.3, lng: 34.2 },
    { lat: 29.55, lng: 34.98 },
    { lat: 27.75, lng: 34.25 },
    { lat: 29.95, lng: 32.55 }
  ],
  // Grécia & Peloponeso
  [
    { lat: 41.5, lng: 22.0 },
    { lat: 40.6, lng: 23.0 }, // Tessalônica
    { lat: 39.8, lng: 23.8 },
    { lat: 38.3, lng: 24.0 }, // Ática / Atenas
    { lat: 37.8, lng: 23.7 },
    { lat: 37.4, lng: 23.1 }, // Peloponeso
    { lat: 36.5, lng: 22.5 },
    { lat: 37.5, lng: 21.3 },
    { lat: 38.3, lng: 21.6 }, // Corinto
    { lat: 39.5, lng: 20.0 }, // Épiro
    { lat: 41.5, lng: 20.5 }
  ],
  // Ilha de Creta
  [
    { lat: 35.6, lng: 23.6 },
    { lat: 35.3, lng: 26.3 },
    { lat: 35.0, lng: 26.2 },
    { lat: 35.0, lng: 24.8 },
    { lat: 35.2, lng: 23.5 }
  ],
  // Ilha de Chipre
  [
    { lat: 35.7, lng: 34.6 },
    { lat: 35.0, lng: 34.0 },
    { lat: 34.6, lng: 33.0 },
    { lat: 35.0, lng: 32.3 },
    { lat: 35.3, lng: 33.0 }
  ],
  // Itália / Roma
  [
    { lat: 43.0, lng: 10.5 },
    { lat: 41.9, lng: 12.4 }, // Roma
    { lat: 40.8, lng: 14.2 }, // Nápoles
    { lat: 39.0, lng: 16.5 }, // Calábria
    { lat: 40.5, lng: 18.0 }, // Apúlia
    { lat: 42.0, lng: 15.0 },
    { lat: 44.0, lng: 12.5 }
  ],
  // Ilha da Sicília
  [
    { lat: 38.3, lng: 15.6 },
    { lat: 37.0, lng: 15.3 }, // Siracusa
    { lat: 36.6, lng: 14.5 },
    { lat: 37.6, lng: 12.4 },
    { lat: 38.2, lng: 13.3 }
  ]
];

// Montanhas Sagradas e Marcos Topográficos
const SACRED_MOUNTAINS: MountainPeak[] = [
  { name: "Monte Hermom", lat: 33.41, lng: 35.85, elevation: "2.814m" },
  { name: "Monte Carmelo", lat: 32.73, lng: 35.04, elevation: "546m" },
  { name: "Monte Tabor", lat: 32.68, lng: 35.39, elevation: "575m" },
  { name: "Monte Gerizim", lat: 32.19, lng: 35.27, elevation: "881m" },
  { name: "Monte das Oliveiras", lat: 31.77, lng: 35.24, elevation: "826m" },
  { name: "Monte Sinai (Horebe)", lat: 28.53, lng: 33.97, elevation: "2.285m" },
  { name: "Monte Nebo", lat: 31.76, lng: 35.72, elevation: "817m" },
  { name: "Montes de Judá", lat: 31.52, lng: 35.10, elevation: "1.020m" }
];

// Regiões e Províncias Bíblicas Históricas
const ANCIENT_REGIONS: AncientRegion[] = [
  { name: "JUDEIA", lat: 31.65, lng: 35.15, minZoom: 7, maxZoom: 13 },
  { name: "SAMARIA", lat: 32.25, lng: 35.20, minZoom: 7, maxZoom: 13 },
  { name: "GALILEIA", lat: 32.80, lng: 35.35, minZoom: 7, maxZoom: 13 },
  { name: "FENÍCIA", lat: 33.70, lng: 35.50, minZoom: 6, maxZoom: 11 },
  { name: "DECAPOLIS", lat: 32.50, lng: 36.00, minZoom: 7, maxZoom: 12 },
  { name: "PEREIA", lat: 31.90, lng: 35.70, minZoom: 7, maxZoom: 12 },
  { name: "FILÍSTIA", lat: 31.50, lng: 34.50, minZoom: 7, maxZoom: 12 },
  { name: "EGITO (GÓSEN)", lat: 30.60, lng: 31.80, minZoom: 5, maxZoom: 10 },
  { name: "DESERTO DO SINAI", lat: 29.20, lng: 33.80, minZoom: 5, maxZoom: 10 },
  { name: "ARÁBIA", lat: 28.50, lng: 36.50, minZoom: 4, maxZoom: 8 },
  { name: "SÍRIA", lat: 34.50, lng: 37.00, minZoom: 5, maxZoom: 9 },
  { name: "ÁSIA PROCONSULAR", lat: 38.50, lng: 28.50, minZoom: 5, maxZoom: 9 },
  { name: "MACEDÔNIA", lat: 41.00, lng: 22.50, minZoom: 5, maxZoom: 9 },
  { name: "ACAIA (GRÉCIA)", lat: 38.20, lng: 22.30, minZoom: 5, maxZoom: 9 },
  { name: "ITÁLIA", lat: 42.50, lng: 13.00, minZoom: 4, maxZoom: 8 },
  { name: "MESOPOTÂMIA", lat: 34.00, lng: 43.00, minZoom: 4, maxZoom: 8 },
  { name: "MAR MEDITERRÂNEO (GRANDE MAR)", lat: 34.50, lng: 28.00, minZoom: 4, maxZoom: 8 }
];

/**
 * Converte latitude e longitude em coordenadas de pixel dentro de um tile Web Mercator (z, x, y)
 */
function projectToTilePixel(
  lat: number,
  lng: number,
  z: number,
  tileX: number,
  tileY: number,
  tileSize = 256
): { px: number; py: number; inside: boolean } {
  // Web Mercator formula
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
  
  const worldX = ((lng + 180) / 360) * (1 << z) * tileSize;
  const worldY = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * (1 << z) * tileSize;

  const tileOriginX = tileX * tileSize;
  const tileOriginY = tileY * tileSize;

  const px = worldX - tileOriginX;
  const py = worldY - tileOriginY;

  const margin = 100;
  const inside = px >= -margin && px <= tileSize + margin && py >= -margin && py <= tileSize + margin;

  return { px, py, inside };
}

/**
 * Desenha proceduralmente um Tile Cartográfico Bíblico no Canvas 256x256
 */
export function drawBiblicalOfflineTile(
  ctx: CanvasRenderingContext2D,
  z: number,
  x: number,
  y: number,
  theme: CartographyTheme = "parchment",
  tileSize = 256
): void {
  const isDark = theme === "dark";

  // 1. Cores de Fundo (Mar e Oceano)
  if (isDark) {
    // Oceano Dark Profundo
    ctx.fillStyle = "#070c14";
    ctx.fillRect(0, 0, tileSize, tileSize);

    // Efeito sutil de vinheta / gradiente oceânico
    const oceanGrad = ctx.createRadialGradient(tileSize / 2, tileSize / 2, 20, tileSize / 2, tileSize / 2, tileSize);
    oceanGrad.addColorStop(0, "#0a1320");
    oceanGrad.addColorStop(1, "#060a12");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, tileSize, tileSize);
  } else {
    // Oceano Pergaminho Histórico Vintage
    ctx.fillStyle = "#dce7eb";
    ctx.fillRect(0, 0, tileSize, tileSize);

    // Textura sutil de pergaminho
    ctx.fillStyle = "rgba(224, 213, 191, 0.35)";
    ctx.fillRect(0, 0, tileSize, tileSize);
  }

  // 2. Graticule / Linhas de Grade de Coordenadas (Paralelos e Meridianos)
  ctx.save();
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(120, 100, 80, 0.15)";
  ctx.setLineDash([4, 4]);

  const step = z <= 4 ? 10 : z <= 7 ? 2 : 0.5;
  for (let lat = 20; lat <= 45; lat += step) {
    const p1 = projectToTilePixel(lat, 10, z, x, y, tileSize);
    const p2 = projectToTilePixel(lat, 50, z, x, y, tileSize);
    if ((p1.inside || p2.inside) || (p1.py >= 0 && p1.py <= tileSize)) {
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();

      // Rótulo da Latitude
      if (p1.px >= 5 && p1.px <= 40 && p1.py >= 12 && p1.py <= tileSize - 12 && z >= 5) {
        ctx.font = "8px serif";
        ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.4)" : "rgba(100, 80, 60, 0.6)";
        ctx.fillText(`${lat}°N`, p1.px + 4, p1.py - 3);
      }
    }
  }

  for (let lng = 10; lng <= 50; lng += step) {
    const p1 = projectToTilePixel(20, lng, z, x, y, tileSize);
    const p2 = projectToTilePixel(45, lng, z, x, y, tileSize);
    if ((p1.inside || p2.inside) || (p1.px >= 0 && p1.px <= tileSize)) {
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();

      // Rótulo da Longitude
      if (p2.py >= 5 && p2.py <= 30 && p2.px >= 12 && p2.px <= tileSize - 12 && z >= 5) {
        ctx.font = "8px serif";
        ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.4)" : "rgba(100, 80, 60, 0.6)";
        ctx.fillText(`${lng}°E`, p2.px + 2, p2.py + 10);
      }
    }
  }
  ctx.restore();

  // 3. Desenhar Massas de Terra (Continentes e Penínsulas)
  LAND_POLYGONS.forEach((poly) => {
    let hasPointInside = false;
    const projected = poly.map((pt) => {
      const p = projectToTilePixel(pt.lat, pt.lng, z, x, y, tileSize);
      if (p.inside) hasPointInside = true;
      return p;
    });

    if (!hasPointInside && z > 6) return;

    ctx.save();
    ctx.beginPath();
    projected.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.closePath();

    // Preenchimento da Terra
    if (isDark) {
      ctx.fillStyle = "#121d2b";
      ctx.fill();
      // Linha de Costa Brilhante
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#f5eee1";
      ctx.fill();
      // Linha de Costa estilo pergaminho sépia
      ctx.strokeStyle = "#a2896e";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Ondulação de água na costa
      ctx.strokeStyle = "rgba(140, 180, 195, 0.5)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
    }
    ctx.restore();
  });

  // 4. Desenhar Corpos D'Água Sagrados (Mar da Galileia, Mar Morto, Rio Jordão, Nilo, Eufrates)
  BIBLICAL_WATER_BODIES.forEach((body) => {
    let hasPointInside = false;
    const projected = body.coords.map((pt) => {
      const p = projectToTilePixel(pt.lat, pt.lng, z, x, y, tileSize);
      if (p.inside) hasPointInside = true;
      return p;
    });

    if (!hasPointInside && z > 7) return;

    ctx.save();
    ctx.beginPath();
    projected.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });

    if (body.type === "polygon") {
      ctx.closePath();
      if (isDark) {
        ctx.fillStyle = "#0c1827";
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#b8d7e3";
        ctx.fill();
        ctx.strokeStyle = "#4d7888";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    } else {
      // Rios
      if (isDark) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
        ctx.lineWidth = z >= 8 ? 2.5 : 1.5;
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#4c8196";
        ctx.lineWidth = z >= 8 ? 2.2 : 1.2;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Rótulo do Corpo D'Água
    if (body.labelPos && z >= 7) {
      const lp = projectToTilePixel(body.labelPos.lat, body.labelPos.lng, z, x, y, tileSize);
      if (lp.px >= 0 && lp.px <= tileSize && lp.py >= 0 && lp.py <= tileSize) {
        ctx.save();
        ctx.font = `italic ${z >= 9 ? "11px" : "9px"} Georgia, serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = isDark ? "#7dd3fc" : "#1e4e63";
        ctx.shadowColor = isDark ? "#000" : "#fff";
        ctx.shadowBlur = 3;
        ctx.fillText(body.name, lp.px, lp.py);
        ctx.restore();
      }
    }
  });

  // 5. Desenhar Marcos Topográficos / Montanhas Bíblicas
  if (z >= 6) {
    SACRED_MOUNTAINS.forEach((m) => {
      const p = projectToTilePixel(m.lat, m.lng, z, x, y, tileSize);
      if (p.px >= -20 && p.px <= tileSize + 20 && p.py >= -20 && p.py <= tileSize + 20) {
        ctx.save();
        // Ícone de Montanha Triângulo Cartográfico
        const size = z >= 9 ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py - size);
        ctx.lineTo(p.px + size, p.py + size);
        ctx.lineTo(p.px - size, p.py + size);
        ctx.closePath();

        ctx.fillStyle = isDark ? "#fbbf24" : "#8c6239";
        ctx.fill();
        ctx.strokeStyle = isDark ? "#000" : "#fff";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Nome da Montanha
        if (z >= 8) {
          ctx.font = "9px serif";
          ctx.textAlign = "center";
          ctx.fillStyle = isDark ? "#fde68a" : "#4a321a";
          ctx.shadowColor = isDark ? "#000" : "#fff";
          ctx.shadowBlur = 2;
          ctx.fillText(`▲ ${m.name}`, p.px, p.py - size - 3);
        }
        ctx.restore();
      }
    });
  }

  // 6. Desenhar Rótulos de Províncias e Regiões Bíblicas
  ANCIENT_REGIONS.forEach((reg) => {
    if (z >= reg.minZoom && z <= reg.maxZoom) {
      const p = projectToTilePixel(reg.lat, reg.lng, z, x, y, tileSize);
      if (p.px >= -50 && p.px <= tileSize + 50 && p.py >= -20 && p.py <= tileSize + 20) {
        ctx.save();
        const fontSize = z >= 8 ? 12 : z >= 6 ? 10 : 9;
        ctx.font = `bold ${fontSize}px "Cinzel", "Times New Roman", serif`;
        ctx.textAlign = "center";
        ctx.letterSpacing = "2px";

        if (isDark) {
          ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = "rgba(90, 70, 50, 0.85)";
          ctx.shadowColor = "#fff";
          ctx.shadowBlur = 3;
        }

        ctx.fillText(reg.name, p.px, p.py);
        ctx.restore();
      }
    }
  });

  // 7. Rosa dos Ventos / Linhas de Navegação Náutica Antiga (se no canto de tiles de oceano em zoom baixo)
  if (z <= 5 && ((x + y) % 3 === 0)) {
    ctx.save();
    ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(180, 140, 100, 0.2)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(tileSize / 2, tileSize / 2);
      ctx.lineTo(
        tileSize / 2 + Math.cos(angle) * tileSize,
        tileSize / 2 + Math.sin(angle) * tileSize
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Cria uma camada GridLayer customizada do Leaflet que renderiza 100% offline
 */
export function createOfflineLeafletGridLayer(theme: CartographyTheme = "parchment"): L.GridLayer {
  const OfflineLayer = L.GridLayer.extend({
    createTile: function (coords: { z: number; x: number; y: number }, done: (err: any, tile: HTMLElement) => void) {
      const tile = document.createElement("canvas");
      tile.width = 256;
      tile.height = 256;
      tile.className = "leaflet-tile";

      const ctx = tile.getContext("2d");
      if (ctx) {
        try {
          drawBiblicalOfflineTile(ctx, coords.z, coords.x, coords.y, theme, 256);
        } catch (e) {
          console.warn("Erro ao gerar tile offline:", e);
        }
      }

      // Notifica o Leaflet que o tile síncrono está pronto
      setTimeout(() => done(null, tile), 0);
      return tile;
    }
  });

  // @ts-expect-error instantiate extended class
  return new OfflineLayer({
    attribution: "Cartografia Bíblica Offline &bull; Terra Santa 100% Integrada",
    maxZoom: 14,
    minZoom: 3,
    tileSize: 256
  });
}

/**
 * Retorna uma DataURL contendo a imagem do tile renderizado para fallback instantâneo de erros
 */
export function getOfflineTileDataUrl(z: number, x: number, y: number, theme: CartographyTheme = "parchment"): string {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    drawBiblicalOfflineTile(ctx, z, x, y, theme, 256);
    return canvas.toDataURL("image/png");
  }
  return "";
}
