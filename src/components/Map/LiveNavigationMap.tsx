import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L, { Map as LeafletMap, Marker as LeafletMarker, Icon, Circle, Polyline } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { animationClasses, transitionClasses, hoverClasses } from '@/hooks/optimizacion';
import { ReportForNavigation } from '@/hooks/controlador/useRealtimeNavigation';
import { UserLocation } from '@/hooks/controlador/useUserLocation';
import { useOverpassAreas, OSMAreaType } from '@/hooks/controlador/useOverpassAreas';
import { OSMAreasLayer } from './OSMAreasLayer';
import { OSMAreasControl, VisibleAreaTypes, DEFAULT_VISIBLE_AREA_TYPES } from './OSMAreasControl';
import { HeatmapLayer, HeatmapPoint, HeatmapFilter } from './HeatmapLayer';
import { HeatmapControl } from './HeatmapControl';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tipos para datos de heatmap
interface CategoryInfo {
  id: string;
  nombre: string;
  color: string | null;
}

interface ReportWithHeatmapData extends ReportForNavigation {
  distanceMeters: number;
  categoryId?: string | null;
  categoryColor?: string | null;
  categoryName?: string | null;
  tipoId?: string | null;
  tipoColor?: string | null;
  tipoName?: string | null;
}

interface LiveNavigationMapProps {
  userLocation: UserLocation | null;
  reports: Array<ReportWithHeatmapData>;
  nearestReportId: string | null;
  isNavigationActive: boolean;
  className?: string;
  onCenterUser?: () => void;
  onReportClick?: (reportId: string) => void;
  // Datos para heatmap
  categories?: CategoryInfo[];
  tipos?: Array<CategoryInfo & { category_id?: string | null }>;
  // Filtro de heatmap para aplicar también a marcadores
  heatmapFilter?: HeatmapFilter;
  // Callback para reportar el conteo filtrado
  onFilteredCountChange?: (count: number) => void;
}

const createUserIcon = (): Icon => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle fill="#3b82f6" cx="16" cy="16" r="14" stroke="#ffffff" stroke-width="3"/>
        <circle fill="#ffffff" cx="16" cy="16" r="5"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createReportIcon = (isNearest: boolean): Icon => {
  const color = isNearest ? '#ef4444' : '#f59e0b';
  const size = isNearest ? 35 : 28;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${Math.round(size * 1.5)}" viewBox="0 0 30 45" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M15 0C6.7 0 0 6.7 0 15c0 8.3 15 30 15 30s15-21.7 15-30C30 6.7 23.3 0 15 0z"/>
        <circle fill="#ffffff" cx="15" cy="15" r="7"/>
        ${isNearest ? '<circle fill="' + color + '" cx="15" cy="15" r="3"/>' : ''}
      </svg>
    `)}`,
    iconSize: [size, Math.round(size * 1.5)],
    iconAnchor: [size / 2, Math.round(size * 1.5)],
    popupAnchor: [0, -Math.round(size * 1.3)],
  });
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

const createNearestPopupContent = (report: ReportForNavigation & { distanceMeters: number }): string => {
  return `
    <div style="padding: 4px; max-width: 280px; word-wrap: break-word;">
      <strong style="font-size: 14px; color: #1f2937; display: block; word-break: break-word;">${report.nombre}</strong>
      <p style="color: #3b82f6; font-size: 14px; margin: 8px 0; font-weight: 600;">Distancia: ${formatDistance(report.distanceMeters)}</p>
      ${report.direccion ? `<p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.4; word-break: break-word;">${report.direccion}</p>` : ''}
    </div>
  `;
};

const createOtherPopupContent = (report: ReportForNavigation & { distanceMeters: number }): string => {
  const formattedDate = report.created_at 
    ? format(new Date(report.created_at), 'dd/MM/yyyy, HH:mm:ss', { locale: es })
    : '';
  
  return `
    <div style="padding: 4px; max-width: 280px; word-wrap: break-word;">
      <strong style="font-size: 14px; color: #1f2937; display: block; word-break: break-word;">${report.nombre}</strong>
      ${report.direccion ? `<p style="color: #6b7280; font-size: 12px; margin: 8px 0; line-height: 1.4; word-break: break-word;">${report.direccion}</p>` : ''}
      ${formattedDate ? `<p style="color: #9ca3af; font-size: 11px; margin: 0;">${formattedDate}</p>` : ''}
    </div>
  `;
};

export const LiveNavigationMap: React.FC<LiveNavigationMapProps> = ({
  userLocation,
  reports,
  nearestReportId,
  isNavigationActive,
  className = '',
  onReportClick,
  categories = [],
  tipos = [],
  heatmapFilter,
  onFilteredCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const prevAccuracyRef = useRef<number | null>(null);
  const reportMarkersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const routeLineRef = useRef<Polyline | null>(null);
  const onReportClickRef = useRef(onReportClick);

  // Estado para OSM Areas
  const [osmVisible, setOsmVisible] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [visibleAreaTypes, setVisibleAreaTypes] = useState<VisibleAreaTypes>(DEFAULT_VISIBLE_AREA_TYPES);
  
  // Estado para Heatmap
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [internalHeatmapFilter, setInternalHeatmapFilter] = useState<HeatmapFilter>({ type: 'all' });
  const [heatmapRadius, setHeatmapRadius] = useState(25);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.6);
  
  // Usar filtro externo si se proporciona, o el interno
  const activeHeatmapFilter = heatmapFilter ?? internalHeatmapFilter;
  
  // Handler para toggle de tipo de área
  const handleToggleAreaType = useCallback((type: OSMAreaType) => {
    setVisibleAreaTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);
  
  // Hook de Overpass API
  const {
    nodes,
    areas,
    isLoading: osmLoading,
    error: osmError,
    fetchAreas,
    clearCache,
    lastUpdate,
    nodeCount,
  } = useOverpassAreas({
    maxNodes: 50000,
    maxBboxSize: 0.25,
    autoUpdate: true,
    updateThreshold: 50, // metros
  });

  // Mantener ref actualizada
  useEffect(() => {
    onReportClickRef.current = onReportClick;
  }, [onReportClick]);

  // Obtener reporte más cercano
  const nearestReport = useMemo(() => {
    return reports.find(r => r.id === nearestReportId) || null;
  }, [reports, nearestReportId]);

  // Filtrar reportes según el filtro de heatmap (solo cuando el heatmap está visible)
  const filteredReports = useMemo(() => {
    // Si el heatmap no está visible, mostrar todos los reportes (filtro original)
    if (!heatmapVisible) return reports;
    
    // Si no hay filtro o es "todos", mostrar todos
    if (!activeHeatmapFilter || activeHeatmapFilter.type === 'all') return reports;
    
    return reports.filter(report => {
      if (activeHeatmapFilter.type === 'category') {
        // Si no hay categorías seleccionadas, mostrar todos
        if (!activeHeatmapFilter.categoryIds || activeHeatmapFilter.categoryIds.length === 0) return true;
        
        // Verificar si la categoría del reporte está en las seleccionadas
        const categoryMatch = report.categoryId && activeHeatmapFilter.categoryIds.includes(report.categoryId);
        if (!categoryMatch) return false;
        
        // Si hay tipos seleccionados, verificar también
        if (activeHeatmapFilter.tipoIds && activeHeatmapFilter.tipoIds.length > 0) {
          return report.tipoId && activeHeatmapFilter.tipoIds.includes(report.tipoId);
        }
        return true;
      }
      
      if (activeHeatmapFilter.type === 'tipo') {
        // Si no hay tipos seleccionados, mostrar todos
        if (!activeHeatmapFilter.tipoIds || activeHeatmapFilter.tipoIds.length === 0) return true;
        return report.tipoId && activeHeatmapFilter.tipoIds.includes(report.tipoId);
      }
      
      return true;
    });
  }, [reports, activeHeatmapFilter, heatmapVisible]);

  // Contador de reportes filtrados para exponer al exterior
  const filteredReportsCount = filteredReports.length;

  // Notificar al padre cuando cambia el conteo filtrado
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredReportsCount);
    }
  }, [filteredReportsCount, onFilteredCountChange]);

  // Convertir reportes filtrados a puntos de heatmap
  const heatmapPoints = useMemo((): HeatmapPoint[] => {
    return filteredReports
      .filter(r => {
        // Filtrar solo reportes con coordenadas válidas
        return r.latitud !== undefined && r.longitud !== undefined;
      })
      .map(r => ({
        lat: r.latitud,
        lng: r.longitud,
        intensity: 0.7, // Intensidad base, puede ser modificada según confirmaciones
        categoryId: r.categoryId,
        categoryColor: r.categoryColor,
        tipoId: r.tipoId,
        tipoColor: r.tipoColor,
      }));
  }, [filteredReports]);

  // Mapas de colores para categorías y tipos
  const categoryColorsMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => {
      if (cat.id && cat.color) {
        map.set(cat.id, cat.color);
      }
    });
    // También agregar colores de los reportes (para asegurar cobertura completa)
    reports.forEach(r => {
      if (r.categoryId && r.categoryColor && !map.has(r.categoryId)) {
        map.set(r.categoryId, r.categoryColor);
      }
    });
    return map;
  }, [categories, reports]);

  const tipoColorsMap = useMemo(() => {
    const map = new Map<string, string>();
    tipos.forEach(tipo => {
      if (tipo.id && tipo.color) {
        map.set(tipo.id, tipo.color);
      }
    });
    // También agregar colores de los reportes
    reports.forEach(r => {
      if (r.tipoId && r.tipoColor && !map.has(r.tipoId)) {
        map.set(r.tipoId, r.tipoColor);
      }
    });
    return map;
  }, [tipos, reports]);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = userLocation 
      ? [userLocation.latitude, userLocation.longitude]
      : [-0.1807, -78.4678]; // Quito, Ecuador default

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      reportMarkersRef.current.clear();
      routeLineRef.current = null;
    };
  }, []);

  // Cargar áreas OSM cuando la ubicación del usuario cambia y OSM está visible
  useEffect(() => {
    if (osmVisible && userLocation) {
      fetchAreas(userLocation.latitude, userLocation.longitude, 500);
    }
  }, [osmVisible, userLocation?.latitude, userLocation?.longitude, fetchAreas]);

  // Actualizar marcador de usuario
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const userCoords: [number, number] = [userLocation.latitude, userLocation.longitude];
    const accuracyImproved = prevAccuracyRef.current !== null && userLocation.accuracy < prevAccuracyRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userCoords);
    } else {
      userMarkerRef.current = L.marker(userCoords, { icon: createUserIcon() })
        .addTo(mapRef.current)
        .bindPopup('<div class="text-center"><strong>Tu ubicación</strong></div>');
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(userCoords);
      accuracyCircleRef.current.setRadius(userLocation.accuracy);
      
      // Trigger pulse animation when accuracy improves
      if (accuracyImproved) {
        const element = accuracyCircleRef.current.getElement() as HTMLElement | null;
        if (element) {
          element.classList.remove('accuracy-pulse');
          // Force reflow to restart animation
          void element.offsetWidth;
          element.classList.add('accuracy-pulse');
        }
      }
    } else {
      accuracyCircleRef.current = L.circle(userCoords, {
        radius: userLocation.accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(mapRef.current);
    }

    prevAccuracyRef.current = userLocation.accuracy;
  }, [userLocation]);

  // Actualizar marcadores de reportes (usa filteredReports)
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar todos los marcadores existentes y recrearlos para asegurar eventos
    reportMarkersRef.current.forEach(marker => marker.remove());
    reportMarkersRef.current.clear();

    // Crear marcadores para reportes filtrados
    filteredReports.forEach(report => {
      const isNearest = report.id === nearestReportId;
      const coords: [number, number] = [report.latitud, report.longitud];

      const popupContent = isNearest 
        ? createNearestPopupContent(report)
        : createOtherPopupContent(report);

      const marker = L.marker(coords, { 
        icon: createReportIcon(isNearest),
        zIndexOffset: isNearest ? 1000 : 0,
      })
        .addTo(mapRef.current!)
        .bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        });
      
      // Agregar evento click para abrir sidebar
      marker.on('click', () => {
        if (onReportClickRef.current) {
          onReportClickRef.current(report.id);
        }
      });
      
      reportMarkersRef.current.set(report.id, marker);
    });
  }, [filteredReports, nearestReportId]);

  // Actualizar línea de ruta
  useEffect(() => {
    if (!mapRef.current) return;

    // Si no hay navegación activa o no hay ubicación/reporte cercano, eliminar la línea
    if (!isNavigationActive || !userLocation || !nearestReport) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      return;
    }

    const userCoords: [number, number] = [userLocation.latitude, userLocation.longitude];
    const destCoords: [number, number] = [nearestReport.latitud, nearestReport.longitud];

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([userCoords, destCoords]);
    } else {
      routeLineRef.current = L.polyline([userCoords, destCoords], {
        color: '#ef4444',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
      }).addTo(mapRef.current);
    }
  }, [userLocation, nearestReport, isNavigationActive]);

  const handleCenterOnUser = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 17);
  }, [userLocation]);

  const handleRefreshOSM = useCallback(() => {
    if (userLocation) {
      fetchAreas(userLocation.latitude, userLocation.longitude, 500);
    }
  }, [userLocation, fetchAreas]);

  return (
    <div className={cn('relative z-0', animationClasses.fadeIn, className)}>
      {/* Controles superiores */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Control de mapa de calor */}
        <HeatmapControl
          isVisible={heatmapVisible}
          onToggleVisibility={() => setHeatmapVisible(!heatmapVisible)}
          filter={activeHeatmapFilter}
          onFilterChange={setInternalHeatmapFilter}
          categories={categories}
          tipos={tipos}
          radius={heatmapRadius}
          onRadiusChange={setHeatmapRadius}
          opacity={heatmapOpacity}
          onOpacityChange={setHeatmapOpacity}
          pointCount={heatmapPoints.length}
        />

        {/* Control de áreas OSM */}
        <OSMAreasControl
          isVisible={osmVisible}
          onToggleVisibility={() => setOsmVisible(!osmVisible)}
          isLoading={osmLoading}
          nodeCount={nodeCount}
          lastUpdate={lastUpdate}
          onRefresh={handleRefreshOSM}
          onClearCache={clearCache}
          error={osmError}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          visibleAreaTypes={visibleAreaTypes}
          onToggleAreaType={handleToggleAreaType}
        />

        {/* Botón Mi ubicación */}
        {userLocation && (
          <Button
            type="button"
            onClick={handleCenterOnUser}
            size="sm"
            variant="outline"
            className={cn(
              'bg-background shadow-md gap-2',
              transitionClasses.button,
              hoverClasses.scale
            )}
          >
            <Navigation className="h-4 w-4" />
            Mi ubicación
          </Button>
        )}
      </div>

      {/* Capa de mapa de calor (debajo de los marcadores) */}
      <HeatmapLayer
        map={mapRef.current}
        points={heatmapPoints}
        isVisible={heatmapVisible}
        filter={activeHeatmapFilter}
        radius={heatmapRadius}
        blur={15}
        opacity={heatmapOpacity}
        categoryColors={categoryColorsMap}
        tipoColors={tipoColorsMap}
      />

      {/* Capa de áreas OSM */}
      <OSMAreasLayer
        map={mapRef.current}
        nodes={nodes}
        areas={areas}
        isVisible={osmVisible}
        showLabels={showLabels}
        opacity={0.4}
        visibleAreaTypes={visibleAreaTypes}
      />

      <div ref={containerRef} className="rounded-lg h-full w-full min-h-[400px]" />
    </div>
  );
};
