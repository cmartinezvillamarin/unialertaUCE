import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserDataReady } from '@/hooks/entidades/useUserDataReady';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

export type BulkActionType = 
  | 'delete'
  | 'toggle_status'
  | 'change_status'
  | 'assign'
  | 'change_category'
  | 'change_type';

/** Mapeo de entidad a permisos requeridos */
export type EntityPermissionMap = {
  view?: UserPermission;
  create?: UserPermission;
  edit?: UserPermission;
  delete?: UserPermission;
};

export interface BulkActionConfig {
  /** Nombre de la tabla en Supabase */
  tableName: string;
  /** Clave de query para invalidar en React Query */
  queryKey: string;
  /** Si usa soft delete */
  hasSoftDelete?: boolean;
  /** Columna de estado (ej: 'activo', 'status') */
  statusColumn?: string;
  /** Columna de usuario asignado */
  assignColumn?: string;
  /** Columna de categoría */
  categoryColumn?: string;
  /** Columna de tipo */
  typeColumn?: string;
  /** Queries adicionales a invalidar */
  relatedQueryKeys?: string[];
  /** Permisos requeridos para cada acción */
  permissions?: EntityPermissionMap;
}

export interface BulkActionsResult<T> {
  // Estado de selección
  selectedIds: string[];
  selectedItems: T[];
  selectedCount: number;
  isAllSelected: boolean;
  hasSelection: boolean;
  
  // Acciones de selección
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  toggleAll: (items: T[]) => void;
  isSelected: (id: string) => boolean;
  setSelectedItems: (items: T[]) => void;
  
  // Acciones bulk
  bulkDelete: () => Promise<void>;
  bulkToggleStatus: (newStatus: boolean) => Promise<void>;
  bulkChangeStatus: (status: string) => Promise<void>;
  bulkAssign: (userId: string | null) => Promise<void>;
  bulkChangeCategory: (categoryId: string) => Promise<void>;
  bulkChangeType: (typeId: string) => Promise<void>;
  
  // Estado
  isProcessing: boolean;
  
  // Permisos
  canEdit: boolean;
  canDelete: boolean;
  checkPermission: (permission: UserPermission) => boolean;
}

/**
 * Hook controlador para acciones bulk en listas de entidades
 * Sigue el patrón de hooks de controlador del proyecto
 */
export function useBulkActions<T extends { id: string }>(
  items: T[],
  config: BulkActionConfig
): BulkActionsResult<T> {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Obtener permisos del usuario
  const { hasPermission } = useUserDataReady();

  const {
    tableName,
    queryKey,
    hasSoftDelete = true,
    statusColumn = 'activo',
    assignColumn = 'assigned_to',
    categoryColumn = 'categoria_id',
    typeColumn = 'tipo_reporte_id',
    relatedQueryKeys = [],
    permissions,
  } = config;

  // Verificar permisos
  const checkPermission = useCallback((permission: UserPermission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const canEdit = useMemo(() => {
    if (!permissions?.edit) return true; // Si no se define permiso, permitir por defecto
    return hasPermission(permissions.edit);
  }, [permissions?.edit, hasPermission]);

  const canDelete = useMemo(() => {
    if (!permissions?.delete) return true;
    return hasPermission(permissions.delete);
  }, [permissions?.delete, hasPermission]);

  // Memoizar items seleccionados
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;
  const isAllSelected = items.length > 0 && selectedCount === items.length;

  // Acciones de selección
  const select = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  }, []);

  const selectAll = useCallback((allItems: T[]) => {
    setSelectedIds(allItems.map(item => item.id));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleAll = useCallback((allItems: T[]) => {
    if (selectedIds.length === allItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allItems.map(item => item.id));
    }
  }, [selectedIds.length]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  // Establecer items seleccionados directamente (para sincronización con tabla)
  const setSelectedItems = useCallback((newItems: T[]) => {
    setSelectedIds(newItems.map(item => item.id));
  }, []);

  // Invalidar queries relacionadas
  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [queryKey] }),
      ...relatedQueryKeys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ),
    ]);
  }, [queryClient, queryKey, relatedQueryKeys]);

  // Bulk Delete
  const bulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      if (hasSoftDelete) {
        // Nota: un UPDATE con .in(...) puede fallar completo si alguna fila no pasa RLS.
        // Para evitar “todo o nada”, procesamos por fila y reportamos éxitos/parciales.
        const now = new Date().toISOString();

        const results = await Promise.allSettled(
          selectedIds.map(async (id) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from(tableName)
              .update({
                deleted_at: now,
                status: 'eliminado', // Establecer estado explícito
                [assignColumn]: null, // Liberar asignación
                updated_at: now,
              })
              .eq('id', id)
              .is('deleted_at', null);

            if (error) throw error;
            return id;
          })
        );

        const successIds = results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
          .map((r) => r.value);

        const failed = results.filter((r) => r.status === 'rejected');

        if (successIds.length === 0) {
          throw failed[0]?.reason ?? new Error('No se pudieron eliminar los elementos seleccionados.');
        }

        await invalidateQueries();
        setSelectedIds([]);

        toast({
          title: 'Eliminación exitosa',
          description: `${successIds.length} elemento(s) eliminado(s) correctamente.`,
        });

        if (failed.length > 0) {
          toast({
            title: 'Algunos elementos no se pudieron eliminar',
            description: `${failed.length} elemento(s) fueron rechazados por permisos/reglas de seguridad.`,
            variant: 'destructive',
          });
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .delete()
          .in('id', selectedIds);

        if (error) throw error;

        await invalidateQueries();
        setSelectedIds([]);

        toast({
          title: 'Eliminación exitosa',
          description: `${selectedIds.length} elemento(s) eliminado(s) correctamente.`,
        });
      }
    } catch (error) {
      console.error('[useBulkActions] Error en bulkDelete:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los elementos seleccionados.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, hasSoftDelete, invalidateQueries]);

  // Bulk Toggle Status
  const bulkToggleStatus = useCallback(async (newStatus: boolean) => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Preparar la actualización
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { 
        [statusColumn]: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      // Si se desactiva, desasignar usuario para mantener consistencia
      if (!newStatus) {
        updateData[assignColumn] = null;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update(updateData)
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      toast({
        title: 'Estado actualizado',
        description: `${selectedIds.length} elemento(s) ${newStatus ? 'activado(s)' : 'desactivado(s)'}.`,
      });
    } catch (error) {
      console.error('[useBulkActions] Error en bulkToggleStatus:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, statusColumn, assignColumn, invalidateQueries]);

  // Bulk Change Status (para enums como report_status)
  // Estados finales que requieren desasignar el usuario
  const TERMINAL_STATUSES = ['resuelto', 'rechazado', 'cancelado', 'eliminado'];
  
  const bulkChangeStatus = useCallback(async (status: string) => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Determinar si el estado es terminal (requiere desasignar y desactivar)
      const isTerminalStatus = TERMINAL_STATUSES.includes(status);
      
      // Preparar la actualización
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { 
        status,
        updated_at: new Date().toISOString(),
      };
      
      // Si es un estado terminal, desasignar usuario y desactivar
      if (isTerminalStatus) {
        updateData[assignColumn] = null; // Desasignar
        updateData[statusColumn] = false; // Desactivar (activo = false)
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update(updateData)
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      toast({
        title: 'Estado actualizado',
        description: `${selectedIds.length} elemento(s) actualizado(s) a "${status}".`,
      });
    } catch (error) {
      console.error('[useBulkActions] Error en bulkChangeStatus:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, assignColumn, statusColumn, invalidateQueries]);

  // Bulk Assign
  // Al asignar un usuario → status = 'en_progreso'
  // Al desasignar (userId = null) → status = 'pendiente'
  const bulkAssign = useCallback(async (userId: string | null) => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Derivar el status automáticamente basado en la asignación
      const derivedStatus = userId ? 'en_progreso' : 'pendiente';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ 
          [assignColumn]: userId,
          status: derivedStatus, // Actualizar status según asignación
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      toast({
        title: 'Asignación actualizada',
        description: userId 
          ? `${selectedIds.length} elemento(s) asignado(s) y marcado(s) como "En Progreso".`
          : `${selectedIds.length} elemento(s) desasignado(s) y marcado(s) como "Pendiente".`,
      });
    } catch (error) {
      console.error('[useBulkActions] Error en bulkAssign:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la asignación.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, assignColumn, invalidateQueries]);

  // Bulk Change Category
  const bulkChangeCategory = useCallback(async (categoryId: string) => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ 
          [categoryColumn]: categoryId,
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      toast({
        title: 'Categoría actualizada',
        description: `${selectedIds.length} elemento(s) actualizado(s).`,
      });
    } catch (error) {
      console.error('[useBulkActions] Error en bulkChangeCategory:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la categoría.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, categoryColumn, invalidateQueries]);

  // Bulk Change Type
  const bulkChangeType = useCallback(async (typeId: string) => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ 
          [typeColumn]: typeId,
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      toast({
        title: 'Tipo actualizado',
        description: `${selectedIds.length} elemento(s) actualizado(s).`,
      });
    } catch (error) {
      console.error('[useBulkActions] Error en bulkChangeType:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el tipo.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, typeColumn, invalidateQueries]);

  return {
    // Estado de selección
    selectedIds,
    selectedItems,
    selectedCount,
    isAllSelected,
    hasSelection,
    
    // Acciones de selección
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    toggleAll,
    isSelected,
    setSelectedItems,
    
    // Acciones bulk
    bulkDelete,
    bulkToggleStatus,
    bulkChangeStatus,
    bulkAssign,
    bulkChangeCategory,
    bulkChangeType,
    
    // Estado
    isProcessing,
    
    // Permisos
    canEdit,
    canDelete,
    checkPermission,
  };
}
