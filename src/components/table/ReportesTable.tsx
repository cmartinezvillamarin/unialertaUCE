import { Edit, Trash2, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { DataTableComplete } from '@/components/ui/data-table-complete';
import { useOptimizedReportes, ReporteWithDistance } from '@/hooks/entidades/useOptimizedReportes';
import { useEntityPermissions } from '@/hooks/controlador/useEntityPermissions';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import { useReportResolutionModal } from '@/components/report';
import { useReporteHistorialActions } from '@/hooks/controlador/useReporteHistorialActions';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/distance';
import { transitionClasses } from '@/hooks/optimizacion';

interface ReportesTableProps {
  onEdit?: (reporte: ReporteWithDistance) => void;
  onDelete?: (reporte: ReporteWithDistance) => void;
  onView?: (reporte: ReporteWithDistance) => void;
  selectedRows?: ReporteWithDistance[];
  onSelectionChange?: (rows: ReporteWithDistance[]) => void;
  /** Datos externos opcionales - si se pasan, se usan en lugar de los del hook */
  externalData?: ReporteWithDistance[];
}

const statusColors: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  en_proceso: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  resuelto: 'bg-green-500/10 text-green-600 border-green-500/20',
  rechazado: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const priorityColors: Record<string, string> = {
  baja: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  media: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  alta: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgente: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function ReportesTable({ onEdit, onDelete, onView, selectedRows, onSelectionChange, externalData }: ReportesTableProps) {
  const navigate = useNavigate();
  const { data: hookData, isLoading, update, remove, hasLocation } = useOptimizedReportes();
  // Usar datos externos si se proporcionan, de lo contrario usar los del hook
  const data = externalData ?? hookData;
  const { canEdit, canDelete, canToggleStatus } = useEntityPermissions({ entityKey: 'reportes' });
  
  // Hook para modal de resolución (requerir evidencia al desactivar)
  const resolutionModal = useReportResolutionModal();
  const { createHistorial } = useReporteHistorialActions();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleViewDetails = (reporte: ReporteWithDistance) => {
    navigate(`/reportes/${reporte.id}`);
  };

  const columns: DataTableColumn<ReporteWithDistance>[] = [
    {
      key: 'nombre',
      header: 'Título',
      render: (value, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className={cn(
            "text-primary hover:text-primary/80 hover:underline font-medium text-left",
            transitionClasses.fast
          )}
        >
          {String(value)}
        </button>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (value) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
          {String(value || '—')}
        </span>
      ),
    },
    {
      key: 'confirmaciones_count',
      header: 'Confirmaciones',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{Number(value) || 0}</span>
        </div>
      ),
    },
    {
      key: 'distancia_metros',
      header: 'Distancia',
      render: (value) => {
        if (!hasLocation) {
          return (
            <span className="text-sm text-muted-foreground">
              Sin ubicación
            </span>
          );
        }
        if (value === null || value === undefined) {
          return (
            <span className="text-sm text-muted-foreground">—</span>
          );
        }
        // Convertir metros a km para formatDistance
        const distKm = Number(value) / 1000;
        return (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDistance(distKm)}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (value) => (
        <Badge 
          variant="outline" 
          className={cn('capitalize', statusColors[String(value)] || '')}
        >
          {String(value).replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (value) => (
        <Badge 
          variant="outline" 
          className={cn('capitalize', priorityColors[String(value)] || '')}
        >
          {String(value)}
        </Badge>
      ),
    },
    {
      key: 'categories',
      header: 'Categoría',
      render: (value) => {
        const cat = value as ReporteWithDistance['categories'];
        return (
          <span className="text-sm">
            {cat?.nombre || '—'}
          </span>
        );
      },
    },
    {
      key: 'tipo_categories',
      header: 'Tipo',
      render: (value) => {
        const tipo = value as ReporteWithDistance['tipo_categories'];
        return (
          <span className="text-sm">
            {tipo?.nombre || '—'}
          </span>
        );
      },
    },
    {
      key: 'profiles',
      header: 'Reportado por',
      render: (value) => {
        const profile = value as ReporteWithDistance['profiles'];
        return (
          <span className="text-sm">
            {profile?.name || '—'}
          </span>
        );
      },
    },
    {
      key: 'assigned_profiles',
      header: 'Asignado a',
      render: (value) => {
        const profile = value as ReporteWithDistance['assigned_profiles'];
        return (
          <span className="text-sm">
            {profile?.name || '—'}
          </span>
        );
      },
    },
    // Solo mostrar columna de activo si tiene permiso de edición
    ...(canToggleStatus ? [{
      key: 'activo' as keyof ReporteWithDistance,
      header: 'Activo',
      type: 'status' as const,
    }] : []),
    {
      key: 'created_at',
      header: 'Fecha de Creación',
      type: 'date',
    },
  ];

  const handleStatusToggle = async (row: ReporteWithDistance, newStatus: boolean) => {
    if (!canToggleStatus) {
      toast.error('No tienes permiso para cambiar el estado');
      return;
    }
    
    // Si se va a DESACTIVAR, requiere evidencias y comentario
    if (!newStatus) {
      resolutionModal.open({
        type: 'desactivacion',
        reportName: row.nombre,
        requireEvidence: true,
        isBulk: false,
        onConfirm: async (comentario, evidencias) => {
          // Registrar historial con evidencias
          await createHistorial({
            reporteId: row.id,
            tipoAccion: 'desactivacion',
            comentario,
            evidencias,
            estadoAnterior: 'activo',
            estadoNuevo: 'inactivo',
          });
          // Ejecutar la desactivación Y desasignar usuario
          // Para que al reactivar vuelva a "pendiente"
          await update({
            id: row.id,
            updates: { 
              activo: false,
              assigned_to: null, // Desasignar usuario al desactivar
            }
          });
          toast.success('Reporte desactivado con justificación');
        },
      });
      return;
    }
    
    // Activar no requiere evidencia (pero registra historial)
    // El reporte volverá a "pendiente" porque assigned_to es null
    try {
      await createHistorial({
        reporteId: row.id,
        tipoAccion: 'activacion',
        comentario: 'Reporte activado',
        estadoAnterior: 'inactivo',
        estadoNuevo: 'activo',
      });
      // Al activar, como no hay assigned_to, se mantiene como pendiente
      await update({
        id: row.id,
        updates: { 
          activo: true,
          status: 'pendiente', // Vuelve a pendiente al reactivar
        }
      });
      toast.success('Reporte activado - Estado: Pendiente');
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleDelete = async (row: ReporteWithDistance) => {
    const confirmed = await confirm({
      title: '¿Eliminar reporte?',
      description: `Esta acción eliminará el reporte "${row.nombre}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    if (onDelete) {
      onDelete(row);
    } else {
      try {
        await remove(row.id);
        toast.success('Reporte eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el reporte');
      }
    }
  };

  // Construir acciones según permisos
  const actions: DataTableAction<ReporteWithDistance>[] = [];

  if (canEdit) {
    actions.push({
      label: 'Editar',
      onClick: (row) => onEdit?.(row),
      icon: <Edit className="h-4 w-4" />,
    });
  }

  if (canDelete) {
    actions.push({
      label: 'Eliminar',
      onClick: handleDelete,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
    });
  }

  return (
    <>
      <DataTableComplete
        data={data}
        columns={columns}
        actions={actions.length > 0 ? actions : undefined}
        isLoading={isLoading}
        onStatusToggle={canToggleStatus ? handleStatusToggle : undefined}
        emptyMessage="No hay reportes registrados"
        getRowId={(row) => row.id}
        searchPlaceholder="Buscar reportes..."
        exportFileName="reportes"
        selectedRows={selectedRows}
        onSelectionChange={onSelectionChange}
      />
      {ConfirmationDialog}
      {/* Modal de resolución para desactivación individual */}
      {resolutionModal.Modal}
    </>
  );
}
