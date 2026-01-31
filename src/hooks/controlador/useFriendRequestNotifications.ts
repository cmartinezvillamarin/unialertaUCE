/**
 * Hook para escuchar nuevas solicitudes de amistad en tiempo real y mostrar notificaciones push
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

interface UseFriendRequestNotificationsOptions {
  userId?: string | null;
  enabled?: boolean;
}

export function useFriendRequestNotifications(options: UseFriendRequestNotificationsOptions = {}) {
  const { userId, enabled = true } = options;
  const { showNotification, permission } = usePushNotifications();
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !userId || permission !== 'granted') {
      return;
    }

    console.log('[FriendRequestNotifications] Subscribing to friend request changes for user:', userId);

    const channel = supabase
      .channel('friend-request-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'relaciones',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newRequest = payload.new as {
            id: string;
            user_id: string;
            seguidor_id: string;
            tipo: string;
            estado: string;
          };

          // Solo procesar solicitudes de amistad pendientes
          if (newRequest.tipo !== 'amigo' || newRequest.estado !== 'pendiente') {
            return;
          }

          // Evitar duplicados
          if (processedIds.current.has(newRequest.id)) {
            return;
          }
          processedIds.current.add(newRequest.id);

          console.log('[FriendRequestNotifications] New friend request received:', newRequest);

          // Obtener datos del remitente
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('name, username, avatar')
            .eq('id', newRequest.seguidor_id)
            .single();

          const senderName = senderProfile?.name || senderProfile?.username || 'Alguien';

          // Mostrar notificación push
          await showNotification('Nueva solicitud de amistad', {
            body: `${senderName} quiere ser tu amigo`,
            icon: senderProfile?.avatar || '/favicon.ico',
            tag: `friend-request-${newRequest.id}`,
            data: {
              url: '/red-social',
              type: 'friend_request',
              requestId: newRequest.id,
            },
            requireInteraction: true,
          });
        }
      )
      .subscribe((status) => {
        console.log('[FriendRequestNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[FriendRequestNotifications] Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, permission, showNotification]);
}
