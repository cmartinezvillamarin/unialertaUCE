import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ReporteWithDistance } from '@/hooks/entidades/useOptimizedReportes';

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

interface SendReportMessageParams {
  reportDetails: ReportDetails;
  assignedToUserId: string;
  assignedByUserId: string;
  assignedByName?: string;
}

interface UseReportAssignmentMessageReturn {
  /**
   * Envía un mensaje automático con los detalles del reporte al usuario asignado.
   * Crea una conversación si no existe.
   */
  sendReportAssignmentMessage: (params: SendReportMessageParams) => Promise<string | null>;
}

/**
 * Hook para enviar mensajes automáticos cuando se asigna un reporte.
 * Crea una conversación individual con el usuario asignado y envía
 * un mensaje especial con todos los detalles del reporte.
 */
export function useReportAssignmentMessage(): UseReportAssignmentMessageReturn {
  const sendReportAssignmentMessage = useCallback(async ({
    reportDetails,
    assignedToUserId,
    assignedByUserId,
    assignedByName = 'Sistema',
  }: SendReportMessageParams): Promise<string | null> => {
    try {
      console.log('[ReportAssignmentMessage] Iniciando envío de mensaje automático...');
      console.log('[ReportAssignmentMessage] Reporte:', reportDetails.id, reportDetails.nombre);
      console.log('[ReportAssignmentMessage] Asignado a:', assignedToUserId);
      console.log('[ReportAssignmentMessage] Asignado por:', assignedByUserId);

      // 1. Verificar que no sea el mismo usuario
      if (assignedToUserId === assignedByUserId) {
        console.log('[ReportAssignmentMessage] Usuario se asignó a sí mismo, no enviar mensaje');
        return null;
      }

      // 2. Buscar o crear conversación individual entre ambos usuarios
      let conversacionId: string | null = null;

      // Buscar conversación existente
      const { data: existingParticipants } = await supabase
        .from('participantes_conversacion')
        .select('conversacion_id')
        .eq('user_id', assignedByUserId);

      if (existingParticipants) {
        for (const pc of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from('participantes_conversacion')
            .select('conversacion_id')
            .eq('conversacion_id', pc.conversacion_id)
            .eq('user_id', assignedToUserId)
            .single();

          if (otherParticipant) {
            // Verificar que no sea un grupo
            const { data: conv } = await supabase
              .from('conversaciones')
              .select('es_grupo')
              .eq('id', pc.conversacion_id)
              .single();

            if (conv && !conv.es_grupo) {
              conversacionId = pc.conversacion_id;
              
              // Reactivar conversación si estaba oculta
              await supabase
                .from('participantes_conversacion')
                .update({ hidden_from_todos: false, hidden_at: null })
                .eq('conversacion_id', conversacionId);
              
              break;
            }
          }
        }
      }

      // Si no existe conversación, crear una nueva
      if (!conversacionId) {
        console.log('[ReportAssignmentMessage] Creando nueva conversación...');
        
        const { data: newConv, error: convError } = await supabase
          .from('conversaciones')
          .insert({
            es_grupo: false,
            created_by: assignedByUserId,
          })
          .select()
          .single();

        if (convError) {
          console.error('[ReportAssignmentMessage] Error creando conversación:', convError);
          throw convError;
        }

        conversacionId = newConv.id;

        // Agregar participantes
        const { error: partError } = await supabase
          .from('participantes_conversacion')
          .insert([
            { conversacion_id: conversacionId, user_id: assignedByUserId, role: 'miembro' },
            { conversacion_id: conversacionId, user_id: assignedToUserId, role: 'miembro' },
          ]);

        if (partError) {
          console.error('[ReportAssignmentMessage] Error agregando participantes:', partError);
          throw partError;
        }
      }

      // 3. Determinar prioridad para mensaje urgente
      const priority = reportDetails.priority?.toLowerCase() || 'medio';
      const isUrgent = priority === 'urgente' || priority === 'alto';
      
      // 4. Construir contenido del mensaje
      const priorityLabel = {
        urgente: '🚨 URGENTE',
        alto: '⚠️ PRIORIDAD ALTA',
        medio: '📋 Prioridad Media',
        bajo: '📝 Prioridad Baja',
      }[priority] || '📋 Nuevo reporte';

      const statusLabel = reportDetails.estado || 'Pendiente';
      
      let messageContent = `${priorityLabel}\n\n`;
      messageContent += `📌 *Se te ha asignado un reporte*\n\n`;
      messageContent += `*${reportDetails.nombre}*\n`;
      
      if (reportDetails.descripcion) {
        messageContent += `\n${reportDetails.descripcion}\n`;
      }
      
      messageContent += `\n━━━━━━━━━━━━━━━━\n`;
      messageContent += `📊 Estado: ${statusLabel}\n`;
      
      if (reportDetails.categoria_nombre) {
        messageContent += `🏷️ Categoría: ${reportDetails.categoria_nombre}\n`;
      }
      
      if (reportDetails.tipo_nombre) {
        messageContent += `📁 Tipo: ${reportDetails.tipo_nombre}\n`;
      }
      
      if (reportDetails.direccion) {
        messageContent += `📍 Ubicación: ${reportDetails.direccion}\n`;
      }
      
      messageContent += `\n👤 Asignado por: ${assignedByName}`;
      
      if (isUrgent) {
        messageContent += `\n\n⚡ *Toca para navegar al reporte*`;
      }

      // 5. Crear el objeto shared_post con información del reporte
      const sharedReportData = {
        type: 'report',
        reportId: reportDetails.id,
        title: reportDetails.nombre,
        description: reportDetails.descripcion || null,
        status: reportDetails.estado || 'pendiente',
        priority: priority,
        isUrgent: isUrgent,
        address: reportDetails.direccion || null,
        latitude: reportDetails.latitud,
        longitude: reportDetails.longitud,
        images: reportDetails.imagenes || [],
        category: reportDetails.categoria_nombre || null,
        type_name: reportDetails.tipo_nombre || null,
        assignedBy: {
          id: assignedByUserId,
          name: assignedByName,
        },
        sharedAt: new Date().toISOString(),
        created_at: reportDetails.created_at,
      };

      // 6. Enviar el mensaje con el reporte compartido
      const { data: message, error: msgError } = await supabase
        .from('mensajes')
        .insert({
          conversacion_id: conversacionId,
          user_id: assignedByUserId,
          contenido: messageContent,
          imagenes: reportDetails.imagenes?.slice(0, 4) || null, // Máximo 4 imágenes
          shared_post: sharedReportData,
        })
        .select()
        .single();

      if (msgError) {
        console.error('[ReportAssignmentMessage] Error enviando mensaje:', msgError);
        throw msgError;
      }

      // 7. Actualizar timestamp de la conversación
      await supabase
        .from('conversaciones')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversacionId);

      console.log('[ReportAssignmentMessage] Mensaje enviado exitosamente:', message.id);
      console.log('[ReportAssignmentMessage] Conversación:', conversacionId);

      return conversacionId;
    } catch (error) {
      console.error('[ReportAssignmentMessage] Error:', error);
      return null;
    }
  }, []);

  return {
    sendReportAssignmentMessage,
  };
}

/**
 * Función auxiliar para extraer detalles de un ReporteWithDistance
 */
export function extractReportDetails(reporte: ReporteWithDistance): ReportDetails {
  return {
    id: reporte.id,
    nombre: reporte.nombre,
    descripcion: reporte.descripcion as string | null,
    estado: reporte.estado as string | null,
    priority: (reporte.priority as string) || null,
    direccion: reporte.direccion as string | null,
    latitud: reporte.latitud as number | null,
    longitud: reporte.longitud as number | null,
    imagenes: reporte.imagenes,
    categoria_nombre: reporte.categories?.nombre || null,
    tipo_nombre: reporte.tipo_categories?.nombre || null,
    created_at: reporte.created_at,
  };
}
