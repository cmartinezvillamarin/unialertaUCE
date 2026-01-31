import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserDataReady } from '@/hooks/entidades/useUserDataReady';
import type { Database } from '@/integrations/supabase/types';
import type { BulkProgressState } from '@/components/ui/bulk-progress-dialog';

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

export interface ScalableBulkActionConfig {
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
  /** Usar RPC optimizado para bulk delete (recomendado para +100 items) */
  useOptimizedBulkDelete?: boolean;
}

export interface BulkDeleteResult {
  success: boolean;
  deleted_count: number;
  failed_count: number;
  error?: string;
}

export interface ScalableBulkActionsResult<T> {
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
  
  // Acciones bulk optimizadas
  bulkDelete: () => Promise<BulkDeleteResult>;
  bulkToggleStatus: (newStatus: boolean) => Promise<void>;
  bulkChangeStatus: (status: string) => Promise<void>;
  bulkAssign: (userId: string | null) => Promise<void>;
  bulkChangeCategory: (categoryId: string) => Promise<void>;
  bulkChangeType: (typeId: string) => Promise<void>;
  
  // Estado
  isProcessing: boolean;
  
  // Estado de progreso para UI
  progressState: BulkProgressState;
  showProgress: boolean;
  setShowProgress: (show: boolean) => void;
  
  // Permisos
  canEdit: boolean;
  canDelete: boolean;
  checkPermission: (permission: UserPermission) => boolean;
}

/**
 * Hook controlador ESCALABLE para acciones bulk
 * Usa RPC admin_bulk_soft_delete para eliminar +1000 registros eficientemente
 * (1 llamada RPC en lugar de N llamadas individuales)
 */
export function useScalableBulkActions<T extends { id: string }>(
  items: T[],
  config: ScalableBulkActionConfig
): ScalableBulkActionsResult<T> {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressState, setProgressState] = useState<BulkProgressState>({
    status: 'idle',
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
  });
  
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
    useOptimizedBulkDelete = true, // Por defecto usar RPC optimizado
  } = config;

  // Verificar permisos
  const checkPermission = useCallback((permission: UserPermission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  const canEdit = useMemo(() => {
    if (!permissions?.edit) return true;
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
    setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((allItems: T[]) => {
    setSelectedIds(allItems.map(item => item.id));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const toggleAll = useCallback((allItems: T[]) => {
    setSelectedIds(prev => 
      prev.length === allItems.length ? [] : allItems.map(item => item.id)
    );
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

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

  // Helper para actualizar progreso
  const updateProgress = useCallback((updates: Partial<BulkProgressState>) => {
    setProgressState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Bulk Delete OPTIMIZADO usando RPC
   * Una sola llamada para eliminar N registros
   */
  const bulkDelete = useCallback(async (): Promise<BulkDeleteResult> => {
    if (selectedIds.length === 0) {
      return { success: false, deleted_count: 0, failed_count: 0 };
    }

    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: 'Eliminando elementos...',
    });
    
    try {
      if (hasSoftDelete && useOptimizedBulkDelete) {
        // ✅ USAR RPC OPTIMIZADO - Una sola llamada para N registros
        const { data, error } = await supabase.rpc('admin_bulk_soft_delete', {
          p_table_name: tableName,
          p_ids: selectedIds,
        });

        if (error) throw error;

        const result = data as unknown as BulkDeleteResult;
        
        await invalidateQueries();
        setSelectedIds([]);

        updateProgress({
          status: result.failed_count > 0 ? (result.deleted_count > 0 ? 'partial' : 'error') : 'completed',
          processed: total,
          successful: result.deleted_count,
          failed: result.failed_count,
          currentAction: undefined,
        });

        if (result.deleted_count > 0) {
          toast.success(`${result.deleted_count} elemento(s) eliminado(s) correctamente`);
        }

        if (result.failed_count > 0) {
          toast.error(result.error || `${result.failed_count} elemento(s) no se pudieron eliminar`);
        }

        return result;
      } else if (hasSoftDelete) {
        // Fallback: eliminar uno por uno (para tablas sin soporte de RPC)
        const now = new Date().toISOString();
        let successCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < selectedIds.length; i++) {
          const id = selectedIds[i];
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
              .from(tableName)
              .update({ deleted_at: now, updated_at: now })
              .eq('id', id)
              .is('deleted_at', null);
            
            if (error) throw error;
            successCount++;
          } catch {
            failedCount++;
          }
          
          updateProgress({
            processed: i + 1,
            successful: successCount,
            failed: failedCount,
            currentAction: `Eliminando ${i + 1} de ${total}...`,
          });
        }

        await invalidateQueries();
        setSelectedIds([]);

        updateProgress({
          status: failedCount > 0 ? (successCount > 0 ? 'partial' : 'error') : 'completed',
          processed: total,
          successful: successCount,
          failed: failedCount,
          currentAction: undefined,
        });

        if (successCount > 0) {
          toast.success(`${successCount} elemento(s) eliminado(s)`);
        }

        if (failedCount > 0) {
          toast.error(`${failedCount} elemento(s) fallaron`);
        }

        return { success: successCount > 0, deleted_count: successCount, failed_count: failedCount };
      } else {
        // Hard delete con .in() - una sola query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .delete()
          .in('id', selectedIds);

        if (error) throw error;

        await invalidateQueries();
        const count = selectedIds.length;
        setSelectedIds([]);

        updateProgress({
          status: 'completed',
          processed: total,
          successful: count,
          failed: 0,
          currentAction: undefined,
        });

        toast.success(`${count} elemento(s) eliminado(s)`);

        return { success: true, deleted_count: count, failed_count: 0 };
      }
    } catch (error) {
      console.error('[useScalableBulkActions] Error en bulkDelete:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudieron eliminar los elementos seleccionados.',
      });
      toast.error('No se pudieron eliminar los elementos seleccionados');
      return { success: false, deleted_count: 0, failed_count: selectedIds.length };
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, hasSoftDelete, useOptimizedBulkDelete, invalidateQueries, updateProgress]);

  // Bulk Toggle Status - usa .in() para una sola query
  const bulkToggleStatus = useCallback(async (newStatus: boolean) => {
    if (selectedIds.length === 0) return;
    
    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: `${newStatus ? 'Activando' : 'Desactivando'} elementos...`,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ 
          [statusColumn]: newStatus,
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      updateProgress({
        status: 'completed',
        processed: total,
        successful: total,
        failed: 0,
        currentAction: undefined,
      });

      toast.success(`${total} elemento(s) ${newStatus ? 'activado(s)' : 'desactivado(s)'}`);
    } catch (error) {
      console.error('[useScalableBulkActions] Error en bulkToggleStatus:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudo actualizar el estado.',
      });
      toast.error('No se pudo actualizar el estado');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, statusColumn, invalidateQueries, updateProgress]);

  // Bulk Change Status (para enums)
  const bulkChangeStatus = useCallback(async (status: string) => {
    if (selectedIds.length === 0) return;
    
    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: `Cambiando estado a "${status}"...`,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      updateProgress({
        status: 'completed',
        processed: total,
        successful: total,
        failed: 0,
        currentAction: undefined,
      });

      toast.success(`${total} elemento(s) actualizado(s) a "${status}"`);
    } catch (error) {
      console.error('[useScalableBulkActions] Error:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudo cambiar el estado.',
      });
      toast.error('No se pudo cambiar el estado');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, invalidateQueries, updateProgress]);

  // Bulk Assign
  const bulkAssign = useCallback(async (userId: string | null) => {
    if (selectedIds.length === 0) return;
    
    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: userId ? 'Asignando elementos...' : 'Quitando asignaciones...',
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ [assignColumn]: userId, updated_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      updateProgress({
        status: 'completed',
        processed: total,
        successful: total,
        failed: 0,
        currentAction: undefined,
      });

      toast.success(userId 
        ? `${total} elemento(s) asignado(s)`
        : `${total} elemento(s) desasignado(s)`
      );
    } catch (error) {
      console.error('[useScalableBulkActions] Error:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudo realizar la asignación.',
      });
      toast.error('No se pudo realizar la asignación');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, assignColumn, invalidateQueries, updateProgress]);

  // Bulk Change Category
  const bulkChangeCategory = useCallback(async (categoryId: string) => {
    if (selectedIds.length === 0) return;
    
    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: 'Cambiando categoría...',
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ [categoryColumn]: categoryId, updated_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      updateProgress({
        status: 'completed',
        processed: total,
        successful: total,
        failed: 0,
        currentAction: undefined,
      });

      toast.success(`${total} elemento(s) actualizado(s)`);
    } catch (error) {
      console.error('[useScalableBulkActions] Error:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudo cambiar la categoría.',
      });
      toast.error('No se pudo cambiar la categoría');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, categoryColumn, invalidateQueries, updateProgress]);

  // Bulk Change Type
  const bulkChangeType = useCallback(async (typeId: string) => {
    if (selectedIds.length === 0) return;
    
    const total = selectedIds.length;
    setIsProcessing(true);
    setShowProgress(true);
    updateProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: 'Cambiando tipo...',
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ [typeColumn]: typeId, updated_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      await invalidateQueries();
      setSelectedIds([]);
      
      updateProgress({
        status: 'completed',
        processed: total,
        successful: total,
        failed: 0,
        currentAction: undefined,
      });

      toast.success(`${total} elemento(s) actualizado(s)`);
    } catch (error) {
      console.error('[useScalableBulkActions] Error:', error);
      updateProgress({
        status: 'error',
        errorMessage: 'No se pudo cambiar el tipo.',
      });
      toast.error('No se pudo cambiar el tipo');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tableName, typeColumn, invalidateQueries, updateProgress]);

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    isAllSelected,
    hasSelection,
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    toggleAll,
    isSelected,
    setSelectedItems,
    bulkDelete,
    bulkToggleStatus,
    bulkChangeStatus,
    bulkAssign,
    bulkChangeCategory,
    bulkChangeType,
    isProcessing,
    progressState,
    showProgress,
    setShowProgress,
    canEdit,
    canDelete,
    checkPermission,
  };
}
