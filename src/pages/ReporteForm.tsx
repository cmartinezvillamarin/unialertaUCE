import type { ComponentProps } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ReportForm } from '@/components/report/ReportForm';
import { useOptimizedReportes } from '@/hooks/entidades/useOptimizedReportes';

type LocationState = {
  backTo?: string;
  prefill?: ComponentProps<typeof ReportForm>['initialDraft'];
};

export default function ReporteForm() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: reportes } = useOptimizedReportes();

  // Si hay ID, buscar el reporte para editar
  const reporte = id ? reportes.find((r) => r.id === id) : null;

  const state = (location.state || {}) as LocationState;
  const defaultBackRoute = id ? '/reportes' : (state.backTo || '/mis-reportes');

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="flex flex-col h-full">
        <ReportForm 
          reporte={reporte} 
          defaultBackRoute={defaultBackRoute}
          initialDraft={!id ? state.prefill : undefined}
        />
      </div>
    </div>
  );
}
