import { useState, useCallback, useRef, useEffect } from 'react';

// Tipos de áreas OSM a detectar
export type OSMAreaType = 
  | 'building' 
  | 'park' 
  | 'water' 
  | 'residential' 
  | 'commercial' 
  | 'industrial'
  | 'natural'
  | 'amenity'
  | 'highway'
  | 'landuse';

export interface OSMNode {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags?: Record<string, string>;
  areaType?: OSMAreaType;
  name?: string;
}

export interface OSMArea {
  id: number;
  type: 'way' | 'relation';
  areaType: OSMAreaType;
  name?: string;
  nodes: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

interface CacheEntry {
  data: { nodes: OSMNode[]; areas: OSMArea[] };
  timestamp: number;
  bbox: string;
}

interface UseOverpassAreasOptions {
  maxNodes?: number;
  maxBboxSize?: number;
  cacheExpiry?: number; // ms
  autoUpdate?: boolean;
  updateThreshold?: number; // meters
}

interface UseOverpassAreasReturn {
  nodes: OSMNode[];
  areas: OSMArea[];
  isLoading: boolean;
  error: string | null;
  fetchAreas: (lat: number, lon: number, radiusMeters?: number) => Promise<void>;
  clearCache: () => void;
  lastUpdate: Date | null;
  nodeCount: number;
}

// Límites según requerimientos
const MAX_NODES = 50000;
const MAX_BBOX_SIZE = 0.25; // grados
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos
const MIN_UPDATE_DISTANCE = 50; // metros

// Colores por tipo de área
export const AREA_TYPE_COLORS: Record<OSMAreaType, string> = {
  building: '#d4a574',
  park: '#90EE90',
  water: '#87CEEB',
  residential: '#FFE4B5',
  commercial: '#DDA0DD',
  industrial: '#A9A9A9',
  natural: '#228B22',
  amenity: '#FFD700',
  highway: '#808080',
  landuse: '#F5DEB3',
};

// Iconos por tipo de área
export const AREA_TYPE_ICONS: Record<OSMAreaType, string> = {
  building: '🏢',
  park: '🌳',
  water: '💧',
  residential: '🏠',
  commercial: '🏪',
  industrial: '🏭',
  natural: '🌿',
  amenity: '📍',
  highway: '🛣️',
  landuse: '🗺️',
};

// Cache local en memoria
const areaCache = new Map<string, CacheEntry>();

// Función para calcular distancia Haversine
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Función para determinar el tipo de área basado en tags OSM
const determineAreaType = (tags: Record<string, string>): OSMAreaType => {
  if (tags.building) return 'building';
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground') return 'park';
  if (tags.natural === 'water' || tags.waterway || tags.water) return 'water';
  if (tags.landuse === 'residential') return 'residential';
  if (tags.landuse === 'commercial' || tags.shop || tags.office) return 'commercial';
  if (tags.landuse === 'industrial') return 'industrial';
  if (tags.natural) return 'natural';
  if (tags.amenity) return 'amenity';
  if (tags.highway) return 'highway';
  if (tags.landuse) return 'landuse';
  return 'landuse';
};

// Generar clave de caché basada en bbox
const getCacheKey = (south: number, west: number, north: number, east: number): string => {
  // Redondear a 3 decimales para agrupar consultas cercanas
  const precision = 3;
  return `${south.toFixed(precision)},${west.toFixed(precision)},${north.toFixed(precision)},${east.toFixed(precision)}`;
};

// Construir query Overpass optimizada
const buildOverpassQuery = (south: number, west: number, north: number, east: number): string => {
  const bbox = `${south},${west},${north},${east}`;
  
  return `
[out:json][timeout:25][maxsize:10485760];
(
  // Edificios
  way["building"](${bbox});
  relation["building"](${bbox});
  
  // Parques y áreas verdes
  way["leisure"="park"](${bbox});
  way["leisure"="garden"](${bbox});
  relation["leisure"="park"](${bbox});
  
  // Agua
  way["natural"="water"](${bbox});
  way["waterway"](${bbox});
  relation["natural"="water"](${bbox});
  
  // Uso de suelo
  way["landuse"](${bbox});
  relation["landuse"](${bbox});
  
  // Amenidades importantes
  node["amenity"](${bbox});
  way["amenity"](${bbox});
  
  // Comercial
  node["shop"](${bbox});
  way["shop"](${bbox});
  
  // Vías principales (calles, avenidas, carreteras)
  way["highway"~"^(primary|secondary|tertiary|residential|pedestrian|footway|cycleway|path|unclassified|service)$"](${bbox});
);
out body geom;
>;
out skel qt;
`.trim();
};

export const useOverpassAreas = (options: UseOverpassAreasOptions = {}): UseOverpassAreasReturn => {
  const {
    maxNodes = MAX_NODES,
    maxBboxSize = MAX_BBOX_SIZE,
    cacheExpiry = CACHE_EXPIRY,
    autoUpdate = true,
    updateThreshold = MIN_UPDATE_DISTANCE,
  } = options;

  const [nodes, setNodes] = useState<OSMNode[]>([]);
  const [areas, setAreas] = useState<OSMArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const lastPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpiar caché expirada
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      areaCache.forEach((entry, key) => {
        if (now - entry.timestamp > cacheExpiry) {
          areaCache.delete(key);
        }
      });
    }, 60000); // Revisar cada minuto

    return () => clearInterval(interval);
  }, [cacheExpiry]);

  const fetchAreas = useCallback(async (lat: number, lon: number, radiusMeters = 500) => {
    // Verificar si necesitamos actualizar basado en la distancia
    if (autoUpdate && lastPositionRef.current) {
      const distance = haversineDistance(
        lat, lon,
        lastPositionRef.current.lat, lastPositionRef.current.lon
      );
      if (distance < updateThreshold) {
        return; // No actualizar si no nos hemos movido lo suficiente
      }
    }

    // Calcular bbox limitado
    const radiusDegrees = Math.min(radiusMeters / 111000, maxBboxSize / 2);
    const south = lat - radiusDegrees;
    const north = lat + radiusDegrees;
    const west = lon - radiusDegrees;
    const east = lon + radiusDegrees;

    // Verificar límite de bbox
    const bboxSize = Math.max(north - south, east - west);
    if (bboxSize > maxBboxSize) {
      setError(`El área de búsqueda excede el límite de ${maxBboxSize} grados`);
      return;
    }

    const cacheKey = getCacheKey(south, west, north, east);

    // Revisar caché
    const cached = areaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
      setNodes(cached.data.nodes);
      setAreas(cached.data.areas);
      setLastUpdate(new Date(cached.timestamp));
      lastPositionRef.current = { lat, lon };
      return;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const query = buildOverpassQuery(south, west, north, east);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.elements) {
        throw new Error('Respuesta inválida del servidor Overpass');
      }

      // Procesar elementos
      const processedNodes: OSMNode[] = [];
      const processedAreas: OSMArea[] = [];
      const nodeMap = new Map<number, { lat: number; lon: number }>();

      // Primera pasada: indexar nodos
      for (const element of data.elements) {
        if (element.type === 'node' && element.lat !== undefined && element.lon !== undefined) {
          nodeMap.set(element.id, { lat: element.lat, lon: element.lon });
          
          // Si tiene tags, es un POI
          if (element.tags && Object.keys(element.tags).length > 0) {
            const areaType = determineAreaType(element.tags);
            processedNodes.push({
              id: element.id,
              type: 'node',
              lat: element.lat,
              lon: element.lon,
              tags: element.tags,
              areaType,
              name: element.tags.name,
            });
          }
        }
      }

      // Segunda pasada: procesar ways y relations
      for (const element of data.elements) {
        if ((element.type === 'way' || element.type === 'relation') && element.tags) {
          const areaType = determineAreaType(element.tags);
          
          // Obtener geometría
          let geometry: Array<{ lat: number; lon: number }> = [];
          let center: { lat: number; lon: number } | undefined;

          if (element.geometry) {
            geometry = element.geometry.filter((g: { lat?: number; lon?: number }) => 
              g.lat !== undefined && g.lon !== undefined
            );
          } else if (element.nodes) {
            geometry = element.nodes
              .map((nodeId: number) => nodeMap.get(nodeId))
              .filter((n): n is { lat: number; lon: number } => n !== undefined);
          }

          // Calcular centro
          if (geometry.length > 0) {
            const sumLat = geometry.reduce((acc, g) => acc + g.lat, 0);
            const sumLon = geometry.reduce((acc, g) => acc + g.lon, 0);
            center = {
              lat: sumLat / geometry.length,
              lon: sumLon / geometry.length,
            };
          } else if (element.center) {
            center = { lat: element.center.lat, lon: element.center.lon };
          }

          if (geometry.length > 0 || center) {
            processedAreas.push({
              id: element.id,
              type: element.type as 'way' | 'relation',
              areaType,
              name: element.tags.name,
              nodes: geometry,
              tags: element.tags,
              center,
            });
          }
        }
      }

      // Verificar límite de nodos
      const totalNodes = processedNodes.length + processedAreas.reduce((acc, a) => acc + a.nodes.length, 0);
      if (totalNodes > maxNodes) {
        console.warn(`Se encontraron ${totalNodes} nodos, limitando a ${maxNodes}`);
        // Priorizar áreas sobre nodos individuales
        const limitedNodes = processedNodes.slice(0, Math.min(processedNodes.length, maxNodes / 2));
        const limitedAreas = processedAreas.slice(0, Math.min(processedAreas.length, maxNodes / 2));
        
        setNodes(limitedNodes);
        setAreas(limitedAreas);
        
        // Guardar en caché
        areaCache.set(cacheKey, {
          data: { nodes: limitedNodes, areas: limitedAreas },
          timestamp: Date.now(),
          bbox: cacheKey,
        });
      } else {
        setNodes(processedNodes);
        setAreas(processedAreas);
        
        // Guardar en caché
        areaCache.set(cacheKey, {
          data: { nodes: processedNodes, areas: processedAreas },
          timestamp: Date.now(),
          bbox: cacheKey,
        });
      }

      lastPositionRef.current = { lat, lon };
      setLastUpdate(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Petición cancelada, no hacer nada
      }
      console.error('Error fetching Overpass data:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener datos de áreas');
    } finally {
      setIsLoading(false);
    }
  }, [autoUpdate, updateThreshold, maxBboxSize, maxNodes, cacheExpiry]);

  const clearCache = useCallback(() => {
    areaCache.clear();
    setNodes([]);
    setAreas([]);
    lastPositionRef.current = null;
    setLastUpdate(null);
  }, []);

  return {
    nodes,
    areas,
    isLoading,
    error,
    fetchAreas,
    clearCache,
    lastUpdate,
    nodeCount: nodes.length + areas.reduce((acc, a) => acc + a.nodes.length, 0),
  };
};
