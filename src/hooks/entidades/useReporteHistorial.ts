import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export interface ReporteHistorialItem {
  id: string;
  reporte_id: string;
  tipo_accion: ReporteHistorialTipo;
  assigned_to: string | null;
  assigned_from: string | null;
  assigned_by: string | null;
  comentario: string | null;
  evidencias: string[] | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  prioridad_anterior: string | null;
  prioridad_nuevo: string | null;
  es_bulk: boolean;
  bulk_session_id: string | null;
  fecha_asignacion: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  assigned_to_profile?: { id: string; name: string | null } | null;
  assigned_from_profile?: { id: string; name: string | null } | null;
  assigned_by_profile?: { id: string; name: string | null } | null;
}

export function useReporteHistorial(reporteId: string) {
  return useQuery({
    queryKey: ['reporte-historial', reporteId],
    queryFn: async () => {
      // Obtener historial básico con todos los campos
      const { data: historialData, error: historialError } = await supabase
        .from('reporte_historial')
        .select('*')
        .eq('reporte_id', reporteId)
        .order('fecha_asignacion', { ascending: false });

      if (historialError) throw historialError;
      if (!historialData || historialData.length === 0) return [];

      // Obtener IDs únicos de usuarios
      const userIds = new Set<string>();
      historialData.forEach(item => {
        if (item.assigned_to) userIds.add(item.assigned_to);
        if (item.assigned_from) userIds.add(item.assigned_from);
        if (item.assigned_by) userIds.add(item.assigned_by);
      });

      // Obtener perfiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', Array.from(userIds));

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Mapear historial con perfiles
      return historialData.map(item => ({
        ...item,
        tipo_accion: (item.tipo_accion || 'asignacion') as ReporteHistorialTipo,
        evidencias: item.evidencias || [],
        es_bulk: item.es_bulk || false,
        assigned_to_profile: item.assigned_to ? profilesMap.get(item.assigned_to) || null : null,
        assigned_from_profile: item.assigned_from ? profilesMap.get(item.assigned_from) || null : null,
        assigned_by_profile: item.assigned_by ? profilesMap.get(item.assigned_by) || null : null,
      })) as ReporteHistorialItem[];
    },
    enabled: !!reporteId,
  });
}
