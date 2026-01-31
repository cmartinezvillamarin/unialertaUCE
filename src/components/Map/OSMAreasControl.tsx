import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Layers, 
  RefreshCw, 
  Trash2, 
  MapPin,
  Building2,
  Trees,
  Waves,
  Home,
  Store,
  Factory,
  Leaf,
  MapPinned,
  Route,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitionClasses, hoverClasses } from '@/hooks/optimizacion';
import { OSMAreaType, AREA_TYPE_COLORS } from '@/hooks/controlador/useOverpassAreas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Tipo para los filtros de área visibles
export type VisibleAreaTypes = Record<OSMAreaType, boolean>;

// Valor por defecto con todos visibles
export const DEFAULT_VISIBLE_AREA_TYPES: VisibleAreaTypes = {
  building: true,
  park: true,
  water: true,
  residential: true,
  commercial: true,
  industrial: true,
  natural: true,
  amenity: true,
  highway: true,
  landuse: true,
};

interface OSMAreasControlProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  isLoading: boolean;
  nodeCount: number;
  lastUpdate: Date | null;
  onRefresh: () => void;
  onClearCache: () => void;
  error: string | null;
  showLabels: boolean;
  onToggleLabels: () => void;
  // Nuevas props para filtros de tipos
  visibleAreaTypes: VisibleAreaTypes;
  onToggleAreaType: (type: OSMAreaType) => void;
}

// Iconos para cada tipo
const AREA_TYPE_ICONS: Record<OSMAreaType, React.ReactNode> = {
  building: <Building2 className="h-3 w-3" />,
  park: <Trees className="h-3 w-3" />,
  water: <Waves className="h-3 w-3" />,
  residential: <Home className="h-3 w-3" />,
  commercial: <Store className="h-3 w-3" />,
  industrial: <Factory className="h-3 w-3" />,
  natural: <Leaf className="h-3 w-3" />,
  amenity: <MapPinned className="h-3 w-3" />,
  highway: <Route className="h-3 w-3" />,
  landuse: <Map className="h-3 w-3" />,
};

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

export const OSMAreasControl: React.FC<OSMAreasControlProps> = ({
  isVisible,
  onToggleVisibility,
  isLoading,
  nodeCount,
  lastUpdate,
  onRefresh,
  onClearCache,
  error,
  showLabels,
  onToggleLabels,
  visibleAreaTypes,
  onToggleAreaType,
}) => {
  // Contar cuántos tipos están activos
  const activeTypesCount = Object.values(visibleAreaTypes).filter(Boolean).length;
  const totalTypes = Object.keys(visibleAreaTypes).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={isVisible ? "default" : "outline"}
          className={cn(
            'shadow-md gap-2',
            isVisible ? 'bg-primary text-primary-foreground' : 'bg-background',
            transitionClasses.button,
            hoverClasses.scale
          )}
        >
          <Layers className="h-4 w-4" />
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <span className="hidden sm:inline">Áreas OSM</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
          <CardContent className="p-4 space-y-4">
            {/* Header con toggle principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Datos del mapa</span>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={onToggleVisibility}
                aria-label="Mostrar áreas OSM"
              />
            </div>

            {/* Estadísticas */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {nodeCount.toLocaleString()} nodos
              </span>
              {lastUpdate && (
                <span>
                  Actualizado: {lastUpdate.toLocaleTimeString('es', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>

            {/* Error si existe */}
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            {/* Toggle de etiquetas */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-labels" className="text-sm cursor-pointer">
                Mostrar etiquetas
              </Label>
              <Switch
                id="show-labels"
                checked={showLabels}
                onCheckedChange={onToggleLabels}
                disabled={!isVisible}
              />
            </div>

            {/* Leyenda de colores con checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Leyenda ({activeTypesCount}/{totalTypes}):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(AREA_TYPE_COLORS) as OSMAreaType[]).map((type) => (
                  <label 
                    key={type} 
                    className={cn(
                      "flex items-center gap-1.5 text-xs p-1.5 rounded cursor-pointer",
                      "hover:bg-muted/50 transition-colors",
                      !isVisible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={visibleAreaTypes[type]}
                      onCheckedChange={() => onToggleAreaType(type)}
                      disabled={!isVisible}
                      className="h-3.5 w-3.5"
                    />
                    <div 
                      className="w-3 h-3 rounded-sm border border-border shrink-0"
                      style={{ 
                        backgroundColor: visibleAreaTypes[type] 
                          ? AREA_TYPE_COLORS[type] 
                          : 'transparent',
                        opacity: visibleAreaTypes[type] ? 1 : 0.3
                      }}
                    />
                    <span className={cn(
                      "flex items-center gap-1",
                      !visibleAreaTypes[type] && "text-muted-foreground line-through"
                    )}>
                      {AREA_TYPE_ICONS[type]}
                      {AREA_TYPE_LABELS[type]}
                    </span>
                  </label>
                ))}
              </div>
            </div>


            {/* Acciones */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading || !isVisible}
                className="flex-1"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                Actualizar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClearCache}
                disabled={isLoading}
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar caché
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default OSMAreasControl;
