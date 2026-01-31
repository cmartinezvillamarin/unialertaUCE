import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ActiveTracking = Database['public']['Tables']['active_trackings']['Row'];
type ActiveTrackingInsert = Database['public']['Tables']['active_trackings']['Insert'];

export interface TrackingWithDetails extends ActiveTracking {
  reporte?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    priority?: string | null;
    status?: string | null;
    location?: unknown;
  } | null;
  asignado?: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  creador?: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
}

export interface UserLocationRealtime {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updated_at: string;
}

export interface UseActiveTrackingReturn {
  // Estado
  activeTrackings: TrackingWithDetails[];
  trackingHistory: TrackingWithDetails[];
  currentTracking: TrackingWithDetails | null;
  isLoading: boolean;
  error: string | null;
  
  // Ubicación en tiempo real del asignado
  assignedUserLocation: UserLocationRealtime | null;
  
  // Acciones
  createTracking: (data: {
    reporteId: string;
    asignadoA: string;
    creadorId: string;
  }) => Promise<ActiveTracking | null>;
  endTracking: (trackingId: string, reason: string) => Promise<boolean>;
  fetchActiveTrackings: () => Promise<void>;
  fetchTrackingHistory: () => Promise<void>;
  selectTracking: (trackingId: string) => void;
  clearCurrentTracking: () => void;
  
  // Contadores
  activeCount: number;
}

/**
 * Hook para gestionar trackings activos de reportes.
 * Incluye suscripción en tiempo real para ubicación del asignado.
 */
export function useActiveTracking(): UseActiveTrackingReturn {
  const [activeTrackings, setActiveTrackings] = useState<TrackingWithDetails[]>([]);
  const [trackingHistory, setTrackingHistory] = useState<TrackingWithDetails[]>([]);
  const [currentTracking, setCurrentTracking] = useState<TrackingWithDetails | null>(null);
  const [assignedUserLocation, setAssignedUserLocation] = useState<UserLocationRealtime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const locationChannelRef = useRef<RealtimeChannel | null>(null);
  const trackingsChannelRef = useRef<RealtimeChannel | null>(null);
  const trackingsPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Obtener trackings activos
  const fetchActiveTrackings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('active_trackings')
        .select(`
          *,
          reporte:reportes(id, nombre, descripcion, priority, status, location),
          asignado:profiles!active_trackings_asignado_a_fkey(id, name, avatar),
          creador:profiles!active_trackings_creador_id_fkey(id, name, avatar)
        `)
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setActiveTrackings((data as TrackingWithDetails[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener trackings';
      setError(message);
      console.error('[useActiveTracking] fetchActiveTrackings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener historial de trackings
  const fetchTrackingHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('active_trackings')
        .select(`
          *,
          reporte:reportes(id, nombre, descripcion, priority, status, location),
          asignado:profiles!active_trackings_asignado_a_fkey(id, name, avatar),
          creador:profiles!active_trackings_creador_id_fkey(id, name, avatar)
        `)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setTrackingHistory((data as TrackingWithDetails[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener historial';
      setError(message);
      console.error('[useActiveTracking] fetchTrackingHistory error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear nuevo tracking
  const createTracking = useCallback(async (data: {
    reporteId: string;
    asignadoA: string;
    creadorId: string;
  }): Promise<ActiveTracking | null> => {
    setError(null);
    
    try {
      const insertData: ActiveTrackingInsert = {
        reporte_id: data.reporteId,
        asignado_a: data.asignadoA,
        creador_id: data.creadorId,
      };

      const { data: created, error: insertError } = await supabase
        .from('active_trackings')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Refrescar lista
      await fetchActiveTrackings();
      
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear tracking';
      setError(message);
      console.error('[useActiveTracking] createTracking error:', err);
      return null;
    }
  }, [fetchActiveTrackings]);

  // Terminar tracking
  const endTracking = useCallback(async (trackingId: string, reason: string): Promise<boolean> => {
    setError(null);
    
    try {
      // 1. Validar que el tracking existe y no está finalizado
      const { data: freshTracking, error: fetchError } = await supabase
        .from('active_trackings')
        .select('id, ended_at')
        .eq('id', trackingId)
        .maybeSingle();

      if (fetchError) {
        console.error('[useActiveTracking] Error fetching fresh tracking:', fetchError);
        throw fetchError;
      }

      if (!freshTracking) {
        console.warn('[useActiveTracking] Tracking not found:', trackingId);
        // Ya no existe, actualizar estado local
        setActiveTrackings(prev => prev.filter(t => t.id !== trackingId));
        if (currentTracking?.id === trackingId) {
          setCurrentTracking(null);
          setAssignedUserLocation(null);
        }
        return true; // Considerarlo exitoso ya que el objetivo es que no exista
      }

      if (freshTracking.ended_at) {
        console.log('[useActiveTracking] Tracking already ended:', trackingId);
        // Ya está finalizado, actualizar estado local
        setActiveTrackings(prev => prev.filter(t => t.id !== trackingId));
        if (currentTracking?.id === trackingId) {
          setCurrentTracking(null);
          setAssignedUserLocation(null);
        }
        return true; // Ya está finalizado
      }

      // 2. Ejecutar la actualización
      const { error: updateError } = await supabase
        .from('active_trackings')
        .update({
          ended_at: new Date().toISOString(),
          ended_reason: reason,
        })
        .eq('id', trackingId)
        .is('ended_at', null); // Solo actualizar si aún no está finalizado

      if (updateError) throw updateError;
      
      // 3. INMEDIATAMENTE actualizar el estado local antes de refetch
      setActiveTrackings(prev => prev.filter(t => t.id !== trackingId));
      
      if (currentTracking?.id === trackingId) {
        setCurrentTracking(null);
        setAssignedUserLocation(null);
      }
      
      // 4. Refrescar listas para sincronizar con la DB
      // Usar Promise.allSettled para que no falle si una lista tiene error
      await Promise.allSettled([fetchActiveTrackings(), fetchTrackingHistory()]);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al terminar tracking';
      setError(message);
      console.error('[useActiveTracking] endTracking error:', err);
      return false;
    }
  }, [currentTracking, fetchActiveTrackings, fetchTrackingHistory]);

  // Seleccionar tracking para ver en mapa
  const selectTracking = useCallback((trackingId: string) => {
    const tracking = activeTrackings.find(t => t.id === trackingId);
    if (tracking) {
      setCurrentTracking(tracking);
    }
  }, [activeTrackings]);

  // Limpiar tracking actual
  const clearCurrentTracking = useCallback(() => {
    setCurrentTracking(null);
    setAssignedUserLocation(null);
  }, []);

  // Suscribirse a ubicación del usuario asignado cuando hay tracking actual
  useEffect(() => {
    if (!currentTracking?.asignado_a) {
      // Limpiar suscripción si no hay tracking
      if (locationChannelRef.current) {
        supabase.removeChannel(locationChannelRef.current);
        locationChannelRef.current = null;
      }
      setAssignedUserLocation(null);
      return;
    }

    const userId = currentTracking.asignado_a;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let isSubscriptionActive = false;

    // Obtener ubicación inicial y configurar polling como fallback
    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('user_locations')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          setAssignedUserLocation(data as UserLocationRealtime);
        }
      } catch (err) {
        console.error('[useActiveTracking] Error fetching location:', err);
      }
    };

    // Fetch inicial
    fetchLocation();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`user_location_${userId}_${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useActiveTracking] Realtime location update:', payload.eventType);
          if (payload.eventType === 'DELETE') {
            setAssignedUserLocation(null);
          } else {
            setAssignedUserLocation(payload.new as UserLocationRealtime);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useActiveTracking] Location subscription status:', status);
        isSubscriptionActive = status === 'SUBSCRIBED';
        
        // Si la suscripción falla, iniciar polling como fallback
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('[useActiveTracking] Subscription failed, starting polling fallback');
          if (!pollingInterval) {
            pollingInterval = setInterval(fetchLocation, 5000); // Poll cada 5 segundos
          }
        } else if (status === 'SUBSCRIBED') {
          // Si la suscripción funciona, detener el polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        }
      });

    locationChannelRef.current = channel;

    // Iniciar polling de respaldo por si la suscripción no funciona inmediatamente
    // Se detendrá automáticamente si la suscripción se activa
    const initialPollingDelay = setTimeout(() => {
      if (!isSubscriptionActive && !pollingInterval) {
        console.log('[useActiveTracking] Starting initial polling (subscription pending)');
        pollingInterval = setInterval(fetchLocation, 5000);
      }
    }, 3000); // Esperar 3 segundos para ver si la suscripción se activa

    return () => {
      clearTimeout(initialPollingDelay);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      supabase.removeChannel(channel);
      locationChannelRef.current = null;
    };
  }, [currentTracking?.asignado_a]);

  // Suscribirse a cambios en trackings (para detectar cierre por cambio de estado)
  useEffect(() => {
    // Limpieza defensiva por si el hook se remonta (HMR) o hay dobles efectos en StrictMode
    if (trackingsChannelRef.current) {
      supabase.removeChannel(trackingsChannelRef.current);
      trackingsChannelRef.current = null;
    }
    if (trackingsPollingRef.current) {
      clearInterval(trackingsPollingRef.current);
      trackingsPollingRef.current = null;
    }

    let isSubscriptionActive = false;

    const startPolling = () => {
      if (!trackingsPollingRef.current) {
        trackingsPollingRef.current = setInterval(() => {
          fetchActiveTrackings();
        }, 5000);
      }
    };

    const stopPolling = () => {
      if (trackingsPollingRef.current) {
        clearInterval(trackingsPollingRef.current);
        trackingsPollingRef.current = null;
      }
    };

    const channel = supabase
      .channel(`active_trackings_changes_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_trackings',
        },
        () => {
          // Refrescar lista cuando hay cambios
          fetchActiveTrackings();
        }
      )
      .subscribe((status) => {
        // Si Realtime falla, hacemos polling para que el otro usuario vea el cierre sin recargar.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('[useActiveTracking] Trackings subscription failed, starting polling fallback:', status);
          isSubscriptionActive = false;
          startPolling();
        }
        if (status === 'SUBSCRIBED') {
          isSubscriptionActive = true;
          stopPolling();
        }
      });

    trackingsChannelRef.current = channel;

    // Polling inicial de respaldo por si la suscripción tarda en activarse
    const initialPollingDelay = setTimeout(() => {
      if (!isSubscriptionActive) startPolling();
    }, 3000);

    return () => {
      clearTimeout(initialPollingDelay);
      stopPolling();
      supabase.removeChannel(channel);
      trackingsChannelRef.current = null;
    };
  }, [fetchActiveTrackings]);

  // Cargar trackings activos al montar
  useEffect(() => {
    fetchActiveTrackings();
  }, [fetchActiveTrackings]);

  // Mantener currentTracking sincronizado con la lista activa.
  // Caso clave: si otro usuario finaliza el tracking, este cliente debe salir del modo mapa
  // inmediatamente (sin recargar/cambiar de página).
  useEffect(() => {
    const currentId = currentTracking?.id;
    if (!currentId) return;

    const stillActive = activeTrackings.find((t) => t.id === currentId);

    if (!stillActive) {
      // El tracking ya no está activo (fue finalizado por otro usuario)
      setCurrentTracking(null);
      setAssignedUserLocation(null);
    }
    // Nota: No actualizamos currentTracking si stillActive existe para evitar loops infinitos.
    // El objeto en activeTrackings ya está actualizado por fetchActiveTrackings.
  }, [activeTrackings]); // Solo depender de activeTrackings, no de currentTracking

  // Fallback adicional: si por cualquier razón Realtime no actualiza la lista,
  // verificamos periódicamente (solo cuando hay un tracking seleccionado) si ya fue finalizado.
  useEffect(() => {
    const trackingId = currentTracking?.id;
    if (!trackingId) return;

    let cancelled = false;

    const checkStillActive = async () => {
      try {
        const { data, error: checkError } = await supabase
          .from('active_trackings')
          .select('id')
          .eq('id', trackingId)
          .is('ended_at', null)
          .maybeSingle();

        if (checkError) {
          console.warn('[useActiveTracking] Error checking current tracking status:', checkError);
          return;
        }

        if (!cancelled && !data) {
          // Ya no está activo (finalizado por otro usuario)
          // Importante: también remover de la lista local para evitar auto-selección
          // (GeoTracking auto-selecciona cuando queda 1 tracking activo y currentTracking=null)
          setActiveTrackings((prev) => prev.filter((t) => t.id !== trackingId));
          setCurrentTracking(null);
          setAssignedUserLocation(null);
        }
      } catch (err) {
        console.warn('[useActiveTracking] Unexpected error checking current tracking status:', err);
      }
    };

    // Check inmediato + polling
    checkStillActive();
    const interval = setInterval(checkStillActive, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentTracking?.id]);

  return {
    activeTrackings,
    trackingHistory,
    currentTracking,
    isLoading,
    error,
    assignedUserLocation,
    createTracking,
    endTracking,
    fetchActiveTrackings,
    fetchTrackingHistory,
    selectTracking,
    clearCurrentTracking,
    activeCount: activeTrackings.length,
  };
}
