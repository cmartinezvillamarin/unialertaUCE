import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CameraCapture } from '@/components/ui/camera-capture';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Image as ImageIcon, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type ResolutionType = 'resolucion' | 'desactivacion' | 'rechazo' | 'reapertura' | 'cambio_estado';

interface ReportResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ResolutionType;
  reportName: string;
  onConfirm: (comentario: string, evidencias: string[]) => Promise<void>;
  requireEvidence?: boolean; // Default true for individual actions
  isBulk?: boolean; // If true, only requires comment
}

const TYPE_CONFIG: Record<ResolutionType, {
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  iconColor: string;
  confirmLabel: string;
  confirmVariant: 'default' | 'destructive' | 'outline';
}> = {
  resolucion: {
    title: 'Marcar como Resuelto',
    description: 'Proporciona evidencias y comentarios que respalden la resolución del reporte.',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    confirmLabel: 'Confirmar Resolución',
    confirmVariant: 'default',
  },
  desactivacion: {
    title: 'Desactivar Reporte',
    description: 'Proporciona evidencias y comentarios que justifiquen la desactivación.',
    icon: XCircle,
    iconColor: 'text-destructive',
    confirmLabel: 'Desactivar',
    confirmVariant: 'destructive',
  },
  rechazo: {
    title: 'Rechazar Reporte',
    description: 'Indica los motivos del rechazo con evidencias de respaldo.',
    icon: XCircle,
    iconColor: 'text-destructive',
    confirmLabel: 'Rechazar',
    confirmVariant: 'destructive',
  },
  reapertura: {
    title: 'Reabrir Reporte',
    description: 'Indica los motivos para reabrir este reporte.',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmLabel: 'Reabrir',
    confirmVariant: 'outline',
  },
  cambio_estado: {
    title: 'Cambiar Estado',
    description: 'Proporciona un comentario que justifique el cambio de estado.',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmLabel: 'Confirmar Cambio',
    confirmVariant: 'default',
  },
};

export function ReportResolutionModal({
  open,
  onOpenChange,
  type,
  reportName,
  onConfirm,
  requireEvidence = true,
  isBulk = false,
}: ReportResolutionModalProps) {
  const [comentario, setComentario] = useState('');
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  // Para acciones masivas solo se requiere comentario
  const effectiveRequireEvidence = isBulk ? false : requireEvidence;

  const isValid = comentario.trim().length >= 10 && 
    (effectiveRequireEvidence ? evidencias.length > 0 : true);

  const handleCameraCapture = useCallback((imageUrl: string) => {
    setEvidencias(prev => [...prev, imageUrl]);
  }, []);

  const handleRemoveEvidence = useCallback((index: number) => {
    setEvidencias(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onConfirm(comentario, evidencias);
      // Reset state
      setComentario('');
      setEvidencias([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming resolution:', error);
      toast.error('Error al procesar la acción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComentario('');
    setEvidencias([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-start gap-3 shrink-0">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-muted"
          )}>
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <DialogTitle className="text-lg font-semibold">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {config.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 overflow-hidden py-4">
          {/* Reporte afectado */}
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
            <span className="text-sm text-muted-foreground">Reporte:</span>
            <Badge variant="outline" className="font-medium">
              {reportName}
            </Badge>
            {isBulk && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Acción masiva
              </Badge>
            )}
          </div>

          {/* Comentario obligatorio */}
          <div className="space-y-2">
            <Label htmlFor="comentario" className="flex items-center gap-2">
              Comentario <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-auto">
                (mínimo 10 caracteres)
              </span>
            </Label>
            <Textarea
              id="comentario"
              placeholder="Describe detalladamente los motivos y acciones realizadas..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <p className={cn(
              "text-xs",
              comentario.length >= 10 ? "text-muted-foreground" : "text-destructive"
            )}>
              {comentario.length}/10 caracteres mínimos
            </p>
          </div>

          {/* Evidencias (solo si se requieren) */}
          {!isBulk && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Evidencias {effectiveRequireEvidence && <span className="text-destructive">*</span>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {effectiveRequireEvidence ? '(obligatorio)' : '(opcional)'}
                </span>
              </Label>
              
              {/* Camera capture button */}
              <div className="flex items-center gap-2">
                <CameraCapture
                  onCapture={handleCameraCapture}
                  buttonText="Capturar Evidencia"
                  buttonVariant="outline"
                  maxFileSize={10485760}
                  allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                  showLimits={false}
                />
                <span className="text-xs text-muted-foreground">
                  {evidencias.length} archivo(s) adjuntado(s)
                </span>
              </div>

              {/* Evidencias preview */}
              {evidencias.length > 0 && (
                <ScrollArea className="h-[120px] rounded-md border p-2">
                  <div className="flex flex-wrap gap-2">
                    {evidencias.map((url, index) => (
                      <div
                        key={index}
                        className="relative group w-20 h-20 rounded-md overflow-hidden border"
                      >
                        <img
                          src={url}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {effectiveRequireEvidence && evidencias.length === 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Se requiere al menos una evidencia
                </p>
              )}
            </div>
          )}

          {isBulk && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
              Para acciones masivas solo se requiere un comentario que aplique a todos los reportes seleccionados.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            variant={config.confirmVariant}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </span>
            ) : (
              config.confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar el modal de forma imperativa
export function useReportResolutionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    type: ResolutionType;
    reportName: string;
    requireEvidence: boolean;
    isBulk: boolean;
    onConfirm: (comentario: string, evidencias: string[]) => Promise<void>;
  } | null>(null);

  const open = useCallback((params: {
    type: ResolutionType;
    reportName: string;
    requireEvidence?: boolean;
    isBulk?: boolean;
    onConfirm: (comentario: string, evidencias: string[]) => Promise<void>;
  }) => {
    setConfig({
      type: params.type,
      reportName: params.reportName,
      requireEvidence: params.requireEvidence ?? true,
      isBulk: params.isBulk ?? false,
      onConfirm: params.onConfirm,
    });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  const Modal = config ? (
    <ReportResolutionModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      type={config.type}
      reportName={config.reportName}
      requireEvidence={config.requireEvidence}
      isBulk={config.isBulk}
      onConfirm={config.onConfirm}
    />
  ) : null;

  return { open, close, Modal };
}
