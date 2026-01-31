import { useMemo } from 'react';
import { useMenuVisibility } from './useMenuVisibility';
import { useUserDataReady } from '@/hooks/entidades';
import { hasRole } from '@/hooks/entidades/useOptimizedUserRoles';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];
type UserRole = Database['public']['Enums']['user_role'];

// Roles que pueden hacer carga masiva de reportes
const BULK_UPLOAD_ROLES: UserRole[] = [
  'super_admin',
  'administrador', 
  'mantenimiento',
  'operador_analista',
  'seguridad_uce',
];

/**
 * Mapeo de entidades a sus permisos correspondientes
 */
const entityPermissionMap: Record<string, {
  ver: UserPermission;
  crear: UserPermission;
  editar: UserPermission;
  eliminar: UserPermission;
}> = {
  'tipo-reportes': {
    ver: 'ver_estado',
    crear: 'crear_estado',
    editar: 'editar_estado',
    eliminar: 'eliminar_estado',
  },
  'categorias': {
    ver: 'ver_categoria',
    crear: 'crear_categoria',
    editar: 'editar_categoria',
    eliminar: 'eliminar_categoria',
  },
  'usuarios': {
    ver: 'ver_usuario',
    crear: 'crear_usuario',
    editar: 'editar_usuario',
    eliminar: 'eliminar_usuario',
  },
  'reportes': {
    ver: 'ver_reporte',
    crear: 'crear_reporte',
    editar: 'editar_reporte',
    eliminar: 'eliminar_reporte',
  },
  // Mis Reportes usa los mismos permisos que reportes
  'mis-reportes': {
    ver: 'ver_reporte',
    crear: 'crear_reporte',
    editar: 'editar_reporte',
    eliminar: 'eliminar_reporte',
  },
};

interface UseEntityPermissionsOptions {
  entityKey: string;
  /** ID del usuario dueño del registro (user_id del registro) - solo para canView */
  ownerId?: string;
}

/**
 * Hook para determinar permisos de una entidad específica
 * Usa useUserDataReady para obtener los roles de forma estable
 * 
 * Lógica de permisos:
 * - canView: Si tiene ver_* O es dueño del registro → puede ver
 * - canEdit/canDelete/canToggleStatus: SOLO si tiene el permiso correspondiente (NO por ser dueño)
 * - Si es admin → puede hacer todo
 * 
 * @param options.entityKey - Clave de la entidad (ej: 'tipo-reportes', 'categorias')
 * @param options.ownerId - ID del perfil dueño del registro (opcional, solo para visibilidad)
 */
export function useEntityPermissions({ entityKey, ownerId }: UseEntityPermissionsOptions) {
  // Usar useUserDataReady para obtener los roles de forma estable
  const { userRoles, isReady, profile } = useUserDataReady();
  const { isAdmin, hasPermission } = useMenuVisibility({ userRoles });

  const permissions = entityPermissionMap[entityKey];

  // Verificar si el usuario actual es dueño del registro (solo para visibilidad)
  const isOwner = useMemo(() => {
    if (!profile?.id || !ownerId) return false;
    return profile.id === ownerId;
  }, [profile?.id, ownerId]);

  // canView: tiene permiso ver_* O es dueño
  const canView = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    if (isOwner) return true; // Dueño siempre puede ver su registro
    if (!permissions) return false;
    return hasPermission(permissions.ver);
  }, [isAdmin, isOwner, permissions, hasPermission, isReady]);

  // canCreate: solo con permiso (no afecta ownership)
  const canCreate = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    if (!permissions) return false;
    return hasPermission(permissions.crear);
  }, [isAdmin, permissions, hasPermission, isReady]);

  // canEdit: SOLO con permiso editar_* (ser dueño NO da permiso de editar)
  const canEdit = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    if (!permissions) return false;
    return hasPermission(permissions.editar);
  }, [isAdmin, permissions, hasPermission, isReady]);

  // canDelete: SOLO con permiso eliminar_* (ser dueño NO da permiso de eliminar)
  const canDelete = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    if (!permissions) return false;
    return hasPermission(permissions.eliminar);
  }, [isAdmin, permissions, hasPermission, isReady]);

  // canBulkUpload: Para reportes, tipo-reportes, usuarios y categorias, solo roles específicos; para otras entidades, permiso crear
  const canBulkUpload = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    
    // Para reportes, tipo-reportes, usuarios y categorias, verificar roles específicos
    if (entityKey === 'reportes' || entityKey === 'tipo-reportes' || entityKey === 'usuarios' || entityKey === 'categorias') {
      if (!userRoles) return false;
      return BULK_UPLOAD_ROLES.some(role => hasRole(userRoles, role));
    }
    
    // Para otras entidades, usar permiso crear
    if (!permissions) return false;
    return hasPermission(permissions.crear);
  }, [isAdmin, permissions, hasPermission, isReady, entityKey, userRoles]);

  // canToggleStatus: SOLO con permiso editar_* (ser dueño NO da permiso)
  const canToggleStatus = useMemo(() => {
    if (!isReady) return false;
    if (isAdmin) return true;
    if (!permissions) return false;
    return hasPermission(permissions.editar);
  }, [isAdmin, permissions, hasPermission, isReady]);

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canBulkUpload,
    canToggleStatus,
    isAdmin,
    isOwner,
    isReady,
    permissions,
    currentProfileId: profile?.id,
  };
}

export { entityPermissionMap };
