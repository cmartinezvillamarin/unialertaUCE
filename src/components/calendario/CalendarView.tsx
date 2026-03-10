import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Evento } from '@/hooks/entidades/useEventos';

interface CalendarViewProps {
  eventos: Evento[];
  onDateSelect: (date: Date) => void;
  onEventClick: (evento: Evento) => void;
  onCreateClick: () => void;
  selectedDate: Date;
  canCreate: boolean;
}

export function CalendarView({ eventos, onDateSelect, onEventClick, onCreateClick, selectedDate, canCreate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { locale: es });
    const end = endOfWeek(monthEnd, { locale: es });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventos.forEach(ev => {
      const key = format(new Date(ev.fecha_inicio), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [eventos]);

  const selectedDateEvents = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate[key] || [];
  }, [selectedDate, eventsByDate]);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[key] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    'relative flex flex-col items-center justify-start p-1.5 sm:p-2 rounded-lg min-h-[56px] sm:min-h-[72px] transition-colors',
                    !isCurrentMonth && 'opacity-30',
                    isSelected && 'bg-primary/10 ring-1 ring-primary',
                    isTodayDate && !isSelected && 'bg-accent/50',
                    isCurrentMonth && !isSelected && 'hover:bg-muted'
                  )}
                >
                  <span className={cn(
                    'text-xs sm:text-sm font-medium',
                    isSelected && 'text-primary font-bold',
                    isTodayDate && !isSelected && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: ev.color || 'hsl(var(--primary))' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground capitalize">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          {canCreate && (
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          )}
        </div>

        {selectedDateEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No hay eventos para esta fecha</p>
            </CardContent>
          </Card>
        ) : (
          selectedDateEvents.map(ev => (
            <Card
              key={ev.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
              style={{ borderLeftColor: ev.color || 'hsl(var(--primary))' }}
              onClick={() => onEventClick(ev)}
            >
              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium text-foreground text-sm">{ev.titulo}</h4>
                {ev.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{ev.descripcion}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ev.fecha_inicio), 'HH:mm')}
                    {ev.fecha_fin && ` - ${format(new Date(ev.fecha_fin), 'HH:mm')}`}
                  </span>
                  {ev.ubicacion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ev.ubicacion}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
