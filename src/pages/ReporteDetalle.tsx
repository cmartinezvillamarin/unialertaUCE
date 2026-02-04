import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ReporteDetails } from '@/components/details';
import { ReportQuickViewModal } from '@/components/report';
import { useOptimizedReportes, ReporteWithDistance } from '@/hooks/entidades/useOptimizedReportes';
import { useEntityPermissions } from '@/hooks/controlador/useEntityPermissions';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

/**
 * Página de detalle de reporte
 * Si el usuario no tiene permiso ver_reportes, muestra un modal con vista básica
 */
export default function ReporteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reportes, isLoading } = useOptimizedReportes();
  const [showQuickView, setShowQuickView] = useState(false);

  // Buscar el reporte directamente sin useEffect
  const reporte = reportes.find((r) => r.id === id) || null;

  // Verificar permisos - pasamos el ownerId para que el dueño pueda ver su reporte
  const { canView, isReady, isOwner } = useEntityPermissions({ 
    entityKey: 'reportes',
    ownerId: reporte?.user_id 
  });

  // Si no tiene permiso y no es dueño, abrir modal de vista rápida
  useEffect(() => {
    if (isReady && id && !isLoading) {
      // Si el reporte no existe en la lista (posiblemente por RLS) y no tenemos datos
      // O si no tiene permiso de ver y no es dueño
      if ((!reporte && reportes.length >= 0) || (!canView && !isOwner)) {
        // Abrir modal de vista rápida
        setShowQuickView(true);
      }
    }
  }, [isReady, id, isLoading, reporte, canView, isOwner, reportes.length]);

  // Handler para cuando se cierra el modal
  const handleModalClose = () => {
    setShowQuickView(false);
    navigate(-1); // Volver a la página anterior
  };

  // Mostrar LoadingScreen mientras carga o mientras no se ha procesado
  if (isLoading || !isReady) {
    return <LoadingScreen message="Cargando detalles del reporte..." />;
  }

  // Si no tiene permisos completos, mostrar solo el modal
  if (!canView && !isOwner) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        {/* Modal de vista rápida para usuarios sin permisos */}
        <ReportQuickViewModal
          reportId={id || null}
          isOpen={showQuickView}
          onClose={handleModalClose}
        />
        {/* Fallback mientras se abre el modal */}
        {!showQuickView && (
          <LoadingScreen message="Cargando vista del reporte..." />
        )}
      </div>
    );
  }

  // Mostrar mensaje si no se encuentra (para usuarios con permiso)
  if (!reporte) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Reporte no encontrado</h2>
        <Button onClick={() => navigate('/reportes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Reportes
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <ReporteDetails key={reporte.id} reporte={reporte} />
    </div>
  );
}
