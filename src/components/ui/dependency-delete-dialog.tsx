import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { transitionClasses } from "@/hooks/optimizacion";

export type DependencyType = 'tipos_reporte' | 'reportes';

export interface DependencyInfo {
  type: DependencyType;
  count: number;
  label: string;
}

export interface ReassignOption {
  id: string;
  nombre: string;
  disabled?: boolean;
}

interface DependencyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nombre del elemento a eliminar */
  itemName: string;
  /** Tipo de entidad (categoría, tipo de reporte) */
  entityType: 'categoría' | 'tipo de reporte';
  /** Dependencias encontradas */
  dependencies: DependencyInfo[];
  /** Opciones para reasignar (otras categorías/tipos disponibles) */
  reassignOptions: ReassignOption[];
  /** Etiqueta para el select de reasignación */
  reassignLabel: string;
  /** Callback cuando se confirma la eliminación sin reasignar */
  onDeleteOnly: () => void | Promise<void>;
  /** Callback cuando se confirma reasignar y eliminar */
  onReassignAndDelete: (targetId: string) => void | Promise<void>;
  /** Callback al cancelar */
  onCancel?: () => void;
  /** Estado de carga */
  isLoading?: boolean;
}

export const DependencyDeleteDialog = React.memo(function DependencyDeleteDialog({
  open,
  onOpenChange,
  itemName,
  entityType,
  dependencies,
  reassignOptions,
  reassignLabel,
  onDeleteOnly,
  onReassignAndDelete,
  onCancel,
  isLoading = false,
}: DependencyDeleteDialogProps) {
  const [selectedTarget, setSelectedTarget] = React.useState<string>("");
  const [isPending, setIsPending] = React.useState(false);
  const [mode, setMode] = React.useState<'choose' | 'reassign' | 'delete'>('choose');

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedTarget("");
      setMode('choose');
    }
  }, [open]);

  const totalDependencies = dependencies.reduce((sum, d) => sum + d.count, 0);
  const loading = isLoading || isPending;

  const handleDeleteOnly = async () => {
    if (loading) return;
    setIsPending(true);
    try {
      await onDeleteOnly();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleReassignAndDelete = async () => {
    if (loading || !selectedTarget) return;
    setIsPending(true);
    try {
      await onReassignAndDelete(selectedTarget);
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  // Vista de selección inicial
  if (mode === 'choose') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={cn("sm:max-w-[500px]", transitionClasses.normal)}>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold">
                {entityType === 'categoría' ? 'Categoría' : 'Tipo de reporte'} con dependencias
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  La {entityType} <strong>"{itemName}"</strong> tiene elementos asociados que serán afectados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {dependencies.map((dep) => (
                    <Badge key={dep.type} variant="secondary" className="text-sm py-1 px-3">
                      {dep.count} {dep.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  ¿Qué deseas hacer con estos {totalDependencies} elemento{totalDependencies !== 1 ? 's' : ''}?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-3 py-4">
            {reassignOptions.length > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => setMode('reassign')}
              >
                <ArrowRight className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Reasignar a otra {entityType}</p>
                  <p className="text-xs text-muted-foreground">
                    Mover los elementos a otra {entityType} antes de eliminar
                  </p>
                </div>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 border-destructive/30 hover:border-destructive hover:bg-destructive/5"
              onClick={() => setMode('delete')}
            >
              <Trash2 className="h-5 w-5 mr-3 text-destructive" />
              <div className="text-left">
                <p className="font-medium text-destructive">Eliminar sin reasignar</p>
                <p className="text-xs text-muted-foreground">
                  Los elementos quedarán sin {entityType} asignada
                </p>
              </div>
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Vista de reasignación
  if (mode === 'reassign') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={cn("sm:max-w-[500px]", transitionClasses.normal)}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Reasignar y eliminar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona la {entityType} destino para mover los {totalDependencies} elemento{totalDependencies !== 1 ? 's' : ''} de <strong>"{itemName}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {reassignLabel}
            </label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Selecciona una ${entityType}`} />
              </SelectTrigger>
              <SelectContent>
                {reassignOptions.map((option) => (
                  <SelectItem 
                    key={option.id} 
                    value={option.id}
                    disabled={option.disabled}
                  >
                    {option.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setMode('choose')} disabled={loading}>
              Atrás
            </Button>
            <AlertDialogCancel onClick={handleCancel} disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReassignAndDelete}
              disabled={loading || !selectedTarget}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Procesando...
                </span>
              ) : (
                'Reasignar y eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Vista de confirmación de eliminación
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("sm:max-w-[450px]", transitionClasses.normal)}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              Confirmar eliminación
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            ¿Estás seguro de eliminar <strong>"{itemName}"</strong>?
            <br /><br />
            Los {totalDependencies} elemento{totalDependencies !== 1 ? 's' : ''} asociados quedarán sin {entityType}.
            <br />
            <strong className="text-destructive">Esta acción no se puede deshacer.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setMode('choose')} disabled={loading}>
            Atrás
          </Button>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteOnly}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Eliminando...
              </span>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// Hook para uso más fácil
interface DependencyCheckResult {
  hasDependencies: boolean;
  dependencies: DependencyInfo[];
}

export function useDependencyCheck() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    itemId: string;
    itemName: string;
    entityType: 'categoría' | 'tipo de reporte';
    dependencies: DependencyInfo[];
    reassignOptions: ReassignOption[];
  } | null>(null);

  const openDialog = React.useCallback((config: {
    itemId: string;
    itemName: string;
    entityType: 'categoría' | 'tipo de reporte';
    dependencies: DependencyInfo[];
    reassignOptions: ReassignOption[];
  }) => {
    setDialogState({ ...config, open: true });
  }, []);

  const closeDialog = React.useCallback(() => {
    setDialogState(null);
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
  };
}
