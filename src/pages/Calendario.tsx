import { useState } from 'react';
import { CalendarView, EventFormModal, EventDetailModal } from '@/components/calendario';
import { useEventos, Evento } from '@/hooks/entidades/useEventos';
import { useOptimizedUserRoles } from '@/hooks/entidades';

export default function Calendario() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

  const { eventos, isLoading, createEvento, deleteEvento } = useEventos();
  const { data: userRolesData } = useOptimizedUserRoles();

  const userRoles = userRolesData?.roles || [];
  const canCreate = userRoles.some((r: string) =>
    ['super_admin', 'administrador', 'seguridad_uce'].includes(r)
  );

  const handleCreate = (data: any) => {
    createEvento.mutate(data, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <CalendarView
          eventos={eventos}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onEventClick={setSelectedEvent}
          onCreateClick={() => setShowCreateModal(true)}
          canCreate={canCreate}
        />
      )}

      <EventFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={createEvento.isPending}
        defaultDate={selectedDate}
      />

      <EventDetailModal
        evento={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={(id) => deleteEvento.mutate(id)}
        canDelete={canCreate}
      />
    </div>
  );
}
