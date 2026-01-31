import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UpdateUserData {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  estado?: 'activo' | 'bloqueado' | 'eliminado' | 'inactivo';
}

// Keys para localStorage (compartidas con useUserDataReady)
const STORAGE_KEYS = {
  profile: 'user_cache:profile',
  timestamp: 'user_cache:timestamp',
} as const;

// Keys para localStorage de entidades (compartidas con useOptimizedEntityList)
const ENTITY_STORAGE_KEYS = {
  users: 'entity_cache:users',
  usersTimestamp: 'entity_cache:users:timestamp',
} as const;

/**
 * Actualiza el perfil en localStorage
 */
function updateStoredProfile(updatedProfile: Record<string, unknown>): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.profile);
    if (stored) {
      const currentProfile = JSON.parse(stored);
      const newProfile = { ...currentProfile, ...updatedProfile };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(newProfile));
      localStorage.setItem(STORAGE_KEYS.timestamp, JSON.stringify(Date.now()));
    }
  } catch (error) {
    console.warn('Error updating localStorage profile:', error);
  }
}

/**
 * Actualiza la lista de usuarios en localStorage para sincronizar con el caché de entidades
 */
function updateStoredUsersList(userId: string, updates: Record<string, unknown>): void {
  try {
    const stored = localStorage.getItem(ENTITY_STORAGE_KEYS.users);
    if (stored) {
      const usersList = JSON.parse(stored) as unknown[];
      const updatedList = usersList.map((user: any) => 
        user.id === userId ? { ...user, ...updates } : user
      );
      localStorage.setItem(ENTITY_STORAGE_KEYS.users, JSON.stringify(updatedList));
      localStorage.setItem(ENTITY_STORAGE_KEYS.usersTimestamp, JSON.stringify(Date.now()));
    }
  } catch (error) {
    console.warn('Error updating localStorage users list:', error);
  }
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updateUser = async (id: string, data: UpdateUserData) => {
    setLoading(true);
    setError(null);

    // Guardar datos anteriores para rollback
    const previousUsers = queryClient.getQueryData<unknown[]>(['users', {}]);

    // Actualización optimista ANTES de la llamada a la API
    queryClient.setQueryData<unknown[]>(['users', {}], (old) => {
      if (!old) return old;
      return old.map((item: any) => 
        item.id === id ? { ...item, ...data } : item
      );
    });

    // También actualizar localStorage inmediatamente para evitar conflictos con realtime
    updateStoredUsersList(id, data as Record<string, unknown>);

    try {
      const { data: user, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single();

      if (updateError) throw updateError;

      // Obtener el auth user id para actualizar el perfil actual SOLO si es el mismo usuario
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // IMPORTANTE: Solo actualizar el caché del perfil actual si el usuario editado
      // es el mismo que el usuario autenticado (comparar user_id del profile con authUser.id)
      if (authUser?.id && user.user_id === authUser.id) {
        // Actualizar el caché de React Query del perfil actual
        queryClient.setQueryData(['profile', authUser.id], (old: any) => 
          old ? { ...old, ...user } : user
        );
        
        // Actualizar localStorage solo para el usuario actual
        updateStoredProfile(user);
      }

      // Actualizar el caché con los datos reales del servidor
      queryClient.setQueryData<unknown[]>(['users', {}], (old) => {
        if (!old) return old;
        return old.map((item: any) => 
          item.id === id ? { ...item, ...user } : item
        );
      });

      // Actualizar localStorage con datos del servidor
      updateStoredUsersList(id, user as Record<string, unknown>);

      // Invalidar userRolesList por si cambiaron permisos relacionados
      queryClient.invalidateQueries({ queryKey: ['userRolesList'] });

      return { user, error: null };
    } catch (err) {
      // Rollback en caso de error
      if (previousUsers) {
        queryClient.setQueryData(['users', {}], previousUsers);
      }
      
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario';
      setError(message);
      return { user: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { updateUser, loading, error };
}
