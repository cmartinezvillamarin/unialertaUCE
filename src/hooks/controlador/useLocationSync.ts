import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserLocation } from './useUserLocation';

export interface UseLocationSyncOptions {
  /** Intervalo mínimo entre actualizaciones en ms (default: 10000 = 10s) */
  minUpdateInterval?: number;
  /** Distancia mínima en metros para enviar actualización (default: 10) */
  minDistanceMeters?: number;
  /** Habilitar logs de debug */
  debug?: boolean;
}

export interface UseLocationSyncReturn {
  syncLocation: (location: UserLocation) => Promise<void>;
  clearUserLocation: () => Promise<void>;
}

/**
 * Calcula la distancia en metros entre dos puntos usando la fórmula de Haversine
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook para sincronizar la ubicación del usuario con la tabla user_locations en Supabase.
 * Implementa throttling basado en tiempo y distancia para optimizar las actualizaciones.
 */
export function useLocationSync(
  userId: string | null,
  options: UseLocationSyncOptions = {}
): UseLocationSyncReturn {
  const {
    minUpdateInterval = 10000, // 10 segundos por defecto
    minDistanceMeters = 10, // 10 metros por defecto
    debug = false,
  } = options;

  const lastSyncRef = useRef<{
    timestamp: number;
    latitude: number;
    longitude: number;
  } | null>(null);

  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LocationSync] ${message}`, ...args);
      }
    },
    [debug]
  );

  /**
   * Sincroniza la ubicación del usuario con la base de datos.
   * Aplica throttling basado en tiempo y distancia.
   */
  const syncLocation = useCallback(
    async (location: UserLocation) => {
      if (!userId) {
        log('No user ID, skipping sync');
        return;
      }

      const now = Date.now();
      const lastSync = lastSyncRef.current;

      // Verificar throttling por tiempo
      if (lastSync && now - lastSync.timestamp < minUpdateInterval) {
        // Verificar throttling por distancia
        const distance = calculateDistance(
          lastSync.latitude,
          lastSync.longitude,
          location.latitude,
          location.longitude
        );

        if (distance < minDistanceMeters) {
          log(
            `Skipping sync: ${distance.toFixed(1)}m moved, ${(
              (now - lastSync.timestamp) /
              1000
            ).toFixed(1)}s elapsed`
          );
          return;
        }
      }

      try {
        log('Syncing location:', {
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
        });

        const { error } = await supabase.from('user_locations').upsert(
          {
            user_id: userId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            heading: location.heading,
            speed: location.speed,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

        if (error) {
          console.error('[LocationSync] Error syncing location:', error);
          return;
        }

        lastSyncRef.current = {
          timestamp: now,
          latitude: location.latitude,
          longitude: location.longitude,
        };

        log('Location synced successfully');
      } catch (err) {
        console.error('[LocationSync] Unexpected error:', err);
      }
    },
    [userId, minUpdateInterval, minDistanceMeters, log]
  );

  /**
   * Elimina la ubicación del usuario de la base de datos.
   * Útil al cerrar sesión o detener el tracking.
   */
  const clearUserLocation = useCallback(async () => {
    if (!userId) return;

    try {
      log('Clearing user location');

      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[LocationSync] Error clearing location:', error);
        return;
      }

      lastSyncRef.current = null;
      log('Location cleared successfully');
    } catch (err) {
      console.error('[LocationSync] Unexpected error clearing location:', err);
    }
  }, [userId, log]);

  // Limpiar ubicación al desmontar si hay usuario
  useEffect(() => {
    return () => {
      // No limpiar automáticamente al desmontar para mantener
      // la última ubicación conocida del usuario
    };
  }, []);

  return {
    syncLocation,
    clearUserLocation,
  };
}

export type { UserLocation };
