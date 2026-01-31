import { useCallback, useMemo } from 'react';
import { useOptimizedProfile } from './useOptimizedProfile';
import { useOptimizedReportes, type ReporteWithDistance, type ReporteUpdate, type ReporteInsert, type Reporte } from './useOptimizedReportes';
import { useReportAssignmentNotification } from '@/hooks/controlador/useReportAssignmentNotification';

interface UseReportesWithNotificationsReturn {
  data: ReporteWithDistance[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasLocation: boolean;
  
  // Operaciones CRUD con notificaciones automáticas
  create: (reporte: ReporteInsert) => Promise<Reporte>;
  update: (params: { id: string; updates: ReporteUpdate; previousAssignedTo?: string | null }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

/**
 * Hook que extiende useOptimizedReportes con notificaciones automáticas
 * cuando se asigna un reporte a un usuario.
 */
export function useReportesWithNotifications(): UseReportesWithNotificationsReturn {
  const { data: profile } = useOptimizedProfile();
  const reportes = useOptimizedReportes();
  const { notifyAssignment } = useReportAssignmentNotification();

  const assignerName = useMemo(() => profile?.name || 'Sistema', [profile?.name]);
  const currentUserId = profile?.id;

  /**
   * Actualiza un reporte y envía notificación si se asigna a un nuevo usuario
   */
  const updateWithNotification = useCallback(async ({
    id,
    updates,
    previousAssignedTo,
  }: {
    id: string;
    updates: ReporteUpdate;
    previousAssignedTo?: string | null;
  }) => {
    // Ejecutar la actualización
    await reportes.update({ id, updates });

    // Si se asigna a un nuevo usuario diferente del anterior, notificar
    const newAssignedTo = updates.assigned_to;
    if (
      newAssignedTo && 
      newAssignedTo !== previousAssignedTo &&
      newAssignedTo !== currentUserId // No notificar si te asignas a ti mismo
    ) {
      // Obtener el reporte completo de la data actual
      const reporte = reportes.data.find(r => r.id === id);
      if (reporte) {
        // Extraer coordenadas de geolocation o location
        const geo = reporte.geolocation as { lat?: number; lng?: number; address?: string } | null;
        const loc = reporte.location as { lat?: number; lng?: number; address?: string } | null;

        await notifyAssignment({
          reportId: id,
          reportName: reporte.nombre,
          assignedToUserId: newAssignedTo,
          assignedByUserId: currentUserId,
          assignedByName: assignerName,
          reportDetails: {
            id: reporte.id,
            nombre: reporte.nombre,
            descripcion: reporte.descripcion as string | null,
            estado: reporte.status as string | null,
            priority: reporte.priority as string | null,
            direccion: geo?.address || loc?.address || null,
            latitud: geo?.lat || loc?.lat || null,
            longitud: geo?.lng || loc?.lng || null,
            imagenes: reporte.imagenes,
            categoria_nombre: reporte.categories?.nombre || null,
            tipo_nombre: reporte.tipo_categories?.nombre || null,
            created_at: reporte.created_at,
          },
        });
      }
    }
  }, [reportes, notifyAssignment, currentUserId, assignerName]);

  return {
    data: reportes.data,
    isLoading: reportes.isLoading,
    error: reportes.error,
    refetch: reportes.refetch,
    hasLocation: reportes.hasLocation,
    create: reportes.create,
    update: updateWithNotification,
    remove: reportes.remove,
    toggleStatus: reportes.toggleStatus,
  };
}
