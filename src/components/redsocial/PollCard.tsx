import { useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart3, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Encuesta } from '@/hooks/entidades/useEncuestas';

interface PollCardProps {
  encuesta: Encuesta;
  onVote: (encuestaId: string, opcionId: string) => void;
  onRemoveVote: (encuestaId: string) => void;
}

export function PollCard({ encuesta, onVote, onRemoveVote }: PollCardProps) {
  const isClosed = encuesta.fecha_cierre ? isPast(new Date(encuesta.fecha_cierre)) : false;
  const showResults = encuesta.user_voted || isClosed;

  const maxVotes = useMemo(() => {
    return Math.max(...encuesta.opciones.map(o => o.votos_count || 0), 1);
  }, [encuesta.opciones]);

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{encuesta.pregunta}</CardTitle>
          </div>
          {isClosed ? (
            <Badge variant="secondary" className="text-xs shrink-0">Cerrada</Badge>
          ) : (
            <Badge className="bg-primary/10 text-primary text-xs shrink-0">Activa</Badge>
          )}
        </div>
        {encuesta.descripcion && (
          <p className="text-xs text-muted-foreground mt-1">{encuesta.descripcion}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {encuesta.opciones.map(opcion => {
          const percentage = encuesta.total_votos > 0
            ? Math.round(((opcion.votos_count || 0) / encuesta.total_votos) * 100)
            : 0;
          const isUserVote = encuesta.user_votes.includes(opcion.id);
          const isWinning = (opcion.votos_count || 0) === maxVotes && maxVotes > 0;

          if (showResults) {
            return (
              <div key={opcion.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    'flex items-center gap-1.5',
                    isUserVote && 'font-medium text-primary'
                  )}>
                    {isUserVote && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {opcion.texto}
                  </span>
                  <span className={cn(
                    'text-xs',
                    isWinning ? 'font-bold text-primary' : 'text-muted-foreground'
                  )}>
                    {percentage}% ({opcion.votos_count || 0})
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className="h-2"
                />
              </div>
            );
          }

          return (
            <Button
              key={opcion.id}
              variant="outline"
              className="w-full justify-start text-sm h-auto py-2.5"
              onClick={() => onVote(encuesta.id, opcion.id)}
              disabled={isClosed}
            >
              {opcion.texto}
            </Button>
          );
        })}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>{encuesta.total_votos} {encuesta.total_votos === 1 ? 'voto' : 'votos'}</span>
          <div className="flex items-center gap-2">
            {encuesta.user_voted && !isClosed && (
              <button
                onClick={() => onRemoveVote(encuesta.id)}
                className="text-destructive hover:underline"
              >
                Quitar voto
              </button>
            )}
            {encuesta.fecha_cierre && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isClosed ? 'Cerrada' : `Cierra ${format(new Date(encuesta.fecha_cierre), "d MMM", { locale: es })}`}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
