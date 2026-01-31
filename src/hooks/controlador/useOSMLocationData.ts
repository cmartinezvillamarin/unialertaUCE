import { useCallback, useRef } from 'react';

export interface OSMLocationData {
  edificio?: string;
  piso?: string;
  aulaSala?: string;
  puntoReferencia?: string;
}

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  nodes?: number[];
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

// Cache para evitar consultas repetidas
const locationCache = new Map<string, { data: OSMLocationData; timestamp: number }>();
const CACHE_EXPIRY = 60 * 1000; // 1 minuto

/**
 * Tipos de áreas que pueden usarse para los campos de ubicación
 */
type AreaType = 'building' | 'park' | 'water' | 'residential' | 'commercial' | 'industrial' | 'natural' | 'service' | 'highway' | 'landuse' | 'amenity' | 'leisure' | 'shop' | 'office';

/**
 * Hook para obtener datos de ubicación desde OSM (edificio, piso, aula/sala, punto de referencia)
 */
export function useOSMLocationData() {
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Verifica si un punto está dentro de un polígono usando el algoritmo ray casting
   */
  const isPointInPolygon = useCallback((
    lat: number,
    lon: number,
    polygon: Array<{ lat: number; lon: number }>
  ): boolean => {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].lon, yi = polygon[i].lat;
      const xj = polygon[j].lon, yj = polygon[j].lat;
      
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }, []);

  /**
   * Calcula la distancia entre dos puntos en metros
   */
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  /**
   * Construye la query de Overpass para obtener datos de TODOS los tipos de áreas cercanas
   */
  const buildOverpassQuery = useCallback((lat: number, lon: number): string => {
    // Radio para obtener puntos de referencia cercanos
    const radius = 100;
    
    return `
[out:json][timeout:15];
(
  // Edificios
  way["building"](around:${radius},${lat},${lon});
  relation["building"](around:${radius},${lat},${lon});
  
  // Parques y áreas verdes
  way["leisure"="park"](around:${radius},${lat},${lon});
  way["leisure"="garden"](around:${radius},${lat},${lon});
  way["leisure"="playground"](around:${radius},${lat},${lon});
  way["leisure"="sports_centre"](around:${radius},${lat},${lon});
  relation["leisure"](around:${radius},${lat},${lon});
  
  // Agua
  way["natural"="water"](around:${radius},${lat},${lon});
  way["waterway"](around:${radius},${lat},${lon});
  relation["natural"="water"](around:${radius},${lat},${lon});
  
  // Áreas residenciales
  way["landuse"="residential"](around:${radius},${lat},${lon});
  way["residential"](around:${radius},${lat},${lon});
  relation["landuse"="residential"](around:${radius},${lat},${lon});
  
  // Áreas comerciales
  way["landuse"="commercial"](around:${radius},${lat},${lon});
  way["landuse"="retail"](around:${radius},${lat},${lon});
  relation["landuse"="commercial"](around:${radius},${lat},${lon});
  
  // Áreas industriales
  way["landuse"="industrial"](around:${radius},${lat},${lon});
  relation["landuse"="industrial"](around:${radius},${lat},${lon});
  
  // Áreas naturales
  way["natural"](around:${radius},${lat},${lon});
  relation["natural"](around:${radius},${lat},${lon});
  
  // Servicios y amenidades
  node["amenity"](around:${radius},${lat},${lon});
  way["amenity"](around:${radius},${lat},${lon});
  relation["amenity"](around:${radius},${lat},${lon});
  
  // Vías y calles
  way["highway"](around:${radius},${lat},${lon});
  
  // Uso de suelo general
  way["landuse"](around:${radius},${lat},${lon});
  relation["landuse"](around:${radius},${lat},${lon});
  
  // Lugares con nombre específico
  node["name"](around:${radius},${lat},${lon});
  way["name"](around:${radius},${lat},${lon});
  
  // Oficinas y comercios
  node["office"](around:${radius},${lat},${lon});
  way["office"](around:${radius},${lat},${lon});
  node["shop"](around:${radius},${lat},${lon});
  way["shop"](around:${radius},${lat},${lon});
  
  // Lugares específicos
  way["place"](around:${radius},${lat},${lon});
  node["place"](around:${radius},${lat},${lon});
);
out body geom;
`.trim();
  }, []);

  /**
   * Determina el tipo de área de un elemento OSM
   */
  const getAreaType = (tags: Record<string, string>): AreaType | null => {
    if (tags.building) return 'building';
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'playground') return 'park';
    if (tags.natural === 'water' || tags.waterway) return 'water';
    if (tags.landuse === 'residential' || tags.residential) return 'residential';
    if (tags.landuse === 'commercial' || tags.landuse === 'retail') return 'commercial';
    if (tags.landuse === 'industrial') return 'industrial';
    if (tags.natural) return 'natural';
    if (tags.amenity) return 'amenity';
    if (tags.leisure) return 'leisure';
    if (tags.shop) return 'shop';
    if (tags.office) return 'office';
    if (tags.highway) return 'highway';
    if (tags.landuse) return 'landuse';
    return null;
  };

  /**
   * Traduce el tipo de área a español
   */
  const translateAreaType = (type: AreaType | null, tags?: Record<string, string>): string => {
    if (!type) return '';
    
    const translations: Record<AreaType, string> = {
      building: 'Edificio',
      park: 'Parque',
      water: 'Cuerpo de agua',
      residential: 'Área residencial',
      commercial: 'Área comercial',
      industrial: 'Área industrial',
      natural: 'Área natural',
      service: 'Servicio',
      highway: 'Vía',
      landuse: 'Uso de suelo',
      amenity: 'Servicio',
      leisure: 'Área recreativa',
      shop: 'Comercio',
      office: 'Oficina',
    };

    // Traducciones específicas según el tag
    if (tags) {
      // Tipos de edificios
      if (tags.building && tags.building !== 'yes') {
        const buildingTranslations: Record<string, string> = {
          university: 'Universidad',
          school: 'Escuela',
          hospital: 'Hospital',
          church: 'Iglesia',
          commercial: 'Edificio comercial',
          industrial: 'Edificio industrial',
          residential: 'Edificio residencial',
          office: 'Edificio de oficinas',
          retail: 'Centro comercial',
          apartments: 'Edificio de apartamentos',
          hotel: 'Hotel',
          public: 'Edificio público',
          civic: 'Edificio cívico',
          government: 'Edificio gubernamental',
          library: 'Biblioteca',
          museum: 'Museo',
          stadium: 'Estadio',
          sports_centre: 'Centro deportivo',
          gym: 'Gimnasio',
          dormitory: 'Dormitorio',
          garage: 'Garaje',
          warehouse: 'Bodega',
          shed: 'Cobertizo',
          cabin: 'Cabaña',
          chapel: 'Capilla',
          kindergarten: 'Jardín de infantes',
        };
        if (buildingTranslations[tags.building]) {
          return buildingTranslations[tags.building];
        }
      }

      // Tipos de leisure
      if (tags.leisure) {
        const leisureTranslations: Record<string, string> = {
          park: 'Parque',
          garden: 'Jardín',
          playground: 'Parque infantil',
          sports_centre: 'Centro deportivo',
          stadium: 'Estadio',
          swimming_pool: 'Piscina',
          pitch: 'Cancha',
          track: 'Pista',
          golf_course: 'Campo de golf',
          nature_reserve: 'Reserva natural',
          common: 'Área común',
        };
        if (leisureTranslations[tags.leisure]) {
          return leisureTranslations[tags.leisure];
        }
      }

      // Tipos de amenidades
      if (tags.amenity) {
        const amenityTranslations: Record<string, string> = {
          university: 'Universidad',
          school: 'Escuela',
          college: 'Colegio',
          hospital: 'Hospital',
          clinic: 'Clínica',
          pharmacy: 'Farmacia',
          restaurant: 'Restaurante',
          cafe: 'Cafetería',
          bank: 'Banco',
          atm: 'Cajero automático',
          parking: 'Estacionamiento',
          fuel: 'Gasolinera',
          police: 'Policía',
          fire_station: 'Estación de bomberos',
          post_office: 'Oficina de correos',
          library: 'Biblioteca',
          theatre: 'Teatro',
          cinema: 'Cine',
          marketplace: 'Mercado',
          bus_station: 'Terminal de buses',
          taxi: 'Parada de taxis',
          place_of_worship: 'Lugar de culto',
          toilets: 'Baños públicos',
          drinking_water: 'Bebedero',
          bench: 'Banca',
        };
        if (amenityTranslations[tags.amenity]) {
          return amenityTranslations[tags.amenity];
        }
      }

      // Tipos de vías
      if (tags.highway) {
        const highwayTranslations: Record<string, string> = {
          primary: 'Vía principal',
          secondary: 'Vía secundaria',
          tertiary: 'Vía terciaria',
          residential: 'Calle residencial',
          footway: 'Sendero peatonal',
          path: 'Camino',
          cycleway: 'Ciclovía',
          pedestrian: 'Zona peatonal',
          service: 'Vía de servicio',
          track: 'Camino rural',
          steps: 'Escaleras',
          corridor: 'Corredor',
          living_street: 'Calle residencial',
          unclassified: 'Calle',
        };
        if (highwayTranslations[tags.highway]) {
          return highwayTranslations[tags.highway];
        }
      }

      // Tipos de landuse
      if (tags.landuse) {
        const landuseTranslations: Record<string, string> = {
          residential: 'Área residencial',
          commercial: 'Área comercial',
          industrial: 'Área industrial',
          retail: 'Zona comercial',
          grass: 'Césped',
          meadow: 'Pradera',
          forest: 'Bosque',
          farmland: 'Terreno agrícola',
          recreation_ground: 'Área recreativa',
          cemetery: 'Cementerio',
          construction: 'Zona en construcción',
          brownfield: 'Terreno baldío',
          greenfield: 'Área verde',
          education: 'Área educativa',
          religious: 'Área religiosa',
        };
        if (landuseTranslations[tags.landuse]) {
          return landuseTranslations[tags.landuse];
        }
      }

      // Tipos de natural
      if (tags.natural) {
        const naturalTranslations: Record<string, string> = {
          water: 'Cuerpo de agua',
          wood: 'Bosque',
          tree: 'Árbol',
          grassland: 'Pastizal',
          scrub: 'Matorral',
          wetland: 'Humedal',
          beach: 'Playa',
          cliff: 'Acantilado',
          rock: 'Roca',
          peak: 'Cima',
          spring: 'Manantial',
        };
        if (naturalTranslations[tags.natural]) {
          return naturalTranslations[tags.natural];
        }
      }
    }

    return translations[type] || '';
  };

  /**
   * Obtiene el nombre más apropiado de un elemento
   */
  const getElementName = (element: OSMElement): string | undefined => {
    const tags = element.tags || {};
    return tags.name || 
           tags['addr:housename'] || 
           tags['building:name'] ||
           tags['loc_name'] ||
           tags['alt_name'] ||
           tags.ref ||
           tags['addr:street'];
  };

  /**
   * Extrae los datos de ubicación de los elementos OSM con lógica mejorada
   */
  const extractLocationData = useCallback((
    elements: OSMElement[],
    targetLat: number,
    targetLon: number
  ): OSMLocationData => {
    const result: OSMLocationData = {};
    
    // Estructura para almacenar el área que contiene el punto
    let containingArea: { element: OSMElement; type: AreaType; distance: number } | null = null;
    
    // Estructura para el punto de referencia más cercano
    let nearestReference: { element: OSMElement; type: AreaType; distance: number; name: string } | null = null;
    
    // Estructura para la vía más cercana (para "piso")
    let nearestHighway: { element: OSMElement; distance: number; name: string } | null = null;

    for (const element of elements) {
      const tags = element.tags || {};
      const areaType = getAreaType(tags);
      
      if (!areaType) continue;

      let isInside = false;
      let distance = Infinity;
      
      // Calcular si el punto está dentro y la distancia
      if (element.geometry && element.geometry.length > 0) {
        isInside = isPointInPolygon(targetLat, targetLon, element.geometry);
        
        // Calcular distancia al centro aproximado
        const sumLat = element.geometry.reduce((sum, p) => sum + p.lat, 0);
        const sumLon = element.geometry.reduce((sum, p) => sum + p.lon, 0);
        const centerLat = sumLat / element.geometry.length;
        const centerLon = sumLon / element.geometry.length;
        distance = calculateDistance(targetLat, targetLon, centerLat, centerLon);
      } else if (element.center) {
        distance = calculateDistance(targetLat, targetLon, element.center.lat, element.center.lon);
      } else if (element.lat !== undefined && element.lon !== undefined) {
        distance = calculateDistance(targetLat, targetLon, element.lat, element.lon);
      }

      const name = getElementName(element);

      // Para vías, guardar la más cercana
      if (areaType === 'highway' && name) {
        if (!nearestHighway || distance < nearestHighway.distance) {
          nearestHighway = { element, distance, name };
        }
      }

      // Si el punto está dentro de un área, usar esa área para "edificio" y "aulaSala"
      if (isInside || distance < 30) {
        if (!containingArea || distance < containingArea.distance) {
          containingArea = { element, type: areaType, distance: isInside ? 0 : distance };
        }
      }

      // Para punto de referencia, buscar cualquier elemento cercano con nombre
      if (name && distance <= 100) {
        if (!nearestReference || distance < nearestReference.distance) {
          nearestReference = { element, type: areaType, distance, name };
        }
      }
    }

    // Asignar campos basados en los datos encontrados
    
    // Punto de Referencia: el punto con nombre más cercano
    if (nearestReference) {
      const typeTranslation = translateAreaType(nearestReference.type, nearestReference.element.tags);
      if (typeTranslation) {
        result.puntoReferencia = `${nearestReference.name} (${typeTranslation})`;
      } else {
        result.puntoReferencia = nearestReference.name;
      }
    }

    // Edificio: el área que contiene el marcador (puede ser cualquier tipo)
    if (containingArea) {
      const name = getElementName(containingArea.element);
      const typeTranslation = translateAreaType(containingArea.type, containingArea.element.tags);
      
      if (name) {
        result.edificio = name;
      } else if (typeTranslation) {
        result.edificio = typeTranslation;
      }
    }

    // Piso: la vía/calle donde está el marcador
    if (nearestHighway) {
      const tags = nearestHighway.element.tags || {};
      const highwayType = translateAreaType('highway', tags);
      result.piso = `${nearestHighway.name}${highwayType ? ` (${highwayType})` : ''}`;
    } else if (containingArea) {
      // Si no hay vía, usar información del área contenedora
      const tags = containingArea.element.tags || {};
      if (tags['building:levels']) {
        result.piso = `Edificio de ${tags['building:levels']} pisos`;
      } else if (tags.level) {
        result.piso = `Nivel ${tags.level}`;
      }
    }

    // Aula/Sala: información específica de la ubicación dentro del área
    if (containingArea) {
      const tags = containingArea.element.tags || {};
      const specificLocation = tags.room || 
                               tags.ref || 
                               tags['addr:unit'] ||
                               tags['addr:flats'] ||
                               tags['addr:door'];
      
      if (specificLocation) {
        result.aulaSala = specificLocation;
      } else {
        // Usar el tipo de área traducido como ubicación
        const typeTranslation = translateAreaType(containingArea.type, tags);
        if (typeTranslation && !result.edificio?.includes(typeTranslation)) {
          result.aulaSala = typeTranslation;
        }
      }
    }
    
    return result;
  }, [isPointInPolygon, calculateDistance]);

  /**
   * Obtiene los datos de ubicación OSM para un punto específico
   */
  const fetchOSMLocationData = useCallback(async (lat: number, lon: number): Promise<OSMLocationData> => {
    // Generar clave de cache basada en coordenadas redondeadas
    const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    
    // Verificar cache
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.data;
    }
    
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const query = buildOverpassQuery(lat, lon);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain',
        },
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        console.warn('Overpass API error:', response.status);
        return {};
      }
      
      const data: OverpassResponse = await response.json();
      const locationData = extractLocationData(data.elements, lat, lon);
      
      // Guardar en cache
      locationCache.set(cacheKey, { data: locationData, timestamp: Date.now() });
      
      return locationData;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request cancelado, no hacer nada
        return {};
      }
      console.warn('Error fetching OSM location data:', error);
      return {};
    }
  }, [buildOverpassQuery, extractLocationData]);

  /**
   * Limpia el cache
   */
  const clearCache = useCallback(() => {
    locationCache.clear();
  }, []);

  return {
    fetchOSMLocationData,
    clearCache,
  };
}
