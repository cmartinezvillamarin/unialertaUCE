/**
 * Hook para obtener solicitudes de amistad pendientes recibidas
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingFriendRequest {
  id: string;
  user_id: string;
  seguidor_id: string;
  created_at: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
    username: string | null;
  };
}

interface UsePendingFriendRequestsOptions {
  userId?: string | null;
  enabled?: boolean;
}

export function usePendingFriendRequests(options: UsePendingFriendRequestsOptions = {}) {
  const { userId, enabled = true } = options;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['receivedFriendRequests', userId],
    queryFn: async (): Promise<PendingFriendRequest[]> => {
      if (!userId) return [];

      // Obtener solicitudes donde user_id = currentUser (el receptor) y estado = pendiente
      const { data: requests, error } = await supabase
        .from('relaciones')
        .select(`
          id,
          user_id,
          seguidor_id,
          created_at,
          profiles!relaciones_seguidor_id_fkey (
            id,
            name,
            avatar,
            username
          )
        `)
        .eq('user_id', userId)
        .eq('tipo', 'amigo')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (requests || []).map((req: any) => ({
        id: req.id,
        user_id: req.user_id,
        seguidor_id: req.seguidor_id,
        created_at: req.created_at,
        sender: {
          id: req.profiles?.id || req.seguidor_id,
          name: req.profiles?.name || null,
          avatar: req.profiles?.avatar || null,
          username: req.profiles?.username || null,
        },
      }));
    },
    enabled: enabled && !!userId,
    staleTime: 30000,
  });

  return {
    pendingRequests: data || [],
    count: data?.length || 0,
    isLoading,
    refetch,
  };
}
