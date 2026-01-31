/**
 * Componente para mostrar reportes compartidos en mensajes
 * Navega al detalle del reporte o a GeoTracking según la prioridad
 */
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Navigation, 
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { transitionClasses } from '@/hooks/optimizacion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface SharedReportData {
  type: 'report';
  reportId: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  isUrgent?: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  category?: string | null;
  type_name?: string | null;
  assignedBy?: {
    id: string;
    name: string;
  };
  sharedAt?: string;
  created_at?: string;
}

interface SharedReportCardProps {
  data: SharedReportData;
  isOwn?: boolean;
  className?: string;
}

const PRIORITY_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  urgente: { 
    label: 'URGENTE', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  alto: { 
    label: 'Alta', 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  medio: { 
    label: 'Media', 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    icon: <FileText className="h-4 w-4" />,
  },
  bajo: { 
    label: 'Baja', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: <FileText className="h-4 w-4" />,
  },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  en_proceso: { label: 'En proceso', variant: 'default' },
  resuelto: { label: 'Resuelto', variant: 'outline' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

export function SharedReportCard({ 
  data, 
  isOwn = false, 
  className,
}: SharedReportCardProps) {
  const navigate = useNavigate();
  
  const priority = data.priority?.toLowerCase() || 'medio';
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medio;
  const statusConfig = STATUS_CONFIG[data.status || 'pendiente'] || STATUS_CONFIG.pendiente;
  
  const isUrgent = data.isUrgent || priority === 'urgente' || priority === 'alto';
  const hasLocation = !!(data.latitude && data.longitude);
  const hasImages = data.images && data.images.length > 0;

  const timeAgo = data.sharedAt ? formatDistanceToNow(new Date(data.sharedAt), {
    addSuffix: true,
    locale: es,
  }) : '';

  const handleClick = () => {
    if (isUrgent && hasLocation) {
      // Para reportes urgentes con ubicación, ir a GeoTracking
      // Pasamos el reporte en el state para mostrar navegación
      navigate('/geotracking', { 
        state: { 
          navigateToReport: {
            id: data.reportId,
            name: data.title,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
          }
        } 
      });
    } else {
      // Para otros reportes, ir al detalle
      navigate(`/reporte/${data.reportId}`);
    }
  };

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLocation) {
      navigate('/geotracking', { 
        state: { 
          navigateToReport: {
            id: data.reportId,
            name: data.title,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
          }
        } 
      });
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/reporte/${data.reportId}`);
  };

  return (
    <Card 
      className={cn(
        "border-2 overflow-hidden cursor-pointer",
        priorityConfig.bgColor,
        transitionClasses.colors,
        "hover:shadow-lg active:scale-[0.98]",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Header con prioridad */}
        <div className={cn(
          "px-3 py-2 flex items-center gap-2",
          priority === 'urgente' && "bg-red-500 text-white",
          priority === 'alto' && "bg-orange-500 text-white",
          priority === 'medio' && "bg-yellow-500/80 text-yellow-900",
          priority === 'bajo' && "bg-green-500/50 text-green-900",
        )}>
          {priorityConfig.icon}
          <span className="font-bold text-sm">
            {isUrgent ? '📌 REPORTE ASIGNADO' : '📋 Reporte Asignado'}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-auto text-[10px] px-1.5",
              priority === 'urgente' && "border-white/50 text-white",
              priority === 'alto' && "border-white/50 text-white",
            )}
          >
            {priorityConfig.label}
          </Badge>
        </div>

        {/* Contenido principal */}
        <div className="p-3 space-y-2">
          {/* Título */}
          <h4 className="font-semibold text-foreground line-clamp-2">
            {data.title}
          </h4>

          {/* Descripción */}
          {data.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}

          {/* Imágenes preview */}
          {hasImages && (
            <div className={cn(
              "grid gap-1 rounded-md overflow-hidden",
              data.images!.length === 1 && "grid-cols-1",
              data.images!.length >= 2 && "grid-cols-2"
            )}>
              {data.images!.slice(0, 4).map((imagen, index) => (
                <div 
                  key={index}
                  className={cn(
                    "relative bg-muted",
                    data.images!.length === 1 && "aspect-video",
                    data.images!.length >= 2 && "aspect-square"
                  )}
                >
                  <img 
                    src={imagen} 
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {data.images!.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground">
                        +{data.images!.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detalles */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {/* Estado */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              <Badge variant={statusConfig.variant} className="text-[10px] h-5">
                {statusConfig.label}
              </Badge>
            </div>

            {/* Categoría */}
            {data.category && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Categoría:</span>
                <span>{data.category}</span>
              </div>
            )}

            {/* Tipo */}
            {data.type_name && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Tipo:</span>
                <span>{data.type_name}</span>
              </div>
            )}

            {/* Ubicación */}
            {data.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{data.address}</span>
              </div>
            )}

            {/* Asignado por */}
            {data.assignedBy && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="font-medium">Asignado por:</span>
                <span>{data.assignedBy.name}</span>
                {timeAgo && (
                  <span className="text-muted-foreground/70">• {timeAgo}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-3 pb-3 pt-1 flex items-center gap-2">
          {isUrgent && hasLocation ? (
            <>
              <Button 
                size="sm" 
                className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
                onClick={handleNavigateClick}
              >
                <Navigation className="h-4 w-4" />
                Navegar al reporte
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1"
                onClick={handleDetailsClick}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full gap-1.5"
              onClick={handleDetailsClick}
            >
              <FileText className="h-4 w-4" />
              Ver detalles del reporte
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Función para verificar si un shared_post es un reporte
 */
export function isSharedReportData(data: unknown): data is SharedReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as Record<string, unknown>).type === 'report' &&
    'reportId' in data
  );
}
