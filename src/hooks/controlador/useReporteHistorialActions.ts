import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedProfile } from '@/hooks/entidades/useOptimizedProfile';
import { toast } from 'sonner';

export type ReporteHistorialTipo = 
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

export interface CreateHistorialParams {
  reporteId: string;
  tipoAccion: ReporteHistorialTipo;
  comentario: string;
  evidencias?: string[];
  assignedTo?: string | null;
  assignedFrom?: string | null;
  estadoAnterior?: string;
  estadoNuevo?: string;
  prioridadAnterior?: string;
  prioridadNuevo?: string;
  esBulk?: boolean;
  bulkSessionId?: string;
}

export interface CreateBulkHistorialParams {
  reporteIds: string[];
  tipoAccion: ReporteHistorialTipo;
  comentario: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  bulkSessionId?: string;
}

/**
 * Hook para crear entradas de historial de reportes con evidencias
 */
export function useReporteHistorialActions() {
  const queryClient = useQueryClient();
  const { data: profile } = useOptimizedProfile();

  // Mutación para crear una entrada de historial individual
  const createHistorialMutation = useMutation({
    mutationFn: async (params: CreateHistorialParams) => {
      if (!profile?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('reporte_historial')
        .insert({
          reporte_id: params.reporteId,
          tipo_accion: params.tipoAccion,
          comentario: params.comentario,
          evidencias: params.evidencias || [],
          assigned_to: params.assignedTo,
          assigned_from: params.assignedFrom,
          assigned_by: profile.id,
          estado_anterior: params.estadoAnterior,
          estado_nuevo: params.estadoNuevo,
          prioridad_anterior: params.prioridadAnterior,
          prioridad_nuevo: params.prioridadNuevo,
          es_bulk: params.esBulk || false,
          bulk_session_id: params.bulkSessionId,
          fecha_asignacion: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['reporte-historial', params.reporteId] });
      queryClient.invalidateQueries({ queryKey: ['reportes-with-distance'] });
    },
    onError: (error) => {
      console.error('[useReporteHistorialActions] Error:', error);
      toast.error('Error al registrar la acción');
    },
  });

  // Mutación para crear entradas de historial en bulk
  const createBulkHistorialMutation = useMutation({
    mutationFn: async (params: CreateBulkHistorialParams) => {
      if (!profile?.id) {
        throw new Error('Usuario no autenticado');
      }

      const bulkSessionId = params.bulkSessionId || crypto.randomUUID();

      const historialEntries = params.reporteIds.map(reporteId => ({
        reporte_id: reporteId,
        tipo_accion: params.tipoAccion,
        comentario: params.comentario,
        evidencias: [], // No se requieren evidencias en bulk
        assigned_by: profile.id,
        estado_anterior: params.estadoAnterior,
        estado_nuevo: params.estadoNuevo,
        es_bulk: true,
        bulk_session_id: bulkSessionId,
        fecha_asignacion: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('reporte_historial')
        .insert(historialEntries)
        .select();

      if (error) throw error;
      return { data, bulkSessionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reporte-historial'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-with-distance'] });
    },
    onError: (error) => {
      console.error('[useReporteHistorialActions] Bulk error:', error);
      toast.error('Error al registrar las acciones en masa');
    },
  });

  return {
    createHistorial: createHistorialMutation.mutateAsync,
    createBulkHistorial: createBulkHistorialMutation.mutateAsync,
    isCreating: createHistorialMutation.isPending,
    isCreatingBulk: createBulkHistorialMutation.isPending,
  };
}
