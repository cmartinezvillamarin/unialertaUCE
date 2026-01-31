import { useState, useMemo, useCallback } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { DataTableComplete } from '@/components/ui/data-table-complete';
import { useOptimizedCategories, Category } from '@/hooks/entidades/useOptimizedCategories';
import { useOptimizedTipoReportes } from '@/hooks/entidades/useOptimizedTipoReportes';
import { useEntityPermissions } from '@/hooks/controlador/useEntityPermissions';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import { DependencyDeleteDialog, DependencyInfo, ReassignOption } from '@/components/ui/dependency-delete-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { transitionClasses } from '@/hooks/optimizacion';

interface CategoriasTableProps {
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  selectedRows?: Category[];
  onSelectionChange?: (rows: Category[]) => void;
}

export function CategoriasTable({ onEdit, onDelete, selectedRows = [], onSelectionChange }: CategoriasTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, toggleStatus, remove } = useOptimizedCategories();
  const { data: tipoReportes } = useOptimizedTipoReportes();
  const { canEdit, canDelete, canToggleStatus } = useEntityPermissions({ entityKey: 'categorias' });
  const { confirm, ConfirmationDialog } = useConfirmation();

  // Estado para el diálogo de dependencias
  const [dependencyDialog, setDependencyDialog] = useState<{
    open: boolean;
    category: Category | null;
    dependencies: DependencyInfo[];
    reassignOptions: ReassignOption[];
  }>({ open: false, category: null, dependencies: [], reassignOptions: [] });

  const handleViewDetails = (category: Category) => {
    navigate(`/categorias/${category.id}`);
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (value, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className={cn(
            "text-primary hover:text-primary/80 hover:underline font-medium text-left",
            transitionClasses.fast
          )}
        >
          {String(value)}
        </button>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      type: 'text',
    },
    {
      key: 'icono',
      header: 'Icono',
      type: 'icon',
    },
    {
      key: 'color',
      header: 'Color',
      type: 'color',
    },
    // Solo mostrar columna de estado si tiene permiso de edición
    ...(canToggleStatus ? [{
      key: 'activo' as keyof Category,
      header: 'Estado',
      type: 'status' as const,
    }] : []),
    {
      key: 'created_at',
      header: 'Fecha de Creación',
      type: 'date',
    },
  ];

  const handleStatusToggle = async (row: Category, newStatus: boolean) => {
    if (!canToggleStatus) {
      toast.error('No tienes permiso para cambiar el estado');
      return;
    }
    try {
      await toggleStatus(row.id, row.activo);
      toast.success(`Categoría ${newStatus ? 'activada' : 'desactivada'}`);
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  // Verificar dependencias antes de eliminar
  const checkDependencies = useCallback((category: Category): DependencyInfo[] => {
    const relatedTipos = tipoReportes.filter(tr => tr.category_id === category.id && !tr.deleted_at);
    const dependencies: DependencyInfo[] = [];
    
    if (relatedTipos.length > 0) {
      dependencies.push({
        type: 'tipos_reporte',
        count: relatedTipos.length,
        label: `tipo${relatedTipos.length !== 1 ? 's' : ''} de reporte`,
      });
    }
    
    return dependencies;
  }, [tipoReportes]);

  // Obtener opciones de reasignación (otras categorías activas)
  const getReassignOptions = useCallback((excludeId: string): ReassignOption[] => {
    return data
      .filter(cat => cat.id !== excludeId && cat.activo && !cat.deleted_at)
      .map(cat => ({ id: cat.id, nombre: cat.nombre }));
  }, [data]);

  // Reasignar tipos de reporte a otra categoría
  const reassignTiposReporte = async (fromCategoryId: string, toCategoryId: string) => {
    const { error } = await supabase
      .from('tipo_categories')
      .update({ category_id: toCategoryId })
      .eq('category_id', fromCategoryId)
      .is('deleted_at', null);

    if (error) throw error;
  };

  const handleDelete = async (row: Category) => {
    const dependencies = checkDependencies(row);
    
    if (dependencies.length > 0) {
      // Hay dependencias, mostrar diálogo especial
      setDependencyDialog({
        open: true,
        category: row,
        dependencies,
        reassignOptions: getReassignOptions(row.id),
      });
    } else {
      // Sin dependencias, confirmar eliminación normal
      const confirmed = await confirm({
        title: '¿Eliminar categoría?',
        description: `Esta acción eliminará la categoría "${row.nombre}". Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        variant: 'destructive',
      });

      if (!confirmed) return;

      if (onDelete) {
        onDelete(row);
      } else {
        try {
          await remove(row.id);
          toast.success('Categoría eliminada correctamente');
        } catch (error) {
          toast.error('Error al eliminar la categoría');
        }
      }
    }
  };

  // Handler para eliminar sin reasignar
  const handleDeleteOnly = async () => {
    if (!dependencyDialog.category) return;
    
    try {
      await remove(dependencyDialog.category.id);
      await queryClient.invalidateQueries({ queryKey: ['tipoReportes'] });
      toast.success('Categoría eliminada. Los tipos de reporte quedan sin categoría.');
      setDependencyDialog({ open: false, category: null, dependencies: [], reassignOptions: [] });
    } catch (error) {
      toast.error('Error al eliminar la categoría');
    }
  };

  // Handler para reasignar y eliminar
  const handleReassignAndDelete = async (targetCategoryId: string) => {
    if (!dependencyDialog.category) return;
    
    try {
      // Primero reasignar
      await reassignTiposReporte(dependencyDialog.category.id, targetCategoryId);
      // Luego eliminar
      await remove(dependencyDialog.category.id);
      await queryClient.invalidateQueries({ queryKey: ['tipoReportes'] });
      
      const targetCategory = data.find(c => c.id === targetCategoryId);
      toast.success(`Tipos de reporte reasignados a "${targetCategory?.nombre}" y categoría eliminada.`);
      setDependencyDialog({ open: false, category: null, dependencies: [], reassignOptions: [] });
    } catch (error) {
      toast.error('Error al reasignar y eliminar');
    }
  };

  // Construir acciones según permisos
  const actions: DataTableAction<Category>[] = [];

  if (canEdit) {
    actions.push({
      label: 'Editar',
      onClick: (row) => onEdit?.(row),
      icon: <Edit className="h-4 w-4" />,
    });
  }

  if (canDelete) {
    actions.push({
      label: 'Eliminar',
      onClick: handleDelete,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
    });
  }

  return (
    <>
      <DataTableComplete
        data={data}
        columns={columns}
        actions={actions.length > 0 ? actions : undefined}
        isLoading={isLoading}
        onStatusToggle={canToggleStatus ? handleStatusToggle : undefined}
        emptyMessage="No hay categorías registradas"
        getRowId={(row) => row.id}
        searchPlaceholder="Buscar categorías..."
        exportFileName="categorias"
        selectedRows={selectedRows}
        onSelectionChange={onSelectionChange}
      />
      {ConfirmationDialog}
      
      {/* Diálogo de dependencias */}
      <DependencyDeleteDialog
        open={dependencyDialog.open}
        onOpenChange={(open) => !open && setDependencyDialog({ open: false, category: null, dependencies: [], reassignOptions: [] })}
        itemName={dependencyDialog.category?.nombre || ''}
        entityType="categoría"
        dependencies={dependencyDialog.dependencies}
        reassignOptions={dependencyDialog.reassignOptions}
        reassignLabel="Mover tipos de reporte a:"
        onDeleteOnly={handleDeleteOnly}
        onReassignAndDelete={handleReassignAndDelete}
      />
    </>
  );
}
