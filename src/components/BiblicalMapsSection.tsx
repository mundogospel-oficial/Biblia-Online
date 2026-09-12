import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  MapPin, 
  Compass, 
  BookOpen, 
  Search, 
  Navigation, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Info, 
  Layers, 
  Globe2, 
  Mountain, 
  ShieldCheck, 
  Volume2, 
  CheckCircle2,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { biblicalMaps, BiblicalMapTheme, MapLocation } from "@/data/biblicalMapsData";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BiblicalMapsSectionProps {
  onNavigateToVerse?: (bookAbbrev: string, chapter: number, verseNum?: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
}

type MapTileStyle = "satellite" | "physical" | "voyager" | "osm";

interface TileConfig {
  url: string;
  attribution: string;
  name: string;
  icon: any;
  subdomains?: string[];
  maxZoom?: number;
  maxNativeZoom?: number;
}

const TILE_SERVERS: Record<MapTileStyle, TileConfig> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Imagens de Satélite da Terra Santa",
    name: "Satélite Realista",
    icon: Globe2,
    maxZoom: 18,
    maxNativeZoom: 18
  },
  physical: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Topografia e Relevo Físico",
    name: "Relevo Topográfico",
    icon: Mountain,
    maxZoom: 18,
    maxNativeZoom: 16
  },
  voyager: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; National Geographic, Esri &mdash; Atlas Histórico e Cartografia",
    name: "Atlas Histórico",
    icon: Compass,
    maxZoom: 18,
    maxNativeZoom: 16
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    name: "Mapa Padrão",
    icon: Layers,
    maxZoom: 19,
    maxNativeZoom: 19
  }
};

export const BiblicalMapsSection: React.FC<BiblicalMapsSectionProps> = ({
  onNavigateToVerse,
  isFullscreen: propIsFullscreen,
  onToggleFullscreen
}) => {
  const navigate = useNavigate();
  const { isBeta, isAdmin, role } = useFeatureGate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedMapId, setSelectedMapId] = useState<string>("viagens-paulo");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>("loc-jerusalem");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tileStyle, setTileStyle] = useState<MapTileStyle>("satellite");
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : internalFullscreen;

  const handleToggleFullscreen = useCallback((val: boolean) => {
    if (onToggleFullscreen) {
      onToggleFullscreen(val);
    } else {
      setInternalFullscreen(val);
    }
  }, [onToggleFullscreen]);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const lastToastTimeRef = useRef<number>(0);

  // Redimensiona o mapa de forma fluida ao alternar tela cheia sem recriar elementos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Tecla ESC para sair de tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        handleToggleFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, handleToggleFullscreen]);

  const notifyMapError = useCallback(() => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 7000) {
      lastToastTimeRef.current = now;
      toast({
        title: "Aviso",
        description: "Erro, tente novamente mais tarde",
        variant: "destructive"
      });
    }
  }, [toast]);

  const createSafeTileLayer = useCallback((config: TileConfig) => {
    const layer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 18,
      maxNativeZoom: config.maxNativeZoom || config.maxZoom || 18,
      subdomains: config.subdomains || "abc",
      crossOrigin: true
    });

    layer.on("tileerror", (errorEvent: any) => {
      // Cleanly hide broken tile image without displaying logos or placeholders
      if (errorEvent && errorEvent.tile) {
        errorEvent.tile.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        errorEvent.tile.style.opacity = "0";
        errorEvent.tile.style.visibility = "hidden";
      }
      notifyMapError();
    });

    return layer;
  }, [notifyMapError]);

  const hasAccess = isBeta || isAdmin || role === "beta" || role === "admin";

  const currentMap = useMemo(() => {
    return biblicalMaps.find(m => m.id === selectedMapId) || biblicalMaps[0];
  }, [selectedMapId]);

  const selectedLocation = useMemo(() => {
    return currentMap.locations.find(l => l.id === selectedLocationId) || currentMap.locations[0];
  }, [currentMap, selectedLocationId]);

  const currentIndex = useMemo(() => {
    if (!selectedLocation) return -1;
    return currentMap.locations.findIndex(l => l.id === selectedLocation.id);
  }, [currentMap, selectedLocation]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentMap.locations;
    return currentMap.locations.filter(loc => 
      loc.name.toLowerCase().includes(q) ||
      (loc.modernName && loc.modernName.toLowerCase().includes(q)) ||
      loc.summary.toLowerCase().includes(q) ||
      loc.reference.toLowerCase().includes(q)
    );
  }, [currentMap, searchQuery]);

  // Initialize and update Leaflet Map only if user has access
  useEffect(() => {
    if (!hasAccess || !mapContainerRef.current) return;

    // Destroy existing instance if it somehow got detached
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Leaflet cleanup error:", e);
      }
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: currentMap.center,
        zoom: currentMap.defaultZoom,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 3
      });

      // Add Tile Layer with safe error handler
      const initialTile = TILE_SERVERS[tileStyle];
      const tileLayer = createSafeTileLayer(initialTile).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Add Route Polyline
      if (currentMap.routeCoordinates && currentMap.routeCoordinates.length > 1) {
        const polyline = L.polyline(currentMap.routeCoordinates, {
          color: "#38bdf8",
          weight: 3.5,
          opacity: 0.85,
          dashArray: "6, 8",
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map);
        polylineRef.current = polyline;
      }

      // Add Location Markers
      markersRef.current = {};
      currentMap.locations.forEach((loc, idx) => {
        const isSelected = selectedLocation?.id === loc.id;
        const stepNum = idx + 1;

        const iconHtml = `
          <div class="relative group cursor-pointer flex items-center justify-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-lg transition-all duration-300 ${
              isSelected 
                ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/50 scale-125 z-50 font-black shadow-amber-500/50 shadow-xl" 
                : "bg-cyan-600 text-white hover:bg-cyan-500 hover:scale-110 ring-2 ring-white/70"
            }">
              ${stepNum}
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-[10px] font-semibold text-white px-2 py-0.5 rounded-md shadow-md pointer-events-none border border-white/20 backdrop-blur-xs">
              ${loc.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "custom-biblical-marker",
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setSelectedLocationId(loc.id);
          map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 8), {
            duration: 1.2
          });
        });

        markersRef.current[loc.id] = marker;
      });

      // Invalidate size after layout settles to guarantee no blank tiles
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error("[Map] Erro ao instanciar Leaflet:", err);
    }
  }, [hasAccess, currentMap, selectedMapId, tileStyle, selectedLocation?.id, createSafeTileLayer]);

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    if (!hasAccess || !mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const currentTile = TILE_SERVERS[tileStyle];
    const newTile = createSafeTileLayer(currentTile).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [tileStyle, hasAccess, createSafeTileLayer]);

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const handleSelectLocation = (loc: MapLocation) => {
    setSelectedLocationId(loc.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], Math.max(mapInstanceRef.current.getZoom(), 8), {
        duration: 1.2
      });
    }
  };

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentMap.center, currentMap.defaultZoom, {
        duration: 1
      });
    }
  };

  const handleStepLocation = (dir: "prev" | "next") => {
    if (currentIndex === -1) return;
    const total = currentMap.locations.length;
    const newIdx = dir === "next" 
      ? (currentIndex + 1) % total 
      : (currentIndex - 1 + total) % total;
    const nextLoc = currentMap.locations[newIdx];
    handleSelectLocation(nextLoc);
  };

  const handleReadChapter = (loc: MapLocation) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(loc.bookAbbrev, loc.chapter, loc.verseNum);
    } else {
      navigate(`/livro/${loc.bookAbbrev}/${loc.chapter}`);
    }
  };

  // Narração de áudio nativa do sistema (Web Speech API)
  const speakLocation = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !selectedLocation) return;
    
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${selectedLocation.name}. ${selectedLocation.summary}. Contexto histórico: ${selectedLocation.historicalNote}. Texto bíblico em ${selectedLocation.reference}: ${selectedLocation.keyVerse}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  }, [selectedLocation, isPlayingAudio]);

  // Se a conta não tiver permissão de testes/beta, não exibe nada
  if (!hasAccess) {
    return null;
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? "h-full flex flex-col flex-1 min-h-0" : ""}`}>
      {/* Header com Título, Descrição, Selo Beta e Seletor de Rotas Bíblicas - Sempre presente sem mudar nada */}
      <div className="relative glass-card rounded-2xl p-5 sm:p-6 border border-border bg-card/60 shadow-md flex flex-col gap-4 shrink-0">
        <div className="flex items-start justify-between gap-4 pr-16 sm:pr-28">
          <div className="space-y-1 max-w-2xl">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
              <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-accent shrink-0" />
              <span>Mapas Bíblicos Realistas & Interativos</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Geografia sagrada em alta resolução com satélite realista, relevo topográfico, atlas histórico e contextualização bíblica versículo por versículo.
            </p>
          </div>

          {/* Top Right: Botão de Sair da Tela Cheia (se em tela cheia) + Selo Beta no tema do app */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center gap-2">
            {isFullscreen && (
              <button
                onClick={() => handleToggleFullscreen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-bold border border-destructive/30 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Sair da Tela Cheia (ESC)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair da Tela Cheia</span>
              </button>
            )}

            {/* Selo Beta no tema do app: azul com 2 tons misturados, borda luminosa, ícone Sparkles e sem piscar */}
            <div
              id="biblical-maps-badge-beta"
              className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full bg-gradient-to-r from-[#031d2e] via-[#021422] to-[#04253a] border border-[#0ea5e9] shadow-[0_0_12px_rgba(14,165,233,0.25)] backdrop-blur-md transition-all hover:border-[#38bdf8] hover:shadow-[0_0_16px_rgba(14,165,233,0.35)] select-none"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#38bdf8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#bae6fd] font-mono leading-none">
                BETA
              </span>
            </div>
          </div>
        </div>

        {/* Seletor de Temas dos Mapas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full themed-scrollbar visible-scrollbar pt-2 border-t border-border/40">
          {biblicalMaps.map((mapItem) => {
            const isSelected = mapItem.id === selectedMapId;
            return (
              <button
                key={mapItem.id}
                onClick={() => {
                  setSelectedMapId(mapItem.id);
                  setSelectedLocationId(mapItem.locations[0]?.id || null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? "bg-accent text-accent-foreground border-accent shadow-sm font-bold"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border/60 hover:bg-secondary"
                }`}
              >
                <span>{mapItem.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-black/25 text-white" : "bg-muted text-muted-foreground"}`}>
                  {mapItem.locations.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Interativo: Mapa e Detalhes - Elemento único no DOM para transição suave sem recriar mapa */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${
        isFullscreen ? "items-stretch flex-1 min-h-0 overflow-y-auto lg:overflow-visible visible-scrollbar" : "items-start"
      }`}>
        {/* Map Stage */}
        <div className={`lg:col-span-7 xl:col-span-7 space-y-2.5 flex flex-col ${
          isFullscreen ? "h-full min-h-[460px] lg:min-h-0" : ""
        }`}>
          <div className={`relative rounded-2xl overflow-hidden border border-border shadow-xl bg-slate-950 transition-all duration-300 ${
            isFullscreen ? "flex-1 min-h-[380px] lg:min-h-0" : "h-[500px] sm:h-[560px] lg:h-[600px]"
          }`}>
              {/* Custom style to eliminate broken images or logo placeholders */}
              <style>{`
                .leaflet-tile-container img {
                  border: 0 !important;
                  outline: 0 !important;
                }
                .leaflet-tile-container img:not([src]),
                .leaflet-tile-container img[src*="data:image/gif"] {
                  opacity: 0 !important;
                  visibility: hidden !important;
                  display: none !important;
                }
                .leaflet-container {
                  background: #090e17 !important;
                }
              `}</style>

              {/* Map Container */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Top Overlay: Layer Switcher & Action Buttons (Center & Fullscreen) */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
                {/* Layer Style Pills com barra de rolagem visível */}
                <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg pointer-events-auto overflow-x-auto max-w-[70%] sm:max-w-[78%] themed-scrollbar visible-scrollbar">
                  {(Object.keys(TILE_SERVERS) as MapTileStyle[]).map((styleKey) => {
                    const item = TILE_SERVERS[styleKey];
                    const Icon = item.icon;
                    const isActive = tileStyle === styleKey;
                    return (
                      <button
                        key={styleKey}
                        onClick={() => setTileStyle(styleKey)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Botões à direita: Centralizar e Alternar Tela Cheia para os 3 Blocos */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    onClick={handleResetMap}
                    className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-white/15 shadow-lg transition-colors cursor-pointer"
                    title="Centralizar Mapa"
                  >
                    <Compass className="h-4 w-4 text-amber-400" />
                  </button>

                  <button
                    onClick={() => handleToggleFullscreen(!isFullscreen)}
                    className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-white/15 shadow-lg transition-colors cursor-pointer flex items-center gap-1"
                    title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-amber-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Overlay: Location Stepper Navigation */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shadow-lg pointer-events-auto flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> {currentIndex + 1} de {currentMap.locations.length}
                  </span>
                  <span className="text-[11px] text-slate-300 truncate max-w-[130px] sm:max-w-[200px]">
                    {selectedLocation?.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg pointer-events-auto">
                  <button
                    onClick={() => handleStepLocation("prev")}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Ponto Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStepLocation("next")}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Próximo Ponto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Route Points Horizontal Bar - Barra de rolagem estilizada idêntica */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-0.5 themed-scrollbar visible-scrollbar select-none">
              {currentMap.locations.map((loc, idx) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-accent text-accent-foreground border-accent shadow-sm font-bold"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isSelected ? "bg-accent-foreground text-accent" : "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{loc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Details Inspector Sidebar */}
          <div className={`lg:col-span-5 xl:col-span-5 flex flex-col ${
            isFullscreen ? "h-full min-h-[380px] lg:min-h-0 overflow-y-auto visible-scrollbar" : ""
          }`}>
            <AnimatePresence mode="wait">
              {selectedLocation ? (
                <motion.div
                  key={selectedLocation.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card rounded-2xl p-5 border border-border bg-card shadow-lg flex flex-col justify-between space-y-4 h-full"
                >
                  <div className="space-y-4">
                    {/* Title & Badges */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-bold">
                          <MapPin className="h-3 w-3" />
                          <span>Ponto {currentIndex + 1} de {currentMap.locations.length}</span>
                        </div>
                        {selectedLocation.modernName && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Globe2 className="h-3 w-3" />
                            {selectedLocation.modernName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                          {selectedLocation.name}
                        </h3>
                        <button
                          onClick={speakLocation}
                          className={`p-2 rounded-full border border-border transition-colors cursor-pointer ${
                            isPlayingAudio ? "bg-accent text-accent-foreground animate-pulse" : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                          title="Ouvir explicação em áudio do sistema"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl bg-secondary/50 p-3 border border-border/60">
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                        {selectedLocation.summary}
                      </p>
                    </div>

                    {/* Historical & Archaeological Note */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Info className="h-3.5 w-3.5 text-accent" />
                        <span>Contexto Histórico & Arqueológico</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedLocation.historicalNote}
                      </p>
                    </div>

                    {/* Key Scripture Verse Box */}
                    <div className="rounded-xl bg-accent/10 border border-accent/25 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Texto Bíblico Sagrado
                        </span>
                        <span className="text-[11px] font-bold text-accent px-2 py-0.5 rounded-md bg-accent/20">
                          {selectedLocation.reference}
                        </span>
                      </div>
                      <p className="font-serif text-xs sm:text-sm italic text-foreground leading-relaxed">
                        "{selectedLocation.keyVerse}"
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Read Chapter & Step */}
                  <div className="space-y-2 pt-2 border-t border-border/80">
                    <button
                      onClick={() => handleReadChapter(selectedLocation)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-xs font-bold shadow-md hover:bg-accent/90 transition-transform active:scale-98 cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Ler {selectedLocation.reference.split('/')[0].trim()} na Bíblia</span>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStepLocation("prev")}
                        className="flex items-center justify-center gap-1 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 text-xs font-medium border border-border transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 text-accent" />
                        <span>Ponto Anterior</span>
                      </button>
                      <button
                        onClick={() => handleStepLocation("next")}
                        className="flex items-center justify-center gap-1 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 text-xs font-medium border border-border transition-colors cursor-pointer"
                      >
                        <span>Próximo Ponto</span>
                        <ChevronRight className="h-3.5 w-3.5 text-accent" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-card rounded-2xl p-6 border border-border bg-card/60 flex flex-col items-center justify-center text-center h-full space-y-3">
                  <MapPin className="h-8 w-8 text-accent animate-bounce" />
                  <h4 className="font-serif text-lg font-bold text-foreground">Selecione um Ponto no Mapa</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Clique em qualquer marcador numerado no mapa para ver a rota detalhada, o contexto histórico e ler o capítulo bíblico.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </div>
  );
};
