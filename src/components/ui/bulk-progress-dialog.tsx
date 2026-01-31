import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

export type BulkProgressStatus = 
  | 'idle' 
  | 'processing' 
  | 'completed' 
  | 'partial' 
  | 'error';

export interface BulkProgressState {
  status: BulkProgressStatus;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentAction?: string;
  errorMessage?: string;
}

interface BulkProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  progress: BulkProgressState;
  onClose?: () => void;
  entityLabel?: string;
}

const statusConfig: Record<BulkProgressStatus, {
  icon: React.ReactNode;
  color: string;
  label: string;
}> = {
  idle: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: "text-muted-foreground",
    label: "Preparando...",
  },
  processing: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: "text-primary",
    label: "Procesando...",
  },
  completed: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-500",
    label: "Completado",
  },
  partial: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-amber-500",
    label: "Parcialmente completado",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-destructive",
    label: "Error",
  },
};

export function BulkProgressDialog({
  open,
  onOpenChange,
  title,
  progress,
  onClose,
  entityLabel = "elementos",
}: BulkProgressDialogProps) {
  const { status, total, processed, successful, failed, currentAction, errorMessage } = progress;
  const config = statusConfig[status];
  
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isFinished = status === 'completed' || status === 'partial' || status === 'error';

  const handleClose = React.useCallback(() => {
    onClose?.();
    onOpenChange(false);
  }, [onClose, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={isFinished ? onOpenChange : undefined}>
      <DialogContent 
        className="sm:max-w-[400px]"
        onPointerDownOutside={(e) => !isFinished && e.preventDefault()}
        onEscapeKeyDown={(e) => !isFinished && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            {title}
          </DialogTitle>
          <DialogDescription>
            {currentAction || config.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress 
              value={percentage} 
              className={cn(
                "h-2 transition-all duration-300",
                status === 'error' && "[&>div]:bg-destructive",
                status === 'partial' && "[&>div]:bg-amber-500",
                status === 'completed' && "[&>div]:bg-green-500"
              )}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/10">
              <span className="text-2xl font-bold text-green-600">{successful}</span>
              <span className="text-xs text-muted-foreground">Exitosos</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10">
              <span className="text-2xl font-bold text-destructive">{failed}</span>
              <span className="text-xs text-muted-foreground">Fallidos</span>
            </div>
          </div>

          {/* Processing indicator */}
          {status === 'processing' && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-sm text-muted-foreground">
                Procesando {processed} de {total} {entityLabel}...
              </span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {/* Result badges */}
          {isFinished && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {successful > 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {successful} exitoso{successful !== 1 ? 's' : ''}
                </Badge>
              )}
              {failed > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  {failed} fallido{failed !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isFinished && (
          <div className="flex justify-end">
            <Button onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para manejar el estado del progreso bulk
 */
export function useBulkProgress() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [progress, setProgress] = React.useState<BulkProgressState>({
    status: 'idle',
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
  });

  const start = React.useCallback((total: number, action?: string) => {
    setProgress({
      status: 'processing',
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentAction: action,
    });
    setIsOpen(true);
  }, []);

  const updateProgress = React.useCallback((
    processed: number,
    successful: number,
    failed: number,
    action?: string
  ) => {
    setProgress(prev => ({
      ...prev,
      processed,
      successful,
      failed,
      currentAction: action,
    }));
  }, []);

  const complete = React.useCallback((successful: number, failed: number) => {
    setProgress(prev => ({
      ...prev,
      status: failed > 0 
        ? (successful > 0 ? 'partial' : 'error') 
        : 'completed',
      processed: prev.total,
      successful,
      failed,
      currentAction: undefined,
    }));
  }, []);

  const error = React.useCallback((message: string) => {
    setProgress(prev => ({
      ...prev,
      status: 'error',
      errorMessage: message,
    }));
  }, []);

  const reset = React.useCallback(() => {
    setProgress({
      status: 'idle',
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
    });
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    progress,
    start,
    updateProgress,
    complete,
    error,
    reset,
  };
}
