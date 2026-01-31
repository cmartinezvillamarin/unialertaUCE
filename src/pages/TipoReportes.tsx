import { useState, useMemo } from 'react';
import { FileType, ToggleLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntityPageHeader } from '@/components/ui/entity-page-header';
import { TipoReportesTable } from '@/components/table/TipoReportesTable';
import { BulkActionsBar, BulkAction } from '@/components/ui/bulk-actions-bar';
import { BulkActionDialog, useBulkActionDialog, BulkActionItem } from '@/components/ui/bulk-action-dialog';
import { BulkProgressDialog } from '@/components/ui/bulk-progress-dialog';
import { useScalableBulkActions } from '@/hooks/controlador/useScalableBulkActions';
import { useOptimizedTipoReportes, TipoReporte } from '@/hooks/entidades/useOptimizedTipoReportes';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useCategoryCheck } from '@/hooks/controlador';
import { toast } from 'sonner';

export default function TipoReportes() {
  const navigate = useNavigate();

  const {
    checkAndProceed,
    showNoCategoriesDialog,
    setShowNoCategoriesDialog,
    handleCreateCategory,
    handleCancelDialog,
  } = useCategoryCheck({
    onCategoriesAvailable: () => navigate('/tipo-reportes/nuevo'),
    redirectAfterCategory: '/tipo-reportes/nuevo',
  });

  // Obtener datos de tipos de reportes
  const { data: tipoReportes } = useOptimizedTipoReportes();

  // Hook de bulk actions escalable para tipo_categories (+1000 registros)
  const bulkActions = useScalableBulkActions<TipoReporte>(tipoReportes, {
    tableName: 'tipo_categories',
    queryKey: 'tipoReportes',
    hasSoftDelete: true,
    statusColumn: 'activo',
    relatedQueryKeys: ['categories', 'reportes'],
    permissions: {
      edit: 'editar_estado',
      delete: 'eliminar_estado',
    },
    useOptimizedBulkDelete: true,
  });

  // Hook del dialog
  const dialog = useBulkActionDialog();

  const handleCreate = () => {
    checkAndProceed();
  };

  const handleBulkUpload = () => {
    navigate('/tipo-reportes/carga-masiva');
  };

  const handleEdit = (tipo: TipoReporte) => {
    navigate(`/tipo-reportes/${tipo.id}/editar`);
  };

  // Manejar cambio de selección desde la tabla - sincronizar directamente
  const handleSelectionChange = (rows: TipoReporte[]) => {
    bulkActions.setSelectedItems(rows);
  };

  // Convertir items seleccionados para el dialog
  const dialogItems: BulkActionItem[] = useMemo(() => {
    return bulkActions.selectedItems.map(tipo => ({
      id: tipo.id,
      name: tipo.nombre,
      subtitle: tipo.descripcion || undefined,
      status: tipo.activo ? 'Activo' : 'Inactivo',
      statusVariant: tipo.activo ? 'success' : 'secondary' as const,
      icon: tipo.icono || undefined,
    }));
  }, [bulkActions.selectedItems]);

  // Preparar acción de cambiar estado
  const handleOpenChangeStatus = () => {
    dialog.open({
      title: 'Cambiar Estado',
      description: `¿Deseas cambiar el estado de ${bulkActions.selectedCount} tipo(s) de reporte?`,
      items: dialogItems,
      variant: 'warning',
      confirmLabel: 'Cambiar Estado',
      options: [
        { id: 'activar', label: 'Activar', description: 'Los tipos de reporte estarán disponibles' },
        { id: 'desactivar', label: 'Desactivar', description: 'Los tipos de reporte no estarán disponibles' },
      ],
      onConfirm: async (selectedOption) => {
        const newStatus = selectedOption === 'activar';
        await bulkActions.bulkToggleStatus(newStatus);
        dialog.close();
      },
    });
  };

  // Preparar acción de eliminar
  const handleOpenDelete = () => {
    dialog.open({
      title: 'Eliminar Tipos de Reporte',
      description: `¿Estás seguro de eliminar ${bulkActions.selectedCount} tipo(s) de reporte? Esta acción no se puede deshacer.`,
      items: dialogItems,
      variant: 'destructive',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        await bulkActions.bulkDelete();
        dialog.close();
      },
    });
  };

  // Acciones bulk disponibles con permisos
  const actions: BulkAction[] = [
    {
      id: 'change-status',
      label: 'Cambiar Estado',
      icon: <ToggleLeft className="h-4 w-4" />,
      onClick: handleOpenChangeStatus,
      variant: 'outline',
      requiredPermission: 'editar_estado',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleOpenDelete,
      variant: 'destructive',
      requiredPermission: 'eliminar_estado',
    },
  ];

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 md:p-6 w-full max-w-full">
      <EntityPageHeader
        title="Tipos de Reportes"
        description="Administra los tipos de reportes disponibles"
        icon={FileType}
        entityKey="tipo-reportes"
        createButtonText="Nuevo Tipo"
        onCreateClick={handleCreate}
        showBulkUpload={true}
        bulkUploadText="Carga Masiva"
        onBulkUploadClick={handleBulkUpload}
      />

      {/* Barra de acciones bulk */}
      <BulkActionsBar
        selectedCount={bulkActions.selectedCount}
        onClear={bulkActions.deselectAll}
        actions={actions}
        isProcessing={bulkActions.isProcessing}
        checkPermission={bulkActions.checkPermission}
      />

      <TipoReportesTable 
        onEdit={handleEdit}
        selectedRows={bulkActions.selectedItems}
        onSelectionChange={handleSelectionChange}
      />

      {/* Dialog de confirmación bulk */}
      <BulkActionDialog
        open={dialog.isOpen}
        onOpenChange={(open) => !open && dialog.close()}
        title={dialog.config?.title || ''}
        description={dialog.config?.description || ''}
        items={dialog.config?.items || []}
        confirmVariant={dialog.config?.variant}
        confirmLabel={dialog.config?.confirmLabel}
        cancelLabel={dialog.config?.cancelLabel}
        options={dialog.config?.options}
        selectedOption={dialog.selectedOption}
        onOptionChange={dialog.setSelectedOption}
        onConfirm={() => dialog.config?.onConfirm(dialog.selectedOption)}
        onCancel={dialog.close}
        entityLabel="tipos de reporte"
      />

      {/* Dialog de progreso bulk */}
      <BulkProgressDialog
        open={bulkActions.showProgress}
        onOpenChange={bulkActions.setShowProgress}
        title="Procesando Tipos de Reporte"
        progress={bulkActions.progressState}
        entityLabel="tipos de reporte"
        onClose={() => bulkActions.setShowProgress(false)}
      />

      <ConfirmationDialog
        open={showNoCategoriesDialog}
        onOpenChange={setShowNoCategoriesDialog}
        title="No hay categorías disponibles"
        description="Para crear un tipo de reporte, primero debes crear al menos una categoría. ¿Deseas crear una categoría ahora?"
        confirmLabel="Crear Categoría"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleCreateCategory}
        onCancel={handleCancelDialog}
      />
      </div>
    </div>
  );
}