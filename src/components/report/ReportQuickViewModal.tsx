/**
 * Modal de vista rápida de reporte para usuarios sin permisos completos
 * Muestra detalles básicos, evidencia e historial
 */
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  MapPin,
  User,
  UserCheck,
  Image as ImageIcon,
  Clock,
  History,
  FolderOpen,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ReporteEvidencia } from '@/components/ui/ReporteEvidencia';
import { ReportHistorialTimeline, ReportAssignmentTimeline } from '@/components/report';
import { useReporteHistorial } from '@/hooks/entidades/useReporteHistorial';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { animationClasses } from '@/hooks/optimizacion';

interface ReportQuickViewModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-500 text-white',
  en_progreso: 'bg-blue-500 text-white',
  resuelto: 'bg-emerald-500 text-white',
  rechazado: 'bg-destructive text-destructive-foreground',
  cancelado: 'bg-muted text-muted-foreground',
};

const PRIORITY_LABELS: Record<string, string> = {
  bajo: 'Baja',
  medio: 'Media',
  alto: 'Alta',
  urgente: 'Urgente',
};

const PRIORITY_COLORS: Record<string, string> = {
  bajo: 'bg-emerald-500 text-white',
  medio: 'bg-amber-500 text-white',
  alto: 'bg-orange-500 text-white',
  urgente: 'bg-destructive text-destructive-foreground',
};

export function ReportQuickViewModal({ reportId, isOpen, onClose }: ReportQuickViewModalProps) {
  const [activeTab, setActiveTab] = useState<'detalles' | 'evidencia' | 'asignaciones' | 'resoluciones'>('detalles');

  // Fetch reporte básico directamente (bypass permisos ya que es vista básica)
  const { data: reporte, isLoading: isLoadingReporte } = useQuery({
    queryKey: ['reporte-quick-view', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      
      // Primera query: obtener reporte con categoría y tipo
      const { data: reporteData, error: reporteError } = await supabase
        .from('reportes')
        .select(`
          *,
          categories (id, nombre, color, icono),
          tipo_categories (id, nombre, color, icono)
        `)
        .eq('id', reportId)
        .single();
      
      if (reporteError) throw reporteError;
      
      // Segunda query: obtener perfiles separadamente
      let creadorProfile = null;
      let assignedProfile = null;
      
      if (reporteData.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .eq('id', reporteData.user_id)
          .single();
        creadorProfile = profile;
      }
      
      if (reporteData.assigned_to) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .eq('id', reporteData.assigned_to)
          .single();
        assignedProfile = profile;
      }
      
      return {
        ...reporteData,
        profiles: creadorProfile,
        assigned_profiles: assignedProfile,
      };
    },
    enabled: isOpen && !!reportId,
  });

  // Historial de asignaciones y resoluciones
  const { data: historialData = [], isLoading: isLoadingHistorial } = useReporteHistorial(reportId || '');

  // Separar asignaciones y resoluciones
  const historialForTimeline = useMemo(() => {
    return historialData.map((item) => ({
      ...item,
      tipo_accion: item.tipo_accion || 'asignacion',
      evidencias: item.evidencias || [],
      es_bulk: item.es_bulk || false,
    }));
  }, [historialData]);

  const asignaciones = useMemo(() => {
    return historialForTimeline.filter(
      (h) => h.tipo_accion === 'asignacion' || h.tipo_accion === 'reasignacion'
    );
  }, [historialForTimeline]);

  const resoluciones = useMemo(() => {
    return historialForTimeline.filter(
      (h) => h.tipo_accion === 'resolucion' || h.tipo_accion === 'rechazo' || h.tipo_accion === 'desactivacion'
    );
  }, [historialForTimeline]);

  // Extraer imágenes del reporte
  const imagenes = useMemo(() => {
    if (!reporte) return [];
    const imgs: string[] = [];
    
    // Desde el campo imagenes
    if (reporte.imagenes && Array.isArray(reporte.imagenes)) {
      imgs.push(...reporte.imagenes);
    }
    
    // Desde evidencias en historial
    historialForTimeline.forEach((h) => {
      if (h.evidencias && Array.isArray(h.evidencias)) {
        imgs.push(...h.evidencias);
      }
    });
    
    return [...new Set(imgs)]; // Eliminar duplicados
  }, [reporte, historialForTimeline]);

  // Extraer ubicación
  const ubicacion = useMemo(() => {
    if (!reporte?.location) return null;
    const loc = reporte.location as Record<string, unknown>;
    return {
      address: (loc.address || loc.direccion) as string | undefined,
      lat: (loc.lat || loc.latitude) as number | undefined,
      lng: (loc.lng || loc.longitude) as number | undefined,
    };
  }, [reporte]);

  const isLoading = isLoadingReporte || isLoadingHistorial;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-foreground line-clamp-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  reporte?.nombre || 'Detalles del Reporte'
                )}
              </DialogTitle>
              {reporte && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={cn('text-xs', STATUS_COLORS[reporte.status] || STATUS_COLORS.pendiente)}>
                    {STATUS_LABELS[reporte.status] || reporte.status}
                  </Badge>
                  <Badge className={cn('text-xs', PRIORITY_COLORS[reporte.priority] || PRIORITY_COLORS.medio)}>
                    {PRIORITY_LABELS[reporte.priority] || reporte.priority}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="detalles" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Detalles
              </TabsTrigger>
              <TabsTrigger value="evidencia" className="text-xs">
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Evidencia
                {imagenes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {imagenes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="asignaciones" className="text-xs">
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Asignaciones
                {asignaciones.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {asignaciones.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resoluciones" className="text-xs">
                <History className="h-3.5 w-3.5 mr-1" />
                Resoluciones
                {resoluciones.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {resoluciones.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <TabsContent value="detalles" className={cn('mt-0', animationClasses.fadeIn)}>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reporte ? (
                <div className="space-y-4">
                  {/* Descripción */}
                  {reporte.descripcion && (
                    <div className="flex gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Descripción</p>
                        <p className="text-sm text-foreground">{reporte.descripcion}</p>
                      </div>
                    </div>
                  )}

                  {/* Categoría */}
                  {reporte.categories && (
                    <div className="flex gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Categoría</p>
                        <p className="text-sm text-foreground font-medium">{(reporte.categories as { nombre: string }).nombre}</p>
                      </div>
                    </div>
                  )}

                  {/* Tipo */}
                  {reporte.tipo_categories && (
                    <div className="flex gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de Reporte</p>
                        <p className="text-sm text-foreground">{(reporte.tipo_categories as { nombre: string }).nombre}</p>
                      </div>
                    </div>
                  )}

                  {/* Creado por */}
                  <div className="flex gap-3">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Creado por</p>
                      <p className="text-sm text-foreground">{(reporte.profiles as { name: string | null })?.name || 'Desconocido'}</p>
                    </div>
                  </div>

                  {/* Asignado a */}
                  <div className="flex gap-3">
                    <UserCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Asignado a</p>
                      <p className="text-sm text-foreground">
                        {(reporte.assigned_profiles as { name: string | null })?.name || 'Sin asignación'}
                      </p>
                    </div>
                  </div>

                  {/* Ubicación */}
                  {ubicacion?.address && (
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ubicación</p>
                        <p className="text-sm text-foreground">{ubicacion.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Creado</p>
                      <p className="text-sm text-foreground">
                        {format(new Date(reporte.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Última actualización</p>
                      <p className="text-sm text-foreground">
                        {format(new Date(reporte.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No se pudo cargar el reporte</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evidencia" className={cn('mt-0', animationClasses.fadeIn)}>
              {imagenes.length > 0 ? (
                <ReporteEvidencia imagenes={imagenes} compact />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin evidencia fotográfica</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="asignaciones" className={cn('mt-0', animationClasses.fadeIn)}>
              {isLoadingHistorial ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : asignaciones.length > 0 ? (
                <div className="overflow-hidden">
                  <ReportAssignmentTimeline
                    historial={asignaciones}
                    maxHeight="280px"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin historial de asignaciones</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resoluciones" className={cn('mt-0', animationClasses.fadeIn)}>
              {isLoadingHistorial ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resoluciones.length > 0 ? (
                <div className="overflow-hidden">
                  <ReportHistorialTimeline
                    historial={resoluciones}
                    maxHeight="280px"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin historial de resoluciones</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para usar el modal de vista rápida de reporte
 */
export function useReportQuickViewModal() {
  const [state, setState] = useState<{
    isOpen: boolean;
    reportId: string | null;
  }>({
    isOpen: false,
    reportId: null,
  });

  const open = (reportId: string) => {
    setState({ isOpen: true, reportId });
  };

  const close = () => {
    setState({ isOpen: false, reportId: null });
  };

  const Modal = (
    <ReportQuickViewModal
      reportId={state.reportId}
      isOpen={state.isOpen}
      onClose={close}
    />
  );

  return {
    open,
    close,
    Modal,
    isOpen: state.isOpen,
  };
}
