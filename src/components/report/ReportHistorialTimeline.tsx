import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  UserCheck, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Layers,
  ArrowUp,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type HistorialTipoAccion = 
  | 'asignacion'
  | 'reasignacion'
  | 'resolucion'
  | 'rechazo'
  | 'reapertura'
  | 'escalacion'
  | 'desactivacion'
  | 'activacion'
  | 'cambio_estado'
  | 'cambio_prioridad'
  | 'otro';

export interface HistorialItem {
  id: string;
  reporte_id: string;
  tipo_accion: HistorialTipoAccion;
  assigned_to?: string | null;
  assigned_from?: string | null;
  assigned_by?: string | null;
  comentario: string | null;
  evidencias: string[] | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  prioridad_anterior: string | null;
  prioridad_nuevo: string | null;
  es_bulk: boolean;
  bulk_session_id: string | null;
  fecha_asignacion: string;
  assigned_to_profile?: { id: string; name: string | null } | null;
  assigned_from_profile?: { id: string; name: string | null } | null;
  assigned_by_profile?: { id: string; name: string | null } | null;
}

interface ReportHistorialTimelineProps {
  historial: HistorialItem[];
  isLoading?: boolean;
  showEvidences?: boolean;
  maxHeight?: string;
}

const TIPO_CONFIG: Record<HistorialTipoAccion, {
  icon: typeof UserCheck;
  label: string;
  color: string;
  bgColor: string;
}> = {
  asignacion: {
    icon: UserCheck,
    label: 'Asignación',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  reasignacion: {
    icon: ArrowRightLeft,
    label: 'Reasignación',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  resolucion: {
    icon: CheckCircle2,
    label: 'Resolución',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  rechazo: {
    icon: XCircle,
    label: 'Rechazo',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  reapertura: {
    icon: RotateCcw,
    label: 'Reapertura',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  escalacion: {
    icon: ArrowUp,
    label: 'Escalación',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  desactivacion: {
    icon: ToggleLeft,
    label: 'Desactivación',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  activacion: {
    icon: ToggleRight,
    label: 'Activación',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  cambio_estado: {
    icon: Layers,
    label: 'Cambio de Estado',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  cambio_prioridad: {
    icon: AlertTriangle,
    label: 'Cambio de Prioridad',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  otro: {
    icon: MessageSquare,
    label: 'Otra Acción',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

function HistorialItemCard({ 
  item, 
  showEvidences,
  isLast 
}: { 
  item: HistorialItem; 
  showEvidences: boolean;
  isLast: boolean;
}) {
  const config = TIPO_CONFIG[item.tipo_accion] || TIPO_CONFIG.otro;
  const Icon = config.icon;
  const fecha = new Date(item.fecha_asignacion);
  const hasEvidences = item.evidencias && item.evidencias.length > 0;

  // Construir descripción según el tipo
  const getDescription = () => {
    const parts: string[] = [];
    
    if (item.assigned_to_profile?.name) {
      parts.push(`Asignado a: ${item.assigned_to_profile.name}`);
    }
    
    if (item.assigned_from_profile?.name) {
      parts.push(`Desde: ${item.assigned_from_profile.name}`);
    }
    
    if (item.estado_anterior && item.estado_nuevo) {
      parts.push(`Estado: ${item.estado_anterior} → ${item.estado_nuevo}`);
    }
    
    if (item.prioridad_anterior && item.prioridad_nuevo) {
      parts.push(`Prioridad: ${item.prioridad_anterior} → ${item.prioridad_nuevo}`);
    }

    return parts.join(' • ');
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div className={cn(
        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        config.bgColor
      )}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 space-y-2">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
          {item.es_bulk && (
            <Badge variant="secondary" className="text-xs">
              Acción masiva
            </Badge>
          )}
        </div>

        {/* Timestamp and user */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{format(fecha, "dd/MM/yyyy HH:mm", { locale: es })}</span>
          {item.assigned_by_profile?.name && (
            <>
              <span>•</span>
              <User className="h-3 w-3" />
              <span>Por: {item.assigned_by_profile.name}</span>
            </>
          )}
        </div>

        {/* Description */}
        {getDescription() && (
          <p className="text-sm text-muted-foreground">
            {getDescription()}
          </p>
        )}

        {/* Comentario */}
        {item.comentario && (
          <div className="p-3 rounded-md bg-muted/50 border">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{item.comentario}</p>
            </div>
          </div>
        )}

        {/* Evidencias */}
        {showEvidences && hasEvidences && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>{item.evidencias!.length} evidencia(s)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.evidencias!.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-16 h-16 rounded-md overflow-hidden border hover:opacity-80 transition-opacity"
                >
                  <img
                    src={url}
                    alt={`Evidencia ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportHistorialTimeline({
  historial,
  isLoading = false,
  showEvidences = true,
  maxHeight = '400px',
}: ReportHistorialTimelineProps) {
  const sortedHistorial = useMemo(() => {
    return [...historial].sort((a, b) => 
      new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime()
    );
  }, [historial]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (sortedHistorial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          Sin historial de acciones registradas
        </p>
        <p className="text-xs text-muted-foreground/70">
          Las acciones realizadas sobre este reporte aparecerán aquí
        </p>
      </div>
    );
  }

  const heightStyle = `min(${maxHeight}, calc(100vh - 340px))`;

  return (
    <ScrollArea className="pr-4" style={{ height: heightStyle }}>
      <div className="space-y-0 pb-2">
        {sortedHistorial.map((item, index) => (
          <HistorialItemCard
            key={item.id}
            item={item}
            showEvidences={showEvidences}
            isLast={index === sortedHistorial.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
