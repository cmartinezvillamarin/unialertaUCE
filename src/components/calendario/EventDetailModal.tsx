import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Trash2, Link2 } from 'lucide-react';
import { Evento } from '@/hooks/entidades/useEventos';

interface EventDetailModalProps {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export function EventDetailModal({ evento, open, onClose, onDelete, canDelete }: EventDetailModalProps) {
  if (!evento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: evento.color || 'hsl(var(--primary))' }} />
            <DialogTitle>{evento.titulo}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {evento.descripcion && (
            <p className="text-sm text-muted-foreground">{evento.descripcion}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(evento.fecha_inicio), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </span>
            </div>
            {evento.fecha_fin && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Hasta {format(new Date(evento.fecha_fin), "HH:mm", { locale: es })}
                </span>
              </div>
            )}
            {evento.ubicacion && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{evento.ubicacion}</span>
              </div>
            )}
          </div>

          {evento.creator && (
            <div className="text-xs text-muted-foreground">
              Creado por {evento.creator.name || 'Usuario'}
            </div>
          )}

          {canDelete && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(evento.id);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
