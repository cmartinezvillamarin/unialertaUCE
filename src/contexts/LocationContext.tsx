import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUserLocation, UseUserLocationReturn } from '@/hooks/controlador/useUserLocation';
import { useSessionPersistence } from '@/hooks/controlador/useSessionPersistence';
import { useLocationSync } from '@/hooks/controlador/useLocationSync';
import { supabase } from '@/integrations/supabase/client';

interface LocationContextValue extends UseUserLocationReturn {
  /** Limpia la ubicación del usuario en la base de datos */
  clearUserLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

interface LocationProviderProps {
  children: ReactNode;
}

/**
 * Provider global para la ubicación del usuario.
 * Inicia el tracking cuando el usuario está autenticado.
 * Sincroniza la ubicación con la tabla user_locations en Supabase.
 * Detiene el tracking cuando cierra sesión.
 */
export function LocationProvider({ children }: LocationProviderProps) {
  const { isAuthenticated, loading, user } = useSessionPersistence();
  const [profileId, setProfileId] = useState<string | null>(null);
  const locationState = useUserLocation();
  const { startTracking, stopTracking, isSupported, isTracking, location } = locationState;

  // Obtener el profile.id basado en auth.uid()
  useEffect(() => {
    if (!user?.id) {
      setProfileId(null);
      return;
    }

    const fetchProfileId = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[LocationProvider] Error fetching profile ID:', error);
        return;
      }

      setProfileId(data?.id ?? null);
    };

    fetchProfileId();
  }, [user?.id]);
  
  const { syncLocation, clearUserLocation } = useLocationSync(profileId, {
    minUpdateInterval: 10000, // Sincronizar máximo cada 10 segundos
    minDistanceMeters: 10, // O si se mueve más de 10 metros
    debug: import.meta.env.DEV, // Solo logs en desarrollo
  });

  // Iniciar/detener tracking según autenticación
  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && isSupported && !isTracking) {
      startTracking();
    } else if (!isAuthenticated && isTracking) {
      stopTracking();
      clearUserLocation();
    }
  }, [isAuthenticated, loading, isSupported, isTracking, startTracking, stopTracking, clearUserLocation]);

  // Limpiar ubicación cuando el navegador pierde conexión o se cierra la pestaña
  useEffect(() => {
    if (!profileId) return;

    const handleOffline = () => {
      console.log('[LocationContext] Browser went offline, clearing location');
      clearUserLocation();
    };

    const handleBeforeUnload = async () => {
      // Use fetch with keepalive to send authenticated request before page closes
      if (profileId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            const url = `https://tgrfsuewkayqrobdfesa.supabase.co/functions/v1/cleanup-user-locations`;
            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ action: 'cleanup_user', user_id: profileId }),
              keepalive: true,
            });
          }
        } catch {
          // Best effort - if session is gone, stale cleanup will handle it
        }
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [profileId, clearUserLocation]);

  // Sincronizar ubicación con Supabase cuando cambie
  useEffect(() => {
    if (location && isAuthenticated && profileId) {
      syncLocation(location);
    }
  }, [location, isAuthenticated, profileId, syncLocation]);

  // Limpiar ubicación al cerrar sesión
  useEffect(() => {
    if (!isAuthenticated && profileId === null) {
      // El usuario cerró sesión, la ubicación ya fue limpiada
    }
  }, [isAuthenticated, profileId]);

  const contextValue: LocationContextValue = {
    ...locationState,
    clearUserLocation,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

/**
 * Hook para acceder a la ubicación del usuario desde cualquier componente.
 */
export function useGlobalLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useGlobalLocation debe usarse dentro de LocationProvider');
  }
  return context;
}
