import React, { memo, useMemo } from 'react';
import { X, Trash2, ToggleLeft, UserCheck, Tag, Layers, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOptimizedComponent } from '@/hooks/optimizacion';
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  /** Permiso requerido para mostrar esta acción */
  requiredPermission?: UserPermission;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
  isProcessing?: boolean;
  className?: string;
  /** Función para verificar permisos */
  checkPermission?: (permission: UserPermission) => boolean;
}

/**
 * Componente universal de barra de acciones bulk
 * Diseñado para usarse con el hook useBulkActions
 */
function BulkActionsBarComponent({
  selectedCount,
  onClear,
  actions,
  isProcessing = false,
  className,
  checkPermission,
}: BulkActionsBarProps) {
  useOptimizedComponent({ selectedCount, actionsCount: actions.length }, { componentName: 'BulkActionsBar' });

  // Filtrar acciones según permisos
  const filteredActions = useMemo(() => {
    if (!checkPermission) return actions;
    
    return actions.filter(action => {
      if (!action.requiredPermission) return true;
      return checkPermission(action.requiredPermission);
    });
  }, [actions, checkPermission]);

  if (selectedCount === 0 || filteredActions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3',
        'bg-muted/50 border border-border rounded-lg',
        'animate-fade-in shadow-sm',
        className
      )}
    >
      {/* Contador y botón limpiar */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isProcessing}
          className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="text-xs">Limpiar</span>
        </Button>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {filteredActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={isProcessing || action.disabled}
            className={cn(
              'gap-1.5 h-8 px-3 text-xs sm:text-sm',
              action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              action.className
            )}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export const BulkActionsBar = memo(BulkActionsBarComponent);

// Iconos predefinidos para acciones comunes
export const BulkActionIcons = {
  delete: <Trash2 className="h-4 w-4" />,
  toggleStatus: <ToggleLeft className="h-4 w-4" />,
  assign: <UserCheck className="h-4 w-4" />,
  category: <Tag className="h-4 w-4" />,
  type: <FileType className="h-4 w-4" />,
  status: <Layers className="h-4 w-4" />,
};

// Helper para crear acciones comunes con soporte de permisos
export function createBulkDeleteAction(
  onDelete: () => void, 
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'delete',
    label: 'Eliminar',
    icon: BulkActionIcons.delete,
    onClick: onDelete,
    variant: 'destructive',
    disabled,
    requiredPermission,
  };
}

export function createBulkToggleStatusAction(
  label: string,
  onToggle: () => void,
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'toggle-status',
    label,
    icon: BulkActionIcons.toggleStatus,
    onClick: onToggle,
    variant: 'outline',
    disabled,
    requiredPermission,
  };
}

export function createBulkAssignAction(
  onAssign: () => void, 
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'assign',
    label: 'Asignar',
    icon: BulkActionIcons.assign,
    onClick: onAssign,
    variant: 'outline',
    disabled,
    requiredPermission,
  };
}

export function createBulkCategoryAction(
  onChangeCategory: () => void, 
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'category',
    label: 'Categoría',
    icon: BulkActionIcons.category,
    onClick: onChangeCategory,
    variant: 'outline',
    disabled,
    requiredPermission,
  };
}

export function createBulkTypeAction(
  onChangeType: () => void, 
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'type',
    label: 'Tipo',
    icon: BulkActionIcons.type,
    onClick: onChangeType,
    variant: 'outline',
    disabled,
    requiredPermission,
  };
}

export function createBulkStatusAction(
  label: string,
  onChangeStatus: () => void,
  disabled?: boolean,
  requiredPermission?: UserPermission
): BulkAction {
  return {
    id: 'status',
    label,
    icon: BulkActionIcons.status,
    onClick: onChangeStatus,
    variant: 'outline',
    disabled,
    requiredPermission,
  };
}
