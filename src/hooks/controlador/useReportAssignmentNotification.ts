import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';
import { useReportAssignmentMessage } from './useReportAssignmentMessage';

interface ReportDetails {
  id: string;
  nombre: string;
  descripcion?: string | null;
  estado?: string | null;
  priority?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  imagenes?: string[] | null;
  categoria_nombre?: string | null;
  tipo_nombre?: string | null;
  created_at?: string;
}

interface NotifyAssignmentParams {
  reportId: string;
  reportName: string;
  assignedToUserId: string;
  assignedByUserId?: string;
  assignedByName?: string;
  /** Detalles completos del reporte para enviar mensaje */
  reportDetails?: ReportDetails;
}

interface UseReportAssignmentNotificationReturn {
  notifyAssignment: (params: NotifyAssignmentParams) => Promise<boolean>;
  notifyBulkAssignment: (params: {
    reportIds: string[];
    assignedToUserId: string;
    assignedByUserId?: string;
    assignedByName?: string;
  }) => Promise<boolean>;
  /** Cierra el geotracking de un reporte cuando se desasigna o pasa a estado terminal */
  endReportTracking: (reportId: string, reason: string) => Promise<boolean>;
}

/**
 * Crea un registro de geotracking activo para el reporte asignado.
 * Primero verifica si ya existe un tracking activo para ese reporte.
 */
async function createGeoTracking(
  reporteId: string,
  asignadoA: string,
  creadorId: string
): Promise<boolean> {
  try {
    // Verificar si ya existe un tracking activo para este reporte
    const { data: existingTracking, error: checkError } = await supabase
      .from('active_trackings')
      .select('id')
      .eq('reporte_id', reporteId)
      .is('ended_at', null)
      .maybeSingle();

    if (checkError) {
      console.error('[GeoTracking] Error verificando tracking existente:', checkError);
      // Continuar intentando crear de todas formas
    }

    if (existingTracking) {
      console.log('[GeoTracking] Ya existe tracking activo para reporte:', reporteId);
      // Actualizar el tracking existente con el nuevo asignado
      const { error: updateError } = await supabase
        .from('active_trackings')
        .update({
          asignado_a: asignadoA,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTracking.id);

      if (updateError) {
        console.error('[GeoTracking] Error actualizando tracking existente:', updateError);
        return false;
      }
      console.log('[GeoTracking] Tracking actualizado exitosamente');
      return true;
    }

    // Crear nuevo tracking
    const { error: insertError } = await supabase
      .from('active_trackings')
      .insert({
        reporte_id: reporteId,
        asignado_a: asignadoA,
        creador_id: creadorId,
      });

    if (insertError) {
      console.error('[GeoTracking] Error creando tracking:', insertError);
      return false;
    }

    console.log('[GeoTracking] Tracking creado exitosamente para reporte:', reporteId);
    return true;
  } catch (err) {
    console.error('[GeoTracking] Error inesperado:', err);
    return false;
  }
}

/**
 * Cierra el geotracking activo de un reporte cuando se quita la asignación
 * o el reporte pasa a un estado terminal.
 */
async function endGeoTracking(
  reporteId: string,
  reason: string
): Promise<boolean> {
  try {
    // Buscar tracking activo para este reporte
    const { data: existingTracking, error: checkError } = await supabase
      .from('active_trackings')
      .select('id')
      .eq('reporte_id', reporteId)
      .is('ended_at', null)
      .maybeSingle();

    if (checkError) {
      console.error('[GeoTracking] Error buscando tracking activo:', checkError);
      return false;
    }

    if (!existingTracking) {
      console.log('[GeoTracking] No hay tracking activo para cerrar:', reporteId);
      return true; // No es un error, simplemente no hay nada que cerrar
    }

    // Cerrar el tracking
    const { error: updateError } = await supabase
      .from('active_trackings')
      .update({
        ended_at: new Date().toISOString(),
        ended_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingTracking.id);

    if (updateError) {
      console.error('[GeoTracking] Error cerrando tracking:', updateError);
      return false;
    }

    console.log('[GeoTracking] Tracking cerrado exitosamente:', reporteId, 'Razón:', reason);
    return true;
  } catch (err) {
    console.error('[GeoTracking] Error inesperado al cerrar:', err);
    return false;
  }
}

/**
 * Hook para enviar notificaciones automáticas cuando se asigna un reporte a un usuario.
 * Crea una notificación in-app en la tabla 'notifications',
 * muestra una notificación push PWA si el navegador lo soporta y tiene permiso,
 * envía un mensaje automático con todos los detalles del reporte,
 * y crea un registro de geotracking activo.
 */
export function useReportAssignmentNotification(): UseReportAssignmentNotificationReturn {
  const { showNotification, permission } = usePushNotifications();
  const { sendReportAssignmentMessage } = useReportAssignmentMessage();

  /**
   * Envía notificación por una asignación individual
   */
  const notifyAssignment = useCallback(async ({
    reportId,
    reportName,
    assignedToUserId,
    assignedByUserId,
    assignedByName = 'Sistema',
    reportDetails,
  }: NotifyAssignmentParams): Promise<boolean> => {
    let notificationSent = false;
    let messageSent = false;
    let trackingCreated = false;

    try {
      // 1. Crear notificación in-app en la base de datos
      const { error: dbError } = await supabase.from('notifications').insert({
        user_id: assignedToUserId,
        title: 'Nuevo reporte asignado',
        message: `Se te ha asignado el reporte: "${reportName}"`,
        type: 'asignacion' as const,
        data: {
          type: 'report_assignment',
          report_id: reportId,
          report_name: reportName,
          assigned_by: assignedByName,
        },
      });

      if (dbError) {
        console.error('[ReportAssignmentNotification] Error creando notificación (continuando con mensaje):', dbError);
        // NO retornamos false, continuamos con el mensaje
      } else {
        notificationSent = true;
      }

      // 2. Mostrar notificación push PWA (solo si tiene permiso)
      if (permission === 'granted') {
        const isUrgent = reportDetails?.priority === 'urgente' || reportDetails?.priority === 'alto';
        try {
          await showNotification('Nuevo reporte asignado', {
            body: `Se te ha asignado: "${reportName}"`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: `report-assignment-${reportId}`,
            data: {
              url: isUrgent ? '/geotracking' : `/reporte/${reportId}`,
              reportId,
            },
          });
        } catch (pushError) {
          console.warn('[ReportAssignmentNotification] Error en notificación push:', pushError);
        }
      }

      // 3. Enviar mensaje automático con detalles del reporte (SIEMPRE intentar)
      if (reportDetails && assignedByUserId) {
        console.log('[ReportAssignmentNotification] Enviando mensaje automático...');
        console.log('[ReportAssignmentNotification] reportDetails:', reportDetails);
        console.log('[ReportAssignmentNotification] assignedToUserId:', assignedToUserId);
        console.log('[ReportAssignmentNotification] assignedByUserId:', assignedByUserId);
        
        const conversationId = await sendReportAssignmentMessage({
          reportDetails,
          assignedToUserId,
          assignedByUserId,
          assignedByName,
        });
        
        if (conversationId) {
          messageSent = true;
          console.log('[ReportAssignmentNotification] Mensaje enviado exitosamente a conversación:', conversationId);
        } else {
          console.error('[ReportAssignmentNotification] Error: mensaje no enviado');
        }
      } else {
        console.warn('[ReportAssignmentNotification] No se envió mensaje - falta reportDetails o assignedByUserId');
        console.warn('[ReportAssignmentNotification] reportDetails:', !!reportDetails);
        console.warn('[ReportAssignmentNotification] assignedByUserId:', assignedByUserId);
      }

      // 4. Crear geotracking automático
      if (assignedByUserId) {
        console.log('[ReportAssignmentNotification] Creando geotracking automático...');
        trackingCreated = await createGeoTracking(reportId, assignedToUserId, assignedByUserId);
        if (trackingCreated) {
          console.log('[ReportAssignmentNotification] Geotracking creado exitosamente');
        } else {
          console.warn('[ReportAssignmentNotification] No se pudo crear el geotracking');
        }
      }

      console.log('[ReportAssignmentNotification] Resultado - notificación:', notificationSent, 'mensaje:', messageSent, 'tracking:', trackingCreated);
      return notificationSent || messageSent || trackingCreated;
    } catch (error) {
      console.error('[ReportAssignmentNotification] Error general:', error);
      return false;
    }
  }, [showNotification, permission, sendReportAssignmentMessage]);

  /**
   * Envía notificación por asignación masiva (bulk)
   */
  const notifyBulkAssignment = useCallback(async ({
    reportIds,
    assignedToUserId,
    assignedByUserId,
    assignedByName = 'Sistema',
  }: {
    reportIds: string[];
    assignedToUserId: string;
    assignedByUserId?: string;
    assignedByName?: string;
  }): Promise<boolean> => {
    if (reportIds.length === 0) return false;

    try {
      const count = reportIds.length;
      
      // 1. Crear notificación in-app consolidada
      const { error: dbError } = await supabase.from('notifications').insert({
        user_id: assignedToUserId,
        title: 'Reportes asignados',
        message: `Se te han asignado ${count} reporte(s)`,
        type: 'asignacion' as const,
        data: {
          type: 'bulk_report_assignment',
          report_ids: reportIds,
          count,
          assigned_by: assignedByName,
        },
      });

      if (dbError) {
        console.error('[ReportAssignmentNotification] Error creando notificación bulk:', dbError);
        return false;
      }

      // 2. Mostrar notificación push PWA
      if (permission === 'granted') {
        await showNotification('Reportes asignados', {
          body: `Se te han asignado ${count} reporte(s)`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'bulk-report-assignment',
          data: {
            url: '/mis-reportes',
            reportIds,
          },
        });
      }

      // 3. Crear geotracking para cada reporte asignado
      if (assignedByUserId) {
        console.log('[ReportAssignmentNotification] Creando geotrackings para asignación bulk...');
        for (const reportId of reportIds) {
          await createGeoTracking(reportId, assignedToUserId, assignedByUserId);
        }
      }

      // 4. Enviar mensaje consolidado (solo para asignaciones bulk pequeñas)
      if (assignedByUserId && count <= 5) {
        // Obtener detalles de los reportes
        const { data: reportes } = await supabase
          .from('reportes')
          .select('id, nombre, descripcion, status, priority, imagenes, created_at, location, geolocation, categoria_id, tipo_reporte_id')
          .in('id', reportIds);

        if (reportes && reportes.length > 0) {
          // Obtener IDs únicos de categorías y tipos para consulta batch
          const categoriaIds = [...new Set(reportes.map(r => r.categoria_id).filter(Boolean))] as string[];
          
          // Obtener nombres de categorías
          const categoriaMap = new Map<string, string>();
          if (categoriaIds.length > 0) {
            const { data: cats } = await supabase
              .from('categories')
              .select('id, nombre')
              .in('id', categoriaIds);
            cats?.forEach(c => categoriaMap.set(c.id, c.nombre));
          }

          // Enviar mensaje por cada reporte
          for (const reporte of reportes) {
            // Extraer coordenadas de geolocation o location
            const geo = reporte.geolocation as { lat?: number; lng?: number; address?: string } | null;
            const loc = reporte.location as { lat?: number; lng?: number; address?: string } | null;
            
            await sendReportAssignmentMessage({
              reportDetails: {
                id: reporte.id,
                nombre: reporte.nombre,
                descripcion: reporte.descripcion,
                estado: reporte.status,
                priority: reporte.priority as string | null,
                direccion: geo?.address || loc?.address || null,
                latitud: geo?.lat || loc?.lat || null,
                longitud: geo?.lng || loc?.lng || null,
                imagenes: reporte.imagenes,
                categoria_nombre: reporte.categoria_id ? categoriaMap.get(reporte.categoria_id) || null : null,
                tipo_nombre: null, // Simplificado por ahora
                created_at: reporte.created_at,
              },
              assignedToUserId,
              assignedByUserId,
              assignedByName,
            });
          }
        }
      }

      console.log('[ReportAssignmentNotification] Notificación bulk enviada:', count, 'reportes');
      return true;
    } catch (error) {
      console.error('[ReportAssignmentNotification] Error bulk:', error);
      return false;
    }
  }, [showNotification, permission, sendReportAssignmentMessage]);

  /**
   * Cierra el geotracking de un reporte
   */
  const endReportTracking = useCallback(async (reportId: string, reason: string): Promise<boolean> => {
    return endGeoTracking(reportId, reason);
  }, []);

  return {
    notifyAssignment,
    notifyBulkAssignment,
    endReportTracking,
  };
}
