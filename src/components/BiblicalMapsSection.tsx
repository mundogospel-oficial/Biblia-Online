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
  Calendar,
  Layers,
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Globe2,
  Mountain,
  SunMedium,
  CheckCircle2,
  Volume2
} from "lucide-react";
import { biblicalMaps, BiblicalMapTheme, MapLocation } from "@/data/biblicalMapsData";

interface BiblicalMapsSectionProps {
  onNavigateToVerse?: (bookAbbrev: string, chapter: number, verseNum?: number) => void;
}

type MapTileStyle = "satellite" | "physical" | "voyager" | "osm";

const TILE_SERVERS: Record<MapTileStyle, { url: string; attribution: string; name: string; icon: any }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Imagens de Satélite da Terra Santa",
    name: "Satélite Realista",
    icon: Globe2
  },
  physical: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Topografia e Relevo Físico",
    name: "Relevo Topográfico",
    icon: Mountain
  },
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CartoDB &mdash; Atlas Histórico e Cartografia",
    name: "Atlas Histórico",
    icon: Compass
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    name: "Mapa Padrão",
    icon: Layers
  }
};

export const BiblicalMapsSection: React.FC<BiblicalMapsSectionProps> = ({ onNavigateToVerse }) => {
  const navigate = useNavigate();
  const [selectedMapId, setSelectedMapId] = useState<string>("viagens-paulo");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>("loc-jerusalem");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tileStyle, setTileStyle] = useState<MapTileStyle>("satellite");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);

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

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: currentMap.center,
        zoom: currentMap.defaultZoom,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 17,
        minZoom: 3
      });

      // Tile layer
      const initialTile = TILE_SERVERS[tileStyle];
      const tileLayer = L.tileLayer(initialTile.url, {
        attribution: initialTile.attribution,
        maxZoom: 18
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(currentMap.center, currentMap.defaultZoom);
    }

    const map = mapInstanceRef.current;

    // Remove existing markers & polylines
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

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

    // Add Location Markers with custom DivIcons
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

  }, [currentMap, selectedMapId, tileStyle, selectedLocation?.id]);

  // Update Tile Layer when tileStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const currentTile = TILE_SERVERS[tileStyle];
    const newTile = L.tileLayer(currentTile.url, {
      attribution: currentTile.attribution,
      maxZoom: 18
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [tileStyle]);

  // Update active marker styling when selectedLocationId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    currentMap.locations.forEach((loc, idx) => {
      const marker = markersRef.current[loc.id];
      if (!marker) return;

      const isSelected = selectedLocation.id === loc.id;
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

      marker.setIcon(L.divIcon({
        className: "custom-biblical-marker",
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }));
    });
  }, [selectedLocationId, currentMap, selectedLocation]);

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

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      if (delta > 0) mapInstanceRef.current.zoomIn();
      else mapInstanceRef.current.zoomOut();
    }
  };

  const handleStepLocation = (dir: "prev" | "next") => {
    if (currentIndex === -1) return;
    const nextIdx = dir === "next" 
      ? (currentIndex + 1) % currentMap.locations.length
      : (currentIndex - 1 + currentMap.locations.length) % currentMap.locations.length;
    const nextLoc = currentMap.locations[nextIdx];
    handleSelectLocation(nextLoc);
  };

  const handleReadChapter = (loc: MapLocation) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(loc.bookAbbrev, loc.chapter, loc.verseNum);
    } else {
      navigate(`/livro/${loc.bookAbbrev}/${loc.chapter}`);
    }
  };

  // Narração de áudio da nota histórica
  const speakLocation = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !selectedLocation) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${selectedLocation.name}. ${selectedLocation.summary}. Nota histórica: ${selectedLocation.historicalNote}. Versículo chave: ${selectedLocation.keyVerse}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  }, [isPlayingAudio, selectedLocation]);

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4 overflow-y-auto scrollbar-none no-scrollbar" : ""}`}>
      {/* Map Header and Category Selector */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border bg-card/70 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>Mapas Bíblicos Realistas & Interativos</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-accent text-accent-foreground rounded font-black">
                GEO ATLAS
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Geografia, Satélite e Rotas Históricas das Escrituras
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Navegue com cartografia realista de satélite e relevo topográfico pelos cenários sagrados de Israel, Sinai, Grécia, Turquia e Roma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cidades ou eventos..."
                className="w-full rounded-xl border border-border bg-secondary/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Biblical Map Themes Horizontal Selector */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {biblicalMaps.map((map) => {
            const isSelected = map.id === selectedMapId;
            return (
              <button
                key={map.id}
                onClick={() => {
                  setSelectedMapId(map.id);
                  setSelectedLocationId(map.locations[0]?.id || null);
                }}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-accent text-accent-foreground border-accent shadow-md scale-102 font-bold"
                    : "bg-secondary/70 text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Navigation className={`h-3.5 w-3.5 ${isSelected ? "text-accent-foreground" : "text-accent"}`} />
                <span>{map.title}</span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono ${
                  isSelected ? "bg-accent-foreground/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {map.locations.length} locais
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Map & Details Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map Canvas with Controls (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-border/80 bg-slate-950 shadow-2xl">
            {/* Real Leaflet Map Container */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            {/* Top-Left: Map Theme Badge & Location Count */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white shadow-lg pointer-events-auto flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold">{currentMap.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentMap.period})</span>
              </div>
            </div>

            {/* Top-Right: Map Style Layer Switcher & Fullscreen */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-lg">
              {(Object.keys(TILE_SERVERS) as MapTileStyle[]).map((st) => {
                const info = TILE_SERVERS[st];
                const IconComponent = info.icon;
                const isCurrent = tileStyle === st;
                return (
                  <button
                    key={st}
                    onClick={() => setTileStyle(st)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      isCurrent 
                        ? "bg-amber-400 text-slate-950 shadow-sm font-bold" 
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                    title={info.name}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span className="hidden sm:inline">{info.name}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Bottom-Left: Zoom & Reset Controls */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-lg">
              <button
                onClick={() => handleZoom(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white hover:bg-slate-800 font-bold text-sm transition-colors"
                title="Aproximar (+)"
              >
                +
              </button>
              <button
                onClick={() => handleZoom(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white hover:bg-slate-800 font-bold text-sm transition-colors"
                title="Afastar (-)"
              >
                -
              </button>
              <div className="h-4 w-px bg-white/20 mx-0.5" />
              <button
                onClick={handleResetMap}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                title="Centralizar mapa"
              >
                <RotateCw className="h-3 w-3 text-cyan-400" />
                <span className="hidden sm:inline">Centralizar</span>
              </button>
            </div>

            {/* Bottom-Right: Step Navigation (Prev / Next Stop) */}
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-lg">
              <button
                onClick={() => handleStepLocation("prev")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                title="Ponto anterior na rota"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">
                {currentIndex + 1} / {currentMap.locations.length}
              </span>
              <button
                onClick={() => handleStepLocation("next")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                title="Próximo ponto na rota"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Quick Location Pills under Map */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-accent" /> Rota:
            </span>
            {filteredLocations.map((loc, idx) => {
              const isSelected = selectedLocation?.id === loc.id;
              const originalIndex = currentMap.locations.findIndex(l => l.id === loc.id) + 1;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 border shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-accent/20 border-accent text-accent font-bold shadow-xs scale-105"
                      : "bg-secondary/60 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {originalIndex}
                  </span>
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Details Inspector Sidebar (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
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
                        className={`p-2 rounded-full border border-border transition-colors ${
                          isPlayingAudio ? "bg-accent text-accent-foreground animate-pulse" : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                        title="Ouvir explicação em áudio"
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
