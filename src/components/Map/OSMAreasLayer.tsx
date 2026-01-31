import React, { useEffect, useRef, useCallback } from 'react';
import L, { Map as LeafletMap, LayerGroup } from 'leaflet';
import { OSMNode, OSMArea, AREA_TYPE_COLORS, AREA_TYPE_ICONS, OSMAreaType } from '@/hooks/controlador/useOverpassAreas';

// Traducciones de tipos de área (movido arriba para usar en tooltips)
const AREA_TYPE_LABELS: Record<OSMAreaType, string> = {
  building: 'Edificio',
  park: 'Parque',
  water: 'Agua',
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  natural: 'Natural',
  amenity: 'Servicio',
  highway: 'Vía',
  landuse: 'Uso de suelo',
};

import { VisibleAreaTypes, DEFAULT_VISIBLE_AREA_TYPES } from './OSMAreasControl';

interface OSMAreasLayerProps {
  map: LeafletMap | null;
  nodes: OSMNode[];
  areas: OSMArea[];
  isVisible: boolean;
  showLabels?: boolean;
  opacity?: number;
  visibleAreaTypes?: VisibleAreaTypes;
}


export const OSMAreasLayer: React.FC<OSMAreasLayerProps> = ({
  map,
  nodes,
  areas,
  isVisible,
  showLabels = true,
  opacity = 0.4,
  visibleAreaTypes = DEFAULT_VISIBLE_AREA_TYPES,
}) => {
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const nodesLayerRef = useRef<LayerGroup | null>(null);

  // Crear o limpiar layer groups
  useEffect(() => {
    if (!map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    if (!nodesLayerRef.current) {
      nodesLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      if (nodesLayerRef.current) {
        nodesLayerRef.current.clearLayers();
        map.removeLayer(nodesLayerRef.current);
        nodesLayerRef.current = null;
      }
    };
  }, [map]);

  // Crear contenido para tooltip (más compacto que popup)
  const createTooltipContent = useCallback((name: string | undefined, areaType: OSMAreaType, tags?: Record<string, string>): string => {
    const icon = AREA_TYPE_ICONS[areaType];
    const label = AREA_TYPE_LABELS[areaType];
    
    let content = `
      <div style="min-width: 120px; padding: 2px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">
          ${icon} ${name || label}
        </div>
        <div style="font-size: 11px; color: #6b7280;">
          Tipo: ${label}
        </div>
    `;

    // Agregar tags relevantes (solo street para tooltip)
    if (tags) {
      if (tags['addr:street']) {
        content += `<div style="font-size: 10px; color: #9ca3af;">street: ${tags['addr:street']}</div>`;
      }
    }

    content += '</div>';
    return content;
  }, []);

  // Calcular el área aproximada de un polígono (para ordenar)
  const calculatePolygonArea = useCallback((coords: Array<{ lat: number; lon: number }>): number => {
    if (coords.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].lon * coords[j].lat;
      area -= coords[j].lon * coords[i].lat;
    }
    return Math.abs(area) / 2;
  }, []);

  // Actualizar áreas en el mapa
  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    if (!isVisible) return;

    // Filtrar áreas por tipos visibles
    const filteredAreas = areas.filter(area => visibleAreaTypes[area.areaType]);

    // Ordenar áreas por tamaño (las más grandes primero, así las pequeñas quedan arriba)
    const sortedAreas = [...filteredAreas].sort((a, b) => {
      const areaA = calculatePolygonArea(a.nodes);
      const areaB = calculatePolygonArea(b.nodes);
      return areaB - areaA; // Mayor a menor
    });

    // Dibujar áreas (polígonos)
    sortedAreas.forEach(area => {
      if (area.nodes.length < 3) return;

      const color = AREA_TYPE_COLORS[area.areaType];
      const coords = area.nodes.map(n => [n.lat, n.lon] as [number, number]);

      const polygon = L.polygon(coords, {
        color: color,
        fillColor: color,
        fillOpacity: opacity,
        weight: 1,
        className: 'osm-area-polygon',
        interactive: false, // No captura clics - permite que pasen al mapa
      });

      // Tooltip con contenido HTML al pasar el mouse - solo si showLabels está activo
      if (showLabels) {
        // Crear un polígono invisible interactivo para detectar hover
        const hoverPolygon = L.polygon(coords, {
          color: 'transparent',
          fillColor: 'transparent',
          fillOpacity: 0,
          weight: 0,
          interactive: true,
          pane: 'overlayPane',
        });
        
        // Usar tooltip con contenido HTML estilizado
        hoverPolygon.bindTooltip(createTooltipContent(area.name, area.areaType, area.tags), {
          permanent: false,
          direction: 'top',
          className: 'osm-area-tooltip-styled',
          sticky: true,
          opacity: 1,
        });
        
        // Propagar clics al mapa para colocar marcador de reporte
        hoverPolygon.on('click', (e: L.LeafletMouseEvent) => {
          // Prevenir que el tooltip se abra con clic
          e.originalEvent.stopPropagation();
          // Disparar evento de clic en el mapa
          map.fire('click', { latlng: e.latlng, originalEvent: e.originalEvent });
        });
        
        layerGroupRef.current!.addLayer(hoverPolygon);
      }

      layerGroupRef.current!.addLayer(polygon);
    });
  }, [map, areas, isVisible, showLabels, opacity, visibleAreaTypes, createTooltipContent, calculatePolygonArea]);

  // Actualizar nodos en el mapa
  useEffect(() => {
    if (!map || !nodesLayerRef.current) return;

    nodesLayerRef.current.clearLayers();

    if (!isVisible) return;

    // Filtrar nodos por tipos visibles
    const filteredNodes = nodes.filter(node => {
      const areaType = node.areaType || 'amenity';
      return visibleAreaTypes[areaType];
    });

    // Dibujar nodos (círculos pequeños) - sin interacción para no bloquear clics
    filteredNodes.forEach(node => {
      const color = AREA_TYPE_COLORS[node.areaType || 'amenity'];
      
      // Marcador visual no interactivo
      const marker = L.circleMarker([node.lat, node.lon], {
        radius: 6,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
        className: 'osm-node-marker',
        interactive: false, // No bloquea clics
      });

      nodesLayerRef.current!.addLayer(marker);

      // Tooltip solo si showLabels está activo
      if (showLabels) {
        // Marcador invisible para hover
        const hoverMarker = L.circleMarker([node.lat, node.lon], {
          radius: 10,
          color: 'transparent',
          fillColor: 'transparent',
          fillOpacity: 0,
          weight: 0,
          interactive: true,
        });

        hoverMarker.bindTooltip(createTooltipContent(node.name, node.areaType || 'amenity', node.tags), {
          permanent: false,
          direction: 'top',
          className: 'osm-area-tooltip-styled',
          sticky: true,
          opacity: 1,
        });

        // Propagar clics al mapa
        hoverMarker.on('click', (e: L.LeafletMouseEvent) => {
          e.originalEvent.stopPropagation();
          map.fire('click', { latlng: e.latlng, originalEvent: e.originalEvent });
        });

        nodesLayerRef.current!.addLayer(hoverMarker);
      }
    });
  }, [map, nodes, isVisible, showLabels, visibleAreaTypes, createTooltipContent]);

  return null; // Este componente solo maneja side effects
};

export default OSMAreasLayer;
