import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flame, 
  Layers,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitionClasses, hoverClasses } from '@/hooks/optimizacion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HeatmapFilter, HeatmapFilterType } from './HeatmapLayer';

interface CategoryOption {
  id: string;
  nombre: string;
  color: string | null;
  category_id?: string | null;
}

interface HeatmapControlProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  filter: HeatmapFilter;
  onFilterChange: (filter: HeatmapFilter) => void;
  categories: CategoryOption[];
  tipos: CategoryOption[];
  radius: number;
  onRadiusChange: (radius: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  pointCount: number;
}

export const HeatmapControl: React.FC<HeatmapControlProps> = ({
  isVisible,
  onToggleVisibility,
  filter,
  onFilterChange,
  categories,
  tipos,
  radius,
  onRadiusChange,
  opacity,
  onOpacityChange,
  pointCount,
}) => {
  const [categoriesExpanded, setCategoriesExpanded] = React.useState(true);
  const [tiposExpanded, setTiposExpanded] = React.useState(true);

  const handleFilterTypeChange = (type: HeatmapFilterType) => {
    onFilterChange({
      type,
      categoryIds: undefined,
      tipoIds: undefined,
    });
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const currentIds = filter.categoryIds || [];
    let newCategoryIds: string[];
    
    if (checked) {
      newCategoryIds = [...currentIds, categoryId];
    } else {
      newCategoryIds = currentIds.filter(id => id !== categoryId);
      // Also remove tipos that belong to this category
      const tiposOfCategory = tipos.filter(t => t.category_id === categoryId).map(t => t.id);
      const newTipoIds = (filter.tipoIds || []).filter(id => !tiposOfCategory.includes(id));
      onFilterChange({
        type: 'category',
        categoryIds: newCategoryIds.length > 0 ? newCategoryIds : undefined,
        tipoIds: newTipoIds.length > 0 ? newTipoIds : undefined,
      });
      return;
    }
    
    onFilterChange({
      type: 'category',
      categoryIds: newCategoryIds.length > 0 ? newCategoryIds : undefined,
      tipoIds: filter.tipoIds,
    });
  };

  const handleTipoToggle = (tipoId: string, checked: boolean) => {
    const currentIds = filter.tipoIds || [];
    let newTipoIds: string[];
    
    if (checked) {
      newTipoIds = [...currentIds, tipoId];
    } else {
      newTipoIds = currentIds.filter(id => id !== tipoId);
    }
    
    onFilterChange({
      ...filter,
      tipoIds: newTipoIds.length > 0 ? newTipoIds : undefined,
    });
  };

  const handleTipoToggleDirectFilter = (tipoId: string, checked: boolean) => {
    const currentIds = filter.tipoIds || [];
    let newTipoIds: string[];
    
    if (checked) {
      newTipoIds = [...currentIds, tipoId];
    } else {
      newTipoIds = currentIds.filter(id => id !== tipoId);
    }
    
    onFilterChange({
      type: 'tipo',
      categoryIds: undefined,
      tipoIds: newTipoIds.length > 0 ? newTipoIds : undefined,
    });
  };

  // Filtrar tipos por las categorías seleccionadas
  const filteredTipos = React.useMemo(() => {
    if (filter.type === 'category' && filter.categoryIds && filter.categoryIds.length > 0) {
      return tipos.filter(t => t.category_id && filter.categoryIds!.includes(t.category_id));
    }
    return tipos;
  }, [tipos, filter.type, filter.categoryIds]);

  // Obtener el color actual para el icono
  const currentColor = React.useMemo(() => {
    if (filter.type === 'category' && filter.categoryIds && filter.categoryIds.length === 1) {
      const cat = categories.find(c => c.id === filter.categoryIds![0]);
      return cat?.color || undefined;
    }
    if (filter.type === 'tipo' && filter.tipoIds && filter.tipoIds.length === 1) {
      const tipo = tipos.find(t => t.id === filter.tipoIds![0]);
      return tipo?.color || undefined;
    }
    return undefined;
  }, [filter, categories, tipos]);

  // Contar selecciones
  const selectedCategoriesCount = filter.categoryIds?.length || 0;
  const selectedTiposCount = filter.tipoIds?.length || 0;

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
          style={isVisible && currentColor ? { 
            backgroundColor: currentColor,
            borderColor: currentColor 
          } : undefined}
        >
          <Flame className="h-4 w-4" />
          <span className="hidden sm:inline">Mapa de calor</span>
          {(selectedCategoriesCount > 0 || selectedTiposCount > 0) && (
            <span className="ml-1 text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
              {selectedCategoriesCount + selectedTiposCount}
            </span>
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
                <Flame className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Mapa de calor</span>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={onToggleVisibility}
                aria-label="Mostrar mapa de calor"
              />
            </div>

            {/* Estadísticas */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {pointCount.toLocaleString()} puntos
              </span>
              {currentColor && (
                <div 
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: currentColor }}
                />
              )}
            </div>

            {/* Tipo de filtro */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <Label className="text-xs font-medium">Filtrar por:</Label>
              </div>
              <Select
                value={filter.type}
                onValueChange={(value) => handleFilterTypeChange(value as HeatmapFilterType)}
                disabled={!isVisible}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los reportes</SelectItem>
                  <SelectItem value="category">Por categoría</SelectItem>
                  <SelectItem value="tipo">Por tipo de reporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multi-selector de categorías */}
            {filter.type === 'category' && (
              <div className="space-y-3">
                <Collapsible open={categoriesExpanded} onOpenChange={setCategoriesExpanded}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium hover:text-primary transition-colors">
                    <span>Categorías {selectedCategoriesCount > 0 && `(${selectedCategoriesCount})`}</span>
                    {categoriesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <ScrollArea className="h-32">
                      <div className="space-y-2 pr-2">
                        {categories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`cat-${cat.id}`}
                              checked={filter.categoryIds?.includes(cat.id) || false}
                              onCheckedChange={(checked) => handleCategoryToggle(cat.id, !!checked)}
                              disabled={!isVisible}
                            />
                            <div 
                              className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                              style={{ backgroundColor: cat.color || '#888' }}
                            />
                            <label 
                              htmlFor={`cat-${cat.id}`}
                              className="text-xs cursor-pointer truncate flex-1"
                            >
                              {cat.nombre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>

                {/* Multi-selector de tipos (solo cuando hay categorías seleccionadas) */}
                {filter.categoryIds && filter.categoryIds.length > 0 && filteredTipos.length > 0 && (
                  <Collapsible open={tiposExpanded} onOpenChange={setTiposExpanded}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium hover:text-primary transition-colors">
                      <span>Tipos de reporte {selectedTiposCount > 0 && `(${selectedTiposCount})`}</span>
                      {tiposExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <ScrollArea className="h-32">
                        <div className="space-y-2 pr-2">
                          {filteredTipos.map(tipo => (
                            <div key={tipo.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`tipo-${tipo.id}`}
                                checked={filter.tipoIds?.includes(tipo.id) || false}
                                onCheckedChange={(checked) => handleTipoToggle(tipo.id, !!checked)}
                                disabled={!isVisible}
                              />
                              <div 
                                className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                                style={{ backgroundColor: tipo.color || '#888' }}
                              />
                              <label 
                                htmlFor={`tipo-${tipo.id}`}
                                className="text-xs cursor-pointer truncate flex-1"
                              >
                                {tipo.nombre}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {/* Multi-selector de tipos (filtro directo por tipo) */}
            {filter.type === 'tipo' && (
              <Collapsible open={tiposExpanded} onOpenChange={setTiposExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium hover:text-primary transition-colors">
                  <span>Tipos de reporte {selectedTiposCount > 0 && `(${selectedTiposCount})`}</span>
                  {tiposExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <ScrollArea className="h-40">
                    <div className="space-y-2 pr-2">
                      {tipos.map(tipo => (
                        <div key={tipo.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tipo-direct-${tipo.id}`}
                            checked={filter.tipoIds?.includes(tipo.id) || false}
                            onCheckedChange={(checked) => handleTipoToggleDirectFilter(tipo.id, !!checked)}
                            disabled={!isVisible}
                          />
                          <div 
                            className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                            style={{ backgroundColor: tipo.color || '#888' }}
                          />
                          <label 
                            htmlFor={`tipo-direct-${tipo.id}`}
                            className="text-xs cursor-pointer truncate flex-1"
                          >
                            {tipo.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Control de radio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Radio: {radius}px</Label>
              </div>
              <Slider
                value={[radius]}
                onValueChange={(value) => onRadiusChange(value[0])}
                min={10}
                max={50}
                step={5}
                disabled={!isVisible}
                className="w-full"
              />
            </div>

            {/* Control de opacidad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacidad: {Math.round(opacity * 100)}%</Label>
              </div>
              <Slider
                value={[opacity * 100]}
                onValueChange={(value) => onOpacityChange(value[0] / 100)}
                min={20}
                max={100}
                step={10}
                disabled={!isVisible}
                className="w-full"
              />
            </div>

            {/* Leyenda del gradiente */}
            {isVisible && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Intensidad:</Label>
                <div 
                  className="h-3 rounded-sm w-full"
                  style={{
                    background: currentColor
                      ? `linear-gradient(to right, transparent, ${currentColor})`
                      : 'linear-gradient(to right, blue, cyan, lime, yellow, red)'
                  }}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Baja</span>
                  <span>Alta</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default HeatmapControl;