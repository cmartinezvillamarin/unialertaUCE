import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useUserPresence } from '@/hooks/messages/useUserPresence';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export interface NearbyUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  distance: number; // en metros
  roles: UserRole[];
  isOnline: boolean; // usuario con ubicación reciente
  lastSeen: Date; // última actualización de ubicación
  activeHighPriorityCount: number; // reportes urgentes/altos activos asignados
}

interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

// Roles que pueden ser asignados a reportes (según especificación del usuario)
const ASSIGNABLE_ROLES: UserRole[] = [
  'super_admin',
  'administrador',
  'seguridad_uce',
  'operador_analista',
  'mantenimiento',
  'estudiante_personal',
  'usuario_regular',
];

// Prioridad de roles para escalamiento (mayor índice = mayor prioridad para asignación)
const ROLE_PRIORITY: Record<UserRole, number> = {
  super_admin: 100,
  administrador: 90,
  seguridad_uce: 85,
  operador_analista: 80,
  mantenimiento: 70,
  estudiante_personal: 50,
  usuario_regular: 40,
};

// Configuración de geofencing por prioridad
const GEOFENCE_CONFIG: Record<'bajo' | 'medio' | 'alto' | 'urgente', {
  radiusMeters: number;
  maxOnlineAgeMinutes: number;
  maxLocationAgeMinutes: number;
}> = {
  urgente: {
    radiusMeters: 500,        // Radio pequeño para respuesta inmediata
    maxOnlineAgeMinutes: 5,   // Usuario debe haber actualizado hace máx 5 min
    maxLocationAgeMinutes: 15 // Ubicación válida hasta 15 min
  },
  alto: {
    radiusMeters: 750,
    maxOnlineAgeMinutes: 10,
    maxLocationAgeMinutes: 30
  },
  medio: {
    radiusMeters: 1000,
    maxOnlineAgeMinutes: 30,
    maxLocationAgeMinutes: 60
  },
  bajo: {
    radiusMeters: 1500,
    maxOnlineAgeMinutes: 60,
    maxLocationAgeMinutes: 120
  },
};

// Roles preferidos por tipo de incidente (para escalamiento)
const ESCALATION_ORDER: UserRole[] = [
  'seguridad_uce',
  'super_admin',
  'administrador',
  'operador_analista',
  'mantenimiento',
  'estudiante_personal',
  'usuario_regular',
];

/**
 * Calcula la distancia entre dos puntos en metros usando Haversine
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface UseNearbyAssignableUsersOptions {
  currentUserId?: string; // ID del usuario actual para excluirlo (OBLIGATORIO para evitar auto-asignación)
}

export interface UseNearbyAssignableUsersReturn {
  findNearbyUsers: (
    lat: number, 
    lng: number, 
    priority: 'bajo' | 'medio' | 'alto' | 'urgente', 
    excludeUserId?: string
  ) => Promise<NearbyUser[]>;
  selectBestUser: (
    users: NearbyUser[], 
    priority: 'bajo' | 'medio' | 'alto' | 'urgente',
    excludeUserId?: string
  ) => NearbyUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para encontrar usuarios asignables cercanos a una ubicación
 * 
 * REGLAS CRÍTICAS:
 * 1. NUNCA asignar al usuario que crea el reporte
 * 2. Priorizar usuarios ONLINE (ubicación reciente)
 * 3. Usar geofencing dinámico según prioridad
 * 4. Escalar a roles superiores si no hay usuarios disponibles
 */
export function useNearbyAssignableUsers(
  options: UseNearbyAssignableUsersOptions = {}
): UseNearbyAssignableUsersReturn {
  const { currentUserId } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de presencia global (mismo que mensajes)
  const { isUserOnline: isUserOnlineGlobal, onlineUsers } = useUserPresence();

  const findNearbyUsers = useCallback(async (
    lat: number,
    lng: number,
    priority: 'bajo' | 'medio' | 'alto' | 'urgente',
    excludeUserId?: string
  ): Promise<NearbyUser[]> => {
    setIsLoading(true);
    setError(null);

    // CRÍTICO: Determinar qué usuario excluir (el reportante)
    // Priorizar el excludeUserId pasado como parámetro, luego currentUserId del hook
    const userToExclude = excludeUserId || currentUserId;
    
    if (!userToExclude) {
      console.error('[useNearbyAssignableUsers] ¡ADVERTENCIA CRÍTICA! No se proporcionó ID de usuario a excluir.');
      console.error('[useNearbyAssignableUsers] Esto podría causar auto-asignación. Parámetros recibidos:', {
        excludeUserId,
        currentUserId,
      });
    } else {
      console.log('[useNearbyAssignableUsers] Usuario a excluir de asignación:', userToExclude);
    }

    const config = GEOFENCE_CONFIG[priority];
    const now = new Date();

    try {
      // 1. Obtener todas las ubicaciones de usuarios
      const { data: locations, error: locError } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude, updated_at');

      if (locError) throw locError;

      if (!locations || locations.length === 0) {
        console.log('[useNearbyAssignableUsers] No hay ubicaciones registradas');
        return [];
      }
      
      console.log('[useNearbyAssignableUsers] Ubicaciones encontradas:', locations.length);

      // 2. Obtener perfiles de usuarios activos y confirmados
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, name, avatar, estado, confirmed, deleted_at')
        .is('deleted_at', null)
        .eq('estado', 'activo')
        .eq('confirmed', true);

      if (profError) throw profError;

      // 3. Obtener roles de usuarios
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, roles, permisos');

      if (rolesError) throw rolesError;

      // 4. Obtener reportes activos de alta prioridad por usuario
      // Esto nos permite priorizar usuarios sin carga
      const { data: activeReports, error: reportsError } = await supabase
        .from('reportes')
        .select('assigned_to')
        .in('priority', ['urgente', 'alto'])
        .in('status', ['pendiente', 'en_progreso'])
        .eq('activo', true)
        .not('assigned_to', 'is', null);

      if (reportsError) {
        console.warn('[useNearbyAssignableUsers] Error al obtener carga de reportes:', reportsError);
      }

      // Contar reportes activos de alta prioridad por usuario
      const highPriorityCountByUser: Record<string, number> = {};
      if (activeReports) {
        for (const report of activeReports) {
          if (report.assigned_to) {
            highPriorityCountByUser[report.assigned_to] = (highPriorityCountByUser[report.assigned_to] || 0) + 1;
          }
        }
      }
      console.log('[useNearbyAssignableUsers] Carga de reportes alta prioridad:', highPriorityCountByUser);

      // 5. Procesar usuarios
      const nearbyUsers: NearbyUser[] = [];
      let excludedCount = 0;
      let locationTooOldCount = 0;
      let outsideGeofenceCount = 0;

      for (const loc of locations as UserLocation[]) {
        // ⚠️ CRÍTICO: Excluir SIEMPRE al usuario reportante
        // Comparar de forma estricta con ambas fuentes (excludeUserId Y currentUserId)
        const isReporter = (userToExclude && loc.user_id === userToExclude) ||
                          (excludeUserId && loc.user_id === excludeUserId) ||
                          (currentUserId && loc.user_id === currentUserId);
        
        if (isReporter) {
          console.log('[useNearbyAssignableUsers] ✗ Excluyendo usuario reportante:', loc.user_id);
          excludedCount++;
          continue;
        }

        // Verificar antigüedad de ubicación
        const locationAge = now.getTime() - new Date(loc.updated_at).getTime();
        const maxLocationAge = config.maxLocationAgeMinutes * 60 * 1000;
        
        if (locationAge > maxLocationAge) {
          locationTooOldCount++;
          continue; // Ubicación muy antigua
        }

        // Verificar si está "online" usando el sistema de presencia GLOBAL
        // Esto es consistente con el estado de mensajería y GeoTracking
        const isOnline = isUserOnlineGlobal(loc.user_id);

        // Calcular distancia
        const distance = calculateDistance(lat, lng, loc.latitude, loc.longitude);
        
        // Aplicar geofencing según prioridad
        if (distance > config.radiusMeters) {
          outsideGeofenceCount++;
          continue; // Fuera del geofence
        }

        // Buscar perfil
        const profile = profiles?.find(p => p.id === loc.user_id);
        if (!profile) continue;

        // Buscar roles
        const userRole = userRoles?.find(r => r.user_id === loc.user_id);
        if (!userRole?.roles || !userRole?.permisos) continue;

        // Verificar que tenga roles asignables
        const userRolesList = userRole.roles as UserRole[];
        const hasAssignableRole = userRolesList.some(r => ASSIGNABLE_ROLES.includes(r));
        if (!hasAssignableRole) continue;

        // Verificar permiso de editar reportes
        const hasEditPermission = (userRole.permisos as string[]).includes('editar_reporte');
        if (!hasEditPermission) continue;

        // Obtener carga actual de reportes alta prioridad
        const activeHighPriorityCount = highPriorityCountByUser[profile.id] || 0;

        nearbyUsers.push({
          id: profile.id,
          name: profile.name,
          email: null,
          avatar: profile.avatar,
          distance,
          roles: userRolesList,
          isOnline,
          lastSeen: new Date(loc.updated_at),
          activeHighPriorityCount,
        });
      }

      // 6. Ordenar por: online primero, luego por CARGA (menos primero), luego por prioridad de rol, luego por distancia
      nearbyUsers.sort((a, b) => {
        // Primero: usuarios online tienen prioridad
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1;
        }

        // Segundo: usuarios con MENOS carga tienen prioridad
        if (a.activeHighPriorityCount !== b.activeHighPriorityCount) {
          return a.activeHighPriorityCount - b.activeHighPriorityCount;
        }

        // Tercero: por prioridad de rol (descendente)
        const aMaxPriority = Math.max(...a.roles.map(r => ROLE_PRIORITY[r] || 0));
        const bMaxPriority = Math.max(...b.roles.map(r => ROLE_PRIORITY[r] || 0));
        if (bMaxPriority !== aMaxPriority) {
          return bMaxPriority - aMaxPriority;
        }

        // Cuarto: por distancia (ascendente)
        return a.distance - b.distance;
      });

      console.log(`[useNearbyAssignableUsers] Resumen de búsqueda (prioridad: ${priority}):`);
      console.log(`  - Total ubicaciones: ${locations.length}`);
      console.log(`  - Reportante excluido: ${excludedCount}`);
      console.log(`  - Ubicaciones muy antiguas: ${locationTooOldCount}`);
      console.log(`  - Fuera del geofence (${config.radiusMeters}m): ${outsideGeofenceCount}`);
      console.log(`  - Usuarios elegibles encontrados: ${nearbyUsers.length}`);
      if (nearbyUsers.length > 0) {
        console.log(`  - Usuario mejor candidato: ${nearbyUsers[0].name} (carga: ${nearbyUsers[0].activeHighPriorityCount}, online: ${nearbyUsers[0].isOnline})`);
      }
      
      return nearbyUsers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al buscar usuarios cercanos';
      setError(message);
      console.error('[useNearbyAssignableUsers] Error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isUserOnlineGlobal]);

  /**
   * Selecciona el mejor usuario para asignar basado en prioridad y roles
   * 
   * REGLA CRÍTICA: NUNCA retorna al usuario reportante
   */
  const selectBestUser = useCallback((
    users: NearbyUser[],
    priority: 'bajo' | 'medio' | 'alto' | 'urgente',
    excludeUserId?: string
  ): NearbyUser | null => {
    // CRÍTICO: Filtrar usuarios excluyendo al reportante (verificación múltiple)
    // Excluir tanto por excludeUserId como por currentUserId para mayor seguridad
    const idsToExclude = new Set<string>();
    if (excludeUserId) idsToExclude.add(excludeUserId);
    if (currentUserId) idsToExclude.add(currentUserId);
    
    const eligibleUsers = idsToExclude.size > 0
      ? users.filter(u => !idsToExclude.has(u.id))
      : users;

    console.log('[useNearbyAssignableUsers] selectBestUser:', {
      totalUsers: users.length,
      excludedIds: Array.from(idsToExclude),
      eligibleCount: eligibleUsers.length,
    });

    if (!eligibleUsers.length) {
      console.log('[useNearbyAssignableUsers] No hay usuarios elegibles para asignación después de exclusiones');
      return null;
    }

    // Para prioridad urgente o alta, preferir usuarios online con roles de seguridad
    if (priority === 'urgente' || priority === 'alto') {
      // Primero buscar online con rol de seguridad
      const onlineSecurityUser = eligibleUsers.find(
        u => u.isOnline && u.roles.includes('seguridad_uce')
      );
      if (onlineSecurityUser) return onlineSecurityUser;

      // Luego cualquier online con rol admin
      const onlineAdminUser = eligibleUsers.find(
        u => u.isOnline && (u.roles.includes('super_admin') || u.roles.includes('administrador'))
      );
      if (onlineAdminUser) return onlineAdminUser;

      // Luego cualquier online con rol operador
      const onlineOperatorUser = eligibleUsers.find(
        u => u.isOnline && u.roles.includes('operador_analista')
      );
      if (onlineOperatorUser) return onlineOperatorUser;

      // Luego cualquier online con rol de mantenimiento
      const onlineMaintenanceUser = eligibleUsers.find(
        u => u.isOnline && u.roles.includes('mantenimiento')
      );
      if (onlineMaintenanceUser) return onlineMaintenanceUser;
    }

    // Para cualquier prioridad: buscar el usuario online más cercano
    const onlineUsers = eligibleUsers.filter(u => u.isOnline);
    if (onlineUsers.length > 0) {
      // Ya están ordenados por rol y distancia
      return onlineUsers[0];
    }

    // Si no hay usuarios online, escalar según jerarquía de roles
    console.log('[useNearbyAssignableUsers] No hay usuarios online, escalando por jerarquía de roles...');
    
    for (const targetRole of ESCALATION_ORDER) {
      const userWithRole = eligibleUsers.find(u => u.roles.includes(targetRole));
      if (userWithRole) {
        console.log(`[useNearbyAssignableUsers] Escalando a usuario con rol: ${targetRole}`);
        return userWithRole;
      }
    }

    // Fallback: retornar el primero de la lista ordenada (si existe)
    return eligibleUsers[0] || null;
  }, [currentUserId]);

  return {
    findNearbyUsers,
    selectBestUser,
    isLoading,
    error,
  };
}
