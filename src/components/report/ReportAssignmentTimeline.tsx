import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ExternalLink,
  Calendar,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HistorialItem } from './ReportHistorialTimeline';

interface ReportAssignmentTimelineProps {
  historial: HistorialItem[];
  isLoading?: boolean;
  maxHeight?: string;
  canViewUser?: boolean;
}

// Solo tipos de asignación
const ASSIGNMENT_TYPES = ['asignacion', 'reasignacion'] as const;

function AssignmentItemCard({ 
  item, 
  canViewUser,
  onViewUser,
}: { 
  item: HistorialItem; 
  canViewUser: boolean;
  onViewUser: (userId: string) => void;
}) {
  const fecha = new Date(item.fecha_asignacion);
  const assignedToName = item.assigned_to_profile?.name || 'Usuario';
  const assignedByName = item.assigned_by_profile?.name || 'Sistema';
  const isReasignacion = item.tipo_accion === 'reasignacion';
  const assignedToId = item.assigned_to_profile?.id || item.assigned_to || null;

  // Construir descripción
  const description = isReasignacion && item.assigned_from_profile?.name
    ? `Asignado a ${assignedToName} por ${assignedByName}. Reporte reasignado`
    : `Asignado a ${assignedToName} por ${assignedByName}`;

  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-card border rounded-lg">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Punto indicador */}
        <div className="mt-1.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        
        {/* Contenido */}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-medium text-foreground truncate">
            {isReasignacion ? 'Reasignación' : 'Asignación'} a {assignedToName.toUpperCase()}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(fecha, "dd/MM/yyyy", { locale: es })}</span>
          </div>
        </div>
      </div>

      {/* Botón Ver - solo si tiene permiso y hay usuario asignado */}
      {canViewUser && assignedToId && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => onViewUser(assignedToId)}
        >
          <ExternalLink className="h-4 w-4" />
          Ver
        </Button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ReportAssignmentTimeline({
  historial,
  isLoading = false,
  maxHeight = '400px',
  canViewUser = false,
}: ReportAssignmentTimelineProps) {
  const navigate = useNavigate();

  // Filtrar solo asignaciones y reasignaciones
  const assignmentHistorial = useMemo(() => {
    return historial
      .filter(item => 
        ASSIGNMENT_TYPES.includes(item.tipo_accion as typeof ASSIGNMENT_TYPES[number]) &&
        !!item.assigned_to
      )
      .sort((a, b) => 
        new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime()
      );
  }, [historial]);

  const heightStyle = `min(${maxHeight}, calc(100vh - 340px))`;

  const handleViewUser = (userId: string) => {
    navigate(`/usuarios/${userId}`);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (assignmentHistorial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          Sin historial de asignaciones
        </p>
        <p className="text-xs text-muted-foreground/70">
          Las asignaciones y reasignaciones del reporte aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="pr-4" style={{ height: heightStyle }}>
      <div className="space-y-3 pb-2">
        {assignmentHistorial.map((item) => (
          <AssignmentItemCard
            key={item.id}
            item={item}
            canViewUser={canViewUser}
            onViewUser={handleViewUser}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
