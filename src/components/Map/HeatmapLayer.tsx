import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet.heat';

// Extender tipos de Leaflet para incluir heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions
  ): HeatLayer;
  
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<string, string>;
  }
  
  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    addLatLng(latlng: [number, number, number?]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity?: number;
  categoryId?: string | null;
  categoryColor?: string | null;
  tipoId?: string | null;
  tipoColor?: string | null;
}

export type HeatmapFilterType = 'all' | 'category' | 'tipo';

export interface HeatmapFilter {
  type: HeatmapFilterType;
  categoryIds?: string[];
  tipoIds?: string[];
}

interface HeatmapLayerProps {
  map: LeafletMap | null;
  points: HeatmapPoint[];
  isVisible: boolean;
  filter: HeatmapFilter;
  radius?: number;
  blur?: number;
  maxIntensity?: number;
  opacity?: number;
  // Colores disponibles de categorías y tipos
  categoryColors: Map<string, string>;
  tipoColors: Map<string, string>;
}

// Colores por defecto para el gradiente cuando no hay filtro específico
const DEFAULT_GRADIENT: Record<string, string> = {
  '0.0': 'transparent',
  '0.2': 'rgba(0, 0, 255, 0.5)',
  '0.4': 'rgba(0, 255, 255, 0.6)',
  '0.6': 'rgba(0, 255, 0, 0.7)',
  '0.8': 'rgba(255, 255, 0, 0.8)',
  '1.0': 'rgba(255, 0, 0, 0.9)',
};

/**
 * Convierte un color hex a rgba con opacidad
 */
function hexToRgba(hex: string, alpha: number = 1): string {
  // Limpiar el # si existe
  const cleanHex = hex.replace('#', '');
  
  // Soportar formato corto (#RGB)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Genera un gradiente basado en un color principal
 */
function generateColorGradient(baseColor: string): Record<string, string> {
  // Si el color no es válido, usar un color por defecto
  if (!baseColor || !baseColor.startsWith('#')) {
    return DEFAULT_GRADIENT;
  }
  
  return {
    '0.0': 'transparent',
    '0.2': hexToRgba(baseColor, 0.2),
    '0.4': hexToRgba(baseColor, 0.4),
    '0.6': hexToRgba(baseColor, 0.6),
    '0.8': hexToRgba(baseColor, 0.8),
    '1.0': hexToRgba(baseColor, 1.0),
  };
}

/**
 * Componente de capa de mapa de calor para Leaflet
 * Visualiza la concentración de reportes según categoría o tipo
 */
export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  map,
  points,
  isVisible,
  filter,
  radius = 25,
  blur = 15,
  maxIntensity = 1.0,
  opacity = 0.6,
  categoryColors,
  tipoColors,
}) => {
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const previousVisibleRef = useRef<boolean>(false);

  // Filtrar puntos según el filtro seleccionado (multi-selección)
  const filteredPoints = useMemo(() => {
    if (!isVisible || points.length === 0) return [];
    
    switch (filter.type) {
      case 'category':
        if (!filter.categoryIds || filter.categoryIds.length === 0) return points;
        // Si hay tipos seleccionados, filtrar por tipos también
        if (filter.tipoIds && filter.tipoIds.length > 0) {
          return points.filter(p => 
            p.categoryId && filter.categoryIds!.includes(p.categoryId) &&
            p.tipoId && filter.tipoIds!.includes(p.tipoId)
          );
        }
        return points.filter(p => p.categoryId && filter.categoryIds!.includes(p.categoryId));
      
      case 'tipo':
        if (!filter.tipoIds || filter.tipoIds.length === 0) return points;
        return points.filter(p => p.tipoId && filter.tipoIds!.includes(p.tipoId));
      
      case 'all':
      default:
        return points;
    }
  }, [points, filter, isVisible]);

  // Calcular el gradiente según el filtro (usa el primer color si hay multi-selección)
  const gradient = useMemo(() => {
    if (filter.type === 'category' && filter.categoryIds && filter.categoryIds.length > 0) {
      // Si solo hay una categoría, usar su color
      if (filter.categoryIds.length === 1) {
        const color = categoryColors.get(filter.categoryIds[0]);
        if (color) return generateColorGradient(color);
      }
      // Si hay tipos seleccionados y solo uno, usar su color
      if (filter.tipoIds && filter.tipoIds.length === 1) {
        const color = tipoColors.get(filter.tipoIds[0]);
        if (color) return generateColorGradient(color);
      }
    }
    
    if (filter.type === 'tipo' && filter.tipoIds && filter.tipoIds.length === 1) {
      const color = tipoColors.get(filter.tipoIds[0]);
      if (color) return generateColorGradient(color);
    }
    
    return DEFAULT_GRADIENT;
  }, [filter, categoryColors, tipoColors]);

  // Convertir puntos al formato de leaflet.heat [lat, lng, intensity]
  const heatData = useMemo((): Array<[number, number, number]> => {
    if (filteredPoints.length === 0) return [];
    
    // Calcular intensidad basada en la densidad de puntos cercanos
    // Para simplificar, usamos un valor base + bonus por confirmaciones
    return filteredPoints.map(point => {
      const baseIntensity = point.intensity ?? 0.5;
      return [point.lat, point.lng, Math.min(baseIntensity, maxIntensity)] as [number, number, number];
    });
  }, [filteredPoints, maxIntensity]);

  // Crear/actualizar la capa de heatmap
  const updateHeatLayer = useCallback(() => {
    if (!map) return;

    // Si no es visible, remover la capa si existe
    if (!isVisible) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      previousVisibleRef.current = false;
      return;
    }

    // Si no hay datos, no mostrar nada
    if (heatData.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Crear nueva capa o actualizar existente
    if (heatLayerRef.current) {
      // Actualizar datos y opciones
      heatLayerRef.current.setLatLngs(heatData);
      heatLayerRef.current.setOptions({
        radius,
        blur,
        gradient,
        minOpacity: opacity * 0.3,
      });
      heatLayerRef.current.redraw();
    } else {
      // Crear nueva capa
      heatLayerRef.current = L.heatLayer(heatData, {
        radius,
        blur,
        gradient,
        minOpacity: opacity * 0.3,
        maxZoom: 18,
        max: maxIntensity,
      });
      
      // Agregar al mapa
      heatLayerRef.current.addTo(map);
    }

    previousVisibleRef.current = true;
  }, [map, isVisible, heatData, radius, blur, gradient, opacity, maxIntensity]);

  // Efecto para manejar la actualización del heatmap
  useEffect(() => {
    updateHeatLayer();
  }, [updateHeatLayer]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map]);

  // Este componente no renderiza nada directamente
  return null;
};

export default HeatmapLayer;
